/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Config — Barrel Export & Configuração Central
 * ============================================================
 *
 * 📚 AULA: Configuração centralizada.
 * 
 * Este arquivo é o ponto único de importação para todas as
 * configurações do sistema. Cada módulo de configuração
 * (cache, providers, ranking, merge, validation) é a fonte
 * da verdade para seu domínio.
 * 
 * 📚 O CONFIG consome os módulos — não duplica valores.
 * 
 * 📚 Ambiente:
 * O valor real é injetado pelo bootstrap via handler do Worker.
 * 
 * refactor(config): centralize configuration composition and
 * inject runtime env via bootstrap
 */

import { cacheConfig } from "./cache.config.js";
import { providersConfig } from "./providers.config.js";
import { rankingConfig } from "./ranking.config.js";
import { mergeConfig } from "./merge.config.js";
import { validationConfig } from "./validation.config.js";

// ============================================================
// EXPORTA MÓDULOS INDIVIDUAIS
// ============================================================
export {
  cacheConfig,
  providersConfig,
  rankingConfig,
  mergeConfig,
  validationConfig,
};

// ============================================================
// CONFIGURAÇÃO CENTRAL
// ============================================================

/**
 * Configuração central do Worker.
 * 
 * 📚 Consome os módulos de configuração — NÃO duplica valores.
 * Cada módulo é a fonte da verdade para seu domínio.
 * 
 * 📚 O campo `env` é um fallback. O valor real é injetado
 * pelo bootstrap a partir do handler do Worker:
 * 
 *   const config = { ...CONFIG, env: env.APP_ENV || CONFIG.env };
 */
export const CONFIG = {
  version: "4.0.0",
  env: "development",
  cache: cacheConfig,
  providers: providersConfig,
  ranking: rankingConfig,
  merge: mergeConfig,
  validation: validationConfig,
};

export default CONFIG;