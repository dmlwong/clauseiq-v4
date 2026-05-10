// Playbook rule + AI confidence metadata (TASK-05, TASK-08).
// Used by the clause detail drawer so each verdict can be defended with:
//   - the playbook rule that triggered it
//   - the matched excerpt
//   - the clause location in the contract
//   - the rule version
//   - an AI confidence score with rationale and evidence link
// R3 additions:
//   - DI-15: rule version history (changelog) per rule
//   - DI-17: numeric confidence band + one-line reasoning (no hover)
export interface RuleHistoryEntry {
  version: string;
  date: string;
  author: string;
  change: string;
  expectation: string;
}

export interface ClauseAudit {
  ruleId: string;
  ruleName: string;
  ruleVersion: string;
  expectation: string;
  matchedExcerpt?: string;
  location?: string;
  confidence: number; // 0..1
  rationale: string;
  evidenceUrl?: string;
  /** DI-15: ordered history (newest first) of rule versions. */
  history?: RuleHistoryEntry[];
}

const FALLBACK: ClauseAudit = {
  ruleId: "PB-DEFAULT",
  ruleName: "Generic playbook benchmark",
  ruleVersion: "v2026.05",
  expectation: "Clause aligns with the standard category benchmark.",
  confidence: 0.78,
  rationale:
    "Heuristic match on clause title and category — model has medium confidence in this verdict. Review the source clause before accepting.",
  history: [
    { version: "v2026.05", date: "2026-04-02", author: "Playbook team", change: "Initial generic fallback rule.", expectation: "Clause aligns with the standard category benchmark." },
  ],
};

const AUDIT_BY_CLAUSE: Record<string, ClauseAudit> = {
  c3: {
    ruleId: "PB-TC-03",
    ruleName: "Termination for Convenience — notice period",
    ruleVersion: "v2026.04",
    expectation: "Notice period must not exceed 30 days for buyer convenience.",
    matchedExcerpt: "ninety (90) days written notice",
    location: "§3.1 Termination",
    confidence: 0.94,
    rationale:
      "Exact phrase match on numeric notice period. Benchmark threshold is 30 days; supplier proposes 90.",
    evidenceUrl: "#playbook/TC-03",
    history: [
      { version: "v2026.04", date: "2026-03-18", author: "Legal Ops", change: "Tightened notice period from 60 → 30 days following Q1 treasury review.", expectation: "Notice period must not exceed 30 days for buyer convenience." },
      { version: "v2025.11", date: "2025-11-04", author: "Legal Ops", change: "Added carve-out for force-majeure renegotiation.", expectation: "Notice period must not exceed 60 days for buyer convenience." },
      { version: "v2025.06", date: "2025-06-12", author: "Procurement Council", change: "Initial published rule.", expectation: "Notice period should be reasonable (90 days target)." },
    ],
  },
  c31: {
    ruleId: "PB-PT-01",
    ruleName: "Payment Terms — minimum days",
    ruleVersion: "v2026.04",
    expectation: "Payment terms ≥ Net 60 to align with treasury policy.",
    matchedExcerpt: "thirty (30) days of receipt",
    location: "§12 Invoicing",
    confidence: 0.96,
    rationale: "Numeric extraction matched against benchmark Net 60 threshold.",
    evidenceUrl: "#playbook/PT-01",
    history: [
      { version: "v2026.04", date: "2026-03-22", author: "Treasury", change: "Raised threshold from Net 45 → Net 60 after working-capital review.", expectation: "Payment terms ≥ Net 60." },
      { version: "v2025.09", date: "2025-09-30", author: "Treasury", change: "Standardised on Net 45 across categories.", expectation: "Payment terms ≥ Net 45." },
    ],
  },
  c35: {
    ruleId: "PB-LB-02",
    ruleName: "Liability cap — multiplier of annual fees",
    ruleVersion: "v2026.05",
    expectation: "Cap ≤ 100% of annual fees with carve-outs for IP and confidentiality.",
    matchedExcerpt: "limited to fees paid in the preceding twelve (12) months",
    location: "§18 Liability",
    confidence: 0.71,
    rationale:
      "Cap formula matches benchmark, but carve-outs are not explicitly enumerated. Review needed before acceptance.",
    evidenceUrl: "#playbook/LB-02",
    history: [
      { version: "v2026.05", date: "2026-04-08", author: "Risk & Insurance", change: "Added explicit IP and confidentiality carve-out requirement.", expectation: "Cap ≤ 100% of annual fees with carve-outs for IP and confidentiality." },
      { version: "v2025.12", date: "2025-12-01", author: "Risk & Insurance", change: "Original 100% cap rule introduced.", expectation: "Cap ≤ 100% of annual fees." },
    ],
  },
  c48: {
    ruleId: "PB-DP-04",
    ruleName: "Data Processing — GDPR Article 28",
    ruleVersion: "v2026.05",
    expectation: "Full Art. 28 schedule with 24-hour breach notification.",
    matchedExcerpt: "personal data shall be processed in accordance with Schedule 7",
    location: "§22 Data Protection",
    confidence: 0.62,
    rationale:
      "Schedule 7 is referenced but breach notification SLA is missing from extracted text. Low confidence — manual review recommended.",
    evidenceUrl: "#playbook/DP-04",
    history: [
      { version: "v2026.05", date: "2026-04-15", author: "Privacy Office", change: "Tightened breach SLA from 72h → 24h.", expectation: "Full Art. 28 schedule with 24-hour breach notification." },
      { version: "v2025.05", date: "2025-05-25", author: "Privacy Office", change: "Originally aligned to GDPR 72h notification window.", expectation: "Full Art. 28 schedule with 72-hour breach notification." },
    ],
  },
  c58: {
    ruleId: "PB-SC-01",
    ruleName: "Subcontracting — prior consent required",
    ruleVersion: "v2026.04",
    expectation: "Buyer prior written consent required for material subcontractors.",
    matchedExcerpt: "may subcontract its obligations to approved subcontractors",
    location: "§26 Subcontracting",
    confidence: 0.83,
    rationale: "Consent language present; 'approved' list provided in Schedule 1.",
    evidenceUrl: "#playbook/SC-01",
    history: [
      { version: "v2026.04", date: "2026-03-20", author: "Legal Ops", change: "Required Schedule 1 list to be referenced explicitly.", expectation: "Buyer prior written consent required for material subcontractors." },
      { version: "v2025.08", date: "2025-08-14", author: "Legal Ops", change: "Original consent rule.", expectation: "Buyer consent required for subcontractors." },
    ],
  },
};

export function getClauseAudit(clauseId: string): ClauseAudit {
  return AUDIT_BY_CLAUSE[clauseId] ?? FALLBACK;
}

/**
 * DI-17: numeric confidence band + inline reasoning so users no longer need
 * to hover to understand "Medium". Returns label, numeric range string, a
 * one-liner rationale, and a tone token.
 */
export function confidenceLabel(c: number): {
  label: string;
  range: string;
  reasoning: string;
  tone: string;
} {
  if (c >= 0.85) {
    return {
      label: "High",
      range: "85–100%",
      reasoning: "Exact playbook match — verdict is reliable.",
      tone: "bg-success/10 text-success border-success/30",
    };
  }
  if (c >= 0.65) {
    return {
      label: "Medium",
      range: "65–84%",
      reasoning: "Partial playbook match — spot-check the source clause.",
      tone: "bg-warning/15 text-warning-foreground border-warning/30",
    };
  }
  return {
    label: "Low — review",
    range: "0–64%",
    reasoning: "Weak signal — manual review required before acting.",
    tone: "bg-destructive/10 text-destructive border-destructive/30",
  };
}
