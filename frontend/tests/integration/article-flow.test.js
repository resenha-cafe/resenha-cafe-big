import { describe, it, expect, vi } from 'vitest';
import { ArticleService } from '../../src/services/article.service.js';
import { Article } from '../../src/domain/article.js';
import { ArticleHeader } from '../../src/components/article/article-header.js';
import { ArticleMetadata } from '../../src/components/article/article-metadata.js';
import { ArticleAbstract } from '../../src/components/article/article-abstract.js';
import { ArticleReferences } from '../../src/components/article/article-references.js';

class MockApiClient {
  constructor(response) {
    this.request = vi.fn().mockResolvedValue(response);
  }
}

describe('Fluxo de artigo completo', () => {
  it('deve carregar artigo e montar componentes visuais', async () => {
    const rawResponse = {
      article: {
        title: 'Machine Learning: uma introdução',
        doi: '10.1234/abc',
        abstract: 'Resumo do artigo sobre ML.',
        publicationDate: '2024-05-01',
        language: 'pt',
        authors: [{ name: 'Maria Silva' }, { name: 'João Souza' }],
        journal: { name: 'Revista Brasileira de Computação' },
        publisher: { name: 'Editora ABC' },
        license: { name: 'CC BY' },
        citations: 42,
        references: ['10.1016/j.cortex.2020.01.001'],
        source: 'openalex',
      },
    };

    const client = new MockApiClient(rawResponse);
    const service = new ArticleService(client);
    const article = await service.getByDoi('10.1234/abc');

    expect(article).toBeInstanceOf(Article);
    expect(article.doi).toBe('10.1234/abc');
    expect(article.title).toBe('Machine Learning: uma introdução');
    expect(article.citations).toBe(42);

    const headerRoot = document.createElement('section');
    const metadataRoot = document.createElement('section');
    const abstractRoot = document.createElement('section');
    const referencesRoot = document.createElement('section');

    const articleHeader = new ArticleHeader({ root: headerRoot, article });
    articleHeader.mount();
    expect(headerRoot.textContent).toContain('Machine Learning');

    const articleMetadata = new ArticleMetadata({ root: metadataRoot, article });
    articleMetadata.mount();
    expect(metadataRoot.textContent).toContain('Revista Brasileira de Computação');

    const articleAbstract = new ArticleAbstract({ root: abstractRoot, article });
    articleAbstract.mount();
    expect(abstractRoot.textContent).toContain('Resumo');

    const articleReferences = new ArticleReferences({ root: referencesRoot, article });
    articleReferences.mount();
    expect(referencesRoot.textContent).toContain('Referências');
  });
});
