import { describe, it, expect } from 'vitest';
import { ArticleMapper } from '../../../../src/services/mappers/article.mapper.js';

describe('ArticleMapper', () => {
  it('deve mapear dados normalizados para Article', () => {
    const raw = {
      title: 'Título teste',
      doi: '10.1234/abc',
      abstract: 'Resumo',
      publication_date: '2024-01-01',
      language: 'pt',
      authors: [{ name: 'Autor', orcid: '0000-0000' }],
      journal: 'Revista',
      publisher: 'Editora',
      license: 'CC BY',
      citations: 5,
    };
    const article = ArticleMapper.toDomain(raw);
    expect(article.title).toBe('Título teste');
    expect(article.journalName).toBe('Revista');
    expect(article.authorCount).toBe(1);
  });
});
