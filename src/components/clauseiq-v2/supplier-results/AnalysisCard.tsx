import { motion } from "framer-motion";
import { BarChart2, Check, Download, FileText, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ClauseAnalysis, Supplier } from "@/data/mock-clauseiq";
import { formatAnalysisDate, supplierSeverity } from "@/lib/clauseiq-utils";
import { DeviationPills } from "./DeviationPills";
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
  return (
    <motion.article
      layout
      whileHover={{ boxShadow: "0 12px 32px rgba(15, 23, 42, 0.08)" }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="rounded-lg border border-border bg-card p-4"
    >
      {showSupplier && supplier && (
        <div className="mb-3 flex items-center gap-2 border-b border-border/70 pb-3">
          <SupplierAvatar
            name={supplier.name}
            shortCode={supplier.shortCode}
            severity={supplierSeverity(supplier.analyses)}
            size="sm"
          />
          <span className="text-sm font-medium text-foreground">{supplier.name}</span>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{analysis.fileName}</span>
          </div>
          <h3 className="mt-1 text-base font-medium leading-snug text-foreground">{analysis.contractName}</h3>
          <div className="mt-1 text-xs text-muted-foreground">
            Analysed {formatAnalysisDate(analysis.analysedAt)}
          </div>
        </div>
        <Badge variant="outline" className="border-success/20 bg-success/10 text-xs font-medium text-success">
          <Check className="mr-1 h-3 w-3" />
          Completed
        </Badge>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-success">
          <Check className="h-4 w-4" />
          Reviewed {analysis.clausesReviewed} clauses
        </div>
        <DeviationPills deviations={analysis.deviations} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {onViewResult && (
          <Button size="sm" className="h-8 gap-1.5" onClick={onViewResult}>
            <BarChart2 className="h-3.5 w-3.5" />
            View result
          </Button>
        )}
        {onDownload && (
          <Button size="sm" variant={onViewResult ? "outline" : "default"} className="h-8 gap-1.5" onClick={onDownload}>
            <Download className="h-3.5 w-3.5" />
            Download report
          </Button>
        )}
        {onRunAgain && (
          <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={onRunAgain}>
            <RotateCw className="h-3.5 w-3.5" />
            Run again
          </Button>
        )}
      </div>
    </motion.article>
  );
}
