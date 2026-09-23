import { Article } from '../../domain/article.js';
import { formatPublicationDate } from '../../utils/format-date.js';

export class ArticleMetadata {
  constructor({ root, article }) {
    if (!root || typeof root.appendChild !== 'function') {
      throw new Error('[ArticleMetadata] root deve ser um nó DOM válido.');
    }
    if (!article || !(article instanceof Article)) {
      throw new Error('[ArticleMetadata] article deve ser uma instância de Article.');
    }
    this.root = root;
    this.article = article;
    this.container = null;
    this.isMounted = false;
  }

  mount() {
    if (this.isMounted) return;
    this.root.innerHTML = '';

    this.container = document.createElement('dl');
    this.container.className = 'article-metadata';

    this._addItem('Data de publicação', formatPublicationDate(this.article.publicationDate));
    this._addItem('Idioma', this.article.language);
    this._addItem('Periódico', this.article.journalName);
    this._addItem('Editora', this._extractName(this.article.publisher));
    this._addItem('Licença', this._extractName(this.article.license));
    this._addItem('Acesso aberto', this.article.openAccess ? 'Sim' : 'Não');
    this._addItem('Revisado por pares', this.article.peerReviewed ? 'Sim' : 'Não');
    this._addItem('Citações', this.article.citations > 0 ? String(this.article.citations) : '0');

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

  _addItem(label, value) {
    if (!value) return;
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = value;
    this.container.appendChild(dt);
    this.container.appendChild(dd);
  }

  _extractName(value) {
    if (typeof value === 'string') return value.trim();
    if (value && typeof value === 'object') {
      return value.name || value.title || '';
    }
    return '';
  }
}

export default ArticleMetadata;
