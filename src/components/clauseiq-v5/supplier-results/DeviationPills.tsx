import { Chip } from "@/components/clauseiq-v5/orbit-ui/indicators";
import type { DeviationCounts } from "@/data/mock-clauseiq";

interface Props {
  deviations: DeviationCounts;
  compact?: boolean;
}

export function DeviationPills({ deviations, compact = false }: Props) {
  const size = compact ? "Mini" : "Small";

  return (
    <div className={compact ? "flex flex-wrap gap-1" : "flex flex-wrap gap-2"}>
      <Chip label={`Missing ${deviations.missing}`} size={size} variant="No Status" />
      <Chip label={`High ${deviations.high}`} size={size} variant="Error" />
      <Chip label={`Medium ${deviations.medium}`} size={size} variant="Warning" />
      <Chip label={`Low ${deviations.low}`} size={size} variant="Success" />
    </div>
  );
}
