import { useId, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Info } from "@/components/clauseiq-v6a/v6aIcons";
import { Chip, RadialIndicator, Text } from "@orbit";

import type { ClauseAnalysis, DeviationCounts } from "@/data/mock-clauseiq-v6";
import { cn } from "@/lib/utils";

export type OutputScoreTrend = "up" | "down" | "flat";
type OutputScoreValence = "success" | "danger" | "neutral";

export interface OutputScorePresentation {
  score: number;
  deltaFromPrevious?: number;
  trend: OutputScoreTrend;
  hasPreviousOutput: boolean;
}

const SUPPLIER_OUTPUT_SCORE_BY_ANALYSIS_ID: Record<string, number> = {
  "a-001": 56,
  "a-002": 48,
  "a-003": 36,
  "a-004": 62,
  "a-005": 51,
  "a-006": 78,
  "a-007": 58,
  "a-008": 46,
  "a-009": 74,
};

export function OutputScoreLine({
  score,
  deviations,
  higherIsBetter,
  showComparisonStatus = score.hasPreviousOutput,
  scoreTextClassName = "v6-orbit-text-body v6-orbit-weight-medium",
  showScoreDonut = false,
  showMetadataTooltip = true,
  usePrimaryScoreColor = false,
  textAlignment = "end",
}: {
  score: OutputScorePresentation;
  deviations: DeviationCounts;
  higherIsBetter: boolean;
  showComparisonStatus?: boolean;
  scoreTextClassName?: string;
  showScoreDonut?: boolean;
  showMetadataTooltip?: boolean;
  usePrimaryScoreColor?: boolean;
  textAlignment?: "end" | "center";
}) {
  const delta = score.deltaFromPrevious;
  const rowAlignmentClass = textAlignment === "center" ? "items-center" : "items-end";

  return (
    <div className="flex min-w-0 items-center gap-orbit-xxs">
      {showScoreDonut && (
        <span data-testid="output-score-donut" className="shrink-0">
          <RadialIndicator
            status={scoreBandIndicatorStatus(score.score)}
            progress={score.score}
            size={32}
            ariaLabel={`Score ${score.score}`}
          />
        </span>
      )}
      <div className={cn("flex min-w-0 gap-orbit-s whitespace-nowrap", rowAlignmentClass)}>
        <span
          className={scoreTextClassName}
          style={usePrimaryScoreColor ? primaryScoreTextStyle : scoreBandTextStyle(score.score)}
        >
          Score {score.score}
        </span>
        {!score.hasPreviousOutput || typeof delta !== "number" ? (
          <span className={cn("inline-flex gap-orbit-xs v6-orbit-text-small text-[var(--orbit-color-text-secondary)]", rowAlignmentClass)}>
            <span>first output</span>
            {showMetadataTooltip ? (
              <OutputMetadataTooltip deviations={deviations} />
            ) : null}
          </span>
        ) : delta === 0 ? (
          <span className={cn("inline-flex gap-orbit-xs v6-orbit-text-small text-[var(--orbit-color-text-secondary)]", rowAlignmentClass)}>
            <span>no change</span>
            {showMetadataTooltip ? (
              <OutputMetadataTooltip deviations={deviations} />
            ) : null}
          </span>
        ) : (
          <span className={cn("inline-flex gap-orbit-xs", rowAlignmentClass)}>
            <span
              className={cn(
                "inline-flex gap-orbit-xxs v6-orbit-text-small v6-orbit-weight-medium",
                rowAlignmentClass,
                scoreDeltaValenceTextClass(scoreDeltaValence(delta, higherIsBetter)),
              )}
              aria-label={`${score.trend === "up" ? "Increased" : "Decreased"} by ${Math.abs(delta)} versus previous`}
            >
              <span aria-hidden="true">{score.trend === "up" ? "↗" : "↘"}</span>
              <span>{formatDelta(delta)} vs previous</span>
            </span>
            {showMetadataTooltip ? (
              <OutputMetadataTooltip deviations={deviations} />
            ) : null}
          </span>
        )}
      </div>
    </div>
  );
}

export function OutputFindingsSummary({
  deviations,
  showComparisonStatus,
}: {
  deviations: DeviationCounts;
  showComparisonStatus: boolean;
}) {
  return (
    <div className="flex flex-wrap items-start gap-x-orbit-l gap-y-orbit-base">
      <div className="flex w-fit max-w-full flex-col gap-orbit-s">
        <Text as="span" className="v6-orbit-heading-strong text-[var(--orbit-color-text-primary)]">
          Clause Target Status
        </Text>
        <div className="flex w-fit max-w-full flex-wrap items-center gap-orbit-xs">
          {showComparisonStatus && (
            <>
              <OutputSummaryPill
                label={`Not Met ${Math.max(0, deviations.high + deviations.medium + deviations.low + deviations.missing)}`}
                variant="Error"
              />
              <OutputSummaryPill label={`Met ${deviations.none}`} variant="Success" />
            </>
          )}
          <OutputSummaryPill
            label={`Missing ${deviations.missing}`}
            variant="Outline"
            style={missingClausesPillStyle}
          />
        </div>
      </div>

      <div className="flex w-fit max-w-full flex-col gap-orbit-s">
        <Text as="span" className="v6-orbit-heading-strong text-[var(--orbit-color-text-primary)]">
          Deviation Level
        </Text>
        <div className="min-w-0 flex w-fit max-w-full flex-wrap items-center gap-orbit-xs">
          <OutputSummaryPill label={`High ${deviations.high}`} variant="Error" />
          <OutputSummaryPill label={`Medium ${deviations.medium}`} variant="Warning" />
          <OutputSummaryPill label={`Low ${deviations.low}`} variant="Style 2" style={lowDeviationPillStyle} />
          <OutputSummaryPill label={`None ${deviations.none}`} variant="Success" />
        </div>
      </div>
    </div>
  );
}

export function getSupplierScorePresentationByAnalysisId(
  analyses: ClauseAnalysis[],
): Record<string, OutputScorePresentation> {
  const chronological = [...analyses].sort(
    (a, b) => Date.parse(a.analysedAt) - Date.parse(b.analysedAt),
  );

  return chronological.reduce<Record<string, OutputScorePresentation>>((scores, analysis, index) => {
    const score = scoreForAnalysis(analysis);

    const previousAnalysis = chronological[index - 1];
    const previousScore = previousAnalysis
      ? scoreForAnalysis(previousAnalysis)
      : undefined;
    const hasPreviousOutput = typeof previousScore === "number";
    const deltaFromPrevious = hasPreviousOutput ? score - previousScore : undefined;

    scores[analysis.id] = {
      score,
      deltaFromPrevious,
      trend: scoreTrendFromDelta(deltaFromPrevious ?? 0),
      hasPreviousOutput,
    };
    return scores;
  }, {});
}

function scoreForAnalysis(analysis: ClauseAnalysis): number {
  return SUPPLIER_OUTPUT_SCORE_BY_ANALYSIS_ID[analysis.id] ?? deriveScoreFromDeviations(analysis.deviations);
}

function deriveScoreFromDeviations(deviations: DeviationCounts): number {
  const totalClauses =
    deviations.missing + deviations.high + deviations.medium + deviations.low + deviations.none;

  if (totalClauses === 0) return 100;

  const weightedRisk =
    deviations.missing * 4 + deviations.high * 3 + deviations.medium * 2 + deviations.low;
  const score = Math.round(100 - (weightedRisk / totalClauses) * 30);

  return Math.min(100, Math.max(0, score));
}

function OutputSummaryPill({
  label,
  variant,
  style,
}: {
  label: string;
  variant: "Error" | "Warning" | "No Status" | "Outline" | "Success" | "Style 2";
  style?: CSSProperties;
}) {
  return (
    <span className="inline-flex shrink-0" style={style}>
      <Chip label={label} size="Mini" variant={variant} contrast="Low" />
    </span>
  );
}

function OutputMetadataTooltip({ deviations }: { deviations: DeviationCounts }) {
  const notMet = Math.max(0, deviations.high + deviations.medium + deviations.low + deviations.missing);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ left: number; top: number; above: boolean } | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const tooltipId = useId();
  const showTooltip = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const tooltipWidth = 288;
    const viewportPadding = 8;
    const left = Math.min(
      Math.max(viewportPadding, rect.right - tooltipWidth),
      window.innerWidth - tooltipWidth - viewportPadding,
    );
    const above = rect.top >= 184;
    setPosition({
      left,
      top: above ? rect.top - viewportPadding : rect.bottom + viewportPadding,
      above,
    });
    setOpen(true);
  };
  const hideTooltip = () => setOpen(false);

  return (
    <span
      className="inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label="View output metadata"
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[var(--orbit-color-text-secondary)] transition-colors hover:text-orbit-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orbit-primary"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && position ? createPortal(
        <span
          id={tooltipId}
          role="tooltip"
          className="fixed z-[60] flex w-[288px] flex-col gap-orbit-s rounded-orbit-sm border border-[var(--orbit-color-border-default)] bg-[var(--orbit-color-bg-default)] p-orbit-s text-[var(--orbit-color-text-primary)] shadow-orbit-md"
          style={{
            left: position.left,
            top: position.top,
            transform: position.above ? "translateY(-100%)" : undefined,
          }}
        >
          <span className="block v6-orbit-text-small v6-orbit-weight-semibold text-[var(--orbit-color-text-primary)]">
            Result For This Analysis
          </span>
          <span className="flex flex-col gap-orbit-xs">
            <span className="block v6-orbit-text-small v6-orbit-weight-medium text-[var(--orbit-color-text-primary)]">
              Clause Target Status
            </span>
            <span className="flex flex-wrap items-center gap-orbit-xs">
              <OutputSummaryPill label={`Not Met ${notMet}`} variant="Error" />
              <OutputSummaryPill label={`Met ${deviations.none}`} variant="Success" />
              <OutputSummaryPill label={`Missing ${deviations.missing}`} variant="Outline" style={missingClausesPillStyle} />
            </span>
          </span>
          <span className="block h-px bg-[var(--orbit-color-border-default)]" aria-hidden="true" />
          <span className="flex flex-col gap-orbit-xs">
            <span className="block v6-orbit-text-small v6-orbit-weight-medium text-[var(--orbit-color-text-primary)]">
              Deviation Level
            </span>
            <span className="flex flex-wrap items-center gap-orbit-xs">
              <OutputSummaryPill label={`High ${deviations.high}`} variant="Error" />
              <OutputSummaryPill label={`Medium ${deviations.medium}`} variant="Warning" />
              <OutputSummaryPill label={`Low ${deviations.low}`} variant="Style 2" style={lowDeviationPillStyle} />
              <OutputSummaryPill label={`None ${deviations.none}`} variant="Success" />
            </span>
          </span>
        </span>
      , document.body) : null}
    </span>
  );
}

function scoreTrendFromDelta(delta: number): OutputScoreTrend {
  if (delta > 0) return "up";
  if (delta < 0) return "down";
  return "flat";
}

function scoreDeltaValence(delta: number, higherIsBetter: boolean): OutputScoreValence {
  if (delta === 0) return "neutral";
  return (delta > 0) === higherIsBetter ? "success" : "danger";
}

function scoreDeltaValenceTextClass(valence: OutputScoreValence) {
  if (valence === "success") return "text-[var(--orbit-color-text-success)]";
  if (valence === "danger") return "text-[var(--orbit-color-text-error)]";
  return "text-[var(--orbit-color-text-secondary)]";
}

function formatDelta(delta: number) {
  return delta > 0 ? `+${delta}` : `${delta}`;
}

function scoreBandTextStyle(score: number): CSSProperties {
  if (score <= 39) {
    return { color: "var(--orbit-color-red-ribbon)" };
  }

  if (score <= 59) {
    return { color: "var(--orbit-color-bright-orange)" };
  }

  if (score <= 74) {
    return { color: "var(--orbit-color-web-orange)" };
  }

  if (score <= 89) {
    return { color: "var(--orbit-color-bright-green)" };
  }

  return { color: "var(--orbit-color-text-success)" };
}

function scoreBandIndicatorStatus(score: number): "Error" | "Warning" | "Success" {
  if (score <= 39) return "Error";
  if (score <= 74) return "Warning";
  return "Success";
}


const lowDeviationPillStyle = {
  "--orbit-color-chip-style-2-bg": "#E5EDEE",
  "--orbit-color-chip-style-2-border": "#34585C",
} as CSSProperties;

const missingClausesPillStyle = {
  "--orbit-color-chip-default-border": "var(--orbit-color-card-border-default)",
  color: "var(--orbit-color-text-secondary)",
} as CSSProperties;

const primaryScoreTextStyle = {
  color: "var(--orbit-color-text-primary)",
} as CSSProperties;
