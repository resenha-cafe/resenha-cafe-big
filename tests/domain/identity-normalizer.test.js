import { Identifier } from "../../src/domain/value-objects/identifier.js";
import {
  generateIdentityKey,
  createIdentityPayload,
  calculateIdentityHash,
} from "../../src/domain/utils/identity-normalizer.js";
describe("IdentityNormalizer", () => {
  describe("identidade por DOI", () => {
    it("deve gerar a mesma identidade para DOI em formatos equivalentes", () => {
      const identifierA = Identifier.doi("10.1234/ABC");
      const identifierB = Identifier.doi(
        "https://doi.org/10.1234/abc"
      );

      const articleA = {
        identifiers: [identifierA],
        title: "Artigo de teste",
      };

      const articleB = {
        identifiers: [identifierB],
        title: "Artigo de teste",
      };

      const identityA = generateIdentityKey(articleA);
      const identityB = generateIdentityKey(articleB);

      expect(identityA).toBe(identityB);
    });
  });
});
describe("identificadores inválidos", () => {
  it("não deve usar identificador inválido como identidade prioritária", () => {
    const invalidIdentifier = new Identifier({
      type: "doi",
      value: "isso-nao-e-um-doi",
    });

    expect(invalidIdentifier.isValid).toBe(false);

    const article = {
      identifiers: [invalidIdentifier],
      title: "Artigo de teste",
      authors: [{ name: "Autor Teste" }],
      publicationDate: "2024-01-01",
      type: "article",
      journal: "Journal Teste",
    };

    const identity = generateIdentityKey(article);

    expect(identity).not.toBe(
      "doi:isso-nao-e-um-doi"
    );
  });
});
describe("prioridade de identificadores", () => {
  it("deve priorizar DOI sobre identificadores secundários", () => {
    const article = {
      identifiers: [
        Identifier.openalex("W123456789"),
        Identifier.pmid("123456789"),
        Identifier.doi("10.1234/TEST"),
        Identifier.pmcid("PMC1234567"),
      ],
      title: "Artigo de teste",
    };

    const identity = generateIdentityKey(article);

    expect(identity).toBe(
      "doi:10.1234/test"
    );
  });
});
it("deve priorizar PMID quando DOI não estiver disponível", () => {
  const article = {
    identifiers: [
      Identifier.semantic("S123456"),
      Identifier.openalex("W123456789"),
      Identifier.pmcid("PMC1234567"),
      Identifier.pmid("123456789"),
    ],
    title: "Artigo de teste",
  };

  const identity = generateIdentityKey(article);

  expect(identity).toBe(
    "pmid:123456789"
  );
});
it("deve priorizar PMCID quando DOI e PMID não estiverem disponíveis", () => {
  const article = {
    identifiers: [
      Identifier.semantic("S123456"),
      Identifier.openalex("W123456789"),
      Identifier.pmcid("PMC1234567"),
    ],
    title: "Artigo de teste",
  };

  const identity = generateIdentityKey(article);

  expect(identity).toBe(
    "pmcid:PMC1234567"
  );
});
it("deve priorizar OpenAlex quando DOI, PMID e PMCID não estiverem disponíveis", () => {
  const article = {
    identifiers: [
      Identifier.semantic("S123456"),
      Identifier.openalex("W123456789"),
    ],
    title: "Artigo de teste",
  };

  const identity = generateIdentityKey(article);

  expect(identity).toBe(
    "openalex:W123456789"
  );
});
it("deve usar Semantic Scholar quando nenhum identificador anterior estiver disponível", () => {
  const article = {
    identifiers: [
      Identifier.semantic("S123456"),
    ],
    title: "Artigo de teste",
  };

  const identity = generateIdentityKey(article);

  expect(identity).toBe(
    "semantic:S123456"
  );
});
describe("fallback determinístico", () => {
  it("deve gerar a mesma identidade para artigos sem identificador persistente", () => {
    const articleA = {
      identifiers: [],
      title: "Um estudo sobre inteligência artificial",
      authors: [
        { name: "João da Silva" },
        { name: "Maria Souza" },
      ],
      publicationDate: "2024-01-15",
      type: "article",
      journal: "Journal of Research",
    };

    const articleB = {
      identifiers: [],
      title: "Um estudo sobre inteligência artificial",
      authors: [
        { name: "João da Silva" },
        { name: "Maria Souza" },
      ],
      publicationDate: "2024-01-15",
      type: "article",
      journal: "Journal of Research",
    };

    const identityA = generateIdentityKey(articleA);
    const identityB = generateIdentityKey(articleB);

    expect(identityA).toBe(identityB);
  });
});
it("deve manter a mesma identidade quando os autores aparecem em ordem diferente", () => {
  const articleA = {
    identifiers: [],
    title: "Um estudo sobre inteligência artificial",
    authors: [
      { name: "João da Silva" },
      { name: "Maria Souza" },
    ],
    publicationDate: "2024-01-15",
    type: "article",
    journal: "Journal of Research",
  };

  const articleB = {
    identifiers: [],
    title: "Um estudo sobre inteligência artificial",
    authors: [
      { name: "Maria Souza" },
      { name: "João da Silva" },
    ],
    publicationDate: "2024-01-15",
    type: "article",
    journal: "Journal of Research",
  };

  const identityA = generateIdentityKey(articleA);
  const identityB = generateIdentityKey(articleB);

  expect(identityA).toBe(identityB);
});
it("deve manter a mesma identidade para variações de representação dos nomes dos autores", () => {
  const articleA = {
    identifiers: [],
    title: "Um estudo sobre inteligência artificial",
    authors: [
      { name: "João da Silva" },
      { name: "Maria Souza" },
    ],
    publicationDate: "2024-01-15",
    type: "article",
    journal: "Journal of Research",
  };

  const articleB = {
    identifiers: [],
    title: "Um estudo sobre inteligência artificial",
    authors: [
      { name: "  JOAO DA SILVA  " },
      { name: "MARIA SOUZA" },
    ],
    publicationDate: "2024-01-15",
    type: "article",
    journal: "Journal of Research",
  };

  const identityA = generateIdentityKey(articleA);
  const identityB = generateIdentityKey(articleB);

  expect(identityA).toBe(identityB);
});
it("deve manter a mesma identidade para variações de representação do título", () => {
  const articleA = {
    identifiers: [],
    title: "Um estudo sobre inteligência artificial",
    authors: [
      { name: "João da Silva" },
      { name: "Maria Souza" },
    ],
    publicationDate: "2024-01-15",
    type: "article",
    journal: "Journal of Research",
  };

  const articleB = {
    identifiers: [],
    title: "  UM ESTUDO SOBRE INTELIGÊNCIA ARTIFICIAL  ",
    authors: [
      { name: "João da Silva" },
      { name: "Maria Souza" },
    ],
    publicationDate: "2024-01-15",
    type: "article",
    journal: "Journal of Research",
  };

  const identityA = generateIdentityKey(articleA);
  const identityB = generateIdentityKey(articleB);

  expect(identityA).toBe(identityB);
});
it("deve manter a mesma identidade quando o título varia apenas na pontuação", () => {
  const articleA = {
    identifiers: [],
    title: "Um estudo sobre inteligência artificial",
    authors: [
      { name: "João da Silva" },
      { name: "Maria Souza" },
    ],
    publicationDate: "2024-01-15",
    type: "article",
    journal: "Journal of Research",
  };

  const articleB = {
    identifiers: [],
    title: "Um estudo sobre inteligência artificial.",
    authors: [
      { name: "João da Silva" },
      { name: "Maria Souza" },
    ],
    publicationDate: "2024-01-15",
    type: "article",
    journal: "Journal of Research",
  };

  const identityA = generateIdentityKey(articleA);
  const identityB = generateIdentityKey(articleB);

  expect(identityA).toBe(identityB);
});
it("não deve gerar a mesma identidade para artigos genuinamente diferentes", () => {
  const articleA = {
    identifiers: [],
    title: "Um estudo sobre inteligência artificial",
    authors: [
      { name: "João da Silva" },
      { name: "Maria Souza" },
    ],
    publicationDate: "2024-01-15",
    type: "article",
    journal: "Journal of Research",
  };

  const articleB = {
    identifiers: [],
    title: "Um estudo sobre inteligência natural",
    authors: [
      { name: "João da Silva" },
      { name: "Maria Souza" },
    ],
    publicationDate: "2024-01-15",
    type: "article",
    journal: "Journal of Research",
  };

  const identityA = generateIdentityKey(articleA);
  const identityB = generateIdentityKey(articleB);

  expect(identityA).not.toBe(identityB);
});
it("deve gerar identidade diferente quando o ano de publicação for diferente", () => {
  const articleA = {
    identifiers: [],
    title: "Um estudo sobre inteligência artificial",
    authors: [
      { name: "João da Silva" },
      { name: "Maria Souza" },
    ],
    year: 2024,
    type: "article",
    journal: "Journal of Research",
  };

  const articleB = {
    ...articleA,
    year: 2025,
  };

  expect(generateIdentityKey(articleA))
    .not.toBe(generateIdentityKey(articleB));
});

it("deve gerar identidade diferente quando o tipo do trabalho for diferente", () => {
  const articleA = {
    identifiers: [],
    title: "Um estudo sobre inteligência artificial",
    authors: [
      { name: "João da Silva" },
      { name: "Maria Souza" },
    ],
    publicationDate: "2024-01-15",
    type: "article",
    journal: "Journal of Research",
  };

  const articleB = {
    ...articleA,
    type: "review",
  };

  expect(generateIdentityKey(articleA))
    .not.toBe(generateIdentityKey(articleB));
});

it("deve gerar identidade diferente quando o periódico for diferente", () => {
  const articleA = {
    identifiers: [],
    title: "Um estudo sobre inteligência artificial",
    authors: [
      { name: "João da Silva" },
      { name: "Maria Souza" },
    ],
    year: 2024,
    type: "article",
    journal: "Journal of Research",
  };

  const articleB = {
    ...articleA,
    journal: "International Journal of Research",
  };

  expect(generateIdentityKey(articleA))
    .not.toBe(generateIdentityKey(articleB));
});

it("deve gerar identidade diferente quando os autores forem diferentes", () => {
  const articleA = {
    title: "Um estudo sobre inteligência artificial",
    authors: [
      { name: "João Silva" },
      { name: "Maria Souza" },
    ],
    year: 2024,
    type: "article",
    journal: "Journal of Research",
  };

  const articleB = {
    ...articleA,
    authors: [
      { name: "João Silva" },
      { name: "Ana Oliveira" },
    ],
  };

  expect(generateIdentityKey(articleA))
    .not.toBe(generateIdentityKey(articleB));
});
it("deve construir payloads diferentes para metadados diferentes", () => {
  const base = {
    title: "Um estudo sobre inteligência artificial",
    authors: [
      { name: "João da Silva" },
      { name: "Maria Souza" },
    ],
    year: 2024,
    type: "article",
    journal: "Journal of Research",
  };

  const byAuthor = createIdentityPayload({
    ...base,
    authors: [
      { name: "João da Silva" },
      { name: "Ana Oliveira" },
    ],
  });

  const byJournal = createIdentityPayload({
    ...base,
    journal: "International Journal of Research",
  });

  const byYear = createIdentityPayload({
    ...base,
    year: 2025,
  });

  expect(byAuthor).not.toEqual(createIdentityPayload(base));
  expect(byJournal).not.toEqual(createIdentityPayload(base));
  expect(byYear).not.toEqual(createIdentityPayload(base));
});
it("deve gerar hashes diferentes para payloads diferentes", () => {
  const base = {
    title: "um estudo sobre inteligência artificial",
    type: "article",
    year: 2024,
    authors: '["joao silva da","maria souza"]',
    journal: "journal of research",
  };

  const differentAuthors = {
    ...base,
    authors: '["ana oliveira","joao silva da"]',
  };

  const differentJournal = {
    ...base,
    journal: "international journal of research",
  };

  const differentYear = {
    ...base,
    year: 2025,
  };

  const hashBase = calculateIdentityHash(base);
  const hashAuthors = calculateIdentityHash(differentAuthors);
  const hashJournal = calculateIdentityHash(differentJournal);
  const hashYear = calculateIdentityHash(differentYear);

  expect(hashAuthors).not.toBe(hashBase);
  expect(hashJournal).not.toBe(hashBase);
  expect(hashYear).not.toBe(hashBase);
});


  
