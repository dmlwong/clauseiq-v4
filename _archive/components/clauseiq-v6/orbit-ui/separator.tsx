import * as React from "react";
import { Separator as OrbitSeparator } from "@orbit";
import { cn } from "@/lib/utils";

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}

export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(function Separator(
  { orientation = "horizontal", decorative = true, className, ...props },
  ref,
) {
  return (
    <div ref={ref} className={cn("shrink-0", className)} {...props}>
      <OrbitSeparator
        orientation={orientation === "vertical" ? "Vertical" : "Horizontal"}
        decorative={decorative}
      />
    </div>
  );
});
