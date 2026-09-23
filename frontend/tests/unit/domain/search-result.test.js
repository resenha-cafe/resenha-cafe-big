import { describe, it, expect } from 'vitest';
import { SearchResult } from '../../../src/domain/search-result.js';
import { Article } from '../../../src/domain/article.js';

describe('SearchResult', () => {
  it('deve filtrar apenas instâncias de Article', () => {
    const article = new Article({ title: 'A', doi: '10.1/1' });
    const result = new SearchResult({
      articles: [article, { title: 'não article' }],
      total: 1,
    });
    expect(result.resultCount).toBe(1);
  });

  it('hasMorePages deve considerar paginação', () => {
    const article = new Article({ title: 'A', doi: '10.1/1' });
    const result = new SearchResult({
      articles: [article],
      total: 10,
      page: 1,
      pageSize: 1,
    });
    expect(result.hasMorePages).toBe(true);
  });

  it('empty() deve retornar instância vazia', () => {
    const result = SearchResult.empty('teste');
    expect(result.isEmpty).toBe(true);
    expect(result.query).toBe('teste');
  });
});
