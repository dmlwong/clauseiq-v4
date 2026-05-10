import { useState, useCallback } from "react";
import type { ContractStatus } from "@/lib/workflow-types";

/**
 * In-memory overlay for contract-level status, keyed by contractId.
 * Initial values are seeded from the mock data; the user can override via dropdown.
 */
export function useContractStatus() {
  const [overrides, setOverrides] = useState<Record<string, ContractStatus>>({});

  const get = useCallback(
    (contractId: string, fallback: ContractStatus): ContractStatus =>
      overrides[contractId] ?? fallback,
    [overrides],
  );

  const set = useCallback((contractId: string, status: ContractStatus) => {
    setOverrides((prev) => ({ ...prev, [contractId]: status }));
  }, []);

  return { get, set };
}

export const CONTRACT_STATUS_OPTIONS: ContractStatus[] = [
  "Not Reviewed",
  "In Review",
  "In Negotiation",
  "Finalised",
];
