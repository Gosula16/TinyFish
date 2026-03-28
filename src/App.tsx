import { FormEvent, useEffect, useMemo, useState } from "react";
import { createAnalysis, getAnalysis, getHealth } from "./api";
import type { AnalysisJob, AnalyzePayload, CompetitorInput, CompetitorRun } from "./types";

const presetCompetitors: CompetitorInput[] = [
  { company: "Notion", url: "https://www.notion.so/" },
  { company: "Asana", url: "https://asana.com/" },
  { company: "ClickUp", url: "https://clickup.com/" }
];

const initialPayload: AnalyzePayload = {
  marketName: "AI project operating systems for startup teams",
  yourProduct: "SignalDeck AI Workspace",
  customerProfile: "Founders and revenue teams at B2B SaaS companies with 10-250 employees who need one source of truth for execution and customer intelligence.",
  analysisAngle:
    "Focus on what these competitors promise, whether they show pricing, what signals indicate momentum, and how a sales rep should position against them.",
  browserProfile: "lite",
  competitors: presetCompetitors
};

export default function App() {
  const [payload, setPayload] = useState<AnalyzePayload>(initialPayload);
  const [job, setJob] = useState<AnalysisJob | null>(null);
  const [mode, setMode] = useState<"live" | "demo">("demo");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getHealth()
      .then((result) => setMode(result.mode))
      .catch(() => setMode("demo"));
  }, []);

  useEffect(() => {
    if (!job || job.status === "completed" || job.status === "failed") {
      return;
    }

    const timer = window.setInterval(async () => {
      try {
        const next = await getAnalysis(job.id);
        setJob(next);
      } catch (pollError) {
        setError(pollError instanceof Error ? pollError.message : "Polling failed.");
      }
    }, 2500);

    return () => window.clearInterval(timer);
  }, [job]);

  const progress = useMemo(() => {
    if (!job) {
      return 0;
    }

    const completed = job.runs.filter((run) => run.status === "completed").length;
    return Math.round((completed / job.runs.length) * 100);
  }, [job]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const nextJob = await createAnalysis(payload);
      setJob(nextJob);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to start analysis.");
    } finally {
      setSubmitting(false);
    }
  }

  function updateCompetitor(index: number, field: keyof CompetitorInput, value: string) {
    setPayload((current) => ({
      ...current,
      competitors: current.competitors.map((competitor, currentIndex) =>
        currentIndex === index ? { ...competitor, [field]: value } : competitor
      )
    }));
  }

  function addCompetitor() {
    setPayload((current) => ({
      ...current,
      competitors: [...current.competitors, { company: "", url: "" }]
    }));
  }

  return (
    <div className="shell">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <header className="hero">
        <div className="hero-copy">
          <span className="eyebrow">TinyFish Hackathon Build</span>
          <h1>SignalDeck turns live competitor websites into battlecards your sales team can use today.</h1>
          <p>
            Launch concurrent TinyFish web agents, let them navigate pricing, product, careers, and news pages,
            then turn the result into a crisp competitive brief with timing signals and positioning advice.
          </p>
          <div className="hero-badges">
            <Badge label={`Mode: ${mode === "live" ? "Live TinyFish" : "Demo Fallback"}`} />
            <Badge label="Multi-site web navigation" />
            <Badge label="Battlecard output, not chat fluff" />
          </div>
        </div>
        <div className="hero-card">
          <p className="hero-card-label">What it does</p>
          <ul>
            <li>Explores real competitor websites with TinyFish browser runs</li>
            <li>Extracts pricing, messaging, product depth, and hiring momentum</li>
            <li>Generates account-ready positioning for outbound and enablement</li>
          </ul>
        </div>
      </header>

      <main className="grid">
        <section className="panel form-panel">
          <div className="panel-header">
            <h2>Configure The Agent</h2>
            <p>Set the market context once, then compare up to six competitors in parallel.</p>
          </div>

          <form onSubmit={handleSubmit} className="stack">
            <label>
              <span>Market Narrative</span>
              <textarea
                value={payload.marketName}
                onChange={(event) => setPayload({ ...payload, marketName: event.target.value })}
                rows={2}
              />
            </label>

            <label>
              <span>Your Product</span>
              <input
                value={payload.yourProduct}
                onChange={(event) => setPayload({ ...payload, yourProduct: event.target.value })}
              />
            </label>

            <label>
              <span>Ideal Customer</span>
              <textarea
                value={payload.customerProfile}
                onChange={(event) => setPayload({ ...payload, customerProfile: event.target.value })}
                rows={3}
              />
            </label>

            <label>
              <span>Analysis Angle</span>
              <textarea
                value={payload.analysisAngle}
                onChange={(event) => setPayload({ ...payload, analysisAngle: event.target.value })}
                rows={3}
              />
            </label>

            <div className="profile-row">
              <span>Browser Profile</span>
              <div className="profile-options">
                <button
                  type="button"
                  className={payload.browserProfile === "lite" ? "chip active" : "chip"}
                  onClick={() => setPayload({ ...payload, browserProfile: "lite" })}
                >
                  Lite
                </button>
                <button
                  type="button"
                  className={payload.browserProfile === "stealth" ? "chip active" : "chip"}
                  onClick={() => setPayload({ ...payload, browserProfile: "stealth" })}
                >
                  Stealth
                </button>
              </div>
            </div>

            <div className="competitors">
              <div className="section-title">
                <h3>Competitors</h3>
                <button type="button" className="ghost" onClick={addCompetitor}>
                  Add another
                </button>
              </div>

              {payload.competitors.map((competitor, index) => (
                <div key={`${index}-${competitor.company}`} className="competitor-row">
                  <input
                    placeholder="Company"
                    value={competitor.company}
                    onChange={(event) => updateCompetitor(index, "company", event.target.value)}
                  />
                  <input
                    placeholder="https://example.com"
                    value={competitor.url}
                    onChange={(event) => updateCompetitor(index, "url", event.target.value)}
                  />
                </div>
              ))}
            </div>

            <button className="primary" type="submit" disabled={submitting}>
              {submitting ? "Launching agents..." : "Build battlecards"}
            </button>

            {error ? <p className="error">{error}</p> : null}
            {mode === "demo" ? (
              <p className="hint">
                No `TINYFISH_API_KEY` detected. The app still works in demo mode with sample battlecards so the UX
                can be reviewed immediately.
              </p>
            ) : (
              <p className="hint">Live mode is active. The backend will create real TinyFish automation runs.</p>
            )}
          </form>
        </section>

        <section className="panel results-panel">
          <div className="panel-header">
            <h2>Battlecard Output</h2>
            <p>{job ? `Analysis ${job.id.slice(0, 8)} is ${job.status}.` : "Run an analysis to populate the dashboard."}</p>
          </div>

          {!job ? (
            <div className="empty-state">
              <p>SignalDeck is best demoed with 3 competitors and a very explicit market angle.</p>
            </div>
          ) : (
            <div className="results-stack">
              <div className="progress-card">
                <div>
                  <p className="metric-label">Run Progress</p>
                  <strong>{progress}% complete</strong>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>

              {job.summary ? <SummaryPanel job={job} /> : null}

              <div className="run-grid">
                {job.runs.map((run) => (
                  <RunCard key={`${run.company}-${run.url}`} run={run} />
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function SummaryPanel({ job }: { job: AnalysisJob }) {
  return (
    <div className="summary-card">
      <div>
        <p className="metric-label">Portfolio View</p>
        <strong>{job.summary?.publicPricingCount ?? 0} competitors show public pricing</strong>
      </div>
      <div className="summary-grid">
        <InfoList title="Feature Themes" items={job.summary?.strongestFeatureThemes ?? []} />
        <InfoList title="Momentum Signals" items={job.summary?.hottestSignals ?? []} />
        <InfoList title="Recommended Moves" items={job.summary?.recommendedMoves ?? []} />
      </div>
    </div>
  );
}

function RunCard({ run }: { run: CompetitorRun }) {
  return (
    <article className="run-card">
      <div className="run-card-header">
        <div>
          <h3>{run.company}</h3>
          <a href={run.url} target="_blank" rel="noreferrer">
            {run.url}
          </a>
        </div>
        <Badge label={run.status} tone={run.status} />
      </div>

      {run.report ? (
        <div className="run-card-body">
          <p className="one-liner">{run.report.one_liner}</p>
          <InfoList title="Features" items={run.report.notable_features} />
          <InfoList title="Recent Signals" items={run.report.recent_signals} />
          <InfoList
            title="Pricing"
            items={
              run.report.pricing.plans.length > 0
                ? run.report.pricing.plans.map((plan) => `${plan.name}: ${plan.price}`)
                : [run.report.pricing.summary ?? "No public pricing found"]
            }
          />
          <InfoList title="Sales Angle" items={run.report.recommended_sales_angle ? [run.report.recommended_sales_angle] : []} />
          {run.report.confidence_notes ? <p className="confidence">{run.report.confidence_notes}</p> : null}
        </div>
      ) : (
        <div className="run-card-body">
          <p className="one-liner">{run.error ?? "TinyFish is still working through the website."}</p>
        </div>
      )}

      {run.evidence.length > 0 ? (
        <div className="evidence">
          <p className="metric-label">Agent Evidence</p>
          {run.evidence.map((item, index) => (
            <div key={`${item.action}-${index}`} className="evidence-row">
              <span>{item.action}</span>
              <span>{item.status ?? "seen"}</span>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="info-list">
      <p className="metric-label">{title}</p>
      {items.length === 0 ? (
        <span className="muted">No signal captured yet.</span>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Badge({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "queued" | "running" | "completed" | "failed" }) {
  return <span className={`badge ${tone}`}>{label}</span>;
}
