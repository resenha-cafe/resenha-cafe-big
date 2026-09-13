/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Core — Planner (Funcional)
 * ============================================================
 */

export class Planner {
  constructor(options = {}) {
    this.config = {
      maxProviders: options.maxProviders || 5,
      minHealthScore: options.minHealthScore || 50,
      priorities: options.priorities || {
        openalex: 5,
        semantic: 4,
        crossref: 3,
        europepmc: 3,
        scielo: 2,
        core: 2,
      },
    };
  }

  /**
   * Planeja uma busca (função pura)
   * @param {Object} input - Entrada
   * @param {string} input.query - Query
   * @param {Object} input.params - Parâmetros
   * @param {Array} input.providers - Providers disponíveis
   * @param {Object} input.config - Configuração
   * @returns {Object} Plano
   */
  plan({ query, params = {}, providers = [], config = this.config }) {
    if (providers.length === 0) {
      return this.emptyPlan();
    }

    const analysis = this.analyzeQuery(query, params);
    const scored = providers.map(provider => ({
      provider,
      score: this.scoreProvider(provider, analysis, params, config),
    }));

    scored.sort((a, b) => b.score - a.score);
    const selected = scored.slice(0, config.maxProviders);
    const strategy = this.defineStrategy(query, params);

    return {
      providers: selected.map(s => s.provider),
      scores: Object.fromEntries(selected.map(s => [s.provider.id, s.score])),
      strategy,
      timeout: this.getTimeout(strategy),
      reasoning: `Selected ${selected.length} providers (best score: ${selected[0]?.score || 0})`,
    };
  }

  emptyPlan() {
    return {
      providers: [],
      scores: {},
      strategy: "fallback",
      timeout: 30000,
      reasoning: "No providers available",
    };
  }

  analyzeQuery(query, params = {}) {
    return {
      length: query.length,
      words: query.split(/\s+/).length,
      hasDOI: /^10\.\d{4,9}\//.test(query.trim()),
      hasURL: query.startsWith("http") || query.includes(".org/"),
      language: params.language || "auto",
      openAccess: params.openAccess || false,
      hasYearRange: params.yearStart || params.yearEnd,
    };
  }

  scoreProvider(provider, analysis, params = {}, config) {
    let score = provider.health || 70;

    const priority = config.priorities[provider.id] || 1;
    score += priority * 3;

    const caps = provider.capabilities || [];

    if (analysis.hasDOI && caps.includes("doi")) score += 10;
    if (analysis.openAccess && caps.includes("open_access")) score += 10;
    if (analysis.language === "pt" && caps.includes("portuguese")) score += 15;
    if (analysis.hasYearRange && caps.includes("year")) score += 5;
    if (analysis.words > 5 && caps.includes("abstract")) score += 5;
    if (analysis.words > 10 && caps.includes("citations")) score += 5;

    const avgLatency = provider.avgLatency || 0;
    if (avgLatency > 2000) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  defineStrategy(query, params = {}) {
    if (query.length < 3) return "fast";
    if (params.openAccess) return "balanced";
    if (query.length > 50) return "deep";
    return "balanced";
  }

  getTimeout(strategy) {
    const timeouts = {
      fast: 15000,
      balanced: 25000,
      deep: 35000,
      fallback: 30000,
    };
    return timeouts[strategy] || 25000;
  }
}

export default Planner;