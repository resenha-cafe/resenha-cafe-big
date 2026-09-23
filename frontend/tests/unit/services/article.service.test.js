import { describe, it, expect, vi } from 'vitest';
import { ArticleService } from '../../../src/services/article.service.js';
import { Article } from '../../../src/domain/article.js';
import { FrontendApiError } from '../../../src/services/api.client.js';

class MockApiClient {
  constructor(response) {
    this.response = response;
    this.request = vi.fn().mockImplementation(async () => this.response);
  }
}

function createMockClientWithError(error) {
  const client = new MockApiClient(null);
  client.request.mockRejectedValueOnce(error);
  return client;
}

describe('ArticleService', () => {
  it('DOI válido → chama ARTICLE', async () => {
    const client = new MockApiClient({ article: { article: { title: 'Teste' } } });
    const service = new ArticleService(client);
    await service.getByDoi('10.1234/abc');
    expect(client.request).toHaveBeenCalledWith(
      'ARTICLE',
      expect.objectContaining({ params: { doi: '10.1234/abc' } })
    );
  });

  it('DOI com espaços → faz trim', async () => {
    const client = new MockApiClient({ article: { article: { title: 'Teste' } } });
    const service = new ArticleService(client);
    await service.getByDoi('  10.1234/abc  ');
    expect(client.request).toHaveBeenCalledWith(
      'ARTICLE',
      expect.objectContaining({ params: { doi: '10.1234/abc' } })
    );
  });

  it('DOI inválido → não chama API', async () => {
    const client = new MockApiClient({});
    const service = new ArticleService(client);
    await expect(service.getByDoi('1234/abc')).rejects.toThrow('O DOI informado é inválido.');
    expect(client.request).not.toHaveBeenCalled();
  });

  it('DOI vazio → INVALID_DOI', async () => {
    const client = new MockApiClient({});
    const service = new ArticleService(client);
    await expect(service.getByDoi('')).rejects.toMatchObject({ code: 'INVALID_DOI' });
    expect(client.request).not.toHaveBeenCalled();
  });

  it('ApiClient retorna artigo simples → mapeia corretamente', async () => {
    const rawArticle = { title: 'Título Simples', doi: '10.1234/abc', source: 'openalex' };
    const client = new MockApiClient({ article: rawArticle });
    const service = new ArticleService(client);
    const article = await service.getByDoi('10.1234/abc');
    expect(article).toBeInstanceOf(Article);
    expect(article.title).toBe('Título Simples');
  });

  it('ApiClient lança FrontendApiError → propaga o erro', async () => {
    const apiError = new FrontendApiError('Not Found', { code: 'NOT_FOUND', status: 404 });
    const client = createMockClientWithError(apiError);
    const service = new ArticleService(client);
    await expect(service.getByDoi('10.1234/abc')).rejects.toThrow('Not Found');
  });

  it('resposta sem artigo → deve retornar Article.empty()', async () => {
    const client = new MockApiClient({});
    const service = new ArticleService(client);
    const result = await service.getByDoi('10.1234/abc');
    expect(result).toBeInstanceOf(Article);
    expect(result.title).toBe('');
  });
});
