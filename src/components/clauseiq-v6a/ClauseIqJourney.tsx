import { type CSSProperties, type FormEvent, type ReactNode, type RefObject, useState } from "react";
import {
  Check,
  FileText,
  Loader2,
  Search,
} from "@/components/clauseiq-v6a/v6aIcons";
import { Card, LinkText } from "@orbit";

import { Button } from "@/components/clauseiq-v6a/orbit-ui/button";
import { Input } from "@/components/clauseiq-v6a/orbit-ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/clauseiq-v6a/orbit-ui/select";
import { StateCard, type CardState } from "@/components/clauseiq-v6a/StateCard";
import {
  AnalysisParameterCards,
  ClauseIqDropzone,
  ClauseIqOverviewCard,
  NewAnalysisDivider,
  PlaybookDisclaimer,
  PostAnalysisNextActions,
  SelectedSummaryRow,
  benchmarkReadout,
  hasCompleteAnalysisParameters,
  type ClauseIqWorkflow,
  type ClauseIqWorkflowStep,
} from "@/components/clauseiq-v6a/ClauseIqWorkflow";
import {
  AnalysisCard,
  ResultsContent,
  SupplierOutputsPanel,
} from "@/components/clauseiq-v6a/supplier-results";
import type {
  ResultsLayout,
  SupplierOutputSelection,
} from "@/components/clauseiq-v6a/supplier-results/types";

export type ClauseIqJourneyMode = "stacked" | "single-step";
export type ClauseIqInitiativeMode = "selectable" | "prebound";

export interface ClauseIqJourneyRefs {
  latestOutput?: RefObject<HTMLDivElement>;
  parameters?: RefObject<HTMLDivElement>;
  processing?: RefObject<HTMLDivElement>;
  rerunUpload?: RefObject<HTMLDivElement>;
  result?: RefObject<HTMLDivElement>;
  select?: RefObject<HTMLDivElement>;
  upload?: RefObject<HTMLDivElement>;
}

export interface ClauseIqFooterState {
  disabled: boolean;
  label: string;
  onClick: () => void;
}

export const CLAUSEIQ_JOURNEY_STEPS: Array<{
  key: ClauseIqWorkflowStep;
  label: string;
}> = [
  { key: "welcome", label: "Overview" },
  { key: "parameters", label: "Configure" },
  { key: "upload", label: "Upload" },
  { key: "processing", label: "Analysing" },
  { key: "results", label: "Results" },
];

const STACKED_WORKFLOW_STEPS: ClauseIqWorkflowStep[] = [
  "welcome",
  "select",
  "parameters",
  "upload",
  "processing",
  "results",
];

export function getClauseIqJourneyStepIndex(step: ClauseIqWorkflowStep) {
  if (step === "select") return 0;
  return CLAUSEIQ_JOURNEY_STEPS.findIndex((item) => item.key === step);
}

export function getClauseIqFooterState(
  workflow: ClauseIqWorkflow,
  {
    initiativeMode,
    onViewResult,
  }: {
    initiativeMode: ClauseIqInitiativeMode;
    onViewResult: () => void;
  },
): ClauseIqFooterState {
  if (workflow.step === "welcome") {
    return {
      disabled: false,
      label: "Start",
      onClick: () =>
        workflow.actions.setStep(
          initiativeMode === "prebound" ? "parameters" : "select",
        ),
    };
  }

  if (workflow.step === "select") {
    return {
      disabled: initiativeMode === "selectable" && !workflow.initiative,
      label: "Continue",
      onClick: workflow.actions.startParameters,
    };
  }

  if (workflow.step === "parameters") {
    return {
      disabled: !hasCompleteAnalysisParameters(workflow.selectedParameter),
      label: "Continue",
      onClick: workflow.actions.setUploadStep,
    };
  }

  if (workflow.step === "upload") {
    return {
      disabled: !workflow.file,
      label: "Run Analysis",
      onClick: () => workflow.actions.startProcessing(),
    };
  }

  if (workflow.step === "processing") {
    return { disabled: true, label: "Analysing", onClick: () => undefined };
  }

  return { disabled: false, label: "View Full Result", onClick: onViewResult };
}

function InitiativeStep({
  initiativeMode,
  label,
  onOpenInitiativeModal,
  resultsVisible,
  workflow,
}: {
  initiativeMode: ClauseIqInitiativeMode;
  label?: string;
  onOpenInitiativeModal?: () => void;
  resultsVisible: boolean;
  workflow: ClauseIqWorkflow;
}) {
  const selectedLabel = label ?? workflow.initiative?.name;

  if (initiativeMode === "selectable" && !workflow.initiative) {
    return (
      <Card type="Static" state="Feature" padding="Base" indicator={false}>
        <h2 className="v6-orbit-heading-5 mb-orbit-xs">Select Initiative</h2>
        <p className="text-orbit-sm text-orbit-fg-secondary mb-orbit-base">
          Choose the initiative to analyse the contract against.
        </p>
        <Button className="w-full" onClick={onOpenInitiativeModal}>
          <Search className="h-4 w-4 mr-orbit-s" />
          Search Initiatives
        </Button>
      </Card>
    );
  }

  return (
    <StateCard
      state="default"
      className={resultsVisible ? "mx-auto w-full max-w-[640px]" : undefined}
    >
      <h2 className="v6-orbit-heading-5 mb-orbit-base">
        {initiativeMode === "prebound"
          ? "Current Initiative"
          : "Initiative Selected"}
      </h2>
      <SelectedSummaryRow
        label={selectedLabel ?? "Initiative selected"}
        disabled={initiativeMode === "prebound" || workflow.initiativeLocked}
        actionLabel="Edit"
        onAction={onOpenInitiativeModal ?? (() => undefined)}
      />
    </StateCard>
  );
}

function UploadStep({
  renderSelectedFileRow,
  workflow,
}: {
  renderSelectedFileRow?: (file: File, onRemove: () => void) => ReactNode;
  workflow: ClauseIqWorkflow;
}) {
  return (
    <Card type="Static" state="Feature" padding="Base" indicator={false} className="overflow-visible">
      <h2 className="v6-orbit-heading-5 mb-orbit-base">Upload Contract</h2>
      <PlaybookDisclaimer
        variant="callout"
        parameter={workflow.selectedParameter}
      />
      <ClauseIqDropzone onFile={workflow.actions.validateAndSetFile} />
      {workflow.file && renderSelectedFileRow ? (
        <div className="mt-orbit-base">
          {renderSelectedFileRow(workflow.file, workflow.actions.clearFile)}
        </div>
      ) : null}
    </Card>
  );
}

function ProcessingStep({
  copy = "Finding clauses in your contract...",
  heading = "Analysing Your Contract",
  completed = false,
  parameter,
  workflow,
}: {
  copy?: string;
  heading?: string;
  completed?: boolean;
  parameter: ClauseIqWorkflow["selectedParameter"];
  workflow: ClauseIqWorkflow;
}) {
  return (
    <Card type="Static" state="Feature" padding="Base" indicator={false}>
      <h2 className="v6-orbit-heading-5 mb-orbit-base">{completed ? "Analysis complete" : heading}</h2>
      <div className="flex items-center justify-between border border-orbit-border rounded-orbit-lg px-orbit-base py-orbit-s mb-orbit-base">
        <div className="flex items-center gap-orbit-s min-w-0">
          <FileText className="h-4 w-4 text-orbit-fg-secondary shrink-0" />
          <span className="text-orbit-sm truncate">
            {workflow.file?.name ?? "Contract.pdf"}
          </span>
        </div>
        <span className="text-orbit-xs v6-orbit-weight-medium text-orbit-success inline-flex items-center gap-orbit-xs">
          <Check className="h-3.5 w-3.5" /> {completed ? "Completed" : "Uploaded"}
        </span>
      </div>
      <div className="flex items-center gap-orbit-base py-orbit-s">
        {completed ? <Check className="h-5 w-5 text-orbit-success" /> : <Loader2 className="h-5 w-5 animate-spin text-orbit-primary" />}
        <span className="text-orbit-sm v6-orbit-weight-medium">{completed ? "Analysis complete" : copy}</span>
      </div>
      <PlaybookDisclaimer variant="inline" parameter={parameter} />
      <p className="text-orbit-xs text-orbit-fg-secondary mt-orbit-s">
        {completed
          ? "ClauseIQ is checking the supplier identity before revealing the output."
          : heading === "Analysing New Contract"
          ? "The existing analysis history remains available above while this runs."
          : "This may take a moment. We will notify you when the analysis is completed."}
      </p>
    </Card>
  );
}

function ResultsStep({
  includeResultBottomSpacer,
  latestOutputRef,
  onStartAnotherInitiative,
  onViewResult,
  rerunUploadRef,
  resultsLayout,
  showComparisonStatus = false,
  workflow,
}: {
  includeResultBottomSpacer?: boolean;
  latestOutputRef?: RefObject<HTMLDivElement>;
  onStartAnotherInitiative?: () => void;
  onViewResult: (selection?: SupplierOutputSelection) => void;
  rerunUploadRef?: RefObject<HTMLDivElement>;
  resultsLayout: ResultsLayout;
  showComparisonStatus?: boolean;
  workflow: ClauseIqWorkflow;
}) {
  const awaitingSupplierFingerprintResolution = workflow.awaitingSupplierFingerprintResolution;
  const rerunJourneyVisible =
    workflow.rerunUploadVisible || workflow.rerunProcessing;
  const supplierContextSelected = Boolean(workflow.rerunSupplierContext);
  const rerunParameter = workflow.rerunProcessing
    ? (workflow.rerunSelectedParameter ?? workflow.selectedParameter)
    : workflow.rerunSelectedParameter;
  const rerunParametersComplete = hasCompleteAnalysisParameters(rerunParameter);

  if (
    awaitingSupplierFingerprintResolution &&
    workflow.supplierFingerprintResolution?.journey === "initial"
  ) {
    return (
      <div className="space-y-orbit-base">
        {workflow.supplierFingerprintResolution?.journey === "rerun" ? (
          <ProcessingStep
            copy="Finding clauses in your new contract..."
            heading="Analysing New Contract"
            completed
            parameter={rerunParameter}
            workflow={workflow}
          />
        ) : null}
        <SupplierFingerprintConversation workflow={workflow} journey="rerun" />
      </div>
    );
  }

  return (
    <div className="space-y-orbit-base">
      <div ref={workflow.completedRerunAnalysis ? undefined : latestOutputRef}>
        <ResultsContent
          initiative={workflow.resultsInitiative}
          layout={resultsLayout}
          onRunAgain={workflow.actions.showRunAgainUpload}
          onDownload={
            resultsLayout === "output-panel"
              ? undefined
              : workflow.actions.handleDownload
          }
          onViewResult={onViewResult}
          viewResultPrimary={!workflow.newAnalysisSectionVisible}
          highlightLatestOutput={!workflow.newAnalysisSectionVisible}
          analysisParameters={workflow.selectedAnalysisParameters}
          showComparisonStatus={showComparisonStatus}
          highlightSupplierId={workflow.latestOutputSupplierId}
          highlightAnalysisId={workflow.latestOutputAnalysisId}
        />
      </div>
      {workflow.newAnalysisSectionVisible && <NewAnalysisDivider />}
      {rerunJourneyVisible && (
        <div ref={rerunUploadRef} className="space-y-orbit-base">
          {!supplierContextSelected && !workflow.rerunProcessing ? (
            <RerunSupplierContextStep workflow={workflow} />
          ) : (
            <>
              {workflow.rerunSupplierContext && !workflow.rerunProcessing && (
                <Card type="Static" state="Default" padding="Base" indicator={false}>
                  <h2 className="v6-orbit-heading-5">Select supplier</h2>
                  <p className="mt-orbit-s text-orbit-sm text-orbit-fg-secondary">
                    Search the supplier history that should provide context for this
                    analysis.
                  </p>
                  <div className="mt-orbit-base">
                    <SelectedSummaryRow
                      label={`Supplier · ${workflow.rerunSupplierContext.name}`}
                      disabled={false}
                      actionLabel="Change supplier"
                      onAction={workflow.actions.clearRerunSupplierContext}
                    />
                  </div>
                </Card>
              )}
              <AnalysisParameterCards
                selectedParameter={rerunParameter}
                cardState={
                  workflow.rerunProcessing || rerunParametersComplete
                    ? "default"
                    : "active"
                }
                locked={workflow.rerunProcessing}
                onPlaybookChoiceChange={
                  workflow.actions.handleRerunPlaybookChoiceChange
                }
                onBenchmarkConfirm={
                  workflow.actions.handleRerunBenchmarkConfirm
                }
                onBenchmarkEdit={workflow.actions.handleRerunBenchmarkEdit}
                onBenchmarkSkip={workflow.actions.handleRerunBenchmarkSkip}
                onBasisSelect={workflow.actions.handleRerunBasisSelect}
                onCategorySelect={workflow.actions.handleRerunCategorySelect}
                onBasisEdit={workflow.actions.handleRerunBasisEdit}
                onCategoryEdit={workflow.actions.handleRerunCategoryEdit}
              />

              {workflow.rerunUploadVisible && rerunParametersComplete && (
                <Card
                  type="Static"
                  state="Feature"
                  padding="Base"
                  indicator={false}
                >
                  <h2 className="v6-orbit-heading-5 mb-orbit-base">
                    Upload Contract
                  </h2>
                  <PlaybookDisclaimer
                    variant="callout"
                    parameter={rerunParameter}
                  />
                  <ClauseIqDropzone
                    onFile={workflow.actions.validateAndSetFile}
                  />
                </Card>
              )}
            </>
          )}
        </div>
      )}
      {workflow.rerunProcessing && (
        <div className="space-y-orbit-base">
          <ProcessingStep
            copy="Finding clauses in your new contract..."
            heading="Analysing New Contract"
            parameter={rerunParameter}
            workflow={workflow}
          />
        </div>
      )}
      {workflow.supplierFingerprintResolution?.journey === "rerun" && (
        <SupplierFingerprintConversation workflow={workflow} journey="rerun" />
      )}
      {workflow.completedRerunAnalysis && workflow.completedRerunSupplier && (
        <div ref={latestOutputRef}>
          <AnalysisCard
            analysis={workflow.completedRerunAnalysis}
            supplier={workflow.completedRerunSupplier}
            showSupplier
            onRunAgain={workflow.actions.showRunAgainUpload}
            onViewResult={() => {
              const chronological = [
                ...workflow.completedRerunSupplier.analyses,
              ].sort(
                (left, right) =>
                  Date.parse(left.analysedAt) - Date.parse(right.analysedAt),
              );
              const currentIndex = chronological.findIndex(
                (analysis) =>
                  analysis.id === workflow.completedRerunAnalysis?.id,
              );
              onViewResult({
                supplier: workflow.completedRerunSupplier,
                analysis: workflow.completedRerunAnalysis,
                previousAnalysis:
                  currentIndex > 0
                    ? chronological[currentIndex - 1]
                    : undefined,
              });
            }}
            viewResultPrimary
            isLatestOutput
            highlighted
            analysisParameters={workflow.completedRerunAnalysisParameters}
            showComparisonStatus={showComparisonStatus}
          />
        </div>
      )}
      {workflow.showPostAnalysisActions && (
        <PostAnalysisNextActions
          completedMilestoneIds={workflow.completedMilestoneIds}
          initiativeCompleted={workflow.initiativeCompleted}
          onStartAnotherInitiative={
            onStartAnotherInitiative ??
            (() => workflow.actions.startAnotherInitiative(false))
          }
          onMilestoneComplete={workflow.actions.markMilestoneComplete}
          onCompleteInitiative={workflow.actions.completeInitiative}
        />
      )}
      {includeResultBottomSpacer ? (
        <div className="h-[304px]" aria-hidden="true" />
      ) : null}
    </div>
  );
}

export function SupplierFingerprintConversation({
  workflow,
  journey,
}: {
  workflow: ClauseIqWorkflow;
  journey: "initial" | "rerun";
}) {
  const resolution = workflow.supplierFingerprintResolution;
  if (!resolution || resolution.journey !== journey) return null;

  return (
    <Card type="Static" state="Feature" padding="Base" indicator={false}>
      <h2 className="v6-orbit-heading-5">Found A Supplier Match</h2>
      <p className="mt-orbit-s text-orbit-sm text-orbit-fg-secondary">
        We found a likely supplier match. Choose the supplier that should own this completed analysis.
      </p>
      <div className="mt-orbit-base flex flex-col items-stretch gap-orbit-s">
        <Button className="w-full" type="button" variant="secondary" onClick={() => workflow.actions.resolveSupplierFingerprint(false)}>
          {`Keep “${resolution.enteredName}”`}
        </Button>
        <Button className="w-full" type="button" onClick={() => workflow.actions.resolveSupplierFingerprint(true)}>
          {`Use ${resolution.candidate.name}`}
        </Button>
      </div>
    </Card>
  );
}

function RerunSupplierContextStep({
  workflow,
}: {
  workflow: ClauseIqWorkflow;
}) {
  if (workflow.rerunNewSupplierEntryOpen) {
    return (
      <SupplierNameForm
        heading="Add a new supplier"
        description="Enter the supplier name before choosing the analysis parameters."
        submitLabel="Continue"
        onCancel={workflow.actions.cancelNewRerunSupplierContext}
        onSubmit={workflow.actions.saveNewRerunSupplierContext}
      />
    );
  }

  return (
    <Card
      type="Static"
      state="Feature"
      padding="Base"
      indicator={false}
      style={{ overflow: "visible", position: "relative", zIndex: 10 }}
    >
      <div>
        <h2 className="v6-orbit-heading-5">Select supplier</h2>
        <p className="mt-orbit-s text-orbit-sm text-orbit-fg-secondary">
          Search the supplier history that should provide context for this
          analysis.
        </p>
      </div>

      <div className="mt-orbit-base">
        <Select onValueChange={workflow.actions.selectRerunSupplier}>
          <SelectTrigger className="w-full clauseiq-v6-select-left" aria-label="Supplier context">
            <SelectValue placeholder="Select a supplier" />
          </SelectTrigger>
          <SelectContent>
            {workflow.resultsInitiative.suppliers.map((supplier) => (
              <SelectItem key={supplier.id} value={supplier.id}>
                {supplier.name} · {supplier.analyses.length} existing output
                {supplier.analyses.length === 1 ? "" : "s"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-orbit-base flex flex-wrap items-center gap-x-orbit-xs gap-y-orbit-xxs text-orbit-sm text-orbit-fg-secondary">
        <span>Can’t find your supplier?</span>
        <span style={{ "--orbit-color-btn-tertiary-fg": "var(--orbit-color-btn-primary-bg)" } as CSSProperties}>
          <LinkText
            label="Add as new supplier"
            href="#"
            onClick={(event) => {
              event.preventDefault();
              workflow.actions.beginNewRerunSupplierContext();
            }}
          />
        </span>
      </div>
    </Card>
  );
}

function SupplierNameForm({
  heading,
  description,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  heading: string;
  description: string;
  submitLabel: string;
  onCancel?: () => void;
  onSubmit: (name: string) => void;
}) {
  const [supplierName, setSupplierName] = useState("");
  const [showError, setShowError] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = supplierName.trim();
    if (!trimmedName) {
      setShowError(true);
      return;
    }
    onSubmit(trimmedName);
  };

  return (
    <Card type="Static" state="Feature" padding="Base" indicator={false}>
      <h2 className="v6-orbit-heading-5">{heading}</h2>
      <p className="mt-orbit-s text-orbit-sm text-orbit-fg-secondary">
        {description}
      </p>
      <form className="mt-orbit-base space-y-orbit-s" onSubmit={handleSubmit}>
        <Input
          id="clauseiq-supplier-name"
          value={supplierName}
          onChange={(event) => {
            setSupplierName(event.target.value);
            setShowError(false);
          }}
          placeholder="Enter supplier name"
          aria-describedby={showError ? "clauseiq-supplier-name-error" : undefined}
        />
        {showError && (
          <p id="clauseiq-supplier-name-error" role="alert" className="text-orbit-sm text-orbit-danger-fg">
            Enter a supplier name to continue.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-orbit-s">
          {onCancel && (
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" className="ml-auto">
            {submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function InitialSupplierContextStep({ workflow }: { workflow: ClauseIqWorkflow }) {
  if (!workflow.initialSupplierName) {
    return (
      <SupplierNameForm
        heading="Enter supplier name"
        description="Enter the supplier name before selecting the analysis parameters."
        submitLabel="Continue"
        onCancel={workflow.actions.startSelect}
        onSubmit={workflow.actions.saveInitialSupplierName}
      />
    );
  }

  return (
    <Card type="Static" state="Default" padding="Base" indicator={false}>
      <h2 className="v6-orbit-heading-5">Supplier</h2>
      <div className="mt-orbit-base">
        <SelectedSummaryRow
          label={`Supplier · ${workflow.initialSupplierName}`}
          disabled={false}
          actionLabel="Change supplier"
          onAction={workflow.actions.clearInitialSupplierName}
        />
      </div>
    </Card>
  );
}

function InitialAnalysisParameters({
  workflow,
  cardState,
}: {
  workflow: ClauseIqWorkflow;
  cardState?: CardState;
}) {
  if (!workflow.initialSupplierName) {
    return <InitialSupplierContextStep workflow={workflow} />;
  }

  return (
    <div className="space-y-orbit-base">
      <InitialSupplierContextStep workflow={workflow} />
      <AnalysisParameterCards
        selectedParameter={workflow.selectedParameter}
        cardState={
          cardState ??
          (hasCompleteAnalysisParameters(workflow.selectedParameter)
            ? "default"
            : "active")
        }
        locked={workflow.parameterLocked}
        onPlaybookChoiceChange={workflow.actions.handlePlaybookChoiceChange}
        onBenchmarkConfirm={workflow.actions.handleBenchmarkConfirm}
        onBenchmarkEdit={workflow.actions.handleBenchmarkEdit}
        onBenchmarkSkip={workflow.actions.handleBenchmarkSkip}
        onBasisSelect={workflow.actions.handleBasisSelect}
        onCategorySelect={workflow.actions.handleCategorySelect}
        onBasisEdit={workflow.actions.handleBasisEdit}
        onCategoryEdit={workflow.actions.handleCategoryEdit}
      />
    </div>
  );
}

function SingleStepJourneyContent({
  currentInitiativeCopy,
  initiativeLabel,
  initiativeMode,
  onOpenInitiativeModal,
  onStartAnotherInitiative,
  onViewResult,
  renderSelectedFileRow,
  resultsLayout,
  showComparisonStatus,
  workflow,
}: ClauseIqJourneyContentProps) {
  if (workflow.step === "welcome") {
    return (
      <div className="space-y-orbit-base">
        <ClauseIqOverviewCard
          step={workflow.step}
          currentInitiativeCopy={currentInitiativeCopy}
        />
        <InitiativeStep
          initiativeMode={initiativeMode}
          label={initiativeLabel}
          onOpenInitiativeModal={onOpenInitiativeModal}
          resultsVisible={workflow.resultsVisible}
          workflow={workflow}
        />
      </div>
    );
  }

  if (workflow.step === "select") {
    return (
      <InitiativeStep
        initiativeMode={initiativeMode}
        label={initiativeLabel}
        onOpenInitiativeModal={onOpenInitiativeModal}
        resultsVisible={workflow.resultsVisible}
        workflow={workflow}
      />
    );
  }

  if (workflow.step === "parameters") {
    return (
      <InitialAnalysisParameters workflow={workflow} />
    );
  }

  if (workflow.step === "upload") {
    return (
      <UploadStep
        renderSelectedFileRow={renderSelectedFileRow}
        workflow={workflow}
      />
    );
  }

  if (workflow.step === "processing") {
    return (
      <div className="space-y-orbit-base">
        <ProcessingStep
          completed={workflow.supplierFingerprintResolution?.journey === "initial"}
          parameter={workflow.selectedParameter}
          workflow={workflow}
        />
        <SupplierFingerprintConversation workflow={workflow} journey="initial" />
      </div>
    );
  }

  return (
    <ResultsStep
      onStartAnotherInitiative={onStartAnotherInitiative}
      onViewResult={onViewResult}
      resultsLayout={resultsLayout}
      showComparisonStatus={showComparisonStatus}
      workflow={workflow}
    />
  );
}

function StackedJourneyContent({
  currentInitiativeCopy,
  initiativeLabel,
  initiativeMode,
  onOpenInitiativeModal,
  onStartAnotherInitiative,
  onViewResult,
  refs,
  resultsLayout,
  showMobileSupplierPanel,
  showComparisonStatus,
  includeResultBottomSpacer,
  workflow,
}: ClauseIqJourneyContentProps) {
  const stepIndex = STACKED_WORKFLOW_STEPS.indexOf(workflow.step);
  const selectVisible = stepIndex >= 1;
  const parametersVisible = stepIndex >= 2;
  const uploadVisible = stepIndex >= 3;
  const selectState: CardState =
    workflow.step === "select" ? "active" : "default";
  const parametersState: CardState =
    workflow.step === "parameters" ? "active" : "default";

  return (
    <>
      <ClauseIqOverviewCard
        step={workflow.step}
        onStart={() =>
          workflow.actions.setStep(
            initiativeMode === "prebound" ? "parameters" : "select",
          )
        }
        currentInitiativeCopy={currentInitiativeCopy}
      />

      {selectVisible && (
        <div ref={refs?.select}>
          <InitiativeStep
            initiativeMode={initiativeMode}
            label={initiativeLabel}
            onOpenInitiativeModal={onOpenInitiativeModal}
            resultsVisible={workflow.resultsVisible}
            workflow={workflow}
          />
        </div>
      )}

      {parametersVisible && !workflow.resultsVisible && (
        <div ref={refs?.parameters} className="space-y-orbit-base">
          <InitialAnalysisParameters workflow={workflow} cardState={parametersState} />
        </div>
      )}

      {uploadVisible &&
        hasCompleteAnalysisParameters(workflow.selectedParameter) &&
        workflow.step !== "processing" &&
        workflow.step !== "results" && (
          <div ref={refs?.upload}>
            <UploadStep workflow={workflow} />
          </div>
        )}

      {workflow.processingVisible && workflow.step === "processing" && (
        <div ref={refs?.processing} className="space-y-orbit-base">
          <ProcessingStep
            completed={workflow.supplierFingerprintResolution?.journey === "initial"}
            parameter={workflow.selectedParameter}
            workflow={workflow}
          />
          <SupplierFingerprintConversation workflow={workflow} journey="initial" />
        </div>
      )}

      {workflow.resultsVisible && (
        <div ref={refs?.result} className="space-y-orbit-base">
          <ResultsStep
            includeResultBottomSpacer={includeResultBottomSpacer}
            latestOutputRef={refs?.latestOutput}
            onStartAnotherInitiative={onStartAnotherInitiative}
            onViewResult={onViewResult}
            rerunUploadRef={refs?.rerunUpload}
            resultsLayout={resultsLayout}
            showComparisonStatus={showComparisonStatus}
            workflow={workflow}
          />
        </div>
      )}

      {showMobileSupplierPanel && !workflow.awaitingSupplierFingerprintResolution && (
        <div className="lg:hidden">
          <SupplierOutputsPanel
            initiative={workflow.supplierOutputInitiative}
            outputState={workflow.supplierOutputPanelState}
            onRunAgain={workflow.actions.showRunAgainUpload}
            onDownload={workflow.actions.handleDownload}
            onViewResult={onViewResult}
            showComparisonStatus={showComparisonStatus}
          />
        </div>
      )}
    </>
  );
}

interface ClauseIqJourneyContentProps {
  currentInitiativeCopy?: string;
  includeResultBottomSpacer?: boolean;
  initiativeLabel?: string;
  initiativeMode: ClauseIqInitiativeMode;
  mode: ClauseIqJourneyMode;
  onOpenInitiativeModal?: () => void;
  onStartAnotherInitiative?: () => void;
  onViewResult: (selection?: SupplierOutputSelection) => void;
  refs?: ClauseIqJourneyRefs;
  renderSelectedFileRow?: (file: File, onRemove: () => void) => ReactNode;
  resultsLayout?: ResultsLayout;
  showComparisonStatus?: boolean;
  showMobileSupplierPanel?: boolean;
  workflow: ClauseIqWorkflow;
}

export function ClauseIqJourneyContent({
  resultsLayout = "accordion",
  ...props
}: ClauseIqJourneyContentProps) {
  if (props.mode === "single-step") {
    return (
      <SingleStepJourneyContent resultsLayout={resultsLayout} {...props} />
    );
  }

  return <StackedJourneyContent resultsLayout={resultsLayout} {...props} />;
}

export function ClauseIqContextPanel({
  assistClassName,
  className,
  contextDescription = "ClauseIQ is bound to this initiative, so setup can stay focused on contract details.",
  contextLabel,
  onViewResult,
  workflow,
}: {
  assistClassName?: string;
  className?: string;
  contextDescription?: string;
  contextLabel: string;
  onViewResult: () => void;
  workflow: ClauseIqWorkflow;
}) {
  if (workflow.step === "processing" || workflow.resultsVisible) {
    return (
      <aside className={className}>
        <SupplierOutputsPanel
          initiative={workflow.supplierOutputInitiative}
          outputState={workflow.supplierOutputPanelState}
          onRunAgain={workflow.actions.showRunAgainUpload}
          onDownload={workflow.actions.handleDownload}
          onViewResult={onViewResult}
        />
      </aside>
    );
  }

  const parameterCopy =
    workflow.selectedParameter?.playbookChoice === "no"
      ? benchmarkReadout(workflow.selectedParameter)
      : workflow.selectedParameter?.basis
        ? `${workflow.selectedParameter.basis.kind}: ${workflow.selectedParameter.basis.label}`
        : "Choose how ClauseIQ should benchmark this contract.";

  return (
    <aside className={assistClassName ?? className}>
      <div>
        <div className="cp-assist-eyebrow">Current context</div>
        <h3>{contextLabel}</h3>
        <p>{contextDescription}</p>
      </div>
      <div className="cp-assist-summary">
        <div>
          <span>Analysis basis</span>
          <strong>{parameterCopy}</strong>
        </div>
        <div>
          <span>Contract file</span>
          <strong>{workflow.file?.name ?? "No file selected"}</strong>
        </div>
      </div>
      <div className="cp-assist-tip">
        Supplier outputs will appear here after the analysis starts.
      </div>
    </aside>
  );
}
