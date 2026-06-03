import * as React from "react";
import { Chip } from "@orbit";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

function textFromNode(node: React.ReactNode): string {
  return React.Children.toArray(node)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") return String(child);
      if (React.isValidElement(child)) {
        const childClassName = String(child.props.className ?? "");
        if (childClassName.split(/\s+/).includes("hidden")) return "";
        return textFromNode(child.props.children);
      }
      return "";
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function chipVariant(variant: BadgeVariant | undefined, className?: string) {
  if (className) {
    const toneClassName = className.toLowerCase();
    if (/\b(destructive|error|red|rose)\b/i.test(className) || /#(?:a32d2d|f3b4b4|fff1f2|fcebeb|791f1f|e5484d)/i.test(toneClassName)) return "Error";
    if (/\b(warning|amber|yellow|orange)\b/i.test(className) || /#(?:f1d29b|fff8e8|854f0b|faeeda|633806|f59e0b|ba7517)/i.test(toneClassName)) return "Warning";
    if (/\b(success|green|accepted)\b/i.test(className) || /#(?:bfd6ab|eaf3de|27500a|3b6d11|1ba97f)/i.test(toneClassName)) return "Success";
    if (/\b(primary|ciq|info|blue)\b/i.test(className) || /#(?:185fa5|e6f1fb|0c447c)/i.test(toneClassName)) return "Information";
    if (/\b(muted|secondary|slate|gray|background|border-border)\b/i.test(className)) return "No Status";
  }
  if (variant === "destructive") return "Error";
  if (variant === "secondary") return "No Status";
  return "Outline";
}

function layoutClassName(className?: string) {
  if (!className) return undefined;

  return className
    .split(/\s+/)
    .filter((token) => {
      const baseToken = token.replace(/^(sm|md|lg|xl|2xl):/, "");
      return (
        baseToken === "hidden" ||
        baseToken === "block" ||
        baseToken === "inline" ||
        baseToken === "inline-flex" ||
        baseToken === "flex" ||
        baseToken === "truncate" ||
        baseToken === "whitespace-nowrap" ||
        baseToken === "shrink-0" ||
        baseToken === "grow" ||
        baseToken === "ml-auto" ||
        baseToken.startsWith("m-") ||
        baseToken.startsWith("mt-") ||
        baseToken.startsWith("mr-") ||
        baseToken.startsWith("mb-") ||
        baseToken.startsWith("ml-") ||
        baseToken.startsWith("mx-") ||
        baseToken.startsWith("my-") ||
        baseToken.startsWith("w-") ||
        baseToken.startsWith("min-w-") ||
        baseToken.startsWith("max-w-") ||
        baseToken.startsWith("overflow-") ||
        baseToken.startsWith("self-") ||
        baseToken.startsWith("items-") ||
        baseToken.startsWith("justify-")
      );
    })
    .join(" ");
}

export function Badge({ variant = "default", className, children, ...props }: BadgeProps) {
  const label = textFromNode(children) || "Status";
  const classNameString = typeof className === "string" ? className : undefined;

  return (
    <span {...props} className={cn("inline-flex align-middle", layoutClassName(classNameString))}>
      <Chip label={label} size="Mini" variant={chipVariant(variant, classNameString)} />
    </span>
  );
}
