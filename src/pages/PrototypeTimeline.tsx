import { useState } from "react";
import { useNavigate, type NavigateFunction } from "react-router-dom";
import {
  Copy,
  ChevronRight,
  MessageSquare,
  Plus,
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
  isPrototypeCP,
  isPrototypeV6A,
  isPrototypeV6,
  isPrototypeV5,
  isResponsiveTestingPrototype,
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
const RESPONSIVE_TESTING_DASHBOARD_ROUTE =
  "/initiatives-responsive-testing?view=results&initiativeId=init-1&supplierId=sup-1&contractId=ct-1&source=clauseiq&catSort=risk&mode=comparison&tab=changes&design=row-scale&scenario=first-analysis";
const V6_DASHBOARD_ROUTE =
  "/initiatives-v6?view=results&initiativeId=init-1&supplierId=sup-1&contractId=ct-1&source=clauseiq&catSort=risk&mode=comparison&tab=changes&design=row-scale&scenario=first-analysis";
const V6A_DASHBOARD_ROUTE =
  "/initiatives-v6a?view=results&initiativeId=init-1&supplierId=sup-1&contractId=ct-1&source=clauseiq&catSort=risk&mode=comparison&tab=changes&design=row-scale&scenario=negotiated-reanalysis&resultMode=outcome&analysisId=a-001&previousAnalysisId=a-002&outputSupplierId=sup-001&from=v2&to=v3";

const v5EntryPoints = [
  {
    label: "Open output panel",
    description: "ClauseIQ supplier output with the Orbit visual foundation.",
    url: "/clauseiq-v5/output-panel",
    primary: true,
  },
  {
    label: "Open dashboard",
    description: "Latest contract results dashboard for the first-analysis scenario.",
    url: V5_DASHBOARD_ROUTE,
  },
  {
    label: "Open intake flow",
    description: "Start at the local ClauseIQ upload journey.",
    url: "/clauseiq-v5",
  },
];

const v6EntryPoints = [
  {
    label: "Open output panel",
    description: "Isolated ClauseIQ v6 supplier output forked from v5.",
    url: "/clauseiq-v6/output-panel",
    primary: true,
  },
  {
    label: "Open dashboard",
    description: "Isolated v6 contract results dashboard for the first-analysis scenario.",
    url: V6_DASHBOARD_ROUTE,
  },
  {
    label: "Open intake flow",
    description: "Start at the separate ClauseIQ v6 upload journey.",
    url: "/clauseiq-v6",
  },
];

const v6aEntryPoints = [
  {
    label: "Open output panel",
    description: "Latest v6a supplier output panel and completed analysis card.",
    url: "/clauseiq-v6a/output-panel",
    primary: true,
  },
  {
    label: "Open outcome dashboard",
    description: "Negotiated re-analysis outcome review dashboard for v6a.",
    url: V6A_DASHBOARD_ROUTE,
  },
  {
    label: "Open intake flow",
    description: "Start at the separate ClauseIQ v6a upload journey.",
    url: "/clauseiq-v6a",
  },
];

const responsiveTestingEntryPoints = [
  {
    label: "Open responsive output panel",
    description: "Sandboxed copy of the v5 output panel for small-screen testing.",
    url: "/clauseiq-responsive-testing/output-panel",
    primary: true,
  },
  {
    label: "Open responsive dashboard",
    description: "Sandboxed copy of the first-analysis dashboard.",
    url: RESPONSIVE_TESTING_DASHBOARD_ROUTE,
  },
  {
    label: "Open responsive intake flow",
    description: "Sandboxed copy of the ClauseIQ intake journey.",
    url: "/clauseiq-responsive-testing",
  },
];

type TimelineTab = "current" | "archive";

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

function openPrototype(url: string | undefined, navigate: NavigateFunction) {
  if (!url) return;
  if (url.startsWith("/")) {
    navigate(url);
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

function isHomepageCurrentVersion(version: PrototypeVersion) {
  return isPrototypeCP(version) || isPrototypeV5(version) || isPrototypeV6(version) || isPrototypeV6A(version);
}

export default function PrototypeTimeline() {
  const [activeTab, setActiveTab] = useState<TimelineTab>("current");
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
  const currentVersions = sorted.filter(isHomepageCurrentVersion);
  const history = sorted.filter((version) => !isHomepageCurrentVersion(version));
  const hasCurrentVersions = currentVersions.length > 0;
  const hasCurrentV6A = currentVersions.some(isPrototypeV6A);
  const hasCurrentV6 = currentVersions.some(isPrototypeV6);

  return (
    <div className="h-screen overflow-y-auto overflow-x-hidden bg-background p-8">
      <div className="max-w-5xl mx-auto space-y-8">
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

        <div
          className="inline-flex rounded-lg border border-border bg-card p-1"
          role="tablist"
          aria-label="Prototype timeline sections"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "current"}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === "current"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            onClick={() => setActiveTab("current")}
          >
            Current Version
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "archive"}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === "archive"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            onClick={() => setActiveTab("archive")}
          >
            Archive
          </button>
        </div>

        {activeTab === "current" && hasCurrentVersions && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Current version
              </h2>
            </div>
            <div className="space-y-4">
              {currentVersions.map((version) => (
              <CurrentCard
                  key={version.id}
                  version={version}
                  onView={() => navigate(`/prototypes/${version.id}`)}
                  onDuplicate={() => handleDuplicate(version.id)}
                  onOpen={() => openPrototype(prototypePreviewUrl(version), navigate)}
                  onDelete={() => handleDelete(version.id)}
                />
              ))}
            </div>
          </section>
        )}

        {activeTab === "archive" && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Archive
            </h2>
            {history.length > 0 ? (
              <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
                {history.map((v) => (
                  <HistoryRow
                    key={v.id}
                    version={v}
                    onView={() => navigate(`/prototypes/${v.id}`)}
                    onDuplicate={() => handleDuplicate(v.id)}
                    onOpen={() => openPrototype(prototypePreviewUrl(v), navigate)}
                    onDelete={() => handleDelete(v.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center">
                <p className="text-muted-foreground">No archived prototype versions yet.</p>
              </div>
            )}
          </section>
        )}

        {activeTab === "current" && !hasCurrentVersions && (
          <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center">
            <p className="text-muted-foreground">No prototype versions yet.</p>
          </div>
        )}

        {activeTab === "current" && hasCurrentVersions && (
          <div className="space-y-4">
            {hasCurrentV6A && <V6AQuickLinksSection onOpen={(url) => openPrototype(url, navigate)} />}
            {hasCurrentV6 && <V6QuickLinksSection onOpen={(url) => openPrototype(url, navigate)} />}
          </div>
        )}
      </div>
    </div>
  );
}

function V6AQuickLinksSection({ onOpen }: { onOpen: (url: string) => void }) {
  return (
    <section className="rounded-xl border border-primary/20 bg-primary/5 p-5 shadow-sm">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            v6a
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">V6A quick links</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Direct access to the latest v6a outcome-review prototype surfaces.
          </p>
        </div>
        <div className="grid w-full gap-2 md:w-[340px]">
          {v6aEntryPoints.map((entry) => (
            <Button
              key={entry.url}
              variant={entry.primary ? "default" : "outline"}
              className="h-auto justify-between gap-3 px-4 py-3 text-left"
              onClick={() => onOpen(entry.url)}
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

function V6QuickLinksSection({ onOpen }: { onOpen: (url: string) => void }) {
  return (
    <section className="rounded-xl border border-primary/20 bg-primary/5 p-5 shadow-sm">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            v6
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">V6 quick links</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Direct access to the isolated v6 fork so design changes no longer affect v5.
          </p>
        </div>
        <div className="grid w-full gap-2 md:w-[340px]">
          {v6EntryPoints.map((entry) => (
            <Button
              key={entry.url}
              variant={entry.primary ? "default" : "outline"}
              className="h-auto justify-between gap-3 px-4 py-3 text-left"
              onClick={() => onOpen(entry.url)}
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

function V5QuickLinksSection({ onOpen }: { onOpen: (url: string) => void }) {
  return (
    <section className="rounded-xl border border-primary/20 bg-primary/5 p-5 shadow-sm">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            v5
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">V5 quick links</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Direct access to the active Orbit-based v5 surfaces we are refining.
          </p>
        </div>
        <div className="grid w-full gap-2 md:w-[340px]">
          {v5EntryPoints.map((entry) => (
            <Button
              key={entry.url}
              variant={entry.primary ? "default" : "outline"}
              className="h-auto justify-between gap-3 px-4 py-3 text-left"
              onClick={() => onOpen(entry.url)}
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

function ResponsiveTestingQuickLinksSection({ onOpen }: { onOpen: (url: string) => void }) {
  return (
    <section className="rounded-xl border border-primary/20 bg-primary/5 p-5 shadow-sm">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Responsive testing
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Responsive testing quick links</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Direct access to the isolated v5 copy for mobile and tablet layout experiments.
          </p>
        </div>
        <div className="grid w-full gap-2 md:w-[340px]">
          {responsiveTestingEntryPoints.map((entry) => (
            <Button
              key={entry.url}
              variant={entry.primary ? "default" : "outline"}
              className="h-auto justify-between gap-3 px-4 py-3 text-left"
              onClick={() => onOpen(entry.url)}
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
