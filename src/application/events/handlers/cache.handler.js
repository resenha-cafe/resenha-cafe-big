/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Application — Cache Handler
 * ============================================================
 *
 * 📚 AULA: Este handler é como um "zelador" do cache.
 * Quando algo muda no sistema (artigo criado, mesclado),
 * ele limpa os dados antigos do cache para evitar
 * que informações desatualizadas sejam servidas.
 */

export class CacheHandler {
  /**
   * @param {Object} options
   * @param {Cache} options.cache - Instância do cache (obrigatório)
   * @param {boolean} [options.aggressiveInvalidation] - Modo agressivo
   */
  constructor(options = {}) {
    this.cache = options.cache;
    // 📚 ?? = "nullish coalescing". Se o valor à esquerda for
    // null ou undefined, usa o da direita. Diferente de ||,
    // que também considera 0, "", false como "falsos".
    this.aggressiveInvalidation = options.aggressiveInvalidation ?? true;

    if (!this.cache) {
      throw new Error("CacheHandler requires a Cache instance");
    }
  }

  /**
   * Processa eventos que afetam o cache.
   * 
   * 📚 async = esta função pode usar await dentro.
   * await = "pause aqui e espere esta Promise terminar".
   * Promise = uma operação que ainda não terminou (como buscar dados).
   * 
   * @param {DomainEvent} event - Evento de domínio
   */
  async handle(event) {
    switch (event.type) {
      case "article.created":
        if (this.aggressiveInvalidation) {
          await this.#invalidateRelatedCaches(event.payload);
        }
        break;

      case "article.identifiers.added":
        if (event.payload.doi) {
          // 📚 CORRIGIDO: usa generateKey para criar chave padronizada
          const key = this.cache.generateKey("article", { 
            doi: event.payload.doi 
          });
          await this.cache.delete(key);
        }
        break;

      case "article.identity.changed":
        if (event.payload.previousIdentity) {
          const key = this.cache.generateKey("article", {
            identity: event.payload.previousIdentity
          });
          await this.cache.delete(key);
        }
        break;

      case "article.metadata.enriched":
        if (event.payload.doi) {
          const key = this.cache.generateKey("article", {
            doi: event.payload.doi
          });
          await this.cache.delete(key);
        }
        break;

      case "article.merged":
        if (event.payload.doi) {
          const key = this.cache.generateKey("article", {
            doi: event.payload.doi
          });
          await this.cache.delete(key);
        }
        if (this.aggressiveInvalidation) {
          await this.#invalidateRelatedCaches(event.payload);
        }
        break;
    }
  }

  /**
   * Invalida caches relacionados a um artigo.
   * 
   * 📚 async = mesmo princípio. Toda função que usa await
   * precisa ser declarada como async.
   * 
   * @private
   */
  async #invalidateRelatedCaches(payload) {
    // Se tem título, limpa buscas relacionadas
    if (payload.title) {
      // 📚 CORRIGIDO: parâmetros corretos para generateKey(type, params)
      const searchKey = this.cache.generateKey("search", { 
        query: payload.title.substring(0, 50) 
      });
      await this.cache.delete(searchKey);
    }

    // Se tem DOI, limpa cache do artigo
    if (payload.doi) {
      const articleKey = this.cache.generateKey("article", { 
        doi: payload.doi 
      });
      await this.cache.delete(articleKey);
    }
  }
}

export default CacheHandler;