/**
 * ============================================================
 * Core Contracts — Search Worker V4
 * ============================================================
 *
 * Este arquivo define os CONTRATOS PÚBLICOS dos módulos do core.
 *
 * ⚠️ NORMATIVO — PARTE DA ARQUITETURA CONGELADA
 *
 * Qualquer alteração em assinaturas, parâmetros, retornos ou responsabilidades
 * deve ser considerada uma mudança arquitetural e requer revisão do V4.
 *
 * Este é o SOURCE OF TRUTH para contratos.
 * Não manter documentação separada (contracts.md) para evitar divergência.
 * ============================================================
 */

// ============================================================
// 1. PLANNER CONTRACT
// ============================================================

/**
 * Planeja quais providers usar para uma busca.
 *
 * @param {Object} input
 * @param {string} input.query - Query de busca
 * @param {Object} input.params - Parâmetros de busca (limit, yearStart, etc.)
 * @param {Array} input.providers - Providers disponíveis (com health, capabilities)
 * @param {Object} input.config - Configuração do planner
 * @returns {Object} Plano
 * @returns {Array} returns.providers - Providers selecionados
 * @returns {Object} returns.scores - Score por provider
 * @returns {string} returns.strategy - "fast" | "balanced" | "deep" | "fallback"
 * @returns {number} returns.timeout - Timeout em ms
 * @returns {string} returns.reasoning - Justificativa do plano
 *
 * @example
 * const plan = planner.plan({
 *   query: "machine learning",
 *   params: { limit: 20 },
 *   providers: registry.getAvailable(),
 *   config: { maxProviders: 5 }
 * });
 */
export const PlannerContract = {
  plan: {
    params: { query: "string", params: "Object", providers: "Array", config: "Object" },
    returns: { providers: "Array", scores: "Object", strategy: "string", timeout: "number", reasoning: "string" },
  },
};

// ============================================================
// 2. REGISTRY CONTRACT
// ============================================================

/**
 * Gerencia providers e suas capacidades.
 */
export const RegistryContract = {
  register: {
    params: { provider: "Object" },
    returns: "Registry",
  },
  remove: {
    params: { id: "string" },
    returns: "Registry",
  },
  get: {
    params: { id: "string" },
    returns: "Provider|null",
  },
  list: {
    params: {},
    returns: "Array<Provider>",
  },
  getAvailable: {
    params: { threshold: "number (default: 50)" },
    returns: "Array<Provider>",
  },
  findByCapability: {
    params: { capability: "string" },
    returns: "Array<Provider>",
  },
  findAllCapabilities: {
    params: { capabilities: "Array<string>" },
    returns: "Array<Provider>",
  },
  updateHealth: {
    params: { id: "string", success: "boolean", latency: "number" },
    returns: "void",
  },
  getHealthStatus: {
    params: {},
    returns: "Object<id, { score, avgLatency, errors, successes, lastCheck }>",
  },
  getCapabilities: {
    params: { id: "string" },
    returns: "Array<string>",
  },
};

// ============================================================
// 3. RESOLVER CONTRACT
// ============================================================

/**
 * Resolve artigos (merge + deduplicação).
 */
export const ResolverContract = {
  resolve: {
    params: { results: "Array" },
    returns: "Promise<Array>",
  },
  deduplicate: {
    params: { articles: "Array" },
    returns: "Array",
  },
  mergeAll: {
    params: { groups: "Array" },
    returns: "Promise<Array>",
  },
  mergeArticles: {
    params: { existing: "Object", incoming: "Object" },
    returns: "Promise<Object>",
  },
};

// ============================================================
// 4. RANKER CONTRACT
// ============================================================

/**
 * Ranqueia artigos por relevância.
 */
export const RankerContract = {
  rank: {
    params: { articles: "Array", query: "string", limit: "number (default: 20)" },
    returns: "Promise<Array<{ ...article, score: number }>>",
  },
  calculateScores: {
    params: { article: "Object", query: "string" },
    returns: "Object<{ title, abstract, citations, openAccess, pdf, year, quality, confidence }>",
  },
};

// ============================================================
// 5. CACHE CONTRACT
// ============================================================

/**
 * Cache com KV + memória (LRU).
 */
export const CacheContract = {
  generateKey: {
    params: { type: "string", params: "Object" },
    returns: "string",
  },
  get: {
    params: { key: "string" },
    returns: "Promise<any|null>",
  },
  set: {
    params: { key: "string", data: "any", options: "Object { ttl }" },
    returns: "Promise<void>",
  },
  delete: {
    params: { key: "string" },
    returns: "Promise<void>",
  },
  clear: {
    params: {},
    returns: "Promise<void>",
  },
  getStats: {
    params: {},
    returns: "Promise<Object>",
  },
};

// ============================================================
// 6. ORCHESTRATOR CONTRACT
// ============================================================

/**
 * Facade operacional para busca de artigos.
 */
export const OrchestratorContract = {
  planSearch: {
    params: { query: "string", params: "Object" },
    returns: "Promise<Object>",
  },
  executeSearch: {
    params: { plan: "Object", query: "string", params: "Object", options: "Object { useCache }" },
    returns: "Promise<Object>",
  },
  executeDoiLookup: {
    params: { doi: "string", options: "Object { useCache }" },
    returns: "Promise<Object|null>",
  },
  registerProvider: {
    params: { provider: "Object" },
    returns: "void",
  },
  registerProviders: {
    params: { providers: "Array" },
    returns: "void",
  },
  getProviderHealth: {
    params: {},
    returns: "Object",
  },
  clearCache: {
    params: {},
    returns: "Promise<void>",
  },
  getCacheStats: {
    params: {},
    returns: "Promise<Object>",
  },
};

// ============================================================
// 7. PROVIDER CONTRACT
// ============================================================

/**
 * Interface que todo provider deve implementar.
 *
 * @property {string} id - Identificador único do provider
 * @property {string} name - Nome do provider
 * @property {Array<string>} capabilities - Capacidades (doi, pdf, open_access, etc.)
 * @property {number} health - Health score (0-100)
 * @property {number} avgLatency - Latência média
 */
export const ProviderContract = {
  search: {
    params: { query: "string", params: "Object" },
    returns: "Promise<{ articles: Array, total: number }>",
  },
  getByDOI: {
    params: { doi: "string" },
    returns: "Promise<Object|null>",
  },
  properties: {
    id: "string",
    name: "string",
    capabilities: "Array<string>",
    health: "number",
    avgLatency: "number",
  },
};

// ============================================================
// 8. EXPORT (para uso em validações/testes)
// ============================================================

/**
 * Todos os contratos consolidados.
 */
export const CONTRACTS = {
  Planner: PlannerContract,
  Registry: RegistryContract,
  Resolver: ResolverContract,
  Ranker: RankerContract,
  Cache: CacheContract,
  Orchestrator: OrchestratorContract,
  Provider: ProviderContract,
};

export default CONTRACTS;