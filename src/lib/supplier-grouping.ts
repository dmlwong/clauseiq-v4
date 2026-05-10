// Supplier grouping provenance (TASK-04).
// Demo metadata explaining *why* a contract was auto-grouped under a supplier.
export interface GroupingProvenance {
  source: "auto" | "manual";
  matchBasis: string;
  confidence: number; // 0..1
  lastOverride?: { user: string; date: string };
}

const BY_SUPPLIER: Record<string, GroupingProvenance> = {
  "sup-1": {
    source: "auto",
    matchBasis: "Legal entity name + DUNS 71-5439210 + matching VAT GB123456789",
    confidence: 0.97,
  },
  "sup-2": {
    source: "auto",
    matchBasis: "Legal entity name fuzzy match (0.92) + shared parent 'Globex Holdings'",
    confidence: 0.84,
  },
  "sup-3": {
    source: "manual",
    matchBasis: "Mapped manually — no DUNS available in master vendor file",
    confidence: 1,
    lastOverride: { user: "P. Reyes", date: "2025-04-12" },
  },
  "sup-4": {
    source: "auto",
    matchBasis: "DUNS 60-2837461 + tax ID match",
    confidence: 0.99,
  },
  "sup-5": {
    source: "manual",
    matchBasis: "Re-grouped from 'Umbrella UK Ltd' to parent 'Umbrella Corp' on procurement request",
    confidence: 1,
    lastOverride: { user: "S. Khan", date: "2025-04-28" },
  },
};

export function getSupplierGrouping(supplierId: string): GroupingProvenance {
  return BY_SUPPLIER[supplierId] ?? {
    source: "auto",
    matchBasis: "Legal entity name match",
    confidence: 0.8,
  };
}
