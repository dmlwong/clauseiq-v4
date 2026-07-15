import { formatClauseIqTimestamp } from "@/lib/clauseiq-v6a-format";

// Supplier extraction + cross-analysis history (mock for ClauseIQ v2 prototype).
//
// Scenario: when a contract is analysed, ClauseIQ extracts the supplier name.
// If prior analyses exist for the *same* supplier (exact normalised match),
// they are grouped together and surfaced on the result card.

export interface PriorAnalysis {
  id: string;
  contractName: string;
  initiativeName: string;
  analysedAt: string;        // ISO date
  high: number;
  medium: number;
  low: number;
  missing: number;
}

export interface ExtractedSupplier {
  name: string;              // canonical display name
  normalised: string;        // for matching
  registeredCountry?: string;
  contractType?: string;
  priorAnalyses: PriorAnalysis[];
}

/** Lowercase + strip common legal suffixes/punctuation for exact matching. */
export function normaliseSupplierName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[.,()]/g, " ")
    .replace(/\b(ltd|limited|inc|incorporated|corp|corporation|llc|gmbh|plc|sa|ag|bv|pty)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Mock historical store — pretend these prior analyses exist in the workspace.
const HISTORY: Record<string, PriorAnalysis[]> = {
  [normaliseSupplierName("Acme Corp")]: [
    {
      id: "ph-1",
      contractName: "Acme_MSA_v3.pdf",
      initiativeName: "Fleet Telematics Refresh",
      analysedAt: "2026-03-12T10:24:00Z",
      high: 12, medium: 18, low: 22, missing: 9,
    },
    {
      id: "ph-2",
      contractName: "Acme_SOW_FleetPilot.pdf",
      initiativeName: "Fleet Telematics Refresh",
      analysedAt: "2026-04-02T14:10:00Z",
      high: 7, medium: 14, low: 19, missing: 5,
    },
  ],
  [normaliseSupplierName("Globex Industries Ltd")]: [
    {
      id: "ph-3",
      contractName: "Globex_MasterAgreement.pdf",
      initiativeName: "Substation Maintenance Services",
      analysedAt: "2026-02-20T09:00:00Z",
      high: 5, medium: 10, low: 8, missing: 3,
    },
  ],
};

/**
 * Mock supplier extraction: in a real flow this comes from the contract parser.
 * Here we infer from the filename so the demo feels deterministic.
 */
export function extractSupplierFromFile(file: File | null): ExtractedSupplier {
  const fname = (file?.name ?? "").toLowerCase();
  let name = "Acme Corp";
  let registeredCountry = "United Kingdom";
  let contractType = "Master Services Agreement";

  if (fname.includes("globex")) {
    name = "Globex Industries Ltd";
    registeredCountry = "Germany";
    contractType = "Framework Agreement";
  } else if (fname.includes("initech")) {
    name = "Initech Solutions";
    registeredCountry = "Ireland";
    contractType = "Statement of Work";
  }

  const normalised = normaliseSupplierName(name);
  return {
    name,
    normalised,
    registeredCountry,
    contractType,
    priorAnalyses: HISTORY[normalised] ?? [],
  };
}

export function formatAnalysedDate(iso: string): string {
  return formatClauseIqTimestamp(iso);
}
