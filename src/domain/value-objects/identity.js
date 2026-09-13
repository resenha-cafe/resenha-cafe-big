/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Domain — Identity (Value Object)
 * ============================================================
 */

/**
 * Identity representa a identidade de uma entidade.
 * É um Value Object imutável que encapsula a chave de identidade.
 */
export class Identity {
  #key;

  /**
   * @param {string|null} key - Chave de identidade
   */
  constructor(key = null) {
    this.#key = key;
    Object.freeze(this);
  }

  /**
   * Obtém a chave de identidade
   * @returns {string|null}
   */
  get key() {
    return this.#key;
  }

  /**
   * Verifica se a identidade existe
   * @returns {boolean}
   */
  get hasIdentity() {
    return this.#key !== null;
  }

  /**
   * Verifica se a identidade está vazia
   * @returns {boolean}
   */
  get isEmpty() {
    return this.#key === null;
  }

  /**
   * Compara duas identidades
   * @param {Identity} other - Outra identidade
   * @returns {boolean} True se forem iguais
   */
  equals(other) {
    if (!other) return false;
    if (!(other instanceof Identity)) return false;
    if (this.#key === null && other.#key === null) return true;
    if (this.#key === null || other.#key === null) return false;
    return this.#key === other.#key;
  }

  /**
   * Converte para string
   * @returns {string}
   */
  toString() {
    return this.#key || "";
  }

  /**
   * Converte para objeto plano
   * @returns {Object}
   */
  toPlainObject() {
    return { key: this.#key };
  }

  /**
   * Cria uma identidade vazia
   * @returns {Identity}
   */
  static empty() {
    return new Identity(null);
  }

  /**
   * Cria uma identidade a partir de uma chave
   * @param {string|null} key - Chave de identidade
   * @returns {Identity}
   */
  static fromKey(key) {
    return key !== null && key !== undefined ? new Identity(key) : new Identity(null);
  }
}

export default Identity;