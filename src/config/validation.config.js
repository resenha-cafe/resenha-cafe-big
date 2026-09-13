/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Config — Validation Configuration
 * ============================================================
 *
 * 📚 AULA: Configuração de validação.
 * 
 * Define as regras de validação para artigos que entram no sistema.
 * 
 * 📚 Regras configuráveis:
 * 
 * - Campos obrigatórios (article must have X)
 * - Comprimentos mínimos/máximos
 * - Modo estrito (warnings viram erros)
 * 
 * 📚 Fonte da verdade:
 * A validação de DOI e tipos delega aos normalizers/validators
 * existentes (normalizeDOI, ArticleValidator.normalizeType).
 * As configurações aqui são apenas limites numéricos e flags.
 * 
 * feat(config): add validation configuration with field rules
 */

import { deepFreeze } from "../utils/deep-freeze.js";

/**
 * Configuração de validação.
 * 
 * @constant {Object} validationConfig — Imutável (deepFreeze recursivo)
 */
export const validationConfig = deepFreeze({
  /**
   * Modo estrito.
   * Se true, warnings são tratados como erros.
   */
  strict: false,

  /**
   * Campos obrigatórios.
   * Um artigo deve ter pelo menos um destes campos.
   */
  required: {
    /** Pelo menos um destes deve estar presente */
    anyOf: ["title", "doi"],
  },

  /**
   * Regras por campo.
   */
  fields: {
    title: {
      minLength: 2,
      maxLength: 1000,
    },
    abstract: {
      minLength: 10,
      maxLength: 10000,
    },
    authors: {
      minCount: 1,
      maxCount: 100,
    },
    doi: {
      // Validação delegada ao normalizeDOI — aqui apenas limites
      required: false,
    },
    publicationDate: {
      minYear: 1600,
      maxYear: null, // Ano atual (calculado em runtime)
      allowFuture: false,
    },
    type: {
      // Validação delegada ao ArticleValidator.normalizeType
      normalize: true,
    },
    language: {
      allowed: ["pt", "en", "es", "fr", "de", "it"],
    },
    citations: {
      min: 0,
      max: 1000000,
    },
    // 📚 Article normaliza confidence para 0-1
    confidence: {
      min: 0,
      max: 1,
    },
    url: {
      requireProtocol: true,
      maxLength: 2048,
    },
    references: {
      maxCount: 10000,
    },
  },

  /**
   * Warnings que NÃO bloqueiam o artigo.
   * Cada flag pode ser ligada/desligada conforme necessidade.
   */
  warnings: {
    missingAbstract: true,
    missingAuthors: true,
    missingSource: true,
    shortTitle: true,
    futureDate: true,
    veryOldDate: true,
    unknownType: true,
  },
});

export default validationConfig;