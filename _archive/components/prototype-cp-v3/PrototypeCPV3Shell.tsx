import type { ReactNode } from "react";
import { CpSideRail, HeaderPresets, PageHeader } from "@orbit-cp";
import type { CpSideRailItem } from "@orbit-cp";
import { cn } from "@/lib/utils";
import { PrototypeCPV3Root } from "@/components/prototype-cp-v3/PrototypeCPV3Root";

/**
 * Efficio Connected Platform shell for CP v3 — the efficio-theme counterpart of v6a's V6Shell.
 * Same layout contract (side rail + tool PageHeader + [main | right panel] + sidebar overlay),
 * so the ported ClauseIQ page mounts through it exactly as it did in v6a — only the theme (efficio
 * base, no data-theme) and the shell chrome (CP side rail) differ.
 */

// FA Pro glyphs, copied to keep the namespace self-contained.
const ICON = { home: "", projects: "", chart: "", search: "", bell: "", gear: "" } as const;

const RAIL_ITEMS: CpSideRailItem[] = [
  { id: "home", label: "Home", icon: ICON.home },
  { id: "projects", label: "Projects", icon: ICON.projects, active: true },
  { id: "insights", label: "Insights", icon: ICON.chart },
  { id: "search", label: "Search", icon: ICON.search },
  { id: "notifications", label: "Notifications", icon: ICON.bell },
  { id: "settings", label: "Settings", icon: ICON.gear },
];

interface Props {
  title?: string;
  subtitle?: string;
  headerRight?: ReactNode;
  mainClassName?: string;
  rightPanel?: ReactNode;
  rightPanelClassName?: string;
  sidebarOverlay?: ReactNode;
  children: ReactNode;
}

export function PrototypeCPV3Shell({
  title,
  subtitle,
  headerRight,
  mainClassName,
  rightPanel,
  rightPanelClassName,
  sidebarOverlay,
  children,
}: Props) {
  return (
    <PrototypeCPV3Root>
      <div
        className="flex h-screen overflow-hidden"
        style={{
          background: "var(--orbit-color-bg-default)",
          color: "var(--orbit-color-text-primary)",
        }}
      >
        <div className="hidden h-screen shrink-0 md:block" style={{ width: "var(--orbit-cp-shell-rail-width)" }}>
          <div className="fixed inset-y-0 left-0 z-40 h-screen" style={{ width: "var(--orbit-cp-shell-rail-width)" }}>
            <CpSideRail items={RAIL_ITEMS} user={{ name: "Derek Wong", initials: "DW" }} logoLabel="Connected Platform" />
          </div>
        </div>
        {sidebarOverlay ? (
          <div className="fixed bottom-[72px] left-0 z-[2147483601] hidden px-2 md:block" style={{ width: "var(--orbit-cp-shell-rail-width)" }}>
            {sidebarOverlay}
          </div>
        ) : null}
        <div className="flex h-screen min-w-0 flex-1 flex-col">
          {(title || headerRight) && (
            <header className="relative shrink-0 bg-[var(--orbit-color-bg-default)]">
              <PageHeader type="tool" title={title ?? ""} subtitle={subtitle} icon={""} {...HeaderPresets.deliver} />
              {headerRight && (
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center px-orbit-m">
                  <div className="pointer-events-auto flex max-w-[min(42vw,480px)] items-center justify-end">
                    {headerRight}
                  </div>
                </div>
              )}
            </header>
          )}
          <div className="flex min-h-0 flex-1">
            <main className={cn("flex-1 min-h-0 overflow-y-auto overscroll-contain", mainClassName)}>{children}</main>
            {rightPanel && (
              <aside
                className={cn(
                  "hidden w-[368px] shrink-0 overflow-y-auto border-l border-orbit-border bg-orbit-card xl:w-[400px] lg:block",
                  rightPanelClassName,
                )}
              >
                {rightPanel}
              </aside>
            )}
          </div>
        </div>
      </div>
    </PrototypeCPV3Root>
  );
}
