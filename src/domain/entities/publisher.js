/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Domain — Publisher (Entidade)
 * ============================================================
 */

import { Entity } from "../base/entity.js";
import { Identity } from "../value-objects/identity.js";
import { deepFreeze } from "../../utils/deep-freeze.js";
import { normalizeTitleForIdentity } from "../../utils/index.js";

/**
 * Entidade Publisher
 * 
 * Representa uma editora científica.
 * 
 * 📚 AULA: Publisher usa website como identidade prioritária.
 * Isso porque o website é mais estável e único que o nome.
 * "Elsevier" pode ser escrito de várias formas, mas
 * "elsevier.com" é sempre igual depois de normalizado.
 * 
 * @class Publisher
 * @extends Entity
 */
export class Publisher extends Entity {
  /**
   * @param {Object} data - Dados da editora
   * @param {string} data.id - ID da editora
   * @param {string} data.name - Nome da editora
   * @param {string} data.country - País
   * @param {string} data.website - Website
   * @param {Array} data.types - Tipos (commercial, university, academic, society, etc.)
   * @param {Object} data.metadata - Metadados adicionais
   * @param {Identity} data.identity - Identidade (opcional, para reidratação)
   */
  constructor(data = {}) {
    // Respeita identity fornecido externamente, ou cria automaticamente
    const identity = data.identity instanceof Identity
      ? data.identity
      : Publisher.#createIdentity(data);

    super(identity);

    this.id = data.id || null;
    this.name = data.name || null;
    this.country = data.country || null;
    this.website = data.website || null;
    this.types = deepFreeze([...(data.types || [])]);
    this.metadata = data.metadata ? deepFreeze({ ...data.metadata }) : deepFreeze({});

    deepFreeze(this);
  }

  // ============================================================
  // GETTERS
  // ============================================================

  /**
   * Nome normalizado para identidade
   * @returns {string}
   */
  get normalizedName() {
    return normalizeTitleForIdentity(this.name);
  }

  /**
   * Website normalizado para identidade
   * Remove protocolo, www, barra final
   * @returns {string|null}
   */
  get normalizedWebsite() {
    if (!this.website) return null;
    return this.website
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/+$/, "")
      .replace(/^www\./, "")
      .trim();
  }

  /**
   * Verifica se é comercial
   * @returns {boolean}
   */
  get isCommercial() {
    return this.types.includes("commercial");
  }

  /**
   * Verifica se é universitária
   * @returns {boolean}
   */
  get isUniversity() {
    return this.types.includes("university");
  }

  /**
   * Verifica se é acadêmica
   * @returns {boolean}
   */
  get isAcademic() {
    return this.types.includes("academic") || this.types.includes("university");
  }

  /**
   * Verifica se é sociedade científica
   * @returns {boolean}
   */
  get isSociety() {
    return this.types.includes("society");
  }

  // ============================================================
  // MÉTODOS IMUTÁVEIS
  // ============================================================

  /**
   * Cria uma cópia com atualizações
   * @param {Object} updates - Atualizações
   * @returns {Publisher} Nova instância
   */
  with(updates) {
    return new Publisher({
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
      country: this.country,
      website: this.website,
      types: this.types,
      metadata: this.metadata,
    };
  }

  // ============================================================
  // MÉTODOS PRIVADOS ESTÁTICOS
  // ============================================================

  /**
   * Cria identidade para a editora
   * Prioridade: Website > Nome normalizado
   * @param {Object} data - Dados da editora
   * @returns {Identity}
   */
  static #createIdentity(data) {
    if (data.website) {
      const normalized = data.website
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/\/+$/, "")
        .replace(/^www\./, "")
        .trim();

      if (normalized) {
        return Identity.fromKey(`website:${normalized}`);
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
   * Cria uma editora vazia
   * @returns {Publisher}
   */
  static empty() {
    return new Publisher({});
  }

  /**
   * Cria uma editora a partir de uma string (nome)
   * @param {string} name - Nome da editora
   * @returns {Publisher}
   */
  static fromString(name) {
    return new Publisher({ name });
  }

  /**
   * Cria uma editora a partir de um objeto plano
   * @param {Object} data - Dados
   * @returns {Publisher}
   */
  static fromPlainObject(data) {
    return new Publisher(data);
  }
}

export default Publisher;