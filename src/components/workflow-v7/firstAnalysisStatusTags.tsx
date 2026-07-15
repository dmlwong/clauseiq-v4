import { Chip } from "@/components/clauseiq-v7/orbit-ui/indicators";
import { cn } from "@/lib/utils";

export type FirstAnalysisStatusKey = "high" | "medium" | "low" | "missing" | "none";
type FirstAnalysisChipVariant = "Error" | "Warning" | "No Status" | "Outline" | "Success" | "Style 2";

export const FIRST_ANALYSIS_STATUS_THEME: Record<
  FirstAnalysisStatusKey,
  {
    label: string;
    indicatorColor: string;
    chipVariant: FirstAnalysisChipVariant;
    className: string;
  }
> = {
  high: {
    label: "High",
    indicatorColor: "var(--orbit-color-text-error)",
    chipVariant: "Error",
    className: "border-orbit-error-border bg-orbit-error-surface text-orbit-error",
  },
  medium: {
    label: "Medium",
    indicatorColor: "var(--orbit-color-text-warning)",
    chipVariant: "Warning",
    className: "border-orbit-warning-border bg-orbit-warning-surface text-orbit-warning",
  },
  low: {
    label: "Low",
    indicatorColor: "var(--orbit-color-chip-style-2-border)",
    chipVariant: "Style 2",
    className: "border-orbit-teal bg-orbit-teal-surface text-orbit-teal",
  },
  missing: {
    label: "Missing Clause",
    indicatorColor: "var(--orbit-color-text-secondary)",
    chipVariant: "Outline",
    className: "border-orbit-border bg-orbit-card text-orbit-fg-secondary",
  },
  none: {
    label: "None",
    indicatorColor: "var(--orbit-color-text-success)",
    chipVariant: "Success",
    className: "border-orbit-success-border bg-orbit-success-surface text-orbit-success",
  },
};

export function FirstAnalysisStatusTag({
  status,
  label,
  className,
  size = "default",
}: {
  status: FirstAnalysisStatusKey;
  label?: string;
  className?: string;
  size?: "default" | "count";
}) {
  const theme = FIRST_ANALYSIS_STATUS_THEME[status];

  return (
    <span className={cn("inline-flex shrink-0", size === "count" && "min-w-6", className)}>
      <Chip
        label={label ?? theme.label}
        size="Mini"
        variant={theme.chipVariant}
        contrast="Low"
      />
    </span>
  );
}
