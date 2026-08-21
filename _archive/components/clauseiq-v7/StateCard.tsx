import { ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils";

export type CardState = "active" | "default" | "disabled";

interface Props {
  state: CardState;
  children: ReactNode;
  className?: string;
}

/** Reusable conversational-card wrapper with active / default / disabled visual states. */
export const StateCard = forwardRef<HTMLDivElement, Props>(({ state, children, className }, ref) => {
  return (
    <div
      ref={ref}
      aria-disabled={state === "disabled" || undefined}
      className={cn(
        "rounded-orbit-lg bg-orbit-card p-orbit-base transition-all duration-200 ease-out",
        state === "active" && "border border-orbit-primary/40 ring-2 ring-orbit-primary/15 shadow-orbit-sm",
        state === "default" && "border border-orbit-border",
        state === "disabled" && "border border-orbit-border opacity-50 pointer-events-none select-none",
        className,
      )}
    >
      {children}
    </div>
  );
});
StateCard.displayName = "StateCard";
