import * as React from "react";
import { Input as OrbitInput } from "@orbit";
import { cn } from "@/lib/utils";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value?: string | number | readonly string[];
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, value, onChange, placeholder, disabled, required, "aria-label": ariaLabel, id, type, ...props },
  _ref,
) {
  const stringValue = Array.isArray(value) ? value.join(", ") : value === undefined ? "" : String(value);

  if (type && type !== "text" && type !== "search") {
    return (
      <input
        {...props}
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        aria-label={ariaLabel}
        className={className}
      />
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <OrbitInput
        id={id}
        value={stringValue}
        onChange={(nextValue) => {
          onChange?.({
            target: { value: nextValue },
            currentTarget: { value: nextValue },
          } as React.ChangeEvent<HTMLInputElement>);
        }}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        ariaLabel={ariaLabel || placeholder || "Input"}
      />
    </div>
  );
});
