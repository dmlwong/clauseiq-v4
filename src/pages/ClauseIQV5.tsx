import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type MouseEvent,
  type RefObject,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Sparkles, Search, Check, Pencil, FileText, Loader2,
  ChevronRight, ListChecks, FilePlus2, Building2, Info,
  BookOpen, Scale, ClipboardList, BadgeCheck, ChevronUp, Upload,
} from "lucide-react";
import { LinkText, Text } from "@orbit";
import { Button } from "@/components/clauseiq-v5/orbit-ui/button";
import { showV5OrbitToast as toast } from "@/components/clauseiq-v5/V5OrbitToast";
import { V5Shell } from "@/components/clauseiq-v5/V5Shell";
import { V5InitiativeLinkButton } from "@/components/clauseiq-v5/V5InitiativeLinkButton";
import { StateCard, type CardState } from "@/components/clauseiq-v5/StateCard";
import { InitiativeModal } from "@/components/clauseiq-v5/InitiativeModal";
import {
  CIQ_DEFAULT_PLAYBOOK,
  CIQ_INITIATIVES,
  CIQ_PARAMETER_OPTIONS,
  PLAYBOOK_SCOPE_DISCLAIMER,
  type CiqInitiative,
  type CiqParameterKind,
  type CiqParameterOption,
} from "@/lib/clauseiq-v4-data";
import { cn } from "@/lib/utils";
import { mockInitiative, type ClauseAnalysis, type Initiative } from "@/data/mock-clauseiq";
import { V4_DELIVERY_INITIATIVE_ID } from "@/data/mock-delivery-engine-v4";
import {
  AnalysisCard,
  ResultsContent,
  SupplierOutputsPanel,
} from "@/components/clauseiq-v5/supplier-results";
import type {
  AnalysisParameterItem,
  ResultsLayout,
  SupplierOutputsPanelState,
} from "@/components/clauseiq-v5/supplier-results/types";

type Step = "welcome" | "select" | "parameters" | "upload" | "processing" | "results";
type AnalysisBasisKind = Exclude<CiqParameterKind, "Category">;

interface AnalysisBasisSelection {
  kind: AnalysisBasisKind;
  label: string;
}

interface AnalysisParameterSelection {
  basis: AnalysisBasisSelection | null;
  category: string | null;
}

const PROCESSING_MS = 3_000;
const DEFAULT_BASIS_SELECTION: AnalysisBasisSelection = { kind: "Playbook", label: CIQ_DEFAULT_PLAYBOOK };
const BASIS_PARAMETER_OPTIONS = CIQ_PARAMETER_OPTIONS.filter(
  (option): option is CiqParameterOption & { kind: AnalysisBasisKind } => option.kind !== "Category",
);
const CATEGORY_PARAMETER_OPTION = CIQ_PARAMETER_OPTIONS.find((option) => option.kind === "Category");
const NEXT_ACTION_MILESTONES = Array.from({ length: 5 }, (_, index) => ({
  id: `gate-${index + 1}`,
  label: `Gate ${index + 1}`,
  dueDate: "21/05/2026",
}));
const EMPTY_MOCK_INITIATIVE: Initiative = {
  ...mockInitiative,
  suppliers: mockInitiative.suppliers.map((supplier) => ({
    ...supplier,
    analyses: [],
  })),
};
const FIRST_RUN_MOCK_INITIATIVE: Initiative = {
  ...mockInitiative,
  suppliers: mockInitiative.suppliers.slice(0, 1).map((supplier) => ({
    ...supplier,
    analyses: supplier.analyses.slice(0, 1),
  })),
};
const createRerunAnalysis = (fileName: string): ClauseAnalysis => ({
  id: "a-rerun-latest",
  contractName: "New supplier contract",
  fileName,
  analysedAt: "2026-05-22T11:00:00Z",
  clausesReviewed: 47,
  status: "completed",
  deviations: { missing: 8, high: 6, medium: 4, low: 10, none: 19 },
});
const LATEST_V5_RESULTS_ROUTE =
  "/initiatives-v5?view=results&initiativeId=init-1&supplierId=sup-1&contractId=ct-1&source=clauseiq&catSort=risk&mode=comparison&tab=changes&design=row-scale&scenario=first-analysis";

const createDefaultParameterSelection = (): AnalysisParameterSelection => ({
  basis: { ...DEFAULT_BASIS_SELECTION },
  category: null,
});

const buildAnalysisParameters = (
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

const hasCompleteAnalysisParameters = (
  selected: AnalysisParameterSelection | null,
): selected is AnalysisParameterSelection & { basis: AnalysisBasisSelection } => {
  if (!selected?.basis) return false;
  if (selected.basis.kind === "Playbook") return true;
  return Boolean(selected.category);
};

interface ClauseIQV5Props {
  forceResults?: boolean;
  resultsLayout?: ResultsLayout;
}

export default function ClauseIQV5({ forceResults = false, resultsLayout = "accordion" }: ClauseIQV5Props) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resultsFromRoute = forceResults || searchParams.get("view") === "results";
  const rerunUploadFromRoute = resultsFromRoute && searchParams.get("rerun") === "upload";
  const resultScenario = searchParams.get("resultScenario") === "history" ? "history" : "empty";
  const currentRoute = `${window.location.pathname}${window.location.search}`;
  const defaultCompletedInitiative =
    CIQ_INITIATIVES.find((item) => item.name === "Network Edge Hardware") ?? CIQ_INITIATIVES[0];
  const [step, setStep] = useState<Step>(resultsFromRoute ? "results" : "welcome");
  const [initiative, setInitiative] = useState<CiqInitiative | null>(
    resultsFromRoute ? defaultCompletedInitiative : null,
  );
  const [selectedParameter, setSelectedParameter] = useState<AnalysisParameterSelection | null>(
    resultsFromRoute ? createDefaultParameterSelection() : null,
  );
  const [file, setFile] = useState<File | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [rerunUploadVisible, setRerunUploadVisible] = useState(rerunUploadFromRoute);
  const [rerunSelectedParameter, setRerunSelectedParameter] = useState<AnalysisParameterSelection | null>(null);
  const [rerunProcessing, setRerunProcessing] = useState(false);
  const [pendingRerunAnalysis, setPendingRerunAnalysis] = useState<ClauseAnalysis | null>(null);
  const [pendingRerunParameter, setPendingRerunParameter] = useState<AnalysisParameterSelection | null>(null);
  const [completedRerunAnalysis, setCompletedRerunAnalysis] = useState<ClauseAnalysis | null>(null);
  const [completedRerunParameter, setCompletedRerunParameter] = useState<AnalysisParameterSelection | null>(null);
  const [completedMilestoneIds, setCompletedMilestoneIds] = useState<string[]>([]);
  const [initiativeCompleted, setInitiativeCompleted] = useState(false);

  const selectRef = useRef<HTMLDivElement>(null);
  const parametersRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLDivElement>(null);
  const rerunUploadRef = useRef<HTMLDivElement>(null);
  const processingRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const latestOutputRef = useRef<HTMLDivElement>(null);

  const scrollLatestOutputIntoView = useCallback((delay = 120) => {
    window.setTimeout(() => {
      latestOutputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, delay);
  }, []);

  const scrollRerunWorkflowIntoView = useCallback((delay = 120) => {
    window.setTimeout(() => {
      rerunUploadRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, delay);
  }, []);

  useEffect(() => {
    if (!forceResults && searchParams.get("view") === "results" && !rerunUploadFromRoute) {
      navigate("/clauseiq-v5/output-panel", { replace: true });
      return;
    }

    if (!resultsFromRoute) return;
    setInitiative((current) => current ?? defaultCompletedInitiative);
    setSelectedParameter((current) => current ?? createDefaultParameterSelection());
    setStep("results");
    if (rerunUploadFromRoute) {
      setRerunUploadVisible(true);
      scrollRerunWorkflowIntoView(160);
    }
  }, [defaultCompletedInitiative, forceResults, navigate, rerunUploadFromRoute, resultsFromRoute, scrollRerunWorkflowIntoView, searchParams]);

  // Auto-scroll the active card into view
  useEffect(() => {
    const map: Partial<Record<Step, RefObject<HTMLDivElement>>> = {
      select: selectRef, parameters: parametersRef, upload: uploadRef, processing: processingRef, results: resultRef,
    };
    if (step === "results") {
      scrollLatestOutputIntoView(140);
      return;
    }
    const el = map[step]?.current;
    if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }, [scrollLatestOutputIntoView, step]);

  useEffect(() => {
    if (step !== "results") return;
    if (rerunUploadVisible) {
      scrollRerunWorkflowIntoView(140);
      return;
    }
    scrollLatestOutputIntoView(140);
  }, [rerunProcessing, rerunUploadVisible, scrollLatestOutputIntoView, scrollRerunWorkflowIntoView, step]);

  // Simulated processing
  useEffect(() => {
    if (step !== "processing") return;
    const t = setTimeout(() => {
      setStep("results");
      if (!forceResults) {
        navigate("/clauseiq-v5/output-panel");
      }
    }, PROCESSING_MS);
    return () => clearTimeout(t);
  }, [forceResults, navigate, step]);

  useEffect(() => {
    if (!rerunProcessing) return;
    const t = setTimeout(() => {
      setRerunProcessing(false);
      setCompletedRerunAnalysis(pendingRerunAnalysis ?? createRerunAnalysis("New_Contract.pdf"));
      setCompletedRerunParameter(pendingRerunParameter ?? selectedParameter ?? createDefaultParameterSelection());
      setPendingRerunAnalysis(null);
      setPendingRerunParameter(null);
      setRerunSelectedParameter(null);
      setFile(null);
      toast.success("New analysis added as latest output.");
    }, PROCESSING_MS);
    return () => clearTimeout(t);
  }, [pendingRerunAnalysis, pendingRerunParameter, rerunProcessing, selectedParameter]);

  // ---- state helpers ----
  const stepIndex = (["welcome", "select", "parameters", "upload", "processing", "results"] as Step[]).indexOf(step);
  const welcomeState: CardState = "default";
  const selectVisible = stepIndex >= 1;
  const selectState: CardState = step === "select" ? "active" : "default";
  const parametersVisible = stepIndex >= 2;
  const parametersState: CardState = step === "parameters" ? "active" : "default";
  const uploadVisible = stepIndex >= 3;
  const uploadState: CardState = step === "upload" ? "active" : step === "processing" || step === "results" ? "default" : "default";
  const processingVisible = step === "processing" || step === "results";
  const processingState: CardState = step === "processing" ? "active" : "default";
  const resultsVisible = step === "results";
  const outputPanelResultsVisible = resultsVisible && resultsLayout === "output-panel";
  const showPostAnalysisActions = resultsVisible && !rerunUploadVisible && !rerunProcessing;
  const resultsInitiative =
    outputPanelResultsVisible && resultScenario === "empty" ? FIRST_RUN_MOCK_INITIATIVE : mockInitiative;
  const rerunSupplier = resultsInitiative.suppliers[0];
  const newAnalysisSectionVisible = rerunUploadVisible || rerunProcessing || completedRerunAnalysis !== null;
  const selectedAnalysisParameters = buildAnalysisParameters(selectedParameter);
  const completedRerunAnalysisParameters = buildAnalysisParameters(completedRerunParameter ?? selectedParameter);
  const supplierOutputPanelState: SupplierOutputsPanelState = resultsVisible
    ? "filled"
    : step === "processing"
      ? "processing"
      : "empty";
  const supplierOutputInitiative =
    supplierOutputPanelState === "filled" ? resultsInitiative : EMPTY_MOCK_INITIATIVE;
  const initiativeLocked = step === "processing" || step === "results";
  const parameterLocked = step === "processing" || step === "results";

  // ---- handlers ----
  const handleSelect = (i: CiqInitiative) => {
    setInitiative(i);
    setSelectedParameter(null);
    setFile(null);
    setModalOpen(false);
    setStep("parameters");
  };

  const handleStartAnotherInitiative = () => {
    setInitiative(null);
    setSelectedParameter(null);
    setFile(null);
    setModalOpen(false);
    setRerunUploadVisible(false);
    setRerunSelectedParameter(null);
    setRerunProcessing(false);
    setPendingRerunAnalysis(null);
    setPendingRerunParameter(null);
    setCompletedRerunAnalysis(null);
    setCompletedRerunParameter(null);
    setCompletedMilestoneIds([]);
    setInitiativeCompleted(false);
    setStep("welcome");
    navigate("/clauseiq-v5");
  };

  const handleMilestoneComplete = (milestoneId: string) => {
    setCompletedMilestoneIds((current) => (
      current.includes(milestoneId) ? current : [...current, milestoneId]
    ));
  };

  const handleCompleteInitiative = () => {
    setInitiativeCompleted(true);
  };

  const handleBasisSelect = (option: CiqParameterOption, value: string) => {
    if (option.kind === "Category") return;
    setSelectedParameter((current) => ({
      basis: { kind: option.kind, label: value },
      category: option.kind === "Governing Law" ? current?.category ?? null : null,
    }));
    setFile(null);
    setStep(option.kind === "Playbook" ? "upload" : "parameters");
  };

  const handleCategorySelect = (_option: CiqParameterOption, value: string) => {
    setSelectedParameter((current) => ({
      basis: current?.basis ?? null,
      category: value,
    }));
    setFile(null);
    setStep("upload");
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

  const handleRerunBasisEdit = () => {
    setRerunSelectedParameter((current) => current ? { ...current, basis: null, category: null } : null);
    setFile(null);
  };

  const handleRerunCategoryEdit = () => {
    setRerunSelectedParameter((current) => current ? { ...current, category: null } : null);
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

  const validateAndSetFile = (f: File | null) => {
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Only PDF files are accepted.");
      return;
    }
    if (f.size > 100 * 1024 * 1024) {
      toast.error("File exceeds the 100MB limit.");
      return;
    }
    setFile(f);
    if (resultsVisible && rerunUploadVisible) {
      const parameterForRun = rerunSelectedParameter ?? selectedParameter ?? createDefaultParameterSelection();
      setPendingRerunAnalysis(createRerunAnalysis(f.name));
      setPendingRerunParameter(parameterForRun);
      setCompletedRerunAnalysis(null);
      setCompletedRerunParameter(null);
      setRerunUploadVisible(false);
      setRerunProcessing(true);
      return;
    }
    setStep("processing");
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
    if (!forceResults) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("rerun", "upload");
      navigate(`/clauseiq-v5/output-panel?${nextParams.toString()}`);
    }
    scrollRerunWorkflowIntoView(120);
  };

  const handleDownload = () => {
    toast.success("Report download queued.");
  };

  const handleViewResult = () => {
    navigate(LATEST_V5_RESULTS_ROUTE);
  };

  return (
    <V5Shell
      title="ClauseIQ"
      subtitle="AI tool for detailed contract analyses"
      mainClassName="clauseiq-v5-canvas-grid"
      headerRight={
        resultsVisible ? (
          <V5InitiativeLinkButton
            onClick={() => {
              navigate(`/delivery-engine-v5/${V4_DELIVERY_INITIATIVE_ID}?return=${encodeURIComponent(currentRoute)}`);
            }}
          />
        ) : (
          <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground grid place-items-center">
            <Sparkles className="h-4 w-4" />
          </div>
        )
      }
      rightPanel={
        <div className="h-full p-orbit-base">
          <SupplierOutputsPanel
            initiative={supplierOutputInitiative}
            outputState={supplierOutputPanelState}
            onRunAgain={showRunAgainUpload}
            onDownload={handleDownload}
            onViewResult={handleViewResult}
          />
        </div>
      }
    >
      <div
        className={cn(
          "mx-auto px-orbit-base pt-orbit-xxl space-y-orbit-base transition-[max-width] duration-300",
          "pb-orbit-xxl",
          "max-w-[640px]",
        )}
      >
            {/* Welcome */}
            <StateCard state={welcomeState}>
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
                <div className="text-sm font-medium text-foreground mb-orbit-xs">Summary</div>
                <SummaryRow icon={<ListChecks className="h-4 w-4 text-ciq" />} text="Reviews every clause against your benchmark playbook." />
                <SummaryRow icon={<Building2 className="h-4 w-4 text-ciq" />} text="Tied to a chosen initiative for traceable governance." />
                <SummaryRow icon={<FilePlus2 className="h-4 w-4 text-ciq" />} text="Exports a shareable report with severity and actions." />
              </div>
              {step === "welcome" && (
                <Button
                  className="w-full"
                  onClick={() => setStep("select")}
                >
                  <Sparkles className="h-4 w-4 mr-orbit-s" />
                  Get Started
                </Button>
              )}
            </StateCard>

            {/* Select Initiative OR Initiative Selected */}
            {selectVisible && (
              <div ref={selectRef}>
                {!initiative ? (
                  <StateCard state={selectState}>
                    <h2 className="v5-orbit-heading-5 mb-orbit-xs">Select Initiative</h2>
                    <p className="text-sm text-muted-foreground mb-orbit-base">
                      Choose the initiative to analyse the contract against.
                    </p>
                    <Button
                      className="w-full"
                      onClick={() => setModalOpen(true)}
                    >
                      <Search className="h-4 w-4 mr-orbit-s" />
                      Search Initiatives
                    </Button>
                  </StateCard>
                ) : (
                  <StateCard
                    state="default"
                    className={resultsVisible ? "mx-auto w-full max-w-[640px]" : undefined}
                  >
                    <h2 className="v5-orbit-heading-5 mb-orbit-base">Initiative Selected</h2>
                    <SelectedSummaryRow
                      label={initiative.name}
                      disabled={initiativeLocked}
                      actionLabel="Edit"
                      onAction={() => setModalOpen(true)}
                    />
                  </StateCard>
                )}
              </div>
            )}

            {/* Contract Analysis Parameters */}
            {parametersVisible && !resultsVisible && (
              <div ref={parametersRef} className="space-y-orbit-base">
                <AnalysisParameterCards
                  selectedParameter={selectedParameter}
                  cardState={parametersState}
                  locked={parameterLocked}
                  onBasisSelect={handleBasisSelect}
                  onCategorySelect={handleCategorySelect}
                  onBasisEdit={handleBasisEdit}
                  onCategoryEdit={handleCategoryEdit}
                />
              </div>
            )}

            {/* Upload Contract */}
            {uploadVisible && hasCompleteAnalysisParameters(selectedParameter) && step !== "processing" && step !== "results" && (
              <div ref={uploadRef}>
                <StateCard state={uploadState}>
                  <h2 className="v5-orbit-heading-5 mb-orbit-base">Upload Contract</h2>
                  <PlaybookDisclaimer variant="callout" parameter={selectedParameter} />
                  <Dropzone onFile={validateAndSetFile} />
                </StateCard>
              </div>
            )}

            {/* Analysing */}
            {processingVisible && step === "processing" && (
              <div ref={processingRef}>
                <StateCard state={processingState}>
                  <h2 className="v5-orbit-heading-5 mb-orbit-base">Analysing Your Contract</h2>
                  <div className="flex items-center justify-between border border-border rounded-lg px-orbit-base py-orbit-s mb-orbit-base">
                    <div className="flex items-center gap-orbit-s min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate">{file?.name ?? "Contract.pdf"}</span>
                    </div>
                    <span className="text-xs font-medium text-success inline-flex items-center gap-orbit-xs">
                      <Check className="h-3.5 w-3.5" /> Uploaded
                    </span>
                  </div>
                  <div className="flex items-center gap-orbit-base py-orbit-s">
                    <Loader2 className="h-5 w-5 animate-spin text-ciq" />
                    <span className="text-sm font-medium">Finding clauses in your contract...</span>
                  </div>
                  <PlaybookDisclaimer variant="inline" parameter={selectedParameter} />
                  <p className="text-xs text-muted-foreground mt-orbit-s">
                    This may take a moment. We will notify you when the analysis is completed.
                  </p>
                </StateCard>
              </div>
            )}

            {/* Results */}
            {resultsVisible && (
              <div ref={resultRef} className="space-y-orbit-base">
                <div ref={completedRerunAnalysis ? undefined : latestOutputRef}>
                  <ResultsContent
                    initiative={resultsInitiative}
                    layout={resultsLayout}
                    onRunAgain={showRunAgainUpload}
                    onDownload={resultsLayout === "output-panel" ? undefined : handleDownload}
                    onViewResult={handleViewResult}
                    viewResultPrimary={!newAnalysisSectionVisible}
                    highlightLatestOutput={!newAnalysisSectionVisible}
                    analysisParameters={selectedAnalysisParameters}
                  />
                </div>
                {newAnalysisSectionVisible && <NewAnalysisDivider />}
                {rerunUploadVisible && (
                  <div ref={rerunUploadRef} className="space-y-orbit-base">
                    <AnalysisParameterCards
                      selectedParameter={rerunSelectedParameter}
                      cardState={hasCompleteAnalysisParameters(rerunSelectedParameter) ? "default" : "active"}
                      onBasisSelect={handleRerunBasisSelect}
                      onCategorySelect={handleRerunCategorySelect}
                      onBasisEdit={handleRerunBasisEdit}
                      onCategoryEdit={handleRerunCategoryEdit}
                    />

                    {hasCompleteAnalysisParameters(rerunSelectedParameter) && (
                      <StateCard state="active">
                        <h2 className="v5-orbit-heading-5 mb-orbit-base">Upload Contract</h2>
                        <PlaybookDisclaimer variant="callout" parameter={rerunSelectedParameter} />
                        <Dropzone onFile={validateAndSetFile} />
                      </StateCard>
                    )}
                  </div>
                )}
                {rerunProcessing && (
                  <StateCard state="active">
                    <h2 className="v5-orbit-heading-5 mb-orbit-base">Analysing New Contract</h2>
                    <div className="flex items-center justify-between border border-border rounded-lg px-orbit-base py-orbit-s mb-orbit-base">
                      <div className="flex items-center gap-orbit-s min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate">{file?.name ?? "Contract.pdf"}</span>
                      </div>
                      <span className="text-xs font-medium text-success inline-flex items-center gap-orbit-xs">
                        <Check className="h-3.5 w-3.5" /> Uploaded
                      </span>
                    </div>
                    <div className="flex items-center gap-orbit-base py-orbit-s">
                      <Loader2 className="h-5 w-5 animate-spin text-ciq" />
                      <span className="text-sm font-medium">Finding clauses in your new contract...</span>
                    </div>
                    <PlaybookDisclaimer variant="inline" parameter={rerunSelectedParameter ?? selectedParameter} />
                    <p className="text-xs text-muted-foreground mt-orbit-s">
                      The existing analysis history remains available above while this runs.
                    </p>
                  </StateCard>
                )}
                {completedRerunAnalysis && rerunSupplier && (
                  <div ref={latestOutputRef}>
                    <AnalysisCard
                      analysis={completedRerunAnalysis}
                      supplier={rerunSupplier}
                      showSupplier
                      onRunAgain={showRunAgainUpload}
                      onViewResult={handleViewResult}
                      viewResultPrimary
                      isLatestOutput
                      highlighted
                      analysisParameters={completedRerunAnalysisParameters}
                    />
                  </div>
                )}
                {showPostAnalysisActions && (
                  <PostAnalysisNextActions
                    completedMilestoneIds={completedMilestoneIds}
                    initiativeCompleted={initiativeCompleted}
                    onStartAnotherInitiative={handleStartAnotherInitiative}
                    onMilestoneComplete={handleMilestoneComplete}
                    onCompleteInitiative={handleCompleteInitiative}
                  />
                )}
                <div className="h-[304px]" aria-hidden="true" />
              </div>
            )}

            {!outputPanelResultsVisible && (
              <div className="lg:hidden">
                <SupplierOutputsPanel
                  initiative={supplierOutputInitiative}
                  outputState={supplierOutputPanelState}
                  onRunAgain={showRunAgainUpload}
                  onDownload={handleDownload}
                  onViewResult={handleViewResult}
                />
              </div>
            )}
          </div>

      <InitiativeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={handleSelect}
      />
    </V5Shell>
  );
}

function SummaryRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-orbit-s text-sm text-foreground/90">
      <span className="mt-orbit-xxs">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function NewAnalysisDivider() {
  return (
    <div className="flex items-center gap-orbit-base py-orbit-xs">
      <div className="h-px flex-1 bg-slate-300" />
      <span className="rounded-md border border-primary bg-white px-orbit-base py-orbit-xs text-sm font-medium text-primary shadow-sm">
        New Analysis
      </span>
      <div className="h-px flex-1 bg-slate-300" />
    </div>
  );
}

function PostAnalysisNextActions({
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
            <span className="block text-sm font-medium text-foreground">
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
                      <td className={cn("px-orbit-base py-orbit-base text-base", completed ? "font-medium text-success" : "text-foreground")}>
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
              <span className="block text-sm font-medium text-foreground">Complete Initiative</span>
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

function AnalysisParameterCards({
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
  const [activeBasisKind, setActiveBasisKind] = useState<AnalysisBasisKind>("Playbook");

  useEffect(() => {
    if (selectedParameter?.basis) {
      setActiveBasisKind(selectedParameter.basis.kind);
    }
  }, [selectedParameter?.basis?.kind]);

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
              label={`${selectedParameter!.basis!.kind} · ${selectedParameter!.basis!.label}`}
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
                label={`Category · ${selectedParameter!.category!}`}
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

function SelectedSummaryRow({
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
        <span className={cn("truncate text-sm font-medium", disabled ? "text-muted-foreground" : "text-foreground")}>
          {label}
        </span>
      </div>
      {!disabled && (
        <button
          type="button"
          className="inline-flex h-8 shrink-0 items-center gap-orbit-xs rounded-md px-orbit-s text-sm font-medium text-ciq transition-colors hover:bg-ciq-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              <span className="min-w-0 flex-1 truncate font-medium">{option.label}</span>
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

function parameterDisclaimer(parameter: AnalysisParameterSelection | null) {
  if (!hasCompleteAnalysisParameters(parameter)) {
    return "Analysis is based on the selected playbook or governing law, plus the required category.";
  }

  if (parameter.basis.kind === "Playbook") {
    return PLAYBOOK_SCOPE_DISCLAIMER;
  }

  return `Analysis is based on the selected governing law and ${parameter.category} category. Clauses outside that combined scope won't appear in results.`;
}

function PlaybookDisclaimer({ variant, parameter }: { variant: "callout" | "inline"; parameter: AnalysisParameterSelection | null }) {
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

function NextRow({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <button className="w-full flex items-center justify-between border-b border-border py-orbit-base text-left hover:bg-muted/40 px-orbit-xs -mx-orbit-xs rounded transition-colors">
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}

function Dropzone({ onFile }: { onFile: (f: File | null) => void }) {
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
