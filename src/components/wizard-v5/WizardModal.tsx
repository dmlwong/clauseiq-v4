import { useCallback, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/clauseiq-v5/orbit-ui/button";
import { Stepper } from "@/components/wizard-v5/Stepper";
import { PriorToUse } from "@/components/wizard-v5/steps/PriorToUse";
import { UploadFiles } from "@/components/wizard-v5/steps/UploadFiles";
import { Settings } from "@/components/wizard-v5/steps/Settings";
import { ClientPlaybook } from "@/components/wizard-v5/steps/ClientPlaybook";
import { GenerateResults } from "@/components/wizard-v5/steps/GenerateResults";
import { uploadFile, resolveRouting, runAnalysis, getAnalysisStatus, auditLog } from "@/lib/mock-api";
import type { WizardState } from "@/hooks/use-wizard-state";
import { useV5OrbitToast } from "@/components/clauseiq-v5/V5OrbitToast";

interface WizardModalProps {
  state: WizardState;
  update: (partial: Partial<WizardState>) => void;
  completeStep: (step: number) => void;
  goNext: () => void;
  goBack: () => void;
  closeWizard: () => void;
  context?: {
    initiativeName: string;
    initiativeRef: string;
    supplierName: string;
    contractName: string;
    versionLabel: string;
  };
}

export function WizardModal({ state, update, completeStep, goNext, goBack, closeWizard, context }: WizardModalProps) {
  const { toast } = useV5OrbitToast();
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleContractUpload = useCallback(async () => {
    if (!state.contractFile) return;
    setUploading(true);
    try {
      const result = await uploadFile(state.contractFile);
      update({ contractFileId: result.fileId });
      completeStep(1);
      goNext();
      toast({ title: "Upload successful", description: state.contractFile.name });
    } catch {
      toast({ title: "Upload failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }, [state.contractFile, update, completeStep, goNext, toast]);

  const handleSettingsNext = useCallback(async () => {
    if (!state.company || !state.category || !state.documentType) {
      toast({ title: "Required fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    try {
      const routing = await resolveRouting(state.company, state.category, state.documentType);
      update({ routingMetadata: routing });
      auditLog("routing_resolved", { company: state.company, category: state.category, routing });
      completeStep(2);
      goNext();
    } catch {
      toast({ title: "Routing failed", description: "Could not resolve routing.", variant: "destructive" });
    }
  }, [state.company, state.category, state.documentType, update, completeStep, goNext, toast]);

  const handlePlaybookNext = useCallback(async () => {
    if (state.playbookFile) {
      try {
        const result = await uploadFile(state.playbookFile);
        update({ playbookFileId: result.fileId });
        toast({ title: "Playbook uploaded", description: state.playbookFile.name });
      } catch {
        toast({ title: "Playbook upload failed", variant: "destructive" });
        return;
      }
    }
    completeStep(3);
    goNext();
  }, [state.playbookFile, update, completeStep, goNext, toast]);

  const handleGenerate = useCallback(async () => {
    if (!state.contractFileId || !state.routingMetadata) return;
    setGenerating(true);
    try {
      const job = await runAnalysis({
        contractFileId: state.contractFileId,
        playbookFileId: state.playbookFileId ?? undefined,
        companyId: state.company,
        categoryId: state.category,
        documentType: state.documentType,
        routing: state.routingMetadata,
      });
      update({ analysisJob: job });

      // Poll for completion
      const poll = async (id: string, attempts = 0): Promise<void> => {
        if (attempts > 10) {
          update({ analysisJob: { id, status: "failed", progress: 0, error: "Timeout" } });
          setGenerating(false);
          return;
        }
        const status = await getAnalysisStatus(id);
        update({ analysisJob: status });
        if (status.status === "completed" || status.status === "failed") {
          setGenerating(false);
          if (status.status === "completed") {
            completeStep(4);
            auditLog("results_ready", { jobId: id });
          }
        } else {
          setTimeout(() => poll(id, attempts + 1), 1500);
        }
      };
      poll(job.id);
    } catch {
      setGenerating(false);
      toast({ title: "Analysis submission failed", variant: "destructive" });
    }
  }, [state, update, completeStep, toast]);

  if (!state.wizardOpen) return null;

  const step = state.currentStep;

  const renderFooter = () => {
    if (step === 4 && (generating || state.analysisJob)) return null;

    return (
      <div className="flex items-center justify-between px-8 py-4 border-t border-border bg-card">
        <Button variant="ghost" onClick={closeWizard}>
          Cancel
        </Button>
        <div className="flex gap-2">
          {step > 0 && (
            <Button variant="outline" onClick={goBack}>
              Back
            </Button>
          )}
          {step === 0 && (
            <Button onClick={() => { completeStep(0); goNext(); }}>
              Next
            </Button>
          )}
          {step === 1 && (
            <Button onClick={handleContractUpload} disabled={!state.contractFile || uploading}>
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          )}
          {step === 2 && (
            <Button onClick={handleSettingsNext} disabled={!state.company || !state.category || !state.documentType}>
              Next
            </Button>
          )}
          {step === 3 && (
            <Button onClick={handlePlaybookNext}>
              {state.playbookFile ? "Upload & Next" : "Skip"}
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/40" onClick={closeWizard} />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-card rounded-xl shadow-2xl border border-border flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-8 py-4 border-b border-border space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-semibold text-foreground">ClauseIQ Contract</h1>
            <button onClick={closeWizard} className="p-1 rounded hover:bg-accent transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          {context && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
              <span className="font-medium text-foreground">{context.initiativeName}</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 bg-muted rounded">{context.initiativeRef}</span>
              <span>›</span>
              <span className="font-medium text-foreground">{context.supplierName}</span>
              <span>›</span>
              <span className="font-medium text-foreground">{context.contractName}</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded">{context.versionLabel}</span>
            </div>
          )}
        </div>

        {/* Stepper */}
        <Stepper currentStep={step} completedSteps={state.completedSteps} />

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {step === 0 && <PriorToUse />}
          {step === 1 && (
            <UploadFiles
              file={state.contractFile}
              onFileSelect={(f) => update({ contractFile: f })}
              onClear={() => update({ contractFile: null, contractFileId: null })}
            />
          )}
          {step === 2 && (
            <Settings
              company={state.company}
              category={state.category}
              documentType={state.documentType}
              routingMetadata={state.routingMetadata}
              onCompanyChange={(v) => update({ company: v, routingMetadata: null })}
              onCategoryChange={(v) => update({ category: v, routingMetadata: null })}
              onDocTypeChange={(v) => update({ documentType: v, routingMetadata: null })}
            />
          )}
          {step === 3 && (
            <ClientPlaybook
              file={state.playbookFile}
              onFileSelect={(f) => update({ playbookFile: f })}
              onClear={() => update({ playbookFile: null, playbookFileId: null })}
              playbookAvailable={state.routingMetadata?.playbookModeAvailable ?? true}
            />
          )}
          {step === 4 && (
            <GenerateResults
              contractFile={state.contractFile}
              playbookFile={state.playbookFile}
              company={state.company}
              category={state.category}
              documentType={state.documentType}
              routingMetadata={state.routingMetadata}
              analysisJob={state.analysisJob}
              onGenerate={handleGenerate}
              generating={generating}
            />
          )}
        </div>

        {/* Footer */}
        {renderFooter()}
      </div>
    </div>
  );
}
