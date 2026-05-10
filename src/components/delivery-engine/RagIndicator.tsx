import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { RagStatus } from "@/data/mock-delivery-engine";

const tone: Record<RagStatus, string> = {
  green: "bg-emerald-500",
  amber: "bg-amber-400",
  red: "bg-red-500",
};

export function RagIndicator({
  status,
  onChange,
  compact = false,
}: {
  status: RagStatus;
  onChange?: (status: RagStatus) => void;
  compact?: boolean;
}) {
  if (!onChange) {
    return <span className={cn("inline-block rounded-full", compact ? "h-3 w-3" : "h-4 w-4", tone[status])} />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 w-[54px] gap-1.5 px-2">
          <span className={cn("h-4 w-4 rounded-full", tone[status])} />
          <ChevronDown className="h-3.5 w-3.5 text-slate-600" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        {(["green", "amber", "red"] as RagStatus[]).map((value) => (
          <DropdownMenuItem key={value} className="gap-2 capitalize" onClick={() => onChange(value)}>
            <span className={cn("h-2.5 w-2.5 rounded-full", tone[value])} />
            {value}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
