import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  DollarSign,
  Info,
  Pencil,
  Settings,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { V5InitiativeLinkButton } from "@/components/clauseiq-v5/V5InitiativeLinkButton";
import { V5Shell } from "@/components/clauseiq-v5/V5Shell";
import {
  CompletedToolActionCardV5,
  ContentSearchTableV5,
  InfoCardV5,
  MetricV5,
  RagIndicatorV5,
  StatusBadgeV5,
  ToolCoverageCardV5,
} from "@/components/delivery-engine-v5/DeliveryEngineV5OrbitComponents";
import { Avatar, Badge as OrbitBadge, Card, Headings, Text } from "@orbit";
import { Button } from "@/components/clauseiq-v5/orbit-ui/button";
import { showV5OrbitToast as toast } from "@/components/clauseiq-v5/V5OrbitToast";
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

export default function InitiativeDetailPageV5() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initiative = useMemo(() => id ? getV4DeliveryInitiative(id) : undefined, [id]);
  const [tab, setTab] = useState<DetailTab>("overview");
  const returnPath =
    searchParams.get("return") ??
    "/initiatives-v5?view=results&initiativeId=init-1&supplierId=sup-1&contractId=ct-1&source=clauseiq&mode=comparison&design=row-scale&scenario=first-analysis";

  const usedTools = initiative?.toolCoverage.filter((tool) => tool.isUsed).length ?? 0;

  const closePage = () => navigate(returnPath);
  const openClauseIqUpload = () => {
    navigate(`/clauseiq-v5/output-panel?rerun=upload&source=delivery-engine&initiativeId=${initiative?.id ?? "AAK01-1442"}`);
  };
  const openClauseIqResults = () => {
    navigate("/clauseiq-v5/output-panel");
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
      <V5Shell title="Delivery Engine" subtitle="Manage and track procurement initiatives end-to-end">
        <div className="p-10">
          <Card type="Static" padding="Base">
            <div className="py-10 text-center">
              <Text size="Small" variant="Secondary">Initiative not found.</Text>
            </div>
          </Card>
        </div>
      </V5Shell>
    );
  }

  return (
    <V5Shell
      title="Delivery Engine"
      subtitle="Manage and track procurement initiatives end-to-end"
      titleIcon={
        <div className="grid h-10 w-10 place-items-center rounded bg-emerald-700 text-white">
          <Settings className="h-5 w-5" />
        </div>
      }
      headerRight={
        <V5InitiativeLinkButton label={`${initiative.id} | ${initiative.name}`} />
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
            <Card type="Static" padding="Base" state="Accent">
              <div className="py-24 text-center">
                <Text size="Small" variant="Secondary">
                  {tab === "benefits" ? "Benefits" : "Milestones"} - Coming soon
                </Text>
              </div>
            </Card>
          ) : (
            <>
              <Card type="Static" padding="Base">
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
                          <Avatar
                            name={initiative.leadName}
                            initials={initials(initiative.leadName)}
                            size="Extra Small"
                            color="var(--orbit-color-chip-no-status-bg)"
                          />
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 text-slate-500">
                      <Info className="h-3.5 w-3.5" />
                      Initiative Status:
                    </span>
                    <StatusBadgeV5 status={initiative.status} />
                    <Button
                      variant="outline"
                      className="h-8 gap-1.5 border-slate-400 bg-white text-xs"
                      onClick={() => toast({ title: "Guidance panel coming soon" })}
                    >
                      Guidance
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-10 border-slate-400 bg-white">
                      <RagIndicatorV5 status={initiative.ragStatus} compact />
                    </Button>
                  </div>
                </div>
              </Card>

              <div className="grid gap-3 lg:grid-cols-2">
                <InfoCardV5 title="Timeline" icon={<CalendarDays className="h-4 w-4 text-[#5B5BF7]" />}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <MetricV5 label="Expected In-flight Date" value={initiative.timeline.expectedInflightDate} />
                    <MetricV5 label="Expected Completion Date" value={initiative.timeline.expectedCompletionDate} />
                  </div>
                </InfoCardV5>
                <InfoCardV5 title="Spend & Savings" icon={<DollarSign className="h-4 w-4 text-[#5B5BF7]" />}>
                  <MetricV5
                    label="Estimated Spend & Savings Known"
                    value={
                      <span className="inline-flex items-center gap-2">
                        <span className={cn("h-2.5 w-2.5 rounded-full", initiative.spendAndSavings.isKnown ? "bg-emerald-500" : "bg-red-500")} />
                        {initiative.spendAndSavings.isKnown ? "Yes" : "No"}
                      </span>
                    }
                  />
                </InfoCardV5>
              </div>

              <section className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="grid h-7 w-7 place-items-center rounded-md bg-[#EEF0FF] text-[#5B5BF7]">
                        <Settings className="h-3.5 w-3.5" />
                      </div>
                      <Headings size="Heading 5">Key Tool Coverage</Headings>
                      <Info className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <div className="mt-2">
                      <Text as="p" size="Small" variant="Secondary">
                        Track progress across critical initiative tools
                      </Text>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    Tool Used:
                    <OrbitBadge label={`${usedTools}/${initiative.toolCoverage.length}`} status="Information" />
                  </div>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {initiative.toolCoverage.map((tool, index) => (
                    tool.toolName === "ClauseIQ" ? (
                      <CompletedToolActionCardV5
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
                      <CompletedToolActionCardV5
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
                      <ToolCoverageCardV5 key={tool.toolName} tool={tool} index={index} />
                    )
                  ))}
                </div>
              </section>

              <ContentSearchTableV5 documents={initiative.documents} />
            </>
          )}
        </div>
      </div>
    </V5Shell>
  );
}
