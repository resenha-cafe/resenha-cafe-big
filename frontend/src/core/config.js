/**
 * Configurações centrais do frontend.
 *
 * Mantém constantes de acesso à API e valores padrão.
 * Nenhum componente deve chamar a URL diretamente.
 */

export const CONFIG = Object.freeze({
  /**
   * URL base do Search Worker.
   * @type {string}
   */
  API_BASE_URL: "https://resenha-cafe-search.wy30032000.workers.dev",

  /**
   * Timeout padrão para requisições HTTP (ms).
   * @type {number}
   */
  REQUEST_TIMEOUT_MS: 20000,

  /**
   * Limite padrão de resultados por busca.
   * @type {number}
   */
  DEFAULT_SEARCH_LIMIT: 20,

  /**
   * Limite máximo permitido pela interface.
   * @type {number}
   */
  MAX_SEARCH_LIMIT: 100,

  /**
   * Ano mínimo aceito nos filtros.
   * Decisão editorial do Resenha & Café.
   * @type {number}
   */
  MIN_YEAR: 1600,
});

/**
 * Endpoints do Worker que o frontend público consome.
 *
 * Saúde, métricas e cache são endpoints operacionais
 * e não fazem parte do contrato público da interface.
 */
export const API_ENDPOINTS = Object.freeze({
  SEARCH: "/search",
  ARTICLE: "/article",
});