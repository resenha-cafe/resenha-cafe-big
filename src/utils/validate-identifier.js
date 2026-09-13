export function validateIdentifier(type, value) {
  if (!type || !value) return false;
  if (typeof value !== "string") return false;
  if (value.trim().length === 0) return false;

  // Validação básica por tipo
  var normalized = value.trim().toLowerCase();

  switch (type.toLowerCase()) {
    case "doi":
      return /^10\.\d{4,9}\//.test(normalized);
    case "issn":
      return /^\d{4}-?\d{3}[\dX]$/i.test(normalized);
    case "orcid":
      return /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i.test(normalized);
    case "pmid":
      return /^\d{1,8}$/.test(normalized);
    case "pmcid":
      return /^pmc\d+$/i.test(normalized);
    default:
      return true;
  }
}

export default validateIdentifier;