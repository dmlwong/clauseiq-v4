import { useMemo, useState } from "react";
import { Search, Building2, FileText, ArrowRight, SlidersHorizontal } from "@/components/clauseiq-v7/v7Icons";
import { Input } from "@/components/clauseiq-v7/orbit-ui/input";
import { Badge } from "@/components/clauseiq-v7/orbit-ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/clauseiq-v7/orbit-ui/select";
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
    <div className="space-y-orbit-base">
      <div className="flex items-end justify-between gap-orbit-base">
        <div>
          <div className="text-orbit-xs uppercase tracking-wider text-orbit-fg-secondary mb-orbit-xs">
            Other suppliers in this initiative
          </div>
          <h3 className="v6-orbit-heading-strong">
            {others.length} prior supplier {others.length === 1 ? "analysis" : "analyses"}
            <span className="v6-orbit-weight-regular text-orbit-fg-secondary"> · {initiativeName}</span>
          </h3>
        </div>
        <Badge variant="outline" className="text-orbit-xs v6-orbit-weight-regular">
          Showing {filtered.length} of {others.length}
        </Badge>
      </div>

      <div className="flex items-center gap-orbit-s">
        <div className="relative flex-1">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-orbit-fg-secondary" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search supplier or contract..."
            className="pl-orbit-l h-9 text-orbit-sm"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as AnalysisStatusFilter)}>
          <SelectTrigger className="h-9 w-[160px] text-orbit-sm">
            <SlidersHorizontal className="h-3.5 w-3.5 mr-orbit-xs text-orbit-fg-secondary" />
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
        <div className="rounded-orbit-lg border border-dashed border-orbit-border px-orbit-base py-orbit-m text-center text-orbit-sm text-orbit-fg-secondary">
          No supplier analyses match your filters.
        </div>
      ) : (
        <ul className="space-y-orbit-s max-h-[420px] overflow-y-auto pr-orbit-xs">
          {filtered.map((a) => (
            <li key={a.id}>
              <PriorAnalysisCard analysis={a} />
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-orbit-s pt-orbit-xs">
        <div className="h-px flex-1 bg-orbit-border" />
        <span className="text-orbit-xs uppercase tracking-wider text-orbit-fg-secondary">
          Latest analysis below
        </span>
        <div className="h-px flex-1 bg-orbit-border" />
      </div>
    </div>
  );
}

function PriorAnalysisCard({ analysis }: { analysis: InitiativeSupplierAnalysis }) {
  return (
    <button
      type="button"
      className="w-full text-left rounded-orbit-lg border border-orbit-border bg-orbit-canvas hover:border-orbit-primary/40 hover:bg-orbit-primary-soft/30 transition-colors px-orbit-base py-orbit-s group"
    >
      <div className="flex items-center gap-orbit-s mb-orbit-xs">
        <Building2 className="h-3.5 w-3.5 text-orbit-primary shrink-0" />
        <span className="text-orbit-sm v6-orbit-weight-medium text-orbit-fg truncate flex-1">
          {analysis.supplierName}
        </span>
        <StatusPill status={analysis.status} />
        <ArrowRight className="h-3.5 w-3.5 text-orbit-fg-secondary group-hover:text-orbit-primary transition-colors" />
      </div>
      <div className="flex items-center gap-orbit-xs text-orbit-xs text-orbit-fg-secondary mb-orbit-s min-w-0">
        <FileText className="h-3 w-3 shrink-0" />
        <span className="truncate">{analysis.contractName}</span>
        <span>·</span>
        <span className="shrink-0">{formatShortDate(analysis.analysedAt)}</span>
      </div>
      <div className="flex flex-wrap gap-orbit-xs">
        <Badge variant="outline" className="bg-orbit-primary-soft text-orbit-primary border-orbit-primary text-orbit-xs v6-orbit-weight-regular">
          Missing: {analysis.missing}
        </Badge>
        <Badge variant="outline" className="bg-orbit-destructive/10 text-orbit-destructive border-orbit-destructive/30 text-orbit-xs v6-orbit-weight-regular">
          High: {analysis.high}
        </Badge>
        <Badge variant="outline" className="bg-orbit-warning/15 text-orbit-warning border-orbit-warning/30 text-orbit-xs v6-orbit-weight-regular">
          Med: {analysis.medium}
        </Badge>
        <Badge variant="outline" className="bg-orbit-surface text-orbit-fg-secondary text-orbit-xs v6-orbit-weight-regular">
          Low: {analysis.low}
        </Badge>
      </div>
    </button>
  );
}

function StatusPill({ status }: { status: InitiativeSupplierAnalysis["status"] }) {
  const tone =
    status === "Finalised"
      ? "bg-orbit-success/10 text-orbit-success border-orbit-success/20"
      : status === "In Negotiation"
      ? "bg-orbit-primary/10 text-orbit-primary border-orbit-primary/20"
      : "bg-orbit-warning/15 text-orbit-warning border-orbit-warning/30";
  return (
    <Badge variant="outline" className={`text-orbit-xs v6-orbit-weight-regular shrink-0 ${tone}`}>
      {status}
    </Badge>
  );
}
