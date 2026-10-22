import { PLATFORM_MAP } from "../lib/platforms";
import type { PlatformId, SearchQuery, SearchResult } from "../types";
import type { ProviderPlatformEvent, SearchProvider } from "./types";

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const t = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "");
}

/** Demo URLs point at example.com so they never resolve to a real person's profile. */
function demoUrl(platform: PlatformId, handle: string): string {
  return `https://example.com/demo/${platform}/${encodeURIComponent(handle)}`;
}

function buildResults(platform: PlatformId, query: SearchQuery): SearchResult[] {
  const info = PLATFORM_MAP[platform];
  const results: SearchResult[] = [];
  const base = `${platform}-${Date.now()}`;

  query.usernames.forEach((u, i) => {
    results.push({
      id: `${base}-u${i}`,
      platform,
      kind: "profile",
      url: demoUrl(platform, u),
      username: u,
      displayName: query.name || undefined,
      reason: `Demo result: exact match for the username "${u}" you entered.`,
      basis: "username-exact",
      status: "unverified",
      isDemo: true,
    });
  });

  if (query.name) {
    const s = slug(query.name);
    if (s) {
      results.push({
        id: `${base}-n1`,
        platform,
        kind: "profile",
        url: demoUrl(platform, s.replace(/\./g, "_")),
        username: s.replace(/\./g, "_"),
        displayName: query.name,
        reason: `Demo result: username similar to your name "${query.name}".`,
        basis: "username-similar",
        status: "unverified",
        isDemo: true,
      });
    }
  }

  // Genuine link to the platform's own public search page.
  const term = query.usernames[0] ?? query.name;
  if (term) {
    results.push({
      id: `${base}-s`,
      platform,
      kind: "search-link",
      url: info.searchUrl(term),
      reason: `Open ${info.name}'s public search for "${term}" and review results yourself.`,
      basis: "platform-search",
      status: "unverified",
      isDemo: false,
    });
  }
  return results;
}

export class MockSearchProvider implements SearchProvider {
  readonly name = "Demo provider";
  readonly isDemo = true;

  supports(): boolean {
    return true;
  }

  async search(
    query: SearchQuery,
    onEvent: (event: ProviderPlatformEvent) => void,
    signal: AbortSignal,
  ): Promise<void> {
    for (const platform of query.platforms) {
      onEvent({ platform, state: "running" });
      try {
        await delay(500 + Math.random() * 600, signal);
        onEvent({ platform, state: "done", results: buildResults(platform, query) });
      } catch (err) {
        if ((err as Error).name === "AbortError") throw err;
        onEvent({ platform, state: "error", message: "Search failed for this platform." });
      }
    }
  }
}
