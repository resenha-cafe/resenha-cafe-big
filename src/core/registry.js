/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Core — Registry (com Set e EMA)
 * ============================================================
 */

export class Registry {
  constructor() {
    this.providers = new Map();
    this.healthScores = new Map();
    this.capabilityIndex = new Map();
  }

  register(provider) {
  const id = provider.name;

  if (!id) {
    throw new Error("Provider must have a name");
  }

  if (this.providers.has(id)) {
    throw new Error(`Provider "${id}" already registered`);
  }

  this.providers.set(id, provider);
  this.healthScores.set(id, {
    score: 100,
    errors: 0,
    successes: 0,
    avgLatency: 0,
    lastCheck: Date.now(),
  });

  const caps = provider.capabilities || [];
  for (const cap of caps) {
    if (!this.capabilityIndex.has(cap)) {
      this.capabilityIndex.set(cap, new Set());
    }
    this.capabilityIndex.get(cap).add(id);
  }

  return this;
}

  remove(id) {
    if (!this.providers.has(id)) return this;

    const provider = this.providers.get(id);
    const caps = provider.capabilities || [];

    for (const cap of caps) {
      const set = this.capabilityIndex.get(cap);
      if (set) {
        set.delete(id);
        if (set.size === 0) {
          this.capabilityIndex.delete(cap);
        }
      }
    }

    this.providers.delete(id);
    this.healthScores.delete(id);
    return this;
  }

  get(id) {
    return this.providers.get(id) || null;
  }

  list() {
    return Array.from(this.providers.values());
  }

  getAvailable(threshold = 50) {
    const available = [];

    for (const [id, provider] of this.providers) {
      const health = this.healthScores.get(id);

      if (health && health.score >= threshold) {
        provider.health = health.score;
        provider.avgLatency = health.avgLatency;
        available.push(provider);
      }
    }

    return available;
  }


  findByCapability(capability) {
    const ids = this.capabilityIndex.get(capability) || new Set();
    return Array.from(ids)
      .map(id => this.providers.get(id))
      .filter(p => p);
  }

  findAllCapabilities(capabilities) {
    if (capabilities.length === 0) return this.list();

    const results = [];
    for (const provider of this.providers.values()) {
      const caps = provider.capabilities || [];
      if (capabilities.every(c => caps.includes(c))) {
        results.push(provider);
      }
    }
    return results;
  }

  /**
   * Atualiza saúde com EMA (Exponential Moving Average)
   */
  updateHealth(id, success, latency = 0) {
    const health = this.healthScores.get(id);
    if (!health) return;

    if (success) health.successes++;
    else health.errors++;

    const total = health.successes + health.errors;
    const successRate = total > 0 ? health.successes / total : 1;
    const latencyPenalty = Math.min(0.5, latency / 10000);

    const newScore = Math.max(0, Math.min(100, successRate * 100 - latencyPenalty * 100));

    // EMA: 90% do histórico, 10% do novo
    health.score = health.score * 0.9 + newScore * 0.1;

    health.avgLatency = (health.avgLatency * (total - 1) + latency) / total;
    health.lastCheck = Date.now();

    this.healthScores.set(id, health);
  }

  getHealthStatus() {
    const status = {};
    for (const [id, health] of this.healthScores) {
      status[id] = {
        score: Math.round(health.score),
        avgLatency: Math.round(health.avgLatency),
        errors: health.errors,
        successes: health.successes,
        lastCheck: health.lastCheck,
      };
    }
    return status;
  }

  getCapabilities(id) {
    const provider = this.providers.get(id);
    return provider?.capabilities || [];
  }
}

export default Registry;