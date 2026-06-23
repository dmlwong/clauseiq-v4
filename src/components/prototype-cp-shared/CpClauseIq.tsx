import { useEffect, useMemo, useState, type ReactNode, type RefObject } from "react";
import { Card, Chip, Dropzone, FA, FaIcon, MultiStateButton, MultiStateGroup, Spinner, Toggle } from "@orbit";

import {
  BASIS_PARAMETER_OPTIONS,
  CATEGORY_PARAMETER_OPTION,
  NEXT_ACTION_MILESTONES,
  benchmarkReadout,
  hasCompleteAnalysisParameters,
  type AnalysisBasisKind,
  type AnalysisParameterSelection,
  type ClauseIqWorkflow,
  type ClauseIqWorkflowStep,
} from "@/components/clauseiq-v5/ClauseIqWorkflow";
import { DeviationPills } from "@/components/clauseiq-v5/supplier-results/DeviationPills";
import {
  OutputFindingsSummary,
  OutputScoreLine,
  getSupplierScorePresentationByAnalysisId,
  type OutputScorePresentation,
} from "@/components/clauseiq-v5/supplier-results/OutputSummaryMetrics";
import { SupplierAvatar } from "@/components/clauseiq-v5/supplier-results/SupplierAvatar";
import type { AnalysisParameterItem, ResultsLayout } from "@/components/clauseiq-v5/supplier-results/types";
import type { ClauseAnalysis, Initiative, Supplier } from "@/data/mock-clauseiq";
import { PLAYBOOK_SCOPE_DISCLAIMER, type CiqParameterKind, type CiqParameterOption } from "@/lib/clauseiq-v4-data";
import { flattenSupplierAnalyses, newestFirst, supplierSeverity } from "@/lib/clauseiq-utils";
import { cn } from "@/lib/utils";
import {
  CpButton,
  CpInlineBanner,
  CpIconButton,
  CpSearchField,
  CpTable,
  type CpTableColumn,
} from "@/components/prototype-cp-shared/orbit";

export type CpCardState = "active" | "default" | "disabled";
export type CpClauseIqJourneyMode = "stacked" | "single-step";
export type CpClauseIqInitiativeMode = "selectable" | "prebound";
export type CpSupplierOutputsPanelState = "empty" | "processing" | "filled";

export interface CpClauseIqJourneyRefs {
  latestOutput?: RefObject<HTMLDivElement>;
  parameters?: RefObject<HTMLDivElement>;
  processing?: RefObject<HTMLDivElement>;
  rerunUpload?: RefObject<HTMLDivElement>;
  result?: RefObject<HTMLDivElement>;
  select?: RefObject<HTMLDivElement>;
  upload?: RefObject<HTMLDivElement>;
}

export interface CpClauseIqFooterState {
  disabled: boolean;
  label: string;
  onClick: () => void;
}

interface CpClauseIqJourneyContentProps {
  currentInitiativeCopy?: string;
  includeResultBottomSpacer?: boolean;
  initiativeLabel?: string;
  initiativeMode: CpClauseIqInitiativeMode;
  mode: CpClauseIqJourneyMode;
  onOpenInitiativeModal?: () => void;
  onStartAnotherInitiative?: () => void;
  onViewResult: () => void;
  refs?: CpClauseIqJourneyRefs;
  renderSelectedFileRow?: (file: File, onRemove: () => void) => ReactNode;
  resultsLayout?: ResultsLayout;
  showMobileSupplierPanel?: boolean;
  workflow: ClauseIqWorkflow;
}

const MINE_ANALYSIS_IDS = new Set(["a-001", "a-004", "a-007"]);
const STACKED_WORKFLOW_STEPS: ClauseIqWorkflowStep[] = [
  "welcome",
  "select",
  "parameters",
  "upload",
  "processing",
  "results",
];

const ICON_FILE = "\uf15b";
const ICON_CHECK = "\uf00c";
const ICON_CIRCLE_EXCLAMATION = "\uf06a";
const ICON_TRIANGLE_EXCLAMATION = "\uf071";
const ICON_SLIDERS = "\uf1de";
const CP_SHARED_FA = {
  arrowDown: "\uf063",
  arrowRight: "\uf061",
  arrowUp: "\uf062",
  badgeCheck: "\uf058",
  bookOpen: "\uf02d",
  building: "\uf1ad",
  chart: "\uf080",
  chevronDown: FA.angleDown,
  clipboardList: "\uf46d",
  download: "\ue094",
  filePlus: "\uf319",
  listChecks: "\uf0ae",
  rotate: "\uf2f1",
  scale: "\uf24e",
  search: "\uf002",
  sparkles: "\ue5d6",
};

type CpLegacyOutputScoreTrend = "up" | "down" | "flat";

interface CpLegacyOutputScorePresentation {
  score: number;
  deltaFromPrevious: number;
  trend: CpLegacyOutputScoreTrend;
}

const CP_SUPPLIER_OUTPUT_SCORE_BY_ANALYSIS_ID: Record<string, number> = {
  "a-001": 56,
  "a-002": 48,
  "a-003": 36,
  "a-004": 62,
  "a-005": 51,
  "a-006": 78,
  "a-007": 58,
  "a-008": 46,
  "a-009": 74,
};

function CpSharedIcon({
  className,
  icon,
  size = 16,
}: {
  className?: string;
  icon: string;
  size?: number;
}) {
  return (
    <span className={className} aria-hidden="true">
      <FaIcon icon={icon} size={size} />
    </span>
  );
}

export function getCpClauseIqFooterState(
  workflow: ClauseIqWorkflow,
  {
    initiativeMode,
    onViewResult,
  }: {
    initiativeMode: CpClauseIqInitiativeMode;
    onViewResult: () => void;
  },
): CpClauseIqFooterState {
  if (workflow.step === "welcome") {
    return {
      disabled: false,
      label: "Start",
      onClick: () => workflow.actions.setStep(initiativeMode === "prebound" ? "parameters" : "select"),
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

export function CpStateCard({
  state,
  children,
  className,
}: {
  state: CpCardState;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      aria-disabled={state === "disabled" || undefined}
      className={cn(state === "disabled" && "pointer-events-none select-none", className)}
    >
      <Card
        type="Static"
        state={state === "disabled" ? "Disabled" : "Default"}
      >
        {children}
      </Card>
    </div>
  );
}

export function CpPlaybookDisclaimer({
  variant,
  parameter,
}: {
  variant: "callout" | "inline";
  parameter: AnalysisParameterSelection | null;
}) {
  const copy = parameterDisclaimer(parameter);

  if (variant === "inline") {
    return <p className="mt-orbit-xs text-[11px] leading-snug text-muted-foreground">{copy}</p>;
  }

  return (
    <div className="mb-orbit-base">
      <CpInlineBanner
        variant="Information"
        contrast="Low"
        label={parameter?.playbookChoice === "no" ? "Benchmark precision" : "Analysis scope"}
        description={copy}
      />
    </div>
  );
}

export function CpClauseIqDropzone({ onFile }: { onFile: (file: File | null) => void }) {
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

export function CpAnalysisParameterCards({
  selectedParameter,
  cardState,
  categoryCardState = "active",
  locked = false,
  onBasisSelect,
  onCategorySelect,
  onBasisEdit,
  onCategoryEdit,
}: {
  selectedParameter: AnalysisParameterSelection | null;
  cardState: CpCardState;
  categoryCardState?: CpCardState;
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
      <CpStateCard state={basisSelected ? "default" : cardState}>
        <h2 className="v5-orbit-heading-5 mb-orbit-xs">Contract Analysis Parameters</h2>
        {!basisSelected ? (
          <>
            <p className="text-sm text-muted-foreground mb-orbit-base">
              Choose whether ClauseIQ should analyse against a playbook or governing law.
            </p>
            <CpParameterKindSelector
              activeKind={activeBasisKind}
              options={BASIS_PARAMETER_OPTIONS}
              onActiveKindChange={setActiveBasisKind}
              onSelect={onBasisSelect}
            />
          </>
        ) : (
          <div className="mt-orbit-s">
            <CpSelectedSummaryRow
              label={`${selectedParameter!.basis!.kind} \u00b7 ${selectedParameter!.basis!.label}`}
              disabled={locked}
              actionLabel={`Change ${selectedParameter!.basis!.kind}`}
              onAction={onBasisEdit}
            />
          </div>
        )}
      </CpStateCard>

      {basisSelected && categoryRequired && (
        <CpStateCard state={categorySelected ? "default" : categoryCardState}>
          <h2 className="v5-orbit-heading-5 mb-orbit-xs">Category</h2>
          {!categorySelected ? (
            <>
              <p className="text-sm text-muted-foreground mb-orbit-base">
                Select the category ClauseIQ should use for this analysis.
              </p>
              {CATEGORY_PARAMETER_OPTION && (
                <CpParameterOptionsList option={CATEGORY_PARAMETER_OPTION} onSelect={onCategorySelect} />
              )}
            </>
          ) : (
            <div className="mt-orbit-s">
              <CpSelectedSummaryRow
                label={`Category \u00b7 ${selectedParameter!.category!}`}
                disabled={locked}
                actionLabel="Change Category"
                onAction={onCategoryEdit}
              />
            </div>
          )}
        </CpStateCard>
      )}
    </>
  );
}

export function CpAnalysisCard({
  analysis,
  supplier,
  showSupplier = false,
  onRunAgain,
  onDownload,
  onViewResult,
  viewResultPrimary = true,
  isLatestOutput = false,
  highlighted = isLatestOutput,
  analysisParameters = [],
}: {
  analysis: ClauseAnalysis;
  supplier?: Supplier;
  showSupplier?: boolean;
  onRunAgain?: () => void;
  onDownload?: () => void;
  onViewResult?: () => void;
  viewResultPrimary?: boolean;
  isLatestOutput?: boolean;
  highlighted?: boolean;
  analysisParameters?: AnalysisParameterItem[];
}) {
  const [saveToDocuments, setSaveToDocuments] = useState(false);
  const status = statusCopy[analysis.status];

  return (
    <article className="clauseiq-responsive-analysis-card">
      <Card type="Static" state={highlighted ? "Highlight" : "Default"} padding="Base">
        {showSupplier && supplier && (
          <div className="mb-orbit-base flex items-center gap-orbit-s border-b border-border/70 pb-orbit-base">
            <SupplierAvatar
              name={supplier.name}
              shortCode={supplier.shortCode}
              severity={supplierSeverity(supplier.analyses)}
              size="sm"
            />
            <span className="text-sm v5-orbit-weight-medium text-foreground">{supplier.name}</span>
          </div>
        )}

        <div className="space-y-orbit-m">
          <div className="space-y-orbit-base">
            <div className="flex flex-wrap items-center justify-between gap-orbit-s">
              <div className="flex min-w-0 flex-wrap items-center gap-orbit-s">
                <Chip label="Analysis Result" size="Mini" variant="Outline" />
                {isLatestOutput && <Chip label="Latest output" size="Mini" variant="Outline" />}
              </div>
              <span className="shrink-0 text-sm text-muted-foreground">
                {formatAnalysisTimestamp(analysis.analysedAt)}
              </span>
            </div>
            <div className="clauseiq-responsive-analysis-card-header flex flex-wrap items-center justify-between gap-orbit-base">
              <h3 className="v5-orbit-heading-4">Here is your Analysis Result</h3>
              <label className="flex items-center gap-orbit-s text-sm v5-orbit-weight-medium text-foreground">
                <span>Save To Content Search</span>
                <Toggle
                  ariaLabel="Save To Content Search"
                  checked={saveToDocuments}
                  onChange={setSaveToDocuments}
                />
              </label>
            </div>
          </div>

          <div className="space-y-orbit-base">
            <CpStatusLine icon={documentIconFromFileName(analysis.fileName)} label={analysis.fileName} status="Uploaded" tone="neutral" />
            {analysisParameters.length > 0 && <CpAnalysisParametersSummary parameters={analysisParameters} />}
            <CpStatusLine
              icon={statusIconFromTone(status.tone)}
              label={`Reviewed ${analysis.clausesReviewed} clauses`}
              status={status.label}
              tone={status.tone}
            />
          </div>

          <div className="space-y-orbit-base">
            <p className="text-base text-foreground">
              {onDownload
                ? "Summary shown below. Download the report for full details."
                : "Summary shown below. View the result for full details."}
            </p>
            <div className="space-y-orbit-s" role="group" aria-label="Missing Clauses and deviation levels">
              <p className="text-base text-muted-foreground">Missing Clauses and deviation levels</p>
              <DeviationPills deviations={analysis.deviations} />
            </div>
          </div>

          <div className="clauseiq-responsive-analysis-card-actions space-y-orbit-s">
            {onViewResult && (
              <CpButton
                orbitVariant={viewResultPrimary ? "Primary" : "Secondary"}
                className="h-10 w-full gap-orbit-s"
                onClick={onViewResult}
              >
                <CpSharedIcon icon={CP_SHARED_FA.chart} size={14} />
                View Result
              </CpButton>
            )}
            <div className={cn("clauseiq-responsive-secondary-actions grid gap-orbit-s", onRunAgain && onDownload ? "sm:grid-cols-2" : "grid-cols-1")}>
              {onRunAgain && (
                <CpButton orbitVariant="Secondary" className="h-10 gap-orbit-s" onClick={onRunAgain}>
                  <CpSharedIcon icon={CP_SHARED_FA.rotate} size={14} />
                  Run Another Analysis
                </CpButton>
              )}
              {onDownload && (
                <CpButton orbitVariant="Secondary" className="h-10 gap-orbit-s" onClick={onDownload}>
                  <CpSharedIcon icon={CP_SHARED_FA.download} size={14} />
                  Download Report
                </CpButton>
              )}
            </div>
          </div>
        </div>
      </Card>
    </article>
  );
}

export function CpSupplierOutputsPanel({
  initiative,
  expandAllSuppliers = false,
  higherIsBetter = true,
  initialOutputScope = "mine",
  onRunAgain,
  onDownload,
  onViewResult,
  outputState = "filled",
  showAnalysisMetadata = false,
  showClientShareToggle = false,
  useV5OutputSummary = false,
  className,
}: {
  initiative: Initiative;
  expandAllSuppliers?: boolean;
  higherIsBetter?: boolean;
  initialOutputScope?: "team" | "mine";
  onRunAgain?: () => void;
  onDownload?: () => void;
  onViewResult?: () => void;
  outputState?: CpSupplierOutputsPanelState;
  showAnalysisMetadata?: boolean;
  showClientShareToggle?: boolean;
  useV5OutputSummary?: boolean;
  className?: string;
}) {
  const [outputScope, setOutputScope] = useState<"team" | "mine">(initialOutputScope);
  const [query, setQuery] = useState("");
  const allRows = useMemo(() => flattenSupplierAnalyses(initiative.suppliers), [initiative.suppliers]);
  const hasOutputs = allRows.length > 0;
  const scopedSuppliers = useMemo(
    () => filterSuppliersByScope(initiative.suppliers, outputScope),
    [initiative.suppliers, outputScope],
  );
  const filteredSuppliers = useMemo(
    () => filterSuppliersByQuery(scopedSuppliers, query),
    [query, scopedSuppliers],
  );
  const rows = useMemo(() => {
    return flattenSupplierAnalyses(filteredSuppliers).sort(
      (a, b) => Date.parse(a.analysis.analysedAt) - Date.parse(b.analysis.analysedAt),
    );
  }, [filteredSuppliers]);
  const latestAnalysisId = rows.at(-1)?.analysis.id;
  const suppliers = useMemo(() => sortSuppliersByLatestChange(filteredSuppliers), [filteredSuppliers]);
  const [openSupplierIds, setOpenSupplierIds] = useState<string[]>([]);
  const supplierCount = suppliers.length;
  const outputCount = rows.length;
  const emptyState =
    outputState === "processing"
      ? {
          title: "Analysis In Progress",
          copy: "ClauseIQ is reviewing the uploaded contract. Supplier outputs will appear here once the analysis is complete.",
          loading: true,
        }
      : {
          title: "No Supplier Outputs Yet",
          copy: "Upload a contract and run ClauseIQ. Completed analyses will appear here, grouped by supplier.",
          loading: false,
        };

  useEffect(() => {
    setOpenSupplierIds(
      expandAllSuppliers
        ? suppliers.map((supplier) => supplier.id)
        : suppliers[0]
          ? [suppliers[0].id]
          : [],
    );
  }, [expandAllSuppliers, suppliers]);

  useEffect(() => {
    setOutputScope(initialOutputScope);
  }, [initialOutputScope]);

  const toggleSupplier = (supplierId: string) => {
    setOpenSupplierIds((current) =>
      current.includes(supplierId)
        ? current.filter((id) => id !== supplierId)
        : [...current, supplierId],
    );
  };

  return (
    <section
      className={cn(
        "min-w-0 space-y-orbit-base",
        !hasOutputs && "flex h-full items-center justify-center space-y-orbit-none",
        className,
      )}
      aria-label="Supplier grouped outputs"
    >
      {hasOutputs && (
        <div className="space-y-orbit-base">
          <div className="clauseiq-responsive-output-panel-header flex w-full items-baseline justify-between gap-orbit-s">
            <h2 className="v5-orbit-heading-strong">Supplier Outputs</h2>
            <p className="shrink-0 text-right v5-orbit-text-small text-muted-foreground">
              {supplierCount} {supplierCount === 1 ? "supplier" : "suppliers"} {"\u00b7"} {outputCount}{" "}
              {outputCount === 1 ? "output" : "outputs"}
            </p>
          </div>

          <CpSearchField
            ariaLabel="Search supplier outputs"
            value={query}
            onChange={setQuery}
            placeholder="Search suppliers or files"
          />

          <div className="cp-clauseiq-output-scope-control">
            <MultiStateGroup
              ariaLabel="Output scope"
              value={outputScope}
              onValueChange={(value) => {
                if (value === "mine" || value === "team") {
                  setOutputScope(value);
                }
              }}
            >
              <MultiStateButton value="mine" label="Mine" />
              <MultiStateButton value="team" label="Team" />
            </MultiStateGroup>
          </div>
        </div>
      )}

      <div id="supplier-outputs-panel" className="space-y-orbit-base">
        {suppliers.length === 0 ? (
          hasOutputs ? (
            <Card type="Static" state="Default" padding="Base">
              <div className="v5-orbit-text-body text-muted-foreground">No outputs match this view.</div>
            </Card>
          ) : (
            <CpSupplierPanelEmptyState title={emptyState.title} copy={emptyState.copy} loading={emptyState.loading} />
          )
        ) : (
          suppliers.map((supplier) => (
            <CpSupplierOutputGroup
              key={supplier.id}
              supplier={supplier}
              latestAnalysisId={latestAnalysisId}
              open={openSupplierIds.includes(supplier.id)}
              higherIsBetter={higherIsBetter}
              onToggle={() => toggleSupplier(supplier.id)}
              onRunAgain={onRunAgain}
              onDownload={onDownload}
              onViewResult={onViewResult}
              showClientShareToggle={showClientShareToggle}
              showAnalysisMetadata={showAnalysisMetadata}
              useV5OutputSummary={useV5OutputSummary}
            />
          ))
        )}
      </div>
    </section>
  );
}

export function CpClauseIqJourneyContent({
  resultsLayout = "accordion",
  ...props
}: CpClauseIqJourneyContentProps) {
  if (props.mode === "stacked") {
    return <CpStackedJourneyContent {...props} resultsLayout={resultsLayout} />;
  }

  return <CpSingleStepJourneyContent {...props} resultsLayout={resultsLayout} />;
}

function CpSingleStepJourneyContent({
  currentInitiativeCopy,
  initiativeLabel,
  initiativeMode,
  onOpenInitiativeModal,
  onStartAnotherInitiative,
  onViewResult,
  renderSelectedFileRow,
  resultsLayout,
  workflow,
}: CpClauseIqJourneyContentProps) {
  if (workflow.step === "welcome") {
    return (
      <div className="space-y-orbit-base">
        <CpClauseIqOverviewCard
          step={workflow.step}
          currentInitiativeCopy={currentInitiativeCopy}
        />
        <CpInitiativeStep
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
      <CpInitiativeStep
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
      <CpAnalysisParameterCards
        selectedParameter={workflow.selectedParameter}
        cardState={workflow.selectedParameter?.basis ? "default" : "active"}
        locked={workflow.parameterLocked}
        onBasisSelect={workflow.actions.handleBasisSelect}
        onCategorySelect={workflow.actions.handleCategorySelect}
        onBasisEdit={workflow.actions.handleBasisEdit}
        onCategoryEdit={workflow.actions.handleCategoryEdit}
      />
    );
  }

  if (workflow.step === "upload") {
    return (
      <CpUploadStep
        cardState="active"
        renderSelectedFileRow={renderSelectedFileRow}
        workflow={workflow}
      />
    );
  }

  if (workflow.step === "processing") {
    return (
      <CpProcessingStep
        parameter={workflow.selectedParameter}
        state="active"
        workflow={workflow}
      />
    );
  }

  return (
    <CpResultsStep
      onStartAnotherInitiative={onStartAnotherInitiative}
      onViewResult={onViewResult}
      resultsLayout={resultsLayout}
      workflow={workflow}
    />
  );
}

function CpStackedJourneyContent({
  currentInitiativeCopy,
  initiativeLabel,
  initiativeMode,
  onOpenInitiativeModal,
  onStartAnotherInitiative,
  onViewResult,
  refs,
  resultsLayout,
  showMobileSupplierPanel,
  includeResultBottomSpacer,
  workflow,
}: CpClauseIqJourneyContentProps) {
  const stepIndex = STACKED_WORKFLOW_STEPS.indexOf(workflow.step);
  const selectVisible = stepIndex >= 1;
  const parametersVisible = stepIndex >= 2;
  const uploadVisible = stepIndex >= 3;
  const parametersState: CpCardState = workflow.step === "parameters" ? "active" : "default";
  const uploadState: CpCardState = workflow.step === "upload" ? "active" : "default";
  const processingState: CpCardState = workflow.step === "processing" ? "active" : "default";

  return (
    <>
      <CpClauseIqOverviewCard
        step={workflow.step}
        onStart={() => workflow.actions.setStep(initiativeMode === "prebound" ? "parameters" : "select")}
        currentInitiativeCopy={currentInitiativeCopy}
      />

      {selectVisible && (
        <div ref={refs?.select}>
          <CpInitiativeStep
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
          <CpAnalysisParameterCards
            selectedParameter={workflow.selectedParameter}
            cardState={parametersState}
            locked={workflow.parameterLocked}
            onBasisSelect={workflow.actions.handleBasisSelect}
            onCategorySelect={workflow.actions.handleCategorySelect}
            onBasisEdit={workflow.actions.handleBasisEdit}
            onCategoryEdit={workflow.actions.handleCategoryEdit}
          />
        </div>
      )}

      {uploadVisible && hasCompleteAnalysisParameters(workflow.selectedParameter) && workflow.step !== "processing" && workflow.step !== "results" && (
        <div ref={refs?.upload}>
          <CpUploadStep cardState={uploadState} workflow={workflow} />
        </div>
      )}

      {workflow.processingVisible && workflow.step === "processing" && (
        <div ref={refs?.processing}>
          <CpProcessingStep
            parameter={workflow.selectedParameter}
            state={processingState}
            workflow={workflow}
          />
        </div>
      )}

      {workflow.resultsVisible && (
        <div ref={refs?.result} className="space-y-orbit-base">
          <CpResultsStep
            includeResultBottomSpacer={includeResultBottomSpacer}
            latestOutputRef={refs?.latestOutput}
            onStartAnotherInitiative={onStartAnotherInitiative}
            onViewResult={onViewResult}
            rerunUploadRef={refs?.rerunUpload}
            resultsLayout={resultsLayout}
            workflow={workflow}
          />
        </div>
      )}

      {showMobileSupplierPanel && (
        <div className="lg:hidden">
          <CpSupplierOutputsPanel
            initiative={workflow.supplierOutputInitiative}
            outputState={workflow.supplierOutputPanelState}
            onRunAgain={workflow.actions.showRunAgainUpload}
            onDownload={workflow.actions.handleDownload}
            onViewResult={onViewResult}
          />
        </div>
      )}
    </>
  );
}

function CpSelectedSummaryRow({
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
        <CpSharedIcon className={cn("shrink-0", disabled ? "text-muted-foreground" : "text-success")} icon={FA.check} size={14} />
        <span className={cn("truncate text-sm v5-orbit-weight-medium", disabled ? "text-muted-foreground" : "text-foreground")}>
          {label}
        </span>
      </div>
      {!disabled && (
        <CpButton
          type="button"
          className="inline-flex h-8 shrink-0 items-center gap-orbit-xs rounded-md px-orbit-s text-sm v5-orbit-weight-medium text-ciq"
          onClick={onAction}
        >
          {actionLabel}
        </CpButton>
      )}
    </div>
  );
}

function CpParameterOptionsList({
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
          <CpButton
            key={value}
            type="button"
            role="option"
            aria-selected={false}
            className="w-full rounded-md px-orbit-base py-orbit-s text-left text-sm"
            onClick={() => onSelect(option, value)}
          >
            {value}
          </CpButton>
        ))}
      </div>
    </div>
  );
}

function CpParameterKindSelector({
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
            <CpButton
              key={option.kind}
              type="button"
              role="radio"
              aria-checked={selected}
              className={cn(
                "flex min-h-16 cursor-pointer items-center gap-orbit-s rounded-lg border bg-card px-orbit-base py-orbit-s text-left text-sm",
                selected
                  ? "border-primary/60 text-foreground shadow-sm ring-1 ring-primary/20"
                  : "border-border text-muted-foreground",
              )}
              onClick={() => onActiveKindChange(option.kind)}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "grid h-4 w-4 shrink-0 place-items-center rounded-full border",
                  selected ? "border-primary" : "border-muted-foreground/60",
                )}
              >
                {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
              </span>
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                <CpParameterIcon kind={option.kind} />
              </span>
              <span className="min-w-0 flex-1 truncate v5-orbit-weight-medium">{option.label}</span>
            </CpButton>
          );
        })}
      </div>

      <CpParameterOptionsList option={activeOption} onSelect={onSelect} />
    </div>
  );
}

function CpParameterIcon({ kind }: { kind: CiqParameterKind }) {
  if (kind === "Governing Law") return <CpSharedIcon icon={CP_SHARED_FA.scale} size={14} />;
  if (kind === "Category") return <CpSharedIcon icon={CP_SHARED_FA.listChecks} size={14} />;
  return <CpSharedIcon icon={CP_SHARED_FA.bookOpen} size={14} />;
}

function CpClauseIqOverviewCard({
  step,
  onStart,
  currentInitiativeCopy = "Tied to a chosen initiative for traceable governance.",
}: {
  currentInitiativeCopy?: string;
  onStart?: () => void;
  step: ClauseIqWorkflowStep;
}) {
  return (
    <CpStateCard state="default">
      <div className="flex items-center gap-orbit-base mb-orbit-base">
        <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground grid place-items-center">
          <CpSharedIcon icon={CP_SHARED_FA.sparkles} size={18} />
        </div>
        <h1 className="v5-orbit-heading-4">ClauseIQ</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-orbit-m">
        Upload a contract and ClauseIQ will review it against your initiative's playbook,
        surfacing deviations, missing clauses and negotiation actions in seconds.
      </p>
      <div className={cn("rounded-lg bg-muted/50 border border-border p-orbit-base space-y-orbit-base", step === "welcome" && "mb-orbit-m")}>
        <div className="text-sm v5-orbit-weight-medium text-foreground mb-orbit-xs">Summary</div>
        <CpSummaryRow icon={<CpSharedIcon className="text-ciq" icon={CP_SHARED_FA.listChecks} size={14} />} text="Reviews every clause against your benchmark playbook." />
        <CpSummaryRow icon={<CpSharedIcon className="text-ciq" icon={CP_SHARED_FA.building} size={14} />} text={currentInitiativeCopy} />
        <CpSummaryRow icon={<CpSharedIcon className="text-ciq" icon={CP_SHARED_FA.filePlus} size={14} />} text="Exports a shareable report with severity and actions." />
      </div>
      {step === "welcome" && onStart && (
        <CpButton orbitVariant="Primary" className="w-full" onClick={onStart}>
          <CpSharedIcon className="mr-orbit-s" icon={CP_SHARED_FA.sparkles} size={14} />
          Get Started
        </CpButton>
      )}
    </CpStateCard>
  );
}

function CpSummaryRow({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-orbit-s text-sm text-muted-foreground">
      <span className="mt-orbit-xxs shrink-0">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function CpInitiativeStep({
  initiativeMode,
  label,
  onOpenInitiativeModal,
  resultsVisible,
  workflow,
}: {
  initiativeMode: CpClauseIqInitiativeMode;
  label?: string;
  onOpenInitiativeModal?: () => void;
  resultsVisible: boolean;
  workflow: ClauseIqWorkflow;
}) {
  const selectedLabel = label ?? workflow.initiative?.name;

  if (initiativeMode === "selectable" && !workflow.initiative) {
    return (
      <CpStateCard state={workflow.step === "select" ? "active" : "default"}>
        <h2 className="v5-orbit-heading-5 mb-orbit-xs">Select Initiative</h2>
        <p className="text-sm text-muted-foreground mb-orbit-base">
          Choose the initiative to analyse the contract against.
        </p>
        <CpButton orbitVariant="Primary" className="w-full" onClick={onOpenInitiativeModal}>
          <CpSharedIcon className="mr-orbit-s" icon={CP_SHARED_FA.search} size={14} />
          Search Initiatives
        </CpButton>
      </CpStateCard>
    );
  }

  return (
    <CpStateCard
      state="default"
      className={resultsVisible ? "mx-auto w-full max-w-[640px]" : undefined}
    >
      <h2 className="v5-orbit-heading-5 mb-orbit-base">
        {initiativeMode === "prebound" ? "Current Initiative" : "Initiative Selected"}
      </h2>
      <CpSelectedSummaryRow
        label={selectedLabel ?? "Initiative selected"}
        disabled={initiativeMode === "prebound" || workflow.initiativeLocked}
        actionLabel="Edit"
        onAction={onOpenInitiativeModal ?? (() => undefined)}
      />
    </CpStateCard>
  );
}

function CpUploadStep({
  cardState,
  renderSelectedFileRow,
  workflow,
}: {
  cardState: CpCardState;
  renderSelectedFileRow?: (file: File, onRemove: () => void) => ReactNode;
  workflow: ClauseIqWorkflow;
}) {
  return (
    <CpStateCard state={cardState}>
      <h2 className="v5-orbit-heading-5 mb-orbit-base">Upload Contract</h2>
      <CpPlaybookDisclaimer variant="callout" parameter={workflow.selectedParameter} />
      {workflow.file && renderSelectedFileRow ? (
        <div className="mt-orbit-base">
          {renderSelectedFileRow(workflow.file, workflow.actions.clearFile)}
        </div>
      ) : (
        <CpClauseIqDropzone onFile={workflow.actions.validateAndSetFile} />
      )}
    </CpStateCard>
  );
}

function CpProcessingStep({
  copy = "Finding clauses in your contract...",
  heading = "Analysing Your Contract",
  parameter,
  state,
  workflow,
}: {
  copy?: string;
  heading?: string;
  parameter: ClauseIqWorkflow["selectedParameter"];
  state: CpCardState;
  workflow: ClauseIqWorkflow;
}) {
  return (
    <CpStateCard state={state}>
      <h2 className="v5-orbit-heading-5 mb-orbit-base">{heading}</h2>
      <div className="flex items-center justify-between border border-border rounded-lg px-orbit-base py-orbit-s mb-orbit-base">
        <div className="flex items-center gap-orbit-s min-w-0">
          <CpSharedIcon className="text-muted-foreground shrink-0" icon={FA.file} size={14} />
          <span className="text-sm truncate">{workflow.file?.name ?? "Contract.pdf"}</span>
        </div>
        <span className="text-xs v5-orbit-weight-medium text-success inline-flex items-center gap-orbit-xs">
          <CpSharedIcon icon={FA.check} size={12} /> Uploaded
        </span>
      </div>
      <div className="flex items-center gap-orbit-base py-orbit-s">
        <Spinner size="Inline" label="Analysing contract" />
        <span className="text-sm v5-orbit-weight-medium">{copy}</span>
      </div>
      <CpPlaybookDisclaimer variant="inline" parameter={parameter} />
      <p className="text-xs text-muted-foreground mt-orbit-s">
        {heading === "Analysing New Contract"
          ? "The existing analysis history remains available above while this runs."
          : "This may take a moment. We will notify you when the analysis is completed."}
      </p>
    </CpStateCard>
  );
}

function CpResultsStep({
  includeResultBottomSpacer,
  latestOutputRef,
  onStartAnotherInitiative,
  onViewResult,
  rerunUploadRef,
  resultsLayout,
  workflow,
}: {
  includeResultBottomSpacer?: boolean;
  latestOutputRef?: RefObject<HTMLDivElement>;
  onStartAnotherInitiative?: () => void;
  onViewResult: () => void;
  rerunUploadRef?: RefObject<HTMLDivElement>;
  resultsLayout: ResultsLayout;
  workflow: ClauseIqWorkflow;
}) {
  return (
    <div className="space-y-orbit-base">
      <div ref={workflow.completedRerunAnalysis ? undefined : latestOutputRef}>
        <CpResultsContent
          initiative={workflow.resultsInitiative}
          layout={resultsLayout}
          onRunAgain={workflow.actions.showRunAgainUpload}
          onDownload={resultsLayout === "output-panel" ? undefined : workflow.actions.handleDownload}
          onViewResult={onViewResult}
          viewResultPrimary={!workflow.newAnalysisSectionVisible}
          highlightLatestOutput={!workflow.newAnalysisSectionVisible}
          analysisParameters={workflow.selectedAnalysisParameters}
        />
      </div>
      {workflow.newAnalysisSectionVisible && <CpNewAnalysisDivider />}
      {workflow.rerunUploadVisible && (
        <div ref={rerunUploadRef} className="space-y-orbit-base">
          <CpAnalysisParameterCards
            selectedParameter={workflow.rerunSelectedParameter}
            cardState={hasCompleteAnalysisParameters(workflow.rerunSelectedParameter) ? "default" : "active"}
            onBasisSelect={workflow.actions.handleRerunBasisSelect}
            onCategorySelect={workflow.actions.handleRerunCategorySelect}
            onBasisEdit={workflow.actions.handleRerunBasisEdit}
            onCategoryEdit={workflow.actions.handleRerunCategoryEdit}
          />

          {hasCompleteAnalysisParameters(workflow.rerunSelectedParameter) && (
            <CpStateCard state="active">
              <h2 className="v5-orbit-heading-5 mb-orbit-base">Upload Contract</h2>
              <CpPlaybookDisclaimer variant="callout" parameter={workflow.rerunSelectedParameter} />
              <CpClauseIqDropzone onFile={workflow.actions.validateAndSetFile} />
            </CpStateCard>
          )}
        </div>
      )}
      {workflow.rerunProcessing && (
        <CpProcessingStep
          copy="Finding clauses in your new contract..."
          heading="Analysing New Contract"
          parameter={workflow.rerunSelectedParameter ?? workflow.selectedParameter}
          state="active"
          workflow={workflow}
        />
      )}
      {workflow.completedRerunAnalysis && workflow.rerunSupplier && (
        <div ref={latestOutputRef}>
          <CpAnalysisCard
            analysis={workflow.completedRerunAnalysis}
            supplier={workflow.rerunSupplier}
            showSupplier
            onRunAgain={workflow.actions.showRunAgainUpload}
            onViewResult={onViewResult}
            viewResultPrimary
            isLatestOutput
            highlighted
            analysisParameters={workflow.completedRerunAnalysisParameters}
          />
        </div>
      )}
      {workflow.showPostAnalysisActions && (
        <CpPostAnalysisNextActions
          completedMilestoneIds={workflow.completedMilestoneIds}
          initiativeCompleted={workflow.initiativeCompleted}
          onStartAnotherInitiative={onStartAnotherInitiative ?? (() => workflow.actions.startAnotherInitiative(false))}
          onMilestoneComplete={workflow.actions.markMilestoneComplete}
          onCompleteInitiative={workflow.actions.completeInitiative}
        />
      )}
      {includeResultBottomSpacer ? <div className="h-[304px]" aria-hidden="true" /> : null}
    </div>
  );
}

function CpResultsContent({
  initiative,
  onRunAgain,
  onDownload,
  onViewResult,
  viewResultPrimary = true,
  highlightLatestOutput = true,
  analysisParameters,
  layout = "accordion",
}: {
  initiative: Initiative;
  onRunAgain?: () => void;
  onDownload?: () => void;
  onViewResult?: () => void;
  viewResultPrimary?: boolean;
  highlightLatestOutput?: boolean;
  analysisParameters?: AnalysisParameterItem[];
  layout?: ResultsLayout;
}) {
  const rows = flattenSupplierAnalyses(initiative.suppliers).sort(
    (a, b) => Date.parse(a.analysis.analysedAt) - Date.parse(b.analysis.analysedAt),
  );
  const latestAnalysisId = rows.at(-1)?.analysis.id;

  if (layout === "output-panel") {
    return (
      <div className="clauseiq-responsive-output-panel mx-auto w-full max-w-[640px] space-y-orbit-m">
        <section className="min-w-0 space-y-orbit-base" aria-label="Analysis outputs by date">
          {rows.length === 0 ? (
            <CpNoPreviousAnalysisState onRunAgain={onRunAgain} />
          ) : (
            rows.map(({ supplier, analysis }) => (
              <CpAnalysisCard
                key={analysis.id}
                analysis={analysis}
                supplier={supplier}
                showSupplier
                onRunAgain={onRunAgain}
                onDownload={onDownload}
                onViewResult={onViewResult}
                viewResultPrimary={viewResultPrimary && analysis.id === latestAnalysisId}
                isLatestOutput={analysis.id === latestAnalysisId}
                highlighted={highlightLatestOutput && analysis.id === latestAnalysisId}
                analysisParameters={analysisParameters}
              />
            ))
          )}
        </section>
      </div>
    );
  }

  return (
    <CpSupplierOutputsPanel
      initiative={initiative}
      onRunAgain={onRunAgain}
      onDownload={onDownload}
      onViewResult={onViewResult}
      outputState="filled"
    />
  );
}

function CpPostAnalysisNextActions({
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
  const columns: CpTableColumn<(typeof NEXT_ACTION_MILESTONES)[number]>[] = [
    { id: "milestone", header: "Milestone", render: (milestone) => milestone.label },
    { id: "dueDate", header: "Due Date", render: (milestone) => milestone.dueDate },
    {
      id: "status",
      header: "Status",
      render: (milestone) => completedMilestoneIds.includes(milestone.id) ? "Completed" : "Pending",
    },
    {
      id: "action",
      header: "Action",
      render: (milestone) => {
        const completed = completedMilestoneIds.includes(milestone.id);
        return completed ? (
          <CpButton orbitVariant="Secondary" className="h-9 gap-orbit-s" disabled>
            <CpSharedIcon icon={FA.check} size={14} />
            Completed
          </CpButton>
        ) : (
          <CpButton orbitVariant="Secondary" className="h-9" onClick={() => onMilestoneComplete(milestone.id)}>
            Mark Complete
          </CpButton>
        );
      },
    },
  ];

  return (
    <CpStateCard state="default">
      <div className="space-y-orbit-base">
        <h2 className="v5-orbit-heading-5">Next, you can...</h2>

        <CpButton
          type="button"
          className="flex w-full items-center gap-orbit-base rounded-lg border border-border bg-card p-orbit-base text-left"
          onClick={onStartAnotherInitiative}
        >
          <CpSharedIcon className="shrink-0 text-primary" icon={CP_SHARED_FA.sparkles} size={20} />
          <span className="min-w-0">
            <span className="block text-sm v5-orbit-weight-medium text-foreground">
              Analyse Contract on Another Initiative
            </span>
            <span className="mt-orbit-xs block text-base text-muted-foreground">
              Start fresh with a new initiative.
            </span>
          </span>
        </CpButton>

        <div className="h-px bg-border" />

        <section className="rounded-lg border border-border bg-card p-orbit-base" aria-labelledby="cp-update-milestone-title">
          <div className="flex items-start justify-between gap-orbit-base">
            <div className="flex min-w-0 items-start gap-orbit-s">
              <CpSharedIcon className="mt-orbit-xs shrink-0 text-primary" icon={CP_SHARED_FA.clipboardList} size={18} />
              <div>
                <h3 id="cp-update-milestone-title" className="v5-orbit-heading-label">
                  Update Milestone
                </h3>
                <p className="mt-orbit-xs text-base text-muted-foreground">Track your initiative progress.</p>
              </div>
            </div>
          </div>

          <div className="mt-orbit-m rounded-lg border border-border">
            <CpTable
              ariaLabel="Update milestone"
              columns={columns}
              rows={NEXT_ACTION_MILESTONES}
              getRowKey={(milestone) => milestone.id}
            />
          </div>
        </section>

        {!initiativeCompleted && (
          <CpButton
            type="button"
            className="flex w-full items-center gap-orbit-base rounded-lg border border-border bg-card p-orbit-base text-left"
            onClick={onCompleteInitiative}
          >
            <CpSharedIcon className="shrink-0 text-primary" icon={CP_SHARED_FA.badgeCheck} size={20} />
            <span className="min-w-0">
              <span className="block text-sm v5-orbit-weight-medium text-foreground">Complete Initiative</span>
              <span className="mt-orbit-xs block text-base text-muted-foreground">
                Mark this initiative as complete.
              </span>
            </span>
          </CpButton>
        )}
      </div>
    </CpStateCard>
  );
}

function CpNewAnalysisDivider() {
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

function CpAnalysisParametersSummary({ parameters }: { parameters: AnalysisParameterItem[] }) {
  if (parameters.length === 0) return null;

  return (
    <div className="space-y-orbit-s">
      {parameters.map((parameter) => (
        <CpStatusLine
          key={`${parameter.label}:${parameter.value}`}
          icon={ICON_SLIDERS}
          label={`${parameter.label} \u00b7 ${parameter.value}`}
          status="Selected"
          tone="neutral"
        />
      ))}
    </div>
  );
}

function CpStatusLine({
  icon,
  label,
  status,
  tone,
}: {
  icon: string;
  label: string;
  status: string;
  tone: "neutral" | "success" | "warning" | "destructive";
}) {
  return (
    <div className="clauseiq-responsive-status-line">
      <InlineBanner
        variant={inlineBannerVariantFromTone(tone)}
        contrast="Low"
        icon={icon}
        label={label}
        status={status}
      />
    </div>
  );
}

function CpSupplierPanelEmptyState({
  title,
  copy,
  loading,
}: {
  title: string;
  copy: string;
  loading: boolean;
}) {
  return (
    <div className="w-full px-orbit-s py-orbit-s text-center">
      <div className="mx-auto max-w-[260px]">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg border border-slate-200 bg-white text-primary shadow-sm">
          {loading ? <Spinner size="Inline" label="Loading supplier outputs" /> : <CpSharedIcon icon={CP_SHARED_FA.search} size={18} />}
        </div>
        <h3 className="v5-orbit-heading-5 mt-orbit-m">{title}</h3>
        <p className="mt-orbit-s v5-orbit-text-body text-muted-foreground">{copy}</p>
      </div>
    </div>
  );
}

function CpNoPreviousAnalysisState({ onRunAgain }: { onRunAgain?: () => void }) {
  return (
    <Card type="Static" state="Default" padding="Base">
      <div className="text-center">
        <div className="mx-auto grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
          <CpSharedIcon icon={FA.file} size={18} />
        </div>
        <h3 className="v5-orbit-heading-5 mt-orbit-base">No analysis outputs yet</h3>
        <p className="mx-auto mt-orbit-s max-w-sm v5-orbit-text-body text-muted-foreground">
          Once the first supplier contract is analysed, the result card will appear here with the supplier output summary.
        </p>
        {onRunAgain && (
          <CpButton orbitVariant="Primary" className="mt-orbit-base h-9 gap-orbit-s" onClick={onRunAgain}>
            <CpSharedIcon icon={CP_SHARED_FA.rotate} size={14} />
            Run first analysis
          </CpButton>
        )}
      </div>
    </Card>
  );
}

function CpSupplierOutputGroup({
  supplier,
  latestAnalysisId,
  open,
  higherIsBetter,
  onToggle,
  onRunAgain,
  onDownload,
  onViewResult,
  showClientShareToggle = false,
  showAnalysisMetadata,
  useV5OutputSummary = false,
}: {
  supplier: Supplier;
  latestAnalysisId?: string;
  open: boolean;
  higherIsBetter: boolean;
  onToggle: () => void;
  onRunAgain?: () => void;
  onDownload?: () => void;
  onViewResult?: () => void;
  showClientShareToggle?: boolean;
  showAnalysisMetadata?: boolean;
  useV5OutputSummary?: boolean;
}) {
  const analyses = newestFirst(supplier.analyses);
  const scoresByAnalysisId = useV5OutputSummary
    ? getSupplierScorePresentationByAnalysisId(analyses)
    : getCpSupplierScorePresentationByAnalysisId(analyses);
  const contentId = `supplier-output-${supplier.id}`;
  const containsLatestOutput = supplier.analyses.some((analysis) => analysis.id === latestAnalysisId);

  return (
    <section className="overflow-hidden">
      <Card type="Static" state="Default" padding="Small">
        <div className="flex w-full items-center gap-orbit-s py-orbit-s text-left">
          <SupplierAvatar
            name={supplier.name}
            shortCode={supplier.shortCode}
            severity={supplierSeverity(supplier.analyses)}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <h3 className="v5-orbit-heading-label truncate">{supplier.name}</h3>
          </div>
          <p className="shrink-0 whitespace-nowrap text-right v5-orbit-text-small text-muted-foreground">
            {supplier.analyses.length} {supplier.analyses.length === 1 ? "output" : "outputs"}
            {containsLatestOutput && <span className="v5-orbit-weight-medium"> - Latest output</span>}
          </p>
          <CpIconButton
            type="button"
            ariaLabel={`${open ? "Collapse" : "Expand"} ${supplier.name} outputs`}
            aria-expanded={open}
            aria-controls={contentId}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted-foreground"
            icon={<CpSharedIcon className={cn("transition-transform", open && "rotate-180")} icon={CP_SHARED_FA.chevronDown} size={14} />}
            onClick={onToggle}
          />
        </div>

        {open && (
          <div id={contentId} className="overflow-hidden">
            <div className="border-t border-border/70 pt-orbit-base">
              {analyses.map((analysis, index) => (
                <div key={analysis.id}>
                  {index > 0 && <div className="my-orbit-m h-px bg-border/70" aria-hidden="true" />}
                  <CpCompactOutputRow
                    analysis={analysis}
                    displayFileName={displayFileNameForCpSupplierAnalysis(supplier, analysis)}
                    score={scoresByAnalysisId[analysis.id]}
                    higherIsBetter={higherIsBetter}
                    isLatestOutput={analysis.id === latestAnalysisId}
                    onRunAgain={onRunAgain}
                    onDownload={onDownload}
                    onViewResult={onViewResult}
                    showClientShareToggle={showClientShareToggle}
                    useV5OutputSummary={useV5OutputSummary}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </section>
  );
}

function CpCompactOutputRow({
  analysis,
  displayFileName,
  score,
  higherIsBetter,
  isLatestOutput,
  onRunAgain,
  onDownload,
  onViewResult,
  showClientShareToggle = false,
  useV5OutputSummary = false,
}: {
  analysis: ClauseAnalysis;
  displayFileName: string;
  score?: OutputScorePresentation | CpLegacyOutputScorePresentation;
  higherIsBetter: boolean;
  isLatestOutput: boolean;
  onRunAgain?: () => void;
  onDownload?: () => void;
  onViewResult?: () => void;
  showClientShareToggle?: boolean;
  useV5OutputSummary?: boolean;
}) {
  const [sharedWithClient, setSharedWithClient] = useState(false);

  return (
    <article className="px-orbit-xs">
      {isLatestOutput && (
        <div className="mb-orbit-xxs">
          <span className="v5-orbit-text-small text-muted-foreground">Latest output</span>
        </div>
      )}
      <div className="flex items-center justify-between gap-orbit-s">
        <div className="min-w-0 flex-1">
          <p className="truncate whitespace-nowrap v5-orbit-heading-strong text-foreground">{displayFileName}</p>
        </div>
        <CpCompactOutputMeta
          analysedAt={analysis.analysedAt}
          clientShareToggle={
            showClientShareToggle
              ? {
                  checked: sharedWithClient,
                  label: `Share ${displayFileName} with client`,
                  onChange: setSharedWithClient,
                }
              : undefined
          }
          onDownload={onDownload}
          onRunAgain={onRunAgain}
          onViewResult={onViewResult}
        />
      </div>

      {score && (
        <div className="mt-orbit-xs">
          {useV5OutputSummary ? (
            <OutputScoreLine
              score={score as OutputScorePresentation}
              higherIsBetter={higherIsBetter}
            />
          ) : (
            <CpLegacyOutputScoreLine score={score as CpLegacyOutputScorePresentation} />
          )}
        </div>
      )}

      <div className="mt-orbit-base">
        {useV5OutputSummary ? (
          <OutputFindingsSummary deviations={analysis.deviations} />
        ) : (
          <DeviationPills deviations={analysis.deviations} compact singleLine />
        )}
      </div>
    </article>
  );
}

function CpLegacyOutputScoreLine({ score }: { score: CpLegacyOutputScorePresentation }) {
  return (
    <div className="flex min-w-0 items-center gap-orbit-s whitespace-nowrap">
      <span className="v5-orbit-text-body v5-orbit-weight-medium text-foreground">Score {score.score}</span>
      <span
        className={cn(
          "inline-flex items-center gap-[4px] v5-orbit-text-small v5-orbit-weight-medium",
          cpScoreTrendTextClass(score.trend),
        )}
      >
        <CpSharedIcon icon={cpScoreTrendIcon(score.trend)} size={11} />
        {formatCpDelta(score.deltaFromPrevious)}
      </span>
      <span className="v5-orbit-text-small text-muted-foreground">vs previous</span>
    </div>
  );
}

function CpCompactOutputMeta({
  analysedAt,
  clientShareToggle,
  onDownload,
  onRunAgain,
  onViewResult,
}: {
  analysedAt: string;
  clientShareToggle?: {
    checked: boolean;
    label: string;
    onChange: (checked: boolean) => void;
  };
  onDownload?: () => void;
  onRunAgain?: () => void;
  onViewResult?: () => void;
}) {
  return (
    <div className="shrink-0 text-right v5-orbit-text-small text-muted-foreground">
      <div className="inline-flex items-center gap-orbit-s whitespace-nowrap">
        <time dateTime={analysedAt}>{formatCompactTimestamp(analysedAt)}</time>
        {clientShareToggle && (
          <span className="inline-flex items-center gap-orbit-xs text-foreground">
            <span className="v5-orbit-text-small v5-orbit-weight-medium">
              Share with client
            </span>
            <Toggle
              ariaLabel={clientShareToggle.label}
              checked={clientShareToggle.checked}
              onChange={clientShareToggle.onChange}
            />
          </span>
        )}
        <div className="inline-flex items-center gap-orbit-xs">
          {onViewResult && (
            <CpCompactActionButton label="View Results" onClick={onViewResult}>
              <CpSharedIcon icon={CP_SHARED_FA.chart} size={13} />
            </CpCompactActionButton>
          )}
          {onRunAgain && (
            <CpCompactActionButton label="Re-Run" onClick={onRunAgain}>
              <CpSharedIcon icon={CP_SHARED_FA.rotate} size={13} />
            </CpCompactActionButton>
          )}
          {onDownload && (
            <CpCompactActionButton label="Download" onClick={onDownload}>
              <CpSharedIcon icon={CP_SHARED_FA.download} size={13} />
            </CpCompactActionButton>
          )}
        </div>
      </div>
    </div>
  );
}

function CpCompactActionButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <CpButton
      orbitVariant="Secondary"
      className="h-7 w-7 px-orbit-none"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </CpButton>
  );
}

function parameterDisclaimer(parameter: AnalysisParameterSelection | null) {
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

function inlineBannerVariantFromTone(
  tone: "neutral" | "success" | "warning" | "destructive",
): "No Status" | "Success" | "Warning" | "Error" {
  if (tone === "success") return "Success";
  if (tone === "warning") return "Warning";
  if (tone === "destructive") return "Error";
  return "No Status";
}

const statusCopy: Record<ClauseAnalysis["status"], { label: string; tone: "success" | "warning" | "destructive" }> = {
  completed: { label: "Completed", tone: "success" },
  in_progress: { label: "In progress", tone: "warning" },
  failed: { label: "Failed", tone: "destructive" },
};

function statusIconFromTone(tone: "success" | "warning" | "destructive") {
  if (tone === "success") return ICON_CHECK;
  if (tone === "warning") return ICON_TRIANGLE_EXCLAMATION;
  return ICON_CIRCLE_EXCLAMATION;
}

function documentIconFromFileName(_fileName: string) {
  return ICON_FILE;
}

function getCpSupplierScorePresentationByAnalysisId(
  analyses: ClauseAnalysis[],
): Record<string, CpLegacyOutputScorePresentation> {
  const chronological = [...analyses].sort(
    (a, b) => Date.parse(a.analysedAt) - Date.parse(b.analysedAt),
  );

  return chronological.reduce<Record<string, CpLegacyOutputScorePresentation>>((scores, analysis, index) => {
    const score = CP_SUPPLIER_OUTPUT_SCORE_BY_ANALYSIS_ID[analysis.id];
    if (typeof score !== "number") return scores;

    const previousAnalysis = chronological[index - 1];
    const previousScore = previousAnalysis
      ? CP_SUPPLIER_OUTPUT_SCORE_BY_ANALYSIS_ID[previousAnalysis.id]
      : undefined;
    const deltaFromPrevious = typeof previousScore === "number" ? score - previousScore : 0;

    scores[analysis.id] = {
      score,
      deltaFromPrevious,
      trend: cpScoreTrendFromDelta(deltaFromPrevious),
    };
    return scores;
  }, {});
}

function displayFileNameForCpSupplierAnalysis(supplier: Supplier, analysis: ClauseAnalysis): string {
  return newestFirst(supplier.analyses)[0]?.fileName ?? analysis.fileName;
}

function cpScoreTrendFromDelta(delta: number): CpLegacyOutputScoreTrend {
  if (delta > 0) return "up";
  if (delta < 0) return "down";
  return "flat";
}

function cpScoreTrendTextClass(trend: CpLegacyOutputScoreTrend) {
  if (trend === "up") return "text-emerald-700";
  if (trend === "down") return "text-rose-700";
  return "text-muted-foreground";
}

function cpScoreTrendIcon(trend: CpLegacyOutputScoreTrend) {
  if (trend === "up") return CP_SHARED_FA.arrowUp;
  if (trend === "down") return CP_SHARED_FA.arrowDown;
  return CP_SHARED_FA.arrowRight;
}

function formatCpDelta(delta: number) {
  return delta > 0 ? `+${delta}` : `${delta}`;
}

function sortSuppliersByLatestChange(suppliers: Supplier[]): Supplier[] {
  return [...suppliers].sort((a, b) => latestChangeTime(a) - latestChangeTime(b) || a.name.localeCompare(b.name));
}

function filterSuppliersByScope(suppliers: Supplier[], outputScope: "team" | "mine"): Supplier[] {
  if (outputScope === "team") {
    return suppliers.filter((supplier) => supplier.analyses.length > 0);
  }

  return suppliers
    .map((supplier) => ({
      ...supplier,
      analyses: supplier.analyses.filter((analysis) => MINE_ANALYSIS_IDS.has(analysis.id)),
    }))
    .filter((supplier) => supplier.analyses.length > 0);
}

function filterSuppliersByQuery(suppliers: Supplier[], query: string): Supplier[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return suppliers;

  return suppliers
    .map((supplier) => {
      const supplierMatches =
        supplier.name.toLowerCase().includes(normalizedQuery) ||
        supplier.shortCode.toLowerCase().includes(normalizedQuery);

      if (supplierMatches) return supplier;

      return {
        ...supplier,
        analyses: supplier.analyses.filter((analysis) =>
          [analysis.fileName, analysis.contractName].some((value) =>
            value.toLowerCase().includes(normalizedQuery),
          ),
        ),
      };
    })
    .filter((supplier) => supplier.analyses.length > 0);
}

function latestChangeTime(supplier: Supplier): number {
  return Math.max(0, ...supplier.analyses.map((analysis) => Date.parse(analysis.analysedAt)));
}

function formatAnalysisTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatCompactTimestamp(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
