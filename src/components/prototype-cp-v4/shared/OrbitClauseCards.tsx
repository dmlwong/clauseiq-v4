import { type CSSProperties, type ReactNode } from "react";
import { Card, type CardState as OrbitCardState } from "@orbit";
import { cn } from "@/lib/utils";

export type SharedOrbitCardStyle = CSSProperties & {
  "--orbit-color-card-indicator-default"?: string;
};

interface OrbitClauseCardFrameProps {
  domId?: string;
  highlighted?: boolean;
  state?: OrbitCardState;
  indicator?: boolean;
  style?: SharedOrbitCardStyle;
  children: ReactNode;
}

export function OrbitClauseCardFrame({
  domId,
  highlighted = false,
  state = "Default",
  indicator,
  style,
  children,
}: OrbitClauseCardFrameProps) {
  return (
    <div
      id={domId}
      className={cn("rounded-lg transition-colors", highlighted && "ring-2 ring-primary/40")}
    >
      <Card type="Static" padding="Base" state={state} indicator={indicator} style={style}>
        {children}
      </Card>
    </div>
  );
}

interface OrbitClauseCardHeaderProps {
  title: string;
  metadata: string;
  badges?: ReactNode;
}

export function OrbitClauseCardHeader({
  title,
  metadata,
  badges,
}: OrbitClauseCardHeaderProps) {
  return (
    <div className="flex flex-col gap-orbit-s">
      <div className="flex flex-wrap items-center justify-between gap-orbit-s">
        <div className="flex flex-wrap items-center gap-orbit-s">{badges}</div>
        <p className="cpv2-type-xs text-muted-foreground">{metadata}</p>
      </div>
      <h3 className="cpv2-orbit-heading-label text-foreground">{title}</h3>
    </div>
  );
}

export function OrbitFindingCallout({
  children,
  icon,
}: {
  children: ReactNode;
  icon: ReactNode;
}) {
  return (
    <div className="mt-orbit-base rounded-md border border-border bg-white px-orbit-base py-orbit-s">
      <div className="flex items-start gap-orbit-s">
        <span className="mt-orbit-xxs grid h-5 w-5 shrink-0 place-items-center rounded-full border border-border bg-background text-muted-foreground">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="cpv2-type-xs cpv2-orbit-weight-semibold uppercase text-muted-foreground">
            Finding
          </p>
          <p className="mt-orbit-xxs cpv2-type-xs cpv2-orbit-weight-medium cpv2-leading-normal text-foreground/85">
            {children}
          </p>
        </div>
      </div>
    </div>
  );
}

export function OrbitRecommendedActionCallout({
  children,
  icon,
  compactTop = false,
}: {
  children: ReactNode;
  icon: ReactNode;
  compactTop?: boolean;
}) {
  return (
    <div
      className={cn(
        compactTop ? "mt-orbit-s" : "mt-orbit-base",
        "rounded-md border border-border bg-white px-orbit-base py-orbit-s",
      )}
    >
      <div className="flex items-start gap-orbit-s">
        <span className="mt-orbit-xxs grid h-5 w-5 shrink-0 place-items-center rounded-full border border-border bg-background text-muted-foreground">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="cpv2-type-xs cpv2-orbit-weight-semibold uppercase text-muted-foreground">
            Recommended action
          </p>
          <p className="mt-orbit-xxs cpv2-type-xs cpv2-orbit-weight-medium cpv2-leading-normal text-foreground">
            {children}
          </p>
        </div>
      </div>
    </div>
  );
}

interface OrbitHandledClauseCardProps {
  domId?: string;
  highlighted?: boolean;
  state?: OrbitCardState;
  indicator?: boolean;
  style?: SharedOrbitCardStyle;
  headerBadges?: ReactNode;
  itemId: string;
  category?: string;
  title: string;
  requestedChange: string;
  rationale?: string;
  actions?: ReactNode;
  editor?: ReactNode;
}

export function OrbitHandledClauseCard({
  domId,
  highlighted = false,
  state = "Default",
  indicator,
  style,
  headerBadges,
  itemId,
  category,
  title,
  requestedChange,
  rationale,
  actions,
  editor,
}: OrbitHandledClauseCardProps) {
  return (
    <OrbitClauseCardFrame
      domId={domId}
      highlighted={highlighted}
      state={state}
      indicator={indicator}
      style={style}
    >
      <div className="flex flex-wrap items-center justify-between gap-orbit-s">
        <div className="flex flex-wrap items-center gap-orbit-s">{headerBadges}</div>
        <p className="shrink-0 cpv2-type-xs text-muted-foreground">
          {itemId.toUpperCase()}
          {category ? ` · ${category}` : ""}
        </p>
      </div>
      <div className="mt-orbit-s min-w-0">
        <p className="truncate cpv2-type-sm cpv2-orbit-weight-semibold text-foreground">
          {title}
        </p>
        <p className="mt-orbit-xxs line-clamp-2 cpv2-type-xs cpv2-leading-snug text-muted-foreground">
          {requestedChange || "No requested change entered yet."}
        </p>
        {rationale && (
          <p className="mt-orbit-xs line-clamp-2 cpv2-type-xs cpv2-leading-snug text-muted-foreground">
            <span className="cpv2-orbit-weight-medium text-foreground">
              Rationale:
            </span>{" "}
            {rationale}
          </p>
        )}
      </div>
      {actions}
      {editor}
    </OrbitClauseCardFrame>
  );
}
