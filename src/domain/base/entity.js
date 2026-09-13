/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Domain — Base Entity (Contrato Forte)
 * ============================================================
 */

import { Identity } from "../value-objects/identity.js";

/**
 * Classe base para todas as entidades do domínio.
 * 
 * Responsabilidades:
 * - Mantém a identidade via Value Object Identity
 * - Fornece equals() semântico baseado em identityKey
 * - Permite verificar se a entidade é transient (sem identidade)
 * - Não congela nada — a imutabilidade é responsabilidade das subclasses
 * 
 * @abstract
 */
export class Entity {
  /**
   * @param {Identity} identity - Identidade da entidade (padrão: Identity.empty())
   */
  constructor(identity = Identity.empty()) {
    this._identity = identity;
  }

  /**
   * Obtém a identidade da entidade
   * @returns {Identity} Value Object Identity
   */
  get identity() {
    return this._identity;
  }

  /**
   * Obtém a chave de identidade
   * @returns {string|null} Chave de identidade ou null
   */
  get identityKey() {
    return this._identity.key;
  }

  /**
   * Verifica se a entidade ainda não possui identidade persistente
   * @returns {boolean} True se a entidade for transient
   */
  get isTransient() {
    return !this._identity.hasIdentity;
  }

  /**
   * Verifica se a entidade tem identidade
   * @returns {boolean} True se tiver identidade
   */
  get hasIdentity() {
    return this._identity.hasIdentity;
  }

  /**
   * Compara duas entidades pela identidade
   * @param {Entity} other - Outra entidade
   * @returns {boolean} True se forem a mesma entidade
   */
  equals(other) {
    if (!other) return false;
    if (!(other instanceof Entity)) return false;
    if (Object.is(this, other)) return true;

    const thisKey = this.identityKey;
    const otherKey = other.identityKey;

    // Ambas precisam ter identidade para comparação
    if (thisKey === null || otherKey === null) {
      return false;
    }

    return thisKey === otherKey;
  }

  /**
   * Verifica se a entidade está vazia (sem dados significativos)
   * Deve ser sobrescrito por subclasses
   * @returns {boolean} True se estiver vazia
   */
  isEmpty() {
    return this.isTransient;
  }

  /**
   * Cria uma cópia com atualizações (deve ser sobrescrito)
   * @param {Object} updates - Atualizações
   * @returns {Entity} Nova entidade
   */
  with(updates) {
    throw new Error(`${this.constructor.name}: with() must be implemented`);
  }

  /**
   * Converte para objeto plano (deve ser sobrescrito)
   * @returns {Object} Objeto plano
   */
  toPlainObject() {
    throw new Error(`${this.constructor.name}: toPlainObject() must be implemented`);
  }
}

export default Entity;