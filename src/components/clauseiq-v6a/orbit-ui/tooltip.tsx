import { Children, isValidElement, type ReactNode } from "react";
import { Tooltip as OrbitTooltip } from "@orbit";

type TooltipSide = "top" | "bottom" | "left" | "right";

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function TooltipTrigger({ children }: { asChild?: boolean; children: ReactNode }) {
  return <>{children}</>;
}

export function TooltipContent({ children }: { children: ReactNode; side?: TooltipSide; className?: string }) {
  return <>{children}</>;
}

function textFromNode(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") return String(child);
      return isValidElement<{ children?: ReactNode }>(child) ? textFromNode(child.props.children) : "";
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function Tooltip({ children }: { children: ReactNode }) {
  const parts = Children.toArray(children);
  const trigger = parts.find((part) => isValidElement(part) && part.type === TooltipTrigger);
  const content = parts.find((part) => isValidElement(part) && part.type === TooltipContent);
  const contentProps = isValidElement<{ children?: ReactNode; side?: TooltipSide }>(content) ? content.props : undefined;

  return (
    <OrbitTooltip direction={contentProps?.side ?? "top"} content={textFromNode(contentProps?.children)}>
      {isValidElement<{ children?: ReactNode }>(trigger) ? trigger.props.children : trigger ?? children}
    </OrbitTooltip>
  );
}
