import * as React from "react";
import { Dropdown as OrbitDropdown } from "@orbit";
import { cn } from "@/lib/utils";

interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
}

interface SelectTriggerProps {
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
}

interface SelectValueProps {
  placeholder?: string;
}

interface SelectItemProps {
  value: string;
  children?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

interface SelectMeta {
  options: Array<{ label: string; value: string }>;
  placeholder?: string;
  triggerClassName?: string;
  disabled?: boolean;
  ariaLabel?: string;
  leadingIcon?: React.ReactNode;
}

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

function collectSelectMeta(children: React.ReactNode, meta: SelectMeta) {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;

    if (child.type === SelectItem) {
      const props = child.props as SelectItemProps;
      if (!props.disabled) {
        meta.options.push({ value: props.value, label: textFromNode(props.children) || props.value });
      }
      return;
    }

    if (child.type === SelectTrigger) {
      const props = child.props as SelectTriggerProps;
      meta.triggerClassName = cn(meta.triggerClassName, props.className);
      meta.disabled = meta.disabled || props.disabled;
      meta.ariaLabel = meta.ariaLabel || props["aria-label"];
      React.Children.forEach(props.children, (triggerChild) => {
        if (
          !meta.leadingIcon &&
          React.isValidElement(triggerChild) &&
          triggerChild.type !== SelectValue
        ) {
          meta.leadingIcon = triggerChild;
        }
      });
    }

    if (child.type === SelectValue) {
      const props = child.props as SelectValueProps;
      meta.placeholder = meta.placeholder || props.placeholder;
    }

    collectSelectMeta(child.props.children, meta);
  });
}

export function Select({ value, defaultValue, onValueChange, children }: SelectProps) {
  const meta: SelectMeta = { options: [] };
  collectSelectMeta(children, meta);
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue ?? value ?? "");
  const currentValue = value ?? uncontrolledValue;
  const placeholder = meta.placeholder ?? meta.options[0]?.label ?? "Select";

  return (
    <div
      className={cn("min-w-0", meta.leadingIcon && "relative", meta.triggerClassName)}
      data-has-leading-icon={meta.leadingIcon ? "true" : undefined}
      data-orbit-adapter="select"
    >
      {meta.leadingIcon && (
        <span aria-hidden="true" className="clauseiq-v5-select-leading-icon">
          {meta.leadingIcon}
        </span>
      )}
      <OrbitDropdown
        options={meta.options}
        value={currentValue}
        placeholder={placeholder}
        disabled={meta.disabled}
        onChange={(nextValue) => {
          setUncontrolledValue(nextValue);
          onValueChange?.(nextValue);
        }}
        ariaLabel={meta.ariaLabel || placeholder}
      />
    </div>
  );
}

export function SelectTrigger({ children }: SelectTriggerProps) {
  return <>{children}</>;
}

export function SelectValue(_props: SelectValueProps) {
  return null;
}

export function SelectContent({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

export function SelectItem(_props: SelectItemProps) {
  return null;
}

export function SelectGroup({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

export function SelectLabel({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

export function SelectSeparator() {
  return null;
}

export function SelectScrollUpButton() {
  return null;
}

export function SelectScrollDownButton() {
  return null;
}
