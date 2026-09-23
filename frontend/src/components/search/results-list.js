// src/components/search/results-list.js

import { ArticleCard } from './article-card.js';
import { Article } from '../../domain/article.js';
import { SearchResult } from '../../domain/search-result.js';

/**
 * Componente visual para lista de resultados de busca.
 * Renderiza uma coleção de artigos usando `ArticleCard`.
 * Aceita `Article[]` ou um `SearchResult`.
 */
export class ResultsList {
  /**
   * @param {Object} options
   * @param {Node} options.root - Nó DOM onde a lista será montada.
   * @param {Article[]|SearchResult} [options.items = []]
   * @param {LibraryService} [options.libraryService] - Serviço de biblioteca repassado aos cards.
   */
  constructor({ root, items = [], libraryService = null }) {
    if (!root || typeof root.appendChild !== 'function') {
      throw new Error('[ResultsList] root deve ser um nó DOM válido.');
    }

    this.root = root;
    this.articles = this._extractAndValidate(items);
    this.libraryService = libraryService;

    this.container = null;
    this.cards = [];
    this.isMounted = false;
  }

  mount() {
    if (this.isMounted) return;
    this.root.innerHTML = '';
    this.container = document.createElement('ul');
    this.container.className = 'results-list';
    this._renderCards();
    this.root.appendChild(this.container);
    this.isMounted = true;
  }

  destroy() {
    if (!this.isMounted) return;
    this.cards.forEach((card) => card.destroy());
    this.cards = [];
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    this.isMounted = false;
  }

  update(items) {
    this.articles = this._extractAndValidate(items);
    if (!this.isMounted) return;
    this.cards.forEach((card) => card.destroy());
    this.cards = [];
    this._renderCards();
  }

  _extractAndValidate(items) {
    if (!items) return [];
    let articles;
    if (Array.isArray(items)) {
      articles = items;
    } else if (items instanceof SearchResult) {
      articles = items.articles || [];
    } else {
      articles = [];
    }

    if (!articles.every((article) => article instanceof Article)) {
      throw new TypeError('[ResultsList] Todos os itens devem ser instâncias de Article.');
    }

    return articles;
  }

  _renderCards() {
    if (!this.container) return;
    this.container.innerHTML = '';
    if (this.articles.length === 0) return;

    this.articles.forEach((article) => {
      const listItem = document.createElement('li');
      listItem.className = 'results-list__item';
      const card = new ArticleCard({
        root: listItem,
        article,
        libraryService: this.libraryService,
      });
      card.mount();
      this.cards.push(card);
      this.container.appendChild(listItem);
    });
  }
}

export default ResultsList;
