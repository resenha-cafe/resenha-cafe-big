/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Domain — Article (Agregado Raiz)
 * ============================================================
 */

import { Entity } from "../base/entity.js";
import { Identity } from "../value-objects/identity.js";
import { Identifier } from "../value-objects/identifier.js";
import { IdentifierCollection } from "../collections/identifier-collection.js";
import { Author } from "./author.js";
import { Journal } from "./journal.js";
import { Publisher } from "./publisher.js";
import { License } from "./license.js";
import { ArticleIdentityFactory } from "../factories/article-identity.factory.js";
import { deepFreeze } from "../../utils/deep-freeze.js";

/**
 * Entidade Article (Agregado Raiz)
 * 
 * Representa um artigo científico completo.
 * É o ponto central de todo o domínio.
 * 
 * ## Identidade
 * 
 * A identidade do Article é derivada dos seus dados (DOI > título+autores+ano > etc.)
 * e é gerenciada pelo ArticleIdentityFactory → identity-normalizer.
 * 
 * A criação da identidade ocorre após o parse dos identificadores, garantindo
 * que o DOI do IdentifierCollection seja usado quando disponível.
 * 
 * ⚠️ Operações que alteram identificadores ou metadados (addIdentifier, mergeIdentifiers,
 * setJournal, etc.) podem produzir um novo aggregate com identidade diferente.
 * Este é o comportamento esperado para um sistema de deduplicação.
 * 
 * ## Fonte única da verdade
 * 
 * O DOI é obtido exclusivamente do IdentifierCollection. Não existe campo this.doi.
 * O getter `doi` acessa `this.identifiers.get("doi")?.value`.
 * A serialização (toPlainObject) mantém compatibilidade com APIs externas.
 * 
 * @class Article
 * @extends Entity
 */
export class Article extends Entity {
  /**
   * @param {Object} data - Dados do artigo
   * @param {string} data.doi - DOI (atalho — será incorporado ao IdentifierCollection)
   * @param {string} data.title - Título
   * @param {string} data.abstract - Resumo
   * @param {string|number} data.publicationDate - Data de publicação (ISO, ano string ou número)
   * @param {string} data.language - Idioma
   * @param {string} data.type - Tipo (article, review, preprint, etc.)
   * @param {string} data.url - URL
   * @param {boolean} data.openAccess - É acesso aberto
   * @param {boolean} data.peerReviewed - É revisado por pares
   * @param {Array<Author|Object>} data.authors - Autores
   * @param {Journal|Object} data.journal - Periódico
   * @param {Publisher|Object} data.publisher - Editora
   * @param {License|Object} data.license - Licença
   * @param {IdentifierCollection|Array<Identifier|Object>} data.identifiers - Identificadores
   * @param {number} data.citations - Número de citações
   * @param {Array<string>} data.references - DOIs referenciados
   * @param {number} data.confidence - Confiança (0-1)
   * @param {string} data.source - Provider de origem
   * @param {Object} data.metadata - Metadados adicionais
   * @param {Identity} data.identity - Identidade (opcional, para reidratação)
   */
  constructor(data = {}) {
    // ============================================================
    // ORIGEM (extraída primeiro para uso nas sincronizações)
    // ============================================================
    const source = data.source || null;

    // ============================================================
    // IDENTIFICADORES (parse antes da identidade para usar DOI normalizado)
    // ============================================================
    const identifiers = Article.#parseIdentifiers(data.identifiers, data.doi, source);

    // ============================================================
    // IDENTIDADE (criada com os identificadores já normalizados)
    // ============================================================
    const identity = data.identity instanceof Identity
      ? data.identity
      : Article.#createIdentity({ ...data, identifiers });

    super(identity);

    // ============================================================
    // ATRIBUIÇÃO DOS CAMPOS
    // ============================================================
    this.source = source;
    this.identifiers = identifiers;
    this.title = Array.isArray(data.title) ? data.title[0] : (data.title || null);
    this.abstract = data.abstract || null;
    this.publicationDate = data.publicationDate || null;
    this.language = data.language || null;
    this.type = data.type || null;
    this.url = data.url || null;
    this.openAccess = data.openAccess ?? false;
    this.peerReviewed = data.peerReviewed ?? false;
    this.authors = Article.#parseAuthors(data.authors);
    this.journal = Article.#parseJournal(data.journal);
    this.publisher = Article.#parsePublisher(data.publisher);
    this.license = Article.#parseLicense(data.license);
    this.citations = data.citations ?? 0;
    this.references = deepFreeze([...(data.references || [])]);
    this.confidence = Article.#normalizeConfidence(data.confidence);
    this.metadata = data.metadata ? deepFreeze({ ...data.metadata }) : deepFreeze({});

    // Congela a entidade completa
    deepFreeze(this);
  }

  // ============================================================
  // GETTERS
  // ============================================================

  /**
   * DOI obtido do IdentifierCollection (fonte única da verdade)
   * @returns {string|null}
   */
  get doi() {
    const id = this.identifiers.get("doi");
    return id ? id.value : null;
  }

  /**
   * Ano de publicação extraído da data
   * Suporta ISO string ("2024-01-15"), ano string ("2024") ou número (2024)
   * @returns {number|null}
   */
  get year() {
    if (!this.publicationDate) return null;
    
    if (typeof this.publicationDate === "number") {
      return (this.publicationDate >= 1000 && this.publicationDate <= 9999) 
        ? this.publicationDate 
        : null;
    }
    
    if (typeof this.publicationDate === "string" && /^\d{4}$/.test(this.publicationDate)) {
      const year = parseInt(this.publicationDate, 10);
      return (year >= 1000 && year <= 9999) ? year : null;
    }
    
    const parsed = new Date(this.publicationDate).getFullYear();
    return Number.isNaN(parsed) ? null : parsed;
  }

  get hasDoi() { return !!this.doi; }
  get hasTitle() { return !!this.title; }
  get hasAbstract() { return !!this.abstract; }
  get hasAuthors() { return this.authors.length > 0; }
  get authorCount() { return this.authors.length; }

  get firstAuthor() {
    return this.authors[0] || null;
  }

  get lastAuthor() {
    return this.authors[this.authors.length - 1] || null;
  }

  get isOpenAccess() { return this.openAccess === true; }
  get isPeerReviewed() { return this.peerReviewed === true; }
  get hasJournal() { return this.journal !== null && !this.journal.isEmpty(); }
  get hasPublisher() { return this.publisher !== null && !this.publisher.isEmpty(); }
  get hasLicense() { return this.license !== null && !this.license.isEmpty(); }
  get hasPersistentIdentifiers() { return this.identifiers.hasPersistentIdentifier; }
  get hasReferences() { return this.references.length > 0; }
  get referenceCount() { return this.references.length; }

  // ============================================================
  // MÉTODOS DE TRANSFORMAÇÃO (IMUTÁVEIS)
  // ============================================================

  /**
   * Cria uma cópia com atualizações.
   * 
   * Remove o campo doi do plano antes de reconstruir, garantindo
   * que o DOI seja sempre derivado do IdentifierCollection.
   * 
   * @param {Object} updates - Atualizações parciais
   * @returns {Article} Nova instância
   */
  with(updates) {
    const plain = this.toPlainObject();
    delete plain.doi;

    return new Article({
      ...plain,
      ...updates,
    });
  }

  addAuthor(author) {
    const newAuthor = author instanceof Author ? author : Author.fromPlainObject(author);
    return this.with({ authors: [...this.authors, newAuthor] });
  }

  addAuthors(authors) {
    const newAuthors = authors.map(a => a instanceof Author ? a : Author.fromPlainObject(a));
    return this.with({ authors: [...this.authors, ...newAuthors] });
  }

  setJournal(journal) {
    return this.with({ journal });
  }

  setPublisher(publisher) {
    return this.with({ publisher });
  }

  setLicense(license) {
    return this.with({ license });
  }

  /**
   * Adiciona um identificador (retorna nova instância)
   * 
   * ⚠️ Pode alterar a identidade do aggregate se o novo identificador
   * for de maior prioridade (ex: adicionar um DOI quando antes só havia título).
   * 
   * @param {Identifier} identifier - Identificador
   * @param {string} source - Fonte do identificador
   * @returns {Article} Nova instância
   */
  addIdentifier(identifier, source = "unknown") {
    const newIdentifiers = this.identifiers.add(identifier, source);
    return this.with({ identifiers: newIdentifiers });
  }

  /**
   * Mescla identificadores de outra coleção (retorna nova instância)
   * 
   * ⚠️ Pode alterar a identidade do aggregate.
   * 
   * @param {IdentifierCollection|Array<Identifier|Object>} identifiers - Identificadores a mesclar
   * @param {string} source - Fonte
   * @returns {Article} Nova instância
   */
  mergeIdentifiers(identifiers, source = "unknown") {
    const other = Article.#normalizeIdentifiersInput(identifiers);
    const newIdentifiers = this.identifiers.merge(other, source);
    return this.with({ identifiers: newIdentifiers });
  }

  addReference(doi) {
    if (this.references.includes(doi)) return this;
    return this.with({ references: [...this.references, doi] });
  }

  addReferences(dois) {
    const newRefs = new Set([...this.references, ...dois]);
    return this.with({ references: Array.from(newRefs) });
  }

  // ============================================================
  // SERIALIZAÇÃO
  // ============================================================

  /**
   * Converte para objeto plano.
   * O DOI é serializado como campo direto para compatibilidade com APIs externas.
   * @returns {Object}
   */
  toPlainObject() {
    return {
      doi: this.doi,
      title: this.title,
      abstract: this.abstract,
      publicationDate: this.publicationDate,
      language: this.language,
      type: this.type,
      url: this.url,
      openAccess: this.openAccess,
      peerReviewed: this.peerReviewed,
      authors: this.authors.map(a => a.toPlainObject()),
      journal: this.journal ? this.journal.toPlainObject() : null,
      publisher: this.publisher ? this.publisher.toPlainObject() : null,
      license: this.license ? this.license.toPlainObject() : null,
      identifiers: this.identifiers.toPlainObject(),
      citations: this.citations,
      references: [...this.references],
      confidence: this.confidence,
      source: this.source,
      metadata: this.metadata,
    };
  }

  toCitation() {
    const firstAuthor = this.firstAuthor;
    const authorName = firstAuthor
      ? (firstAuthor.simplifiedName.last || firstAuthor.name)
      : "Unknown";

    return {
      author: authorName,
      year: this.year,
      title: this.title,
      journal: this.journal ? this.journal.name : null,
      doi: this.doi,
      url: this.url,
    };
  }

  // ============================================================
  // VERIFICAÇÕES
  // ============================================================

  isEmpty() {
    return !this.title && !this.doi && this.authors.length === 0;
  }

  isValid() {
    return !!(this.title || this.doi);
  }

  isComplete() {
    return !!(this.title && this.hasAuthors && this.publicationDate);
  }

  // ============================================================
  // MÉTODOS PRIVADOS ESTÁTICOS
  // ============================================================

  static #createIdentity(data) {
    return ArticleIdentityFactory.create(data);
  }

  static #normalizeConfidence(confidence) {
    if (confidence === null || confidence === undefined) return 0;
    if (confidence > 1) return Math.max(0, Math.min(1, confidence / 100));
    return Math.max(0, Math.min(1, confidence));
  }

  static #parseAuthors(authors) {
    if (!authors || !Array.isArray(authors)) return deepFreeze([]);
    const parsed = authors.map(a => a instanceof Author ? a : Author.fromPlainObject(a));
    return deepFreeze(parsed);
  }

  static #parseJournal(journal) {
    if (!journal) return null;
    if (journal instanceof Journal) return journal;
    return Journal.fromPlainObject(journal);
  }

  static #parsePublisher(publisher) {
    if (!publisher) return null;
    if (publisher instanceof Publisher) return publisher;
    return Publisher.fromPlainObject(publisher);
  }

  static #parseLicense(license) {
    if (!license) return null;
    if (license instanceof License) return license;
    return License.fromPlainObject(license);
  }

  static #parseIdentifiers(identifiers, doi = null, source = null) {
    let collection = Article.#normalizeIdentifiersInput(identifiers);

    if (doi && !collection.has("doi")) {
      collection = collection.add(
        Identifier.doi(doi, { source }),
        source || "constructor"
      );
    }

    return collection;
  }

  static #normalizeIdentifiersInput(identifiers) {
    if (!identifiers) return IdentifierCollection.empty();
    if (identifiers instanceof IdentifierCollection) return identifiers;
    
    if (Array.isArray(identifiers)) {
      const parsed = identifiers.map(item =>
        item instanceof Identifier ? item : Identifier.fromPlainObject(item)
      );
      return IdentifierCollection.from(parsed);
    }
    
    return IdentifierCollection.empty();
  }

  // ============================================================
  // FACTORY METHODS
  // ============================================================

  static empty() { return new Article({}); }
  static fromTitle(title) { return new Article({ title }); }
  static fromDoi(doi) { return new Article({ doi }); }
  static fromPlainObject(data) { return new Article(data); }
}

export default Article;