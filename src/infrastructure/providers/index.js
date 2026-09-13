import { BaseProvider } from "./base.provider.js";
import { OpenAlexProvider } from "./openalex.provider.js";
import { CrossRefProvider } from "./crossref.provider.js";
import { SemanticScholarProvider } from "./semantic.provider.js";
import { EuropepmcProvider } from "./europepmc.provider.js";
import { SciELOProvider } from "./scielo.provider.js";
import { CoreProvider } from "./core.provider.js";

export {
  BaseProvider,
  OpenAlexProvider,
  CrossRefProvider,
  SemanticScholarProvider,
  EuropepmcProvider,
  SciELOProvider,
  CoreProvider,
};

export function createProviders({ cache, eventPublisher, logger, env = {} }) {
  return [
    new OpenAlexProvider({
      cache,
      eventPublisher,
      logger,
      email: env.OPENALEX_EMAIL || env.CROSSREF_EMAIL || null,
    }),
    new CrossRefProvider({
      cache,
      eventPublisher,
      logger,
      email: env.CROSSREF_EMAIL || null,
    }),
    new SemanticScholarProvider({
      cache,
      eventPublisher,
      logger,
      apiKey: env.SEMANTIC_SCHOLAR_API_KEY || null,
    }),
    new EuropepmcProvider({ cache, eventPublisher, logger }),
    new SciELOProvider({ cache, eventPublisher, logger }),
    new CoreProvider({
      cache,
      eventPublisher,
      logger,
      apiKey: env.CORE_API_KEY || null,
    }),
  ];
}
