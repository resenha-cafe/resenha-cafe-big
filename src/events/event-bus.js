/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Events — Event Bus (In-Memory)
 * ============================================================
 *
 * 📚 AULA: O que é um Event Bus?
 * 
 * O Event Bus é o sistema nervoso da aplicação. Ele permite
 * que componentes se comuniquem sem se conhecerem diretamente.
 * 
 * 📚 Analogia:
 * É como um quadro de avisos numa universidade. Quando alguém
 * publica um aviso (evento), todos que se inscreveram naquele
 * tipo de aviso (handlers) são notificados.
 * 
 * 📚 Fluxo:
 * 
 * Publisher → EventBus.emit(event) → Handlers registrados
 * 
 * 📚 Características:
 * 
 * - Desacoplado: publishers não conhecem os handlers
 * - Múltiplos handlers por tipo de evento
 * - Unsubscribe: handlers podem se remover
 * - Isolamento: erro em um handler não afeta os outros
 * - Logger injetável: null desabilita logging
 * - Validação de handlers: não-funções são rejeitadas
 * - Wrapper no onAll: isola o handler original
 * 
 * feat(events): add in-memory event bus with injectable logger
 */

import { DomainEvent } from "../domain/events/domain-events.js";

/**
 * @callback EventHandler
 * @param {DomainEvent} event - Evento de domínio
 * @returns {void|Promise<void>}
 */

export class EventBus {
  /** @type {Map<string, Set<EventHandler>>} */
  #handlers;

  /** @type {Set<EventHandler>} */
  #wildcardHandlers;

  /** @type {Map<string, number>} */
  #stats;

  /** @type {Object|null} */
  #logger;

  /**
   * @param {Object} options - Configuração
   * @param {Object|null} [options.logger] - Logger (null = sem logging)
   */
  constructor(options = {}) {
    this.#handlers = new Map();
    this.#wildcardHandlers = new Set();
    this.#stats = new Map();
    this.#logger = options.logger !== undefined ? options.logger : console;

    // Inicializa contadores para os eventos conhecidos
    const knownTypes = [
      "article.created",
      "article.identifiers.added",
      "article.identity.changed",
      "article.metadata.enriched",
      "article.merged",
      "cache.cleared",
      "error.occurred",
      "request.started",
      "request.completed",
      "request.failed",
    ];

    for (const type of knownTypes) {
      this.#stats.set(type, 0);
    }
  }

  // ============================================================
  // REGISTRO
  // ============================================================

  /**
   * Registra um handler para um tipo de evento.
   * 
   * Suporta múltiplos handlers por tipo.
   * Retorna uma função de unsubscribe.
   * 
   * @param {string} eventType - Tipo do evento (ex: "article.created")
   * @param {EventHandler} handler - Função handler
   * @returns {Function} Função para remover o handler
   * @throws {TypeError} Se handler não for função
   * 
   * @example
   * const unsubscribe = eventBus.on("article.created", (event) => {
   *   console.log("Artigo criado:", event.payload.doi);
   * });
   * 
   * // Depois:
   * unsubscribe();
   */
  on(eventType, handler) {
    if (typeof handler !== "function") {
      throw new TypeError(
        `EventBus.on: handler for "${eventType}" must be a function`
      );
    }

    if (!this.#handlers.has(eventType)) {
      this.#handlers.set(eventType, new Set());
    }

    const handlers = this.#handlers.get(eventType);
    handlers.add(handler);

    if (!this.#stats.has(eventType)) {
      this.#stats.set(eventType, 0);
    }

    // Retorna função de unsubscribe
    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.#handlers.delete(eventType);
      }
    };
  }

  /**
   * Registra um handler para múltiplos tipos de evento.
   * 
   * @param {Array<string>} eventTypes - Tipos de evento
   * @param {EventHandler} handler - Função handler
   * @returns {Function} Função para remover todos os handlers
   * 
   * @example
   * const unsubscribe = eventBus.onAny([
   *   "article.created",
   *   "article.merged"
   * ], (event) => {
   *   console.log("Evento de artigo:", event.type);
   * });
   */
  onAny(eventTypes, handler) {
    if (!Array.isArray(eventTypes)) {
      throw new TypeError("EventBus.onAny: eventTypes must be an array");
    }

    const unsubscribers = eventTypes.map(type => this.on(type, handler));

    return () => {
      for (const unsubscribe of unsubscribers) {
        unsubscribe();
      }
    };
  }

  /**
   * Registra um handler para todos os eventos (wildcard).
   * 
   * Útil para logging, métricas e debugging.
   * 
   * @param {EventHandler} handler - Função handler
   * @returns {Function} Função para remover o handler
   * @throws {TypeError} Se handler não for função
   */
  onAll(handler) {
    if (typeof handler !== "function") {
      throw new TypeError("EventBus.onAll: handler must be a function");
    }

    // Wrapper isola o handler original — garante que receba
    // exatamente um argumento (o evento)
    const wrapper = (event) => handler(event);
    this.#wildcardHandlers.add(wrapper);

    return () => {
      this.#wildcardHandlers.delete(wrapper);
    };
  }

  /**
   * Remove todos os handlers de um tipo de evento.
   * 
   * @param {string} eventType - Tipo do evento
   */
  removeAllListeners(eventType) {
    this.#handlers.delete(eventType);
  }

  /**
   * Remove todos os handlers de todos os eventos.
   */
  clear() {
    this.#handlers.clear();
    this.#wildcardHandlers.clear();
  }

  // ============================================================
  // PUBLICAÇÃO
  // ============================================================

  /**
   * Publica um evento para todos os handlers registrados.
   * 
   * A publicação é SÍNCRONA — os handlers são executados
   * em sequência. Para comportamento assíncrono, os próprios
   * handlers devem retornar Promises.
   * 
   * ⚠️ Erros em handlers são capturados e logados,
   * mas NÃO interrompem a execução dos outros handlers.
   * 
   * @param {string|DomainEvent} eventTypeOrEvent - Tipo do evento ou instância de DomainEvent
   * @param {Object} [payload] - Payload do evento (se o primeiro parâmetro for string)
   * @returns {Promise<void>}
   * 
   * @example
   * // Com instância de DomainEvent
   * await eventBus.emit(new ArticleCreated(article));
   * 
   * // Com tipo + payload (para eventos simples)
   * await eventBus.emit("cache.cleared", { timestamp: Date.now() });
   */
  async emit(eventTypeOrEvent, payload = {}) {
    /** @type {DomainEvent} */
    let event;

    if (eventTypeOrEvent instanceof DomainEvent) {
      event = eventTypeOrEvent;
    } else {
      // Evento inline (sem classe específica)
      event = new DomainEvent(eventTypeOrEvent, payload);
    }

    const eventType = event.type;

    // Atualiza estatísticas
    const count = this.#stats.get(eventType) || 0;
    this.#stats.set(eventType, count + 1);

    // Handlers específicos
    const handlers = this.#handlers.get(eventType);
    if (handlers) {
      for (const handler of handlers) {
        try {
          await handler(event);
        } catch (error) {
          this.#log("error", `[EventBus] Error in handler for "${eventType}"`, {
            error: error.message,
            cause: error.cause?.message ?? null,
          });
        }
      }
    }

    // Handlers wildcard (onAll)
    for (const handler of this.#wildcardHandlers) {
      try {
        await handler(event);
      } catch (error) {
        this.#log("error", `[EventBus] Error in wildcard handler for "${eventType}"`, {
          error: error.message,
        });
      }
    }
  }

  // ============================================================
  // ESTATÍSTICAS
  // ============================================================

  /**
   * Retorna estatísticas de eventos publicados.
   * 
   * @returns {Object} Estatísticas por tipo de evento
   */
  getStats() {
    const stats = {};
    for (const [type, count] of this.#stats) {
      const handlerCount = this.#handlers.get(type)?.size || 0;
      stats[type] = {
        published: count,
        handlers: handlerCount,
      };
    }

    const wildcardCount = this.#wildcardHandlers.size;
    if (wildcardCount > 0) {
      stats["*"] = {
        published: 0,
        handlers: wildcardCount,
      };
    }

    return stats;
  }

  /**
   * Número total de handlers registrados.
   * 
   * @returns {number}
   */
  get handlerCount() {
    let count = 0;
    for (const handlers of this.#handlers.values()) {
      count += handlers.size;
    }
    count += this.#wildcardHandlers.size;
    return count;
  }

  /**
   * Número de tipos de evento com handlers registrados.
   * 
   * @returns {number}
   */
  get eventTypeCount() {
    return this.#handlers.size;
  }

  /**
   * Lista os tipos de evento com handlers registrados.
   * 
   * @returns {Array<string>}
   */
  get registeredTypes() {
    return Array.from(this.#handlers.keys());
  }

  // ============================================================
  // LOGGING SEGURO
  // ============================================================

  /**
   * Loga com segurança, mesmo se o logger não tiver o método.
   * Fallback: level → info → null (não loga).
   * 
   * @private
   */
  #log(level, message, data) {
    if (!this.#logger) return;

    const method = typeof this.#logger[level] === "function"
      ? this.#logger[level]
      : typeof this.#logger.info === "function"
        ? this.#logger.info
        : null;

    if (!method) return;

    if (data) {
      method.call(this.#logger, message, data);
    } else {
      method.call(this.#logger, message);
    }
  }
}

export default EventBus;