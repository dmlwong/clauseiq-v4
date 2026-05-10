import { useMemo, useState } from "react";
import { V2Shell } from "@/components/clauseiq-v2/V2Shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  PARTICIPANTS,
  TASKS,
  taskSummary,
  overallSnapshot,
  topIssues,
  behaviouralPatterns,
  decisionConfidence,
  byExperience,
  DESIGN_RECS,
  DESIGN_IMPROVEMENTS,
  STAKEHOLDER_INSIGHTS,
  type Participant,
  type DesignImprovement,
} from "@/lib/usability-study-data";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Users,
  Gauge,
  Lightbulb,
  Clock,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const sevTone = (s: string) =>
  s === "Critical"
    ? "bg-destructive/10 text-destructive border-destructive/30"
    : s === "Major"
      ? "bg-warning/15 text-warning border-warning/30"
      : "bg-muted text-muted-foreground border-border";

const outcomeTone = (o: string) =>
  o === "Success"
    ? "bg-success/10 text-success border-success/30"
    : o === "Partial"
      ? "bg-warning/15 text-warning border-warning/30"
      : "bg-destructive/10 text-destructive border-destructive/30";

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  suffix?: string;
  hint?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-semibold text-foreground tabular-nums">{value}</span>
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
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

function DashboardTab() {
  const snap = overallSnapshot();
  const tasks = taskSummary();
  const issues = topIssues();
  const behav = behaviouralPatterns();
  const dec = decisionConfidence();
  const exp = byExperience();

  return (
    <div className="space-y-8">
      {/* 1. Overall snapshot */}
      <section>
        <SectionTitle sub="Aggregate signal across 25 simulated participants × 6 tasks (150 task attempts)">
          Overall usability snapshot
        </SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={CheckCircle2} label="Task success rate" value={snap.successRate} suffix="%" hint={`${PARTICIPANTS.length} participants`} />
          <StatCard icon={Gauge} label="Avg usability" value={snap.avgUsability} suffix="/ 5" hint={`Ease ${snap.ease} · Clarity ${snap.clarity}`} />
          <StatCard icon={Activity} label="SUS proxy" value={snap.sus} suffix="/ 100" hint={snap.sus >= 68 ? "Above industry avg" : "Below industry avg (68)"} />
          <StatCard icon={Users} label="Confident decisions" value={snap.confidentPct} suffix="%" hint="Confidence ≥ 4/5" />
        </div>
      </section>

      {/* 2. Task performance */}
      <section>
        <SectionTitle>Task performance overview</SectionTitle>
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead className="w-40">Success</TableHead>
                <TableHead className="w-24">Avg speed</TableHead>
                <TableHead>Top failure reasons</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">
                    <div className="text-foreground">T{t.id}. {t.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Partial {t.partialRate}% · Fail {t.failRate}%
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={t.successRate} className="h-1.5" />
                      <span className="text-sm tabular-nums w-10 text-right">{t.successRate}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">{t.avgSpeed}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {t.topFailures.length ? t.topFailures.join(" · ") : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </section>

      {/* 3. Top UX issues */}
      <section>
        <SectionTitle>Key UX issues (ranked)</SectionTitle>
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
                    <Badge className={cn("border", sevTone(i.severity))}>{i.severity}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </section>

      {/* 4 & 5: Behavioural + decision */}
      <section className="grid lg:grid-cols-2 gap-6">
        <div>
          <SectionTitle>Behavioural patterns</SectionTitle>
          <Card className="p-5 space-y-4">
            {[
              { label: "Failed to detect a key change (T1)", value: behav.failedDetect, tone: "destructive" },
              { label: "Misinterpreted version progression (T3)", value: behav.misinterpreted, tone: "warning" },
              { label: "Distrusted system output (trust ≤ 3/5)", value: behav.distrust, tone: "warning" },
              { label: "Reverted to Excel mental model", value: behav.excel, tone: "destructive" },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-foreground">{row.label}</span>
                  <span className="tabular-nums font-medium">{row.value}%</span>
                </div>
                <Progress value={row.value} className="h-1.5" />
              </div>
            ))}
          </Card>
        </div>

        <div>
          <SectionTitle>Decision confidence (Task 2)</SectionTitle>
          <Card className="p-5">
            <div className="flex h-3 rounded-full overflow-hidden border border-border">
              <div className="bg-success" style={{ width: `${dec.confident}%` }} />
              <div className="bg-warning" style={{ width: `${dec.unsure}%` }} />
              <div className="bg-destructive" style={{ width: `${dec.incorrect}%` }} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
              <div>
                <div className="text-2xl font-semibold text-success tabular-nums">{dec.confident}%</div>
                <div className="text-xs text-muted-foreground">Confident</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-warning tabular-nums">{dec.unsure}%</div>
                <div className="text-xs text-muted-foreground">Unsure</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-destructive tabular-nums">{dec.incorrect}%</div>
                <div className="text-xs text-muted-foreground">Incorrect</div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* 6. Experience comparison */}
      <section>
        <SectionTitle>Experience-level comparison</SectionTitle>
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Level</TableHead>
                <TableHead>n</TableHead>
                <TableHead>Success rate</TableHead>
                <TableHead>Avg confidence</TableHead>
                <TableHead>Typical error pattern</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exp.map((e) => (
                <TableRow key={e.level}>
                  <TableCell className="font-medium">{e.level}</TableCell>
                  <TableCell className="tabular-nums">{e.count}</TableCell>
                  <TableCell className="tabular-nums">{e.successRate}%</TableCell>
                  <TableCell className="tabular-nums">{e.confidence} / 5</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{e.errorPattern}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </section>

      {/* 7. Priority matrix */}
      <section>
        <SectionTitle sub="Position based on aggregate user impact and implementation cost">
          Design priority matrix
        </SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-5 border-success/30">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-success" />
              <h3 className="font-semibold text-foreground">High impact · Low effort — Quick wins</h3>
            </div>
            <ul className="space-y-2 text-sm">
              {DESIGN_RECS.quickWins.map((r) => (
                <li key={r.title} className="flex items-start gap-2">
                  <span className="text-success mt-0.5">●</span>
                  <span className="text-foreground">{r.title}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-5 border-primary/30">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground">High impact · High effort — Strategic fixes</h3>
            </div>
            <ul className="space-y-2 text-sm">
              {DESIGN_RECS.strategic.map((r) => (
                <li key={r.title} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">●</span>
                  <span className="text-foreground">{r.title}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-5 border-warning/30 col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <h3 className="font-semibold text-foreground">Trust improvements</h3>
            </div>
            <ul className="grid md:grid-cols-3 gap-3 text-sm">
              {DESIGN_RECS.trust.map((r) => (
                <li key={r.title} className="flex items-start gap-2">
                  <span className="text-warning mt-0.5">●</span>
                  <span className="text-foreground">{r.title}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      {/* Stakeholder insights */}
      <section>
        <SectionTitle>Stakeholder insight mapping</SectionTitle>
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-56">Theme</TableHead>
                <TableHead>Insight</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {STAKEHOLDER_INSIGHTS.map((s) => (
                <TableRow key={s.theme}>
                  <TableCell className="font-medium text-foreground">{s.theme}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.insight}</TableCell>
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
  const open = useMemo(() => PARTICIPANTS.find((p) => p.id === openId) ?? null, [openId]);

  return (
    <div className="grid lg:grid-cols-[1fr_2fr] gap-4">
      <Card className="p-2 max-h-[calc(100vh-220px)] overflow-y-auto">
        <ul className="divide-y divide-border">
          {PARTICIPANTS.map((p) => {
            const success = p.tasks.filter((t) => t.outcome === "Success").length;
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
                      <div className="text-xs text-muted-foreground truncate">{p.role} · {p.yearsExp}y</div>
                    </div>
                    <Badge variant="outline" className="font-mono text-[11px] shrink-0">{success}/6</Badge>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="space-y-4">
        {open ? <ParticipantDetail p={open} /> : (
          <Card className="p-12 text-center text-sm text-muted-foreground">
            Select a participant on the left to see their full task walkthrough.
          </Card>
        )}
      </div>
    </div>
  );
}

function ParticipantDetail({ p }: { p: Participant }) {
  return (
    <>
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{p.name}</h2>
            <p className="text-sm text-muted-foreground">
              {p.role} · {p.level} · {p.yearsExp} years experience
            </p>
            <Badge variant="outline" className="mt-2">{p.behaviour}</Badge>
          </div>
          <div className="flex gap-3 text-center">
            {(["ease", "clarity", "confidence", "trust"] as const).map((k) => (
              <div key={k} className="px-3 py-2 rounded-md bg-muted">
                <div className="text-lg font-semibold tabular-nums">{p.scores[k]}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
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
              <TableHead className="w-24">Outcome</TableHead>
              <TableHead className="w-24">Speed</TableHead>
              <TableHead>Behaviour</TableHead>
              <TableHead>Friction</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {p.tasks.map((t) => {
              const meta = TASKS.find((x) => x.id === t.taskId)!;
              return (
                <TableRow key={t.taskId}>
                  <TableCell className="align-top">
                    <div className="font-medium text-foreground">T{t.taskId}</div>
                    <div className="text-xs text-muted-foreground">{meta.name}</div>
                  </TableCell>
                  <TableCell><Badge className={cn("border", outcomeTone(t.outcome))}>{t.outcome}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{t.speed}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-md">{t.steps}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.friction}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Think-aloud quotes</h3>
          <ul className="space-y-3">
            {p.quotes.map((q, i) => (
              <li key={i} className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3">"{q}"</li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Key issues</h3>
          {p.keyIssues.length ? (
            <ul className="space-y-2 text-sm">
              {p.keyIssues.map((k) => (
                <li key={k} className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                  <span className="text-foreground">{k}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-muted-foreground">No major issues raised.</div>
          )}
        </Card>
      </div>
    </>
  );
}

type ReviewState = "pending" | "approved" | "deferred" | "rejected";

const priorityTone = (p: string) =>
  p === "P0"
    ? "bg-destructive/10 text-destructive border-destructive/30"
    : p === "P1"
      ? "bg-warning/15 text-warning border-warning/30"
      : "bg-muted text-muted-foreground border-border";

const reviewTone: Record<ReviewState, string> = {
  pending: "bg-muted text-muted-foreground border-border",
  approved: "bg-success/10 text-success border-success/30",
  deferred: "bg-warning/15 text-warning border-warning/30",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
};

function RecommendationsTab() {
  const [states, setStates] = useState<Record<string, ReviewState>>(
    () => Object.fromEntries(DESIGN_IMPROVEMENTS.map((i) => [i.id, "pending"])),
  );
  const [areaFilter, setAreaFilter] = useState<string>("All");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");

  const setState = (id: string, s: ReviewState) =>
    setStates((prev) => ({ ...prev, [id]: prev[id] === s ? "pending" : s }));

  const areas = ["All", ...Array.from(new Set(DESIGN_IMPROVEMENTS.map((i) => i.area)))];
  const priorities = ["All", "P0", "P1", "P2"];

  const filtered = DESIGN_IMPROVEMENTS.filter(
    (i) => (areaFilter === "All" || i.area === areaFilter) && (priorityFilter === "All" || i.priority === priorityFilter),
  );

  const counts = {
    total: DESIGN_IMPROVEMENTS.length,
    approved: Object.values(states).filter((s) => s === "approved").length,
    deferred: Object.values(states).filter((s) => s === "deferred").length,
    rejected: Object.values(states).filter((s) => s === "rejected").length,
    pending: Object.values(states).filter((s) => s === "pending").length,
  };

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Design improvement backlog</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {DESIGN_IMPROVEMENTS.length} prototype improvements derived from the study findings. Review each
              recommendation and mark it Approved, Deferred or Rejected before committing to a design sprint.
              Decisions are local to this prototype and reset on refresh.
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

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs uppercase tracking-wider text-muted-foreground mr-1">Area</span>
        {areas.map((a) => (
          <button
            key={a}
            onClick={() => setAreaFilter(a)}
            className={cn(
              "text-xs px-2.5 py-1 rounded-full border transition-colors",
              areaFilter === a ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:bg-muted",
            )}
          >
            {a}
          </button>
        ))}
        <span className="text-xs uppercase tracking-wider text-muted-foreground ml-4 mr-1">Priority</span>
        {priorities.map((p) => (
          <button
            key={p}
            onClick={() => setPriorityFilter(p)}
            className={cn(
              "text-xs px-2.5 py-1 rounded-full border transition-colors",
              priorityFilter === p ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:bg-muted",
            )}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((i) => (
          <ImprovementCard key={i.id} item={i} state={states[i.id]} onSet={(s) => setState(i.id, s)} />
        ))}
        {filtered.length === 0 && (
          <Card className="p-10 text-center text-sm text-muted-foreground">No improvements match the current filters.</Card>
        )}
      </div>
    </div>
  );
}

function ImprovementCard({
  item,
  state,
  onSet,
}: {
  item: DesignImprovement;
  state: ReviewState;
  onSet: (s: ReviewState) => void;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="text-xs font-mono text-muted-foreground">{item.id}</span>
            <Badge className={cn("border", priorityTone(item.priority))}>{item.priority}</Badge>
            <Badge variant="outline" className="font-normal">{item.area}</Badge>
            <Badge variant="outline" className="font-normal">Impact: {item.impact}</Badge>
            <Badge variant="outline" className="font-normal">Effort: {item.effort}</Badge>
            <Badge className={cn("border", reviewTone[state])}>{state.charAt(0).toUpperCase() + state.slice(1)}</Badge>
          </div>
          <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
          <dl className="mt-3 grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">Problem observed</dt>
              <dd className="text-foreground">{item.problem}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">Proposed change</dt>
              <dd className="text-foreground">{item.proposal}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">Evidence</dt>
              <dd className="text-muted-foreground">{item.evidence}</dd>
            </div>
          </dl>
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span>Affects <span className="text-foreground font-medium tabular-nums">{item.affectedPct}%</span> of participants</span>
            <span>Linked tasks: {item.linkedTasks.map((t) => `T${t}`).join(", ")}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <Button
            size="sm"
            variant={state === "approved" ? "default" : "outline"}
            onClick={() => onSet("approved")}
            className="justify-start gap-2 min-w-[140px]"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Approve
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

const UsabilityStudyV2 = () => {
  return (
    <V2Shell title="Usability Study" subtitle="ClauseIQ v2 · 25 simulated participants · 6 tasks">
      <div className="px-6 py-6 max-w-7xl mx-auto">
        <Tabs defaultValue="dashboard">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations ({DESIGN_IMPROVEMENTS.length})</TabsTrigger>
            <TabsTrigger value="participants">Participants ({PARTICIPANTS.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="mt-6">
            <DashboardTab />
          </TabsContent>
          <TabsContent value="recommendations" className="mt-6">
            <RecommendationsTab />
          </TabsContent>
          <TabsContent value="participants" className="mt-6">
            <ParticipantsTab />
          </TabsContent>
        </Tabs>
      </div>
    </V2Shell>
  );
};

export default UsabilityStudyV2;
