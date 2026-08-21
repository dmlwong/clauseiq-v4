import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { Tooltip } from "@orbit";
import { cn } from "@/lib/utils";

export type ResultsOption = "accordion" | "master-detail" | "filtered-list";

const OPTIONS: Array<{ value: ResultsOption; label: string }> = [
  { value: "accordion", label: "Accordion" },
  { value: "master-detail", label: "Master-detail" },
  { value: "filtered-list", label: "Filtered list" },
];

const RATIONALE: Record<ResultsOption, string> = {
  accordion:
    "This pattern works well for up to ~10-15 suppliers. Beyond that, the vertical scroll becomes unwieldy and the overview is lost when suppliers are expanded.",
  "master-detail":
    "Scales to 50+ suppliers cleanly. The index is independently scrollable with search. Could evolve to include sort controls by risk, date, alphabetical order, and supplier-level trend indicators.",
  "filtered-list":
    "Lowest design effort, but no supplier-level aggregation. At 50 suppliers the filter handles discovery, but users cannot see how risky a supplier is overall without reading individual cards.",
};

interface Props {
  value: ResultsOption;
  onChange: (value: ResultsOption) => void;
}

export function OptionSwitcher({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-orbit-s">
      <span className="text-[11px] v5-orbit-weight-medium uppercase tracking-wider text-muted-foreground">
        Design options
      </span>
      <div className="inline-flex h-8 items-center rounded-full border border-border/80 bg-muted/50 p-orbit-xxs">
        {OPTIONS.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "relative h-7 rounded-full px-orbit-base text-xs v5-orbit-weight-medium transition-colors",
                active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="clauseiq-results-option"
                  className="absolute inset-0 rounded-full bg-primary shadow-sm"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}
              <span className="relative z-10">{option.label}</span>
            </button>
          );
        })}
      </div>
      <Tooltip content={RATIONALE[value]} direction="top">
        <button
          type="button"
          aria-label="Design rationale"
          className="grid h-8 w-8 place-items-center rounded-full border border-border/80 bg-muted/50 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
        >
          <Info className="h-4 w-4" />
        </button>
      </Tooltip>
    </div>
  );
}
