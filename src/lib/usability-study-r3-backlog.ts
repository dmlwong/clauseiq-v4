// Round 3 backlog — recommendations derived from the Round 2 study findings.
// Grouped into 4 priority tiers + explicit "do not do" guidance + R3 success metrics.

export type R3Priority = "P1" | "P2" | "P3" | "P4";

export interface R3Recommendation {
  id: string;
  priority: R3Priority;
  tier: string; // human-readable priority label
  area: string;
  title: string;
  problem: string;
  proposal: string;
  evidence: string;
  impact: "High" | "Medium" | "Low";
  effort: "Low" | "Medium" | "High";
  carriedFrom?: string; // optional reference to a prior DI id
}

export const R3_RECOMMENDATIONS: R3Recommendation[] = [
  // ── Priority 1 — Close the trust gap for sceptics ─────────────────
  {
    id: "DI-15",
    priority: "P1",
    tier: "Close the trust gap",
    area: "Trust & transparency",
    title: "Expand audit drawer with playbook rule history",
    problem: "Excel-trained sceptics still spot-check verdicts; current drawer only shows the active rule.",
    proposal: "Add a 'Rule history' tab inside the audit drawer with a diff between rule versions and a timestamp per change.",
    evidence: "20% of R2 participants (mostly Sceptical cohort) asked 'has this rule always read this way?'",
    impact: "High",
    effort: "Medium",
  },
  {
    id: "DI-17",
    priority: "P1",
    tier: "Close the trust gap",
    area: "Trust & transparency",
    title: "Replace 'Medium' confidence with numeric band + inline reasoning",
    problem: "Confidence pill wording felt vague; users had to hover to learn what 'Medium' meant.",
    proposal: "Show a numeric band (e.g. 65–80%) and a single line of reasoning beside the pill, no hover required.",
    evidence: "R2 quote: 'Confidence pill wording (Medium) felt vague.' Raised by ~24% of participants.",
    impact: "High",
    effort: "Low",
  },

  // ── Priority 2 — Polish what already works ────────────────────────
  {
    id: "DI-13",
    priority: "P2",
    tier: "Polish what works",
    area: "Change detection",
    title: "Improve diff colour contrast in dark mode",
    problem: "Diff red/green is hard to read on dark backgrounds; relies on colour alone.",
    proposal: "Use AA-compliant token pair (success-strong / destructive-strong) plus an underline marker for additions.",
    evidence: "28% of R2 participants flagged dark-mode diff legibility as the top residual issue.",
    impact: "Medium",
    effort: "Low",
  },
  {
    id: "DI-14",
    priority: "P2",
    tier: "Polish what works",
    area: "Navigation & IA",
    title: "Make 'Unexpected only' filter discoverable on first visit",
    problem: "Filter works once spotted, but first-time users overlook the chip on the compare view.",
    proposal: "Auto-toggle when unexpected count > 0 and show a one-time dismissible coachmark beside the chip.",
    evidence: "24% of R2 participants needed a second pass to find the filter; quoted as 'great once you spot it'.",
    impact: "High",
    effort: "Low",
  },
  {
    id: "DI-18",
    priority: "P2",
    tier: "Polish what works",
    area: "Decision support",
    title: "Extend undo toast + persistent row-level undo",
    problem: "Undo toast disappears too quickly; users miss the window after Accept.",
    proposal: "Increase toast to 8s, and surface an 'Undo' link on the row itself for 30s after the action.",
    evidence: "R2 friction tally: 'Undo toast disappears too fast' on multiple Accept-related sessions.",
    impact: "Medium",
    effort: "Low",
  },

  // ── Priority 3 — New workflow primitives ──────────────────────────
  {
    id: "DI-16",
    priority: "P3",
    tier: "New workflow primitives",
    area: "Decision support",
    title: "'Pin clause' across version switches",
    problem: "Users lose their place when changing the active version pair; reorientation costs time.",
    proposal: "Pin button on each row that keeps it scrolled-into-view and highlighted across version pair changes.",
    evidence: "16% of R2 participants raised: 'Wanted to pin a clause across version switches.'",
    impact: "Medium",
    effort: "Medium",
  },
  {
    id: "DI-12",
    priority: "P3",
    tier: "New workflow primitives",
    area: "Decision support",
    title: "'Follow-up' state for partially addressed requests",
    problem: "Verdicts remain binary; reality includes 'partially addressed, needs another round'.",
    proposal: "Add a 'Follow-up' state with optional note attached to the next supplier brief.",
    evidence: "Carried from R1 backlog (DI-12); Mid users still ask 'how do I park this for V3?'",
    impact: "Medium",
    effort: "Medium",
    carriedFrom: "DI-12",
  },
  {
    id: "DI-19",
    priority: "P3",
    tier: "New workflow primitives",
    area: "Workflow speed",
    title: "Include audit column in CSV export",
    problem: "Excel-trained users export to verify; the audit column is missing, forcing a second lookup.",
    proposal: "Add 'verdict_reasoning' and 'rule_id' columns to the CSV export.",
    evidence: "R2 friction: 'CSV export missing the audit column.'",
    impact: "Low",
    effort: "Low",
  },

  // ── Priority 4 — Cross-supplier scale ─────────────────────────────
  {
    id: "DI-20",
    priority: "P4",
    tier: "Cross-supplier scale",
    area: "Navigation & IA",
    title: "Lift cross-supplier compare from 3 to 5 suppliers",
    problem: "Compare cap of 3 blocks portfolio-level review; Senior users want broader sweeps.",
    proposal: "Increase max selection to 5 with horizontal scroll and a sticky clause column.",
    evidence: "R2 friction: 'Compare suppliers max 3 — wanted 4.' Raised by Senior cohort.",
    impact: "High",
    effort: "Medium",
  },
];

export const R3_DO_NOT = [
  {
    title: "No new AI features this round",
    rationale:
      "R2 shows headroom is in transparency and micro-interactions, not new automation. Adding more model output before the audit/confidence loop is fully trusted will push trust scores back down.",
  },
  {
    title: "Do not redesign the trend strip",
    rationale:
      "It produced the single biggest success-rate lift (T3 +29pp). Only fix the tooltip clipping bug — leave the rest alone.",
  },
];

export const R3_SUCCESS_METRICS = [
  { metric: "Trust score", target: "≥ 4.2 / 5", baseline: "R1: 2.6 → R2: ~3.8" },
  { metric: "T2 (decide) success rate", target: "≥ 85%", baseline: "Measured per round" },
  { metric: "Excel-fallback rate (sceptical cohort)", target: "< 10%", baseline: "Tracks reverted-to-Excel quotes" },
  { metric: "First-visit discovery of 'Unexpected only' filter", target: "≥ 70% within 30s", baseline: "New metric for R3" },
];
