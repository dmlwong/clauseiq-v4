import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Dropdown, SideNav, Text } from "@orbit";

import { showV6OrbitToast as toast } from "@/components/clauseiq-v6/V6OrbitToast";

const ICON_BELL = "\uf0f3";
const ICON_CHART = "\uf080";
const ICON_DATABASE = "\uf1c0";
const ICON_HOME = "\uf015";
const ICON_LEAF = "\uf06c";
const ICON_MAP = "\uf3c5";
const ICON_ROCKET = "\uf135";
const ICON_SEARCH = "\uf002";
const ICON_TARGET = "\uf140";

export function CiqSidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isResponsiveTestingRoute =
    pathname.startsWith("/clauseiq-responsive-testing") || pathname.startsWith("/initiatives-responsive-testing");
  const clauseIqHomePath = isResponsiveTestingRoute ? "/clauseiq-responsive-testing" : "/clauseiq-v6";
  const showResultScenarioControl =
    pathname === "/clauseiq-v6/output-panel" || pathname === "/clauseiq-responsive-testing/output-panel";
  const resultScenario = searchParams.get("resultScenario") === "history" ? "history" : "empty";

  const goTo = (path: string) => {
    navigate(path);
  };

  const handleResultScenarioChange = (value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value === "history") {
      nextParams.set("resultScenario", "history");
    } else {
      nextParams.delete("resultScenario");
    }
    const nextSearch = nextParams.toString();
    navigate(`${pathname}${nextSearch ? `?${nextSearch}` : ""}`);
  };

  const comingSoon = (label: string) => {
    toast({ title: `${label} - coming soon` });
  };

  return (
    <div className="relative hidden h-screen shrink-0 md:block">
      <SideNav
        appName="Connected Platform"
        clientName="Yorkshire Water"
        navItems={[
          {
            id: "notifications",
            icon: ICON_BELL,
            label: "Notifications",
            badge: 3,
            onClick: () => comingSoon("Notifications"),
          },
          {
            id: "data-tracker",
            icon: ICON_DATABASE,
            label: "Data Tracker & Insights",
            onClick: () => comingSoon("Data Tracker & Insights"),
          },
          {
            id: "content-search",
            icon: ICON_SEARCH,
            label: "Content Search",
            onClick: () => comingSoon("Content Search"),
          },
        ]}
        sections={[
          {
            id: "identify",
            label: "Identify",
            color: "var(--orbit-color-status-high-bg-information)",
            showChevron: true,
            onClick: () => comingSoon("Identify"),
          },
          {
            id: "deliver",
            label: "Deliver",
            color: "var(--orbit-color-bright-green)",
            expanded: true,
            items: [
              {
                id: "project-management",
                icon: ICON_ROCKET,
                label: "Project Management",
                active: pathname.startsWith("/delivery-engine-v6/AAK01-1442"),
                onClick: () => goTo("/delivery-engine-v6/AAK01-1442"),
              },
              {
                id: "route-to-market",
                icon: ICON_MAP,
                label: "Route to Market",
                muted: true,
                onClick: () => comingSoon("Route to Market"),
              },
              {
                id: "sourcing-execution",
                icon: ICON_CHART,
                label: "Sourcing Execution",
                muted: true,
                onClick: () => comingSoon("Sourcing Execution"),
              },
            ],
          },
          {
            id: "sustain",
            label: "Sustain",
            color: "var(--orbit-color-status-high-bg-warning)",
            showChevron: true,
            onClick: () => comingSoon("Sustain"),
          },
        ]}
        workItems={[
          {
            id: "clauseiq",
            title: "ClauseIQ",
            subtitle: "2d ago | TestClientTaxonomyCreatedBy",
            active:
              pathname.startsWith("/clauseiq-v6") ||
              pathname.startsWith("/initiatives-v6") ||
              isResponsiveTestingRoute,
            onClick: () => goTo(clauseIqHomePath),
          },
          {
            id: "usability-study",
            title: "Usability Study",
            subtitle: "Research hub",
            onClick: () => comingSoon("Usability Study"),
          },
          {
            id: "sustainability-review",
            title: "Sustainability review",
            subtitle: "Sustain",
            onClick: () => comingSoon("Sustainability review"),
          },
          {
            id: "pipeline-triage",
            title: "Pipeline triage",
            subtitle: "Identification",
            onClick: () => comingSoon("Pipeline triage"),
          },
          {
            id: "prototype-home",
            title: "Prototype home",
            subtitle: "Timeline",
            active: pathname === "/",
            onClick: () => goTo("/"),
          },
        ]}
        onWorkSearch={() => comingSoon("Work search")}
        workHeading="My Work"
        userName="Derek Wong"
        userInitials="DW"
        profileMenuIcon={ICON_HOME}
        profileMenuAriaLabel="Go to prototype home"
        onProfileMenu={() => goTo("/")}
      />

      {showResultScenarioControl ? (
        <div className="absolute bottom-orbit-mega left-[calc(var(--orbit-space-s)+var(--orbit-space-xs))] right-[calc(var(--orbit-space-s)+var(--orbit-space-xs))] rounded-md border border-[var(--orbit-color-sidenav-divider)] bg-[var(--orbit-color-sidenav-active-bg)] p-orbit-s shadow-sm">
          <Text as="div" size="Small" variant="Inverse">
            Result scenario
          </Text>
          <div className="clauseiq-v6-result-scenario-dropdown mt-orbit-s">
            <Dropdown
              ariaLabel="Result scenario"
              value={resultScenario}
              options={[
                { label: "No previous analysis", value: "empty" },
                { label: "Previous analysis", value: "history" },
              ]}
              onChange={handleResultScenarioChange}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
