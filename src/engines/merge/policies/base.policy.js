/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Engines — Merge Base Policy
 * ============================================================
 *
 * 📚 AULA: O que é uma Merge Policy?
 * 
 * Uma Merge Policy (Política de Mesclagem) é uma regra específica
 * para decidir como mesclar um campo entre dois artigos.
 * 
 * Enquanto o Merge Engine orquestra o processo, as Policies
 * implementam as regras específicas para cada tipo de campo:
 * - TitlePolicy: como mesclar títulos
 * - AbstractPolicy: como mesclar resumos
 * - AuthorsPolicy: como mesclar listas de autores
 * - IdentifierPolicy: como mesclar identificadores
 * 
 * 📚 Por que políticas separadas?
 * 
 * 1. Cada campo tem suas próprias regras de mesclagem
 * 2. Políticas podem ser testadas isoladamente
 * 3. Novas políticas podem ser adicionadas sem mexer no Engine
 * 4. Políticas podem ser configuradas por provider
 * 
 * 📚 BaseMergePolicy vs MergeEngine.preferValid:
 * - BaseMergePolicy: prefere o EXISTENTE quando válido (conservador)
 * - MergeEngine.preferValid: prefere o INCOMING quando válido
 * 
 * 📚 Consistência de validade:
 * Usa a mesma definição de "valor válido" do MergeEngine:
 * - Não é null/undefined
 * - Não é string vazia
 * - Não é array vazio
 * - Não é objeto vazio
 * 
 * feat(engines): add merge base policy with consistent validity
 */

export class BaseMergePolicy {
  /**
   * @param {Object} options - Configuração da política
   * @param {string} options.field - Nome do campo
   */
  constructor(options = {}) {
    this.field = options.field || "unknown";
  }

  /**
   * Decide qual valor manter entre dois campos.
   * 
   * 📚 Política padrão: PREFERE O EXISTENTE se válido.
   * Diferente da estratégia prefer-valid do MergeEngine que
   * prefere o INCOMING quando ambos são válidos.
   * 
   * Usa a mesma definição de validade do MergeEngine:
   * arrays e objetos vazios NÃO são considerados válidos.
   * 
   * @param {*} existing - Valor existente
   * @param {*} incoming - Valor recebido
   * @param {Object} context - Contexto adicional (artigos, providers, etc.)
   * @returns {*} Valor a ser mantido
   */
  merge(existing, incoming, context = {}) {
    if (this.#isValid(existing)) {
      return existing;
    }
    return incoming;
  }

  /**
   * Verifica se a política pode ser aplicada.
   * 
   * @param {*} existing - Valor existente
   * @param {*} incoming - Valor recebido
   * @returns {boolean} True se pode aplicar
   */
  canMerge(existing, incoming) {
    return true;
  }

  /**
   * Verifica se um valor é considerado válido.
   * 
   * 📚 Consistente com MergeEngine.#isValid:
   * - null, undefined, "" → inválido
   * - [], {} → inválido
   * 
   * @private
   */
  #isValid(value) {
    if (value === null || value === undefined) return false;
    if (value === "") return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value).length > 0;
    return true;
  }

  /**
   * Retorna a representação em string.
   * @returns {string}
   */
  toString() {
    return `[MergePolicy: ${this.field}]`;
  }
}

export default BaseMergePolicy;