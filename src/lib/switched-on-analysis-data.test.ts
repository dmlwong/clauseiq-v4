import { describe, expect, it } from "vitest";

import { CLAUSE_FRAMEWORK } from "@/lib/clauses-framework";
import {
  isSwitchedOnMissingClause,
  resolveSwitchedOnFrameworkClause,
  SWITCHED_ON_ANALYSIS_ROWS,
  SWITCHED_ON_FIRST_ANALYSIS_VERSION,
} from "@/lib/switched-on-analysis-data";

describe("Switched On first-analysis workbook mapping", () => {
  it("maps every workbook row to one framework clause", () => {
    const ids = SWITCHED_ON_ANALYSIS_ROWS.map((row) => resolveSwitchedOnFrameworkClause(row).id);

    expect(SWITCHED_ON_ANALYSIS_ROWS).toHaveLength(66);
    expect(SWITCHED_ON_FIRST_ANALYSIS_VERSION.clauses).toHaveLength(CLAUSE_FRAMEWORK.length);
    expect(new Set(ids).size).toBe(CLAUSE_FRAMEWORK.length);
  });

  it("applies explicit workbook title aliases", () => {
    const cases = [
      ["Indexation", "Cost Change - Non Index Linked Changes"],
      ["Pricing and Pricing Model", "Pricing, Pricing Model, and Rate Card Clarity"],
      ["Ownership of IPR Created by Supplier", "Ownership of IPR Created by the Supplier"],
      ["Termination for Convenience on Notice", "Termination for Convenience"],
    ];

    for (const [sourceTitle, frameworkTitle] of cases) {
      const row = SWITCHED_ON_ANALYSIS_ROWS.find((candidate) => candidate.sourceClauseName === sourceTitle);
      expect(row).toBeTruthy();
      expect(resolveSwitchedOnFrameworkClause(row!).title).toBe(frameworkTitle);
    }
  });

  it("uses MISS extracts as the Missing Clauses signal", () => {
    const sourceMissingRows = SWITCHED_ON_ANALYSIS_ROWS.filter(isSwitchedOnMissingClause);
    const mappedMissingClauses = SWITCHED_ON_FIRST_ANALYSIS_VERSION.clauses.filter((clause) => clause.missingClause);
    const cleanNoneClauses = SWITCHED_ON_FIRST_ANALYSIS_VERSION.clauses.filter(
      (clause) => clause.sourceDeviationLevel === "None" && !clause.missingClause,
    );
    const pureMissingClauses = SWITCHED_ON_FIRST_ANALYSIS_VERSION.clauses.filter(
      (clause) => clause.sourceDeviationLevel === "None" && clause.missingClause,
    );

    expect(sourceMissingRows).toHaveLength(17);
    expect(mappedMissingClauses).toHaveLength(17);
    expect(cleanNoneClauses.every((clause) => clause.resolved)).toBe(true);
    expect(pureMissingClauses).toHaveLength(5);
    expect(pureMissingClauses.every((clause) => !clause.resolved && clause.change === "new")).toBe(true);
  });

  it("maps workbook Summary and Actionability into dashboard copy", () => {
    const termination = SWITCHED_ON_FIRST_ANALYSIS_VERSION.clauses.find((clause) => clause.id === "c3");

    expect(termination?.deviation).toBe(
      "Buyer can cancel anytime; full refund only within 14-day cooling-off period without claims.",
    );
    expect(termination?.actionability).toContain("unfavorable financial terms");
  });
});
