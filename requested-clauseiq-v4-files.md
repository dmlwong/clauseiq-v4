# Requested ClauseIQ v4 Files

Generated from:

- `src/components/clauseiq-v4/V4InitiativeLinkButton.tsx`
- `src/components/clauseiq-v4/supplier-results/index.ts`
- `src/data/mock-clauseiq.ts`
- `src/data/mock-delivery-engine-v4.ts`

Note: `src/components/clauseiq-v4/supplier-results.tsx` does not exist in this repo. The app imports `src/components/clauseiq-v4/supplier-results/index.ts`, so this file includes that barrel and its recursively imported local files.

## Included Files

- `src/components/clauseiq-v4/V4InitiativeLinkButton.tsx`
- `src/components/ui/button.tsx`
- `src/lib/utils.ts`
- `src/components/clauseiq-v4/supplier-results/index.ts`
- `src/components/clauseiq-v4/supplier-results/ResultsContent.tsx`
- `src/data/mock-clauseiq.ts`
- `src/components/clauseiq-v4/supplier-results/OptionAccordion.tsx`
- `src/lib/clauseiq-utils.ts`
- `src/components/clauseiq-v4/supplier-results/AnalysisCard.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/switch.tsx`
- `src/components/clauseiq-v4/supplier-results/SupplierAvatar.tsx`
- `src/components/clauseiq-v4/supplier-results/types.ts`
- `src/components/clauseiq-v4/supplier-results/OutputPanelResultsContent.tsx`
- `src/components/ui/tabs.tsx`
- `src/components/ui/tooltip.tsx`
- `src/components/clauseiq-v4/supplier-results/DeviationPills.tsx`
- `src/components/clauseiq-v4/supplier-results/OptionMasterDetail.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/scroll-area.tsx`
- `src/components/clauseiq-v4/supplier-results/useMasterDetailState.ts`
- `src/components/clauseiq-v4/supplier-results/StatCard.tsx`
- `src/data/mock-delivery-engine-v4.ts`
- `src/data/mock-delivery-engine.ts`

## src/components/clauseiq-v4/V4InitiativeLinkButton.tsx

```tsx
import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface V4InitiativeLinkButtonProps {
  onClick?: () => void;
  className?: string;
  label?: string;
}

export function V4InitiativeLinkButton({
  onClick,
  className,
  label = "AAK01-1442 | CheckPermissionsPart01",
}: V4InitiativeLinkButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        "h-8 max-w-[320px] gap-1.5 px-2 text-[#5B5BF7] hover:bg-[#E6F1FB] hover:text-[#4F46E5]",
        className,
      )}
      onClick={onClick}
    >
      <Link2 className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate text-xs font-medium">{label}</span>
    </Button>
  );
}
```

## src/components/ui/button.tsx

```tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

## src/lib/utils.ts

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## src/components/clauseiq-v4/supplier-results/index.ts

```ts
export { ResultsContent } from "./ResultsContent";
export { SupplierOutputsPanel } from "./OutputPanelResultsContent";
export { MasterSupplierRail } from "./OptionMasterDetail";
export { useMasterDetailState } from "./useMasterDetailState";
export { AnalysisCard } from "./AnalysisCard";
export { DeviationPills } from "./DeviationPills";
export { SupplierAvatar } from "./SupplierAvatar";
export { StatCard } from "./StatCard";
export {
  type MasterDetailState,
} from "./types";
```

## src/components/clauseiq-v4/supplier-results/ResultsContent.tsx

```tsx
import type { Initiative } from "@/data/mock-clauseiq";
import { OptionAccordion } from "./OptionAccordion";
import { OutputPanelResultsContent } from "./OutputPanelResultsContent";
import type { ResultsLayout } from "./types";

interface Props {
  initiative: Initiative;
  onRunAgain?: () => void;
  onDownload?: () => void;
  onViewResult?: () => void;
  layout?: ResultsLayout;
}

export function ResultsContent({
  initiative,
  onRunAgain,
  onDownload,
  onViewResult,
  layout = "accordion",
}: Props) {
  if (layout === "output-panel") {
    return (
      <OutputPanelResultsContent
        initiative={initiative}
        onRunAgain={onRunAgain}
        onDownload={onDownload}
        onViewResult={onViewResult}
      />
    );
  }

  return (
    <OptionAccordion
      key="accordion"
      initiative={initiative}
      onRunAgain={onRunAgain}
      onDownload={onDownload}
      onViewResult={onViewResult}
    />
  );
}
```

## src/data/mock-clauseiq.ts

```ts
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
```

## src/components/clauseiq-v4/supplier-results/OptionAccordion.tsx

```tsx
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { newestFirst, oldestFirst, supplierSeverity } from "@/lib/clauseiq-utils";
import { AnalysisCard } from "./AnalysisCard";
import { SupplierAvatar } from "./SupplierAvatar";
import type { ResultsViewProps } from "./types";

export function OptionAccordion({ initiative, onRunAgain, onDownload, onViewResult }: ResultsViewProps) {
  const suppliers = useMemo(() => sortByLatestChange(initiative.suppliers), [initiative.suppliers]);
  const latestAnalysisId = useMemo(() => latestAnalysis(initiative.suppliers)?.id, [initiative.suppliers]);
  const [openIds, setOpenIds] = useState<string[]>(() => {
    const latestSupplier = suppliers.at(-1);
    return latestSupplier ? [latestSupplier.id] : [];
  });

  const toggle = (id: string) => {
    setOpenIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  return (
    <motion.div
      key="accordion"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="mx-auto w-full max-w-[640px] space-y-5"
    >
      <div className="space-y-3">
        {suppliers.map((supplier) => {
          const open = openIds.includes(supplier.id);
          const severity = supplierSeverity(supplier.analyses);
          const latestChange = latestChangeTimestamp(supplier.analyses);
          const containsLatestOutput = supplier.analyses.some((analysis) => analysis.id === latestAnalysisId);

          return (
            <motion.section
              layout
              key={supplier.id}
              className="overflow-hidden rounded-lg border border-border bg-card"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <Button
                type="button"
                variant="ghost"
                onClick={() => toggle(supplier.id)}
                className="h-auto w-full justify-start rounded-none px-4 py-3 text-left hover:bg-muted/45"
              >
                <div className="flex w-full min-w-0 items-start gap-3">
                  <SupplierAvatar name={supplier.name} shortCode={supplier.shortCode} severity={severity} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">{supplier.name}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <span>Total Contract Runs: {supplier.analyses.length}</span>
                      {containsLatestOutput && <span className="font-medium">- Contains latest output</span>}
                    </div>
                  </div>
                  <div className="ml-auto flex shrink-0 items-center gap-2 pt-0.5">
                    <span className="max-w-[9rem] text-right text-[11px] leading-tight text-muted-foreground">
                      {latestChange}
                    </span>
                    <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}>
                      <ChevronDown className={cn("h-4 w-4 text-muted-foreground", open && "text-foreground")} />
                    </motion.span>
                  </div>
                </div>
              </Button>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <div className="space-y-3 border-t border-border/70 bg-muted/20 p-3">
                      {oldestFirst(supplier.analyses).map((analysis) => (
                        <AnalysisCard
                          key={analysis.id}
                          analysis={analysis}
                          onRunAgain={onRunAgain}
                          onDownload={onDownload}
                          onViewResult={onViewResult}
                          viewResultPrimary={analysis.id === latestAnalysisId}
                          isLatestOutput={analysis.id === latestAnalysisId}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          );
        })}
      </div>
    </motion.div>
  );
}

function latestAnalysis(suppliers: ResultsViewProps["initiative"]["suppliers"]) {
  return suppliers
    .flatMap((supplier) => supplier.analyses)
    .sort((a, b) => Date.parse(b.analysedAt) - Date.parse(a.analysedAt))[0];
}

function sortByLatestChange(suppliers: ResultsViewProps["initiative"]["suppliers"]) {
  return [...suppliers].sort((a, b) => {
    const aLatest = latestChangeTime(a.analyses);
    const bLatest = latestChangeTime(b.analyses);
    return aLatest - bLatest || a.name.localeCompare(b.name);
  });
}

function latestChangeTime(analyses: ResultsViewProps["initiative"]["suppliers"][number]["analyses"]): number {
  return Math.max(0, ...analyses.map((analysis) => Date.parse(analysis.analysedAt)));
}

function latestChangeTimestamp(analyses: ResultsViewProps["initiative"]["suppliers"][number]["analyses"]): string {
  const latest = newestFirst(analyses)[0];
  if (!latest) return "not available";
  return new Date(latest.analysedAt).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
```

## src/lib/clauseiq-utils.ts

```ts
import type { ClauseAnalysis, DeviationCounts, Supplier } from "@/data/mock-clauseiq";

export type SupplierSeverity = "high" | "medium" | "low" | "clean";

export function aggregateDeviations(analyses: ClauseAnalysis[]): DeviationCounts {
  return analyses.reduce(
    (acc, analysis) => ({
      missing: acc.missing + analysis.deviations.missing,
      high: acc.high + analysis.deviations.high,
      medium: acc.medium + analysis.deviations.medium,
      low: acc.low + analysis.deviations.low,
    }),
    { missing: 0, high: 0, medium: 0, low: 0 },
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
```

## src/components/clauseiq-v4/supplier-results/AnalysisCard.tsx

```tsx
import { useId, useState } from "react";
import { motion } from "framer-motion";
import { BarChart2, Check, Download, FileText, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import type { ClauseAnalysis, Supplier } from "@/data/mock-clauseiq";
import { cn } from "@/lib/utils";
import { supplierSeverity } from "@/lib/clauseiq-utils";
import { SupplierAvatar } from "./SupplierAvatar";

interface Props {
  analysis: ClauseAnalysis;
  supplier?: Supplier;
  showSupplier?: boolean;
  onRunAgain?: () => void;
  onDownload?: () => void;
  onViewResult?: () => void;
  viewResultPrimary?: boolean;
  isLatestOutput?: boolean;
}

export function AnalysisCard({
  analysis,
  supplier,
  showSupplier = false,
  onRunAgain,
  onDownload,
  onViewResult,
  viewResultPrimary = true,
  isLatestOutput = false,
}: Props) {
  const [saveToDocuments, setSaveToDocuments] = useState(false);
  const deviationSummaryId = useId();
  const status = statusCopy[analysis.status];

  return (
    <motion.article
      layout
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className={cn(
        "rounded-xl border bg-card p-5",
        isLatestOutput ? "border-primary/40 ring-2 ring-primary/15 shadow-sm" : "border-border",
      )}
    >
      {showSupplier && supplier && (
        <div className="mb-4 flex items-center gap-2 border-b border-border/70 pb-3">
          <SupplierAvatar
            name={supplier.name}
            shortCode={supplier.shortCode}
            severity={supplierSeverity(supplier.analyses)}
            size="sm"
          />
          <span className="text-sm font-medium text-foreground">{supplier.name}</span>
        </div>
      )}

      <div className="space-y-5">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground">
                Analysis Result
              </Badge>
              {isLatestOutput && (
                <Badge variant="outline" className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground">
                  Latest output
                </Badge>
              )}
            </div>
            <span className="shrink-0 text-sm text-muted-foreground">{formatAnalysisTimestamp(analysis.analysedAt)}</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-semibold leading-tight text-foreground">Here is your Analysis Result</h3>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <span>Save To My Documents</span>
              <Switch checked={saveToDocuments} onCheckedChange={setSaveToDocuments} aria-label="Save To My Documents" />
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <StatusLine
            icon={<FileText className="h-4 w-4" />}
            label={analysis.fileName}
            status="Uploaded"
            tone="neutral"
          />
          <StatusLine
            icon={<Check className="h-4 w-4" />}
            label={`Reviewed ${analysis.clausesReviewed} clauses`}
            status={status.label}
            tone={status.tone}
          />
        </div>

        <div className="space-y-3">
          <p className="text-base text-foreground">
            {onDownload
              ? "Summary shown below. Download the report for full details."
              : "Summary shown below. View the result for full details."}
          </p>
          <div className="space-y-2" role="group" aria-labelledby={deviationSummaryId}>
            <p id={deviationSummaryId} className="text-sm font-medium text-muted-foreground">
              Missing Clauses and deviation levels
            </p>
            <div className="flex flex-nowrap items-center gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <DeviationChip
                label="Missing"
                wideLabel="Missing Clauses"
                fullLabel="Missing Clauses"
                value={analysis.deviations.missing}
                tone="missing"
              />
              <DeviationChip label="High" fullLabel="High deviation" value={analysis.deviations.high} tone="high" />
              <DeviationChip
                label="Medium"
                fullLabel="Medium deviation"
                value={analysis.deviations.medium}
                tone="medium"
              />
              <DeviationChip label="Low" fullLabel="Low deviation" value={analysis.deviations.low} tone="low" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {onViewResult && (
            <Button
              variant={viewResultPrimary ? "default" : "outline"}
              className="h-10 w-full gap-2"
              onClick={onViewResult}
            >
              <BarChart2 className="h-4 w-4" />
              View Result
            </Button>
          )}
          <div className={cn("grid gap-2", onRunAgain && onDownload ? "sm:grid-cols-2" : "grid-cols-1")}>
            {onRunAgain && (
              <Button variant="outline" className="h-10 gap-2" onClick={onRunAgain}>
                <RotateCw className="h-4 w-4" />
                Run Another Analysis
              </Button>
            )}
            {onDownload && (
              <Button variant="outline" className="h-10 gap-2" onClick={onDownload}>
                <Download className="h-4 w-4" />
                Download Report
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function StatusLine({
  icon,
  label,
  status,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  status: string;
  tone: "neutral" | "success" | "warning" | "destructive";
}) {
  return (
    <div
      className={cn(
        "flex min-h-10 items-center justify-between gap-3 rounded-lg px-3 text-sm",
        tone === "neutral" && "bg-muted text-foreground",
        tone === "success" && "bg-success/10 text-success",
        tone === "warning" && "bg-warning/15 text-warning-foreground",
        tone === "destructive" && "bg-destructive/10 text-destructive",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="shrink-0">{icon}</span>
        <span className="truncate font-medium">{label}</span>
      </div>
      <span className="shrink-0 font-medium">{status}</span>
    </div>
  );
}

function DeviationChip({
  label,
  wideLabel,
  fullLabel = label,
  value,
  tone,
}: {
  label: string;
  wideLabel?: string;
  fullLabel?: string;
  value: number;
  tone: "missing" | "high" | "medium" | "low";
}) {
  return (
    <Badge
      variant="outline"
      aria-label={`${fullLabel}: ${value}`}
      className={cn(
        "shrink-0 gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium leading-5",
        tone === "missing" && "border-slate-400 bg-muted/50 text-foreground",
        tone === "high" && "border-destructive bg-destructive/10 text-destructive",
        tone === "medium" && "border-warning bg-warning/10 text-warning-foreground",
        tone === "low" && "border-success bg-success/10 text-success",
      )}
    >
      {wideLabel ? (
        <>
          <span className="sm:hidden">{label}</span>
          <span className="hidden sm:inline">{wideLabel}</span>
        </>
      ) : (
        <span>{label}</span>
      )}
      <span className="tabular-nums">{value}</span>
    </Badge>
  );
}

const statusCopy: Record<ClauseAnalysis["status"], { label: string; tone: "success" | "warning" | "destructive" }> = {
  completed: { label: "Completed", tone: "success" },
  in_progress: { label: "In progress", tone: "warning" },
  failed: { label: "Failed", tone: "destructive" },
};

function formatAnalysisTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
```

## src/components/ui/badge.tsx

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
```

## src/components/ui/switch.tsx

```tsx
import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
```

## src/components/clauseiq-v4/supplier-results/SupplierAvatar.tsx

```tsx
import { cn } from "@/lib/utils";
import type { SupplierSeverity } from "@/lib/clauseiq-utils";

interface Props {
  name: string;
  shortCode: string;
  severity: SupplierSeverity;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const severityClass: Record<SupplierSeverity, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/15 text-warning-foreground border-warning/30",
  low: "bg-primary/10 text-primary border-primary/20",
  clean: "bg-success/10 text-success border-success/20",
};

const sizeClass = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
};

export function SupplierAvatar({ name, shortCode, severity, size = "md", className }: Props) {
  return (
    <div
      aria-label={name}
      className={cn(
        "grid shrink-0 place-items-center rounded-full border font-semibold",
        severityClass[severity],
        sizeClass[size],
        className,
      )}
    >
      {shortCode}
    </div>
  );
}
```

## src/components/clauseiq-v4/supplier-results/types.ts

```ts
import type { Initiative } from "@/data/mock-clauseiq";

export type FilteredListSortMode = "severity" | "recent" | "supplier" | "clauses";
export type ResultsLayout = "accordion" | "output-panel";
export type SupplierOutputsPanelState = "empty" | "processing" | "filled";
export type MasterDetailSupplier = Initiative["suppliers"][number];

export interface FilteredListControls {
  query: string;
  supplierId: string;
  sort: FilteredListSortMode;
}

export const DEFAULT_FILTERED_LIST_CONTROLS: FilteredListControls = {
  query: "",
  supplierId: "all",
  sort: "severity",
};

export interface ResultsViewProps {
  initiative: Initiative;
  onRunAgain?: () => void;
  onDownload?: () => void;
  onViewResult?: () => void;
  layout?: ResultsLayout;
  outputState?: SupplierOutputsPanelState;
  filteredControls?: FilteredListControls;
  onFilteredControlsChange?: (controls: FilteredListControls) => void;
  masterDetailState?: MasterDetailState;
}

export interface MasterDetailState {
  filteredSuppliers: Initiative["suppliers"];
  selectedId: string;
  selectedSupplier: MasterDetailSupplier | null;
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (supplierId: string) => void;
}
```

## src/components/clauseiq-v4/supplier-results/OutputPanelResultsContent.tsx

```tsx
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart2, ChevronDown, Download, FileText, Loader2, RotateCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ClauseAnalysis, Supplier } from "@/data/mock-clauseiq";
import { flattenSupplierAnalyses, newestFirst, supplierSeverity } from "@/lib/clauseiq-utils";
import { cn } from "@/lib/utils";
import { AnalysisCard } from "./AnalysisCard";
import { DeviationPills } from "./DeviationPills";
import { SupplierAvatar } from "./SupplierAvatar";
import type { ResultsViewProps, SupplierOutputsPanelState } from "./types";

type OutputScope = "team" | "mine";

const MINE_ANALYSIS_IDS = new Set(["a-001", "a-004", "a-007"]);

export function OutputPanelResultsContent({ initiative, onRunAgain, onDownload, onViewResult }: ResultsViewProps) {
  const rows = useMemo(() => {
    return flattenSupplierAnalyses(initiative.suppliers).sort(
      (a, b) => Date.parse(a.analysis.analysedAt) - Date.parse(b.analysis.analysedAt),
    );
  }, [initiative.suppliers]);

  const latestAnalysisId = rows.at(-1)?.analysis.id;

  return (
    <motion.div
      key="output-panel"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="mx-auto w-full max-w-[640px] space-y-5"
    >
      <section className="min-w-0 space-y-3" aria-label="Analysis outputs by date">
        {rows.length === 0 ? (
          <NoPreviousAnalysisState onRunAgain={onRunAgain} />
        ) : (
          rows.map(({ supplier, analysis }) => (
            <AnalysisCard
              key={analysis.id}
              analysis={analysis}
              supplier={supplier}
              showSupplier
              onRunAgain={onRunAgain}
              onDownload={onDownload}
              onViewResult={onViewResult}
              viewResultPrimary={analysis.id === latestAnalysisId}
              isLatestOutput={analysis.id === latestAnalysisId}
            />
          ))
        )}
      </section>

      <SupplierOutputsPanel
        initiative={initiative}
        onRunAgain={onRunAgain}
        onDownload={onDownload}
        onViewResult={onViewResult}
        outputState="filled"
        className="lg:hidden"
      />
    </motion.div>
  );
}

interface SupplierOutputsPanelProps extends ResultsViewProps {
  className?: string;
}

export function SupplierOutputsPanel({
  initiative,
  onRunAgain,
  onDownload,
  onViewResult,
  outputState = "filled",
  className,
}: SupplierOutputsPanelProps) {
  const [outputScope, setOutputScope] = useState<OutputScope>("mine");
  const [query, setQuery] = useState("");
  const allRows = useMemo(() => flattenSupplierAnalyses(initiative.suppliers), [initiative.suppliers]);
  const hasOutputs = allRows.length > 0;
  const scopedSuppliers = useMemo(
    () => filterSuppliersByScope(initiative.suppliers, outputScope),
    [initiative.suppliers, outputScope],
  );
  const filteredSuppliers = useMemo(
    () => filterSuppliersByQuery(scopedSuppliers, query),
    [query, scopedSuppliers],
  );
  const rows = useMemo(() => {
    return flattenSupplierAnalyses(filteredSuppliers).sort(
      (a, b) => Date.parse(a.analysis.analysedAt) - Date.parse(b.analysis.analysedAt),
    );
  }, [filteredSuppliers]);
  const latestAnalysisId = rows.at(-1)?.analysis.id;
  const suppliers = useMemo(() => sortSuppliersByLatestChange(filteredSuppliers), [filteredSuppliers]);
  const [openSupplierIds, setOpenSupplierIds] = useState<string[]>([]);
  const supplierCount = suppliers.length;
  const outputCount = rows.length;
  const emptyState =
    outputState === "processing"
      ? {
          title: "Analysis In Progress",
          copy: "ClauseIQ is reviewing the uploaded contract. Supplier outputs will appear here once the analysis is complete.",
          scopeHint: "When it finishes, you can switch between Mine and Team to compare your output with the wider team view.",
          loading: true,
        }
      : {
          title: "No Supplier Outputs Yet",
          copy: "Upload a contract and run ClauseIQ. Completed analyses will appear here, grouped by supplier.",
          scopeHint: "Once outputs are available, you can switch between Mine and Team to review your own results or the team's results.",
          loading: false,
        };

  useEffect(() => {
    setOpenSupplierIds(suppliers[0] ? [suppliers[0].id] : []);
  }, [suppliers]);

  const toggleSupplier = (supplierId: string) => {
    setOpenSupplierIds((current) =>
      current.includes(supplierId)
        ? current.filter((id) => id !== supplierId)
        : [...current, supplierId],
    );
  };

  return (
    <section
      className={cn(
        "min-w-0 space-y-3",
        !hasOutputs && "flex h-full items-center justify-center space-y-0",
        className,
      )}
      aria-label="Supplier grouped outputs"
    >
      {hasOutputs && (
        <div className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Supplier Outputs</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {supplierCount} {supplierCount === 1 ? "supplier" : "suppliers"} &middot; {outputCount}{" "}
              {outputCount === 1 ? "output" : "outputs"}
            </p>
          </div>

          <div className="flex h-8 items-center gap-2 rounded-md border border-input bg-white px-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search suppliers or files"
              className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
              aria-label="Search supplier outputs"
            />
          </div>

          <Tabs
            value={outputScope}
            onValueChange={(value) => {
              if (value === "team" || value === "mine") {
                setOutputScope(value);
              }
            }}
          >
            <TabsList className="grid h-8 w-full grid-cols-2 rounded-md">
              <TabsTrigger value="mine" className="h-6 px-2 text-xs">
                Mine
              </TabsTrigger>
              <TabsTrigger value="team" className="h-6 px-2 text-xs">
                Team
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      <div className="space-y-3">
        {suppliers.length === 0 ? (
          <>
            {hasOutputs ? (
              <div className="rounded-lg border border-dashed border-border bg-card px-4 py-6 text-sm text-muted-foreground">
                No outputs match this view.
              </div>
            ) : (
              <SupplierPanelEmptyState
                title={emptyState.title}
                copy={emptyState.copy}
                scopeHint={emptyState.scopeHint}
                loading={emptyState.loading}
              />
            )}
          </>
        ) : (
          suppliers.map((supplier) => (
            <SupplierOutputGroup
              key={supplier.id}
              supplier={supplier}
              latestAnalysisId={latestAnalysisId}
              open={openSupplierIds.includes(supplier.id)}
              onToggle={() => toggleSupplier(supplier.id)}
              onRunAgain={onRunAgain}
              onDownload={onDownload}
              onViewResult={onViewResult}
            />
          ))
        )}
      </div>
    </section>
  );
}

function SupplierPanelEmptyState({
  title,
  copy,
  scopeHint,
  loading,
}: {
  title: string;
  copy: string;
  scopeHint: string;
  loading: boolean;
}) {
  return (
    <div className="w-full px-2 text-center">
      <div className="mx-auto max-w-[260px]">
        <div className="mx-auto h-24 w-32">
          <div className="relative mx-auto h-full w-full">
            <div className="absolute left-7 top-2 h-16 w-20 rounded-xl border border-slate-200 bg-white shadow-sm" />
            <div className="absolute left-10 top-6 h-2 w-8 rounded bg-primary/20" />
            <div className="absolute left-10 top-11 h-2 w-12 rounded bg-slate-200" />
            <div className="absolute left-10 top-16 h-2 w-9 rounded bg-slate-200" />
            <div className="absolute right-5 top-7 grid h-9 w-9 place-items-center rounded-full border border-primary/20 bg-primary/10 text-primary shadow-sm">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </div>
            <div className="absolute bottom-2 left-4 grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm">
              <FileText className="h-4 w-4" />
            </div>
            <div className="absolute bottom-3 right-8 grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm">
              <BarChart2 className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
        <h3 className="mt-5 text-base font-semibold leading-tight text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy}</p>
        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-2">
          <div className="grid h-8 grid-cols-2 rounded-md bg-white p-1 text-xs font-medium text-slate-500 shadow-sm">
            <span className="grid place-items-center rounded bg-slate-100 text-slate-700">Mine</span>
            <span className="grid place-items-center rounded text-slate-500">Team</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{scopeHint}</p>
        </div>
      </div>
    </div>
  );
}

function NoPreviousAnalysisState({ onRunAgain }: { onRunAgain?: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center">
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
        <FileText className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">No analysis outputs yet</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Once the first supplier contract is analysed, the result card will appear here with the supplier output summary.
      </p>
      {onRunAgain && (
        <Button className="mt-4 h-9 gap-2" onClick={onRunAgain}>
          <RotateCw className="h-4 w-4" />
          Run first analysis
        </Button>
      )}
    </div>
  );
}

function SupplierOutputGroup({
  supplier,
  latestAnalysisId,
  open,
  onToggle,
  onRunAgain,
  onDownload,
  onViewResult,
}: {
  supplier: Supplier;
  latestAnalysisId?: string;
  open: boolean;
  onToggle: () => void;
  onRunAgain?: () => void;
  onDownload?: () => void;
  onViewResult?: () => void;
}) {
  const analyses = newestFirst(supplier.analyses);
  const contentId = `supplier-output-${supplier.id}`;
  const containsLatestOutput = supplier.analyses.some((analysis) => analysis.id === latestAnalysisId);

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/40"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={onToggle}
      >
        <SupplierAvatar
          name={supplier.name}
          shortCode={supplier.shortCode}
          severity={supplierSeverity(supplier.analyses)}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium text-foreground">{supplier.name}</h3>
          <p className="text-xs text-muted-foreground">
            {supplier.analyses.length} {supplier.analyses.length === 1 ? "output" : "outputs"}
            {containsLatestOutput && <span className="font-medium"> - Latest output</span>}
          </p>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.16 }}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted-foreground"
          aria-hidden="true"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={contentId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-2 px-4 pb-3">
              {analyses.map((analysis) => (
                <CompactOutputRow
                  key={analysis.id}
                  analysis={analysis}
                  isLatestOutput={analysis.id === latestAnalysisId}
                  onRunAgain={onRunAgain}
                  onDownload={onDownload}
                  onViewResult={onViewResult}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function CompactOutputRow({
  analysis,
  isLatestOutput,
  onRunAgain,
  onDownload,
  onViewResult,
}: {
  analysis: ClauseAnalysis;
  isLatestOutput: boolean;
  onRunAgain?: () => void;
  onDownload?: () => void;
  onViewResult?: () => void;
}) {
  return (
    <article className="rounded-md border border-border bg-background px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-foreground">{analysis.fileName}</p>
          {isLatestOutput && <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">Latest output</p>}
        </div>
        <time
          dateTime={analysis.analysedAt}
          className="shrink-0 text-right text-[11px] leading-snug text-muted-foreground"
        >
          {formatCompactTimestamp(analysis.analysedAt)}
        </time>
      </div>

      <div className="mt-2">
        <DeviationPills deviations={analysis.deviations} compact />
      </div>

      <div className="mt-2 grid grid-cols-3 gap-1">
        <CompactActionButton label="View Results" onClick={onViewResult}>
          <BarChart2 className="h-3.5 w-3.5" />
        </CompactActionButton>
        <CompactActionButton label="Re-Run" onClick={onRunAgain}>
          <RotateCw className="h-3.5 w-3.5" />
        </CompactActionButton>
        <CompactActionButton label="Download" onClick={onDownload}>
          <Download className="h-3.5 w-3.5" />
        </CompactActionButton>
      </div>
    </article>
  );
}

function CompactActionButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-0"
          aria-label={label}
          title={label}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function sortSuppliersByLatestChange(suppliers: Supplier[]): Supplier[] {
  return [...suppliers].sort((a, b) => latestChangeTime(a) - latestChangeTime(b) || a.name.localeCompare(b.name));
}

function filterSuppliersByScope(suppliers: Supplier[], outputScope: OutputScope): Supplier[] {
  if (outputScope === "team") {
    return suppliers.filter((supplier) => supplier.analyses.length > 0);
  }

  return suppliers
    .map((supplier) => ({
      ...supplier,
      analyses: supplier.analyses.filter((analysis) => MINE_ANALYSIS_IDS.has(analysis.id)),
    }))
    .filter((supplier) => supplier.analyses.length > 0);
}

function filterSuppliersByQuery(suppliers: Supplier[], query: string): Supplier[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return suppliers;

  return suppliers
    .map((supplier) => {
      const supplierMatches =
        supplier.name.toLowerCase().includes(normalizedQuery) ||
        supplier.shortCode.toLowerCase().includes(normalizedQuery);

      if (supplierMatches) return supplier;

      return {
        ...supplier,
        analyses: supplier.analyses.filter((analysis) =>
          [analysis.fileName, analysis.contractName].some((value) =>
            value.toLowerCase().includes(normalizedQuery),
          ),
        ),
      };
    })
    .filter((supplier) => supplier.analyses.length > 0);
}

function latestChangeTime(supplier: Supplier): number {
  return Math.max(0, ...supplier.analyses.map((analysis) => Date.parse(analysis.analysedAt)));
}

function formatCompactTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
```

## src/components/ui/tabs.tsx

```tsx
import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
```

## src/components/ui/tooltip.tsx

```tsx
import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className,
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
```

## src/components/clauseiq-v4/supplier-results/DeviationPills.tsx

```tsx
import { Badge } from "@/components/ui/badge";
import type { DeviationCounts } from "@/data/mock-clauseiq";
import { cn } from "@/lib/utils";

interface Props {
  deviations: DeviationCounts;
  compact?: boolean;
}

export function DeviationPills({ deviations, compact = false }: Props) {
  const pillClass = cn(
    "rounded-full font-medium",
    compact ? "px-2 py-0 text-[10px]" : "px-2.5 py-0.5 text-xs",
  );

  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="outline" className={cn(pillClass, "border-border bg-muted text-muted-foreground")}>
        Missing {deviations.missing}
      </Badge>
      <Badge
        variant="outline"
        className={cn(pillClass, "border-destructive/25 bg-destructive/10 text-destructive")}
      >
        High {deviations.high}
      </Badge>
      <Badge
        variant="outline"
        className={cn(pillClass, "border-warning/30 bg-warning/15 text-warning-foreground")}
      >
        Med {deviations.medium}
      </Badge>
      <Badge variant="outline" className={cn(pillClass, "border-border bg-background text-muted-foreground")}>
        Low {deviations.low}
      </Badge>
    </div>
  );
}
```

## src/components/clauseiq-v4/supplier-results/OptionMasterDetail.tsx

```tsx
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  aggregateDeviations,
  newestFirst,
  supplierSeverity,
} from "@/lib/clauseiq-utils";
import { AnalysisCard } from "./AnalysisCard";
import { SupplierAvatar } from "./SupplierAvatar";
import type { MasterDetailState, ResultsViewProps } from "./types";
import { useMasterDetailState } from "./useMasterDetailState";

export function OptionMasterDetail({
  initiative,
  onRunAgain,
  onDownload,
  onViewResult,
  masterDetailState,
}: ResultsViewProps) {
  const fallbackState = useMasterDetailState(initiative);
  const state = masterDetailState ?? fallbackState;
  const { selectedSupplier } = state;

  return (
    <motion.div
      key="master-detail"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="space-y-5"
    >
      <MasterSupplierRail state={state} mobile />

      <div className="mx-auto w-full max-w-[640px]">
        <AnimatePresence mode="wait">
          {selectedSupplier ? (
            <motion.div
              key={selectedSupplier.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-4"
            >
              <div className="space-y-3">
                {newestFirst(selectedSupplier.analyses).map((analysis) => (
                  <AnalysisCard
                    key={analysis.id}
                    analysis={analysis}
                    onRunAgain={onRunAgain}
                    onDownload={onDownload}
                    onViewResult={onViewResult}
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid min-h-[360px] place-items-center text-center text-sm text-muted-foreground"
            >
              Select a supplier to view their analysis history.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

interface MasterSupplierRailProps {
  state: MasterDetailState;
  mobile?: boolean;
}

export function MasterSupplierRail({ state, mobile = false }: MasterSupplierRailProps) {
  const content = <SupplierRailContent state={state} />;

  if (mobile) {
    return (
      <aside className="mb-4 rounded-lg border border-border bg-muted/20 p-3 md:hidden">
        {content}
      </aside>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col p-3">
      {content}
    </div>
  );
}

function SupplierRailContent({ state }: { state: MasterDetailState }) {
  const { filteredSuppliers, selectedId, query, onQueryChange, onSelect } = state;

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Suppliers ({filteredSuppliers.length})
        </div>
      </div>
      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search suppliers..."
          className="h-8 bg-card pl-8 text-xs"
        />
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-1 pb-2">
          {filteredSuppliers.map((supplier) => {
            const selected = selectedId === supplier.id;
            const deviations = aggregateDeviations(supplier.analyses);
            const severity = supplierSeverity(supplier.analyses);

            return (
              <button
                key={supplier.id}
                type="button"
                onClick={() => onSelect(supplier.id)}
                className={cn(
                  "relative flex w-full items-center gap-2 rounded-md border border-transparent px-2.5 py-2 text-left transition-colors hover:bg-background",
                  selected && "bg-background shadow-sm",
                )}
              >
                {selected && (
                  <motion.span
                    layoutId="selected-supplier-master-accent"
                    className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                )}
                <SupplierAvatar name={supplier.name} shortCode={supplier.shortCode} severity={severity} size="sm" />
                <div className="min-w-0 flex-1 pl-0.5">
                  <div className="truncate text-[13px] font-medium text-foreground">{supplier.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {supplier.analyses.length} contract{supplier.analyses.length === 1 ? "" : "s"}
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium",
                    deviations.high > 0
                      ? "bg-destructive/10 text-destructive"
                      : "bg-success/10 text-success",
                  )}
                >
                  {deviations.high > 0 ? `${deviations.high} high` : "clean"}
                </span>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </>
  );
}
```

## src/components/ui/input.tsx

```tsx
import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
```

## src/components/ui/scroll-area.tsx

```tsx
import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

import { cn } from "@/lib/utils";

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root ref={ref} className={cn("relative overflow-hidden", className)} {...props}>
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">{children}</ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className,
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };
```

## src/components/clauseiq-v4/supplier-results/useMasterDetailState.ts

```ts
import { useEffect, useMemo, useState } from "react";
import { sortByRisk } from "@/lib/clauseiq-utils";
import type { ResultsViewProps, MasterDetailState } from "./types";

export function useMasterDetailState(initiative: ResultsViewProps["initiative"]): MasterDetailState {
  const sortedSuppliers = useMemo(() => sortByRisk(initiative.suppliers), [initiative.suppliers]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedId, setSelectedId] = useState(sortedSuppliers[0]?.id ?? "");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const filteredSuppliers = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return sortedSuppliers;
    return sortedSuppliers.filter((supplier) => supplier.name.toLowerCase().includes(q));
  }, [debouncedQuery, sortedSuppliers]);

  useEffect(() => {
    if (filteredSuppliers.length === 0) return;
    if (!filteredSuppliers.some((supplier) => supplier.id === selectedId)) {
      setSelectedId(filteredSuppliers[0].id);
    }
  }, [filteredSuppliers, selectedId]);

  const selectedSupplier =
    filteredSuppliers.find((supplier) => supplier.id === selectedId) ??
    filteredSuppliers[0] ??
    sortedSuppliers.find((supplier) => supplier.id === selectedId) ??
    null;

  return {
    filteredSuppliers,
    selectedId,
    selectedSupplier,
    query,
    onQueryChange: setQuery,
    onSelect: setSelectedId,
  };
}
```

## src/components/clauseiq-v4/supplier-results/StatCard.tsx

```tsx
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: number | string;
  className?: string;
}

export function StatCard({ label, value, className }: Props) {
  return (
    <div className={cn("rounded-lg bg-muted/45 px-4 py-3", className)}>
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-medium tabular-nums text-foreground">{value}</div>
    </div>
  );
}
```

## src/data/mock-delivery-engine-v4.ts

```ts
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
```

## src/data/mock-delivery-engine.ts

```ts
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
```
