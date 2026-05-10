import { AlertTriangle, ExternalLink, FileSearch, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type {
  ContractIntelligenceSummary,
  ContractIntelligenceSupplier,
  ContractRiskLevel,
  SupplierOverviewStatus,
} from "@/data/mock-contract-intelligence";

interface Props {
  intelligence?: ContractIntelligenceSummary;
  onOpenClauseIQ: () => void;
  onRunAnalysisAgain: () => void;
  onReviewSupplier: (supplier: ContractIntelligenceSupplier) => void;
}

const riskTone: Record<ContractRiskLevel, string> = {
  high: "border-red-200 bg-red-50 text-red-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  clean: "border-slate-200 bg-slate-50 text-slate-600",
};

const statusTone: Record<SupplierOverviewStatus, string> = {
  "In Negotiation": "border-blue-200 bg-blue-50 text-blue-800",
  "In Review": "border-amber-200 bg-amber-50 text-amber-800",
  "Not Reviewed": "border-slate-200 bg-slate-100 text-slate-600",
  Finalised: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export function ContractIntelligenceCard({
  intelligence,
  onOpenClauseIQ,
  onRunAnalysisAgain,
  onReviewSupplier,
}: Props) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-primary">
              <FileSearch className="h-3.5 w-3.5" />
            </div>
            <h2 className="text-sm font-semibold text-slate-950">Supplier Overview</h2>
            <Badge variant="outline" className="h-5 rounded-full bg-primary/10 px-2 text-[10px] text-primary">
              ClauseIQ
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500">Supplier contract risk surfaced from ClauseIQ analysis.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-8 gap-1.5 border-slate-400 bg-white text-xs"
            onClick={onOpenClauseIQ}
            disabled={!intelligence}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open ClauseIQ
          </Button>
          <Button className="h-8 gap-1.5 text-xs" onClick={onRunAnalysisAgain}>
            <RotateCcw className="h-3.5 w-3.5" />
            Run analysis again
          </Button>
        </div>
      </div>

      {!intelligence ? (
        <div className="mt-4 rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
          <div className="mx-auto grid h-8 w-8 place-items-center rounded-full bg-white text-slate-500">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <p className="mt-2 text-sm font-medium text-slate-950">No contract analysis yet</p>
          <p className="mx-auto mt-1 max-w-[360px] text-xs text-slate-500">
            Run ClauseIQ to surface supplier contract risk and open actions for this initiative.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-2 sm:grid-cols-4 lg:grid-cols-8">
            <SummaryCell label="Risk" value={<RiskPill risk={intelligence.riskLevel} />} />
            <SummaryCell label="Suppliers" value={intelligence.suppliersAnalysed} />
            <SummaryCell label="Contracts" value={intelligence.contractsReviewed} />
            <SummaryCell label="Clauses" value={intelligence.clausesReviewed} />
            <SummaryCell label="High" value={intelligence.highDeviations} emphasis="danger" />
            <SummaryCell label="Missing" value={intelligence.missingClauses} emphasis="warning" />
            <SummaryCell label="Actions" value={intelligence.openActions} emphasis="danger" />
            <SummaryCell label="Latest" value={intelligence.latestAnalysisLabel} />
          </div>

          <div className="mt-4 overflow-x-auto rounded-md border border-slate-200">
            <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-950">
              Suppliers ({intelligence.suppliers.length})
            </div>
            <Table className="min-w-[940px]">
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="h-8 text-[11px]">Supplier</TableHead>
                  <TableHead className="h-8 text-right text-[11px]">Contracts</TableHead>
                  <TableHead className="h-8 text-[11px]">Status</TableHead>
                  <TableHead className="h-8 text-right text-[11px]">Commercial</TableHead>
                  <TableHead className="h-8 text-right text-[11px]">Capability</TableHead>
                  <TableHead className="h-8 text-right text-[11px]">ClauseIQ Score</TableHead>
                  <TableHead className="h-8 text-[11px]">Last updated</TableHead>
                  <TableHead className="h-8 text-right text-[11px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {intelligence.suppliers.map((supplier) => (
                  <TableRow
                    key={supplier.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => onReviewSupplier(supplier)}
                  >
                    <TableCell className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="grid h-7 w-7 place-items-center rounded-full border border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-700">
                          {supplier.shortCode}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-xs font-medium text-slate-950">{supplier.name}</div>
                          <div className="text-[11px] text-slate-500">{supplier.clausesReviewed} clauses</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-2 text-right text-xs">{supplier.contractsAnalysed}</TableCell>
                    <TableCell className="py-2"><StatusPill status={supplier.status} /></TableCell>
                    <TableCell className="py-2 text-right text-xs tabular-nums">{formatScore(supplier.commercialScore)}</TableCell>
                    <TableCell className="py-2 text-right text-xs tabular-nums">{formatScore(supplier.capabilityScore)}</TableCell>
                    <TableCell className="py-2 text-right text-xs font-semibold tabular-nums text-slate-950">
                      {formatScore(supplier.clauseIqScore)}
                    </TableCell>
                    <TableCell className="py-2 text-xs text-slate-600">{supplier.lastUpdatedLabel}</TableCell>
                    <TableCell className="py-2 text-right">
                      <Button
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        onClick={(event) => {
                          event.stopPropagation();
                          onReviewSupplier(supplier);
                        }}
                      >
                        View Supplier
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </section>
  );
}

function StatusPill({ status }: { status: SupplierOverviewStatus }) {
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

function SummaryCell({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: ReactNode;
  emphasis?: "danger" | "warning";
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2">
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div
        className={cn(
          "mt-1 truncate text-xs font-semibold text-slate-950",
          emphasis === "danger" && "text-red-700",
          emphasis === "warning" && "text-amber-700",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function formatScore(score?: number) {
  return score === undefined ? "—" : `${score}/100`;
}
