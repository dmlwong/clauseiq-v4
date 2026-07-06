import {
  FirstAnalysisStatusTag,
  type FirstAnalysisStatusKey,
} from "@/components/workflow-v6a/firstAnalysisStatusTags";
import type { DeviationCounts } from "@/data/mock-clauseiq-v6";

interface Props {
  deviations: DeviationCounts;
  compact?: boolean;
  singleLine?: boolean;
}

const deviationItems: Array<{
  key: keyof DeviationCounts;
  label: string;
  status: FirstAnalysisStatusKey;
}> = [
  { key: "missing", label: "Missing", status: "missing" },
  { key: "high", label: "High", status: "high" },
  { key: "medium", label: "Medium", status: "medium" },
  { key: "low", label: "Low", status: "low" },
  { key: "none", label: "None", status: "none" },
];

export function DeviationPills({ deviations, compact = false, singleLine = false }: Props) {
  const rowClassName = singleLine
    ? "flex flex-nowrap gap-orbit-xs overflow-x-auto whitespace-nowrap pb-orbit-xxs"
    : compact
      ? "flex flex-wrap gap-orbit-xs"
      : "flex flex-wrap gap-orbit-s";

  return (
    <div className={rowClassName}>
      {deviationItems.map((item) => {
        const label = `${item.label} ${deviations[item.key]}`;
        return (
          <FirstAnalysisStatusTag
            key={item.key}
            status={item.status}
            label={label}
            size={compact ? "count" : "default"}
          />
        );
      })}
    </div>
  );
}
