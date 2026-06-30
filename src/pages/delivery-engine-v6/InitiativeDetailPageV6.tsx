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

import { V6InitiativeLinkButton } from "@/components/clauseiq-v6/V6InitiativeLinkButton";
import { V6Shell } from "@/components/clauseiq-v6/V6Shell";
import {
  CompletedToolActionCardV6,
  ContentSearchTableV6,
  InfoCardV6,
  MetricV6,
  RagIndicatorV6,
  StatusBadgeV6,
  ToolCoverageCardV6,
} from "@/components/delivery-engine-v6/DeliveryEngineV6OrbitComponents";
import { Avatar, Badge as OrbitBadge, Card, Headings, Text } from "@orbit";
import { Button } from "@/components/clauseiq-v6/orbit-ui/button";
import { showV6OrbitToast as toast } from "@/components/clauseiq-v6/V6OrbitToast";
import { getV4DeliveryInitiative } from "@/data/mock-delivery-engine-v6";
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

export default function InitiativeDetailPageV6() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initiative = useMemo(() => id ? getV4DeliveryInitiative(id) : undefined, [id]);
  const [tab, setTab] = useState<DetailTab>("overview");
  const returnPath =
    searchParams.get("return") ??
    "/initiatives-v6?view=results&initiativeId=init-1&supplierId=sup-1&contractId=ct-1&source=clauseiq&mode=comparison&design=row-scale&scenario=first-analysis";

  const usedTools = initiative?.toolCoverage.filter((tool) => tool.isUsed).length ?? 0;

  const closePage = () => navigate(returnPath);
  const openClauseIqUpload = () => {
    navigate(`/clauseiq-v6/output-panel?rerun=upload&source=delivery-engine&initiativeId=${initiative?.id ?? "AAK01-1442"}`);
  };
  const openClauseIqResults = () => {
    navigate("/clauseiq-v6/output-panel");
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
      <V6Shell title="Delivery Engine" subtitle="Manage and track procurement initiatives end-to-end">
        <div className="p-orbit-xxl">
          <Card type="Static" padding="Base">
            <div className="py-orbit-xxl text-center">
              <Text size="Small" variant="Secondary">Initiative not found.</Text>
            </div>
          </Card>
        </div>
      </V6Shell>
    );
  }

  return (
    <V6Shell
      title="Delivery Engine"
      subtitle="Manage and track procurement initiatives end-to-end"
      titleIcon={
        <div className="grid h-10 w-10 place-items-center rounded bg-emerald-700 text-white">
          <Settings className="h-5 w-5" />
        </div>
      }
      headerRight={
        <V6InitiativeLinkButton label={`${initiative.id} | ${initiative.name}`} />
      }
      subheaderClassName="shrink-0 border-b border-slate-200 bg-white px-orbit-none py-orbit-none"
      subheader={
        <div className="flex h-12 items-stretch justify-between px-orbit-m">
          <div className="flex items-stretch gap-orbit-m">
            {detailTabs.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value)}
                className={cn(
                  "border-b-2 px-orbit-base text-xs v6-orbit-weight-medium transition-colors",
                  tab === value ? "border-[#5B5BF7] text-slate-950" : "border-transparent text-slate-600 hover:text-slate-950",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-orbit-s">
            <Button
              variant="outline"
              className="h-8 gap-orbit-xs border-slate-400 bg-white text-xs"
              onClick={() => toast({ title: `Edit initiative ${initiative.id}` })}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button variant="outline" className="h-8 gap-orbit-xs border-slate-400 bg-white text-xs" onClick={closePage}>
              <X className="h-3.5 w-3.5" />
              Close
            </Button>
          </div>
        </div>
      }
    >
      <div className="min-h-full bg-slate-50 px-orbit-l py-orbit-base">
        <div className="mx-auto max-w-[900px] space-y-orbit-base">
          {tab !== "overview" ? (
            <Card type="Static" padding="Base" state="Accent">
              <div className="py-orbit-mega text-center">
                <Text size="Small" variant="Secondary">
                  {tab === "benefits" ? "Benefits" : "Milestones"} - Coming soon
                </Text>
              </div>
            </Card>
          ) : (
            <>
              <Card type="Static" padding="Base">
                <div className="flex flex-wrap items-start justify-between gap-orbit-base">
                  <div className="flex min-w-0 items-start gap-orbit-base">
                    <div className="grid h-8 w-8 place-items-center rounded bg-[#EEF0FF] text-[#5B5BF7]">
                      <SlidersHorizontal className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h1 className="v6-orbit-heading-4 truncate text-slate-950">
                        {initiative.id} | {initiative.name}
                      </h1>
                      <div className="mt-orbit-base space-y-orbit-s text-xs text-slate-600">
                        <p>Category: <span className="v6-orbit-weight-medium text-slate-900">{initiative.category}</span></p>
                        <p>Methodology: <span className="v6-orbit-weight-medium text-slate-900">{initiative.methodology}</span></p>
                        <p className="flex flex-wrap items-center gap-orbit-s">
                          <span className="inline-flex items-center gap-orbit-xs">
                            Led by: <span className="v6-orbit-weight-medium text-slate-900">{initiative.ledBy}</span>
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
                  <div className="flex flex-wrap items-center gap-orbit-s text-xs">
                    <span className="inline-flex items-center gap-orbit-xs text-slate-500">
                      <Info className="h-3.5 w-3.5" />
                      Initiative Status:
                    </span>
                    <StatusBadgeV6 status={initiative.status} />
                    <Button
                      variant="outline"
                      className="h-8 gap-orbit-xs border-slate-400 bg-white text-xs"
                      onClick={() => toast({ title: "Guidance panel coming soon" })}
                    >
                      Guidance
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-10 border-slate-400 bg-white">
                      <RagIndicatorV6 status={initiative.ragStatus} compact />
                    </Button>
                  </div>
                </div>
              </Card>

              <div className="grid gap-orbit-base lg:grid-cols-2">
                <InfoCardV6 title="Timeline" icon={<CalendarDays className="h-4 w-4 text-[#5B5BF7]" />}>
                  <div className="grid gap-orbit-base sm:grid-cols-2">
                    <MetricV6 label="Expected In-flight Date" value={initiative.timeline.expectedInflightDate} />
                    <MetricV6 label="Expected Completion Date" value={initiative.timeline.expectedCompletionDate} />
                  </div>
                </InfoCardV6>
                <InfoCardV6 title="Spend & Savings" icon={<DollarSign className="h-4 w-4 text-[#5B5BF7]" />}>
                  <MetricV6
                    label="Estimated Spend & Savings Known"
                    value={
                      <span className="inline-flex items-center gap-orbit-s">
                        <span className={cn("h-2.5 w-2.5 rounded-full", initiative.spendAndSavings.isKnown ? "bg-emerald-500" : "bg-red-500")} />
                        {initiative.spendAndSavings.isKnown ? "Yes" : "No"}
                      </span>
                    }
                  />
                </InfoCardV6>
              </div>

              <section className="space-y-orbit-base">
                <div className="flex flex-wrap items-start justify-between gap-orbit-base">
                  <div>
                    <div className="flex items-center gap-orbit-s">
                      <div className="grid h-7 w-7 place-items-center rounded-md bg-[#EEF0FF] text-[#5B5BF7]">
                        <Settings className="h-3.5 w-3.5" />
                      </div>
                      <Headings size="Heading 5">Key Tool Coverage</Headings>
                      <Info className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <div className="mt-orbit-s">
                      <Text as="p" size="Small" variant="Secondary">
                        Track progress across critical initiative tools
                      </Text>
                    </div>
                  </div>
                  <div className="flex items-center gap-orbit-s text-xs text-slate-600">
                    Tool Used:
                    <OrbitBadge label={`${usedTools}/${initiative.toolCoverage.length}`} status="Information" />
                  </div>
                </div>
                <div className="mt-orbit-base grid gap-orbit-base md:grid-cols-2 xl:grid-cols-4">
                  {initiative.toolCoverage.map((tool, index) => (
                    tool.toolName === "ClauseIQ" ? (
                      <CompletedToolActionCardV6
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
                      <CompletedToolActionCardV6
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
                      <ToolCoverageCardV6 key={tool.toolName} tool={tool} index={index} />
                    )
                  ))}
                </div>
              </section>

              <ContentSearchTableV6 documents={initiative.documents} />
            </>
          )}
        </div>
      </div>
    </V6Shell>
  );
}
