import {
  FirstAnalysisStatusTag,
  type FirstAnalysisStatusKey,
} from "@/components/workflow-v5/firstAnalysisStatusTags";
import type { DeviationCounts } from "@/data/mock-clauseiq";

interface Props {
  deviations: DeviationCounts;
  compact?: boolean;
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

export function DeviationPills({ deviations, compact = false }: Props) {
  return (
    <div className={compact ? "flex flex-wrap gap-orbit-xs" : "flex flex-wrap gap-orbit-s"}>
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
