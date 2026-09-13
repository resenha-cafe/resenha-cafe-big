// src/components/search/filters.js

import { SEARCH_LANGUAGES } from '../../core/constants.js';
import { CONFIG } from '../../core/config.js';

/**
 * Componente visual de filtros para a busca.
 * Renderiza campos para ano inicial, ano final, idioma e acesso aberto.
 * Não conhece API nem SearchQuery; apenas lê os valores dos inputs.
 *
 * @example
 * const filters = new Filters({
 *   root: document.getElementById('filters'),
 *   onChange: (values) => console.log('Filtros alterados:', values)
 * });
 * filters.mount();
 * const values = filters.getValues();
 */
export class Filters {
  /**
   * @param {Object} options
   * @param {Node} options.root - Nó DOM onde o componente será montado.
   * @param {Function} [options.onChange] - Callback executado quando um filtro muda.
   *        Recebe um objeto com os valores atuais.
   * @param {Object} [options.initialValues] - Valores iniciais para os filtros.
   * @param {string} [options.initialValues.yearStart]
   * @param {string} [options.initialValues.yearEnd]
   * @param {string} [options.initialValues.language]
   * @param {boolean} [options.initialValues.openAccess]
   */
  constructor({
    root,
    onChange = null,
    initialValues = {},
  }) {
    if (!root || typeof root.appendChild !== 'function') {
      throw new Error('[Filters] root deve ser um nó DOM válido.');
    }

    this.root = root;
    this.onChange = onChange;
    this.initialValues = {
      yearStart: '',
      yearEnd: '',
      language: '',
      openAccess: false,
      ...initialValues,
    };

    this.container = null;
    this.yearStartInput = null;
    this.yearEndInput = null;
    this.languageSelect = null;
    this.openAccessCheckbox = null;
    this._boundChange = null;
    this._boundInput = null;
    this.isMounted = false;
    this._idPrefix = `filters-${Filters._nextId++}`;
  }

  static _nextId = 0;

  /**
   * Monta o componente no DOM.
   */
  mount() {
    if (this.isMounted) return;

    this.root.innerHTML = '';

    this.container = document.createElement('div');
    this.container.className = 'filters';

    // Ano inicial
    const yearStartId = `${this._idPrefix}-year-start`;
    const yearStartGroup = this._createFieldGroup('Ano inicial', yearStartId);
    this.yearStartInput = document.createElement('input');
    this.yearStartInput.type = 'number';
    this.yearStartInput.id = yearStartId;
    this.yearStartInput.className = 'filters__input';
    this.yearStartInput.min = CONFIG.MIN_YEAR;
    this.yearStartInput.max = new Date().getFullYear().toString();
    this.yearStartInput.placeholder = `Ex.: 2010`;
    this.yearStartInput.value = this.initialValues.yearStart;
    yearStartGroup.appendChild(this.yearStartInput);

    // Ano final
    const yearEndId = `${this._idPrefix}-year-end`;
    const yearEndGroup = this._createFieldGroup('Ano final', yearEndId);
    this.yearEndInput = document.createElement('input');
    this.yearEndInput.type = 'number';
    this.yearEndInput.id = yearEndId;
    this.yearEndInput.className = 'filters__input';
    this.yearEndInput.min = CONFIG.MIN_YEAR;
    this.yearEndInput.max = new Date().getFullYear().toString();
    this.yearEndInput.placeholder = `Ex.: 2025`;
    this.yearEndInput.value = this.initialValues.yearEnd;
    yearEndGroup.appendChild(this.yearEndInput);

    // Idioma
    const languageId = `${this._idPrefix}-language`;
    const languageGroup = this._createFieldGroup('Idioma', languageId);
    this.languageSelect = document.createElement('select');
    this.languageSelect.id = languageId;
    this.languageSelect.className = 'filters__select';

    // Opção "Todos"
    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = 'Todos';
    if (this.initialValues.language === '') {
      allOption.selected = true;
    }
    this.languageSelect.appendChild(allOption);

    // Opções a partir de SEARCH_LANGUAGES
    SEARCH_LANGUAGES.forEach((lang) => {
      const option = document.createElement('option');
      option.value = lang.value;
      option.textContent = lang.label;
      if (lang.value === this.initialValues.language) {
        option.selected = true;
      }
      this.languageSelect.appendChild(option);
    });
    languageGroup.appendChild(this.languageSelect);

    // Acesso aberto
    const openAccessId = `${this._idPrefix}-open-access`;
    const openAccessGroup = this._createFieldGroup('Acesso aberto', openAccessId);
    this.openAccessCheckbox = document.createElement('input');
    this.openAccessCheckbox.type = 'checkbox';
    this.openAccessCheckbox.id = openAccessId;
    this.openAccessCheckbox.className = 'filters__checkbox';
    this.openAccessCheckbox.checked = Boolean(this.initialValues.openAccess);
    const checkboxLabel = document.createElement('label');
    checkboxLabel.htmlFor = openAccessId;
    checkboxLabel.textContent = 'Somente artigos de acesso aberto';
    openAccessGroup.appendChild(this.openAccessCheckbox);
    openAccessGroup.appendChild(checkboxLabel);

    // Montagem
    this.container.appendChild(yearStartGroup);
    this.container.appendChild(yearEndGroup);
    this.container.appendChild(languageGroup);
    this.container.appendChild(openAccessGroup);
    this.root.appendChild(this.container);

    // Event listeners
    this._boundChange = () => {
      if (typeof this.onChange === 'function') {
        this.onChange(this.getValues());
      }
    };
    this._boundInput = () => {
      if (typeof this.onChange === 'function') {
        this.onChange(this.getValues());
      }
    };

    // Usamos change para selects e checkbox, e input para campos de ano
    this.container.addEventListener('change', this._boundChange);
    this.yearStartInput.addEventListener('input', this._boundInput);
    this.yearEndInput.addEventListener('input', this._boundInput);

    this.isMounted = true;
  }

  /**
   * Remove o componente do DOM e limpa event listeners.
   */
  destroy() {
    if (!this.isMounted) return;

    if (this._boundChange) {
      this.container.removeEventListener('change', this._boundChange);
      this._boundChange = null;
    }
    if (this._boundInput) {
      this.yearStartInput.removeEventListener('input', this._boundInput);
      this.yearEndInput.removeEventListener('input', this._boundInput);
      this._boundInput = null;
    }

    if (this.container) {
      this.container.remove();
      this.container = null;
      this.yearStartInput = null;
      this.yearEndInput = null;
      this.languageSelect = null;
      this.openAccessCheckbox = null;
    }

    this.isMounted = false;
  }

  /**
   * Retorna um objeto com os valores atuais dos filtros.
   * @returns {{ yearStart: string, yearEnd: string, language: string, openAccess: boolean }}
   */
  getValues() {
    return {
      yearStart: this.yearStartInput ? this.yearStartInput.value : '',
      yearEnd: this.yearEndInput ? this.yearEndInput.value : '',
      language: this.languageSelect ? this.languageSelect.value : '',
      openAccess: this.openAccessCheckbox ? this.openAccessCheckbox.checked : false,
    };
  }

  /**
   * Define os valores dos filtros.
   * @param {Object} values
   * @param {string} [values.yearStart]
   * @param {string} [values.yearEnd]
   * @param {string} [values.language]
   * @param {boolean} [values.openAccess]
   */
  setValues({ yearStart, yearEnd, language, openAccess } = {}) {
    if (yearStart !== undefined && this.yearStartInput) {
      this.yearStartInput.value = yearStart;
    }
    if (yearEnd !== undefined && this.yearEndInput) {
      this.yearEndInput.value = yearEnd;
    }
    if (language !== undefined && this.languageSelect) {
      this.languageSelect.value = language;
    }
    if (openAccess !== undefined && this.openAccessCheckbox) {
      this.openAccessCheckbox.checked = Boolean(openAccess);
    }
  }

  /**
   * Cria um grupo de campo com label e associação correta.
   * @param {string} labelText
   * @param {string} inputId - ID do input a ser associado
   * @returns {HTMLElement}
   * @private
   */
  _createFieldGroup(labelText, inputId) {
    const group = document.createElement('div');
    group.className = 'filters__field';

    const label = document.createElement('label');
    label.className = 'filters__label';
    label.textContent = labelText;
    label.setAttribute('for', inputId);

    group.appendChild(label);
    return group;
  }
}

export default Filters;