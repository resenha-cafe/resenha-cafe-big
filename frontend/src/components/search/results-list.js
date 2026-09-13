// src/components/search/results-list.js

import { ArticleCard } from './article-card.js';
import { Article } from '../../domain/article.js';
import { SearchResult } from '../../domain/search-result.js';

/**
 * Componente visual para lista de resultados de busca.
 * Renderiza uma coleção de artigos usando `ArticleCard`, dentro de uma lista semântica (`<ul>`/`<li>`).
 * A atualização (`update`) mantém o componente montado, mas recria internamente os cards.
 *
 * @example
 * const list = new ResultsList({
 *   root: document.getElementById('results'),
 *   items: searchResult,
 *   onSave: (article) => biblioteca.salvar(article)
 * });
 * list.mount();
 * list.update(newSearchResult);
 */
export class ResultsList {
  /**
   * @param {Object} options
   * @param {Node} options.root - Nó DOM onde a lista será montada.
   * @param {Article[]|SearchResult} [options.items = []] - Lista de artigos ou SearchResult.
   * @param {Function} [options.onSave] - Callback para ação de salvar artigo.
   */
  constructor({ root, items = [], onSave = null }) {
    if (!root || typeof root.appendChild !== 'function') {
      throw new Error('[ResultsList] root deve ser um nó DOM válido.');
    }

    this.root = root;
    this.articles = this._extractAndValidate(items);
    this.onSave = onSave;

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
    this.cards.forEach(card => card.destroy());
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
    this.cards.forEach(card => card.destroy());
    this.cards = [];
    this._renderCards();
  }

  _extractAndValidate(items) {
    let articles;
    if (Array.isArray(items)) {
      articles = items;
    } else if (items instanceof SearchResult) {
      articles = items.articles;
    } else {
      articles = [];
    }

    if (!articles.every(article => article instanceof Article)) {
      throw new TypeError('[ResultsList] Todos os itens devem ser instâncias de Article.');
    }

    return articles;
  }

  _renderCards() {
    if (!this.container) return;
    this.container.innerHTML = '';
    if (this.articles.length === 0) return;

    this.articles.forEach(article => {
      const listItem = document.createElement('li');
      listItem.className = 'results-list__item';
      const card = new ArticleCard({
        root: listItem,
        article,
        onSave: this.onSave,
      });
      card.mount();
      this.cards.push(card);
      this.container.appendChild(listItem);
    });
  }
}

export default ResultsList;