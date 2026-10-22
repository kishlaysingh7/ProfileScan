import { config } from "../config.js";

export class UpstreamError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}

/** JSON fetch with an overall timeout, restricted to https. */
export async function fetchJson(
  url: string,
  init: { headers?: Record<string, string> },
  signal: AbortSignal,
): Promise<{ status: number; body: unknown }> {
  if (!url.startsWith("https://")) throw new UpstreamError("Refusing non-HTTPS request");
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "ProfileFinder/0.1", ...init.headers },
    signal: AbortSignal.any([signal, AbortSignal.timeout(config.providerTimeoutMs)]),
  });
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* non-JSON body (e.g. 404 html) */
  }
  return { status: res.status, body };
}
