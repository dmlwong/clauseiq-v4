import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/clauseiq-v6/orbit-ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/clauseiq-v6/orbit-ui/select";
import {
  analysisRiskScore,
  flattenSupplierAnalyses,
  sortByRisk,
} from "@/lib/clauseiq-utils";
import { AnalysisCard } from "./AnalysisCard";
import { DEFAULT_FILTERED_LIST_CONTROLS } from "./types";
import type { FilteredListControls, FilteredListSortMode, ResultsViewProps } from "./types";

export function OptionFilteredList({
  initiative,
  onRunAgain,
  onDownload,
  onViewResult,
  analysisParameters,
  filteredControls,
}: ResultsViewProps) {
  const controls = filteredControls ?? DEFAULT_FILTERED_LIST_CONTROLS;

  const rows = useMemo(() => {
    const q = controls.query.trim().toLowerCase();
    return flattenSupplierAnalyses(initiative.suppliers)
      .filter(({ supplier, analysis }) => {
        const supplierMatch = controls.supplierId === "all" || supplier.id === controls.supplierId;
        const queryMatch =
          !q ||
          supplier.name.toLowerCase().includes(q) ||
          analysis.contractName.toLowerCase().includes(q) ||
          analysis.fileName.toLowerCase().includes(q);
        return supplierMatch && queryMatch;
      })
      .sort((a, b) => {
        if (controls.sort === "recent") return Date.parse(b.analysis.analysedAt) - Date.parse(a.analysis.analysedAt);
        if (controls.sort === "supplier") {
          return (
            a.supplier.name.localeCompare(b.supplier.name) ||
            Date.parse(b.analysis.analysedAt) - Date.parse(a.analysis.analysedAt)
          );
        }
        if (controls.sort === "clauses") return b.analysis.clausesReviewed - a.analysis.clausesReviewed;
        return analysisRiskScore(b.analysis) - analysisRiskScore(a.analysis);
      });
  }, [controls.query, controls.sort, controls.supplierId, initiative.suppliers]);

  const visibleSupplierCount = new Set(rows.map((row) => row.supplier.id)).size;

  return (
    <motion.div
      key="filtered-list"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="space-y-orbit-base"
    >
      <div className="mx-auto w-full max-w-[640px] text-xs text-muted-foreground">
        Showing {rows.length} analyses across {visibleSupplierCount} supplier
        {visibleSupplierCount === 1 ? "" : "s"}
      </div>

      <motion.div layout className="mx-auto w-full max-w-[640px] space-y-orbit-base">
        <AnimatePresence initial={false}>
          {rows.map(({ supplier, analysis }) => (
            <AnalysisCard
              key={analysis.id}
              analysis={analysis}
              supplier={supplier}
              showSupplier
              onRunAgain={onRunAgain}
              onDownload={onDownload}
              onViewResult={onViewResult}
              analysisParameters={analysisParameters}
            />
          ))}
        </AnimatePresence>
        {rows.length === 0 && (
          <div className="rounded-lg border border-dashed border-border bg-card px-orbit-base py-orbit-l text-center text-sm text-muted-foreground">
            No analyses match your filters.
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

interface FilteredListToolbarProps {
  initiative: ResultsViewProps["initiative"];
  controls: FilteredListControls;
  onControlsChange: (controls: FilteredListControls) => void;
}

export function FilteredListToolbar({ initiative, controls, onControlsChange }: FilteredListToolbarProps) {
  const suppliers = useMemo(() => sortByRisk(initiative.suppliers), [initiative.suppliers]);
  const update = (patch: Partial<FilteredListControls>) => onControlsChange({ ...controls, ...patch });

  return (
    <div className="grid gap-orbit-base lg:grid-cols-[minmax(260px,1fr)_220px_210px]">
      <div className="relative min-w-[260px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={controls.query}
          onChange={(event) => update({ query: event.target.value })}
          placeholder="Search supplier or contract..."
          className="h-9 bg-card pl-orbit-l"
        />
      </div>

      <Select value={controls.supplierId} onValueChange={(value) => update({ supplierId: value })}>
        <SelectTrigger className="h-9 w-full bg-card text-sm">
          <Building2 className="mr-orbit-s h-3.5 w-3.5 text-muted-foreground" />
          <SelectValue placeholder="Supplier" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All suppliers</SelectItem>
          {suppliers.map((supplier) => (
            <SelectItem key={supplier.id} value={supplier.id}>
              {supplier.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={controls.sort} onValueChange={(value) => update({ sort: value as FilteredListSortMode })}>
        <SelectTrigger className="h-9 w-full bg-card text-sm">
          <SlidersHorizontal className="mr-orbit-s h-3.5 w-3.5 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="severity">Severity (high first)</SelectItem>
          <SelectItem value="recent">Most recent</SelectItem>
          <SelectItem value="supplier">Supplier A-Z</SelectItem>
          <SelectItem value="clauses">Clauses reviewed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
