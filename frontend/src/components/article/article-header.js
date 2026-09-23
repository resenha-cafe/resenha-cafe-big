import { Article } from '../../domain/article.js';

export class ArticleHeader {
  constructor({ root, article }) {
    if (!root || typeof root.appendChild !== 'function') {
      throw new Error('[ArticleHeader] root deve ser um nó DOM válido.');
    }
    if (!article || !(article instanceof Article)) {
      throw new Error('[ArticleHeader] article deve ser uma instância de Article.');
    }
    this.root = root;
    this.article = article;
    this.container = null;
    this.isMounted = false;
  }

  mount() {
    if (this.isMounted) return;
    this.root.innerHTML = '';

    this.container = document.createElement('header');
    this.container.className = 'article-header';

    const title = document.createElement('h1');
    title.className = 'article-header__title';
    title.textContent = this.article.displayTitle;
    this.container.appendChild(title);

    if (this.article.hasAuthors) {
      const authors = document.createElement('p');
      authors.className = 'article-header__authors';
      authors.textContent = this._formatAuthors();
      this.container.appendChild(authors);
    }

    if (this.article.hasDoi) {
      const doi = document.createElement('p');
      doi.className = 'article-header__doi';
      doi.textContent = `DOI: ${this.article.doi}`;
      this.container.appendChild(doi);
    }

    this.root.appendChild(this.container);
    this.isMounted = true;
  }

  destroy() {
    if (!this.isMounted) return;
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    this.isMounted = false;
  }

  _formatAuthors() {
    const first = this.article.firstAuthor;
    if (!first) return '';
    if (this.article.authorCount > 1) return `${first} et al.`;
    return first;
  }
}

export default ArticleHeader;
