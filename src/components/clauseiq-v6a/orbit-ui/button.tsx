import * as React from "react";
import { Button as OrbitButton, IconButton as OrbitIconButton } from "@orbit";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
type ButtonSize = "default" | "sm" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

function orbitVariant(variant: ButtonVariant | undefined) {
  if (variant === "destructive") return "Destructive";
  if (variant === "ghost" || variant === "link") return "Tertiary";
  if (variant === "outline" || variant === "secondary") return "Secondary";
  return "Primary";
}

function orbitSize(size: ButtonSize | undefined) {
  return "Medium";
}

const fallbackButtonClass =
  "inline-flex h-[var(--orbit-btn-height-medium)] items-center justify-center gap-orbit-s rounded-orbit-sm px-orbit-base text-[length:var(--orbit-text-button-size)] v6-orbit-button-text font-orbit-medium leading-orbit-relaxed transition-colors";

const buttonSizeOverridePattern =
  /^(h-|min-h-|max-h-|px-|py-|rounded(?:-|$)|text-(?:xs|sm)$|text-\[(?:\d|length:|var\())/;
const iconButtonSizeOverridePattern =
  /^(h-|min-h-|max-h-|w-|min-w-|max-w-|px-|py-|rounded(?:-|$)|text-(?:xs|sm)$|text-\[(?:\d|length:|var\())/;

function withoutSizeOverrides(className: string | undefined, iconOnly = false) {
  if (!className) return undefined;
  const pattern = iconOnly ? iconButtonSizeOverridePattern : buttonSizeOverridePattern;
  const nextClassName = className
    .split(/\s+/)
    .filter((token) => token && !pattern.test(token))
    .join(" ");
  return nextClassName || undefined;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { asChild = false, variant = "default", size = "default", className, children, disabled, "aria-label": ariaLabel, ...props },
  ref,
) {
  const orbitState = disabled ? "Disabled" : "Default";

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      ...props,
      className: cn(fallbackButtonClass, className, (children.props as { className?: string }).className),
    });
  }

  if (size === "icon") {
    return (
      <OrbitIconButton
        {...props}
        ref={ref}
        variant={orbitVariant(variant)}
        size="Medium"
        state={orbitState}
        disabled={disabled}
        className={withoutSizeOverrides(className, true)}
        icon={children}
        ariaLabel={ariaLabel || props.title || "Icon action"}
      />
    );
  }

  return (
    <OrbitButton
      {...props}
      ref={ref}
      variant={orbitVariant(variant)}
      size={orbitSize(size)}
      state={orbitState}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn("clauseiq-v6-action-button", withoutSizeOverrides(className))}
    >
      {children}
    </OrbitButton>
  );
});

export { Button as buttonVariants };
