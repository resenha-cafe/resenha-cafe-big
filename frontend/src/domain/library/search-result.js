// src/domain/search-result.js

import { Article } from './article.js';
import { deepFreeze } from '../utils/deep-freeze.js';

/**
 * Representa uma resposta de pesquisa normalizada.
 * Imutável, com suporte a paginação e métricas.
 */
export class SearchResult {
  constructor(data = {}) {
    this.query = typeof data.query === 'string' ? data.query : '';

    this.articles = Array.isArray(data.articles)
      ? deepFreeze(data.articles.filter((article) => article instanceof Article))
      : deepFreeze([]);

    const total = Number(data.total);
    this.total = Number.isFinite(total) && total >= 0 ? Math.floor(total) : this.articles.length;

    const page = Number(data.page);
    this.page = Number.isFinite(page) && page >= 1 ? Math.floor(page) : null;

    const pageSize = Number(data.pageSize ?? data.limit);
    this.pageSize = Number.isFinite(pageSize) && pageSize >= 1 ? Math.floor(pageSize) : null;

    const offset = Number(data.offset);
    this.offset = Number.isFinite(offset) && offset >= 0 ? Math.floor(offset) : null;

    this.metrics = deepFreeze(
      data.metrics && typeof data.metrics === 'object' && !Array.isArray(data.metrics)
        ? { ...data.metrics }
        : {}
    );

    const duration = Number(data.duration);
    this.duration = Number.isFinite(duration) && duration >= 0 ? duration : 0;

    this.fromCache = Boolean(data.fromCache);

    deepFreeze(this);
  }

  get isEmpty() {
    return this.articles.length === 0;
  }

  get hasResults() {
    return !this.isEmpty;
  }

  get resultCount() {
    return this.articles.length;
  }

  get firstArticle() {
    return this.articles.length > 0 ? this.articles[0] : null;
  }

  get hasMorePages() {
    if (this.offset !== null) {
      return this.offset + this.articles.length < this.total;
    }
    if (this.page !== null && this.pageSize !== null) {
      return this.page * this.pageSize < this.total;
    }
    return this.total > this.articles.length;
  }

  get hasMetrics() {
    return Object.keys(this.metrics).length > 0;
  }

  static empty(query = '') {
    return new SearchResult({ query });
  }
}

export default SearchResult;
