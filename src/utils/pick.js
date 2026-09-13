/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Utils — Pick & Omit
 * ============================================================
 *
 * 📚 AULA: O que são Pick e Omit?
 * 
 * Pick: extrai APENAS as propriedades desejadas de um objeto.
 * Omit: remove as propriedades indesejadas, mantendo o resto.
 * 
 * São operações complementares:
 * pick(obj, ["a", "b"]) → só a e b
 * omit(obj, ["a", "b"]) → tudo menos a e b
 * 
 * 📚 Por que usar?
 * 
 * 1. Segurança: evita expor propriedades sensíveis
 * 2. Performance: objetos menores para serializar
 * 3. Clareza: explícito sobre quais campos são usados
 * 
 * 📚 Consistência:
 * Ambos pick e omit operam apenas sobre PROPRIEDADES PRÓPRIAS
 * do objeto (não incluem propriedades herdadas da cadeia de protótipo).
 * 
 * Exemplo:
 * const user = { id: 1, name: "João", password: "123", email: "a@b.com" };
 * pick(user, ["id", "name"]) // => { id: 1, name: "João" }
 * omit(user, ["password"])   // => { id: 1, name: "João", email: "a@b.com" }
 */

/**
 * Extrai apenas as chaves especificadas de um objeto.
 * 
 * Retorna um NOVO objeto contendo apenas as propriedades
 * cujos nomes estão na lista de chaves. O objeto original
 * não é modificado.
 * 
 * 📚 Comportamento:
 * - Chaves que não existem no objeto são ignoradas
 * - Valores undefined são incluídos (se a chave existir)
 * - Retorna objeto vazio se nenhuma chave for encontrada
 * - Usa Object.hasOwn() — apenas propriedades PRÓPRIAS do objeto
 * 
 * @param {Object} obj - Objeto de origem
 * @param {Array<string>} keys - Lista de chaves a extrair
 * @returns {Object} Novo objeto apenas com as chaves especificadas
 * 
 * @example
 * const article = { title: "ML", doi: "10.1000/abc", abstract: "...", citations: 42 };
 * pick(article, ["title", "doi"])
 * // => { title: "ML", doi: "10.1000/abc" }
 * 
 * @example
 * pick({ a: 1 }, ["a", "b"])
 * // => { a: 1 } (b não existe, ignorada)
 * 
 * @example
 * // Não inclui propriedades herdadas
 * const obj = Object.create({ inherited: 1 });
 * obj.own = 2;
 * pick(obj, ["own", "inherited"])
 * // => { own: 2 } (inherited é ignorada)
 */
export function pick(obj, keys = []) {
  if (!obj || typeof obj !== "object") {
    return {};
  }

  const result = {};

  for (const key of keys) {
    // Object.hasOwn: apenas propriedades PRÓPRIAS (não herdadas)
    // Disponível em Node 16.9+, Cloudflare Workers, Chrome 93+
    if (Object.hasOwn(obj, key)) {
      result[key] = obj[key];
    }
  }

  return result;
}

/**
 * Remove as chaves especificadas de um objeto.
 * 
 * O oposto de pick: retorna um NOVO objeto com todas as
 * propriedades EXCETO as listadas. O objeto original
 * não é modificado.
 * 
 * 📚 Performance:
 * Usa Set para busca O(1) das chaves a remover.
 * 
 * @param {Object} obj - Objeto de origem
 * @param {Array<string>} keys - Lista de chaves a remover
 * @returns {Object} Novo objeto sem as chaves especificadas
 * 
 * @example
 * const user = { id: 1, name: "João", password: "123" };
 * omit(user, ["password"])
 * // => { id: 1, name: "João" }
 */
export function omit(obj, keys = []) {
  if (!obj || typeof obj !== "object") {
    return {};
  }

  const keysToRemove = new Set(keys);
  const result = {};

  // Object.keys: apenas propriedades PRÓPRIAS enumeráveis
  for (const key of Object.keys(obj)) {
    if (!keysToRemove.has(key)) {
      result[key] = obj[key];
    }
  }

  return result;
}

export default pick;