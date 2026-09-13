/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Pipeline — Adapt Step
 * ============================================================
 *
 * 📚 Step responsável por adaptar resultados brutos dos providers
 * para o formato do domínio (Article).
 * 
 * Este step recebe os resultados brutos (rawResults) do SearchStep
 * e usa o ArticleMapper para converter cada item em uma entidade
 * Article do domínio.
 * 
 * 📚 Entrada (context):
 * - rawResults: Array (resultados brutos dos providers)
 * 
 * 📚 Saída (context):
 * - articles: Array<Article> (artigos convertidos para o domínio)
 * - adaptMeta: Object (metadados da adaptação)
 * 
 * 📚 Por que um step separado?
 * 
 * 1. Separa a busca (I/O) da conversão (CPU)
 * 2. Permite testar a adaptação isoladamente
 * 3. Facilita adicionar novos providers sem mexer no pipeline
 */

import { BaseStep } from "./base.step.js";
import { ArticleMapper } from "../../application/mappers/article.mapper.js";

export class AdaptStep extends BaseStep {
  /**
   * @param {Object} options - Configuração
   * @param {Object} [options.mapper] - Mapper (default: ArticleMapper)
   * @param {Object} [options.logger] - Logger
   */
  constructor(options = {}) {
    super({ name: "adapt" });

    this.mapper = options.mapper || ArticleMapper;
    this.logger = options.logger || console;
  }

  /**
   * Converte resultados brutos em entidades Article.
   * 
   * 📚 Cada item de rawResults pode vir de um provider diferente.
   * O mapper detecta a origem (source) e aplica as regras específicas.
   */
  async execute(context) {
    const { rawResults = [] } = context;
    const totalRaw = rawResults?.length ?? 0;

    if (totalRaw === 0) {
      this.logger.debug("[AdaptStep] No raw results to adapt");
      return {
        ...context,
        articles: [],
        adaptMeta: {
          totalRaw: 0,
          totalAdapted: 0,
          errors: [],
        },
      };
    }

    const adapted = [];
    const errors = [];

    for (const raw of rawResults) {
      try {
        // O mapper detecta o provider pela propriedade source
        // Suporta tanto { article, provider } quanto o artigo direto
        const article = this.mapper.toDomain(
          raw.article || raw,
          raw.provider || raw.source
        );

        if (article && !article.isEmpty()) {
          adapted.push(article);
        }
      } catch (error) {
        errors.push({
          provider: raw.provider || raw.source || "unknown",
          title: raw.title || raw.article?.title || "unknown",
          error: error.message,
        });
      }
    }

    const totalAdapted = adapted.length;

    this.logger.info(`[AdaptStep] Adapted ${totalAdapted}/${totalRaw} articles`, {
      errors: errors.length,
    });

    return {
      ...context,
      articles: adapted,
      adaptMeta: {
        totalRaw,
        totalAdapted,
        errors,
      },
    };
  }

  /**
   * AdaptStep só executa se houver rawResults.
   */
  canExecute(context) {
    return this.enabled && context.rawResults?.length > 0;
  }
}

export default AdaptStep;