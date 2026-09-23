import { Article } from '../../domain/article.js';

export class ArticleReferences {
  constructor({ root, article }) {
    if (!root || typeof root.appendChild !== 'function') {
      throw new Error('[ArticleReferences] root deve ser um nó DOM válido.');
    }
    if (!article || !(article instanceof Article)) {
      throw new Error('[ArticleReferences] article deve ser uma instância de Article.');
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

    if (this.article.references.length === 0) {
      this.root.hidden = true;
      this.isMounted = true;
      return;
    }

    this.container = document.createElement('section');
    this.container.className = 'article-references';

    const title = document.createElement('h2');
    title.textContent = 'Referências';
    this.container.appendChild(title);

    const ul = document.createElement('ul');
    ul.className = 'article-references__list';

    this.article.references.forEach((ref) => {
      const li = document.createElement('li');
      li.textContent = ref;
      ul.appendChild(li);
    });

    this.container.appendChild(ul);
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

export default ArticleReferences;
