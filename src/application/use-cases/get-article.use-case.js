// VERSION: FINAL-2026-08-16
import { Article } from "../../domain/entities/article.js";

export class GetArticleUseCase {
  constructor({ orchestrator, eventPublisher, cache, logger } = {}) {
    if (!orchestrator) {
      throw new Error("GetArticleUseCase requires an orchestrator");
    }
    if (!eventPublisher) {
      throw new Error("GetArticleUseCase requires an eventPublisher");
    }

    this.orchestrator = orchestrator;
    this.eventPublisher = eventPublisher;
    this.cache = cache || null;
    this.logger = logger || console;
  }

  async execute(doi, options = {}) {
    if (!options.skipValidation) {
      if (!doi || typeof doi !== "string") {
        throw new Error("DOI is required and must be a string");
      }

      const sanitizedDoi = doi.trim();
      const doiRegex = /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/;

      if (!doiRegex.test(sanitizedDoi)) {
        throw new Error("Invalid DOI format: " + sanitizedDoi);
      }

      doi = sanitizedDoi;
    } else {
      doi = doi.trim();
    }

    const useCache = options.useCache !== false;

    if (useCache && this.cache) {
      try {
        const cacheKey = this.cache.generateKey("article", { doi });
        const cached = await this.cache.get(cacheKey);

        if (cached) {
          const article = cached.article
            ? Article.fromPlainObject(cached.article)
            : null;

          return {
            article,
            fromCache: true,
            duration: 0,
            sources: cached.sources || [],
          };
        }
      } catch (error) {
        this.logger.warn("[GetArticleUseCase] Cache read failed", {
          doi,
          error: error?.message || String(error),
        });
      }
    }

    const startedAt = Date.now();
    let article = null;
    let sources = [];
    let wasMerged = false;

    try {
      const result = await this.orchestrator.executeDoiLookup(
        doi,
        { useCache: false }
      );

      if (result && result.article) {
        const data = result.article;

        if (data && typeof data === "object") {
          article = new Article({
            title: data.title || result.title || null,
            doi: data.doi || data.DOI || null,
            abstract: data.abstract || null,
            publicationDate: data.publicationDate || null,
            language: data.language || null,
            type: data.type || null,
            url: data.url || null,
            openAccess: data.openAccess || false,
            peerReviewed: data.peerReviewed || false,
            authors: data.authors || [],
            journal: data.journal || null,
            publisher: data.publisher || null,
            license: data.license || null,
            citations: data.citations || 0,
            references: data.references || [],
            confidence: data.confidence || 0,
            source: data.source || null,
            metadata: data.metadata || {},
          });
        }

        sources = result.sources || [];
        wasMerged = sources.length > 1;
      }
    } catch (error) {
      throw new Error(
        "Article lookup failed for DOI \"" + doi + "\": " + (error?.message || String(error))
      );
    }

    const publishEvents = options.publishEvents !== false;

    if (publishEvents && article) {
      try {
        if (wasMerged) {
          await this.eventPublisher.articleMerged(article, sources, sources.length);
        } else {
          await this.eventPublisher.articleCreated(article);
        }
      } catch (error) {
        this.logger.warn("[GetArticleUseCase] Event publish failed", {
          doi,
          error: error?.message || String(error),
        });
      }
    }

    if (useCache && this.cache && article) {
      try {
        const cacheKey = this.cache.generateKey("article", { doi });

        await this.cache.set(
          cacheKey,
          {
            article: article.toPlainObject(),
            sources,
            timestamp: Date.now(),
          },
          { ttl: this.cache.ttl?.article || 604800 }
        );
      } catch (error) {
        this.logger.warn("[GetArticleUseCase] Cache write failed", {
          doi,
          error: error?.message || String(error),
        });
      }
    }

    const duration = Date.now() - startedAt;

    if (article) {
      this.logger.info("[GetArticleUseCase] Article found", {
        doi,
        title: article.title,
        sources,
        wasMerged,
        duration: duration + "ms",
      });
    }

    return {
      article,
      fromCache: false,
      duration,
      sources,
    };
  }

  static validateDoi(doi) {
    const errors = [];

    if (!doi || typeof doi !== "string") {
      errors.push("DOI is required and must be a string");
      return { valid: false, sanitized: null, errors };
    }

    const sanitized = doi.trim();

    if (sanitized.length === 0) {
      errors.push("DOI cannot be empty");
      return { valid: false, sanitized: null, errors };
    }

    const doiRegex = /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/;

    if (!doiRegex.test(sanitized)) {
      errors.push("Invalid DOI format");
    }

    return {
      valid: errors.length === 0,
      sanitized: errors.length === 0 ? sanitized : null,
      errors,
    };
  }
}

export default GetArticleUseCase;
