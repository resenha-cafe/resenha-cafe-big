/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Application — Logging Handler
 * ============================================================
 *
 * 📚 AULA: Logging é o "diário de bordo" do sistema.
 * Cada evento importante é registrado para que possamos
 * entender o que aconteceu, quando e em que ordem.
 * 
 * Níveis de log:
 * - info: algo normal aconteceu (artigo criado)
 * - warn: algo estranho mas não crítico
 * - error: algo deu errado
 * - debug: detalhes técnicos (só em desenvolvimento)
 */

export class LoggingHandler {
  /**
   * @param {Object} options
   * @param {Object} [options.logger] - Logger (default: console)
   * @param {boolean} [options.verbose] - Incluir payload completo
   */
  constructor(options = {}) {
    this.logger = options.logger || console;
    this.verbose = options.verbose ?? false;
  }

  /**
   * Processa evento e registra no log.
   * @param {DomainEvent} event - Evento de domínio
   */
  handle(event) {
    // Dados base que TODO log vai ter
    const base = {
      event: event.type,
      occurredAt: event.occurredAt,
    };

    // Se verbose, inclui o payload completo (cuidado: pode ser grande)
    const data = this.verbose 
      ? { ...base, payload: event.payload }
      : base;

    switch (event.type) {
      // ============================================================
      // DOMAIN EVENTS
      // ============================================================
      
      case "article.created":
        this.logger.info("[Domain] Artigo criado", {
          ...data,
          doi: event.payload.doi,
          title: event.payload.title,
          source: event.payload.source,
        });
        break;

      case "article.identifiers.added":
        this.logger.info("[Domain] Identificadores adicionados", {
          ...data,
          doi: event.payload.doi,
          addedTypes: event.payload.addedTypes,
        });
        break;

      case "article.identity.changed":
        this.logger.info("[Domain] Identidade alterada", {
          ...data,
          previous: event.payload.previousIdentity,
          current: event.payload.identity,
          doi: event.payload.doi,
        });
        break;

      case "article.metadata.enriched":
        this.logger.info("[Domain] Metadados enriquecidos", {
          ...data,
          doi: event.payload.doi,
          fields: event.payload.fields,
        });
        break;

      case "article.merged":
        this.logger.info("[Domain] Artigos mesclados", {
          ...data,
          doi: event.payload.doi,
          sources: event.payload.sources,
          count: event.payload.articleCount,
        });
        break;

      // ============================================================
      // INFRASTRUCTURE EVENTS
      // ============================================================

      case "cache.cleared":
        this.logger.info("[Infra] Cache limpo", data);
        break;

      case "error.occurred":
        this.logger.error("[Error]", {
          ...data,
          message: event.payload.message,
          context: event.payload,
        });
        break;

      // ============================================================
      // REQUEST EVENTS (📚 NOVOS)
      // ============================================================

      case "request.started":
        this.logger.info("[Request] Iniciada", {
          ...data,
          method: event.payload.method,
          url: event.payload.url,
          requestId: event.payload.requestId,
        });
        break;

      case "request.completed":
        this.logger.info("[Request] Completada", {
          ...data,
          status: event.payload.status,
          duration: event.payload.duration,
          requestId: event.payload.requestId,
        });
        break;

      case "request.failed":
        this.logger.error("[Request] Falhou", {
          ...data,
          error: event.payload.error,
          status: event.payload.status,
          requestId: event.payload.requestId,
        });
        break;

      // ============================================================
      // FALLBACK
      // ============================================================

      default:
        this.logger.debug("[Event]", data);
    }
  }
}

export default LoggingHandler;