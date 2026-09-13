/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Utils — Barrel Export
 * ============================================================
 *
 * 📚 AULA: O barrel export dos utilitários.
 * 
 * Centraliza todas as funções utilitárias em um único ponto
 * de importação. Qualquer módulo que precise de funções
 * utilitárias importa daqui.
 * 
 * 📚 Uso:
 * import { canonicalJson, deepFreeze, identityHash } from "../utils";
 */

// ============================================================
// CORE UTILS
// ============================================================
export { canonicalJson } from "./canonical-json.js";
export { deepFreeze } from "./deep-freeze.js";
export { identityHash } from "./hash.js";

// ============================================================
// TIME UTILS
// ============================================================
export {
  now,
  iso,
  formatDuration,
  isValidDate,
  extractYear,
  today,
} from "./time.js";

// ============================================================
// OBJECT UTILS
// ============================================================
export { isPlainObject } from "./is-plain-object.js";
export { pick, omit } from "./pick.js";

// ============================================================
// NORMALIZE UTILS
// ============================================================
export {
  normalizeText,
  normalizeTextPreserveCase,
  normalizeForIdentity,
} from "./normalize-text.js";

export {
  normalizePersonNameForIdentity,
  normalizeTitleForIdentity,
} from "./normalize-author.js";

export {
  normalizeIdentifier,
  normalizeDOI,
  normalizeISSN,
  normalizeISBN,
  normalizeORCID,
  normalizePMID,
  normalizePMCID,
  normalizeArXiv,
} from "./normalize-identifier.js";

export { normalizeDate, normalizeYear } from "./normalize-date.js";

export { normalizeTitleForIdentity as normalizeTitle } from "./normalize-author.js";