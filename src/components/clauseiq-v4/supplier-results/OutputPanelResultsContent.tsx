import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart2, ChevronDown, Download, FileText, Loader2, RotateCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ClauseAnalysis, Supplier } from "@/data/mock-clauseiq";
import { flattenSupplierAnalyses, newestFirst, supplierSeverity } from "@/lib/clauseiq-utils";
import { cn } from "@/lib/utils";
import { AnalysisCard } from "./AnalysisCard";
import { DeviationPills } from "./DeviationPills";
import { SupplierAvatar } from "./SupplierAvatar";
import type { ResultsViewProps, SupplierOutputsPanelState } from "./types";

type OutputScope = "team" | "mine";

const MINE_ANALYSIS_IDS = new Set(["a-001", "a-004", "a-007"]);

export function OutputPanelResultsContent({ initiative, onRunAgain, onDownload, onViewResult }: ResultsViewProps) {
  const rows = useMemo(() => {
    return flattenSupplierAnalyses(initiative.suppliers).sort(
      (a, b) => Date.parse(a.analysis.analysedAt) - Date.parse(b.analysis.analysedAt),
    );
  }, [initiative.suppliers]);

  const latestAnalysisId = rows.at(-1)?.analysis.id;

  return (
    <motion.div
      key="output-panel"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="mx-auto w-full max-w-[640px] space-y-5"
    >
      <section className="min-w-0 space-y-3" aria-label="Analysis outputs by date">
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
              viewResultPrimary={analysis.id === latestAnalysisId}
              isLatestOutput={analysis.id === latestAnalysisId}
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
        className="lg:hidden"
      />
    </motion.div>
  );
}

interface SupplierOutputsPanelProps extends ResultsViewProps {
  className?: string;
}

export function SupplierOutputsPanel({
  initiative,
  onRunAgain,
  onDownload,
  onViewResult,
  outputState = "filled",
  className,
}: SupplierOutputsPanelProps) {
  const [outputScope, setOutputScope] = useState<OutputScope>("mine");
  const [query, setQuery] = useState("");
  const allRows = useMemo(() => flattenSupplierAnalyses(initiative.suppliers), [initiative.suppliers]);
  const controlsDisabled = allRows.length === 0;
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
          title: "Analysis running",
          copy: "Analysis running. This output will appear here when complete.",
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
        }
      : {
          title: "No outputs yet",
          copy: "Completed analyses will appear here, grouped by supplier, with result, rerun and download actions.",
          icon: <FileText className="h-4 w-4" />,
        };

  useEffect(() => {
    setOpenSupplierIds(suppliers[0] ? [suppliers[0].id] : []);
  }, [suppliers]);

  const toggleSupplier = (supplierId: string) => {
    setOpenSupplierIds((current) =>
      current.includes(supplierId)
        ? current.filter((id) => id !== supplierId)
        : [...current, supplierId],
    );
  };

  return (
    <section className={cn("min-w-0 space-y-3", className)} aria-label="Supplier grouped outputs">
      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Supplier Outputs</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {supplierCount} {supplierCount === 1 ? "supplier" : "suppliers"} &middot; {outputCount}{" "}
            {outputCount === 1 ? "output" : "outputs"}
          </p>
        </div>

        <div className="flex h-8 items-center gap-2 rounded-md border border-input bg-white px-2">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search suppliers or files"
            disabled={controlsDisabled}
            className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:text-muted-foreground"
            aria-label="Search supplier outputs"
          />
        </div>

        <Tabs
          value={outputScope}
          onValueChange={(value) => {
            if (controlsDisabled) return;
            if (value === "team" || value === "mine") {
              setOutputScope(value);
            }
          }}
        >
          <TabsList className="grid h-8 w-full grid-cols-2 rounded-md">
            <TabsTrigger value="mine" className="h-6 px-2 text-xs" disabled={controlsDisabled}>
              Mine
            </TabsTrigger>
            <TabsTrigger value="team" className="h-6 px-2 text-xs" disabled={controlsDisabled}>
              Team
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-3">
        {suppliers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card px-4 py-6 text-sm text-muted-foreground">
            {query.trim() && !controlsDisabled ? (
              "No outputs match this view."
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <span className="grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-primary">
                    {emptyState.icon}
                  </span>
                  <span>{emptyState.title}</span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{emptyState.copy}</p>
              </div>
            )}
          </div>
        ) : (
          suppliers.map((supplier) => (
            <SupplierOutputGroup
              key={supplier.id}
              supplier={supplier}
              latestAnalysisId={latestAnalysisId}
              open={openSupplierIds.includes(supplier.id)}
              onToggle={() => toggleSupplier(supplier.id)}
              onRunAgain={onRunAgain}
              onDownload={onDownload}
              onViewResult={onViewResult}
            />
          ))
        )}
      </div>
    </section>
  );
}

function NoPreviousAnalysisState({ onRunAgain }: { onRunAgain?: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center">
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
        <FileText className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">No analysis outputs yet</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Once the first supplier contract is analysed, the result card will appear here with the supplier output summary.
      </p>
      {onRunAgain && (
        <Button className="mt-4 h-9 gap-2" onClick={onRunAgain}>
          <RotateCw className="h-4 w-4" />
          Run first analysis
        </Button>
      )}
    </div>
  );
}

function SupplierOutputGroup({
  supplier,
  latestAnalysisId,
  open,
  onToggle,
  onRunAgain,
  onDownload,
  onViewResult,
}: {
  supplier: Supplier;
  latestAnalysisId?: string;
  open: boolean;
  onToggle: () => void;
  onRunAgain?: () => void;
  onDownload?: () => void;
  onViewResult?: () => void;
}) {
  const analyses = newestFirst(supplier.analyses);
  const contentId = `supplier-output-${supplier.id}`;
  const containsLatestOutput = supplier.analyses.some((analysis) => analysis.id === latestAnalysisId);

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/40"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={onToggle}
      >
        <SupplierAvatar
          name={supplier.name}
          shortCode={supplier.shortCode}
          severity={supplierSeverity(supplier.analyses)}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium text-foreground">{supplier.name}</h3>
          <p className="text-xs text-muted-foreground">
            {supplier.analyses.length} {supplier.analyses.length === 1 ? "output" : "outputs"}
            {containsLatestOutput && <span className="font-medium"> - Latest output</span>}
          </p>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.16 }}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted-foreground"
          aria-hidden="true"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>

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
            <div className="space-y-2 px-4 pb-3">
              {analyses.map((analysis) => (
                <CompactOutputRow
                  key={analysis.id}
                  analysis={analysis}
                  isLatestOutput={analysis.id === latestAnalysisId}
                  onRunAgain={onRunAgain}
                  onDownload={onDownload}
                  onViewResult={onViewResult}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function CompactOutputRow({
  analysis,
  isLatestOutput,
  onRunAgain,
  onDownload,
  onViewResult,
}: {
  analysis: ClauseAnalysis;
  isLatestOutput: boolean;
  onRunAgain?: () => void;
  onDownload?: () => void;
  onViewResult?: () => void;
}) {
  return (
    <article className="rounded-md border border-border bg-background px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-foreground">{analysis.fileName}</p>
          {isLatestOutput && <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">Latest output</p>}
        </div>
        <time
          dateTime={analysis.analysedAt}
          className="shrink-0 text-right text-[11px] leading-snug text-muted-foreground"
        >
          {formatCompactTimestamp(analysis.analysedAt)}
        </time>
      </div>

      <div className="mt-2">
        <DeviationPills deviations={analysis.deviations} compact />
      </div>

      <div className="mt-2 grid grid-cols-3 gap-1">
        <CompactActionButton label="View Results" onClick={onViewResult}>
          <BarChart2 className="h-3.5 w-3.5" />
        </CompactActionButton>
        <CompactActionButton label="Re-Run" onClick={onRunAgain}>
          <RotateCw className="h-3.5 w-3.5" />
        </CompactActionButton>
        <CompactActionButton label="Download" onClick={onDownload}>
          <Download className="h-3.5 w-3.5" />
        </CompactActionButton>
      </div>
    </article>
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
          size="sm"
          className="h-7 px-0"
          aria-label={label}
          title={label}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
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
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
