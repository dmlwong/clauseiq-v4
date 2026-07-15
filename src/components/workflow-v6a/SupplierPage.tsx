import { ChevronLeft, FileText, Plus, Play, Eye } from "@/components/clauseiq-v6a/v6aIcons";
import { Badge } from "@/components/clauseiq-v6a/orbit-ui/badge";
import { Button } from "@/components/clauseiq-v6a/orbit-ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/clauseiq-v6a/orbit-ui/select";
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
    <div className="min-h-screen bg-orbit-canvas p-orbit-l">
      <div className="max-w-6xl mx-auto space-y-orbit-m">
        <button onClick={onBack} className="flex items-center gap-orbit-xs text-orbit-sm text-orbit-fg-secondary hover:text-orbit-fg">
          <ChevronLeft className="w-4 h-4" /> Back to {initiative.name}
        </button>

        <header className="flex items-start justify-between">
          <div className="space-y-orbit-s">
            <p className="text-orbit-xs font-orbit-semibold text-orbit-fg-secondary uppercase tracking-wider">
              {initiative.name} · {initiative.reference}
            </p>
            <h1 className="text-orbit-2xl font-orbit-bold text-orbit-fg tracking-tight">{supplier.name}</h1>
            <div className="flex items-center gap-orbit-s">
              <Badge variant="outline" className={statusTone(supplier.status)}>{supplier.status}</Badge>
              {supplier.overallScore != null && (
                <span className="text-orbit-sm text-orbit-fg-secondary">ClauseIQ Score <span className="tabular-nums font-orbit-medium text-orbit-fg">{supplier.overallScore}/100</span></span>
              )}
            </div>
          </div>
          <Button variant="outline" className="gap-orbit-s">
            <Plus className="w-4 h-4" /> Upload New Version
          </Button>
        </header>

        <div className="space-y-orbit-s">
          <h2 className="text-orbit-sm font-orbit-semibold text-orbit-fg">Contracts ({supplier.contracts.length})</h2>
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
    <div className="bg-orbit-card border border-orbit-border rounded-orbit-lg p-orbit-base flex items-center justify-between gap-orbit-m">
      <div className="flex items-start gap-orbit-base flex-1">
        <div className="w-10 h-10 rounded-orbit-lg bg-orbit-primary/10 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-orbit-primary" />
        </div>
        <div className="space-y-orbit-xs">
          <div className="flex items-center gap-orbit-s">
            <h3 className="font-orbit-semibold text-orbit-fg">{contract.name}</h3>
            <Badge variant="outline" className="text-orbit-xs">{contract.type}</Badge>
            {latest && <Badge variant="outline" className="tabular-nums text-orbit-xs">{latest.version}</Badge>}
          </div>
          <div className="flex items-center gap-orbit-s text-orbit-sm">
            <Select value={status} onValueChange={(v) => onChangeStatus(v as ContractStatus)}>
              <SelectTrigger className="h-7 w-[160px] text-orbit-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTRACT_STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s} className="text-orbit-xs">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {latest ? (
              <span className="text-orbit-fg-secondary">
                {contract.versions.length} version{contract.versions.length > 1 ? "s" : ""} · ClauseIQ Score{" "}
                <span className="tabular-nums text-orbit-fg">{latest.overallScore}/100</span>
              </span>
            ) : (
              <span className="text-orbit-fg-secondary">No analysis yet</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-orbit-s">
        {latest && (
          <Button variant="outline" size="sm" onClick={onView} className="gap-orbit-xs">
            <Eye className="w-4 h-4" /> View Results
          </Button>
        )}
        <Button size="sm" onClick={onRun} className="gap-orbit-xs">
          <Play className="w-4 h-4" /> Run ClauseIQ
        </Button>
      </div>
    </div>
  );
}
