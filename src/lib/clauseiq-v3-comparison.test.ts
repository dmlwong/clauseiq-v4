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
import { determineChangePill } from "@/lib/change-tracking-v3";

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

  it("derives bucket totals that sum to the full clause framework", () => {
    const model = deriveComparisonModel(ACME_MSA_VERSIONS, { from: "v2", to: "v4" }, seededDecisions);
    const bucketTotal = Object.values(model.buckets).reduce((sum, rows) => sum + rows.length, 0);

    expect(model.pair).toEqual({ from: "v2", to: "v4" });
    expect(bucketTotal).toBe(model.severityCounts.total);
  });

  it("routes outcome statuses to the correct buckets", () => {
    const model = deriveComparisonModel(ACME_MSA_VERSIONS, { from: "v3", to: "v4" }, seededDecisions);

    // Met / partially met / not met → Open Items
    for (const row of model.buckets.open_items) {
      expect(["met", "partially_met", "not_met"]).toContain(row.pill.status ?? "fallback-requested");
    }
    // Worsened / unexpected / manual_review → New Changes
    for (const row of model.buckets.new_changes) {
      expect(["worsened", "unexpected", "manual_review"]).toContain(row.pill.status);
    }
  });

  it("builds panel movement and score delta for the selected pair", () => {
    const model = deriveComparisonModel(ACME_MSA_VERSIONS, { from: "v3", to: "v4" }, seededDecisions);

    expect(model.panel.previous?.version).toBe("v3");
    expect(model.panel.current.version).toBe("v4");
    expect(model.panel.delta).toBe(ACME_MSA_VERSIONS[3].overallScore - ACME_MSA_VERSIONS[2].overallScore);
    expect(model.panel.movement.improved).toBeGreaterThan(0);
  });

  it("counts every new outcome status in comparison facts", () => {
    const model = deriveComparisonModel(ACME_MSA_VERSIONS, { from: "v3", to: "v4" }, seededDecisions);

    // v3 → v4 demo storyline: six clauses met, one unexpected (c11), one manual_review (c52).
    expect(model.comparisonFacts).toMatchObject({
      met: 6,
      partiallyMet: 0,
      notMet: 0,
      worsened: 0,
      unexpected: 1,
      manualReview: 1,
      requestedTotal: 6,
      supplierChanges: 2,
    });
    expect(model.bucketStats.open_items.total).toBe(6);
    expect(model.bucketStats.new_changes.total).toBe(2);
    expect(model.bucketStats.unmarked.total).toBe(58);
  });

  it("includes partially met and worsened in the v2 storyline", () => {
    const model = deriveComparisonModel(ACME_MSA_VERSIONS, { from: "v1", to: "v2" }, seededDecisions);

    expect(model.comparisonFacts.partiallyMet).toBeGreaterThan(0);
    expect(model.comparisonFacts.worsened).toBeGreaterThan(0);
    expect(model.comparisonFacts.notMet).toBeGreaterThan(0);
  });

  it("keeps contract facts stable when a new change is requested", () => {
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
    expect(model.bucketStats.new_changes.pendingRequests).toBe(1);
    expect(model.contractFacts.total).toBe(66);
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
    expect(model.bucketStats.closed.total).toBe(1);
    expect(model.actionFacts.closed).toBe(1);
  });

  it("lets filtered visible row stats change without mutating model totals", () => {
    const model = deriveComparisonModel(ACME_MSA_VERSIONS, { from: "v3", to: "v4" }, seededDecisions);
    const newChangesTotal = model.bucketStats.new_changes.total;
    const visibleNewHighRows = model.buckets.new_changes.filter((row) => row.curr?.severity === "high");
    const visibleStats = summariseComparisonRows(visibleNewHighRows);

    expect(visibleStats.total).toBeLessThanOrEqual(newChangesTotal);
    expect(model.contractFacts.total).toBe(66);
  });
});

describe("change pill vocabulary", () => {
  it("reads the met outcome straight off the clause", () => {
    const clause = ACME_MSA_VERSIONS[3].clauses.find((item) => item.id === "c31");

    expect(determineChangePill({ clause }).status).toBe("met");
  });

  it("reads the not_met outcome for unmoved requested changes", () => {
    const clause = ACME_MSA_VERSIONS[2].clauses.find((item) => item.id === "c58");

    expect(determineChangePill({ clause }).status).toBe("not_met");
  });

  it("marks supplier-introduced clauses as unexpected", () => {
    const clause = ACME_MSA_VERSIONS[3].clauses.find((item) => item.id === "c11");

    expect(determineChangePill({ clause }).status).toBe("unexpected");
  });

  it("surfaces manual_review when the AI can't decide", () => {
    const clause = ACME_MSA_VERSIONS[3].clauses.find((item) => item.id === "c52");

    expect(determineChangePill({ clause }).status).toBe("manual_review");
  });

  it("returns null when an outcome hasn't been set", () => {
    const clause = ACME_MSA_VERSIONS[0].clauses.find((item) => item.id === "c3");

    expect(determineChangePill({ clause }).status).toBeNull();
  });
});

describe("ClauseIQ v3 history model", () => {
  it("counts worsened and partial outcomes as still open", () => {
    const model = deriveHistoryModel(ACME_MSA_VERSIONS, seededDecisions, "still_open", null, "contentious");

    expect(
      model.filteredRows.every((row) =>
        ["open", "not_met", "worsened", "partially_met", "manual_review"].includes(row.currentStatus),
      ),
    ).toBe(true);
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
