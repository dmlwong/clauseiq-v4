import type { DeliveryInitiative } from "./mock-delivery-engine";

export const V4_DELIVERY_INITIATIVE_ID = "AAK01-1442";

const v4DeliveryInitiative: DeliveryInitiative = {
  id: V4_DELIVERY_INITIATIVE_ID,
  name: "CheckPermissionsPart01",
  status: "Idea",
  ledBy: "Aarke",
  leadName: "May",
  ragStatus: "green",
  isMine: true,
  category: "L2 | Build & Design",
  methodology: "Complex Incumbent Negotiation",
  timeline: {
    expectedInflightDate: "May 6, 2026",
    expectedCompletionDate: "May 31, 2026",
  },
  spendAndSavings: {
    isKnown: false,
  },
  toolIndicators: [
    { type: "marketiq", hasActivity: true },
    { type: "rfp-builder", hasActivity: false },
    { type: "rfp-analytics", hasActivity: false },
    { type: "clauseiq", hasActivity: false },
  ],
  toolCoverage: [
    {
      toolName: "MarketIQ",
      description: "Category Insight Report Generator",
      isUsed: true,
      isPrimary: true,
      lastRunBy: "May",
      lastRunAt: "May 06, 2026, 10:34",
      statusLabel: "Deliver",
      ctaLabel: "Run Tool",
    },
    {
      toolName: "RFP Builder",
      description: "RFP document generation",
      isUsed: false,
      isPrimary: true,
      statusLabel: "Deliver",
      ctaLabel: "Run Tool",
    },
    {
      toolName: "RFP Analytics",
      description: "Spend and savings analysis",
      isUsed: false,
      isPrimary: true,
      statusLabel: "Deliver",
      ctaLabel: "Run Tool",
    },
    {
      toolName: "ClauseIQ",
      description: "Contract analysis and insights",
      isUsed: false,
      isPrimary: true,
      statusLabel: "Deliver",
      ctaLabel: "Run Tool",
    },
  ],
  documents: [
    {
      name: "Aarke - Contract Manufacturing Strategy: Gate 1 pack.pptx",
      type: "Gate 1 - Strategy Deck",
      hasTemplate: true,
      createdBy: "Aarke",
    },
    {
      name: "Fleet_Sweden.docx",
      type: "Category Case Study",
      hasTemplate: false,
      createdBy: "Efficio",
    },
  ],
};

export function getV4DeliveryInitiative(id: string) {
  return id === V4_DELIVERY_INITIATIVE_ID ? v4DeliveryInitiative : undefined;
}
