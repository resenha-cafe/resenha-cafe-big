/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Core — DI Container (sem conhecimento de UseCases)
 * ============================================================
 */

import { EventBus } from "../events/event-bus.js";
import { MetricsCollector } from "../metrics/collector.js";
import { CONFIG } from "../config/index.js";

// Scopes
export const SCOPE = {
  SINGLETON: "singleton",
  TRANSIENT: "transient",
  REQUEST: "request",
};

export class Container {
  constructor() {
    this.bindings = new Map();
    this.instances = new Map();
    this.requestInstances = new Map();
    this.singletons = new Set();
    this.requestScoped = new Set();
    this.currentRequestId = null;
  }

  beginRequest(requestId) {
    this.currentRequestId = requestId;
    this.requestInstances.clear();
  }

  endRequest() {
    // Libera recursos request-scoped
    for (const [key, instance] of this.requestInstances) {
      if (instance.dispose && typeof instance.dispose === "function") {
        instance.dispose();
      }
    }
    this.currentRequestId = null;
    this.requestInstances.clear();
  }

  bind(key, factory, options = {}) {
    const scope = options.scope || SCOPE.TRANSIENT;
    this.bindings.set(key, {
      factory,
      scope,
      dependencies: options.dependencies || [],
    });

    if (scope === SCOPE.SINGLETON) {
      this.singletons.add(key);
    }

    if (scope === SCOPE.REQUEST) {
      this.requestScoped.add(key);
    }

    return this;
  }

  singleton(key, factory) {
    return this.bind(key, factory, { scope: SCOPE.SINGLETON });
  }

  requestScoped(key, factory) {
    return this.bind(key, factory, { scope: SCOPE.REQUEST });
  }

  resolve(key) {
    // 1. Singleton
    if (this.singletons.has(key) && this.instances.has(key)) {
      return this.instances.get(key);
    }

    // 2. Request scoped
    if (this.requestScoped.has(key) && this.currentRequestId) {
      const requestKey = `${key}:${this.currentRequestId}`;
      if (this.requestInstances.has(requestKey)) {
        return this.requestInstances.get(requestKey);
      }
    }

    const binding = this.bindings.get(key);
    if (!binding) {
      throw new Error(`Dependency "${key}" not found`);
    }

    const deps = binding.dependencies.map(dep => this.resolve(dep));
    const instance = binding.factory(...deps);

    if (this.singletons.has(key)) {
      this.instances.set(key, instance);
    }

    if (this.requestScoped.has(key) && this.currentRequestId) {
      const requestKey = `${key}:${this.currentRequestId}`;
      this.requestInstances.set(requestKey, instance);
    }

    return instance;
  }

  has(key) {
    return this.bindings.has(key);
  }

  remove(key) {
    this.bindings.delete(key);
    this.instances.delete(key);
    this.requestInstances.delete(key);
    this.singletons.delete(key);
    this.requestScoped.delete(key);
    return this;
  }

  clear() {
    this.bindings.clear();
    this.instances.clear();
    this.requestInstances.clear();
    this.singletons.clear();
    this.requestScoped.clear();
    return this;
  }

  // Registro de serviços (apenas infraestrutura)
  static createDefault() {
    const container = new Container();

    // Infraestrutura (singletons)
    container.singleton("eventBus", () => new EventBus());
    container.singleton("config", () => CONFIG);
    container.singleton("metrics", () => new MetricsCollector());

    // Cache (singleton)
    container.singleton("cache", () => ({
      get: async () => null,
      set: async () => {},
      clear: async () => {},
      getStats: async () => ({}),
    }));

    // Provider Registry (singleton)
    container.singleton("providerRegistry", () => ({
      providers: [],
      register: (provider) => {},
      remove: (id) => {},
      get: (id) => null,
      list: () => [],
      getAvailable: () => [],
    }));

    // Logger (singleton)
    container.singleton("logger", () => ({
      info: (msg, data) => console.log(JSON.stringify({ level: "info", msg, data })),
      error: (msg, data) => console.error(JSON.stringify({ level: "error", msg, data })),
      warn: (msg, data) => console.warn(JSON.stringify({ level: "warn", msg, data })),
      debug: (msg, data) => {
        if (globalThis.__DEV__) {
          console.debug(JSON.stringify({ level: "debug", msg, data }));
        }
      },
    }));

    return container;
  }
}

export default Container;