import { ReactNode } from "react";
import { CiqSidebar } from "@/components/clauseiq-v6a/Sidebar";
import { cn } from "@/lib/utils";
import { V6OrbitRoot } from "@/components/clauseiq-v6a/V6OrbitRoot";

interface Props {
  title?: string;
  subtitle?: string;
  titleIcon?: ReactNode;
  headerRight?: ReactNode;
  headerRightPlacement?: "end" | "title";
  subheader?: ReactNode;
  subheaderClassName?: string;
  mainClassName?: string;
  sidePanel?: ReactNode;
  rightPanel?: ReactNode;
  rightPanelClassName?: string;
  children: ReactNode;
}

/** V6A shell: v4 chrome wrapped around the isolated v6a Orbit theme scope. */
export function V6Shell({
  title,
  subtitle,
  titleIcon,
  headerRight,
  headerRightPlacement = "end",
  subheader,
  subheaderClassName,
  mainClassName,
  sidePanel,
  rightPanel,
  rightPanelClassName,
  children,
}: Props) {
  return (
    <V6OrbitRoot>
      <div className="h-screen flex bg-orbit-canvas overflow-hidden">
        <div className="hidden md:flex h-screen sticky top-0">
          <CiqSidebar />
        </div>
        <div className="flex-1 flex flex-col min-w-0 h-screen">
          {(title || headerRight) && (
            <header className="h-16 shrink-0 border-b border-orbit-border bg-orbit-card flex items-center justify-between px-orbit-m gap-orbit-s">
              <div className="flex min-w-0 items-center gap-orbit-s">
                {titleIcon}
                <div className="min-w-0">
                  {title && <div className="font-orbit-semibold text-orbit-fg leading-orbit-snug truncate">{title}</div>}
                  {subtitle && <div className="text-orbit-xs text-orbit-fg-secondary leading-orbit-snug truncate">{subtitle}</div>}
                </div>
              </div>
              {headerRight && headerRightPlacement === "end" && (
                <div className="flex items-center gap-orbit-s">{headerRight}</div>
              )}
              {headerRight && headerRightPlacement === "title" && (
                <div className="flex items-center gap-orbit-s">{headerRight}</div>
              )}
            </header>
          )}
          {subheader && (
            <div className={subheaderClassName ?? "shrink-0 border-b border-orbit-border bg-orbit-canvas/95 px-orbit-m py-orbit-s backdrop-blur"}>
              {subheader}
            </div>
          )}
          <div className="flex flex-1 min-h-0">
            {sidePanel && (
              <aside className="hidden w-[280px] shrink-0 border-r border-orbit-border bg-orbit-surface/20 md:flex md:min-h-0 md:flex-col">
                {sidePanel}
              </aside>
            )}
            <main className={cn("v4-hover-scrollbar flex-1 overflow-y-auto min-h-0", mainClassName)}>
              {children}
            </main>
            {rightPanel && (
              <aside
                className={cn(
                  "v4-hover-scrollbar hidden w-[368px] shrink-0 overflow-y-auto border-l border-orbit-border bg-orbit-card xl:w-[400px] lg:block",
                  rightPanelClassName,
                )}
              >
                {rightPanel}
              </aside>
            )}
          </div>
        </div>
      </div>
    </V6OrbitRoot>
  );
}
