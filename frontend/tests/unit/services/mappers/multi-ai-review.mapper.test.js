import { describe, it, expect } from 'vitest';
import { mapMultiAIReview } from '../../../../src/services/mappers/multi-ai-review.mapper.js';
import { MultiAIReview } from '../../../../src/domain/multi-ai-review.js';

describe('mapMultiAIReview', () => {
  it('deve mapear resposta completa', () => {
    const raw = {
      doi: '10.1234/abc',
      level: 'medium',
      content: 'Resenha média',
      model: 'claude-3',
      confidence: 0.9,
      sources: ['source1'],
    };
    const review = mapMultiAIReview(raw);
    expect(review).toBeInstanceOf(MultiAIReview);
    expect(review.doi).toBe('10.1234/abc');
    expect(review.content).toBe('Resenha média');
  });

  it('deve aceitar campos alternativos', () => {
    const raw = {
      article_doi: '10.999/xyz',
      review: 'Texto da resenha',
      provider: 'openai',
    };
    const review = mapMultiAIReview(raw);
    expect(review.doi).toBe('10.999/xyz');
    expect(review.content).toBe('Texto da resenha');
  });

  it('deve retornar MultiAIReview.empty para raw inválido', () => {
    const review = mapMultiAIReview(null);
    expect(review).toBeInstanceOf(MultiAIReview);
    expect(review.hasContent).toBe(false);
  });
});
