import { ReactNode } from "react";
import { CiqSidebar } from "@/components/clauseiq-v4/Sidebar";

interface Props {
  title?: string;
  subtitle?: string;
  titleIcon?: ReactNode;
  headerRight?: ReactNode;
  subheader?: ReactNode;
  subheaderClassName?: string;
  sidePanel?: ReactNode;
  rightPanel?: ReactNode;
  children: ReactNode;
}

/** Shared Orbit-style shell for all v4 surfaces. */
export function V4Shell({
  title,
  subtitle,
  titleIcon,
  headerRight,
  subheader,
  subheaderClassName,
  sidePanel,
  rightPanel,
  children,
}: Props) {
  return (
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
            {headerRight && <div className="flex items-center gap-2">{headerRight}</div>}
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
          <main className="flex-1 overflow-y-auto min-h-0">{children}</main>
          {rightPanel && (
            <aside className="hidden w-[360px] shrink-0 overflow-y-auto border-l border-border bg-white lg:block">
              {rightPanel}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
