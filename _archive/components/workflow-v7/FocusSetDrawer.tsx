import { Card, Headings, Text } from "@orbit";
import { V6OrbitOverlay } from "@/components/clauseiq-v7/V6OrbitOverlay";
import { Badge } from "@/components/clauseiq-v7/orbit-ui/badge";
import { Button } from "@/components/clauseiq-v7/orbit-ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/clauseiq-v7/orbit-ui/select";
import { Trash2, ArrowUp, ArrowDown, Minus, Plus, Ban, Target } from "@/components/clauseiq-v7/v7Icons";
import type { FocusSetApi } from "@/hooks/use-focus-set";
import { FRAMEWORK_BY_ID } from "@/lib/clauses-framework";
import type { ClausePriority, ClauseLifecycleStatus, ContractVersion } from "@/lib/workflow-types";

const PRIORITY_TONE: Record<ClausePriority, string> = {
  Critical: "bg-orbit-destructive/10 text-orbit-destructive border-orbit-destructive/20",
  Important: "bg-orbit-warning/15 text-orbit-warning border-orbit-warning/30",
  Watchlist: "bg-orbit-surface text-orbit-fg-secondary border-orbit-border",
};

const LIFECYCLE_TONE: Record<ClauseLifecycleStatus, string> = {
  Open: "bg-orbit-surface text-orbit-fg-secondary border-orbit-border",
  "In negotiation": "bg-orbit-primary/10 text-orbit-primary border-orbit-primary/20",
  Resolved: "bg-orbit-success/10 text-orbit-success border-orbit-success/20",
};

const CHANGE_ICON = {
  improved: ArrowUp,
  worsened: ArrowDown,
  unchanged: Minus,
  new: Plus,
  missing: Ban,
} as const;

const CHANGE_TONE: Record<keyof typeof CHANGE_ICON, string> = {
  improved: "text-orbit-success",
  worsened: "text-orbit-destructive",
  unchanged: "text-orbit-fg-secondary",
  new: "text-orbit-primary",
  missing: "text-orbit-fg-secondary",
};

interface FocusSetDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
  contractId: string;
  focus: FocusSetApi;
  latestVersion: ContractVersion | null;
}

export function FocusSetDrawer({
  open,
  onOpenChange,
  supplierId,
  contractId,
  focus,
  latestVersion,
}: FocusSetDrawerProps) {
  const entries = focus.getEntries(supplierId, contractId);

  const resolvedCount = entries.filter((e) => e.lifecycle === "Resolved").length;
  const openCount = entries.length - resolvedCount;

  return (
    <V6OrbitOverlay
      open={open}
      onOpenChange={onOpenChange}
      title="Negotiation Focus Set"
      description="User-selected clauses tracked across negotiation rounds."
      size="Large"
      height="Viewport"
    >
        <div className="flex items-center gap-orbit-s">
          <Target className="h-4 w-4 text-orbit-primary" />
          <Headings size="Heading 5">Tracked clauses</Headings>
        </div>
        <div className="mt-orbit-base grid grid-cols-3 gap-orbit-s text-center">
          <Stat label="Tracked" value={entries.length} />
          <Stat label="Resolved" value={resolvedCount} tone="text-orbit-success" />
          <Stat label="Remaining" value={openCount} tone="text-orbit-warning" />
        </div>

        <div className="mt-orbit-m space-y-orbit-s">
          {entries.length === 0 && (
            <Card type="Static" padding="Base" state="Default">
              <div className="text-center">
                <Text size="Small" variant="Secondary" as="p">
                  No clauses tracked yet. Use the "Track" checkbox on any clause row to add it here.
                </Text>
              </div>
            </Card>
          )}

          {entries.map((e) => {
            const def = FRAMEWORK_BY_ID.get(e.clauseId);
            const live = latestVersion?.clauses.find((c) => c.id === e.clauseId);
            const change = (live?.change ?? "unchanged") as keyof typeof CHANGE_ICON;
            const Icon = CHANGE_ICON[change];
            return (
              <Card key={e.clauseId} type="Static" padding="Small" state="Default">
                <div className="space-y-orbit-s">
                <div className="flex items-start justify-between gap-orbit-s">
                  <div className="min-w-0 flex-1">
                    <p className="text-orbit-xs tabular-nums text-orbit-fg-secondary">
                      §{def?.number ?? e.clauseId.replace("c", "")} · {def?.category}
                    </p>
                    <p className="text-orbit-sm v6-orbit-weight-semibold text-orbit-fg truncate">{def?.title}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => focus.remove(supplierId, contractId, e.clauseId)}
                    aria-label="Remove from focus set"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="flex items-center gap-orbit-s flex-wrap">
                  {live && (
                    <Badge variant="outline" className={severityTone(live.severity)}>
                      {live.severity}
                    </Badge>
                  )}
                  <Badge variant="outline" className="gap-orbit-xs">
                    <Icon className={`w-3 h-3 ${CHANGE_TONE[change]}`} />
                    {change}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-orbit-s">
                  <div>
                    <label className="text-orbit-xs uppercase text-orbit-fg-secondary tracking-wider">Priority</label>
                    <Select
                      value={e.priority}
                      onValueChange={(v) => focus.setPriority(supplierId, contractId, e.clauseId, v as ClausePriority)}
                    >
                      <SelectTrigger className="h-8 text-orbit-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["Critical", "Important", "Watchlist"] as ClausePriority[]).map((p) => (
                          <SelectItem key={p} value={p}>
                            <span className={`inline-flex items-center gap-orbit-xs`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${dotTone(p)}`} />
                              {p}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-orbit-xs uppercase text-orbit-fg-secondary tracking-wider">Status</label>
                    <Select
                      value={e.lifecycle}
                      onValueChange={(v) => focus.setLifecycle(supplierId, contractId, e.clauseId, v as ClauseLifecycleStatus)}
                    >
                      <SelectTrigger className="h-8 text-orbit-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["Open", "In negotiation", "Resolved"] as ClauseLifecycleStatus[]).map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Badge variant="outline" className={`${LIFECYCLE_TONE[e.lifecycle]} text-orbit-xs`}>
                  {e.lifecycle}
                </Badge>
                </div>
              </Card>
            );
          })}
        </div>
    </V6OrbitOverlay>
  );
}

function Stat({ label, value, tone = "text-orbit-fg" }: { label: string; value: number; tone?: string }) {
  return (
    <div className="border border-orbit-border rounded-orbit-md p-orbit-s bg-orbit-card">
      <p className="text-orbit-xs uppercase text-orbit-fg-secondary tracking-wider">{label}</p>
      <p className={`text-orbit-lg v6-orbit-weight-bold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}

function severityTone(s: "high" | "medium" | "low") {
  return s === "high"
    ? "bg-orbit-destructive/10 text-orbit-destructive border-orbit-destructive/20"
    : s === "medium"
    ? "bg-orbit-warning/15 text-orbit-warning border-orbit-warning/30"
    : "bg-orbit-surface text-orbit-fg-secondary border-orbit-border";
}

function dotTone(p: ClausePriority) {
  return p === "Critical" ? "bg-orbit-destructive" : p === "Important" ? "bg-orbit-warning" : "bg-orbit-fg-secondary";
}
