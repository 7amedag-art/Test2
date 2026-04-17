/**
 * Gap-analysis scoring engine.
 *
 * Inputs per product:
 *   - demandScore              (heuristic from criticality + segment demand)
 *   - strategicScore           (from strategic importance signal)
 *   - localizationScore        (higher = more localized; inverts gap)
 *   - manufacturingComplexityScore (higher = harder to localize)
 *   - supplyRiskScore          (higher = more risk)
 *
 * Output:
 *   finalOpportunityScore = weighted blend (0-100)
 *     Higher score ⇒ bigger localization opportunity.
 *
 * Gap level + recommendation derived from the score + current local content.
 *
 * Weights are intentionally kept in one place so analysts can tune.
 */
import { prisma } from "@elp/db";

export const WEIGHTS = {
  demand:                 0.25,
  strategic:              0.25,
  // inverted — low localization = bigger opportunity
  localizationInverse:    0.20,
  // inverted — lower complexity = easier win
  complexityInverse:      0.15,
  risk:                   0.15,
};

type Scores = {
  demandScore: number;
  strategicScore: number;
  localizationScore: number;
  manufacturingComplexityScore: number;
  supplyRiskScore: number;
};

function heuristicScores(p: {
  criticalityLevel: string;
  industrySegment: string;
  strategicImportance: string | null;
  localContentPercent: any;
  localizationPercentage: any;
  supplyRiskLevel: string;
}): Scores {
  const criticalityMap: Record<string, number> = { high: 90, medium: 60, low: 30 };
  const segmentDemandMap: Record<string, number> = {
    power: 80, oil_gas: 85, renewables: 75, cross_sector: 70,
  };
  const riskMap: Record<string, number> = { critical: 95, high: 75, medium: 50, low: 25 };

  const demand     = criticalityMap[p.criticalityLevel] ?? 50;
  const segBoost   = segmentDemandMap[p.industrySegment] ?? 60;
  const demandScore = Math.round((demand + segBoost) / 2);

  const strategicScore = p.strategicImportance ? 80 : 50;

  const localPct = Number(p.localContentPercent ?? p.localizationPercentage ?? 0);
  const localizationScore = Math.max(0, Math.min(100, localPct));

  // No explicit complexity column yet — derive from criticality as a proxy.
  const manufacturingComplexityScore = p.criticalityLevel === "high" ? 70 : p.criticalityLevel === "medium" ? 50 : 30;

  const supplyRiskScore = riskMap[p.supplyRiskLevel] ?? 50;

  return { demandScore, strategicScore, localizationScore, manufacturingComplexityScore, supplyRiskScore };
}

function finalScore(s: Scores): number {
  const x =
    s.demandScore                  * WEIGHTS.demand +
    s.strategicScore               * WEIGHTS.strategic +
    (100 - s.localizationScore)    * WEIGHTS.localizationInverse +
    (100 - s.manufacturingComplexityScore) * WEIGHTS.complexityInverse +
    s.supplyRiskScore              * WEIGHTS.risk;
  return Math.round(Math.max(0, Math.min(100, x)) * 10) / 10;
}

function gapAndRecommendation(final: number, localizationScore: number) {
  const gap: "high" | "medium" | "low" =
    final >= 70 ? "high" : final >= 45 ? "medium" : "low";
  const recommendation =
    localizationScore >= 70 ? "sufficient_local_supply" :
    localizationScore >= 30 ? "expand_existing_capacity" :
                              "need_local_manufacturing";
  return { gap, recommendation } as const;
}

export async function computeAndPersistGap(productId: string) {
  const p = await prisma.product.findUnique({
    where: { id: productId },
    include: { localizationStatus: true },
  });
  if (!p) throw new Error("product not found");

  const scores = heuristicScores({
    criticalityLevel: p.criticalityLevel,
    industrySegment: p.industrySegment,
    strategicImportance: p.strategicImportance,
    localContentPercent: p.localContentPercent,
    localizationPercentage: p.localizationStatus?.localizationPercentage ?? 0,
    supplyRiskLevel: p.localizationStatus?.supplyRiskLevel ?? "medium",
  });

  const final = finalScore(scores);
  const { gap, recommendation } = gapAndRecommendation(final, scores.localizationScore);

  const rationale =
    `demand=${scores.demandScore}, strategic=${scores.strategicScore}, ` +
    `localization=${scores.localizationScore}, complexity=${scores.manufacturingComplexityScore}, ` +
    `risk=${scores.supplyRiskScore} ⇒ opportunity=${final}`;

  const saved = await prisma.gapAnalysis.upsert({
    where: { productId },
    create: {
      productId,
      demandScore: scores.demandScore as any,
      strategicScore: scores.strategicScore as any,
      localizationScore: scores.localizationScore as any,
      manufacturingComplexityScore: scores.manufacturingComplexityScore as any,
      supplyRiskScore: scores.supplyRiskScore as any,
      finalOpportunityScore: final as any,
      localizationGap: gap,
      recommendation,
      rationale,
    },
    update: {
      demandScore: scores.demandScore as any,
      strategicScore: scores.strategicScore as any,
      localizationScore: scores.localizationScore as any,
      manufacturingComplexityScore: scores.manufacturingComplexityScore as any,
      supplyRiskScore: scores.supplyRiskScore as any,
      finalOpportunityScore: final as any,
      localizationGap: gap,
      recommendation,
      rationale,
    },
  });
  return saved;
}
