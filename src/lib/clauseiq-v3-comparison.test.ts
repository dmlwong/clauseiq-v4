import { describe, expect, it } from "vitest";
import type { ClauseDecisionState } from "@/hooks/use-clause-decisions";
import { ACME_MSA_VERSIONS } from "@/lib/clauses-data";
import {
  defaultVersionComparisonPair,
  deriveComparisonModel,
  deriveHistoryModel,
  normalizeVersionComparisonPair,
} from "@/lib/clauseiq-v3-comparison";
import { determineChangePill } from "@/lib/change-tracking";

const seededDecisions: Record<string, ClauseDecisionState> = {
  c3: { roundDecisions: { v1: "request-update" }, closures: {}, requests: {}, updatedAt: "" },
  c31: { roundDecisions: { v1: "request-update" }, closures: {}, requests: {}, updatedAt: "" },
  c35: { roundDecisions: { v1: "request-update" }, closures: {}, requests: {}, updatedAt: "" },
  c48: { roundDecisions: { v1: "request-update" }, closures: {}, requests: {}, updatedAt: "" },
  c58: { roundDecisions: { v1: "request-update" }, closures: {}, requests: {}, updatedAt: "" },
};

describe("ClauseIQ v3 comparison model", () => {
  it("defaults to the latest valid comparison pair", () => {
    expect(defaultVersionComparisonPair(ACME_MSA_VERSIONS)).toEqual({ from: "v3", to: "v4" });
  });

  it("normalizes invalid URL params back to a valid ordered pair", () => {
    expect(normalizeVersionComparisonPair(ACME_MSA_VERSIONS, { from: "v99", to: "v4" })).toEqual({
      from: "v3",
      to: "v4",
    });
    expect(normalizeVersionComparisonPair(ACME_MSA_VERSIONS, { from: "v4", to: "v2" })).toEqual({
      from: "v3",
      to: "v4",
    });
  });

  it("derives change-first bucket counts from any selected pair", () => {
    const model = deriveComparisonModel(ACME_MSA_VERSIONS, { from: "v2", to: "v4" }, seededDecisions);
    const bucketTotal = Object.values(model.buckets).reduce((sum, rows) => sum + rows.length, 0);

    expect(model.pair).toEqual({ from: "v2", to: "v4" });
    expect(bucketTotal).toBe(model.severityCounts.total);
    expect(model.changeTracking.requestedTotal).toBe(5);
    expect(model.buckets.open_items.every((row) => row.wasRequested)).toBe(true);
    expect(model.buckets.new_changes.every((row) => !row.wasRequested)).toBe(true);
  });

  it("builds panel movement and score delta for the selected pair", () => {
    const model = deriveComparisonModel(ACME_MSA_VERSIONS, { from: "v3", to: "v4" }, seededDecisions);

    expect(model.panel.previous?.version).toBe("v3");
    expect(model.panel.current.version).toBe("v4");
    expect(model.panel.delta).toBe(ACME_MSA_VERSIONS[3].overallScore - ACME_MSA_VERSIONS[2].overallScore);
    expect(model.panel.movement.improved).toBeGreaterThan(0);
  });
});

describe("change pill vocabulary", () => {
  it("uses requested precedence over generic improvement", () => {
    const previousClause = ACME_MSA_VERSIONS[2].clauses.find((clause) => clause.id === "c31");
    const clause = ACME_MSA_VERSIONS[3].clauses.find((item) => item.id === "c31");

    expect(determineChangePill({ clause, previousClause, wasRequestedInPreviousRound: true }).status).toBe("met");
  });

  it("uses the normalized not_met status for unmet requested changes", () => {
    const previousClause = ACME_MSA_VERSIONS[1].clauses.find((clause) => clause.id === "c58");
    const clause = ACME_MSA_VERSIONS[2].clauses.find((item) => item.id === "c58");

    expect(determineChangePill({ clause, previousClause, wasRequestedInPreviousRound: true }).status).toBe("not_met");
  });

  it("marks new clauses separately", () => {
    const clause = ACME_MSA_VERSIONS[3].clauses.find((item) => item.id === "c11");

    expect(determineChangePill({ clause, previousClause: undefined, wasRequestedInPreviousRound: false }).status).toBe("new");
  });
});

describe("ClauseIQ v3 history model", () => {
  it("counts regressed clauses as still open", () => {
    const model = deriveHistoryModel(ACME_MSA_VERSIONS, seededDecisions, "still_open", null, "contentious");

    expect(model.stats.stillOpen).toBeGreaterThanOrEqual(model.stats.regressedLastRound);
    expect(model.filteredRows.every((row) => ["open", "not_met", "regressed"].includes(row.currentStatus))).toBe(true);
  });

  it("combines history category and filter with AND logic", () => {
    const model = deriveHistoryModel(ACME_MSA_VERSIONS, seededDecisions, "met", "Commercial Terms", "clause_id");

    expect(model.filteredRows.every((row) => row.category === "Commercial Terms")).toBe(true);
    expect(model.filteredRows.every((row) => row.currentStatus === "met")).toBe(true);
  });

  it("sorts history rows by most contentious by default", () => {
    const model = deriveHistoryModel(ACME_MSA_VERSIONS, seededDecisions, "all", null, "contentious");
    const changes = model.filteredRows.map((row) => row.stateChanges);

    expect(changes).toEqual([...changes].sort((a, b) => b - a));
  });
});
