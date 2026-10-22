import { ApiSearchProvider } from "./apiProvider";
import { MockSearchProvider } from "./mockProvider";
import type { SearchProvider } from "./types";

/** Live backend by default. Set VITE_USE_DEMO=true to use fabricated demo data offline. */
export function getSearchProvider(): SearchProvider {
  return import.meta.env.VITE_USE_DEMO === "true" ? new MockSearchProvider() : new ApiSearchProvider();
}

export type { SearchProvider, ProviderPlatformEvent } from "./types";
