import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart2, Check, Download, FileText, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import type { ClauseAnalysis, Supplier } from "@/data/mock-clauseiq";
import { cn } from "@/lib/utils";
import { supplierSeverity } from "@/lib/clauseiq-utils";
import { SupplierAvatar } from "./SupplierAvatar";

interface Props {
  analysis: ClauseAnalysis;
  supplier?: Supplier;
  showSupplier?: boolean;
  onRunAgain?: () => void;
  onDownload?: () => void;
  onViewResult?: () => void;
}

export function AnalysisCard({
  analysis,
  supplier,
  showSupplier = false,
  onRunAgain,
  onDownload,
  onViewResult,
}: Props) {
  const [saveToDocuments, setSaveToDocuments] = useState(false);
  const status = statusCopy[analysis.status];

  return (
    <motion.article
      layout
      whileHover={{ boxShadow: "0 12px 32px rgba(15, 23, 42, 0.08)" }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="rounded-xl border border-border bg-card p-5"
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
          <div className="flex items-center justify-between gap-3">
            <Badge variant="outline" className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground">
              Analysis Result
            </Badge>
            <span className="shrink-0 text-sm text-muted-foreground">{formatAnalysisTimestamp(analysis.analysedAt)}</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-semibold leading-tight text-foreground">Here is your Analysis Result</h3>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <span>Save To My Documents</span>
              <Switch checked={saveToDocuments} onCheckedChange={setSaveToDocuments} aria-label="Save To My Documents" />
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
          <StatusLine
            icon={<Check className="h-4 w-4" />}
            label={`Reviewed ${analysis.clausesReviewed} clauses`}
            status={status.label}
            tone={status.tone}
          />
        </div>

        <div className="space-y-3">
          <p className="text-base text-foreground">Summary shown below. Download the report for full details.</p>
          <div className="flex flex-wrap gap-2">
            <DeviationChip label="Missing clauses" value={analysis.deviations.missing} tone="missing" />
            <DeviationChip label="High deviation" value={analysis.deviations.high} tone="high" />
            <DeviationChip label="Medium deviation" value={analysis.deviations.medium} tone="medium" />
            <DeviationChip label="Low deviation" value={analysis.deviations.low} tone="low" />
          </div>
        </div>

        <div className="space-y-2">
          {onViewResult && (
            <Button className="h-10 w-full gap-2" onClick={onViewResult}>
              <BarChart2 className="h-4 w-4" />
              View Result
            </Button>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
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
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "missing" | "high" | "medium" | "low";
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md px-3 py-1 text-sm font-medium",
        tone === "missing" && "border-slate-400 bg-muted/50 text-foreground",
        tone === "high" && "border-destructive bg-destructive/10 text-destructive",
        tone === "medium" && "border-warning bg-warning/10 text-warning-foreground",
        tone === "low" && "border-success bg-success/10 text-success",
      )}
    >
      {label}: {value}
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
