import { Chip } from "@orbit";
import type { DeviationCounts } from "@/data/mock-clauseiq";

interface Props {
  deviations: DeviationCounts;
  compact?: boolean;
  singleLine?: boolean;
}

export function DeviationPills({ deviations, compact = false, singleLine = false }: Props) {
  const size = compact ? "Mini" : "Small";

  return (
    <div className={compact ? `flex ${singleLine ? "flex-nowrap gap-[8px]" : "flex-wrap gap-1"}` : "flex flex-wrap gap-2"}>
      <Chip label={`Missing ${deviations.missing}`} size={size} variant="Information" />
      <Chip label={`High ${deviations.high}`} size={size} variant="Error" />
      <Chip label={`Med ${deviations.medium}`} size={size} variant="Warning" />
      <span className="inline-flex [&>span]:!border [&>span]:!border-solid [&>span]:!border-[var(--orbit-color-status-low-border-no-status)]">
        <Chip label={`Low ${deviations.low}`} size={size} variant="No Status" />
      </span>
      <Chip label={`None ${deviations.none}`} size={size} variant="Outline" />
    </div>
  );
}
