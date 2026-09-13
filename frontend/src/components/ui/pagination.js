// src/components/ui/pagination.js

/**
 * Componente visual de paginação.
 * Renderiza botões de páginas com suporte a reticências para muitas páginas.
 * Dispara callback `onPageChange` quando o usuário seleciona uma página.
 *
 * @example
 * const pagination = new Pagination({
 *   root: document.getElementById('pagination'),
 *   currentPage: 1,
 *   totalPages: 10,
 *   onPageChange: (page) => console.log('Ir para página', page)
 * });
 * pagination.mount();
 */
export class Pagination {
  /**
   * @param {Object} options
   * @param {Node} options.root - Nó DOM onde a paginação será montada.
   * @param {number} [options.currentPage = 1] - Página atual (1‑based).
   * @param {number} [options.totalPages = 1] - Total de páginas.
   * @param {Function} [options.onPageChange] - Callback ao trocar de página.
   * @param {number} [options.maxVisiblePages = 5] - Máximo de números visíveis (mínimo 3).
   * @param {{ prev?: string, next?: string }} [options.labels]
   */
  constructor({
    root,
    currentPage = 1,
    totalPages = 1,
    onPageChange = null,
    maxVisiblePages = 5,
    labels = { prev: 'Anterior', next: 'Próxima' },
  }) {
    if (!root || typeof root.appendChild !== 'function') {
      throw new Error('[Pagination] root deve ser um nó DOM válido.');
    }

    this.root = root;
    this.onPageChange = onPageChange;
    // Garante no mínimo 3 para que o algoritmo de reticências funcione corretamente
    this.maxVisiblePages = Math.max(Number(maxVisiblePages) || 5, 3);
    this.labels = { prev: 'Anterior', next: 'Próxima', ...labels };

    // Normaliza totalPages primeiro, garantindo mínimo 1
    this.totalPages = Math.max(Number(totalPages) || 1, 1);

    // Normaliza currentPage, limitando entre 1 e totalPages
    this.currentPage = Math.min(
      Math.max(Number(currentPage) || 1, 1),
      this.totalPages
    );

    this.container = null;
    this._boundClickHandler = null;
    this.isMounted = false;
  }

  /**
   * Monta o componente no DOM.
   */
  mount() {
    if (this.isMounted) return;

    this.root.innerHTML = '';

    this.container = document.createElement('nav');
    this.container.className = 'pagination';
    this.container.setAttribute('aria-label', 'Paginação');

    this._render();
    this.root.appendChild(this.container);

    this._boundClickHandler = (event) => this._handleClick(event);
    this.container.addEventListener('click', this._boundClickHandler);

    this.isMounted = true;
  }

  /**
   * Remove o componente do DOM e limpa event listeners.
   */
  destroy() {
    if (!this.isMounted) return;

    if (this._boundClickHandler) {
      this.container.removeEventListener('click', this._boundClickHandler);
      this._boundClickHandler = null;
    }

    if (this.container) {
      this.container.remove();
      this.container = null;
    }

    this.isMounted = false;
  }

  /**
   * Atualiza os dados da paginação sem necessidade de desmontar/remontar.
   * Ajusta automaticamente `currentPage` se exceder o novo total.
   * @param {Object} options
   * @param {number} [options.currentPage]
   * @param {number} [options.totalPages]
   */
  update({ currentPage, totalPages } = {}) {
    if (!this.isMounted) return;

    if (totalPages !== undefined) {
      this.totalPages = Math.max(Number(totalPages) || 1, 1);
    }

    if (currentPage !== undefined) {
      this.currentPage = Math.min(
        Math.max(Number(currentPage) || 1, 1),
        this.totalPages
      );
    } else {
      // Se currentPage não foi passado, garante que ainda esteja dentro do novo total
      this.currentPage = Math.min(this.currentPage, this.totalPages);
    }

    this._render();
  }

  /**
   * Gera a lista de itens (números e 'ellipsis') a serem exibidos.
   * @returns {Array<number|string>}
   * @private
   */
  _generatePageItems() {
    const total = this.totalPages;
    const current = this.currentPage;
    const max = this.maxVisiblePages;

    if (total <= max) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const items = [];
    const first = 1;
    const last = total;

    // Sempre mostra a primeira e a última
    items.push(first);

    // Calcula o intervalo ao redor da página atual
    let start = Math.max(current - Math.floor((max - 3) / 2), 2);
    let end = Math.min(start + max - 4, last - 1);

    if (end - start + 1 < max - 3) {
      start = Math.max(end - (max - 4), 2);
    }

    // Adiciona reticências após o primeiro se necessário
    if (start > 2) {
      items.push('ellipsis-start');
    }

    // Adiciona as páginas do intervalo
    for (let i = start; i <= end; i++) {
      items.push(i);
    }

    // Adiciona reticências antes do último se necessário
    if (end < last - 1) {
      items.push('ellipsis-end');
    }

    // Adiciona a última página
    items.push(last);

    return items;
  }

  /**
   * Renderiza os botões da paginação com base no estado atual.
   * @private
   */
  _render() {
    if (!this.container) return;

    this.container.innerHTML = '';

    // Botão "Anterior"
    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'pagination__button pagination__button--prev';
    prevBtn.textContent = this.labels.prev;
    prevBtn.disabled = this.currentPage <= 1;
    prevBtn.setAttribute('aria-label', 'Página anterior');
    if (!prevBtn.disabled) {
      prevBtn.dataset.page = String(this.currentPage - 1);
    }
    this.container.appendChild(prevBtn);

    // Itens de página
    const items = this._generatePageItems();
    items.forEach((item) => {
      if (typeof item === 'number') {
        const pageBtn = document.createElement('button');
        pageBtn.type = 'button';
        pageBtn.className = 'pagination__button pagination__button--page';
        pageBtn.textContent = item;
        pageBtn.dataset.page = String(item);
        if (item === this.currentPage) {
          pageBtn.classList.add('pagination__button--active');
          pageBtn.setAttribute('aria-current', 'page');
        }
        this.container.appendChild(pageBtn);
      } else {
        // Reticências
        const ellipsis = document.createElement('span');
        ellipsis.className = 'pagination__ellipsis';
        ellipsis.textContent = '…';
        ellipsis.setAttribute('aria-hidden', 'true');
        this.container.appendChild(ellipsis);
      }
    });

    // Botão "Próxima"
    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'pagination__button pagination__button--next';
    nextBtn.textContent = this.labels.next;
    nextBtn.disabled = this.currentPage >= this.totalPages;
    nextBtn.setAttribute('aria-label', 'Próxima página');
    if (!nextBtn.disabled) {
      nextBtn.dataset.page = String(this.currentPage + 1);
    }
    this.container.appendChild(nextBtn);
  }

  /**
   * Trata cliques nos botões de página.
   * @param {MouseEvent} event
   * @private
   */
  _handleClick(event) {
    const button = event.target.closest('button[data-page]');
    if (!button || button.disabled) return;

    const page = Number(button.dataset.page);
    if (page < 1 || page > this.totalPages) return;

    if (typeof this.onPageChange === 'function') {
      this.onPageChange(page);
    }
  }
}

export default Pagination;