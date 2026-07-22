import { Avatar } from "@orbit";

import type { SupplierSeverity } from "@/lib/clauseiq-utils";

interface Props {
  name: string;
  shortCode: string;
  severity: SupplierSeverity;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Supplier cards do not navigate to a profile, so they must not borrow the
// interactive indigo treatment used by actionable user identities.
const SUPPLIER_AVATAR_COLOR = "var(--orbit-color-btn-primary-bg)";

const sizeMap = {
  sm: "Extra Small",
  md: "Small",
  lg: "Medium",
} as const;

export function SupplierAvatar({ name, shortCode, size = "md", className }: Props) {
  const avatar = (
    <Avatar
      style="Text"
      name={name}
      initials={shortCode}
      size={sizeMap[size]}
      color={SUPPLIER_AVATAR_COLOR}
    />
  );

  if (!className) return avatar;

  return <span className={className}>{avatar}</span>;
}
