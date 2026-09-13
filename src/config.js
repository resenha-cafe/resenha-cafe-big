/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Config — Configuração Centralizada
 * ============================================================
 */

import { CONFIG as ConfigModule } from "./config/index.js";

/**
 * Configuração principal do Worker
 */
export const CONFIG = {
  ...ConfigModule,
  // Environment é definido via env, não process.env
};

/**
 * Versão do Worker
 */
export const VERSION = CONFIG.version || "4.0.0";

export default CONFIG;