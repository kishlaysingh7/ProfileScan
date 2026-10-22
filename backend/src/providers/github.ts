import { randomUUID } from "node:crypto";
import { config } from "../config.js";
import { PLATFORM_SPECS } from "../platforms.js";
import type { PlatformId, ProviderOutput, SearchProvider, SearchQuery, SearchResult } from "../types.js";
import { fetchJson, UpstreamError } from "./http.js";

interface GhUser {
  login?: string;
  html_url?: string;
  name?: string | null;
}

function headers(): Record<string, string> {
  return {
    "X-GitHub-Api-Version": "2022-11-28",
    ...(config.githubToken ? { Authorization: `Bearer ${config.githubToken}` } : {}),
  };
}

/** Uses GitHub's official REST API. Accounts returned here are confirmed to exist. */
export class GitHubProvider implements SearchProvider {
  readonly name = "GitHub API";

  enabled(platform: PlatformId): boolean {
    return platform === "github";
  }

  async search(query: SearchQuery, _platform: PlatformId, signal: AbortSignal): Promise<ProviderOutput> {
    const spec = PLATFORM_SPECS.github;
    const results: SearchResult[] = [];
    const seen = new Set<string>();
    let note: string | undefined;

    for (const username of query.usernames) {
      if (!spec.usernameRe.test(username)) continue;
      const { status, body } = await fetchJson(
        `https://api.github.com/users/${encodeURIComponent(username)}`,
        { headers: headers() },
        signal,
      );
      if (status === 404) continue;
      if (status === 403 || status === 429) throw new UpstreamError("GitHub rate limit reached. Try again later.", status);
      if (status !== 200) throw new UpstreamError(`GitHub API returned ${status}`, status);
      const u = body as GhUser;
      if (!u.login || !u.html_url) continue;
      seen.add(u.login.toLowerCase());
      results.push({
        id: randomUUID(),
        platform: "github",
        kind: "profile",
        url: u.html_url,
        username: u.login,
        displayName: u.name ?? undefined,
        reason: `GitHub's API confirms an account named "${u.login}" exists.`,
        basis: "username-exact",
        status: "unverified",
        verification: "verified",
        source: this.name,
        isDemo: false,
      });
    }

    if (query.name) {
      const q = encodeURIComponent(`"${query.name}" in:fullname`);
      const { status, body } = await fetchJson(
        `https://api.github.com/search/users?q=${q}&per_page=5`,
        { headers: headers() },
        signal,
      );
      if (status === 403 || status === 429) {
        note = "GitHub rate limit reached for name search.";
      } else if (status === 200) {
        for (const item of ((body as { items?: GhUser[] }).items ?? [])) {
          if (!item.login || !item.html_url || seen.has(item.login.toLowerCase())) continue;
          seen.add(item.login.toLowerCase());
          results.push({
            id: randomUUID(),
            platform: "github",
            kind: "profile",
            url: item.html_url,
            username: item.login,
            reason: `GitHub user whose public name matches "${query.name}". Check it is you.`,
            basis: "name-based",
            status: "unverified",
            verification: "verified",
            source: this.name,
            isDemo: false,
          });
        }
      }
    }
    return { results, note };
  }
}
