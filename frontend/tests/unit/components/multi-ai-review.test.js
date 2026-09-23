import { describe, it, expect, beforeEach } from 'vitest';
import { MultiAIReviewComponent } from '../../../src/components/article/multi-ai-review.js';
import { MultiAIReview } from '../../../src/domain/multi-ai-review.js';

describe('MultiAIReviewComponent', () => {
  let root;
  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
  });

  it('deve montar e exibir resenha', () => {
    const review = new MultiAIReview({ doi: '10.1/1', content: 'Resenha completa', model: 'gpt-4', confidence: 0.9 });
    const component = new MultiAIReviewComponent({ root, review });
    component.mount();
    expect(root.textContent).toContain('Resenha Multi-IA');
    expect(root.textContent).toContain('Resenha completa');
  });

  it('deve esconder root se não houver conteúdo', () => {
    const review = new MultiAIReview({ doi: '10.1/1' });
    const component = new MultiAIReviewComponent({ root, review });
    component.mount();
    expect(root.hidden).toBe(true);
  });

  it('deve destruir e limpar o DOM', () => {
    const review = new MultiAIReview({ doi: '10.1/1', content: 'abc' });
    const component = new MultiAIReviewComponent({ root, review });
    component.mount();
    component.destroy();
    expect(root.innerHTML).toBe('');
  });
});
