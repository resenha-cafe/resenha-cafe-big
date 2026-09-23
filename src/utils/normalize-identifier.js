/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Utils — Normalize Identifier
 * ============================================================
 *
 * Responsabilidade:
 * - transformar identificadores externos em representação canônica;
 * - remover prefixos, URLs, espaços e formatações externas;
 * - NÃO determinar se o identificador é semanticamente válido.
 *
 * A validação fica em validate-identifier.js.
 * ============================================================
 */

/**
 * Normaliza um identificador para seu formato canônico.
 *
 * Suporta:
 * - DOI
 * - ISSN
 * - ISBN
 * - ORCID
 * - PMID
 * - PMCID
 * - arXiv
 *
 * Outros tipos conhecidos são preservados com trim, permitindo que
 * identificadores específicos do domínio continuem funcionando sem
 * regras artificiais de formatação.
 *
 * @param {string} type
 * @param {string} value
 * @returns {string|null}
 */
export function normalizeIdentifier(type, value) {
  if (
    typeof type !== "string" ||
    typeof value !== "string"
  ) {
    return null;
  }

  const normalizedType = type.trim().toLowerCase();

  if (!normalizedType) {
    return null;
  }

  const sanitized = removeInvisibleCharacters(value).trim();

  if (!sanitized) {
    return null;
  }

  switch (normalizedType) {
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
      return sanitized;
  }
}

/**
 * Remove caracteres invisíveis que podem contaminar identidade.
 *
 * @param {string} value
 * @returns {string}
 */
function removeInvisibleCharacters(value) {
  return value
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
    .replace(/\uFEFF/g, "");
}

/**
 * ============================================================
 * DOI
 * ============================================================
 */

/**
 * Normaliza DOI.
 *
 * Canonicalização:
 * - remove https://doi.org/
 * - remove http://doi.org/
 * - remove https://dx.doi.org/
 * - remove http://dx.doi.org/
 * - remove espaços
 * - converte para lowercase
 *
 * @param {string} value
 * @returns {string|null}
 */
export function normalizeDOI(value) {
  if (typeof value !== "string") {
    return null;
  }

  let normalized = value.trim();

  normalized = normalized.replace(
    /^https?:\/\/(?:dx\.)?doi\.org\//i,
    ""
  );

  normalized = normalized.replace(/^doi:\s*/i, "");

  normalized = normalized.replace(/\s+/g, "");

  normalized = normalized.toLowerCase();

  /**
   * DOI:
   * 10.
   * seguido por registrant code de 4–9 dígitos
   * /
   * seguido por suffix
   *
   * A validação detalhada continua pertencendo ao validator.
   */
  const doiRegex =
    /^10\.\d{4,9}\/[-._;()/:a-z0-9]+$/i;

  return doiRegex.test(normalized)
    ? normalized
    : null;
}

/**
 * ============================================================
 * ISSN
 * ============================================================
 */

/**
 * Normaliza ISSN.
 *
 * Exemplos:
 * 12345678  → 1234-5678
 * 1234 5678 → 1234-5678
 * 1234-5678 → 1234-5678
 *
 * @param {string} value
 * @returns {string|null}
 */
export function normalizeISSN(value) {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value
    .replace(/[^0-9X]/gi, "")
    .toUpperCase();

  if (cleaned.length !== 8) {
    return null;
  }

  return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
}

/**
 * ============================================================
 * ISBN
 * ============================================================
 */

/**
 * Normaliza ISBN.
 *
 * IMPORTANTE:
 * Não tenta reconstruir hífens editoriais.
 *
 * ISBN possui diferentes regras de agrupamento dependendo
 * do grupo linguístico/registrante. Portanto, a representação
 * canônica para identidade será:
 *
 * ISBN-10 → 10 caracteres sem formatação
 * ISBN-13 → 13 caracteres sem formatação
 *
 * @param {string} value
 * @returns {string|null}
 */
export function normalizeISBN(value) {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value
    .replace(/[^0-9X]/gi, "")
    .toUpperCase();

  if (cleaned.length !== 10 && cleaned.length !== 13) {
    return null;
  }

  return cleaned;
}

/**
 * ============================================================
 * ORCID
 * ============================================================
 */

/**
 * Normaliza ORCID.
 *
 * Aceita:
 * - 0000-0001-2345-6789
 * - 0000000123456789
 * - https://orcid.org/0000-0001-2345-6789
 *
 * @param {string} value
 * @returns {string|null}
 */
export function normalizeORCID(value) {
  if (typeof value !== "string") {
    return null;
  }

  let normalized = value.trim();

  normalized = normalized.replace(
    /^https?:\/\/(?:www\.)?orcid\.org\//i,
    ""
  );

  normalized = normalized.replace(
    /^orcid:\s*/i,
    ""
  );

  normalized = normalized.replace(/\s+/g, "");

  const withHyphens =
    normalized.match(
      /^(\d{4})-(\d{4})-(\d{4})-(\d{3}[\dX])$/i
    );

  if (withHyphens) {
    return withHyphens[0].toUpperCase();
  }

  const withoutHyphens =
    normalized.match(
      /^(\d{4})(\d{4})(\d{4})(\d{3}[\dX])$/i
    );

  if (!withoutHyphens) {
    return null;
  }

  return [
    withoutHyphens[1],
    withoutHyphens[2],
    withoutHyphens[3],
    withoutHyphens[4],
  ]
    .join("-")
    .toUpperCase();
}

/**
 * ============================================================
 * PMID
 * ============================================================
 */

/**
 * Normaliza PMID.
 *
 * Não impõe limite artificial de quantidade de dígitos.
 *
 * @param {string} value
 * @returns {string|null}
 */
export function normalizePMID(value) {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value
    .replace(/^pmid:\s*/i, "")
    .replace(/\s+/g, "");

  if (!/^\d+$/.test(cleaned)) {
    return null;
  }

  return cleaned;
}

/**
 * ============================================================
 * PMCID
 * ============================================================
 */

/**
 * Normaliza PMCID.
 *
 * @param {string} value
 * @returns {string|null}
 */
export function normalizePMCID(value) {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value
    .replace(/^https?:\/\/(?:www\.)?ncbi\.nlm\.nih\.gov\/pmc\/articles\//i, "")
    .replace(/\s+/g, "");

  const match = cleaned.match(
    /^pmc(\d+)$/i
  );

  if (!match) {
    return null;
  }

  return `PMC${match[1]}`;
}

/**
 * ============================================================
 * arXiv
 * ============================================================
 */

/**
 * Normaliza arXiv.
 *
 * Remove:
 * - arxiv:
 * - arXiv:
 * - versão v1/v2/v3...
 *
 * Exemplos:
 *
 * 2101.12345
 * arxiv:2101.12345
 * 2101.12345v2
 * arxiv:2101.12345v3
 *
 * tornam-se:
 *
 * 2101.12345
 *
 * @param {string} value
 * @returns {string|null}
 */
export function normalizeArXiv(value) {
  if (typeof value !== "string") {
    return null;
  }

  let normalized = value.trim();

  normalized = normalized.replace(
    /^arxiv:\s*/i,
    ""
  );

  normalized = normalized.replace(
    /v\d+$/i,
    ""
  );

  normalized = normalized.replace(
    /\s+/g,
    ""
  );

  /**
   * Formato novo:
   * YYMM.NNNNN
   */
  if (/^\d{4}\.\d{4,5}$/.test(normalized)) {
    return normalized;
  }

  /**
   * Formato antigo:
   * YYMMNNNN
   */
  const oldFormat = normalized.match(
    /^(\d{4})(\d{4,5})$/
  );

  if (oldFormat) {
    return `${oldFormat[1]}.${oldFormat[2]}`;
  }

  return null;
}

export default normalizeIdentifier;