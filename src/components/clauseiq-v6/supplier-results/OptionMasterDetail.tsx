import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/clauseiq-v6/orbit-ui/input";
import { cn } from "@/lib/utils";
import {
  aggregateDeviations,
  newestFirst,
  supplierSeverity,
} from "@/lib/clauseiq-utils";
import { AnalysisCard } from "./AnalysisCard";
import { SupplierAvatar } from "./SupplierAvatar";
import type { MasterDetailState, ResultsViewProps } from "./types";
import { useMasterDetailState } from "./useMasterDetailState";

export function OptionMasterDetail({
  initiative,
  onRunAgain,
  onDownload,
  onViewResult,
  analysisParameters,
  masterDetailState,
}: ResultsViewProps) {
  const fallbackState = useMasterDetailState(initiative);
  const state = masterDetailState ?? fallbackState;
  const { selectedSupplier } = state;

  return (
    <motion.div
      key="master-detail"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="space-y-orbit-m"
    >
      <MasterSupplierRail state={state} mobile />

      <div className="mx-auto w-full max-w-[640px]">
        <AnimatePresence mode="wait">
          {selectedSupplier ? (
            <motion.div
              key={selectedSupplier.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-orbit-base"
            >
              <div className="space-y-orbit-base">
                {newestFirst(selectedSupplier.analyses).map((analysis) => (
                  <AnalysisCard
                    key={analysis.id}
                    analysis={analysis}
                    onRunAgain={onRunAgain}
                    onDownload={onDownload}
                    onViewResult={onViewResult}
                    analysisParameters={analysisParameters}
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid min-h-[360px] place-items-center text-center text-sm text-muted-foreground"
            >
              Select a supplier to view their analysis history.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

interface MasterSupplierRailProps {
  state: MasterDetailState;
  mobile?: boolean;
}

export function MasterSupplierRail({ state, mobile = false }: MasterSupplierRailProps) {
  const content = <SupplierRailContent state={state} />;

  if (mobile) {
    return (
      <aside className="mb-orbit-base rounded-lg border border-border bg-muted/20 p-orbit-base md:hidden">
        {content}
      </aside>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col p-orbit-base">
      {content}
    </div>
  );
}

function SupplierRailContent({ state }: { state: MasterDetailState }) {
  const { filteredSuppliers, selectedId, query, onQueryChange, onSelect } = state;

  return (
    <>
      <div className="mb-orbit-base flex items-center justify-between gap-orbit-s">
        <div className="text-xs v6-orbit-weight-medium uppercase tracking-wider text-muted-foreground">
          Suppliers ({filteredSuppliers.length})
        </div>
      </div>
      <div className="relative mb-orbit-base">
        <Search className="absolute left-[calc(var(--orbit-space-s)+var(--orbit-space-xxs))] top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search suppliers..."
          className="h-8 bg-card pl-orbit-l text-xs"
        />
      </div>

      <div className="v6-hover-scrollbar min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-orbit-xs pb-orbit-s">
          {filteredSuppliers.map((supplier) => {
            const selected = selectedId === supplier.id;
            const deviations = aggregateDeviations(supplier.analyses);
            const severity = supplierSeverity(supplier.analyses);

            return (
              <button
                key={supplier.id}
                type="button"
                onClick={() => onSelect(supplier.id)}
                className={cn(
                  "relative flex w-full items-center gap-orbit-s rounded-md border border-transparent px-orbit-s py-orbit-s text-left transition-colors hover:bg-background",
                  selected && "bg-background shadow-sm",
                )}
              >
                {selected && (
                  <motion.span
                    layoutId="selected-supplier-master-accent"
                    className="absolute bottom-orbit-s left-orbit-none top-orbit-s w-0.5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                )}
                <SupplierAvatar name={supplier.name} shortCode={supplier.shortCode} severity={severity} size="sm" />
                <div className="min-w-0 flex-1 pl-orbit-xxs">
                  <div className="truncate text-[13px] v6-orbit-weight-medium text-foreground">{supplier.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {supplier.analyses.length} contract{supplier.analyses.length === 1 ? "" : "s"}
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-full px-orbit-s py-orbit-xxs text-[10px] v6-orbit-weight-medium",
                    deviations.high > 0
                      ? "bg-destructive/10 text-destructive"
                      : "bg-success/10 text-success",
                  )}
                >
                  {deviations.high > 0 ? `${deviations.high} high` : "clean"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
