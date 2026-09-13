/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Domain Events
 * ============================================================
 *
 * Eventos de domínio imutáveis.
 * 
 * ⚠️ Os eventos NÃO são emitidos pelas entidades.
 * A emissão é responsabilidade dos use cases e do orchestrator,
 * mantendo as entidades puras e focadas em regras de negócio.
 * 
 * 📚 AULA: Eventos de domínio são "fatos consumados".
 * Algo aconteceu no passado e não pode ser alterado.
 * Por isso são congelados (Object.freeze).
 * 
 * 📚 NOVO: toJSON() agora é "serialization-safe".
 * Se o payload contiver um Article (ou qualquer entidade
 * com toPlainObject), ele é convertido automaticamente
 * ao serializar para JSON. Isso prepara o sistema para
 * Kafka, filas e event sourcing sem alterar os handlers.
 */

export class DomainEvent {
  /**
   * @param {string} type - Tipo do evento (ex: "article.created")
   * @param {Object} payload - Dados do evento
   * @param {string} [occurredAt] - Quando aconteceu (ISO 8601)
   */
  constructor(type, payload = {}, occurredAt = new Date().toISOString()) {
    this.type = type;

    // 📚 Object.freeze = "congela" o objeto. Ninguém pode adicionar,
    // remover ou modificar propriedades depois de criado.
    this.payload = Object.freeze({ ...payload });
    this.occurredAt = occurredAt;

    Object.freeze(this);
  }

  /**
   * Serializa o evento para JSON.
   * 
   * 📚 NOVO: "Serialization-safe".
   * 
   * Quando o payload contém entidades do domínio (Article, Author, etc.),
   * este método as converte automaticamente para objetos planos.
   * 
   * Isso é importante porque:
   * 
   * 1. JSON.stringify(event) chama este método automaticamente.
   *    É uma convenção do JavaScript: se um objeto tem toJSON(),
   *    o JSON.stringify usa o retorno dele em vez do objeto cru.
   * 
   * 2. Sem isso, JSON.stringify tentaria serializar o Article
   *    inteiro, incluindo getters, métodos congelados, etc.
   * 
   * 3. Com isso, o código está pronto para:
   *    - Kafka (que serializa mensagens como JSON)
   *    - Filas (SQS, RabbitMQ, BullMQ)
   *    - Event sourcing (persistir eventos em banco)
   *    - Logs estruturados (CloudWatch, Datadog)
   * 
   * 📚 Como funciona a detecção:
   * 
   * Verificamos se cada valor do payload tem o método toPlainObject.
   * Todas as nossas entidades (Article, Author, Journal, Publisher,
   * License) e value objects (IdentifierCollection) têm esse método.
   * 
   * Se tiver, usamos ele para obter uma versão "plana" (objeto simples,
   * sem classes, sem getters, sem métodos).
   * 
   * 📚 Exemplo:
   * 
   * Evento com Article:
   *   payload.article → instância de Article
   *   payload.article.toPlainObject() → { doi: "10.xxx", title: "...", ... }
   * 
   * Evento simples (sem entidades):
   *   payload.message → "cache limpo"
   *   (não tem toPlainObject, permanece como está)
   * 
   * @returns {Object} Objeto pronto para JSON
   */
  toJSON() {
    // 📚 Cria uma cópia do payload para não modificar o original
    const payload = {};

    // 📚 Percorre cada campo do payload
    for (const [key, value] of Object.entries(this.payload)) {
      // 📚 Se o valor tem toPlainObject, usa ele
      // Isso cobre: Article, Author, Journal, Publisher, License,
      // IdentifierCollection, Identifier, Identity
      if (value && typeof value.toPlainObject === "function") {
        payload[key] = value.toPlainObject();
      }
      // 📚 Se é um array, verifica cada item
      else if (Array.isArray(value)) {
        payload[key] = value.map(item => {
          // Cada item do array pode ser uma entidade ou valor simples
          if (item && typeof item.toPlainObject === "function") {
            return item.toPlainObject();
          }
          return item;
        });
      }
      // 📚 Se é um valor simples (string, número, boolean, null),
      // mantém como está
      else {
        payload[key] = value;
      }
    }

    return {
      type: this.type,
      payload,
      occurredAt: this.occurredAt,
    };
  }
}

// ============================================================
// ARTICLE EVENTS
// ============================================================

/**
 * Emitido quando um artigo é criado.
 * 
 * 📚 Inclui o artigo completo no payload.
 * O Article é imutável (deepFreeze), então é seguro compartilhar.
 * Ao serializar (JSON.stringify), toJSON() converte o Article
 * automaticamente via article.toPlainObject().
 */
export class ArticleCreated extends DomainEvent {
  /**
   * @param {Article} article - Artigo criado
   */
  constructor(article) {
    super("article.created", {
      identity: article.identity?.key || null,
      doi: article.doi,
      title: article.title,
      year: article.year,
      source: article.source,
      // 📚 O Article é incluído diretamente.
      // Handlers recebem a instância real.
      // JSON.stringify recebe o objeto plano (via toJSON).
      article,
    });
  }
}

/**
 * Emitido quando identificadores são adicionados a um artigo.
 */
export class ArticleIdentifiersAdded extends DomainEvent {
  /**
   * @param {Article} article - Artigo modificado
   * @param {Array<string>|Set<string>|Iterable<string>} addedTypes - Tipos adicionados
   */
  constructor(article, addedTypes = []) {
    super("article.identifiers.added", {
      identity: article.identity?.key || null,
      doi: article.doi,
      addedTypes: Array.from(addedTypes),
      article,
    });
  }
}

/**
 * Emitido quando a identidade do artigo muda.
 */
export class ArticleIdentityChanged extends DomainEvent {
  /**
   * @param {Identity|string|null} previousIdentity - Identidade anterior
   * @param {Article} article - Artigo com a nova identidade
   */
  constructor(previousIdentity, article) {
    const previousKey = previousIdentity?.key 
      || (typeof previousIdentity === "string" ? previousIdentity : null);

    super("article.identity.changed", {
      previousIdentity: previousKey,
      identity: article.identity?.key || null,
      doi: article.doi,
      title: article.title,
      article,
    });
  }
}

/**
 * Emitido quando metadados relevantes são enriquecidos.
 */
export class ArticleMetadataEnriched extends DomainEvent {
  /**
   * @param {Article} article - Artigo enriquecido
   * @param {Array<string>|Set<string>|Iterable<string>} fields - Campos enriquecidos
   */
  constructor(article, fields = []) {
    super("article.metadata.enriched", {
      identity: article.identity?.key || null,
      doi: article.doi,
      fields: Array.from(fields),
      article,
    });
  }
}

/**
 * Emitido quando dois ou mais artigos são mesclados.
 */
export class ArticleMerged extends DomainEvent {
  /**
   * @param {Article} merged - Artigo resultante do merge
   * @param {Array<string>|Set<string>|Iterable<string>} sources - Providers de origem
   * @param {number} articleCount - Quantos artigos foram mesclados
   */
  constructor(merged, sources = [], articleCount = 2) {
    super("article.merged", {
      identity: merged.identity?.key || null,
      doi: merged.doi,
      title: merged.title,
      sources: Array.from(sources),
      articleCount,
      article: merged,
    });
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  DomainEvent,
  ArticleCreated,
  ArticleIdentifiersAdded,
  ArticleIdentityChanged,
  ArticleMetadataEnriched,
  ArticleMerged,
};