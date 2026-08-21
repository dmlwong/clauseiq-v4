import { useState } from "react";
import { ChevronDown, History, FileText, ArrowRight } from "@/components/clauseiq-v7/v7Icons";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/clauseiq-v7/orbit-ui/badge";
import type { ExtractedSupplier } from "@/lib/supplier-history";
import { formatAnalysedDate } from "@/lib/supplier-history";

interface Props {
  supplier: ExtractedSupplier;
}

/** Inline strip that surfaces prior analyses for the same supplier. */
export function SupplierHistoryStrip({ supplier }: Props) {
  const [open, setOpen] = useState(false);
  const count = supplier.priorAnalyses.length;
  if (count === 0) return null;

  return (
    <div className="rounded-orbit-lg border border-orbit-primary bg-orbit-primary-soft/40 mb-orbit-base overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-orbit-s px-orbit-base py-orbit-s text-left hover:bg-orbit-primary-soft/70 transition-colors"
      >
        <History className="h-4 w-4 text-orbit-primary shrink-0" />
        <span className="text-orbit-sm text-orbit-fg">
          <span className="v6-orbit-weight-medium">{count} prior {count === 1 ? "analysis" : "analyses"}</span>{" "}
          <span className="text-orbit-fg-secondary">found for {supplier.name}</span>
        </span>
        <Badge variant="outline" className="ml-auto text-orbit-xs v6-orbit-weight-regular border-orbit-primary/30 text-orbit-primary">
          Same supplier
        </Badge>
        <ChevronDown
          className={cn("h-4 w-4 text-orbit-fg-secondary transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <ul className="border-t border-orbit-primary divide-y divide-ciq-border/60 bg-orbit-canvas">
          {supplier.priorAnalyses.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="w-full flex items-center gap-orbit-base px-orbit-base py-orbit-s text-left hover:bg-orbit-surface/50 transition-colors"
              >
                <FileText className="h-4 w-4 text-orbit-fg-secondary shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-orbit-sm v6-orbit-weight-medium text-orbit-fg truncate">{p.contractName}</div>
                  <div className="text-orbit-xs text-orbit-fg-secondary truncate">
                    {p.initiativeName} · {formatAnalysedDate(p.analysedAt)}
                  </div>
                </div>
                <div className="flex items-center gap-orbit-xs shrink-0">
                  <Badge variant="outline" className="bg-orbit-destructive/10 text-orbit-destructive border-orbit-destructive/30 text-orbit-xs">
                    {p.high} high
                  </Badge>
                  <Badge variant="outline" className="bg-orbit-warning/15 text-orbit-warning border-orbit-warning/30 text-orbit-xs">
                    {p.medium} med
                  </Badge>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-orbit-fg-secondary shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
