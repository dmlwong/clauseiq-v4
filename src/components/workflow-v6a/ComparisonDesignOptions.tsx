import { useState, type CSSProperties, type ReactNode } from "react";
import { ArrowRight, ClipboardList, Columns3, Info, List, Sigma, Target } from "@/components/clauseiq-v6a/v6aIcons";
import {
  Badge,
  Card,
  Chip,
  RadialIndicator,
  Text,
  ToggleCard,
} from "@orbit";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/clauseiq-v6a/orbit-ui/tooltip";
import type { ComparisonStripStats, DeviationDistribution, VersionPanelData } from "@/lib/clauseiq-v4-comparison";
import {
  FIRST_ANALYSIS_STATUS_THEME,
  type FirstAnalysisStatusKey,
} from "./firstAnalysisStatusTags";

export type ComparisonDesignOption = "evolved" | "side-by-side" | "row-scale" | "design-option-2";
export type EvidenceMetricKey =
  | "not-met"
  | "met"
  | "no-action"
  | "worsened"
  | "unexpected"
  | "manual-review"
  | "high"
  | "medium"
  | "low"
  | "missing"
  | "none";
export type FirstAnalysisMetricKey = "high" | "medium" | "low" | "missing" | "none";

export interface EvidenceMetricCounts {
  notMet: number;
  met: number;
  noAction: number;
  worsened: number;
  unexpected: number;
  manualReview: number;
  high: number;
  medium: number;
  low: number;
  missingClauses: number;
  noneDeviation: number;
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
  { value: "row-scale", label: "Design option 1", icon: <List className="h-3.5 w-3.5" /> },
  { value: "design-option-2", label: "Design option 2", icon: <Columns3 className="h-3.5 w-3.5" /> },
];

const distributionColours: Record<keyof DeviationDistribution, string> = {
  high: "var(--orbit-color-text-error)",
  medium: "var(--orbit-color-text-warning)",
  low: "var(--orbit-color-text-secondary)",
  clean: "var(--orbit-color-text-success)",
};

const v6DistributionColours: Record<keyof DeviationDistribution, string> = {
  high: FIRST_ANALYSIS_STATUS_THEME.high.indicatorColor,
  medium: FIRST_ANALYSIS_STATUS_THEME.medium.indicatorColor,
  low: FIRST_ANALYSIS_STATUS_THEME.low.indicatorColor,
  clean: FIRST_ANALYSIS_STATUS_THEME.none.indicatorColor,
};

function isInitiativesV6Route() {
  if (typeof window === "undefined") return false;
  return /(?:^|\/)initiatives-v6a(?:\/|$)/.test(
    `${window.location.pathname}${window.location.hash}`,
  );
}

export function DesignOptionSwitcher({
  value,
  onChange,
  showOptionTwo = true,
}: {
  value: ComparisonDesignOption;
  onChange: (value: ComparisonDesignOption) => void;
  showOptionTwo?: boolean;
}) {
  return (
    <div
      role="tablist"
      aria-label="Comparison design"
      className="flex min-w-0 items-center gap-orbit-xs overflow-x-auto rounded-orbit-md border border-orbit-border bg-orbit-card p-orbit-xxs"
    >
      {designOptions.filter((option) => showOptionTwo || option.value !== "design-option-2").map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls="comparison-work-column"
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-6 shrink-0 items-center justify-center rounded-orbit-sm px-orbit-s text-orbit-xs",
              active ? "bg-orbit-heading text-orbit-inverse" : "text-orbit-fg-secondary hover:bg-orbit-surface hover:text-orbit-fg",
            )}
          >
            <span className="inline-flex items-center gap-orbit-xs">
              {option.icon}
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ComparisonDesignOptions({
  option,
  banner,
  introBanner,
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
  noActionItems,
  unmarkedClauses,
  categoryRail,
  categoryPanel,
  categoryStrip,
  activeEvidenceMetric,
  onEvidenceMetricSelect,
  evidenceMetrics,
  simplifyStatusMetrics = false,
  optionTwoDashboard,
}: {
  option: ComparisonDesignOption;
  banner?: ReactNode;
  introBanner?: ReactNode;
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
  noActionItems: ReactNode;
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
  simplifyStatusMetrics?: boolean;
  optionTwoDashboard?: ReactNode;
}) {
  if (option === "design-option-2" && optionTwoDashboard) {
    return <div className="mx-auto w-full max-w-[1800px] px-orbit-base py-orbit-base">{optionTwoDashboard}</div>;
  }

  if (option === "side-by-side" || option === "row-scale") {
    return (
      <div className="mx-auto w-full max-w-[1500px] space-y-orbit-base px-orbit-base py-orbit-base">
        {introBanner}
        <div className="grid gap-orbit-base xl:grid-cols-[304px_minmax(0,1fr)] xl:items-start">
          <aside className="clauseiq-v6a-comparison-sticky-rail xl:self-start">
            <section className="clauseiq-v6a-comparison-sticky-rail-panel flex overflow-hidden rounded-orbit-lg border border-orbit-border bg-orbit-card xl:flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto p-orbit-base">
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
                  simplifyStatusMetrics={simplifyStatusMetrics}
                />
                <CategoryFiltersSection>{categoryPanel}</CategoryFiltersSection>
              </div>
            </section>
          </aside>
          <div id="comparison-work-column" className="min-w-0 space-y-orbit-base">
            {banner}
            <WorkflowStack
              openItems={openItems}
              newChanges={newChanges}
              closedItems={closedItems}
              noActionItems={noActionItems}
              unmarkedClauses={unmarkedClauses}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-orbit-base px-orbit-base py-orbit-base">
      {introBanner}
      <section className="grid items-stretch gap-orbit-base xl:grid-cols-2">
        <NarrativeSummary
          stripStats={stripStats}
          activeMetric={activeEvidenceMetric}
          onMetricSelect={onEvidenceMetricSelect}
          metrics={evidenceMetrics}
          grouped
          simplifyStatusMetrics={simplifyStatusMetrics}
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
          {banner}
          <WorkflowStack
            openItems={openItems}
            newChanges={newChanges}
            closedItems={closedItems}
            noActionItems={noActionItems}
            unmarkedClauses={unmarkedClauses}
          />
        </div>
      </div>
    </div>
  );
}

export function FirstAnalysisDesignOptions({
  option,
  banner,
  metrics,
  clausesToReview,
  categoryRail,
  categoryPanel,
  categoryStrip,
  activeMetrics,
  onMetricSelect,
  optionTwoFilters,
  optionTwoBulkBanner,
}: {
  option: ComparisonDesignOption;
  banner?: ReactNode;
  metrics: FirstAnalysisMetrics;
  clausesToReview: ReactNode;
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
  optionTwoFilters?: ReactNode;
  optionTwoBulkBanner?: ReactNode;
}) {
  if (option === "design-option-2") {
    return (
      <div className="mx-auto w-full max-w-[1800px] space-y-orbit-base px-orbit-base py-orbit-base">
        <Card type="Static" padding="Base" state="Default" indicator={false} style={{ width: "100%" }}>
          <div className="space-y-orbit-base">
            <h1 className="v6-orbit-heading-strong text-orbit-fg">Latest Analysis</h1>
            {banner ? <div className="clauseiq-v6a-summary-banner">{banner}</div> : null}
            <div className="grid gap-orbit-base md:grid-cols-3">
              <InitialAnalysisOptionTwoMetric icon={<ClipboardList className="h-5 w-5" aria-hidden="true" />} label="Review needed" value={metrics.needReview} detail="clauses need a decision" tone="warning" />
              <InitialAnalysisOptionTwoMetric icon={<Target className="h-5 w-5" aria-hidden="true" />} label="Requested" value={metrics.requested} detail="positions selected" tone="information" />
              <InitialAnalysisOptionTwoMetric icon={<Sigma className="h-5 w-5" aria-hidden="true" />} label="ClauseIQ score" value={metrics.score} detail={`${metrics.versionLabel.toUpperCase()} initial analysis`} tone="default" />
            </div>
            <div>{optionTwoFilters}</div>
          </div>
        </Card>
        {optionTwoBulkBanner}
        <FirstAnalysisReviewShell>{clausesToReview}</FirstAnalysisReviewShell>
      </div>
    );
  }

  if (option === "side-by-side" || option === "row-scale") {
    return (
      <div className="mx-auto grid w-full max-w-[1500px] gap-orbit-base px-orbit-base py-orbit-base xl:grid-cols-[304px_minmax(0,1fr)] xl:items-start">
        {banner ? <div className="min-w-0 xl:col-span-2">{banner}</div> : null}
        <aside className="clauseiq-v6a-comparison-sticky-rail xl:self-start">
          <section className="clauseiq-v6a-comparison-sticky-rail-panel flex overflow-hidden rounded-orbit-lg border border-orbit-border bg-orbit-card xl:flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto p-orbit-base">
              <FirstAnalysisSummaryPanel
                metrics={metrics}
                activeMetrics={activeMetrics}
                onMetricSelect={onMetricSelect}
                compact
              />
              <CategoryFiltersSection>{categoryPanel}</CategoryFiltersSection>
            </div>
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
            <SidebarFiltersPanel>{categoryRail}</SidebarFiltersPanel>
          </div>
        </div>
        <div id="comparison-work-column" className="flex min-w-0 flex-1 flex-col gap-orbit-base">
          <div className="min-[900px]:hidden">{categoryStrip}</div>
          {banner}
          <FirstAnalysisReviewShell>{clausesToReview}</FirstAnalysisReviewShell>
        </div>
      </div>
    </div>
  );
}

function InitialAnalysisOptionTwoMetric({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  detail: string;
  tone: "default" | "information" | "warning";
}) {
  const valueClass = tone === "warning"
    ? "text-orbit-warning"
    : tone === "information"
    ? "text-orbit-info"
    : "text-orbit-fg";
  const iconClass = "bg-orbit-info-surface text-orbit-info";
  return (
    <Card type="Static" padding="Base" state="Default" indicator={false} style={{ height: "100%" }}>
      <div className="flex items-start justify-between gap-orbit-s">
        <p className="text-orbit-xs v6-orbit-weight-semibold uppercase tracking-wide text-orbit-fg-secondary">{label}</p>
        <span className={cn("inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-orbit-md", iconClass)}>{icon}</span>
      </div>
      <p className={cn("mt-orbit-xs text-orbit-xl v6-orbit-weight-semibold", valueClass)}>{value}</p>
      <p className="mt-orbit-xxs v6-orbit-text-small text-orbit-fg-secondary">{detail}</p>
    </Card>
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
    <div className="mt-orbit-base pt-orbit-base">
      <div className="mb-orbit-s">
        <p className="v6-orbit-text-small v6-orbit-weight-semibold text-[var(--orbit-color-text-secondary)]">Clause</p>
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
      <div className="mb-orbit-base flex flex-wrap items-center justify-between gap-orbit-s border-b border-orbit-border pb-orbit-base">
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
  const versionLabel = metrics.versionLabel.toUpperCase();
  return (
    <section className="rounded-orbit-none border-0 bg-orbit-card p-orbit-none">
      <Card type="Static" padding={compact ? "Small" : "Base"} state="Accent">
        <div className="space-y-orbit-s px-orbit-xs py-orbit-xs">
          <div className="flex min-w-0 items-center justify-between gap-orbit-base">
            <Text as="p" size="Paragraph" variant="Secondary">Score</Text>
            <div className="flex shrink-0 justify-end text-right">
              <Chip
                label={`Initial Analysis · ${versionLabel}`}
                size="Mini"
                variant="Information"
                contrast="Low"
              />
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-orbit-xs">
            <span data-testid="first-analysis-score-donut" className="shrink-0 self-center">
              <RadialIndicator
                status={scoreBandIndicatorStatus(metrics.score)}
                progress={metrics.score}
                size={40}
                ariaLabel={`Score ${metrics.score}`}
              />
            </span>
            <span className="v6-orbit-heading-1 text-orbit-fg">{metrics.score}</span>
          </div>
        </div>
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
  noActionItems,
  unmarkedClauses,
}: {
  openItems: ReactNode;
  newChanges: ReactNode;
  closedItems: ReactNode;
  noActionItems: ReactNode;
  unmarkedClauses: ReactNode;
}) {
  return (
    <div className="grid gap-orbit-base">
      {openItems}
      {closedItems}
      {newChanges}
      {noActionItems}
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
  simplifyStatusMetrics = false,
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
  simplifyStatusMetrics?: boolean;
}) {
  const { contract, comparison, actions } = stripStats;
  const metricCounts = metrics ?? {
    notMet: comparison.notMet,
    met: comparison.met,
    noAction: 0,
    worsened: comparison.regressed,
    unexpected: comparison.new,
    manualReview: actions.pendingReview,
    high: contract.high,
    medium: contract.medium,
    low: contract.low,
    missingClauses: 0,
    noneDeviation: contract.distribution.clean,
  };
  return (
    <section className="rounded-orbit-none border-0 bg-orbit-card p-orbit-none">
      <div>
        <ScoreHero
          stripStats={stripStats}
          panel={panel}
          leftLabel={leftLabel}
          rightLabel={rightLabel}
          comparisonControl={comparisonControl}
          compact
        />
      </div>
      <MetricGrid
        metrics={metricCounts}
        activeMetric={activeMetric}
        onMetricSelect={onMetricSelect}
        density="rail"
        simplifyStatusMetrics={simplifyStatusMetrics}
      />
    </section>
  );
}

function ScoreHero({
  stripStats,
  panel,
  leftLabel,
  rightLabel,
  comparisonControl,
  compact = false,
  className,
  showSentence = true,
}: {
  stripStats: ComparisonStripStats;
  panel: VersionPanelData;
  leftLabel: string;
  rightLabel: string;
  comparisonControl?: ReactNode;
  compact?: boolean;
  className?: string;
  showSentence?: boolean;
}) {
  const previous = panel.previous ?? {
    version: leftLabel,
    score: panel.current.score - panel.delta,
    band: panel.current.band,
  };
  const deltaPrefix = panel.delta > 0 ? "+" : "";
  const scoreDirectionLabel =
    panel.delta > 0 ? "Improved" : panel.delta < 0 ? "Declined" : "Unchanged";
  const currentVersionLabel = rightLabel.toUpperCase();
  const previousVersionLabel = leftLabel.toUpperCase();
  const deltaToneClass =
    panel.delta > 0
      ? "text-[var(--orbit-color-text-success)]"
      : panel.delta < 0
        ? "text-[var(--orbit-color-text-error)]"
        : "text-[var(--orbit-color-text-secondary)]";
  const deltaTrendGlyph = panel.delta > 0 ? "↗" : panel.delta < 0 ? "↘" : null;
  const deltaLabel = panel.delta === 0 ? "no change" : `${deltaPrefix}${panel.delta} vs previous`;
  return (
    <div className={cn("clauseiq-v6a-score-hero", className)}>
      <Card type="Static" padding={compact ? "Small" : "Base"} state="Accent">
        <div className="space-y-orbit-s px-orbit-xs py-orbit-xs">
          <div className="flex min-w-0 items-center justify-between gap-orbit-base">
            <Text as="p" size="Paragraph" variant="Secondary">
              Score
            </Text>
            <div className="flex shrink-0 justify-end text-right">
              <Chip
                label={`Latest Analysis · ${currentVersionLabel}`}
                size="Mini"
                variant="Information"
                contrast="Low"
              />
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-orbit-xs">
            <span data-testid="comparison-score-donut" className="shrink-0 self-center">
              <RadialIndicator
                status={scoreBandIndicatorStatus(panel.current.score)}
                progress={panel.current.score}
                size={40}
                ariaLabel={`Score ${panel.current.score}`}
              />
            </span>
            <span className="v6-orbit-heading-1 text-orbit-fg">
              {panel.current.score}
            </span>
            <span
              className={cn(
                "mb-1.5 inline-flex shrink-0 self-end items-center gap-orbit-xxs v6-orbit-text-small v6-orbit-weight-medium",
                deltaToneClass,
              )}
              aria-label={
                panel.delta > 0
                  ? `Increased by ${Math.abs(panel.delta)} versus previous`
                  : panel.delta < 0
                    ? `Decreased by ${Math.abs(panel.delta)} versus previous`
                    : "No change versus previous"
              }
            >
              {deltaTrendGlyph ? <span aria-hidden="true">{deltaTrendGlyph}</span> : null}
              <span>{deltaLabel}</span>
            </span>
          </div>
          <Text as="p" size="Paragraph" variant="Secondary">
            {scoreDirectionLabel} from{" "}
            <span className="v6-orbit-weight-bold text-orbit-fg">{previous.score}</span>
            <span aria-hidden="true"> · </span>
            was {previousVersionLabel}
          </Text>
        </div>
      </Card>
    </div>
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

function scoreBandIndicatorStatus(score: number): "Error" | "Warning" | "Success" {
  if (score <= 39) return "Error";
  if (score <= 74) return "Warning";
  return "Success";
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
    <Card type="Static" padding="Small" style={{ overflow: "visible" }}>
      <div className="mb-orbit-base flex flex-wrap items-center justify-between gap-orbit-s border-b border-orbit-border pb-orbit-base">
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
      <div className={cn("grid w-full gap-orbit-s rounded-orbit-lg border border-orbit-border bg-orbit-card p-orbit-base lg:grid-cols-[minmax(0,1fr)_56px_minmax(0,1fr)] lg:items-stretch", className)}>
        <DistributionSide label={leftLabel} score={previous.score} distribution={previous.distribution} large={large} hideScore={hideScore} unframed />
        <div className="hidden h-full flex-col items-center justify-center gap-orbit-xs text-orbit-fg-secondary lg:flex">
          <ArrowRight className="h-4 w-4" />
          {showDelta && (
            <span className={cn("whitespace-nowrap rounded-full px-orbit-s py-orbit-xxs text-orbit-xs v6-orbit-weight-medium", panel.delta >= 0 ? "bg-orbit-success/10 text-orbit-success" : "bg-orbit-destructive/10 text-orbit-destructive")}>
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
        <div className="hidden h-full flex-col items-center justify-center gap-orbit-xs text-orbit-fg-secondary lg:flex">
          <ArrowRight className="h-4 w-4" />
          {showDelta && (
            <span className={cn("rounded-full px-orbit-s py-orbit-xxs text-orbit-xs v6-orbit-weight-medium", panel.delta >= 0 ? "bg-orbit-success/10 text-orbit-success" : "bg-orbit-destructive/10 text-orbit-destructive")}>
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
  const useV6StatusColours = isInitiativesV6Route();
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
        {!hideScore && <p className={cn("v6-orbit-weight-semibold text-orbit-fg", large ? "text-orbit-lg" : "text-orbit-sm")}>{score}</p>}
      </div>
      <DistributionBar distribution={distribution} className="mt-orbit-base" />
      <div className="mt-orbit-s grid grid-cols-4 gap-orbit-xs text-orbit-xs text-orbit-fg-secondary">
        <span><strong className="text-orbit-error">{distribution.high}</strong> H</span>
        <span><strong className="text-orbit-warning">{distribution.medium}</strong> M</span>
        <span><strong style={useV6StatusColours ? { color: FIRST_ANALYSIS_STATUS_THEME.low.indicatorColor } : undefined}>{distribution.low}</strong> L</span>
        <span><strong className="text-orbit-success">{distribution.clean}</strong> C</span>
      </div>
    </Card>
  );
}

function DistributionBar({ distribution, className }: { distribution: DeviationDistribution; className?: string }) {
  const total = Math.max(1, distribution.high + distribution.medium + distribution.low + distribution.clean);
  const colours = isInitiativesV6Route() ? v6DistributionColours : distributionColours;
  return (
    <div className={cn("flex h-2 overflow-hidden rounded-full bg-orbit-surface", className)}>
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
  simplifyStatusMetrics = false,
}: {
  stripStats: ComparisonStripStats;
  className?: string;
  activeMetric?: EvidenceMetricKey | null;
  onMetricSelect?: (metric: EvidenceMetricKey) => void;
  metrics?: EvidenceMetricCounts;
  grouped?: boolean;
  simplifyStatusMetrics?: boolean;
}) {
  const { contract, comparison, actions } = stripStats;
  const metricCounts = metrics ?? {
    notMet: comparison.notMet,
    met: comparison.met,
    worsened: comparison.regressed,
    unexpected: comparison.new,
    manualReview: actions.pendingReview,
    high: contract.high,
    medium: contract.medium,
    low: contract.low,
    missingClauses: 0,
    noneDeviation: contract.distribution.clean,
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
        simplifyStatusMetrics={simplifyStatusMetrics}
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
  group: "changes" | "risk";
}> = [
  { key: "met", label: "Met", value: "met", tone: "success", group: "changes" },
  { key: "not-met", label: "Not Met", value: "notMet", tone: "destructive", group: "changes" },
  { key: "missing", label: "Missing", value: "missingClauses", group: "changes" },
  { key: "no-action", label: "No Further Action", value: "noAction", group: "changes" },
  { key: "worsened", label: "Regressed", value: "worsened", tone: "destructive", group: "changes" },
  { key: "unexpected", label: "New supplier change", value: "unexpected", tone: "warning", group: "changes" },
  { key: "manual-review", label: "Needs decision", value: "manualReview", tone: "destructive", group: "changes" },
  { key: "high", label: "High", value: "high", tone: "destructive", group: "risk" },
  { key: "medium", label: "Medium", value: "medium", tone: "warning", group: "risk" },
  { key: "low", label: "Low", value: "low", group: "risk" },
  { key: "none", label: "None", value: "noneDeviation", tone: "success", group: "risk" },
];

const firstAnalysisMetricDefinitions: Array<{
  key: FirstAnalysisMetricKey;
  label: string;
  value: keyof Pick<FirstAnalysisMetrics, "high" | "medium" | "low" | "missingClauses" | "noneDeviation">;
  tone?: "success" | "warning" | "destructive";
  color: string;
  v6Status: FirstAnalysisStatusKey;
  group: "workflow" | "risk";
}> = [
  { key: "high", label: "High", value: "high", tone: "destructive", color: "var(--orbit-color-text-error)", v6Status: "high", group: "risk" },
  { key: "medium", label: "Medium", value: "medium", tone: "warning", color: "var(--orbit-color-text-warning)", v6Status: "medium", group: "risk" },
  { key: "low", label: "Low", value: "low", color: "var(--orbit-color-text-secondary)", v6Status: "low", group: "risk" },
  { key: "missing", label: "Missing Clauses", value: "missingClauses", color: "var(--orbit-color-text-primary)", v6Status: "missing", group: "risk" },
  { key: "none", label: "None", value: "noneDeviation", tone: "success", color: "var(--orbit-color-text-success)", v6Status: "none", group: "risk" },
];

const filterToggleCardStyle: CSSProperties = { boxShadow: "var(--orbit-shadow-none)" };
type V6aToggleCardStatus = "Default" | "Hover" | "Selected" | "Disabled" | "Subtle";
const v6aDisabledToggleCardClassName = "clauseiq-v6a-togglecard-disabled";

function getV6aToggleCardStatus({ active, disabled }: { active: boolean; disabled: boolean }): V6aToggleCardStatus {
  if (disabled) return "Disabled";
  if (active) return "Selected";
  return "Default";
}

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
    const disabled = value === 0;
    const toggleCardStatus = getV6aToggleCardStatus({ active, disabled });
    const label = definition.key === "missing" ? "Missing" : definition.label;

    return (
      <ToggleCard
        key={definition.key}
        status={toggleCardStatus as React.ComponentProps<typeof ToggleCard>["status"]}
        aria-pressed={active}
        aria-label={`${active ? "Remove" : "Add"} ${definition.label} filter, ${value} clauses`}
        onClick={onMetricSelect ? () => onMetricSelect(definition.key) : undefined}
        className={cn("overflow-hidden", disabled ? v6aDisabledToggleCardClassName : !active && "clauseiq-v6a-togglecard-subtle")}
        style={filterToggleCardStyle}
      >
        <span className="flex min-h-8 w-full items-center gap-orbit-s px-orbit-s py-orbit-xs">
          <span className="min-w-0 flex-1 truncate" style={{ textAlign: "left" }}>
            <Text as="span" size="Small" variant={disabled ? "Disabled" : "Secondary"}>
              {label}
            </Text>
          </span>
          <Chip label={String(value)} size="Mini" variant={disabled ? "Disabled" : "No Status"} contrast="Low" />
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
        <div className="mt-orbit-base rounded-orbit-lg border border-orbit-border/70 bg-orbit-card/60 p-orbit-s">
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
        <div className="rounded-orbit-lg border border-orbit-border/70 bg-orbit-card/60 p-orbit-s">
          <div className="mb-orbit-s">
            <Text as="p" size="Small" variant="Secondary">WORKFLOW</Text>
          </div>
          <div className="grid gap-orbit-s">
            {workflowMetrics.map(renderMetric)}
          </div>
        </div>
        <div className="rounded-orbit-lg border border-orbit-border/70 bg-orbit-card/60 p-orbit-s">
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
    const missingMetric = firstAnalysisMetricDefinitions.find((definition) => definition.key === "missing");
    const deviationMetrics = firstAnalysisMetricDefinitions.filter((definition) => definition.key !== "missing");
    const renderSectionTitle = (title: "Review status" | "Deviation Level", description: ReactNode) => (
      <div className="flex min-w-0 items-center gap-orbit-xs">
        <p className="v6-orbit-text-small v6-orbit-weight-semibold text-[var(--orbit-color-text-secondary)]">{title}</p>
        <Tooltip>
          <TooltipTrigger>
            <button
              type="button"
              aria-label={`${title} help`}
              className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[var(--orbit-color-text-secondary)] transition-colors hover:text-[var(--orbit-color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orbit-color-border-focus)]"
            >
              <Info className="h-3 w-3" aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-[380px]">{description}</TooltipContent>
        </Tooltip>
      </div>
    );

    return (
      <div className="mt-orbit-base">
        <div className="space-y-orbit-base">
          {missingMetric && (
            <div>
              <div className="mb-orbit-xs rounded-orbit-md py-orbit-xs">
                {renderSectionTitle("Review status", <p className="text-orbit-xs">Missing means the expected clause was not found.</p>)}
              </div>
              <div className="space-y-orbit-xs">{renderMetricRow(missingMetric)}</div>
            </div>
          )}
          <div>
            <div className="mb-orbit-xs rounded-orbit-md py-orbit-xs">
              {renderSectionTitle("Deviation Level", <p className="text-orbit-xs">How far the contract differs from best practice.</p>)}
            </div>
            <div className="space-y-orbit-xs">{deviationMetrics.map(renderMetricRow)}</div>
          </div>
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
  simplifyStatusMetrics = false,
}: {
  metrics: EvidenceMetricCounts;
  activeMetric?: EvidenceMetricKey | null;
  onMetricSelect?: (metric: EvidenceMetricKey) => void;
  density: "inline" | "rail";
  grouped?: boolean;
  simplifyStatusMetrics?: boolean;
}) {
  const visibleMetricDefinitions = simplifyStatusMetrics
    ? metricDefinitions.filter((definition) =>
      definition.key !== "worsened" && definition.key !== "unexpected" && definition.key !== "manual-review")
    : metricDefinitions;
  const renderMetricRow = (definition: (typeof metricDefinitions)[number], label = definition.label) => {
    const value = metrics[definition.value];
    const active = activeMetric === definition.key;
    const disabled = value === 0;
    const toggleCardStatus = getV6aToggleCardStatus({ active, disabled });

    return (
      <ToggleCard
        key={definition.key}
        status={toggleCardStatus as React.ComponentProps<typeof ToggleCard>["status"]}
        aria-pressed={active}
        aria-label={`${active ? "Remove" : "Add"} ${definition.label} outcome filter, ${value} clauses`}
        onClick={onMetricSelect && !disabled ? () => onMetricSelect(definition.key) : undefined}
        className={cn("overflow-hidden", disabled ? v6aDisabledToggleCardClassName : !active && "clauseiq-v6a-togglecard-subtle")}
        style={filterToggleCardStyle}
      >
        <span className="flex w-full items-center gap-orbit-s px-orbit-s py-orbit-xs">
          <span className="min-w-0 flex-1 truncate" style={{ textAlign: "left" }}>
            <Text as="span" size="Small" variant={disabled ? "Disabled" : "Secondary"}>
              {label}
            </Text>
          </span>
          <Chip label={String(value)} size="Mini" variant={disabled ? "Disabled" : "No Status"} contrast="Low" />
        </span>
      </ToggleCard>
    );
  };
  const renderMetric = (definition: (typeof metricDefinitions)[number]) => (
    <MetricCell
      key={definition.key}
      label={definition.label}
      value={metrics[definition.value]}
      tone={definition.tone}
      active={activeMetric === definition.key}
      onClick={onMetricSelect ? () => onMetricSelect(definition.key) : undefined}
    />
  );

  const groupedMetricSections: Array<{ title: string; keys: EvidenceMetricKey[] }> = [
    { title: "Review status", keys: ["met", "not-met", "missing", "no-action"] },
    { title: "Deviation Level", keys: ["high", "medium", "low", "none"] },
  ];
  const fullGroupedMetricSections: Array<{ title: string; keys: EvidenceMetricKey[] }> = [
    { title: "Review status", keys: ["met", "not-met", "missing", "no-action"] },
    { title: "Work needed", keys: ["manual-review"] },
    { title: "System detection", keys: ["unexpected", "worsened"] },
    { title: "Deviation Level", keys: ["high", "medium", "low", "none"] },
  ];
  const sections = simplifyStatusMetrics ? groupedMetricSections : fullGroupedMetricSections;
  const metricByKey = new Map(visibleMetricDefinitions.map((definition) => [definition.key, definition]));
  const metricSectionTooltipCopy: Record<string, ReactNode> = {
    "Review status": (
      <div className="space-y-orbit-xs text-orbit-xs">
        {/* font-orbit-semibold, not v6-orbit-weight-semibold: tooltip content is
            portaled outside the [data-prototype] root the scoped class needs. */}
        <p className="font-orbit-semibold">Review status groups clauses by their outcome in this round:</p>
        <p>Met means the current clause meets the target position.</p>
        <p>Not Met means it does not meet the latest target position.</p>
        <p>Missing means the expected clause was not found.</p>
        <p>No Further Action means the clause is not being negotiated this round.</p>
      </div>
    ),
    "Deviation Level": (
      <div className="space-y-orbit-xs text-orbit-xs">
        <p className="font-orbit-semibold">Deviation Level - How far the contract differs from best practice.</p>
        <p>None - Matches best practice. No change needed.</p>
        <p>Low - Minor difference. Small improvement recommended.</p>
        <p>Medium - Meaningful difference. Creates a notable legal, commercial, or operational issue.</p>
        <p>High - Major difference. Creates significant buyer risk or loss of protection.</p>
      </div>
    ),
  };
  const renderSectionTitle = (title: string) => {
    const tooltip = metricSectionTooltipCopy[title];
    return (
      <div className="flex min-w-0 items-center gap-orbit-xs">
        <p className="v6-orbit-text-small v6-orbit-weight-semibold text-[var(--orbit-color-text-secondary)]">{title}</p>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger>
              <button
                type="button"
                aria-label={`${title} help`}
                className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[var(--orbit-color-text-secondary)] transition-colors hover:text-[var(--orbit-color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orbit-color-border-focus)]"
              >
                <Info className="h-3 w-3" aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-[380px]">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    );
  };

  if (grouped) {
    return (
      <div className="mt-orbit-base grid gap-orbit-base lg:grid-cols-2">
        {sections.map((section) => (
          <div key={section.title} className="rounded-orbit-lg border border-orbit-border/70 bg-orbit-card/60 p-orbit-s">
            {renderSectionTitle(section.title)}
            <div className="grid grid-cols-2 gap-orbit-s">
              {section.keys.map((key) => metricByKey.get(key)).filter((definition): definition is (typeof metricDefinitions)[number] => Boolean(definition)).map(renderMetric)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (density === "rail") {
    return (
      <div className="mt-orbit-base">
        <div className="space-y-orbit-base">
          {sections.map((section) => (
          <div key={section.title}>
            <div className="mb-orbit-xs rounded-orbit-md py-orbit-xs">
              {renderSectionTitle(section.title)}
            </div>
            <div className="space-y-orbit-xs">
              {section.keys
                .map((key) => metricByKey.get(key))
                .filter((definition): definition is (typeof metricDefinitions)[number] => Boolean(definition))
                .map((definition) => renderMetricRow(definition))}
            </div>
          </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mt-orbit-base grid gap-orbit-s",
        "grid-cols-2 sm:grid-cols-4",
      )}
    >
      {visibleMetricDefinitions.map(renderMetric)}
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
          "w-full cursor-pointer rounded-orbit-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orbit-info/35",
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
