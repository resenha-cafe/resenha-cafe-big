/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Application — Article Created Handler
 * ============================================================
 *
 * 📚 AULA: Este handler é como um "despachante".
 * Quando um artigo é criado, ele verifica:
 * 1. O artigo está íntegro? (validação)
 * 2. Dá para enriquecer com mais dados? (enriquecimento)
 * 3. Precisa notificar alguém? (notificação)
 * 
 * Tudo isso SEM alterar o artigo original (que é imutável).
 * 
 * 📚 Princípio aplicado: "YAGNI" (You Aren't Gonna Need It)
 * = Não extraia variáveis que não vai usar. Cada variável extra
 *   é uma pergunta que o leitor se faz: "O que vai ser feito com isso?"
 *   Se a resposta for "nada", a variável não deveria existir.
 */

export class ArticleCreatedHandler {
  /**
   * @param {Object} options
   * @param {DomainEventPublisher} options.eventPublisher - Para eventos secundários
   * @param {Object} [options.enrichers] - Serviços de enriquecimento
   * @param {Object} [options.validators] - Serviços de validação
   */
  constructor(options = {}) {
    this.eventPublisher = options.eventPublisher;
    this.enrichers = options.enrichers || {};
    this.validators = options.validators || {};
  }

  /**
   * Processa evento de artigo criado.
   * 
   * 📚 Extrai apenas o necessário do payload.
   * `article` é usado para validação e enriquecimento.
   * `doi` é usado para decidir sobre notificações.
   * Nada mais é extraído porque nada mais é usado.
   * 
   * @param {ArticleCreated} event - Evento com o artigo no payload
   */
  async handle(event) {
    // 📚 Extrai APENAS o que é usado abaixo
    const { article, doi } = event.payload;

    // Se não tem artigo no payload, não há o que fazer
    if (!article) return;

    // 1. Validações (o artigo está íntegro?)
    await this.#runValidations(article);

    // 2. Enriquecimento (dá para adicionar mais dados?)
    await this.#runEnrichments(article);

    // 3. Notificações para artigos com DOI
    if (doi) {
      await this.#onArticleWithDoi(article);
    }
  }

  /**
   * Executa validações pós-criação.
   * 
   * 📚 private (#) = método interno. Só esta classe pode usar.
   * Isso evita que código externo chame validações diretamente,
   * contornando o fluxo normal do handler.
   * 
   * @private
   * @param {Article} article - Artigo a validar
   */
  async #runValidations(article) {
    if (this.validators.article) {
      const errors = this.validators.article.validate(article);
      if (errors.length > 0) {
        await this.eventPublisher.errorOccurred(
          `Article validation failed: ${errors.join(", ")}`,
          { doi: article.doi, errors }
        );
      }
    }
  }

  /**
   * Executa enriquecimentos.
   * 
   * 📚 try/catch = "tente fazer isso, se der erro, faça aquilo".
   * Aqui o "aquilo" é nada — o erro é silenciado porque
   * enriquecimento é opcional. Se falhar, o artigo ainda
   * é válido, só fica menos completo.
   * 
   * 📚 early return = sair da função o mais cedo possível.
   * Se não há enrichers, nem entra no loop.
   * 
   * @private
   * @param {Article} article - Artigo a enriquecer
   */
  async #runEnrichments(article) {
    const enrichedFields = [];

    // PDF
    if (this.enrichers.pdf) {
      try {
        const pdfUrl = await this.enrichers.pdf.findPdf(article);
        if (pdfUrl) {
          enrichedFields.push("pdfUrl");
        }
      } catch (error) {
        // Silencioso: enriquecimento é opcional
      }
    }

    // Citações
    if (this.enrichers.citations) {
      try {
        const citations = await this.enrichers.citations.getCount(article);
        if (citations > 0) {
          enrichedFields.push("citations");
        }
      } catch (error) {
        // Silencioso
      }
    }

    // Só emite evento se algo foi enriquecido
    if (enrichedFields.length > 0) {
      await this.eventPublisher.articleMetadataEnriched(
        article, 
        enrichedFields
      );
    }
  }

  /**
   * Ações para artigos com DOI.
   * 
   * 📚 Ponto de extensão: hoje não faz nada, mas o método
   * existe para deixar claro que este é o lugar certo para
   * adicionar lógica específica para artigos com DOI.
   * 
   * @private
   * @param {Article} article - Artigo com DOI
   */
  async #onArticleWithDoi(article) {
    // Exemplos futuros:
    // - Verificar se DOI já existe em outra base
    // - Notificar equipe de curadoria
    // - Acionar indexação prioritária
  }
}

export default ArticleCreatedHandler;