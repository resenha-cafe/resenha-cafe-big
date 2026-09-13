/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Engines — Confidence Engine
 * ============================================================
 *
 * 📚 AULA: O que é o Confidence Engine?
 * 
 * O Confidence Engine calcula um score de confiança para um
 * artigo com base em múltiplos fatores ponderados.
 * 
 * Diferente do ConfidenceStep (que é um step do pipeline),
 * o Confidence Engine é um componente reutilizável que pode
 * ser chamado de qualquer lugar.
 * 
 * 📚 Fatores de confiança:
 * 
 * 1. Provider priority: quão confiável é a fonte?
 * 2. Metadata completeness: quantos campos estão preenchidos?
 * 3. Identifier strength: tem DOI? ORCID? ISSN?
 * 4. Cross-reference: quantos providers concordam?
 * 
 * feat(engines): add confidence engine with weighted scoring
 */

import { providersConfig } from "../../config/providers.config.js";

export class ConfidenceEngine {
  /**
   * @param {Object} options - Configuração
   * @param {Object} [options.weights] - Pesos dos fatores
   * @param {Object} [options.logger] - Logger
   */
  constructor(options = {}) {
    this.weights = options.weights || {
      provider: 0.30,
      completeness: 0.40,
      identifiers: 0.30,
    };
    this.logger = options.logger || console;
  }

  /**
   * Calcula a confiança de um artigo.
   * 
   * @param {Object} article - Artigo a avaliar
   * @param {Object} [context] - Contexto adicional
   * @returns {number} Score de confiança (0-1)
   */
  calculate(article, context = {}) {
    if (!article) return 0;

    const scores = {
      provider: this.#scoreProvider(article.source),
      completeness: this.#scoreCompleteness(article),
      identifiers: this.#scoreIdentifiers(article),
    };

    let total = 0;
    for (const [key, weight] of Object.entries(this.weights)) {
      total += (scores[key] || 0) * weight;
    }

    return Math.min(1, Math.max(0, Math.round(total * 100) / 100));
  }

  /**
   * Calcula a confiança de múltiplos artigos.
   * 
   * 📚 Usa article.with() para preservar a imutabilidade.
   * Retorna novas instâncias de Article com confidence atualizada.
   * 
   * @param {Array<Object>} articles - Lista de artigos
   * @returns {Array<Object>} Artigos com confidence atualizada
   */
  calculateBatch(articles = []) {
    return articles.map(article => {
      const confidence = this.calculate(article);
      
      // Se o artigo tem with() como função, usa para preservar imutabilidade
      if (typeof article.with === "function") {
        return article.with({ confidence });
      }
      
      // Fallback para objetos planos
      return { ...article, confidence };
    });
  }

  // ============================================================
  // PRIVADO
  // ============================================================

  /**
   * Score baseado na prioridade do provider.
   * @private
   */
  #scoreProvider(source) {
    if (!source) return 0;

    const key = String(source).toLowerCase();
    const config = providersConfig[key];
    if (!config) return 0.2;

    const priority = config.priority || 1;
    return priority / 5;
  }

  /**
   * Score baseado na completude dos metadados.
   * @private
   */
  #scoreCompleteness(article) {
    const checks = [
      !!article.title,
      !!article.abstract,
      article.hasAuthors || (article.authors?.length > 0),
      !!article.publicationDate,
      !!article.language,
      !!article.type,
      !!article.url,
      article.hasJournal || !!article.journal,
      article.hasPublisher || !!article.publisher,
      article.hasLicense || !!article.license,
    ];

    const passed = checks.filter(Boolean).length;
    return passed / checks.length;
  }

  /**
   * Score baseado em identificadores.
   * @private
   */
  #scoreIdentifiers(article) {
    let score = 0;

    if (article.doi) score += 0.4;
    if (article.hasPersistentIdentifiers || article.identifiers?.size > 0) score += 0.3;
    if (article.authors?.some(a => a.hasOrcid || a.orcid)) score += 0.2;
    if (article.hasReferences || article.references?.length > 0) score += 0.1;

    return Math.min(1, score);
  }
}

export default ConfidenceEngine;