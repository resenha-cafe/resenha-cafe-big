/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Pipeline — Rank Step
 * ============================================================
 *
 * 📚 Step responsável por ranquear os artigos por relevância.
 * 
 * Usa o Ranker para ordenar os artigos com base na similaridade
 * com a query, citações, qualidade dos metadados e outros fatores.
 * 
 * 📚 Entrada (context):
 * - articles: Array<Article> (artigos mesclados)
 * - query: string (termo de busca original)
 * 
 * 📚 Saída (context):
 * - articles: Array<Article> (artigos ranqueados)
 * - rankMeta: Object (metadados do ranking)
 */

import { BaseStep } from "./base.step.js";

export class RankStep extends BaseStep {
  /**
   * @param {Object} options - Configuração
   * @param {Ranker} options.ranker - Motor de ranking
   * @param {Object} [options.logger] - Logger
   */
  constructor(options = {}) {
    super({ name: "rank" });

    if (!options.ranker) {
      throw new Error("RankStep: ranker is required");
    }

    this.ranker = options.ranker;
    this.logger = options.logger || console;
  }

  /**
   * Ranqueia os artigos por relevância.
   * 
   * 📚 O ranker retorna uma nova lista ordenada, com scores.
   * Artigos abaixo do score mínimo são removidos.
   */
  async execute(context) {
    const { articles = [], query } = context;

    if (articles.length === 0) {
      this.logger.debug("[RankStep] No articles to rank");
      return {
        ...context,
        rankMeta: {
          total: 0,
          ranked: 0,
          removed: 0,
        },
      };
    }

    const totalBefore = articles.length;

    // O ranker retorna artigos com score, já ordenados
    const ranked = await this.ranker.rank(
      articles,
      query || "",
      articles.length // sem limite — todos são ranqueados
    );

    // 📚 Defensivo: rank() pode retornar null/undefined
    const rankedArticles = ranked ?? [];
    const totalAfter = rankedArticles.length;
    const removed = totalBefore - totalAfter;

    this.logger.info(`[RankStep] Ranked ${totalAfter} articles (${removed} removed)`, {
      topScore: rankedArticles[0]?.score ?? 0,
      lowestScore: rankedArticles[rankedArticles.length - 1]?.score ?? 0,
    });

    return {
      ...context,
      articles: rankedArticles,
      rankMeta: {
        total: totalBefore,
        ranked: totalAfter,
        removed,
      },
    };
  }

  /**
   * RankStep só executa se houver articles.
   */
  canExecute(context) {
    return this.enabled && context.articles?.length > 0;
  }
}

export default RankStep;