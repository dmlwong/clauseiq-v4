import { useEffect, useRef, useState, type ReactNode } from "react";
import "@orbit-tokens";
import "@orbit-fonts";
import "@/components/prototype-cp-v2-results/orbit-theme.css";
import {
  Avatar,
  AvatarStack,
  Chip,
  FA,
  MultiStateButton,
  MultiStateGroup,
} from "@orbit";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  BASIS_PARAMETER_OPTIONS,
  BenchmarkCombobox,
  CATEGORY_PARAMETER_OPTION,
  NoPlaybookBenchmarkPanel,
  SelectedSummaryRow,
  hasCompleteAnalysisParameters,
  useClauseIqWorkflow,
  type AnalysisParameterSelection,
  type ClauseIqWorkflow,
  type PlaybookChoice,
} from "@/components/clauseiq-v5/ClauseIqWorkflow";
import { V5OrbitToastHost } from "@/components/clauseiq-v5/V5OrbitToast";
import {
  CpClauseIqDropzone,
  CpPlaybookDisclaimer,
  CpStateCard,
  CpSupplierOutputsPanel,
} from "@/components/prototype-cp-shared/CpClauseIq";
import { ContractResults } from "@/components/prototype-cp-v2-results/ContractResults";
import { CpOrbitToastHost } from "@/components/prototype-cp-v2-results/CpOrbitToast";
import {
  CP_FA,
  CpIcon,
  CpRail,
  HeaderActions,
} from "@/components/prototype-cp-v2/PrototypeCPV2Chrome";
import {
  CpButton,
  CpCard,
  CpFileRow,
  CpInlineBanner,
  CpModal,
  CpSearchField as CpOrbitSearchField,
  CpSpinner,
  CpStatusPill,
  CpTable,
  CpToggle,
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
} from "@/data/prototype-cp-v2";
import type { CiqInitiative, CiqParameterOption } from "@/lib/clauseiq-v4-data";
import { PROTOTYPE_CP_V2_RESULT_ROUTE } from "@/lib/prototype-cp-v2-routes";
import { cn } from "@/lib/utils";
import "./PrototypeCPV2.css";

type CpView = "projects" | "initiatives" | "workspace";
type CpV2AnalysisStatus = "idle" | "in-progress" | "completed";

function getCpViewFromSearchParams(searchParams: URLSearchParams): CpView {
  const view = searchParams.get("view");
  if (view === "initiatives" || view === "workspace") return view;
  return "projects";
}

const CP_CLAUSEIQ_INITIATIVE_LABEL = "CP001-1014 | sdasd";
const CP_CLAUSEIQ_INITIATIVE: CiqInitiative = {
  id: "cp001-1014",
  name: CP_CLAUSEIQ_INITIATIVE_LABEL,
  sector: "Client Portal",
  owner: "PM",
  scope: "team",
};

const CPV2_DASHBOARD_IN_MODAL_STORAGE_KEY =
  "prototype-cp-v2-dashboard-in-modal";
const CPV2_RESULT_PARAM_DEFAULTS: Record<string, string> = {
  initiativeId: "init-1",
  supplierId: "sup-1",
  contractId: "ct-1",
  source: "prototype-cp-v2",
  catSort: "risk",
  mode: "comparison",
  tab: "changes",
  design: "row-scale",
  scenario: "first-analysis",
};
const CPV2_RESULT_ONLY_PARAMS = [
  "initiativeId",
  "supplierId",
  "contractId",
  "source",
  "catSort",
  "mode",
  "tab",
  "design",
  "scenario",
  "from",
  "to",
  "filter",
  "sort",
  "cat",
];

const CPV2_CLAUSEIQ_STEPS = [
  { key: "prior", label: "Prior to Use" },
  { key: "configure", label: "Configure" },
  { key: "upload", label: "Upload Contract" },
  { key: "generate", label: "Generate Results" },
] as const;
const CPV2_ROCKET_ICON = "\uf135";

function isCpV2InitialGenerateStep(
  workflow: ClauseIqWorkflow,
  showGenerateStep: boolean,
) {
  return (
    showGenerateStep &&
    workflow.step === "upload" &&
    Boolean(workflow.file)
  );
}

function isCpV2RerunGenerateStep(
  workflow: ClauseIqWorkflow,
  showGenerateStep: boolean,
) {
  return (
    showGenerateStep &&
    workflow.resultsVisible &&
    workflow.rerunUploadVisible &&
    Boolean(workflow.file)
  );
}

function isCpV2GenerateConfirmationStep(
  workflow: ClauseIqWorkflow,
  showGenerateStep: boolean,
) {
  return (
    isCpV2InitialGenerateStep(workflow, showGenerateStep) ||
    isCpV2RerunGenerateStep(workflow, showGenerateStep)
  );
}

function getCpV2ClauseIqStepIndex(
  workflow: ClauseIqWorkflow,
  showGenerateStep: boolean,
) {
  if (workflow.step === "welcome") return 0;
  if (
    isCpV2GenerateConfirmationStep(workflow, showGenerateStep) ||
    workflow.step === "processing" ||
    workflow.step === "results"
  ) {
    return 3;
  }
  if (workflow.step === "upload" || workflow.rerunUploadVisible) return 2;
  return 1;
}

function readStoredDashboardInModalPreference() {
  if (typeof window === "undefined") return true;
  try {
    const storedPreference = window.localStorage.getItem(
      CPV2_DASHBOARD_IN_MODAL_STORAGE_KEY,
    );
    return storedPreference === null ? true : storedPreference === "true";
  } catch {
    return true;
  }
}

function writeStoredDashboardInModalPreference(enabled: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      CPV2_DASHBOARD_IN_MODAL_STORAGE_KEY,
      String(enabled),
    );
  } catch {
    // Local persistence is best-effort for this prototype option.
  }
}

function withDashboardModalParams(searchParams: URLSearchParams) {
  const next = new URLSearchParams(searchParams);
  next.set("view", "workspace");
  Object.entries(CPV2_RESULT_PARAM_DEFAULTS).forEach(([key, value]) =>
    next.set(key, value),
  );
  next.delete("from");
  next.delete("to");
  return next;
}

function withoutDashboardModalParams(searchParams: URLSearchParams) {
  const next = new URLSearchParams(searchParams);
  next.set("view", "workspace");
  CPV2_RESULT_ONLY_PARAMS.forEach((key) => next.delete(key));
  return next;
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
      className="cpv2-search-field"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  );
}

function Counts({ counts }: { counts: CountSet }) {
  const items = [
    { key: "green", label: String(counts.green), variant: "Success" as const },
    { key: "amber", label: String(counts.amber), variant: "Warning" as const },
    { key: "red", label: String(counts.red), variant: "Error" as const },
    { key: "grey", label: String(counts.grey), variant: "No Status" as const },
  ];

  return (
    <div className="cpv2-counts" aria-label="Status counts">
      {items.map((item) => (
        <Chip
          key={item.key}
          label={item.label}
          size="Small"
          variant={item.variant}
        />
      ))}
    </div>
  );
}

function LogoTile({ logo }: { logo: CpProject["logo"] }) {
  return (
    <span className={`cpv2-logo-tile cpv2-logo-${logo}`} aria-hidden="true" />
  );
}

function PersonAvatar({
  person,
  size = "Small",
}: {
  person: Person;
  size?: "Extra Small" | "Small" | "Medium";
}) {
  return (
    <Avatar
      name={person.name}
      initials={person.initials}
      size={size}
      src={person.image}
      style={person.image ? "Image" : "Text"}
    />
  );
}

function AvatarGroup({
  people: group,
  extra,
}: {
  people: Person[];
  extra?: string;
}) {
  const avatars = [
    ...group.map((person) => ({
      name: person.name,
      initials: person.initials,
      src: person.image,
      style: person.image ? ("Image" as const) : ("Text" as const),
    })),
    ...(extra
      ? [{ name: `${extra} more`, initials: extra, style: "Text" as const }]
      : []),
  ];

  return (
    <span className="cpv2-avatar-stack" data-cp-orbit-adapter="avatar-stack">
      <AvatarStack avatars={avatars} max={avatars.length} size="Extra Small" />
    </span>
  );
}

function StatusPill({
  status,
  label,
}: {
  status: ProjectStatus;
  label?: string;
}) {
  const chipStatus =
    status === "In flight"
      ? "Information"
      : status === "Complete"
        ? "Success"
        : "No Status";
  return <CpStatusPill label={label ?? status} status={chipStatus} />;
}

type CpWorkstream = NonNullable<CpProject["workstreams"]>[number];

const workstreamColumns: Array<CpTableColumn<CpWorkstream>> = [
  {
    id: "categories",
    header: "Categories",
    render: (workstream) => workstream.categories,
  },
  {
    id: "serviceLines",
    header: "ServiceLines",
    render: (workstream) => workstream.serviceLines,
  },
  {
    id: "initiatives",
    header: "Initiatives",
    render: (workstream) => workstream.initiatives,
  },
  { id: "team", header: "Team", render: (workstream) => workstream.teamSize },
  {
    id: "savings",
    header: "Project Est. Savings",
    render: () => <span className="muted-cell">-</span>,
    info: "Project estimated savings",
  },
  {
    id: "spend",
    header: "Project Est. Spend",
    render: () => <span className="muted-cell">-</span>,
    info: "Project estimated spend",
  },
  {
    id: "baseline",
    header: "Savings vs Baseline (Annualised)",
    render: () => "- ( - | 0% )",
    info: "Savings vs baseline annualised",
  },
  {
    id: "target",
    header: "Mid Target (Savings Delta)",
    render: () => (
      <span>
        <span className="cpv2-negative">▼</span> 0K GBP ( -0K GBP )
      </span>
    ),
    info: "Mid target savings delta",
  },
];

function ProjectsTopbar() {
  return (
    <header className="cpv2-topbar">
      <h1 className="cpv2-title">Projects &amp; Initiatives</h1>
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
    <CpCard className="cpv2-project-card" padding="Base" state="Default">
      <div className="cpv2-project-summary">
        <div className="cpv2-project-identity">
          <LogoTile logo={project.logo} />
          <div className="cpv2-project-name">{project.name}</div>
          <Counts counts={project.counts} />
        </div>
        <div className="cpv2-project-meta">
          <div className="cpv2-meta-row">
            <span className="cpv2-meta-label">Client Type:</span>
            <span>{project.clientType}</span>
          </div>
          <div className="cpv2-meta-row">
            <span className="cpv2-meta-label">Sector:</span>
            <span>{project.sector}</span>
          </div>
          <div className="cpv2-meta-row">
            <span className="cpv2-meta-label">Head Office Address:</span>
            <span>{project.address}</span>
          </div>
          <div className="cpv2-meta-row">
            <span className="cpv2-meta-label">Main Leads:</span>
            <AvatarGroup
              people={project.mainLeads}
              extra={
                project.id === "efficio"
                  ? "+49"
                  : project.id === "roche"
                    ? "+24"
                    : undefined
              }
            />
            {project.qualityLeads ? (
              <>
                <span className="cpv2-meta-label" style={{ marginLeft: 18 }}>
                  Quality Leads:
                </span>
                <AvatarGroup
                  people={project.qualityLeads}
                  extra={
                    project.id === "efficio"
                      ? "+21"
                      : project.id === "roche"
                        ? "+1"
                        : undefined
                  }
                />
              </>
            ) : null}
          </div>
        </div>
        <div className="cpv2-project-actions">
          {project.parent ? (
            <span className="cpv2-parent-pill">{project.parent}</span>
          ) : null}
          <CpButton
            className="cpv2-action-square disabled"
            aria-label="Refresh disabled"
          >
            <CpIcon icon={CP_FA.globe} size={15} />
          </CpButton>
          <CpButton className="cpv2-action-square" aria-label="Ideas">
            <CpIcon icon={CP_FA.lightbulb} size={15} />
          </CpButton>
          <CpButton className="cpv2-action-square" aria-label="Edit">
            <CpIcon icon={CP_FA.pencil} size={14} />
          </CpButton>
          <CpButton
            className="cpv2-action-square"
            aria-label={expanded ? "Collapse project" : "Expand project"}
            onClick={onToggle}
          >
            <CpIcon
              icon={expanded ? CP_FA.chevronUp : CP_FA.chevronDown}
              size={15}
            />
          </CpButton>
        </div>
      </div>
      {expanded && project.workstreams ? (
        <div className="cpv2-workstream-card">
          {project.workstreams.map((workstream) => (
            <div key={workstream.id}>
              <div className="cpv2-workstream-head">
                <StatusPill status={workstream.status} />
                <div className="cpv2-workstream-title">
                  <span>{workstream.title}</span>
                  <PersonAvatar person={workstream.owner} />
                  <AvatarGroup people={workstream.team} extra="+4" />
                </div>
                <div className="cpv2-workstream-actions">
                  <Counts counts={workstream.counts} />
                  <CpButton
                    className="cpv2-view-button"
                    onClick={onViewProject}
                  >
                    View Project
                  </CpButton>
                  <CpButton
                    className="cpv2-more-button"
                    aria-label="More project actions"
                  >
                    <CpIcon icon={CP_FA.ellipsis} size={17} />
                  </CpButton>
                </div>
              </div>
              <CpTable
                ariaLabel={`${workstream.title} workstream metrics`}
                className="cpv2-table"
                columns={workstreamColumns}
                rows={[workstream]}
                getRowKey={(row) => row.id}
              />
            </div>
          ))}
        </div>
      ) : null}
    </CpCard>
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
      <main className="cpv2-canvas">
        <div className="cpv2-canvas-inner">
          <div className="cpv2-controls">
            <MultiStateGroup
              ariaLabel="Project status"
              value={projectStatus}
              onValueChange={setProjectStatus}
            >
              <MultiStateButton value="all" label="All" />
              <MultiStateButton value="active" label="Active" />
            </MultiStateGroup>
            <div className="cpv2-search">
              <CpSearchField
                ariaLabel="Search projects"
                value={search}
                onChange={setSearch}
              />
            </div>
          </div>
          <div className="cpv2-project-list">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                expanded={expandedProject === project.id}
                onToggle={() =>
                  setExpandedProject(
                    expandedProject === project.id ? null : project.id,
                  )
                }
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
  breadcrumbActions,
  initiativeCrumb,
}: {
  activeTab?: string;
  breadcrumbActions?: ReactNode;
  initiativeCrumb?: string;
}) {
  const tabs = [
    "Gantt Chart",
    "Initiatives",
    "Deliverables",
    "Team",
    "My QC Tasks",
    "Benefits",
    "Settings",
  ];
  return (
    <>
      <div className="cpv2-breadcrumb">
        <span className="cpv2-breadcrumb-trail">
          Projects &amp; Initiatives /{" "}
          <strong>Connected Platform - Development Workstreams</strong>
          {initiativeCrumb ? (
            <>
              {" "}
              / <strong>{initiativeCrumb}</strong>
            </>
          ) : null}
        </span>
        {breadcrumbActions ? (
          <div className="cpv2-breadcrumb-actions">{breadcrumbActions}</div>
        ) : null}
      </div>
      <header className="cpv2-project-header">
        <div className="cpv2-project-heading">
          <LogoTile logo="efficio" />
          <div className="cpv2-project-heading-text">
            Connected Platform - Development...
          </div>
          <nav className="cpv2-main-tabs" aria-label="Project tabs">
            {tabs.map((tab) => (
              <CpButton
                key={tab}
                className={`cpv2-main-tab${tab === activeTab ? " is-active" : ""}`}
              >
                {tab}
                {tab === "Settings" ? (
                  <CpIcon icon={CP_FA.chevronDown} size={11} />
                ) : null}
              </CpButton>
            ))}
          </nav>
        </div>
        <HeaderActions />
      </header>
    </>
  );
}

function DashboardModeToggle({
  dashboardInModal,
  onDashboardInModalChange,
}: {
  dashboardInModal: boolean;
  onDashboardInModalChange: (enabled: boolean) => void;
}) {
  return (
    <div className="cpv2-dashboard-mode-toggle">
      <span>Dashboard in modal</span>
      <CpToggle
        checked={dashboardInModal}
        label="Dashboard in modal"
        onChange={onDashboardInModalChange}
      />
    </div>
  );
}

function InitiativesView({
  onOpenInitiative,
}: {
  onOpenInitiative: () => void;
}) {
  const [query, setQuery] = useState("");
  const [initiativeScope, setInitiativeScope] = useState("team");
  return (
    <>
      <ProjectHeader />
      <main className="cpv2-canvas">
        <div className="cpv2-canvas-inner">
          <div className="cpv2-initiative-toolbar">
            <div className="cpv2-toolbar-left">
              <MultiStateGroup
                ariaLabel="Initiative ownership"
                value={initiativeScope}
                onValueChange={setInitiativeScope}
              >
                <MultiStateButton value="mine" label="Mine" />
                <MultiStateButton value="team" label="Team" />
                <MultiStateButton value="triage" label="Triage" />
              </MultiStateGroup>
              <CpButton className="cpv2-filter-chip">
                <span className="mini-badge">6</span>
              </CpButton>
              <div className="cpv2-search" style={{ width: 178 }}>
                <CpSearchField
                  ariaLabel="Search for initiative"
                  placeholder="Search for initiative"
                  value={query}
                  onChange={setQuery}
                />
              </div>
            </div>
            <div className="cpv2-toolbar-right">
              <CpButton className="cpv2-small-button">
                <CpIcon icon={CP_FA.filter} size={12} />
                Filter
              </CpButton>
              <CpButton
                className="cpv2-icon-button cpv2-toolbar-icon"
                aria-label="Download initiatives"
              >
                <CpIcon icon={CP_FA.download} size={15} />
              </CpButton>
              <CpButton className="cpv2-small-button">
                Sorted by: Newest <CpIcon icon={CP_FA.chevronDown} size={12} />
              </CpButton>
              <CpButton className="cpv2-small-button is-disabled">
                Add Initiative
              </CpButton>
            </div>
          </div>
          <div className="cpv2-filter-row">
            <Chip label="Client-Portal  x" variant="No Status" size="Small" />
            <CpButton className="cpv2-filter-chip" style={{ height: 24 }}>
              Clear all&nbsp; x
            </CpButton>
          </div>
          <div className="cpv2-initiative-list">
            {initiatives.map((initiative) => (
              <div className="cpv2-initiative-row" key={initiative.id}>
                <StatusPill
                  status={initiative.status}
                  label={
                    initiative.status === "In flight" ? "In-Flight" : undefined
                  }
                />
                <div className="cpv2-initiative-title">
                  {initiative.id} | {initiative.title}
                </div>
                <div className="cpv2-row-actions">
                  <span className="cpv2-owner">
                    Owner:{" "}
                    <PersonAvatar
                      person={initiative.owner}
                      size="Extra Small"
                    />
                  </span>
                  <span className="cpv2-info-dot">i</span>
                  <div className="cpv2-rag-lock">
                    Grey <CpIcon icon={CP_FA.lock} size={14} />
                  </div>
                  <CpButton
                    className="cpv2-view-button"
                    onClick={onOpenInitiative}
                  >
                    View Initiative
                  </CpButton>
                  <CpButton
                    className="cpv2-action-square disabled"
                    aria-label="Edit initiative"
                  >
                    <CpIcon icon={CP_FA.pencil} size={13} />
                  </CpButton>
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

function BlueWorkspaceHeader({
  dashboardInModal,
  onDashboardInModalChange,
}: {
  dashboardInModal: boolean;
  onDashboardInModalChange: (enabled: boolean) => void;
}) {
  const subtabs = [
    "Workspace",
    "Methodology",
    "Suppliers",
    "Initiative Milestones",
    "Initiative Benefits",
  ];
  return (
    <>
      <ProjectHeader
        initiativeCrumb="CP001-1014 | sdasd"
        breadcrumbActions={
          <DashboardModeToggle
            dashboardInModal={dashboardInModal}
            onDashboardInModalChange={onDashboardInModalChange}
          />
        }
      />
      <div className="cpv2-bluebar">
        <div className="cpv2-blue-title">CP001-1014 | sdasd</div>
        <nav className="cpv2-subtabs" aria-label="Initiative tabs">
          {subtabs.map((tab) => (
            <CpButton
              key={tab}
              className={`cpv2-subtab${tab === "Workspace" ? " is-active" : ""}`}
            >
              {tab}
            </CpButton>
          ))}
        </nav>
        <div className="cpv2-blue-actions">
          <CpIcon icon={CP_FA.hand} size={16} />
          <CpIcon icon={CP_FA.comment} size={15} />
          <CpIcon icon={CP_FA.pencil} size={15} />
          <CpButton className="cpv2-mini-menu">
            <CpIcon
              icon={FA.circleInfo}
              size={16}
              color="var(--orbit-color-text-secondary)"
            />
            <CpIcon icon={CP_FA.chevronDown} size={12} />
          </CpButton>
        </div>
      </div>
      <div className="cpv2-timeline">
        <div className="cpv2-timeline-track">
          <div className="cpv2-milestone is-start">
            <span className="cpv2-diamond start" />
            <span className="cpv2-timeline-date">2026-01-07</span>
          </div>
          <div className="cpv2-line" />
          <div className="cpv2-milestone">
            <span className="cpv2-dot" />
          </div>
          <div className="cpv2-line" />
          <div className="cpv2-milestone">
            <span className="cpv2-dot" />
          </div>
          <div className="cpv2-line" />
          <div className="cpv2-milestone">
            <span className="cpv2-dot" />
          </div>
          <div className="cpv2-line" />
          <div className="cpv2-milestone">
            <span className="cpv2-dot" />
          </div>
          <div className="cpv2-line" />
          <div className="cpv2-milestone">
            <span className="cpv2-dot" />
          </div>
          <div className="cpv2-line" />
          <div className="cpv2-milestone">
            <span className="cpv2-dot" />
          </div>
          <div className="cpv2-line" />
          <div className="cpv2-milestone is-end">
            <span className="cpv2-diamond" />
            <span className="cpv2-timeline-date cpv2-date-right">
              2026-01-29
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

function InsightPanel() {
  return (
    <aside className="cpv2-insights">
      <div className="cpv2-insights-header">
        <span>
          <CpIcon icon={CP_FA.sparkles} size={14} /> Insights for You
        </span>
        <CpIcon icon={CP_FA.arrowRight} size={16} />
      </div>
      <div className="cpv2-insight-panel">
        <h3>AI Tool Kit</h3>
        <p>
          Enhance each step of your workflow with AI! Explore the tools below.
        </p>
        <div className="cpv2-insight-list">
          {insights.map((insight, index) => (
            <div
              className="cpv2-insight-item"
              key={`${insight.title}-${index}`}
            >
              <span className="cpv2-ai-icon">
                <CpIcon icon={CP_FA.aiChip} size={18} />
              </span>
              <span>
                <span className="cpv2-insight-title">{insight.title}</span>
                <span className="cpv2-insight-meta">{insight.meta}</span>
              </span>
              <CpButton
                className="cpv2-sparkle-button"
                aria-label="Open insight"
              >
                <CpIcon icon={CP_FA.sparkles} size={12} />
              </CpButton>
            </div>
          ))}
        </div>
      </div>
      <div className="cpv2-insight-footer">
        <CpButton
          className="cpv2-carousel-button"
          aria-label="Previous insight"
        >
          <CpIcon icon={CP_FA.arrowLeft} size={15} />
        </CpButton>
        <span>
          Insight 1 / 2<br />
          See all
        </span>
        <CpButton className="cpv2-carousel-button" aria-label="Next insight">
          <CpIcon icon={CP_FA.arrowRight} size={15} />
        </CpButton>
      </div>
    </aside>
  );
}

function MetricBadges() {
  return (
    <span className="cpv2-accordion-badges">
      <span className="cpv2-tiny-metric">
        <CpIcon icon={CP_FA.file} size={13} />
        19
      </span>
      <span className="cpv2-tiny-metric">
        <CpIcon icon={FA.circleInfo} size={13} />0
      </span>
      <span className="cpv2-tiny-metric blue">
        <CpIcon icon={CP_FA.file} size={13} />0
      </span>
      <span className="cpv2-tiny-metric green">
        <CpIcon icon={CP_FA.clipboard} size={13} />0
      </span>
    </span>
  );
}

function clauseIqLauncherLabel(
  analysisStatus: CpV2AnalysisStatus,
  hasOpened: boolean,
) {
  if (analysisStatus === "in-progress") return "Download Generating";
  if (analysisStatus === "completed") return "Run Analysis Again";
  if (hasOpened) return "Resume ClauseIQ";
  return "Get Started";
}

function ClauseIqLauncherCard({
  analysisStatus,
  hasOpened,
  onHistoryOpen,
  onOpen,
  onViewResult,
}: {
  analysisStatus: CpV2AnalysisStatus;
  hasOpened: boolean;
  onHistoryOpen: () => void;
  onOpen: () => void;
  onViewResult: () => void;
}) {
  const label = clauseIqLauncherLabel(analysisStatus, hasOpened);
  const generating = analysisStatus === "in-progress";
  const completed = analysisStatus === "completed";
  const historyEnabled = completed;

  return (
    <div className="cpv2-accordion-body cpv2-clause-launcher-body">
      <div className="cpv2-live-launcher-grid">
        <div>
          <CpCard
            className="cpv2-live-tool-card"
            padding="Small"
            state="Default"
          >
            <div className="cpv2-live-tool-card-main">
              <span className="cpv2-live-document-icon" aria-hidden="true">
                <CpIcon icon={CP_FA.filePlus} size={34} />
              </span>
              <strong>ClauseIQ - Analyse your Contracts</strong>
            </div>
            <CpButton
              className={cn(
                "cpv2-live-tool-action",
                generating && "is-generating",
                completed && "is-completed",
              )}
              type="button"
              onClick={onOpen}
            >
              {generating ? (
                <CpSpinner className="cpv2-clause-analysis-loader" />
              ) : (
                <CpIcon icon={CP_FA.sparkles} size={14} />
              )}
              {label}
            </CpButton>
          </CpCard>
          <CpButton
            className="cpv2-live-history-button"
            type="button"
            disabled={!historyEnabled}
            title={
              historyEnabled
                ? undefined
                : "History is available after ClauseIQ has generated outputs."
            }
            onClick={historyEnabled ? onHistoryOpen : undefined}
          >
            <CpIcon icon={CP_FA.clipboard} size={17} />
            History
          </CpButton>
          {completed ? (
            <CpButton
              className="cpv2-live-view-result-button"
              icon={<CpIcon icon={CP_FA.chart} size={15} />}
              orbitSize="Medium"
              orbitVariant="Primary"
              type="button"
              onClick={onViewResult}
            >
              View Result
            </CpButton>
          ) : null}
        </div>
        <div className="cpv2-live-callout-stack">
          {completed ? (
            <CpInlineBanner
              className="cpv2-live-ready-callout"
              icon={CP_FA.arrowLeft}
              label="Click View Result to open your contract analysis"
              variant="Success"
            />
          ) : null}
          <CpInlineBanner
            className="cpv2-live-info-callout"
            label="Use this tool to help you analyse your Supplier contracts during your negotiations. This can help you find opportunities to improve the overall contract for your client i.e. better payment terms, missing clauses."
            variant="Information"
          />
        </div>
      </div>
    </div>
  );
}

function CpV2SupplierOutputsModal({
  workflow,
  onClose,
  onViewResult,
}: {
  workflow: ClauseIqWorkflow;
  onClose: () => void;
  onViewResult: () => void;
}) {
  const [showPastAnalyses, setShowPastAnalyses] = useState(true);
  const outputInitiative = showPastAnalyses
    ? mockInitiative
    : workflow.resultsInitiative;

  return (
    <CpModal
      ariaLabel="History"
      className="cpv2-supplier-output-modal"
      height="Content"
      onClose={onClose}
      visible
    >
      <div className="cpv2-supplier-output-modal-shell">
        <header className="cpv2-supplier-output-modal-header">
          <div>
            <div className="cpv2-supplier-output-modal-title">
              History
            </div>
          </div>
          <CpButton
            className="cpv2-close"
            type="button"
            onClick={onClose}
            aria-label="Close history"
          >
            <CpIcon icon={CP_FA.xmark} size={18} />
          </CpButton>
        </header>
        <div
          className="cpv2-supplier-output-modal-body"
          data-prototype="prototype-cp-v2"
        >
          <CpSupplierOutputsPanel
            key={showPastAnalyses ? "past-analyses" : "current-analysis"}
            expandAllSuppliers
            initiative={outputInitiative}
            initialOutputScope={showPastAnalyses ? "team" : "mine"}
            outputState="filled"
            onDownload={workflow.actions.handleDownload}
            onViewResult={onViewResult}
            showClientShareToggle
            showAnalysisMetadata
            useV5OutputSummary
            className="cpv2-supplier-output-panel-modal"
          />
        </div>
        <footer className="cpv2-supplier-output-modal-footer">
          <div className="cpv2-supplier-output-modal-actions">
            <CpButton className="cpv2-footer-btn" type="button" onClick={onClose}>
              Close
            </CpButton>
          </div>
          <div className="cpv2-supplier-output-demo-toggle cpv2-supplier-output-demo-toggle-footer">
            <span>
              <strong>Show Past Analyses</strong>
            </span>
            <CpToggle
              checked={showPastAnalyses}
              label="Show past analyses"
              onChange={(checked) => setShowPastAnalyses(checked)}
            />
          </div>
        </footer>
      </div>
    </CpModal>
  );
}

function CpV2ResultsDashboardModal({ onClose }: { onClose: () => void }) {
  return (
    <CpModal
      ariaLabel="ClauseIQ Results dashboard"
      className="cpv2-results-dashboard-modal"
      height="Content"
      onClose={onClose}
      visible
    >
      <div className="cpv2-results-dashboard-modal-frame">
        <header className="cpv2-results-dashboard-modal-header">
          <div className="cpv2-results-dashboard-modal-title">
            <h2>ClauseIQ Results</h2>
          </div>
          <CpButton
            className="cpv2-close"
            type="button"
            onClick={onClose}
            aria-label="Close ClauseIQ Results dashboard"
          >
            <CpIcon icon={CP_FA.xmark} size={18} />
          </CpButton>
        </header>
        <div
          className="cpv2-results-dashboard-modal-body"
          data-prototype="prototype-cp-v2-results"
          data-theme="efficio-cp"
        >
          <ContractResults
            initiativeId={CPV2_RESULT_PARAM_DEFAULTS.initiativeId}
            supplierId={CPV2_RESULT_PARAM_DEFAULTS.supplierId}
            contractId={CPV2_RESULT_PARAM_DEFAULTS.contractId}
            compactHeader
          />
        </div>
        <footer className="cpv2-results-dashboard-modal-footer">
          <CpButton className="cpv2-footer-btn" type="button" onClick={onClose}>
            Close
          </CpButton>
        </footer>
      </div>
    </CpModal>
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
  const [showGenerateStep, setShowGenerateStep] = useState(false);

  useEffect(() => {
    if (!workflow.file) {
      setShowGenerateStep(false);
    }
  }, [workflow.file]);

  return (
    <CpModal
      ariaLabel="ClauseIQ Contract"
      className="cpv2-clause-modal"
      height="Content"
      onClose={onClose}
      size="Large"
      visible
    >
      <header className="cpv2-clause-modal-header">
        <div className="cpv2-clause-modal-title">ClauseIQ Contract</div>
        <CpButton
          className="cpv2-close"
          type="button"
          onClick={onClose}
          aria-label="Close ClauseIQ Contract"
        >
          <CpIcon icon={CP_FA.xmark} size={18} />
        </CpButton>
      </header>

      <CpV2ClauseModalStepper
        workflow={workflow}
        showGenerateStep={showGenerateStep}
      />

      <div className="cpv2-clause-modal-body">
        <main
          className={cn(
            "cpv2-clause-modal-main cpv2-clause-journey",
            showGenerateStep && "is-generate-step",
          )}
        >
          <CpV2ClauseJourneyContent
            workflow={workflow}
            onViewResult={onViewResult}
            showGenerateStep={showGenerateStep}
          />
        </main>
      </div>

      <CpV2ClauseModalFooter
        workflow={workflow}
        onClose={onClose}
        onHideGenerateStep={() => setShowGenerateStep(false)}
        onShowGenerateStep={() => setShowGenerateStep(true)}
        showGenerateStep={showGenerateStep}
      />
    </CpModal>
  );
}

function CpV2ClauseModalFooter({
  workflow,
  onClose,
  onHideGenerateStep,
  onShowGenerateStep,
  showGenerateStep,
}: {
  workflow: ClauseIqWorkflow;
  onClose: () => void;
  onHideGenerateStep: () => void;
  onShowGenerateStep: () => void;
  showGenerateStep: boolean;
}) {
  const showGetStarted = workflow.step === "welcome";
  const showFinish = isCpV2GenerateConfirmationStep(
    workflow,
    showGenerateStep,
  );
  const showRerunSubmit =
    workflow.resultsVisible &&
    workflow.rerunUploadVisible &&
    !workflow.rerunProcessing &&
    !workflow.completedRerunAnalysis;
  const showParametersSubmit = workflow.step === "parameters" && !showGenerateStep;
  const showUploadSubmit =
    (workflow.step === "upload" || showRerunSubmit) && !showGenerateStep;
  const showBack = showParametersSubmit || showUploadSubmit || showFinish;
  const primaryLabel = showGetStarted
    ? "Get Started"
    : showFinish
      ? "Finish"
      : showParametersSubmit
        ? "Next"
        : showUploadSubmit
          ? "Confirm"
        : null;
  const primaryAction = showGetStarted
    ? workflow.actions.startParameters
    : showFinish
      ? () => {
          workflow.actions.startProcessing();
          onClose();
        }
      : showParametersSubmit
        ? () => workflow.actions.setStep("upload")
        : showUploadSubmit
          ? onShowGenerateStep
        : null;
  const primaryDisabled = showParametersSubmit
    ? !hasCompleteAnalysisParameters(workflow.selectedParameter)
    : showUploadSubmit
      ? !workflow.file
      : false;
  const handleBack = () => {
    if (showFinish) {
      onHideGenerateStep();
      return;
    }

    if (showRerunSubmit) {
      workflow.actions.clearFile();
      return;
    }

    if (workflow.step === "upload") {
      workflow.actions.setStep("parameters");
      return;
    }

    workflow.actions.setStep("welcome");
  };

  return (
    <footer className="cpv2-clause-modal-footer">
      <div className="cpv2-footer-left">
        <CpButton
          className="cpv2-footer-btn"
          type="button"
          onClick={onClose}
        >
          Close
        </CpButton>
        {showBack ? (
          <CpButton
            className="cpv2-footer-btn"
            type="button"
            onClick={handleBack}
          >
            Back
          </CpButton>
        ) : null}
      </div>
      <div className="cpv2-footer-right">
        {primaryLabel && primaryAction ? (
          <CpButton
            orbitVariant="Primary"
            orbitSize="Medium"
            className="cpv2-footer-primary"
            type="button"
            disabled={primaryDisabled}
            onClick={primaryAction}
          >
            {primaryLabel}
          </CpButton>
        ) : null}
      </div>
    </footer>
  );
}

function CpV2ClauseModalStepper({
  workflow,
  showGenerateStep,
}: {
  workflow: ClauseIqWorkflow;
  showGenerateStep: boolean;
}) {
  const activeIndex = getCpV2ClauseIqStepIndex(workflow, showGenerateStep);

  return (
    <nav
      className="cpv2-clause-modal-stepper"
      aria-label="ClauseIQ workflow steps"
    >
      {CPV2_CLAUSEIQ_STEPS.map((item, index) => {
        const complete = index < activeIndex;
        const active = index === activeIndex;

        return (
          <div
            key={item.key}
            className={cn(
              "cpv2-clause-modal-step",
              active && "is-active",
              complete && "is-complete",
            )}
            aria-current={active ? "step" : undefined}
          >
            <span className="cpv2-clause-modal-step-dot" aria-hidden="true">
              {complete ? <CpIcon icon={CP_FA.check} size={12} /> : index + 1}
            </span>
            <span className="cpv2-clause-modal-step-label">{item.label}</span>
          </div>
        );
      })}
    </nav>
  );
}

function CpV2ClauseJourneyContent({
  workflow,
  onViewResult,
  showGenerateStep,
}: {
  workflow: ClauseIqWorkflow;
  onViewResult: () => void;
  showGenerateStep: boolean;
}) {
  if (workflow.step === "welcome") {
    return <CpV2PriorToUseStep />;
  }

  if (isCpV2InitialGenerateStep(workflow, showGenerateStep)) {
    return <CpV2GenerateResultsStep />;
  }

  if (workflow.step === "parameters") {
    return (
      <CpV2AnalysisParameterCards
        selectedParameter={workflow.selectedParameter}
        cardState="active"
        locked={workflow.parameterLocked}
        onPlaybookChoiceChange={workflow.actions.handlePlaybookChoiceChange}
        onBasisSelect={workflow.actions.handleBasisSelect}
        onCategorySelect={workflow.actions.handleCategorySelect}
        onBenchmarkConfirm={workflow.actions.handleBenchmarkConfirm}
        onBenchmarkEdit={workflow.actions.handleBenchmarkEdit}
        onBenchmarkSkip={workflow.actions.handleBenchmarkSkip}
        onBasisEdit={workflow.actions.handleBasisEdit}
      />
    );
  }

  if (workflow.step === "upload") {
    return <CpV2UploadStep workflow={workflow} />;
  }

  if (workflow.step === "processing") {
    return (
      <section className="cpv2-clause-card-stack">
        <CpV2AnalysisParameterCards
          selectedParameter={workflow.selectedParameter}
          cardState="default"
          locked
          onPlaybookChoiceChange={workflow.actions.handlePlaybookChoiceChange}
          onBasisSelect={workflow.actions.handleBasisSelect}
          onCategorySelect={workflow.actions.handleCategorySelect}
          onBenchmarkConfirm={workflow.actions.handleBenchmarkConfirm}
          onBenchmarkEdit={workflow.actions.handleBenchmarkEdit}
          onBenchmarkSkip={workflow.actions.handleBenchmarkSkip}
          onBasisEdit={workflow.actions.handleBasisEdit}
        />
        <CpV2ProcessingStep
          heading="Analysing Your Contract"
          copy="Finding clauses and checking the contract against your selected parameters."
          parameter={workflow.selectedParameter}
          workflow={workflow}
        />
      </section>
    );
  }

  return (
    <CpV2ModalResultsStep
      workflow={workflow}
      onViewResult={onViewResult}
      showGenerateStep={showGenerateStep}
    />
  );
}

function CpV2PriorToUseStep() {
  return (
    <section className="cpv2-live-step cpv2-live-prior">
      <h2>Tool Overview</h2>
      <p>
        ClauseIQ is your go-to tool for quickly analyzing supplier contracts and
        identifying key clauses that could impact your client. It automatically
        extracts important terms such as payment conditions, SLAs, and renewal
        terms, highlighting any risks or deviations. With ClauseIQ, you can spot
        potential issues early and ensure contract terms align with project
        objectives. This helps you protect client interests while reducing time
        spent on manual reviews. Use ClauseIQ to streamline your contract
        analysis and make more informed recommendations.
      </p>
    </section>
  );
}

function CpV2AnalysisParameterCards({
  selectedParameter,
  cardState,
  locked = false,
  onPlaybookChoiceChange,
  onBasisSelect,
  onCategorySelect,
  onBenchmarkConfirm,
  onBenchmarkEdit,
  onBenchmarkSkip,
  onBasisEdit,
}: {
  selectedParameter: AnalysisParameterSelection | null;
  cardState: "active" | "default" | "disabled";
  locked?: boolean;
  onPlaybookChoiceChange: (choice: PlaybookChoice) => void;
  onBasisSelect: (option: CiqParameterOption, value: string) => void;
  onCategorySelect: (option: CiqParameterOption, value: string) => void;
  onBenchmarkConfirm: () => void;
  onBenchmarkEdit: () => void;
  onBenchmarkSkip: () => void;
  onBasisEdit: () => void;
}) {
  const selectedPlaybookChoice =
    selectedParameter?.playbookChoice ??
    (selectedParameter?.basis?.kind === "Governing Law" ||
    selectedParameter?.category
      ? "no"
      : "yes");
  const [localPlaybookChoice, setLocalPlaybookChoice] =
    useState<PlaybookChoice>(selectedPlaybookChoice);
  const hasExternalParameter = Boolean(
    selectedParameter?.playbookChoice ||
      selectedParameter?.basis ||
      selectedParameter?.category,
  );
  const playbookChoice =
    selectedParameter?.playbookChoice ??
    (hasExternalParameter ? selectedPlaybookChoice : localPlaybookChoice);
  const playbookOption = BASIS_PARAMETER_OPTIONS.find(
    (option) => option.kind === "Playbook",
  );
  const playbookGroups = playbookOption
    ? [{ label: "Playbooks", options: playbookOption.options }]
    : [];
  const playbookSelected =
    playbookChoice === "yes" && selectedParameter?.basis?.kind === "Playbook";
  const showPlaybookChoiceSelector = !locked;

  useEffect(() => {
    setLocalPlaybookChoice(selectedPlaybookChoice);
  }, [selectedPlaybookChoice]);

  const handlePlaybookChoice = (choice: PlaybookChoice) => {
    setLocalPlaybookChoice(choice);
    onPlaybookChoiceChange(choice);
  };

  return (
    <CpStateCard
      className="cpv2-analysis-parameter-card"
      state={cardState}
    >
      <h2>Contract Analysis Parameters</h2>
      {showPlaybookChoiceSelector ? (
        <>
          <p>Do you want to use a playbook for this analysis?</p>
          <CpV2PlaybookChoiceSelector
            value={playbookChoice}
            onChange={handlePlaybookChoice}
          />
        </>
      ) : null}

      {playbookChoice === "yes" ? (
        <div className={cn("cpv2-parameter-section", showPlaybookChoiceSelector && "with-choice")}>
          {playbookSelected ? (
            <SelectedSummaryRow
              label={`${selectedParameter!.basis!.kind} · ${selectedParameter!.basis!.label}`}
              disabled={locked}
              actionLabel={`Change ${selectedParameter!.basis!.kind}`}
              onAction={onBasisEdit}
            />
          ) : (
            <>
              <BenchmarkCombobox
                label="Playbook"
                value=""
                groups={playbookGroups}
                placeholder="Please select a playbook..."
                onSelect={(value) => {
                  if (playbookOption) onBasisSelect(playbookOption, value);
                }}
                onClear={() => {
                  if (playbookOption) onBasisSelect(playbookOption, "");
                }}
              />
            </>
          )}
        </div>
      ) : null}

      {playbookChoice === "no" ? (
        <NoPlaybookBenchmarkPanel
          parameter={selectedParameter}
          locked={locked}
          className={cn("cpv2-parameter-section", showPlaybookChoiceSelector && "with-choice")}
          onCategorySelect={(value) => {
            if (CATEGORY_PARAMETER_OPTION) onCategorySelect(CATEGORY_PARAMETER_OPTION, value);
          }}
          onCategoryClear={() => {
            if (CATEGORY_PARAMETER_OPTION) onCategorySelect(CATEGORY_PARAMETER_OPTION, "");
          }}
          onGoverningLawSelect={(value) => {
            const governingLawOption = BASIS_PARAMETER_OPTIONS.find(
              (option) => option.kind === "Governing Law",
            );
            if (governingLawOption) onBasisSelect(governingLawOption, value);
          }}
          onGoverningLawClear={() => {
            const governingLawOption = BASIS_PARAMETER_OPTIONS.find(
              (option) => option.kind === "Governing Law",
            );
            if (governingLawOption) onBasisSelect(governingLawOption, "");
          }}
          onConfirm={onBenchmarkConfirm}
          onEditBenchmark={onBenchmarkEdit}
          onSkip={onBenchmarkSkip}
        />
      ) : null}
    </CpStateCard>
  );
}

function CpV2PlaybookChoiceSelector({
  value,
  onChange,
}: {
  value: PlaybookChoice;
  onChange: (choice: PlaybookChoice) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Use playbook"
      className="cpv2-playbook-choice-group"
    >
      {(["yes", "no"] as PlaybookChoice[]).map((choice) => {
        const selected = value === choice;
        return (
          <CpButton
            key={choice}
            type="button"
            role="radio"
            aria-checked={selected}
            className={cn(
              "cpv2-playbook-choice",
              selected && "is-selected",
            )}
            onClick={() => onChange(choice)}
          >
            {choice === "yes" ? "Yes" : "No"}
          </CpButton>
        );
      })}
    </div>
  );
}

function CpV2UploadStep({ workflow }: { workflow: ClauseIqWorkflow }) {
  return (
    <CpStateCard className="cpv2-upload-card" state="active">
      <h2>Upload Contract</h2>
      <CpPlaybookDisclaimer
        variant="callout"
        parameter={workflow.selectedParameter}
      />
      {workflow.file ? (
        <div className="mt-orbit-base">
          <CpSelectedFileRow
            file={workflow.file}
            onRemove={workflow.actions.clearFile}
          />
        </div>
      ) : (
        <CpClauseIqDropzone onFile={workflow.actions.validateAndSetFile} />
      )}
    </CpStateCard>
  );
}

function CpV2ProcessingStep({
  heading,
  copy,
  parameter,
  workflow,
}: {
  heading: string;
  copy: string;
  parameter: AnalysisParameterSelection | null;
  workflow: ClauseIqWorkflow;
}) {
  return (
    <CpStateCard className="cpv2-processing-card" state="active">
      <div className="cpv2-processing-header">
        <CpSpinner size="Medium" />
        <div>
          <h2>{heading}</h2>
          <p>{copy}</p>
        </div>
      </div>
      <CpPlaybookDisclaimer variant="inline" parameter={parameter} />
      {workflow.file ? (
        <div className="mt-orbit-base">
          <CpSelectedFileRow
            file={workflow.file}
            onRemove={workflow.actions.clearFile}
          />
        </div>
      ) : null}
    </CpStateCard>
  );
}

function CpV2GenerateResultsStep() {
  return (
    <section className="cpv2-live-step cpv2-live-generate">
      <span className="cpv2-live-rocket" aria-hidden="true">
        <CpIcon icon={CPV2_ROCKET_ICON} size={64} />
      </span>
      <h2>Your Contract insights are on the way!</h2>
      <p>
        Click <strong>'Finish'</strong> to complete the process. Please allow a
        few minutes for the analysis to run. When it is ready you will receive a
        notification and can return to this page to download your report.
      </p>
    </section>
  );
}

function CpV2ModalResultsStep({
  workflow,
  onViewResult,
  showGenerateStep,
}: {
  workflow: ClauseIqWorkflow;
  onViewResult: () => void;
  showGenerateStep: boolean;
}) {
  const supplier = workflow.resultsInitiative.suppliers[0];
  const firstAnalysis = supplier?.analyses[0];
  const rerunJourneyVisible =
    workflow.rerunUploadVisible || workflow.rerunProcessing;
  const rerunParameter = workflow.rerunProcessing
    ? workflow.rerunSelectedParameter ?? workflow.selectedParameter
    : workflow.rerunSelectedParameter;
  const rerunParametersComplete = hasCompleteAnalysisParameters(rerunParameter);

  return (
    <section className="cpv2-clause-card-stack">
      {firstAnalysis ? (
        <CpV2AnalysisOutputCard
          title="Here is your Analysis Result"
          fileName={firstAnalysis.fileName}
          clausesReviewed={firstAnalysis.clausesReviewed}
          latest={!workflow.newAnalysisSectionVisible}
          parameters={workflow.selectedAnalysisParameters}
          onRunAgain={workflow.actions.showRunAgainUpload}
          onViewResult={onViewResult}
        />
      ) : null}

      {workflow.newAnalysisSectionVisible ? (
        <div className="cpv2-new-analysis-divider">
          <span>New Analysis</span>
        </div>
      ) : null}

      {rerunJourneyVisible ? (
        <div className="cpv2-clause-card-stack">
          <CpV2AnalysisParameterCards
            selectedParameter={rerunParameter}
            cardState={
              workflow.rerunProcessing || rerunParametersComplete
                ? "default"
                : "active"
            }
            locked={workflow.rerunProcessing}
            onPlaybookChoiceChange={
              workflow.actions.handleRerunPlaybookChoiceChange
            }
            onBasisSelect={workflow.actions.handleRerunBasisSelect}
            onCategorySelect={workflow.actions.handleRerunCategorySelect}
            onBenchmarkConfirm={workflow.actions.handleRerunBenchmarkConfirm}
            onBenchmarkEdit={workflow.actions.handleRerunBenchmarkEdit}
            onBenchmarkSkip={workflow.actions.handleRerunBenchmarkSkip}
            onBasisEdit={workflow.actions.handleRerunBasisEdit}
          />

          {workflow.rerunUploadVisible && rerunParametersComplete ? (
            <CpStateCard className="cpv2-upload-card" state="active">
              <h2>Upload Contract</h2>
              <CpPlaybookDisclaimer
                variant="callout"
                parameter={rerunParameter}
              />
              {workflow.file ? (
                <div className="mt-orbit-base">
                  <CpSelectedFileRow
                    file={workflow.file}
                    onRemove={workflow.actions.clearFile}
                  />
                </div>
              ) : (
                <CpClauseIqDropzone
                  onFile={workflow.actions.validateAndSetFile}
                />
              )}
            </CpStateCard>
          ) : null}

          {isCpV2RerunGenerateStep(workflow, showGenerateStep) ? (
            <CpV2GenerateResultsStep />
          ) : null}
        </div>
      ) : null}

      {workflow.rerunProcessing ? (
        <CpV2ProcessingStep
          heading="Analysing New Contract"
          copy="Finding clauses in your new contract..."
          parameter={rerunParameter}
          workflow={workflow}
        />
      ) : null}

      {workflow.completedRerunAnalysis ? (
        <CpV2AnalysisOutputCard
          title="Latest Analysis Result"
          fileName={workflow.completedRerunAnalysis.fileName}
          clausesReviewed={workflow.completedRerunAnalysis.clausesReviewed}
          latest
          parameters={workflow.completedRerunAnalysisParameters}
          onRunAgain={workflow.actions.showRunAgainUpload}
          onViewResult={onViewResult}
        />
      ) : null}
    </section>
  );
}

function CpV2AnalysisOutputCard({
  title,
  fileName,
  clausesReviewed,
  latest,
  parameters,
  onRunAgain,
  onViewResult,
}: {
  title: string;
  fileName: string;
  clausesReviewed: number;
  latest?: boolean;
  parameters: Array<{ label: string; value: string }>;
  onRunAgain: () => void;
  onViewResult: () => void;
}) {
  return (
    <CpStateCard className="cpv2-modal-result-card" state="default">
      <div className="cpv2-modal-result-header">
        <div>
          <div className="cpv2-modal-result-chips">
            <Chip label="Analysis Result" size="Small" variant="Outline" />
            {latest ? (
              <Chip label="Latest output" size="Small" variant="Outline" />
            ) : null}
          </div>
          <h2>{title}</h2>
        </div>
      </div>
      <div className="cpv2-modal-result-summary">
        <div>
          <span>File</span>
          <strong>{fileName}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>Reviewed {clausesReviewed} clauses</strong>
        </div>
      </div>
      {parameters.length > 0 ? (
        <div className="cpv2-modal-result-parameters">
          {parameters.map((parameter) => (
            <span key={`${parameter.label}-${parameter.value}`}>
              <strong>{parameter.label}</strong>
              {parameter.value}
            </span>
          ))}
        </div>
      ) : null}
      <CpInlineBanner
        className="cpv2-modal-result-banner"
        label="Summary shown below. View the result for full details."
        variant="Information"
      />
      <div className="cpv2-modal-result-actions">
        <CpButton orbitVariant="Primary" type="button" onClick={onViewResult}>
          <CpIcon icon={CP_FA.chart} size={13} />
          View Result
        </CpButton>
        <CpButton orbitVariant="Secondary" type="button" onClick={onRunAgain}>
          <CpIcon icon="\uf2f1" size={13} />
          Run Analysis Again
        </CpButton>
      </div>
    </CpStateCard>
  );
}

function CpSelectedFileRow({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  return (
    <CpFileRow
      className="cpv2-selected-file-row"
      fileName={file.name}
      onRemove={onRemove}
      removeLabel={`Remove ${file.name}`}
    />
  );
}

function WorkspaceView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [clauseModalOpen, setClauseModalOpen] = useState(false);
  const [clauseModalOpened, setClauseModalOpened] = useState(false);
  const [supplierOutputModalOpen, setSupplierOutputModalOpen] = useState(false);
  const [resultsDashboardModalOpen, setResultsDashboardModalOpen] =
    useState(false);
  const [dashboardInModal, setDashboardInModal] = useState(
    readStoredDashboardInModalPreference,
  );
  const [analysisStatus, setAnalysisStatus] =
    useState<CpV2AnalysisStatus>("idle");
  const canvasRef = useRef<HTMLElement | null>(null);
  const workflow = useClauseIqWorkflow({
    autoAdvanceParameters: false,
    autoStartProcessingOnFile: false,
    initialStep: "welcome",
    initialInitiative: CP_CLAUSEIQ_INITIATIVE,
    initialSelectedParameter: null,
    onProcessingComplete: () => setAnalysisStatus("completed"),
    onRerunComplete: () => setAnalysisStatus("completed"),
    useFirstRunResults: true,
  });

  const clauseIqOpen = expanded?.startsWith("ClauseIQ") ?? false;
  const openClauseModal = () => {
    if (analysisStatus === "completed") {
      workflow.actions.startAnotherInitiative(false);
    }
    setClauseModalOpened(true);
    setClauseModalOpen(true);
  };
  const setDashboardModalPreference = (enabled: boolean) => {
    setDashboardInModal(enabled);
    writeStoredDashboardInModalPreference(enabled);
  };
  const closeResultsDashboardModal = () => {
    setResultsDashboardModalOpen(false);
    setSearchParams(withoutDashboardModalParams(searchParams), {
      replace: true,
    });
  };
  const viewResult = () => {
    if (!dashboardInModal) {
      navigate(PROTOTYPE_CP_V2_RESULT_ROUTE);
      return;
    }

    setSearchParams(withDashboardModalParams(searchParams), { replace: false });
    setResultsDashboardModalOpen(true);
  };
  const openSupplierOutputModal = () => {
    setSupplierOutputModalOpen(true);
  };
  const closeSupplierOutputModal = () => {
    setSupplierOutputModalOpen(false);
  };

  useEffect(() => {
    if (workflow.step === "processing" || workflow.rerunProcessing) {
      setAnalysisStatus("in-progress");
    }
  }, [workflow.rerunProcessing, workflow.step]);

  useEffect(() => {
    if (clauseIqOpen) {
      requestAnimationFrame(() => {
        if (canvasRef.current) canvasRef.current.scrollTop = 110;
      });
    }
  }, [clauseIqOpen]);

  return (
    <>
      <BlueWorkspaceHeader
        dashboardInModal={dashboardInModal}
        onDashboardInModalChange={setDashboardModalPreference}
      />
      <main className="cpv2-workspace-canvas" ref={canvasRef}>
        <div className="cpv2-workspace-inner">
          <div className="cpv2-accordion-stack">
            <section className="cpv2-milestone-card">
              <div className="cpv2-milestone-title">
                <span className="cpv2-diamond" />
                <span>Initiative Complete.</span>
                <div className="cpv2-milestone-meta">
                  <PersonAvatar person={people.pm} size="Extra Small" />
                  <CpIcon icon={FA.circleInfo} size={13} /> 2026-01-29{" "}
                  <span className="cpv2-overdue">(119 days ago)</span>
                  <span className="cpv2-overdue-pill">Overdue</span>
                  <CpButton className="cpv2-mark-complete">
                    <CpIcon icon={CP_FA.check} size={13} /> Mark complete
                  </CpButton>
                </div>
              </div>
              <div style={{ color: "#6a707b" }}>
                No description added to this milestone yet. To add a
                description, go to the “Initiative milestones” tab and edit your
                milestone description.
              </div>
            </section>
            {workspaceSections.map((section) => {
              const isClause = section.startsWith("ClauseIQ");
              const isOpen = expanded === section;
              const isSummaryRow =
                section === "Milestone Deliverables" ||
                section === "Guidance & Resources" ||
                section === "Task Manager";
              const summaryMeta =
                section === "Milestone Deliverables" ? (
                  <MetricBadges />
                ) : section === "Guidance & Resources" ? (
                  <span className="cpv2-tiny-metric">Steps (6)</span>
                ) : section === "Task Manager" ? (
                  <span className="cpv2-accordion-badges">
                    <span className="cpv2-tiny-metric">To-Do (0)</span>
                    <span className="cpv2-tiny-metric">In-Progress (0)</span>
                    <span className="cpv2-tiny-metric green">Done (0)</span>
                  </span>
                ) : null;
              return (
                <section
                  className={`cpv2-accordion${isSummaryRow ? " is-summary-row" : ""}`}
                  key={section}
                >
                  <CpButton
                    className="cpv2-accordion-head"
                    aria-expanded={isOpen}
                    onClick={() => setExpanded(isOpen ? null : section)}
                  >
                    {isClause ? (
                      <CpIcon icon={CP_FA.wrench} size={15} />
                    ) : section === "Milestone Deliverables" ? (
                      <CpIcon icon={CP_FA.file} size={15} />
                    ) : section === "Guidance & Resources" ? (
                      <CpIcon icon={FA.circleCheck} size={15} />
                    ) : section === "Task Manager" ? (
                      <CpIcon icon={CP_FA.list} size={14} />
                    ) : (
                      <CpIcon icon={CP_FA.wrench} size={15} />
                    )}
                    <span className="cpv2-accordion-title">{section}</span>
                    {summaryMeta ? (
                      <span className="cpv2-accordion-meta">{summaryMeta}</span>
                    ) : null}
                    <span className="cpv2-accordion-chevron">
                      <CpIcon
                        icon={isOpen ? CP_FA.chevronUp : CP_FA.chevronDown}
                        size={15}
                      />
                    </span>
                  </CpButton>
                  {isClause && isOpen ? (
                    <ClauseIqLauncherCard
                      analysisStatus={analysisStatus}
                      hasOpened={clauseModalOpened}
                      onHistoryOpen={openSupplierOutputModal}
                      onOpen={openClauseModal}
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
          onViewResult={() => {
            setClauseModalOpen(false);
            viewResult();
          }}
        />
      ) : null}
      {supplierOutputModalOpen ? (
        <CpV2SupplierOutputsModal
          workflow={workflow}
          onClose={closeSupplierOutputModal}
          onViewResult={viewResult}
        />
      ) : null}
      {resultsDashboardModalOpen ? (
        <CpV2ResultsDashboardModal onClose={closeResultsDashboardModal} />
      ) : null}
    </>
  );
}

export default function PrototypeCPV2() {
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
    <div className="prototype-cp-v2">
      <div className="cpv2-app">
        <CpRail />
        <section className="cpv2-main">
          {view === "projects" ? (
            <ProjectsView
              expandedProject={expandedProject}
              setExpandedProject={setExpandedProject}
              onViewProject={() => setView("initiatives")}
            />
          ) : null}
          {view === "initiatives" ? (
            <InitiativesView onOpenInitiative={() => setView("workspace")} />
          ) : null}
          {view === "workspace" ? <WorkspaceView /> : null}
        </section>
        <CpButton className="cpv2-floating-jasper">
          <CpIcon icon={CP_FA.sparkles} size={13} />
          Ask Jasper
        </CpButton>
        <CpButton className="cpv2-floating-help" aria-label="Help">
          ?
        </CpButton>
      </div>
      <V5OrbitToastHost />
      <CpOrbitToastHost />
    </div>
  );
}
