/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Domain — License (Entidade)
 * ============================================================
 */

import { Entity } from "../base/entity.js";
import { Identity } from "../value-objects/identity.js";
import { deepFreeze } from "../../utils/deep-freeze.js";
import { normalizeTitleForIdentity } from "../../utils/index.js";

/**
 * Entidade License
 * 
 * Representa uma licença de uso de um artigo.
 * 
 * 📚 AULA: License é uma entidade porque tem identidade forte (SPDX).
 * "CC BY" sempre será identificado como "CC-BY-4.0" pelo SPDX,
 * independentemente de como o provider escreve.
 * 
 * O SPDX (Software Package Data Exchange) é um padrão da Linux Foundation
 * para identificar licenças de forma única e inequívoca.
 * 
 * @class License
 * @extends Entity
 */
export class License extends Entity {
  /**
   * Licenças comuns (constante congelada)
   * 📚 Object.freeze = ninguém pode modificar esta lista
   */
  static COMMON_LICENSES = Object.freeze({
    "cc-by": {
      name: "CC BY",
      spdx: "CC-BY-4.0",
      url: "https://creativecommons.org/licenses/by/4.0/",
      commercial: true,
      derivatives: true,
      shareAlike: false,
      type: "open",
    },
    "cc-by-sa": {
      name: "CC BY-SA",
      spdx: "CC-BY-SA-4.0",
      url: "https://creativecommons.org/licenses/by-sa/4.0/",
      commercial: true,
      derivatives: true,
      shareAlike: true,
      type: "open",
    },
    "cc-by-nc": {
      name: "CC BY-NC",
      spdx: "CC-BY-NC-4.0",
      url: "https://creativecommons.org/licenses/by-nc/4.0/",
      commercial: false,
      derivatives: true,
      shareAlike: false,
      type: "open",
    },
    "cc-by-nc-sa": {
      name: "CC BY-NC-SA",
      spdx: "CC-BY-NC-SA-4.0",
      url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
      commercial: false,
      derivatives: true,
      shareAlike: true,
      type: "open",
    },
    "cc-by-nd": {
      name: "CC BY-ND",
      spdx: "CC-BY-ND-4.0",
      url: "https://creativecommons.org/licenses/by-nd/4.0/",
      commercial: true,
      derivatives: false,
      shareAlike: false,
      type: "open",
    },
    "cc0": {
      name: "CC0",
      spdx: "CC0-1.0",
      url: "https://creativecommons.org/publicdomain/zero/1.0/",
      commercial: true,
      derivatives: true,
      shareAlike: false,
      type: "open",
    },
    "mit": {
      name: "MIT",
      spdx: "MIT",
      url: "https://opensource.org/licenses/MIT",
      commercial: true,
      derivatives: true,
      shareAlike: false,
      type: "open",
    },
    "apache-2.0": {
      name: "Apache 2.0",
      spdx: "Apache-2.0",
      url: "https://opensource.org/licenses/Apache-2.0",
      commercial: true,
      derivatives: true,
      shareAlike: false,
      type: "open",
    },
    "gpl-3.0": {
      name: "GPL 3.0",
      spdx: "GPL-3.0",
      url: "https://www.gnu.org/licenses/gpl-3.0.html",
      commercial: true,
      derivatives: true,
      shareAlike: true,
      type: "open",
    },
  });

  /**
   * @param {Object} data - Dados da licença
   * @param {string} data.id - ID da licença
   * @param {string} data.name - Nome da licença
   * @param {string} data.url - URL da licença
   * @param {string} data.type - Tipo (open, proprietary, unknown)
   * @param {string} data.spdx - SPDX identifier
   * @param {boolean} data.commercial - Permite uso comercial
   * @param {boolean} data.derivatives - Permite obras derivadas
   * @param {boolean} data.shareAlike - Requer compartilhamento igual
   * @param {string} data.version - Versão
   * @param {Object} data.metadata - Metadados adicionais
   * @param {Identity} data.identity - Identidade (opcional, para reidratação)
   */
  constructor(data = {}) {
    // Respeita identity fornecido externamente, ou cria automaticamente
    const identity = data.identity instanceof Identity
      ? data.identity
      : License.#createIdentity(data);

    super(identity);

    this.id = data.id || null;
    this.name = data.name || null;
    this.url = data.url || null;
    this.type = data.type || null;
    this.spdx = data.spdx || null;
    this.commercial = data.commercial ?? false;
    this.derivatives = data.derivatives ?? false;
    this.shareAlike = data.shareAlike ?? false;
    this.version = data.version || null;
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
   * SPDX normalizado (maiúsculas)
   * 📚 SPDX é case-insensitive, mas normalizamos para maiúsculas
   * para comparação determinística
   * @returns {string|null}
   */
  get normalizedSpdx() {
    if (!this.spdx) return null;
    return this.spdx.trim().toUpperCase();
  }

  /**
   * Verifica se permite uso comercial
   * @returns {boolean}
   */
  get allowsCommercial() {
    return this.commercial === true;
  }

  /**
   * Verifica se permite obras derivadas
   * @returns {boolean}
   */
  get allowsDerivatives() {
    return this.derivatives === true;
  }

  /**
   * Verifica se requer compartilhamento igual
   * @returns {boolean}
   */
  get requiresShareAlike() {
    return this.shareAlike === true;
  }

  /**
   * Verifica se é open
   * @returns {boolean}
   */
  get isOpen() {
    return this.type === "open";
  }

  /**
   * Verifica se é Creative Commons
   * @returns {boolean}
   */
  get isCreativeCommons() {
    return this.name && this.name.toLowerCase().includes("cc");
  }

  // ============================================================
  // MÉTODOS ESTÁTICOS
  // ============================================================

  /**
   * Cria uma licença a partir de um nome ou URL
   * 
   * 📚 CORRIGIDO: Nunca retorna null. Se não encontrar,
   * retorna License.empty() (objeto vazio, não null).
   * Isso evita verificações de null em todo o código.
   * 
   * @param {string} nameOrUrl - Nome ou URL da licença
   * @returns {License} Licença criada (sempre uma entidade)
   */
  static fromName(nameOrUrl) {
    if (!nameOrUrl) return License.empty();

    const normalized = nameOrUrl.toLowerCase().trim();

    // 1. Tenta match exato
    for (const [key, data] of Object.entries(License.COMMON_LICENSES)) {
      if (
        normalized === key ||
        normalized === data.name.toLowerCase() ||
        normalized === data.spdx?.toLowerCase()
      ) {
        return new License({
          name: data.name,
          spdx: data.spdx,
          url: data.url,
          commercial: data.commercial,
          derivatives: data.derivatives,
          shareAlike: data.shareAlike,
          type: data.type || "open",
        });
      }
    }

    // 2. Tenta match parcial
    for (const [key, data] of Object.entries(License.COMMON_LICENSES)) {
      if (
        normalized.includes(key) ||
        data.name.toLowerCase().includes(normalized) ||
        data.spdx?.toLowerCase().includes(normalized)
      ) {
        return new License({
          name: data.name,
          spdx: data.spdx,
          url: data.url,
          commercial: data.commercial,
          derivatives: data.derivatives,
          shareAlike: data.shareAlike,
          type: data.type || "open",
        });
      }
    }

    // 3. Fallback: licença desconhecida
    return new License({
      name: nameOrUrl,
      type: "unknown",
    });
  }

  // ============================================================
  // MÉTODOS IMUTÁVEIS
  // ============================================================

  /**
   * Cria uma cópia com atualizações
   * @param {Object} updates - Atualizações
   * @returns {License} Nova instância
   */
  with(updates) {
    return new License({
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
      url: this.url,
      type: this.type,
      spdx: this.spdx,
      commercial: this.commercial,
      derivatives: this.derivatives,
      shareAlike: this.shareAlike,
      version: this.version,
      metadata: this.metadata,
    };
  }

  // ============================================================
  // MÉTODOS PRIVADOS ESTÁTICOS
  // ============================================================

  /**
   * Cria identidade para a licença
   * Prioridade: SPDX normalizado > Nome normalizado
   * @param {Object} data - Dados da licença
   * @returns {Identity}
   */
  static #createIdentity(data) {
    if (data.spdx) {
      const normalized = data.spdx.trim().toUpperCase();
      if (normalized) {
        return Identity.fromKey(`spdx:${normalized}`);
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
   * Cria uma licença vazia
   * @returns {License}
   */
  static empty() {
    return new License({});
  }

  /**
   * Cria uma licença a partir de um objeto plano
   * @param {Object} data - Dados
   * @returns {License}
   */
  static fromPlainObject(data) {
    return new License(data);
  }
}

export default License;