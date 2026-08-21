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
    <div className="rounded-orbit-lg border border-orbit-border bg-orbit-card px-orbit-base py-orbit-base">
      <div className="mb-orbit-base flex flex-wrap items-start justify-between gap-orbit-base">
        <div>
          <h3 className="v6-orbit-heading-strong text-orbit-fg">Negotiation trend</h3>
          <p className="text-orbit-xs text-orbit-fg-secondary">High / medium issues and open requests across all rounds.</p>
        </div>
        <div className="flex items-center gap-orbit-base text-orbit-xs text-orbit-fg-secondary">
          <span className="inline-flex items-center gap-orbit-xs"><span className="w-2 h-2 rounded-orbit-sm bg-orbit-destructive" /> High</span>
          <span className="inline-flex items-center gap-orbit-xs"><span className="w-2 h-2 rounded-orbit-sm bg-orbit-warning" /> Medium</span>
          <span className="inline-flex items-center gap-orbit-xs"><span className="w-2 h-2 rounded-orbit-sm bg-orbit-primary" /> Open requests</span>
        </div>
      </div>
      <div className="grid gap-orbit-s md:grid-cols-2 lg:grid-cols-4">
        {points.map((p) => {
          const isActive = p.version === activeVersion;
          return (
            <button
              key={p.version}
              type="button"
              onClick={() => onJump?.(p.version)}
              className={`rounded-md border px-orbit-base py-orbit-s text-left text-xs transition-colors ${
                isActive ? "border-orbit-primary bg-orbit-primary/5" : "border-orbit-border bg-orbit-canvas hover:bg-orbit-surface/40"
              }`}
            >
              <div className="flex items-start justify-between gap-orbit-s">
                <span className="tabular-nums text-orbit-xs v6-orbit-weight-semibold text-orbit-fg">{p.version}</span>
                {p.supplierChanges > 0 && (
                  <span className="rounded-full bg-orbit-warning/15 px-orbit-s py-orbit-xxs text-orbit-xs v6-orbit-weight-semibold text-orbit-warning">
                    +{p.supplierChanges} changes
                  </span>
                )}
              </div>
              <div className="mt-orbit-s flex h-9 w-full items-end gap-orbit-xs">
                <span className="flex-1 rounded-t bg-orbit-destructive" style={{ height: `${(p.high / maxBar) * 100}%` }} aria-label={`${p.high} high`} />
                <span className="flex-1 rounded-t bg-orbit-warning" style={{ height: `${(p.medium / maxBar) * 100}%` }} aria-label={`${p.medium} medium`} />
                <span className="flex-1 rounded-t bg-orbit-primary" style={{ height: `${(p.openRequests / maxBar) * 100}%` }} aria-label={`${p.openRequests} open`} />
                <span className="flex-[4] border-b border-dashed border-orbit-border" aria-hidden />
              </div>
              <div className="mt-orbit-s grid grid-cols-3 gap-orbit-xs text-orbit-xs text-orbit-fg-secondary">
                <span><span className="v6-orbit-weight-semibold text-orbit-fg">{p.high}</span> high</span>
                <span><span className="v6-orbit-weight-semibold text-orbit-fg">{p.medium}</span> med</span>
                <span><span className="v6-orbit-weight-semibold text-orbit-fg">{p.openRequests}</span> open</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
