import { useState, type CSSProperties, type ReactNode } from "react";
import { ArrowRight, Columns3, List } from "lucide-react";
import {
  Badge,
  Card,
  Chip,
  Headings,
  RadialIndicator,
  TabButton,
  Text,
  ToggleCard,
} from "@orbit";

import { cn } from "@/lib/utils";
import type { ComparisonStripStats, DeviationDistribution, VersionPanelData } from "@/lib/clauseiq-v4-comparison";
import {
  FIRST_ANALYSIS_STATUS_THEME,
  type FirstAnalysisStatusKey,
} from "./firstAnalysisStatusTags";

export type ComparisonDesignOption = "evolved" | "side-by-side" | "row-scale";
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
export type FirstAnalysisMetricKey = "high" | "medium" | "low" | "missing" | "none";

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

export interface FirstAnalysisMetrics {
  needReview: number;
  requested: number;
  high: number;
  medium: number;
  low: number;
  missingClauses: number;
  noneDeviation: number;
  score: number;
  distribution: DeviationDistribution;
  versionLabel: string;
}

const designOptions: Array<{ value: ComparisonDesignOption; label: string; icon: ReactNode }> = [
  { value: "row-scale", label: "A · Row scale", icon: <List className="h-3.5 w-3.5" /> },
  { value: "side-by-side", label: "Current · Side-by-side", icon: <Columns3 className="h-3.5 w-3.5" /> },
];

const distributionColours: Record<keyof DeviationDistribution, string> = {
  high: "#A32D2D",
  medium: "#BA7517",
  low: "#B4B2A9",
  clean: "#3B6D11",
};

const v5DistributionColours: Record<keyof DeviationDistribution, string> = {
  high: FIRST_ANALYSIS_STATUS_THEME.high.indicatorColor,
  medium: FIRST_ANALYSIS_STATUS_THEME.medium.indicatorColor,
  low: FIRST_ANALYSIS_STATUS_THEME.low.indicatorColor,
  clean: FIRST_ANALYSIS_STATUS_THEME.none.indicatorColor,
};

function isInitiativesV5Route() {
  return typeof window !== "undefined" && window.location.pathname.startsWith("/initiatives-v5");
}

export function DesignOptionSwitcher({
  value,
  onChange,
}: {
  value: ComparisonDesignOption;
  onChange: (value: ComparisonDesignOption) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Comparison design"
      className="flex min-w-0 items-center gap-orbit-xs overflow-x-auto rounded-md border border-border bg-white p-orbit-xxs"
    >
      {designOptions.map((option) => {
        const active = option.value === value;
        return (
          <TabButton
            key={option.value}
            active={active}
            showUnderline={false}
            ariaControls="comparison-work-column"
            onClick={() => onChange(option.value)}
            className={cn(
              "h-6 shrink-0 rounded-[5px] px-orbit-s text-[10px]",
              active ? "bg-[#1a2744] text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <span className="inline-flex items-center gap-orbit-xs">
              {option.icon}
              {option.label}
            </span>
          </TabButton>
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
  activeCategoryLabels?: string[];
  onClearCategory: () => void;
  onClearCategoryFilter?: (category: string) => void;
  activeMetricLabel?: string | null;
  onClearMetric?: () => void;
  activeEvidenceMetric?: EvidenceMetricKey | null;
  onEvidenceMetricSelect?: (metric: EvidenceMetricKey) => void;
  evidenceMetrics?: EvidenceMetricCounts;
}) {
  if (option === "side-by-side" || option === "row-scale") {
    return (
      <div className="mx-auto grid w-full max-w-[1500px] gap-orbit-base px-orbit-base py-orbit-base xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
        <aside className="xl:sticky xl:top-[100px] xl:max-h-[calc(100vh-180px)] xl:self-start xl:overflow-y-auto">
          <section className="overflow-hidden rounded-lg border border-border bg-card p-orbit-base">
            <ComparisonSummaryRail
              panel={panel}
              stripStats={stripStats}
              contractName={contractName}
              supplierName={supplierName}
              leftLabel={leftLabel}
              rightLabel={rightLabel}
              comparisonControl={comparisonControl}
              activeMetric={activeEvidenceMetric}
              onMetricSelect={onEvidenceMetricSelect}
              metrics={evidenceMetrics}
            />
            <CategoryFiltersSection>{categoryPanel}</CategoryFiltersSection>
          </section>
        </aside>
        <div id="comparison-work-column" className="min-w-0 space-y-orbit-base">
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

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-orbit-base px-orbit-base py-orbit-base">
      <section className="grid items-stretch gap-orbit-base xl:grid-cols-2">
        <NarrativeSummary
          stripStats={stripStats}
          activeMetric={activeEvidenceMetric}
          onMetricSelect={onEvidenceMetricSelect}
          metrics={evidenceMetrics}
          grouped
        />
        <VersionMovementCard
          panel={panel}
          leftLabel={leftLabel}
          rightLabel={rightLabel}
          comparisonControl={comparisonControl}
        />
      </section>

      <div className="min-[900px]:flex min-[900px]:items-start min-[900px]:gap-orbit-base">
        <div className="hidden w-60 shrink-0 min-[900px]:block">
          <SidebarFiltersPanel>{categoryRail}</SidebarFiltersPanel>
        </div>
        <div id="comparison-work-column" className="flex min-w-0 flex-1 flex-col gap-orbit-base">
          <div className="min-[900px]:hidden">{categoryStrip}</div>
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

export function FirstAnalysisDesignOptions({
  option,
  metrics,
  clausesToReview,
  visibleCount,
  categoryRail,
  categoryPanel,
  categoryStrip,
  activeMetrics,
  onMetricSelect,
}: {
  option: ComparisonDesignOption;
  metrics: FirstAnalysisMetrics;
  clausesToReview: ReactNode;
  visibleCount: number;
  categoryRail: ReactNode;
  categoryPanel: ReactNode;
  categoryStrip: ReactNode;
  activeCategoryLabel?: string | null;
  activeCategoryLabels?: string[];
  onClearCategory: () => void;
  onClearCategoryFilter?: (category: string) => void;
  activeMetricLabels?: Array<{ key: FirstAnalysisMetricKey; label: string }>;
  onClearMetric: (metric: FirstAnalysisMetricKey) => void;
  onClearAllMetrics: () => void;
  activeMetrics?: FirstAnalysisMetricKey[];
  onMetricSelect?: (metric: FirstAnalysisMetricKey) => void;
}) {
  if (option === "side-by-side" || option === "row-scale") {
    return (
      <div className="mx-auto grid w-full max-w-[1500px] gap-orbit-base px-orbit-base py-orbit-base xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
        <aside className="xl:sticky xl:top-[100px] xl:max-h-[calc(100vh-180px)] xl:self-start xl:overflow-y-auto">
          <section className="overflow-hidden rounded-lg border border-border bg-card p-orbit-base">
            <FirstAnalysisReviewCountPanel visibleCount={visibleCount} />
            <FirstAnalysisSummaryPanel
              metrics={metrics}
              activeMetrics={activeMetrics}
              onMetricSelect={onMetricSelect}
              compact
            />
            <CategoryFiltersSection>{categoryPanel}</CategoryFiltersSection>
          </section>
        </aside>
        <div id="comparison-work-column" className="min-w-0 space-y-orbit-base">
          <FirstAnalysisReviewShell>{clausesToReview}</FirstAnalysisReviewShell>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-orbit-base px-orbit-base py-orbit-base">
      <section className="grid items-stretch gap-orbit-base xl:grid-cols-2">
        <InitialAnalysisSummaryCard
          metrics={metrics}
          activeMetrics={activeMetrics}
          onMetricSelect={onMetricSelect}
        />
        <CurrentRiskProfileCard metrics={metrics} />
      </section>

      <div className="min-[900px]:flex min-[900px]:items-start min-[900px]:gap-orbit-base">
        <div className="hidden w-60 shrink-0 min-[900px]:block">
          <div className="space-y-orbit-base">
            <FirstAnalysisReviewCountPanel visibleCount={visibleCount} />
            <SidebarFiltersPanel>{categoryRail}</SidebarFiltersPanel>
          </div>
        </div>
        <div id="comparison-work-column" className="flex min-w-0 flex-1 flex-col gap-orbit-base">
          <div className="min-[900px]:hidden">{categoryStrip}</div>
          <FirstAnalysisReviewShell>{clausesToReview}</FirstAnalysisReviewShell>
        </div>
      </div>
    </div>
  );
}

function SidebarFiltersPanel({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-orbit-base">
      {children}
    </div>
  );
}

function CategoryFiltersSection({ children }: { children: ReactNode }) {
  return (
    <div className="mt-orbit-base border-t border-border pt-orbit-base">
      <div className="mb-orbit-s">
        <Text as="p" size="Small" variant="Secondary">CLAUSES</Text>
      </div>
      <SidebarFiltersPanel>{children}</SidebarFiltersPanel>
    </div>
  );
}

function InitialAnalysisSummaryCard({
  metrics,
  activeMetrics,
  onMetricSelect,
}: {
  metrics: FirstAnalysisMetrics;
  activeMetrics?: FirstAnalysisMetricKey[];
  onMetricSelect?: (metric: FirstAnalysisMetricKey) => void;
}) {
  const analysisLabel = `${metrics.versionLabel.toUpperCase()} Analysis`;

  return (
    <Card type="Static" padding="Base">
      <div className="flex flex-wrap items-center gap-orbit-s">
        <Text as="p" size="Small" variant="Secondary">{analysisLabel} summary</Text>
        {metrics.requested > 0 && (
          <Badge label={`${metrics.requested} requested`} status="Information" />
        )}
      </div>
      <Text as="p" size="Paragraph" variant="Primary">
        ClauseIQ reviewed this contract for the first time. Review flagged clauses and add requested changes to the supplier CSV.
      </Text>
      <FirstAnalysisMetricGrid
        metrics={metrics}
        activeMetrics={activeMetrics}
        onMetricSelect={onMetricSelect}
        grouped
      />
    </Card>
  );
}

function CurrentRiskProfileCard({ metrics }: { metrics: FirstAnalysisMetrics }) {
  const analysisLabel = `${metrics.versionLabel.toUpperCase()} Analysis`;

  return (
    <Card type="Static" padding="Base">
      <div className="mb-orbit-base flex flex-wrap items-center justify-between gap-orbit-s border-b border-border pb-orbit-base">
        <div>
          <Text as="p" size="Small" variant="Secondary">Current risk profile</Text>
          <Text as="p" size="Small" variant="Secondary">{analysisLabel}</Text>
        </div>
        <Badge label={metrics.versionLabel} status="Information" />
      </div>
      <DistributionSide
        label={analysisLabel}
        score={metrics.score}
        distribution={metrics.distribution}
        current
        large
      />
    </Card>
  );
}

function FirstAnalysisSummaryPanel({
  metrics,
  activeMetrics,
  onMetricSelect,
  compact = false,
}: {
  metrics: FirstAnalysisMetrics;
  activeMetrics?: FirstAnalysisMetricKey[];
  onMetricSelect?: (metric: FirstAnalysisMetricKey) => void;
  compact?: boolean;
}) {
  return (
    <section className="rounded-none border-0 bg-card p-orbit-none">
      <Card type="Static" padding={compact ? "Small" : "Base"} state="Accent">
        <div className="flex items-center gap-orbit-s">
          <RadialIndicator
            status={metrics.score >= 75 ? "Success" : metrics.score >= 50 ? "Warning" : "Error"}
            progress={metrics.score}
            size={32}
            ariaLabel={`${metrics.score} analysis score`}
          />
          <div className="flex items-baseline gap-orbit-s">
            <Headings size="Heading 1" style={{ lineHeight: 1 }}>{metrics.score}</Headings>
            <span className="text-xs leading-none text-muted-foreground">Analysis Score</span>
          </div>
        </div>
        <FirstAnalysisMetricBar metrics={metrics} className="mt-orbit-base" />
      </Card>
      <FirstAnalysisMetricGrid
        metrics={metrics}
        activeMetrics={activeMetrics}
        onMetricSelect={onMetricSelect}
        density="rail"
      />
    </section>
  );
}

function FirstAnalysisReviewCountPanel({ visibleCount: _visibleCount }: { visibleCount: number }) {
  return (
    <div className="mb-orbit-base px-orbit-xs">
      <div className="flex items-center gap-orbit-s">
        <Headings size="Heading 4">Clauses to Review</Headings>
      </div>
    </div>
  );
}

function FirstAnalysisReviewShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div>{children}</div>
  );
}

function WorkflowStack({
  openItems,
  newChanges,
  closedItems,
  unmarkedClauses,
}: {
  openItems: ReactNode;
  newChanges: ReactNode;
  closedItems: ReactNode;
  unmarkedClauses: ReactNode;
}) {
  return (
    <div className="grid gap-orbit-base">
      {openItems}
      {closedItems}
      {newChanges}
      {unmarkedClauses}
    </div>
  );
}

export function ComparisonSummaryRail({
  panel,
  stripStats,
  contractName: _contractName,
  supplierName: _supplierName,
  leftLabel,
  rightLabel,
  comparisonControl,
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
  comparisonControl?: ReactNode;
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
    <section className="rounded-none border-0 bg-card p-orbit-none">
      <div>
        <ScoreHero
          stripStats={stripStats}
          panel={panel}
          leftLabel={leftLabel}
          rightLabel={rightLabel}
          compact
        />
      </div>
      <MetricGrid
        metrics={metricCounts}
        activeMetric={activeMetric}
        onMetricSelect={onMetricSelect}
        density="rail"
      />
      <div className="mt-orbit-base">
        {comparisonControl && <div className="mb-orbit-base">{comparisonControl}</div>}
        <VersionDistributionPair panel={panel} leftLabel={leftLabel} rightLabel={rightLabel} layout="rail" />
      </div>
    </section>
  );
}

function ScoreHero({
  stripStats,
  panel,
  leftLabel,
  rightLabel,
  compact = false,
  className,
  showSentence = true,
}: {
  stripStats: ComparisonStripStats;
  panel: VersionPanelData;
  leftLabel: string;
  rightLabel: string;
  compact?: boolean;
  className?: string;
  showSentence?: boolean;
}) {
  const { comparison } = stripStats;
  const previous = panel.previous ?? {
    version: leftLabel,
    score: panel.current.score - panel.delta,
    band: panel.current.band,
  };
  return (
    <div className={className}>
      <Card type="Static" padding={compact ? "Small" : "Base"} state="Accent">
      <div className="flex items-center justify-between gap-orbit-s">
        <Text as="p" size="Small" variant="Secondary">Score movement</Text>
        <Badge label={`Current ${rightLabel}`} status="Information" />
      </div>
      <div className="mt-orbit-base grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-orbit-s">
        <ScoreSnapshot label={leftLabel} score={previous.score} band={previous.band} />
        <div className="flex min-w-10 flex-col items-center justify-center gap-orbit-xs text-muted-foreground">
          <ArrowRight className="h-4 w-4" />
          <span className={cn("rounded-full px-orbit-s py-orbit-xxs text-[10px] v5-orbit-weight-medium", panel.delta >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
            {panel.delta >= 0 ? "+" : ""}
            {panel.delta} pts
          </span>
        </div>
        <ScoreSnapshot label={rightLabel} score={panel.current.score} band={panel.current.band} current />
      </div>
      {showSentence && (
        <p className="mt-orbit-s text-xs text-muted-foreground">
          {comparison.met} of {comparison.requestedTotal} requested changes met.
        </p>
      )}
      </Card>
    </div>
  );
}

function ScoreSnapshot({
  label,
  score,
  band,
  current = false,
}: {
  label: string;
  score: number;
  band: string;
  current?: boolean;
}) {
  return (
    <Card type="Static" padding="Small" state={current ? "Accent" : "Default"}>
      <div className="flex items-center gap-orbit-xs">
        <span className="truncate text-[10px] v5-orbit-weight-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</span>
        {current && (
          <Badge label="Current" status="Information" />
        )}
      </div>
      <div className="mt-orbit-xs flex items-end gap-orbit-xs">
        <span className="text-2xl v5-orbit-weight-semibold leading-none text-foreground">{score}</span>
        <span className="pb-orbit-xxs text-xs v5-orbit-weight-medium text-muted-foreground">{band}</span>
      </div>
    </Card>
  );
}

function ScoreMovementBadge({ panel }: { panel: VersionPanelData }) {
  return (
    <Chip
      label={`Score ${panel.current.score} vs prior ${panel.delta >= 0 ? "+" : ""}${panel.delta} pts`}
      size="Mini"
      variant={panel.delta >= 0 ? "Success" : "Error"}
      contrast="Low"
    />
  );
}

function VersionMovementCard({
  panel,
  leftLabel,
  rightLabel,
  comparisonControl,
}: {
  panel: VersionPanelData;
  leftLabel: string;
  rightLabel: string;
  comparisonControl: ReactNode;
}) {
  return (
    <Card type="Static" padding="Small">
      <div className="mb-orbit-base flex flex-wrap items-center justify-between gap-orbit-s border-b border-border pb-orbit-base">
        <Text as="p" size="Small" variant="Secondary">Version movement</Text>
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-orbit-s">
          {comparisonControl}
          <ScoreMovementBadge panel={panel} />
        </div>
      </div>
      <VersionDistributionPair panel={panel} leftLabel={leftLabel} rightLabel={rightLabel} layout="movement" />
    </Card>
  );
}

function VersionDistributionPair({
  panel,
  leftLabel,
  rightLabel,
  className,
  layout,
}: {
  panel: VersionPanelData;
  leftLabel: string;
  rightLabel: string;
  className?: string;
  layout: "movement" | "rail" | "hero";
}) {
  const previous = panel.previous ?? {
    version: leftLabel,
    score: panel.current.score - panel.delta,
    band: panel.current.band,
    distribution: panel.current.distribution,
  };
  const isHero = layout === "hero";
  const isStacked = layout === "movement" || layout === "rail";
  const hideScore = layout === "movement" || layout === "rail";
  const showDelta = layout === "hero";
  const large = layout === "hero";

  if (isHero) {
    return (
      <div className={cn("grid w-full gap-orbit-s rounded-lg border border-border bg-white p-orbit-base lg:grid-cols-[minmax(0,1fr)_56px_minmax(0,1fr)] lg:items-stretch", className)}>
        <DistributionSide label={leftLabel} score={previous.score} distribution={previous.distribution} large={large} hideScore={hideScore} unframed />
        <div className="hidden h-full flex-col items-center justify-center gap-orbit-xs text-muted-foreground lg:flex">
          <ArrowRight className="h-4 w-4" />
          {showDelta && (
            <span className={cn("whitespace-nowrap rounded-full px-orbit-s py-orbit-xxs text-[10px] v5-orbit-weight-medium", panel.delta >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
              {panel.delta >= 0 ? "+" : ""}
              {panel.delta} pts
            </span>
          )}
        </div>
        <DistributionSide label={rightLabel} score={panel.current.score} distribution={panel.current.distribution} current large={large} hideScore={hideScore} unframed />
      </div>
    );
  }

  return (
    <div className={cn("grid w-full gap-orbit-base", isStacked ? "grid-cols-1" : "lg:grid-cols-[minmax(0,1fr)_40px_minmax(0,1fr)] lg:items-stretch", className)}>
      <DistributionSide label={leftLabel} score={previous.score} distribution={previous.distribution} large={large} hideScore={hideScore} />
      {!isStacked && (
        <div className="hidden h-full flex-col items-center justify-center gap-orbit-xs text-muted-foreground lg:flex">
          <ArrowRight className="h-4 w-4" />
          {showDelta && (
            <span className={cn("rounded-full px-orbit-s py-orbit-xxs text-[10px] v5-orbit-weight-medium", panel.delta >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
              vs prior{" "}
              {panel.delta >= 0 ? "+" : ""}
              {panel.delta} pts
            </span>
          )}
        </div>
      )}
      <DistributionSide label={rightLabel} score={panel.current.score} distribution={panel.current.distribution} current large={large} hideScore={hideScore} />
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
  const useV5StatusColours = isInitiativesV5Route();
  return (
    <Card
      type="Static"
      padding="Small"
      state={current ? "Accent" : "Default"}
      style={unframed ? { borderColor: "transparent", background: current ? "var(--orbit-color-card-bg-accent)" : "transparent" } : undefined}
    >
      <div className="flex items-center justify-between gap-orbit-base">
        <div className="flex items-center gap-orbit-s">
          <Text as="p" size="Small" variant="Secondary">{label}</Text>
          {current && <Badge label="Current" status="Information" />}
        </div>
        {!hideScore && <p className={cn("v5-orbit-weight-semibold text-foreground", large ? "text-lg" : "text-sm")}>{score}</p>}
      </div>
      <DistributionBar distribution={distribution} className="mt-orbit-base" />
      <div className="mt-orbit-s grid grid-cols-4 gap-orbit-xs text-[9px] text-muted-foreground">
        <span><strong className="text-[#A32D2D]">{distribution.high}</strong> H</span>
        <span><strong className="text-[#854F0B]">{distribution.medium}</strong> M</span>
        <span><strong style={useV5StatusColours ? { color: FIRST_ANALYSIS_STATUS_THEME.low.indicatorColor } : undefined}>{distribution.low}</strong> L</span>
        <span><strong className="text-[#3B6D11]">{distribution.clean}</strong> C</span>
      </div>
    </Card>
  );
}

function DistributionBar({ distribution, className }: { distribution: DeviationDistribution; className?: string }) {
  const total = Math.max(1, distribution.high + distribution.medium + distribution.low + distribution.clean);
  const colours = isInitiativesV5Route() ? v5DistributionColours : distributionColours;
  return (
    <div className={cn("flex h-2 overflow-hidden rounded-full bg-muted", className)}>
      {(Object.keys(distributionColours) as Array<keyof DeviationDistribution>).map((key) => {
        const value = distribution[key];
        if (value <= 0) return null;
        return (
          <span
            key={key}
            className="h-full"
            style={{ width: `${(value / total) * 100}%`, backgroundColor: colours[key] }}
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
  grouped = false,
}: {
  stripStats: ComparisonStripStats;
  className?: string;
  activeMetric?: EvidenceMetricKey | null;
  onMetricSelect?: (metric: EvidenceMetricKey) => void;
  metrics?: EvidenceMetricCounts;
  grouped?: boolean;
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
    <div className={className}>
      <Card type="Static" padding="Base" state="Accent">
      <div className="flex flex-wrap items-center gap-orbit-s">
        <Text as="p" size="Small" variant="Secondary">What changed this round</Text>
        <ProgressPill stripStats={stripStats} />
      </div>
      <Text as="p" size="Paragraph" variant="Primary">
        {comparison.supplierChanges} supplier changes were detected between versions. {comparison.met} of {comparison.requestedTotal} requested changes are met, with {actions.pendingReview} clause{actions.pendingReview === 1 ? "" : "s"} still needing review.
      </Text>
      <MetricGrid
        metrics={metricCounts}
        activeMetric={activeMetric}
        onMetricSelect={onMetricSelect}
        density="inline"
        grouped={grouped}
      />
      </Card>
    </div>
  );
}

function ProgressPill({ stripStats }: { stripStats: ComparisonStripStats }) {
  const { comparison, actions } = stripStats;
  const done = Math.max(0, comparison.requestedTotal + comparison.supplierChanges - actions.pendingReview);
  const total = comparison.requestedTotal + comparison.supplierChanges;
  return (
    <Badge label={`${done} of ${total} reviewed`} status={actions.pendingReview > 0 ? "Warning" : "Success"} />
  );
}

const metricDefinitions: Array<{
  key: EvidenceMetricKey;
  label: string;
  value: keyof EvidenceMetricCounts;
  tone?: "success" | "warning" | "destructive";
  group: "workflow" | "risk";
}> = [
  { key: "open-items", label: "Open items", value: "openItems", group: "workflow" },
  { key: "met", label: "Met", value: "met", tone: "success", group: "workflow" },
  { key: "changes", label: "Supplier changes", value: "supplierChanges", tone: "warning", group: "workflow" },
  { key: "need-action", label: "Need review", value: "needReview", tone: "destructive", group: "workflow" },
  { key: "high", label: "High Deviation", value: "high", tone: "destructive", group: "risk" },
  { key: "medium", label: "Medium Deviation", value: "medium", tone: "warning", group: "risk" },
  { key: "low", label: "Low Deviation", value: "low", group: "risk" },
  { key: "total", label: "Total clauses", value: "totalClauses", group: "risk" },
];

const firstAnalysisMetricDefinitions: Array<{
  key: FirstAnalysisMetricKey;
  label: string;
  value: keyof Pick<FirstAnalysisMetrics, "high" | "medium" | "low" | "missingClauses" | "noneDeviation">;
  tone?: "success" | "warning" | "destructive";
  color: string;
  v5Status: FirstAnalysisStatusKey;
  barColor?: string;
  barBorderColor?: string;
  group: "workflow" | "risk";
}> = [
  { key: "high", label: "High Deviation", value: "high", tone: "destructive", color: "hsl(var(--destructive))", v5Status: "high", group: "risk" },
  { key: "medium", label: "Medium Deviation", value: "medium", tone: "warning", color: "#F0AB00", v5Status: "medium", group: "risk" },
  { key: "low", label: "Low Deviation", value: "low", color: "#5F5E5A", v5Status: "low", group: "risk" },
  { key: "missing", label: "Missing Clauses", value: "missingClauses", color: "hsl(var(--foreground))", v5Status: "missing", barColor: "#ffffff", barBorderColor: "hsl(var(--border))", group: "risk" },
  { key: "none", label: "None Deviation", value: "noneDeviation", tone: "success", color: "#3B6D11", v5Status: "none", group: "risk" },
];

const firstAnalysisMetricBarDefinitions = firstAnalysisMetricDefinitions.filter(
  (definition) => definition.key !== "none",
);

const filterToggleCardStyle: CSSProperties = { boxShadow: "var(--orbit-shadow-none)" };

function FirstAnalysisMetricGrid({
  metrics,
  activeMetrics,
  onMetricSelect,
  density = "inline",
  grouped = false,
}: {
  metrics: FirstAnalysisMetrics;
  activeMetrics?: FirstAnalysisMetricKey[];
  onMetricSelect?: (metric: FirstAnalysisMetricKey) => void;
  density?: "inline" | "rail";
  grouped?: boolean;
}) {
  const activeMetricSet = new Set(activeMetrics ?? []);
  const renderMetricRow = (definition: (typeof firstAnalysisMetricDefinitions)[number]) => {
    const active = activeMetricSet.has(definition.key);
    const value = metrics[definition.value];
    const dotColor = FIRST_ANALYSIS_STATUS_THEME[definition.v5Status].indicatorColor;

    return (
      <ToggleCard
        key={definition.key}
        status={value === 0 ? "Disabled" : active ? "Selected" : "Default"}
        aria-pressed={active}
        aria-label={`${active ? "Remove" : "Add"} ${definition.label} filter, ${value} clauses`}
        onClick={onMetricSelect ? () => onMetricSelect(definition.key) : undefined}
        className="overflow-hidden"
        style={filterToggleCardStyle}
      >
        <span className="flex min-h-8 w-full items-center gap-orbit-s px-orbit-s py-orbit-xs">
          <span className="flex min-w-0 flex-1 items-center gap-orbit-s overflow-hidden" style={{ textAlign: "left" }}>
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: dotColor }}
            />
            <span className="min-w-0 truncate leading-none">
              <Text as="span" size="Small" variant="Secondary">
                {definition.label}
              </Text>
            </span>
          </span>
          <Chip label={String(value)} size="Mini" variant="No Status" contrast="Low" />
        </span>
      </ToggleCard>
    );
  };
  const renderMetric = (definition: (typeof firstAnalysisMetricDefinitions)[number]) => (
      <MetricCell
        key={definition.key}
        label={definition.label}
        value={metrics[definition.value]}
        active={activeMetricSet.has(definition.key)}
        onClick={onMetricSelect ? () => onMetricSelect(definition.key) : undefined}
      />
  );

  if (grouped) {
    const workflowMetrics = firstAnalysisMetricDefinitions.filter((definition) => definition.group === "workflow");
    const riskMetrics = firstAnalysisMetricDefinitions.filter((definition) => definition.group === "risk");
    if (workflowMetrics.length === 0) {
      return (
        <div className="mt-orbit-base rounded-lg border border-border/70 bg-white/60 p-orbit-s">
          <div className="mb-orbit-s">
            <Text as="p" size="Small" variant="Secondary">RISK</Text>
          </div>
          <div className="grid grid-cols-2 gap-orbit-s">
            {riskMetrics.map(renderMetric)}
          </div>
        </div>
      );
    }
    return (
      <div className="mt-orbit-base grid gap-orbit-base lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
        <div className="rounded-lg border border-border/70 bg-white/60 p-orbit-s">
          <div className="mb-orbit-s">
            <Text as="p" size="Small" variant="Secondary">WORKFLOW</Text>
          </div>
          <div className="grid gap-orbit-s">
            {workflowMetrics.map(renderMetric)}
          </div>
        </div>
        <div className="rounded-lg border border-border/70 bg-white/60 p-orbit-s">
          <div className="mb-orbit-s">
            <Text as="p" size="Small" variant="Secondary">RISK</Text>
          </div>
          <div className="grid grid-cols-2 gap-orbit-s">
            {riskMetrics.map(renderMetric)}
          </div>
        </div>
      </div>
    );
  }

  if (density === "rail") {
    return (
      <div className="mt-orbit-base">
        <div
          tabIndex={0}
          className="mb-orbit-xs rounded-md px-orbit-s py-orbit-xs outline-none focus-visible:ring-2 focus-visible:ring-[var(--orbit-color-focus-ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--orbit-color-card-bg-default)]"
        >
          <Text as="p" size="Small" variant="Secondary">DEVIATION LEVEL</Text>
        </div>
        <div className="space-y-orbit-xs">
          {firstAnalysisMetricDefinitions.map(renderMetricRow)}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mt-orbit-base grid gap-orbit-s",
        "grid-cols-2 sm:grid-cols-5",
      )}
    >
      {firstAnalysisMetricDefinitions.map(renderMetric)}
    </div>
  );
}

function MetricGrid({
  metrics,
  activeMetric,
  onMetricSelect,
  density,
  grouped = false,
}: {
  metrics: EvidenceMetricCounts;
  activeMetric?: EvidenceMetricKey | null;
  onMetricSelect?: (metric: EvidenceMetricKey) => void;
  density: "inline" | "rail";
  grouped?: boolean;
}) {
  const renderMetric = (definition: (typeof metricDefinitions)[number]) => (
    <MetricCell
      key={definition.key}
      label={definition.label}
      value={metrics[definition.value]}
      tone={definition.tone}
      active={activeMetric === definition.key || (definition.key === "total" && !activeMetric)}
      onClick={onMetricSelect ? () => onMetricSelect(definition.key) : undefined}
    />
  );

  if (grouped) {
    return (
      <div className="mt-orbit-base grid gap-orbit-base lg:grid-cols-2">
        {(["workflow", "risk"] as const).map((group) => (
          <div key={group} className="rounded-lg border border-border/70 bg-white/60 p-orbit-s">
            <Text as="p" size="Small" variant="Secondary">{group === "workflow" ? "Workflow" : "Risk"}</Text>
            <div className="grid grid-cols-2 gap-orbit-s">
              {metricDefinitions.filter((definition) => definition.group === group).map(renderMetric)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mt-orbit-base grid gap-orbit-s",
        density === "rail" ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4",
      )}
    >
      {metricDefinitions.map(renderMetric)}
    </div>
  );
}

function FirstAnalysisMetricBar({ metrics, className }: { metrics: FirstAnalysisMetrics; className?: string }) {
  const useV5StatusColours = isInitiativesV5Route();
  const total = Math.max(
    1,
    firstAnalysisMetricBarDefinitions.reduce((sum, definition) => sum + metrics[definition.value], 0),
  );

  return (
    <div className={cn("flex h-2 overflow-hidden rounded-full bg-muted", className)}>
      {firstAnalysisMetricBarDefinitions.map((definition) => {
        const value = metrics[definition.value];
        if (value <= 0) return null;

        return (
          <span
            key={definition.key}
            className="h-full"
            aria-label={`${definition.label}: ${value}`}
            style={{
              width: `${(value / total) * 100}%`,
              backgroundColor: useV5StatusColours ? FIRST_ANALYSIS_STATUS_THEME[definition.v5Status].indicatorColor : definition.barColor ?? definition.color,
              border: !useV5StatusColours && definition.barBorderColor ? `1px solid ${definition.barBorderColor}` : undefined,
            }}
          />
        );
      })}
    </div>
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
  const [isHovered, setIsHovered] = useState(false);
  const valueVariant = tone === "destructive" ? "Error" : tone === "warning" ? "Warning" : "Bold";
  const content = (
    <>
      <Text as="p" size="Small" variant="Secondary">{label}</Text>
      <div className="mt-orbit-xs">
        <Text as="p" size="Paragraph" variant={valueVariant}>{value}</Text>
      </div>
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        className={cn(
          "w-full cursor-pointer rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#185FA5]/35",
          active && "shadow-[inset_3px_0_0_var(--orbit-color-efficio-blue)]",
        )}
      >
        <Card type="Static" padding="Small" state={active ? "Accent" : isHovered ? "Highlight" : "Default"} indicator={false}>
          {content}
        </Card>
      </button>
    );
  }

  return (
    <Card type="Static" padding="Small">
      {content}
    </Card>
  );
}
