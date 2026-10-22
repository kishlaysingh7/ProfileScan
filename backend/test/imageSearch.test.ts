import { describe, expect, it, vi } from "vitest";

vi.mock("../src/config.js", () => ({
  config: {
    mockImageSearch: true,
    googleVisionApiKey: undefined,
    serpApiKey: undefined,
    serpApiMonthlyLimit: 250,
  },
}));

import { createImageSearch, deleteImageSearch, getImageSearch } from "../src/imageSearch.js";

describe("mock image search", () => {
  it("marks generated results as demonstration data", async () => {
    const job = createImageSearch(Buffer.from([0xff, 0xd8, 0xff]));
    expect(job.isDemo).toBe(true);
    expect(job.providerName).toBe("Mock reverse image search");

    await new Promise((resolve) => setTimeout(resolve, 400));
    const completed = getImageSearch(job.id);
    expect(completed).toMatchObject({ status: "completed", isDemo: true });
    expect(completed?.results).toHaveLength(2);
    expect(completed?.results.every((result) => new URL(result.url).hostname === "example.com")).toBe(true);
    deleteImageSearch(job.id);
  });
});
