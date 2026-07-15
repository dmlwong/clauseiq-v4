import { Building2, ArrowRight, FileText } from "@/components/clauseiq-v6a/v6aIcons";
import { Badge } from "@/components/clauseiq-v6a/orbit-ui/badge";
import { Button } from "@/components/clauseiq-v6a/orbit-ui/button";
import { INITIATIVES, statusTone } from "@/lib/workflow-v6-data";

interface Props {
  onSelect: (initiativeId: string) => void;
}

export function InitiativesList({ onSelect }: Props) {
  return (
    <div className="min-h-screen bg-orbit-canvas p-orbit-l">
      <div className="max-w-6xl mx-auto space-y-orbit-l">
        <header className="flex items-end justify-between gap-orbit-base">
          <div className="space-y-orbit-s">
            <p className="text-orbit-xs font-orbit-semibold text-orbit-fg-secondary uppercase tracking-wider">Connected Platform</p>
            <h1 className="text-orbit-3xl font-orbit-bold text-orbit-fg tracking-tight">Initiatives</h1>
            <p className="text-orbit-fg-secondary">Select an initiative to view its suppliers and contracts.</p>
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
              <div
                key={init.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(init.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(init.id);
                  }
                }}
                className="group cursor-pointer text-left bg-orbit-card border border-orbit-border rounded-orbit-lg p-orbit-m hover:border-orbit-primary/40 hover:shadow-orbit-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orbit-primary"
              >
                <div className="flex items-start justify-between gap-orbit-m">
                  <div className="space-y-orbit-s flex-1">
                    <div className="flex items-center gap-orbit-s">
                      <h2 className="text-orbit-lg font-orbit-semibold text-orbit-fg">{init.name}</h2>
                      <Badge variant="outline" className="tabular-nums text-orbit-xs">{init.reference}</Badge>
                    </div>
                    <p className="text-orbit-sm text-orbit-fg-secondary max-w-2xl">{init.description}</p>
                    <div className="flex gap-orbit-m text-orbit-sm pt-orbit-xs">
                      <div className="flex items-center gap-orbit-xs text-orbit-fg-secondary">
                        <Building2 className="w-4 h-4" /> {supplierCount} suppliers
                      </div>
                      <div className="flex items-center gap-orbit-xs text-orbit-fg-secondary">
                        <FileText className="w-4 h-4" /> {contractCount} contracts
                      </div>
                      {inNegotiation > 0 && (
                        <Badge className={statusTone("In Negotiation")} variant="outline">
                          {inNegotiation} in negotiation
                        </Badge>
                      )}
                    </div>
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-orbit-md text-orbit-fg-secondary transition-colors group-hover:bg-orbit-primary group-hover:text-orbit-primary-foreground">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
