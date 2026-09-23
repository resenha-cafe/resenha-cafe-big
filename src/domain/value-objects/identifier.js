import { deepFreeze } from "../../utils/deep-freeze.js";
import { normalizeIdentifier } from "../../utils/normalize-identifier.js";
import { validateIdentifier } from "../../utils/validate-identifier.js";

export const IDENTIFIER_TYPES = Object.freeze({
  DOI: "doi",
  PMID: "pmid",
  PMCID: "pmcid",
  OPENALEX: "openalex",
  SEMANTIC: "semantic",
  ORCID: "orcid",
  ARXIV: "arxiv",
  ISBN: "isbn",
  ISSN: "issn",
  SSRN: "ssrn",
  HAL: "hal",
  SCOPUS: "scopus",
  WOS: "wos",
});

function normalizeIdentifierType(type) {
  if (typeof type !== "string") {
    return null;
  }

  const normalized = type.trim().toLowerCase();

  return normalized || null;
}

// ============================================================
// UTILITÁRIO DE CLONE (fallback para structuredClone)
// ============================================================

/**
 * Clona um valor usando structuredClone ou fallback JSON
 * @param {any} value - Valor a ser clonado
 * @returns {any} Valor clonado
 */
function safeClone(value) {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

// ============================================================
// IDENTIFIER CLASS
// ============================================================

/**
 * Identifier representa um identificador único de um artigo.
 * É um Value Object imutável que encapsula tipo, valor e metadados.
 * 
 * Tipos suportados: DOI, PMID, PMCID, OpenAlex, Semantic, arXiv, ISBN, ISSN, SSRN, HAL, Scopus, WOS
 */
export class Identifier {
  // Tipos (referência ao objeto externo congelado)
  static TYPES = IDENTIFIER_TYPES;

  // Campos privados
  #isValid;
  #identityKey;

  /**
   * @param {Object} data - Dados do identificador
   * @param {string} data.type - Tipo do identificador
   * @param {string} data.value - Valor do identificador
   * @param {string} [data.provider] - Provider que forneceu o identificador
   * @param {number} [data.confidence] - Confiança (0-1)
   * @param {string} [data.source] - Fonte original
   * @param {Object} [data.metadata] - Metadados adicionais
   */
  constructor(data = {}) {
  const normalizedType = normalizeIdentifierType(data.type);

  const normalizedValue = normalizeIdentifier(
    normalizedType,
    data.value
  );

  this.type = normalizedType;
  this.value = normalizedValue;
  this.provider = data.provider || null;

  this.confidence = Math.max(
    0,
    Math.min(1, data.confidence ?? 1)
  );

  this.source = data.source || null;

  const clonedMetadata = data.metadata
    ? safeClone(data.metadata)
    : {};

  this.metadata = deepFreeze(clonedMetadata);

  this.#isValid = validateIdentifier(
    this.type,
    this.value
  );

  this.#identityKey = this.#calculateIdentityKey();

  Object.freeze(this);
}
  // ============================================================
  // VALIDAÇÃO PRIVADA
  // ============================================================

  /**
   * Calcula a chave de identidade
   * @returns {string|null}
   */
  #calculateIdentityKey() {
    if (this.type && this.value) {
      return `${this.type}:${this.value}`;
    }
    return null;
  }

  // ============================================================
  // GETTERS
  // ============================================================

  /**
   * Chave de identidade única
   * @returns {string|null}
   */
  get identityKey() {
    return this.#identityKey;
  }

  /**
   * Indica se o identificador é válido
   * @returns {boolean}
   */
  get isValid() {
    return this.#isValid;
  }

  /**
   * Indica se o identificador tem identidade
   * @returns {boolean}
   */
  get hasIdentity() {
    return this.#identityKey !== null;
  }

  /**
   * Indica se o identificador está vazio
   * @returns {boolean}
   */
  get isEmpty() {
    return !this.hasIdentity;
  }

  /**
   * Indica se o identificador é persistente (tem identidade E é válido)
   * Útil para políticas de merge, validação e persistência
   * @returns {boolean}
   */
  get isPersistent() {
    return this.hasIdentity && this.isValid;
  }

  // ============================================================
  // FACTORY METHODS (criação com tipo específico)
  // ============================================================

  /**
   * Cria um identificador DOI
   * @param {string} value - DOI
   * @param {Object} options - Opções adicionais
   * @returns {Identifier}
   */
  static doi(value, options = {}) {
    return new Identifier({ type: IDENTIFIER_TYPES.DOI, value, ...options });
  }

  /**
   * Cria um identificador PMID
   * @param {string} value - PMID
   * @param {Object} options - Opções adicionais
   * @returns {Identifier}
   */
  static pmid(value, options = {}) {
    return new Identifier({ type: IDENTIFIER_TYPES.PMID, value, ...options });
  }

  /**
   * Cria um identificador PMCID
   * @param {string} value - PMCID
   * @param {Object} options - Opções adicionais
   * @returns {Identifier}
   */
  static pmcid(value, options = {}) {
    return new Identifier({ type: IDENTIFIER_TYPES.PMCID, value, ...options });
  }

  /**
   * Cria um identificador OpenAlex
   * @param {string} value - OpenAlex ID
   * @param {Object} options - Opções adicionais
   * @returns {Identifier}
   */
  static openalex(value, options = {}) {
    return new Identifier({ type: IDENTIFIER_TYPES.OPENALEX, value, ...options });
  }

  /**
   * Cria um identificador Semantic Scholar
   * @param {string} value - Semantic ID
   * @param {Object} options - Opções adicionais
   * @returns {Identifier}
   */
  static semantic(value, options = {}) {
    return new Identifier({ type: IDENTIFIER_TYPES.SEMANTIC, value, ...options });
  }

  /**
   * Cria um identificador arXiv
   * @param {string} value - arXiv ID
   * @param {Object} options - Opções adicionais
   * @returns {Identifier}
   */
  static arxiv(value, options = {}) {
    return new Identifier({ type: IDENTIFIER_TYPES.ARXIV, value, ...options });
  }

  /**
   * Cria um identificador ISBN
   * @param {string} value - ISBN
   * @param {Object} options - Opções adicionais
   * @returns {Identifier}
   */
  static isbn(value, options = {}) {
    return new Identifier({ type: IDENTIFIER_TYPES.ISBN, value, ...options });
  }

  /**
   * Cria um identificador ISSN
   * @param {string} value - ISSN
   * @param {Object} options - Opções adicionais
   * @returns {Identifier}
   */
  static issn(value, options = {}) {
    return new Identifier({ type: IDENTIFIER_TYPES.ISSN, value, ...options });
  }

  // ============================================================
  // MÉTODOS
  // ============================================================

  /**
   * Compara dois identificadores
   * @param {Identifier} other - Outro identificador
   * @returns {boolean} True se forem iguais
   */
  equals(other) {
    if (!other) return false;
    if (!(other instanceof Identifier)) return false;
    if (this.#identityKey !== null && other.#identityKey !== null) {
      return this.#identityKey === other.#identityKey;
    }
    return false;
  }

  /**
   * Cria uma cópia com atualizações
   * @param {Object} updates - Atualizações
   * @returns {Identifier} Nova instância
   */
  with(updates) {
    return new Identifier({
      ...this.toPlainObject(),
      ...updates,
    });
  }

  /**
   * Converte para objeto plano (retorna um clone do metadata)
   * @returns {Object}
   */
  toPlainObject() {
    return {
      type: this.type,
      value: this.value,
      provider: this.provider,
      confidence: this.confidence,
      source: this.source,
      metadata: this.metadata ? safeClone(this.metadata) : {},
    };
  }

  /**
   * Converte para string
   * @returns {string}
   */
  toString() {
    return this.#identityKey || "";
  }

  // ============================================================
  // FACTORY METHODS (gerais)
  // ============================================================

  /**
   * Retorna o identificador vazio (singleton)
   * @returns {Identifier}
   */
  static empty() {
    return EMPTY_IDENTIFIER;
  }

  /**
   * Cria um identificador a partir de um objeto plano
   * @param {Object} data - Dados
   * @returns {Identifier}
   */
  static fromPlainObject(data) {
    return new Identifier(data);
  }
}

// ============================================================
// SINGLETON — IDENTIFICADOR VAZIO
// ============================================================

const EMPTY_IDENTIFIER = new Identifier({});

export default Identifier;