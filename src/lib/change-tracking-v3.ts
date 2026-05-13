import type { ClauseOutcome, ClauseResult } from "./workflow-types";
import type { VersionComparisonPair, ComparisonBucketKey, PanelState } from "./change-tracking";

export type { VersionComparisonPair, ComparisonBucketKey, PanelState };

/**
 * V3 outcome vocabulary. Each clause carries a status that demonstrates how
 * it is evolving across negotiation rounds between buyer and supplier.
 */
export type ChangePillType = ClauseOutcome;
export type ChangePillStatus = ChangePillType;
export type ClauseDirection = "improved" | "regressed" | "unchanged";

export interface ChangePillResult {
  status: ChangePillStatus | null;
  confidence?: number;
}

export const CHANGE_DIRECTION_CONFIDENCE_THRESHOLD = 75;
export const UNEXPECTED_CHANGE_LABEL = "Unexpected";

function riskRank(clause: ClauseResult): number {
  if (clause.resolved) return 0;
  if (clause.severity === "low") return 1;
  if (clause.severity === "medium") return 2;
  return 3;
}

export function compareClauseDirection(
  previousClause: ClauseResult | undefined,
  clause: ClauseResult | undefined,
): ClauseDirection {
  if (!previousClause || !clause) return "unchanged";
  const previousRank = riskRank(previousClause);
  const currentRank = riskRank(clause);
  if (currentRank < previousRank) return "improved";
  if (currentRank > previousRank) return "regressed";
  return "unchanged";
}

/**
 * Reads the outcome status off the current clause. Status is seeded in the
 * mock data (no auto-derivation in this prototype); a future backend would
 * compute it from the round-by-round negotiation.
 */
export function determineChangePill({
  clause,
}: {
  clause: ClauseResult | undefined;
  previousClause?: ClauseResult | undefined;
  wasRequestedInPreviousRound?: boolean;
}): ChangePillResult {
  if (!clause?.outcome) return { status: null };
  return { status: clause.outcome };
}

export function sortChangePillStatus(status: ChangePillStatus | null): number {
  if (status === "worsened") return 0;
  if (status === "not_met") return 1;
  if (status === "partially_met") return 2;
  if (status === "unexpected") return 3;
  if (status === "manual_review") return 4;
  if (status === "met") return 5;
  return 6;
}
