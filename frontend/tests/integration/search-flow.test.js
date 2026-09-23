import { describe, it, expect } from 'vitest';
import { ResultsList } from '../../src/components/search/results-list.js';
import { Article } from '../../src/domain/article.js';
import { SearchResult } from '../../src/domain/search-result.js';

describe('Fluxo de busca integrado', () => {
  it('deve atualizar a lista com resultados', () => {
    const root = document.createElement('div');
    const resultsList = new ResultsList({ root, items: [] });
    resultsList.mount();

    const article = new Article({ title: 'Resultado', doi: '10.1/1' });
    const result = new SearchResult({
      query: 'teste',
      articles: [article],
      total: 1,
      metrics: {},
      duration: 0,
    });

    resultsList.update(result);
    expect(root.querySelectorAll('.article-card').length).toBe(1);
  });
});
