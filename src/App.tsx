import { FormEvent, useEffect, useMemo, useState } from "react";
import { createAnalysis, getAnalysis, getHealth } from "./api";
import type { AnalysisJob, AnalyzePayload, CompetitorInput, CompetitorRun } from "./types";

type AssistantMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

type Blueprint = {
  id: string;
  title: string;
  subtitle: string;
  payload: AnalyzePayload;
};

const presetCompetitors: CompetitorInput[] = [
  { company: "Notion", url: "https://www.notion.so/" },
  { company: "Asana", url: "https://asana.com/" },
  { company: "ClickUp", url: "https://clickup.com/" }
];

const initialPayload: AnalyzePayload = {
  marketName: "AI project operating systems for startup teams",
  yourProduct: "SignalDeck AI Workspace",
  customerProfile:
    "Founders and revenue teams at B2B SaaS companies with 10-250 employees who need one source of truth for execution and customer intelligence.",
  analysisAngle:
    "Focus on what these competitors promise, whether they show pricing, what signals indicate momentum, and how a sales rep should position against them.",
  browserProfile: "lite",
  competitors: presetCompetitors
};

const blueprints: Blueprint[] = [
  {
    id: "sales",
    title: "Sales Battlecard",
    subtitle: "Compare pricing, positioning, and deal-time rebuttals.",
    payload: initialPayload
  },
  {
    id: "enterprise",
    title: "Enterprise Watch",
    subtitle: "Track upmarket messaging, compliance pages, and hiring motion.",
    payload: {
      marketName: "Enterprise collaboration and workflow software",
      yourProduct: "SignalDeck Enterprise OS",
      customerProfile:
        "VPs of revenue operations, CIO staff, and PMM teams at B2B software companies selling to mid-market and enterprise accounts.",
      analysisAngle:
        "Focus on enterprise messaging, security language, pricing opacity, hiring signals, and the best way to position against broad all-in-one competitors.",
      browserProfile: "stealth",
      competitors: presetCompetitors
    }
  },
  {
    id: "launch",
    title: "Launch Monitor",
    subtitle: "Surface roadmap and GTM movement from recent site changes.",
    payload: {
      marketName: "AI productivity and execution platforms",
      yourProduct: "SignalDeck Launch Intel",
      customerProfile:
        "Founders, PMMs, and growth leaders who need current launch intelligence before outbound campaigns and product launches.",
      analysisAngle:
        "Focus on launch announcements, product blog updates, headline messaging, pricing changes, and how to respond with sharper positioning.",
      browserProfile: "lite",
      competitors: presetCompetitors
    }
  }
];

const initialMessages: AssistantMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    text:
      "I can help you set up a strong run. Start from a blueprint, keep 3 competitors, and be very explicit about what kind of business signal you want back."
  }
];

export default function App() {
  const [payload, setPayload] = useState<AnalyzePayload>(initialPayload);
  const [job, setJob] = useState<AnalysisJob | null>(null);
  const [mode, setMode] = useState<"live" | "demo">("demo");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>(initialMessages);
  const [assistantInput, setAssistantInput] = useState("");

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

  const readiness = useMemo(() => {
    const filledCompetitors = payload.competitors.filter((item) => item.company.trim() && item.url.trim()).length;
    const score = [
      payload.marketName.trim().length > 10,
      payload.yourProduct.trim().length > 3,
      payload.customerProfile.trim().length > 20,
      payload.analysisAngle.trim().length > 20,
      filledCompetitors >= 2
    ].filter(Boolean).length;

    return {
      score,
      filledCompetitors
    };
  }, [payload]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const nextJob = await createAnalysis(payload);
      setJob(nextJob);
      pushAssistantMessage(
        "assistant",
        `Launched ${nextJob.runs.length} agent run${nextJob.runs.length > 1 ? "s" : ""}. I'll keep refreshing the dashboard while TinyFish works.`
      );
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

  function removeCompetitor(index: number) {
    setPayload((current) => ({
      ...current,
      competitors:
        current.competitors.length > 1 ? current.competitors.filter((_, currentIndex) => currentIndex !== index) : current.competitors
    }));
  }

  function applyBlueprint(blueprint: Blueprint) {
    setPayload(blueprint.payload);
    pushAssistantMessage("assistant", `Loaded the ${blueprint.title} setup. You can tweak the wording before launching.`);
  }

  function applyCoachAction(action: "pricing" | "speed" | "demo" | "enterprise") {
    if (action === "pricing") {
      setPayload((current) => ({
        ...current,
        analysisAngle:
          "Focus on pricing visibility, packaging, trial motions, self-serve vs sales-led paths, and how our reps should position against each competitor."
      }));
      pushAssistantMessage("assistant", "I rewrote the analysis angle to focus more heavily on pricing and packaging.");
      return;
    }

    if (action === "speed") {
      setPayload((current) => ({
        ...current,
        browserProfile: "lite",
        competitors: current.competitors.slice(0, 3)
      }));
      pushAssistantMessage("assistant", "I trimmed the setup for a faster demo: lite browser profile and three competitors.");
      return;
    }

    if (action === "demo") {
      setPayload((current) => ({
        ...current,
        analysisAngle:
          "Focus on the clearest, easiest-to-demo signals: pricing, headline messaging, one product launch signal, one hiring signal, and the recommended sales angle."
      }));
      pushAssistantMessage("assistant", "I optimized the prompt for a cleaner 2 to 3 minute demo narrative.");
      return;
    }

    setPayload((current) => ({
      ...current,
      browserProfile: "stealth",
      analysisAngle:
        "Focus on enterprise positioning, security and compliance pages, hiring for enterprise GTM, premium packaging, and how to displace these vendors in larger accounts."
    }));
    pushAssistantMessage("assistant", "I shifted the run toward enterprise intelligence and switched the browser profile to stealth.");
  }

  function sendAssistantMessage() {
    const trimmed = assistantInput.trim();

    if (!trimmed) {
      return;
    }

    pushAssistantMessage("user", trimmed);
    setAssistantInput("");
    pushAssistantMessage("assistant", buildAssistantReply(trimmed, payload, mode));
  }

  function pushAssistantMessage(role: AssistantMessage["role"], text: string) {
    setAssistantMessages((current) => [
      ...current,
      {
        id: `${role}-${current.length + 1}-${Date.now()}`,
        role,
        text
      }
    ]);
  }

  return (
    <div className="shell">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <div className="ambient ambient-c" />

      <nav className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">S</div>
          <div>
            <strong>SignalDeck</strong>
            <span>Competitive intelligence on the live web</span>
          </div>
        </div>
        <div className="topbar-status">
          <Badge label={mode === "live" ? "Live TinyFish" : "Demo Mode"} />
          <a href="https://tinyfish-signaldeck.onrender.com/" target="_blank" rel="noreferrer" className="topbar-link">
            Open live app
          </a>
        </div>
      </nav>

      <header className="hero hero-wide">
        <div className="hero-copy">
          <span className="eyebrow">TinyFish Web Agent Workspace</span>
          <h1>Research competitors like a teammate, not like a spreadsheet.</h1>
          <p>
            SignalDeck guides you through competitor analysis, launches TinyFish agents on the live web, and turns
            the output into battlecards your sales and product teams can actually act on.
          </p>
          <div className="hero-badges">
            <Badge label={mode === "live" ? "Live TinyFish Connected" : "Demo Mode Ready"} />
            <Badge label={`${readiness.filledCompetitors} competitors configured`} />
            <Badge label={`${readiness.score}/5 setup signals ready`} />
          </div>
          <div className="hero-proof">
            <div className="proof-card">
              <span className="metric-label">Outcome</span>
              <strong>Battlecards in minutes</strong>
              <p>Pricing, launches, proof points, hiring signals, and positioning in one pass.</p>
            </div>
            <div className="proof-card">
              <span className="metric-label">Best For</span>
              <strong>Sales and PMM teams</strong>
              <p>Replace manual tab-hopping with one guided workspace and live web agent runs.</p>
            </div>
          </div>
        </div>

        <div className="hero-side">
          <div className="hero-card accent-card">
            <p className="hero-card-label">Start Fast</p>
            <div className="blueprint-list">
              {blueprints.map((blueprint) => (
                <button key={blueprint.id} type="button" className="blueprint-card" onClick={() => applyBlueprint(blueprint)}>
                  <strong>{blueprint.title}</strong>
                  <span>{blueprint.subtitle}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="workspace">
        <section className="workspace-main">
          <div className="panel overview-panel">
            <div className="panel-header">
              <h2>Guided Setup</h2>
              <p>Fill the essentials, then let the coach help you sharpen the run before launch.</p>
            </div>

            <div className="metric-strip">
              <MetricCard label="Mode" value={mode === "live" ? "Live" : "Demo"} helper={mode === "live" ? "Real TinyFish runs" : "Sample outputs"} />
              <MetricCard label="Competitors" value={String(readiness.filledCompetitors)} helper="2-3 is ideal for demos" />
              <MetricCard label="Browser" value={payload.browserProfile} helper="Lite is faster, stealth is safer" />
            </div>

            <div className="coach-actions">
              <button type="button" className="ghost" onClick={() => applyCoachAction("pricing")}>
                Focus on pricing
              </button>
              <button type="button" className="ghost" onClick={() => applyCoachAction("demo")}>
                Optimize for demo
              </button>
              <button type="button" className="ghost" onClick={() => applyCoachAction("speed")}>
                Make it faster
              </button>
              <button type="button" className="ghost" onClick={() => applyCoachAction("enterprise")}>
                Switch to enterprise
              </button>
            </div>

            <form onSubmit={handleSubmit} className="guided-form">
              <div className="form-section">
                <div className="section-heading">
                  <span className="step-pill">1</span>
                  <div>
                    <h3>Describe your market</h3>
                    <p>Give the agents enough context to know what they should compare.</p>
                  </div>
                </div>
                <div className="stack">
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
                </div>
              </div>

              <div className="form-section">
                <div className="section-heading">
                  <span className="step-pill">2</span>
                  <div>
                    <h3>Tell the agent what matters</h3>
                    <p>Be specific about the exact signals you want back.</p>
                  </div>
                </div>

                <label>
                  <span>Analysis Angle</span>
                  <textarea
                    value={payload.analysisAngle}
                    onChange={(event) => setPayload({ ...payload, analysisAngle: event.target.value })}
                    rows={4}
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
              </div>

              <div className="form-section">
                <div className="section-heading">
                  <span className="step-pill">3</span>
                  <div>
                    <h3>Add competitor websites</h3>
                    <p>Use the primary marketing domain for each company.</p>
                  </div>
                </div>

                <div className="competitors-board">
                  {payload.competitors.map((competitor, index) => (
                    <div key={`${index}-${competitor.company}`} className="competitor-card">
                      <div className="competitor-card-top">
                        <strong>Competitor {index + 1}</strong>
                        {payload.competitors.length > 1 ? (
                          <button type="button" className="link-button" onClick={() => removeCompetitor(index)}>
                            Remove
                          </button>
                        ) : null}
                      </div>
                      <input
                        placeholder="Company name"
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

                <button type="button" className="ghost add-button" onClick={addCompetitor}>
                  Add another competitor
                </button>
              </div>

              <div className="launch-row">
                <div className="launch-note">
                  {mode === "demo" ? (
                    <p className="hint">TinyFish key not detected. You can still rehearse the experience in demo mode.</p>
                  ) : (
                    <p className="hint">Live mode is active. Launching will create real TinyFish browser automations.</p>
                  )}
                  {error ? <p className="error">{error}</p> : null}
                </div>
                <button className="primary" type="submit" disabled={submitting}>
                  {submitting ? "Launching agents..." : "Launch competitor research"}
                </button>
              </div>
            </form>
          </div>

          <section className="panel results-panel">
            <div className="panel-header">
              <h2>Research Dashboard</h2>
              <p>{job ? `Analysis ${job.id.slice(0, 8)} is ${job.status}.` : "Your results will appear here as soon as a run starts."}</p>
            </div>

            {!job ? (
              <div className="empty-state rich-empty">
                <strong>Ready for your first run</strong>
                <p>Best results usually come from 3 competitors and a very specific analysis angle.</p>
                <div className="empty-checklist">
                  <span>Use a clear market narrative</span>
                  <span>Ask for pricing plus momentum signals</span>
                  <span>Keep the demo short and visual</span>
                </div>
              </div>
            ) : (
              <div className="results-stack">
                <div className="progress-card progress-grid">
                  <MetricCard label="Progress" value={`${progress}%`} helper="Completed competitor runs" />
                  <MetricCard
                    label="Status"
                    value={job.status}
                    helper={job.status === "completed" ? "Battlecards are ready" : "TinyFish is still working"}
                  />
                  <MetricCard label="Run Count" value={String(job.runs.length)} helper="Concurrent web agents" />
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
        </section>

        <aside className="workspace-side">
          <div className="panel assistant-panel">
            <div className="panel-header">
              <h2>SignalDeck Coach</h2>
              <p>A lightweight helper for better prompts, faster demos, and less guesswork.</p>
            </div>

            <div className="chat-window">
              {assistantMessages.map((message) => (
                <div key={message.id} className={message.role === "assistant" ? "chat-bubble assistant" : "chat-bubble user"}>
                  {message.text}
                </div>
              ))}
            </div>

            <div className="quick-prompts">
              <button
                type="button"
                className="ghost"
                onClick={() => pushAssistantMessage("assistant", buildAssistantReply("How do I get a better demo?", payload, mode))}
              >
                Better demo
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() =>
                  pushAssistantMessage("assistant", buildAssistantReply("What should I ask the agent to look for?", payload, mode))
                }
              >
                Prompt help
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() => pushAssistantMessage("assistant", buildAssistantReply("Is stealth necessary?", payload, mode))}
              >
                Browser help
              </button>
            </div>

            <div className="chat-input-row">
              <textarea
                rows={3}
                value={assistantInput}
                onChange={(event) => setAssistantInput(event.target.value)}
                placeholder="Ask for help with prompts, demo strategy, or setup."
              />
              <button type="button" className="primary" onClick={sendAssistantMessage}>
                Send
              </button>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function SummaryPanel({ job }: { job: AnalysisJob }) {
  return (
    <div className="summary-card">
      <div className="summary-top">
        <div>
          <p className="metric-label">Portfolio View</p>
          <strong>{job.summary?.publicPricingCount ?? 0} competitors show public pricing</strong>
        </div>
        <Badge label={`${job.runs.filter((run) => run.status === "completed").length}/${job.runs.length} ready`} />
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
          <div className="signal-pills">
            <span className="signal-pill">{run.report.pricing.has_public_pricing ? "Public pricing" : "Pricing unclear"}</span>
            {run.report.target_customer ? <span className="signal-pill">{run.report.target_customer}</span> : null}
          </div>
          <div className="run-highlight">
            <strong>Recommended Positioning</strong>
            <p>{run.report.recommended_sales_angle ?? "No positioning suggestion returned yet."}</p>
          </div>
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

function MetricCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="metric-card">
      <p className="metric-label">{label}</p>
      <strong>{value}</strong>
      <span className="muted">{helper}</span>
    </div>
  );
}

function buildAssistantReply(input: string, payload: AnalyzePayload, mode: "live" | "demo"): string {
  const text = input.toLowerCase();

  if (text.includes("demo")) {
    return "For a stronger demo, keep it to 3 competitors, ask for pricing plus one recent signal, and choose websites with obvious pricing or product pages so the battlecards fill quickly.";
  }

  if (text.includes("stealth") || text.includes("browser")) {
    return payload.browserProfile === "stealth"
      ? "Stealth is useful when sites are harder to access, but it may run a bit slower. Keep it if you expect anti-bot friction."
      : "Lite is the right default for speed. Switch to stealth only when a site is likely to block automation or you want a safer enterprise-style run.";
  }

  if (text.includes("prompt") || text.includes("look for") || text.includes("ask")) {
    return "Ask for a small number of high-value signals: pricing, headline promise, one launch signal, one hiring signal, and the exact sales angle your team should use.";
  }

  if (text.includes("live") || text.includes("api")) {
    return mode === "live"
      ? "Live mode is connected. When you launch, SignalDeck creates real TinyFish automations and refreshes the dashboard as runs complete."
      : "You're in demo mode right now. Add a TinyFish API key to the backend environment to switch the app into live web automation mode.";
  }

  return `Right now your setup is aimed at ${payload.marketName.toLowerCase()}. If you want cleaner outputs, tighten the analysis angle so the agent returns only the business signals you truly need.`;
}
