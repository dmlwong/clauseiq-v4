import { Building2, ArrowRight, FileText } from "lucide-react";
import { Badge } from "@/components/clauseiq-v5/orbit-ui/badge";
import { Button } from "@/components/clauseiq-v5/orbit-ui/button";
import { INITIATIVES, statusTone } from "@/lib/workflow-data";

interface Props {
  onSelect: (initiativeId: string) => void;
}

export function InitiativesList({ onSelect }: Props) {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Connected Platform</p>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Initiatives</h1>
            <p className="text-muted-foreground">Select an initiative to view its suppliers and contracts.</p>
          </div>
          <Button variant="outline" asChild>
            <a href="/">Prototype Timeline</a>
          </Button>
        </header>

        <div className="grid gap-4">
          {INITIATIVES.map((init) => {
            const supplierCount = init.suppliers.length;
            const contractCount = init.suppliers.reduce((n, s) => n + s.contracts.length, 0);
            const inNegotiation = init.suppliers.filter((s) => s.status === "In Negotiation").length;
            return (
              <button
                key={init.id}
                onClick={() => onSelect(init.id)}
                className="group text-left bg-card border border-border rounded-xl p-6 hover:border-primary/40 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-foreground">{init.name}</h2>
                      <Badge variant="outline" className="font-mono text-xs">{init.reference}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground max-w-2xl">{init.description}</p>
                    <div className="flex gap-6 text-sm pt-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Building2 className="w-4 h-4" /> {supplierCount} suppliers
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <FileText className="w-4 h-4" /> {contractCount} contracts
                      </div>
                      {inNegotiation > 0 && (
                        <Badge className={statusTone("In Negotiation")} variant="outline">
                          {inNegotiation} in negotiation
                        </Badge>
                      )}
                    </div>
                  </div>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
