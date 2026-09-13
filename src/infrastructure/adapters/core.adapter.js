/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Infrastructure — CORE Adapter
 * ============================================================
 *
 * 📚 Adapter para a API do CORE (https://api.core.ac.uk).
 * 
 * Documentação: https://api.core.ac.uk/docs/v3
 * 
 * Características:
 * - Maior agregador de artigos em acesso aberto do mundo
 * - Cobre +250M de artigos de +10K provedores
 * - Requer API key (gratuita com registro)
 * - Suporta busca textual, filtros e ordenação
 * - Retorna metadados e links para texto completo
 * - Rate limit: 30k requisições/dia (com key)
 * 
 * 📚 Paginação:
 * O CORE usa scrollId para paginação (não page/offset).
 * A primeira chamada retorna um scrollId.
 * Chamadas subsequentes passam o scrollId para obter a próxima página.
 */

import { BaseAdapter } from "./base.js";

export class CoreAdapter extends BaseAdapter {
  /**
   * @param {Object} options - Configuração do adapter
   * @param {string} options.apiKey - API key do CORE
   */
  constructor(options = {}) {
    super({
      name: "core",
      baseUrl: "https://api.core.ac.uk/v3",
      timeout: options.timeout ?? 15000,
      headers: {
        ...(options.apiKey ? { "Authorization": `Bearer ${options.apiKey}` } : {}),
        ...(options.headers || {}),
      },
      logger: options.logger,
      rateLimiter: options.rateLimiter,
      healthThreshold: options.healthThreshold,
    });

    this.apiKey = options.apiKey || null;
    this.defaultLimit = options.defaultLimit ?? 20;
    this.maxLimit = 100; // Limite da API do CORE
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
   * @param {string} [params.language] - Idioma
   * @param {boolean} [params.openAccess=false] - Apenas acesso aberto
   * @param {string} [params.scrollId] - Scroll ID para próxima página
   * @param {number} [params._page=1] - Página atual (interno, para metadata)
   * @returns {Promise<Object>} { articles, total, meta }
   */
  async search(query, params = {}) {
    const limit = Math.min(params.limit ?? this.defaultLimit, this.maxLimit);

    const requestParams = {
      q: query,
      limit: limit,
    };

    // 📚 Filtros do CORE
    const filter = this.#buildFilter(params);
    if (filter) {
      Object.assign(requestParams, filter);
    }

    // 📚 Scroll ID para paginação
    if (params.scrollId) {
      requestParams.scrollId = params.scrollId;
    }

    const data = await this._get("/search/works", requestParams);

    // 📚 CORE retorna { results, totalHits, scrollId }
    const totalResults = data.totalHits || 0;
    const totalPages = limit > 0 ? Math.ceil(totalResults / limit) : 0;
    // Rastreia a página atual (interno, para metadados)
    const currentPage = params._page || 1;

    return {
      articles: data.results || [],
      total: totalResults,
      meta: {
        page: currentPage,
        perPage: limit,
        totalPages,
        scrollId: data.scrollId || null,
        source: "core",
      },
    };
  }

  /**
   * Busca um artigo por DOI.
   * 
   * 📚 O CORE não tem endpoint direto de DOI.
   * Usamos a busca por query com o DOI como termo.
   * 
   * @param {string} doi - DOI do artigo
   * @returns {Promise<Object|null>} Artigo ou null
   */
  async getByDOI(doi) {
    try {
      const result = await this.search(doi, { limit: 1 });

      if (result.articles.length === 0) return null;

      // Verifica se o DOI bate (pode retornar artigo similar)
      const article = result.articles[0];
      if (article.doi && article.doi.toLowerCase() === doi.toLowerCase()) {
        return article;
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
   * Constrói os filtros do CORE.
   * 
   * 📚 O CORE usa parâmetros individuais:
   * - yearFrom=2020
   * - yearTo=2024
   * - language=pt
   * - isFullText=true
   * 
   * @private
   */
  #buildFilter(params = {}) {
    const filter = {};

    if (params.yearStart) {
      filter.yearFrom = params.yearStart;
    }

    if (params.yearEnd) {
      filter.yearTo = params.yearEnd;
    }

    if (params.language) {
      filter.language = params.language;
    }

    // CORE é todo OA, mas podemos filtrar por texto completo disponível
    if (params.openAccess) {
      filter.isFullText = true;
    }

    if (params.type) {
      filter.types = params.type;
    }

    return Object.keys(filter).length > 0 ? filter : null;
  }
}

export default CoreAdapter;