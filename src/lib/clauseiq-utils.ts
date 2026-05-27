import type { ClauseAnalysis, DeviationCounts, Supplier } from "@/data/mock-clauseiq";

export type SupplierSeverity = "high" | "medium" | "low" | "clean";

export function aggregateDeviations(analyses: ClauseAnalysis[]): DeviationCounts {
  return analyses.reduce(
    (acc, analysis) => ({
      missing: acc.missing + analysis.deviations.missing,
      high: acc.high + analysis.deviations.high,
      medium: acc.medium + analysis.deviations.medium,
      low: acc.low + analysis.deviations.low,
      none: acc.none + analysis.deviations.none,
    }),
    { missing: 0, high: 0, medium: 0, low: 0, none: 0 },
  );
}

export function totalClauses(analyses: ClauseAnalysis[]): number {
  return analyses.reduce((total, analysis) => total + analysis.clausesReviewed, 0);
}

export function supplierSeverity(analyses: ClauseAnalysis[]): SupplierSeverity {
  const deviations = aggregateDeviations(analyses);
  if (deviations.high > 0) return "high";
  if (deviations.medium > 0 || deviations.missing > 0) return "medium";
  if (deviations.low > 0) return "low";
  return "clean";
}

export function sortByRisk(suppliers: Supplier[]): Supplier[] {
  return [...suppliers].sort((a, b) => {
    const aDev = aggregateDeviations(a.analyses);
    const bDev = aggregateDeviations(b.analyses);
    return (
      bDev.high - aDev.high ||
      bDev.missing - aDev.missing ||
      bDev.medium - aDev.medium ||
      bDev.low - aDev.low ||
      a.name.localeCompare(b.name)
    );
  });
}

export function initiativeStats(suppliers: Supplier[]) {
  const deviations = aggregateDeviations(suppliers.flatMap((supplier) => supplier.analyses));
  return {
    totalSuppliers: suppliers.length,
    totalContracts: suppliers.reduce((total, supplier) => total + supplier.analyses.length, 0),
    totalClausesReviewed: suppliers.reduce((total, supplier) => total + totalClauses(supplier.analyses), 0),
    totalHighDeviations: deviations.high,
    totalMissingClauses: deviations.missing,
  };
}

export function newestFirst(analyses: ClauseAnalysis[]): ClauseAnalysis[] {
  return [...analyses].sort((a, b) => Date.parse(b.analysedAt) - Date.parse(a.analysedAt));
}

export function oldestFirst(analyses: ClauseAnalysis[]): ClauseAnalysis[] {
  return [...analyses].sort((a, b) => Date.parse(a.analysedAt) - Date.parse(b.analysedAt));
}

export function formatAnalysisDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function analysisRiskScore(analysis: ClauseAnalysis): number {
  return (
    analysis.deviations.high * 1000 +
    analysis.deviations.missing * 100 +
    analysis.deviations.medium * 10 +
    analysis.deviations.low
  );
}

export function flattenSupplierAnalyses(suppliers: Supplier[]) {
  return suppliers.flatMap((supplier) =>
    supplier.analyses.map((analysis) => ({
      supplier,
      analysis,
    })),
  );
}
