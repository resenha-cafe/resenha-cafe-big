// src/services/search.service.js

import { SearchQuery } from '../domain/search-query.js';
import { SearchResult } from '../domain/search-result.js';
import { apiClient } from './api.client.js';
import { mapSearchResult } from './mappers/search-result.mapper.js';

/**
 * Erro específico do SearchService para problemas de validação ou fluxo.
 * Permite que a página distinga erros de negócio de erros de rede/HTTP.
 */
export class SearchServiceError extends Error {
  constructor(message, code = 'SEARCH_SERVICE_ERROR') {
    super(message);
    this.name = 'SearchServiceError';
    this.code = code;
  }
}

/**
 * Serviço responsável por executar buscas de artigos.
 * Recebe uma `SearchQuery`, valida, chama o `ApiClient` e mapeia a resposta
 * para `SearchResult`.
 *
 * Fluxo:
 *   SearchQuery
 *      ↓
 *   SearchService.search()
 *      ↓
 *   ApiClient.request('SEARCH', { params })
 *      ↓
 *   API (/search?q=...&limit=...)
 *      ↓
 *   mapSearchResult()
 *      ↓
 *   SearchResult
 */
export class SearchService {
  /**
   * @param {ApiClient} client - Cliente HTTP genérico (default: apiClient).
   */
  constructor(client = apiClient) {
    this.client = client;
  }

  /**
   * Executa a busca com base na query fornecida.
   *
   * @param {SearchQuery} searchQuery - Instância de SearchQuery.
   * @returns {Promise<SearchResult>} Resultado mapeado.
   * @throws {TypeError} Se searchQuery não for instância de SearchQuery.
   * @throws {SearchServiceError} Se a query for inválida.
   */
  async search(searchQuery) {
    if (!(searchQuery instanceof SearchQuery)) {
      throw new TypeError('[SearchService] search() espera uma instância de SearchQuery.');
    }

    const validationErrors = searchQuery.validationErrors();
    if (validationErrors.length > 0) {
      throw new SearchServiceError(
        validationErrors.join(' '),
        'INVALID_SEARCH_QUERY'
      );
    }

    const queryParams = searchQuery.toQueryParams();

    const response = await this.client.request('SEARCH', {
      method: 'GET',
      params: queryParams, // CORRIGIDO: usa 'params' conforme contrato do ApiClient
    });

    return mapSearchResult(response, searchQuery.query);
  }
}

// Exporta uma instância única (singleton) para uso nas páginas
export const searchService = new SearchService();
export default searchService;