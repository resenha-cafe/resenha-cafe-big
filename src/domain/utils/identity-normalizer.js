/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Domain Utils — Identity Normalizer
 * ============================================================
 */

// ============================================================
// IMPORTS (todos no topo)
// ============================================================

import {
  normalizePersonNameForIdentity,
  normalizeTitleForIdentity,
  identityHash,
  canonicalJson,
} from "../../utils/index.js";

import { ID_PRIORITY } from "../policies/identifier-priority.policy.js";

// ============================================================
// CONSTANTES
// ============================================================

/**
 * Collator singleton para comparação estável de strings
 * Usado para ordenação determinística de autores
 * (interno — não exportado)
 */
const COLLATOR = new Intl.Collator(undefined, {
  sensitivity: "base",
  numeric: true,
  ignorePunctuation: true,
});

/**
 * Número máximo de autores incluídos na chave de identidade
 * Autores adicionais são hasheados para evitar chaves muito longas
 */
export const DEFAULT_MAX_AUTHORS = 4;

// ============================================================
// AUTORES
// ============================================================

/**
 * Gera uma chave de autores estável para identidade
 * Usa canonicalJson para serialização determinística
 * 
 * A ordem original dos autores é ignorada — os nomes são ordenados
 * alfabeticamente para tornar a identidade independente da ordem
 * dos autores, aumentando a robustez da deduplicação entre fontes
 * que podem listar autores em ordens diferentes.
 * 
 * Suporta tanto array de strings quanto array de objetos Author
 * 
 * @param {Array<Author|string>} authors - Lista de autores
 * @param {number} maxAuthors - Número máximo de autores a incluir
 * @returns {string} Chave de autores
 * 
 * @example
 * generateAuthorKey([
 *   { name: "Silva, J." },
 *   { name: "Santos, M." }
 * ]);
 * // => '["jose silva","maria santos"]'
 * 
 * @example
 * generateAuthorKey(["John Smith", "Jane Doe"]);
 * // => '["john smith","jane doe"]'
 */
export function generateAuthorKey(authors, maxAuthors = DEFAULT_MAX_AUTHORS) {
  if (!authors || authors.length === 0) {
    return "";
  }

  // Extrai nome de string ou objeto, com fallback seguro
  const normalized = authors
    .map(a => typeof a === "string" ? a : a?.name)
    .filter(Boolean)
    .map(normalizePersonNameForIdentity)
    .filter(Boolean)
    // Ordena alfabeticamente para tornar a identidade independente da ordem dos autores
    .sort((a, b) => COLLATOR.compare(a, b));

  if (normalized.length === 0) {
    return "";
  }

  const total = normalized.length;

  // Se tem poucos autores, usa todos
  if (total <= maxAuthors) {
    return canonicalJson(normalized);
  }

  // Se tem muitos, usa os primeiros N + hash do resto
  const firstN = normalized.slice(0, maxAuthors);
  const remainder = normalized.slice(maxAuthors);
  const remainderHash = identityHash(canonicalJson(remainder));

  return `${canonicalJson(firstN)}|hash:${remainderHash}|count:${total}`;
}

// ============================================================
// PAYLOAD
// ============================================================

/**
 * Cria um payload estável para identidade
 * 
 * @param {Object} [data={}] - Dados do artigo
 * @param {string} data.title - Título do artigo
 * @param {Array} data.authors - Autores do artigo
 * @param {number} data.year - Ano de publicação
 * @param {string} data.type - Tipo do artigo
 * @param {string|Object} data.journal - Periódico (string ou objeto com name)
 * @param {number} [data.maxAuthors] - Número máximo de autores a incluir (padrão: 4)
 * @returns {Object} Payload para hash de identidade
 * 
 * @example
 * createIdentityPayload({
 *   title: "Machine Learning in Healthcare",
 *   authors: [{ name: "Silva, J." }],
 *   year: 2024,
 *   type: "journal-article",
 *   journal: "Nature Medicine"
 * });
 * // => { title: "machinelearninginhealthcare", type: "journal-article", authors: ["jose silva"], year: 2024, journal: "naturemedicine" }
 */
export function createIdentityPayload(data = {}) {
  const {
    title,
    authors,
    year,
    type,
    journal,
    maxAuthors = DEFAULT_MAX_AUTHORS,
  } = data;

  // Normaliza título para identidade
  const normalizedTitle = title ? normalizeTitleForIdentity(title) : "";

  const payload = {
    title: normalizedTitle,
    type: type || "journal-article",
  };

  // Ano (se disponível)
  if (year) {
    payload.year = year;
  }

  // Autores (se disponíveis) — propagando maxAuthors
  if (authors && authors.length > 0) {
    payload.authors = generateAuthorKey(authors, maxAuthors);
  }

  // Periódico (se disponível) — normalizado para identidade
  if (journal) {
    let journalName = typeof journal === "string" ? journal : journal.name;
    if (journalName) {
      payload.journal = normalizeTitleForIdentity(journalName);
    }
  }

  return payload;
}

// ============================================================
// HASH
// ============================================================

/**
 * Calcula o hash de identidade a partir de um payload
 * 
 * @param {Object} [payload={}] - Payload para hash
 * @returns {string} Hash de identidade (ex: "83ab09f1")
 * 
 * @example
 * calculateIdentityHash({
 *   title: "machinelearninginhealthcare",
 *   type: "journal-article",
 *   authors: ["jose silva"],
 *   year: 2024
 * });
 * // => '83ab09f1'
 */
export function calculateIdentityHash(payload = {}) {
  const stable = canonicalJson(payload);
  return identityHash(stable);
}

// ============================================================
// FUNÇÃO PRINCIPAL
// ============================================================

/**
 * Obtém um identificador de diferentes formatos de coleção
 * Suporta tanto array quanto IdentifierCollection
 * 
 * @param {Array|IdentifierCollection} identifiers - Coleção de identificadores
 * @param {string} type - Tipo do identificador
 * @returns {Identifier|null} Identificador ou null
 */
function getIdentifier(identifiers, type) {
  if (!identifiers) return null;

  // IdentifierCollection (tem método get) - verificação defensiva
  if (
    typeof identifiers.get === "function" &&
    !Array.isArray(identifiers)
  ) {
    return identifiers.get(type);
  }

  // Array
  if (Array.isArray(identifiers)) {
    return identifiers.find(i => i.type === type) || null;
  }

  return null;
}

/**
 * Gera uma chave de identidade completa para um artigo
 * 
 * O prefixo "article:" identifica o domínio e permite coexistir com
 * outros domínios no futuro (journal:, author:, institution:, etc.)
 * 
 * @param {Object} [data={}] - Dados do artigo
 * @param {string} data.title - Título do artigo
 * @param {Array} data.authors - Autores do artigo
 * @param {number} data.year - Ano de publicação
 * @param {string} data.type - Tipo do artigo
 * @param {string|Object} data.journal - Periódico
 * @param {Array|IdentifierCollection} data.identifiers - Identificadores do artigo
 * @param {number} [data.maxAuthors=4] - Número máximo de autores a incluir
 * @returns {string} Chave de identidade ou null
 * 
 * @example
 * generateIdentityKey({
 *   title: "Machine Learning in Healthcare",
 *   authors: [{ name: "Silva, J." }],
 *   year: 2024,
 *   type: "journal-article"
 * });
 * // => 'article:83ab09f1'
 */
export function generateIdentityKey(data = {}) {
  const {
    title,
    authors,
    year,
    type,
    journal,
    identifiers,
    maxAuthors = DEFAULT_MAX_AUTHORS,
  } = data;

  // 1. Tenta identificadores prioritários (usando ID_PRIORITY do domínio)
  for (const priorityType of ID_PRIORITY) {
    const id = getIdentifier(identifiers, priorityType);
    if (id && id.value) {
      return `${priorityType}:${id.value}`;
    }
  }

  // 2. Tenta título + autores + ano + tipo (hash)
  if (title && authors?.length > 0 && year) {
    const payload = createIdentityPayload({
      title,
      authors,
      year,
      type,
      journal,
      maxAuthors,
    });
    const hash = calculateIdentityHash(payload);
    return `article:${hash}`;
  }

  // 3. Tenta título + ano + tipo (fallback)
  if (title && year) {
    const payload = createIdentityPayload({
      title,
      year,
      type,
      maxAuthors,
    });
    const hash = calculateIdentityHash(payload);
    return `article:${hash}`;
  }

  // 4. Tenta título + tipo (último fallback)
  if (title) {
    const payload = createIdentityPayload({
      title,
      type,
      maxAuthors,
    });
    const hash = calculateIdentityHash(payload);
    return `article:${hash}`;
  }

  // 5. Sem identidade → null
  return null;
}

// ============================================================
// EXPORT
// ============================================================

export default {
  generateAuthorKey,
  createIdentityPayload,
  calculateIdentityHash,
  generateIdentityKey,
  DEFAULT_MAX_AUTHORS,
};