/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Pipeline — Enrich Step
 * ============================================================
 *
 * 📚 Step responsável por enriquecer os artigos com dados adicionais.
 * 
 * Usa o EnrichArticleUseCase para buscar informações complementares
 * que não vieram na busca inicial: PDF, citações atualizadas,
 * afiliações de autores, etc.
 * 
 * 📚 Entrada (context):
 * - articles: Array<Article> (artigos ranqueados)
 * 
 * 📚 Saída (context):
 * - articles: Array<Article> (artigos enriquecidos)
 * - enrichMeta: Object (metadados do enriquecimento)
 * 
 * 📚 Execução condicional:
 * Por padrão, enriquece apenas os top N artigos (default: 10).
 * Enriquecer todos pode ser caro e lento.
 */

import { BaseStep } from "./base.step.js";

export class EnrichStep extends BaseStep {
  /**
   * @param {Object} options - Configuração
   * @param {EnrichArticleUseCase} options.enrichUseCase - Caso de uso de enriquecimento
   * @param {number} [options.topN=10] - Quantos artigos enriquecer (0 = todos)
   * @param {Object} [options.logger] - Logger
   */
  constructor(options = {}) {
    super({ name: "enrich" });

    if (!options.enrichUseCase) {
      throw new Error("EnrichStep: enrichUseCase is required");
    }

    this.enrichUseCase = options.enrichUseCase;
    this.topN = options.topN ?? 10;
    this.logger = options.logger || console;
  }

  /**
   * Enriquece os artigos com dados complementares.
   * 
   * 📚 Por padrão, enriquece apenas os top 10 artigos.
   * Isso evita chamadas desnecessárias a APIs externas
   * para artigos que o usuário provavelmente não verá.
   */
  async execute(context) {
    const { articles = [] } = context;

    if (articles.length === 0) {
      this.logger.debug("[EnrichStep] No articles to enrich");
      return {
        ...context,
        enrichMeta: {
          total: 0,
          enriched: 0,
          fields: [],
          errors: [],
        },
      };
    }

    // Seleciona quais artigos enriquecer
    const toEnrich = this.topN > 0 ? articles.slice(0, this.topN) : articles;
    const enriched = [];
    const allFields = new Set();
    const allErrors = [];
    let enrichedCount = 0;

    for (const article of toEnrich) {
      try {
        const result = await this.enrichUseCase.execute(article, {
          publishEvents: false,
        });

        // 📚 Defensivo: se o use case retornar sem article, mantém o original
        enriched.push(result.article ?? article);

        // 📚 Defensivo: protege contra retornos parciais do use case
        const fields = result.enrichedFields ?? [];
        const errors = result.errors ?? [];

        // 📚 Semanticamente preciso: conta artigos que realmente
        // tiveram campos enriquecidos
        if (fields.length > 0) {
          enrichedCount++;
        }
        
        for (const field of fields) {
          allFields.add(field);
        }
        
        if (errors.length > 0) {
          allErrors.push({
            doi: article.doi,
            title: article.title,
            errors,
          });
        }
      } catch (error) {
        allErrors.push({
          doi: article.doi,
          title: article.title,
          errors: [{ error: error.message }],
        });
        
        // Em caso de erro, mantém o artigo original
        enriched.push(article);
      }
    }

    // Artigos não enriquecidos permanecem como estão
    const rest = this.topN > 0 ? articles.slice(this.topN) : [];
    const allArticles = [...enriched, ...rest];

    this.logger.info(`[EnrichStep] Enriched ${enrichedCount}/${toEnrich.length} articles`, {
      fields: [...allFields],
      errors: allErrors.length,
    });

    return {
      ...context,
      articles: allArticles,
      enrichMeta: {
        total: articles.length,
        enriched: enrichedCount,
        fields: [...allFields],
        errors: allErrors,
      },
    };
  }

  /**
   * EnrichStep só executa se houver articles e enrichUseCase.
   */
  canExecute(context) {
    return this.enabled && context.articles?.length > 0;
  }
}

export default EnrichStep;