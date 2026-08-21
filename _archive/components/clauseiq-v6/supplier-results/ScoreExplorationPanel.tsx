import type { ReactNode } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, BarChart2, Download, Info } from "lucide-react";
import { Card } from "@orbit";
import { Button } from "@/components/clauseiq-v6/orbit-ui/button";
import { DeviationPills } from "@/components/clauseiq-v6/supplier-results/DeviationPills";
import { SupplierAvatar } from "@/components/clauseiq-v6/supplier-results/SupplierAvatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/clauseiq-v6/orbit-ui/tooltip";
import { mockInitiative, type ClauseAnalysis, type Supplier } from "@/data/mock-clauseiq-v6";
import { newestFirst, supplierSeverity } from "@/lib/clauseiq-utils";
import { cn } from "@/lib/utils";

export type ScoreConceptId = "score-pill" | "score-delta" | "score-summary";
type ScoreRefinementId =
  | "plain-language"
  | "plain-language-duplicate"
  | "strong-hierarchy"
  | "strong-hierarchy-duplicate"
  | "supplier-summary";
type ScoreSimplificationId = "compact-rows" | "featured-latest" | "supplier-ledger";

type ScoreTrend = "up" | "down" | "flat";

interface ExplorationScore {
  score: number;
  deltaFromPrevious?: number;
  trend?: ScoreTrend;
}

interface ScoreConceptDefinition {
  id: ScoreConceptId;
  label: string;
  description: string;
}

interface ScoreRefinementDefinition {
  id: ScoreRefinementId;
  label: string;
  description: string;
}

interface ScoreSimplificationDefinition {
  id: ScoreSimplificationId;
  label: string;
  description: string;
}

const scoreConcepts: ScoreConceptDefinition[] = [
  {
    id: "score-pill",
    label: "A. Score Pill",
    description: "Minimal metadata treatment. Good for adding score visibility with the smallest visual change.",
  },
  {
    id: "score-delta",
    label: "B. Score + Delta",
    description: "Balances current score and movement over time, making supplier improvement easier to scan.",
  },
  {
    id: "score-summary",
    label: "C. Score Summary Block",
    description: "Gives the score more presence inside each output so users can compare quality changes faster.",
  },
];

const scoreRefinements: ScoreRefinementDefinition[] = [
  {
    id: "plain-language",
    label: "B1. Plain-language delta",
    description: "Replaces shorthand with explicit improvement wording so occasional users do not need to interpret the signal.",
  },
  {
    id: "plain-language-duplicate",
    label: "B1b. Plain-language delta copy",
    description: "Duplicate of the preferred plain-language direction so we can iterate it further without disturbing the original.",
  },
  {
    id: "strong-hierarchy",
    label: "B2. Stronger hierarchy",
    description: "Makes the score the primary anchor, with the movement signal secondary and the timestamp tertiary.",
  },
  {
    id: "strong-hierarchy-duplicate",
    label: "B2b. Stronger hierarchy copy",
    description: "Duplicate of the stronger-hierarchy direction so we can iterate it further without disturbing the original.",
  },
  {
    id: "supplier-summary",
    label: "B3. Supplier summary",
    description: "Adds a supplier-level trend summary first, then keeps the per-output rows lighter and easier to scan.",
  },
];

const scoreSimplifications: ScoreSimplificationDefinition[] = [
  {
    id: "compact-rows",
    label: "D1. Compact rows",
    description: "Turns history into quiet score rows so users can compare movement quickly without reading repeated detail.",
  },
  {
    id: "featured-latest",
    label: "D2. Featured latest",
    description: "Keeps richer detail only on the latest output, while older outputs collapse into lighter summary rows.",
  },
  {
    id: "supplier-ledger",
    label: "D3. Supplier ledger",
    description: "Moves context to the supplier level first, then treats the output history like a compact score ledger.",
  },
];

const scoreByAnalysisId: Record<string, ExplorationScore> = {
  "a-001": { score: 56, deltaFromPrevious: 8, trend: "up" },
  "a-002": { score: 48, deltaFromPrevious: 12, trend: "up" },
  "a-003": { score: 36, trend: "flat" },
};

const b1DeclinePreviewByAnalysisId: Record<string, ExplorationScore> = {
  "a-001": { score: 52, deltaFromPrevious: -4, trend: "down" },
  "a-002": { score: 56, deltaFromPrevious: 8, trend: "up" },
  "a-003": { score: 48, trend: "flat" },
};

const thomsonReutersSupplier =
  mockInitiative.suppliers.find((supplier) => supplier.id === "sup-001") ?? mockInitiative.suppliers[0];
const repeatedContractFileName = "MSA_ThomsonReuters_v2.pdf";

function normalizeExplorationSupplier(supplier: Supplier): Supplier {
  return {
    ...supplier,
    analyses: supplier.analyses.map((analysis) => ({
      ...analysis,
      fileName: repeatedContractFileName,
    })),
  };
}

export function SupplierOutputScoreExplorationPanel() {
  return (
    <div className="space-y-orbit-l">
      <section className="space-y-orbit-base">
        <h2 className="v6-orbit-heading-strong">Supplier Output Score Exploration</h2>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          This page explores ways to show an overall analysis score on supplier output history cards.
          The goal is to help users spot improvement over time at supplier level without changing the live
          output-panel experience yet.
        </p>
      </section>

      <div className="grid gap-orbit-l xl:grid-cols-3">
        {scoreConcepts.map((concept) => (
          <ScoreConceptColumn key={concept.id} concept={concept} supplier={thomsonReutersSupplier} />
        ))}
      </div>

      <section className="space-y-orbit-base">
        <div className="space-y-orbit-xs">
          <h2 className="v6-orbit-heading-strong">Option B Refinements</h2>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            These variants all keep the score-plus-delta idea, but improve clarity, hierarchy, and supplier-level context.
          </p>
        </div>

        <div className="grid gap-orbit-l xl:grid-cols-3">
          {scoreRefinements.map((refinement) => (
            <ScoreRefinementColumn key={refinement.id} refinement={refinement} supplier={thomsonReutersSupplier} />
          ))}
        </div>
      </section>

      <section className="space-y-orbit-base">
        <div className="space-y-orbit-xs">
          <h2 className="v6-orbit-heading-strong">Simplified History Options</h2>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            These options respond to the stakeholder feedback by reducing repeated rows, toning down secondary detail,
            and making score movement easier to compare at a glance.
          </p>
        </div>

        <div className="grid gap-orbit-l xl:grid-cols-3">
          {scoreSimplifications.map((option) => (
            <ScoreSimplificationColumn key={option.id} option={option} supplier={thomsonReutersSupplier} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ScoreConceptColumn({
  concept,
  supplier,
}: {
  concept: ScoreConceptDefinition;
  supplier: Supplier;
}) {
  const normalizedSupplier = normalizeExplorationSupplier(supplier);
  const analyses = newestFirst(normalizedSupplier.analyses);

  return (
    <section aria-labelledby={`score-concept-${concept.id}`} className="space-y-orbit-base">
      <Card type="Static" state="Default" padding="Base" indicator={false}>
        <div className="space-y-orbit-base">
          <div className="space-y-orbit-xs">
            <h3 id={`score-concept-${concept.id}`} className="v6-orbit-heading-5">
              {concept.label}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{concept.description}</p>
          </div>

          <div className="rounded-lg border border-border/70 bg-white p-orbit-m">
            <div className="flex items-center gap-orbit-s border-b border-border/70 pb-orbit-s">
              <SupplierAvatar
                name={normalizedSupplier.name}
                shortCode={normalizedSupplier.shortCode}
                severity={supplierSeverity(normalizedSupplier.analyses)}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <h4 className="v6-orbit-heading-label truncate">{normalizedSupplier.name}</h4>
                <p className="text-xs text-muted-foreground">
                  {normalizedSupplier.analyses.length} outputs to compare over time
                </p>
              </div>
            </div>

            <div className="divide-y divide-border/70">
              {analyses.map((analysis, index) => (
                <ExplorationOutputRow
                  key={`${concept.id}-${analysis.id}`}
                  analysis={analysis}
                  conceptId={concept.id}
                  score={scoreByAnalysisId[analysis.id]}
                  isLatestOutput={index === 0}
                />
              ))}
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}

function ScoreRefinementColumn({
  refinement,
  supplier,
}: {
  refinement: ScoreRefinementDefinition;
  supplier: Supplier;
}) {
  const normalizedSupplier = normalizeExplorationSupplier(supplier);
  const analyses = newestFirst(normalizedSupplier.analyses);
  const useExplicitRowSeparators = refinement.id === "strong-hierarchy-duplicate";
  const refinementScores =
    refinement.id === "plain-language" || refinement.id === "plain-language-duplicate"
      ? b1DeclinePreviewByAnalysisId
      : scoreByAnalysisId;
  const latestScore = refinementScores[analyses[0]?.id ?? ""];

  return (
    <section aria-labelledby={`score-refinement-${refinement.id}`} className="space-y-orbit-base">
      <Card type="Static" state="Feature" padding="Base" indicator={false}>
        <div className="space-y-orbit-base">
          <div className="space-y-orbit-xs">
            <h3 id={`score-refinement-${refinement.id}`} className="v6-orbit-heading-5">
              {refinement.label}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{refinement.description}</p>
          </div>

          <div className="rounded-lg border border-border/70 bg-white p-orbit-m">
            <div className="flex items-center gap-orbit-s border-b border-border/70 pb-orbit-s">
              <SupplierAvatar
                name={normalizedSupplier.name}
                shortCode={normalizedSupplier.shortCode}
                severity={supplierSeverity(normalizedSupplier.analyses)}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <h4 className="v6-orbit-heading-label truncate">{normalizedSupplier.name}</h4>
                {refinement.id !== "plain-language-duplicate" && (
                  <p className="text-xs text-muted-foreground">3 outputs tracked for score movement</p>
                )}
              </div>
            </div>

            {refinement.id === "supplier-summary" && latestScore && (
              <SupplierSummaryHeader
                latestScore={latestScore.score}
                trendLabel="Improving"
                outputCount={normalizedSupplier.analyses.length}
              />
            )}

            <div className={cn(useExplicitRowSeparators ? "pt-orbit-m" : "divide-y divide-border/70 pt-2")}>
              {analyses.map((analysis, index) => (
                <div key={`${refinement.id}-${analysis.id}`}>
                  {useExplicitRowSeparators && index > 0 && <div className="my-orbit-m h-px bg-border/70" aria-hidden="true" />}
                  <RefinedOutputRow
                    analysis={analysis}
                    refinementId={refinement.id}
                    score={refinementScores[analysis.id]}
                    isLatestOutput={index === 0}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}

function ScoreSimplificationColumn({
  option,
  supplier,
}: {
  option: ScoreSimplificationDefinition;
  supplier: Supplier;
}) {
  const normalizedSupplier = normalizeExplorationSupplier(supplier);
  const analyses = newestFirst(normalizedSupplier.analyses);
  const latestScore = scoreByAnalysisId[analyses[0]?.id ?? ""];

  return (
    <section aria-labelledby={`score-simplification-${option.id}`} className="space-y-orbit-base">
      <Card type="Static" state="Default" padding="Base" indicator={false}>
        <div className="space-y-orbit-base">
          <div className="space-y-orbit-xs">
            <h3 id={`score-simplification-${option.id}`} className="v6-orbit-heading-5">
              {option.label}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{option.description}</p>
          </div>

          <div className="rounded-lg border border-border/70 bg-white p-orbit-m">
            <div className="flex items-center gap-orbit-s border-b border-border/70 pb-orbit-s">
              <SupplierAvatar
                name={normalizedSupplier.name}
                shortCode={normalizedSupplier.shortCode}
                severity={supplierSeverity(normalizedSupplier.analyses)}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <h4 className="v6-orbit-heading-label truncate">{normalizedSupplier.name}</h4>
                <p className="text-xs text-muted-foreground">3 outputs tracked for score movement</p>
              </div>
            </div>

            {option.id === "supplier-ledger" && latestScore && (
              <>
                <SupplierSummaryHeader
                  latestScore={latestScore.score}
                  trendLabel="Improving"
                  outputCount={normalizedSupplier.analyses.length}
                />
                <div className="mb-orbit-s grid grid-cols-2 gap-orbit-xs">
                  <Button variant="outline" className="h-8 gap-orbit-xs">
                    <BarChart2 className="h-3.5 w-3.5" />
                    View latest result
                  </Button>
                  <Button variant="outline" className="h-8 gap-orbit-xs">
                    <Download className="h-3.5 w-3.5" />
                    Download latest report
                  </Button>
                </div>
              </>
            )}

            <div className="divide-y divide-border/70">
              {analyses.map((analysis, index) => {
                const score = scoreByAnalysisId[analysis.id];
                if (!score) return null;

                if (option.id === "compact-rows") {
                  return (
                    <CompactHistoryRow
                      key={`${option.id}-${analysis.id}`}
                      analysis={analysis}
                      score={score}
                      isLatestOutput={index === 0}
                    />
                  );
                }

                if (option.id === "featured-latest") {
                  return index === 0 ? (
                    <FeaturedLatestRow
                      key={`${option.id}-${analysis.id}`}
                      analysis={analysis}
                      score={score}
                    />
                  ) : (
                    <CompactHistoryRow
                      key={`${option.id}-${analysis.id}`}
                      analysis={analysis}
                      score={score}
                      isLatestOutput={false}
                    />
                  );
                }

                return (
                  <LedgerHistoryRow
                    key={`${option.id}-${analysis.id}`}
                    analysis={analysis}
                    score={score}
                    isLatestOutput={index === 0}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}

function ExplorationOutputRow({
  analysis,
  conceptId,
  score,
  isLatestOutput,
}: {
  analysis: ClauseAnalysis;
  conceptId: ScoreConceptId;
  score?: ExplorationScore;
  isLatestOutput: boolean;
}) {
  return (
    <article className="space-y-orbit-s py-orbit-s">
      <div className="flex items-start justify-between gap-orbit-s">
        <div className="min-w-0 space-y-orbit-xxs">
          <div className="flex min-w-0 flex-wrap items-center gap-orbit-xs">
            <p className="truncate text-xs v6-orbit-weight-medium text-foreground">{analysis.fileName}</p>
            {conceptId === "score-pill" && score && <ScorePill score={score.score} />}
          </div>

          {(conceptId === "score-delta" || conceptId === "score-summary") && score && (
            <ScoreMetadata score={score} />
          )}
        </div>

        <OutputTimeMeta analysedAt={analysis.analysedAt} isLatestOutput={isLatestOutput} />
      </div>

      {conceptId === "score-summary" && score && <ScoreSummaryBlock score={score} />}

      <DeviationPills deviations={analysis.deviations} compact />

      <div className="grid grid-cols-2 gap-orbit-xs">
        <Button variant="outline" className="h-7 w-full px-orbit-none" aria-label="View Results">
          <BarChart2 className="h-3.5 w-3.5" />
        </Button>
        <Button variant="outline" className="h-7 w-full px-orbit-none" aria-label="Download">
          <Download className="h-3.5 w-3.5" />
        </Button>
      </div>
    </article>
  );
}

function RefinedOutputRow({
  analysis,
  refinementId,
  score,
  isLatestOutput,
}: {
  analysis: ClauseAnalysis;
  refinementId: ScoreRefinementId;
  score?: ExplorationScore;
  isLatestOutput: boolean;
}) {
  const isPlainLanguage =
    refinementId === "plain-language" || refinementId === "plain-language-duplicate";
  const useTooltipDeviations = refinementId === "plain-language-duplicate";
  const useInlineSecondaryActions = refinementId === "strong-hierarchy-duplicate";

  return (
    <article
      className={cn(
        "space-y-orbit-s px-orbit-xs pt-orbit-m pb-orbit-none",
        isPlainLanguage && "space-y-orbit-base pt-orbit-m pb-orbit-none",
        useInlineSecondaryActions && "pt-orbit-none pb-orbit-m",
      )}
    >
      <div className={cn("flex items-start justify-between gap-orbit-s", isPlainLanguage && "gap-orbit-base")}>
        <div className={cn("min-w-0 flex-1 space-y-orbit-xxs", isPlainLanguage && "space-y-orbit-xs")}>
          <div className="flex min-w-0 flex-wrap items-center gap-orbit-xs">
            <p className="truncate text-xs v6-orbit-weight-medium text-foreground">{analysis.fileName}</p>
          </div>

          {(refinementId === "plain-language" || refinementId === "plain-language-duplicate") && score && (
            <PlainLanguageScoreLine score={score} analysis={analysis} showDeviationTooltip={useTooltipDeviations} />
          )}
          {(refinementId === "strong-hierarchy" || refinementId === "strong-hierarchy-duplicate") && score && (
            <StrongHierarchyScoreLine score={score} />
          )}
          {refinementId === "supplier-summary" && score && <CompactTrendLine score={score} />}
        </div>

        <OutputTimeMeta
          analysedAt={analysis.analysedAt}
          isLatestOutput={isLatestOutput}
          showInlineSecondaryActions={useInlineSecondaryActions}
        />
      </div>

      {!useTooltipDeviations && <DeviationPills deviations={analysis.deviations} compact />}

      {!useInlineSecondaryActions && (
        <div className={cn("grid grid-cols-2 gap-orbit-xs", isPlainLanguage && "pt-orbit-xs")}>
          <Button variant="outline" className="h-7 w-full px-orbit-none" aria-label="View Results">
            <BarChart2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" className="h-7 w-full px-orbit-none" aria-label="Download">
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </article>
  );
}

function ScorePill({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center rounded-full bg-primary/10 px-orbit-xs py-[2px] text-[11px] v6-orbit-weight-medium text-primary">
      Score {score}
    </span>
  );
}

function CompactHistoryRow({
  analysis,
  score,
  isLatestOutput,
}: {
  analysis: ClauseAnalysis;
  score: ExplorationScore;
  isLatestOutput: boolean;
}) {
  return (
    <article className="py-orbit-s">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-orbit-s">
        <div className="min-w-0">
          <p className="truncate text-xs v6-orbit-weight-medium text-foreground">{analysis.fileName}</p>
          {isLatestOutput && <p className="mt-orbit-xxs text-[11px] text-muted-foreground">Latest output</p>}
        </div>
        <div className="text-right">
          <p className="text-sm v6-orbit-weight-medium text-foreground">{score.score}</p>
          <p className="text-[11px] text-muted-foreground">Score</p>
        </div>
        <div className="min-w-[92px] text-right">
          <p className={cn("inline-flex items-center gap-[4px] text-[11px] v6-orbit-weight-medium", scoreTrendTextClass(score.trend))}>
            {scoreTrendIcon(score.trend)}
            {plainLanguageDelta(score)}
          </p>
          <p className="mt-orbit-xxs text-[11px] text-muted-foreground">{formatShortDate(analysis.analysedAt)}</p>
        </div>
        <div className="flex items-center justify-end gap-orbit-xxs">
          <IconActionButton ariaLabel="View Result">
            <BarChart2 className="h-3.5 w-3.5" />
          </IconActionButton>
          <IconActionButton ariaLabel="Download">
            <Download className="h-3.5 w-3.5" />
          </IconActionButton>
        </div>
      </div>
    </article>
  );
}

function FeaturedLatestRow({
  analysis,
  score,
}: {
  analysis: ClauseAnalysis;
  score: ExplorationScore;
}) {
  return (
    <article className="space-y-orbit-s py-orbit-s">
      <div className="flex items-start justify-between gap-orbit-s">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-orbit-xs">
            <p className="truncate text-xs v6-orbit-weight-medium text-foreground">{analysis.fileName}</p>
          </div>
          <div className="mt-orbit-xxs flex flex-wrap items-center gap-x-orbit-s gap-y-orbit-xxs">
            <span className="text-sm v6-orbit-weight-medium text-foreground">Score {score.score}</span>
            <span className={cn("inline-flex items-center gap-[4px] text-[11px] v6-orbit-weight-medium", scoreTrendTextClass(score.trend))}>
              {scoreTrendIcon(score.trend)}
              {plainLanguageDelta(score)}
            </span>
          </div>
        </div>
        <OutputTimeMeta analysedAt={analysis.analysedAt} isLatestOutput />
      </div>

      <DeviationPills deviations={analysis.deviations} compact />

      <div className="grid grid-cols-2 gap-orbit-xs">
        <Button variant="outline" className="h-7 w-full px-orbit-none" aria-label="View Results">
          <BarChart2 className="h-3.5 w-3.5" />
        </Button>
        <Button variant="outline" className="h-7 w-full px-orbit-none" aria-label="Download">
          <Download className="h-3.5 w-3.5" />
        </Button>
      </div>
    </article>
  );
}

function LedgerHistoryRow({
  analysis,
  score,
  isLatestOutput,
}: {
  analysis: ClauseAnalysis;
  score: ExplorationScore;
  isLatestOutput: boolean;
}) {
  return (
    <article className="py-orbit-s">
      <div className="grid grid-cols-[minmax(0,1fr)_64px_110px] items-center gap-orbit-s">
        <div className="min-w-0">
          <p className="truncate text-xs v6-orbit-weight-medium text-foreground">{analysis.fileName}</p>
          <p className="mt-orbit-xxs text-[11px] text-muted-foreground">
            {isLatestOutput ? "Latest output" : formatShortDate(analysis.analysedAt)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm v6-orbit-weight-medium text-foreground">{score.score}</p>
          <p className="text-[11px] text-muted-foreground">Score</p>
        </div>
        <div className={cn("text-right text-[11px] v6-orbit-weight-medium", scoreTrendTextClass(score.trend))}>
          <div className="inline-flex items-center gap-[4px]">
            {scoreTrendIcon(score.trend)}
            {plainLanguageDelta(score)}
          </div>
        </div>
      </div>
    </article>
  );
}

function OutputTimeMeta({
  analysedAt,
  isLatestOutput,
  showInlineSecondaryActions = false,
}: {
  analysedAt: string;
  isLatestOutput?: boolean;
  showInlineSecondaryActions?: boolean;
}) {
  return (
    <div className="shrink-0 text-right text-[11px] leading-snug text-muted-foreground">
      <div className="inline-flex items-center gap-orbit-s whitespace-nowrap">
        <div className="inline-flex items-center gap-orbit-s whitespace-nowrap">
          {isLatestOutput && (
            <>
              <span>Latest output</span>
              <span aria-hidden="true" className="h-3 w-px bg-border/80" />
            </>
          )}
          <time dateTime={analysedAt}>{formatCompactTimestamp(analysedAt)}</time>
        </div>
        {showInlineSecondaryActions && (
          <div className="inline-flex items-center gap-orbit-xs">
            <Button variant="outline" className="h-7 w-7 px-orbit-none" aria-label="View Result" title="View Result">
              <BarChart2 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" className="h-7 w-7 px-orbit-none" aria-label="Download" title="Download">
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function IconActionButton({
  ariaLabel,
  children,
}: {
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <Button
      variant="outline"
      className="h-7 w-7 shrink-0 px-orbit-none"
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      {children}
    </Button>
  );
}

function ScoreMetadata({ score }: { score: ExplorationScore }) {
  return (
    <div className="flex flex-wrap items-center gap-x-orbit-s gap-y-orbit-xxs text-[11px] text-muted-foreground">
      <span className="v6-orbit-weight-medium text-foreground">Score {score.score}</span>
      {typeof score.deltaFromPrevious === "number" ? (
        <span className={cn("inline-flex items-center gap-[4px]", scoreTrendTextClass(score.trend))}>
          {scoreTrendIcon(score.trend)}
          {formatDelta(score.deltaFromPrevious)} vs previous
        </span>
      ) : (
        <span>First recorded output</span>
      )}
    </div>
  );
}

function ScoreSummaryBlock({ score }: { score: ExplorationScore }) {
  return (
    <div className="rounded-md border border-border/70 bg-white px-orbit-s py-orbit-xs">
      <div className="flex items-center justify-between gap-orbit-s">
        <div>
          <p className="text-[11px] uppercase tracking-[0.04em] text-muted-foreground">Overall score</p>
          <p className="text-lg v6-orbit-weight-medium text-foreground">{score.score}/100</p>
        </div>
        <div className={cn("text-right text-xs", scoreTrendTextClass(score.trend))}>
          <div className="inline-flex items-center gap-[4px] v6-orbit-weight-medium">
            {scoreTrendIcon(score.trend)}
            {typeof score.deltaFromPrevious === "number" ? formatDelta(score.deltaFromPrevious) : "No delta"}
          </div>
          <p className="mt-orbit-xxs text-[11px] text-muted-foreground">
            {typeof score.deltaFromPrevious === "number" ? "vs previous" : "First output"}
          </p>
        </div>
      </div>
    </div>
  );
}

function PlainLanguageScoreLine({
  score,
  analysis,
  showDeviationTooltip = false,
}: {
  score: ExplorationScore;
  analysis: ClauseAnalysis;
  showDeviationTooltip?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-orbit-s gap-y-orbit-xxs text-[11px]">
      <span className="v6-orbit-weight-medium text-foreground">Score {score.score}</span>
      {showDeviationTooltip && (
        <DeviationTooltip deviations={analysis.deviations} />
      )}
      <span className={cn("inline-flex items-center gap-[4px]", scoreTrendTextClass(score.trend))}>
        {scoreTrendIcon(score.trend)}
        {plainLanguageDelta(score)}
      </span>
    </div>
  );
}

function DeviationTooltip({ deviations }: { deviations: ClauseAnalysis["deviations"] }) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <button
          type="button"
          aria-label="View deviation breakdown"
          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">
        {`Missing ${deviations.missing}, High ${deviations.high}, Medium ${deviations.medium}, Low ${deviations.low}, None ${deviations.none}`}
      </TooltipContent>
    </Tooltip>
  );
}

function StrongHierarchyScoreLine({ score }: { score: ExplorationScore }) {
  return (
    <div className="flex flex-wrap items-end gap-x-orbit-s gap-y-orbit-xxs">
      <span className="text-sm v6-orbit-weight-medium text-foreground">Score {score.score}</span>
      <span className={cn("inline-flex items-center gap-[4px] text-[11px] v6-orbit-weight-medium", scoreTrendTextClass(score.trend))}>
        {scoreTrendIcon(score.trend)}
        {formatDelta(score.deltaFromPrevious ?? 0)}
      </span>
      <span className="text-[11px] text-muted-foreground">vs previous</span>
    </div>
  );
}

function CompactTrendLine({ score }: { score: ExplorationScore }) {
  return (
    <div className="flex flex-wrap items-center gap-x-orbit-s gap-y-orbit-xxs text-[11px] text-muted-foreground">
      <span>{score.score}/100</span>
      <span className={cn("inline-flex items-center gap-[4px]", scoreTrendTextClass(score.trend))}>
        {scoreTrendIcon(score.trend)}
        {plainLanguageDelta(score)}
      </span>
    </div>
  );
}

function SupplierSummaryHeader({
  latestScore,
  trendLabel,
  outputCount,
}: {
  latestScore: number;
  trendLabel: string;
  outputCount: number;
}) {
  return (
    <div className="my-orbit-s rounded-md border border-border/70 bg-white px-orbit-s py-orbit-s">
      <div className="grid grid-cols-3 gap-orbit-s text-xs">
        <div>
          <p className="text-muted-foreground">Latest score</p>
          <p className="mt-orbit-xxs text-sm v6-orbit-weight-medium text-foreground">{latestScore}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Trend</p>
          <p className="mt-orbit-xxs text-sm v6-orbit-weight-medium text-emerald-700">{trendLabel}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Outputs tracked</p>
          <p className="mt-orbit-xxs text-sm v6-orbit-weight-medium text-foreground">{outputCount}</p>
        </div>
      </div>
    </div>
  );
}

function scoreTrendTextClass(trend?: ScoreTrend) {
  if (trend === "up") return "text-emerald-700";
  if (trend === "down") return "text-rose-700";
  return "text-muted-foreground";
}

function scoreTrendIcon(trend?: ScoreTrend) {
  if (trend === "up") return <ArrowUpRight className="h-3 w-3" />;
  if (trend === "down") return <ArrowDownRight className="h-3 w-3" />;
  return <ArrowRight className="h-3 w-3" />;
}

function formatDelta(delta: number) {
  return delta > 0 ? `+${delta}` : `${delta}`;
}

function plainLanguageDelta(score: ExplorationScore) {
  if (typeof score.deltaFromPrevious !== "number") return "First scored output";
  if (score.trend === "up") return `Improved by ${score.deltaFromPrevious}`;
  if (score.trend === "down") return `Dropped by ${Math.abs(score.deltaFromPrevious)}`;
  return "No change";
}

function formatCompactTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
