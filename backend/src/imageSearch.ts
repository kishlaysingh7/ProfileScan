import { randomUUID } from "node:crypto";
import { config } from "./config.js";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const JOB_TTL_MS = 30 * 60 * 1000;
const MAX_JOBS = 200;

export interface ImageSearchResult {
  id: string;
  url: string;
  displayName: string;
  reason: string;
}

export interface ImageSearchJob {
  id: string;
  status: "running" | "completed" | "failed";
  results: ImageSearchResult[];
  providerName: string;
  isDemo: boolean;
  message?: string;
  createdAt: number;
}

interface VisionResponse {
  responses?: Array<{
    error?: { message?: string };
    webDetection?: {
      pagesWithMatchingImages?: Array<{ url?: string; pageTitle?: string }>;
      fullMatchingImages?: Array<{ url?: string }>;
      partialMatchingImages?: Array<{ url?: string }>;
    };
  }>;
}

interface SerpApiLensResponse {
  error?: string;
  visual_matches?: Array<{ link?: string; title?: string; source?: string }>;
  exact_matches?: Array<{ link?: string; title?: string; source?: string }>;
}

const jobs = new Map<string, ImageSearchJob>();
let serpApiUsageMonth = "";
let serpApiUsageCount = 0;

export class ImageSearchInputError extends Error {}
export class ImageSearchUnavailableError extends Error {}

function sweep(now = Date.now()) {
  for (const [id, job] of jobs) {
    if (now - job.createdAt > JOB_TTL_MS) jobs.delete(id);
  }
}
setInterval(sweep, 60_000).unref();

function imageMimeType(bytes: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

function safeHttpUrl(value: string | undefined): string | null {
  if (!value || value.length > 2_000) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function isGoogleShareUrl(value: string): boolean {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host === "share.google" || host === "drive.google.com";
  } catch {
    return false;
  }
}

export function createImageSearch(bytes: Buffer): ImageSearchJob {
  sweep();
  if (!config.mockImageSearch && !config.googleVisionApiKey) {
    throw new ImageSearchUnavailableError("Reverse image search is not configured. Add GOOGLE_VISION_API_KEY to the server environment.");
  }
  if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) {
    throw new ImageSearchInputError("Image must be between 1 byte and 5 MB.");
  }
  if (!imageMimeType(bytes)) {
    throw new ImageSearchInputError("Upload a valid JPG, PNG, or WEBP image.");
  }
  if (jobs.size >= MAX_JOBS) throw new ImageSearchUnavailableError("Image search is busy. Try again shortly.");

  const job: ImageSearchJob = {
    id: randomUUID(),
    status: "running",
    results: [],
    providerName: config.mockImageSearch ? "Mock reverse image search" : "Google Vision Web Detection",
    isDemo: config.mockImageSearch,
    createdAt: Date.now(),
  };
  jobs.set(job.id, job);
  void (config.mockImageSearch ? mockSearch(job) : search(job, bytes));
  return job;
}

export function createImageUrlSearch(imageUrl: string): ImageSearchJob {
  sweep();
  if (!config.serpApiKey) {
    throw new ImageSearchUnavailableError("Public-image reverse search is not configured. Add SERPAPI_KEY to the server environment.");
  }
  if (!safeHttpUrl(imageUrl)) {
    throw new ImageSearchInputError("Provide a valid public HTTP or HTTPS image URL.");
  }
  if (isGoogleShareUrl(imageUrl)) {
    throw new ImageSearchInputError("Google sharing links are not direct image URLs. Use a public image-file URL instead.");
  }
  const month = new Date().toISOString().slice(0, 7);
  if (month !== serpApiUsageMonth) {
    serpApiUsageMonth = month;
    serpApiUsageCount = 0;
  }
  if (serpApiUsageCount >= config.serpApiMonthlyLimit) {
    throw new ImageSearchUnavailableError(`The ${config.serpApiMonthlyLimit}-search monthly SerpApi limit has been reached.`);
  }
  if (jobs.size >= MAX_JOBS) throw new ImageSearchUnavailableError("Image search is busy. Try again shortly.");

  serpApiUsageCount += 1;
  const job: ImageSearchJob = {
    id: randomUUID(),
    status: "running",
    results: [],
    providerName: "SerpApi Google Lens",
    isDemo: false,
    createdAt: Date.now(),
  };
  jobs.set(job.id, job);
  void searchSerpApi(job, imageUrl);
  return job;
}

export function getImageSearch(id: string): ImageSearchJob | undefined {
  return jobs.get(id);
}

export function deleteImageSearch(id: string): boolean {
  return jobs.delete(id);
}

async function search(job: ImageSearchJob, bytes: Buffer) {
  try {
    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(config.googleVisionApiKey!)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [{
          image: { content: bytes.toString("base64") },
          features: [{ type: "WEB_DETECTION", maxResults: 20 }],
        }],
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const data = await response.json().catch(() => null) as VisionResponse | null;
    const error = data?.responses?.[0]?.error?.message;
    if (!response.ok || error) throw new Error(error || `Google Vision returned ${response.status}.`);

    const web = data?.responses?.[0]?.webDetection;
    const seen = new Set<string>();
    const add = (url: string | undefined, title: string | undefined, reason: string) => {
      const safe = safeHttpUrl(url);
      if (!safe || seen.has(safe)) return;
      seen.add(safe);
      job.results.push({ id: randomUUID(), url: safe, displayName: title?.slice(0, 160) || new URL(safe).hostname, reason });
    };
    web?.pagesWithMatchingImages?.forEach((page) => add(page.url, page.pageTitle, "A page containing an image matching your upload."));
    web?.fullMatchingImages?.forEach((image) => add(image.url, undefined, "A full image match found by Google Vision Web Detection."));
    web?.partialMatchingImages?.forEach((image) => add(image.url, undefined, "A partial image match found by Google Vision Web Detection."));
    job.status = "completed";
    job.message = job.results.length ? `${job.results.length} matching image source(s) found.` : "No matching image sources were found.";
  } catch (error) {
    job.status = "failed";
    job.message = error instanceof Error ? `Reverse image search failed: ${error.message}` : "Reverse image search failed.";
  }
}

async function mockSearch(job: ImageSearchJob) {
  await new Promise<void>((resolve) => setTimeout(resolve, 350));
  job.results.push(
    {
      id: randomUUID(),
      url: "https://example.com/demo/image-search/match",
      displayName: "Example matching page",
      reason: "Demo result: a fabricated page for testing the reverse-image-search workflow.",
    },
    {
      id: randomUUID(),
      url: "https://example.com/demo/image-search/copy",
      displayName: "Example matching image",
      reason: "Demo result: a fabricated matching image source for local development.",
    },
  );
  job.status = "completed";
  job.message = "2 demonstration image sources generated. No image was sent to an external provider.";
}

async function searchSerpApi(job: ImageSearchJob, imageUrl: string) {
  try {
    const params = new URLSearchParams({
      engine: "google_lens",
      url: imageUrl,
      type: "all",
      api_key: config.serpApiKey!,
    });
    const response = await fetch(`https://serpapi.com/search.json?${params}`, { signal: AbortSignal.timeout(15_000) });
    const data = await response.json().catch(() => null) as SerpApiLensResponse | null;
    if (!response.ok || data?.error) throw new Error(data?.error || `SerpApi returned ${response.status}.`);

    const seen = new Set<string>();
    const add = (match: { link?: string; title?: string; source?: string }, matchType: string) => {
      const url = safeHttpUrl(match.link);
      if (!url || seen.has(url)) return;
      seen.add(url);
      job.results.push({
        id: randomUUID(),
        url,
        displayName: match.title?.slice(0, 160) || match.source || new URL(url).hostname,
        reason: `${matchType} returned by SerpApi Google Lens${match.source ? ` from ${match.source}` : ""}.`,
      });
    };
    data?.exact_matches?.forEach((match) => add(match, "An exact image match"));
    data?.visual_matches?.forEach((match) => add(match, "A visually similar image match"));
    job.status = "completed";
    job.message = job.results.length ? `${job.results.length} public image source(s) found.` : "No public image sources were found.";
  } catch (error) {
    job.status = "failed";
    job.message = error instanceof Error ? `Public-image reverse search failed: ${error.message}` : "Public-image reverse search failed.";
  }
}
