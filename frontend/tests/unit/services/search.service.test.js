import { describe, it, expect } from 'vitest';
import { SearchService, SearchServiceError } from '../../../src/services/search.service.js';
import { SearchQuery } from '../../../src/domain/search-query.js';

class MockApiClient {
  async request() {
    return {};
  }
}

describe('SearchService', () => {
  it('deve lançar erro para query inválida', async () => {
    const service = new SearchService(new MockApiClient());
    const query = new SearchQuery({ query: 'a' });
    await expect(service.search(query)).rejects.toBeInstanceOf(SearchServiceError);
  });

  it('deve chamar o cliente e retornar SearchResult', async () => {
    const fakeResponse = {
      query: 'teste',
      results: [{ title: 'T', doi: '10.1/1' }],
      total: 1,
      metrics: {},
      duration: 0,
    };
    const client = { async request() { return fakeResponse; } };
    const service = new SearchService(client);
    const query = new SearchQuery({ query: 'teste' });
    const result = await service.search(query);
    expect(result.query).toBe('teste');
    expect(result.hasResults).toBe(true);
  });
});
