import { describe, expect, it } from "vitest";
import { V6A_DESIGN_OPTION_3_FIRST_ANALYSIS_VERSION } from "./v6a-design-option-3-data";

describe("v6a Design option 3 stakeholder fixture", () => {
  it("contains the 14-row review slice and matching deviation mix", () => {
    const version = V6A_DESIGN_OPTION_3_FIRST_ANALYSIS_VERSION;
    expect(version.clauses).toHaveLength(14);
    expect(version.highIssues).toBe(4);
    expect(version.mediumIssues).toBe(4);
    expect(version.lowIssues).toBe(4);
    expect(version.clauses.filter((clause) => clause.missingClause)).toHaveLength(2);
  });

  it("preserves the stakeholder wording for missing and negotiable positions", () => {
    const serviceCredits = versionClause("c11");
    const paymentTerms = versionClause("c31");
    expect(serviceCredits.deviation).toContain("No wording in the supplier's contract");
    expect(serviceCredits.actionability).toContain("5% of monthly charges");
    expect(paymentTerms.excerpt).toContain("forty-five (45) days of receipt");
    expect(paymentTerms.actionability).toContain("30 days");
  });
});

function versionClause(id: string) {
  const clause = V6A_DESIGN_OPTION_3_FIRST_ANALYSIS_VERSION.clauses.find((item) => item.id === id);
  if (!clause) throw new Error(`Missing fixture clause ${id}`);
  return clause;
}
