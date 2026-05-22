import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Sparkles, Search, Check, Pencil, UploadCloud, FileText, Loader2,
  ChevronRight, ListChecks, FilePlus2, Building2, Info,
  BookOpen, Tag, MapPin,
} from "lucide-react";
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
  type CiqSelectedParameter,
} from "@/lib/clauseiq-v4-data";
import { cn } from "@/lib/utils";
import { mockInitiative, type Initiative } from "@/data/mock-clauseiq";
import { V4_DELIVERY_INITIATIVE_ID } from "@/data/mock-delivery-engine-v4";
import {
  ResultsContent,
  SupplierOutputsPanel,
} from "@/components/clauseiq-v5/supplier-results";
import type { ResultsLayout, SupplierOutputsPanelState } from "@/components/clauseiq-v5/supplier-results/types";

type Step = "welcome" | "select" | "parameters" | "upload" | "processing" | "results";

const PROCESSING_MS = 3_000;
const DEFAULT_PARAMETER: CiqSelectedParameter = { kind: "Playbook", label: CIQ_DEFAULT_PLAYBOOK };
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
const LATEST_V5_RESULTS_ROUTE =
  "/initiatives-v5?view=results&initiativeId=init-1&supplierId=sup-1&contractId=ct-1&source=clauseiq&catSort=risk&mode=comparison&tab=changes&design=row-scale&scenario=first-analysis";

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
  const [selectedParameter, setSelectedParameter] = useState<CiqSelectedParameter | null>(
    resultsFromRoute ? DEFAULT_PARAMETER : null,
  );
  const [expandedParameter, setExpandedParameter] = useState<CiqParameterKind | null>(null);
  const [parameterSearch, setParameterSearch] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [rerunUploadVisible, setRerunUploadVisible] = useState(rerunUploadFromRoute);
  const [rerunProcessing, setRerunProcessing] = useState(false);

  const selectRef = useRef<HTMLDivElement>(null);
  const parametersRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLDivElement>(null);
  const rerunUploadRef = useRef<HTMLDivElement>(null);
  const processingRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const latestOutputRef = useRef<HTMLDivElement>(null);

  const scrollLatestOutputIntoView = useCallback((delay = 120) => {
    window.setTimeout(() => {
      latestOutputRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, delay);
  }, []);

  useEffect(() => {
    if (!forceResults && searchParams.get("view") === "results" && !rerunUploadFromRoute) {
      navigate("/clauseiq-v5/output-panel", { replace: true });
      return;
    }

    if (!resultsFromRoute) return;
    setInitiative((current) => current ?? defaultCompletedInitiative);
    setSelectedParameter((current) => current ?? DEFAULT_PARAMETER);
    setStep("results");
    if (rerunUploadFromRoute) {
      setRerunUploadVisible(true);
      scrollLatestOutputIntoView(160);
    }
  }, [defaultCompletedInitiative, forceResults, navigate, rerunUploadFromRoute, resultsFromRoute, scrollLatestOutputIntoView, searchParams]);

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
    scrollLatestOutputIntoView(140);
  }, [rerunProcessing, rerunUploadVisible, scrollLatestOutputIntoView, step]);

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
      setFile(null);
      toast.success("New analysis added as latest output.");
    }, PROCESSING_MS);
    return () => clearTimeout(t);
  }, [rerunProcessing]);

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
  const resultsInitiative =
    outputPanelResultsVisible && resultScenario === "empty" ? FIRST_RUN_MOCK_INITIATIVE : mockInitiative;
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
    setExpandedParameter(null);
    setParameterSearch("");
    setFile(null);
    setModalOpen(false);
    setStep("parameters");
  };

  const handleParameterToggle = (kind: CiqParameterKind) => {
    setExpandedParameter((current) => current === kind ? null : kind);
    setParameterSearch("");
  };

  const handleParameterSelect = (option: CiqParameterOption, value: string) => {
    setSelectedParameter({ kind: option.kind, label: value });
    setExpandedParameter(null);
    setParameterSearch("");
    setFile(null);
    setStep("upload");
  };

  const handleParameterEdit = () => {
    if (parameterLocked) return;
    setSelectedParameter(null);
    setExpandedParameter(null);
    setParameterSearch("");
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
      setRerunUploadVisible(false);
      setRerunProcessing(true);
      return;
    }
    setStep("processing");
  };

  const showRunAgainUpload = () => {
    setFile(null);
    setRerunProcessing(false);
    setRerunUploadVisible(true);
    if (!forceResults) {
      navigate("/clauseiq-v5/output-panel?rerun=upload");
    }
    scrollLatestOutputIntoView(120);
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
        <div className="h-full p-4">
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
          "mx-auto px-4 pt-10 space-y-5 transition-[max-width] duration-300",
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
              <div className="rounded-lg bg-muted/50 border border-border p-4 mb-5 space-y-3">
                <div className="text-sm font-medium text-foreground mb-1">Summary</div>
                <SummaryRow icon={<ListChecks className="h-4 w-4 text-ciq" />} text="Reviews every clause against your benchmark playbook." />
                <SummaryRow icon={<Building2 className="h-4 w-4 text-ciq" />} text="Tied to a chosen initiative for traceable governance." />
                <SummaryRow icon={<FilePlus2 className="h-4 w-4 text-ciq" />} text="Exports a shareable report with severity and actions." />
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
                    state={initiativeLocked ? "disabled" : "default"}
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
            {parametersVisible && (
              <div ref={parametersRef}>
                {!selectedParameter ? (
                  <StateCard state={parametersState}>
                    <h2 className="text-base font-semibold mb-1">Contract Analysis Parameters</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      Choose a parameter to analyse this contract.
                    </p>
                    <ParameterSelection
                      options={CIQ_PARAMETER_OPTIONS}
                      expandedKind={expandedParameter}
                      search={parameterSearch}
                      onToggle={handleParameterToggle}
                      onSearchChange={setParameterSearch}
                      onSelect={handleParameterSelect}
                    />
                  </StateCard>
                ) : (
                  <StateCard
                    state={parameterLocked ? "disabled" : "default"}
                    className={resultsVisible ? "mx-auto w-full max-w-[640px]" : undefined}
                  >
                    <h2 className="text-base font-semibold mb-3">Contract Analysis Parameters</h2>
                    <SelectedSummaryRow
                      label={selectedParameter.label}
                      disabled={parameterLocked}
                      actionLabel={`Change ${selectedParameter.kind}`}
                      onAction={handleParameterEdit}
                    />
                  </StateCard>
                )}
              </div>
            )}

            {/* Upload Contract */}
            {uploadVisible && selectedParameter && step !== "processing" && step !== "results" && (
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
                  <div className="flex items-center justify-between border border-border rounded-lg px-3 py-2 mb-4">
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
                <ResultsContent
                  initiative={resultsInitiative}
                  layout={resultsLayout}
                  onRunAgain={showRunAgainUpload}
                  onDownload={resultsLayout === "output-panel" ? undefined : handleDownload}
                  onViewResult={handleViewResult}
                />
                {(rerunUploadVisible || rerunProcessing) && <NewAnalysisDivider />}
                {rerunUploadVisible && (
                  <div ref={rerunUploadRef}>
                    <StateCard state="active">
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
                {rerunProcessing && (
                  <StateCard state="active">
                    <h2 className="text-base font-semibold mb-4">Analysing New Contract</h2>
                    <div className="flex items-center justify-between border border-border rounded-lg px-3 py-2 mb-4">
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
                    <PlaybookDisclaimer variant="inline" parameter={selectedParameter} />
                    <p className="text-xs text-muted-foreground mt-2">
                      The existing analysis history remains available above while this runs.
                    </p>
                  </StateCard>
                )}
                <div ref={latestOutputRef} className="h-[304px]" aria-hidden="true" />
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
        "flex min-h-11 items-center justify-between gap-4 rounded-md border px-4 py-2",
        disabled ? "border-border bg-muted/50 text-muted-foreground" : "border-border bg-card text-foreground",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <Check className={cn("h-4 w-4 shrink-0", disabled ? "text-muted-foreground" : "text-success")} />
        <span className={cn("truncate text-sm font-medium", disabled ? "text-muted-foreground" : "text-foreground")}>
          {label}
        </span>
      </div>
      {!disabled && (
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

function ParameterSelection({
  options,
  expandedKind,
  search,
  onToggle,
  onSearchChange,
  onSelect,
}: {
  options: CiqParameterOption[];
  expandedKind: CiqParameterKind | null;
  search: string;
  onToggle: (kind: CiqParameterKind) => void;
  onSearchChange: (value: string) => void;
  onSelect: (option: CiqParameterOption, value: string) => void;
}) {
  const expandedOption = options.find((option) => option.kind === expandedKind);
  const filteredOptions = expandedOption
    ? expandedOption.options.filter((value) => value.toLowerCase().includes(search.trim().toLowerCase()))
    : [];

  return (
    <div className="space-y-3">
      <fieldset className="grid gap-2 sm:grid-cols-3">
        <legend className="sr-only">Contract analysis parameter type</legend>
        {options.map((option) => {
          const selected = option.kind === expandedKind;
          return (
            <label
              key={option.kind}
              className={cn(
                "flex min-h-[88px] cursor-pointer flex-col items-start justify-between rounded-lg border p-3 text-left transition-colors",
                selected ? "border-ciq bg-ciq-soft text-foreground" : "border-border bg-card hover:border-ciq/40 hover:bg-muted/35",
              )}
            >
              <span className="flex w-full items-start justify-between gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary">
                  <ParameterIcon kind={option.kind} />
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 grid h-4 w-4 place-items-center rounded-full border transition-colors",
                    selected ? "border-ciq bg-ciq" : "border-muted-foreground/40 bg-background",
                  )}
                >
                  {selected && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                </span>
              </span>
              <input
                type="radio"
                name="ciq-parameter-kind"
                value={option.kind}
                checked={selected}
                onChange={() => onToggle(option.kind)}
                aria-controls={`ciq-parameter-options-${option.kind}`}
                className="sr-only"
              />
              <span className="text-sm font-medium">{option.label}</span>
            </label>
          );
        })}
      </fieldset>

      {expandedOption && (
        <div
          id={`ciq-parameter-options-${expandedOption.kind}`}
          role="listbox"
          aria-label={`${expandedOption.label} options`}
          className="overflow-hidden rounded-lg border border-border bg-card"
        >
          <div className="border-b border-border p-3">
            <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={`Search ${expandedOption.label.toLowerCase()}...`}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                aria-label={`Search ${expandedOption.label.toLowerCase()} options`}
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">No options match your search.</div>
            ) : (
              filteredOptions.map((value) => (
                <button
                  key={value}
                  type="button"
                  role="option"
                  aria-selected={false}
                  className="w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                  onClick={() => onSelect(expandedOption, value)}
                >
                  {value}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ParameterIcon({ kind }: { kind: CiqParameterKind }) {
  if (kind === "Category") return <Tag className="h-4 w-4" />;
  if (kind === "Governing Law") return <MapPin className="h-4 w-4" />;
  return <BookOpen className="h-4 w-4" />;
}

function parameterDisclaimer(parameter: CiqSelectedParameter | null) {
  if (!parameter || parameter.kind === "Playbook") return PLAYBOOK_SCOPE_DISCLAIMER;
  const noun = parameter.kind.toLowerCase();
  return `Analysis is based on the ${noun} selected. Clauses outside the ${noun} scope won't appear in results.`;
}

function PlaybookDisclaimer({ variant, parameter }: { variant: "callout" | "inline"; parameter: CiqSelectedParameter | null }) {
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
      className={`rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
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
