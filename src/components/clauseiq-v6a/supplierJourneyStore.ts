import type { SupplierDetectionContext } from "./ClauseIqWorkflow";

export interface DashboardSupplierJourney {
  context: SupplierDetectionContext;
  supplierName: string;
  corrected: boolean;
}

const journeys = new Map<string, DashboardSupplierJourney>();
const listeners = new Set<() => void>();

export function saveSupplierJourney(id: string, journey: DashboardSupplierJourney) {
  journeys.set(id, journey);
  listeners.forEach((listener) => listener());
}

export function getSupplierJourney(id: string | null) {
  return id ? journeys.get(id) ?? null : null;
}

export function subscribeSupplierJourneys(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
