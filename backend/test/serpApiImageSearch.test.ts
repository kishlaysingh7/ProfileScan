import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/config.js", () => ({
  config: {
    mockImageSearch: false,
    googleVisionApiKey: undefined,
    serpApiKey: "test-key",
    serpApiMonthlyLimit: 250,
  },
}));

import { createImageUrlSearch, deleteImageSearch, getImageSearch, ImageSearchInputError } from "../src/imageSearch.js";

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
});

describe("SerpApi public image URL search", () => {
  it("rejects Google sharing links before calling SerpApi", () => {
    expect(() => createImageUrlSearch("https://share.google/example")).toThrow(ImageSearchInputError);
  });

  it("maps exact and visual matches to source-page results", async () => {
    globalThis.fetch = vi.fn(async () => Response.json({
      exact_matches: [{ link: "https://example.org/exact", title: "Exact match", source: "Example" }],
      visual_matches: [{ link: "https://example.net/visual", title: "Visual match", source: "Visual Example" }],
    })) as typeof fetch;

    const job = createImageUrlSearch("https://images.example.com/photo.jpg");
    await new Promise((resolve) => setTimeout(resolve, 0));
    const completed = getImageSearch(job.id);

    expect(completed).toMatchObject({ status: "completed", providerName: "SerpApi Google Lens", isDemo: false });
    expect(completed?.results).toEqual([
      expect.objectContaining({ url: "https://example.org/exact", displayName: "Exact match" }),
      expect.objectContaining({ url: "https://example.net/visual", displayName: "Visual match" }),
    ]);
    deleteImageSearch(job.id);
  });
});
