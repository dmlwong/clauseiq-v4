import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import {
  CalendarDays,
  ChevronLeft,
  DollarSign,
  ExternalLink,
  Info,
  Pencil,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { V2Shell } from "@/components/clauseiq-v2/V2Shell";
import { ContractIntelligenceCard } from "@/components/delivery-engine/ContractIntelligenceCard";
import { ContentSearchTable } from "@/components/delivery-engine/ContentSearchTable";
import { RagIndicator } from "@/components/delivery-engine/RagIndicator";
import { StatusBadge } from "@/components/delivery-engine/StatusBadge";
import { SupplierWorkspaceTab } from "@/components/delivery-engine/SupplierWorkspaceTab";
import { ToolCoverageCard } from "@/components/delivery-engine/ToolCoverageCard";
import { getDeliveryInitiativeDetail } from "@/data/mock-delivery-engine";
import {
  getContractIntelligence,
  type ContractIntelligenceSupplier,
} from "@/data/mock-contract-intelligence";
import {
  getSupplierWorkspace,
  type SupplierWorkspaceRow,
} from "@/data/mock-supplier-workspace";
import { cn } from "@/lib/utils";

type DetailTab = "overview" | "benefits" | "milestones" | "supplier";

const detailTabs: Array<[DetailTab, string]> = [
  ["overview", "Overview"],
  ["benefits", "Benefits"],
  ["milestones", "Milestones"],
  ["supplier", "Supplier"],
];

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export default function InitiativeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const initiative = useMemo(() => id ? getDeliveryInitiativeDetail(id) : undefined, [id]);
  const contractIntelligence = useMemo(() => id ? getContractIntelligence(id) : undefined, [id]);
  const supplierWorkspace = useMemo(() => id ? getSupplierWorkspace(id) : undefined, [id]);
  const [tab, setTab] = useState<DetailTab>("overview");
  const enhancedToolCoverage = useMemo(() => {
    if (!initiative) return [];
    return initiative.toolCoverage.map((tool) => {
      if (tool.toolName !== "ClauseIQ" || !contractIntelligence) return tool;
      return {
        ...tool,
        isUsed: true,
        lastRunBy: initiative.leadName,
        lastRunAt: contractIntelligence.latestAnalysisLabel,
        statusLabel: "Analysis complete",
        ctaLabel: "Open Analysis",
      };
    });
  }, [contractIntelligence, initiative]);

  if (!initiative) {
    return (
      <V2Shell title="Delivery Engine" subtitle="Manage and track procurement initiatives end-to-end">
        <div className="p-10">
          <Button variant="ghost" className="gap-1.5" onClick={() => navigate("/delivery-engine")}>
            <ChevronLeft className="h-4 w-4" />
            Back to Delivery Engine
          </Button>
          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-10 text-center text-slate-500">
            Initiative not found.
          </div>
        </div>
      </V2Shell>
    );
  }

  const usedTools = enhancedToolCoverage.filter((tool) => tool.isUsed).length;
  const openClauseIQ = () => {
    navigate(`/clauseiq-v2?view=results&source=delivery-engine&initiativeId=${initiative.id}`);
  };
  const runClauseIQ = () => {
    navigate(`/clauseiq-v2?view=results&rerun=upload&source=delivery-engine&initiativeId=${initiative.id}`);
  };
  const reviewSupplier = (supplier: ContractIntelligenceSupplier) => {
    navigate(supplier.reviewHref);
  };
  const openSupplierClauseIQ = (supplier: SupplierWorkspaceRow) => {
    navigate(supplier.clauseIqHref);
  };
  const openSupplierMarketIQ = (supplier: SupplierWorkspaceRow) => {
    toast({
      title: `Opening MarketIQ for ${supplier.name}`,
      description: "Prototype placeholder — MarketIQ workspace is not implemented yet.",
    });
  };
  const openSupplierRfpAnalytics = (supplier: SupplierWorkspaceRow) => {
    toast({
      title: `Opening RFP Analytics for ${supplier.name}`,
      description: "Prototype placeholder — RFP Analytics workspace is not implemented yet.",
    });
  };

  return (
    <V2Shell
      title="Delivery Engine"
      subtitle="Manage and track procurement initiatives end-to-end"
      titleIcon={
        <div className="grid h-10 w-10 place-items-center rounded bg-primary text-primary-foreground">
          <SlidersHorizontal className="h-5 w-5" />
        </div>
      }
      headerRight={
        <div className="hidden max-w-[320px] items-center gap-1.5 truncate text-sm font-medium text-primary lg:flex">
          <ExternalLink className="h-4 w-4 shrink-0" />
          <span className="truncate">{initiative.id} | {initiative.name}</span>
        </div>
      }
      subheaderClassName="shrink-0 border-b border-slate-200 bg-white px-0 py-0"
      subheader={
        <div className="flex h-12 items-stretch justify-between px-6">
          <div className="flex items-stretch gap-6">
            {detailTabs.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value)}
                className={cn(
                  "border-b-2 px-3 text-xs font-medium transition-colors",
                  tab === value ? "border-primary text-slate-950" : "border-transparent text-slate-600 hover:text-slate-950",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-8 gap-1.5 border-slate-400 bg-white text-xs" onClick={() => toast({ title: `Edit initiative ${initiative.id}` })}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button variant="outline" className="h-8 gap-1.5 border-slate-400 bg-white text-xs" onClick={() => navigate("/delivery-engine")}>
              <X className="h-3.5 w-3.5" />
              Close
            </Button>
          </div>
        </div>
      }
    >
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="min-h-full bg-slate-50 px-8 py-4"
      >
        <div className={cn("mx-auto space-y-3", tab === "supplier" ? "max-w-[1280px]" : "max-w-[864px]")}>
          <AnimatePresence mode="wait">
            {tab === "supplier" ? (
              <motion.div
                key="supplier"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <SupplierWorkspaceTab
                  workspace={supplierWorkspace}
                  onOpenClauseIQ={openSupplierClauseIQ}
                  onOpenMarketIQ={openSupplierMarketIQ}
                  onOpenRfpAnalytics={openSupplierRfpAnalytics}
                />
              </motion.div>
            ) : tab !== "overview" ? (
              <motion.div
                key={tab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="rounded-lg border border-dashed border-slate-200 bg-white py-24 text-center text-sm text-slate-500"
              >
                {tab === "benefits" ? "Benefits" : "Milestones"} — Coming soon
              </motion.div>
            ) : (
              <motion.div
                key="overview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-3"
              >
                <section className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded bg-primary/10 text-primary">
                        <SlidersHorizontal className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h1 className="truncate text-lg font-semibold text-slate-950">
                          {initiative.id} | {initiative.name}
                        </h1>
                        <div className="mt-3 space-y-2 text-xs text-slate-600">
                          <p>Category: <span className="font-medium text-slate-900">{initiative.category}</span></p>
                          <p>Methodology: <span className="font-medium text-slate-900">{initiative.methodology}</span></p>
                          <p className="flex flex-wrap items-center gap-2">
                            Led by: <span className="font-medium text-slate-900">{initiative.ledBy}-led</span>
                            <span>|</span>
                            <span>Efficio Lead: {initiative.leadName}</span>
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                                {initials(initiative.leadName)}
                              </AvatarFallback>
                            </Avatar>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-slate-500">Initiative Status:</span>
                      <StatusBadge status={initiative.status} />
                      <Button variant="outline" className="h-8 gap-1.5 border-slate-400 bg-white text-xs" onClick={() => toast({ title: "Guidance panel coming soon" })}>
                        <Info className="h-3.5 w-3.5" />
                        Guidance
                      </Button>
                      <RagIndicator status={initiative.ragStatus} compact />
                    </div>
                  </div>
                </section>

                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                  className="grid gap-4 lg:grid-cols-2"
                >
                  {[
                    {
                      title: "Timeline",
                      icon: CalendarDays,
                      body: (
                        <div className="grid gap-4 sm:grid-cols-2">
                          <Metric label="Expected In-flight Date" value={initiative.timeline.expectedInflightDate} />
                          <Metric label="Expected Completion Date" value={initiative.timeline.expectedCompletionDate} />
                        </div>
                      ),
                    },
                    {
                      title: "Spend & Savings",
                      icon: DollarSign,
                      body: (
                        <Metric
                          label="Estimated Spend & Savings Known"
                          value={
                            <span className="inline-flex items-center gap-2">
                              <span className={cn("h-2.5 w-2.5 rounded-full", initiative.spendAndSavings.isKnown ? "bg-emerald-500" : "bg-red-500")} />
                              {initiative.spendAndSavings.isKnown ? "Yes" : "No"}
                            </span>
                          }
                        />
                      ),
                    },
                  ].map((card) => (
                    <motion.section
                      key={card.title}
                      variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                      className="rounded-lg border border-slate-200 bg-white p-4"
                    >
                      <div className="mb-3 flex items-center gap-2">
                        <card.icon className="h-4 w-4 text-slate-600" />
                        <h2 className="text-sm font-semibold text-slate-950">{card.title}</h2>
                      </div>
                      {card.body}
                    </motion.section>
                  ))}
                </motion.div>

                <section className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="h-4 w-4 text-slate-600" />
                        <h2 className="text-sm font-semibold text-slate-950">Key Tool Coverage</h2>
                        <Info className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">Track progress across critical initiative tools</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      Tool used
                      <Badge variant="outline" className="bg-slate-50">{usedTools}/{enhancedToolCoverage.length}</Badge>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {enhancedToolCoverage.map((tool, index) => (
                      <ToolCoverageCard
                        key={tool.toolName}
                        tool={tool}
                        index={index}
                        onAction={tool.toolName === "ClauseIQ" ? (contractIntelligence ? openClauseIQ : runClauseIQ) : undefined}
                      />
                    ))}
                  </div>
                </section>

                <ContractIntelligenceCard
                  intelligence={contractIntelligence}
                  onOpenClauseIQ={openClauseIQ}
                  onRunAnalysisAgain={runClauseIQ}
                  onReviewSupplier={reviewSupplier}
                />

                <ContentSearchTable documents={initiative.documents} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </V2Shell>
  );
}

function Metric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="mt-1 text-xs font-semibold text-slate-950">{value}</p>
    </div>
  );
}
