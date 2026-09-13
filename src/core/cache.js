/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Core — Cache (com canonicalJson e LRU)
 * ============================================================
 */

import { canonicalJson, identityHash } from "../utils/index.js";

export class Cache {
  constructor(options = {}) {
    this.kv = options.kv || null;
    this.memoryCache = new Map();
    this.ttl = options.ttl || {
      search: 1800,
      article: 604800,
      empty: 300,
    };
    this.enabled = options.enabled !== false;
    this.memoryLimit = options.memoryLimit || 100;
  }

  /**
   * Gera chave usando canonicalJson + fnv1a32
   */
  generateKey(type, params) {
    const stable = canonicalJson(params);
    const hash = identityHash(stable);
    return `${type}:${hash}`;
  }

  async get(key) {
    if (!this.enabled) return null;

    // 1. Memory cache (LRU: get → delete → set)
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key);
      if (Date.now() - entry.timestamp < entry.ttl * 1000) {
        // LRU: move para o final
        this.memoryCache.delete(key);
        this.memoryCache.set(key, entry);
        return entry.data;
      }
      this.memoryCache.delete(key);
    }

    // 2. KV
    if (this.kv) {
      try {
        const raw = await this.kv.get(key);
        if (raw) {
          const data = JSON.parse(raw);
          this.setMemory(key, data, data.ttl || this.ttl.search);
          return data;
        }
      } catch (error) {
        console.error("Cache.get KV error:", error.message);
      }
    }

    return null;
  }

  async set(key, data, options = {}) {
    if (!this.enabled) return;

    const ttl = options.ttl || this.ttl.search;
    this.setMemory(key, data, ttl);

    if (this.kv) {
      try {
        await this.kv.put(key, JSON.stringify(data), {
          expirationTtl: ttl,
        });
      } catch (error) {
        console.error("Cache.set KV error:", error.message);
      }
    }
  }

  /**
   * Memory cache (LRU)
   */
  setMemory(key, data, ttl) {
    if (this.memoryCache.has(key)) {
      this.memoryCache.delete(key);
    }

    if (this.memoryCache.size >= this.memoryLimit) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }

    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  async delete(key) {
    this.memoryCache.delete(key);
    if (this.kv) {
      try {
        await this.kv.delete(key);
      } catch (error) {
        console.error("Cache.delete KV error:", error.message);
      }
    }
  }

  async clear() {
    this.memoryCache.clear();
  }

  async getStats() {
    return {
      memorySize: this.memoryCache.size,
      memoryLimit: this.memoryLimit,
      enabled: this.enabled,
      ttl: this.ttl,
    };
  }
}

export default Cache;