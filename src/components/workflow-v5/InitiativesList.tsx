import { Building2, ArrowRight, FileText } from "lucide-react";
import { Badge } from "@/components/clauseiq-v5/orbit-ui/badge";
import { Button } from "@/components/clauseiq-v5/orbit-ui/button";
import { INITIATIVES, statusTone } from "@/lib/workflow-data";

interface Props {
  onSelect: (initiativeId: string) => void;
}

export function InitiativesList({ onSelect }: Props) {
  return (
    <div className="min-h-screen p-orbit-l">
      <div className="max-w-6xl mx-auto space-y-orbit-l">
        <header className="flex items-end justify-between gap-orbit-base">
          <div className="space-y-orbit-s">
            <p className="text-xs v5-orbit-weight-semibold text-muted-foreground uppercase tracking-wider">Connected Platform</p>
            <h1 className="v5-orbit-heading-1">Initiatives</h1>
            <p className="text-muted-foreground">Select an initiative to view its suppliers and contracts.</p>
          </div>
          <Button variant="outline" asChild>
            <a href="/">Prototype Timeline</a>
          </Button>
        </header>

        <div className="grid gap-orbit-base">
          {INITIATIVES.map((init) => {
            const supplierCount = init.suppliers.length;
            const contractCount = init.suppliers.reduce((n, s) => n + s.contracts.length, 0);
            const inNegotiation = init.suppliers.filter((s) => s.status === "In Negotiation").length;
            return (
              <button
                key={init.id}
                onClick={() => onSelect(init.id)}
                className="group text-left bg-card border border-border rounded-xl p-orbit-m hover:border-primary/40 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-orbit-m">
                  <div className="space-y-orbit-base flex-1">
                    <div className="flex items-center gap-orbit-s">
                      <h2 className="v5-orbit-heading-4">{init.name}</h2>
                      <Badge variant="outline" className="tabular-nums text-xs">{init.reference}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground max-w-2xl">{init.description}</p>
                    <div className="flex gap-orbit-m text-sm pt-orbit-xs">
                      <div className="flex items-center gap-orbit-xs text-muted-foreground">
                        <Building2 className="w-4 h-4" /> {supplierCount} suppliers
                      </div>
                      <div className="flex items-center gap-orbit-xs text-muted-foreground">
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
