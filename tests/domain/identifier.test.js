import {
  Identifier,
  IDENTIFIER_TYPES,
} from "../../src/domain/value-objects/identifier.js";

describe("Identifier", () => {
  describe("normalização de tipo", () => {
    it("deve canonicalizar o tipo", () => {
      const identifier = new Identifier({
        type: " DOI ",
        value: "https://doi.org/10.1234/ABC",
      });

      expect(identifier.type).toBe("doi");
      expect(identifier.value).toBe("10.1234/abc");
      expect(identifier.identityKey).toBe(
        "doi:10.1234/abc"
      );
    });
  });

  describe("DOI", () => {
    it("deve produzir a mesma identidade para tipos equivalentes", () => {
  const a = new Identifier({
    type: " DOI ",
    value: "10.1234/ABC",
  });

  const b = new Identifier({
    type: "doi",
    value: "https://doi.org/10.1234/abc",
  });

  expect(a.equals(b)).toBe(true);
  expect(a.identityKey).toBe("doi:10.1234/abc");
});
    it("deve normalizar URL DOI", () => {
      const identifier = Identifier.doi(
        "https://doi.org/10.1234/ABC"
      );

      expect(identifier.value).toBe(
        "10.1234/abc"
      );
    });

    it("deve normalizar prefixo doi:", () => {
      const identifier = Identifier.doi(
        "DOI: 10.1234/ABC"
      );

      expect(identifier.value).toBe(
        "10.1234/abc"
      );
    });

    it("deve produzir a mesma identidade para formatos equivalentes", () => {
      const a = Identifier.doi(
        "10.1234/ABC"
      );

      const b = Identifier.doi(
        "https://doi.org/10.1234/abc"
      );

      expect(a.equals(b)).toBe(true);
      expect(a.identityKey).toBe(
        "doi:10.1234/abc"
      );
    });
  });

  describe("ISBN", () => {
    it("deve remover formatação do ISBN-13", () => {
      const identifier = Identifier.isbn(
        "978-3-16-148410-0"
      );

      expect(identifier.value).toBe(
        "9783161484100"
      );
    });

    it("deve remover formatação do ISBN-10", () => {
      const identifier = Identifier.isbn(
        "0-306-40615-2"
      );

      expect(identifier.value).toBe(
        "0306406152"
      );
    });
  });

  describe("PMID", () => {
    it("deve aceitar PMID sem limite artificial de 8 dígitos", () => {
      const identifier = Identifier.pmid(
        "123456789"
      );

      expect(identifier.value).toBe(
        "123456789"
      );
    });
  });

  describe("ORCID", () => {
    it("deve expor ORCID como tipo oficial", () => {
      expect(
        IDENTIFIER_TYPES.ORCID
      ).toBe("orcid");
    });

    it("deve normalizar URL ORCID", () => {
      const identifier = new Identifier({
        type: "ORCID",
        value:
          "https://orcid.org/0000-0002-1825-0097",
      });

      expect(identifier.type).toBe("orcid");
      expect(identifier.value).toBe(
        "0000-0002-1825-0097"
      );
    });
  });

  describe("PMCID", () => {
    it("deve canonicalizar PMCID", () => {
      const identifier = Identifier.pmcid(
        "pmc1234567"
      );

      expect(identifier.value).toBe(
        "PMC1234567"
      );
    });
  });

  describe("arXiv", () => {
    it("deve remover versão", () => {
      const identifier = Identifier.arxiv(
        "arxiv:2101.12345v3"
      );

      expect(identifier.value).toBe(
        "2101.12345"
      );
    });
  });

  describe("imutabilidade", () => {
    it("deve ser congelado", () => {
      const identifier = Identifier.doi(
        "10.1234/test"
      );

      expect(
        Object.isFrozen(identifier)
      ).toBe(true);
    });
  });
});