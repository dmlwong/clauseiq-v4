import { cn } from "@/lib/utils";
import type { DeliveryStatus } from "@/data/mock-delivery-engine";

export function StatusBadge({ status }: { status: DeliveryStatus }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded border px-2 text-xs font-medium",
        status === "In-flight"
          ? "border-blue-600 bg-blue-50 text-blue-700"
          : "border-blue-600 bg-white text-blue-700",
      )}
    >
      {status}
    </span>
  );
}
