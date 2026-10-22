export type PlatformId = "instagram" | "facebook" | "linkedin" | "x" | "tiktok" | "youtube" | "github";

export type MatchBasis = "username-exact" | "username-similar" | "name-based" | "platform-search";
export type Verification = "verified" | "unverified";

export interface SearchQuery {
  name: string;
  usernames: string[];
  platforms: PlatformId[];
}

export interface SearchResult {
  id: string;
  platform: PlatformId;
  kind: "profile" | "search-link";
  url: string;
  username?: string;
  displayName?: string;
  reason: string;
  basis: MatchBasis;
  status: "unverified";
  verification: Verification;
  source: string;
  isDemo: false;
}

export type PlatformState = "pending" | "running" | "done" | "error";

export interface PlatformProgress {
  platform: PlatformId;
  state: PlatformState;
  message?: string;
}

export interface Job {
  id: string;
  status: "running" | "completed" | "failed";
  query: SearchQuery;
  progress: PlatformProgress[];
  results: SearchResult[];
  createdAt: number;
  error?: string;
}

export interface ProviderOutput {
  results: SearchResult[];
  note?: string;
}

export interface SearchProvider {
  readonly name: string;
  enabled(platform: PlatformId): boolean;
  search(query: SearchQuery, platform: PlatformId, signal: AbortSignal): Promise<ProviderOutput>;
}
