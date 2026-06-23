import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { V5Shell } from "@/components/clauseiq-v5/V5Shell";
import { V5InitiativeLinkButton } from "@/components/clauseiq-v5/V5InitiativeLinkButton";
import { InitiativeModal } from "@/components/clauseiq-v5/InitiativeModal";
import {
  CIQ_INITIATIVES,
  type CiqInitiative,
} from "@/lib/clauseiq-v4-data";
import { cn } from "@/lib/utils";
import { V4_DELIVERY_INITIATIVE_ID } from "@/data/mock-delivery-engine-v4";
import { SupplierOutputsPanel } from "@/components/clauseiq-v5/supplier-results";
import type { ResultsLayout } from "@/components/clauseiq-v5/supplier-results/types";
import {
  ClauseIqJourneyContent,
  type ClauseIqJourneyRefs,
} from "@/components/clauseiq-v5/ClauseIqJourney";
import {
  LATEST_V5_RESULTS_ROUTE,
  createDefaultParameterSelection,
  useClauseIqWorkflow,
  type ClauseIqWorkflowStep,
} from "@/components/clauseiq-v5/ClauseIqWorkflow";

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
      rightPanelClassName={outputPanelResultsVisible ? "w-[448px]" : undefined}
    >
      <div
        className={cn(
          "mx-auto px-orbit-base pt-orbit-xxl space-y-orbit-base transition-[max-width] duration-300",
          "pb-orbit-xxl",
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
          showMobileSupplierPanel={!outputPanelResultsVisible}
          workflow={workflow}
        />
      </div>

      <InitiativeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={handleSelect}
      />
    </V5Shell>
  );
}
