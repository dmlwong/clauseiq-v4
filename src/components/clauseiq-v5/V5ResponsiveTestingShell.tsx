import { ReactNode } from "react";
import { HeaderPresets, PageHeader } from "@orbit";

import { CiqSidebar } from "@/components/clauseiq-v5/Sidebar";
import { V5OrbitRoot } from "@/components/clauseiq-v5/V5OrbitRoot";
import { cn } from "@/lib/utils";

interface Props {
  title?: string;
  subtitle?: string;
  titleIcon?: ReactNode;
  headerRight?: ReactNode;
  headerRightPlacement?: "end" | "title";
  subheader?: ReactNode;
  subheaderClassName?: string;
  sidePanel?: ReactNode;
  rightPanel?: ReactNode;
  mainClassName?: string;
  children: ReactNode;
}

/** Shared Orbit-backed shell for all v5 surfaces. */
export function V5ResponsiveTestingShell({
  title,
  subtitle,
  titleIcon,
  headerRight,
  headerRightPlacement = "end",
  subheader,
  subheaderClassName,
  sidePanel,
  rightPanel,
  mainClassName,
  children,
}: Props) {
  const headerIcon = titleIcon ? "\uf013" : "\uf15b";

  return (
    <V5OrbitRoot>
      <div
        className="clauseiq-responsive-testing-sandbox h-screen flex bg-background overflow-hidden"
        style={{
          background: "var(--orbit-color-bg-default)",
          color: "var(--orbit-color-text-primary)",
          fontFamily: "var(--orbit-font-family-sans)",
        }}
      >
        <div className="clauseiq-responsive-desktop-sidebar h-screen sticky top-orbit-none">
          <CiqSidebar />
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
            <div className={subheaderClassName ?? "shrink-0 border-b border-border bg-background/95 px-orbit-m py-orbit-base backdrop-blur"}>
              {subheader}
            </div>
          )}
          <div className="flex flex-1 min-h-0">
            {sidePanel && (
              <aside className="hidden w-[280px] shrink-0 border-r border-border bg-muted/20 md:flex md:min-h-0 md:flex-col">
                {sidePanel}
              </aside>
            )}
            <main className={cn("clauseiq-responsive-main v5-hover-scrollbar flex-1 overflow-y-auto min-h-0", mainClassName)}>
              {children}
            </main>
            {rightPanel && (
              <aside className="clauseiq-responsive-right-panel v5-hover-scrollbar overflow-y-auto border-l border-border bg-white">
                {rightPanel}
              </aside>
            )}
          </div>
        </div>
      </div>
    </V5OrbitRoot>
  );
}
