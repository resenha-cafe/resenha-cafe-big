/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Infrastructure — CrossRef Adapter
 * ============================================================
 *
 * 📚 Adapter para a API do CrossRef (https://api.crossref.org).
 * 
 * Documentação: https://api.crossref.org/swagger-ui/index.html
 * 
 * Características:
 * - Base gratuita com "polite pool" (sem API key)
 * - Cobre +150M de registros (DOI, metadados, referências)
 * - Suporta busca textual, filtros e ordenação
 * - Retorna metadados completos (autores, afiliações, licenças)
 * - Rate limit: 50 requisições/segundo (com email no User-Agent)
 * 
 * 📚 Polite Pool:
 * O CrossRef oferece um "polite pool" para usuários sem API key.
 * Basta identificar-se com um email no parâmetro mailto ou
 * no User-Agent. Isso garante prioridade sobre bots anônimos.
 */

import { BaseAdapter } from "./base.js";

export class CrossRefAdapter extends BaseAdapter {
  /**
   * @param {Object} options - Configuração do adapter
   * @param {string} [options.email] - Email para o polite pool
   */
  constructor(options = {}) {
    super({
      name: "crossref",
      baseUrl: "https://api.crossref.org",
      timeout: options.timeout ?? 15000,
      headers: {
        ...(options.email ? { "User-Agent": `ResenhaCafe-Worker/4.0 (mailto:${options.email})` } : {}),
        ...(options.headers || {}),
      },
      logger: options.logger,
      rateLimiter: options.rateLimiter,
      healthThreshold: options.healthThreshold,
    });

    this.email = options.email || null;
    this.defaultRows = options.defaultRows ?? 20;
    this.maxRows = 1000; // Limite da API do CrossRef
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
   * @returns {Promise<Object>} { articles, total, meta }
   */
  async search(query, params = {}) {
    const rows = Math.min(params.limit ?? this.defaultRows, this.maxRows);

    const requestParams = {
      query: query,
      rows: rows,
      sort: "relevance",
    };

    const filter = this.#buildFilter(params);
    if (filter) {
      requestParams.filter = filter;
    }

    if (this.email) {
      requestParams.mailto = this.email;
    }

    const data = await this._get("/works", requestParams);

    const message = data.message || {};

    // 📚 Proteção contra divisão por zero (rows = 0 com ??)
    const totalResults = message["total-results"] || 0;
    const totalPages = rows > 0 ? Math.ceil(totalResults / rows) : 0;

    return {
      articles: message.items || [],
      total: totalResults,
      meta: {
        page: 1,
        perPage: rows,
        totalPages,
        source: "crossref",
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
    const encodedDoi = encodeURIComponent(doi);

    try {
      const data = await this._get(`/works/${encodedDoi}`);
      return data.message || null;
    } catch (error) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  // ============================================================
  // MÉTODOS PRIVADOS
  // ============================================================

  /**
   * Constrói o filtro do CrossRef.
   * 
   * 📚 O CrossRef usa uma sintaxe de filtro específica:
   * - from-pub-date:2020-01-01
   * - until-pub-date:2024-12-31
   * - language:pt
   * - license.url:*creativecommons*
   * - type:journal-article
   * 
   * @private
   */
  #buildFilter(params = {}) {
    const filters = [];

    if (params.yearStart) {
      filters.push(`from-pub-date:${params.yearStart}-01-01`);
    }

    if (params.yearEnd) {
      filters.push(`until-pub-date:${params.yearEnd}-12-31`);
    }

    if (params.language) {
      filters.push(`language:${params.language}`);
    }

    if (params.openAccess) {
      filters.push("license.url:*creativecommons*");
    }

    if (params.type) {
      filters.push(`type:${params.type}`);
    }

    return filters.length > 0 ? filters.join(",") : null;
  }
}

export default CrossRefAdapter;