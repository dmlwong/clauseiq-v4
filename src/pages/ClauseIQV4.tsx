import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Sparkles, Search, Check, Pencil, UploadCloud, FileText, Loader2,
  ChevronRight, ListChecks, FileDown, Building2, Info,
  BookOpen, Scale, ClipboardList, BadgeCheck, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/components/ui/sonner";
import { V4Shell } from "@/components/clauseiq-v4/V4Shell";
import { V4InitiativeLinkButton } from "@/components/clauseiq-v4/V4InitiativeLinkButton";
import { StateCard, type CardState } from "@/components/clauseiq-v4/StateCard";
import { InitiativeModal } from "@/components/clauseiq-v4/InitiativeModal";
import {
  CIQ_DEFAULT_PLAYBOOK,
  CIQ_INITIATIVES,
  CIQ_PARAMETER_OPTIONS,
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
} from "@/components/clauseiq-v4/supplier-results";
import type {
  AnalysisParameterItem,
  ResultsLayout,
  SupplierOutputsPanelState,
} from "@/components/clauseiq-v4/supplier-results/types";

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
const DEFAULT_CATEGORY = "Services";
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
const LATEST_V4_RESULTS_ROUTE =
  "/initiatives-v4?view=results&initiativeId=init-1&supplierId=sup-1&contractId=ct-1&source=clauseiq&catSort=risk&mode=comparison&tab=changes&design=row-scale&scenario=first-analysis";

const createDefaultParameterSelection = (): AnalysisParameterSelection => ({
  basis: { ...DEFAULT_BASIS_SELECTION },
  category: DEFAULT_CATEGORY,
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
): selected is AnalysisParameterSelection & { basis: AnalysisBasisSelection; category: string } => {
  return Boolean(selected?.basis && selected.category);
};

interface ClauseIQV4Props {
  forceResults?: boolean;
  resultsLayout?: ResultsLayout;
}

export default function ClauseIQV4({ forceResults = false, resultsLayout = "accordion" }: ClauseIQV4Props) {
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
      navigate("/clauseiq-v4/output-panel", { replace: true });
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
        navigate("/clauseiq-v4/output-panel");
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
    navigate("/clauseiq-v4");
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
      category: current?.category ?? null,
    }));
    setFile(null);
    setStep((currentStep) => (currentStep === "upload" && selectedParameter?.category ? "upload" : "parameters"));
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
      category: current?.category ?? null,
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
    setRerunSelectedParameter((current) => current ? { ...current, basis: null } : null);
    setFile(null);
  };

  const handleRerunCategoryEdit = () => {
    setRerunSelectedParameter((current) => current ? { ...current, category: null } : null);
    setFile(null);
  };

  const handleBasisEdit = () => {
    if (parameterLocked) return;
    setSelectedParameter((current) => current ? { ...current, basis: null } : null);
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
      navigate(`/clauseiq-v4/output-panel?${nextParams.toString()}`);
    }
    scrollRerunWorkflowIntoView(120);
  };

  const handleDownload = () => {
    toast.success("Report download queued.");
  };

  const handleViewResult = () => {
    navigate(LATEST_V4_RESULTS_ROUTE);
  };

  return (
    <V4Shell
      title="ClauseIQ"
      subtitle="AI tool for detailed contract analyses"
      headerRight={
        resultsVisible ? (
          <V4InitiativeLinkButton
            onClick={() => {
              navigate(`/delivery-engine-v4/${V4_DELIVERY_INITIATIVE_ID}?return=${encodeURIComponent(currentRoute)}`);
            }}
          />
        ) : (
          <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground grid place-items-center">
            <Sparkles className="h-4 w-4" />
          </div>
        )
      }
      rightPanel={
        <div className="h-full p-[16px]">
          <SupplierOutputsPanel
            initiative={supplierOutputInitiative}
            outputState={supplierOutputPanelState}
            onRunAgain={showRunAgainUpload}
            onDownload={handleDownload}
            onViewResult={handleViewResult}
          />
        </div>
      }
      mainClassName="clauseiq-v4-canvas-grid"
    >
      <div
        className={cn(
          "mx-auto px-[16px] pt-10 space-y-5 transition-[max-width] duration-300",
          "pb-10",
          "max-w-[640px]",
        )}
      >
            {/* Welcome */}
            <StateCard state={welcomeState}>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground grid place-items-center">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h1 className="text-xl font-semibold">ClauseIQ</h1>
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                Upload a contract and ClauseIQ will review it against your initiative's playbook,
                surfacing deviations, missing clauses and negotiation actions in seconds.
              </p>
              <div className="rounded-lg bg-muted/50 border border-border p-[16px] mb-5 space-y-3">
                <div className="text-sm font-medium text-foreground mb-1">Summary</div>
                <SummaryRow icon={<ListChecks className="h-4 w-4 text-ciq" />} text="Reviews every clause against your benchmark playbook." />
                <SummaryRow icon={<Building2 className="h-4 w-4 text-ciq" />} text="Tied to a chosen initiative for traceable governance." />
                <SummaryRow icon={<FileDown className="h-4 w-4 text-ciq" />} text="Exports a shareable report with severity and actions." />
              </div>
              {step === "welcome" && (
                <Button
                  className="w-full"
                  onClick={() => setStep("select")}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Get Started
                </Button>
              )}
            </StateCard>

            {/* Select Initiative OR Initiative Selected */}
            {selectVisible && (
              <div ref={selectRef}>
                {!initiative ? (
                  <StateCard state={selectState}>
                    <h2 className="text-base font-semibold mb-1">Select Initiative</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      Choose the initiative to analyse the contract against.
                    </p>
                    <Button
                      className="w-full"
                      onClick={() => setModalOpen(true)}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Search Initiatives
                    </Button>
                  </StateCard>
                ) : (
	                  <StateCard
	                    state="default"
	                    className={resultsVisible ? "mx-auto w-full max-w-[640px]" : undefined}
	                  >
                    <h2 className="text-base font-semibold mb-3">Initiative Selected</h2>
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
              <div ref={parametersRef} className="space-y-4">
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
                  <h2 className="text-base font-semibold mb-3">Upload Contract</h2>
                  <PlaybookDisclaimer variant="callout" parameter={selectedParameter} />
                  <Dropzone onFile={validateAndSetFile} />
                  <div className="mt-3 text-xs text-muted-foreground space-y-0.5">
                    <div>File types supported: PDF</div>
                    <div>Maximum upload file size: 100 MB</div>
                  </div>
                </StateCard>
              </div>
            )}

            {/* Analysing */}
            {processingVisible && step === "processing" && (
              <div ref={processingRef}>
                <StateCard state={processingState}>
                  <h2 className="text-base font-semibold mb-4">Analysing Your Contract</h2>
                  <div className="flex items-center justify-between border border-border rounded-lg p-[16px] mb-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate">{file?.name ?? "Contract.pdf"}</span>
                    </div>
                    <span className="text-xs font-medium text-success inline-flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> Uploaded
                    </span>
                  </div>
                  <div className="flex items-center gap-3 py-2">
                    <Loader2 className="h-5 w-5 animate-spin text-ciq" />
                    <span className="text-sm font-medium">Finding clauses in your contract...</span>
                  </div>
                  <PlaybookDisclaimer variant="inline" parameter={selectedParameter} />
                  <p className="text-xs text-muted-foreground mt-2">
                    This may take a moment. We will notify you when the analysis is completed.
                  </p>
                </StateCard>
              </div>
            )}

            {/* Results */}
            {resultsVisible && (
              <div ref={resultRef} className="space-y-4">
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
                  <div ref={rerunUploadRef} className="space-y-4">
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
                        <h2 className="text-base font-semibold mb-3">Upload Contract</h2>
                        <PlaybookDisclaimer variant="callout" parameter={rerunSelectedParameter} />
                        <Dropzone onFile={validateAndSetFile} />
                        <div className="mt-3 text-xs text-muted-foreground space-y-0.5">
                          <div>File types supported: PDF</div>
                          <div>Maximum upload file size: 100 MB</div>
                        </div>
                      </StateCard>
                    )}
                  </div>
                )}
                {rerunProcessing && (
                  <StateCard state="active">
                    <h2 className="text-base font-semibold mb-4">Analysing New Contract</h2>
                    <div className="flex items-center justify-between border border-border rounded-lg p-[16px] mb-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate">{file?.name ?? "Contract.pdf"}</span>
                      </div>
                      <span className="text-xs font-medium text-success inline-flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> Uploaded
                      </span>
                    </div>
                    <div className="flex items-center gap-3 py-2">
                      <Loader2 className="h-5 w-5 animate-spin text-ciq" />
                      <span className="text-sm font-medium">Finding clauses in your new contract...</span>
                    </div>
                    <PlaybookDisclaimer variant="inline" parameter={rerunSelectedParameter ?? selectedParameter} />
                    <p className="text-xs text-muted-foreground mt-2">
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
    </V4Shell>
  );
}

function SummaryRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-2 text-sm text-foreground/90">
      <span className="mt-0.5">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function NewAnalysisDivider() {
  return (
    <div className="flex items-center gap-4 py-1">
      <div className="h-px flex-1 bg-slate-300" />
      <span className="rounded-md border border-primary bg-white px-3 py-1 text-sm font-medium text-primary shadow-sm">
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
    <StateCard state="default" className="space-y-6">
      <h2 className="text-base font-semibold text-foreground">Next, you can...</h2>

      <button
        type="button"
        className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-[16px] text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        onClick={onStartAnotherInitiative}
      >
        <Sparkles className="h-6 w-6 shrink-0 text-primary" />
        <span className="min-w-0">
          <span className="block text-lg font-semibold text-foreground">
            Analyse Contract on Another Initiative
          </span>
          <span className="mt-1 block text-base text-muted-foreground">
            Start fresh with a new initiative.
          </span>
        </span>
      </button>

      <div className="h-px bg-border" />

      <section className="rounded-xl border border-border bg-card p-[16px]" aria-labelledby="v4-update-milestone-title">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <ClipboardList className="mt-1 h-5 w-5 shrink-0 text-primary" />
            <div>
              <h3 id="v4-update-milestone-title" className="text-lg font-semibold text-foreground">
                Update Milestone
              </h3>
              <p className="mt-1 text-base text-muted-foreground">Track your initiative progress.</p>
            </div>
          </div>
          <ChevronUp className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        </div>

        <div className="mt-5 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="px-5 py-4 text-base font-semibold text-foreground">Milestone</th>
                <th scope="col" className="px-5 py-4 text-base font-semibold text-foreground">Due Date</th>
                <th scope="col" className="px-5 py-4 text-base font-semibold text-foreground">Status</th>
                <th scope="col" className="px-5 py-4 text-base font-semibold text-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {NEXT_ACTION_MILESTONES.map((milestone) => {
                const completed = completedMilestoneIds.includes(milestone.id);

                return (
                  <tr key={milestone.id} className="border-b border-border last:border-b-0">
                    <td className="px-5 py-4 text-base text-foreground">{milestone.label}</td>
                    <td className="px-5 py-4 text-base text-foreground">{milestone.dueDate}</td>
                    <td className={cn("px-5 py-4 text-base", completed ? "font-medium text-success" : "text-foreground")}>
                      {completed ? "Completed" : "Pending"}
                    </td>
                    <td className="px-5 py-3">
                      {completed ? (
                        <Button variant="outline" className="h-9 gap-2" disabled>
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
          className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-[16px] text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          onClick={onCompleteInitiative}
        >
          <BadgeCheck className="h-6 w-6 shrink-0 text-primary" />
          <span className="min-w-0">
            <span className="block text-lg font-semibold text-foreground">Complete Initiative</span>
            <span className="mt-1 block text-base text-muted-foreground">
              Mark this initiative as complete.
            </span>
          </span>
        </button>
      )}
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
        <h2 className="text-base font-semibold mb-1">Contract Analysis Parameters</h2>
        {!basisSelected ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">
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
          <div className="mt-3">
            <SelectedSummaryRow
              label={`${selectedParameter!.basis!.kind} · ${selectedParameter!.basis!.label}`}
              disabled={locked}
              actionLabel={`Change ${selectedParameter!.basis!.kind}`}
              onAction={onBasisEdit}
            />
          </div>
        )}
      </StateCard>

      {basisSelected && (
        <StateCard state={categorySelected ? "default" : "active"}>
          <h2 className="text-base font-semibold mb-1">Category</h2>
          {!categorySelected ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Select the category ClauseIQ should use for this analysis.
              </p>
              {CATEGORY_PARAMETER_OPTION && (
                <ParameterOptionsList option={CATEGORY_PARAMETER_OPTION} onSelect={onCategorySelect} />
              )}
            </>
          ) : (
            <div className="mt-3">
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

function ParameterOptionsList({
  option,
  onSelect,
  variant = "framed",
}: {
  option: CiqParameterOption;
  onSelect: (option: CiqParameterOption, value: string) => void;
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
      <div className={cn(framed ? "max-h-52 overflow-y-auto p-1" : "space-y-1")}>
        {option.options.map((value) => (
          <button
            key={value}
            type="button"
            role="option"
            aria-selected={false}
            className="w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
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
    <div className="space-y-3">
      <RadioGroup
        value={activeOption.kind}
        onValueChange={(value) => onActiveKindChange(value as AnalysisBasisKind)}
        className="grid gap-3 sm:grid-cols-2"
        aria-label="Contract analysis parameter type"
      >
        {options.map((option) => {
          const selected = option.kind === activeOption.kind;
          const optionId = `ciq-parameter-kind-${option.kind.toLowerCase().replace(/\s+/g, "-")}`;

          return (
            <label
              key={option.kind}
              htmlFor={optionId}
              className={cn(
                "flex min-h-16 cursor-pointer items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm transition-colors",
                selected
                  ? "border-primary/60 text-foreground shadow-sm ring-1 ring-primary/20"
                  : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
              )}
            >
              <RadioGroupItem id={optionId} value={option.kind} />
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                <ParameterIcon kind={option.kind} />
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">{option.label}</span>
            </label>
          );
        })}
      </RadioGroup>

      <ParameterOptionsList option={activeOption} onSelect={onSelect} />
    </div>
  );
}

function SelectedSummaryRow({
  label,
  disabled,
  mutedWhenDisabled = true,
  actionLabel,
  onAction,
}: {
  label: string;
  disabled: boolean;
  mutedWhenDisabled?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const muted = disabled && mutedWhenDisabled;

  return (
    <div
      className={cn(
        "flex min-h-11 items-center justify-between gap-4 rounded-md border px-[16px] py-[8px]",
        muted ? "border-border bg-muted text-muted-foreground" : "border-border bg-card text-foreground",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <Check className={cn("h-4 w-4 shrink-0", muted ? "text-muted-foreground" : "text-success")} />
        <span className={cn("truncate text-sm font-medium", muted ? "text-muted-foreground" : "text-foreground")}>
          {label}
        </span>
      </div>
      {!disabled && actionLabel && onAction && (
        <button
          type="button"
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-ciq transition-colors hover:bg-ciq-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={onAction}
        >
          <Pencil className="h-3.5 w-3.5" />
          {actionLabel}
        </button>
      )}
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
    return `Analysis is based on the selected playbook and ${parameter.category} category. Clauses outside that combined scope won't appear in results.`;
  }

  return `Analysis is based on the selected governing law and ${parameter.category} category. Clauses outside that combined scope won't appear in results.`;
}

function PlaybookDisclaimer({ variant, parameter }: { variant: "callout" | "inline"; parameter: AnalysisParameterSelection | null }) {
  const copy = parameterDisclaimer(parameter);

  if (variant === "inline") {
    return (
      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
        {copy}
      </p>
    );
  }

  return (
    <div className="mb-4 flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-[11px] leading-snug text-muted-foreground">
      <Info className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
      <span>{copy}</span>
    </div>
  );
}

function NextRow({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <button className="w-full flex items-center justify-between border-b border-border py-3 text-left hover:bg-muted/40 px-1 -mx-1 rounded transition-colors">
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
  const [hover, setHover] = useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setHover(true); }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault(); setHover(false);
        onFile(e.dataTransfer.files?.[0] ?? null);
      }}
      className={`rounded-lg border-2 border-dashed p-[16px] text-center transition-colors ${
        hover ? "border-ciq bg-ciq-soft" : "border-border bg-muted/30"
      }`}
    >
      <UploadCloud className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
      <div className="text-sm">
        Drag &amp; drop or{" "}
        <button
          type="button"
          className="text-ciq font-medium hover:underline"
          onClick={() => inputRef.current?.click()}
        >
          choose files
        </button>{" "}
        to upload
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
