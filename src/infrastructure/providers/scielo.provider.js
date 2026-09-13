import { BaseProvider } from "./base.provider.js";
import { SciELOAdapter } from "../adapters/scielo.adapter.js";

export class SciELOProvider extends BaseProvider {
  constructor(options = {}) {
    const adapter = options.adapter || new SciELOAdapter({
      timeout: options.timeout,
      logger: options.logger,
      rateLimiter: options.rateLimiter,
      healthThreshold: options.healthThreshold,
    });

    super({
      name: "scielo",
      adapter,
      cache: options.cache,
      eventPublisher: options.eventPublisher,
      logger: options.logger,
    });
  }
}

export default SciELOProvider;