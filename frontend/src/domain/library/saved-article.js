import { Article } from '../article.js';
import { deepFreeze } from '../../utils/deep-freeze.js';

export class SavedArticle {
  constructor({ article, isFavorite = false, notes = '', savedAt = new Date().toISOString() }) {
    if (!article || !(article instanceof Article)) {
      throw new Error('[SavedArticle] article deve ser uma instância de Article.');
    }
    this.article = article;
    this.isFavorite = Boolean(isFavorite);
    this.notes = typeof notes === 'string' ? notes : '';
    const normalizedSavedAt =
      savedAt instanceof Date ? savedAt.toISOString() :
      typeof savedAt === 'string' ? savedAt : '';
    if (!normalizedSavedAt || Number.isNaN(Date.parse(normalizedSavedAt))) {
      throw new Error('[SavedArticle] savedAt deve ser uma data válida.');
    }
    this.savedAt = normalizedSavedAt;
    deepFreeze(this);
  }
  get doi() { return this.article.doi; }
  get title() { return this.article.displayTitle; }
}
export default SavedArticle;
