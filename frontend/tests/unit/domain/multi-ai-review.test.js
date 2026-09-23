import { describe, it, expect } from 'vitest';
import { MultiAIReview } from '../../../src/domain/multi-ai-review.js';

describe('MultiAIReview', () => {
  it('deve criar uma instância válida', () => {
    const review = new MultiAIReview({
      doi: '10.1234/abc',
      level: 'short',
      content: 'Resenha curta',
      model: 'gpt-4',
      confidence: 0.85,
      sources: ['source1', 'source2'],
    });
    expect(review.doi).toBe('10.1234/abc');
    expect(review.hasContent).toBe(true);
    expect(review.confidence).toBe(0.85);
    expect(review.sources.length).toBe(2);
  });

  it('deve normalizar confidence entre 0 e 1', () => {
    const r1 = new MultiAIReview({ confidence: 1.5 });
    const r2 = new MultiAIReview({ confidence: -0.5 });
    expect(r1.confidence).toBe(1);
    expect(r2.confidence).toBe(0);
  });

  it('deve retornar hasDoi true apenas se houver DOI', () => {
    expect(new MultiAIReview({ doi: '10.1/1' }).hasDoi).toBe(true);
    expect(new MultiAIReview().hasDoi).toBe(false);
  });

  it('deve criar instância vazia com empty()', () => {
    const empty = MultiAIReview.empty('10.1/1');
    expect(empty.doi).toBe('10.1/1');
    expect(empty.hasContent).toBe(false);
  });

  it('deve ser imutável', () => {
    const review = new MultiAIReview({ doi: '10.1/1', content: 'abc' });
    expect(() => {
      review.content = 'novo';
    }).toThrow();
  });
});
