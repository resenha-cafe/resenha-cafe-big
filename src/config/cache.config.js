/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Config — Cache Configuration
 * ============================================================
 *
 * 📚 AULA: Por que TTLs diferentes?
 * 
 * Diferentes tipos de dados têm diferentes "tempos de vida":
 * 
 * - Search: 30 minutos. Novos artigos podem ser publicados.
 * - Article: 7 dias. Um artigo com DOI não muda.
 * - Empty: 5 minutos. "Não encontrado" pode mudar rapidamente.
 * - Provider: 1 hora. Health status de providers muda devagar.
 * 
 * 📚 O objeto é congelado com deepFreeze para evitar mutações
 * acidentais em runtime. Nenhuma parte do sistema pode alterar
 * um TTL por engano durante a execução.
 * 
 * feat(config): add centralized cache configuration with
 * semantic TTL constants
 */

import { deepFreeze } from "../utils/deep-freeze.js";

// 📚 Constantes autoexplicativas para legibilidade.
// Evita números "mágicos" como 1800, 604800, etc.
const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Configuração de cache.
 * 
 * Todos os TTLs são em SEGUNDOS.
 * 
 * @constant {Object} cacheConfig — Imutável (deepFreeze)
 */
export const cacheConfig = deepFreeze({
  /**
   * Habilita/desabilita o cache globalmente.
   */
  enabled: true,

  /**
   * Tempo de vida (TTL) por tipo de operação.
   */
  ttl: deepFreeze({
    /** Busca textual — expira rápido (novos artigos) */
    search: 30 * MINUTE,

    /** Artigo por DOI — expira devagar (DOI é permanente) */
    article: 7 * DAY,

    /** Resultado vazio — expira rápido (pode aparecer depois) */
    empty: 5 * MINUTE,

    /** Health status de providers */
    provider: 1 * HOUR,

    /** Métricas agregadas */
    metrics: 5 * MINUTE,
  }),

  /**
   * Limites de armazenamento.
   */
  limits: deepFreeze({
    /** Número máximo de entradas no cache em memória (LRU) */
    memoryEntries: 100,

    /** Tamanho máximo de valor no KV (bytes).
     * 25 MB é o limite do Cloudflare KV Value. */
    maxValueSize: 25 * 1024 * 1024,
  }),

  /**
   * Prefixos de chave para evitar colisões.
   */
  keyPrefix: deepFreeze({
    search: "search",
    article: "article",
    provider: "provider",
    metrics: "metrics",
  }),
});

export default cacheConfig;