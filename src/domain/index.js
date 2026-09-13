/**
 * ============================================================
 * Resenha & Café
 * Search Worker V4
 * ------------------------------------------------------------
 * Domain — Barrel Export
 * ============================================================
 *
 * 📚 AULA: Barrel Export (ou "exportação de barril").
 * 
 * Este arquivo é como o índice de um livro. Em vez de importar
 * cada capítulo separadamente, você consulta o índice e vai
 * direto ao que interessa.
 * 
 * No código, isso significa:
 * 
 * ❌ Sem barrel:
 * import { Article } from "../../domain/entities/article.js";
 * import { Author } from "../../domain/entities/author.js";
 * // ... 15 imports diferentes
 * 
 * ✅ Com barrel:
 * import { Article, Author } from "../../domain";
 * 
 * 📚 Princípio aplicado: "Information Hiding" (Ocultamento de Informação).
 * O barrel esconde a estrutura interna de diretórios do domínio.
 * Se amanhã movermos entities/article.js para entities/articles/article.js,
 * só o barrel precisa mudar — ninguém de fora sente.
 * 
 * ⚠️ Regra do barrel:
 * - Exporte o que os USE CASES precisam.
 * - NÃO exporte detalhes de implementação interna.
 * - Se uma função só é usada dentro do domínio, NÃO a exporte.
 */

// ============================================================
// BASE
// ============================================================
export { Entity } from "./base/entity.js";

// ============================================================
// ENTITIES (agregados e entidades filhas)
// ============================================================
export { Article } from "./entities/article.js";
export { Author } from "./entities/author.js";
export { Journal } from "./entities/journal.js";
export { Publisher } from "./entities/publisher.js";
export { License } from "./entities/license.js";

// ============================================================
// VALUE OBJECTS
// ============================================================
export { Identity } from "./value-objects/identity.js";
export { Identifier, IDENTIFIER_TYPES } from "./value-objects/identifier.js";

// ============================================================
// COLLECTIONS
// ============================================================
export { IdentifierCollection } from "./collections/identifier-collection.js";

// ============================================================
// FACTORIES
// ============================================================
export { ArticleIdentityFactory } from "./factories/article-identity.factory.js";

// ============================================================
// POLICIES
// ============================================================
export {
  IdentifierMergePolicy,
  MergeContext,
} from "./policies/identifier-merge.policy.js";

export {
  IdentifierPriorityPolicy,
  SOURCE_PRIORITY,
  ID_PRIORITY,
} from "./policies/identifier-priority.policy.js";

// ============================================================
// ERRORS
// ============================================================
export { DuplicateIdentifierError } from "./errors/duplicate-identifier.error.js";

// ============================================================
// EVENTS (fatos do domínio)
// ============================================================
export {
  DomainEvent,
  ArticleCreated,
  ArticleIdentifiersAdded,
  ArticleIdentityChanged,
  ArticleMetadataEnriched,
  ArticleMerged,
} from "./events/domain-events.js";

// ============================================================
// UTILS (apenas a função principal de identidade)
// ============================================================
// 📚 CORRIGIDO: Apenas generateIdentityKey é exportado.
// As funções internas (generateAuthorKey, createIdentityPayload,
// calculateIdentityHash) e a constante DEFAULT_MAX_AUTHORS são
// detalhes de implementação do identity-normalizer.
// 
// Se um use case precisar gerar identidade de artigo, ele usa
// ArticleIdentityFactory, não generateIdentityKey diretamente.
// 
// Mantemos generateIdentityKey para testes e edge cases.
export { generateIdentityKey } from "./utils/identity-normalizer.js";