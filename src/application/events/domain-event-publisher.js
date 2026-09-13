/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Application — Domain Event Publisher
 * ============================================================
 *
 * Fachada semântica sobre o EventBus.
 * 
 * Responsabilidades:
 * - Traduzir ações dos use cases em eventos de domínio
 * - Encapsular a criação das classes de evento
 * - Centralizar transformações futuras (enriquecimento, outbox)
 * - Eliminar acoplamento dos use cases a strings e imports
 * 
 * ⚠️ Esta é a ÚNICA interface de eventos que os use cases conhecem.
 * 
 * Camada: Application
 * Depende de: domain/events (eventos), events/event-bus (infraestrutura)
 */

import {
  ArticleCreated,
  ArticleIdentifiersAdded,
  ArticleIdentityChanged,
  ArticleMetadataEnriched,
  ArticleMerged,
} from "../../domain/events/domain-events.js";

export class DomainEventPublisher {
  /**
   * @param {EventBus} eventBus - Bus de eventos (infraestrutura)
   */
  constructor(eventBus) {
    this.#bus = eventBus;
  }

  /** @type {EventBus} */
  #bus;

  // ============================================================
  // ARTICLE EVENTS
  // ============================================================

  /**
   * Publica evento de artigo criado.
   * 
   * @param {Article} article - Artigo criado
   * @returns {Promise<void>}
   */
  async articleCreated(article) {
    await this.#bus.emit(new ArticleCreated(article));
  }

  /**
   * Publica evento de identificadores adicionados.
   * 
   * @param {Article} article - Artigo modificado
   * @param {Array<string>|Set<string>} addedTypes - Tipos adicionados
   * @returns {Promise<void>}
   */
  async articleIdentifiersAdded(article, addedTypes = []) {
    await this.#bus.emit(new ArticleIdentifiersAdded(article, addedTypes));
  }

  /**
   * Publica evento de identidade alterada.
   * 
   * @param {Identity|string|null} previousIdentity - Identidade anterior
   * @param {Article} article - Artigo com a nova identidade
   * @returns {Promise<void>}
   */
  async articleIdentityChanged(previousIdentity, article) {
    await this.#bus.emit(new ArticleIdentityChanged(previousIdentity, article));
  }

  /**
   * Publica evento de metadados enriquecidos.
   * 
   * @param {Article} article - Artigo enriquecido
   * @param {Array<string>|Set<string>} fields - Campos enriquecidos
   * @returns {Promise<void>}
   */
  async articleMetadataEnriched(article, fields = []) {
    await this.#bus.emit(new ArticleMetadataEnriched(article, fields));
  }

  /**
   * Publica evento de artigos mesclados.
   * 
   * @param {Article} merged - Artigo resultante do merge
   * @param {Array<string>|Set<string>} sources - Providers de origem
   * @param {number} [articleCount=2] - Número de artigos mesclados
   * @returns {Promise<void>}
   */
  async articleMerged(merged, sources = [], articleCount = 2) {
    await this.#bus.emit(new ArticleMerged(merged, sources, articleCount));
  }

  // ============================================================
  // INFRASTRUCTURE EVENTS
  // ============================================================

  /**
   * Publica evento de cache limpo.
   * 
   * @param {Object} [details={}] - Detalhes da limpeza
   * @returns {Promise<void>}
   */
  async cacheCleared(details = {}) {
    await this.#bus.emit("cache.cleared", {
      timestamp: new Date().toISOString(),
      ...details,
    });
  }

  /**
   * Publica evento de erro.
   * 
   * @param {string} message - Mensagem de erro
   * @param {Object} [context={}] - Contexto adicional
   * @returns {Promise<void>}
   */
  async errorOccurred(message, context = {}) {
    await this.#bus.emit("error.occurred", {
      message,
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  /**
   * Publica evento de requisição iniciada.
   * 
   * @param {Object} details - Detalhes da requisição
   * @returns {Promise<void>}
   */
  async requestStarted(details) {
    await this.#bus.emit("request.started", {
      timestamp: new Date().toISOString(),
      ...details,
    });
  }

  /**
   * Publica evento de requisição completada.
   * 
   * @param {Object} details - Detalhes da requisição
   * @returns {Promise<void>}
   */
  async requestCompleted(details) {
    await this.#bus.emit("request.completed", {
      timestamp: new Date().toISOString(),
      ...details,
    });
  }

  // ============================================================
  // CUSTOM
  // ============================================================

  /**
   * Publica evento customizado.
   * 
   * Para eventos que ainda não têm método semântico específico.
   * 
   * @param {string} eventType - Tipo do evento
   * @param {Object} payload - Payload
   * @returns {Promise<void>}
   */
  async custom(eventType, payload = {}) {
    await this.#bus.emit(eventType, payload);
  }
}

export default DomainEventPublisher;