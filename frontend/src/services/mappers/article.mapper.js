// src/services/mappers/article.mapper.js

import { Article } from '../../domain/article.js';
import { deepFreeze } from '../../utils/deep-freeze.js';

/**
 * Mapper responsável por converter dados crus de um artigo
 * (formato normalizado do Worker) em uma instância de domínio `Article`.
 *
 * O Worker V4 já entrega os dados normalizados; este mapper apenas
 * adapta pequenas variações de nomenclatura e estrutura.
 */
export class ArticleMapper {
  /**
   * Converte dados crus em Article, detectando a fonte.
   * @param {Object} data
   * @param {string} [source]
   * @returns {Article}
   */
  static toDomain(data, source = null) {
    if (!data || typeof data !== 'object') {
      return Article.empty();
    }

    const detectedSource = source || data.source || data.provider || data.origin || '';
    const normalizedSource = normalizeSource(detectedSource);

    switch (normalizedSource) {
      case 'openalex':
        return ArticleMapper.#fromOpenAlex(data);
      case 'crossref':
        return ArticleMapper.#fromCrossRef(data);
      case 'semanticscholar':
        return ArticleMapper.#fromSemanticScholar(data);
      case 'europepmc':
        return ArticleMapper.#fromEuropePMC(data);
      case 'scielo':
        return ArticleMapper.#fromSciELO(data);
      case 'core':
        return ArticleMapper.#fromCORE(data);
      default:
        return ArticleMapper.#generic(data);
    }
  }

  static #fromOpenAlex(data) {
    return new Article({
      title: data.title,
      doi: data.doi,
      abstract: data.abstract,
      publicationDate: data.publication_date,
      language: data.language,
      type: data.type,
      url: data.url,
      openAccess: data.open_access,
      peerReviewed: data.peer_reviewed,
      authors: data.authors?.map((a) => ({
        name: a.name,
        orcid: a.orcid,
        affiliation: a.affiliation,
      })),
      journal: normalizeJournal(data.journal),
      publisher: normalizePublisher(data.publisher),
      license: normalizeLicense(data.license),
      citations: data.cited_by_count,
      references: data.references,
      confidence: data.confidence,
      source: 'openalex',
    });
  }

  static #fromCrossRef(data) {
    return new Article({
      title: data.title,
      doi: data.doi,
      abstract: data.abstract,
      publicationDate: data.publication_date,
      language: data.language,
      type: data.type,
      url: data.url,
      openAccess: data.open_access,
      peerReviewed: data.peer_reviewed,
      authors: data.authors?.map((a) => ({
        name: a.name,
        orcid: a.orcid,
        affiliation: a.affiliation,
      })),
      journal: normalizeJournal(data.journal),
      publisher: normalizePublisher(data.publisher),
      license: normalizeLicense(data.license),
      citations: data.citations,
      references: data.references,
      confidence: data.confidence,
      source: 'crossref',
    });
  }

  static #fromSemanticScholar(data) {
    return new Article({
      title: data.title,
      doi: data.doi,
      abstract: data.abstract,
      publicationDate: data.publication_date,
      language: data.language,
      type: data.type,
      url: data.url,
      openAccess: data.open_access,
      peerReviewed: data.peer_reviewed,
      authors: data.authors?.map((a) => ({
        name: a.name,
        orcid: a.orcid,
        affiliation: a.affiliation,
      })),
      journal: normalizeJournal(data.journal),
      publisher: normalizePublisher(data.publisher),
      license: normalizeLicense(data.license),
      citations: data.citations,
      references: data.references,
      confidence: data.confidence,
      source: 'semanticscholar',
    });
  }

  static #fromEuropePMC(data) {
    return new Article({
      title: data.title,
      doi: data.doi,
      abstract: data.abstract,
      publicationDate: data.publication_date,
      language: data.language,
      type: data.type,
      url: data.url,
      openAccess: data.open_access,
      peerReviewed: data.peer_reviewed,
      authors: data.authors?.map((a) => ({
        name: a.name,
        orcid: a.orcid,
        affiliation: a.affiliation,
      })),
      journal: normalizeJournal(data.journal),
      publisher: normalizePublisher(data.publisher),
      license: normalizeLicense(data.license),
      citations: data.citations,
      references: data.references,
      confidence: data.confidence,
      source: 'europepmc',
    });
  }

  static #fromSciELO(data) {
    return new Article({
      title: data.title,
      doi: data.doi,
      abstract: data.abstract,
      publicationDate: data.publication_date,
      language: data.language,
      type: data.type,
      url: data.url,
      openAccess: data.open_access,
      peerReviewed: data.peer_reviewed,
      authors: data.authors?.map((a) => ({
        name: a.name,
        orcid: a.orcid,
        affiliation: a.affiliation,
      })),
      journal: normalizeJournal(data.journal),
      publisher: normalizePublisher(data.publisher),
      license: normalizeLicense(data.license),
      citations: data.citations,
      references: data.references,
      confidence: data.confidence,
      source: 'scielo',
    });
  }

  static #fromCORE(data) {
    return new Article({
      title: data.title,
      doi: data.doi,
      abstract: data.abstract,
      publicationDate: data.publication_date,
      language: data.language,
      type: data.type,
      url: data.url,
      openAccess: data.open_access,
      peerReviewed: data.peer_reviewed,
      authors: data.authors?.map((a) => ({
        name: a.name,
        orcid: a.orcid,
        affiliation: a.affiliation,
      })),
      journal: normalizeJournal(data.journal),
      publisher: normalizePublisher(data.publisher),
      license: normalizeLicense(data.license),
      citations: data.citations,
      references: data.references,
      confidence: data.confidence,
      source: 'core',
    });
  }

  static #generic(data) {
    return new Article({
      title: data.title || data.article_title || data.display_name || '',
      doi: data.doi,
      abstract: data.abstract || data.description || data.summary || '',
      publicationDate: data.publicationDate || data.publication_date || data.date,
      language: data.language,
      type: data.type || data.article_type || '',
      url: data.url || data.landing_page_url || data.web_url || '',
      openAccess: Boolean(
        data.open_access || data.openAccess || data.is_oa || data.oa_status === 'gold'
      ),
      peerReviewed: Boolean(data.peer_reviewed || data.peerReviewed),
      authors: data.authors?.map((a) => ({
        name: a.name || a.full_name || a.display_name || '',
        orcid: a.orcid || a.orcid_id || '',
        affiliation: a.affiliation || a.institution || '',
      })) || [],
      journal: normalizeJournal(data.journal),
      publisher: normalizePublisher(data.publisher),
      license: normalizeLicense(data.license),
      citations: data.citations || data.cited_by_count || data.times_cited || 0,
      references: data.references || [],
      confidence: data.confidence || data.score || 0,
      source: data.source || data.provider || 'unknown',
    });
  }
}

/**
 * Normaliza o nome da fonte, removendo espaços, underscores e hífens.
 * Ex.: "semantic-scholar" -> "semanticscholar"
 */
function normalizeSource(source) {
  return String(source || '')
    .toLowerCase()
    .trim()
    .replace(/[_\s-]+/g, '');
}

/**
 * Normaliza o campo journal para string ou objeto.
 */
function normalizeJournal(value) {
  if (typeof value === 'string') return value.trim();
  if (value && typeof value === 'object') {
    return {
      name: value.name || value.title || '',
      issn: value.issn || value.ISSN || '',
      publisher: value.publisher || '',
    };
  }
  return '';
}

/**
 * Normaliza o campo publisher para string ou objeto.
 */
function normalizePublisher(value) {
  if (typeof value === 'string') return value.trim();
  if (value && typeof value === 'object') {
    return {
      name: value.name || value.publisher || '',
    };
  }
  return '';
}

/**
 * Normaliza o campo license para string ou objeto.
 */
function normalizeLicense(value) {
  if (typeof value === 'string') return value.trim();
  if (value && typeof value === 'object') {
    return {
      name: value.name || value.title || '',
      url: value.url || '',
      type: value.type || '',
    };
  }
  return '';
}

export default ArticleMapper;
