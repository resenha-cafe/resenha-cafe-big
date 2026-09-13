/**
 * Cliente HTTP do frontend.
 *
 * Centraliza todas as chamadas ao Worker, tratando:
 * - timeout com AbortController
 * - cancelamento externo
 * - limpeza de listener ao final da requisição
 * - headers JSON
 * - suporte a body para POST/PUT
 * - montagem de URL com URLSearchParams
 * - erros HTTP, rede e timeout de forma padronizada
 *
 * Nenhum componente deve usar fetch diretamente.
 *
 * Este cliente é genérico. Métodos como search(), getArticle(),
 * getHealth() pertencem aos services, não aqui.
 */

import { CONFIG, API_ENDPOINTS } from "../core/config.js";
import { ERROR_MESSAGES } from "../core/constants.js";

export class FrontendApiError extends Error {
  /**
   * @param {string} message
   * @param {Object} [options]
   * @param {string} [options.code]
   * @param {number} [options.status]
   * @param {unknown} [options.details]
   */
  constructor(message, { code = "UNKNOWN", status = 0, details = null } = {}) {
    super(message);

    this.name = "FrontendApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class ApiClient {
  /**
   * @param {Object} [options]
   * @param {string} [options.baseUrl]
   * @param {number} [options.timeoutMs]
   * @param {Object} [options.endpoints]
   */
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || CONFIG.API_BASE_URL;
    this.timeoutMs = options.timeoutMs ?? CONFIG.REQUEST_TIMEOUT_MS;
    this.endpoints = options.endpoints || API_ENDPOINTS;
  }

  /**
   * Faz uma requisição HTTP.
   *
   * @param {string} endpoint - Nome do endpoint ou caminho.
   * @param {Object} [options]
   * @param {Object} [options.params]
   * @param {string} [options.method]
   * @param {Object} [options.headers]
   * @param {unknown} [options.body]
   * @param {AbortSignal} [options.signal]
   * @returns {Promise<unknown>}
   */
  async request(
    endpoint,
    { params, method = "GET", headers = {}, body, signal } = {}
  ) {
    const url = this.#buildUrl(endpoint, params);

    const controller = new AbortController();
    let timeoutId = null;

    let timeoutTriggered = false;
    let externalAbortTriggered = false;
    let externalAbortHandler = null;

    if (this.timeoutMs > 0) {
      timeoutId = setTimeout(() => {
        timeoutTriggered = true;
        controller.abort();
      }, this.timeoutMs);
    }

    if (signal) {
      if (signal.aborted) {
        externalAbortTriggered = true;
        controller.abort();
      } else {
        externalAbortHandler = () => {
          externalAbortTriggered = true;
          controller.abort();
        };

        signal.addEventListener("abort", externalAbortHandler, {
          once: true,
        });
      }
    }

    try {
      const response = await fetch(url, {
        method,
        headers: {
          Accept: "application/json",
          ...(body !== undefined
            ? { "Content-Type": "application/json" }
            : {}),
          ...headers,
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        signal: controller.signal,
      });

      if (timeoutId) clearTimeout(timeoutId);

      if (!response.ok) {
        let detail = null;

        try {
          detail = await response.json();
        } catch {
          detail = await response.text();
        }

        const message = this.#getErrorMessage(response.status, detail);

        throw new FrontendApiError(message, {
          code: this.#getErrorCode(response.status),
          status: response.status,
          details: detail,
        });
      }

      return await response.json();
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        if (externalAbortTriggered) {
          throw new FrontendApiError(ERROR_MESSAGES.REQUEST_ABORTED, {
            code: "ABORTED",
            status: 0,
          });
        }

        if (timeoutTriggered) {
          throw new FrontendApiError(ERROR_MESSAGES.TIMEOUT_ERROR, {
            code: "TIMEOUT",
            status: 0,
          });
        }

        throw new FrontendApiError(ERROR_MESSAGES.NETWORK_ERROR, {
          code: "NETWORK_ERROR",
          status: 0,
        });
      }

      if (error instanceof FrontendApiError) {
        throw error;
      }

      throw new FrontendApiError(ERROR_MESSAGES.NETWORK_ERROR, {
        code: "NETWORK_ERROR",
        status: 0,
        details: error,
      });
    } finally {
      if (timeoutId) clearTimeout(timeoutId);

      if (signal && externalAbortHandler) {
        signal.removeEventListener("abort", externalAbortHandler);
      }
    }
  }

  /**
   * Constrói a URL completa com query params.
   *
   * @private
   * @param {string} endpoint
   * @param {Object} [params]
   * @returns {string}
   */
  #buildUrl(endpoint, params = {}) {
    const path = this.endpoints[endpoint] || endpoint;
    const url = new URL(this.baseUrl);

    url.pathname = path.startsWith("/") ? path : `/${path}`;

    if (params && Object.keys(params).length > 0) {
      const entries = Object.entries(params).filter(
        ([, value]) => value !== undefined && value !== null
      );

      if (entries.length > 0) {
        url.search = new URLSearchParams(entries).toString();
      }
    }

    return url.toString();
  }

  /**
   * Retorna mensagem de erro adequada ao status HTTP.
   *
   * @private
   * @param {number} status
   * @param {unknown} detail
   * @returns {string}
   */
  #getErrorMessage(status, detail) {
    if (status === 404) {
      return ERROR_MESSAGES.RESOURCE_NOT_FOUND;
    }

    if (status >= 400 && status < 500) {
      if (detail && typeof detail === "object") {
        if ("message" in detail && detail.message) {
          return detail.message;
        }

        if ("error" in detail && detail.error) {
          return detail.error;
        }
      }

      return ERROR_MESSAGES.BAD_REQUEST;
    }

    if (status >= 500) {
      return ERROR_MESSAGES.UNEXPECTED_ERROR;
    }

    return ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  /**
   * Mapeia status HTTP para código interno de erro.
   *
   * @private
   * @param {number} status
   * @returns {string}
   */
  #getErrorCode(status) {
    if (status === 404) return "NOT_FOUND";
    if (status >= 400 && status < 500) return "BAD_REQUEST";
    if (status >= 500) return "SERVER_ERROR";
    return "UNKNOWN";
  }
}

export const apiClient = new ApiClient();

export default apiClient;