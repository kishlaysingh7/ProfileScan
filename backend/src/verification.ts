import { randomBytes, randomUUID } from "node:crypto";
import { config } from "./config.js";
import { PLATFORM_SPECS } from "./platforms.js";
import { fetchJson } from "./providers/http.js";
import type { PlatformId } from "./types.js";

const TTL_MS = 30 * 60 * 1000;
const MAX_ATTEMPTS = 20;
const MAX_ENTRIES = 2000;
const MAX_BYTES = 512 * 1024;
const MAX_REDIRECTS = 3;
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export interface Verification {
  id: string;
  platform: PlatformId;
  profileUrl: string;
  code: string;
  createdAt: number;
  attempts: number;
}

export type CheckStatus = "verified" | "code-not-found" | "unreachable" | "expired" | "too-many-attempts";

export interface CheckResult {
  status: CheckStatus;
  message: string;
}

const store = new Map<string, Verification>();

export class VerificationInputError extends Error {}

function newCode(): string {
  const bytes = randomBytes(10);
  return "pf-" + Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

function sweep(now = Date.now()) {
  for (const [id, v] of store) if (now - v.createdAt > TTL_MS) store.delete(id);
}
setInterval(sweep, 60_000).unref();

/** Only profile URLs on the known platform hosts are accepted, which also prevents SSRF. */
export function createVerification(platform: PlatformId, profileUrl: string): Verification {
  sweep();
  if (store.size >= MAX_ENTRIES) throw new VerificationInputError("Server is busy. Try again shortly.");
  const spec = PLATFORM_SPECS[platform];
  if (!spec.parseProfile(profileUrl)) {
    throw new VerificationInputError(`That is not a valid ${spec.name} profile URL.`);
  }
  const v: Verification = { id: randomUUID(), platform, profileUrl, code: newCode(), createdAt: Date.now(), attempts: 0 };
  store.set(v.id, v);
  return v;
}

export function getVerification(id: string): Verification | undefined {
  return store.get(id);
}

export function resetVerificationsForTests() {
  store.clear();
}

async function readCapped(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let text = "";
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    total += value.byteLength;
    text += decoder.decode(value, { stream: true });
    if (total >= MAX_BYTES) {
      await reader.cancel();
      break;
    }
  }
  return text;
}

/** Fetches one public profile page. Redirects are followed manually and must stay on valid profile URLs. */
async function fetchPublicPage(platform: PlatformId, url: string, signal: AbortSignal): Promise<string | null> {
  const spec = PLATFORM_SPECS[platform];
  let current = url;
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const res = await fetch(current, {
      redirect: "manual",
      headers: { "User-Agent": "ProfileFinder-Verifier/0.1", Accept: "text/html,application/xhtml+xml" },
      signal: AbortSignal.any([signal, AbortSignal.timeout(config.providerTimeoutMs)]),
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) return null;
      const next = new URL(loc, current).toString();
      if (!spec.parseProfile(next)) return null;
      current = next;
      continue;
    }
    if (res.status !== 200) return null;
    return readCapped(res);
  }
  return null;
}

async function githubBio(profileUrl: string, signal: AbortSignal): Promise<string | null> {
  const login = PLATFORM_SPECS.github.parseProfile(profileUrl);
  if (!login) return null;
  const { status, body } = await fetchJson(
    `https://api.github.com/users/${encodeURIComponent(login)}`,
    { headers: config.githubToken ? { Authorization: `Bearer ${config.githubToken}` } : {} },
    signal,
  );
  if (status !== 200) return null;
  const u = body as { bio?: string | null; company?: string | null; blog?: string | null };
  return [u.bio, u.company, u.blog].filter(Boolean).join("\n");
}

export async function checkVerification(v: Verification, signal: AbortSignal): Promise<CheckResult> {
  if (Date.now() - v.createdAt > TTL_MS) {
    store.delete(v.id);
    return { status: "expired", message: "This code has expired. Start again to get a new one." };
  }
  if (v.attempts >= MAX_ATTEMPTS) {
    return { status: "too-many-attempts", message: "Too many checks. Start again to get a new code." };
  }
  v.attempts++;

  let content: string | null;
  try {
    content = v.platform === "github" ? await githubBio(v.profileUrl, signal) : await fetchPublicPage(v.platform, v.profileUrl, signal);
  } catch {
    content = null;
  }
  if (content === null) {
    return {
      status: "unreachable",
      message: `We couldn't read this ${PLATFORM_SPECS[v.platform].name} profile. It may be private, require login, or block automated access.`,
    };
  }
  if (content.toLowerCase().includes(v.code)) {
    store.delete(v.id);
    return { status: "verified", message: "Code found. You control this profile. You can now remove the code from your bio." };
  }
  return {
    status: "code-not-found",
    message: "We didn't find the code yet. Save your bio, wait a minute (pages can be cached), then check again.",
  };
}
