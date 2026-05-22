import { useMemo, useState } from "react";
import { Search, Building2, FileText, ArrowRight, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  PRIOR_INITIATIVE_ANALYSES,
  filterPriorAnalyses,
  formatShortDate,
  type AnalysisStatusFilter,
  type InitiativeSupplierAnalysis,
} from "@/lib/initiative-supplier-history";

interface Props {
  initiativeName: string;
  /** Supplier name of the *current* (newest) analysis — excluded from the prior stack. */
  currentSupplierName: string;
}

/**
 * Stack of prior supplier analyses under the same initiative.
 * Always-visible (non-collapsible) cards. Latest analysis is rendered
 * separately *below* this stack by the parent. Includes search + status
 * filter so the UI scales to 20–50+ suppliers.
 */
export function InitiativeSupplierStack({ initiativeName, currentSupplierName }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<AnalysisStatusFilter>("all");

  const others = useMemo(
    () =>
      PRIOR_INITIATIVE_ANALYSES.filter(
        (a) => a.supplierName.toLowerCase() !== currentSupplierName.toLowerCase(),
      ),
    [currentSupplierName],
  );

  const filtered = useMemo(
    () => filterPriorAnalyses(others, query, status),
    [others, query, status],
  );

  if (others.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Other suppliers in this initiative
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            {others.length} prior supplier {others.length === 1 ? "analysis" : "analyses"}
            <span className="font-normal text-muted-foreground"> · {initiativeName}</span>
          </h3>
        </div>
        <Badge variant="outline" className="text-[10px] font-normal">
          Showing {filtered.length} of {others.length}
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search supplier or contract..."
            className="pl-8 h-9 text-sm"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as AnalysisStatusFilter)}>
          <SelectTrigger className="h-9 w-[160px] text-sm">
            <SlidersHorizontal className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="In Review">In Review</SelectItem>
            <SelectItem value="In Negotiation">In Negotiation</SelectItem>
            <SelectItem value="Finalised">Finalised</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-[16px] text-center text-sm text-muted-foreground">
          No supplier analyses match your filters.
        </div>
      ) : (
        <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {filtered.map((a) => (
            <li key={a.id}>
              <PriorAnalysisCard analysis={a} />
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2 pt-1">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Latest analysis below
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}

function PriorAnalysisCard({ analysis }: { analysis: InitiativeSupplierAnalysis }) {
  return (
    <button
      type="button"
      className="w-full text-left rounded-lg border border-border bg-background hover:border-ciq/40 hover:bg-ciq-soft/30 transition-colors p-[16px] group"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Building2 className="h-3.5 w-3.5 text-ciq shrink-0" />
        <span className="text-sm font-medium text-foreground truncate flex-1">
          {analysis.supplierName}
        </span>
        <StatusPill status={analysis.status} />
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-ciq transition-colors" />
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2 min-w-0">
        <FileText className="h-3 w-3 shrink-0" />
        <span className="truncate">{analysis.contractName}</span>
        <span>·</span>
        <span className="shrink-0">{formatShortDate(analysis.analysedAt)}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        <Badge variant="outline" className="bg-ciq-soft text-ciq border-ciq-border text-[10px] font-normal">
          Missing: {analysis.missing}
        </Badge>
        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-[10px] font-normal">
          High: {analysis.high}
        </Badge>
        <Badge variant="outline" className="bg-warning/15 text-warning-foreground border-warning/30 text-[10px] font-normal">
          Med: {analysis.medium}
        </Badge>
        <Badge variant="outline" className="bg-muted text-muted-foreground text-[10px] font-normal">
          Low: {analysis.low}
        </Badge>
      </div>
    </button>
  );
}

function StatusPill({ status }: { status: InitiativeSupplierAnalysis["status"] }) {
  const tone =
    status === "Finalised"
      ? "bg-success/10 text-success border-success/20"
      : status === "In Negotiation"
      ? "bg-primary/10 text-primary border-primary/20"
      : "bg-warning/15 text-warning-foreground border-warning/30";
  return (
    <Badge variant="outline" className={`text-[10px] font-normal shrink-0 ${tone}`}>
      {status}
    </Badge>
  );
}
