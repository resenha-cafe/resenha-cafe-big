import { BaseAdapter } from "./base.js";

export class OpenAlexAdapter extends BaseAdapter {
  constructor(options = {}) {
    super({
      name: "openalex",
      baseUrl: "https://api.openalex.org",
      timeout: options.timeout ?? 15000,
      headers: {
        ...(options.headers || {}),
        ...(options.email ? { "User-Agent": `ResenhaCafe-Worker/4.0 (mailto:${options.email})` } : {}),
      },
      logger: options.logger,
      rateLimiter: options.rateLimiter,
      healthThreshold: options.healthThreshold,
    });

    this.email = options.email || null;
    this.defaultPerPage = options.defaultPerPage ?? 25;
    this.maxPerPage = 200;
  }

  async search(query, params = {}) {
    const perPage = Math.min(params.limit ?? this.defaultPerPage, this.maxPerPage);

    const requestParams = {
      search: query,
      per_page: perPage,
      sort: "relevance_score:desc",
    };

    if (this.email) {
      requestParams.mailto = this.email;
    }

    const filter = this.#buildFilter(params);
    if (filter) {
      requestParams.filter = filter;
    }

    const data = await this._get("/works", requestParams);

    const totalResults = data.meta?.count || 0;
    const totalPages = perPage > 0 ? Math.ceil(totalResults / perPage) : 0;

    return {
      articles: data.results || [],
      total: totalResults,
      meta: {
        page: data.meta?.page || 1,
        perPage: data.meta?.per_page || perPage,
        totalPages,
        source: "openalex",
      },
    };
  }

  async getByDOI(doi) {
    const encodedDoi = encodeURIComponent(`doi:${doi}`);

    try {
      const params = this.email ? { mailto: this.email } : {};
      const data = await this._get(`/works/${encodedDoi}`, params);
      return data || null;
    } catch (error) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  #buildFilter(params = {}) {
    const filters = [];

    if (params.yearStart) {
      filters.push(`publication_year:>${params.yearStart - 1}`);
    }

    if (params.yearEnd) {
      filters.push(`publication_year:<${params.yearEnd + 1}`);
    }

    if (params.language) {
      filters.push(`language:${params.language}`);
    }

    if (params.openAccess) {
      filters.push("is_oa:true");
    }

    if (params.type) {
      filters.push(`type:${params.type}`);
    }

    return filters.length > 0 ? filters.join(",") : null;
  }
}

export default OpenAlexAdapter;
