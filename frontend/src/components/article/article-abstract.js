import { Article } from '../../domain/article.js';
import { sanitizeHtml } from '../../utils/sanitize-html.js';

export class ArticleAbstract {
  constructor({ root, article }) {
    if (!root || typeof root.appendChild !== 'function') {
      throw new Error('[ArticleAbstract] root deve ser um nó DOM válido.');
    }
    if (!article || !(article instanceof Article)) {
      throw new Error('[ArticleAbstract] article deve ser uma instância de Article.');
    }
    this.root = root;
    this.article = article;
    this.container = null;
    this.isMounted = false;
  }

  mount() {
    if (this.isMounted) return;
    this.root.innerHTML = '';
    this.root.hidden = false;

    if (!this.article.hasAbstract) {
      this.root.hidden = true;
      this.isMounted = true;
      return;
    }

    this.container = document.createElement('section');
    this.container.className = 'article-abstract';

    const title = document.createElement('h2');
    title.textContent = 'Resumo';
    this.container.appendChild(title);

    const text = document.createElement('p');
    text.textContent = sanitizeHtml(this.article.abstract);
    this.container.appendChild(text);

    this.root.appendChild(this.container);
    this.isMounted = true;
  }

  destroy() {
    if (!this.isMounted) return;
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    this.root.innerHTML = '';
    this.root.hidden = false;
    this.isMounted = false;
  }
}

export default ArticleAbstract;
