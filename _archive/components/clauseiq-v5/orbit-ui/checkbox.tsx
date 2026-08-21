import * as React from "react";
import { Checkbox as OrbitCheckbox } from "@orbit";

export interface CheckboxProps {
  checked?: boolean | "indeterminate";
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
  className?: string;
}

export const Checkbox = React.forwardRef<HTMLDivElement, CheckboxProps>(function Checkbox(
  { checked = false, onCheckedChange, disabled, "aria-label": ariaLabel, className },
  ref,
) {
  return (
    <div ref={ref} className={className} data-orbit-adapter="checkbox">
      <OrbitCheckbox
        checked={checked === true}
        state={disabled ? "Disabled" : "Active"}
        ariaLabel={ariaLabel || "Checkbox"}
        onChange={(nextChecked) => onCheckedChange?.(nextChecked)}
      />
    </div>
  );
});
