import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  Check,
  DollarSign,
  Download,
  ExternalLink,
  FileText,
  Info,
  Pencil,
  RefreshCw,
  Settings,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { ContentSearchTable } from "@/components/delivery-engine/ContentSearchTable";
import { RagIndicator } from "@/components/delivery-engine/RagIndicator";
import { StatusBadge } from "@/components/delivery-engine/StatusBadge";
import { ToolCoverageCard } from "@/components/delivery-engine/ToolCoverageCard";
import { V4InitiativeLinkButton } from "@/components/clauseiq-v4/V4InitiativeLinkButton";
import { V4Shell } from "@/components/clauseiq-v4/V4Shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { getV4DeliveryInitiative } from "@/data/mock-delivery-engine-v4";
import { cn } from "@/lib/utils";

type DetailTab = "overview" | "benefits" | "milestones";

const detailTabs: Array<[DetailTab, string]> = [
  ["overview", "Overview"],
  ["benefits", "Benefits"],
  ["milestones", "Milestones"],
];

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export default function InitiativeDetailPageV4() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initiative = useMemo(() => id ? getV4DeliveryInitiative(id) : undefined, [id]);
  const [tab, setTab] = useState<DetailTab>("overview");
  const returnPath =
    searchParams.get("return") ??
    "/initiatives-v4?view=results&initiativeId=init-1&supplierId=sup-1&contractId=ct-1&source=clauseiq&mode=comparison&design=row-scale&scenario=first-analysis";

  const usedTools = initiative?.toolCoverage.filter((tool) => tool.isUsed).length ?? 0;

  const closePage = () => navigate(returnPath);
  const openClauseIqUpload = () => {
    navigate(`/clauseiq-v4/output-panel?rerun=upload&source=delivery-engine&initiativeId=${initiative?.id ?? "AAK01-1442"}`);
  };
  const openClauseIqResults = () => {
    navigate("/clauseiq-v4/output-panel");
  };
  const downloadLatestContract = () => {
    const blob = new Blob(
      [
        "ClauseIQ latest contract\n\nInitiative: AAK01-1442 | CheckPermissionsPart01\nDocument: Master Service Agreement\nStatus: Latest analysis result\n",
      ],
      { type: "text/plain;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "AAK01-1442-latest-contract.txt";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast({ title: "Latest contract download started" });
  };
  const downloadLatestMarketInsight = () => {
    const blob = new Blob(
      [
        "MarketIQ latest insight\n\nInitiative: AAK01-1442 | CheckPermissionsPart01\nReport: Category Insight Report\nStatus: Latest market analysis result\n",
      ],
      { type: "text/plain;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "AAK01-1442-latest-marketiq-insight.txt";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast({ title: "Latest MarketIQ insight download started" });
  };
  const openMarketIqTool = () => {
    toast({
      title: "Opening MarketIQ",
      description: "Prototype placeholder — MarketIQ upload/run workspace is not implemented yet.",
    });
  };
  const openMarketIqResults = () => {
    toast({
      title: "Opening MarketIQ results",
      description: "Prototype placeholder — MarketIQ results workspace is not implemented yet.",
    });
  };

  if (!initiative) {
    return (
      <V4Shell title="Delivery Engine" subtitle="Manage and track procurement initiatives end-to-end">
        <div className="p-10">
          <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Initiative not found.
          </div>
        </div>
      </V4Shell>
    );
  }

  return (
    <V4Shell
      title="Delivery Engine"
      subtitle="Manage and track procurement initiatives end-to-end"
      titleIcon={
        <div className="grid h-10 w-10 place-items-center rounded bg-emerald-700 text-white">
          <Settings className="h-5 w-5" />
        </div>
      }
      headerRight={
        <V4InitiativeLinkButton label={`${initiative.id} | ${initiative.name}`} />
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
                  tab === value ? "border-[#5B5BF7] text-slate-950" : "border-transparent text-slate-600 hover:text-slate-950",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-8 gap-1.5 border-slate-400 bg-white text-xs"
              onClick={() => toast({ title: `Edit initiative ${initiative.id}` })}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button variant="outline" className="h-8 gap-1.5 border-slate-400 bg-white text-xs" onClick={closePage}>
              <X className="h-3.5 w-3.5" />
              Close
            </Button>
          </div>
        </div>
      }
    >
      <div className="min-h-full bg-slate-50 px-8 py-4">
        <div className="mx-auto max-w-[900px] space-y-3">
          {tab !== "overview" ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-white py-24 text-center text-sm text-slate-500">
              {tab === "benefits" ? "Benefits" : "Milestones"} — Coming soon
            </div>
          ) : (
            <>
              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded bg-[#EEF0FF] text-[#5B5BF7]">
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
                          <span className="inline-flex items-center gap-1">
                            Led by: <span className="font-medium text-slate-900">{initiative.ledBy}</span>
                          </span>
                          <span>|</span>
                          <span>Efficio Lead:</span>
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-slate-100 text-[10px] font-semibold text-slate-600">
                              {initials(initiative.leadName)}
                            </AvatarFallback>
                          </Avatar>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 text-slate-500">
                      <Info className="h-3.5 w-3.5" />
                      Initiative Status:
                    </span>
                    <StatusBadge status={initiative.status} />
                    <Button
                      variant="outline"
                      className="h-8 gap-1.5 border-slate-400 bg-white text-xs"
                      onClick={() => toast({ title: "Guidance panel coming soon" })}
                    >
                      Guidance
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-10 border-slate-400 bg-white">
                      <RagIndicator status={initiative.ragStatus} compact />
                    </Button>
                  </div>
                </div>
              </section>

              <div className="grid gap-3 lg:grid-cols-2">
                <InfoCard title="Timeline" icon={<CalendarDays className="h-4 w-4 text-[#5B5BF7]" />}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Metric label="Expected In-flight Date" value={initiative.timeline.expectedInflightDate} />
                    <Metric label="Expected Completion Date" value={initiative.timeline.expectedCompletionDate} />
                  </div>
                </InfoCard>
                <InfoCard title="Spend & Savings" icon={<DollarSign className="h-4 w-4 text-[#5B5BF7]" />}>
                  <Metric
                    label="Estimated Spend & Savings Known"
                    value={
                      <span className="inline-flex items-center gap-2">
                        <span className={cn("h-2.5 w-2.5 rounded-full", initiative.spendAndSavings.isKnown ? "bg-emerald-500" : "bg-red-500")} />
                        {initiative.spendAndSavings.isKnown ? "Yes" : "No"}
                      </span>
                    }
                  />
                </InfoCard>
              </div>

              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="grid h-7 w-7 place-items-center rounded-md bg-[#EEF0FF] text-[#5B5BF7]">
                        <Settings className="h-3.5 w-3.5" />
                      </div>
                      <h2 className="text-sm font-semibold text-slate-950">Key Tool Coverage</h2>
                      <Info className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Track progress across critical initiative tools</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    Tool Used:
                    <Badge variant="outline" className="border-[#5B5BF7] bg-white text-[#5B5BF7]">
                      {usedTools}/{initiative.toolCoverage.length}
                    </Badge>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {initiative.toolCoverage.map((tool, index) => (
                    tool.toolName === "ClauseIQ" ? (
                      <CompletedToolActionCard
                        key={tool.toolName}
                        toolName="ClauseIQ"
                        description="Contract analysis and insights"
                        initials="JL"
                        timestamp="Jan 5, 2026, 10:08"
                        downloadLabel="Download latest contract"
                        uploadLabel="Upload contract in ClauseIQ"
                        onDownload={downloadLatestContract}
                        onUpload={openClauseIqUpload}
                        onOpenResults={openClauseIqResults}
                      />
                    ) : tool.toolName === "MarketIQ" ? (
                      <CompletedToolActionCard
                        key={tool.toolName}
                        toolName="MarketIQ"
                        description={tool.description}
                        initials="MY"
                        timestamp={tool.lastRunAt ?? "May 06, 2026, 10:34"}
                        downloadLabel="Download latest MarketIQ insight"
                        uploadLabel="Open MarketIQ"
                        onDownload={downloadLatestMarketInsight}
                        onUpload={openMarketIqTool}
                        onOpenResults={openMarketIqResults}
                      />
                    ) : (
                      <ToolCoverageCard key={tool.toolName} tool={tool} index={index} />
                    )
                  ))}
                </div>
              </section>

              <ContentSearchTable documents={initiative.documents} />
            </>
          )}
        </div>
      </div>
    </V4Shell>
  );
}

function InfoCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-md bg-[#EEF0FF]">{icon}</div>
        <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
      </div>
      {children}
    </section>
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

function CompletedToolActionCard({
  toolName,
  description,
  initials,
  timestamp,
  downloadLabel,
  uploadLabel,
  onDownload,
  onUpload,
  onOpenResults,
}: {
  toolName: string;
  description: string;
  initials: string;
  timestamp: string;
  downloadLabel: string;
  uploadLabel: string;
  onDownload: () => void;
  onUpload: () => void;
  onOpenResults: () => void;
}) {
  return (
    <div className="flex min-h-[216px] flex-col rounded-lg border border-emerald-300 bg-emerald-50/40 p-3 ring-1 ring-emerald-100">
      <div className="flex items-start justify-between gap-2">
        <div className="relative grid h-10 w-10 place-items-center rounded-lg border border-emerald-600 bg-white text-emerald-700">
          <FileText className="h-5 w-5" />
          <span className="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full bg-emerald-600 text-white">
            <Check className="h-2.5 w-2.5" />
          </span>
        </div>
        <Badge className="border-emerald-700 bg-white px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-white">
          Deliver
        </Badge>
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-semibold text-slate-950">{toolName}</h3>
        <p className="mt-1 min-h-[34px] text-xs leading-5 text-slate-500">{description}</p>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-[#074653] text-[10px] font-semibold text-white">
          {initials}
        </span>
        <span>{timestamp}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="outline" className="h-8 border-slate-400 bg-white" aria-label={downloadLabel} onClick={onDownload}>
          <Download className="h-4 w-4" />
        </Button>
        <Button variant="outline" className="h-8 border-slate-400 bg-white" aria-label={uploadLabel} onClick={onUpload}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <Button variant="outline" className="mt-2 h-8 gap-2 border-slate-400 bg-white text-sm" onClick={onOpenResults}>
        <ExternalLink className="h-4 w-4" />
        My results
      </Button>
    </div>
  );
}
