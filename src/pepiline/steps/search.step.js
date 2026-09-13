/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Pipeline — Search Step
 * ============================================================
 *
 * 📚 Step responsável por executar a busca nos providers.
 * 
 * Este step recebe uma query e parâmetros, chama o orchestrator
 * para buscar em todos os providers configurados, e retorna
 * os resultados brutos no contexto.
 * 
 * 📚 Entrada (context):
 * - query: string (termo de busca)
 * - params: Object (filtros: limit, yearStart, etc.)
 * - signal: AbortSignal (propagado para cancelamento de fetch)
 * 
 * 📚 Saída (context):
 * - rawResults: Array (resultados brutos dos providers)
 * - searchMeta: Object (metadados da busca)
 * 
 * 📚 Contrato com Orchestrator:
 * - planSearch(query, params, { signal })
 * - executeSearch(plan, query, params, { signal, useCache })
 * 
 * O signal faz parte da interface pública do orchestrator.
 * Mesmo que hoje planSearch seja síncrono, o signal prepara
 * para futuro I/O (cache remoto, métricas, configuração).
 * 
 * 📚 REGRA DE OURO:
 * O signal é propagado para TODAS as operações que podem fazer I/O:
 * planSearch → executeSearch → adapters → fetch.
 * Isso permite que o Pipeline Engine cancele requisições HTTP
 * quando o timeout for atingido.
 */

import { BaseStep } from "./base.step.js";

export class SearchStep extends BaseStep {
  /**
   * @param {Object} options - Configuração
   * @param {Orchestrator} options.orchestrator - Orquestrador de busca
   * @param {Object} [options.logger] - Logger
   */
  constructor(options = {}) {
    super({ name: "search" });

    if (!options.orchestrator) {
      throw new Error("SearchStep: orchestrator is required");
    }

    this.orchestrator = options.orchestrator;
    this.logger = options.logger || console;
  }

  /**
   * Executa a busca nos providers.
   * 
   * 📚 O signal é propagado para TODAS as operações de I/O.
   */
  async execute(context) {
    const { query, params = {} } = context;

    if (!query) {
      throw new Error("SearchStep: context.query is required");
    }

    this.logger.debug(`[SearchStep] Searching: "${query}"`);

    // Contrato: planSearch(query, params, { signal })
    const plan = await this.orchestrator.planSearch(
      query,
      params,
      { signal: context.signal }
    );

    this.logger.debug(`[SearchStep] Plan: ${plan.strategy}`, {
      providers: plan.providers?.map(p => p.id || p.name),
      timeout: plan.timeout,
    });

    // Contrato: executeSearch(plan, query, params, { signal, useCache })
    // O signal é propagado: Pipeline → SearchStep → Orchestrator → Adapters → fetch
    const result = await this.orchestrator.executeSearch(
      plan,
      query,
      params,
      {
        useCache: true,
        signal: context.signal,
      }
    );

    this.logger.info(`[SearchStep] Found ${result.results?.length || 0} results`);

    return {
      ...context,
      rawResults: result.results || [],
      searchMeta: {
        strategy: plan.strategy,
        providerCount: plan.providers?.length ?? 0,
        totalResults: result.total ?? 0,
        duration: result.duration ?? 0,
        fromCache: result.fromCache ?? false,
      },
    };
  }

  /**
   * SearchStep só executa se houver query.
   */
  canExecute(context) {
    return this.enabled && !!context.query;
  }
}

export default SearchStep;