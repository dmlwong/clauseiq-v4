import * as React from "react";

import { cn } from "@/lib/utils";

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

type TooltipChildProps = {
  onMouseEnter?: React.MouseEventHandler;
  onMouseLeave?: React.MouseEventHandler;
  onFocus?: React.FocusEventHandler;
  onBlur?: React.FocusEventHandler;
  "aria-describedby"?: string;
};

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
  const [visible, setVisible] = React.useState(false);
  const tooltipId = React.useId();
  const parts = React.Children.toArray(children);
  const triggerPart = parts.find(
    (part) => React.isValidElement(part) && part.type === TooltipTrigger,
  ) as React.ReactElement<TooltipTriggerProps> | undefined;
  const contentPart = parts.find(
    (part) => React.isValidElement(part) && part.type === TooltipContent,
  ) as React.ReactElement<TooltipContentProps> | undefined;

  const trigger = triggerPart?.props.children ?? parts[0] ?? null;
  const content = contentPart?.props.children ?? null;
  const contentText = textFromNode(content);
  const side = contentPart?.props.side ?? "top";
  const className = contentPart?.props.className;

  const show = () => setVisible(true);
  const hide = () => setVisible(false);

  const triggerProps = {
    onMouseEnter: show,
    onMouseLeave: hide,
    onFocus: show,
    onBlur: hide,
    "aria-describedby": visible ? tooltipId : undefined,
  };

  const triggerNode = React.isValidElement<TooltipChildProps>(trigger)
    ? React.cloneElement(trigger, {
        onMouseEnter: (event: React.MouseEvent) => {
          trigger.props.onMouseEnter?.(event);
          show();
        },
        onMouseLeave: (event: React.MouseEvent) => {
          trigger.props.onMouseLeave?.(event);
          hide();
        },
        onFocus: (event: React.FocusEvent) => {
          trigger.props.onFocus?.(event);
          show();
        },
        onBlur: (event: React.FocusEvent) => {
          trigger.props.onBlur?.(event);
          hide();
        },
        "aria-describedby": visible
          ? [trigger.props["aria-describedby"], tooltipId].filter(Boolean).join(" ")
          : trigger.props["aria-describedby"],
      })
    : (
      <span tabIndex={0} {...triggerProps}>
        {trigger}
      </span>
    );

  if (!content && !contentText) return <>{triggerNode}</>;

  return (
    <span className="relative inline-flex">
      {triggerNode}
      {visible && (
        <span
          id={tooltipId}
          role="tooltip"
          className={cn(
            "pointer-events-none absolute z-[var(--orbit-z-tooltip)] inline-flex min-w-[220px] max-w-[280px] rounded-[var(--orbit-radius-sm)] border border-white/10 bg-[var(--orbit-color-black-pearl)] px-orbit-s py-orbit-xs text-left text-[var(--orbit-text-small-size)] font-[var(--orbit-text-small-weight)] leading-[var(--orbit-text-small-leading)] text-[var(--orbit-color-text-inverse)] shadow-lg whitespace-pre-line",
            side === "top" && "bottom-full left-1/2 mb-orbit-xs -translate-x-1/2",
            side === "bottom" && "left-1/2 top-full mt-orbit-xs -translate-x-1/2",
            side === "left" && "right-full top-1/2 mr-orbit-xs -translate-y-1/2",
            side === "right" && "left-full top-1/2 ml-orbit-xs -translate-y-1/2",
            className,
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "absolute h-2.5 w-2.5 rotate-45 border-white/10 bg-[var(--orbit-color-black-pearl)]",
              side === "top" && "left-1/2 top-full -translate-x-1/2 -translate-y-1/2 border-b border-r",
              side === "bottom" && "bottom-full left-1/2 -translate-x-1/2 translate-y-1/2 border-l border-t",
              side === "left" && "left-full top-1/2 -translate-x-1/2 -translate-y-1/2 border-r border-t",
              side === "right" && "right-full top-1/2 translate-x-1/2 -translate-y-1/2 border-b border-l",
            )}
          />
          {typeof content === "string" || typeof content === "number" ? <span>{content}</span> : content}
        </span>
      )}
    </span>
  );
}

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
