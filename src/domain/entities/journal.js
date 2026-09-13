/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Domain — Journal (Entidade)
 * ============================================================
 */

import { Entity } from "../base/entity.js";
import { Identity } from "../value-objects/identity.js";
import { deepFreeze } from "../../utils/deep-freeze.js";
import { normalizeTitleForIdentity } from "../../utils/index.js";

/**
 * Entidade Journal
 * 
 * Representa um periódico científico.
 * 
 * 📚 AULA: Journal é uma entidade porque tem identidade própria.
 * "Nature" com ISSN 0028-0836 é diferente de "Nature" sem ISSN —
 * podem ser o mesmo periódico, mas a identidade forte (ISSN) 
 * garante unicidade.
 * 
 * @class Journal
 * @extends Entity
 */
export class Journal extends Entity {
  /**
   * @param {Object} data - Dados do periódico
   * @param {string} data.id - ID do periódico
   * @param {string} data.name - Nome do periódico
   * @param {string} data.issn - ISSN
   * @param {string} data.eissn - EISSN
   * @param {string} data.publisher - Editora
   * @param {string} data.country - País
   * @param {string} data.website - Website
   * @param {Array} data.areas - Áreas de atuação
   * @param {Object} data.metadata - Metadados adicionais
   * @param {Identity} data.identity - Identidade (opcional, para reidratação)
   */
  constructor(data = {}) {
    // Respeita identity fornecido externamente, ou cria automaticamente
    const identity = data.identity instanceof Identity
      ? data.identity
      : Journal.#createIdentity(data);

    super(identity);

    this.id = data.id || null;
    this.name = data.name || null;
    this.issn = data.issn || null;
    this.eissn = data.eissn || null;
    this.publisher = data.publisher || null;
    this.country = data.country || null;
    this.website = data.website || null;
    this.areas = deepFreeze([...(data.areas || [])]);
    this.metadata = data.metadata ? deepFreeze({ ...data.metadata }) : deepFreeze({});

    deepFreeze(this);
  }

  // ============================================================
  // GETTERS
  // ============================================================

  /**
   * ISSN normalizado (apenas números e X)
   * @returns {string|null}
   */
  get normalizedIssn() {
    if (!this.issn) return null;
    return this.issn.replace(/[^0-9X]/gi, "").toUpperCase();
  }

  /**
   * EISSN normalizado (apenas números e X)
   * @returns {string|null}
   */
  get normalizedEissn() {
    if (!this.eissn) return null;
    return this.eissn.replace(/[^0-9X]/gi, "").toUpperCase();
  }

  /**
   * Nome normalizado para identidade
   * @returns {string}
   */
  get normalizedName() {
    return normalizeTitleForIdentity(this.name);
  }

  /**
   * Verifica se tem ISSN
   * @returns {boolean}
   */
  get hasIssn() {
    return !!this.issn;
  }

  /**
   * Verifica se tem EISSN
   * @returns {boolean}
   */
  get hasEissn() {
    return !!this.eissn;
  }

  // ============================================================
  // MÉTODOS IMUTÁVEIS
  // ============================================================

  /**
   * Cria uma cópia com atualizações
   * @param {Object} updates - Atualizações
   * @returns {Journal} Nova instância
   */
  with(updates) {
    return new Journal({
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
      issn: this.issn,
      eissn: this.eissn,
      publisher: this.publisher,
      country: this.country,
      website: this.website,
      areas: this.areas,
      metadata: this.metadata,
    };
  }

  // ============================================================
  // MÉTODOS PRIVADOS ESTÁTICOS
  // ============================================================

  /**
   * Cria identidade para o periódico
   * Prioridade: ISSN > EISSN > Nome normalizado
   * @param {Object} data - Dados do periódico
   * @returns {Identity}
   */
  static #createIdentity(data) {
    if (data.issn) {
      const normalized = data.issn.replace(/[^0-9X]/gi, "").toUpperCase();
      if (normalized) {
        return Identity.fromKey(`issn:${normalized}`);
      }
    }

    if (data.eissn) {
      const normalized = data.eissn.replace(/[^0-9X]/gi, "").toUpperCase();
      if (normalized) {
        return Identity.fromKey(`eissn:${normalized}`);
      }
    }

    if (data.name) {
      const normalized = normalizeTitleForIdentity(data.name);
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
   * Cria um periódico vazio
   * @returns {Journal}
   */
  static empty() {
    return new Journal({});
  }

  /**
   * Cria um periódico a partir de uma string (nome)
   * @param {string} name - Nome do periódico
   * @returns {Journal}
   */
  static fromString(name) {
    return new Journal({ name });
  }

  /**
   * Cria um periódico a partir de um objeto plano
   * @param {Object} data - Dados
   * @returns {Journal}
   */
  static fromPlainObject(data) {
    return new Journal(data);
  }
}

export default Journal;