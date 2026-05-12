import { describe, expect, it } from "vitest";
import type { ClauseDecisionState } from "@/hooks/use-clause-decisions";
import { ACME_MSA_VERSIONS } from "@/lib/clauses-data";
import {
  defaultVersionComparisonPair,
  deriveComparisonModel,
  deriveHistoryModel,
  normalizeVersionComparisonPair,
  summariseComparisonRows,
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

  it("links v3 to v4 strip, bucket, and action facts from one model", () => {
    const model = deriveComparisonModel(ACME_MSA_VERSIONS, { from: "v3", to: "v4" }, seededDecisions);

    expect(model.contractFacts).toMatchObject({
      version: "v4",
      high: 9,
      medium: 16,
      low: 17,
      total: 66,
      score: 77,
    });
    expect(model.comparisonFacts).toMatchObject({
      met: 5,
      notMet: 0,
      requestedTotal: 5,
      supplierChanges: 2,
      improved: 1,
      regressed: 0,
      new: 1,
    });
    expect(model.bucketStats.open_items.total).toBe(5);
    expect(model.bucketStats.new_changes.total).toBe(2);
    expect(model.bucketStats.unmarked.total).toBe(59);
    expect(model.actionFacts.pendingReview).toBe(7);
  });

  it("keeps contract and comparison facts stable when a new change is requested", () => {
    const decisions: Record<string, ClauseDecisionState> = {
      ...seededDecisions,
      c11: {
        roundDecisions: { v4: "request-update" },
        closures: {},
        requests: { v4: { requestedChange: "Remove the planned maintenance carve-out." } },
        updatedAt: "",
      },
    };
    const model = deriveComparisonModel(ACME_MSA_VERSIONS, { from: "v3", to: "v4" }, decisions);
    const row = model.buckets.new_changes.find((item) => item.id === "c11");

    expect(row?.actionState).toBe("requested");
    expect(model.actionFacts.pendingReview).toBe(6);
    expect(model.bucketStats.new_changes.pendingRequests).toBe(1);
    expect(model.contractFacts).toMatchObject({ high: 9, medium: 16, low: 17, total: 66, score: 77 });
    expect(model.comparisonFacts.supplierChanges).toBe(2);
  });

  it("removes submitted requests from pending request accounting", () => {
    const decisions: Record<string, ClauseDecisionState> = {
      ...seededDecisions,
      c11: {
        roundDecisions: { v4: "request-update" },
        closures: {},
        requests: {
          v4: {
            requestedChange: "Remove the planned maintenance carve-out.",
            state: "submitted",
            submittedAt: "2026-05-12T12:00:00.000Z",
          },
        },
        updatedAt: "",
      },
    };
    const model = deriveComparisonModel(ACME_MSA_VERSIONS, { from: "v3", to: "v4" }, decisions);
    const row = model.buckets.new_changes.find((item) => item.id === "c11");

    expect(row?.actionState).toBe("submitted_request");
    expect(model.bucketStats.new_changes.pendingRequests).toBe(0);
    expect(model.bucketStats.new_changes.submittedRequests).toBe(1);
    expect(model.actionFacts.pendingReview).toBe(6);
    expect(model.comparisonFacts.supplierChanges).toBe(2);
  });

  it("keeps detected supplier changes stable when a new change is marked no action", () => {
    const decisions: Record<string, ClauseDecisionState> = {
      ...seededDecisions,
      c11: {
        roundDecisions: { v4: "no-action" },
        closures: {},
        requests: {},
        updatedAt: "",
      },
    };
    const model = deriveComparisonModel(ACME_MSA_VERSIONS, { from: "v3", to: "v4" }, decisions);
    const row = model.buckets.new_changes.find((item) => item.id === "c11");

    expect(row?.actionState).toBe("no_action");
    expect(model.actionFacts.pendingReview).toBe(6);
    expect(model.bucketStats.new_changes.noAction).toBe(1);
    expect(model.contractFacts).toMatchObject({ high: 9, medium: 16, low: 17, total: 66, score: 77 });
    expect(model.comparisonFacts.supplierChanges).toBe(2);
  });

  it("moves a closed open item into closed bucket stats", () => {
    const decisions: Record<string, ClauseDecisionState> = {
      ...seededDecisions,
      c3: {
        ...seededDecisions.c3,
        closures: { v4: "closed" },
      },
    };
    const model = deriveComparisonModel(ACME_MSA_VERSIONS, { from: "v3", to: "v4" }, decisions);

    expect(model.buckets.closed.find((row) => row.id === "c3")?.actionState).toBe("closed");
    expect(model.bucketStats.open_items.total).toBe(4);
    expect(model.bucketStats.closed.total).toBe(1);
    expect(model.actionFacts.closed).toBe(1);
    expect(model.actionFacts.pendingReview).toBe(6);
  });

  it("lets filtered visible row stats change without mutating model totals", () => {
    const model = deriveComparisonModel(ACME_MSA_VERSIONS, { from: "v3", to: "v4" }, seededDecisions);
    const visibleNewHighRows = model.buckets.new_changes.filter((row) => row.curr?.severity === "high");
    const visibleStats = summariseComparisonRows(visibleNewHighRows);

    expect(visibleStats.total).toBeLessThan(model.bucketStats.new_changes.total);
    expect(model.bucketStats.new_changes.total).toBe(2);
    expect(model.contractFacts.total).toBe(66);
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
