/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Entry Point — Worker Principal
 * ============================================================
 */

import { bootstrap } from "./bootstrap.js";

/**
 * Handler principal do Cloudflare Worker
 * @param {Request} request - Requisição HTTP
 * @param {Object} env - Environment variables
 * @param {Object} ctx - ExecutionContext
 * @returns {Promise<Response>} Resposta HTTP
 */
export default {
  async fetch(request, env, ctx) {
    return bootstrap(request, env, ctx);
  },
};