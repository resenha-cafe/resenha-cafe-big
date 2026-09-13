/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 *
 * ---
 * Utils — Is Plain Object
 * ============================================================
 *
 * 📚 AULA: O que é um "plain object"?
 *
 * Um plain object é um objeto criado por:
 *   - {} (literal)
 *   - new Object()
 *   - Object.create(null)
 *
 * Exemplos que SÃO plain objects:
 *   {}
 *   { a: 1 }
 *   new Object()
 *   Object.create(null)
 *
 * Exemplos que NÃO são:
 *   []
 *   new Date()
 *   new Map()
 *   new Set()
 *   function() {}
 *   class MinhaClasse {}
 *
 * 📚 Por que isso importa?
 *
 * Muitos utilitários (merge, clone, normalize, cache) devem operar
 * apenas sobre objetos simples. Arrays, Maps, Dates e instâncias de
 * classes têm comportamento diferente e não devem ser tratados como
 * objetos comuns.
 */

/**
 * Verifica se um valor é um plain object.
 *
 * Aceita objetos literais, objetos criados com Object() e
 * objetos com protótipo nulo (Object.create(null)).
 *
 * @param {*} value - Valor a verificar
 * @returns {boolean} True se for um plain object
 *
 * @example
 * isPlainObject({})                     // => true
 * isPlainObject({ a: 1 })               // => true
 * isPlainObject(Object.create(null))    // => true
 * isPlainObject([])                     // => false
 * isPlainObject(new Date())             // => false
 * isPlainObject(new Map())              // => false
 * isPlainObject(null)                   // => false
 */
export function isPlainObject(value) {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const proto = Object.getPrototypeOf(value);

  return proto === Object.prototype || proto === null;
}

export default isPlainObject;