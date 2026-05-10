// Simulated UX study results for ClauseIQ prototype v2.
// Behaviour-first synthetic data — not all participants succeed.

export type Outcome = "Success" | "Partial" | "Fail";
export type Speed = "Fast" | "Moderate" | "Slow";
export type Level = "Junior" | "Mid" | "Senior";
export type Behaviour = "Fast & outcome-driven" | "Cautious & detail-driven" | "Pragmatic" | "Sceptical / Excel-trained";

export interface TaskResult {
  taskId: 1 | 2 | 3 | 4 | 5 | 6;
  outcome: Outcome;
  speed: Speed;
  steps: string;
  errors: string;
  friction: string;
}

export interface Participant {
  id: number;
  name: string;
  role: string;
  level: Level;
  yearsExp: number;
  behaviour: Behaviour;
  tasks: TaskResult[];
  quotes: string[];
  scores: { ease: number; clarity: number; confidence: number; trust: number };
  keyIssues: string[];
}

export const TASKS = [
  { id: 1, name: "Identify what changed V1→V2" },
  { id: 2, name: "Decide whether to continue negotiating" },
  { id: 3, name: "Track progress V1→V4" },
  { id: 4, name: "Compare suppliers in initiative" },
  { id: 5, name: "Validate supplier grouping" },
  { id: 6, name: "Act under time pressure" },
] as const;

const FIRST = ["Sarah","Marcus","Priya","James","Aisha","Tom","Rachel","David","Liam","Yuki","Nadia","Omar","Hannah","Ben","Chloé","Mateo","Ines","Felix","Zoe","Arjun","Lena","Pierre","Sofia","Noah","Maya"];
const LAST = ["Chen","Lee","Patel","O'Brien","Rahman","Becker","Klein","Walsh","Davies","Tanaka","Haddad","Khan","Müller","Owen","Laurent","García","Romano","Schmidt","Iverson","Singh","Larsen","Dubois","Ferrari","Wright","Cohen"];

const BEHAVIOURS: Behaviour[] = ["Fast & outcome-driven","Cautious & detail-driven","Pragmatic","Sceptical / Excel-trained"];

const ROLES_BY_LEVEL: Record<Level,string[]> = {
  Junior: ["Procurement Analyst","Junior Consultant","Sourcing Analyst"],
  Mid: ["Procurement Consultant","Category Specialist","Contracts Manager"],
  Senior: ["Senior Procurement Consultant","Principal Consultant","Head of Sourcing"],
};

// Deterministic pseudo-random
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const LEVELS: Level[] = ["Junior","Junior","Junior","Junior","Junior","Junior","Junior","Junior",
  "Mid","Mid","Mid","Mid","Mid","Mid","Mid","Mid","Mid",
  "Senior","Senior","Senior","Senior","Senior","Senior","Senior","Senior"];

const QUOTES_BANK: Record<Outcome,string[]> = {
  Success: [
    "Okay, the banner tells me 4 of 5 changes were met — that's exactly what I needed.",
    "I like that I can jump to the unexpected ones directly.",
    "This would've taken me an hour in Excel.",
    "Right, accept it and move on.",
  ],
  Partial: [
    "I think this is what changed but… let me double-check the clauses table.",
    "Met vs not met — but met by how much? I'd want a diff.",
    "I'm not 100% sure this counts as 'unexpected', the wording shifted.",
    "Is the supplier grouping definitely correct? I'd verify in the source.",
  ],
  Fail: [
    "Where do I see V1 vs V2 side by side? I keep landing on a flat list.",
    "I've lost track of which version I'm on.",
    "I don't trust this number — let me export it.",
    "Honestly I'd just open the Excel.",
  ],
};

const FRICTION_BANK = [
  "Toggle between flat and compare not obvious",
  "Version pill mistaken for a filter",
  "Wanted side-by-side clause text diff",
  "Severity colour vs change colour confusion",
  "No way to mark a request as 'follow-up'",
  "Couldn't tell which version is 'current'",
  "Supplier grouping origin unclear",
  "Accept button felt too final",
  "Wanted to filter by 'unexpected only'",
  "Trend across V1→V4 not visualised",
];

function pickOutcome(level: Level, behaviour: Behaviour, taskId: number, r: () => number): Outcome {
  // Base success by task (some tasks much harder)
  const base: Record<number, number> = { 1: 0.78, 2: 0.55, 3: 0.42, 4: 0.5, 5: 0.62, 6: 0.48 };
  let p = base[taskId];
  if (level === "Senior") p += 0.1;
  if (level === "Junior") p -= 0.12;
  if (behaviour === "Sceptical / Excel-trained") p -= 0.15;
  if (behaviour === "Fast & outcome-driven") p += 0.05;
  const x = r();
  if (x < p) return "Success";
  if (x < p + 0.25) return "Partial";
  return "Fail";
}

function pickSpeed(behaviour: Behaviour, r: () => number): Speed {
  if (behaviour === "Fast & outcome-driven") return r() < 0.7 ? "Fast" : "Moderate";
  if (behaviour === "Cautious & detail-driven") return r() < 0.6 ? "Slow" : "Moderate";
  return r() < 0.5 ? "Moderate" : r() < 0.75 ? "Fast" : "Slow";
}

function score(level: Level, behaviour: Behaviour, outcomes: Outcome[]): { ease: number; clarity: number; confidence: number; trust: number } {
  const successRate = outcomes.filter((o) => o === "Success").length / outcomes.length;
  const base = 2 + successRate * 2.5;
  const adj = (n: number) => Math.max(1, Math.min(5, Math.round(n * 10) / 10));
  const sceptic = behaviour === "Sceptical / Excel-trained" ? -0.6 : 0;
  const senior = level === "Senior" ? -0.1 : 0;
  return {
    ease: adj(base + 0.3 + senior),
    clarity: adj(base - 0.1 + sceptic),
    confidence: adj(base - 0.2 + sceptic + senior),
    trust: adj(base - 0.4 + sceptic),
  };
}

const STEP_TEMPLATES: Record<number, string[]> = {
  1: [
    "Opened V2 results → noticed verdict banner → clicked 'Not met' counter → reviewed 2 open clauses.",
    "Landed on flat results → toggled compare → scrolled clause table → spotted change badges.",
    "Saw banner but ignored it → opened each clause expecting a diff view.",
  ],
  2: [
    "Read banner subline → clicked Request changes → confirmed.",
    "Hovered Accept then hesitated → reopened 'Not met' bucket → chose Request changes.",
    "Skimmed counters → clicked Accept without opening unexpected bucket.",
  ],
  3: [
    "Switched version selector V1→V4 in pairs → tried to find a trend chart → didn't.",
    "Compared V3 vs V4 only → assumed earlier history irrelevant.",
    "Opened each version one-by-one in new tabs (Excel reflex).",
  ],
  4: [
    "Went back to initiative → scanned supplier cards → opened two suppliers in turn.",
    "Tried to add suppliers to a comparison view → none available → exported mentally.",
    "Compared overall scores only, didn't drill into clauses.",
  ],
  5: [
    "Checked supplier name + contract count → trusted grouping.",
    "Asked 'how does it know these belong together?' → no provenance shown.",
    "Looked for an explanation tooltip on supplier header → not found.",
  ],
  6: [
    "Used banner counters as triage → actioned highest severity first.",
    "Opened every clause → ran out of time mid-table.",
    "Scrolled to high-severity rows → mass-requested changes.",
  ],
};

export const PARTICIPANTS: Participant[] = LEVELS.map((level, i) => {
  const r = rng(i + 1);
  const behaviour = BEHAVIOURS[Math.floor(r() * BEHAVIOURS.length)];
  const yearsExp = level === "Junior" ? 1 + Math.floor(r() * 3) : level === "Mid" ? 4 + Math.floor(r() * 4) : 8 + Math.floor(r() * 12);
  const role = ROLES_BY_LEVEL[level][Math.floor(r() * ROLES_BY_LEVEL[level].length)];
  const tasks: TaskResult[] = TASKS.map((t) => {
    const outcome = pickOutcome(level, behaviour, t.id, r);
    return {
      taskId: t.id as 1,
      outcome,
      speed: pickSpeed(behaviour, r),
      steps: STEP_TEMPLATES[t.id][Math.floor(r() * STEP_TEMPLATES[t.id].length)],
      errors:
        outcome === "Fail"
          ? "Mis-identified counter, missed unexpected bucket"
          : outcome === "Partial"
            ? "Hesitated; needed second pass"
            : "—",
      friction: FRICTION_BANK[Math.floor(r() * FRICTION_BANK.length)],
    };
  });
  const outcomes = tasks.map((t) => t.outcome);
  const quotes = [
    QUOTES_BANK[outcomes[0]][Math.floor(r() * 4)],
    QUOTES_BANK[outcomes[2]][Math.floor(r() * 4)],
    QUOTES_BANK[outcomes[5]][Math.floor(r() * 4)],
  ];
  const issues: string[] = [];
  if (outcomes.filter((o) => o === "Fail").length >= 2) issues.push("Reverts to Excel mental model");
  if (tasks[2].outcome !== "Success") issues.push("No multi-version trend view");
  if (tasks[4].outcome !== "Success") issues.push("Supplier grouping provenance unclear");
  if (tasks[0].outcome === "Partial") issues.push("Wants line-level diff for clause text");
  if (tasks[1].outcome === "Fail") issues.push("Accept CTA feels irreversible");
  return {
    id: i + 1,
    name: `${FIRST[i]} ${LAST[i]}`,
    role,
    level,
    yearsExp,
    behaviour,
    tasks,
    quotes,
    scores: score(level, behaviour, outcomes),
    keyIssues: issues.slice(0, 3),
  };
});

// ---------- Aggregations ----------

export function taskSummary() {
  return TASKS.map((t) => {
    const results = PARTICIPANTS.map((p) => p.tasks.find((x) => x.taskId === t.id)!);
    const success = results.filter((r) => r.outcome === "Success").length;
    const partial = results.filter((r) => r.outcome === "Partial").length;
    const fail = results.filter((r) => r.outcome === "Fail").length;
    const speedScore = results.reduce((acc, r) => acc + (r.speed === "Fast" ? 3 : r.speed === "Moderate" ? 2 : 1), 0) / results.length;
    const avgSpeed = speedScore > 2.4 ? "Fast" : speedScore > 1.6 ? "Moderate" : "Slow";
    // top failure reasons by friction frequency on non-Success
    const failFriction: Record<string, number> = {};
    results.filter((r) => r.outcome !== "Success").forEach((r) => (failFriction[r.friction] = (failFriction[r.friction] || 0) + 1));
    const topFailures = Object.entries(failFriction).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k);
    return {
      ...t,
      successRate: Math.round((success / PARTICIPANTS.length) * 100),
      partialRate: Math.round((partial / PARTICIPANTS.length) * 100),
      failRate: Math.round((fail / PARTICIPANTS.length) * 100),
      avgSpeed,
      topFailures,
    };
  });
}

export function overallSnapshot() {
  const allTasks = PARTICIPANTS.flatMap((p) => p.tasks);
  const successRate = Math.round((allTasks.filter((t) => t.outcome === "Success").length / allTasks.length) * 100);
  const avgScore = (k: keyof Participant["scores"]) =>
    Math.round((PARTICIPANTS.reduce((a, p) => a + p.scores[k], 0) / PARTICIPANTS.length) * 10) / 10;
  const ease = avgScore("ease");
  const clarity = avgScore("clarity");
  const confidence = avgScore("confidence");
  const trust = avgScore("trust");
  const avgUsability = Math.round(((ease + clarity + confidence + trust) / 4) * 10) / 10;
  // SUS-like proxy
  const sus = Math.round(((ease + clarity + confidence + trust) / 20) * 100);
  const confidentPct = Math.round((PARTICIPANTS.filter((p) => p.scores.confidence >= 4).length / PARTICIPANTS.length) * 100);
  return { successRate, avgUsability, ease, clarity, confidence, trust, sus, confidentPct };
}

export function topIssues() {
  const counts: Record<string, number> = {};
  PARTICIPANTS.forEach((p) => p.keyIssues.forEach((i) => (counts[i] = (counts[i] || 0) + 1)));
  // include task-level frictions
  PARTICIPANTS.forEach((p) => p.tasks.forEach((t) => { if (t.outcome !== "Success") counts[t.friction] = (counts[t.friction] || 0) + 1; }));
  const severityFor = (label: string): "Critical" | "Major" | "Minor" => {
    if (/Excel|provenance|diff|trend/i.test(label)) return "Critical";
    if (/version|filter|toggle|grouping|Accept/i.test(label)) return "Major";
    return "Minor";
  };
  return Object.entries(counts)
    .map(([label, n]) => ({
      label,
      affectedPct: Math.round((n / PARTICIPANTS.length) * 100),
      severity: severityFor(label),
    }))
    .sort((a, b) => b.affectedPct - a.affectedPct)
    .slice(0, 8);
}

export function behaviouralPatterns() {
  const failedDetect = PARTICIPANTS.filter((p) => p.tasks[0].outcome === "Fail").length;
  const misinterpreted = PARTICIPANTS.filter((p) => p.tasks[2].outcome !== "Success").length;
  const distrust = PARTICIPANTS.filter((p) => p.scores.trust <= 3).length;
  const excel = PARTICIPANTS.filter((p) => p.behaviour === "Sceptical / Excel-trained" || p.keyIssues.includes("Reverts to Excel mental model")).length;
  const pct = (n: number) => Math.round((n / PARTICIPANTS.length) * 100);
  return {
    failedDetect: pct(failedDetect),
    misinterpreted: pct(misinterpreted),
    distrust: pct(distrust),
    excel: pct(excel),
  };
}

export function decisionConfidence() {
  // Use Task 2 (decide) as proxy
  const t = PARTICIPANTS.map((p) => p.tasks[1].outcome);
  const confident = t.filter((o) => o === "Success").length;
  const unsure = t.filter((o) => o === "Partial").length;
  const incorrect = t.filter((o) => o === "Fail").length;
  const pct = (n: number) => Math.round((n / PARTICIPANTS.length) * 100);
  return { confident: pct(confident), unsure: pct(unsure), incorrect: pct(incorrect) };
}

export function byExperience() {
  const levels: Level[] = ["Junior", "Mid", "Senior"];
  return levels.map((lvl) => {
    const group = PARTICIPANTS.filter((p) => p.level === lvl);
    const allTasks = group.flatMap((p) => p.tasks);
    const successRate = Math.round((allTasks.filter((t) => t.outcome === "Success").length / allTasks.length) * 100);
    const confidence = Math.round((group.reduce((a, p) => a + p.scores.confidence, 0) / group.length) * 10) / 10;
    const errorPattern =
      lvl === "Junior"
        ? "Misses unexpected bucket; over-trusts banner"
        : lvl === "Mid"
          ? "Hesitates between Accept and Request changes"
          : "Distrusts auto-grouping; verifies in Excel";
    return { level: lvl, count: group.length, successRate, confidence, errorPattern };
  });
}

export const DESIGN_RECS = {
  quickWins: [
    { title: "Add 'Why this is grouped' tooltip on supplier header", impact: "High", effort: "Low" },
    { title: "Surface 'Unexpected only' filter chip on compare tab", impact: "High", effort: "Low" },
    { title: "Soften Accept CTA with 'Accept (you can undo)' helper", impact: "Medium", effort: "Low" },
    { title: "Persist active version pair across navigation", impact: "Medium", effort: "Low" },
  ],
  strategic: [
    { title: "Inline clause-level text diff (red/green)", impact: "High", effort: "High" },
    { title: "V1→Vn trend visualisation for severity & open requests", impact: "High", effort: "High" },
    { title: "Cross-supplier comparison view inside initiative", impact: "High", effort: "Medium" },
    { title: "Audit trail explaining how 'met / not met' was decided", impact: "High", effort: "Medium" },
  ],
  trust: [
    { title: "Show data lineage badge per supplier (auto vs. manual)", impact: "High", effort: "Medium" },
    { title: "Confidence indicator next to AI-derived verdicts", impact: "Medium", effort: "Medium" },
    { title: "One-click 'Export to Excel' to satisfy verification reflex", impact: "Medium", effort: "Low" },
  ],
};

export type ImprovementArea =
  | "Change detection"
  | "Version comparison"
  | "Decision support"
  | "Trust & transparency"
  | "Supplier grouping"
  | "Navigation & IA"
  | "Workflow speed";

export interface DesignImprovement {
  id: string;
  area: ImprovementArea;
  title: string;
  problem: string;
  proposal: string;
  evidence: string;
  affectedPct: number;
  impact: "High" | "Medium" | "Low";
  effort: "Low" | "Medium" | "High";
  priority: "P0" | "P1" | "P2";
  linkedTasks: number[];
}

export const DESIGN_IMPROVEMENTS: DesignImprovement[] = [
  {
    id: "DI-01",
    area: "Change detection",
    title: "Inline clause-level text diff (red/green)",
    problem: "Users can see what was flagged but not what literally changed in the clause text.",
    proposal: "Add an expandable diff view per clause showing V(n-1) vs V(n) text with red/green highlights.",
    evidence: "60% of participants asked for a side-by-side text diff; Excel-trained users exported to verify wording.",
    affectedPct: 72,
    impact: "High",
    effort: "High",
    priority: "P0",
    linkedTasks: [1, 3],
  },
  {
    id: "DI-02",
    area: "Decision support",
    title: "Surface 'Unexpected changes only' filter on compare view",
    problem: "Unexpected changes are buried; users scroll the full table to find them.",
    proposal: "Add a sticky filter chip 'Unexpected only' on the compare toggle, default-on when count > 0.",
    evidence: "Mid/Senior participants explicitly asked to filter by unexpected; 5 missed an unexpected change entirely.",
    affectedPct: 64,
    impact: "High",
    effort: "Low",
    priority: "P0",
    linkedTasks: [1, 6],
  },
  {
    id: "DI-03",
    area: "Version comparison",
    title: "V1→Vn trend visualisation",
    problem: "Reviewing more than two versions forces tab-hopping; trend across iterations is invisible.",
    proposal: "Sparkline strip above the results showing severity counts and open requests across all versions.",
    evidence: "Task 3 success rate was the lowest (42%); 9 participants opened versions in separate tabs.",
    affectedPct: 58,
    impact: "High",
    effort: "High",
    priority: "P1",
    linkedTasks: [3],
  },
  {
    id: "DI-04",
    area: "Supplier grouping",
    title: "'Why this is grouped' provenance tooltip",
    problem: "Auto-grouped suppliers feel opaque — users can't tell why contracts belong together.",
    proposal: "Tooltip on supplier header showing match basis (name, VAT, manual override) and last edit.",
    evidence: "38% of participants questioned grouping; Sceptical users refused to trust without provenance.",
    affectedPct: 52,
    impact: "High",
    effort: "Low",
    priority: "P0",
    linkedTasks: [5],
  },
  {
    id: "DI-05",
    area: "Decision support",
    title: "Soften 'Accept' CTA with reversibility helper",
    problem: "Accept feels final — Mid users hover and hesitate, breaking decision flow.",
    proposal: "Rename to 'Mark as accepted' with helper 'You can reopen this anytime' and show undo toast.",
    evidence: "Task 2 had 31% Partial outcomes; 'Accept feels irreversible' raised by 7 participants.",
    affectedPct: 44,
    impact: "Medium",
    effort: "Low",
    priority: "P1",
    linkedTasks: [2],
  },
  {
    id: "DI-06",
    area: "Trust & transparency",
    title: "Confidence indicator on AI-derived verdicts",
    problem: "'Met / Not met' is presented as fact with no signal of model certainty.",
    proposal: "Small confidence pill (High / Medium / Low) next to each verdict with reasoning on hover.",
    evidence: "Trust averaged 2.6/5; Sceptical users re-checked every verdict in the source contract.",
    affectedPct: 48,
    impact: "High",
    effort: "Medium",
    priority: "P1",
    linkedTasks: [1, 2, 6],
  },
  {
    id: "DI-07",
    area: "Trust & transparency",
    title: "Audit trail for 'met / not met' decisions",
    problem: "No explanation of which clause text or playbook rule drove the verdict.",
    proposal: "'Why this verdict?' drawer listing playbook rule, matched clause excerpt, and rule version.",
    evidence: "Sceptical/Excel-trained cohort (28%) cited absence of reasoning as blocker to acceptance.",
    affectedPct: 40,
    impact: "High",
    effort: "Medium",
    priority: "P1",
    linkedTasks: [2, 5],
  },
  {
    id: "DI-08",
    area: "Navigation & IA",
    title: "Persist active version pair across navigation",
    problem: "Switching to another supplier resets V2↔V3 selection, costing time on return.",
    proposal: "Remember last-viewed version pair per contract for the session.",
    evidence: "Observed re-selection in 11 sessions; cited as 'small but constant friction'.",
    affectedPct: 36,
    impact: "Medium",
    effort: "Low",
    priority: "P2",
    linkedTasks: [3, 4],
  },
  {
    id: "DI-09",
    area: "Workflow speed",
    title: "One-click 'Export to Excel' on results",
    problem: "Excel-trained users export anyway; lack of a button forces copy-paste workarounds.",
    proposal: "Export button on results header producing a structured workbook (clauses, verdicts, deltas).",
    evidence: "All 7 Excel-trained participants exported manually; quoted 'I'd just open the Excel'.",
    affectedPct: 32,
    impact: "Medium",
    effort: "Low",
    priority: "P2",
    linkedTasks: [2, 4, 6],
  },
  {
    id: "DI-10",
    area: "Navigation & IA",
    title: "Cross-supplier comparison inside initiative",
    problem: "Comparing suppliers requires opening each in turn; no shared view.",
    proposal: "Multi-select suppliers and render a side-by-side comparison of key clauses and scores.",
    evidence: "Task 4 success was 50%; users wanted a 'compare suppliers' action on the initiative page.",
    affectedPct: 50,
    impact: "High",
    effort: "Medium",
    priority: "P1",
    linkedTasks: [4],
  },
  {
    id: "DI-11",
    area: "Change detection",
    title: "Disambiguate severity colour vs change colour",
    problem: "Red is used for both 'high severity' and 'changed clause' — users conflate the two.",
    proposal: "Use colour for severity only; mark changes with an icon + neutral background tint.",
    evidence: "12 participants misread a low-severity change as a high-risk issue.",
    affectedPct: 48,
    impact: "Medium",
    effort: "Medium",
    priority: "P1",
    linkedTasks: [1, 6],
  },
  {
    id: "DI-12",
    area: "Decision support",
    title: "'Follow-up' state for partially addressed requests",
    problem: "Requests are binary (met / not met); reality includes 'partially addressed, needs another round'.",
    proposal: "Add a 'Follow-up' state with optional note attached to next supplier brief.",
    evidence: "Mid users repeatedly asked 'how do I park this for V3?'; 6 wrote it as a manual note.",
    affectedPct: 36,
    impact: "Medium",
    effort: "Medium",
    priority: "P2",
    linkedTasks: [2, 3],
  },
];

export const STAKEHOLDER_INSIGHTS = [
  { theme: "Clause-level vs scoring", insight: "Seniors want clause-level evidence; juniors lean on scores. Both must be one click apart." },
  { theme: "Trend vs latest", insight: "Mid/Senior users repeatedly asked for V1→Vn trends; latest-only view loses negotiation history." },
  { theme: "Risks of automation", insight: "Sceptical users distrust auto-grouping and 'met' classification — surface provenance to retain trust." },
];
