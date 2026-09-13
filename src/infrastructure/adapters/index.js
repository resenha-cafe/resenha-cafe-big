/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Infrastructure — Adapters Barrel Export
 * ============================================================
 *
 * 📚 AULA: Barrel Export dos Adapters.
 * 
 * Este arquivo é o ponto único de importação para todos
 * os adapters de providers. Qualquer módulo que precise
 * de um adapter (OpenAlex, CrossRef, etc.) importa daqui.
 * 
 * 📚 Uso:
 * import { BaseAdapter, OpenAlexAdapter } from "../infrastructure/adapters";
 * 
 * 📚 Adapters disponíveis:
 * - BaseAdapter (classe abstrata)
 * - OpenAlexAdapter (⬜ a implementar)
 * - CrossRefAdapter (⬜ a implementar)
 * - SemanticScholarAdapter (⬜ a implementar)
 * - EuropePMCAdapter (⬜ a implementar)
 * - SciELOAdapter (⬜ a implementar)
 * - COREAdapter (⬜ a implementar)
 */

// ============================================================
// BASE (classe abstrata)
// ============================================================
export { BaseAdapter } from "./base.js";

// ============================================================
// PROVIDERS (a implementar)
// ============================================================
// export { OpenAlexAdapter } from "./openalex.adapter.js";
// export { CrossRefAdapter } from "./crossref.adapter.js";
// export { SemanticScholarAdapter } from "./semantic-scholar.adapter.js";
// export { EuropePMCAdapter } from "./europepmc.adapter.js";
// export { SciELOAdapter } from "./scielo.adapter.js";
// export { COREAdapter } from "./core.adapter.js";