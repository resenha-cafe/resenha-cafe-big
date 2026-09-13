/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Engines — Merge Title Policy
 * ============================================================
 *
 * 📚 Política de mesclagem para títulos.
 * 
 * Regras específicas para mesclar dois títulos:
 * - Prefere o título mais longo (mais descritivo)
 * - Título mínimo de 10 caracteres para ser considerado
 * - Remove títulos duplicados (case-insensitive)
 */

import { BaseMergePolicy } from "./base.policy.js";
import { normalizeTitleForIdentity } from "../../../utils/normalize-author.js";

export class TitleMergePolicy extends BaseMergePolicy {
  constructor(options = {}) {
    super({ field: "title" });
    this.minLength = options.minLength ?? 10;
  }

  /**
   * Mescla dois títulos.
   * 
   * 📚 Regras:
   * 1. Se são o mesmo (normalizado), mantém o existente
   * 2. Se incoming é mais longo e >= minLength, usa incoming
   * 3. Caso contrário, mantém o existente
   */
  merge(existing, incoming, context = {}) {
    // Se incoming é inválido, mantém existing
    if (!this.#isValid(incoming)) return existing;

    // Se existing é inválido, usa incoming
    if (!this.#isValid(existing)) return incoming;

    // Se são o mesmo título (normalizado), mantém o existente
    const normalizedExisting = normalizeTitleForIdentity(existing);
    const normalizedIncoming = normalizeTitleForIdentity(incoming);
    if (normalizedExisting === normalizedIncoming) return existing;

    // Prefere o mais longo, se incoming atingir o mínimo
    if (incoming.length >= this.minLength && incoming.length > existing.length) {
      return incoming;
    }

    return existing;
  }

  canMerge(existing, incoming) {
    return this.#isValid(incoming);
  }

  #isValid(value) {
    return typeof value === "string" && value.trim().length > 0;
  }
}

export default TitleMergePolicy;