import { BaseProvider } from "./base.provider.js";
import { CrossRefAdapter } from "../adapters/crossref.adapter.js";

export class CrossRefProvider extends BaseProvider {
  constructor(options = {}) {
    const adapter = options.adapter || new CrossRefAdapter({
      timeout: options.timeout,
      logger: options.logger,
      rateLimiter: options.rateLimiter,
      healthThreshold: options.healthThreshold,
    });

    super({
      name: "crossref",
      adapter,
      cache: options.cache,
      eventPublisher: options.eventPublisher,
      logger: options.logger,
    });
  }
}

export default CrossRefProvider;