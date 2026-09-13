/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Domain — Identifier Merge Policy
 * ============================================================
 */

import { IdentifierPriorityPolicy } from "./identifier-priority.policy.js";
import { DuplicateIdentifierError } from "../errors/duplicate-identifier.error.js";

// ============================================================
// MERGE CONTEXT
// ============================================================

/**
 * Contexto para merge de identificadores.
 * 
 * Fornece informações adicionais para a política de merge,
 * como fonte, estratégia e timestamps.
 * 
 * @class MergeContext
 */
export class MergeContext {
  /**
   * @param {Object} options - Opções do contexto
   * @param {string} [options.source] - Fonte do identificador (provider)
   * @param {string} [options.strategy] - Estratégia de merge: "prefer-valid" | "strict" | "prefer-newest" | "prefer-source"
   * @param {string} [options.timestamp] - Timestamp ISO do merge
   * @param {Object} [options.existingContext] - Contexto do identificador existente
   * @param {Object} [options.incomingContext] - Contexto do identificador recebido
   */
  constructor(options = {}) {
    this.source = options.source || "unknown";
    this.strategy = options.strategy || "prefer-valid";
    this.timestamp = options.timestamp || new Date().toISOString();
    this.existingContext = options.existingContext || {};
    this.incomingContext = options.incomingContext || {};

    Object.freeze(this);
  }

  /**
   * Cria um contexto com estratégia específica
   * @param {string} strategy - Estratégia de merge
   * @param {Object} options - Opções adicionais
   * @returns {MergeContext} Novo contexto
   */
  static withStrategy(strategy, options = {}) {
    return new MergeContext({ ...options, strategy });
  }

  /**
   * Cria um contexto para fonte específica
   * @param {string} source - Fonte do identificador
   * @param {Object} options - Opções adicionais
   * @returns {MergeContext} Novo contexto
   */
  static fromSource(source, options = {}) {
    return new MergeContext({ ...options, source });
  }

  /**
   * Cria um contexto com timestamp para prefer-newest
   * @param {string|number} timestamp - Timestamp (ISO string ou epoch)
   * @param {Object} options - Opções adicionais
   * @returns {MergeContext} Novo contexto
   */
  static withTimestamp(timestamp, options = {}) {
    const ts = typeof timestamp === "number" 
      ? new Date(timestamp).toISOString() 
      : timestamp;
    return new MergeContext({ ...options, timestamp: ts });
  }
}

// ============================================================
// IDENTIFIER MERGE POLICY
// ============================================================

/**
 * Política de merge para identificadores.
 * 
 * Responsabilidades:
 * - Decidir como lidar com identificadores duplicados
 * - Aplicar estratégias de merge (prefer-valid, strict, prefer-newest, prefer-source)
 * - Preservar a imutabilidade dos identificadores
 * - Lançar DuplicateIdentifierError em conflitos
 * 
 * @implements {IdentifierMergePolicy}
 */
export class IdentifierMergePolicy {
  /**
   * Merge de dois identificadores do mesmo tipo
   * 
   * @param {Identifier} existing - Identificador existente
   * @param {Identifier} incoming - Novo identificador
   * @param {MergeContext} context - Contexto de merge
   * @returns {Identifier} Identificador a ser mantido
   * @throws {DuplicateIdentifierError} Se houver conflito e a estratégia for strict
   */
  static merge(existing, incoming, context = new MergeContext()) {
    // Validações básicas
    if (!existing) return incoming;
    if (!incoming) return existing;

    const { strategy = "prefer-valid" } = context;

    const existingIsValid = existing.isValid !== false;
    const incomingIsValid = incoming.isValid !== false;

    // ============================================================
    // ESTRATÉGIA: STRICT
    // ============================================================
    if (strategy === "strict") {
      if (existingIsValid && incomingIsValid && existing.value !== incoming.value) {
        throw new DuplicateIdentifierError({
          type: existing.type,
          existingValue: existing.value,
          incomingValue: incoming.value,
          source: context.source,
          timestamp: context.timestamp,
        });
      }
      return existing;
    }

    // ============================================================
    // ESTRATÉGIA: PREFER-VALID (PADRÃO)
    // ============================================================
    if (strategy === "prefer-valid") {
      if (existingIsValid && incomingIsValid && existing.value !== incoming.value) {
        throw new DuplicateIdentifierError({
          type: existing.type,
          existingValue: existing.value,
          incomingValue: incoming.value,
          source: context.source,
          timestamp: context.timestamp,
        });
      }

      if (incomingIsValid && !existingIsValid) {
        return incoming;
      }

      if (existingIsValid && !incomingIsValid) {
        return existing;
      }

      return existing;
    }

    // ============================================================
    // ESTRATÉGIA: PREFER-NEWEST
    // ============================================================
    // ⚠️ Requer timestamps no contexto (existingContext.timestamp ou incomingContext.timestamp)
    // Use MergeContext.withTimestamp() para criar o contexto adequado
    if (strategy === "prefer-newest") {
      const existingTime = IdentifierMergePolicy.#getTimestamp(context.existingContext);
      const incomingTime = IdentifierMergePolicy.#getTimestamp(context.incomingContext);

      if (incomingTime > existingTime) {
        return incoming;
      }
      return existing;
    }

    // ============================================================
    // ESTRATÉGIA: PREFER-SOURCE
    // ============================================================
    if (strategy === "prefer-source") {
      const existingPriority = IdentifierPriorityPolicy.getSourcePriority(existing.source);
      const incomingPriority = IdentifierPriorityPolicy.getSourcePriority(incoming.source);

      if (incomingPriority > existingPriority) {
        return incoming;
      }

      if (existingPriority > incomingPriority) {
        return existing;
      }

      // Mesma prioridade → compara por tipo
      const existingTypePriority = IdentifierPriorityPolicy.getTypePriority(existing.type);
      const incomingTypePriority = IdentifierPriorityPolicy.getTypePriority(incoming.type);

      if (incomingTypePriority > existingTypePriority) {
        return incoming;
      }

      return existing;
    }

    // ============================================================
    // ESTRATÉGIA: PREFER-METADATA (FALLBACK)
    // ============================================================
    if (strategy === "prefer-metadata") {
      const existingScore = IdentifierMergePolicy.#calculateMetadataScore(existing);
      const incomingScore = IdentifierMergePolicy.#calculateMetadataScore(incoming);

      if (incomingScore > existingScore) {
        return incoming;
      }
      return existing;
    }

    // Fallback: mantém o existente
    return existing;
  }

  /**
   * Verifica se dois identificadores são compatíveis
   * @param {Identifier} existing - Identificador existente
   * @param {Identifier} incoming - Identificador recebido
   * @returns {boolean} True se forem compatíveis
   */
  static areCompatible(existing, incoming) {
    if (!existing || !incoming) return true;

    const existingIsValid = existing.isValid !== false;
    const incomingIsValid = incoming.isValid !== false;

    if (existingIsValid && incomingIsValid && existing.value !== incoming.value) {
      return false;
    }

    return true;
  }

  /**
   * Cria um MergeContext a partir de opções
   * @param {Object} options - Opções do contexto
   * @returns {MergeContext} Novo contexto
   */
  static createContext(options = {}) {
    return new MergeContext(options);
  }

  // ============================================================
  // MÉTODOS PRIVADOS ESTÁTICOS
  // ============================================================

  /**
   * Obtém timestamp de um contexto
   * @param {Object} context - Contexto com timestamp
   * @returns {number} Timestamp em epoch (milissegundos)
   */
  static #getTimestamp(context = {}) {
    if (context.timestamp) {
      const parsed = new Date(context.timestamp).getTime();
      if (!Number.isNaN(parsed)) return parsed;
    }
    return Date.now();
  }

  /**
   * Calcula score de metadados para um identificador
   * @param {Identifier} identifier - Identificador
   * @returns {number} Score (0-100)
   */
  static #calculateMetadataScore(identifier) {
    let score = 0;

    // Confiança (0-100)
    if (identifier.confidence) {
      score += identifier.confidence * 20; // 0-20
    }

    // Provedor presente
    if (identifier.provider) {
      score += 10;
    }

    // Fonte presente
    if (identifier.source) {
      score += 5;
    }

    // Metadata presente e não vazio
    if (identifier.metadata && Object.keys(identifier.metadata).length > 0) {
      score += 15;
    }

    // Identificador válido
    if (identifier.isValid) {
      score += 20;
    }

    // Valor com comprimento razoável
    if (identifier.value && identifier.value.length > 5) {
      score += 10;
    }

    // Tipo reconhecido
    if (identifier.type && identifier.type !== "unknown") {
      score += 10;
    }

    // Tipo prioritário (DOI, PMID)
    const typePriority = IdentifierPriorityPolicy.getTypePriority(identifier.type);
    if (typePriority > 0) {
      score += Math.min(typePriority * 2, 10);
    }

    return Math.min(score, 100);
  }
}

export default IdentifierMergePolicy;