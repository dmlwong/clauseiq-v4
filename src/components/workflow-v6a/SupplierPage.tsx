import { ChevronLeft, FileText, Plus, Play, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getInitiative, getSupplier, statusTone, type Contract } from "@/lib/workflow-v6-data";
import type { ContractStatus } from "@/lib/workflow-types";
import { CONTRACT_STATUS_OPTIONS } from "@/hooks/use-contract-status-v6";

interface Props {
  initiativeId: string;
  supplierId: string;
  onBack: () => void;
  onRunClauseIQ: (contractId: string) => void;
  onViewResults: (contractId: string) => void;
  /** Live contract status (overlay) lookup + setter, owned by the page above. */
  getContractStatus: (contractId: string, fallback: ContractStatus) => ContractStatus;
  setContractStatus: (contractId: string, status: ContractStatus) => void;
}

export function SupplierPage({
  initiativeId, supplierId, onBack, onRunClauseIQ, onViewResults,
  getContractStatus, setContractStatus,
}: Props) {
  const initiative = getInitiative(initiativeId);
  const supplier = getSupplier(initiativeId, supplierId);
  if (!initiative || !supplier) return null;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-4 h-4" /> Back to {initiative.name}
        </button>

        <header className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {initiative.name} · {initiative.reference}
            </p>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{supplier.name}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={statusTone(supplier.status)}>{supplier.status}</Badge>
              {supplier.overallScore != null && (
                <span className="text-sm text-muted-foreground">ClauseIQ Score <span className="font-mono font-medium text-foreground">{supplier.overallScore}/100</span></span>
              )}
            </div>
          </div>
          <Button variant="outline" className="gap-2">
            <Plus className="w-4 h-4" /> Upload New Version
          </Button>
        </header>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Contracts ({supplier.contracts.length})</h2>
          {supplier.contracts.map((c) => (
            <ContractCard
              key={c.id}
              contract={c}
              status={getContractStatus(c.id, c.status)}
              onChangeStatus={(s) => setContractStatus(c.id, s)}
              onRun={() => onRunClauseIQ(c.id)}
              onView={() => onViewResults(c.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ContractCard({
  contract, status, onChangeStatus, onRun, onView,
}: {
  contract: Contract;
  status: ContractStatus;
  onChangeStatus: (s: ContractStatus) => void;
  onRun: () => void;
  onView: () => void;
}) {
  const latest = contract.versions.at(-1);
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between gap-6">
      <div className="flex items-start gap-4 flex-1">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{contract.name}</h3>
            <Badge variant="outline" className="text-xs">{contract.type}</Badge>
            {latest && <Badge variant="outline" className="font-mono text-xs">{latest.version}</Badge>}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Select value={status} onValueChange={(v) => onChangeStatus(v as ContractStatus)}>
              <SelectTrigger className="h-7 w-[160px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTRACT_STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {latest ? (
              <span className="text-muted-foreground">
                {contract.versions.length} version{contract.versions.length > 1 ? "s" : ""} · ClauseIQ Score{" "}
                <span className="font-mono text-foreground">{latest.overallScore}/100</span>
              </span>
            ) : (
              <span className="text-muted-foreground">No analysis yet</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        {latest && (
          <Button variant="outline" size="sm" onClick={onView} className="gap-1.5">
            <Eye className="w-4 h-4" /> View Results
          </Button>
        )}
        <Button size="sm" onClick={onRun} className="gap-1.5">
          <Play className="w-4 h-4" /> Run ClauseIQ
        </Button>
      </div>
    </div>
  );
}
