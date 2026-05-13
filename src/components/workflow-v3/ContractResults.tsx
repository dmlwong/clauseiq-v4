import { useState, useMemo, useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, Search, MapPin, Lightbulb,
  GitCompare, History, X, ArrowRight, Sparkles, Upload, Trash2, FileText, Loader2,
  Download, Info, ShieldCheck, ExternalLink, Sigma, Pin, RotateCcw,
  Clock, ShieldX, ShoppingBag, Send,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

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
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleDashed,
  IconCircleX,
  IconArrowsDiff,
  IconEye,
  IconFlame,
  IconHelp,
  IconInfoCircle,
  IconList,
  IconProgress,
  IconTimeline,
  IconTrendingDown,
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
  type ClauseRequest,
  type RoundDecision,
  type ClosureDecision,
} from "@/hooks/use-clause-decisions";
import { cn } from "@/lib/utils";
import { CLAUSE_FRAMEWORK } from "@/lib/clauses-framework";
import { classifyChange, materialChangeLabel, materialChangeTone } from "@/lib/material-change";
import {
  CHANGE_DIRECTION_CONFIDENCE_THRESHOLD,
  UNEXPECTED_CHANGE_LABEL,
  determineChangePill,
  sortChangePillStatus,
  type ChangePillResult,
  type ChangePillStatus,
  type VersionComparisonPair,
} from "@/lib/change-tracking-v3";
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
  summariseComparisonRows,
  versionOrder,
  type ComparisonBucketStats,
  type ComparisonRow,
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

interface CategorySidebarItem {
  name: string;
  count: number;
  severity: Record<"high" | "medium" | "low" | "clean", number>;
}

type MoverSeverity = "high" | "medium" | "low" | "clean";
type ComparisonMoverDirection = "worsened" | "unexpected" | "manual_review";

interface ComparisonMover {
  id: string;
  name: string;
  previousSeverity: MoverSeverity | null;
  currentSeverity: MoverSeverity;
  direction: ComparisonMoverDirection;
  movementScore: number;
}

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
  worsened_last_round: "Worsened last round",
  met: "Met",
  unexpected_clauses: "Unexpected clauses",
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
    value === "worsened_last_round" ||
    value === "met" ||
    value === "unexpected_clauses"
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

function normalizeCategorySort(value: string | null): CategorySortKey {
  return value === "az" || value === "count" ? value : "risk";
}

// ---- helpers ----------------------------------------------------------------

function clauseCategory(id: string): string {
  return CLAUSE_FRAMEWORK.find((c) => c.id === id)?.category ?? "Uncategorised";
}

function categorySlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function categoryFromParam(value: string | null, categories: CategorySidebarItem[]) {
  if (!value || value === "all") return null;
  const decoded = decodeURIComponent(value);
  return categories.find((category) => category.name === decoded || categorySlug(category.name) === decoded)?.name ?? null;
}

function deriveCategorySidebarItems(version: ContractVersion | null | undefined): CategorySidebarItem[] {
  const categoryMap = new Map<string, CategorySidebarItem>();

  for (const def of CLAUSE_FRAMEWORK) {
    if (!categoryMap.has(def.category)) {
      categoryMap.set(def.category, {
        name: def.category,
        count: 0,
        severity: { high: 0, medium: 0, low: 0, clean: 0 },
      });
    }
  }

  for (const clause of version?.clauses ?? []) {
    const category = CLAUSE_FRAMEWORK.find((def) => def.id === clause.id)?.category ?? "Uncategorised";
    const item =
      categoryMap.get(category) ??
      {
        name: category,
        count: 0,
        severity: { high: 0, medium: 0, low: 0, clean: 0 },
      };

    item.count += 1;
    if (clause.resolved) {
      item.severity.clean += 1;
    } else {
      item.severity[clause.severity] += 1;
    }
    categoryMap.set(category, item);
  }

  return Array.from(categoryMap.values());
}

function categoryRiskWeight(category: CategorySidebarItem) {
  return category.severity.high * 9 + category.severity.medium * 3 + category.severity.low;
}

function sortCategorySidebarItems(items: CategorySidebarItem[], sort: CategorySortKey) {
  return [...items].sort((a, b) => {
    if (a.name === "Uncategorised") return 1;
    if (b.name === "Uncategorised") return -1;
    if (sort === "az") return a.name.localeCompare(b.name);
    if (sort === "count") return b.count - a.count || a.name.localeCompare(b.name);
    return categoryRiskWeight(b) - categoryRiskWeight(a) || b.severity.high - a.severity.high || b.severity.medium - a.severity.medium || a.name.localeCompare(b.name);
  });
}

const moverSeverityWeight: Record<MoverSeverity, number> = {
  clean: 0,
  low: 1,
  medium: 3,
  high: 9,
};

function moverSeverityFromClause(clause?: ClauseResult): MoverSeverity | null {
  if (!clause) return null;
  return clause.resolved ? "clean" : clause.severity;
}

function formatMoverSeverity(severity: MoverSeverity | null) {
  if (!severity) return "New";
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

function deriveComparisonMovers(rows: ComparisonRow[]): ComparisonMover[] {
  return rows
    .map((row) => {
      const direction =
        row.pill.status === "worsened" ||
        row.pill.status === "unexpected" ||
        row.pill.status === "manual_review"
          ? row.pill.status
          : null;
      if (!direction || !row.curr) return null;

      const previousSeverity = moverSeverityFromClause(row.prev);
      const currentSeverity = moverSeverityFromClause(row.curr) ?? "clean";
      const previousWeight = previousSeverity ? moverSeverityWeight[previousSeverity] : 0;
      const currentWeight = moverSeverityWeight[currentSeverity];
      const movementScore =
        direction === "unexpected"
          ? currentWeight
          : direction === "worsened"
            ? (currentWeight - previousWeight) * 2
            : currentWeight;

      return {
        id: row.id,
        name: row.curr.title,
        previousSeverity,
        currentSeverity,
        direction,
        movementScore,
      };
    })
    .filter((mover): mover is ComparisonMover => Boolean(mover));
}

function visibleTopMovers(movers: ComparisonMover[]) {
  const ranked = [...movers]
    .sort((a, b) => Math.abs(b.movementScore) - Math.abs(a.movementScore) || moverSeverityWeight[b.currentSeverity] - moverSeverityWeight[a.currentSeverity] || a.name.localeCompare(b.name))
    .slice(0, 3);
  const directionOrder: Record<ComparisonMoverDirection, number> = {
    worsened: 0,
    unexpected: 1,
    manual_review: 2,
  };
  return ranked.sort(
    (a, b) =>
      directionOrder[a.direction] - directionOrder[b.direction] ||
      Math.abs(b.movementScore) - Math.abs(a.movementScore) ||
      moverSeverityWeight[b.currentSeverity] - moverSeverityWeight[a.currentSeverity] ||
      a.name.localeCompare(b.name),
  );
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
  const categorySort = normalizeCategorySort(searchParams.get("catSort"));
  const comparisonCategoryItems = useMemo(() => deriveCategorySidebarItems(rightVersion), [rightVersion]);
  const historyCategoryItems = useMemo(() => deriveCategorySidebarItems(latest), [latest]);
  const activeCategory = categoryFromParam(
    searchParams.get("cat"),
    mode === "history" ? historyCategoryItems : comparisonCategoryItems,
  );
  const categoryTotal = (mode === "history" ? historyCategoryItems : comparisonCategoryItems).reduce(
    (sum, category) => sum + category.count,
    0,
  );
  const setActiveCategory = (category: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (category) params.set("cat", categorySlug(category));
    else params.delete("cat");
    setSearchParams(params, { replace: false });
  };
  const setCategorySort = (sort: CategorySortKey) => {
    const params = new URLSearchParams(searchParams);
    params.set("catSort", sort);
    setSearchParams(params, { replace: false });
  };
  useEffect(() => {
    if (searchParams.get("catSort") === categorySort) return;
    const params = new URLSearchParams(searchParams);
    params.set("catSort", categorySort);
    setSearchParams(params, { replace: true });
  }, [categorySort, searchParams, setSearchParams]);
  const updateHistoryState = (patch: { filter?: HistoryFilter; sort?: HistorySort }) => {
    const params = new URLSearchParams(searchParams);
    params.set("mode", "history");
    if (patch.filter) params.set("filter", patch.filter);
    if (patch.sort) params.set("sort", patch.sort);
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
  const pendingRequestItems = useMemo<BasketRequestItem[]>(() => {
    if (mode !== "comparison" || versions.length < 2 || !rightVersion) return [];
    return decisions.getPendingRequests(supplierId, contractId, rightVersion.version).map((item) => {
      const clause =
        rightVersion.clauses.find((candidate) => candidate.id === item.clauseId) ??
        leftVersion?.clauses.find((candidate) => candidate.id === item.clauseId);
      const def = CLAUSE_FRAMEWORK.find((candidate) => candidate.id === item.clauseId);
      return {
        clauseId: item.clauseId,
        clauseTitle: clause?.title ?? def?.title ?? item.clauseId.toUpperCase(),
        request: item.request,
      };
    });
  }, [contractId, decisions, leftVersion, mode, rightVersion, supplierId, versions.length]);

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
    () => deriveHistoryModel(versions, allDecisions, historyFilter, activeCategory, historySort),
    [activeCategory, allDecisions, historyFilter, historySort, versions],
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

  const stripStats = comparisonModel.stripStats;
  const comparisonMovers = useMemo(
    () => deriveComparisonMovers(comparisonModel.buckets.new_changes),
    [comparisonModel],
  );

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
  const targetCounts = comparisonModel.contractFacts;

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
  const clausesRequiringAction = comparisonModel.actionFacts.pendingReview;
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
    const params = new URLSearchParams(searchParams);
    params.delete("cat");
    if (versions.length >= 2) {
      params.set("mode", "comparison");
      params.set("tab", "changes");
      try {
        sessionStorage.setItem(tabStorageKey, "changes");
      } catch {
        // Session storage is optional in the prototype.
      }
    }
    setSearchParams(params, { replace: false });
    setFilter("all");
    setQuickFilter(null);
    setSearch("");
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
  const showMoreChanges = () => {
    setTab("changes");
    setFilter("new-issues");
    setQuickFilter(null);
    setTimeout(() => {
      document.getElementById("comparison-buckets")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  const matchesQuickSeverity = (clause?: ClauseResult) =>
    !severityQuickFilter || clause?.severity === severityQuickFilter;
  const filterRowsByQuickSeverity = <T extends { id: string; prev?: ClauseResult; curr?: ClauseResult }>(rows: T[]) =>
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
            viewingVersion={mode === "comparison" ? (rightVersion?.version ?? latest?.version ?? "v1") : undefined}
            stats={mode === "comparison" ? stripStats : undefined}
            quickFilter={quickFilter}
            onToggleQuickFilter={toggleQuickFilter}
            onClearQuickFilter={() => setQuickFilter(null)}
            supplierId={supplierId}
            supplierName={supplier.name}
          />
          <ModeSwitcher
            mode={mode}
            onChange={switchMode}
            onExport={exportCurrentComparison}
            exportDisabled={versions.length < 2}
            onRunAnalysis={onRunAnalysisAgain ?? (() => setUploadOpen(true))}
          />
          {mode === "comparison" ? (
            <ComparisonHeader
              versions={versions}
              pair={pair}
              onPairChange={setPair}
              hasVersionComparison={hasVersionComparison}
              stripStats={stripStats}
              panel={comparisonModel.panel}
              movers={comparisonMovers}
              onMoverSelect={setDetailClauseId}
              onSeeMoreChanges={showMoreChanges}
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
        <div className="mx-auto grid max-w-[1600px] grid-cols-[240px_minmax(0,1fr)] gap-6 px-6 py-6">
          <CategorySidebar
            categories={historyCategoryItems}
            total={categoryTotal}
            activeCategory={activeCategory}
            sort={categorySort}
            onSortChange={setCategorySort}
            onSelectCategory={setActiveCategory}
          />
          <HistoryRoundTable
            versions={versions}
            rows={historyModel.filteredRows}
            onOpenDetail={setDetailClauseId}
            highlightedId={highlightClauseId}
          />
        </div>
      ) : (
        <div className="mx-auto grid max-w-[1600px] grid-cols-[240px_minmax(0,1fr)] gap-6 px-6 py-6">
          <CategorySidebar
            categories={comparisonCategoryItems}
            total={categoryTotal}
            activeCategory={activeCategory}
            sort={categorySort}
            onSortChange={setCategorySort}
            onSelectCategory={setActiveCategory}
          />

          <div id="comparison-work-column" className="min-w-0 space-y-4">
            {versions.length >= 2 && (
              <div className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2 border-b border-border px-1 pb-2">
                <div className="flex shrink-0 items-center gap-5">
                  <ComparisonTabButton
                    active={tab === "changes"}
                    icon={<IconArrowsDiff size={14} stroke={1.8} />}
                    count={targetCounts.total}
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
                <ComparisonToolbarControls
                  search={search}
                  onSearchChange={setSearch}
                  filter={filter}
                  onFilterChange={setFilter}
                  showBucketFilter={tab === "changes"}
                  onResetToLatest={resetPair}
                />
              </div>
            )}

            {versions.length < 2 && (
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-[#f8f7f5] px-3 py-2">
                <ReviewGuidance versionLabel={reviewVersion?.version ?? reviewVersionLabel} compact />
                <ComparisonToolbarControls
                  search={search}
                  onSearchChange={setSearch}
                  filter={filter}
                  onFilterChange={setFilter}
                  showBucketFilter={false}
                  onResetToLatest={resetPair}
                />
              </div>
            )}

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
                  stats={comparisonModel.bucketStats.open_items}
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
                  stats={comparisonModel.bucketStats.new_changes}
                  closureOf={() => undefined}
                  requestOf={(id) => stateOf(id).requests[rightVersion.version] ?? {}}
                  draftOf={(id) => stateOf(id).draftRequests?.[rightVersion.version] ?? {}}
                  onClose={(id) => decisions.setRoundDecision(supplierId, contractId, id, rightVersion.version, "no-action")}
                  onKeepOpen={(id) => decisions.startDraftRequest(supplierId, contractId, id, rightVersion.version)}
                  onUpdateText={(id, patch) => decisions.updateDraftRequestText(supplierId, contractId, id, rightVersion.version, patch)}
                  onCancelDraft={(id) => decisions.cancelDraftRequest(supplierId, contractId, id, rightVersion.version)}
                  onSubmitDraft={(id) => decisions.submitDraftRequest(supplierId, contractId, id, rightVersion.version)}
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
                  stats={comparisonModel.bucketStats.closed}
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
                  decisionOf={(id) => stateOf(id).roundDecisions[rightVersion.version]}
                  isDrafting={(id) => Boolean(stateOf(id).draftRequests?.[rightVersion.version])}
                  onRequestChange={(id) => decisions.startDraftRequest(supplierId, contractId, id, rightVersion.version)}
                  onSetNoAction={(id) => decisions.changeDecision(supplierId, contractId, id, rightVersion.version, "no-action")}
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

      <RequestsBasket
        requests={pendingRequestItems}
        supplierName={supplier.name}
        onEdit={(id) => setDetailClauseId(id)}
        onRemove={(id) => rightVersion && decisions.removePendingRequest(supplierId, contractId, id, rightVersion.version)}
        onSubmit={() => {
          if (!rightVersion) return;
          decisions.submitPendingRequests(supplierId, contractId, rightVersion.version);
          toast({
            title: "Requests submitted",
            description: `${pendingRequestItems.length} request${pendingRequestItems.length === 1 ? "" : "s"} sent to ${supplier.name}.`,
          });
        }}
      />

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
  viewingVersion,
  stats,
  quickFilter,
  onToggleQuickFilter,
  onClearQuickFilter,
  supplierId,
  supplierName,
}: {
  backLabel: string;
  onBack: () => void;
  contractName: string;
  contractType: string;
  viewingVersion?: string;
  stats?: ReturnType<typeof deriveComparisonModel>["stripStats"];
  quickFilter?: QuickFilterKey | null;
  onToggleQuickFilter?: (key: QuickFilterKey) => void;
  onClearQuickFilter?: () => void;
  supplierId: string;
  supplierName: string;
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
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <h1 className="min-w-[120px] truncate text-sm font-medium text-foreground">{contractName}</h1>
        <Badge variant="outline" className="h-5 rounded-full bg-muted/50 px-2 text-[9px] font-medium">
          {contractType}
        </Badge>
        {viewingVersion && <ViewingVersionChip version={viewingVersion} />}
        {stats && onToggleQuickFilter && onClearQuickFilter && (
          <TopbarStatsCluster
            stats={stats}
            quickFilter={quickFilter ?? null}
            onToggleQuickFilter={onToggleQuickFilter}
            onClearQuickFilter={onClearQuickFilter}
          />
        )}
        <SupplierGroupingLink supplierId={supplierId} supplierName={supplierName} />
      </div>
    </div>
  );
}

function ViewingVersionChip({ version }: { version: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[rgba(230,241,251,0.5)] px-2 py-0.5 text-[10px] font-medium text-[#0C447C]">
      <IconEye size={11} stroke={1.8} aria-hidden />
      Viewing {version} · Current
    </span>
  );
}

function TopbarStatsCluster({
  stats,
  quickFilter,
  onToggleQuickFilter,
  onClearQuickFilter,
}: {
  stats: ReturnType<typeof deriveComparisonModel>["stripStats"];
  quickFilter: QuickFilterKey | null;
  onToggleQuickFilter: (key: QuickFilterKey) => void;
  onClearQuickFilter: () => void;
}) {
  const { contract, comparison, actions } = stats;
  return (
    <div className="hidden shrink-0 items-center gap-1.5 text-[10px] text-muted-foreground xl:flex">
      <TopbarStatButton active={quickFilter === "changes"} onClick={() => onToggleQuickFilter("changes")}>
        <strong>{comparison.supplierChanges}</strong> changes
      </TopbarStatButton>
      <span className="text-border">·</span>
      <TopbarStatButton active={quickFilter === "need-action"} onClick={() => onToggleQuickFilter("need-action")}>
        <strong>{actions.pendingReview}</strong> need review
      </TopbarStatButton>
    </div>
  );
}

function TopbarStatButton({
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
      className={cn(
        "rounded px-1 py-0.5 transition-colors hover:bg-[#E6F1FB]/60 hover:text-foreground",
        active && "bg-[#E6F1FB] text-[#0C447C]",
      )}
      style={color ? { color } : undefined}
    >
      {children}
    </button>
  );
}

function ModeSwitcher({
  mode,
  onChange,
  onExport,
  exportDisabled,
  onRunAnalysis,
}: {
  mode: ClauseIqMode;
  onChange: (mode: ClauseIqMode) => void;
  onExport: () => void;
  exportDisabled: boolean;
  onRunAnalysis: () => void;
}) {
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
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Button size="sm" variant="outline" className="h-7 gap-1.5 px-3 text-xs" disabled={exportDisabled} onClick={onExport}>
          <Download className="h-3.5 w-3.5" /> Export
        </Button>
        <Button size="sm" className="h-7 gap-1.5 bg-[#1a2744] px-3 text-xs text-white hover:bg-[#243454]" onClick={onRunAnalysis}>
          <RotateCcw className="h-3.5 w-3.5" /> Run Analysis
        </Button>
      </div>
    </div>
  );
}

function ComparisonHeader({
  versions,
  pair,
  onPairChange,
  hasVersionComparison,
  stripStats,
  panel,
  movers,
  onMoverSelect,
  onSeeMoreChanges,
}: {
  versions: ContractVersion[];
  pair: { left: string; right: string };
  onPairChange: (pair: { left: string; right: string }) => void;
  hasVersionComparison: boolean;
  stripStats: ReturnType<typeof deriveComparisonModel>["stripStats"];
  panel: VersionPanelData;
  movers: ComparisonMover[];
  onMoverSelect: (id: string) => void;
  onSeeMoreChanges: () => void;
}) {
  const { contract, comparison } = stripStats;

  return (
    <>
      <div className="flex h-8 items-center gap-3 border-b border-[rgba(0,0,0,0.08)] bg-[#f8f7f5] px-3 text-[11px] text-muted-foreground">
        <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.04em]">Comparing</span>
        {versions.length >= 2 ? (
          <PairSelector versions={versions} pair={pair} onChange={onPairChange} compact />
        ) : (
          <span className="text-[10px] text-muted-foreground">{contract.version || pair.right}</span>
        )}
        <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          Total Clauses - <strong className="text-foreground">{contract.total}</strong>
        </span>
        <InlineMetIndicator comparison={comparison} hasVersionComparison={hasVersionComparison} />
        <div className="ml-auto rounded-md border border-border bg-white px-2 py-0.5 text-[10px]">
          <span className="mr-1 uppercase text-muted-foreground">Score</span>
          <strong className="text-[13px] text-foreground">{contract.score}</strong>
          <span className={comparison.scoreDelta > 0 ? "ml-1 text-[#3B6D11]" : comparison.scoreDelta < 0 ? "ml-1 text-[#A32D2D]" : "ml-1 text-muted-foreground"}>
            {comparison.scoreDelta > 0 ? `↑+${comparison.scoreDelta}` : comparison.scoreDelta < 0 ? `↓-${Math.abs(comparison.scoreDelta)}` : "→0"}
          </span>
        </div>
      </div>
      <HybridVersionMovementPanel
        data={panel}
        hasComparison={hasVersionComparison}
        versions={versions}
        movers={movers}
        onMoverSelect={onMoverSelect}
        onSeeMoreChanges={onSeeMoreChanges}
      />
    </>
  );
}

function InlineMetIndicator({
  comparison,
  hasVersionComparison,
}: {
  comparison: ReturnType<typeof deriveComparisonModel>["stripStats"]["comparison"];
  hasVersionComparison: boolean;
}) {
  if (!hasVersionComparison || comparison.requestedTotal === 0) return null;
  const allMet = comparison.notMet === 0 && comparison.met === comparison.requestedTotal;
  const noneMet = comparison.met === 0;
  const color = allMet ? "#3B6D11" : noneMet ? "#A32D2D" : "#854F0B";
  const label = allMet
    ? "All met"
    : noneMet
      ? "None met yet"
      : `${comparison.met} of ${comparison.requestedTotal} met`;
  const Icon = allMet ? IconCircleCheck : noneMet ? AlertTriangle : CheckCircle2;

  return (
    <span className="ml-1 inline-flex shrink-0 items-center gap-1.5 text-[10px]" style={{ color }}>
      <Icon className="h-3.5 w-3.5" size={13} stroke={1.8} aria-hidden />
      <span className="text-[11px] font-medium">{label}</span>
      {!noneMet && (
        <span className="text-[10px] font-normal text-muted-foreground">
          · {comparison.met}/{comparison.requestedTotal}
        </span>
      )}
    </span>
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

function ComparisonToolbarControls({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  showBucketFilter,
  onResetToLatest,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  filter: FilterKey;
  onFilterChange: (value: FilterKey) => void;
  showBucketFilter: boolean;
  onResetToLatest: () => void;
}) {
  return (
    <div className="ml-auto flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
      <div className="relative min-w-[180px] flex-1 sm:max-w-[260px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Filter by name or ID..."
          className="h-8 bg-card pl-8 text-xs"
        />
      </div>
      {showBucketFilter && (
        <>
          <Select value={filter} onValueChange={(value) => onFilterChange(value as FilterKey)}>
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
          <Button size="sm" variant="ghost" className="h-8 shrink-0 text-[11px] text-muted-foreground" onClick={onResetToLatest}>
            Reset to latest
          </Button>
        </>
      )}
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
  partially_met: {
    label: "Partially Met",
    className: "bg-[#FAEEDA] text-[#633806]",
    Icon: IconProgress,
  },
  not_met: {
    label: "Not met",
    className: "bg-[#FCEBEB] text-[#791F1F]",
    Icon: IconCircleX,
  },
  worsened: {
    label: "Worsened",
    className: "bg-[#FCEBEB] text-[#791F1F]",
    Icon: IconTrendingDown,
  },
  unexpected: {
    label: UNEXPECTED_CHANGE_LABEL,
    className: "bg-[#E6F1FB] text-[#0C447C]",
    Icon: IconAlertTriangle,
  },
  manual_review: {
    label: "Manual Review",
    className: "bg-[#F1EFE8] text-[#5F5E5A]",
    Icon: IconCircleDashed,
  },
};

function ChangePillBadge({ result }: { result: ChangePillResult }) {
  if (!result.status) return null;
  const config = changePillConfig[result.status];
  const Icon = config.Icon;
  const lowConfidence =
    (result.status === "partially_met" || result.status === "worsened") &&
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

function HybridVersionMovementPanel({
  data,
  hasComparison,
  versions,
  movers = [],
  onMoverSelect,
  onSeeMoreChanges,
}: {
  data: HybridMovementPanelData;
  hasComparison?: boolean;
  versions?: ContractVersion[];
  movers?: ComparisonMover[];
  onMoverSelect?: (id: string) => void;
  onSeeMoreChanges?: () => void;
}) {
  const canCompare = hasComparison ?? Boolean(data.previous);
  if (!canCompare || !data.previous) {
    return (
      <div className="flex min-h-[70px] items-center gap-4 border-b border-[rgba(0,0,0,0.08)] bg-white px-4 py-3">
        <div className="min-w-[180px] flex-1 text-[10px] font-medium text-muted-foreground">
          First analysis — no comparison available
        </div>
        <CompactVersionDistributionSide version={data.current} label="current" versions={versions} current />
      </div>
    );
  }

  return (
    <div className="border-b border-[rgba(0,0,0,0.08)] bg-white">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <CompactVersionDistributionSide version={data.previous} label="previous" versions={versions} />
        <DeltaIndicator delta={data.delta} />
        <CompactVersionDistributionSide version={data.current} label="current" versions={versions} current />
      </div>
      <MovementSummaryZone
        movers={movers}
        delta={data.delta}
        onMoverSelect={onMoverSelect}
        onSeeMoreChanges={onSeeMoreChanges}
      />
    </div>
  );
}

function CompactVersionDistributionSide({
  version,
  label,
  versions,
  current,
}: {
  version: HybridMovementPanelData["current"];
  label: "previous" | "current";
  versions?: ContractVersion[];
  current?: boolean;
}) {
  const uploadedAt = versions?.find((item) => item.version === version.version)?.uploadedAt;
  const labelText = uploadedAt ? `${version.version} · ${formatShortDate(uploadedAt)}` : version.version;
  return (
    <div
      aria-label={`${label} version ${labelText}, score ${version.score}`}
      className={cn(
        "grid min-h-[54px] min-w-0 flex-1 grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md border px-3 py-2",
        current ? "border-[#185FA5]/35 bg-[rgba(230,241,251,0.55)] shadow-[inset_3px_0_0_#185FA5]" : "border-transparent bg-[#f8f7f5]",
      )}
    >
      <div className="min-w-[62px]">
        <div className="flex items-center gap-1">
          <span className={cn(
            "text-[9px] font-medium uppercase tracking-[0.04em]",
            current ? "text-[#185FA5]" : "text-muted-foreground",
          )}>
            {labelText}
          </span>
          {current && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#185FA5] px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.04em] text-white">
              <IconEye size={10} stroke={2} aria-hidden />
              Current version
            </span>
          )}
        </div>
        <p className="mt-0.5 text-2xl font-medium leading-none text-foreground tabular-nums">{version.score}</p>
      </div>
      <div className="min-w-0">
        <DistributionCounts distribution={version.distribution} />
        <CompactDistributionBar distribution={version.distribution} />
      </div>
      <span className="w-1" aria-hidden />
    </div>
  );
}

function DeltaIndicator({ delta }: { delta: number }) {
  const color = delta > 0 ? "#3B6D11" : delta < 0 ? "#A32D2D" : "hsl(var(--muted-foreground))";
  const label = delta > 0 ? `+${delta}` : delta < 0 ? `−${Math.abs(delta)}` : "0";
  return (
    <div className="flex shrink-0 flex-col items-center gap-0.5 px-0.5">
      <ArrowRight className="h-[13px] w-[13px] text-muted-foreground" />
      <span className="text-sm font-medium leading-none tabular-nums" style={{ color }}>
        {label}
      </span>
      <span className="text-[8px] leading-none text-muted-foreground">pts</span>
    </div>
  );
}

const deviationDistributionColors: Record<keyof DeviationDistribution, string> = {
  high: "#A32D2D",
  medium: "#BA7517",
  low: "#B4B2A9",
  clean: "#3B6D11",
};

function DistributionCounts({ distribution }: { distribution: DeviationDistribution }) {
  return (
    <div className="mb-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] text-muted-foreground">
      <DistributionCount value={distribution.high} label="high" color="#A32D2D" />
      <span className="text-border">·</span>
      <DistributionCount value={distribution.medium} label="med" color="#854F0B" />
      <span className="text-border">·</span>
      <DistributionCount value={distribution.low} label="low" color="hsl(var(--foreground))" />
      <span className="text-border">·</span>
      <DistributionCount value={distribution.clean} label="clean" color="hsl(var(--muted-foreground))" />
    </div>
  );
}

function DistributionCount({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <span className="whitespace-nowrap">
      <strong className="font-medium tabular-nums" style={{ color }}>{value}</strong> {label}
    </span>
  );
}

function CompactDistributionBar({ distribution }: { distribution: DeviationDistribution }) {
  const total = Math.max(1, distribution.high + distribution.medium + distribution.low + distribution.clean);
  return (
    <div className="flex h-2 overflow-hidden rounded-[3px] bg-muted" style={{ gap: 1 }}>
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

function MovementSummaryZone({
  movers,
  delta,
  onMoverSelect,
  onSeeMoreChanges,
}: {
  movers: ComparisonMover[];
  delta: number;
  onMoverSelect?: (id: string) => void;
  onSeeMoreChanges?: () => void;
}) {
  return (
    <div className="grid gap-[18px] border-t border-[rgba(0,0,0,0.08)] bg-[rgba(230,241,251,0.15)] px-3.5 py-3 min-[900px]:grid-cols-[1fr_1.6fr]">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full bg-[#1a2744] text-white" aria-hidden="true">
            <Sparkles className="h-3 w-3" />
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-medium uppercase tracking-[0.04em] text-muted-foreground">Supplier-initiated</p>
            <p className="text-xs font-medium text-foreground">What changed this round</p>
          </div>
        </div>
        <MovementNarrative movers={movers} delta={delta} />
        {onSeeMoreChanges && (
          <button
            type="button"
            onClick={onSeeMoreChanges}
            className="ml-[30px] mt-0.5 rounded px-1 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            See all changes →
          </button>
        )}
      </div>
      <div className="min-w-0">
        {movers.length > 0 && onMoverSelect ? (
          <TopMoversList movers={movers} onMoverSelect={onMoverSelect} />
        ) : (
          <div className="rounded-[5px] border border-border bg-white px-2.5 py-2 text-[11px] text-muted-foreground">
            No clause movements this round.
          </div>
        )}
      </div>
    </div>
  );
}

function MovementNarrative({ movers, delta }: { movers: ComparisonMover[]; delta: number }) {
  const worsened = movers.filter((mover) => mover.direction === "worsened").length;
  const unexpected = movers.filter((mover) => mover.direction === "unexpected").length;
  const manualReview = movers.filter((mover) => mover.direction === "manual_review").length;
  const total = worsened + unexpected + manualReview;
  const scoreText = delta > 0 ? `Net change: +${delta} points.` : delta < 0 ? `Net change: -${Math.abs(delta)} points.` : total > 0 ? "Score unchanged." : "";
  const ariaLabel =
    total === 0
      ? delta === 0
        ? "No supplier-initiated changes in this round."
        : `Score recalculated. No supplier-initiated changes this round. ${scoreText}`
      : `${worsened ? `${worsened} worsened` : ""}${worsened && unexpected ? ", " : ""}${unexpected ? `${unexpected} unexpected` : ""}${(worsened || unexpected) && manualReview ? ", " : ""}${manualReview ? `${manualReview} need manual review` : ""}. ${scoreText}`.trim();

  return (
    <p className="ml-[30px] mt-1.5 min-w-0 text-[12px] leading-[1.55] text-foreground" aria-label={ariaLabel}>
      {total === 0 ? (
        delta === 0 ? (
          <>No supplier-initiated changes in this round.</>
        ) : (
          <>
            <span className="font-medium">Score recalculated.</span> No supplier-initiated changes this round. <ScoreDeltaText delta={delta} />
          </>
        )
      ) : (
        <>
          {worsened > 0 && (
            <>
              <NarrativeCount count={worsened} /> <span className="font-medium">worsened</span>
            </>
          )}
          {unexpected > 0 && (
            <>
              {worsened > 0 && <>, </>}
              <NarrativeCount count={unexpected} /> <span className="font-medium">unexpected</span>
            </>
          )}
          {manualReview > 0 && (
            <>
              {(worsened > 0 || unexpected > 0) && <>, </>}
              <NarrativeCount count={manualReview} /> need <span className="font-medium">manual review</span>
            </>
          )}
          . {delta === 0 ? "Score unchanged." : <ScoreDeltaText delta={delta} />}
        </>
      )}
    </p>
  );
}

function NarrativeCount({ count }: { count: number }) {
  return <span className="font-medium tabular-nums">{count}</span>;
}

function ScoreDeltaText({ delta }: { delta: number }) {
  if (delta === 0) return null;
  const positive = delta > 0;
  return (
    <>
      Net change:{" "}
      <span className={`font-medium tabular-nums ${positive ? "text-[#27500A]" : "text-[#791F1F]"}`}>
        {positive ? `+${delta}` : `-${Math.abs(delta)}`} points
      </span>
      .
    </>
  );
}

function TopMoversList({
  movers,
  onMoverSelect,
}: {
  movers: ComparisonMover[];
  onMoverSelect: (id: string) => void;
}) {
  const visibleMovers = visibleTopMovers(movers);

  return (
    <div className="flex flex-col gap-1">
      {visibleMovers.map((mover) => {
        const worsened = mover.direction === "worsened";
        const unexpected = mover.direction === "unexpected";
        const manualReview = mover.direction === "manual_review";
        const tone = worsened
          ? "bg-[rgba(252,235,235,0.4)] hover:bg-[rgba(252,235,235,0.65)]"
          : "bg-white hover:bg-[#E6F1FB]/30";
        const badgeClass = worsened
          ? "bg-[#A32D2D]"
          : unexpected
            ? "bg-[#185FA5]"
            : "bg-[#5F5E5A]";
        const Icon = worsened
          ? IconTrendingDown
          : unexpected
            ? IconAlertTriangle
            : IconCircleDashed;
        const transitionLabel =
          unexpected || manualReview ? (
            <span>{unexpected ? "Unexpected" : "Manual review"}</span>
          ) : (
            <>
              <strong className="font-medium text-foreground">{formatMoverSeverity(mover.previousSeverity)}</strong>
              <span aria-hidden> → </span>
              <strong className="font-medium text-foreground">{formatMoverSeverity(mover.currentSeverity)}</strong>
            </>
          );
        const accessibleTransition =
          unexpected
            ? "unexpected clause change"
            : manualReview
              ? "needs manual review"
              : `moved from ${formatMoverSeverity(mover.previousSeverity)} to ${formatMoverSeverity(mover.currentSeverity)}`;

        return (
          <button
            key={mover.id}
            type="button"
            onClick={() => onMoverSelect(mover.id)}
            aria-label={`${mover.name}, ${accessibleTransition}`}
            className={`grid w-full grid-cols-[16px_24px_minmax(0,1fr)_auto_12px] items-center gap-2 rounded-[5px] border border-border px-2.5 py-1.5 text-left transition-colors hover:border-[#185FA5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${tone}`}
          >
            <span className={`grid h-4 w-4 place-items-center rounded-full text-white ${badgeClass}`} aria-hidden="true">
              <Icon size={10} stroke={2} />
            </span>
            <span className="font-mono text-[9px] text-muted-foreground">{mover.id.toUpperCase()}</span>
            <span className="min-w-0 truncate text-[11px] font-medium text-foreground">{mover.name}</span>
            <span className="shrink-0 text-[9px] text-muted-foreground">{transitionLabel}</span>
            <span className="text-xs text-muted-foreground" aria-hidden>›</span>
          </button>
        );
      })}
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

  const statusOrder: PanelChangeStatus[] = [
    "met",
    "partially_met",
    "not_met",
    "worsened",
    "unexpected",
    "manual_review",
  ];

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
              (status === "worsened" || status === "unexpected" || status === "manual_review") && index === 0 ? "border-t border-border" : ""
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

function CategorySidebar({
  categories,
  total,
  activeCategory,
  sort,
  onSortChange,
  onSelectCategory,
}: {
  categories: CategorySidebarItem[];
  total: number;
  activeCategory: string | null;
  sort: CategorySortKey;
  onSortChange: (sort: CategorySortKey) => void;
  onSelectCategory: (category: string | null) => void;
}) {
  const rowRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const sortedCategories = useMemo(() => sortCategorySidebarItems(categories, sort), [categories, sort]);

  const handleRowKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const direction = event.key === "ArrowDown" ? 1 : -1;
    const nextIndex = Math.max(0, Math.min(rowRefs.current.length - 1, index + direction));
    rowRefs.current[nextIndex]?.focus();
  };

  return (
    <aside
      className="sticky top-[178px] max-h-[calc(100vh-190px)] w-60 shrink-0 self-start overflow-y-auto rounded-lg border border-border bg-card p-2"
    >
      <p
        tabIndex={0}
        className="mb-1.5 rounded-md px-2 py-1 text-[9px] font-medium uppercase tracking-[0.04em] text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        Categories
      </p>

      <div
        role="radiogroup"
        aria-label="Sort categories"
        className="mb-2 flex items-center gap-2 rounded-md bg-muted/30 px-2 py-1.5"
      >
        <CategorySortChip active={sort === "risk"} onClick={() => onSortChange("risk")}>
          <IconFlame className={`h-2.5 w-2.5 ${sort === "risk" ? "text-[#BA7517]" : ""}`} stroke={1.8} />
          Risk
        </CategorySortChip>
        <CategorySortChip active={sort === "az"} onClick={() => onSortChange("az")}>
          A-Z
        </CategorySortChip>
        <CategorySortChip active={sort === "count"} onClick={() => onSortChange("count")}>
          #
        </CategorySortChip>
      </div>

      <div className="space-y-1">
        <button
          ref={(node) => {
            rowRefs.current[0] = node;
          }}
          type="button"
          role="button"
          aria-label={`Filter by all categories, ${total} clauses`}
          onClick={() => onSelectCategory(null)}
          onKeyDown={(event) => handleRowKeyDown(event, 0)}
          className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
            !activeCategory
              ? "bg-[#E6F1FB]/50 font-medium text-foreground"
              : "text-muted-foreground hover:bg-[#f8f7f5]"
          }`}
        >
          <span>All</span>
          <span
            className={`rounded-full px-1.5 py-px text-[9px] font-medium ${
              !activeCategory ? "bg-card text-muted-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {total}
          </span>
        </button>

        {sortedCategories.map((category, index) => {
          const active = activeCategory === category.name;
          const rowIndex = index + 1;
          return (
            <button
              key={category.name}
              ref={(node) => {
                rowRefs.current[rowIndex] = node;
              }}
              type="button"
              role="button"
              aria-label={`Filter by ${category.name}, ${category.count} clauses`}
              onClick={() => onSelectCategory(category.name)}
              onKeyDown={(event) => handleRowKeyDown(event, rowIndex)}
              className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                category.count === 0 ? "opacity-60" : ""
              } ${
                active
                  ? "bg-[#E6F1FB]/50 font-medium text-foreground"
                  : "text-muted-foreground hover:bg-[#f8f7f5]"
              }`}
            >
              <span className="min-w-0 flex-1 truncate">{category.name}</span>
              {category.count > 0 && <CategorySeverityBar severity={category.severity} />}
              <span
                className={`shrink-0 rounded-full px-1.5 py-px text-[9px] font-medium ${
                  active ? "bg-card text-muted-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {category.count}
              </span>
            </button>
          );
        })}
      </div>
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
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full px-[7px] py-0.5 text-[9px] leading-none transition-colors ${
        active
          ? "bg-[#E6F1FB]/60 text-[#185FA5] border-[#185FA5]"
          : "border-border bg-[#f8f7f5] text-muted-foreground hover:text-foreground"
      }`}
      style={{ borderWidth: "0.5px" }}
    >
      {children}
    </button>
  );
}

function CategorySeverityBar({ severity }: { severity: CategorySidebarItem["severity"] }) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const segments = [
    { key: "high", value: severity.high, color: "#A32D2D", label: "high severity" },
    { key: "medium", value: severity.medium, color: "#BA7517", label: "medium severity" },
    { key: "low", value: severity.low, color: "#B4B2A9", label: "low severity" },
    { key: "clean", value: severity.clean, color: "#3B6D11", label: "clean" },
  ].filter((segment) => segment.value > 0);
  const ariaLabel = `${severity.high} high, ${severity.medium} medium, ${severity.low} low, ${severity.clean} clean severity`;

  useEffect(() => {
    if (!activeSegment) return undefined;
    const dismiss = () => setActiveSegment(null);
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [activeSegment]);

  const showTooltip = (key: string) => hoveredSegment === key || activeSegment === key;
  const anySegmentActive = Boolean(hoveredSegment || activeSegment);

  return (
    <span
      className="flex h-2 w-10 shrink-0 cursor-pointer gap-px rounded-sm bg-card"
      role="img"
      aria-label={ariaLabel}
    >
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
          onClick={() => {
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

function requestLifecycleLabel(request?: ClauseRequest) {
  if (!request?.requestedChange) return undefined;
  return request.state === "submitted" && request.submittedAt
    ? `Submitted to supplier on ${formatShortDate(request.submittedAt)}`
    : request.state === "submitted"
      ? "Submitted to supplier"
      : "Pending in request basket";
}

function ClauseRequestForm({
  versionLabel,
  draft,
  request,
  inherited,
  submitLabel = "Add to requests",
  requestPlaceholder = "Describe the change you want from the supplier",
  onUpdate,
  onCancel,
  onSubmit,
}: {
  versionLabel: string;
  draft?: ClauseRequest;
  request?: ClauseRequest;
  inherited?: { request: ClauseRequest; version: string };
  submitLabel?: string;
  requestPlaceholder?: string;
  onUpdate: (patch: { requestedChange?: string; rationale?: string }) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const requestValue = draft?.requestedChange ?? request?.requestedChange ?? "";
  const rationaleValue = draft?.rationale ?? request?.rationale ?? "";

  return (
    <div className="mt-3 space-y-3 border-t border-border pt-3" onClick={(event) => event.stopPropagation()}>
      {inherited && !draft?.requestedChange && !draft?.rationale && (
        <div className="space-y-1 rounded-md border-l-2 border-primary bg-primary/5 px-3 py-2 text-xs">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
            Currently in effect · from {inherited.version}
          </p>
          {inherited.request.requestedChange && <p className="leading-snug text-foreground">{inherited.request.requestedChange}</p>}
          {inherited.request.rationale && <p className="italic leading-snug text-muted-foreground">{inherited.request.rationale}</p>}
          <p className="text-[11px] text-muted-foreground">
            Add a new note below to override this for {versionLabel} onwards.
          </p>
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold uppercase text-muted-foreground">
            Requested change ({versionLabel}) <span className="text-destructive">*</span>
          </label>
          <Textarea
            value={requestValue}
            onChange={(event) => onUpdate({ requestedChange: event.target.value })}
            placeholder={requestPlaceholder}
            className="min-h-[64px] text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-semibold uppercase text-muted-foreground">Rationale (optional)</label>
          <Textarea
            value={rationaleValue}
            onChange={(event) => onUpdate({ rationale: event.target.value })}
            placeholder="Why is this change required?"
            className="min-h-[64px] text-sm"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] text-muted-foreground">
          Request will stay editable in the basket until submitted to the supplier.
        </p>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-8 gap-1.5 bg-[#1a2744] text-xs text-white hover:bg-[#243454]"
            disabled={!requestValue.trim()}
            onClick={onSubmit}
          >
            <Sparkles className="h-3.5 w-3.5" /> {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ClauseDecisionCard({
  id,
  clause,
  description,
  actionability,
  decision,
  request,
  draft,
  inherited,
  isDrafting,
  highlighted,
  changePill,
  stateBadge,
  metaPrefix,
  primaryActionLabel = "Request Change",
  requestPlaceholder,
  versionLabel,
  extraContent,
  actions,
  pinned,
  onTogglePin,
  onRequest,
  onNoAction,
  onEditRequest,
  onChangeNoAction,
  onUpdateDraft,
  onCancelDraft,
  onSubmitDraft,
  onOpenDetail,
}: {
  id: string;
  clause: ClauseResult;
  description?: string;
  actionability?: string;
  decision?: RoundDecision;
  request?: ClauseRequest;
  draft?: ClauseRequest;
  inherited?: { request: ClauseRequest; version: string };
  isDrafting?: boolean;
  highlighted?: boolean;
  changePill?: ChangePillResult;
  stateBadge?: ReactNode;
  metaPrefix?: ReactNode;
  primaryActionLabel?: string;
  requestPlaceholder?: string;
  versionLabel: string;
  extraContent?: ReactNode;
  actions?: ReactNode;
  pinned?: boolean;
  onTogglePin?: () => void;
  onRequest?: () => void;
  onNoAction?: () => void;
  onEditRequest?: () => void;
  onChangeNoAction?: () => void;
  onUpdateDraft?: (patch: { requestedChange?: string; rationale?: string }) => void;
  onCancelDraft?: () => void;
  onSubmitDraft?: () => void;
  onOpenDetail: () => void;
}) {
  const settled = decision === "request-update" || decision === "no-action";
  const requestIsPrimary = clause.severity === "high";
  const noActionIsPrimary = clause.severity === "low";
  const showRequestActions = !settled && !actions;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpenDetail();
    }
  };

  return (
    <div
      id={`clause-row-${id}`}
      role="button"
      tabIndex={0}
      onClick={onOpenDetail}
      onKeyDown={handleKeyDown}
      className={cn(
        "group relative cursor-pointer rounded-lg border border-border bg-card px-3.5 py-3 transition-colors hover:border-primary/30 hover:bg-[#E6F1FB]/30",
        decision === "request-update" && "border-l-[3px] border-l-[#185FA5] pl-[11px]",
        highlighted && "ring-2 ring-primary/40 bg-primary/5",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="w-[22px] shrink-0 font-mono text-[9px] font-semibold text-muted-foreground">{id.toUpperCase()}</span>
        {onTogglePin && (
          <button
            type="button"
            aria-label={pinned ? "Unpin clause" : "Pin clause across version switches"}
            title={pinned ? "Unpin clause" : "Pin clause across version switches"}
            onClick={(event) => {
              event.stopPropagation();
              onTogglePin();
            }}
            className={cn("shrink-0 rounded p-0.5 text-muted-foreground/60 hover:bg-muted hover:text-foreground", pinned && "text-primary")}
          >
            <Pin className={cn("h-3.5 w-3.5", pinned && "fill-current")} />
          </button>
        )}
        <h3 className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">{clause.title}</h3>
        <span className="hidden shrink-0 text-[10px] text-muted-foreground md:inline">
          {metaPrefix}{clause.subclause} · {clause.category}
        </span>
        {changePill?.status && <ChangePillBadge result={changePill} />}
        <Badge variant="outline" className={`${severityTone(clause.severity)} rounded-full px-1.5 py-0.5 text-[9px] font-medium`}>
          {clause.severity}
        </Badge>
        {stateBadge}
        {settled && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <DecisionBadge decision={decision} />
                </span>
              </TooltipTrigger>
              {decision === "request-update" && requestLifecycleLabel(request) && (
                <TooltipContent className="text-xs">{requestLifecycleLabel(request)}</TooltipContent>
              )}
            </Tooltip>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                if (decision === "request-update") onEditRequest?.();
                else onChangeNoAction?.();
              }}
              className="shrink-0 text-[10px] font-medium text-primary hover:underline"
            >
              {decision === "request-update" ? "Edit" : "Change"}
            </button>
          </>
        )}
        {isDrafting && (
          <Badge variant="outline" className="bg-[#E6F1FB] text-[#0C447C] border-[#185FA5]/25 text-[10px]">
            Drafting request
          </Badge>
        )}
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-60" />
      </div>

      {description && (
        <p className="mt-1.5 pl-[30px] text-[11px] leading-5 text-muted-foreground">
          {description}
        </p>
      )}
      {actionability && (
        <p className="mt-1 pl-[30px] text-[11px] leading-5 text-muted-foreground">
          <Lightbulb className="mr-1 inline h-3 w-3 text-primary" />
          <span className="font-semibold text-foreground">Actionability:</span> {actionability}
        </p>
      )}
      {extraContent && <div className="mt-2 pl-[30px]">{extraContent}</div>}

      {showRequestActions && (
        <div className="mt-2 flex items-center gap-1.5 pl-[30px]" onClick={(event) => event.stopPropagation()}>
          <Button
            size="sm"
            variant={requestIsPrimary ? "default" : "outline"}
            className={cn("h-8 rounded-[5px] px-3 text-[11px] font-normal gap-1.5", requestIsPrimary && "bg-[#1a2744] text-white hover:bg-[#243454]")}
            onClick={onRequest}
          >
            <Sparkles className="h-3 w-3" /> {primaryActionLabel}
          </Button>
          <Button
            size="sm"
            variant={noActionIsPrimary ? "default" : "outline"}
            className={cn("h-8 rounded-[5px] px-3 text-[11px] font-normal gap-1.5", noActionIsPrimary && "bg-[#1a2744] text-white hover:bg-[#243454]")}
            onClick={onNoAction}
          >
            <CheckCircle2 className="h-3 w-3" /> No Action
          </Button>
        </div>
      )}

      {actions && <div className="mt-2 flex items-center gap-1.5 pl-[30px]" onClick={(event) => event.stopPropagation()}>{actions}</div>}

      {isDrafting && onUpdateDraft && onCancelDraft && onSubmitDraft && (
        <div className="pl-[30px]">
          <ClauseRequestForm
            versionLabel={versionLabel}
            draft={draft}
            request={request}
            inherited={inherited}
            requestPlaceholder={requestPlaceholder}
            onUpdate={onUpdateDraft}
            onCancel={onCancelDraft}
            onSubmit={onSubmitDraft}
          />
        </div>
      )}
    </div>
  );
}

interface BasketRequestItem {
  clauseId: string;
  clauseTitle: string;
  request: ClauseRequest;
}

function RequestsBasket({
  requests,
  supplierName,
  onEdit,
  onRemove,
  onSubmit,
}: {
  requests: BasketRequestItem[];
  supplierName: string;
  onEdit: (clauseId: string) => void;
  onRemove: (clauseId: string) => void;
  onSubmit: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [basketBounds, setBasketBounds] = useState<{ left: number; right: number } | null>(null);
  const count = requests.length;

  useEffect(() => {
    if (count === 0) setExpanded(false);
  }, [count]);

  useEffect(() => {
    if (count === 0) return;
    const measure = () => {
      const column = document.getElementById("comparison-work-column");
      if (!column) {
        setBasketBounds(null);
        return;
      }
      const rect = column.getBoundingClientRect();
      setBasketBounds({
        left: Math.max(14, rect.left),
        right: Math.max(14, window.innerWidth - rect.right),
      });
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [count]);

  return (
    <>
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 90, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-3.5 z-40"
            style={{
              left: basketBounds?.left ?? 14,
              right: basketBounds?.right ?? 14,
            }}
          >
            {expanded && (
              <div className="max-h-[240px] overflow-y-auto rounded-t-lg border border-b-0 border-border bg-card shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
                <div className="divide-y divide-border p-2">
                  {requests.map((item) => (
                    <div key={item.clauseId} className="flex items-center gap-2 rounded-[5px] px-2 py-1.5 text-[10px] hover:bg-muted">
                      <span className="w-[26px] shrink-0 font-mono text-[9px] text-muted-foreground">{item.clauseId.toUpperCase()}</span>
                      <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-foreground">{item.clauseTitle}</span>
                      <span className="hidden min-w-0 flex-[1.5] truncate italic text-muted-foreground sm:block">
                        {item.request.requestedChange}
                      </span>
                      <button
                        type="button"
                        className="shrink-0 text-[10px] font-medium text-primary hover:underline"
                        onClick={() => onEdit(item.clauseId)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="shrink-0 rounded px-1 text-[11px] text-muted-foreground hover:bg-background hover:text-foreground"
                        aria-label={`Remove request for ${item.clauseTitle}`}
                        onClick={() => {
                          if (window.confirm(`Remove request for ${item.clauseTitle}?`)) onRemove(item.clauseId);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-3.5 py-2.5">
                  <p className="text-[10px] text-muted-foreground">
                    {count} request{count === 1 ? "" : "s"} will be sent to the supplier in the next round
                  </p>
                  <Button
                    size="sm"
                    className="h-8 gap-1.5 rounded-[5px] bg-[#1a2744] px-3 text-[11px] font-medium text-white hover:bg-[#243454]"
                    onClick={() => setConfirmOpen(true)}
                  >
                    <Send className="h-3 w-3" /> Submit
                  </Button>
                </div>
              </div>
            )}
            <div className={cn(
              "flex h-[46px] items-center gap-2.5 border border-border bg-card px-3.5 py-2 shadow-[0_4px_12px_rgba(0,0,0,0.06)]",
              expanded ? "rounded-b-lg" : "rounded-lg",
            )}>
              <span className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full bg-[#1a2744] text-white">
                <ShoppingBag className="h-3.5 w-3.5" />
              </span>
              <p className="flex-1 text-[11px] font-medium text-foreground">
                {expanded ? "Requests to submit" : `${count} request${count === 1 ? "" : "s"}`}
              </p>
              {expanded && (
                <Badge variant="outline" className="h-5 rounded-full px-2 text-[10px]">
                  {count}
                </Badge>
              )}
              <button
                type="button"
                className="text-[10px] text-muted-foreground hover:text-foreground"
                onClick={() => setExpanded((current) => !current)}
              >
                {expanded ? "Close" : "Review"}
              </button>
              <Button
                size="sm"
                className="h-8 gap-1.5 rounded-[5px] bg-[#1a2744] px-3 text-[11px] font-medium text-white hover:bg-[#243454]"
                onClick={() => setConfirmOpen(true)}
              >
                <Send className="h-3 w-3" /> Submit
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit {count} request{count === 1 ? "" : "s"} to supplier?</AlertDialogTitle>
            <AlertDialogDescription>
              These requests will be sent to {supplierName}. You won't be able to edit them once submitted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-48 overflow-y-auto rounded-md border border-border bg-muted/20 p-2">
            {requests.map((item) => (
              <p key={item.clauseId} className="truncate py-1 text-xs text-foreground">
                {item.clauseId.toUpperCase()} · {item.clauseTitle}
              </p>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#1a2744] text-white hover:bg-[#243454]"
              onClick={() => {
                onSubmit();
                setConfirmOpen(false);
              }}
            >
              Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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
        const draftHasText = Boolean(draft?.requestedChange?.trim() || draft?.rationale?.trim());
        const cancelDraft = () => {
          if (draftHasText && !window.confirm("Discard this draft request?")) return;
          onCancelDraft(c.id);
        };

        return (
          <ClauseDecisionCard
            key={c.id}
            id={c.id}
            clause={c}
            versionLabel={versionLabel}
            description={c.deviation}
            actionability={c.actionability}
            decision={decision}
            request={own}
            draft={draft}
            inherited={inheritedFromOlder}
            isDrafting={isDrafting}
            highlighted={highlightedId === c.id}
            onRequest={() => onStartDraft(c.id, own)}
            onNoAction={() => onSetNoAction(c.id)}
            onEditRequest={() => onStartDraft(c.id, own)}
            onChangeNoAction={() => onStartDraft(c.id)}
            onUpdateDraft={(patch) => onUpdateDraft(c.id, patch)}
            onCancelDraft={cancelDraft}
            onSubmitDraft={() => onSubmitDraft(c.id)}
            onOpenDetail={() => onOpenDetail(c.id)}
          />
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
  title, description, accent, rows, leftLabel, rightLabel, visible, bucket, stats,
  closureOf, requestOf, onClose, onKeepOpen, onFollowUp, onOpenDetail,
  pinnedIds, onTogglePin, recentlyClosed, onUndoClose, draftOf,
  onUpdateText, onCancelDraft, onSubmitDraft,
}: {
  title: string;
  description: string;
  accent: "primary" | "warning" | "destructive" | "success";
  rows: ComparisonRow[];
  leftLabel: string;
  rightLabel: string;
  visible: boolean;
  bucket: "open" | "new" | "closed";
  stats: ComparisonBucketStats;
  closureOf: (id: string) => ClosureDecision | undefined;
  requestOf: (id: string) => { requestedChange?: string; rationale?: string; fromVersion?: string };
  draftOf?: (id: string) => { requestedChange?: string; rationale?: string };
  onClose: (id: string) => void;
  onKeepOpen: (id: string) => void;
  onFollowUp?: (id: string) => void;
  onOpenDetail: (id: string) => void;
  pinnedIds?: Set<string>;
  onTogglePin?: (id: string) => void;
  recentlyClosed?: Record<string, number>;
  onUndoClose?: (id: string) => void;
  onUpdateText?: (id: string, patch: { requestedChange?: string; rationale?: string }) => void;
  onCancelDraft?: (id: string) => void;
  onSubmitDraft?: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
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
  const visibleStats = summariseComparisonRows(rows);
  const bucketSummary = [
    stats.pendingReview > 0 ? `${stats.pendingReview} need review` : null,
    stats.actioned > 0 ? `${stats.actioned} actioned` : null,
    rows.length !== stats.total ? `${visibleStats.visible} shown` : null,
  ].filter(Boolean).join(" · ");
  const sortedRows = [...rows].sort((a, b) => {
    if (bucket === "new") {
      const statusDelta =
        sortChangePillStatus(a.pill.status) -
        sortChangePillStatus(b.pill.status);
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
                {title} · <span className="font-mono text-foreground">{stats.total}</span>
              </h3>
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
          <div className="border-t border-border p-6 text-center text-xs text-muted-foreground">{emptyMsg}</div>
        ) : (
          <div className="space-y-2 border-t border-border p-3">
            {sortedRows.map((r) => {
              const display = r.curr ?? r.prev!;
              const req = requestOf(r.id);
              const closure = closureOf(r.id);
              const isPinned = pinnedIds?.has(r.id) ?? false;
              const undoExpiresAt = recentlyClosed?.[r.id];
              const showRowUndo = !!undoExpiresAt && undoExpiresAt > Date.now();
              const requested = bucket === "new" && (r.actionState === "requested" || r.actionState === "submitted_request");
              const noAction = bucket === "new" && r.actionState === "no_action";
              const drafting = bucket === "new" && (r.actionState === "drafting" || expandedRequestId === r.id);
              const draft = draftOf?.(r.id) ?? {};
              const cancelDraft = () => {
                if ((draft.requestedChange?.trim() || draft.rationale?.trim()) && !window.confirm("Discard this draft request?")) return;
                onCancelDraft?.(r.id);
                setExpandedRequestId(null);
              };
              const comparisonDetails = (
                <div className="grid gap-2 text-[11px] md:grid-cols-2">
                  {bucket !== "new" && (
                    <div className="rounded-md border-l-2 border-primary bg-primary/5 px-2.5 py-2 md:col-span-2">
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-primary">
                        Requested{req.fromVersion ? ` · from ${req.fromVersion}` : ""}
                      </p>
                      <p className="mt-1 leading-snug text-foreground">{req.requestedChange ?? "No request captured"}</p>
                      {req.rationale && <p className="mt-1 italic leading-snug text-muted-foreground">{req.rationale}</p>}
                    </div>
                  )}
                  <div className={cn("rounded-md bg-[#f8f7f5] px-2.5 py-2", bucket === "new" && "md:col-span-1")}>
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{leftLabel}</p>
                    <p className="mt-1 leading-snug text-muted-foreground">{r.prev?.deviation ?? "Clause did not exist."}</p>
                  </div>
                  <div className="rounded-md bg-[#E6F1FB]/45 px-2.5 py-2">
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-[#185FA5]">{rightLabel}</p>
                    <p className="mt-1 leading-snug text-foreground">{r.curr?.deviation ?? "Clause no longer present."}</p>
                  </div>
                </div>
              );
              const rowActions =
                bucket === "new" ? undefined :
                  bucket === "closed" ? (
                    <Button size="sm" variant="outline" className="h-8 text-[11px]" onClick={() => onKeepOpen(r.id)}>
                      Reopen
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant={closure === "closed" ? "default" : "outline"}
                        className="h-8 text-[11px]"
                        onClick={() => onClose(r.id)}
                      >
                        {classifyChange(r.prev, r.curr) === "material" ? "Close" : "Close anyway"}
                      </Button>
                      <Button
                        size="sm"
                        variant={closure === "follow-up" ? "secondary" : "outline"}
                        className="h-8 text-[11px]"
                        onClick={() => onFollowUp?.(r.id)}
                      >
                        Follow-up
                      </Button>
                      <Button
                        size="sm"
                        variant={closure === "keep-open" ? "secondary" : "outline"}
                        className="h-8 text-[11px]"
                        onClick={() => onKeepOpen(r.id)}
                      >
                        Keep Open
                      </Button>
                    </>
                  );

              return (
                <ClauseDecisionCard
                  key={r.id}
                  id={r.id}
                  clause={display}
                  versionLabel={rightLabel}
                  description={display.deviation}
                  decision={bucket === "new" ? (requested ? "request-update" : noAction ? "no-action" : undefined) : undefined}
                  request={req}
                  draft={draft}
                  isDrafting={drafting}
                  changePill={r.pill}
                  metaPrefix={r.pill.status === "unexpected" ? <span className="mr-1 text-[#0C447C]">+</span> : null}
                  extraContent={
                    <>
                      {comparisonDetails}
                      {showRowUndo && onUndoClose && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onUndoClose(r.id);
                          }}
                          className="mt-2 inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                        >
                          <RotateCcw className="h-3 w-3" /> Undo close
                        </button>
                      )}
                    </>
                  }
                  actions={rowActions}
                  pinned={isPinned}
                  onTogglePin={onTogglePin ? () => onTogglePin(r.id) : undefined}
                  primaryActionLabel="Request Change"
                  requestPlaceholder="Describe the update you want from the supplier"
                  onRequest={() => {
                    onKeepOpen(r.id);
                    setExpandedRequestId(r.id);
                  }}
                  onNoAction={() => onClose(r.id)}
                  onEditRequest={() => {
                    onKeepOpen(r.id);
                    setExpandedRequestId(r.id);
                  }}
                  onChangeNoAction={() => {
                    onKeepOpen(r.id);
                    setExpandedRequestId(r.id);
                  }}
                  onUpdateDraft={onUpdateText ? (patch) => onUpdateText(r.id, patch) : undefined}
                  onCancelDraft={cancelDraft}
                  onSubmitDraft={onSubmitDraft ? () => {
                    onSubmitDraft(r.id);
                    setExpandedRequestId(null);
                  } : undefined}
                  onOpenDetail={() => onOpenDetail(r.id)}
                />
              );
            })}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

// ---- Unmarked clauses (collapsible) ----------------------------------------

function UnmarkedSection({
  rows, leftLabel, rightLabel, visible, defaultOpen,
  requestOf, draftOf, isRequested, decisionOf, isDrafting, onRequestChange, onSetNoAction, onUpdateText, onCancelDraft, onSubmitDraft, onOpenDetail,
}: {
  rows: { id: string; prev?: ClauseResult; curr?: ClauseResult }[];
  leftLabel: string;
  rightLabel: string;
  visible: boolean;
  defaultOpen: boolean;
  requestOf: (id: string) => { requestedChange?: string; rationale?: string };
  draftOf: (id: string) => { requestedChange?: string; rationale?: string };
  isRequested: (id: string) => boolean;
  decisionOf: (id: string) => RoundDecision | undefined;
  isDrafting: (id: string) => boolean;
  onRequestChange: (id: string) => void;
  onSetNoAction: (id: string) => void;
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
                <div className="space-y-2 p-3">
                  {filteredRows.map((r) => {
                    const display = r.curr ?? r.prev!;
                    const requested = isRequested(r.id);
                    const decision = decisionOf(r.id);
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
                      <ClauseDecisionCard
                        key={r.id}
                        id={r.id}
                        clause={display}
                        versionLabel={rightLabel}
                        description={display.deviation}
                        decision={requested ? "request-update" : decision === "no-action" ? "no-action" : undefined}
                        request={req}
                        draft={draft}
                        isDrafting={isExpanded}
                        extraContent={
                          <div className="grid gap-2 text-[11px] md:grid-cols-2">
                            <div className="rounded-md bg-[#f8f7f5] px-2.5 py-2">
                              <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{leftLabel}</p>
                              <p className="mt-1 leading-snug text-muted-foreground">{r.prev?.deviation ?? "Clause did not exist."}</p>
                            </div>
                            <div className="rounded-md bg-[#E6F1FB]/45 px-2.5 py-2">
                              <p className="text-[9px] font-semibold uppercase tracking-wide text-[#185FA5]">{rightLabel}</p>
                              <p className="mt-1 leading-snug text-foreground">{r.curr?.deviation ?? "Clause no longer present."}</p>
                            </div>
                          </div>
                        }
                        onRequest={() => {
                          onRequestChange(r.id);
                          setExpandedId(r.id);
                        }}
                        onNoAction={() => onSetNoAction(r.id)}
                        onEditRequest={() => {
                          onRequestChange(r.id);
                          setExpandedId(r.id);
                        }}
                        onChangeNoAction={() => {
                          onRequestChange(r.id);
                          setExpandedId(r.id);
                        }}
                        onUpdateDraft={(patch) => onUpdateText(r.id, patch)}
                        onCancelDraft={cancelDraft}
                        onSubmitDraft={() => {
                          onSubmitDraft(r.id);
                          setExpandedId(null);
                        }}
                        onOpenDetail={() => onOpenDetail(r.id)}
                      />
                    );
                  })}
                </div>
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
  const isNewClause = changePill.status === "unexpected";
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
              {(changePill.status === "met" ||
                changePill.status === "partially_met" ||
                changePill.status === "not_met") &&
                request?.requestedChange && (
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
  if (status === "worsened") {
    return {
      text: "Supplier weakened this clause without being asked. Recommended: request revert in the next round.",
      className: "border-[#A32D2D] bg-[#FCEBEB]/50 text-[#791F1F]",
    };
  }
  if (status === "partially_met") {
    return {
      text: "Supplier moved toward the ask but did not fully meet it. Decide whether to push for more or close as a follow-up.",
      className: "border-[#BA7517] bg-[#FAEEDA]/70 text-[#633806]",
    };
  }
  if (status === "unexpected") {
    return {
      text: `This clause did not exist in ${leftLabel} or was changed without being asked. Review carefully before accepting.`,
      className: "border-[#185FA5] bg-[#E6F1FB]/70 text-[#0C447C]",
    };
  }
  if (status === "manual_review") {
    return {
      text: "AI could not determine an outcome with confidence. Manual review required before accepting.",
      className: "border-[#5F5E5A] bg-[#F1EFE8]/70 text-[#3a3a37]",
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
  if (status === "worsened") return <Button size="sm" className={className} onClick={onMarkNewIssue}>Request revert</Button>;
  if (status === "unexpected") return <Button size="sm" className={className} onClick={onCloseClause}>Accept</Button>;
  if (status === "met") return <Button size="sm" className={className} onClick={onCloseClause}>Mark resolved</Button>;
  if (status === "partially_met") return <Button size="sm" className={className} onClick={onKeepOpen}>Push for more</Button>;
  if (status === "not_met") return <Button size="sm" className={className} onClick={onKeepOpen}>Re-request</Button>;
  if (status === "manual_review") return <Button size="sm" className={className} onClick={onMarkNewIssue}>Review &amp; request</Button>;
  return <Button size="sm" className={className} onClick={onMarkNewIssue}>Request change</Button>;
}

function detailCalloutForStatus(status: ChangePillStatus | null): {
  title: string;
  description: string;
  className: string;
} | null {
  if (status === "met") {
    return {
      title: "Supplier delivered the requested change.",
      description: "Mark resolved to close this out, or keep open if you spot a follow-up.",
      className: "border-[#3B6D11]/25 bg-[#EAF3DE] text-[#27500A]",
    };
  }
  if (status === "partially_met") {
    return {
      title: "Supplier moved part of the way but didn't fully meet the ask.",
      description: "Decide whether to push for more or close with a follow-up note.",
      className: "border-[#BA7517]/25 bg-[#FAEEDA] text-[#633806]",
    };
  }
  if (status === "not_met") {
    return {
      title: "Supplier did not deliver the requested change.",
      description: "Re-request in the next round or escalate.",
      className: "border-[#A32D2D]/25 bg-[#FCEBEB] text-[#791F1F]",
    };
  }
  if (status === "worsened") {
    return {
      title: "Supplier weakened this clause without being asked.",
      description: "Recommended: request revert in the next round.",
      className: "border-[#A32D2D]/25 bg-[#FCEBEB] text-[#791F1F]",
    };
  }
  if (status === "unexpected") {
    return {
      title: "Supplier introduced or changed this clause without being asked.",
      description: "Review carefully before accepting.",
      className: "border-[#185FA5]/25 bg-[#E6F1FB] text-[#0C447C]",
    };
  }
  if (status === "manual_review") {
    return {
      title: "Automated review couldn't classify this change.",
      description: "Read the clause text and assign an outcome manually.",
      className: "border-[#5F5E5A]/25 bg-[#F1EFE8] text-[#3a3a37]",
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
  const isNewClause = changePill.status === "unexpected";
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
              {changePill.status === "met" ? (
                <>
                  <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => onCloseClause(clauseId)}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark resolved
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => onKeepOpen(clauseId)}>
                    Keep open
                  </Button>
                </>
              ) : changePill.status === "partially_met" ? (
                <>
                  <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => onKeepOpen(clauseId)}>
                    <ArrowRight className="w-3.5 h-3.5" /> Push for more
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => onCloseClause(clauseId)}>
                    Close with follow-up
                  </Button>
                </>
              ) : changePill.status === "not_met" ? (
                <>
                  <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => onMarkNewIssue(clauseId)}>
                    <AlertTriangle className="w-3.5 h-3.5" /> Re-request
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => onKeepOpen(clauseId)}>
                    Keep open
                  </Button>
                </>
              ) : changePill.status === "worsened" ? (
                <>
                  <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => onMarkNewIssue(clauseId)}>
                    <AlertTriangle className="w-3.5 h-3.5" /> Request revert
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => onCloseClause(clauseId)}>
                    Accept change
                  </Button>
                </>
              ) : changePill.status === "unexpected" ? (
                <>
                  <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => onCloseClause(clauseId)}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => onMarkNewIssue(clauseId)}>
                    Request removal
                  </Button>
                </>
              ) : changePill.status === "manual_review" ? (
                <>
                  <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => onMarkNewIssue(clauseId)}>
                    <AlertTriangle className="w-3.5 h-3.5" /> Flag for review
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => onCloseClause(clauseId)}>
                    Accept anyway
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
    <div className="min-w-0 overflow-x-auto rounded-lg border border-border bg-card">
      <div
        className="min-w-[560px]"
        style={{ display: "grid", gridTemplateColumns: `24px minmax(160px,1.35fr) repeat(${versions.length}, minmax(62px,0.75fr)) minmax(76px,0.8fr) 28px` }}
      >
        <div className="border-b border-border bg-[#f8f7f5] px-3 py-2" />
        <div className="border-b border-border bg-[#f8f7f5] px-3 py-2 text-[9px] font-medium uppercase tracking-[0.04em] text-muted-foreground">Clause</div>
        {versions.map((version, index) => (
          <div key={version.version} className="border-b border-border bg-[#f8f7f5] px-2 py-2 text-center text-[9px] font-medium uppercase tracking-[0.04em] text-muted-foreground">
            R{index + 1} {version.version}
          </div>
        ))}
        <div className="border-b border-border bg-[#f8f7f5] px-2 py-2 text-center text-[9px] font-medium uppercase tracking-[0.04em] text-muted-foreground">Status</div>
        <div className="border-b border-border bg-[#f8f7f5] px-2 py-2" />

        {rows.map((row) => (
          <button
            id={`history-row-${row.id}`}
            key={row.id}
            type="button"
            onClick={() => onOpenDetail(row.id)}
            className={`group contents text-left ${highlightedId === row.id ? "[&>*]:bg-[#E6F1FB]" : ""}`}
          >
            <div className="border-b border-border px-3 py-2.5 transition-colors group-hover:bg-[#f8f7f5]">
              {row.stateChanges >= 3 && <span className="mt-2 block h-1.5 w-1.5 rounded-full bg-[#A32D2D]" title="Highly contentious" />}
            </div>
            <div className="min-w-0 border-b border-border px-3 py-2.5 transition-colors group-hover:bg-[#f8f7f5]">
              <p className="truncate text-[11px] font-medium text-foreground">{row.title}</p>
              <p className="truncate text-[9px] uppercase text-muted-foreground">{row.id.toUpperCase()} · {row.category}</p>
            </div>
            {row.cells.map((cell) => (
              <div key={`${row.id}-${cell.version}`} className="border-b border-border px-2 py-2.5 text-center transition-colors group-hover:bg-[#f8f7f5]">
                <RoundStatusPill status={cell.status}>{cell.label}</RoundStatusPill>
              </div>
            ))}
            <div className="border-b border-border px-2 py-2.5 text-center transition-colors group-hover:bg-[#f8f7f5]">
              {row.currentPill.status ? <ChangePillBadge result={row.currentPill} /> : <RoundStatusPill status={row.currentStatus}>{roundStatusLabel(row.currentStatus)}</RoundStatusPill>}
            </div>
            <div className="border-b border-border px-2 py-2.5 text-center text-sm text-muted-foreground transition-colors group-hover:bg-[#f8f7f5]">›</div>
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
  if (status === "met") return "border-[#3B6D11]/25 bg-[#EAF3DE] text-[#27500A]";
  if (status === "partially_met") return "border-[#BA7517]/25 bg-[#FAEEDA] text-[#633806]";
  if (status === "not_met") return "border-[#A32D2D]/25 bg-[#FCEBEB] text-[#791F1F]";
  if (status === "worsened") return "border-[#A32D2D]/25 bg-[#FCEBEB] text-[#791F1F]";
  if (status === "unexpected") return "border-[#185FA5]/25 bg-[#E6F1FB] text-[#0C447C]";
  if (status === "manual_review") return "border-[#5F5E5A]/25 bg-[#F1EFE8] text-[#3a3a37]";
  return "border-transparent bg-transparent text-muted-foreground";
}

function roundStatusLabel(status: RoundStatus) {
  if (status === "not_met") return "Not met";
  if (status === "partially_met") return "Partially Met";
  if (status === "manual_review") return "Manual Review";
  if (status === "requested") return "Req";
  if (status === "missing") return "—";
  return status.charAt(0).toUpperCase() + status.slice(1);
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
