export type PlatformId =
  | "instagram"
  | "facebook"
  | "linkedin"
  | "x"
  | "tiktok"
  | "youtube"
  | "github"
  | "web";

export type MatchStatus = "unverified" | "confirmed" | "rejected" | "uncertain";

export type Verification = "verified" | "unverified";

export type ResultKind = "profile" | "search-link";

export type MatchBasis = "username-exact" | "username-similar" | "name-based" | "platform-search" | "image-match";

export interface SearchResult {
  id: string;
  platform: PlatformId;
  kind: ResultKind;
  url: string;
  username?: string;
  displayName?: string;
  reason: string;
  basis: MatchBasis;
  status: MatchStatus;
  verification?: Verification;
  ownershipVerified?: boolean;
  source?: string;
  isDemo: boolean;
}

export interface SearchQuery {
  name: string;
  usernames: string[];
  platforms: PlatformId[];
}

export type JobStatus = "idle" | "running" | "completed" | "failed";

export type PlatformProgressState = "pending" | "running" | "done" | "error";

export interface PlatformProgress {
  platform: PlatformId;
  state: PlatformProgressState;
  message?: string;
}

export interface SearchJob {
  id: string;
  status: JobStatus;
  providerName: string;
  isDemo: boolean;
  query: SearchQuery;
  progress: PlatformProgress[];
  results: SearchResult[];
  error?: string;
}

export interface SavedProfile extends Omit<SearchResult, "kind" | "isDemo"> {
  savedAt: string;
  isDemo: boolean;
}

export interface UserSettings {
  consentGiven: boolean;
  consentRecords: ConsentRecord[];
}

export interface ConsentRecord {
  action: "granted" | "withdrawn";
  recordedAt: string;
}
