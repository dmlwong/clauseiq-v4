import type { ClauseDecisionState } from "@/hooks/use-clause-decisions";
import { CLAUSE_FRAMEWORK } from "@/lib/clauses-framework";
import {
  determineChangePill,
  sortChangePillStatus,
  type ChangePillResult,
  type ComparisonBucketKey,
  type VersionComparisonPair,
} from "@/lib/change-tracking";
import type { ClauseResult, ContractVersion } from "@/lib/workflow-types";

export type DeviationDistribution = Record<"high" | "medium" | "low" | "clean", number>;
export type ScoreBand = "A" | "B" | "C" | "D" | "F";
export type ClauseIqMode = "comparison" | "history";
export type ComparisonTab = "changes" | "all";
export type HistoryFilter = "all" | "still_open" | "regressed_last_round" | "met" | "new_clauses";
export type HistorySort = "contentious" | "clause_id" | "current_status" | "rounds_to_resolve";
export type RoundStatus = "requested" | "open" | "updated" | "met" | "not_met" | "regressed" | "new" | "missing";
export type ComparisonActionState =
  | "unreviewed"
  | "drafting"
  | "requested"
  | "submitted_request"
  | "no_action"
  | "closed"
  | "keep_open"
  | "follow_up";

export interface ComparisonRow {
  id: string;
  prev?: ClauseResult;
  curr?: ClauseResult;
  pill: ChangePillResult;
  bucket: ComparisonBucketKey;
  wasRequested: boolean;
  closed: boolean;
  actionState: ComparisonActionState;
}

export interface ComparisonContractFacts {
  version: string;
  high: number;
  medium: number;
  low: number;
  total: number;
  score: number;
  band: ScoreBand;
  distribution: DeviationDistribution;
}

export interface ComparisonFacts {
  met: number;
  notMet: number;
  improved: number;
  regressed: number;
  new: number;
  requestedTotal: number;
  supplierChanges: number;
  scoreDelta: number;
}

export interface ComparisonActionFacts {
  pendingReview: number;
  draftedRequests: number;
  pendingRequests: number;
  submittedRequests: number;
  noAction: number;
  closed: number;
  keepOpen: number;
  followUp: number;
  actioned: number;
}

export interface ComparisonBucketStats extends ComparisonActionFacts {
  total: number;
  visible: number;
  unreviewed: number;
}

export interface ComparisonStripStats {
  contract: ComparisonContractFacts;
  comparison: ComparisonFacts;
  actions: ComparisonActionFacts;
}

export interface VersionPanelData {
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

export interface ClauseIqComparisonModel {
  pair: VersionComparisonPair;
  leftVersion?: ContractVersion;
  rightVersion?: ContractVersion;
  hasComparison: boolean;
  buckets: Record<ComparisonBucketKey, ComparisonRow[]>;
  changeTracking: {
    met: number;
    notMet: number;
    improved: number;
    regressed: number;
    new: number;
    requestedTotal: number;
    supplierChanges: number;
    needAction: number;
  };
  contractFacts: ComparisonContractFacts;
  comparisonFacts: ComparisonFacts;
  actionFacts: ComparisonActionFacts;
  bucketStats: Record<ComparisonBucketKey, ComparisonBucketStats>;
  stripStats: ComparisonStripStats;
  severityCounts: {
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  panel: VersionPanelData;
}

export interface HistoryRoundCell {
  version: string;
  uploadedAt: string;
  status: RoundStatus;
  label: string;
  clause?: ClauseResult;
}

export interface HistoryRow {
  id: string;
  title: string;
  category: string;
  cells: HistoryRoundCell[];
  currentStatus: RoundStatus;
  currentPill: ChangePillResult;
  stateChanges: number;
  roundsToResolve: number | null;
  existsInRounds: number;
}

export interface HistoryCategory {
  name: string;
  count: number;
}

export interface ClauseIqHistoryModel {
  rows: HistoryRow[];
  filteredRows: HistoryRow[];
  categories: HistoryCategory[];
  stats: {
    totalClauses: number;
    roundCount: number;
    stillOpen: number;
    avgRoundsToResolve: number;
    settledByRound3Pct: number;
    regressedLastRound: number;
    met: number;
    newClauses: number;
  };
  filterCounts: Record<HistoryFilter, number>;
}

export function versionOrder(version: string) {
  const match = /^v(\d+)$/i.exec(version);
  return match ? Number.parseInt(match[1], 10) : 0;
}

export function defaultVersionComparisonPair(versions: ContractVersion[]): VersionComparisonPair {
  if (versions.length >= 2) {
    return {
      from: versions[versions.length - 2].version,
      to: versions[versions.length - 1].version,
    };
  }
  const only = versions[0]?.version ?? "";
  return { from: only, to: only };
}

export function normalizeVersionComparisonPair(
  versions: ContractVersion[],
  requested?: Partial<VersionComparisonPair> | null,
): VersionComparisonPair {
  const fallback = defaultVersionComparisonPair(versions);
  if (versions.length <= 1) return fallback;

  const labels = versions.map((version) => version.version);
  const from = requested?.from && labels.includes(requested.from) ? requested.from : fallback.from;
  let to = requested?.to && labels.includes(requested.to) ? requested.to : fallback.to;

  if (from === to || versionOrder(from) >= versionOrder(to)) {
    const fromIndex = labels.indexOf(from);
    const next = labels.slice(fromIndex + 1).find(Boolean);
    if (next) to = next;
    else return fallback;
  }

  return { from, to };
}

export function wasRequestedByVersion(
  state: ClauseDecisionState | undefined,
  versions: ContractVersion[],
  versionLabel: string | undefined,
) {
  if (!state || !versionLabel) return false;
  const versionIndex = versions.findIndex((version) => version.version === versionLabel);
  if (versionIndex < 0) return false;

  return Object.entries(state.roundDecisions).some(([version, decision]) => {
    const candidateIndex = versions.findIndex((candidate) => candidate.version === version);
    return decision === "request-update" && candidateIndex >= 0 && candidateIndex <= versionIndex;
  });
}

function actionStateForRow(
  state: ClauseDecisionState | undefined,
  targetVersion: string | undefined,
  bucket: ComparisonBucketKey,
): ComparisonActionState {
  if (!targetVersion) return "unreviewed";

  const closure = state?.closures?.[targetVersion];
  if (closure === "closed") return "closed";
  if (closure === "keep-open") return "keep_open";
  if (closure === "follow-up") return "follow_up";

  if (state?.draftRequests?.[targetVersion]) return "drafting";

  const decision = state?.roundDecisions?.[targetVersion];
  if (decision === "request-update") {
    const request = state?.requests?.[targetVersion];
    if (request?.state === "submitted") return "submitted_request";
    return "requested";
  }
  if (decision === "no-action") return "no_action";

  if (bucket === "open_items" || bucket === "new_changes") return "unreviewed";
  return "unreviewed";
}

function isPendingReview(row: Pick<ComparisonRow, "bucket" | "actionState">) {
  return (
    (row.bucket === "open_items" || row.bucket === "new_changes") &&
    (row.actionState === "unreviewed" || row.actionState === "drafting")
  );
}

function isActioned(row: Pick<ComparisonRow, "actionState">) {
  return (
    row.actionState === "requested" ||
    row.actionState === "submitted_request" ||
    row.actionState === "no_action" ||
    row.actionState === "closed" ||
    row.actionState === "keep_open" ||
    row.actionState === "follow_up"
  );
}

export function summariseComparisonRows(rows: ComparisonRow[]): ComparisonBucketStats {
  return rows.reduce<ComparisonBucketStats>(
    (stats, row) => {
      stats.total += 1;
      stats.visible += 1;
      if (row.actionState === "unreviewed") stats.unreviewed += 1;
      if (row.actionState === "drafting") stats.draftedRequests += 1;
      if (row.actionState === "requested") stats.pendingRequests += 1;
      if (row.actionState === "submitted_request") stats.submittedRequests += 1;
      if (row.actionState === "no_action") stats.noAction += 1;
      if (row.actionState === "closed") stats.closed += 1;
      if (row.actionState === "keep_open") stats.keepOpen += 1;
      if (row.actionState === "follow_up") stats.followUp += 1;
      if (isPendingReview(row)) stats.pendingReview += 1;
      if (isActioned(row)) stats.actioned += 1;
      return stats;
    },
    {
      total: 0,
      visible: 0,
      pendingReview: 0,
      draftedRequests: 0,
      pendingRequests: 0,
      submittedRequests: 0,
      noAction: 0,
      closed: 0,
      keepOpen: 0,
      followUp: 0,
      actioned: 0,
      unreviewed: 0,
    },
  );
}

function summariseComparisonBuckets(buckets: Record<ComparisonBucketKey, ComparisonRow[]>) {
  return {
    open_items: summariseComparisonRows(buckets.open_items),
    new_changes: summariseComparisonRows(buckets.new_changes),
    closed: summariseComparisonRows(buckets.closed),
    unmarked: summariseComparisonRows(buckets.unmarked),
  };
}

function summariseComparisonActions(bucketStats: Record<ComparisonBucketKey, ComparisonBucketStats>): ComparisonActionFacts {
  return Object.values(bucketStats).reduce<ComparisonActionFacts>(
    (facts, stats) => {
      facts.pendingReview += stats.pendingReview;
      facts.draftedRequests += stats.draftedRequests;
      facts.pendingRequests += stats.pendingRequests;
      facts.submittedRequests += stats.submittedRequests;
      facts.noAction += stats.noAction;
      facts.closed += stats.closed;
      facts.keepOpen += stats.keepOpen;
      facts.followUp += stats.followUp;
      facts.actioned += stats.actioned;
      return facts;
    },
    {
      pendingReview: 0,
      draftedRequests: 0,
      pendingRequests: 0,
      submittedRequests: 0,
      noAction: 0,
      closed: 0,
      keepOpen: 0,
      followUp: 0,
      actioned: 0,
    },
  );
}

function contractFactsForVersion(version?: ContractVersion): ComparisonContractFacts {
  const severity = severityCountsForVersion(version);
  const score = version?.overallScore ?? 0;
  return {
    version: version?.version ?? "",
    high: severity.high,
    medium: severity.medium,
    low: severity.low,
    total: severity.total,
    score,
    band: scoreBand(score),
    distribution: version ? distributionForVersion(version) : { high: 0, medium: 0, low: 0, clean: 0 },
  };
}

export function deriveComparisonModel(
  versions: ContractVersion[],
  requestedPair: VersionComparisonPair,
  decisions: Record<string, ClauseDecisionState>,
): ClauseIqComparisonModel {
  const pair = normalizeVersionComparisonPair(versions, requestedPair);
  const leftVersion = versions.find((version) => version.version === pair.from);
  const rightVersion = versions.find((version) => version.version === pair.to);
  const hasComparison = Boolean(leftVersion && rightVersion && leftVersion.version !== rightVersion.version);

  const buckets: Record<ComparisonBucketKey, ComparisonRow[]> = {
    open_items: [],
    new_changes: [],
    closed: [],
    unmarked: [],
  };
  const changeTracking = {
    met: 0,
    notMet: 0,
    improved: 0,
    regressed: 0,
    new: 0,
    requestedTotal: 0,
    supplierChanges: 0,
    needAction: 0,
  };

  if (hasComparison && leftVersion && rightVersion) {
    for (const def of CLAUSE_FRAMEWORK) {
      const prev = leftVersion.clauses.find((clause) => clause.id === def.id);
      const curr = rightVersion.clauses.find((clause) => clause.id === def.id);
      const state = decisions[def.id];
      const wasRequested = wasRequestedByVersion(state, versions, leftVersion.version);
      const pill = determineChangePill({
        clause: curr,
        previousClause: prev,
        wasRequestedInPreviousRound: wasRequested,
      });
      const closed = state?.closures?.[rightVersion.version] === "closed";
      const reopenedForNegotiation = state?.reopenedForNegotiation?.[rightVersion.version] === true;

      if (pill.status === "met") changeTracking.met += 1;
      if (pill.status === "not_met") changeTracking.notMet += 1;
      if (pill.status === "improved") changeTracking.improved += 1;
      if (pill.status === "regressed") changeTracking.regressed += 1;
      if (pill.status === "new") changeTracking.new += 1;

      let bucket: ComparisonBucketKey = "unmarked";
      if (closed) bucket = "closed";
      else if (reopenedForNegotiation || wasRequested) bucket = "open_items";
      else if (pill.status === "improved" || pill.status === "regressed" || pill.status === "new") {
        bucket = "new_changes";
      }
      const actionState = actionStateForRow(state, rightVersion.version, bucket);

      buckets[bucket].push({ id: def.id, prev, curr, pill, bucket, wasRequested, closed, actionState });
    }
  }

  buckets.new_changes.sort((a, b) => {
    const statusDelta = sortChangePillStatus(a.pill.status) - sortChangePillStatus(b.pill.status);
    if (statusDelta !== 0) return statusDelta;
    const aTitle = (a.curr ?? a.prev)?.title ?? a.id;
    const bTitle = (b.curr ?? b.prev)?.title ?? b.id;
    return aTitle.localeCompare(bTitle);
  });

  changeTracking.requestedTotal = changeTracking.met + changeTracking.notMet;
  changeTracking.supplierChanges = changeTracking.improved + changeTracking.regressed + changeTracking.new;

  const countVersion = rightVersion ?? versions[0];
  const severityCounts = severityCountsForVersion(countVersion);
  const panel = buildVersionPanelData(leftVersion, rightVersion ?? countVersion);
  const contractFacts = contractFactsForVersion(countVersion);
  const bucketStats = summariseComparisonBuckets(buckets);
  const actionFacts = summariseComparisonActions(bucketStats);
  const comparisonFacts: ComparisonFacts = {
    met: changeTracking.met,
    notMet: changeTracking.notMet,
    improved: changeTracking.improved,
    regressed: changeTracking.regressed,
    new: changeTracking.new,
    requestedTotal: changeTracking.requestedTotal,
    supplierChanges: changeTracking.supplierChanges,
    scoreDelta: panel.delta,
  };
  changeTracking.needAction = actionFacts.pendingReview;
  const stripStats = {
    contract: contractFacts,
    comparison: comparisonFacts,
    actions: actionFacts,
  };

  return {
    pair,
    leftVersion,
    rightVersion,
    hasComparison,
    buckets,
    changeTracking,
    contractFacts,
    comparisonFacts,
    actionFacts,
    bucketStats,
    stripStats,
    severityCounts,
    panel,
  };
}

export function deriveHistoryModel(
  versions: ContractVersion[],
  decisions: Record<string, ClauseDecisionState>,
  activeFilter: HistoryFilter = "all",
  activeCategory: string | string[] | Set<string> | null = null,
  sort: HistorySort = "contentious",
): ClauseIqHistoryModel {
  const activeCategorySet =
    activeCategory instanceof Set
      ? activeCategory
      : Array.isArray(activeCategory)
        ? new Set(activeCategory)
        : activeCategory
          ? new Set([activeCategory])
          : new Set<string>();
  const rows = CLAUSE_FRAMEWORK.map((def) => buildHistoryRow(def.id, versions, decisions[def.id])).filter(
    (row): row is HistoryRow => Boolean(row),
  );

  const categories = Array.from(
    rows.reduce((map, row) => map.set(row.category, (map.get(row.category) ?? 0) + 1), new Map<string, number>()),
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const latestRows = activeCategorySet.size > 0 ? rows.filter((row) => activeCategorySet.has(row.category)) : rows;
  const filterCounts: Record<HistoryFilter, number> = {
    all: latestRows.length,
    still_open: latestRows.filter(isStillOpenHistoryRow).length,
    regressed_last_round: latestRows.filter((row) => row.currentStatus === "regressed").length,
    met: latestRows.filter((row) => row.currentStatus === "met").length,
    new_clauses: latestRows.filter((row) => row.currentStatus === "new").length,
  };

  const filteredRows = sortHistoryRows(
    rows.filter((row) => {
      if (activeCategorySet.size > 0 && !activeCategorySet.has(row.category)) return false;
      if (activeFilter === "still_open") return isStillOpenHistoryRow(row);
      if (activeFilter === "regressed_last_round") return row.currentStatus === "regressed";
      if (activeFilter === "met") return row.currentStatus === "met";
      if (activeFilter === "new_clauses") return row.currentStatus === "new";
      return true;
    }),
    sort,
  );

  const resolvedRows = rows.filter((row) => row.roundsToResolve !== null);
  const avgRoundsToResolve = resolvedRows.length
    ? Number((resolvedRows.reduce((sum, row) => sum + (row.roundsToResolve ?? 0), 0) / resolvedRows.length).toFixed(1))
    : 0;
  const settledByRound3Rows = rows.filter((row) => {
    const metIndex = row.cells.findIndex((cell) => cell.status === "met");
    return metIndex >= 0 && metIndex <= 2;
  });

  return {
    rows,
    filteredRows,
    categories,
    stats: {
      totalClauses: rows.length,
      roundCount: versions.length,
      stillOpen: filterCounts.still_open,
      avgRoundsToResolve,
      settledByRound3Pct: rows.length ? Math.round((settledByRound3Rows.length / rows.length) * 100) : 0,
      regressedLastRound: filterCounts.regressed_last_round,
      met: filterCounts.met,
      newClauses: filterCounts.new_clauses,
    },
    filterCounts,
  };
}

export function buildHistoryRow(
  clauseId: string,
  versions: ContractVersion[],
  state: ClauseDecisionState | undefined,
): HistoryRow | null {
  const def = CLAUSE_FRAMEWORK.find((item) => item.id === clauseId);
  if (!def) return null;

  const cells = versions.map((version, index) => historyCellForClause(clauseId, index, versions, state));
  const visibleCells = cells.filter((cell) => cell.status !== "missing");
  const lastCell = [...cells].reverse().find((cell) => cell.status !== "missing") ?? cells.at(-1);
  const currentClause = versions.at(-1)?.clauses.find((clause) => clause.id === clauseId);
  const previousClause = versions.length >= 2 ? versions.at(-2)?.clauses.find((clause) => clause.id === clauseId) : undefined;
  const currentPill = determineChangePill({
    clause: currentClause,
    previousClause,
    wasRequestedInPreviousRound: wasRequestedByVersion(state, versions, versions.at(-2)?.version),
  });
  const statuses = visibleCells.map((cell) => cell.status);
  const stateChanges = statuses.reduce((count, status, index) => (
    index > 0 && status !== statuses[index - 1] ? count + 1 : count
  ), 0);
  const metIndex = cells.findIndex((cell) => cell.status === "met");

  return {
    id: def.id,
    title: def.title,
    category: def.category,
    cells,
    currentStatus: lastCell?.status ?? "missing",
    currentPill,
    stateChanges,
    roundsToResolve: metIndex >= 0 ? metIndex + 1 : null,
    existsInRounds: visibleCells.length,
  };
}

export function historyCellForClause(
  clauseId: string,
  versionIndex: number,
  versions: ContractVersion[],
  state: ClauseDecisionState | undefined,
): HistoryRoundCell {
  const version = versions[versionIndex];
  const clause = version?.clauses.find((item) => item.id === clauseId);
  if (!version || !clause) {
    return {
      version: version?.version ?? "",
      uploadedAt: version?.uploadedAt ?? "",
      status: "missing",
      label: "—",
      clause,
    };
  }

  if (versionIndex === 0) {
    const decision = state?.roundDecisions?.[version.version];
    if (decision === "request-update") {
      return { version: version.version, uploadedAt: version.uploadedAt, status: "requested", label: "Req", clause };
    }
    return {
      version: version.version,
      uploadedAt: version.uploadedAt,
      status: clause.resolved ? "met" : "open",
      label: clause.resolved ? "Met" : "Open",
      clause,
    };
  }

  const previous = versions[versionIndex - 1]?.clauses.find((item) => item.id === clauseId);
  const wasRequested = wasRequestedByVersion(state, versions, versions[versionIndex - 1]?.version);
  const pill = determineChangePill({ clause, previousClause: previous, wasRequestedInPreviousRound: wasRequested });
  const closed = state?.closures?.[version.version] === "closed";

  if (closed || pill.status === "met" || clause.resolved) {
    return { version: version.version, uploadedAt: version.uploadedAt, status: "met", label: "Met", clause };
  }
  if (pill.status === "not_met") {
    return { version: version.version, uploadedAt: version.uploadedAt, status: "not_met", label: "Not met", clause };
  }
  if (pill.status === "regressed") {
    return { version: version.version, uploadedAt: version.uploadedAt, status: "regressed", label: "Reg", clause };
  }
  if (pill.status === "new") {
    return { version: version.version, uploadedAt: version.uploadedAt, status: "new", label: "New", clause };
  }
  if (pill.status === "improved" || clause.change === "improved") {
    return { version: version.version, uploadedAt: version.uploadedAt, status: "updated", label: "Upd", clause };
  }
  return { version: version.version, uploadedAt: version.uploadedAt, status: "open", label: "Open", clause };
}

export function isStillOpenHistoryRow(row: HistoryRow) {
  return row.currentStatus === "open" || row.currentStatus === "not_met" || row.currentStatus === "regressed";
}

export function sortHistoryRows(rows: HistoryRow[], sort: HistorySort) {
  const statusOrder: Record<RoundStatus, number> = {
    regressed: 0,
    not_met: 1,
    open: 2,
    new: 3,
    requested: 4,
    updated: 5,
    met: 6,
    missing: 7,
  };

  return [...rows].sort((a, b) => {
    if (sort === "clause_id") return versionOrder(a.id.replace("c", "v")) - versionOrder(b.id.replace("c", "v"));
    if (sort === "current_status") return statusOrder[a.currentStatus] - statusOrder[b.currentStatus] || a.title.localeCompare(b.title);
    if (sort === "rounds_to_resolve") {
      const aRounds = a.roundsToResolve ?? Number.POSITIVE_INFINITY;
      const bRounds = b.roundsToResolve ?? Number.POSITIVE_INFINITY;
      return aRounds - bRounds || a.title.localeCompare(b.title);
    }
    return b.stateChanges - a.stateChanges || statusOrder[a.currentStatus] - statusOrder[b.currentStatus] || a.title.localeCompare(b.title);
  });
}

export function severityCountsForVersion(version?: ContractVersion) {
  if (!version) return { high: 0, medium: 0, low: 0, total: 0 };
  return {
    high: version.clauses.filter((clause) => clause.severity === "high" && !clause.resolved).length,
    medium: version.clauses.filter((clause) => clause.severity === "medium" && !clause.resolved).length,
    low: version.clauses.filter((clause) => clause.severity === "low" && !clause.resolved).length,
    total: version.clauses.length,
  };
}

export function distributionForVersion(version: ContractVersion): DeviationDistribution {
  const counts = severityCountsForVersion(version);
  const active = counts.high + counts.medium + counts.low;
  return {
    high: counts.high,
    medium: counts.medium,
    low: counts.low,
    clean: Math.max(0, counts.total - active),
  };
}

export function scoreBand(score: number): ScoreBand {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 40) return "D";
  return "F";
}

export function buildVersionPanelData(
  previous: ContractVersion | undefined,
  current: ContractVersion | undefined,
): VersionPanelData {
  const fallback = previous ?? current;
  if (!current && !fallback) {
    return {
      current: {
        version: "v1",
        score: 0,
        band: "F",
        distribution: { high: 0, medium: 0, low: 0, clean: 0 },
      },
      delta: 0,
      movement: { improved: 0, declined: 0 },
    };
  }

  const currentVersion = current ?? fallback!;
  return {
    previous: previous
      ? {
          version: previous.version,
          score: previous.overallScore,
          band: scoreBand(previous.overallScore),
          distribution: distributionForVersion(previous),
        }
      : undefined,
    current: {
      version: currentVersion.version,
      score: currentVersion.overallScore,
      band: scoreBand(currentVersion.overallScore),
      distribution: distributionForVersion(currentVersion),
    },
    delta: previous ? currentVersion.overallScore - previous.overallScore : 0,
    movement: movementBetweenVersions(previous, currentVersion),
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
