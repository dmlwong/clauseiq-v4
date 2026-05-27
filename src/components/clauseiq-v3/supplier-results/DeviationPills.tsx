import { Badge } from "@/components/ui/badge";
import type { DeviationCounts } from "@/data/mock-clauseiq";
import { cn } from "@/lib/utils";

interface Props {
  deviations: DeviationCounts;
  compact?: boolean;
}

export function DeviationPills({ deviations, compact = false }: Props) {
  const pillClass = cn(
    "rounded-full font-medium",
    compact ? "px-2 py-0 text-[10px]" : "px-2.5 py-0.5 text-xs",
  );

  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="outline" className={cn(pillClass, "border-border bg-muted text-muted-foreground")}>
        Missing {deviations.missing}
      </Badge>
      <Badge
        variant="outline"
        className={cn(pillClass, "border-destructive/25 bg-destructive/10 text-destructive")}
      >
        High {deviations.high}
      </Badge>
      <Badge
        variant="outline"
        className={cn(pillClass, "border-warning/30 bg-warning/15 text-warning-foreground")}
      >
        Med {deviations.medium}
      </Badge>
      <Badge variant="outline" className={cn(pillClass, "border-border bg-background text-muted-foreground")}>
        Low {deviations.low}
      </Badge>
      <Badge variant="outline" className={cn(pillClass, "border-border bg-background text-muted-foreground")}>
        None {deviations.none}
      </Badge>
    </div>
  );
}
