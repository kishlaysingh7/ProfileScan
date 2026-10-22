import type { PlatformId, SearchQuery, SearchResult } from "../types";
import type { ProviderPlatformEvent, SearchProvider } from "./types";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";
const POLL_MS = 800;

interface ApiProgress {
  platform: PlatformId;
  state: "pending" | "running" | "done" | "error";
  message?: string;
}

interface ApiJob {
  id: string;
  status: "running" | "completed" | "failed";
  progress: ApiProgress[];
  results: SearchResult[];
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => { clearTimeout(t); reject(new DOMException("Aborted", "AbortError")); }, { once: true });
  });
}

async function api<T>(path: string, init: RequestInit, signal: AbortSignal): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    signal,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch { /* ignore */ }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

/** Talks to the ProfileFinder backend. Only text (name / usernames) is sent – never the photo. */
export class ApiSearchProvider implements SearchProvider {
  readonly name = "Live search";
  readonly isDemo = false;

  supports(): boolean {
    return true;
  }

  async search(
    query: SearchQuery,
    onEvent: (event: ProviderPlatformEvent) => void,
    signal: AbortSignal,
  ): Promise<void> {
    const created = await api<ApiJob>(
      "/api/search-jobs",
      { method: "POST", body: JSON.stringify({ ...query, consent: true }) },
      signal,
    );
    const emitted = new Map<PlatformId, string>();

    try {
      for (;;) {
        const job = await api<ApiJob>(`/api/search-jobs/${created.id}`, { method: "GET" }, signal);
        for (const p of job.progress) {
          if (p.state === "pending" || emitted.get(p.platform) === p.state) continue;
          emitted.set(p.platform, p.state);
          onEvent({
            platform: p.platform,
            state: p.state,
            message: p.message,
            results: p.state === "done" ? job.results.filter((r) => r.platform === p.platform) : undefined,
          });
        }
        if (job.status === "completed") return;
        if (job.status === "failed") throw new Error("The search could not be completed.");
        await sleep(POLL_MS, signal);
      }
    } finally {
      // Free the server-side job as soon as we are done with it.
      void fetch(`${API_BASE}/api/search-jobs/${created.id}`, { method: "DELETE", keepalive: true }).catch(() => undefined);
    }
  }
}
