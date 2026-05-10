// Simple word-level diff for clause excerpts (TASK-06).
// Returns segments tagged equal/added/removed so the UI can render an
// accessible inline diff (label + icon + colour, never colour alone).
export type DiffSegment = { type: "equal" | "added" | "removed"; text: string };

function tokenize(s: string): string[] {
  return s.split(/(\s+)/);
}

/** LCS-based token diff (O(n*m), fine for clause-length excerpts). */
export function diffWords(a: string, b: string): DiffSegment[] {
  const A = tokenize(a ?? "");
  const B = tokenize(b ?? "");
  const n = A.length, m = B.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: DiffSegment[] = [];
  let i = 0, j = 0;
  const push = (t: DiffSegment["type"], text: string) => {
    const last = out[out.length - 1];
    if (last && last.type === t) last.text += text;
    else out.push({ type: t, text });
  };
  while (i < n && j < m) {
    if (A[i] === B[j]) { push("equal", A[i]); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { push("removed", A[i]); i++; }
    else { push("added", B[j]); j++; }
  }
  while (i < n) { push("removed", A[i]); i++; }
  while (j < m) { push("added", B[j]); j++; }
  return out;
}
