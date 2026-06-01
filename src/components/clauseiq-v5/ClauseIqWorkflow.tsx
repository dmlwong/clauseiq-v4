import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  BadgeCheck,
  BookOpen,
  Building2,
  Check,
  ChevronUp,
  ClipboardList,
  FilePlus2,
  Info,
  ListChecks,
  Pencil,
  Scale,
  Sparkles,
  Upload,
} from "lucide-react";
import { LinkText, Text } from "@orbit";

import { Button } from "@/components/clauseiq-v5/orbit-ui/button";
import { StateCard, type CardState } from "@/components/clauseiq-v5/StateCard";
import { showV5OrbitToast as toast } from "@/components/clauseiq-v5/V5OrbitToast";
import { mockInitiative, type ClauseAnalysis, type Initiative } from "@/data/mock-clauseiq";
import {
  CIQ_DEFAULT_PLAYBOOK,
  CIQ_PARAMETER_OPTIONS,
  PLAYBOOK_SCOPE_DISCLAIMER,
  type CiqInitiative,
  type CiqParameterKind,
  type CiqParameterOption,
} from "@/lib/clauseiq-v4-data";
import { cn } from "@/lib/utils";
import type {
  AnalysisParameterItem,
  SupplierOutputsPanelState,
} from "@/components/clauseiq-v5/supplier-results/types";

export type ClauseIqWorkflowStep = "welcome" | "select" | "parameters" | "upload" | "processing" | "results";
export type AnalysisBasisKind = Exclude<CiqParameterKind, "Category">;

export interface AnalysisBasisSelection {
  kind: AnalysisBasisKind;
  label: string;
}

export interface AnalysisParameterSelection {
  basis: AnalysisBasisSelection | null;
  category: string | null;
}

export const PROCESSING_MS = 3_000;
export const DEFAULT_BASIS_SELECTION: AnalysisBasisSelection = { kind: "Playbook", label: CIQ_DEFAULT_PLAYBOOK };
export const BASIS_PARAMETER_OPTIONS = CIQ_PARAMETER_OPTIONS.filter(
  (option): option is CiqParameterOption & { kind: AnalysisBasisKind } => option.kind !== "Category",
);
export const CATEGORY_PARAMETER_OPTION = CIQ_PARAMETER_OPTIONS.find((option) => option.kind === "Category");
export const NEXT_ACTION_MILESTONES = Array.from({ length: 5 }, (_, index) => ({
  id: `gate-${index + 1}`,
  label: `Gate ${index + 1}`,
  dueDate: "21/05/2026",
}));
export const EMPTY_MOCK_INITIATIVE: Initiative = {
  ...mockInitiative,
  suppliers: mockInitiative.suppliers.map((supplier) => ({
    ...supplier,
    analyses: [],
  })),
};
export const FIRST_RUN_MOCK_INITIATIVE: Initiative = {
  ...mockInitiative,
  suppliers: mockInitiative.suppliers.slice(0, 1).map((supplier) => ({
    ...supplier,
    analyses: supplier.analyses.slice(0, 1),
  })),
};
export const LATEST_V5_RESULTS_ROUTE =
  "/initiatives-v5?view=results&initiativeId=init-1&supplierId=sup-1&contractId=ct-1&source=clauseiq&catSort=risk&mode=comparison&tab=changes&design=row-scale&scenario=first-analysis";

export const createRerunAnalysis = (fileName: string): ClauseAnalysis => ({
  id: "a-rerun-latest",
  contractName: "New supplier contract",
  fileName,
  analysedAt: "2026-05-22T11:00:00Z",
  clausesReviewed: 47,
  status: "completed",
  deviations: { missing: 8, high: 6, medium: 4, low: 10, none: 19 },
});

export const createDefaultParameterSelection = (): AnalysisParameterSelection => ({
  basis: { ...DEFAULT_BASIS_SELECTION },
  category: null,
});

export const buildAnalysisParameters = (
  selected: AnalysisParameterSelection | null,
): AnalysisParameterItem[] => {
  const parameter = selected ?? createDefaultParameterSelection();
  const rows: AnalysisParameterItem[] = [];

  if (parameter.basis) {
    rows.push({ label: parameter.basis.kind, value: parameter.basis.label });
  }

  if (parameter.category) {
    rows.push({ label: "Category", value: parameter.category });
  }

  return rows;
};

export const hasCompleteAnalysisParameters = (
  selected: AnalysisParameterSelection | null,
): selected is AnalysisParameterSelection & { basis: AnalysisBasisSelection } => {
  if (!selected?.basis) return false;
  if (selected.basis.kind === "Playbook") return true;
  return Boolean(selected.category);
};

interface UseClauseIqWorkflowOptions {
  autoAdvanceParameters?: boolean;
  autoStartProcessingOnFile?: boolean;
  initialStep?: ClauseIqWorkflowStep;
  initialInitiative?: CiqInitiative | null;
  initialSelectedParameter?: AnalysisParameterSelection | null;
  initialRerunUploadVisible?: boolean;
  useFirstRunResults?: boolean;
  onProcessingComplete?: () => void;
  onRerunComplete?: () => void;
  onRunAgain?: () => void;
}

export function useClauseIqWorkflow({
  autoAdvanceParameters = true,
  autoStartProcessingOnFile = true,
  initialStep = "welcome",
  initialInitiative = null,
  initialSelectedParameter = null,
  initialRerunUploadVisible = false,
  useFirstRunResults = false,
  onProcessingComplete,
  onRerunComplete,
  onRunAgain,
}: UseClauseIqWorkflowOptions = {}) {
  const [step, setStep] = useState<ClauseIqWorkflowStep>(initialStep);
  const [initiative, setInitiative] = useState<CiqInitiative | null>(initialInitiative);
  const [selectedParameter, setSelectedParameter] = useState<AnalysisParameterSelection | null>(initialSelectedParameter);
  const [file, setFile] = useState<File | null>(null);
  const [rerunUploadVisible, setRerunUploadVisible] = useState(initialRerunUploadVisible);
  const [rerunSelectedParameter, setRerunSelectedParameter] = useState<AnalysisParameterSelection | null>(null);
  const [rerunProcessing, setRerunProcessing] = useState(false);
  const [pendingRerunAnalysis, setPendingRerunAnalysis] = useState<ClauseAnalysis | null>(null);
  const [pendingRerunParameter, setPendingRerunParameter] = useState<AnalysisParameterSelection | null>(null);
  const [completedRerunAnalysis, setCompletedRerunAnalysis] = useState<ClauseAnalysis | null>(null);
  const [completedRerunParameter, setCompletedRerunParameter] = useState<AnalysisParameterSelection | null>(null);
  const [completedMilestoneIds, setCompletedMilestoneIds] = useState<string[]>([]);
  const [initiativeCompleted, setInitiativeCompleted] = useState(false);

  const resultsVisible = step === "results";
  const resultsInitiative = useFirstRunResults ? FIRST_RUN_MOCK_INITIATIVE : mockInitiative;
  const rerunSupplier = resultsInitiative.suppliers[0];
  const newAnalysisSectionVisible = rerunUploadVisible || rerunProcessing || completedRerunAnalysis !== null;
  const selectedAnalysisParameters = buildAnalysisParameters(selectedParameter);
  const completedRerunAnalysisParameters = buildAnalysisParameters(completedRerunParameter ?? selectedParameter);
  const supplierOutputPanelState: SupplierOutputsPanelState = resultsVisible
    ? "filled"
    : step === "processing" || rerunProcessing
      ? "processing"
      : "empty";
  const supplierOutputInitiative =
    supplierOutputPanelState === "filled" ? resultsInitiative : EMPTY_MOCK_INITIATIVE;
  const initiativeLocked = step === "processing" || step === "results";
  const parameterLocked = step === "processing" || step === "results";
  const processingVisible = step === "processing" || step === "results";
  const showPostAnalysisActions = resultsVisible && !rerunUploadVisible && !rerunProcessing;

  useEffect(() => {
    if (step !== "processing") return undefined;
    const timeout = window.setTimeout(() => {
      setStep("results");
      onProcessingComplete?.();
    }, PROCESSING_MS);
    return () => window.clearTimeout(timeout);
  }, [onProcessingComplete, step]);

  useEffect(() => {
    if (!rerunProcessing) return undefined;
    const timeout = window.setTimeout(() => {
      setRerunProcessing(false);
      setCompletedRerunAnalysis(pendingRerunAnalysis ?? createRerunAnalysis("New_Contract.pdf"));
      setCompletedRerunParameter(pendingRerunParameter ?? selectedParameter ?? createDefaultParameterSelection());
      setPendingRerunAnalysis(null);
      setPendingRerunParameter(null);
      setRerunSelectedParameter(null);
      setFile(null);
      toast.success("New analysis added as latest output.");
      onRerunComplete?.();
    }, PROCESSING_MS);
    return () => window.clearTimeout(timeout);
  }, [onRerunComplete, pendingRerunAnalysis, pendingRerunParameter, rerunProcessing, selectedParameter]);

  const resetRunState = useCallback((clearInitiative = false) => {
    if (clearInitiative) setInitiative(null);
    setSelectedParameter(null);
    setFile(null);
    setRerunUploadVisible(false);
    setRerunSelectedParameter(null);
    setRerunProcessing(false);
    setPendingRerunAnalysis(null);
    setPendingRerunParameter(null);
    setCompletedRerunAnalysis(null);
    setCompletedRerunParameter(null);
    setCompletedMilestoneIds([]);
    setInitiativeCompleted(false);
  }, []);

  const selectInitiative = (nextInitiative: CiqInitiative) => {
    setInitiative(nextInitiative);
    setSelectedParameter(null);
    setFile(null);
    setStep("parameters");
  };

  const startSelect = () => {
    setStep("select");
  };

  const startParameters = () => {
    resetRunState(false);
    setStep("parameters");
  };

  const startAnotherInitiative = (clearInitiative = true) => {
    resetRunState(clearInitiative);
    setStep("welcome");
  };

  const showResultsFromRoute = (defaultInitiative: CiqInitiative, showRerunUpload: boolean) => {
    setInitiative((current) => current ?? defaultInitiative);
    setSelectedParameter((current) => current ?? createDefaultParameterSelection());
    setStep("results");
    if (showRerunUpload) setRerunUploadVisible(true);
  };

  const handleBasisSelect = (option: CiqParameterOption, value: string) => {
    if (option.kind === "Category") return;
    setSelectedParameter((current) => ({
      basis: { kind: option.kind, label: value },
      category: option.kind === "Governing Law" ? current?.category ?? null : null,
    }));
    setFile(null);
    if (autoAdvanceParameters) {
      setStep(option.kind === "Playbook" ? "upload" : "parameters");
    } else {
      setStep("parameters");
    }
  };

  const handleCategorySelect = (_option: CiqParameterOption, value: string) => {
    setSelectedParameter((current) => ({
      basis: current?.basis ?? null,
      category: value,
    }));
    setFile(null);
    if (autoAdvanceParameters) {
      setStep("upload");
    } else {
      setStep("parameters");
    }
  };

  const handleRerunBasisSelect = (option: CiqParameterOption, value: string) => {
    if (option.kind === "Category") return;
    setRerunSelectedParameter((current) => ({
      basis: { kind: option.kind, label: value },
      category: option.kind === "Governing Law" ? current?.category ?? null : null,
    }));
    setFile(null);
  };

  const handleRerunCategorySelect = (_option: CiqParameterOption, value: string) => {
    setRerunSelectedParameter((current) => ({
      basis: current?.basis ?? null,
      category: value,
    }));
    setFile(null);
  };

  const handleBasisEdit = () => {
    if (parameterLocked) return;
    setSelectedParameter((current) => current ? { ...current, basis: null, category: null } : null);
    setFile(null);
    setStep("parameters");
  };

  const handleCategoryEdit = () => {
    if (parameterLocked) return;
    setSelectedParameter((current) => current ? { ...current, category: null } : null);
    setFile(null);
    setStep("parameters");
  };

  const handleRerunBasisEdit = () => {
    setRerunSelectedParameter((current) => current ? { ...current, basis: null, category: null } : null);
    setFile(null);
  };

  const handleRerunCategoryEdit = () => {
    setRerunSelectedParameter((current) => current ? { ...current, category: null } : null);
    setFile(null);
  };

  const startProcessing = (nextFile = file) => {
    if (!nextFile) {
      toast.error("Upload a PDF contract before running the analysis.");
      return;
    }

    if (resultsVisible && rerunUploadVisible) {
      const parameterForRun = rerunSelectedParameter ?? selectedParameter ?? createDefaultParameterSelection();
      setPendingRerunAnalysis(createRerunAnalysis(nextFile.name));
      setPendingRerunParameter(parameterForRun);
      setCompletedRerunAnalysis(null);
      setCompletedRerunParameter(null);
      setRerunUploadVisible(false);
      setRerunProcessing(true);
      return;
    }

    setStep("processing");
  };

  const validateAndSetFile = (nextFile: File | null) => {
    if (!nextFile) return;
    if (nextFile.type !== "application/pdf" && !nextFile.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Only PDF files are accepted.");
      return;
    }
    if (nextFile.size > 100 * 1024 * 1024) {
      toast.error("File exceeds the 100MB limit.");
      return;
    }

    setFile(nextFile);
    if (autoStartProcessingOnFile) {
      startProcessing(nextFile);
    }
  };

  const showRunAgainUpload = () => {
    setFile(null);
    setRerunProcessing(false);
    setPendingRerunAnalysis(null);
    setPendingRerunParameter(null);
    setCompletedRerunAnalysis(null);
    setCompletedRerunParameter(null);
    setRerunSelectedParameter(null);
    setRerunUploadVisible(true);
    onRunAgain?.();
  };

  return {
    completedMilestoneIds,
    completedRerunAnalysis,
    completedRerunAnalysisParameters,
    file,
    initiative,
    initiativeCompleted,
    initiativeLocked,
    newAnalysisSectionVisible,
    parameterLocked,
    processingVisible,
    rerunProcessing,
    rerunSelectedParameter,
    rerunSupplier,
    rerunUploadVisible,
    resultsInitiative,
    resultsVisible,
    selectedAnalysisParameters,
    selectedParameter,
    showPostAnalysisActions,
    step,
    supplierOutputInitiative,
    supplierOutputPanelState,
    actions: {
      completeInitiative: () => setInitiativeCompleted(true),
      handleBasisEdit,
      handleBasisSelect,
      handleCategoryEdit,
      handleCategorySelect,
      handleDownload: () => toast.success("Report download queued."),
      handleRerunBasisEdit,
      handleRerunBasisSelect,
      handleRerunCategoryEdit,
      handleRerunCategorySelect,
      markMilestoneComplete: (milestoneId: string) => {
        setCompletedMilestoneIds((current) => (
          current.includes(milestoneId) ? current : [...current, milestoneId]
        ));
      },
      resetRunState,
      selectInitiative,
      setStep,
      setUploadStep: () => setStep("upload"),
      showResultsFromRoute,
      showRunAgainUpload,
      startAnotherInitiative,
      startParameters,
      startSelect,
      startProcessing,
      clearFile: () => setFile(null),
      validateAndSetFile,
    },
  };
}

export type ClauseIqWorkflow = ReturnType<typeof useClauseIqWorkflow>;

export function SummaryRow({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-orbit-s text-sm text-foreground/90">
      <span className="mt-orbit-xxs">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

export function ClauseIqOverviewCard({
  step,
  onStart,
  currentInitiativeCopy = "Tied to a chosen initiative for traceable governance.",
}: {
  currentInitiativeCopy?: string;
  onStart?: () => void;
  step: ClauseIqWorkflowStep;
}) {
  return (
    <StateCard state="default">
      <div className="flex items-center gap-orbit-base mb-orbit-base">
        <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground grid place-items-center">
          <Sparkles className="h-5 w-5" />
        </div>
        <h1 className="v5-orbit-heading-4">ClauseIQ</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-orbit-m">
        Upload a contract and ClauseIQ will review it against your initiative's playbook,
        surfacing deviations, missing clauses and negotiation actions in seconds.
      </p>
      <div className={cn("rounded-lg bg-muted/50 border border-border p-orbit-base space-y-orbit-base", step === "welcome" && "mb-orbit-m")}>
        <div className="text-sm v5-orbit-weight-medium text-foreground mb-orbit-xs">Summary</div>
        <SummaryRow icon={<ListChecks className="h-4 w-4 text-ciq" />} text="Reviews every clause against your benchmark playbook." />
        <SummaryRow icon={<Building2 className="h-4 w-4 text-ciq" />} text={currentInitiativeCopy} />
        <SummaryRow icon={<FilePlus2 className="h-4 w-4 text-ciq" />} text="Exports a shareable report with severity and actions." />
      </div>
      {step === "welcome" && onStart && (
        <Button className="w-full" onClick={onStart}>
          <Sparkles className="h-4 w-4 mr-orbit-s" />
          Get Started
        </Button>
      )}
    </StateCard>
  );
}

export function NewAnalysisDivider() {
  return (
    <div className="flex items-center gap-orbit-base py-orbit-xs">
      <div className="h-px flex-1 bg-slate-300" />
      <span className="rounded-md border border-primary bg-white px-orbit-base py-orbit-xs text-sm v5-orbit-weight-medium text-primary shadow-sm">
        New Analysis
      </span>
      <div className="h-px flex-1 bg-slate-300" />
    </div>
  );
}

export function PostAnalysisNextActions({
  completedMilestoneIds,
  initiativeCompleted,
  onStartAnotherInitiative,
  onMilestoneComplete,
  onCompleteInitiative,
}: {
  completedMilestoneIds: string[];
  initiativeCompleted: boolean;
  onStartAnotherInitiative: () => void;
  onMilestoneComplete: (milestoneId: string) => void;
  onCompleteInitiative: () => void;
}) {
  return (
    <StateCard state="default">
      <div className="space-y-orbit-base">
        <h2 className="v5-orbit-heading-5">Next, you can...</h2>

        <button
          type="button"
          className="flex w-full items-center gap-orbit-base rounded-lg border border-border bg-card p-orbit-base text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          onClick={onStartAnotherInitiative}
        >
          <Sparkles className="h-6 w-6 shrink-0 text-primary" />
          <span className="min-w-0">
            <span className="block text-sm v5-orbit-weight-medium text-foreground">
              Analyse Contract on Another Initiative
            </span>
            <span className="mt-orbit-xs block text-base text-muted-foreground">
              Start fresh with a new initiative.
            </span>
          </span>
        </button>

        <div className="h-px bg-border" />

        <section className="rounded-lg border border-border bg-card p-orbit-base" aria-labelledby="v5-update-milestone-title">
          <div className="flex items-start justify-between gap-orbit-base">
            <div className="flex min-w-0 items-start gap-orbit-s">
              <ClipboardList className="mt-orbit-xs h-5 w-5 shrink-0 text-primary" />
              <div>
                <h3 id="v5-update-milestone-title" className="v5-orbit-heading-label">
                  Update Milestone
                </h3>
                <p className="mt-orbit-xs text-base text-muted-foreground">Track your initiative progress.</p>
              </div>
            </div>
            <ChevronUp className="mt-orbit-xs h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          </div>

          <div className="mt-orbit-m rounded-lg border border-border">
            <table className="w-full table-fixed border-collapse text-left text-sm">
              <colgroup>
                <col className="w-[23%]" />
                <col className="w-[25%]" />
                <col className="w-[20%]" />
                <col className="w-[32%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="v5-orbit-heading-strong px-orbit-base py-orbit-base">Milestone</th>
                  <th scope="col" className="v5-orbit-heading-strong px-orbit-base py-orbit-base">Due Date</th>
                  <th scope="col" className="v5-orbit-heading-strong px-orbit-base py-orbit-base">Status</th>
                  <th scope="col" className="v5-orbit-heading-strong px-orbit-base py-orbit-base">Action</th>
                </tr>
              </thead>
              <tbody>
                {NEXT_ACTION_MILESTONES.map((milestone) => {
                  const completed = completedMilestoneIds.includes(milestone.id);

                  return (
                    <tr key={milestone.id} className="border-b border-border last:border-b-0">
                      <td className="px-orbit-base py-orbit-base text-base text-foreground">{milestone.label}</td>
                      <td className="px-orbit-base py-orbit-base text-base text-foreground">{milestone.dueDate}</td>
                      <td className={cn("px-orbit-base py-orbit-base text-base", completed ? "v5-orbit-weight-medium text-success" : "text-foreground")}>
                        {completed ? "Completed" : "Pending"}
                      </td>
                      <td className="px-orbit-base py-orbit-s">
                        {completed ? (
                          <Button variant="outline" className="h-9 gap-orbit-s" disabled>
                            <Check className="h-4 w-4" />
                            Completed
                          </Button>
                        ) : (
                          <Button variant="outline" className="h-9" onClick={() => onMilestoneComplete(milestone.id)}>
                            Mark Complete
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {!initiativeCompleted && (
          <button
            type="button"
            className="flex w-full items-center gap-orbit-base rounded-lg border border-border bg-card p-orbit-base text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            onClick={onCompleteInitiative}
          >
            <BadgeCheck className="h-6 w-6 shrink-0 text-primary" />
            <span className="min-w-0">
              <span className="block text-sm v5-orbit-weight-medium text-foreground">Complete Initiative</span>
              <span className="mt-orbit-xs block text-base text-muted-foreground">
                Mark this initiative as complete.
              </span>
            </span>
          </button>
        )}
      </div>
    </StateCard>
  );
}

export function AnalysisParameterCards({
  selectedParameter,
  cardState,
  locked = false,
  onBasisSelect,
  onCategorySelect,
  onBasisEdit,
  onCategoryEdit,
}: {
  selectedParameter: AnalysisParameterSelection | null;
  cardState: CardState;
  locked?: boolean;
  onBasisSelect: (option: CiqParameterOption, value: string) => void;
  onCategorySelect: (option: CiqParameterOption, value: string) => void;
  onBasisEdit: () => void;
  onCategoryEdit: () => void;
}) {
  const basisSelected = Boolean(selectedParameter?.basis);
  const categoryRequired = selectedParameter?.basis?.kind === "Governing Law";
  const categorySelected = Boolean(selectedParameter?.category);
  const selectedBasisKind = selectedParameter?.basis?.kind;
  const [activeBasisKind, setActiveBasisKind] = useState<AnalysisBasisKind>("Playbook");

  useEffect(() => {
    if (selectedBasisKind) {
      setActiveBasisKind(selectedBasisKind);
    }
  }, [selectedBasisKind]);

  return (
    <>
      <StateCard state={basisSelected ? "default" : cardState}>
        <h2 className="v5-orbit-heading-5 mb-orbit-xs">Contract Analysis Parameters</h2>
        {!basisSelected ? (
          <>
            <p className="text-sm text-muted-foreground mb-orbit-base">
              Choose whether ClauseIQ should analyse against a playbook or governing law.
            </p>
            <ParameterKindSelector
              activeKind={activeBasisKind}
              options={BASIS_PARAMETER_OPTIONS}
              onActiveKindChange={setActiveBasisKind}
              onSelect={onBasisSelect}
            />
          </>
        ) : (
          <div className="mt-orbit-s">
            <SelectedSummaryRow
              label={`${selectedParameter!.basis!.kind} \u00b7 ${selectedParameter!.basis!.label}`}
              disabled={locked}
              actionLabel={`Change ${selectedParameter!.basis!.kind}`}
              onAction={onBasisEdit}
            />
          </div>
        )}
      </StateCard>

      {basisSelected && categoryRequired && (
        <StateCard state={categorySelected ? "default" : "active"}>
          <h2 className="v5-orbit-heading-5 mb-orbit-xs">Category</h2>
          {!categorySelected ? (
            <>
              <p className="text-sm text-muted-foreground mb-orbit-base">
                Select the category ClauseIQ should use for this analysis.
              </p>
              {CATEGORY_PARAMETER_OPTION && (
                <ParameterOptionsList option={CATEGORY_PARAMETER_OPTION} onSelect={onCategorySelect} />
              )}
            </>
          ) : (
            <div className="mt-orbit-s">
              <SelectedSummaryRow
                label={`Category \u00b7 ${selectedParameter!.category!}`}
                disabled={locked}
                actionLabel="Change Category"
                onAction={onCategoryEdit}
              />
            </div>
          )}
        </StateCard>
      )}
    </>
  );
}

export function SelectedSummaryRow({
  label,
  disabled,
  actionLabel,
  onAction,
}: {
  label: string;
  disabled: boolean;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div
      className={cn(
        "flex min-h-11 items-center justify-between gap-orbit-base rounded-md border px-orbit-base py-orbit-s",
        disabled ? "border-border bg-muted/50 text-muted-foreground" : "border-border bg-card text-foreground",
      )}
    >
      <div className="flex min-w-0 items-center gap-orbit-s">
        <Check className={cn("h-4 w-4 shrink-0", disabled ? "text-muted-foreground" : "text-success")} />
        <span className={cn("truncate text-sm v5-orbit-weight-medium", disabled ? "text-muted-foreground" : "text-foreground")}>
          {label}
        </span>
      </div>
      {!disabled && (
        <button
          type="button"
          className="inline-flex h-8 shrink-0 items-center gap-orbit-xs rounded-md px-orbit-s text-sm v5-orbit-weight-medium text-ciq transition-colors hover:bg-ciq-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={onAction}
        >
          <Pencil className="h-3.5 w-3.5" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function ParameterOptionsList({
  option,
  onSelect,
  variant = "framed",
}: {
  onSelect: (option: CiqParameterOption, value: string) => void;
  option: CiqParameterOption;
  variant?: "framed" | "plain";
}) {
  const framed = variant === "framed";

  return (
    <div
      role="listbox"
      aria-label={`${option.label} options`}
      className={cn(
        "rounded-lg",
        framed ? "overflow-hidden border border-border bg-card" : "max-h-52 overflow-y-auto",
      )}
    >
      <div className={cn(framed ? "max-h-52 overflow-y-auto p-orbit-xs" : "space-y-orbit-xs")}>
        {option.options.map((value) => (
          <button
            key={value}
            type="button"
            role="option"
            aria-selected={false}
            className="w-full rounded-md px-orbit-base py-orbit-s text-left text-sm transition-colors hover:bg-muted"
            onClick={() => onSelect(option, value)}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  );
}

function ParameterKindSelector({
  activeKind,
  options,
  onActiveKindChange,
  onSelect,
}: {
  activeKind: AnalysisBasisKind;
  options: Array<CiqParameterOption & { kind: AnalysisBasisKind }>;
  onActiveKindChange: (kind: AnalysisBasisKind) => void;
  onSelect: (option: CiqParameterOption, value: string) => void;
}) {
  const activeOption = options.find((option) => option.kind === activeKind) ?? options[0];

  if (!activeOption) return null;

  return (
    <div className="space-y-orbit-base">
      <div
        role="radiogroup"
        aria-label="Contract analysis parameter type"
        className="grid grid-cols-2 gap-orbit-s"
      >
        {options.map((option) => {
          const selected = option.kind === activeOption.kind;

          return (
            <button
              key={option.kind}
              type="button"
              role="radio"
              aria-checked={selected}
              className={cn(
                "flex min-h-16 cursor-pointer items-center gap-orbit-s rounded-lg border bg-card px-orbit-base py-orbit-s text-left text-sm transition-colors",
                selected
                  ? "border-primary/60 text-foreground shadow-sm ring-1 ring-primary/20"
                  : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
              )}
              onClick={() => onActiveKindChange(option.kind)}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "grid h-4 w-4 shrink-0 place-items-center rounded-full border transition-colors",
                  selected ? "border-primary" : "border-muted-foreground/60",
                )}
              >
                {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
              </span>
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                <ParameterIcon kind={option.kind} />
              </span>
              <span className="min-w-0 flex-1 truncate v5-orbit-weight-medium">{option.label}</span>
            </button>
          );
        })}
      </div>

      <ParameterOptionsList option={activeOption} onSelect={onSelect} />
    </div>
  );
}

function ParameterIcon({ kind }: { kind: CiqParameterKind }) {
  if (kind === "Governing Law") return <Scale className="h-4 w-4" />;
  if (kind === "Category") return <ListChecks className="h-4 w-4" />;
  return <BookOpen className="h-4 w-4" />;
}

export function parameterDisclaimer(parameter: AnalysisParameterSelection | null) {
  if (!hasCompleteAnalysisParameters(parameter)) {
    return "Analysis is based on the selected playbook or governing law, plus the required category.";
  }

  if (parameter.basis.kind === "Playbook") {
    return PLAYBOOK_SCOPE_DISCLAIMER;
  }

  return `Analysis is based on the selected governing law and ${parameter.category} category. Clauses outside that combined scope won't appear in results.`;
}

export function PlaybookDisclaimer({ variant, parameter }: { variant: "callout" | "inline"; parameter: AnalysisParameterSelection | null }) {
  const copy = parameterDisclaimer(parameter);

  if (variant === "inline") {
    return (
      <p className="mt-orbit-xs text-[11px] leading-snug text-muted-foreground">
        {copy}
      </p>
    );
  }

  return (
    <div className="mb-orbit-base flex items-start gap-orbit-s rounded-md border border-primary/20 bg-primary/5 px-orbit-base py-orbit-s text-[11px] leading-snug text-muted-foreground">
      <Info className="mt-orbit-xxs h-3 w-3 shrink-0 text-primary" />
      <span>{copy}</span>
    </div>
  );
}

export function ClauseIqDropzone({ onFile }: { onFile: (file: File | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const openFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFile = useCallback((file?: File | null) => {
    if (file) onFile(file);
  }, [onFile]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleChooseFiles = (event?: MouseEvent<HTMLAnchorElement>) => {
    event?.preventDefault();
    event?.stopPropagation();
    openFilePicker();
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div className="flex flex-col gap-orbit-s">
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept="application/pdf,.pdf"
        aria-label="Upload contract PDF"
        tabIndex={-1}
        onChange={handleInputChange}
      />
      <div
        role="group"
        aria-label="Upload contract PDF"
        data-drag-active={dragActive ? "true" : "false"}
        className={cn(
          "flex min-h-[var(--orbit-dropzone-min-height)] cursor-pointer flex-col items-center justify-center gap-orbit-base rounded-md border-2 border-dashed border-[var(--orbit-color-card-border-accent)] bg-[var(--orbit-color-card-bg-accent)] p-orbit-base transition-colors",
          dragActive && "border-[var(--orbit-color-card-border-highlight)] bg-[var(--orbit-color-card-bg-default)]",
        )}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) return;
          openFilePicker();
        }}
        onDragEnter={handleDragOver}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <span className="inline-flex h-[var(--orbit-space-xxl)] w-[var(--orbit-space-xxl)] items-center justify-center" aria-hidden="true">
          <Upload className="h-8 w-8 text-muted-foreground" strokeWidth={2} />
        </span>
        <div className="flex flex-wrap items-center justify-center gap-orbit-xs text-center">
          <Text variant="Primary" size="Paragraph">Drag &amp; drop or</Text>
          <span className="clauseiq-v5-dropzone-link">
            <LinkText label="choose files" href="#" onClick={handleChooseFiles} />
          </span>
          <Text variant="Primary" size="Paragraph">to upload</Text>
        </div>
        <Text variant="Secondary" size="Paragraph">File types supported: .pdf files.</Text>
        <Text variant="Secondary" size="Paragraph">Maximum upload file size: 100 MB</Text>
      </div>
    </div>
  );
}
