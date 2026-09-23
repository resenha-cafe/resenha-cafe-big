import { describe, it, expect } from 'vitest';
import { SearchForm } from '../../src/components/search/search-form.js';
import { ResultsList } from '../../src/components/search/results-list.js';
import { Article } from '../../src/domain/article.js';
import { SearchResult } from '../../src/domain/search-result.js';

const mockSearchService = {
  async search(searchQuery) {
    const articles = [
      new Article({ title: 'Artigo A', doi: '10.1/1' }),
      new Article({ title: 'Artigo B', doi: '10.2/2' }),
      new Article({ title: 'Artigo C', doi: '10.3/3' }),
    ];
    return new SearchResult({
      query: searchQuery.query,
      articles,
      total: 3,
      metrics: {},
      duration: 0,
    });
  },
};

describe('Fluxo de busca — verificar duplicação', () => {
  it('deve renderizar apenas um card por artigo', async () => {
    document.body.innerHTML = `
      <div id="search-form-root"></div>
      <div id="results-root"></div>
    `;

    const formRoot = document.getElementById('search-form-root');
    const resultsRoot = document.getElementById('results-root');

    const form = new SearchForm({
      root: formRoot,
      onSubmit: async (query) => {
        const result = await mockSearchService.search(query);
        resultsList.update(result);
      },
    });
    const resultsList = new ResultsList({ root: resultsRoot, items: [] });

    form.mount();
    resultsList.mount();

    const input = formRoot.querySelector('input[type="search"]');
    const button = formRoot.querySelector('button[type="submit"]');
    input.value = 'teste';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    button.click();

    await new Promise((resolve) => setTimeout(resolve, 0));

    const cards = resultsRoot.querySelectorAll('.article-card');
    expect(cards.length).toBe(3);
  });
});
