import { useEffect, useRef, useState, type RefObject } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Sparkles, Search, Check, Pencil, UploadCloud, FileText, Loader2,
  ChevronRight, ListChecks, FilePlus2, Building2, Lock, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { V4Shell } from "@/components/clauseiq-v4/V4Shell";
import { StateCard, type CardState } from "@/components/clauseiq-v4/StateCard";
import { InitiativeModal } from "@/components/clauseiq-v4/InitiativeModal";
import { CIQ_INITIATIVES, PLAYBOOK_SCOPE_DISCLAIMER, type CiqInitiative } from "@/lib/clauseiq-v4-data";
import { cn } from "@/lib/utils";
import { mockInitiative } from "@/data/mock-clauseiq";
import {
  ResultsContent,
} from "@/components/clauseiq-v4/supplier-results";

type Step = "welcome" | "select" | "upload" | "processing" | "results";

const PROCESSING_MS = 3_000;

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
  const [file, setFile] = useState<File | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [rerunUploadVisible, setRerunUploadVisible] = useState(rerunUploadFromRoute);
  const [rerunProcessing, setRerunProcessing] = useState(false);

  const selectRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLDivElement>(null);
  const rerunUploadRef = useRef<HTMLDivElement>(null);
  const processingRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!resultsFromRoute) return;
    setInitiative((current) => current ?? defaultCompletedInitiative);
    setStep("results");
    if (rerunUploadFromRoute) {
      setRerunUploadVisible(true);
      setTimeout(() => rerunUploadRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    }
  }, [defaultCompletedInitiative, rerunUploadFromRoute, resultsFromRoute]);

  // Auto-scroll the active card into view
  useEffect(() => {
    const map: Partial<Record<Step, RefObject<HTMLDivElement>>> = {
      select: selectRef, upload: uploadRef, processing: processingRef, results: resultRef,
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
  const stepIndex = (["welcome", "select", "upload", "processing", "results"] as Step[]).indexOf(step);
  const welcomeState: CardState = "default";
  const selectVisible = stepIndex >= 1;
  const selectState: CardState = step === "select" ? "active" : "default";
  const uploadVisible = stepIndex >= 2;
  const uploadState: CardState = step === "upload" ? "active" : step === "processing" || step === "results" ? "default" : "default";
  const processingVisible = step === "processing" || step === "results";
  const processingState: CardState = step === "processing" ? "active" : "default";
  const resultsVisible = step === "results";
  const initiativeLocked = step === "processing" || step === "results";

  // ---- handlers ----
  const handleSelect = (i: CiqInitiative) => {
    setInitiative(i);
    setModalOpen(false);
    setStep("upload");
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

            {/* Upload Contract */}
            {uploadVisible && step !== "processing" && step !== "results" && (
              <div ref={uploadRef}>
                <StateCard state={uploadState}>
                  <h2 className="text-base font-semibold mb-3">Upload Contract</h2>
                  <PlaybookDisclaimer variant="callout" />
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
                  <PlaybookDisclaimer variant="inline" />
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
                    navigate("/initiatives-v4?view=results&initiativeId=init-1&supplierId=sup-1&contractId=ct-1&source=clauseiq")
                  }
                />
                {rerunUploadVisible && (
                  <div ref={rerunUploadRef}>
                    <StateCard state="active">
                      <h2 className="text-base font-semibold mb-3">Upload Contract</h2>
                      <PlaybookDisclaimer variant="callout" />
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
                    <PlaybookDisclaimer variant="inline" />
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

function PlaybookDisclaimer({ variant }: { variant: "callout" | "inline" }) {
  if (variant === "inline") {
    return (
      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
        {PLAYBOOK_SCOPE_DISCLAIMER}
      </p>
    );
  }

  return (
    <div className="mb-4 flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-[11px] leading-snug text-muted-foreground">
      <Info className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
      <span>{PLAYBOOK_SCOPE_DISCLAIMER}</span>
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
