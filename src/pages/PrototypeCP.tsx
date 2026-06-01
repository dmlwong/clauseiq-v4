import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import "@orbit-tokens";
import "@orbit-fonts";
import "@/components/clauseiq-v5/orbit-theme.css";
import { Avatar, Chip, FaIcon, FA } from "@orbit";
import {
  Check,
  Circle,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  AnalysisParameterCards as SharedAnalysisParameterCards,
  ClauseIqDropzone as SharedClauseIqDropzone,
  ClauseIqOverviewCard as SharedClauseIqOverviewCard,
  LATEST_V5_RESULTS_ROUTE,
  NewAnalysisDivider as SharedNewAnalysisDivider,
  PlaybookDisclaimer as SharedPlaybookDisclaimer,
  PostAnalysisNextActions as SharedPostAnalysisNextActions,
  SelectedSummaryRow as SharedSelectedSummaryRow,
  hasCompleteAnalysisParameters,
  useClauseIqWorkflow,
  type ClauseIqWorkflow,
  type ClauseIqWorkflowStep,
} from "@/components/clauseiq-v5/ClauseIqWorkflow";
import { StateCard } from "@/components/clauseiq-v5/StateCard";
import { V5OrbitToastHost } from "@/components/clauseiq-v5/V5OrbitToast";
import {
  AnalysisCard,
  ResultsContent,
  SupplierOutputsPanel,
} from "@/components/clauseiq-v5/supplier-results";
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
import { cn } from "@/lib/utils";
import "./PrototypeCP.css";

type CpView = "projects" | "initiatives" | "workspace";

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
const CP_MODAL_STEPS: Array<{ key: ClauseIqWorkflowStep; label: string }> = [
  { key: "welcome", label: "Overview" },
  { key: "parameters", label: "Configure" },
  { key: "upload", label: "Upload" },
  { key: "processing", label: "Analysing" },
  { key: "results", label: "Results" },
];

const CP_FA = {
  admin: "\uf0c0",
  aiChip: "\uf544",
  angleDown: FA.angleDown,
  angleUp: FA.angleUp,
  arrowLeft: "\uf060",
  arrowRight: "\uf061",
  bell: "\uf0f3",
  briefcase: "\uf0b1",
  chart: "\uf080",
  check: FA.check,
  chevronDown: FA.angleDown,
  chevronUp: FA.angleUp,
  clipboard: "\uf328",
  cloud: "\uf0c2",
  comment: "\uf075",
  download: "\uf019",
  ellipsis: "\uf141",
  file: FA.file,
  filter: "\uf0b0",
  globe: "\uf0ac",
  hand: "\uf256",
  home: "\uf015",
  info: FA.circleInfo,
  lightbulb: "\uf0eb",
  list: "\uf03a",
  lock: "\uf023",
  magic: "\ue2ca",
  pencil: "\uf303",
  projects: "\uf542",
  question: FA.circleQuestion,
  route: "\uf4d7",
  search: "\uf002",
  sparkles: "\ue5d6",
  trash: "\uf1f8",
  upload: "\uf093",
  userGroup: "\uf0c0",
  wrench: "\uf0ad",
};

function CpIcon({ icon, size = 14, color }: { icon: string; size?: number; color?: string }) {
  return <FaIcon icon={icon} size={size} color={color ?? "currentColor"} />;
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
    <label className="cp-search-field" aria-label={ariaLabel}>
      <CpIcon icon={CP_FA.search} size={13} />
      <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
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
  return <span className={`cp-status-pill ${statusClass[status]}`}>{label ?? status}</span>;
}

function RailButton({
  icon,
  active,
  boxed,
  badge,
  label,
}: {
  icon: ReactNode;
  active?: boolean;
  boxed?: boolean;
  badge?: string;
  label: string;
}) {
  return (
    <button className={`cp-rail-button${active ? " is-active" : ""}${boxed ? " is-boxed" : ""}`} aria-label={label}>
      {icon}
      {badge ? <span className="cp-rail-badge">{badge}</span> : null}
    </button>
  );
}

function CpRail() {
  return (
    <aside className="cp-rail" aria-label="Connected Platform navigation">
      <div className="cp-mark" aria-hidden="true" />
      <div className="cp-dev">DEV</div>
      <div className="cp-rail-items">
        <RailButton icon={<CpIcon icon={CP_FA.bell} size={15} />} label="Notifications" badge="3" boxed />
        <RailButton icon={<CpIcon icon={CP_FA.home} size={15} />} label="Home" />
        <RailButton icon={<CpIcon icon={CP_FA.chart} size={15} />} label="Dashboard" />
        <RailButton icon={<CpIcon icon={CP_FA.projects} size={15} />} label="Projects and initiatives" active />
        <RailButton icon={<CpIcon icon={CP_FA.file} size={15} />} label="Documents" />
        <RailButton icon={<CpIcon icon={CP_FA.briefcase} size={15} />} label="Automation" />
        <RailButton icon={<CpIcon icon={CP_FA.userGroup} size={15} />} label="Teams" />
        <RailButton icon={<CpIcon icon={CP_FA.clipboard} size={15} />} label="Reports" />
        <RailButton icon={<CpIcon icon={CP_FA.sparkles} size={16} />} label="AI tools" />
      </div>
      <div className="cp-rail-bottom">
        <RailButton icon={<CpIcon icon={CP_FA.admin} size={14} />} label="Admin" />
        <RailButton icon={<CpIcon icon={CP_FA.question} size={14} />} label="Help" />
        <div className="cp-user-dot">DW</div>
      </div>
    </aside>
  );
}

function HeaderActions({ uploadCount = "47", showCloud = false }: { uploadCount?: string; showCloud?: boolean }) {
  return (
    <div className="cp-header-actions">
      <button className="cp-icon-button" aria-label="Upload">
        <CpIcon icon={CP_FA.upload} size={14} />
        {uploadCount ? <span className="cp-yellow-count">{uploadCount}</span> : null}
      </button>
      <button className="cp-icon-button" aria-label="Guidance">
        <CpIcon icon={CP_FA.hand} size={17} color="#f0ab00" />
      </button>
      {showCloud ? (
        <button className="cp-icon-button muted" aria-label="Cloud disabled">
          <CpIcon icon={CP_FA.cloud} size={15} />
        </button>
      ) : null}
    </div>
  );
}

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
            <button className="cp-action-square disabled" aria-label="Refresh disabled"><CpIcon icon={CP_FA.globe} size={15} /></button>
            <button className="cp-action-square" aria-label="Ideas"><CpIcon icon={CP_FA.lightbulb} size={15} /></button>
            <button className="cp-action-square" aria-label="Edit"><CpIcon icon={CP_FA.pencil} size={14} /></button>
            <button className="cp-action-square" aria-label={expanded ? "Collapse project" : "Expand project"} onClick={onToggle}>
              <CpIcon icon={expanded ? CP_FA.chevronUp : CP_FA.chevronDown} size={15} />
            </button>
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
                    <button className="cp-view-button" onClick={onViewProject}>View Project</button>
                    <button className="cp-more-button" aria-label="More project actions"><CpIcon icon={CP_FA.ellipsis} size={17} /></button>
                  </div>
                </div>
                <table className="cp-table">
                  <thead>
                    <tr>
                      <th>Categories</th>
                      <th>ServiceLines</th>
                      <th>Initiatives</th>
                      <th>Team</th>
                      <th>Project Est. Savings <span className="cp-info-dot">i</span></th>
                      <th>Project Est. Spend <span className="cp-info-dot">i</span></th>
                      <th>Savings vs Baseline (Annualised) <span className="cp-info-dot">i</span></th>
                      <th>Mid Target (Savings Delta) <span className="cp-info-dot">i</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{workstream.categories}</td>
                      <td>{workstream.serviceLines}</td>
                      <td>{workstream.initiatives}</td>
                      <td>{workstream.teamSize}</td>
                      <td className="muted-cell">-</td>
                      <td className="muted-cell">-</td>
                      <td>-&nbsp; ( - | 0% )</td>
                      <td><span className="cp-negative">▼</span> 0K GBP ( -0K GBP )</td>
                    </tr>
                  </tbody>
                </table>
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
  return (
    <>
      <ProjectsTopbar />
      <main className="cp-canvas">
        <div className="cp-canvas-inner">
          <div className="cp-controls">
            <div className="cp-segment" role="tablist" aria-label="Project status">
              <button className="is-active">All</button>
              <button>Active</button>
            </div>
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
              <button key={tab} className={`cp-main-tab${tab === activeTab ? " is-active" : ""}`}>
                {tab}{tab === "Settings" ? <CpIcon icon={CP_FA.chevronDown} size={11} /> : null}
              </button>
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
  return (
    <>
      <ProjectHeader />
      <main className="cp-canvas">
        <div className="cp-canvas-inner">
          <div className="cp-initiative-toolbar">
            <div className="cp-toolbar-left">
              <div className="cp-segment">
                <button>Mine</button>
                <button className="is-active">Team</button>
                <button>Triage</button>
              </div>
              <button className="cp-filter-chip"><span className="mini-badge">6</span></button>
              <div className="cp-search" style={{ width: 178 }}>
                <CpSearchField ariaLabel="Search for initiative" placeholder="Search for initiative" value={query} onChange={setQuery} />
              </div>
            </div>
            <div className="cp-toolbar-right">
              <button className="cp-small-button"><CpIcon icon={CP_FA.filter} size={12} />Filter</button>
              <button className="cp-icon-button cp-toolbar-icon" aria-label="Download initiatives"><CpIcon icon={CP_FA.download} size={15} /></button>
              <button className="cp-small-button">Sorted by: Newest <CpIcon icon={CP_FA.chevronDown} size={12} /></button>
              <button className="cp-small-button is-disabled">Add Initiative</button>
            </div>
          </div>
          <div className="cp-filter-row">
            <Chip label="Client-Portal  x" variant="No Status" size="Small" />
            <button className="cp-filter-chip" style={{ height: 24 }}>Clear all&nbsp; x</button>
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
                  <button className="cp-view-button" onClick={onOpenInitiative}>View Initiative</button>
                  <button className="cp-action-square disabled" aria-label="Edit initiative"><CpIcon icon={CP_FA.pencil} size={13} /></button>
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
            <button key={tab} className={`cp-subtab${tab === "Workspace" ? " is-active" : ""}`}>{tab}</button>
          ))}
        </nav>
        <div className="cp-blue-actions">
          <CpIcon icon={CP_FA.hand} size={16} />
          <CpIcon icon={CP_FA.comment} size={15} />
          <CpIcon icon={CP_FA.pencil} size={15} />
          <button className="cp-mini-menu"><Circle size={16} fill="#60656f" /><CpIcon icon={CP_FA.chevronDown} size={12} /></button>
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
              <button className="cp-sparkle-button" aria-label="Open insight"><CpIcon icon={CP_FA.sparkles} size={12} /></button>
            </div>
          ))}
        </div>
      </div>
      <div className="cp-insight-footer">
        <button className="cp-carousel-button" aria-label="Previous insight"><CpIcon icon={CP_FA.arrowLeft} size={15} /></button>
        <span>Insight 1 / 2<br />See all</span>
        <button className="cp-carousel-button" aria-label="Next insight"><CpIcon icon={CP_FA.arrowRight} size={15} /></button>
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

function clauseIqLauncherLabel(workflow: ClauseIqWorkflow, hasOpened: boolean) {
  if (workflow.resultsVisible) return "View Analysis";
  if (hasOpened || workflow.step !== "welcome") return "Resume ClauseIQ";
  return "Get Started";
}

function ClauseIqLauncherCard({
  workflow,
  hasOpened,
  onOpen,
}: {
  workflow: ClauseIqWorkflow;
  hasOpened: boolean;
  onOpen: () => void;
}) {
  const label = clauseIqLauncherLabel(workflow, hasOpened);
  const helperCopy = workflow.resultsVisible
    ? "Your ClauseIQ analysis result is ready to review."
    : workflow.step === "processing"
      ? "ClauseIQ is finding clauses in the uploaded contract."
      : "Launch the guided ClauseIQ workflow for this CP initiative.";

  return (
    <div className="cp-accordion-body cp-clause-launcher-body">
      <div className="cp-clause-launcher-card">
        <span className="cp-clause-launcher-icon"><CpIcon icon={CP_FA.aiChip} size={24} /></span>
        <span className="cp-clause-launcher-copy">
          <strong>ClauseIQ - Analyse your Contracts</strong>
          <span>{helperCopy}</span>
        </span>
        <button className="cp-tool-action ready cp-clause-launcher-action" type="button" onClick={onOpen}>
          <CpIcon icon={workflow.resultsVisible ? CP_FA.chart : CP_FA.sparkles} size={13} />
          {label}
        </button>
      </div>
    </div>
  );
}

function cpWorkflowStepIndex(step: ClauseIqWorkflowStep) {
  if (step === "select") return 0;
  return CP_MODAL_STEPS.findIndex((item) => item.key === step);
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
  const stepIndex = cpWorkflowStepIndex(workflow.step);
  const parameterComplete = hasCompleteAnalysisParameters(workflow.selectedParameter);
  const hasContractFile = Boolean(workflow.file);
  const footer = useMemo(() => {
    if (workflow.step === "welcome") {
      return { label: "Start", disabled: false, onClick: () => workflow.actions.setStep("parameters") };
    }
    if (workflow.step === "select") {
      return { label: "Continue", disabled: false, onClick: workflow.actions.startParameters };
    }
    if (workflow.step === "parameters") {
      return { label: "Continue", disabled: !parameterComplete, onClick: workflow.actions.setUploadStep };
    }
    if (workflow.step === "upload") {
      return { label: "Run Analysis", disabled: !hasContractFile, onClick: () => workflow.actions.startProcessing() };
    }
    if (workflow.step === "processing") {
      return { label: "Analysing", disabled: true, onClick: () => undefined };
    }
    return { label: "View Full Result", disabled: false, onClick: onViewResult };
  }, [hasContractFile, onViewResult, parameterComplete, workflow.actions, workflow.step]);

  const handleBack = () => {
    if (workflow.step === "select") workflow.actions.setStep("welcome");
    if (workflow.step === "parameters") workflow.actions.setStep("welcome");
    if (workflow.step === "upload") workflow.actions.setStep("parameters");
    if (workflow.step === "results" && workflow.rerunUploadVisible) workflow.actions.setStep("results");
  };

  const backDisabled = workflow.step === "welcome" || workflow.step === "processing" || workflow.step === "results";

  return (
    <div className="cp-modal-backdrop cp-clause-modal-backdrop">
      <div className="cp-clause-modal" role="dialog" aria-modal="true" aria-label="ClauseIQ workflow">
        <header className="cp-clause-modal-header">
          <div>
            <div className="cp-clause-modal-title">ClauseIQ</div>
            <div className="cp-clause-modal-subtitle">{CP_CLAUSEIQ_INITIATIVE_LABEL}</div>
          </div>
          <button className="cp-close" type="button" onClick={onClose} aria-label="Close ClauseIQ workflow">
            <X size={18} />
          </button>
        </header>

        <CpClauseIqModalStepper step={workflow.step} />

        <div className="cp-clause-modal-body" data-prototype="clauseiq-v5" data-theme="orbit">
          <main className="cp-clause-modal-main">
            <CpClauseIqModalStepContent workflow={workflow} onViewResult={onViewResult} />
          </main>
          <CpClauseIqModalSidePanel workflow={workflow} onViewResult={onViewResult} />
        </div>

        <footer className="cp-clause-modal-footer">
          <div className="cp-footer-left">
            <button className="cp-footer-btn" type="button" onClick={onClose}>Close</button>
            <button className="cp-footer-btn" type="button" disabled={backDisabled} onClick={handleBack}>Back</button>
          </div>
          <div className="cp-footer-right">
            <span className="cp-clause-modal-progress">Step {Math.max(stepIndex + 1, 1)} of {CP_MODAL_STEPS.length}</span>
            <button className="cp-footer-btn primary" type="button" disabled={footer.disabled} onClick={footer.onClick}>
              {footer.label}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function CpClauseIqModalStepper({ step }: { step: ClauseIqWorkflowStep }) {
  const activeIndex = cpWorkflowStepIndex(step);

  return (
    <nav className="cp-clause-modal-stepper" aria-label="ClauseIQ workflow steps">
      {CP_MODAL_STEPS.map((item, index) => {
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

function CpClauseIqModalSidePanel({
  workflow,
  onViewResult,
}: {
  workflow: ClauseIqWorkflow;
  onViewResult: () => void;
}) {
  if (workflow.step === "processing" || workflow.resultsVisible) {
    return (
      <aside className="cp-clause-modal-side">
        <SupplierOutputsPanel
          initiative={workflow.supplierOutputInitiative}
          outputState={workflow.supplierOutputPanelState}
          onRunAgain={workflow.actions.showRunAgainUpload}
          onDownload={workflow.actions.handleDownload}
          onViewResult={onViewResult}
        />
      </aside>
    );
  }

  const parameterCopy = workflow.selectedParameter?.basis
    ? workflow.selectedParameter.category
      ? `${workflow.selectedParameter.basis.kind}: ${workflow.selectedParameter.basis.label}; Category: ${workflow.selectedParameter.category}`
      : `${workflow.selectedParameter.basis.kind}: ${workflow.selectedParameter.basis.label}`
    : "Choose how ClauseIQ should benchmark this contract.";

  return (
    <aside className="cp-clause-modal-side cp-clause-assist-panel">
      <div>
        <div className="cp-assist-eyebrow">Current context</div>
        <h3>{CP_CLAUSEIQ_INITIATIVE_LABEL}</h3>
        <p>ClauseIQ is bound to this initiative, so setup can stay focused on contract details.</p>
      </div>
      <div className="cp-assist-summary">
        <div>
          <span>Analysis basis</span>
          <strong>{parameterCopy}</strong>
        </div>
        <div>
          <span>Contract file</span>
          <strong>{workflow.file?.name ?? "No file selected"}</strong>
        </div>
      </div>
      <div className="cp-assist-tip">
        Supplier outputs will appear here after the analysis starts.
      </div>
    </aside>
  );
}

function CpSelectedFileRow({ file, onRemove }: { file: File; onRemove: () => void }) {
  return (
    <div className="cp-selected-file-row">
      <span className="cp-selected-file-icon"><CpIcon icon={CP_FA.file} size={14} /></span>
      <span className="cp-selected-file-name">{file.name}</span>
      <button type="button" className="cp-selected-file-remove" onClick={onRemove} aria-label={`Remove ${file.name}`}>
        <CpIcon icon={CP_FA.trash} size={13} />
      </button>
    </div>
  );
}

function CpClauseIqModalStepContent({
  workflow,
  onViewResult,
}: {
  workflow: ClauseIqWorkflow;
  onViewResult: () => void;
}) {
  if (workflow.step === "welcome") {
    return (
      <div className="space-y-orbit-base">
        <SharedClauseIqOverviewCard
          step={workflow.step}
          currentInitiativeCopy="Tied to the current CP initiative for traceable governance."
        />
        <StateCard state="default">
          <h2 className="v5-orbit-heading-5 mb-orbit-base">Current Initiative</h2>
          <SharedSelectedSummaryRow
            label={CP_CLAUSEIQ_INITIATIVE_LABEL}
            disabled
            actionLabel="Edit"
            onAction={() => undefined}
          />
        </StateCard>
      </div>
    );
  }

  if (workflow.step === "select") {
    return (
      <StateCard state="default">
        <h2 className="v5-orbit-heading-5 mb-orbit-base">Initiative Selected</h2>
        <SharedSelectedSummaryRow
          label={CP_CLAUSEIQ_INITIATIVE_LABEL}
          disabled
          actionLabel="Edit"
          onAction={() => undefined}
        />
      </StateCard>
    );
  }

  if (workflow.step === "parameters") {
    return (
      <SharedAnalysisParameterCards
        selectedParameter={workflow.selectedParameter}
        cardState={workflow.selectedParameter?.basis ? "default" : "active"}
        locked={workflow.parameterLocked}
        onBasisSelect={workflow.actions.handleBasisSelect}
        onCategorySelect={workflow.actions.handleCategorySelect}
        onBasisEdit={workflow.actions.handleBasisEdit}
        onCategoryEdit={workflow.actions.handleCategoryEdit}
      />
    );
  }

  if (workflow.step === "upload") {
    return (
      <StateCard state="active">
        <h2 className="v5-orbit-heading-5 mb-orbit-base">Upload Contract</h2>
        <SharedPlaybookDisclaimer variant="callout" parameter={workflow.selectedParameter} />
        <SharedClauseIqDropzone onFile={workflow.actions.validateAndSetFile} />
        {workflow.file ? (
          <div className="mt-orbit-base">
            <CpSelectedFileRow file={workflow.file} onRemove={workflow.actions.clearFile} />
          </div>
        ) : null}
      </StateCard>
    );
  }

  if (workflow.step === "processing") {
    return (
      <StateCard state="active">
        <h2 className="v5-orbit-heading-5 mb-orbit-base">Analysing Your Contract</h2>
        <div className="flex items-center justify-between border border-border rounded-lg px-orbit-base py-orbit-s mb-orbit-base">
          <div className="flex items-center gap-orbit-s min-w-0">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm truncate">{workflow.file?.name ?? "Contract.pdf"}</span>
          </div>
          <span className="text-xs v5-orbit-weight-medium text-success inline-flex items-center gap-orbit-xs">
            <Check className="h-3.5 w-3.5" /> Uploaded
          </span>
        </div>
        <div className="flex items-center gap-orbit-base py-orbit-s">
          <Loader2 className="h-5 w-5 animate-spin text-ciq" />
          <span className="text-sm v5-orbit-weight-medium">Finding clauses in your contract...</span>
        </div>
        <SharedPlaybookDisclaimer variant="inline" parameter={workflow.selectedParameter} />
        <p className="text-xs text-muted-foreground mt-orbit-s">
          This may take a moment. We will notify you when the analysis is completed.
        </p>
      </StateCard>
    );
  }

  return (
    <div className="space-y-orbit-base">
      <ResultsContent
        initiative={workflow.resultsInitiative}
        layout="output-panel"
        onRunAgain={workflow.actions.showRunAgainUpload}
        onViewResult={onViewResult}
        viewResultPrimary={!workflow.newAnalysisSectionVisible}
        highlightLatestOutput={!workflow.newAnalysisSectionVisible}
        analysisParameters={workflow.selectedAnalysisParameters}
      />
      {workflow.newAnalysisSectionVisible && <SharedNewAnalysisDivider />}
      {workflow.rerunUploadVisible && (
        <div className="space-y-orbit-base">
          <SharedAnalysisParameterCards
            selectedParameter={workflow.rerunSelectedParameter}
            cardState={hasCompleteAnalysisParameters(workflow.rerunSelectedParameter) ? "default" : "active"}
            onBasisSelect={workflow.actions.handleRerunBasisSelect}
            onCategorySelect={workflow.actions.handleRerunCategorySelect}
            onBasisEdit={workflow.actions.handleRerunBasisEdit}
            onCategoryEdit={workflow.actions.handleRerunCategoryEdit}
          />

          {hasCompleteAnalysisParameters(workflow.rerunSelectedParameter) && (
            <StateCard state="active">
              <h2 className="v5-orbit-heading-5 mb-orbit-base">Upload Contract</h2>
              <SharedPlaybookDisclaimer variant="callout" parameter={workflow.rerunSelectedParameter} />
              <SharedClauseIqDropzone onFile={workflow.actions.validateAndSetFile} />
            </StateCard>
          )}
        </div>
      )}
      {workflow.rerunProcessing && (
        <StateCard state="active">
          <h2 className="v5-orbit-heading-5 mb-orbit-base">Analysing New Contract</h2>
          <div className="flex items-center justify-between border border-border rounded-lg px-orbit-base py-orbit-s mb-orbit-base">
            <div className="flex items-center gap-orbit-s min-w-0">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm truncate">{workflow.file?.name ?? "Contract.pdf"}</span>
            </div>
            <span className="text-xs v5-orbit-weight-medium text-success inline-flex items-center gap-orbit-xs">
              <Check className="h-3.5 w-3.5" /> Uploaded
            </span>
          </div>
          <div className="flex items-center gap-orbit-base py-orbit-s">
            <Loader2 className="h-5 w-5 animate-spin text-ciq" />
            <span className="text-sm v5-orbit-weight-medium">Finding clauses in your new contract...</span>
          </div>
          <SharedPlaybookDisclaimer variant="inline" parameter={workflow.rerunSelectedParameter ?? workflow.selectedParameter} />
          <p className="text-xs text-muted-foreground mt-orbit-s">
            The existing analysis history remains available above while this runs.
          </p>
        </StateCard>
      )}
      {workflow.completedRerunAnalysis && workflow.rerunSupplier && (
        <AnalysisCard
          analysis={workflow.completedRerunAnalysis}
          supplier={workflow.rerunSupplier}
          showSupplier
          onRunAgain={workflow.actions.showRunAgainUpload}
          onViewResult={onViewResult}
          viewResultPrimary
          isLatestOutput
          highlighted
          analysisParameters={workflow.completedRerunAnalysisParameters}
        />
      )}
      {workflow.showPostAnalysisActions && (
        <SharedPostAnalysisNextActions
          completedMilestoneIds={workflow.completedMilestoneIds}
          initiativeCompleted={workflow.initiativeCompleted}
          onStartAnotherInitiative={() => workflow.actions.startAnotherInitiative(false)}
          onMilestoneComplete={workflow.actions.markMilestoneComplete}
          onCompleteInitiative={workflow.actions.completeInitiative}
        />
      )}
    </div>
  );
}

function WorkspaceView() {
  const navigate = useNavigate();
  const workflow = useClauseIqWorkflow({
    autoAdvanceParameters: false,
    autoStartProcessingOnFile: false,
    initialInitiative: CP_CLAUSEIQ_INITIATIVE,
    useFirstRunResults: true,
  });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [clauseModalOpen, setClauseModalOpen] = useState(false);
  const [clauseModalOpened, setClauseModalOpened] = useState(false);
  const canvasRef = useRef<HTMLElement | null>(null);

  const viewResult = () => navigate(LATEST_V5_RESULTS_ROUTE);
  const clauseIqOpen = expanded === "ClauseIQ - Analyse your contracts";
  const openClauseModal = () => {
    setClauseModalOpened(true);
    setClauseModalOpen(true);
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
                  <button className="cp-mark-complete"><CpIcon icon={CP_FA.check} size={13} /> Mark complete</button>
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
                  <button className="cp-accordion-head" onClick={() => setExpanded(isOpen ? null : section)}>
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
                  </button>
                  {isClause && isOpen ? (
                    <ClauseIqLauncherCard
                      workflow={workflow}
                      hasOpened={clauseModalOpened}
                      onOpen={openClauseModal}
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
    </>
  );
}

export default function PrototypeCP() {
  const [view, setView] = useState<CpView>("projects");
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

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
        <button className="cp-floating-jasper"><CpIcon icon={CP_FA.sparkles} size={13} />Ask Jasper</button>
        <button className="cp-floating-help" aria-label="Help">?</button>
      </div>
      <V5OrbitToastHost />
    </div>
  );
}
