/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Pipeline — Normalize Step
 * ============================================================
 *
 * 📚 Step responsável por normalizar os artigos já convertidos.
 * 
 * Enquanto o AdaptStep converte formato (provider → Article),
 * o NormalizeStep aplica transformações de qualidade:
 * - Normaliza texto (Unicode, espaços, case)
 * - Normaliza identificadores (DOI)
 * - Normaliza datas
 * 
 * 📚 normalizeText vs normalizeForIdentity:
 * 
 * - normalizeText: preserva acentos e estrutura textual, aplica lowercase
 *   Ex: "Efeito da Cafeína na Memória" → "efeito da cafeína na memória"
 * 
 * - normalizeForIdentity: agressivo, remove acentos e pontuação
 *   Ex: "Efeito da Cafeína na Memória" → "efeito da cafeina na memoria"
 *   Usado APENAS no merge/deduplicação (IdentityNormalizer)
 * 
 * 📚 Entrada (context):
 * - articles: Array<Article> (artigos do AdaptStep)
 * 
 * 📚 Saída (context):
 * - articles: Array<Article> (artigos normalizados)
 * - normalizeMeta: Object (metadados da normalização)
 */

import { BaseStep } from "./base.step.js";
import {
  normalizeText,
} from "../../utils/normalize-text.js";
import { normalizeDOI } from "../../utils/normalize-identifier.js";
import { normalizeDate } from "../../utils/normalize-date.js";

export class NormalizeStep extends BaseStep {
  /**
   * @param {Object} options - Configuração
   * @param {Object} [options.logger] - Logger
   */
  constructor(options = {}) {
    super({ name: "normalize" });
    this.logger = options.logger || console;
  }

  /**
   * Aplica normalizações em todos os artigos.
   * 
   * 📚 Usa os normalizers do módulo utils/.
   * Cada normalizer é uma função pura — não modifica o artigo original.
   * O Article é imutável, então retornamos um novo artigo com with().
   */
  async execute(context) {
    const { articles = [] } = context;

    if (articles.length === 0) {
      this.logger.debug("[NormalizeStep] No articles to normalize");
      return {
        ...context,
        normalizeMeta: {
          totalProcessed: 0,
          fieldsNormalized: [],
        },
      };
    }

    const fieldsNormalized = new Set();
    const normalized = articles.map(article => {
      const updates = {};

      // Normaliza título — preserva acentos e estrutura textual
      // normalizeText faz Unicode NFKC + trim + colapsa espaços + lowercase
      // normalizeForIdentity (mais agressivo) é usado apenas no merge/deduplicação
      if (article.title) {
        const normalizedTitle = normalizeText(article.title);
        if (normalizedTitle !== article.title) {
          updates.title = normalizedTitle;
          fieldsNormalized.add("title");
        }
      }

      // Normaliza abstract
      if (article.abstract) {
        const normalizedAbstract = normalizeText(article.abstract);
        if (normalizedAbstract !== article.abstract) {
          updates.abstract = normalizedAbstract;
          fieldsNormalized.add("abstract");
        }
      }

      // Normaliza DOI
      if (article.doi) {
        const normalizedDoi = normalizeDOI(article.doi);
        if (normalizedDoi && normalizedDoi !== article.doi) {
          updates.doi = normalizedDoi;
          fieldsNormalized.add("doi");
        }
      }

      // Normaliza data de publicação
      if (article.publicationDate) {
        const normalizedDate = normalizeDate(article.publicationDate);
        if (normalizedDate && normalizedDate !== article.publicationDate) {
          updates.publicationDate = normalizedDate;
          fieldsNormalized.add("publicationDate");
        }
      }

      // Se não há atualizações, retorna o artigo original
      if (Object.keys(updates).length === 0) {
        return article;
      }

      return article.with(updates);
    });

    this.logger.info(`[NormalizeStep] Normalized ${normalized.length} articles`, {
      fields: [...fieldsNormalized],
    });

    return {
      ...context,
      articles: normalized,
      normalizeMeta: {
        totalProcessed: normalized.length,
        fieldsNormalized: [...fieldsNormalized],
      },
    };
  }

  /**
   * NormalizeStep só executa se houver articles.
   */
  canExecute(context) {
    return this.enabled && context.articles?.length > 0;
  }
}

export default NormalizeStep;