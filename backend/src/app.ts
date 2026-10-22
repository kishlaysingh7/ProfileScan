import cors from "cors";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { z } from "zod";
import { config } from "./config.js";
import { CapacityError, createJob, deleteJob, getJob } from "./jobs.js";
import {
  createImageSearch,
  createImageUrlSearch,
  deleteImageSearch,
  getImageSearch,
  ImageSearchInputError,
  ImageSearchUnavailableError,
} from "./imageSearch.js";
import { createJobSchema, createVerificationSchema } from "./schemas.js";
import { checkVerification, createVerification, getVerification, VerificationInputError } from "./verification.js";
import type { PlatformId } from "./types.js";

const uuid = z.uuid();
const imageUrlSearchSchema = z.object({ consent: z.literal(true), imageUrl: z.string().url().max(2_000) });

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", config.trustProxy);
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigins, methods: ["GET", "POST", "DELETE"] }));
  app.use(express.json({ limit: "10kb" }));

  app.use(rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: "draft-7", legacyHeaders: false }));
  const createLimiter = rateLimit({
    windowMs: 15 * 60_000,
    limit: 30,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Too many searches. Please try again later." },
  });

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  // Tells the UI which capabilities are live so it can describe results honestly.
  app.get("/api/capabilities", (_req, res) => {
    res.json({
      githubApi: true,
      webSearch: !!config.braveApiKey,
      reverseImageSearch: config.mockImageSearch || !!config.googleVisionApiKey || !!config.serpApiKey,
      googleVisionImageSearch: config.mockImageSearch || !!config.googleVisionApiKey,
      serpApiImageSearch: !!config.serpApiKey,
      imageSearchMode: config.mockImageSearch ? "mock" : config.googleVisionApiKey ? "google" : config.serpApiKey ? "serpapi" : "unavailable",
    });
  });

  app.post("/api/search-jobs", createLimiter, (req, res) => {
    const parsed = createJobSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request.", details: parsed.error.issues.map((i) => i.message) });
      return;
    }
    const { name, usernames, platforms } = parsed.data;
    const job = createJob({ name, usernames: [...new Set(usernames)], platforms: [...new Set(platforms)] as PlatformId[] });
    // Audit log intentionally excludes the name and usernames.
    console.log(JSON.stringify({ event: "search_job_created", jobId: job.id, platforms: job.query.platforms.length, at: new Date().toISOString() }));
    res.status(202).json(publicJob(job));
  });

  app.get("/api/search-jobs/:id", (req, res) => {
    const id = uuid.safeParse(req.params.id);
    const job = id.success ? getJob(id.data) : undefined;
    if (!job) {
      res.status(404).json({ error: "Search job not found or expired." });
      return;
    }
    res.set("Cache-Control", "no-store");
    res.json(publicJob(job));
  });

  app.delete("/api/search-jobs/:id", (req, res) => {
    const id = uuid.safeParse(req.params.id);
    if (id.success) deleteJob(id.data);
    res.status(204).end();
  });

  app.post(
    "/api/image-search-jobs",
    createLimiter,
    express.raw({ type: ["image/jpeg", "image/png", "image/webp"], limit: "5mb" }),
    (req, res) => {
      if (req.get("X-ProfileFinder-Consent") !== "true") {
        res.status(400).json({ error: "Consent is required." });
        return;
      }
      if (!Buffer.isBuffer(req.body)) {
        res.status(415).json({ error: "Upload a JPG, PNG, or WEBP image." });
        return;
      }
      try {
        const job = createImageSearch(Buffer.from(req.body));
        console.log(JSON.stringify({ event: "image_search_created", jobId: job.id, at: new Date().toISOString() }));
        res.status(202).json(publicImageJob(job));
      } catch (error) {
        if (error instanceof ImageSearchInputError) {
          res.status(400).json({ error: error.message });
          return;
        }
        if (error instanceof ImageSearchUnavailableError) {
          res.status(503).json({ error: error.message });
          return;
        }
        throw error;
      }
    },
  );

  app.post("/api/image-url-search-jobs", createLimiter, (req, res) => {
    const parsed = imageUrlSearchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Provide consent and a valid public image URL." });
      return;
    }
    try {
      const job = createImageUrlSearch(parsed.data.imageUrl);
      console.log(JSON.stringify({ event: "image_url_search_created", jobId: job.id, at: new Date().toISOString() }));
      res.status(202).json(publicImageJob(job));
    } catch (error) {
      if (error instanceof ImageSearchInputError) {
        res.status(400).json({ error: error.message });
        return;
      }
      if (error instanceof ImageSearchUnavailableError) {
        res.status(503).json({ error: error.message });
        return;
      }
      throw error;
    }
  });

  app.get("/api/image-search-jobs/:id", (req, res) => {
    const id = uuid.safeParse(req.params.id);
    const job = id.success ? getImageSearch(id.data) : undefined;
    if (!job) {
      res.status(404).json({ error: "Image search job not found or expired." });
      return;
    }
    res.set("Cache-Control", "no-store");
    res.json(publicImageJob(job));
  });

  app.delete("/api/image-search-jobs/:id", (req, res) => {
    const id = uuid.safeParse(req.params.id);
    if (id.success) deleteImageSearch(id.data);
    res.status(204).end();
  });

  const verifyLimiter = rateLimit({
    windowMs: 15 * 60_000,
    limit: 60,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Too many verification requests. Please try again later." },
  });

  app.post("/api/verifications", verifyLimiter, (req, res) => {
    const parsed = createVerificationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request.", details: parsed.error.issues.map((i) => i.message) });
      return;
    }
    try {
      const v = createVerification(parsed.data.platform as PlatformId, parsed.data.profileUrl);
      res.status(201).json({ id: v.id, code: v.code, platform: v.platform, profileUrl: v.profileUrl, expiresInSeconds: 1800 });
    } catch (err) {
      if (err instanceof VerificationInputError) {
        res.status(400).json({ error: err.message });
        return;
      }
      throw err;
    }
  });

  app.post("/api/verifications/:id/check", verifyLimiter, async (req, res) => {
    const id = uuid.safeParse(req.params.id);
    const v = id.success ? getVerification(id.data) : undefined;
    if (!v) {
      res.status(404).json({ error: "Verification not found or expired." });
      return;
    }
    const result = await checkVerification(v, AbortSignal.timeout(15_000));
    console.log(JSON.stringify({ event: "verification_checked", platform: v.platform, status: result.status, at: new Date().toISOString() }));
    res.set("Cache-Control", "no-store");
    res.json(result);
  });

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found." });
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof CapacityError) {
      res.status(503).json({ error: err.message });
      return;
    }
    const status = typeof (err as { status?: number })?.status === "number" ? (err as { status: number }).status : 500;
    if (status >= 500) console.error(JSON.stringify({ event: "unhandled_error", message: (err as Error)?.message }));
    res.status(status).json({ error: status >= 500 ? "Internal server error." : "Bad request." });
  });

  return app;
}

function publicJob(job: ReturnType<typeof getJob> & object) {
  return {
    id: job.id,
    status: job.status,
    query: job.query,
    progress: job.progress,
    results: job.results,
    error: job.error,
  };
}

function publicImageJob(job: NonNullable<ReturnType<typeof getImageSearch>>) {
  return {
    id: job.id,
    status: job.status,
    results: job.results,
    message: job.message,
    providerName: job.providerName,
    isDemo: job.isDemo,
  };
}
