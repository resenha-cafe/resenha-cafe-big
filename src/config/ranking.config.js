/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Config — Ranking Configuration
 * ============================================================
 *
 * 📚 AULA: Configuração de ranking.
 * 
 * O ranking determina a ordem dos resultados de busca.
 * Cada dimensão tem um peso (quanto maior, mais importante).
 * 
 * 📚 Dimensões de ranking:
 * 
 * - title: match da query no título (30% — mais importante)
 * - abstract: match da query no resumo (15%)
 * - citations: número de citações (20%)
 * - openAccess: artigo é acesso aberto (10%)
 * - pdf: artigo tem PDF disponível (5%)
 * - year: quão recente é o artigo (5%)
 * - quality: qualidade dos metadados (10%)
 * - confidence: confiança do provider (5%)
 * 
 * Os pesos somam 100% (1.0).
 * 
 * 📚 deepFreeze no objeto raiz é suficiente — ele é recursivo.
 * 
 * feat(config): add ranking configuration with dimension weights
 */

import { deepFreeze } from "../utils/deep-freeze.js";

/**
 * Configuração de ranking.
 * 
 * @constant {Object} rankingConfig — Imutável (deepFreeze recursivo)
 */
export const rankingConfig = deepFreeze({
  /**
   * Pesos das dimensões de ranking.
   * Todos os valores entre 0 e 1. A soma ideal é 1.0.
   */
  weights: {
    /** Match da query no título */
    title: 0.30,

    /** Match da query no resumo */
    abstract: 0.15,

    /** Número de citações (log scale) */
    citations: 0.20,

    /** Artigo é acesso aberto */
    openAccess: 0.10,

    /** Artigo tem PDF disponível */
    pdf: 0.05,

    /** Quão recente é o artigo */
    year: 0.05,

    /** Qualidade dos metadados (campos preenchidos) */
    quality: 0.10,

    /** Confiança do provider no resultado */
    confidence: 0.05,
  },

  /**
   * Score mínimo para incluir nos resultados.
   * Artigos com score abaixo disso são descartados.
   */
  minScore: 0.1,

  /**
   * Limite padrão de resultados.
   */
  defaultLimit: 20,

  /**
   * Decaimento de ano.
   * Artigos mais antigos perdem relevância gradualmente.
   */
  yearDecay: {
    /** Até 1 ano: score máximo */
    recent: { maxAge: 1, score: 1.0 },
    /** 1-5 anos: score alto */
    medium: { maxAge: 5, score: 0.9 },
    /** 5-10 anos: score médio */
    older: { maxAge: 10, score: 0.7 },
    /** 10-20 anos: score baixo */
    old: { maxAge: 20, score: 0.5 },
    /** +20 anos: score mínimo */
    veryOld: { maxAge: Infinity, score: 0.3 },
  },
});

export default rankingConfig;