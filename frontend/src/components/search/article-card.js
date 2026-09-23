// src/components/search/article-card.js

import { Article } from '../../domain/article.js';
import { formatPublicationDate } from '../../utils/format-date.js';
import { SaveArticleButton } from '../library/save-article-button.js';

/**
 * Componente visual de card de artigo.
 * Exibe informações essenciais do artigo e, se um `libraryService` for
 * fornecido, inclui o botão de salvar.
 */
export class ArticleCard {
  /**
   * @param {Object} options
   * @param {Node} options.root - Nó DOM onde o card será montado.
   * @param {Article} options.article - Instância de Article.
   * @param {LibraryService} [options.libraryService] - Serviço de biblioteca.
   * @param {number} [options.abstractMaxLength = 200] - Comprimento máximo do resumo.
   */
  constructor({
    root,
    article,
    libraryService = null,
    abstractMaxLength = 200,
  }) {
    if (!root || typeof root.appendChild !== 'function') {
      throw new Error('[ArticleCard] root deve ser um nó DOM válido.');
    }
    if (!article || !(article instanceof Article)) {
      throw new Error('[ArticleCard] article deve ser uma instância de Article.');
    }

    this.root = root;
    this.article = article;
    this.libraryService = libraryService;
    this.abstractMaxLength = Number(abstractMaxLength) || 200;

    this.container = null;
    this.saveButton = null;
    this.isMounted = false;
  }

  mount() {
    if (this.isMounted) return;

    this.container = document.createElement('article');
    this.container.className = 'article-card';

    // Título (link se houver DOI, caso contrário texto puro)
    const title = document.createElement('h3');
    title.className = 'article-card__title';

    if (this.article.hasDoi) {
      const titleLink = document.createElement('a');
      titleLink.href = this._buildArticleUrl();
      titleLink.className = 'article-card__link';
      titleLink.textContent = this.article.displayTitle;
      title.appendChild(titleLink);
    } else {
      const titleText = document.createElement('span');
      titleText.className = 'article-card__title-text';
      titleText.textContent = this.article.displayTitle;
      title.appendChild(titleText);
    }
    this.container.appendChild(title);

    // Autores
    if (this.article.hasAuthors) {
      const authors = document.createElement('p');
      authors.className = 'article-card__authors';
      authors.textContent = this._formatAuthors();
      this.container.appendChild(authors);
    }

    // Periódico e data
    const meta = document.createElement('div');
    meta.className = 'article-card__meta';

    if (this.article.journalName) {
      const journal = document.createElement('span');
      journal.className = 'article-card__journal';
      journal.textContent = this.article.journalName;
      meta.appendChild(journal);
    }

    if (this.article.publicationDate) {
      const date = document.createElement('span');
      date.className = 'article-card__date';
      date.textContent = formatPublicationDate(this.article.publicationDate);
      meta.appendChild(date);
    }

    if (meta.children.length > 0) {
      this.container.appendChild(meta);
    }

    // Resumo (se existir)
    if (this.article.hasAbstract) {
      const abstract = document.createElement('p');
      abstract.className = 'article-card__abstract';
      abstract.textContent = this._truncateAbstract(this.article.abstract);
      this.container.appendChild(abstract);
    }

    // Rodapé: indicadores e ação de salvar
    const footer = document.createElement('div');
    footer.className = 'article-card__footer';

    if (this.article.openAccess) {
      const openAccessBadge = document.createElement('span');
      openAccessBadge.className = 'article-card__badge article-card__badge--open-access';
      openAccessBadge.textContent = 'Acesso Aberto';
      footer.appendChild(openAccessBadge);
    }

    if (this.article.hasCitations) {
      const citations = document.createElement('span');
      citations.className = 'article-card__citations';
      citations.textContent = `${this.article.citations} citações`;
      footer.appendChild(citations);
    }

    // Botão salvar (somente se libraryService for fornecido)
    if (this.libraryService) {
      const saveContainer = document.createElement('div');
      saveContainer.className = 'article-card__save-container';
      footer.appendChild(saveContainer);

      this.saveButton = new SaveArticleButton({
        root: saveContainer,
        article: this.article,
        libraryService: this.libraryService,
      });
      this.saveButton.mount();
    }

    if (footer.children.length > 0) {
      this.container.appendChild(footer);
    }

    this.root.appendChild(this.container);
    this.isMounted = true;
  }

  destroy() {
    if (!this.isMounted) return;

    if (this.saveButton) {
      this.saveButton.destroy();
      this.saveButton = null;
    }

    if (this.container) {
      this.container.remove();
      this.container = null;
    }

    this.isMounted = false;
  }

  _buildArticleUrl() {
    if (this.article.hasDoi) {
      return `artigo.html?doi=${encodeURIComponent(this.article.doi)}`;
    }
    return '#';
  }

  _formatAuthors() {
    const first = this.article.firstAuthor;
    if (!first) return 'Autores desconhecidos';
    if (this.article.authorCount > 1) return `${first} et al.`;
    return first;
  }

  _truncateAbstract(abstract) {
    if (abstract.length <= this.abstractMaxLength) return abstract;
    return `${abstract.slice(0, this.abstractMaxLength).trim()}...`;
  }
}

export default ArticleCard;
