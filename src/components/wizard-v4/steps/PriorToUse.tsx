import { Info } from "lucide-react";

export function PriorToUse() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Tool Overview</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Please review the following before proceeding.
        </p>
      </div>
      <div className="bg-secondary/60 border border-border rounded-lg p-6 space-y-4">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-3 text-sm text-foreground leading-relaxed">
            <p>
              <strong>ClauseIQ Contract</strong> analyses supplier contracts to help legal and
              procurement teams make informed decisions faster.
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-muted-foreground">
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
