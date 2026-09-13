/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Domain — Duplicate Identifier Error
 * ============================================================
 *
 * 📚 AULA: Erros de domínio são diferentes de erros técnicos.
 * 
 * Um erro técnico (TypeError, NetworkError) significa que algo
 * quebrou no código ou na infraestrutura.
 * 
 * Um erro de domínio (DuplicateIdentifierError) significa que
 * uma regra de negócio foi violada. É um erro "esperado" —
 * o sistema sabe que isso pode acontecer e sabe como lidar.
 * 
 * ⚠️ Este erro é LANÇADO pela IdentifierMergePolicy quando
 * a estratégia "strict" ou "prefer-valid" encontra conflito.
 */

export class DuplicateIdentifierError extends Error {
  /**
   * @param {Object} details - Detalhes do conflito
   * @param {string} details.type - Tipo do identificador (ex: "doi")
   * @param {string} details.existingValue - Valor já existente (OBRIGATÓRIO)
   * @param {string} details.incomingValue - Valor que tentou ser adicionado (OBRIGATÓRIO)
   * @param {string} [details.source] - Fonte do identificador conflitante
   * @param {string} [details.timestamp] - Quando o conflito ocorreu (ISO)
   * 
   * @throws {TypeError} Se existingValue ou incomingValue não forem fornecidos
   */
  constructor(details = {}) {
    // 📚 Extrai os detalhes do conflito
    const {
      type = "unknown",
      existingValue,
      incomingValue,
      source = "unknown",
      timestamp = new Date().toISOString(),
    } = details;

    // 📚 Validação: campos obrigatórios
    // Um erro de identificador duplicado sem os valores conflitantes
    // não tem significado de domínio. É melhor falhar cedo (fail fast)
    // do que deixar o erro se propagar sem informações úteis.
    if (!existingValue) {
      throw new TypeError(
        "DuplicateIdentifierError: existingValue is required"
      );
    }

    if (!incomingValue) {
      throw new TypeError(
        "DuplicateIdentifierError: incomingValue is required"
      );
    }

    // 📚 Constrói uma mensagem descritiva
    // Ex: "Duplicate identifier conflict: doi '10.1000/abc' conflicts with existing '10.1000/xyz'"
    const message = `Duplicate identifier conflict: ${type} '${incomingValue}' conflicts with existing '${existingValue}'`;

    // 📚 Chama o construtor da classe pai (Error)
    // super() em Error define this.message
    super(message);

    // ============================================================
    // PROPRIEDADES DO ERRO
    // ============================================================

    /**
     * Nome do erro.
     * 
     * 📚 CORRIGIDO: Definido IMEDIATAMENTE após super().
     * 
     * Usado em:
     * - error.name (ex: "DuplicateIdentifierError")
     * - error instanceof DuplicateIdentifierError
     * - Stack traces
     * 
     * @type {string}
     */
    this.name = "DuplicateIdentifierError";

    /**
     * Tipo do identificador conflitante
     * @type {string}
     * @example "doi", "pmid", "openalex"
     */
    this.type = type;

    /**
     * Valor que já existia no artigo
     * @type {string}
     * @example "10.1000/abc"
     */
    this.existingValue = existingValue;

    /**
     * Valor que tentou ser adicionado
     * @type {string}
     * @example "10.1000/xyz"
     */
    this.incomingValue = incomingValue;

    /**
     * Fonte (provider) do identificador conflitante
     * @type {string}
     * @example "openalex", "crossref"
     */
    this.source = source;

    /**
     * Quando o conflito foi detectado
     * @type {string}
     */
    this.timestamp = timestamp;

    // ============================================================
    // CONGELAMENTO (IMUTABILIDADE)
    // ============================================================

    // 📚 Object.freeze = ninguém pode adicionar, remover ou
    // modificar propriedades deste erro depois de criado.
    // Isso garante que o erro chegue íntegro ao handler.
    Object.freeze(this);
  }

  // ============================================================
  // GETTERS
  // ============================================================

  /**
   * Mensagem amigável para logs e exibição.
   * 
   * 📚 getter = parece uma propriedade, mas é calculado na hora.
   * Ex: error.friendlyMessage (sem parênteses).
   * 
   * 📚 CORRIGIDO: Usa (this.type || "unknown") para evitar
   * erro caso type seja null/undefined.
   * 
   * @returns {string}
   */
  get friendlyMessage() {
    const typeUpper = (this.type || "UNKNOWN").toUpperCase();
    
    return (
      `Found two different ${typeUpper} identifiers ` +
      `for the same article. Existing: ${this.existingValue}, ` +
      `Incoming (from ${this.source}): ${this.incomingValue}. ` +
      `The existing identifier was kept.`
    );
  }

  /**
   * Verifica se o conflito envolve um tipo específico.
   * 
   * 📚 Útil para tratamento seletivo de erros.
   * Ex: if (error.isType("doi")) { ... }
   * 
   * @param {string} type - Tipo a verificar
   * @returns {boolean}
   */
  isType(type) {
    return this.type === type;
  }

  /**
   * Verifica se o conflito veio de uma fonte específica.
   * 
   * 📚 Útil para saber se o conflito veio de um provider confiável.
   * Ex: if (error.isFromSource("openalex")) { ... }
   * 
   * @param {string} source - Fonte a verificar
   * @returns {boolean}
   */
  isFromSource(source) {
    return this.source === source;
  }

  // ============================================================
  // SERIALIZAÇÃO
  // ============================================================

  /**
   * Converte para objeto plano.
   * 
   * 📚 Útil para logs estruturados e APIs de erro.
   * Ex: JSON.stringify(error.toPlainObject())
   * 
   * @returns {Object}
   */
  toPlainObject() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      existingValue: this.existingValue,
      incomingValue: this.incomingValue,
      source: this.source,
      timestamp: this.timestamp,
    };
  }

  /**
   * Serializa para JSON.
   * 
   * 📚 Assim como no DomainEvent, este método é chamado
   * automaticamente por JSON.stringify().
   * 
   * @returns {Object}
   */
  toJSON() {
    return this.toPlainObject();
  }

  // ============================================================
  // FACTORY METHODS
  // ============================================================

  /**
   * Cria um erro a partir de um conflito de DOI.
   * 
   * 📚 Factory method = atalho para criar erros comuns.
   * Em vez de lembrar todos os campos, use:
   * DuplicateIdentifierError.doi("10.1000/abc", "10.1000/xyz", "crossref")
   * 
   * @param {string} existingValue - DOI existente
   * @param {string} incomingValue - DOI conflitante
   * @param {string} [source] - Fonte do conflito
   * @returns {DuplicateIdentifierError}
   */
  static doi(existingValue, incomingValue, source = "unknown") {
    return new DuplicateIdentifierError({
      type: "doi",
      existingValue,
      incomingValue,
      source,
    });
  }

  /**
   * Cria um erro a partir de um conflito de PMID.
   * 
   * @param {string} existingValue - PMID existente
   * @param {string} incomingValue - PMID conflitante
   * @param {string} [source] - Fonte do conflito
   * @returns {DuplicateIdentifierError}
   */
  static pmid(existingValue, incomingValue, source = "unknown") {
    return new DuplicateIdentifierError({
      type: "pmid",
      existingValue,
      incomingValue,
      source,
    });
  }

  /**
   * Cria um erro a partir de um conflito de OpenAlex ID.
   * 
   * @param {string} existingValue - OpenAlex ID existente
   * @param {string} incomingValue - OpenAlex ID conflitante
   * @param {string} [source] - Fonte do conflito
   * @returns {DuplicateIdentifierError}
   */
  static openalex(existingValue, incomingValue, source = "unknown") {
    return new DuplicateIdentifierError({
      type: "openalex",
      existingValue,
      incomingValue,
      source,
    });
  }
}

export default DuplicateIdentifierError;