export type AnalysisStatus = "queued" | "running" | "completed" | "failed";

export interface CompetitorInput {
  company: string;
  url: string;
}

export interface AnalyzePayload {
  marketName: string;
  yourProduct: string;
  customerProfile: string;
  analysisAngle: string;
  browserProfile: "lite" | "stealth";
  competitors: CompetitorInput[];
}

export interface CompetitorReport {
  company: string;
  homepage: string;
  one_liner: string | null;
  target_customer: string | null;
  headline_cta: string | null;
  pricing: {
    has_public_pricing: boolean | null;
    summary: string | null;
    plans: Array<{
      name: string;
      price: string;
      billing_period: string | null;
      notes: string | null;
    }>;
  };
  notable_features: string[];
  proof_points: string[];
  recent_signals: string[];
  hiring_signals: string[];
  recommended_sales_angle: string | null;
  confidence_notes: string | null;
}

export interface StepSnapshot {
  at: string | null;
  action: string;
  status?: string | null;
  screenshot?: string | null;
}

export interface CompetitorRun {
  company: string;
  url: string;
  runId: string | null;
  status: AnalysisStatus;
  providerStatus: string | null;
  startedAt: string;
  finishedAt: string | null;
  error: string | null;
  report: CompetitorReport | null;
  evidence: StepSnapshot[];
}

export interface PortfolioSummary {
  publicPricingCount: number;
  strongestFeatureThemes: string[];
  hottestSignals: string[];
  recommendedMoves: string[];
}

export interface AnalysisJob {
  id: string;
  request: AnalyzePayload;
  mode: "live" | "demo";
  status: AnalysisStatus;
  createdAt: string;
  updatedAt: string;
  runs: CompetitorRun[];
  summary: PortfolioSummary | null;
}
