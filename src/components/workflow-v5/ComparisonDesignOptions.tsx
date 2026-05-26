import { useState, type ReactNode } from "react";
import { ArrowRight, Columns3, List } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Chip,
  Filter as OrbitFilter,
  RadialIndicator,
  TabButton,
  Text,
} from "@orbit";

import { cn } from "@/lib/utils";
import type { ComparisonStripStats, DeviationDistribution, VersionPanelData } from "@/lib/clauseiq-v4-comparison";

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
export type FirstAnalysisMetricKey = "high" | "medium" | "low" | "missing";

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
      className="flex min-w-0 items-center gap-1 overflow-x-auto rounded-md border border-border bg-white p-0.5"
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
              "h-6 shrink-0 rounded-[5px] px-2.5 text-[10px]",
              active ? "bg-[#1a2744] text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <span className="inline-flex items-center gap-1.5">
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
  activeCategoryLabel,
  activeCategoryLabels,
  onClearCategory,
  onClearCategoryFilter,
  activeMetricLabel,
  onClearMetric,
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
  const categoryLabels = activeCategoryLabels ?? (activeCategoryLabel ? [activeCategoryLabel] : []);
  const hasActiveFilters = Boolean(activeMetricLabel || categoryLabels.length > 0);
  const activeFilterChips = hasActiveFilters ? (
    <ActiveFilterBar
      activeMetricLabel={activeMetricLabel}
      onClearMetric={onClearMetric}
      activeCategoryLabels={categoryLabels}
      onClearCategory={onClearCategory}
      onClearCategoryFilter={onClearCategoryFilter}
    />
  ) : null;

  if (option === "side-by-side" || option === "row-scale") {
    return (
      <div className="mx-auto grid w-full max-w-[1500px] gap-4 px-6 py-4 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
        <aside className="xl:sticky xl:top-[100px] xl:max-h-[calc(100vh-180px)] xl:self-start xl:overflow-y-auto">
          <section className="overflow-hidden rounded-lg border border-border bg-card p-3">
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
            <CategoryFiltersSection activeFilterChips={activeFilterChips}>{categoryPanel}</CategoryFiltersSection>
          </section>
        </aside>
        <div id="comparison-work-column" className="min-w-0 space-y-4">
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
    <div className="mx-auto w-full max-w-[1500px] space-y-4 px-6 py-4">
      <section className="grid items-stretch gap-4 xl:grid-cols-2">
        <NarrativeSummary
          stripStats={stripStats}
          activeMetric={activeEvidenceMetric}
          onMetricSelect={onEvidenceMetricSelect}
          metrics={evidenceMetrics}
          grouped
          activeFilterChips={activeFilterChips}
        />
        <VersionMovementCard
          panel={panel}
          leftLabel={leftLabel}
          rightLabel={rightLabel}
          comparisonControl={comparisonControl}
        />
      </section>

      <div className="min-[900px]:flex min-[900px]:items-start min-[900px]:gap-4">
        <div className="hidden w-60 shrink-0 min-[900px]:block">
          <SidebarFiltersPanel activeFilterChips={activeFilterChips}>{categoryRail}</SidebarFiltersPanel>
        </div>
        <div id="comparison-work-column" className="flex min-w-0 flex-1 flex-col gap-4">
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
  activeCategoryLabel,
  activeCategoryLabels,
  onClearCategory,
  onClearCategoryFilter,
  activeMetricLabels,
  onClearMetric,
  onClearAllMetrics,
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
  const categoryLabels = activeCategoryLabels ?? (activeCategoryLabel ? [activeCategoryLabel] : []);
  const hasActiveFilters = Boolean(categoryLabels.length > 0 || (activeMetricLabels?.length ?? 0) > 0);
  const clearAllActiveFilters = () => {
    onClearAllMetrics();
    if (categoryLabels.length > 0) onClearCategory();
  };
  const activeFilterChips = hasActiveFilters ? (
    <ActiveFilterBar
      metricFilters={activeMetricLabels ?? []}
      onClearMetricFilter={onClearMetric}
      onClearAllMetrics={clearAllActiveFilters}
      activeCategoryLabels={categoryLabels}
      onClearCategory={onClearCategory}
      onClearCategoryFilter={onClearCategoryFilter}
    />
  ) : null;

  if (option === "side-by-side" || option === "row-scale") {
    return (
      <div className="mx-auto grid w-full max-w-[1500px] gap-4 px-6 py-4 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
        <aside className="xl:sticky xl:top-[100px] xl:max-h-[calc(100vh-180px)] xl:self-start xl:overflow-y-auto">
          <section className="overflow-hidden rounded-lg border border-border bg-card p-3">
            <FirstAnalysisReviewCountPanel visibleCount={visibleCount} />
            <FirstAnalysisSummaryPanel
              metrics={metrics}
              activeMetrics={activeMetrics}
              onMetricSelect={onMetricSelect}
              compact
            />
            <CategoryFiltersSection activeFilterChips={activeFilterChips}>{categoryPanel}</CategoryFiltersSection>
          </section>
        </aside>
        <div id="comparison-work-column" className="min-w-0 space-y-4">
          <FirstAnalysisReviewShell>{clausesToReview}</FirstAnalysisReviewShell>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-4 px-6 py-4">
      <section className="grid items-stretch gap-4 xl:grid-cols-2">
        <InitialAnalysisSummaryCard
          metrics={metrics}
          activeMetrics={activeMetrics}
          onMetricSelect={onMetricSelect}
          activeFilterChips={activeFilterChips}
        />
        <CurrentRiskProfileCard metrics={metrics} />
      </section>

      <div className="min-[900px]:flex min-[900px]:items-start min-[900px]:gap-4">
        <div className="hidden w-60 shrink-0 min-[900px]:block">
          <div className="space-y-3">
            <FirstAnalysisReviewCountPanel visibleCount={visibleCount} />
            <SidebarFiltersPanel activeFilterChips={activeFilterChips}>{categoryRail}</SidebarFiltersPanel>
          </div>
        </div>
        <div id="comparison-work-column" className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="min-[900px]:hidden">{categoryStrip}</div>
          <FirstAnalysisReviewShell>{clausesToReview}</FirstAnalysisReviewShell>
        </div>
      </div>
    </div>
  );
}

function ActiveFilterBar({
  activeMetricLabel,
  onClearMetric,
  metricFilters = [],
  onClearMetricFilter,
  onClearAllMetrics,
  activeCategoryLabel,
  activeCategoryLabels,
  onClearCategory,
  onClearCategoryFilter,
}: {
  activeMetricLabel?: string | null;
  onClearMetric?: () => void;
  metricFilters?: Array<{ key: FirstAnalysisMetricKey; label: string }>;
  onClearMetricFilter?: (metric: FirstAnalysisMetricKey) => void;
  onClearAllMetrics?: () => void;
  activeCategoryLabel?: string | null;
  activeCategoryLabels?: string[];
  onClearCategory: () => void;
  onClearCategoryFilter?: (category: string) => void;
}) {
  const categoryLabels = activeCategoryLabels ?? (activeCategoryLabel ? [activeCategoryLabel] : []);
  const filterCount = (activeMetricLabel ? 1 : 0) + metricFilters.length + categoryLabels.length;
  if (filterCount === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {activeMetricLabel && onClearMetric && (
        <FilterChip label={`Filter: ${activeMetricLabel}`} onClear={onClearMetric} />
      )}
      {metricFilters.map((filter) => (
        <FilterChip
          key={filter.key}
          label={`Filter: ${filter.label}`}
          onClear={() => onClearMetricFilter?.(filter.key)}
        />
      ))}
      {categoryLabels.map((label) => (
        <FilterChip
          key={label}
          label={`Category: ${label}`}
          onClear={() => (onClearCategoryFilter ? onClearCategoryFilter(label) : onClearCategory())}
        />
      ))}
      {filterCount > 1 && onClearAllMetrics && (
        <Button type="button" variant="Tertiary" size="Medium" onClick={onClearAllMetrics}>
          Clear All
        </Button>
      )}
    </div>
  );
}

function SidebarFiltersPanel({
  children,
  activeFilterChips,
}: {
  children: ReactNode;
  activeFilterChips?: ReactNode;
}) {
  return (
    <div className="space-y-3">
      {children}
      <ActiveFiltersSection>{activeFilterChips}</ActiveFiltersSection>
    </div>
  );
}

function CategoryFiltersSection({
  children,
  activeFilterChips,
}: {
  children: ReactNode;
  activeFilterChips?: ReactNode;
}) {
  return (
    <div className="mt-4 border-t border-border pt-3">
      <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Categories
      </p>
      <SidebarFiltersPanel activeFilterChips={activeFilterChips}>{children}</SidebarFiltersPanel>
    </div>
  );
}

function ActiveFiltersSection({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <div className="border-t border-border pt-3">
      <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Active filters
      </p>
      {children}
    </div>
  );
}

function InitialAnalysisSummaryCard({
  metrics,
  activeMetrics,
  onMetricSelect,
  activeFilterChips,
}: {
  metrics: FirstAnalysisMetrics;
  activeMetrics?: FirstAnalysisMetricKey[];
  onMetricSelect?: (metric: FirstAnalysisMetricKey) => void;
  activeFilterChips?: ReactNode;
}) {
  const analysisLabel = `${metrics.versionLabel.toUpperCase()} Analysis`;

  return (
    <Card type="Static" padding="Base">
      <div className="flex flex-wrap items-center gap-2">
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
      <ActiveFiltersSection>{activeFilterChips}</ActiveFiltersSection>
    </Card>
  );
}

function CurrentRiskProfileCard({ metrics }: { metrics: FirstAnalysisMetrics }) {
  const analysisLabel = `${metrics.versionLabel.toUpperCase()} Analysis`;

  return (
    <Card type="Static" padding="Base">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
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
  activeFilterChips,
  compact = false,
}: {
  metrics: FirstAnalysisMetrics;
  activeMetrics?: FirstAnalysisMetricKey[];
  onMetricSelect?: (metric: FirstAnalysisMetricKey) => void;
  activeFilterChips?: ReactNode;
  compact?: boolean;
}) {
  const analysisLabel = `${metrics.versionLabel.toUpperCase()} Analysis`;

  return (
    <section className="rounded-none border-0 bg-card p-0">
      <Card type="Static" padding={compact ? "Small" : "Base"} state="Accent">
        <div className="flex items-center justify-between gap-2">
          <Text as="p" size="Small" variant="Secondary">{analysisLabel}</Text>
          <Badge label={metrics.versionLabel} status="Information" />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <RadialIndicator
            status={metrics.score >= 75 ? "Success" : metrics.score >= 50 ? "Warning" : "Error"}
            progress={metrics.score}
            size={32}
            ariaLabel={`${metrics.score} score`}
          />
          <div className="flex items-end gap-2">
            <span className="text-3xl font-semibold leading-none text-foreground">{metrics.score}</span>
            <Text as="span" size="Small" variant="Secondary">score</Text>
          </div>
        </div>
        <DistributionBar distribution={metrics.distribution} className="mt-3" />
      </Card>
      <FirstAnalysisMetricGrid
        metrics={metrics}
        activeMetrics={activeMetrics}
        onMetricSelect={onMetricSelect}
        density="rail"
      />
      <ActiveFiltersSection>{activeFilterChips}</ActiveFiltersSection>
    </section>
  );
}

function FirstAnalysisReviewCountPanel({ visibleCount }: { visibleCount: number }) {
  return (
    <div className="mb-3 px-1">
      <div className="flex items-center justify-between gap-2">
        <Text as="p" size="Small" variant="Secondary">Clauses to review</Text>
        <Chip label={String(visibleCount)} size="Mini" variant="Outline" />
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

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return <OrbitFilter label={label} onRemove={onClear} />;
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
    <div className="grid gap-4">
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
  activeFilterChips,
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
  activeFilterChips?: ReactNode;
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
    <section className="rounded-none border-0 bg-card p-0">
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
      <ActiveFiltersSection>{activeFilterChips}</ActiveFiltersSection>
      <div className="mt-4">
        {comparisonControl && <div className="mb-3">{comparisonControl}</div>}
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
      <div className="flex items-center justify-between gap-2">
        <Text as="p" size="Small" variant="Secondary">Score movement</Text>
        <Badge label={`Current ${rightLabel}`} status="Information" />
      </div>
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-2">
        <ScoreSnapshot label={leftLabel} score={previous.score} band={previous.band} />
        <div className="flex min-w-10 flex-col items-center justify-center gap-1 text-muted-foreground">
          <ArrowRight className="h-4 w-4" />
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", panel.delta >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
            {panel.delta >= 0 ? "+" : ""}
            {panel.delta} pts
          </span>
        </div>
        <ScoreSnapshot label={rightLabel} score={panel.current.score} band={panel.current.band} current />
      </div>
      {showSentence && (
        <p className="mt-2 text-xs text-muted-foreground">
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
      <div className="flex items-center gap-1.5">
        <span className="truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</span>
        {current && (
          <Badge label="Current" status="Information" />
        )}
      </div>
      <div className="mt-1 flex items-end gap-1.5">
        <span className="text-2xl font-semibold leading-none text-foreground">{score}</span>
        <span className="pb-0.5 text-xs font-medium text-muted-foreground">{band}</span>
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
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <Text as="p" size="Small" variant="Secondary">Version movement</Text>
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
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
      <div className={cn("grid w-full gap-2 rounded-lg border border-border bg-white p-3 lg:grid-cols-[minmax(0,1fr)_56px_minmax(0,1fr)] lg:items-stretch", className)}>
        <DistributionSide label={leftLabel} score={previous.score} distribution={previous.distribution} large={large} hideScore={hideScore} unframed />
        <div className="hidden h-full flex-col items-center justify-center gap-1 text-muted-foreground lg:flex">
          <ArrowRight className="h-4 w-4" />
          {showDelta && (
            <span className={cn("whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium", panel.delta >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
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
    <div className={cn("grid w-full gap-3", isStacked ? "grid-cols-1" : "lg:grid-cols-[minmax(0,1fr)_40px_minmax(0,1fr)] lg:items-stretch", className)}>
      <DistributionSide label={leftLabel} score={previous.score} distribution={previous.distribution} large={large} hideScore={hideScore} />
      {!isStacked && (
        <div className="hidden h-full flex-col items-center justify-center gap-1 text-muted-foreground lg:flex">
          <ArrowRight className="h-4 w-4" />
          {showDelta && (
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", panel.delta >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
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
  return (
    <Card
      type="Static"
      padding="Small"
      state={current ? "Accent" : "Default"}
      style={unframed ? { borderColor: "transparent", background: current ? "var(--orbit-color-card-bg-accent)" : "transparent" } : undefined}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Text as="p" size="Small" variant="Secondary">{label}</Text>
          {current && <Badge label="Current" status="Information" />}
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
    </Card>
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
  activeFilterChips,
  grouped = false,
}: {
  stripStats: ComparisonStripStats;
  className?: string;
  activeMetric?: EvidenceMetricKey | null;
  onMetricSelect?: (metric: EvidenceMetricKey) => void;
  metrics?: EvidenceMetricCounts;
  activeFilterChips?: ReactNode;
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
      <div className="flex flex-wrap items-center gap-2">
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
      <ActiveFiltersSection>{activeFilterChips}</ActiveFiltersSection>
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
  { key: "high", label: "High", value: "high", tone: "destructive", group: "risk" },
  { key: "medium", label: "Medium", value: "medium", tone: "warning", group: "risk" },
  { key: "low", label: "Low", value: "low", group: "risk" },
  { key: "total", label: "Total clauses", value: "totalClauses", group: "risk" },
];

const firstAnalysisMetricDefinitions: Array<{
  key: FirstAnalysisMetricKey;
  label: string;
  value: keyof Pick<FirstAnalysisMetrics, "high" | "medium" | "low" | "missingClauses">;
  tone?: "success" | "warning" | "destructive";
  group: "workflow" | "risk";
}> = [
  { key: "high", label: "High", value: "high", tone: "destructive", group: "risk" },
  { key: "medium", label: "Medium", value: "medium", tone: "warning", group: "risk" },
  { key: "low", label: "Low", value: "low", group: "risk" },
  { key: "missing", label: "Missing Clauses", value: "missingClauses", tone: "destructive", group: "risk" },
];

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
  const renderMetric = (definition: (typeof firstAnalysisMetricDefinitions)[number]) => (
    <MetricCell
      key={definition.key}
      label={definition.label}
      value={metrics[definition.value]}
      tone={definition.tone}
      active={activeMetricSet.has(definition.key)}
      onClick={onMetricSelect ? () => onMetricSelect(definition.key) : undefined}
    />
  );

  if (grouped) {
    const workflowMetrics = firstAnalysisMetricDefinitions.filter((definition) => definition.group === "workflow");
    const riskMetrics = firstAnalysisMetricDefinitions.filter((definition) => definition.group === "risk");
    if (workflowMetrics.length === 0) {
      return (
        <div className="mt-3 rounded-lg border border-border/70 bg-white/60 p-2">
          <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Risk
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {riskMetrics.map(renderMetric)}
          </div>
        </div>
      );
    }
    return (
      <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
        <div className="rounded-lg border border-border/70 bg-white/60 p-2">
          <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Workflow
          </p>
          <div className="grid gap-2 text-[11px]">
            {workflowMetrics.map(renderMetric)}
          </div>
        </div>
        <div className="rounded-lg border border-border/70 bg-white/60 p-2">
          <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Risk
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {riskMetrics.map(renderMetric)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mt-4 grid gap-2 text-[11px]",
        density === "rail" ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-5",
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
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        {(["workflow", "risk"] as const).map((group) => (
          <div key={group} className="rounded-lg border border-border/70 bg-white/60 p-2">
            <Text as="p" size="Small" variant="Secondary">{group === "workflow" ? "Workflow" : "Risk"}</Text>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
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
        "mt-4 grid gap-2 text-[11px]",
        density === "rail" ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4",
      )}
    >
      {metricDefinitions.map(renderMetric)}
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
  const content = (
    <>
      <Text as="p" size="Small" variant="Secondary">{label}</Text>
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
        <Card type="Static" padding="Small" state={active ? "Accent" : isHovered ? "Highlight" : "Default"}>
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
