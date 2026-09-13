/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Application — Search Articles Use Case
 * ============================================================
 */

import { Article } from "../../domain/entities/article.js";
// 📚 CORRIGIDO: ArticleCreated removido — não é usado diretamente.
// O use case chama eventPublisher.articleCreated(), que internamente
// cria o evento. Isso mantém o use case desacoplado das classes de evento.

export class SearchArticlesUseCase {
  constructor({ orchestrator, eventPublisher, cache, logger } = {}) {
    if (!orchestrator) {
      throw new Error("SearchArticlesUseCase requires an orchestrator");
    }
    if (!eventPublisher) {
      throw new Error("SearchArticlesUseCase requires an eventPublisher");
    }

    this.orchestrator = orchestrator;
    this.eventPublisher = eventPublisher;
    this.cache = cache || null;
    this.logger = logger || console;
  }

  async execute(input = {}) {
    // ============================================================
    // 1. VALIDAÇÃO DE ENTRADA
    // ============================================================
    const {
      query,
      limit = 20,
      yearStart,
      yearEnd,
      language,
      openAccess = false,
      options = {},
    } = input;

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      throw new Error("Search query must be at least 2 characters");
    }

    const sanitizedQuery = query.trim().replace(/\s+/g, " ");
    const safeLimit = Math.min(Math.max(1, limit), 100);

    // ============================================================
    // 2. PARÂMETROS DE BUSCA (sem undefineds)
    // ============================================================
    const searchParams = { limit: safeLimit };

    if (yearStart !== undefined) searchParams.yearStart = yearStart;
    if (yearEnd !== undefined) searchParams.yearEnd = yearEnd;
    if (language !== undefined) searchParams.language = language;
    if (openAccess) searchParams.openAccess = openAccess;

    // ============================================================
    // 3. VERIFICA CACHE
    // ============================================================
    const useCache = options.useCache !== false;

    if (useCache && this.cache) {
      try {
        const cacheKey = this.cache.generateKey("search", {
          query: sanitizedQuery,
          ...searchParams,
        });

        const cached = await this.cache.get(cacheKey);

        if (cached) {
          this.logger.info("[SearchArticlesUseCase] Cache hit", {
            query: sanitizedQuery,
          });

          // 📚 CORRIGIDO: Reconverte objetos planos para Article
          // O cache armazena toPlainObject(), então precisamos
          // reidratar as entidades para manter consistência.
          const rehydrated = (cached.results || []).map(item =>
            item instanceof Article ? item : Article.fromPlainObject(item)
          );

          return {
            results: rehydrated,
            total: cached.total,
            fromCache: true,
            duration: 0,
            metrics: cached.metrics || {},
          };
        }
      } catch (error) {
        this.logger.warn("[SearchArticlesUseCase] Cache read failed", {
          error: error.message,
        });
      }
    }

    // ============================================================
    // 4. EXECUTA A BUSCA
    // ============================================================
    const startedAt = Date.now();
    let results = [];
    let searchMetrics = {};

    try {
      const plan = await this.orchestrator.planSearch(
        sanitizedQuery,
        searchParams
      );

      this.logger.info("[SearchArticlesUseCase] Search plan", {
        query: sanitizedQuery,
        strategy: plan.strategy,
        providers: plan.providers?.map(p => p.id || p.name),
        timeout: plan.timeout,
      });

      const searchResult = await this.orchestrator.executeSearch(
        plan,
        sanitizedQuery,
        searchParams,
        { useCache: false }
      );

      results = searchResult.results || [];
      searchMetrics = {
        strategy: plan.strategy,
        providersUsed: plan.providers?.length || 0,
        duration: searchResult.duration,
        fromCache: searchResult.fromCache || false,
      };
    } catch (error) {
      this.logger.error("[SearchArticlesUseCase] Search failed", {
        query: sanitizedQuery,
        error: error.message,
      });

      throw new Error(
        `Search failed for query "${sanitizedQuery}": ${error.message}`
      );
    }

    // ============================================================
    // 5. NORMALIZA RESULTADOS PARA ENTIDADES
    // ============================================================
    // 📚 CORRIGIDO: Verifica se já é Article antes de converter.
    // Evita criar novas instâncias desnecessariamente.
    const articles = results.map(item => {
      if (item instanceof Article) return item;
      return Article.fromPlainObject(item);
    });

    // ============================================================
    // 6. PUBLICA EVENTOS (com fallback silencioso)
    // ============================================================
    const publishEvents = options.publishEvents !== false;

    if (publishEvents) {
      const publishPromises = articles.map(article =>
        this.eventPublisher.articleCreated(article).catch(error => {
          this.logger.warn("[SearchArticlesUseCase] Event publish failed", {
            doi: article.doi,
            error: error.message,
          });
        })
      );

      await Promise.all(publishPromises);
    }

    // ============================================================
    // 7. SALVA NO CACHE (resultados como objetos planos)
    // ============================================================
    if (useCache && this.cache && articles.length > 0) {
      try {
        const cacheKey = this.cache.generateKey("search", {
          query: sanitizedQuery,
          ...searchParams,
        });

        // 📚 Armazena toPlainObject() para economizar espaço
        // e evitar problemas de serialização. A reidratação
        // é feita na leitura (passo 3).
        await this.cache.set(cacheKey, {
          results: articles.map(a => a.toPlainObject()),
          total: articles.length,
          metrics: searchMetrics,
          timestamp: Date.now(),
        });
      } catch (error) {
        this.logger.warn("[SearchArticlesUseCase] Cache write failed", {
          error: error.message,
        });
      }
    }

    // ============================================================
    // 8. RETORNA RESULTADO
    // ============================================================
    const duration = Date.now() - startedAt;

    this.logger.info("[SearchArticlesUseCase] Search completed", {
      query: sanitizedQuery,
      results: articles.length,
      duration: `${duration}ms`,
    });

    return {
      results: articles,
      total: articles.length,
      fromCache: false,
      duration,
      metrics: searchMetrics,
    };
  }

  static validateParams(params = {}) {
    const errors = [];

    if (!params.query || params.query.trim().length < 2) {
      errors.push("Query must be at least 2 characters");
    }

    if (params.limit !== undefined) {
      if (typeof params.limit !== "number" || params.limit < 1) {
        errors.push("Limit must be a positive number");
      } else if (params.limit > 100) {
        errors.push("Limit must not exceed 100");
      }
    }

    if (params.yearStart !== undefined) {
      const year = Number(params.yearStart);
      if (isNaN(year) || year < 1600 || year > new Date().getFullYear()) {
        errors.push(`yearStart must be a valid year (1600-${new Date().getFullYear()})`);
      }
    }

    if (params.yearEnd !== undefined) {
      const year = Number(params.yearEnd);
      if (isNaN(year) || year < 1600 || year > new Date().getFullYear()) {
        errors.push(`yearEnd must be a valid year (1600-${new Date().getFullYear()})`);
      }
    }

    if (
      params.yearStart !== undefined &&
      params.yearEnd !== undefined &&
      Number(params.yearStart) > Number(params.yearEnd)
    ) {
      errors.push("yearStart must be before yearEnd");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default SearchArticlesUseCase;