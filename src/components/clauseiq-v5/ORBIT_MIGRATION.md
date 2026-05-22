# ClauseIQ V5 Orbit Migration Notes

V5 is a local-only Orbit migration island copied from V4. V4 remains the read-only behavior/content reference; V5 keeps the Orbit visual theme.

## V4 behavior sync

- V5 now tracks the latest V4 first-analysis recommendation flow while preserving Orbit-backed controls.
- `ContractResults` uses the V4 review/generate behavior: Apply All queues recommendations for review, then CSV generation happens from the review dialog.
- The V4 review progress summary is restored in V5 for bulk recommendation review.
- The V5-only immediate Apply All export dialog and closed-items basket tab were removed from the active V5 workflow.
- First-analysis review count placement now follows V4 while still using V5 Orbit-backed badges and theme tokens.

## First-pass Orbit swaps

- V5 now activates Orbit Theme with `data-theme="orbit"` on the V5 root.
- `orbit-theme.css` maps the existing V4 Tailwind theme variables onto Orbit Theme colors so legacy utility classes resolve through Orbit without affecting V2/V3/V4.
- The V5 sidebar uses Orbit sidenav tokens for its shell, active rows, muted text, badges, and section indicators.
- `button`, `badge`, `input`, `switch`, `tooltip`, `select`, `tabs`, `textarea`, `checkbox`, `radio-group`, `separator`, `spinner`, and `searchbox` imports in V5 point to `components/clauseiq-v5/orbit-ui/*`.
- These adapters are Orbit-backed but preserve the existing V4 call-site shape where possible so the first migration remains low-risk.
- `StateCard` now renders Orbit `Card` internally while preserving the existing step-state API.
- Simple V5 selects now render Orbit `Dropdown`; V5 tab groups now render Orbit `TabButton`.
- V5 checkbox, radio, text area, separator, spinner, search, icon button, document glyph, and status indicator usages now route through Orbit components.
- `InitiativeModal`, `InitiativeOverview`, and `CrossSupplierComparison` now use Orbit `Table` for their simple data-table surfaces.
- The supplier output search field now uses Orbit `Searchbox`.
- The analysis upload summary now uses Orbit `DocumentGlyph` and `StatusIndicator`.
- V5 deviation/status chips now normalize legacy badge children into Orbit `Chip` labels and variants, so hidden responsive labels and old Tailwind tone classes do not produce duplicated or unstyled chip output.
- Result-card and dashboard deviation chips now share `DeviationPills`, so both surfaces use the same Orbit `Chip` variants and labels.
- Output-panel result surfaces now use Orbit `Card` for their actual card shells: the main analysis result card, supplier output group, compact output row, no-output match state, and no-previous-analysis/empty states.

## Deferred design-system gaps

- Full-width CTA behavior still relies on call-site layout classes because Orbit `Button` has no explicit `fullWidth` prop.
- Icon tile behavior is still local/Tailwind in several V5 surfaces because Orbit has `Avatar` and `FaIcon`, but no dedicated icon-tile primitive.
- Subtle nested panels remain local/Tailwind where Orbit `Card` states would add too much visual weight.
- Complex Radix primitives remain deferred: dialog, alert dialog, sheet, popover, collapsible, scroll area, and hover card.
- Complex result tables in `ContractResults` remain local for now because Orbit `Table` is data-driven and needs a careful conversion pass to preserve expandable rows, inline actions, and comparison states.
