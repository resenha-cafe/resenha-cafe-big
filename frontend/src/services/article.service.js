// src/services/article.service.js

import { ArticleMapper } from './mappers/article.mapper.js';
import { apiClient, FrontendApiError } from './api.client.js';
import { ERROR_MESSAGES } from '../core/constants.js';

export class ArticleService {
  constructor(client = apiClient) {
    this.client = client;
  }

  async getByDoi(doi, signal) {
    if (!doi || typeof doi !== 'string') {
      throw new FrontendApiError(ERROR_MESSAGES.INVALID_DOI, {
        code: 'INVALID_DOI',
        status: 0,
      });
    }

    const sanitizedDoi = doi.trim();

    if (!this.#isValidDoi(sanitizedDoi)) {
      throw new FrontendApiError(ERROR_MESSAGES.INVALID_DOI, {
        code: 'INVALID_DOI',
        status: 0,
      });
    }

    const response = await this.client.request('ARTICLE', {
      params: { doi: sanitizedDoi },
      signal,
    });

    const rawArticle =
      response?.article?.article ??
      response?.article ??
      null;

    return ArticleMapper.toDomain(rawArticle);
  }

  #isValidDoi(doi) {
    return /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/.test(doi);
  }
}

export const articleService = new ArticleService();
export default ArticleService;
