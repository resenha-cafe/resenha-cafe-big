/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Application Layer — Barrel Export
 * ============================================================
 *
 * 📚 AULA: Barrel Export com ESM (ECMAScript Modules).
 * 
 * `export { X } from "./modulo.js"` re-exporta X diretamente
 * do módulo de origem. NÃO cria uma variável local chamada X.
 * 
 * ❌ ERRADO:
 * export { SearchArticlesUseCase } from "./use-cases/...";
 * export default { SearchArticlesUseCase }; // ReferenceError!
 * 
 * ✅ CORRETO (Opção A - recomendada):
 * Apenas exports nomeados. Quem importa escolhe o que quer.
 * 
 * ✅ CORRETO (Opção B - se quiser default export):
 * import { SearchArticlesUseCase } from "./use-cases/...";
 * export { SearchArticlesUseCase };
 * export default { SearchArticlesUseCase }; // Agora funciona!
 * 
 * 📚 Uso:
 * // Named import (recomendado)
 * import { SearchArticlesUseCase, GetArticleUseCase } from "../application";
 * 
 * // Namespace import (alternativa)
 * import * as Application from "../application";
 * const useCase = new Application.SearchArticlesUseCase({ ... });
 */

// ============================================================
// USE CASES
// ============================================================
export { SearchArticlesUseCase } from "./use-cases/search-articles.use-case.js";
export { GetArticleUseCase } from "./use-cases/get-article.use-case.js";
export { MergeArticlesUseCase } from "./use-cases/merge-articles.use-case.js";
export { EnrichArticleUseCase } from "./use-cases/enrich-article.use-case.js";
export { HydrateArticleUseCase } from "./use-cases/hydrate-article.use-case.js";

// ============================================================
// EVENTS (publicador)
// ============================================================
export { DomainEventPublisher } from "./events/domain-event-publisher.js";

// ============================================================
// HANDLERS
// ============================================================
export { ArticleCreatedHandler } from "./events/handlers/article-created.handler.js";
export { ArticleMergedHandler } from "./events/handlers/article-merged.handler.js";
export { CacheHandler } from "./events/handlers/cache.handler.js";
export { MetricsHandler } from "./events/handlers/metrics.handler.js";
export { LoggingHandler } from "./events/handlers/logging.handler.js";

// ============================================================
// MAPPERS (futuro)
// ============================================================
// export { ArticleMapper } from "./mappers/article.mapper.js";
// export { AuthorMapper } from "./mappers/author.mapper.js";

// ============================================================
// CONTEXTS (futuro)
// ============================================================
// export { ExecutionContext } from "./contexts/execution-context.js";
// export { SearchContext } from "./contexts/search-context.js";

// ============================================================
// BUILDERS (futuro)
// ============================================================
// export { ArticleBuilder } from "./builders/article.builder.js";