import type { CSSProperties } from "react";
import { Chip, Text } from "@orbit";

import { Separator } from "@/components/clauseiq-v6/orbit-ui/separator";
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
  higherIsBetter,
}: {
  score: OutputScorePresentation;
  higherIsBetter: boolean;
}) {
  const delta = score.deltaFromPrevious;

  return (
    <div className="flex min-w-0 items-center gap-orbit-s whitespace-nowrap">
      <span className="v6-orbit-text-body v6-orbit-weight-medium text-foreground">Score {score.score}</span>
      {!score.hasPreviousOutput || typeof delta !== "number" ? (
        <span className="v6-orbit-text-small text-[var(--orbit-color-text-secondary)]">first output</span>
      ) : delta === 0 ? (
        <span className="v6-orbit-text-small text-[var(--orbit-color-text-secondary)]">no change</span>
      ) : (
        <span
          className={cn(
            "inline-flex items-center gap-orbit-xxs v6-orbit-text-small v6-orbit-weight-medium",
            scoreDeltaValenceTextClass(scoreDeltaValence(delta, higherIsBetter)),
          )}
          aria-label={`${score.trend === "up" ? "Increased" : "Decreased"} by ${Math.abs(delta)} versus previous`}
        >
          <span aria-hidden="true">{score.trend === "up" ? "↗" : "↘"}</span>
          <span>{formatDelta(delta)} vs previous</span>
        </span>
      )}
    </div>
  );
}

export function OutputFindingsSummary({ deviations }: { deviations: DeviationCounts }) {
  return (
    <div className="grid grid-cols-[max-content_var(--orbit-space-micro)_minmax(0,1fr)] items-start gap-x-orbit-base gap-y-orbit-s">
      <Text as="span" size="Small" variant="Secondary">
        Missing Clauses
      </Text>

      <Separator
        orientation="vertical"
        decorative
        className="row-span-2 self-stretch"
        style={outputFindingsDividerStyle}
      />

      <Text as="span" size="Small" variant="Secondary">
        Deviations Level
      </Text>

      <div>
        <OutputSummaryPill
          label={String(deviations.missing)}
          variant="Outline"
          style={missingClausesPillStyle}
        />
      </div>

      <div className="min-w-0 flex flex-wrap gap-orbit-xs">
        <OutputSummaryPill label={`High ${deviations.high}`} variant="Error" />
        <OutputSummaryPill label={`Medium ${deviations.medium}`} variant="Warning" />
        <OutputSummaryPill
          label={`Low ${deviations.low}`}
          variant="Style 2"
          style={lowDeviationPillStyle}
        />
        <OutputSummaryPill label={`None ${deviations.none}`} variant="Success" />
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

const lowDeviationPillStyle = {
  "--orbit-color-chip-style-2-bg": "#E5EDEE",
  "--orbit-color-chip-style-2-border": "#34585C",
} as CSSProperties;

const missingClausesPillStyle = {
  "--orbit-color-chip-default-border": "#D9D8D2",
  color: "#5F5E5A",
} as CSSProperties;

const outputFindingsDividerStyle = {
  width: "var(--orbit-space-micro)",
  minHeight: "var(--orbit-space-xl)",
} as CSSProperties;
