// Prior supplier analyses under the same initiative (mock for ClauseIQ v2).
//
// Scenario: a buyer has analysed multiple *different* suppliers within the
// same initiative (e.g. "Fleet Telematics Refresh"). The new analysis lands
// at the bottom; older analyses are stacked above for context. This list
// must scale to dozens of suppliers, hence search + filter affordances.

export interface InitiativeSupplierAnalysis {
  id: string;
  supplierName: string;
  registeredCountry?: string;
  contractName: string;
  contractType: string;
  analysedAt: string; // ISO
  status: "In Review" | "In Negotiation" | "Finalised";
  high: number;
  medium: number;
  low: number;
  missing: number;
  reviewedClauses: number;
}

// Demo: 11 prior different-supplier analyses under the same initiative,
// so the latest analysis becomes the 12th in the stack.
export const PRIOR_INITIATIVE_ANALYSES: InitiativeSupplierAnalysis[] = [
  { id: "ia-01", supplierName: "Globex Industries", registeredCountry: "Germany",
    contractName: "Globex_MSA_v2.pdf", contractType: "Master Services Agreement",
    analysedAt: "2026-01-14T10:12:00Z", status: "Finalised",
    high: 4, medium: 9, low: 14, missing: 3, reviewedClauses: 66 },
  { id: "ia-02", supplierName: "Initech Solutions", registeredCountry: "Ireland",
    contractName: "Initech_SOW_03.pdf", contractType: "Statement of Work",
    analysedAt: "2026-01-22T09:40:00Z", status: "Finalised",
    high: 2, medium: 6, low: 11, missing: 2, reviewedClauses: 58 },
  { id: "ia-03", supplierName: "Wayne Enterprises", registeredCountry: "United States",
    contractName: "Wayne_MSA.pdf", contractType: "Master Services Agreement",
    analysedAt: "2026-02-03T14:05:00Z", status: "In Negotiation",
    high: 7, medium: 12, low: 18, missing: 5, reviewedClauses: 66 },
  { id: "ia-04", supplierName: "Stark Technologies", registeredCountry: "United States",
    contractName: "Stark_SaaS_Agreement.pdf", contractType: "SaaS Agreement",
    analysedAt: "2026-02-10T11:22:00Z", status: "Finalised",
    high: 1, medium: 5, low: 9, missing: 1, reviewedClauses: 64 },
  { id: "ia-05", supplierName: "Umbrella Corp", registeredCountry: "United Kingdom",
    contractName: "Umbrella_Framework.pdf", contractType: "Framework Agreement",
    analysedAt: "2026-02-19T15:48:00Z", status: "In Review",
    high: 9, medium: 14, low: 17, missing: 8, reviewedClauses: 66 },
  { id: "ia-06", supplierName: "Tyrell Corporation", registeredCountry: "Japan",
    contractName: "Tyrell_MSA_v1.pdf", contractType: "Master Services Agreement",
    analysedAt: "2026-02-26T09:00:00Z", status: "In Negotiation",
    high: 6, medium: 11, low: 15, missing: 4, reviewedClauses: 66 },
  { id: "ia-07", supplierName: "Cyberdyne Systems", registeredCountry: "United States",
    contractName: "Cyberdyne_SOW_07.pdf", contractType: "Statement of Work",
    analysedAt: "2026-03-04T13:30:00Z", status: "In Review",
    high: 11, medium: 16, low: 19, missing: 7, reviewedClauses: 66 },
  { id: "ia-08", supplierName: "Soylent Logistics", registeredCountry: "Netherlands",
    contractName: "Soylent_MSA.pdf", contractType: "Master Services Agreement",
    analysedAt: "2026-03-12T10:10:00Z", status: "Finalised",
    high: 3, medium: 7, low: 12, missing: 2, reviewedClauses: 60 },
  { id: "ia-09", supplierName: "Massive Dynamic", registeredCountry: "United States",
    contractName: "MassiveDynamic_Framework.pdf", contractType: "Framework Agreement",
    analysedAt: "2026-03-21T16:42:00Z", status: "In Negotiation",
    high: 8, medium: 13, low: 16, missing: 6, reviewedClauses: 66 },
  { id: "ia-10", supplierName: "Oscorp Industries", registeredCountry: "United States",
    contractName: "Oscorp_MSA_v3.pdf", contractType: "Master Services Agreement",
    analysedAt: "2026-04-02T11:18:00Z", status: "In Review",
    high: 5, medium: 10, low: 14, missing: 4, reviewedClauses: 66 },
  { id: "ia-11", supplierName: "Nakatomi Trading", registeredCountry: "Japan",
    contractName: "Nakatomi_SOW_11.pdf", contractType: "Statement of Work",
    analysedAt: "2026-04-18T09:55:00Z", status: "Finalised",
    high: 2, medium: 4, low: 8, missing: 1, reviewedClauses: 54 },
];

export type AnalysisStatusFilter = "all" | "In Review" | "In Negotiation" | "Finalised";

export function filterPriorAnalyses(
  list: InitiativeSupplierAnalysis[],
  query: string,
  status: AnalysisStatusFilter,
): InitiativeSupplierAnalysis[] {
  const q = query.trim().toLowerCase();
  return list.filter((a) => {
    if (status !== "all" && a.status !== status) return false;
    if (!q) return true;
    return (
      a.supplierName.toLowerCase().includes(q) ||
      a.contractName.toLowerCase().includes(q) ||
      a.contractType.toLowerCase().includes(q)
    );
  });
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
