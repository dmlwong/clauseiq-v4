import { useId, useState } from "react";
import { motion } from "framer-motion";
import { BarChart2, Download, RotateCw } from "lucide-react";
import { Card, InlineBanner } from "@orbit";
import { Button } from "@/components/clauseiq-v5/orbit-ui/button";
import { Chip } from "@/components/clauseiq-v5/orbit-ui/indicators";
import { Switch } from "@/components/clauseiq-v5/orbit-ui/switch";
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

const ICON_FILE = "\uf15b";
const ICON_FILE_WORD = "\uf1c2";
const ICON_FILE_EXCEL = "\uf1c3";
const ICON_FILE_ARCHIVE = "\uf1c6";
const ICON_FILE_IMAGE = "\uf1c5";
const ICON_SLIDERS = "\uf1de";
const ICON_CHECK = "\uf00c";
const ICON_CIRCLE_EXCLAMATION = "\uf06a";
const ICON_TRIANGLE_EXCLAMATION = "\uf071";

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
      className="clauseiq-responsive-analysis-card"
      layout
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
    >
      <Card type="Static" state={highlighted ? "Feature" : "Default"} padding="Base" indicator={false}>
        {showSupplier && supplier && (
          <div className="mb-orbit-base flex items-center gap-orbit-s border-b border-border/70 pb-orbit-base">
            <SupplierAvatar
              name={supplier.name}
              shortCode={supplier.shortCode}
              severity={supplierSeverity(supplier.analyses)}
              size="sm"
            />
            <span className="text-sm v5-orbit-weight-medium text-foreground">{supplier.name}</span>
          </div>
        )}

        <div className="space-y-orbit-m">
          <div className="space-y-orbit-base">
            <div className="flex flex-wrap items-center justify-between gap-orbit-s">
              <div className="flex min-w-0 flex-wrap items-center gap-orbit-s">
                <Chip label="Analysis Result" size="Mini" variant="No Status" contrast="Low" />
                {isLatestOutput && <Chip label="Latest output" size="Mini" variant="No Status" contrast="Low" />}
              </div>
              <span className="shrink-0 text-sm text-muted-foreground">
                {formatAnalysisTimestamp(analysis.analysedAt)}
              </span>
            </div>
            <div className="clauseiq-responsive-analysis-card-header flex flex-wrap items-center justify-between gap-orbit-base">
              <h3 className="v5-orbit-heading-4">Here is your Analysis Result</h3>
              <label className="flex items-center gap-orbit-s text-sm v5-orbit-weight-medium text-foreground">
                <span>Save To Content Search</span>
                <Switch checked={saveToDocuments} onCheckedChange={setSaveToDocuments} aria-label="Save To Content Search" />
              </label>
            </div>
          </div>

          <div className="space-y-orbit-base">
            <StatusLine
              icon={documentIconFromFileName(analysis.fileName)}
              label={analysis.fileName}
              status="Uploaded"
              tone="neutral"
            />
            {analysisParameters.length > 0 && <AnalysisParametersSummary parameters={analysisParameters} />}
            <StatusLine
              icon={statusIconFromTone(status.tone)}
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
              <p id={deviationSummaryId} className="text-base text-muted-foreground">
                Missing Clauses and deviation levels
              </p>
              <DeviationPills deviations={analysis.deviations} />
            </div>
          </div>

          <div className="clauseiq-responsive-analysis-card-actions space-y-orbit-s">
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
            {(onRunAgain || onDownload) && (
              <div className={cn("clauseiq-responsive-secondary-actions grid gap-orbit-s", onRunAgain && onDownload ? "sm:grid-cols-2" : "grid-cols-1")}>
                {onRunAgain && (
                  <Button variant="outline" className="h-10 gap-orbit-s" onClick={onRunAgain}>
                    <RotateCw className="h-4 w-4" />
                    Run Analysis Again
                  </Button>
                )}
                {onDownload && (
                <Button variant="outline" className="h-10 gap-orbit-s" onClick={onDownload}>
                  <Download className="h-4 w-4" />
                  Download Report
                </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.article>
  );
}

function AnalysisParametersSummary({ parameters }: { parameters: AnalysisParameterItem[] }) {
  if (parameters.length === 0) return null;

  return (
    <div className="space-y-orbit-s">
      {parameters.map((parameter) => (
        <StatusLine
          key={`${parameter.label}:${parameter.value}`}
          icon={ICON_SLIDERS}
          label={`${parameter.label} · ${parameter.value}`}
          status="Selected"
          tone="neutral"
        />
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
  icon: string;
  label: string;
  status: string;
  tone: "neutral" | "success" | "warning" | "destructive";
}) {
  return (
    <div className="clauseiq-responsive-status-line">
      <InlineBanner
        variant={inlineBannerVariantFromTone(tone)}
        contrast="Low"
        icon={icon}
        label={label}
        status={status}
      />
    </div>
  );
}

function inlineBannerVariantFromTone(
  tone: "neutral" | "success" | "warning" | "destructive",
): "No Status" | "Success" | "Warning" | "Error" {
  if (tone === "success") return "Success";
  if (tone === "warning") return "Warning";
  if (tone === "destructive") return "Error";
  return "No Status";
}

const statusCopy: Record<ClauseAnalysis["status"], { label: string; tone: "success" | "warning" | "destructive" }> = {
  completed: { label: "Completed", tone: "success" },
  in_progress: { label: "In progress", tone: "warning" },
  failed: { label: "Failed", tone: "destructive" },
};

function statusIconFromTone(tone: "success" | "warning" | "destructive") {
  if (tone === "success") return ICON_CHECK;
  if (tone === "warning") return ICON_TRIANGLE_EXCLAMATION;
  return ICON_CIRCLE_EXCLAMATION;
}

function documentIconFromFileName(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension === "pdf") return ICON_FILE;
  if (extension === "doc" || extension === "docx") return ICON_FILE_WORD;
  if (extension === "xls" || extension === "xlsx") return ICON_FILE_EXCEL;
  if (extension === "zip") return ICON_FILE_ARCHIVE;
  if (extension === "png" || extension === "jpg" || extension === "jpeg") return ICON_FILE_IMAGE;
  return ICON_FILE;
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
