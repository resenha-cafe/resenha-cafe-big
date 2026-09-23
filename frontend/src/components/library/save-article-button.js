import { Article } from '../../domain/article.js';
import { LibraryService } from '../../services/library/library.service.js';

export class SaveArticleButton {
  constructor({ root, article, libraryService }) {
    if (!root || typeof root.appendChild !== 'function') {
      throw new Error('[SaveArticleButton] root deve ser um nó DOM válido.');
    }
    if (!article || !(article instanceof Article)) {
      throw new TypeError('[SaveArticleButton] article deve ser uma instância de Article.');
    }
    if (!libraryService || !(libraryService instanceof LibraryService)) {
      throw new TypeError('[SaveArticleButton] libraryService deve ser uma instância de LibraryService.');
    }
    this.root = root;
    this.article = article;
    this.libraryService = libraryService;
    this.button = null;
    this._boundClick = null;
    this.isMounted = false;
    this.isSaved = libraryService.has(article.doi);
  }

  mount() {
    if (this.isMounted) return;
    this.button = document.createElement('button');
    this.button.type = 'button';
    this.button.className = 'save-article-button';
    this._updateLabel();
    this._boundClick = () => this._handleClick();
    this.button.addEventListener('click', this._boundClick);
    this.root.appendChild(this.button);
    this.isMounted = true;
  }

  destroy() {
    if (!this.isMounted) return;
    if (this.button && this._boundClick) {
      this.button.removeEventListener('click', this._boundClick);
      this._boundClick = null;
    }
    if (this.button) {
      this.button.remove();
      this.button = null;
    }
    this.isMounted = false;
  }

  _handleClick() {
    try {
      if (this.libraryService.has(this.article.doi)) {
        this.libraryService.remove(this.article.doi);
        this.isSaved = false;
      } else {
        this.libraryService.save(this.article);
        this.isSaved = true;
      }
      this._updateLabel();
    } catch (error) {
      console.error('[SaveArticleButton]', error.message);
    }
  }

  _updateLabel() {
    if (!this.button) return;
    this.button.textContent = this.isSaved ? 'Salvo ✓' : 'Salvar';
    this.button.disabled = false;
  }
}
export default SaveArticleButton;
