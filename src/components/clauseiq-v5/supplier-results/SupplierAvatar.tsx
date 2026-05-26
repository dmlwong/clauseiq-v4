import { Avatar } from "@orbit";

import type { SupplierSeverity } from "@/lib/clauseiq-utils";

interface Props {
  name: string;
  shortCode: string;
  severity: SupplierSeverity;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const severityColor: Record<SupplierSeverity, string> = {
  high: "var(--orbit-color-status-high-bg-error)",
  medium: "var(--orbit-color-status-high-bg-warning)",
  low: "var(--orbit-color-status-high-bg-information)",
  clean: "var(--orbit-color-status-high-bg-success)",
};

const sizeMap = {
  sm: "Extra Small",
  md: "Small",
  lg: "Medium",
} as const;

export function SupplierAvatar({ name, shortCode, severity, size = "md", className }: Props) {
  const avatar = (
    <Avatar
      style="Text"
      name={name}
      initials={shortCode}
      size={sizeMap[size]}
      color={severityColor[severity]}
    />
  );

  if (!className) return avatar;

  return <span className={className}>{avatar}</span>;
}
