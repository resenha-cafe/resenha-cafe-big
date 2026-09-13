/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * HTTP — Request Validator (com ValidationError)
 * ============================================================
 */

export class ValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = "ValidationError";
    this.errors = errors;
    this.status = 400;
  }
}

export class RequestValidator {
  static validateSearch(params) {
    const errors = [];
    const data = {};

    // Query (trim antes de validar)
    const rawQuery = params.get("q") || params.get("query") || "";
    const query = rawQuery.trim();
    if (!query || query.length < 2) {
      errors.push("Query must be at least 2 characters");
    }
    data.query = query;

    // Limit
    const limitRaw = params.get("limit");
    let limit;
    if (limitRaw === null || limitRaw === "") {
      limit = 20;
    } else {
      limit = parseInt(limitRaw, 10);
      if (isNaN(limit) || limit < 1) {
        errors.push("Limit must be a positive number");
        limit = undefined;
      } else if (limit > 100) {
        errors.push("Limit must not exceed 100");
        limit = undefined;
      }
    }
    if (limit !== undefined) {
      data.limit = limit;
    }

    // Years
    const currentYear = new Date().getFullYear();
    const yearStart = parseOptionalYear(params.get("yearStart"), currentYear, errors, "yearStart");
    if (yearStart !== undefined) data.yearStart = yearStart;

    const yearEnd = parseOptionalYear(params.get("yearEnd"), currentYear, errors, "yearEnd");
    if (yearEnd !== undefined) data.yearEnd = yearEnd;

    if (yearStart !== undefined && yearEnd !== undefined && yearStart > yearEnd) {
      errors.push("yearStart must be before yearEnd");
    }

    // Language (lowercase)
    const rawLanguage = params.get("language");
    if (rawLanguage) {
      const language = rawLanguage.trim().toLowerCase();
      const validLanguages = ["pt", "en", "es", "fr", "de", "it"];
      if (!validLanguages.includes(language)) {
        errors.push(`language must be one of: ${validLanguages.join(", ")}`);
      } else {
        data.language = language;
      }
    }

    // Open Access
    data.openAccess = params.get("openAccess") === "true";

    if (errors.length > 0) {
      throw new ValidationError("Invalid search request", errors);
    }

    return data;
  }

  static validateDoi(doi) {
    if (!doi) {
      throw new ValidationError("DOI is required");
    }

    const doiRegex = /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/;
    const cleaned = doi.trim();

    if (!doiRegex.test(cleaned)) {
      throw new ValidationError("Invalid DOI format");
    }

    return cleaned;
  }
}

function parseOptionalYear(rawValue, currentYear, errors, fieldName) {
  if (rawValue === null || rawValue === "") {
    return undefined;
  }

  const year = parseInt(rawValue, 10);
  if (isNaN(year) || year === 0) {
    return undefined; // ausente
  }

  if (year < 1600 || year > currentYear) {
    errors.push(`${fieldName} must be a valid year (1600-${currentYear})`);
    return undefined;
  }

  return year;
}

export default RequestValidator;
