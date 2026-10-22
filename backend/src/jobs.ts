import { randomUUID } from "node:crypto";
import { config } from "./config.js";
import { searchPlatform } from "./providers/index.js";
import type { Job, SearchQuery } from "./types.js";

const jobs = new Map<string, Job>();
const controllers = new Map<string, AbortController>();

function sweep(now = Date.now()) {
  for (const [id, job] of jobs) {
    if (now - job.createdAt > config.jobTtlMs) {
      jobs.delete(id);
      controllers.delete(id);
    }
  }
}

setInterval(sweep, 60_000).unref();

export class CapacityError extends Error {}

export function createJob(query: SearchQuery): Job {
  sweep();
  if (jobs.size >= config.maxJobs) throw new CapacityError("Server is busy. Try again shortly.");

  const job: Job = {
    id: randomUUID(),
    status: "running",
    query,
    progress: query.platforms.map((platform) => ({ platform, state: "pending" })),
    results: [],
    createdAt: Date.now(),
  };
  jobs.set(job.id, job);
  const controller = new AbortController();
  controllers.set(job.id, controller);
  void run(job, controller.signal);
  return job;
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

export function deleteJob(id: string): boolean {
  controllers.get(id)?.abort();
  controllers.delete(id);
  return jobs.delete(id);
}

async function run(job: Job, signal: AbortSignal) {
  await Promise.all(
    job.query.platforms.map(async (platform) => {
      const p = job.progress.find((x) => x.platform === platform)!;
      p.state = "running";
      try {
        const { results, notes } = await searchPlatform(job.query, platform, signal);
        job.results.push(...results);
        p.state = "done";
        p.message = notes.length ? notes.join(" ") : `${results.filter((r) => r.kind === "profile").length} profile suggestion(s)`;
      } catch {
        p.state = "error";
        p.message = "Search failed for this platform.";
      }
    }),
  );
  job.status = signal.aborted ? "failed" : "completed";
}

export function resetJobsForTests() {
  jobs.clear();
  controllers.clear();
}
