import type { AddressInfo } from "node:net";
import { afterEach, beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { resetJobsForTests } from "../src/jobs.js";
import { PLATFORM_SPECS } from "../src/platforms.js";

const realFetch = globalThis.fetch;
let server: ReturnType<ReturnType<typeof createApp>["listen"]>;
let base: string;

beforeAll(async () => {
  server = createApp().listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => server.close());
afterEach(() => {
  globalThis.fetch = realFetch;
  resetJobsForTests();
});

function mockUpstream() {
  globalThis.fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    if (!url.startsWith("https://api.github.com")) return realFetch(input, init);
    if (url.includes("/users/realdev")) {
      return Response.json({ login: "realdev", html_url: "https://github.com/realdev", name: "Real Dev" });
    }
    if (url.includes("/users/")) return new Response("{}", { status: 404 });
    return Response.json({ items: [] });
  }) as typeof fetch;
}

async function post(body: unknown) {
  return realFetch(`${base}/api/search-jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function waitDone(id: string) {
  for (let i = 0; i < 50; i++) {
    const j = await (await realFetch(`${base}/api/search-jobs/${id}`)).json();
    if (j.status !== "running") return j;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error("job did not finish");
}

describe("POST /api/search-jobs validation", () => {
  it("requires consent", async () => {
    expect((await post({ name: "A", platforms: ["github"] })).status).toBe(400);
  });
  it("requires a name or username", async () => {
    expect((await post({ consent: true, platforms: ["github"] })).status).toBe(400);
  });
  it("rejects bad usernames and unknown platforms", async () => {
    expect((await post({ consent: true, usernames: ["bad!"], platforms: ["github"] })).status).toBe(400);
    expect((await post({ consent: true, name: "A", platforms: ["myspace"] })).status).toBe(400);
  });
});

describe("search jobs", () => {
  it("returns real, non-demo links and verifies GitHub accounts through the API", async () => {
    mockUpstream();
    const res = await post({
      consent: true,
      usernames: ["realdev", "ghost-user"],
      platforms: ["github", "instagram", "linkedin"],
    });
    expect(res.status).toBe(202);
    const job = await waitDone((await res.json()).id);
    expect(job.status).toBe("completed");

    const gh = job.results.filter((r: { platform: string; kind: string }) => r.platform === "github" && r.kind === "profile");
    expect(gh).toHaveLength(1);
    expect(gh[0]).toMatchObject({ url: "https://github.com/realdev", verification: "verified", isDemo: false });

    const ig = job.results.find((r: { platform: string; kind: string }) => r.platform === "instagram" && r.kind === "profile");
    expect(ig.url).toBe("https://www.instagram.com/realdev/");
    expect(ig.verification).toBe("unverified");
    expect(job.results.some((r: { url: string }) => r.url.includes("example.com"))).toBe(false);
  });

  it("404s for unknown job ids", async () => {
    expect((await realFetch(`${base}/api/search-jobs/not-a-uuid`)).status).toBe(404);
  });
});

describe("platform profile parsing", () => {
  it("accepts profile URLs and rejects non-profile pages", () => {
    expect(PLATFORM_SPECS.linkedin.parseProfile("https://www.linkedin.com/in/jane-doe-123/")).toBe("jane-doe-123");
    expect(PLATFORM_SPECS.linkedin.parseProfile("https://www.linkedin.com/company/acme")).toBeNull();
    expect(PLATFORM_SPECS.instagram.parseProfile("https://www.instagram.com/p/abc/")).toBeNull();
    expect(PLATFORM_SPECS.x.parseProfile("https://x.com/jack")).toBe("jack");
    expect(PLATFORM_SPECS.x.parseProfile("https://x.com/home")).toBeNull();
    expect(PLATFORM_SPECS.tiktok.parseProfile("https://www.tiktok.com/@someone")).toBe("someone");
    expect(PLATFORM_SPECS.youtube.parseProfile("https://www.youtube.com/@creator")).toBe("@creator");
  });
});
