// src/components/ui/empty-state.js

/**
 * Componente visual para estado vazio.
 * Renderiza uma mensagem amigável e opcionalmente um botão de ação.
 *
 * Efeitos colaterais:
 * - Ao chamar `mount()`, o conteúdo atual do `root` é substituído pelo componente.
 * - Ao chamar `destroy()`, apenas o conteúdo criado pelo componente é removido;
 *   outros elementos adicionados ao `root` após a montagem são preservados.
 *
 * @example
 * const empty = new EmptyState({
 *   root: document.getElementById('results'),
 *   title: 'Nenhum artigo encontrado',
 *   message: 'Tente ajustar os filtros ou realizar uma nova busca.',
 *   action: {
 *     label: 'Limpar filtros',
 *     onClick: () => console.log('Limpar filtros clicado')
 *   }
 * });
 * empty.mount();
 */
export class EmptyState {
  /**
   * @param {Object} options
   * @param {Node} options.root - Nó DOM onde o componente será montado.
   * @param {string} [options.title]
   * @param {string} [options.message]
   * @param {string} [options.icon = '🔍'] - Ícone ou emoji.
   * @param {{ label: string, onClick: Function }} [options.action]
   */
  constructor({ root, title = '', message = '', icon = '🔍', action = null }) {
    if (!root || typeof root.appendChild !== 'function') {
      throw new Error('[EmptyState] root deve ser um nó DOM válido.');
    }

    this.root = root;
    this.title = title;
    this.message = message;
    this.icon = icon;
    this.action = action;

    this.container = null;
    this.actionButton = null;
    this._boundActionHandler = null;
    this.isMounted = false;
  }

  /**
   * Monta o componente no DOM.
   * Se o componente já estiver montado, a chamada é ignorada.
   */
  mount() {
    if (this.isMounted) return;

    // Limpa conteúdo existente no root antes de montar
    this.root.innerHTML = '';

    // Cria container principal
    this.container = document.createElement('div');
    this.container.className = 'empty-state';
    this.container.setAttribute('role', 'status');
    this.container.setAttribute('aria-live', 'polite');

    // Ícone
    if (this.icon) {
      const iconEl = document.createElement('div');
      iconEl.className = 'empty-state__icon';
      iconEl.setAttribute('aria-hidden', 'true');
      iconEl.textContent = this.icon;
      this.container.appendChild(iconEl);
    }

    // Título
    if (this.title) {
      const titleEl = document.createElement('h3');
      titleEl.className = 'empty-state__title';
      titleEl.textContent = this.title;
      this.container.appendChild(titleEl);
    }

    // Mensagem
    if (this.message) {
      const messageEl = document.createElement('p');
      messageEl.className = 'empty-state__message';
      messageEl.textContent = this.message;
      this.container.appendChild(messageEl);
    }

    // Ação opcional
    if (this.action && typeof this.action.onClick === 'function') {
      this.actionButton = document.createElement('button');
      this.actionButton.type = 'button';
      this.actionButton.className = 'empty-state__action';
      this.actionButton.textContent = this.action.label || 'OK';
      this._boundActionHandler = () => this.action.onClick();
      this.actionButton.addEventListener('click', this._boundActionHandler);
      this.container.appendChild(this.actionButton);
    }

    this.root.appendChild(this.container);
    this.isMounted = true;
  }

  /**
   * Remove o componente do DOM e limpa event listeners.
   * Preserva outros elementos que tenham sido adicionados ao `root`.
   */
  destroy() {
    if (!this.isMounted) return;

    if (this.actionButton && this._boundActionHandler) {
      this.actionButton.removeEventListener('click', this._boundActionHandler);
      this._boundActionHandler = null;
    }

    if (this.container) {
      this.container.remove();
      this.container = null;
    }

    this.actionButton = null;
    this.isMounted = false;
  }
}

export default EmptyState;