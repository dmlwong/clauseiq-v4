import type { ClauseResult } from "./workflow-types";

export type ChangePillStatus = "met" | "not-met" | "improved" | "regressed" | "new";
export type ClauseDirection = "improved" | "regressed" | "unchanged";

export interface ChangePillResult {
  status: ChangePillStatus | null;
  confidence?: number;
}

export const CHANGE_DIRECTION_CONFIDENCE_THRESHOLD = 75;
export const NEW_CHANGE_LABEL = "New";

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

function directionalConfidence(
  previousClause: ClauseResult | undefined,
  clause: ClauseResult,
  direction: ClauseDirection,
): number {
  if (direction === "unchanged") return 100;
  if (!previousClause) return 100;
  if (clause.improvementReason) return 92;
  if (previousClause.severity !== clause.severity || previousClause.resolved !== clause.resolved) return 88;
  return 68;
}

export function determineChangePill({
  clause,
  previousClause,
  wasRequestedInPreviousRound,
}: {
  clause: ClauseResult | undefined;
  previousClause: ClauseResult | undefined;
  wasRequestedInPreviousRound: boolean;
}): ChangePillResult {
  if (!clause) return { status: null };
  if (!previousClause || clause.change === "new") return { status: "new" };

  const direction = compareClauseDirection(previousClause, clause);

  if (wasRequestedInPreviousRound) {
    const fulfilled = direction === "improved" || clause.resolved || clause.change === "improved";
    return { status: fulfilled ? "met" : "not-met" };
  }

  if (direction === "improved" || clause.change === "improved") {
    return { status: "improved", confidence: directionalConfidence(previousClause, clause, "improved") };
  }
  if (direction === "regressed" || clause.change === "worsened") {
    return { status: "regressed", confidence: directionalConfidence(previousClause, clause, "regressed") };
  }

  return { status: null };
}

export function sortChangePillStatus(status: ChangePillStatus | null): number {
  if (status === "regressed") return 0;
  if (status === "improved") return 1;
  if (status === "new") return 2;
  if (status === "not-met") return 3;
  if (status === "met") return 4;
  return 5;
}
