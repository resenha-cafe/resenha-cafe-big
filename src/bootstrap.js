/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Bootstrap — Composition Root
 * ============================================================
 */

import { Container } from "./core/container.js";
import { Orchestrator } from "./core/orchestrator.js";
import { Planner } from "./core/planner.js";
import { Registry } from "./core/registry.js";
import { Resolver } from "./core/resolver.js";
import { Ranker } from "./core/ranker.js";
import { Cache } from "./core/cache.js";
import { EventBus } from "./events/event-bus.js";
import { MetricsCollector } from "./metrics/collector.js";
import { DomainEventPublisher } from "./application/events/domain-event-publisher.js";
import { SearchArticlesUseCase } from "./application/use-cases/search-articles.use-case.js";
import { GetArticleUseCase } from "./application/use-cases/get-article.use-case.js";
import { createProviders } from "./infrastructure/providers/index.js";
import { routeRequest } from "./routes.js";

let globalRuntime = null;
const logger = console;

function createGlobalRuntime(env) {
  const container = new Container();

  const eventBus = new EventBus({ logger });
  const metrics = new MetricsCollector();
  const cache = new Cache({ kv: env.CACHE_KV || null, enabled: true });

  container.bind("eventBus", () => eventBus);
  container.bind("metrics", () => metrics);
  container.bind("cache", () => cache);
  container.bind("logger", () => logger);

  const registry = new Registry();
  const planner = new Planner();
  const resolver = new Resolver();
  const ranker = new Ranker();

  container.bind("providerRegistry", () => registry);
  container.bind("planner", () => planner);
  container.bind("resolver", () => resolver);
  container.bind("ranker", () => ranker);

  const orchestrator = new Orchestrator({
    planner,
    registry,
    resolver,
    ranker,
    cache,
    logger,
    metrics,
    eventBus,
  });

  container.bind("orchestrator", () => orchestrator);

  const eventPublisher = new DomainEventPublisher(eventBus);
  container.bind("eventPublisher", () => eventPublisher);

  const providers = createProviders({
    cache,
    eventPublisher,
    logger,
    env,
  });

  for (const provider of providers) {
  logger.info("Registering provider:", {
    class: provider?.constructor?.name,
    name: provider?.name,
  });

  registry.register(provider);
  container.bind(`provider:${provider.name}`, () => provider);
}

  const searchArticles = new SearchArticlesUseCase({
    orchestrator,
    eventPublisher,
    cache,
    logger,
  });

  const getArticle = new GetArticleUseCase({
    orchestrator,
    eventPublisher,
    cache,
    logger,
  });

  container.bind("searchArticles", () => searchArticles);
  container.bind("getArticle", () => getArticle);

  return {
    container,
    eventBus,
    metrics,
    registry,
    orchestrator,
    providers,
    config: {
      version: env.APP_VERSION || "4.0.0",
      env: env.APP_ENV || "production",
      cache: { enabled: true },
    },
  };
}

export function getRuntime(env) {
  if (
    !globalRuntime ||
    env.APP_ENV === "development" ||
    env.APP_ENV === "staging"
  ) {
    globalRuntime = createGlobalRuntime(env);
  }

  return globalRuntime;
}

export function invalidateRuntime() {
  globalRuntime = null;
}

export async function bootstrap(request, env, ctx) {
  console.log('[BOOTSTRAP] URL recebida:', request.url);
  const runtime = getRuntime(env);
  const requestId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36);

  const context = {
    runtime,
    config: runtime.config,
    env,
    ctx,
    request,
    requestId,
    startedAt: Date.now(),
    get(key) {
      return runtime.container.resolve(key);
    },
    isDevelopment() {
      return env.APP_ENV === "development" || env.APP_ENV === "staging";
    },
    isProduction() {
      return env.APP_ENV === "production";
    },
  };

  try {
    const response = await routeRequest(request, context);

    runtime.metrics.recordRequest(
      request.method,
      response.status,
      Date.now() - context.startedAt
    );

    response.headers.set("X-Request-ID", requestId);

    return response;
  } catch (error) {
    runtime.metrics.recordError(error);

    // Log detalhado com stack trace para depuração
    logger.error("[Bootstrap] Unhandled error", {
      error: error?.message || String(error),
      cause: error?.cause?.message ?? null,
      stack: error?.stack ?? null,
      requestId,
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || String(error),
        requestId,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
        },
      }
    );
  }
}

export default {
  fetch: bootstrap,
};