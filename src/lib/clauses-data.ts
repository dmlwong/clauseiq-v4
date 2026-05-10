import { CLAUSE_FRAMEWORK } from "./clauses-framework";
import type { ClauseResult, ClauseSeverity, ClauseChange, ContractVersion } from "./workflow-types";

// Deterministic baseline severity per clause (stable across versions for non-focus clauses)
function baselineSeverity(num: number): ClauseSeverity {
  const m = num % 7;
  if (m === 0 || m === 3) return "medium";
  if (m === 5) return "high";
  return "low";
}

function baselineResolved(num: number, severity: ClauseSeverity): boolean {
  return severity === "low" && num % 2 === 0;
}

function genericExcerpt(title: string): string {
  return `Standard contractual language for ${title}. Refer to the full clause text in the master contract document.`;
}

function genericDeviation(severity: ClauseSeverity, title: string): string {
  if (severity === "high") return `${title} contains material deviations from the benchmark playbook.`;
  if (severity === "medium") return `${title} contains minor deviations from the benchmark playbook.`;
  return `${title} aligns with the benchmark playbook.`;
}

// Per-version overrides for the 5 example focus clauses (Acme MSA storyline)
// Clause IDs: c3 Termination for Convenience, c31 Payment Terms, c35 Liability Cap of Supplier,
// c48 Data Processing, c58 Subcontracting
type FocusOverride = Partial<Pick<ClauseResult, "severity" | "resolved" | "change" | "excerpt" | "deviation" | "improvementReason" | "locations" | "actionability">>;

// Static enrichment for the 5 focus clauses — applies across all versions unless overridden.
const FOCUS_ENRICHMENT: Record<string, Pick<ClauseResult, "locations" | "actionability">> = {
  c3:  {
    locations: ["§3.1 Termination", "Schedule 4 — Exit Plan", "Annex B §2"],
    actionability: "Counter with 30-day notice; align with benchmark playbook clause TC-03.",
  },
  c31: {
    locations: ["§12 Invoicing", "Schedule 2 — Pricing §4.2", "Order Form §6"],
    actionability: "Push for Net 60 to match group treasury policy; reference benchmark PT-01.",
  },
  c35: {
    locations: ["§18 Liability", "Schedule 5 — Insurance §3", "Annex C §1.4"],
    actionability: "Negotiate cap to 100% of annual fees; carve-outs for IP and confidentiality breaches.",
  },
  c48: {
    locations: ["§22 Data Protection", "Schedule 7 — DPA", "Annex D — Sub-processors"],
    actionability: "Require full GDPR Art. 28 schedule and 24-hour breach notification SLA.",
  },
  c58: {
    locations: ["§26 Subcontracting", "Schedule 1 — Approved Subcontractors"],
    actionability: "Require prior written consent and right to object to material subcontractors.",
  },
};

// Buyer-side benchmark perspective: longer payment terms = better for buyer (cash flow).
// Benchmark target: Net 60. Supplier opens at Net 30; buyer negotiates upward.
const ACME_FOCUS: Record<string, Record<string, FocusOverride>> = {
  v1: {
    c3:  { severity: "high",   resolved: false, deviation: "Notice period 90 days vs benchmark 30 days.", excerpt: "Either party may terminate this Agreement for convenience upon ninety (90) days written notice." },
    c31: { severity: "high",   resolved: false, deviation: "Payment terms Net 30 — supplier-favourable; benchmark is Net 60.", excerpt: "Invoices payable within thirty (30) days of receipt." },
    c35: { severity: "high",   resolved: false, deviation: "Cap set at 50% of fees — below benchmark (100%).", excerpt: "Supplier's total liability shall not exceed fifty percent (50%) of fees paid in the prior 12 months." },
    c48: { severity: "high",   resolved: false, deviation: "No GDPR sub-processor list; insufficient data processing controls.", excerpt: "Supplier shall comply with applicable data protection laws." },
    c58: { severity: "medium", resolved: false, deviation: "Subcontracting permitted with notification only — no consent required.", excerpt: "Supplier may subcontract any portion of the Services upon notification to Buyer." },
    // c10 Service Levels — looks fine in v1; supplier weakens it in v2 (new issue).
    c10: { severity: "low", resolved: true, deviation: "Service levels aligned with benchmark playbook.", excerpt: "Supplier shall meet 99.9% availability with monthly service credits as detailed in Schedule 3." },
  },
  v2: {
    c3:  { severity: "high",   resolved: false, change: "unchanged", deviation: "Notice period 90 days vs benchmark 30 days.", excerpt: "Either party may terminate this Agreement for convenience upon ninety (90) days written notice." },
    c31: { severity: "medium", resolved: false, change: "improved",  deviation: "Payment terms extended to Net 45 — closer to benchmark Net 60.", excerpt: "Invoices payable within forty-five (45) days of receipt.", improvementReason: "Net 30 → Net 45 (longer payment window for buyer)" },
    c35: { severity: "high",   resolved: false, change: "unchanged", deviation: "Cap set at 50% of fees — below benchmark (100%).", excerpt: "Supplier's total liability shall not exceed fifty percent (50%) of fees paid in the prior 12 months." },
    c48: { severity: "medium", resolved: false, change: "improved",  deviation: "GDPR sub-processor list provided; some controls still missing.", excerpt: "Supplier shall maintain a list of approved sub-processors and notify Buyer of changes.", improvementReason: "Sub-processor list added" },
    c58: { severity: "high",   resolved: false, change: "worsened",  deviation: "Subcontracting now permitted without any notification.", excerpt: "Supplier may freely subcontract the Services without notice." },
    // NEW ISSUE in v2 — buyer never flagged this in v1 but supplier weakened SLA.
    c10: { severity: "high", resolved: false, change: "worsened", deviation: "Availability target lowered to 99.0% and service credits removed.", excerpt: "Supplier shall use reasonable endeavours to meet 99.0% availability. Service credits no longer apply." },
  },
  v3: {
    c3:  { severity: "medium", resolved: false, change: "improved",  deviation: "Notice period reduced to 60 days.", excerpt: "Either party may terminate this Agreement for convenience upon sixty (60) days written notice.", improvementReason: "90 → 60 days notice" },
    c31: { severity: "medium", resolved: false, change: "unchanged", deviation: "Payment terms Net 45 — still short of benchmark Net 60.", excerpt: "Invoices payable within forty-five (45) days of receipt." },
    c35: { severity: "medium", resolved: false, change: "improved",  deviation: "Cap raised to 75% of fees.", excerpt: "Supplier's total liability shall not exceed seventy-five percent (75%) of fees paid in the prior 12 months.", improvementReason: "Liability cap 50% → 75%" },
    c48: { severity: "medium", resolved: false, change: "unchanged", deviation: "GDPR sub-processor list provided; some controls still missing.", excerpt: "Supplier shall maintain a list of approved sub-processors and notify Buyer of changes." },
    c58: { severity: "high",   resolved: false, change: "unchanged", deviation: "Subcontracting permitted without notification.", excerpt: "Supplier may freely subcontract the Services without notice." },
    c10: { severity: "medium", resolved: false, change: "improved", deviation: "Availability restored to 99.5%; service credits partially reinstated.", excerpt: "Supplier shall meet 99.5% availability with service credits for sustained breaches.", improvementReason: "99.0% → 99.5% and credits partially restored" },
  },
  v4: {
    c3:  { severity: "low", resolved: true,  change: "improved", deviation: "Notice period 30 days — meets benchmark. Resolved.", excerpt: "Either party may terminate this Agreement for convenience upon thirty (30) days written notice.", improvementReason: "60 → 30 days; resolved" },
    c31: { severity: "low", resolved: true,  change: "improved", deviation: "Payment terms Net 60 — meets benchmark. Resolved.", excerpt: "Invoices payable within sixty (60) days of receipt.", improvementReason: "Net 45 → Net 60; resolved" },
    c35: { severity: "low", resolved: true,  change: "improved", deviation: "Liability cap 100% of fees — meets benchmark. Resolved.", excerpt: "Supplier's total liability shall not exceed one hundred percent (100%) of fees paid in the prior 12 months.", improvementReason: "Liability cap 75% → 100%; resolved" },
    c48: { severity: "low", resolved: true,  change: "improved", deviation: "Full GDPR processor terms with breach notification SLAs. Resolved.", excerpt: "Supplier shall comply with GDPR Art. 28 obligations including audit rights and notification within 24 hours.", improvementReason: "Full GDPR Art. 28 schedule added; resolved" },
    c58: { severity: "medium", resolved: true, change: "improved", deviation: "Subcontracting requires prior written consent. Resolved.", excerpt: "Supplier shall not subcontract any part of the Services without Buyer's prior written consent.", improvementReason: "Consent now required; resolved" },
    c10: { severity: "low", resolved: true, change: "improved", deviation: "Service levels back to 99.9% with full service credits. Resolved.", excerpt: "Supplier shall meet 99.9% availability with service credits per Schedule 3.", improvementReason: "Service levels fully restored; resolved" },
    c11: { severity: "medium", resolved: false, change: "new", deviation: "New service credit carve-out added for planned supplier maintenance windows.", excerpt: "Service credits shall not apply during supplier-designated planned maintenance windows up to twelve (12) hours per month." },
  },
};

// Suggested round-1 requested-change text + rationale for the focus clauses.
export const ACME_DEFAULT_REQUEST_TEXTS: Record<string, { requestedChange: string; rationale: string }> = {
  c3:  { requestedChange: "Reduce termination-for-convenience notice from 90 days to 30 days.", rationale: "Benchmark playbook clause TC-03 sets 30 days; 90 days locks us into a poorly performing supplier." },
  c31: { requestedChange: "Move payment terms from Net 30 to Net 60.", rationale: "Group treasury policy and benchmark PT-01 require Net 60 minimum to protect working capital." },
  c35: { requestedChange: "Raise liability cap from 50% to 100% of annual fees with carve-outs for IP and confidentiality breaches.", rationale: "50% cap is below market and leaves residual risk uninsured." },
  c48: { requestedChange: "Add a full GDPR Art. 28 schedule with 24-hour breach notification SLA.", rationale: "Current language is non-compliant with our DPA framework and exposes us to regulator action." },
  c58: { requestedChange: "Require prior written consent for any subcontracting and a right to object to material subcontractors.", rationale: "Notification-only is insufficient given the criticality of these services." },
};

// Categories considered "materially commercial" — weighted 2x in overall score.
const MATERIAL_CATEGORIES = new Set([
  "Commercial Terms",
  "Commercial Mechanics",
  "Limitation of Liability and Indemnities",
]);

function clauseWeight(category: string): number {
  return MATERIAL_CATEGORIES.has(category) ? 2 : 1;
}

function clauseScore(c: ClauseResult): number {
  // 0..1 per clause; resolved counts as full marks.
  if (c.resolved) return 1;
  if (c.severity === "low") return 0.9;
  if (c.severity === "medium") return 0.6;
  return 0.2; // high
}

function buildClauseFor(versionLabel: string, prevVersionLabel: string | null, overrides: Record<string, FocusOverride>): ClauseResult[] {
  return CLAUSE_FRAMEWORK.map((def) => {
    const baseSev = baselineSeverity(def.number);
    const baseResolved = baselineResolved(def.number, baseSev);
    const ovr = overrides[def.id] ?? {};
    const severity = ovr.severity ?? baseSev;
    const resolved = ovr.resolved ?? baseResolved;
    const change: ClauseChange = ovr.change ?? (prevVersionLabel ? "unchanged" : "unchanged");
    const enrich = FOCUS_ENRICHMENT[def.id];
    return {
      id: def.id,
      title: def.title,
      subclause: `§${def.number}`,
      category: def.category,
      severity,
      resolved,
      change,
      deviation: ovr.deviation ?? genericDeviation(severity, def.title),
      excerpt: ovr.excerpt ?? genericExcerpt(def.title),
      improvementReason: ovr.improvementReason,
      locations: ovr.locations ?? enrich?.locations,
      actionability: ovr.actionability ?? enrich?.actionability,
    };
  });
}

function summarise(clauses: ClauseResult[]): Pick<ContractVersion, "highIssues" | "mediumIssues" | "lowIssues" | "overallScore"> {
  const high = clauses.filter((c) => c.severity === "high" && !c.resolved).length;
  const medium = clauses.filter((c) => c.severity === "medium" && !c.resolved).length;
  const low = clauses.filter((c) => c.severity === "low" && !c.resolved).length;
  // Weighted contribution per clause; materially commercial categories count 2x.
  let achieved = 0;
  let possible = 0;
  for (const c of clauses) {
    const w = clauseWeight(c.category);
    achieved += clauseScore(c) * w;
    possible += w;
  }
  const score = possible > 0 ? Math.round((achieved / possible) * 100) : 0;
  return { highIssues: high, mediumIssues: medium, lowIssues: low, overallScore: score };
}

function makeVersion(label: string, prev: string | null, uploadedAt: string, overrides: Record<string, FocusOverride>): ContractVersion {
  const clauses = buildClauseFor(label, prev, overrides);
  return { version: label, uploadedAt, clauses, ...summarise(clauses) };
}

// Acme MSA — full v1 → v4 storyline (focus clauses progress; others stable)
export const ACME_MSA_VERSIONS: ContractVersion[] = [
  makeVersion("v1", null, "2025-01-12", ACME_FOCUS.v1),
  makeVersion("v2", "v1", "2025-02-08", ACME_FOCUS.v2),
  makeVersion("v3", "v2", "2025-03-04", ACME_FOCUS.v3),
  makeVersion("v4", "v3", "2025-04-02", ACME_FOCUS.v4),
];

/** Synthesise a new version on the fly (used by the upload-version simulation). */
export function makeSyntheticVersion(label: string, prevLabel: string | null, uploadedAt: string): ContractVersion {
  // Cycle through the curated overrides for a plausible new round of changes.
  const overrideKeys = ["v2", "v3", "v4"] as const;
  const pick = overrideKeys[(parseInt(label.replace(/\D/g, ""), 10) - 1) % overrideKeys.length] ?? "v2";
  return makeVersion(label, prevLabel, uploadedAt, ACME_FOCUS[pick]);
}

// Single-version snapshots for other contracts (use v2 baseline overrides as a generic "negotiated" state)
export const SINGLE_NEGOTIATED_VERSION = (label: string, uploadedAt: string): ContractVersion =>
  makeVersion(label, null, uploadedAt, ACME_FOCUS.v2);

export const SINGLE_INITIAL_VERSION = (label: string, uploadedAt: string): ContractVersion =>
  makeVersion(label, null, uploadedAt, ACME_FOCUS.v1);

// Default focus clause IDs for the Acme MSA demo
export const ACME_DEFAULT_FOCUS_IDS = ["c3", "c31", "c35", "c48", "c58"];
