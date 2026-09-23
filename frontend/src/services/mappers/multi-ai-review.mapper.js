import { MultiAIReview } from '../../domain/multi-ai-review.js';

export function mapMultiAIReview(raw) {
  if (!raw || typeof raw !== 'object') {
    return MultiAIReview.empty(raw?.doi || '');
  }

  return new MultiAIReview({
    doi: raw.doi || raw.article_doi || '',
    level: raw.level || raw.size || '',
    content: raw.content || raw.review || raw.text || '',
    model: raw.model || raw.provider || '',
    confidence: raw.confidence ?? 0,
    sources: Array.isArray(raw.sources) ? raw.sources : [],
  });
}

export default mapMultiAIReview;
