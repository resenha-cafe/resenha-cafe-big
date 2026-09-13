import { Planner } from "./planner.js";
import { Registry } from "./registry.js";
import { Resolver } from "./resolver.js";
import { Ranker } from "./ranker.js";
import { Cache } from "./cache.js";
import { ArticleMapper } from "../application/mappers/article.mapper.js";

export class Orchestrator {
  constructor(options = {}) {
    this.planner = options.planner || null;
    this.registry = options.registry || null;
    this.resolver = options.resolver || null;
    this.ranker = options.ranker || null;
    this.cache = options.cache || null;
    this.logger = options.logger || console;
    this.metrics = options.metrics || null;
    this.eventBus = options.eventBus || null;
  }

  async planSearch(query, params = {}) {
    if (!this.planner) {
      throw new Error("Orchestrator: planner is not configured");
    }

    return this.planner.plan({
      query,
      params,
      providers: this.registry ? this.registry.getAvailable() : [],
      config: this.planner.config,
    });
  }

  async executeSearch(plan, query, params, options = {}) {
    const startTime = Date.now();
    const { useCache = true } = options;

    try {
      if (useCache && this.cache) {
        const cacheKey = this.cache.generateKey("search", { query, params: params });
        const cached = await this.cache.get(cacheKey);
        if (cached) {
          return {
            results: cached.results,
            total: cached.total,
            fromCache: true,
            duration: Date.now() - startTime,
          };
        }
      }

      const results = await this.fetchFromProviders(plan, query, params);

      const mappedArticles = [];
      for (const result of results) {
        if (result.success && result.articles && result.articles.length > 0) {
          for (const rawArticle of result.articles) {
            try {
              const mapped = ArticleMapper.toDomain(rawArticle, result.provider);
              if (mapped && !mapped.isEmpty()) {
                mappedArticles.push(mapped.toPlainObject ? mapped.toPlainObject() : mapped);
              } else {
                mappedArticles.push(rawArticle);
              }
            } catch (e) {
              mappedArticles.push(rawArticle);
            }
          }
        }
      }

      var resolved;
      if (mappedArticles.length > 0) {
        resolved = mappedArticles;
      } else {
        resolved = this.resolver
          ? await this.resolver.resolve(results)
          : results;
      }

      const ranked = this.ranker
        ? await this.ranker.rank(resolved, query, params.limit)
        : resolved;

      if (useCache && this.cache && ranked.length > 0) {
        const cacheKey = this.cache.generateKey("search", { query, params: params });
        await this.cache.set(cacheKey, {
          results: ranked,
          total: ranked.length,
          timestamp: Date.now(),
        });
      }

      if (this.metrics) {
        this.metrics.recordSearch(query, ranked.length, Date.now() - startTime);
      }

      return {
        results: ranked,
        total: ranked.length,
        fromCache: false,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error("Orchestrator.executeSearch error", {
        query,
        error: error?.message || String(error),
      });
      throw error;
    }
  }

  async executeDoiLookup(doi, options = {}) {
    const startTime = Date.now();
    const { useCache = true } = options;

    try {
      if (useCache && this.cache) {
        const cacheKey = this.cache.generateKey("article", { doi });
        const cached = await this.cache.get(cacheKey);
        if (cached) {
          return {
            article: cached.article,
            fromCache: true,
            duration: Date.now() - startTime,
          };
        }
      }

      const providers = this.registry ? this.registry.getAvailable() : [];
      const results = [];

      for (const provider of providers) {
        try {
          const method = provider.getByDOI || provider.getByDoi;
          if (typeof method === "function") {
            const result = await method.call(provider, doi);
            if (result) {
              results.push({ raw: result, provider: provider.name });
            }
          }
        } catch (error) {
          this.logger.warn("Provider " + provider.name + " DOI lookup failed", {
            error: error?.message || String(error),
          });
        }
      }

      if (results.length === 0) {
        return {
          article: null,
          fromCache: false,
          duration: Date.now() - startTime,
        };
      }

      const mappedResults = results
        .map(item => {
          if (!item || !item.raw) return null;
          try {
            const mapped = ArticleMapper.toDomain(item.raw, item.provider);
            if (mapped && !mapped.isEmpty()) {
              return mapped.toPlainObject();
            }
          } catch (e) {
            // ignore
          }
          return null;
        })
        .filter(Boolean);

      if (mappedResults.length > 0) {
        const best = mappedResults.find(r => r.authors && r.authors.length > 0) || mappedResults[0];

        if (useCache && this.cache) {
          const cacheKey = this.cache.generateKey("article", { doi });
          await this.cache.set(cacheKey, {
            article: best,
            timestamp: Date.now(),
          });
        }

        return {
          article: best,
          fromCache: false,
          duration: Date.now() - startTime,
        };
      }

      const fallbackResults = results
        .map(item => {
          const r = item?.raw;
          if (!r) return null;
          const title = Array.isArray(r.title) ? r.title[0] : r.title || null;
          return {
            title,
            doi: r.doi || r.DOI || null,
            abstract: typeof r.abstract === "string" ? r.abstract : null,
            authors: r.authors || r.author || [],
            citations: r.citations || r["is-referenced-by-count"] || 0,
            source: r.source || item?.provider || null,
            publicationDate: r.publicationDate || null,
          };
        })
        .filter(Boolean);

      var explicitTitle = null;
      for (var item of fallbackResults) {
        if (item && item.title) {
          explicitTitle = Array.isArray(item.title) ? item.title[0] : item.title;
          break;
        }
      }

      var merged = fallbackResults.length > 1
        ? (this.resolver ? await this.resolver.mergeArticles(fallbackResults) : fallbackResults[0])
        : fallbackResults[0];

      if (merged && !merged.title && explicitTitle) {
        merged.title = explicitTitle;
      }

      if (useCache && this.cache) {
        const cacheKey = this.cache.generateKey("article", { doi });
        await this.cache.set(cacheKey, {
          article: merged,
          timestamp: Date.now(),
        });
      }

      return {
        article: merged,
        fromCache: false,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error("Orchestrator.executeDoiLookup error", {
        doi,
        error: error?.message || String(error),
      });
      throw error;
    }
  }

  async fetchFromProviders(plan, query, params) {
    const planProviders = plan?.providers || [];

    const providers = planProviders.length
      ? planProviders
          .map(p => {
            if (typeof p === "object" && p !== null && "search" in p) {
              return p;
            }
            return this.registry.get(p);
          })
          .filter(Boolean)
      : (this.registry ? this.registry.getAvailable() : []);

    const promises = providers.map(async (provider) => {
      try {
        const startTime = Date.now();
        const result = await provider.search(query, params);
        const duration = Date.now() - startTime;
        return {
          provider: provider.name,
          success: true,
          articles: result?.articles || [],
          total: result?.total || 0,
          duration,
        };
      } catch (error) {
        return {
          provider: provider.name,
          success: false,
          error: error?.message || String(error),
          articles: [],
          total: 0,
          duration: 0,
        };
      }
    });

    const results = await Promise.all(promises);

    for (const result of results) {
      if (this.registry) {
        this.registry.updateHealth(result.provider, result.success, result.duration || 0);
      }
    }

    return results;
  }

  registerProvider(provider) {
    this.registry.register(provider);
  }

  registerProviders(providers) {
    for (const provider of providers) {
      this.registerProvider(provider);
    }
  }

  getProviderHealth() {
    return this.registry.getHealthStatus();
  }

  async clearCache() {
    await this.cache.clear();
  }

  async getCacheStats() {
    return this.cache.getStats();
  }
}

export default Orchestrator;
