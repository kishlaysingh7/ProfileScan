import type { AddressInfo } from "node:net";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { resetVerificationsForTests } from "../src/verification.js";

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
  resetVerificationsForTests();
});

const json = (body: unknown) => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

async function start(platform: string, profileUrl: string) {
  return realFetch(`${base}/api/verifications`, json({ consent: true, platform, profileUrl }));
}
const check = (id: string) => realFetch(`${base}/api/verifications/${id}/check`, { method: "POST" });

function mockPlatform(handler: (url: string) => Response) {
  globalThis.fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    if (url.startsWith(base)) return realFetch(input, init);
    return handler(url);
  }) as typeof fetch;
}

describe("bio-code verification", () => {
  it("rejects URLs that are not profile pages on the platform (SSRF guard)", async () => {
    expect((await start("instagram", "https://evil.example.com/someone")).status).toBe(400);
    expect((await start("instagram", "http://127.0.0.1:4000/admin")).status).toBe(400);
    expect((await start("linkedin", "https://www.linkedin.com/company/acme")).status).toBe(400);
  });

  it("requires consent", async () => {
    const res = await realFetch(`${base}/api/verifications`, json({ platform: "x", profileUrl: "https://x.com/jack" }));
    expect(res.status).toBe(400);
  });

  it("verifies when the code is in the public page, and not before", async () => {
    const created = await (await start("x", "https://x.com/jack")).json();
    expect(created.code).toMatch(/^pf-[a-z2-9]{10}$/);

    mockPlatform(() => new Response("<html>nothing here</html>", { status: 200 }));
    expect((await (await check(created.id)).json()).status).toBe("code-not-found");

    mockPlatform(() => new Response(`<meta property="og:description" content="Hi ${created.code}">`, { status: 200 }));
    expect((await (await check(created.id)).json()).status).toBe("verified");

    // a verified code cannot be reused
    expect((await check(created.id)).status).toBe(404);
  });

  it("reports unreachable pages honestly and does not follow redirects off-platform", async () => {
    const created = await (await start("instagram", "https://www.instagram.com/someone")).json();
    mockPlatform(() => new Response(null, { status: 302, headers: { Location: "https://evil.example.com/x" } }));
    expect((await (await check(created.id)).json()).status).toBe("unreachable");
    mockPlatform(() => new Response("login", { status: 403 }));
    expect((await (await check(created.id)).json()).status).toBe("unreachable");
  });

  it("uses the GitHub API for GitHub profiles", async () => {
    const created = await (await start("github", "https://github.com/octocat")).json();
    mockPlatform((url) =>
      url.startsWith("https://api.github.com/users/octocat")
        ? Response.json({ bio: `building things ${created.code}` })
        : new Response("", { status: 500 }),
    );
    expect((await (await check(created.id)).json()).status).toBe("verified");
  });
});
