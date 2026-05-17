import { useState, type ReactNode } from "react";
import { ArrowRight, Columns3, FileText, GitCompare, LayoutTemplate } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ComparisonStripStats, DeviationDistribution, VersionPanelData } from "@/lib/clauseiq-v3-comparison";

export type ComparisonDesignOption = "evolved" | "side-by-side" | "document";
export type EvidenceMetricKey =
  | "open-items"
  | "met"
  | "closed"
  | "changes"
  | "need-action"
  | "high"
  | "medium"
  | "low"
  | "total";

export interface EvidenceMetricCounts {
  openItems: number;
  met: number;
  closed: number;
  supplierChanges: number;
  needReview: number;
  high: number;
  medium: number;
  low: number;
  totalClauses: number;
}

const designOptions: Array<{ value: ComparisonDesignOption; label: string; icon: ReactNode }> = [
  { value: "evolved", label: "Option 1 · Evolved", icon: <LayoutTemplate className="h-3.5 w-3.5" /> },
  { value: "side-by-side", label: "Option 2 · Side-by-side", icon: <Columns3 className="h-3.5 w-3.5" /> },
  { value: "document", label: "Option 3 · Document", icon: <FileText className="h-3.5 w-3.5" /> },
];

const distributionColours: Record<keyof DeviationDistribution, string> = {
  high: "#A32D2D",
  medium: "#BA7517",
  low: "#B4B2A9",
  clean: "#3B6D11",
};

export function DesignOptionSwitcher({
  value,
  onChange,
}: {
  value: ComparisonDesignOption;
  onChange: (value: ComparisonDesignOption) => void;
}) {
  return (
    <div className="flex min-w-0 items-center gap-1 overflow-x-auto rounded-md border border-border bg-white p-0.5">
      {designOptions.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-[5px] px-2.5 text-[10px] font-medium transition-colors",
              active ? "bg-[#1a2744] text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function ComparisonDesignOptions({
  option,
  comparisonControl,
  stripStats,
  panel,
  contractName,
  supplierName,
  leftLabel,
  rightLabel,
  openItems,
  newChanges,
  closedItems,
  unmarkedClauses,
  categoryRail,
  categoryPanel,
  categoryStrip,
  activeCategoryLabel,
  onClearCategory,
  activeEvidenceMetric,
  onEvidenceMetricSelect,
  evidenceMetrics,
}: {
  option: ComparisonDesignOption;
  comparisonControl: ReactNode;
  stripStats: ComparisonStripStats;
  panel: VersionPanelData;
  contractName: string;
  supplierName: string;
  leftLabel: string;
  rightLabel: string;
  openItems: ReactNode;
  newChanges: ReactNode;
  closedItems: ReactNode;
  unmarkedClauses: ReactNode;
  categoryRail: ReactNode;
  categoryPanel: ReactNode;
  categoryStrip: ReactNode;
  activeCategoryLabel?: string | null;
  onClearCategory: () => void;
  activeEvidenceMetric?: EvidenceMetricKey | null;
  onEvidenceMetricSelect?: (metric: EvidenceMetricKey) => void;
  evidenceMetrics?: EvidenceMetricCounts;
}) {
  const [rightRailTab, setRightRailTab] = useState<"evidence" | "categories">("evidence");

  if (option === "side-by-side") {
    return (
      <div className="mx-auto grid w-full max-w-[1500px] gap-4 px-6 py-4 xl:grid-cols-[360px_minmax(0,1fr)] xl:items-start">
        <aside className="xl:sticky xl:top-[100px] xl:max-h-[calc(100vh-180px)] xl:self-start xl:overflow-y-auto">
          <section className="overflow-hidden rounded-lg border border-border bg-card">
            <RightRailTabs active={rightRailTab} onChange={setRightRailTab} />
            <div className="p-3">
              {rightRailTab === "evidence" ? (
                <EvidencePanel
                  panel={panel}
                  stripStats={stripStats}
                  contractName={contractName}
                  supplierName={supplierName}
                  leftLabel={leftLabel}
                  rightLabel={rightLabel}
                  activeMetric={activeEvidenceMetric}
                  onMetricSelect={onEvidenceMetricSelect}
                  metrics={evidenceMetrics}
                  embedded
                />
              ) : (
                categoryPanel
              )}
            </div>
          </section>
        </aside>
        <div id="comparison-work-column" className="min-w-0 space-y-4">
          <DesignTopContext
            title="Decision list"
            subtitle="Review requested clauses and supplier-initiated changes using the same request workflow."
            comparisonControl={comparisonControl}
            stripStats={stripStats}
            activeCategoryLabel={activeCategoryLabel}
            onClearCategory={onClearCategory}
          />
          <WorkflowStack
            openItems={openItems}
            newChanges={newChanges}
            closedItems={closedItems}
            unmarkedClauses={unmarkedClauses}
          />
        </div>
      </div>
    );
  }

  if (option === "document") {
    return (
      <div id="comparison-work-column" className="mx-auto w-full max-w-[1080px] space-y-4 px-6 py-4">
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Contract comparison</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">{contractName}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{supplierName} · {leftLabel} to {rightLabel}</p>
              <ActiveCategoryIndicator label={activeCategoryLabel} onClear={onClearCategory} className="mt-2" />
            </div>
            <div className="shrink-0">{comparisonControl}</div>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-stretch">
            <ScoreHero stripStats={stripStats} className="h-full" />
            <VersionDistributionPair panel={panel} leftLabel={leftLabel} rightLabel={rightLabel} large contained className="h-full" />
          </div>
          <NarrativeSummary
            stripStats={stripStats}
            className="mt-4"
            activeMetric={activeEvidenceMetric}
            onMetricSelect={onEvidenceMetricSelect}
            metrics={evidenceMetrics}
          />
        </section>
        {categoryStrip}
        <WorkflowStack
          openItems={openItems}
          newChanges={newChanges}
          closedItems={closedItems}
          unmarkedClauses={unmarkedClauses}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] px-6 py-4">
      <div className="mb-4 min-[900px]:hidden">{categoryStrip}</div>
      <div className="min-[900px]:flex min-[900px]:items-start min-[900px]:gap-4">
        <div className="hidden w-60 shrink-0 min-[900px]:block">
          {categoryRail}
        </div>
        <div id="comparison-work-column" className="min-w-0 flex-1 space-y-4">
          <ActiveCategoryIndicator label={activeCategoryLabel} onClear={onClearCategory} />
          <section className="grid items-stretch gap-4 rounded-lg border border-border bg-card p-4 xl:grid-cols-2">
            <NarrativeSummary
              stripStats={stripStats}
              activeMetric={activeEvidenceMetric}
              onMetricSelect={onEvidenceMetricSelect}
              metrics={evidenceMetrics}
            />
            <div className="min-h-[204px] rounded-lg border border-border bg-white p-3">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Version movement
                </p>
                <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
                  {comparisonControl}
                  <ScoreMovementBadge panel={panel} />
                </div>
              </div>
              <VersionDistributionPair panel={panel} leftLabel={leftLabel} rightLabel={rightLabel} stacked hideScore />
            </div>
          </section>
          <WorkflowStack
            openItems={openItems}
            newChanges={newChanges}
            closedItems={closedItems}
            unmarkedClauses={unmarkedClauses}
          />
        </div>
      </div>
    </div>
  );
}

function DesignTopContext({
  title,
  subtitle,
  comparisonControl,
  stripStats,
  activeCategoryLabel,
  onClearCategory,
}: {
  title: string;
  subtitle: string;
  comparisonControl: ReactNode;
  stripStats: ComparisonStripStats;
  activeCategoryLabel?: string | null;
  onClearCategory: () => void;
}) {
  return (
    <section className="flex min-h-[66px] flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <GitCompare className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <ProgressPill stripStats={stripStats} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        <ActiveCategoryIndicator label={activeCategoryLabel} onClear={onClearCategory} className="mt-2" />
      </div>
      <div className="shrink-0 sm:ml-auto">{comparisonControl}</div>
    </section>
  );
}

function ActiveCategoryIndicator({
  label,
  onClear,
  className,
}: {
  label?: string | null;
  onClear: () => void;
  className?: string;
}) {
  if (!label) return null;
  return (
    <button
      type="button"
      onClick={onClear}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-[#185FA5]/20 bg-[#E6F1FB] px-2 py-0.5 text-[10px] font-medium text-[#0C447C] hover:bg-[#D7E9F8]",
        className,
      )}
    >
      Category: {label}
      <span aria-hidden className="text-[#0C447C]/70">×</span>
    </button>
  );
}

function RightRailTabs({
  active,
  onChange,
}: {
  active: "evidence" | "categories";
  onChange: (value: "evidence" | "categories") => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1 border-b border-border bg-[#f8f7f5] p-1">
      {(["evidence", "categories"] as const).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={cn(
            "h-7 rounded-md text-[11px] font-medium capitalize transition-colors",
            active === value ? "bg-[#1a2744] text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {value}
        </button>
      ))}
    </div>
  );
}

function WorkflowStack({
  openItems,
  newChanges,
  closedItems,
  unmarkedClauses,
  twoColumn = false,
}: {
  openItems: ReactNode;
  newChanges: ReactNode;
  closedItems: ReactNode;
  unmarkedClauses: ReactNode;
  twoColumn?: boolean;
}) {
  return (
    <div className={cn("grid gap-4", twoColumn && "xl:grid-cols-2")}>
      {openItems}
      {closedItems}
      {newChanges}
      <div className={cn(twoColumn && "xl:col-span-2")}>{unmarkedClauses}</div>
    </div>
  );
}

function EvidencePanel({
  panel,
  stripStats,
  contractName,
  supplierName,
  leftLabel,
  rightLabel,
  embedded = false,
  activeMetric,
  onMetricSelect,
  metrics,
}: {
  panel: VersionPanelData;
  stripStats: ComparisonStripStats;
  contractName: string;
  supplierName: string;
  leftLabel: string;
  rightLabel: string;
  embedded?: boolean;
  activeMetric?: EvidenceMetricKey | null;
  onMetricSelect?: (metric: EvidenceMetricKey) => void;
  metrics?: EvidenceMetricCounts;
}) {
  const { contract, comparison, actions } = stripStats;
  const metricCounts = metrics ?? {
    openItems: comparison.requestedTotal,
    met: comparison.met,
    closed: 0,
    supplierChanges: comparison.supplierChanges,
    needReview: actions.pendingReview,
    high: contract.high,
    medium: contract.medium,
    low: contract.low,
    totalClauses: contract.total,
  };
  return (
    <section className={cn("rounded-lg border border-border bg-card p-4", embedded && "rounded-none border-0 p-0")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Evidence</p>
          <h3 className="mt-1 text-sm font-semibold text-foreground">{contractName}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{supplierName}</p>
        </div>
        <Badge variant="outline" className="rounded-full text-[10px]">Current {rightLabel}</Badge>
      </div>
      <div className="mt-4">
        <ScoreHero stripStats={stripStats} compact />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
        <MetricCell
          label="Open items"
          value={metricCounts.openItems}
          active={activeMetric === "open-items"}
          onClick={onMetricSelect ? () => onMetricSelect("open-items") : undefined}
        />
        <MetricCell
          label="Met"
          value={metricCounts.met}
          tone="success"
          active={activeMetric === "met"}
          onClick={onMetricSelect ? () => onMetricSelect("met") : undefined}
        />
        <MetricCell
          label="Closed"
          value={metricCounts.closed}
          tone="success"
          active={activeMetric === "closed"}
          onClick={onMetricSelect ? () => onMetricSelect("closed") : undefined}
        />
        <MetricCell
          label="Supplier changes"
          value={metricCounts.supplierChanges}
          tone="warning"
          active={activeMetric === "changes"}
          onClick={onMetricSelect ? () => onMetricSelect("changes") : undefined}
        />
        <MetricCell
          label="Need review"
          value={metricCounts.needReview}
          tone="destructive"
          active={activeMetric === "need-action"}
          onClick={onMetricSelect ? () => onMetricSelect("need-action") : undefined}
        />
        <MetricCell
          label="High"
          value={metricCounts.high}
          tone="destructive"
          active={activeMetric === "high"}
          onClick={onMetricSelect ? () => onMetricSelect("high") : undefined}
        />
        <MetricCell
          label="Medium"
          value={metricCounts.medium}
          tone="warning"
          active={activeMetric === "medium"}
          onClick={onMetricSelect ? () => onMetricSelect("medium") : undefined}
        />
        <MetricCell
          label="Low"
          value={metricCounts.low}
          active={activeMetric === "low"}
          onClick={onMetricSelect ? () => onMetricSelect("low") : undefined}
        />
        <MetricCell
          label="Total clauses"
          value={metricCounts.totalClauses}
          active={activeMetric === "total" || !activeMetric}
          onClick={onMetricSelect ? () => onMetricSelect("total") : undefined}
        />
      </div>
      <div className="mt-4">
        <VersionDistributionPair panel={panel} leftLabel={leftLabel} rightLabel={rightLabel} stacked hideDelta />
      </div>
    </section>
  );
}

function ScoreHero({
  stripStats,
  compact = false,
  className,
}: {
  stripStats: ComparisonStripStats;
  compact?: boolean;
  className?: string;
}) {
  const { contract, comparison } = stripStats;
  return (
    <div className={cn("rounded-lg border border-border bg-[#f8f7f5] p-4", compact && "p-3", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Current score</p>
      <div className="mt-1 flex items-end gap-2">
        <span className={cn("font-semibold leading-none text-foreground", compact ? "text-3xl" : "text-5xl")}>{contract.score}</span>
        <span className="pb-1 text-sm font-medium text-muted-foreground">{contract.band}</span>
        <span className={cn("mb-1 rounded-full px-2 py-0.5 text-[10px] font-medium", comparison.scoreDelta >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
          {comparison.scoreDelta >= 0 ? "+" : ""}
          {comparison.scoreDelta} pts
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {comparison.met} of {comparison.requestedTotal} requested changes met.
      </p>
    </div>
  );
}

function ScoreMovementBadge({ panel }: { panel: VersionPanelData }) {
  return (
    <span className="inline-flex h-5 shrink-0 items-center gap-1 rounded-full border border-border bg-white px-2 text-[10px] font-medium text-foreground">
      <span className="text-muted-foreground">Score</span>
      <span>{panel.current.score}</span>
      <span className={cn(panel.delta >= 0 ? "text-success" : "text-destructive")}>
        {panel.delta >= 0 ? "+" : ""}
        {panel.delta} pts
      </span>
    </span>
  );
}

function VersionDistributionPair({
  panel,
  leftLabel,
  rightLabel,
  large = false,
  stacked = false,
  className,
  hideScore = false,
  hideDelta = false,
  contained = false,
}: {
  panel: VersionPanelData;
  leftLabel: string;
  rightLabel: string;
  large?: boolean;
  stacked?: boolean;
  className?: string;
  hideScore?: boolean;
  hideDelta?: boolean;
  contained?: boolean;
}) {
  const previous = panel.previous ?? {
    version: leftLabel,
    score: panel.current.score - panel.delta,
    band: panel.current.band,
    distribution: panel.current.distribution,
  };

  if (contained && !stacked) {
    return (
      <div className={cn("grid w-full rounded-lg border border-border bg-white p-3 lg:grid-cols-[minmax(0,1fr)_44px_minmax(0,1fr)] lg:items-stretch", className)}>
        <DistributionSide label={leftLabel} score={previous.score} distribution={previous.distribution} large={large} hideScore={hideScore} unframed />
        <div className="hidden h-full flex-col items-center justify-center gap-1 text-muted-foreground lg:flex">
          <ArrowRight className="h-4 w-4" />
          {!hideDelta && (
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", panel.delta >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
              {panel.delta >= 0 ? "+" : ""}
              {panel.delta}
            </span>
          )}
        </div>
        <DistributionSide label={rightLabel} score={panel.current.score} distribution={panel.current.distribution} current large={large} hideScore={hideScore} unframed />
      </div>
    );
  }

  return (
    <div className={cn("grid w-full gap-3", stacked ? "grid-cols-1" : "lg:grid-cols-[minmax(0,1fr)_40px_minmax(0,1fr)] lg:items-stretch", className)}>
      <DistributionSide label={leftLabel} score={previous.score} distribution={previous.distribution} large={large} hideScore={hideScore} />
      {!stacked && (
        <div className="hidden h-full flex-col items-center justify-center gap-1 text-muted-foreground lg:flex">
          <ArrowRight className="h-4 w-4" />
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", panel.delta >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
            {panel.delta >= 0 ? "+" : ""}
            {panel.delta}
          </span>
        </div>
      )}
      <DistributionSide label={rightLabel} score={panel.current.score} distribution={panel.current.distribution} current large={large} hideScore={hideScore} />
      {stacked && !hideScore && !hideDelta && (
        <div className={cn("rounded-md px-2 py-1 text-center text-[10px] font-medium", panel.delta >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
          Score delta {panel.delta >= 0 ? "+" : ""}
          {panel.delta} pts
        </div>
      )}
    </div>
  );
}

function DistributionSide({
  label,
  score,
  distribution,
  current = false,
  large = false,
  hideScore = false,
  unframed = false,
}: {
  label: string;
  score: number;
  distribution: DeviationDistribution;
  current?: boolean;
  large?: boolean;
  hideScore?: boolean;
  unframed?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-white p-3",
        current && "border-[#185FA5]/30 bg-[#E6F1FB]/35",
        unframed && "border-0 bg-transparent",
        unframed && current && "bg-[#E6F1FB]/45",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">{label}</p>
          {current && <Badge className="bg-[#185FA5] px-1.5 py-0 text-[8px] text-white hover:bg-[#185FA5]">Current</Badge>}
        </div>
        {!hideScore && <p className={cn("font-semibold text-foreground", large ? "text-lg" : "text-sm")}>{score}</p>}
      </div>
      <DistributionBar distribution={distribution} className="mt-3" />
      <div className="mt-2 grid grid-cols-4 gap-1 text-[9px] text-muted-foreground">
        <span><strong className="text-[#A32D2D]">{distribution.high}</strong> H</span>
        <span><strong className="text-[#854F0B]">{distribution.medium}</strong> M</span>
        <span><strong>{distribution.low}</strong> L</span>
        <span><strong className="text-[#3B6D11]">{distribution.clean}</strong> C</span>
      </div>
    </div>
  );
}

function DistributionBar({ distribution, className }: { distribution: DeviationDistribution; className?: string }) {
  const total = Math.max(1, distribution.high + distribution.medium + distribution.low + distribution.clean);
  return (
    <div className={cn("flex h-2 overflow-hidden rounded-full bg-muted", className)}>
      {(Object.keys(distributionColours) as Array<keyof DeviationDistribution>).map((key) => {
        const value = distribution[key];
        if (value <= 0) return null;
        return (
          <span
            key={key}
            className="h-full"
            style={{ width: `${(value / total) * 100}%`, backgroundColor: distributionColours[key] }}
          />
        );
      })}
    </div>
  );
}

function NarrativeSummary({
  stripStats,
  className,
  activeMetric,
  onMetricSelect,
  metrics,
}: {
  stripStats: ComparisonStripStats;
  className?: string;
  activeMetric?: EvidenceMetricKey | null;
  onMetricSelect?: (metric: EvidenceMetricKey) => void;
  metrics?: EvidenceMetricCounts;
}) {
  const { contract, comparison, actions } = stripStats;
  const metricCounts = metrics ?? {
    openItems: comparison.requestedTotal,
    met: comparison.met,
    closed: 0,
    supplierChanges: comparison.supplierChanges,
    needReview: actions.pendingReview,
    high: contract.high,
    medium: contract.medium,
    low: contract.low,
    totalClauses: contract.total,
  };
  return (
    <div className={cn("rounded-lg border border-border bg-[#f8f7f5] p-4", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">What changed this round</p>
        <ProgressPill stripStats={stripStats} />
      </div>
      <p className="mt-2 text-sm leading-6 text-foreground">
        {comparison.supplierChanges} supplier changes were detected between versions. {comparison.met} of {comparison.requestedTotal} requested changes are met, with {actions.pendingReview} clause{actions.pendingReview === 1 ? "" : "s"} still needing review.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
        <MetricCell
          label="Open items"
          value={metricCounts.openItems}
          active={activeMetric === "open-items"}
          onClick={onMetricSelect ? () => onMetricSelect("open-items") : undefined}
        />
        <MetricCell
          label="Met"
          value={metricCounts.met}
          tone="success"
          active={activeMetric === "met"}
          onClick={onMetricSelect ? () => onMetricSelect("met") : undefined}
        />
        <MetricCell
          label="Supplier changes"
          value={metricCounts.supplierChanges}
          tone="warning"
          active={activeMetric === "changes"}
          onClick={onMetricSelect ? () => onMetricSelect("changes") : undefined}
        />
        <MetricCell
          label="Need review"
          value={metricCounts.needReview}
          tone="destructive"
          active={activeMetric === "need-action"}
          onClick={onMetricSelect ? () => onMetricSelect("need-action") : undefined}
        />
        <MetricCell
          label="High"
          value={metricCounts.high}
          tone="destructive"
          active={activeMetric === "high"}
          onClick={onMetricSelect ? () => onMetricSelect("high") : undefined}
        />
        <MetricCell
          label="Medium"
          value={metricCounts.medium}
          tone="warning"
          active={activeMetric === "medium"}
          onClick={onMetricSelect ? () => onMetricSelect("medium") : undefined}
        />
        <MetricCell
          label="Low"
          value={metricCounts.low}
          active={activeMetric === "low"}
          onClick={onMetricSelect ? () => onMetricSelect("low") : undefined}
        />
        <MetricCell
          label="Total"
          value={metricCounts.totalClauses}
          active={activeMetric === "total" || !activeMetric}
          onClick={onMetricSelect ? () => onMetricSelect("total") : undefined}
        />
      </div>
    </div>
  );
}

function ProgressPill({ stripStats }: { stripStats: ComparisonStripStats }) {
  const { comparison, actions } = stripStats;
  const done = Math.max(0, comparison.requestedTotal + comparison.supplierChanges - actions.pendingReview);
  const total = comparison.requestedTotal + comparison.supplierChanges;
  return (
    <Badge variant="outline" className="rounded-full bg-white text-[10px]">
      {done} of {total} reviewed
    </Badge>
  );
}

function MetricCell({
  label,
  value,
  tone,
  active = false,
  onClick,
}: {
  label: string;
  value: number;
  tone?: "success" | "warning" | "destructive";
  active?: boolean;
  onClick?: () => void;
}) {
  const interactive = Boolean(onClick);
  const content = (
    <>
      <p className="text-[9px] font-medium uppercase text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-sm font-semibold text-foreground",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning-foreground",
          tone === "destructive" && "text-destructive",
        )}
      >
        {value}
      </p>
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "rounded-md border border-border bg-white px-2.5 py-2 text-left transition-colors hover:border-[#185FA5]/40 hover:bg-[#E6F1FB]/50",
          active && "border-[#185FA5]/50 bg-[#E6F1FB] shadow-[inset_3px_0_0_#185FA5]",
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <div className="rounded-md border border-border bg-white px-2.5 py-2">
      {content}
    </div>
  );
}
