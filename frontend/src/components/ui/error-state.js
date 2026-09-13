/**
 * Componente de estado de erro.
 *
 * Apresenta uma mensagem de erro ao usuário sem quebrar a página.
 * O componente não conhece a API nem o domínio — apenas renderiza estado.
 */

export class ErrorState {
  /**
   * @param {Object} options
   * @param {string} [options.title]
   * @param {string} [options.message]
   * @param {string} [options.code]
   * @param {number} [options.status]
   * @param {HTMLElement} [options.root]
   */
  constructor({
    title = "Algo deu errado",
    message = "Tente novamente mais tarde.",
    code = null,
    status = null,
    root = document.body,
  } = {}) {
    this.title = title;
    this.message = message;
    this.code = code;
    this.status = status;
    this.root = root;
    this.element = null;
  }

  /**
   * Monta o componente no DOM.
   *
   * @returns {HTMLElement}
   */
  mount() {
    this.element = document.createElement("div");
    this.element.className = "error-state";
    this.element.setAttribute("role", "alert");

    const title = document.createElement("h2");
    title.className = "error-state__title";
    title.textContent = this.title;

    const message = document.createElement("p");
    message.className = "error-state__message";
    message.textContent = this.message;

    this.element.append(title, message);

    if (this.code || this.status) {
      const meta = document.createElement("p");
      meta.className = "error-state__meta";

      const parts = [];

      if (this.status) {
        parts.push(`Status: ${this.status}`);
      }

      if (this.code) {
        parts.push(`Código: ${this.code}`);
      }

      meta.textContent = parts.join(" • ");
      this.element.append(meta);
    }

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
 * Cria e monta um estado de erro.
 *
 * @param {Object} options
 * @returns {ErrorState}
 */
export function mountErrorState(options) {
  const errorState = new ErrorState(options);
  errorState.mount();
  return errorState;
}

export default ErrorState;