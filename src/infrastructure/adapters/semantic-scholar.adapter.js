/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Infrastructure — Semantic Scholar Adapter
 * ============================================================
 *
 * 📚 Adapter para a API do Semantic Scholar (https://api.semanticscholar.org).
 * 
 * Documentação: https://api.semanticscholar.org/api-docs
 * 
 * Características:
 * - Base aberta e gratuita (sem API key necessária para uso moderado)
 * - Cobre +200M de artigos acadêmicos
 * - Suporta busca textual, filtros e ordenação
 * - Retorna metadados completos, citações e referências
 * - Oferece endpoints específicos para DOI, arXiv, PMID
 * - Rate limit: 100 requisições/5min (sem key)
 * 
 * 📚 Endpoints:
 * - GET /paper/search?query=... → busca textual
 * - GET /paper/DOI:{doi} → lookup por DOI
 * - GET /paper/ArXiv:{id} → lookup por arXiv
 */

import { BaseAdapter } from "./base.js";

export class SemanticScholarAdapter extends BaseAdapter {
  /**
   * @param {Object} options - Configuração do adapter
   * @param {string} [options.apiKey] - API key (opcional, aumenta rate limit)
   */
  constructor(options = {}) {
    super({
      name: "semantic-scholar",
      baseUrl: "https://api.semanticscholar.org/graph/v1",
      timeout: options.timeout ?? 15000,
      headers: {
        ...(options.apiKey ? { "x-api-key": options.apiKey } : {}),
        ...(options.headers || {}),
      },
      logger: options.logger,
      rateLimiter: options.rateLimiter,
      healthThreshold: options.healthThreshold,
    });

    this.apiKey = options.apiKey || null;
    this.defaultLimit = options.defaultLimit ?? 20;
    this.maxLimit = 100; // Limite da API do Semantic Scholar
  }

  // ============================================================
  // MÉTODOS DA INTERFACE
  // ============================================================

  /**
   * Busca artigos por query.
   * 
   * 📚 O Semantic Scholar usa GET para o endpoint /paper/search.
   * Os parâmetros vão na query string: query, limit, offset, year, etc.
   * 
   * @param {string} query - Termo de busca
   * @param {Object} [params] - Parâmetros de busca
   * @param {number} [params.limit=20] - Limite de resultados
   * @param {number} [params.yearStart] - Ano inicial
   * @param {number} [params.yearEnd] - Ano final
   * @param {string} [params.language] - Idioma
   * @param {boolean} [params.openAccess=false] - Apenas acesso aberto
   * @param {number} [params.offset=0] - Offset para paginação
   * @returns {Promise<Object>} { articles, total, meta }
   */
  async search(query, params = {}) {
    const limit = Math.min(params.limit ?? this.defaultLimit, this.maxLimit);

    // 📚 Parâmetros na query string (GET)
    const requestParams = {
      query: query,
      limit: limit,
      offset: params.offset ?? 0,
      fields: "title,abstract,authors,externalIds,url,publicationDate,journal,citationCount,references,openAccessPdf,publicationTypes",
    };

    // 📚 Filtros do Semantic Scholar
    const filter = this.#buildFilter(params);
    if (filter) {
      Object.assign(requestParams, filter);
    }

    // 📚 Semantic Scholar /paper/search é GET, não POST
    const data = await this._get("/paper/search", requestParams);

    // 📚 Semantic Scholar retorna { data, total, offset, next }
    const totalResults = data.total || 0;
    const totalPages = limit > 0 ? Math.ceil(totalResults / limit) : 0;

    return {
      articles: data.data || [],
      total: totalResults,
      meta: {
        page: Math.floor((params.offset ?? 0) / limit) + 1,
        perPage: limit,
        totalPages,
        offset: data.offset ?? params.offset ?? 0,
        nextOffset: data.next ?? null,
        source: "semantic-scholar",
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
      const data = await this._get(`/paper/DOI:${encodedDoi}`, {
        fields: "title,abstract,authors,externalIds,url,publicationDate,journal,citationCount,references,openAccessPdf,publicationTypes",
      });

      return data || null;
    } catch (error) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  /**
   * Busca um artigo por arXiv ID.
   * 
   * @param {string} arxivId - arXiv ID (ex: "2101.12345")
   * @returns {Promise<Object|null>} Artigo ou null
   */
  async getByArXiv(arxivId) {
    const encodedId = encodeURIComponent(arxivId);

    try {
      const data = await this._get(`/paper/ArXiv:${encodedId}`, {
        fields: "title,abstract,authors,externalIds,url,publicationDate,journal,citationCount,references,openAccessPdf",
      });

      return data || null;
    } catch (error) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  // ============================================================
  // MÉTODOS PRIVADOS
  // ============================================================

  /**
   * Constrói os filtros do Semantic Scholar.
   * 
   * 📚 O Semantic Scholar usa parâmetros na query string:
   * - year: "2020-2024" (intervalo)
   * - openAccessPdf: true
   * - publicationTypes: "JournalArticle"
   * 
   * @private
   */
  #buildFilter(params = {}) {
    const filter = {};

    if (params.yearStart && params.yearEnd) {
      filter.year = `${params.yearStart}-${params.yearEnd}`;
    } else if (params.yearStart) {
      filter.year = `${params.yearStart}-`;
    } else if (params.yearEnd) {
      filter.year = `-${params.yearEnd}`;
    }

    if (params.language) {
      // Semantic Scholar não tem filtro de idioma nativo
    }

    if (params.openAccess) {
      filter.openAccessPdf = true;
    }

    if (params.type) {
      filter.publicationTypes = params.type;
    }

    return Object.keys(filter).length > 0 ? filter : null;
  }
}

export default SemanticScholarAdapter;