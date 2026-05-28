import { ChevronLeft } from "lucide-react";
import { Table as OrbitTable } from "@orbit";
import { Badge } from "@/components/clauseiq-v5/orbit-ui/badge";
import { Button } from "@/components/clauseiq-v5/orbit-ui/button";
import { getInitiative, statusTone } from "@/lib/workflow-data";

interface Props {
  initiativeId: string;
  onBack: () => void;
  onSelectSupplier: (supplierId: string) => void;
  onCompare?: () => void;
}

export function InitiativeOverview({ initiativeId, onBack, onSelectSupplier, onCompare }: Props) {
  const initiative = getInitiative(initiativeId);
  if (!initiative) return null;

  const supplierColumns = [
    {
      id: "supplier",
      header: "Supplier",
      render: (supplier: typeof initiative.suppliers[number]) => <span className="font-medium">{supplier.name}</span>,
    },
    {
      id: "contracts",
      header: "Contracts",
      render: (supplier: typeof initiative.suppliers[number]) => supplier.contracts.length,
    },
    {
      id: "status",
      header: "Status",
      render: (supplier: typeof initiative.suppliers[number]) => (
        <Badge variant="outline" className={statusTone(supplier.status)}>{supplier.status}</Badge>
      ),
    },
    {
      id: "commercial",
      header: "Commercial",
      render: (supplier: typeof initiative.suppliers[number]) => (
        <span className="tabular-nums text-sm">{supplier.commercialScore != null ? `${supplier.commercialScore}/100` : "—"}</span>
      ),
    },
    {
      id: "capability",
      header: "Capability",
      render: (supplier: typeof initiative.suppliers[number]) => (
        <span className="tabular-nums text-sm">{supplier.capabilityScore != null ? `${supplier.capabilityScore}/100` : "—"}</span>
      ),
    },
    {
      id: "score",
      header: "ClauseIQ Score",
      render: (supplier: typeof initiative.suppliers[number]) => (
        <span className="tabular-nums text-sm font-medium">{supplier.overallScore != null ? `${supplier.overallScore}/100` : "—"}</span>
      ),
    },
    {
      id: "updated",
      header: "Last updated",
      render: (supplier: typeof initiative.suppliers[number]) => <span className="text-sm text-muted-foreground">{supplier.lastUpdated}</span>,
    },
    {
      id: "action",
      header: "Action",
      render: (supplier: typeof initiative.suppliers[number]) => (
        <Button
          variant="outline"
          onClick={(event) => {
            event.stopPropagation();
            onSelectSupplier(supplier.id);
          }}
        >
          View Supplier
        </Button>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background p-orbit-l">
      <div className="max-w-6xl mx-auto space-y-orbit-m">
        <button onClick={onBack} className="flex items-center gap-orbit-xs text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Initiatives
        </button>

        <header className="space-y-orbit-s flex items-start justify-between gap-orbit-base">
          <div className="space-y-orbit-s">
            <div className="flex items-center gap-orbit-s">
              <h1 className="v5-orbit-heading-2">{initiative.name}</h1>
              <Badge variant="outline" className="tabular-nums text-xs">{initiative.reference}</Badge>
            </div>
            <p className="text-muted-foreground">{initiative.description}</p>
          </div>
          {onCompare && initiative.suppliers.length >= 2 && (
            <Button variant="outline" onClick={onCompare}>Compare suppliers</Button>
          )}
        </header>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-orbit-m py-orbit-base border-b border-border">
            <h2 className="v5-orbit-heading-strong text-foreground">Suppliers ({initiative.suppliers.length})</h2>
          </div>
          <OrbitTable
            ariaLabel={`Suppliers for ${initiative.name}`}
            columns={supplierColumns}
            rows={initiative.suppliers}
            getRowKey={(supplier) => supplier.id}
            onRowSelect={(supplier) => onSelectSupplier(supplier.id)}
            density="Compact"
          />
        </div>
      </div>
    </div>
  );
}
