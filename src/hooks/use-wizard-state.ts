import { useState, useCallback } from "react";
import type { RoutingMetadata, AnalysisJob } from "@/lib/mock-api";

export interface WizardState {
  wizardOpen: boolean;
  currentStep: number;
  completedSteps: Set<number>;
  contractFile: File | null;
  contractFileId: string | null;
  playbookFile: File | null;
  playbookFileId: string | null;
  company: string;
  category: string;
  documentType: string;
  routingMetadata: RoutingMetadata | null;
  analysisJob: AnalysisJob | null;
}

const initial: WizardState = {
  wizardOpen: false,
  currentStep: 0,
  completedSteps: new Set(),
  contractFile: null,
  contractFileId: null,
  playbookFile: null,
  playbookFileId: null,
  company: "",
  category: "",
  documentType: "",
  routingMetadata: null,
  analysisJob: null,
};

export function useWizardState() {
  const [state, setState] = useState<WizardState>(initial);

  const update = useCallback((partial: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const completeStep = useCallback((step: number) => {
    setState((prev) => {
      const next = new Set(prev.completedSteps);
      next.add(step);
      return { ...prev, completedSteps: next };
    });
  }, []);

  const goNext = useCallback(() => {
    setState((prev) => ({ ...prev, currentStep: Math.min(prev.currentStep + 1, 4) }));
  }, []);

  const goBack = useCallback(() => {
    setState((prev) => ({ ...prev, currentStep: Math.max(prev.currentStep - 1, 0) }));
  }, []);

  const openWizard = useCallback(() => update({ wizardOpen: true }), [update]);
  const closeWizard = useCallback(() => update({ wizardOpen: false }), [update]);

  const resetWizard = useCallback(() => setState(initial), []);

  return { state, update, completeStep, goNext, goBack, openWizard, closeWizard, resetWizard };
}
