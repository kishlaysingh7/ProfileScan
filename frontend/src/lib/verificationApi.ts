import type { PlatformId } from "../types";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";

export interface VerificationStart {
  id: string;
  code: string;
  expiresInSeconds: number;
}

export type CheckStatus = "verified" | "code-not-found" | "unreachable" | "expired" | "too-many-attempts";

export interface VerificationCheck {
  status: CheckStatus;
  message: string;
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data as T;
}

export function startVerification(platform: PlatformId, profileUrl: string): Promise<VerificationStart> {
  return post("/api/verifications", { consent: true, platform, profileUrl });
}

export function checkVerification(id: string): Promise<VerificationCheck> {
  return post(`/api/verifications/${id}/check`);
}
