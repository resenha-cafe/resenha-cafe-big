import { MultiAIReview } from '../domain/multi-ai-review.js';
import { mapMultiAIReview } from './mappers/multi-ai-review.mapper.js';
import { apiClient } from './api.client.js';

export class MultiAIReviewService {
  constructor(client = apiClient) {
    this.client = client;
  }

  async getReview(doi, options = {}) {
    const normalizedDoi = typeof doi === 'string' ? doi.trim() : '';

    if (!normalizedDoi) {
      throw new Error('[MultiAIReviewService] DOI é obrigatório.');
    }

    const params = { doi: normalizedDoi };
    if (options.level) {
      params.level = options.level;
    }

    const response = await this.client.request('MULTI_AI_REVIEW', {
      method: 'GET',
      params,
      signal: options.signal,
    });

    return mapMultiAIReview(response);
  }
}

export const multiAIReviewService = new MultiAIReviewService();
export default MultiAIReviewService;
