import { Article } from "../../domain/entities/article.js";
import { AuthorMapper } from "./author.mapper.js";
import { cleanHtml } from "../../utils/clean-html.js";

export class ArticleMapper {
  static toDomain(data, source = null) {
    if (!data) return Article.empty();
    if (data instanceof Article) return data;

    const provider = (source || data.source || data.provider || "unknown").toLowerCase();

    switch (provider) {
      case "openalex":
        return ArticleMapper.#fromOpenAlex(data);
      case "crossref":
        return ArticleMapper.#fromCrossRef(data);
      case "med":
      case "europepmc":
        return ArticleMapper.#fromCrossRef(data);
      case "semantic":
      case "semantic-scholar":
        return ArticleMapper.#fromSemanticScholar(data);
      case "scielo":
        return ArticleMapper.#fromSciELO(data);
      case "core":
        return ArticleMapper.#fromCORE(data);
      default:
        return ArticleMapper.#fromGeneric(data);
    }
  }

  static #extractAbstract(data) {
    if (typeof data.abstract === "string" && data.abstract.length > 0) {
      return cleanHtml(data.abstract);
    }
    if (typeof data.abstractText === "string" && data.abstractText.length > 0) {
      return cleanHtml(data.abstractText);
    }
    return null;
  }

  static #fromCrossRef(data) {
    const title = Array.isArray(data.title) ? data.title[0] : data.title || null;
    const doi = data.DOI || data.doi || null;
    const abstract = ArticleMapper.#extractAbstract(data);

    // Publication date
    let publicationDate = null;
    const pubData = data.published_print || data['published-print'] || data.published_online || data['published-online'];
    if (pubData && pubData['date-parts']) {
      const parts = pubData['date-parts'][0] || [];
      publicationDate = parts.length >= 1 ? String(parts[0]) : null;
      if (parts.length >= 2) publicationDate += "-" + String(parts[1]).padStart(2, "0");
      if (parts.length >= 3) publicationDate += "-" + String(parts[2]).padStart(2, "0");
    }

    // Journal
    let journal = null;
    if (data["container-title"] || data.journal) {
      const jName = Array.isArray(data["container-title"])
        ? data["container-title"][0]
        : (data["container-title"] || (typeof data.journal === "string" ? data.journal : data.journal?.name));

      journal = {
        name: jName || null,
        issn: data.ISSN?.[0] || data.ISSN || data.journal?.issn || null,
        publisher: data.publisher || null,
      };
    }

    // Authors
    const authors = AuthorMapper.toDomainList(
      (data.author || data.authors || []).map(a => ({
        given: a.given || a.firstName || null,
        family: a.family || a.lastName || null,
        name: a.name || a.fullName || (a.given && a.family ? a.family + ", " + a.given : null),
        orcid: a.ORCID || a.orcid || null,
        affiliation: Array.isArray(a.affiliation)
          ? a.affiliation.map(af => typeof af === "string" ? af : af.name).filter(Boolean).join("; ")
          : (a.affiliation?.name || a.affiliation || null),
        provider: "crossref",
      }))
    );

    var licenseData = null;
    if (Array.isArray(data.license) && data.license.length > 0) {
      var firstLicense = data.license[0];
      licenseData = {
        name: firstLicense.name || null,
        url: firstLicense.URL || firstLicense.url || null,
        type: (firstLicense.URL || firstLicense.url || '').includes('creativecommons') ? 'open' : 'unknown',
      };
    } else if (data.license && typeof data.license === 'object') {
      licenseData = {
        name: data.license.name || null,
        url: data.license.URL || data.license.url || null,
        type: (data.license.URL || data.license.url || '').includes('creativecommons') ? 'open' : 'unknown',
      };
    }

    return new Article({
      title,
      doi,
      abstract,
      publicationDate,
      language: data.language || null,
      type: data.type || null,
      url: data.URL || data.url || null,
      license: licenseData,
      openAccess: Array.isArray(data.license)
        ? data.license.some(l => l.URL?.includes("creativecommons") || l.url?.includes("creativecommons"))
        : !!data.license?.URL?.includes("creativecommons"),
      peerReviewed: data.type === "journal-article",
      authors,
      journal,
      publisher: data.publisher ? { name: data.publisher } : null,
      citations: data["is-referenced-by-count"] || data.citations || 0,
      references: (data.reference || []).map(ref => ref.DOI || ref.doi).filter(Boolean),
      confidence: data.score ?? 0,
      source: "crossref",
    });
  }

  static #fromEuropePMC(data) {
    const title = Array.isArray(data.title) ? data.title[0] : data.title || null;
    const doi = data.doi || data.DOI || null;
    const abstract = ArticleMapper.#extractAbstract(data);

    // 📚 EuropePMC usa pubYear ou journalInfo.printPublicationDate
    let publicationDate = null;
    if (data.journalInfo && data.journalInfo.printPublicationDate) {
      publicationDate = data.journalInfo.printPublicationDate;
    } else if (data.journalInfo && data.journalInfo.dateOfPublication) {
      publicationDate = data.journalInfo.dateOfPublication;
    } else if (data.pubYear) {
      publicationDate = String(data.pubYear);
    } else if (data.firstPublicationDate) {
      publicationDate = data.firstPublicationDate;
    }

    // Journal
    let journal = null;
    const journalTitle =
      (data.journalInfo && data.journalInfo.journal && data.journalInfo.journal.title) ||
      (typeof data.journal === "string" ? data.journal : data.journal?.name) ||
      null;
    if (journalTitle) {
      journal = {
        name: journalTitle,
        issn:
          (data.journalInfo && data.journalInfo.journal && data.journalInfo.journal.issn) ||
          data.issn ||
          null,
        publisher: null,
      };
    }

    // Authors — EuropePMC usa authorList.author
    const rawAuthors =
      (data.authorList && data.authorList.author) ||
      data.authors ||
      [];
    const authors = AuthorMapper.toDomainList(
      rawAuthors.map(a => {
        const affiliationList = a.authorAffiliationDetailsList?.authorAffiliation;
        const affiliation = Array.isArray(affiliationList)
          ? affiliationList.map(af => af.affiliation).filter(Boolean).join("; ")
          : affiliationList?.affiliation || null;

        return {
          name: a.fullName || (a.lastName && a.firstName ? a.lastName + ", " + a.firstName : a.name) || null,
          orcid: a.authorId?.value || a.orcid || null,
          affiliation,
          provider: "europepmc",
        };
      })
    );

    return new Article({
      title,
      doi,
      abstract,
      publicationDate,
      language: data.language || null,
      type: data.pubType || null,
      url: (data.fullTextUrl && data.fullTextUrl.url) || data.url || null,
      openAccess: data.isOpenAccess || data.openAccess || false,
      peerReviewed: data.peerReviewed ?? (data.pubType === "journal-article"),
      authors,
      journal,
      publisher: data.publisher ? { name: data.publisher } : null,
      citations: data.citedByCount || 0,
      references: (data.referenceList && data.referenceList.reference || [])
        .map(ref => ref.doi || ref.DOI)
        .filter(Boolean),
      confidence: 0,
      source: "europepmc",
    });
  }

  static #fromOpenAlex(data) {
    return new Article({
      title: Array.isArray(data.title) ? data.title[0] : data.title || null,
      doi: data.doi || null,
      abstract: ArticleMapper.#extractAbstract(data),
      publicationDate: data.publication_date || data.publication_year || null,
      language: data.language || null,
      type: data.type || null,
      url: data.primary_location?.landing_page_url || data.url || null,
      openAccess: data.open_access?.is_oa ?? false,
      peerReviewed: data.peer_reviewed ?? false,
      authors: AuthorMapper.toDomainList(
        (data.authorships || []).map(a => ({
          name: a.author?.display_name || null,
          orcid: a.author?.orcid || null,
          affiliation: a.institutions?.map(i => i.display_name).join("; ") || null,
          provider: "openalex",
        }))
      ),
      journal: data.primary_location?.source
        ? {
            name: data.primary_location.source.display_name || null,
            issn: data.primary_location.source.issn_l || data.primary_location.source.issn?.[0] || null,
          }
        : null,
      citations: data.cited_by_count ?? 0,
      confidence: data.relevance_score ?? 0,
      source: "openalex",
    });
  }

  static #fromSemanticScholar(data) {
    return new Article({
      title: data.title || null,
      doi: data.doi || data.externalIds?.DOI || null,
      abstract: data.abstract ? cleanHtml(data.abstract) : null,
      publicationDate: data.publicationDate || (data.year ? String(data.year) : null),
      language: data.language || null,
      type: data.publicationTypes?.[0] || null,
      url: data.url || data.openAccessPdf?.url || null,
      openAccess: !!data.openAccessPdf || data.isOpenAccess || false,
      authors: AuthorMapper.toDomainList(
        (data.authors || []).map(a => ({
          name: a.name || null,
          orcid: a.orcid || null,
          provider: "semantic",
        }))
      ),
      journal: data.publicationVenue ? { name: data.publicationVenue.name || null } : null,
      citations: data.citationCount ?? 0,
      confidence: data.matchScore ?? 0,
      source: "semantic-scholar",
    });
  }

  static #fromSciELO(data) {
    return new Article({
      title: data.title || data.ti || null,
      doi: data.doi || data.DOI || null,
      abstract: data.abstract || data.ab ? cleanHtml(data.abstract || data.ab) : null,
      publicationDate: data.publication_date || data.da || null,
      language: data.language || data.la || null,
      type: data.type || "article",
      url: data.url || data.fulltext_url || null,
      openAccess: true,
      authors: AuthorMapper.toDomainList(
        (data.authors || data.au || []).map(a => ({
          name: typeof a === "string" ? a : (a.name || a.surname || null),
          provider: "scielo",
        }))
      ),
      journal: data.journal || data.jo ? { name: data.jo || data.journal_title || null } : null,
      citations: data.citations ?? 0,
      source: "scielo",
    });
  }

  static #fromCORE(data) {
    return new Article({
      title: data.title || null,
      doi: data.doi || data.DOI || null,
      abstract: data.abstract || data.description ? cleanHtml(data.abstract || data.description) : null,
      publicationDate: data.publicationDate || data.datePublished || (data.year ? String(data.year) : null),
      language: data.language || null,
      type: data.type || "article",
      url: data.url || data.downloadUrl || null,
      openAccess: true,
      authors: AuthorMapper.toDomainList(
        (data.authors || data.creator || []).map(a => ({
          name: typeof a === "string" ? a : (a.name || null),
          provider: "core",
        }))
      ),
      citations: data.citationCount ?? 0,
      source: "core",
    });
  }

  static #fromGeneric(data) {
    return new Article({
      title: Array.isArray(data.title) ? data.title[0] : data.title || null,
      doi: data.doi || data.DOI || null,
      abstract: data.abstract ? cleanHtml(data.abstract) : null,
      publicationDate: data.publicationDate || data.date || null,
      language: data.language || null,
      type: data.type || null,
      url: data.url || data.URL || null,
      openAccess: data.openAccess || false,
      authors: AuthorMapper.toDomainList(data.authors || data.author || []),
      citations: data.citations ?? 0,
      source: data.source || data.provider || "unknown",
    });
  }

  static toDTO(article, options = {}) {
    if (!article) return null;
    return article.toPlainObject();
  }

  static toPersistence(article) {
    if (!article) return null;
    return article.toPlainObject();
  }

  static fromPersistence(data) {
    if (!data) return Article.empty();
    return Article.fromPlainObject(data);
  }
}

export default ArticleMapper;