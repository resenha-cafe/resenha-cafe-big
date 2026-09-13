/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Metrics — Collector
 * ============================================================
 *
 * 📚 AULA: O que é o Metrics Collector?
 * 
 * O Metrics Collector é o componente responsável por coletar,
 * armazenar e expor métricas de execução do sistema.
 * 
 * 📚 Tipos de métricas:
 * 
 * - Counter: contagem monótona (requisições, erros)
 * - Gauge: valor atual (uso de memória, cache size)
 * - Histogram: distribuição de valores (latência)
 *   Com interpolação linear para percentis mais precisos
 * 
 * 📚 Política de validação:
 * 
 * - Nomes de métricas: DEVEM ser strings não vazias (lança TypeError)
 * - observe(name, value): IGNORA silenciosamente valores inválidos
 * - gauge(name, value): LANÇA TypeError com mensagem descritiva
 * - increment(name, value): LANÇA TypeError com mensagem descritiva
 * - recordRequest(status): aceita número ou string; inválido → "unknown"
 * - recordRequest(duration): inválido é ignorado (best effort)
 * 
 * feat(metrics): add fully documented validation policies
 */

export class MetricsCollector {
  /** @type {Map<string, number>} */
  #counters;

  /** @type {Map<string, number>} */
  #gauges;

  /** @type {Map<string, Array<number>>} */
  #histograms;

  /** @type {number} */
  #maxHistogramSize;

  /**
   * @param {Object} options - Configuração
   * @param {number} [options.maxHistogramSize=1000] - Limite de valores por histograma
   */
  constructor(options = {}) {
    this.#counters = new Map();
    this.#gauges = new Map();
    this.#histograms = new Map();

    // Validação robusta do tamanho máximo
    const size = Number(options.maxHistogramSize ?? 1000);
    this.#maxHistogramSize = Number.isFinite(size)
      ? Math.max(1, Math.floor(size))
      : 1000;
  }

  // ============================================================
  // COUNTERS (contagem monótona)
  // ============================================================

  /**
   * Incrementa um contador.
   * 
   * @param {string} name - Nome do contador
   * @param {number} [value=1] - Valor a incrementar
   * @returns {number} Valor atual do contador
   * @throws {TypeError} Se name não for string não vazia
   * @throws {TypeError} Se value não for número finito
   */
  increment(name, value = 1) {
    this.#assertMetricName(name);
    this.#assertFiniteNumber("increment", name, value);

    const current = this.#counters.get(name) || 0;
    const updated = current + value;
    this.#counters.set(name, updated);
    return updated;
  }

  /**
   * Obtém o valor de um contador.
   * 
   * @param {string} name - Nome do contador
   * @returns {number} Valor atual ou 0
   * @throws {TypeError} Se name não for string não vazia
   */
  getCounter(name) {
    this.#assertMetricName(name);
    return this.#counters.get(name) || 0;
  }

  // ============================================================
  // GAUGES (valor atual)
  // ============================================================

  /**
   * Define um gauge.
   * 
   * @param {string} name - Nome do gauge
   * @param {number} value - Valor atual
   * @returns {number} Valor definido
   * @throws {TypeError} Se name não for string não vazia
   * @throws {TypeError} Se value não for número finito
   */
  gauge(name, value) {
    this.#assertMetricName(name);
    this.#assertFiniteNumber("gauge", name, value);

    this.#gauges.set(name, value);
    return value;
  }

  /**
   * Obtém o valor de um gauge.
   * 
   * @param {string} name - Nome do gauge
   * @returns {number|null} Valor atual ou null
   * @throws {TypeError} Se name não for string não vazia
   */
  getGauge(name) {
    this.#assertMetricName(name);
    return this.#gauges.get(name) ?? null;
  }

  // ============================================================
  // HISTOGRAMS (distribuição de valores)
  // ============================================================

  /**
   * Registra uma observação em um histograma.
   * 
   * 📚 Política:
   * - name: VALIDADO — lança TypeError se não for string não vazia
   * - value: IGNORADO silenciosamente se não for número finito
   *   (histograma é métrica "best effort")
   * 
   * 📚 Se o histograma atingir maxHistogramSize, os valores
   * mais antigos são removidos (janela deslizante simples).
   * 
   * @param {string} name - Nome do histograma (não vazio)
   * @param {number} value - Valor observado (ex: latência)
   * @throws {TypeError} Se name não for string não vazia
   */
  observe(name, value) {
    this.#assertMetricName(name);

    // Validação "best effort": ignora valores inválidos
    if (!this.#isFiniteNumber(value)) return;

    if (!this.#histograms.has(name)) {
      this.#histograms.set(name, []);
    }

    const values = this.#histograms.get(name);
    values.push(value);

    // Limite de tamanho: remove os mais antigos
    if (values.length > this.#maxHistogramSize) {
      values.splice(0, values.length - this.#maxHistogramSize);
    }
  }

  /**
   * Calcula estatísticas de um histograma.
   * 
   * @param {string} name - Nome do histograma
   * @returns {Object|null} { count, avg, min, max, p50, p95, p99 }
   * @throws {TypeError} Se name não for string não vazia
   */
  getHistogramStats(name) {
    this.#assertMetricName(name);

    const values = this.#histograms.get(name);
    if (!values || values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((acc, v) => acc + v, 0);

    return {
      count,
      avg: Math.round((sum / count) * 100) / 100,
      min: sorted[0],
      max: sorted[count - 1],
      p50: this.#percentile(sorted, 50),
      p95: this.#percentile(sorted, 95),
      p99: this.#percentile(sorted, 99),
    };
  }

  // ============================================================
  // MÉTRICAS DE REQUEST
  // ============================================================

  /**
   * Registra uma requisição HTTP.
   * 
   * 📚 Política:
   * - status: ACEITA número (200) ou string ("200")
   * - status inválido: vira "unknown" nas métricas
   * - duration: IGNORADO silenciosamente se não for número finito
   *   (comportamento "best effort" do observe)
   * 
   * @param {string} method - Método HTTP
   * @param {number|string} status - Status HTTP (0 = erro de rede)
   * @param {number} duration - Duração em ms (inválido é ignorado)
   */
  recordRequest(method, status, duration = 0) {
    const methodLower = method?.toLowerCase() || "unknown";

    // Converte status para número e valida
    const statusCode = Number(status);
    const isValidStatus = Number.isFinite(statusCode) && statusCode > 0;

    const statusGroup = isValidStatus
      ? `${Math.floor(statusCode / 100)}xx`
      : "network";

    this.increment("requests.total");
    this.increment(`requests.${methodLower}`);
    this.increment(`responses.${isValidStatus ? statusCode : "unknown"}`);
    this.increment(`responses.${statusGroup}`);

    this.observe("latency", duration);
    this.observe(`latency.${methodLower}`, duration);
  }

  /**
   * Registra um erro.
   * 
   * @param {Error} error - Erro ocorrido
   */
  recordError(error) {
    this.increment("errors.total");
    this.increment(`errors.${error?.name || "unknown"}`);
  }

  /**
   * Registra uma busca de artigos.
   * 
   * @param {string} query - Query de busca
   * @param {number} resultCount - Número de resultados
   * @param {number} duration - Duração em ms
   */
  recordSearch(query, resultCount = 0, duration = 0) {
    this.increment("searches.total");
    this.increment("searches.results", resultCount);
    this.observe("searches.duration", duration);

    if (resultCount === 0) {
      this.increment("searches.empty");
    }
  }

  // ============================================================
  // EXPORTAÇÃO
  // ============================================================

  /**
   * Retorna todas as métricas coletadas.
   * 
   * @returns {Object} Métricas formatadas
   */
  getMetrics() {
    const counters = {};
    for (const [name, value] of this.#counters) {
      counters[name] = value;
    }

    const gauges = {};
    for (const [name, value] of this.#gauges) {
      gauges[name] = value;
    }

    const histograms = {};
    for (const [name] of this.#histograms) {
      histograms[name] = this.getHistogramStats(name);
    }

    return {
      counters,
      gauges,
      histograms,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reseta todas as métricas.
   */
  reset() {
    this.#counters.clear();
    this.#gauges.clear();
    this.#histograms.clear();
  }

  // ============================================================
  // VALIDAÇÃO (DRY)
  // ============================================================

  /**
   * Valida que o nome da métrica é uma string não vazia.
   * 
   * 📚 Se name for string com espaços ("   "), a mensagem
   * mostra o valor com trim para evitar nomes aparentemente vazios.
   * 
   * @param {string} name - Nome da métrica
   * @throws {TypeError} Se name não for string não vazia
   * @private
   */
  #assertMetricName(name) {
    if (typeof name !== "string" || name.trim() === "") {
      const display = typeof name === "string" ? `"${name.trim()}"` : String(name);
      throw new TypeError(
        `Metric name must be a non-empty string, received: ${display}`
      );
    }
  }

  /**
   * Retorna true apenas para números finitos.
   * 
   * @param {*} value - Valor a verificar
   * @returns {boolean} True se for número finito
   * @private
   */
  #isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  /**
   * Valida que um valor é um número finito e lança TypeError.
   * 
   * @param {string} method - Nome do método chamador
   * @param {string} name - Nome da métrica
   * @param {*} value - Valor a validar
   * @throws {TypeError} Se value não for número finito
   * @private
   */
  #assertFiniteNumber(method, name, value) {
    if (!this.#isFiniteNumber(value)) {
      throw new TypeError(
        `MetricsCollector.${method}: value for "${name}" must be a finite number, received: ${String(value)}`
      );
    }
  }

  // ============================================================
  // PRIVADO
  // ============================================================

  /**
   * Calcula o percentil com interpolação linear.
   * 
   * 📚 Diferente de Math.ceil (seleção de elemento), a
   * interpolação linear produz valores mais estáveis para
   * distribuições pequenas — especialmente p95 e p99.
   * 
   * @param {Array<number>} sorted - Array ordenado
   * @param {number} p - Percentil (0-100)
   * @returns {number} Valor do percentil
   * @private
   */
  #percentile(sorted, p) {
    if (sorted.length === 0) return 0;

    const pos = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(pos);
    const upper = Math.ceil(pos);

    if (lower === upper) return sorted[lower];

    const weight = pos - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }
}

export default MetricsCollector;