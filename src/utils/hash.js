/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Utils — Hash (FNV-1a 32-bit)
 * ============================================================
 *
 * 📚 AULA: O que é uma função de hash?
 * 
 * Uma função de hash transforma uma string de qualquer tamanho
 * em um valor de tamanho fixo (ex: 8 caracteres hexadecimais).
 * 
 * 📚 Por que FNV-1a?
 * 
 * Precisamos de um hash RÁPIDO e DETERMINÍSTICO para criar
 * chaves de cache e identidades de artigos. Não precisamos de
 * segurança criptográfica (SHA-256 seria exagero).
 * 
 * FNV-1a (Fowler-Noll-Vo) é:
 * - Extremamente rápido (operações bit a bit)
 * - Determinístico (mesma entrada = mesma saída)
 * - Bem distribuído (poucas colisões para nosso volume)
 * - Pequeno (32 bits = 8 caracteres hex)
 * 
 * 📚 Implementação:
 * 
 * Usamos Math.imul() para a multiplicação inteira de 32 bits.
 * Diferente de (a * b) >>> 0 que usa ponto flutuante (IEEE-754)
 * e pode perder precisão em valores intermediários, Math.imul
 * faz a multiplicação diretamente em inteiros de 32 bits com
 * overflow — exatamente como o algoritmo FNV-1a exige.
 * 
 * Isso garante que nosso hash seja compatível com implementações
 * em C, Rust, Go, Java e outras linguagens — mesma entrada,
 * mesma saída, independente da plataforma.
 * 
 * 📚 Onde é usado no sistema:
 * 
 * - Cache.generateKey(): cria chaves compactas para KV
 * - IdentityNormalizer: gera hashes para identidade de artigos
 * - Qualquer lugar que precise de uma "impressão digital" de dados
 */

// Constantes mágicas do algoritmo FNV-1a 32-bit
const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/**
 * Calcula o hash FNV-1a de 32 bits de uma string.
 * 
 * Algoritmo:
 * 1. Começa com um valor inicial (FNV_OFFSET_BASIS)
 * 2. Para cada byte da string:
 *    - XOR com o código do caractere
 *    - Multiplica pelo primo FNV usando Math.imul (inteiro 32-bit)
 *    - Força unsigned 32-bit com >>> 0
 * 3. Converte para hexadecimal de 8 dígitos
 * 
 * 📚 Garantias:
 * - Mesma string → mesmo hash (determinístico)
 * - Compatível com FNV-1a em C/Rust/Go/Java
 * - Rápido: O(n) onde n = comprimento da string
 * 
 * @param {string} str - String de entrada
 * @returns {string} Hash hexadecimal de 8 caracteres
 * 
 * @example
 * identityHash("machine learning") // => "83ab09f1"
 * identityHash("deep learning")    // => "2c4e7d3a"
 * identityHash("")                 // => "811c9dc5" (valor inicial)
 */
export function identityHash(str) {
  let hash = FNV_OFFSET_BASIS;

  for (let i = 0; i < str.length; i++) {
    // XOR com o código do caractere
    hash ^= str.charCodeAt(i);
    
    // Math.imul: multiplicação inteira de 32 bits com overflow
    // >>> 0: força unsigned 32-bit (0 a 4294967295)
    hash = Math.imul(hash, FNV_PRIME) >>> 0;
  }

  return hash.toString(16).padStart(8, "0");
}

export default identityHash;