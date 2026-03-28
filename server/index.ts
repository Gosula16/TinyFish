import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { createJob, getJob, listJobs, syncJob } from "./jobs.js";
import type { AnalyzeRequest } from "./types.js";

const analyzeSchema = z.object({
  marketName: z.string().min(3),
  yourProduct: z.string().min(3),
  customerProfile: z.string().min(10),
  analysisAngle: z.string().min(10),
  browserProfile: z.enum(["lite", "stealth"]).default("lite"),
  competitors: z
    .array(
      z.object({
        company: z.string().min(2),
        url: z.string().url()
      })
    )
    .min(1)
    .max(6)
});

const app = express();
const port = Number(process.env.PORT ?? 8787);
const apiKey = process.env.TINYFISH_API_KEY;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, "../client");

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    mode: apiKey ? "live" : "demo"
  });
});

app.get("/api/jobs", (_request, response) => {
  response.json({
    data: listJobs()
  });
});

app.post("/api/analyze", async (request, response) => {
  const parsed = analyzeSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({
      error: parsed.error.flatten()
    });
    return;
  }

  try {
    const job = await createJob(parsed.data as AnalyzeRequest, apiKey);
    response.status(201).json({
      data: job
    });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create analysis job."
    });
  }
});

app.get("/api/jobs/:id", async (request, response) => {
  const job = getJob(request.params.id);

  if (!job) {
    response.status(404).json({ error: "Job not found." });
    return;
  }

  try {
    const synced = await syncJob(job, apiKey);
    response.json({
      data: synced
    });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : "Failed to sync analysis job."
    });
  }
});

app.use(express.static(clientDist));

app.get("*", (_request, response) => {
  response.sendFile(path.join(clientDist, "index.html"));
});

app.listen(port, () => {
  console.log(`SignalDeck server running on http://localhost:${port}`);
});
