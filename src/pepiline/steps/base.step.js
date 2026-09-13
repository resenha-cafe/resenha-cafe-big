/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Pipeline — Base Step
 * ============================================================
 *
 * 📚 AULA: O que é um Step?
 * 
 * Um Step é uma etapa do pipeline de busca. Cada step:
 * 1. Recebe um contexto (com todos os dados até agora)
 * 2. Faz sua transformação
 * 3. Retorna o contexto atualizado
 * 
 * 📚 Analogia:
 * É como uma estação numa linha de montagem. Cada estação
 * pega o produto da estação anterior, faz seu trabalho,
 * e passa para a próxima.
 * 
 * 📚 Contrato de um Step:
 * 
 * - name: string (identificador único)
 * - execute(context): Promise<context> (método principal)
 * - canExecute(context): boolean (verifica se pode rodar)
 * 
 * 📚 REGRA DE OURO PARA STEPS:
 * 
 * Todo step que fizer I/O (fetch, leitura de KV, chamadas externas,
 * etc.) DEVE propagar ctx.signal para a operação.
 * 
 * Exemplo correto:
 *   await fetch(url, { signal: ctx.signal });
 * 
 * Isso permite que o Pipeline Engine cancele a operação via
 * AbortController quando o timeout for atingido, liberando
 * recursos no Cloudflare Worker.
 * 
 * ⚠️ Steps que ignoram ctx.signal podem continuar executando
 * após o timeout, desperdiçando CPU e memória.
 * 
 * feat(pipeline): add base step with I/O signal propagation rule
 */

export class BaseStep {
  /**
   * @param {Object} options - Configuração do step
   * @param {string} options.name - Nome do step
   * @param {boolean} [options.enabled=true] - Se o step está habilitado
   */
  constructor(options = {}) {
    if (!options.name) {
      throw new Error("BaseStep: name is required");
    }

    /**
     * Nome do step (identificador único no pipeline).
     * @type {string}
     */
    this.name = options.name;

    /**
     * Se o step está habilitado.
     * Steps desabilitados são pulados durante a execução.
     * @type {boolean}
     */
    this.enabled = options.enabled !== undefined ? options.enabled : true;
  }

  /**
   * Executa o step.
   * 
   * 📚 Este método DEVE ser sobrescrito por cada step.
   * O BaseStep apenas retorna o contexto inalterado.
   * 
   * 📚 LEMBRE-SE: Se fizer I/O, propague ctx.signal!
   *   await fetch(url, { signal: ctx.signal });
   * 
   * @param {Object} context - Contexto do pipeline (inclui signal)
   * @returns {Promise<Object>} Contexto atualizado
   */
  async execute(context) {
    return context;
  }

  /**
   * Verifica se o step pode ser executado.
   * 
   * 📚 Sobrescreva este método para adicionar condições.
   * Ex: SearchStep só executa se context.query existe.
   * 
   * @param {Object} context - Contexto do pipeline
   * @returns {boolean} True se pode executar
   */
  canExecute(context) {
    return this.enabled;
  }

  /**
   * Retorna a representação em string.
   * @returns {string}
   */
  toString() {
    return `[Step: ${this.name}]`;
  }
}

export default BaseStep;