export type DeliveryStatus = "Idea" | "In-flight";
export type RagStatus = "green" | "amber" | "red";

export interface ToolIndicator {
  type: string;
  hasActivity: boolean;
}

export interface DeliveryDocument {
  name: string;
  type: string;
  hasTemplate: boolean;
  createdBy: string;
}

export interface ToolCoverage {
  toolName: string;
  description: string;
  isUsed: boolean;
  lastRunBy?: string;
  lastRunAt?: string;
  isPrimary?: boolean;
  statusLabel?: string;
  ctaLabel?: string;
}

export interface DeliveryInitiative {
  id: string;
  name: string;
  status: DeliveryStatus;
  ledBy: string;
  leadName: string;
  leadAvatarUrl?: string;
  ragStatus: RagStatus;
  isMine: boolean;
  toolIndicators: ToolIndicator[];
  category: string;
  methodology: string;
  timeline: {
    expectedInflightDate: string;
    expectedCompletionDate: string;
  };
  spendAndSavings: {
    isKnown: boolean;
  };
  toolCoverage: ToolCoverage[];
  documents: DeliveryDocument[];
}

const toolTypes = ["case", "rfp", "analytics", "contract", "supplier", "report"];
const names = [
  "TestEmanuel",
  "TestClientTaxonomyCreatedBy06",
  "TestClientTaxonomyCreatedBy05",
  "TestClientTaxonomyCreatedBy04",
  "TestClientTaxonomyCreatedBy03",
  "TestClientTaxonomyCreatedBy02",
  "TestClientTaxonomyCreatedBy01",
  "TestClientTaxonomyCreatedBy",
  "TestClientTaxonomyPart03",
  "Capital Services Review",
  "Facilities Management Renewal",
  "Treatment Works Optimisation",
  "Fleet Category Reset",
  "Digital Metering Programme",
  "Network Maintenance Framework",
  "Customer Operations Sourcing",
  "Energy Hedging Support",
  "Waste Services Review",
  "Telemetry Platform Renewal",
  "Civils Partner Strategy",
  "Materials Supply Chain",
  "IT Managed Services",
  "Laboratory Services",
  "Professional Services Panel",
  "Pumping Station Works",
  "Water Quality Monitoring",
  "Security Services Retender",
  "Grounds Maintenance",
  "Construction Claims Support",
  "Emergency Response Framework",
];

const organisations = [
  "Efficio",
  "Yorkshire Water",
  "Yorkshire Water",
  "Yorkshire Water",
  "Yorkshire Water",
  "Yorkshire Water",
  "Yorkshire Water",
  "Yorkshire Water",
  "Yorkshire Water",
  "Jointly",
];

const leadNames = [
  "Emanuel Pereira",
  "Derek Wong",
  "Sarah Malik",
  "Tom Ellis",
  "Priya Shah",
  "Nia Roberts",
  "James Carter",
  "Amelia Chen",
  "Owen Wright",
  "Hannah Lewis",
];

const makeTools = (index: number): ToolIndicator[] =>
  toolTypes.map((type, toolIndex) => ({
    type,
    hasActivity: (index + toolIndex) % 5 === 0 || (index < 3 && toolIndex === 0),
  }));

const makeCoverage = (initiative: Pick<DeliveryInitiative, "leadName">): ToolCoverage[] => [
  {
    toolName: "MarketIQ",
    description: "Category Insight Report Generator",
    isUsed: false,
    lastRunBy: initiative.leadName,
    lastRunAt: "May 06, 2026, 15:30",
    isPrimary: true,
  },
  { toolName: "RFP Builder", description: "RFP document generation", isUsed: false },
  { toolName: "RFP Analytics", description: "Spend and savings analysis", isUsed: false },
  { toolName: "ClauseIQ", description: "Contract analysis and insights", isUsed: false, isPrimary: true },
];

const makeDocuments = (index: number): DeliveryDocument[] => {
  if (index === 0) {
    return [
      {
        name: "Capital Services_United Kingdom.docx",
        type: "Category Case Study",
        hasTemplate: true,
        createdBy: "Emanuel Pereira",
      },
    ];
  }

  return [
    {
      name: `${names[index]} category case study`,
      type: "Category Case Study",
      hasTemplate: true,
      createdBy: leadNames[index % leadNames.length],
    },
    {
      name: `${names[index]} mobilisation plan`,
      type: "Project Plan",
      hasTemplate: false,
      createdBy: index % 3 === 0 ? "Efficio" : "Yorkshire Water",
    },
    {
      name: `${names[index]} supplier briefing`,
      type: "Supplier Brief",
      hasTemplate: index % 2 === 0,
      createdBy: "Yorkshire Water",
    },
  ];
};

export const deliveryInitiatives: DeliveryInitiative[] = Array.from({ length: 30 }, (_, index) => {
  const idNumber = index < 8 ? 1043 - index : index === 8 ? 1021 : 1020 - (index - 9);
  const leadName = leadNames[index % leadNames.length];
  const ledBy = index < 10 ? organisations[index] : index % 8 === 0 ? "Efficio" : index % 10 === 0 ? "Jointly" : "Yorkshire Water";
  const status: DeliveryStatus = index === 0 || index === 11 ? "In-flight" : "Idea";
  const ragStatus: RagStatus = index === 0 || index === 10 ? "amber" : index % 13 === 0 ? "red" : "green";
  const initiative: DeliveryInitiative = {
    id: `YRK18-${idNumber}`,
    name: names[index],
    status,
    ledBy,
    leadName,
    ragStatus,
    isMine: index === 0 || index === 5 || index === 13,
    toolIndicators: makeTools(index),
    category: index % 4 === 0 ? "L2 | Capital Services" : index % 4 === 1 ? "L2 | Operational Services" : "L3 | Infrastructure",
    methodology: index % 2 === 0 ? "Project Mobilisation 2" : "Strategic Sourcing",
    timeline: {
      expectedInflightDate: index === 0 ? "May 6, 2026" : "Jun 12, 2026",
      expectedCompletionDate: index === 0 ? "May 3, 2028" : "Dec 18, 2027",
    },
    spendAndSavings: {
      isKnown: index === 0 ? false : index % 5 === 0,
    },
    toolCoverage: [],
    documents: makeDocuments(index),
  };
  initiative.toolCoverage = makeCoverage(initiative);
  return initiative;
});

export function getDeliveryInitiatives() {
  return deliveryInitiatives;
}

export function getDeliveryInitiative(id: string) {
  return deliveryInitiatives.find((initiative) => initiative.id === id);
}

export function getDeliveryInitiativeDetail(id: string) {
  return getDeliveryInitiative(id);
}
