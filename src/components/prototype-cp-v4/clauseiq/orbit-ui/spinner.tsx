import { Spinner as OrbitSpinner } from "@orbit";

export function Spinner({
  size = "Medium",
  label,
  decorative,
}: {
  size?: "Inline" | "Medium" | "Large";
  label?: string;
  decorative?: boolean;
}) {
  return <OrbitSpinner size={size} label={label} decorative={decorative} />;
}
