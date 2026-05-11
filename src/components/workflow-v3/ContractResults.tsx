import { useState, useMemo, useEffect, Fragment, forwardRef, type MouseEvent, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, Search, MapPin, Lightbulb,
  GitCompare, History, X, ArrowRight, Sparkles, Upload, Trash2, FileText, Loader2,
  Download, Info, FileDiff, ShieldCheck, ExternalLink, Sigma, Pin, RotateCcw,
  Clock, ShieldX,
} from "lucide-react";

import { toast } from "@/components/ui/use-toast";
import { toast as sonnerToast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";
import {
  IconCircleCheck,
  IconCircleX,
  IconArrowsDiff,
  IconFlame,
  IconHelp,
  IconInfoCircle,
  IconList,
  IconPlus,
  IconTimeline,
  IconTrendingDown,
  IconTrendingUp,
} from "@tabler/icons-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getInitiative, getSupplier, getContract,
  type ClauseResult, type ContractVersion,
} from "@/lib/workflow-data";
import { ACME_DEFAULT_FOCUS_IDS, ACME_DEFAULT_REQUEST_TEXTS, makeSyntheticVersion } from "@/lib/clauses-data";
import {
  useClauseDecisions,
  getLatestRequest,
  type ClauseDecisionState,
  type RoundDecision,
  type ClosureDecision,
} from "@/hooks/use-clause-decisions";
import { CLAUSE_FRAMEWORK } from "@/lib/clauses-framework";
import { classifyChange, materialChangeLabel, materialChangeTone } from "@/lib/material-change";
import {
  CHANGE_DIRECTION_CONFIDENCE_THRESHOLD,
  NEW_CHANGE_LABEL,
  determineChangePill,
  sortChangePillStatus,
  type ChangePillResult,
  type ChangePillStatus,
  type VersionComparisonPair,
} from "@/lib/change-tracking";
import { VersionVerdictBanner } from "./VersionVerdictBanner";
import { TextDiff } from "./TextDiff";
import { NegotiationTrendStrip } from "./NegotiationTrendStrip";
import { getClauseAudit, confidenceLabel } from "@/lib/audit-trail";
import { getSupplierGrouping } from "@/lib/supplier-grouping";
import { exportContractCsv, downloadCsv } from "@/lib/csv-export";
import {
  deriveComparisonModel,
  deriveHistoryModel,
  normalizeVersionComparisonPair,
  versionOrder,
  type DeviationDistribution,
  type ClauseIqMode,
  type ComparisonTab,
  type HistoryFilter,
  type HistoryRow,
  type HistorySort,
  type RoundStatus,
  type VersionPanelData,
  buildHistoryRow,
} from "@/lib/clauseiq-v3-comparison";

interface Props {
  initiativeId: string;
  supplierId: string;
  contractId: string;
  onBack: () => void;
  backLabel?: string;
  compactHeader?: boolean;
  onRunAnalysisAgain?: () => void;
  scoringOption?: ScoringOptionKey;
  onScoringOptionChange?: (value: ScoringOptionKey) => void;
}

type TabKey = "review" | ComparisonTab;
type FilterKey = "all" | "open" | "new-issues" | "closed" | "unmarked";
type QuickFilterKey = "high" | "medium" | "low" | "need-action" | "changes";
type CategorySortKey = "risk" | "az" | "count";
export type ScoringOptionKey = "issue-score" | "hybrid";
type ScoreBand = "A" | "B" | "C" | "D" | "F";

interface ScoreDriver {
  clauseId: string;
  clauseName: string;
  description: string;
  severity: "high" | "medium" | "low";
  weightedCost: number;
  roundsUnchanged: number;
}

interface ContractScore {
  version: string;
  score: number;
  band: ScoreBand;
  delta: number;
  identified: Record<"high" | "medium" | "low", number>;
  resolved: Record<"high" | "medium" | "low", number>;
  open: Record<"high" | "medium" | "low", number>;
  dealBreakerPresent: boolean;
  dealBreakerClause?: string;
  topDrivers: ScoreDriver[];
  velocity: number;
  stalled: ScoreDriver[];
}

interface ContractScoringModel {
  current: ContractScore;
  previous?: ContractScore;
  first: ContractScore;
  history: ContractScore[];
  identifiedTotal: number;
  resolvedTotal: number;
  remainingTotal: number;
}

type PanelChangeStatus = ChangePillStatus;

interface PanelChangeItem {
  id: string;
  title: string;
  status: PanelChangeStatus;
}

const severityTone = (s: ClauseResult["severity"] | undefined) =>
  s === "high" ? "bg-destructive/10 text-destructive border-destructive/20"
    : s === "medium" ? "bg-warning/15 text-warning-foreground border-warning/30"
    : s === "low" ? "bg-success/10 text-success border-success/20"
    : "bg-muted text-muted-foreground border-border";

const severityDot = (s: ClauseResult["severity"] | undefined) =>
  s === "high" ? "bg-destructive"
    : s === "medium" ? "bg-warning"
    : s === "low" ? "bg-success"
    : "bg-muted-foreground";

const SEVERITY_WEIGHTS: Record<"high" | "medium" | "low", number> = {
  high: 9,
  medium: 3,
  low: 1,
};

const DEAL_BREAKER_CLAUSE_IDS = new Set(["c35", "c48", "c58"]);

const bandColor: Record<ScoreBand, string> = {
  A: "#3B6D11",
  B: "#3B6D11",
  C: "#5F5E5A",
  D: "#854F0B",
  F: "#A32D2D",
};

const historyFilterLabels: Record<HistoryFilter, string> = {
  all: "All",
  still_open: "Still open",
  regressed_last_round: "Regressed last round",
  met: "Met",
  new_clauses: "New clauses",
};

function normalizeMode(value: string | null): ClauseIqMode {
  return value === "history" ? "history" : "comparison";
}

function normalizeComparisonTab(value: string | null): ComparisonTab {
  if (value === "all") return "all";
  if (value === "history" || value === "tracker" || value === "compare") return "changes";
  return "changes";
}

function normalizeHistoryFilter(value: string | null): HistoryFilter {
  return value === "still_open" ||
    value === "regressed_last_round" ||
    value === "met" ||
    value === "new_clauses"
    ? value
    : "all";
}

function normalizeHistorySort(value: string | null): HistorySort {
  return value === "clause_id" ||
    value === "current_status" ||
    value === "rounds_to_resolve"
    ? value
    : "contentious";
}

// ---- helpers ----------------------------------------------------------------

function clauseCategory(id: string): string {
  return CLAUSE_FRAMEWORK.find((c) => c.id === id)?.category ?? "Other";
}

function severityRank(severity: "high" | "medium" | "low") {
  if (severity === "high") return 3;
  if (severity === "medium") return 2;
  return 1;
}

function deriveScoreBand(score: number, open: Record<"high" | "medium" | "low", number>, dealBreakerPresent: boolean): ScoreBand {
  if (dealBreakerPresent || open.high >= 3) return "F";
  if (open.high === 2) return "D";
  if (open.high === 1) return "C";
  if (score >= 90 && open.medium <= 2) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 40) return "D";
  return "F";
}

function roundsUnchangedFor(clauseId: string, versionIndex: number, versions: ContractVersion[]) {
  const current = versions[versionIndex]?.clauses.find((c) => c.id === clauseId);
  if (!current || current.resolved) return 0;
  let rounds = 1;
  for (let idx = versionIndex - 1; idx >= 0; idx -= 1) {
    const prior = versions[idx].clauses.find((c) => c.id === clauseId);
    if (!prior || prior.resolved || prior.severity !== current.severity) break;
    rounds += 1;
  }
  return rounds;
}

function computeContractScoring(versions: ContractVersion[]): ContractScoringModel | null {
  if (versions.length === 0) return null;

  const issueUniverse = CLAUSE_FRAMEWORK.map((def) => {
    const history = versions.map((version) => version.clauses.find((clause) => clause.id === def.id));
    const issueClauses = history.filter((clause): clause is ClauseResult => Boolean(clause && !clause.resolved));
    if (issueClauses.length === 0) return null;
    const identifiedSeverity = issueClauses.reduce<"high" | "medium" | "low">((max, clause) =>
      severityRank(clause.severity) > severityRank(max) ? clause.severity : max,
    issueClauses[0].severity);
    return { def, identifiedSeverity };
  }).filter((issue): issue is { def: (typeof CLAUSE_FRAMEWORK)[number]; identifiedSeverity: "high" | "medium" | "low" } => Boolean(issue));

  const identifiedWeight = Math.max(
    1,
    issueUniverse.reduce((sum, issue) => sum + SEVERITY_WEIGHTS[issue.identifiedSeverity], 0),
  );

  const history = versions.map((version, versionIndex) => {
    const identified = { high: 0, medium: 0, low: 0 };
    const resolved = { high: 0, medium: 0, low: 0 };
    const open = { high: 0, medium: 0, low: 0 };
    let openWeight = 0;
    const drivers: ScoreDriver[] = [];
    let dealBreakerClause: string | undefined;

    for (const issue of issueUniverse) {
      identified[issue.identifiedSeverity] += 1;
      const current = version.clauses.find((clause) => clause.id === issue.def.id);
      if (!current || current.resolved) {
        resolved[issue.identifiedSeverity] += 1;
        continue;
      }

      open[current.severity] += 1;
      openWeight += SEVERITY_WEIGHTS[current.severity];
      const roundsUnchanged = roundsUnchangedFor(issue.def.id, versionIndex, versions);
      if (!dealBreakerClause && current.severity === "high" && DEAL_BREAKER_CLAUSE_IDS.has(issue.def.id)) {
        dealBreakerClause = issue.def.title;
      }
      drivers.push({
        clauseId: issue.def.id,
        clauseName: issue.def.title,
        description: current.deviation,
        severity: current.severity,
        weightedCost: SEVERITY_WEIGHTS[current.severity],
        roundsUnchanged,
      });
    }

    const rawScore = Math.round(100 * (1 - openWeight / identifiedWeight));
    const score = Math.max(0, Math.min(100, rawScore));
    const topDrivers = drivers
      .sort((a, b) => b.weightedCost - a.weightedCost || b.roundsUnchanged - a.roundsUnchanged || a.clauseName.localeCompare(b.clauseName))
      .slice(0, 3);
    const stalled = drivers
      .filter((driver) => driver.roundsUnchanged >= 2 && driver.severity !== "low")
      .sort((a, b) => b.weightedCost - a.weightedCost || b.roundsUnchanged - a.roundsUnchanged)
      .slice(0, 3);
    const currentResolved = issueUniverse.filter((issue) => {
      const clause = version.clauses.find((item) => item.id === issue.def.id);
      return !clause || clause.resolved;
    }).length;
    const firstResolved = issueUniverse.filter((issue) => {
      const clause = versions[0].clauses.find((item) => item.id === issue.def.id);
      return !clause || clause.resolved;
    }).length;

    return {
      version: version.version,
      score,
      band: deriveScoreBand(score, open, Boolean(dealBreakerClause)),
      delta: 0,
      identified,
      resolved,
      open,
      dealBreakerPresent: Boolean(dealBreakerClause),
      dealBreakerClause,
      topDrivers,
      velocity: versionIndex > 0 ? Number(Math.max(0, (currentResolved - firstResolved) / versionIndex).toFixed(1)) : 0,
      stalled,
    };
  });

  const withDeltas = history.map((score, index) => ({
    ...score,
    delta: index > 0 ? score.score - history[index - 1].score : 0,
  }));
  const current = withDeltas.at(-1)!;
  const identifiedTotal = current.identified.high + current.identified.medium + current.identified.low;
  const resolvedTotal = current.resolved.high + current.resolved.medium + current.resolved.low;

  return {
    current,
    previous: withDeltas.length > 1 ? withDeltas.at(-2) : undefined,
    first: withDeltas[0],
    history: withDeltas,
    identifiedTotal,
    resolvedTotal,
    remainingTotal: identifiedTotal - resolvedTotal,
  };
}

interface RoundOutcome {
  /** What we surface in the Round Tracker for a given clause × version. */
  label: "No Action" | "Requested Change" | "Updated" | "Still Open" | "Closed" | "New Change" | "—";
  tone: string;
}

function roundOutcome(
  clauseId: string,
  versionLabel: string,
  versions: ContractVersion[],
  state: ClauseDecisionState,
): RoundOutcome {
  const idx = versions.findIndex((v) => v.version === versionLabel);
  if (idx === -1) return { label: "—", tone: "bg-muted/50 text-muted-foreground border-dashed border-border" };
  const round = state.roundDecisions[versionLabel];
  // Round 1 = baseline decision only.
  if (idx === 0) {
    if (round === "request-update") return { label: "Requested Change", tone: "bg-primary/10 text-primary border-primary/20" };
    if (round === "no-action") return { label: "No Action", tone: "bg-muted text-muted-foreground border-border" };
    return { label: "—", tone: "bg-muted/40 text-muted-foreground border-dashed border-border" };
  }
  // Later rounds — derive from previous decision + change.
  const prev = versions[idx - 1].clauses.find((c) => c.id === clauseId);
  const curr = versions[idx].clauses.find((c) => c.id === clauseId);
  const change = classifyChange(prev, curr);
  const wasRequestedBefore = Object.entries(state.roundDecisions).some(
    ([v, d]) => d === "request-update" && versions.findIndex((x) => x.version === v) < idx,
  );
  const closure = state.closures[versionLabel];

  if (closure === "closed") return { label: "Closed", tone: "bg-success/10 text-success border-success/20" };

  if (wasRequestedBefore) {
    if (change === "material") {
      // Updated by supplier — still open unless user closes it.
      return { label: "Updated", tone: "bg-primary/10 text-primary border-primary/20" };
    }
    return { label: "Still Open", tone: "bg-warning/15 text-warning-foreground border-warning/30" };
  }

  // Not previously requested
  if (change === "material") return { label: "New Change", tone: "bg-destructive/10 text-destructive border-destructive/20" };
  return { label: "No Action", tone: "bg-muted text-muted-foreground border-border" };
}

function wasRequestedByVersion(
  state: ClauseDecisionState | undefined,
  versions: ContractVersion[],
  versionLabel: string | undefined,
): boolean {
  if (!state || !versionLabel) return false;
  const versionIndex = versions.findIndex((version) => version.version === versionLabel);
  if (versionIndex < 0) return false;
  return Object.entries(state.roundDecisions).some(
    ([version, decision]) =>
      decision === "request-update" &&
      versions.findIndex((candidate) => candidate.version === version) <= versionIndex,
  );
}

// ---- main component ---------------------------------------------------------

export function ContractResults({
  initiativeId,
  supplierId,
  contractId,
  onBack,
  backLabel,
  compactHeader = false,
  onRunAnalysisAgain,
}: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initiative = getInitiative(initiativeId);
  const supplier = getSupplier(initiativeId, supplierId);
  const contract = getContract(initiativeId, supplierId, contractId);
  const decisions = useClauseDecisions({}, { storageKey: "ciq-v3-clause-decisions" });
  const mode = normalizeMode(searchParams.get("mode"));

  // Local mutable copy of versions so the user can simulate uploading a new
  // round or deleting an existing one without touching shared seed data.
  const [versions, setVersions] = useState<ContractVersion[]>(contract?.versions ?? []);
  const v1 = versions[0] ?? null;
  const latest = versions.at(-1) ?? null;

  // Seed plausible round-1 request decisions for the demo focus clauses.
  useEffect(() => {
    if (!contract || versions.length === 0) return;
    decisions.seedDefaults(supplierId, contractId, ACME_DEFAULT_FOCUS_IDS, ACME_DEFAULT_REQUEST_TEXTS);
  }, [supplierId, contractId, contract, versions.length, decisions]);

  const comparisonPair = useMemo(
    () =>
      normalizeVersionComparisonPair(versions, {
        from: searchParams.get("from") ?? undefined,
        to: searchParams.get("to") ?? undefined,
      }),
    [versions, searchParams],
  );

  useEffect(() => {
    if (searchParams.get("mode") === mode) return;
    const next = new URLSearchParams(searchParams);
    next.set("mode", mode);
    setSearchParams(next, { replace: true });
  }, [mode, searchParams, setSearchParams]);

  useEffect(() => {
    if (versions.length < 2) return;
    if (searchParams.get("from") === comparisonPair.from && searchParams.get("to") === comparisonPair.to) return;
    const next = new URLSearchParams(searchParams);
    next.set("mode", mode);
    next.set("from", comparisonPair.from);
    next.set("to", comparisonPair.to);
    setSearchParams(next, { replace: true });
  }, [comparisonPair.from, comparisonPair.to, mode, searchParams, setSearchParams, versions.length]);

  const setComparisonPair = (nextPair: VersionComparisonPair) => {
    const normalized = normalizeVersionComparisonPair(versions, nextPair);
    const next = new URLSearchParams(searchParams);
    next.set("from", normalized.from);
    next.set("to", normalized.to);
    setSearchParams(next, { replace: false });
  };

  const setPair = (nextPair: { left: string; right: string }) => {
    setComparisonPair({ from: nextPair.left, to: nextPair.right });
  };

  const resetPair = () => {
    const normalized = normalizeVersionComparisonPair(versions, null);
    setComparisonPair(normalized);
  };

  const pair = { left: comparisonPair.from, right: comparisonPair.to };
  const leftVersion = versions.find((v) => v.version === comparisonPair.from) ?? v1;
  const rightVersion = versions.find((v) => v.version === comparisonPair.to) ?? latest;

  // Which version the Review tab is focused on (defaults to latest so the user
  // can review v1 first, then re-review v2 once it's uploaded).
  const [reviewVersionLabel, setReviewVersionLabel] = useState<string>(() => versions[0]?.version ?? "v1");
  const reviewVersion = versions.find((v) => v.version === reviewVersionLabel) ?? v1;

  const tabStorageKey = `ciq-v3-tab:${supplierId}:${contractId}`;
  const storedComparisonTab = (() => {
    try {
      return sessionStorage.getItem(tabStorageKey);
    } catch {
      return null;
    }
  })();
  const tab: TabKey = versions.length < 2 ? "review" : normalizeComparisonTab(searchParams.get("tab") ?? storedComparisonTab);
  const setTab = (next: TabKey) => {
    if (next === "review") return;
    const normalized = normalizeComparisonTab(next);
    const params = new URLSearchParams(searchParams);
    params.set("tab", normalized);
    params.set("mode", "comparison");
    setSearchParams(params, { replace: false });
    try {
      sessionStorage.setItem(tabStorageKey, normalized);
    } catch {
      // Session storage is optional in the prototype.
    }
  };
  useEffect(() => {
    if (mode !== "comparison" || versions.length < 2) return;
    const normalized = normalizeComparisonTab(searchParams.get("tab") ?? storedComparisonTab);
    if (searchParams.get("tab") === normalized) return;
    const params = new URLSearchParams(searchParams);
    params.set("mode", "comparison");
    params.set("tab", normalized);
    setSearchParams(params, { replace: true });
  }, [mode, searchParams, setSearchParams, storedComparisonTab, versions.length]);

  const historyStorageKey = `ciq-v3-history:${supplierId}:${contractId}`;
  const storedHistoryState = (() => {
    try {
      return JSON.parse(localStorage.getItem(historyStorageKey) ?? "{}") as { filter?: string; sort?: string };
    } catch {
      return {};
    }
  })();
  const historyFilter = normalizeHistoryFilter(searchParams.get("filter") ?? storedHistoryState.filter ?? null);
  const historySort = normalizeHistorySort(searchParams.get("sort") ?? storedHistoryState.sort ?? null);
  const historyCategory = searchParams.get("cat") || null;
  const updateHistoryState = (patch: { filter?: HistoryFilter; sort?: HistorySort; cat?: string | null }) => {
    const params = new URLSearchParams(searchParams);
    params.set("mode", "history");
    if (patch.filter) params.set("filter", patch.filter);
    if (patch.sort) params.set("sort", patch.sort);
    if ("cat" in patch) {
      if (patch.cat) params.set("cat", patch.cat);
      else params.delete("cat");
    }
    setSearchParams(params, { replace: false });
    try {
      localStorage.setItem(historyStorageKey, JSON.stringify({
        filter: patch.filter ?? historyFilter,
        sort: patch.sort ?? historySort,
      }));
    } catch {
      // Ignore storage failures.
    }
  };

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const detailClauseId = searchParams.get("clause");
  const setDetailClauseId = (id: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (id) params.set("clause", id);
    else params.delete("clause");
    setSearchParams(params, { replace: false });
  };
  const [highlightClauseId, setHighlightClauseId] = useState<string | null>(null);
  // R3 DI-16: pinned clause IDs survive across version-pair switches and tab changes.
  const [pinnedClauseIds, setPinnedClauseIds] = useState<Set<string>>(() => new Set());
  const togglePin = (id: string) => {
    setPinnedClauseIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  // Upload / delete modals
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  // Decision per-version: accept / request changes (state only — no side effects).
  const [decisions_, setDecisions_] = useState<Record<string, "accepted" | "changes-requested" | null>>({});
  const [acceptConfirmOpen, setAcceptConfirmOpen] = useState(false);
  const [quickFilter, setQuickFilter] = useState<QuickFilterKey | null>(null);

  const allDecisions = decisions.getAll(supplierId, contractId);
  const stateOf = (id: string): ClauseDecisionState =>
    allDecisions[id] ?? { roundDecisions: {}, closures: {}, requests: {}, updatedAt: "" };

  const onUploadVersion = (file: File | null, label: string) => {
    if (!file) return;
    const prevLabel = versions.at(-1)?.version ?? null;
    const today = new Date().toISOString().slice(0, 10);
    const newVersion = makeSyntheticVersion(label, prevLabel, today);
    const next = [...versions, newVersion];
    setVersions(next);
    setPair({ left: prevLabel ?? label, right: label });
    setUploadOpen(false);
    toast({
      title: `Version ${label} uploaded successfully`,
      description: "Changes updated.",
    });
  };

  const onDeleteVersion = (label: string) => {
    const next = versions.filter((v) => v.version !== label);
    setVersions(next);
    // Re-anchor pair on remaining versions.
    if (next.length >= 2) {
      setPair({ left: next.at(-2)!.version, right: next.at(-1)!.version });
    } else if (next.length === 1) {
      setPair({ left: next[0].version, right: next[0].version });
    }
    setDeleteTarget(null);
    toast({
      title: `Version ${label} removed`,
      description: "Changes, summary metrics, and history were updated.",
    });
  };

  const comparisonModel = useMemo(
    () => deriveComparisonModel(versions, comparisonPair, allDecisions),
    [allDecisions, comparisonPair, versions],
  );
  const historyModel = useMemo(
    () => deriveHistoryModel(versions, allDecisions, historyFilter, historyCategory, historySort),
    [allDecisions, historyCategory, historyFilter, historySort, versions],
  );

  // Open Items = previously requested clauses; New Changes = supplier-initiated
  // movement; Closed = explicitly closed for the target version; Unmarked = no
  // change/no prior request.
  const comparisonSections = useMemo(
    () => ({
      open: comparisonModel.buckets.open_items,
      newIssues: comparisonModel.buckets.new_changes,
      closed: comparisonModel.buckets.closed,
      unmarked: comparisonModel.buckets.unmarked,
    }),
    [comparisonModel],
  );

  const changeTracking = comparisonModel.changeTracking;

  const panelChangeItems = useMemo<PanelChangeItem[]>(
    () =>
      Object.values(comparisonModel.buckets)
        .flat()
        .filter((row) => Boolean(row.pill.status))
        .map((row) => ({
          id: row.id,
          title: row.curr?.title ?? row.prev?.title ?? row.id.toUpperCase(),
          status: row.pill.status!,
        }))
        .sort((a, b) => sortChangePillStatus(a.status) - sortChangePillStatus(b.status) || a.title.localeCompare(b.title)),
    [comparisonModel],
  );

  const scoringModel = useMemo(() => computeContractScoring(versions), [versions]);

  // R3 DI-18: undo helpers — 8s sonner toast + per-row 30s undo affordance.
  const [recentlyClosed, setRecentlyClosed] = useState<Record<string, number>>({});
  const closeWithUndo = (id: string, label: string, prev: ClosureDecision | undefined) => {
    if (!rightVersion) return;
    decisions.setClosure(supplierId, contractId, id, rightVersion.version, "closed");
    setRecentlyClosed((m) => ({ ...m, [id]: Date.now() + 30_000 }));
    sonnerToast(`Closed "${label}" for ${rightVersion.version}`, {
      description: "You can undo for 30 seconds.",
      duration: 8000,
      action: {
        label: "Undo",
        onClick: () => {
          decisions.setClosure(supplierId, contractId, id, rightVersion.version, prev ?? "keep-open");
          setRecentlyClosed((m) => { const n = { ...m }; delete n[id]; return n; });
        },
      },
    });
    setTimeout(() => {
      setRecentlyClosed((m) => {
        if (!m[id] || m[id] > Date.now()) return m;
        const n = { ...m }; delete n[id]; return n;
      });
    }, 30_500);
  };
  const undoClose = (id: string) => {
    if (!rightVersion) return;
    decisions.setClosure(supplierId, contractId, id, rightVersion.version, "keep-open");
    setRecentlyClosed((m) => { const n = { ...m }; delete n[id]; return n; });
  };


  if (!initiative || !supplier || !contract || !v1) return null;

  // --- Top summary bar (always based on v1 review) ---------------------------
  const requestedCount = Object.values(allDecisions).filter(
    (s) => s.roundDecisions["v1"] === "request-update",
  ).length;
  const v1Counts = {
    high: v1.clauses.filter((c) => c.severity === "high" && !c.resolved).length,
    medium: v1.clauses.filter((c) => c.severity === "medium" && !c.resolved).length,
    low: v1.clauses.filter((c) => c.severity === "low" && !c.resolved).length,
    requested: requestedCount,
    total: v1.clauses.length,
  };
  const targetCounts = comparisonModel.severityCounts;

  // --- Filter applied to comparison sections ---------------------------------
  const matchesSearch = (id: string) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const def = CLAUSE_FRAMEWORK.find((c) => c.id === id);
    if (!def) return false;
    return (
      def.title.toLowerCase().includes(q) ||
      def.category.toLowerCase().includes(q) ||
      `c${def.number}`.includes(q)
    );
  };
  const matchesCategory = (id: string) =>
    !activeCategory || clauseCategory(id) === activeCategory;

  const detail = detailClauseId
    ? {
        id: detailClauseId,
        prev: leftVersion?.clauses.find((c) => c.id === detailClauseId),
        curr: rightVersion?.clauses.find((c) => c.id === detailClauseId),
        state: stateOf(detailClauseId),
      }
    : null;
  const clausesRequiringAction = comparisonSections.open.length + comparisonSections.newIssues.length;
  const severityQuickFilter =
    quickFilter === "high" || quickFilter === "medium" || quickFilter === "low" ? quickFilter : null;
  const currentDecision = rightVersion ? decisions_[rightVersion.version] ?? null : null;
  const changePillFor = (id: string, prev?: ClauseResult, curr?: ClauseResult): ChangePillResult => {
    const state = allDecisions[id];
    return determineChangePill({
      clause: curr,
      previousClause: prev,
      wasRequestedInPreviousRound: wasRequestedByVersion(state, versions, leftVersion?.version),
    });
  };
  const jumpToClause = (id: string) => {
    setTab(versions.length < 2 ? "review" : "changes");
    setFilter("all");
    setQuickFilter(null);
    setSearch("");
    setActiveCategory(null);
    if (rightVersion) setReviewVersionLabel(rightVersion.version);
    setHighlightClauseId(id);
    setTimeout(() => {
      document.getElementById(`clause-row-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    window.setTimeout(() => {
      setHighlightClauseId((current) => (current === id ? null : current));
    }, 2200);
  };

  const toggleQuickFilter = (next: QuickFilterKey) => {
    const isClearing = quickFilter === next;
    setQuickFilter(isClearing ? null : next);

    if ((next === "high" || next === "medium" || next === "low") && !isClearing) {
      setFilter("all");
    }
    if (next === "need-action") {
      setTab("changes");
      setFilter("all");
    }
    if (next === "changes") {
      setTab("changes");
      setFilter(isClearing ? "all" : "new-issues");
    }
  };

  const matchesQuickSeverity = (clause?: ClauseResult) =>
    !severityQuickFilter || clause?.severity === severityQuickFilter;
  const filterRowsByQuickSeverity = (rows: { id: string; prev?: ClauseResult; curr?: ClauseResult }[]) =>
    severityQuickFilter ? rows.filter((row) => matchesQuickSeverity(row.curr ?? row.prev)) : rows;

  const openRows = filterRowsByQuickSeverity(
    comparisonSections.open.filter((r) => matchesSearch(r.id) && matchesCategory(r.id)),
  );
  const newIssueRows = filterRowsByQuickSeverity(
    comparisonSections.newIssues.filter((r) => matchesSearch(r.id) && matchesCategory(r.id)),
  );
  const closedRows = filterRowsByQuickSeverity(
    comparisonSections.closed.filter((r) => matchesSearch(r.id) && matchesCategory(r.id)),
  );
  const unmarkedRows = filterRowsByQuickSeverity(
    comparisonSections.unmarked.filter((r) => matchesSearch(r.id) && matchesCategory(r.id)),
  );
  const showOpenSection = (filter === "all" || filter === "open") && quickFilter !== "changes";
  const showNewIssueSection =
    (filter === "all" || filter === "new-issues") &&
    (quickFilter === null || quickFilter === "need-action" || quickFilter === "changes" || !!severityQuickFilter);
  const showClosedSection =
    (filter === "all" || filter === "closed") && quickFilter !== "need-action" && quickFilter !== "changes";
  const showUnmarkedSection =
    (filter === "all" || filter === "unmarked") && quickFilter !== "need-action" && quickFilter !== "changes";
  const compactBackLabel = backLabel ?? `Back to ${supplier.name}`;
  const switchMode = (nextMode: ClauseIqMode) => {
    const params = new URLSearchParams(searchParams);
    params.set("mode", nextMode);
    if (nextMode === "comparison" && versions.length >= 2) {
      params.set("tab", normalizeComparisonTab(params.get("tab") ?? storedComparisonTab));
    }
    if (nextMode === "history") {
      params.set("filter", historyFilter);
      params.set("sort", historySort);
    }
    setSearchParams(params, { replace: false });
  };
  const exportCurrentComparison = () => {
    if (!leftVersion || !rightVersion) return;
    const csv = exportContractCsv(
      {
        initiativeName: initiative.name,
        supplierName: supplier.name,
        contractName: contract.name,
        leftLabel: leftVersion.version,
        rightLabel: rightVersion.version,
      },
      versions,
      stateOf,
    );
    downloadCsv(`${supplier.name}-${contract.name}-${leftVersion.version}-${rightVersion.version}.csv`, csv);
    toast({ title: "Export ready", description: "Verification CSV downloaded." });
  };

  const hasVersionComparison = comparisonModel.hasComparison;

  return (
    <div className="min-h-screen bg-background">
      {compactHeader ? (
        <div className="sticky top-0 z-30 border-b border-[rgba(0,0,0,0.08)] bg-white">
          <CompactContractTopbar
            backLabel={compactBackLabel}
            onBack={onBack}
            contractName={contract.name}
            contractType={contract.type}
            metadata={`${latest?.version ?? "v1"} · ${versions.length} round${versions.length === 1 ? "" : "s"} · ${supplier.name}${latest ? ` · Updated ${formatShortDate(latest.uploadedAt)}` : ""}`}
            supplierId={supplierId}
            supplierName={supplier.name}
            onExport={exportCurrentComparison}
            exportDisabled={versions.length < 2}
            onRunAnalysis={onRunAnalysisAgain ?? (() => setUploadOpen(true))}
          />
          <ModeSwitcher mode={mode} onChange={switchMode} />
          {mode === "comparison" ? (
            <ComparisonHeader
              versions={versions}
              pair={pair}
              onPairChange={setPair}
              hasVersionComparison={hasVersionComparison}
              changeTracking={changeTracking}
              quickFilter={quickFilter}
              onToggleQuickFilter={toggleQuickFilter}
              onClearQuickFilter={() => setQuickFilter(null)}
              targetCounts={targetCounts}
              panel={comparisonModel.panel}
            />
          ) : (
            <HistoryHeader
              versions={versions}
              model={historyModel}
              activeFilter={historyFilter}
              activeSort={historySort}
              onFilterChange={(next) => updateHistoryState({ filter: next })}
              onSortChange={(next) => updateHistoryState({ sort: next })}
            />
          )}
        </div>
      ) : (
        <>
          {/* Top header */}
          <div className="border-b border-border bg-card sticky top-0 z-30">
            <div className="max-w-[1400px] mx-auto px-6 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button onClick={onBack} className="inline-flex h-8 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                  <ChevronLeft className="w-4 h-4" /> {backLabel ?? `Back to ${supplier.name}`}
                </button>
                <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
                  <SupplierGroupingPopover supplierId={supplierId} supplierName={supplier.name} />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 gap-1.5"
                    disabled={versions.length < 2}
                    onClick={exportCurrentComparison}
                  >
                    <Download className="w-3.5 h-3.5" /> Export
                  </Button>
                  <Button size="sm" variant="default" className="h-9 gap-1.5" onClick={() => setUploadOpen(true)}>
                    <Upload className="w-3.5 h-3.5" /> Upload New Version
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 gap-1.5"
                    disabled={versions.length === 0}
                    onClick={() => latest && setDeleteTarget(latest.version)}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Version
                  </Button>
                </div>
              </div>
              <div className="mt-2 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px] lg:items-end">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {initiative.name} · {initiative.reference} · {supplier.name}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">{contract.name}</h1>
                    <Badge variant="outline">{contract.type}</Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground">
                      {versions.length} round{versions.length !== 1 ? "s" : ""}
                      {latest && <> · Latest updated {latest.uploadedAt}</>}
                    </span>
                  </div>
                  {versions.length > 0 && (
                    <p className="mt-2 max-w-3xl text-xs text-muted-foreground">
                      Use the <span className="font-semibold text-foreground">Review</span> tab to mark which clauses need to change, then switch to <span className="font-semibold text-foreground">Changes</span> to see how the supplier responded.
                    </p>
                  )}
                </div>

                <div className="w-full rounded-lg border border-border bg-muted/30 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Review summary</p>
                    {versions.length >= 2 && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{clausesRequiringAction}</span>{" "}
                        clause{clausesRequiringAction === 1 ? "" : "s"} require action
                      </p>
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    <SummaryStat label="High" value={v1Counts.high} tone="text-destructive" />
                    <SummaryStat label="Medium" value={v1Counts.medium} tone="text-warning" />
                    <SummaryStat label="Low" value={v1Counts.low} tone="text-success" />
                    <SummaryStat label="Requested" value={v1Counts.requested} tone="text-primary" />
                    <SummaryStat label="Total" value={v1Counts.total} tone="text-foreground" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Verdict banner — only when at least 2 versions exist */}
      {!compactHeader && versions.length >= 2 && leftVersion && rightVersion && leftVersion.version !== rightVersion.version && (
        <div className="max-w-[1600px] mx-auto px-6 pt-6">
          <VersionVerdictBanner
            leftVersion={leftVersion}
            rightVersion={rightVersion}
            versions={versions}
            allDecisions={allDecisions}
            decision={decisions_[rightVersion.version] ?? null}
            onDecision={(d) =>
              setDecisions_((prev) => ({ ...prev, [rightVersion.version]: d }))
            }
            onJumpToOpen={() => {
              setTab("changes");
              setFilter("open");
              setTimeout(() => document.getElementById("comparison-buckets")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
            }}
            onJumpToChanges={() => {
              setTab("changes");
              setFilter("new-issues");
              setTimeout(() => document.getElementById("comparison-buckets")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
            }}
          />
        </div>
      )}

      {/* Negotiation trend strip — V1 → Vn (TASK-07) */}
      {!compactHeader && versions.length >= 2 && (
        <div className="max-w-[1600px] mx-auto px-6 pt-4">
          <NegotiationTrendStrip
            versions={versions}
            allDecisions={allDecisions}
            activeVersion={rightVersion?.version}
            onJump={(v) => {
              const idx = versions.findIndex((x) => x.version === v);
              if (idx <= 0) return;
              setPair({ left: versions[idx - 1].version, right: v });
              setTab("changes");
            }}
          />
        </div>
      )}

      {mode === "history" ? (
        <div className="mx-auto grid max-w-[1600px] grid-cols-[180px_1fr] gap-0 px-6 py-0">
          <HistoryCategorySidebar
            categories={historyModel.categories}
            total={historyModel.rows.length}
            activeCategory={historyCategory}
            onSelectCategory={(category) => updateHistoryState({ cat: category })}
          />
          <HistoryRoundTable
            versions={versions}
            rows={historyModel.filteredRows}
            onOpenDetail={setDetailClauseId}
            highlightedId={highlightClauseId}
          />
        </div>
      ) : (
        <div className="mx-auto grid max-w-[1600px] grid-cols-[260px_1fr] gap-6 px-6 py-6">
          <ClauseNavigator
            versions={versions}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            decisions={allDecisions}
            rightVersion={rightVersion}
            leftVersion={leftVersion}
            compactMode={compactHeader}
          />

          <div className="min-w-0 space-y-4">
            {versions.length >= 2 && (
              <div className="flex items-center gap-5 border-b border-border px-1">
                <ComparisonTabButton
                  active={tab === "changes"}
                  icon={<IconArrowsDiff size={14} stroke={1.8} />}
                  count={openRows.length + newIssueRows.length + closedRows.length + unmarkedRows.length}
                  onClick={() => setTab("changes")}
                >
                  Changes
                </ComparisonTabButton>
                <ComparisonTabButton
                  active={tab === "all"}
                  icon={<IconList size={14} stroke={1.8} />}
                  count={targetCounts.total}
                  onClick={() => setTab("all")}
                >
                  All clauses
                </ComparisonTabButton>
              </div>
            )}

            <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-[#f8f7f5] px-3 py-2">
              {tab === "changes" && versions.length >= 2 ? (
                <p className="text-[11px] font-medium text-muted-foreground">
                  Sort: Severity impact
                </p>
              ) : (
                <ReviewGuidance versionLabel={reviewVersion?.version ?? reviewVersionLabel} compact />
              )}
              <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
                <div className="relative min-w-[180px] flex-1 sm:max-w-[260px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filter by name or ID..."
                    className="h-8 bg-card pl-8 text-xs"
                  />
                </div>
                {tab === "changes" && versions.length >= 2 && (
                  <>
                    <Select value={filter} onValueChange={(v) => setFilter(v as FilterKey)}>
                      <SelectTrigger className="h-8 w-[160px] bg-card text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All buckets</SelectItem>
                        <SelectItem value="open">Open Items</SelectItem>
                        <SelectItem value="new-issues">New Changes</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                        <SelectItem value="unmarked">Unmarked clauses</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="ghost" className="h-8 text-[11px] text-muted-foreground" onClick={resetPair}>
                      Reset to latest
                    </Button>
                  </>
                )}
              </div>
            </div>

            {tab === "review" || versions.length < 2 || tab === "all" ? (
              <ReviewScreen
                version={tab === "all" ? (rightVersion ?? reviewVersion ?? v1) : (reviewVersion ?? v1)}
                stateOf={stateOf}
                activeCategory={activeCategory}
                search={search}
                quickSeverityFilter={severityQuickFilter}
                onSetNoAction={(id) =>
                  decisions.changeDecision(supplierId, contractId, id, (rightVersion ?? reviewVersion ?? v1).version, "no-action")
                }
                onStartDraft={(id, initialDraft) =>
                  decisions.startDraftRequest(supplierId, contractId, id, (rightVersion ?? reviewVersion ?? v1).version, initialDraft)
                }
                onUpdateDraft={(id, patch) =>
                  decisions.updateDraftRequestText(supplierId, contractId, id, (rightVersion ?? reviewVersion ?? v1).version, patch)
                }
                onCancelDraft={(id) =>
                  decisions.cancelDraftRequest(supplierId, contractId, id, (rightVersion ?? reviewVersion ?? v1).version)
                }
                onSubmitDraft={(id) =>
                  decisions.submitDraftRequest(supplierId, contractId, id, (rightVersion ?? reviewVersion ?? v1).version)
                }
                onOpenDetail={(id) => setDetailClauseId(id)}
                highlightedId={highlightClauseId}
              />
            ) : leftVersion && rightVersion && leftVersion.version !== rightVersion.version ? (
              <div className="space-y-3" id="comparison-buckets">
                <ComparisonSection
                  title="Open Items"
                  description="Clauses you previously asked the supplier to change."
                  accent="primary"
                  rows={openRows}
                  leftLabel={leftVersion.version}
                  rightLabel={rightVersion.version}
                  visible={showOpenSection}
                  bucket="open"
                  changePillOf={(id, prev, curr) => changePillFor(id, prev, curr)}
                  closureOf={(id) => stateOf(id).closures[rightVersion.version]}
                  requestOf={(id) => {
                    const latest = getLatestRequest(stateOf(id), leftVersion.version);
                    return latest ? { ...latest.request, fromVersion: latest.version } : {};
                  }}
                  onClose={(id) => {
                    const display = leftVersion.clauses.find((c) => c.id === id) ?? rightVersion.clauses.find((c) => c.id === id);
                    const prev = stateOf(id).closures[rightVersion.version];
                    closeWithUndo(id, display?.title ?? id.toUpperCase(), prev);
                  }}
                  onKeepOpen={(id) => decisions.setClosure(supplierId, contractId, id, rightVersion.version, "keep-open")}
                  onFollowUp={(id) => decisions.setClosure(supplierId, contractId, id, rightVersion.version, "follow-up")}
                  onOpenDetail={setDetailClauseId}
                  pinnedIds={pinnedClauseIds}
                  onTogglePin={togglePin}
                  recentlyClosed={recentlyClosed}
                  onUndoClose={undoClose}
                />
                <ComparisonSection
                  title="New Changes"
                  description="Material changes the supplier made without being asked, plus clauses that didn't exist before."
                  accent="destructive"
                  rows={newIssueRows}
                  leftLabel={leftVersion.version}
                  rightLabel={rightVersion.version}
                  visible={showNewIssueSection}
                  bucket="new"
                  changePillOf={(id, prev, curr) => changePillFor(id, prev, curr)}
                  closureOf={() => undefined}
                  requestOf={() => ({})}
                  onClose={(id) => decisions.setRoundDecision(supplierId, contractId, id, rightVersion.version, "no-action")}
                  onKeepOpen={(id) => decisions.setRoundDecision(supplierId, contractId, id, rightVersion.version, "request-update")}
                  onOpenDetail={setDetailClauseId}
                  pinnedIds={pinnedClauseIds}
                  onTogglePin={togglePin}
                />
                <ComparisonSection
                  title="Closed"
                  description="Clauses you marked as resolved for this round."
                  accent="success"
                  rows={closedRows}
                  leftLabel={leftVersion.version}
                  rightLabel={rightVersion.version}
                  visible={showClosedSection}
                  bucket="closed"
                  changePillOf={(id, prev, curr) => changePillFor(id, prev, curr)}
                  closureOf={(id) => stateOf(id).closures[rightVersion.version]}
                  requestOf={(id) => {
                    const latest = getLatestRequest(stateOf(id), leftVersion.version);
                    return latest ? { ...latest.request, fromVersion: latest.version } : {};
                  }}
                  onClose={(id) => decisions.setClosure(supplierId, contractId, id, rightVersion.version, "closed")}
                  onKeepOpen={(id) => decisions.setClosure(supplierId, contractId, id, rightVersion.version, "keep-open")}
                  onOpenDetail={setDetailClauseId}
                  pinnedIds={pinnedClauseIds}
                  onTogglePin={togglePin}
                />
                <UnmarkedSection
                  rows={unmarkedRows}
                  leftLabel={leftVersion.version}
                  rightLabel={rightVersion.version}
                  visible={showUnmarkedSection}
                  defaultOpen={filter === "unmarked"}
                  requestOf={(id) => stateOf(id).requests[rightVersion.version] ?? {}}
                  draftOf={(id) => stateOf(id).draftRequests?.[rightVersion.version] ?? {}}
                  isRequested={(id) => stateOf(id).roundDecisions[rightVersion.version] === "request-update"}
                  isDrafting={(id) => Boolean(stateOf(id).draftRequests?.[rightVersion.version])}
                  onRequestChange={(id) => decisions.startDraftRequest(supplierId, contractId, id, rightVersion.version)}
                  onUpdateText={(id, patch) => decisions.updateDraftRequestText(supplierId, contractId, id, rightVersion.version, patch)}
                  onCancelDraft={(id) => decisions.cancelDraftRequest(supplierId, contractId, id, rightVersion.version)}
                  onSubmitDraft={(id) => decisions.submitDraftRequest(supplierId, contractId, id, rightVersion.version)}
                  onOpenDetail={setDetailClauseId}
                />
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-card p-12 text-center text-sm text-muted-foreground">
                Select two different versions to compare.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Unified clause slide-over */}
      {detail && (
        <ClauseSlideOver
          clauseId={detail.id}
          prev={detail.prev}
          curr={detail.curr}
          leftLabel={leftVersion?.version ?? "v1"}
          rightLabel={rightVersion?.version ?? "v1"}
          mode={mode}
          versions={versions}
          state={detail.state}
          targetVersion={rightVersion?.version ?? "v1"}
          changePill={changePillFor(detail.id, detail.prev, detail.curr)}
          onClose={() => setDetailClauseId(null)}
          onViewHistory={(id) => {
            const params = new URLSearchParams(searchParams);
            params.set("mode", "history");
            params.set("filter", historyFilter);
            params.set("sort", historySort);
            params.set("clause", id);
            setSearchParams(params, { replace: false });
            setHighlightClauseId(id);
            setTimeout(() => document.getElementById(`history-row-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
            window.setTimeout(() => setHighlightClauseId((current) => (current === id ? null : current)), 2200);
          }}
          onCloseClause={(id) => {
            decisions.setClosure(supplierId, contractId, id, rightVersion?.version ?? "v1", "closed");
            setDetailClauseId(null);
          }}
          onKeepOpen={(id) =>
            decisions.setClosure(supplierId, contractId, id, rightVersion?.version ?? "v1", "keep-open")
          }
          onMarkNewIssue={(id) =>
            decisions.setRoundDecision(supplierId, contractId, id, rightVersion?.version ?? "v1", "request-update")
          }
        />
      )}

      {/* Upload new version */}
      <UploadVersionDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        initiativeName={initiative.name}
        initiativeRef={initiative.reference}
        supplierName={supplier.name}
        contractName={contract.name}
        nextVersionLabel={`v${versions.length + 1}`}
        onConfirm={onUploadVersion}
      />

      {/* Accept version confirmation */}
      <AlertDialog open={acceptConfirmOpen} onOpenChange={setAcceptConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept {rightVersion?.version.toUpperCase() ?? "this version"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This marks the current supplier version as accepted for this prototype review. You can undo the status from the expanded overview panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                if (!rightVersion) return;
                setDecisions_((prev) => ({ ...prev, [rightVersion.version]: "accepted" }));
                setAcceptConfirmOpen(false);
              }}
            >
              Accept Version
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete version confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Version {deleteTarget ? parseInt(deleteTarget.replace("v", ""), 10) : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove Version {deleteTarget ? parseInt(deleteTarget.replace("v", ""), 10) : ""} and update all comparisons and tracking.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && onDeleteVersion(deleteTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Version
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---- Upload dialog ---------------------------------------------------------

function UploadVersionDialog({
  open, onOpenChange, initiativeName, initiativeRef, supplierName, contractName, nextVersionLabel, onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initiativeName: string;
  initiativeRef: string;
  supplierName: string;
  contractName: string;
  nextVersionLabel: string;
  onConfirm: (file: File | null, label: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState(nextVersionLabel);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (open) { setFile(null); setLabel(nextVersionLabel); setProcessing(false); }
  }, [open, nextVersionLabel]);

  const handleConfirm = () => {
    if (!file) return;
    setProcessing(true);
    setTimeout(() => { onConfirm(file, label); setProcessing(false); }, 900);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Contract Version</DialogTitle>
          <DialogDescription>
            Upload the supplier's updated contract to compare changes against the previous version.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-md border border-border bg-muted/30 p-3 text-xs space-y-1">
            <p><span className="text-muted-foreground">Initiative:</span> <span className="font-medium text-foreground"> {initiativeName} · {initiativeRef}</span></p>
            <p><span className="text-muted-foreground">Supplier:</span> <span className="font-medium text-foreground"> {supplierName}</span></p>
            <p><span className="text-muted-foreground">Contract:</span> <span className="font-medium text-foreground"> {contractName}</span></p>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase">Version label</label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase">Contract file</label>
            <label className="flex items-center justify-between gap-3 rounded-md border border-dashed border-border bg-card px-3 py-3 text-sm cursor-pointer hover:border-primary/40">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="truncate text-foreground">{file ? file.name : "Choose a PDF, DOCX, or TXT file"}</span>
              </div>
              <span className="text-xs text-primary font-semibold shrink-0">Browse</span>
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!file || !label || processing} className="gap-1.5">
            {processing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing…</> : <><Upload className="w-3.5 h-3.5" /> Upload &amp; analyse</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- pieces -----------------------------------------------------------------

function formatShortDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function CompactContractTopbar({
  backLabel,
  onBack,
  contractName,
  contractType,
  metadata,
  supplierId,
  supplierName,
  onExport,
  exportDisabled,
  onRunAnalysis,
}: {
  backLabel: string;
  onBack: () => void;
  contractName: string;
  contractType: string;
  metadata: string;
  supplierId: string;
  supplierName: string;
  onExport: () => void;
  exportDisabled: boolean;
  onRunAnalysis: () => void;
}) {
  return (
    <div className="flex h-10 items-center gap-3 border-b border-[rgba(0,0,0,0.08)] px-3">
      <button
        onClick={onBack}
        className="inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-primary hover:underline"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> {backLabel.replace(/^Back to /, "Back")}
      </button>
      <div className="h-3.5 w-px bg-border" aria-hidden />
      <div className="flex min-w-0 items-center gap-2">
        <h1 className="truncate text-sm font-medium text-foreground">{contractName}</h1>
        <Badge variant="outline" className="h-5 rounded-full bg-muted/50 px-2 text-[9px] font-medium">
          {contractType}
        </Badge>
        <span className="hidden truncate text-[11px] text-muted-foreground lg:inline">{metadata}</span>
        <SupplierGroupingLink supplierId={supplierId} supplierName={supplierName} />
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Button size="sm" variant="outline" className="h-7 gap-1.5 px-3 text-xs" disabled={exportDisabled} onClick={onExport}>
          <Download className="h-3.5 w-3.5" /> Export
        </Button>
        <Button size="sm" className="h-7 gap-1.5 bg-[#1a2744] px-3 text-xs text-white hover:bg-[#243454]" onClick={onRunAnalysis}>
          <RotateCcw className="h-3.5 w-3.5" /> Run analysis
        </Button>
        <button type="button" className="grid h-7 w-7 place-items-center rounded-md border border-border text-muted-foreground hover:bg-muted">
          <span aria-hidden>...</span>
          <span className="sr-only">More actions</span>
        </button>
      </div>
    </div>
  );
}

function ModeSwitcher({ mode, onChange }: { mode: ClauseIqMode; onChange: (mode: ClauseIqMode) => void }) {
  return (
    <div className="flex items-center border-b border-[rgba(0,0,0,0.08)] bg-white px-3 py-1.5">
      <div className="inline-flex overflow-hidden rounded-md border border-border">
        {([
          ["comparison", <IconArrowsDiff key="comparison-icon" size={13} stroke={1.8} />, "Comparison"],
          ["history", <IconTimeline key="history-icon" size={13} stroke={1.8} />, "History"],
        ] as const).map(([value, icon, label]) => {
          const active = mode === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onChange(value)}
              className={`inline-flex h-7 items-center gap-1.5 border-r border-border px-3 text-[11px] font-medium last:border-r-0 ${
                active ? "bg-[#1a2744] text-white" : "bg-white text-muted-foreground hover:text-foreground"
              }`}
            >
              {icon}
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ComparisonHeader({
  versions,
  pair,
  onPairChange,
  hasVersionComparison,
  changeTracking,
  quickFilter,
  onToggleQuickFilter,
  onClearQuickFilter,
  targetCounts,
  panel,
}: {
  versions: ContractVersion[];
  pair: { left: string; right: string };
  onPairChange: (pair: { left: string; right: string }) => void;
  hasVersionComparison: boolean;
  changeTracking: ReturnType<typeof deriveComparisonModel>["changeTracking"];
  quickFilter: QuickFilterKey | null;
  onToggleQuickFilter: (key: QuickFilterKey) => void;
  onClearQuickFilter: () => void;
  targetCounts: ReturnType<typeof deriveComparisonModel>["severityCounts"];
  panel: VersionPanelData;
}) {
  return (
    <>
      {versions.length >= 2 && (
        <div className="flex h-8 items-center gap-2 border-b border-[rgba(0,0,0,0.08)] px-3 text-[10px] text-muted-foreground">
          <span>Comparing</span>
          <PairSelector versions={versions} pair={pair} onChange={onPairChange} compact />
        </div>
      )}
      <div className="flex h-8 items-center gap-2 border-b border-[rgba(0,0,0,0.08)] bg-[#f8f7f5] px-3 text-[11px] text-muted-foreground">
        {hasVersionComparison && (
          <>
            <CompactStripStat active={quickFilter === "need-action"} onClick={() => onToggleQuickFilter("need-action")}>
              {changeTracking.notMet === 0 && changeTracking.requestedTotal > 0 ? (
                <span className="font-medium text-[#3B6D11]">All met</span>
              ) : (
                <><strong>{changeTracking.met}</strong> of <strong>{changeTracking.requestedTotal}</strong> met</>
              )}
            </CompactStripStat>
            <span className="text-muted-foreground">·</span>
            <Popover>
              <PopoverTrigger asChild>
                <CompactStripStat active={quickFilter === "changes"} onClick={() => undefined}>
                  <strong>{changeTracking.supplierChanges}</strong> {changeTracking.supplierChanges === 1 ? "change" : "changes"}
                </CompactStripStat>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-56 p-3 text-xs">
                <p className="font-medium text-foreground">Supplier-initiated changes</p>
                <p className="mt-1 text-muted-foreground">
                  {changeTracking.improved} improved · {changeTracking.regressed} regressed · {changeTracking.new} {NEW_CHANGE_LABEL.toLowerCase()}
                </p>
                <Button size="sm" variant="outline" className="mt-3 h-7 w-full text-[11px]" onClick={() => onToggleQuickFilter("changes")}>
                  Show New Changes
                </Button>
              </PopoverContent>
            </Popover>
            <CompactDivider />
          </>
        )}
        <CompactStripStat active={quickFilter === "high"} color="#A32D2D" onClick={() => onToggleQuickFilter("high")}>
          <strong>{targetCounts.high}</strong> high
        </CompactStripStat>
        <CompactStripStat active={quickFilter === "medium"} color="#854F0B" onClick={() => onToggleQuickFilter("medium")}>
          <strong>{targetCounts.medium}</strong> med
        </CompactStripStat>
        <CompactStripStat active={quickFilter === "low"} color="#5F5E5A" onClick={() => onToggleQuickFilter("low")}>
          <strong>{targetCounts.low}</strong> low
        </CompactStripStat>
        <CompactStripStat onClick={onClearQuickFilter}>
          <strong>{targetCounts.total}</strong> total
        </CompactStripStat>
        <div className="ml-auto rounded-md border border-border bg-white px-2 py-0.5 text-[10px]">
          <span className="mr-1 uppercase text-muted-foreground">Score</span>
          <strong className="text-[13px] text-foreground">{panel.current.score}</strong>
          <span className={panel.delta > 0 ? "ml-1 text-[#3B6D11]" : panel.delta < 0 ? "ml-1 text-[#A32D2D]" : "ml-1 text-muted-foreground"}>
            {panel.delta > 0 ? `↑+${panel.delta}` : panel.delta < 0 ? `↓-${Math.abs(panel.delta)}` : "→0"}
          </span>
        </div>
      </div>
      <HybridVersionMovementPanel data={panel} />
    </>
  );
}

function HistoryHeader({
  versions,
  model,
  activeFilter,
  activeSort,
  onFilterChange,
  onSortChange,
}: {
  versions: ContractVersion[];
  model: ReturnType<typeof deriveHistoryModel>;
  activeFilter: HistoryFilter;
  activeSort: HistorySort;
  onFilterChange: (filter: HistoryFilter) => void;
  onSortChange: (sort: HistorySort) => void;
}) {
  const first = versions[0];
  const latest = versions.at(-1);
  return (
    <>
      <div className="flex h-8 items-center gap-1.5 border-b border-[rgba(0,0,0,0.08)] bg-[#FAEEDA]/40 px-3 text-[10px] font-medium text-[#633806]">
        <IconInfoCircle size={13} stroke={1.8} />
        Showing all {versions.length} rounds · {first?.version ?? "v1"} through {latest?.version ?? "v1"}
        {first && latest && <> · {formatShortDate(first.uploadedAt)} to {formatShortDate(latest.uploadedAt)}</>}
      </div>
      <div className="grid grid-cols-4 gap-3 border-b border-[rgba(0,0,0,0.08)] bg-white px-3 py-3">
        <HistoryStatCard value={model.stats.totalClauses} label="Total clauses" trend={`across ${model.stats.roundCount} rounds`} />
        <HistoryStatCard value={model.stats.stillOpen} label="Still open" trend={`after ${model.stats.roundCount} rounds`} tone="danger" />
        <HistoryStatCard value={model.stats.avgRoundsToResolve} label="Avg rounds to resolve" trend="computed from met clauses" tone="success" />
        <HistoryStatCard value={`${model.stats.settledByRound3Pct}%`} label="Settled by round 3" trend="benchmark 65%" tone={model.stats.settledByRound3Pct >= 65 ? "success" : "danger"} />
      </div>
      <div className="flex items-center gap-2 border-b border-[rgba(0,0,0,0.08)] bg-[#f8f7f5] px-3 py-2">
        {(Object.keys(historyFilterLabels) as HistoryFilter[]).map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => onFilterChange(filter)}
            className={`inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[10px] font-medium ${
              activeFilter === filter
                ? "bg-[#1a2744] text-white"
                : "border border-border bg-white text-muted-foreground hover:text-foreground"
            }`}
          >
            {historyFilterLabels[filter]}
            <span className={`rounded-full px-1.5 py-px text-[9px] ${activeFilter === filter ? "bg-white/20" : "bg-muted"}`}>
              {model.filterCounts[filter]}
            </span>
          </button>
        ))}
        <Select value={activeSort} onValueChange={(value) => onSortChange(value as HistorySort)}>
          <SelectTrigger className="ml-auto h-8 w-[210px] bg-white text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="contentious">Sort: Most contentious</SelectItem>
            <SelectItem value="clause_id">Sort: Clause ID</SelectItem>
            <SelectItem value="current_status">Sort: Current status</SelectItem>
            <SelectItem value="rounds_to_resolve">Sort: Rounds to resolve</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

function HistoryStatCard({ value, label, trend, tone = "neutral" }: { value: ReactNode; label: string; trend: string; tone?: "neutral" | "success" | "danger" }) {
  const trendClass = tone === "success" ? "text-[#3B6D11]" : tone === "danger" ? "text-[#A32D2D]" : "text-muted-foreground";
  return (
    <div className="rounded-md bg-[#f8f7f5] px-3 py-2">
      <p className="text-lg font-medium tabular-nums text-foreground">{value}</p>
      <p className="text-[9px] font-medium uppercase text-muted-foreground">{label}</p>
      <p className={`mt-1 text-[9px] ${trendClass}`}>{trend}</p>
    </div>
  );
}

function ComparisonTabButton({ active, icon, count, onClick, children }: { active: boolean; icon: ReactNode; count: number; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-10 items-center gap-1.5 border-b-2 text-[12px] font-medium ${
        active ? "border-[#1a2744] text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {children}
      <span className="rounded-full bg-muted px-1.5 py-px text-[9px] text-muted-foreground">{count}</span>
    </button>
  );
}


const CompactStripStat = forwardRef<HTMLButtonElement, {
  active?: boolean;
  color?: string;
  onClick?: () => void;
  children: ReactNode;
}>(({ active, color, onClick, children }, ref) => (
  <button
    ref={ref}
    type="button"
    onClick={onClick}
    style={{ color }}
    className={`shrink-0 rounded px-1.5 py-0.5 transition-colors hover:bg-white ${
      active ? "bg-white shadow-sm" : ""
    }`}
  >
    {children}
  </button>
));
CompactStripStat.displayName = "CompactStripStat";

function CompactDivider() {
  return <span className="h-3 w-px shrink-0 bg-border" aria-hidden />;
}

const changePillConfig: Record<ChangePillStatus, {
  label: string;
  className: string;
  Icon: typeof IconCircleCheck;
}> = {
  met: {
    label: "Met",
    className: "bg-[#EAF3DE] text-[#27500A]",
    Icon: IconCircleCheck,
  },
  not_met: {
    label: "Not met",
    className: "bg-[#FCEBEB] text-[#791F1F]",
    Icon: IconCircleX,
  },
  improved: {
    label: "Improved",
    className: "bg-[#E1F5EE] text-[#085041]",
    Icon: IconTrendingUp,
  },
  regressed: {
    label: "Regressed",
    className: "bg-[#FAEEDA] text-[#633806]",
    Icon: IconTrendingDown,
  },
  new: {
    label: NEW_CHANGE_LABEL,
    className: "bg-[#E6F1FB] text-[#0C447C]",
    Icon: IconPlus,
  },
};

function ChangePillBadge({ result }: { result: ChangePillResult }) {
  if (!result.status) return null;
  const config = changePillConfig[result.status];
  const Icon = config.Icon;
  const lowConfidence =
    (result.status === "improved" || result.status === "regressed") &&
    typeof result.confidence === "number" &&
    result.confidence < CHANGE_DIRECTION_CONFIDENCE_THRESHOLD;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[10px] px-1.5 py-px text-[9px] font-medium ${config.className}`}
    >
      <Icon size={11} stroke={1.8} />
      {config.label}
      {lowConfidence && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex cursor-help items-center">
              <IconHelp size={10} stroke={1.8} />
            </span>
          </TooltipTrigger>
          <TooltipContent className="text-xs">
            AI confidence: {result.confidence}%. Verify before accepting.
          </TooltipContent>
        </Tooltip>
      )}
    </span>
  );
}

function DecisionBadge({ decision }: { decision: RoundDecision }) {
  if (decision === "request-update") {
    return (
      <span className="inline-flex cursor-default items-center gap-1 rounded-full bg-primary px-2 py-1 text-[10px] font-medium text-primary-foreground">
        <Sparkles className="h-3 w-3" />
        Requested
      </span>
    );
  }

  return (
    <span className="inline-flex cursor-default items-center gap-1 rounded-full bg-[#EAF3DE] px-2 py-1 text-[10px] font-medium text-[#27500A]">
      <CheckCircle2 className="h-3 w-3" />
      No Action
    </span>
  );
}

function OverviewSectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

function ComparisonOverviewPanel({
  state,
  data,
  pair,
  onExpand,
}: {
  state: PanelState;
  data: VersionPanelData;
  pair: VersionComparisonPair;
  onExpand: () => void;
}) {
  if (state === "closed") return null;
  if (state === "collapsed") {
    const deltaLabel = data.delta > 0 ? `+${data.delta}` : data.delta < 0 ? `−${Math.abs(data.delta)}` : "0";
    const deltaColor = data.delta > 0 ? "#3B6D11" : data.delta < 0 ? "#A32D2D" : "hsl(var(--muted-foreground))";
    return (
      <div className="flex h-7 items-center gap-2 border-b border-[rgba(0,0,0,0.08)] bg-white px-4 text-[11px]">
        <span className="shrink-0 font-medium text-muted-foreground">
          {data.previous ? `${pair.from} → ${pair.to}` : "First analysis"}
        </span>
        {data.previous ? (
          <>
            <MiniDistributionBar distribution={data.previous.distribution} muted />
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <MiniDistributionBar distribution={data.current.distribution} />
            <span className="shrink-0 font-medium tabular-nums" style={{ color: deltaColor }}>
              {deltaLabel} pts
            </span>
            <CompactDivider />
            {data.movement.improved > 0 && (
              <span className="shrink-0 font-medium text-[#3B6D11]">↑ {data.movement.improved} improved</span>
            )}
            {data.movement.declined > 0 && (
              <span className="shrink-0 font-medium text-[#A32D2D]">↓ {data.movement.declined} declined</span>
            )}
          </>
        ) : (
          <MiniDistributionBar distribution={data.current.distribution} />
        )}
        <button
          type="button"
          onClick={onExpand}
          className="ml-auto shrink-0 rounded px-2 py-0.5 font-medium text-primary hover:bg-primary/5"
        >
          Expand
        </button>
      </div>
    );
  }

  return <HybridVersionMovementPanel data={data} />;
}

function MiniDistributionBar({ distribution, muted }: { distribution: DeviationDistribution; muted?: boolean }) {
  return (
    <span className={`flex h-1 w-[60px] shrink-0 overflow-hidden rounded-sm bg-muted ${muted ? "opacity-50" : ""}`} style={{ gap: 1 }}>
      {(Object.keys(deviationDistributionColors) as Array<keyof DeviationDistribution>).map((key) => {
        const value = distribution[key];
        if (value <= 0) return null;
        return (
          <span
            key={key}
            style={{
              flex: `${value} 1 0`,
              minWidth: 1,
              backgroundColor: deviationDistributionColors[key],
            }}
          />
        );
      })}
    </span>
  );
}

export function ScoringOptionSwitcher({
  value,
  onChange,
}: {
  value: ScoringOptionKey;
  onChange: (value: ScoringOptionKey) => void;
}) {
  const options: Array<{ value: ScoringOptionKey; label: string }> = [
    { value: "issue-score", label: "Score" },
    { value: "hybrid", label: "Hybrid" },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:inline">
        Scoring options
      </span>
      <div className="inline-flex h-7 items-center rounded-full border border-border/80 bg-muted/50 p-0.5">
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`h-6 rounded-full px-2.5 text-[11px] font-medium transition-colors ${
                active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ScoringStripSummary({ option, model }: { option: ScoringOptionKey; model: ContractScoringModel }) {
  const { current } = model;
  const delta = current.delta >= 0 ? `↑+${current.delta}` : `↓${Math.abs(current.delta)}`;
  if (option === "hybrid") {
    return (
      <span className="shrink-0 rounded px-1.5 py-0.5" style={{ color: bandColor[current.band] }}>
        <strong>{current.score} {current.band}</strong> {delta} · {model.resolvedTotal}/{model.identifiedTotal}
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded px-1.5 py-0.5" style={{ color: bandColor[current.band] }}>
      <strong>{current.score} {current.band}</strong> {delta}
    </span>
  );
}

function ScoringOptionPanel({
  option,
  model,
  versions,
  leftLabel,
  rightLabel,
  changeItems,
  onClauseSelect,
  onRequestChanges,
  onAcceptVersion,
  currentDecision,
}: {
  option: ScoringOptionKey;
  model: ContractScoringModel;
  versions: ContractVersion[];
  leftLabel: string;
  rightLabel: string;
  changeItems: PanelChangeItem[];
  onClauseSelect: (id: string) => void;
  onRequestChanges: () => void;
  onAcceptVersion: () => void;
  currentDecision: "accepted" | "changes-requested" | null;
}) {
  if (option === "hybrid") {
    return (
      <HybridScoringOption
        model={model}
        versions={versions}
      />
    );
  }
  const current = model.current;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)]">
        <div className="space-y-4">
          <IssueWeightedScoreOption model={model} onClauseSelect={onClauseSelect} />
        </div>

        <div className="hidden w-px bg-border lg:block" aria-hidden />

        <div className="space-y-3">
          <OverviewSectionLabel>What changed ({leftLabel} → {rightLabel})</OverviewSectionLabel>
          <HybridChangeList items={changeItems} onClauseSelect={onClauseSelect} />
        </div>
      </div>

      <ScoringPanelFooter
        score={current}
        onRequestChanges={onRequestChanges}
        onAcceptVersion={onAcceptVersion}
        currentDecision={currentDecision}
        showVelocity={option === "issue-score"}
        showStallClauseIds={false}
      />
    </div>
  );
}

function IssueWeightedScoreOption({
  model,
  onClauseSelect,
}: {
  model: ContractScoringModel;
  onClauseSelect: (id: string) => void;
}) {
  const current = model.current;
  return (
    <div className="space-y-4">
      <OverviewSectionLabel>What's driving the score</OverviewSectionLabel>
      <BulletScoreBar score={current.score} previousScore={model.previous?.score} />
      <HybridRiskDriverRows drivers={current.topDrivers} onClauseSelect={onClauseSelect} />
    </div>
  );
}

function ScoringPanelFooter({
  score,
  onRequestChanges,
  onAcceptVersion,
  currentDecision,
  showVelocity,
  showStallClauseIds,
}: {
  score: ContractScore;
  onRequestChanges: () => void;
  onAcceptVersion: () => void;
  currentDecision: "accepted" | "changes-requested" | null;
  showVelocity: boolean;
  showStallClauseIds: boolean;
}) {
  const stalledIds = score.stalled.map((driver) => driver.clauseId.toUpperCase()).join(", ");
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-2.5 text-[10px]">
      <HybridFooterSignal tone={score.dealBreakerPresent ? "danger" : "success"}>
        {score.dealBreakerPresent ? <ShieldX className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
        {score.dealBreakerPresent ? `Deal-breaker: ${score.dealBreakerClause}` : "No deal-breakers"}
      </HybridFooterSignal>
      {showVelocity && (
        <>
          <CompactDivider />
          <HybridFooterSignal>
            <Clock className="h-3 w-3" />
            {score.velocity} resolved / round
          </HybridFooterSignal>
        </>
      )}
      {score.stalled.length > 0 && (
        <>
          <CompactDivider />
          <HybridFooterSignal tone="warning">
            <AlertTriangle className="h-3 w-3" />
            {score.stalled.length} stalled{showStallClauseIds && stalledIds ? ` (${stalledIds})` : ""}
          </HybridFooterSignal>
        </>
      )}
      {currentDecision && (
        <>
          <CompactDivider />
          <HybridFooterSignal tone={currentDecision === "accepted" ? "success" : "warning"}>
            {currentDecision === "accepted" ? "Version accepted" : "Changes requested"}
          </HybridFooterSignal>
        </>
      )}
      <div className="ml-auto flex items-center gap-2">
        <Button size="sm" variant="outline" className="h-7 rounded-[5px] px-3 text-[10px]" onClick={onRequestChanges}>
          Request changes
        </Button>
        <Button
          size="sm"
          className="h-7 rounded-[5px] px-3 text-[10px]"
          onClick={onAcceptVersion}
        >
          Accept version
        </Button>
      </div>
    </div>
  );
}

interface HybridMovementPanelData {
  previous?: {
    version: string;
    score: number;
    band: ScoreBand;
    distribution: DeviationDistribution;
  };
  current: {
    version: string;
    score: number;
    band: ScoreBand;
    distribution: DeviationDistribution;
  };
  delta: number;
  movement: {
    improved: number;
    declined: number;
  };
}

function HybridScoringOption({
  model,
  versions,
}: {
  model: ContractScoringModel;
  versions: ContractVersion[];
}) {
  const data = buildHybridMovementPanelData(model, versions);
  return <HybridVersionMovementPanel data={data} />;
}

function buildHybridMovementPanelData(
  model: ContractScoringModel,
  versions: ContractVersion[],
): HybridMovementPanelData {
  const currentVersion = versions.find((version) => version.version === model.current.version);
  const previousVersion = model.previous
    ? versions.find((version) => version.version === model.previous?.version)
    : undefined;

  return {
    previous: model.previous
      ? {
          version: model.previous.version,
          score: model.previous.score,
          band: model.previous.band,
          distribution: distributionFromScore(model.previous),
        }
      : undefined,
    current: {
      version: model.current.version,
      score: model.current.score,
      band: model.current.band,
      distribution: distributionFromScore(model.current),
    },
    delta: model.previous ? model.current.score - model.previous.score : 0,
    movement: movementBetweenVersions(previousVersion, currentVersion),
  };
}

function distributionFromScore(score: ContractScore): DeviationDistribution {
  const active = score.open.high + score.open.medium + score.open.low;
  return {
    high: score.open.high,
    medium: score.open.medium,
    low: score.open.low,
    clean: Math.max(0, CLAUSE_FRAMEWORK.length - active),
  };
}

function movementBetweenVersions(previous?: ContractVersion, current?: ContractVersion) {
  if (!previous || !current) return { improved: 0, declined: 0 };

  let improved = 0;
  let declined = 0;
  for (const def of CLAUSE_FRAMEWORK) {
    const prevRank = deviationRank(previous.clauses.find((clause) => clause.id === def.id));
    const currRank = deviationRank(current.clauses.find((clause) => clause.id === def.id));
    if (currRank < prevRank) improved += 1;
    if (currRank > prevRank) declined += 1;
  }

  return { improved, declined };
}

function deviationRank(clause?: ClauseResult) {
  if (!clause || clause.resolved) return 0;
  if (clause.severity === "low") return 1;
  if (clause.severity === "medium") return 2;
  return 3;
}

function HybridVersionMovementPanel({ data }: { data: HybridMovementPanelData }) {
  if (!data.previous) {
    return (
      <div className="flex min-h-[70px] items-center gap-4 border-b border-[rgba(0,0,0,0.08)] bg-white px-4 py-3">
        <div className="min-w-[180px] flex-1 text-[10px] font-medium text-muted-foreground">
          First analysis — no comparison available
        </div>
        <VersionDistributionColumn version={data.current} label="current" />
      </div>
    );
  }

  return (
    <div className="border-b border-[rgba(0,0,0,0.08)] bg-white px-4 py-3">
      <div className="flex items-center gap-4">
        <VersionDistributionColumn version={data.previous} label="previous" muted />
        <DeltaIndicator delta={data.delta} />
        <VersionDistributionColumn version={data.current} label="current" />
      </div>
      <MovementSummary movement={data.movement} />
    </div>
  );
}

function VersionDistributionColumn({
  version,
  label,
  muted,
}: {
  version: HybridMovementPanelData["current"];
  label: "previous" | "current";
  muted?: boolean;
}) {
  return (
    <div className={muted ? "min-w-0 flex-1 opacity-[0.55]" : "min-w-0 flex-1"}>
      <div className="mb-[5px] flex items-center gap-1.5">
        <span className="text-[10px] font-medium text-muted-foreground">
          {version.version} ({label})
        </span>
        <span className="text-base font-medium leading-none text-foreground tabular-nums">{version.score}</span>
      </div>
      <DeviationDistributionBar distribution={version.distribution} />
    </div>
  );
}

function DeltaIndicator({ delta }: { delta: number }) {
  const color = delta > 0 ? "#3B6D11" : delta < 0 ? "#A32D2D" : "hsl(var(--muted-foreground))";
  const label = delta > 0 ? `+${delta}` : delta < 0 ? `−${Math.abs(delta)}` : "0";
  return (
    <div className="flex shrink-0 flex-col items-center gap-0.5 px-2">
      <ArrowRight className="h-[18px] w-[18px] text-muted-foreground" />
      <span className="text-sm font-medium leading-none tabular-nums" style={{ color }}>
        {label}
      </span>
      <span className="text-[9px] leading-none text-muted-foreground">pts</span>
    </div>
  );
}

const deviationDistributionColors: Record<keyof DeviationDistribution, string> = {
  high: "#A32D2D",
  medium: "#BA7517",
  low: "#B4B2A9",
  clean: "#3B6D11",
};

function DeviationDistributionBar({ distribution }: { distribution: DeviationDistribution }) {
  const total = Math.max(1, distribution.high + distribution.medium + distribution.low + distribution.clean);
  return (
    <div className="flex h-2.5 overflow-hidden rounded bg-muted" style={{ gap: 1 }}>
      {(Object.keys(deviationDistributionColors) as Array<keyof DeviationDistribution>).map((key) => {
        const value = distribution[key];
        if (value <= 0) return null;
        return (
          <span
            key={key}
            title={`${value} ${key} clause${value === 1 ? "" : "s"}`}
            style={{
              flex: `${value} 1 0`,
              minWidth: value / total > 0.02 ? 3 : 1,
              backgroundColor: deviationDistributionColors[key],
            }}
          />
        );
      })}
    </div>
  );
}

const bandChipTone: Record<ScoreBand, string> = {
  F: "bg-[#FCEBEB] text-[#791F1F]",
  D: "bg-[#FAEEDA] text-[#633806]",
  C: "bg-[#F1EFE8] text-[#444441]",
  B: "bg-[#EAF3DE] text-[#27500A]",
  A: "bg-[#C0DD97] text-[#173404]",
};

function BandChip({ band }: { band: ScoreBand }) {
  return (
    <span className={`rounded-[3px] px-[5px] py-px text-[9px] font-medium leading-none ${bandChipTone[band]}`}>
      {band}
    </span>
  );
}

function MovementSummary({ movement }: { movement: HybridMovementPanelData["movement"] }) {
  const hasMovement = movement.improved > 0 || movement.declined > 0;
  return (
    <div className="mt-2 flex items-center gap-2 text-[10px]">
      <DistributionLegend />
      <div className="ml-auto flex items-center gap-1.5">
        {hasMovement ? (
          <>
            {movement.improved > 0 && (
              <span className="inline-flex items-center gap-1 font-medium text-[#3B6D11]">
                <span aria-hidden>↑</span>
                {movement.improved} improved
              </span>
            )}
            {movement.declined > 0 && (
              <span className="inline-flex items-center gap-1 font-medium text-[#A32D2D]">
                <span aria-hidden>↓</span>
                {movement.declined} declined
              </span>
            )}
          </>
        ) : (
          <span className="text-muted-foreground">0 improved · 0 declined</span>
        )}
      </div>
    </div>
  );
}

function DistributionLegend() {
  const labels: Array<[keyof DeviationDistribution, string]> = [
    ["high", "High"],
    ["medium", "Medium"],
    ["low", "Low"],
    ["clean", "Clean"],
  ];

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      {labels.map(([key, label]) => (
        <span key={key} className="inline-flex items-center gap-1 text-[9px] text-muted-foreground">
          <span
            className="h-[5px] w-[5px] rounded-[1px]"
            style={{ backgroundColor: deviationDistributionColors[key] }}
          />
          {label}
        </span>
      ))}
    </div>
  );
}

const panelSeverityColor: Record<"high" | "medium" | "low", string> = {
  high: "#A32D2D",
  medium: "#854F0B",
  low: "#5F5E5A",
};

function HybridRiskDriverRows({
  drivers,
  onClauseSelect,
}: {
  drivers: ScoreDriver[];
  onClauseSelect: (id: string) => void;
}) {
  return (
    <div>
      <OverviewSectionLabel>Top risk drivers</OverviewSectionLabel>
      <div className="mt-2 divide-y divide-border">
        {drivers.length === 0 ? (
          <div className="py-2 text-xs text-muted-foreground">No open risk drivers.</div>
        ) : drivers.slice(0, 3).map((driver) => {
          const stalled = driver.roundsUnchanged >= 2;
          return (
            <button
              key={driver.clauseId}
              type="button"
              onClick={() => onClauseSelect(driver.clauseId)}
              className="grid w-full grid-cols-[minmax(0,1fr)_28px] items-start gap-3 py-2 text-left hover:bg-muted/35"
            >
              <span className="flex min-w-0 items-start gap-2">
                <span
                  className="mt-1.5 h-[5px] w-[5px] shrink-0 rounded-full"
                  style={{ backgroundColor: panelSeverityColor[driver.severity] }}
                />
                <span className="min-w-0">
                  <span className="block truncate text-[11px] font-medium text-foreground">{driver.clauseName}</span>
                  <span className="block truncate text-[10px] text-muted-foreground">
                    {driver.clauseId.toUpperCase()}
                    {stalled && <> · stalled {driver.roundsUnchanged} rounds</>}
                  </span>
                </span>
              </span>
              <span
                className="text-right text-[10px] font-medium tabular-nums"
                style={{ color: panelSeverityColor[driver.severity] }}
              >
                −{driver.weightedCost}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function HybridResolutionRows({ score }: { score: ContractScore }) {
  const rows: Array<{ key: "high" | "medium" | "low"; label: string; color: string }> = [
    { key: "high", label: "High", color: "#A32D2D" },
    { key: "medium", label: "Medium", color: "#854F0B" },
    { key: "low", label: "Low", color: "#5F5E5A" },
  ];
  return (
    <div>
      <OverviewSectionLabel>Resolution progress</OverviewSectionLabel>
      <div className="mt-2 space-y-2">
        {rows.map((row) => {
          const identified = score.identified[row.key];
          const total = Math.max(1, identified);
          const resolved = score.resolved[row.key];
          const remaining = score.open[row.key];
          const resolvedWidth = resolved > 0 ? Math.max(3, (resolved / total) * 100) : 3;
          return (
            <div key={row.key} className="grid grid-cols-[48px_minmax(0,1fr)_38px] items-center gap-2">
              <span className="text-[10px] font-medium" style={{ color: row.color }}>{row.label}</span>
              <span className="flex h-2 overflow-hidden rounded-[3px] bg-muted">
                <span className="bg-[#3B6D11]" style={{ width: `${resolvedWidth}%` }} />
                {remaining > 0 && (
                  <span style={{ width: `${Math.max(0, 100 - resolvedWidth)}%`, backgroundColor: row.color }} />
                )}
              </span>
              <span className="text-right text-[10px] font-medium tabular-nums" style={{ color: row.color }}>
                {resolved}/{identified}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HybridChangeList({
  items,
  onClauseSelect,
}: {
  items: PanelChangeItem[];
  onClauseSelect: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-md border border-border bg-muted/25 px-3 py-3 text-xs text-muted-foreground">
        No requested or supplier-initiated changes for this comparison.
      </div>
    );
  }

  const statusOrder: PanelChangeStatus[] = ["met", "not_met", "regressed", "improved", "new"];

  return (
    <div className="divide-y divide-border">
      {statusOrder.flatMap((status) => {
        const group = items.filter((item) => item.status === status);
        if (group.length === 0) return [];
        return group.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onClauseSelect(item.id)}
            className={`grid w-full grid-cols-[82px_minmax(0,1fr)_34px] items-center gap-2 py-2 text-left hover:bg-muted/35 ${
              (status === "regressed" || status === "improved" || status === "new") && index === 0 ? "border-t border-border" : ""
            }`}
          >
            <ChangePillBadge result={{ status }} />
            <span className="truncate text-[11px] text-foreground">{item.title}</span>
            <span className="text-right text-[9px] text-muted-foreground">{item.id.toUpperCase()}</span>
          </button>
        ));
      })}
    </div>
  );
}

function HybridFooterSignal({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const toneClass =
    tone === "success" ? "text-[#3B6D11]" :
      tone === "warning" ? "text-[#854F0B]" :
        tone === "danger" ? "text-[#A32D2D]" :
          "text-muted-foreground";
  return <span className={`inline-flex items-center gap-1 font-medium ${toneClass}`}>{children}</span>;
}

function BulletScoreBar({ score, previousScore }: { score: number; previousScore?: number }) {
  const zones = [
    { label: "F", width: 40, color: "#FCEBEB" },
    { label: "D", width: 20, color: "#FAEEDA" },
    { label: "C", width: 15, color: "#F1EFE8" },
    { label: "B", width: 15, color: "#EAF3DE" },
    { label: "A", width: 10, color: "#C0DD97" },
  ];
  return (
    <div>
      <div className="relative h-3.5 overflow-hidden rounded bg-muted">
        <div className="absolute inset-0 flex">
          {zones.map((zone) => (
            <span key={zone.label} style={{ width: `${zone.width}%`, backgroundColor: zone.color }} />
          ))}
        </div>
        <div
          className="absolute bottom-[3px] left-0 top-[3px] rounded-sm bg-primary"
          style={{ width: `${score}%` }}
        />
        {previousScore !== undefined && (
          <span
            className="absolute bottom-0 top-0 w-0.5 bg-muted-foreground/35"
            style={{ left: `${previousScore}%` }}
            aria-label={`Previous score ${previousScore}`}
          />
        )}
      </div>
      <div className="mt-1 grid grid-cols-5 text-[8px] text-muted-foreground">
        {zones.map((zone) => <span key={zone.label}>{zone.label}</span>)}
      </div>
    </div>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="min-w-0 text-center">
      <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-normal sm:text-[10px]">{label}</p>
      <p className={`text-lg font-bold font-mono leading-tight ${tone}`}>{value}</p>
    </div>
  );
}

function PairSelector({
  versions, pair, onChange, compact = false,
}: {
  versions: ContractVersion[];
  pair: { left: string; right: string };
  onChange: (p: { left: string; right: string }) => void;
  compact?: boolean;
}) {
  const leftVersion = versions.find((version) => version.version === pair.left);
  const rightVersion = versions.find((version) => version.version === pair.right);
  const staticOnly = versions.length <= 2;
  const triggerClass = compact ? "h-6 w-[116px] rounded-md bg-white px-2 text-[11px]" : "h-9 w-[164px] text-sm";
  const formatVersion = (version?: ContractVersion) =>
    version ? `${version.version} · ${new Date(version.uploadedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : "Version";

  if (staticOnly) {
    return (
      <div className={`inline-flex items-center gap-1.5 text-muted-foreground ${compact ? "text-[11px]" : "text-sm"}`}>
        <span className="rounded border border-border bg-white px-2 py-0.5">{formatVersion(leftVersion)}</span>
        <ArrowRight className="h-3.5 w-3.5" />
        <span className="rounded border border-border bg-white px-2 py-0.5">{formatVersion(rightVersion)}</span>
      </div>
    );
  }

  const updateLeft = (left: string) => {
    const normalized = normalizeVersionComparisonPair(versions, { from: left, to: pair.right });
    onChange({ left: normalized.from, right: normalized.to });
  };

  const updateRight = (right: string) => {
    const normalized = normalizeVersionComparisonPair(versions, { from: pair.left, to: right });
    onChange({ left: normalized.from, right: normalized.to });
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${compact ? "text-[11px]" : "text-sm"}`}>
      <Select value={pair.left} onValueChange={updateLeft}>
        <SelectTrigger className={triggerClass} aria-label="Compare from version">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {versions.map((version) => (
            <SelectItem
              key={version.version}
              value={version.version}
              disabled={versionOrder(version.version) >= versionOrder(pair.right)}
            >
              {formatVersion(version)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <ArrowRight className={compact ? "h-3.5 w-3.5 text-muted-foreground" : "h-4 w-4 text-muted-foreground"} />
      <Select value={pair.right} onValueChange={updateRight}>
        <SelectTrigger className={triggerClass} aria-label="Compare to version">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {versions.map((version) => (
            <SelectItem
              key={version.version}
              value={version.version}
              disabled={versionOrder(version.version) <= versionOrder(pair.left)}
            >
              {formatVersion(version)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ClauseNavigator({
  versions, activeCategory, onSelectCategory, decisions, rightVersion, leftVersion, compactMode = false,
}: {
  versions: ContractVersion[];
  activeCategory: string | null;
  onSelectCategory: (c: string | null) => void;
  decisions: Record<string, ClauseDecisionState>;
  rightVersion: ContractVersion | null;
  leftVersion: ContractVersion | null;
  compactMode?: boolean;
}) {
  const [sort, setSort] = useState<CategorySortKey>("risk");
  const categories = useMemo(() => {
    const severityVersion = versions[0] ?? rightVersion ?? leftVersion;
    const map = new Map<string, { total: number; requested: number; flagged: number; high: number; medium: number; low: number }>();
    for (const def of CLAUSE_FRAMEWORK) {
      const cat = def.category;
      const cur = map.get(cat) ?? { total: 0, requested: 0, flagged: 0, high: 0, medium: 0, low: 0 };
      cur.total++;
      const severity = severityVersion?.clauses.find((c) => c.id === def.id)?.severity;
      if (severity === "high") cur.high++;
      else if (severity === "medium") cur.medium++;
      else cur.low++;
      const s = decisions[def.id];
      if (s?.roundDecisions && Object.values(s.roundDecisions).includes("request-update")) cur.requested++;
      // flagged = clause has a material change in the active comparison
      if (leftVersion && rightVersion && leftVersion.version !== rightVersion.version) {
        const prev = leftVersion.clauses.find((c) => c.id === def.id);
        const curr = rightVersion.clauses.find((c) => c.id === def.id);
        if (classifyChange(prev, curr) === "material") cur.flagged++;
      }
      map.set(cat, cur);
    }
    return Array.from(map.entries()).map(([name, stats]) => ({ name, ...stats }));
  }, [decisions, leftVersion, rightVersion, versions]);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      if (sort === "az") return a.name.localeCompare(b.name);
      if (sort === "count") return b.total - a.total || a.name.localeCompare(b.name);
      return b.high - a.high || b.medium - a.medium || a.name.localeCompare(b.name);
    });
  }, [categories, sort]);

  if (compactMode) {
    return (
      <aside className="bg-card border border-border rounded-lg h-fit self-start sticky top-[160px] overflow-hidden">
        <div
          className="flex items-center justify-between px-2.5 py-[7px]"
          style={{ borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}
        >
          <span className="text-[10px] font-medium text-muted-foreground">All clauses</span>
          <span className="text-[10px] text-muted-foreground/75">{CLAUSE_FRAMEWORK.length}</span>
        </div>

        <div
          className="flex items-center gap-[3px] px-2.5 py-[5px]"
          style={{ borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}
        >
          <CategorySortChip active={sort === "risk"} onClick={() => setSort("risk")}>
            <IconFlame className="w-2.5 h-2.5" stroke={1.8} />
            Risk
          </CategorySortChip>
          <CategorySortChip active={sort === "az"} onClick={() => setSort("az")}>
            A-Z
          </CategorySortChip>
          <CategorySortChip active={sort === "count"} onClick={() => setSort("count")}>
            #
          </CategorySortChip>
        </div>

        <div className="p-2 space-y-0.5">
          <button
            onClick={() => onSelectCategory(null)}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[10px] transition-colors ${
              !activeCategory
                ? "bg-[#E6F1FB] text-foreground font-medium"
                : "text-muted-foreground hover:bg-[#f8f7f5]"
            }`}
          >
            <span>All</span>
            <span className="text-[10px] text-muted-foreground">{CLAUSE_FRAMEWORK.length}</span>
          </button>

          {sortedCategories.map((c) => {
            const active = activeCategory === c.name;
            return (
              <button
                key={c.name}
                onClick={() => onSelectCategory(c.name)}
                title={`${c.name}: ${c.total} clauses, ${c.high} high, ${c.medium} medium, ${c.low} low`}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left transition-colors ${
                  active
                    ? "bg-[#E6F1FB] text-foreground font-medium"
                    : "text-muted-foreground hover:bg-[#f8f7f5]"
                }`}
              >
                <span className="min-w-0 flex-1 truncate text-[10px]">{c.name}</span>
                <SeverityStackedBar high={c.high} medium={c.medium} low={c.low} />
                <span
                  className={`min-w-[10px] text-right text-[9px] font-medium ${
                    c.high > 0 ? "text-[#A32D2D]" : "text-[#9c9a92]"
                  }`}
                >
                  {c.high}
                </span>
              </button>
            );
          })}
        </div>
      </aside>
    );
  }

  return (
    <aside className="bg-card border border-border rounded-lg p-3 h-fit sticky top-[160px] space-y-1">
      <div className="flex items-center justify-between px-2 pb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">All 66 clauses</span>
        {activeCategory && (
          <button
            onClick={() => onSelectCategory(null)}
            className="text-[10px] text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>
      <button
        onClick={() => onSelectCategory(null)}
        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs ${
          !activeCategory ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted/50"
        }`}
      >
        <span>All categories</span>
        <span className="font-mono text-[10px] text-muted-foreground">{CLAUSE_FRAMEWORK.length}</span>
      </button>
      {categories.map((c) => (
        <button
          key={c.name}
          onClick={() => onSelectCategory(c.name)}
          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs text-left ${
            activeCategory === c.name ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted/50"
          }`}
        >
          <span className="truncate pr-2">{c.name}</span>
          <span className="flex items-center gap-1 shrink-0">
            {c.flagged > 0 && (
              <span className="text-[9px] font-mono px-1 rounded bg-primary/15 text-primary">{c.flagged}</span>
            )}
            {c.requested > 0 && (
              <span className="text-[9px] font-mono px-1 rounded bg-warning/20 text-warning-foreground">{c.requested}</span>
            )}
            <span className="font-mono text-[10px] text-muted-foreground">{c.total}</span>
          </span>
        </button>
      ))}
    </aside>
  );
}

function CategorySortChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full px-[7px] py-0.5 text-[9px] leading-none transition-colors ${
        active
          ? "bg-[#E6F1FB] text-[#185FA5] border-[#185FA5]"
          : "border-border text-muted-foreground hover:bg-[#f8f7f5] hover:text-foreground"
      }`}
      style={{ borderWidth: "0.5px" }}
    >
      {children}
    </button>
  );
}

function SeverityStackedBar({ high, medium, low }: { high: number; medium: number; low: number }) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const segments = high > 0
    ? [
        { key: "high", value: high, color: "#A32D2D", label: "high deviation" },
        { key: "medium", value: medium, color: "#BA7517", label: "medium deviation" },
        { key: "low", value: low, color: "#B4B2A9", label: "low deviation" },
      ].filter((segment) => segment.value > 0)
    : [{ key: "low", value: Math.max(high + medium + low, 1), color: "#B4B2A9", label: "low deviation" }];

  useEffect(() => {
    if (!activeSegment) return undefined;
    const dismiss = () => setActiveSegment(null);
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [activeSegment]);

  const showTooltip = (key: string) => hoveredSegment === key || activeSegment === key;
  const anySegmentActive = Boolean(hoveredSegment || activeSegment);

  return (
    <span className="flex h-1.5 w-9 shrink-0 rounded-sm bg-card gap-px cursor-pointer" aria-hidden>
      {segments.map((segment, index) => (
        <span
          key={segment.key}
          className={`relative min-w-px transition-opacity ${
            index === 0 ? "rounded-l-sm" : ""
          } ${
            index === segments.length - 1 ? "rounded-r-sm" : ""
          } ${anySegmentActive && !showTooltip(segment.key) ? "opacity-80" : "opacity-100"}`}
          onMouseEnter={() => setHoveredSegment(segment.key)}
          onMouseLeave={() => setHoveredSegment(null)}
          onClick={(event: MouseEvent<HTMLSpanElement>) => {
            event.stopPropagation();
            setActiveSegment(segment.key);
          }}
          style={{ flexGrow: segment.value, backgroundColor: segment.color }}
        >
          {showTooltip(segment.key) && (
            <span className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded bg-[#1a1a1a] px-2 py-1 text-[10px] leading-none text-white shadow-sm">
              {segment.value} {segment.label} clause{segment.value === 1 ? "" : "s"}
              <span className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-[#1a1a1a]" />
            </span>
          )}
        </span>
      ))}
    </span>
  );
}

// ---- Review (v1) ------------------------------------------------------------

function ReviewGuidance({ versionLabel, compact = false }: { versionLabel: string; compact?: boolean }) {
  return (
    <div
      className={
        compact
          ? "flex min-h-9 min-w-[240px] max-w-[360px] flex-1 items-center gap-2 rounded-md border border-primary/20 bg-card px-3 py-1.5 text-[11px] leading-snug text-muted-foreground"
          : "bg-card border border-primary/20 rounded-lg px-4 py-3 text-xs text-muted-foreground flex items-start gap-2"
      }
    >
      <Sparkles className={compact ? "h-3.5 w-3.5 shrink-0 text-primary" : "w-3.5 h-3.5 text-primary mt-0.5 shrink-0"} />
      <span className="min-w-0">
        Select <span className="font-semibold text-foreground">"Request Change"</span> for clauses you want the supplier to update.
        {versionLabel !== "v1" && (
          <> Notes on <span className="font-semibold text-foreground">{versionLabel}</span> override the previous round.</>
        )}
      </span>
    </div>
  );
}

function ReviewScreen({
  version,
  stateOf,
  activeCategory,
  search,
  quickSeverityFilter,
  onSetNoAction,
  onStartDraft,
  onUpdateDraft,
  onCancelDraft,
  onSubmitDraft,
  onOpenDetail,
  highlightedId,
}: {
  version: ContractVersion;
  stateOf: (id: string) => ClauseDecisionState;
  activeCategory: string | null;
  search: string;
  quickSeverityFilter: "high" | "medium" | "low" | null;
  onSetNoAction: (id: string) => void;
  onStartDraft: (id: string, initialDraft?: { requestedChange?: string; rationale?: string }) => void;
  onUpdateDraft: (id: string, patch: { requestedChange?: string; rationale?: string }) => void;
  onCancelDraft: (id: string) => void;
  onSubmitDraft: (id: string) => void;
  onOpenDetail: (id: string) => void;
  highlightedId?: string | null;
}) {
  const q = search.trim().toLowerCase();
  const rows = version.clauses.filter((c) => {
    if (activeCategory && c.category !== activeCategory) return false;
    if (quickSeverityFilter && c.severity !== quickSeverityFilter) return false;
    if (q && !c.title.toLowerCase().includes(q) && !c.category.toLowerCase().includes(q) && !c.id.includes(q)) return false;
    return true;
  });
  const versionLabel = version.version;
  return (
    <div className="space-y-3">
      {rows.map((c) => {
        const state = stateOf(c.id);
        const decision = state.roundDecisions[versionLabel];
        const own = state.requests[versionLabel] ?? {};
        const draft = state.draftRequests?.[versionLabel];
        const isDrafting = Boolean(draft);
        const inherited = getLatestRequest(state, versionLabel);
        const inheritedFromOlder = inherited && inherited.version !== versionLabel ? inherited : undefined;
        const settled = decision === "request-update" || decision === "no-action";
        const draftHasText = Boolean(draft?.requestedChange?.trim() || draft?.rationale?.trim());
        const cancelDraft = () => {
          if (draftHasText && !window.confirm("Discard this draft request?")) return;
          onCancelDraft(c.id);
        };

        if (settled && !isDrafting) {
          return (
            <div
              id={`clause-row-${c.id}`}
              key={c.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpenDetail(c.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") onOpenDetail(c.id);
              }}
              className={`group flex min-h-9 cursor-pointer items-center gap-3 rounded-lg border bg-card px-3 py-2 text-sm transition-colors hover:border-primary/30 hover:bg-[#E6F1FB]/30 ${
                decision === "request-update" ? "border-l-4 border-l-primary" : "border-l-4 border-l-success"
              } ${highlightedId === c.id ? "ring-2 ring-primary/40 bg-primary/5" : ""}`}
            >
              <span className="w-9 shrink-0 text-[10px] font-bold font-mono text-muted-foreground">{c.id.toUpperCase()}</span>
              <span className="min-w-0 flex-1 truncate font-medium text-foreground">{c.title}</span>
              <Badge variant="outline" className={severityTone(c.severity)}>
                {c.severity}
              </Badge>
              {decision === "request-update" && own.requestedChange && (
                <span className="hidden min-w-0 flex-[1.2] truncate text-xs italic text-muted-foreground lg:block">
                  {own.requestedChange}
                </span>
              )}
              <DecisionBadge decision={decision} />
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  if (decision === "request-update") onStartDraft(c.id, own);
                  else onStartDraft(c.id);
                }}
                className="shrink-0 text-[11px] font-medium text-primary hover:underline"
              >
                {decision === "request-update" ? "Edit" : "Change decision"}
              </button>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-60" />
            </div>
          );
        }

        return (
          <div
            id={`clause-row-${c.id}`}
            key={c.id}
            onClick={() => !isDrafting && onOpenDetail(c.id)}
            className={`group relative cursor-pointer rounded-lg border bg-card p-4 pr-10 transition-colors hover:border-primary/30 hover:bg-[#E6F1FB]/30 border-l-4 ${
              isDrafting ? "border-l-primary border-border"
                : "border-l-border"
            } ${highlightedId === c.id ? "ring-2 ring-primary/40 bg-primary/5" : ""}`}
          >
            {!isDrafting && (
              <ChevronRight className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-50" />
            )}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold text-muted-foreground">{c.id.toUpperCase()}</span>
                  <h3 className="font-semibold text-foreground">{c.title}</h3>
                  <span className="text-xs font-mono text-muted-foreground">{c.subclause}</span>
                  <span className="text-xs text-muted-foreground">· {c.category}</span>
                  <Badge variant="outline" className={severityTone(c.severity)}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1 ${severityDot(c.severity)}`} />
                    {c.severity}
                  </Badge>
                  {isDrafting && (
                    <Badge variant="outline" className="bg-[#E6F1FB] text-[#0C447C] border-[#185FA5]/25 text-[10px]">
                      Drafting request
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-foreground">{c.deviation}</p>
                {c.actionability && (
                  <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <Lightbulb className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                    <span><span className="font-semibold text-foreground">Actionability:</span> {c.actionability}</span>
                  </p>
                )}
              </div>
              <div className="flex flex-col items-stretch gap-2 shrink-0 w-[180px]" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="sm"
                  variant={isDrafting ? "secondary" : "outline"}
                  className="h-8 text-xs gap-1.5"
                  onClick={() => onStartDraft(c.id, own)}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isDrafting ? "Drafting" : "Request Change"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => onSetNoAction(c.id)}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> No Action
                </Button>
                <button
                  onClick={() => onOpenDetail(c.id)}
                  className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1"
                >
                  Open detail <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {isDrafting && (
              <div className="mt-3 space-y-3 border-t border-border pt-3" onClick={(e) => e.stopPropagation()}>
                {inheritedFromOlder && !draft?.requestedChange && !draft?.rationale && (
                  <div className="rounded-md border-l-2 border-primary bg-primary/5 px-3 py-2 space-y-1 text-xs">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                      Currently in effect — from {inheritedFromOlder.version}
                    </p>
                    {inheritedFromOlder.request.requestedChange && (
                      <p className="text-foreground leading-snug">{inheritedFromOlder.request.requestedChange}</p>
                    )}
                    {inheritedFromOlder.request.rationale && (
                      <p className="text-muted-foreground italic leading-snug">{inheritedFromOlder.request.rationale}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      Add a new note below to override this for {versionLabel} onwards, or leave blank to keep the earlier ask.
                    </p>
                  </div>
                )}
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                      Requested change ({versionLabel}) <span className="text-destructive">*</span>
                    </label>
                    <Textarea
                      value={draft?.requestedChange ?? ""}
                      onChange={(e) => onUpdateDraft(c.id, { requestedChange: e.target.value })}
                      placeholder={
                        inheritedFromOlder
                          ? `Override the ${inheritedFromOlder.version} ask for this round (optional)`
                          : "Describe the change you want from the supplier"
                      }
                      className="min-h-[64px] text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase">Rationale (optional)</label>
                    <Textarea
                      value={draft?.rationale ?? ""}
                      onChange={(e) => onUpdateDraft(c.id, { rationale: e.target.value })}
                      placeholder="Why is this change required?"
                      className="min-h-[64px] text-sm"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[11px] text-muted-foreground">
                    Request will be included when the next version is uploaded.
                  </p>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={cancelDraft}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 text-xs gap-1.5"
                      disabled={!draft?.requestedChange?.trim()}
                      onClick={() => onSubmitDraft(c.id)}
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Submit request
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {rows.length === 0 && (
        <div className="bg-card border border-border rounded-lg p-12 text-center text-sm text-muted-foreground">
          No clauses match this category.
        </div>
      )}
    </div>
  );
}

// (RequestList tab removed — request editing now lives inline in ReviewScreen.)

// ---- Comparison sections ----------------------------------------------------

function ComparisonSection({
  title, description, accent, rows, leftLabel, rightLabel, visible, bucket,
  changePillOf, closureOf, requestOf, onClose, onKeepOpen, onFollowUp, onOpenDetail,
  pinnedIds, onTogglePin, recentlyClosed, onUndoClose,
}: {
  title: string;
  description: string;
  accent: "primary" | "warning" | "destructive" | "success";
  rows: { id: string; prev?: ClauseResult; curr?: ClauseResult }[];
  leftLabel: string;
  rightLabel: string;
  visible: boolean;
  bucket: "open" | "new" | "closed";
  changePillOf: (id: string, prev?: ClauseResult, curr?: ClauseResult) => ChangePillResult;
  closureOf: (id: string) => ClosureDecision | undefined;
  requestOf: (id: string) => { requestedChange?: string; rationale?: string; fromVersion?: string };
  onClose: (id: string) => void;
  onKeepOpen: (id: string) => void;
  onFollowUp?: (id: string) => void;
  onOpenDetail: (id: string) => void;
  pinnedIds?: Set<string>;
  onTogglePin?: (id: string) => void;
  recentlyClosed?: Record<string, number>;
  onUndoClose?: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  if (!visible) return null;
  const accentBar =
    accent === "primary" ? "bg-primary"
      : accent === "warning" ? "bg-warning"
      : accent === "success" ? "bg-success"
      : "bg-destructive";
  const accentText =
    accent === "primary" ? "text-primary"
      : accent === "warning" ? "text-warning-foreground"
      : accent === "success" ? "text-success"
      : "text-destructive";
  const accentBg =
    accent === "primary" ? "bg-primary/5 hover:bg-primary/10"
      : accent === "warning" ? "bg-warning/10 hover:bg-warning/15"
      : accent === "success" ? "bg-success/5 hover:bg-success/10"
      : "bg-destructive/5 hover:bg-destructive/10";
  const accentBorder =
    accent === "primary" ? "border-primary/30"
      : accent === "warning" ? "border-warning/40"
      : accent === "success" ? "border-success/30"
      : "border-destructive/30";
  const emptyMsg =
    bucket === "open" ? "No open requests for this round."
      : bucket === "closed" ? "No clauses have been closed for this round yet."
      : "No new material changes identified.";

  // Severity counts from the most relevant clause version per row
  const severityCounts = rows.reduce(
    (acc, r) => {
      const sev = (r.curr ?? r.prev)?.severity;
      if (sev === "high") acc.high += 1;
      else if (sev === "medium") acc.medium += 1;
      else if (sev === "low") acc.low += 1;
      return acc;
    },
    { high: 0, medium: 0, low: 0 },
  );
  const prioritySummary = [
    severityCounts.high ? `${severityCounts.high} high` : null,
    severityCounts.medium ? `${severityCounts.medium} medium` : null,
    severityCounts.low ? `${severityCounts.low} low` : null,
  ].filter(Boolean).join(" · ");
  const changeCounts = rows.reduce(
    (acc, row) => {
      const status = changePillOf(row.id, row.prev, row.curr).status;
      if (status === "improved") acc.improved += 1;
      if (status === "regressed") acc.regressed += 1;
      if (status === "new") acc.new += 1;
      return acc;
    },
    { improved: 0, regressed: 0, new: 0 },
  );
  const bucketSummary =
    bucket === "new" && changeCounts.new > 0
      ? `includes ${changeCounts.new} ${NEW_CHANGE_LABEL.toLowerCase()} clause${changeCounts.new === 1 ? "" : "s"}`
      : prioritySummary;
  const sortedRows = [...rows].sort((a, b) => {
    if (bucket === "new") {
      const statusDelta =
        sortChangePillStatus(changePillOf(a.id, a.prev, a.curr).status) -
        sortChangePillStatus(changePillOf(b.id, b.prev, b.curr).status);
      if (statusDelta !== 0) return statusDelta;
    } else {
      const ap = pinnedIds?.has(a.id) ? 1 : 0;
      const bp = pinnedIds?.has(b.id) ? 1 : 0;
      if (bp - ap !== 0) return bp - ap;
    }
    const aTitle = (a.curr ?? a.prev)?.title ?? a.id;
    const bTitle = (b.curr ?? b.prev)?.title ?? b.id;
    return aTitle.localeCompare(bTitle);
  });

  const showHighAlert = bucket === "open" && severityCounts.high > 0;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={`bg-card border ${accentBorder} rounded-lg overflow-hidden`}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={`w-full flex items-start gap-3 p-4 text-left transition-colors ${accentBg}`}
        >
          <span className={`w-1 self-stretch rounded ${accentBar}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-sm font-semibold ${accentText}`}>
                {title} · <span className="font-mono text-foreground">{rows.length}</span>
              </h3>
              {showHighAlert && (
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-[10px] gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {severityCounts.high} high priority
                </Badge>
              )}
              {bucketSummary && (
                <span className="text-[11px] text-muted-foreground font-medium">{bucketSummary}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground mt-1 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
      {rows.length === 0 ? (
        <div className="p-6 text-center text-xs text-muted-foreground border-t border-border">{emptyMsg}</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Clause</TableHead>
              {bucket !== "new" && <TableHead className="w-[220px]">Your request</TableHead>}
              <TableHead>Summary {leftLabel}</TableHead>
              <TableHead>Summary {rightLabel}</TableHead>
              <TableHead className="w-[140px] text-center">Change</TableHead>
              <TableHead className="w-[200px] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRows.map((r, rowIndex) => {
              const change = classifyChange(r.prev, r.curr);
              const changePill = changePillOf(r.id, r.prev, r.curr);
              const previousChangePill =
                rowIndex > 0 ? changePillOf(sortedRows[rowIndex - 1].id, sortedRows[rowIndex - 1].prev, sortedRows[rowIndex - 1].curr) : null;
              const closure = closureOf(r.id);
              const display = r.curr ?? r.prev!;
              const req = requestOf(r.id);
              const wasUpdated = change === "material";
              const isPinned = pinnedIds?.has(r.id) ?? false;
              const undoExpiresAt = recentlyClosed?.[r.id];
              const showRowUndo = !!undoExpiresAt && undoExpiresAt > Date.now();
              const startsNewChangeGroup =
                bucket === "new" && rowIndex > 0 && changePill.status !== previousChangePill?.status;
              return (
                <TableRow
                  key={r.id}
                  className={`align-top cursor-pointer ${
                    isPinned ? "bg-primary/5" : ""
                  } ${
                    changePill.status === "new" ? "hover:bg-[#E6F1FB]/40" : ""
                  } ${
                    startsNewChangeGroup ? "border-t border-border" : ""
                  }`}
                  onClick={() => onOpenDetail(r.id)}
                >
                  <TableCell>
                    <div className="flex items-start gap-1.5">
                      {onTogglePin && (
                        <button
                          aria-label={isPinned ? "Unpin clause" : "Pin clause across version switches"}
                          title={isPinned ? "Unpin clause" : "Pin clause across version switches"}
                          onClick={(e) => { e.stopPropagation(); onTogglePin(r.id); }}
                          className={`mt-0.5 p-0.5 rounded hover:bg-muted ${isPinned ? "text-primary" : "text-muted-foreground/60 hover:text-foreground"}`}
                        >
                          <Pin className={`w-3.5 h-3.5 ${isPinned ? "fill-current" : ""}`} />
                        </button>
                      )}
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-foreground hover:text-primary">
                          {display.title}
                        </span>
                        <p className="text-[11px] font-mono text-muted-foreground">
                          {changePill.status === "new" && <span className="mr-1 text-[#0C447C]">+</span>}
                          {r.id.toUpperCase()} · {display.subclause}
                        </p>
                        {showRowUndo && onUndoClose && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onUndoClose(r.id); }}
                            className="mt-1 inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                          >
                            <RotateCcw className="w-3 h-3" /> Undo close
                          </button>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  {bucket !== "new" && (
                    <TableCell className="text-xs">
                      {req.requestedChange ? (
                        <div className="rounded border-l-2 border-primary bg-primary/5 px-2 py-1.5 space-y-1">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                            Requested{req.fromVersion ? ` · from ${req.fromVersion}` : ""}
                          </p>
                          <p className="text-foreground leading-snug">{req.requestedChange}</p>
                          {req.rationale && (
                            <p className="text-[11px] text-muted-foreground italic leading-snug">{req.rationale}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic">No request captured</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell className="text-xs text-muted-foreground">{r.prev?.deviation ?? "—"}</TableCell>
                  <TableCell className="text-xs text-foreground">{r.curr?.deviation ?? "—"}</TableCell>
                  <TableCell className="text-center">
                    {changePill.status ? (
                      <ChangePillBadge result={changePill} />
                    ) : (
                      <Badge variant="outline" className={`${materialChangeTone(change)} text-[10px] gap-1`}>
                        <FileDiff className="w-3 h-3" aria-hidden /> {materialChangeLabel(change)}
                      </Badge>
                    )}
                    {bucket === "open" && changePill.status === "not_met" && !wasUpdated && (
                      <p className="text-[10px] text-muted-foreground mt-1">Send back to supplier</p>
                    )}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    {bucket === "new" ? (
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="default" className="h-7 text-[11px]" onClick={() => onKeepOpen(r.id)}>
                          Request Update
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => onClose(r.id)}>
                          No Action
                        </Button>
                      </div>
                    ) : bucket === "closed" ? (
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => onKeepOpen(r.id)}>
                          Reopen
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1 flex-wrap">
                        <Button
                          size="sm"
                          variant={closure === "closed" ? "default" : "outline"}
                          className="h-7 text-[11px]"
                          onClick={() => onClose(r.id)}
                        >
                          {wasUpdated ? "Close" : "Close anyway"}
                        </Button>
                        <Button
                          size="sm"
                          variant={closure === "follow-up" ? "secondary" : "outline"}
                          className="h-7 text-[11px]"
                          onClick={() => onFollowUp?.(r.id)}
                          title="Partially addressed — keep a note for the next supplier brief"
                        >
                          Follow-up
                        </Button>
                        <Button
                          size="sm"
                          variant={closure === "keep-open" ? "secondary" : "outline"}
                          className="h-7 text-[11px]"
                          onClick={() => onKeepOpen(r.id)}
                          title="Keep this clause open for further negotiation"
                        >
                          Keep Open
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
      </CollapsibleContent>
    </Collapsible>
  );
}

// ---- Unmarked clauses (collapsible) ----------------------------------------

function UnmarkedSection({
  rows, leftLabel, rightLabel, visible, defaultOpen,
  requestOf, draftOf, isRequested, isDrafting, onRequestChange, onUpdateText, onCancelDraft, onSubmitDraft, onOpenDetail,
}: {
  rows: { id: string; prev?: ClauseResult; curr?: ClauseResult }[];
  leftLabel: string;
  rightLabel: string;
  visible: boolean;
  defaultOpen: boolean;
  requestOf: (id: string) => { requestedChange?: string; rationale?: string };
  draftOf: (id: string) => { requestedChange?: string; rationale?: string };
  isRequested: (id: string) => boolean;
  isDrafting: (id: string) => boolean;
  onRequestChange: (id: string) => void;
  onUpdateText: (id: string, patch: { requestedChange?: string; rationale?: string }) => void;
  onCancelDraft: (id: string) => void;
  onSubmitDraft: (id: string) => void;
  onOpenDetail: (id: string) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState("");
  useEffect(() => { if (defaultOpen) setOpen(true); }, [defaultOpen]);
  const q = localSearch.trim().toLowerCase();
  const filteredRows = q
    ? rows.filter((r) => {
        const d = r.curr ?? r.prev!;
        return (
          d.title.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          (d.subclause ?? "").toLowerCase().includes(q)
        );
      })
    : rows;
  if (!visible) return null;
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-start gap-3 p-4 border-b border-border text-left hover:bg-muted/30 transition-colors">
            <span className="w-1 self-stretch rounded bg-muted-foreground/40" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground">
                Unmarked clauses · <span className="font-mono text-muted-foreground">{rows.length}</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Clauses you didn't previously flag and the supplier didn't materially change. Expand to search this list, or use the <span className="font-medium text-foreground">filter and search above</span> to narrow results, then request a change in this round.
              </p>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground mt-1 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {rows.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              Every clause has either been actioned or already has a material change in this round.
            </div>
          ) : (
            <>
              <div className="p-3 border-b border-border bg-muted/20 flex items-center gap-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    placeholder={`Search ${rows.length} unmarked clauses…`}
                    className="pl-9 h-8 text-sm"
                  />
                </div>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {filteredRows.length} / {rows.length}
                </span>
              </div>
              {filteredRows.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No unmarked clauses match "{localSearch}".
                </div>
              ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[240px]">Clause</TableHead>
                  <TableHead>Summary {leftLabel}</TableHead>
                  <TableHead>Summary {rightLabel}</TableHead>
                  <TableHead className="w-[180px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((r) => {
                  const display = r.curr ?? r.prev!;
                  const requested = isRequested(r.id);
                  const drafting = isDrafting(r.id);
                  const req = requestOf(r.id);
                  const draft = draftOf(r.id);
                  const isExpanded = expandedId === r.id || drafting;
                  const cancelDraft = () => {
                    if ((draft.requestedChange?.trim() || draft.rationale?.trim()) && !window.confirm("Discard this draft request?")) return;
                    onCancelDraft(r.id);
                    setExpandedId(null);
                  };
                  return (
                    <Fragment key={r.id}>
                      <TableRow
                        className="align-top cursor-pointer"
                        onClick={() => onOpenDetail(r.id)}
                      >
                        <TableCell>
                          <span className="text-sm font-medium text-foreground hover:text-primary">{display.title}</span>
                          <p className="text-[11px] font-mono text-muted-foreground">{r.id.toUpperCase()} · {display.subclause}</p>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.prev?.deviation ?? "—"}</TableCell>
                        <TableCell className="text-xs text-foreground">{r.curr?.deviation ?? "—"}</TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          {requested ? (
                            <Badge variant="secondary" className="text-[10px]">Requested</Badge>
                          ) : drafting ? (
                            <Badge variant="outline" className="bg-[#E6F1FB] text-[#0C447C] border-[#185FA5]/25 text-[10px]">
                              Drafting request
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="default"
                              className="h-7 text-[11px]"
                              onClick={() => {
                                onRequestChange(r.id);
                                setExpandedId(r.id);
                              }}
                            >
                              Request Change
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow className="bg-muted/20" onClick={(e) => e.stopPropagation()}>
                          <TableCell colSpan={4} className="p-4">
                            <div className="space-y-3">
                              <div className="grid md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                                    Requested change ({rightLabel}) <span className="text-destructive">*</span>
                                  </label>
                                  <Textarea
                                    value={draft.requestedChange ?? req.requestedChange ?? ""}
                                    onChange={(e) => onUpdateText(r.id, { requestedChange: e.target.value })}
                                    placeholder="Describe the change you want from the supplier"
                                    className="min-h-[64px] text-sm"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[11px] font-semibold text-muted-foreground uppercase">Rationale (optional)</label>
                                  <Textarea
                                    value={draft.rationale ?? req.rationale ?? ""}
                                    onChange={(e) => onUpdateText(r.id, { rationale: e.target.value })}
                                    placeholder="Why is this change required?"
                                    className="min-h-[64px] text-sm"
                                  />
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <p className="text-[11px] text-muted-foreground">
                                  Request will be included when the next version is uploaded.
                                </p>
                                <div className="flex items-center gap-2">
                                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={cancelDraft}>
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="h-8 text-xs gap-1.5"
                                    disabled={!(draft.requestedChange ?? req.requestedChange)?.trim()}
                                    onClick={() => {
                                      onSubmitDraft(r.id);
                                      setExpandedId(null);
                                    }}
                                  >
                                    <Sparkles className="h-3.5 w-3.5" /> Submit request
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
              )}
            </>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// ---- Round Tracker ----------------------------------------------------------

function RoundTracker({
  versions, stateOf, search, activeCategory, onOpenDetail,
}: {
  versions: ContractVersion[];
  stateOf: (id: string) => ClauseDecisionState;
  search: string;
  activeCategory: string | null;
  onOpenDetail: (id: string) => void;
}) {
  const rows = CLAUSE_FRAMEWORK.filter((d) => {
    if (activeCategory && d.category !== activeCategory) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!d.title.toLowerCase().includes(q) && !d.category.toLowerCase().includes(q) && !d.id.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-3">
      <div className="bg-card border border-border rounded-lg p-4">
        <h2 className="text-base font-semibold text-foreground">History</h2>
        <p className="text-xs text-muted-foreground">Track clause changes and outcomes across negotiation rounds.</p>
      </div>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[260px]">Clause</TableHead>
            {versions.map((v) => (
              <TableHead key={v.version} className="text-center">
                <div className="flex flex-col items-center">
                  <span className="font-mono text-xs font-bold text-foreground">Round {parseInt(v.version.replace("v", ""), 10)}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{v.version}</span>
                </div>
              </TableHead>
            ))}
            <TableHead className="text-center w-[140px]">Current Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((def) => {
            const state = stateOf(def.id);
            // Current status = outcome of latest version.
            const latest = roundOutcome(def.id, versions.at(-1)!.version, versions, state);
            return (
              <TableRow key={def.id} className="align-top cursor-pointer" onClick={() => onOpenDetail(def.id)}>
                <TableCell>
                  <span className="text-sm font-medium text-foreground hover:text-primary">
                    {def.title}
                  </span>
                  <p className="text-[11px] font-mono text-muted-foreground">{def.id.toUpperCase()} · {def.category}</p>
                </TableCell>
                {versions.map((v) => {
                  const o = roundOutcome(def.id, v.version, versions, state);
                  return (
                    <TableCell key={v.version} className="text-center">
                      <Badge variant="outline" className={`${o.tone} text-[10px]`}>{o.label}</Badge>
                    </TableCell>
                  );
                })}
                <TableCell className="text-center">
                  <Badge variant="outline" className={`${latest.tone} text-[10px]`}>{latest.label}</Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}

// ---- Side-by-side detail panel ---------------------------------------------

function ClauseSlideOver({
  clauseId,
  prev,
  curr,
  leftLabel,
  rightLabel,
  mode,
  versions,
  state,
  targetVersion,
  changePill,
  onClose,
  onViewHistory,
  onCloseClause,
  onKeepOpen,
  onMarkNewIssue,
}: {
  clauseId: string;
  prev?: ClauseResult;
  curr?: ClauseResult;
  leftLabel: string;
  rightLabel: string;
  mode: ClauseIqMode;
  versions: ContractVersion[];
  state: ClauseDecisionState;
  targetVersion: string;
  changePill: ChangePillResult;
  onClose: () => void;
  onViewHistory: (id: string) => void;
  onCloseClause: (id: string) => void;
  onKeepOpen: (id: string) => void;
  onMarkNewIssue: (id: string) => void;
}) {
  const def = CLAUSE_FRAMEWORK.find((d) => d.id === clauseId);
  const display = curr ?? prev ?? versions.at(-1)?.clauses.find((clause) => clause.id === clauseId);
  const historyRow = buildHistoryRow(clauseId, versions, state);
  if (!def || !display || !historyRow) return null;
  const isNewClause = changePill.status === "new";
  const callout = slideOverCallout(changePill.status, leftLabel);
  const request = getLatestRequest(state, leftLabel)?.request;
  const latestCell = [...historyRow.cells].reverse().find((cell) => cell.status !== "missing");

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-foreground/25" onClick={onClose} />
      <aside className="flex h-full w-[380px] flex-col border-l border-border bg-white shadow-xl">
        <div className="shrink-0 border-b border-border px-3.5 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[9px] font-medium uppercase text-muted-foreground">{clauseId.toUpperCase()} · {def.category}</p>
              <h2 className="mt-1 truncate text-[13px] font-medium text-foreground">{display.title}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className={`${severityTone(display.severity)} text-[9px]`}>{display.severity}</Badge>
                {changePill.status ? <ChangePillBadge result={changePill} /> : <RoundStatusPill status={historyRow.currentStatus}>{roundStatusLabel(historyRow.currentStatus)}</RoundStatusPill>}
                <button
                  type="button"
                  onClick={() => onViewHistory(clauseId)}
                  className="inline-flex items-center gap-1 rounded-full bg-[#FAEEDA]/70 px-2 py-0.5 text-[9px] font-medium text-[#633806] hover:bg-[#FAEEDA]"
                >
                  <IconTimeline size={11} stroke={1.8} />
                  {historyRow.existsInRounds} rounds of history
                </button>
              </div>
            </div>
            <button type="button" onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="shrink-0 border-b border-border bg-[#f8f7f5] px-3.5 py-2">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[9px] font-medium uppercase text-muted-foreground">Negotiation timeline</p>
            {mode === "comparison" && (
              <button type="button" onClick={() => onViewHistory(clauseId)} className="text-[9px] font-medium text-primary hover:underline">
                View in History →
              </button>
            )}
          </div>
          <div className="relative flex min-w-0 items-start gap-3 overflow-x-auto px-1 pb-1" aria-label={`Timeline for ${display.title}`}>
            <div className="absolute left-4 right-4 top-2 h-px bg-border" aria-hidden />
            {historyRow.cells.map((cell, index) => (
              <div key={cell.version || index} className="relative z-10 flex min-w-[42px] flex-col items-center gap-1">
                <span className={`grid h-4 w-4 place-items-center rounded-full border text-[8px] font-medium ${roundStatusTone(cell.status)} ${index === historyRow.cells.length - 1 ? "outline outline-2 outline-offset-1 outline-[#185FA5]" : ""}`}>
                  {index + 1}
                </span>
                <span className="text-[7px] text-muted-foreground">{cell.version || "—"}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3.5 py-3">
          {mode === "comparison" ? (
            <>
              {callout && (
                <div className={`rounded-md border-l-2 px-2.5 py-2 text-[10px] ${callout.className}`}>
                  <p>{callout.text}</p>
                </div>
              )}
              <SectionLabel>{leftLabel} → {rightLabel} diff</SectionLabel>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md bg-[#f8f7f5] px-2.5 py-2 opacity-75">
                  <p className="text-[8px] font-medium uppercase text-muted-foreground">{leftLabel} · previous</p>
                  <p className="mt-1 text-[10px] text-foreground">{isNewClause ? `(Clause did not exist in ${leftLabel})` : prev?.deviation ?? "—"}</p>
                </div>
                <div className="rounded-md bg-[#E6F1FB]/50 px-2.5 py-2">
                  <p className="text-[8px] font-medium uppercase text-[#185FA5]">{rightLabel} · current</p>
                  <p className="mt-1 text-[10px] text-foreground">{curr?.deviation ?? display.deviation}</p>
                </div>
              </div>
              <SectionLabel>AI analysis</SectionLabel>
              <p className="rounded-md bg-[#f8f7f5] px-2.5 py-2 text-[11px] text-muted-foreground">
                {display.improvementReason ?? display.actionability ?? `Based on the playbook benchmark for ${def.category}, review this clause before accepting the version.`}
              </p>
              {(changePill.status === "met" || changePill.status === "not_met") && request?.requestedChange && (
                <>
                  <SectionLabel>Your request</SectionLabel>
                  <p className="rounded-md bg-[#f8f7f5] px-2.5 py-2 text-[11px] text-muted-foreground">{request.requestedChange}</p>
                </>
              )}
            </>
          ) : (
            <>
              <SectionLabel>Description</SectionLabel>
              <p className="rounded-md bg-[#f8f7f5] px-2.5 py-2 text-[11px] text-muted-foreground">{display.deviation}</p>
              <SectionLabel>Latest diff</SectionLabel>
              <p className="rounded-md bg-[#f8f7f5] px-2.5 py-2 text-[11px] text-muted-foreground">
                {latestCell?.clause?.improvementReason ?? latestCell?.clause?.deviation ?? "No latest change available."}
              </p>
              <SectionLabel>AI analysis</SectionLabel>
              <p className="rounded-md bg-[#f8f7f5] px-2.5 py-2 text-[11px] text-muted-foreground">
                {display.actionability ?? `Clause history shows ${historyRow.stateChanges} state change${historyRow.stateChanges === 1 ? "" : "s"} across the negotiation.`}
              </p>
              <SectionLabel>Round-by-round</SectionLabel>
              <div className="space-y-1.5">
                {historyRow.cells.map((cell, index) => (
                  <div key={`${cell.version}-${index}`} className="flex items-start justify-between gap-2 rounded-md border border-border px-2.5 py-2 text-[10px]">
                    <div>
                      <p className="font-medium text-foreground">Round {index + 1} · {cell.version}</p>
                      <p className="mt-0.5 text-muted-foreground">{cell.clause?.improvementReason ?? cell.clause?.deviation ?? "Clause not present in this round."}</p>
                    </div>
                    <RoundStatusPill status={cell.status}>{cell.label}</RoundStatusPill>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 border-t border-border px-3.5 py-2.5">
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => toast({ title: "Full text", description: display.excerpt })}>
            View full text
          </Button>
          <SlideOverPrimaryAction
            status={changePill.status}
            onCloseClause={() => onCloseClause(clauseId)}
            onKeepOpen={() => onKeepOpen(clauseId)}
            onMarkNewIssue={() => onMarkNewIssue(clauseId)}
          />
        </div>
      </aside>
    </div>
  );
}

function slideOverCallout(status: ChangePillStatus | null, leftLabel: string) {
  if (status === "regressed") {
    return {
      text: "Supplier weakened this clause without being asked. Recommended: request revert in the next round.",
      className: "border-[#A32D2D] bg-[#FCEBEB]/50 text-[#791F1F]",
    };
  }
  if (status === "improved") {
    return {
      text: "Supplier improved this clause without being asked. You can accept or push for further improvement.",
      className: "border-[#3B6D11] bg-[#EAF3DE]/70 text-[#27500A]",
    };
  }
  if (status === "new") {
    return {
      text: `This clause did not exist in ${leftLabel}. Review carefully before accepting.`,
      className: "border-[#185FA5] bg-[#E6F1FB]/70 text-[#0C447C]",
    };
  }
  return null;
}

function SlideOverPrimaryAction({
  status,
  onCloseClause,
  onKeepOpen,
  onMarkNewIssue,
}: {
  status: ChangePillStatus | null;
  onCloseClause: () => void;
  onKeepOpen: () => void;
  onMarkNewIssue: () => void;
}) {
  const className = "ml-auto h-8 bg-[#1a2744] px-3 text-xs text-white hover:bg-[#243454]";
  if (status === "regressed") return <Button size="sm" className={className} onClick={onMarkNewIssue}>Request revert</Button>;
  if (status === "new" || status === "improved") return <Button size="sm" className={className} onClick={onCloseClause}>Accept</Button>;
  if (status === "met") return <Button size="sm" className={className} onClick={onCloseClause}>Mark resolved</Button>;
  if (status === "not_met") return <Button size="sm" className={className} onClick={onKeepOpen}>Re-request</Button>;
  return <Button size="sm" className={className} onClick={onMarkNewIssue}>Request change</Button>;
}

function detailCalloutForStatus(status: ChangePillStatus | null): {
  title: string;
  description: string;
  className: string;
} | null {
  if (status === "improved") {
    return {
      title: "Supplier improved this clause without being asked.",
      description: "You can accept, challenge, or push for further improvement.",
      className: "border-[#3B6D11]/25 bg-[#EAF3DE] text-[#27500A]",
    };
  }
  if (status === "regressed") {
    return {
      title: "Supplier weakened this clause without being asked.",
      description: "Recommended: request revert in the next round.",
      className: "border-[#A32D2D]/25 bg-[#FCEBEB] text-[#791F1F]",
    };
  }
  if (status === "new") {
    return {
      title: "This clause did not exist in the previous version.",
      description: "Review carefully before accepting.",
      className: "border-[#185FA5]/25 bg-[#E6F1FB] text-[#0C447C]",
    };
  }
  return null;
}

function ClauseDetailPanel({
  clauseId, prev, curr, leftLabel, rightLabel, state, targetVersion,
  changePill, onClose, onCloseClause, onKeepOpen, onMarkNewIssue,
}: {
  clauseId: string;
  prev?: ClauseResult;
  curr?: ClauseResult;
  leftLabel: string;
  rightLabel: string;
  state: ClauseDecisionState;
  targetVersion: string;
  changePill: ChangePillResult;
  onClose: () => void;
  onCloseClause: (id: string) => void;
  onKeepOpen: (id: string) => void;
  onMarkNewIssue: (id: string) => void;
}) {
  const def = CLAUSE_FRAMEWORK.find((d) => d.id === clauseId);
  const display = curr ?? prev;
  if (!def || !display) return null;
  const change = classifyChange(prev, curr);
  const isNewClause = changePill.status === "new";
  const directionalCallout = detailCalloutForStatus(changePill.status);
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-foreground/30" onClick={onClose} />
      <div className="w-full max-w-3xl bg-background border-l border-border overflow-y-auto">
        <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-mono font-bold text-muted-foreground">{clauseId.toUpperCase()} · {def.category}</p>
            <h2 className="text-lg font-bold text-foreground">{display.title}</h2>
            <p className="text-xs font-mono text-muted-foreground">{display.subclause}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {directionalCallout && (
            <div className={`rounded-md border px-3 py-2 text-sm ${directionalCallout.className}`}>
              <p className="font-medium">{directionalCallout.title}</p>
              <p className="mt-0.5 text-xs opacity-85">{directionalCallout.description}</p>
            </div>
          )}

          {/* Summary v1 vs v2 */}
          <SectionLabel>Summary</SectionLabel>
          {isNewClause ? (
            <SidePanel label={rightLabel} clause={curr} highlight />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <SidePanel label={leftLabel} clause={prev} />
              <SidePanel label={rightLabel} clause={curr} highlight={change === "material"} />
            </div>
          )}

          {/* Inline word-level text diff (TASK-06) */}
          {!isNewClause && (
            <>
              <SectionLabel>Clause text — {leftLabel} vs {rightLabel}</SectionLabel>
              <TextDiff prev={prev?.excerpt} curr={curr?.excerpt} leftLabel={leftLabel} rightLabel={rightLabel} />
            </>
          )}

          {/* Side-by-side excerpts (kept for legal review) */}
          <SectionLabel>Original text extracts</SectionLabel>
          {isNewClause ? (
            <ExcerptPanel label={rightLabel} text={curr?.excerpt} highlight />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <ExcerptPanel label={leftLabel} text={prev?.excerpt} />
              <ExcerptPanel label={rightLabel} text={curr?.excerpt} highlight={prev?.excerpt !== curr?.excerpt} />
            </div>
          )}

          {/* Audit trail + AI confidence (TASK-05, TASK-08) */}
          <SectionLabel>Why this verdict?</SectionLabel>
          <ClauseAuditPanel clauseId={clauseId} />

          {/* Locations + actionability */}
          <SectionLabel>Additional locations & actionability</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-border bg-card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase">{leftLabel}</span>
                <Badge variant="outline" className={severityTone((prev ?? display).severity)}>{prev?.severity ?? "—"}</Badge>
              </div>
              <LocationsList items={prev?.locations} />
            </div>
            <div className="rounded-md border border-border bg-card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase">{rightLabel}</span>
                <Badge variant="outline" className={severityTone((curr ?? display).severity)}>{curr?.severity ?? "—"}</Badge>
              </div>
              <LocationsList items={curr?.locations} />
            </div>
          </div>
          {display.actionability && (
            <div className="rounded-md border border-primary/20 bg-primary/5 p-3 space-y-1">
              <p className="text-[10px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb className="w-3 h-3" /> Suggested action
              </p>
              <p className="text-sm text-foreground">{display.actionability}</p>
            </div>
          )}

          {/* Requested change history */}
          {Object.keys(state.requests).length > 0 && (
            <>
              <SectionLabel>Requested change history</SectionLabel>
              <div className="space-y-2">
                {Object.entries(state.requests)
                  .filter(([, r]) => r.requestedChange || r.rationale)
                  .sort((a, b) => a[0].localeCompare(b[0]))
                  .map(([v, r]) => (
                    <div key={v} className="rounded-md border border-border bg-card p-3 text-sm space-y-1">
                      <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">{v}</p>
                      {r.requestedChange && (
                        <p><span className="text-[10px] font-semibold text-muted-foreground uppercase mr-2">Ask</span>{r.requestedChange}</p>
                      )}
                      {r.rationale && (
                        <p><span className="text-[10px] font-semibold text-muted-foreground uppercase mr-2">Why</span>{r.rationale}</p>
                      )}
                    </div>
                  ))}
              </div>
            </>
          )}


          {/* Action panel */}
          <div className="sticky bottom-0 -mx-6 px-6 py-4 bg-background border-t border-border flex items-center justify-between flex-wrap gap-3">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="font-semibold">{leftLabel} → {rightLabel}:</span>
              {changePill.status ? (
                <ChangePillBadge result={changePill} />
              ) : (
                <Badge variant="outline" className={`${materialChangeTone(change)} text-[10px]`}>{materialChangeLabel(change)}</Badge>
              )}
              {state.closures[targetVersion] && (
                <span>· status <span className="font-semibold text-foreground">{state.closures[targetVersion]}</span></span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {changePill.status === "improved" ? (
                <>
                  <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => onCloseClause(clauseId)}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => onMarkNewIssue(clauseId)}>
                    Challenge change
                  </Button>
                </>
              ) : changePill.status === "regressed" ? (
                <>
                  <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => onMarkNewIssue(clauseId)}>
                    <AlertTriangle className="w-3.5 h-3.5" /> Request revert
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => onCloseClause(clauseId)}>
                    Accept change
                  </Button>
                </>
              ) : changePill.status === "new" ? (
                <>
                  <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => onCloseClause(clauseId)}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => onMarkNewIssue(clauseId)}>
                    Request removal
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => onKeepOpen(clauseId)}>
                    <ArrowRight className="w-3.5 h-3.5" /> Keep Open
                  </Button>
                  <Button size="sm" variant="default" className="h-8 text-xs gap-1.5" onClick={() => onCloseClause(clauseId)}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Close
                  </Button>
                  <Button size="sm" variant="secondary" className="h-8 text-xs gap-1.5" onClick={() => onMarkNewIssue(clauseId)}>
                    <AlertTriangle className="w-3.5 h-3.5" /> Mark as New Issue
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{children}</p>;
}

function SidePanel({ label, clause, highlight }: { label: string; clause?: ClauseResult; highlight?: boolean }) {
  return (
    <div className={`rounded-md border p-3 space-y-2 ${highlight ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase">{label}</span>
        {clause && (
          <Badge variant="outline" className={severityTone(clause.severity)}>{clause.severity}</Badge>
        )}
      </div>
      <p className="text-sm text-foreground">{clause?.deviation ?? "— Not present —"}</p>
    </div>
  );
}

function ExcerptPanel({ label, text, highlight }: { label: string; text?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-md border p-3 space-y-2 ${highlight ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}>
      <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase">{label}</span>
      {text ? (
        <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-2">"{text}"</p>
      ) : (
        <p className="text-xs text-muted-foreground italic">— Not present —</p>
      )}
    </div>
  );
}

function LocationsList({ items }: { items?: string[] }) {
  if (!items || items.length === 0) return <p className="text-xs text-muted-foreground italic">No additional locations.</p>;
  return (
    <ul className="space-y-1">
      {items.map((l) => (
        <li key={l} className="text-xs text-foreground font-mono flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-muted-foreground" /> {l}
        </li>
      ))}
    </ul>
  );
}

// ---- Supplier grouping provenance popover (TASK-04) ------------------------

function SupplierGroupingPopover({
  supplierId,
  supplierName,
  compact = false,
}: {
  supplierId: string;
  supplierName: string;
  compact?: boolean;
}) {
  const g = getSupplierGrouping(supplierId);
  const isManual = g.source === "manual";
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" className={`${compact ? "h-7 px-2 text-xs" : "h-9"} gap-1.5`}>
          <Info className="w-3.5 h-3.5" /> Why grouped?
          <Badge variant="outline" className={`${compact ? "hidden 2xl:inline-flex" : ""} ${isManual ? "bg-secondary text-secondary-foreground border-border ml-1" : "bg-success/10 text-success border-success/20 ml-1"}`}>
            {isManual ? "Manual" : `Auto · ${(g.confidence * 100).toFixed(0)}%`}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-2">
        <p className="text-sm font-semibold text-foreground">Why is this grouped under {supplierName}?</p>
        <p className="text-xs text-muted-foreground">{g.matchBasis}</p>
        <div className="flex items-center justify-between pt-2 border-t border-border text-[11px] text-muted-foreground">
          <span>Source: <span className="font-semibold text-foreground capitalize">{g.source}</span></span>
          <span>Confidence: <span className="font-mono text-foreground">{(g.confidence * 100).toFixed(0)}%</span></span>
        </div>
        {g.lastOverride && (
          <p className="text-[11px] text-muted-foreground">
            Last manual override: <span className="text-foreground">{g.lastOverride.user}</span> on {g.lastOverride.date}
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}

function SupplierGroupingLink({ supplierId, supplierName }: { supplierId: string; supplierName: string }) {
  const g = getSupplierGrouping(supplierId);
  const isManual = g.source === "manual";
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-1 border-b border-dotted border-muted-foreground/60 text-[11px] font-medium text-muted-foreground hover:border-primary hover:text-primary"
        >
          <IconInfoCircle size={12} stroke={1.8} />
          Why grouped?
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 space-y-2">
        <p className="text-sm font-semibold text-foreground">Why is this grouped under {supplierName}?</p>
        <p className="text-xs text-muted-foreground">{g.matchBasis}</p>
        <div className="flex items-center justify-between border-t border-border pt-2 text-[11px] text-muted-foreground">
          <span>Source: <span className="font-semibold capitalize text-foreground">{g.source}</span></span>
          <Badge variant="outline" className={isManual ? "bg-secondary text-secondary-foreground" : "bg-success/10 text-success border-success/20"}>
            {isManual ? "Manual" : `Auto · ${(g.confidence * 100).toFixed(0)}%`}
          </Badge>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function HistoryCategorySidebar({
  categories,
  total,
  activeCategory,
  onSelectCategory,
}: {
  categories: Array<{ name: string; count: number }>;
  total: number;
  activeCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}) {
  return (
    <aside className="sticky top-[178px] h-[calc(100vh-178px)] border-r border-border py-2">
      <p className="px-3 py-1 text-[9px] font-medium uppercase text-muted-foreground">Categories</p>
      <button
        type="button"
        onClick={() => onSelectCategory(null)}
        className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-[11px] ${
          !activeCategory ? "bg-[#E6F1FB] font-medium text-foreground" : "text-muted-foreground hover:bg-[#f8f7f5]"
        }`}
      >
        <span>All</span>
        <span className="rounded-full bg-muted px-1.5 py-px text-[9px]">{total}</span>
      </button>
      {categories.map((category) => (
        <button
          key={category.name}
          type="button"
          onClick={() => onSelectCategory(category.name)}
          className={`flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-[11px] ${
            activeCategory === category.name ? "bg-[#E6F1FB] font-medium text-foreground" : "text-muted-foreground hover:bg-[#f8f7f5]"
          }`}
        >
          <span className="truncate">{category.name}</span>
          <span className="rounded-full bg-muted px-1.5 py-px text-[9px]">{category.count}</span>
        </button>
      ))}
    </aside>
  );
}

function HistoryRoundTable({
  versions,
  rows,
  onOpenDetail,
  highlightedId,
}: {
  versions: ContractVersion[];
  rows: HistoryRow[];
  onOpenDetail: (id: string) => void;
  highlightedId: string | null;
}) {
  if (rows.length === 0) {
    return (
      <div className="py-16 text-center text-[11px] italic text-muted-foreground">
        No clauses match the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto py-2">
      <div
        className="min-w-[860px]"
        style={{ display: "grid", gridTemplateColumns: `24px 180px repeat(${versions.length}, minmax(84px, 1fr)) 84px 18px` }}
      >
        <div className="border-b border-border px-3 py-2" />
        <div className="border-b border-border px-3 py-2 text-[8px] font-medium uppercase text-muted-foreground">Clause</div>
        {versions.map((version, index) => (
          <div key={version.version} className="border-b border-border px-3 py-2 text-center text-[8px] font-medium uppercase text-muted-foreground">
            R{index + 1} {version.version}
          </div>
        ))}
        <div className="border-b border-border px-3 py-2 text-center text-[8px] font-medium uppercase text-muted-foreground">Status</div>
        <div className="border-b border-border px-3 py-2" />

        {rows.map((row) => (
          <button
            id={`history-row-${row.id}`}
            key={row.id}
            type="button"
            onClick={() => onOpenDetail(row.id)}
            className={`contents text-left ${highlightedId === row.id ? "[&>*]:bg-[#E6F1FB]" : ""}`}
          >
            <div className="border-b border-border px-3 py-2">
              {row.stateChanges >= 3 && <span className="mt-2 block h-1.5 w-1.5 rounded-full bg-[#A32D2D]" />}
            </div>
            <div className="min-w-0 border-b border-border px-3 py-2 hover:bg-[#E6F1FB]/50">
              <p className="truncate text-[10px] font-medium text-foreground">{row.title}</p>
              <p className="text-[8px] uppercase text-muted-foreground">{row.id.toUpperCase()} · {row.category}</p>
            </div>
            {row.cells.map((cell) => (
              <div key={`${row.id}-${cell.version}`} className="border-b border-border px-3 py-2 text-center hover:bg-[#E6F1FB]/50">
                <RoundStatusPill status={cell.status}>{cell.label}</RoundStatusPill>
              </div>
            ))}
            <div className="border-b border-border px-3 py-2 text-center hover:bg-[#E6F1FB]/50">
              {row.currentPill.status ? <ChangePillBadge result={row.currentPill} /> : <RoundStatusPill status={row.currentStatus}>{roundStatusLabel(row.currentStatus)}</RoundStatusPill>}
            </div>
            <div className="border-b border-border px-3 py-2 text-center text-sm text-muted-foreground hover:bg-[#E6F1FB]/50">›</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function RoundStatusPill({ status, children }: { status: RoundStatus; children: ReactNode }) {
  return (
    <span className={`inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-medium ${roundStatusTone(status)}`}>
      {children}
    </span>
  );
}

function roundStatusTone(status: RoundStatus) {
  if (status === "requested") return "border-[#185FA5]/25 bg-[#E6F1FB] text-[#185FA5]";
  if (status === "open") return "border-[#BA7517]/25 bg-[#FAEEDA] text-[#633806]";
  if (status === "updated") return "border-border bg-muted text-muted-foreground";
  if (status === "met") return "border-[#3B6D11]/25 bg-[#EAF3DE] text-[#27500A]";
  if (status === "not_met") return "border-[#A32D2D]/25 bg-[#FCEBEB] text-[#791F1F]";
  if (status === "regressed") return "border-[#A32D2D]/25 bg-[#FAEEDA] text-[#633806]";
  if (status === "new") return "border-[#185FA5]/25 bg-[#E6F1FB] text-[#0C447C]";
  return "border-transparent bg-transparent text-muted-foreground";
}

function roundStatusLabel(status: RoundStatus) {
  if (status === "not_met") return "Not met";
  if (status === "requested") return "Req";
  if (status === "updated") return "Upd";
  return status === "missing" ? "—" : status.charAt(0).toUpperCase() + status.slice(1);
}

// ---- Clause audit + AI confidence (TASK-05 / TASK-08, R3 DI-15 + DI-17) ---

function ClauseAuditPanel({ clauseId }: { clauseId: string }) {
  const audit = getClauseAudit(clauseId);
  const conf = confidenceLabel(audit.confidence);
  const history = audit.history ?? [];
  return (
    <div className="rounded-md border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3" /> {audit.ruleId} · {audit.ruleName}
          </p>
          <p className="text-xs text-muted-foreground">
            Rule version <span className="font-mono">{audit.ruleVersion}</span>
          </p>
        </div>
        {/* DI-17: numeric band + reasoning shown inline, no hover required */}
        <div className="flex flex-col items-end gap-1">
          <Badge variant="outline" className={`${conf.tone} text-[11px] gap-1`}>
            <Sigma className="w-3 h-3" /> {conf.label} confidence ·{" "}
            <span className="font-mono">{(audit.confidence * 100).toFixed(0)}%</span>
            <span className="opacity-60 font-mono">({conf.range})</span>
          </Badge>
          <p className="text-[11px] text-muted-foreground max-w-[280px] text-right">{conf.reasoning}</p>
        </div>
      </div>

      <Tabs defaultValue="rule" className="w-full">
        <TabsList className="h-8">
          <TabsTrigger value="rule" className="text-[11px] h-7">Active rule</TabsTrigger>
          <TabsTrigger value="history" className="text-[11px] h-7 gap-1">
            <History className="w-3 h-3" /> Rule history
            {history.length > 0 && (
              <span className="ml-0.5 px-1 rounded bg-muted text-[10px] font-mono text-muted-foreground">
                {history.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rule" className="m-0 mt-3 space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">Expectation</p>
            <p className="text-sm text-foreground">{audit.expectation}</p>
          </div>
          {audit.matchedExcerpt && (
            <div>
              <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">Matched clause excerpt</p>
              <p className="text-xs italic text-muted-foreground border-l-2 border-primary/40 pl-2 mt-1">"{audit.matchedExcerpt}"</p>
              {audit.location && <p className="text-[11px] font-mono text-muted-foreground mt-1">Location: {audit.location}</p>}
            </div>
          )}
          <div>
            <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">AI rationale</p>
            <p className="text-xs text-foreground">{audit.rationale}</p>
          </div>
          {audit.confidence < 0.7 && (
            <div className="rounded border border-destructive/30 bg-destructive/5 p-2 text-[11px] text-destructive flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" /> Low confidence — review the source clause before accepting.
            </div>
          )}
          {audit.evidenceUrl && (
            <a
              href={audit.evidenceUrl}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View evidence <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </TabsContent>

        <TabsContent value="history" className="m-0 mt-3">
          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No prior versions recorded for this rule.</p>
          ) : (
            <ol className="space-y-2.5 border-l border-border pl-3">
              {history.map((h, i) => {
                const prevExpectation = history[i + 1]?.expectation;
                const changedExpectation = prevExpectation && prevExpectation !== h.expectation;
                return (
                  <li key={h.version} className="relative">
                    <span className="absolute -left-[18px] top-1 w-2.5 h-2.5 rounded-full bg-primary/70 border-2 border-card" aria-hidden />
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-mono text-[11px] font-semibold text-foreground">{h.version}</span>
                      <span className="text-[10px] text-muted-foreground">{h.date}</span>
                      <span className="text-[10px] text-muted-foreground">· {h.author}</span>
                      {i === 0 && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-primary/10 text-primary border-primary/30">
                          current
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-foreground mt-0.5">{h.change}</p>
                    {changedExpectation && (
                      <div className="mt-1 text-[11px] rounded border border-border bg-muted/30 p-2 space-y-0.5">
                        <p>
                          <span className="text-destructive line-through decoration-destructive">
                            {prevExpectation}
                          </span>
                        </p>
                        <p>
                          <span className="text-success underline decoration-success decoration-2 underline-offset-2">
                            {h.expectation}
                          </span>
                        </p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
