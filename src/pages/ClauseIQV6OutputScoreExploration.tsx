import { FlaskConical } from "lucide-react";
import { V6Shell } from "@/components/clauseiq-v6/V6Shell";
import { SupplierOutputScoreExplorationPanel } from "@/components/clauseiq-v6/supplier-results/ScoreExplorationPanel";

export default function ClauseIQV6OutputScoreExploration() {
  return (
    <V6Shell
      title="ClauseIQ"
      subtitle="Supplier output score exploration"
      mainClassName="clauseiq-v6-canvas-grid"
      headerRight={
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
          <FlaskConical className="h-4 w-4" />
        </div>
      }
    >
      <div className="mx-auto max-w-[1680px] px-orbit-l py-orbit-xxl">
        <SupplierOutputScoreExplorationPanel />
      </div>
    </V6Shell>
  );
}
