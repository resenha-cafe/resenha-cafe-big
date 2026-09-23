export function isValidDoi(doi) {
  if (typeof doi !== 'string') return false;
  return /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/.test(doi.trim());
}
export default { isValidDoi };
