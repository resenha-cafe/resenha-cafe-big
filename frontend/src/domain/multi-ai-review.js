import { deepFreeze } from '../utils/deep-freeze.js';

export class MultiAIReview {
  constructor({ doi = '', level = '', content = '', model = '', confidence = 0, sources = [] } = {}) {
    this.doi = typeof doi === 'string' ? doi : '';
    this.level = typeof level === 'string' ? level : '';
    this.content = typeof content === 'string' ? content : '';
    this.model = typeof model === 'string' ? model : '';
    const confidenceValue = Number(confidence);
    this.confidence = Number.isFinite(confidenceValue) ? Math.min(1, Math.max(0, confidenceValue)) : 0;
    this.sources = Array.isArray(sources) ? [...sources] : [];
    deepFreeze(this);
  }
  get hasContent() { return this.content.trim().length > 0; }
  get hasDoi() { return this.doi.trim().length > 0; }
  static empty(doi = '') { return new MultiAIReview({ doi }); }
}
export default MultiAIReview;
