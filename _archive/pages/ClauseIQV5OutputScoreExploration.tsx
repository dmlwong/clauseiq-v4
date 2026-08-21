import { FlaskConical } from "lucide-react";
import { V5Shell } from "@/components/clauseiq-v5/V5Shell";
import { SupplierOutputScoreExplorationPanel } from "@/components/clauseiq-v5/supplier-results/ScoreExplorationPanel";

export default function ClauseIQV5OutputScoreExploration() {
  return (
    <V5Shell
      title="ClauseIQ"
      subtitle="Supplier output score exploration"
      mainClassName="clauseiq-v5-canvas-grid"
      headerRight={
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
          <FlaskConical className="h-4 w-4" />
        </div>
      }
    >
      <div className="mx-auto max-w-[1680px] px-orbit-l py-orbit-xxl">
        <SupplierOutputScoreExplorationPanel />
      </div>
    </V5Shell>
  );
}
