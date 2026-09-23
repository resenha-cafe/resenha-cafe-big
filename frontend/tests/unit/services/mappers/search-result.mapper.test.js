import { describe, it, expect } from 'vitest';
import { mapSearchResult } from '../../../../src/services/mappers/search-result.mapper.js';

describe('mapSearchResult', () => {
  it('deve mapear resposta do Worker', () => {
    const raw = {
      query: 'cafe',
      results: [{ title: 'Artigo 1', doi: '10.1/1' }],
      total: 1,
      metrics: { time: 10 },
      duration: 5,
      fromCache: false,
    };
    const result = mapSearchResult(raw);
    expect(result.query).toBe('cafe');
    expect(result.resultCount).toBe(1);
    expect(result.hasResults).toBe(true);
  });

  it('deve retornar SearchResult vazio para resposta inválida', () => {
    const result = mapSearchResult(null);
    expect(result.isEmpty).toBe(true);
  });
});
