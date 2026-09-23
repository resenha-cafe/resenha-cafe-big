import { SearchQuery } from '../domain/search-query.js';
import { apiClient } from './api.client.js';
import { mapSearchResult } from './mappers/search-result.mapper.js';

export class SearchServiceError extends Error {
  constructor(message, code = 'SEARCH_SERVICE_ERROR', details = null) {
    super(message);
    this.name = 'SearchServiceError';
    this.code = code;
    this.details = details;
  }
}

export class SearchService {
  constructor(client = apiClient) {
    this.client = client;
  }

  async search(searchQuery) {
    if (!(searchQuery instanceof SearchQuery)) {
      throw new TypeError('[SearchService] search() espera uma instância de SearchQuery.');
    }

    const validationErrors = searchQuery.validationErrors();
    if (validationErrors.length > 0) {
      const messages = validationErrors.map((err) => err.message).join(' ');
      throw new SearchServiceError(messages, 'INVALID_SEARCH_QUERY', validationErrors);
    }

    const queryParams = searchQuery.toQueryParams();

    const response = await this.client.request('SEARCH', {
      method: 'GET',
      params: queryParams,
    });

    return mapSearchResult(response, searchQuery.query);
  }
}

export const searchService = new SearchService();
export default searchService;
