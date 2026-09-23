import { describe, it, expect, beforeEach } from 'vitest';
import { LibraryService } from '../../../../src/services/library/library.service.js';
import { StorageService } from '../../../../src/services/storage.service.js';
import { Article } from '../../../../src/domain/article.js';

class MockStorage {
  constructor() {
    this.store = {};
    this.failNextSet = false;
  }
  getItem(key) {
    return this.store[key] ?? null;
  }
  setItem(key, value) {
    if (this.failNextSet) {
      this.failNextSet = false;
      throw new Error('Falha de storage');
    }
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  key(index) {
    return Object.keys(this.store)[index] ?? null;
  }
  get length() {
    return Object.keys(this.store).length;
  }
}

describe('LibraryService', () => {
  let storage;
  let storageService;
  let library;

  const article = new Article({
    title: 'Artigo Teste',
    doi: '10.1234/abc',
    authors: [{ name: 'Autor' }],
  });

  beforeEach(() => {
    storage = new MockStorage();
    storageService = new StorageService(storage);
    library = new LibraryService(storageService);
  });

  it('deve salvar artigo e evitar duplicação', () => {
    const saved1 = library.save(article);
    const saved2 = library.save(article);

    expect(saved1).toBe(saved2);
    expect(library.getAll().length).toBe(1);
    expect(library.has('10.1234/abc')).toBe(true);
  });

  it('deve remover artigo e persistir', () => {
    library.save(article);
    expect(library.remove('10.1234/abc')).toBe(true);
    expect(library.has('10.1234/abc')).toBe(false);
    expect(library.getAll().length).toBe(0);
  });

  it('deve fazer rollback se a remoção falhar', () => {
    library.save(article);
    storage.failNextSet = true;
    expect(() => library.remove('10.1234/abc')).toThrow();
    expect(library.has('10.1234/abc')).toBe(true);
  });

  it('deve alternar favorito', () => {
    library.save(article);
    expect(library.toggleFavorite('10.1234/abc')).toBe(true);
    expect(library.get('10.1234/abc').isFavorite).toBe(true);
  });

  it('deve atualizar anotações', () => {
    library.save(article);
    const updated = library.updateNotes('10.1234/abc', 'Minha anotação');
    expect(updated.notes).toBe('Minha anotação');
  });

  it('deve retornar favoritos', () => {
    library.save(article, { isFavorite: true });
    const article2 = new Article({ title: 'Outro', doi: '10.999/xyz' });
    library.save(article2);
    expect(library.getFavorites().length).toBe(1);
  });

  it('deve carregar dados do storage', () => {
    library.save(article);
    const newLibrary = new LibraryService(storageService);
    expect(newLibrary.has('10.1234/abc')).toBe(true);
  });

  it('deve ignorar itens corrompidos no storage', () => {
    const validArticle = new Article({ title: 'Válido', doi: '10.1/1' });
    library.save(validArticle);

    const raw = storageService.get('resenha:library');
    raw.push({ article: 'LIXO' });
    storage.store['resenha:library'] = JSON.stringify(raw);

    const newLibrary = new LibraryService(storageService);
    expect(newLibrary.getAll().length).toBe(1);
    expect(newLibrary.has('10.1/1')).toBe(true);
  });
});
