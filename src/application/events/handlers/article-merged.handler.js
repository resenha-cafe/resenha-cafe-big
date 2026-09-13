/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Application — Article Merged Handler
 * ============================================================
 *
 * 📚 AULA: Merge é quando dois artigos de fontes diferentes
 * são na verdade o mesmo artigo. Este handler limpa os
 * caches antigos e prepara o sistema para usar a versão
 * unificada.
 */

export class ArticleMergedHandler {
  /**
   * @param {Object} options
   * @param {DomainEventPublisher} options.eventPublisher - Para eventos secundários
   * @param {Cache} [options.cache] - Cache para invalidação (opicional)
   */
  constructor(options = {}) {
    this.eventPublisher = options.eventPublisher;
    this.cache = options.cache || null;
  }

  /**
   * Processa evento de artigos mesclados.
   * 
   * @param {ArticleMerged} event - Evento de merge
   */
  async handle(event) {
    const { article, doi, sources, articleCount } = event.payload;

    // Invalida cache (se houver cache configurado)
    if (this.cache) {
      await this.#invalidateCache(event.payload);
    }

    // Merge de múltiplas fontes (>2) é raro e valioso
    // O LoggingHandler já registra, aqui podemos adicionar
    // ações extras no futuro (ex: notificar equipe, reindexar)
  }

  /**
   * Invalida caches relacionados ao merge.
   * 
   * 📚 CORRIGIDO: usa generateKey para chaves padronizadas
   * e verifica se this.cache existe antes de usar.
   * 
   * @private
   * @param {Object} payload - Payload do evento
   */
  async #invalidateCache(payload) {
    // 📚 Guard clause: se não tem cache, sai imediatamente
    if (!this.cache) return;

    const { doi, sources } = payload;

    // Invalida cache do artigo por DOI
    if (doi) {
      const articleKey = this.cache.generateKey("article", { doi });
      await this.cache.delete(articleKey);
    }

    // Invalida caches relacionados às fontes originais
    if (sources) {
      for (const source of sources) {
        if (doi) {
          const sourceKey = this.cache.generateKey("article", { 
            doi, 
            source 
          });
          await this.cache.delete(sourceKey);
        }
      }
    }
  }
}

export default ArticleMergedHandler;