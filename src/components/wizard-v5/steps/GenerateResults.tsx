import { FileText, Building2, Database, Download, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/clauseiq-v5/orbit-ui/button";
import type { RoutingMetadata, AnalysisJob } from "@/lib/mock-api";

interface GenerateResultsProps {
  contractFile: File | null;
  playbookFile: File | null;
  company: string;
  category: string;
  documentType: string;
  routingMetadata: RoutingMetadata | null;
  analysisJob: AnalysisJob | null;
  onGenerate: () => void;
  generating: boolean;
}

function SummaryRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2">
      {icon && <div className="mt-0.5 text-primary">{icon}</div>}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export function GenerateResults({
  contractFile,
  playbookFile,
  company,
  category,
  documentType,
  routingMetadata,
  analysisJob,
  onGenerate,
  generating,
}: GenerateResultsProps) {
  const docLabels: Record<string, string> = {
    msa: "Master Service Agreement (MSA)",
    mpa: "Master Procurement Agreement (MPA)",
    sow: "Statement of Work (SOW)",
    saas: "SaaS Agreement",
    other: "Other",
  };

  if (analysisJob?.status === "completed") {
    return (
      <div className="p-8 flex flex-col items-center text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-success" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Analysis Complete</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Your contract has been analysed successfully. Download the results below.
          </p>
        </div>
        <Button onClick={() => window.open(analysisJob.resultDownloadUrl, "_blank")}>
          <Download className="w-4 h-4 mr-2" />
          Download Results
        </Button>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-4">
          {["Risk Flags", "Key Clauses", "Deviation Report"].map((title) => (
            <div key={title} className="border border-border rounded-lg p-4 bg-card text-left">
              <p className="text-sm font-medium">{title}</p>
              <p className="text-xs text-muted-foreground mt-1">Ready for review</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (analysisJob?.status === "failed") {
    return (
      <div className="p-8 flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold">Analysis Failed</h2>
        <p className="text-sm text-muted-foreground">{analysisJob.error || "An unexpected error occurred."}</p>
        <Button onClick={onGenerate}>Retry</Button>
      </div>
    );
  }

  if (generating || analysisJob?.status === "processing" || analysisJob?.status === "queued") {
    return (
      <div className="p-8 flex flex-col items-center text-center space-y-6">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <div>
          <h2 className="text-lg font-semibold">Analysing Contract...</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {analysisJob?.status === "queued" ? "Queued for processing..." : `Processing (${analysisJob?.progress ?? 0}%)`}
          </p>
        </div>
        <div className="w-full max-w-xs h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${analysisJob?.progress ?? 5}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Review & Generate</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review your selections below and click Generate Results to start the analysis.
        </p>
      </div>

      <div className="border border-border rounded-lg divide-y divide-border bg-card">
        <div className="p-4">
          <SummaryRow
            icon={<FileText className="w-4 h-4" />}
            label="Contract File"
            value={contractFile?.name ?? "—"}
          />
          <SummaryRow
            icon={<FileText className="w-4 h-4" />}
            label="Client Playbook"
            value={playbookFile?.name ?? "None (skipped)"}
          />
        </div>
        <div className="p-4">
          <SummaryRow icon={<Building2 className="w-4 h-4" />} label="Company" value={company} />
          <SummaryRow label="Category" value={category} />
          <SummaryRow label="Document Type" value={docLabels[documentType] ?? documentType} />
        </div>
        {routingMetadata && (
          <div className="p-4">
            <SummaryRow
              icon={<Database className="w-4 h-4" />}
              label="Routing Target"
              value={`${routingMetadata.databaseName} (${routingMetadata.databaseId})`}
            />
          </div>
        )}
      </div>

      <div className="flex justify-center pt-2">
        <Button onClick={onGenerate}>
          Generate Results
        </Button>
      </div>
    </div>
  );
}
