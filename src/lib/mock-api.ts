// Mock API layer — replace with real endpoints later

export interface Company {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface RoutingMetadata {
  databaseId: string;
  databaseName: string;
  benchmarkSetId: string;
  playbookModeAvailable: boolean;
  supportedScenarios: string[];
}

export interface AnalysisJob {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  resultDownloadUrl?: string;
  error?: string;
}

const COMPANIES: Company[] = [
  { id: "c1", name: "Acme Corp" },
  { id: "c2", name: "Globex Industries" },
  { id: "c3", name: "Wayne Enterprises" },
  { id: "c4", name: "Stark Technologies" },
  { id: "c5", name: "Umbrella Corp" },
];

const CATEGORIES: Category[] = [
  { id: "cat1", name: "Technology Services" },
  { id: "cat2", name: "Professional Services" },
  { id: "cat3", name: "Cloud & Infrastructure" },
  { id: "cat4", name: "Marketing & Advertising" },
  { id: "cat5", name: "Facilities Management" },
];

const ROUTING_MAP: Record<string, RoutingMetadata> = {
  default: {
    databaseId: "db-prod-001",
    databaseName: "Primary Clause DB",
    benchmarkSetId: "bench-2024-q4",
    playbookModeAvailable: true,
    supportedScenarios: ["risk-flags", "deviation-check", "clause-extraction"],
  },
  "c2-cat3": {
    databaseId: "db-cloud-002",
    databaseName: "Cloud Services DB",
    benchmarkSetId: "bench-cloud-2024",
    playbookModeAvailable: false,
    supportedScenarios: ["risk-flags", "sla-validation"],
  },
};

// Audit log placeholder
export function auditLog(event: string, data?: Record<string, unknown>) {
  // TODO: replace with real audit service
  console.log(`[AUDIT] ${event}`, data ?? "");
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchCompanies(): Promise<Company[]> {
  await delay(300);
  return COMPANIES;
}

export async function fetchCategories(): Promise<Category[]> {
  await delay(300);
  return CATEGORIES;
}

export async function resolveRouting(
  companyId: string,
  categoryId: string,
  _documentType: string
): Promise<RoutingMetadata> {
  await delay(500);
  const key = `${companyId}-${categoryId}`;
  return ROUTING_MAP[key] ?? ROUTING_MAP["default"];
}

export async function uploadFile(file: File): Promise<{ fileId: string; fileName: string }> {
  await delay(800);
  auditLog("file_uploaded", { name: file.name, size: file.size });
  return { fileId: `file-${Date.now()}`, fileName: file.name };
}

export async function runAnalysis(payload: {
  contractFileId: string;
  playbookFileId?: string;
  companyId: string;
  categoryId: string;
  documentType: string;
  routing: RoutingMetadata;
}): Promise<AnalysisJob> {
  await delay(600);
  auditLog("analysis_submitted", payload);
  return {
    id: `job-${Date.now()}`,
    status: "queued",
    progress: 0,
  };
}

export async function getAnalysisStatus(jobId: string): Promise<AnalysisJob> {
  await delay(400);
  // Simulate progression
  const rand = Math.random();
  if (rand < 0.3) return { id: jobId, status: "processing", progress: 45 };
  if (rand < 0.6) return { id: jobId, status: "processing", progress: 80 };
  return {
    id: jobId,
    status: "completed",
    progress: 100,
    resultDownloadUrl: "#download-placeholder",
  };
}
