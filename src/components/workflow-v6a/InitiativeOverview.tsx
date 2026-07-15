import { ChevronLeft } from "@/components/clauseiq-v6a/v6aIcons";
import { Badge } from "@/components/clauseiq-v6a/orbit-ui/badge";
import { Button } from "@/components/clauseiq-v6a/orbit-ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/clauseiq-v6a/orbit-ui/table";
import { getInitiative, statusTone } from "@/lib/workflow-v6-data";

interface Props {
  initiativeId: string;
  onBack: () => void;
  onSelectSupplier: (supplierId: string) => void;
  onCompare?: () => void;
}

export function InitiativeOverview({ initiativeId, onBack, onSelectSupplier, onCompare }: Props) {
  const initiative = getInitiative(initiativeId);
  if (!initiative) return null;

  return (
    <div className="min-h-screen p-orbit-l">
      <div className="max-w-6xl mx-auto space-y-orbit-m">
        <button onClick={onBack} className="flex items-center gap-orbit-xs text-orbit-sm text-orbit-fg-secondary hover:text-orbit-fg transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Initiatives
        </button>

        <header className="space-y-orbit-s flex items-start justify-between gap-orbit-base">
          <div className="space-y-orbit-s">
            <div className="flex items-center gap-orbit-s">
              <h1 className="text-orbit-2xl font-orbit-bold text-orbit-fg tracking-tight">{initiative.name}</h1>
              <Badge variant="outline" className="tabular-nums text-orbit-xs">{initiative.reference}</Badge>
            </div>
            <p className="text-orbit-fg-secondary">{initiative.description}</p>
          </div>
          {onCompare && initiative.suppliers.length >= 2 && (
            <Button variant="outline" size="sm" onClick={onCompare}>Compare suppliers</Button>
          )}
        </header>

        <div className="bg-orbit-card border border-orbit-border rounded-orbit-lg overflow-hidden">
          <div className="px-orbit-m py-orbit-base border-b border-orbit-border">
            <h2 className="text-orbit-sm font-orbit-semibold text-orbit-fg">Suppliers ({initiative.suppliers.length})</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Contracts</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Commercial</TableHead>
                <TableHead>Capability</TableHead>
                <TableHead>ClauseIQ Score</TableHead>
                <TableHead>Last updated</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initiative.suppliers.map((s) => (
                <TableRow key={s.id} className="cursor-pointer" onClick={() => onSelectSupplier(s.id)}>
                  <TableCell className="font-orbit-medium">{s.name}</TableCell>
                  <TableCell className="text-orbit-fg-secondary">{s.contracts.length}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusTone(s.status)}>{s.status}</Badge>
                  </TableCell>
                  <TableCell className="tabular-nums text-orbit-sm">{s.commercialScore != null ? `${s.commercialScore}/100` : "—"}</TableCell>
                  <TableCell className="tabular-nums text-orbit-sm">{s.capabilityScore != null ? `${s.capabilityScore}/100` : "—"}</TableCell>
                  <TableCell className="tabular-nums text-orbit-sm font-orbit-medium">{s.overallScore != null ? `${s.overallScore}/100` : "—"}</TableCell>
                  <TableCell className="text-orbit-fg-secondary text-orbit-sm">{s.lastUpdated}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onSelectSupplier(s.id); }}>
                      View Supplier
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
