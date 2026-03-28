import { z } from "zod";
import type { AnalyzeRequest, CompetitorInput, CompetitorReport, StepSnapshot } from "./types.js";

const runResponseSchema = z.object({
  run_id: z.string().nullable(),
  error: z
    .object({
      message: z.string().optional()
    })
    .nullable()
    .optional()
});

const providerRunSchema = z.object({
  run_id: z.string(),
  status: z.string(),
  result: z.unknown().nullable().optional(),
  error: z
    .object({
      message: z.string().optional()
    })
    .nullable()
    .optional(),
  started_at: z.string().nullable().optional(),
  finished_at: z.string().nullable().optional(),
  steps: z
    .array(
      z.object({
        timestamp: z.string().nullable().optional(),
        action: z.string().optional(),
        status: z.string().nullable().optional(),
        screenshot: z.string().nullable().optional()
      })
    )
    .nullable()
    .optional()
});

export class TinyFishClient {
  constructor(private readonly apiKey: string) {}

  async startRun(input: AnalyzeRequest, competitor: CompetitorInput): Promise<string> {
    const response = await fetch("https://agent.tinyfish.ai/v1/automation/run-async", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": this.apiKey
      },
      body: JSON.stringify({
        url: competitor.url,
        goal: buildGoal(input, competitor),
        browser_profile: input.browserProfile,
        api_integration: "signaldeck"
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`TinyFish run creation failed (${response.status}): ${text}`);
    }

    const payload = runResponseSchema.parse(await response.json());

    if (!payload.run_id) {
      throw new Error(payload.error?.message ?? "TinyFish did not return a run ID.");
    }

    return payload.run_id;
  }

  async getRun(runId: string): Promise<{
    status: string;
    result: CompetitorReport | null;
    error: string | null;
    startedAt: string | null;
    finishedAt: string | null;
    evidence: StepSnapshot[];
  }> {
    const response = await fetch(`https://agent.tinyfish.ai/v1/runs/${runId}`, {
      headers: {
        "X-API-Key": this.apiKey
      }
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`TinyFish run fetch failed (${response.status}): ${text}`);
    }

    const payload = providerRunSchema.parse(await response.json());

    return {
      status: payload.status,
      result: normalizeResult(payload.result),
      error: payload.error?.message ?? null,
      startedAt: payload.started_at ?? null,
      finishedAt: payload.finished_at ?? null,
      evidence: (payload.steps ?? []).slice(-4).map((step) => ({
        at: step.timestamp ?? null,
        action: step.action ?? "Visited page",
        status: step.status ?? null,
        screenshot: step.screenshot ?? null
      }))
    };
  }
}

function buildGoal(input: AnalyzeRequest, competitor: CompetitorInput): string {
  return `
You are a competitive-intelligence web agent helping a B2B product team.

Market focus: ${input.marketName}
My product: ${input.yourProduct}
Ideal customer: ${input.customerProfile}
Analysis angle: ${input.analysisAngle}
Competitor name: ${competitor.company}

Visit the competitor website and navigate across relevant pages, including homepage, pricing, product/solutions pages, changelog/blog/news, and careers if available.
Your job is to build a concise sales battlecard from the live website.

Return JSON only using this exact shape:
{
  "company": "${competitor.company}",
  "homepage": "${competitor.url}",
  "one_liner": "string or null",
  "target_customer": "string or null",
  "headline_cta": "string or null",
  "pricing": {
    "has_public_pricing": true,
    "summary": "string or null",
    "plans": [
      {
        "name": "string",
        "price": "string",
        "billing_period": "string or null",
        "notes": "string or null"
      }
    ]
  },
  "notable_features": ["string"],
  "proof_points": ["string"],
  "recent_signals": ["string"],
  "hiring_signals": ["string"],
  "recommended_sales_angle": "string or null",
  "confidence_notes": "string or null"
}

Rules:
- Explore enough of the site to answer accurately.
- Use null or empty arrays when data is unavailable.
- Do not include markdown fences, prose, or commentary outside the JSON object.
- Keep each list to at most 5 items.
`.trim();
}

function normalizeResult(result: unknown): CompetitorReport | null {
  if (!result) {
    return null;
  }

  if (typeof result === "string") {
    try {
      return normalizeResult(JSON.parse(result));
    } catch {
      return null;
    }
  }

  if (typeof result !== "object") {
    return null;
  }

  const record = result as Record<string, unknown>;
  const pricingRecord = (record.pricing as Record<string, unknown> | undefined) ?? {};
  const plans = Array.isArray(pricingRecord.plans) ? pricingRecord.plans : [];

  return {
    company: asString(record.company) ?? "Unknown competitor",
    homepage: asString(record.homepage) ?? "",
    one_liner: asString(record.one_liner),
    target_customer: asString(record.target_customer),
    headline_cta: asString(record.headline_cta),
    pricing: {
      has_public_pricing:
        typeof pricingRecord.has_public_pricing === "boolean" ? pricingRecord.has_public_pricing : null,
      summary: asString(pricingRecord.summary),
      plans: plans
        .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
        .map((item) => ({
          name: asString(item.name) ?? "Plan",
          price: asString(item.price) ?? "Contact sales",
          billing_period: asString(item.billing_period),
          notes: asString(item.notes)
        }))
    },
    notable_features: asStringArray(record.notable_features),
    proof_points: asStringArray(record.proof_points),
    recent_signals: asStringArray(record.recent_signals),
    hiring_signals: asStringArray(record.hiring_signals),
    recommended_sales_angle: asString(record.recommended_sales_angle),
    confidence_notes: asString(record.confidence_notes)
  };
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}
