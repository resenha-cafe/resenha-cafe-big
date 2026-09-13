// src/utils/deep-freeze.js

/**
 * Congela recursivamente um objeto ou array, retornando uma versão imutável.
 * Funciona para objetos simples e arrays aninhados.
 * Não oferece suporte especial a Map, Set, Date, RegExp, etc. — esses serão
 * congelados superficialmente, mas suas APIs internas continuarão mutáveis.
 *
 * @template T
 * @param {T} obj - Objeto ou array a ser congelado profundamente.
 * @returns {T} O mesmo objeto, agora congelado.
 */
export function deepFreeze(obj) {
  if (obj && typeof obj === 'object' && !Object.isFrozen(obj)) {
    Object.freeze(obj);
    Object.getOwnPropertyNames(obj).forEach((prop) => {
      const value = obj[prop];
      if (value && typeof value === 'object') {
        deepFreeze(value);
      }
    });
  }
  return obj;
}

export default deepFreeze;