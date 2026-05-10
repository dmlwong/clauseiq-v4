// Structured verification export (TASK-11).
import type { ContractVersion } from "./workflow-types";
import type { ClauseDecisionState } from "@/hooks/use-clause-decisions";
import { CLAUSE_FRAMEWORK } from "./clauses-framework";
import { classifyChange, materialChangeLabel } from "./material-change";
import { getClauseAudit } from "./audit-trail";

function csvEscape(v: string | number | undefined | null): string {
  if (v === null || v === undefined) return "";
  const s = String(v).replace(/"/g, '""');
  return /[",\n]/.test(s) ? `"${s}"` : s;
}

export function exportContractCsv(
  meta: { initiativeName: string; supplierName: string; contractName: string; leftLabel: string; rightLabel: string },
  versions: ContractVersion[],
  stateOf: (id: string) => ClauseDecisionState,
): string {
  const left = versions.find((v) => v.version === meta.leftLabel);
  const right = versions.find((v) => v.version === meta.rightLabel);
  const rows: string[] = [];
  rows.push([
    "Initiative", "Supplier", "Contract", "Version pair", "Exported at",
    "Clause ID", "Clause", "Category",
    "Severity " + meta.leftLabel, "Severity " + meta.rightLabel,
    "Summary " + meta.leftLabel, "Summary " + meta.rightLabel,
    "Change verdict", "Round decision", "Closure", "Requested change", "Rationale",
    // DI-19: full audit columns so Excel-trained reviewers can verify without a second lookup.
    "Rule ID", "Rule name", "Rule version", "Rule expectation",
    "AI confidence", "AI confidence band", "Verdict reasoning", "Matched excerpt", "Clause location", "Evidence link",
  ].map(csvEscape).join(","));

  const stamp = new Date().toISOString();
  for (const def of CLAUSE_FRAMEWORK) {
    const prev = left?.clauses.find((c) => c.id === def.id);
    const curr = right?.clauses.find((c) => c.id === def.id);
    const s = stateOf(def.id);
    const audit = getClauseAudit(def.id);
    const lastReq = Object.entries(s.requests).sort((a, b) => b[0].localeCompare(a[0]))[0]?.[1];
    const confBand =
      audit.confidence >= 0.85 ? "High (85–100%)" :
      audit.confidence >= 0.65 ? "Medium (65–84%)" : "Low (0–64%) — review";
    rows.push([
      meta.initiativeName, meta.supplierName, meta.contractName,
      `${meta.leftLabel} → ${meta.rightLabel}`, stamp,
      def.id.toUpperCase(), def.title, def.category,
      prev?.severity ?? "", curr?.severity ?? "",
      prev?.deviation ?? "", curr?.deviation ?? "",
      materialChangeLabel(classifyChange(prev, curr)),
      s.roundDecisions[meta.rightLabel] ?? "",
      s.closures[meta.rightLabel] ?? "",
      lastReq?.requestedChange ?? "",
      lastReq?.rationale ?? "",
      audit.ruleId, audit.ruleName, audit.ruleVersion, audit.expectation,
      (audit.confidence * 100).toFixed(0) + "%", confBand,
      audit.rationale,
      audit.matchedExcerpt ?? "",
      audit.location ?? "",
      audit.evidenceUrl ?? "",
    ].map(csvEscape).join(","));
  }
  return rows.join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
