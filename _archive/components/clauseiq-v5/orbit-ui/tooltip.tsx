import * as React from "react";
import { Tooltip as OrbitTooltip } from "@orbit";

type TooltipSide = "top" | "bottom" | "left" | "right";

interface TooltipProps {
  children: React.ReactNode;
}

interface TooltipTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

interface TooltipContentProps {
  children: React.ReactNode;
  side?: TooltipSide;
  className?: string;
}

function textFromNode(node: React.ReactNode): string {
  return React.Children.toArray(node)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") return String(child);
      if (React.isValidElement(child)) return textFromNode(child.props.children);
      return "";
    })
    .join("")
    .trim();
}

export function TooltipTrigger({ children }: TooltipTriggerProps) {
  return <>{children}</>;
}

export function TooltipContent({ children }: TooltipContentProps) {
  return <>{children}</>;
}

export function Tooltip({ children }: TooltipProps) {
  const parts = React.Children.toArray(children);
  const triggerPart = parts.find(
    (part) => React.isValidElement(part) && part.type === TooltipTrigger,
  ) as React.ReactElement<TooltipTriggerProps> | undefined;
  const contentPart = parts.find(
    (part) => React.isValidElement(part) && part.type === TooltipContent,
  ) as React.ReactElement<TooltipContentProps> | undefined;

  const trigger = triggerPart?.props.children ?? parts[0] ?? null;
  const content = textFromNode(contentPart?.props.children) || "";
  const direction = contentPart?.props.side ?? "top";

  if (!content) return <>{trigger}</>;

  return (
    <OrbitTooltip content={content} direction={direction}>
      {trigger}
    </OrbitTooltip>
  );
}

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
