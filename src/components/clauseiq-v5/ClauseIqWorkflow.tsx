import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  BadgeCheck,
  BookOpen,
  Building2,
  Check,
  ChevronUp,
  ClipboardList,
  FilePlus2,
  ListChecks,
  Pencil,
  Scale,
  Search,
  Sparkles,
} from "lucide-react";
import { Card, Dropzone, FA, FaIcon, InlineBanner, Text } from "@orbit";

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
export type PlaybookChoice = "yes" | "no";

export interface AnalysisBasisSelection {
  kind: AnalysisBasisKind;
  label: string;
}

export interface AnalysisParameterSelection {
  playbookChoice: PlaybookChoice;
  basis: AnalysisBasisSelection | null;
  category: string | null;
  benchmarkConfirmed?: boolean;
  categorySuggested?: boolean;
  governingLawSuggested?: boolean;
  suggestedCategory?: string | null;
  suggestedGoverningLaw?: string | null;
}

export const PROCESSING_MS = 3_000;
export const DEFAULT_BASIS_SELECTION: AnalysisBasisSelection = { kind: "Playbook", label: CIQ_DEFAULT_PLAYBOOK };
export const BASIS_PARAMETER_OPTIONS = CIQ_PARAMETER_OPTIONS.filter(
  (option): option is CiqParameterOption & { kind: AnalysisBasisKind } => option.kind !== "Category",
);
export const CATEGORY_PARAMETER_OPTION = CIQ_PARAMETER_OPTIONS.find((option) => option.kind === "Category");
const GENERAL_CATEGORY_BASELINE = "general category";
const GENERAL_GOVERNING_LAW_BASELINE = "general governing law";

export interface BenchmarkOptionGroup {
  label: string;
  options: string[];
}

interface BenchmarkSuggestion {
  category: string | null;
  governingLaw: string | null;
}

// TODO: replace these grouped placeholders with taxonomy parent metadata when the category API exposes it.
const CATEGORY_BENCHMARK_GROUPS: BenchmarkOptionGroup[] = [
  { label: "Goods & materials", options: ["Goods"] },
  { label: "Services", options: ["Services", "Professional Services"] },
  { label: "Works", options: ["Construction"] },
  { label: "Technology", options: ["IT & Technology"] },
];

const GOVERNING_LAW_BENCHMARK_GROUPS: BenchmarkOptionGroup[] = [
  { label: "United Kingdom", options: ["United Kingdom"] },
  { label: "North America", options: ["United States"] },
  { label: "Europe", options: ["Germany", "France"] },
  { label: "Asia Pacific", options: ["Singapore"] },
];

function deriveBenchmarkSuggestion(initiative: CiqInitiative | null): BenchmarkSuggestion {
  void initiative;

  return {
    category: null,
    governingLaw: null,
  };
}

function createSuggestedBenchmarkSelection(initiative: CiqInitiative | null): AnalysisParameterSelection {
  const suggestion = deriveBenchmarkSuggestion(initiative);

  return {
    playbookChoice: "no",
    basis: suggestion.governingLaw ? { kind: "Governing Law", label: suggestion.governingLaw } : null,
    category: suggestion.category,
    benchmarkConfirmed: false,
    categorySuggested: Boolean(suggestion.category),
    governingLawSuggested: Boolean(suggestion.governingLaw),
    suggestedCategory: suggestion.category,
    suggestedGoverningLaw: suggestion.governingLaw,
  };
}

function benchmarkPrecision(parameter: AnalysisParameterSelection | null) {
  const category = parameter?.category ?? null;
  const governingLaw = parameter?.basis?.kind === "Governing Law" ? parameter.basis.label : null;
  const score = category && governingLaw ? 3 : category || governingLaw ? 2 : 1;

  return { category, governingLaw, score };
}

export function benchmarkReadout(parameter: AnalysisParameterSelection | null) {
  const { category, governingLaw, score } = benchmarkPrecision(parameter);

  if (category && governingLaw) {
    return `Benchmarked against ${governingLaw} · ${category} standards. The more you specify, the sharper the findings.`;
  }

  if (category || governingLaw) {
    const value = category ?? governingLaw;
    const missingAxis = category ? "governing law" : "category";
    return `Benchmarked against ${value} standards with a general ${missingAxis} baseline. Add a ${missingAxis} for sharper findings.`;
  }

  if (score === 1) {
    return "Benchmarked against ClauseIQ's general standard. Add a category or governing law for sharper, more relevant findings.";
  }

  return "";
}

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
  playbookChoice: "yes",
  basis: { ...DEFAULT_BASIS_SELECTION },
  category: null,
});

export const buildAnalysisParameters = (
  selected: AnalysisParameterSelection | null,
): AnalysisParameterItem[] => {
  const parameter = selected ?? createDefaultParameterSelection();
  const rows: AnalysisParameterItem[] = [];
  const playbookChoice =
    parameter.playbookChoice ??
    (parameter.basis?.kind === "Governing Law" || parameter.category ? "no" : "yes");

  if (playbookChoice === "no") {
    const { score } = benchmarkPrecision(parameter);
    rows.push({ label: "Benchmark", value: benchmarkReadout(parameter) });
    rows.push({ label: "Precision", value: `${score}-of-3` });
    return rows;
  }

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
): selected is AnalysisParameterSelection => {
  if (!selected) return false;
  const playbookChoice =
    selected.playbookChoice ??
    (selected.basis?.kind === "Governing Law" || selected.category ? "no" : "yes");
  if (playbookChoice === "yes") return selected.basis?.kind === "Playbook";
  return selected.benchmarkConfirmed === true;
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
    const playbookChoice: PlaybookChoice = option.kind === "Playbook" ? "yes" : "no";
    setSelectedParameter((current) => ({
      playbookChoice,
      basis: value ? { kind: option.kind, label: value } : null,
      category: playbookChoice === "no" ? current?.category ?? null : null,
      benchmarkConfirmed: playbookChoice === "no" ? false : undefined,
      categorySuggested: playbookChoice === "no" ? current?.categorySuggested ?? false : undefined,
      governingLawSuggested: false,
      suggestedCategory: playbookChoice === "no" ? current?.suggestedCategory ?? null : undefined,
      suggestedGoverningLaw: playbookChoice === "no" ? current?.suggestedGoverningLaw ?? null : undefined,
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
      playbookChoice: "no",
      basis: current?.basis?.kind === "Governing Law" ? current.basis : null,
      category: value || null,
      benchmarkConfirmed: false,
      categorySuggested: false,
      governingLawSuggested: current?.governingLawSuggested ?? false,
      suggestedCategory: current?.suggestedCategory ?? null,
      suggestedGoverningLaw: current?.suggestedGoverningLaw ?? null,
    }));
    setFile(null);
    setStep("parameters");
  };

  const handleRerunBasisSelect = (option: CiqParameterOption, value: string) => {
    if (option.kind === "Category") return;
    const playbookChoice: PlaybookChoice = option.kind === "Playbook" ? "yes" : "no";
    setRerunSelectedParameter((current) => ({
      playbookChoice,
      basis: value ? { kind: option.kind, label: value } : null,
      category: playbookChoice === "no" ? current?.category ?? null : null,
      benchmarkConfirmed: playbookChoice === "no" ? false : undefined,
      categorySuggested: playbookChoice === "no" ? current?.categorySuggested ?? false : undefined,
      governingLawSuggested: false,
      suggestedCategory: playbookChoice === "no" ? current?.suggestedCategory ?? null : undefined,
      suggestedGoverningLaw: playbookChoice === "no" ? current?.suggestedGoverningLaw ?? null : undefined,
    }));
    setFile(null);
  };

  const handleRerunCategorySelect = (_option: CiqParameterOption, value: string) => {
    setRerunSelectedParameter((current) => ({
      playbookChoice: "no",
      basis: current?.basis?.kind === "Governing Law" ? current.basis : null,
      category: value || null,
      benchmarkConfirmed: false,
      categorySuggested: false,
      governingLawSuggested: current?.governingLawSuggested ?? false,
      suggestedCategory: current?.suggestedCategory ?? null,
      suggestedGoverningLaw: current?.suggestedGoverningLaw ?? null,
    }));
    setFile(null);
  };

  const handlePlaybookChoiceChange = (playbookChoice: PlaybookChoice) => {
    setSelectedParameter(
      playbookChoice === "no"
        ? createSuggestedBenchmarkSelection(initiative)
        : { playbookChoice, basis: null, category: null },
    );
    setFile(null);
    setStep("parameters");
  };

  const handleRerunPlaybookChoiceChange = (playbookChoice: PlaybookChoice) => {
    setRerunSelectedParameter(
      playbookChoice === "no"
        ? createSuggestedBenchmarkSelection(initiative)
        : { playbookChoice, basis: null, category: null },
    );
    setFile(null);
  };

  const handleBenchmarkConfirm = () => {
    setSelectedParameter((current) => ({
      ...(current?.playbookChoice === "no" ? current : createSuggestedBenchmarkSelection(initiative)),
      benchmarkConfirmed: true,
    }));
    setFile(null);
    if (autoAdvanceParameters) {
      setStep("upload");
    }
  };

  const handleBenchmarkSkip = () => {
    const suggestion = deriveBenchmarkSuggestion(initiative);
    setSelectedParameter({
      playbookChoice: "no",
      basis: null,
      category: null,
      benchmarkConfirmed: true,
      categorySuggested: false,
      governingLawSuggested: false,
      suggestedCategory: suggestion.category,
      suggestedGoverningLaw: suggestion.governingLaw,
    });
    setFile(null);
    if (autoAdvanceParameters) {
      setStep("upload");
    }
  };

  const handleBenchmarkEdit = () => {
    if (parameterLocked) return;
    setSelectedParameter((current) => ({
      ...(current?.playbookChoice === "no" ? current : createSuggestedBenchmarkSelection(initiative)),
      benchmarkConfirmed: false,
    }));
    setFile(null);
    setStep("parameters");
  };

  const handleRerunBenchmarkConfirm = () => {
    setRerunSelectedParameter((current) => ({
      ...(current?.playbookChoice === "no" ? current : createSuggestedBenchmarkSelection(initiative)),
      benchmarkConfirmed: true,
    }));
    setFile(null);
  };

  const handleRerunBenchmarkSkip = () => {
    const suggestion = deriveBenchmarkSuggestion(initiative);
    setRerunSelectedParameter({
      playbookChoice: "no",
      basis: null,
      category: null,
      benchmarkConfirmed: true,
      categorySuggested: false,
      governingLawSuggested: false,
      suggestedCategory: suggestion.category,
      suggestedGoverningLaw: suggestion.governingLaw,
    });
    setFile(null);
  };

  const handleRerunBenchmarkEdit = () => {
    setRerunSelectedParameter((current) => ({
      ...(current?.playbookChoice === "no" ? current : createSuggestedBenchmarkSelection(initiative)),
      benchmarkConfirmed: false,
    }));
    setFile(null);
  };

  const handleBasisEdit = () => {
    if (parameterLocked) return;
    setSelectedParameter((current) =>
      current
        ? {
            ...current,
            basis: null,
            category: current.playbookChoice === "no" ? current.category : null,
          }
        : { playbookChoice: "yes", basis: null, category: null },
    );
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
    setRerunSelectedParameter((current) =>
      current
        ? {
            ...current,
            basis: null,
            category: current.playbookChoice === "no" ? current.category : null,
          }
        : { playbookChoice: "yes", basis: null, category: null },
    );
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
      handleBenchmarkConfirm,
      handleBenchmarkEdit,
      handleBenchmarkSkip,
      handleBasisEdit,
      handleBasisSelect,
      handleCategoryEdit,
      handleCategorySelect,
      handleDownload: () => toast.success("Report download queued."),
      handlePlaybookChoiceChange,
      handleRerunBenchmarkConfirm,
      handleRerunBenchmarkEdit,
      handleRerunBenchmarkSkip,
      handleRerunBasisEdit,
      handleRerunBasisSelect,
      handleRerunCategoryEdit,
      handleRerunCategorySelect,
      handleRerunPlaybookChoiceChange,
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
  categoryCardState = "active",
  locked = false,
  onPlaybookChoiceChange = () => undefined,
  onBenchmarkConfirm,
  onBenchmarkEdit,
  onBenchmarkSkip,
  onBasisSelect,
  onCategorySelect,
  onBasisEdit,
  onCategoryEdit,
}: {
  selectedParameter: AnalysisParameterSelection | null;
  cardState: CardState;
  categoryCardState?: CardState;
  locked?: boolean;
  onPlaybookChoiceChange?: (choice: PlaybookChoice) => void;
  onBenchmarkConfirm: () => void;
  onBenchmarkEdit: () => void;
  onBenchmarkSkip: () => void;
  onBasisSelect: (option: CiqParameterOption, value: string) => void;
  onCategorySelect: (option: CiqParameterOption, value: string) => void;
  onBasisEdit: () => void;
  onCategoryEdit: () => void;
}) {
  const selectedPlaybookChoice =
    selectedParameter?.playbookChoice ??
    (selectedParameter?.basis?.kind === "Governing Law" || selectedParameter?.category ? "no" : "yes");
  const [localPlaybookChoice, setLocalPlaybookChoice] = useState<PlaybookChoice>(selectedPlaybookChoice);
  const hasExternalParameter = Boolean(selectedParameter?.playbookChoice || selectedParameter?.basis || selectedParameter?.category);
  const playbookChoice = selectedParameter?.playbookChoice ?? (hasExternalParameter ? selectedPlaybookChoice : localPlaybookChoice);
  const playbookOption = BASIS_PARAMETER_OPTIONS.find((option) => option.kind === "Playbook");
  const playbookGroups = playbookOption
    ? [{ label: "Playbooks", options: playbookOption.options }]
    : [];
  const playbookSelected = playbookChoice === "yes" && selectedParameter?.basis?.kind === "Playbook";
  const showPlaybookChoiceSelector = !locked;

  useEffect(() => {
    setLocalPlaybookChoice(selectedPlaybookChoice);
  }, [selectedPlaybookChoice]);

  const handlePlaybookChoice = (choice: PlaybookChoice) => {
    setLocalPlaybookChoice(choice);
    onPlaybookChoiceChange(choice);
  };

  return (
    <Card
      type="Static"
      state={cardState === "active" ? "Feature" : cardState === "disabled" ? "Disabled" : "Default"}
      padding="Base"
      indicator={false}
    >
      <h2 className="v5-orbit-heading-5 mb-orbit-base">Contract Analysis Parameters</h2>
      {showPlaybookChoiceSelector && (
        <>
          <p className="text-sm text-muted-foreground mb-orbit-base">
            Do you want to use a playbook for this analysis?
          </p>

          <PlaybookChoiceSelector
            value={playbookChoice}
            disabled={locked}
            onChange={handlePlaybookChoice}
          />
        </>
      )}

      {playbookChoice === "yes" && (
        <div className={showPlaybookChoiceSelector ? "mt-orbit-base" : "mt-orbit-xs"}>
          {playbookSelected ? (
            <SelectedSummaryRow
              label={`${selectedParameter!.basis!.kind} \u00b7 ${selectedParameter!.basis!.label}`}
              disabled={locked}
              actionLabel={`Change ${selectedParameter!.basis!.kind}`}
              onAction={onBasisEdit}
            />
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-orbit-base">
                Select the playbook ClauseIQ should use for this analysis.
              </p>
              {playbookOption && (
                <BenchmarkCombobox
                  label="Playbook"
                  value=""
                  groups={playbookGroups}
                  placeholder="Please select a playbook..."
                  onSelect={(value) => onBasisSelect(playbookOption, value)}
                  onClear={() => onBasisSelect(playbookOption, "")}
                />
              )}
            </>
          )}
        </div>
      )}

      {playbookChoice === "no" && (
        <NoPlaybookBenchmarkPanel
          parameter={selectedParameter}
          locked={locked}
          className={showPlaybookChoiceSelector ? "mt-orbit-base" : "mt-orbit-xs"}
          onCategorySelect={(value) => {
            if (CATEGORY_PARAMETER_OPTION) onCategorySelect(CATEGORY_PARAMETER_OPTION, value);
          }}
          onCategoryClear={() => {
            if (CATEGORY_PARAMETER_OPTION) onCategorySelect(CATEGORY_PARAMETER_OPTION, "");
          }}
          onGoverningLawSelect={(value) => {
            const governingLawOption = BASIS_PARAMETER_OPTIONS.find((option) => option.kind === "Governing Law");
            if (governingLawOption) onBasisSelect(governingLawOption, value);
          }}
          onGoverningLawClear={() => {
            const governingLawOption = BASIS_PARAMETER_OPTIONS.find((option) => option.kind === "Governing Law");
            if (governingLawOption) onBasisSelect(governingLawOption, "");
          }}
          onConfirm={onBenchmarkConfirm}
          onEditBenchmark={onBenchmarkEdit}
          onSkip={onBenchmarkSkip}
        />
      )}
    </Card>
  );
}

export function NoPlaybookBenchmarkPanel({
  parameter,
  locked,
  className,
  onCategorySelect,
  onCategoryClear,
  onGoverningLawSelect,
  onGoverningLawClear,
  onConfirm,
  onEditBenchmark,
  onSkip,
}: {
  parameter: AnalysisParameterSelection | null;
  locked: boolean;
  className?: string;
  onCategorySelect: (value: string) => void;
  onCategoryClear: () => void;
  onGoverningLawSelect: (value: string) => void;
  onGoverningLawClear: () => void;
  onConfirm: () => void;
  onEditBenchmark: () => void;
  onSkip: () => void;
}) {
  const category = parameter?.category ?? "";
  const governingLaw = parameter?.basis?.kind === "Governing Law" ? parameter.basis.label : "";
  const benchmarkConfirmed = parameter?.benchmarkConfirmed === true;
  const generalBenchmarkConfirmed = benchmarkConfirmed && !category && !governingLaw;

  if (generalBenchmarkConfirmed) {
    return (
      <GeneralBenchmarkSummary
        className={className}
        locked={locked}
        onEditBenchmark={onEditBenchmark}
      />
    );
  }

  if (locked) {
    return (
      <div className={cn("space-y-orbit-base", className)}>
        <SelectedSummaryRow
          label={`Category \u00b7 ${category || GENERAL_CATEGORY_BASELINE}`}
          disabled
          actionLabel="Change Category"
          onAction={() => undefined}
        />
        <SelectedSummaryRow
          label={`Governing Law \u00b7 ${governingLaw || GENERAL_GOVERNING_LAW_BASELINE}`}
          disabled
          actionLabel="Change Governing Law"
          onAction={() => undefined}
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-orbit-base", className)}>
      <InlineBanner
        variant="Information"
        contrast="Low"
        label="Select a category and governing law"
        description="Set a category and a governing law to analyse against more relevant standards or skip to use ClauseIQ's general benchmark."
      />

      <div className="grid gap-orbit-base">
        <BenchmarkCombobox
          label="Category"
          value={category}
          groups={CATEGORY_BENCHMARK_GROUPS}
          placeholder="Please select a category..."
          onSelect={onCategorySelect}
          onClear={onCategoryClear}
        />
        <BenchmarkCombobox
          label="Governing law"
          value={governingLaw}
          groups={GOVERNING_LAW_BENCHMARK_GROUPS}
          placeholder="Please select a governing law..."
          onSelect={onGoverningLawSelect}
          onClear={onGoverningLawClear}
        />
      </div>

      {!benchmarkConfirmed && (
        <div className="space-y-orbit-s">
          <Button className="w-full" onClick={onConfirm}>
            Confirm &amp; continue
          </Button>
          <Button variant="secondary" className="w-full" onClick={onSkip}>
            Skip — use the general benchmark instead
          </Button>
        </div>
      )}
    </div>
  );
}

function GeneralBenchmarkSummary({
  className,
  locked,
  onEditBenchmark,
}: {
  className?: string;
  locked: boolean;
  onEditBenchmark: () => void;
}) {
  return (
    <div className={cn("space-y-orbit-base", className)}>
      <div className="rounded-[var(--orbit-space-s)] bg-[var(--orbit-color-status-high-bg-no-status)] p-orbit-base text-[var(--orbit-color-text-primary)]">
        <div className="flex items-start gap-orbit-xs">
          <span
            className="inline-flex h-[var(--orbit-inline-banner-icon-box-size)] w-[var(--orbit-inline-banner-icon-box-size)] shrink-0 items-center justify-center"
            aria-hidden="true"
          >
            <FaIcon icon={FA.circleInfo} size={16} color="var(--orbit-color-dove-gray)" />
          </span>
          <div className="min-w-0 flex-1 space-y-orbit-s">
            <div className="v5-orbit-text-body v5-orbit-weight-bold">Using the general benchmark</div>
            <p className="v5-orbit-text-body">
              No category or governing law set. ClauseIQ reviews against its general parameters.
            </p>
            {!locked && (
              <button
                type="button"
                className="inline-flex items-center gap-orbit-xs rounded-[var(--orbit-radius-sm)] text-left v5-orbit-text-body v5-orbit-weight-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={onEditBenchmark}
              >
                <Pencil className="h-[var(--orbit-space-base)] w-[var(--orbit-space-base)]" aria-hidden="true" />
                Add a category or governing law
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BenchmarkCombobox({
  label,
  value,
  groups,
  placeholder,
  onSelect,
  onClear,
}: {
  label: string;
  value: string;
  groups: BenchmarkOptionGroup[];
  placeholder: string;
  onSelect: (value: string) => void;
  onClear: () => void;
}) {
  const fieldId = useId();
  const listboxId = `${fieldId}-listbox`;
  const controlRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [listboxPosition, setListboxPosition] = useState({ left: 0, top: 0, width: 0 });
  const hasSelection = Boolean(value);
  const changeActionLabel =
    label === "Governing law"
      ? "Change Governing Law"
      : label === "Playbook"
        ? "Change Playbook"
        : `Change ${label.toLowerCase()}`;
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const options = groups.flatMap((group) => group.options);

    if (!normalizedQuery) return options;
    return options.filter((option) => option.toLowerCase().includes(normalizedQuery));
  }, [groups, query]);
  const activeOptionId = open && filteredOptions[activeIndex] ? `${fieldId}-option-${activeIndex}` : undefined;

  useEffect(() => {
    if (!open) setQuery("");
  }, [open, value]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return undefined;

    const updateListboxPosition = () => {
      const control = controlRef.current;
      if (!control) return;
      const rect = control.getBoundingClientRect();
      setListboxPosition({
        left: rect.left,
        top: rect.bottom + 4,
        width: rect.width,
      });
    };

    updateListboxPosition();
    window.addEventListener("resize", updateListboxPosition);
    window.addEventListener("scroll", updateListboxPosition, true);

    return () => {
      window.removeEventListener("resize", updateListboxPosition);
      window.removeEventListener("scroll", updateListboxPosition, true);
    };
  }, [open]);

  const choose = (nextValue: string) => {
    onSelect(nextValue);
    setOpen(false);
    setQuery("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => Math.min(current + 1, Math.max(0, filteredOptions.length - 1)));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => Math.max(0, current - 1));
      return;
    }

    if (event.key === "Enter" && open) {
      event.preventDefault();
      const activeOption = filteredOptions[activeIndex];
      if (activeOption) choose(activeOption);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setQuery("");
    }
  };

  return (
    <div className="space-y-orbit-xs">
      <div className="flex items-center gap-orbit-s">
        <label id={`${fieldId}-label`} htmlFor={fieldId} className="v5-orbit-heading-label">
          {label}
        </label>
      </div>

      <div className="relative">
        <div
          ref={controlRef}
          className="flex min-h-11 items-center gap-orbit-s rounded-lg border border-border bg-card px-orbit-base py-orbit-xs focus-within:ring-2 focus-within:ring-ring"
        >
          {hasSelection ? (
            <Check className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
          ) : (
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          )}
          <input
            id={fieldId}
            role="combobox"
            aria-labelledby={`${fieldId}-label`}
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-activedescendant={activeOptionId}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            value={open ? query : value}
            placeholder={value ? undefined : placeholder}
            onFocus={() => {
              setQuery(value);
              setOpen(true);
            }}
            onBlur={() => window.setTimeout(() => setOpen(false), 120)}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onKeyDown={handleKeyDown}
          />
          {hasSelection && (
            <button
              type="button"
              aria-label={changeActionLabel}
              className="inline-flex shrink-0 items-center gap-orbit-xs rounded-md px-orbit-xs py-orbit-xxs text-sm v5-orbit-weight-medium text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onClear();
                setQuery("");
                setActiveIndex(0);
                setOpen(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              {changeActionLabel}
            </button>
          )}
        </div>

        {open && createPortal(
          <div
            id={listboxId}
            role="listbox"
            aria-labelledby={`${fieldId}-label`}
            className="fixed z-[9999] max-h-[min(360px,calc(100vh-32px))] overflow-y-auto rounded-lg border border-border bg-card p-orbit-xs shadow-lg"
            style={{
              left: listboxPosition.left,
              top: listboxPosition.top,
              width: listboxPosition.width,
            }}
          >
            {filteredOptions.length > 0 ? (
              <div className="space-y-orbit-xxs">
                {filteredOptions.map((option, index) => {
                  const active = index === activeIndex;

                  return (
                    <button
                      key={option}
                      id={`${fieldId}-option-${index}`}
                      type="button"
                      role="option"
                      aria-selected={value === option}
                      className={cn(
                        "w-full rounded-md px-orbit-base py-orbit-s text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active ? "bg-muted text-foreground" : "text-foreground hover:bg-muted",
                      )}
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => choose(option)}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="px-orbit-base py-orbit-s text-sm text-muted-foreground">No matches found.</p>
            )}
          </div>,
          document.body,
        )}
      </div>
    </div>
  );
}

function PlaybookChoiceSelector({
  value,
  disabled,
  onChange,
}: {
  value: PlaybookChoice;
  disabled: boolean;
  onChange: (choice: PlaybookChoice) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Use playbook"
      className="grid grid-cols-2 gap-orbit-s"
    >
      {(["yes", "no"] as PlaybookChoice[]).map((choice) => {
        const selected = value === choice;
        const label = choice === "yes" ? "Yes" : "No";

        return (
          <button
            key={choice}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            className={cn(
              "flex min-h-11 cursor-pointer items-center justify-center rounded-lg border bg-card px-orbit-base py-orbit-s text-sm v5-orbit-weight-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
              selected
                ? "border-primary/60 text-foreground shadow-sm ring-1 ring-primary/20"
                : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
            )}
            onClick={() => onChange(choice)}
          >
            {label}
          </button>
        );
      })}
    </div>
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
    return "Choose the benchmark ClauseIQ should use for this analysis.";
  }

  const playbookChoice =
    parameter.playbookChoice ??
    (parameter.basis?.kind === "Governing Law" || parameter.category ? "no" : "yes");

  if (playbookChoice === "yes") {
    return PLAYBOOK_SCOPE_DISCLAIMER;
  }

  return benchmarkReadout(parameter);
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
    <div className="mb-orbit-base">
      <InlineBanner
        variant="Information"
        contrast="Low"
        label={parameter?.playbookChoice === "no" ? "Benchmark precision" : "Analysis scope"}
        description={copy}
      />
    </div>
  );
}

export function ClauseIqDropzone({ onFile }: { onFile: (file: File | null) => void }) {
  return (
    <Dropzone
      ariaLabel="Upload contract PDF"
      accept="application/pdf,.pdf"
      onFileSelected={onFile}
      acceptedFileTypesLabel="File types supported: .pdf files."
      maxFileSizeLabel="Maximum upload file size: 100 MB"
    />
  );
}
