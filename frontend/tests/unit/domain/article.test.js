// tests/unit/domain/article.test.js

import { describe, expect, it } from 'vitest';
import { Article } from '../../../src/domain/article.js';

describe('Article', () => {
  it('deve criar um artigo com valores padrão', () => {
    const article = new Article();

    expect(article.title).toBe('');
    expect(article.doi).toBe('');
    expect(article.abstract).toBe('');
    expect(article.authors).toEqual([]);
    expect(article.hasDoi).toBe(false);
    expect(article.hasAbstract).toBe(false);
    expect(article.hasAuthors).toBe(false);
  });

  it('deve normalizar DOI puro e remover espaços externos', () => {
    const article = new Article({
      doi: '  10.1234/ABC  ',
    });

    expect(article.doi).toBe('10.1234/ABC');
    expect(article.hasDoi).toBe(true);
  });

  it('deve normalizar DOI com prefixo doi:', () => {
    const variations = [
      'doi:10.1234/ABC',
      'DOI:10.1234/ABC',
      'doi: 10.1234/ABC',
      ' DOI: 10.1234/ABC ',
    ];

    variations.forEach((doi) => {
      const article = new Article({ doi });

      expect(article.doi).toBe('10.1234/ABC');
      expect(article.hasDoi).toBe(true);
    });
  });

  it('deve normalizar DOI informado como URL doi.org', () => {
    const variations = [
      'https://doi.org/10.1234/ABC',
      'http://doi.org/10.1234/ABC',
      'https://dx.doi.org/10.1234/ABC',
      'http://dx.doi.org/10.1234/ABC',
      ' HTTPS://DOI.ORG/10.1234/ABC ',
    ];

    variations.forEach((doi) => {
      const article = new Article({ doi });

      expect(article.doi).toBe('10.1234/ABC');
      expect(article.hasDoi).toBe(true);
    });
  });

  it('não deve alterar a caixa do DOI durante a normalização', () => {
    const article = new Article({
      doi: 'https://doi.org/10.1234/AbC-XyZ',
    });

    expect(article.doi).toBe('10.1234/AbC-XyZ');
  });

  it('deve tratar DOI não string como ausente', () => {
    const values = [
      null,
      undefined,
      12345,
      {},
      [],
    ];

    values.forEach((doi) => {
      const article = new Article({ doi });

      expect(article.doi).toBe('');
      expect(article.hasDoi).toBe(false);
    });
  });

  it('deve manter os demais dados normalizados do artigo', () => {
    const article = new Article({
      title: '  Título do artigo  ',
      doi: 'https://doi.org/10.1234/ABC',
      abstract: 'Resumo do artigo',
      publicationDate: '2026-01-01',
      language: 'pt',
      type: 'article',
      url: 'https://example.org/article',
      openAccess: true,
      peerReviewed: true,
      authors: [
        { name: 'Autor 1', orcid: '', affiliation: '' },
        { name: 'Autor 2', orcid: '', affiliation: '' },
      ],
      journal: 'Revista Científica',
      publisher: 'Editora',
      license: 'CC BY',
      citations: 10,
      references: ['10.1234/ref'],
      confidence: 0.8,
      source: 'openalex',
    });

    expect(article.title).toBe('  Título do artigo  ');
    expect(article.displayTitle).toBe('Título do artigo');
    expect(article.doi).toBe('10.1234/ABC');
    expect(article.hasDoi).toBe(true);
    expect(article.hasAbstract).toBe(true);
    expect(article.hasAuthors).toBe(true);
    expect(article.authorCount).toBe(2);
    expect(article.firstAuthor).toBe('Autor 1');
    expect(article.journalName).toBe('Revista Científica');
    expect(article.hasCitations).toBe(true);
    expect(article.isComplete).toBe(true);
  });
});