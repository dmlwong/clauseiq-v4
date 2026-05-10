// Round 2 usability study — measured against the improved prototype (v3).
// The v3 design shipped these changes derived from the round 1 backlog:
//   DI-01 Inline clause text diff         (TextDiff component)
//   DI-02 "Unexpected only" filter chip   (ContractResults filter)
//   DI-03 V1→Vn trend visualisation       (NegotiationTrendStrip)
//   DI-04 Supplier grouping provenance    (supplier-grouping.ts + tooltip)
//   DI-05 Soften Accept CTA               ("Mark as accepted" + undo)
//   DI-07 Audit trail for verdicts        (audit-trail.ts drawer)
//   DI-08 Persist version pair            (use-version-pair-memory)
//   DI-09 One-click CSV export            (csv-export.ts)
//   DI-10 Cross-supplier comparison       (CrossSupplierComparison)
//
// Numbers below are deterministic synthetic data: same 25 participant
// archetypes as round 1, re-tested. The lift modelled per task reflects
// which improvements address which task.

import {
  PARTICIPANTS as V2_PARTICIPANTS,
  TASKS,
  type Outcome,
  type Speed,
  type Participant,
  type DesignImprovement,
  taskSummary as v2TaskSummary,
  overallSnapshot as v2Overall,
  topIssues as v2TopIssues,
  behaviouralPatterns as v2Behav,
  decisionConfidence as v2Decision,
  byExperience as v2ByExp,
  DESIGN_IMPROVEMENTS,
} from "@/lib/usability-study-data";

// ---- Per-task uplift modelled from shipped improvements ----
// Probability of "rescuing" a non-Success outcome (Fail → Partial/Success,
// Partial → Success). Tuned per task based on which DI items hit it.
const TASK_LIFT: Record<number, { rescueFail: number; rescuePartial: number }> = {
  1: { rescueFail: 0.55, rescuePartial: 0.55 }, // diff + filter + colour disambiguation
  2: { rescueFail: 0.45, rescuePartial: 0.50 }, // softer accept + audit + confidence
  3: { rescueFail: 0.65, rescuePartial: 0.55 }, // trend strip + version-pair memory
  4: { rescueFail: 0.50, rescuePartial: 0.45 }, // cross-supplier comparison
  5: { rescueFail: 0.60, rescuePartial: 0.50 }, // grouping provenance tooltip
  6: { rescueFail: 0.40, rescuePartial: 0.45 }, // filter chip + export + softer CTA
};

// Per-task speed lift: probability of bumping speed one tier faster.
const SPEED_LIFT: Record<number, number> = {
  1: 0.45, 2: 0.30, 3: 0.55, 4: 0.40, 5: 0.35, 6: 0.45,
};

// Friction strings that round-2 participants raise *after* the fixes.
// Smaller, more specific, less existential than round 1.
const RESIDUAL_FRICTION = [
  "Diff colours indistinguishable in dark mode",
  "Trend strip tooltip cuts off on small screens",
  "Provenance tooltip needs a 'who edited' field",
  "Wanted to pin a clause across version switches",
  "Compare suppliers max 3 — wanted 4",
  "Audit drawer scroll resets on close",
  "Undo toast disappears too fast",
  "CSV export missing the audit column",
  "Filter chip hard to discover on first visit",
  "Confidence pill wording ('Medium') felt vague",
];

const RESCUED_FRICTION_REPLACEMENTS: Record<string, string> = {
  "Wanted side-by-side clause text diff": "Diff colours indistinguishable in dark mode",
  "Trend across V1→V4 not visualised": "Trend strip tooltip cuts off on small screens",
  "Supplier grouping origin unclear": "Provenance tooltip needs a 'who edited' field",
  "Accept button felt too final": "Undo toast disappears too fast",
  "Wanted to filter by 'unexpected only'": "Filter chip hard to discover on first visit",
  "Couldn't tell which version is 'current'": "Wanted to pin a clause across version switches",
  "No way to mark a request as 'follow-up'": "Audit drawer scroll resets on close",
  "Severity colour vs change colour confusion": "Diff colours indistinguishable in dark mode",
  "Toggle between flat and compare not obvious": "Filter chip hard to discover on first visit",
  "Version pill mistaken for a filter": "Wanted to pin a clause across version switches",
};

const QUOTES_V3: Record<Outcome, string[]> = {
  Success: [
    "The trend strip makes V1→V4 obvious — I don't need Excel anymore.",
    "Diff view is exactly what I was missing last time.",
    "I trust 'met' more now I can click into the audit.",
    "Compare suppliers in one screen — finally.",
    "Provenance tooltip answered my grouping question instantly.",
  ],
  Partial: [
    "Better, but I still want to mark a clause to revisit later.",
    "Filter chip is great once you spot it — took me a beat.",
    "I'd want the confidence pill explained inline, not on hover.",
    "Diff is helpful; some colour contrast is off in dark mode.",
  ],
  Fail: [
    "Got lost between the trend strip and the cross-supplier table.",
    "Audit drawer closed and I lost my place.",
    "Still exported to Excel out of habit, not need.",
  ],
};

// Deterministic pseudo-random per (participantId, taskId)
function seeded(a: number, b: number) {
  let s = (a * 73856093) ^ (b * 19349663);
  return () => {
    s = (s * 9301 + 49297) & 0x7fffffff;
    return (s % 100000) / 100000;
  };
}

function rescueOutcome(o: Outcome, taskId: number, r: () => number): Outcome {
  const lift = TASK_LIFT[taskId];
  if (o === "Success") return "Success";
  if (o === "Fail") {
    const x = r();
    if (x < lift.rescueFail * 0.6) return "Success";
    if (x < lift.rescueFail) return "Partial";
    return "Fail";
  }
  // Partial
  return r() < lift.rescuePartial ? "Success" : "Partial";
}

function liftSpeed(s: Speed, taskId: number, r: () => number): Speed {
  if (r() > SPEED_LIFT[taskId]) return s;
  if (s === "Slow") return "Moderate";
  if (s === "Moderate") return "Fast";
  return "Fast";
}

// Build round 2 participants by re-running each round 1 participant
// against the improved design.
export const PARTICIPANTS_V3: Participant[] = V2_PARTICIPANTS.map((p) => {
  const tasks = p.tasks.map((t) => {
    const r = seeded(p.id, t.taskId);
    const outcome = rescueOutcome(t.outcome, t.taskId, r);
    const speed = liftSpeed(t.speed, t.taskId, r);
    const friction =
      outcome === "Success"
        ? "—"
        : RESCUED_FRICTION_REPLACEMENTS[t.friction] ??
          RESIDUAL_FRICTION[Math.floor(r() * RESIDUAL_FRICTION.length)];
    const errors =
      outcome === "Success"
        ? "—"
        : outcome === "Partial"
          ? "Minor hesitation; recovered without help"
          : "Lost orientation, needed prompt";
    return { ...t, outcome, speed, friction, errors };
  });

  const outcomes = tasks.map((x) => x.outcome);
  const successCount = outcomes.filter((o) => o === "Success").length;

  // Re-score: ease/clarity rise with success; trust rises most due to audit + provenance.
  const lift = (base: number, delta: number) =>
    Math.max(1, Math.min(5, Math.round((base + delta) * 10) / 10));
  const successDelta = (successCount / 6 - 0.5) * 1.4; // +/- around mid

  const scores = {
    ease: lift(p.scores.ease, 0.6 + successDelta * 0.4),
    clarity: lift(p.scores.clarity, 0.7 + successDelta * 0.4),
    confidence: lift(p.scores.confidence, 0.9 + successDelta * 0.5),
    trust: lift(p.scores.trust, 1.0 + successDelta * 0.4),
  };

  const r = seeded(p.id, 99);
  const quotes = [
    QUOTES_V3[outcomes[0]][Math.floor(r() * QUOTES_V3[outcomes[0]].length)],
    QUOTES_V3[outcomes[2]][Math.floor(r() * QUOTES_V3[outcomes[2]].length)],
    QUOTES_V3[outcomes[5]][Math.floor(r() * QUOTES_V3[outcomes[5]].length)],
  ];

  const keyIssues: string[] = [];
  if (outcomes.filter((o) => o === "Fail").length >= 2) keyIssues.push("Still falls back to Excel under time pressure");
  if (tasks[2].outcome !== "Success") keyIssues.push("Trend strip discoverability");
  if (tasks[4].outcome !== "Success") keyIssues.push("Wants 'who edited' on grouping provenance");
  if (scores.trust < 4 && p.behaviour === "Sceptical / Excel-trained") keyIssues.push("Audit drawer needs more depth");

  return {
    ...p,
    tasks,
    scores,
    quotes,
    keyIssues: keyIssues.slice(0, 3),
  };
});

// ---------- Aggregations (mirror v2 helpers, parameterised) ----------

function _taskSummary(participants: Participant[]) {
  return TASKS.map((t) => {
    const results = participants.map((p) => p.tasks.find((x) => x.taskId === t.id)!);
    const success = results.filter((r) => r.outcome === "Success").length;
    const partial = results.filter((r) => r.outcome === "Partial").length;
    const fail = results.filter((r) => r.outcome === "Fail").length;
    const speedScore =
      results.reduce((acc, r) => acc + (r.speed === "Fast" ? 3 : r.speed === "Moderate" ? 2 : 1), 0) / results.length;
    const avgSpeed = speedScore > 2.4 ? "Fast" : speedScore > 1.6 ? "Moderate" : "Slow";
    const failFriction: Record<string, number> = {};
    results
      .filter((r) => r.outcome !== "Success")
      .forEach((r) => (failFriction[r.friction] = (failFriction[r.friction] || 0) + 1));
    const topFailures = Object.entries(failFriction)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([k]) => k);
    return {
      ...t,
      successRate: Math.round((success / participants.length) * 100),
      partialRate: Math.round((partial / participants.length) * 100),
      failRate: Math.round((fail / participants.length) * 100),
      avgSpeed,
      topFailures,
    };
  });
}

function _overall(participants: Participant[]) {
  const allTasks = participants.flatMap((p) => p.tasks);
  const successRate = Math.round((allTasks.filter((t) => t.outcome === "Success").length / allTasks.length) * 100);
  const avgScore = (k: keyof Participant["scores"]) =>
    Math.round((participants.reduce((a, p) => a + p.scores[k], 0) / participants.length) * 10) / 10;
  const ease = avgScore("ease");
  const clarity = avgScore("clarity");
  const confidence = avgScore("confidence");
  const trust = avgScore("trust");
  const avgUsability = Math.round(((ease + clarity + confidence + trust) / 4) * 10) / 10;
  const sus = Math.round(((ease + clarity + confidence + trust) / 20) * 100);
  const confidentPct = Math.round((participants.filter((p) => p.scores.confidence >= 4).length / participants.length) * 100);
  return { successRate, avgUsability, ease, clarity, confidence, trust, sus, confidentPct };
}

function _topIssues(participants: Participant[]) {
  const counts: Record<string, number> = {};
  participants.forEach((p) => p.keyIssues.forEach((i) => (counts[i] = (counts[i] || 0) + 1)));
  participants.forEach((p) =>
    p.tasks.forEach((t) => {
      if (t.outcome !== "Success" && t.friction !== "—") counts[t.friction] = (counts[t.friction] || 0) + 1;
    }),
  );
  const severityFor = (label: string): "Critical" | "Major" | "Minor" => {
    if (/Excel|provenance|audit|trust/i.test(label)) return "Major";
    if (/discover|tooltip|drawer|confidence|filter/i.test(label)) return "Minor";
    return "Minor";
  };
  return Object.entries(counts)
    .map(([label, n]) => ({
      label,
      affectedPct: Math.round((n / participants.length) * 100),
      severity: severityFor(label),
    }))
    .sort((a, b) => b.affectedPct - a.affectedPct)
    .slice(0, 8);
}

function _behavioural(participants: Participant[]) {
  const failedDetect = participants.filter((p) => p.tasks[0].outcome === "Fail").length;
  const misinterpreted = participants.filter((p) => p.tasks[2].outcome !== "Success").length;
  const distrust = participants.filter((p) => p.scores.trust <= 3).length;
  const excel = participants.filter((p) =>
    p.keyIssues.some((k) => /Excel/i.test(k)),
  ).length;
  const pct = (n: number) => Math.round((n / participants.length) * 100);
  return {
    failedDetect: pct(failedDetect),
    misinterpreted: pct(misinterpreted),
    distrust: pct(distrust),
    excel: pct(excel),
  };
}

function _decision(participants: Participant[]) {
  const t = participants.map((p) => p.tasks[1].outcome);
  const confident = t.filter((o) => o === "Success").length;
  const unsure = t.filter((o) => o === "Partial").length;
  const incorrect = t.filter((o) => o === "Fail").length;
  const pct = (n: number) => Math.round((n / participants.length) * 100);
  return { confident: pct(confident), unsure: pct(unsure), incorrect: pct(incorrect) };
}

function _byExp(participants: Participant[]) {
  const levels = ["Junior", "Mid", "Senior"] as const;
  return levels.map((lvl) => {
    const group = participants.filter((p) => p.level === lvl);
    const allTasks = group.flatMap((p) => p.tasks);
    const successRate = Math.round((allTasks.filter((t) => t.outcome === "Success").length / allTasks.length) * 100);
    const confidence = Math.round((group.reduce((a, p) => a + p.scores.confidence, 0) / group.length) * 10) / 10;
    const errorPattern =
      lvl === "Junior"
        ? "Now using filter chip; occasionally misses trend strip"
        : lvl === "Mid"
          ? "Confident with Accept + undo; light hesitation on follow-up state"
          : "Trusts grouping after provenance tooltip; still spot-checks audit";
    return { level: lvl, count: group.length, successRate, confidence, errorPattern };
  });
}

export const taskSummaryV3 = () => _taskSummary(PARTICIPANTS_V3);
export const overallSnapshotV3 = () => _overall(PARTICIPANTS_V3);
export const topIssuesV3 = () => _topIssues(PARTICIPANTS_V3);
export const behaviouralPatternsV3 = () => _behavioural(PARTICIPANTS_V3);
export const decisionConfidenceV3 = () => _decision(PARTICIPANTS_V3);
export const byExperienceV3 = () => _byExp(PARTICIPANTS_V3);

// Comparison helpers (round 1 → round 2)
export function comparison() {
  const v2 = v2Overall();
  const v3 = overallSnapshotV3();
  const delta = (a: number, b: number) => Math.round((b - a) * 10) / 10;
  return {
    v2,
    v3,
    deltas: {
      successRate: v3.successRate - v2.successRate,
      avgUsability: delta(v2.avgUsability, v3.avgUsability),
      sus: v3.sus - v2.sus,
      confidentPct: v3.confidentPct - v2.confidentPct,
      ease: delta(v2.ease, v3.ease),
      clarity: delta(v2.clarity, v3.clarity),
      confidence: delta(v2.confidence, v3.confidence),
      trust: delta(v2.trust, v3.trust),
    },
  };
}

export function taskComparison() {
  const a = v2TaskSummary();
  const b = taskSummaryV3();
  return TASKS.map((t, i) => ({
    id: t.id,
    name: t.name,
    v2: a[i].successRate,
    v3: b[i].successRate,
    delta: b[i].successRate - a[i].successRate,
    v2Speed: a[i].avgSpeed,
    v3Speed: b[i].avgSpeed,
  }));
}

export function behaviouralComparison() {
  const a = v2Behav();
  const b = behaviouralPatternsV3();
  return [
    { label: "Failed to detect a key change (T1)", v2: a.failedDetect, v3: b.failedDetect, goodWhen: "lower" as const },
    { label: "Misinterpreted version progression (T3)", v2: a.misinterpreted, v3: b.misinterpreted, goodWhen: "lower" as const },
    { label: "Distrusted system output (trust ≤ 3/5)", v2: a.distrust, v3: b.distrust, goodWhen: "lower" as const },
    { label: "Reverted to Excel mental model", v2: a.excel, v3: b.excel, goodWhen: "lower" as const },
  ];
}

export function decisionComparison() {
  return { v2: v2Decision(), v3: decisionConfidenceV3() };
}

export function experienceComparison() {
  const a = v2ByExp();
  const b = byExperienceV3();
  return a.map((row, i) => ({
    level: row.level,
    count: row.count,
    v2Success: row.successRate,
    v3Success: b[i].successRate,
    v2Confidence: row.confidence,
    v3Confidence: b[i].confidence,
    pattern: b[i].errorPattern,
  }));
}

// Map shipped fixes → measured impact, by linking each DI to its primary task(s).
export interface ShippedFixImpact {
  id: string;
  title: string;
  area: string;
  priority: string;
  v2Success: number;
  v3Success: number;
  delta: number;
  residualIssue?: string;
}

const SHIPPED_IDS = ["DI-01", "DI-02", "DI-03", "DI-04", "DI-05", "DI-07", "DI-08", "DI-09", "DI-10"];

export function shippedFixImpact(): ShippedFixImpact[] {
  const t2 = v2TaskSummary();
  const t3 = taskSummaryV3();
  const v3issues = topIssuesV3();
  return DESIGN_IMPROVEMENTS.filter((d) => SHIPPED_IDS.includes(d.id)).map((d: DesignImprovement) => {
    const task = d.linkedTasks[0];
    const v2s = t2.find((x) => x.id === task)!.successRate;
    const v3s = t3.find((x) => x.id === task)!.successRate;
    const residual = v3issues.find((i) => new RegExp(d.area.split(" ")[0], "i").test(i.label))?.label;
    return {
      id: d.id,
      title: d.title,
      area: d.area,
      priority: d.priority,
      v2Success: v2s,
      v3Success: v3s,
      delta: v3s - v2s,
      residualIssue: residual,
    };
  });
}

export const NEW_RECOMMENDATIONS = [
  {
    id: "DI-13",
    area: "Change detection",
    title: "Improve diff colour contrast in dark mode",
    problem: "Round 2 participants flagged diff red/green is hard to read on dark backgrounds.",
    proposal: "Use AA-compliant token pair (success-strong / destructive-strong) plus underline for additions.",
    affectedPct: 28,
    priority: "P2" as const,
  },
  {
    id: "DI-14",
    area: "Navigation & IA",
    title: "Make 'Unexpected only' filter chip more discoverable",
    problem: "Once spotted it works; first-time users overlook the chip on the compare view.",
    proposal: "Auto-toggle when unexpected count > 0 with a dismissible tooltip on first visit.",
    affectedPct: 24,
    priority: "P2" as const,
  },
  {
    id: "DI-15",
    area: "Trust & transparency",
    title: "Expand audit drawer with playbook rule history",
    problem: "Sceptical users want to see prior versions of the rule, not just the current one.",
    proposal: "Add a 'rule history' tab inside the audit drawer with diff between rule versions.",
    affectedPct: 20,
    priority: "P1" as const,
  },
  {
    id: "DI-16",
    area: "Decision support",
    title: "'Pin clause' across version switches",
    problem: "Users lose their place when changing the active version pair.",
    proposal: "Pin button on each row that keeps it scrolled-into-view across version pair changes.",
    affectedPct: 16,
    priority: "P2" as const,
  },
];

export const HEADLINE_FINDING =
  "Round 2 confirms the v3 design closes the largest gaps from round 1. Task success, decision confidence and trust all rose materially; remaining issues are smaller, more specific polish items rather than blocking workflow problems.";
