import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ArticlePage } from '../../../src/pages/article.page.js';
import { Article } from '../../../src/domain/article.js';

const getByDoiMock = vi.fn();
vi.mock('../../../src/services/article.service.js', () => ({
  articleService: { getByDoi: (...args) => getByDoiMock(...args) },
}));

describe('ArticlePage', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="header-root"></div>
      <div id="footer-root"></div>
      <main class="article-page">
        <section id="article-header-root"></section>
        <section id="article-metadata-root"></section>
        <section id="article-abstract-root"></section>
        <section id="article-references-root"></section>
        <div id="loading-root" hidden></div>
        <div id="error-root" hidden></div>
        <div id="empty-root" hidden></div>
      </main>
    `;
    getByDoiMock.mockReset();
  });

  it('deve exibir erro se DOI ausente na URL', async () => {
    window.history.replaceState({}, '', '/pages/artigo.html');
    const page = new ArticlePage();
    await page.mount();
    expect(document.getElementById('error-root').hidden).toBe(false);
    expect(document.getElementById('error-root').textContent).toContain('DOI ausente');
  });

  it('deve carregar artigo e montar componentes quando DOI é válido', async () => {
    const article = new Article({
      title: 'Teste de Artigo',
      doi: '10.1234/abc',
      abstract: 'Resumo do artigo',
      publicationDate: '2024-01-01',
      authors: [{ name: 'Autor Teste' }],
      journal: 'Revista Teste',
    });
    getByDoiMock.mockResolvedValue(article);
    window.history.replaceState({}, '', '/pages/artigo.html?doi=10.1234/abc');
    const page = new ArticlePage();
    await page.mount();
    expect(document.getElementById('article-header-root').textContent).toContain('Teste de Artigo');
  });

  it('deve exibir estado vazio se artigo não tiver DOI', async () => {
    getByDoiMock.mockResolvedValue(Article.empty());
    window.history.replaceState({}, '', '/pages/artigo.html?doi=10.1234/abc');
    const page = new ArticlePage();
    await page.mount();
    expect(document.getElementById('empty-root').hidden).toBe(false);
  });

  it('deve exibir erro se ArticleService lançar exceção', async () => {
    getByDoiMock.mockRejectedValue(new Error('Falha na API'));
    window.history.replaceState({}, '', '/pages/artigo.html?doi=10.1234/abc');
    const page = new ArticlePage();
    await page.mount();
    expect(document.getElementById('error-root').hidden).toBe(false);
  });

  it('deve controlar aria-busy durante o carregamento', async () => {
    const article = new Article({ title: 'A', doi: '10.1/1' });
    getByDoiMock.mockResolvedValue(article);
    window.history.replaceState({}, '', '/pages/artigo.html?doi=10.1/1');
    const page = new ArticlePage();
    const mainRoot = document.querySelector('.article-page');
    const promise = page.mount();
    expect(mainRoot.getAttribute('aria-busy')).toBe('true');
    await promise;
    expect(mainRoot.hasAttribute('aria-busy')).toBe(false);
  });

  it('deve destruir componentes anteriores ao montar novo artigo', async () => {
    const a1 = new Article({ title: 'A', doi: '10.1/1' });
    const a2 = new Article({ title: 'B', doi: '10.2/2' });
    getByDoiMock.mockResolvedValueOnce(a1).mockResolvedValueOnce(a2);

    window.history.replaceState({}, '', '/pages/artigo.html?doi=10.1/1');
    const page = new ArticlePage();
    await page.mount();
    expect(document.getElementById('article-header-root').textContent).toContain('A');

    window.history.replaceState({}, '', '/pages/artigo.html?doi=10.2/2');
    await page.mount();
    expect(document.getElementById('article-header-root').textContent).toContain('B');
    expect(document.getElementById('article-header-root').textContent).not.toContain('A');
  });
});
