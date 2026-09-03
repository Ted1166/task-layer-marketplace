import type { AgentIdentity } from "./integrations/scan8004";
import type { SessionComplianceSummary } from "./integrations/altana";

export interface TrustScoreBreakdown {
  score: number; // 0-100, final weighted score
  identityReputationScore: number;
  sessionComplianceScore: number;
  communityReportScore: number;
  weights: { identity: number; session: number; community: number };
}

const WEIGHTS = { identity: 0.4, session: 0.35, community: 0.25 };

/**
 * trust_score = w1 * identity_reputation_score
 *             + w2 * session_compliance_score
 *             + w3 * community_report_score
 *
 * See implementation-plan.md, section 5, for the reasoning behind these
 * starting weights. Retune once real distributions are visible in prod.
 */
export function computeTrustScore(
  identity: AgentIdentity,
  compliance: SessionComplianceSummary,
  verifiedReportCount: number
): TrustScoreBreakdown {
  const identityReputationScore = clamp(identity.totalScore, 0, 100);

  // Starts at 100, deducted per observed cap/expiry violation.
  const violationPenalty =
    compliance.exceededCapCount * 25 + compliance.actedAfterExpiryCount * 20;
  const sessionComplianceScore = clamp(100 - violationPenalty, 0, 100);

  // Starts at 100, deducted per verified community-reported incident.
  // Verification gate lives at the report-submission layer, not here —
  // only verified reports should ever reach this function.
  const communityReportScore = clamp(100 - verifiedReportCount * 30, 0, 100);

  const score =
    WEIGHTS.identity * identityReputationScore +
    WEIGHTS.session * sessionComplianceScore +
    WEIGHTS.community * communityReportScore;

  return {
    score: Math.round(score * 10) / 10,
    identityReputationScore,
    sessionComplianceScore,
    communityReportScore,
    weights: WEIGHTS,
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
