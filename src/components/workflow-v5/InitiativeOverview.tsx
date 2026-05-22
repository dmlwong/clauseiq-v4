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
        <span className="font-mono text-sm">{supplier.commercialScore != null ? `${supplier.commercialScore}/100` : "—"}</span>
      ),
    },
    {
      id: "capability",
      header: "Capability",
      render: (supplier: typeof initiative.suppliers[number]) => (
        <span className="font-mono text-sm">{supplier.capabilityScore != null ? `${supplier.capabilityScore}/100` : "—"}</span>
      ),
    },
    {
      id: "score",
      header: "ClauseIQ Score",
      render: (supplier: typeof initiative.suppliers[number]) => (
        <span className="font-mono text-sm font-medium">{supplier.overallScore != null ? `${supplier.overallScore}/100` : "—"}</span>
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
          size="sm"
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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Initiatives
        </button>

        <header className="space-y-2 flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">{initiative.name}</h1>
              <Badge variant="outline" className="font-mono text-xs">{initiative.reference}</Badge>
            </div>
            <p className="text-muted-foreground">{initiative.description}</p>
          </div>
          {onCompare && initiative.suppliers.length >= 2 && (
            <Button variant="outline" size="sm" onClick={onCompare}>Compare suppliers</Button>
          )}
        </header>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Suppliers ({initiative.suppliers.length})</h2>
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
