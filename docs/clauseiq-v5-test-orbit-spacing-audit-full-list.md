# ClauseIQ v5/test Orbit Spacing Audit - Full List

Scope: transitive import graph from `src/pages/ClauseIQV5Test.tsx` (`/clauseiq-v5/test`). Updated after Orbit token cleanup.

Orbit spacing tokens: none=0px, micro=1px, xxs=2px, xs=4px, s=8px, base=16px, m=24px, l=32px, xxl=48px, mega=64px.

## Summary

- Source files audited: 27
- Spacing/gap/padding/margin/offset class usages: 267
- Orbit-backed class usages: 252
- Raw spacing-scale class usages remaining: 0
- Layout-only raw utilities remaining: 15

## Remaining Raw Layout-Only Utilities

These are not spacing-scale values, so they do not have Orbit token replacements: auto alignment and 50% centering.

### src/components/clauseiq-v5/InitiativeModal.tsx

| Line | Class | Group | Status | Note |
|---:|---|---|---|---|
| 34 | `left-1/2` | position-offset | Raw, layout-only | 1/2 |
| 34 | `top-1/2` | position-offset | Raw, layout-only | 1/2 |
| 70 | `top-1/2` | position-offset | Raw, layout-only | 1/2 |

### src/components/clauseiq-v5/supplier-results/OptionAccordion.tsx

| Line | Class | Group | Status | Note |
|---:|---|---|---|---|
| 30 | `mx-auto` | margin | Raw, layout-only | auto alignment, not a spacing token |
| 61 | `ml-auto` | margin | Raw, layout-only | auto alignment, not a spacing token |

### src/components/clauseiq-v5/supplier-results/OptionMasterDetail.tsx

| Line | Class | Group | Status | Note |
|---:|---|---|---|---|
| 38 | `mx-auto` | margin | Raw, layout-only | auto alignment, not a spacing token |
| 113 | `top-1/2` | position-offset | Raw, layout-only | 1/2 |

### src/components/clauseiq-v5/supplier-results/OutputPanelResultsContent.tsx

| Line | Class | Group | Status | Note |
|---:|---|---|---|---|
| 44 | `mx-auto` | margin | Raw, layout-only | auto alignment, not a spacing token |
| 227 | `mx-auto` | margin | Raw, layout-only | auto alignment, not a spacing token |
| 228 | `mx-auto` | margin | Raw, layout-only | auto alignment, not a spacing token |
| 229 | `mx-auto` | margin | Raw, layout-only | auto alignment, not a spacing token |
| 256 | `mx-auto` | margin | Raw, layout-only | auto alignment, not a spacing token |
| 260 | `mx-auto` | margin | Raw, layout-only | auto alignment, not a spacing token |

### src/pages/ClauseIQV5.tsx

| Line | Class | Group | Status | Note |
|---:|---|---|---|---|
| 453 | `mx-auto` | margin | Raw, layout-only | auto alignment, not a spacing token |
| 507 | `mx-auto` | margin | Raw, layout-only | auto alignment, not a spacing token |

## Orbit-Backed Usages

### src/components/clauseiq-v5/InitiativeModal.tsx

| Line | Class | Group | Token / expression |
|---:|---|---|---|
| 32 | `inset-orbit-none` | position-offset | orbit-none |
| 38 | `px-orbit-m` | padding | orbit-m |
| 39 | `pr-[calc(var(--orbit-space-xxl)+var(--orbit-space-s))]` | padding | calc(var(--orbit-space-xxl)+var(--orbit-space-s)) |
| 43 | `right-[calc(var(--orbit-space-base)+var(--orbit-space-xs))]` | position-offset | calc(var(--orbit-space-base)+var(--orbit-space-xs)) |
| 43 | `top-[calc(var(--orbit-space-base)+var(--orbit-space-xs))]` | position-offset | calc(var(--orbit-space-base)+var(--orbit-space-xs)) |
| 50 | `gap-orbit-m` | gap/space | orbit-m |
| 50 | `px-orbit-m` | padding | orbit-m |
| 51 | `gap-[calc(var(--orbit-space-s)+var(--orbit-space-xs))]` | gap/space | calc(var(--orbit-space-s)+var(--orbit-space-xs)) |
| 68 | `pl-orbit-base` | padding | orbit-base |
| 68 | `pr-orbit-xxl` | padding | orbit-xxl |
| 70 | `right-orbit-base` | position-offset | orbit-base |
| 75 | `pb-orbit-m` | padding | orbit-m |
| 75 | `pt-orbit-m` | padding | orbit-m |
| 75 | `px-orbit-m` | padding | orbit-m |
| 76 | `gap-orbit-m` | gap/space | orbit-m |
| 76 | `pb-orbit-base` | padding | orbit-base |
| 76 | `px-orbit-base` | padding | orbit-base |
| 83 | `space-y-[calc(var(--orbit-space-s)+var(--orbit-space-xs))]` | gap/space | calc(var(--orbit-space-s)+var(--orbit-space-xs)) |
| 88 | `gap-orbit-m` | gap/space | orbit-m |
| 88 | `px-orbit-base` | padding | orbit-base |
| 99 | `px-orbit-base` | padding | orbit-base |
| 99 | `py-orbit-l` | padding | orbit-l |
| 105 | `px-orbit-m` | padding | orbit-m |
| 108 | `px-[calc(var(--orbit-space-base)+var(--orbit-space-xs))]` | padding | calc(var(--orbit-space-base)+var(--orbit-space-xs)) |
| 137 | `pb-orbit-base` | padding | orbit-base |
| 137 | `px-orbit-base` | padding | orbit-base |
| 143 | `bottom-orbit-none` | position-offset | orbit-none |
| 143 | `inset-x-orbit-none` | position-offset | orbit-none |

### src/components/clauseiq-v5/orbit-ui/button.tsx

| Line | Class | Group | Token / expression |
|---:|---|---|---|
| 26 | `gap-orbit-s` | gap/space | orbit-s |
| 26 | `px-orbit-base` | padding | orbit-base |

### src/components/clauseiq-v5/Sidebar.tsx

| Line | Class | Group | Token / expression |
|---:|---|---|---|
| 157 | `bottom-orbit-mega` | position-offset | orbit-mega |
| 157 | `left-[calc(var(--orbit-space-s)+var(--orbit-space-xs))]` | position-offset | calc(var(--orbit-space-s)+var(--orbit-space-xs)) |
| 157 | `p-orbit-s` | padding | orbit-s |
| 157 | `right-[calc(var(--orbit-space-s)+var(--orbit-space-xs))]` | position-offset | calc(var(--orbit-space-s)+var(--orbit-space-xs)) |
| 161 | `mt-orbit-s` | margin | orbit-s |

### src/components/clauseiq-v5/supplier-results/AnalysisCard.tsx

| Line | Class | Group | Token / expression |
|---:|---|---|---|
| 61 | `gap-orbit-s` | gap/space | orbit-s |
| 61 | `mb-orbit-base` | margin | orbit-base |
| 61 | `pb-orbit-base` | padding | orbit-base |
| 72 | `space-y-orbit-m` | gap/space | orbit-m |
| 73 | `space-y-orbit-base` | gap/space | orbit-base |
| 74 | `gap-orbit-s` | gap/space | orbit-s |
| 75 | `gap-orbit-s` | gap/space | orbit-s |
| 83 | `gap-orbit-base` | gap/space | orbit-base |
| 85 | `gap-orbit-s` | gap/space | orbit-s |
| 92 | `space-y-orbit-base` | gap/space | orbit-base |
| 112 | `space-y-orbit-base` | gap/space | orbit-base |
| 118 | `space-y-orbit-s` | gap/space | orbit-s |
| 126 | `space-y-orbit-s` | gap/space | orbit-s |
| 130 | `gap-orbit-s` | gap/space | orbit-s |
| 137 | `gap-orbit-s` | gap/space | orbit-s |
| 139 | `gap-orbit-s` | gap/space | orbit-s |
| 145 | `gap-orbit-s` | gap/space | orbit-s |
| 162 | `space-y-orbit-s` | gap/space | orbit-s |
| 190 | `gap-orbit-base` | gap/space | orbit-base |
| 190 | `px-orbit-base` | padding | orbit-base |
| 197 | `gap-orbit-s` | gap/space | orbit-s |

### src/components/clauseiq-v5/supplier-results/DeviationPills.tsx

| Line | Class | Group | Token / expression |
|---:|---|---|---|
| 13 | `gap-orbit-s` | gap/space | orbit-s |
| 13 | `gap-orbit-xs` | gap/space | orbit-xs |

### src/components/clauseiq-v5/supplier-results/OptionAccordion.tsx

| Line | Class | Group | Token / expression |
|---:|---|---|---|
| 30 | `space-y-orbit-m` | gap/space | orbit-m |
| 32 | `space-y-orbit-base` | gap/space | orbit-base |
| 50 | `px-orbit-base` | padding | orbit-base |
| 50 | `py-orbit-base` | padding | orbit-base |
| 52 | `gap-orbit-base` | gap/space | orbit-base |
| 56 | `gap-orbit-xs` | gap/space | orbit-xs |
| 56 | `mt-orbit-xxs` | margin | orbit-xxs |
| 61 | `gap-orbit-s` | gap/space | orbit-s |
| 61 | `pt-orbit-xxs` | padding | orbit-xxs |
| 80 | `p-orbit-base` | padding | orbit-base |
| 80 | `space-y-orbit-base` | gap/space | orbit-base |

### src/components/clauseiq-v5/supplier-results/OptionMasterDetail.tsx

| Line | Class | Group | Token / expression |
|---:|---|---|---|
| 34 | `space-y-orbit-m` | gap/space | orbit-m |
| 47 | `space-y-orbit-base` | gap/space | orbit-base |
| 49 | `space-y-orbit-base` | gap/space | orbit-base |
| 89 | `mb-orbit-base` | margin | orbit-base |
| 89 | `p-orbit-base` | padding | orbit-base |
| 96 | `p-orbit-base` | padding | orbit-base |
| 107 | `gap-orbit-s` | gap/space | orbit-s |
| 107 | `mb-orbit-base` | margin | orbit-base |
| 112 | `mb-orbit-base` | margin | orbit-base |
| 113 | `left-[calc(var(--orbit-space-s)+var(--orbit-space-xxs))]` | position-offset | calc(var(--orbit-space-s)+var(--orbit-space-xxs)) |
| 118 | `pl-orbit-l` | padding | orbit-l |
| 123 | `pb-orbit-s` | padding | orbit-s |
| 123 | `space-y-orbit-xs` | gap/space | orbit-xs |
| 135 | `gap-orbit-s` | gap/space | orbit-s |
| 135 | `px-orbit-s` | padding | orbit-s |
| 135 | `py-orbit-s` | padding | orbit-s |
| 142 | `bottom-orbit-s` | position-offset | orbit-s |
| 142 | `left-orbit-none` | position-offset | orbit-none |
| 142 | `top-orbit-s` | position-offset | orbit-s |
| 147 | `pl-orbit-xxs` | padding | orbit-xxs |
| 155 | `px-orbit-s` | padding | orbit-s |
| 155 | `py-orbit-xxs` | padding | orbit-xxs |

### src/components/clauseiq-v5/supplier-results/OutputPanelResultsContent.tsx

| Line | Class | Group | Token / expression |
|---:|---|---|---|
| 44 | `space-y-orbit-m` | gap/space | orbit-m |
| 46 | `space-y-orbit-base` | gap/space | orbit-base |
| 142 | `space-y-orbit-base` | gap/space | orbit-base |
| 143 | `space-y-orbit-none` | gap/space | orbit-none |
| 149 | `space-y-orbit-base` | gap/space | orbit-base |
| 150 | `gap-orbit-s` | gap/space | orbit-s |
| 182 | `space-y-orbit-base` | gap/space | orbit-base |
| 226 | `px-orbit-s` | padding | orbit-s |
| 226 | `py-orbit-s` | padding | orbit-s |
| 230 | `left-[calc(var(--orbit-space-m)+var(--orbit-space-xs))]` | position-offset | calc(var(--orbit-space-m)+var(--orbit-space-xs)) |
| 230 | `top-orbit-s` | position-offset | orbit-s |
| 231 | `left-[calc(var(--orbit-space-l)+var(--orbit-space-s))]` | position-offset | calc(var(--orbit-space-l)+var(--orbit-space-s)) |
| 231 | `top-orbit-m` | position-offset | orbit-m |
| 232 | `left-[calc(var(--orbit-space-l)+var(--orbit-space-s))]` | position-offset | calc(var(--orbit-space-l)+var(--orbit-space-s)) |
| 232 | `top-[calc(var(--orbit-space-l)+var(--orbit-space-s)+var(--orbit-space-xs))]` | position-offset | calc(var(--orbit-space-l)+var(--orbit-space-s)+var(--orbit-space-xs)) |
| 233 | `left-[calc(var(--orbit-space-l)+var(--orbit-space-s))]` | position-offset | calc(var(--orbit-space-l)+var(--orbit-space-s)) |
| 233 | `top-orbit-mega` | position-offset | orbit-mega |
| 234 | `right-[calc(var(--orbit-space-base)+var(--orbit-space-xs))]` | position-offset | calc(var(--orbit-space-base)+var(--orbit-space-xs)) |
| 234 | `top-[calc(var(--orbit-space-m)+var(--orbit-space-xs))]` | position-offset | calc(var(--orbit-space-m)+var(--orbit-space-xs)) |
| 237 | `bottom-orbit-s` | position-offset | orbit-s |
| 237 | `left-orbit-base` | position-offset | orbit-base |
| 240 | `bottom-[calc(var(--orbit-space-s)+var(--orbit-space-xs))]` | position-offset | calc(var(--orbit-space-s)+var(--orbit-space-xs)) |
| 240 | `right-orbit-l` | position-offset | orbit-l |
| 245 | `mt-orbit-m` | margin | orbit-m |
| 246 | `mt-orbit-s` | margin | orbit-s |
| 259 | `mt-orbit-base` | margin | orbit-base |
| 260 | `mt-orbit-s` | margin | orbit-s |
| 264 | `gap-orbit-s` | gap/space | orbit-s |
| 264 | `mt-orbit-base` | margin | orbit-base |
| 298 | `gap-orbit-s` | gap/space | orbit-s |
| 298 | `py-orbit-s` | padding | orbit-s |
| 374 | `pt-orbit-s` | padding | orbit-s |
| 375 | `gap-orbit-s` | gap/space | orbit-s |
| 378 | `mt-orbit-xxs` | margin | orbit-xxs |
| 388 | `mt-orbit-base` | margin | orbit-base |
| 392 | `gap-orbit-xs` | gap/space | orbit-xs |
| 392 | `mt-orbit-base` | margin | orbit-base |
| 421 | `px-orbit-none` | padding | orbit-none |

### src/components/clauseiq-v5/supplier-results/StatCard.tsx

| Line | Class | Group | Token / expression |
|---:|---|---|---|
| 15 | `mt-orbit-xs` | margin | orbit-xs |

### src/components/clauseiq-v5/V5InitiativeLinkButton.tsx

| Line | Class | Group | Token / expression |
|---:|---|---|---|
| 21 | `gap-orbit-s` | gap/space | orbit-s |

### src/components/clauseiq-v5/V5OrbitToast.tsx

| Line | Class | Group | Token / expression |
|---:|---|---|---|
| 61 | `right-orbit-base` | position-offset | orbit-base |
| 61 | `top-orbit-base` | position-offset | orbit-base |

### src/components/clauseiq-v5/V5Shell.tsx

| Line | Class | Group | Token / expression |
|---:|---|---|---|
| 48 | `top-orbit-none` | position-offset | orbit-none |
| 62 | `inset-y-orbit-none` | position-offset | orbit-none |
| 62 | `px-orbit-m` | padding | orbit-m |
| 62 | `right-orbit-none` | position-offset | orbit-none |
| 69 | `left-[calc(var(--orbit-space-mega)+var(--orbit-space-mega)+var(--orbit-space-s)+var(--orbit-space-xs))]` | position-offset | calc(var(--orbit-space-mega)+var(--orbit-space-mega)+var(--orbit-space-s)+var(--orbit-space-xs)) |
| 69 | `top-orbit-s` | position-offset | orbit-s |
| 76 | `px-orbit-m` | padding | orbit-m |
| 76 | `py-orbit-base` | padding | orbit-base |

### src/pages/ClauseIQV5.tsx

| Line | Class | Group | Token / expression |
|---:|---|---|---|
| 440 | `p-orbit-base` | padding | orbit-base |
| 453 | `pt-orbit-xxl` | padding | orbit-xxl |
| 453 | `px-orbit-base` | padding | orbit-base |
| 453 | `space-y-orbit-base` | gap/space | orbit-base |
| 454 | `pb-orbit-xxl` | padding | orbit-xxl |
| 460 | `gap-orbit-base` | gap/space | orbit-base |
| 460 | `mb-orbit-base` | margin | orbit-base |
| 466 | `mb-orbit-m` | margin | orbit-m |
| 470 | `mb-orbit-m` | margin | orbit-m |
| 470 | `p-orbit-base` | padding | orbit-base |
| 470 | `space-y-orbit-base` | gap/space | orbit-base |
| 471 | `mb-orbit-xs` | margin | orbit-xs |
| 481 | `mr-orbit-s` | margin | orbit-s |
| 492 | `mb-orbit-xs` | margin | orbit-xs |
| 493 | `mb-orbit-base` | margin | orbit-base |
| 500 | `mr-orbit-s` | margin | orbit-s |
| 509 | `mb-orbit-base` | margin | orbit-base |
| 523 | `space-y-orbit-base` | gap/space | orbit-base |
| 540 | `mb-orbit-base` | margin | orbit-base |
| 551 | `mb-orbit-base` | margin | orbit-base |
| 552 | `mb-orbit-base` | margin | orbit-base |
| 552 | `px-orbit-base` | padding | orbit-base |
| 552 | `py-orbit-s` | padding | orbit-s |
| 553 | `gap-orbit-s` | gap/space | orbit-s |
| 557 | `gap-orbit-xs` | gap/space | orbit-xs |
| 561 | `gap-orbit-base` | gap/space | orbit-base |
| 561 | `py-orbit-s` | padding | orbit-s |
| 566 | `mt-orbit-s` | margin | orbit-s |
| 575 | `space-y-orbit-base` | gap/space | orbit-base |
| 590 | `space-y-orbit-base` | gap/space | orbit-base |
| 602 | `mb-orbit-base` | margin | orbit-base |
| 611 | `mb-orbit-base` | margin | orbit-base |
| 612 | `mb-orbit-base` | margin | orbit-base |
| 612 | `px-orbit-base` | padding | orbit-base |
| 612 | `py-orbit-s` | padding | orbit-s |
| 613 | `gap-orbit-s` | gap/space | orbit-s |
| 617 | `gap-orbit-xs` | gap/space | orbit-xs |
| 621 | `gap-orbit-base` | gap/space | orbit-base |
| 621 | `py-orbit-s` | padding | orbit-s |
| 626 | `mt-orbit-s` | margin | orbit-s |
| 683 | `gap-orbit-s` | gap/space | orbit-s |
| 684 | `mt-orbit-xxs` | margin | orbit-xxs |
| 692 | `gap-orbit-base` | gap/space | orbit-base |
| 692 | `py-orbit-xs` | padding | orbit-xs |
| 694 | `px-orbit-base` | padding | orbit-base |
| 694 | `py-orbit-xs` | padding | orbit-xs |
| 717 | `space-y-orbit-base` | gap/space | orbit-base |
| 722 | `gap-orbit-base` | gap/space | orbit-base |
| 722 | `p-orbit-base` | padding | orbit-base |
| 730 | `mt-orbit-xs` | margin | orbit-xs |
| 738 | `p-orbit-base` | padding | orbit-base |
| 739 | `gap-orbit-base` | gap/space | orbit-base |
| 740 | `gap-orbit-s` | gap/space | orbit-s |
| 741 | `mt-orbit-xs` | margin | orbit-xs |
| 746 | `mt-orbit-xs` | margin | orbit-xs |
| 749 | `mt-orbit-xs` | margin | orbit-xs |
| 752 | `mt-orbit-m` | margin | orbit-m |
| 762 | `px-orbit-base` | padding | orbit-base |
| 762 | `py-orbit-base` | padding | orbit-base |
| 763 | `px-orbit-base` | padding | orbit-base |
| 763 | `py-orbit-base` | padding | orbit-base |
| 764 | `px-orbit-base` | padding | orbit-base |
| 764 | `py-orbit-base` | padding | orbit-base |
| 765 | `px-orbit-base` | padding | orbit-base |
| 765 | `py-orbit-base` | padding | orbit-base |
| 774 | `px-orbit-base` | padding | orbit-base |
| 774 | `py-orbit-base` | padding | orbit-base |
| 775 | `px-orbit-base` | padding | orbit-base |
| 775 | `py-orbit-base` | padding | orbit-base |
| 776 | `px-orbit-base` | padding | orbit-base |
| 776 | `py-orbit-base` | padding | orbit-base |
| 779 | `px-orbit-base` | padding | orbit-base |
| 779 | `py-orbit-s` | padding | orbit-s |
| 781 | `gap-orbit-s` | gap/space | orbit-s |
| 802 | `gap-orbit-base` | gap/space | orbit-base |
| 802 | `p-orbit-base` | padding | orbit-base |
| 808 | `mt-orbit-xs` | margin | orbit-xs |
| 850 | `mb-orbit-xs` | margin | orbit-xs |
| 853 | `mb-orbit-base` | margin | orbit-base |
| 864 | `mt-orbit-s` | margin | orbit-s |
| 877 | `mb-orbit-xs` | margin | orbit-xs |
| 880 | `mb-orbit-base` | margin | orbit-base |
| 888 | `mt-orbit-s` | margin | orbit-s |
| 917 | `gap-orbit-base` | gap/space | orbit-base |
| 917 | `px-orbit-base` | padding | orbit-base |
| 917 | `py-orbit-s` | padding | orbit-s |
| 921 | `gap-orbit-s` | gap/space | orbit-s |
| 930 | `gap-orbit-xs` | gap/space | orbit-xs |
| 930 | `px-orbit-s` | padding | orbit-s |
| 961 | `p-orbit-xs` | padding | orbit-xs |
| 961 | `space-y-orbit-xs` | gap/space | orbit-xs |
| 968 | `px-orbit-base` | padding | orbit-base |
| 968 | `py-orbit-s` | padding | orbit-s |
| 995 | `space-y-orbit-base` | gap/space | orbit-base |
| 999 | `gap-orbit-s` | gap/space | orbit-s |
| 1011 | `gap-orbit-s` | gap/space | orbit-s |
| 1011 | `px-orbit-base` | padding | orbit-base |
| 1011 | `py-orbit-s` | padding | orbit-s |
| 1064 | `mt-orbit-xs` | margin | orbit-xs |
| 1071 | `gap-orbit-s` | gap/space | orbit-s |
| 1071 | `mb-orbit-base` | margin | orbit-base |
| 1071 | `px-orbit-base` | padding | orbit-base |
| 1071 | `py-orbit-s` | padding | orbit-s |
| 1072 | `mt-orbit-xxs` | margin | orbit-xxs |
| 1080 | `-mx-orbit-xs` | margin | orbit-xs |
| 1080 | `px-orbit-xs` | padding | orbit-xs |
| 1080 | `py-orbit-base` | padding | orbit-base |
| 1125 | `gap-orbit-s` | gap/space | orbit-s |
| 1140 | `gap-orbit-base` | gap/space | orbit-base |
| 1140 | `p-orbit-base` | padding | orbit-base |
| 1155 | `gap-orbit-xs` | gap/space | orbit-xs |

