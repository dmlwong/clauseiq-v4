import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import "@orbit-tokens";
import "@orbit-fonts";
import "@/components/clauseiq-v5/orbit-theme.css";
import { Avatar, Chip, FA, MultiStateButton, MultiStateGroup } from "@orbit";
import {
  Circle,
  Loader2,
  X,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  hasCompleteAnalysisParameters,
  useClauseIqWorkflow,
  type ClauseIqWorkflow,
  type ClauseIqWorkflowStep,
} from "@/components/clauseiq-v5/ClauseIqWorkflow";
import { PROTOTYPE_CP_RESULT_ROUTE } from "@/lib/prototype-cp-routes";
import {
  CpAnalysisCard,
  CpAnalysisParameterCards,
  CpClauseIqDropzone,
  CpClauseIqJourneyContent,
  CpPlaybookDisclaimer,
  CpStateCard,
  CpSupplierOutputsPanel,
  getCpClauseIqFooterState,
} from "@/components/prototype-cp-shared/CpClauseIq";
import { V5OrbitToastHost } from "@/components/clauseiq-v5/V5OrbitToast";
import { CP_FA, CpIcon, CpRail, HeaderActions } from "@/components/prototype-cp/PrototypeCPChrome";
import {
  CpButton,
  CpFileRow,
  CpSearchField as CpOrbitSearchField,
  CpStatusPill,
  CpTable,
  type CpTableColumn,
} from "@/components/prototype-cp-shared/orbit";
import { mockInitiative } from "@/data/mock-clauseiq";
import {
  insights,
  initiatives,
  people,
  projects,
  workspaceSections,
  type CountSet,
  type CpProject,
  type Person,
  type ProjectStatus,
} from "@/data/prototype-cp";
import type { CiqInitiative } from "@/lib/clauseiq-v4-data";
import { flattenSupplierAnalyses } from "@/lib/clauseiq-utils";
import { cn } from "@/lib/utils";
import "./PrototypeCP.css";

type CpView = "projects" | "initiatives" | "workspace";

function getCpViewFromSearchParams(searchParams: URLSearchParams): CpView {
  const view = searchParams.get("view");
  if (view === "initiatives" || view === "workspace") return view;
  return "projects";
}

const statusClass: Record<ProjectStatus, string> = {
  "In flight": "in-flight",
  Pipeline: "pipeline",
  Complete: "complete",
  Idea: "idea",
};

const CP_CLAUSEIQ_INITIATIVE_LABEL = "CP001-1014 | sdasd";
const CP_CLAUSEIQ_INITIATIVE: CiqInitiative = {
  id: "cp001-1014",
  name: CP_CLAUSEIQ_INITIATIVE_LABEL,
  sector: "Client Portal",
  owner: "PM",
  scope: "team",
};

const CP_CLAUSEIQ_STEPS: Array<{ key: "overview" | "configure-upload" | "processing"; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "configure-upload", label: "Configure & Upload" },
  { key: "processing", label: "Analysing" },
];

function getCpClauseIqStepIndex(step: ClauseIqWorkflowStep) {
  if (step === "welcome" || step === "select") return 0;
  if (step === "parameters" || step === "upload") return 1;
  return 2;
}

function CpSearchField({
  value,
  onChange,
  ariaLabel,
  placeholder = "",
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
}) {
  return (
    <CpOrbitSearchField
      ariaLabel={ariaLabel}
      className="cp-search-field"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  );
}

function Counts({ counts }: { counts: CountSet }) {
  return (
    <div className="cp-counts" aria-label="Status counts">
      <span className="cp-count green">{counts.green}</span>
      <span className="cp-count amber">{counts.amber}</span>
      <span className="cp-count red">{counts.red}</span>
      <span className="cp-count grey">{counts.grey}</span>
    </div>
  );
}

function LogoTile({ logo }: { logo: CpProject["logo"] }) {
  return <span className={`cp-logo-tile cp-logo-${logo}`} aria-hidden="true" />;
}

function PersonAvatar({ person, size = "Small" }: { person: Person; size?: "Extra Small" | "Small" | "Medium" }) {
  if (person.image || person.photo) {
    return (
      <span
        className={`cp-photo-avatar cp-photo-${person.photo ?? "portrait"} cp-photo-${size.toLowerCase().replace(/\s+/g, "-")}`}
        title={person.name}
        role="img"
        aria-label={person.name}
      >
        {person.photo === "dark" ? person.initials : null}
      </span>
    );
  }

  return (
    <Avatar
      name={person.name}
      initials={person.initials}
      size={size}
      color={person.color}
    />
  );
}

function AvatarGroup({ people: group, extra }: { people: Person[]; extra?: string }) {
  return (
    <span className="cp-avatar-stack">
      {group.slice(0, 4).map((person) => (
        <PersonAvatar key={person.name} person={person} size="Extra Small" />
      ))}
      {extra ? <span className="cp-avatar-extra">{extra}</span> : null}
    </span>
  );
}

function StatusPill({ status, label }: { status: ProjectStatus; label?: string }) {
  return <CpStatusPill className={`cp-status-pill ${statusClass[status]}`} label={label} status={status} />;
}

type CpWorkstream = NonNullable<CpProject["workstreams"]>[number];

const workstreamColumns: Array<CpTableColumn<CpWorkstream>> = [
  { id: "categories", header: "Categories", render: (workstream) => workstream.categories },
  { id: "serviceLines", header: "ServiceLines", render: (workstream) => workstream.serviceLines },
  { id: "initiatives", header: "Initiatives", render: (workstream) => workstream.initiatives },
  { id: "team", header: "Team", render: (workstream) => workstream.teamSize },
  { id: "savings", header: "Project Est. Savings", render: () => <span className="muted-cell">-</span>, info: "Project estimated savings" },
  { id: "spend", header: "Project Est. Spend", render: () => <span className="muted-cell">-</span>, info: "Project estimated spend" },
  { id: "baseline", header: "Savings vs Baseline (Annualised)", render: () => "- ( - | 0% )", info: "Savings vs baseline annualised" },
  {
    id: "target",
    header: "Mid Target (Savings Delta)",
    render: () => <span><span className="cp-negative">▼</span> 0K GBP ( -0K GBP )</span>,
    info: "Mid target savings delta",
  },
];

function ProjectsTopbar() {
  return (
    <header className="cp-topbar">
      <h1 className="cp-title">Projects &amp; Initiatives</h1>
      <HeaderActions />
    </header>
  );
}

function ProjectCard({
  project,
  expanded,
  onToggle,
  onViewProject,
}: {
  project: CpProject;
  expanded: boolean;
  onToggle: () => void;
  onViewProject: () => void;
}) {
  return (
    <article className="cp-project-card">
        <div className="cp-project-summary">
          <div className="cp-project-identity">
            <LogoTile logo={project.logo} />
            <div className="cp-project-name">{project.name}</div>
            <Counts counts={project.counts} />
          </div>
          <div className="cp-project-meta">
            <div className="cp-meta-row">
              <span className="cp-meta-label">Client Type:</span>
              <span>{project.clientType}</span>
            </div>
            <div className="cp-meta-row">
              <span className="cp-meta-label">Sector:</span>
              <span>{project.sector}</span>
            </div>
            <div className="cp-meta-row">
              <span className="cp-meta-label">Head Office Address:</span>
              <span>{project.address}</span>
            </div>
            <div className="cp-meta-row">
              <span className="cp-meta-label">Main Leads:</span>
              <AvatarGroup people={project.mainLeads} extra={project.id === "efficio" ? "+49" : project.id === "roche" ? "+24" : undefined} />
              {project.qualityLeads ? (
                <>
                  <span className="cp-meta-label" style={{ marginLeft: 18 }}>Quality Leads:</span>
                  <AvatarGroup people={project.qualityLeads} extra={project.id === "efficio" ? "+21" : project.id === "roche" ? "+1" : undefined} />
                </>
              ) : null}
            </div>
          </div>
          <div className="cp-project-actions">
            {project.parent ? <span className="cp-parent-pill">{project.parent}</span> : null}
            <CpButton className="cp-action-square disabled" aria-label="Refresh disabled"><CpIcon icon={CP_FA.globe} size={15} /></CpButton>
            <CpButton className="cp-action-square" aria-label="Ideas"><CpIcon icon={CP_FA.lightbulb} size={15} /></CpButton>
            <CpButton className="cp-action-square" aria-label="Edit"><CpIcon icon={CP_FA.pencil} size={14} /></CpButton>
            <CpButton className="cp-action-square" aria-label={expanded ? "Collapse project" : "Expand project"} onClick={onToggle}>
              <CpIcon icon={expanded ? CP_FA.chevronUp : CP_FA.chevronDown} size={15} />
            </CpButton>
          </div>
        </div>
        {expanded && project.workstreams ? (
          <div className="cp-workstream-card">
            {project.workstreams.map((workstream) => (
              <div key={workstream.id}>
                <div className="cp-workstream-head">
                  <StatusPill status={workstream.status} />
                  <div className="cp-workstream-title">
                    <span>{workstream.title}</span>
                    <PersonAvatar person={workstream.owner} />
                    <AvatarGroup people={workstream.team} extra="+4" />
                  </div>
                  <div className="cp-workstream-actions">
                    <Counts counts={workstream.counts} />
                    <CpButton className="cp-view-button" onClick={onViewProject}>View Project</CpButton>
                    <CpButton className="cp-more-button" aria-label="More project actions"><CpIcon icon={CP_FA.ellipsis} size={17} /></CpButton>
                  </div>
                </div>
                <CpTable
                  ariaLabel={`${workstream.title} workstream metrics`}
                  className="cp-table"
                  columns={workstreamColumns}
                  rows={[workstream]}
                  getRowKey={(row) => row.id}
                />
              </div>
            ))}
          </div>
        ) : null}
    </article>
  );
}

function ProjectsView({
  expandedProject,
  setExpandedProject,
  onViewProject,
}: {
  expandedProject: string | null;
  setExpandedProject: (id: string | null) => void;
  onViewProject: () => void;
}) {
  const [search, setSearch] = useState("");
  const [projectStatus, setProjectStatus] = useState("all");
  return (
    <>
      <ProjectsTopbar />
      <main className="cp-canvas">
        <div className="cp-canvas-inner">
          <div className="cp-controls">
            <MultiStateGroup ariaLabel="Project status" value={projectStatus} onValueChange={setProjectStatus}>
              <MultiStateButton value="all" label="All" />
              <MultiStateButton value="active" label="Active" />
            </MultiStateGroup>
            <div className="cp-search">
              <CpSearchField ariaLabel="Search projects" value={search} onChange={setSearch} />
            </div>
          </div>
          <div className="cp-project-list">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                expanded={expandedProject === project.id}
                onToggle={() => setExpandedProject(expandedProject === project.id ? null : project.id)}
                onViewProject={onViewProject}
              />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

function ProjectHeader({
  activeTab = "Initiatives",
  initiativeCrumb,
}: {
  activeTab?: string;
  initiativeCrumb?: string;
}) {
  const tabs = ["Gantt Chart", "Initiatives", "Deliverables", "Team", "My QC Tasks", "Benefits", "Settings"];
  return (
    <>
      <div className="cp-breadcrumb">
        Projects &amp; Initiatives / <strong>Connected Platform - Development Workstreams</strong>
        {initiativeCrumb ? <> / <strong>{initiativeCrumb}</strong></> : null}
      </div>
      <header className="cp-project-header">
        <div className="cp-project-heading">
          <LogoTile logo="efficio" />
          <div className="cp-project-heading-text">Connected Platform - Development...</div>
          <nav className="cp-main-tabs" aria-label="Project tabs">
            {tabs.map((tab) => (
              <CpButton key={tab} className={`cp-main-tab${tab === activeTab ? " is-active" : ""}`}>
                {tab}{tab === "Settings" ? <CpIcon icon={CP_FA.chevronDown} size={11} /> : null}
              </CpButton>
            ))}
          </nav>
        </div>
        <HeaderActions uploadCount="5" showCloud />
      </header>
    </>
  );
}

function InitiativesView({ onOpenInitiative }: { onOpenInitiative: () => void }) {
  const [query, setQuery] = useState("");
  const [initiativeScope, setInitiativeScope] = useState("team");
  return (
    <>
      <ProjectHeader />
      <main className="cp-canvas">
        <div className="cp-canvas-inner">
          <div className="cp-initiative-toolbar">
            <div className="cp-toolbar-left">
              <MultiStateGroup ariaLabel="Initiative ownership" value={initiativeScope} onValueChange={setInitiativeScope}>
                <MultiStateButton value="mine" label="Mine" />
                <MultiStateButton value="team" label="Team" />
                <MultiStateButton value="triage" label="Triage" />
              </MultiStateGroup>
              <CpButton className="cp-filter-chip"><span className="mini-badge">6</span></CpButton>
              <div className="cp-search" style={{ width: 178 }}>
                <CpSearchField ariaLabel="Search for initiative" placeholder="Search for initiative" value={query} onChange={setQuery} />
              </div>
            </div>
            <div className="cp-toolbar-right">
              <CpButton className="cp-small-button"><CpIcon icon={CP_FA.filter} size={12} />Filter</CpButton>
              <CpButton className="cp-icon-button cp-toolbar-icon" aria-label="Download initiatives"><CpIcon icon={CP_FA.download} size={15} /></CpButton>
              <CpButton className="cp-small-button">Sorted by: Newest <CpIcon icon={CP_FA.chevronDown} size={12} /></CpButton>
              <CpButton className="cp-small-button is-disabled">Add Initiative</CpButton>
            </div>
          </div>
          <div className="cp-filter-row">
            <Chip label="Client-Portal  x" variant="No Status" size="Small" />
            <CpButton className="cp-filter-chip" style={{ height: 24 }}>Clear all&nbsp; x</CpButton>
          </div>
          <div className="cp-initiative-list">
            {initiatives.map((initiative) => (
              <div className="cp-initiative-row" key={initiative.id}>
                <StatusPill status={initiative.status} label={initiative.status === "In flight" ? "In-Flight" : undefined} />
                <div className="cp-initiative-title">{initiative.id} | {initiative.title}</div>
                <div className="cp-row-actions">
                  <span className="cp-owner">Owner: <PersonAvatar person={initiative.owner} size="Extra Small" /></span>
                  <span className="cp-info-dot">i</span>
                  <div className="cp-rag-lock">Grey <CpIcon icon={CP_FA.lock} size={14} /></div>
                  <CpButton className="cp-view-button" onClick={onOpenInitiative}>View Initiative</CpButton>
                  <CpButton className="cp-action-square disabled" aria-label="Edit initiative"><CpIcon icon={CP_FA.pencil} size={13} /></CpButton>
                  <CpIcon icon={CP_FA.chevronDown} size={15} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

function BlueWorkspaceHeader() {
  const subtabs = ["Workspace", "Methodology", "Suppliers", "Initiative Milestones", "Initiative Benefits"];
  return (
    <>
      <ProjectHeader initiativeCrumb="CP001-1014 | sdasd" />
      <div className="cp-bluebar">
        <div className="cp-blue-title">CP001-1014 | sdasd</div>
        <nav className="cp-subtabs" aria-label="Initiative tabs">
          {subtabs.map((tab) => (
            <CpButton key={tab} className={`cp-subtab${tab === "Workspace" ? " is-active" : ""}`}>{tab}</CpButton>
          ))}
        </nav>
        <div className="cp-blue-actions">
          <CpIcon icon={CP_FA.hand} size={16} />
          <CpIcon icon={CP_FA.comment} size={15} />
          <CpIcon icon={CP_FA.pencil} size={15} />
          <CpButton className="cp-mini-menu"><Circle size={16} fill="#60656f" /><CpIcon icon={CP_FA.chevronDown} size={12} /></CpButton>
        </div>
      </div>
      <div className="cp-timeline">
        <div className="cp-timeline-track">
          <div className="cp-milestone is-start"><span className="cp-diamond start" /><span className="cp-timeline-date">2026-01-07</span></div>
          <div className="cp-line" />
          <div className="cp-milestone"><span className="cp-dot" /></div>
          <div className="cp-line" />
          <div className="cp-milestone"><span className="cp-dot" /></div>
          <div className="cp-line" />
          <div className="cp-milestone"><span className="cp-dot" /></div>
          <div className="cp-line" />
          <div className="cp-milestone"><span className="cp-dot" /></div>
          <div className="cp-line" />
          <div className="cp-milestone"><span className="cp-dot" /></div>
          <div className="cp-line" />
          <div className="cp-milestone"><span className="cp-dot" /></div>
          <div className="cp-line" />
          <div className="cp-milestone is-end"><span className="cp-diamond" /><span className="cp-timeline-date cp-date-right">2026-01-29</span></div>
        </div>
      </div>
    </>
  );
}

function InsightPanel() {
  return (
    <aside className="cp-insights">
      <div className="cp-insights-header">
        <span><CpIcon icon={CP_FA.sparkles} size={14} /> Insights for You</span>
        <CpIcon icon={CP_FA.arrowRight} size={16} />
      </div>
      <div className="cp-insight-panel">
        <h3>AI Tool Kit</h3>
        <p>Enhance each step of your workflow with AI! Explore the tools below.</p>
        <div className="cp-insight-list">
          {insights.map((insight, index) => (
            <div className="cp-insight-item" key={`${insight.title}-${index}`}>
              <span className="cp-ai-icon"><CpIcon icon={CP_FA.aiChip} size={18} /></span>
              <span>
                <span className="cp-insight-title">{insight.title}</span>
                <span className="cp-insight-meta">{insight.meta}</span>
              </span>
              <CpButton className="cp-sparkle-button" aria-label="Open insight"><CpIcon icon={CP_FA.sparkles} size={12} /></CpButton>
            </div>
          ))}
        </div>
      </div>
      <div className="cp-insight-footer">
        <CpButton className="cp-carousel-button" aria-label="Previous insight"><CpIcon icon={CP_FA.arrowLeft} size={15} /></CpButton>
        <span>Insight 1 / 2<br />See all</span>
        <CpButton className="cp-carousel-button" aria-label="Next insight"><CpIcon icon={CP_FA.arrowRight} size={15} /></CpButton>
      </div>
    </aside>
  );
}

function MetricBadges() {
  return (
    <span className="cp-accordion-badges">
      <span className="cp-tiny-metric"><CpIcon icon={CP_FA.file} size={13} />19</span>
      <span className="cp-tiny-metric"><CpIcon icon={FA.circleInfo} size={13} />0</span>
      <span className="cp-tiny-metric blue"><CpIcon icon={CP_FA.file} size={13} />0</span>
      <span className="cp-tiny-metric green"><CpIcon icon={CP_FA.clipboard} size={13} />0</span>
    </span>
  );
}

function CpWorkspaceResultsPanel({
  workflow,
  onViewResult,
}: {
  workflow: ClauseIqWorkflow;
  onViewResult: () => void;
}) {
  const rows = flattenSupplierAnalyses(workflow.resultsInitiative.suppliers).sort(
    (a, b) => Date.parse(a.analysis.analysedAt) - Date.parse(b.analysis.analysedAt),
  );
  const latestAnalysisId = rows.at(-1)?.analysis.id;

  if (rows.length === 0) return null;

  return (
    <div className="cp-clause-result-panel" data-prototype="clauseiq-v5" data-theme="orbit">
      <div className="clauseiq-responsive-output-panel mx-auto w-full max-w-[640px] space-y-orbit-m">
        <section className="min-w-0 space-y-orbit-base" aria-label="Analysis outputs by date">
          {rows.map(({ supplier, analysis }) => (
            <CpAnalysisCard
              key={analysis.id}
              analysis={analysis}
              supplier={supplier}
              showSupplier
              onDownload={workflow.actions.handleDownload}
              onViewResult={onViewResult}
              viewResultPrimary={analysis.id === latestAnalysisId}
              isLatestOutput={analysis.id === latestAnalysisId}
              highlighted={analysis.id === latestAnalysisId}
              analysisParameters={workflow.selectedAnalysisParameters}
            />
          ))}
        </section>
      </div>
    </div>
  );
}

function clauseIqLauncherLabel(workflow: ClauseIqWorkflow, hasOpened: boolean) {
  if (workflow.resultsVisible) return "View Analysis";
  if (workflow.step === "processing") return "Analysis running";
  if (hasOpened || workflow.step !== "welcome") return "Resume ClauseIQ";
  return "Get Started";
}

function ClauseIqLauncherCard({
  workflow,
  hasOpened,
  onNewAnalysis,
  onOpen,
  onOpenSupplierOutputs,
  onViewResult,
}: {
  workflow: ClauseIqWorkflow;
  hasOpened: boolean;
  onNewAnalysis: () => void;
  onOpen: () => void;
  onOpenSupplierOutputs: () => void;
  onViewResult: () => void;
}) {
  const label = clauseIqLauncherLabel(workflow, hasOpened);
  const helperCopy = workflow.resultsVisible
    ? "Your ClauseIQ analysis result is ready to review."
    : workflow.step === "processing"
      ? "ClauseIQ is finding clauses in the uploaded contract."
      : "Launch the guided ClauseIQ workflow for this CP initiative.";
  const actionDisabled = workflow.step === "processing";
  const actionLabel = workflow.resultsVisible ? "View Full Result" : label;
  const actionIcon = workflow.resultsVisible ? CP_FA.chart : workflow.step === "processing" ? CP_FA.magic : CP_FA.sparkles;
  const handleAction = () => {
    if (workflow.resultsVisible) {
      onViewResult();
      return;
    }
    if (workflow.step !== "processing") {
      onOpen();
    }
  };

  return (
    <div className="cp-accordion-body cp-clause-launcher-body">
      {!workflow.resultsVisible ? (
        <div className="cp-clause-launcher-card">
          <span className="cp-clause-launcher-icon"><CpIcon icon={CP_FA.aiChip} size={24} /></span>
          <span className="cp-clause-launcher-copy">
            <strong>ClauseIQ - Analyse your Contracts</strong>
            <span>{helperCopy}</span>
          </span>
          <CpButton className="cp-tool-action ready cp-clause-launcher-action" type="button" disabled={actionDisabled} onClick={handleAction}>
            {workflow.step === "processing" ? (
              <Loader2 className="cp-clause-analysis-loader" size={13} aria-hidden="true" />
            ) : (
              <CpIcon icon={actionIcon} size={13} />
            )}
            {actionLabel}
          </CpButton>
        </div>
      ) : null}
      {workflow.step === "processing" ? (
        <div className="cp-clause-analysis-status">
          <span className="cp-clause-analysis-status-icon" aria-hidden="true">
            <Loader2 className="cp-clause-analysis-loader" size={17} />
          </span>
          <span>
            <strong>Analysis submitted</strong>
            <span>
              ClauseIQ is reviewing {workflow.file?.name ?? "your contract"}. This can take up to 15 minutes, so you can continue working in the workspace.
            </span>
          </span>
        </div>
      ) : null}
      {workflow.resultsVisible ? (
        <div className="cp-clause-result-actions">
          <CpButton orbitVariant="Secondary" orbitSize="Small" onClick={onNewAnalysis}>
            New Analysis
          </CpButton>
          <CpButton orbitVariant="Secondary" orbitSize="Small" onClick={onOpenSupplierOutputs}>
            Supplier Analysis Output
          </CpButton>
        </div>
      ) : null}
      {workflow.resultsVisible ? (
        <CpWorkspaceResultsPanel workflow={workflow} onViewResult={onViewResult} />
      ) : null}
    </div>
  );
}

function CpClauseIqModalContent({
  workflow,
  onViewResult,
}: {
  workflow: ClauseIqWorkflow;
  onViewResult: () => void;
}) {
  const showInlineUpload = workflow.step === "parameters" || workflow.step === "upload";
  const parameterComplete = hasCompleteAnalysisParameters(workflow.selectedParameter);

  if (showInlineUpload) {
    return (
      <div className="space-y-orbit-base">
        <CpAnalysisParameterCards
          selectedParameter={workflow.selectedParameter}
          cardState="default"
          categoryCardState="default"
          locked={workflow.parameterLocked}
          onBasisSelect={workflow.actions.handleBasisSelect}
          onCategorySelect={workflow.actions.handleCategorySelect}
          onBasisEdit={workflow.actions.handleBasisEdit}
          onCategoryEdit={workflow.actions.handleCategoryEdit}
        />

        {parameterComplete ? (
          <CpStateCard state="default">
            <h2 className="v5-orbit-heading-5 mb-orbit-base">Upload Contract</h2>
            <CpPlaybookDisclaimer variant="callout" parameter={workflow.selectedParameter} />
            {workflow.file ? (
              <div className="mt-orbit-base">
                <CpSelectedFileRow file={workflow.file} onRemove={workflow.actions.clearFile} />
              </div>
            ) : (
              <CpClauseIqDropzone onFile={workflow.actions.validateAndSetFile} />
            )}
          </CpStateCard>
        ) : null}
      </div>
    );
  }

  if (workflow.resultsVisible) {
    return (
      <CpStateCard state="default">
        <h2 className="v5-orbit-heading-5 mb-orbit-base">Analysis Complete</h2>
        <p className="text-sm text-muted-foreground">
          Your ClauseIQ result is available in the workspace.
        </p>
      </CpStateCard>
    );
  }

  return (
    <CpClauseIqJourneyContent
      currentInitiativeCopy="Tied to the current CP initiative for traceable governance."
      initiativeLabel={CP_CLAUSEIQ_INITIATIVE_LABEL}
      initiativeMode="prebound"
      mode="single-step"
      onStartAnotherInitiative={() => workflow.actions.startAnotherInitiative(false)}
      onViewResult={onViewResult}
      renderSelectedFileRow={(file, onRemove) => (
        <CpSelectedFileRow file={file} onRemove={onRemove} />
      )}
      resultsLayout="output-panel"
      workflow={workflow}
    />
  );
}

function CpSupplierOutputsModal({
  workflow,
  onClose,
  onNewAnalysis,
  onViewResult,
}: {
  workflow: ClauseIqWorkflow;
  onClose: () => void;
  onNewAnalysis: () => void;
  onViewResult: () => void;
}) {
  const [showPastAnalyses, setShowPastAnalyses] = useState(false);
  const outputInitiative = showPastAnalyses ? mockInitiative : workflow.resultsInitiative;

  return (
    <div className="cp-modal-backdrop cp-supplier-output-modal-backdrop">
      <div
        className="cp-supplier-output-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Supplier Analysis Output"
      >
        <header className="cp-supplier-output-modal-header">
          <div>
            <div className="cp-supplier-output-modal-title">Supplier Analysis Output</div>
          </div>
          <CpButton className="cp-close" type="button" onClick={onClose} aria-label="Close supplier analysis output">
            <X size={18} />
          </CpButton>
        </header>
        <div className="cp-supplier-output-modal-body" data-prototype="clauseiq-v5" data-theme="orbit">
          <CpSupplierOutputsPanel
            key={showPastAnalyses ? "past-analyses" : "current-analysis"}
            initiative={outputInitiative}
            initialOutputScope={showPastAnalyses ? "team" : "mine"}
            outputState="filled"
            onRunAgain={onNewAnalysis}
            onDownload={workflow.actions.handleDownload}
            onViewResult={onViewResult}
            className="cp-supplier-output-panel-modal"
          />
        </div>
        <footer className="cp-supplier-output-modal-footer">
          <CpButton className="cp-footer-btn" type="button" onClick={onClose}>
            Close
          </CpButton>
          <div className="cp-supplier-output-demo-toggle cp-supplier-output-demo-toggle-footer">
            <span>
              <strong>Show Past Analyses</strong>
            </span>
            <CpButton
              className={cn("cp-switch", showPastAnalyses && "is-on")}
              type="button"
              role="switch"
              aria-checked={showPastAnalyses}
              aria-label="Show past analyses"
              onClick={() => setShowPastAnalyses((current) => !current)}
            >
              <span />
            </CpButton>
          </div>
        </footer>
      </div>
    </div>
  );
}

function CpClauseIqModal({
  workflow,
  onClose,
  onViewResult,
}: {
  workflow: ClauseIqWorkflow;
  onClose: () => void;
  onViewResult: () => void;
}) {
  const stepIndex = getCpClauseIqStepIndex(workflow.step);
  const footer = getCpClauseIqFooterState(workflow, {
    initiativeMode: "prebound",
    onViewResult,
  });
  const primaryLabel = workflow.step === "upload" ? "Start Analysis" : footer.label;
  const handlePrimaryAction = () => {
    if (workflow.step === "upload") {
      workflow.actions.startProcessing();
      onClose();
      return;
    }
    footer.onClick();
  };

  const handleBack = () => {
    if (workflow.step === "select") workflow.actions.setStep("welcome");
    if (workflow.step === "parameters") workflow.actions.setStep("welcome");
    if (workflow.step === "upload") workflow.actions.setStep("parameters");
    if (workflow.step === "results" && workflow.rerunUploadVisible) workflow.actions.setStep("results");
  };

  const backDisabled = workflow.step === "welcome" || workflow.step === "processing" || workflow.step === "results";
  const showBackButton = !backDisabled;

  return (
    <div className="cp-modal-backdrop cp-clause-modal-backdrop">
      <div className="cp-clause-modal" role="dialog" aria-modal="true" aria-label="ClauseIQ workflow">
        <header className="cp-clause-modal-header">
          <div>
            <div className="cp-clause-modal-title">ClauseIQ</div>
          </div>
          <CpButton className="cp-close" type="button" onClick={onClose} aria-label="Close ClauseIQ workflow">
            <X size={18} />
          </CpButton>
        </header>

        <CpClauseIqModalStepper step={workflow.step} />

        <div className="cp-clause-modal-body" data-prototype="clauseiq-v5" data-theme="orbit">
          <main className="cp-clause-modal-main">
            <CpClauseIqModalContent workflow={workflow} onViewResult={onViewResult} />
          </main>
        </div>

        <footer className="cp-clause-modal-footer">
          <div className="cp-footer-left">
            <CpButton className="cp-footer-btn" type="button" onClick={onClose}>Close</CpButton>
            {showBackButton ? (
              <CpButton className="cp-footer-btn" type="button" onClick={handleBack}>Back</CpButton>
            ) : null}
          </div>
          <div className="cp-footer-right">
            <span className="cp-clause-modal-progress">Step {Math.max(stepIndex + 1, 1)} of {CP_CLAUSEIQ_STEPS.length}</span>
            <CpButton className="cp-footer-btn primary" type="button" disabled={footer.disabled} onClick={handlePrimaryAction}>
              {primaryLabel}
            </CpButton>
          </div>
        </footer>
      </div>
    </div>
  );
}

function CpClauseIqModalStepper({ step }: { step: ClauseIqWorkflowStep }) {
  const activeIndex = getCpClauseIqStepIndex(step);

  return (
    <nav className="cp-clause-modal-stepper" aria-label="ClauseIQ workflow steps">
      {CP_CLAUSEIQ_STEPS.map((item, index) => {
        const complete = index < activeIndex;
        const active = index === activeIndex;
        return (
          <div key={item.key} className={cn("cp-clause-modal-step", active && "is-active", complete && "is-complete")}>
            <span className="cp-clause-modal-step-dot">{complete ? <CpIcon icon={CP_FA.check} size={12} /> : index + 1}</span>
            <span>{item.label}</span>
          </div>
        );
      })}
    </nav>
  );
}

function CpSelectedFileRow({ file, onRemove }: { file: File; onRemove: () => void }) {
  return <CpFileRow className="cp-selected-file-row" fileName={file.name} onRemove={onRemove} removeLabel={`Remove ${file.name}`} />;
}

function WorkspaceView() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [clauseModalOpen, setClauseModalOpen] = useState(false);
  const [clauseModalOpened, setClauseModalOpened] = useState(false);
  const [supplierOutputModalOpen, setSupplierOutputModalOpen] = useState(false);
  const canvasRef = useRef<HTMLElement | null>(null);
  const handleProcessingComplete = useCallback(() => {
    setClauseModalOpen(false);
  }, []);
  const workflow = useClauseIqWorkflow({
    autoStartProcessingOnFile: true,
    initialInitiative: CP_CLAUSEIQ_INITIATIVE,
    onProcessingComplete: handleProcessingComplete,
    useFirstRunResults: true,
  });

  const viewResult = () => navigate(PROTOTYPE_CP_RESULT_ROUTE);
  const clauseIqOpen = expanded === "ClauseIQ - Analyse your contracts";
  const openClauseModal = () => {
    setClauseModalOpened(true);
    setClauseModalOpen(true);
  };
  const openNewAnalysis = () => {
    workflow.actions.startAnotherInitiative(false);
    setClauseModalOpened(false);
    setSupplierOutputModalOpen(false);
    setClauseModalOpen(true);
  };
  const openSupplierOutputModal = () => {
    setSupplierOutputModalOpen(true);
  };
  const closeSupplierOutputModal = () => {
    setSupplierOutputModalOpen(false);
  };

  useEffect(() => {
    if (clauseIqOpen) {
      requestAnimationFrame(() => {
        if (canvasRef.current) canvasRef.current.scrollTop = 110;
      });
    }
  }, [clauseIqOpen]);

  return (
    <>
      <BlueWorkspaceHeader />
      <main className="cp-workspace-canvas" ref={canvasRef}>
        <div className="cp-workspace-inner">
          <div className="cp-accordion-stack">
            <section className="cp-milestone-card">
              <div className="cp-milestone-title">
                <span className="cp-diamond" />
                <span>Initiative Complete.</span>
                <div className="cp-milestone-meta">
                  <PersonAvatar person={people.pm} size="Extra Small" />
                  <CpIcon icon={FA.circleInfo} size={13} /> 2026-01-29 <span className="cp-overdue">(119 days ago)</span>
                  <span className="cp-overdue-pill">Overdue</span>
                  <CpButton className="cp-mark-complete"><CpIcon icon={CP_FA.check} size={13} /> Mark complete</CpButton>
                </div>
              </div>
              <div style={{ color: "#6a707b" }}>No description added to this milestone yet. To add a description, go to the “Initiative milestones” tab and edit your milestone description.</div>
            </section>
            {workspaceSections.map((section) => {
              const isClause = section.startsWith("ClauseIQ");
              const isOpen = expanded === section;
              const isSummaryRow = section === "Milestone Deliverables" || section === "Guidance & Resources" || section === "Task Manager";
              return (
                <section className={`cp-accordion${isSummaryRow ? " is-summary-row" : ""}`} key={section}>
                  <CpButton className="cp-accordion-head" onClick={() => setExpanded(isOpen ? null : section)}>
                    {isClause ? <CpIcon icon={CP_FA.wrench} size={15} /> : section === "Milestone Deliverables" ? <CpIcon icon={CP_FA.file} size={15} /> : section === "Guidance & Resources" ? <Circle size={15} /> : section === "Task Manager" ? <CpIcon icon={CP_FA.list} size={14} /> : <CpIcon icon={CP_FA.wrench} size={15} />}
                    <span>{section}</span>
                    {section === "Milestone Deliverables" ? <MetricBadges /> : null}
                    {section === "Guidance & Resources" ? <span className="cp-tiny-metric">Steps (6)</span> : null}
                    {section === "Task Manager" ? (
                      <span className="cp-accordion-badges">
                        <span className="cp-tiny-metric">To-Do (0)</span>
                        <span className="cp-tiny-metric">In-Progress (0)</span>
                        <span className="cp-tiny-metric green">Done (0)</span>
                      </span>
                    ) : null}
                    <CpIcon icon={isOpen ? CP_FA.chevronUp : CP_FA.chevronDown} size={15} />
                  </CpButton>
                  {isClause && isOpen ? (
                    <ClauseIqLauncherCard
                      workflow={workflow}
                      hasOpened={clauseModalOpened}
                      onNewAnalysis={openNewAnalysis}
                      onOpen={openClauseModal}
                      onOpenSupplierOutputs={openSupplierOutputModal}
                      onViewResult={viewResult}
                    />
                  ) : null}
                </section>
              );
            })}
          </div>
          <InsightPanel />
        </div>
      </main>
      {clauseModalOpen ? (
        <CpClauseIqModal
          workflow={workflow}
          onClose={() => setClauseModalOpen(false)}
          onViewResult={viewResult}
        />
      ) : null}
      {supplierOutputModalOpen && workflow.resultsVisible ? (
        <CpSupplierOutputsModal
          workflow={workflow}
          onClose={closeSupplierOutputModal}
          onNewAnalysis={openNewAnalysis}
          onViewResult={viewResult}
        />
      ) : null}
    </>
  );
}

export default function PrototypeCP() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = getCpViewFromSearchParams(searchParams);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const setView = (nextView: CpView) => {
    const next = new URLSearchParams(searchParams);
    if (nextView === "projects") {
      next.delete("view");
    } else {
      next.set("view", nextView);
    }
    setSearchParams(next);
  };

  return (
    <div className="prototype-cp">
      <div className="cp-app">
        <CpRail />
        <section className="cp-main">
          {view === "projects" ? (
            <ProjectsView
              expandedProject={expandedProject}
              setExpandedProject={setExpandedProject}
              onViewProject={() => setView("initiatives")}
            />
          ) : null}
          {view === "initiatives" ? <InitiativesView onOpenInitiative={() => setView("workspace")} /> : null}
          {view === "workspace" ? <WorkspaceView /> : null}
        </section>
        <CpButton className="cp-floating-jasper"><CpIcon icon={CP_FA.sparkles} size={13} />Ask Jasper</CpButton>
        <CpButton className="cp-floating-help" aria-label="Help">?</CpButton>
      </div>
      <V5OrbitToastHost />
    </div>
  );
}
