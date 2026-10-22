import { PLATFORM_SPECS } from "../platforms.js";
import type { PlatformId, SearchProvider, SearchQuery, SearchResult } from "../types.js";
import { BraveSearchProvider } from "./braveSearch.js";
import { DirectLinkProvider } from "./directLinks.js";
import { GitHubProvider } from "./github.js";

export const providers: SearchProvider[] = [
  new GitHubProvider(),
  new BraveSearchProvider(),
  new DirectLinkProvider(),
];

export interface PlatformOutcome {
  results: SearchResult[];
  notes: string[];
}

/** Runs every enabled provider for a platform. One provider failing never hides the others. */
export async function searchPlatform(
  query: SearchQuery,
  platform: PlatformId,
  signal: AbortSignal,
  list: SearchProvider[] = providers,
): Promise<PlatformOutcome> {
  const active = list.filter((p) => p.enabled(platform));
  const settled = await Promise.allSettled(active.map((p) => p.search(query, platform, signal)));

  const results: SearchResult[] = [];
  const notes: string[] = [];
  settled.forEach((s, i) => {
    if (s.status === "fulfilled") {
      results.push(...s.value.results);
      if (s.value.note) notes.push(s.value.note);
    } else {
      const reason = s.reason instanceof Error && s.reason.name !== "TimeoutError" ? s.reason.message : "timed out";
      notes.push(`${active[i].name} unavailable: ${reason}`);
    }
  });

  const seen = new Set<string>();
  const unique = results.filter((r) => {
    const key = `${r.kind}:${r.url.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const rank = (r: SearchResult) => (r.kind === "search-link" ? 2 : r.verification === "verified" ? 0 : 1);
  unique.sort((a, b) => rank(a) - rank(b));

  if (unique.every((r) => r.kind === "search-link") && !notes.length) {
    notes.push(`No profile candidates for ${PLATFORM_SPECS[platform].name}.`);
  }
  return { results: unique, notes };
}
