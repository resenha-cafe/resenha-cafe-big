// src/domain/search-query.js

import { CONFIG } from '../core/config.js';
import { SEARCH_LANGUAGES, ERROR_CODES, ERROR_MESSAGES } from '../core/constants.js';
import { deepFreeze } from '../utils/deep-freeze.js';

export class SearchQuery {
  constructor(data = {}) {
    this.query = typeof data.query === 'string' ? data.query.trim() : '';

    const errors = [];

    if (!this.query || this.query.length < 2) {
      errors.push({ code: ERROR_CODES.EMPTY_QUERY, message: ERROR_MESSAGES.EMPTY_QUERY });
    }

    let limit = CONFIG.DEFAULT_SEARCH_LIMIT;
    if (data.limit !== undefined && data.limit !== null && data.limit !== '') {
      const parsed = parseInt(String(data.limit), 10);
      if (isNaN(parsed) || parsed < 1) {
        errors.push({ code: ERROR_CODES.INVALID_LIMIT, message: ERROR_MESSAGES.INVALID_LIMIT });
        limit = null;
      } else if (parsed > CONFIG.MAX_SEARCH_LIMIT) {
        errors.push({ code: ERROR_CODES.LIMIT_EXCEEDED, message: ERROR_MESSAGES.LIMIT_EXCEEDED });
        limit = null;
      } else {
        limit = parsed;
      }
    }
    this.limit = limit;

    this.yearStart = parseYear(data.yearStart, errors);
    this.yearEnd = parseYear(data.yearEnd, errors);

    if (this.yearStart !== null && this.yearEnd !== null && this.yearStart > this.yearEnd) {
      errors.push({ code: ERROR_CODES.YEAR_RANGE_INVALID, message: ERROR_MESSAGES.YEAR_RANGE_INVALID });
    }

    const langValue = typeof data.language === 'string' ? data.language.toLowerCase() : '';
    if (langValue) {
      const allowed = SEARCH_LANGUAGES.map((l) => l.value);
      if (!allowed.includes(langValue)) {
        errors.push({ code: ERROR_CODES.INVALID_LANGUAGE, message: ERROR_MESSAGES.INVALID_LANGUAGE });
        this.language = '';
      } else {
        this.language = langValue;
      }
    } else {
      this.language = '';
    }

    this.openAccess = data.openAccess === true || data.openAccess === 'true';

    this._validationErrors = deepFreeze([...errors]);
    deepFreeze(this);
  }

  get isEmpty() { return this.query.length === 0; }
  get isValid() { return this._validationErrors.length === 0; }
  validationErrors() { return this._validationErrors; }

  toQueryParams() {
    const params = {};
    params.q = this.query;
    if (this.limit !== null) params.limit = this.limit;
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
}

function parseYear(value, errors) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = parseInt(String(value), 10);
  if (isNaN(parsed) || parsed === 0) return null;
  const currentYear = new Date().getFullYear();
  if (parsed < CONFIG.MIN_YEAR || parsed > currentYear) {
    errors.push({ code: ERROR_CODES.INVALID_YEAR, message: ERROR_MESSAGES.INVALID_YEAR });
    return null;
  }
  return parsed;
}

export default SearchQuery;
