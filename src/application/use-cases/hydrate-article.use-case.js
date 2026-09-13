/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Application — Hydrate Article Use Case
 * ============================================================
 *
 * 📚 CONVENÇÃO DE COMPATIBILIDADE:
 * 
 * Este use case é o PONTO OFICIAL de tradução entre providers
 * e o domínio. Providers podem enviar:
 * - "url" (URL genérica do artigo)
 * - "pdfUrl" (URL específica do PDF)
 * - Ambos
 * - Nenhum
 * 
 * O domínio trata "url" como campo canônico no Article,
 * mas o sistema reconhece "pdfUrl" como especialização.
 * 
 * Regra de compatibilidade:
 * - Se o provider enviar pdfUrl, ele tem precedência sobre url
 * - Se enviar apenas url, ela é usada como fallback
 * - O Article armazena em "url" (campo canônico da entidade)
 */

import { Article } from "../../domain/entities/article.js";
import { Author } from "../../domain/entities/author.js";
import { Journal } from "../../domain/entities/journal.js";
import { Publisher } from "../../domain/entities/publisher.js";
import { License } from "../../domain/entities/license.js";
import { Identifier } from "../../domain/value-objects/identifier.js";

export class HydrateArticleUseCase {
  constructor({ logger } = {}) {
    this.logger = logger || console;
  }

  async execute(rawData = {}, options = {}) {
    const { strict = true, validate = true } = options;
    const warnings = [];

    // ============================================================
    // 1. VALIDAÇÃO
    // ============================================================
    if (validate) {
      const validation = HydrateArticleUseCase.validate(rawData);

      if (!validation.valid) {
        if (strict) {
          throw new Error(
            `Article hydration failed: ${validation.errors.join(", ")}`
          );
        }

        return {
          article: null,
          valid: false,
          errors: validation.errors,
          warnings,
        };
      }

      if (validation.warnings) {
        warnings.push(...validation.warnings);
      }
    }

    // ============================================================
    // 2. NORMALIZA IDENTIFICADORES
    // ============================================================
    const identifiers = this.#normalizeIdentifiers(rawData);

    // ============================================================
    // 3. CRIA ENTIDADES FILHAS
    // ============================================================
    const authors = this.#hydrateAuthors(rawData.authors, warnings);
    const journal = this.#hydrateJournal(rawData.journal, warnings);
    const publisher = this.#hydratePublisher(rawData.publisher, warnings);
    const license = this.#hydrateLicense(rawData.license, warnings);

    // ============================================================
    // 4. RESOLVE URL (compatibilidade pdfUrl ↔ url)
    // ============================================================
    // 📚 Regra de compatibilidade:
    // pdfUrl (provider) → url (Article)
    // url (provider)    → url (Article)
    // Se ambos, pdfUrl tem precedência (é mais específico)
    const resolvedUrl = rawData.pdfUrl ?? rawData.url ?? undefined;

    // ============================================================
    // 5. CRIA O ARTIGO
    // ============================================================
    try {
      const article = new Article({
        doi: rawData.doi ?? undefined,
        title: rawData.title ?? undefined,
        abstract: rawData.abstract ?? undefined,
        publicationDate: rawData.publicationDate ?? undefined,
        language: rawData.language ?? undefined,
        type: rawData.type ?? undefined,
        url: resolvedUrl,
        openAccess: rawData.openAccess ?? undefined,
        peerReviewed: rawData.peerReviewed ?? undefined,
        authors,
        journal,
        publisher,
        license,
        identifiers,
        citations: rawData.citations ?? undefined,
        references: rawData.references ?? undefined,
        confidence: rawData.confidence ?? undefined,
        source: rawData.source || null,
        metadata: rawData.metadata || {},
      });

      this.logger.info("[HydrateArticleUseCase] Article hydrated", {
        doi: article.doi,
        title: article.title,
        source: article.source,
        authorCount: article.authorCount,
        hasIdentity: article.hasIdentity,
        hasUrl: !!article.url,
      });

      return {
        article,
        valid: true,
        errors: [],
        warnings,
      };
    } catch (error) {
      if (strict) {
        throw new Error(`Article hydration failed: ${error.message}`);
      }

      return {
        article: null,
        valid: false,
        errors: [error.message],
        warnings,
      };
    }
  }

  async executeBatch(rawDataList = [], options = {}) {
    if (!Array.isArray(rawDataList)) {
      throw new Error("rawDataList must be an array");
    }

    const results = await Promise.all(
      rawDataList.map((rawData, index) =>
        this.execute(rawData, { ...options, strict: false })
          .then(result => ({ ...result, index }))
          .catch(error => ({
            article: null,
            valid: false,
            errors: [error.message],
            warnings: [],
            index,
          }))
      )
    );

    const articles = [];
    const errors = [];
    let hydrated = 0;
    let failed = 0;

    for (const result of results) {
      if (result.valid && result.article) {
        articles.push(result.article);
        hydrated++;
      } else {
        failed++;
        errors.push({
          index: result.index,
          errors: result.errors,
          data: rawDataList[result.index]?.title 
            || rawDataList[result.index]?.doi 
            || `item ${result.index}`,
        });
      }
    }

    this.logger.info("[HydrateArticleUseCase] Batch hydration completed", {
      total: rawDataList.length,
      hydrated,
      failed,
    });

    return {
      articles,
      total: rawDataList.length,
      hydrated,
      failed,
      errors,
    };
  }

  static validate(rawData = {}) {
    const errors = [];
    const warnings = [];

    if (!rawData.title && !rawData.doi) {
      errors.push("Article must have a title or DOI");
    }

    if (rawData.title !== undefined && rawData.title !== null) {
      if (typeof rawData.title !== "string") {
        errors.push("Title must be a string");
      } else if (rawData.title.trim().length === 0) {
        errors.push("Title cannot be empty");
      } else if (rawData.title.trim().length < 2) {
        warnings.push("Title is very short (less than 2 characters)");
      }
    }

    if (rawData.doi !== undefined && rawData.doi !== null) {
      if (typeof rawData.doi !== "string") {
        errors.push("DOI must be a string");
      } else {
        const doiRegex = /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/;
        if (!doiRegex.test(rawData.doi.trim())) {
          warnings.push(`DOI "${rawData.doi}" has unusual format`);
        }
      }
    }

    if (rawData.authors !== undefined && rawData.authors !== null) {
      if (!Array.isArray(rawData.authors)) {
        errors.push("Authors must be an array");
      } else if (rawData.authors.length === 0) {
        warnings.push("Article has no authors");
      }
    }

    if (rawData.publicationDate !== undefined && rawData.publicationDate !== null) {
      const date = new Date(rawData.publicationDate);
      if (isNaN(date.getTime())) {
        const year = parseInt(rawData.publicationDate, 10);
        if (isNaN(year) || year < 1600 || year > new Date().getFullYear() + 1) {
          warnings.push(`Publication date "${rawData.publicationDate}" is invalid`);
        }
      }
    }

    if (!rawData.source) {
      warnings.push("Article has no source (provider)");
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  // ============================================================
  // MÉTODOS PRIVADOS
  // ============================================================

  #normalizeIdentifiers(rawData) {
    const identifiers = [];
    const seenTypes = new Set();

    if (rawData.doi) {
      identifiers.push(Identifier.doi(rawData.doi, {
        source: rawData.source,
        confidence: rawData.confidence,
      }));
      seenTypes.add("doi");
    }

    if (rawData.identifiers && Array.isArray(rawData.identifiers)) {
      for (const id of rawData.identifiers) {
        if (id.type && id.value && !seenTypes.has(id.type.toLowerCase())) {
          identifiers.push(Identifier.fromPlainObject(id));
          seenTypes.add(id.type.toLowerCase());
        }
      }
    }

    return identifiers;
  }

  #hydrateAuthors(rawAuthors, warnings) {
    if (!rawAuthors || !Array.isArray(rawAuthors)) return [];

    return rawAuthors.map((authorData, index) => {
      try {
        if (authorData instanceof Author) return authorData;

        if (typeof authorData === "string") {
          return Author.fromString(authorData);
        }

        if (authorData && typeof authorData === "object" && authorData.name) {
          return Author.fromPlainObject(authorData);
        }

        if (authorData && typeof authorData === "object") {
          const fallbackName = authorData.given || authorData.family 
            ? `${authorData.given || ""} ${authorData.family || ""}`.trim()
            : `Author ${index + 1}`;
          
          warnings.push(`Author at index ${index} has no name, using "${fallbackName}"`);
          return Author.fromString(fallbackName);
        }

        warnings.push(`Author at index ${index} could not be hydrated`);
        return Author.fromString(`Unknown Author ${index + 1}`);
      } catch (error) {
        warnings.push(`Author at index ${index} hydration error: ${error.message}`);
        return Author.fromString(`Unknown Author ${index + 1}`);
      }
    });
  }

  #hydrateJournal(rawJournal, warnings) {
    if (!rawJournal) return null;

    try {
      if (rawJournal instanceof Journal) return rawJournal;
      return Journal.fromPlainObject(rawJournal);
    } catch (error) {
      warnings.push(`Journal could not be hydrated: ${error.message}`);
      return null;
    }
  }

  #hydratePublisher(rawPublisher, warnings) {
    if (!rawPublisher) return null;

    try {
      if (rawPublisher instanceof Publisher) return rawPublisher;
      return Publisher.fromPlainObject(rawPublisher);
    } catch (error) {
      warnings.push(`Publisher could not be hydrated: ${error.message}`);
      return null;
    }
  }

  #hydrateLicense(rawLicense, warnings) {
    if (!rawLicense) return null;

    try {
      if (rawLicense instanceof License) return rawLicense;

      if (typeof rawLicense === "string") {
        return License.fromName(rawLicense);
      }

      return License.fromPlainObject(rawLicense);
    } catch (error) {
      warnings.push(`License could not be hydrated: ${error.message}`);
      return null;
    }
  }
}

export default HydrateArticleUseCase;