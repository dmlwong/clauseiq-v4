import { useMemo, useState } from "react";
import { V2Shell } from "@/components/clauseiq-v2/V2Shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Gauge,
  Lightbulb,
  Minus,
  TrendingUp,
  Users,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { TASKS, PARTICIPANTS as V2_PARTICIPANTS, type Participant } from "@/lib/usability-study-data";
import {
  PARTICIPANTS_V3,
  comparison,
  taskComparison,
  behaviouralComparison,
  decisionComparison,
  experienceComparison,
  taskSummaryV3,
  topIssuesV3,
  shippedFixImpact,
  NEW_RECOMMENDATIONS,
  HEADLINE_FINDING,
} from "@/lib/usability-study-v3-data";
import {
  R3_RECOMMENDATIONS,
  R3_DO_NOT,
  R3_SUCCESS_METRICS,
  type R3Priority,
  type R3Recommendation,
} from "@/lib/usability-study-r3-backlog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 as CheckIcon, Clock, XCircle, Target, Ban } from "lucide-react";

function Delta({ value, suffix = "pp", invert = false }: { value: number; suffix?: string; invert?: boolean }) {
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground tabular-nums">
        <Minus className="h-3 w-3" /> 0
      </span>
    );
  }
  const positive = invert ? value < 0 : value > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
        positive ? "text-success" : "text-destructive",
      )}
    >
      {value > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {value > 0 ? "+" : ""}
      {value}
      {suffix}
    </span>
  );
}

function CompareStat({
  icon: Icon,
  label,
  v2,
  v3,
  delta,
  suffix,
}: {
  icon: LucideIcon;
  label: string;
  v2: number;
  v3: number;
  delta: number;
  suffix?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-semibold text-foreground tabular-nums">{v3}</span>
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
        <Delta value={delta} suffix={suffix === "%" ? "pp" : ""} />
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        Round 1: {v2}
        {suffix}
      </div>
    </Card>
  );
}

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-base font-semibold text-foreground">{children}</h2>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function DualBar({ v2, v3 }: { v2: number; v3: number }) {
  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase text-muted-foreground w-7">R1</span>
        <Progress value={v2} className="h-1.5 flex-1" />
        <span className="text-xs tabular-nums w-10 text-right text-muted-foreground">{v2}%</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase text-primary w-7">R2</span>
        <Progress value={v3} className="h-1.5 flex-1" />
        <span className="text-xs tabular-nums w-10 text-right">{v3}%</span>
      </div>
    </div>
  );
}

function ComparisonTab() {
  const c = comparison();
  const tasks = taskComparison();
  const behav = behaviouralComparison();
  const dec = decisionComparison();
  const exp = experienceComparison();

  return (
    <div className="space-y-8">
      <Card className="p-5 border-primary/30 bg-primary/5">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <h2 className="text-base font-semibold text-foreground">Headline finding</h2>
            <p className="text-sm text-muted-foreground mt-1">{HEADLINE_FINDING}</p>
          </div>
        </div>
      </Card>

      <section>
        <SectionTitle sub="Same 25 participants, re-tested against the v3 design that ships the round 1 backlog">
          Round 1 vs Round 2 — overall snapshot
        </SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <CompareStat icon={CheckCircle2} label="Task success rate" v2={c.v2.successRate} v3={c.v3.successRate} delta={c.deltas.successRate} suffix="%" />
          <CompareStat icon={Gauge} label="Avg usability" v2={c.v2.avgUsability} v3={c.v3.avgUsability} delta={c.deltas.avgUsability} suffix="/5" />
          <CompareStat icon={Activity} label="SUS proxy" v2={c.v2.sus} v3={c.v3.sus} delta={c.deltas.sus} suffix="/100" />
          <CompareStat icon={Users} label="Confident decisions" v2={c.v2.confidentPct} v3={c.v3.confidentPct} delta={c.deltas.confidentPct} suffix="%" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
          <CompareStat icon={Gauge} label="Ease" v2={c.v2.ease} v3={c.v3.ease} delta={c.deltas.ease} suffix="/5" />
          <CompareStat icon={Gauge} label="Clarity" v2={c.v2.clarity} v3={c.v3.clarity} delta={c.deltas.clarity} suffix="/5" />
          <CompareStat icon={Gauge} label="Confidence" v2={c.v2.confidence} v3={c.v3.confidence} delta={c.deltas.confidence} suffix="/5" />
          <CompareStat icon={Gauge} label="Trust" v2={c.v2.trust} v3={c.v3.trust} delta={c.deltas.trust} suffix="/5" />
        </div>
      </section>

      <section>
        <SectionTitle>Per-task success rate — before vs after</SectionTitle>
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead className="w-[280px]">Success rate</TableHead>
                <TableHead className="w-24">Δ</TableHead>
                <TableHead>Speed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">
                    <div className="text-foreground">T{t.id}. {t.name}</div>
                  </TableCell>
                  <TableCell><DualBar v2={t.v2} v3={t.v3} /></TableCell>
                  <TableCell><Delta value={t.delta} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {t.v2Speed} → <span className="text-foreground">{t.v3Speed}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <div>
          <SectionTitle>Behavioural patterns</SectionTitle>
          <Card className="p-5 space-y-4">
            {behav.map((row) => (
              <div key={row.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-foreground">{row.label}</span>
                  <Delta value={row.v3 - row.v2} invert />
                </div>
                <DualBar v2={row.v2} v3={row.v3} />
              </div>
            ))}
          </Card>
        </div>

        <div>
          <SectionTitle>Decision confidence (Task 2)</SectionTitle>
          <Card className="p-5 space-y-4">
            {(["confident", "unsure", "incorrect"] as const).map((k) => {
              const tone = k === "confident" ? "success" : k === "unsure" ? "warning" : "destructive";
              const invert = k !== "confident";
              return (
                <div key={k}>
                  <div className="flex justify-between text-sm mb-1 capitalize">
                    <span className={cn("text-foreground")}>{k}</span>
                    <Delta value={dec.v3[k] - dec.v2[k]} invert={invert} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase text-muted-foreground w-7">R1</span>
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full bg-${tone}`} style={{ width: `${dec.v2[k]}%` }} />
                    </div>
                    <span className="text-xs tabular-nums w-10 text-right text-muted-foreground">{dec.v2[k]}%</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] uppercase text-primary w-7">R2</span>
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full bg-${tone}`} style={{ width: `${dec.v3[k]}%` }} />
                    </div>
                    <span className="text-xs tabular-nums w-10 text-right">{dec.v3[k]}%</span>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      </section>

      <section>
        <SectionTitle>Experience-level comparison</SectionTitle>
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Level</TableHead>
                <TableHead>n</TableHead>
                <TableHead>Success</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Pattern in round 2</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exp.map((e) => (
                <TableRow key={e.level}>
                  <TableCell className="font-medium">{e.level}</TableCell>
                  <TableCell className="tabular-nums">{e.count}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm tabular-nums">{e.v3Success}%</span>
                      <Delta value={e.v3Success - e.v2Success} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm tabular-nums">{e.v3Confidence} / 5</span>
                      <Delta value={Math.round((e.v3Confidence - e.v2Confidence) * 10) / 10} suffix="" />
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{e.pattern}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </section>
    </div>
  );
}

function ShippedFixesTab() {
  const fixes = shippedFixImpact();
  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Impact of shipped fixes</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Each row maps a round 1 recommendation to the design improvement that shipped, then measures the success-rate
          change on the task it was meant to address.
        </p>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead>Shipped fix</TableHead>
              <TableHead className="w-32">Area</TableHead>
              <TableHead className="w-24">Priority</TableHead>
              <TableHead className="w-[220px]">Linked task success</TableHead>
              <TableHead className="w-20">Δ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fixes.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">{f.id}</TableCell>
                <TableCell className="font-medium text-foreground">{f.title}</TableCell>
                <TableCell><Badge variant="outline" className="font-normal">{f.area}</Badge></TableCell>
                <TableCell><Badge variant="outline">{f.priority}</Badge></TableCell>
                <TableCell><DualBar v2={f.v2Success} v3={f.v3Success} /></TableCell>
                <TableCell><Delta value={f.delta} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <section>
        <SectionTitle sub="Smaller, more specific issues raised in round 2 — feeds the next sprint">
          New recommendations from round 2
        </SectionTitle>
        <div className="space-y-3">
          {NEW_RECOMMENDATIONS.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-xs font-mono text-muted-foreground">{r.id}</span>
                <Badge variant="outline">{r.priority}</Badge>
                <Badge variant="outline" className="font-normal">{r.area}</Badge>
                <span className="text-xs text-muted-foreground ml-auto">
                  Affects <span className="text-foreground tabular-nums font-medium">{r.affectedPct}%</span>
                </span>
              </div>
              <h3 className="text-sm font-semibold text-foreground">{r.title}</h3>
              <div className="mt-2 grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">Problem</div>
                  <div className="text-foreground">{r.problem}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">Proposal</div>
                  <div className="text-foreground">{r.proposal}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function ResidualIssuesTab() {
  const issues = topIssuesV3();
  const tasks = taskSummaryV3();
  return (
    <div className="space-y-6">
      <section>
        <SectionTitle sub="What participants still raised after the v3 redesign">
          Remaining UX issues (round 2)
        </SectionTitle>
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead className="w-40">Affected</TableHead>
                <TableHead className="w-32">Severity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.map((i, idx) => (
                <TableRow key={i.label}>
                  <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell className="font-medium text-foreground">{i.label}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={i.affectedPct} className="h-1.5" />
                      <span className="text-sm tabular-nums w-10 text-right">{i.affectedPct}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{i.severity}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </section>

      <section>
        <SectionTitle>Top failure reasons by task (round 2)</SectionTitle>
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead className="w-24">Success</TableHead>
                <TableHead>Top failure reasons</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">T{t.id}. {t.name}</TableCell>
                  <TableCell className="tabular-nums">{t.successRate}%</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {t.topFailures.length ? t.topFailures.join(" · ") : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </section>
    </div>
  );
}

function ParticipantsTab() {
  const [openId, setOpenId] = useState<number | null>(null);
  const open = useMemo(
    () => PARTICIPANTS_V3.find((p) => p.id === openId) ?? null,
    [openId],
  );
  const v2Open = useMemo(
    () => V2_PARTICIPANTS.find((p) => p.id === openId) ?? null,
    [openId],
  );

  return (
    <div className="grid lg:grid-cols-[1fr_2fr] gap-4">
      <Card className="p-2 max-h-[calc(100vh-220px)] overflow-y-auto">
        <ul className="divide-y divide-border">
          {PARTICIPANTS_V3.map((p) => {
            const v3Success = p.tasks.filter((t) => t.outcome === "Success").length;
            const v2 = V2_PARTICIPANTS.find((x) => x.id === p.id)!;
            const v2Success = v2.tasks.filter((t) => t.outcome === "Success").length;
            return (
              <li key={p.id}>
                <button
                  onClick={() => setOpenId(p.id)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 hover:bg-muted rounded-md transition-colors",
                    openId === p.id && "bg-muted",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">P{p.id} · {p.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{p.role}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="outline" className="font-mono text-[11px]">{v2Success}→{v3Success}/6</Badge>
                      <Delta value={v3Success - v2Success} suffix="" />
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="space-y-4">
        {open && v2Open ? (
          <ParticipantCompareDetail v2={v2Open} v3={open} />
        ) : (
          <Card className="p-12 text-center text-sm text-muted-foreground">
            Select a participant to compare their round 1 and round 2 walkthroughs.
          </Card>
        )}
      </div>
    </div>
  );
}

function ParticipantCompareDetail({ v2, v3 }: { v2: Participant; v3: Participant }) {
  return (
    <>
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{v3.name}</h2>
            <p className="text-sm text-muted-foreground">{v3.role} · {v3.level} · {v3.yearsExp}y</p>
            <Badge variant="outline" className="mt-2">{v3.behaviour}</Badge>
          </div>
          <div className="flex gap-3 text-center">
            {(["ease", "clarity", "confidence", "trust"] as const).map((k) => (
              <div key={k} className="px-3 py-2 rounded-md bg-muted">
                <div className="text-lg font-semibold tabular-nums">{v3.scores[k]}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  was {v2.scores[k]}
                  <Delta value={Math.round((v3.scores[k] - v2.scores[k]) * 10) / 10} suffix="" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Round 1</TableHead>
              <TableHead>Round 2</TableHead>
              <TableHead>Friction now</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {v3.tasks.map((t, i) => {
              const meta = TASKS.find((x) => x.id === t.taskId)!;
              const before = v2.tasks[i];
              return (
                <TableRow key={t.taskId}>
                  <TableCell className="align-top">
                    <div className="font-medium text-foreground">T{t.taskId}</div>
                    <div className="text-xs text-muted-foreground">{meta.name}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{before.outcome}</Badge>
                    <div className="text-[11px] text-muted-foreground mt-1">{before.speed}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{t.outcome}</Badge>
                    <div className="text-[11px] text-muted-foreground mt-1">{t.speed}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.friction}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Round 2 quotes</h3>
        <ul className="space-y-3">
          {v3.quotes.map((q, i) => (
            <li key={i} className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3">
              "{q}"
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

type ReviewState = "pending" | "approved" | "deferred" | "rejected";

const priorityTone: Record<R3Priority, string> = {
  P1: "bg-destructive/10 text-destructive border-destructive/30",
  P2: "bg-warning/15 text-warning border-warning/30",
  P3: "bg-primary/10 text-primary border-primary/30",
  P4: "bg-muted text-muted-foreground border-border",
};

const reviewTone: Record<ReviewState, string> = {
  pending: "bg-muted text-muted-foreground border-border",
  approved: "bg-success/10 text-success border-success/30",
  deferred: "bg-warning/15 text-warning border-warning/30",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
};

function R3BacklogTab() {
  const [states, setStates] = useState<Record<string, ReviewState>>(
    () => Object.fromEntries(R3_RECOMMENDATIONS.map((i) => [i.id, "pending"])),
  );
  const setState = (id: string, s: ReviewState) =>
    setStates((prev) => ({ ...prev, [id]: prev[id] === s ? "pending" : s }));

  const counts = {
    approved: Object.values(states).filter((s) => s === "approved").length,
    deferred: Object.values(states).filter((s) => s === "deferred").length,
    rejected: Object.values(states).filter((s) => s === "rejected").length,
    pending: Object.values(states).filter((s) => s === "pending").length,
  };

  const tiers = Array.from(new Set(R3_RECOMMENDATIONS.map((r) => r.tier)));

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Round 3 backlog</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {R3_RECOMMENDATIONS.length} recommendations derived from Round 2 findings, grouped by priority tier.
              Review each and mark Approved, Deferred or Rejected. Decisions are local to this prototype.
            </p>
          </div>
          <div className="flex gap-2 text-xs">
            <Badge variant="outline" className="border-success/30 text-success">{counts.approved} approved</Badge>
            <Badge variant="outline" className="border-warning/30 text-warning">{counts.deferred} deferred</Badge>
            <Badge variant="outline" className="border-destructive/30 text-destructive">{counts.rejected} rejected</Badge>
            <Badge variant="outline">{counts.pending} pending</Badge>
          </div>
        </div>
      </Card>

      {tiers.map((tier) => (
        <section key={tier}>
          <SectionTitle>{tier}</SectionTitle>
          <div className="space-y-3">
            {R3_RECOMMENDATIONS.filter((r) => r.tier === tier).map((r) => (
              <R3Card key={r.id} item={r} state={states[r.id]} onSet={(s) => setState(r.id, s)} />
            ))}
          </div>
        </section>
      ))}

      <section className="grid lg:grid-cols-2 gap-6">
        <div>
          <SectionTitle>Explicitly out of scope for R3</SectionTitle>
          <Card className="p-5 space-y-4">
            {R3_DO_NOT.map((d) => (
              <div key={d.title} className="flex items-start gap-3">
                <Ban className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-foreground">{d.title}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">{d.rationale}</div>
                </div>
              </div>
            ))}
          </Card>
        </div>
        <div>
          <SectionTitle>R3 success metrics</SectionTitle>
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead className="w-32">Target</TableHead>
                  <TableHead>Baseline</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {R3_SUCCESS_METRICS.map((m) => (
                  <TableRow key={m.metric}>
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <Target className="h-3.5 w-3.5 text-primary" />
                        {m.metric}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">{m.target}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{m.baseline}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </section>
    </div>
  );
}

function R3Card({
  item,
  state,
  onSet,
}: {
  item: R3Recommendation;
  state: ReviewState;
  onSet: (s: ReviewState) => void;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="text-xs font-mono text-muted-foreground">{item.id}</span>
            <Badge className={cn("border", priorityTone[item.priority])}>{item.priority}</Badge>
            <Badge variant="outline" className="font-normal">{item.area}</Badge>
            <Badge variant="outline" className="font-normal">Impact: {item.impact}</Badge>
            <Badge variant="outline" className="font-normal">Effort: {item.effort}</Badge>
            {item.carriedFrom && (
              <Badge variant="outline" className="font-normal">Carried from {item.carriedFrom}</Badge>
            )}
            <Badge className={cn("border", reviewTone[state])}>
              {state.charAt(0).toUpperCase() + state.slice(1)}
            </Badge>
          </div>
          <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
          <dl className="mt-3 grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">Problem</dt>
              <dd className="text-foreground">{item.problem}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">Proposal</dt>
              <dd className="text-foreground">{item.proposal}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">Evidence (R2)</dt>
              <dd className="text-muted-foreground">{item.evidence}</dd>
            </div>
          </dl>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <Button
            size="sm"
            variant={state === "approved" ? "default" : "outline"}
            onClick={() => onSet("approved")}
            className="justify-start gap-2 min-w-[140px]"
          >
            <CheckIcon className="h-3.5 w-3.5" /> Approve
          </Button>
          <Button
            size="sm"
            variant={state === "deferred" ? "default" : "outline"}
            onClick={() => onSet("deferred")}
            className="justify-start gap-2"
          >
            <Clock className="h-3.5 w-3.5" /> Defer
          </Button>
          <Button
            size="sm"
            variant={state === "rejected" ? "default" : "outline"}
            onClick={() => onSet("rejected")}
            className="justify-start gap-2"
          >
            <XCircle className="h-3.5 w-3.5" /> Reject
          </Button>
        </div>
      </div>
    </Card>
  );
}

const UsabilityStudyV3 = () => {
  return (
    <V2Shell
      title="Usability Study — Round 2"
      subtitle="ClauseIQ v3 vs v2 · 25 participants re-tested · 6 tasks"
      headerRight={
        <Link
          to="/usability-v2"
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          ← Round 1 study
        </Link>
      }
    >
      <div className="px-6 py-6 max-w-7xl mx-auto">
        <Tabs defaultValue="comparison">
          <TabsList>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
            <TabsTrigger value="shipped">Shipped fixes impact</TabsTrigger>
            <TabsTrigger value="residual">Residual issues</TabsTrigger>
            <TabsTrigger value="r3">R3 backlog ({R3_RECOMMENDATIONS.length})</TabsTrigger>
            <TabsTrigger value="participants">Participants ({PARTICIPANTS_V3.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="comparison" className="mt-6"><ComparisonTab /></TabsContent>
          <TabsContent value="shipped" className="mt-6"><ShippedFixesTab /></TabsContent>
          <TabsContent value="residual" className="mt-6"><ResidualIssuesTab /></TabsContent>
          <TabsContent value="r3" className="mt-6"><R3BacklogTab /></TabsContent>
          <TabsContent value="participants" className="mt-6"><ParticipantsTab /></TabsContent>
        </Tabs>
      </div>
    </V2Shell>
  );
};

export default UsabilityStudyV3;
