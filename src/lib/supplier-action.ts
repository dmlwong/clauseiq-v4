import type { ClauseResult, SupplierAction } from "./workflow-types";

/**
 * Derive the supplier's response between two consecutive rounds for a single clause.
 *
 * - "Changed by supplier"        — clause text or severity differs
 * - "Supplier rejected request"  — buyer asked for a change (requestedChange present)
 *                                  AND nothing changed in the next round
 * - "No change"                  — nothing changed and nothing was asked
 * - "—"                          — clause missing in one of the rounds (treat as N/A)
 */
export function deriveSupplierAction(
  prev: ClauseResult | undefined,
  curr: ClauseResult | undefined,
  requestedChange?: string,
): SupplierAction {
  if (!prev || !curr) return "—";
  const changed = prev.excerpt !== curr.excerpt || prev.severity !== curr.severity;
  if (changed) return "Changed by supplier";
  if (requestedChange && requestedChange.trim().length > 0) return "Supplier rejected request";
  return "No change";
}

export function supplierActionTone(action: SupplierAction): string {
  switch (action) {
    case "Changed by supplier":
      return "bg-primary/10 text-primary border-primary/20";
    case "Supplier rejected request":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "No change":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-muted/50 text-muted-foreground border-dashed border-border";
  }
}
