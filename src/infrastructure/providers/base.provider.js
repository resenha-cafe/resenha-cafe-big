export class BaseProvider {
  constructor(options = {}) {
    if (!options.name) {
      throw new Error("BaseProvider: name is required");
    }

    this.name = options.name;
    this.id = options.name;

    this.adapter = options.adapter || null;
    this.cache = options.cache || null;
    this.eventPublisher = options.eventPublisher || null;
    this.logger = options.logger !== undefined ? options.logger : console;
    this.capabilities = options.capabilities || [];
  }

  async search(query, params = {}) {
    if (!this.adapter || typeof this.adapter.search !== "function") {
      throw new Error("Provider " + this.name + " has no adapter.search()");
    }

    return this.adapter.search(query, params);
  }

  async getByDOI(doi) {
    if (!this.adapter) return null;
    if (typeof this.adapter.getByDOI !== "function") return null;
    return this.adapter.getByDOI(doi);
  }

  async cacheSearch(query, params, rawResult, articles) {
    if (!this.cache || articles.length === 0) return;

    var cacheKey = null;

    try {
      cacheKey = this.cache.generateKey("provider-search", {
        provider: this.name,
        query: query,
        params: params,
      });

      await this.cache.set(
        cacheKey,
        {
          articles: articles.map(function (a) {
            if (typeof a.toPlainObject === "function") {
              return a.toPlainObject();
            }
            return a;
          }),
          total: rawResult.total,
          meta: rawResult.meta,
          timestamp: Date.now(),
        },
        {
          ttl: this.cache.ttl ? this.cache.ttl.search || 3600 : 3600,
        }
      );
    } catch (error) {
      if (this.logger && this.logger.warn) {
        this.logger.warn("[" + this.name + "] Cache write failed", {
          key: cacheKey,
          error: error && error.message ? error.message : String(error),
        });
      }
    }
  }

  async getCachedSearch(query, params = {}) {
    if (!this.cache) return null;

    try {
      var cacheKey = this.cache.generateKey("provider-search", {
        provider: this.name,
        query: query,
        params: params,
      });

      return await this.cache.get(cacheKey);
    } catch (error) {
      if (this.logger && this.logger.warn) {
        this.logger.warn("[" + this.name + "] Cache read failed", {
          error: error && error.message ? error.message : String(error),
        });
      }

      return null;
    }
  }

  toString() {
    return "[Provider: " + this.name + "]";
  }
}

export default BaseProvider;
