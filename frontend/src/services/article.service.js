/**
 * Serviço de artigo.
 *
 * Responsável por:
 * - receber um DOI
 * - validar o DOI antes da chamada
 * - executar a requisição via ApiClient
 * - mapear a resposta para Article
 *
 * A página do artigo deve conversar apenas com este serviço.
 */

import {
  apiClient,
  FrontendApiError,
} from "./api.client.js";

import { mapArticle } from "./mappers/article.mapper.js";
import { ERROR_MESSAGES } from "../core/constants.js";

/**
 * Serviço responsável por buscar um artigo pelo DOI.
 */
export class ArticleService {
  /**
   * @param {ApiClient} [client]
   */
  constructor(client = apiClient) {
    this.client = client;
  }

  /**
   * Busca um artigo pelo DOI.
   *
   * @param {string} doi
   * @param {AbortSignal} [signal]
   * @returns {Promise<Article>}
   */
  async getByDoi(doi, signal) {
    if (!doi || typeof doi !== "string") {
      throw new FrontendApiError(ERROR_MESSAGES.INVALID_DOI, {
        code: "INVALID_DOI",
        status: 0,
      });
    }

    const sanitizedDoi = doi.trim();

    if (!this.#isValidDoi(sanitizedDoi)) {
      throw new FrontendApiError(ERROR_MESSAGES.INVALID_DOI, {
        code: "INVALID_DOI",
        status: 0,
      });
    }

    const response = await this.client.request("ARTICLE", {
      params: { doi: sanitizedDoi },
      signal,
    });

    /**
     * O endpoint /article pode retornar:
     * {
     *   article: {
     *     article: { ... },
     *     fromCache: false,
     *     duration: 123
     *   }
     * }
     *
     * ou, no formato mais simples:
     * {
     *   article: { ... }
     * }
     *
     * Extraímos apenas o objeto do artigo, sem permitir
     * que o envelope da API vaze para o domínio.
     */
    const rawArticle =
      response?.article?.article ??
      response?.article ??
      null;

    return mapArticle(rawArticle);
  }

  /**
   * Valida o formato básico de DOI.
   *
   * @private
   * @param {string} doi
   * @returns {boolean}
   */
  #isValidDoi(doi) {
    return /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/.test(doi);
  }
}

/**
 * Instância padrão do serviço de artigo.
 */
export const articleService = new ArticleService();

export default ArticleService;