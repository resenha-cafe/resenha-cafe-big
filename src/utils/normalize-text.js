/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Utils — Normalize Text
 * ============================================================
 *
 * 📚 AULA: Por que normalizar texto?
 * 
 * Providers diferentes escrevem o mesmo texto de formas diferentes:
 * - "Machine Learning" vs "machine learning" (case)
 * - "José" vs "Jose\u0301" (Unicode: pré-composto vs decomposto)
 * - "hello  world" vs "hello world" (espaços múltiplos)
 * - "café" vs "café" (caracteres invisíveis)
 * 
 * Sem normalização, duas strings idênticas visualmente
 * podem ser tratadas como diferentes pelo computador.
 * Isso quebra cache keys, comparações e deduplicação.
 * 
 * 📚 Estratégia de normalização:
 * 
 * 1. Unicode NFKC: compatibilidade + composição
 *    (transforma caracteres equivalentes no mesmo código)
 * 2. Trim: remove espaços no início e fim
 * 3. Colapsa espaços: múltiplos espaços → um só
 * 4. Lowercase: case-insensitive
 * 
 * 📚 Unicode vs ASCII:
 * 
 * Usamos propriedades Unicode (\p{L}, \p{N}) em vez de
 * classes ASCII (\w) para garantir que textos em português,
 * espanhol, grego, russo e outros idiomas sejam tratados
 * corretamente.
 */

/**
 * Normaliza texto para comparação e deduplicação.
 * 
 * Aplica a forma de normalização Unicode NFKC (Compatibility
 * Composition) e colapsa espaços em branco.
 * 
 * NFKC decompõe caracteres compatíveis e recompõe na forma
 * canônica. Exemplo: ﬃ (ligadura) → ffi (três caracteres).
 * 
 * @param {string} text - Texto a normalizar
 * @returns {string} Texto normalizado
 * 
 * @example
 * normalizeText("  Machine   Learning  ")
 * // => "machine learning"
 * 
 * @example
 * // Caracteres Unicode equivalentes viram o mesmo
 * normalizeText("José") === normalizeText("Jose\u0301")
 * // => true
 */
export function normalizeText(text) {
  if (!text || typeof text !== "string") {
    return "";
  }

  return text
    .normalize("NFKC")           // Unicode: compatibilidade + composição
    .trim()                       // Remove espaços nas bordas
    .replace(/\s+/g, " ")        // Colapsa múltiplos espaços em um
    .toLowerCase();               // Case-insensitive
}

/**
 * Normaliza texto preservando case (maiúsculas/minúsculas).
 * 
 * Útil para nomes próprios (autores, instituições) onde
 * a capitalização carrega significado.
 * 
 * @param {string} text - Texto a normalizar
 * @returns {string} Texto normalizado (preserva case)
 * 
 * @example
 * normalizeTextPreserveCase("  Machine   Learning  ")
 * // => "Machine Learning"
 */
export function normalizeTextPreserveCase(text) {
  if (!text || typeof text !== "string") {
    return "";
  }

  return text
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Normaliza texto para uso em chaves de identidade.
 * 
 * Mais agressivo que normalizeText:
 * - Remove pontuação (caracteres não-alfanuméricos)
 * - Normaliza Unicode (NFKC)
 * - Colapsa espaços e lowercase
 * - Preserva caracteres Unicode (letras e números)
 * 
 * 📚 Usa \p{L} (letras Unicode) e \p{N} (números Unicode)
 * em vez de \w (ASCII-only). Isso garante que textos em
 * português, espanhol, grego, russo, etc. tenham seus
 * caracteres preservados durante a normalização.
 * 
 * Ideal para gerar chaves de cache e identidade onde
 * a forma canônica é mais importante que a legibilidade.
 * 
 * @param {string} text - Texto a normalizar
 * @returns {string} Texto normalizado para identidade
 * 
 * @example
 * normalizeForIdentity("The Machine-Learning Approach!")
 * // => "the machine learning approach"
 * 
 * @example
 * // Caracteres acentuados são preservados
 * normalizeForIdentity("Revisão sobre São Paulo")
 * // => "revisão sobre são paulo"
 * 
 * @example
 * normalizeForIdentity("Análisis de Educación")
 * // => "análisis de educación"
 */
export function normalizeForIdentity(text) {
  if (!text || typeof text !== "string") {
    return "";
  }

  return text
    .normalize("NFKC")
    .toLowerCase()
    // Substitui pontuação por espaço, preserva letras e números Unicode
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim()
    .replace(/\s+/g, " ");        // Colapsa espaços
}

export default normalizeText;