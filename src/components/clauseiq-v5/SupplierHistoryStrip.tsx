import { useState } from "react";
import { ChevronDown, History, FileText, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/clauseiq-v5/orbit-ui/badge";
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
    <div className="rounded-lg border border-ciq-border bg-ciq-soft/40 mb-orbit-base overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-orbit-s px-orbit-base py-orbit-s text-left hover:bg-ciq-soft/70 transition-colors"
      >
        <History className="h-4 w-4 text-ciq shrink-0" />
        <span className="text-sm text-foreground">
          <span className="font-medium">{count} prior {count === 1 ? "analysis" : "analyses"}</span>{" "}
          <span className="text-muted-foreground">found for {supplier.name}</span>
        </span>
        <Badge variant="outline" className="ml-auto text-[10px] font-normal border-ciq/30 text-ciq">
          Same supplier
        </Badge>
        <ChevronDown
          className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <ul className="border-t border-ciq-border divide-y divide-ciq-border/60 bg-background">
          {supplier.priorAnalyses.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="w-full flex items-center gap-orbit-base px-orbit-base py-orbit-s text-left hover:bg-muted/50 transition-colors"
              >
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground truncate">{p.contractName}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {p.initiativeName} · {formatAnalysedDate(p.analysedAt)}
                  </div>
                </div>
                <div className="flex items-center gap-orbit-xs shrink-0">
                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-[10px]">
                    {p.high} high
                  </Badge>
                  <Badge variant="outline" className="bg-warning/15 text-warning-foreground border-warning/30 text-[10px]">
                    {p.medium} med
                  </Badge>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
