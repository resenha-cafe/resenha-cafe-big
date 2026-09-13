/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 *
 * ---
 * Utils — Deep Freeze
 * ============================================================
 *
 * 📚 AULA: O que é deepFreeze?
 *
 * Object.freeze() congela apenas o objeto de primeiro nível:
 *
 * const obj = { a: { b: 1 } };
 * Object.freeze(obj);
 * obj.a.b = 2; // ainda funciona!
 *
 * deepFreeze() congela recursivamente todos os objetos e arrays,
 * tornando toda a estrutura imutável.
 */

/**
 * Congela recursivamente um objeto e todos os seus objetos filhos.
 *
 * - Objetos e arrays ficam totalmente imutáveis
 * - Valores primitivos são retornados como estão
 * - Detecta ciclos para evitar recursão infinita
 *
 * @param {*} value - Valor a congelar
 * @param {WeakSet<object>} [seen] - Objetos já visitados
 * @returns {*} O mesmo valor congelado
 *
 * @example
 * const config = deepFreeze({
 *   api: { timeout: 5000 },
 *   providers: ["openalex", "crossref"]
 * });
 *
 * config.api.timeout = 1000; // não altera
 * config.providers.push("core"); // lança erro em modo estrito
 */
export function deepFreeze(value, seen = new WeakSet()) {
  if (value === null || typeof value !== "object") {
    return value;
  }

  if (seen.has(value)) {
    return value;
  }

  seen.add(value);

  for (const key of Reflect.ownKeys(value)) {
    deepFreeze(value[key], seen);
  }

  return Object.freeze(value);
}

export default deepFreeze;