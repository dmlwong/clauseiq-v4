import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { newestFirst, supplierSeverity } from "@/lib/clauseiq-utils";
import { AnalysisCard } from "./AnalysisCard";
import { SupplierAvatar } from "./SupplierAvatar";
import type { ResultsViewProps } from "./types";

export function OptionAccordion({ initiative, onRunAgain, onDownload, onViewResult }: ResultsViewProps) {
  const suppliers = useMemo(() => sortByLatestChange(initiative.suppliers), [initiative.suppliers]);
  const [openIds, setOpenIds] = useState<string[]>(() => {
    const latestSupplier = suppliers.at(-1);
    return latestSupplier ? [latestSupplier.id] : [];
  });

  const toggle = (id: string) => {
    setOpenIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  return (
    <motion.div
      key="accordion"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="mx-auto w-full max-w-[640px] space-y-5"
    >
      <div className="space-y-3">
        {suppliers.map((supplier) => {
          const open = openIds.includes(supplier.id);
          const severity = supplierSeverity(supplier.analyses);
          const latestChange = latestChangeTimestamp(supplier.analyses);

          return (
            <motion.section
              layout
              key={supplier.id}
              className="overflow-hidden rounded-lg border border-border bg-card"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <Button
                type="button"
                variant="ghost"
                onClick={() => toggle(supplier.id)}
                className="h-auto w-full justify-start rounded-none px-4 py-3 text-left hover:bg-muted/45"
              >
                <div className="flex w-full min-w-0 items-start gap-3">
                  <SupplierAvatar name={supplier.name} shortCode={supplier.shortCode} severity={severity} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">{supplier.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Total Contract Runs: {supplier.analyses.length}
                    </div>
                  </div>
                  <div className="ml-auto flex shrink-0 items-center gap-2 pt-0.5">
                    <span className="max-w-[9rem] text-right text-[11px] leading-tight text-muted-foreground">
                      {latestChange}
                    </span>
                    <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}>
                      <ChevronDown className={cn("h-4 w-4 text-muted-foreground", open && "text-foreground")} />
                    </motion.span>
                  </div>
                </div>
              </Button>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <div className="space-y-3 border-t border-border/70 bg-muted/20 p-3">
                      {newestFirst(supplier.analyses).map((analysis) => (
                        <AnalysisCard
                          key={analysis.id}
                          analysis={analysis}
                          onRunAgain={onRunAgain}
                          onDownload={onDownload}
                          onViewResult={onViewResult}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          );
        })}
      </div>
    </motion.div>
  );
}

function sortByLatestChange(suppliers: ResultsViewProps["initiative"]["suppliers"]) {
  return [...suppliers].sort((a, b) => {
    const aLatest = latestChangeTime(a.analyses);
    const bLatest = latestChangeTime(b.analyses);
    return aLatest - bLatest || a.name.localeCompare(b.name);
  });
}

function latestChangeTime(analyses: ResultsViewProps["initiative"]["suppliers"][number]["analyses"]): number {
  return Math.max(0, ...analyses.map((analysis) => Date.parse(analysis.analysedAt)));
}

function latestChangeTimestamp(analyses: ResultsViewProps["initiative"]["suppliers"][number]["analyses"]): string {
  const latest = newestFirst(analyses)[0];
  if (!latest) return "not available";
  return new Date(latest.analysedAt).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
