import { MultiAIReview } from '../../domain/multi-ai-review.js';

export class MultiAIReviewComponent {
  constructor({ root, review }) {
    if (!root || typeof root.appendChild !== 'function') {
      throw new Error('[MultiAIReviewComponent] root deve ser um nó DOM válido.');
    }
    if (!review || !(review instanceof MultiAIReview)) {
      throw new Error('[MultiAIReviewComponent] review deve ser uma instância de MultiAIReview.');
    }
    this.root = root;
    this.review = review;
    this.container = null;
    this.isMounted = false;
  }

  mount() {
    if (this.isMounted) return;
    this.root.innerHTML = '';
    this.root.hidden = false;

    if (!this.review.hasContent) {
      this.root.hidden = true;
      this.isMounted = true;
      return;
    }

    this.container = document.createElement('section');
    this.container.className = 'multi-ai-review';

    const title = document.createElement('h2');
    title.textContent = 'Resenha Multi-IA';
    this.container.appendChild(title);

    const content = document.createElement('div');
    content.className = 'multi-ai-review__content';

    const text = document.createElement('p');
    text.textContent = this.review.content;
    content.appendChild(text);

    if (this.review.model) {
      const model = document.createElement('p');
      model.className = 'multi-ai-review__model';
      model.textContent = `Modelo: ${this.review.model}`;
      content.appendChild(model);
    }

    if (this.review.confidence > 0) {
      const confidence = document.createElement('p');
      confidence.className = 'multi-ai-review__confidence';
      confidence.textContent = `Confiança: ${Math.round(this.review.confidence * 100)}%`;
      content.appendChild(confidence);
    }

    this.container.appendChild(content);
    this.root.appendChild(this.container);
    this.isMounted = true;
  }

  destroy() {
    if (!this.isMounted) return;
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    this.root.innerHTML = '';
    this.root.hidden = false;
    this.isMounted = false;
  }
}

export default MultiAIReviewComponent;
