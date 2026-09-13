/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Enrichers — Barrel Export
 * ============================================================
 *
 * 📚 Ponto único de importação para todos os enrichers.
 */

export { BaseEnricher } from "./base.enricher.js";
export { PDFEnricher } from "./pdf.enricher.js";
export { CitationsEnricher } from "./citations.enricher.js";
export { EnrichmentPipeline } from "./enrichment-pipeline.js";

export { default as BaseEnricherDefault } from "./base.enricher.js";
export { default as PDFEnricherDefault } from "./pdf.enricher.js";
export { default as CitationsEnricherDefault } from "./citations.enricher.js";
export { default as EnrichmentPipelineDefault } from "./enrichment-pipeline.js";

/**
 * Cria a lista padrão de enrichers.
 * 
 * @param {Object} [options] - Opções compartilhadas
 * @returns {Array<BaseEnricher>} Lista de enrichers prontos
 */
export function createDefaultEnrichers(options = {}) {
  return [
    new PDFEnricher(options),
    new CitationsEnricher(options),
  ];
}

/**
 * Cria um EnrichmentPipeline com os enrichers padrão.
 * 
 * 📚 Atalho para uso rápido:
 * const pipeline = createDefaultPipeline({ adapter, logger });
 * const result = await pipeline.enrichOne(article);
 * 
 * @param {Object} [options] - Opções compartilhadas
 * @returns {EnrichmentPipeline} Pipeline pronto
 */
export function createDefaultPipeline(options = {}) {
  return new EnrichmentPipeline({
    enrichers: createDefaultEnrichers(options),
    logger: options.logger,
  });
}