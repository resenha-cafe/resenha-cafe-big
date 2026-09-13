/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Domain — Identifier Priority Policy
 * ============================================================
 */

/**
 * Prioridade de fontes para identificadores (congelado)
 * Quanto maior o número, maior a prioridade
 * 
 * @note As prioridades refletem a confiabilidade e completude
 *       de cada fonte. OpenAlex é prioridade máxima por sua
 *       cobertura abrangente e qualidade de metadados.
 */
export const SOURCE_PRIORITY = Object.freeze({
  openalex: 5,
  crossref: 3,
  semantic: 2,
  core: 1,
  scielo: 1,
  europepmc: 1,
});

/**
 * Prioridade de tipos de identificador (congelado)
 * A ordem define a prioridade (primeiro = maior prioridade)
 * 
 * @note DOI é prioridade máxima por ser o identificador
 *       mais estável e amplamente adotado.
 */
export const ID_PRIORITY = Object.freeze([
  "doi",
  "pmid",
  "pmcid",
  "openalex",
  "semantic",
]);

// ============================================================
// CUSTOM IDENTIFIER PRIORITY POLICY (CLASSE INTERNA)
// ============================================================

/**
 * Política de prioridade customizada.
 * Imutável, com a mesma interface da classe principal.
 * 
 * @implements {IdentifierPriorityPolicy}
 */
class CustomIdentifierPriorityPolicy {
  /**
   * @param {Object} sourcePriority - Prioridade por fonte
   * @param {Array} idPriority - Prioridade por tipo
   */
  constructor(sourcePriority, idPriority) {
    this.sourcePriority = Object.freeze({ ...sourcePriority });
    this.idPriority = Object.freeze([...idPriority]);
    Object.freeze(this);
  }

  /**
   * Obtém a prioridade de uma fonte
   * @param {string} source - Nome da fonte (provider)
   * @returns {number} Prioridade (0 = menor prioridade)
   */
  getSourcePriority(source) {
    if (!source) return 0;
    return this.sourcePriority[source.toLowerCase()] ?? 0;
  }

  /**
   * Obtém a prioridade de um tipo de identificador
   * @param {string} type - Tipo do identificador
   * @returns {number} Prioridade (0 = menor prioridade)
   */
  getTypePriority(type) {
    if (!type) return 0;
    const index = this.idPriority.indexOf(type.toLowerCase());
    return index >= 0 ? this.idPriority.length - index : 0;
  }

  /**
   * Compara duas fontes
   * @param {string} sourceA - Primeira fonte
   * @param {string} sourceB - Segunda fonte
   * @returns {number} Negativo se A < B, 0 se igual, positivo se A > B
   */
  compareSources(sourceA, sourceB) {
    return this.getSourcePriority(sourceA) - this.getSourcePriority(sourceB);
  }

  /**
   * Compara dois tipos
   * @param {string} typeA - Primeiro tipo
   * @param {string} typeB - Segundo tipo
   * @returns {number} Negativo se A < B, 0 se igual, positivo se A > B
   */
  compareTypes(typeA, typeB) {
    return this.getTypePriority(typeA) - this.getTypePriority(typeB);
  }

  /**
   * Retorna as prioridades como objeto plano
   * @returns {Object} Prioridades
   */
  toPlainObject() {
    return {
      sourcePriority: { ...this.sourcePriority },
      idPriority: [...this.idPriority],
    };
  }
}

// ============================================================
// IDENTIFIER PRIORITY POLICY (PRINCIPAL)
// ============================================================

/**
 * Política de prioridade para identificadores.
 * 
 * Responsabilidades:
 * - Definir prioridade por fonte (provider)
 * - Definir prioridade por tipo de identificador
 * - Fornecer métodos de comparação
 * - Ser extensível via configuração
 * 
 * @implements {IdentifierPriorityPolicy}
 */
export class IdentifierPriorityPolicy {
  /**
   * Obtém a prioridade de uma fonte
   * @param {string} source - Nome da fonte (provider)
   * @returns {number} Prioridade (0 = menor prioridade)
   */
  static getSourcePriority(source) {
    if (!source) return 0;
    return SOURCE_PRIORITY[source.toLowerCase()] ?? 0;
  }

  /**
   * Obtém a prioridade de um tipo de identificador
   * @param {string} type - Tipo do identificador
   * @returns {number} Prioridade (0 = menor prioridade)
   */
  static getTypePriority(type) {
    if (!type) return 0;
    const index = ID_PRIORITY.indexOf(type.toLowerCase());
    return index >= 0 ? ID_PRIORITY.length - index : 0;
  }

  /**
   * Compara duas fontes
   * @param {string} sourceA - Primeira fonte
   * @param {string} sourceB - Segunda fonte
   * @returns {number} Negativo se A < B, 0 se igual, positivo se A > B
   */
  static compareSources(sourceA, sourceB) {
    return this.getSourcePriority(sourceA) - this.getSourcePriority(sourceB);
  }

  /**
   * Compara dois tipos
   * @param {string} typeA - Primeiro tipo
   * @param {string} typeB - Segundo tipo
   * @returns {number} Negativo se A < B, 0 se igual, positivo se A > B
   */
  static compareTypes(typeA, typeB) {
    return this.getTypePriority(typeA) - this.getTypePriority(typeB);
  }

  /**
   * Retorna as prioridades como objeto plano
   * @returns {Object} Prioridades
   */
  static toPlainObject() {
    return {
      sourcePriority: { ...SOURCE_PRIORITY },
      idPriority: [...ID_PRIORITY],
    };
  }

  /**
   * Cria uma política com prioridades customizadas
   * 
   * Retorna uma instância imutável de CustomIdentifierPriorityPolicy
   * com a MESMA INTERFACE da classe, permitindo substituição
   * sem alterar o código cliente.
   * 
   * @param {Object} options - Opções de prioridade
   * @param {Object} options.sourcePriority - Prioridade por fonte (sobrescreve o padrão)
   * @param {Array} options.idPriority - Prioridade por tipo (sobrescreve o padrão)
   * @returns {CustomIdentifierPriorityPolicy} Política com prioridades customizadas
   * 
   * @example
   * const customPolicy = IdentifierPriorityPolicy.withCustomPriorities({
   *   sourcePriority: { pubmed: 10 },
   *   idPriority: ['doi', 'pmid']
   * });
   * 
   * customPolicy.getSourcePriority('pubmed'); // 10
   * customPolicy.getTypePriority('pmid'); // 2
   */
  static withCustomPriorities(options = {}) {
    const { sourcePriority = {}, idPriority = [] } = options;

    const mergedSourcePriority = { ...SOURCE_PRIORITY, ...sourcePriority };
    const mergedIdPriority = idPriority.length > 0 ? idPriority : [...ID_PRIORITY];

    return new CustomIdentifierPriorityPolicy(mergedSourcePriority, mergedIdPriority);
  }
}

export default IdentifierPriorityPolicy;