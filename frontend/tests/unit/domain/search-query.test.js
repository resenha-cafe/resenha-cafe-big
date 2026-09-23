import { describe, it, expect } from 'vitest';
import { SearchQuery } from '../../../src/domain/search-query.js';

describe('SearchQuery', () => {
  it('deve criar uma query válida', () => {
    const query = new SearchQuery({ query: 'machine learning' });
    expect(query.isValid).toBe(true);
    expect(query.limit).toBe(20);
  });

  it('deve rejeitar query curta', () => {
    const query = new SearchQuery({ query: 'a' });
    expect(query.isValid).toBe(false);
    expect(query.validationErrors()).toHaveLength(1);
    expect(query.validationErrors()[0].code).toBe('EMPTY_QUERY');
  });

  it('deve rejeitar limite acima do máximo', () => {
    const query = new SearchQuery({ query: 'teste', limit: 500 });
    expect(query.isValid).toBe(false);
    expect(query.validationErrors().some(e => e.code === 'LIMIT_EXCEEDED')).toBe(true);
    expect(query.limit).toBeNull();
  });

  it('deve rejeitar anos invertidos', () => {
    const query = new SearchQuery({ query: 'teste', yearStart: 2025, yearEnd: 2020 });
    expect(query.isValid).toBe(false);
    expect(query.validationErrors().some(e => e.code === 'YEAR_RANGE_INVALID')).toBe(true);
  });

  it('deve converter para query params corretamente', () => {
    const query = new SearchQuery({
      query: 'teste',
      yearStart: 2018,
      language: 'pt',
      openAccess: true,
    });
    const params = query.toQueryParams();
    expect(params).toEqual({
      q: 'teste',
      limit: 20,
      yearStart: 2018,
      language: 'pt',
      openAccess: 'true',
    });
  });
});
