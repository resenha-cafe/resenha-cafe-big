/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Engines — Merge Abstract Policy
 * ============================================================
 *
 * 📚 Política de mesclagem para resumos (abstract).
 * 
 * Regras específicas para mesclar dois resumos:
 * - Prefere o resumo mais longo (mais informativo)
 * - Resumo mínimo de 50 caracteres para ser considerado
 * - Se incoming for muito curto, mantém o existente
 */

import { BaseMergePolicy } from "./base.policy.js";

export class AbstractMergePolicy extends BaseMergePolicy {
  constructor(options = {}) {
    super({ field: "abstract" });
    this.minLength = options.minLength ?? 50;
  }

  /**
   * Mescla dois resumos.
   * 
   * 📚 Regras:
   * 1. Se incoming é inválido ou muito curto, mantém existing
   * 2. Se existing é inválido, usa incoming
   * 3. Prefere o mais longo
   */
  merge(existing, incoming, context = {}) {
    // Se incoming é inválido, mantém existing
    if (!this.#isValid(incoming)) return existing;

    // Se existing é inválido, usa incoming
    if (!this.#isValid(existing)) return incoming;

    // Prefere o mais longo
    if (incoming.length > existing.length) {
      return incoming;
    }

    return existing;
  }

  canMerge(existing, incoming) {
    return this.#isValid(incoming);
  }

  #isValid(value) {
    if (typeof value !== "string") return false;
    return value.trim().length >= this.minLength;
  }
}

export default AbstractMergePolicy;