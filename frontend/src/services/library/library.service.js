// src/services/library/library.service.js

import { Article } from '../../domain/article.js';
import { SavedArticle } from '../../domain/library/saved-article.js';
import { StorageService } from '../storage.service.js';

/**
 * Serviço de biblioteca.
 * Gerencia artigos salvos, favoritos e persistência.
 *
 * Regra de consistência:
 * Toda mutação atualiza memória, tenta persistir e, se falhar,
 * reverte a memória e lança erro.
 */
export class LibraryService {
  constructor(storageService = new StorageService()) {
    this.storageService = storageService;
    this.items = new Map();
    this._loadFromStorage();
  }

  save(article, options = {}) {
    if (!article || !(article instanceof Article)) {
      throw new TypeError('[LibraryService] article deve ser uma instância de Article.');
    }
    if (!article.doi) {
      throw new Error('[LibraryService] DOI é obrigatório para salvar artigo.');
    }

    const existing = this.items.get(article.doi);
    if (existing) {
      return existing;
    }

    const savedArticle = new SavedArticle({
      article,
      isFavorite: Boolean(options.isFavorite),
      notes: options.notes || '',
      savedAt: new Date().toISOString(),
    });

    this.items.set(article.doi, savedArticle);

    const persisted = this._persist();
    if (!persisted) {
      this.items.delete(article.doi);
      throw new Error('[LibraryService] Falha ao persistir artigo.');
    }

    return savedArticle;
  }

  remove(doi) {
    const saved = this.items.get(doi);
    if (!saved) return false;

    this.items.delete(doi);

    const persisted = this._persist();
    if (!persisted) {
      this.items.set(doi, saved);
      throw new Error('[LibraryService] Falha ao persistir remoção.');
    }

    return true;
  }

  has(doi) {
    return this.items.has(doi);
  }

  get(doi) {
    return this.items.get(doi) || null;
  }

  getAll() {
    return Array.from(this.items.values());
  }

  toggleFavorite(doi) {
    const saved = this.items.get(doi);
    if (!saved) return false;

    const updated = new SavedArticle({
      article: saved.article,
      isFavorite: !saved.isFavorite,
      notes: saved.notes,
      savedAt: saved.savedAt,
    });

    this.items.set(doi, updated);

    const persisted = this._persist();
    if (!persisted) {
      this.items.set(doi, saved);
      throw new Error('[LibraryService] Falha ao persistir favorito.');
    }

    return updated.isFavorite;
  }

  updateNotes(doi, notes) {
    const saved = this.items.get(doi);
    if (!saved) return null;

    const updated = new SavedArticle({
      article: saved.article,
      isFavorite: saved.isFavorite,
      notes: typeof notes === 'string' ? notes : '',
      savedAt: saved.savedAt,
    });

    this.items.set(doi, updated);

    const persisted = this._persist();
    if (!persisted) {
      this.items.set(doi, saved);
      throw new Error('[LibraryService] Falha ao persistir anotações.');
    }

    return updated;
  }

  getFavorites() {
    return this.getAll().filter((item) => item.isFavorite);
  }

  _persist() {
    const data = this.getAll().map((savedArticle) => ({
      article: savedArticle.article,
      isFavorite: savedArticle.isFavorite,
      notes: savedArticle.notes,
      savedAt: savedArticle.savedAt,
    }));
    return this.storageService.set('resenha:library', data);
  }

  _loadFromStorage() {
    try {
      const raw = this.storageService.get('resenha:library');
      if (!Array.isArray(raw)) return;

      raw.forEach((item) => {
        try {
          const article = new Article(item.article);
          if (!article.doi) return;

          const savedArticle = new SavedArticle({
            article,
            isFavorite: item.isFavorite,
            notes: item.notes,
            savedAt: item.savedAt,
          });
          this.items.set(article.doi, savedArticle);
        } catch {
          // item inválido, ignora
        }
      });
    } catch {
      // storage corrompido ou indisponível
    }
  }
}

export default LibraryService;
