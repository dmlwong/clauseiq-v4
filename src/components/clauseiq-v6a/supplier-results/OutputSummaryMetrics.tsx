import type { CSSProperties } from "react";
import { Info } from "lucide-react";
import { Chip, Text } from "@orbit";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/clauseiq-v6a/orbit-ui/tooltip";
import { Separator } from "@/components/clauseiq-v6a/orbit-ui/separator";
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
}: {
  score: OutputScorePresentation;
  deviations: DeviationCounts;
  higherIsBetter: boolean;
}) {
  const delta = score.deltaFromPrevious;

  return (
    <div className="flex min-w-0 items-center gap-orbit-s whitespace-nowrap">
      <span className="v6-orbit-text-body v6-orbit-weight-medium text-foreground">Score {score.score}</span>
      {!score.hasPreviousOutput || typeof delta !== "number" ? (
        <span className="inline-flex items-center gap-orbit-xs v6-orbit-text-small text-[var(--orbit-color-text-secondary)]">
          <span>first output</span>
          <OutputMetadataTooltip deviations={deviations} />
        </span>
      ) : delta === 0 ? (
        <span className="inline-flex items-center gap-orbit-xs v6-orbit-text-small text-[var(--orbit-color-text-secondary)]">
          <span>no change</span>
          <OutputMetadataTooltip deviations={deviations} />
        </span>
      ) : (
        <span className="inline-flex items-center gap-orbit-xs">
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
          <OutputMetadataTooltip deviations={deviations} />
        </span>
      )}
    </div>
  );
}

export function OutputFindingsSummary({ deviations }: { deviations: DeviationCounts }) {
  return (
    <div className="flex flex-wrap items-start gap-orbit-s">
      <div className="space-y-orbit-xs">
        <Text as="span" size="Small" variant="Secondary">
          Clause Status
        </Text>
        <div className="flex flex-wrap items-center gap-orbit-xs">
          <OutputSummaryPill
            label={`Not Met ${Math.max(0, deviations.high + deviations.medium + deviations.low + deviations.missing)}`}
            variant="Error"
          />
          <OutputSummaryPill label={`Met ${deviations.none}`} variant="Success" />
          <OutputSummaryPill
            label={`Missing ${deviations.missing}`}
            variant="Outline"
            style={missingClausesPillStyle}
          />
        </div>
      </div>

      <Separator
        orientation="vertical"
        className="hidden self-stretch bg-[var(--orbit-color-border-muted)] sm:block"
        style={outputFindingsDividerStyle}
      />

      <div className="space-y-orbit-xs">
        <Text as="span" size="Small" variant="Secondary">
          Deviation
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

function OutputMetadataTooltip({ deviations }: { deviations: DeviationCounts }) {
  const notMet = Math.max(0, deviations.high + deviations.medium + deviations.low + deviations.missing);

  return (
    <Tooltip>
      <TooltipTrigger>
        <button
          type="button"
          aria-label="View output metadata"
          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[var(--orbit-color-text-secondary)] transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="min-w-[232px] max-w-[256px]">
        <span className="block space-y-orbit-xs">
          <span className="block">
            <span className="block v6-orbit-text-small v6-orbit-weight-medium text-[var(--orbit-color-text-inverse)]">
              Clause Status
            </span>
            <span className="block v6-orbit-text-small text-[var(--orbit-color-text-inverse)] opacity-90">
              Met {deviations.none} | Not Met {notMet} | Missing {deviations.missing}
            </span>
          </span>
          <span className="block h-px bg-white/10" aria-hidden="true" />
          <span className="block">
            <span className="block v6-orbit-text-small v6-orbit-weight-medium text-[var(--orbit-color-text-inverse)]">
              Deviation
            </span>
            <span className="block v6-orbit-text-small text-[var(--orbit-color-text-inverse)] opacity-90">
              High {deviations.high} | Medium {deviations.medium} | Low {deviations.low} | None {deviations.none}
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
