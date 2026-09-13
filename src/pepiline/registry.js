/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Pipeline — Step Registry
 * ============================================================
 *
 * 📚 AULA: O que é o Step Registry?
 * 
 * O Step Registry é um catálogo central de todos os steps
 * disponíveis no sistema. Ele permite:
 * 
 * 1. Registrar steps por nome (ex: "search", "adapt")
 * 2. Montar pipelines dinamicamente por configuração
 * 3. Resolver dependências entre steps
 * 4. Validar se todos os steps de um pipeline existem
 * 
 * 📚 Analogia:
 * É como uma caixa de ferramentas. Você não precisa saber
 * onde cada ferramenta está — basta pedir pelo nome.
 * 
 * 📚 Imutabilidade:
 * O registro NÃO modifica os steps originais. O nome é usado
 * apenas como chave no Map interno.
 * 
 * feat(pipeline): add step registry with pipeline creation
 */

export class StepRegistry {
  constructor() {
    /** @type {Map<string, Object>} */
    this._steps = new Map();
  }

  /**
   * Registra um step no catálogo.
   * 
   * 📚 Não modifica o step original — apenas armazena a referência.
   * 
   * @param {string} name - Nome do step
   * @param {Object} step - Instância do step
   * @returns {StepRegistry} this (fluent API)
   * @throws {Error} Se o nome já estiver registrado
   */
  register(name, step) {
    if (this._steps.has(name)) {
      throw new Error(
        `Step "${name}" is already registered. Use replace() to override.`
      );
    }

    this._steps.set(name, step);
    return this;
  }

  /**
   * Substitui um step já registrado.
   * 
   * @param {string} name - Nome do step
   * @param {Object} step - Nova instância
   * @returns {StepRegistry} this
   */
  replace(name, step) {
    this._steps.set(name, step);
    return this;
  }

  /**
   * Remove um step do catálogo.
   * 
   * @param {string} name - Nome do step
   * @returns {StepRegistry} this
   */
  remove(name) {
    this._steps.delete(name);
    return this;
  }

  /**
   * Obtém um step pelo nome.
   * 
   * @param {string} name - Nome do step
   * @returns {Object|null} Step ou null se não encontrado
   */
  get(name) {
    return this._steps.get(name) || null;
  }

  /**
   * Verifica se um step está registrado.
   * 
   * @param {string} name - Nome do step
   * @returns {boolean}
   */
  has(name) {
    return this._steps.has(name);
  }

  /**
   * Lista todos os steps registrados.
   * 
   * @returns {Array<Object>}
   */
  list() {
    return Array.from(this._steps.values());
  }

  /**
   * Lista os nomes de todos os steps registrados.
   * 
   * @returns {Array<string>}
   */
  listNames() {
    return Array.from(this._steps.keys());
  }

  /**
   * Cria um array de steps a partir de uma lista de nomes.
   * 
   * 📚 Útil para montar pipelines dinamicamente.
   * A ordem dos nomes determina a ordem de execução.
   * 
   * @param {Array<string>} stepNames - Nomes dos steps na ordem desejada
   * @returns {Array<Object>} Array de instâncias de steps
   * @throws {Error} Se algum step não for encontrado
   * 
   * @example
   * const steps = registry.createPipeline([
   *   "search",
   *   "adapt",
   *   "normalize",
   *   "validate",
   *   "merge",
   *   "rank",
   * ]);
   */
  createPipeline(stepNames = []) {
    const steps = [];

    for (const name of stepNames) {
      const step = this._steps.get(name);

      if (!step) {
        throw new Error(
          `Step "${name}" not found in registry. ` +
          `Available: ${this.listNames().join(", ")}`
        );
      }

      steps.push(step);
    }

    return steps;
  }

  /**
   * Valida se todos os steps de uma lista existem.
   * 
   * @param {Array<string>} stepNames - Nomes a validar
   * @returns {Object} { valid, missing }
   */
  validate(stepNames = []) {
    const missing = [];

    for (const name of stepNames) {
      if (!this._steps.has(name)) {
        missing.push(name);
      }
    }

    return {
      valid: missing.length === 0,
      missing,
      available: this.listNames(),
    };
  }

  /**
   * Número de steps registrados.
   * 
   * @returns {number}
   */
  get size() {
    return this._steps.size;
  }

  /**
   * Remove todos os steps.
   */
  clear() {
    this._steps.clear();
  }
}

export default StepRegistry;