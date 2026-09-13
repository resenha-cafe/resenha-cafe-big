/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Enrichers — Base Enricher
 * ============================================================
 *
 * 📚 AULA: O que é um Enricher?
 * 
 * Um Enricher (Enriquecedor) é um componente que adiciona
 * informações complementares a um artigo existente.
 * 
 * 📚 Contrato de um Enricher:
 * 
 * - name: string (identificador único)
 * - canEnrich(article): boolean (verifica se pode enriquecer)
 * - enrich(article): Promise<Object|null> (executa enriquecimento)
 * 
 * 📚 Política de retorno do enrich():
 * 
 * - Object: atualizações para article.with(updates)
 * - null: nada mudou (sem atualizações)
 * - article original: se canEnrich() retornou false
 * 
 * 📚 O BaseEnricher implementa o contrato alinhado:
 * - canEnrich() retornou false → retorna article (inalterado)
 * - canEnrich() retornou true mas nada mudou → retorna null
 * 
 * feat(enrichers): align base enricher contract with documentation
 */

export class BaseEnricher {
  /**
   * @param {Object} options - Configuração
   * @param {string} options.name - Nome do enricher
   * @param {boolean} [options.enabled=true] - Se está habilitado
   */
  constructor(options = {}) {
    if (!options.name) {
      throw new Error("BaseEnricher: name is required");
    }

    /**
     * Nome do enricher (identificador único).
     * @type {string}
     */
    this.name = options.name;

    /**
     * Se o enricher está habilitado.
     * @type {boolean}
     */
    this.enabled = options.enabled !== undefined ? options.enabled : true;
  }

  /**
   * Verifica se o enricher pode ser aplicado ao artigo.
   * 
   * 📚 Sobrescreva este método para adicionar condições específicas.
   * 
   * @param {Object} article - Artigo a verificar
   * @returns {boolean} True se pode enriquecer
   */
  canEnrich(article) {
    return this.enabled && !!article;
  }

  /**
   * Executa o enriquecimento.
   * 
   * 📚 Contrato alinhado com a documentação:
   * - Se canEnrich() retornou false → retorna article (inalterado)
   * - Se canEnrich() retornou true mas nada mudou → retorna null
   * 
   * @param {Object} article - Artigo a enriquecer
   * @param {Object} [context] - Contexto adicional (signal, etc.)
   * @returns {Promise<Object|null>} Resultado do enriquecimento
   */
  async enrich(article, context = {}) {
    if (!this.canEnrich(article)) return article;
    return null;
  }

  /**
   * Retorna a representação em string.
   * @returns {string}
   */
  toString() {
    return `[Enricher: ${this.name}]`;
  }
}

export default BaseEnricher;