import { BaseProvider } from "./base.provider.js";
import { OpenAlexAdapter } from "../adapters/openalex.adapter.js";

export class OpenAlexProvider extends BaseProvider {
  constructor(options = {}) {
    const adapter = options.adapter || new OpenAlexAdapter({
      email: options.email,
      timeout: options.timeout,
      logger: options.logger,
      rateLimiter: options.rateLimiter,
      healthThreshold: options.healthThreshold,
    });

    super({
      name: "openalex",
      adapter,
      cache: options.cache,
      eventPublisher: options.eventPublisher,
      logger: options.logger,
    });
  }
}

export default OpenAlexProvider;
