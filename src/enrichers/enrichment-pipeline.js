/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Enrichers — Enrichment Pipeline
 * ============================================================
 *
 * 📚 AULA: O que é o Enrichment Pipeline?
 * 
 * O Enrichment Pipeline é o orquestrador dos enrichers.
 * Ele recebe uma lista de enrichers e os aplica em sequência
 * a um artigo ou a um lote de artigos.
 * 
 * 📚 Validação de contrato:
 * Cada enricher DEVE implementar canEnrich() e enrich().
 * Objetos inválidos são rejeitados no construtor e no addEnricher.
 * 
 * 📚 Política de retorno dos enrichers:
 * - article original: nada mudou (ou canEnrich retornou false)
 * - null: nada mudou
 * - Object (updates): aplica com article.with(updates)
 * - Outro article: substitui
 * 
 * 📚 Métricas:
 * - enrichersUsed: enrichers que foram ACIONADOS para processamento
 *   (canEnrich = true, independente de sucesso ou falha)
 * - enrichedFields: enrichers que MODIFICARAM algo (sucesso)
 * - errors: enrichers que FALHARAM
 * 
 * 📚 Parallel batch:
 * enrichBatch aceita opção { parallel: true } para processar
 * múltiplos artigos simultaneamente via Promise.all.
 * 
 * feat(enrichers): add enrichment pipeline with operational metrics
 */

export class EnrichmentPipeline {
  /**
   * @param {Object} options - Configuração
   * @param {Array<BaseEnricher>} options.enrichers - Lista de enrichers
   * @param {Object|null} [options.logger] - Logger (null = sem logging)
   */
  constructor(options = {}) {
    this.enrichers = [];
    this.logger = options.logger !== undefined ? options.logger : console;

    // Valida cada enricher individualmente
    for (const enricher of options.enrichers || []) {
      this.addEnricher(enricher);
    }
  }

  /**
   * Enriquece um único artigo.
   * 
   * 📚 Aplica todos os enrichers em sequência.
   * 
   * @param {Object} article - Artigo a enriquecer
   * @param {Object} [context] - Contexto adicional (signal)
   * @returns {Promise<Object>} Resultado
   * @returns {Object} returns.article - Artigo enriquecido
   * @returns {Array<string>} returns.enrichedFields - Enrichers que MODIFICARAM
   * @returns {Array<string>} returns.enrichersUsed - Enrichers que foram ACIONADOS
   * @returns {Array<Object>} returns.errors - Erros (não fatais)
   */
  async enrichOne(article, context = {}) {
    if (!article) return { article: null, enrichedFields: [], enrichersUsed: [], errors: [] };

    const enrichedFields = [];
    const enrichersUsed = [];
    const errors = [];
    let current = article;

    for (const enricher of this.enrichers) {
      // Gate: verifica canEnrich ANTES de chamar enrich()
      if (!enricher.canEnrich(current)) {
        continue;
      }

      const startedAt = Date.now();

      // 📚 Registrar que o enricher foi ACIONADO — antes do enrich()
      // Isso garante que mesmo se enrich() lançar exceção,
      // o enricher aparece como "usado" nas métricas operacionais.
      enrichersUsed.push(enricher.name);

      try {
        const result = await enricher.enrich(current, context);

        // Retornou o próprio artigo → nada mudou
        if (result === current) {
          continue;
        }

        // Retornou null → nada mudou
        if (result === null || result === undefined) {
          continue;
        }

        // Retornou um objeto de updates → aplica com with()
        if (
          typeof current.with === "function" &&
          result &&
          typeof result === "object" &&
          !this.#looksLikeArticle(result)
        ) {
          current = current.with(result);
        } else {
          // Retornou outro artigo → substitui
          current = result;
        }

        // Registrar que o enricher MODIFICOU algo
        enrichedFields.push(enricher.name);
      } catch (error) {
        errors.push({
          enricher: enricher.name,
          error: error?.message || String(error),
          duration: Date.now() - startedAt,
        });

        this.logger?.warn?.("[EnrichmentPipeline] Enricher failed", {
          enricher: enricher.name,
          error: error?.message || String(error),
        });
      }
    }

    return {
      article: current,
      enrichedFields,
      enrichersUsed,
      errors,
    };
  }

  /**
   * Enriquece um lote de artigos.
   * 
   * 📚 Processa cada artigo individualmente (fail-soft por artigo).
   * 
   * @param {Array<Object>} articles - Lista de artigos
   * @param {Object} [context] - Contexto adicional
   * @param {Object} [options] - Opções
   * @param {boolean} [options.parallel=false] - Processar em paralelo
   * @returns {Promise<Object>} Resultado do lote
   */
  async enrichBatch(articles = [], context = {}, { parallel = false } = {}) {
    if (articles.length === 0) {
      return { articles: [], total: 0, enriched: 0, errors: [] };
    }

    // Modo paralelo: processa todos simultaneamente
    if (parallel) {
      const results = await Promise.all(
        articles.map(article => this.enrichOne(article, context))
      );

      const enrichedArticles = [];
      const errors = [];
      let enrichedCount = 0;

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        enrichedArticles.push(result.article);

        if (result.enrichedFields.length > 0) {
          enrichedCount++;
        }

        if (result.errors.length > 0) {
          errors.push({
            doi: articles[i]?.doi,
            title: articles[i]?.title,
            errors: result.errors,
          });
        }
      }

      this.logger?.info?.("[EnrichmentPipeline] Batch completed (parallel)", {
        total: articles.length,
        enriched: enrichedCount,
        errors: errors.length,
      });

      return {
        articles: enrichedArticles,
        total: articles.length,
        enriched: enrichedCount,
        errors,
      };
    }

    // Modo sequencial: processa um a um
    const enrichedArticles = [];
    const errors = [];
    let enrichedCount = 0;

    for (const article of articles) {
      const result = await this.enrichOne(article, context);

      enrichedArticles.push(result.article);

      if (result.enrichedFields.length > 0) {
        enrichedCount++;
      }

      if (result.errors.length > 0) {
        errors.push({
          doi: article.doi,
          title: article.title,
          errors: result.errors,
        });
      }
    }

    this.logger?.info?.("[EnrichmentPipeline] Batch completed", {
      total: articles.length,
      enriched: enrichedCount,
      errors: errors.length,
    });

    return {
      articles: enrichedArticles,
      total: articles.length,
      enriched: enrichedCount,
      errors,
    };
  }

  /**
   * Adiciona um enricher ao pipeline.
   * 
   * 📚 Valida o contrato: enricher deve ter canEnrich() e enrich().
   * 
   * @param {BaseEnricher} enricher - Enricher a adicionar
   * @returns {EnrichmentPipeline} this (fluent API)
   * @throws {TypeError} Se enricher não implementar o contrato
   */
  addEnricher(enricher) {
    if (
      !enricher ||
      typeof enricher.enrich !== "function" ||
      typeof enricher.canEnrich !== "function"
    ) {
      throw new TypeError(
        "EnrichmentPipeline: enricher must implement canEnrich() and enrich()"
      );
    }

    this.enrichers.push(enricher);
    return this;
  }

  /**
   * Remove um enricher pelo nome.
   * 
   * @param {string} name - Nome do enricher
   * @returns {EnrichmentPipeline} this
   */
  removeEnricher(name) {
    this.enrichers = this.enrichers.filter(e => e.name !== name);
    return this;
  }

  /**
   * Lista os nomes dos enrichers atuais.
   * 
   * @returns {Array<string>}
   */
  getEnricherNames() {
    return this.enrichers.map(e => e.name);
  }

  // ============================================================
  // PRIVADO
  // ============================================================

  /**
   * Verifica se um objeto "parece" um artigo completo.
   * 
   * 📚 Heurística simples: se tem title, doi ou article,
   * provavelmente é um artigo completo, não um objeto de updates.
   * 
   * @param {Object} value - Valor a verificar
   * @returns {boolean}
   * @private
   */
  #looksLikeArticle(value) {
    return (
      typeof value === "object" &&
      ("title" in value || "doi" in value || "article" in value)
    );
  }
}

export default EnrichmentPipeline;