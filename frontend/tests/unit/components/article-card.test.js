import { describe, it, expect, beforeEach } from 'vitest';
import { ArticleCard } from '../../../src/components/search/article-card.js';
import { Article } from '../../../src/domain/article.js';

describe('ArticleCard', () => {
  let root;
  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
  });

  it('deve montar e exibir o título', () => {
    const article = new Article({ title: 'Teste', doi: '10.1/1' });
    const card = new ArticleCard({ root, article });
    card.mount();
    expect(root.textContent).toContain('Teste');
  });

  it('não deve criar link se não houver DOI', () => {
    const article = new Article({ title: 'Sem DOI' });
    const card = new ArticleCard({ root, article });
    card.mount();
    expect(root.querySelector('a.article-card__link')).toBeNull();
  });
});
