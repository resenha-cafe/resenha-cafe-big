/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Engines — Merge Identifier Policy
 * ============================================================
 *
 * 📚 Política de mesclagem para identificadores.
 * 
 * Regras específicas para mesclar identificadores (DOI, ISSN, ORCID):
 * - Identificadores com mais prioridade substituem os de menor prioridade
 * - DOI é o identificador mais forte
 * - Identificadores válidos substituem inválidos
 * - Identificadores normalizados para forma canônica
 */

import { BaseMergePolicy } from "./base.policy.js";
import { normalizeIdentifier } from "../../../utils/normalize-identifier.js";

export class IdentifierMergePolicy extends BaseMergePolicy {
  constructor(options = {}) {
    super({ field: "identifiers" });
    this.normalize = options.normalize ?? true;
  }

  /**
   * Mescla dois identificadores.
   * 
   * 📚 Regras:
   * 1. Se incoming é inválido, mantém existing
   * 2. Se existing é inválido, usa incoming
   * 3. Se ambos são válidos e diferentes, usa o de maior prioridade
   * 4. Se ambos são válidos e iguais (normalizados), mantém existing
   */
  merge(existing, incoming, context = {}) {
    // Se incoming é inválido, mantém existing
    if (!this.#isValid(incoming)) return existing;

    // Se existing é inválido, usa incoming
    if (!this.#isValid(existing)) return incoming;

    // Normaliza ambos para comparação
    const normalizedExisting = this.normalize
      ? this.#normalize(existing)
      : existing;
    const normalizedIncoming = this.normalize
      ? this.#normalize(incoming)
      : incoming;

    // Se são o mesmo (normalizado), mantém existing
    if (normalizedExisting === normalizedIncoming) return existing;

    // Prioridade: DOI > PMID > PMCID > ORCID > OpenAlex > arXiv > ISSN
    const existingPriority = this.#getPriority(existing);
    const incomingPriority = this.#getPriority(incoming);

    if (incomingPriority > existingPriority) {
      return incoming;
    }

    return existing;
  }

  canMerge(existing, incoming) {
    return this.#isValid(incoming);
  }

  // ============================================================
  // PRIVADO
  // ============================================================

  /**
   * Verifica se um identificador é válido.
   * @private
   */
  #isValid(value) {
    if (!value) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (typeof value === "object") return !!value.value;
    return false;
  }

  /**
   * Normaliza um identificador.
   * @private
   */
  #normalize(value) {
    if (typeof value === "string") {
      // Tenta detectar o tipo pelo prefixo
      if (value.startsWith("10.")) return normalizeIdentifier("doi", value);
      if (value.startsWith("PMC")) return normalizeIdentifier("pmcid", value);
      if (/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i.test(value)) return normalizeIdentifier("orcid", value);
      return value;
    }

    if (typeof value === "object" && value.type && value.value) {
      return normalizeIdentifier(value.type, value.value);
    }

    return value;
  }

  /**
   * Retorna a prioridade do tipo de identificador.
   * Quanto maior, mais forte.
   * @private
   */
  #getPriority(value) {
    const type = this.#getType(value);
    const priorities = {
      doi: 100,
      pmid: 80,
      pmcid: 70,
      orcid: 60,
      openalex: 50,
      semantic: 50,
      arxiv: 40,
      isbn: 30,
      issn: 20,
      unknown: 10,
    };
    return priorities[type] || 10;
  }

  /**
   * Extrai o tipo de um identificador.
   * @private
   */
  #getType(value) {
    if (typeof value === "string") {
      if (value.startsWith("10.")) return "doi";
      if (value.startsWith("PMC")) return "pmcid";
      if (/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i.test(value)) return "orcid";
      return "unknown";
    }

    if (typeof value === "object" && value.type) {
      return value.type.toLowerCase();
    }

    return "unknown";
  }
}

export default IdentifierMergePolicy;