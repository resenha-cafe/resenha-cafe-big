/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Engines — Merge Engine
 * ============================================================
 *
 * 📚 AULA: O que é o Merge Engine?
 * 
 * O Merge Engine é o componente que executa a mesclagem de
 * dois artigos, decidindo qual valor manter para cada campo.
 * 
 * 📚 Analogia:
 * É como um juiz de corrida. Dois artigos chegam disputando
 * quem tem o melhor valor para cada campo. O juiz aplica as
 * regras (políticas) e decide o vencedor para cada campo.
 * 
 * 📚 Estratégias suportadas:
 * - prefer-valid: mantém o valor não-nulo/não-vazio
 * - prefer-longest: mantém o texto mais longo
 * - prefer-highest: mantém o maior número
 * - prefer-true: mantém true sobre false
 * - prefer-most-complete: mantém o objeto mais completo
 * - merge-collections: une as duas coleções
 * 
 * 📚 prefer-valid vs BaseMergePolicy:
 * - Engine.preferValid: prefere o INCOMING quando válido
 * - BaseMergePolicy: prefere o EXISTENTE quando válido (mais conservador)
 * 
 * feat(engines): add merge engine with field strategies
 */

import { mergeConfig, MergeStrategy } from "../../config/merge.config.js";
import { canonicalJson } from "../../utils/canonical-json.js";

export class MergeEngine {
  /**
   * @param {Object} options - Configuração
   * @param {Object} [options.config] - Configuração de merge
   * @param {Object} [options.logger] - Logger
   */
  constructor(options = {}) {
    this.config = options.config || mergeConfig;
    this.logger = options.logger || console;
  }

  /**
   * Mescla dois artigos em um.
   * 
   * 📚 Para cada campo, aplica a estratégia definida na configuração.
   * Campos não configurados usam a estratégia padrão (prefer-valid).
   * 
   * @param {Object} existing - Artigo existente (mantido como base)
   * @param {Object} incoming - Artigo recebido (dados a mesclar)
   * @returns {Object} Artigo mesclado
   */
  merge(existing = {}, incoming = {}) {
    const result = { ...existing };
    const fields = this.config.fields || {};

    for (const [field, fieldConfig] of Object.entries(fields)) {
      const strategy = fieldConfig.strategy || this.config.defaultStrategy;

      result[field] = this.#applyStrategy(
        strategy,
        existing[field],
        incoming[field],
        fieldConfig
      );
    }

    // Campos que não estão na config são copiados do incoming se não existirem
    for (const key of Object.keys(incoming)) {
      if (!(key in result) || result[key] === null || result[key] === undefined) {
        result[key] = incoming[key];
      }
    }

    return result;
  }

  // ============================================================
  // PRIVADO
  // ============================================================

  /**
   * Aplica a estratégia de merge para um campo.
   * @private
   */
  #applyStrategy(strategy, existing, incoming, config = {}) {
    switch (strategy) {
      case MergeStrategy.PREFER_VALID:
        return this.#preferValid(existing, incoming);

      case MergeStrategy.PREFER_LONGEST:
        return this.#preferLongest(existing, incoming, config.minLength);

      case MergeStrategy.PREFER_HIGHEST:
        return this.#preferHighest(existing, incoming);

      case MergeStrategy.PREFER_TRUE:
        return this.#preferTrue(existing, incoming);

      case MergeStrategy.PREFER_MOST_COMPLETE:
        return this.#preferMostComplete(existing, incoming);

      case MergeStrategy.MERGE_COLLECTIONS:
        return this.#mergeCollections(existing, incoming, config);

      default:
        return this.#preferValid(existing, incoming);
    }
  }

  /**
   * Mantém o valor válido (não nulo, não vazio).
   * Arrays e objetos vazios são considerados inválidos.
   */
  #preferValid(existing, incoming) {
    if (this.#isValid(incoming)) {
      return incoming;
    }
    return existing;
  }

  /**
   * Mantém o texto mais longo.
   */
  #preferLongest(existing, incoming, minLength = 0) {
    const existingStr = typeof existing === "string" ? existing : "";
    const incomingStr = typeof incoming === "string" ? incoming : "";

    if (incomingStr.length >= minLength && incomingStr.length > existingStr.length) {
      return incoming;
    }
    return existing;
  }

  /**
   * Mantém o maior número.
   */
  #preferHighest(existing, incoming) {
    const existingNum = typeof existing === "number" ? existing : -Infinity;
    const incomingNum = typeof incoming === "number" ? incoming : -Infinity;

    return incomingNum > existingNum ? incoming : existing;
  }

  /**
   * Mantém true sobre false/null/undefined.
   * Preserva o valor original do incoming (não substitui por literal).
   */
  #preferTrue(existing, incoming) {
    return incoming === true ? incoming : existing;
  }

  /**
   * Mantém o objeto mais completo (mais chaves preenchidas).
   */
  #preferMostComplete(existing, incoming) {
    if (!existing && !incoming) return null;
    if (!existing) return incoming;
    if (!incoming) return existing;

    if (Array.isArray(existing) && Array.isArray(incoming)) {
      return incoming.length > existing.length ? incoming : existing;
    }

    if (typeof existing === "object" && typeof incoming === "object") {
      const existingKeys = Object.keys(existing).filter(k => existing[k] != null);
      const incomingKeys = Object.keys(incoming).filter(k => incoming[k] != null);
      return incomingKeys.length > existingKeys.length ? incoming : existing;
    }

    return this.#preferValid(existing, incoming);
  }

  /**
   * Mescla duas coleções (arrays), removendo duplicatas.
   * 
   * 📚 Usa canonicalJson para deduplicação determinística.
   */
  #mergeCollections(existing, incoming, config = {}) {
    const existingArr = Array.isArray(existing) ? existing : [];
    const incomingArr = Array.isArray(incoming) ? incoming : [];

    if (config.deduplicate) {
      const merged = [...existingArr];
      const seen = new Set(existingArr.map(item =>
        typeof item === "object" ? canonicalJson(item) : item
      ));

      for (const item of incomingArr) {
        const key = typeof item === "object" ? canonicalJson(item) : item;
        if (!seen.has(key)) {
          merged.push(item);
          seen.add(key);
        }
      }

      return merged;
    }

    return [...existingArr, ...incomingArr];
  }

  /**
   * Verifica se um valor é considerado válido.
   * @private
   */
  #isValid(value) {
    if (value === null || value === undefined) return false;
    if (value === "") return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value).length > 0;
    return true;
  }
}

export default MergeEngine;