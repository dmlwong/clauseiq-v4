import { useState, useMemo } from "react";
import { ChevronLeft, ArrowRight } from "@/components/clauseiq-v6a/v6aIcons";
import { Button } from "@/components/clauseiq-v6a/orbit-ui/button";
import { Badge } from "@/components/clauseiq-v6a/orbit-ui/badge";
import { Checkbox } from "@/components/clauseiq-v6a/orbit-ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/clauseiq-v6a/orbit-ui/table";
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
    <div className="min-h-screen bg-orbit-canvas p-orbit-l">
      <div className="max-w-6xl mx-auto space-y-orbit-m">
        <button onClick={onBack} className="flex items-center gap-orbit-xs text-orbit-sm text-orbit-fg-secondary hover:text-orbit-fg">
          <ChevronLeft className="w-4 h-4" /> Back to {initiative.name}
        </button>

        <header className="space-y-orbit-xs">
          <h1 className="text-orbit-2xl font-orbit-bold text-orbit-fg tracking-tight">Compare suppliers — {initiative.name}</h1>
          <p className="text-orbit-sm text-orbit-fg-secondary">
            Tick up to {MAX_COMPARE} suppliers to evaluate side-by-side, then drill into evidence.
            <span className="ml-orbit-s text-orbit-xs tabular-nums text-orbit-fg-secondary">{selected.size}/{MAX_COMPARE} selected</span>
          </p>
        </header>

        <div className="bg-orbit-card border border-orbit-border rounded-orbit-lg overflow-hidden">
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
                  <TableCell className="font-orbit-medium">{s.name}</TableCell>
                  <TableCell><Badge variant="outline" className={statusTone(s.status)}>{s.status}</Badge></TableCell>
                  <TableCell className="tabular-nums">{s.score ?? "—"}</TableCell>
                  <TableCell className="tabular-nums">{s.high}</TableCell>
                  <TableCell className="tabular-nums">{s.openRequests}</TableCell>
                  <TableCell className="text-orbit-sm text-orbit-fg-secondary">{s.latestVersion ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {atCap && (
          <p className="text-orbit-xs text-orbit-fg-secondary">
            Maximum of {MAX_COMPARE} suppliers reached. Untick one to swap.
          </p>
        )}

        {compared.length >= 2 && (
          <div className="bg-orbit-card border border-orbit-primary/30 rounded-orbit-lg overflow-hidden">
            <div className="px-orbit-base py-orbit-base border-b border-orbit-border">
              <h2 className="text-orbit-sm font-orbit-semibold">Side-by-side comparison ({compared.length})</h2>
              <p className="text-orbit-xs text-orbit-fg-secondary">Drill into a supplier or jump to a contract for the underlying clause evidence. Scroll horizontally to see all suppliers.</p>
            </div>
            {/* DI-20: horizontal scroll + sticky first column for portfolio-scale comparisons */}
            <div className="overflow-x-auto">
              <table className="w-full text-orbit-sm border-separate border-spacing-0 min-w-[640px]">
                <thead className="bg-orbit-surface/30">
                  <tr>
                    <th className="text-left px-orbit-base py-orbit-s font-orbit-semibold text-orbit-fg-secondary sticky left-0 bg-orbit-surface/30 z-10 border-b border-orbit-border min-w-[180px]">Metric</th>
                    {compared.map((c) => (
                      <th key={c.id} className="text-left px-orbit-base py-orbit-s font-orbit-semibold border-b border-orbit-border min-w-[180px]">{c.name}</th>
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
                    {compared.map((c) => <span key={c.id} className="tabular-nums text-orbit-destructive">{c.high}</span>)}
                  </Row>
                  <Row label="Medium-severity issues">
                    {compared.map((c) => <span key={c.id} className="tabular-nums text-orbit-warning">{c.medium}</span>)}
                  </Row>
                  <Row label="Open requests">
                    {compared.map((c) => <span key={c.id} className="tabular-nums">{c.openRequests}</span>)}
                  </Row>
                  <Row label="Top risk">
                    {compared.map((c) => <span key={c.id} className="text-orbit-xs">{c.topRisk}</span>)}
                  </Row>
                  <Row label="Drill in">
                    {compared.map((c) => (
                      <div key={c.id} className="flex flex-col items-start gap-orbit-xs">
                        <Button size="sm" variant="outline" className="h-7 text-orbit-xs" onClick={() => onOpenSupplier(c.id)}>
                          Open supplier <ArrowRight className="w-3 h-3 ml-orbit-xs" />
                        </Button>
                        {c.firstContractId && (
                          <Button size="sm" variant="ghost" className="h-7 text-orbit-xs" onClick={() => onOpenContract(c.id, c.firstContractId!)}>
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
      <td className="px-orbit-base py-orbit-s text-orbit-xs font-orbit-semibold text-orbit-fg-secondary uppercase border-t border-orbit-border sticky left-0 bg-orbit-card z-10">
        {label}
      </td>
      {items.map((child, i) => (
        <td key={i} className="px-orbit-base py-orbit-s align-top border-t border-orbit-border">{child}</td>
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
