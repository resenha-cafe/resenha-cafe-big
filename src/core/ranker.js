/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Core — Ranker
 * ============================================================
 */

export class Ranker {
  constructor(options = {}) {
    this.weights = options.weights || {
      title: 0.30,
      abstract: 0.15,
      citations: 0.20,
      openAccess: 0.10,
      pdf: 0.05,
      year: 0.05,
      quality: 0.10,
      confidence: 0.05,
    };
    this.minScore = options.minScore || 0;
    this.defaultLimit = options.defaultLimit || 20;
  }

  async rank(articles, query, limit = this.defaultLimit) {
    if (!articles || articles.length === 0) return [];

    const normalizedQuery = this.sanitizeQuery(query);

    const ranked = articles
      .map(article => {
        const scores = this.calculateScores(article, normalizedQuery);
        const total = Object.values(scores).reduce((a, b) => a + b, 0);

        return {
          article,
          score: total,
          details: scores,
        };
      })
      .filter(item => item.score >= this.minScore)
      .sort((a, b) => b.score - a.score);

    return ranked.slice(0, limit).map(item => ({
      ...item.article,
      score: item.score,
    }));
  }

  calculateScores(article, query) {
    return {
      title: this.scoreTitle(article.title, query) * this.weights.title,
      abstract: this.scoreAbstract(article.abstract, query) * this.weights.abstract,
      citations: this.scoreCitations(article.citations) * this.weights.citations,
      openAccess: this.scoreOpenAccess(article.openAccess) * this.weights.openAccess,
      pdf: this.scorePDF(article.pdfUrl) * this.weights.pdf,
      year: this.scoreYear(article.year) * this.weights.year,
      quality: this.scoreQuality(article) * this.weights.quality,
      confidence: this.scoreConfidence(article.confidence) * this.weights.confidence,
    };
  }

  scoreTitle(title, query) {
  if (!title || !query) return 0;
  if (typeof title !== "string") return 0;
  const normalized = title.toLowerCase();
    const words = query.split(/\s+/).filter(w => w.length > 2);
    if (words.length === 0) return 1;
    if (normalized.includes(query)) return 1;
    let matches = 0;
    for (const word of words) {
      if (normalized.includes(word)) matches++;
    }
    return matches / words.length;
  }

  scoreAbstract(abstract, query) {
    if (!abstract || !query) return 0;
    const normalized = abstract.toLowerCase();
    const words = query.split(/\s+/).filter(w => w.length > 2);
    if (words.length === 0) return 1;
    if (normalized.includes(query)) return 1;
    let matches = 0;
    for (const word of words) {
      if (normalized.includes(word)) matches++;
    }
    return matches / words.length;
  }

  scoreCitations(citations) {
    if (citations == null || citations === 0) return 0;
    return Math.min(1, Math.log10(citations + 1) / 3);
  }

  scoreOpenAccess(openAccess) {
    return openAccess ? 1 : 0;
  }

  scorePDF(pdfUrl) {
    return pdfUrl ? 1 : 0;
  }

  scoreYear(year) {
    if (year == null) return 0.5;
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;
    if (age <= 0) return 1;
    if (age <= 5) return 0.9;
    if (age <= 10) return 0.7;
    if (age <= 20) return 0.5;
    return 0.3;
  }

  scoreQuality(article) {
    let score = 0;
    let total = 0;

    if (article.title && article.title.length > 10) { score++; }
    total++;

    if (article.abstract && article.abstract.length > 50) { score++; }
    total++;

    if (article.authors && article.authors.length > 0) { score++; }
    total++;

    if (article.doi) { score++; }
    total++;

    if (article.pdfUrl) { score++; }
    total++;

    return total > 0 ? score / total : 0.5;
  }

  /**
   * Calcula o score de confiança de forma defensiva.
   * 
   * Aceita tanto a escala 0-1 (Artigo) quanto 0-100 (providers externos),
   * normalizando automaticamente valores > 1.
   * 
   * Usa `== null` para detectar null/undefined sem confundir com 0,
   * já que 0 é um valor válido de confiança (confiança nula).
   * 
   * @param {number|null|undefined} confidence - Valor de confiança
   * @returns {number} Score entre 0 e 1
   */
  scoreConfidence(confidence) {
    // null ou undefined → valor neutro (0.5)
    if (confidence == null) return 0.5;

    // Escala 0-100 (providers externos, objetos intermediários)
    if (confidence > 1) return Math.min(1, confidence / 100);

    // Escala 0-1 (instâncias de Article do domínio)
    return Math.max(0, Math.min(1, confidence));
  }

  sanitizeQuery(query) {
    if (!query) return "";
    return query.trim().replace(/\s+/g, " ").normalize("NFKC");
  }
}

export default Ranker;