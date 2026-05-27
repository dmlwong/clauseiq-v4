import { useId, useState } from "react";
import { motion } from "framer-motion";
import { Check, Download, Eye, FileText, RotateCw, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import type { ClauseAnalysis, Supplier } from "@/data/mock-clauseiq";
import { cn } from "@/lib/utils";
import { supplierSeverity } from "@/lib/clauseiq-utils";
import { SupplierAvatar } from "./SupplierAvatar";
import type { AnalysisParameterItem } from "./types";

interface Props {
  analysis: ClauseAnalysis;
  supplier?: Supplier;
  showSupplier?: boolean;
  onRunAgain?: () => void;
  onDownload?: () => void;
  onViewResult?: () => void;
  viewResultPrimary?: boolean;
  isLatestOutput?: boolean;
  highlighted?: boolean;
  analysisParameters?: AnalysisParameterItem[];
}

export function AnalysisCard({
  analysis,
  supplier,
  showSupplier = false,
  onRunAgain,
  onDownload,
  onViewResult,
  viewResultPrimary = true,
  isLatestOutput = false,
  highlighted = isLatestOutput,
  analysisParameters = [],
}: Props) {
  const [saveToDocuments, setSaveToDocuments] = useState(false);
  const deviationSummaryId = useId();
  const status = statusCopy[analysis.status];

  return (
    <motion.article
      layout
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className={cn(
        "rounded-xl border bg-card p-[16px]",
        highlighted ? "border-primary/40 ring-2 ring-primary/15 shadow-sm" : "border-border",
      )}
    >
      {showSupplier && supplier && (
        <div className="mb-4 flex items-center gap-2 border-b border-border/70 pb-3">
          <SupplierAvatar
            name={supplier.name}
            shortCode={supplier.shortCode}
            severity={supplierSeverity(supplier.analyses)}
            size="sm"
          />
          <span className="text-sm font-medium text-foreground">{supplier.name}</span>
        </div>
      )}

      <div className="space-y-5">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground">
                Analysis Result
              </Badge>
              {isLatestOutput && (
                <Badge variant="outline" className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground">
                  Latest output
                </Badge>
              )}
            </div>
            <span className="shrink-0 text-sm text-muted-foreground">{formatAnalysisTimestamp(analysis.analysedAt)}</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-foreground">Here is your Analysis Result</h3>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <span>Save To Content Search</span>
              <Switch checked={saveToDocuments} onCheckedChange={setSaveToDocuments} aria-label="Save To Content Search" />
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <StatusLine
            icon={<FileText className="h-4 w-4" />}
            label={analysis.fileName}
            status="Uploaded"
            tone="neutral"
          />
          {analysisParameters.length > 0 && <AnalysisParametersSummary parameters={analysisParameters} />}
          <StatusLine
            icon={<Check className="h-4 w-4" />}
            label={`Reviewed ${analysis.clausesReviewed} clauses`}
            status={status.label}
            tone={status.tone}
          />
        </div>

        <div className="space-y-3">
          <p className="text-base text-foreground">
            {onDownload
              ? "Summary shown below. Download the report for full details."
              : "Summary shown below. View the result for full details."}
          </p>
          <div className="space-y-2" role="group" aria-labelledby={deviationSummaryId}>
            <p id={deviationSummaryId} className="text-base text-muted-foreground">
              Missing Clauses and deviation levels
            </p>
            <div className="flex flex-nowrap items-center gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <DeviationChip
                label="Missing"
                wideLabel="Missing Clauses"
                fullLabel="Missing Clauses"
                value={analysis.deviations.missing}
                tone="missing"
              />
              <DeviationChip label="High" fullLabel="High deviation" value={analysis.deviations.high} tone="high" />
              <DeviationChip
                label="Medium"
                fullLabel="Medium deviation"
                value={analysis.deviations.medium}
                tone="medium"
              />
              <DeviationChip label="Low" fullLabel="Low deviation" value={analysis.deviations.low} tone="low" />
              <DeviationChip label="None" fullLabel="No deviation" value={analysis.deviations.none} tone="none" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {onViewResult && (
            <Button
              variant={viewResultPrimary ? "default" : "outline"}
              className="h-10 w-full gap-2"
              onClick={onViewResult}
            >
              <Eye className="h-4 w-4" />
              View Result
            </Button>
          )}
          <div className={cn("grid gap-2", onRunAgain && onDownload ? "sm:grid-cols-2" : "grid-cols-1")}>
            {onRunAgain && (
              <Button variant="outline" className="h-10 gap-2" onClick={onRunAgain}>
                <RotateCw className="h-4 w-4" />
                Run Another Analysis
              </Button>
            )}
            {onDownload && (
              <Button variant="outline" className="h-10 gap-2" onClick={onDownload}>
                <Download className="h-4 w-4" />
                Download Report
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function AnalysisParametersSummary({ parameters }: { parameters: AnalysisParameterItem[] }) {
  if (parameters.length === 0) return null;

  return (
    <div className="space-y-2">
      {parameters.map((parameter) => (
        <div
          key={`${parameter.label}-${parameter.value}`}
          className="flex min-h-10 items-center justify-between gap-3 rounded-lg bg-muted px-3 text-sm text-foreground"
        >
          <div className="flex min-w-0 items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 shrink-0" />
            <span className="min-w-0 truncate font-medium text-foreground">
              <span className="font-medium text-foreground">{parameter.label}</span>
              {" · "}
              {parameter.value}
            </span>
          </div>
          <span className="shrink-0 font-medium text-foreground">Parameter Applied</span>
        </div>
      ))}
    </div>
  );
}

function StatusLine({
  icon,
  label,
  status,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  status: string;
  tone: "neutral" | "success" | "warning" | "destructive";
}) {
  return (
    <div
      className={cn(
        "flex min-h-10 items-center justify-between gap-3 rounded-lg px-3 text-sm",
        tone === "neutral" && "bg-muted text-foreground",
        tone === "success" && "bg-success/10 text-success",
        tone === "warning" && "bg-warning/15 text-warning-foreground",
        tone === "destructive" && "bg-destructive/10 text-destructive",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="shrink-0">{icon}</span>
        <span className="truncate font-medium">{label}</span>
      </div>
      <span className="shrink-0 font-medium">{status}</span>
    </div>
  );
}

function DeviationChip({
  label,
  wideLabel,
  fullLabel = label,
  value,
  tone,
}: {
  label: string;
  wideLabel?: string;
  fullLabel?: string;
  value: number;
  tone: "missing" | "high" | "medium" | "low" | "none";
}) {
  return (
    <Badge
      variant="outline"
      aria-label={`${fullLabel}: ${value}`}
      className={cn(
        "shrink-0 gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium leading-5",
        tone === "missing" && "border-slate-400 bg-muted/50 text-foreground",
        tone === "high" && "border-destructive bg-destructive/10 text-destructive",
        tone === "medium" && "border-warning bg-warning/10 text-warning-foreground",
        tone === "low" && "border-success bg-success/10 text-success",
        tone === "none" && "border-slate-300 bg-background text-muted-foreground",
      )}
    >
      {wideLabel ? (
        <>
          <span className="sm:hidden">{label}</span>
          <span className="hidden sm:inline">{wideLabel}</span>
        </>
      ) : (
        <span>{label}</span>
      )}
      <span className="tabular-nums">{value}</span>
    </Badge>
  );
}

const statusCopy: Record<ClauseAnalysis["status"], { label: string; tone: "success" | "warning" | "destructive" }> = {
  completed: { label: "Completed", tone: "success" },
  in_progress: { label: "In progress", tone: "warning" },
  failed: { label: "Failed", tone: "destructive" },
};

function formatAnalysisTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
