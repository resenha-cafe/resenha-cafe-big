/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Application — Execution Context
 * ============================================================
 *
 * 📚 ExecutionContext carrega requestId, userId, timestamps,
 * timeout, logger e métricas — tudo que um use case precisa
 * para executar com rastreabilidade.
 * 
 * Imutável após criado. Use with() para criar variações.
 */

export class ExecutionContext {
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

    Object.freeze(this);
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

  /**
   * Loga uma mensagem com o contexto da requisição.
   * 
   * 📚 REFINADO: Verifica se o método de log existe antes de chamar.
   * 
   * Edge cases cobertos:
   * - logger é null → não faz nada
   * - logger não tem o método (ex: logger.warn não existe) → fallback para .info
   * - logger.info também não existe → não faz nada
   * 
   * @param {string} level - Nível (info, warn, error, debug)
   * @param {string} message - Mensagem
   * @param {Object} [data] - Dados adicionais
   */
  log(level, message, data = {}) {
    if (!this.logger) return;

    // 📚 Tenta o método específico (ex: this.logger.warn)
    // Se não existir, fallback para this.logger.info
    // Se info também não existir, method será undefined
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

    // 📚 .call() garante que o this dentro do método seja o logger.
    // Se o logger for um objeto com métodos que dependem de this,
    // method() direto perderia o contexto.
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