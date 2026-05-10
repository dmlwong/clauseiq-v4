import { useState, useCallback, useMemo } from "react";
import type { ClausePriority, ClauseLifecycleStatus } from "@/lib/workflow-types";

export interface FocusEntry {
  clauseId: string;
  priority: ClausePriority;
  lifecycle: ClauseLifecycleStatus;
  order: number;
}

type FocusKey = string; // `${supplierId}:${contractId}`
type FocusStore = Record<FocusKey, FocusEntry[]>;

const PRIORITY_RANK: Record<ClausePriority, number> = {
  Critical: 0,
  Important: 1,
  Watchlist: 2,
};

export function useFocusSet(initial: FocusStore = {}) {
  const [store, setStore] = useState<FocusStore>(initial);

  const getEntries = useCallback(
    (supplierId: string, contractId: string): FocusEntry[] => {
      const key = `${supplierId}:${contractId}`;
      const entries = store[key] ?? [];
      return [...entries].sort(
        (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.order - b.order,
      );
    },
    [store],
  );

  const isTracked = useCallback(
    (supplierId: string, contractId: string, clauseId: string) =>
      !!store[`${supplierId}:${contractId}`]?.some((e) => e.clauseId === clauseId),
    [store],
  );

  const add = useCallback(
    (supplierId: string, contractId: string, clauseId: string, priority: ClausePriority = "Important") => {
      setStore((prev) => {
        const key = `${supplierId}:${contractId}`;
        const list = prev[key] ?? [];
        if (list.some((e) => e.clauseId === clauseId)) return prev;
        const nextEntry: FocusEntry = {
          clauseId,
          priority,
          lifecycle: "Open",
          order: list.length,
        };
        return { ...prev, [key]: [...list, nextEntry] };
      });
    },
    [],
  );

  const remove = useCallback((supplierId: string, contractId: string, clauseId: string) => {
    setStore((prev) => {
      const key = `${supplierId}:${contractId}`;
      const list = prev[key] ?? [];
      return { ...prev, [key]: list.filter((e) => e.clauseId !== clauseId) };
    });
  }, []);

  const toggle = useCallback(
    (supplierId: string, contractId: string, clauseId: string, priority: ClausePriority = "Important") => {
      setStore((prev) => {
        const key = `${supplierId}:${contractId}`;
        const list = prev[key] ?? [];
        const exists = list.some((e) => e.clauseId === clauseId);
        if (exists) return { ...prev, [key]: list.filter((e) => e.clauseId !== clauseId) };
        return {
          ...prev,
          [key]: [...list, { clauseId, priority, lifecycle: "Open" as const, order: list.length }],
        };
      });
    },
    [],
  );

  const setPriority = useCallback(
    (supplierId: string, contractId: string, clauseId: string, priority: ClausePriority) => {
      setStore((prev) => {
        const key = `${supplierId}:${contractId}`;
        const list = prev[key] ?? [];
        return {
          ...prev,
          [key]: list.map((e) => (e.clauseId === clauseId ? { ...e, priority } : e)),
        };
      });
    },
    [],
  );

  const setLifecycle = useCallback(
    (supplierId: string, contractId: string, clauseId: string, lifecycle: ClauseLifecycleStatus) => {
      setStore((prev) => {
        const key = `${supplierId}:${contractId}`;
        const list = prev[key] ?? [];
        return {
          ...prev,
          [key]: list.map((e) => (e.clauseId === clauseId ? { ...e, lifecycle } : e)),
        };
      });
    },
    [],
  );

  const seedIfEmpty = useCallback(
    (supplierId: string, contractId: string, clauseIds: string[], priority: ClausePriority = "Important") => {
      setStore((prev) => {
        const key = `${supplierId}:${contractId}`;
        if (prev[key] && prev[key].length > 0) return prev;
        return {
          ...prev,
          [key]: clauseIds.map((id, i) => ({ clauseId: id, priority, lifecycle: "Open" as const, order: i })),
        };
      });
    },
    [],
  );

  return useMemo(
    () => ({ getEntries, isTracked, add, remove, toggle, setPriority, setLifecycle, seedIfEmpty }),
    [getEntries, isTracked, add, remove, toggle, setPriority, setLifecycle, seedIfEmpty],
  );
}

export type FocusSetApi = ReturnType<typeof useFocusSet>;
