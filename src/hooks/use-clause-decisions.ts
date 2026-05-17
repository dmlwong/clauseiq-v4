import { useState, useCallback, useMemo } from "react";

/**
 * User decisions per round.
 *  - Round 1 (and any later round where a NEW issue surfaces): user picks
 *    "request-update" or "no-action".
 *  - For comparison rounds (v_{n-1} → v_n) the user can mark a previously
 *    requested clause as "closed" (resolved this round) or "keep-open"
 *    (still needs supplier work). These are stored per-target-version so
 *    closure state survives subsequent rounds.
 */
export type RoundDecision = "request-update" | "no-action";
/**
 * Closure outcomes per round. "follow-up" (TASK-12) signals a partially
 * resolved request — supplier moved but did not fully meet the ask, and the
 * note carries forward into the next supplier brief.
 */
export type ClosureDecision = "closed" | "keep-open" | "follow-up";
export type RequestLifecycle = "pending" | "submitted";

export interface ClauseRequest {
  requestedChange?: string;
  rationale?: string;
  state?: RequestLifecycle;
  createdAt?: string;
  submittedAt?: string;
}

export interface ClauseDecisionState {
  /** Decisions made round-by-round, keyed by version label (e.g. "v1"). */
  roundDecisions: Record<string, RoundDecision>;
  /**
   * Closure decisions made when reviewing a target version.
   * key = target version (e.g. "v2") — value = closed / keep-open / follow-up.
   */
  closures: Record<string, ClosureDecision>;
  /** Optional follow-up notes per target version (TASK-12). */
  followUpNotes?: Record<string, string>;
  /**
   * Per-version request notes. The key is the version the note was authored
   * against (e.g. "v1", "v2"). When comparing v_n → v_{n+1} we display the
   * latest note authored on or before v_n, so a v1 ask "rolls forward" until
   * the user explicitly overrides it at v2/v3/…
  */
  requests: Record<string, ClauseRequest>;
  /** Draft request text keyed by target version, before the user submits the request. */
  draftRequests?: Record<string, ClauseRequest>;
  updatedAt: string;
}

type Key = string; // `${supplierId}:${contractId}`
type Store = Record<Key, Record<string, ClauseDecisionState>>;

export interface PendingClauseRequest {
  clauseId: string;
  version: string;
  request: ClauseRequest;
}

const EMPTY: ClauseDecisionState = {
  roundDecisions: {},
  closures: {},
  requests: {},
  draftRequests: {},
  updatedAt: "",
};

interface ClauseDecisionOptions {
  storageKey?: string;
}

/**
 * Parses a "vN" label to a number. Falls back to 0 for malformed input.
 */
function versionOrder(v: string): number {
  const m = /^v(\d+)$/i.exec(v);
  return m ? parseInt(m[1], 10) : 0;
}

/**
 * Returns the most recent request authored on or before `uptoVersion`.
 * Also returns the version label it came from, so the UI can surface
 * "(from v1)" badges when an older note is still in effect.
 */
export function getLatestRequest(
  state: ClauseDecisionState,
  uptoVersion: string,
): { request: ClauseRequest; version: string } | undefined {
  const cap = versionOrder(uptoVersion);
  const candidates = Object.entries(state.requests)
    .filter(([v, r]) => versionOrder(v) <= cap && (r.requestedChange || r.rationale))
    .sort((a, b) => versionOrder(b[0]) - versionOrder(a[0]));
  if (candidates.length === 0) return undefined;
  const [version, request] = candidates[0];
  return { request, version };
}

function loadStored(initial: Store, storageKey?: string): Store {
  if (!storageKey || typeof window === "undefined") return initial;
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? { ...initial, ...(JSON.parse(raw) as Store) } : initial;
  } catch {
    return initial;
  }
}

function saveStored(storageKey: string | undefined, next: Store) {
  if (!storageKey || typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey, JSON.stringify(next));
  } catch {
    // Ignore private-mode/localStorage failures in the prototype.
  }
}

function withoutKey<T>(record: Record<string, T> | undefined, key: string): Record<string, T> {
  const next = { ...(record ?? {}) };
  delete next[key];
  return next;
}

function isPendingRequest(request: ClauseRequest | undefined, version: string, targetVersion?: string) {
  if (!request?.requestedChange?.trim()) return false;
  if (request.state) return request.state === "pending";
  return !targetVersion || version === targetVersion;
}

export function useClauseDecisions(initial: Store = {}, options: ClauseDecisionOptions = {}) {
  const [store, setStore] = useState<Store>(() => loadStored(initial, options.storageKey));

  const getState = useCallback(
    (supplierId: string, contractId: string, clauseId: string): ClauseDecisionState => {
      return store[`${supplierId}:${contractId}`]?.[clauseId] ?? EMPTY;
    },
    [store],
  );

  const getAll = useCallback(
    (supplierId: string, contractId: string) => store[`${supplierId}:${contractId}`] ?? {},
    [store],
  );

  const mutate = useCallback(
    (
      supplierId: string,
      contractId: string,
      clauseId: string,
      patch: (s: ClauseDecisionState) => ClauseDecisionState,
    ) => {
      setStore((prev) => {
        const key = `${supplierId}:${contractId}`;
        const list = prev[key] ?? {};
        const current = list[clauseId] ?? EMPTY;
        const next = patch(current);
        const nextStore = {
          ...prev,
          [key]: {
            ...list,
            [clauseId]: { ...next, updatedAt: new Date().toISOString() },
          },
        };
        saveStored(options.storageKey, nextStore);
        return nextStore;
      });
    },
    [options.storageKey],
  );

  const setRoundDecision = useCallback(
    (
      supplierId: string,
      contractId: string,
      clauseId: string,
      version: string,
      decision: RoundDecision,
    ) => {
      mutate(supplierId, contractId, clauseId, (s) => ({
        ...s,
        roundDecisions: { ...s.roundDecisions, [version]: decision },
        requests: decision === "no-action" ? withoutKey(s.requests, version) : s.requests,
      }));
    },
    [mutate],
  );

  const setClosure = useCallback(
    (
      supplierId: string,
      contractId: string,
      clauseId: string,
      targetVersion: string,
      closure: ClosureDecision,
    ) => {
      mutate(supplierId, contractId, clauseId, (s) => ({
        ...s,
        closures: { ...s.closures, [targetVersion]: closure },
      }));
    },
    [mutate],
  );

  const updateRequestText = useCallback(
    (
      supplierId: string,
      contractId: string,
      clauseId: string,
      version: string,
      patch: ClauseRequest,
    ) => {
      mutate(supplierId, contractId, clauseId, (s) => {
        const existing = s.requests[version] ?? {};
        return {
          ...s,
          requests: { ...s.requests, [version]: { ...existing, ...patch } },
        };
      });
    },
    [mutate],
  );

  const setFollowUpNote = useCallback(
    (supplierId: string, contractId: string, clauseId: string, targetVersion: string, note: string) => {
      mutate(supplierId, contractId, clauseId, (s) => ({
        ...s,
        followUpNotes: { ...(s.followUpNotes ?? {}), [targetVersion]: note },
      }));
    },
    [mutate],
  );

  const startDraftRequest = useCallback(
    (
      supplierId: string,
      contractId: string,
      clauseId: string,
      version: string,
      initialDraft?: ClauseRequest,
    ) => {
      mutate(supplierId, contractId, clauseId, (s) => ({
        ...s,
        draftRequests: {
          ...(s.draftRequests ?? {}),
          [version]: initialDraft ?? s.requests[version] ?? s.draftRequests?.[version] ?? {},
        },
      }));
    },
    [mutate],
  );

  const updateDraftRequestText = useCallback(
    (
      supplierId: string,
      contractId: string,
      clauseId: string,
      version: string,
      patch: ClauseRequest,
    ) => {
      mutate(supplierId, contractId, clauseId, (s) => {
        const existing = s.draftRequests?.[version] ?? {};
        return {
          ...s,
          draftRequests: {
            ...(s.draftRequests ?? {}),
            [version]: { ...existing, ...patch },
          },
        };
      });
    },
    [mutate],
  );

  const cancelDraftRequest = useCallback(
    (supplierId: string, contractId: string, clauseId: string, version: string) => {
      mutate(supplierId, contractId, clauseId, (s) => ({
        ...s,
        draftRequests: withoutKey(s.draftRequests, version),
      }));
    },
    [mutate],
  );

  const submitDraftRequest = useCallback(
    (supplierId: string, contractId: string, clauseId: string, version: string) => {
      mutate(supplierId, contractId, clauseId, (s) => {
        const draft = s.draftRequests?.[version] ?? {};
        if (!draft.requestedChange?.trim()) return s;
        const existing = s.requests[version];
        const now = new Date().toISOString();
        return {
          ...s,
          roundDecisions: { ...s.roundDecisions, [version]: "request-update" },
          requests: {
            ...s.requests,
            [version]: {
              requestedChange: draft.requestedChange.trim(),
              rationale: draft.rationale?.trim() || undefined,
              state: "pending",
              createdAt: existing?.createdAt ?? now,
              submittedAt: undefined,
            },
          },
          draftRequests: withoutKey(s.draftRequests, version),
        };
      });
    },
    [mutate],
  );

  const changeDecision = useCallback(
    (
      supplierId: string,
      contractId: string,
      clauseId: string,
      version: string,
      decision: RoundDecision,
    ) => {
      mutate(supplierId, contractId, clauseId, (s) => ({
        ...s,
        roundDecisions: { ...s.roundDecisions, [version]: decision },
        requests: decision === "no-action" ? withoutKey(s.requests, version) : s.requests,
        draftRequests: withoutKey(s.draftRequests, version),
      }));
    },
    [mutate],
  );

  const removePendingRequest = useCallback(
    (supplierId: string, contractId: string, clauseId: string, version: string) => {
      mutate(supplierId, contractId, clauseId, (s) => {
        const request = s.requests[version];
        if (!isPendingRequest(request, version, version)) return s;
        return {
          ...s,
          roundDecisions: withoutKey(s.roundDecisions, version),
          closures: s.closures?.[version] === "follow-up" ? withoutKey(s.closures, version) : s.closures,
          requests: withoutKey(s.requests, version),
          draftRequests: withoutKey(s.draftRequests, version),
        };
      });
    },
    [mutate],
  );

  const submitPendingRequests = useCallback(
    (supplierId: string, contractId: string, version: string) => {
      const now = new Date().toISOString();
      setStore((prev) => {
        const key = `${supplierId}:${contractId}`;
        const list = prev[key] ?? {};
        let changed = false;
        const nextList = Object.fromEntries(
          Object.entries(list).map(([clauseId, state]) => {
            const request = state.requests[version];
            if (state.roundDecisions[version] !== "request-update" || !isPendingRequest(request, version, version)) {
              return [clauseId, state];
            }
            changed = true;
            return [
              clauseId,
              {
                ...state,
                requests: {
                  ...state.requests,
                  [version]: {
                    ...request,
                    state: "submitted",
                    createdAt: request?.createdAt ?? state.updatedAt ?? now,
                    submittedAt: now,
                  },
                },
                updatedAt: now,
              },
            ];
          }),
        );
        if (!changed) return prev;
        const nextStore = { ...prev, [key]: nextList };
        saveStored(options.storageKey, nextStore);
        return nextStore;
      });
    },
    [options.storageKey],
  );

  const getPendingRequests = useCallback(
    (supplierId: string, contractId: string, version: string): PendingClauseRequest[] => {
      const list = store[`${supplierId}:${contractId}`] ?? {};
      return Object.entries(list)
        .filter(([, state]) => state.roundDecisions[version] === "request-update")
        .map(([clauseId, state]) => ({ clauseId, version, request: state.requests[version] }))
        .filter((item): item is PendingClauseRequest & { request: ClauseRequest } =>
          isPendingRequest(item.request, version, version),
        );
    },
    [store],
  );
  /**
   * Seed plausible round-1 decisions from focus-clause IDs so the demo
   * starts with a meaningful negotiation request list without forcing the
   * user to click through 66 clauses.
   */
  const seedDefaults = useCallback(
    (
      supplierId: string,
      contractId: string,
      requestUpdateIds: string[],
      seedRequestTexts: Record<string, ClauseRequest> = {},
    ) => {
      setStore((prev) => {
        const key = `${supplierId}:${contractId}`;
        if (prev[key] && Object.keys(prev[key]).length > 0) return prev;
        const now = new Date().toISOString();
        const built: Record<string, ClauseDecisionState> = {};
        for (const id of requestUpdateIds) {
          const seed = seedRequestTexts[id];
          built[id] = {
            roundDecisions: { v1: "request-update" },
            closures: {},
            requests: seed ? { v1: seed } : {},
            updatedAt: now,
          };
        }
        const nextStore = { ...prev, [key]: built };
        saveStored(options.storageKey, nextStore);
        return nextStore;
      });
    },
    [options.storageKey],
  );

  return useMemo(
    () => ({
      getState,
      getAll,
      setRoundDecision,
      setClosure,
      setFollowUpNote,
      startDraftRequest,
      updateDraftRequestText,
      cancelDraftRequest,
      submitDraftRequest,
      changeDecision,
      removePendingRequest,
      submitPendingRequests,
      getPendingRequests,
      updateRequestText,
      seedDefaults,
    }),
    [
      getState,
      getAll,
      setRoundDecision,
      setClosure,
      setFollowUpNote,
      startDraftRequest,
      updateDraftRequestText,
      cancelDraftRequest,
      submitDraftRequest,
      changeDecision,
      removePendingRequest,
      submitPendingRequests,
      getPendingRequests,
      updateRequestText,
      seedDefaults,
    ],
  );
}

export type ClauseDecisionsApi = ReturnType<typeof useClauseDecisions>;
