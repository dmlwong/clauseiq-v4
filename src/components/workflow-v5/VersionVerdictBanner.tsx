import { useMemo } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/clauseiq-v5/orbit-ui/button";
import { Badge } from "@/components/clauseiq-v5/orbit-ui/badge";
import { cn } from "@/lib/utils";
import type { ClauseResult, ContractVersion } from "@/lib/workflow-types";
import { determineChangePill } from "@/lib/change-tracking";
import type { ClauseDecisionState } from "@/hooks/use-clause-decisions";

type Decision = "accepted" | "changes-requested" | null;

interface Props {
  leftVersion: ContractVersion;
  rightVersion: ContractVersion;
  versions: ContractVersion[];
  allDecisions: Record<string, ClauseDecisionState>;
  decision: Decision;
  onDecision: (d: Decision) => void;
  onJumpToOpen: () => void;
  onJumpToChanges: () => void;
}

interface Bucket {
  id: string;
  prev?: ClauseResult;
  curr?: ClauseResult;
}

/**
 * Verdict banner shown at the top of the Contract Results view when comparing
 * two versions. Surfaces the three questions a user needs to answer in seconds:
 *   1. Did the supplier meet the requests?  (met / not met)
 *   2. Did anything change without a request? (supplier change count)
 *   3. Can I accept this version?           (Accept / Request changes CTA)
 */
export function VersionVerdictBanner({
  leftVersion,
  rightVersion,
  versions,
  allDecisions,
  decision,
  onDecision,
  onJumpToOpen,
  onJumpToChanges,
}: Props) {
  const { met, notMet, supplierChanges, requestedTotal } = useMemo(() => {
    const met: Bucket[] = [];
    const notMet: Bucket[] = [];
    const supplierChanges: Bucket[] = [];
    const leftIdx = versions.findIndex((v) => v.version === leftVersion.version);

    for (const id of Object.keys(allDecisions)) {
      // walk every clause that has any decision history; we determine if it was
      // requested in or before the left ("previous") version.
    }

    // Iterate clauses present on the right version (the "new" upload)
    for (const curr of rightVersion.clauses) {
      const prev = leftVersion.clauses.find((c) => c.id === curr.id);
      const s = allDecisions[curr.id];
      const wasRequested = s
        ? Object.entries(s.roundDecisions).some(
            ([v, d]) =>
              d === "request-update" &&
              versions.findIndex((x) => x.version === v) <= leftIdx,
          )
        : false;
      const pill = determineChangePill({
        clause: curr,
        previousClause: prev,
        wasRequestedInPreviousRound: wasRequested,
      });

      if (pill.status === "met") met.push({ id: curr.id, prev, curr });
      if (pill.status === "not_met") notMet.push({ id: curr.id, prev, curr });
      if (pill.status === "improved" || pill.status === "regressed" || pill.status === "new") {
        supplierChanges.push({ id: curr.id, prev, curr });
      }
    }
    return {
      met,
      notMet,
      supplierChanges,
      requestedTotal: met.length + notMet.length,
    };
  }, [leftVersion, rightVersion, versions, allDecisions]);

  // Verdict tone — green if everything met & no supplier changes, amber if partial, red if nothing met or many supplier changes.
  const allMet = requestedTotal > 0 && notMet.length === 0;
  const noneMet = requestedTotal > 0 && met.length === 0;
  const tone =
    allMet && supplierChanges.length === 0
      ? "success"
      : noneMet || supplierChanges.length >= 3
        ? "destructive"
        : "warning";

  const headline =
    requestedTotal === 0
      ? `${rightVersion.version.toUpperCase()} uploaded — no prior requests to compare against`
      : allMet && supplierChanges.length === 0
        ? `All ${requestedTotal} requested changes met`
        : `${met.length} of ${requestedTotal} requested changes met`;

  const subline = (() => {
    const parts: string[] = [];
    if (notMet.length > 0) parts.push(`${notMet.length} still open`);
    if (supplierChanges.length > 0)
      parts.push(`${supplierChanges.length} supplier change${supplierChanges.length === 1 ? "" : "s"}`);
    if (parts.length === 0) return "Safe to accept this version.";
    return parts.join(" · ");
  })();

  const Icon = tone === "success" ? CheckCircle2 : tone === "warning" ? AlertCircle : AlertTriangle;

  return (
    <div
      className={cn(
        "rounded-xl border p-orbit-m bg-card",
        tone === "success" && "border-success/30",
        tone === "warning" && "border-warning/40",
        tone === "destructive" && "border-destructive/30",
      )}
    >
      <div className="flex items-start justify-between gap-orbit-m flex-wrap">
        <div className="flex items-start gap-orbit-base min-w-0 flex-1">
          <div
            className={cn(
              "h-10 w-10 rounded-full grid place-items-center shrink-0",
              tone === "success" && "bg-success/10 text-success",
              tone === "warning" && "bg-warning/15 text-warning",
              tone === "destructive" && "bg-destructive/10 text-destructive",
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-orbit-s flex-wrap">
              <h2 className="v5-orbit-heading-4">{headline}</h2>
              <Badge variant="outline" className="tabular-nums text-[11px]">
                {leftVersion.version} → {rightVersion.version}
              </Badge>
              {decision === "accepted" && (
                <Badge className="bg-success/10 text-success border-success/30">Accepted</Badge>
              )}
              {decision === "changes-requested" && (
                <Badge className="bg-warning/15 text-warning border-warning/30">Changes requested</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-orbit-xs">{subline}</p>

            {/* Three quick stats — clickable to jump */}
            <div className="flex flex-wrap gap-orbit-s mt-orbit-base">
              <Stat label="Met" value={met.length} tone="success" />
              <Stat label="Not met" value={notMet.length} tone="warning" onClick={notMet.length ? onJumpToOpen : undefined} />
              <Stat label="Changes" value={supplierChanges.length} tone="destructive" onClick={supplierChanges.length ? onJumpToChanges : undefined} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-orbit-s shrink-0">
          {decision ? (
            <Button variant="outline" className="gap-orbit-xs" onClick={() => onDecision(null)}>
              <RotateCcw className="h-3.5 w-3.5" /> Undo
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => onDecision("changes-requested")}
              >
                Request changes
              </Button>
              <Button onClick={() => onDecision("accepted")}>
                <CheckCircle2 className="h-4 w-4 mr-orbit-xs" /> Accept version
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  onClick,
}: {
  label: string;
  value: number;
  tone: "success" | "warning" | "destructive";
  onClick?: () => void;
}) {
  const toneCls =
    tone === "success"
      ? "bg-success/10 text-success border-success/20"
      : tone === "warning"
        ? "bg-warning/15 text-warning border-warning/30"
        : "bg-destructive/10 text-destructive border-destructive/30";
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-orbit-s px-orbit-base py-orbit-xs rounded-md border text-sm",
        toneCls,
        onClick && "hover:opacity-80 cursor-pointer",
      )}
    >
      <span className="font-semibold tabular-nums">{value}</span>
      <span className="text-xs opacity-90">{label}</span>
    </Comp>
  );
}
