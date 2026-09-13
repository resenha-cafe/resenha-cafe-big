/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Domain — Identifier Collection
 * ============================================================
 */

import { Identifier } from "../value-objects/identifier.js";
import { IdentifierMergePolicy, MergeContext } from "../policies/identifier-merge.policy.js";

// ============================================================
// IDENTIFIER COLLECTION
// ============================================================

/**
 * Coleção imutável de identificadores.
 * 
 * Responsabilidades:
 * - Armazenar identificadores únicos por tipo (case-insensitive)
 * - Garantir imutabilidade
 * - Fornecer iterador (for...of)
 * - Delegar merge para IdentifierMergePolicy
 * - Fornecer igualdade semântica entre coleções
 * 
 * @implements {Iterable<Identifier>}
 */
export class IdentifierCollection {
  #map;

  /**
   * @param {Array<Identifier>} identifiers - Lista inicial de identificadores
   * @throws {TypeError} Se algum elemento não for Identifier
   */
  constructor(identifiers = []) {
    const map = new Map();

    for (const id of identifiers) {
      if (!(id instanceof Identifier)) {
        const received = id?.constructor?.name ?? typeof id;
        throw new TypeError(
          `IdentifierCollection accepts only Identifier instances. Received: ${received}`
        );
      }

      const type = id.type?.toLowerCase?.() || id.type;

      if (map.has(type)) {
        const existing = map.get(type);
        const context = new MergeContext({ source: id.source || "unknown" });
        const merged = IdentifierMergePolicy.merge(existing, id, context);
        map.set(type, merged);
      } else {
        map.set(type, id);
      }
    }

    this.#map = map;
    Object.freeze(this);
  }

  // ============================================================
  // ITERATOR
  // ============================================================

  /**
   * Permite iteração com for...of
   * @yields {Identifier}
   */
  *[Symbol.iterator]() {
    yield* this.#map.values();
  }

  // ============================================================
  // MÉTODOS DE ACESSO
  // ============================================================

  /**
   * Obtém um identificador por tipo (case-insensitive)
   * @param {string} type - Tipo do identificador
   * @returns {Identifier|null}
   */
  get(type) {
    const key = type?.toLowerCase?.() || type;
    return this.#map.get(key) || null;
  }

  /**
   * Verifica se existe um identificador do tipo especificado
   * @param {string} type - Tipo do identificador
   * @returns {boolean}
   */
  has(type) {
    const key = type?.toLowerCase?.() || type;
    return this.#map.has(key);
  }

  /**
   * Retorna todos os identificadores como array congelado
   * @returns {Array<Identifier>}
   */
  get all() {
    return Object.freeze(Array.from(this.#map.values()));
  }

  /**
   * Número de identificadores na coleção
   * @returns {number}
   */
  get size() {
    return this.#map.size;
  }

  /**
   * Verifica se a coleção está vazia
   * @returns {boolean}
   */
  get isEmpty() {
    return this.#map.size === 0;
  }

  /**
   * Verifica se existe pelo menos um identificador persistente
   * @returns {boolean}
   */
  get hasPersistentIdentifier() {
    for (const id of this.#map.values()) {
      if (id.isPersistent) {
        return true;
      }
    }
    return false;
  }

  // ============================================================
  // MÉTODOS DE TRANSFORMAÇÃO (IMUTÁVEIS)
  // ============================================================

  /**
   * Adiciona um identificador (retorna nova coleção)
   * Aplica IdentifierMergePolicy para resolver conflitos
   * 
   * @param {Identifier} identifier - Identificador a ser adicionado
   * @param {string} [source] - Fonte do identificador (para contexto de merge)
   * @returns {IdentifierCollection} Nova coleção
   * @throws {TypeError} Se identifier não for uma instância de Identifier
   */
  add(identifier, source = "unknown") {
    if (!(identifier instanceof Identifier)) {
      const received = identifier?.constructor?.name ?? typeof identifier;
      throw new TypeError(
        `IdentifierCollection.add expects an Identifier instance. Received: ${received}`
      );
    }

    const type = identifier.type?.toLowerCase?.() || identifier.type;
    const newMap = new Map(this.#map);

    if (newMap.has(type)) {
      const existing = newMap.get(type);
      const context = new MergeContext({ source });
      const merged = IdentifierMergePolicy.merge(existing, identifier, context);
      newMap.set(type, merged);
    } else {
      newMap.set(type, identifier);
    }

    return new IdentifierCollection(Array.from(newMap.values()));
  }

  /**
   * Remove um identificador por tipo (retorna nova coleção)
   * @param {string} type - Tipo do identificador
   * @returns {IdentifierCollection} Nova coleção
   */
  remove(type) {
    const key = type?.toLowerCase?.() || type;
    const newMap = new Map(this.#map);
    newMap.delete(key);
    return new IdentifierCollection(Array.from(newMap.values()));
  }

  /**
   * Substitui um identificador por tipo (retorna nova coleção)
   * 
   * ⚠️ Diferente de add(), este método substitui diretamente o identificador
   * sem aplicar IdentifierMergePolicy. Use com cuidado.
   * 
   * @param {Identifier} identifier - Novo identificador
   * @returns {IdentifierCollection} Nova coleção
   * @throws {TypeError} Se identifier não for uma instância de Identifier
   */
  replace(identifier) {
    if (!(identifier instanceof Identifier)) {
      const received = identifier?.constructor?.name ?? typeof identifier;
      throw new TypeError(
        `IdentifierCollection.replace expects an Identifier instance. Received: ${received}`
      );
    }

    const type = identifier.type?.toLowerCase?.() || identifier.type;
    const newMap = new Map(this.#map);
    newMap.set(type, identifier);
    return new IdentifierCollection(Array.from(newMap.values()));
  }

  /**
   * Mescla outra coleção (retorna nova coleção)
   * @param {IdentifierCollection} other - Outra coleção
   * @param {string} [source] - Fonte dos identificadores
   * @returns {IdentifierCollection} Nova coleção
   */
  merge(other, source = "unknown") {
    if (!other || other.isEmpty) return this;

    let result = this;
    for (const id of other) {
      result = result.add(id, source);
    }
    return result;
  }

  // ============================================================
  // IGUALDADE
  // ============================================================

  /**
   * Compara com outra coleção
   * @param {IdentifierCollection} other - Outra coleção
   * @returns {boolean} True se forem iguais
   */
  equals(other) {
    if (!other) return false;
    if (!(other instanceof IdentifierCollection)) return false;
    if (this.size !== other.size) return false;

    for (const [key, value] of this.#map) {
      const otherValue = other.get(key);
      if (!otherValue) return false;
      if (!value.equals(otherValue)) return false;
    }

    return true;
  }

  // ============================================================
  // SERIALIZAÇÃO
  // ============================================================

  /**
   * Converte para objeto plano
   * @returns {Array<Object>}
   */
  toPlainObject() {
    return this.all.map(id => id.toPlainObject());
  }

  /**
   * Converte para array de strings (identidade)
   * @returns {Array<string>}
   */
  toIdentityKeys() {
    return this.all
      .map(id => id.identityKey)
      .filter(key => key !== null);
  }

  /**
   * Converte para string (representação concisa)
   * @returns {string}
   */
  toString() {
    return this.toIdentityKeys().join(",");
  }

  // ============================================================
  // FACTORY METHODS
  // ============================================================

  /**
   * Cria uma coleção a partir de um array de identificadores
   * @param {Array<Identifier>} identifiers - Identificadores
   * @returns {IdentifierCollection}
   */
  static from(identifiers = []) {
    return new IdentifierCollection(identifiers);
  }

  /**
   * Retorna a coleção vazia (singleton)
   * @returns {IdentifierCollection}
   */
  static empty() {
    return EMPTY_COLLECTION;
  }

  /**
   * Cria uma coleção a partir de um objeto plano
   * @param {Array<Object>} data - Dados dos identificadores
   * @returns {IdentifierCollection}
   */
  static fromPlainObject(data = []) {
    const identifiers = data.map(item => Identifier.fromPlainObject(item));
    return new IdentifierCollection(identifiers);
  }

  /**
   * Obtém a coleção vazia (singleton)
   * @returns {IdentifierCollection}
   */
  static get EMPTY() {
    return EMPTY_COLLECTION;
  }
}

// ============================================================
// SINGLETON — COLEÇÃO VAZIA
// ============================================================

const EMPTY_COLLECTION = new IdentifierCollection([]);

export default IdentifierCollection;