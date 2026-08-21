import * as React from "react";
import { Toggle } from "@orbit";

export interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { checked = false, onCheckedChange, disabled, "aria-label": ariaLabel },
  _ref,
) {
  return (
    <Toggle
      checked={checked}
      onChange={(nextChecked) => onCheckedChange?.(nextChecked)}
      state={disabled ? "Disabled" : "Active"}
      ariaLabel={ariaLabel || "Toggle"}
    />
  );
});
