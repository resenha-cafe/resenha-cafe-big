/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Engines — Quality Engine
 * ============================================================
 *
 * 📚 AULA: O que é o Quality Engine?
 * 
 * O Quality Engine avalia a qualidade intrínseca dos metadados
 * de um artigo, independente da fonte.
 * 
 * Enquanto o Confidence Engine avalia "quão confiável é este artigo?",
 * o Quality Engine avalia "quão completos são os metadados?".
 * 
 * 📚 Dimensões de qualidade:
 * 
 * - title: comprimento e presença
 * - abstract: comprimento e presença
 * - authors: quantidade e completude (ORCID)
 * - identifiers: DOI, ISSN
 * - dates: data de publicação
 * - journal: periódico com ISSN
 * 
 * feat(engines): add quality engine with dimensional scoring
 */

export class QualityEngine {
  /**
   * @param {Object} options - Configuração
   * @param {Object} [options.thresholds] - Limiares de qualidade
   * @param {Object} [options.logger] - Logger
   */
  constructor(options = {}) {
    this.thresholds = options.thresholds || {
      high: 0.8,
      medium: 0.5,
    };
    this.logger = options.logger || console;
  }

  /**
   * Avalia a qualidade de um artigo.
   * 
   * @param {Object} article - Artigo a avaliar
   * @returns {Object} { score, label, details }
   */
  evaluate(article) {
    if (!article) {
      return { score: 0, label: "low", details: {} };
    }

    const details = {
      title: this.#scoreTitle(article.title),
      abstract: this.#scoreAbstract(article.abstract),
      authors: this.#scoreAuthors(article),
      doi: this.#scoreDOI(article.doi),
      date: this.#scoreDate(article.publicationDate),
      language: this.#scoreLanguage(article.language),
      journal: this.#scoreJournal(article),
    };

    const scores = Object.values(details);
    const total = scores.reduce((sum, s) => sum + s, 0);
    const score = scores.length > 0
      ? Math.round((total / scores.length) * 100) / 100
      : 0;

    return {
      score,
      label: this.#getLabel(score),
      details,
    };
  }

  /**
   * Avalia a qualidade de múltiplos artigos.
   * 
   * @param {Array<Object>} articles - Lista de artigos
   * @returns {Array<Object>} Resultados com qualidade
   */
  evaluateBatch(articles = []) {
    return articles.map(article => ({
      article,
      quality: this.evaluate(article),
    }));
  }

  /**
   * Retorna apenas artigos com qualidade mínima.
   * 
   * @param {Array<Object>} articles - Lista de artigos
   * @param {string} [minLabel="low"] - Label mínimo
   * @returns {Array<Object>} Artigos filtrados
   */
  filterByQuality(articles = [], minLabel = "low") {
    const labelOrder = { high: 3, medium: 2, low: 1 };
    const minOrder = labelOrder[minLabel] || 0;

    return articles.filter(article => {
      const { label } = this.evaluate(article);
      return (labelOrder[label] || 0) >= minOrder;
    });
  }

  // ============================================================
  // PRIVADO
  // ============================================================

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
    const authors = article.authors || [];
    if (authors.length === 0) return 0;
    if (authors.length === 1) return 0.5;
    if (authors.some(a => a.hasOrcid || a.orcid)) return 1;
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
    const journal = article.journal;
    if (!journal) return 0;
    if (journal.hasIssn || journal.hasEissn || journal.issn || journal.eissn) return 1;
    if (journal.name) return 0.5;
    return 0;
  }

  #getLabel(score) {
    if (score >= this.thresholds.high) return "high";
    if (score >= this.thresholds.medium) return "medium";
    return "low";
  }
}

export default QualityEngine;