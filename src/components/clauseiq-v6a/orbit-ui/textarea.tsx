import * as React from "react";
import { TextArea as OrbitTextArea } from "@orbit";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange"> {
  value?: string | number | readonly string[];
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
  hideCharacterCount?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, value, onChange, onFocus, onBlur, placeholder, disabled, required, rows, maxLength, autoFocus, hideCharacterCount = false, "aria-label": ariaLabel, id },
  _ref,
) {
  const stringValue = Array.isArray(value) ? value.join(", ") : value === undefined ? "" : String(value);

  return (
    <div className={cn("w-full", className)} data-orbit-adapter="textarea" onFocus={onFocus} onBlur={onBlur}>
      <OrbitTextArea
        value={stringValue}
        onChange={(nextValue) => {
          onChange?.({
            target: { value: nextValue },
            currentTarget: { value: nextValue },
          } as React.ChangeEvent<HTMLTextAreaElement>);
        }}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        maxLength={maxLength}
        showCharacterCount={!hideCharacterCount}
        autoFocus={autoFocus}
        ariaLabel={ariaLabel || placeholder || id || "Text area"}
      />
    </div>
  );
});
