import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Copy, Plus, Trash2, Check, Pencil, ExternalLink, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  isPrototypeCP,
  isPrototypeV3,
  isPrototypeV4,
  isPrototypeV5,
  isPrototypeV6,
  isResponsiveTestingPrototype,
  prototypePreviewUrl,
  summarize,
  type FeedbackItem,
  type FeedbackPriority,
  type FeedbackCategory,
  type FeedbackStatus,
  type VersionStatus,
} from "@/lib/prototype-store";

const PRIORITIES: FeedbackPriority[] = ["Low", "Medium", "High"];
const CATEGORIES: FeedbackCategory[] = ["UX", "UI", "Content", "Technical", "Business", "Other"];
const STATUSES: FeedbackStatus[] = ["New", "Accepted", "Rejected", "In progress", "Resolved"];
const VERSION_STATUSES: VersionStatus[] = ["Awaiting feedback", "Feedback received", "In progress", "Complete"];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const priorityTone: Record<FeedbackPriority, string> = {
  High: "bg-destructive/10 text-destructive border-destructive/30",
  Medium: "bg-warning/10 text-warning-foreground border-warning/30",
  Low: "bg-secondary text-secondary-foreground border-border",
};

const statusTone: Record<FeedbackStatus, string> = {
  New: "bg-primary/10 text-primary border-primary/30",
  Accepted: "bg-success/10 text-success border-success/30",
  Rejected: "bg-muted text-muted-foreground border-border",
  "In progress": "bg-warning/10 text-warning-foreground border-warning/30",
  Resolved: "bg-success/10 text-success border-success/30",
};

function isInternalPrototypeUrl(url?: string) {
  if (!url) return false;
  if (url.startsWith("/")) return true;
  return [
    "/prototype-cp",
    "/prototype-cp-v2",
    "/clauseiq-responsive-testing",
    "/clauseiq-v6",
    "/clauseiq-v5",
    "/clauseiq-v4",
    "/clauseiq-v3",
    "/initiatives",
    "/initiatives-v2",
    "/initiatives-v3",
    "/initiatives-v4",
    "/initiatives-v5",
    "/initiatives-v6",
  ].some((path) => url.includes(path));
}

export default function PrototypeDetail() {
  const { versionId } = useParams();
  const navigate = useNavigate();
  const { versions, updateVersion, addFeedback, updateFeedback, deleteFeedback, duplicateVersion, deleteVersion } =
    usePrototypeStore();

  const version = useMemo(() => versions.find((v) => v.id === versionId), [versions, versionId]);
  const [editingMeta, setEditingMeta] = useState(false);
  const [draft, setDraft] = useState({ title: "", goal: "", notes: "", previewUrl: "" });
  const [newFb, setNewFb] = useState({
    text: "",
    source: "",
    priority: "Medium" as FeedbackPriority,
    category: "UX" as FeedbackCategory,
  });

  if (!version) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-3xl mx-auto space-y-4">
          <p className="text-muted-foreground">Version not found.</p>
          <Button variant="outline" onClick={() => navigate("/")}>Back to timeline</Button>
        </div>
      </div>
    );
  }

  const s = summarize(version);
  const previewUrl = prototypePreviewUrl(version);

  const startEdit = () => {
    setDraft({ title: version.title, goal: version.goal, notes: version.notes, previewUrl: version.previewUrl ?? "" });
    setEditingMeta(true);
  };
  const saveEdit = () => {
    updateVersion(version.id, { ...draft });
    setEditingMeta(false);
  };

  const submitFeedback = () => {
    if (!newFb.text.trim()) return;
    addFeedback(version.id, {
      text: newFb.text.trim(),
      source: newFb.source.trim() || "Anonymous",
      priority: newFb.priority,
      category: newFb.category,
      status: "New",
    });
    setNewFb({ text: "", source: "", priority: "Medium", category: "UX" });
  };

  const handleDuplicate = () => {
    const id = duplicateVersion(version.id);
    if (id) navigate(`/prototypes/${id}`);
  };

  const handleDelete = () => {
    deleteVersion(version.id);
    navigate("/");
  };

  const openPrototype = () => {
    if (!previewUrl) return;
    if (isInternalPrototypeUrl(previewUrl)) {
      navigate(previewUrl);
      return;
    }
    window.open(previewUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2 -ml-2">
          <ArrowLeft className="w-4 h-4" /> Prototype Timeline
        </Button>

        {/* Header card */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1 min-w-0">
              {editingMeta ? (
                <Input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  className="text-xl font-semibold"
                />
              ) : (
                <h1 className="text-2xl font-bold text-foreground tracking-tight">{version.title}</h1>
              )}
              <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
                <span>Created {fmtDate(version.createdAt)}</span>
                <span>·</span>
                <Select
                  value={version.status}
                  onValueChange={(val) => updateVersion(version.id, { status: val as VersionStatus })}
                >
                  <SelectTrigger className="h-7 w-auto gap-2 border-dashed">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VERSION_STATUSES.map((st) => (
                      <SelectItem key={st} value={st}>{st}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {editingMeta ? (
                <Button size="sm" onClick={saveEdit} className="gap-2">
                  <Check className="w-4 h-4" /> Save
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={startEdit} className="gap-2">
                  <Pencil className="w-4 h-4" /> Edit
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={handleDuplicate} className="gap-2">
                <Copy className="w-4 h-4" /> Duplicate
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {version.title}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently removes this prototype version and all of its feedback.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {editingMeta ? (
            <div className="grid gap-3">
              <div>
                <Label>What changed in this version</Label>
                <Textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
              </div>
            </div>
          ) : (
            <div className="pt-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">What changed</p>
              <p className="text-sm text-foreground">{version.notes || "—"}</p>
            </div>
          )}
        </div>

        {/* Summary + preview */}
        <div className="grid md:grid-cols-4 gap-3">
          {[
            { label: "Total feedback", value: s.total },
            { label: "Open", value: s.open },
            { label: "Resolved", value: s.resolved },
            { label: "High priority open", value: s.high, accent: s.high > 0 },
          ].map((c) => (
            <div key={c.label} className="bg-card border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className={`text-2xl font-semibold ${c.accent ? "text-destructive" : "text-foreground"}`}>{c.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5" /> Prototype URL
            </p>
            {previewUrl ? (
              <button
                type="button"
                onClick={openPrototype}
                className="text-primary text-sm underline break-all text-left hover:text-primary/90"
              >
                {previewUrl}
              </button>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No prototype URL set yet — add one via Edit.
              </p>
            )}
          </div>
          <Button
            onClick={openPrototype}
            disabled={!previewUrl}
            className="gap-2 shrink-0"
          >
            <ExternalLink className="w-4 h-4" /> Open Prototype
          </Button>
        </div>

        {/* Feedback */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Feedback</h2>
            <Badge variant="outline">{version.feedback.length}</Badge>
          </div>

          {/* Add new */}
          <div className="border border-dashed border-border rounded-lg p-4 space-y-3 bg-muted/30">
            <Textarea
              placeholder="What did the reviewer say?"
              value={newFb.text}
              onChange={(e) => setNewFb({ ...newFb, text: e.target.value })}
            />
            <div className="grid md:grid-cols-4 gap-3">
              <Input
                placeholder="From (name or team)"
                value={newFb.source}
                onChange={(e) => setNewFb({ ...newFb, source: e.target.value })}
              />
              <Select value={newFb.priority} onValueChange={(v) => setNewFb({ ...newFb, priority: v as FeedbackPriority })}>
                <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={newFb.category} onValueChange={(v) => setNewFb({ ...newFb, category: v as FeedbackCategory })}>
                <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={submitFeedback} className="gap-2"><Plus className="w-4 h-4" /> Add feedback</Button>
            </div>
          </div>

          {/* List */}
          <div className="space-y-3">
            {version.feedback.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No feedback yet.</p>
            )}
            {version.feedback.map((f) => (
              <FeedbackRow
                key={f.id}
                item={f}
                onUpdate={(patch) => updateFeedback(version.id, f.id, patch)}
                onDelete={() => deleteFeedback(version.id, f.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedbackRow({
  item,
  onUpdate,
  onDelete,
}: {
  item: FeedbackItem;
  onUpdate: (patch: Partial<FeedbackItem>) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(item.text);
  const [notes, setNotes] = useState(item.notes ?? "");

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          {editing ? (
            <Textarea value={text} onChange={(e) => setText(e.target.value)} />
          ) : (
            <p className="text-sm text-foreground">{item.text}</p>
          )}
          <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
            <span>{item.source}</span>
            <span>·</span>
            <span>{fmtDate(item.date)}</span>
            <Badge variant="outline" className={priorityTone[item.priority]}>{item.priority}</Badge>
            <Badge variant="outline">{item.category}</Badge>
            <Badge variant="outline" className={statusTone[item.status]}>{item.status}</Badge>
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          {item.status !== "Resolved" && (
            <Button size="sm" variant="ghost" onClick={() => onUpdate({ status: "Resolved" })} className="gap-1">
              <Check className="w-4 h-4" /> Resolve
            </Button>
          )}
          <Button size="icon" variant="ghost" onClick={() => setEditing((v) => !v)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {editing && (
        <div className="grid md:grid-cols-3 gap-3">
          <Select value={item.priority} onValueChange={(v) => onUpdate({ priority: v as FeedbackPriority })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={item.category} onValueChange={(v) => onUpdate({ category: v as FeedbackCategory })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={item.status} onValueChange={(v) => onUpdate({ status: v as FeedbackStatus })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{STATUSES.map((st) => <SelectItem key={st} value={st}>{st}</SelectItem>)}</SelectContent>
          </Select>
          <Textarea
            className="md:col-span-3"
            placeholder="Notes / action taken"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="md:col-span-3 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setText(item.text); setNotes(item.notes ?? ""); setEditing(false); }}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => { onUpdate({ text, notes }); setEditing(false); }}>Save</Button>
          </div>
        </div>
      )}

      {!editing && item.notes && (
        <p className="text-xs text-muted-foreground border-l-2 border-border pl-3">{item.notes}</p>
      )}
    </div>
  );
}
