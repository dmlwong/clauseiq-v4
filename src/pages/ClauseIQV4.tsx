import { useEffect, useRef, useState, type RefObject } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Sparkles, Search, Check, Pencil, UploadCloud, FileText, Loader2,
  ChevronRight, ListChecks, FilePlus2, Building2, Lock, Info,
  BookOpen, Tag, MapPin, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { V4Shell } from "@/components/clauseiq-v4/V4Shell";
import { StateCard, type CardState } from "@/components/clauseiq-v4/StateCard";
import { InitiativeModal } from "@/components/clauseiq-v4/InitiativeModal";
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
import { mockInitiative } from "@/data/mock-clauseiq";
import {
  ResultsContent,
} from "@/components/clauseiq-v4/supplier-results";

type Step = "welcome" | "select" | "parameters" | "upload" | "processing" | "results";

const PROCESSING_MS = 3_000;
const DEFAULT_PARAMETER: CiqSelectedParameter = { kind: "Playbook", label: CIQ_DEFAULT_PLAYBOOK };

export default function ClauseIQV4() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resultsFromRoute = searchParams.get("view") === "results";
  const rerunUploadFromRoute = resultsFromRoute && searchParams.get("rerun") === "upload";
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

  useEffect(() => {
    if (!resultsFromRoute) return;
    setInitiative((current) => current ?? defaultCompletedInitiative);
    setSelectedParameter((current) => current ?? DEFAULT_PARAMETER);
    setStep("results");
    if (rerunUploadFromRoute) {
      setRerunUploadVisible(true);
      setTimeout(() => rerunUploadRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    }
  }, [defaultCompletedInitiative, rerunUploadFromRoute, resultsFromRoute]);

  // Auto-scroll the active card into view
  useEffect(() => {
    const map: Partial<Record<Step, RefObject<HTMLDivElement>>> = {
      select: selectRef, parameters: parametersRef, upload: uploadRef, processing: processingRef, results: resultRef,
    };
    const el = map[step]?.current;
    if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }, [step]);

  // Simulated processing
  useEffect(() => {
    if (step !== "processing") return;
    const t = setTimeout(() => setStep("results"), PROCESSING_MS);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    if (!rerunProcessing) return;
    const t = setTimeout(() => {
      setRerunProcessing(false);
      setFile(null);
      toast.success("New analysis completed and added to the current history.");
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
    setTimeout(() => rerunUploadRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  return (
    <V4Shell
      title="ClauseIQ"
      subtitle="AI tool for detailed contract analyses"
      headerRight={
        !resultsVisible ? (
          <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground grid place-items-center">
            <Sparkles className="h-4 w-4" />
          </div>
        ) : undefined
      }
    >
      <div
        className={cn(
          "mx-auto px-4 py-10 space-y-5 transition-[max-width] duration-300",
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
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-6 w-6 rounded-full bg-success/15 text-success grid place-items-center shrink-0">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                        <div className="truncate">
                          <div className="font-medium text-sm truncate">{initiative.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{initiative.sector} · {initiative.owner}</div>
                        </div>
                      </div>
                      {initiativeLocked ? (
                        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                          <Lock className="h-3.5 w-3.5" /> Locked
                        </span>
                      ) : (
                        <button
                          className="text-sm text-ciq hover:underline inline-flex items-center gap-1"
                          onClick={() => setModalOpen(true)}
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                      )}
                    </div>
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
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-6 w-6 rounded-full bg-success/15 text-success grid place-items-center shrink-0">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                        <div className="truncate">
                          <div className="font-medium text-sm truncate">{selectedParameter.label}</div>
                          <div className="text-xs text-muted-foreground truncate">{selectedParameter.kind}</div>
                        </div>
                      </div>
                      {parameterLocked ? (
                        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                          <Lock className="h-3.5 w-3.5" /> Locked
                        </span>
                      ) : (
                        <button
                          className="text-sm text-ciq hover:underline inline-flex items-center gap-1"
                          onClick={handleParameterEdit}
                        >
                          <Pencil className="h-3.5 w-3.5" /> Change {selectedParameter.kind}
                        </button>
                      )}
                    </div>
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
                  initiative={mockInitiative}
                  onRunAgain={showRunAgainUpload}
                  onDownload={() => toast.success("Report download queued.")}
                  onViewResult={() =>
                    navigate(
                      "/initiatives-v4?view=results&initiativeId=init-1&supplierId=sup-1&contractId=ct-1&source=clauseiq&catSort=risk&mode=comparison&tab=changes&design=side-by-side&scenario=first-analysis",
                    )
                  }
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
      <div className="grid gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const expanded = option.kind === expandedKind;
          return (
            <button
              key={option.kind}
              type="button"
              aria-expanded={expanded}
              aria-controls={`ciq-parameter-options-${option.kind}`}
              className={cn(
                "flex min-h-[88px] flex-col items-start justify-between rounded-lg border p-3 text-left transition-colors",
                expanded ? "border-ciq bg-ciq-soft text-foreground" : "border-border bg-card hover:border-ciq/40 hover:bg-muted/35",
              )}
              onClick={() => onToggle(option.kind)}
            >
              <span className="flex w-full items-start justify-between gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary">
                  <ParameterIcon kind={option.kind} />
                </span>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", expanded && "rotate-180 text-ciq")} />
              </span>
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          );
        })}
      </div>

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
  if (kind === "Country") return <MapPin className="h-4 w-4" />;
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
