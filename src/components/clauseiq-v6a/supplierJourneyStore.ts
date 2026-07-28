import type { SupplierDetectionContext } from "./ClauseIqWorkflow";

export interface DashboardSupplierJourney {
  context: SupplierDetectionContext;
  supplierName: string;
  corrected: boolean;
  supplierLocation?: string;
  website?: string;
}

const journeys = new Map<string, DashboardSupplierJourney>();
const listeners = new Set<() => void>();
const STORAGE_KEY = "clauseiq-v6a-supplier-journeys";

function readPersistedJourneys() {
  if (typeof window === "undefined") return;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    const parsed = JSON.parse(stored) as Record<string, DashboardSupplierJourney>;
    Object.entries(parsed).forEach(([id, journey]) => journeys.set(id, journey));
  } catch {
    // Prototype storage is best-effort; an unavailable or stale value should
    // never prevent the results view from rendering.
  }
}

function persistJourneys() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(journeys)));
  } catch {
    // Ignore storage quota/private-mode failures in the prototype.
  }
}

readPersistedJourneys();

export function saveSupplierJourney(id: string, journey: DashboardSupplierJourney) {
  journeys.set(id, journey);
  persistJourneys();
  listeners.forEach((listener) => listener());
}

export function getSupplierJourney(id: string | null) {
  return id ? journeys.get(id) ?? null : null;
}

export function subscribeSupplierJourneys(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
