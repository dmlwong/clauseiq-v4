import { Chip } from "@/components/clauseiq-v5/orbit-ui/indicators";
import { cn } from "@/lib/utils";

export type FirstAnalysisStatusKey = "high" | "medium" | "low" | "missing" | "none";
type FirstAnalysisChipVariant = "Error" | "Warning" | "No Status" | "Outline" | "Success";

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
    indicatorColor: "#5F5E5A",
    chipVariant: "Outline",
    className: "border-[#D9D8D2] bg-[#F5F5F2] text-[#5F5E5A]",
  },
  missing: {
    label: "Missing Clause",
    indicatorColor: "#185FA5",
    chipVariant: "Information",
    className: "border-[#B8D7F1] bg-[#E6F1FB] text-[#0C447C]",
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
