import * as React from "react";
import { TabButton } from "@orbit";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

interface TabsProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
  className?: string;
}

export function Tabs({ value, defaultValue, onValueChange, children, className }: TabsProps) {
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
    <TabsContext.Provider value={{ value: currentValue, setValue }}>
      <div className={className} data-orbit-adapter="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

export const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function TabsList(
  { className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      role="tablist"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  );
});

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(function TabsTrigger(
  { value, className, children, disabled, ...props },
  ref,
) {
  const context = React.useContext(TabsContext);
  const active = context?.value === value;

  return (
    <TabButton
      {...props}
      ref={ref}
      active={active}
      disabled={disabled}
      status={disabled ? "Disabled" : "Rest"}
      showUnderline={false}
      className={className}
      role="tab"
      aria-selected={active}
      onClick={(event) => {
        props.onClick?.(event);
        if (!event.defaultPrevented && !disabled) context?.setValue(value);
      }}
    >
      {children}
    </TabButton>
  );
});

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(function TabsContent(
  { value, className, ...props },
  ref,
) {
  const context = React.useContext(TabsContext);
  const active = context?.value === value;

  if (!active) return null;

  return <div ref={ref} role="tabpanel" className={className} {...props} />;
});
