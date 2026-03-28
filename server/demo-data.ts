import type { CompetitorInput, CompetitorReport } from "./types.js";

export function buildDemoReport(input: CompetitorInput, yourProduct: string): CompetitorReport {
  const company = input.company.trim();

  return {
    company,
    homepage: input.url,
    one_liner: `${company} positions itself as an all-in-one operating system for teams that want fewer tools and faster execution.`,
    target_customer: "Mid-market teams with distributed operations and cross-functional planning needs.",
    headline_cta: `Switch to ${company} for faster planning, docs, and workflows in one place.`,
    pricing: {
      has_public_pricing: true,
      summary: `${company} publishes self-serve plans and uses annual discounts to push expansion.`,
      plans: [
        { name: "Starter", price: "$10", billing_period: "per user / month", notes: "Entry tier for small teams" },
        { name: "Business", price: "$24", billing_period: "per user / month", notes: "Adds admin and reporting features" }
      ]
    },
    notable_features: [
      "Unified workspace spanning tasks, docs, and templates",
      "AI-assisted drafting and workflow shortcuts",
      "Cross-team views for project tracking"
    ],
    proof_points: [
      "Prominent customer logos on homepage",
      "Enterprise-grade security language in navigation",
      "Multiple solution pages tailored by role"
    ],
    recent_signals: [
      "Product messaging emphasizes consolidation and AI productivity",
      "Homepage highlights shipping velocity and team alignment",
      `${company} appears to be pushing broader platform adoption over point solutions`
    ],
    hiring_signals: [
      "Open roles mention platform engineering and GTM hiring",
      "Career messaging suggests continued expansion in enterprise sales"
    ],
    recommended_sales_angle: `${yourProduct} should lead with depth and precision for teams that have outgrown all-in-one generalists.`,
    confidence_notes: "Demo mode uses seeded sample data. Connect your TinyFish API key for live website analysis."
  };
}
