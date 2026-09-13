// src/services/mappers/search-result.mapper.js

import { SearchResult } from '../../domain/search-result.js';
import { ArticleMapper } from './article.mapper.js';

/**
 * Mapeia a resposta oficial do Worker (endpoint /search) para SearchResult.
 * O contrato esperado é:
 * {
 *   success: true,
 *   query: string,
 *   results: Array,
 *   total: number,
 *   metrics: Object,
 *   duration: number,
 *   fromCache?: boolean,
 *   page?: number,
 *   pageSize?: number,
 *   offset?: number
 * }
 */
export function mapSearchResult(raw, query = '') {
  if (!raw || typeof raw !== 'object') {
    return SearchResult.empty(query);
  }

  // Determina a query: usa o parâmetro, se fornecido; senão, usa raw.query
  const normalizedQuery = typeof query === 'string' && query.trim()
    ? query.trim()
    : typeof raw.query === 'string'
      ? raw.query.trim()
      : '';

  const articles = Array.isArray(raw.results)
    ? raw.results
        .map((result) => ArticleMapper.toDomain(result, result.source))
        .filter((article) => article.title.trim() || article.doi.trim())
    : [];

  return new SearchResult({
    query: normalizedQuery,
    articles,
    total: raw.total ?? articles.length,
    metrics: raw.metrics && typeof raw.metrics === 'object' ? raw.metrics : {},
    duration: raw.duration ?? 0,
    fromCache: raw.fromCache ?? false,
    page: raw.page,
    pageSize: raw.pageSize ?? raw.limit,
    offset: raw.offset,
  });
}

export default mapSearchResult;
