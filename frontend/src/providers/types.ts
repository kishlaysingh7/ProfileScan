import type { PlatformId, SearchQuery, SearchResult } from "../types";

export interface ProviderPlatformEvent {
  platform: PlatformId;
  state: "running" | "done" | "error";
  message?: string;
  results?: SearchResult[];
}

/**
 * A search provider turns text inputs (name / usernames) into candidate public profile links.
 * Providers never receive the uploaded image and must not perform face recognition.
 * Real implementations (official APIs, permitted search engines) plug in here.
 */
export interface SearchProvider {
  readonly name: string;
  /** True when results are fabricated demo data. The UI labels these clearly. */
  readonly isDemo: boolean;
  supports(platform: PlatformId): boolean;
  search(
    query: SearchQuery,
    onEvent: (event: ProviderPlatformEvent) => void,
    signal: AbortSignal,
  ): Promise<void>;
}
