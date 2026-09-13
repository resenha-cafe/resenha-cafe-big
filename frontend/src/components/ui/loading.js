/**
 * Componente de carregamento.
 *
 * Exibe um indicador visual enquanto uma operação está em andamento.
 * O componente não conhece a API nem o domínio — apenas renderiza estado.
 */

export class Loading {
  /**
   * @param {string} [message]
   * @param {HTMLElement} [root]
   */
  constructor(message = "Carregando...", root = document.body) {
    this.root = root;
    this.message = message;
    this.element = null;
  }

  /**
   * Monta o componente no DOM.
   *
   * @returns {HTMLElement}
   */
  mount() {
    this.element = document.createElement("div");
    this.element.className = "loading";
    this.element.setAttribute("role", "status");
    this.element.setAttribute("aria-live", "polite");

    const spinner = document.createElement("span");
    spinner.className = "loading__spinner";
    spinner.setAttribute("aria-hidden", "true");

    const text = document.createElement("span");
    text.className = "loading__text";
    text.textContent = this.message;

    this.element.append(spinner, text);

    this.root.append(this.element);

    return this.element;
  }

  /**
   * Remove o componente do DOM.
   */
  destroy() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}

/**
 * Cria e monta um loading na página.
 *
 * @param {string} [message]
 * @param {HTMLElement} [root]
 * @returns {Loading}
 */
export function mountLoading(message, root) {
  const loading = new Loading(message, root);
  loading.mount();
  return loading;
}

export default Loading;