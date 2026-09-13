/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Pipeline — Engine
 * ============================================================
 *
 * 📚 AULA: O que é o Pipeline Engine?
 * 
 * O Pipeline Engine é o orquestrador dos passos de busca.
 * Ele executa cada step em sequência, passando o resultado
 * de um como entrada para o próximo.
 * 
 * 📚 Funcionalidades:
 * 
 * - canExecute: steps desabilitados são pulados
 * - Hooks: beforeStep, afterStep, onError para instrumentação
 * - Timeout: Promise.race + AbortController com limpeza de timer
 * - Steps congelados: lista imutável após construção
 * - Métricas por step: duração de cada etapa
 * - cause: erros preservam a causa original (ES2022)
 * - OpenTelemetry ready: hooks compatíveis com tracing
 * 
 * 📚 Timeout com limpeza garantida:
 * 
 * O finally garante que o timer seja limpo SEMPRE, independente
 * de quem venceu a corrida (step ou timeout). Isso evita
 * vazamento de recursos no Workers.
 * 
 * feat(pipeline): add pipeline engine with hooks, timeout, and error cause
 */

export class PipelineEngine {
  /**
   * @param {Object} options - Configuração do pipeline
   * @param {Array<Object>} options.steps - Lista de steps
   * @param {Object} [options.logger] - Logger
   * @param {Object} [options.hooks] - Hooks de ciclo de vida
   * @param {Function} [options.hooks.beforeStep] - (step, ctx) => void
   * @param {Function} [options.hooks.afterStep] - (step, beforeCtx, result) => void
   * @param {Function} [options.hooks.onError] - (step, ctx, error) => void
   * @param {number} [options.defaultTimeout=30000] - Timeout padrão por step (ms)
   */
  constructor(options = {}) {
    this.steps = Object.freeze([...(options.steps || [])]);
    this.logger = options.logger || console;
    this.hooks = options.hooks || {};
    this.defaultTimeout = options.defaultTimeout ?? 30000;
  }

  /**
   * Executa o pipeline completo.
   * 
   * @param {Object} context - Contexto inicial
   * @returns {Promise<Object>} Contexto final com resultados
   * @throws {Error} Se algum step falhar (com cause preservado)
   */
  async execute(context = {}) {
    let ctx = { ...context, startedAt: Date.now() };

    for (const step of this.steps) {
      const stepName = step.name || "unnamed";

      if (step.canExecute && !step.canExecute(ctx)) {
        this.logger.debug(`[Pipeline] Skipping step: ${stepName}`);
        continue;
      }

      await this.#runHook("beforeStep", step, ctx);
      this.logger.debug(`[Pipeline] Executing step: ${stepName}`);

      const previousCtx = ctx;

      try {
        const stepStarted = Date.now();
        const timeout = step.timeout || this.defaultTimeout;
        ctx = await this.#executeWithTimeout(step, ctx, timeout);
        const stepDuration = Date.now() - stepStarted;

        await this.#runHook("afterStep", step, previousCtx, {
          context: ctx,
          duration: stepDuration,
        });
      } catch (error) {
        await this.#runHook("onError", step, ctx, error);

        this.logger.error(`[Pipeline] Step failed: ${stepName}`, {
          error: error.message,
        });

        throw new Error(
          `Pipeline step "${stepName}" failed`,
          { cause: error }
        );
      }
    }

    const duration = Date.now() - ctx.startedAt;

    this.logger.info(`[Pipeline] Completed in ${duration}ms`, {
      steps: this.steps.length,
      results: ctx.results?.length || 0,
    });

    return { ...ctx, duration };
  }

  /**
   * Executa o pipeline com fail-soft.
   * 
   * @param {Object} context - Contexto inicial
   * @returns {Promise<Object>} Contexto final com erros
   */
  async safeExecute(context = {}) {
    let ctx = { ...context, startedAt: Date.now(), errors: [] };

    for (const step of this.steps) {
      const stepName = step.name || "unnamed";

      if (step.canExecute && !step.canExecute(ctx)) {
        this.logger.debug(`[Pipeline] Skipping step: ${stepName}`);
        continue;
      }

      await this.#runHook("beforeStep", step, ctx);
      this.logger.debug(`[Pipeline] Executing step: ${stepName}`);

      const previousCtx = ctx;

      try {
        const stepStarted = Date.now();
        const timeout = step.timeout || this.defaultTimeout;
        ctx = await this.#executeWithTimeout(step, ctx, timeout);
        const stepDuration = Date.now() - stepStarted;

        await this.#runHook("afterStep", step, previousCtx, {
          context: ctx,
          duration: stepDuration,
        });
      } catch (error) {
        await this.#runHook("onError", step, ctx, error);

        this.logger.warn(`[Pipeline] Step failed (non-blocking): ${stepName}`, {
          error: error.message,
        });

        // 📚 Preserva a causa do erro para debugging
        ctx.errors.push({
          step: stepName,
          error: error.message,
          cause: error.cause?.message ?? null,
          timestamp: new Date().toISOString(),
        });
      }
    }

    const duration = Date.now() - ctx.startedAt;

    this.logger.info(`[Pipeline] Completed in ${duration}ms`, {
      steps: this.steps.length,
      errors: ctx.errors.length,
      results: ctx.results?.length || 0,
    });

    return { ...ctx, duration };
  }

  addStep(step) {
    return new PipelineEngine({
      steps: [...this.steps, step],
      logger: this.logger,
      hooks: this.hooks,
      defaultTimeout: this.defaultTimeout,
    });
  }

  addSteps(steps = []) {
    return new PipelineEngine({
      steps: [...this.steps, ...steps],
      logger: this.logger,
      hooks: this.hooks,
      defaultTimeout: this.defaultTimeout,
    });
  }

  removeStep(name) {
    return new PipelineEngine({
      steps: this.steps.filter(s => s.name !== name),
      logger: this.logger,
      hooks: this.hooks,
      defaultTimeout: this.defaultTimeout,
    });
  }

  getStepNames() {
    return this.steps.map(s => s.name || "unnamed");
  }

  // ============================================================
  // PRIVADO
  // ============================================================

  /**
   * Executa um step com timeout e limpeza garantida do timer.
   * 
   * 📚 Dupla garantia:
   * 1. AbortController: se o step usar ctx.signal no fetch
   * 2. Promise.race: se o step NÃO usar ctx.signal
   * 
   * 📚 O finally garante clearTimeout SEMPRE.
   * 
   * @private
   */
  async #executeWithTimeout(step, ctx, timeout) {
    if (timeout <= 0) {
      return step.execute(ctx);
    }

    const controller = new AbortController();
    let timer;

    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(new Error(
          `Step "${step.name}" timed out after ${timeout}ms`
        ));
      }, timeout);
    });

    try {
      return await Promise.race([
        step.execute({
          ...ctx,
          signal: controller.signal,
        }),
        timeoutPromise,
      ]);
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Executa um hook se ele existir.
   * Erros em hooks NÃO interrompem o pipeline.
   * 
   * @private
   */
  async #runHook(hookName, step, ctx, data) {
    const hook = this.hooks[hookName];
    if (!hook) return;

    try {
      await hook(step, ctx, data);
    } catch (error) {
      this.logger.warn(`[Pipeline] Hook "${hookName}" failed`, {
        step: step.name,
        error: error.message,
      });
    }
  }
}

export default PipelineEngine;