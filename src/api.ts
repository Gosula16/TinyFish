import type { AnalysisJob, AnalyzePayload } from "./types";

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error ? JSON.stringify(payload.error) : "Request failed.");
  }

  return payload as T;
}

export async function createAnalysis(payload: AnalyzePayload): Promise<AnalysisJob> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await readJson<{ data: AnalysisJob }>(response);
  return data.data;
}

export async function getAnalysis(jobId: string): Promise<AnalysisJob> {
  const response = await fetch(`/api/jobs/${jobId}`);
  const data = await readJson<{ data: AnalysisJob }>(response);
  return data.data;
}

export async function getHealth(): Promise<{ ok: boolean; mode: "live" | "demo" }> {
  const response = await fetch("/api/health");
  return readJson(response);
}
