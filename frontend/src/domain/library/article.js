// src/domain/article.js

import { deepFreeze } from '../utils/deep-freeze.js';

/**
 * Representa um artigo científico normalizado para o domínio.
 * O modelo é imutável e não conhece API, DOM ou serviços.
 *
 * Campos como `journal`, `publisher` e `license` podem ser string
 * ou objetos estruturados, conforme o enriquecimento do Worker.
 */
export class Article {
  constructor(data = {}) {
    this.title = typeof data.title === 'string' ? data.title : '';
    this.doi = typeof data.doi === 'string' ? data.doi : '';
    this.abstract = typeof data.abstract === 'string' ? data.abstract : '';
    this.publicationDate = data.publicationDate || '';
    this.language = typeof data.language === 'string' ? data.language : '';
    this.type = typeof data.type === 'string' ? data.type : '';
    this.url = typeof data.url === 'string' ? data.url : '';
    this.openAccess = Boolean(data.openAccess);
    this.peerReviewed = Boolean(data.peerReviewed);

    // Autores: aceita objetos normalizados ou strings simples
    this.authors = Array.isArray(data.authors)
      ? data.authors.map((author) =>
          typeof author === 'object' && author !== null
            ? { ...author }
            : { name: String(author ?? ''), orcid: '', affiliation: '' }
        )
      : [];

    // Journal: pode ser string ou objeto
    this.journal = this._normalizeStringOrObject(data.journal);

    // Publisher: pode ser string ou objeto
    this.publisher = this._normalizeStringOrObject(data.publisher);

    // License: pode ser string ou objeto
    this.license = this._normalizeStringOrObject(data.license);

    // Citações: inteiro não negativo
    const citations = Number(data.citations);
    this.citations = Number.isFinite(citations) && citations >= 0
      ? Math.floor(citations)
      : 0;

    this.references = Array.isArray(data.references)
      ? [...data.references]
      : [];

    // Confidence entre 0 e 1
    const confidence = Number(data.confidence);
    this.confidence = Number.isFinite(confidence)
      ? Math.min(1, Math.max(0, confidence))
      : 0;

    this.source = typeof data.source === 'string' ? data.source : '';

    deepFreeze(this);
  }

  /**
   * Normaliza um campo que pode ser string ou objeto.
   * @private
   */
  _normalizeStringOrObject(value) {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
      return deepFreeze({ ...value });
    }
    return '';
  }

  get displayTitle() {
    return this.title.trim();
  }

  get firstAuthor() {
    return this.authors.length > 0 ? this.authors[0].name : '';
  }

  get journalName() {
    if (typeof this.journal === 'string') return this.journal;
    if (this.journal && typeof this.journal === 'object') {
      return this.journal.name || '';
    }
    return '';
  }

  get authorCount() {
    return this.authors.length;
  }

  get hasAbstract() {
    return this.abstract.trim().length > 0;
  }

  get hasDoi() {
    return this.doi.trim().length > 0;
  }

  get hasUrl() {
    return this.url.trim().length > 0;
  }

  get hasAuthors() {
    return this.authors.length > 0;
  }

  get hasCitations() {
    return this.citations > 0;
  }

  get isComplete() {
    return Boolean(
      this.title &&
      this.doi &&
      this.abstract &&
      this.publicationDate &&
      this.authors.length > 0 &&
      this.journalName
    );
  }

  static empty() {
    return new Article({});
  }
}

export default Article;
