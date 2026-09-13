/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Engines — Merge Authors Policy
 * ============================================================
 *
 * 📚 Política de mesclagem para listas de autores.
 * 
 * Regras específicas para mesclar duas listas de autores:
 * - Une as duas listas (sem perder nenhum autor)
 * - Deduplica por nome normalizado (case-insensitive, sem acentos)
 * - Preserva a ordem original dos autores
 * - Se um autor tem ORCID, ele tem prioridade sobre o mesmo nome sem ORCID
 */

import { BaseMergePolicy } from "./base.policy.js";
import { normalizePersonNameForIdentity } from "../../../utils/normalize-author.js";

export class AuthorsMergePolicy extends BaseMergePolicy {
  constructor(options = {}) {
    super({ field: "authors" });
    this.mergeByName = options.mergeByName ?? true;
    this.deduplicate = options.deduplicate ?? true;
  }

  /**
   * Mescla duas listas de autores.
   * 
   * 📚 Regras:
   * 1. Une as duas listas
   * 2. Deduplica por nome normalizado
   * 3. Se duplicata, mantém o que tem ORCID
   * 4. Preserva a ordem (existing primeiro, depois novos)
   */
  merge(existing, incoming, context = {}) {
    const existingArr = Array.isArray(existing) ? existing : [];
    const incomingArr = Array.isArray(incoming) ? incoming : [];

    if (existingArr.length === 0) return incomingArr;
    if (incomingArr.length === 0) return existingArr;

    if (!this.deduplicate) {
      return [...existingArr, ...incomingArr];
    }

    const result = [...existingArr];
    const seen = new Map();

    // Indexa autores existentes por nome normalizado
    // Usa o índice do loop (O(1)) em vez de indexOf (O(n))
    for (let i = 0; i < existingArr.length; i++) {
      const author = existingArr[i];
      const key = this.#normalizeAuthor(author);
      if (key && !seen.has(key)) {
        seen.set(key, i);
      }
    }

    // Adiciona autores do incoming, deduplicando
    for (const author of incomingArr) {
      const key = this.#normalizeAuthor(author);

      if (!key) {
        result.push(author);
        continue;
      }

      if (seen.has(key)) {
        // Duplicata: mantém o que tem ORCID
        const existingIndex = seen.get(key);
        const existingAuthor = result[existingIndex];

        if (this.#hasOrcid(author) && !this.#hasOrcid(existingAuthor)) {
          result[existingIndex] = author;
        }
      } else {
        result.push(author);
        seen.set(key, result.length - 1);
      }
    }

    return result;
  }

  canMerge(existing, incoming) {
    return Array.isArray(incoming) && incoming.length > 0;
  }

  // ============================================================
  // PRIVADO
  // ============================================================

  /**
   * Normaliza um autor para chave de comparação.
   * @private
   */
  #normalizeAuthor(author) {
    if (!author) return null;

    if (typeof author === "string") {
      return normalizePersonNameForIdentity(author);
    }

    if (author.name) {
      return normalizePersonNameForIdentity(author.name);
    }

    return null;
  }

  /**
   * Verifica se um autor tem ORCID.
   * @private
   */
  #hasOrcid(author) {
    if (!author) return false;
    if (typeof author === "string") return false;
    return !!author.orcid || !!author.ORCID;
  }
}

export default AuthorsMergePolicy;