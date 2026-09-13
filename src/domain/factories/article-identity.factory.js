/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Domain — Article Identity Factory
 * ============================================================
 */

import { Identity } from "../value-objects/identity.js";
import {
  generateIdentityKey,
  DEFAULT_MAX_AUTHORS,
} from "../utils/identity-normalizer.js";

/**
 * Fábrica para criação de identidades de artigos.
 * 
 * Responsabilidades:
 * - Converter dados brutos ou entidades Article em Identity
 * - Delegar a geração da chave para o identity-normalizer
 * - Ser imutável e stateless
 * 
 * @class ArticleIdentityFactory
 */
export class ArticleIdentityFactory {
  /**
   * Cria uma Identity a partir de dados brutos
   * 
   * @param {Object} data - Dados do artigo
   * @param {Array|IdentifierCollection} data.identifiers - Identificadores do artigo
   * @param {string} data.title - Título do artigo
   * @param {Array} data.authors - Autores do artigo
   * @param {number} data.year - Ano de publicação
   * @param {string} data.type - Tipo do artigo
   * @param {string|Object} data.journal - Periódico
   * @param {number} [data.maxAuthors] - Número máximo de autores para identidade
   * @param {number} [maxAuthors] - Número máximo de autores (fallback)
   * @returns {Identity} Identity criada
   * 
   * @example
   * const identity = ArticleIdentityFactory.create({
   *   doi: "10.1000/xyz123",
   *   title: "Machine Learning in Healthcare"
   * });
   * // => Identity { key: "doi:10.1000/xyz123" }
   */
  static create(data = {}, maxAuthors = DEFAULT_MAX_AUTHORS) {
    const key = generateIdentityKey({ ...data, maxAuthors });
    return key ? Identity.fromKey(key) : Identity.empty();
  }

  /**
   * Cria uma Identity a partir de um artigo existente
   * 
   * @param {Article} article - Artigo
   * @param {number} [maxAuthors] - Número máximo de autores para identidade
   * @returns {Identity} Identity criada
   * 
   * @example
   * const identity = ArticleIdentityFactory.fromArticle(article);
   * // => Identity { key: "article:83ab09f1" }
   */
  static fromArticle(article, maxAuthors = DEFAULT_MAX_AUTHORS) {
    if (!article) {
      return Identity.empty();
    }

    return ArticleIdentityFactory.create(
      {
        title: article.title,
        authors: article.authors,
        year: article.year,
        type: article.type,
        journal: article.journal,
        identifiers: article.identifiers,
      },
      maxAuthors
    );
  }

  /**
   * Gera a chave de identidade como string
   * 
   * @param {Object} data - Dados do artigo
   * @param {number} [maxAuthors] - Número máximo de autores para identidade
   * @returns {string|null} Chave de identidade ou null
   * 
   * @example
   * const key = ArticleIdentityFactory.generateKey({
   *   title: "Machine Learning in Healthcare",
   *   authors: [{ name: "Silva, J." }],
   *   year: 2024
   * });
   * // => 'article:83ab09f1'
   */
  static generateKey(data = {}, maxAuthors = DEFAULT_MAX_AUTHORS) {
    return generateIdentityKey({ ...data, maxAuthors });
  }

  /**
   * Verifica se um objeto tem identidade
   * 
   * @param {Object} data - Dados do artigo
   * @param {number} [maxAuthors] - Número máximo de autores para identidade
   * @returns {boolean} True se tiver identidade
   */
  static hasIdentity(data = {}, maxAuthors = DEFAULT_MAX_AUTHORS) {
    return generateIdentityKey({ ...data, maxAuthors }) !== null;
  }
}

export default ArticleIdentityFactory;