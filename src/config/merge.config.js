/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Config — Merge Configuration
 * ============================================================
 *
 * 📚 AULA: Configuração de merge (mesclagem de artigos).
 * 
 * Quando dois artigos de providers diferentes representam a
 * mesma publicação, o merge decide qual valor manter.
 * 
 * 📚 Estratégias de merge:
 * 
 * - PREFER_VALID: mantém o valor válido (não nulo, não vazio)
 * - PREFER_LONGEST: mantém o valor mais longo (títulos, resumos)
 * - PREFER_HIGHEST: mantém o maior valor (citações, confiança)
 * - PREFER_TRUE: mantém true sobre false (OA, peerReviewed)
 * - PREFER_SOURCE: mantém o valor da fonte mais confiável
 * - PREFER_MOST_COMPLETE: mantém o objeto mais completo
 * - MERGE_COLLECTIONS: mescla duas coleções (identifiers)
 * 
 * 📚 sourcePriority deriva de providers.config.js.
 * Não há duplicação — a prioridade de cada provider é a mesma
 * usada pelo Planner.
 * 
 * feat(config): add merge configuration with strategy constants
 */

import { deepFreeze } from "../utils/deep-freeze.js";
import { providersConfig } from "./providers.config.js";

/**
 * Constantes de estratégia de merge.
 * 
 * 📚 Evita erros de digitação e melhora autocomplete.
 * Use MergeStrategy.PREFER_LONGEST em vez de "prefer-longest".
 */
export const MergeStrategy = deepFreeze({
  PREFER_VALID: "prefer-valid",
  PREFER_LONGEST: "prefer-longest",
  PREFER_HIGHEST: "prefer-highest",
  PREFER_TRUE: "prefer-true",
  PREFER_SOURCE: "prefer-source",
  PREFER_MOST_COMPLETE: "prefer-most-complete",
  MERGE_COLLECTIONS: "merge-collections",
});

/**
 * Prioridade de fontes derivada de providers.config.js.
 * 
 * 📚 Fonte única da verdade — a prioridade de cada provider
 * é definida em providers.config.js e apenas lida aqui.
 */
const sourcePriority = Object.fromEntries(
  Object.entries(providersConfig).map(([key, cfg]) => [key, cfg.priority])
);

/**
 * Configuração de merge.
 * 
 * @constant {Object} mergeConfig — Imutável (deepFreeze recursivo)
 */
export const mergeConfig = deepFreeze({
  /**
   * Estratégia padrão de merge.
   */
  defaultStrategy: MergeStrategy.PREFER_VALID,

  /**
   * Similaridade mínima para considerar dois artigos como o mesmo.
   * 0.8 = 80% de similaridade no título.
   */
  similarityThreshold: 0.8,

  /**
   * Estratégias por campo.
   */
  fields: {
    title: {
      strategy: MergeStrategy.PREFER_LONGEST,
      minLength: 10,
    },
    abstract: {
      strategy: MergeStrategy.PREFER_LONGEST,
      minLength: 50,
    },
    authors: {
      strategy: MergeStrategy.PREFER_MOST_COMPLETE,
      mergeByName: true,
      deduplicate: true,
    },
    citations: {
      strategy: MergeStrategy.PREFER_HIGHEST,
    },
    confidence: {
      strategy: MergeStrategy.PREFER_HIGHEST,
    },
    publicationDate: {
      strategy: MergeStrategy.PREFER_VALID,
    },
    doi: {
      strategy: MergeStrategy.PREFER_VALID,
      normalize: true,
    },
    url: {
      strategy: MergeStrategy.PREFER_VALID,
    },
    pdfUrl: {
      strategy: MergeStrategy.PREFER_VALID,
    },
    openAccess: {
      strategy: MergeStrategy.PREFER_TRUE,
    },
    peerReviewed: {
      strategy: MergeStrategy.PREFER_TRUE,
    },
    language: {
      strategy: MergeStrategy.PREFER_VALID,
    },
    type: {
      strategy: MergeStrategy.PREFER_VALID,
    },
    journal: {
      strategy: MergeStrategy.PREFER_MOST_COMPLETE,
    },
    publisher: {
      strategy: MergeStrategy.PREFER_MOST_COMPLETE,
    },
    license: {
      strategy: MergeStrategy.PREFER_VALID,
    },
    references: {
      strategy: MergeStrategy.PREFER_MOST_COMPLETE,
      deduplicate: true,
    },
    identifiers: {
      strategy: MergeStrategy.MERGE_COLLECTIONS,
      deduplicate: true,
    },
  },

  /**
   * Prioridade de fontes para desempate.
   * Derivado de providers.config.js — fonte única da verdade.
   */
  sourcePriority,
});

export default mergeConfig;