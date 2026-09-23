import { describe, it, expect, beforeEach } from 'vitest';
import { ResultsList } from '../../../src/components/search/results-list.js';
import { Article } from '../../../src/domain/article.js';

describe('ResultsList', () => {
  let root;
  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
  });

  it('deve montar e renderizar cards', () => {
    const article = new Article({ title: 'A', doi: '10.1/1' });
    const list = new ResultsList({ root, items: [article] });
    list.mount();
    expect(root.querySelectorAll('.article-card').length).toBe(1);
  });

  it('deve atualizar a lista', () => {
    const list = new ResultsList({ root, items: [] });
    list.mount();
    const article = new Article({ title: 'A', doi: '10.1/1' });
    list.update([article]);
    expect(root.querySelectorAll('.article-card').length).toBe(1);
  });

  it('deve destruir e limpar o DOM', () => {
    const article = new Article({ title: 'A', doi: '10.1/1' });
    const list = new ResultsList({ root, items: [article] });
    list.mount();
    list.destroy();
    expect(root.querySelector('.results-list')).toBeNull();
  });
});
