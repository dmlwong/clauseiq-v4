import type { ReactNode } from "react";
import { Card, ToggleCard, type CardState } from "@orbit";

export function OrbitDisclosureCard({
  open,
  onOpenChange,
  state = "Default",
  header,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state?: CardState;
  header: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card type="Static" padding="Small" state={state} indicator={state !== "Default"}>
      <ToggleCard status={open ? "Selected" : "Default"} aria-expanded={open} onClick={() => onOpenChange(!open)}>
        {header}
      </ToggleCard>
      {open ? <div className="pt-orbit-base">{children}</div> : null}
    </Card>
  );
}
