import { motion } from "framer-motion";
import { Info } from "@/components/clauseiq-v6a/v6aIcons";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/clauseiq-v6a/orbit-ui/tooltip";

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
      <span className="text-orbit-xs v6-orbit-weight-medium uppercase tracking-wider text-orbit-fg-secondary">
        Design options
      </span>
      <div className="inline-flex h-8 items-center rounded-full border border-orbit-border/80 bg-orbit-surface/50 p-orbit-xxs">
        {OPTIONS.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "relative h-7 rounded-full px-orbit-base text-orbit-xs v6-orbit-weight-medium transition-colors",
                active ? "text-orbit-primary-foreground" : "text-orbit-fg-secondary hover:text-orbit-fg",
              )}
            >
              {active && (
                <motion.span
                  layoutId="clauseiq-results-option"
                  className="absolute inset-0 rounded-full bg-orbit-primary shadow-orbit-sm"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}
              <span className="relative z-10">{option.label}</span>
            </button>
          );
        })}
      </div>
      <Tooltip>
        <TooltipTrigger>
          <button
            type="button"
            aria-label="Design rationale"
            className="grid h-8 w-8 place-items-center rounded-full border border-orbit-border/80 bg-orbit-surface/50 text-orbit-fg-secondary transition-colors hover:bg-orbit-canvas hover:text-orbit-fg"
          >
            <Info className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">{RATIONALE[value]}</TooltipContent>
      </Tooltip>
    </div>
  );
}
