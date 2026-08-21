import * as React from "react";
import { Alert, InlineBanner } from "@orbit-cp";

/**
 * Namespace copy of the shared CpInlineBanner adapter, retargeted to @orbit-cp.
 *
 * In the newer Orbit build, `InlineBanner` is a label-only strip (no `description`); the
 * two-line callout moved to `Alert` (`title`/`description`). This adapter keeps v6a's call-site
 * API — routing to `Alert` when a description is present, `InlineBanner` when it's label-only —
 * so the ported ClauseIQ workflow renders identically without touching its call sites.
 */
type AlertType = React.ComponentProps<typeof Alert>["type"];

export function CpInlineBanner({
  className,
  contrast = "Low",
  description,
  icon,
  label,
  status,
  variant,
}: {
  className?: string;
  contrast?: React.ComponentProps<typeof InlineBanner>["contrast"];
  description?: string;
  icon?: string;
  label: string;
  status?: string;
  variant: React.ComponentProps<typeof InlineBanner>["variant"];
}) {
  const alertType: AlertType =
    variant === "Information" ||
    variant === "Success" ||
    variant === "Error" ||
    variant === "Warning" ||
    variant === "No Status"
      ? variant
      : "No Status";

  return (
    <div className={className} data-cp-orbit-adapter="inline-banner">
      {description ? (
        <Alert type={alertType} title={label} description={description} />
      ) : (
        <InlineBanner contrast={contrast} icon={icon} label={label} status={status} variant={variant} />
      )}
    </div>
  );
}
