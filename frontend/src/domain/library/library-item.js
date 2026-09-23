import { SavedArticle } from './saved-article.js';
import { deepFreeze } from '../../utils/deep-freeze.js';

export class LibraryItem {
  constructor({ savedArticle, listId = 'default', createdAt = new Date().toISOString() }) {
    if (!savedArticle || !(savedArticle instanceof SavedArticle)) {
      throw new Error('[LibraryItem] savedArticle deve ser uma instância de SavedArticle.');
    }
    this.savedArticle = savedArticle;
    this.listId = typeof listId === 'string' ? listId : 'default';
    this.createdAt = createdAt instanceof Date ? createdAt.toISOString() : createdAt;
    deepFreeze(this);
  }
  get doi() { return this.savedArticle.article.doi; }
}
export default LibraryItem;
