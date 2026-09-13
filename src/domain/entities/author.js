/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Domain — Author (Entidade)
 * ============================================================
 */

import { Entity } from "../base/entity.js";
import { Identity } from "../value-objects/identity.js";
import { deepFreeze } from "../../utils/deep-freeze.js";
import { normalizePersonNameForIdentity } from "../../utils/index.js";

/**
 * Entidade Author
 * 
 * Representa um autor de um artigo científico.
 * 
 * 📚 AULA: Entidade é um objeto com identidade própria.
 * Um autor "Maria Silva" com ORCID 0000-0001-2345-6789
 * é diferente de "Maria Silva" sem ORCID — são entidades
 * diferentes porque têm identidades diferentes.
 * 
 * @class Author
 * @extends Entity
 */
export class Author extends Entity {
  /**
   * @param {Object} data - Dados do autor
   * @param {string} data.id - ID do autor
   * @param {string} data.name - Nome completo
   * @param {string} data.orcid - ORCID
   * @param {string} data.affiliation - Afiliação institucional
   * @param {string} data.email - Email
   * @param {Array} data.roles - Papéis (author, editor, reviewer, etc.)
   * @param {string} data.country - País
   * @param {Object} data.metadata - Metadados adicionais
   * @param {Identity} data.identity - Identidade (opcional, para reidratação)
   */
  constructor(data = {}) {
    // Respeita identity fornecido externamente, ou cria automaticamente
    const identity = data.identity instanceof Identity
      ? data.identity
      : Author.#createIdentity(data);

    super(identity);

    this.id = data.id || null;
    this.name = data.name || null;
    this.orcid = data.orcid || null;
    this.affiliation = data.affiliation || null;
    this.email = data.email || null;
    this.roles = deepFreeze([...(data.roles || [])]);
    this.country = data.country || null;
    this.metadata = data.metadata ? deepFreeze({ ...data.metadata }) : deepFreeze({});

    deepFreeze(this);
  }

  // ============================================================
  // GETTERS
  // ============================================================

  /**
   * Nome normalizado para comparação
   * @returns {string}
   */
  get normalizedName() {
    return normalizePersonNameForIdentity(this.name);
  }

  /**
   * Nome simplificado (primeiro e último nome)
   * @returns {Object}
   */
  get simplifiedName() {
    if (!this.name) return { first: null, last: null };
    const parts = this.name.trim().split(/\s+/);
    if (parts.length === 0) return { first: null, last: null };
    if (parts.length === 1) return { first: parts[0], last: null };
    return { first: parts[0], last: parts[parts.length - 1] };
  }

  /**
   * Verifica se tem ORCID
   * @returns {boolean}
   */
  get hasOrcid() {
    return !!this.orcid;
  }

  /**
   * Verifica se tem afiliação
   * @returns {boolean}
   */
  get hasAffiliation() {
    return !!this.affiliation;
  }

  // ============================================================
  // MÉTODOS IMUTÁVEIS
  // ============================================================

  /**
   * Cria uma cópia com atualizações
   * @param {Object} updates - Atualizações
   * @returns {Author} Nova instância
   */
  with(updates) {
    return new Author({
      ...this.toPlainObject(),
      ...updates,
    });
  }

  /**
   * Converte para objeto plano
   * @returns {Object}
   */
  toPlainObject() {
    return {
      id: this.id,
      name: this.name,
      orcid: this.orcid,
      affiliation: this.affiliation,
      email: this.email,
      roles: this.roles,
      country: this.country,
      metadata: this.metadata,
    };
  }

  // ============================================================
  // MÉTODOS PRIVADOS ESTÁTICOS
  // ============================================================

  /**
   * Cria identidade para o autor
   * Prioridade: ORCID > Email > Nome normalizado
   * @param {Object} data - Dados do autor
   * @returns {Identity}
   */
  static #createIdentity(data) {
    if (data.orcid) {
      return Identity.fromKey(`orcid:${data.orcid}`);
    }

    if (data.email) {
      return Identity.fromKey(`email:${data.email}`);
    }

    if (data.name) {
      const normalized = normalizePersonNameForIdentity(data.name);
      if (normalized) {
        return Identity.fromKey(`name:${normalized}`);
      }
    }

    return Identity.empty();
  }

  // ============================================================
  // FACTORY METHODS
  // ============================================================

  /**
   * Cria um autor vazio
   * @returns {Author}
   */
  static empty() {
    return new Author({});
  }

  /**
   * Cria um autor a partir de uma string (nome)
   * @param {string} name - Nome do autor
   * @returns {Author}
   */
  static fromString(name) {
    return new Author({ name });
  }

  /**
   * Cria um autor a partir de um objeto plano
   * @param {Object} data - Dados
   * @returns {Author}
   */
  static fromPlainObject(data) {
    return new Author(data);
  }
}

export default Author;