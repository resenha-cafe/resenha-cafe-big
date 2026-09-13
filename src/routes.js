/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Routes — Definição de Rotas (objetos, não classes)
 * ============================================================
 */

import { RequestValidator, ValidationError } from "./http/request-validator.js";
import * as Response from "./http/response.js";

// ============================================================
// ROTAS
// ============================================================

export const routes = [
  {
    method: "GET",
    path: "/search",
    async handler(request, context) {
      const url = new URL(request.url);
      const params = url.searchParams;

      const data = RequestValidator.validateSearch(params);
      const { query, limit, yearStart, yearEnd, language, openAccess } = data;

      const useCase = context.get("searchArticles");
      const result = await useCase.execute({
        query,
        limit,
        yearStart,
        yearEnd,
        language,
        openAccess,
      });

      return Response.ok({
        query,
        results: result.results,
        total: result.total || result.results?.length || 0,
        metrics: result.metrics,
        duration: result.duration,
      });
    },
  },

  {
    method: "GET",
    path: "/article",
    async handler(request, context) {
      const url = new URL(request.url);
      const doi = url.searchParams.get("doi");

      const validatedDoi = RequestValidator.validateDoi(doi);
      const useCase = context.get("getArticle");
      const article = await useCase.execute(validatedDoi, { useCache: false });

      if (!article) {
        return Response.notFound(`Article with DOI "${doi}" not found`);
      }

      return Response.ok({ article });
    },
  },

  {
    method: "GET",
    path: "/health",
    async handler(request, context) {
      return Response.ok({
        status: "healthy",
        version: context.config.version,
        timestamp: new Date().toISOString(),
        requestId: context.requestId,
      });
    },
  },

  {
    method: "GET",
    path: "/metrics",
    async handler(request, context) {
      const metrics = context.get("metrics");
      return Response.ok({
        metrics: metrics.getMetrics(),
        requestId: context.requestId,
      });
    },
  },

  {
    method: "GET",
    path: "/cache",
    async handler(request, context) {
      const url = new URL(request.url);
      const action = url.searchParams.get("action");
      const cache = context.get("cache");

      if (action === "clear" && context.isDevelopment()) {
        await cache.clear();
        return Response.ok({ message: "Cache cleared", requestId: context.requestId });
      }

      return Response.ok({
        enabled: context.config.cache?.enabled ?? true,
        stats: await cache.getStats?.() || {},
        requestId: context.requestId,
      });
    },
  },

  {
    method: "OPTIONS",
    path: "*",
    async handler() {
      return Response.preflight();
    },
  },
];

// ============================================================
// ROUTER
// ============================================================

export async function routeRequest(request, context) {
  const url = new URL(request.url);
  const method = request.method;
  const pathname = url.pathname;

  for (const route of routes) {
    const matchesPath = route.path === "*" || route.path === pathname;
    const matchesMethod = route.method === "*" || route.method === method;

    if (matchesPath && matchesMethod) {
      try {
        return await route.handler(request, context);
      } catch (error) {
        throw error;
      }
    }
  }

  return Response.notFound(`Route "${pathname}" not found`);
}

export default {
  routeRequest,
  routes,
};