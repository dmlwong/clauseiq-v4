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
  Minus,
  TrendingUp,
  Users,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { TASKS, type Participant } from "@/lib/usability-study-data";
import { PARTICIPANTS_V3 } from "@/lib/usability-study-v3-data";
import {
  PARTICIPANTS_V4,
  comparisonR3,
  taskComparisonR3,
  behaviouralComparisonR3,
  decisionComparisonR3,
  experienceComparisonR3,
  taskSummaryV4,
  topIssuesV4,
  shippedR3Impact,
  HEADLINE_FINDING_R3,
} from "@/lib/usability-study-v4-data";
import { R3_SUCCESS_METRICS } from "@/lib/usability-study-r3-backlog";

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
  icon: Icon, label, prev, curr, delta, suffix,
}: { icon: LucideIcon; label: string; prev: number; curr: number; delta: number; suffix?: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-semibold text-foreground tabular-nums">{curr}</span>
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
        <Delta value={delta} suffix={suffix === "%" ? "pp" : ""} />
      </div>
      <div className="mt-1 text-xs text-muted-foreground">Round 2: {prev}{suffix}</div>
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

function DualBar({ prev, curr, prevLabel = "R2", currLabel = "R3" }: { prev: number; curr: number; prevLabel?: string; currLabel?: string }) {
  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase text-muted-foreground w-7">{prevLabel}</span>
        <Progress value={prev} className="h-1.5 flex-1" />
        <span className="text-xs tabular-nums w-10 text-right text-muted-foreground">{prev}%</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase text-primary w-7">{currLabel}</span>
        <Progress value={curr} className="h-1.5 flex-1" />
        <span className="text-xs tabular-nums w-10 text-right">{curr}%</span>
      </div>
    </div>
  );
}

function ComparisonTab() {
  const c = comparisonR3();
  const tasks = taskComparisonR3();
  const behav = behaviouralComparisonR3();
  const dec = decisionComparisonR3();
  const exp = experienceComparisonR3();

  return (
    <div className="space-y-8">
      <Card className="p-5 border-primary/30 bg-primary/5">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <h2 className="text-base font-semibold text-foreground">Headline finding</h2>
            <p className="text-sm text-muted-foreground mt-1">{HEADLINE_FINDING_R3}</p>
          </div>
        </div>
      </Card>

      <section>
        <SectionTitle sub="Same 25 participants, re-tested against the v4 design that ships the entire R3 backlog">
          Round 2 vs Round 3 — overall snapshot
        </SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <CompareStat icon={CheckCircle2} label="Task success rate" prev={c.v3.successRate} curr={c.v4.successRate} delta={c.deltas.successRate} suffix="%" />
          <CompareStat icon={Gauge} label="Avg usability" prev={c.v3.avgUsability} curr={c.v4.avgUsability} delta={c.deltas.avgUsability} suffix="/5" />
          <CompareStat icon={Activity} label="SUS proxy" prev={c.v3.sus} curr={c.v4.sus} delta={c.deltas.sus} suffix="/100" />
          <CompareStat icon={Users} label="Confident decisions" prev={c.v3.confidentPct} curr={c.v4.confidentPct} delta={c.deltas.confidentPct} suffix="%" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
          <CompareStat icon={Gauge} label="Ease" prev={c.v3.ease} curr={c.v4.ease} delta={c.deltas.ease} suffix="/5" />
          <CompareStat icon={Gauge} label="Clarity" prev={c.v3.clarity} curr={c.v4.clarity} delta={c.deltas.clarity} suffix="/5" />
          <CompareStat icon={Gauge} label="Confidence" prev={c.v3.confidence} curr={c.v4.confidence} delta={c.deltas.confidence} suffix="/5" />
          <CompareStat icon={Gauge} label="Trust" prev={c.v3.trust} curr={c.v4.trust} delta={c.deltas.trust} suffix="/5" />
        </div>
      </section>

      <section>
        <SectionTitle>Per-task success rate — R2 vs R3</SectionTitle>
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
                  <TableCell><DualBar prev={t.v3} curr={t.v4} /></TableCell>
                  <TableCell><Delta value={t.delta} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {t.v3Speed} → <span className="text-foreground">{t.v4Speed}</span>
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
                  <Delta value={row.v4 - row.v3} invert />
                </div>
                <DualBar prev={row.v3} curr={row.v4} />
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
                    <span>{k}</span>
                    <Delta value={dec.v4[k] - dec.v3[k]} invert={invert} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase text-muted-foreground w-7">R2</span>
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full bg-${tone}`} style={{ width: `${dec.v3[k]}%` }} />
                    </div>
                    <span className="text-xs tabular-nums w-10 text-right text-muted-foreground">{dec.v3[k]}%</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] uppercase text-primary w-7">R3</span>
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full bg-${tone}`} style={{ width: `${dec.v4[k]}%` }} />
                    </div>
                    <span className="text-xs tabular-nums w-10 text-right">{dec.v4[k]}%</span>
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
                <TableHead>Pattern in round 3</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exp.map((e) => (
                <TableRow key={e.level}>
                  <TableCell className="font-medium">{e.level}</TableCell>
                  <TableCell className="tabular-nums">{e.count}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm tabular-nums">{e.v4Success}%</span>
                      <Delta value={e.v4Success - e.v3Success} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm tabular-nums">{e.v4Confidence} / 5</span>
                      <Delta value={Math.round((e.v4Confidence - e.v3Confidence) * 10) / 10} suffix="" />
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{e.pattern}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </section>

      <section>
        <SectionTitle sub="Were the R3 success metrics hit?">R3 targets — measured</SectionTitle>
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="w-32">Target</TableHead>
                <TableHead>Measured (R3)</TableHead>
                <TableHead className="w-24">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {R3_SUCCESS_METRICS.map((m) => {
                let measured = "—";
                let hit: boolean | null = null;
                if (/Trust/i.test(m.metric)) {
                  measured = `${c.v4.trust} / 5`;
                  hit = c.v4.trust >= 4.2;
                } else if (/T2/i.test(m.metric)) {
                  const t2 = tasks.find((t) => t.id === 2)!;
                  measured = `${t2.v4}%`;
                  hit = t2.v4 >= 85;
                } else if (/Excel/i.test(m.metric)) {
                  const ex = behav.find((b) => /Excel/.test(b.label))!;
                  measured = `${ex.v4}%`;
                  hit = ex.v4 < 10;
                } else {
                  measured = "Not yet instrumented";
                }
                return (
                  <TableRow key={m.metric}>
                    <TableCell className="font-medium text-foreground">{m.metric}</TableCell>
                    <TableCell className="tabular-nums">{m.target}</TableCell>
                    <TableCell className="tabular-nums">{measured}</TableCell>
                    <TableCell>
                      {hit === null ? (
                        <Badge variant="outline">N/A</Badge>
                      ) : hit ? (
                        <Badge variant="outline" className="border-success/40 text-success">Hit</Badge>
                      ) : (
                        <Badge variant="outline" className="border-warning/40 text-warning">Miss</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </section>
    </div>
  );
}

function ShippedFixesTab() {
  const fixes = shippedR3Impact();
  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Impact of shipped R3 fixes</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Each row maps an R3 backlog item to the design improvement that shipped, then measures the success-rate
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
                <TableCell><DualBar prev={f.v3Success} curr={f.v4Success} /></TableCell>
                <TableCell><Delta value={f.delta} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function ResidualIssuesTab() {
  const issues = topIssuesV4();
  const tasks = taskSummaryV4();
  return (
    <div className="space-y-6">
      <section>
        <SectionTitle sub="What participants still raised after the v4 redesign — almost entirely UI nits">
          Remaining UX issues (round 3)
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
                  <TableCell><Badge variant="outline">{i.severity}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </section>

      <section>
        <SectionTitle>Top failure reasons by task (round 3)</SectionTitle>
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
  const open = useMemo(() => PARTICIPANTS_V4.find((p) => p.id === openId) ?? null, [openId]);
  const v3Open = useMemo(() => PARTICIPANTS_V3.find((p) => p.id === openId) ?? null, [openId]);

  return (
    <div className="grid lg:grid-cols-[1fr_2fr] gap-4">
      <Card className="p-2 max-h-[calc(100vh-220px)] overflow-y-auto">
        <ul className="divide-y divide-border">
          {PARTICIPANTS_V4.map((p) => {
            const v4Success = p.tasks.filter((t) => t.outcome === "Success").length;
            const v3 = PARTICIPANTS_V3.find((x) => x.id === p.id)!;
            const v3Success = v3.tasks.filter((t) => t.outcome === "Success").length;
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
                      <Badge variant="outline" className="font-mono text-[11px]">{v3Success}→{v4Success}/6</Badge>
                      <Delta value={v4Success - v3Success} suffix="" />
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="space-y-4">
        {open && v3Open ? (
          <ParticipantCompareDetail prev={v3Open} curr={open} />
        ) : (
          <Card className="p-12 text-center text-sm text-muted-foreground">
            Select a participant to compare their round 2 and round 3 walkthroughs.
          </Card>
        )}
      </div>
    </div>
  );
}

function ParticipantCompareDetail({ prev, curr }: { prev: Participant; curr: Participant }) {
  return (
    <>
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{curr.name}</h2>
            <p className="text-sm text-muted-foreground">{curr.role} · {curr.level} · {curr.yearsExp}y</p>
            <Badge variant="outline" className="mt-2">{curr.behaviour}</Badge>
          </div>
          <div className="flex gap-3 text-center">
            {(["ease", "clarity", "confidence", "trust"] as const).map((k) => (
              <div key={k} className="px-3 py-2 rounded-md bg-muted">
                <div className="text-lg font-semibold tabular-nums">{curr.scores[k]}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  was {prev.scores[k]}
                  <Delta value={Math.round((curr.scores[k] - prev.scores[k]) * 10) / 10} suffix="" />
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
              <TableHead>Round 2</TableHead>
              <TableHead>Round 3</TableHead>
              <TableHead>Friction now</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {curr.tasks.map((t, i) => {
              const meta = TASKS.find((x) => x.id === t.taskId)!;
              const before = prev.tasks[i];
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
        <h3 className="text-sm font-semibold text-foreground mb-3">Round 3 quotes</h3>
        <ul className="space-y-3">
          {curr.quotes.map((q, i) => (
            <li key={i} className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3">
              "{q}"
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

const UsabilityStudyV4 = () => {
  return (
    <V2Shell
      title="Usability Study — Round 3"
      subtitle="ClauseIQ v4 vs v3 · 25 participants re-tested · 6 tasks · R3 backlog shipped"
      headerRight={
        <div className="flex items-center gap-3 text-xs">
          <Link to="/usability-v2" className="text-muted-foreground hover:text-foreground underline underline-offset-2">← Round 1</Link>
          <Link to="/usability-v3" className="text-muted-foreground hover:text-foreground underline underline-offset-2">← Round 2</Link>
        </div>
      }
    >
      <div className="px-6 py-6 max-w-7xl mx-auto">
        <Tabs defaultValue="comparison">
          <TabsList>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
            <TabsTrigger value="shipped">Shipped fixes impact</TabsTrigger>
            <TabsTrigger value="residual">Residual issues</TabsTrigger>
            <TabsTrigger value="participants">Participants ({PARTICIPANTS_V4.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="comparison" className="mt-6"><ComparisonTab /></TabsContent>
          <TabsContent value="shipped" className="mt-6"><ShippedFixesTab /></TabsContent>
          <TabsContent value="residual" className="mt-6"><ResidualIssuesTab /></TabsContent>
          <TabsContent value="participants" className="mt-6"><ParticipantsTab /></TabsContent>
        </Tabs>
      </div>
    </V2Shell>
  );
};

export default UsabilityStudyV4;
