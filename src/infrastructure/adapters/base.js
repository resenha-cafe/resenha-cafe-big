/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Infrastructure — Base Adapter
 * ============================================================
 *
 * 📚 CONVENÇÕES:
 * - timeout: ?? para preservar 0 = "sem timeout"
 * - requests: contabiliza tentativas que chegaram ao fetch
 * - lastError: limpo após sucesso
 * - isHealthy: adapter sem histórico é considerado saudável (otimista)
 * - Logger: null explícito desabilita logging
 * - Parser: erro de parsing recebe status 422 (contabilizado como falha)
 * - _post: Content-Type pode ser sobrescrito
 */

export class BaseAdapter {
  /**
   * @param {Object} options - Configuração do adapter
   * @param {string} options.name - Nome do provider
   * @param {string} options.baseUrl - URL base da API
   * @param {number} [options.timeout=15000] - Timeout em ms (0 = sem timeout)
   * @param {Object} [options.headers] - Headers padrão
   * @param {Object|null} [options.logger] - Logger (null = sem logging)
   * @param {Object} [options.rateLimiter] - Rate limiter
   * @param {number} [options.healthThreshold=0.5] - Limiar de saúde (0-1)
   */
  constructor(options = {}) {
    if (!options.name) {
      throw new Error("BaseAdapter: name is required");
    }
    if (!options.baseUrl) {
      throw new Error("BaseAdapter: baseUrl is required");
    }

    this.name = options.name;
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.timeout = options.timeout ?? 15000;

    this.headers = {
      "Accept": "application/json",
      "User-Agent": `ResenhaCafe-Worker/4.0 (${options.name})`,
      ...(options.headers || {}),
    };

    this.logger = options.logger !== undefined ? options.logger : console;
    this.rateLimiter = options.rateLimiter || null;
    this.healthThreshold = options.healthThreshold ?? 0.5;

    this._stats = {
      requests: 0,
      successes: 0,
      failures: 0,
      totalSuccessLatency: 0,
      totalFailureLatency: 0,
      lastRequest: null,
      lastError: null,
    };
  }

  // ============================================================
  // GETTERS
  // ============================================================

  get avgSuccessLatency() {
    if (this._stats.successes === 0) return 0;
    return Math.round(this._stats.totalSuccessLatency / this._stats.successes);
  }

  get avgRequestLatency() {
    if (this._stats.requests === 0) return 0;
    const totalLatency = this._stats.totalSuccessLatency + this._stats.totalFailureLatency;
    return Math.round(totalLatency / this._stats.requests);
  }

  get successRate() {
    if (this._stats.requests === 0) return 1;
    return this._stats.successes / this._stats.requests;
  }

  get stats() {
    return {
      ...this._stats,
      avgSuccessLatency: this.avgSuccessLatency,
      avgRequestLatency: this.avgRequestLatency,
      successRate: this.successRate,
    };
  }

  // ============================================================
  // MÉTODOS ABSTRATOS
  // ============================================================

  async search(query, params = {}) {
    throw new Error(
      `search() not implemented for adapter "${this.name}". ` +
      `Override this method in your adapter class.`
    );
  }

  async getByDOI(doi) {
    throw new Error(
      `getByDOI() not implemented for adapter "${this.name}". ` +
      `Override this method in your adapter class.`
    );
  }

  // ============================================================
  // MÉTODOS PROTEGIDOS
  // ============================================================

  async _get(path, params = {}, options = {}) {
    const url = this._buildUrl(path, params);
    return this._fetch(url, { method: "GET", ...options });
  }

  /**
   * Faz uma requisição POST.
   * Content-Type padrão é JSON, mas pode ser sobrescrito via options.headers.
   */
  async _post(path, body = {}, options = {}) {
    const url = this._buildUrl(path);
    return this._fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      body: JSON.stringify(body),
      ...options,
    });
  }

  _buildUrl(path, params = {}) {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    let url = `${this.baseUrl}${cleanPath}`;

    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    }

    const queryString = queryParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    return url;
  }

  /**
   * Executa a requisição fetch.
   * 
   * 📚 Códigos de status:
   * - response.status (4xx/5xx): HTTP status real do servidor
   * - 422 (interno): parsing inválido — servidor respondeu, mas conteúdo não interpretável
   * - 408 (interno): timeout interno do adapter
   * - 499 (interno): cancelamento externo (usuário, sistema)
   * - 0 (interno): erro de rede — fetch não conseguiu conectar
   * 
   * 📚 requests contabiliza tentativas que chegaram ao fetch.
   * Rate limiting ocorre antes — se bloqueado, não conta como request.
   */
  async _fetch(url, options = {}) {
    const startedAt = Date.now();

    // Rate limiting (antes do fetch — não conta como request)
    if (this.rateLimiter) {
      await this.rateLimiter.waitIfNeeded();
    }

    // Headers
    const requestHeaders = {
      ...this.headers,
      ...(options.headers || {}),
    };

    // Parser (default: JSON)
    const parser = options.parser || (r => r.json());

    // Timeout (0 = sem timeout)
    const controller = new AbortController();
    let timeoutId = null;
    // 📚 Flag que indica se o aborto foi disparado pelo timeout interno.
    // Resolve o problema de detectar a causa do AbortError sem depender
    // de heurísticas como controller.signal.aborted (que é true em ambos os casos).
    let timeoutTriggered = false;

    if (this.timeout > 0) {
      timeoutId = setTimeout(() => {
        timeoutTriggered = true;
        controller.abort();
      }, this.timeout);
    }

    const fetchOptions = {
      method: options.method || "GET",
      headers: requestHeaders,
      signal: controller.signal,
    };

    if (options.body) {
      fetchOptions.body = options.body;
    }

    // requests = tentativas que chegaram ao fetch
    this._stats.requests++;
    this._stats.lastRequest = new Date().toISOString();

    try {
      this.#log("debug", `[${this.name}] ${fetchOptions.method} ${url}`);

      const response = await fetch(url, fetchOptions);
      if (timeoutId) clearTimeout(timeoutId);

      const latency = Date.now() - startedAt;

      // ============================================================
      // ERRO HTTP (response.ok === false)
      // ============================================================
      if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        const error = new Error(
          `[${this.name}] HTTP ${response.status}: ${response.statusText}. ` +
          `URL: ${url}. Body: ${errorBody.substring(0, 200)}`
        );
        error.status = response.status;
        error.url = url;

        this._stats.failures++;
        this._stats.totalFailureLatency += latency;
        this._stats.lastError = error.message;

        this.#log("error", `[${this.name}] Request failed`, {
  status: response.status,
  statusText: response.statusText,
  url,
  latency: `${latency}ms`,
  body: errorBody.substring(0, 500),
  contentType: response.headers?.get?.("content-type") || "unknown",
  server: response.headers?.get?.("server") || "unknown",
});

        throw error;
      }

      // ============================================================
      // PARSING (HTTP 2xx, mas conteúdo inválido)
      // ============================================================
      let data;
      try {
        data = await parser(response);
      } catch (parseError) {
        const error = new Error(
          `[${this.name}] Response parsing failed for ${url}: ${parseError.message}`,
          { cause: parseError }
        );
        error.url = url;
        error.status = 422;

        this._stats.failures++;
        this._stats.totalFailureLatency += latency;
        this._stats.lastError = error.message;

        this.#log("error", `[${this.name}] Response parsing failed`, {
          status: response.status,
          url,
          latency: `${latency}ms`,
          error: parseError.message,
          contentType: response.headers?.get?.("content-type") || "unknown",
        });

        throw error;
      }

      // ============================================================
      // SUCESSO
      // ============================================================
      this._stats.successes++;
      this._stats.totalSuccessLatency += latency;
      this._stats.lastError = null;

      this.#log("debug", `[${this.name}] Request succeeded`, {
        status: response.status,
        url,
        latency: `${latency}ms`,
      });

      return data;
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);

      const latency = Date.now() - startedAt;

      // 📚 Erros já tratados (HTTP e parsing) são apenas relançados.
      // Timeouts e erros de rede são classificados neste bloco.
      if ("status" in error) throw error;

      // ============================================================
      // ABORTO (timeout interno ou cancelamento externo)
      // ============================================================
      if (error.name === "AbortError") {
        // 📚 Usamos a flag timeoutTriggered para diferenciar a causa.
        // - true: o setTimeout interno chamou controller.abort() → 408
        // - false: o aborto veio de fora (usuário, sistema) → 499
        const isInternalTimeout = timeoutTriggered;
        const status = isInternalTimeout ? 408 : 499;
        const reason = isInternalTimeout
          ? `timeout after ${this.timeout}ms`
          : "cancelled externally";

        const abortError = new Error(
          `[${this.name}] Request aborted (${reason}) after ${latency}ms: ${url}`
        );
        abortError.status = status;
        abortError.url = url;

        this._stats.failures++;
        this._stats.totalFailureLatency += latency;
        this._stats.lastError = abortError.message;

        throw abortError;
      }

      // ============================================================
      // ERRO DE REDE
      // ============================================================
      // 📚 Detectado por TypeError, sem depender da mensagem.
      // A mensagem varia entre runtimes (Node, Workers, Deno, navegadores).
      // Usar apenas error.name === "TypeError" garante portabilidade.
      if (error.name === "TypeError") {
        const networkError = new Error(
          `[${this.name}] Network error: ${error.message}`,
          { cause: error }
        );
        networkError.status = 0;
        networkError.url = url;

        this._stats.failures++;
        this._stats.totalFailureLatency += latency;
        this._stats.lastError = networkError.message;

        throw networkError;
      }

      // ============================================================
      // ERRO DESCONHECIDO
      // ============================================================
      this._stats.failures++;
      this._stats.totalFailureLatency += latency;
      this._stats.lastError = error.message;
      throw error;
    }
  }

  // ============================================================
  // LOGGING SEGURO
  // ============================================================

  /**
   * Loga com segurança, mesmo se o logger não tiver o método.
   * Fallback: level → info → null (não loga).
   */
  #log(level, message, data) {
    if (!this.logger) return;

    const method = typeof this.logger[level] === "function"
      ? this.logger[level]
      : typeof this.logger.info === "function"
        ? this.logger.info
        : null;

    if (!method) return;

    if (data) {
      method.call(this.logger, message, data);
    } else {
      method.call(this.logger, message);
    }
  }

  // ============================================================
  // UTILITÁRIOS
  // ============================================================

  /**
   * Verifica se o adapter está saudável.
   * Um adapter sem histórico de requisições é considerado saudável (otimista).
   */
  isHealthy() {
    return this.successRate >= this.healthThreshold;
  }

  resetStats() {
    this._stats = {
      requests: 0,
      successes: 0,
      failures: 0,
      totalSuccessLatency: 0,
      totalFailureLatency: 0,
      lastRequest: null,
      lastError: null,
    };
  }

  toString() {
    return `[Adapter: ${this.name}]`;
  }
}

export default BaseAdapter;