// src/services/storage.service.js

/**
 * Serviço de persistência no localStorage.
 * Encapsula o acesso ao armazenamento com tratamento de erros.
 */
export class StorageService {
  /**
   * @param {Storage} storage - Implementação de Storage (localStorage, sessionStorage, mock).
   */
  constructor(storage = window.localStorage) {
    this.storage = storage;
  }

  /**
   * Lê um valor do storage.
   * @param {string} key
   * @returns {unknown|null}
   */
  get(key) {
    try {
      const raw = this.storage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch (error) {
      throw new Error(`[StorageService] Falha ao ler a chave "${key}": ${error.message}`);
    }
  }

  /**
   * Grava um valor no storage.
   * @param {string} key
   * @param {unknown} value
   * @returns {boolean}
   */
  set(key, value) {
    try {
      const raw = JSON.stringify(value);
      this.storage.setItem(key, raw);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Remove uma chave.
   * @param {string} key
   * @returns {boolean}
   */
  remove(key) {
    try {
      this.storage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Limpa todas as chaves do domínio da aplicação (prefixo "resenha:").
   */
  clearDomain() {
    const keys = this.getKeysByPrefix('resenha:');
    keys.forEach((key) => this.remove(key));
  }

  /**
   * Retorna chaves com um prefixo.
   * @param {string} prefix
   * @returns {string[]}
   */
  getKeysByPrefix(prefix) {
    const keys = [];
    try {
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(prefix)) {
          keys.push(key);
        }
      }
    } catch {
      // storage indisponível
    }
    return keys;
  }
}

export default StorageService;
