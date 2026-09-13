// src/components/ui/modal.js

/**
 * Componente visual de modal acessível.
 * Renderiza um diálogo com overlay, suporta fechamento por clique no overlay,
 * tecla Esc, botão fechar e ações configuráveis.
 *
 * Efeitos colaterais:
 * - Ao montar, o modal é adicionado ao `root` sem limpar seu conteúdo prévio.
 * - O foco é movido para o primeiro elemento focável do modal.
 * - Ao desmontar, o foco é restaurado ao elemento que estava ativo antes da montagem.
 *
 * @example
 * const modal = new Modal({
 *   root: document.body,
 *   title: 'Confirmar ação',
 *   content: 'Deseja realmente excluir este item?',
 *   actions: [
 *     { label: 'Cancelar', onClick: () => modal.destroy() },
 *     { label: 'Excluir', onClick: () => console.log('Excluído'), className: 'btn-danger' }
 *   ]
 * });
 * modal.mount();
 */
export class Modal {
  /**
   * @param {Object} options
   * @param {Node} options.root - Nó DOM onde o modal será montado.
   * @param {string} [options.title] - Título do modal.
   * @param {string|Node} [options.content] - Conteúdo textual ou nó DOM.
   * @param {boolean} [options.closeOnOverlay = true] - Fecha ao clicar no overlay.
   * @param {boolean} [options.closeOnEscape = true] - Fecha ao pressionar Esc.
   * @param {Array<{label: string, onClick: Function, className?: string}>} [options.actions = []]
   * @param {Function} [options.onClose] - Callback executado ao fechar.
   */
  constructor({
    root,
    title = '',
    content = '',
    closeOnOverlay = true,
    closeOnEscape = true,
    actions = [],
    onClose = null,
  }) {
    if (!root || typeof root.appendChild !== 'function') {
      throw new Error('[Modal] root deve ser um nó DOM válido.');
    }

    this.root = root;
    this.title = title;
    this.content = content;
    this.closeOnOverlay = closeOnOverlay;
    this.closeOnEscape = closeOnEscape;
    this.actions = actions;
    this.onClose = onClose;

    this.overlay = null;
    this.dialog = null;
    this.closeButton = null;
    this._previouslyFocused = null;
    this._boundKeydown = null;
    this._boundOverlayClick = null;
    this._idBase = `modal-${Modal._nextId++}`;
    this.isMounted = false;
  }

  static _nextId = 0;

  /**
   * Monta o modal no DOM.
   */
  mount() {
    if (this.isMounted) return;

    this._previouslyFocused = document.activeElement;

    // Overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    // O overlay não deve ser marcado como aria-hidden, pois contém o diálogo acessível.

    // Dialog
    this.dialog = document.createElement('div');
    this.dialog.className = 'modal';
    this.dialog.setAttribute('role', 'dialog');
    this.dialog.setAttribute('aria-modal', 'true');
    if (this.title) {
      const titleId = `${this._idBase}-title`;
      this.dialog.setAttribute('aria-labelledby', titleId);
    }

    // Cabeçalho
    if (this.title) {
      const titleEl = document.createElement('h2');
      titleEl.id = `${this._idBase}-title`;
      titleEl.className = 'modal__title';
      titleEl.textContent = this.title;
      this.dialog.appendChild(titleEl);
    }

    // Botão fechar (X)
    this.closeButton = document.createElement('button');
    this.closeButton.type = 'button';
    this.closeButton.className = 'modal__close';
    this.closeButton.setAttribute('aria-label', 'Fechar');
    this.closeButton.textContent = '×'; // caractere Unicode, sem innerHTML
    this.dialog.appendChild(this.closeButton);

    // Conteúdo
    const contentEl = document.createElement('div');
    contentEl.className = 'modal__content';
    if (typeof this.content === 'string') {
      contentEl.textContent = this.content;
    } else if (this.content instanceof Node) {
      contentEl.appendChild(this.content);
    }
    this.dialog.appendChild(contentEl);

    // Ações
    if (this.actions.length > 0) {
      const actionsContainer = document.createElement('div');
      actionsContainer.className = 'modal__actions';

      this.actions.forEach((action) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `modal__action ${action.className || ''}`.trim();
        btn.textContent = action.label;
        btn.addEventListener('click', (event) => {
          action.onClick(event, this);
        });
        actionsContainer.appendChild(btn);
      });

      this.dialog.appendChild(actionsContainer);
    }

    this.overlay.appendChild(this.dialog);
    this.root.appendChild(this.overlay);

    // Event listeners
    this._boundKeydown = (event) => this._handleKeydown(event);
    document.addEventListener('keydown', this._boundKeydown);

    if (this.closeOnOverlay) {
      this._boundOverlayClick = (event) => {
        if (event.target === this.overlay) {
          this.destroy();
        }
      };
      this.overlay.addEventListener('click', this._boundOverlayClick);
    }

    // Fechar pelo botão X
    this.closeButton.addEventListener('click', () => this.destroy());

    // Gerenciamento de foco
    this._trapFocusInitial();

    this.isMounted = true;
  }

  /**
   * Remove o modal do DOM, restaura o foco e executa o callback onClose.
   */
  destroy() {
    if (!this.isMounted) return;

    // Marca como desmontado antes de chamar onClose para permitir reabertura imediata
    this.isMounted = false;

    document.removeEventListener('keydown', this._boundKeydown);
    if (this._boundOverlayClick) {
      this.overlay.removeEventListener('click', this._boundOverlayClick);
      this._boundOverlayClick = null;
    }

    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
      this.dialog = null;
      this.closeButton = null;
    }

    // Restaura o foco
    if (this._previouslyFocused && typeof this._previouslyFocused.focus === 'function') {
      this._previouslyFocused.focus();
    }

    if (typeof this.onClose === 'function') {
      this.onClose();
    }
  }

  /**
   * Manipula teclas pressionadas (Esc e Tab para foco).
   * @param {KeyboardEvent} event
   * @private
   */
  _handleKeydown(event) {
    if (event.key === 'Escape' && this.closeOnEscape) {
      this.destroy();
      return;
    }

    if (event.key === 'Tab') {
      this._trapFocus(event);
    }
  }

  /**
   * Mantém o foco dentro do modal (loop entre elementos focáveis).
   * @param {KeyboardEvent} event
   * @private
   */
  _trapFocus(event) {
    const focusableSelectors = [
      'button',
      '[href]',
      'input',
      'select',
      'textarea',
      '[tabindex]:not([tabindex="-1"])',
    ];
    const focusableElements = this.dialog.querySelectorAll(focusableSelectors.join(','));
    if (focusableElements.length === 0) return;

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /**
   * Define o foco inicial no primeiro elemento focável ou no diálogo.
   * @private
   */
  _trapFocusInitial() {
    const focusable = this.dialog.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable) {
      focusable.focus();
    } else {
      this.dialog.setAttribute('tabindex', '-1');
      this.dialog.focus();
    }
  }
}

export default Modal;