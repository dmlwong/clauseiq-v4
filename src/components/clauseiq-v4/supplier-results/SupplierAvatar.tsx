import { cn } from "@/lib/utils";
import type { SupplierSeverity } from "@/lib/clauseiq-utils";

interface Props {
  name: string;
  shortCode: string;
  severity: SupplierSeverity;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const severityClass: Record<SupplierSeverity, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/15 text-warning-foreground border-warning/30",
  low: "bg-primary/10 text-primary border-primary/20",
  clean: "bg-success/10 text-success border-success/20",
};

const sizeClass = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
};

export function SupplierAvatar({ name, shortCode, severity, size = "md", className }: Props) {
  return (
    <div
      aria-label={name}
      className={cn(
        "grid shrink-0 place-items-center rounded-full border font-semibold",
        severityClass[severity],
        sizeClass[size],
        className,
      )}
    >
      {shortCode}
    </div>
  );
}
