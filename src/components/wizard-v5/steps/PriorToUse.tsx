import { Info } from "lucide-react";

export function PriorToUse() {
  return (
    <div className="p-orbit-l space-y-orbit-m">
      <div>
        <h2 className="text-lg v5-orbit-weight-semibold text-foreground">Tool Overview</h2>
        <p className="text-sm text-muted-foreground mt-orbit-xs">
          Please review the following before proceeding.
        </p>
      </div>
      <div className="bg-secondary/60 border border-border rounded-lg p-orbit-m space-y-orbit-base">
        <div className="flex gap-orbit-base">
          <Info className="w-5 h-5 text-primary shrink-0 mt-orbit-xxs" />
          <div className="space-y-orbit-base text-sm text-foreground leading-relaxed">
            <p>
              <strong>ClauseIQ Contract</strong> analyses supplier contracts to help legal and
              procurement teams make informed decisions faster.
            </p>
            <ul className="list-disc list-inside space-y-orbit-xs text-muted-foreground">
              <li>Extract key clauses and terms from uploaded contracts</li>
              <li>Flag risks, deviations, and non-standard language</li>
              <li>Compare against benchmark clause libraries</li>
              <li>Generate actionable summaries to support negotiations</li>
              <li>Download structured results for offline review</li>
            </ul>
            <p className="text-muted-foreground">
              This tool is intended for professional use. Uploaded documents are processed
              securely and are not retained beyond the analysis session.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
