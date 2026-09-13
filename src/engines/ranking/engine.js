/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Engines — Ranking Engine
 * ============================================================
 *
 * 📚 AULA: O que é o Ranking Engine?
 * 
 * O Ranking Engine ordena artigos por relevância para uma query.
 * Ele calcula scores ponderados para cada artigo e os ordena
 * do mais relevante para o menos relevante.
 * 
 * 📚 Dimensões de ranking:
 * 
 * - title: match da query no título (30%)
 * - abstract: match da query no resumo (15%)
 * - citations: número de citações (20%)
 * - openAccess: artigo é acesso aberto (10%)
 * - pdf: artigo tem PDF disponível (5%)
 * - year: quão recente é o artigo (5%)
 * - quality: qualidade dos metadados (10%)
 * - confidence: confiança do provider (5%)
 * 
 * 📚 Desempate (3 níveis, 100% determinístico):
 * 1. Score (maior primeiro)
 * 2. Citações (mais citado primeiro)
 * 3. Título (localeCompare com locale fixo "pt-BR" e sensibilidade "base")
 * 
 * feat(engines): add ranking engine with deterministic 3-level tiebreaker
 */

import { rankingConfig } from "../../config/ranking.config.js";

export class RankingEngine {
  /**
   * @param {Object} options - Configuração
   * @param {Object} [options.config] - Configuração de ranking
   * @param {Object} [options.logger] - Logger
   */
  constructor(options = {}) {
    this.config = options.config || rankingConfig;
    this.logger = options.logger || console;
  }

  /**
   * Ranqueia artigos por relevância.
   * 
   * 📚 Usa article.with() para preservar a imutabilidade.
   * 
   * @param {Array<Object>} articles - Artigos a ranquear
   * @param {string} query - Query de busca
   * @param {number} [limit] - Limite de resultados (0 = sem resultados)
   * @returns {Array<Object>} Artigos ranqueados com score
   */
  rank(articles = [], query = "", limit) {
    if (!articles || articles.length === 0) return [];

    const normalizedQuery = this.#sanitizeQuery(query);
    const weights = this.config.weights || {};

    const scored = articles.map(article => {
      const scores = this.#calculateScores(article, normalizedQuery, weights);
      const score = Math.round(
        Object.values(scores).reduce((sum, s) => sum + s, 0) * 100
      ) / 100;

      // Preserva imutabilidade se for Article
      if (typeof article.with === "function") {
        return article.with({
          score,
          scoreDetails: scores,
        });
      }

      // Fallback para objetos planos
      return {
        ...article,
        score,
        scoreDetails: scores,
      };
    });

    // Ordena por score (maior primeiro), com desempate por citações e título
    scored.sort((a, b) => {
      // 1. Score
      if (b.score !== a.score) return b.score - a.score;

      // 2. Citações
      const citationDiff = (b.citations || 0) - (a.citations || 0);
      if (citationDiff !== 0) return citationDiff;

      // 3. Título (ordem alfabética com locale fixo e sensibilidade "base")
      //    "Cafe" e "Café" são tratados como equivalentes
      //    Locale "pt-BR" garante comportamento consistente entre ambientes
      return (a.title || "").localeCompare(
        b.title || "",
        "pt-BR",
        { sensitivity: "base" }
      );
    });

    // Aplica score mínimo (0 é valor válido)
    const minScore = this.config.minScore ?? 0;
    const filtered = scored.filter(item => item.score >= minScore);

    // Aplica limite (0 = sem resultados, undefined = todos)
    const resultLimit = limit ?? filtered.length;
    return filtered.slice(0, resultLimit);
  }

  // ============================================================
  // PRIVADO
  // ============================================================

  /**
   * Calcula scores para todas as dimensões.
   * @private
   */
  #calculateScores(article, query, weights) {
    const scores = {};

    if (weights.title) {
      scores.title = this.#scoreTitle(article.title, query) * weights.title;
    }
    if (weights.abstract) {
      scores.abstract = this.#scoreAbstract(article.abstract, query) * weights.abstract;
    }
    if (weights.citations) {
      scores.citations = this.#scoreCitations(article.citations) * weights.citations;
    }
    if (weights.openAccess) {
      scores.openAccess = this.#scoreOpenAccess(article.openAccess) * weights.openAccess;
    }
    if (weights.pdf) {
      scores.pdf = this.#scorePDF(article.url || article.pdfUrl) * weights.pdf;
    }
    if (weights.year) {
      scores.year = this.#scoreYear(article.year || article.publicationDate) * weights.year;
    }
    if (weights.quality) {
      scores.quality = this.#scoreQuality(article) * weights.quality;
    }
    if (weights.confidence) {
      scores.confidence = this.#scoreConfidenceValue(article.confidence) * weights.confidence;
    }

    return scores;
  }

  /**
   * Score de match no título.
   * 
   * 📚 Aplica NFKC para normalização Unicode consistente com a query.
   */
  #scoreTitle(title, query) {
    if (!title || !query) return 0;
    const normalized = title.normalize("NFKC").toLowerCase();
    const words = query.split(/\s+/).filter(w => w.length > 2);
    if (words.length === 0) return 1;
    if (normalized.includes(query)) return 1;

    let matches = 0;
    for (const word of words) {
      if (normalized.includes(word)) matches++;
    }
    return matches / words.length;
  }

  /**
   * Score de match no abstract.
   * 
   * 📚 Aplica NFKC para normalização Unicode consistente com a query.
   */
  #scoreAbstract(abstract, query) {
    if (!abstract || !query) return 0;
    const normalized = abstract.normalize("NFKC").toLowerCase();
    const words = query.split(/\s+/).filter(w => w.length > 2);
    if (words.length === 0) return 1;
    if (normalized.includes(query)) return 1;

    let matches = 0;
    for (const word of words) {
      if (normalized.includes(word)) matches++;
    }
    return matches / words.length;
  }

  /**
   * Score de citações (escala logarítmica).
   */
  #scoreCitations(citations) {
    if (!citations || citations === 0) return 0;
    return Math.min(1, Math.log10(citations + 1) / 3);
  }

  /**
   * Score de acesso aberto.
   */
  #scoreOpenAccess(openAccess) {
    return openAccess ? 1 : 0;
  }

  /**
   * Score de PDF disponível.
   */
  #scorePDF(pdfUrl) {
    return pdfUrl ? 1 : 0;
  }

  /**
   * Score de recência (decaimento por idade).
   */
  #scoreYear(year) {
    if (!year) return 0.5;

    // Extrai ano se for data completa
    if (typeof year === "string" && year.length > 4) {
      const parsed = new Date(year).getFullYear();
      if (!isNaN(parsed)) year = parsed;
    }

    if (typeof year !== "number") return 0.5;

    const currentYear = new Date().getFullYear();
    const age = currentYear - year;

    if (age <= 0) return 1;
    if (age <= 1) return 1;
    if (age <= 5) return 0.9;
    if (age <= 10) return 0.7;
    if (age <= 20) return 0.5;
    return 0.3;
  }

  /**
   * Score de qualidade dos metadados.
   */
  #scoreQuality(article) {
    let score = 0;
    let total = 0;

    if (article.title && article.title.length > 10) score++;
    total++;

    if (article.abstract && article.abstract.length > 50) score++;
    total++;

    if (article.authors && article.authors.length > 0) score++;
    total++;

    if (article.doi) score++;
    total++;

    if (article.url || article.pdfUrl) score++;
    total++;

    return total > 0 ? score / total : 0.5;
  }

  /**
   * Score de confiança do provider.
   * 
   * 📚 Defensivo: aceita escala 0-1 e 0-100.
   */
  #scoreConfidenceValue(confidence) {
    if (confidence == null) return 0.5;
    if (confidence > 1) return Math.min(1, confidence / 100);
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Sanitiza a query para comparação.
   */
  #sanitizeQuery(query) {
    if (!query) return "";
    return query.trim().replace(/\s+/g, " ").normalize("NFKC");
  }
}

export default RankingEngine;