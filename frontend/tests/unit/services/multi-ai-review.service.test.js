import { describe, it, expect, vi } from 'vitest';
import { MultiAIReviewService } from '../../../src/services/multi-ai-review.service.js';
import { MultiAIReview } from '../../../src/domain/multi-ai-review.js';

class MockApiClient {
  constructor(response) {
    this.response = response;
    this.request = vi.fn().mockImplementation(async () => this.response);
  }
}

describe('MultiAIReviewService', () => {
  it('deve obter resenha para DOI válido', async () => {
    const rawResponse = { doi: '10.1234/abc', content: 'Resenha', model: 'gpt-4', confidence: 0.8 };
    const client = new MockApiClient(rawResponse);
    const service = new MultiAIReviewService(client);
    const review = await service.getReview('10.1234/abc');
    expect(review).toBeInstanceOf(MultiAIReview);
    expect(review.content).toBe('Resenha');
  });

  it('deve lançar erro para DOI vazio', async () => {
    const client = new MockApiClient({});
    const service = new MultiAIReviewService(client);
    await expect(service.getReview('')).rejects.toThrow('DOI é obrigatório');
    expect(client.request).not.toHaveBeenCalled();
  });

  it('deve aceitar level e signal', async () => {
    const rawResponse = { doi: '10.1/1', content: 'Resenha', level: 'long' };
    const client = new MockApiClient(rawResponse);
    const service = new MultiAIReviewService(client);
    const controller = new AbortController();
    await service.getReview('10.1/1', { level: 'long', signal: controller.signal });
    expect(client.request).toHaveBeenCalledWith(
      'MULTI_AI_REVIEW',
      expect.objectContaining({
        params: { doi: '10.1/1', level: 'long' },
        signal: controller.signal,
      })
    );
  });
});
