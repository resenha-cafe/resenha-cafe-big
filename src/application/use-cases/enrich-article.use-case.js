/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Application — Enrich Article Use Case
 * ============================================================
 *
 * 📚 CONVENÇÃO: O campo de PDF é `pdfUrl` em todo o domínio.
 * - Article.pdfUrl: URL do PDF (não confundir com Article.url)
 * - Enrichers: campo "pdf" no plano → getter "pdfUrl" no Article
 * - Handlers: article.pdfUrl (não article.url para PDF)
 */

import { Article } from "../../domain/entities/article.js";

export class EnrichArticleUseCase {
  constructor({ enrichers = {}, eventPublisher, logger } = {}) {
    if (!eventPublisher) {
      throw new Error("EnrichArticleUseCase requires an eventPublisher");
    }

    this.enrichers = enrichers;
    this.eventPublisher = eventPublisher;
    this.logger = logger || console;
  }

  /**
   * 📚 Mapeamento canônico: nome do enricher → getter do Article.
   * 
   * Este mapa é a FONTE DA VERDADE para a convenção de nomes.
   * Se um enricher se chama "pdf", o campo correspondente no
   * Article é "pdfUrl". Qualquer mudança aqui deve ser refletida
   * em Article, handlers, mappers e validators.
   */
  static FIELD_MAP = Object.freeze({
    pdf: "pdfUrl",
    citations: "citations",
    abstract: "abstract",
    affiliations: "affiliations",
    references: "references",
  });

  async execute(article, options = {}) {
    // ============================================================
    // 1. NORMALIZA O ARTIGO
    // ============================================================
    const target = article instanceof Article
      ? article
      : Article.fromPlainObject(article);

    const {
      fields = null,
      publishEvents = true,
      force = false,
    } = options;

    const articleId = target.doi || target.title || target.identity?.key || "unknown";

    // ============================================================
    // 2. PLANEJA O ENRIQUECIMENTO
    // ============================================================
    const enrichmentPlan = this.#planEnrichment(target, fields, force);

    if (enrichmentPlan.length === 0) {
      this.logger.info("[EnrichArticleUseCase] Nothing to enrich", { articleId });

      return {
        article: target,
        enrichedFields: [],
        skippedFields: [],
        errors: [],
      };
    }

    this.logger.info("[EnrichArticleUseCase] Enrichment plan", {
      articleId,
      fields: enrichmentPlan.map(p => p.field),
    });

    // ============================================================
    // 3. EXECUTA OS ENRICHERS EM SEQUÊNCIA
    // ============================================================
    const enrichedFields = [];
    const skippedFields = [];
    const errors = [];
    let currentArticle = target;

    for (const plan of enrichmentPlan) {
      try {
        const enrichmentResult = await plan.enricher.enrich(currentArticle);

        if (this.#hasChanges(currentArticle, enrichmentResult, plan.field)) {
          currentArticle = this.#applyEnrichment(currentArticle, enrichmentResult);
          enrichedFields.push(plan.field);

          this.logger.info("[EnrichArticleUseCase] Field enriched", {
            articleId: currentArticle.doi || articleId,
            field: plan.field,
          });
        } else {
          skippedFields.push(plan.field);
        }
      } catch (error) {
        errors.push({ field: plan.field, error: error.message });

        this.logger.warn("[EnrichArticleUseCase] Enricher failed", {
          articleId,
          field: plan.field,
          error: error.message,
        });
      }
    }

    // ============================================================
    // 4. PUBLICA EVENTO
    // ============================================================
    if (publishEvents && enrichedFields.length > 0) {
      try {
        await this.eventPublisher.articleMetadataEnriched(
          currentArticle,
          enrichedFields
        );
      } catch (error) {
        this.logger.warn("[EnrichArticleUseCase] Event publish failed", {
          articleId,
          error: error.message,
        });
      }
    }

    // ============================================================
    // 5. RETORNA RESULTADO
    // ============================================================
    this.logger.info("[EnrichArticleUseCase] Enrichment completed", {
      articleId,
      enriched: enrichedFields,
      skipped: skippedFields,
      errors: errors.length,
    });

    return {
      article: currentArticle,
      enrichedFields,
      skippedFields,
      errors,
    };
  }

  canEnrich(article, field) {
    const enricher = this.enrichers[field];
    if (!enricher) return false;

    if (enricher.canEnrich) {
      return enricher.canEnrich(article);
    }

    return !this.#fieldExists(article, field);
  }

  getAvailableEnrichers() {
    return Object.keys(this.enrichers);
  }

  // ============================================================
  // MÉTODOS PRIVADOS
  // ============================================================

  #planEnrichment(article, requestedFields, force) {
    const plan = [];

    const enrichmentOrder = [
      { field: "citations", enricher: this.enrichers.citations },
      { field: "abstract", enricher: this.enrichers.abstract },
      { field: "affiliations", enricher: this.enrichers.affiliations },
      { field: "pdf", enricher: this.enrichers.pdf },
      { field: "references", enricher: this.enrichers.references },
    ];

    for (const { field, enricher } of enrichmentOrder) {
      if (!enricher) continue;
      if (requestedFields && !requestedFields.includes(field)) continue;
      if (!force && this.#fieldExists(article, field)) continue;
      if (enricher.canEnrich && !enricher.canEnrich(article)) continue;

      plan.push({ field, enricher });
    }

    return plan;
  }

  /**
   * Verifica se um campo já existe no artigo.
   * 
   * 📚 Usa FIELD_MAP para consistência com #extractFieldValue.
   * pdf → Article.pdfUrl, citations → Article.citations, etc.
   * 
   * @private
   */
  #fieldExists(article, field) {
    // 📚 Obtém o getter correspondente no Article
    const articleField = EnrichArticleUseCase.FIELD_MAP[field] || field;

    switch (field) {
      case "pdf":
        // 📚 UNIFICADO: pdfUrl é o campo canônico para PDF
        return !!article[articleField]; // article.pdfUrl
        
      case "citations":
        return article[articleField] > 0; // article.citations
        
      case "abstract":
        return !!(article[articleField] && article[articleField].length > 10);
        
      case "affiliations":
        return article.hasAuthors && article.authors.some(a => a.hasAffiliation);
        
      case "references":
        return article.hasReferences;
        
      default:
        return !!article[articleField];
    }
  }

  #hasChanges(original, result, field) {
    if (!result) return false;
    if (result === original) return false;

    const newValue = this.#extractFieldValue(result, field);
    const oldValue = this.#extractFieldValue(original, field);

    if (newValue === null || newValue === undefined) return false;
    if (newValue === oldValue) return false;

    if (typeof newValue === "string" && newValue.trim().length === 0) return false;
    if (typeof newValue === "number" && newValue === 0) return false;

    return true;
  }

  /**
   * Extrai o valor de um campo de um Article ou objeto.
   * 
   * 📚 Usa FIELD_MAP como fonte da verdade.
   * pdf → Article.pdfUrl, citations → Article.citations, etc.
   * 
   * @private
   */
  #extractFieldValue(source, field) {
    // 📚 Obtém o getter correspondente no Article
    const articleField = EnrichArticleUseCase.FIELD_MAP[field] || field;

    if (source instanceof Article) {
      return source[articleField];
    }

    if (typeof source === "object" && source !== null) {
      // 📚 Para objetos planos, usa o nome canônico (pdfUrl, não pdf)
      return source[articleField] || source[field];
    }

    return null;
  }

  #applyEnrichment(article, enrichmentResult) {
    if (enrichmentResult instanceof Article) {
      return article.with(enrichmentResult.toPlainObject());
    }

    if (typeof enrichmentResult === "object" && enrichmentResult !== null) {
      return article.with(enrichmentResult);
    }

    return article;
  }
}

export default EnrichArticleUseCase;