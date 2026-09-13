/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Application — Metrics Handler
 * ============================================================
 *
 * 📚 AULA: Métricas são como o painel de um carro.
 * Elas mostram o que está acontecendo: quantos artigos
 * foram criados, quantos erros ocorreram, etc.
 * Este handler atualiza esse painel a cada evento.
 */

export class MetricsHandler {
  /**
   * @param {Object} options
   * @param {MetricsCollector} [options.collector] - Coletor de métricas
   */
  constructor(options = {}) {
    // 📚 CORRIGIDO: ?? em vez de ||.
    // Se alguém passar { collector: null }, usa o fallback.
    this.collector = options.collector ?? MetricsHandler.#createDefaultCollector();
  }

  /**
   * Coletor padrão in-memory (fallback).
   * 
   * 📚 private static (#) = método que só existe na classe,
   * não pode ser chamado de fora. O # é a sintaxe moderna
   * para métodos privados em JavaScript.
   */
  static #createDefaultCollector() {
    // Map = estrutura chave-valor. Como um dicionário.
    const counters = new Map();
    
    return {
      increment(name, value = 1) {
        const current = counters.get(name) || 0;
        counters.set(name, current + value);
      },
      gauge(name, value) {
        counters.set(name, value);
      },
      getMetrics() {
        // Object.fromEntries = converte Map em objeto simples
        return Object.fromEntries(counters);
      },
    };
  }

  /**
   * Processa evento e atualiza métricas.
   * @param {DomainEvent} event - Evento de domínio
   */
  handle(event) {
    // Incrementa contador do tipo de evento
    this.collector.increment(`events.${event.type}`);

    switch (event.type) {
      case "article.created":
        this.collector.increment("articles.created");
        if (event.payload.source) {
          this.collector.increment(`articles.by_source.${event.payload.source}`);
        }
        if (event.payload.doi) {
          this.collector.increment("articles.with_doi");
        }
        break;

      case "article.identifiers.added":
        this.collector.increment("articles.identifiers_added");
        for (const type of event.payload.addedTypes) {
          this.collector.increment(`identifiers.${type}.added`);
        }
        break;

      case "article.identity.changed":
        this.collector.increment("articles.identity_changed");
        break;

      case "article.metadata.enriched":
        this.collector.increment("articles.metadata_enriched");
        for (const field of event.payload.fields) {
          this.collector.increment(`enrichments.${field}`);
        }
        break;

      case "article.merged":
        this.collector.increment("articles.merged");
        // 📚 increment com valor personalizado (não só +1)
        this.collector.increment(
          "articles.merged_total", 
          event.payload.articleCount
        );
        break;

      case "cache.cleared":
        this.collector.increment("cache.cleared");
        break;

      case "error.occurred":
        this.collector.increment("errors.total");
        break;

      case "request.completed": {
        // 📚 CORRIGIDO: agrupa por família HTTP (2xx, 4xx, 5xx)
        // Math.floor(404 / 100) = 4 → "4xx"
        const status = event.payload.status || 0;
        const group = `${Math.floor(status / 100)}xx`;
        this.collector.increment(`http.${group}`);
        break;
      }
    }
  }

  getMetrics() {
    return this.collector.getMetrics();
  }
}

export default MetricsHandler;