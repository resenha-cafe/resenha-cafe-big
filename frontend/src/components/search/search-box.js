// src/components/search/search-box.js

import { SearchQuery } from '../../domain/search-query.js';

/**
 * Componente visual da caixa de busca.
 * Responsável apenas pela interface: campo de texto, botão submit,
 * estado de carregamento e validação básica de interação.
 *
 * Não chama API diretamente nem conhece SearchService.
 * A página é responsável por fornecer os valores dos filtros
 * (via `getFilterValues`) e por executar a busca.
 *
 * @example
 * const searchBox = new SearchBox({
 *   root: document.getElementById('search-box'),
 *   onSearch: (searchQuery) => minhaPagina.handleSearch(searchQuery),
 *   getFilterValues: () => filtros.getValues()
 * });
 * searchBox.mount();
 */
export class SearchBox {
  /**
   * @param {Object} options
   * @param {Node} options.root - Nó DOM onde o componente será montado.
   * @param {Function} options.onSearch - Callback executado ao submeter a busca.
   *        Recebe uma instância de SearchQuery.
   * @param {Function} [options.getFilterValues] - Função que retorna um objeto
   *        com os valores atuais dos filtros (ex.: { yearStart, yearEnd, language, openAccess }).
   * @param {boolean} [options.loading = false] - Estado inicial de carregamento.
   * @param {string} [options.placeholder = 'Buscar artigos científicos...']
   * @param {string} [options.buttonLabel = 'Buscar']
   * @param {number} [options.minLength = 2] - Tamanho mínimo da consulta.
   * @param {string} [options.errorMessage] - Mensagem de erro para consulta curta.
   */
  constructor({
    root,
    onSearch,
    getFilterValues = null,
    loading = false,
    placeholder = 'Buscar artigos científicos...',
    buttonLabel = 'Buscar',
    minLength = 2,
    errorMessage = null,
  }) {
    if (!root || typeof root.appendChild !== 'function') {
      throw new Error('[SearchBox] root deve ser um nó DOM válido.');
    }
    if (typeof onSearch !== 'function') {
      throw new Error('[SearchBox] onSearch deve ser uma função.');
    }

    this.root = root;
    this.onSearch = onSearch;
    this.getFilterValues = getFilterValues;
    this.loading = Boolean(loading);
    this.placeholder = placeholder;
    this.buttonLabel = buttonLabel;
    this.minLength = Number(minLength) || 2;
    this.errorMessage = errorMessage || `Digite pelo menos ${this.minLength} caracteres para buscar.`;

    this.form = null;
    this.input = null;
    this.button = null;
    this.errorEl = null;
    this._boundSubmit = null;
    this._boundInput = null;
    this.isMounted = false;
    this._inputId = `search-box-input-${SearchBox._nextId++}`;
  }

  static _nextId = 0;

  /**
   * Monta o componente no DOM.
   */
  mount() {
    if (this.isMounted) return;

    this.root.innerHTML = '';

    // Formulário
    this.form = document.createElement('form');
    this.form.className = 'search-box';
    this.form.setAttribute('role', 'search');
    this.form.setAttribute('novalidate', '');

    // Label do campo
    const label = document.createElement('label');
    label.className = 'search-box__label';
    label.textContent = 'Buscar artigos';
    label.setAttribute('for', this._inputId);

    // Campo de busca
    this.input = document.createElement('input');
    this.input.type = 'search';
    this.input.id = this._inputId;
    this.input.className = 'search-box__input';
    this.input.placeholder = this.placeholder;
    this.input.autocomplete = 'off';
    this.input.setAttribute('aria-label', this.placeholder);
    this.input.disabled = this.loading;

    // Botão submit
    this.button = document.createElement('button');
    this.button.type = 'submit';
    this.button.className = 'search-box__button';
    this.button.disabled = this.loading;
    this.button.textContent = this.loading ? 'Buscando...' : this.buttonLabel;

    // Elemento para mensagem de erro (inicialmente oculto)
    this.errorEl = document.createElement('p');
    this.errorEl.className = 'search-box__error';
    this.errorEl.setAttribute('role', 'alert');
    this.errorEl.setAttribute('aria-live', 'polite');
    this.errorEl.hidden = true;

    // Montagem
    this.form.appendChild(label);
    this.form.appendChild(this.input);
    this.form.appendChild(this.button);
    this.form.appendChild(this.errorEl);
    this.root.appendChild(this.form);

    // Estado de carregamento inicial
    this._updateLoadingState();

    // Event listeners
    this._boundSubmit = (event) => this._handleSubmit(event);
    this.form.addEventListener('submit', this._boundSubmit);

    this._boundInput = () => this._clearError();
    this.input.addEventListener('input', this._boundInput);

    this.isMounted = true;
  }

  /**
   * Remove o componente do DOM e limpa event listeners.
   */
  destroy() {
    if (!this.isMounted) return;

    if (this._boundSubmit) {
      this.form.removeEventListener('submit', this._boundSubmit);
      this._boundSubmit = null;
    }
    if (this._boundInput) {
      this.input.removeEventListener('input', this._boundInput);
      this._boundInput = null;
    }

    if (this.form) {
      this.form.remove();
      this.form = null;
      this.input = null;
      this.button = null;
      this.errorEl = null;
    }

    this.isMounted = false;
  }

  /**
   * Atualiza o estado de carregamento da interface.
   * @param {boolean} loading
   */
  setLoading(loading) {
    this.loading = Boolean(loading);
    if (this.isMounted) {
      this._updateLoadingState();
    }
  }

  /**
   * Aplica o estado de carregamento nos elementos visuais.
   * @private
   */
  _updateLoadingState() {
    if (!this.form) return;

    this.input.disabled = this.loading;
    this.button.disabled = this.loading;
    this.button.textContent = this.loading ? 'Buscando...' : this.buttonLabel;

    if (this.loading) {
      this.form.setAttribute('aria-busy', 'true');
    } else {
      this.form.removeAttribute('aria-busy');
    }
  }

  /**
   * Monta uma SearchQuery a partir do valor do input e dos filtros fornecidos.
   * @returns {SearchQuery | null}
   * @private
   */
  _buildSearchQuery() {
    const query = this.input.value.trim();
    if (query.length < this.minLength) {
      return null;
    }

    // Coleta os valores dos filtros via callback (se existir)
    const filterValues = this.getFilterValues ? this.getFilterValues() : {};

    // Constrói um FormData com os dados para aproveitar a normalização do SearchQuery
    const formData = new FormData();
    formData.append('query', query);

    Object.entries(filterValues).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;

      // Tratamento específico para booleanos: só envia se true
      if (typeof value === 'boolean') {
        if (value) {
          formData.append(key, 'true');
        }
        // Se false, não adiciona (omite)
        return;
      }

      // Outros tipos são convertidos para string
      formData.append(key, String(value));
    });

    return SearchQuery.fromFormData(formData);
  }

  /**
   * Trata o evento de submit do formulário.
   * @param {SubmitEvent} event
   * @private
   */
  _handleSubmit(event) {
    event.preventDefault();
    this._clearError();

    const searchQuery = this._buildSearchQuery();

    if (!searchQuery) {
      this._showError(this.errorMessage);
      this.input.focus();
      return;
    }

    this.onSearch(searchQuery);
  }

  /**
   * Exibe uma mensagem de erro.
   * @param {string} message
   * @private
   */
  _showError(message) {
    if (!this.errorEl) return;
    this.errorEl.textContent = message;
    this.errorEl.hidden = false;
  }

  /**
   * Limpa a mensagem de erro.
   * @private
   */
  _clearError() {
    if (!this.errorEl) return;
    this.errorEl.hidden = true;
    this.errorEl.textContent = '';
  }
}

export default SearchBox;