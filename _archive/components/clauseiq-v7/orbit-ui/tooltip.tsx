import * as React from "react";
import { createPortal } from "react-dom";

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
  const triggerWrapperRef = React.useRef<HTMLSpanElement | null>(null);
  const tooltipRef = React.useRef<HTMLSpanElement | null>(null);
  const [position, setPosition] = React.useState<{ top: number; left: number; transform: string } | null>(null);
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

  React.useLayoutEffect(() => {
    if (!visible || !triggerWrapperRef.current || !tooltipRef.current) return;

    const updatePosition = () => {
      const triggerRect = triggerWrapperRef.current?.getBoundingClientRect();
      const tooltipRect = tooltipRef.current?.getBoundingClientRect();
      if (!triggerRect || !tooltipRect) return;

      const gap = 8;
      if (side === "bottom") {
        setPosition({
          top: triggerRect.bottom + gap,
          left: triggerRect.left + triggerRect.width / 2,
          transform: "translateX(-50%)",
        });
        return;
      }

      if (side === "left") {
        setPosition({
          top: triggerRect.top + triggerRect.height / 2,
          left: triggerRect.left - gap,
          transform: "translate(-100%, -50%)",
        });
        return;
      }

      if (side === "right") {
        setPosition({
          top: triggerRect.top + triggerRect.height / 2,
          left: triggerRect.right + gap,
          transform: "translateY(-50%)",
        });
        return;
      }

      setPosition({
        top: triggerRect.top - gap,
        left: triggerRect.left + triggerRect.width / 2,
        transform: "translate(-50%, -100%)",
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [side, visible]);

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
    <>
      <span ref={triggerWrapperRef} className="inline-flex">
        {triggerNode}
      </span>
      {visible && typeof document !== "undefined" && createPortal(
        <span
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          style={
            position
              ? {
                  top: position.top,
                  left: position.left,
                  transform: position.transform,
                }
              : undefined
          }
          className={cn(
            "pointer-events-none fixed z-[9999] inline-flex max-w-[288px] rounded-orbit-sm border border-[var(--orbit-color-border-default)] bg-[var(--orbit-color-bg-default)] p-orbit-base text-left text-[var(--orbit-text-small-size)] font-orbit-regular leading-orbit-tight text-[var(--orbit-color-text-primary)] shadow-orbit-lg whitespace-pre-line",
            !position && "opacity-0",
            className,
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "absolute h-2.5 w-2.5 rotate-45 border-[var(--orbit-color-border-default)] bg-[var(--orbit-color-bg-default)]",
              side === "top" && "left-1/2 top-full -translate-x-1/2 -translate-y-1/2 border-b border-r",
              side === "bottom" && "bottom-full left-1/2 -translate-x-1/2 translate-y-1/2 border-l border-t",
              side === "left" && "left-full top-1/2 -translate-x-1/2 -translate-y-1/2 border-r border-t",
              side === "right" && "right-full top-1/2 translate-x-1/2 -translate-y-1/2 border-b border-l",
            )}
          />
          {typeof content === "string" || typeof content === "number" ? <span>{content}</span> : content}
        </span>,
        document.body,
      )}
    </>
  );
}

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
