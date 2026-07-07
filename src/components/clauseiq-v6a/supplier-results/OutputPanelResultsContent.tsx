import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart2,
  ChevronDown,
  Download,
  FileText,
  Loader2,
  RotateCw,
  Search,
} from "lucide-react";
import { Card, MultiStateButton, MultiStateGroup } from "@orbit";
import { Button } from "@/components/clauseiq-v6a/orbit-ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/clauseiq-v6a/orbit-ui/tooltip";
import { Searchbox } from "@/components/clauseiq-v6a/orbit-ui/searchbox";
import type { ClauseAnalysis, Supplier } from "@/data/mock-clauseiq-v6";
import { flattenSupplierAnalyses, newestFirst, oldestFirst, supplierSeverity } from "@/lib/clauseiq-utils";
import { cn } from "@/lib/utils";
import { AnalysisCard } from "./AnalysisCard";
import {
  getSupplierScorePresentationByAnalysisId,
  OutputScoreLine,
  type OutputScorePresentation,
} from "./OutputSummaryMetrics";
import { SupplierAvatar } from "./SupplierAvatar";
import type { ResultsViewProps, SupplierOutputSelection, SupplierOutputsPanelState } from "./types";

type OutputScope = "team" | "mine";
const MINE_ANALYSIS_IDS = new Set(["a-001", "a-004", "a-007"]);

export function OutputPanelResultsContent({
  initiative,
  onRunAgain,
  onDownload,
  onViewResult,
  viewResultPrimary = true,
  highlightLatestOutput = true,
  higherIsBetter = true,
  analysisParameters,
}: ResultsViewProps) {
  const rows = useMemo(() => {
    return flattenSupplierAnalyses(initiative.suppliers).sort(
      (a, b) => Date.parse(a.analysis.analysedAt) - Date.parse(b.analysis.analysedAt),
    );
  }, [initiative.suppliers]);

  const latestAnalysisId = rows.at(-1)?.analysis.id;
  const outputScoresBySupplierId = useMemo<Record<string, Record<string, OutputScorePresentation>>>(() => {
    return Object.fromEntries(
      initiative.suppliers.map((supplier) => [
        supplier.id,
        getSupplierScorePresentationByAnalysisId(supplier.analyses),
      ]),
    );
  }, [initiative.suppliers]);

  return (
    <motion.div
      key="output-panel"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="clauseiq-responsive-output-panel mx-auto w-full max-w-[640px] space-y-orbit-m"
    >
      <section className="min-w-0 space-y-orbit-base" aria-label="Analysis outputs by date">
        {rows.length === 0 ? (
          <NoPreviousAnalysisState onRunAgain={onRunAgain} />
        ) : (
          rows.map(({ supplier, analysis }) => (
            <AnalysisCard
              key={analysis.id}
              analysis={analysis}
              supplier={supplier}
              showSupplier
              onRunAgain={onRunAgain}
              onDownload={onDownload}
              onViewResult={onViewResult}
              viewResultPrimary={viewResultPrimary && analysis.id === latestAnalysisId}
              isLatestOutput={analysis.id === latestAnalysisId}
              highlighted={highlightLatestOutput && analysis.id === latestAnalysisId}
              analysisParameters={analysisParameters}
              outputScore={outputScoresBySupplierId[supplier.id]?.[analysis.id]}
              higherIsBetter={higherIsBetter}
              showVerdictSummary={false}
            />
          ))
        )}
      </section>

      <SupplierOutputsPanel
        initiative={initiative}
        onRunAgain={onRunAgain}
        onDownload={onDownload}
        onViewResult={onViewResult}
        outputState="filled"
        higherIsBetter={higherIsBetter}
        className="lg:hidden"
      />
    </motion.div>
  );
}

interface SupplierOutputsPanelProps extends ResultsViewProps {
  className?: string;
  initialOutputScope?: OutputScope;
}

export function SupplierOutputsPanel({
  initiative,
  initialOutputScope = "mine",
  onRunAgain,
  onDownload,
  onViewResult,
  outputState = "filled",
  // TODO: confirm score polarity with scoring model owner.
  higherIsBetter = true,
  className,
}: SupplierOutputsPanelProps) {
  const [outputScope, setOutputScope] = useState<OutputScope>(initialOutputScope);
  const [query, setQuery] = useState("");
  const allRows = useMemo(() => flattenSupplierAnalyses(initiative.suppliers), [initiative.suppliers]);
  const hasOutputs = allRows.length > 0;
  const scopedSuppliers = useMemo(
    () => filterSuppliersByScope(initiative.suppliers, outputScope),
    [initiative.suppliers, outputScope],
  );
  const filteredSuppliers = useMemo(
    () => filterSuppliersByQuery(scopedSuppliers, query),
    [query, scopedSuppliers],
  );
  const rows = useMemo(() => {
    return flattenSupplierAnalyses(filteredSuppliers).sort(
      (a, b) => Date.parse(a.analysis.analysedAt) - Date.parse(b.analysis.analysedAt),
    );
  }, [filteredSuppliers]);
  const latestAnalysisId = rows.at(-1)?.analysis.id;
  const suppliers = useMemo(() => sortSuppliersByLatestChange(filteredSuppliers), [filteredSuppliers]);
  const [openSupplierIds, setOpenSupplierIds] = useState<string[]>([]);
  const supplierCount = suppliers.length;
  const outputCount = rows.length;
  const emptyState =
    outputState === "processing"
      ? {
          title: "Analysis In Progress",
          copy: "ClauseIQ is reviewing the uploaded contract. Supplier outputs will appear here once the analysis is complete.",
          loading: true,
        }
      : {
          title: "No Supplier Outputs Yet",
          copy: "Upload a contract and run ClauseIQ. Completed analyses will appear here, grouped by supplier.",
          loading: false,
        };

  useEffect(() => {
    setOpenSupplierIds(suppliers[0] ? [suppliers[0].id] : []);
  }, [suppliers]);

  useEffect(() => {
    setOutputScope(initialOutputScope);
  }, [initialOutputScope]);

  const toggleSupplier = (supplierId: string) => {
    setOpenSupplierIds((current) =>
      current.includes(supplierId)
        ? current.filter((id) => id !== supplierId)
        : [...current, supplierId],
    );
  };

  return (
    <section
      className={cn(
        "min-w-0 space-y-orbit-base",
        !hasOutputs && "flex h-full items-center justify-center space-y-orbit-none",
        className,
      )}
      aria-label="Supplier grouped outputs"
    >
      {hasOutputs && (
        <div className="space-y-orbit-base">
          <div className="clauseiq-responsive-output-panel-header flex w-full items-baseline justify-between gap-orbit-s">
            <h2 className="v6-orbit-heading-strong">Supplier Outputs</h2>
            <p className="shrink-0 text-right v6-orbit-text-small text-muted-foreground">
              {supplierCount} {supplierCount === 1 ? "supplier" : "suppliers"} &middot; {outputCount}{" "}
              {outputCount === 1 ? "output" : "outputs"}
            </p>
          </div>

          <Searchbox
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search suppliers or files"
            aria-label="Search supplier outputs"
          />

          <div className="clauseiq-v6-output-scope-control">
            <MultiStateGroup
              ariaLabel="Output scope"
              value={outputScope}
              onValueChange={(value) => {
                if (value === "mine" || value === "team") {
                  setOutputScope(value);
                }
              }}
            >
              <MultiStateButton value="mine" label="Mine" />
              <MultiStateButton value="team" label="Team" />
            </MultiStateGroup>
          </div>
        </div>
      )}

      <div id="supplier-outputs-panel" className="space-y-orbit-base">
        {suppliers.length === 0 ? (
          <>
            {hasOutputs ? (
              <Card type="Static" state="Default" padding="Base">
                <div className="v6-orbit-text-body text-muted-foreground">No outputs match this view.</div>
              </Card>
            ) : (
              <SupplierPanelEmptyState
                title={emptyState.title}
                copy={emptyState.copy}
                loading={emptyState.loading}
              />
            )}
          </>
        ) : (
          suppliers.map((supplier) => (
            <SupplierOutputGroup
              key={supplier.id}
              supplier={supplier}
              latestAnalysisId={latestAnalysisId}
              open={openSupplierIds.includes(supplier.id)}
              onToggle={() => toggleSupplier(supplier.id)}
              onDownload={onDownload}
              onViewResult={onViewResult}
              higherIsBetter={higherIsBetter}
            />
          ))
        )}
      </div>
    </section>
  );
}

function SupplierPanelEmptyState({
  title,
  copy,
  loading,
}: {
  title: string;
  copy: string;
  loading: boolean;
}) {
  return (
    <div className="w-full px-orbit-s py-orbit-s text-center">
      <div className="mx-auto max-w-[260px]">
        <div className="mx-auto h-24 w-32">
          <div className="relative mx-auto h-full w-full">
            <div className="absolute left-[calc(var(--orbit-space-m)+var(--orbit-space-xs))] top-orbit-s h-16 w-20 rounded-xl border border-slate-200 bg-white shadow-sm" />
            <div className="absolute left-[calc(var(--orbit-space-l)+var(--orbit-space-s))] top-orbit-m h-2 w-8 rounded bg-primary/20" />
            <div className="absolute left-[calc(var(--orbit-space-l)+var(--orbit-space-s))] top-[calc(var(--orbit-space-l)+var(--orbit-space-s)+var(--orbit-space-xs))] h-2 w-12 rounded bg-slate-200" />
            <div className="absolute left-[calc(var(--orbit-space-l)+var(--orbit-space-s))] top-orbit-mega h-2 w-9 rounded bg-slate-200" />
            <div className="absolute right-[calc(var(--orbit-space-base)+var(--orbit-space-xs))] top-[calc(var(--orbit-space-m)+var(--orbit-space-xs))] grid h-9 w-9 place-items-center rounded-full border border-primary/20 bg-primary/10 text-primary shadow-sm">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </div>
            <div className="absolute bottom-orbit-s left-orbit-base grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm">
              <FileText className="h-4 w-4" />
            </div>
            <div className="absolute bottom-[calc(var(--orbit-space-s)+var(--orbit-space-xs))] right-orbit-l grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm">
              <BarChart2 className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
        <h3 className="v6-orbit-heading-5 mt-orbit-m">{title}</h3>
        <p className="mt-orbit-s v6-orbit-text-body text-muted-foreground">{copy}</p>
      </div>
    </div>
  );
}

function NoPreviousAnalysisState({ onRunAgain }: { onRunAgain?: () => void }) {
  return (
    <Card type="Static" state="Default" padding="Base">
      <div className="text-center">
        <div className="mx-auto grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
          <FileText className="h-5 w-5" />
        </div>
        <h3 className="v6-orbit-heading-5 mt-orbit-base">No analysis outputs yet</h3>
        <p className="mx-auto mt-orbit-s max-w-sm v6-orbit-text-body text-muted-foreground">
          Once the first supplier contract is analysed, the result card will appear here with the supplier output summary.
        </p>
        {onRunAgain && (
          <Button className="mt-orbit-base h-9 gap-orbit-s" onClick={onRunAgain}>
            <RotateCw className="h-4 w-4" />
            Run first analysis
          </Button>
        )}
      </div>
    </Card>
  );
}

function SupplierOutputGroup({
  supplier,
  latestAnalysisId,
  open,
  onToggle,
  onDownload,
  onViewResult,
  higherIsBetter,
}: {
  supplier: Supplier;
  latestAnalysisId?: string;
  open: boolean;
  onToggle: () => void;
  onDownload?: () => void;
  onViewResult?: (selection?: SupplierOutputSelection) => void;
  higherIsBetter: boolean;
}) {
  const analyses = newestFirst(supplier.analyses);
  const scoresByAnalysisId = getSupplierScorePresentationByAnalysisId(analyses);
  const contentId = `supplier-output-${supplier.id}`;
  const containsLatestOutput = supplier.analyses.some((analysis) => analysis.id === latestAnalysisId);

  return (
    <section className="overflow-hidden">
      <Card type="Static" state="Default" padding="Small">
        <div className="flex w-full items-center gap-orbit-s py-orbit-s text-left">
          <SupplierAvatar
            name={supplier.name}
            shortCode={supplier.shortCode}
            severity={supplierSeverity(supplier.analyses)}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <h3 className="v6-orbit-heading-label truncate">{supplier.name}</h3>
          </div>
          <p className="shrink-0 whitespace-nowrap text-right v6-orbit-text-small text-muted-foreground">
            {supplier.analyses.length} {supplier.analyses.length === 1 ? "output" : "outputs"}
            {containsLatestOutput && <span className="v6-orbit-weight-medium"> - Latest output</span>}
          </p>
          <button
            type="button"
            className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-expanded={open}
            aria-controls={contentId}
            aria-label={`${open ? "Collapse" : "Expand"} ${supplier.name} outputs`}
            onClick={onToggle}
          >
            <motion.span
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.16 }}
              aria-hidden="true"
            >
              <ChevronDown className="h-4 w-4" />
            </motion.span>
          </button>
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id={contentId}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="border-t border-border/70 pt-orbit-base">
                {analyses.map((analysis, index) => (
                  <div key={analysis.id}>
                    {index > 0 && <div className="my-orbit-m h-px bg-border/70" aria-hidden="true" />}
                    <CompactOutputRow
                      analysis={analysis}
                      displayFileName={displayFileNameForSupplierAnalysis(supplier, analysis)}
                      score={scoresByAnalysisId[analysis.id]}
                      onDownload={onDownload}
                      onViewResult={
                        onViewResult
                          ? () => onViewResult({
                              supplier,
                              analysis,
                              previousAnalysis: previousAnalysisForSupplierOutput(supplier, analysis),
                            })
                          : undefined
                      }
                      higherIsBetter={higherIsBetter}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </section>
  );
}

function CompactOutputRow({
  analysis,
  displayFileName,
  score,
  onDownload,
  onViewResult,
  higherIsBetter,
}: {
  analysis: ClauseAnalysis;
  displayFileName: string;
  score?: OutputScorePresentation;
  onDownload?: () => void;
  onViewResult?: (selection?: SupplierOutputSelection) => void;
  higherIsBetter: boolean;
}) {
  return (
    <article className="px-orbit-xs">
      <div className="flex items-center justify-between gap-orbit-s">
        <p className="min-w-0 flex-1 truncate whitespace-nowrap v6-orbit-heading-strong text-foreground">
          {displayFileName}
        </p>
        <CompactOutputMeta
          analysedAt={analysis.analysedAt}
          onDownload={onDownload}
          onViewResult={onViewResult}
        />
      </div>

      {score && (
        <div className="mt-orbit-xs">
          <OutputScoreLine
            score={score}
            deviations={analysis.deviations}
            higherIsBetter={higherIsBetter}
          />
        </div>
      )}
    </article>
  );
}

function CompactOutputMeta({
  analysedAt,
  onDownload,
  onViewResult,
}: {
  analysedAt: string;
  onDownload?: () => void;
  onViewResult?: (selection?: SupplierOutputSelection) => void;
}) {
  return (
    <div className="shrink-0 text-right v6-orbit-text-small text-muted-foreground">
      <div className="inline-flex items-center gap-orbit-s whitespace-nowrap">
        <div className="inline-flex items-center gap-orbit-xs whitespace-nowrap">
          <time dateTime={analysedAt}>{formatCompactTimestamp(analysedAt)}</time>
        </div>
        <div className="inline-flex items-center gap-orbit-xs">
          <CompactActionButton label="View Results" onClick={onViewResult}>
            <BarChart2 className="h-3.5 w-3.5" />
          </CompactActionButton>
          <CompactActionButton label="Download" onClick={onDownload}>
            <Download className="h-3.5 w-3.5" />
          </CompactActionButton>
        </div>
      </div>
    </div>
  );
}

function CompactActionButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          className="h-7 w-7 px-orbit-none"
          aria-label={label}
          title={label}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="v6-orbit-text-small">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function displayFileNameForSupplierAnalysis(supplier: Supplier, analysis: ClauseAnalysis): string {
  return supplier.analyses.find((item) => item.id === analysis.id)?.fileName ?? analysis.fileName;
}

function previousAnalysisForSupplierOutput(supplier: Supplier, analysis: ClauseAnalysis): ClauseAnalysis | undefined {
  const chronological = oldestFirst(supplier.analyses);
  const index = chronological.findIndex((item) => item.id === analysis.id);
  return index > 0 ? chronological[index - 1] : undefined;
}

function sortSuppliersByLatestChange(suppliers: Supplier[]): Supplier[] {
  return [...suppliers].sort((a, b) => latestChangeTime(a) - latestChangeTime(b) || a.name.localeCompare(b.name));
}

function filterSuppliersByScope(suppliers: Supplier[], outputScope: OutputScope): Supplier[] {
  if (outputScope === "team") {
    return suppliers.filter((supplier) => supplier.analyses.length > 0);
  }

  return suppliers
    .map((supplier) => ({
      ...supplier,
      analyses: supplier.analyses.filter((analysis) => MINE_ANALYSIS_IDS.has(analysis.id)),
    }))
    .filter((supplier) => supplier.analyses.length > 0);
}

function filterSuppliersByQuery(suppliers: Supplier[], query: string): Supplier[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return suppliers;

  return suppliers
    .map((supplier) => {
      const supplierMatches =
        supplier.name.toLowerCase().includes(normalizedQuery) ||
        supplier.shortCode.toLowerCase().includes(normalizedQuery);

      if (supplierMatches) return supplier;

      return {
        ...supplier,
        analyses: supplier.analyses.filter((analysis) =>
          [analysis.fileName, analysis.contractName].some((value) =>
            value.toLowerCase().includes(normalizedQuery),
          ),
        ),
      };
    })
    .filter((supplier) => supplier.analyses.length > 0);
}

function latestChangeTime(supplier: Supplier): number {
  return Math.max(0, ...supplier.analyses.map((analysis) => Date.parse(analysis.analysedAt)));
}

function formatCompactTimestamp(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
