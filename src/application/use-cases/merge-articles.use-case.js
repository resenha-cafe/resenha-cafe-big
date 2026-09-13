/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Application — Merge Articles Use Case
 * ============================================================
 */

import { Article } from "../../domain/entities/article.js";
import { normalizeTitleForIdentity } from "../../utils/index.js";

export class MergeArticlesUseCase {
  constructor({ resolver, eventPublisher, logger } = {}) {
    if (!resolver) {
      throw new Error("MergeArticlesUseCase requires a resolver");
    }
    if (!eventPublisher) {
      throw new Error("MergeArticlesUseCase requires an eventPublisher");
    }

    this.resolver = resolver;
    this.eventPublisher = eventPublisher;
    this.logger = logger || console;
  }

  async execute(input = {}) {
    const { articles = [], options = {} } = input;

    if (!Array.isArray(articles)) {
      throw new Error("articles must be an array");
    }

    if (articles.length === 0) {
      return {
        articles: [],
        originalCount: 0,
        mergedCount: 0,
        duplicatesRemoved: 0,
        mergeDetails: [],
      };
    }

    // ============================================================
    // 1. NORMALIZA ARTIGOS PARA ENTIDADES
    // ============================================================
    const normalizedArticles = articles.map(item => {
      if (item instanceof Article) return item;
      return Article.fromPlainObject(item);
    });

    const originalCount = normalizedArticles.length;

    // ============================================================
    // 2. AGRUPA POR IDENTIFICADOR COMUM
    // ============================================================
    const groups = this.#groupArticles(normalizedArticles);

    this.logger.info("[MergeArticlesUseCase] Articles grouped", {
      originalCount,
      groups: groups.length,
      groupsWithMultiple: groups.filter(g => g.length > 1).length,
    });

    // ============================================================
    // 3. EXECUTA O MERGE PARA CADA GRUPO
    // ============================================================
    const mergeDetails = [];
    const mergedArticles = [];

    for (const group of groups) {
      if (group.length === 1) {
        // Artigo único — adiciona direto, sem merge
        mergedArticles.push(group[0]);
        // 📚 CORRIGIDO: Também registra grupos de 1 artigo
        mergeDetails.push({
          merged: group[0],
          sources: [group[0].source].filter(Boolean),
          articleCount: 1,
          wasMerged: false,
        });
        continue;
      }

      // Grupo com múltiplos artigos → merge
      const mergeDetail = await this.#mergeGroup(group, options);
      mergeDetails.push(mergeDetail);
      mergedArticles.push(mergeDetail.merged);
    }

    const mergedCount = mergedArticles.length;
    const duplicatesRemoved = originalCount - mergedCount;

    // ============================================================
    // 4. PUBLICA EVENTOS (apenas para grupos que foram mesclados)
    // ============================================================
    const publishEvents = options.publishEvents !== false;

    if (publishEvents) {
      for (const detail of mergeDetails) {
        // 📚 Só publica evento se realmente houve merge (2+ artigos)
        if (!detail.wasMerged) continue;

        try {
          await this.eventPublisher.articleMerged(
            detail.merged,
            detail.sources,
            detail.articleCount
          );
        } catch (error) {
          this.logger.warn("[MergeArticlesUseCase] Event publish failed", {
            doi: detail.merged.doi,
            error: error.message,
          });
        }
      }
    }

    // ============================================================
    // 5. RETORNA RESULTADO
    // ============================================================
    this.logger.info("[MergeArticlesUseCase] Merge completed", {
      originalCount,
      mergedCount,
      duplicatesRemoved,
      mergesPerformed: mergeDetails.filter(d => d.wasMerged).length,
    });

    return {
      articles: mergedArticles,
      originalCount,
      mergedCount,
      duplicatesRemoved,
      mergeDetails: mergeDetails.map(d => ({
        doi: d.merged.doi,
        title: d.merged.title,
        sources: d.sources,
        articleCount: d.articleCount,
        wasMerged: d.wasMerged,
      })),
    };
  }

  /**
   * Mescla dois artigos específicos.
   */
  async mergeTwo(existing, incoming, options = {}) {
    const article1 = existing instanceof Article
      ? existing
      : Article.fromPlainObject(existing);

    const article2 = incoming instanceof Article
      ? incoming
      : Article.fromPlainObject(incoming);

    // 📚 Usa o resolver para fazer o merge
    // Passa os artigos como objeto plano para o resolver,
    // que retorna um objeto plano mesclado.
    const mergedData = await this.resolver.mergeArticles(
      article1.toPlainObject(),
      article2.toPlainObject()
    );

    const result = Article.fromPlainObject(mergedData);

    // 📚 Extrai as fontes dos artigos originais
    const sources = [...new Set([
      article1.source,
      article2.source,
    ].filter(Boolean))];

    // Publica evento
    if (options.publishEvents !== false) {
      try {
        await this.eventPublisher.articleMerged(
          result,
          sources,
          2
        );
      } catch (error) {
        this.logger.warn("[MergeArticlesUseCase] Event publish failed", {
          doi: result.doi,
          error: error.message,
        });
      }
    }

    return result;
  }

  // ============================================================
  // MÉTODOS PRIVADOS
  // ============================================================

  /**
   * Agrupa artigos por identificador comum.
   * 
   * 📚 CORRIGIDO: Fallback usa título normalizado em vez de random.
   * 
   * Estratégia:
   * 1. DOI (identificador forte e único)
   * 2. Identity key (identidade do domínio)
   * 3. Título normalizado (fallback para artigos sem DOI)
   * 4. Grupo individual (quando nenhum identificador comum existe)
   * 
   * @private
   */
  #groupArticles(articles) {
    const groups = new Map();
    const used = new Set(); // Artigos já agrupados (para fallback)

    // ============================================================
    // FASE 1: Agrupa por DOI
    // ============================================================
    for (const article of articles) {
      if (article.doi) {
        const key = `doi:${article.doi.toLowerCase()}`;

        if (groups.has(key)) {
          groups.get(key).push(article);
        } else {
          groups.set(key, [article]);
        }

        used.add(article);
      }
    }

    // ============================================================
    // FASE 2: Agrupa por Identity Key (artigos sem DOI)
    // ============================================================
    for (const article of articles) {
      if (used.has(article)) continue;

      if (article.identity?.key) {
        const key = `identity:${article.identity.key}`;

        if (groups.has(key)) {
          groups.get(key).push(article);
        } else {
          groups.set(key, [article]);
        }

        used.add(article);
      }
    }

    // ============================================================
    // FASE 3: Agrupa por título normalizado (fallback)
    // ============================================================
    // 📚 CORRIGIDO: Em vez de Math.random(), usa o título normalizado.
    // Isso permite que artigos sem DOI mas com mesmo título sejam agrupados.
    const remaining = articles.filter(a => !used.has(a));

    for (const article of remaining) {
      if (article.title) {
        const normalizedTitle = normalizeTitleForIdentity(article.title);
        const key = `title:${normalizedTitle}`;

        if (groups.has(key)) {
          groups.get(key).push(article);
        } else {
          groups.set(key, [article]);
        }

        used.add(article);
      }
    }

    // ============================================================
    // FASE 4: Artigos sem nenhum identificador comum → grupos individuais
    // ============================================================
    const unidentified = articles.filter(a => !used.has(a));

    for (const article of unidentified) {
      groups.set(`single:${article.title || Math.random()}`, [article]);
    }

    return Array.from(groups.values());
  }

  /**
   * Executa o merge de um grupo de artigos.
   * @private
   */
  async #mergeGroup(group, options = {}) {
    // Começa com o primeiro artigo como base
    let mergedData = group[0].toPlainObject();
    const sources = [];

    // Coleta todas as fontes
    for (const article of group) {
      if (article.source) {
        sources.push(article.source);
      }
    }

    // Mescla cada artigo subsequente
    for (let i = 1; i < group.length; i++) {
      mergedData = await this.resolver.mergeArticles(
        mergedData,
        group[i].toPlainObject()
      );
    }

    const result = Article.fromPlainObject(mergedData);

    return {
      merged: result,
      sources: [...new Set(sources)],
      articleCount: group.length,
      wasMerged: true,
    };
  }
}

export default MergeArticlesUseCase;