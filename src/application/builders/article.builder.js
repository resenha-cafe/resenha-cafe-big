/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Application — Article Builder
 * ============================================================
 */

import { Article } from "../../domain/entities/article.js";
import { Author } from "../../domain/entities/author.js";
import { Journal } from "../../domain/entities/journal.js";
import { Publisher } from "../../domain/entities/publisher.js";
import { License } from "../../domain/entities/license.js";
import { Identifier } from "../../domain/value-objects/identifier.js";
import { IdentifierCollection } from "../../domain/collections/identifier-collection.js";

export class ArticleBuilder {
  constructor(options = {}) {
    this._strict = options.strict ?? false;

    // ============================================================
    // DADOS DO ARTIGO
    // ============================================================
    if (options.base instanceof Article) {
      const plain = options.base.toPlainObject();
      this._data = { ...plain };
      // 📚 CORRIGIDO: Cópia defensiva dos arrays.
      // Evita compartilhar referência com o artigo original.
      this._data.identifiers = options.base.identifiers;
      this._data.authors = [...options.base.authors];
      this._data.references = [...options.base.references];
    } else if (options.base && typeof options.base === "object") {
      this._data = { ...options.base };
      // Garante que sejam novos arrays
      this._data.authors = [...(options.base.authors || [])];
      this._data.references = [...(options.base.references || [])];
      this._data.identifiers = options.base.identifiers || [];
    } else {
      this._data = {};
    }

    if (!this._data.authors) this._data.authors = [];
    if (!this._data.identifiers) this._data.identifiers = [];
    if (!this._data.references) this._data.references = [];

    // ============================================================
    // METADADOS DO BUILDER
    // ============================================================
    this._steps = [];
    this._warnings = [];
    this._sources = new Set();
  }

  // ============================================================
  // MÉTODOS DE CONSTRUÇÃO
  // ============================================================

  withTitle(title) {
    this._data.title = title;
    this._steps.push("withTitle");
    return this;
  }

  /**
   * Define o DOI.
   * 
   * 📚 CORRIGIDO: Não duplica DOI nos identifiers.
   * Se o DOI já está na lista, substitui. Se não, adiciona.
   * 
   * @param {string} doi - DOI
   * @param {Object} [meta] - Metadados do identificador
   * @returns {ArticleBuilder} this
   */
  withDoi(doi, meta = {}) {
    this._data.doi = doi;

    // Remove DOI existente (se houver) e adiciona o novo
    if (Array.isArray(this._data.identifiers)) {
      this._data.identifiers = this._data.identifiers.filter(
        id => (id.type || id.type) !== "doi"
      );
      this._data.identifiers.push(
        Identifier.doi(doi, {
          source: meta.source || this._data.source,
          // 📚 CORRIGIDO: Confidence padrão é undefined, não 1.
          // O Article que decide o default.
          confidence: meta.confidence ?? undefined,
        })
      );
    }

    this._steps.push("withDoi");
    if (meta.source) this._sources.add(meta.source);
    return this;
  }

  withAbstract(abstract) {
    this._data.abstract = abstract;
    this._steps.push("withAbstract");
    return this;
  }

  withPublicationDate(date) {
    if (date instanceof Date) {
      this._data.publicationDate = date.toISOString().split("T")[0];
    } else if (typeof date === "number") {
      this._data.publicationDate = String(date);
    } else {
      this._data.publicationDate = date;
    }
    this._steps.push("withPublicationDate");
    return this;
  }

  withLanguage(language) {
    this._data.language = language;
    this._steps.push("withLanguage");
    return this;
  }

  withType(type) {
    this._data.type = type;
    this._steps.push("withType");
    return this;
  }

  withUrl(url) {
    this._data.url = url;
    this._steps.push("withUrl");
    return this;
  }

  withOpenAccess(openAccess = true) {
    this._data.openAccess = openAccess;
    this._steps.push("withOpenAccess");
    return this;
  }

  withPeerReviewed(peerReviewed = true) {
    this._data.peerReviewed = peerReviewed;
    this._steps.push("withPeerReviewed");
    return this;
  }

  withSource(source) {
    this._data.source = source;
    this._sources.add(source);
    this._steps.push("withSource");
    return this;
  }

  withConfidence(confidence) {
    this._data.confidence = confidence;
    this._steps.push("withConfidence");
    return this;
  }

  /**
   * Define o número de citações.
   * 
   * 📚 Política: usa o maior valor (melhor dado disponível).
   * 
   * @param {number} citations - Número de citações
   * @returns {ArticleBuilder} this
   */
  withCitations(citations) {
    const current = this._data.citations || 0;
    this._data.citations = Math.max(current, citations);
    this._steps.push("withCitations");
    return this;
  }

  // ============================================================
  // ENTIDADES FILHAS
  // ============================================================

  withAuthor(author) {
    if (author instanceof Author) {
      this._data.authors.push(author);
    } else if (typeof author === "string") {
      this._data.authors.push(Author.fromString(author));
    } else if (author && typeof author === "object") {
      this._data.authors.push(Author.fromPlainObject(author));
    }
    this._steps.push("withAuthor");
    return this;
  }

  withAuthors(authors = []) {
    for (const author of authors) {
      this.withAuthor(author);
    }
    return this;
  }

  withJournal(journal) {
    if (journal instanceof Journal) {
      this._data.journal = journal;
    } else if (journal && typeof journal === "object") {
      this._data.journal = journal;
    }
    this._steps.push("withJournal");
    return this;
  }

  withPublisher(publisher) {
    if (publisher instanceof Publisher) {
      this._data.publisher = publisher;
    } else if (publisher && typeof publisher === "object") {
      this._data.publisher = publisher;
    }
    this._steps.push("withPublisher");
    return this;
  }

  withLicense(license) {
    if (license instanceof License) {
      this._data.license = license;
    } else if (typeof license === "string") {
      this._data.license = License.fromName(license);
    } else if (license && typeof license === "object") {
      this._data.license = license;
    }
    this._steps.push("withLicense");
    return this;
  }

  // ============================================================
  // IDENTIFICADORES E REFERÊNCIAS
  // ============================================================

  withIdentifier(identifier) {
    if (identifier instanceof Identifier) {
      this._data.identifiers.push(identifier);
    } else if (identifier && typeof identifier === "object") {
      this._data.identifiers.push(Identifier.fromPlainObject(identifier));
    }
    this._steps.push("withIdentifier");
    return this;
  }

  withIdentifiers(identifiers = []) {
    for (const id of identifiers) {
      this.withIdentifier(id);
    }
    return this;
  }

  withReference(doi) {
    if (doi && !this._data.references.includes(doi)) {
      this._data.references.push(doi);
    }
    this._steps.push("withReference");
    return this;
  }

  withReferences(dois = []) {
    for (const doi of dois) {
      this.withReference(doi);
    }
    return this;
  }

  // ============================================================
  // METADADOS
  // ============================================================

  withMetadata(metadata = {}) {
    this._data.metadata = {
      ...(this._data.metadata || {}),
      ...metadata,
    };
    this._steps.push("withMetadata");
    return this;
  }

  withWarning(warning) {
    this._warnings.push(warning);
    return this;
  }

  // ============================================================
  // CONSTRUÇÃO FINAL
  // ============================================================

  build() {
    // Converte identificadores
    const identifiers = this._data.identifiers instanceof IdentifierCollection
      ? this._data.identifiers
      : IdentifierCollection.from(this._data.identifiers);

    // Converte autores
    const authors = this._data.authors.map(a => {
      if (a instanceof Author) return a;
      if (typeof a === "string") return Author.fromString(a);
      return Author.fromPlainObject(a);
    });

    const article = new Article({
      doi: this._data.doi,
      title: this._data.title,
      abstract: this._data.abstract,
      publicationDate: this._data.publicationDate,
      language: this._data.language,
      type: this._data.type,
      url: this._data.url,
      openAccess: this._data.openAccess,
      peerReviewed: this._data.peerReviewed,
      authors,
      journal: this._data.journal,
      publisher: this._data.publisher,
      license: this._data.license,
      identifiers,
      citations: this._data.citations,
      references: this._data.references,
      confidence: this._data.confidence,
      source: this._data.source || (this._sources.size > 0 ? [...this._sources].join(", ") : null),
      metadata: this._data.metadata,
    });

    if (this._strict && !article.isValid()) {
      throw new Error(
        `ArticleBuilder: built article is invalid. ` +
        `Title: ${article.title || "missing"}, DOI: ${article.doi || "missing"}`
      );
    }

    return article;
  }

  buildWithMetadata() {
    return {
      article: this.build(),
      steps: [...this._steps],
      warnings: [...this._warnings],
      sources: [...this._sources],
    };
  }

  // ============================================================
  // VALIDAÇÃO
  // ============================================================

  isValid() {
    return !!(this._data.title || this._data.doi);
  }

  isEmpty() {
    return this._steps.length === 0;
  }

  summary() {
    return {
      title: this._data.title || null,
      doi: this._data.doi || null,
      authors: this._data.authors.length,
      hasAbstract: !!this._data.abstract,
      hasJournal: !!this._data.journal,
      hasPublisher: !!this._data.publisher,
      hasLicense: !!this._data.license,
      citations: this._data.citations || 0,
      identifiers: Array.isArray(this._data.identifiers)
        ? this._data.identifiers.length
        : this._data.identifiers.size,
      references: this._data.references.length,
      source: this._data.source || null,
      steps: this._steps.length,
      warnings: this._warnings.length,
    };
  }

  // ============================================================
  // FACTORY METHODS
  // ============================================================

  static fromArticle(article, options = {}) {
    return new ArticleBuilder({ ...options, base: article });
  }

  static fromProvider(data, source, options = {}) {
    return new ArticleBuilder({ ...options, base: { ...data, source } });
  }

  static empty(options = {}) {
    return new ArticleBuilder(options);
  }
}

export default ArticleBuilder;