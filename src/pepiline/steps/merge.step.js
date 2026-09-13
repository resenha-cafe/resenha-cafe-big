/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Pipeline — Merge Step
 * ============================================================
 *
 * 📚 Step responsável por mesclar artigos duplicados.
 * 
 * Artigos de providers diferentes podem representar a mesma
 * publicação. Este step usa o MergeArticlesUseCase para
 * identificar e mesclar duplicatas, enriquecendo cada artigo
 * com os melhores dados de cada fonte.
 * 
 * 📚 Entrada (context):
 * - articles: Array<Article> (artigos validados)
 * 
 * 📚 Saída (context):
 * - articles: Array<Article> (artigos deduplicados e mesclados)
 * - mergeMeta: Object (metadados do merge)
 */

import { BaseStep } from "./base.step.js";

export class MergeStep extends BaseStep {
  /**
   * @param {Object} options - Configuração
   * @param {MergeArticlesUseCase} options.mergeUseCase - Caso de uso de merge
   * @param {Object} [options.logger] - Logger
   */
  constructor(options = {}) {
    super({ name: "merge" });

    if (!options.mergeUseCase) {
      throw new Error("MergeStep: mergeUseCase is required");
    }

    this.mergeUseCase = options.mergeUseCase;
    this.logger = options.logger || console;
  }

  /**
   * Mescla artigos duplicados.
   * 
   * 📚 Usa o MergeArticlesUseCase que internamente chama o Resolver.
   * O resultado é uma lista deduplicada com artigos enriquecidos.
   */
  async execute(context) {
    const { articles = [] } = context;

    if (articles.length === 0) {
      this.logger.debug("[MergeStep] No articles to merge");
      return {
        ...context,
        mergeMeta: {
          originalCount: 0,
          mergedCount: 0,
          duplicatesRemoved: 0,
          details: [],
        },
      };
    }

    const result = await this.mergeUseCase.execute({
      articles,
      options: {
        publishEvents: false, // Eventos são publicados no final do pipeline
      },
    });

    const originalCount = result.originalCount ?? articles.length;
    const mergedCount = result.mergedCount ?? result.articles?.length ?? 0;
    const duplicatesRemoved = result.duplicatesRemoved ?? 0;

    this.logger.info(`[MergeStep] Merged ${originalCount} → ${mergedCount} articles`, {
      duplicatesRemoved,
    });

    return {
      ...context,
      articles: result.articles,
      mergeMeta: {
        originalCount,
        mergedCount,
        duplicatesRemoved,
        details: result.mergeDetails ?? [],
      },
    };
  }

  /**
   * MergeStep só executa se houver articles.
   */
  canExecute(context) {
    return this.enabled && context.articles?.length > 0;
  }
}

export default MergeStep;