import { BaseProvider } from "./base.provider.js";
import { EuropepmcAdapter } from "../adapters/europepmc.adapter.js";

export class EuropepmcProvider extends BaseProvider {
  constructor(options = {}) {
    const adapter = options.adapter || new EuropepmcAdapter({
      timeout: options.timeout,
      logger: options.logger,
      rateLimiter: options.rateLimiter,
      healthThreshold: options.healthThreshold,
    });

    super({
      name: "europepmc",
      adapter,
      cache: options.cache,
      eventPublisher: options.eventPublisher,
      logger: options.logger,
    });
  }
}

export default EuropepmcProvider;