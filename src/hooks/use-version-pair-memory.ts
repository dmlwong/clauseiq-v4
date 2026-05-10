import { useState, useEffect, useCallback } from "react";

/** Persist last-selected version pair per contract for the current session (TASK-10). */
const STORAGE_KEY = "ciq.versionPair";

type Pair = { left: string; right: string };

function load(): Record<string, Pair> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function save(map: Record<string, Pair>) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map)); } catch { /* ignore */ }
}

export function useVersionPairMemory(contractId: string, defaultPair: Pair) {
  const [pair, setPairState] = useState<Pair>(() => load()[contractId] ?? defaultPair);

  useEffect(() => {
    const stored = load()[contractId];
    if (stored) setPairState(stored);
  }, [contractId]);

  const setPair = useCallback((next: Pair) => {
    setPairState(next);
    const map = load();
    map[contractId] = next;
    save(map);
  }, [contractId]);

  const reset = useCallback(() => {
    const map = load();
    delete map[contractId];
    save(map);
    setPairState(defaultPair);
  }, [contractId, defaultPair]);

  return { pair, setPair, reset };
}
