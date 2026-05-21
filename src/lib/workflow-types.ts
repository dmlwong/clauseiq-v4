// Shared workflow types
export type ContractStatus = "Not Reviewed" | "In Review" | "In Negotiation" | "Finalised";
export type SupplierAction = "Changed by supplier" | "No change" | "Supplier rejected request" | "—";
export type ClauseSeverity = "high" | "medium" | "low";
export type ClauseChange = "improved" | "worsened" | "unchanged" | "new";
export type ClauseSourceDeviationLevel = "High" | "Medium" | "Low" | "None";
export type ClausePriority = "Critical" | "Important" | "Watchlist";
export type ClauseLifecycleStatus = "Open" | "In negotiation" | "Resolved";

export interface ClauseResult {
  id: string; // matches CLAUSE_FRAMEWORK id (c1..c66)
  title: string;
  subclause?: string;
  category: string;
  severity: ClauseSeverity;
  deviation: string;
  resolved: boolean;
  change?: ClauseChange;
  /** Source workbook says the provision is missing from the supplied contract. */
  missingClause?: boolean;
  /** Original workbook deviation level before UI-level severity coercion. */
  sourceDeviationLevel?: ClauseSourceDeviationLevel;
  excerpt: string;
  improvementReason?: string;
  /** Other places in the contract where this clause is referenced or duplicated. */
  locations?: string[];
  /** Suggested next action / negotiation step for the buyer. */
  actionability?: string;
}

export interface ContractVersion {
  version: string; // v1, v2, ...
  uploadedAt: string;
  overallScore: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  clauses: ClauseResult[];
}

export interface Contract {
  id: string;
  name: string;
  type: "MSA" | "MPA" | "SOW" | "SaaS" | "Other";
  status: ContractStatus;
  versions: ContractVersion[];
}

export interface Supplier {
  id: string;
  name: string;
  status: ContractStatus;
  overallScore: number | null;
  commercialScore: number | null;
  capabilityScore: number | null;
  lastUpdated: string;
  contracts: Contract[];
}

export interface Initiative {
  id: string;
  name: string;
  reference: string;
  description: string;
  suppliers: Supplier[];
}
