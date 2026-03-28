import type { CompetitorReport, PortfolioSummary } from "./types.js";

function topTerms(values: string[], limit: number): string[] {
  const counts = new Map<string, number>();

  for (const value of values) {
    for (const part of value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 4)) {
      counts.set(part, (counts.get(part) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([term]) => term);
}

export function buildSummary(reports: CompetitorReport[], yourProduct: string): PortfolioSummary {
  const publicPricingCount = reports.filter((report) => report.pricing.has_public_pricing).length;
  const strongestFeatureThemes = topTerms(reports.flatMap((report) => report.notable_features), 5);
  const hottestSignals = reports.flatMap((report) => report.recent_signals).slice(0, 6);

  const recommendedMoves = [
    `${yourProduct} should arm sales with competitor-specific rebuttals on pricing transparency and platform sprawl.`,
    "Use recent signals and hiring momentum as timing triggers for outbound campaigns.",
    "Package the clearest differentiation into a one-slide battlecard for every account executive."
  ];

  return {
    publicPricingCount,
    strongestFeatureThemes,
    hottestSignals,
    recommendedMoves
  };
}
