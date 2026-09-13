import { BaseProvider } from "./base.provider.js";
import { CoreAdapter } from "../adapters/core.adapter.js";

export class CoreProvider extends BaseProvider {
  constructor(options = {}) {
    const adapter = options.adapter || new CoreAdapter({
      timeout: options.timeout,
      logger: options.logger,
      rateLimiter: options.rateLimiter,
      healthThreshold: options.healthThreshold,
    });

    super({
      name: "core",
      adapter,
      cache: options.cache,
      eventPublisher: options.eventPublisher,
      logger: options.logger,
    });
  }
}

export default CoreProvider;