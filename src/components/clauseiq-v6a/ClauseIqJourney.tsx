import { type CSSProperties, type FormEvent, type ReactNode, type RefObject, useState } from "react";
import {
  Building2,
  Check,
  FileText,
  Loader2,
  Search,
} from "@/components/clauseiq-v6a/v6aIcons";
import { Button as OrbitButton, Card, FA, FaIcon, LinkText, ToggleCard } from "@orbit";

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
        label={selectedLabel ?? "Initiative Selected"}
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
  const supplierContextSelected =
    Boolean(workflow.rerunSupplierContext) || workflow.rerunWithoutSupplierContext;
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
        <SupplierFingerprintConversation workflow={workflow} journey="initial" />
      </div>
    );
  }

  return (
    <div className="space-y-orbit-base">
      <div ref={workflow.completedRerunAnalysis ? undefined : latestOutputRef}>
        <ResultsContent
          initiative={workflow.resultsInitiative}
          layout={resultsLayout}
          onRunAgain={(supplier) => workflow.actions.showRunAgainUpload(supplier?.id)}
          onDownload={
            resultsLayout === "output-panel"
              ? undefined
              : workflow.actions.handleDownload
          }
          onUploadToSupplier={(supplier) => workflow.actions.showRerunUploadForSupplier(supplier.id)}
          onViewResult={onViewResult}
          viewResultPrimary={!workflow.newAnalysisSectionVisible}
          highlightLatestOutput={!workflow.newAnalysisSectionVisible}
          analysisParameters={workflow.selectedAnalysisParameters}
          showComparisonStatus={showComparisonStatus}
          highlightSupplierId={workflow.latestOutputSupplierId}
          highlightAnalysisId={workflow.latestOutputAnalysisId}
          hiddenSupplierIds={workflow.unassignedSupplierIds}
          supplierIdentityContent={<SupplierDetectionResult workflow={workflow} />}
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
                      actionLabel="Change Supplier"
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
            onRunAgain={(supplier) => workflow.actions.showRunAgainUpload(supplier?.id)}
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
            supplierIdentityContent={
              <SupplierDetectionResult
                workflow={workflow}
                fallbackSupplier={workflow.completedRerunSupplier}
              />
            }
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

function SupplierDetectionResult({
  workflow,
  fallbackSupplier,
}: {
  workflow: ClauseIqWorkflow;
  fallbackSupplier?: { name: string };
}) {
  const context = workflow.supplierDetectionContext;
  if (!context) {
    return fallbackSupplier ? (
      <DetectedSupplierMapping workflow={workflow} name={fallbackSupplier.name} />
    ) : null;
  }
  const isUnknown = context.status === "unknown";
  const needsNewSupplierReview =
    context.outcome === "new" && context.status !== "fingerprinted-alias";
  const detectedName = workflow.resultsInitiative.suppliers.find((supplier) => supplier.id === context.supplierId)?.name ?? context.alias;
  if (isUnknown) {
    return <DetectedSupplierMapping workflow={workflow} unassigned actionLabel="Map Supplier" />;
  }
  return <>
    <DetectedSupplierMapping
      workflow={workflow}
      name={detectedName ?? "Supplier"}
      actionLabel={needsNewSupplierReview ? "Review" : "Edit"}
      statusLabel={
        needsNewSupplierReview
          ? "New supplier"
          : context.outcome === "wrong-match"
            ? "Review match"
            : undefined
      }
    />
    {workflow.aliasRegistrationPending && (
      <p className="mt-orbit-s text-orbit-xs text-orbit-fg-secondary">
        Registering… rounds still group correctly.
      </p>
    )}
    {workflow.supplierCorrectionNotice && (
      <p className="mt-orbit-s text-orbit-xs text-orbit-success">
        Supplier updated — grouping corrected before round 2.
      </p>
    )}
  </>;
}

function DetectedSupplierMapping({
  workflow,
  name,
  actionLabel = "Edit",
  statusLabel,
  tone = "neutral",
  unassigned = false,
}: {
  workflow: ClauseIqWorkflow;
  name?: string;
  actionLabel?: "Edit" | "Review" | "Map Supplier";
  statusLabel?: "Review match" | "New supplier";
  tone?: "neutral" | "warning";
  unassigned?: boolean;
}) {
  const [mappingOpen, setMappingOpen] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [manualAddOpen, setManualAddOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [supplierLocation, setSupplierLocation] = useState("");
  const [website, setWebsite] = useState("");
  const confirmedMapping = workflow.confirmedSupplierMapping;
  const allSupplierOptions = [
    ...mockSupplierOptions(),
    ...workflow.registeredAliases.map((supplier) => ({ id: supplier.id, name: supplier.name })),
  ].filter((supplier, index, options) => options.findIndex((candidate) => candidate.id === supplier.id) === index);
  const supplierOptions = (supplierSearch.trim() || confirmedMapping
    ? allSupplierOptions
    : []
  ).filter((supplier) => supplier.name.toLowerCase().includes(supplierSearch.toLowerCase()));
  const noSupplierResults = supplierSearch.trim().length > 0 && supplierOptions.length === 0;
  const close = () => {
    setSupplierSearch("");
    setNewSupplierName("");
    setSupplierLocation("");
    setWebsite("");
    setManualAddOpen(false);
    setMappingOpen(false);
  };
  const addSupplier = (supplierName = supplierSearch) => {
    const alias = supplierName.trim();
    if (!alias) return;
    workflow.actions.saveDetectedAlias(alias);
    close();
  };

  return <div className={`relative ${mappingOpen ? "z-50" : "z-0"}`} aria-label="Supplier">
    {unassigned ? (
      <div className="flex min-h-11 w-full items-center justify-between gap-orbit-s rounded-orbit-md border border-amber-300 bg-amber-50 px-orbit-s py-orbit-s text-orbit-sm text-amber-900">
        <div className="flex min-w-0 items-center gap-orbit-s">
          <Building2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <p className="v6-orbit-weight-medium">No supplier mapped</p>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex h-8 shrink-0 items-center gap-orbit-xs rounded-orbit-md px-orbit-s text-orbit-sm v6-orbit-weight-medium text-orbit-primary transition-colors hover:bg-orbit-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orbit-primary"
          onClick={() => setMappingOpen((open) => !open)}
        >
          <FaIcon icon={"\uf044"} size={14} />
          {actionLabel}
        </button>
      </div>
    ) : (
      <>
        <h3 className="sr-only">Supplier</h3>
        <Card type="Static" state="Accent" padding="Small" indicator={false} style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div className="flex min-h-11 w-full items-center justify-between gap-orbit-s text-orbit-sm text-orbit-fg">
          <div className="flex min-w-0 items-center gap-orbit-s">
            <Building2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 truncate">Supplier Detected · {name}</span>
            {statusLabel && <span className={`shrink-0 rounded-full px-orbit-s py-orbit-xxs text-orbit-xs v6-orbit-weight-medium ${tone === "warning" ? "bg-amber-100 text-amber-800" : "bg-orbit-warning/15 text-orbit-fg"}`}>{statusLabel}</span>}
          </div>
          <button
            type="button"
            className="inline-flex h-8 shrink-0 items-center gap-orbit-xs rounded-orbit-md px-orbit-s text-orbit-sm v6-orbit-weight-medium text-orbit-primary transition-colors hover:bg-orbit-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orbit-primary"
            onClick={() => setMappingOpen((open) => !open)}
          >
            <FaIcon icon={"\uf044"} size={14} />
            {actionLabel}
          </button>
          </div>
        </Card>
      </>
    )}
    {mappingOpen && <div id="detected-supplier-picker" className="absolute right-0 top-full z-40 max-h-[calc(100vh-6rem)] w-[min(360px,calc(100vw-2rem))] overflow-y-auto rounded-orbit-lg border border-orbit-border bg-orbit-card p-orbit-base shadow-orbit-md" style={{ marginTop: "calc(-1 * var(--orbit-space-xs))" }} role="dialog" aria-label={manualAddOpen ? "Add Supplier Manually" : "Change Mapped Supplier"} aria-modal="false">
      {manualAddOpen ? <>
        <p className="block max-w-full break-words text-orbit-sm v6-orbit-weight-semibold text-orbit-fg">Add Supplier Manually</p>
        <p className="mt-orbit-xs block max-w-full break-words text-orbit-sm leading-relaxed text-orbit-fg-secondary">Manually add a supplier for your initiative.</p>
        <div className="mt-orbit-base space-y-orbit-s">
          <label className="block text-orbit-xs v6-orbit-weight-semibold text-orbit-fg" htmlFor="clauseiq-manual-supplier-name">Supplier Name <span className="text-orbit-danger" aria-hidden="true">*</span></label>
          <Input id="clauseiq-manual-supplier-name" value={newSupplierName} onChange={(event) => setNewSupplierName(event.target.value)} placeholder="Enter supplier name" aria-label="Supplier Name" autoFocus />
          <label className="block text-orbit-xs v6-orbit-weight-semibold text-orbit-fg" htmlFor="clauseiq-manual-supplier-location">Supplier Location <span className="text-orbit-fg-secondary v6-orbit-weight-regular">(Optional)</span></label>
          <Input id="clauseiq-manual-supplier-location" value={supplierLocation} onChange={(event) => setSupplierLocation(event.target.value)} placeholder="Enter supplier location" aria-label="Supplier Location (Optional)" />
          <label className="block text-orbit-xs v6-orbit-weight-semibold text-orbit-fg" htmlFor="clauseiq-manual-supplier-website">Website <span className="text-orbit-fg-secondary v6-orbit-weight-regular">(Optional)</span></label>
          <Input id="clauseiq-manual-supplier-website" value={website} onChange={(event) => setWebsite(event.target.value)} placeholder="e.g. www.example.com" aria-label="Website (Optional)" />
        </div>
        <div className="mt-orbit-base flex items-center justify-between gap-orbit-s border-t border-orbit-border pt-orbit-s"><OrbitButton variant="Tertiary" size="Small" state="Default" onClick={close}>Cancel</OrbitButton><OrbitButton variant="Primary" size="Small" state="Default" disabled={!newSupplierName.trim()} onClick={() => addSupplier(newSupplierName)}>Confirm</OrbitButton></div>
      </> : <>
        <p className="block max-w-full break-words text-orbit-sm v6-orbit-weight-semibold text-orbit-fg">Change Mapped Supplier</p>
        <p className="mt-orbit-xs block max-w-full break-words text-orbit-sm leading-relaxed text-orbit-fg-secondary">Search for a supplier or add a new one.</p>
        <Input value={supplierSearch} onChange={(event) => setSupplierSearch(event.target.value)} placeholder="Search or type new supplier name" className="clauseiq-v6a-supplier-picker-input mt-orbit-s h-9 w-full" aria-label="Search or type new supplier name" autoFocus />
        <div className="mt-orbit-s max-h-52 space-y-orbit-xxs overflow-y-auto border-t border-orbit-border pt-orbit-base">
          {supplierOptions.map((supplier) => {
          const selected = confirmedMapping?.supplierId === supplier.id;
            return <ToggleCard key={supplier.id} status={selected ? "Selected" : "Default"} aria-pressed={selected} aria-label={`${selected ? "Current" : "Select"} supplier ${supplier.name}`} className="w-full overflow-hidden" style={{ border: "0", boxShadow: "var(--orbit-shadow-none)" }} onClick={() => { workflow.actions.assignDetectedSupplier(supplier.id); close(); }}><span className="flex w-full items-center justify-between gap-orbit-s px-orbit-s py-orbit-xs text-left text-orbit-sm"><span className="min-w-0 truncate">{supplier.name}</span>{selected && <FaIcon icon={FA.check} size={12} />}</span></ToggleCard>;
          })}
          {noSupplierResults && <div className="rounded-orbit-md border border-orbit-border bg-orbit-surface px-orbit-s py-orbit-s text-center">
            <p className="text-orbit-sm v6-orbit-weight-semibold text-orbit-fg">No supplier found</p>
            <p className="mt-orbit-xxs text-orbit-xs leading-relaxed text-orbit-fg-secondary">Try another search or manually add a supplier.</p>
            <OrbitButton variant="Secondary" size="Medium" state="Default" className="mt-orbit-s w-full" onClick={() => setManualAddOpen(true)}>Manual Add Supplier</OrbitButton>
          </div>}
        </div>
        {!noSupplierResults && <div className="mt-orbit-s border-t border-orbit-border pt-orbit-s"><OrbitButton variant="Tertiary" size="Medium" state="Default" className="w-full" aria-expanded={manualAddOpen} onClick={() => setManualAddOpen(true)}>Manual Add Supplier</OrbitButton></div>}
      </>}
    </div>}
  </div>;
}

export function PrototypeControl({ workflow }: { workflow: ClauseIqWorkflow }) {
  const [open, setOpen] = useState(false);
  const openInspector = () => {
    document.querySelector<HTMLButtonElement>("[data-orbit-inspector] > button")?.click();
    setOpen(false);
  };

  return <div className="relative" aria-label="Prototype tools">
    {open && <div className="absolute bottom-9 left-0 w-full rounded-orbit-md border border-[var(--orbit-color-sidenav-divider)] bg-[var(--orbit-color-sidenav-active-bg)] p-orbit-s text-[var(--orbit-color-sidenav-text)] shadow-lg"><label className="block text-orbit-xs v6-orbit-weight-medium text-orbit-inverse" htmlFor="supplier-detection-sim">Supplier detection preview</label><Select value={workflow.detectionOutcome} onValueChange={(value) => workflow.actions.setDetectionOutcome(value as typeof workflow.detectionOutcome)}><SelectTrigger id="supplier-detection-sim" className="mt-orbit-xs h-8 w-full bg-orbit-card text-orbit-xs clauseiq-v6-select-left clauseiq-v6a-simulation-select" aria-label="Supplier detection simulation"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="known">A · detected & known</SelectItem><SelectItem value="wrong-match">A′ · wrong match</SelectItem><SelectItem value="new">B · detected, not in list</SelectItem><SelectItem value="missing">C · not detected</SelectItem></SelectContent></Select><Button type="button" variant="outline" className="mt-orbit-s h-8 w-full border-[var(--orbit-color-sidenav-divider)] bg-transparent text-orbit-inverse hover:bg-[var(--orbit-color-sidenav-hover-bg)]" onClick={openInspector}>Inspect layout</Button></div>}
    <Button type="button" variant="outline" className="clauseiq-v6a-design-control-trigger h-7 w-full justify-center gap-orbit-xs border-[var(--orbit-color-sidenav-divider)] px-orbit-base text-orbit-xs text-orbit-inverse" onClick={() => setOpen((current) => !current)} aria-expanded={open}>Prototype tools</Button>
  </div>;
}

function mockSupplierOptions() {
  return [
    { id: "sup-001", name: "Thomson Reuters" }, { id: "sup-002", name: "Kira Systems" },
    { id: "sup-003", name: "Luminance AI" }, { id: "sup-004", name: "iManage" },
    { id: "sup-005", name: "Hogan Lovells" }, { id: "sup-006", name: "Deloitte Legal" },
  ];
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
            {workflow.resultsInitiative.suppliers
              .filter((supplier) => supplier.analyses.length > 0)
              .map((supplier) => (
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
            label="Run a new analysis"
            href="#"
            onClick={(event) => {
              event.preventDefault();
              workflow.actions.beginRerunWithoutSupplierContext();
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
  fullWidthSubmit = false,
  onCancel,
  onSubmit,
}: {
  heading: string;
  description: string;
  submitLabel: string;
  fullWidthSubmit?: boolean;
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
          <Button type="submit" className={fullWidthSubmit ? "w-full" : "ml-auto"}>
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
        fullWidthSubmit
        onSubmit={workflow.actions.saveInitialSupplierName}
      />
    );
  }

  return (
    <StateCard state="default">
      <h2 className="v6-orbit-heading-5">Supplier</h2>
      <div className="mt-orbit-base">
        <SelectedSummaryRow
          label={`Supplier · ${workflow.initialSupplierName}`}
          disabled={false}
          actionLabel="Change Supplier"
          onAction={workflow.actions.clearInitialSupplierName}
        />
      </div>
    </StateCard>
  );
}

function InitialAnalysisParameters({
  workflow,
  cardState,
}: {
  workflow: ClauseIqWorkflow;
  cardState?: CardState;
}) {
  return (
    <div className="space-y-orbit-base">
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
    return <UploadStep renderSelectedFileRow={renderSelectedFileRow} workflow={workflow} />;
  }

  if (workflow.step === "processing") {
    return (
      <div className="space-y-orbit-base">
        {!workflow.awaitingSupplierFingerprintResolution && (
          <ProcessingStep
            parameter={workflow.selectedParameter}
            workflow={workflow}
          />
        )}
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
        <div ref={refs?.upload}><UploadStep workflow={workflow} /></div>
        )}

      {workflow.processingVisible && workflow.step === "processing" && (
        <div ref={refs?.processing} className="space-y-orbit-base">
          {!workflow.awaitingSupplierFingerprintResolution && (
            <ProcessingStep
              parameter={workflow.selectedParameter}
              workflow={workflow}
            />
          )}
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
            onRunAgain={(supplier) => workflow.actions.showRunAgainUpload(supplier?.id)}
            onDownload={workflow.actions.handleDownload}
            onUploadToSupplier={(supplier) => workflow.actions.showRerunUploadForSupplier(supplier.id)}
            onViewResult={onViewResult}
            showComparisonStatus={showComparisonStatus}
            hiddenSupplierIds={workflow.unassignedSupplierIds}
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
          onRunAgain={(supplier) => workflow.actions.showRunAgainUpload(supplier?.id)}
          onDownload={workflow.actions.handleDownload}
          onUploadToSupplier={(supplier) => workflow.actions.showRerunUploadForSupplier(supplier.id)}
          onViewResult={onViewResult}
          hiddenSupplierIds={workflow.unassignedSupplierIds}
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
