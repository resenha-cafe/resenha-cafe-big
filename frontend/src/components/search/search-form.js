// src/components/search/search-form.js

import { SearchBox } from './search-box.js';
import { Filters } from './filters.js';

/**
 * Componente visual que agrupa todos os controles de busca:
 * - Campo de busca (via SearchBox)
 * - Filtros: ano inicial, ano final, idioma, acesso aberto (via Filters)
 * - Campo de limite de resultados
 *
 * Não chama SearchService diretamente. A página deve fornecer
 * um callback `onSubmit` que recebe uma instância de `SearchQuery`.
 *
 * Durante o carregamento, todos os controles são desabilitados
 * através de um `<fieldset disabled>`.
 *
 * @example
 * const form = new SearchForm({
 *   root: document.getElementById('search-form'),
 *   onSubmit: async (searchQuery) => {
 *     const result = await searchService.search(searchQuery);
 *     resultsList.update(result);
 *   },
 *   initialValues: { query: 'machine learning', limit: 20 }
 * });
 * form.mount();
 */
export class SearchForm {
  /**
   * @param {Object} options
   * @param {Node} options.root - Nó DOM onde o formulário será montado.
   * @param {Function} options.onSubmit - Callback executado ao submeter a busca.
   *        Recebe uma instância de SearchQuery.
   * @param {Object} [options.initialValues] - Valores iniciais.
   * @param {string} [options.initialValues.query]
   * @param {string} [options.initialValues.yearStart]
   * @param {string} [options.initialValues.yearEnd]
   * @param {string} [options.initialValues.language]
   * @param {boolean} [options.initialValues.openAccess]
   * @param {number|string} [options.initialValues.limit]
   * @param {boolean} [options.loading = false] - Estado inicial de carregamento.
   */
  constructor({ root, onSubmit, initialValues = {}, loading = false }) {
    if (!root || typeof root.appendChild !== 'function') {
      throw new Error('[SearchForm] root deve ser um nó DOM válido.');
    }
    if (typeof onSubmit !== 'function') {
      throw new Error('[SearchForm] onSubmit deve ser uma função.');
    }

    this.root = root;
    this.onSubmit = onSubmit;
    this.initialValues = {
      query: '',
      yearStart: '',
      yearEnd: '',
      language: '',
      openAccess: false,
      limit: '',
      ...initialValues,
    };
    this.loading = Boolean(loading);

    this.container = null;
    this.fieldset = null;
    this.searchBox = null;
    this.filters = null;
    this.limitInput = null;
    this._limitContainer = null;
    this._limitInputId = `search-form-limit-${SearchForm._nextId++}`;

    this.isMounted = false;
  }

  static _nextId = 0;

  /**
   * Monta o formulário completo no DOM.
   */
  mount() {
    if (this.isMounted) return;

    this.root.innerHTML = '';

    // Contêiner principal
    this.container = document.createElement('div');
    this.container.className = 'search-form';

    // Fieldset para agrupar e desabilitar todos os controles
    this.fieldset = document.createElement('fieldset');
    this.fieldset.className = 'search-form__fieldset';
    this.fieldset.disabled = this.loading;

    // Subcontêiner para SearchBox
    const searchBoxContainer = document.createElement('div');
    searchBoxContainer.className = 'search-form__search-box';
    this.fieldset.appendChild(searchBoxContainer);

    // Subcontêiner para Filters
    const filtersContainer = document.createElement('div');
    filtersContainer.className = 'search-form__filters';
    this.fieldset.appendChild(filtersContainer);

    // Subcontêiner para limite
    this._limitContainer = document.createElement('div');
    this._limitContainer.className = 'search-form__limit';
    this.fieldset.appendChild(this._limitContainer);

    this.container.appendChild(this.fieldset);

    // Cria campo de limite
    this._createLimitField();

    // Monta Filters
    this.filters = new Filters({
      root: filtersContainer,
      initialValues: {
        yearStart: this.initialValues.yearStart,
        yearEnd: this.initialValues.yearEnd,
        language: this.initialValues.language,
        openAccess: this.initialValues.openAccess,
      },
    });
    this.filters.mount();

    // Monta SearchBox, passando getFilterValues e valor inicial
    this.searchBox = new SearchBox({
      root: searchBoxContainer,
      onSearch: (searchQuery) => this._handleSubmit(searchQuery),
      getFilterValues: () => this._getFilterValues(),
      initialValue: this.initialValues.query,
      loading: this.loading,
      placeholder: 'Buscar artigos científicos...',
      buttonLabel: 'Buscar',
      minLength: 2,
    });
    this.searchBox.mount();

    this.root.appendChild(this.container);
    this.isMounted = true;

    // Atualiza aria-busy e disabled
    this._updateLoadingState();
  }

  /**
   * Remove o formulário do DOM e limpa event listeners internos.
   */
  destroy() {
    if (!this.isMounted) return;

    if (this.searchBox) {
      this.searchBox.destroy();
      this.searchBox = null;
    }

    if (this.filters) {
      this.filters.destroy();
      this.filters = null;
    }

    if (this.container) {
      this.container.remove();
      this.container = null;
      this.fieldset = null;
      this.limitInput = null;
      this._limitContainer = null;
    }

    this.isMounted = false;
  }

  /**
   * Atualiza o estado de carregamento (desabilita todos os controles).
   * @param {boolean} loading
   */
  setLoading(loading) {
    this.loading = Boolean(loading);
    if (!this.isMounted) return;

    if (this.searchBox) {
      this.searchBox.setLoading(this.loading);
    }

    // Desabilita todos os controles dentro do fieldset
    if (this.fieldset) {
      this.fieldset.disabled = this.loading;
    }

    this._updateLoadingState();
  }

  /**
   * Cria o campo de limite de resultados com ID único.
   * @private
   */
  _createLimitField() {
    if (!this._limitContainer) return;

    this._limitContainer.innerHTML = '';

    const label = document.createElement('label');
    label.className = 'search-form__limit-label';
    label.textContent = 'Limite de resultados';
    label.setAttribute('for', this._limitInputId);

    this.limitInput = document.createElement('input');
    this.limitInput.type = 'number';
    this.limitInput.id = this._limitInputId;
    this.limitInput.className = 'search-form__limit-input';
    this.limitInput.min = '1';
    this.limitInput.max = '100';
    this.limitInput.placeholder = '20';
    this.limitInput.value = this.initialValues.limit;

    this._limitContainer.appendChild(label);
    this._limitContainer.appendChild(this.limitInput);
  }

  /**
   * Retorna os valores combinados dos filtros e do limite.
   * É passada como `getFilterValues` ao SearchBox.
   *
   * @returns {Object}
   * @private
   */
  _getFilterValues() {
    const filters = this.filters ? this.filters.getValues() : {};
    return {
      ...filters,
      limit: this.limitInput ? this.limitInput.value : '',
    };
  }

  /**
   * Trata o submit vindo do SearchBox.
   * @param {SearchQuery} searchQuery
   * @private
   */
  _handleSubmit(searchQuery) {
    this.onSubmit(searchQuery);
  }

  /**
   * Aplica o estado de carregamento no contêiner.
   * @private
   */
  _updateLoadingState() {
    if (!this.container) return;

    if (this.loading) {
      this.container.setAttribute('aria-busy', 'true');
    } else {
      this.container.removeAttribute('aria-busy');
    }
  }
}

export default SearchForm;