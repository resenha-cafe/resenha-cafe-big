/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Application — Execution Context
 * ============================================================
 *
 * 📚 NOTA SOBRE HERANÇA E IMUTABILIDADE:
 * 
 * O Object.freeze() NÃO é chamado no construtor diretamente.
 * Em vez disso, usamos o método _freeze() que é chamado
 * condicionalmente:
 * 
 * - ExecutionContext chama _freeze() no final do construtor
 * - SearchContext (subclasse) NÃO chama _freeze() no super,
 *   permitindo adicionar seus próprios campos, e chama
 *   _freeze() no final do SEU construtor.
 * 
 * Isso garante que ambas as classes fiquem completamente
 * congeladas, mas sem quebrar a herança.
 */

export class ExecutionContext {
  /**
   * @param {Object} options - Opções do contexto
   */
  constructor(options = {}) {
    // ============================================================
    // IDENTIFICAÇÃO
    // ============================================================
    this.requestId = options.requestId || ExecutionContext.#generateId();
    this.userId = options.userId || null;
    this.source = options.source || "api";

    // ============================================================
    // TEMPO
    // ============================================================
    this.startedAt = options.startedAt || Date.now();
    this.timeout = options.timeout ?? 30000;

    // ============================================================
    // AMBIENTE
    // ============================================================
    this.config = Object.freeze({ ...(options.config || {}) });

    // ============================================================
    // SERVIÇOS
    // ============================================================
    this.logger = options.logger !== undefined ? options.logger : console;
    this.metrics = options.metrics !== undefined ? options.metrics : null;

    // ============================================================
    // METADADOS
    // ============================================================
    this.metadata = Object.freeze({ ...(options.metadata || {}) });

    // ============================================================
    // CONGELAMENTO
    // ============================================================
    // 📚 CORRIGIDO: Só congela se for instância DIRETA de ExecutionContext.
    // Subclasses (SearchContext) precisam adicionar seus campos primeiro.
    if (this.constructor === ExecutionContext) {
      this._freeze();
    }
  }

  // ============================================================
  // GETTERS
  // ============================================================

  get elapsed() {
    return Date.now() - this.startedAt;
  }

  get startedAtIso() {
    return new Date(this.startedAt).toISOString();
  }

  get isTimedOut() {
    if (this.timeout <= 0) return false;
    return this.elapsed >= this.timeout;
  }

  get isDevelopment() {
    return this.config.NODE_ENV === "development";
  }

  get isProduction() {
    return this.config.NODE_ENV === "production";
  }

  get isAuthenticated() {
    return !!this.userId;
  }

  // ============================================================
  // MÉTODOS IMUTÁVEIS
  // ============================================================

  /**
   * Cria uma cópia com atualizações.
   * 
   * Usa new this.constructor() para suportar subclasses.
   * 
   * @param {Object} updates - Atualizações
   * @returns {ExecutionContext} Novo contexto
   */
  with(updates = {}) {
    return new this.constructor({
      requestId: updates.requestId ?? this.requestId,
      userId: updates.userId ?? this.userId,
      source: updates.source ?? this.source,
      startedAt: updates.startedAt ?? this.startedAt,
      timeout: updates.timeout ?? this.timeout,
      config: updates.config
        ? { ...this.config, ...updates.config }
        : this.config,
      logger: updates.logger !== undefined ? updates.logger : this.logger,
      metrics: updates.metrics !== undefined ? updates.metrics : this.metrics,
      metadata: updates.metadata
        ? { ...this.metadata, ...updates.metadata }
        : this.metadata,
    });
  }

  withMetadata(key, value) {
    return this.with({ metadata: { [key]: value } });
  }

  withTimeout(ms) {
    return this.with({ timeout: ms });
  }

  // ============================================================
  // LOGGING CONTEXTUAL
  // ============================================================

  log(level, message, data = {}) {
    if (!this.logger) return;

    const method = typeof this.logger[level] === "function"
      ? this.logger[level]
      : typeof this.logger.info === "function"
        ? this.logger.info
        : null;

    if (!method) return;

    const logData = {
      requestId: this.requestId,
      userId: this.userId,
      elapsed: `${this.elapsed}ms`,
      ...data,
    };

    method.call(this.logger, message, logData);
  }

  info(message, data) { this.log("info", message, data); }
  warn(message, data) { this.log("warn", message, data); }
  error(message, data) { this.log("error", message, data); }
  debug(message, data) { this.log("debug", message, data); }

  // ============================================================
  // MÉTRICAS
  // ============================================================

  recordMetric(name, value = 1) {
    if (this.metrics && typeof this.metrics.increment === "function") {
      this.metrics.increment(name, value);
    }
  }

  // ============================================================
  // CONGELAMENTO (PROTEGIDO)
  // ============================================================

  /**
   * Congela a instância.
   * 
   * 📚 Método protegido para uso por subclasses.
   * ExecutionContext chama no final do próprio construtor.
   * SearchContext chama no final do SEU construtor.
   * 
   * @protected
   */
  _freeze() {
    Object.freeze(this);
  }

  // ============================================================
  // SERIALIZAÇÃO
  // ============================================================

  toPlainObject() {
    return {
      requestId: this.requestId,
      userId: this.userId,
      source: this.source,
      startedAt: this.startedAt,
      startedAtIso: this.startedAtIso,
      elapsed: this.elapsed,
      timeout: this.timeout,
      isTimedOut: this.isTimedOut,
      isDevelopment: this.isDevelopment,
      isProduction: this.isProduction,
      isAuthenticated: this.isAuthenticated,
      config: { ...this.config },
      metadata: { ...this.metadata },
    };
  }

  toJSON() {
    return this.toPlainObject();
  }

  // ============================================================
  // FACTORY METHODS
  // ============================================================

  static empty() {
    return new ExecutionContext({ requestId: "empty", source: "test" });
  }

  static fromPlainObject(data = {}) {
    return new ExecutionContext(data);
  }

  // ============================================================
  // MÉTODOS PRIVADOS ESTÁTICOS
  // ============================================================

  static #generateId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}

export default ExecutionContext;