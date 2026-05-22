import { useNavigate } from "react-router-dom";
import {
  Copy,
  ChevronRight,
  MessageSquare,
  Plus,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  CircleDot,
  ExternalLink,
  Link2,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  usePrototypeStore,
  prototypePreviewUrl,
  summarize,
  type VersionStatus,
  type PrototypeVersion,
} from "@/lib/prototype-store";

const statusTone: Record<VersionStatus, string> = {
  "Awaiting feedback": "bg-warning/10 text-warning-foreground border-warning/30",
  "Feedback received": "bg-primary/10 text-primary border-primary/30",
  "In progress": "bg-secondary text-secondary-foreground border-border",
  Complete: "bg-success/10 text-success border-success/30",
};

const V5_DASHBOARD_ROUTE =
  "/initiatives-v5?view=results&initiativeId=init-1&supplierId=sup-1&contractId=ct-1&source=clauseiq&catSort=risk&mode=comparison&tab=changes&design=row-scale&scenario=first-analysis";

const v5EntryPoints = [
  {
    label: "Open test output panel",
    description: "ClauseIQ supplier output with the Orbit visual foundation.",
    url: "/clauseiq-v5/output-panel",
    primary: true,
  },
  {
    label: "Open test dashboard",
    description: "Latest contract results dashboard for the first-analysis scenario.",
    url: V5_DASHBOARD_ROUTE,
  },
  {
    label: "Open test intake flow",
    description: "Start at the local ClauseIQ upload journey.",
    url: "/clauseiq-v5",
  },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return fmtDate(iso);
}

function openPrototype(url?: string) {
  if (!url) return;
  if (url.startsWith("/")) {
    window.location.assign(url);
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

export default function PrototypeTimeline() {
  const navigate = useNavigate();
  const { prototype, versions, duplicateVersion, deleteVersion } = usePrototypeStore();

  const handleDuplicate = (id: string) => {
    const newId = duplicateVersion(id);
    if (newId) navigate(`/prototypes/${newId}`);
  };

  const handleDelete = (id: string) => {
    deleteVersion(id);
  };

  const sorted = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);
  const current = sorted[0];
  const history = sorted.slice(1);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <Button variant="ghost" size="sm" onClick={() => navigate("/initiatives")} className="gap-2 -ml-2">
          <ArrowLeft className="w-4 h-4" /> Back to app
        </Button>

        <header className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {prototype.name} · Admin
          </p>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Prototype Version Control
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Track every iteration of your prototype, link to the live preview, and manage
            feedback collected from each round of review. This page is separate from the
            prototype itself — use it to plan and document your design process.
          </p>
        </header>

        {current && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Current version
              </h2>
            </div>
            <CurrentCard
              version={current}
              onView={() => navigate(`/prototypes/${current.id}`)}
              onDuplicate={() => handleDuplicate(current.id)}
              onOpen={() => openPrototype(prototypePreviewUrl(current))}
              onDelete={() => handleDelete(current.id)}
            />
          </section>
        )}

        {history.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Earlier versions
            </h2>
            <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
              {history.map((v) => (
                <HistoryRow
                  key={v.id}
                  version={v}
                  onView={() => navigate(`/prototypes/${v.id}`)}
                  onDuplicate={() => handleDuplicate(v.id)}
                  onOpen={() => openPrototype(prototypePreviewUrl(v))}
                  onDelete={() => handleDelete(v.id)}
                />
              ))}
            </div>
          </section>
        )}

        {!current && (
          <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center">
            <p className="text-muted-foreground">No prototype versions yet.</p>
          </div>
        )}

        <TestPrototypeSection />
      </div>
    </div>
  );
}

function TestPrototypeSection() {
  return (
    <section className="rounded-xl border border-primary/20 bg-primary/5 p-5 shadow-sm">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            test
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Jump into test</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Direct access for the local Orbit migration work. This sits below the main
            prototype timeline so V4 remains the current version baseline.
          </p>
        </div>
        <div className="grid w-full gap-2 md:w-[340px]">
          {v5EntryPoints.map((entry) => (
            <Button
              key={entry.url}
              variant={entry.primary ? "default" : "outline"}
              className="h-auto justify-between gap-3 px-4 py-3 text-left"
              onClick={() => openPrototype(entry.url)}
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{entry.label}</span>
                <span className="mt-0.5 block whitespace-normal text-xs font-normal opacity-80">
                  {entry.description}
                </span>
              </span>
              <ExternalLink className="h-4 w-4 shrink-0" />
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}

function PrototypeUrlPill({ url }: { url?: string }) {
  if (!url) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground italic">
        <Link2 className="w-3.5 h-3.5" /> No prototype URL
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground max-w-[280px] truncate">
      <Link2 className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate">{url.replace(/^https?:\/\//, "")}</span>
    </span>
  );
}

function CurrentCard({
  version,
  onView,
  onDuplicate,
  onOpen,
  onDelete,
}: {
  version: PrototypeVersion;
  onView: () => void;
  onDuplicate: () => void;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const s = summarize(version);
  const previewUrl = prototypePreviewUrl(version);
  return (
    <div className="bg-card border-2 border-primary/30 rounded-xl p-6 shadow-sm">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-3 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xl font-semibold text-foreground">{version.title}</h3>
            <Badge variant="outline" className={statusTone[version.status]}>
              {version.status}
            </Badge>
            <span className="text-xs text-muted-foreground">· {relativeDate(version.createdAt)}</span>
          </div>

          <PrototypeUrlPill url={previewUrl} />

          {version.goal && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Goal
              </p>
              <p className="text-sm text-foreground">{version.goal}</p>
            </div>
          )}

          {version.notes && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                What changed
              </p>
              <p className="text-sm text-foreground">{version.notes}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1 text-sm flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <MessageSquare className="w-4 h-4" /> {s.total} feedback
            </span>
            {s.open > 0 && (
              <span className="inline-flex items-center gap-1.5 text-primary">
                <CircleDot className="w-4 h-4" /> {s.open} open
              </span>
            )}
            {s.resolved > 0 && (
              <span className="inline-flex items-center gap-1.5 text-success">
                <CheckCircle2 className="w-4 h-4" /> {s.resolved} resolved
              </span>
            )}
            {s.high > 0 && (
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                {s.high} high priority
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 shrink-0 w-44">
          <Button onClick={onOpen} disabled={!previewUrl} className="gap-2">
            <ExternalLink className="w-4 h-4" /> Open Prototype
          </Button>
          <Button variant="outline" onClick={onView} className="gap-2">
            View details <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="ghost" onClick={onDuplicate} className="gap-2">
            <Plus className="w-4 h-4" /> Start next version
          </Button>
          <DeleteVersionButton title={version.title} onConfirm={onDelete} />
        </div>
      </div>
    </div>
  );
}

function HistoryRow({
  version,
  onView,
  onDuplicate,
  onOpen,
  onDelete,
}: {
  version: PrototypeVersion;
  onView: () => void;
  onDuplicate: () => void;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const s = summarize(version);
  const previewUrl = prototypePreviewUrl(version);
  return (
    <div className="p-5 hover:bg-muted/40 transition-colors flex items-start gap-4">
      <div className="mt-1.5">
        <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
      </div>
      <button onClick={onView} className="flex-1 min-w-0 space-y-1.5 text-left">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground">{version.title}</span>
          <span className="text-xs text-muted-foreground">{relativeDate(version.createdAt)}</span>
          <Badge variant="outline" className={statusTone[version.status]}>
            {version.status}
          </Badge>
        </div>
        <PrototypeUrlPill url={previewUrl} />
        {version.notes && (
          <p className="text-sm text-muted-foreground line-clamp-2">{version.notes}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-0.5">
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" /> {s.total}
          </span>
          {s.open > 0 && <span>· {s.open} open</span>}
          {s.resolved > 0 && <span>· {s.resolved} resolved</span>}
          {s.high > 0 && <span className="text-destructive">· {s.high} high priority</span>}
        </div>
      </button>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          size="sm"
          variant="outline"
          onClick={onOpen}
          disabled={!previewUrl}
          className="gap-1.5"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Open Prototype
        </Button>
        <Button size="sm" variant="ghost" onClick={onDuplicate} className="gap-1.5">
          <Copy className="w-3.5 h-3.5" /> Duplicate
        </Button>
        <Button size="sm" variant="ghost" onClick={onView} className="gap-1">
          Details <ChevronRight className="w-4 h-4" />
        </Button>
        <DeleteVersionButton title={version.title} onConfirm={onDelete} compact />
      </div>
    </div>
  );
}

function DeleteVersionButton({
  title,
  onConfirm,
  compact = false,
}: {
  title: string;
  onConfirm: () => void;
  compact?: boolean;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {compact ? (
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </Button>
        ) : (
          <Button
            variant="ghost"
            className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" /> Delete version
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {title}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes this prototype version and all of its feedback. This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
