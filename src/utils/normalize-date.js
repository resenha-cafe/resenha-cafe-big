/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Utils — Normalize Date
 * ============================================================
 *
 * 📚 AULA: Por que normalizar datas?
 * 
 * Providers enviam datas em formatos diferentes:
 * - "2024-01-15" (ISO)
 * - "2024" (apenas ano)
 * - "2024-01" (ano-mês)
 * - "15/01/2024" (formato brasileiro)
 * - "01/15/2024" (formato americano)
 * - "January 15, 2024" (texto em inglês)
 * - "2024-01-15T00:00:00Z" (ISO com hora)
 * 
 * Sem normalização, não conseguimos ordenar, filtrar
 * ou comparar datas de forma consistente.
 * 
 * 📚 Estratégia:
 * 
 * 1. Tenta parse como ISO 8601 (formato universal)
 * 2. Para formatos ambíguos (DD/MM vs MM/DD), usa heurística:
 *    - Se primeiro número > 12, é DD/MM/YYYY
 *    - Se segundo número > 12, é MM/DD/YYYY
 *    - Se ambos ≤ 12, assume DD/MM/YYYY
 * 3. Retorna sempre no formato ISO: YYYY-MM-DD
 */

/**
 * Normaliza uma data para o formato ISO 8601 (YYYY-MM-DD).
 * 
 * Aceita string ISO, timestamp numérico, objeto Date,
 * ano como string ("2024") ou ano como número (2024).
 * 
 * 📚 Formatos suportados:
 * - ISO 8601: "2024-01-15", "2024-01-15T00:00:00Z"
 * - Ano: "2024", 2024
 * - Ano-mês: "2024-01"
 * - Brasileiro: "15/01/2024"
 * - Americano: "01/15/2024"
 * - Texto: "January 15, 2024"
 * - Timestamp: 1705276800000
 * 
 * @param {string|number|Date} date - Data em qualquer formato
 * @returns {string|null} Data ISO (YYYY-MM-DD) ou null se inválida
 * 
 * @example
 * normalizeDate("2024-01-15")              // => "2024-01-15"
 * normalizeDate("2024")                     // => "2024-01-01"
 * normalizeDate(2024)                       // => "2024-01-01"
 * normalizeDate("15/01/2024")              // => "2024-01-15"
 * normalizeDate("01/15/2024")              // => "2024-01-15"
 * normalizeDate("January 15, 2024")        // => "2024-01-15"
 * normalizeDate("invalid")                 // => null
 */
export function normalizeDate(date) {
  if (date === null || date === undefined || date === "") {
    return null;
  }

  // Se já é Date, converte para ISO
  if (date instanceof Date) {
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split("T")[0];
  }

  // Se é timestamp numérico
  if (typeof date === "number") {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split("T")[0];
  }

  // Se é string
  if (typeof date === "string") {
    const trimmed = date.trim();

    // Já é ISO? (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const d = new Date(trimmed + "T00:00:00Z");
      if (!isNaN(d.getTime())) return trimmed;
    }

    // É ISO com hora? (YYYY-MM-DDTHH:mm:ss...)
    const isoMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})T/);
    if (isoMatch) {
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) return isoMatch[1];
    }

    // É ano-mês? (YYYY-MM)
    if (/^\d{4}-\d{2}$/.test(trimmed)) {
      return `${trimmed}-01`;
    }

    // É apenas ano? (4 dígitos)
    if (/^\d{4}$/.test(trimmed)) {
      const year = parseInt(trimmed, 10);
      if (year >= 1000 && year <= 9999) {
        return `${trimmed}-01-01`;
      }
    }

    // 📚 Formato com barras: DD/MM/YYYY ou MM/DD/YYYY
    // Heurística para diferenciar:
    // - Se primeiro número > 12, é DD/MM/YYYY (dia não passa de 31)
    // - Se segundo número > 12, é MM/DD/YYYY
    // - Se ambos ≤ 12, assume DD/MM/YYYY (formato mais comum internacionalmente)
    const slashMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (slashMatch) {
      const [, first, second, year] = slashMatch;
      const firstNum = parseInt(first, 10);
      const secondNum = parseInt(second, 10);
      
      let day, month;
      
      if (firstNum > 12) {
        // Primeiro número > 12 → é dia (DD/MM/YYYY)
        day = first;
        month = second;
      } else if (secondNum > 12) {
        // Segundo número > 12 → é dia (MM/DD/YYYY)
        month = first;
        day = second;
      } else {
        // Ambos ≤ 12: assume DD/MM/YYYY
        day = first;
        month = second;
      }
      
      const d = new Date(`${year}-${month}-${day}T00:00:00Z`);
      if (!isNaN(d.getTime())) {
        return `${year}-${month}-${day}`;
      }
    }

    // Tenta parse genérico (texto em inglês, etc.)
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split("T")[0];
    }
  }

  return null;
}

/**
 * Normaliza um ano para número inteiro.
 * 
 * Extrai o ano de uma data completa, string de ano ou número.
 * 
 * @param {string|number|Date} date - Data
 * @returns {number|null} Ano ou null se inválido
 * 
 * @example
 * normalizeYear("2024-01-15")  // => 2024
 * normalizeYear("2024")         // => 2024
 * normalizeYear(2024)           // => 2024
 */
export function normalizeYear(date) {
  if (date === null || date === undefined || date === "") {
    return null;
  }

  // Se já é número
  if (typeof date === "number") {
    return (date >= 1000 && date <= 9999) ? date : null;
  }

  // Se é string
  if (typeof date === "string") {
    const trimmed = date.trim();

    // Apenas ano
    if (/^\d{4}$/.test(trimmed)) {
      const year = parseInt(trimmed, 10);
      return (year >= 1000 && year <= 9999) ? year : null;
    }

    // ISO: extrai o ano
    const isoMatch = trimmed.match(/^(\d{4})-/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      return (year >= 1000 && year <= 9999) ? year : null;
    }
  }

  // Tenta parse genérico
  const d = new Date(date);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    return (year >= 1000 && year <= 9999) ? year : null;
  }

  return null;
}

export default normalizeDate;