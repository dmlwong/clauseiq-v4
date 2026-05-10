import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Building2,
  CheckCircle2,
  Circle,
  Clock3,
  ExternalLink,
  FileSearch,
  LineChart,
  Search,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ContractRiskLevel } from "@/data/mock-contract-intelligence";
import {
  filterSupplierWorkspaceRows,
  sortSupplierWorkspaceRows,
  type SourcingStage,
  type SupplierWorkspaceFilters,
  type SupplierWorkspaceRow,
  type SupplierWorkspaceSort,
  type SupplierWorkspaceStatus,
  type SupplierWorkspaceSummary,
} from "@/data/mock-supplier-workspace";
import { cn } from "@/lib/utils";

interface Props {
  workspace?: SupplierWorkspaceSummary;
  onOpenClauseIQ: (supplier: SupplierWorkspaceRow) => void;
  onOpenMarketIQ: (supplier: SupplierWorkspaceRow) => void;
  onOpenRfpAnalytics: (supplier: SupplierWorkspaceRow) => void;
}

const statusOptions: Array<SupplierWorkspaceStatus | "all"> = [
  "all",
  "In Negotiation",
  "In Review",
  "Not Reviewed",
  "Finalised",
];
const riskOptions: Array<ContractRiskLevel | "all"> = ["all", "high", "medium", "low", "clean"];
const stageOptions: Array<SourcingStage | "all"> = [
  "all",
  "Invited",
  "Response Received",
  "Evaluation",
  "Clarification",
  "Shortlisted",
  "Negotiation",
  "Awarded",
];
const sortOptions: Array<{ value: SupplierWorkspaceSort; label: string }> = [
  { value: "risk", label: "Highest risk" },
  { value: "updated", label: "Latest updated" },
  { value: "commercial", label: "Commercial score" },
  { value: "capability", label: "Capability score" },
  { value: "clauseiq", label: "ClauseIQ score" },
  { value: "actions", label: "Open actions" },
  { value: "name", label: "Supplier A-Z" },
];

const statusTone: Record<SupplierWorkspaceStatus, string> = {
  "In Negotiation": "border-blue-200 bg-blue-50 text-blue-800",
  "In Review": "border-amber-200 bg-amber-50 text-amber-800",
  "Not Reviewed": "border-slate-200 bg-slate-100 text-slate-600",
  Finalised: "border-emerald-200 bg-emerald-50 text-emerald-700",
};
const riskTone: Record<ContractRiskLevel, string> = {
  high: "border-red-200 bg-red-50 text-red-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  clean: "border-slate-200 bg-slate-50 text-slate-600",
};
const stageTone: Record<SourcingStage, string> = {
  Invited: "border-slate-200 bg-slate-50 text-slate-600",
  "Response Received": "border-blue-200 bg-blue-50 text-blue-700",
  Evaluation: "border-indigo-200 bg-indigo-50 text-indigo-700",
  Clarification: "border-amber-200 bg-amber-50 text-amber-700",
  Shortlisted: "border-purple-200 bg-purple-50 text-purple-700",
  Negotiation: "border-orange-200 bg-orange-50 text-orange-700",
  Awarded: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export function SupplierWorkspaceTab({
  workspace,
  onOpenClauseIQ,
  onOpenMarketIQ,
  onOpenRfpAnalytics,
}: Props) {
  const [filters, setFilters] = useState<SupplierWorkspaceFilters>({
    query: "",
    status: "all",
    risk: "all",
    stage: "all",
  });
  const [sort, setSort] = useState<SupplierWorkspaceSort>("risk");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>();

  const rows = useMemo(() => {
    if (!workspace) return [];
    return sortSupplierWorkspaceRows(filterSupplierWorkspaceRows(workspace.suppliers, filters), sort);
  }, [filters, sort, workspace]);

  if (!workspace || workspace.totalSuppliers === 0) {
    return (
      <section className="rounded-lg border border-dashed border-slate-200 bg-white py-16 text-center">
        <Building2 className="mx-auto h-8 w-8 text-slate-400" />
        <p className="mt-3 text-sm font-medium text-slate-950">No suppliers added yet</p>
        <p className="mt-1 text-xs text-slate-500">Add suppliers or run ClauseIQ to start building the supplier workspace.</p>
      </section>
    );
  }

  const selectedSupplier = selectedSupplierId
    ? workspace.suppliers.find((supplier) => supplier.id === selectedSupplierId) ?? null
    : null;

  if (selectedSupplier) {
    return (
      <SupplierDetailWorkspace
        supplier={selectedSupplier}
        onBack={() => setSelectedSupplierId(undefined)}
        onOpenClauseIQ={onOpenClauseIQ}
        onOpenMarketIQ={onOpenMarketIQ}
        onOpenRfpAnalytics={onOpenRfpAnalytics}
      />
    );
  }

  return (
    <div className="space-y-3">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-950">Supplier workspace</h2>
            <p className="mt-1 text-xs text-slate-500">
              Compare suppliers first, then open one supplier for detailed ClauseIQ, MarketIQ, and RFP Analytics outputs.
            </p>
          </div>
          <Badge variant="outline" className="bg-slate-50 text-xs text-slate-700">
            {workspace.totalSuppliers} suppliers
          </Badge>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryMetric label="Suppliers" value={workspace.totalSuppliers} />
          <SummaryMetric label="In negotiation" value={workspace.inNegotiation} />
          <SummaryMetric label="In review" value={workspace.inReview} />
          <SummaryMetric label="Finalised" value={workspace.finalised} />
          <SummaryMetric label="Commercial avg" value={formatScore(workspace.avgCommercialScore)} />
          <SummaryMetric label="Capability avg" value={formatScore(workspace.avgCapabilityScore)} />
          <SummaryMetric label="ClauseIQ avg" value={formatScore(workspace.avgClauseIqScore)} />
          <SummaryMetric label="Open actions" value={workspace.openActions} tone="danger" />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="h-8 border-slate-300 bg-white pl-9 text-xs"
              placeholder="Search supplier or category"
              value={filters.query}
              onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
            />
          </div>
          <SmallSelect
            value={filters.status}
            onValueChange={(value) => setFilters((current) => ({ ...current, status: value as SupplierWorkspaceFilters["status"] }))}
            options={statusOptions.map((value) => ({ value, label: value === "all" ? "All statuses" : value }))}
          />
          <SmallSelect
            value={filters.risk}
            onValueChange={(value) => setFilters((current) => ({ ...current, risk: value as SupplierWorkspaceFilters["risk"] }))}
            options={riskOptions.map((value) => ({ value, label: value === "all" ? "All risks" : capitalize(value) }))}
          />
          <SmallSelect
            value={filters.stage}
            onValueChange={(value) => setFilters((current) => ({ ...current, stage: value as SupplierWorkspaceFilters["stage"] }))}
            options={stageOptions.map((value) => ({ value, label: value === "all" ? "All stages" : value }))}
          />
          <SmallSelect
            value={sort}
            onValueChange={(value) => setSort(value as SupplierWorkspaceSort)}
            options={sortOptions}
          />
        </div>

        <div className="mt-4 overflow-x-auto rounded-md border border-slate-200">
          <Table className="min-w-[1080px]">
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="h-8 text-[11px]">Supplier</TableHead>
                <TableHead className="h-8 text-[11px]">Status</TableHead>
                <TableHead className="h-8 text-right text-[11px]">Contracts</TableHead>
                <TableHead className="h-8 text-right text-[11px]">Commercial</TableHead>
                <TableHead className="h-8 text-right text-[11px]">Capability</TableHead>
                <TableHead className="h-8 text-right text-[11px]">ClauseIQ</TableHead>
                <TableHead className="h-8 text-[11px]">MarketIQ signal</TableHead>
                <TableHead className="h-8 text-[11px]">RFP stage</TableHead>
                <TableHead className="h-8 text-right text-[11px]">Open actions</TableHead>
                <TableHead className="h-8 text-[11px]">Last updated</TableHead>
                <TableHead className="h-8 text-right text-[11px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((supplier) => (
                <TableRow
                  key={supplier.id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => setSelectedSupplierId(supplier.id)}
                >
                  <TableCell className="py-2">
                    <div className="flex items-center gap-2">
                      <SupplierAvatar shortCode={supplier.shortCode} />
                      <div className="min-w-0">
                        <div className="truncate text-xs font-medium text-slate-950">{supplier.name}</div>
                        <div className="text-[11px] text-slate-500">{supplier.clausesReviewed} clauses reviewed</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-2"><StatusPill status={supplier.status} /></TableCell>
                  <TableCell className="py-2 text-right text-xs">{supplier.contractsAnalysed}</TableCell>
                  <TableCell className="py-2 text-right text-xs tabular-nums">{formatScore(supplier.commercialScore)}</TableCell>
                  <TableCell className="py-2 text-right text-xs tabular-nums">{formatScore(supplier.capabilityScore)}</TableCell>
                  <TableCell className="py-2 text-right text-xs font-semibold tabular-nums text-slate-950">
                    {formatScore(supplier.clauseIqScore)}
                  </TableCell>
                  <TableCell className="py-2 text-xs text-slate-600">{supplier.marketIq.marketPosition}</TableCell>
                  <TableCell className="py-2"><StagePill stage={supplier.rfpAnalytics.stage} /></TableCell>
                  <TableCell className="py-2 text-right text-xs font-semibold text-red-700">{supplier.openActions}</TableCell>
                  <TableCell className="py-2 text-xs text-slate-600">{supplier.lastUpdatedLabel}</TableCell>
                  <TableCell className="py-2 text-right">
                    <Button
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedSupplierId(supplier.id);
                      }}
                    >
                      View Supplier
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {rows.length === 0 && (
            <div className="py-10 text-center text-sm text-slate-500">No suppliers match these filters.</div>
          )}
        </div>
      </section>
    </div>
  );
}

type SupplierDetailTab = "overview" | "clauseiq" | "marketiq" | "rfp";

const detailTabs: Array<{ value: SupplierDetailTab; label: string }> = [
  { value: "overview", label: "Overview" },
  { value: "clauseiq", label: "ClauseIQ" },
  { value: "marketiq", label: "MarketIQ" },
  { value: "rfp", label: "RFP Analytics" },
];

function SupplierDetailWorkspace({
  supplier,
  onBack,
  onOpenClauseIQ,
  onOpenMarketIQ,
  onOpenRfpAnalytics,
}: {
  supplier: SupplierWorkspaceRow;
  onBack: () => void;
  onOpenClauseIQ: (supplier: SupplierWorkspaceRow) => void;
  onOpenMarketIQ: (supplier: SupplierWorkspaceRow) => void;
  onOpenRfpAnalytics: (supplier: SupplierWorkspaceRow) => void;
}) {
  return (
    <div className="space-y-3">
      <Button variant="ghost" className="h-8 gap-1.5 px-2 text-xs text-slate-600" onClick={onBack}>
        <ArrowLeft className="h-3.5 w-3.5" />
        All suppliers
      </Button>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        <div className="border-b border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <SupplierDetailHeader supplier={supplier} />
            <div className="grid min-w-[280px] flex-1 gap-2 sm:grid-cols-2 lg:max-w-[520px]">
              <DetailMetric label="Commercial" value={formatScore(supplier.commercialScore)} />
              <DetailMetric label="Capability" value={formatScore(supplier.capabilityScore)} />
              <DetailMetric label="ClauseIQ" value={formatScore(supplier.clauseIqScore)} />
              <DetailMetric label="Open actions" value={supplier.openActions} tone="danger" />
            </div>
          </div>
        </div>
        <SupplierToolTabs
          supplier={supplier}
          contentClassName="p-4"
          onOpenClauseIQ={onOpenClauseIQ}
          onOpenMarketIQ={onOpenMarketIQ}
          onOpenRfpAnalytics={onOpenRfpAnalytics}
        />
      </section>
    </div>
  );
}

function SupplierToolTabs({
  supplier,
  contentClassName,
  onOpenClauseIQ,
  onOpenMarketIQ,
  onOpenRfpAnalytics,
}: {
  supplier: SupplierWorkspaceRow;
  contentClassName: string;
  onOpenClauseIQ: (supplier: SupplierWorkspaceRow) => void;
  onOpenMarketIQ: (supplier: SupplierWorkspaceRow) => void;
  onOpenRfpAnalytics: (supplier: SupplierWorkspaceRow) => void;
}) {
  const [activeTab, setActiveTab] = useState<SupplierDetailTab>("overview");
  const supplierId = supplier.id;

  useEffect(() => {
    if (supplierId) setActiveTab("overview");
  }, [supplierId]);

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as SupplierDetailTab)}>
      <div className="border-b border-slate-200 bg-white px-3 py-2">
        <TabsList className="grid h-auto min-h-9 w-full grid-cols-2 gap-1 rounded-md bg-slate-100 p-1 md:grid-cols-4">
          {detailTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="px-2 text-[11px]">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <div className={contentClassName}>
        <TabsContent value="overview" className="mt-0">
          <SupplierOverviewSpace
            supplier={supplier}
            onSelectTool={setActiveTab}
          />
        </TabsContent>
        <TabsContent value="clauseiq" className="mt-0">
          <ClauseIqSpace supplier={supplier} onOpen={() => onOpenClauseIQ(supplier)} />
        </TabsContent>
        <TabsContent value="marketiq" className="mt-0">
          <MarketIqSpace supplier={supplier} onOpen={() => onOpenMarketIQ(supplier)} />
        </TabsContent>
        <TabsContent value="rfp" className="mt-0">
          <RfpAnalyticsSpace supplier={supplier} onOpen={() => onOpenRfpAnalytics(supplier)} />
        </TabsContent>
      </div>
    </Tabs>
  );
}

function SupplierDetailHeader({ supplier }: { supplier: SupplierWorkspaceRow }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <SupplierAvatar shortCode={supplier.shortCode} size="lg" />
      <div className="min-w-0">
        <h3 className="truncate text-base font-semibold text-slate-950">{supplier.name}</h3>
        <p className="mt-1 text-xs font-normal text-slate-500">
          {supplier.contractsAnalysed} contract{supplier.contractsAnalysed === 1 ? "" : "s"} · {supplier.clausesReviewed} clauses
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <StatusPill status={supplier.status} />
          <RiskPill risk={supplier.riskLevel} />
          <StagePill stage={supplier.rfpAnalytics.stage} />
        </div>
      </div>
    </div>
  );
}

function SupplierOverviewSpace({
  supplier,
  onSelectTool,
}: {
  supplier: SupplierWorkspaceRow;
  onSelectTool: (tab: SupplierDetailTab) => void;
}) {
  return (
    <div className="space-y-3">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-2xl">
            <h3 className="text-sm font-semibold text-slate-950">Recommended next action</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{recommendedAction(supplier)}</p>
          </div>
          <Badge variant="outline" className="bg-slate-50 text-[10px] text-slate-700">{supplier.lastUpdatedLabel}</Badge>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <DecisionSignal
            title="Contract position"
            tone={supplier.riskLevel === "high" ? "danger" : supplier.riskLevel === "medium" ? "warning" : "success"}
            value={`${supplier.openActions} open action${supplier.openActions === 1 ? "" : "s"}`}
            detail={`${supplier.highDeviations} high deviations and ${supplier.missingClauses} missing clauses surfaced by ClauseIQ.`}
          />
          <DecisionSignal
            title="Market fit"
            tone={(supplier.marketIq.categoryFitScore ?? 0) >= 80 ? "success" : (supplier.marketIq.categoryFitScore ?? 0) >= 70 ? "warning" : "neutral"}
            value={supplier.marketIq.marketPosition}
            detail={`${formatScore(supplier.marketIq.categoryFitScore)} fit. ${supplier.marketIq.pricingSignal}.`}
          />
          <DecisionSignal
            title="Sourcing progress"
            tone={supplier.rfpAnalytics.evaluationProgress >= 80 ? "success" : supplier.rfpAnalytics.evaluationProgress >= 50 ? "warning" : "neutral"}
            value={`${supplier.rfpAnalytics.evaluationProgress}% complete`}
            detail={`${supplier.rfpAnalytics.stage}. Next: ${supplier.rfpAnalytics.nextMilestone}.`}
          />
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        <ToolSummaryCard
          icon={<FileSearch className="h-4 w-4" />}
          title="ClauseIQ"
          eyebrow="Contract risk"
          value={<RiskPill risk={supplier.riskLevel} />}
          description={`${supplier.highDeviations} high deviations · ${supplier.missingClauses} missing clauses`}
          onOpen={() => onSelectTool("clauseiq")}
        />
        <ToolSummaryCard
          icon={<LineChart className="h-4 w-4" />}
          title="MarketIQ"
          eyebrow="Market signal"
          value={supplier.marketIq.marketPosition}
          description={supplier.marketIq.pricingSignal}
          onOpen={() => onSelectTool("marketiq")}
          disabled={!supplier.marketIq.categories.length}
        />
        <ToolSummaryCard
          icon={<BarChart3 className="h-4 w-4" />}
          title="RFP Analytics"
          eyebrow="Sourcing progress"
          value={`${supplier.rfpAnalytics.evaluationProgress}%`}
          description={`${supplier.rfpAnalytics.stage} · ${supplier.rfpAnalytics.responseStatus}`}
          onOpen={() => onSelectTool("rfp")}
          disabled={!supplier.rfpAnalytics.hasActivity}
        />
      </div>
    </div>
  );
}

function ClauseIqSpace({ supplier, onOpen }: { supplier: SupplierWorkspaceRow; onOpen: () => void }) {
  const contractRows = buildClauseIqContractRows(supplier);

  return (
    <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <ToolSpaceHeader
        icon={<FileSearch className="h-4 w-4" />}
        title="ClauseIQ"
        description="Contract analysis output for this supplier."
        actionLabel="Open ClauseIQ"
        onAction={onOpen}
      />

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <DetailMetric label="Risk" value={<RiskPill risk={supplier.riskLevel} />} />
        <DetailMetric label="Score" value={formatScore(supplier.clauseIqScore)} />
        <DetailMetric label="High deviations" value={supplier.highDeviations} tone="danger" />
        <DetailMetric label="Open actions" value={supplier.openActions} tone="danger" />
        <DetailMetric label="Contracts" value={supplier.contractsAnalysed} />
        <DetailMetric label="Clauses reviewed" value={supplier.clausesReviewed} />
        <DetailMetric label="Missing clauses" value={supplier.missingClauses} tone="warning" />
        <DetailMetric label="Latest analysis" value={supplier.lastUpdatedLabel} />
      </div>

      <div className="rounded-md border border-slate-200">
        <div className="grid grid-cols-[1.5fr_72px_72px_72px_88px] border-b border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-500">
          <span>Contract</span>
          <span className="text-right">High</span>
          <span className="text-right">Missing</span>
          <span className="text-right">Actions</span>
          <span className="text-right">Review</span>
        </div>
        {contractRows.map((contract) => (
          <div
            key={contract.name}
            className="grid grid-cols-[1.5fr_72px_72px_72px_88px] items-center border-b border-slate-100 px-3 py-2 last:border-b-0"
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-slate-950">{contract.name}</p>
              <p className="text-[11px] text-slate-500">{contract.clauses} clauses reviewed</p>
            </div>
            <span className="text-right text-xs font-semibold text-red-700">{contract.high}</span>
            <span className="text-right text-xs font-semibold text-amber-700">{contract.missing}</span>
            <span className="text-right text-xs font-semibold text-red-700">{contract.actions}</span>
            <Button variant="ghost" className="h-7 justify-self-end px-2 text-[11px]" onClick={onOpen}>
              Open
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}

function MarketIqSpace({ supplier, onOpen }: { supplier: SupplierWorkspaceRow; onOpen: () => void }) {
  const market = supplier.marketIq;

  if (!market.categories.length) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <ToolSpaceHeader
          icon={<LineChart className="h-4 w-4" />}
          title="MarketIQ"
          description="Market and category insight for this supplier."
          actionLabel="Open MarketIQ"
          onAction={onOpen}
          disabled
        />
        <EmptyToolState label="No MarketIQ insight yet" />
      </section>
    );
  }

  return (
    <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <ToolSpaceHeader
        icon={<LineChart className="h-4 w-4" />}
        title="MarketIQ"
        description="Market and category insight for this supplier."
        actionLabel="Open MarketIQ"
        onAction={onOpen}
      />

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <DetailMetric label="Market position" value={market.marketPosition} />
        <DetailMetric label="Pricing" value={market.pricingSignal} />
        <DetailMetric label="Variance" value={market.pricingVariance ?? "—"} tone={market.pricingVariance?.startsWith("+") ? "warning" : undefined} />
        <DetailMetric label="Category fit" value={formatScore(market.categoryFitScore)} />
      </div>

      <div className="rounded-md bg-slate-50 p-3">
        <div className="flex items-start gap-2">
          <Target className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-xs font-semibold text-slate-950">{market.marketOutlook}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{market.keyInsight}</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-700">
              <span className="font-semibold">Commercial leverage:</span> {market.recommendedLeverage}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-slate-950">Category history</h4>
        {(market.categoryHistory ?? []).map((category) => (
          <div key={category.category} className="grid grid-cols-[1fr_64px] gap-3 rounded-md border border-slate-200 px-3 py-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-xs font-medium text-slate-950">{category.category}</p>
                <Badge variant="outline" className={cn("h-5 rounded-full px-2 text-[10px]", categorySignalTone(category.signal))}>
                  {category.signal}
                </Badge>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">{category.recentWork}</p>
            </div>
            <div className="text-right text-xs font-semibold text-slate-950">{category.fitScore}/100</div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <SignalList title="Strengths" tone="success" items={market.strengths ?? []} />
        <SignalList title="Risks" tone="warning" items={market.risks ?? []} />
      </div>
    </section>
  );
}

function RfpAnalyticsSpace({ supplier, onOpen }: { supplier: SupplierWorkspaceRow; onOpen: () => void }) {
  const rfp = supplier.rfpAnalytics;

  if (!rfp.hasActivity) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <ToolSpaceHeader
          icon={<BarChart3 className="h-4 w-4" />}
          title="RFP Analytics"
          description="Sourcing progression and evaluation output."
          actionLabel="Open RFP Analytics"
          onAction={onOpen}
          disabled
        />
        <EmptyToolState label="No sourcing activity yet" />
      </section>
    );
  }

  return (
    <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <ToolSpaceHeader
        icon={<BarChart3 className="h-4 w-4" />}
        title="RFP Analytics"
        description="Sourcing progression and evaluation output."
        actionLabel="Open RFP Analytics"
        onAction={onOpen}
      />

      <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-700">Evaluation progress</span>
          <span className="font-semibold text-slate-950">{rfp.evaluationProgress}%</span>
        </div>
        <Progress value={rfp.evaluationProgress} className="mt-2 h-2 bg-slate-100" />
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <DetailMetric label="Stage" value={<StagePill stage={rfp.stage} />} />
        <DetailMetric label="Response" value={rfp.responseStatus} />
        <DetailMetric label="Completeness" value={`${rfp.responseCompleteness ?? 0}%`} />
        <DetailMetric label="Clarifications" value={rfp.clarificationsOpen} tone={rfp.clarificationsOpen ? "warning" : undefined} />
        <DetailMetric label="Technical" value={formatScore(rfp.technicalScore)} />
        <DetailMetric label="Commercial" value={formatScore(rfp.commercialScore)} />
        <DetailMetric label="Next milestone" value={rfp.nextMilestone} />
      </div>

      <div className="rounded-md border border-slate-200 p-3">
        <h4 className="text-xs font-semibold text-slate-950">Sourcing process</h4>
        <div className="mt-3 space-y-3">
          {(rfp.processSteps ?? []).map((step, index, steps) => (
            <div key={`${step.label}-${index}`} className="grid grid-cols-[20px_1fr_auto] gap-2">
              <div className="relative flex justify-center">
                {step.status === "complete" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : step.status === "current" ? (
                  <Clock3 className="h-4 w-4 text-amber-600" />
                ) : (
                  <Circle className="h-4 w-4 text-slate-300" />
                )}
                {index < steps.length - 1 && <span className="absolute top-5 h-4 w-px bg-slate-200" />}
              </div>
              <span className={cn("text-xs", step.status === "pending" ? "text-slate-500" : "font-medium text-slate-950")}>
                {step.label}
              </span>
              <span className="text-[11px] text-slate-500">{step.date ?? "—"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <SignalList title="Evaluation notes" tone="neutral" items={rfp.evaluationNotes ?? []} />
        <SignalList
          title="Open clarifications"
          tone="warning"
          items={rfp.clarifications?.length ? rfp.clarifications : ["No open clarifications"]}
        />
      </div>
    </section>
  );
}

function ToolSpaceHeader({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-2">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">{icon}</div>
        <div>
          <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <Button variant="outline" className="h-8 shrink-0 gap-1.5 text-xs" disabled={disabled} onClick={onAction}>
        <ExternalLink className="h-3.5 w-3.5" />
        {actionLabel}
      </Button>
    </div>
  );
}

function ToolSummaryCard({
  icon,
  title,
  eyebrow,
  value,
  description,
  onOpen,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  eyebrow: string;
  value: React.ReactNode;
  description: string;
  onOpen: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300 hover:bg-slate-50",
        disabled && "cursor-not-allowed opacity-60 hover:border-slate-200 hover:bg-white",
      )}
      disabled={disabled}
      onClick={onOpen}
    >
      <div className="flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-primary">{icon}</div>
        <span className="text-xs font-semibold text-slate-950">{title}</span>
      </div>
      <p className="mt-3 text-[10px] uppercase tracking-wide text-slate-500">{eyebrow}</p>
      <div className="mt-1 min-h-5 text-xs font-semibold text-slate-950">{value}</div>
      <p className="mt-1 text-[11px] leading-snug text-slate-500">{description}</p>
    </button>
  );
}

function DecisionSignal({
  title,
  value,
  detail,
  tone,
}: {
  title: string;
  value: string;
  detail: string;
  tone: "success" | "warning" | "danger" | "neutral";
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "mt-1 h-2 w-2 shrink-0 rounded-full",
            tone === "success" && "bg-emerald-500",
            tone === "warning" && "bg-amber-500",
            tone === "danger" && "bg-red-500",
            tone === "neutral" && "bg-slate-400",
          )}
        />
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-1 text-xs font-semibold text-slate-950">{value}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function SignalList({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "success" | "warning" | "neutral";
  items: string[];
}) {
  const iconClass = tone === "success" ? "text-emerald-600" : tone === "warning" ? "text-amber-600" : "text-slate-400";
  const Icon = tone === "success" ? CheckCircle2 : tone === "warning" ? AlertTriangle : Circle;

  return (
    <div className="rounded-md border border-slate-200 p-3">
      <h4 className="text-xs font-semibold text-slate-950">{title}</h4>
      <div className="mt-2 space-y-2">
        {items.map((item) => (
          <div key={item} className="flex gap-2 text-xs leading-snug text-slate-600">
            <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", iconClass)} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildClauseIqContractRows(supplier: SupplierWorkspaceRow) {
  const names = [
    "Master Service Agreement",
    "Data Processing Addendum",
    "Order Form",
    "Implementation Schedule",
    "Support Terms",
  ];
  const contractCount = Math.max(1, supplier.contractsAnalysed);

  return Array.from({ length: contractCount }, (_, index) => ({
    name: names[index] ?? `Contract ${index + 1}`,
    clauses: distributeCount(supplier.clausesReviewed, contractCount, index),
    high: distributeCount(supplier.highDeviations, contractCount, index),
    missing: distributeCount(supplier.missingClauses, contractCount, index),
    actions: distributeCount(supplier.openActions, contractCount, index),
  }));
}

function distributeCount(total: number, groups: number, index: number): number {
  if (groups <= 0) return total;
  const base = Math.floor(total / groups);
  const remainder = total % groups;
  return base + (index < remainder ? 1 : 0);
}

function categorySignalTone(signal: "Strong" | "Stable" | "Watch") {
  if (signal === "Strong") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (signal === "Watch") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function recommendedAction(supplier: SupplierWorkspaceRow) {
  if (supplier.openActions >= 5 || supplier.riskLevel === "high") {
    return "Prioritise ClauseIQ remediation before this supplier progresses. Contract actions are the main blocker, even if the sourcing response remains viable.";
  }
  if (supplier.rfpAnalytics.clarificationsOpen > 0) {
    return "Keep this supplier moving through sourcing, but resolve the open RFP clarifications before commercial recommendation.";
  }
  if ((supplier.marketIq.categoryFitScore ?? 0) >= 85 && supplier.rfpAnalytics.evaluationProgress >= 80) {
    return "Supplier is a strong candidate. Prepare final commercial challenge points and validate contract exceptions before award.";
  }
  if (!supplier.rfpAnalytics.hasActivity) {
    return "Wait for sourcing response before making a supplier decision. Market and contract signals are directional only until RFP activity starts.";
  }
  return "Continue evaluation and use the tool tabs below to inspect the strongest blocker before the next sourcing milestone.";
}

function SummaryMetric({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "danger" }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className={cn("mt-1 truncate text-sm font-semibold text-slate-950", tone === "danger" && "text-red-700")}>
        {value}
      </p>
    </div>
  );
}

function DetailMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "danger" | "warning";
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <div
        className={cn(
          "mt-1 min-h-5 text-xs font-semibold text-slate-950",
          tone === "danger" && "text-red-700",
          tone === "warning" && "text-amber-700",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function SmallSelect({
  value,
  onValueChange,
  options,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-8 w-[150px] border-slate-300 bg-white text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SupplierAvatar({ shortCode, size = "sm" }: { shortCode: string; size?: "sm" | "lg" }) {
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-full border border-slate-200 bg-slate-50 font-semibold text-slate-700",
        size === "lg" ? "h-10 w-10 text-xs" : "h-7 w-7 text-[10px]",
      )}
    >
      {shortCode}
    </div>
  );
}

function StatusPill({ status }: { status: SupplierWorkspaceStatus }) {
  return (
    <Badge variant="outline" className={cn("h-5 rounded-full px-2 text-[10px]", statusTone[status])}>
      {status}
    </Badge>
  );
}

function RiskPill({ risk }: { risk: ContractRiskLevel }) {
  return (
    <Badge variant="outline" className={cn("h-5 rounded-full px-2 text-[10px] capitalize", riskTone[risk])}>
      {risk}
    </Badge>
  );
}

function StagePill({ stage }: { stage: SourcingStage }) {
  return (
    <Badge variant="outline" className={cn("h-5 rounded-full px-2 text-[10px]", stageTone[stage])}>
      {stage}
    </Badge>
  );
}

function EmptyToolState({ label }: { label: string }) {
  return (
    <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 py-6 text-center text-xs text-slate-500">
      {label}
    </div>
  );
}

function formatScore(score?: number) {
  return score === undefined ? "—" : `${score}/100`;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
