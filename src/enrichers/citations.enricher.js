/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Enrichers — Citations Enricher
 * ============================================================
 *
 * 📚 Enricher responsável por obter a contagem de citações.
 * 
 * Fonte de busca: OpenAlex
 * URL: https://api.openalex.org
 * 
 * feat(enrichers): add citations enricher using base fetch resolution
 */

import { BaseEnricher } from "./base.enricher.js";

export class CitationsEnricher extends BaseEnricher {
  /**
   * @param {Object} options - Configuração
   * @param {Object} [options.adapter] - Adapter com _fetch ou fetch
   * @param {boolean} [options.enabled=true] - Se está habilitado
   * @param {Object|null} [options.logger] - Logger (null = sem logging)
   */
  constructor(options = {}) {
    super({
      name: "citations",
      enabled: options.enabled ?? true,
      logger: options.logger,
    });

    this.adapter = options.adapter || null;
  }

  /**
   * Verifica se o artigo pode ser enriquecido.
   */
  canEnrich(article) {
    if (!super.canEnrich(article)) return false;
    return !!article.doi;
  }

  /**
   * Busca a contagem de citações do artigo.
   */
  async enrich(article, context = {}) {
    if (!this.canEnrich(article)) return article;

    // Usa o método protegido do BaseEnricher
    const fetchMethod = this._getFetchMethod(this.adapter);

    if (!fetchMethod) {
      this.logger?.warn?.("[CitationsEnricher] Adapter has no fetch method");
      return null;
    }

    try {
      const doi = article.doi;
      const url = this.#buildOpenAlexUrl(doi);

      this.logger?.debug?.(`[CitationsEnricher] Looking for citations: ${doi}`);

      const data = await fetchMethod(url, {
        signal: context.signal,
      });

      // Validação estrita: cited_by_count deve ser número finito
      const citations =
        typeof data?.cited_by_count === "number" && Number.isFinite(data.cited_by_count)
          ? data.cited_by_count
          : null;

      // Normaliza o valor atual: número finito ou 0
      const currentCitations =
        typeof article.citations === "number" && Number.isFinite(article.citations)
          ? article.citations
          : 0;

      if (citations !== null && citations > currentCitations) {
        this.logger?.info?.(`[CitationsEnricher] Found ${citations} citations for ${doi}`);

        return {
          citations,
        };
      }

      this.logger?.info?.(`[CitationsEnricher] No newer citations found for ${doi}`);
      return null;
    } catch (error) {
      this.logger?.warn?.("[CitationsEnricher] Error finding citations", {
        doi: article.doi,
        error: error?.message || String(error),
      });
      return null;
    }
  }

  // ============================================================
  // PRIVADO
  // ============================================================

  /**
   * Constrói a URL da API OpenAlex para lookup de DOI.
   *
   * Formato:
   * https://api.openalex.org/works/doi:{DOI}
   *
   * @private
   */
  #buildOpenAlexUrl(doi) {
    const base = "https://api.openalex.org";
    const encodedDoi = encodeURIComponent(`doi:${doi}`);

    return `${base}/works/${encodedDoi}`;
  }
}

export default CitationsEnricher;