/**
   * Valida o tipo de publicação.
   * 
   * 📚 Mapeia variações comuns de providers para um vocabulário
   * controlado antes de validar.
   * 
   * @param {string} type - Tipo
   * @returns {string|null} Warning ou null
   */
  static validateType(type) {
    if (typeof type !== "string") {
      return "Publication type must be a string";
    }

    // Usa o método público normalizeType (mesma tabela usada por mappers)
    const normalized = this.normalizeType(type);

    const validTypes = [
      "article",
      "review",
      "preprint",
      "book",
      "book-chapter",
      "dissertation",
      "conference",
      "dataset",
      "other",
    ];

    if (!validTypes.includes(normalized)) {
      return `Unknown publication type: "${type}". Valid types: ${validTypes.join(", ")}`;
    }

    return null;
  }

  /**
   * Normaliza o tipo de publicação para o vocabulário controlado.
   * 
   * 📚 Método PÚBLICO para que mappers e services possam reutilizar
   * exatamente a mesma tabela de tipos. Assim o mapper pode fazer:
   * article.type = ArticleValidator.normalizeType(raw.type);
   * 
   * @param {string} type - Tipo bruto do provider
   * @returns {string} Tipo normalizado
   * 
   * @example
   * ArticleValidator.normalizeType("journal-article")  // => "article"
   * ArticleValidator.normalizeType("proceedings")      // => "conference"
   * ArticleValidator.normalizeType("unknown-type")     // => "unknown-type"
   */
  static normalizeType(type) {
    if (!type || typeof type !== "string") return "other";
    return ArticleValidator.#TYPE_MAP[type.toLowerCase()] || type.toLowerCase();
  }

  // ... (validateCompleteness e o resto permanecem iguais)