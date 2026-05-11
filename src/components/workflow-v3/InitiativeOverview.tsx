import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">{s.contracts.length}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusTone(s.status)}>{s.status}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{s.commercialScore != null ? `${s.commercialScore}/100` : "—"}</TableCell>
                  <TableCell className="font-mono text-sm">{s.capabilityScore != null ? `${s.capabilityScore}/100` : "—"}</TableCell>
                  <TableCell className="font-mono text-sm font-medium">{s.overallScore != null ? `${s.overallScore}/100` : "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{s.lastUpdated}</TableCell>
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
