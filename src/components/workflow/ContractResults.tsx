import { useState, useMemo, useEffect, Fragment, type MouseEvent, type ReactNode } from "react";
import {
  ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, Search, MapPin, Lightbulb,
  GitCompare, History, X, ArrowRight, Sparkles, Upload, Trash2, FileText, Loader2,
  Download, Info, FileDiff, ShieldCheck, ExternalLink, Sigma, Pin, RotateCcw,
  Clock, MoreHorizontal, ShieldX,
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
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import {
  IconCircleCheck,
  IconCircleX,
  IconFlame,
  IconHelp,
  IconPlus,
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
} from "@/lib/change-tracking";
import { VersionVerdictBanner } from "./VersionVerdictBanner";
import { TextDiff } from "./TextDiff";
import { NegotiationTrendStrip } from "./NegotiationTrendStrip";
import { getClauseAudit, confidenceLabel } from "@/lib/audit-trail";
import { getSupplierGrouping } from "@/lib/supplier-grouping";
import { exportContractCsv, downloadCsv } from "@/lib/csv-export";
import { useVersionPairMemory } from "@/hooks/use-version-pair-memory";

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

type TabKey = "review" | "compare" | "tracker";
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
  scoringOption: controlledScoringOption,
  onScoringOptionChange,
}: Props) {
  const initiative = getInitiative(initiativeId);
  const supplier = getSupplier(initiativeId, supplierId);
  const contract = getContract(initiativeId, supplierId, contractId);
  const decisions = useClauseDecisions();

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

  // Default "compared pair" = previous → latest if multiple rounds, else v1 only.
  // Persisted per-contract in sessionStorage so users keep context when navigating around (TASK-10).
  const defaultPair = useMemo(() => {
    if (versions.length >= 2) return { left: versions.at(-2)!.version, right: versions.at(-1)!.version };
    return { left: versions[0]?.version ?? "", right: versions[0]?.version ?? "" };
  }, [versions]);
  const { pair, setPair, reset: resetPair } = useVersionPairMemory(contractId, defaultPair);
  const leftVersion = versions.find((v) => v.version === pair.left) ?? v1;
  const rightVersion = versions.find((v) => v.version === pair.right) ?? latest;

  // Which version the Review tab is focused on (defaults to latest so the user
  // can review v1 first, then re-review v2 once it's uploaded).
  const [reviewVersionLabel, setReviewVersionLabel] = useState<string>(() => versions[0]?.version ?? "v1");
  const reviewVersion = versions.find((v) => v.version === reviewVersionLabel) ?? v1;

  // Default to Review tab — most users start here.
  const [tab, setTab] = useState<TabKey>("review");
  useEffect(() => {
    if (versions.length < 2 && tab !== "review") {
      setTab("review");
    }
  }, [versions.length, tab]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [detailClauseId, setDetailClauseId] = useState<string | null>(null);
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
  // R3 DI-14: one-time coachmark for the "New Changes" filter.
  const [coachDismissed, setCoachDismissed] = useState<boolean>(() => {
    try { return localStorage.getItem("ciq-coach-unexpected-v1") === "1"; } catch { return false; }
  });
  const dismissCoach = () => {
    setCoachDismissed(true);
    try { localStorage.setItem("ciq-coach-unexpected-v1", "1"); } catch { /* noop */ }
  };
  // Focus mode = hide comparison rows already closed by the user.
  

  // Upload / delete modals
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  // Decision per-version: accept / request changes (state only — no side effects).
  const [decisions_, setDecisions_] = useState<Record<string, "accepted" | "changes-requested" | null>>({});
  const [acceptConfirmOpen, setAcceptConfirmOpen] = useState(false);
  const [quickFilter, setQuickFilter] = useState<QuickFilterKey | null>(null);
  const [localScoringOption, setLocalScoringOption] = useState<ScoringOptionKey>("hybrid");
  const scoringOption = controlledScoringOption ?? localScoringOption;
  const setScoringOption = onScoringOptionChange ?? setLocalScoringOption;
  const scoringOptionControlled = controlledScoringOption !== undefined;
  const [overviewOpen, setOverviewOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem("ciq-v2-contract-overview-open") === "1";
    } catch {
      return false;
    }
  });

  const toggleOverviewOpen = () => {
    setOverviewOpen((current) => {
      const next = !current;
      try {
        localStorage.setItem("ciq-v2-contract-overview-open", next ? "1" : "0");
      } catch {
        // Ignore storage failures in private or restricted browser contexts.
      }
      return next;
    });
  };

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

  // --- Comparison sections (must run before any early return) ---------------
  // Open Items = previously requested clauses (whether updated or not).
  // New Changes = material change to a clause that was NOT previously requested.
  // Closed = previously requested clauses the user has marked closed for this round.
  const comparisonSections = useMemo(() => {
    if (!leftVersion || !rightVersion || leftVersion.version === rightVersion.version) {
      return { open: [], newIssues: [], closed: [], unmarked: [] };
    }
    const open: { id: string; prev?: ClauseResult; curr?: ClauseResult }[] = [];
    const newIssues: { id: string; prev?: ClauseResult; curr?: ClauseResult }[] = [];
    const closed: { id: string; prev?: ClauseResult; curr?: ClauseResult }[] = [];
    const unmarked: { id: string; prev?: ClauseResult; curr?: ClauseResult }[] = [];

    for (const def of CLAUSE_FRAMEWORK) {
      const prev = leftVersion.clauses.find((c) => c.id === def.id);
      const curr = rightVersion.clauses.find((c) => c.id === def.id);
      const s = allDecisions[def.id] ?? { roundDecisions: {}, closures: {}, requests: {}, updatedAt: "" };
      const wasRequested = wasRequestedByVersion(s, versions, leftVersion.version);
      const changePill = determineChangePill({
        clause: curr,
        previousClause: prev,
        wasRequestedInPreviousRound: wasRequested,
      });
      const isClosedHere = s.closures[rightVersion.version] === "closed";

      if (isClosedHere) {
        closed.push({ id: def.id, prev, curr });
      } else if (wasRequested) {
        open.push({ id: def.id, prev, curr });
      } else if (
        changePill.status === "improved" ||
        changePill.status === "regressed" ||
        changePill.status === "new"
      ) {
        newIssues.push({ id: def.id, prev, curr });
      } else {
        unmarked.push({ id: def.id, prev, curr });
      }
    }
    return { open, newIssues, closed, unmarked };
  }, [leftVersion, rightVersion, versions, allDecisions]);

  const changeTracking = useMemo(() => {
    if (!leftVersion || !rightVersion || leftVersion.version === rightVersion.version) {
      return { met: 0, notMet: 0, improved: 0, regressed: 0, new: 0, requestedTotal: 0, supplierChanges: 0 };
    }

    let met = 0;
    let notMet = 0;
    let improved = 0;
    let regressed = 0;
    let newCount = 0;

    for (const curr of rightVersion.clauses) {
      const prev = leftVersion.clauses.find((c) => c.id === curr.id);
      const state = allDecisions[curr.id];
      const wasRequested = wasRequestedByVersion(state, versions, leftVersion.version);
      const changePill = determineChangePill({
        clause: curr,
        previousClause: prev,
        wasRequestedInPreviousRound: wasRequested,
      });

      if (changePill.status === "met") met += 1;
      if (changePill.status === "not-met") notMet += 1;
      if (changePill.status === "improved") improved += 1;
      if (changePill.status === "regressed") regressed += 1;
      if (changePill.status === "new") {
        newCount += 1;
      }
    }

    return {
      met,
      notMet,
      improved,
      regressed,
      new: newCount,
      requestedTotal: met + notMet,
      supplierChanges: improved + regressed + newCount,
    };
  }, [leftVersion, rightVersion, versions, allDecisions]);

  const panelChangeItems = useMemo<PanelChangeItem[]>(() => {
    if (!leftVersion || !rightVersion || leftVersion.version === rightVersion.version) return [];

    const items: PanelChangeItem[] = [];

    for (const def of CLAUSE_FRAMEWORK) {
      const prev = leftVersion.clauses.find((c) => c.id === def.id);
      const curr = rightVersion.clauses.find((c) => c.id === def.id);
      const state = allDecisions[def.id];
      const wasRequested = wasRequestedByVersion(state, versions, leftVersion.version);
      const changePill = determineChangePill({
        clause: curr,
        previousClause: prev,
        wasRequestedInPreviousRound: wasRequested,
      });

      if (changePill.status) {
        items.push({
          id: def.id,
          title: curr?.title ?? prev?.title ?? def.title,
          status: changePill.status,
        });
      }
    }

    return items.sort((a, b) => sortChangePillStatus(a.status) - sortChangePillStatus(b.status) || a.title.localeCompare(b.title));
  }, [leftVersion, rightVersion, versions, allDecisions]);

  const scoringModel = useMemo(() => computeContractScoring(versions), [versions]);

  // R3 DI-14: auto-toggle "New Changes" the first time the user lands on
  // Compare with supplier-initiated changes present.
  const [autoToggled, setAutoToggled] = useState(false);
  useEffect(() => {
    if (autoToggled) return;
    if (tab !== "compare") return;
    if (comparisonSections.newIssues.length === 0) return;
    if (filter !== "all") return;
    setFilter("new-issues");
    setAutoToggled(true);
  }, [tab, comparisonSections.newIssues.length, filter, autoToggled]);

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
    setTab("review");
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
      setTab("compare");
      setFilter("all");
    }
    if (next === "changes") {
      setTab("compare");
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

  // ---------------------------------------------------------------------------
  const overviewPanelVisible = overviewOpen;
  const overviewToggleLabel = overviewOpen ? "Close" : "Overview";
  const overviewToggleExpanded = overviewOpen;
  const toggleOverviewPanel = toggleOverviewOpen;
  const overviewPanelFlush = scoringOption === "hybrid";
  const hasVersionComparison = Boolean(leftVersion && rightVersion && leftVersion.version !== rightVersion.version);

  return (
    <div className="min-h-screen bg-background">
      {compactHeader ? (
        <div className="sticky top-0 z-30 border-b border-[rgba(0,0,0,0.08)] bg-white">
          <div className="flex h-11 items-center justify-between gap-3 border-b border-[rgba(0,0,0,0.08)] px-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={onBack}
                className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                <ChevronLeft className="h-4 w-4" /> {compactBackLabel}
              </button>
              <div className="h-4 w-px bg-border" aria-hidden />
              <h1 className="truncate text-sm font-medium text-foreground">{contract.name}</h1>
              <Badge variant="outline" className="h-5 rounded-full bg-muted/50 px-2 text-[10px] font-medium">
                {contract.type}
              </Badge>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {latest?.version ?? "v1"} · {versions.length} round{versions.length === 1 ? "" : "s"}
              </span>
              <span className="hidden min-w-0 truncate text-[11px] text-muted-foreground xl:inline">
                {initiative.name} · {initiative.reference} · {supplier.name}
                {latest && <> · Updated {latest.uploadedAt}</>}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {!scoringOptionControlled && (
                <ScoringOptionSwitcher value={scoringOption} onChange={setScoringOption} />
              )}
              <SupplierGroupingPopover supplierId={supplierId} supplierName={supplier.name} compact />
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 px-3 text-xs"
                disabled={versions.length < 2}
                onClick={exportCurrentComparison}
              >
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
              <Button
                size="sm"
                className="h-7 gap-1.5 px-3 text-xs"
                onClick={onRunAnalysisAgain ?? (() => setUploadOpen(true))}
              >
                <RotateCcw className="h-3.5 w-3.5" /> Run analysis again
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="outline" className="h-7 w-7" aria-label="More version actions">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-xs">Version actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={versions.length === 0}
                    className="gap-2 text-xs text-destructive focus:text-destructive"
                    onClick={() => latest && setDeleteTarget(latest.version)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete latest version
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex h-8 items-center justify-between gap-3 bg-[#f8f7f5] px-4 text-[11px] text-muted-foreground">
            <div className="flex min-w-0 items-center gap-2 overflow-x-auto">
              <CompactStripStat active={quickFilter === "high"} color="#A32D2D" onClick={() => toggleQuickFilter("high")}>
                <strong>{v1Counts.high}</strong> high
              </CompactStripStat>
              <CompactStripStat active={quickFilter === "medium"} color="#854F0B" onClick={() => toggleQuickFilter("medium")}>
                <strong>{v1Counts.medium}</strong> med
              </CompactStripStat>
              <CompactStripStat active={quickFilter === "low"} color="#5F5E5A" onClick={() => toggleQuickFilter("low")}>
                <strong>{v1Counts.low}</strong> low
              </CompactStripStat>
              <CompactDivider />
              <CompactStripStat onClick={() => setQuickFilter(null)}>
                <strong>{v1Counts.total}</strong> total
              </CompactStripStat>
              <CompactStripStat active={quickFilter === "need-action"} onClick={() => toggleQuickFilter("need-action")}>
                <strong>{clausesRequiringAction}</strong> need action
              </CompactStripStat>
              {hasVersionComparison && (
                <>
                  <CompactDivider />
                  <CompactStripStat color="#3B6D11" onClick={() => toggleQuickFilter("need-action")}>
                    <IconCircleCheck className="mr-1 inline h-3 w-3 align-[-2px]" />
                    <strong>{changeTracking.met}/{changeTracking.requestedTotal}</strong> met
                  </CompactStripStat>
                  <Popover>
                    <PopoverTrigger asChild>
                      <CompactStripStat active={quickFilter === "changes"} color="#5F5E5A" onClick={() => undefined}>
                        <strong>{changeTracking.supplierChanges}</strong> changes
                      </CompactStripStat>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-56 p-3 text-xs">
                      <p className="font-medium text-foreground">Supplier-initiated changes</p>
                      <p className="mt-1 text-muted-foreground">
                        {changeTracking.improved} improved · {changeTracking.regressed} regressed · {changeTracking.new} {NEW_CHANGE_LABEL.toLowerCase()}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3 h-7 w-full text-[11px]"
                        onClick={() => toggleQuickFilter("changes")}
                      >
                        Show New Changes
                      </Button>
                    </PopoverContent>
                  </Popover>
                </>
              )}
              {scoringModel && (
                <>
                  <CompactDivider />
                  <ScoringStripSummary option={scoringOption} model={scoringModel} />
                </>
              )}
            </div>
            <button
              type="button"
              onClick={toggleOverviewPanel}
              className="inline-flex shrink-0 items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-white hover:text-foreground"
            >
              {overviewToggleLabel}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${overviewToggleExpanded ? "rotate-180" : ""}`} />
            </button>
          </div>

          <div
            className={`grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out ${
              overviewPanelVisible ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="min-h-0 overflow-hidden">
              <div
                className={
                  overviewPanelFlush
                    ? "border-t border-[rgba(0,0,0,0.08)] bg-white"
                    : "space-y-4 border-t border-[rgba(0,0,0,0.08)] bg-white p-4"
                }
              >
                {scoringModel && (
                  <ScoringOptionPanel
                    option={scoringOption}
                    model={scoringModel}
                    versions={versions}
                    leftLabel={leftVersion?.version ?? "v1"}
                    rightLabel={rightVersion?.version ?? latest?.version ?? "v1"}
                    changeItems={panelChangeItems}
                    onClauseSelect={jumpToClause}
                    onRequestChanges={() =>
                      rightVersion &&
                      setDecisions_((prev) => ({ ...prev, [rightVersion.version]: "changes-requested" }))
                    }
                    onAcceptVersion={() => setAcceptConfirmOpen(true)}
                    currentDecision={currentDecision}
                  />
                )}
              </div>
            </div>
          </div>
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
              setTab("compare");
              setFilter("open");
              setTimeout(() => document.getElementById("comparison-buckets")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
            }}
            onJumpToChanges={() => {
              setTab("compare");
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
              setTab("compare");
            }}
          />
        </div>
      )}

      {/* Body: left clause nav + right content */}
      <div className="max-w-[1600px] mx-auto px-6 py-6 grid grid-cols-[260px_1fr] gap-6">
        {/* Left clause navigation */}
        <ClauseNavigator
          versions={versions}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          decisions={allDecisions}
          rightVersion={rightVersion}
          leftVersion={leftVersion}
          compactMode={compactHeader}
        />

        {/* Right content */}
        <div className="space-y-4 min-w-0">
          <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="review" className="gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Review
              </TabsTrigger>
              <TabsTrigger value="compare" className="gap-1.5" disabled={versions.length < 2}>
                <GitCompare className="w-3.5 h-3.5" /> Changes
                {versions.length < 2 && <span className="text-[9px] text-muted-foreground">v2+</span>}
              </TabsTrigger>
              <TabsTrigger value="tracker" className="gap-1.5" disabled={versions.length < 2}>
                <History className="w-3.5 h-3.5" /> History
                {versions.length < 2 && <span className="text-[9px] text-muted-foreground">v2+</span>}
              </TabsTrigger>
            </TabsList>

            {/* Filter / search shared across tabs */}
            <div className="bg-card border border-border rounded-lg p-3 mt-3 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter by clause name, category, or ID…"
                  className="pl-9 h-9"
                />
              </div>
              {tab === "review" && (
                <Select value={reviewVersionLabel} onValueChange={setReviewVersionLabel}>
                  <SelectTrigger className="w-[180px] h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((v) => (
                      <SelectItem key={v.version} value={v.version}>
                        Review {v.version} · {v.uploadedAt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {tab === "compare" && versions.length >= 2 && (
                <>
                  <div className="relative">
                    <Select value={filter} onValueChange={(v) => setFilter(v as FilterKey)}>
                      <SelectTrigger className="w-[200px] h-9 text-sm">
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
                    {/* R3 DI-14: dismissible coachmark — fires when auto-toggle pre-filtered the view */}
                    {autoToggled && !coachDismissed && filter === "new-issues" && (
                      <div className="absolute z-20 top-[calc(100%+8px)] left-0 w-[280px] rounded-lg border border-primary/40 bg-card shadow-lg p-3 text-xs">
                        <div className="absolute -top-1.5 left-6 w-3 h-3 rotate-45 bg-card border-l border-t border-primary/40" aria-hidden />
                        <p className="font-semibold text-foreground flex items-center gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5 text-primary" /> We pre-filtered to New Changes
                        </p>
                        <p className="text-muted-foreground mt-1">
                          {comparisonSections.newIssues.length} supplier-initiated change{comparisonSections.newIssues.length === 1 ? "" : "s"}.
                          Switch back any time.
                        </p>
                        <div className="flex justify-end mt-2">
                          <Button size="sm" variant="ghost" className="h-6 text-[11px]" onClick={dismissCoach}>Got it</Button>
                        </div>
                      </div>
                    )}
                  </div>
                  {comparisonSections.newIssues.length > 0 && filter !== "new-issues" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/5"
                      onClick={() => setFilter("new-issues")}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" /> Show {comparisonSections.newIssues.length} New Changes
                    </Button>
                  )}
                  <PairSelector versions={versions} pair={pair} onChange={setPair} />
                  <Button size="sm" variant="ghost" className="h-9 text-xs text-muted-foreground" onClick={resetPair}>
                    Reset to latest
                  </Button>
                </>
              )}
            </div>

            <TabsContent value="review" className="m-0 mt-3 space-y-5">
              {versions.length === 0 ? (
                <div className="bg-card border border-border rounded-lg p-12 text-center text-sm text-muted-foreground">
                  No versions uploaded yet. Use <span className="font-semibold text-foreground">Upload New Version</span> to get started.
                </div>
              ) : (
                <ReviewScreen
                  version={reviewVersion ?? v1}
                  stateOf={stateOf}
                  activeCategory={activeCategory}
                  search={search}
                  quickSeverityFilter={severityQuickFilter}
                  onDecide={(id, d) => decisions.setRoundDecision(supplierId, contractId, id, (reviewVersion ?? v1).version, d)}
                  onUpdateText={(id, patch) =>
                    decisions.updateRequestText(supplierId, contractId, id, (reviewVersion ?? v1).version, patch)
                  }
                  onOpenDetail={(id) => setDetailClauseId(id)}
                  highlightedId={highlightClauseId}
                />
              )}
            </TabsContent>

            <TabsContent value="compare" className="m-0 mt-3 space-y-5" id="comparison-buckets">
              {versions.length < 2 ? (
                <div className="bg-card border border-border rounded-lg p-12 text-center text-sm text-muted-foreground">
                  Upload a second version to start comparing rounds.
                </div>
              ) : leftVersion && rightVersion && leftVersion.version !== rightVersion.version ? (
                <>
                  <div className="bg-card border border-primary/30 rounded-lg p-4 text-sm text-foreground flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold">Comparing {leftVersion.version} → {rightVersion.version}</p>
                      <p className="text-xs text-muted-foreground">Open Items shows clauses you previously requested to change — the Change column tells you whether the supplier acted on them.</p>
                    </div>
                  </div>
                  <ComparisonSection
                    title="Open Items"
                    description="Clauses you previously asked the supplier to change. Check whether they updated each one."
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
                    description="Clauses you marked as resolved for this round. Reopen any that still need work."
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
                    isRequested={(id) => stateOf(id).roundDecisions[rightVersion.version] === "request-update"}
                    onRequestChange={(id) =>
                      decisions.setRoundDecision(supplierId, contractId, id, rightVersion.version, "request-update")
                    }
                    onUpdateText={(id, patch) =>
                      decisions.updateRequestText(supplierId, contractId, id, rightVersion.version, patch)
                    }
                    onOpenDetail={setDetailClauseId}
                  />
                </>
              ) : (
                <div className="bg-card border border-border rounded-lg p-12 text-center text-sm text-muted-foreground">
                  Select two different versions to compare.
                </div>
              )}
            </TabsContent>

            <TabsContent value="tracker" className="m-0 mt-3">
              <RoundTracker
                versions={versions}
                stateOf={stateOf}
                search={search}
                activeCategory={activeCategory}
                onOpenDetail={setDetailClauseId}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Side-by-side detail drawer */}
      {detail && (
        <ClauseDetailPanel
          clauseId={detail.id}
          prev={detail.prev}
          curr={detail.curr}
          leftLabel={leftVersion?.version ?? "v1"}
          rightLabel={rightVersion?.version ?? "v1"}
          state={detail.state}
          targetVersion={rightVersion?.version ?? "v1"}
          changePill={changePillFor(detail.id, detail.prev, detail.curr)}
          onClose={() => setDetailClauseId(null)}
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

function CompactStripStat({
  active,
  color,
  onClick,
  children,
}: {
  active?: boolean;
  color?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ color }}
      className={`shrink-0 rounded px-1.5 py-0.5 transition-colors hover:bg-white ${
        active ? "bg-white shadow-sm" : ""
      }`}
    >
      {children}
    </button>
  );
}

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
  "not-met": {
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

function OverviewSectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
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

type DeviationDistribution = Record<"high" | "medium" | "low" | "clean", number>;

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
        <BandChip band={version.band} />
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

  const statusOrder: PanelChangeStatus[] = ["met", "not-met", "regressed", "improved", "new"];

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
  versions, pair, onChange,
}: {
  versions: ContractVersion[];
  pair: { left: string; right: string };
  onChange: (p: { left: string; right: string }) => void;
}) {
  const value = `${pair.left}->${pair.right}`;
  const opts: { left: string; right: string; label: string }[] = [];
  for (let i = 0; i < versions.length - 1; i++) {
    opts.push({ left: versions[i].version, right: versions[i + 1].version, label: `${versions[i].version} → ${versions[i + 1].version}` });
  }
  // Baseline shortcut.
  if (versions.length >= 2) {
    opts.push({ left: versions[0].version, right: versions.at(-1)!.version, label: `${versions[0].version} → ${versions.at(-1)!.version} (baseline)` });
  }
  return (
    <Select value={value} onValueChange={(v) => {
      const opt = opts.find((o) => `${o.left}->${o.right}` === v);
      if (opt) onChange({ left: opt.left, right: opt.right });
    }}>
      <SelectTrigger className="w-[220px] h-9 text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {opts.map((o) => (
          <SelectItem key={`${o.left}->${o.right}`} value={`${o.left}->${o.right}`}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
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

function ReviewScreen({
  version, stateOf, activeCategory, search, quickSeverityFilter, onDecide, onUpdateText, onOpenDetail, highlightedId,
}: {
  version: ContractVersion;
  stateOf: (id: string) => ClauseDecisionState;
  activeCategory: string | null;
  search: string;
  quickSeverityFilter: "high" | "medium" | "low" | null;
  onDecide: (id: string, d: RoundDecision) => void;
  onUpdateText: (id: string, patch: { requestedChange?: string; rationale?: string }) => void;
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
      <div className="bg-card border border-primary/20 rounded-lg px-4 py-3 text-xs text-muted-foreground flex items-start gap-2">
        <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
        <span>
          Select <span className="font-semibold text-foreground">"Request Change"</span> for clauses you want the supplier to update in the next round.
          {versionLabel !== "v1" && (
            <> Notes added on <span className="font-semibold text-foreground">{versionLabel}</span> override the previous round's note when comparing this version onwards. Leave blank to keep the earlier ask in effect.</>
          )}
        </span>
      </div>
      {rows.map((c) => {
        const state = stateOf(c.id);
        const decision = state.roundDecisions[versionLabel];
        const own = state.requests[versionLabel] ?? {};
        const inherited = getLatestRequest(state, versionLabel);
        const inheritedFromOlder = inherited && inherited.version !== versionLabel ? inherited : undefined;
        return (
          <div
            id={`clause-row-${c.id}`}
            key={c.id}
            className={`bg-card border rounded-lg p-4 border-l-4 ${
              decision === "request-update" ? "border-l-primary border-border"
                : decision === "no-action" ? "border-l-success border-border"
                : "border-l-border"
            } ${highlightedId === c.id ? "ring-2 ring-primary/40 bg-primary/5" : ""}`}
          >
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
                </div>
                <p className="text-sm text-foreground">{c.deviation}</p>
                {c.actionability && (
                  <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <Lightbulb className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                    <span><span className="font-semibold text-foreground">Actionability:</span> {c.actionability}</span>
                  </p>
                )}
              </div>
              <div className="flex flex-col items-stretch gap-2 shrink-0 w-[180px]">
                <Button
                  size="sm"
                  variant={decision === "request-update" ? "default" : "outline"}
                  className="h-8 text-xs gap-1.5"
                  onClick={() => onDecide(c.id, "request-update")}
                >
                  <Sparkles className={`w-3.5 h-3.5 ${decision === "request-update" ? "fill-current" : ""}`} />
                  {decision === "request-update" ? "Requested" : "Request Change"}
                </Button>
                <Button
                  size="sm"
                  variant={decision === "no-action" ? "secondary" : "outline"}
                  className="h-8 text-xs gap-1.5"
                  onClick={() => onDecide(c.id, "no-action")}
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

            {decision === "request-update" && (
              <div className="mt-3 pt-3 border-t border-border space-y-3">
                {inheritedFromOlder && !own.requestedChange && !own.rationale && (
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
                      Requested change ({versionLabel})
                    </label>
                    <Textarea
                      value={own.requestedChange ?? ""}
                      onChange={(e) => onUpdateText(c.id, { requestedChange: e.target.value })}
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
                      value={own.rationale ?? ""}
                      onChange={(e) => onUpdateText(c.id, { rationale: e.target.value })}
                      placeholder="Why is this change required?"
                      className="min-h-[64px] text-sm"
                    />
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
                    {bucket === "open" && changePill.status === "not-met" && !wasUpdated && (
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
  requestOf, isRequested, onRequestChange, onUpdateText, onOpenDetail,
}: {
  rows: { id: string; prev?: ClauseResult; curr?: ClauseResult }[];
  leftLabel: string;
  rightLabel: string;
  visible: boolean;
  defaultOpen: boolean;
  requestOf: (id: string) => { requestedChange?: string; rationale?: string };
  isRequested: (id: string) => boolean;
  onRequestChange: (id: string) => void;
  onUpdateText: (id: string, patch: { requestedChange?: string; rationale?: string }) => void;
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
                  const req = requestOf(r.id);
                  const isExpanded = expandedId === r.id || requested;
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
                            <div className="grid md:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                                  Requested change ({rightLabel})
                                </label>
                                <Textarea
                                  value={req.requestedChange ?? ""}
                                  onChange={(e) => onUpdateText(r.id, { requestedChange: e.target.value })}
                                  placeholder="Describe the change you want from the supplier"
                                  className="min-h-[64px] text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-muted-foreground uppercase">Rationale (optional)</label>
                                <Textarea
                                  value={req.rationale ?? ""}
                                  onChange={(e) => onUpdateText(r.id, { rationale: e.target.value })}
                                  placeholder="Why is this change required?"
                                  className="min-h-[64px] text-sm"
                                />
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
