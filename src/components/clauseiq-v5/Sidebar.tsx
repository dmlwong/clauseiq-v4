import {
  BarChart3,
  Bell,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Database,
  Home,
  Leaf,
  MapPin,
  Rocket,
  Search,
  Sparkles,
  Target,
} from "lucide-react";
import { NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/clauseiq-v5/orbit-ui/select";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const topNav = [
  { label: "Notifications", icon: Bell, badge: "3" },
  { label: "Data Tracker & Insights", icon: Database },
  { label: "Content Search", icon: Search },
];

const deliverNav = [
  { to: "/delivery-engine-v5/AAK01-1442", label: "Project Management", icon: Rocket },
  { label: "Route to Market", icon: MapPin },
  { label: "Sourcing Execution", icon: BarChart3 },
];

export function CiqSidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const showResultScenarioControl = pathname === "/clauseiq-v5/output-panel";
  const resultScenario = searchParams.get("resultScenario") === "history" ? "history" : "empty";

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

  return (
    <aside className="hidden h-screen w-[var(--orbit-sidenav-width)] shrink-0 flex-col border-r border-[var(--orbit-color-sidenav-divider)] bg-[var(--orbit-color-sidenav-bg)] text-white md:flex">
      <div className="flex h-16 items-center gap-3 border-b border-[var(--orbit-color-sidenav-divider)] px-4">
        <div className="grid h-8 w-8 place-items-center rounded bg-[var(--orbit-color-btn-primary-bg)] text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-white">Connected Platform</div>
          <div className="flex items-center gap-1 text-sm text-[var(--orbit-color-sidenav-muted)]">
            Yorkshire Water <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {topNav.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                className="flex w-full items-center gap-3 rounded-[var(--orbit-sidenav-nav-row-radius)] px-3 py-2 text-sm text-[var(--orbit-color-sidenav-muted)] transition-colors hover:bg-[var(--orbit-color-sidenav-active-bg)] hover:text-white"
                onClick={() => toast({ title: `${item.label} — coming soon` })}
              >
                <Icon className="h-4 w-4 text-current" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-[var(--orbit-sidenav-badge-bg)] text-[10px] font-medium text-[var(--orbit-sidenav-badge-fg)]">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="my-4 h-px bg-[var(--orbit-color-sidenav-divider)]" />

        <button className="flex w-full items-center gap-3 rounded-[var(--orbit-sidenav-nav-row-radius)] px-3 py-2 text-sm text-[var(--orbit-color-sidenav-muted)] transition-colors hover:bg-[var(--orbit-color-sidenav-active-bg)] hover:text-white">
          <span className="h-2 w-2 rounded-full bg-[var(--orbit-color-status-high-bg-information)]" />
          <span className="flex-1 text-left">Identify</span>
          <ChevronDown className="h-4 w-4" />
        </button>

        <div className="mt-1">
          <button className="flex w-full items-center gap-3 rounded-[var(--orbit-sidenav-nav-row-radius)] px-3 py-2 text-sm text-white">
            <span className="h-2 w-2 rounded-full bg-[var(--orbit-color-bright-green)]" />
            <span className="flex-1 text-left">Deliver</span>
            <ChevronDown className="h-4 w-4 rotate-180" />
          </button>
          <div className="mt-1 space-y-1 pl-5">
            {deliverNav.map((item) => {
              const Icon = item.icon;
              const active = item.to ? pathname.startsWith(item.to) : false;
              if (!item.to) {
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => toast({ title: `${item.label} — coming soon` })}
                    className="flex w-full items-center gap-2 rounded-[var(--orbit-sidenav-subitem-radius)] px-3 py-2 text-sm text-[var(--orbit-color-sidenav-muted)] transition-colors hover:bg-[var(--orbit-color-sidenav-active-bg)] hover:text-white"
                  >
                    <Icon className="h-4 w-4 text-current" />
                    {item.label}
                  </button>
                );
              }
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-[var(--orbit-sidenav-subitem-radius)] px-3 py-2 text-sm transition-colors",
                    active ? "bg-[var(--orbit-color-sidenav-active-bg)] font-medium text-white" : "text-[var(--orbit-color-sidenav-muted)] hover:bg-[var(--orbit-color-sidenav-active-bg)] hover:text-white",
                  )}
                >
                  <Icon className="h-4 w-4 text-current" />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </div>

        <button className="mt-1 flex w-full items-center gap-3 rounded-[var(--orbit-sidenav-nav-row-radius)] px-3 py-2 text-sm text-[var(--orbit-color-sidenav-muted)] transition-colors hover:bg-[var(--orbit-color-sidenav-active-bg)] hover:text-white">
          <span className="h-2 w-2 rounded-full bg-[var(--orbit-color-status-high-bg-warning)]" />
          <span className="flex-1 text-left">Sustain</span>
          <ChevronDown className="h-4 w-4" />
        </button>

        <div className="my-4 h-px bg-[var(--orbit-color-sidenav-divider)]" />

        <div className="mb-2 flex items-center justify-between px-1 text-sm text-[var(--orbit-sidenav-work-heading-color)]">
          <span>My Work</span>
          <Search className="h-4 w-4" />
        </div>
        <div className="space-y-3 px-1">
          <NavLink to="/clauseiq-v5" className="block rounded-md py-1 text-sm text-white hover:text-white">
            ClauseIQ
            <span className="block text-xs text-[var(--orbit-color-sidenav-muted)]">2d ago | TestClientTaxonomyCreatedBy</span>
          </NavLink>
          <button
            type="button"
            className="block w-full rounded-md py-1 text-left text-sm text-white hover:text-white"
            onClick={() => toast({ title: "Usability Study — coming soon" })}
          >
            Usability Study
            <span className="block text-xs text-[var(--orbit-color-sidenav-muted)]">Research hub</span>
          </button>
          <button
            type="button"
            className="block w-full rounded-md py-1 text-left text-sm text-white hover:text-white"
            onClick={() => toast({ title: "Sustain — coming soon" })}
          >
            <span className="inline-flex items-center gap-2">
              <Leaf className="h-3.5 w-3.5" />
              Sustainability review
            </span>
          </button>
          <button
            type="button"
            className="block w-full rounded-md py-1 text-left text-sm text-white hover:text-white"
            onClick={() => toast({ title: "Identification — coming soon" })}
          >
            <span className="inline-flex items-center gap-2">
              <Target className="h-3.5 w-3.5" />
              Pipeline triage
            </span>
          </button>
        </div>
      </nav>

      <div className="border-t border-[var(--orbit-color-sidenav-divider)] p-3">
        <div className="mb-2 flex items-center gap-2 px-1 py-1">
          <div className="grid h-6 w-6 place-items-center rounded-full bg-[var(--orbit-color-btn-primary-bg)] text-[10px] font-semibold text-white">DW</div>
          <span className="text-sm text-white">Derek Wong</span>
        </div>
        <NavLink
          to="/"
          className="flex w-full items-center gap-2 rounded-[var(--orbit-sidenav-nav-row-radius)] px-3 py-2 text-sm font-medium text-[var(--orbit-color-sidenav-muted)] transition-colors hover:bg-[var(--orbit-color-sidenav-active-bg)] hover:text-white"
        >
          <Home className="h-4 w-4 text-current" />
          <span>Prototype home</span>
        </NavLink>
        {showResultScenarioControl && (
          <div className="mt-3 rounded-md border border-[var(--orbit-color-sidenav-divider)] bg-[var(--orbit-color-sidenav-active-bg)] p-2">
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[var(--orbit-color-sidenav-muted)]">
              Result scenario
            </label>
            <Select value={resultScenario} onValueChange={handleResultScenarioChange}>
              <SelectTrigger className="h-8 bg-white text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="empty">No previous analysis</SelectItem>
                <SelectItem value="history">Previous analysis</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </aside>
  );
}
