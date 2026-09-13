/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Infrastructure — Europe PMC Adapter
 * ============================================================
 *
 * 📚 Adapter para a API do Europe PMC (https://www.ebi.ac.uk/europepmc/).
 * 
 * Documentação: https://europepmc.org/RestfulWebService
 * 
 * Características:
 * - Base aberta e gratuita (sem API key necessária)
 * - Foco em publicações biomédicas e ciências da vida
 * - Cobre +40M de artigos (PubMed, PMC, CrossRef, etc.)
 * - Suporta busca textual, filtros e ordenação
 * - Retorna metadados completos e links para texto completo
 * - Rate limit: 1 requisição/segundo (uso moderado)
 * 
 * 📚 Filtros:
 * O Europe PMC usa sintaxe de query para filtros, não parâmetros separados.
 * Ex: query=cancer AND FIRST_PDATE:[2020-01-01 TO 2024-12-31] AND LANGUAGE:pt
 * 
 * 📚 Paginação:
 * O Europe PMC usa pageSize para controlar o número de resultados.
 * Não possui paginação por página — todos os resultados são retornados
 * em uma única resposta (até o limite de pageSize).
 */

import { BaseAdapter } from "./base.js";

export class EuropepmcAdapter extends BaseAdapter {
  /**
   * @param {Object} options - Configuração do adapter
   */
  constructor(options = {}) {
    super({
      name: "europepmc",
      baseUrl: "https://www.ebi.ac.uk/europepmc/webservices/rest",
      timeout: options.timeout ?? 15000,
      headers: {
        ...(options.headers || {}),
      },
      logger: options.logger,
      rateLimiter: options.rateLimiter,
      healthThreshold: options.healthThreshold,
    });

    this.defaultPageSize = options.defaultPageSize ?? 25;
    this.maxPageSize = 1000; // Limite da API do Europe PMC
  }

  // ============================================================
  // MÉTODOS DA INTERFACE
  // ============================================================

  /**
   * Busca artigos por query.
   * 
   * @param {string} query - Termo de busca
   * @param {Object} [params] - Parâmetros de busca
   * @param {number} [params.limit=25] - Limite de resultados
   * @param {number} [params.yearStart] - Ano inicial
   * @param {number} [params.yearEnd] - Ano final
   * @param {string} [params.language] - Idioma
   * @param {boolean} [params.openAccess=false] - Apenas acesso aberto
   * @returns {Promise<Object>} { articles, total, meta }
   */
  async search(query, params = {}) {
    const pageSize = Math.min(params.limit ?? this.defaultPageSize, this.maxPageSize);

    // 📚 Constrói a query com filtros inline (sintaxe da API)
    const filterQuery = this.#buildFilter(params);
    const fullQuery = filterQuery ? `${query} AND ${filterQuery}` : query;

    const requestParams = {
      query: fullQuery,
      pageSize: pageSize,
      format: "json",
      resultType: "core",
    };

    const data = await this._get("/search", requestParams);

    // 📚 Europe PMC retorna { hitCount, resultList: { result: [...] } }
    const totalResults = data.hitCount || 0;
    const totalPages = pageSize > 0 ? Math.ceil(totalResults / pageSize) : 0;

    return {
      articles: data.resultList?.result || [],
      total: totalResults,
      meta: {
        page: 1,
        perPage: pageSize,
        totalPages,
        source: "europepmc",
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
        query: `DOI:${doi}`,
        pageSize: 1,
        format: "json",
        resultType: "core",
      });

      if (data.resultList?.result && data.resultList.result.length > 0) {
        return data.resultList.result[0];
      }

      return null;
    } catch (error) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  /**
   * Busca um artigo por PMID (PubMed ID).
   * 
   * @param {string} pmid - PubMed ID
   * @returns {Promise<Object|null>} Artigo ou null
   */
  async getByPMID(pmid) {
    try {
      const data = await this._get("/search", {
        query: `EXT_ID:${pmid}`,
        pageSize: 1,
        format: "json",
        resultType: "core",
      });

      if (data.resultList?.result && data.resultList.result.length > 0) {
        return data.resultList.result[0];
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
   * Constrói os filtros do Europe PMC como string para a query.
   * 
   * 📚 O Europe PMC usa sintaxe de query para filtros:
   * - FIRST_PDATE:[2020-01-01 TO 2024-12-31] (intervalo de data)
   * - LANGUAGE:pt (idioma)
   * - OPEN_ACCESS:Y (acesso aberto)
   * - PUB_TYPE:journal-article (tipo de publicação)
   * 
   * @private
   * @returns {string|null} String de filtro ou null
   */
  #buildFilter(params = {}) {
    const filters = [];

    if (params.yearStart || params.yearEnd) {
      const startDate = params.yearStart ? `${params.yearStart}-01-01` : "1000-01-01";
      const endDate = params.yearEnd ? `${params.yearEnd}-12-31` : "9999-12-31";
      filters.push(`FIRST_PDATE:[${startDate} TO ${endDate}]`);
    }

    if (params.language) {
      filters.push(`LANGUAGE:${params.language}`);
    }

    if (params.openAccess) {
      filters.push("OPEN_ACCESS:Y");
    }

    if (params.type) {
      filters.push(`PUB_TYPE:${params.type}`);
    }

    return filters.length > 0 ? filters.join(" AND ") : null;
  }
}

export default EuropepmcAdapter;