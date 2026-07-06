import { useState, useMemo } from "react";
import { ChevronLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { getInitiative, statusTone } from "@/lib/workflow-v6-data";
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

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-4 h-4" /> Back to {initiative.name}
        </button>

        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Compare suppliers — {initiative.name}</h1>
          <p className="text-sm text-muted-foreground">
            Tick up to {MAX_COMPARE} suppliers to evaluate side-by-side, then drill into evidence.
            <span className="ml-2 text-xs font-mono text-muted-foreground">{selected.size}/{MAX_COMPARE} selected</span>
          </p>
        </header>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[44px]"></TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>ClauseIQ Score</TableHead>
                <TableHead>High issues</TableHead>
                <TableHead>Open requests</TableHead>
                <TableHead>Latest version</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(s.id)}
                      onCheckedChange={() => toggle(s.id)}
                      disabled={!selected.has(s.id) && atCap}
                      aria-label={`Compare ${s.name}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell><Badge variant="outline" className={statusTone(s.status)}>{s.status}</Badge></TableCell>
                  <TableCell className="font-mono">{s.score ?? "—"}</TableCell>
                  <TableCell className="font-mono">{s.high}</TableCell>
                  <TableCell className="font-mono">{s.openRequests}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.latestVersion ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {atCap && (
          <p className="text-xs text-muted-foreground">
            Maximum of {MAX_COMPARE} suppliers reached. Untick one to swap.
          </p>
        )}

        {compared.length >= 2 && (
          <div className="bg-card border border-primary/30 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold">Side-by-side comparison ({compared.length})</h2>
              <p className="text-xs text-muted-foreground">Drill into a supplier or jump to a contract for the underlying clause evidence. Scroll horizontally to see all suppliers.</p>
            </div>
            {/* DI-20: horizontal scroll + sticky first column for portfolio-scale comparisons */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-separate border-spacing-0 min-w-[640px]">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold text-muted-foreground sticky left-0 bg-muted/30 z-10 border-b border-border min-w-[180px]">Metric</th>
                    {compared.map((c) => (
                      <th key={c.id} className="text-left px-4 py-2 font-semibold border-b border-border min-w-[180px]">{c.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <Row label="Status">
                    {compared.map((c) => <Badge key={c.id} variant="outline" className={statusTone(c.status)}>{c.status}</Badge>)}
                  </Row>
                  <Row label="ClauseIQ Score">
                    {compared.map((c) => <span key={c.id} className="font-mono">{c.score ?? "—"}/100</span>)}
                  </Row>
                  <Row label="High-severity issues">
                    {compared.map((c) => <span key={c.id} className="font-mono text-destructive">{c.high}</span>)}
                  </Row>
                  <Row label="Medium-severity issues">
                    {compared.map((c) => <span key={c.id} className="font-mono text-warning">{c.medium}</span>)}
                  </Row>
                  <Row label="Open requests">
                    {compared.map((c) => <span key={c.id} className="font-mono">{c.openRequests}</span>)}
                  </Row>
                  <Row label="Top risk">
                    {compared.map((c) => <span key={c.id} className="text-xs">{c.topRisk}</span>)}
                  </Row>
                  <Row label="Drill in">
                    {compared.map((c) => (
                      <div key={c.id} className="flex flex-col items-start gap-1">
                        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => onOpenSupplier(c.id)}>
                          Open supplier <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                        {c.firstContractId && (
                          <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => onOpenContract(c.id, c.firstContractId!)}>
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
      <td className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase border-t border-border sticky left-0 bg-card z-10">
        {label}
      </td>
      {items.map((child, i) => (
        <td key={i} className="px-4 py-2 align-top border-t border-border">{child}</td>
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
