import {
  BarChart3,
  Bell,
  ChevronDown,
  ChevronRight,
  Database,
  FolderKanban,
  Home,
  Leaf,
  Route,
  Search,
  Sparkles,
  Target,
} from "@/components/clauseiq-v6a/v6aIcons";
import { NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/clauseiq-v6a/orbit-ui/select";
import { showV6OrbitToast as toast } from "@/components/clauseiq-v6a/V6OrbitToast";
import { cn } from "@/lib/utils";

const topNav = [
  { label: "Notifications", icon: Bell, badge: "3" },
  { label: "Data Tracker & Insights", icon: Database },
  { label: "Content Search", icon: Search },
];

const deliverNav = [
  { to: "/delivery-engine", label: "Project Management", icon: FolderKanban },
  { label: "Route to Market", icon: Route },
  { label: "Sourcing Execution", icon: BarChart3 },
];

export function CiqSidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const showResultScenarioControl = pathname === "/clauseiq-v6a/output-panel";
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
    <aside className="hidden h-screen w-[298px] shrink-0 flex-col border-r border-orbit-border bg-orbit-card text-orbit-fg md:flex">
      <div className="flex h-16 items-center gap-orbit-s border-b border-orbit-border px-orbit-base">
        <div className="grid h-8 w-8 place-items-center rounded-orbit-sm bg-orbit-primary text-orbit-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-orbit-sm font-orbit-semibold text-orbit-fg">Connected Platform</div>
          <div className="flex items-center gap-orbit-xs text-orbit-sm text-orbit-fg-secondary">
            Yorkshire Water <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-orbit-s py-orbit-base">
        <div className="space-y-orbit-xs">
          {topNav.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                className="flex w-full items-center gap-orbit-s rounded-orbit-md px-orbit-s py-orbit-s text-orbit-sm text-orbit-fg-secondary transition-colors hover:bg-orbit-surface hover:text-orbit-fg"
                onClick={() => toast({ title: `${item.label} — coming soon` })}
              >
                <Icon className="h-4 w-4 text-orbit-fg-secondary" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-orbit-heading text-orbit-xs font-orbit-semibold text-orbit-inverse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="my-orbit-base h-px bg-orbit-surface" />

        <button className="flex w-full items-center gap-orbit-s rounded-orbit-md px-orbit-s py-orbit-s text-orbit-sm text-orbit-fg-secondary transition-colors hover:bg-orbit-surface hover:text-orbit-fg">
          <span className="h-2 w-2 rounded-full bg-orbit-accent-blue" />
          <span className="flex-1 text-left">Identify</span>
          <ChevronDown className="h-4 w-4" />
        </button>

        <div className="mt-orbit-xs">
          <button className="flex w-full items-center gap-orbit-s rounded-orbit-md px-orbit-s py-orbit-s text-orbit-sm text-orbit-fg-secondary">
            <span className="h-2 w-2 rounded-full bg-orbit-accent-teal" />
            <span className="flex-1 text-left">Deliver</span>
            <ChevronDown className="h-4 w-4 rotate-180" />
          </button>
          <div className="mt-orbit-xs space-y-orbit-xs pl-orbit-base">
            {deliverNav.map((item) => {
              const Icon = item.icon;
              const active = item.to ? pathname.startsWith(item.to) : false;
              if (!item.to) {
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => toast({ title: `${item.label} — coming soon` })}
                    className="flex w-full items-center gap-orbit-s rounded-orbit-md px-orbit-s py-orbit-s text-orbit-sm text-orbit-fg-secondary transition-colors hover:bg-orbit-surface hover:text-orbit-fg"
                  >
                    <Icon className="h-4 w-4 text-orbit-fg-secondary" />
                    {item.label}
                  </button>
                );
              }
              return (
                <NavLink
                  key={item.to}
                  to={item.to === "/delivery-engine" ? "/delivery-engine-v6/AAK01-1442" : item.to}
                  className={cn(
                    "flex w-full items-center gap-orbit-s rounded-orbit-md px-orbit-s py-orbit-s text-orbit-sm transition-colors",
                    active ? "bg-orbit-surface font-orbit-medium text-orbit-fg" : "text-orbit-fg-secondary hover:bg-orbit-surface hover:text-orbit-fg",
                  )}
                >
                  <Icon className="h-4 w-4 text-orbit-fg-secondary" />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </div>

        <button className="mt-orbit-xs flex w-full items-center gap-orbit-s rounded-orbit-md px-orbit-s py-orbit-s text-orbit-sm text-orbit-fg-secondary transition-colors hover:bg-orbit-surface hover:text-orbit-fg">
          <span className="h-2 w-2 rounded-full bg-orbit-accent-amber" />
          <span className="flex-1 text-left">Sustain</span>
          <ChevronDown className="h-4 w-4" />
        </button>

        <div className="my-orbit-base h-px bg-orbit-surface" />

        <div className="mb-orbit-s flex items-center justify-between px-orbit-xs text-orbit-sm text-orbit-fg-secondary">
          <span>My Work</span>
          <Search className="h-4 w-4" />
        </div>
        <div className="space-y-orbit-s px-orbit-xs">
          <NavLink to="/clauseiq-v6a" className="block rounded-orbit-md py-orbit-xs text-orbit-sm text-orbit-fg hover:text-orbit-fg">
            ClauseIQ
            <span className="block text-orbit-xs text-orbit-fg-secondary">2d ago | TestClientTaxonomyCreatedBy</span>
          </NavLink>
          <button
            type="button"
            className="block w-full rounded-orbit-md py-orbit-xs text-left text-orbit-sm text-orbit-fg hover:text-orbit-fg"
            onClick={() => toast({ title: "Usability Study — coming soon" })}
          >
            Usability Study
            <span className="block text-orbit-xs text-orbit-fg-secondary">Research hub</span>
          </button>
          <button
            type="button"
            className="block w-full rounded-orbit-md py-orbit-xs text-left text-orbit-sm text-orbit-fg hover:text-orbit-fg"
            onClick={() => toast({ title: "Sustain — coming soon" })}
          >
            <span className="inline-flex items-center gap-orbit-s">
              <Leaf className="h-3.5 w-3.5" />
              Sustainability review
            </span>
          </button>
          <button
            type="button"
            className="block w-full rounded-orbit-md py-orbit-xs text-left text-orbit-sm text-orbit-fg hover:text-orbit-fg"
            onClick={() => toast({ title: "Identification — coming soon" })}
          >
            <span className="inline-flex items-center gap-orbit-s">
              <Target className="h-3.5 w-3.5" />
              Pipeline triage
            </span>
          </button>
        </div>
      </nav>

      <div className="border-t border-orbit-border p-orbit-s">
        <div className="mb-orbit-s flex items-center gap-orbit-s px-orbit-xs py-orbit-xs">
          <div className="grid h-6 w-6 place-items-center rounded-full bg-orbit-primary text-orbit-xs font-orbit-semibold text-orbit-primary-foreground">DW</div>
          <span className="text-orbit-sm text-orbit-fg">Derek Wong</span>
        </div>
        <NavLink
          to="/"
          className="flex w-full items-center gap-orbit-s rounded-orbit-md px-orbit-s py-orbit-s text-orbit-sm font-orbit-medium text-orbit-fg-secondary transition-colors hover:bg-orbit-surface hover:text-orbit-fg"
        >
          <Home className="h-4 w-4 text-orbit-fg-secondary" />
          <span>Prototype home</span>
        </NavLink>
        {showResultScenarioControl && (
          <div className="mt-orbit-s rounded-orbit-md border border-orbit-border bg-orbit-surface p-orbit-s">
            <label className="mb-orbit-xs block text-orbit-xs font-orbit-medium uppercase tracking-wide text-orbit-fg-secondary">
              Result scenario
            </label>
            <Select value={resultScenario} onValueChange={handleResultScenarioChange}>
              <SelectTrigger className="h-8 bg-orbit-card text-orbit-xs">
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
