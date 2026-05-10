// Initiatives, suppliers, contracts. Re-exports types and helpers for backward compatibility.
import {
  ACME_MSA_VERSIONS,
  SINGLE_INITIAL_VERSION,
  SINGLE_NEGOTIATED_VERSION,
  ACME_DEFAULT_FOCUS_IDS,
} from "./clauses-data";
import type { Initiative, ContractStatus } from "./workflow-types";

export type {
  ContractStatus,
  ClauseSeverity,
  ClauseChange,
  ClauseResult,
  ContractVersion,
  Contract,
  Supplier,
  Initiative,
  ClausePriority,
  ClauseLifecycleStatus,
} from "./workflow-types";

export { ACME_DEFAULT_FOCUS_IDS };

export const INITIATIVES: Initiative[] = [
  {
    id: "init-1",
    name: "Street Works",
    reference: "UAT01-1775",
    description: "Multi-supplier procurement programme for street works equipment and services.",
    suppliers: [
      {
        id: "sup-1",
        name: "Acme Corp",
        status: "In Negotiation",
        overallScore: 81,
        commercialScore: 78,
        capabilityScore: 86,
        lastUpdated: "2 days ago",
        contracts: [
          {
            id: "ct-1",
            name: "Master Service Agreement",
            type: "MSA",
            status: "In Negotiation",
            versions: ACME_MSA_VERSIONS,
          },
          {
            id: "ct-2",
            name: "Statement of Work #14",
            type: "SOW",
            status: "Finalised",
            versions: [SINGLE_NEGOTIATED_VERSION("v1", "2025-02-20")],
          },
        ],
      },
      {
        id: "sup-2",
        name: "Globex Industries",
        status: "In Review",
        overallScore: 64,
        commercialScore: 58,
        capabilityScore: 72,
        lastUpdated: "5 days ago",
        contracts: [
          {
            id: "ct-3",
            name: "Master Service Agreement",
            type: "MSA",
            status: "In Review",
            versions: [SINGLE_INITIAL_VERSION("v1", "2025-03-30")],
          },
        ],
      },
      {
        id: "sup-3",
        name: "Wayne Enterprises",
        status: "Not Reviewed",
        overallScore: null,
        commercialScore: null,
        capabilityScore: null,
        lastUpdated: "—",
        contracts: [
          { id: "ct-4", name: "Master Service Agreement", type: "MSA", status: "Not Reviewed", versions: [] },
        ],
      },
      {
        id: "sup-4",
        name: "Stark Technologies",
        status: "Finalised",
        overallScore: 91,
        commercialScore: 88,
        capabilityScore: 94,
        lastUpdated: "1 week ago",
        contracts: [
          {
            id: "ct-5",
            name: "SaaS Agreement",
            type: "SaaS",
            status: "Finalised",
            versions: [
              SINGLE_INITIAL_VERSION("v1", "2025-01-15"),
              SINGLE_NEGOTIATED_VERSION("v2", "2025-02-10"),
            ],
          },
        ],
      },
    ],
  },
  {
    id: "init-2",
    name: "Cloud Migration Programme",
    reference: "UAT02-2041",
    description: "Enterprise cloud infrastructure consolidation across business units.",
    suppliers: [
      {
        id: "sup-5",
        name: "Umbrella Corp",
        status: "In Review",
        overallScore: 70,
        commercialScore: 66,
        capabilityScore: 75,
        lastUpdated: "3 days ago",
        contracts: [
          {
            id: "ct-6",
            name: "Master Service Agreement",
            type: "MSA",
            status: "In Review",
            versions: [SINGLE_INITIAL_VERSION("v1", "2025-04-01")],
          },
        ],
      },
    ],
  },
];

export function getInitiative(id: string) {
  return INITIATIVES.find((i) => i.id === id);
}
export function getSupplier(initiativeId: string, supplierId: string) {
  return getInitiative(initiativeId)?.suppliers.find((s) => s.id === supplierId);
}
export function getContract(initiativeId: string, supplierId: string, contractId: string) {
  return getSupplier(initiativeId, supplierId)?.contracts.find((c) => c.id === contractId);
}

export function statusTone(status: ContractStatus): string {
  switch (status) {
    case "Finalised": return "bg-success/10 text-success border-success/20";
    case "In Negotiation": return "bg-primary/10 text-primary border-primary/20";
    case "In Review": return "bg-warning/15 text-warning-foreground border-warning/30";
    default: return "bg-muted text-muted-foreground border-border";
  }
}
