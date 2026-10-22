import { randomUUID } from "node:crypto";
import { PLATFORM_SPECS } from "../platforms.js";
import type { PlatformId, ProviderOutput, SearchProvider, SearchQuery, SearchResult } from "../types.js";

/**
 * Builds links to the platform's own public pages. Nothing is fetched from the platform,
 * so existence is NOT verified – the user opens the link and decides.
 */
export class DirectLinkProvider implements SearchProvider {
  readonly name = "Direct links";

  enabled(): boolean {
    return true;
  }

  async search(query: SearchQuery, platform: PlatformId): Promise<ProviderOutput> {
    const spec = PLATFORM_SPECS[platform];
    const results: SearchResult[] = [];
    const skipped: string[] = [];

    for (const username of platform === "github" ? [] : query.usernames) {
      if (!spec.usernameRe.test(username)) {
        skipped.push(username);
        continue;
      }
      results.push({
        id: randomUUID(),
        platform,
        kind: "profile",
        url: spec.profileUrl(username),
        username,
        reason: `Link to the ${spec.name} page for "${username}". We have not checked that it exists or that it is yours.`,
        basis: "username-exact",
        status: "unverified",
        verification: "unverified",
        source: this.name,
        isDemo: false,
      });
    }

    const term = query.usernames[0] ?? query.name;
    if (term) {
      results.push({
        id: randomUUID(),
        platform,
        kind: "search-link",
        url: spec.searchUrl(term),
        reason: `Open ${spec.name}'s own public search for "${term}" and review the results yourself.`,
        basis: "platform-search",
        status: "unverified",
        verification: "unverified",
        source: this.name,
        isDemo: false,
      });
    }

    return {
      results,
      note: skipped.length ? `Skipped usernames not valid on ${spec.name}: ${skipped.join(", ")}` : undefined,
    };
  }
}
