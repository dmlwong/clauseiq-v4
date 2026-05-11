import { useMemo } from "react";
import { CLAUSE_FRAMEWORK } from "@/lib/clauses-framework";
import type { ContractVersion } from "@/lib/workflow-types";
import type { ClauseDecisionState } from "@/hooks/use-clause-decisions";
import { determineChangePill } from "@/lib/change-tracking";

interface Props {
  versions: ContractVersion[];
  allDecisions: Record<string, ClauseDecisionState>;
  activeVersion?: string;
  onJump?: (version: string) => void;
}

/**
 * V1 → Vn negotiation trend strip (TASK-07 / DI-03).
 * Shows severity counts and open requests for every uploaded round so the
 * user can see whether negotiation is actually progressing.
 */
export function NegotiationTrendStrip({ versions, allDecisions, activeVersion, onJump }: Props) {
  const points = useMemo(() => {
    return versions.map((v, idx) => {
      const high = v.clauses.filter((c) => c.severity === "high" && !c.resolved).length;
      const medium = v.clauses.filter((c) => c.severity === "medium" && !c.resolved).length;
      let openRequests = 0;
      for (const id of Object.keys(allDecisions)) {
        const s = allDecisions[id];
        const wasReq = Object.entries(s.roundDecisions).some(
          ([vv, d]) => d === "request-update" && versions.findIndex((x) => x.version === vv) <= idx,
        );
        if (!wasReq) continue;
        const closed = s.closures[v.version] === "closed";
        if (!closed) openRequests++;
      }
      let supplierChanges = 0;
      if (idx > 0) {
        const prevV = versions[idx - 1];
        for (const def of CLAUSE_FRAMEWORK) {
          const prev = prevV.clauses.find((c) => c.id === def.id);
          const curr = v.clauses.find((c) => c.id === def.id);
          const s = allDecisions[def.id];
          const wasReq = s
            ? Object.entries(s.roundDecisions).some(
                ([vv, d]) => d === "request-update" && versions.findIndex((x) => x.version === vv) < idx,
              )
            : false;
          const pill = determineChangePill({
            clause: curr,
            previousClause: prev,
            wasRequestedInPreviousRound: wasReq,
          });
          if (pill.status === "improved" || pill.status === "regressed" || pill.status === "new") supplierChanges++;
        }
      }
      return { version: v.version, high, medium, openRequests, supplierChanges };
    });
  }, [versions, allDecisions]);

  if (versions.length < 2) return null;

  const maxBar = Math.max(1, ...points.map((p) => p.high + p.medium + p.openRequests));

  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Negotiation trend</h3>
          <p className="text-xs text-muted-foreground">High / medium issues and open requests across all rounds.</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-destructive" /> High</span>
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-warning" /> Medium</span>
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-primary" /> Open requests</span>
        </div>
      </div>
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
        {points.map((p) => {
          const isActive = p.version === activeVersion;
          return (
            <button
              key={p.version}
              type="button"
              onClick={() => onJump?.(p.version)}
              className={`rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                isActive ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-muted/40"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-[11px] font-semibold text-foreground">{p.version}</span>
                {p.supplierChanges > 0 && (
                  <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-warning-foreground">
                    +{p.supplierChanges} changes
                  </span>
                )}
              </div>
              <div className="mt-2 flex h-9 w-full items-end gap-1">
                <span className="flex-1 rounded-t bg-destructive" style={{ height: `${(p.high / maxBar) * 100}%` }} aria-label={`${p.high} high`} />
                <span className="flex-1 rounded-t bg-warning" style={{ height: `${(p.medium / maxBar) * 100}%` }} aria-label={`${p.medium} medium`} />
                <span className="flex-1 rounded-t bg-primary" style={{ height: `${(p.openRequests / maxBar) * 100}%` }} aria-label={`${p.openRequests} open`} />
                <span className="flex-[4] border-b border-dashed border-border" aria-hidden />
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1 text-[10px] text-muted-foreground">
                <span><span className="font-semibold text-foreground">{p.high}</span> high</span>
                <span><span className="font-semibold text-foreground">{p.medium}</span> med</span>
                <span><span className="font-semibold text-foreground">{p.openRequests}</span> open</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
