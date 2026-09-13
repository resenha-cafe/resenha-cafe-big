import { BaseProvider } from "./base.provider.js";
import { SemanticScholarAdapter } from "../adapters/semantic-scholar.adapter.js";

export class SemanticScholarProvider extends BaseProvider {
  constructor(options = {}) {
    const adapter = options.adapter || new SemanticScholarAdapter({
      timeout: options.timeout,
      logger: options.logger,
      rateLimiter: options.rateLimiter,
      healthThreshold: options.healthThreshold,
      apiKey: options.apiKey,
    });

    super({
      name: "semantic",
      adapter,
      cache: options.cache,
      eventPublisher: options.eventPublisher,
      logger: options.logger,
    });
  }
}

export default SemanticScholarProvider;