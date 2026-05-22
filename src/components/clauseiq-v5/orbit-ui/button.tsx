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
  return size === "sm" ? "Small" : "Medium";
}

const fallbackButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors";

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
        size="Small"
        state={orbitState}
        disabled={disabled}
        className={className}
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
      className={className}
    >
      {children}
    </OrbitButton>
  );
});

export { Button as buttonVariants };
