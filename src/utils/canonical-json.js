/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Utils — Canonical JSON
 * ============================================================
 *
 * 📚 AULA: O que é Canonical JSON?
 * 
 * Canonical JSON (JSON Canônico) é uma forma de serializar
 * objetos JavaScript em JSON de maneira DETERMINÍSTICA.
 * 
 * 📚 Por que isso importa?
 * 
 * JSON.stringify() NÃO garante a ordem das chaves:
 * 
 * JSON.stringify({ b: 2, a: 1 }) // '{"b":2,"a":1}'
 * JSON.stringify({ a: 1, b: 2 }) // '{"a":1,"b":2}'
 * 
 * Objetos iguais podem gerar strings diferentes!
 * Isso quebra caching (cache keys diferentes para os mesmos dados)
 * e comparação de hashes.
 * 
 * 📚 Como resolvemos:
 * 
 * 1. Ordenamos as chaves lexicograficamente (Unicode code points)
 *    usando .sort() padrão — determinístico e independente de locale
 * 2. Removemos espaços desnecessários
 * 3. Garantimos que objetos iguais sempre gerem a mesma string
 * 
 * Exemplo:
 * canonicalJson({ b: 2, a: 1 }) // '{"a":1,"b":2}'
 * canonicalJson({ a: 1, b: 2 }) // '{"a":1,"b":2}' ← idêntico!
 */

/**
 * Serializa um valor para JSON canônico (determinístico).
 * 
 * Garante que objetos equivalentes sempre gerem a mesma string JSON,
 * independentemente da ordem das chaves ou dos espaços em branco.
 * 
 * 📚 Comportamento com undefined:
 * Segue o mesmo comportamento de JSON.stringify:
 * - Se o valor RAIZ for undefined, retorna undefined
 * - Se uma PROPRIEDADE for undefined, ela é omitida do JSON
 * 
 * @param {*} value - Qualquer valor JavaScript serializável
 * @returns {string|undefined} String JSON canônica, ou undefined se value for undefined
 * 
 * @example
 * canonicalJson({ b: 2, a: 1 }) === canonicalJson({ a: 1, b: 2 })
 * // true — mesma string!
 * 
 * @example
 * canonicalJson(undefined) === undefined
 * // true — consistente com JSON.stringify
 */
export function canonicalJson(value) {
  // Consistente com JSON.stringify: undefined raiz retorna undefined
  if (value === undefined) {
    return undefined;
  }

  return JSON.stringify(value, (_, v) => {
    // Se for um objeto (não array, não null), ordena as chaves
    // lexicograficamente por Unicode code points (determinístico)
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return Object.keys(v)
        .sort()
        .reduce((sorted, key) => {
          sorted[key] = v[key];
          return sorted;
        }, {});
    }
    return v;
  });
}

export default canonicalJson;