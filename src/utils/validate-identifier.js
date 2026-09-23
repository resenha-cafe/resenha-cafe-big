export function validateIdentifier(type, value) {
  if (
    typeof type !== "string" ||
    typeof value !== "string"
  ) {
    return false;
  }

  const normalizedType = type.trim().toLowerCase();
  const normalizedValue = value.trim();

  if (!normalizedType || !normalizedValue) {
    return false;
  }

  switch (normalizedType) {
    case "doi":
      return validateDOI(normalizedValue);

    case "issn":
      return validateISSN(normalizedValue);

    case "isbn":
      return validateISBN(normalizedValue);

    case "orcid":
      return validateORCID(normalizedValue);

    case "pmid":
      return /^\d+$/.test(normalizedValue);

    case "pmcid":
      return /^PMC\d+$/i.test(normalizedValue);

    case "arxiv":
      return validateArXiv(normalizedValue);

    default:
      /**
       * Tipos como OpenAlex, Semantic, SSRN, HAL,
       * Scopus e WOS ainda possuem validação estrutural
       * específica a ser evoluída.
       *
       * Para manter compatibilidade, qualquer string
       * não vazia possui identidade.
       */
      return true;
  }
}

/**
 * DOI
 */
function validateDOI(value) {
  return /^10\.\d{4,9}\/[-._;()/:a-z0-9]+$/i.test(value);
}

/**
 * ISSN + checksum MOD 11
 */
function validateISSN(value) {
  const normalized = value.replace(/-/g, "").toUpperCase();

  if (!/^\d{7}[\dX]$/.test(normalized)) {
    return false;
  }

  const digits = normalized.split("").map(char =>
    char === "X" ? 10 : Number(char)
  );

  const weightedSum =
    digits.reduce(
      (sum, digit, index) =>
        sum + digit * (8 - index),
      0
    );

  return weightedSum % 11 === 0;
}

/**
 * ISBN-10
 */
function validateISBN(value) {
  const normalized = value
    .replace(/-/g, "")
    .replace(/\s+/g, "")
    .toUpperCase();

  if (/^\d{9}[\dX]$/.test(normalized)) {
    return validateISBN10(normalized);
  }

  if (/^\d{13}$/.test(normalized)) {
    return validateISBN13(normalized);
  }

  return false;
}

function validateISBN10(value) {
  let sum = 0;

  for (let i = 0; i < 10; i += 1) {
    const digit =
      value[i] === "X"
        ? 10
        : Number(value[i]);

    sum += digit * (10 - i);
  }

  return sum % 11 === 0;
}

function validateISBN13(value) {
  let sum = 0;

  for (let i = 0; i < 13; i += 1) {
    const digit = Number(value[i]);

    sum += digit * (i % 2 === 0 ? 1 : 3);
  }

  return sum % 10 === 0;
}

/**
 * ORCID + checksum MOD 11-2
 */
function validateORCID(value) {
  const normalized = value
    .replace(/-/g, "")
    .toUpperCase();

  if (!/^\d{15}[\dX]$/.test(normalized)) {
    return false;
  }

  let total = 0;

  for (let i = 0; i < 15; i += 1) {
    total = (total + Number(normalized[i])) * 2;
  }

  const remainder = total % 11;
  const result = (12 - remainder) % 11;

  const checkDigit =
    result === 10
      ? "X"
      : String(result);

  return normalized[15] === checkDigit;
}

/**
 * arXiv
 */
function validateArXiv(value) {
  return /^\d{4}\.\d{4,5}$/.test(value);
}

export default validateIdentifier;