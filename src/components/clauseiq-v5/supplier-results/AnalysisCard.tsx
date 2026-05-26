import { useId, useState } from "react";
import { motion } from "framer-motion";
import { BarChart2, Download, RotateCw, SlidersHorizontal } from "lucide-react";
import { Card } from "@orbit";
import { Button } from "@/components/clauseiq-v5/orbit-ui/button";
import { Badge } from "@/components/clauseiq-v5/orbit-ui/badge";
import { Switch } from "@/components/clauseiq-v5/orbit-ui/switch";
import { DocumentGlyph } from "@/components/clauseiq-v5/orbit-ui/file-item";
import { StatusIndicator } from "@/components/clauseiq-v5/orbit-ui/indicators";
import type { ClauseAnalysis, Supplier } from "@/data/mock-clauseiq";
import { cn } from "@/lib/utils";
import { supplierSeverity } from "@/lib/clauseiq-utils";
import { DeviationPills } from "./DeviationPills";
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
    >
      <Card type="Static" state={highlighted ? "Highlight" : "Default"} padding="Base">
        {showSupplier && supplier && (
          <div className="mb-orbit-base flex items-center gap-orbit-s border-b border-border/70 pb-orbit-base">
            <SupplierAvatar
              name={supplier.name}
              shortCode={supplier.shortCode}
              severity={supplierSeverity(supplier.analyses)}
              size="sm"
            />
            <span className="text-sm font-medium text-foreground">{supplier.name}</span>
          </div>
        )}

        <div className="space-y-orbit-m">
          <div className="space-y-orbit-base">
            <div className="flex flex-wrap items-center justify-between gap-orbit-s">
              <div className="flex min-w-0 flex-wrap items-center gap-orbit-s">
                <Badge variant="outline" className="rounded-md px-orbit-s py-orbit-xs text-xs font-medium text-muted-foreground">
                  Analysis Result
                </Badge>
                {isLatestOutput && (
                  <Badge variant="outline" className="rounded-md px-orbit-s py-orbit-xs text-xs font-medium text-muted-foreground">
                    Latest output
                  </Badge>
                )}
              </div>
              <span className="shrink-0 text-sm text-muted-foreground">
                {formatAnalysisTimestamp(analysis.analysedAt)}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-orbit-base">
              <h3 className="text-xl font-semibold leading-tight text-foreground">Here is your Analysis Result</h3>
              <label className="flex items-center gap-orbit-s text-sm font-medium text-foreground">
                <span>Save To My Documents</span>
                <Switch checked={saveToDocuments} onCheckedChange={setSaveToDocuments} aria-label="Save To My Documents" />
              </label>
            </div>
          </div>

          <div className="space-y-orbit-base">
            <StatusLine
              icon={<DocumentGlyph documentType={documentTypeFromFileName(analysis.fileName)} size="Extra Small" />}
              label={analysis.fileName}
              status="Uploaded"
              tone="neutral"
            />
            {analysisParameters.length > 0 && <AnalysisParametersSummary parameters={analysisParameters} />}
            <StatusLine
              icon={<StatusIndicator status={statusIndicatorFromTone(status.tone)} size="Small" ariaLabel={status.label} />}
              label={`Reviewed ${analysis.clausesReviewed} clauses`}
              status={status.label}
              tone={status.tone}
            />
          </div>

          <div className="space-y-orbit-base">
            <p className="text-base text-foreground">
              {onDownload
                ? "Summary shown below. Download the report for full details."
                : "Summary shown below. View the result for full details."}
            </p>
            <div className="space-y-orbit-s" role="group" aria-labelledby={deviationSummaryId}>
              <p id={deviationSummaryId} className="text-sm font-medium text-muted-foreground">
                Missing Clauses and deviation levels
              </p>
              <DeviationPills deviations={analysis.deviations} />
            </div>
          </div>

          <div className="space-y-orbit-s">
            {onViewResult && (
              <Button
                variant={viewResultPrimary ? "default" : "outline"}
                className="h-10 w-full gap-orbit-s"
                onClick={onViewResult}
              >
                <BarChart2 className="h-4 w-4" />
                View Result
              </Button>
            )}
            <div className={cn("grid gap-orbit-s", onRunAgain && onDownload ? "sm:grid-cols-2" : "grid-cols-1")}>
              {onRunAgain && (
                <Button variant="outline" className="h-10 gap-orbit-s" onClick={onRunAgain}>
                  <RotateCw className="h-4 w-4" />
                  Run Another Analysis
                </Button>
              )}
              {onDownload && (
                <Button variant="outline" className="h-10 gap-orbit-s" onClick={onDownload}>
                  <Download className="h-4 w-4" />
                  Download Report
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.article>
  );
}

function AnalysisParametersSummary({ parameters }: { parameters: AnalysisParameterItem[] }) {
  const parameter = parameters[0];

  if (!parameter) return null;

  return (
    <StatusLine
      icon={<SlidersHorizontal className="h-4 w-4" />}
      label={`${parameter.label} · ${parameter.value}`}
      status="Parameter Applied"
      tone="neutral"
    />
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
        "flex min-h-10 items-center justify-between gap-orbit-base rounded-lg px-orbit-base text-sm",
        tone === "neutral" && "bg-muted text-foreground",
        tone === "success" && "bg-success/10 text-success",
        tone === "warning" && "bg-warning/15 text-warning-foreground",
        tone === "destructive" && "bg-destructive/10 text-destructive",
      )}
    >
      <div className="flex min-w-0 items-center gap-orbit-s">
        <span className="shrink-0">{icon}</span>
        <span className="truncate font-medium">{label}</span>
      </div>
      <span className="shrink-0 font-medium">{status}</span>
    </div>
  );
}

const statusCopy: Record<ClauseAnalysis["status"], { label: string; tone: "success" | "warning" | "destructive" }> = {
  completed: { label: "Completed", tone: "success" },
  in_progress: { label: "In progress", tone: "warning" },
  failed: { label: "Failed", tone: "destructive" },
};

function statusIndicatorFromTone(tone: "success" | "warning" | "destructive") {
  if (tone === "success") return "Success";
  if (tone === "warning") return "Warning";
  return "Error";
}

function documentTypeFromFileName(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension === "pdf") return "PDF";
  if (extension === "doc" || extension === "docx") return "DOC";
  if (extension === "xls" || extension === "xlsx") return "XLS";
  if (extension === "zip") return "ZIP";
  if (extension === "png" || extension === "jpg" || extension === "jpeg") return "IMG";
  return "Unknown";
}

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
