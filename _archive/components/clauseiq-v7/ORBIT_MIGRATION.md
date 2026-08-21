# ClauseIQ V7 Orbit Migration Notes

V7 was forked from V6A, which was itself forked from V6. Unlike those, V7 also owns its
data layer (`mock-clauseiq-v7`, `workflow-v7-data`, `clauseiq-v7-data`,
`mock-delivery-engine-v7`, `use-wizard-state-v7`, `use-contract-status-v7`, `wizard-v7`),
so changes here cannot affect V6 or V6A. The notes below are the original V6 migration
history, kept for reference.

V6 is a local-only Orbit migration island copied from V4. V4 remains the read-only behavior/content reference; V6 keeps the Orbit visual theme.

## V4 behavior sync

- V6 now tracks the latest V4 first-analysis recommendation flow while preserving Orbit-backed controls.
- `ContractResults` uses the V4 review/generate behavior: Apply All queues recommendations for review, then CSV generation happens from the review dialog.
- The V4 review progress summary is restored in V6 for bulk recommendation review.
- The V6-only immediate Apply All export dialog and closed-items basket tab were removed from the active V6 workflow.
- First-analysis review count placement now follows V4 while still using V6 Orbit-backed badges and theme tokens.

## First-pass Orbit swaps

- V6 now activates Orbit Theme with `data-theme="orbit"` on the V6 root.
- `orbit-theme.css` maps the existing V4 Tailwind theme variables onto Orbit Theme colors so legacy utility classes resolve through Orbit without affecting V2/V3/V4.
- The V6 sidebar now renders Orbit `SideNav` directly while preserving V6 routes, coming-soon toasts, work items, and the output-panel result scenario control.
- V6 page shell headers now use Orbit `PageHeader` for the primary title/subtitle chrome, with V6-owned right-side header content preserved.
- `button`, `badge`, `input`, `switch`, `tooltip`, `select`, `tabs`, `textarea`, `checkbox`, `radio-group`, `separator`, `spinner`, and `searchbox` imports in V6 point to `components/clauseiq-v6a/orbit-ui/*`.
- These adapters are Orbit-backed but preserve the existing V4 call-site shape where possible so the first migration remains low-risk.
- `StateCard` now renders Orbit `Card` internally while preserving the existing step-state API.
- ClauseIQ intake and wizard upload controls now use Orbit `Dropzone` plus Orbit `FileItem` for selected-file states.
- Wizard searchable selects are now V6-only Orbit compositions using Orbit `Button`, `Searchbox`, `Card`, `Tooltip`, `Text`, and `FaIcon`.
- V6 custom confirm flows now use `V6OrbitConfirmOverlay`; browser-native confirm prompts have been removed from V6 workflow code.
- Simple V6 selects now render Orbit `Dropdown`; V6 tab groups now render Orbit `TabButton`.
- V6 checkbox, radio, text area, separator, spinner, search, icon button, document glyph, and status indicator usages now route through Orbit components.
- `InitiativeModal`, `InitiativeOverview`, and `CrossSupplierComparison` now use Orbit `Table` for their simple data-table surfaces.
- The supplier output search field now uses Orbit `Searchbox`.
- Supplier avatars and reusable stat cards now use Orbit `Avatar` and `Card` primitives.
- The analysis upload summary now uses Orbit `DocumentGlyph` and `StatusIndicator`.
- V6 deviation/status chips now normalize legacy badge children into Orbit `Chip` labels and variants, so hidden responsive labels and old Tailwind tone classes do not produce duplicated or unstyled chip output.
- Result-card and dashboard deviation chips now share `DeviationPills`, so both surfaces use the same Orbit `Chip` variants and labels.
- Output-panel result surfaces now use Orbit `Card` for their actual card shells: the main analysis result card, supplier output group, compact output row, no-output match state, and no-previous-analysis/empty states.
- Dashboard first-analysis and comparison summary panels now use direct `@orbit` `Card`, `Badge`, `Chip`, `Filter`, `RadialIndicator`, `TabButton`, and `Text` primitives where the API maps directly.
- Dashboard active filters now render Orbit `Filter`; dashboard category strips and category sort controls now render Orbit `QuickFilterGroup` and `QuickFilterItem`.
- V6 dialog, alert-dialog, sheet, popover, collapsible, scroll-area, hover-card, table, avatar, and toast surfaces have been moved to Orbit-backed V6 components or direct `@orbit` primitives.
- V6-only tone helpers now centralize severity, status, lifecycle, risk, and progress mappings for future direct Orbit swaps.
- `/delivery-engine-v6` no longer imports shared `components/delivery-engine/*`; it uses V6-owned Orbit-built delivery engine components for RAG/status indicators, tool coverage cards, completed tool cards, metrics, and content search.

## Deferred design-system gaps

- Full-width CTA behavior still relies on call-site layout classes because Orbit `Button` has no explicit `fullWidth` prop.
- Icon tile behavior is still local/Tailwind in several V6 surfaces because Orbit has `Avatar` and `FaIcon`, but no dedicated icon-tile primitive.
- Subtle inline panels remain local/Tailwind with Orbit tokens where Orbit `Card` states would add too much visual weight or create nested-card layouts.
- V6 compatibility adapters remain in `components/clauseiq-v6a/orbit-ui/*` where replacing every call site with direct `@orbit` props would be higher risk than the visual migration itself.
- Complex clause comparison rows in `ContractResults` remain local compositions because they combine expandable sections, inline review forms, diff text, and multi-action workflow state that Orbit does not provide as a single primitive.
- Some local V6 composition wrappers remain intentionally V6-owned and Orbit-built rather than direct `@orbit` at every call site, matching the agreed migration standard.
