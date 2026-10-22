import { randomUUID } from "node:crypto";
import { config } from "../config.js";
import { PLATFORM_SPECS } from "../platforms.js";
import type { PlatformId, ProviderOutput, SearchProvider, SearchQuery, SearchResult } from "../types.js";
import { fetchJson, UpstreamError } from "./http.js";

interface BraveResponse {
  web?: { results?: { url?: string; title?: string }[] };
}

/**
 * Finds public profile pages through the Brave Search API (a licensed search API).
 * Requires BRAVE_SEARCH_API_KEY. Results are unverified suggestions.
 */
export class BraveSearchProvider implements SearchProvider {
  readonly name = "Brave Search API";

  enabled(platform: PlatformId): boolean {
    return !!config.braveApiKey && platform !== "github";
  }

  async search(query: SearchQuery, platform: PlatformId, signal: AbortSignal): Promise<ProviderOutput> {
    const spec = PLATFORM_SPECS[platform];
    const term = query.name || query.usernames[0];
    if (!term || !config.braveApiKey) return { results: [] };

    const q = encodeURIComponent(`site:${spec.site} "${term}"`);
    const { status, body } = await fetchJson(
      `https://api.search.brave.com/res/v1/web/search?q=${q}&count=10&safesearch=moderate`,
      { headers: { "X-Subscription-Token": config.braveApiKey } },
      signal,
    );
    if (status === 429) throw new UpstreamError("Web search quota reached.", status);
    if (status !== 200) throw new UpstreamError(`Web search returned ${status}`, status);

    const results: SearchResult[] = [];
    const seen = new Set<string>();
    for (const item of (body as BraveResponse).web?.results ?? []) {
      if (!item.url) continue;
      const handle = spec.parseProfile(item.url);
      if (!handle) continue;
      const key = item.url.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      results.push({
        id: randomUUID(),
        platform,
        kind: "profile",
        url: item.url,
        username: handle.replace(/^@/, ""),
        displayName: item.title?.slice(0, 120),
        reason: `Public ${spec.name} profile page returned by web search for "${term}". Check it is you.`,
        basis: "name-based",
        status: "unverified",
        verification: "unverified",
        source: this.name,
        isDemo: false,
      });
      if (results.length >= 5) break;
    }
    return { results };
  }
}
