import * as React from "react";
import { Searchbox as OrbitSearchbox } from "@orbit";
import { cn } from "@/lib/utils";

export interface SearchboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

export function Searchbox({
  className,
  value = "",
  onChange,
  placeholder,
  disabled,
  "aria-label": ariaLabel,
}: SearchboxProps) {
  return (
    <div className={cn("w-full", className)} data-orbit-adapter="searchbox">
      <OrbitSearchbox
        value={value}
        onChange={(nextValue) => {
          onChange?.({
            target: { value: nextValue },
            currentTarget: { value: nextValue },
          } as React.ChangeEvent<HTMLInputElement>);
        }}
        placeholder={placeholder}
        disabled={disabled}
        ariaLabel={ariaLabel || placeholder || "Search"}
      />
    </div>
  );
}
