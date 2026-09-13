/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Utils — Normalize Author
 * ============================================================
 *
 * 📚 AULA: Por que normalizar nomes de autores?
 * 
 * O mesmo autor pode aparecer escrito de várias formas:
 * - "Silva, J." (CrossRef)
 * - "J. Silva" (OpenAlex)
 * - "Jose Silva" (SciELO)
 * - "José Silva" (com acento)
 * - "SILVA, JOSE" (maiúsculas)
 * 
 * Sem normalização, o sistema trata essas 5 variações como
 * 5 autores diferentes. Isso quebra deduplicação, merge e
 * agrupamento de artigos do mesmo autor.
 * 
 * 📚 Estratégia:
 * 
 * 1. Unicode NFKD + remoção de diacríticos (acentos)
 *    José → Jose, João → Joao
 * 2. Remove pontuação (vírgulas, pontos, hífens)
 * 3. Colapsa espaços
 * 4. Ordena palavras alfabeticamente
 *    "Jose Silva" e "Silva Jose" viram ambos "jose silva"
 * 5. Remove duplicatas de palavras
 * 6. Lowercase
 * 
 * 📚 Por que remover acentos?
 * 
 * Muitos providers alternam entre versões acentuadas e não
 * acentuadas do mesmo nome. "José" no SciELO pode aparecer
 * como "Jose" no CrossRef. Remover acentos garante que
 * ambas as formas sejam tratadas como o mesmo autor.
 * 
 * 📚 Por que ordenar palavras?
 * 
 * "Jose Silva" e "Silva, Jose" são a mesma pessoa, mas em
 * ordens diferentes. Ordenar as palavras alfabeticamente
 * elimina a dependência da ordem e torna a vírgula irrelevante.
 */

/**
 * Normaliza nome de pessoa para identidade (deduplicação).
 * 
 * Transforma qualquer formato de nome de autor em uma
 * representação canônica para comparação.
 * 
 * 📚 Exemplos de entrada e saída:
 * - "Silva, J." → "j silva"
 * - "J. Silva" → "j silva"
 * - "José Silva" → "jose silva"
 * - "SILVA, JOSE" → "jose silva"
 * - "João Silva" → "joao silva"
 * 
 * 📚 Algoritmo:
 * 1. NFKD (decompõe caracteres Unicode)
 * 2. Remove diacríticos (acentos): José → Jose
 * 3. Remove pontuação: vírgulas, pontos, hífens
 * 4. Colapsa espaços
 * 5. Quebra em palavras e ordena alfabeticamente
 *    (torna a vírgula e a ordem originais irrelevantes)
 * 6. Remove duplicatas de palavras
 * 7. Lowercase
 * 
 * @param {string} name - Nome do autor em qualquer formato
 * @returns {string} Nome normalizado para identidade
 * 
 * @example
 * normalizePersonNameForIdentity("Silva, J.")
 * // => "j silva"
 * 
 * @example
 * normalizePersonNameForIdentity("J. Silva")
 * // => "j silva"
 * 
 * @example
 * normalizePersonNameForIdentity("José Silva")
 * // => "jose silva"
 * 
 * @example
 * normalizePersonNameForIdentity("João Silva")
 * // => "joao silva"
 * 
 * @example
 * normalizePersonNameForIdentity("")
 * // => ""
 */
export function normalizePersonNameForIdentity(name) {
  if (!name || typeof name !== "string") {
    return "";
  }

  // 1. Unicode NFKD (decomposição de compatibilidade)
  let normalized = name.normalize("NFKD");

  // 2. Remove diacríticos (acentos, cedilha, til, etc.)
  // \p{M} = qualquer marca Unicode (combining character)
  normalized = normalized.replace(/\p{M}+/gu, "");

  // 3. Remove pontuação (mantém apenas letras e espaços)
  // \p{L} = qualquer letra Unicode (inclui grego, cirílico, chinês, etc.)
  normalized = normalized.replace(/[^\p{L}\s]/gu, " ");

  // 4. Colapsa espaços múltiplos e trim
  normalized = normalized.replace(/\s+/g, " ").trim();

  if (!normalized) return "";

  // 5. Quebra em palavras
  const words = normalized.split(/\s+/).filter(Boolean);

  // 6. Remove duplicatas de palavras
  const uniqueWords = [...new Set(words)];

  // 7. Ordena alfabeticamente (lexicográfico Unicode — determinístico)
  //    Torna "Jose Silva" e "Silva Jose" idênticos
  uniqueWords.sort();

  // 8. Junta e lowercase
  return uniqueWords.join(" ").toLowerCase();
}

/**
 * Normaliza título de artigo para identidade.
 * 
 * Similar ao normalizeText, mas otimizado para títulos:
 * - Remove pontuação (substitui por espaço)
 * - Preserva letras e números Unicode
 * - Colapsa espaços
 * - Lowercase
 * 
 * 📚 Usa \p{L} e \p{N} (Unicode) em vez de \w (ASCII-only).
 * Isso garante que títulos em português, espanhol, grego, etc.
 * tenham seus caracteres preservados.
 * 
 * @param {string} title - Título do artigo
 * @returns {string} Título normalizado
 * 
 * @example
 * normalizeTitleForIdentity("Machine Learning: A Review")
 * // => "machine learning a review"
 * 
 * @example
 * // Caracteres Unicode são preservados (apenas pontuação removida)
 * normalizeTitleForIdentity("José Silva: Uma Revisão")
 * // => "josé silva uma revisão"
 */
export function normalizeTitleForIdentity(title) {
  if (!title || typeof title !== "string") {
    return "";
  }

  return title
    .normalize("NFKC")
    .toLowerCase()
    // Substitui pontuação por espaço, mas preserva letras (Unicode) e números
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")       // Colapsa espaços
    .trim();
}

export default normalizePersonNameForIdentity;