/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Config — Providers Configuration
 * ============================================================
 *
 * 📚 AULA: Configuração de providers.
 * 
 * Cada provider tem suas próprias características:
 * - URL base da API
 * - Timeout padrão
 * - Rate limit (requisições por período em SEGUNDOS)
 * - Health threshold (quando considerar "não saudável")
 * - Prioridade no planner (quanto maior, mais prioritário)
 * - Capacidades (doi, search, pdf, open_access, etc.)
 * 
 * 📚 rateLimit.period em SEGUNDOS (não string).
 * Isso permite comparações sem parser:
 *   if (elapsed >= config.rateLimit.period) { ... }
 * 
 * 📚 Chaves dos providers são IDs canônicos (sem hífens, sem variações).
 * O nome humano fica no campo `name`. Isso garante que o Registry,
 * Planner e métricas usem exatamente o mesmo identificador.
 * 
 * feat(config): add providers configuration with canonical IDs
 */

import { deepFreeze } from "../utils/deep-freeze.js";

// 📚 Constantes de tempo para legibilidade
const SECOND = 1;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Configuração de todos os providers.
 * 
 * @constant {Object} providersConfig — Imutável (deepFreeze recursivo)
 */
export const providersConfig = deepFreeze({
  openalex: {
    name: "OpenAlex",
    baseUrl: "https://api.openalex.org",
    enabled: true,
    timeout: 15000,
    priority: 5,
    capabilities: ["search", "doi", "open_access", "citations", "abstract"],
    healthThreshold: 0.5,
    rateLimit: {
      requests: 100000,
      period: 1 * DAY,
    },
  },

  crossref: {
    name: "CrossRef",
    baseUrl: "https://api.crossref.org",
    enabled: true,
    timeout: 15000,
    priority: 3,
    capabilities: ["search", "doi", "references", "affiliations", "license"],
    healthThreshold: 0.5,
    rateLimit: {
      requests: 50,
      period: 1 * SECOND,
    },
    politePool: {
      enabled: true,
      email: null,
    },
  },

  semantic: {
    name: "Semantic Scholar",
    baseUrl: "https://api.semanticscholar.org/graph/v1",
    enabled: true,
    timeout: 15000,
    priority: 4,
    capabilities: ["search", "doi", "citations", "references", "pdf", "open_access"],
    healthThreshold: 0.5,
    rateLimit: {
      requests: 100,
      period: 5 * MINUTE,
    },
    apiKey: null,
  },

  core: {
    name: "CORE",
    baseUrl: "https://api.core.ac.uk/v3",
    enabled: true,
    timeout: 15000,
    priority: 2,
    capabilities: ["search", "doi", "full_text", "open_access"],
    healthThreshold: 0.5,
    rateLimit: {
      requests: 30000,
      period: 1 * DAY,
    },
    apiKey: null,
  },

  europepmc: {
    name: "Europe PMC",
    baseUrl: "https://www.ebi.ac.uk/europepmc/webservices/rest",
    enabled: true,
    timeout: 15000,
    priority: 3,
    capabilities: ["search", "doi", "pmid", "open_access", "full_text", "affiliations"],
    healthThreshold: 0.5,
    rateLimit: {
      requests: 1,
      period: 1 * SECOND,
    },
  },

  scielo: {
    name: "SciELO",
    baseUrl: "https://api.scielo.org",
    enabled: true,
    timeout: 15000,
    priority: 2,
    capabilities: ["search", "doi", "open_access", "portuguese", "spanish"],
    healthThreshold: 0.5,
    rateLimit: {
      requests: 10,
      period: 1 * SECOND,
    },
  },
});

export default providersConfig;