import crypto from "node:crypto";
import { buildDemoReport } from "./demo-data.js";
import { buildSummary } from "./summary.js";
import { TinyFishClient } from "./tinyfish.js";
import type { AnalysisJob, AnalyzeRequest, CompetitorRun } from "./types.js";

const jobs = new Map<string, AnalysisJob>();

export function listJobs(): AnalysisJob[] {
  return [...jobs.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getJob(jobId: string): AnalysisJob | undefined {
  return jobs.get(jobId);
}

export async function createJob(request: AnalyzeRequest, apiKey?: string): Promise<AnalysisJob> {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const runs: CompetitorRun[] = request.competitors.map((competitor) => ({
    company: competitor.company,
    url: competitor.url,
    runId: null,
    status: "queued",
    providerStatus: null,
    startedAt: createdAt,
    finishedAt: null,
    error: null,
    report: null,
    evidence: []
  }));

  const job: AnalysisJob = {
    id,
    request,
    mode: apiKey ? "live" : "demo",
    status: "running",
    createdAt,
    updatedAt: createdAt,
    runs,
    summary: null
  };

  jobs.set(id, job);

  if (!apiKey) {
    queueDemoCompletion(job);
    return job;
  }

  const client = new TinyFishClient(apiKey);

  await Promise.all(
    job.runs.map(async (run, index) => {
      try {
        const runId = await client.startRun(request, request.competitors[index]);
        run.runId = runId;
        run.status = "running";
        run.providerStatus = "QUEUED";
      } catch (error) {
        run.status = "failed";
        run.error = error instanceof Error ? error.message : "Failed to create TinyFish run.";
      }
    })
  );

  refreshJobStatus(job);
  return job;
}

export async function syncJob(job: AnalysisJob, apiKey?: string): Promise<AnalysisJob> {
  if (job.mode === "demo" || !apiKey) {
    refreshJobStatus(job);
    return job;
  }

  const client = new TinyFishClient(apiKey);
  const activeRuns = job.runs.filter((run) => run.runId && (run.status === "queued" || run.status === "running"));

  await Promise.all(
    activeRuns.map(async (run) => {
      try {
        const latest = await client.getRun(run.runId as string);
        run.providerStatus = latest.status;
        run.error = latest.error;
        run.evidence = latest.evidence;
        run.report = latest.result;
        run.finishedAt = latest.finishedAt;

        if (latest.status === "COMPLETED") {
          run.status = latest.result ? "completed" : "failed";
          run.error = latest.result ? null : "TinyFish completed the run but did not return a parseable result.";
        } else if (latest.status === "FAILED" || latest.status === "CANCELLED") {
          run.status = "failed";
        } else {
          run.status = "running";
        }
      } catch (error) {
        run.status = "failed";
        run.error = error instanceof Error ? error.message : "Failed to read TinyFish run.";
      }
    })
  );

  refreshJobStatus(job);
  return job;
}

function queueDemoCompletion(job: AnalysisJob): void {
  job.runs.forEach((run, index) => {
    setTimeout(() => {
      run.status = "completed";
      run.providerStatus = "COMPLETED";
      run.finishedAt = new Date().toISOString();
      run.report = buildDemoReport(job.request.competitors[index], job.request.yourProduct);
      run.evidence = [
        {
          at: run.finishedAt,
          action: "Demo mode seeded a sample competitor battlecard",
          status: "COMPLETED",
          screenshot: null
        }
      ];
      refreshJobStatus(job);
    }, 1200 + index * 900);
  });
}

function refreshJobStatus(job: AnalysisJob): void {
  job.updatedAt = new Date().toISOString();
  const completedReports = job.runs.flatMap((run) => (run.report ? [run.report] : []));

  if (completedReports.length > 0) {
    job.summary = buildSummary(completedReports, job.request.yourProduct);
  }

  if (job.runs.some((run) => run.status === "running" || run.status === "queued")) {
    job.status = "running";
    return;
  }

  if (job.runs.every((run) => run.status === "failed")) {
    job.status = "failed";
    return;
  }

  job.status = "completed";
}
