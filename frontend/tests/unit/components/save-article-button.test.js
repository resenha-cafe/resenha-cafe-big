import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SaveArticleButton } from '../../../src/components/library/save-article-button.js';
import { LibraryService } from '../../../src/services/library/library.service.js';
import { StorageService } from '../../../src/services/storage.service.js';
import { Article } from '../../../src/domain/article.js';

class MockStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] ?? null;
  }
  setItem(key, value) {
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

describe('SaveArticleButton', () => {
  let root;
  let library;
  let article;

  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);

    const storage = new MockStorage();
    const storageService = new StorageService(storage);
    library = new LibraryService(storageService);

    article = new Article({
      title: 'Teste',
      doi: '10.1/1',
      authors: [{ name: 'Autor' }],
    });
  });

  it('deve lançar erro se root não for um nó DOM válido', () => {
    expect(
      () => new SaveArticleButton({ root: null, article, libraryService: library })
    ).toThrow('root');
  });

  it('deve lançar erro se article não for instância de Article', () => {
    expect(
      () => new SaveArticleButton({ root, article: {}, libraryService: library })
    ).toThrow('article');
  });

  it('deve lançar erro se libraryService não for fornecido', () => {
    expect(
      () => new SaveArticleButton({ root, article })
    ).toThrow('libraryService');
  });

  it('deve lançar erro se libraryService não for instância de LibraryService', () => {
    expect(
      () => new SaveArticleButton({ root, article, libraryService: {} })
    ).toThrow('libraryService');
  });

  it('deve montar o botão com "Salvar" quando o artigo não está salvo', () => {
    const button = new SaveArticleButton({ root, article, libraryService: library });
    button.mount();
    expect(root.querySelector('button').textContent).toBe('Salvar');
  });

  it('deve salvar o artigo ao clicar e mostrar "Salvo ✓"', () => {
    const button = new SaveArticleButton({ root, article, libraryService: library });
    button.mount();
    const btnEl = root.querySelector('button');
    btnEl.click();
    expect(btnEl.textContent).toBe('Salvo ✓');
    expect(library.has('10.1/1')).toBe(true);
  });

  it('deve remover o artigo ao clicar novamente', () => {
    library.save(article);
    const button = new SaveArticleButton({ root, article, libraryService: library });
    button.mount();
    const btnEl = root.querySelector('button');
    expect(btnEl.textContent).toBe('Salvo ✓');
    btnEl.click();
    expect(btnEl.textContent).toBe('Salvar');
    expect(library.has('10.1/1')).toBe(false);
  });

  it('deve destruir o botão e limpar event listeners', () => {
    const button = new SaveArticleButton({ root, article, libraryService: library });
    button.mount();
    button.destroy();
    expect(root.innerHTML).toBe('');
  });

  it('não deve criar uma nova instância de LibraryService internamente', () => {
    const spy = vi.spyOn(LibraryService.prototype, 'has');
    const button = new SaveArticleButton({ root, article, libraryService: library });
    button.mount();
    expect(spy).toHaveBeenCalledWith('10.1/1');
    spy.mockRestore();
  });
});
