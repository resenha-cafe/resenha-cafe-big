/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Utils — Normalize Identifier
 * ============================================================
 *
 * 📚 AULA: Por que normalizar identificadores?
 * 
 * Identificadores como DOI, ISSN, ISBN, ORCID têm formatos
 * padrão, mas providers podem enviar variações:
 * 
 * - DOI: "10.1000/xyz123", "https://doi.org/10.1000/xyz123"
 * - ISSN: "1234-5678", "12345678"
 * - ISBN: "978-3-16-148410-0", "9783161484100"
 * - ORCID: "0000-0001-2345-6789", "https://orcid.org/0000-0001-2345-6789"
 * 
 * Sem normalização, o mesmo identificador em formatos diferentes
 * é tratado como identificadores diferentes.
 * 
 * 📚 Estratégia:
 * 
 * 1. Remove espaços e caracteres invisíveis
 * 2. Extrai o ID de URLs (doi.org, orcid.org, etc.)
 * 3. Aplica regras específicas por tipo (case, hífens)
 */

/**
 * Normaliza um identificador para seu formato canônico.
 * 
 * Suporta: DOI, ISSN, ISBN, ORCID, PMID, PMCID, arXiv.
 * 
 * @param {string} type - Tipo do identificador (doi, issn, isbn, etc.)
 * @param {string} value - Valor bruto do identificador
 * @returns {string|null} Identificador normalizado ou null se inválido
 * 
 * @example
 * normalizeIdentifier("doi", "https://doi.org/10.1000/xyz123")
 * // => "10.1000/xyz123"
 * 
 * @example
 * normalizeIdentifier("issn", "1234 5678")
 * // => "1234-5678"
 * 
 * @example
 * normalizeIdentifier("orcid", "https://orcid.org/0000-0001-2345-6789")
 * // => "0000-0001-2345-6789"
 */
export function normalizeIdentifier(type, value) {
  if (!type || !value || typeof value !== "string") {
    return null;
  }

  const sanitized = value.trim();

  switch (type.toLowerCase()) {
    case "doi":
      return normalizeDOI(sanitized);
    case "issn":
      return normalizeISSN(sanitized);
    case "isbn":
      return normalizeISBN(sanitized);
    case "orcid":
      return normalizeORCID(sanitized);
    case "pmid":
      return normalizePMID(sanitized);
    case "pmcid":
      return normalizePMCID(sanitized);
    case "arxiv":
      return normalizeArXiv(sanitized);
    default:
      // Para tipos desconhecidos, apenas trim
      return sanitized || null;
  }
}

/**
 * Normaliza um DOI.
 * 
 * Remove prefixos de URL (https://doi.org/) e espaços.
 * DOI é case-insensitive — normalizado para lowercase.
 * 
 * @param {string} value - Valor bruto
 * @returns {string|null} DOI normalizado ou null
 * 
 * @example
 * normalizeDOI("https://doi.org/10.1000/xyz123")  // => "10.1000/xyz123"
 * normalizeDOI("10.1000/XYZ123")                   // => "10.1000/xyz123"
 */
export function normalizeDOI(value) {
  if (!value) return null;

  let normalized = value.trim();

  // Remove prefixos de URL
  normalized = normalized.replace(/^https?:\/\/(?:dx\.)?doi\.org\/+/i, "");

  // Remove espaços e caracteres invisíveis
  normalized = normalized.replace(/\s+/g, "");

  // DOI é case-insensitive
  normalized = normalized.toLowerCase();

  // Valida formato básico: 10.XXXX/YYYY
  const doiRegex = /^10\.\d{4,9}\/[-._;()/:a-z0-9]+$/i;
  return doiRegex.test(normalized) ? normalized : null;
}

/**
 * Normaliza um ISSN.
 * 
 * Formato canônico: XXXX-XXXX (8 dígitos com hífen).
 * 
 * @param {string} value - Valor bruto
 * @returns {string|null} ISSN normalizado ou null
 * 
 * @example
 * normalizeISSN("1234-5678")  // => "1234-5678"
 * normalizeISSN("12345678")   // => "1234-5678"
 * normalizeISSN("1234 5678")  // => "1234-5678"
 */
export function normalizeISSN(value) {
  if (!value) return null;

  // Remove tudo que não for dígito ou X
  const cleaned = value.replace(/[^0-9X]/gi, "").toUpperCase();

  if (cleaned.length !== 8) return null;

  // Insere hífen no meio
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
}

/**
 * Normaliza um ISBN.
 * 
 * Suporta ISBN-10 e ISBN-13.
 * Formato canônico: hífens nos lugares corretos.
 * 
 * @param {string} value - Valor bruto
 * @returns {string|null} ISBN normalizado ou null
 * 
 * @example
 * normalizeISBN("978-3-16-148410-0")  // => "978-3-16-148410-0"
 * normalizeISBN("9783161484100")       // => "978-3-16-148410-0"
 */
export function normalizeISBN(value) {
  if (!value) return null;

  // Remove tudo que não for dígito ou X
  const cleaned = value.replace(/[^0-9X]/gi, "").toUpperCase();

  if (cleaned.length === 10) {
    // ISBN-10: X-XXX-XXXXX-X
    return `${cleaned[0]}-${cleaned.slice(1, 4)}-${cleaned.slice(4, 9)}-${cleaned[9]}`;
  }

  if (cleaned.length === 13) {
    // ISBN-13: XXX-X-XX-XXXXXX-X
    return `${cleaned.slice(0, 3)}-${cleaned[3]}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 12)}-${cleaned[12]}`;
  }

  return null;
}

/**
 * Normaliza um ORCID.
 * 
 * Extrai o ID de URLs e garante o formato com hífens.
 * 
 * @param {string} value - Valor bruto
 * @returns {string|null} ORCID normalizado ou null
 * 
 * @example
 * normalizeORCID("https://orcid.org/0000-0001-2345-6789")  // => "0000-0001-2345-6789"
 * normalizeORCID("0000-0001-2345-6789")                     // => "0000-0001-2345-6789"
 */
export function normalizeORCID(value) {
  if (!value) return null;

  let normalized = value.trim();

  // Remove prefixos de URL
  normalized = normalized.replace(/^https?:\/\/orcid\.org\/+/i, "");

  // Remove espaços
  normalized = normalized.replace(/\s+/g, "");

  // Tenta encontrar o padrão ORCID
  const match = normalized.match(/(\d{4}-\d{4}-\d{4}-\d{3}[\dX])/i);
  if (match) return match[1].toUpperCase();

  // Tenta sem hífens
  const matchNoHyphen = normalized.match(/(\d{4})(\d{4})(\d{4})(\d{3}[\dX])/i);
  if (matchNoHyphen) {
    return `${matchNoHyphen[1]}-${matchNoHyphen[2]}-${matchNoHyphen[3]}-${matchNoHyphen[4]}`.toUpperCase();
  }

  return null;
}

/**
 * Normaliza um PMID (PubMed ID).
 * 
 * PMID é um número inteiro de 1 a 8 dígitos.
 * 
 * @param {string} value - Valor bruto
 * @returns {string|null} PMID normalizado ou null
 * 
 * @example
 * normalizePMID("12345678")   // => "12345678"
 * normalizePMID("PMID: 1234") // => "1234"
 */
export function normalizePMID(value) {
  if (!value) return null;

  // Remove prefixo "PMID:" e espaços
  const cleaned = value.replace(/^PMID:?\s*/i, "").replace(/\s+/g, "");

  // Deve ser apenas dígitos
  if (!/^\d{1,8}$/.test(cleaned)) return null;

  return cleaned;
}

/**
 * Normaliza um PMCID (PubMed Central ID).
 * 
 * PMCID tem o formato PMC seguido de dígitos.
 * 
 * @param {string} value - Valor bruto
 * @returns {string|null} PMCID normalizado ou null
 * 
 * @example
 * normalizePMCID("PMC1234567")      // => "PMC1234567"
 * normalizePMCID("pmc1234567")      // => "PMC1234567"
 */
export function normalizePMCID(value) {
  if (!value) return null;

  // Remove espaços
  const cleaned = value.replace(/\s+/g, "");

  // Deve começar com PMC (case-insensitive) seguido de dígitos
  const match = cleaned.match(/^(PMC)(\d+)$/i);
  if (!match) return null;

  return `PMC${match[2]}`;
}

/**
 * Normaliza um arXiv ID.
 * 
 * Formato canônico: YYMM.NNNNN (nova) ou arxiv:YYMMNNNN (antiga).
 * 
 * @param {string} value - Valor bruto
 * @returns {string|null} arXiv ID normalizado ou null
 * 
 * @example
 * normalizeArXiv("2101.12345")         // => "2101.12345"
 * normalizeArXiv("arxiv:2101.12345v2") // => "2101.12345"
 */
export function normalizeArXiv(value) {
  if (!value) return null;

  let normalized = value.trim();

  // Remove prefixo "arxiv:"
  normalized = normalized.replace(/^arxiv:?\s*/i, "");

  // Remove sufixo de versão (v1, v2, etc.)
  normalized = normalized.replace(/v\d+$/i, "");

  // Remove espaços
  normalized = normalized.replace(/\s+/g, "");

  // Formato novo: YYMM.NNNNN
  if (/^\d{4}\.\d{4,5}$/.test(normalized)) {
    return normalized;
  }

  // Formato antigo: YYMMNNNN → YYMM.NNNN
  const oldFormat = normalized.match(/^(\d{4})(\d{4,5})$/);
  if (oldFormat) {
    return `${oldFormat[1]}.${oldFormat[2]}`;
  }

  return null;
}

export default normalizeIdentifier;