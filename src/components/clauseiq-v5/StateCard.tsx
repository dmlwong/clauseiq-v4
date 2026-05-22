import { ReactNode, forwardRef } from "react";
import { Card } from "@orbit";
import { cn } from "@/lib/utils";

export type CardState = "active" | "default" | "disabled";

interface Props {
  state: CardState;
  children: ReactNode;
  className?: string;
}

/** V5 conversational-card wrapper backed by Orbit Card. */
export const StateCard = forwardRef<HTMLDivElement, Props>(({ state, children, className }, ref) => {
  return (
    <div
      ref={ref}
      aria-disabled={state === "disabled" || undefined}
      className={cn(
        state === "disabled" && "pointer-events-none select-none",
        className,
      )}
    >
      <Card
        type="Static"
        state={state === "active" ? "Highlight" : state === "disabled" ? "Disabled" : "Default"}
      >
        {children}
      </Card>
    </div>
  );
});
StateCard.displayName = "StateCard";
