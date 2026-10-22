import "dotenv/config";

function list(v: string | undefined): string[] {
  return (v ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}

export const config = {
  port: Number(process.env.PORT ?? 4100),
  isProd: process.env.NODE_ENV === "production",
  corsOrigins: list(process.env.CORS_ORIGIN),
  trustProxy: Number(process.env.TRUST_PROXY ?? 0),
  githubToken: process.env.GITHUB_TOKEN || undefined,
  braveApiKey: process.env.BRAVE_SEARCH_API_KEY || undefined,
  googleVisionApiKey: process.env.GOOGLE_VISION_API_KEY || undefined,
  serpApiKey: process.env.SERPAPI_KEY || undefined,
  serpApiMonthlyLimit: Number(process.env.SERPAPI_MONTHLY_LIMIT ?? 250),
  mockImageSearch: process.env.MOCK_IMAGE_SEARCH === "true",
  providerTimeoutMs: 8000,
  jobTtlMs: 30 * 60 * 1000,
  maxJobs: 500,
};
