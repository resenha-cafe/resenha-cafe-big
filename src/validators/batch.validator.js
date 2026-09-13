/**
   * Categoriza uma mensagem de erro por prefixo.
   * 
   * 📚 Extrai a categoria baseada no início da mensagem.
   * Isso agrupa erros relacionados (ex: todos os erros de título
   * ficam na mesma categoria).
   * 
   * @param {string} msg - Mensagem de erro
   * @returns {string} Categoria
   * @private
   */
  static #categorizeError(msg) {
    if (!msg) return "Unknown";

    if (msg.startsWith("Title")) return "Title";
    if (msg.startsWith("DOI") || msg.startsWith("Invalid DOI")) return "DOI";
    if (msg.startsWith("Authors")) return "Authors";
    if (msg.startsWith("Article has no source")) return "Source";
    if (msg.startsWith("Invalid publication")) return "Publication Date";
    if (msg.startsWith("Publication")) return "Publication Date";
    if (msg.startsWith("Unknown publication type")) return "Type";
    if (msg.startsWith("Article must have")) return "Missing Required";

    // Fallback: usa a primeira parte antes de ":" ou a mensagem inteira
    return msg.includes(":") ? msg.split(":")[0].trim() : "Other";
  }