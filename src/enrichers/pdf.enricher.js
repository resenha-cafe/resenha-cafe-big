/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Enrichers — PDF Enricher
 * ============================================================
 *
 * 📚 Enricher responsável por buscar o PDF de um artigo.
 * 
 * Fonte de busca: Unpaywall
 * URL: https://api.unpaywall.org/v2
 * 
 * feat(enrichers): add pdf enricher using base fetch resolution
 */

import { BaseEnricher } from "./base.enricher.js";

export class PDFEnricher extends BaseEnricher {
  /**
   * @param {Object} options - Configuração
   * @param {Object} [options.adapter] - Adapter com _fetch ou fetch
   * @param {string} [options.email] - Email para Unpaywall (polite pool)
   * @param {boolean} [options.enabled=true] - Se está habilitado
   * @param {Object|null} [options.logger] - Logger (null = sem logging)
   */
  constructor(options = {}) {
    super({
      name: "pdf",
      enabled: options.enabled ?? true,
      logger: options.logger,
    });

    this.adapter = options.adapter || null;
    this.email = options.email || null;
  }

  /**
   * Verifica se o artigo pode ser enriquecido.
   */
  canEnrich(article) {
    if (!super.canEnrich(article)) return false;
    if (article.url || article.pdfUrl) return false;
    return !!article.doi;
  }

  /**
   * Busca o PDF do artigo.
   */
  async enrich(article, context = {}) {
    if (!this.canEnrich(article)) return article;

    // Usa o método protegido do BaseEnricher
    const fetchMethod = this._getFetchMethod(this.adapter);

    if (!fetchMethod) {
      this.logger?.warn?.("[PDFEnricher] Adapter has no fetch method");
      return null;
    }

    try {
      const doi = article.doi;
      const url = this.#buildUnpaywallUrl(doi);

      this.logger?.debug?.(`[PDFEnricher] Looking for PDF: ${doi}`);

      const data = await fetchMethod(url, {
        signal: context.signal,
      });

      const pdfUrl = data?.best_oa_location?.url_for_pdf
        || data?.best_oa_location?.url
        || null;

      if (pdfUrl) {
        this.logger?.info?.(`[PDFEnricher] PDF found for ${doi}`);

        return {
          url: pdfUrl,
          openAccess: true,
        };
      }

      this.logger?.info?.(`[PDFEnricher] No PDF found for ${doi}`);
      return null;
    } catch (error) {
      this.logger?.warn?.("[PDFEnricher] Error finding PDF", {
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
   * Constrói a URL da API Unpaywall.
   *
   * Formato:
   * https://api.unpaywall.org/v2/{DOI}?email={email}
   *
   * @private
   */
  #buildUnpaywallUrl(doi) {
    const base = "https://api.unpaywall.org/v2";
    const encodedDoi = encodeURIComponent(doi);
    const emailParam = this.email
      ? `?email=${encodeURIComponent(this.email)}`
      : "";

    return `${base}/${encodedDoi}${emailParam}`;
  }
}

export default PDFEnricher;