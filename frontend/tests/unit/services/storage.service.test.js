import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService } from '../../../src/services/storage.service.js';

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
  clear() {
    this.store = {};
  }
  key(index) {
    return Object.keys(this.store)[index] ?? null;
  }
  get length() {
    return Object.keys(this.store).length;
  }
}

describe('StorageService', () => {
  let storage;
  let service;

  beforeEach(() => {
    storage = new MockStorage();
    service = new StorageService(storage);
  });

  it('deve gravar e ler um valor', () => {
    expect(service.set('chave', { a: 1 })).toBe(true);
    expect(service.get('chave')).toEqual({ a: 1 });
  });

  it('deve retornar null se a chave não existir', () => {
    expect(service.get('nao-existe')).toBeNull();
  });

  it('deve lançar erro se os dados estiverem corrompidos', () => {
    storage.setItem('chave', '{json inválido');
    expect(() => service.get('chave')).toThrow();
  });

  it('deve remover uma chave', () => {
    service.set('chave', 'valor');
    expect(service.remove('chave')).toBe(true);
    expect(service.get('chave')).toBeNull();
  });

  it('deve limpar apenas chaves do domínio', () => {
    storage.setItem('resenha:a', '1');
    storage.setItem('resenha:b', '2');
    storage.setItem('outra', '3');

    service.clearDomain();

    expect(service.get('resenha:a')).toBeNull();
    expect(service.get('resenha:b')).toBeNull();
    expect(storage.getItem('outra')).toBe('3');
  });
});
