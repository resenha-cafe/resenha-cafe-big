import { normalizeTitleForIdentity as normalizeTitle } from "../utils/normalize-author.js";

export class Resolver {
  constructor(options = {}) {
    this.mergeEngine = options.mergeEngine || null;
    this.similarityThreshold = options.similarityThreshold || 0.8;
  }

  async resolve(results) {
    if (!results || results.length === 0) return [];

    const articles = [];

    for (const result of results) {
      if (result && result.success && result.articles && result.articles.length > 0) {
        for (const article of result.articles) {
          articles.push(article);
        }
      }
    }

    if (articles.length === 0) return [];

    const deduplicated = this.deduplicate(articles);
    const merged = await this.mergeAll(deduplicated);

    return merged;
  }

  deduplicate(articles) {
    const groups = new Map();

    for (const article of articles) {
      if (!article || typeof article !== "object") continue;

      let key = null;

      if (article.doi) {
        key = "doi:" + String(article.doi).toLowerCase();
      } else if (article.title && typeof article.title === "string") {
        key = "title:" + normalizeTitle(article.title);
      } else {
        key = "single:" + Math.random().toString(36);
      }

      if (groups.has(key)) {
        groups.get(key).push(article);
      } else {
        groups.set(key, [article]);
      }
    }

    return this.processFuzzy(groups);
  }

  processFuzzy(groups) {
    const entries = Array.from(groups.entries());
    const result = [];
    const used = new Set();

    for (let i = 0; i < entries.length; i++) {
      if (used.has(i)) continue;

      const group = [...entries[i][1]];
      used.add(i);

      for (let j = i + 1; j < entries.length; j++) {
        if (used.has(j)) continue;

        const title1 = entries[i][1][0]?.title;
        const title2 = entries[j][1][0]?.title;

        const similarity = this.calculateSimilarity(title1, title2);

        if (similarity > this.similarityThreshold) {
          group.push(...entries[j][1]);
          used.add(j);
        }
      }

      result.push(group);
    }

    return result;
  }

  async mergeAll(groups) {
    const results = [];

    for (const group of groups) {
      if (group.length === 1) {
        results.push(group[0]);
        continue;
      }

      let merged = group[0];
      for (let i = 1; i < group.length; i++) {
        merged = await this.mergeArticles(merged, group[i]);
      }
      results.push(merged);
    }

    return results;
  }

  async mergeArticles(existing, incoming) {
    if (!existing && !incoming) return null;
    if (!existing) return incoming;
    if (!incoming) return existing;

    if (this.mergeEngine) {
      return this.mergeEngine.merge(existing, incoming);
    }

    return this.manualMerge(existing, incoming);
  }

  manualMerge(existing, incoming) {
    const merged = { ...existing };

    const fields = [
      "title", "abstract", "authors", "year", "doi", "url",
      "pdfUrl", "citations", "references", "openAccess", "language", "type"
    ];

    for (const field of fields) {
      if (incoming[field] && (!merged[field] || this.isBetter(incoming[field], merged[field]))) {
        merged[field] = incoming[field];
      }
    }

    const sources = new Set([
      ...(merged.sources || []),
      ...(incoming.sources || []),
    ]);
    merged.sources = Array.from(sources);

    if (incoming.confidence && (!merged.confidence || incoming.confidence > merged.confidence)) {
      merged.confidence = incoming.confidence;
    }

    if (incoming.provider) {
      merged.provider = {
        ...(merged.provider || {}),
        ...incoming.provider,
      };
    }

    return merged;
  }

  isBetter(incoming, existing) {
    if (typeof incoming === "string" && typeof existing === "string") {
      return incoming.length > existing.length;
    }
    if (typeof incoming === "number" && typeof existing === "number") {
      return incoming > existing;
    }
    if (Array.isArray(incoming) && Array.isArray(existing)) {
      return incoming.length > existing.length;
    }
    if (typeof incoming === "boolean" && typeof existing === "boolean") {
      return incoming === true && existing === false;
    }
    return false;
  }

  calculateSimilarity(title1, title2) {
    if (!title1 || !title2) return 0;
    if (typeof title1 !== "string" || typeof title2 !== "string") return 0;

    const words1 = new Set(title1.toLowerCase().split(/\s+/));
    const words2 = new Set(title2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    if (union.size === 0) return 0;
    return intersection.size / union.size;
  }
}

export default Resolver;