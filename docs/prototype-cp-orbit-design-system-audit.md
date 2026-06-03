# Prototype CP Orbit Design-System Audit

Date: 2026-06-03

## Scope

Audited both prototype CP versions:

- v1 shell and workspace: `src/pages/PrototypeCP.tsx`
- v2 shell and workspace: `src/pages/PrototypeCPV2.tsx`
- v1 results route: `src/pages/PrototypeCPResults.tsx` and `src/components/prototype-cp-results/*`
- v2 results route: `src/pages/PrototypeCPV2Results.tsx` and `src/components/prototype-cp-v2-results/*`
- shared CP chrome/notifications: `src/components/prototype-cp/*`, `src/components/prototype-cp-v2/*`, `src/components/prototype-cp-shared/*`
- nested ClauseIQ v5 components rendered from the prototype CP flow.

## Design-System Source

The Efficio Orbit design system is available through:

- `node_modules/@efficio/orbit`, symlinked to `/Users/derekwong/efficio-orbit/packages/orbit`
- Vite alias `@orbit`, currently resolving to `src/vendor/orbit/dist/index.js`
- TypeScript path for app code resolving `@orbit` to `/Users/derekwong/efficio-orbit/packages/orbit/dist/index.d.ts`

Relevant Orbit component families exported by the package:

- Actions: `Button`, `IconButton`, `LinkText`, `MultiStateButton`
- Inputs: `Input`, `Textbox`, `TextArea`, `Searchbox`, `Dropdown`, `MultiSelectDropdown`, `Checkbox`, `Radio`, `Toggle`, `Dropzone`
- Feedback: `Toast`, `Alert`, `Banner`, `InlineBanner`, `Tooltip`, `Overlay`
- Indicators: `Badge`, `Chip`, `Filter`, `StatusIndicator`, `RadialIndicator`, `StepCircle`, `RiskIndicator`, `PriceIndicator`, `Spinner`
- Navigation: `Breadcrumb`, `TabButton`, `QuickFilter`, `SideNav`, `PageHeader`
- Layout/primitives: `Avatar`, `Card`, `CountryFlag`, `FileItem`, `Table`, `Headings`, `Text`, `Separator`, `FaIcon`

## Executive Summary

The prototype CP shell for both v1 and v2 is not fully using the Efficio Orbit CP design system. Large parts of the shell still render bespoke CP markup with raw HTML controls and `cp-*` / `cpv2-*` classes.

The results dashboards are partially migrated. They import `@orbit` directly and use local `orbit-ui` adapters that wrap Orbit components, but many result subcomponents still use raw `<button>` controls and custom card, pill, stat, rail, and table patterns.

The v1 and v2 results implementations are effectively duplicated. The same migration gaps appear in both `prototype-cp-results` and `prototype-cp-v2-results`.

Runtime spot checks:

- `/prototype-cp`: 35 native buttons, 2 native inputs/selects, 0 rendered `data-orbit-adapter` elements on the initial shell.
- `/prototype-cp-v2`: 33 native buttons, 2 native inputs/selects, 0 rendered `data-orbit-adapter` elements on the initial shell.

## Already Using Orbit Or Orbit Adapters

These areas are aligned or mostly aligned:

- `src/components/prototype-cp-results/orbit-ui/*` and `src/components/prototype-cp-v2-results/orbit-ui/*`: mostly shadcn-style API adapters around real Orbit components.
- `button.tsx`: wraps Orbit `Button` and `IconButton`.
- `badge.tsx`: wraps Orbit `Chip`.
- `checkbox.tsx`: wraps Orbit `Checkbox`.
- `radio-group.tsx`: wraps Orbit `RadioGroup` / `Radio`.
- `select.tsx`: wraps Orbit `Dropdown`.
- `searchbox.tsx`: wraps Orbit `Searchbox`.
- `textarea.tsx`: wraps Orbit `TextArea`.
- `tooltip.tsx`: wraps Orbit `Tooltip`.
- `switch.tsx`: wraps Orbit `Toggle`.
- `spinner.tsx`: wraps Orbit `Spinner`.
- `file-item.tsx` / `indicators.tsx`: re-export Orbit components.
- `CpOrbitOverlay` and `CpOrbitToastHost` in both result folders use Orbit `Overlay`, `Card`, `Button`, `IconButton`, `Headings`, `Text`, and `Toast`.
- `CpNotificationsPanel` uses Orbit `Button`, `IconButton`, and `TabButton`.

Adapter caveats:

- `Input` falls back to a native `<input>` for non-text/search types.
- `TabsList` and `TabsContent` are wrapper `<div>` elements, while `TabsTrigger` uses Orbit `TabButton`.
- `Badge` renders a wrapper `<span>` around Orbit `Chip`; this is acceptable as an adapter but not a direct Orbit `Badge`.

## Components Not Fully Using Orbit

### v1 CP Shell And Workspace

| Component | File | Finding |
| --- | --- | --- |
| `CpSearchField` | `src/pages/PrototypeCP.tsx:84` | Uses native `<input>` instead of Orbit `Searchbox`/`Input`. |
| `StatusPill` | `src/pages/PrototypeCP.tsx:153` | Custom pill `<span>` instead of Orbit `Chip`/`StatusIndicator`. |
| `ProjectCard` | `src/pages/PrototypeCP.tsx:166` | Uses 6 native buttons and a native table; should use Orbit `Button`/`IconButton` and `Table`. |
| `ProjectHeader` | `src/pages/PrototypeCP.tsx:312` | Uses native button for navigation/action. |
| `InitiativesView` | `src/pages/PrototypeCP.tsx:344` | Mixed: uses Orbit `MultiStateGroup`, `MultiStateButton`, `Chip`, but still has 8 native buttons. |
| `BlueWorkspaceHeader` | `src/pages/PrototypeCP.tsx:397` | Uses native action buttons. |
| `InsightPanel` | `src/pages/PrototypeCP.tsx:439` | Uses native carousel/action buttons and custom aside layout. |
| `ClauseIqLauncherCard` | `src/pages/PrototypeCP.tsx:527` | Mixed: uses Orbit `Button`, but still has a raw launch button. |
| `CpSupplierOutputsModal` | `src/pages/PrototypeCP.tsx:679` | Uses native close/footer buttons around a local panel. |
| `CpClauseIqModal` | `src/pages/PrototypeCP.tsx:746` | Uses native modal footer/close buttons. |
| `CpSelectedFileRow` | `src/pages/PrototypeCP.tsx:838` | Uses native remove button instead of Orbit `IconButton`/`FileItem`. |
| `WorkspaceView` | `src/pages/PrototypeCP.tsx:850` | Uses native milestone/floating buttons and custom sections. |
| `PrototypeCP` | `src/pages/PrototypeCP.tsx:969` | Uses native floating Jasper/help buttons. |

### v2 CP Shell And Workspace

| Component | File | Finding |
| --- | --- | --- |
| `CpSearchField` | `src/pages/PrototypeCPV2.tsx:85` | Uses native `<input>` instead of Orbit `Searchbox`/`Input`. |
| `StatusPill` | `src/pages/PrototypeCPV2.tsx:154` | Custom pill `<span>` instead of Orbit `Chip`/`StatusIndicator`. |
| `ProjectCard` | `src/pages/PrototypeCPV2.tsx:167` | Uses 6 native buttons and a native table; should use Orbit `Button`/`IconButton` and `Table`. |
| `ProjectHeader` | `src/pages/PrototypeCPV2.tsx:313` | Uses native button for navigation/action. |
| `InitiativesView` | `src/pages/PrototypeCPV2.tsx:345` | Mixed: uses Orbit `MultiStateGroup`, `MultiStateButton`, `Chip`, but still has 8 native buttons. |
| `BlueWorkspaceHeader` | `src/pages/PrototypeCPV2.tsx:398` | Uses native action buttons. |
| `InsightPanel` | `src/pages/PrototypeCPV2.tsx:440` | Uses native carousel/action buttons and custom aside layout. |
| `ClauseIqLauncherCard` | `src/pages/PrototypeCPV2.tsx:490` | Uses raw native buttons for the v2 launcher flow. |
| `CpV2SupplierOutputsModal` | `src/pages/PrototypeCPV2.tsx:591` | Uses native close/footer buttons around a local panel. |
| `CpClauseIqModal` | `src/pages/PrototypeCPV2.tsx:655` | Uses native modal footer/close buttons. |
| `CpV2PriorToUseStep` | `src/pages/PrototypeCPV2.tsx:762` | Custom presentational step section with no Orbit layout/text primitives. |
| `CpV2SettingsStep` | `src/pages/PrototypeCPV2.tsx:773` | Uses native buttons and native search input for document type selection. |
| `CpSelectedFileRow` | `src/pages/PrototypeCPV2.tsx:904` | Uses native remove button instead of Orbit `IconButton`/`FileItem`. |
| `WorkspaceView` | `src/pages/PrototypeCPV2.tsx:916` | Uses native milestone/floating buttons and custom sections. |
| `PrototypeCPV2` | `src/pages/PrototypeCPV2.tsx:1052` | Uses native floating Jasper/help buttons. |

### Shared CP Chrome

| Component | File | Finding |
| --- | --- | --- |
| `RailButton` | `src/components/prototype-cp/PrototypeCPChrome.tsx:77` | Uses native `<button>` instead of Orbit `IconButton` or `SideNav`. |
| `HeaderActions` | `src/components/prototype-cp/PrototypeCPChrome.tsx:130` | Uses native `<select>` and native icon buttons instead of Orbit `Dropdown` and `IconButton`. |
| `RailButton` | `src/components/prototype-cp-v2/PrototypeCPV2Chrome.tsx:77` | Same as v1. |
| `HeaderActions` | `src/components/prototype-cp-v2/PrototypeCPV2Chrome.tsx:130` | Same as v1. |
| `CpNotificationsRailControl` | `src/components/prototype-cp-shared/CpNotifications.tsx:199` | Mixed: notifications panel uses Orbit, but the rail trigger is a raw native button. |

### Results Route Wrappers

| Component | File | Finding |
| --- | --- | --- |
| `PrototypeCPResults` | `src/pages/PrototypeCPResults.tsx:15` | Uses native floating Jasper/help buttons around the results route. |
| `PrototypeCPV2Results` | `src/pages/PrototypeCPV2Results.tsx:15` | Same as v1 results wrapper. |

### Results Dashboard, Both v1 And v2

The following appear in both `src/components/prototype-cp-results/ContractResults.tsx` and `src/components/prototype-cp-v2-results/ContractResults.tsx`.

| Component | Line | Finding |
| --- | --- | --- |
| `ContractResults` | `620` | Mixed: uses Orbit adapters but still has raw buttons. |
| `CompactContractTopbar` | `2526` | Mixed: uses Orbit `Chip`, but raw back button remains. |
| `FirstAnalysisDemoToggle` | `2566` | Raw native button. |
| `ModeSwitcher` | `2618` | Mixed: uses Orbit `TabButton`, select adapter, and button adapter, but still has a raw button. |
| `HistoryHeader` | `2881` | Mixed: uses select adapter, but has raw action button. |
| `ComparisonTabButton` | `3005` | Raw native button instead of Orbit `TabButton`. |
| `ComparisonOverviewPanel` | `3136` | Raw native button in a custom panel. |
| `ScoringOptionSwitcher` | `3210` | Raw native button instead of Orbit tab/multi-state control. |
| `MovementSummaryZone` | `3654` | Raw native button. |
| `TopMoversList` | `3775` | Raw native button. |
| `HybridRiskDriverRows` | `3835` | Raw native button. |
| `HybridChangeList` | `3920` | Raw native button. |
| `CategorySidebar` | `4106` | Mixed: uses Orbit `Text` and `Chip`, but category controls are raw buttons. |
| `ClauseDecisionCard` | `4391` | Mixed: uses adapters for badge/tooltip/button, but still has raw buttons. |
| `RequestReviewDialog` | `5328` | Mixed: uses Orbit `Alert` and overlay, but one raw button remains. |
| `ComparisonSection` | `5649` | Mixed: uses adapter buttons/confirm overlay, but still has raw buttons and custom sections. |
| `UnmarkedSection` | `5958` | Mixed: uses Orbit `Searchbox`, but has a raw expandable button. |
| `ClauseSlideOver` | `6214` | Mixed: uses adapter badge/button, but still has raw close/action buttons. |
| `ClauseDetailPanel` | `6450` | Mixed: uses adapter badge/button, but one raw button remains. |
| `HistoryRailTabs` | `6779` | Raw native button instead of Orbit `TabButton`/`QuickFilter`. |
| `HistoryRoundTable` | `6842` | Raw native button in custom round table. |
| `ClauseAuditPanel` | `6936` | Mixed: uses badge/tabs adapters, but uses native `<a>` for the source link. |

Custom presentational results components that do not consume Orbit primitives directly:

- `FirstAnalysisContextBanner`
- `ComparisonHeader`
- `HistoryStatCard`
- `DecisionBadge`
- `RequestLifecycleBadge`
- `ScoringStripSummary`
- `ScoringOptionPanel`
- `HybridVersionMovementPanel`
- `HybridResolutionRows`
- `SummaryStat`
- `ReviewGenerateProgressDashboard`
- `ReviewGenerateMetric`
- `ExcerptPanel`
- `HistoryDesignContent`
- `HistorySummaryPanel`
- `RoundStatusPill`

These are not all interactive defects, but they are still bespoke cards/pills/stats/text blocks where Orbit `Card`, `Text`, `Chip`, `Badge`, `StatusIndicator`, or `Table` would normally provide system alignment.

### Other Results Components

| Component | File | Finding |
| --- | --- | --- |
| `VersionVerdictBanner.Stat` | `src/components/prototype-cp-results/VersionVerdictBanner.tsx:185` and v2 equivalent | Custom stat block. Parent uses button/badge adapters, but stat primitives are bespoke. |
| `ComparisonDesignOptions` | `src/components/prototype-cp-results/ComparisonDesignOptions.tsx:105` and v2 equivalent | Custom aside/section layout, no direct Orbit layout primitives. |
| `FirstAnalysisDesignOptions` | `src/components/prototype-cp-results/ComparisonDesignOptions.tsx:237` and v2 equivalent | Custom aside/section layout, no direct Orbit layout primitives. |
| `ComparisonSummaryRail` | `src/components/prototype-cp-results/ComparisonDesignOptions.tsx:580` and v2 equivalent | Custom summary rail section. |
| `MetricCell` | `src/components/prototype-cp-results/ComparisonDesignOptions.tsx:1127` and v2 equivalent | Mixed: uses Orbit `Text` and `Card`, but has raw button behavior. |
| `NegotiationTrendStrip` | `src/components/prototype-cp-results/NegotiationTrendStrip.tsx:19` and v2 equivalent | Raw button cards and custom chart strip instead of Orbit `Button`/`Card`/indicator primitives. |
| `TextDiff` | `src/components/prototype-cp-results/TextDiff.tsx:15` and v2 equivalent | Custom diff presentation. No direct Orbit primitives, though this may be acceptable because Orbit has no obvious diff component. |

### Nested ClauseIQ v5 Surfaces Rendered By Prototype CP

These are outside the CP folders but are rendered inside the prototype flow:

| Component | File | Finding |
| --- | --- | --- |
| `PostAnalysisNextActions` | `src/components/clauseiq-v5/ClauseIqWorkflow.tsx:479` | Mixed: uses adapter `Button`, but uses raw buttons and a native table. |
| `SelectedSummaryRow` | `src/components/clauseiq-v5/ClauseIqWorkflow.tsx:683` | Raw native button. |
| `ParameterOptionsList` | `src/components/clauseiq-v5/ClauseIqWorkflow.tsx:721` | Raw native button. |
| `ParameterKindSelector` | `src/components/clauseiq-v5/ClauseIqWorkflow.tsx:759` | Raw native button. |
| `SupplierOutputGroup` | `src/components/clauseiq-v5/supplier-results/OutputPanelResultsContent.tsx:280` | Mixed: uses Orbit `Card`, but row action is a raw button. |
| `OptionSwitcher` | `src/components/clauseiq-v5/supplier-results/OptionSwitcher.tsx:28` | Mixed: uses Orbit `Tooltip`, but switch buttons are raw native buttons. |
| `SupplierRailContent` | `src/components/clauseiq-v5/supplier-results/OptionMasterDetail.tsx:102` | Mixed: uses adapter `Input`, but supplier rail items are raw buttons. |

## Recommended Migration Order

1. Shared CP chrome first: migrate `RailButton`, `HeaderActions`, floating help/Jasper buttons, and notification rail trigger. These affect both v1 and v2.
2. Main CP shell/workspace next: migrate `CpSearchField`, `ProjectCard`, `ProjectHeader`, `InitiativesView`, `BlueWorkspaceHeader`, `InsightPanel`, modal buttons, selected file rows, and v2 settings step controls.
3. Results dashboard raw buttons: migrate `ComparisonTabButton`, `FirstAnalysisDemoToggle`, `ScoringOptionSwitcher`, `HistoryRailTabs`, `HistoryRoundTable`, and raw buttons inside slide-over/dialog components.
4. Results presentational primitives: replace bespoke pills/stats/cards with Orbit `Chip`, `Badge`, `StatusIndicator`, `Card`, `Text`, and `Table` where the semantics match.
5. Nested ClauseIQ v5 leftovers: replace raw parameter/summary/supplier-result controls with the existing Orbit adapters.

## Bottom Line

The highest-confidence non-Orbit components are the CP shell/chrome components and the results dashboard controls listed above. The local `orbit-ui` adapters are not the main problem; they are mostly wrapping Orbit. The biggest gap is that many CP components bypass both `@orbit` and the adapters, rendering native buttons, inputs, selects, tables, pills, cards, and rails directly with bespoke CSS.
