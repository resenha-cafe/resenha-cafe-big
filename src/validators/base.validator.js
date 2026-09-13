/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Validators — Base Validator
 * ============================================================
 *
 * 📚 AULA: O que é um Validator?
 * 
 * Um Validator (Validador) é um componente que verifica se
 * os dados atendem a regras específicas antes de serem
 * usados pelo sistema.
 * 
 * 📚 Analogia:
 * É como o segurança na porta de uma festa. Ele verifica:
 * - O convite é válido? (formato)
 * - O nome está na lista? (regras de negócio)
 * - Não está vestido inadequadamente? (restrições)
 * 
 * Se passar, entra. Se não, é barrado com uma explicação.
 * 
 * 📚 Por que validators separados?
 * 
 * 1. Reutilização: mesma validação em vários lugares
 * 2. Testabilidade: validators são funções puras
 * 3. Clareza: regras de validação documentadas
 * 4. Composição: múltiplos validators podem ser combinados
 * 
 * 📚 Padrão de retorno:
 * 
 * Todo validator retorna { valid: boolean, errors: string[] }.
 * Isso permite composição: juntar erros de vários validators.
 * 
 * 📚 Validator vs Normalizer:
 * 
 * - Validator: "Isto é válido?" → retorna null (sim) ou string (erro)
 * - Normalizer: "Qual é a forma canônica?" → retorna string ou null
 * - Validators podem USAR normalizers internamente, mas não EXPÕEM
 *   o valor normalizado. A normalização fica nos mappers/services.
 */

import { normalizeDOI } from "../utils/normalize-identifier.js";

export class BaseValidator {
  /**
   * Cria um resultado de validação bem-sucedido.
   * 
   * @param {Object} [data] - Dados validados e sanitizados
   * @returns {Object} { valid: true, errors: [], ...data }
   */
  static success(data = {}) {
    return { valid: true, errors: [], ...data };
  }

  /**
   * Cria um resultado de validação com falha.
   * 
   * @param {string|Array<string>} errors - Mensagens de erro
   * @returns {Object} { valid: false, errors: [...] }
   */
  static failure(errors = []) {
    const errorList = Array.isArray(errors) ? errors : [errors];
    return { valid: false, errors: errorList };
  }

  /**
   * Combina múltiplos resultados de validação.
   * 
   * Útil quando você executa vários validators em sequência.
   * O resultado final é válido apenas se TODOS forem válidos.
   * 
   * @param {Array<Object>} results - Resultados de validação
   * @returns {Object} Resultado combinado
   * 
   * @example
   * const results = [
   *   validateTitle(article),
   *   validateDoi(article),
   *   validateAuthors(article),
   * ];
   * const combined = BaseValidator.combine(results);
   * // combined.valid === true só se todos forem válidos
   */
  static combine(results = []) {
    const errors = [];

    for (const result of results) {
      if (!result.valid) {
        errors.push(...result.errors);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // ============================================================
  // UTILITÁRIOS DE VALIDAÇÃO
  // ============================================================

  /**
   * Valida que um valor é uma string não vazia.
   * 
   * @param {*} value - Valor a validar
   * @param {string} fieldName - Nome do campo (para mensagem de erro)
   * @returns {string|null} Erro ou null se válido
   */
  static validateRequiredString(value, fieldName) {
    if (value === null || value === undefined) {
      return `${fieldName} is required`;
    }
    if (typeof value !== "string") {
      return `${fieldName} must be a string`;
    }
    if (value.trim().length === 0) {
      return `${fieldName} cannot be empty`;
    }
    return null;
  }

  /**
   * Valida que uma string tem comprimento mínimo.
   * 
   * 📚 Verifica primeiro se é string (consistente com validateRequiredString).
   * 
   * @param {string} value - String a validar
   * @param {number} minLength - Comprimento mínimo
   * @param {string} fieldName - Nome do campo
   * @returns {string|null} Erro ou null se válido
   */
  static validateMinLength(value, minLength, fieldName) {
    if (typeof value !== "string") {
      return `${fieldName} must be a string`;
    }
    if (value.trim().length < minLength) {
      return `${fieldName} must be at least ${minLength} characters`;
    }
    return null;
  }

  /**
   * Valida que um número está em um intervalo.
   * 
   * @param {number} value - Número a validar
   * @param {number} min - Valor mínimo
   * @param {number} max - Valor máximo
   * @param {string} fieldName - Nome do campo
   * @returns {string|null} Erro ou null se válido
   */
  static validateRange(value, min, max, fieldName) {
    if (typeof value !== "number" || isNaN(value)) {
      return `${fieldName} must be a number`;
    }
    if (value < min || value > max) {
      return `${fieldName} must be between ${min} and ${max}`;
    }
    return null;
  }

  /**
   * Valida que um array não está vazio.
   * 
   * @param {Array} value - Array a validar
   * @param {string} fieldName - Nome do campo
   * @returns {string|null} Erro ou null se válido
   */
  static validateNotEmpty(value, fieldName) {
    if (!Array.isArray(value)) {
      return `${fieldName} must be an array`;
    }
    if (value.length === 0) {
      return `${fieldName} cannot be empty`;
    }
    return null;
  }

  /**
   * Valida um DOI.
   * 
   * 📚 Reutiliza normalizeDOI do módulo de normalização apenas para
   * verificar se o formato pode ser convertido para a forma canônica.
   * O validator continua retornando apenas erro/null; a normalização
   * efetiva fica na camada de mappers ou services.
   * 
   * @param {string} doi - DOI a validar
   * @returns {string|null} Erro ou null se válido
   */
  static validateDOI(doi) {
    if (!doi) return null; // DOI é opcional em muitos contextos

    if (typeof doi !== "string") {
      return "DOI must be a string";
    }

    // Reutiliza normalizeDOI apenas para verificação de formato.
    // O valor normalizado NÃO é retornado — o validator apenas
    // responde "válido" ou "inválido".
    return normalizeDOI(doi) ? null : `Invalid DOI format: "${doi}"`;
  }

  /**
   * Valida um endereço de email.
   * 
   * 📚 Verifica primeiro se é string antes de aplicar regex.
   * 
   * @param {string} email - Email a validar
   * @returns {string|null} Erro ou null se válido
   */
  static validateEmail(email) {
    if (!email) return null; // Email é opcional

    if (typeof email !== "string") {
      return "Email must be a string";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return `Invalid email format: "${email}"`;
    }

    return null;
  }

  /**
   * Valida uma URL.
   * 
   * 📚 Verifica primeiro se é string antes de tentar parse.
   * 
   * @param {string} url - URL a validar
   * @returns {string|null} Erro ou null se válido
   */
  static validateURL(url) {
    if (!url) return null; // URL é opcional

    if (typeof url !== "string") {
      return "URL must be a string";
    }

    try {
      new URL(url);
      return null;
    } catch {
      return `Invalid URL format: "${url}"`;
    }
  }
}

export default BaseValidator;