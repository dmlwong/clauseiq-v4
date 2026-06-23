import { Chip } from "@orbit";

import { cn } from "@/lib/utils";

export type FirstAnalysisStatusKey =
  | "high"
  | "medium"
  | "low"
  | "missing"
  | "none";

type FirstAnalysisChipVariant =
  | "Error"
  | "Warning"
  | "No Status"
  | "Outline"
  | "Success"
  | "Information"
  | "Style 2";

export const CPV2_FIRST_ANALYSIS_STATUS_THEME: Record<
  FirstAnalysisStatusKey,
  {
    label: string;
    indicatorColor: string;
    chipVariant: FirstAnalysisChipVariant;
    className: string;
  }
> = {
  high: {
    label: "High Deviation",
    indicatorColor: "#A32D2D",
    chipVariant: "Error",
    className: "border-[#F3B4B4] bg-[#FFF1F2] text-[#A32D2D]",
  },
  medium: {
    label: "Medium Deviation",
    indicatorColor: "#BA7517",
    chipVariant: "Warning",
    className: "border-[#F1D29B] bg-[#FFF8E8] text-[#854F0B]",
  },
  low: {
    label: "Low Deviation",
    indicatorColor: "#34585C",
    chipVariant: "Style 2",
    className: "border-[#34585C] bg-[#E5EDEE] text-[#34585C]",
  },
  missing: {
    label: "Missing Clause",
    indicatorColor: "#5F5E5A",
    chipVariant: "Outline",
    className: "border-[#D9D8D2] bg-[#FFFFFF] text-[#5F5E5A]",
  },
  none: {
    label: "None Deviation",
    indicatorColor: "#3B6D11",
    chipVariant: "Success",
    className: "border-[#BFD6AB] bg-[#EAF3DE] text-[#27500A]",
  },
};

export function FirstAnalysisStatusTag({
  status,
  label,
  className,
}: {
  status: FirstAnalysisStatusKey;
  label?: string;
  className?: string;
}) {
  const theme = CPV2_FIRST_ANALYSIS_STATUS_THEME[status];

  return (
    <span className={cn("inline-flex shrink-0", className)}>
      <Chip
        contrast="Low"
        label={label ?? theme.label}
        size="Mini"
        variant={theme.chipVariant}
      />
    </span>
  );
}
