import { useMemo } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ClauseResult, ContractVersion } from "@/lib/workflow-types";
import { determineChangePill } from "@/lib/change-tracking-v3";
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
  const { met, partiallyMet, notMet, supplierChanges, requestedTotal } = useMemo(() => {
    const met: Bucket[] = [];
    const partiallyMet: Bucket[] = [];
    const notMet: Bucket[] = [];
    const supplierChanges: Bucket[] = [];

    for (const curr of rightVersion.clauses) {
      const prev = leftVersion.clauses.find((c) => c.id === curr.id);
      const pill = determineChangePill({ clause: curr });

      if (pill.status === "met") met.push({ id: curr.id, prev, curr });
      if (pill.status === "partially_met") partiallyMet.push({ id: curr.id, prev, curr });
      if (pill.status === "not_met") notMet.push({ id: curr.id, prev, curr });
      if (
        pill.status === "worsened" ||
        pill.status === "unexpected" ||
        pill.status === "manual_review"
      ) {
        supplierChanges.push({ id: curr.id, prev, curr });
      }
    }
    return {
      met,
      partiallyMet,
      notMet,
      supplierChanges,
      requestedTotal: met.length + partiallyMet.length + notMet.length,
    };
  }, [leftVersion, rightVersion]);

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
        "rounded-xl border p-5 bg-card",
        tone === "success" && "border-success/30",
        tone === "warning" && "border-warning/40",
        tone === "destructive" && "border-destructive/30",
      )}
    >
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="flex items-start gap-3 min-w-0 flex-1">
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
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-foreground">{headline}</h2>
              <Badge variant="outline" className="font-mono text-[11px]">
                {leftVersion.version} → {rightVersion.version}
              </Badge>
              {decision === "accepted" && (
                <Badge className="bg-success/10 text-success border-success/30">Accepted</Badge>
              )}
              {decision === "changes-requested" && (
                <Badge className="bg-warning/15 text-warning border-warning/30">Changes requested</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{subline}</p>

            {/* Four quick stats — clickable to jump */}
            <div className="flex flex-wrap gap-2 mt-3">
              <Stat label="Met" value={met.length} tone="success" />
              <Stat
                label="Partially met"
                value={partiallyMet.length}
                tone="warning"
                onClick={partiallyMet.length ? onJumpToOpen : undefined}
              />
              <Stat label="Not met" value={notMet.length} tone="destructive" onClick={notMet.length ? onJumpToOpen : undefined} />
              <Stat label="Changes" value={supplierChanges.length} tone="destructive" onClick={supplierChanges.length ? onJumpToChanges : undefined} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {decision ? (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onDecision(null)}>
              <RotateCcw className="h-3.5 w-3.5" /> Undo
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDecision("changes-requested")}
              >
                Request changes
              </Button>
              <Button size="sm" onClick={() => onDecision("accepted")}>
                <CheckCircle2 className="h-4 w-4 mr-1.5" /> Accept version
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
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm",
        toneCls,
        onClick && "hover:opacity-80 cursor-pointer",
      )}
    >
      <span className="font-semibold tabular-nums">{value}</span>
      <span className="text-xs opacity-90">{label}</span>
    </Comp>
  );
}
