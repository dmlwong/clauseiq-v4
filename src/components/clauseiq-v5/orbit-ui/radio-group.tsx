import * as React from "react";
import { Radio, RadioGroup as OrbitRadioGroup } from "@orbit";
import { cn } from "@/lib/utils";

interface RadioGroupContextValue {
  value: string;
  name: string;
  setValue: (value: string) => void;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null);

interface RadioGroupProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  className?: string;
  children?: React.ReactNode;
}

export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(function RadioGroup(
  { value, defaultValue, onValueChange, name = "orbit-radio-group", className, children },
  ref,
) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue ?? value ?? "");
  const currentValue = value ?? uncontrolledValue;

  const setValue = React.useCallback(
    (nextValue: string) => {
      setUncontrolledValue(nextValue);
      onValueChange?.(nextValue);
    },
    [onValueChange],
  );

  return (
    <RadioGroupContext.Provider value={{ value: currentValue, name, setValue }}>
      <div ref={ref} className={cn("grid gap-2", className)} data-orbit-adapter="radio-group">
        <OrbitRadioGroup value={currentValue} name={name} onChange={setValue}>
          {children}
        </OrbitRadioGroup>
      </div>
    </RadioGroupContext.Provider>
  );
});

interface RadioGroupItemProps {
  value: string;
  disabled?: boolean;
  "aria-label"?: string;
  className?: string;
}

export const RadioGroupItem = React.forwardRef<HTMLDivElement, RadioGroupItemProps>(function RadioGroupItem(
  { value, disabled, "aria-label": ariaLabel, className },
  ref,
) {
  const context = React.useContext(RadioGroupContext);

  return (
    <div ref={ref} className={className} data-orbit-adapter="radio">
      <Radio
        checked={context?.value === value}
        value={value}
        name={context?.name}
        state={disabled ? "Disabled" : "Active"}
        ariaLabel={ariaLabel || value}
        onChange={(nextValue) => context?.setValue(nextValue)}
      />
    </div>
  );
});
