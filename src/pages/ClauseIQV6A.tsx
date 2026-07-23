import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { V6Shell } from "@/components/clauseiq-v6a/V6Shell";
import { V6InitiativeLinkButton } from "@/components/clauseiq-v6a/V6InitiativeLinkButton";
import { InitiativeModal } from "@/components/clauseiq-v6a/InitiativeModal";
import {
  CIQ_INITIATIVES,
  type CiqInitiative,
} from "@/lib/clauseiq-v6-data";
import { cn } from "@/lib/utils";
import { V4_DELIVERY_INITIATIVE_ID } from "@/data/mock-delivery-engine-v6";
import { SupplierOutputsPanel } from "@/components/clauseiq-v6a/supplier-results";
import type { ResultsLayout, SupplierOutputSelection } from "@/components/clauseiq-v6a/supplier-results/types";
import {
  ClauseIqJourneyContent,
  type ClauseIqJourneyRefs,
} from "@/components/clauseiq-v6a/ClauseIqJourney";
import {
  LATEST_V6_RESULTS_ROUTE,
  createDefaultParameterSelection,
  useClauseIqWorkflow,
  type ClauseIqWorkflowStep,
} from "@/components/clauseiq-v6a/ClauseIqWorkflow";
import {
  getSupplierOutputComparisonContext,
  mockInitiative,
} from "@/data/mock-clauseiq-v6";

interface ClauseIQV6AProps {
  forceResults?: boolean;
  resultsLayout?: ResultsLayout;
}

export default function ClauseIQV6A(props: ClauseIQV6AProps) {
  const [searchParams] = useSearchParams();
  // The result scenario selects a deterministic mock journey. Remount the
  // journey when it changes so its workflow seed changes with the selector,
  // rather than retaining the previous scenario's in-memory output state.
  const scenarioKey = searchParams.get("resultScenario") === "history" ? "history" : "empty";

  return <ClauseIQV6AContent key={scenarioKey} {...props} />;
}

function ClauseIQV6AContent({ forceResults = false, resultsLayout = "output-panel" }: ClauseIQV6AProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resultsFromRoute = forceResults || searchParams.get("view") === "results";
  const rerunUploadFromRoute = resultsFromRoute && searchParams.get("rerun") === "upload";
  const resultScenario = searchParams.get("resultScenario") === "history" ? "history" : "empty";
  const showComparisonStatus = resultScenario === "history";
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
    // Keep the completed analysis in this workflow instance so supplier
    // fingerprint resolution can determine its output history before results render.
  }, []);

  const handleRunAgain = useCallback(() => {
    if (!forceResults) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("rerun", "upload");
      navigate(`/clauseiq-v6a/output-panel?${nextParams.toString()}`);
    }
    scrollRerunWorkflowIntoView(120);
  }, [forceResults, navigate, scrollRerunWorkflowIntoView, searchParams]);

  const workflow = useClauseIqWorkflow({
    initialStep: resultsFromRoute ? "results" : "welcome",
    initialInitiative: resultsFromRoute ? defaultCompletedInitiative : null,
    initialSelectedParameter: resultsFromRoute ? createDefaultParameterSelection() : null,
    initialRerunUploadVisible: rerunUploadFromRoute,
    // Seed a representative first-run result only when this is the standalone
    // results route. A newly completed analysis must start with an empty
    // history, otherwise the seeded result and the new result are both shown.
    useFirstRunResults:
      resultsFromRoute &&
      resultsLayout === "output-panel" &&
      resultScenario === "empty",
    useEmptyResults: !resultsFromRoute,
    onProcessingComplete: handleProcessingComplete,
    onRunAgain: handleRunAgain,
  });

  const { step } = workflow;
  const resultsVisible = workflow.resultsVisible;
  const outputPanelResultsVisible = resultsVisible && resultsLayout === "output-panel";
  const journeyRefs: ClauseIqJourneyRefs = {
    latestOutput: latestOutputRef,
    parameters: parametersRef,
    processing: processingRef,
    rerunUpload: rerunUploadRef,
    result: resultRef,
    select: selectRef,
    upload: uploadRef,
  };

  useEffect(() => {
    if (!forceResults && searchParams.get("view") === "results" && !rerunUploadFromRoute) {
      navigate("/clauseiq-v6a/output-panel", { replace: true });
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

  // Several conversation cards are revealed without changing the main workflow
  // step (for example, supplier context, rerun parameters, and fingerprint
  // confirmation). Keep these state transitions in the same continuous flow.
  useEffect(() => {
    const scrollTo = (
      ref: RefObject<HTMLDivElement>,
      block: ScrollLogicalPosition = "start",
    ) => {
      window.setTimeout(() => {
        ref.current?.scrollIntoView({ behavior: "smooth", block });
      }, 100);
    };

    if (workflow.awaitingSupplierFingerprintResolution) {
      scrollTo(step === "processing" ? processingRef : resultRef);
      return;
    }

    if (!resultsVisible) {
      if (step === "parameters" && workflow.initialSupplierName) {
        scrollTo(parametersRef);
      }
      return;
    }

    if (
      workflow.rerunUploadVisible ||
      workflow.rerunProcessing ||
      workflow.rerunNewSupplierEntryOpen ||
      workflow.rerunSupplierContext ||
      workflow.rerunSelectedParameter
    ) {
      scrollTo(rerunUploadRef);
      return;
    }

    if (workflow.latestOutputAnalysisId) {
      scrollLatestOutputIntoView(100);
    }
  }, [
    resultsVisible,
    scrollLatestOutputIntoView,
    step,
    workflow.awaitingSupplierFingerprintResolution,
    workflow.initialSupplierName,
    workflow.latestOutputAnalysisId,
    workflow.rerunNewSupplierEntryOpen,
    workflow.rerunProcessing,
    workflow.rerunSelectedParameter,
    workflow.rerunSupplierContext,
    workflow.rerunUploadVisible,
  ]);

  // ---- handlers ----
  const handleSelect = (i: CiqInitiative) => {
    workflow.actions.selectInitiative(i);
    setModalOpen(false);
  };

  const handleStartAnotherInitiative = () => {
    workflow.actions.startAnotherInitiative(true);
    setModalOpen(false);
    navigate("/clauseiq-v6a");
  };

  const handleViewResult = (selection?: SupplierOutputSelection) => {
    const selectedOutput = selection && "analysis" in selection ? selection : undefined;
    const analysisId = selectedOutput?.analysis.id ?? "a-001";
    const previousAnalysisId = selectedOutput?.previousAnalysis?.id;
    const context = getSupplierOutputComparisonContext(
      workflow.resultsInitiative,
      analysisId,
      previousAnalysisId,
    );

    if (!context) {
      const fallbackParams = new URLSearchParams(
        LATEST_V6_RESULTS_ROUTE.split("?")[1] ?? "",
      );
      fallbackParams.set("dashboardView", "initial-analysis");
      navigate(`/initiatives-v6a?${fallbackParams.toString()}`);
      return;
    }

    const isFirstRunOutput = selectedOutput
      ? !context.previousAnalysis
      : resultScenario === "empty";

    const params = new URLSearchParams({
      view: "results",
      initiativeId: "init-1",
      supplierId: "sup-1",
      contractId: "ct-1",
      source: "clauseiq",
      catSort: "risk",
      mode: "comparison",
      tab: "changes",
      design: "design-option-2",
      analysisId: context.analysis.id,
      outputSupplierId: context.supplier.id,
      to: isFirstRunOutput ? "v1" : context.selectedVersionLabel,
    });

    if (!isFirstRunOutput && context.previousAnalysis && context.previousVersionLabel) {
      params.set("scenario", "negotiated-reanalysis");
      params.set("resultMode", "outcome");
      params.set("previousAnalysisId", context.previousAnalysis.id);
      params.set("from", context.previousVersionLabel);
      params.set("dashboardView", "comparison");
    } else {
      params.set("scenario", "first-analysis");
      params.set("dashboardView", "initial-analysis");
    }

    navigate(`/initiatives-v6a?${params.toString()}`);
  };

  return (
    <V6Shell
      title="ClauseIQ"
      subtitle="AI tool for detailed contract analyses"
      headerRight={
        resultsVisible ? (
          <V6InitiativeLinkButton
            onClick={() => {
              navigate(`/delivery-engine-v6/${V4_DELIVERY_INITIATIVE_ID}?return=${encodeURIComponent(currentRoute)}`);
            }}
          />
        ) : null
      }
      rightPanel={
        <div className="h-full p-6">
          <SupplierOutputsPanel
            initiative={workflow.supplierOutputInitiative}
            outputState={workflow.supplierOutputPanelState}
            onRunAgain={workflow.actions.showRunAgainUpload}
            onDownload={workflow.actions.handleDownload}
            onViewResult={handleViewResult}
            showComparisonStatus={showComparisonStatus}
            highlightSupplierId={workflow.latestOutputSupplierId}
            highlightAnalysisId={workflow.latestOutputAnalysisId}
          />
        </div>
      }
      rightPanelClassName={
        outputPanelResultsVisible ? "w-[448px]" : undefined
      }
    >
      <div
        className={cn(
          "mx-auto max-w-[640px] space-y-4 px-6 pt-8 pb-8 transition-[max-width] duration-300",
          "max-w-[640px]",
        )}
      >
        <ClauseIqJourneyContent
          includeResultBottomSpacer
          initiativeMode="selectable"
          mode="stacked"
          onOpenInitiativeModal={() => setModalOpen(true)}
          onStartAnotherInitiative={handleStartAnotherInitiative}
          onViewResult={handleViewResult}
          refs={journeyRefs}
          resultsLayout={resultsLayout}
          showComparisonStatus={showComparisonStatus}
          showMobileSupplierPanel={
            !outputPanelResultsVisible &&
            !workflow.awaitingSupplierFingerprintResolution
          }
          workflow={workflow}
        />
      </div>

      <InitiativeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={handleSelect}
      />
    </V6Shell>
  );
}
