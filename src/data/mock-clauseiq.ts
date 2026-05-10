export interface DeviationCounts {
  missing: number;
  high: number;
  medium: number;
  low: number;
}

export interface ClauseAnalysis {
  id: string;
  contractName: string;
  fileName: string;
  analysedAt: string;
  clausesReviewed: number;
  status: "completed" | "in_progress" | "failed";
  deviations: DeviationCounts;
}

export interface Supplier {
  id: string;
  name: string;
  shortCode: string;
  analyses: ClauseAnalysis[];
}

export interface Initiative {
  id: string;
  name: string;
  suppliers: Supplier[];
}

export const mockInitiative: Initiative = {
  id: "init-001",
  name: "Legal Tech Platform Upgrade",
  suppliers: [
    {
      id: "sup-001",
      name: "Thomson Reuters",
      shortCode: "TR",
      analyses: [
        {
          id: "a-001",
          contractName: "Master services agreement",
          fileName: "MSA_ThomsonReuters_v2.pdf",
          analysedAt: "2026-01-03T16:32:00Z",
          clausesReviewed: 47,
          status: "completed",
          deviations: { missing: 13, high: 12, medium: 5, low: 12 },
        },
        {
          id: "a-002",
          contractName: "Data processing addendum",
          fileName: "DPA_ThomsonReuters.pdf",
          analysedAt: "2025-12-18T10:15:00Z",
          clausesReviewed: 22,
          status: "completed",
          deviations: { missing: 4, high: 3, medium: 2, low: 8 },
        },
        {
          id: "a-003",
          contractName: "SLA schedule",
          fileName: "SLA_Schedule_TR.pdf",
          analysedAt: "2025-11-30T09:00:00Z",
          clausesReviewed: 18,
          status: "completed",
          deviations: { missing: 0, high: 1, medium: 0, low: 6 },
        },
      ],
    },
    {
      id: "sup-002",
      name: "Kira Systems",
      shortCode: "KS",
      analyses: [
        {
          id: "a-004",
          contractName: "API access agreement",
          fileName: "API_Kira_v3.pdf",
          analysedAt: "2025-12-20T14:00:00Z",
          clausesReviewed: 28,
          status: "completed",
          deviations: { missing: 3, high: 8, medium: 3, low: 5 },
        },
        {
          id: "a-005",
          contractName: "Professional services SOW",
          fileName: "SOW_Kira_Q1.pdf",
          analysedAt: "2025-12-10T11:30:00Z",
          clausesReviewed: 31,
          status: "completed",
          deviations: { missing: 5, high: 4, medium: 6, low: 9 },
        },
      ],
    },
    {
      id: "sup-003",
      name: "Luminance AI",
      shortCode: "LA",
      analyses: [
        {
          id: "a-006",
          contractName: "Enterprise licence agreement",
          fileName: "ELA_Luminance_2025.pdf",
          analysedAt: "2025-12-15T08:45:00Z",
          clausesReviewed: 35,
          status: "completed",
          deviations: { missing: 2, high: 2, medium: 1, low: 4 },
        },
      ],
    },
    {
      id: "sup-004",
      name: "iManage",
      shortCode: "iM",
      analyses: [
        {
          id: "a-007",
          contractName: "Cloud hosting agreement",
          fileName: "Cloud_iManage_2026.pdf",
          analysedAt: "2025-12-22T15:20:00Z",
          clausesReviewed: 34,
          status: "completed",
          deviations: { missing: 6, high: 9, medium: 4, low: 7 },
        },
      ],
    },
    {
      id: "sup-005",
      name: "Hogan Lovells",
      shortCode: "HL",
      analyses: [
        {
          id: "a-008",
          contractName: "Panel counsel agreement",
          fileName: "Panel_HL_2025.pdf",
          analysedAt: "2025-11-28T12:00:00Z",
          clausesReviewed: 41,
          status: "completed",
          deviations: { missing: 8, high: 6, medium: 3, low: 11 },
        },
      ],
    },
    {
      id: "sup-006",
      name: "Deloitte Legal",
      shortCode: "DL",
      analyses: [
        {
          id: "a-009",
          contractName: "Advisory services agreement",
          fileName: "Advisory_Deloitte_v4.pdf",
          analysedAt: "2025-12-05T09:30:00Z",
          clausesReviewed: 29,
          status: "completed",
          deviations: { missing: 1, high: 0, medium: 2, low: 5 },
        },
      ],
    },
  ],
};
