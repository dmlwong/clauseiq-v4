import {
  getContractIntelligence,
  type ContractIntelligenceSupplier,
  type ContractRiskLevel,
} from "@/data/mock-contract-intelligence";

export type SupplierWorkspaceStatus = "In Negotiation" | "In Review" | "Not Reviewed" | "Finalised";
export type SourcingStage =
  | "Invited"
  | "Response Received"
  | "Evaluation"
  | "Clarification"
  | "Shortlisted"
  | "Negotiation"
  | "Awarded";

export interface MarketIqSignal {
  categories: string[];
  marketPosition: string;
  pricingSignal: string;
  categoryFitScore?: number;
  keyInsight?: string;
  pricingVariance?: string;
  marketOutlook?: string;
  recommendedLeverage?: string;
  categoryHistory?: Array<{
    category: string;
    recentWork: string;
    fitScore: number;
    signal: "Strong" | "Stable" | "Watch";
  }>;
  strengths?: string[];
  risks?: string[];
}

export interface RfpAnalyticsSignal {
  stage: SourcingStage;
  responseStatus: string;
  evaluationProgress: number;
  technicalScore?: number;
  commercialScore?: number;
  responseCompleteness?: number;
  clarificationsOpen: number;
  clarifications?: string[];
  nextMilestone: string;
  hasActivity: boolean;
  processSteps?: Array<{
    label: string;
    status: "complete" | "current" | "pending";
    date?: string;
  }>;
  evaluationNotes?: string[];
}

export interface SupplierWorkspaceRow {
  id: string;
  name: string;
  shortCode: string;
  contractsAnalysed: number;
  clausesReviewed: number;
  status: SupplierWorkspaceStatus;
  commercialScore?: number;
  capabilityScore?: number;
  clauseIqScore?: number;
  highDeviations: number;
  missingClauses: number;
  openActions: number;
  riskLevel: ContractRiskLevel;
  latestAnalysedAt: string;
  lastUpdatedLabel: string;
  clauseIqHref: string;
  marketIq: MarketIqSignal;
  rfpAnalytics: RfpAnalyticsSignal;
}

export interface SupplierWorkspaceSummary {
  initiativeId: string;
  totalSuppliers: number;
  inNegotiation: number;
  inReview: number;
  notReviewed: number;
  finalised: number;
  avgCommercialScore?: number;
  avgCapabilityScore?: number;
  avgClauseIqScore?: number;
  openActions: number;
  suppliers: SupplierWorkspaceRow[];
}

export interface SupplierWorkspaceFilters {
  query: string;
  status: SupplierWorkspaceStatus | "all";
  risk: ContractRiskLevel | "all";
  stage: SourcingStage | "all";
}

export type SupplierWorkspaceSort =
  | "risk"
  | "updated"
  | "commercial"
  | "capability"
  | "clauseiq"
  | "actions"
  | "name";

const marketIqBySupplier: Record<string, MarketIqSignal> = {
  "sup-001": {
    categories: ["Legal Tech", "Contract analytics", "Regulatory content"],
    marketPosition: "Established leader",
    pricingSignal: "Premium to benchmark",
    categoryFitScore: 84,
    pricingVariance: "+12% vs median",
    marketOutlook: "Stable demand with consolidation pressure",
    recommendedLeverage: "Use volume commitment and content bundle rationalisation to pull pricing closer to benchmark.",
    keyInsight: "Strong platform maturity and content depth, with lock-in and premium pricing risk.",
    categoryHistory: [
      { category: "Contract analytics", recentWork: "Enterprise clause extraction programmes", fitScore: 88, signal: "Strong" },
      { category: "Regulatory content", recentWork: "Global legal knowledge products", fitScore: 84, signal: "Strong" },
      { category: "Legal operations", recentWork: "Workflow and matter intake integrations", fitScore: 76, signal: "Stable" },
    ],
    strengths: ["Deep legal content graph", "Mature enterprise support model", "Strong adoption in regulated sectors"],
    risks: ["Premium pricing", "Integration dependency", "Limited commercial flexibility without bundle changes"],
  },
  "sup-002": {
    categories: ["AI review", "Document extraction", "Legal operations"],
    marketPosition: "Specialist challenger",
    pricingSignal: "At benchmark",
    categoryFitScore: 73,
    pricingVariance: "Flat to median",
    marketOutlook: "Fast-growing niche with frequent capability change",
    recommendedLeverage: "Ask for implementation credits and proof points on scale before agreeing expansion terms.",
    keyInsight: "Competitive automation capability, but lower enterprise support depth than incumbents.",
    categoryHistory: [
      { category: "AI review", recentWork: "Automated contract redline triage", fitScore: 78, signal: "Strong" },
      { category: "Document extraction", recentWork: "Metadata extraction for supplier onboarding", fitScore: 74, signal: "Stable" },
      { category: "Legal operations", recentWork: "Workflow pilots with small legal teams", fitScore: 67, signal: "Watch" },
    ],
    strengths: ["Modern product velocity", "Comparable pricing", "Focused AI review capability"],
    risks: ["Support capacity", "Unproven large-scale rollout", "Limited adjacent category coverage"],
  },
  "sup-003": {
    categories: ["Legal AI", "Litigation review", "Contract analytics"],
    marketPosition: "Niche challenger",
    pricingSignal: "Above benchmark",
    categoryFitScore: 71,
    pricingVariance: "+8% vs median",
    marketOutlook: "Emerging provider set, high differentiation claims",
    recommendedLeverage: "Condition progression on reference checks and integration evidence.",
    keyInsight: "Good AI-led review coverage, with evidence still needed on scale and integration depth.",
    categoryHistory: [
      { category: "Legal AI", recentWork: "Matter-level summarisation pilots", fitScore: 75, signal: "Stable" },
      { category: "Litigation review", recentWork: "Document review support for disputes", fitScore: 72, signal: "Stable" },
      { category: "Contract analytics", recentWork: "Limited production deployments", fitScore: 64, signal: "Watch" },
    ],
    strengths: ["Compelling AI narrative", "Good specialist workflow demos", "Flexible product team"],
    risks: ["Scale evidence gap", "Higher-than-market price", "Contract analytics maturity still proving out"],
  },
  "sup-004": {
    categories: ["Document management", "Knowledge management", "Matter collaboration"],
    marketPosition: "Category incumbent",
    pricingSignal: "Above benchmark",
    categoryFitScore: 79,
    pricingVariance: "+6% vs median",
    marketOutlook: "Mature market with bundle rationalisation opportunities",
    recommendedLeverage: "Negotiate on overlap with existing knowledge-management and matter-collaboration tooling.",
    keyInsight: "Strong enterprise fit for legal operations, but commercial leverage depends on bundle scope.",
    categoryHistory: [
      { category: "Document management", recentWork: "Legal document repository migrations", fitScore: 82, signal: "Strong" },
      { category: "Knowledge management", recentWork: "Practice-area knowledge bases", fitScore: 80, signal: "Strong" },
      { category: "Matter collaboration", recentWork: "Matter workspace rollouts", fitScore: 74, signal: "Stable" },
    ],
    strengths: ["Large installed base", "Reliable enterprise governance", "Broad knowledge-management capability"],
    risks: ["Bundle complexity", "Commercial overlap", "Slower AI feature cadence"],
  },
  "sup-005": {
    categories: ["Legal services", "Panel counsel", "Commercial contracts"],
    marketPosition: "Panel specialist",
    pricingSignal: "At benchmark",
    categoryFitScore: 76,
    pricingVariance: "-1% vs median",
    marketOutlook: "Stable panel services with margin pressure",
    recommendedLeverage: "Use alternative fee structures and volume bands to improve predictability.",
    keyInsight: "Useful advisory coverage for complex negotiations, with less reusable technology output.",
    categoryHistory: [
      { category: "Legal services", recentWork: "Commercial contract advisory", fitScore: 78, signal: "Stable" },
      { category: "Panel counsel", recentWork: "Panel support for supplier negotiations", fitScore: 80, signal: "Strong" },
      { category: "Commercial contracts", recentWork: "Template remediation support", fitScore: 72, signal: "Stable" },
    ],
    strengths: ["Negotiation expertise", "Strong counsel bench", "Commercially pragmatic response style"],
    risks: ["Less platform leverage", "Capacity depends on named team", "Benefits harder to reuse at scale"],
  },
  "sup-006": {
    categories: ["Legal operations", "Transformation", "Managed services"],
    marketPosition: "Global advisory leader",
    pricingSignal: "Above benchmark",
    categoryFitScore: 88,
    pricingVariance: "+10% vs median",
    marketOutlook: "Strong demand for transformation-led managed services",
    recommendedLeverage: "Trade premium day rates for outcome-based milestones and reusable playbook assets.",
    keyInsight: "High delivery confidence and transformation capability; best suited for broader operating-model work.",
    categoryHistory: [
      { category: "Legal operations", recentWork: "Operating-model redesign programmes", fitScore: 91, signal: "Strong" },
      { category: "Transformation", recentWork: "Legal tech implementation roadmaps", fitScore: 88, signal: "Strong" },
      { category: "Managed services", recentWork: "Contracting centre-of-excellence support", fitScore: 84, signal: "Strong" },
    ],
    strengths: ["Transformation depth", "Strong delivery governance", "Reusable operating-model assets"],
    risks: ["Premium advisory cost", "Scope creep risk", "Needs clear handover model"],
  },
};

const rfpBySupplier: Record<string, RfpAnalyticsSignal> = {
  "sup-001": {
    stage: "Negotiation",
    responseStatus: "BAFO requested",
    evaluationProgress: 82,
    technicalScore: 84,
    commercialScore: 74,
    responseCompleteness: 96,
    clarificationsOpen: 3,
    clarifications: ["Confirm liability carve-outs", "Validate data residency schedule", "Update implementation credits"],
    nextMilestone: "Final terms review",
    hasActivity: true,
    processSteps: [
      { label: "Invited", status: "complete", date: "18 Nov" },
      { label: "Response", status: "complete", date: "02 Dec" },
      { label: "Evaluation", status: "complete", date: "12 Dec" },
      { label: "Negotiation", status: "current", date: "03 Jan" },
      { label: "Award", status: "pending" },
    ],
    evaluationNotes: ["Strong technical submission", "Commercial position needs final movement", "Legal exceptions remain open"],
  },
  "sup-002": {
    stage: "Evaluation",
    responseStatus: "Response received",
    evaluationProgress: 58,
    technicalScore: 76,
    commercialScore: 61,
    responseCompleteness: 88,
    clarificationsOpen: 5,
    clarifications: ["Explain support coverage", "Evidence implementation scale", "Confirm data export terms"],
    nextMilestone: "Evaluator moderation",
    hasActivity: true,
    processSteps: [
      { label: "Invited", status: "complete", date: "20 Nov" },
      { label: "Response", status: "complete", date: "08 Dec" },
      { label: "Evaluation", status: "current", date: "20 Dec" },
      { label: "Clarification", status: "pending" },
      { label: "Shortlist", status: "pending" },
    ],
    evaluationNotes: ["Useful price position", "Technical evidence still being moderated", "Support model requires clarification"],
  },
  "sup-003": {
    stage: "Invited",
    responseStatus: "Awaiting response",
    evaluationProgress: 8,
    responseCompleteness: 0,
    clarificationsOpen: 0,
    clarifications: [],
    nextMilestone: "Supplier response deadline",
    hasActivity: false,
    processSteps: [
      { label: "Invited", status: "current", date: "15 Dec" },
      { label: "Response", status: "pending" },
      { label: "Evaluation", status: "pending" },
      { label: "Clarification", status: "pending" },
      { label: "Shortlist", status: "pending" },
    ],
    evaluationNotes: [],
  },
  "sup-004": {
    stage: "Clarification",
    responseStatus: "Clarifications open",
    evaluationProgress: 64,
    technicalScore: 79,
    commercialScore: 67,
    responseCompleteness: 91,
    clarificationsOpen: 4,
    clarifications: ["Resolve bundle dependency", "Confirm data migration scope", "Clarify renewal cap"],
    nextMilestone: "Clarification response review",
    hasActivity: true,
    processSteps: [
      { label: "Invited", status: "complete", date: "21 Nov" },
      { label: "Response", status: "complete", date: "10 Dec" },
      { label: "Evaluation", status: "complete", date: "19 Dec" },
      { label: "Clarification", status: "current", date: "02 Jan" },
      { label: "Shortlist", status: "pending" },
    ],
    evaluationNotes: ["Good enterprise controls", "Commercial dependency on bundle scope", "Migration timeline needs proof"],
  },
  "sup-005": {
    stage: "Shortlisted",
    responseStatus: "Shortlisted for negotiation",
    evaluationProgress: 71,
    technicalScore: 74,
    commercialScore: 70,
    responseCompleteness: 93,
    clarificationsOpen: 2,
    clarifications: ["Agree alternative fee trigger", "Confirm named-team capacity"],
    nextMilestone: "Commercial negotiation",
    hasActivity: true,
    processSteps: [
      { label: "Invited", status: "complete", date: "24 Nov" },
      { label: "Response", status: "complete", date: "11 Dec" },
      { label: "Evaluation", status: "complete", date: "19 Dec" },
      { label: "Shortlist", status: "current", date: "28 Dec" },
      { label: "Negotiation", status: "pending" },
    ],
    evaluationNotes: ["Strong advisory quality", "Pricing structure is workable", "Technology leverage is limited"],
  },
  "sup-006": {
    stage: "Awarded",
    responseStatus: "Award recommended",
    evaluationProgress: 100,
    technicalScore: 92,
    commercialScore: 88,
    responseCompleteness: 100,
    clarificationsOpen: 0,
    clarifications: [],
    nextMilestone: "Mobilisation handover",
    hasActivity: true,
    processSteps: [
      { label: "Invited", status: "complete", date: "17 Nov" },
      { label: "Response", status: "complete", date: "05 Dec" },
      { label: "Evaluation", status: "complete", date: "14 Dec" },
      { label: "Negotiation", status: "complete", date: "20 Dec" },
      { label: "Award", status: "complete", date: "05 Jan" },
    ],
    evaluationNotes: ["Best combined delivery score", "Commercial model accepted", "Mobilisation handover ready"],
  },
};

const riskRank: Record<ContractRiskLevel, number> = {
  high: 4,
  medium: 3,
  low: 2,
  clean: 1,
};

export function getSupplierWorkspace(initiativeId: string): SupplierWorkspaceSummary | undefined {
  const intelligence = getContractIntelligence(initiativeId);
  if (!intelligence) return undefined;

  const suppliers = intelligence.suppliers.map(toSupplierWorkspaceRow);
  const scoredCommercial = suppliers.map((supplier) => supplier.commercialScore).filter(isNumber);
  const scoredCapability = suppliers.map((supplier) => supplier.capabilityScore).filter(isNumber);
  const scoredClauseIq = suppliers.map((supplier) => supplier.clauseIqScore).filter(isNumber);

  return {
    initiativeId,
    totalSuppliers: suppliers.length,
    inNegotiation: suppliers.filter((supplier) => supplier.status === "In Negotiation").length,
    inReview: suppliers.filter((supplier) => supplier.status === "In Review").length,
    notReviewed: suppliers.filter((supplier) => supplier.status === "Not Reviewed").length,
    finalised: suppliers.filter((supplier) => supplier.status === "Finalised").length,
    avgCommercialScore: average(scoredCommercial),
    avgCapabilityScore: average(scoredCapability),
    avgClauseIqScore: average(scoredClauseIq),
    openActions: suppliers.reduce((total, supplier) => total + supplier.openActions, 0),
    suppliers,
  };
}

export function filterSupplierWorkspaceRows(
  rows: SupplierWorkspaceRow[],
  filters: SupplierWorkspaceFilters,
): SupplierWorkspaceRow[] {
  const query = filters.query.trim().toLowerCase();
  return rows.filter((row) => {
    const matchesQuery =
      !query ||
      row.name.toLowerCase().includes(query) ||
      row.shortCode.toLowerCase().includes(query) ||
      row.marketIq.categories.some((category) => category.toLowerCase().includes(query));
    const matchesStatus = filters.status === "all" || row.status === filters.status;
    const matchesRisk = filters.risk === "all" || row.riskLevel === filters.risk;
    const matchesStage = filters.stage === "all" || row.rfpAnalytics.stage === filters.stage;
    return matchesQuery && matchesStatus && matchesRisk && matchesStage;
  });
}

export function sortSupplierWorkspaceRows(
  rows: SupplierWorkspaceRow[],
  sort: SupplierWorkspaceSort,
): SupplierWorkspaceRow[] {
  return [...rows].sort((a, b) => {
    if (sort === "updated") return Date.parse(b.latestAnalysedAt) - Date.parse(a.latestAnalysedAt);
    if (sort === "commercial") return scoreValue(b.commercialScore) - scoreValue(a.commercialScore);
    if (sort === "capability") return scoreValue(b.capabilityScore) - scoreValue(a.capabilityScore);
    if (sort === "clauseiq") return scoreValue(b.clauseIqScore) - scoreValue(a.clauseIqScore);
    if (sort === "actions") return b.openActions - a.openActions || b.highDeviations - a.highDeviations;
    if (sort === "name") return a.name.localeCompare(b.name);
    return (
      riskRank[b.riskLevel] - riskRank[a.riskLevel] ||
      b.openActions - a.openActions ||
      b.highDeviations - a.highDeviations ||
      a.name.localeCompare(b.name)
    );
  });
}

function toSupplierWorkspaceRow(supplier: ContractIntelligenceSupplier): SupplierWorkspaceRow {
  return {
    ...supplier,
    status: supplier.status,
    clauseIqHref: supplier.reviewHref,
    marketIq: marketIqBySupplier[supplier.id] ?? {
      categories: [],
      marketPosition: "No MarketIQ insight yet",
      pricingSignal: "—",
    },
    rfpAnalytics: rfpBySupplier[supplier.id] ?? {
      stage: "Invited",
      responseStatus: "No sourcing activity yet",
      evaluationProgress: 0,
      responseCompleteness: 0,
      clarificationsOpen: 0,
      clarifications: [],
      nextMilestone: "Start sourcing event",
      hasActivity: false,
      processSteps: [],
      evaluationNotes: [],
    },
  };
}

function isNumber(value: number | undefined): value is number {
  return typeof value === "number";
}

function average(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

function scoreValue(score: number | undefined): number {
  return score ?? -1;
}
