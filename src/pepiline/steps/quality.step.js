/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Pipeline — Quality Step
 * ============================================================
 *
 * 📚 Step responsável por avaliar a qualidade dos metadados.
 * 
 * Diferente do ConfidenceStep que avalia confiança na fonte,
 * o QualityStep avalia a qualidade intrínseca dos metadados:
 * - Campos preenchidos vs vazios
 * - Comprimento e formato dos campos
 * - Consistência entre campos relacionados
 * 
 * 📚 Entrada (context):
 * - articles: Array<Article> (artigos do pipeline)
 * 
 * 📚 Saída (context):
 * - articles: Array<Article> (artigos com quality score)
 * - qualityMeta: Object (metadados da qualidade)
 */

import { BaseStep } from "./base.step.js";

export class QualityStep extends BaseStep {
  /**
   * @param {Object} options - Configuração
   * @param {Object} [options.logger] - Logger
   */
  constructor(options = {}) {
    super({ name: "quality" });
    this.logger = options.logger || console;
  }

  /**
   * Avalia a qualidade dos metadados de cada artigo.
   */
  async execute(context) {
    const { articles = [] } = context;

    if (articles.length === 0) {
      this.logger.debug("[QualityStep] No articles to process");
      return {
        ...context,
        qualityMeta: {
          total: 0,
          averageQuality: 0,
          distribution: {},
        },
      };
    }

    const updated = articles.map(article => {
      const quality = this.#calculateQuality(article);
      return article.with({
        metadata: {
          ...article.metadata,
          qualityScore: quality.score,
          qualityLabel: quality.label,
        },
      });
    });

    const totalQuality = updated.reduce(
      (sum, a) => sum + (a.metadata?.qualityScore || 0), 0
    );
    const averageQuality = updated.length > 0
      ? Math.round((totalQuality / updated.length) * 100) / 100
      : 0;

    const distribution = this.#calculateDistribution(updated);

    this.logger.info(`[QualityStep] Average quality: ${averageQuality}`, {
      distribution,
    });

    return {
      ...context,
      articles: updated,
      qualityMeta: {
        total: updated.length,
        averageQuality,
        distribution,
      },
    };
  }

  // ============================================================
  // PRIVADO
  // ============================================================

  /**
   * Calcula a qualidade dos metadados de um artigo.
   * 
   * 📚 Critérios:
   * - Título: presente e com comprimento adequado
   * - Abstract: presente e com comprimento adequado
   * - Autores: presente e com nomes completos
   * - DOI: presente e formato válido
   * - Data: presente e formato válido
   * - Idioma: presente
   * - Periódico: presente com ISSN
   * 
   * @private
   */
  #calculateQuality(article) {
    const checks = {
      title: this.#scoreTitle(article.title),
      abstract: this.#scoreAbstract(article.abstract),
      authors: this.#scoreAuthors(article),
      doi: this.#scoreDOI(article.doi),
      date: this.#scoreDate(article.publicationDate),
      language: this.#scoreLanguage(article.language),
      journal: this.#scoreJournal(article),
    };

    const scores = Object.values(checks);
    const total = scores.reduce((sum, s) => sum + s, 0);
    const max = scores.length;

    return {
      score: Math.round((total / max) * 100) / 100,
      label: this.#getQualityLabel(total / max),
      details: checks,
    };
  }

  #scoreTitle(title) {
    if (!title) return 0;
    if (title.length < 10) return 0.3;
    if (title.length < 50) return 0.7;
    return 1;
  }

  #scoreAbstract(abstract) {
    if (!abstract) return 0;
    if (abstract.length < 50) return 0.3;
    if (abstract.length < 200) return 0.7;
    return 1;
  }

  #scoreAuthors(article) {
    if (!article.hasAuthors) return 0;
    if (article.authors.length === 1) return 0.5;
    if (article.authors.some(a => a.hasOrcid)) return 1;
    return 0.8;
  }

  #scoreDOI(doi) {
    if (!doi) return 0;
    return /^10\.\d{4,9}\//.test(doi) ? 1 : 0.5;
  }

  #scoreDate(date) {
    if (!date) return 0;
    return /^\d{4}(-\d{2}(-\d{2})?)?$/.test(date) ? 1 : 0.5;
  }

  #scoreLanguage(language) {
    return language ? 1 : 0;
  }

  #scoreJournal(article) {
    if (!article.hasJournal) return 0;
    if (article.journal.hasIssn || article.journal.hasEissn) return 1;
    return 0.5;
  }

  /**
   * Retorna o label de qualidade baseado no score.
   * @private
   */
  #getQualityLabel(score) {
    if (score >= 0.8) return "high";
    if (score >= 0.5) return "medium";
    return "low";
  }

  /**
   * Calcula a distribuição de qualidade.
   * @private
   */
  #calculateDistribution(articles) {
    const distribution = { high: 0, medium: 0, low: 0 };

    for (const article of articles) {
      const label = article.metadata?.qualityLabel || "low";
      distribution[label]++;
    }

    return distribution;
  }

  /**
   * QualityStep só executa se houver articles.
   */
  canExecute(context) {
    return this.enabled && context.articles?.length > 0;
  }
}

export default QualityStep;