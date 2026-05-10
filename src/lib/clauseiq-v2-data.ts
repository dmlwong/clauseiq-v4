// Mock data for the ClauseIQ v2 prototype (fresh, isolated from v1 workflow data).
import { ACME_MSA_VERSIONS } from "./clauses-data";

export interface CiqInitiative {
  id: string;
  name: string;
  sector: string;
  owner: string;
  scope: "mine" | "team";
}

export const CIQ_INITIATIVES: CiqInitiative[] = [
  { id: "i1", name: "Fleet Telematics Refresh", sector: "Logistics", owner: "Sarah Chen", scope: "mine" },
  { id: "i2", name: "Field Engineer PPE Programme", sector: "Health & Safety", owner: "Sarah Chen", scope: "mine" },
  { id: "i3", name: "Network Edge Hardware", sector: "IT Infrastructure", owner: "Sarah Chen", scope: "mine" },
  { id: "i4", name: "Substation Maintenance Services", sector: "Energy", owner: "Marcus Lee", scope: "team" },
  { id: "i5", name: "Customer Contact Centre Outsource", sector: "Customer Operations", owner: "Priya Patel", scope: "team" },
  { id: "i6", name: "Cloud Data Platform", sector: "IT Infrastructure", owner: "James O'Brien", scope: "team" },
  { id: "i7", name: "Smart Meter Roll-out Phase 3", sector: "Metering", owner: "Aisha Rahman", scope: "team" },
  { id: "i8", name: "Highways Surfacing Framework", sector: "Civil Works", owner: "Tom Becker", scope: "team" },
  { id: "i9", name: "Cybersecurity Managed Services", sector: "Security", owner: "Sarah Chen", scope: "mine" },
];

/** Derive the headline result counts from the latest ACME MSA version. */
export function getResultSummary() {
  const latest = ACME_MSA_VERSIONS[ACME_MSA_VERSIONS.length - 1];
  const total = latest.clauses.length;
  const high = latest.highIssues;
  const medium = latest.mediumIssues;
  const low = latest.lowIssues;
  // "Missing" = clauses flagged with the "new" change marker (or fall back to a stable count)
  const missing = latest.clauses.filter((c) => c.change === "new").length || 13;
  return { total, high, medium, low, missing };
}
