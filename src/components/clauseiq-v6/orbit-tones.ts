import type { ClauseResult } from "@/lib/workflow-v6-data";
import type { ClauseLifecycleStatus, ClausePriority } from "@/lib/workflow-types";

export type OrbitStatusTone = "Success" | "Warning" | "Information" | "Error" | "No Status";
export type OrbitChipTone = OrbitStatusTone | "Outline" | "Additional" | "Disabled";
export type OrbitRiskLevel = "Very High" | "High" | "Medium" | "Low" | "Very Low" | "None";

export function severityToOrbitStatus(severity?: ClauseResult["severity"]): OrbitStatusTone {
  if (severity === "high") return "Error";
  if (severity === "medium") return "Warning";
  if (severity === "low") return "Success";
  return "No Status";
}

export function severityToOrbitRisk(severity?: ClauseResult["severity"]): OrbitRiskLevel {
  if (severity === "high") return "Very High";
  if (severity === "medium") return "High";
  if (severity === "low") return "Low";
  return "None";
}

export function priorityToOrbitStatus(priority: ClausePriority): OrbitStatusTone {
  if (priority === "Critical") return "Error";
  if (priority === "Important") return "Warning";
  return "No Status";
}

export function lifecycleToOrbitStatus(lifecycle: ClauseLifecycleStatus): OrbitStatusTone {
  if (lifecycle === "Resolved") return "Success";
  if (lifecycle === "In negotiation") return "Information";
  return "No Status";
}
