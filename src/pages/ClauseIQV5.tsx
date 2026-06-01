import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Sparkles, Search, Check, FileText, Loader2,
} from "lucide-react";
import { Button } from "@/components/clauseiq-v5/orbit-ui/button";
import { V5Shell } from "@/components/clauseiq-v5/V5Shell";
import { V5InitiativeLinkButton } from "@/components/clauseiq-v5/V5InitiativeLinkButton";
import { StateCard, type CardState } from "@/components/clauseiq-v5/StateCard";
import { InitiativeModal } from "@/components/clauseiq-v5/InitiativeModal";
import {
  CIQ_INITIATIVES,
  type CiqInitiative,
} from "@/lib/clauseiq-v4-data";
import { cn } from "@/lib/utils";
import { V4_DELIVERY_INITIATIVE_ID } from "@/data/mock-delivery-engine-v4";
import {
  AnalysisCard,
  ResultsContent,
  SupplierOutputsPanel,
} from "@/components/clauseiq-v5/supplier-results";
import type { ResultsLayout } from "@/components/clauseiq-v5/supplier-results/types";
import {
  AnalysisParameterCards,
  ClauseIqDropzone,
  ClauseIqOverviewCard,
  LATEST_V5_RESULTS_ROUTE,
  NewAnalysisDivider,
  PlaybookDisclaimer,
  PostAnalysisNextActions,
  SelectedSummaryRow,
  createDefaultParameterSelection,
  hasCompleteAnalysisParameters,
  useClauseIqWorkflow,
  type ClauseIqWorkflowStep,
} from "@/components/clauseiq-v5/ClauseIqWorkflow";

const V5_WORKFLOW_STEPS: ClauseIqWorkflowStep[] = [
  "welcome",
  "select",
  "parameters",
  "upload",
  "processing",
  "results",
];

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
  const [modalOpen, setModalOpen] = useState(false);

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

  const handleProcessingComplete = useCallback(() => {
    if (!forceResults) {
      navigate("/clauseiq-v5/output-panel");
    }
  }, [forceResults, navigate]);

  const handleRunAgain = useCallback(() => {
    if (!forceResults) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("rerun", "upload");
      navigate(`/clauseiq-v5/output-panel?${nextParams.toString()}`);
    }
    scrollRerunWorkflowIntoView(120);
  }, [forceResults, navigate, scrollRerunWorkflowIntoView, searchParams]);

  const workflow = useClauseIqWorkflow({
    initialStep: resultsFromRoute ? "results" : "welcome",
    initialInitiative: resultsFromRoute ? defaultCompletedInitiative : null,
    initialSelectedParameter: resultsFromRoute ? createDefaultParameterSelection() : null,
    initialRerunUploadVisible: rerunUploadFromRoute,
    useFirstRunResults: resultsLayout === "output-panel" && resultScenario === "empty",
    onProcessingComplete: handleProcessingComplete,
    onRunAgain: handleRunAgain,
  });

  const { step } = workflow;
  const stepIndex = V5_WORKFLOW_STEPS.indexOf(step);
  const selectVisible = stepIndex >= 1;
  const selectState: CardState = step === "select" ? "active" : "default";
  const parametersVisible = stepIndex >= 2;
  const parametersState: CardState = step === "parameters" ? "active" : "default";
  const uploadVisible = stepIndex >= 3;
  const uploadState: CardState = step === "upload" ? "active" : "default";
  const processingState: CardState = step === "processing" ? "active" : "default";
  const resultsVisible = workflow.resultsVisible;
  const outputPanelResultsVisible = resultsVisible && resultsLayout === "output-panel";
  const initiative = workflow.initiative;
  const selectedParameter = workflow.selectedParameter;
  const newAnalysisSectionVisible = workflow.newAnalysisSectionVisible;

  useEffect(() => {
    if (!forceResults && searchParams.get("view") === "results" && !rerunUploadFromRoute) {
      navigate("/clauseiq-v5/output-panel", { replace: true });
      return;
    }

    if (!resultsFromRoute) return;
    workflow.actions.showResultsFromRoute(defaultCompletedInitiative, rerunUploadFromRoute);
    if (rerunUploadFromRoute) {
      scrollRerunWorkflowIntoView(160);
    }
  }, [defaultCompletedInitiative, forceResults, navigate, rerunUploadFromRoute, resultsFromRoute, scrollRerunWorkflowIntoView, searchParams]);

  // Auto-scroll the active card into view
  useEffect(() => {
    const map: Partial<Record<ClauseIqWorkflowStep, RefObject<HTMLDivElement>>> = {
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
    if (workflow.rerunUploadVisible) {
      scrollRerunWorkflowIntoView(140);
      return;
    }
    scrollLatestOutputIntoView(140);
  }, [scrollLatestOutputIntoView, scrollRerunWorkflowIntoView, step, workflow.rerunProcessing, workflow.rerunUploadVisible]);

  // ---- handlers ----
  const handleSelect = (i: CiqInitiative) => {
    workflow.actions.selectInitiative(i);
    setModalOpen(false);
  };

  const handleStartAnotherInitiative = () => {
    workflow.actions.startAnotherInitiative(true);
    setModalOpen(false);
    navigate("/clauseiq-v5");
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
            initiative={workflow.supplierOutputInitiative}
            outputState={workflow.supplierOutputPanelState}
            onRunAgain={workflow.actions.showRunAgainUpload}
            onDownload={workflow.actions.handleDownload}
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
            <ClauseIqOverviewCard step={step} onStart={() => workflow.actions.setStep("select")} />

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
                      disabled={workflow.initiativeLocked}
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
                  locked={workflow.parameterLocked}
                  onBasisSelect={workflow.actions.handleBasisSelect}
                  onCategorySelect={workflow.actions.handleCategorySelect}
                  onBasisEdit={workflow.actions.handleBasisEdit}
                  onCategoryEdit={workflow.actions.handleCategoryEdit}
                />
              </div>
            )}

            {/* Upload Contract */}
            {uploadVisible && hasCompleteAnalysisParameters(selectedParameter) && step !== "processing" && step !== "results" && (
              <div ref={uploadRef}>
                <StateCard state={uploadState}>
                  <h2 className="v5-orbit-heading-5 mb-orbit-base">Upload Contract</h2>
                  <PlaybookDisclaimer variant="callout" parameter={selectedParameter} />
                  <ClauseIqDropzone onFile={workflow.actions.validateAndSetFile} />
                </StateCard>
              </div>
            )}

            {/* Analysing */}
            {workflow.processingVisible && step === "processing" && (
              <div ref={processingRef}>
                <StateCard state={processingState}>
                  <h2 className="v5-orbit-heading-5 mb-orbit-base">Analysing Your Contract</h2>
                  <div className="flex items-center justify-between border border-border rounded-lg px-orbit-base py-orbit-s mb-orbit-base">
                    <div className="flex items-center gap-orbit-s min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate">{workflow.file?.name ?? "Contract.pdf"}</span>
                    </div>
                    <span className="text-xs v5-orbit-weight-medium text-success inline-flex items-center gap-orbit-xs">
                      <Check className="h-3.5 w-3.5" /> Uploaded
                    </span>
                  </div>
                  <div className="flex items-center gap-orbit-base py-orbit-s">
                    <Loader2 className="h-5 w-5 animate-spin text-ciq" />
                    <span className="text-sm v5-orbit-weight-medium">Finding clauses in your contract...</span>
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
                <div ref={workflow.completedRerunAnalysis ? undefined : latestOutputRef}>
                  <ResultsContent
                    initiative={workflow.resultsInitiative}
                    layout={resultsLayout}
                    onRunAgain={workflow.actions.showRunAgainUpload}
                    onDownload={resultsLayout === "output-panel" ? undefined : workflow.actions.handleDownload}
                    onViewResult={handleViewResult}
                    viewResultPrimary={!newAnalysisSectionVisible}
                    highlightLatestOutput={!newAnalysisSectionVisible}
                    analysisParameters={workflow.selectedAnalysisParameters}
                  />
                </div>
                {newAnalysisSectionVisible && <NewAnalysisDivider />}
                {workflow.rerunUploadVisible && (
                  <div ref={rerunUploadRef} className="space-y-orbit-base">
                    <AnalysisParameterCards
                      selectedParameter={workflow.rerunSelectedParameter}
                      cardState={hasCompleteAnalysisParameters(workflow.rerunSelectedParameter) ? "default" : "active"}
                      onBasisSelect={workflow.actions.handleRerunBasisSelect}
                      onCategorySelect={workflow.actions.handleRerunCategorySelect}
                      onBasisEdit={workflow.actions.handleRerunBasisEdit}
                      onCategoryEdit={workflow.actions.handleRerunCategoryEdit}
                    />

                    {hasCompleteAnalysisParameters(workflow.rerunSelectedParameter) && (
                      <StateCard state="active">
                        <h2 className="v5-orbit-heading-5 mb-orbit-base">Upload Contract</h2>
                        <PlaybookDisclaimer variant="callout" parameter={workflow.rerunSelectedParameter} />
                        <ClauseIqDropzone onFile={workflow.actions.validateAndSetFile} />
                      </StateCard>
                    )}
                  </div>
                )}
                {workflow.rerunProcessing && (
                  <StateCard state="active">
                    <h2 className="v5-orbit-heading-5 mb-orbit-base">Analysing New Contract</h2>
                    <div className="flex items-center justify-between border border-border rounded-lg px-orbit-base py-orbit-s mb-orbit-base">
                      <div className="flex items-center gap-orbit-s min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate">{workflow.file?.name ?? "Contract.pdf"}</span>
                      </div>
                      <span className="text-xs v5-orbit-weight-medium text-success inline-flex items-center gap-orbit-xs">
                        <Check className="h-3.5 w-3.5" /> Uploaded
                      </span>
                    </div>
                    <div className="flex items-center gap-orbit-base py-orbit-s">
                      <Loader2 className="h-5 w-5 animate-spin text-ciq" />
                      <span className="text-sm v5-orbit-weight-medium">Finding clauses in your new contract...</span>
                    </div>
                    <PlaybookDisclaimer variant="inline" parameter={workflow.rerunSelectedParameter ?? selectedParameter} />
                    <p className="text-xs text-muted-foreground mt-orbit-s">
                      The existing analysis history remains available above while this runs.
                    </p>
                  </StateCard>
                )}
                {workflow.completedRerunAnalysis && workflow.rerunSupplier && (
                  <div ref={latestOutputRef}>
                    <AnalysisCard
                      analysis={workflow.completedRerunAnalysis}
                      supplier={workflow.rerunSupplier}
                      showSupplier
                      onRunAgain={workflow.actions.showRunAgainUpload}
                      onViewResult={handleViewResult}
                      viewResultPrimary
                      isLatestOutput
                      highlighted
                      analysisParameters={workflow.completedRerunAnalysisParameters}
                    />
                  </div>
                )}
                {workflow.showPostAnalysisActions && (
                  <PostAnalysisNextActions
                    completedMilestoneIds={workflow.completedMilestoneIds}
                    initiativeCompleted={workflow.initiativeCompleted}
                    onStartAnotherInitiative={handleStartAnotherInitiative}
                    onMilestoneComplete={workflow.actions.markMilestoneComplete}
                    onCompleteInitiative={workflow.actions.completeInitiative}
                  />
                )}
                <div className="h-[304px]" aria-hidden="true" />
              </div>
            )}

            {!outputPanelResultsVisible && (
              <div className="lg:hidden">
                <SupplierOutputsPanel
                  initiative={workflow.supplierOutputInitiative}
                  outputState={workflow.supplierOutputPanelState}
                  onRunAgain={workflow.actions.showRunAgainUpload}
                  onDownload={workflow.actions.handleDownload}
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

