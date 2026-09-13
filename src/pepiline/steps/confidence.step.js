/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Pipeline — Confidence Step
 * ============================================================
 *
 * 📚 Step responsável por calcular a confiança de cada artigo.
 * 
 * A confiança é uma métrica que indica o quão confiável é um
 * artigo com base na fonte (provider), completude dos metadados
 * e consenso entre múltiplos providers.
 * 
 * 📚 Entrada (context):
 * - articles: Array<Article> (artigos do pipeline)
 * 
 * 📚 Saída (context):
 * - articles: Array<Article> (artigos com confidence atualizada)
 * - confidenceMeta: Object (metadados da confiança)
 * 
 * 📚 Fatores que influenciam a confiança:
 * 
 * 1. Fonte (provider priority): OpenAlex > Semantic Scholar > CrossRef
 * 2. Completude: tem título? tem autores? tem abstract?
 * 3. Consenso: quantos providers concordam?
 * 4. Identificadores: tem DOI? tem ORCID?
 */

import { BaseStep } from "./base.step.js";
import { providersConfig } from "../../config/providers.config.js";

export class ConfidenceStep extends BaseStep {
  /**
   * @param {Object} options - Configuração
   * @param {Object} [options.logger] - Logger
   */
  constructor(options = {}) {
    super({ name: "confidence" });
    this.logger = options.logger || console;
  }

  /**
   * Calcula a confiança de cada artigo.
   * 
   * 📚 A confiança é normalizada para 0-1.
   * Artigos sem source recebem confiança mínima.
   */
  async execute(context) {
    const { articles = [] } = context;

    if (articles.length === 0) {
      this.logger.debug("[ConfidenceStep] No articles to process");
      return {
        ...context,
        confidenceMeta: {
          total: 0,
          averageConfidence: 0,
        },
      };
    }

    const updated = articles.map(article => {
      const confidence = this.#calculateConfidence(article);
      return article.with({ confidence });
    });

    const totalConfidence = updated.reduce((sum, a) => sum + (a.confidence || 0), 0);
    const averageConfidence = updated.length > 0
      ? Math.round((totalConfidence / updated.length) * 100) / 100
      : 0;

    this.logger.info(`[ConfidenceStep] Average confidence: ${averageConfidence}`);

    return {
      ...context,
      articles: updated,
      confidenceMeta: {
        total: updated.length,
        averageConfidence,
      },
    };
  }

  // ============================================================
  // PRIVADO
  // ============================================================

  /**
   * Calcula a confiança de um artigo.
   * 
   * 📚 Fatores com pesos fixos (soma = 1.0):
   * - Prioridade do provider (30%)
   * - Completude dos metadados (40%)
   * - Presença de identificadores (30%)
   * 
   * @private
   */
  #calculateConfidence(article) {
    // 1. Prioridade do provider (peso 30%)
    const providerPriority = this.#getProviderPriority(article.source);

    // 2. Completude dos metadados (peso 40%)
    const completeness = this.#calculateCompleteness(article);

    // 3. Presença de identificadores (peso 30%)
    const identifierScore = this.#calculateIdentifierScore(article);

    // Pesos fixos — soma = 1.0
    const score = (providerPriority * 0.30) + (completeness * 0.40) + (identifierScore * 0.30);

    return Math.min(1, Math.max(0, score));
  }

  /**
   * Obtém a prioridade do provider (0-1).
   * @private
   */
  #getProviderPriority(source) {
    if (!source) return 0;

    const key = String(source).toLowerCase();
    const config = providersConfig[key];
    if (!config) return 0.2; // Provider desconhecido

    // Normaliza a prioridade (1-5) para 0-1
    const priority = config.priority || 1;
    return priority / 5;
  }

  /**
   * Calcula a completude dos metadados (0-1).
   * @private
   */
  #calculateCompleteness(article) {
    const checks = [
      !!article.title,
      !!article.abstract,
      article.hasAuthors,
      !!article.publicationDate,
      !!article.language,
      !!article.type,
      !!article.url,
      article.hasJournal,
      article.hasPublisher,
      article.hasLicense,
    ];

    const passed = checks.filter(Boolean).length;
    return passed / checks.length;
  }

  /**
   * Calcula o score de identificadores (0-1).
   * @private
   */
  #calculateIdentifierScore(article) {
    let score = 0;

    if (article.doi) score += 0.4;
    if (article.hasPersistentIdentifiers) score += 0.3;
    if (article.authors.some(a => a.hasOrcid)) score += 0.2;
    if (article.hasReferences) score += 0.1;

    return Math.min(1, score);
  }

  /**
   * ConfidenceStep só executa se houver articles.
   */
  canExecute(context) {
    return this.enabled && context.articles?.length > 0;
  }
}

export default ConfidenceStep;