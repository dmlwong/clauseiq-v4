import { mockInitiative, type ClauseAnalysis, type Supplier } from "@/data/mock-clauseiq";
import { aggregateDeviations, sortByRisk, totalClauses } from "@/lib/clauseiq-utils";

export type ContractRiskLevel = "high" | "medium" | "low" | "clean";
export type SupplierOverviewStatus = "In Negotiation" | "In Review" | "Not Reviewed" | "Finalised";

export interface ContractIntelligenceSupplier {
  id: string;
  name: string;
  shortCode: string;
  contractsAnalysed: number;
  clausesReviewed: number;
  status: SupplierOverviewStatus;
  commercialScore?: number;
  capabilityScore?: number;
  clauseIqScore?: number;
  highDeviations: number;
  missingClauses: number;
  openActions: number;
  riskLevel: ContractRiskLevel;
  latestAnalysedAt: string;
  lastUpdatedLabel: string;
  reviewHref: string;
}

export interface ContractIntelligenceSummary {
  initiativeId: string;
  riskLevel: ContractRiskLevel;
  suppliersAnalysed: number;
  contractsReviewed: number;
  clausesReviewed: number;
  highDeviations: number;
  missingClauses: number;
  openActions: number;
  latestAnalysedAt: string;
  latestAnalysisLabel: string;
  suppliers: ContractIntelligenceSupplier[];
}

const openActionsBySupplier: Record<string, number> = {
  "sup-001": 6,
  "sup-002": 4,
  "sup-003": 1,
  "sup-004": 3,
  "sup-005": 2,
  "sup-006": 0,
};

const supplierOverviewMeta: Record<string, {
  status: SupplierOverviewStatus;
  commercialScore?: number;
  capabilityScore?: number;
  clauseIqScore?: number;
  lastUpdatedLabel: string;
}> = {
  "sup-001": {
    status: "In Negotiation",
    commercialScore: 78,
    capabilityScore: 86,
    clauseIqScore: 81,
    lastUpdatedLabel: "2 days ago",
  },
  "sup-002": {
    status: "In Review",
    commercialScore: 58,
    capabilityScore: 72,
    clauseIqScore: 64,
    lastUpdatedLabel: "5 days ago",
  },
  "sup-003": {
    status: "Not Reviewed",
    lastUpdatedLabel: "—",
  },
  "sup-004": {
    status: "In Negotiation",
    commercialScore: 71,
    capabilityScore: 79,
    clauseIqScore: 69,
    lastUpdatedLabel: "3 days ago",
  },
  "sup-005": {
    status: "In Review",
    commercialScore: 66,
    capabilityScore: 76,
    clauseIqScore: 68,
    lastUpdatedLabel: "1 week ago",
  },
  "sup-006": {
    status: "Finalised",
    commercialScore: 88,
    capabilityScore: 94,
    clauseIqScore: 91,
    lastUpdatedLabel: "1 week ago",
  },
};

const reviewTargets: Record<string, { supplierId: string; contractId: string }> = {
  "sup-001": { supplierId: "sup-1", contractId: "ct-1" },
  "sup-002": { supplierId: "sup-2", contractId: "ct-3" },
  "sup-003": { supplierId: "sup-1", contractId: "ct-2" },
  "sup-004": { supplierId: "sup-4", contractId: "ct-5" },
  "sup-005": { supplierId: "sup-1", contractId: "ct-1" },
  "sup-006": { supplierId: "sup-1", contractId: "ct-2" },
};

export function contractRiskLevel(input: { highDeviations: number; missingClauses: number; openActions: number }): ContractRiskLevel {
  if (input.highDeviations >= 10 || input.openActions >= 5) return "high";
  if (input.highDeviations > 0 || input.missingClauses >= 5 || input.openActions > 0) return "medium";
  if (input.missingClauses > 0) return "low";
  return "clean";
}

export function sortContractSuppliersByRisk(suppliers: ContractIntelligenceSupplier[]): ContractIntelligenceSupplier[] {
  const rank: Record<ContractRiskLevel, number> = { high: 4, medium: 3, low: 2, clean: 1 };
  return [...suppliers].sort(
    (a, b) =>
      rank[b.riskLevel] - rank[a.riskLevel] ||
      b.openActions - a.openActions ||
      b.highDeviations - a.highDeviations ||
      b.missingClauses - a.missingClauses ||
      a.name.localeCompare(b.name),
  );
}

export function getContractIntelligence(initiativeId: string): ContractIntelligenceSummary | undefined {
  if (initiativeId !== "YRK18-1043") return undefined;

  const suppliers = sortContractSuppliersByRisk(sortByRisk(mockInitiative.suppliers).map(toContractSupplier));
  const allAnalyses = mockInitiative.suppliers.flatMap((supplier) => supplier.analyses);
  const deviations = aggregateDeviations(allAnalyses);
  const latestAnalysedAt = latestAnalysis(allAnalyses)?.analysedAt ?? new Date().toISOString();
  const openActions = suppliers.reduce((total, supplier) => total + supplier.openActions, 0);

  return {
    initiativeId,
    riskLevel: contractRiskLevel({
      highDeviations: deviations.high,
      missingClauses: deviations.missing,
      openActions,
    }),
    suppliersAnalysed: mockInitiative.suppliers.length,
    contractsReviewed: allAnalyses.length,
    clausesReviewed: mockInitiative.suppliers.reduce((total, supplier) => total + totalClauses(supplier.analyses), 0),
    highDeviations: deviations.high,
    missingClauses: deviations.missing,
    openActions,
    latestAnalysedAt,
    latestAnalysisLabel: formatAnalysisTimestamp(latestAnalysedAt),
    suppliers,
  };
}

function toContractSupplier(supplier: Supplier): ContractIntelligenceSupplier {
  const deviations = aggregateDeviations(supplier.analyses);
  const latest = latestAnalysis(supplier.analyses);
  const openActions = openActionsBySupplier[supplier.id] ?? 0;
  const overviewMeta = supplierOverviewMeta[supplier.id] ?? {
    status: "Not Reviewed",
    lastUpdatedLabel: "—",
  };
  const target = reviewTargets[supplier.id] ?? reviewTargets["sup-001"];
  const returnPath = encodeURIComponent("/delivery-engine/YRK18-1043");

  return {
    id: supplier.id,
    name: supplier.name,
    shortCode: supplier.shortCode,
    contractsAnalysed: supplier.analyses.length,
    clausesReviewed: totalClauses(supplier.analyses),
    status: overviewMeta.status,
    commercialScore: overviewMeta.commercialScore,
    capabilityScore: overviewMeta.capabilityScore,
    clauseIqScore: overviewMeta.clauseIqScore,
    highDeviations: deviations.high,
    missingClauses: deviations.missing,
    openActions,
    riskLevel: contractRiskLevel({
      highDeviations: deviations.high,
      missingClauses: deviations.missing,
      openActions,
    }),
    latestAnalysedAt: latest?.analysedAt ?? "",
    lastUpdatedLabel: overviewMeta.lastUpdatedLabel,
    reviewHref: `/initiatives-v2?view=results&initiativeId=init-1&supplierId=${target.supplierId}&contractId=${target.contractId}&source=delivery-engine&return=${returnPath}&ciqSupplierId=${supplier.id}`,
  };
}

function latestAnalysis(analyses: ClauseAnalysis[]): ClauseAnalysis | undefined {
  return [...analyses].sort((a, b) => Date.parse(b.analysedAt) - Date.parse(a.analysedAt))[0];
}

function formatAnalysisTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
