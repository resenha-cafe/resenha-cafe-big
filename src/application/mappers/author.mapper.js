import { Author } from "../../domain/entities/author.js";

export class AuthorMapper {
  static toDomain(data = {}) {
    if (!data) return Author.empty();
    if (data instanceof Author) return data;

    const name = AuthorMapper.#extractName(data);
    const affiliation = AuthorMapper.#extractAffiliation(data);
    const orcid = AuthorMapper.#extractOrcid(data);

    let roles = [];
    if (data.roles && Array.isArray(data.roles)) {
      roles = data.roles.flat();
    } else if (data.roles && typeof data.roles === "string") {
      roles = [data.roles];
    } else if (data.role && typeof data.role === "string") {
      roles = [data.role];
    }

    return new Author({
      name,
      orcid,
      affiliation,
      email: data.email || null,
      country: data.country || null,
      roles,
      metadata: {
        provider: data.provider || data.source || null,
        rawName: data.name || null,
        authorId: data.author_id || data.authorId || data.id || null,
        sequence: data.sequence || data.order || null,
      },
    });
  }

  static toDomainList(authorsList = []) {
    if (!Array.isArray(authorsList)) return [];
    return authorsList.map(data => AuthorMapper.toDomain(data));
  }

  static toDTO(author, options = {}) {
    if (!author) return null;

    const dto = {
      name: author.name,
      orcid: author.orcid,
      affiliation: author.affiliation,
      country: author.country,
      roles: author.roles,
    };

    if (options.includeMetadata) {
      dto.metadata = author.metadata;
    }

    return dto;
  }

  static toDTOList(authors = [], options = {}) {
    return authors.map(author => AuthorMapper.toDTO(author, options));
  }

  static toPersistence(author) {
    if (!author) return null;
    return author.toPlainObject();
  }

  static fromPersistence(data) {
    if (!data) return Author.empty();
    return Author.fromPlainObject(data);
  }

  static #extractName(data) {
    if (data.given || data.family) {
      const given = (data.given || "").trim();
      const family = (data.family || "").trim();
      if (!family) return null;
      return given ? family + ", " + given : family;
    }

    if (data.firstName || data.lastName) {
      const firstName = (data.firstName || "").trim();
      const lastName = (data.lastName || "").trim();
      if (!lastName) return null;
      return firstName ? lastName + ", " + firstName : lastName;
    }

    if (typeof data.display_name === "string") {
      const trimmed = data.display_name.trim();
      return trimmed.length > 0 ? trimmed : null;
    }

    if (typeof data.fullName === "string") {
      const trimmed = data.fullName.trim();
      return trimmed.length > 0 ? trimmed : null;
    }

    if (typeof data.name === "string") {
      const trimmed = data.name.trim();
      return trimmed.length > 0 ? trimmed : null;
    }

    return null;
  }

  static #extractAffiliation(data) {
    if (Array.isArray(data.affiliations) && data.affiliations.length > 0) {
      const first = data.affiliations[0];
      if (typeof first === "string") return first.trim();
      if (first.name) return first.name;
      if (first.institution) return first.institution;
      if (first.display_name) return first.display_name;
    }

    if (Array.isArray(data.institutions) && data.institutions.length > 0) {
      const names = data.institutions
        .map(i => typeof i === "string" ? i : (i.display_name || i.name))
        .filter(Boolean);
      if (names.length > 0) return names.join("; ");
    }

    if (typeof data.affiliation === "string") {
      const trimmed = data.affiliation.trim();
      return trimmed.length > 0 ? trimmed : null;
    }

    if (data.affiliation && typeof data.affiliation === "object") {
      if (data.affiliation.name) return data.affiliation.name;
      if (data.affiliation.institution) return data.affiliation.institution;
    }

    if (typeof data.affiliationName === "string") {
      return data.affiliationName.trim();
    }

    if (typeof data.aff === "string") {
      return data.aff.trim();
    }

    return null;
  }

  static #extractOrcid(data) {
    const raw = data.orcid
      || data.ORCID
      || data.orcid_id
      || data.orcidId
      || (data.author && data.author.orcid)
      || null;

    if (!raw) return null;

    const str = String(raw).trim();

    const match = str.match(/(\d{4}-\d{4}-\d{4}-\d{3}[\dX])/i);
    if (match) return match[1].toUpperCase();

    const matchNoHyphen = str.match(/(\d{4})(\d{4})(\d{4})(\d{3}[\dX])/i);
    if (matchNoHyphen) {
      return matchNoHyphen[1] + "-" + matchNoHyphen[2] + "-" + matchNoHyphen[3] + "-" + matchNoHyphen[4];
    }

    return str;
  }
}

export default AuthorMapper;

