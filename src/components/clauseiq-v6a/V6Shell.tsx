import { ReactNode } from "react";
import { HeaderPresets, PageHeader } from "@orbit";
import { CiqSidebar } from "@/components/clauseiq-v5/Sidebar";
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

/** V6A shell: v5 platform chrome wrapped around the isolated v6a Orbit theme scope. */
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
  const headerIcon = titleIcon ? "\uf013" : "\uf15b";

  return (
    <V6OrbitRoot>
      <div
        className="h-screen flex overflow-hidden"
        style={{
          background: "var(--orbit-color-bg-default)",
          color: "var(--orbit-color-text-primary)",
          fontFamily: "var(--orbit-font-family-sans)",
        }}
      >
        <div className="hidden h-screen sticky top-orbit-none md:flex">
          <CiqSidebar prototype="v6a" />
        </div>
        <div className="flex-1 flex flex-col min-w-0 h-screen">
          {(title || headerRight) && (
            <header className="relative shrink-0 bg-[var(--orbit-color-card-bg-default)]">
              <PageHeader
                type="tool"
                title={title ?? ""}
                subtitle={subtitle}
                icon={headerIcon}
                {...HeaderPresets.deliver}
              />
              {headerRight && headerRightPlacement === "end" && (
                <div className="pointer-events-none absolute inset-y-orbit-none right-orbit-none z-10 flex items-center px-orbit-m">
                  <div className="pointer-events-auto flex max-w-[min(42vw,480px)] items-center justify-end">
                    {headerRight}
                  </div>
                </div>
              )}
              {headerRight && headerRightPlacement === "title" && (
                <div className="pointer-events-none absolute left-[calc(var(--orbit-space-mega)+var(--orbit-space-mega)+var(--orbit-space-s)+var(--orbit-space-xs))] top-orbit-s z-10 flex max-w-[min(44vw,420px)] items-center">
                  <div className="pointer-events-auto min-w-0">{headerRight}</div>
                </div>
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
            <main className={cn("v4-hover-scrollbar clauseiq-v6-canvas-grid flex-1 overflow-y-auto min-h-0", mainClassName)}>
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
