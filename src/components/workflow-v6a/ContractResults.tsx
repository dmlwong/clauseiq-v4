import { useState, useMemo, useEffect, useRef, type CSSProperties, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
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
  type CardState as OrbitCardState,
  Chip,
  Dropzone,
  FileItem,
  Headings,
  QuickFilterGroup,
  QuickFilterItem,
  Searchbox,
  TabButton,
  Table as OrbitTable,
  Button as OrbitButton,
  Text,
  ToggleCard,
  MultiSelectDropdown,
} from "@orbit";
import { showV6OrbitToast as toast } from "@/components/clauseiq-v6a/V6OrbitToast";
import { V6OrbitConfirmOverlay, V6OrbitOverlay } from "@/components/clauseiq-v6a/V6OrbitOverlay";
import { Input } from "@/components/clauseiq-v6a/orbit-ui/input";
import { Textarea } from "@/components/clauseiq-v6a/orbit-ui/textarea";
import { Badge } from "@/components/clauseiq-v6a/orbit-ui/badge";
import { Button } from "@/components/clauseiq-v6a/orbit-ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/clauseiq-v6a/orbit-ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/clauseiq-v6a/orbit-ui/select";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/clauseiq-v6a/orbit-ui/tooltip";
import {
  getInitiative, getSupplier, getContract,
  type ClauseResult, type ContractVersion,
} from "@/lib/workflow-v6-data";
import {
  getSupplierOutputComparisonContext,
  mockInitiative as clauseIqV6MockInitiative,
} from "@/data/mock-clauseiq-v6";
import { ACME_DEFAULT_FOCUS_IDS, ACME_DEFAULT_REQUEST_TEXTS, makeSyntheticVersion } from "@/lib/clauses-data";
import { SWITCHED_ON_FIRST_ANALYSIS_VERSION } from "@/lib/switched-on-analysis-data";
import {
  useClauseDecisions,
  getLatestRequest,
  type ClauseDecisionState,
  type ClauseRequest,
  type ClauseTargetVersion,
  type ClauseVerdict,
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
import {
  FIRST_ANALYSIS_STATUS_THEME,
  FirstAnalysisStatusTag,
  type FirstAnalysisStatusKey,
} from "./firstAnalysisStatusTags";

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
type QuickFilterKey = "not-met" | "met" | "worsened" | "unexpected" | "manual-review" | "high" | "medium" | "low" | "missing" | "none";
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

const CLAUSE_ACTION_LABELS = {
  reviseTarget: "Set Custom Position",
  holdPosition: "Use Recommended Position",
  acceptSupplierPosition: "Accept Supplier Position",
} as const;

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
type DeviationLevel = "High" | "Medium" | "Low" | "Aligned";

interface DeviationDelta {
  from: DeviationLevel;
  to: DeviationLevel;
}

interface SessionAuditEntry {
  timestamp: string;
  clauseId: string;
  entry: string;
}

interface PanelChangeItem {
  id: string;
  title: string;
  status: PanelChangeStatus;
}

type OrbitCardStyle = CSSProperties & {
  "--orbit-color-card-indicator-default"?: string;
};

const severityTone = (s: ClauseResult["severity"] | undefined) =>
  s === "high" ? "bg-destructive/10 text-destructive border-destructive/20"
    : s === "medium" ? "bg-warning/15 text-warning-foreground border-warning/30"
    : s === "low" ? "bg-muted text-muted-foreground border-border"
    : "bg-muted text-muted-foreground border-border";

function isInitiativesV6Route() {
  return typeof window !== "undefined" && window.location.pathname.startsWith("/initiatives-v6a");
}

const firstAnalysisDeviationBadgeClass =
  "shrink-0 rounded-full border-[#F3B4B4] bg-[#FFF1F2] px-orbit-xs py-orbit-xxs text-[9px] v6-orbit-weight-medium text-[#A32D2D]";
const firstAnalysisMissingClauseBadgeClass =
  "shrink-0 rounded-full border-[#185FA5]/25 bg-[#E6F1FB] px-orbit-xs py-orbit-xxs text-[9px] v6-orbit-weight-medium text-[#0C447C]";
const firstAnalysisMissingClauseLegacyBadgeClass =
  "shrink-0 rounded-full px-orbit-xs py-orbit-xxs text-[9px] v6-orbit-weight-medium";
const firstAnalysisNoneDeviationBadgeClass =
  "shrink-0 rounded-full border-[#BFD6AB] bg-[#EAF3DE] px-orbit-xs py-orbit-xxs text-[9px] v6-orbit-weight-medium text-[#27500A]";

function getFirstAnalysisMissingClauseBadgeClass() {
  return isInitiativesV6Route() ? firstAnalysisMissingClauseBadgeClass : firstAnalysisMissingClauseLegacyBadgeClass;
}

const firstAnalysisSeverityStatus: Record<ClauseResult["severity"], FirstAnalysisStatusKey> = {
  high: "high",
  medium: "medium",
  low: "low",
};

const firstAnalysisSeverityCardState: Record<ClauseResult["severity"], OrbitCardState> = {
  high: "Error",
  medium: "Warning",
  low: "Default",
};

function firstAnalysisCardStateForClause(clause: Pick<ClauseResult, "severity" | "missingClause" | "sourceDeviationLevel">): OrbitCardState {
  if (clause.missingClause && clause.sourceDeviationLevel === "None") return "Default";
  if (clause.sourceDeviationLevel === "None") return "Success";
  return firstAnalysisSeverityCardState[clause.severity];
}

function firstAnalysisCardIndicatorColorForClause(clause: Pick<ClauseResult, "severity" | "missingClause" | "sourceDeviationLevel">) {
  if (clause.missingClause && clause.sourceDeviationLevel === "None") return FIRST_ANALYSIS_STATUS_THEME.missing.indicatorColor;
  if (clause.sourceDeviationLevel === "None") return FIRST_ANALYSIS_STATUS_THEME.none.indicatorColor;
  return FIRST_ANALYSIS_STATUS_THEME[firstAnalysisSeverityStatus[clause.severity]].indicatorColor;
}

const DEMO_TARGET_CLAUSE_ID = "c3";
const DEMO_REGRESSION_CLAUSE_ID = "c6";
const CURRENT_USER_LABEL = "Derek";

function severityToDeviationLevel(clause?: ClauseResult): DeviationLevel {
  if (!clause || clause.resolved || clause.sourceDeviationLevel === "None") return "Aligned";
  if (clause.sourceDeviationLevel === "High" || clause.sourceDeviationLevel === "Medium" || clause.sourceDeviationLevel === "Low") {
    return clause.sourceDeviationLevel;
  }
  if (clause.severity === "high") return "High";
  if (clause.severity === "medium") return "Medium";
  return "Low";
}

function getDeviationDelta(prev?: ClauseResult, curr?: ClauseResult, fallback?: DeviationDelta): DeviationDelta | undefined {
  if (fallback) return fallback;
  if (!prev || !curr) return undefined;
  const from = severityToDeviationLevel(prev);
  const to = severityToDeviationLevel(curr);
  return from === to ? undefined : { from, to };
}

function verdictFromChangePill(status: ChangePillStatus | null | undefined): ClauseVerdict | null {
  if (status === "met") return "met";
  if (status === "not_met" || status === "improved") return "notmet";
  return null;
}

function effectiveVerdict(state: ClauseDecisionState, targetVersion: string, status: ChangePillStatus | null | undefined): ClauseVerdict | null {
  const computed = verdictFromChangePill(status);
  return state.verdictConfirmations?.[targetVersion]?.verdict ?? computed;
}

function appendAuditEntry(state: ClauseDecisionState, clauseId: string, entry: string): SessionAuditEntry[] {
  return [
    ...(state.auditLog ?? []),
    {
      timestamp: new Date().toISOString(),
      clauseId,
      entry,
    },
  ];
}

function targetVersionsForClause(state: ClauseDecisionState, request: ClauseRequest | undefined): ClauseTargetVersion[] {
  if (state.targetVersions?.length) return state.targetVersions;
  const fallbackText = request?.requestedChange?.trim() || "Supplier to align wording with the requested commercial position.";
  return [
    {
      version: 1,
      text: fallbackText,
      round: 1,
      reason: request?.rationale,
      createdAt: request?.createdAt ?? new Date().toISOString(),
    },
  ];
}

function demoRequestText(clauseId: string, request?: ClauseRequest) {
  if (clauseId === DEMO_TARGET_CLAUSE_ID) {
    return request?.requestedChange?.trim() || "24-month instalment schedule";
  }
  return request?.requestedChange?.trim() || "Requested supplier change not captured.";
}

function demoSupplierReturnedText(clauseId: string, simulatedMet?: boolean) {
  if (clauseId === DEMO_TARGET_CLAUSE_ID) {
    return simulatedMet ? "30-month instalment schedule" : "36-month instalment schedule";
  }
  return "Supplier returned wording shown in the current version.";
}

function displayTitleForClause(clauseId: string, fallback: string) {
  return clauseId === DEMO_TARGET_CLAUSE_ID ? "Payment Term — Instalment Schedule" : fallback;
}

function ClauseTitleInline({
  clauseId,
  fallback,
}: {
  clauseId: string;
  fallback: string;
}) {
  return (
    <span className="inline-flex min-w-0 max-w-full items-center gap-[4px]">
      <span className="shrink-0 text-[0.92em] v6-orbit-weight-regular text-muted-foreground">{clauseId}</span>
      <span aria-hidden="true" className="h-[1em] w-px shrink-0 bg-border" />
      <span className="min-w-0 truncate">{displayTitleForClause(clauseId, fallback)}</span>
    </span>
  );
}

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

function normalizeMode(_value: string | null): ClauseIqMode {
  return "comparison";
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

function outcomeDeviationSortRank(clause?: ClauseResult) {
  if (!clause) return 5;
  if (clause.missingClause && clause.sourceDeviationLevel === "None") return 3;
  if (clause.sourceDeviationLevel === "High") return 0;
  if (clause.sourceDeviationLevel === "Medium") return 1;
  if (clause.sourceDeviationLevel === "Low") return 2;
  if (clause.severity === "high") return 0;
  if (clause.severity === "medium") return 1;
  if (clause.severity === "low") return 2;
  return 4;
}

function sortOutcomeComparisonRows<T extends { id: string; prev?: ClauseResult; curr?: ClauseResult }>(rows: T[]) {
  return [...rows].sort((a, b) => {
    const aClause = a.curr ?? a.prev;
    const bClause = b.curr ?? b.prev;
    const deviationDelta = outcomeDeviationSortRank(aClause) - outcomeDeviationSortRank(bClause);
    if (deviationDelta !== 0) return deviationDelta;
    const aTitle = aClause?.title ?? a.id;
    const bTitle = bClause?.title ?? b.id;
    return aTitle.localeCompare(bTitle);
  });
}

function isMissingClause(clause: ClauseResult) {
  return Boolean(clause.missingClause || clause.change === "new");
}

function isPureMissingClause(clause: ClauseResult) {
  return Boolean(clause.missingClause && clause.sourceDeviationLevel === "None");
}

function isNoneDeviationClause(clause: ClauseResult) {
  return clause.sourceDeviationLevel === "None" && !clause.missingClause;
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
  label: "Hold" | "Revise target" | "Updated" | "Still open" | "Accepted" | "New supplier change" | "—";
  tone: string;
}

const V6A_OUTCOME_DEMO_OVERRIDES: Record<string, Record<string, Partial<ClauseResult>>> = {
  v2: {
    c10: {
      severity: "low",
      resolved: true,
      change: "unchanged",
      sourceDeviationLevel: "None",
      deviation: "Service levels aligned to the benchmark playbook with full service credits in place.",
      excerpt: "Supplier shall meet 99.9% availability with service credits for sustained service failures.",
    },
  },
  v3: {
    c10: {
      severity: "high",
      resolved: false,
      change: "worsened",
      sourceDeviationLevel: "None",
      deviation: "Availability target dropped to 99.0% and service credits have been removed.",
      excerpt: "Supplier shall use reasonable endeavours to meet 99.0% availability. Service credits no longer apply.",
      improvementReason: undefined,
    },
    c46: {
      severity: "low",
      resolved: true,
      change: "unchanged",
      sourceDeviationLevel: "None",
      deviation: "Audit rights align with the benchmark playbook.",
      excerpt: "Supplier grants Buyer annual audit rights on reasonable notice.",
    },
    c50: {
      severity: "high",
      resolved: false,
      change: "new",
      missingClause: true,
      sourceDeviationLevel: "None",
      deviation: "No standalone data breach notification clause is present in the supplier draft.",
      excerpt: "The draft does not include an express obligation to notify Buyer of a personal data breach within a defined timeframe.",
      actionability: "Insert a 24-hour breach notification obligation with named escalation contacts.",
    },
  },
};

function applyOutcomeReviewDemoExamples(versions: ContractVersion[]) {
  let changed = false;

  const nextVersions = versions.map((version) => {
    const clauseOverrides = V6A_OUTCOME_DEMO_OVERRIDES[version.version];
    if (!clauseOverrides) return version;
    changed = true;
    return {
      ...version,
      clauses: version.clauses.map((clause) => (
        clauseOverrides[clause.id] ? { ...clause, ...clauseOverrides[clause.id] } : clause
      )),
    };
  });

  return changed ? nextVersions : versions;
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
    if (round === "request-update") return { label: "Revise target", tone: "bg-primary/10 text-primary border-primary/20" };
    if (round === "no-action") return { label: "Hold", tone: "bg-muted text-muted-foreground border-border" };
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

  if (closure === "closed") return { label: "Accepted", tone: "bg-success/10 text-success border-success/20" };

  if (wasRequestedBefore) {
    if (change === "material") {
      // Updated by supplier — still open unless user closes it.
      return { label: "Updated", tone: "bg-primary/10 text-primary border-primary/20" };
    }
    return { label: "Still open", tone: "bg-warning/15 text-warning-foreground border-warning/30" };
  }

  // Not previously requested
  if (change === "material") return { label: "New supplier change", tone: "bg-destructive/10 text-destructive border-destructive/20" };
  return { label: "Hold", tone: "bg-muted text-muted-foreground border-border" };
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
  const decisions = useClauseDecisions({});
  const firstAnalysisDemo = searchParams.get("scenario") === "first-analysis";
  const outcomeReviewMode =
    searchParams.get("resultMode") === "outcome" &&
    searchParams.get("scenario") === "negotiated-reanalysis";
  const outcomeContext = useMemo(
    () =>
      outcomeReviewMode
        ? getSupplierOutputComparisonContext(
            clauseIqV6MockInitiative,
            searchParams.get("analysisId"),
            searchParams.get("previousAnalysisId"),
          )
        : null,
    [outcomeReviewMode, searchParams],
  );
  const isResponsiveTestingRoute =
    typeof window !== "undefined" && window.location.pathname.startsWith("/initiatives-responsive-testing");
  const mode = normalizeMode(searchParams.get("mode"));
  const designOption = normalizeComparisonDesignOption(searchParams.get("design"));
  const decisionContractId = firstAnalysisDemo ? `${contractId}:first-analysis-demo` : contractId;
  const generatedCsvStoragePrefix = `ciq-v6a-generated-csv:${supplierId}:${decisionContractId}:`;
  const firstAnalysisResetKeyRef = useRef<string | null>(null);

  // Local mutable copy of versions so the user can simulate uploading a new
  // round or deleting an existing one without touching shared seed data.
  const firstAnalysisSeedVersions = firstAnalysisDemo ? [SWITCHED_ON_FIRST_ANALYSIS_VERSION] : contract?.versions ?? [];
  const [availableVersions, setAvailableVersions] = useState<ContractVersion[]>(firstAnalysisSeedVersions);
  const versions = useMemo(
    () => (
      firstAnalysisDemo
        ? availableVersions.slice(0, 1)
        : outcomeReviewMode
        ? applyOutcomeReviewDemoExamples(availableVersions)
        : availableVersions
    ),
    [availableVersions, firstAnalysisDemo, outcomeReviewMode],
  );
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
  const simplifyComparisonStatus =
    mode === "comparison" &&
    versions.length >= 2 &&
    Boolean(leftVersion && rightVersion && leftVersion.version !== rightVersion.version);

  // Which version the Review tab is focused on (defaults to latest so the user
  // can review v1 first, then re-review v2 once it's uploaded).
  const [reviewVersionLabel, setReviewVersionLabel] = useState<string>(() => versions[0]?.version ?? "v1");
  const reviewVersion = versions.find((v) => v.version === reviewVersionLabel) ?? v1;

  const tabStorageKey = `ciq-v6a-tab:${supplierId}:${contractId}`;
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

  const historyStorageKey = `ciq-v6a-history:${supplierId}:${contractId}`;
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
  const [nonCompactBulkBannerOpen, setNonCompactBulkBannerOpen] = useState(false);
  const [bulkReviewSelection, setBulkReviewSelection] = useState<{ version: string; clauseIds: string[] } | null>(null);
  const [bulkAppliedRecommendationIds, setBulkAppliedRecommendationIds] = useState<string[]>([]);
  const [bulkAppliedRecommendationScopeLabel, setBulkAppliedRecommendationScopeLabel] = useState<string | null>(null);
  const [sessionAuditLog, setSessionAuditLog] = useState<SessionAuditEntry[]>([]);
  const [signoffOpen, setSignoffOpen] = useState(false);
  const [signoffNotes, setSignoffNotes] = useState<Record<string, string>>({});
  const [signoffResolved, setSignoffResolved] = useState<Set<string>>(() => new Set());
  const [auditPackOpen, setAuditPackOpen] = useState(false);
  const [generatedCsvSignatures, setGeneratedCsvSignatures] = useState<Record<string, string | null>>({});
  const [quickFilter, setQuickFilter] = useState<QuickFilterKey | null>(() =>
    mode === "comparison" && versions.length >= 2 ? "open-items" : null,
  );
  const [firstAnalysisMetricFilters, setFirstAnalysisMetricFilters] = useState<Set<FirstAnalysisMetricKey>>(() => new Set());
  useEffect(() => {
    if (!simplifyComparisonStatus) return;
    if (filter === "new-issues" || filter === "unmarked") {
      setFilter("open");
    }
    if (quickFilter === "worsened" || quickFilter === "unexpected" || quickFilter === "manual-review") {
      setQuickFilter("not-met");
    }
  }, [filter, quickFilter, simplifyComparisonStatus]);
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
      const closure = allDecisions[item.clauseId]?.closures?.[activeRequestVersion.version];
      return buildBasketRequestItem(
        item.clauseId,
        activeRequestVersion,
        closure === "follow-up" ? "revise-target" : "request-update",
        item.request,
        leftVersion,
      );
    });
  }, [activeRequestVersion, allDecisions, decisionContractId, decisions, leftVersion, mode, supplierId]);
  const currentReviewItems = useMemo<BasketRequestItem[]>(() => {
    if (mode !== "comparison" || !activeRequestVersion) return [];

    return activeRequestVersion.clauses
      .map((clause) => {
        const state = allDecisions[clause.id];
        if (!state) return null;

        const decision = state.roundDecisions[activeRequestVersion.version];
        const closure = state.closures[activeRequestVersion.version];
        const request = state.requests[activeRequestVersion.version];

        if (decision === "request-update" && request?.requestedChange?.trim()) {
          return buildBasketRequestItem(
            clause.id,
            activeRequestVersion,
            closure === "follow-up" ? "revise-target" : "request-update",
            request,
            leftVersion,
          );
        }
        if (closure === "closed") {
          return buildBasketRequestItem(clause.id, activeRequestVersion, "accept", undefined, leftVersion);
        }
        if (closure === "keep-open") {
          return buildBasketRequestItem(clause.id, activeRequestVersion, "hold-position", undefined, leftVersion);
        }
        if (decision === "no-action") {
          return buildBasketRequestItem(clause.id, activeRequestVersion, "no-action", undefined, leftVersion);
        }
        return null;
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
  const reviewGenerateItems = !hasGeneratedCsv || csvNeedsUpdate ? currentReviewItems : pendingRequestItems;
  const reviewGenerateDisabled = !activeRequestVersion || (!csvNeedsUpdate && reviewGenerateItems.length === 0);
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
      reviewGenerateItems,
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
      description: reviewGenerateItems.length > 0
        ? `${reviewGenerateItems.length} review decision${reviewGenerateItems.length === 1 ? "" : "s"} exported for supplier negotiation.`
        : "No review decisions remain. The generated CSV reflects the latest review decisions.",
    });
  };
  const bulkReviewClauseIdSet = new Set(bulkReviewSelection?.clauseIds ?? []);
  const bulkReviewSummaryMode = Boolean(
    bulkReviewSelection &&
      activeRequestVersion &&
      bulkReviewSelection.version === activeRequestVersion.version &&
      reviewGenerateItems.length > 0 &&
      reviewGenerateItems.length === bulkReviewClauseIdSet.size &&
      reviewGenerateItems.every((item) => bulkReviewClauseIdSet.has(item.clauseId)),
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
    () => {
      if (!simplifyComparisonStatus) {
        return {
          open: comparisonModel.buckets.open_items,
          newIssues: comparisonModel.buckets.new_changes,
          closed: comparisonModel.buckets.closed,
          unmarked: comparisonModel.buckets.unmarked,
        };
      }

      const rows = Object.values(comparisonModel.buckets).flat();
      return {
        open: rows.filter((row) => !row.closed && row.pill.status !== "met"),
        newIssues: [],
        closed: rows.filter((row) => row.closed || row.pill.status === "met"),
        unmarked: [],
      };
    },
    [comparisonModel, simplifyComparisonStatus],
  );
  const comparisonSectionStats = useMemo(
    () => ({
      open: summariseComparisonRows(comparisonSections.open),
      newIssues: summariseComparisonRows(comparisonSections.newIssues),
      closed: summariseComparisonRows(comparisonSections.closed),
      unmarked: summariseComparisonRows(comparisonSections.unmarked),
    }),
    [comparisonSections],
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

  // R3 DI-18: undo helpers use the V6 Orbit toast plus per-row 30s undo affordance.
  const [recentlyClosed, setRecentlyClosed] = useState<Record<string, number>>({});
  const closeWithUndo = (id: string, label: string, prev: ClosureDecision | undefined) => {
    if (!rightVersion) return;
    decisions.setClosure(supplierId, decisionContractId, id, rightVersion.version, "closed");
    decisions.patchClauseState(supplierId, decisionContractId, id, { acceptedClosed: true });
    setRecentlyClosed((m) => ({ ...m, [id]: Date.now() + 30_000 }));
    toast({
      title: `Closed "${label}" for ${rightVersion.version}`,
      description: "You can undo for 30 seconds.",
      duration: 8000,
      action: {
        label: "Undo",
        onClick: () => {
          decisions.setClosure(supplierId, decisionContractId, id, rightVersion.version, prev ?? "keep-open");
          decisions.patchClauseState(supplierId, decisionContractId, id, { acceptedClosed: false });
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
    decisions.patchClauseState(supplierId, decisionContractId, id, { acceptedClosed: false });
    setRecentlyClosed((m) => { const n = { ...m }; delete n[id]; return n; });
  };

  const recordAudit = (clauseId: string, entry: string) => {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      clauseId,
      entry,
    };
    setSessionAuditLog((current) => [...current, auditEntry]);
    decisions.patchClauseState(supplierId, decisionContractId, clauseId, (state) => ({
      auditLog: [...(state.auditLog ?? []), auditEntry],
    }));
  };

  const confirmVerdict = (clauseId: string, verdict: ClauseVerdict) => {
    const version = rightVersion?.version ?? "v1";
    decisions.patchClauseState(supplierId, decisionContractId, clauseId, {
      verdictConfirmations: {
        ...stateOf(clauseId).verdictConfirmations,
        [version]: {
          verdict,
          confirmedBy: CURRENT_USER_LABEL,
          confirmedAt: new Date().toISOString(),
        },
      },
    });
    recordAudit(clauseId, `Verdict confirmed: ${verdictLabel(verdict)}`);
  };

  const supersedeVerdict = (clauseId: string, original: ClauseVerdict, comment: string) => {
    const version = rightVersion?.version ?? "v1";
    const next: ClauseVerdict = original === "met" ? "notmet" : "met";
    decisions.patchClauseState(supplierId, decisionContractId, clauseId, {
      verdictConfirmations: {
        ...stateOf(clauseId).verdictConfirmations,
        [version]: {
          verdict: next,
          originalVerdict: original,
          confirmedBy: CURRENT_USER_LABEL,
          confirmedAt: new Date().toISOString(),
          overrideComment: comment,
        },
      },
    });
    recordAudit(clauseId, `Verdict superseded: ${verdictLabel(original)} → ${verdictLabel(next)} — "${comment}"`);
  };

  const reviseTarget = (clauseId: string, text: string, reason?: string) => {
    const state = stateOf(clauseId);
    const latestRequest = getLatestRequest(state, leftVersion?.version ?? "v1")?.request;
    const currentTargets = targetVersionsForClause(state, latestRequest);
    const nextVersion = currentTargets.length + 1;
    const target: ClauseTargetVersion = {
      version: nextVersion,
      text: text.trim(),
      reason: reason?.trim() || undefined,
      round: nextVersion,
      createdAt: new Date().toISOString(),
    };
    decisions.patchClauseState(supplierId, decisionContractId, clauseId, {
      targetVersions: [...currentTargets, target],
    });
    recordAudit(clauseId, `Round ${target.round} target set (v${target.version}): ${target.text}${target.reason ? ` — ${target.reason}` : ""}`);
  };

  const confirmVerdictFromAction = (clauseId: string, verdict: ClauseVerdict | null | undefined, action: string) => {
    if (!verdict) {
      recordAudit(clauseId, action);
      return;
    }
    const version = rightVersion?.version ?? "v1";
    const existing = stateOf(clauseId).verdictConfirmations?.[version];
    if (!existing) {
      decisions.patchClauseState(supplierId, decisionContractId, clauseId, {
        verdictConfirmations: {
          ...stateOf(clauseId).verdictConfirmations,
          [version]: {
            verdict,
            confirmedBy: CURRENT_USER_LABEL,
            confirmedAt: new Date().toISOString(),
          },
        },
      });
    }
    recordAudit(clauseId, `${action}. Verdict context accepted: ${verdictLabel(verdict)}.`);
  };

  const simulateSupplierResponse = (clauseId: string) => {
    decisions.patchClauseState(supplierId, decisionContractId, clauseId, {
      simulatedMet: true,
      verdictConfirmations: {
        ...stateOf(clauseId).verdictConfirmations,
        [rightVersion?.version ?? "v1"]: {
          verdict: "met",
          confirmedBy: "ClauseIQ demo",
          confirmedAt: new Date().toISOString(),
        },
      },
    });
    recordAudit(clauseId, "Simulated supplier response: supplier returned 30-month schedule; Met vs v2.");
  };

  const clearClosureDecision = (clauseId: string, version: string) => {
    decisions.patchClauseState(supplierId, decisionContractId, clauseId, (state) => {
      if (!state.closures?.[version]) return {};
      const nextClosures = { ...state.closures };
      delete nextClosures[version];
      return { closures: nextClosures };
    });
  };

  const continueWithActionability = (clauseId: string, request: ClauseRequest) => {
    const version = rightVersion?.version ?? "v1";
    const requestedChange = request.requestedChange?.trim();
    if (!requestedChange) return;
    const pill = changePillFor(
      clauseId,
      leftVersion?.clauses.find((clause) => clause.id === clauseId),
      rightVersion?.clauses.find((clause) => clause.id === clauseId),
    );
    confirmVerdictFromAction(
      clauseId,
      effectiveVerdict(stateOf(clauseId), version, pill.status),
      "Continued with actionability",
    );
    clearClosureDecision(clauseId, version);
    decisions.patchClauseState(supplierId, decisionContractId, clauseId, { acceptedClosed: false });
    decisions.acceptRequest(supplierId, decisionContractId, clauseId, version, {
      requestedChange,
      rationale: request.rationale?.trim() || undefined,
    });
  };

  const acceptAndClose = (clauseId: string) => {
    const pill = changePillFor(
      clauseId,
      leftVersion?.clauses.find((clause) => clause.id === clauseId),
      rightVersion?.clauses.find((clause) => clause.id === clauseId),
    );
    confirmVerdictFromAction(clauseId, effectiveVerdict(stateOf(clauseId), rightVersion?.version ?? "v1", pill.status), "Accepted supplier wording");
    decisions.setClosure(supplierId, decisionContractId, clauseId, rightVersion?.version ?? "v1", "closed");
    decisions.patchClauseState(supplierId, decisionContractId, clauseId, { acceptedClosed: true });
  };

  const simulateRegression = (clauseId: string) => {
    decisions.setClosure(supplierId, decisionContractId, clauseId, rightVersion?.version ?? "v1", "keep-open");
    decisions.patchClauseState(supplierId, decisionContractId, clauseId, {
      alteredAfterAgreement: true,
      acceptedClosed: false,
      verdictConfirmations: {
        ...stateOf(clauseId).verdictConfirmations,
        [rightVersion?.version ?? "v1"]: {
          verdict: "notmet",
          confirmedBy: "ClauseIQ demo",
          confirmedAt: new Date().toISOString(),
        },
      },
    });
    recordAudit(clauseId, "Regression guard caught a supplier redline after agreement and reopened the clause.");
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
  const quickMissingClauseFilter = quickFilter === "missing";
  const quickNoneDeviationFilter = quickFilter === "none";
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
    if ((next === "missing" || next === "none") && !isClearing) {
      setFilter("all");
    }
    if (next === "manual-review") {
      setTab("changes");
      setFilter("all");
    }
    if (
      next === "met" ||
      next === "not-met" ||
      next === "worsened" ||
      next === "unexpected"
    ) {
      setTab("changes");
      setFilter("all");
    }
  };
  const selectEvidenceMetric = (metric: EvidenceMetricKey) => {
    toggleQuickFilter(metric);
  };
  const showMoreChanges = () => {
    setTab("changes");
    setFilter(simplifyComparisonStatus ? "open" : "new-issues");
    setQuickFilter(null);
    setTimeout(() => {
      document.getElementById("comparison-buckets")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  const matchesQuickSeverity = (clause?: ClauseResult) =>
    !severityQuickFilter || clause?.severity === severityQuickFilter;
  const filterRowsByQuickState = <T extends { id: string; prev?: ClauseResult; curr?: ClauseResult; pill?: ChangePillResult; actionState?: string }>(rows: T[]) =>
    rows.filter((row) => {
      const clause = row.curr ?? row.prev;
      if (severityQuickFilter && !matchesQuickSeverity(clause)) return false;
      if (quickMissingClauseFilter && !(clause && isMissingClause(clause))) return false;
      if (quickNoneDeviationFilter && !(clause && isNoneDeviationClause(clause))) return false;
      if (quickFilter === "met") {
        if (simplifyComparisonStatus) {
          const treatedAsMet = "closed" in row ? Boolean(row.closed) || row.pill?.status === "met" : row.pill?.status === "met";
          if (!treatedAsMet) return false;
        } else if (row.pill?.status !== "met") return false;
      }
      if (quickFilter === "not-met") {
        if (simplifyComparisonStatus) {
          const treatedAsNotMet = !("closed" in row && row.closed) && row.pill?.status !== "met";
          if (!treatedAsNotMet) return false;
        } else if (row.pill?.status !== "not_met" && row.pill?.status !== "improved") return false;
      }
      if (quickFilter === "worsened" && row.pill?.status !== "regressed") return false;
      if (quickFilter === "unexpected" && row.pill?.status !== "new") return false;
      if (quickFilter === "manual-review" && row.actionState !== "unreviewed") return false;
      return true;
    });

  const openRows = sortOutcomeComparisonRows(filterRowsByQuickState(
    comparisonSections.open.filter((r) => matchesSearch(r.id) && matchesCategory(r.id)),
  ));
  const newIssueRows = sortOutcomeComparisonRows(filterRowsByQuickState(
    comparisonSections.newIssues.filter((r) => matchesSearch(r.id) && matchesCategory(r.id)),
  ));
  const closedRows = sortOutcomeComparisonRows(filterRowsByQuickState(
    comparisonSections.closed.filter((r) => matchesSearch(r.id) && matchesCategory(r.id)),
  ));
  const unmarkedRows = sortOutcomeComparisonRows(filterRowsByQuickState(
    comparisonSections.unmarked.filter((r) => matchesSearch(r.id) && matchesCategory(r.id)),
  ));
  const showOpenSection =
    (filter === "all" || filter === "open") &&
    quickFilter !== "changes" &&
    quickFilter !== "met";
  const showNewIssueSection =
    !simplifyComparisonStatus &&
    (filter === "all" || filter === "new-issues") &&
    (quickFilter === null || quickFilter === "need-action" || quickFilter === "changes" || !!severityQuickFilter);
  const showClosedSection =
    (filter === "all" || filter === "closed") &&
    quickFilter !== "need-action" &&
    quickFilter !== "changes" &&
    quickFilter !== "open-items";
  const showUnmarkedSection =
    !simplifyComparisonStatus &&
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
  const firstAnalysisNoneSelected = firstAnalysisMetricFilters.has("none");
  const firstAnalysisHasMetricFilters = firstAnalysisMetricFilters.size > 0;
  const matchesFirstAnalysisMetricFilter = (clause: ClauseResult) => {
    if (!firstAnalysisHasMetricFilters) return true;
    return (
      (firstAnalysisSelectedSeverities.has(clause.severity) && countsTowardDeviationMetric(clause)) ||
      (firstAnalysisMissingSelected && firstAnalysisMissingClauseIds.has(clause.id)) ||
      (firstAnalysisNoneSelected && isNoneDeviationClause(clause))
    );
  };
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
    if (!matchesFirstAnalysisMetricFilter(clause)) return false;
    const showNoneDeviationClause = firstAnalysisNoneSelected && isNoneDeviationClause(clause);
    if (!showNoneDeviationClause && !isFirstAnalysisReviewClause(clause)) return false;
    if (designOption !== "row-scale" && !showNoneDeviationClause && hasFirstAnalysisAction(clause.id)) return false;
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
    noneDeviation: firstAnalysisCategoryClauses.filter(isNoneDeviationClause).length,
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
    notMet: simplifyComparisonStatus
      ? categoryOpenRows.length
      : categoryAllRows.filter((row) => row.pill.status === "not_met" || row.pill.status === "improved").length,
    met: simplifyComparisonStatus
      ? categoryClosedRows.length
      : categoryAllRows.filter((row) => row.pill.status === "met").length,
    worsened: simplifyComparisonStatus ? 0 : categoryAllRows.filter((row) => row.pill.status === "regressed").length,
    unexpected: simplifyComparisonStatus ? 0 : categoryAllRows.filter((row) => row.pill.status === "new").length,
    manualReview: simplifyComparisonStatus ? 0 : categoryAllRows.filter((row) => row.actionState === "unreviewed").length,
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
    missingClauses: categoryAllRows.filter((row) => {
      const clause = row.curr ?? row.prev;
      return clause ? isMissingClause(clause) : false;
    }).length,
    noneDeviation: categoryAllRows.filter((row) => {
      const clause = row.curr ?? row.prev;
      return clause ? isNoneDeviationClause(clause) : false;
    }).length,
  };
  const designOpenRows = sortOutcomeComparisonRows(filterRowsByQuickState(
    categoryOpenRows,
  ));
  const designNewIssueRows = sortOutcomeComparisonRows(filterRowsByQuickState(
    categoryNewIssueRows,
  ));
  const designClosedRows = sortOutcomeComparisonRows(filterRowsByQuickState(
    categoryClosedRows,
  ));
  const designUnmarkedRows = sortOutcomeComparisonRows(filterRowsByQuickState(
    categoryUnmarkedRows,
  ));
  const activeEvidenceMetric: EvidenceMetricKey | null =
    quickFilter === "not-met" ||
    quickFilter === "met" ||
    quickFilter === "worsened" ||
    quickFilter === "unexpected" ||
    quickFilter === "manual-review" ||
    quickFilter === "high" ||
    quickFilter === "medium" ||
    quickFilter === "low" ||
    quickFilter === "missing" ||
    quickFilter === "none"
      ? quickFilter
      : null;
  const activeMetricLabel =
    activeEvidenceMetric
      ? ({
          "not-met": "Not Met",
          met: "Met",
          worsened: "Regressed",
          unexpected: "New supplier change",
          "manual-review": "Needs decision",
          high: "High",
          medium: "Medium",
          low: "Low",
          missing: "Missing Clauses",
          none: "None Deviation",
        } satisfies Record<EvidenceMetricKey, string>)[activeEvidenceMetric]
      : null;
  const clearEvidenceMetric = () => {
    setQuickFilter(null);
    setFilter("all");
    setTab("changes");
  };
  const showDesignOpenSection = quickFilter === null || designOpenRows.length > 0;
  const showDesignNewIssueSection = !simplifyComparisonStatus && (quickFilter === null || designNewIssueRows.length > 0);
  const showDesignClosedSection = quickFilter === null || designClosedRows.length > 0;
  const showDesignUnmarkedSection = !simplifyComparisonStatus && (quickFilter === null || designUnmarkedRows.length > 0);
  const outcomeSectionCopy = outcomeReviewMode
    ? {
        openTitle: "Not Met",
        openDescription: "Clauses where the supplier has not met the target and the user needs to revise, accept, or hold position.",
        newTitle: "New supplier changes",
        newDescription: "Supplier-introduced changes that were not part of the previous target.",
        closedTitle: "Met",
        closedDescription: "Clauses where the supplier wording now meets the target or has been accepted.",
        unmarkedTitle: "Needs decision",
      }
    : {
        openTitle: "Not Met",
        openDescription: "Clauses where the supplier has not met the target and the user needs to revise, accept, or hold position.",
        newTitle: "New supplier changes",
        newDescription: "Supplier-introduced changes that were not part of the previous target.",
        closedTitle: "Met",
        closedDescription: "Clauses where the supplier wording now meets the target or has been accepted.",
        unmarkedTitle: "Needs decision",
      };
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
      none: "None Deviation",
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
  useEffect(() => {
    if (firstAnalysisAvailableRecommendationApplyOptions.length === 0 || canUndoFirstAnalysisRecommendations) {
      setNonCompactBulkBannerOpen(false);
    }
  }, [canUndoFirstAnalysisRecommendations, firstAnalysisAvailableRecommendationApplyOptions.length]);
  const outcomeRecommendationTargets =
    outcomeReviewMode && rightVersion
      ? comparisonSections.open
          .map((row): RecommendationTargetItem | null => {
            const display = row.curr ?? row.prev;
            if (!display) return null;

            const state = stateOf(row.id);
            const existingRequest = state.requests[rightVersion.version];
            if (existingRequest?.requestedChange?.trim()) return null;
            if (state.closures[rightVersion.version] === "closed") return null;

            const latestRequest = leftVersion ? getLatestRequest(state, leftVersion.version)?.request : undefined;
            const requestedChange =
              display.actionability?.trim() ||
              latestRequest?.requestedChange?.trim();
            if (!requestedChange) return null;

            return {
              id: row.id,
              clauseTitle: display.title,
              category: display.category,
              severity: display.severity,
              verdict: effectiveVerdict(state, rightVersion.version, row.pill.status) ?? undefined,
              missingClause: display.missingClause,
              sourceDeviationLevel: display.sourceDeviationLevel,
              request: {
                requestedChange,
                rationale: latestRequest?.rationale?.trim() || undefined,
              },
            };
          })
          .filter((target): target is RecommendationTargetItem => Boolean(target))
      : [];
  const outcomeRecommendationApplyOptions = buildRecommendationApplyOptions(outcomeRecommendationTargets);
  const applyOutcomeRecommendations = (targets: RecommendationTargetItem[], scope?: RecommendationApplyScopeMeta) => {
    if (!outcomeReviewMode || targets.length === 0) return;
    targets.forEach((target) => continueWithActionability(target.id, target.request));
    toast({
      title: "Best practices added to review",
      description: `${targets.length} ${scope?.toastLabel ?? "recommendation"}${targets.length === 1 ? "" : "s"} added from the outcome review. Review and generate when ready.`,
    });
  };
  const applyOutcomeRecommendationOptions = (options: RecommendationApplyOption[]) => {
    applyOutcomeRecommendations(
      mergeRecommendationApplyTargets(options),
      buildRecommendationApplyScopeMeta(options),
    );
  };
  const bulkRecommendationApplyOptions = outcomeReviewMode
    ? outcomeRecommendationApplyOptions
    : firstAnalysisRecommendationApplyOptions;
  const availableBulkRecommendationApplyOptions = bulkRecommendationApplyOptions.filter((option) => option.count > 0);
  const bulkRecommendationsDisabled = outcomeReviewMode
    ? outcomeRecommendationTargets.length === 0
    : !firstAnalysisDemo || firstAnalysisRecommendationTargets.length === 0;
  const bulkRecommendationsReviewed = outcomeReviewMode
    ? outcomeRecommendationTargets.length === 0
    : firstAnalysisRecommendationsReviewed;
  const [compactBulkBannerOpen, setCompactBulkBannerOpen] = useState(false);
  const compactBulkCanUndoAppliedRecommendations = Boolean(
    !outcomeReviewMode && firstAnalysisDemo && canUndoFirstAnalysisRecommendations,
  );
  const compactBulkRecommendationsQueued = !outcomeReviewMode && firstAnalysisDemo && firstAnalysisRecommendationsQueued;
  const compactBulkCanChooseRecommendationScope =
    mode === "comparison" &&
    !compactBulkCanUndoAppliedRecommendations &&
    !compactBulkRecommendationsQueued &&
    !bulkRecommendationsReviewed &&
    !bulkRecommendationsDisabled &&
    availableBulkRecommendationApplyOptions.length > 0;
  useEffect(() => {
    if (!compactHeader || !compactBulkCanChooseRecommendationScope) {
      setCompactBulkBannerOpen(false);
    }
  }, [compactBulkCanChooseRecommendationScope, compactHeader]);
  const applyAllRecommendations = (targets: RecommendationTargetItem[], scope?: RecommendationApplyScopeMeta) => {
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
  const applyRecommendationOptions = (options: RecommendationApplyOption[]) => {
    applyAllRecommendations(
      mergeRecommendationApplyTargets(options),
      buildRecommendationApplyScopeMeta(options),
    );
  };
  const compactBulkBanner =
    compactHeader && compactBulkCanChooseRecommendationScope && compactBulkBannerOpen ? (
      <RecommendationBulkApplyBanner
        options={availableBulkRecommendationApplyOptions}
        onApply={(options) => {
          if (outcomeReviewMode) {
            applyOutcomeRecommendationOptions(options);
          } else {
            applyRecommendationOptions(options);
          }
          setCompactBulkBannerOpen(false);
        }}
        onClose={() => setCompactBulkBannerOpen(false)}
      />
    ) : null;
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
      description: `${firstAnalysisUndoableRecommendationIds.length} recommendation${firstAnalysisUndoableRecommendationIds.length === 1 ? "" : "s"} removed. Existing custom requests and Hold my position choices were left unchanged.`,
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
      quickNoneDeviationFilter={firstAnalysisNoneSelected}
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
      banner={compactBulkBanner}
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
      banner={compactBulkBanner}
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
      simplifyStatusMetrics={simplifyComparisonStatus}
      openItems={
        <ComparisonSection
          title={outcomeSectionCopy.openTitle}
          description={outcomeSectionCopy.openDescription}
          accent="destructive"
          rows={designOpenRows}
          leftLabel={leftVersion.version}
          rightLabel={rightVersion.version}
          visible={showDesignOpenSection}
          bucket="open"
          stats={comparisonSectionStats.open}
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
          onContinueWithActionability={continueWithActionability}
          onReopenAcceptedDecision={(id) => {
            clearClosureDecision(id, rightVersion.version);
            decisions.patchClauseState(supplierId, decisionContractId, id, { acceptedClosed: false });
          }}
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
          onConfirmVerdictFromAction={confirmVerdictFromAction}
          stateOf={stateOf}
          pinnedIds={pinnedClauseIds}
          onTogglePin={togglePin}
          recentlyClosed={recentlyClosed}
          onUndoClose={undoClose}
          layout="plain"
          overrideVerdict={simplifyComparisonStatus ? "notmet" : undefined}
        />
      }
      newChanges={
        <ComparisonSection
          title={outcomeSectionCopy.newTitle}
          description={outcomeSectionCopy.newDescription}
          accent="primary"
          rows={designNewIssueRows}
          leftLabel={leftVersion.version}
          rightLabel={rightVersion.version}
          visible={showDesignNewIssueSection}
          bucket="new"
          stats={comparisonSectionStats.newIssues}
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
          onConfirmVerdictFromAction={confirmVerdictFromAction}
          stateOf={stateOf}
          pinnedIds={pinnedClauseIds}
          onTogglePin={togglePin}
          layout="plain"
          overrideVerdict={simplifyComparisonStatus ? "notmet" : undefined}
        />
      }
      closedItems={
        <ComparisonSection
          title={outcomeSectionCopy.closedTitle}
          description={outcomeSectionCopy.closedDescription}
          accent="success"
          rows={designClosedRows}
          leftLabel={leftVersion.version}
          rightLabel={rightVersion.version}
          visible={showDesignClosedSection}
          bucket="closed"
          stats={comparisonSectionStats.closed}
          closureOf={(id) => stateOf(id).closures[rightVersion.version]}
          requestOf={(id) => {
            const latest = getLatestRequest(stateOf(id), leftVersion.version);
            return latest ? { ...latest.request, fromVersion: latest.version } : {};
          }}
          basketRequestOf={(id) => stateOf(id).requests[rightVersion.version]}
          draftOf={(id) => stateOf(id).draftRequests?.[rightVersion.version] ?? {}}
          onClose={acceptAndClose}
          onKeepOpen={(id) => decisions.setClosure(supplierId, decisionContractId, id, rightVersion.version, "keep-open")}
          onContinueWithActionability={continueWithActionability}
          onReopenAcceptedDecision={(id) => {
            clearClosureDecision(id, rightVersion.version);
            decisions.patchClauseState(supplierId, decisionContractId, id, { acceptedClosed: false });
          }}
          onFollowUp={(id) => decisions.startDraftRequest(supplierId, decisionContractId, id, rightVersion.version)}
          onUpdateText={(id, patch) => decisions.updateDraftRequestText(supplierId, decisionContractId, id, rightVersion.version, patch)}
          onCancelDraft={(id) => decisions.cancelDraftRequest(supplierId, decisionContractId, id, rightVersion.version)}
          onSubmitDraft={(id) => {
            decisions.submitDraftRequest(supplierId, decisionContractId, id, rightVersion.version);
            decisions.setClosure(supplierId, decisionContractId, id, rightVersion.version, "follow-up");
          }}
          onRemoveRequest={(id) => decisions.removePendingRequest(supplierId, decisionContractId, id, rightVersion.version)}
          onOpenDetail={setDetailClauseId}
          onConfirmVerdictFromAction={confirmVerdictFromAction}
          stateOf={stateOf}
          pinnedIds={pinnedClauseIds}
          onTogglePin={togglePin}
          layout="plain"
          overrideVerdict={simplifyComparisonStatus ? "met" : undefined}
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
  const outcomeReviewContent = null;
  const signoffItems = [
    ...designOpenRows,
    ...designNewIssueRows,
    ...designClosedRows,
  ].map((row) => {
    const display = row.curr ?? row.prev;
    const state = stateOf(row.id);
    return {
      id: row.id,
      title: displayTitleForClause(row.id, display?.title ?? row.id.toUpperCase()),
      status: state.closures[rightVersion?.version ?? "v1"] === "follow-up" ? "escalated" : effectiveVerdict(state, rightVersion?.version ?? "v1", row.pill.status) ?? "notmet",
      note: signoffNotes[row.id] ?? "",
      resolved: signoffResolved.has(row.id) || state.closures[rightVersion?.version ?? "v1"] === "closed",
    };
  });
  const outstandingSignoffItems = signoffItems.filter((item) => !item.resolved);

  return (
    <div className="min-h-screen">
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
            onApplyAllRecommendations={() =>
              outcomeReviewMode
                ? applyOutcomeRecommendations(outcomeRecommendationTargets)
                : applyAllRecommendations(firstAnalysisRecommendationTargets)
            }
            onApplyRecommendationOptions={outcomeReviewMode ? applyOutcomeRecommendationOptions : applyRecommendationOptions}
            onUndoAllRecommendations={outcomeReviewMode ? undefined : undoAppliedRecommendations}
            applyAllRecommendationsDisabled={bulkRecommendationsDisabled}
            applyAllRecommendationsQueued={!outcomeReviewMode && firstAnalysisDemo && firstAnalysisRecommendationsQueued}
            applyAllRecommendationsReviewed={bulkRecommendationsReviewed}
            applyAllRecommendationsUndoable={!outcomeReviewMode && firstAnalysisDemo && canUndoFirstAnalysisRecommendations}
            recommendationApplyOptions={bulkRecommendationApplyOptions}
            undoRecommendationCount={firstAnalysisUndoRecommendationCount}
            undoRecommendationScopeLabel={bulkAppliedRecommendationScopeLabel}
            onReviewGenerate={() => setRequestReviewOpen(true)}
            reviewGenerateDisabled={reviewGenerateDisabled}
            requestCount={reviewGenerateItems.length}
            bulkBannerOpen={compactBulkBannerOpen}
            onBulkBannerOpenChange={setCompactBulkBannerOpen}
            suppressBulkBannerRender={compactHeader}
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
                <div
                  className={cn(
                    "flex flex-wrap items-center justify-start gap-orbit-s sm:justify-end",
                    isResponsiveTestingRoute && "clauseiq-responsive-dashboard-actions",
                  )}
                >
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
                      <Button
                        variant="outline"
                        className={cn(
                          "h-9 gap-orbit-xs bg-white clauseiq-v6-recommendation-bulk-trigger",
                          isResponsiveTestingRoute && "clauseiq-responsive-apply-trigger",
                        )}
                        aria-label="Bulk Apply Recommendation"
                        aria-expanded={nonCompactBulkBannerOpen}
                        aria-controls="clauseiq-v6-recommendation-bulk-banner"
                        onClick={() => setNonCompactBulkBannerOpen((current) => !current)}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Bulk Apply Recommendation</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </Button>
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
                    Review &amp; Generate{reviewGenerateItems.length > 0 ? ` (${reviewGenerateItems.length})` : ""}
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
              {firstAnalysisDemo && mode === "comparison" && firstAnalysisAvailableRecommendationApplyOptions.length > 0 && nonCompactBulkBannerOpen && (
                <div className="mt-orbit-s overflow-hidden rounded-md">
                  <RecommendationBulkApplyBanner
                    options={firstAnalysisAvailableRecommendationApplyOptions}
                    onApply={applyRecommendationOptions}
                    onClose={() => setNonCompactBulkBannerOpen(false)}
                  />
                </div>
              )}
              <div className="mt-orbit-s grid gap-orbit-base lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px] lg:items-end">
                <div className="min-w-0">
                  <p className="text-xs v6-orbit-weight-semibold text-muted-foreground uppercase tracking-wider">
                    {initiative.name} · {initiative.reference} · {supplier.name}
                  </p>
                  <div className="mt-orbit-xs flex flex-wrap items-center gap-x-orbit-base gap-y-orbit-s">
                    <h1 className="v6-orbit-heading-3">{contract.name}</h1>
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
                      Use the <span className="v6-orbit-weight-semibold text-foreground">Review</span> tab to mark which clauses need to change, then switch to <span className="v6-orbit-weight-semibold text-foreground">Changes</span> to see how the supplier responded.
                    </p>
                  )}
                </div>

                <div className="w-full rounded-lg border border-border bg-muted/30 px-orbit-base py-orbit-base">
                  <div className="flex flex-wrap items-center justify-between gap-orbit-s">
                    <p className="text-[11px] v6-orbit-weight-semibold uppercase tracking-wider text-muted-foreground">Review summary</p>
                    {versions.length >= 2 && (
                      <p className="text-xs text-muted-foreground">
                        <span className="v6-orbit-weight-semibold text-foreground">{clausesRequiringAction}</span>{" "}
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
      {outcomeReviewContent}
      {signoffOpen && (
        <SignoffView
          items={signoffItems}
          outstandingCount={outstandingSignoffItems.length}
          auditLog={sessionAuditLog}
          auditPackOpen={auditPackOpen}
          onClose={() => setSignoffOpen(false)}
          onResolve={(id) => {
            setSignoffResolved((current) => new Set(current).add(id));
            recordAudit(id, "Sign-off row marked resolved.");
          }}
          onNoteChange={(id, note) => setSignoffNotes((current) => ({ ...current, [id]: note }))}
          onSaveNote={(id) => {
            const note = signoffNotes[id]?.trim();
            if (!note) {
              toast({ title: "Capture the outcome first", description: "The audit pack needs it." });
              return;
            }
            setSignoffResolved((current) => new Set(current).add(id));
            recordAudit(id, `Off-platform resolution note: ${note}`);
          }}
          onExport={() => setAuditPackOpen(true)}
        />
      )}

      {/* Verdict banner — only when at least 2 versions exist */}
      {!signoffOpen && !compactHeader && versions.length >= 2 && leftVersion && rightVersion && leftVersion.version !== rightVersion.version && (
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
              setFilter(simplifyComparisonStatus ? "open" : "new-issues");
              setTimeout(() => document.getElementById("comparison-buckets")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
            }}
          />
        </div>
      )}

      {/* Negotiation trend strip — V1 → Vn (TASK-07) */}
      {!signoffOpen && !compactHeader && versions.length >= 2 && (
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

      {!signoffOpen && (mode === "history" && firstAnalysisDemo ? (
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
                  simplifyOutcomeStatus={simplifyComparisonStatus}
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
                  simplifyOutcomeStatus={simplifyComparisonStatus}
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
                  title={outcomeSectionCopy.openTitle}
                  description={outcomeSectionCopy.openDescription}
                  accent="destructive"
                  rows={openRows}
                  leftLabel={leftVersion.version}
                  rightLabel={rightVersion.version}
                  visible={showOpenSection}
                  bucket="open"
                  stats={comparisonSectionStats.open}
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
                  onContinueWithActionability={continueWithActionability}
                  onReopenAcceptedDecision={(id) => {
                    clearClosureDecision(id, rightVersion.version);
                    decisions.patchClauseState(supplierId, decisionContractId, id, { acceptedClosed: false });
                  }}
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
                  onConfirmVerdictFromAction={confirmVerdictFromAction}
                  pinnedIds={pinnedClauseIds}
                  onTogglePin={togglePin}
                  recentlyClosed={recentlyClosed}
                  onUndoClose={undoClose}
                  overrideVerdict={simplifyComparisonStatus ? "notmet" : undefined}
                />
                <ComparisonSection
                  title={outcomeSectionCopy.newTitle}
                  description={outcomeSectionCopy.newDescription}
                  accent="primary"
                  rows={newIssueRows}
                  leftLabel={leftVersion.version}
                  rightLabel={rightVersion.version}
                  visible={showNewIssueSection}
                  bucket="new"
                  stats={comparisonSectionStats.newIssues}
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
                  onConfirmVerdictFromAction={confirmVerdictFromAction}
                  pinnedIds={pinnedClauseIds}
                  onTogglePin={togglePin}
                  overrideVerdict={simplifyComparisonStatus ? "notmet" : undefined}
                />
                <ComparisonSection
                  title={outcomeSectionCopy.closedTitle}
                  description={outcomeSectionCopy.closedDescription}
                  accent="success"
                  rows={closedRows}
                  leftLabel={leftVersion.version}
                  rightLabel={rightVersion.version}
                  visible={showClosedSection}
                  bucket="closed"
                  stats={comparisonSectionStats.closed}
                  closureOf={(id) => stateOf(id).closures[rightVersion.version]}
                  requestOf={(id) => {
                    const latest = getLatestRequest(stateOf(id), leftVersion.version);
                    return latest ? { ...latest.request, fromVersion: latest.version } : {};
                  }}
                  basketRequestOf={(id) => stateOf(id).requests[rightVersion.version]}
                  draftOf={(id) => stateOf(id).draftRequests?.[rightVersion.version] ?? {}}
                  onClose={acceptAndClose}
                  onKeepOpen={(id) => decisions.setClosure(supplierId, decisionContractId, id, rightVersion.version, "keep-open")}
                  onContinueWithActionability={continueWithActionability}
                  onReopenAcceptedDecision={(id) => {
                    clearClosureDecision(id, rightVersion.version);
                    decisions.patchClauseState(supplierId, decisionContractId, id, { acceptedClosed: false });
                  }}
                  onFollowUp={(id) => decisions.startDraftRequest(supplierId, decisionContractId, id, rightVersion.version)}
                  onUpdateText={(id, patch) => decisions.updateDraftRequestText(supplierId, decisionContractId, id, rightVersion.version, patch)}
                  onCancelDraft={(id) => decisions.cancelDraftRequest(supplierId, decisionContractId, id, rightVersion.version)}
                  onSubmitDraft={(id) => {
                    decisions.submitDraftRequest(supplierId, decisionContractId, id, rightVersion.version);
                    decisions.setClosure(supplierId, decisionContractId, id, rightVersion.version, "follow-up");
                  }}
                  onRemoveRequest={(id) => decisions.removePendingRequest(supplierId, decisionContractId, id, rightVersion.version)}
                  onOpenDetail={setDetailClauseId}
                  onConfirmVerdictFromAction={confirmVerdictFromAction}
                  pinnedIds={pinnedClauseIds}
                  onTogglePin={togglePin}
                  overrideVerdict={simplifyComparisonStatus ? "met" : undefined}
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
      ))}

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
          simplifyOutcomeStatus={simplifyComparisonStatus}
          changePill={changePillFor(detail.id, detail.prev, detail.curr)}
          onConfirmVerdict={confirmVerdict}
          onSupersedeVerdict={supersedeVerdict}
          onReviseTarget={reviseTarget}
          onSimulateSupplierResponse={simulateSupplierResponse}
          onAcceptAndClose={acceptAndClose}
          onSimulateRegression={simulateRegression}
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
        requests={reviewGenerateItems}
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

      <V6OrbitConfirmOverlay
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

      <V6OrbitConfirmOverlay
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
    <V6OrbitOverlay
      open={open}
      onOpenChange={onOpenChange}
      title="Upload Contract Version"
      description="Upload the supplier's updated contract to compare changes against the previous version."
      footer={
        <div className="flex justify-end gap-orbit-s">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!file || !label || processing} className="gap-orbit-xs">
            {processing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing…</> : <><Upload className="w-3.5 h-3.5" /> Upload &amp; Analyse</>}
          </Button>
        </div>
      }
    >
        <div className="space-y-orbit-base">
          <div className="rounded-md border border-border bg-muted/30 p-orbit-base text-xs space-y-orbit-xs">
            <p><span className="text-muted-foreground">Initiative:</span> <span className="v6-orbit-weight-medium text-foreground"> {initiativeName} · {initiativeRef}</span></p>
            <p><span className="text-muted-foreground">Supplier:</span> <span className="v6-orbit-weight-medium text-foreground"> {supplierName}</span></p>
            <p><span className="text-muted-foreground">Contract:</span> <span className="v6-orbit-weight-medium text-foreground"> {contractName}</span></p>
          </div>
          <div className="space-y-orbit-xs">
            <label className="text-[11px] v6-orbit-weight-semibold text-muted-foreground uppercase">Version label</label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} className="h-9" />
          </div>
          <div className="space-y-orbit-xs">
            <label className="text-[11px] v6-orbit-weight-semibold text-muted-foreground uppercase">Contract file</label>
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
    </V6OrbitOverlay>
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
        className="inline-flex shrink-0 items-center gap-orbit-xs text-[13px] v6-orbit-weight-medium text-primary hover:underline"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> {backLabel}
      </button>
      <div className="h-3.5 w-px bg-border" aria-hidden />
      <div className="flex min-w-0 flex-1 items-center gap-orbit-s">
        <h1 className="v6-orbit-heading-label min-w-0 truncate text-foreground">{referenceLine}</h1>
      </div>
      {demoAvailable && !isInitiativesV6Route() && (
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
        "ml-auto inline-flex h-7 shrink-0 items-center gap-orbit-s rounded-md border px-orbit-s text-[11px] v6-orbit-weight-medium transition-colors",
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
    <section>
      <div className="mx-auto w-full max-w-[1500px] px-orbit-base pt-orbit-base pb-orbit-none">
        <div className="rounded-lg border border-border bg-card px-orbit-base py-orbit-base shadow-sm">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-orbit-s">
              <h2 className="v6-orbit-heading-5">
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

function OutcomeReviewContextBanner({
  supplierName,
}: {
  supplierName: string;
}) {
  return (
    <section aria-label="Outcome Review">
      <div className="mx-auto w-full max-w-[1500px] px-orbit-base pt-orbit-base pb-orbit-none">
        <Card type="Static" padding="Base" state="Accent">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-orbit-s">
              <Headings size="Heading 4">Outcome Review</Headings>
              <Badge label={supplierName} status="Information" />
            </div>
            <Text as="p" size="Small" variant="Secondary">
              Comparing the previous supplier output with the latest negotiated output.
            </Text>
          </div>
        </Card>
      </div>
    </section>
  );
}

function OutcomeMetric({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string | number;
  detail: string;
  tone: "success" | "warning" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "text-[var(--orbit-color-text-success)]"
      : tone === "warning"
        ? "text-[var(--orbit-color-text-warning)]"
        : "text-[var(--orbit-color-text-error)]";

  return (
    <div className="rounded-md border border-border bg-white px-orbit-base py-orbit-s">
      <Text as="p" size="Small" variant="Secondary">{label}</Text>
      <p className={cn("mt-orbit-xxs text-xl v6-orbit-weight-semibold leading-none", toneClass)}>{value}</p>
      <p className="mt-orbit-xs text-[11px] leading-4 text-muted-foreground">{detail}</p>
    </div>
  );
}

function ModeSwitcher({
  mode,
  onChange,
  comparisonLabel = "Review",
  onApplyAllRecommendations,
  onApplyRecommendationOptions,
  onUndoAllRecommendations,
  applyAllRecommendationsDisabled = true,
  applyAllRecommendationsQueued = false,
  applyAllRecommendationsReviewed = false,
  applyAllRecommendationsUndoable = false,
  recommendationApplyOptions = [],
  undoRecommendationCount = 0,
  undoRecommendationScopeLabel,
  onReviewGenerate,
  reviewGenerateDisabled,
  requestCount,
  bulkBannerOpen: controlledBulkBannerOpen,
  onBulkBannerOpenChange,
  suppressBulkBannerRender = false,
}: {
  mode: ClauseIqMode;
  onChange: (mode: ClauseIqMode) => void;
  comparisonLabel?: string;
  onApplyAllRecommendations?: () => void;
  onApplyRecommendationOptions?: (options: RecommendationApplyOption[]) => void;
  onUndoAllRecommendations?: () => void;
  applyAllRecommendationsDisabled?: boolean;
  applyAllRecommendationsQueued?: boolean;
  applyAllRecommendationsReviewed?: boolean;
  applyAllRecommendationsUndoable?: boolean;
  recommendationApplyOptions?: RecommendationApplyOption[];
  undoRecommendationCount?: number;
  undoRecommendationScopeLabel?: string | null;
  onReviewGenerate: () => void;
  reviewGenerateDisabled: boolean;
  requestCount: number;
  bulkBannerOpen?: boolean;
  onBulkBannerOpenChange?: (open: boolean) => void;
  suppressBulkBannerRender?: boolean;
}) {
  const canUndoAppliedRecommendations = Boolean(
    applyAllRecommendationsUndoable && onUndoAllRecommendations,
  );
  const [uncontrolledBulkBannerOpen, setUncontrolledBulkBannerOpen] = useState(false);
  const bulkBannerOpen = controlledBulkBannerOpen ?? uncontrolledBulkBannerOpen;
  const setBulkBannerOpen = onBulkBannerOpenChange ?? setUncontrolledBulkBannerOpen;
  const applyAllButtonLabel = applyAllRecommendationsReviewed
    ? "All recommendations reviewed"
    : canUndoAppliedRecommendations
    ? `${undoRecommendationScopeLabel ? `Undo ${undoRecommendationScopeLabel} recommendations` : "Undo recommendations"}${undoRecommendationCount > 0 ? ` (${undoRecommendationCount})` : ""}`
    : applyAllRecommendationsQueued
    ? "Recommendations added to review"
    : "Bulk Apply Recommendation";
  const availableRecommendationApplyOptions = recommendationApplyOptions.filter((option) => option.count > 0);
  const canChooseRecommendationScope =
    Boolean(onApplyRecommendationOptions) &&
    !canUndoAppliedRecommendations &&
    !applyAllRecommendationsQueued &&
    !applyAllRecommendationsReviewed &&
    !applyAllRecommendationsDisabled &&
    availableRecommendationApplyOptions.length > 0;

  const isResponsiveTestingRoute =
    typeof window !== "undefined" && window.location.pathname.startsWith("/initiatives-responsive-testing");

  useEffect(() => {
    if (!canChooseRecommendationScope) {
      setBulkBannerOpen(false);
    }
  }, [canChooseRecommendationScope]);

  return (
    <>
      <div
        className={cn(
          "flex min-w-0 items-center gap-orbit-base border-b border-[rgba(0,0,0,0.08)] bg-white px-orbit-base py-orbit-xs",
          isResponsiveTestingRoute && "clauseiq-responsive-mode-switcher",
        )}
      >
        <div role="tablist" aria-label="Analysis mode" className="flex items-center">
          <TabButton
            active={mode === "comparison"}
            onClick={() => onChange("comparison")}
            ariaControls="clauseiq-v6-comparison-panel"
          >
            {comparisonLabel}
          </TabButton>
        </div>
        {mode === "comparison" && (
          <div
            className={cn(
              "ml-auto flex shrink-0 items-center gap-orbit-s",
              isResponsiveTestingRoute && "clauseiq-responsive-dashboard-actions",
            )}
          >
            {onApplyAllRecommendations && (
              canChooseRecommendationScope ? (
                <Button
                  variant="outline"
                  className={cn(
                    "clauseiq-v6-recommendation-bulk-trigger",
                    isResponsiveTestingRoute && "clauseiq-responsive-apply-trigger",
                  )}
                  aria-label="Bulk Apply Recommendation"
                  aria-expanded={bulkBannerOpen}
                  aria-controls="clauseiq-v6-recommendation-bulk-banner"
                  onClick={() => setBulkBannerOpen((current) => !current)}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Bulk Apply Recommendation</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
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
      {mode === "comparison" && canChooseRecommendationScope && bulkBannerOpen && !suppressBulkBannerRender && (
        <RecommendationBulkApplyBanner
          options={availableRecommendationApplyOptions}
          onApply={(options) => onApplyRecommendationOptions?.(options)}
          onClose={() => setBulkBannerOpen(false)}
        />
      )}
    </>
  );
}

interface RecommendationBulkBannerSelection {
  status: RecommendationApplyScope[];
  deviation: RecommendationApplyScope[];
  category: RecommendationApplyScope[];
}

const EMPTY_RECOMMENDATION_BULK_BANNER_SELECTION: RecommendationBulkBannerSelection = {
  status: [],
  deviation: [],
  category: [],
};

function RecommendationBulkApplyBanner({
  options,
  onApply,
  onClose,
}: {
  options: RecommendationApplyOption[];
  onApply: (options: RecommendationApplyOption[]) => void;
  onClose: () => void;
}) {
  const [selection, setSelection] = useState<RecommendationBulkBannerSelection>(
    EMPTY_RECOMMENDATION_BULK_BANNER_SELECTION,
  );
  const optionById = useMemo(() => new Map(options.map((option) => [option.id, option])), [options]);
  const allTargets = useMemo(() => mergeRecommendationApplyTargets(options), [options]);
  const statusOptions = useMemo(() => buildRecommendationBulkBannerDropdownOptions(options, "status"), [options]);
  const deviationOptions = useMemo(() => buildRecommendationBulkBannerDropdownOptions(options, "deviation"), [options]);
  const categoryOptions = useMemo(() => buildRecommendationBulkBannerDropdownOptions(options, "category"), [options]);
  const selectedTargets = useMemo(
    () => filterRecommendationTargetsForBanner(allTargets, selection),
    [allTargets, selection],
  );
  const selectedCount = selectedTargets.length;
  const addSelectedDisabled = selectedCount === 0;

  useEffect(() => {
    setSelection((current) => ({
      status: current.status.filter((id) => optionById.has(id)),
      deviation: current.deviation.filter((id) => optionById.has(id)),
      category: current.category.filter((id) => optionById.has(id)),
    }));
  }, [optionById]);

  const setSelectionGroup = (group: keyof RecommendationBulkBannerSelection, values: string[]) => {
    const validValues = values.filter((value): value is RecommendationApplyScope =>
      optionById.has(value as RecommendationApplyScope),
    );
    setSelection((current) => ({ ...current, [group]: validValues }));
  };

  const handleClose = () => {
    setSelection(EMPTY_RECOMMENDATION_BULK_BANNER_SELECTION);
    onClose();
  };

  const handleApply = () => {
    if (addSelectedDisabled) return;
    const selectedOptionIds = [
      ...selection.status,
      ...selection.deviation,
      ...selection.category,
    ];
    const selectedOption = selectedOptionIds.length === 1 ? optionById.get(selectedOptionIds[0]) : null;
    onApply([
      {
        id: "all",
        label: selectedOption?.label ?? "Selected recommendations",
        toastLabel: selectedOption?.toastLabel ?? "selected recommendation",
        undoLabel: selectedOption?.undoLabel ?? "selected",
        count: selectedCount,
        targets: selectedTargets,
      },
    ]);
    setSelection(EMPTY_RECOMMENDATION_BULK_BANNER_SELECTION);
    onClose();
  };

  return (
    <div
      id="clauseiq-v6-recommendation-bulk-banner"
      className="clauseiq-v6-recommendation-bulk-banner"
      role="region"
      aria-label="Bulk recommendation filters"
    >
      <div className="clauseiq-v6-recommendation-bulk-banner-count">{selectedCount} Selected</div>
      <div className="clauseiq-v6-recommendation-bulk-banner-controls">
        <div className="clauseiq-v6-recommendation-bulk-banner-control">
          <MultiSelectDropdown
            ariaLabel="Clause Target Status"
            placeholder="Clause Target Status"
            options={statusOptions}
            value={selection.status}
            onChange={(values) => setSelectionGroup("status", values)}
          />
        </div>
        <div className="clauseiq-v6-recommendation-bulk-banner-control">
          <MultiSelectDropdown
            ariaLabel="Deviation Level"
            placeholder="Deviation Level"
            options={deviationOptions}
            value={selection.deviation}
            onChange={(values) => setSelectionGroup("deviation", values)}
          />
        </div>
        <div className="clauseiq-v6-recommendation-bulk-banner-control">
          <MultiSelectDropdown
            ariaLabel="Clause Name"
            placeholder="Clause Name"
            options={categoryOptions}
            value={selection.category}
            onChange={(values) => setSelectionGroup("category", values)}
          />
        </div>
      </div>
      <div className="clauseiq-v6-recommendation-bulk-banner-actions">
        <Button
          variant="default"
          className="h-8 shrink-0 px-orbit-base text-xs"
          disabled={addSelectedDisabled}
          onClick={handleApply}
        >
          Add Selected
        </Button>
        <button
          type="button"
          className="clauseiq-v6-recommendation-bulk-banner-close"
          aria-label="Close bulk recommendation banner"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function buildRecommendationBulkBannerDropdownOptions(
  options: RecommendationApplyOption[],
  group: keyof RecommendationBulkBannerSelection,
) {
  return options
    .filter((option) => recommendationOptionBelongsToBannerGroup(option, group))
    .map((option) => ({
      label: recommendationBulkBannerOptionLabel(option),
      value: option.id,
    }));
}

function recommendationOptionBelongsToBannerGroup(
  option: RecommendationApplyOption,
  group: keyof RecommendationBulkBannerSelection,
) {
  if (group === "status") {
    return (
      (typeof option.id === "string" && option.id.startsWith("verdict:")) ||
      option.id === "missing"
    );
  }
  if (group === "deviation") {
    return option.id === "high" || option.id === "medium" || option.id === "low" || option.id === "none";
  }
  return typeof option.id === "string" && option.id.startsWith("category:");
}

function recommendationBulkBannerOptionLabel(option: RecommendationApplyOption) {
  if (typeof option.id === "string" && option.id.startsWith("verdict:")) {
    return option.label.replace(/^Verdict:\s*/, "");
  }
  return option.label;
}

function filterRecommendationTargetsForBanner(
  targets: RecommendationTargetItem[],
  selection: RecommendationBulkBannerSelection,
) {
  const activeGroups = [selection.status, selection.deviation, selection.category].filter((group) => group.length > 0);
  if (activeGroups.length === 0) return [];

  const seenTargetIds = new Set<string>();
  const selectedTargets: RecommendationTargetItem[] = [];

  targets.forEach((target) => {
    const matchesEverySelectedGroup = activeGroups.every((group) =>
      group.some((scope) => targetMatchesRecommendationScope(target, scope)),
    );
    if (!matchesEverySelectedGroup || seenTargetIds.has(target.id)) return;
    seenTargetIds.add(target.id);
    selectedTargets.push(target);
  });

  return selectedTargets;
}

function HistoryComingSoon() {
  return (
    <main
      id="clauseiq-v6-history-panel"
      className="grid min-h-[calc(100vh-88px)] place-items-center bg-[#F7F9FC] px-orbit-base py-orbit-xxl"
    >
      <div className="flex max-w-[420px] flex-col items-center text-center">
        <div className="grid h-12 w-12 place-items-center rounded-full border border-[#DDE5F0] bg-white text-[#185FA5] shadow-sm">
          <History className="h-5 w-5" />
        </div>
        <p className="mt-orbit-base text-[10px] v6-orbit-weight-semibold uppercase tracking-[0.12em] text-muted-foreground">
          History
        </p>
        <h1 className="v6-orbit-heading-4 mt-orbit-xs text-foreground">Coming Soon</h1>
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
      <div className="flex min-h-8 items-center gap-orbit-base border-b border-[rgba(0,0,0,0.08)] bg-[#f8f7f5] px-orbit-base py-orbit-xxs text-[11px] text-muted-foreground">
        <span className="shrink-0 text-[10px] v6-orbit-weight-medium uppercase tracking-[0.04em]">Comparing</span>
        {versions.length >= 2 ? (
          <span className="text-[10px] text-muted-foreground">
            {pair.left} to {pair.right}
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground">{contract.version || pair.right}</span>
        )}
        <span className="shrink-0 rounded px-orbit-xs py-orbit-xxs text-[10px] v6-orbit-weight-medium text-muted-foreground">
          Total Clauses - <strong className="text-foreground">{contract.total}</strong>
        </span>
        <InlineMetIndicator comparison={comparison} hasVersionComparison={hasVersionComparison} />
        <div className="ml-auto min-w-[220px] rounded-md border border-border bg-white px-orbit-s py-orbit-xxs text-[10px]">
          <div className="flex items-center">
            <span className="mr-orbit-xs uppercase text-muted-foreground">Score</span>
            <strong className="text-[13px] text-foreground">{contract.score}</strong>
            <span className={comparison.scoreDelta > 0 ? "ml-orbit-xs text-[#3B6D11]" : comparison.scoreDelta < 0 ? "ml-orbit-xs text-[#A32D2D]" : "ml-orbit-xs text-muted-foreground"}>
              {comparison.scoreDelta > 0 ? `↑+${comparison.scoreDelta}` : comparison.scoreDelta < 0 ? `↓-${Math.abs(comparison.scoreDelta)}` : "→0"}
            </span>
          </div>
          {versions.length >= 2 && (
            <div className="mt-orbit-xxs">
              <PairSelector versions={versions} pair={pair} onChange={onPairChange} compact />
            </div>
          )}
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
      <span className="text-[11px] v6-orbit-weight-medium">{label}</span>
      {!noneMet && (
        <span className="text-[10px] v6-orbit-weight-regular text-muted-foreground">
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
      <div className="flex h-8 items-center gap-orbit-xs border-b border-[rgba(0,0,0,0.08)] bg-[#FAEEDA]/40 px-orbit-base text-[10px] v6-orbit-weight-medium text-[#633806]">
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
            className={`inline-flex h-7 items-center gap-orbit-xs rounded-full px-orbit-base text-[10px] v6-orbit-weight-medium ${
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
      <p className="text-lg v6-orbit-weight-medium tabular-nums text-foreground">{value}</p>
      <p className="text-[9px] v6-orbit-weight-medium uppercase text-muted-foreground">{label}</p>
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
  simplifyOutcomeStatus = false,
  onResetToLatest,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  filter: FilterKey;
  onFilterChange: (value: FilterKey) => void;
  showBucketFilter: boolean;
  simplifyOutcomeStatus?: boolean;
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
              <SelectItem value="open">Not Met</SelectItem>
              <SelectItem value="closed">Met</SelectItem>
              {!simplifyOutcomeStatus && <SelectItem value="new-issues">New supplier changes</SelectItem>}
              {!simplifyOutcomeStatus && <SelectItem value="unmarked">Needs decision</SelectItem>}
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
      className={`inline-flex h-10 items-center gap-orbit-xs border-b-2 text-[12px] v6-orbit-weight-medium ${
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
  variant: "Success" | "Error" | "Style 2" | "Warning" | "Outline";
  Icon: typeof IconCircleCheck;
}> = {
  met: {
    label: "Met",
    variant: "Success",
    Icon: IconCircleCheck,
  },
  not_met: {
    label: "Not Met",
    variant: "Error",
    Icon: IconCircleX,
  },
  improved: {
    label: "Improved",
    variant: "Success",
    Icon: IconTrendingUp,
  },
  regressed: {
    label: "Regressed",
    variant: "Warning",
    Icon: IconTrendingDown,
  },
  new: {
    label: NEW_CHANGE_LABEL,
    variant: "Style 2",
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
    <span className="inline-flex items-center gap-orbit-xs">
      <Chip label={config.label} size="Mini" variant={config.variant} contrast="Low" />
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

function VerdictPill({ verdict, superseded = false }: { verdict: ClauseVerdict; superseded?: boolean }) {
  return (
    <span className="inline-flex items-center gap-orbit-xs">
      <Chip
        label={verdictLabel(verdict)}
        size="Mini"
        variant={verdict === "met" ? "Success" : "Error"}
        contrast="Low"
      />
      {superseded && <span className="text-[9px] text-muted-foreground">superseded</span>}
    </span>
  );
}

function verdictLabel(verdict: ClauseVerdict) {
  return verdict === "met" ? "Met" : "Not Met";
}

function DecisionBadge({ decision }: { decision: RoundDecision }) {
  if (decision === "request-update") {
    return (
      <span className="inline-flex cursor-default items-center gap-orbit-xs rounded-full bg-primary px-orbit-s py-orbit-xs text-[10px] v6-orbit-weight-medium text-primary-foreground">
        <Sparkles className="h-3 w-3" />
        Requested
      </span>
    );
  }

  return (
    <span className="inline-flex cursor-default items-center gap-orbit-xs rounded-full bg-[#EAF3DE] px-orbit-s py-orbit-xs text-[10px] v6-orbit-weight-medium text-[#27500A]">
      <CheckCircle2 className="h-3 w-3" />
      {CLAUSE_ACTION_LABELS.holdPosition}
    </span>
  );
}

function RequestLifecycleBadge({ request }: { request?: ClauseRequest }) {
  if (request?.state === "pending") {
    return (
      <span className="inline-flex cursor-default items-center gap-orbit-xs rounded-full border border-[#185FA5]/25 bg-[#E6F1FB] px-orbit-s py-orbit-xs text-[10px] v6-orbit-weight-medium text-[#0C447C]">
        <FileText className="h-3 w-3" />
        {CLAUSE_ACTION_LABELS.reviseTarget}
      </span>
    );
  }

  if (request?.state === "submitted") {
    return (
      <span className="inline-flex cursor-default items-center gap-orbit-xs rounded-full border border-[#BFD6AB] bg-[#EAF3DE] px-orbit-s py-orbit-xs text-[10px] v6-orbit-weight-medium text-[#27500A]">
        <CheckCircle2 className="h-3 w-3" />
        Reviewed
      </span>
    );
  }

  return <DecisionBadge decision="request-update" />;
}

function OverviewSectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] v6-orbit-weight-semibold uppercase tracking-wider text-muted-foreground">
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
        <span className="shrink-0 v6-orbit-weight-medium text-muted-foreground">
          {data.previous ? `${pair.from} → ${pair.to}` : "First analysis"}
        </span>
        {data.previous ? (
          <>
            <MiniDistributionBar distribution={data.previous.distribution} muted />
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <MiniDistributionBar distribution={data.current.distribution} />
            <span className="shrink-0 v6-orbit-weight-medium tabular-nums" style={{ color: deltaColor }}>
              {deltaLabel} pts
            </span>
            <CompactDivider />
            {data.movement.improved > 0 && (
              <span className="shrink-0 v6-orbit-weight-medium text-[#3B6D11]">↑ {data.movement.improved} improved</span>
            )}
            {data.movement.declined > 0 && (
              <span className="shrink-0 v6-orbit-weight-medium text-[#A32D2D]">↓ {data.movement.declined} declined</span>
            )}
          </>
        ) : (
          <MiniDistributionBar distribution={data.current.distribution} />
        )}
        <button
          type="button"
          onClick={onExpand}
          className="ml-auto shrink-0 rounded px-orbit-s py-orbit-xxs v6-orbit-weight-medium text-primary hover:bg-primary/5"
        >
          Expand
        </button>
      </div>
    );
  }

  return <HybridVersionMovementPanel data={data} />;
}

function MiniDistributionBar({ distribution, muted }: { distribution: DeviationDistribution; muted?: boolean }) {
  const colours = isInitiativesV6Route() ? v6DeviationDistributionColors : deviationDistributionColors;
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
              backgroundColor: colours[key],
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
      <span className="hidden text-[10px] v6-orbit-weight-semibold uppercase tracking-wider text-muted-foreground sm:inline">
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
              className={`h-6 rounded-full px-orbit-s text-[11px] v6-orbit-weight-medium transition-colors ${
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
          Request Changes
        </Button>
        <Button
          className="h-7 rounded-[5px] px-orbit-base text-[10px]"
          onClick={onAcceptVersion}
        >
          Accept Version
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
        <div className="min-w-[180px] flex-1 text-[10px] v6-orbit-weight-medium text-muted-foreground">
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
            "text-[9px] v6-orbit-weight-medium uppercase tracking-[0.04em]",
            current ? "text-[#185FA5]" : "text-muted-foreground",
          )}>
            {labelText}
          </span>
          {current && (
            <span className="inline-flex items-center gap-orbit-xs rounded-full bg-[#185FA5] px-orbit-xs py-orbit-xxs text-[8px] v6-orbit-weight-semibold uppercase tracking-[0.04em] text-white">
              <IconEye size={10} stroke={2} aria-hidden />
              Current version
            </span>
          )}
        </div>
        <p className="mt-orbit-xxs text-2xl v6-orbit-weight-medium leading-none text-foreground tabular-nums">{version.score}</p>
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
      <span className="text-sm v6-orbit-weight-medium leading-none tabular-nums" style={{ color }}>
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

const v6DeviationDistributionColors: Record<keyof DeviationDistribution, string> = {
  high: FIRST_ANALYSIS_STATUS_THEME.high.indicatorColor,
  medium: FIRST_ANALYSIS_STATUS_THEME.medium.indicatorColor,
  low: FIRST_ANALYSIS_STATUS_THEME.low.indicatorColor,
  clean: FIRST_ANALYSIS_STATUS_THEME.none.indicatorColor,
};

function DistributionCounts({ distribution }: { distribution: DeviationDistribution }) {
  const useV6StatusColours = isInitiativesV6Route();
  return (
    <div className="mb-orbit-xs flex min-w-0 flex-wrap items-center gap-x-orbit-xs gap-y-orbit-xxs text-[10px] text-muted-foreground">
      <DistributionCount value={distribution.high} label="high" color="#A32D2D" />
      <span className="text-border">·</span>
      <DistributionCount value={distribution.medium} label="med" color="#854F0B" />
      <span className="text-border">·</span>
      <DistributionCount value={distribution.low} label="low" color={useV6StatusColours ? FIRST_ANALYSIS_STATUS_THEME.low.indicatorColor : "hsl(var(--foreground))"} />
      <span className="text-border">·</span>
      <DistributionCount value={distribution.clean} label="clean" color={useV6StatusColours ? FIRST_ANALYSIS_STATUS_THEME.none.indicatorColor : "hsl(var(--muted-foreground))"} />
    </div>
  );
}

function DistributionCount({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <span className="whitespace-nowrap">
      <strong className="v6-orbit-weight-medium tabular-nums" style={{ color }}>{value}</strong> {label}
    </span>
  );
}

function CompactDistributionBar({ distribution }: { distribution: DeviationDistribution }) {
  const total = Math.max(1, distribution.high + distribution.medium + distribution.low + distribution.clean);
  const colours = isInitiativesV6Route() ? v6DeviationDistributionColors : deviationDistributionColors;
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
              backgroundColor: colours[key],
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
            <p className="text-[9px] v6-orbit-weight-medium uppercase tracking-[0.04em] text-muted-foreground">Supplier-initiated</p>
            <p className="text-xs v6-orbit-weight-medium text-foreground">What changed this round</p>
          </div>
        </div>
        <MovementNarrative movers={movers} delta={delta} />
        {onSeeMoreChanges && (
          <button
            type="button"
            onClick={onSeeMoreChanges}
            className="ml-orbit-l mt-orbit-xxs rounded px-orbit-xs py-orbit-xxs text-[10px] v6-orbit-weight-medium text-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
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
            <span className="v6-orbit-weight-medium">Score recalculated.</span> No clause movement this round. <ScoreDeltaText delta={delta} />
          </>
        )
      ) : (
        <>
          {regressed > improved && regressed > 0 ? (
            <>
              <NarrativeCount count={regressed} /> <span className="v6-orbit-weight-medium">regressed</span>
              {improved > 0 && <> , <NarrativeCount count={improved} /> <span className="v6-orbit-weight-medium">improved</span></>}
            </>
          ) : improved > 0 && regressed > 0 ? (
            <>
              <NarrativeCount count={improved} /> <span className="v6-orbit-weight-medium">improved</span>, <NarrativeCount count={regressed} /> <span className="v6-orbit-weight-medium">regressed</span>
            </>
          ) : improved > 0 ? (
            <>
              <NarrativeCount count={improved} /> clause{improved === 1 ? "" : "s"} <span className="v6-orbit-weight-medium">improved</span> this round
            </>
          ) : regressed > 0 ? (
            <>
              <NarrativeCount count={regressed} /> clause{regressed === 1 ? "" : "s"} <span className="v6-orbit-weight-medium">regressed</span>
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
  return <span className="v6-orbit-weight-medium tabular-nums">{count}</span>;
}

function ScoreDeltaText({ delta }: { delta: number }) {
  if (delta === 0) return null;
  const positive = delta > 0;
  return (
    <>
      Net change:{" "}
      <span className={`v6-orbit-weight-medium tabular-nums ${positive ? "text-[#27500A]" : "text-[#791F1F]"}`}>
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
            <strong className="v6-orbit-weight-medium text-foreground">{formatMoverSeverity(mover.previousSeverity)}</strong>
            <span aria-hidden> → </span>
            <strong className="v6-orbit-weight-medium text-foreground">{formatMoverSeverity(mover.currentSeverity)}</strong>
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
            <span className="min-w-0 truncate text-[11px] v6-orbit-weight-medium text-foreground">{mover.name}</span>
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
                  <span className="block truncate text-[11px] v6-orbit-weight-medium text-foreground">{driver.clauseName}</span>
                  <span className="block truncate text-[10px] text-muted-foreground">
                    {driver.clauseId.toUpperCase()}
                    {stalled && <> · stalled {driver.roundsUnchanged} rounds</>}
                  </span>
                </span>
              </span>
              <span
                className="text-right text-[10px] v6-orbit-weight-medium tabular-nums"
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
              <span className="text-[10px] v6-orbit-weight-medium" style={{ color: row.color }}>{row.label}</span>
              <span className="flex h-2 overflow-hidden rounded-[3px] bg-muted">
                <span className="bg-[#3B6D11]" style={{ width: `${resolvedWidth}%` }} />
                {remaining > 0 && (
                  <span style={{ width: `${Math.max(0, 100 - resolvedWidth)}%`, backgroundColor: row.color }} />
                )}
              </span>
              <span className="text-right text-[10px] v6-orbit-weight-medium tabular-nums" style={{ color: row.color }}>
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
  return <span className={`inline-flex items-center gap-orbit-xs v6-orbit-weight-medium ${toneClass}`}>{children}</span>;
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
      <p className="text-[9px] v6-orbit-weight-semibold text-muted-foreground uppercase tracking-normal sm:text-[10px]">{label}</p>
      <p className={`text-lg v6-orbit-weight-bold tabular-nums leading-tight ${tone}`}>{value}</p>
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
    version ? version.version : "Version";

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
  const allActive = activeCategories.length === 0;
  const categoryToggleCardStyle: CSSProperties = { boxShadow: "var(--orbit-shadow-none)" };
  const getToggleCardStatus = ({
    active,
    disabled,
  }: {
    active: boolean;
    disabled: boolean;
  }): React.ComponentProps<typeof ToggleCard>["status"] => {
    if (disabled) return "Disabled";
    if (active) return "Selected";
    return "Default";
  };

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
          <Text as="p" size="Small" variant="Secondary">CLAUSES</Text>
        </div>
      )}

      <div className="space-y-orbit-xs">
        <ToggleCard
          ref={(node) => {
            rowRefs.current[0] = node;
          }}
          status={getToggleCardStatus({
            active: allActive,
            disabled: false,
          })}
          aria-pressed={allActive}
          aria-label={`Clear category filters, ${total} clauses`}
          onClick={() => onSelectCategory(null)}
          onKeyDown={(event) => handleRowKeyDown(event, 0)}
          className={cn("overflow-hidden", !allActive && "clauseiq-v6a-togglecard-subtle")}
          style={categoryToggleCardStyle}
        >
          <span className="flex w-full items-center justify-between gap-orbit-s px-orbit-s py-orbit-xs">
            <Text as="span" size="Small" variant="Secondary">
              All
            </Text>
            <Chip label={String(total)} size="Mini" variant="No Status" contrast="Low" />
          </span>
        </ToggleCard>

        {sortedCategories.map((category, index) => {
          const active = activeCategorySet.has(category.name);
          const rowIndex = index + 1;
          return (
            <ToggleCard
              key={category.name}
              ref={(node) => {
                rowRefs.current[rowIndex] = node;
              }}
              status={getToggleCardStatus({
                active,
                disabled: category.count === 0,
              })}
              aria-pressed={active}
              aria-label={`${active ? "Remove" : "Add"} ${category.name} category filter, ${category.count} clauses`}
              onClick={() => onSelectCategory(category.name)}
              onKeyDown={(event) => handleRowKeyDown(event, rowIndex)}
              className={cn("overflow-hidden", category.count !== 0 && !active && "clauseiq-v6a-togglecard-subtle")}
              style={categoryToggleCardStyle}
            >
              <span className="flex w-full items-center gap-orbit-s px-orbit-s py-orbit-xs">
                <span className="min-w-0 flex-1 truncate" style={{ textAlign: "left" }}>
                  <Text as="span" size="Small" variant="Secondary">
                    {category.name}
                  </Text>
                </span>
                <Chip label={String(category.count)} size="Mini" variant="No Status" contrast="Low" />
              </span>
            </ToggleCard>
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
        <Text as="span" size="Small" variant="Secondary">Clauses</Text>
        <div className="min-w-0 flex-1">
          <QuickFilterGroup ariaLabel="Clause filters">
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
          Clauses
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
        Select <span className="v6-orbit-weight-semibold text-foreground">"Request Change"</span> for clauses you want the supplier to update.
        {versionLabel !== "v1" && (
          <> Notes on <span className="v6-orbit-weight-semibold text-foreground">{versionLabel}</span> override the previous round.</>
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
      : "Revise target";
}

function ClauseRequestForm({
  versionLabel,
  draft,
  request,
  inherited,
  submitLabel = "Add to Requests",
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

  return (
    <div
      className={cn("mt-orbit-base border-t border-border pt-orbit-base", compact ? "space-y-orbit-s" : "space-y-orbit-base")}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {inherited && !draft?.requestedChange && !draft?.rationale && (
        <div className="space-y-orbit-xs rounded-md border-l-2 border-primary bg-primary/5 px-orbit-base py-orbit-s text-xs">
          <p className="text-[10px] v6-orbit-weight-semibold uppercase tracking-wide text-primary">
            Currently in effect · from {inherited.version}
          </p>
          {inherited.request.requestedChange && <p className="leading-snug text-foreground">{inherited.request.requestedChange}</p>}
          {inherited.request.rationale && <p className="italic leading-snug text-muted-foreground">{inherited.request.rationale}</p>}
          <p className="text-[11px] text-muted-foreground">
            Add a new note below to override this for {versionLabel} onwards.
          </p>
        </div>
      )}
      <div className="grid w-full gap-orbit-base">
        <div className="space-y-orbit-xs">
          <label className="text-[11px] v6-orbit-weight-semibold text-muted-foreground">
            Target <span className="text-destructive">*</span>
          </label>
          <Textarea
            value={requestValue}
            onChange={(event) => onUpdate({ requestedChange: event.target.value })}
            placeholder={requestPlaceholder}
            className={cn("min-h-[64px] text-sm", compact && "min-h-[58px] text-xs")}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-orbit-base">
        <p className="text-[11px] text-muted-foreground">
          Target will stay editable in review until submitted to the supplier.
        </p>
        <div className="flex items-center gap-orbit-s">
          <Button variant="outline" className={cn("h-8 text-xs", compact && "h-7 text-[11px]")} onClick={onCancel}>
            Cancel
          </Button>
          <OrbitButton
            variant="Primary"
            size="Medium"
            state={!requestValue.trim() ? "Disabled" : "Default"}
            disabled={!requestValue.trim()}
            className="gap-orbit-xs"
            onClick={onSubmit}
          >
            <Sparkles className="h-3.5 w-3.5" /> {submitLabel}
          </OrbitButton>
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
  verdict,
  verdictSuperseded,
  deviationDelta,
  alteredAfterAgreement,
  stateBadge,
  metaPrefix,
  missingClause,
  hideSubclauseReference,
  displayMode = "default",
  primaryActionLabel = "Request Change",
  requestPlaceholder,
  requestSubmitLabel = "Add to Requests",
  versionLabel,
  extraContent,
  actions,
  selectedComparisonAction,
  pinned,
  onTogglePin,
  onRequest,
  onUseRecommendation,
  onNoAction,
  onEditRequest,
  onChangeNoAction,
  onChangeSelectedAction,
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
  verdict?: ClauseVerdict | null;
  verdictSuperseded?: boolean;
  deviationDelta?: DeviationDelta;
  alteredAfterAgreement?: boolean;
  stateBadge?: ReactNode;
  metaPrefix?: ReactNode;
  missingClause?: boolean;
  hideSubclauseReference?: boolean;
  displayMode?: "default" | "row-scale";
  primaryActionLabel?: string;
  requestPlaceholder?: string;
  requestSubmitLabel?: string;
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
  onChangeSelectedAction?: () => void;
  onUndoDecision?: () => void;
  onUpdateDraft?: (patch: { requestedChange?: string; rationale?: string }) => void;
  onCancelDraft?: () => void;
  onSubmitDraft?: () => void;
  onRemoveRequest?: () => void;
  onOpenDetail: () => void;
  neutralActions?: boolean;
  selectedComparisonAction?: "accepted";
}) {
  const [queuedExpanded, setQueuedExpanded] = useState(false);
  const useDefaultComparisonCard = Boolean(extraContent && !neutralActions);
  const pendingBasketRequest = request?.state === "pending" && Boolean(request.requestedChange?.trim());
  const showAcceptedCompact = selectedComparisonAction === "accepted" && !pendingBasketRequest && !isDrafting;
  const showQueuedCompact = pendingBasketRequest && !isDrafting;
  const showHandledCompact = showQueuedCompact || showAcceptedCompact;
  const showDecisionBody = !showHandledCompact || queuedExpanded;
  const requestPreview = request?.requestedChange?.trim() ?? "";
  const settled = decision === "request-update" || decision === "no-action";
  const noActionIsPrimary = !neutralActions && clause.severity === "low";
  const noneDeviationClause = isNoneDeviationClause(clause);
  const showRequestActions = !noneDeviationClause && !settled && !actions && !showHandledCompact;
  const useV6StatusTags = isInitiativesV6Route();
  const useV6DeviationCard = isInitiativesV6Route() && neutralActions;
  const useFirstAnalysisDeviationStyle = neutralActions && hideSubclauseReference && clause.severity === "high";
  const severityStatusKey = noneDeviationClause ? "none" : firstAnalysisSeverityStatus[clause.severity];
  const severityBadgeLabel = useV6StatusTags
    ? FIRST_ANALYSIS_STATUS_THEME[severityStatusKey].label
    : noneDeviationClause
    ? "None Deviation"
    : useFirstAnalysisDeviationStyle
    ? "High Deviation"
    : clause.severity;
  const severityBadgeClass = noneDeviationClause
    ? firstAnalysisNoneDeviationBadgeClass
    : useFirstAnalysisDeviationStyle
    ? firstAnalysisDeviationBadgeClass
    : `${severityTone(clause.severity)} shrink-0 rounded-full px-orbit-xs py-orbit-xxs text-[9px] v6-orbit-weight-medium`;
  const showSeverityBadge = !isPureMissingClause(clause);
  const reviewCardState: OrbitCardState = useV6DeviationCard
    ? firstAnalysisCardStateForClause(clause)
    : useDefaultComparisonCard
    ? "Default"
    : pendingBasketRequest || decision === "request-update"
    ? "Information"
    : "Default";
  const reviewCardStyle: OrbitCardStyle = {};
  if (useV6DeviationCard && reviewCardState === "Default") {
    reviewCardStyle["--orbit-color-card-indicator-default"] = firstAnalysisCardIndicatorColorForClause(clause);
  }
  const showReviewCardIndicator =
    useV6DeviationCard ||
    (!useDefaultComparisonCard && (pendingBasketRequest || decision === "request-update"));

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
      className={cn("rounded-lg transition-colors", highlighted && "ring-2 ring-primary/40")}
    >
      <Card type="Static" padding="Base" state={reviewCardState} indicator={showReviewCardIndicator} style={reviewCardStyle}>
          <div className="flex min-w-0 items-center gap-orbit-s">
          <div className="min-w-0 flex-1">
            <h3 className="v6-orbit-heading-label truncate text-foreground">
              <ClauseTitleInline clauseId={id} fallback={clause.title} />
            </h3>
          </div>
          {alteredAfterAgreement && <Chip label="Altered after agreement" size="Mini" variant="Error" contrast="Low" />}
          {verdict ? <VerdictPill verdict={verdict} superseded={verdictSuperseded} /> : changePill?.status && <ChangePillBadge result={changePill} />}
          {showSeverityBadge && (
            useV6StatusTags ? (
              <FirstAnalysisStatusTag status={severityStatusKey} />
            ) : (
              <Badge variant="outline" className={severityBadgeClass}>
                {severityBadgeLabel}
              </Badge>
            )
          )}
          {missingClause && (
            useV6StatusTags ? (
              <FirstAnalysisStatusTag status="missing" />
            ) : (
              <Badge
                variant="outline"
                className={getFirstAnalysisMissingClauseBadgeClass()}
              >
                Missing Clause
              </Badge>
            )
          )}
          {stateBadge}
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
                className="shrink-0 text-[10px] v6-orbit-weight-medium text-primary hover:underline"
              >
                {decision === "request-update" ? "Edit" : "Change"}
              </button>
            </>
          )}
        </div>

        {showHandledCompact && (
          <div className="mt-orbit-s space-y-orbit-s" onClick={(event) => event.stopPropagation()}>
            <div
              className={cn(
                "flex flex-wrap items-center gap-orbit-s rounded-md px-orbit-base py-orbit-s",
                showAcceptedCompact
                  ? "border border-[#BFD6AB] bg-[#EAF3DE]"
                  : useDefaultComparisonCard
                  ? "border border-border bg-muted/20"
                  : "border border-[#185FA5]/20 bg-[#E6F1FB]/45",
              )}
            >
              <p
                className={cn(
                  "min-w-[180px] flex-1 truncate text-[11px]",
                  showAcceptedCompact
                    ? "text-[#27500A]"
                    : useDefaultComparisonCard
                    ? "text-muted-foreground"
                    : "text-[#0C447C]",
                )}
              >
                <span className={cn("v6-orbit-weight-semibold", useDefaultComparisonCard && !showAcceptedCompact && "text-foreground")}>
                  {showAcceptedCompact ? "Accepted:" : "Request:"}
                </span>{" "}
                {showAcceptedCompact ? "Supplier position accepted for this round." : requestPreview}
              </p>
              <div className="flex shrink-0 items-center gap-orbit-xs">
                {showAcceptedCompact ? (
                  onChangeSelectedAction && (
                    <Button variant="outline" className="h-7 px-orbit-s text-[10px]" onClick={onChangeSelectedAction}>
                      Change Decision
                    </Button>
                  )
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      className={cn(
                        "h-7 gap-orbit-xs px-orbit-s text-[10px] hover:bg-white/70",
                        showAcceptedCompact ? "text-[#27500A]" : "text-primary",
                      )}
                      onClick={() => setQueuedExpanded((current) => !current)}
                    >
                      {queuedExpanded ? "Hide Detail" : "View Detail"}
                      <ChevronDown className={cn("h-3 w-3 transition-transform", queuedExpanded && "rotate-180")} />
                    </Button>
                    <Button variant="outline" className="h-7 px-orbit-s text-[10px]" onClick={onEditRequest}>
                      Edit Request
                    </Button>
                    {onRemoveRequest && (
                      <Button variant="outline" className="h-7 px-orbit-s text-[10px] text-muted-foreground" onClick={onRemoveRequest}>
                        Remove
                      </Button>
                    )}
                  </>
                )}
                {showAcceptedCompact && (
                  <Button
                    variant="ghost"
                    className={cn(
                      "h-7 gap-orbit-xs px-orbit-s text-[10px] hover:bg-white/70",
                      "text-[#27500A]",
                    )}
                    onClick={() => setQueuedExpanded((current) => !current)}
                  >
                    {queuedExpanded ? "Hide Detail" : "View Detail"}
                    <ChevronDown className={cn("h-3 w-3 transition-transform", queuedExpanded && "rotate-180")} />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {showDecisionBody && description && (
          <p className="mt-orbit-xs text-[11px] leading-5 text-muted-foreground">
            {description}
          </p>
        )}
        {showDecisionBody && actionability && (
          <p className="mt-orbit-xs text-[11px] leading-5 text-muted-foreground">
            <Lightbulb className="mr-orbit-xs inline h-3 w-3 text-primary" />
            <span className="v6-orbit-weight-semibold text-foreground">Actionability:</span> {actionability}
          </p>
        )}
        {showDecisionBody && extraContent && <div className="mt-orbit-s">{extraContent}</div>}

        {showRequestActions && (
          <div className="mt-orbit-s flex items-center gap-orbit-xs" onClick={(event) => event.stopPropagation()}>
            <Button
              variant="secondary"
              className="h-8 gap-orbit-xs rounded-[5px] px-orbit-base text-[11px] v6-orbit-weight-regular"
              onClick={onRequest}
            >
              <Sparkles className="h-3 w-3" /> {primaryActionLabel}
            </Button>
            <Button
              variant={noActionIsPrimary ? "default" : "outline"}
              className={cn("h-8 rounded-[5px] px-orbit-base text-[11px] v6-orbit-weight-regular gap-orbit-xs", noActionIsPrimary && "bg-[#1a2744] text-white hover:bg-[#243454]")}
              onClick={onNoAction}
            >
              <CheckCircle2 className="h-3 w-3" /> {CLAUSE_ACTION_LABELS.holdPosition}
            </Button>
          </div>
        )}

        {actions && !showHandledCompact && (
          <div className="mt-orbit-s flex items-center gap-orbit-xs" onClick={(event) => event.stopPropagation()}>
            {actions}
          </div>
        )}

        {showQueuedCompact && queuedExpanded && (
          <div className="mt-orbit-s" onClick={(event) => event.stopPropagation()}>
            <div
              className={cn(
                "rounded-md px-orbit-base py-orbit-s text-[11px]",
                useDefaultComparisonCard
                  ? "border border-border bg-muted/20 text-muted-foreground"
                  : "border border-[#185FA5]/20 bg-[#E6F1FB]/55 text-[#0C447C]",
              )}
            >
              <p className={cn("v6-orbit-weight-medium", useDefaultComparisonCard && "text-foreground")}>Revise target.</p>
              <p className={cn("mt-orbit-xxs", useDefaultComparisonCard ? "text-muted-foreground" : "text-[#0C447C]/80")}>
                This clause is queued for the next round target.
              </p>
            </div>
          </div>
        )}

        {showAcceptedCompact && queuedExpanded && (
          <div className="mt-orbit-s" onClick={(event) => event.stopPropagation()}>
            <div className="rounded-md border border-[#BFD6AB] bg-[#EAF3DE] px-orbit-base py-orbit-s text-[11px] text-[#27500A]">
              <p className="v6-orbit-weight-medium">Accepted supplier position.</p>
              <p className="mt-orbit-xxs text-[#27500A]/80">
                This clause is accepted for the current supplier version and stays monitored in future rounds.
              </p>
            </div>
          </div>
        )}

        {isDrafting && onUpdateDraft && onCancelDraft && onSubmitDraft && (
          <div>
            <ClauseRequestForm
              versionLabel={versionLabel}
              draft={draft}
              request={request}
              inherited={inherited}
              requestPlaceholder={requestPlaceholder}
              submitLabel={requestSubmitLabel}
              onUpdate={onUpdateDraft}
              onCancel={onCancelDraft}
              onSubmit={onSubmitDraft}
            />
          </div>
        )}
      </Card>
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
  const noneDeviationClause = isNoneDeviationClause(clause);
  const useV6StatusColours = isInitiativesV6Route();
  const orbitCardState = useV6StatusColours ? firstAnalysisCardStateForClause(clause) : "Default";
  const cardIndicatorToken = useV6StatusColours
    ? firstAnalysisCardIndicatorColorForClause(clause)
    : missingClause
    ? "var(--orbit-color-card-indicator-error)"
    : noneDeviationClause
    ? "var(--orbit-color-card-indicator-success)"
    : theme.legacyIndicatorToken;
  const cardStyle: OrbitCardStyle = {
    minHeight: 104,
  };
  if (!useV6StatusColours || orbitCardState === "Default") {
    cardStyle["--orbit-color-card-indicator-default"] = cardIndicatorToken;
  }
  const severityLabel = noneDeviationClause
    ? "None Deviation"
    : `${titleCaseSeverity(tier)} Deviation`;
  const severityStatusKey = noneDeviationClause ? "none" : firstAnalysisSeverityStatus[tier];
  const severityBadgeClass = noneDeviationClause
    ? firstAnalysisNoneDeviationBadgeClass
    : useV6StatusColours
    ? theme.badgeClass
    : theme.legacyBadgeClass;
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
          ? "Revise target"
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
        title={<ClauseTitleInline clauseId={id} fallback={clause.title} />}
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
      className={cn("rounded-lg transition-colors", highlighted && "ring-2 ring-primary/40")}
    >
      <Card type="Static" padding="Base" state={orbitCardState} indicator style={cardStyle}>
        <div className="flex flex-col gap-orbit-s">
          <div className="flex flex-wrap items-center justify-between gap-orbit-s">
            <div className="flex flex-wrap items-center gap-orbit-s">
              {showSeverityBadge && (
                useV6StatusColours ? (
                  <FirstAnalysisStatusTag status={severityStatusKey} />
                ) : (
                  <Badge variant="outline" className={severityBadgeClass}>
                    {severityLabel}
                  </Badge>
                )
              )}
              {missingClause && (
                useV6StatusColours ? (
                  <FirstAnalysisStatusTag status="missing" />
                ) : (
                  <Badge variant="outline" className={getFirstAnalysisMissingClauseBadgeClass()}>
                    Missing Clause
                  </Badge>
                )
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {id.toUpperCase()} · {metadata}
            </p>
          </div>
          <h3 className="v6-orbit-heading-label text-foreground">
            <ClauseTitleInline clauseId={id} fallback={clause.title} />
          </h3>
        </div>
        {description && (
          <div className="mt-orbit-base">
            <SimplifiedComparisonContent
              currentLabel="Current Analysis"
              currentText={description}
            />
          </div>
        )}
        {requestForm ?? (!noneDeviationClause ? (
          <div className="mt-orbit-base flex flex-wrap items-center gap-orbit-xs" onClick={(event) => event.stopPropagation()}>
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
              <Pencil className="h-3 w-3" /> {CLAUSE_ACTION_LABELS.reviseTarget}
            </Button>
            <Button
              variant="outline"
              onClick={(event) => runAction(event, onNoAction)}
            >
              <CheckCircle2 className="h-3 w-3" /> {CLAUSE_ACTION_LABELS.holdPosition}
            </Button>
          </div>
        ) : null)}
      </Card>
    </div>
  );
}

const rowScaleSeverityThemes: Record<
  ClauseResult["severity"],
  {
    indicatorToken: string;
    badgeClass: string;
    legacyIndicatorToken: string;
    legacyBadgeClass: string;
  }
> = {
  high: {
    indicatorToken: FIRST_ANALYSIS_STATUS_THEME.high.indicatorColor,
    badgeClass: firstAnalysisDeviationBadgeClass,
    legacyIndicatorToken: "var(--orbit-color-card-indicator-error)",
    legacyBadgeClass: firstAnalysisDeviationBadgeClass,
  },
  medium: {
    indicatorToken: FIRST_ANALYSIS_STATUS_THEME.medium.indicatorColor,
    badgeClass: "shrink-0 rounded-full border-[#F1D29B] bg-[#FFF8E8] px-orbit-xs py-orbit-xxs text-[9px] v6-orbit-weight-medium text-[#854F0B]",
    legacyIndicatorToken: "var(--orbit-color-card-indicator-warning)",
    legacyBadgeClass: "shrink-0 rounded-full border-[#F1D29B] bg-[#FFF8E8] px-orbit-xs py-orbit-xxs text-[9px] v6-orbit-weight-medium text-[#854F0B]",
  },
  low: {
    indicatorToken: FIRST_ANALYSIS_STATUS_THEME.low.indicatorColor,
    badgeClass: "shrink-0 rounded-full border-[#D9D8D2] bg-[#F5F5F2] px-orbit-xs py-orbit-xxs text-[9px] v6-orbit-weight-medium text-[#5F5E5A]",
    legacyIndicatorToken: "var(--orbit-color-card-indicator-success)",
    legacyBadgeClass: "shrink-0 rounded-full border-border bg-muted px-orbit-xs py-orbit-xxs text-[9px] v6-orbit-weight-medium text-muted-foreground",
  },
};

function titleCaseSeverity(severity: ClauseResult["severity"]) {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

type ResultCardPanelTone = "default" | "primary" | "accent";

function ResultCardPanel({
  label,
  text,
  tone = "default",
}: {
  label: string;
  text: string;
  tone?: ResultCardPanelTone;
}) {
  const surfaceToken = tone === "accent" ? "accent" : "default";
  const labelVariant = tone === "default" ? "Secondary" : "Information";

  return (
    <div
      className="flex min-w-0 flex-col gap-orbit-xs border px-orbit-s py-orbit-s"
      style={{
        backgroundColor: `var(--orbit-color-card-bg-${surfaceToken})`,
        borderColor: `var(--orbit-color-card-border-${surfaceToken})`,
        borderRadius: "var(--orbit-radius-md)",
        boxShadow: "var(--orbit-shadow-none)",
      }}
    >
      <Text as="p" size="Small" variant={labelVariant}>
        {label}
      </Text>
      <p className="mt-orbit-xs leading-snug text-foreground">{text}</p>
    </div>
  );
}

function SimplifiedComparisonContent({
  target,
  previousLabel,
  previousText,
  currentLabel,
  currentText,
}: {
  target?: string;
  previousLabel?: string;
  previousText?: string;
  currentLabel: string;
  currentText: string;
}) {
  const targetText = target?.trim();
  const hasPrevious = Boolean(previousLabel && previousText);

  return (
    <div className="space-y-orbit-s text-[11px]">
      <div className={cn("grid gap-orbit-s", hasPrevious && "md:grid-cols-2")}>
        {hasPrevious && <ResultCardPanel label={previousLabel!} text={previousText!} />}
        <ResultCardPanel label={currentLabel} text={currentText} tone="accent" />
      </div>
      {targetText && <ResultCardPanel label="Recommended Best Practice" text={targetText} tone="primary" />}
    </div>
  );
}

type ReviewGenerateAction = "request-update" | "revise-target" | "no-action" | "accept" | "hold-position";

interface BasketRequestItem {
  clauseId: string;
  clauseTitle: string;
  category?: string;
  severity?: ClauseResult["severity"];
  missingClause?: boolean;
  sourceDeviationLevel?: ClauseResult["sourceDeviationLevel"];
  action: ReviewGenerateAction;
  request?: ClauseRequest;
}

function versionClauseIndex(version: ContractVersion, clauseId: string) {
  const index = version.clauses.findIndex((clause) => clause.id === clauseId);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function buildBasketRequestItem(
  clauseId: string,
  version: ContractVersion,
  action: ReviewGenerateAction,
  request?: ClauseRequest,
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
    action,
    request,
  };
}

function reviewGenerateActionLabel(action: ReviewGenerateAction) {
  switch (action) {
    case "request-update":
      return "Request update";
    case "revise-target":
      return "Revise target";
    case "no-action":
      return "No action";
    case "accept":
      return "Accept supplier wording";
    case "hold-position":
      return "Hold previous position";
    default:
      return "Review decision";
  }
}

function buildReviewDecisionSignature(
  version: ContractVersion,
  decisionsByClause: Record<string, ClauseDecisionState>,
) {
  return version.clauses
    .map((clause) => {
      const state = decisionsByClause[clause.id];
      const decision = state?.roundDecisions?.[version.version] ?? "";
      const closure = state?.closures?.[version.version] ?? "";
      const request = state?.requests?.[version.version];
      const requestedChange = request?.requestedChange?.trim() ?? "";
      const rationale = request?.rationale?.trim() ?? "";
      if (!decision && !closure && !requestedChange && !rationale) return null;
      return [clause.id, decision, closure, requestedChange, rationale]
        .map((part) => part.replace(/\|/g, "\\|"))
        .join("|");
    })
    .filter((item): item is string => Boolean(item))
    .join("\n");
}

interface RecommendationTargetItem {
  id: string;
  clauseTitle: string;
  category: string;
  severity: ClauseResult["severity"];
  verdict?: ClauseVerdict;
  missingClause?: boolean;
  sourceDeviationLevel?: ClauseResult["sourceDeviationLevel"];
  request: ClauseRequest;
}

type BuiltInRecommendationApplyScope = "all" | "high" | "medium" | "low" | "none" | "missing";
type VerdictRecommendationApplyScope = `verdict:${ClauseVerdict}`;
type CategoryRecommendationApplyScope = `category:${string}`;
type RecommendationApplyScope =
  | BuiltInRecommendationApplyScope
  | VerdictRecommendationApplyScope
  | CategoryRecommendationApplyScope;

interface RecommendationApplyScopeMeta {
  toastLabel: string;
  undoLabel: string;
}

interface RecommendationApplyOption {
  id: RecommendationApplyScope;
  label: string;
  toastLabel: string;
  undoLabel: string;
  count: number;
  targets: RecommendationTargetItem[];
}

function buildRecommendationApplyOption(
  id: RecommendationApplyScope,
  label: string,
  toastLabel: string,
  undoLabel: string,
  targets: RecommendationTargetItem[],
): RecommendationApplyOption {
  return {
    id,
    label,
    toastLabel,
    undoLabel,
    count: targets.length,
    targets,
  };
}

function buildRecommendationApplyOptions(targets: RecommendationTargetItem[]): RecommendationApplyOption[] {
  const byScope = (scope: RecommendationApplyScope) => targets.filter((target) => targetMatchesRecommendationScope(target, scope));
  const verdictOptions = (["notmet", "met"] as ClauseVerdict[]).map((verdict) => {
    const label = verdictLabel(verdict);
    return buildRecommendationApplyOption(
      `verdict:${verdict}`,
      `Verdict: ${label}`,
      `${label} recommendation`,
      label,
      byScope(`verdict:${verdict}`),
    );
  });
  const categoryOptions = Array.from(
    new Set(
      targets
        .map((target) => target.category?.trim())
        .filter((category): category is string => Boolean(category)),
    ),
    )
    .sort((a, b) => a.localeCompare(b))
    .map((category) =>
      buildRecommendationApplyOption(
        `category:${category}`,
        category,
        `${category} recommendation`,
        category,
        byScope(`category:${category}`),
      ),
    );

  return [
    buildRecommendationApplyOption("all", "All recommendations", "recommendation", "all", targets),
    ...verdictOptions,
    buildRecommendationApplyOption(
      "high",
      "High Deviation",
      "High Deviation recommendation",
      "High Deviation",
      byScope("high"),
    ),
    buildRecommendationApplyOption(
      "medium",
      "Medium Deviation",
      "Medium Deviation recommendation",
      "Medium Deviation",
      byScope("medium"),
    ),
    buildRecommendationApplyOption(
      "low",
      "Low Deviation",
      "Low Deviation recommendation",
      "Low Deviation",
      byScope("low"),
    ),
    buildRecommendationApplyOption(
      "missing",
      "Missing Clauses",
      "Missing clause recommendation",
      "Missing clause",
      byScope("missing"),
    ),
    buildRecommendationApplyOption(
      "none",
      "None Deviation",
      "None Deviation recommendation",
      "None Deviation",
      byScope("none"),
    ),
    ...categoryOptions,
  ];
}

function mergeRecommendationApplyTargets(options: RecommendationApplyOption[]) {
  const seenTargetIds = new Set<string>();
  const targets: RecommendationTargetItem[] = [];

  options.forEach((option) => {
    option.targets.forEach((target) => {
      if (seenTargetIds.has(target.id)) return;
      seenTargetIds.add(target.id);
      targets.push(target);
    });
  });

  return targets;
}

function buildRecommendationApplyScopeMeta(options: RecommendationApplyOption[]): RecommendationApplyScopeMeta | undefined {
  if (options.length === 0) return undefined;
  if (options.length === 1) return options[0];

  return {
    toastLabel: "selected recommendation",
    undoLabel: "selected",
  };
}

function targetMatchesRecommendationScope(target: RecommendationTargetItem, scope: RecommendationApplyScope) {
  if (scope.startsWith("category:")) {
    return target.category === scope.slice("category:".length);
  }
  if (scope.startsWith("verdict:")) {
    return target.verdict === scope.slice("verdict:".length);
  }
  if (scope === "all") return true;
  if (scope === "missing") return Boolean(target.missingClause && target.sourceDeviationLevel === "None");
  if (scope === "none") return target.sourceDeviationLevel === "None";

  const sourceDeviationLevel = target.sourceDeviationLevel?.toLowerCase();
  return sourceDeviationLevel === scope || (!sourceDeviationLevel && target.severity === scope);
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
  title: ReactNode;
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
  const useV6StatusTags = isInitiativesV6Route();
  const clauseCardState = useV6StatusTags
    ? firstAnalysisCardStateForClause({
      severity: severity ?? "low",
      missingClause: Boolean(missingClause),
      sourceDeviationLevel,
    })
    : severity === "high"
    ? "Error"
    : severity === "medium"
    ? "Warning"
    : severity === "low"
    ? "Success"
    : "Default";
  const clauseCardStyle: OrbitCardStyle = {};
  if (clauseCardState === "Default") {
    clauseCardStyle["--orbit-color-card-indicator-default"] = useV6StatusTags
      ? firstAnalysisCardIndicatorColorForClause({
        severity: severity ?? "low",
        missingClause: Boolean(missingClause),
        sourceDeviationLevel,
      })
      : "var(--orbit-color-card-border-default)";
  }

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
      className={cn("rounded-lg transition-colors", highlighted && "ring-2 ring-primary/40")}
    >
      <Card type="Static" padding="Base" state={clauseCardState} indicator style={clauseCardStyle}>
        <div className="flex flex-wrap items-start justify-between gap-orbit-s">
          <div className="flex flex-wrap items-center gap-orbit-xs">
            {severity && !pureMissing && (
              useV6StatusTags ? (
                <FirstAnalysisStatusTag status={firstAnalysisSeverityStatus[severity]} label={`${titleCaseSeverity(severity)} Deviation`} />
              ) : (
                <Badge
                  variant="outline"
                  className={cn("h-5 rounded-full px-orbit-s text-[9px] v6-orbit-weight-medium", severityTone(severity))}
                >
                  {titleCaseSeverity(severity)} Deviation
                </Badge>
              )
            )}
            {(useV6StatusTags ? missingClause : pureMissing) && (
              useV6StatusTags ? (
                <FirstAnalysisStatusTag status="missing" />
              ) : (
                <Badge variant="outline" className={getFirstAnalysisMissingClauseBadgeClass()}>
                  Missing Clause
                </Badge>
              )
            )}
            <Badge
              variant="outline"
              className={cn(
                "h-5 rounded-full px-orbit-s text-[9px] v6-orbit-weight-medium",
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
          <p className="truncate text-[13px] v6-orbit-weight-semibold text-foreground">{title}</p>
          <p className="mt-orbit-xxs line-clamp-2 text-[11px] leading-4 text-muted-foreground">
            {request.requestedChange || "No requested change entered yet."}
          </p>
          {request.rationale && (
            <p className="mt-orbit-xs line-clamp-2 text-[11px] leading-4 text-muted-foreground">
              <span className="v6-orbit-weight-medium text-foreground">Rationale:</span> {request.rationale}
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
            {CLAUSE_ACTION_LABELS.reviseTarget}
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
              <label className="grid gap-orbit-xs text-xs v6-orbit-weight-medium text-foreground">
                Requested change
                <Textarea
                  value={draft.requestedChange ?? ""}
                  onChange={(event) => setDraft((current) => ({ ...current, requestedChange: event.target.value }))}
                  className="min-h-[72px] resize-none bg-white text-xs v6-orbit-weight-regular leading-5"
                />
              </label>
              <label className="grid gap-orbit-xs text-xs v6-orbit-weight-medium text-foreground">
                Rationale
                <Textarea
                  value={draft.rationale ?? ""}
                  onChange={(event) => setDraft((current) => ({ ...current, rationale: event.target.value }))}
                  placeholder="Add why this change is needed before supplier negotiation."
                  className="min-h-[64px] resize-none bg-white text-xs v6-orbit-weight-regular leading-5"
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
      </Card>
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
      "Review action",
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
      reviewGenerateActionLabel(item.action),
      item.request?.requestedChange ?? "",
      item.request?.rationale ?? "",
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
  const csvAlertDescription = `The CSV will include clause IDs, titles, categories, severity, ClauseIQ findings, review actions, requested changes, and rationale so you can take it back to the supplier for negotiation. Are you ready to generate it?${
    csvNeedsUpdate
      ? " Changes have been made since the last generated CSV. Generate again to update the negotiation log."
      : ""
  }`;

  return (
    <V6OrbitOverlay
      open={open}
      onOpenChange={onOpenChange}
      title={bulkSummaryMode ? "Generate CSV from applied recommendations" : "Review & Generate Selected Clauses"}
      size="Large"
      modalKey="review-generate"
      footer={
        <div className="flex flex-col gap-orbit-base sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="outline"
            className="h-8 text-xs"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <div className="flex flex-col gap-orbit-s sm:flex-row sm:items-center">
            {canGenerate && (
              <Button
                className="gap-orbit-xs"
                onClick={submitRequests}
              >
                <Download className="h-3.5 w-3.5" /> Submit & Generate
              </Button>
            )}
          </div>
        </div>
      }
    >
          <div>
            <Alert
              type="Information"
              title={bulkSummaryMode ? "Ready to generate supplier change log" : "Ready to generate selected clauses"}
              description={csvAlertDescription}
            />
          </div>

          {reviewProgress && (
            <div className="pt-orbit-s">
              <ReviewGenerateProgressDashboard progress={reviewProgress} />
            </div>
          )}
      </V6OrbitOverlay>
  );
}

function ReviewGenerateProgressDashboard({ progress }: { progress: FirstAnalysisReviewProgress }) {
  const reviewed = Math.max(0, progress.total - progress.unreviewed);
  const percentage = progress.total > 0 ? Math.round((reviewed / progress.total) * 100) : 0;

  return (
    <section className="rounded-lg border border-border bg-white p-orbit-base">
      <div>
        <div>
          <p className="text-[10px] v6-orbit-weight-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Summary
          </p>
          <p className="mt-orbit-xs text-xs leading-5 text-muted-foreground">
            Check what has been accepted, marked no action, and what is still left unreviewed before generating the CSV.
          </p>
        </div>
      </div>

      <div className="mt-orbit-base h-2 overflow-hidden rounded-full bg-muted">
        <span
          className="block h-full rounded-full bg-[hsl(var(--ciq-purple))]"
          style={{ width: `${percentage}%` }}
        />
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
                <span className="text-[10px] v6-orbit-weight-medium text-muted-foreground">{item.label}</span>
                <span className="text-[10px] text-muted-foreground">
                  {item.unreviewed} left
                </span>
              </div>
              <div className="mt-orbit-s h-1.5 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-[hsl(var(--ciq-purple))]"
                  style={{ width: `${itemPercentage}%` }}
                />
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
      <p className="text-lg v6-orbit-weight-semibold leading-none text-foreground">{value}</p>
      <p className="mt-orbit-xs text-[9px] v6-orbit-weight-medium uppercase tracking-[0.04em] text-muted-foreground">
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
  quickNoneDeviationFilter = false,
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
  quickNoneDeviationFilter?: boolean;
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
  const hasQuickMetricFilter = Boolean(
    (quickSeverityFilters && quickSeverityFilters.size > 0) ||
      quickMissingClauseIds ||
      quickNoneDeviationFilter,
  );
  const matchesQuickMetricFilter = (clause: ClauseResult) => {
    if (!hasQuickMetricFilter) return true;
    return (
      Boolean(quickSeverityFilters?.has(clause.severity) && countsTowardDeviationMetric(clause)) ||
      Boolean(quickMissingClauseIds?.has(clause.id)) ||
      Boolean(quickNoneDeviationFilter && isNoneDeviationClause(clause))
    );
  };
  const rows = version.clauses
    .map((clause, index) => ({ clause, index }))
    .filter(({ clause: c }) => {
      if (activeCategorySet.size > 0 && !activeCategorySet.has(c.category)) return false;
      if (!matchesQuickMetricFilter(c)) return false;
      if (
        !quickSeverityFilters &&
        quickSeverityFilter &&
        (c.severity !== quickSeverityFilter || c.resolved || !countsTowardDeviationMetric(c))
      ) return false;
      if (q && !c.title.toLowerCase().includes(q) && !c.category.toLowerCase().includes(q) && !c.id.includes(q)) return false;
      if (quickReviewFilter === "need-review") {
        const showNoneDeviationClause = quickNoneDeviationFilter && isNoneDeviationClause(c);
        if (!showNoneDeviationClause && c.resolved) return false;
        if (displayMode !== "row-scale") {
          const state = stateOf(c.id);
          const decision = state.roundDecisions[versionLabel];
          const request = state.requests[versionLabel];
          if (!showNoneDeviationClause && (decision === "no-action" || decision === "request-update" || request?.requestedChange?.trim())) {
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
            description={neutralActions && displayMode !== "row-scale" ? undefined : c.deviation}
            actionability={neutralActions && displayMode !== "row-scale" ? undefined : c.actionability}
            decision={decision}
            request={own}
            draft={draft}
            inherited={inheritedFromOlder}
            isDrafting={isDrafting}
            highlighted={highlightedId === c.id}
            missingClause={Boolean(missingClauseIds?.has(c.id))}
            hideSubclauseReference={hideSubclauseReference}
            displayMode={displayMode}
            extraContent={
              neutralActions && displayMode !== "row-scale" ? (
                <SimplifiedComparisonContent
              currentLabel="Current Analysis"
                  currentText={c.deviation}
                />
              ) : undefined
            }
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
      <V6OrbitConfirmOverlay
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

function ComparisonSection(props: {
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
  onContinueWithActionability?: (id: string, request: ClauseRequest) => void;
  onReopenAcceptedDecision?: (id: string) => void;
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
  onConfirmVerdictFromAction?: (id: string, verdict: ClauseVerdict | null | undefined, action: string) => void;
  stateOf?: (id: string) => ClauseDecisionState;
  layout?: "collapsible" | "plain";
  overrideVerdict?: ClauseVerdict | null;
}) {
  const {
    title, description, accent, rows, leftLabel, rightLabel, visible, bucket, stats,
    closureOf, requestOf, basketRequestOf, onClose, onKeepOpen, onFollowUp, onRemoveRequest, onOpenDetail,
    onContinueWithActionability,
    onReopenAcceptedDecision,
    pinnedIds, onTogglePin, recentlyClosed, onUndoClose, draftOf,
    onUpdateText, onCancelDraft, onSubmitDraft, onConfirmVerdictFromAction, stateOf, layout = "collapsible", overrideVerdict,
  } = props;
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
  const resolvedOverrideVerdict = typeof overrideVerdict === "undefined" ? null : overrideVerdict;
  const visibleStats = summariseComparisonRows(rows);
  const displayedStats = layout === "plain" ? visibleStats : stats;
  const bucketSummary = [
    displayedStats.pendingReview > 0 ? `${displayedStats.pendingReview} need review` : null,
    displayedStats.actioned > 0 ? `${displayedStats.actioned} actioned` : null,
    rows.length !== displayedStats.total ? `${visibleStats.visible} shown` : null,
  ].filter(Boolean).join(" · ");
  const sortedRows = sortOutcomeComparisonRows(rows).sort((a, b) => {
    const deviationDelta =
      outcomeDeviationSortRank(a.curr ?? a.prev) -
      outcomeDeviationSortRank(b.curr ?? b.prev);
    if (deviationDelta !== 0) return deviationDelta;
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
        const rowState = stateOf?.(r.id);
        const rowVerdict = resolvedOverrideVerdict
          ? rowState?.verdictConfirmations?.[rightLabel]?.verdict ?? resolvedOverrideVerdict
          : rowState
          ? effectiveVerdict(rowState, rightLabel, r.pill.status)
          : verdictFromChangePill(r.pill.status);
        const rowConfirmation = rowState?.verdictConfirmations?.[rightLabel];
        const rowDeviationDelta = getDeviationDelta(r.prev, r.curr, rowState?.simulatedMet ? { from: "Medium", to: "Aligned" } : undefined);
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
        const previousTargetText =
          req.requestedChange?.trim() ||
          basketRequest?.requestedChange?.trim() ||
          display.actionability?.trim() ||
          display.deviation?.trim() ||
          "";
        const previousTargetReason = req.rationale?.trim() || basketRequest?.rationale?.trim() || "";
        const actionabilityRequest: ClauseRequest | undefined = display.actionability?.trim()
          ? { requestedChange: display.actionability.trim() }
          : previousTargetText
          ? { requestedChange: previousTargetText, rationale: previousTargetReason || undefined }
          : undefined;
        const openReviseTargetEditor = (actionLabel = "Chose to revise target") => {
          onConfirmVerdictFromAction?.(r.id, rowVerdict, actionLabel);
          onFollowUp?.(r.id);
          if (supportsInlineRequest) {
            onUpdateText?.(r.id, {
              requestedChange: previousTargetText,
              rationale: previousTargetReason,
            });
            setExpandedRequestId(r.id);
          }
        };
        const cancelDraft = () => {
          if (draft.requestedChange?.trim() || draft.rationale?.trim()) {
            setPendingDraftCancelId(r.id);
            return;
          }
          onCancelDraft?.(r.id);
          setExpandedRequestId(null);
        };
        const comparisonBestPractice = display.actionability?.trim() || req.requestedChange;
        const comparisonDetails = (
          <SimplifiedComparisonContent
            target={comparisonBestPractice}
            previousLabel={`Previous Analysis · ${leftLabel}`}
            previousText={r.prev?.deviation ?? "Clause did not exist."}
            currentLabel={`Current Analysis · ${rightLabel}`}
            currentText={r.curr?.deviation ?? "Clause no longer present."}
          />
        );
        const rowActions =
          bucket === "new" ? undefined :
            bucket === "closed" ? (
              <div className="flex w-full flex-wrap items-center gap-orbit-xs sm:flex-nowrap">
                <Button variant="outline" className="h-8 text-[11px]" onClick={() => openReviseTargetEditor()}>
                  {CLAUSE_ACTION_LABELS.reviseTarget}
                </Button>
                <div className="ml-auto flex flex-wrap items-center gap-orbit-xs">
                  <Button variant="outline" className="h-8 text-[11px]" onClick={() => onClose(r.id)}>
                    {CLAUSE_ACTION_LABELS.acceptSupplierPosition}
                  </Button>
                  <Button
                    variant="default"
                    className="h-8 text-[11px]"
                    onClick={() => {
                      if (actionabilityRequest && onContinueWithActionability) {
                        onContinueWithActionability(r.id, actionabilityRequest);
                        return;
                      }
                      onKeepOpen(r.id);
                    }}
                  >
                    {CLAUSE_ACTION_LABELS.holdPosition}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex w-full flex-wrap items-center gap-orbit-xs sm:flex-nowrap">
                <Button
                  variant={closure === "follow-up" ? "secondary" : "outline"}
                  className="h-8 text-[11px]"
                  onClick={() => openReviseTargetEditor()}
                >
                  {CLAUSE_ACTION_LABELS.reviseTarget}
                </Button>
                <div className="ml-auto flex flex-wrap items-center gap-orbit-xs">
                  <Button
                    variant="outline"
                    className="h-8 text-[11px]"
                    onClick={() => {
                      onConfirmVerdictFromAction?.(r.id, rowVerdict, "Accepted supplier wording");
                      onClose(r.id);
                    }}
                  >
                    {CLAUSE_ACTION_LABELS.acceptSupplierPosition}
                  </Button>
                  <Button
                    variant="default"
                    className="h-8 text-[11px]"
                    onClick={() => {
                      if (actionabilityRequest && onContinueWithActionability) {
                        onContinueWithActionability(r.id, actionabilityRequest);
                        return;
                      }
                      onConfirmVerdictFromAction?.(r.id, rowVerdict, "Held previous target");
                      onKeepOpen(r.id);
                    }}
                  >
                    {CLAUSE_ACTION_LABELS.holdPosition}
                  </Button>
                </div>
              </div>
            );

        return (
          <ClauseDecisionCard
            key={r.id}
            id={r.id}
            clause={display}
            versionLabel={rightLabel}
            description={undefined}
            decision={bucket === "new" ? (requested ? "request-update" : noAction ? "no-action" : undefined) : undefined}
            request={basketRequest}
            draft={draft}
            isDrafting={drafting}
            changePill={r.pill}
            verdict={rowVerdict}
            verdictSuperseded={Boolean(rowConfirmation?.overrideComment)}
            deviationDelta={rowDeviationDelta}
            alteredAfterAgreement={Boolean(rowState?.alteredAfterAgreement)}
            missingClause={Boolean(display.missingClause)}
            metaPrefix={!resolvedOverrideVerdict && r.pill.status === "new" ? <span className="mr-orbit-xs text-[#0C447C]">+</span> : null}
            selectedComparisonAction={closure === "closed" || rowState?.acceptedClosed ? "accepted" : undefined}
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
            requestPlaceholder="Write the target you want to send in the next round"
            requestSubmitLabel="Save Target"
            onRequest={() => openReviseTargetEditor()}
            onNoAction={() => onClose(r.id)}
            onEditRequest={() => openReviseTargetEditor()}
            onChangeNoAction={() => openReviseTargetEditor()}
            onChangeSelectedAction={
              closure === "closed"
                ? () => {
                    onReopenAcceptedDecision?.(r.id);
                    openReviseTargetEditor("Changed accepted supplier position");
                  }
                : undefined
            }
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
    <V6OrbitConfirmOverlay
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
                <h3 className={`v6-orbit-heading-strong ${accentText}`}>
                  {title} · <span className="tabular-nums text-foreground">{displayedStats.total}</span>
                </h3>
                {bucketSummary && (
                  <span className="text-[11px] v6-orbit-weight-medium text-muted-foreground">{bucketSummary}</span>
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
              <h3 className={`v6-orbit-heading-strong ${accentText}`}>
                {title} · <span className="tabular-nums text-foreground">{displayedStats.total}</span>
              </h3>
              {bucketSummary && (
                <span className="text-[11px] v6-orbit-weight-medium text-muted-foreground">{bucketSummary}</span>
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
              <h3 className="v6-orbit-heading-strong text-foreground">
                Needs decision · <span className="tabular-nums text-muted-foreground">{rows.length}</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Clauses you didn't previously flag and the supplier didn't materially change. Expand to search this list, or use the <span className="v6-orbit-weight-medium text-foreground">filter and search above</span> to narrow results, then request a change in this round.
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
                        description={undefined}
                        decision={requested ? "request-update" : decision === "no-action" ? "no-action" : undefined}
                        request={req}
                        draft={draft}
                        isDrafting={isExpanded}
                        extraContent={
                          <SimplifiedComparisonContent
                            target={display.actionability?.trim() || req.requestedChange}
                            previousLabel={`Previous Analysis · ${leftLabel}`}
                            previousText={r.prev?.deviation ?? "Clause did not exist."}
                            currentLabel={`Current Analysis · ${rightLabel}`}
                            currentText={r.curr?.deviation ?? "Clause no longer present."}
                          />
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
      <V6OrbitConfirmOverlay
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
          <span className="text-sm v6-orbit-weight-medium text-foreground hover:text-primary">
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
          <span className="tabular-nums text-xs v6-orbit-weight-bold text-foreground">Round {parseInt(v.version.replace("v", ""), 10)}</span>
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
        <h2 className="v6-orbit-heading-5">History</h2>
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
  simplifyOutcomeStatus = false,
  changePill,
  onConfirmVerdict,
  onSupersedeVerdict,
  onReviseTarget,
  onSimulateSupplierResponse,
  onAcceptAndClose,
  onSimulateRegression,
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
  simplifyOutcomeStatus?: boolean;
  changePill: ChangePillResult;
  onConfirmVerdict: (id: string, verdict: ClauseVerdict) => void;
  onSupersedeVerdict: (id: string, original: ClauseVerdict, comment: string) => void;
  onReviseTarget: (id: string, text: string, reason?: string) => void;
  onSimulateSupplierResponse: (id: string) => void;
  onAcceptAndClose: (id: string) => void;
  onSimulateRegression: (id: string) => void;
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
  const computedVerdict = simplifyOutcomeStatus
    ? (state.closures[targetVersion] === "closed" || changePill.status === "met" ? "met" : "notmet")
    : verdictFromChangePill(changePill.status);
  const verdict = simplifyOutcomeStatus
    ? state.verdictConfirmations?.[targetVersion]?.verdict ?? computedVerdict
    : effectiveVerdict(state, targetVersion, changePill.status);
  const confirmation = state.verdictConfirmations?.[targetVersion];
  const deviationDelta = getDeviationDelta(prev, curr, state.simulatedMet ? { from: "Medium", to: "Aligned" } : state.alteredAfterAgreement ? { from: "Aligned", to: "High" } : undefined);
  const targets = targetVersionsForClause(state, request);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-foreground/25" onClick={onClose} />
      <aside className="flex h-full w-[380px] flex-col border-l border-border bg-white shadow-xl">
        <div className="shrink-0 border-b border-border px-orbit-base py-orbit-base">
          <div className="flex items-start justify-between gap-orbit-base">
            <div className="min-w-0">
              <p className="text-[9px] v6-orbit-weight-medium uppercase text-muted-foreground">{clauseId.toUpperCase()} · {def.category}</p>
              <h2 className="v6-orbit-heading-label mt-orbit-xs truncate text-foreground">
                <ClauseTitleInline clauseId={clauseId} fallback={display.title} />
              </h2>
              <div className="mt-orbit-s flex flex-wrap items-center gap-orbit-xs">
                <Badge variant="outline" className={`${severityTone(display.severity)} text-[9px]`}>{display.severity}</Badge>
                {state.alteredAfterAgreement && <Chip label="Altered after agreement" size="Mini" variant="Error" contrast="Low" />}
                {verdict ? <VerdictPill verdict={verdict} superseded={Boolean(confirmation?.overrideComment)} /> : changePill.status ? <ChangePillBadge result={changePill} /> : <RoundStatusPill status={historyRow.currentStatus}>{roundStatusLabel(historyRow.currentStatus)}</RoundStatusPill>}
                <button
                  type="button"
                  onClick={() => onViewHistory(clauseId)}
                  className="inline-flex items-center gap-orbit-xs rounded-full bg-[#FAEEDA]/70 px-orbit-s py-orbit-xxs text-[9px] v6-orbit-weight-medium text-[#633806] hover:bg-[#FAEEDA]"
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
            <p className="text-[9px] v6-orbit-weight-medium uppercase text-muted-foreground">Negotiation timeline</p>
            {mode === "comparison" && (
              <button type="button" onClick={() => onViewHistory(clauseId)} className="text-[9px] v6-orbit-weight-medium text-primary hover:underline">
                View in History →
              </button>
            )}
          </div>
          <div className="relative flex min-w-0 items-start gap-orbit-base overflow-x-auto px-orbit-xs pb-orbit-xs" aria-label={`Timeline for ${display.title}`}>
            <div className="absolute left-4 right-4 top-2 h-px bg-border" aria-hidden />
            {historyRow.cells.map((cell, index) => (
              <div key={cell.version || index} className="relative z-10 flex min-w-[42px] flex-col items-center gap-orbit-xs">
                <span className={`grid h-4 w-4 place-items-center rounded-full border text-[8px] v6-orbit-weight-medium ${roundStatusTone(cell.status)} ${index === historyRow.cells.length - 1 ? "outline outline-2 outline-offset-1 outline-[#185FA5]" : ""}`}>
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
              {state.alteredAfterAgreement && (
                <div className="rounded-md border border-[#A32D2D]/30 bg-[#FCEBEB] px-orbit-base py-orbit-s text-[11px] text-[#791F1F]">
                  <p className="v6-orbit-weight-semibold">Previously agreed — altered by the supplier.</p>
                  <p className="mt-orbit-xxs">This clause was accepted & closed. The round-over-round diff detected a change to the agreed wording and reopened it automatically.</p>
                </div>
              )}
              {callout && (
                <div className={`rounded-md border-l-2 px-orbit-s py-orbit-s text-[10px] ${callout.className}`}>
                  <p>{callout.text}</p>
                </div>
              )}
              {clauseId === DEMO_TARGET_CLAUSE_ID && !state.simulatedMet && (
                <div className="rounded-md border border-[#BCA8FF]/40 bg-[#F2EFFF] px-orbit-base py-orbit-s text-[11px] text-[#392C7D]">
                  <p className="v6-orbit-weight-semibold">Direction check</p>
                  <p className="mt-orbit-xxs">The supplier returned MORE than you asked (36 &gt; 24). For an instalment schedule, longer can favour you or work against you. Binary verdict at low confidence — confirm the direction before treating this as a shortfall.</p>
                </div>
              )}
              <SectionLabel>{leftLabel} → {rightLabel} diff</SectionLabel>
              <div className="grid grid-cols-2 gap-orbit-s">
                <div className="rounded-md bg-[#f8f7f5] px-orbit-s py-orbit-s opacity-75">
                  <p className="text-[8px] v6-orbit-weight-medium uppercase text-muted-foreground">{leftLabel} · previous</p>
                  <p className="mt-orbit-xs text-[10px] text-foreground">{isNewClause ? `(Clause did not exist in ${leftLabel})` : prev?.deviation ?? "—"}</p>
                </div>
                <div className="rounded-md bg-[#E6F1FB]/50 px-orbit-s py-orbit-s">
                  <p className="text-[8px] v6-orbit-weight-medium uppercase text-[#185FA5]">{rightLabel} · current</p>
                  <p className="mt-orbit-xs text-[10px] text-foreground">{curr?.deviation ?? display.deviation}</p>
                </div>
              </div>
              {state.alteredAfterAgreement && (
                <>
                  <SectionLabel>Agreed wording vs new redline</SectionLabel>
                  <div className="grid grid-cols-2 gap-orbit-s">
                    <div className="rounded-md border border-[#3B6D11]/20 bg-[#EAF3DE]/60 px-orbit-s py-orbit-s">
                      <p className="text-[8px] v6-orbit-weight-medium uppercase text-[#27500A]">Agreed (closed)</p>
                      <p className="mt-orbit-xs text-[10px] text-foreground">Payment terms follow the agreed 24-month instalment schedule.</p>
                    </div>
                    <div className="rounded-md border border-[#A32D2D]/25 bg-[#FCEBEB]/70 px-orbit-s py-orbit-s">
                      <p className="text-[8px] v6-orbit-weight-medium uppercase text-[#791F1F]">New redline — change detected</p>
                      <p className="mt-orbit-xs text-[10px] text-foreground">Payment terms follow the agreed 24-month instalment schedule <mark className="rounded bg-[#F3B4B4]/50 px-0.5">, subject to the Supplier's right to extend the schedule by up to twelve (12) months on written notice where its input costs increase</mark>.</p>
                    </div>
                  </div>
                </>
              )}
              <SectionLabel>AI analysis</SectionLabel>
              <p className="rounded-md bg-[#f8f7f5] px-orbit-s py-orbit-s text-[11px] text-muted-foreground">
                {verdict === "notmet" && deviationDelta
                  ? "Not Met — the supplier conceded movement, but withheld the requested position. Deviation improved: they are moving on this clause."
                  : verdict === "notmet"
                  ? "Not Met — the supplier has not accepted the requested position, and deviation hasn't moved: a stonewall, not a negotiation."
                  : display.improvementReason ?? display.actionability ?? `Based on the playbook benchmark for ${def.category}, review this clause before accepting the version.`}
              </p>
              {(changePill.status === "met" || changePill.status === "not_met") && request?.requestedChange && (
                <>
                  <SectionLabel>Your request</SectionLabel>
                  <p className="rounded-md bg-[#f8f7f5] px-orbit-s py-orbit-s text-[11px] text-muted-foreground">{request.requestedChange}</p>
                </>
              )}
              {computedVerdict && (
                <VerdictConfirmationPanel
                  verdict={computedVerdict}
                  confirmation={confirmation}
                  onAgree={() => onConfirmVerdict(clauseId, computedVerdict)}
                  onSupersede={(comment) => onSupersedeVerdict(clauseId, computedVerdict, comment)}
                />
              )}
              <TargetLineagePanel
                targets={targets}
                supplierText={demoSupplierReturnedText(clauseId, state.simulatedMet)}
                verdict={verdict}
                targetVersion={targetVersion}
                simulatedMet={Boolean(state.simulatedMet)}
              />
              {verdict === "notmet" && !state.alteredAfterAgreement && (
                <ReviseTargetPanel
                  clauseId={clauseId}
                  nextVersion={targets.length + 1}
                  supplierText={demoSupplierReturnedText(clauseId, state.simulatedMet)}
                  onRevise={(text, reason) => onReviseTarget(clauseId, text, reason)}
                />
              )}
              {clauseId === DEMO_TARGET_CLAUSE_ID && targets.length >= 2 && !state.simulatedMet && (
                <Button variant="outline" className="h-8 border-dashed text-xs" onClick={() => onSimulateSupplierResponse(clauseId)}>
                  ▶ Simulate supplier response
                </Button>
              )}
              {state.acceptedClosed && !state.alteredAfterAgreement && (
                <div className="rounded-md border border-[#3B6D11]/25 bg-[#EAF3DE] px-orbit-base py-orbit-s text-[11px] text-[#27500A]">
                  <p className="v6-orbit-weight-semibold">Accepted & closed. The clause exits the working queue.</p>
                  <p className="mt-orbit-xxs">Closed means monitored, not forgotten: the round-over-round diff keeps watching this clause.</p>
                </div>
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
                      <p className="v6-orbit-weight-medium text-foreground">Round {index + 1} · {cell.version}</p>
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
            View Full Text
          </Button>
          {state.alteredAfterAgreement ? (
            <div className="ml-auto flex items-center gap-orbit-xs">
              <Button className="h-8 bg-[#1a2744] px-orbit-base text-xs text-white hover:bg-[#243454]" onClick={() => onMarkNewIssue(clauseId)}>Reject — Restore Agreed Wording</Button>
              <Button variant="outline" className="h-8 text-xs" onClick={() => onCloseClause(clauseId)}>Accept Their Change</Button>
              <Button variant="outline" className="h-8 text-xs" onClick={() => onKeepOpen(clauseId)}>Park &amp; Escalate</Button>
            </div>
          ) : verdict === "met" ? (
            <ClauseJourneyActions
              canSimulateRegression={clauseId === DEMO_REGRESSION_CLAUSE_ID || state.acceptedClosed}
              onRevise={() => {
                confirmVerdictFromAction(clauseId, verdict, "Chose to revise target");
                onKeepOpen(clauseId);
              }}
              onAccept={() => onAcceptAndClose(clauseId)}
              onHold={() => {
                confirmVerdictFromAction(clauseId, verdict, "Held previous target");
                onKeepOpen(clauseId);
              }}
              onSimulateRegression={() => onSimulateRegression(clauseId)}
            />
          ) : (
            <ClauseJourneyActions
              canSimulateRegression={false}
              onRevise={() => {
                confirmVerdictFromAction(clauseId, verdict, "Chose to revise target");
                onKeepOpen(clauseId);
              }}
              onAccept={() => {
                confirmVerdictFromAction(clauseId, verdict, "Accepted supplier wording");
                onCloseClause(clauseId);
              }}
              onHold={() => {
                confirmVerdictFromAction(clauseId, verdict, "Held previous target");
                onKeepOpen(clauseId);
              }}
              onSimulateRegression={() => onSimulateRegression(clauseId)}
            />
          )}
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

function VerdictConfirmationPanel({
  verdict,
  confirmation,
  onAgree,
  onSupersede,
}: {
  verdict: ClauseVerdict;
  confirmation?: {
    verdict: ClauseVerdict;
    originalVerdict?: ClauseVerdict;
    confirmedBy?: string;
    confirmedAt?: string;
    overrideComment?: string;
  };
  onAgree: () => void;
  onSupersede: (comment: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [error, setError] = useState(false);
  const corrected: ClauseVerdict = verdict === "met" ? "notmet" : "met";

  if (confirmation?.overrideComment) {
    return (
      <div className="rounded-md border border-[#A32D2D]/25 bg-[#FCEBEB]/60 px-orbit-base py-orbit-s text-[11px] text-[#791F1F]">
        Verdict superseded by {confirmation.confirmedBy ?? CURRENT_USER_LABEL}:{" "}
        <span className="line-through">{verdictLabel(confirmation.originalVerdict ?? verdict)}</span> →{" "}
        <span className="v6-orbit-weight-semibold">{verdictLabel(confirmation.verdict)}</span> — "{confirmation.overrideComment}"
      </div>
    );
  }

  if (confirmation) {
    return (
      <div className="rounded-md border border-[#3B6D11]/25 bg-[#EAF3DE]/70 px-orbit-base py-orbit-s text-[11px] text-[#27500A]">
        ✓ Verdict confirmed by {confirmation.confirmedBy ?? CURRENT_USER_LABEL} · {formatShortDate(confirmation.confirmedAt ?? new Date().toISOString())}
      </div>
    );
  }

  return (
    <div className="border-t border-dashed border-border pt-orbit-base">
      <div className="flex flex-wrap items-center justify-between gap-orbit-s">
        <p className="text-[11px] v6-orbit-weight-medium text-foreground">Do you agree with this verdict?</p>
        <div className="flex items-center gap-orbit-xs">
          <Button variant="outline" className="h-7 border-[#3B6D11]/30 text-[11px] text-[#27500A]" onClick={onAgree}>✓ Agree</Button>
          <Button variant="outline" className="h-7 border-[#A32D2D]/30 text-[11px] text-[#791F1F]" onClick={() => setOpen(true)}>✕ Disagree</Button>
        </div>
      </div>
      {open && (
        <div className="mt-orbit-s rounded-md border border-[#A32D2D]/25 bg-[#FCEBEB]/60 p-orbit-s">
          <p className="text-[11px] v6-orbit-weight-semibold text-[#791F1F]">Supersede the AI verdict</p>
          <p className="mt-orbit-xxs text-[10px] text-[#791F1F]">Corrected verdict: {verdictLabel(verdict)} → {verdictLabel(corrected)}</p>
          <Textarea
            className="mt-orbit-s min-h-20 text-xs"
            value={comment}
            placeholder="Reason for the override — required, kept in the audit trail."
            onChange={(event) => {
              setComment(event.target.value);
              setError(false);
            }}
          />
          {error && <p className="mt-orbit-xs text-[10px] text-[#A32D2D]">A comment is required to supersede a verdict</p>}
          <Button
            className="mt-orbit-s h-8 text-xs"
            onClick={() => {
              if (!comment.trim()) {
                setError(true);
                return;
              }
              onSupersede(comment.trim());
            }}
          >
            Save Override
          </Button>
        </div>
      )}
    </div>
  );
}

function TargetLineagePanel({
  targets,
  supplierText,
  verdict,
  targetVersion,
  simulatedMet,
}: {
  targets: ClauseTargetVersion[];
  supplierText: string;
  verdict: ClauseVerdict | null;
  targetVersion: string;
  simulatedMet: boolean;
}) {
  return (
    <div className="rounded-md border border-border bg-card p-orbit-base">
      <SectionLabel>Target lineage</SectionLabel>
      <ol className="mt-orbit-s space-y-orbit-s border-l border-border pl-orbit-base">
        {targets.map((target) => (
          <li key={target.version} className="relative text-[11px]">
            <span className="absolute -left-[19px] top-1 h-2.5 w-2.5 rounded-full border-2 border-card bg-[#185FA5]" />
            <p className="text-[9px] v6-orbit-weight-semibold uppercase text-muted-foreground">Our side · Round {target.round} · {formatShortDate(target.createdAt)}</p>
            <p className="mt-orbit-xxs text-foreground">Target v{target.version}: {target.text}</p>
            {target.reason && <p className="mt-orbit-xxs italic text-muted-foreground">{target.reason}</p>}
          </li>
        ))}
        <li className="relative text-[11px]">
          <span className="absolute -left-[19px] top-1 h-2.5 w-2.5 rounded-full border-2 border-card bg-[#BA7517]" />
          <p className="text-[9px] v6-orbit-weight-semibold uppercase text-muted-foreground">Supplier · {targetVersion}</p>
          <p className="mt-orbit-xxs text-foreground">Returned: {supplierText}</p>
          {verdict && <p className="mt-orbit-xxs text-muted-foreground">Graded vs v{targets.at(-1)?.version ?? 1}: {verdict === "met" ? "Met" : "Not Met"} — frozen</p>}
        </li>
        {!simulatedMet && (
          <li className="relative text-[11px]">
            <span className="absolute -left-[19px] top-1 h-2.5 w-2.5 rounded-full border-2 border-dashed border-muted-foreground bg-card" />
            <p className="text-[9px] v6-orbit-weight-semibold uppercase text-muted-foreground">Pending · Next round</p>
            <p className="mt-orbit-xxs text-muted-foreground">Awaiting supplier response to the next target.</p>
          </li>
        )}
      </ol>
    </div>
  );
}

function ReviseTargetPanel({
  clauseId,
  nextVersion,
  supplierText,
  onRevise,
}: {
  clauseId: string;
  nextVersion: number;
  supplierText: string;
  onRevise: (text: string, reason?: string) => void;
}) {
  const [text, setText] = useState(clauseId === DEMO_TARGET_CLAUSE_ID ? "30-month instalment schedule" : supplierText);
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="rounded-md border border-[#185FA5]/20 bg-[#E6F1FB]/45 p-orbit-base">
      <p className="text-[11px] v6-orbit-weight-semibold text-[#0C447C]">Revise target</p>
      <p className="mt-orbit-xxs text-[10px] text-[#0C447C]">Pre-filled with the supplier's returned wording — edit it into your next ask. This creates target v{nextVersion}; the previous verdict stays frozen.</p>
      <Textarea className="mt-orbit-s min-h-20 text-xs" value={text} onChange={(event) => setText(event.target.value)} />
      <Input className="mt-orbit-s h-9 text-xs" value={reason} placeholder="Why the target moved (optional, kept for the audit trail)" onChange={(event) => setReason(event.target.value)} />
      <Button
        className="mt-orbit-s h-8 text-xs"
        disabled={!text.trim()}
        onClick={() => {
          onRevise(text, reason);
          setSubmitted(true);
        }}
      >
        Set as Round {nextVersion} Target (v{nextVersion})
      </Button>
      {submitted && (
        <p className="mt-orbit-s text-[10px] text-[#0C447C]">Round {nextVersion} target set (v{nextVersion}): {text}. The previous verdict is preserved in the lineage.</p>
      )}
    </div>
  );
}

function ClauseJourneyActions({
  canSimulateRegression,
  onRevise,
  onAccept,
  onHold,
  onSimulateRegression,
}: {
  canSimulateRegression: boolean;
  onRevise: () => void;
  onAccept: () => void;
  onHold: () => void;
  onSimulateRegression: () => void;
}) {
  return (
    <div className="ml-auto flex flex-wrap items-center justify-end gap-orbit-xs">
      <Button className="h-8 bg-[#1a2744] px-orbit-base text-xs text-white hover:bg-[#243454]" onClick={onRevise}>{CLAUSE_ACTION_LABELS.reviseTarget}</Button>
      <Button variant="outline" className="h-8 text-xs" onClick={onHold}>{CLAUSE_ACTION_LABELS.holdPosition}</Button>
      <Button variant="default" className="h-8 text-xs" onClick={onAccept}>{CLAUSE_ACTION_LABELS.acceptSupplierPosition}</Button>
      {canSimulateRegression && (
        <Button variant="outline" className="h-8 border-dashed text-xs" onClick={onSimulateRegression}>▶ Simulate Next-Round Redline</Button>
      )}
    </div>
  );
}

function SignoffView({
  items,
  outstandingCount,
  auditLog,
  auditPackOpen,
  onClose,
  onResolve,
  onNoteChange,
  onSaveNote,
  onExport,
}: {
  items: Array<{ id: string; title: string; status: ClauseVerdict | "escalated"; note: string; resolved: boolean }>;
  outstandingCount: number;
  auditLog: SessionAuditEntry[];
  auditPackOpen: boolean;
  onClose: () => void;
  onResolve: (id: string) => void;
  onNoteChange: (id: string, note: string) => void;
  onSaveNote: (id: string) => void;
  onExport: () => void;
}) {
  const closed = items.filter((item) => item.resolved).length;
  const escalated = items.filter((item) => item.status === "escalated").length;
  const overrides = auditLog.filter((entry) => entry.entry.toLowerCase().includes("superseded")).length;
  const supplierChanges = auditLog.filter((entry) => entry.entry.toLowerCase().includes("redline") || entry.entry.toLowerCase().includes("supplier")).length;

  return (
    <main className="mx-auto max-w-[1200px] space-y-orbit-base px-orbit-base py-orbit-m">
      <div className="flex flex-wrap items-center justify-between gap-orbit-base">
        <div>
          <p className="text-[10px] v6-orbit-weight-semibold uppercase tracking-[0.08em] text-muted-foreground">Round sign-off</p>
          <h2 className="v6-orbit-heading-3 text-foreground">Negotiation audit pack</h2>
        </div>
        <Button variant="outline" className="h-9 text-xs" onClick={onClose}>Back to Review</Button>
      </div>
      <div className="grid gap-orbit-base md:grid-cols-3">
        <Card type="Static" padding="Base" state="Success">
          <Text as="p" size="Small" variant="Secondary">Analysis score</Text>
          <p className="mt-orbit-xs text-2xl v6-orbit-weight-bold text-[#27500A]">52 → 74 → 91</p>
        </Card>
        <Card type="Static" padding="Base">
          <Text as="p" size="Small" variant="Secondary">Outcomes</Text>
          <p className="mt-orbit-xs text-sm text-foreground">{closed} closed · {Math.max(0, closed - escalated)} landed after re-send · {escalated} escalated · {overrides} verdict override(s) · {supplierChanges} supplier change(s) caught</p>
        </Card>
        <Card type="Static" padding="Base">
          <Text as="p" size="Small" variant="Secondary">Time in tool</Text>
          <p className="mt-orbit-xs text-sm text-foreground">R1 ~40 min · R2 ~30 min · sign-off ~10 min</p>
        </Card>
      </div>
      <Card type="Static" padding="Base">
        <div className="space-y-orbit-s">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No session actions have been created yet.</p>
          ) : items.map((item) => (
            <div key={item.id} className="rounded-md border border-border p-orbit-base">
              <div className="flex flex-wrap items-start justify-between gap-orbit-s">
                <div>
                  <p className="v6-orbit-heading-label text-foreground">{item.title}</p>
                  {item.status === "escalated" ? <Chip label="Escalated" size="Mini" variant="Warning" contrast="Low" /> : <VerdictPill verdict={item.status} />}
                </div>
                {item.status === "escalated" ? (
                  <Button variant="outline" className="h-8 text-xs" onClick={() => onSaveNote(item.id)}>Save Note &amp; Mark Resolved</Button>
                ) : (
                  <Button variant="outline" className="h-8 text-xs" onClick={() => onResolve(item.id)} disabled={item.resolved}>
                  {item.resolved ? "Resolved" : "Mark Resolved"}
                  </Button>
                )}
              </div>
              {item.status === "escalated" && (
                <>
                  <Textarea
                    className="mt-orbit-s min-h-20 text-xs"
                    value={item.note}
                    placeholder="e.g. Verbal agreement on the call: supplier concedes the credit schedule if we commit to the 3-year term — legal drafting to follow."
                    onChange={(event) => onNoteChange(item.id, event.target.value)}
                  />
                  {item.note && <p className="mt-orbit-xs text-[11px] italic text-muted-foreground">{item.note}</p>}
                </>
              )}
            </div>
          ))}
        </div>
      </Card>
      <div className="flex justify-end">
        <Button className="h-9" disabled={outstandingCount > 0} onClick={onExport}>
          {outstandingCount > 0 ? `Export Audit Pack (${outstandingCount} Items Outstanding)` : "Export Audit Pack"}
        </Button>
      </div>
      {auditPackOpen && (
        <Card type="Static" padding="Base" state="Success">
          <p className="v6-orbit-heading-label text-foreground">Audit pack ready</p>
          <div className="mt-orbit-s space-y-orbit-xs text-sm text-foreground">
            <p>Score trajectory: 52 → 74 → 91.</p>
            <p>Target lineage preserved per clause — every version, every reason, every verdict frozen against its round.</p>
            {auditLog.map((entry) => (
              <p key={`${entry.timestamp}-${entry.clauseId}`} className="text-xs text-muted-foreground">
                {formatShortDate(entry.timestamp)} · {entry.clauseId.toUpperCase()} · {entry.entry}
              </p>
            ))}
            <p className="text-xs v6-orbit-weight-semibold text-[#27500A]">{auditLog.length} logged actions, timestamped and attributable · export as PDF/docx in production.</p>
          </div>
        </Card>
      )}
    </main>
  );
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
  if (status === "regressed") return <Button className={className} onClick={onMarkNewIssue}>Request Revert</Button>;
  if (status === "new" || status === "improved") {
    return <Button className={className} onClick={onCloseClause}>{CLAUSE_ACTION_LABELS.acceptSupplierPosition}</Button>;
  }
  if (status === "met") return <Button className={className} onClick={onCloseClause}>Mark Resolved</Button>;
  if (status === "not_met") return <Button className={className} onClick={onKeepOpen}>Re-Request</Button>;
  return <Button className={className} onClick={onMarkNewIssue}>Request Change</Button>;
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
            <p className="text-[10px] tabular-nums v6-orbit-weight-bold text-muted-foreground">{clauseId.toUpperCase()} · {def.category}</p>
            <h2 className="v6-orbit-heading-4">{display.title}</h2>
            <p className="text-xs tabular-nums text-muted-foreground">{display.subclause}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-orbit-xs">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-orbit-m space-y-orbit-m">
          {directionalCallout && (
            <div className={`rounded-md border px-orbit-base py-orbit-s text-sm ${directionalCallout.className}`}>
              <p className="v6-orbit-weight-medium">{directionalCallout.title}</p>
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
                <span className="text-[10px] tabular-nums v6-orbit-weight-semibold text-muted-foreground uppercase">{leftLabel}</span>
                <Badge variant="outline" className={severityTone((prev ?? display).severity)}>{prev?.severity ?? "—"}</Badge>
              </div>
              <LocationsList items={prev?.locations} />
            </div>
            <div className="rounded-md border border-border bg-card p-orbit-base space-y-orbit-s">
              <div className="flex items-center justify-between">
                <span className="text-[10px] tabular-nums v6-orbit-weight-semibold text-muted-foreground uppercase">{rightLabel}</span>
                <Badge variant="outline" className={severityTone((curr ?? display).severity)}>{curr?.severity ?? "—"}</Badge>
              </div>
              <LocationsList items={curr?.locations} />
            </div>
          </div>
          {display.actionability && (
            <div className="rounded-md border border-primary/20 bg-primary/5 p-orbit-base space-y-orbit-xs">
              <p className="text-[10px] v6-orbit-weight-semibold text-primary uppercase tracking-wider flex items-center gap-orbit-xs">
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
                      <p className="text-[10px] v6-orbit-weight-semibold text-primary uppercase tracking-wider">{v}</p>
                      {r.requestedChange && (
                        <p><span className="text-[10px] v6-orbit-weight-semibold text-muted-foreground uppercase mr-orbit-s">Ask</span>{r.requestedChange}</p>
                      )}
                      {r.rationale && (
                        <p><span className="text-[10px] v6-orbit-weight-semibold text-muted-foreground uppercase mr-orbit-s">Why</span>{r.rationale}</p>
                      )}
                    </div>
                  ))}
              </div>
            </>
          )}


          {/* Action panel */}
          <div className="sticky bottom-0 -mx-orbit-m px-orbit-m py-orbit-base bg-background border-t border-border flex items-center justify-between flex-wrap gap-orbit-base">
            <div className="text-xs text-muted-foreground flex items-center gap-orbit-s">
              <span className="v6-orbit-weight-semibold">{leftLabel} → {rightLabel}:</span>
              {changePill.status ? (
                <ChangePillBadge result={changePill} />
              ) : (
                <Badge variant="outline" className={`${materialChangeTone(change)} text-[10px]`}>{materialChangeLabel(change)}</Badge>
              )}
              {state.closures[targetVersion] && (
                <span>· status <span className="v6-orbit-weight-semibold text-foreground">{state.closures[targetVersion]}</span></span>
              )}
            </div>
            <div className="flex items-center gap-orbit-s">
              {changePill.status === "improved" ? (
                <>
                  <Button className="h-8 gap-orbit-xs text-xs" onClick={() => onCloseClause(clauseId)}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> {CLAUSE_ACTION_LABELS.acceptSupplierPosition}
                  </Button>
                  <Button variant="outline" className="h-8 text-xs gap-orbit-xs" onClick={() => onMarkNewIssue(clauseId)}>
                    Challenge Change
                  </Button>
                </>
              ) : changePill.status === "regressed" ? (
                <>
                  <Button className="h-8 gap-orbit-xs text-xs" onClick={() => onMarkNewIssue(clauseId)}>
                    <AlertTriangle className="w-3.5 h-3.5" /> Request Revert
                  </Button>
                  <Button variant="outline" className="h-8 text-xs gap-orbit-xs" onClick={() => onCloseClause(clauseId)}>
                    Accept Change
                  </Button>
                </>
              ) : changePill.status === "new" ? (
                <>
                  <Button className="h-8 gap-orbit-xs text-xs" onClick={() => onCloseClause(clauseId)}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> {CLAUSE_ACTION_LABELS.acceptSupplierPosition}
                  </Button>
                  <Button variant="outline" className="h-8 text-xs gap-orbit-xs" onClick={() => onMarkNewIssue(clauseId)}>
                    Request Removal
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="h-8 text-xs gap-orbit-xs" onClick={() => onKeepOpen(clauseId)}>
                    <ArrowRight className="w-3.5 h-3.5" /> {CLAUSE_ACTION_LABELS.holdPosition}
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
  return <p className="text-[10px] v6-orbit-weight-semibold text-muted-foreground uppercase tracking-wider">{children}</p>;
}

function SidePanel({ label, clause, highlight }: { label: string; clause?: ClauseResult; highlight?: boolean }) {
  return (
    <div className={`rounded-md border p-orbit-base space-y-orbit-s ${highlight ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] tabular-nums v6-orbit-weight-semibold text-muted-foreground uppercase">{label}</span>
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
      <span className="text-[10px] tabular-nums v6-orbit-weight-semibold text-muted-foreground uppercase">{label}</span>
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
            "h-7 rounded-md text-[11px] v6-orbit-weight-medium capitalize transition-colors",
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
        <p className="text-[10px] v6-orbit-weight-semibold uppercase tracking-[0.08em] text-muted-foreground">Scope</p>
        <p className="mt-orbit-xs text-sm v6-orbit-weight-semibold text-foreground">
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
        <div className="border-b border-border bg-[#f8f7f5] px-orbit-base py-orbit-s text-[9px] v6-orbit-weight-medium uppercase tracking-[0.04em] text-muted-foreground">Clause</div>
        {versions.map((version, index) => (
          <div key={version.version} className="border-b border-border bg-[#f8f7f5] px-orbit-s py-orbit-s text-center text-[9px] v6-orbit-weight-medium uppercase tracking-[0.04em] text-muted-foreground">
            R{index + 1} {version.version}
          </div>
        ))}
        <div className="border-b border-border bg-[#f8f7f5] px-orbit-s py-orbit-s text-center text-[9px] v6-orbit-weight-medium uppercase tracking-[0.04em] text-muted-foreground">Status</div>
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
              <p className="truncate text-[11px] v6-orbit-weight-medium text-foreground">{row.title}</p>
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
    <span className={`inline-flex rounded-full border px-orbit-xs py-orbit-xxs text-[9px] v6-orbit-weight-medium ${roundStatusTone(status)}`}>
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
  if (status === "not_met") return "Not Met";
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
          <p className="text-[10px] tabular-nums v6-orbit-weight-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-orbit-xs">
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
            <p className="text-[10px] v6-orbit-weight-semibold uppercase text-muted-foreground tracking-wider">Expectation</p>
            <p className="text-sm text-foreground">{audit.expectation}</p>
          </div>
          {audit.matchedExcerpt && (
            <div>
              <p className="text-[10px] v6-orbit-weight-semibold uppercase text-muted-foreground tracking-wider">Matched clause excerpt</p>
              <p className="text-xs italic text-muted-foreground border-l-2 border-primary/40 pl-orbit-s mt-orbit-xs">"{audit.matchedExcerpt}"</p>
              {audit.location && <p className="text-[11px] tabular-nums text-muted-foreground mt-orbit-xs">Location: {audit.location}</p>}
            </div>
          )}
          <div>
            <p className="text-[10px] v6-orbit-weight-semibold uppercase text-muted-foreground tracking-wider">AI rationale</p>
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
                      <span className="tabular-nums text-[11px] v6-orbit-weight-semibold text-foreground">{h.version}</span>
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
