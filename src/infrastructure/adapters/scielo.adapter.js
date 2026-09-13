/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Infrastructure — SciELO Adapter
 * ============================================================
 *
 * 📚 Adapter para a API do SciELO (https://api.scielo.org).
 * 
 * Documentação: https://api.scielo.org/docs
 * 
 * Características:
 * - Base aberta e gratuita (sem API key necessária)
 * - Foco em publicações da América Latina, Caribe e África
 * - Cobre +1M de artigos em +15 países
 * - Suporta busca textual, filtros e facetas
 * - Retorna metadados completos e texto completo (quando disponível)
 * - Rate limit: não documentado (uso moderado recomendado)
 */

import { BaseAdapter } from "./base.js";

export class SciELOAdapter extends BaseAdapter {
  /**
   * @param {Object} options - Configuração do adapter
   */
  constructor(options = {}) {
    super({
      name: "scielo",
      baseUrl: "https://api.scielo.org",
      timeout: options.timeout ?? 15000,
      headers: {
        ...(options.headers || {}),
      },
      logger: options.logger,
      rateLimiter: options.rateLimiter,
      healthThreshold: options.healthThreshold,
    });

    this.defaultLimit = options.defaultLimit ?? 20;
    this.maxLimit = 100; // Limite conservador para a API do SciELO
  }

  // ============================================================
  // MÉTODOS DA INTERFACE
  // ============================================================

  /**
   * Busca artigos por query.
   * 
   * @param {string} query - Termo de busca
   * @param {Object} [params] - Parâmetros de busca
   * @param {number} [params.limit=20] - Limite de resultados
   * @param {number} [params.yearStart] - Ano inicial
   * @param {number} [params.yearEnd] - Ano final
   * @param {string} [params.language] - Idioma (pt, en, es)
   * @param {boolean} [params.openAccess=false] - Apenas acesso aberto
   * @param {number} [params.offset=0] - Offset para paginação
   * @param {string} [params.collection] - Coleção (ex: scl, arg)
   * @returns {Promise<Object>} { articles, total, meta }
   */
  async search(query, params = {}) {
    const limit = Math.min(params.limit ?? this.defaultLimit, this.maxLimit);

    const requestParams = {
      q: query,
      limit: limit,
      offset: params.offset || 0,
    };

    // 📚 Filtros do SciELO
    const filter = this.#buildFilter(params);
    if (filter) {
      Object.assign(requestParams, filter);
    }
const url = this._buildUrl("/search", requestParams);

this.logger?.info?.("[SCIELO] URL", {
  url,
  requestParams,
});
    const data = await this._get("/search", requestParams);

    // 📚 SciELO retorna { results, total, facets }
    const totalResults = data.total || 0;
    const totalPages = limit > 0 ? Math.ceil(totalResults / limit) : 0;

    return {
      articles: data.results || [],
      total: totalResults,
      meta: {
        page: Math.floor((params.offset || 0) / limit) + 1,
        perPage: limit,
        totalPages,
        offset: params.offset || 0,
        source: "scielo",
      },
    };
  }

  /**
   * Busca um artigo por DOI.
   * 
   * @param {string} doi - DOI do artigo
   * @returns {Promise<Object|null>} Artigo ou null
   */
  async getByDOI(doi) {
    try {
      const data = await this._get("/search", {
        q: `doi:"${doi}"`,
        limit: 1,
      });

      if (data.results && data.results.length > 0) {
        return data.results[0];
      }

      return null;
    } catch (error) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  // ============================================================
  // MÉTODOS PRIVADOS
  // ============================================================

  /**
   * Constrói os filtros do SciELO.
   * 
   * 📚 O SciELO usa parâmetros individuais:
   * - year_from=2020
   * - year_to=2024
   * - language=pt
   * - collection=scl (SciELO Brasil)
   * 
   * @private
   */
  #buildFilter(params = {}) {
    const filter = {};

    if (params.yearStart) {
      filter.year_from = params.yearStart;
    }

    if (params.yearEnd) {
      filter.year_to = params.yearEnd;
    }

    if (params.language) {
      filter.language = params.language;
    }

    // SciELO é sempre OA — o filtro é irrelevante, mas mantemos para interface
    if (params.openAccess) {
      // SciELO não precisa de filtro OA (tudo é OA)
    }

    if (params.type) {
      filter.type = params.type;
    }

    if (params.collection) {
      filter.collection = params.collection;
    }

    return Object.keys(filter).length > 0 ? filter : null;
  }
}

export default SciELOAdapter;