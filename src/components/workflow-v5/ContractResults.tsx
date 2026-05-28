import { useState, useMemo, useEffect, useRef, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ChevronLeft, AlertTriangle, CheckCircle2, Search, MapPin, Lightbulb,
  GitCompare, History, X, ArrowRight, Sparkles, Upload, Trash2, FileText, Loader2,
  Download, Info, ShieldCheck, ExternalLink, Sigma, Pin, RotateCcw,
  Clock, ShieldX, Pencil,
} from "lucide-react";

import {
  Alert,
  Card,
  Chip,
  Dropzone,
  FileItem,
  QuickFilterGroup,
  QuickFilterItem,
  Searchbox,
  TabButton,
  Table as OrbitTable,
  Text,
} from "@orbit";
import { showV5OrbitToast as toast } from "@/components/clauseiq-v5/V5OrbitToast";
import { V5OrbitConfirmOverlay, V5OrbitOverlay } from "@/components/clauseiq-v5/V5OrbitOverlay";
import { Input } from "@/components/clauseiq-v5/orbit-ui/input";
import { Textarea } from "@/components/clauseiq-v5/orbit-ui/textarea";
import { Badge } from "@/components/clauseiq-v5/orbit-ui/badge";
import { Button } from "@/components/clauseiq-v5/orbit-ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/clauseiq-v5/orbit-ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/clauseiq-v5/orbit-ui/select";
import { ChevronDown } from "lucide-react";
import {
  IconCircleCheck,
  IconCircleX,
  IconArrowsDiff,
  IconArrowDown,
  IconArrowUp,
  IconEye,
  IconHelp,
  IconInfoCircle,
  IconList,
  IconPlus,
  IconTimeline,
  IconTrendingDown,
  IconTrendingUp,
} from "@tabler/icons-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/clauseiq-v5/orbit-ui/tooltip";
import {
  getInitiative, getSupplier, getContract,
  type ClauseResult, type ContractVersion,
} from "@/lib/workflow-data";
import { ACME_DEFAULT_FOCUS_IDS, ACME_DEFAULT_REQUEST_TEXTS, makeSyntheticVersion } from "@/lib/clauses-data";
import { SWITCHED_ON_FIRST_ANALYSIS_VERSION } from "@/lib/switched-on-analysis-data";
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
import { downloadCsv } from "@/lib/csv-export";
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
} from "@/lib/clauseiq-v4-comparison";
import {
  ComparisonDesignOptions,
  ComparisonSummaryRail,
  FirstAnalysisDesignOptions,
  type ComparisonDesignOption,
  type EvidenceMetricCounts,
  type EvidenceMetricKey,
  type FirstAnalysisMetricKey,
  type FirstAnalysisMetrics,
} from "./ComparisonDesignOptions";

interface Props {
  initiativeId: string;
  supplierId: string;
  contractId: string;
  onBack: () => void;
  backLabel?: string;
  compactHeader?: boolean;
  scoringOption?: ScoringOptionKey;
  onScoringOptionChange?: (value: ScoringOptionKey) => void;
}

type TabKey = "review" | ComparisonTab;
type FilterKey = "all" | "open" | "new-issues" | "closed" | "unmarked";
type QuickFilterKey = "high" | "medium" | "low" | "missing" | "need-action" | "changes" | "open-items" | "met" | "closed";
interface FirstAnalysisReviewProgress {
  total: number;
  usedRecommendations: number;
  noAction: number;
  unreviewed: number;
  submitted: number;
  readyForCsv: number;
  breakdown: Array<{
    label: string;
    reviewed: number;
    unreviewed: number;
    total: number;
  }>;
}
type CategorySortKey = "risk" | "az" | "count";
export type ScoringOptionKey = "issue-score" | "hybrid";
type ScoreBand = "A" | "B" | "C" | "D" | "F";

interface CategorySidebarItem {
  name: string;
  count: number;
  severity: Record<"high" | "medium" | "low" | "clean", number>;
}

type MoverSeverity = "high" | "medium" | "low" | "clean";
type ComparisonMoverDirection = "improved" | "regressed" | "new";

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

const firstAnalysisDeviationBadgeClass =
  "shrink-0 rounded-full border-[#F3B4B4] bg-[#FFF1F2] px-orbit-xs py-orbit-xxs text-[9px] font-medium text-[#A32D2D]";

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

function normalizeComparisonDesignOption(value: string | null | undefined): ComparisonDesignOption {
  return value === "row-scale" || value === "side-by-side" ? value : "side-by-side";
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

function categoriesFromParam(value: string | null, categories: CategorySidebarItem[]) {
  if (!value || value === "all") return [];
  const tokens = value
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => {
      try {
        return decodeURIComponent(token);
      } catch {
        return token;
      }
    });
  if (tokens.length === 0) return [];
  const tokenSet = new Set(tokens);
  return categories
    .filter((category) => tokenSet.has(category.name) || tokenSet.has(categorySlug(category.name)))
    .map((category) => category.name);
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
        row.pill.status === "improved" || row.pill.status === "regressed" || row.pill.status === "new"
          ? row.pill.status
          : null;
      if (!direction || !row.curr) return null;

      const previousSeverity = moverSeverityFromClause(row.prev);
      const currentSeverity = moverSeverityFromClause(row.curr) ?? "clean";
      const previousWeight = previousSeverity ? moverSeverityWeight[previousSeverity] : 0;
      const currentWeight = moverSeverityWeight[currentSeverity];
      const movementScore =
        direction === "new"
          ? currentWeight
          : (previousWeight - currentWeight) * (direction === "regressed" ? 2 : 1);

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
  const directionOrder: Record<ComparisonMoverDirection, number> = { regressed: 0, improved: 1, new: 2 };
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

function isMissingClause(clause: ClauseResult) {
  return Boolean(clause.missingClause || clause.change === "new");
}

function isPureMissingClause(clause: ClauseResult) {
  return Boolean(clause.missingClause && clause.sourceDeviationLevel === "None");
}

function countsTowardDeviationMetric(clause: ClauseResult) {
  return !isPureMissingClause(clause);
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
}: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initiative = getInitiative(initiativeId);
  const supplier = getSupplier(initiativeId, supplierId);
  const contract = getContract(initiativeId, supplierId, contractId);
  const decisions = useClauseDecisions({}, { storageKey: "ciq-v5-clause-decisions" });
  const firstAnalysisDemo = searchParams.get("scenario") === "first-analysis";
  const mode = normalizeMode(searchParams.get("mode"));
  const designOption = normalizeComparisonDesignOption(searchParams.get("design"));
  const decisionContractId = firstAnalysisDemo ? `${contractId}:first-analysis-demo` : contractId;
  const generatedCsvStoragePrefix = `ciq-v5-generated-csv:${supplierId}:${decisionContractId}:`;
  const firstAnalysisResetKeyRef = useRef<string | null>(null);

  // Local mutable copy of versions so the user can simulate uploading a new
  // round or deleting an existing one without touching shared seed data.
  const firstAnalysisSeedVersions = firstAnalysisDemo ? [SWITCHED_ON_FIRST_ANALYSIS_VERSION] : contract?.versions ?? [];
  const [availableVersions, setAvailableVersions] = useState<ContractVersion[]>(firstAnalysisSeedVersions);
  const versions = firstAnalysisDemo ? availableVersions.slice(0, 1) : availableVersions;
  const v1 = versions[0] ?? null;
  const latest = versions.at(-1) ?? null;

  useEffect(() => {
    setAvailableVersions(firstAnalysisDemo ? [SWITCHED_ON_FIRST_ANALYSIS_VERSION] : contract?.versions ?? []);
  }, [contract?.id, firstAnalysisDemo]);

  useEffect(() => {
    if (!firstAnalysisDemo) {
      firstAnalysisResetKeyRef.current = null;
      setBulkReviewSelection(null);
      setBulkAppliedRecommendationIds([]);
      setBulkAppliedRecommendationScopeLabel(null);
      return;
    }
    const resetKey = `${supplierId}:${decisionContractId}`;
    if (firstAnalysisResetKeyRef.current === resetKey) return;
    decisions.resetContract(supplierId, decisionContractId);
    setGeneratedCsvSignatures((current) => Object.fromEntries(
      Object.entries(current).filter(([key]) => !key.startsWith(generatedCsvStoragePrefix)),
    ));
    try {
      Object.keys(localStorage)
        .filter((key) => key.startsWith(generatedCsvStoragePrefix))
        .forEach((key) => localStorage.removeItem(key));
    } catch {
      // Local persistence is best-effort in the prototype.
    }
    setBulkReviewSelection(null);
    setBulkAppliedRecommendationIds([]);
    setBulkAppliedRecommendationScopeLabel(null);
    firstAnalysisResetKeyRef.current = resetKey;
  }, [decisionContractId, decisions, firstAnalysisDemo, generatedCsvStoragePrefix, supplierId]);

  // Seed plausible round-1 request decisions for the demo focus clauses.
  useEffect(() => {
    if (!contract || versions.length < 2) return;
    decisions.seedDefaults(supplierId, decisionContractId, ACME_DEFAULT_FOCUS_IDS, ACME_DEFAULT_REQUEST_TEXTS);
  }, [supplierId, decisionContractId, contract, versions.length, decisions]);

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

  useEffect(() => {
    if (versions.length < 2) return;
    if (searchParams.get("design") === designOption) return;
    const next = new URLSearchParams(searchParams);
    next.set("design", designOption);
    setSearchParams(next, { replace: true });
  }, [designOption, searchParams, setSearchParams, versions.length]);

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

  const tabStorageKey = `ciq-v5-tab:${supplierId}:${contractId}`;
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

  const historyStorageKey = `ciq-v5-history:${supplierId}:${contractId}`;
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
  const activeCategories = categoriesFromParam(
    searchParams.get("cat"),
    mode === "history" ? historyCategoryItems : comparisonCategoryItems,
  );
  const activeCategorySet = useMemo(() => new Set(activeCategories), [activeCategories]);
  const categoryTotal = (mode === "history" ? historyCategoryItems : comparisonCategoryItems).reduce(
    (sum, category) => sum + category.count,
    0,
  );
  const setActiveCategories = (categories: string[]) => {
    const params = new URLSearchParams(searchParams);
    if (categories.length > 0) params.set("cat", categories.map(categorySlug).join(","));
    else params.delete("cat");
    setSearchParams(params, { replace: false });
  };
  const toggleActiveCategory = (category: string | null) => {
    if (!category) {
      setActiveCategories([]);
      return;
    }
    const next = activeCategorySet.has(category)
      ? activeCategories.filter((active) => active !== category)
      : [...activeCategories, category];
    setActiveCategories(next);
  };
  const clearActiveCategory = (category: string) => {
    setActiveCategories(activeCategories.filter((active) => active !== category));
  };
  const clearActiveCategories = () => setActiveCategories([]);
  const setCategorySort = (nextSort: CategorySortKey) => {
    const params = new URLSearchParams(searchParams);
    params.set("catSort", nextSort);
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
  const [filter, setFilter] = useState<FilterKey>(() => (mode === "comparison" ? "open" : "all"));
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
  const [requestReviewOpen, setRequestReviewOpen] = useState(false);
  const [bulkReviewSelection, setBulkReviewSelection] = useState<{ version: string; clauseIds: string[] } | null>(null);
  const [bulkAppliedRecommendationIds, setBulkAppliedRecommendationIds] = useState<string[]>([]);
  const [bulkAppliedRecommendationScopeLabel, setBulkAppliedRecommendationScopeLabel] = useState<string | null>(null);
  const [generatedCsvSignatures, setGeneratedCsvSignatures] = useState<Record<string, string | null>>({});
  const [quickFilter, setQuickFilter] = useState<QuickFilterKey | null>(() =>
    mode === "comparison" && versions.length >= 2 ? "open-items" : null,
  );
  const [firstAnalysisMetricFilters, setFirstAnalysisMetricFilters] = useState<Set<FirstAnalysisMetricKey>>(() => new Set());
  useEffect(() => {
    if (mode !== "comparison" || versions.length >= 2) return;
    if (quickFilter === "open-items" || quickFilter === "met" || quickFilter === "closed" || quickFilter === "changes") {
      setQuickFilter(null);
    }
  }, [mode, quickFilter, versions.length]);

  const allDecisions = decisions.getAll(supplierId, decisionContractId);
  const stateOf = (id: string): ClauseDecisionState =>
    allDecisions[id] ?? { roundDecisions: {}, closures: {}, requests: {}, updatedAt: "" };
  const activeRequestVersion = mode === "comparison" ? (rightVersion ?? reviewVersion ?? latest ?? v1) : null;
  const pendingRequestItems = useMemo<BasketRequestItem[]>(() => {
    if (mode !== "comparison" || !activeRequestVersion) return [];
    return decisions.getPendingRequests(supplierId, decisionContractId, activeRequestVersion.version).map((item) => {
      return buildBasketRequestItem(item.clauseId, item.request, activeRequestVersion, leftVersion);
    });
  }, [activeRequestVersion, decisionContractId, decisions, leftVersion, mode, supplierId]);
  const currentRequestItems = useMemo<BasketRequestItem[]>(() => {
    if (mode !== "comparison" || !activeRequestVersion) return [];

    return Object.entries(allDecisions)
      .filter(([, state]) => state.roundDecisions[activeRequestVersion.version] === "request-update")
      .map(([clauseId, state]) => {
        const request = state.requests[activeRequestVersion.version];
        if (!request?.requestedChange?.trim()) return null;
        return buildBasketRequestItem(clauseId, request, activeRequestVersion, leftVersion);
      })
      .filter((item): item is BasketRequestItem => Boolean(item))
      .sort((a, b) => versionClauseIndex(activeRequestVersion, a.clauseId) - versionClauseIndex(activeRequestVersion, b.clauseId));
  }, [activeRequestVersion, allDecisions, leftVersion, mode]);
  const currentReviewSignature = useMemo(
    () => activeRequestVersion ? buildReviewDecisionSignature(activeRequestVersion, allDecisions) : "",
    [activeRequestVersion, allDecisions],
  );
  const generatedCsvStorageKey = activeRequestVersion
    ? `${generatedCsvStoragePrefix}${activeRequestVersion.version}`
    : null;
  useEffect(() => {
    if (!generatedCsvStorageKey || generatedCsvSignatures[generatedCsvStorageKey] !== undefined) return;
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(generatedCsvStorageKey);
    } catch {
      stored = null;
    }
    setGeneratedCsvSignatures((current) => (
      current[generatedCsvStorageKey] !== undefined ? current : { ...current, [generatedCsvStorageKey]: stored }
    ));
  }, [generatedCsvSignatures, generatedCsvStorageKey]);
  const lastGeneratedCsvSignature = generatedCsvStorageKey ? generatedCsvSignatures[generatedCsvStorageKey] : null;
  const hasGeneratedCsv = lastGeneratedCsvSignature !== undefined && lastGeneratedCsvSignature !== null;
  const csvNeedsUpdate = hasGeneratedCsv && lastGeneratedCsvSignature !== currentReviewSignature;
  const reviewGenerateRequestItems = csvNeedsUpdate ? currentRequestItems : pendingRequestItems;
  const reviewGenerateDisabled = !activeRequestVersion || (!csvNeedsUpdate && pendingRequestItems.length === 0);
  const generateRequestedChangesCsv = () => {
    if (!activeRequestVersion || reviewGenerateDisabled) return;
    const csv = exportRequestChangeCsv(
      {
        initiativeName: initiative.name,
        supplierName: supplier.name,
        contractName: contract.name,
        versionLabel: activeRequestVersion.version,
      },
      activeRequestVersion,
      reviewGenerateRequestItems,
    );
    downloadCsv(
      `${supplier.name}-${contract.name}-${activeRequestVersion.version}-requested-changes.csv`,
      csv,
    );
    decisions.submitPendingRequests(supplierId, decisionContractId, activeRequestVersion.version);
    if (generatedCsvStorageKey) {
      setGeneratedCsvSignatures((current) => ({ ...current, [generatedCsvStorageKey]: currentReviewSignature }));
      try {
        localStorage.setItem(generatedCsvStorageKey, currentReviewSignature);
      } catch {
        // Local persistence is best-effort in the prototype.
      }
    }
    setBulkAppliedRecommendationIds([]);
    setBulkAppliedRecommendationScopeLabel(null);
    setBulkReviewSelection(null);
    toast({
      title: "CSV generated",
      description: reviewGenerateRequestItems.length > 0
        ? `${reviewGenerateRequestItems.length} requested change${reviewGenerateRequestItems.length === 1 ? "" : "s"} exported for supplier negotiation.`
        : "No requested changes remain. The generated CSV reflects the latest review decisions.",
    });
  };
  const bulkReviewClauseIdSet = new Set(bulkReviewSelection?.clauseIds ?? []);
  const bulkReviewSummaryMode = Boolean(
    bulkReviewSelection &&
      activeRequestVersion &&
      bulkReviewSelection.version === activeRequestVersion.version &&
      reviewGenerateRequestItems.length > 0 &&
      reviewGenerateRequestItems.length === bulkReviewClauseIdSet.size &&
      reviewGenerateRequestItems.every((item) => bulkReviewClauseIdSet.has(item.clauseId)),
  );

  const onUploadVersion = (file: File | null, label: string) => {
    if (!file) return;
    const prevLabel = availableVersions.at(-1)?.version ?? null;
    const today = new Date().toISOString().slice(0, 10);
    const newVersion = makeSyntheticVersion(label, prevLabel, today);
    const next = [...availableVersions, newVersion];
    setAvailableVersions(next);
    setPair({ left: prevLabel ?? label, right: label });
    setUploadOpen(false);
    toast({
      title: `Version ${label} uploaded successfully`,
      description: "Changes updated.",
    });
  };

  const onDeleteVersion = (label: string) => {
    const next = availableVersions.filter((v) => v.version !== label);
    setAvailableVersions(next);
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
    () => deriveHistoryModel(versions, allDecisions, historyFilter, activeCategories, historySort),
    [activeCategories, allDecisions, historyFilter, historySort, versions],
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

  // R3 DI-18: undo helpers use the V5 Orbit toast plus per-row 30s undo affordance.
  const [recentlyClosed, setRecentlyClosed] = useState<Record<string, number>>({});
  const closeWithUndo = (id: string, label: string, prev: ClosureDecision | undefined) => {
    if (!rightVersion) return;
    decisions.setClosure(supplierId, decisionContractId, id, rightVersion.version, "closed");
    setRecentlyClosed((m) => ({ ...m, [id]: Date.now() + 30_000 }));
    toast({
      title: `Closed "${label}" for ${rightVersion.version}`,
      description: "You can undo for 30 seconds.",
      duration: 8000,
      action: {
        label: "Undo",
        onClick: () => {
          decisions.setClosure(supplierId, decisionContractId, id, rightVersion.version, prev ?? "keep-open");
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
    decisions.setClosure(supplierId, decisionContractId, id, rightVersion.version, "keep-open");
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
    activeCategorySet.size === 0 || activeCategorySet.has(clauseCategory(id));

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
    if (next === "open-items") {
      setTab("changes");
      setFilter(isClearing ? "all" : "open");
    }
    if (next === "met") {
      setTab("changes");
      setFilter(isClearing ? "all" : "open");
    }
    if (next === "closed") {
      setTab("changes");
      setFilter(isClearing ? "all" : "closed");
    }
  };
  const selectEvidenceMetric = (metric: EvidenceMetricKey) => {
    if (metric === "total") {
      setQuickFilter(null);
      setFilter("all");
      setTab("changes");
      clearActiveCategories();
      return;
    }
    toggleQuickFilter(metric);
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
  const filterRowsByQuickState = <T extends { id: string; prev?: ClauseResult; curr?: ClauseResult; pill?: ChangePillResult }>(rows: T[]) =>
    rows.filter((row) => {
      if (severityQuickFilter && !matchesQuickSeverity(row.curr ?? row.prev)) return false;
      if (quickFilter === "met" && row.pill?.status !== "met") return false;
      return true;
    });

  const openRows = filterRowsByQuickState(
    comparisonSections.open.filter((r) => matchesSearch(r.id) && matchesCategory(r.id)),
  );
  const newIssueRows = filterRowsByQuickState(
    comparisonSections.newIssues.filter((r) => matchesSearch(r.id) && matchesCategory(r.id)),
  );
  const closedRows = filterRowsByQuickState(
    comparisonSections.closed.filter((r) => matchesSearch(r.id) && matchesCategory(r.id)),
  );
  const unmarkedRows = filterRowsByQuickState(
    comparisonSections.unmarked.filter((r) => matchesSearch(r.id) && matchesCategory(r.id)),
  );
  const showOpenSection = (filter === "all" || filter === "open") && quickFilter !== "changes";
  const showNewIssueSection =
    (filter === "all" || filter === "new-issues") &&
    (quickFilter === null || quickFilter === "need-action" || quickFilter === "changes" || !!severityQuickFilter);
  const showClosedSection =
    (filter === "all" || filter === "closed") &&
    quickFilter !== "need-action" &&
    quickFilter !== "changes" &&
    quickFilter !== "open-items" &&
    quickFilter !== "met";
  const showUnmarkedSection =
    (filter === "all" || filter === "unmarked") &&
    quickFilter !== "need-action" &&
    quickFilter !== "changes" &&
    quickFilter !== "open-items" &&
    quickFilter !== "met";
  const compactBackLabel = backLabel ?? `Back to ${supplier.name}`;
  const dashboardSupplierName = searchParams.get("source") === "clauseiq" ? "Thomson Reuters" : supplier.name;
  const dashboardReferenceLine = `Supplier: ${dashboardSupplierName}`;
  const switchMode = (nextMode: ClauseIqMode) => {
    const params = new URLSearchParams(searchParams);
    params.set("mode", nextMode);
    if (nextMode === "comparison" && versions.length >= 2) {
      params.set("tab", normalizeComparisonTab(params.get("tab") ?? storedComparisonTab));
      params.set("design", normalizeComparisonDesignOption(params.get("design")));
    }
    if (nextMode === "history") {
      params.set("filter", historyFilter);
      params.set("sort", historySort);
      params.set("design", designOption);
    }
    setSearchParams(params, { replace: false });
  };
  const setDesignOption = (nextDesignOption: ComparisonDesignOption) => {
    const params = new URLSearchParams(searchParams);
    params.set("mode", "comparison");
    params.set("design", nextDesignOption);
    setSearchParams(params, { replace: false });
  };
  const toggleFirstAnalysisDemo = (enabled: boolean) => {
    const params = new URLSearchParams(searchParams);
    if (enabled) {
      params.set("scenario", "first-analysis");
      params.set("mode", "comparison");
      params.delete("from");
      params.delete("to");
      params.delete("filter");
      setFilter("all");
      setQuickFilter(null);
      setFirstAnalysisMetricFilters(new Set());
    } else {
      params.delete("scenario");
      if (availableVersions.length >= 2) {
        const normalized = normalizeVersionComparisonPair(availableVersions, null);
        params.set("mode", "comparison");
        params.set("from", normalized.from);
        params.set("to", normalized.to);
        params.set("filter", "all");
      }
      setFilter("all");
      setQuickFilter("open-items");
      setFirstAnalysisMetricFilters(new Set());
    }
    setSearchParams(params, { replace: false });
  };
  const hasVersionComparison = comparisonModel.hasComparison;
  const comparisonCategoryTotal = comparisonCategoryItems.reduce((sum, category) => sum + category.count, 0);
  const categoryPanel = (
    <CategorySidebar
      categories={comparisonCategoryItems}
      total={comparisonCategoryTotal}
      activeCategories={activeCategories}
      sort={categorySort}
      onSortChange={setCategorySort}
      onSelectCategory={toggleActiveCategory}
      variant="panel"
    />
  );
  const categoryRail = (
    <CategorySidebar
      categories={comparisonCategoryItems}
      total={comparisonCategoryTotal}
      activeCategories={activeCategories}
      sort={categorySort}
      onSortChange={setCategorySort}
      onSelectCategory={toggleActiveCategory}
      variant="panel"
    />
  );
  const categoryStrip = (
    <CategoryStrip
      categories={comparisonCategoryItems}
      total={comparisonCategoryTotal}
      activeCategories={activeCategories}
      onSelectCategory={toggleActiveCategory}
      categoryPanel={categoryPanel}
    />
  );
  const firstAnalysisVersion = latest ?? reviewVersion ?? v1;
  const firstAnalysisVersionLabel = firstAnalysisVersion?.version ?? "v1";
  const hasFirstAnalysisAction = (id: string) => {
    const state = stateOf(id);
    const decision = state.roundDecisions[firstAnalysisVersionLabel];
    const request = state.requests[firstAnalysisVersionLabel];
    return Boolean(
      decision === "no-action" ||
        decision === "request-update" ||
        request?.requestedChange?.trim(),
    );
  };
  const hasFirstAnalysisDraft = (id: string) => {
    const draft = stateOf(id).draftRequests?.[firstAnalysisVersionLabel];
    return Boolean(draft?.requestedChange?.trim() || draft?.rationale?.trim());
  };
  const firstAnalysisCategoryClauses = firstAnalysisVersion
    ? firstAnalysisVersion.clauses.filter((clause) =>
        activeCategorySet.size === 0 || activeCategorySet.has(clause.category),
      )
    : [];
  const isFirstAnalysisReviewClause = (clause: ClauseResult) => !clause.resolved;
  const firstAnalysisAllClauses = firstAnalysisVersion?.clauses ?? [];
  const explicitMissingClauses = firstAnalysisAllClauses.filter(isMissingClause);
  const fallbackMissingClauses = firstAnalysisAllClauses.filter((_, index) => (index + 1) % 5 === 0);
  const firstAnalysisMissingClauseIds = new Set(
    (explicitMissingClauses.length > 0 ? explicitMissingClauses : fallbackMissingClauses).map((clause) => clause.id),
  );
  const firstAnalysisSelectedSeverities = new Set(
    Array.from(firstAnalysisMetricFilters).filter((metric): metric is "high" | "medium" | "low" =>
      metric === "high" || metric === "medium" || metric === "low",
    ),
  );
  const firstAnalysisMissingSelected = firstAnalysisMetricFilters.has("missing");
  const firstAnalysisVisibleClauses = firstAnalysisCategoryClauses.filter((clause) => {
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (
        !clause.title.toLowerCase().includes(q) &&
        !clause.category.toLowerCase().includes(q) &&
        !clause.id.includes(q)
      ) {
        return false;
      }
    }
    if (firstAnalysisMissingSelected && !firstAnalysisMissingClauseIds.has(clause.id)) return false;
    if (!isFirstAnalysisReviewClause(clause)) return false;
    if (designOption !== "row-scale" && hasFirstAnalysisAction(clause.id)) return false;
    if (
      firstAnalysisSelectedSeverities.size > 0 &&
      (!countsTowardDeviationMetric(clause) || !firstAnalysisSelectedSeverities.has(clause.severity))
    ) return false;
    return true;
  });
  const firstAnalysisDistribution: DeviationDistribution = {
    high: firstAnalysisCategoryClauses.filter((clause) => clause.severity === "high" && !clause.resolved && countsTowardDeviationMetric(clause)).length,
    medium: firstAnalysisCategoryClauses.filter((clause) => clause.severity === "medium" && !clause.resolved && countsTowardDeviationMetric(clause)).length,
    low: firstAnalysisCategoryClauses.filter((clause) => clause.severity === "low" && !clause.resolved && countsTowardDeviationMetric(clause)).length,
    clean: firstAnalysisCategoryClauses.filter((clause) => clause.resolved).length,
  };
  const firstAnalysisMetrics: FirstAnalysisMetrics = {
    needReview: firstAnalysisCategoryClauses.filter(
      (clause) => isFirstAnalysisReviewClause(clause) && !hasFirstAnalysisAction(clause.id),
    ).length,
    requested: firstAnalysisCategoryClauses.filter((clause) => stateOf(clause.id).roundDecisions[firstAnalysisVersionLabel] === "request-update").length,
    high: firstAnalysisDistribution.high,
    medium: firstAnalysisDistribution.medium,
    low: firstAnalysisDistribution.low,
    missingClauses: firstAnalysisCategoryClauses.filter((clause) => firstAnalysisMissingClauseIds.has(clause.id)).length,
    score: firstAnalysisVersion?.overallScore ?? 0,
    distribution: firstAnalysisDistribution,
    versionLabel: firstAnalysisVersionLabel,
  };
  const firstAnalysisReviewProgress = useMemo<FirstAnalysisReviewProgress>(() => {
    const reviewClauses = firstAnalysisAllClauses.filter(isFirstAnalysisReviewClause);
    const clauseStatus = (clause: ClauseResult) => {
      const state = stateOf(clause.id);
      const decision = state.roundDecisions[firstAnalysisVersionLabel];
      const request = state.requests[firstAnalysisVersionLabel];
      const requestedChange = request?.requestedChange?.trim();
      const usedRecommendation = Boolean(
        requestedChange &&
          decision === "request-update" &&
          requestedChange === clause.actionability?.trim(),
      );
      return {
        reviewed: decision === "request-update" || decision === "no-action" || Boolean(requestedChange),
        usedRecommendation,
        noAction: decision === "no-action",
        submitted: request?.state === "submitted",
        readyForCsv: decision === "request-update" && Boolean(requestedChange) && request?.state !== "submitted",
      };
    };
    const reviewed = reviewClauses.filter((clause) => clauseStatus(clause).reviewed).length;
    const breakdown = [
      {
        label: "High",
        clauses: reviewClauses.filter((clause) => clause.severity === "high" && countsTowardDeviationMetric(clause)),
      },
      {
        label: "Medium",
        clauses: reviewClauses.filter((clause) => clause.severity === "medium" && countsTowardDeviationMetric(clause)),
      },
      {
        label: "Low",
        clauses: reviewClauses.filter((clause) => clause.severity === "low" && countsTowardDeviationMetric(clause)),
      },
      {
        label: "Missing",
        clauses: reviewClauses.filter((clause) => firstAnalysisMissingClauseIds.has(clause.id)),
      },
    ].map((item) => {
      const itemReviewed = item.clauses.filter((clause) => clauseStatus(clause).reviewed).length;
      return {
        label: item.label,
        reviewed: itemReviewed,
        unreviewed: Math.max(0, item.clauses.length - itemReviewed),
        total: item.clauses.length,
      };
    });

    return {
      total: reviewClauses.length,
      unreviewed: Math.max(0, reviewClauses.length - reviewed),
      usedRecommendations: reviewClauses.filter((clause) => clauseStatus(clause).usedRecommendation).length,
      noAction: reviewClauses.filter((clause) => clauseStatus(clause).noAction).length,
      submitted: reviewClauses.filter((clause) => clauseStatus(clause).submitted).length,
      readyForCsv: reviewClauses.filter((clause) => clauseStatus(clause).readyForCsv).length,
      breakdown,
    };
  }, [firstAnalysisAllClauses, firstAnalysisMissingClauseIds, firstAnalysisVersionLabel, stateOf]);
  const historyCategoryTotal = historyCategoryItems.reduce((sum, category) => sum + category.count, 0);
  const historyCategoryPanel = (
    <CategorySidebar
      categories={historyCategoryItems}
      total={historyCategoryTotal}
      activeCategories={activeCategories}
      sort={categorySort}
      onSortChange={setCategorySort}
      onSelectCategory={toggleActiveCategory}
      variant="panel"
    />
  );
  const historyCategoryRail = (
    <CategorySidebar
      categories={historyCategoryItems}
      total={historyCategoryTotal}
      activeCategories={activeCategories}
      sort={categorySort}
      onSortChange={setCategorySort}
      onSelectCategory={toggleActiveCategory}
    />
  );
  const historyCategoryStrip = (
    <CategoryStrip
      categories={historyCategoryItems}
      total={historyCategoryTotal}
      activeCategories={activeCategories}
      onSelectCategory={toggleActiveCategory}
      categoryPanel={historyCategoryPanel}
    />
  );
  const historyDesignContent = (
    <HistoryDesignContent
      option={designOption}
      versions={versions}
      model={historyModel}
      categoryRail={historyCategoryRail}
      categoryPanel={historyCategoryPanel}
      categoryStrip={historyCategoryStrip}
      summaryRail={
        leftVersion && rightVersion ? (
          <ComparisonSummaryRail
            panel={comparisonModel.panel}
            stripStats={stripStats}
            contractName={contract.name}
            supplierName={supplier.name}
            leftLabel={leftVersion.version}
            rightLabel={rightVersion.version}
            comparisonControl={<PairSelector versions={versions} pair={pair} onChange={setPair} compact />}
          />
        ) : null
      }
      onOpenDetail={setDetailClauseId}
      highlightedId={highlightClauseId}
    />
  );
  const categoryOpenRows = comparisonSections.open.filter((row) => matchesCategory(row.id));
  const categoryNewIssueRows = comparisonSections.newIssues.filter((row) => matchesCategory(row.id));
  const categoryClosedRows = comparisonSections.closed.filter((row) => matchesCategory(row.id));
  const categoryUnmarkedRows = comparisonSections.unmarked.filter((row) => matchesCategory(row.id));
  const categoryAllRows = [
    ...categoryOpenRows,
    ...categoryNewIssueRows,
    ...categoryClosedRows,
    ...categoryUnmarkedRows,
  ];
  const categoryOpenStats = summariseComparisonRows(categoryOpenRows);
  const categoryNewIssueStats = summariseComparisonRows(categoryNewIssueRows);
  const evidenceMetrics: EvidenceMetricCounts = {
    openItems: categoryOpenRows.length,
    met: categoryOpenRows.filter((row) => row.pill.status === "met").length,
    closed: categoryClosedRows.length,
    supplierChanges: categoryNewIssueRows.length,
    needReview: categoryOpenStats.pendingReview + categoryNewIssueStats.pendingReview,
    high: categoryAllRows.filter((row) => {
      const clause = row.curr ?? row.prev;
      return clause?.severity === "high" && !clause.resolved;
    }).length,
    medium: categoryAllRows.filter((row) => {
      const clause = row.curr ?? row.prev;
      return clause?.severity === "medium" && !clause.resolved;
    }).length,
    low: categoryAllRows.filter((row) => {
      const clause = row.curr ?? row.prev;
      return clause?.severity === "low" && !clause.resolved;
    }).length,
    totalClauses: stripStats.contract.total,
  };
  const designOpenRows = filterRowsByQuickState(
    categoryOpenRows,
  );
  const designNewIssueRows = filterRowsByQuickState(
    categoryNewIssueRows,
  );
  const designClosedRows = filterRowsByQuickState(
    categoryClosedRows,
  );
  const designUnmarkedRows = filterRowsByQuickState(
    categoryUnmarkedRows,
  );
  const activeEvidenceMetric: EvidenceMetricKey | null =
    quickFilter === "open-items" ||
    quickFilter === "met" ||
    quickFilter === "closed" ||
    quickFilter === "changes" ||
    quickFilter === "need-action" ||
    quickFilter === "high" ||
    quickFilter === "medium" ||
    quickFilter === "low"
      ? quickFilter
      : quickFilter === null
        ? "total"
        : null;
  const activeMetricLabel =
    activeEvidenceMetric && activeEvidenceMetric !== "total"
      ? ({
          "open-items": "Open items",
          met: "Met",
          closed: "Closed",
          changes: "Supplier changes",
          "need-action": "Need review",
          high: "High",
          medium: "Medium",
          low: "Low",
        } satisfies Record<Exclude<EvidenceMetricKey, "total">, string>)[activeEvidenceMetric]
      : null;
  const clearEvidenceMetric = () => {
    setQuickFilter(null);
    setFilter("all");
    setTab("changes");
  };
  const showDesignOpenSection =
    quickFilter === null ||
    quickFilter === "open-items" ||
    quickFilter === "met" ||
    quickFilter === "need-action" ||
    Boolean(severityQuickFilter);
  const showDesignNewIssueSection =
    quickFilter === null || quickFilter === "changes" || quickFilter === "need-action" || Boolean(severityQuickFilter);
  const showDesignClosedSection =
    quickFilter === null ||
    quickFilter === "closed" ||
    quickFilter === "open-items" ||
    quickFilter === "met" ||
    Boolean(severityQuickFilter);
  const showDesignUnmarkedSection = quickFilter === null || Boolean(severityQuickFilter);
  const firstAnalysisActiveMetrics = Array.from(firstAnalysisMetricFilters);
  const selectFirstAnalysisMetric = (metric: FirstAnalysisMetricKey) => {
    setFirstAnalysisMetricFilters((current) => {
      const next = new Set(current);
      if (next.has(metric)) next.delete(metric);
      else next.add(metric);
      return next;
    });
  };
  const firstAnalysisMetricLabels = firstAnalysisActiveMetrics.map((metric) => ({
    key: metric,
    label: ({
      high: "High Deviation",
      medium: "Medium Deviation",
      low: "Low Deviation",
      missing: "Missing Clauses",
    } satisfies Record<FirstAnalysisMetricKey, string>)[metric],
  }));
  const clearFirstAnalysisMetric = (metric: FirstAnalysisMetricKey) => {
    setFirstAnalysisMetricFilters((current) => {
      const next = new Set(current);
      next.delete(metric);
      return next;
    });
  };
  const clearAllFirstAnalysisMetrics = () => setFirstAnalysisMetricFilters(new Set());
  const firstAnalysisRecommendationTargets = firstAnalysisVersion
    ? firstAnalysisVersion.clauses
        .filter((clause) =>
          isFirstAnalysisReviewClause(clause) &&
          Boolean(clause.actionability?.trim()) &&
          !hasFirstAnalysisAction(clause.id) &&
          !hasFirstAnalysisDraft(clause.id),
        )
        .map((clause) => ({
          id: clause.id,
          clauseTitle: clause.title,
          category: clause.category,
          severity: clause.severity,
          missingClause: clause.missingClause,
          sourceDeviationLevel: clause.sourceDeviationLevel,
          request: { requestedChange: clause.actionability?.trim() },
        }))
    : [];
  const firstAnalysisRecommendationClauses = firstAnalysisVersion
    ? firstAnalysisVersion.clauses.filter(
        (clause) => isFirstAnalysisReviewClause(clause) && Boolean(clause.actionability?.trim()),
      )
    : [];
  const firstAnalysisPendingRecommendationCount = firstAnalysisRecommendationClauses.filter((clause) => {
    const state = stateOf(clause.id);
    const request = state.requests[firstAnalysisVersionLabel];
    return state.roundDecisions[firstAnalysisVersionLabel] === "request-update" && request?.state !== "submitted";
  }).length;
  const firstAnalysisRecommendationsQueued =
    firstAnalysisRecommendationClauses.length > 0 &&
    firstAnalysisRecommendationTargets.length === 0 &&
    firstAnalysisPendingRecommendationCount > 0;
  const firstAnalysisRecommendationsReviewed =
    firstAnalysisRecommendationClauses.length > 0 &&
    firstAnalysisRecommendationTargets.length === 0 &&
    firstAnalysisPendingRecommendationCount === 0;
  const bulkAppliedRecommendationIdSet = new Set(bulkAppliedRecommendationIds);
  const firstAnalysisUndoableRecommendationIds = firstAnalysisRecommendationClauses
    .filter((clause) => bulkAppliedRecommendationIdSet.has(clause.id))
    .filter((clause) => {
      const state = stateOf(clause.id);
      const request = state.requests[firstAnalysisVersionLabel];
      return (
        state.roundDecisions[firstAnalysisVersionLabel] === "request-update" &&
        request?.state !== "submitted"
      );
    })
    .map((clause) => clause.id);
  const firstAnalysisUndoRecommendationCount = firstAnalysisUndoableRecommendationIds.length;
  const canUndoFirstAnalysisRecommendations = firstAnalysisUndoRecommendationCount > 0;
  const firstAnalysisApplyAllLabel =
    canUndoFirstAnalysisRecommendations
      ? `Undo recommendations (${firstAnalysisUndoRecommendationCount})`
      : firstAnalysisRecommendationTargets.length > 0
      ? `Apply all recommendations (${firstAnalysisRecommendationTargets.length})`
      : firstAnalysisRecommendationsQueued
      ? "Recommendations added to review"
      : "All recommendations reviewed";
  const firstAnalysisRecommendationApplyOptions = buildRecommendationApplyOptions(firstAnalysisRecommendationTargets);
  const firstAnalysisAvailableRecommendationApplyOptions = firstAnalysisRecommendationApplyOptions.filter((option) => option.count > 0);
  const applyAllRecommendations = (targets: RecommendationTargetItem[], scope?: RecommendationApplyOption) => {
    if (!firstAnalysisVersion || targets.length === 0) return;
    const bulkClauseIds = new Set(pendingRequestItems.map((item) => item.clauseId));
    targets.forEach((item) => bulkClauseIds.add(item.id));
    decisions.acceptPendingRequests(
      supplierId,
      decisionContractId,
      firstAnalysisVersion.version,
      targets.map((item) => ({ clauseId: item.id, request: item.request })),
    );
    setBulkReviewSelection({ version: firstAnalysisVersion.version, clauseIds: Array.from(bulkClauseIds) });
    setBulkAppliedRecommendationIds(targets.map((item) => item.id));
    setBulkAppliedRecommendationScopeLabel(scope?.undoLabel ?? null);
    toast({
      title: "Recommendations added to review",
      description: `${targets.length} ${scope?.toastLabel ?? "recommendation"}${targets.length === 1 ? "" : "s"} added. Review and generate the CSV when ready.`,
    });
  };
  const undoAppliedRecommendations = () => {
    if (!firstAnalysisVersion || firstAnalysisUndoableRecommendationIds.length === 0) return;
    firstAnalysisUndoableRecommendationIds.forEach((id) => {
      decisions.removePendingRequest(supplierId, decisionContractId, id, firstAnalysisVersion.version);
    });
    setBulkAppliedRecommendationIds([]);
    setBulkAppliedRecommendationScopeLabel(null);
    setBulkReviewSelection(null);
    toast({
      title: "Recommendations removed from review",
      description: `${firstAnalysisUndoableRecommendationIds.length} recommendation${firstAnalysisUndoableRecommendationIds.length === 1 ? "" : "s"} removed. Existing custom requests and No Action choices were left unchanged.`,
    });
  };
  const firstAnalysisReviewList = firstAnalysisVersion ? (
    <ReviewScreen
      version={firstAnalysisVersion}
      stateOf={stateOf}
      activeCategories={activeCategories}
      search={search}
      quickSeverityFilters={firstAnalysisSelectedSeverities}
      quickReviewFilter="need-review"
      missingClauseIds={firstAnalysisMissingClauseIds}
      quickMissingClauseIds={firstAnalysisMissingSelected ? firstAnalysisMissingClauseIds : null}
      neutralActions
      hideSubclauseReference
      displayMode={designOption === "row-scale" ? "row-scale" : "default"}
      onSetNoAction={(id) =>
        decisions.changeDecision(supplierId, decisionContractId, id, firstAnalysisVersion.version, "no-action")
      }
      onStartDraft={(id, initialDraft) =>
        decisions.startDraftRequest(supplierId, decisionContractId, id, firstAnalysisVersion.version, initialDraft)
      }
      onUseRecommendation={(id, request) =>
        decisions.acceptRequest(supplierId, decisionContractId, id, firstAnalysisVersion.version, request)
      }
      onUndoDecision={(id) =>
        decisions.clearRoundDecision(supplierId, decisionContractId, id, firstAnalysisVersion.version)
      }
      onUpdateDraft={(id, patch) =>
        decisions.updateDraftRequestText(supplierId, decisionContractId, id, firstAnalysisVersion.version, patch)
      }
      onCancelDraft={(id) =>
        decisions.cancelDraftRequest(supplierId, decisionContractId, id, firstAnalysisVersion.version)
      }
      onSubmitDraft={(id) =>
        decisions.submitDraftRequest(supplierId, decisionContractId, id, firstAnalysisVersion.version)
      }
      onOpenDetail={(id) => setDetailClauseId(id)}
      highlightedId={highlightClauseId}
    />
  ) : null;
  const firstAnalysisDesignContent = firstAnalysisVersion && mode === "comparison" && versions.length < 2 ? (
    <FirstAnalysisDesignOptions
      option={designOption}
      metrics={firstAnalysisMetrics}
      clausesToReview={firstAnalysisReviewList}
      visibleCount={firstAnalysisVisibleClauses.length}
      categoryRail={categoryRail}
      categoryPanel={categoryPanel}
      categoryStrip={categoryStrip}
      activeCategoryLabels={activeCategories}
      onClearCategory={clearActiveCategories}
      onClearCategoryFilter={clearActiveCategory}
      activeMetricLabels={firstAnalysisMetricLabels}
      onClearMetric={clearFirstAnalysisMetric}
      onClearAllMetrics={clearAllFirstAnalysisMetrics}
      activeMetrics={firstAnalysisActiveMetrics}
      onMetricSelect={selectFirstAnalysisMetric}
    />
  ) : null;
  const comparisonDesignContent = leftVersion && rightVersion && hasVersionComparison ? (
    <ComparisonDesignOptions
      option={designOption}
      comparisonControl={<PairSelector versions={versions} pair={pair} onChange={setPair} compact />}
      stripStats={stripStats}
      panel={comparisonModel.panel}
      contractName={contract.name}
      supplierName={supplier.name}
      leftLabel={leftVersion.version}
      rightLabel={rightVersion.version}
      categoryRail={categoryRail}
      categoryPanel={categoryPanel}
      categoryStrip={categoryStrip}
      activeCategoryLabels={activeCategories}
      onClearCategory={clearActiveCategories}
      onClearCategoryFilter={clearActiveCategory}
      activeMetricLabel={activeMetricLabel}
      onClearMetric={clearEvidenceMetric}
      activeEvidenceMetric={activeEvidenceMetric}
      onEvidenceMetricSelect={selectEvidenceMetric}
      evidenceMetrics={evidenceMetrics}
      openItems={
        <ComparisonSection
          title="Open Items"
          description="Clauses you previously asked the supplier to change."
          accent="primary"
          rows={designOpenRows}
          leftLabel={leftVersion.version}
          rightLabel={rightVersion.version}
          visible={showDesignOpenSection}
          bucket="open"
          stats={comparisonModel.bucketStats.open_items}
          closureOf={(id) => stateOf(id).closures[rightVersion.version]}
          requestOf={(id) => {
            const latest = getLatestRequest(stateOf(id), leftVersion.version);
            return latest ? { ...latest.request, fromVersion: latest.version } : {};
          }}
          basketRequestOf={(id) => stateOf(id).requests[rightVersion.version]}
          draftOf={(id) => stateOf(id).draftRequests?.[rightVersion.version] ?? {}}
          onClose={(id) => {
            const display = leftVersion.clauses.find((c) => c.id === id) ?? rightVersion.clauses.find((c) => c.id === id);
            const prev = stateOf(id).closures[rightVersion.version];
            closeWithUndo(id, display?.title ?? id.toUpperCase(), prev);
          }}
          onKeepOpen={(id) => decisions.setClosure(supplierId, decisionContractId, id, rightVersion.version, "keep-open")}
          onFollowUp={(id) =>
            decisions.startDraftRequest(supplierId, decisionContractId, id, rightVersion.version, {
              requestedChange: "",
              rationale: "",
            })
          }
          onUpdateText={(id, patch) => decisions.updateDraftRequestText(supplierId, decisionContractId, id, rightVersion.version, patch)}
          onCancelDraft={(id) => decisions.cancelDraftRequest(supplierId, decisionContractId, id, rightVersion.version)}
          onSubmitDraft={(id) => {
            decisions.submitDraftRequest(supplierId, decisionContractId, id, rightVersion.version);
            decisions.setClosure(supplierId, decisionContractId, id, rightVersion.version, "follow-up");
          }}
          onRemoveRequest={(id) => decisions.removePendingRequest(supplierId, decisionContractId, id, rightVersion.version)}
          onOpenDetail={setDetailClauseId}
          pinnedIds={pinnedClauseIds}
          onTogglePin={togglePin}
          recentlyClosed={recentlyClosed}
          onUndoClose={undoClose}
          layout="plain"
        />
      }
      newChanges={
        <ComparisonSection
          title="New Changes"
          description="Material changes the supplier made without being asked, plus clauses that didn't exist before."
          accent="destructive"
          rows={designNewIssueRows}
          leftLabel={leftVersion.version}
          rightLabel={rightVersion.version}
          visible={showDesignNewIssueSection}
          bucket="new"
          stats={comparisonModel.bucketStats.new_changes}
          closureOf={() => undefined}
          requestOf={(id) => stateOf(id).requests[rightVersion.version] ?? {}}
          basketRequestOf={(id) => stateOf(id).requests[rightVersion.version]}
          draftOf={(id) => stateOf(id).draftRequests?.[rightVersion.version] ?? {}}
          onClose={(id) => decisions.setRoundDecision(supplierId, decisionContractId, id, rightVersion.version, "no-action")}
          onKeepOpen={(id) => decisions.startDraftRequest(supplierId, decisionContractId, id, rightVersion.version)}
          onUpdateText={(id, patch) => decisions.updateDraftRequestText(supplierId, decisionContractId, id, rightVersion.version, patch)}
          onCancelDraft={(id) => decisions.cancelDraftRequest(supplierId, decisionContractId, id, rightVersion.version)}
          onSubmitDraft={(id) => decisions.submitDraftRequest(supplierId, decisionContractId, id, rightVersion.version)}
          onRemoveRequest={(id) => decisions.removePendingRequest(supplierId, decisionContractId, id, rightVersion.version)}
          onOpenDetail={setDetailClauseId}
          pinnedIds={pinnedClauseIds}
          onTogglePin={togglePin}
          layout="plain"
        />
      }
      closedItems={
        <ComparisonSection
          title="Closed"
          description="Clauses you marked as resolved for this round."
          accent="success"
          rows={designClosedRows}
          leftLabel={leftVersion.version}
          rightLabel={rightVersion.version}
          visible={showDesignClosedSection}
          bucket="closed"
          stats={comparisonModel.bucketStats.closed}
          closureOf={(id) => stateOf(id).closures[rightVersion.version]}
          requestOf={(id) => {
            const latest = getLatestRequest(stateOf(id), leftVersion.version);
            return latest ? { ...latest.request, fromVersion: latest.version } : {};
          }}
          onClose={(id) => decisions.setClosure(supplierId, decisionContractId, id, rightVersion.version, "closed")}
          onKeepOpen={(id) => decisions.setClosure(supplierId, decisionContractId, id, rightVersion.version, "keep-open")}
          onOpenDetail={setDetailClauseId}
          pinnedIds={pinnedClauseIds}
          onTogglePin={togglePin}
          layout="plain"
        />
      }
      unmarkedClauses={
        <UnmarkedSection
          rows={designUnmarkedRows}
          leftLabel={leftVersion.version}
          rightLabel={rightVersion.version}
          visible={showDesignUnmarkedSection}
          defaultOpen={false}
          requestOf={(id) => stateOf(id).requests[rightVersion.version] ?? {}}
          draftOf={(id) => stateOf(id).draftRequests?.[rightVersion.version] ?? {}}
          isRequested={(id) => stateOf(id).roundDecisions[rightVersion.version] === "request-update"}
          decisionOf={(id) => stateOf(id).roundDecisions[rightVersion.version]}
          isDrafting={(id) => Boolean(stateOf(id).draftRequests?.[rightVersion.version])}
          onRequestChange={(id) => decisions.startDraftRequest(supplierId, decisionContractId, id, rightVersion.version)}
          onSetNoAction={(id) => decisions.changeDecision(supplierId, decisionContractId, id, rightVersion.version, "no-action")}
          onUpdateText={(id, patch) => decisions.updateDraftRequestText(supplierId, decisionContractId, id, rightVersion.version, patch)}
          onCancelDraft={(id) => decisions.cancelDraftRequest(supplierId, decisionContractId, id, rightVersion.version)}
          onSubmitDraft={(id) => decisions.submitDraftRequest(supplierId, decisionContractId, id, rightVersion.version)}
          onRemoveRequest={(id) => decisions.removePendingRequest(supplierId, decisionContractId, id, rightVersion.version)}
          onOpenDetail={setDetailClauseId}
        />
      }
    />
  ) : null;

  return (
    <div className="min-h-screen bg-background">
      {compactHeader ? (
        <div className="sticky top-0 z-30 border-b border-[rgba(0,0,0,0.08)] bg-white">
          <CompactContractTopbar
            backLabel={compactBackLabel}
            onBack={onBack}
            referenceLine={dashboardReferenceLine}
            firstAnalysisDemo={firstAnalysisDemo}
            demoAvailable={availableVersions.length >= 2}
            onFirstAnalysisDemoChange={toggleFirstAnalysisDemo}
          />
          <ModeSwitcher
            mode={mode}
            onChange={switchMode}
            comparisonLabel="Review"
            historyDisabled={!firstAnalysisDemo && versions.length < 2}
            onApplyAllRecommendations={() => applyAllRecommendations(firstAnalysisRecommendationTargets)}
            onApplyRecommendationOption={(option) => applyAllRecommendations(option.targets, option)}
            onUndoAllRecommendations={undoAppliedRecommendations}
            applyAllRecommendationsDisabled={!firstAnalysisDemo || firstAnalysisRecommendationTargets.length === 0}
            applyAllRecommendationsQueued={firstAnalysisDemo && firstAnalysisRecommendationsQueued}
            applyAllRecommendationsReviewed={firstAnalysisDemo && firstAnalysisRecommendationsReviewed}
            applyAllRecommendationsUndoable={firstAnalysisDemo && canUndoFirstAnalysisRecommendations}
            recommendationApplyOptions={firstAnalysisRecommendationApplyOptions}
            recommendationCount={firstAnalysisRecommendationTargets.length}
            undoRecommendationCount={firstAnalysisUndoRecommendationCount}
            undoRecommendationScopeLabel={bulkAppliedRecommendationScopeLabel}
            onReviewGenerate={() => setRequestReviewOpen(true)}
            reviewGenerateDisabled={reviewGenerateDisabled}
            requestCount={reviewGenerateRequestItems.length}
          />
        </div>
      ) : (
        <>
          {/* Top header */}
          <div className="border-b border-border bg-card sticky top-0 z-30">
            <div className="max-w-[1400px] mx-auto px-orbit-m py-orbit-base">
              <div className="flex flex-wrap items-center justify-between gap-orbit-s">
                <button onClick={onBack} className="inline-flex h-8 items-center gap-orbit-xs text-sm text-muted-foreground hover:text-foreground">
                  <ChevronLeft className="w-4 h-4" /> {backLabel ?? `Back to ${supplier.name}`}
                </button>
                <div className="flex flex-wrap items-center justify-start gap-orbit-s sm:justify-end">
                  <SupplierGroupingPopover supplierId={supplierId} supplierName={supplier.name} />
                  {firstAnalysisDemo && mode === "comparison" && (
                    canUndoFirstAnalysisRecommendations ? (
                      <Button
                        variant="outline"
                        className="h-9 gap-orbit-xs bg-white"
                        onClick={undoAppliedRecommendations}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        {bulkAppliedRecommendationScopeLabel
                          ? `Undo ${bulkAppliedRecommendationScopeLabel} recommendations (${firstAnalysisUndoRecommendationCount})`
                          : firstAnalysisApplyAllLabel}
                      </Button>
                    ) : firstAnalysisAvailableRecommendationApplyOptions.length > 0 ? (
                      <Select
                        value=""
                        onValueChange={(value) => {
                          const option = firstAnalysisAvailableRecommendationApplyOptions.find((candidate) => candidate.id === value);
                          if (option) applyAllRecommendations(option.targets, option);
                        }}
                      >
                        <SelectTrigger className="clauseiq-v5-select-hug" aria-label="Apply Recommendations">
                          <Sparkles className="mr-orbit-xs h-3.5 w-3.5" />
                          <SelectValue placeholder={`Apply Recommendations (${firstAnalysisRecommendationTargets.length})`} />
                        </SelectTrigger>
                        <SelectContent>
                          {firstAnalysisAvailableRecommendationApplyOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.label} ({option.count})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Button
                        variant="outline"
                        disabled
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {firstAnalysisApplyAllLabel}
                      </Button>
                    )
                  )}
                  <Button
                    variant={reviewGenerateDisabled ? "outline" : "default"}
                    className="h-9 gap-orbit-xs"
                    disabled={reviewGenerateDisabled}
                    onClick={() => setRequestReviewOpen(true)}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Review &amp; Generate{reviewGenerateRequestItems.length > 0 ? ` (${reviewGenerateRequestItems.length})` : ""}
                  </Button>
                  <Button variant="default" className="h-9 gap-orbit-xs" onClick={() => setUploadOpen(true)}>
                    <Upload className="w-3.5 h-3.5" /> Upload New Version
                  </Button>
                  <Button
                    variant="outline"
                    className="h-9 gap-orbit-xs"
                    disabled={versions.length === 0}
                    onClick={() => latest && setDeleteTarget(latest.version)}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Version
                  </Button>
                </div>
              </div>
              <div className="mt-orbit-s grid gap-orbit-base lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px] lg:items-end">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {initiative.name} · {initiative.reference} · {supplier.name}
                  </p>
                  <div className="mt-orbit-xs flex flex-wrap items-center gap-x-orbit-base gap-y-orbit-s">
                    <h1 className="v5-orbit-heading-3">{contract.name}</h1>
                    <Badge variant="outline">{contract.type}</Badge>
                  </div>
                  <div className="mt-orbit-s flex items-center gap-orbit-s flex-wrap">
                    <span className="text-sm text-muted-foreground">
                      {versions.length} round{versions.length !== 1 ? "s" : ""}
                      {latest && <> · Latest updated {latest.uploadedAt}</>}
                    </span>
                  </div>
                  {versions.length > 0 && (
                    <p className="mt-orbit-s max-w-3xl text-xs text-muted-foreground">
                      Use the <span className="font-semibold text-foreground">Review</span> tab to mark which clauses need to change, then switch to <span className="font-semibold text-foreground">Changes</span> to see how the supplier responded.
                    </p>
                  )}
                </div>

                <div className="w-full rounded-lg border border-border bg-muted/30 px-orbit-base py-orbit-base">
                  <div className="flex flex-wrap items-center justify-between gap-orbit-s">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Review summary</p>
                    {versions.length >= 2 && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{clausesRequiringAction}</span>{" "}
                        clause{clausesRequiringAction === 1 ? "" : "s"} require action
                      </p>
                    )}
                  </div>
                  <div className="mt-orbit-base grid grid-cols-5 gap-orbit-s">
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

      {compactHeader && firstAnalysisDemo && <FirstAnalysisContextBanner />}

      {/* Verdict banner — only when at least 2 versions exist */}
      {!compactHeader && versions.length >= 2 && leftVersion && rightVersion && leftVersion.version !== rightVersion.version && (
        <div className="max-w-[1600px] mx-auto px-orbit-base pt-orbit-m">
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
        <div className="max-w-[1600px] mx-auto px-orbit-base pt-orbit-base">
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

      {mode === "history" && firstAnalysisDemo ? (
        <HistoryComingSoon />
      ) : mode === "history" ? (
        historyDesignContent
      ) : firstAnalysisDesignContent ? (
        firstAnalysisDesignContent
      ) : comparisonDesignContent ? (
        comparisonDesignContent
      ) : (
        <div className="mx-auto grid max-w-[1600px] grid-cols-[240px_minmax(0,1fr)] gap-orbit-m px-orbit-base py-orbit-m">
          <CategorySidebar
            categories={comparisonCategoryItems}
            total={categoryTotal}
            activeCategories={activeCategories}
            sort={categorySort}
            onSortChange={setCategorySort}
            onSelectCategory={toggleActiveCategory}
          />

          <div id="comparison-work-column" className="min-w-0 space-y-orbit-base">
            {versions.length >= 2 && (
              <div className="flex min-w-0 flex-wrap items-center gap-x-orbit-m gap-y-orbit-s border-b border-border px-orbit-xs pb-orbit-s">
                <div className="flex shrink-0 items-center gap-orbit-m">
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
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-orbit-s rounded-md border border-border bg-[#f8f7f5] px-orbit-base py-orbit-s">
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
                activeCategories={activeCategories}
                search={search}
                quickSeverityFilter={severityQuickFilter}
                quickReviewFilter={quickFilter === "need-action" ? "need-review" : null}
                onSetNoAction={(id) =>
                  decisions.changeDecision(supplierId, decisionContractId, id, (rightVersion ?? reviewVersion ?? v1).version, "no-action")
                }
                onStartDraft={(id, initialDraft) =>
                  decisions.startDraftRequest(supplierId, decisionContractId, id, (rightVersion ?? reviewVersion ?? v1).version, initialDraft)
                }
                onUpdateDraft={(id, patch) =>
                  decisions.updateDraftRequestText(supplierId, decisionContractId, id, (rightVersion ?? reviewVersion ?? v1).version, patch)
                }
                onCancelDraft={(id) =>
                  decisions.cancelDraftRequest(supplierId, decisionContractId, id, (rightVersion ?? reviewVersion ?? v1).version)
                }
                onSubmitDraft={(id) =>
                  decisions.submitDraftRequest(supplierId, decisionContractId, id, (rightVersion ?? reviewVersion ?? v1).version)
                }
                onOpenDetail={(id) => setDetailClauseId(id)}
                highlightedId={highlightClauseId}
              />
            ) : leftVersion && rightVersion && leftVersion.version !== rightVersion.version ? (
              <div className="space-y-orbit-base" id="comparison-buckets">
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
                  basketRequestOf={(id) => stateOf(id).requests[rightVersion.version]}
                  draftOf={(id) => stateOf(id).draftRequests?.[rightVersion.version] ?? {}}
                  onClose={(id) => {
                    const display = leftVersion.clauses.find((c) => c.id === id) ?? rightVersion.clauses.find((c) => c.id === id);
                    const prev = stateOf(id).closures[rightVersion.version];
                    closeWithUndo(id, display?.title ?? id.toUpperCase(), prev);
                  }}
                  onKeepOpen={(id) => decisions.setClosure(supplierId, decisionContractId, id, rightVersion.version, "keep-open")}
                  onFollowUp={(id) =>
                    decisions.startDraftRequest(supplierId, decisionContractId, id, rightVersion.version, {
                      requestedChange: "",
                      rationale: "",
                    })
                  }
                  onUpdateText={(id, patch) => decisions.updateDraftRequestText(supplierId, decisionContractId, id, rightVersion.version, patch)}
                  onCancelDraft={(id) => decisions.cancelDraftRequest(supplierId, decisionContractId, id, rightVersion.version)}
                  onSubmitDraft={(id) => {
                    decisions.submitDraftRequest(supplierId, decisionContractId, id, rightVersion.version);
                    decisions.setClosure(supplierId, decisionContractId, id, rightVersion.version, "follow-up");
                  }}
                  onRemoveRequest={(id) => decisions.removePendingRequest(supplierId, decisionContractId, id, rightVersion.version)}
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
                  basketRequestOf={(id) => stateOf(id).requests[rightVersion.version]}
                  draftOf={(id) => stateOf(id).draftRequests?.[rightVersion.version] ?? {}}
                  onClose={(id) => decisions.setRoundDecision(supplierId, decisionContractId, id, rightVersion.version, "no-action")}
                  onKeepOpen={(id) => decisions.startDraftRequest(supplierId, decisionContractId, id, rightVersion.version)}
                  onUpdateText={(id, patch) => decisions.updateDraftRequestText(supplierId, decisionContractId, id, rightVersion.version, patch)}
                  onCancelDraft={(id) => decisions.cancelDraftRequest(supplierId, decisionContractId, id, rightVersion.version)}
                  onSubmitDraft={(id) => decisions.submitDraftRequest(supplierId, decisionContractId, id, rightVersion.version)}
                  onRemoveRequest={(id) => decisions.removePendingRequest(supplierId, decisionContractId, id, rightVersion.version)}
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
                  onClose={(id) => decisions.setClosure(supplierId, decisionContractId, id, rightVersion.version, "closed")}
                  onKeepOpen={(id) => decisions.setClosure(supplierId, decisionContractId, id, rightVersion.version, "keep-open")}
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
                  onRequestChange={(id) => decisions.startDraftRequest(supplierId, decisionContractId, id, rightVersion.version)}
                  onSetNoAction={(id) => decisions.changeDecision(supplierId, decisionContractId, id, rightVersion.version, "no-action")}
                  onUpdateText={(id, patch) => decisions.updateDraftRequestText(supplierId, decisionContractId, id, rightVersion.version, patch)}
                  onCancelDraft={(id) => decisions.cancelDraftRequest(supplierId, decisionContractId, id, rightVersion.version)}
                  onSubmitDraft={(id) => decisions.submitDraftRequest(supplierId, decisionContractId, id, rightVersion.version)}
                  onRemoveRequest={(id) => decisions.removePendingRequest(supplierId, decisionContractId, id, rightVersion.version)}
                  onOpenDetail={setDetailClauseId}
                />
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-card p-orbit-xxl text-center text-sm text-muted-foreground">
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
            decisions.setClosure(supplierId, decisionContractId, id, rightVersion?.version ?? "v1", "closed");
            setDetailClauseId(null);
          }}
          onKeepOpen={(id) =>
            decisions.setClosure(supplierId, decisionContractId, id, rightVersion?.version ?? "v1", "keep-open")
          }
          onMarkNewIssue={(id) =>
            decisions.setRoundDecision(supplierId, decisionContractId, id, rightVersion?.version ?? "v1", "request-update")
          }
        />
      )}

      <RequestReviewDialog
        open={requestReviewOpen}
        onOpenChange={setRequestReviewOpen}
        requests={reviewGenerateRequestItems}
        supplierName={supplier.name}
        csvNeedsUpdate={csvNeedsUpdate}
        bulkSummaryMode={firstAnalysisDemo && bulkReviewSummaryMode}
        reviewProgress={firstAnalysisDemo ? firstAnalysisReviewProgress : undefined}
        onSubmit={() => {
          generateRequestedChangesCsv();
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
        nextVersionLabel={`v${availableVersions.length + 1}`}
        onConfirm={onUploadVersion}
      />

      <V5OrbitConfirmOverlay
        open={acceptConfirmOpen}
        onOpenChange={setAcceptConfirmOpen}
        title={`Accept ${rightVersion?.version.toUpperCase() ?? "this version"}?`}
        description="This marks the current supplier version as accepted for this prototype review. You can undo the status from the review modal."
        confirmLabel="Accept Version"
        onConfirm={() => {
          if (!rightVersion) return;
          setDecisions_((prev) => ({ ...prev, [rightVersion.version]: "accepted" }));
        }}
      />

      <V5OrbitConfirmOverlay
        open={!!deleteTarget}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setDeleteTarget(null);
        }}
        title={`Delete Version ${deleteTarget ? parseInt(deleteTarget.replace("v", ""), 10) : ""}?`}
        description={`This will remove Version ${deleteTarget ? parseInt(deleteTarget.replace("v", ""), 10) : ""} and update all comparisons and tracking.`}
        confirmLabel="Delete Version"
        destructive
        onConfirm={() => deleteTarget && onDeleteVersion(deleteTarget)}
      />
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
  const documentType: "PDF" | "DOC" | "Unknown" = file?.name.toLowerCase().endsWith(".pdf")
    ? "PDF"
    : file?.name.toLowerCase().endsWith(".docx")
      ? "DOC"
      : "Unknown";

  return (
    <V5OrbitOverlay
      open={open}
      onOpenChange={onOpenChange}
      title="Upload Contract Version"
      description="Upload the supplier's updated contract to compare changes against the previous version."
      footer={
        <div className="flex justify-end gap-orbit-s">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!file || !label || processing} className="gap-orbit-xs">
            {processing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing…</> : <><Upload className="w-3.5 h-3.5" /> Upload &amp; analyse</>}
          </Button>
        </div>
      }
    >
        <div className="space-y-orbit-base">
          <div className="rounded-md border border-border bg-muted/30 p-orbit-base text-xs space-y-orbit-xs">
            <p><span className="text-muted-foreground">Initiative:</span> <span className="font-medium text-foreground"> {initiativeName} · {initiativeRef}</span></p>
            <p><span className="text-muted-foreground">Supplier:</span> <span className="font-medium text-foreground"> {supplierName}</span></p>
            <p><span className="text-muted-foreground">Contract:</span> <span className="font-medium text-foreground"> {contractName}</span></p>
          </div>
          <div className="space-y-orbit-xs">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase">Version label</label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} className="h-9" />
          </div>
          <div className="space-y-orbit-xs">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase">Contract file</label>
            {file ? (
              <FileItem
                filename={file.name}
                documentType={documentType}
                trailing={
                  <Button variant="ghost" onClick={() => setFile(null)}>
                    Change
                  </Button>
                }
              />
            ) : (
              <Dropzone
                ariaLabel="Upload contract version"
                accept=".pdf,.docx,.txt"
                onFileSelected={setFile}
                acceptedFileTypesLabel="File types supported: PDF, DOCX, or TXT."
                maxFileSizeLabel="Maximum upload file size: 100 MB"
              />
            )}
          </div>
        </div>
    </V5OrbitOverlay>
  );
}

// ---- pieces -----------------------------------------------------------------

function formatShortDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function CompactContractTopbar({
  backLabel,
  onBack,
  referenceLine,
  firstAnalysisDemo,
  demoAvailable,
  onFirstAnalysisDemoChange,
}: {
  backLabel: string;
  onBack: () => void;
  referenceLine: string;
  firstAnalysisDemo: boolean;
  demoAvailable: boolean;
  onFirstAnalysisDemoChange: (enabled: boolean) => void;
}) {
  return (
    <div className="flex h-10 items-center gap-orbit-base border-b border-[rgba(0,0,0,0.08)] px-orbit-base">
      <button
        onClick={onBack}
        className="inline-flex shrink-0 items-center gap-orbit-xs text-[13px] font-medium text-primary hover:underline"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> {backLabel}
      </button>
      <div className="h-3.5 w-px bg-border" aria-hidden />
      <div className="flex min-w-0 flex-1 items-center gap-orbit-s">
        <h1 className="v5-orbit-heading-label min-w-[120px] truncate text-foreground">{referenceLine}</h1>
      </div>
      {demoAvailable && (
        <FirstAnalysisDemoToggle
          active={firstAnalysisDemo}
          onChange={() => onFirstAnalysisDemoChange(!firstAnalysisDemo)}
        />
      )}
    </div>
  );
}

function FirstAnalysisDemoToggle({
  active,
  onChange,
}: {
  active: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onChange}
      className={cn(
        "ml-auto inline-flex h-7 shrink-0 items-center gap-orbit-s rounded-md border px-orbit-s text-[11px] font-medium transition-colors",
        active
          ? "border-[#185FA5]/35 bg-[#E6F1FB] text-[#0C447C]"
          : "border-border bg-white text-muted-foreground hover:text-foreground",
      )}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          active ? "bg-[#185FA5]" : "bg-muted-foreground/40",
        )}
        aria-hidden
      />
      V1 Analysis
    </button>
  );
}

function FirstAnalysisContextBanner() {
  return (
    <section className="bg-background">
      <div className="mx-auto w-full max-w-[1500px] px-orbit-base pt-orbit-base pb-orbit-none">
        <div className="rounded-lg border border-border bg-card px-orbit-base py-orbit-base shadow-sm">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-orbit-s">
              <h2 className="v5-orbit-heading-5">
                Validate ClauseIQ recommendations before supplier negotiation
              </h2>
            </div>
            <p className="mt-orbit-xs max-w-none whitespace-nowrap text-xs leading-5 text-muted-foreground">
              Review each clause, decide whether to use the recommended actionability, edit your own requested change, or mark no action. Requested changes are collected for review and generated as a CSV negotiation log.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ModeSwitcher({
  mode,
  onChange,
  comparisonLabel = "Review",
  historyDisabled = false,
  onApplyAllRecommendations,
  onApplyRecommendationOption,
  onUndoAllRecommendations,
  applyAllRecommendationsDisabled = true,
  applyAllRecommendationsQueued = false,
  applyAllRecommendationsReviewed = false,
  applyAllRecommendationsUndoable = false,
  recommendationApplyOptions = [],
  recommendationCount = 0,
  undoRecommendationCount = 0,
  undoRecommendationScopeLabel,
  onReviewGenerate,
  reviewGenerateDisabled,
  requestCount,
}: {
  mode: ClauseIqMode;
  onChange: (mode: ClauseIqMode) => void;
  comparisonLabel?: string;
  historyDisabled?: boolean;
  onApplyAllRecommendations?: () => void;
  onApplyRecommendationOption?: (option: RecommendationApplyOption) => void;
  onUndoAllRecommendations?: () => void;
  applyAllRecommendationsDisabled?: boolean;
  applyAllRecommendationsQueued?: boolean;
  applyAllRecommendationsReviewed?: boolean;
  applyAllRecommendationsUndoable?: boolean;
  recommendationApplyOptions?: RecommendationApplyOption[];
  recommendationCount?: number;
  undoRecommendationCount?: number;
  undoRecommendationScopeLabel?: string | null;
  onReviewGenerate: () => void;
  reviewGenerateDisabled: boolean;
  requestCount: number;
}) {
  const canUndoAppliedRecommendations = Boolean(
    applyAllRecommendationsUndoable && onUndoAllRecommendations,
  );
  const applyAllButtonLabel = applyAllRecommendationsReviewed
    ? "All recommendations reviewed"
    : canUndoAppliedRecommendations
    ? `${undoRecommendationScopeLabel ? `Undo ${undoRecommendationScopeLabel} recommendations` : "Undo recommendations"}${undoRecommendationCount > 0 ? ` (${undoRecommendationCount})` : ""}`
    : applyAllRecommendationsQueued
    ? "Recommendations added to review"
    : `Apply Recommendations${recommendationCount > 0 ? ` (${recommendationCount})` : ""}`;
  const availableRecommendationApplyOptions = recommendationApplyOptions.filter((option) => option.count > 0);
  const canChooseRecommendationScope =
    Boolean(onApplyRecommendationOption) &&
    !canUndoAppliedRecommendations &&
    !applyAllRecommendationsQueued &&
    !applyAllRecommendationsReviewed &&
    !applyAllRecommendationsDisabled &&
    availableRecommendationApplyOptions.length > 0;

  return (
    <div className="flex min-w-0 items-center gap-orbit-base border-b border-[rgba(0,0,0,0.08)] bg-white px-orbit-base py-orbit-xs">
      <div role="tablist" aria-label="Analysis mode" className="flex items-center">
        <TabButton
          active={mode === "comparison"}
          onClick={() => onChange("comparison")}
          ariaControls="clauseiq-v5-comparison-panel"
        >
          {comparisonLabel}
        </TabButton>
        <TabButton
          active={mode === "history"}
          disabled={historyDisabled}
          status={historyDisabled ? "Disabled" : "Rest"}
          onClick={() => onChange("history")}
          ariaControls="clauseiq-v5-history-panel"
        >
          History
        </TabButton>
      </div>
      {mode === "comparison" && (
        <div className="ml-auto flex shrink-0 items-center gap-orbit-s">
          {onApplyAllRecommendations && (
            canChooseRecommendationScope ? (
              <Select
                value=""
                onValueChange={(value) => {
                  const option = availableRecommendationApplyOptions.find((candidate) => candidate.id === value);
                  if (option) onApplyRecommendationOption?.(option);
                }}
              >
                <SelectTrigger className="clauseiq-v5-select-hug" aria-label="Apply Recommendations">
                  <Sparkles className="h-3.5 w-3.5" />
                  <SelectValue placeholder={applyAllButtonLabel} />
                </SelectTrigger>
                <SelectContent>
                  {availableRecommendationApplyOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label} ({option.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Button
                variant="outline"
                disabled={!canUndoAppliedRecommendations && applyAllRecommendationsDisabled}
                onClick={canUndoAppliedRecommendations ? onUndoAllRecommendations : onApplyAllRecommendations}
              >
                {applyAllRecommendationsReviewed ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : canUndoAppliedRecommendations ? (
                  <RotateCcw className="h-3.5 w-3.5" />
                ) : applyAllRecommendationsQueued ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {applyAllButtonLabel}
              </Button>
            )
          )}
          <Button
            variant={reviewGenerateDisabled ? "outline" : "default"}
            className="h-7 gap-orbit-xs px-orbit-base text-xs"
            disabled={reviewGenerateDisabled}
            onClick={onReviewGenerate}
          >
            <Download className="h-3.5 w-3.5" />
            Review &amp; Generate{requestCount > 0 ? ` (${requestCount})` : ""}
          </Button>
        </div>
      )}
    </div>
  );
}

function HistoryComingSoon() {
  return (
    <main
      id="clauseiq-v5-history-panel"
      className="grid min-h-[calc(100vh-88px)] place-items-center bg-[#F7F9FC] px-orbit-base py-orbit-xxl"
    >
      <div className="flex max-w-[420px] flex-col items-center text-center">
        <div className="grid h-12 w-12 place-items-center rounded-full border border-[#DDE5F0] bg-white text-[#185FA5] shadow-sm">
          <History className="h-5 w-5" />
        </div>
        <p className="mt-orbit-base text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          History
        </p>
        <h1 className="v5-orbit-heading-4 mt-orbit-xs text-foreground">Coming Soon</h1>
        <p className="mt-orbit-s text-sm leading-6 text-muted-foreground">
          This view is being prepared.
        </p>
      </div>
    </main>
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
      <div className="flex h-8 items-center gap-orbit-base border-b border-[rgba(0,0,0,0.08)] bg-[#f8f7f5] px-orbit-base text-[11px] text-muted-foreground">
        <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.04em]">Comparing</span>
        {versions.length >= 2 ? (
          <PairSelector versions={versions} pair={pair} onChange={onPairChange} compact />
        ) : (
          <span className="text-[10px] text-muted-foreground">{contract.version || pair.right}</span>
        )}
        <span className="shrink-0 rounded px-orbit-xs py-orbit-xxs text-[10px] font-medium text-muted-foreground">
          Total Clauses - <strong className="text-foreground">{contract.total}</strong>
        </span>
        <InlineMetIndicator comparison={comparison} hasVersionComparison={hasVersionComparison} />
        <div className="ml-auto rounded-md border border-border bg-white px-orbit-s py-orbit-xxs text-[10px]">
          <span className="mr-orbit-xs uppercase text-muted-foreground">Score</span>
          <strong className="text-[13px] text-foreground">{contract.score}</strong>
          <span className={comparison.scoreDelta > 0 ? "ml-orbit-xs text-[#3B6D11]" : comparison.scoreDelta < 0 ? "ml-orbit-xs text-[#A32D2D]" : "ml-orbit-xs text-muted-foreground"}>
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
    <span className="ml-orbit-xs inline-flex shrink-0 items-center gap-orbit-xs text-[10px]" style={{ color }}>
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
      <div className="flex h-8 items-center gap-orbit-xs border-b border-[rgba(0,0,0,0.08)] bg-[#FAEEDA]/40 px-orbit-base text-[10px] font-medium text-[#633806]">
        <IconInfoCircle size={13} stroke={1.8} />
        Showing all {versions.length} rounds · {first?.version ?? "v1"} through {latest?.version ?? "v1"}
        {first && latest && <> · {formatShortDate(first.uploadedAt)} to {formatShortDate(latest.uploadedAt)}</>}
      </div>
      <div className="grid grid-cols-4 gap-orbit-base border-b border-[rgba(0,0,0,0.08)] bg-white px-orbit-base py-orbit-base">
        <HistoryStatCard value={model.stats.totalClauses} label="Total clauses" trend={`across ${model.stats.roundCount} rounds`} />
        <HistoryStatCard value={model.stats.stillOpen} label="Still open" trend={`after ${model.stats.roundCount} rounds`} tone="danger" />
        <HistoryStatCard value={model.stats.avgRoundsToResolve} label="Avg rounds to resolve" trend="computed from met clauses" tone="success" />
        <HistoryStatCard value={`${model.stats.settledByRound3Pct}%`} label="Settled by round 3" trend="benchmark 65%" tone={model.stats.settledByRound3Pct >= 65 ? "success" : "danger"} />
      </div>
      <div className="flex items-center gap-orbit-s border-b border-[rgba(0,0,0,0.08)] bg-[#f8f7f5] px-orbit-base py-orbit-s">
        {(Object.keys(historyFilterLabels) as HistoryFilter[]).map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => onFilterChange(filter)}
            className={`inline-flex h-7 items-center gap-orbit-xs rounded-full px-orbit-base text-[10px] font-medium ${
              activeFilter === filter
                ? "bg-[#1a2744] text-white"
                : "border border-border bg-white text-muted-foreground hover:text-foreground"
            }`}
          >
            {historyFilterLabels[filter]}
            <span className={`rounded-full px-orbit-xs py-orbit-micro text-[9px] ${activeFilter === filter ? "bg-white/20" : "bg-muted"}`}>
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
    <div className="rounded-md bg-[#f8f7f5] px-orbit-base py-orbit-s">
      <p className="text-lg font-medium tabular-nums text-foreground">{value}</p>
      <p className="text-[9px] font-medium uppercase text-muted-foreground">{label}</p>
      <p className={`mt-orbit-xs text-[9px] ${trendClass}`}>{trend}</p>
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
    <div className="ml-auto flex min-w-0 flex-1 flex-wrap items-center justify-end gap-orbit-s">
      <div className="relative min-w-[180px] flex-1 sm:max-w-[260px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Filter by name or ID..."
          className="h-8 bg-card pl-orbit-l text-xs"
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
          <Button variant="ghost" className="h-8 shrink-0 text-[11px] text-muted-foreground" onClick={onResetToLatest}>
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
      className={`inline-flex h-10 items-center gap-orbit-xs border-b-2 text-[12px] font-medium ${
        active ? "border-[#1a2744] text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {children}
      <span className="rounded-full bg-muted px-orbit-xs py-orbit-micro text-[9px] text-muted-foreground">{count}</span>
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
      className={`inline-flex items-center gap-orbit-xs rounded-[10px] px-orbit-xs py-orbit-micro text-[9px] font-medium ${config.className}`}
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
      <span className="inline-flex cursor-default items-center gap-orbit-xs rounded-full bg-primary px-orbit-s py-orbit-xs text-[10px] font-medium text-primary-foreground">
        <Sparkles className="h-3 w-3" />
        Requested
      </span>
    );
  }

  return (
    <span className="inline-flex cursor-default items-center gap-orbit-xs rounded-full bg-[#EAF3DE] px-orbit-s py-orbit-xs text-[10px] font-medium text-[#27500A]">
      <CheckCircle2 className="h-3 w-3" />
      No Action
    </span>
  );
}

function RequestLifecycleBadge({ request }: { request?: ClauseRequest }) {
  if (request?.state === "pending") {
    return (
      <span className="inline-flex cursor-default items-center gap-orbit-xs rounded-full border border-[#185FA5]/25 bg-[#E6F1FB] px-orbit-s py-orbit-xs text-[10px] font-medium text-[#0C447C]">
        <FileText className="h-3 w-3" />
        Added to Review
      </span>
    );
  }

  if (request?.state === "submitted") {
    return (
      <span className="inline-flex cursor-default items-center gap-orbit-xs rounded-full border border-[#BFD6AB] bg-[#EAF3DE] px-orbit-s py-orbit-xs text-[10px] font-medium text-[#27500A]">
        <CheckCircle2 className="h-3 w-3" />
        Reviewed
      </span>
    );
  }

  return <DecisionBadge decision="request-update" />;
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
      <div className="flex h-7 items-center gap-orbit-s border-b border-[rgba(0,0,0,0.08)] bg-white px-orbit-base text-[11px]">
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
          className="ml-auto shrink-0 rounded px-orbit-s py-orbit-xxs font-medium text-primary hover:bg-primary/5"
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
    <div className="flex items-center gap-orbit-s">
      <span className="hidden text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:inline">
        Scoring options
      </span>
      <div className="inline-flex h-7 items-center rounded-full border border-border/80 bg-muted/50 p-orbit-xxs">
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`h-6 rounded-full px-orbit-s text-[11px] font-medium transition-colors ${
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
      <span className="shrink-0 rounded px-orbit-xs py-orbit-xxs" style={{ color: bandColor[current.band] }}>
        <strong>{current.score} {current.band}</strong> {delta} · {model.resolvedTotal}/{model.identifiedTotal}
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded px-orbit-xs py-orbit-xxs" style={{ color: bandColor[current.band] }}>
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
    <div className="rounded-lg border border-border bg-card p-orbit-base">
      <div className="grid gap-orbit-base lg:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)]">
        <div className="space-y-orbit-base">
          <IssueWeightedScoreOption model={model} onClauseSelect={onClauseSelect} />
        </div>

        <div className="hidden w-px bg-border lg:block" aria-hidden />

        <div className="space-y-orbit-base">
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
    <div className="space-y-orbit-base">
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
    <div className="mt-orbit-base flex flex-wrap items-center gap-orbit-s border-t border-border pt-orbit-s text-[10px]">
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
      <div className="ml-auto flex items-center gap-orbit-s">
        <Button variant="outline" className="h-7 rounded-[5px] px-orbit-base text-[10px]" onClick={onRequestChanges}>
          Request changes
        </Button>
        <Button
          className="h-7 rounded-[5px] px-orbit-base text-[10px]"
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
      <div className="flex min-h-[70px] items-center gap-orbit-base border-b border-[rgba(0,0,0,0.08)] bg-white px-orbit-base py-orbit-base">
        <div className="min-w-[180px] flex-1 text-[10px] font-medium text-muted-foreground">
          First analysis — no comparison available
        </div>
        <CompactVersionDistributionSide version={data.current} label="current" versions={versions} current />
      </div>
    );
  }

  return (
    <div className="border-b border-[rgba(0,0,0,0.08)] bg-white">
      <div className="flex items-center gap-orbit-base px-orbit-base py-orbit-s">
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
        "grid min-h-[54px] min-w-0 flex-1 grid-cols-[auto_1fr_auto] items-center gap-orbit-base rounded-md border px-orbit-base py-orbit-s",
        current ? "border-[#185FA5]/35 bg-[rgba(230,241,251,0.55)] shadow-[inset_3px_0_0_#185FA5]" : "border-transparent bg-[#f8f7f5]",
      )}
    >
      <div className="min-w-[62px]">
        <div className="flex items-center gap-orbit-xs">
          <span className={cn(
            "text-[9px] font-medium uppercase tracking-[0.04em]",
            current ? "text-[#185FA5]" : "text-muted-foreground",
          )}>
            {labelText}
          </span>
          {current && (
            <span className="inline-flex items-center gap-orbit-xs rounded-full bg-[#185FA5] px-orbit-xs py-orbit-xxs text-[8px] font-semibold uppercase tracking-[0.04em] text-white">
              <IconEye size={10} stroke={2} aria-hidden />
              Current version
            </span>
          )}
        </div>
        <p className="mt-orbit-xxs text-2xl font-medium leading-none text-foreground tabular-nums">{version.score}</p>
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
    <div className="flex shrink-0 flex-col items-center gap-orbit-xxs px-orbit-xxs">
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
    <div className="mb-orbit-xs flex min-w-0 flex-wrap items-center gap-x-orbit-xs gap-y-orbit-xxs text-[10px] text-muted-foreground">
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
    <div className="grid gap-orbit-base border-t border-[rgba(0,0,0,0.08)] bg-[rgba(230,241,251,0.15)] px-orbit-base py-orbit-base min-[900px]:grid-cols-[1fr_1.6fr]">
      <div className="min-w-0">
        <div className="flex items-center gap-orbit-s">
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
            className="ml-orbit-l mt-orbit-xxs rounded px-orbit-xs py-orbit-xxs text-[10px] font-medium text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            See all changes →
          </button>
        )}
      </div>
      <div className="min-w-0">
        {movers.length > 0 && onMoverSelect ? (
          <TopMoversList movers={movers} onMoverSelect={onMoverSelect} />
        ) : (
          <div className="rounded-[5px] border border-border bg-white px-orbit-s py-orbit-s text-[11px] text-muted-foreground">
            No clause movements this round.
          </div>
        )}
      </div>
    </div>
  );
}

function MovementNarrative({ movers, delta }: { movers: ComparisonMover[]; delta: number }) {
  const improved = movers.filter((mover) => mover.direction === "improved").length;
  const regressed = movers.filter((mover) => mover.direction === "regressed").length;
  const created = movers.filter((mover) => mover.direction === "new").length;
  const total = improved + regressed + created;
  const scoreText = delta > 0 ? `Net change: +${delta} points.` : delta < 0 ? `Net change: -${Math.abs(delta)} points.` : total > 0 ? "Score unchanged." : "";
  const ariaLabel =
    total === 0
      ? delta === 0
        ? "No changes in this round."
        : `Score recalculated. No clause movement this round. ${scoreText}`
      : `${improved ? `${improved} improved` : ""}${improved && regressed ? ", " : ""}${regressed ? `${regressed} regressed` : ""}${(improved || regressed) && created ? ", " : ""}${created ? `${created} new clause${created === 1 ? "" : "s"}` : ""}. ${scoreText}`.trim();

  return (
    <p className="ml-orbit-l mt-orbit-xs min-w-0 text-[12px] leading-[1.55] text-foreground" aria-label={ariaLabel}>
      {total === 0 ? (
        delta === 0 ? (
          <>No changes in this round.</>
        ) : (
          <>
            <span className="font-medium">Score recalculated.</span> No clause movement this round. <ScoreDeltaText delta={delta} />
          </>
        )
      ) : (
        <>
          {regressed > improved && regressed > 0 ? (
            <>
              <NarrativeCount count={regressed} /> <span className="font-medium">regressed</span>
              {improved > 0 && <> , <NarrativeCount count={improved} /> <span className="font-medium">improved</span></>}
            </>
          ) : improved > 0 && regressed > 0 ? (
            <>
              <NarrativeCount count={improved} /> <span className="font-medium">improved</span>, <NarrativeCount count={regressed} /> <span className="font-medium">regressed</span>
            </>
          ) : improved > 0 ? (
            <>
              <NarrativeCount count={improved} /> clause{improved === 1 ? "" : "s"} <span className="font-medium">improved</span> this round
            </>
          ) : regressed > 0 ? (
            <>
              <NarrativeCount count={regressed} /> clause{regressed === 1 ? "" : "s"} <span className="font-medium">regressed</span>
            </>
          ) : null}
          {created > 0 && (
            <>
              {(improved > 0 || regressed > 0) && <>, </>}
              <NarrativeCount count={created} /> new clause{created === 1 ? "" : "s"}
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
    <div className="flex flex-col gap-orbit-xs">
      {visibleMovers.map((mover) => {
        const regressed = mover.direction === "regressed";
        const created = mover.direction === "new";
        const tone = regressed
          ? "bg-[rgba(252,235,235,0.4)] hover:bg-[rgba(252,235,235,0.65)]"
          : "bg-white hover:bg-[#E6F1FB]/30";
        const badgeClass = regressed ? "bg-[#A32D2D]" : created ? "bg-[#185FA5]" : "bg-[#3B6D11]";
        const Icon = regressed ? IconArrowDown : created ? IconPlus : IconArrowUp;
        const transitionLabel = created ? (
          <span>New clause</span>
        ) : (
          <>
            <strong className="font-medium text-foreground">{formatMoverSeverity(mover.previousSeverity)}</strong>
            <span aria-hidden> → </span>
            <strong className="font-medium text-foreground">{formatMoverSeverity(mover.currentSeverity)}</strong>
          </>
        );
        const accessibleTransition = created
          ? "new clause"
          : `moved from ${formatMoverSeverity(mover.previousSeverity)} to ${formatMoverSeverity(mover.currentSeverity)}`;

        return (
          <button
            key={mover.id}
            type="button"
            onClick={() => onMoverSelect(mover.id)}
            aria-label={`${mover.name}, ${accessibleTransition}`}
            className={`grid w-full grid-cols-[16px_24px_minmax(0,1fr)_auto_12px] items-center gap-orbit-s rounded-[5px] border border-border px-orbit-s py-orbit-xs text-left transition-colors hover:border-[#185FA5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${tone}`}
          >
            <span className={`grid h-4 w-4 place-items-center rounded-full text-white ${badgeClass}`} aria-hidden="true">
              <Icon size={10} stroke={2} />
            </span>
            <span className="tabular-nums text-[9px] text-muted-foreground">{mover.id.toUpperCase()}</span>
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
      <div className="mt-orbit-s divide-y divide-border">
        {drivers.length === 0 ? (
          <div className="py-orbit-s text-xs text-muted-foreground">No open risk drivers.</div>
        ) : drivers.slice(0, 3).map((driver) => {
          const stalled = driver.roundsUnchanged >= 2;
          return (
            <button
              key={driver.clauseId}
              type="button"
              onClick={() => onClauseSelect(driver.clauseId)}
              className="grid w-full grid-cols-[minmax(0,1fr)_28px] items-start gap-orbit-base py-orbit-s text-left hover:bg-muted/35"
            >
              <span className="flex min-w-0 items-start gap-orbit-s">
                <span
                  className="mt-orbit-xs h-[5px] w-[5px] shrink-0 rounded-full"
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
      <div className="mt-orbit-s space-y-orbit-s">
        {rows.map((row) => {
          const identified = score.identified[row.key];
          const total = Math.max(1, identified);
          const resolved = score.resolved[row.key];
          const remaining = score.open[row.key];
          const resolvedWidth = resolved > 0 ? Math.max(3, (resolved / total) * 100) : 3;
          return (
            <div key={row.key} className="grid grid-cols-[48px_minmax(0,1fr)_38px] items-center gap-orbit-s">
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
      <div className="rounded-md border border-border bg-muted/25 px-orbit-base py-orbit-base text-xs text-muted-foreground">
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
            className={`grid w-full grid-cols-[82px_minmax(0,1fr)_34px] items-center gap-orbit-s py-orbit-s text-left hover:bg-muted/35 ${
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
  return <span className={`inline-flex items-center gap-orbit-xs font-medium ${toneClass}`}>{children}</span>;
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
      <div className="mt-orbit-xs grid grid-cols-5 text-[8px] text-muted-foreground">
        {zones.map((zone) => <span key={zone.label}>{zone.label}</span>)}
      </div>
    </div>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="min-w-0 text-center">
      <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-normal sm:text-[10px]">{label}</p>
      <p className={`text-lg font-bold tabular-nums leading-tight ${tone}`}>{value}</p>
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
  const selectorClass = compact
    ? "grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-orbit-xs text-[11px]"
    : "inline-flex items-center gap-orbit-xs text-sm";
  const triggerClass = compact ? "h-6 w-full min-w-0 rounded-md bg-white px-orbit-s text-[11px]" : "h-9 w-[164px] text-sm";
  const formatVersion = (version?: ContractVersion) =>
    version ? `${version.version} · ${new Date(version.uploadedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : "Version";

  if (staticOnly) {
    return (
      <div className={cn(selectorClass, "text-muted-foreground")}>
        <span className="min-w-0 truncate rounded border border-border bg-white px-orbit-s py-orbit-xxs">{formatVersion(leftVersion)}</span>
        <ArrowRight className="h-3.5 w-3.5 shrink-0" />
        <span className="min-w-0 truncate rounded border border-border bg-white px-orbit-s py-orbit-xxs">{formatVersion(rightVersion)}</span>
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
    <div className={selectorClass}>
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

const categorySidebarRowClassName = (active: boolean, disabled = false) => cn(
  "flex w-full items-center rounded-md border px-orbit-s py-orbit-xs transition-colors",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orbit-color-focus-ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--orbit-color-card-bg-default)]",
  active
    ? "border-[var(--orbit-color-card-border-selected)] bg-[var(--orbit-color-card-bg-selected)]"
    : "border-transparent hover:border-[var(--orbit-color-card-border-hover)] hover:bg-[var(--orbit-color-btn-secondary-bg-hover)]",
  disabled && "opacity-60",
);

function CategorySidebar({
  categories,
  total,
  activeCategories,
  sort,
  onSortChange,
  onSelectCategory,
  variant = "rail",
}: {
  categories: CategorySidebarItem[];
  total: number;
  activeCategories: string[];
  sort: CategorySortKey;
  onSortChange: (sort: CategorySortKey) => void;
  onSelectCategory: (category: string | null) => void;
  variant?: "rail" | "panel";
}) {
  void onSortChange;
  const rowRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const sortedCategories = useMemo(() => sortCategorySidebarItems(categories, sort), [categories, sort]);
  const activeCategorySet = useMemo(() => new Set(activeCategories), [activeCategories]);

  const handleRowKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const direction = event.key === "ArrowDown" ? 1 : -1;
    const nextIndex = Math.max(0, Math.min(rowRefs.current.length - 1, index + direction));
    rowRefs.current[nextIndex]?.focus();
  };

  return (
    <aside
      className={cn(
        "overflow-y-auto",
        variant === "rail"
          ? "sticky top-[178px] max-h-[calc(100vh-190px)] w-60 shrink-0 self-start rounded-lg border border-border bg-card p-orbit-s"
          : "max-h-[540px] w-full",
      )}
    >
      {variant === "rail" && (
        <div
          tabIndex={0}
          className="mb-orbit-xs rounded-md px-orbit-s py-orbit-xs outline-none focus-visible:ring-2 focus-visible:ring-[var(--orbit-color-focus-ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--orbit-color-card-bg-default)]"
        >
          <Text as="p" size="Small" variant="Secondary">CATEGORIES</Text>
        </div>
      )}

      <div className="space-y-orbit-xs">
        <button
          ref={(node) => {
            rowRefs.current[0] = node;
          }}
          type="button"
          role="button"
          aria-pressed={activeCategories.length === 0}
          aria-label={`Clear category filters, ${total} clauses`}
          onClick={() => onSelectCategory(null)}
          onKeyDown={(event) => handleRowKeyDown(event, 0)}
          className={cn(categorySidebarRowClassName(activeCategories.length === 0), "justify-between")}
        >
          <Text as="span" size="Small" variant={activeCategories.length === 0 ? "Bold" : "Secondary"}>
            All
          </Text>
          <Chip label={String(total)} size="Mini" variant="No Status" selected={activeCategories.length === 0} />
        </button>

        {sortedCategories.map((category, index) => {
          const active = activeCategorySet.has(category.name);
          const rowIndex = index + 1;
          return (
            <button
              key={category.name}
              ref={(node) => {
                rowRefs.current[rowIndex] = node;
              }}
              type="button"
              role="button"
              aria-pressed={active}
              aria-label={`${active ? "Remove" : "Add"} ${category.name} category filter, ${category.count} clauses`}
              onClick={() => onSelectCategory(category.name)}
              onKeyDown={(event) => handleRowKeyDown(event, rowIndex)}
              className={cn(categorySidebarRowClassName(active, category.count === 0), "gap-orbit-s")}
            >
              <span className="min-w-0 flex-1 truncate" style={{ textAlign: "left" }}>
                <Text as="span" size="Small" variant={active ? "Bold" : "Secondary"}>
                  {category.name}
                </Text>
              </span>
              <Chip label={String(category.count)} size="Mini" variant="No Status" selected={active} />
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function CategoryStrip({
  categories,
  total,
  activeCategories,
  onSelectCategory,
  categoryPanel,
}: {
  categories: CategorySidebarItem[];
  total: number;
  activeCategories: string[];
  onSelectCategory: (category: string | null) => void;
  categoryPanel: ReactNode;
}) {
  const topCategories = useMemo(() => sortCategorySidebarItems(categories, "risk").slice(0, 6), [categories]);
  const activeCategorySet = useMemo(() => new Set(activeCategories), [activeCategories]);
  const [panelOpen, setPanelOpen] = useState(false);
  return (
    <Card type="Static" padding="Small">
      <div className="flex min-w-0 items-start gap-orbit-s">
        <Text as="span" size="Small" variant="Secondary">Categories</Text>
        <div className="min-w-0 flex-1">
          <QuickFilterGroup ariaLabel="Category filters">
            <CategoryStripChip
              active={activeCategories.length === 0}
              label={`All ${total}`}
              onClick={() => onSelectCategory(null)}
            />
            {topCategories.map((category) => (
              <CategoryStripChip
                key={category.name}
                active={activeCategorySet.has(category.name)}
                label={`${category.name} ${category.count}`}
                onClick={() => onSelectCategory(category.name)}
              />
            ))}
          </QuickFilterGroup>
        </div>
        <Button
          type="button"
          aria-expanded={panelOpen}
          variant="outline"
          className="shrink-0"
          onClick={() => setPanelOpen((current) => !current)}
        >
          <IconList size={12} stroke={1.8} />
          Categories
        </Button>
      </div>
      {panelOpen && (
        <div className="mt-orbit-s border-t border-border pt-orbit-s">
          {categoryPanel}
        </div>
      )}
    </Card>
  );
}

function CategoryStripChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return <QuickFilterItem label={label} selected={active} onClick={onClick} />;
}

// ---- Review (v1) ------------------------------------------------------------

function ReviewGuidance({ versionLabel, compact = false }: { versionLabel: string; compact?: boolean }) {
  return (
    <div
      className={
        compact
          ? "flex min-h-9 min-w-[240px] max-w-[360px] flex-1 items-center gap-orbit-s rounded-md border border-primary/20 bg-card px-orbit-base py-orbit-xs text-[11px] leading-snug text-muted-foreground"
          : "bg-card border border-primary/20 rounded-lg px-orbit-base py-orbit-base text-xs text-muted-foreground flex items-start gap-orbit-s"
      }
    >
      <Sparkles className={compact ? "h-3.5 w-3.5 shrink-0 text-primary" : "w-3.5 h-3.5 text-primary mt-orbit-xxs shrink-0"} />
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
    ? `Reviewed on ${formatShortDate(request.submittedAt)}`
    : request.state === "submitted"
      ? "Reviewed"
      : "Added to Review";
}

function ClauseRequestForm({
  versionLabel,
  draft,
  request,
  inherited,
  submitLabel = "Add to requests",
  requestPlaceholder = "Describe the change you want from the supplier",
  compact = false,
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
  compact?: boolean;
  onUpdate: (patch: { requestedChange?: string; rationale?: string }) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const requestValue = draft?.requestedChange ?? request?.requestedChange ?? "";
  const rationaleValue = draft?.rationale ?? request?.rationale ?? "";

  return (
    <div
      className={cn("mt-orbit-base border-t border-border pt-orbit-base", compact ? "space-y-orbit-s" : "space-y-orbit-base")}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {inherited && !draft?.requestedChange && !draft?.rationale && (
        <div className="space-y-orbit-xs rounded-md border-l-2 border-primary bg-primary/5 px-orbit-base py-orbit-s text-xs">
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
      <div className="grid gap-orbit-base md:grid-cols-2">
        <div className="space-y-orbit-xs">
          <label className="text-[11px] font-semibold uppercase text-muted-foreground">
            Requested change ({versionLabel}) <span className="text-destructive">*</span>
          </label>
          <Textarea
            value={requestValue}
            onChange={(event) => onUpdate({ requestedChange: event.target.value })}
            placeholder={requestPlaceholder}
            className={cn("min-h-[64px] text-sm", compact && "min-h-[58px] text-xs")}
          />
        </div>
        <div className="space-y-orbit-xs">
          <label className="text-[11px] font-semibold uppercase text-muted-foreground">Rationale (optional)</label>
          <Textarea
            value={rationaleValue}
            onChange={(event) => onUpdate({ rationale: event.target.value })}
            placeholder="Why is this change required?"
            className={cn("min-h-[64px] text-sm", compact && "min-h-[58px] text-xs")}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-orbit-base">
        <p className="text-[11px] text-muted-foreground">
          Request will stay editable in review until submitted to the supplier.
        </p>
        <div className="flex items-center gap-orbit-s">
          <Button variant="outline" className={cn("h-8 text-xs", compact && "h-7 text-[11px]")} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className={cn("h-8 gap-orbit-xs bg-[#1a2744] text-xs text-white hover:bg-[#243454]", compact && "h-7 text-[11px]")}
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
  missingClause,
  hideSubclauseReference,
  displayMode = "default",
  primaryActionLabel = "Request Change",
  requestPlaceholder,
  versionLabel,
  extraContent,
  actions,
  pinned,
  onTogglePin,
  onRequest,
  onUseRecommendation,
  onNoAction,
  onEditRequest,
  onChangeNoAction,
  onUndoDecision,
  onUpdateDraft,
  onCancelDraft,
  onSubmitDraft,
  onRemoveRequest,
  onOpenDetail,
  neutralActions = false,
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
  missingClause?: boolean;
  hideSubclauseReference?: boolean;
  displayMode?: "default" | "row-scale";
  primaryActionLabel?: string;
  requestPlaceholder?: string;
  versionLabel: string;
  extraContent?: ReactNode;
  actions?: ReactNode;
  pinned?: boolean;
  onTogglePin?: () => void;
  onRequest?: () => void;
  onUseRecommendation?: () => void;
  onNoAction?: () => void;
  onEditRequest?: () => void;
  onChangeNoAction?: () => void;
  onUndoDecision?: () => void;
  onUpdateDraft?: (patch: { requestedChange?: string; rationale?: string }) => void;
  onCancelDraft?: () => void;
  onSubmitDraft?: () => void;
  onRemoveRequest?: () => void;
  onOpenDetail: () => void;
  neutralActions?: boolean;
}) {
  const [queuedExpanded, setQueuedExpanded] = useState(false);
  const pendingBasketRequest = request?.state === "pending" && Boolean(request.requestedChange?.trim());
  const showQueuedCompact = pendingBasketRequest && !isDrafting;
  const showDecisionBody = !showQueuedCompact || queuedExpanded;
  const requestPreview = request?.requestedChange?.trim() ?? "";
  const settled = decision === "request-update" || decision === "no-action";
  const noActionIsPrimary = !neutralActions && clause.severity === "low";
  const showRequestActions = !settled && !actions && !pendingBasketRequest;
  const useFirstAnalysisDeviationStyle = neutralActions && hideSubclauseReference && clause.severity === "high";
  const severityBadgeLabel = useFirstAnalysisDeviationStyle ? "High Deviation" : clause.severity;
  const severityBadgeClass = useFirstAnalysisDeviationStyle
    ? firstAnalysisDeviationBadgeClass
    : `${severityTone(clause.severity)} shrink-0 rounded-full px-orbit-xs py-orbit-xxs text-[9px] font-medium`;
  const showSeverityBadge = !isPureMissingClause(clause);

  if (displayMode === "row-scale" && !actions) {
    return (
      <ClauseRowScaleCard
        id={id}
        clause={clause}
        description={description}
        actionability={actionability}
        missingClause={missingClause}
        hideSubclauseReference={hideSubclauseReference}
        highlighted={highlighted}
        decision={decision}
        isDrafting={isDrafting}
        versionLabel={versionLabel}
        draft={draft}
        request={request}
        inherited={inherited}
        requestPlaceholder={requestPlaceholder}
        onUpdateDraft={onUpdateDraft}
        onCancelDraft={onCancelDraft}
        onSubmitDraft={onSubmitDraft}
        onUseRecommendation={onUseRecommendation}
        onRequest={onRequest}
        onNoAction={onNoAction}
        onEditRequest={
          decision === "request-update" ? onEditRequest : decision === "no-action" ? onChangeNoAction : onRequest
        }
        onUndoDecision={onUndoDecision}
      />
    );
  }

  return (
    <div
      id={`clause-row-${id}`}
      className={cn(
        "relative rounded-lg border border-border bg-card px-orbit-base py-orbit-base transition-colors",
        decision === "request-update" && "border-l-[3px] border-l-[#185FA5] pl-orbit-s",
        pendingBasketRequest && "border-l-[3px] border-l-[#185FA5] bg-[#E6F1FB]/20 pl-orbit-s",
        highlighted && "ring-2 ring-primary/40 bg-primary/5",
      )}
    >
      <div className="flex min-w-0 items-center gap-orbit-s">
        <span className="w-[22px] shrink-0 tabular-nums text-[9px] font-semibold text-muted-foreground">{id.toUpperCase()}</span>
        {onTogglePin && (
          <button
            type="button"
            aria-label={pinned ? "Unpin clause" : "Pin clause across version switches"}
            title={pinned ? "Unpin clause" : "Pin clause across version switches"}
            onClick={(event) => {
              event.stopPropagation();
              onTogglePin();
            }}
            className={cn("shrink-0 rounded p-orbit-xxs text-muted-foreground/60 hover:bg-muted hover:text-foreground", pinned && "text-primary")}
          >
            <Pin className={cn("h-3.5 w-3.5", pinned && "fill-current")} />
          </button>
        )}
        <h3 className="v5-orbit-heading-label min-w-0 flex-1 truncate text-foreground">{clause.title}</h3>
        <span className="hidden shrink-0 text-[10px] text-muted-foreground md:inline">
          {metaPrefix}{hideSubclauseReference ? clause.category : `${clause.subclause} · ${clause.category}`}
        </span>
        {changePill?.status && <ChangePillBadge result={changePill} />}
        {missingClause && (
          <Badge
            variant="outline"
            className={firstAnalysisDeviationBadgeClass}
          >
            Missing Clause
          </Badge>
        )}
        {showSeverityBadge && (
          <Badge variant="outline" className={severityBadgeClass}>
            {severityBadgeLabel}
          </Badge>
        )}
        {stateBadge}
        {pendingBasketRequest && <RequestLifecycleBadge request={request} />}
        {settled && !pendingBasketRequest && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  {decision === "request-update" ? <RequestLifecycleBadge request={request} /> : <DecisionBadge decision={decision} />}
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
      </div>

      {showQueuedCompact && (
        <div className="mt-orbit-s space-y-orbit-s pl-orbit-l" onClick={(event) => event.stopPropagation()}>
          <div className="flex flex-wrap items-center gap-orbit-s rounded-md border border-[#185FA5]/20 bg-[#E6F1FB]/45 px-orbit-base py-orbit-s">
            <p className="min-w-[180px] flex-1 truncate text-[11px] text-[#0C447C]">
              <span className="font-semibold">Request:</span> {requestPreview}
            </p>
            <div className="flex shrink-0 items-center gap-orbit-xs">
              <Button variant="outline" className="h-7 px-orbit-s text-[10px]" onClick={onEditRequest}>
                Edit request
              </Button>
              {onRemoveRequest && (
                <Button variant="outline" className="h-7 px-orbit-s text-[10px] text-muted-foreground" onClick={onRemoveRequest}>
                  Remove
                </Button>
              )}
              <Button
                variant="ghost"
                className="h-7 gap-orbit-xs px-orbit-s text-[10px] text-primary hover:bg-white/70"
                onClick={() => setQueuedExpanded((current) => !current)}
              >
                {queuedExpanded ? "Hide detail" : "View detail"}
                <ChevronDown className={cn("h-3 w-3 transition-transform", queuedExpanded && "rotate-180")} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDecisionBody && description && (
        <p className="mt-orbit-xs pl-orbit-l text-[11px] leading-5 text-muted-foreground">
          {description}
        </p>
      )}
      {showDecisionBody && actionability && (
        <p className="mt-orbit-xs pl-orbit-l text-[11px] leading-5 text-muted-foreground">
          <Lightbulb className="mr-orbit-xs inline h-3 w-3 text-primary" />
          <span className="font-semibold text-foreground">Actionability:</span> {actionability}
        </p>
      )}
      {showDecisionBody && extraContent && <div className="mt-orbit-s pl-orbit-l">{extraContent}</div>}

      {showRequestActions && (
        <div className="mt-orbit-s flex items-center gap-orbit-xs pl-orbit-l" onClick={(event) => event.stopPropagation()}>
          <Button
            variant="secondary"
            className="h-8 gap-orbit-xs rounded-[5px] px-orbit-base text-[11px] font-normal"
            onClick={onRequest}
          >
            <Sparkles className="h-3 w-3" /> {primaryActionLabel}
          </Button>
          <Button
            variant={noActionIsPrimary ? "default" : "outline"}
            className={cn("h-8 rounded-[5px] px-orbit-base text-[11px] font-normal gap-orbit-xs", noActionIsPrimary && "bg-[#1a2744] text-white hover:bg-[#243454]")}
            onClick={onNoAction}
          >
            <CheckCircle2 className="h-3 w-3" /> No Action
          </Button>
        </div>
      )}

      {actions && !pendingBasketRequest && (
        <div className="mt-orbit-s flex items-center gap-orbit-xs pl-orbit-l" onClick={(event) => event.stopPropagation()}>
          {actions}
        </div>
      )}

      {showQueuedCompact && queuedExpanded && (
        <div className="mt-orbit-s pl-orbit-l" onClick={(event) => event.stopPropagation()}>
          <div className="rounded-md border border-[#185FA5]/20 bg-[#E6F1FB]/55 px-orbit-base py-orbit-s text-[11px] text-[#0C447C]">
            <p className="font-medium">Added to Review.</p>
            <p className="mt-orbit-xxs text-[#0C447C]/80">Review and generate all requests when ready.</p>
          </div>
        </div>
      )}

      {isDrafting && onUpdateDraft && onCancelDraft && onSubmitDraft && (
        <div className="pl-orbit-l">
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

function ClauseRowScaleCard({
  id,
  clause,
  description,
  actionability,
  missingClause,
  hideSubclauseReference,
  highlighted,
  decision,
  isDrafting,
  versionLabel,
  draft,
  request,
  inherited,
  requestPlaceholder,
  onUpdateDraft,
  onCancelDraft,
  onSubmitDraft,
  onUseRecommendation,
  onRequest,
  onNoAction,
  onEditRequest,
  onUndoDecision,
}: {
  id: string;
  clause: ClauseResult;
  description?: string;
  actionability?: string;
  missingClause?: boolean;
  hideSubclauseReference?: boolean;
  highlighted?: boolean;
  decision?: RoundDecision;
  isDrafting?: boolean;
  versionLabel: string;
  draft?: ClauseRequest;
  request?: ClauseRequest;
  inherited?: { request: ClauseRequest; version: string };
  requestPlaceholder?: string;
  onUpdateDraft?: (patch: { requestedChange?: string; rationale?: string }) => void;
  onCancelDraft?: () => void;
  onSubmitDraft?: () => void;
  onUseRecommendation?: () => void;
  onRequest?: () => void;
  onNoAction?: () => void;
  onEditRequest?: () => void;
  onUndoDecision?: () => void;
}) {
  const tier = clause.severity;
  const theme = rowScaleSeverityThemes[tier];
  const cardBackground = missingClause ? rowScaleMissingClauseBackground : theme.background;
  const accentColor = missingClause ? "#A32D2D" : theme.accent;
  const severityLabel = hideSubclauseReference ? `${titleCaseSeverity(tier)} Deviation` : titleCaseSeverity(tier);
  const showSeverityBadge = !isPureMissingClause(clause);
  const metadata = hideSubclauseReference ? clause.category : `${clause.subclause} · ${clause.category}`;
  const actionabilityText = actionability?.trim() ?? "";
  const requestText = request?.requestedChange?.trim() ?? "";
  const hasRequest = decision === "request-update" && Boolean(requestText);
  const handledState = !isDrafting && (hasRequest || decision === "no-action")
    ? hasRequest
      ? "request"
      : "no-action"
    : null;
  const acceptedRecommendation = hasRequest && actionabilityText === requestText;
  const requestForm =
    isDrafting && onUpdateDraft && onCancelDraft && onSubmitDraft ? (
      <ClauseRequestForm
        versionLabel={versionLabel}
        draft={draft}
        request={request}
        inherited={inherited}
        requestPlaceholder={requestPlaceholder}
        compact
        onUpdate={onUpdateDraft}
        onCancel={onCancelDraft}
        onSubmit={onSubmitDraft}
      />
    ) : null;

  const runAction = (event: MouseEvent<HTMLButtonElement>, action?: () => void) => {
    event.stopPropagation();
    action?.();
  };

  if (handledState) {
    const requestSubmitted = request?.state === "submitted";
    const statusLabel =
      handledState === "request"
        ? requestSubmitted
          ? "Reviewed"
          : acceptedRecommendation
          ? "Added to Review"
          : "Custom request added"
        : "No action selected";
    const preview =
      handledState === "request"
        ? requestText
        : "No supplier change will be requested for this clause.";

    return (
      <ClauseReviewModalCard
        domId={`clause-row-${id}`}
        itemId={id}
        title={clause.title}
        category={metadata}
        severity={tier}
        missingClause={clause.missingClause}
        sourceDeviationLevel={clause.sourceDeviationLevel}
        request={{ requestedChange: preview }}
        statusLabel={statusLabel}
        statusTone={requestSubmitted ? "green" : handledState === "request" ? "blue" : "neutral"}
        highlighted={highlighted}
        editMode="external"
        onEditRequest={onEditRequest}
        onRemove={onUndoDecision ?? (() => undefined)}
        secondaryActionLabel="Undo"
        secondaryActionIcon={null}
        secondaryActionTone="neutral"
      />
    );
  }

  return (
    <div
      id={`clause-row-${id}`}
      className={cn(
        "relative min-h-[104px] overflow-hidden rounded-lg border border-border bg-card px-orbit-base py-orbit-base pl-orbit-m transition-colors",
        highlighted && "ring-2 ring-primary/40",
      )}
      style={{ backgroundColor: cardBackground }}
    >
      <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: accentColor }} />
      <div className="flex flex-col gap-orbit-s">
        <div className="flex flex-wrap items-center justify-between gap-orbit-s">
          <div className="flex flex-wrap items-center gap-orbit-s">
            {missingClause && (
              <Badge variant="outline" className={firstAnalysisDeviationBadgeClass}>
                Missing Clause
              </Badge>
            )}
            {showSeverityBadge && (
              <Badge variant="outline" className={theme.badgeClass}>
                {severityLabel}
              </Badge>
            )}
            {isDrafting && (
              <Badge variant="outline" className="rounded-full border-[#185FA5]/25 bg-[#E6F1FB] px-orbit-xs py-orbit-xxs text-[9px] font-medium text-[#0C447C]">
                Drafting request
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {id.toUpperCase()} · {metadata}
          </p>
        </div>
        <h3 className="v5-orbit-heading-label text-foreground">{clause.title}</h3>
      </div>
      {description && <FindingCallout text={description} />}
      {actionability && <RecommendedActionCallout text={actionability} compactTop={Boolean(description)} />}
      {requestForm ?? (
        <div className="mt-orbit-base flex flex-wrap items-center gap-orbit-s" onClick={(event) => event.stopPropagation()}>
          <Button
            variant="outline"
            disabled={!actionabilityText || !onUseRecommendation}
            onClick={(event) => runAction(event, onUseRecommendation)}
          >
            <Sparkles className="h-3 w-3" /> Use Recommendation
          </Button>
          <Button
            variant="outline"
            onClick={(event) => runAction(event, onRequest)}
          >
            <Pencil className="h-3 w-3" /> Edit Request
          </Button>
          <Button
            variant="outline"
            onClick={(event) => runAction(event, onNoAction)}
          >
            <CheckCircle2 className="h-3 w-3" /> No Action
          </Button>
        </div>
      )}
    </div>
  );
}

const rowScaleSeverityThemes: Record<
  ClauseResult["severity"],
  {
    accent: string;
    background: string;
    badgeClass: string;
  }
> = {
  high: {
    accent: "#A32D2D",
    background: "#FFF6F4",
    badgeClass: firstAnalysisDeviationBadgeClass,
  },
  medium: {
    accent: "#BA7517",
    background: "#FFF9EC",
    badgeClass: "shrink-0 rounded-full border-[#F1D29B] bg-[#FFF8E8] px-orbit-xs py-orbit-xxs text-[9px] font-medium text-[#854F0B]",
  },
  low: {
    accent: "#3B6D11",
    background: "#F4FAEE",
    badgeClass: "shrink-0 rounded-full border-[#BFD6AB] bg-[#EAF3DE] px-orbit-xs py-orbit-xxs text-[9px] font-medium text-[#27500A]",
  },
};

const rowScaleMissingClauseBackground = "#FFF6F4";

function FindingCallout({ text }: { text: string }) {
  return (
    <div className="mt-orbit-base rounded-md border border-border bg-white px-orbit-base py-orbit-s">
      <div className="flex items-start gap-orbit-s">
        <span className="mt-orbit-xxs grid h-5 w-5 shrink-0 place-items-center rounded-full border border-border bg-background text-muted-foreground">
          <Search className="h-3 w-3" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Finding
          </p>
          <p className="mt-orbit-xxs text-[12px] font-medium leading-5 text-foreground/85">
            {renderFindingText(text)}
          </p>
        </div>
      </div>
    </div>
  );
}

function RecommendedActionCallout({ text, compactTop = false }: { text: string; compactTop?: boolean }) {
  return (
    <div className={cn(compactTop ? "mt-orbit-s" : "mt-orbit-base", "rounded-md border border-border bg-white px-orbit-base py-orbit-s")}>
      <div className="flex items-start gap-orbit-s">
        <span className="mt-orbit-xxs grid h-5 w-5 shrink-0 place-items-center rounded-full border border-border bg-background text-muted-foreground">
          <Lightbulb className="h-3 w-3" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Recommended action
          </p>
          <p className="mt-orbit-xxs text-[12px] font-medium leading-5 text-foreground">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

function renderFindingText(text: string) {
  const parts = text.split(/(\b\d+(?:\.\d+)?%?(?:[-\s]?(?:day|days|month|months|year|years|hour|hours|fee|fees))?|\bvs\b|\bbenchmark\b)/gi);
  return parts.map((part, index) => {
    if (!part) return null;
    const prominent = /^(\d+(?:\.\d+)?%?(?:[-\s]?(?:day|days|month|months|year|years|hour|hours|fee|fees))?|vs|benchmark)$/i.test(part);
    return prominent ? (
      <span key={`${part}-${index}`} className="font-semibold text-foreground">
        {part}
      </span>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    );
  });
}

function titleCaseSeverity(severity: ClauseResult["severity"]) {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

interface BasketRequestItem {
  clauseId: string;
  clauseTitle: string;
  category?: string;
  severity?: ClauseResult["severity"];
  missingClause?: boolean;
  sourceDeviationLevel?: ClauseResult["sourceDeviationLevel"];
  request: ClauseRequest;
}

function versionClauseIndex(version: ContractVersion, clauseId: string) {
  const index = version.clauses.findIndex((clause) => clause.id === clauseId);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function buildBasketRequestItem(
  clauseId: string,
  request: ClauseRequest,
  version: ContractVersion,
  fallbackVersion?: ContractVersion | null,
): BasketRequestItem {
  const clause =
    version.clauses.find((candidate) => candidate.id === clauseId) ??
    fallbackVersion?.clauses.find((candidate) => candidate.id === clauseId);
  const def = CLAUSE_FRAMEWORK.find((candidate) => candidate.id === clauseId);

  return {
    clauseId,
    clauseTitle: clause?.title ?? def?.title ?? clauseId.toUpperCase(),
    category: clause?.category,
    severity: clause?.severity,
    missingClause: clause?.missingClause,
    sourceDeviationLevel: clause?.sourceDeviationLevel,
    request,
  };
}

function buildReviewDecisionSignature(
  version: ContractVersion,
  decisionsByClause: Record<string, ClauseDecisionState>,
) {
  return version.clauses
    .map((clause) => {
      const state = decisionsByClause[clause.id];
      const decision = state?.roundDecisions?.[version.version] ?? "";
      const request = state?.requests?.[version.version];
      const requestedChange = request?.requestedChange?.trim() ?? "";
      const rationale = request?.rationale?.trim() ?? "";
      if (!decision && !requestedChange && !rationale) return null;
      return [clause.id, decision, requestedChange, rationale].map((part) => part.replace(/\|/g, "\\|")).join("|");
    })
    .filter((item): item is string => Boolean(item))
    .join("\n");
}

interface RecommendationTargetItem {
  id: string;
  clauseTitle: string;
  category: string;
  severity: ClauseResult["severity"];
  missingClause?: boolean;
  sourceDeviationLevel?: ClauseResult["sourceDeviationLevel"];
  request: ClauseRequest;
}

type RecommendationApplyScope = "all" | "high" | "medium" | "low" | "missing";

interface RecommendationApplyOption {
  id: RecommendationApplyScope;
  label: string;
  toastLabel: string;
  undoLabel: string;
  count: number;
  targets: RecommendationTargetItem[];
}

function buildRecommendationApplyOptions(targets: RecommendationTargetItem[]): RecommendationApplyOption[] {
  const byScope = (scope: RecommendationApplyScope) => targets.filter((target) => targetMatchesRecommendationScope(target, scope));

  return [
    {
      id: "all",
      label: "Apply all recommendations",
      toastLabel: "recommendation",
      undoLabel: "all",
      count: targets.length,
      targets,
    },
    {
      id: "high",
      label: "Apply High only",
      toastLabel: "High recommendation",
      undoLabel: "High",
      count: byScope("high").length,
      targets: byScope("high"),
    },
    {
      id: "medium",
      label: "Apply Medium only",
      toastLabel: "Medium recommendation",
      undoLabel: "Medium",
      count: byScope("medium").length,
      targets: byScope("medium"),
    },
    {
      id: "low",
      label: "Apply Low only",
      toastLabel: "Low recommendation",
      undoLabel: "Low",
      count: byScope("low").length,
      targets: byScope("low"),
    },
    {
      id: "missing",
      label: "Apply Missing clauses only",
      toastLabel: "Missing clause recommendation",
      undoLabel: "Missing clause",
      count: byScope("missing").length,
      targets: byScope("missing"),
    },
  ];
}

function targetMatchesRecommendationScope(target: RecommendationTargetItem, scope: RecommendationApplyScope) {
  if (scope === "all") return true;
  if (scope === "missing") return Boolean(target.missingClause && target.sourceDeviationLevel === "None");

  const sourceDeviationLevel = target.sourceDeviationLevel?.toLowerCase();
  return sourceDeviationLevel === scope || (!sourceDeviationLevel && target.severity === scope);
}

function reviewClauseCardTone(severity?: ClauseResult["severity"]) {
  if (severity === "high") return "border-l-[#E5484D] bg-[#FFF7F7]";
  if (severity === "medium") return "border-l-[#F59E0B] bg-[#FFFBEB]";
  if (severity === "low") return "border-l-[#1BA97F] bg-[#F8FCFA]";
  return "border-l-border bg-white";
}

function ClauseReviewModalCard({
  domId,
  itemId,
  title,
  category,
  severity,
  missingClause,
  sourceDeviationLevel,
  request,
  statusLabel,
  statusTone = "blue",
  highlighted,
  editMode = "inline",
  onEditRequest,
  onUpdate,
  onRemove,
  secondaryActionLabel = "Remove",
  secondaryActionIcon,
  secondaryActionTone = "danger",
}: {
  domId?: string;
  itemId: string;
  title: string;
  category?: string;
  severity?: ClauseResult["severity"];
  missingClause?: boolean;
  sourceDeviationLevel?: ClauseResult["sourceDeviationLevel"];
  request: ClauseRequest;
  statusLabel: string;
  statusTone?: "blue" | "green" | "neutral";
  highlighted?: boolean;
  editMode?: "inline" | "external";
  onEditRequest?: () => void;
  onUpdate?: (request: ClauseRequest) => void;
  onRemove: () => void;
  secondaryActionLabel?: string;
  secondaryActionIcon?: ReactNode;
  secondaryActionTone?: "danger" | "neutral";
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ClauseRequest>(request);
  const pureMissing = Boolean(missingClause && sourceDeviationLevel === "None");

  useEffect(() => {
    if (!editing) setDraft(request);
  }, [editing, request]);

  const canSave = Boolean(draft.requestedChange?.trim());
  const saveDraft = () => {
    if (!canSave || !onUpdate) return;
    onUpdate({
      requestedChange: draft.requestedChange?.trim(),
      rationale: draft.rationale?.trim() || undefined,
    });
    setEditing(false);
  };

  return (
    <div
      id={domId}
      className={cn(
        "rounded-lg border border-l-4 px-orbit-base py-orbit-base shadow-sm",
        reviewClauseCardTone(pureMissing ? "high" : severity),
        highlighted && "ring-2 ring-primary/40",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-orbit-s">
        <div className="flex flex-wrap items-center gap-orbit-xs">
          {pureMissing && (
            <Badge variant="outline" className={firstAnalysisDeviationBadgeClass}>
              Missing Clause
            </Badge>
          )}
          {severity && !pureMissing && (
            <Badge
              variant="outline"
              className={cn("h-5 rounded-full px-orbit-s text-[9px] font-medium", severityTone(severity))}
            >
              {titleCaseSeverity(severity)} Deviation
            </Badge>
          )}
          <Badge
            variant="outline"
            className={cn(
              "h-5 rounded-full px-orbit-s text-[9px] font-medium",
              statusTone === "blue" && "border-[#185FA5]/20 bg-[#E6F1FB]/60 text-[#0C447C]",
              statusTone === "green" && "border-[#BFD6AB] bg-[#EAF3DE] text-[#27500A]",
              statusTone === "neutral" && "border-border bg-white text-muted-foreground",
            )}
          >
            {statusLabel}
          </Badge>
        </div>
        <p className="shrink-0 text-[10px] text-muted-foreground">
          {itemId.toUpperCase()}{category ? ` · ${category}` : ""}
        </p>
      </div>

      <div className="mt-orbit-s min-w-0">
        <p className="truncate text-[13px] font-semibold text-foreground">{title}</p>
        <p className="mt-orbit-xxs line-clamp-2 text-[11px] leading-4 text-muted-foreground">
          {request.requestedChange || "No requested change entered yet."}
        </p>
        {request.rationale && (
          <p className="mt-orbit-xs line-clamp-2 text-[11px] leading-4 text-muted-foreground">
            <span className="font-medium text-foreground">Rationale:</span> {request.rationale}
          </p>
        )}
      </div>

      <div className="mt-orbit-base flex flex-wrap items-center gap-orbit-s" onClick={(event) => event.stopPropagation()}>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (editMode === "external") {
              onEditRequest?.();
              return;
            }
            setEditing((current) => !current);
          }}
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit Request
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onRemove}
        >
          {secondaryActionIcon === undefined ? <Trash2 className="h-3.5 w-3.5" /> : secondaryActionIcon}
          {secondaryActionLabel}
        </Button>
      </div>

      {editing && editMode === "inline" && (
        <div className="mt-orbit-base rounded-lg border border-border bg-white/85 p-orbit-base" onClick={(event) => event.stopPropagation()}>
          <div className="grid gap-orbit-base">
            <label className="grid gap-orbit-xs text-xs font-medium text-foreground">
              Requested change
              <Textarea
                value={draft.requestedChange ?? ""}
                onChange={(event) => setDraft((current) => ({ ...current, requestedChange: event.target.value }))}
                className="min-h-[72px] resize-none bg-white text-xs font-normal leading-5"
              />
            </label>
            <label className="grid gap-orbit-xs text-xs font-medium text-foreground">
              Rationale
              <Textarea
                value={draft.rationale ?? ""}
                onChange={(event) => setDraft((current) => ({ ...current, rationale: event.target.value }))}
                placeholder="Add why this change is needed before supplier negotiation."
                className="min-h-[64px] resize-none bg-white text-xs font-normal leading-5"
              />
            </label>
          </div>
          <div className="mt-orbit-base flex justify-end gap-orbit-s">
            <Button type="button" variant="outline" className="h-8" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="h-8 bg-[#1a2744] text-white hover:bg-[#243454]"
              disabled={!canSave}
              onClick={saveDraft}
            >
              Save changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function requestCsvEscape(value: string | number | undefined | null) {
  if (value === undefined || value === null) return "";
  const text = String(value).replace(/"/g, '""');
  return /[",\n]/.test(text) ? `"${text}"` : text;
}

function requestSeverityLabel(clause?: ClauseResult) {
  if (!clause) return "";
  if (isPureMissingClause(clause)) return "Missing Clause";
  return clause.sourceDeviationLevel && clause.sourceDeviationLevel !== "None"
    ? clause.sourceDeviationLevel
    : titleCaseSeverity(clause.severity);
}

function exportRequestChangeCsv(
  meta: {
    initiativeName: string;
    supplierName: string;
    contractName: string;
    versionLabel: string;
  },
  version: ContractVersion,
  requests: BasketRequestItem[],
) {
  const exportedAt = new Date().toISOString();
  const rows = [
    [
      "Initiative",
      "Supplier",
      "Contract",
      "Analysis version",
      "Exported at",
      "Clause ID",
      "Clause",
      "Category",
      "Severity",
      "Clause summary",
      "Requested change",
      "Rationale",
    ],
  ];

  for (const item of requests) {
    const clause = version.clauses.find((candidate) => candidate.id === item.clauseId);
    rows.push([
      meta.initiativeName,
      meta.supplierName,
      meta.contractName,
      meta.versionLabel,
      exportedAt,
      item.clauseId.toUpperCase(),
      item.clauseTitle,
      clause?.category ?? "",
      requestSeverityLabel(clause),
      clause?.deviation ?? "",
      item.request.requestedChange ?? "",
      item.request.rationale ?? "",
    ]);
  }

  return rows.map((row) => row.map(requestCsvEscape).join(",")).join("\n");
}

function RequestReviewDialog({
  open,
  onOpenChange,
  requests,
  supplierName,
  bulkSummaryMode = false,
  reviewProgress,
  csvNeedsUpdate = false,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requests: BasketRequestItem[];
  supplierName: string;
  bulkSummaryMode?: boolean;
  reviewProgress?: FirstAnalysisReviewProgress;
  csvNeedsUpdate?: boolean;
  onSubmit: () => void;
}) {
  const requestCount = requests.length;
  const canGenerate = requestCount > 0 || csvNeedsUpdate;

  useEffect(() => {
    if (!canGenerate && open) onOpenChange(false);
  }, [canGenerate, onOpenChange, open]);

  const submitRequests = () => {
    if (!canGenerate) return;
    onSubmit();
    onOpenChange(false);
  };
  const csvAlertDescription = `The CSV will include clause IDs, titles, categories, severity, ClauseIQ findings, requested changes, and rationale so you can take it back to the supplier for negotiation. Are you ready to generate it?${
    csvNeedsUpdate
      ? " Changes have been made since the last generated CSV. Generate again to update the negotiation log."
      : ""
  }`;

  return (
    <V5OrbitOverlay
      open={open}
      onOpenChange={onOpenChange}
      title={bulkSummaryMode ? "Generate CSV from applied recommendations" : "Review and generate selected clauses"}
      description={
        bulkSummaryMode
          ? undefined
          : `Check the clauses you have chosen, then submit to generate a CSV negotiation log for ${supplierName}.`
      }
      size="Large"
      footer={
        <div className="flex flex-col gap-orbit-base sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Confirm to generate the CSV. Nothing is sent to the supplier from this prototype.
          </p>
          {canGenerate && (
            <Button
              className="gap-orbit-xs"
              onClick={submitRequests}
            >
              <Download className="h-3.5 w-3.5" /> Submit & Generate
            </Button>
          )}
        </div>
      }
    >
          <div className="px-orbit-base pt-orbit-base">
            <Alert
              type="Information"
              title={bulkSummaryMode ? "Ready to generate supplier change log" : "Ready to generate selected clauses"}
              description={csvAlertDescription}
            />
          </div>

          {reviewProgress && (
            <div className="px-orbit-base pb-orbit-base pt-orbit-s">
              <ReviewGenerateProgressDashboard progress={reviewProgress} />
            </div>
          )}
      </V5OrbitOverlay>
  );
}

function ReviewGenerateProgressDashboard({ progress }: { progress: FirstAnalysisReviewProgress }) {
  const reviewed = Math.max(0, progress.total - progress.unreviewed);
  const percentage = progress.total > 0 ? Math.round((reviewed / progress.total) * 100) : 0;

  return (
    <section className="rounded-lg border border-border bg-white p-orbit-base">
      <div className="flex items-start justify-between gap-orbit-base">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Summary
          </p>
          <p className="mt-orbit-xs text-xs leading-5 text-muted-foreground">
            Check what has been accepted, marked no action, and what is still left unreviewed before generating the CSV.
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-border bg-muted/40 px-orbit-s py-orbit-xxs text-[10px] font-medium text-foreground">
          {percentage}%
        </span>
      </div>

      <div className="mt-orbit-base h-2 overflow-hidden rounded-full bg-muted">
        <span className="block h-full rounded-full bg-[#1a2744]" style={{ width: `${percentage}%` }} />
      </div>

      <div className="mt-orbit-base grid gap-orbit-s sm:grid-cols-4">
        <ReviewGenerateMetric label="Used recommendations" value={progress.usedRecommendations} />
        <ReviewGenerateMetric label="No action" value={progress.noAction} />
        <ReviewGenerateMetric label="Left unreviewed" value={progress.unreviewed} muted />
        <ReviewGenerateMetric label="Ready for CSV" value={progress.readyForCsv} />
      </div>

      <div className="mt-orbit-base grid gap-orbit-s sm:grid-cols-2">
        {progress.breakdown.map((item) => {
          const itemReviewed = item.reviewed;
          const itemPercentage = item.total > 0 ? Math.round((itemReviewed / item.total) * 100) : 0;
          return (
            <div key={item.label} className="rounded-md border border-border bg-muted/20 px-orbit-s py-orbit-s">
              <div className="flex items-center justify-between gap-orbit-s">
                <span className="text-[10px] font-medium text-muted-foreground">{item.label}</span>
                <span className="text-[10px] text-muted-foreground">
                  {item.unreviewed} left
                </span>
              </div>
              <div className="mt-orbit-s h-1.5 overflow-hidden rounded-full bg-muted">
                <span className="block h-full rounded-full bg-[#1a2744]/80" style={{ width: `${itemPercentage}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {progress.submitted > 0 && (
        <p className="mt-orbit-base text-[11px] text-muted-foreground">
          {progress.submitted} clause{progress.submitted === 1 ? "" : "s"} already generated in a previous CSV.
        </p>
      )}
    </section>
  );
}

function ReviewGenerateMetric({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: number;
  muted?: boolean;
}) {
  return (
    <div className={cn("rounded-md border border-border bg-[#F7FAFC] px-orbit-s py-orbit-s", muted && "bg-muted/25")}>
      <p className="text-lg font-semibold leading-none text-foreground">{value}</p>
      <p className="mt-orbit-xs text-[9px] font-medium uppercase tracking-[0.04em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function ReviewScreen({
  version,
  stateOf,
  activeCategories,
  search,
  quickSeverityFilter,
  quickSeverityFilters,
  quickReviewFilter,
  missingClauseIds,
  quickMissingClauseIds,
  neutralActions = false,
  hideSubclauseReference = false,
  displayMode = "default",
  onSetNoAction,
  onStartDraft,
  onUseRecommendation,
  onUndoDecision,
  onUpdateDraft,
  onCancelDraft,
  onSubmitDraft,
  onOpenDetail,
  highlightedId,
}: {
  version: ContractVersion;
  stateOf: (id: string) => ClauseDecisionState;
  activeCategories: string[];
  search: string;
  quickSeverityFilter?: "high" | "medium" | "low" | null;
  quickSeverityFilters?: Set<"high" | "medium" | "low"> | null;
  quickReviewFilter?: "need-review" | null;
  missingClauseIds?: Set<string> | null;
  quickMissingClauseIds?: Set<string> | null;
  neutralActions?: boolean;
  hideSubclauseReference?: boolean;
  displayMode?: "default" | "row-scale";
  onSetNoAction: (id: string) => void;
  onStartDraft: (id: string, initialDraft?: { requestedChange?: string; rationale?: string }) => void;
  onUseRecommendation: (id: string, request: { requestedChange?: string; rationale?: string }) => void;
  onUndoDecision: (id: string) => void;
  onUpdateDraft: (id: string, patch: { requestedChange?: string; rationale?: string }) => void;
  onCancelDraft: (id: string) => void;
  onSubmitDraft: (id: string) => void;
  onOpenDetail: (id: string) => void;
  highlightedId?: string | null;
}) {
  const [pendingDraftCancelId, setPendingDraftCancelId] = useState<string | null>(null);
  const q = search.trim().toLowerCase();
  const versionLabel = version.version;
  const activeCategorySet = new Set(activeCategories);
  const rows = version.clauses
    .map((clause, index) => ({ clause, index }))
    .filter(({ clause: c }) => {
      if (activeCategorySet.size > 0 && !activeCategorySet.has(c.category)) return false;
      if (quickMissingClauseIds && !quickMissingClauseIds.has(c.id)) return false;
      if (
        quickSeverityFilters &&
        quickSeverityFilters.size > 0 &&
        (!countsTowardDeviationMetric(c) || !quickSeverityFilters.has(c.severity))
      ) return false;
      if (
        !quickSeverityFilters &&
        quickSeverityFilter &&
        (c.severity !== quickSeverityFilter || c.resolved || !countsTowardDeviationMetric(c))
      ) return false;
      if (q && !c.title.toLowerCase().includes(q) && !c.category.toLowerCase().includes(q) && !c.id.includes(q)) return false;
      if (quickReviewFilter === "need-review") {
        if (!quickMissingClauseIds && c.resolved) return false;
        if (displayMode !== "row-scale") {
          const state = stateOf(c.id);
          const decision = state.roundDecisions[versionLabel];
          const request = state.requests[versionLabel];
          if (decision === "no-action" || decision === "request-update" || request?.requestedChange?.trim()) {
            return false;
          }
        }
      }
      return true;
    })
    .sort((a, b) => severityRank(b.clause.severity) - severityRank(a.clause.severity) || a.index - b.index)
    .map(({ clause }) => clause);
  return (
    <div className="space-y-orbit-base">
      {rows.map((c) => {
        const state = stateOf(c.id);
        const decision = state.roundDecisions[versionLabel];
        const own = state.requests[versionLabel] ?? {};
        const draft = state.draftRequests?.[versionLabel];
        const isDrafting = Boolean(draft);
        const inherited = getLatestRequest(state, versionLabel);
        const inheritedFromOlder = inherited && inherited.version !== versionLabel ? inherited : undefined;
        const draftHasText = Boolean(draft?.requestedChange?.trim() || draft?.rationale?.trim());
        const actionabilityDraft = c.actionability?.trim()
          ? { ...own, requestedChange: own.requestedChange?.trim() || c.actionability.trim() }
          : own;
        const cancelDraft = () => {
          if (draftHasText) {
            setPendingDraftCancelId(c.id);
            return;
          }
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
            missingClause={Boolean(missingClauseIds?.has(c.id))}
            hideSubclauseReference={hideSubclauseReference}
            displayMode={displayMode}
            onUseRecommendation={() => onUseRecommendation(c.id, actionabilityDraft)}
            onRequest={() => onStartDraft(c.id, actionabilityDraft)}
            onNoAction={() => onSetNoAction(c.id)}
            onEditRequest={() => onStartDraft(c.id, own)}
            onChangeNoAction={() => onStartDraft(c.id, actionabilityDraft)}
            onUndoDecision={() => onUndoDecision(c.id)}
            onUpdateDraft={(patch) => onUpdateDraft(c.id, patch)}
            onCancelDraft={cancelDraft}
            onSubmitDraft={() => onSubmitDraft(c.id)}
            onOpenDetail={() => onOpenDetail(c.id)}
            neutralActions={neutralActions}
          />
        );
      })}
      {rows.length === 0 && (
        <div className="bg-card border border-border rounded-lg p-orbit-xxl text-center text-sm text-muted-foreground">
          No clauses match this category.
        </div>
      )}
      <V5OrbitConfirmOverlay
        open={Boolean(pendingDraftCancelId)}
        onOpenChange={(open) => {
          if (!open) setPendingDraftCancelId(null);
        }}
        title="Discard draft request?"
        description="This will remove the request text you have drafted for this clause."
        confirmLabel="Discard draft"
        destructive
        onConfirm={() => {
          if (pendingDraftCancelId) onCancelDraft(pendingDraftCancelId);
          setPendingDraftCancelId(null);
        }}
      />
    </div>
  );
}

// (RequestList tab removed — request editing now lives inline in ReviewScreen.)

// ---- Comparison sections ----------------------------------------------------

function ComparisonSection({
  title, description, accent, rows, leftLabel, rightLabel, visible, bucket, stats,
  closureOf, requestOf, basketRequestOf, onClose, onKeepOpen, onFollowUp, onRemoveRequest, onOpenDetail,
  pinnedIds, onTogglePin, recentlyClosed, onUndoClose, draftOf,
  onUpdateText, onCancelDraft, onSubmitDraft, layout = "collapsible",
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
  basketRequestOf?: (id: string) => ClauseRequest | undefined;
  draftOf?: (id: string) => { requestedChange?: string; rationale?: string };
  onClose: (id: string) => void;
  onKeepOpen: (id: string) => void;
  onFollowUp?: (id: string) => void;
  onRemoveRequest?: (id: string) => void;
  onOpenDetail: (id: string) => void;
  pinnedIds?: Set<string>;
  onTogglePin?: (id: string) => void;
  recentlyClosed?: Record<string, number>;
  onUndoClose?: (id: string) => void;
  onUpdateText?: (id: string, patch: { requestedChange?: string; rationale?: string }) => void;
  onCancelDraft?: (id: string) => void;
  onSubmitDraft?: (id: string) => void;
  layout?: "collapsible" | "plain";
}) {
  const [open, setOpen] = useState(false);
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [pendingDraftCancelId, setPendingDraftCancelId] = useState<string | null>(null);
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
  const displayedStats = layout === "plain" ? visibleStats : stats;
  const bucketSummary = [
    displayedStats.pendingReview > 0 ? `${displayedStats.pendingReview} need review` : null,
    displayedStats.actioned > 0 ? `${displayedStats.actioned} actioned` : null,
    rows.length !== displayedStats.total ? `${visibleStats.visible} shown` : null,
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

  const rowsContent = rows.length === 0 ? (
    <div className="border-t border-border p-orbit-m text-center text-xs text-muted-foreground">{emptyMsg}</div>
  ) : (
    <div className="space-y-orbit-s border-t border-border p-orbit-base">
      {sortedRows.map((r) => {
        const display = r.curr ?? r.prev!;
        const req = requestOf(r.id);
        const basketRequest = basketRequestOf?.(r.id) ?? req;
        const closure = closureOf(r.id);
        const isPinned = pinnedIds?.has(r.id) ?? false;
        const undoExpiresAt = recentlyClosed?.[r.id];
        const showRowUndo = !!undoExpiresAt && undoExpiresAt > Date.now();
        const requested = bucket === "new" && (r.actionState === "requested" || r.actionState === "submitted_request");
        const pendingBasketRequest = basketRequest?.state === "pending" && Boolean(basketRequest.requestedChange?.trim());
        const noAction = bucket === "new" && r.actionState === "no_action";
        const supportsInlineRequest = Boolean(draftOf && onUpdateText && onCancelDraft && onSubmitDraft);
        const drafting =
          supportsInlineRequest &&
          (r.actionState === "drafting" || expandedRequestId === r.id);
        const draft = draftOf?.(r.id) ?? {};
        const cancelDraft = () => {
          if (draft.requestedChange?.trim() || draft.rationale?.trim()) {
            setPendingDraftCancelId(r.id);
            return;
          }
          onCancelDraft?.(r.id);
          setExpandedRequestId(null);
        };
        const comparisonDetails = (
          <div className="grid gap-orbit-s text-[11px] md:grid-cols-2">
            {bucket !== "new" && (
              <div className="rounded-md border-l-2 border-primary bg-primary/5 px-orbit-s py-orbit-s md:col-span-2">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-primary">
                  Requested{req.fromVersion ? ` · from ${req.fromVersion}` : ""}
                </p>
                <p className="mt-orbit-xs leading-snug text-foreground">{req.requestedChange ?? "No request captured"}</p>
                {req.rationale && <p className="mt-orbit-xs italic leading-snug text-muted-foreground">{req.rationale}</p>}
              </div>
            )}
            <div className={cn("rounded-md bg-[#f8f7f5] px-orbit-s py-orbit-s", bucket === "new" && "md:col-span-1")}>
              <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{leftLabel}</p>
              <p className="mt-orbit-xs leading-snug text-muted-foreground">{r.prev?.deviation ?? "Clause did not exist."}</p>
            </div>
            <div className="rounded-md bg-[#E6F1FB]/45 px-orbit-s py-orbit-s">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-[#185FA5]">{rightLabel}</p>
              <p className="mt-orbit-xs leading-snug text-foreground">{r.curr?.deviation ?? "Clause no longer present."}</p>
            </div>
          </div>
        );
        const rowActions =
          bucket === "new" ? undefined :
            bucket === "closed" ? (
              <Button variant="outline" className="h-8 text-[11px]" onClick={() => onKeepOpen(r.id)}>
                Reopen
              </Button>
            ) : (
              <>
                <Button
                  variant={closure === "closed" ? "default" : "outline"}
                  className="h-8 text-[11px]"
                  onClick={() => onClose(r.id)}
                >
                  {classifyChange(r.prev, r.curr) === "material" ? "Close" : "Close anyway"}
                </Button>
                <Button
                  variant={closure === "follow-up" ? "secondary" : "outline"}
                  className="h-8 text-[11px]"
                  onClick={() => {
                    onFollowUp?.(r.id);
                    if (supportsInlineRequest) setExpandedRequestId(r.id);
                  }}
                >
                  Follow-up
                </Button>
                <Button
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
            request={basketRequest}
            draft={draft}
            isDrafting={drafting}
            changePill={r.pill}
            metaPrefix={r.pill.status === "new" ? <span className="mr-orbit-xs text-[#0C447C]">+</span> : null}
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
                    className="mt-orbit-s inline-flex items-center gap-orbit-xs text-[11px] text-primary hover:underline"
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
            requestPlaceholder={
              bucket === "open"
                ? "Describe the follow-up action you want from the supplier"
                : "Describe the update you want from the supplier"
            }
            onRequest={() => {
              onKeepOpen(r.id);
              setExpandedRequestId(r.id);
            }}
            onNoAction={() => onClose(r.id)}
            onEditRequest={() => {
              if (!pendingBasketRequest) onKeepOpen(r.id);
              setExpandedRequestId(r.id);
            }}
            onChangeNoAction={() => {
              if (!pendingBasketRequest) onKeepOpen(r.id);
              setExpandedRequestId(r.id);
            }}
            onUpdateDraft={onUpdateText ? (patch) => onUpdateText(r.id, patch) : undefined}
            onCancelDraft={cancelDraft}
            onSubmitDraft={onSubmitDraft ? () => {
              onSubmitDraft(r.id);
              setExpandedRequestId(null);
            } : undefined}
            onRemoveRequest={onRemoveRequest ? () => onRemoveRequest(r.id) : undefined}
            onOpenDetail={() => onOpenDetail(r.id)}
          />
        );
      })}
    </div>
  );

  const confirmOverlay = (
    <V5OrbitConfirmOverlay
      open={Boolean(pendingDraftCancelId)}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setPendingDraftCancelId(null);
      }}
      title="Discard draft request?"
      description="This will remove the request text you have drafted for this clause."
      confirmLabel="Discard draft"
      destructive
      onConfirm={() => {
        if (pendingDraftCancelId) onCancelDraft?.(pendingDraftCancelId);
        setExpandedRequestId(null);
        setPendingDraftCancelId(null);
      }}
    />
  );

  if (layout === "plain") {
    return (
      <>
        <section className={`overflow-hidden rounded-lg border ${accentBorder} bg-card`}>
          <div className={`flex items-start gap-orbit-base p-orbit-base ${accentBg}`}>
            <span className={`w-1 self-stretch rounded ${accentBar}`} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-orbit-s">
                <h3 className={`v5-orbit-heading-strong ${accentText}`}>
                  {title} · <span className="tabular-nums text-foreground">{displayedStats.total}</span>
                </h3>
                {bucketSummary && (
                  <span className="text-[11px] font-medium text-muted-foreground">{bucketSummary}</span>
                )}
              </div>
              <p className="mt-orbit-xxs text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
          {rowsContent}
        </section>
        {confirmOverlay}
      </>
    );
  }

  return (
    <>
      <section className={`overflow-hidden rounded-lg border ${accentBorder} bg-card`}>
        <button
          type="button"
          aria-expanded={open}
          className={`flex w-full items-start gap-orbit-base p-orbit-base text-left transition-colors ${accentBg}`}
          onClick={() => setOpen((current) => !current)}
        >
          <span className={`w-1 self-stretch rounded ${accentBar}`} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-orbit-s">
              <h3 className={`v5-orbit-heading-strong ${accentText}`}>
                {title} · <span className="tabular-nums text-foreground">{displayedStats.total}</span>
              </h3>
              {bucketSummary && (
                <span className="text-[11px] font-medium text-muted-foreground">{bucketSummary}</span>
              )}
            </div>
            <p className="mt-orbit-xxs text-xs text-muted-foreground">{description}</p>
          </div>
          <ChevronDown className={`mt-orbit-xs h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && rowsContent}
      </section>
      {confirmOverlay}
    </>
  );
}

// ---- Unmarked clauses (collapsible) ----------------------------------------

function UnmarkedSection({
  rows, leftLabel, rightLabel, visible, defaultOpen,
  requestOf, draftOf, isRequested, decisionOf, isDrafting, onRequestChange, onSetNoAction, onUpdateText, onCancelDraft, onSubmitDraft, onRemoveRequest, onOpenDetail,
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
  onRemoveRequest?: (id: string) => void;
  onOpenDetail: (id: string) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState("");
  const [pendingDraftCancelId, setPendingDraftCancelId] = useState<string | null>(null);
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
    <>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
          <button
            type="button"
            aria-expanded={open}
            className="w-full flex items-start gap-orbit-base p-orbit-base border-b border-border text-left hover:bg-muted/30 transition-colors"
            onClick={() => setOpen((current) => !current)}
          >
            <span className="w-1 self-stretch rounded bg-muted-foreground/40" />
            <div className="flex-1">
              <h3 className="v5-orbit-heading-strong text-foreground">
                Unmarked clauses · <span className="tabular-nums text-muted-foreground">{rows.length}</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Clauses you didn't previously flag and the supplier didn't materially change. Expand to search this list, or use the <span className="font-medium text-foreground">filter and search above</span> to narrow results, then request a change in this round.
              </p>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground mt-orbit-xs transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        {open && (
          rows.length === 0 ? (
            <div className="p-orbit-m text-center text-xs text-muted-foreground">
              Every clause has either been actioned or already has a material change in this round.
            </div>
          ) : (
            <>
              <div className="p-orbit-base border-b border-border bg-muted/20 flex items-center gap-orbit-s">
                <div className="flex-1 max-w-md">
                  <Searchbox
                    ariaLabel="Search unmarked clauses"
                    value={localSearch}
                    onChange={setLocalSearch}
                    placeholder={`Search ${rows.length} unmarked clauses…`}
                  />
                </div>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {filteredRows.length} / {rows.length}
                </span>
              </div>
              {filteredRows.length === 0 ? (
                <div className="p-orbit-m text-center text-xs text-muted-foreground">
                  No unmarked clauses match "{localSearch}".
                </div>
              ) : (
                <div className="space-y-orbit-s p-orbit-base">
                  {filteredRows.map((r) => {
                    const display = r.curr ?? r.prev!;
                    const requested = isRequested(r.id);
                    const decision = decisionOf(r.id);
                    const drafting = isDrafting(r.id);
                    const req = requestOf(r.id);
                    const draft = draftOf(r.id);
                    const isExpanded = expandedId === r.id || drafting;
                    const cancelDraft = () => {
                      if (draft.requestedChange?.trim() || draft.rationale?.trim()) {
                        setPendingDraftCancelId(r.id);
                        return;
                      }
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
                          <div className="grid gap-orbit-s text-[11px] md:grid-cols-2">
                            <div className="rounded-md bg-[#f8f7f5] px-orbit-s py-orbit-s">
                              <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{leftLabel}</p>
                              <p className="mt-orbit-xs leading-snug text-muted-foreground">{r.prev?.deviation ?? "Clause did not exist."}</p>
                            </div>
                            <div className="rounded-md bg-[#E6F1FB]/45 px-orbit-s py-orbit-s">
                              <p className="text-[9px] font-semibold uppercase tracking-wide text-[#185FA5]">{rightLabel}</p>
                              <p className="mt-orbit-xs leading-snug text-foreground">{r.curr?.deviation ?? "Clause no longer present."}</p>
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
                        onRemoveRequest={onRemoveRequest ? () => onRemoveRequest(r.id) : undefined}
                        onOpenDetail={() => onOpenDetail(r.id)}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )
        )}
      </div>
      <V5OrbitConfirmOverlay
        open={Boolean(pendingDraftCancelId)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setPendingDraftCancelId(null);
        }}
        title="Discard draft request?"
        description="This will remove the request text you have drafted for this clause."
        confirmLabel="Discard draft"
        destructive
        onConfirm={() => {
          if (pendingDraftCancelId) onCancelDraft(pendingDraftCancelId);
          setExpandedId(null);
          setPendingDraftCancelId(null);
        }}
      />
    </>
  );
}

// ---- Round Tracker ----------------------------------------------------------

function RoundTracker({
  versions, stateOf, search, activeCategories, onOpenDetail,
}: {
  versions: ContractVersion[];
  stateOf: (id: string) => ClauseDecisionState;
  search: string;
  activeCategories: string[];
  onOpenDetail: (id: string) => void;
}) {
  const activeCategorySet = new Set(activeCategories);
  const rows = CLAUSE_FRAMEWORK.filter((d) => {
    if (activeCategorySet.size > 0 && !activeCategorySet.has(d.category)) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!d.title.toLowerCase().includes(q) && !d.category.toLowerCase().includes(q) && !d.id.includes(q)) return false;
    }
    return true;
  });
  const roundColumns = [
    {
      id: "clause",
      header: "Clause",
      width: "260px",
      render: (def: (typeof CLAUSE_FRAMEWORK)[number]) => (
        <div>
          <span className="text-sm font-medium text-foreground hover:text-primary">
            {def.title}
          </span>
          <p className="text-[11px] tabular-nums text-muted-foreground">{def.id.toUpperCase()} · {def.category}</p>
        </div>
      ),
    },
    ...versions.map((v) => ({
      id: v.version,
      header: (
        <div className="flex flex-col items-center">
          <span className="tabular-nums text-xs font-bold text-foreground">Round {parseInt(v.version.replace("v", ""), 10)}</span>
          <span className="text-[10px] text-muted-foreground tabular-nums">{v.version}</span>
        </div>
      ),
      render: (def: (typeof CLAUSE_FRAMEWORK)[number]) => {
        const state = stateOf(def.id);
        const outcome = roundOutcome(def.id, v.version, versions, state);
        return <Badge variant="outline" className={`${outcome.tone} text-[10px]`}>{outcome.label}</Badge>;
      },
    })),
    {
      id: "current",
      header: "Current Status",
      width: "140px",
      render: (def: (typeof CLAUSE_FRAMEWORK)[number]) => {
        const state = stateOf(def.id);
        const latest = roundOutcome(def.id, versions.at(-1)!.version, versions, state);
        return <Badge variant="outline" className={`${latest.tone} text-[10px]`}>{latest.label}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-orbit-base">
      <div className="bg-card border border-border rounded-lg p-orbit-base">
        <h2 className="v5-orbit-heading-5">History</h2>
        <p className="text-xs text-muted-foreground">Track clause changes and outcomes across negotiation rounds.</p>
      </div>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <OrbitTable
          ariaLabel="Clause negotiation history"
          columns={roundColumns}
          rows={rows}
          getRowKey={(row) => row.id}
          density="Compact"
          onRowSelect={(row) => onOpenDetail(row.id)}
          getRowSelectionLabel={(row) => `Open ${row.title}`}
        />
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
        <div className="shrink-0 border-b border-border px-orbit-base py-orbit-base">
          <div className="flex items-start justify-between gap-orbit-base">
            <div className="min-w-0">
              <p className="text-[9px] font-medium uppercase text-muted-foreground">{clauseId.toUpperCase()} · {def.category}</p>
              <h2 className="v5-orbit-heading-label mt-orbit-xs truncate text-foreground">{display.title}</h2>
              <div className="mt-orbit-s flex flex-wrap items-center gap-orbit-xs">
                <Badge variant="outline" className={`${severityTone(display.severity)} text-[9px]`}>{display.severity}</Badge>
                {changePill.status ? <ChangePillBadge result={changePill} /> : <RoundStatusPill status={historyRow.currentStatus}>{roundStatusLabel(historyRow.currentStatus)}</RoundStatusPill>}
                <button
                  type="button"
                  onClick={() => onViewHistory(clauseId)}
                  className="inline-flex items-center gap-orbit-xs rounded-full bg-[#FAEEDA]/70 px-orbit-s py-orbit-xxs text-[9px] font-medium text-[#633806] hover:bg-[#FAEEDA]"
                >
                  <IconTimeline size={11} stroke={1.8} />
                  {historyRow.existsInRounds} rounds of history
                </button>
              </div>
            </div>
            <button type="button" onClick={onClose} className="rounded p-orbit-xs text-muted-foreground hover:bg-muted hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="shrink-0 border-b border-border bg-[#f8f7f5] px-orbit-base py-orbit-s">
          <div className="mb-orbit-s flex items-center justify-between">
            <p className="text-[9px] font-medium uppercase text-muted-foreground">Negotiation timeline</p>
            {mode === "comparison" && (
              <button type="button" onClick={() => onViewHistory(clauseId)} className="text-[9px] font-medium text-primary hover:underline">
                View in History →
              </button>
            )}
          </div>
          <div className="relative flex min-w-0 items-start gap-orbit-base overflow-x-auto px-orbit-xs pb-orbit-xs" aria-label={`Timeline for ${display.title}`}>
            <div className="absolute left-4 right-4 top-2 h-px bg-border" aria-hidden />
            {historyRow.cells.map((cell, index) => (
              <div key={cell.version || index} className="relative z-10 flex min-w-[42px] flex-col items-center gap-orbit-xs">
                <span className={`grid h-4 w-4 place-items-center rounded-full border text-[8px] font-medium ${roundStatusTone(cell.status)} ${index === historyRow.cells.length - 1 ? "outline outline-2 outline-offset-1 outline-[#185FA5]" : ""}`}>
                  {index + 1}
                </span>
                <span className="text-[7px] text-muted-foreground">{cell.version || "—"}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-orbit-base overflow-y-auto px-orbit-base py-orbit-base">
          {mode === "comparison" ? (
            <>
              {callout && (
                <div className={`rounded-md border-l-2 px-orbit-s py-orbit-s text-[10px] ${callout.className}`}>
                  <p>{callout.text}</p>
                </div>
              )}
              <SectionLabel>{leftLabel} → {rightLabel} diff</SectionLabel>
              <div className="grid grid-cols-2 gap-orbit-s">
                <div className="rounded-md bg-[#f8f7f5] px-orbit-s py-orbit-s opacity-75">
                  <p className="text-[8px] font-medium uppercase text-muted-foreground">{leftLabel} · previous</p>
                  <p className="mt-orbit-xs text-[10px] text-foreground">{isNewClause ? `(Clause did not exist in ${leftLabel})` : prev?.deviation ?? "—"}</p>
                </div>
                <div className="rounded-md bg-[#E6F1FB]/50 px-orbit-s py-orbit-s">
                  <p className="text-[8px] font-medium uppercase text-[#185FA5]">{rightLabel} · current</p>
                  <p className="mt-orbit-xs text-[10px] text-foreground">{curr?.deviation ?? display.deviation}</p>
                </div>
              </div>
              <SectionLabel>AI analysis</SectionLabel>
              <p className="rounded-md bg-[#f8f7f5] px-orbit-s py-orbit-s text-[11px] text-muted-foreground">
                {display.improvementReason ?? display.actionability ?? `Based on the playbook benchmark for ${def.category}, review this clause before accepting the version.`}
              </p>
              {(changePill.status === "met" || changePill.status === "not_met") && request?.requestedChange && (
                <>
                  <SectionLabel>Your request</SectionLabel>
                  <p className="rounded-md bg-[#f8f7f5] px-orbit-s py-orbit-s text-[11px] text-muted-foreground">{request.requestedChange}</p>
                </>
              )}
            </>
          ) : (
            <>
              <SectionLabel>Description</SectionLabel>
              <p className="rounded-md bg-[#f8f7f5] px-orbit-s py-orbit-s text-[11px] text-muted-foreground">{display.deviation}</p>
              <SectionLabel>Latest diff</SectionLabel>
              <p className="rounded-md bg-[#f8f7f5] px-orbit-s py-orbit-s text-[11px] text-muted-foreground">
                {latestCell?.clause?.improvementReason ?? latestCell?.clause?.deviation ?? "No latest change available."}
              </p>
              <SectionLabel>AI analysis</SectionLabel>
              <p className="rounded-md bg-[#f8f7f5] px-orbit-s py-orbit-s text-[11px] text-muted-foreground">
                {display.actionability ?? `Clause history shows ${historyRow.stateChanges} state change${historyRow.stateChanges === 1 ? "" : "s"} across the negotiation.`}
              </p>
              <SectionLabel>Round-by-round</SectionLabel>
              <div className="space-y-orbit-xs">
                {historyRow.cells.map((cell, index) => (
                  <div key={`${cell.version}-${index}`} className="flex items-start justify-between gap-orbit-s rounded-md border border-border px-orbit-s py-orbit-s text-[10px]">
                    <div>
                      <p className="font-medium text-foreground">Round {index + 1} · {cell.version}</p>
                      <p className="mt-orbit-xxs text-muted-foreground">{cell.clause?.improvementReason ?? cell.clause?.deviation ?? "Clause not present in this round."}</p>
                    </div>
                    <RoundStatusPill status={cell.status}>{cell.label}</RoundStatusPill>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-orbit-s border-t border-border px-orbit-base py-orbit-s">
          <Button variant="outline" className="h-8 text-xs" onClick={() => toast({ title: "Full text", description: display.excerpt })}>
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
  const className = "ml-auto h-8 bg-[#1a2744] px-orbit-base text-xs text-white hover:bg-[#243454]";
  if (status === "regressed") return <Button className={className} onClick={onMarkNewIssue}>Request revert</Button>;
  if (status === "new" || status === "improved") return <Button className={className} onClick={onCloseClause}>Accept</Button>;
  if (status === "met") return <Button className={className} onClick={onCloseClause}>Mark resolved</Button>;
  if (status === "not_met") return <Button className={className} onClick={onKeepOpen}>Re-request</Button>;
  return <Button className={className} onClick={onMarkNewIssue}>Request change</Button>;
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
        <div className="sticky top-0 bg-background border-b border-border px-orbit-m py-orbit-base flex items-start justify-between gap-orbit-base">
          <div>
            <p className="text-[10px] tabular-nums font-bold text-muted-foreground">{clauseId.toUpperCase()} · {def.category}</p>
            <h2 className="v5-orbit-heading-4">{display.title}</h2>
            <p className="text-xs tabular-nums text-muted-foreground">{display.subclause}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-orbit-xs">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-orbit-m space-y-orbit-m">
          {directionalCallout && (
            <div className={`rounded-md border px-orbit-base py-orbit-s text-sm ${directionalCallout.className}`}>
              <p className="font-medium">{directionalCallout.title}</p>
              <p className="mt-orbit-xxs text-xs opacity-85">{directionalCallout.description}</p>
            </div>
          )}

          {/* Summary v1 vs v2 */}
          <SectionLabel>Summary</SectionLabel>
          {isNewClause ? (
            <SidePanel label={rightLabel} clause={curr} highlight />
          ) : (
            <div className="grid grid-cols-2 gap-orbit-base">
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
            <div className="grid grid-cols-2 gap-orbit-base">
              <ExcerptPanel label={leftLabel} text={prev?.excerpt} />
              <ExcerptPanel label={rightLabel} text={curr?.excerpt} highlight={prev?.excerpt !== curr?.excerpt} />
            </div>
          )}

          {/* Audit trail + AI confidence (TASK-05, TASK-08) */}
          <SectionLabel>Why this verdict?</SectionLabel>
          <ClauseAuditPanel clauseId={clauseId} />

          {/* Locations + actionability */}
          <SectionLabel>Additional locations & actionability</SectionLabel>
          <div className="grid grid-cols-2 gap-orbit-base">
            <div className="rounded-md border border-border bg-card p-orbit-base space-y-orbit-s">
              <div className="flex items-center justify-between">
                <span className="text-[10px] tabular-nums font-semibold text-muted-foreground uppercase">{leftLabel}</span>
                <Badge variant="outline" className={severityTone((prev ?? display).severity)}>{prev?.severity ?? "—"}</Badge>
              </div>
              <LocationsList items={prev?.locations} />
            </div>
            <div className="rounded-md border border-border bg-card p-orbit-base space-y-orbit-s">
              <div className="flex items-center justify-between">
                <span className="text-[10px] tabular-nums font-semibold text-muted-foreground uppercase">{rightLabel}</span>
                <Badge variant="outline" className={severityTone((curr ?? display).severity)}>{curr?.severity ?? "—"}</Badge>
              </div>
              <LocationsList items={curr?.locations} />
            </div>
          </div>
          {display.actionability && (
            <div className="rounded-md border border-primary/20 bg-primary/5 p-orbit-base space-y-orbit-xs">
              <p className="text-[10px] font-semibold text-primary uppercase tracking-wider flex items-center gap-orbit-xs">
                <Lightbulb className="w-3 h-3" /> Suggested action
              </p>
              <p className="text-sm text-foreground">{display.actionability}</p>
            </div>
          )}

          {/* Requested change history */}
          {Object.keys(state.requests).length > 0 && (
            <>
              <SectionLabel>Requested change history</SectionLabel>
              <div className="space-y-orbit-s">
                {Object.entries(state.requests)
                  .filter(([, r]) => r.requestedChange || r.rationale)
                  .sort((a, b) => a[0].localeCompare(b[0]))
                  .map(([v, r]) => (
                    <div key={v} className="rounded-md border border-border bg-card p-orbit-base text-sm space-y-orbit-xs">
                      <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">{v}</p>
                      {r.requestedChange && (
                        <p><span className="text-[10px] font-semibold text-muted-foreground uppercase mr-orbit-s">Ask</span>{r.requestedChange}</p>
                      )}
                      {r.rationale && (
                        <p><span className="text-[10px] font-semibold text-muted-foreground uppercase mr-orbit-s">Why</span>{r.rationale}</p>
                      )}
                    </div>
                  ))}
              </div>
            </>
          )}


          {/* Action panel */}
          <div className="sticky bottom-0 -mx-orbit-m px-orbit-m py-orbit-base bg-background border-t border-border flex items-center justify-between flex-wrap gap-orbit-base">
            <div className="text-xs text-muted-foreground flex items-center gap-orbit-s">
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
            <div className="flex items-center gap-orbit-s">
              {changePill.status === "improved" ? (
                <>
                  <Button className="h-8 gap-orbit-xs text-xs" onClick={() => onCloseClause(clauseId)}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                  </Button>
                  <Button variant="outline" className="h-8 text-xs gap-orbit-xs" onClick={() => onMarkNewIssue(clauseId)}>
                    Challenge change
                  </Button>
                </>
              ) : changePill.status === "regressed" ? (
                <>
                  <Button className="h-8 gap-orbit-xs text-xs" onClick={() => onMarkNewIssue(clauseId)}>
                    <AlertTriangle className="w-3.5 h-3.5" /> Request revert
                  </Button>
                  <Button variant="outline" className="h-8 text-xs gap-orbit-xs" onClick={() => onCloseClause(clauseId)}>
                    Accept change
                  </Button>
                </>
              ) : changePill.status === "new" ? (
                <>
                  <Button className="h-8 gap-orbit-xs text-xs" onClick={() => onCloseClause(clauseId)}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                  </Button>
                  <Button variant="outline" className="h-8 text-xs gap-orbit-xs" onClick={() => onMarkNewIssue(clauseId)}>
                    Request removal
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="h-8 text-xs gap-orbit-xs" onClick={() => onKeepOpen(clauseId)}>
                    <ArrowRight className="w-3.5 h-3.5" /> Keep Open
                  </Button>
                  <Button variant="default" className="h-8 text-xs gap-orbit-xs" onClick={() => onCloseClause(clauseId)}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Close
                  </Button>
                  <Button variant="secondary" className="h-8 text-xs gap-orbit-xs" onClick={() => onMarkNewIssue(clauseId)}>
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
    <div className={`rounded-md border p-orbit-base space-y-orbit-s ${highlight ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] tabular-nums font-semibold text-muted-foreground uppercase">{label}</span>
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
    <div className={`rounded-md border p-orbit-base space-y-orbit-s ${highlight ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}>
      <span className="text-[10px] tabular-nums font-semibold text-muted-foreground uppercase">{label}</span>
      {text ? (
        <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-orbit-s">"{text}"</p>
      ) : (
        <p className="text-xs text-muted-foreground italic">— Not present —</p>
      )}
    </div>
  );
}

function LocationsList({ items }: { items?: string[] }) {
  if (!items || items.length === 0) return <p className="text-xs text-muted-foreground italic">No additional locations.</p>;
  return (
    <ul className="space-y-orbit-xs">
      {items.map((l) => (
        <li key={l} className="text-xs text-foreground tabular-nums flex items-center gap-orbit-xs">
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
  const groupingDetails = `Why is this grouped under ${supplierName}? ${g.matchBasis} Source: ${g.source}. Confidence: ${(g.confidence * 100).toFixed(0)}%.`;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" className={`${compact ? "h-7 px-orbit-s text-xs" : "h-9"} gap-orbit-xs`}>
          <Info className="w-3.5 h-3.5" /> Why grouped?
          <Badge variant="outline" className={`${compact ? "hidden 2xl:inline-flex" : ""} ${isManual ? "bg-secondary text-secondary-foreground border-border ml-orbit-xs" : "bg-success/10 text-success border-success/20 ml-orbit-xs"}`}>
            {isManual ? "Manual" : `Auto · ${(g.confidence * 100).toFixed(0)}%`}
          </Badge>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{groupingDetails}</TooltipContent>
    </Tooltip>
  );
}

function HistoryDesignContent({
  option,
  versions,
  model,
  categoryRail,
  categoryPanel,
  categoryStrip,
  summaryRail,
  onOpenDetail,
  highlightedId,
}: {
  option: ComparisonDesignOption;
  versions: ContractVersion[];
  model: ReturnType<typeof deriveHistoryModel>;
  categoryRail: ReactNode;
  categoryPanel: ReactNode;
  categoryStrip: ReactNode;
  summaryRail: ReactNode;
  onOpenDetail: (id: string) => void;
  highlightedId: string | null;
}) {
  const [railTab, setRailTab] = useState<"summary" | "categories">("summary");

  if (option === "side-by-side") {
    return (
      <div className="mx-auto grid w-full max-w-[1500px] gap-orbit-base px-orbit-base py-orbit-base xl:grid-cols-[360px_minmax(0,1fr)] xl:items-start">
        <aside className="self-start xl:sticky xl:top-[104px] xl:max-h-[calc(100vh-128px)] xl:overflow-y-auto">
          <section className="overflow-hidden rounded-lg border border-border bg-card">
            <HistoryRailTabs active={railTab} onChange={setRailTab} />
            <div className="p-orbit-base">
              {railTab === "summary" ? (
                summaryRail
              ) : (
                categoryPanel
              )}
            </div>
          </section>
        </aside>
        <div className="min-w-0">
          <HistoryRoundTable
            versions={versions}
            rows={model.filteredRows}
            onOpenDetail={onOpenDetail}
            highlightedId={highlightedId}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-[1600px] grid-cols-[240px_minmax(0,1fr)] gap-orbit-m px-orbit-base py-orbit-m">
      {categoryRail}
      <HistoryRoundTable
        versions={versions}
        rows={model.filteredRows}
        onOpenDetail={onOpenDetail}
        highlightedId={highlightedId}
      />
    </div>
  );
}

function HistoryRailTabs({
  active,
  onChange,
}: {
  active: "summary" | "categories";
  onChange: (value: "summary" | "categories") => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-orbit-xs border-b border-border bg-[#f8f7f5] p-orbit-xs">
      {(["summary", "categories"] as const).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={cn(
            "h-7 rounded-md text-[11px] font-medium capitalize transition-colors",
            active === value ? "bg-[#1a2744] text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {value}
        </button>
      ))}
    </div>
  );
}

function HistorySummaryPanel({
  versions,
  model,
  compact = false,
}: {
  versions: ContractVersion[];
  model: ReturnType<typeof deriveHistoryModel>;
  compact?: boolean;
}) {
  const first = versions[0];
  const latest = versions.at(-1);
  return (
    <div className={cn("space-y-orbit-base", !compact && "mt-orbit-base")}>
      <div className="rounded-lg border border-border bg-[#f8f7f5] p-orbit-base">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Scope</p>
        <p className="mt-orbit-xs text-sm font-semibold text-foreground">
          {first?.version ?? "v1"} → {latest?.version ?? "v1"}
        </p>
        <p className="mt-orbit-xxs text-[11px] text-muted-foreground">
          {versions.length} rounds{first && latest ? ` · ${formatShortDate(first.uploadedAt)} to ${formatShortDate(latest.uploadedAt)}` : ""}
        </p>
      </div>
      <div className={cn("grid gap-orbit-s", compact ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-4")}>
        <HistoryStatCard value={model.stats.totalClauses} label="Total clauses" trend={`across ${model.stats.roundCount} rounds`} />
        <HistoryStatCard value={model.stats.stillOpen} label="Still open" trend="needs attention" tone="danger" />
        <HistoryStatCard value={model.stats.avgRoundsToResolve} label="Avg resolve" trend="rounds to resolve" tone="success" />
        <HistoryStatCard
          value={`${model.stats.settledByRound3Pct}%`}
          label="Settled R3"
          trend="by round 3"
          tone={model.stats.settledByRound3Pct >= 65 ? "success" : "danger"}
        />
      </div>
    </div>
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
      <div className="py-orbit-mega text-center text-[11px] italic text-muted-foreground">
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
        <div className="border-b border-border bg-[#f8f7f5] px-orbit-base py-orbit-s" />
        <div className="border-b border-border bg-[#f8f7f5] px-orbit-base py-orbit-s text-[9px] font-medium uppercase tracking-[0.04em] text-muted-foreground">Clause</div>
        {versions.map((version, index) => (
          <div key={version.version} className="border-b border-border bg-[#f8f7f5] px-orbit-s py-orbit-s text-center text-[9px] font-medium uppercase tracking-[0.04em] text-muted-foreground">
            R{index + 1} {version.version}
          </div>
        ))}
        <div className="border-b border-border bg-[#f8f7f5] px-orbit-s py-orbit-s text-center text-[9px] font-medium uppercase tracking-[0.04em] text-muted-foreground">Status</div>
        <div className="border-b border-border bg-[#f8f7f5] px-orbit-s py-orbit-s" />

        {rows.map((row) => (
          <button
            id={`history-row-${row.id}`}
            key={row.id}
            type="button"
            onClick={() => onOpenDetail(row.id)}
            className={`group contents text-left ${highlightedId === row.id ? "[&>*]:bg-[#E6F1FB]" : ""}`}
          >
            <div className="border-b border-border px-orbit-base py-orbit-s transition-colors group-hover:bg-[#f8f7f5]">
              {row.stateChanges >= 3 && <span className="mt-orbit-s block h-1.5 w-1.5 rounded-full bg-[#A32D2D]" title="Highly contentious" />}
            </div>
            <div className="min-w-0 border-b border-border px-orbit-base py-orbit-s transition-colors group-hover:bg-[#f8f7f5]">
              <p className="truncate text-[11px] font-medium text-foreground">{row.title}</p>
              <p className="truncate text-[9px] uppercase text-muted-foreground">{row.id.toUpperCase()} · {row.category}</p>
            </div>
            {row.cells.map((cell) => (
              <div key={`${row.id}-${cell.version}`} className="border-b border-border px-orbit-s py-orbit-s text-center transition-colors group-hover:bg-[#f8f7f5]">
                <RoundStatusPill status={cell.status}>{cell.label}</RoundStatusPill>
              </div>
            ))}
            <div className="border-b border-border px-orbit-s py-orbit-s text-center transition-colors group-hover:bg-[#f8f7f5]">
              {row.currentPill.status ? <ChangePillBadge result={row.currentPill} /> : <RoundStatusPill status={row.currentStatus}>{roundStatusLabel(row.currentStatus)}</RoundStatusPill>}
            </div>
            <div className="border-b border-border px-orbit-s py-orbit-s text-center text-sm text-muted-foreground transition-colors group-hover:bg-[#f8f7f5]">›</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function RoundStatusPill({ status, children }: { status: RoundStatus; children: ReactNode }) {
  return (
    <span className={`inline-flex rounded-full border px-orbit-xs py-orbit-xxs text-[9px] font-medium ${roundStatusTone(status)}`}>
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
    <div className="rounded-md border border-border bg-card p-orbit-base space-y-orbit-base">
      <div className="flex items-start justify-between gap-orbit-base flex-wrap">
        <div>
          <p className="text-[10px] tabular-nums font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-orbit-xs">
            <ShieldCheck className="w-3 h-3" /> {audit.ruleId} · {audit.ruleName}
          </p>
          <p className="text-xs text-muted-foreground">
            Rule version <span className="tabular-nums">{audit.ruleVersion}</span>
          </p>
        </div>
        {/* DI-17: numeric band + reasoning shown inline, no hover required */}
        <div className="flex flex-col items-end gap-orbit-xs">
          <Badge variant="outline" className={`${conf.tone} text-[11px] gap-orbit-xs`}>
            <Sigma className="w-3 h-3" /> {conf.label} confidence ·{" "}
            <span className="tabular-nums">{(audit.confidence * 100).toFixed(0)}%</span>
            <span className="opacity-60 tabular-nums">({conf.range})</span>
          </Badge>
          <p className="text-[11px] text-muted-foreground max-w-[280px] text-right">{conf.reasoning}</p>
        </div>
      </div>

      <Tabs defaultValue="rule" className="w-full">
        <TabsList className="h-8">
          <TabsTrigger value="rule" className="text-[11px] h-7">Active rule</TabsTrigger>
          <TabsTrigger value="history" className="text-[11px] h-7 gap-orbit-xs">
            <History className="w-3 h-3" /> Rule history
            {history.length > 0 && (
              <span className="ml-orbit-xxs px-orbit-xs rounded bg-muted text-[10px] tabular-nums text-muted-foreground">
                {history.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rule" className="m-orbit-none mt-orbit-base space-y-orbit-base">
          <div>
            <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">Expectation</p>
            <p className="text-sm text-foreground">{audit.expectation}</p>
          </div>
          {audit.matchedExcerpt && (
            <div>
              <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">Matched clause excerpt</p>
              <p className="text-xs italic text-muted-foreground border-l-2 border-primary/40 pl-orbit-s mt-orbit-xs">"{audit.matchedExcerpt}"</p>
              {audit.location && <p className="text-[11px] tabular-nums text-muted-foreground mt-orbit-xs">Location: {audit.location}</p>}
            </div>
          )}
          <div>
            <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">AI rationale</p>
            <p className="text-xs text-foreground">{audit.rationale}</p>
          </div>
          {audit.confidence < 0.7 && (
            <div className="rounded border border-destructive/30 bg-destructive/5 p-orbit-s text-[11px] text-destructive flex items-center gap-orbit-xs">
              <AlertTriangle className="w-3 h-3" /> Low confidence — review the source clause before accepting.
            </div>
          )}
          {audit.evidenceUrl && (
            <a
              href={audit.evidenceUrl}
              className="inline-flex items-center gap-orbit-xs text-xs text-primary hover:underline"
            >
              View evidence <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </TabsContent>

        <TabsContent value="history" className="m-orbit-none mt-orbit-base">
          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No prior versions recorded for this rule.</p>
          ) : (
            <ol className="space-y-orbit-s border-l border-border pl-orbit-base">
              {history.map((h, i) => {
                const prevExpectation = history[i + 1]?.expectation;
                const changedExpectation = prevExpectation && prevExpectation !== h.expectation;
                return (
                  <li key={h.version} className="relative">
                    <span className="absolute -left-[18px] top-1 w-2.5 h-2.5 rounded-full bg-primary/70 border-2 border-card" aria-hidden />
                    <div className="flex flex-wrap items-baseline gap-orbit-s">
                      <span className="tabular-nums text-[11px] font-semibold text-foreground">{h.version}</span>
                      <span className="text-[10px] text-muted-foreground">{h.date}</span>
                      <span className="text-[10px] text-muted-foreground">· {h.author}</span>
                      {i === 0 && (
                        <Badge variant="outline" className="text-[9px] h-4 px-orbit-xs bg-primary/10 text-primary border-primary/30">
                          current
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-foreground mt-orbit-xxs">{h.change}</p>
                    {changedExpectation && (
                      <div className="mt-orbit-xs text-[11px] rounded border border-border bg-muted/30 p-orbit-s space-y-orbit-xxs">
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
