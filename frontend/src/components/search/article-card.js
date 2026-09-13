// src/components/search/article-card.js

import { Article } from '../../domain/article.js';
import { formatPublicationDate } from '../../utils/format-date.js';

/**
 * Componente visual de card de artigo.
 * Exibe informações essenciais de um artigo (título, autores, periódico,
 * data, resumo curto e indicadores) em um cartão.
 *
 * O card não chama API nem conhece SearchService. A navegação para a página
 * do artigo é feita via link normal (`<a href="artigo.html?doi=...">`),
 * se o artigo tiver DOI. Caso contrário, o título é renderizado como texto puro.
 *
 * @example
 * const card = new ArticleCard({
 *   root: document.getElementById('article-list'),
 *   article: articleInstance,
 *   onSave: (article) => console.log('Salvar artigo', article.doi),
 *   abstractMaxLength: 180
 * });
 * card.mount();
 */
export class ArticleCard {
  /**
   * @param {Object} options
   * @param {Node} options.root - Nó DOM onde o card será montado.
   * @param {Article} options.article - Instância de Article a ser exibida.
   * @param {Function} [options.onSave] - Callback opcional para ação de salvar.
   *        Recebe a instância de Article.
   * @param {number} [options.abstractMaxLength = 200] - Comprimento máximo do resumo.
   */
  constructor({
    root,
    article,
    onSave = null,
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
    this.onSave = onSave;
    this.abstractMaxLength = Number(abstractMaxLength) || 200;

    this.container = null;
    this._saveButton = null;
    this._boundSaveClick = null;
    this.isMounted = false;
    this.isSaving = false;
    this.isSaved = false;
  }

  /**
   * Monta o card no DOM.
   */
  mount() {
    if (this.isMounted) return;

    // Cria o elemento principal
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

    // Indicador de acesso aberto
    if (this.article.openAccess) {
      const openAccessBadge = document.createElement('span');
      openAccessBadge.className = 'article-card__badge article-card__badge--open-access';
      openAccessBadge.textContent = 'Acesso Aberto';
      footer.appendChild(openAccessBadge);
    }

    // Número de citações
    if (this.article.hasCitations) {
      const citations = document.createElement('span');
      citations.className = 'article-card__citations';
      citations.textContent = `${this.article.citations} citações`;
      footer.appendChild(citations);
    }

    // Botão salvar (opcional)
    if (typeof this.onSave === 'function') {
      this._saveButton = document.createElement('button');
      this._saveButton.type = 'button';
      this._saveButton.className = 'article-card__save';
      this._saveButton.textContent = 'Salvar';
      this._saveButton.setAttribute('aria-label', `Salvar artigo: ${this.article.displayTitle}`);
      this._boundSaveClick = () => this._handleSaveClick();
      this._saveButton.addEventListener('click', this._boundSaveClick);
      footer.appendChild(this._saveButton);
    }

    if (footer.children.length > 0) {
      this.container.appendChild(footer);
    }

    this.root.appendChild(this.container);
    this.isMounted = true;
  }

  /**
   * Remove o card do DOM e limpa event listeners.
   */
  destroy() {
    if (!this.isMounted) return;

    if (this._saveButton && this._boundSaveClick) {
      this._saveButton.removeEventListener('click', this._boundSaveClick);
      this._boundSaveClick = null;
    }

    if (this.container) {
      this.container.remove();
      this.container = null;
      this._saveButton = null;
    }

    this.isMounted = false;
  }

  /**
   * Atualiza o estado visual do botão de salvar.
   * @param {Object} state
   * @param {boolean} [state.isSaving] - Indica se a ação está em progresso.
   * @param {boolean} [state.isSaved] - Indica se o artigo já foi salvo.
   */
  setSaveState({ isSaving = false, isSaved = false } = {}) {
    this.isSaving = Boolean(isSaving);
    this.isSaved = Boolean(isSaved);

    if (!this._saveButton || !this.isMounted) return;

    this._saveButton.disabled = this.isSaving || this.isSaved;
    if (this.isSaving) {
      this._saveButton.textContent = 'Salvando...';
    } else if (this.isSaved) {
      this._saveButton.textContent = 'Salvo ✓';
    } else {
      this._saveButton.textContent = 'Salvar';
    }
  }

  /**
   * Constrói a URL para a página do artigo.
   * @returns {string}
   * @private
   */
  _buildArticleUrl() {
    if (this.article.hasDoi) {
      return `artigo.html?doi=${encodeURIComponent(this.article.doi)}`;
    }
    return '#';
  }

  /**
   * Formata a lista de autores para exibição compacta.
   * @returns {string}
   * @private
   */
  _formatAuthors() {
    const first = this.article.firstAuthor;
    if (!first) return 'Autores desconhecidos';

    if (this.article.authorCount > 1) {
      return `${first} et al.`;
    }
    return first;
  }

  /**
   * Trunca o resumo para um comprimento máximo.
   * @param {string} abstract
   * @returns {string}
   * @private
   */
  _truncateAbstract(abstract) {
    if (abstract.length <= this.abstractMaxLength) return abstract;
    return `${abstract.slice(0, this.abstractMaxLength).trim()}...`;
  }

  /**
   * Trata o clique no botão salvar, chamando o callback e atualizando o estado.
   * @private
   */
  _handleSaveClick() {
    if (typeof this.onSave !== 'function') return;
    if (this.isSaving || this.isSaved) return;

    // A página pode chamar setSaveState para controlar o feedback.
    // Aqui apenas disparamos o callback; o estado real deve ser gerenciado pela página,
    // mas podemos fornecer um estado temporário de "salvando" se desejado.
    this.onSave(this.article);
  }
}

export default ArticleCard;