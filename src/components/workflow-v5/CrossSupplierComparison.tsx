import { useState, useMemo } from "react";
import { ChevronLeft, ArrowRight } from "lucide-react";
import { Table as OrbitTable } from "@orbit";
import { Button } from "@/components/clauseiq-v5/orbit-ui/button";
import { Badge } from "@/components/clauseiq-v5/orbit-ui/badge";
import { Checkbox } from "@/components/clauseiq-v5/orbit-ui/checkbox";
import { getInitiative, statusTone } from "@/lib/workflow-data";
import type { Supplier } from "@/lib/workflow-types";

interface Props {
  initiativeId: string;
  onBack: () => void;
  onOpenSupplier: (supplierId: string) => void;
  onOpenContract: (supplierId: string, contractId: string) => void;
}

/**
 * Cross-supplier comparison entry point (TASK-09 / DI-10).
 * Lets users tick multiple suppliers in an initiative and compare key risks,
 * scores and negotiation status side-by-side, then drill into evidence.
 */
// R3 DI-20: lift compare cap from 3 → 5 to support portfolio-level review.
const MAX_COMPARE = 5;

export function CrossSupplierComparison({ initiativeId, onBack, onOpenSupplier, onOpenContract }: Props) {
  const initiative = getInitiative(initiativeId);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const stats = useMemo(() => {
    if (!initiative) return [];
    return initiative.suppliers.map((s) => deriveSupplierStats(s));
  }, [initiative]);

  if (!initiative) return null;

  const compared = stats.filter((s) => selected.has(s.id));
  const atCap = selected.size >= MAX_COMPARE;
  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < MAX_COMPARE) {
        next.add(id);
      }
      return next;
    });
  };
  const supplierColumns = [
    {
      id: "select",
      header: "",
      width: "44px",
      render: (supplier: ReturnType<typeof deriveSupplierStats>) => (
        <Checkbox
          checked={selected.has(supplier.id)}
          onCheckedChange={() => toggle(supplier.id)}
          disabled={!selected.has(supplier.id) && atCap}
          aria-label={`Compare ${supplier.name}`}
        />
      ),
    },
    {
      id: "supplier",
      header: "Supplier",
      render: (supplier: ReturnType<typeof deriveSupplierStats>) => <span className="v5-orbit-weight-medium">{supplier.name}</span>,
    },
    {
      id: "status",
      header: "Status",
      render: (supplier: ReturnType<typeof deriveSupplierStats>) => (
        <Badge variant="outline" className={statusTone(supplier.status)}>{supplier.status}</Badge>
      ),
    },
    {
      id: "score",
      header: "ClauseIQ Score",
      render: (supplier: ReturnType<typeof deriveSupplierStats>) => <span className="tabular-nums">{supplier.score ?? "—"}</span>,
    },
    {
      id: "high",
      header: "High issues",
      render: (supplier: ReturnType<typeof deriveSupplierStats>) => <span className="tabular-nums">{supplier.high}</span>,
    },
    {
      id: "requests",
      header: "Open requests",
      render: (supplier: ReturnType<typeof deriveSupplierStats>) => <span className="tabular-nums">{supplier.openRequests}</span>,
    },
    {
      id: "latest",
      header: "Latest version",
      render: (supplier: ReturnType<typeof deriveSupplierStats>) => <span className="text-sm text-muted-foreground">{supplier.latestVersion ?? "—"}</span>,
    },
  ];

  return (
    <div className="min-h-screen p-orbit-l">
      <div className="max-w-6xl mx-auto space-y-orbit-m">
        <button onClick={onBack} className="flex items-center gap-orbit-xs text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-4 h-4" /> Back to {initiative.name}
        </button>

        <header className="space-y-orbit-xs">
          <h1 className="v5-orbit-heading-2">Compare suppliers — {initiative.name}</h1>
          <p className="text-sm text-muted-foreground">
            Tick up to {MAX_COMPARE} suppliers to evaluate side-by-side, then drill into evidence.
            <span className="ml-orbit-s text-xs tabular-nums text-muted-foreground">{selected.size}/{MAX_COMPARE} selected</span>
          </p>
        </header>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <OrbitTable
            ariaLabel={`Suppliers available to compare for ${initiative.name}`}
            columns={supplierColumns}
            rows={stats}
            getRowKey={(supplier) => supplier.id}
            density="Compact"
          />
        </div>

        {atCap && (
          <p className="text-xs text-muted-foreground">
            Maximum of {MAX_COMPARE} suppliers reached. Untick one to swap.
          </p>
        )}

        {compared.length >= 2 && (
          <div className="bg-card border border-primary/30 rounded-xl overflow-hidden">
            <div className="px-orbit-m py-orbit-base border-b border-border">
              <h2 className="v5-orbit-heading-strong">Side-by-side comparison ({compared.length})</h2>
              <p className="text-xs text-muted-foreground">Drill into a supplier or jump to a contract for the underlying clause evidence. Scroll horizontally to see all suppliers.</p>
            </div>
            {/* DI-20: horizontal scroll + sticky first column for portfolio-scale comparisons */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-separate border-spacing-0 min-w-[640px]">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="v5-orbit-heading-strong sticky left-0 z-10 min-w-[180px] border-b border-border bg-muted/30 px-orbit-base py-orbit-s text-left text-muted-foreground">Metric</th>
                    {compared.map((c) => (
                      <th key={c.id} className="v5-orbit-heading-strong min-w-[180px] border-b border-border px-orbit-base py-orbit-s text-left">{c.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <Row label="Status">
                    {compared.map((c) => <Badge key={c.id} variant="outline" className={statusTone(c.status)}>{c.status}</Badge>)}
                  </Row>
                  <Row label="ClauseIQ Score">
                    {compared.map((c) => <span key={c.id} className="tabular-nums">{c.score ?? "—"}/100</span>)}
                  </Row>
                  <Row label="High-severity issues">
                    {compared.map((c) => <span key={c.id} className="tabular-nums text-destructive">{c.high}</span>)}
                  </Row>
                  <Row label="Medium-severity issues">
                    {compared.map((c) => <span key={c.id} className="tabular-nums text-warning">{c.medium}</span>)}
                  </Row>
                  <Row label="Open requests">
                    {compared.map((c) => <span key={c.id} className="tabular-nums">{c.openRequests}</span>)}
                  </Row>
                  <Row label="Top risk">
                    {compared.map((c) => <span key={c.id} className="text-xs">{c.topRisk}</span>)}
                  </Row>
                  <Row label="Drill in">
                    {compared.map((c) => (
                      <div key={c.id} className="flex flex-col items-start gap-orbit-xs">
                        <Button variant="outline" className="h-7 text-[11px]" onClick={() => onOpenSupplier(c.id)}>
                          Open supplier <ArrowRight className="w-3 h-3 ml-orbit-xs" />
                        </Button>
                        {c.firstContractId && (
                          <Button variant="ghost" className="h-7 text-[11px]" onClick={() => onOpenContract(c.id, c.firstContractId!)}>
                            Open evidence
                          </Button>
                        )}
                      </div>
                    ))}
                  </Row>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <tr>
      <td className="px-orbit-base py-orbit-s text-xs v5-orbit-weight-semibold text-muted-foreground uppercase border-t border-border sticky left-0 bg-card z-10">
        {label}
      </td>
      {items.map((child, i) => (
        <td key={i} className="px-orbit-base py-orbit-s align-top border-t border-border">{child}</td>
      ))}
    </tr>
  );
}

function deriveSupplierStats(s: Supplier) {
  const latest = s.contracts.flatMap((c) => c.versions).at(-1);
  const allClauses = latest?.clauses ?? [];
  const high = allClauses.filter((c) => c.severity === "high" && !c.resolved).length;
  const medium = allClauses.filter((c) => c.severity === "medium" && !c.resolved).length;
  const topRisk = allClauses
    .filter((c) => c.severity === "high")
    .map((c) => c.title)[0] ?? "No high-severity clauses";
  return {
    id: s.id,
    name: s.name,
    status: s.status,
    score: s.overallScore,
    high,
    medium,
    openRequests: high + Math.max(0, medium - 2), // heuristic for demo
    latestVersion: latest?.version,
    firstContractId: s.contracts[0]?.id,
    topRisk,
  };
}
