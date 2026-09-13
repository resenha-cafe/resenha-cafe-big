/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Pipeline — Validate Step
 * ============================================================
 *
 * 📚 Step responsável por validar os artigos normalizados.
 * 
 * Aplica o BatchValidator para verificar se cada artigo atende
 * aos requisitos mínimos do sistema. Artigos inválidos são
 * removidos do fluxo principal e registrados nos metadados.
 * 
 * 📚 Entrada (context):
 * - articles: Array<Article> (artigos do NormalizeStep)
 * 
 * 📚 Saída (context):
 * - articles: Array<Article> (apenas artigos válidos)
 * - validateMeta: Object (metadados da validação)
 */

import { BaseStep } from "./base.step.js";
import { BatchValidator } from "../../validators/batch.validator.js";

export class ValidateStep extends BaseStep {
  /**
   * @param {Object} options - Configuração
   * @param {Object} [options.validator] - Validador (default: BatchValidator)
   * @param {boolean} [options.strict=false] - Modo estrito
   * @param {Object} [options.logger] - Logger
   */
  constructor(options = {}) {
    super({ name: "validate" });

    this.validator = options.validator || BatchValidator;
    this.strict = options.strict ?? false;
    this.logger = options.logger || console;
  }

  /**
   * Valida todos os artigos e separa válidos de inválidos.
   * 
   * 📚 Artigos inválidos são REMOVIDOS do array principal,
   * mas registrados em validateMeta para debug e logging.
   */
  async execute(context) {
    const { articles = [] } = context;

    if (articles.length === 0) {
      this.logger.debug("[ValidateStep] No articles to validate");
      return {
        ...context,
        validateMeta: {
          total: 0,
          valid: 0,
          invalid: 0,
          warnings: 0,
          errors: [],
        },
      };
    }

    const result = this.validator.validate(articles, {
      strict: this.strict,
    });

    this.logger.info(`[ValidateStep] Validated ${result.total} articles`, {
      valid: result.validCount,
      invalid: result.invalidCount,
      warnings: result.warningCount,
    });

    return {
      ...context,
      articles: result.valid,
      validateMeta: {
        total: result.total,
        valid: result.validCount,
        invalid: result.invalidCount,
        warnings: result.warningCount,
        errors: result.errors,
      },
    };
  }

  /**
   * ValidateStep só executa se houver articles.
   */
  canExecute(context) {
    return this.enabled && context.articles?.length > 0;
  }
}

export default ValidateStep;