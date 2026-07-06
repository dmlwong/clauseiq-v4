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
      <div className="h-screen flex bg-background overflow-hidden">
        <div className="hidden md:flex h-screen sticky top-0">
          <CiqSidebar />
        </div>
        <div className="flex-1 flex flex-col min-w-0 h-screen">
          {(title || headerRight) && (
            <header className="h-16 shrink-0 border-b border-border bg-card flex items-center justify-between px-6 gap-3">
              <div className="flex min-w-0 items-center gap-3">
                {titleIcon}
                <div className="min-w-0">
                  {title && <div className="font-semibold text-foreground leading-tight truncate">{title}</div>}
                  {subtitle && <div className="text-xs text-muted-foreground leading-tight truncate">{subtitle}</div>}
                </div>
              </div>
              {headerRight && headerRightPlacement === "end" && (
                <div className="flex items-center gap-2">{headerRight}</div>
              )}
              {headerRight && headerRightPlacement === "title" && (
                <div className="flex items-center gap-2">{headerRight}</div>
              )}
            </header>
          )}
          {subheader && (
            <div className={subheaderClassName ?? "shrink-0 border-b border-border bg-background/95 px-6 py-3 backdrop-blur"}>
              {subheader}
            </div>
          )}
          <div className="flex flex-1 min-h-0">
            {sidePanel && (
              <aside className="hidden w-[280px] shrink-0 border-r border-border bg-muted/20 md:flex md:min-h-0 md:flex-col">
                {sidePanel}
              </aside>
            )}
            <main className={cn("v4-hover-scrollbar flex-1 overflow-y-auto min-h-0", mainClassName)}>
              {children}
            </main>
            {rightPanel && (
              <aside
                className={cn(
                  "v4-hover-scrollbar hidden w-[368px] shrink-0 overflow-y-auto border-l border-border bg-white xl:w-[400px] lg:block",
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
