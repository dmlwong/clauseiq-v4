import type { ClauseResult } from "./workflow-types";

/**
 * Material-change classification used to power the v1 → v2 comparison dashboard.
 *
 * Rule of thumb: the comparison is driven by the *summary* of each clause (the
 * `deviation` field, which is what ClauseIQ surfaces as the "Summary"), with
 * a secondary check on severity / resolved flag. Pure wording-only edits to
 * the excerpt are NOT considered material — only meaningful changes to the
 * summary or risk classification are.
 */
export type MaterialChangeKind =
  | "material" // summary or severity moved meaningfully
  | "no-material" // text might differ but summary is effectively the same
  | "missing"; // clause not present in one of the two versions

function normalise(s: string | undefined): string {
  return (s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Cheap token-overlap similarity (Jaccard) on the normalised summary text.
 * Returns 1.0 for identical, 0.0 for fully disjoint.
 */
function similarity(a: string, b: string): number {
  if (a === b) return 1;
  const A = new Set(a.split(" ").filter(Boolean));
  const B = new Set(b.split(" ").filter(Boolean));
  if (A.size === 0 && B.size === 0) return 1;
  let inter = 0;
  A.forEach((t) => B.has(t) && inter++);
  const union = A.size + B.size - inter;
  return union === 0 ? 1 : inter / union;
}

const MATERIAL_THRESHOLD = 0.75; // below this = material change

export function classifyChange(
  prev: ClauseResult | undefined,
  curr: ClauseResult | undefined,
): MaterialChangeKind {
  if (!prev || !curr) return "missing";
  if (prev.severity !== curr.severity) return "material";
  if (prev.resolved !== curr.resolved) return "material";
  const sim = similarity(normalise(prev.deviation), normalise(curr.deviation));
  if (sim < MATERIAL_THRESHOLD) return "material";
  return "no-material";
}

/**
 * Change-state visuals (TASK-01 / DI-11).
 *
 * Severity keeps the high/medium/low colour palette. Change state must NOT
 * reuse those colours — instead it relies on a neutral slate tint plus a
 * dedicated icon and label so a "changed low-risk clause" cannot be
 * misread as a high-severity issue.
 */
export function materialChangeTone(kind: MaterialChangeKind): string {
  switch (kind) {
    case "material":
      return "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600";
    case "no-material":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-muted/50 text-muted-foreground border-dashed border-border";
  }
}

export function materialChangeLabel(kind: MaterialChangeKind): string {
  switch (kind) {
    case "material":
      return "Changed";
    case "no-material":
      return "Unchanged";
    default:
      return "Not present";
  }
}

/** Icon name from lucide-react that pairs with the change state. */
export function materialChangeIcon(kind: MaterialChangeKind): "git-branch" | "minus" | "circle-dashed" {
  if (kind === "material") return "git-branch";
  if (kind === "no-material") return "minus";
  return "circle-dashed";
}
