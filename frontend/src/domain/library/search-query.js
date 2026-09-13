// src/domain/search-query.js

import { CONFIG } from '../core/config.js';
import { SEARCH_LANGUAGES, ERROR_MESSAGES } from '../core/constants.js';
import { deepFreeze } from '../utils/deep-freeze.js';

export class SearchQuery {
  constructor(data = {}) {
    this.query = typeof data.query === 'string' ? data.query.trim() : '';

    const limit = Number(data.limit ?? CONFIG.DEFAULT_SEARCH_LIMIT);
    this.limit = Number.isFinite(limit) && limit > 0
      ? Math.min(Math.floor(limit), CONFIG.MAX_SEARCH_LIMIT)
      : CONFIG.DEFAULT_SEARCH_LIMIT;

    const errors = [];

    // Parse dos anos: ausente → null, inválido → null + erro
    this.yearStart = this._parseYear(data.yearStart, errors);
    this.yearEnd = this._parseYear(data.yearEnd, errors);

    // Verifica inversão de intervalo
    if (this.yearStart !== null && this.yearEnd !== null && this.yearStart > this.yearEnd) {
      errors.push(ERROR_MESSAGES.YEAR_RANGE_INVALID);
    }

    // Idioma: se informado, valida; inválido gera erro e vira ''
    const langValue = typeof data.language === 'string' ? data.language.toLowerCase() : '';
    if (langValue) {
      const allowedLanguages = SEARCH_LANGUAGES.map((lang) => lang.value);
      if (!allowedLanguages.includes(langValue)) {
        errors.push(ERROR_MESSAGES.INVALID_LANGUAGE);
        this.language = '';
      } else {
        this.language = langValue;
      }
    } else {
      this.language = '';
    }

    this.openAccess = data.openAccess === true || data.openAccess === 'true';

    this._validationErrors = Object.freeze([...errors]);

    deepFreeze(this);
  }

  get isEmpty() {
    return this.query.length === 0;
  }

  get isValid() {
    return this.validationErrors().length === 0;
  }

  validationErrors() {
    return this._validationErrors;
  }

  toQueryParams() {
    const params = {};

    params.q = this.query;
    params.limit = this.limit;

    if (this.yearStart !== null) params.yearStart = this.yearStart;
    if (this.yearEnd !== null) params.yearEnd = this.yearEnd;
    if (this.language) params.language = this.language;
    if (this.openAccess) params.openAccess = 'true';

    return params;
  }

  static fromFormData(formData) {
    return new SearchQuery({
      query: formData.get('query') || formData.get('q') || '',
      limit: formData.get('limit') ?? CONFIG.DEFAULT_SEARCH_LIMIT,
      yearStart: formData.get('yearStart') || formData.get('year_start') || null,
      yearEnd: formData.get('yearEnd') || formData.get('year_end') || null,
      language: formData.get('language') || '',
      openAccess: formData.get('openAccess') === 'true' || formData.get('open_access') === 'true',
    });
  }

  _parseYear(value, errors) {
    if (value === null || value === undefined || value === '') {
      return null; // ausente, sem erro
    }

    const year = Number(value);
    const maxYear = CONFIG.MAX_YEAR || 2100;

    if (!Number.isFinite(year) || year < CONFIG.MIN_YEAR || year > maxYear) {
      errors.push(ERROR_MESSAGES.INVALID_YEAR);
      return null;
    }

    return Math.floor(year);
  }
}

export default SearchQuery;