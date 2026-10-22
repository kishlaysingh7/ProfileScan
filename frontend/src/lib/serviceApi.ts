export interface ServiceCapabilities {
  githubApi: boolean;
  webSearch: boolean;
  reverseImageSearch: boolean;
  googleVisionImageSearch: boolean;
  serpApiImageSearch: boolean;
  imageSearchMode: "mock" | "google" | "serpapi" | "unavailable";
}

export type ServiceState = "checking" | "online" | "offline";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";

export async function getServiceCapabilities(): Promise<ServiceCapabilities> {
  const [healthResponse, capabilitiesResponse] = await Promise.all([
    fetch(`${API_BASE}/api/health`),
    fetch(`${API_BASE}/api/capabilities`),
  ]);
  if (!healthResponse.ok || !capabilitiesResponse.ok) throw new Error("The service could not be reached.");
  const health = await healthResponse.json() as { ok?: boolean };
  if (!health.ok) throw new Error("The service is unavailable.");
  return capabilitiesResponse.json() as Promise<ServiceCapabilities>;
}
