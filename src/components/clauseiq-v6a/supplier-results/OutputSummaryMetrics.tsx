import type { CSSProperties } from "react";
import { Info } from "@/components/clauseiq-v6a/v6aIcons";
import { Chip, RadialIndicator, Text } from "@orbit";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/clauseiq-v6a/orbit-ui/tooltip";
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
              <OutputMetadataTooltip score={score} deviations={deviations} showComparisonStatus={showComparisonStatus} />
            ) : null}
          </span>
        ) : delta === 0 ? (
          <span className={cn("inline-flex gap-orbit-xs v6-orbit-text-small text-[var(--orbit-color-text-secondary)]", rowAlignmentClass)}>
            <span>no change</span>
            {showMetadataTooltip ? (
              <OutputMetadataTooltip score={score} deviations={deviations} showComparisonStatus={showComparisonStatus} />
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
              <OutputMetadataTooltip score={score} deviations={deviations} showComparisonStatus={showComparisonStatus} />
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
    <div className="flex flex-col gap-orbit-base">
      <div className="flex flex-col gap-orbit-s">
        <Text as="span" className="v6-orbit-heading-strong text-[var(--orbit-color-text-primary)]">
          Clause Target Status
        </Text>
        <div className="flex flex-wrap items-center gap-orbit-xs">
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

      <div className="flex flex-col gap-orbit-s">
        <Text as="span" className="v6-orbit-heading-strong text-[var(--orbit-color-text-primary)]">
          Deviation Level
        </Text>
        <div className="min-w-0 flex flex-wrap items-center gap-orbit-xs">
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
    const score = SUPPLIER_OUTPUT_SCORE_BY_ANALYSIS_ID[analysis.id];
    if (typeof score !== "number") return scores;

    const previousAnalysis = chronological[index - 1];
    const previousScore = previousAnalysis
      ? SUPPLIER_OUTPUT_SCORE_BY_ANALYSIS_ID[previousAnalysis.id]
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

function OutputMetadataTooltip({
  score,
  deviations,
  showComparisonStatus,
}: {
  score: OutputScorePresentation;
  deviations: DeviationCounts;
  showComparisonStatus: boolean;
}) {
  const notMet = Math.max(0, deviations.high + deviations.medium + deviations.low + deviations.missing);
  const scoreContext =
    !score.hasPreviousOutput || typeof score.deltaFromPrevious !== "number"
      ? "First output means this supplier does not have an earlier analysis in this workspace yet."
      : score.deltaFromPrevious === 0
      ? "No change means the latest analysis score matches the previous supplier output."
      : `${formatDelta(score.deltaFromPrevious)} vs previous compares this output against the last analysis for the same supplier.`;
  const clauseTargetItems = showComparisonStatus
    ? [`Not Met ${notMet}`, `Met ${deviations.none}`, `Missing ${deviations.missing}`]
    : [`Missing ${deviations.missing}`];
  const deviationItems = [
    `High ${deviations.high}`,
    `Medium ${deviations.medium}`,
    `Low ${deviations.low}`,
    `None ${deviations.none}`,
  ];

  return (
    <Tooltip>
      <TooltipTrigger>
        <button
          type="button"
          aria-label="View output metadata"
          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[var(--orbit-color-text-secondary)] transition-colors hover:text-orbit-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orbit-primary"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="min-w-[248px] max-w-[288px] border-[var(--orbit-color-border-default)] bg-[var(--orbit-color-bg-default)] text-[var(--orbit-color-text-primary)] [&>span[aria-hidden='true']]:border-[var(--orbit-color-border-default)] [&>span[aria-hidden='true']]:bg-[var(--orbit-color-bg-default)]"
      >
        <span className="flex flex-col gap-orbit-s">
          <span className="flex flex-col gap-orbit-xs">
            <span className="block v6-orbit-text-small v6-orbit-weight-medium text-[var(--orbit-color-text-primary)]">
              Score context
            </span>
            <span className="block v6-orbit-text-small text-[var(--orbit-color-text-secondary)]">
              {scoreContext}
            </span>
          </span>
          <span className="block h-px bg-[var(--orbit-color-border-default)]" aria-hidden="true" />
          <span className="flex flex-col gap-orbit-xs">
            <span className="block v6-orbit-text-small v6-orbit-weight-medium text-[var(--orbit-color-text-primary)]">
              Clause Target Status
            </span>
            <span className="flex flex-col gap-orbit-xxs">
              {clauseTargetItems.map((item) => (
                <span key={item} className="block v6-orbit-text-small text-[var(--orbit-color-text-secondary)]">
                  {item}
                </span>
              ))}
            </span>
          </span>
          <span className="block h-px bg-[var(--orbit-color-border-default)]" aria-hidden="true" />
          <span className="flex flex-col gap-orbit-xs">
            <span className="block v6-orbit-text-small v6-orbit-weight-medium text-[var(--orbit-color-text-primary)]">
              Deviation Level
            </span>
            <span className="flex flex-col gap-orbit-xxs">
              {deviationItems.map((item) => (
                <span key={item} className="block v6-orbit-text-small text-[var(--orbit-color-text-secondary)]">
                  {item}
                </span>
              ))}
            </span>
          </span>
        </span>
      </TooltipContent>
    </Tooltip>
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
  "--orbit-color-chip-style-2-bg": "var(--orbit-color-chip-style-2-bg)",
  "--orbit-color-chip-style-2-border": "var(--orbit-color-chip-style-2-border)",
} as CSSProperties;

const missingClausesPillStyle = {
  "--orbit-color-chip-default-border": "var(--orbit-color-card-border-default)",
  color: "var(--orbit-color-text-secondary)",
} as CSSProperties;

const primaryScoreTextStyle = {
  color: "var(--orbit-color-text-primary)",
} as CSSProperties;
