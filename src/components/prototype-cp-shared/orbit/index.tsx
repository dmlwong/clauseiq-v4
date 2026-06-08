import * as React from "react";
import {
  Badge,
  Button as OrbitButton,
  Card,
  Chip,
  DocumentGlyph,
  Dropdown,
  FileItem,
  FA,
  FaIcon,
  IconButton as OrbitIconButton,
  InlineBanner,
  LinkText,
  Overlay,
  Searchbox,
  Spinner,
  StepCircle,
  StatusIndicator,
  TabButton,
  Table as OrbitTable,
  Toggle,
  type TableColumn,
} from "@orbit";

type OrbitButtonVariant = "Primary" | "Secondary" | "Tertiary" | "Positive" | "Destructive";
type OrbitButtonSize = "Small" | "Medium";
type OrbitIconButtonSize = "Small" | "Medium" | "Large";
type LegacyButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
type LegacyButtonSize = "default" | "sm" | "lg" | "icon";

function mapButtonVariant(variant: LegacyButtonVariant | undefined): OrbitButtonVariant {
  if (variant === "destructive") return "Destructive";
  if (variant === "outline" || variant === "secondary") return "Secondary";
  if (variant === "ghost" || variant === "link") return "Tertiary";
  return "Primary";
}

export interface CpButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  orbitVariant?: OrbitButtonVariant;
  orbitSize?: OrbitButtonSize;
  variant?: LegacyButtonVariant;
  size?: LegacyButtonSize;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const CpButton = React.forwardRef<HTMLButtonElement, CpButtonProps>(function CpButton(
  {
    orbitVariant = "Tertiary",
    orbitSize = "Small",
    variant,
    size: _size,
    disabled,
    icon,
    iconRight,
    children,
    ...props
  },
  ref,
) {
  return (
    <OrbitButton
      {...props}
      ref={ref}
      variant={variant ? mapButtonVariant(variant) : orbitVariant}
      size={orbitSize}
      state={disabled ? "Disabled" : "Default"}
      disabled={disabled}
      icon={icon}
      iconRight={iconRight}
    >
      {children}
    </OrbitButton>
  );
});

export interface CpIconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children" | "aria-label"> {
  ariaLabel: string;
  icon: React.ReactNode;
  orbitVariant?: OrbitButtonVariant;
  orbitSize?: OrbitIconButtonSize;
}

export const CpIconButton = React.forwardRef<HTMLButtonElement, CpIconButtonProps>(function CpIconButton(
  {
    ariaLabel,
    icon,
    orbitVariant = "Tertiary",
    orbitSize = "Small",
    disabled,
    ...props
  },
  ref,
) {
  return (
    <OrbitIconButton
      {...props}
      ref={ref}
      ariaLabel={ariaLabel}
      icon={icon}
      variant={orbitVariant}
      size={orbitSize}
      state={disabled ? "Disabled" : "Default"}
      disabled={disabled}
    />
  );
});

export function CpFloatingAction(props: CpButtonProps) {
  return <CpButton orbitVariant="Secondary" orbitSize="Small" {...props} />;
}

export function CpSearchField({
  ariaLabel,
  className,
  placeholder = "",
  value,
  onChange,
}: {
  ariaLabel: string;
  className?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className={className} data-cp-orbit-adapter="search-field">
      <Searchbox
        ariaLabel={ariaLabel}
        placeholder={placeholder || "Search..."}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

export function CpDropdown({
  ariaLabel,
  className,
  disabled,
  options,
  value,
  onChange,
  placeholder,
}: {
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
  options: ReadonlyArray<{ label: string; value: string }>;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className={className} data-cp-orbit-adapter="dropdown">
      <Dropdown
        ariaLabel={ariaLabel}
        disabled={disabled}
        options={[...options]}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
}

export function CpTabButton({
  active,
  children,
  className,
  disabled,
  ...props
}: React.ComponentProps<typeof TabButton>) {
  return (
    <TabButton
      {...props}
      active={active}
      className={className}
      disabled={disabled}
      status={disabled ? "Disabled" : "Rest"}
      showUnderline={false}
    >
      {children}
    </TabButton>
  );
}

export const CpTabs = {
  Button: CpTabButton,
};

function statusVariant(tone: string | undefined) {
  const normalized = (tone ?? "").toLowerCase();
  if (normalized.includes("flight") || normalized.includes("pipeline") || normalized.includes("warning")) return "Warning";
  if (normalized.includes("complete") || normalized.includes("success") || normalized.includes("green")) return "Success";
  if (normalized.includes("idea") || normalized.includes("info") || normalized.includes("blue")) return "Information";
  if (normalized.includes("red") || normalized.includes("error") || normalized.includes("danger")) return "Error";
  return "No Status";
}

export function CpStatusPill({
  className,
  label,
  status,
}: {
  className?: string;
  label?: string;
  status: string;
}) {
  return (
    <span className={className} data-cp-orbit-adapter="status-pill">
      <Chip label={label ?? status} size="Small" variant={statusVariant(status)} />
    </span>
  );
}

export type CpTableColumn<T> = TableColumn<T>;

export function CpTable<T>({
  ariaLabel,
  className,
  columns,
  rows,
  getRowKey,
}: {
  ariaLabel: string;
  className?: string;
  columns: ReadonlyArray<TableColumn<T>>;
  rows: T[];
  getRowKey: (row: T) => React.Key;
}) {
  return (
    <div className={className} data-cp-orbit-adapter="table">
      <OrbitTable
        ariaLabel={ariaLabel}
        columns={[...columns]}
        rows={rows}
        getRowKey={getRowKey}
        density="Compact"
      />
    </div>
  );
}

export function CpFileRow({
  className,
  fileName,
  onRemove,
  removeLabel,
}: {
  className?: string;
  fileName: string;
  onRemove: () => void;
  removeLabel: string;
}) {
  return (
    <div className={className} data-cp-orbit-adapter="file-row">
      <FileItem
        filename={fileName}
        documentType="PDF"
        trailing={(
          <CpIconButton
            ariaLabel={removeLabel}
            icon={<FaIcon icon={FA.xmark} size={14} />}
            onClick={onRemove}
          />
        )}
      />
    </div>
  );
}

export function CpCard({
  children,
  className,
  padding = "Base",
  state = "Default",
  style,
  type = "Static",
}: {
  children: React.ReactNode;
  className?: string;
  padding?: React.ComponentProps<typeof Card>["padding"];
  state?: React.ComponentProps<typeof Card>["state"];
  style?: React.CSSProperties;
  type?: React.ComponentProps<typeof Card>["type"];
}) {
  return (
    <div className={className} data-cp-orbit-adapter="card">
      <Card padding={padding} state={state} style={style} type={type}>
        {children}
      </Card>
    </div>
  );
}

export function CpInlineBanner({
  className,
  contrast = "Low",
  icon,
  label,
  status,
  variant,
}: {
  className?: string;
  contrast?: React.ComponentProps<typeof InlineBanner>["contrast"];
  icon?: string;
  label: string;
  status?: string;
  variant: React.ComponentProps<typeof InlineBanner>["variant"];
}) {
  return (
    <div className={className} data-cp-orbit-adapter="inline-banner">
      <InlineBanner contrast={contrast} icon={icon} label={label} status={status} variant={variant} />
    </div>
  );
}

export function CpModal({
  ariaLabel,
  children,
  className,
  height = "Viewport",
  onClose,
  size = "Default",
  visible,
}: {
  ariaLabel: string;
  children: React.ReactNode;
  className?: string;
  height?: React.ComponentProps<typeof Overlay>["height"];
  onClose: () => void;
  size?: React.ComponentProps<typeof Overlay>["size"];
  visible: boolean;
}) {
  return (
    <Overlay ariaLabel={ariaLabel} height={height} onClose={onClose} size={size} visible={visible}>
      <div className={className} data-cp-orbit-adapter="modal">
        {children}
      </div>
    </Overlay>
  );
}

export function CpStepCircle(props: React.ComponentProps<typeof StepCircle>) {
  return (
    <span data-cp-orbit-adapter="step-circle">
      <StepCircle {...props} />
    </span>
  );
}

export function CpDocumentGlyph(props: React.ComponentProps<typeof DocumentGlyph>) {
  return (
    <span data-cp-orbit-adapter="document-glyph">
      <DocumentGlyph {...props} />
    </span>
  );
}

export function CpSpinner({ className }: { className?: string }) {
  return (
    <span className={className} data-cp-orbit-adapter="spinner">
      <Spinner />
    </span>
  );
}

export function CpToggle({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <span data-cp-orbit-adapter="toggle">
      <Toggle ariaLabel={label} checked={checked} onChange={onChange} state={disabled ? "Disabled" : "Active"} />
    </span>
  );
}

export function CpBadge(props: React.ComponentProps<typeof Badge>) {
  return (
    <span data-cp-orbit-adapter="badge">
      <Badge {...props} />
    </span>
  );
}

export function CpStatusIndicator(props: React.ComponentProps<typeof StatusIndicator>) {
  return (
    <span data-cp-orbit-adapter="status-indicator">
      <StatusIndicator {...props} />
    </span>
  );
}

export function CpModalActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className} data-cp-orbit-adapter="modal-actions">
      {children}
    </div>
  );
}

export const CpRailButton = React.forwardRef<HTMLButtonElement, {
  active?: boolean;
  badge?: string;
  boxed?: boolean;
  className: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className">>(function CpRailButton({
  active,
  badge,
  boxed,
  className,
  icon,
  label,
  onClick,
  ...buttonProps
}, ref) {
  return (
    <CpIconButton
      {...buttonProps}
      ref={ref}
      ariaLabel={label}
      className={`${className}${active ? " is-active" : ""}${boxed ? " is-boxed" : ""}`}
      icon={(
        <>
          {icon}
          {badge ? <span className={`${className.includes("cpv2") ? "cpv2" : "cp"}-rail-badge`}>{badge}</span> : null}
        </>
      )}
      onClick={onClick}
    />
  );
});

export function CpLinkText({
  className,
  external,
  href,
  label,
}: {
  className?: string;
  external?: boolean;
  href: string;
  label: string;
}) {
  return (
    <span className={className} data-cp-orbit-adapter="link-text">
      <LinkText label={label} href={href} external={external} />
    </span>
  );
}
