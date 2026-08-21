# Prototype CP v3 — Token Map

**Status:** rebuilt after Gate 0 FAIL (6 blockers, 11 majors). Supersedes rev 1 entirely. · **Date:** 2026-07-30
**Purpose:** the single sign-off artifact governing every visual value in CP v3. Translation cites this document; nothing is re-decided per file.

**Sources of truth** (all values below verified by reading these, not inferred):
- `/Users/derekwong/efficio-orbit/packages/orbit/styles/tokens/colors.css` — Tier 1 primitives
- `.../semantics.css` — Tier 2 semantic, incl. the **`--orbit-color-cp-*` CP family (lines 47–55)**
- `.../components.css` — Tier 3 component, incl. **`--orbit-cp-*` CP shell family (421–489)** and **`--orbit-color-sidenav-*` (242–247)**
- `.../typography.css`, `.../spacing.css`, `.../elevation.css`
- In-repo mirror: `src/vendor/orbit/styles/tokens/`. Note `src/vendor/orbit/tokens.css` is 12 lines and defines 2 properties — the definitions live in the files it `@import`s.

> **Vendored Orbit was updated 2026-07-30 (user-approved).** The previous pack held **426** tokens and had **none** of the Connected Platform families; it came from a repo-root tarball dated 21:38 on 30 June, predating the token work committed at 22:09. It has been replaced from `packages/orbit/` — now **634** tokens, no names removed, and `CpWorkspaceShell` available. Confirmed the CP families are *committed* upstream (69 occurrences in both `HEAD` and the working tree), not local WIP.
>
> This is a shared dependency, so the other six prototypes now render differently — most visibly `--orbit-color-card-border-selected` `#4ade80`→`#615fff` (green→indigo), `--orbit-color-card-border-success` `#4ade80`→`#15803d`, `--orbit-color-card-indicator-success` `#4ade80`→`#00a962`, and tightened SideNav geometry (`nav-row-radius` md→sm). Their **source** is untouched — guard rule 10 still passes — and `git checkout -- src/vendor/orbit` reverts, with a copy at `scratchpad/vendor-backup/`.
- Being translated: `src/pages/PrototypeCP.css` (3,564 lines), `src/components/clauseiq-v6a/orbit-theme.css` (1,378 lines)

**Tier discipline** (`design-brain/tokens.md:45–46`, `anti-patterns.md:20`): map to the **Tier 2 semantic** or **Tier 3 component** token whose *role* matches. Never to a Tier 1 primitive, even when the primitive's hex is an exact match.

---

## §A — Local tokens: ZERO

Rev 1 proposed 12 prototype-local tokens and defended 1. Both were wrong.

**A.1 — All 13 rows in rev 1's table (it listed 13 while calling them 12) are redundant.** Zero `var()` consumers anywhere in CP v1 + v6a source. Efficio equivalents:

| rev-1 local | efficio equivalent | note |
|---|---|---|
| `--orbit-color-ai-accent` `#c3009e` | `--orbit-color-hollywood-cerise`; semantic home `--orbit-color-status-low-border-additional-4` `#ae008d`, `--orbit-color-chip-additional-*` | |
| `--orbit-color-ai-accent-bg` `#f4dbeb` | `--orbit-color-chip-additional-bg` (= swatch-hollywood-cerise-300) | byte-exact |
| `--orbit-color-ai-accent-border` `#d887bf` | hollywood-cerise mid step / `--orbit-color-chip-high-bg-style-1` family | |
| `--orbit-color-ai-accent-fg` `#7a0063` | hollywood-cerise dark step | |
| `--orbit-color-ai-accent-strong` `#ae008d` | `--orbit-color-status-low-border-additional-4` | byte-exact |
| `--orbit-color-surface-page` `#f3f5f8` | **`--orbit-color-bg-canvas`** (= swatch-slate-100 `#f3f5f8`) | byte-exact, semantic tier |
| `--orbit-color-surface-subtle` `#fafafa` | `--orbit-color-alabaster` | |
| `--orbit-color-surface-sunken` `#f0f0f0` | `--orbit-color-gallery` | |
| `--orbit-radius-full` `999px` | `--orbit-radius-pill` | duplicate of a duplicate |
| `--orbit-radius-pill` `999px` | already at `:root` (`vendor/orbit/tokens.css:11`); also `--orbit-cp-radius-round` | **not "dead"** — 13 live consumers inside vendored Orbit components (Avatar, Filter, StepCircle, MultiSelectDropdown, Radio, SideNav). Safe to drop only *because* efficio defines it. |
| `--orbit-font-family-mono` | unused | drop |
| `--orbit-text-md` `1rem` | `--orbit-text-base` `16px` | |
| `--orbit-shadow-overlay` | **`--orbit-shadow-lg`** | see A.2 |

Scope note: `surface-subtle`, `text-md` and `shadow-overlay` *are* live in CP **v2** (`PrototypeCPV2.css:2457, 2403, 369`), which is outside this port's scope (CP v1 + v6a). The zero-usage finding holds for our scope only — stated because the arithmetic depends on it.

**A.2 — `--orbit-shadow-overlay` is not a gap.** Efficio's own `Overlay` uses `--orbit-shadow-lg` (`src/vendor/orbit/dist/feedback/Overlay.module.css:15`), as do `Toast.module.css:25`, `Dropdown.module.css:110`, `MultiSelectDropdown.module.css:137`. `--orbit-shadow-lg` **is** the system's floating-surface elevation, evidenced by the design system's own overlay component. Rev 1's claim that no overlay-weight elevation exists was false. CP v3 modals use the Orbit `Overlay` component (`AGENTS.md:126`) and inherit it.

**A.3 — Decision: `tokens.css` ships empty (or is deleted).** `ALLOWED_LOCAL_TOKENS` is `[]`. Any future need is a change request against `packages/orbit/styles/tokens/` per `tokens.md:144` ("Any new token must be added to the coded design system first"), not a prototype-local override.

Rejected alternative — `--orbit-color-ai-accent-*: var(--orbit-color-swatch-hollywood-cerise-N)` as "semantic aliases" — is strictly worse: references Tier 1, invents an upstream-nonexistent family, and adds 5 allowlist entries for tokens with 0 uses.

---

## §B — The CP token families (rev 1 missed these entirely)

Efficio ships a purpose-built Connected Platform layer. Rev 1 contained **zero** references to it and routed CP chrome to generic tokens. This is the correction, and it is the backbone of §C and §D.

**B.1 — `--orbit-color-cp-*` (Tier 2, `semantics.css:47–55`)** — 9 tokens, near-exact matches for CP v1's most-used values:

| CP token | value | CP v1 value replaced | × |
|---|---|---|---|
| `--orbit-color-cp-border` | `#e5e5e5` | `#e5e5e5` — **byte-exact** | 2 |
| `--orbit-color-cp-border-strong` | `#dee2e6` | `#d8dee6` (36 border uses), `#dfe3e8` (5), `#d8dee8` (2) | 43 |
| `--orbit-color-cp-surface-muted` | `#f3f4f4` | `#f1f2f4` (7 bg) | 7 |
| `--orbit-color-cp-nav-bg` | `#5b72b5` | `#5c73b5`, `#6376b7` — one unit | 4 |
| `--orbit-color-cp-nav-active-fg` | `#3a4a82` | bluebar active-tab fg | — |
| `--orbit-color-cp-date-text` | `#4f575e` | `#4f5662` | 2 |
| `--orbit-color-cp-timeline-highlight-bg` | `#e7f0fe` | `#e7f1ff` | 2 |
| `--orbit-color-cp-step-complete` | `#00bd9e` | `#00bd9e` — **byte-exact** | timeline/rail |
| `--orbit-color-cp-step-active` | `#0073cf` | `#0073cf` — **byte-exact** | timeline |

**B.2 — `--orbit-cp-*` (Tier 3, `components.css:421–489`)** — 69 tokens covering the entire CP shell **geometry**. Rev 1's §G claimed the only scale forks were radius/leading/type; this is a whole second axis it never saw. These replace hardcoded dimensions, not only colours:

| Region | Tokens | Replaces in `PrototypeCP.css` |
|---|---|---|
| Shell | `shell-min-height`, `shell-rail-width` (56px), `shell-bg`, `shell-content-bg`, `shell-content-padding` | `.cp-app`, `.cp-rail` width, `.cp-canvas` bg + padding |
| Rail | `rail-bg`, `rail-border-color`, `rail-row-width` (55px), `rail-row-min-height` (46px), `rail-row-padding`, `rail-row-gap`, `rail-icon-box-size` (39px), `rail-icon-box-radius`, `rail-icon-size` (14px), `rail-active-bg`, `rail-label-size` (8px), `rail-label-line-height`, `rail-avatar-size` | `.cp-rail-*`, `.cp-rail-button`, `.cp-user-dot` |
| Header | `header-height` (56px), `header-padding-inline`, `header-border-color`, `title-icon-size`, `title-icon-radius`, `title-gap` | `.cp-topbar`, `.cp-title`, `.cp-header-actions` |
| Breadcrumb | `breadcrumb-height` (40px) | `.cp-breadcrumb` |
| Primary nav | `primary-nav-gap`, `-line-height`, `-color`, `-active-color`, `-hover-color` | `.cp-main-tabs`, `.cp-main-tab` |
| Secondary (bluebar) | `secondary-height` (56px), `-bg`, `-fg`, `-padding-inline`, `-tab-group-gap`, `-tab-height` (44px), `-tab-padding`, `-tab-radius`, `-tab-active-bg`, `-tab-active-fg`, `-tab-hover-bg`, `-action-gap` | `.cp-bluebar`, `.cp-subtabs`, `.cp-subtab`, `.cp-blue-actions` |
| Timeline | `timeline-height` (88px) + 17 more (`track-height`, `symbol-offset`, `step-symbol-size`, `step-complete/active/upcoming-bg`, `label-max-width`, `date-size/line-height/color`, …) | `.cp-timeline*`, `.cp-milestone`, `.cp-diamond`, `.cp-dot`, `.cp-line` |
| Misc | `radius-round`, `border-width`, `disabled-opacity` | pills, dividers, disabled states |

**Consequence:** once the shell consumes these, most of rev 1 §G's "will it look airier?" question is moot — shell dimensions become *fixed by efficio* rather than a judgement call. The density debate reduces to content regions only.

**B.3 — `--orbit-color-sidenav-*` (Tier 3, `components.css:242–247`)** — `bg #2f3342`, `active-bg #43485d`, `divider #43485d`, `muted #a3aecf`, `gradient-from #147ed3`, `gradient-to #2a75b1`. Replaces rev 1's three invented `color-mix(white N%)` rail scrims, and supplies the honest target for v6a's `--sidebar-*` bridge entries (§F.2).

---

## §C — CP v1 colour map (`PrototypeCP.css` 206–3564 → `PrototypeCPV3.css`)

Method: every value mapped by **the CSS property it is used with**, extracted mechanically (162 distinct value+property pairs). The property is shown on **every** row — rev 1 dropped it for ~130 of 156 values, which is how a border landed on a text token and a warning fill landed on a token that fails AA as text.

### C.1 — Neutral text

| Value | Property | × | → | Contrast on white |
|---|---|---|---|---|
| `#111` | `color` | 13 | `--orbit-color-text-primary` `#000000` | 21:1 |
| `#242832` | `color` | 16 | `--orbit-color-text-heading` `#040921` | 19.6:1 |
| `#30343b` | `color` | 6 | `--orbit-color-text-heading` | 19.6:1 |
| `#6a707b` | `color` | 13 | `--orbit-color-text-secondary` `#666666` | 5.7:1 |
| `#616671` | `color` | 2 | `--orbit-color-text-secondary` | 5.7:1 |
| `#777` | `color` | 4 | `--orbit-color-text-secondary` | 5.7:1 |
| `#475569` | `color` | 6 | `--orbit-color-text-secondary` | 5.7:1 |
| `#4f5662` | `color` | 2 | `--orbit-color-cp-date-text` `#4f575e` | 7.6:1 |
| `#fff` / `#ffffff` | `color` | 23 | `--orbit-color-text-inverse` | — |

`#475569`'s **2 border uses** map to `--orbit-color-cp-border-strong`, not the text token (rev 1 put all 8 on the text token).

### C.2 — Surfaces and borders

| Value | Property | × | → |
|---|---|---|---|
| `#fff` / `#ffffff` | `background` | 50 | `--orbit-color-bg-default` |
| `#f3f5f8` | `background` | 4 | `--orbit-color-bg-canvas` (byte-exact) |
| `#f1f2f4` | `background` | 7 | `--orbit-color-cp-surface-muted` |
| `#f8fafc`, `#fbfcfd`, `#f6f7f9`, `#f5f8fb` | `background` | 10 | `--orbit-color-cp-surface-muted` |
| `#e5e5e5`, `#e8e8e8`, `#e0e0e0`, `#dfdfdf` | `background` | 10 | `--orbit-color-bg-disabled` `#e6e6e6` |
| `#d8dee6` | `border` / `-top` / `-bottom` / `-color` | 36 | `--orbit-color-cp-border-strong` |
| `#dfe3e8`, `#d8dee8` | `border-bottom` / `-color` | 7 | `--orbit-color-cp-border-strong` |
| `#c8ced6`, `#c9ced6`, `#cbd1d9`, `#d7d7d7` | `border` / `-color` | 11 | `--orbit-color-border-disabled` `#cccccc` |
| `#fff` | `border` | 4 | `--orbit-color-bg-default` (hairline on tinted ground) |
| `#00bd9e` | `outline` | 5 | `--orbit-color-border-focused` — **see open item 3** |

### C.3 — Brand blue

| Value | Property | × | → |
|---|---|---|---|
| `#001969` | `color` | 24 | `--orbit-color-btn-tertiary-fg` `#001969` |
| `#001969` | `background` | 9 | `--orbit-color-btn-primary-bg` `#001969` |
| `#001969` | `border` | 4 | `--orbit-color-border-highlight` `#001969` |
| `#142b72` | `background` (5) + `border-color` (3) | 8 | **`--orbit-color-btn-primary-bg-hover` `#40548f`** |
| `#5c73b5`, `#6376b7` | `background` | 4 | `--orbit-color-cp-nav-bg` `#5b72b5` |
| `#cbd4ef` | `background` | 2 | semantic `--orbit-color-chip-*` per site (not the raw purple-gray-300 primitive) |

Rev 1 collapsed all three `#001969` roles onto one primitive; all three have role-correct Tier-2/3 homes at the identical value.

**`#142b72` correction.** Rev 1 called it "a darker Efficio blue used for pressed/active". It is **lighter** than `#001969` (relative luminance 0.0309 vs 0.0172), and all 8 uses are `:hover` — `PrototypeCP.css:1151` (`.cp-view-button:hover`), `:1886`/`:1891` (`.cp-tool-action.ready` + hover), `:2390` (`.cp-footer-btn.primary:hover`), `:2949`, `:2990–2993`. Efficio has the exact role token. Rev 1's recommended option would have deleted primary-button hover feedback, violating `AGENTS.md:140`.

### C.4 — Status colours, split by text vs non-text

Efficio deliberately separates status *fills* from status *text* because the fills fail AA as text. One row per role, not per hue.

| Value | Property in CP v1 | → | AA as text |
|---|---|---|---|
| `#00a962` | `background` | `--orbit-color-status-high-bg-success` `#00a962` | 3.1:1 — **non-text only** |
| success on text | `color` | `--orbit-color-text-success` `#007a66` | 5.3:1 ✓ |
| `#e0faf5`, `#def8f1` | `background` | `--orbit-color-status-low-bg-success` / `--orbit-color-bg-selected` `#dffcf3` | — |
| `#f0ab00`, `#f6b400` | `background` (`:703`, `:915`), `border-left-color` (`:3341`) | `--orbit-color-border-style1` `#f0ab00` | 2.0:1 — **non-text only** |
| warning on text | `color` | `--orbit-color-text-warning` `#8f6100` | 4.7:1 ✓ |
| `#e00034`, `#cd0030` | `background` / `border` | `--orbit-color-status-high-bg-error` / `--orbit-color-border-error` | — |
| error on text | `color` | `--orbit-color-text-error` `#e00034` | 5.0:1 ✓ |
| `#ffd1d1` | `background` | `--orbit-color-status-low-bg-error` `#ffdedb` | — |
| `#0073cf` | timeline step fill | `--orbit-color-cp-step-active` `#0073cf` | non-text |
| `#e7f1ff` | `background` | `--orbit-color-cp-timeline-highlight-bg` `#e7f0fe` | — |
| info on text | `color` | `--orbit-color-text-info` `#2a75b1` | 4.6:1 ✓ |

**Translation rule:** a status hue on `color` takes the `text-*` token; on `background`/`border`/icon fill it takes the `status-*`/`border-*` token. Never substitute one for the other.

### C.5 — Chrome

`PrototypeCPChrome.tsx` has one hardcoded value: `#f0ab00` on the Guidance hand icon → `--orbit-color-border-style1` (icon fill, non-text). Rail geometry moves onto `--orbit-cp-rail-*` (§B.2); rail scrims onto `--orbit-color-sidenav-*` (§B.3).

### C.6 — Shadows, decided per role

| Value | Role | → |
|---|---|---|
| `rgba(4,9,33,0.18)` | modal / overlay lift | `--orbit-shadow-lg` |
| `rgba(0,0,0,.5)`-class backdrop | modal scrim | `--orbit-color-overlay-backdrop` `rgba(4,9,33,0.5)` |
| small card lift | resting card | `--orbit-shadow-sm` |
| dropdown / popover lift | floating | `--orbit-shadow-md` |

---

## §D — Typography and non-colour scale forks

Every fork resolves **to the efficio value**; no scale is re-forked.

| CP v1 | efficio | Effect |
|---|---|---|
| shell `font-size: 13px` (`:202`) | `--orbit-text-body-size` = `--orbit-text-sm` `14px`; `--orbit-cp-body-line-height` `21px` | +1px base — main driver of any "airier" feel |
| `--orbit-text-button-leading: 1` (`:170`) | `var(--orbit-leading-relaxed)` `1.714` | **buttons grow ~10px** at 14px. Largest single layout change. |
| `--orbit-radius-md: 6px` | `8px` | |
| `--orbit-radius-lg: 8px` | `12px` | |
| leading `1.15 / 1.25 / 1.45 / 1.6` | `1 / 1.143 / 1.571 / 1.714` | |
| type scale in `rem`; xl/2xl/3xl `20/24/30px` | `px`; `26/28/36px` | |
| `--orbit-document-glyph-size-micro: 12px` | `8px` | shrinks |
| `--orbit-document-glyph-size-extra-small: 13px` | `16px` | grows |
| `--orbit-document-glyph-label-size-extra-small: 3px` | `4px` | 24 read sites in `src/` |
| `--orbit-shadow-none: none` | `0 0 0 0 transparent` | |
| font stack fork (`:149`) | `--orbit-cp-font-family` | below |
| *(absent in CP v1)* | `--orbit-font-weight-bold: 800` | Inter loads 400–700 only → `font-bold` diverges from the token |

**Font — Sofia Pro, with an unmet dependency.** `--orbit-cp-font-family` = `var(--orbit-font-family-brand)` = `"Sofia Pro", sans-serif` (`typography.css:7`). CP v3 references the token; that is correct and future-proof. **But the font is unavailable:** no `@font-face` in `src/vendor/orbit/fonts.css` (Font Awesome only), no file in `src/vendor/orbit/fonts/`, not installed on this machine, and `index.html:10` loads only Inter 400–700 from Google Fonts. Today the token resolves to generic `sans-serif` — Helvetica on macOS — which is neither Sofia Pro nor Inter.

To close: a Sofia Pro web-font file plus an `@font-face` in the namespace. Font *loading* is the app's job, not a token override — exactly as `index.html` loads Inter. **Open item 1.**

**Density — resolved, sourced.** `design-brain/defaults.md` "Platform deltas" answers this directly for Connected Platform, so it is no longer a judgement call:

| Aspect | Connected Platform |
|---|---|
| Density bias | **Denser by default** — dense quick-link grids, compact list/table rows, many items per viewport |
| Card padding | **`Small`** on operational tiles, list rows, tables |
| Spacing bias | Tight, scan-first; maximise content per screen |
| Shell | Light theme; **icon-only collapsed left nav rail**; tab bars for sub-navigation |
| Copy | Concise internal/operational labels |

So: Orbit components mount at **compact** density with `Card` padding `Small`, and `CpWorkspaceShell` gets `railCompact`. Sibling-block gap `--orbit-space-base` (16px, the Compact value) rather than `--orbit-space-l`; page padding `--orbit-cp-shell-content-padding`.

Do **not** re-fork the type scale to recover CP v1's compactness — choose *smaller steps* from `--orbit-space-*` at call sites, never redefine a step. Acceptance criterion, measurable at Gate 1: shell regions match `--orbit-cp-header-height` 56px, `--orbit-cp-shell-rail-width` 56px, `--orbit-cp-breadcrumb-height` 40px, `--orbit-cp-secondary-tab-height` 44px, `--orbit-cp-timeline-height` 88px. Consuming `CpWorkspaceShell` (§G.1) satisfies these by construction, leaving only content regions negotiable.

---

## §E — Deleted blocks

Not translated — deleted, with reasons:

| Lines | Block | Why |
|---|---|---|
| 1–205 | `.prototype-cp` token shadow block (202 defs, ~50 orbit-theme values, ~30 off-scale) | tokens resolve from `@orbit-tokens` efficio base; this block *is* the defect |
| 220–227 | `[data-prototype="clauseiq-v5"][data-theme="orbit"]` override | v5 markup never mounts in CP v3 |
| 1761–1944 (most) | `cp-clause-body` / `cp-tool-*` / `cp-callout*` / `cp-history` | dead; only `.cp-tool-action` referenced |
| 2102–2399 (most) | legacy generic modal kit | dead except `cp-modal-backdrop`, `cp-close`, `cp-footer-btn` |
| 2400–2449 | `cp-v5-*` | zero TSX references |
| 2748–3087 | deep v5-DOM overrides (radiogroup, `.text-ciq`, `.clauseiq-responsive-analysis-card` children) | target markup absent; v6a equivalents styled properly instead |
| 3182–3564 | hand-rolled results dashboard | superseded by `ContractResults` |

~700 lines dropped. Survivors: ~2,600 lines translated per §C/§D, geometry onto §B.2.

---

## §F — v6a `orbit-theme.css` classification (1,378 lines, 87 `!important`)

**F.1 — All five `--orbit-*` overrides dispositioned** (rev 1 inventoried one):

| Line | Override | Disposition |
|---|---|---|
| 3 | `--orbit-color-swatch-purple-gray-500` | **Drop.** Clobbers an efficio Tier-1 primitive globally — the exact anti-pattern. |
| 61 | `--orbit-color-card-border-success` → `var(--orbit-color-text-success)` | **Keep as decision.** Commented "Match the Figma Static Card success variant"; moves `#009a81`→`#007a66`. Re-express by scoping the existing token on the card selector (legal under revised rule 4). |
| 62 | `--orbit-color-card-indicator-success` → same | **Keep as decision.** Same treatment. |
| 63 | `--orbit-color-togglecard-border-subtle` | **Drop — no-op.** Efficio already `transparent` (`components.css:99`). |
| 111 | `--orbit-color-btn-tertiary-fg` scoped to `.clauseiq-v6a-upload-dropzone` | **Keep.** Instance retheming, sanctioned by `tokens.md:49–50`. |

**F.2 — shadcn HSL bridge (lines 1–62).** Re-derived from efficio, not carried. v6a's `--primary: 241 100% 69%` is `#615fff` — **orbit's** indigo (`themes/orbit.css:283`); carrying it would smuggle the orbit theme in through the bridge. Per-entry targets:

| Bridge var | v6a (orbit) | CP v3 (efficio) |
|---|---|---|
| `--primary` | `241 100% 69%` `#615fff` | `--orbit-color-btn-primary-bg` `#001969` = `237 100% 21%` |
| `--ring` | brand blue | `--orbit-color-border-focused` `#00bd9e` — **not** the brand blue |
| `--background` / `--card` / `--popover` | slate | `--orbit-color-bg-canvas` / `--orbit-color-bg-default` |
| `--border` / `--input` | slate | `--orbit-color-cp-border-strong` |
| `--muted` | slate | `--orbit-color-cp-surface-muted` |
| `--radius` | `--orbit-radius-md` 6px | `--orbit-radius-md` 8px (value moves; token unchanged) |
| `--sidebar-background` `210 82% 9%` | — | `--orbit-color-sidenav-bg` `#2f3342` |
| `--sidebar-accent` `217 33% 17%` | — | `--orbit-color-sidenav-active-bg` `#43485d` |
| `--ciq-purple*` | orbit indigo | **no efficio analogue** — open item 2 |

Lines 64–67 are four real property declarations (`accent-color`, `background`, `color`, `font-family`), not bridge defs — carried, `font-family` → `--orbit-cp-font-family`.

**F.3 — the 87 `!important` and 25 `nth-child` rules.** Default: **dropped** as orbit-theme compensation. Kept only where the rule encodes a genuine design decision — the filter-chip colour coding, pressed-state treatments, and the rationale-footer positioning from the 2026-07-29 commits. Re-expressed as: Orbit component props where available; else a scoped rule keyed on `data-filter-group` / `data-*` attributes (never positional `nth-child`), efficio tokens, zero `!important`.

**F.4 — escape-hatch owner.** A rule that genuinely cannot be expressed without `!important` does **not** ship. It is raised as a contract gap against the relevant component contract; the interim expression is a scoped attribute-keyed rule with higher specificity. Decision sits with the design-system owner, not the porter.

---

## §G — Component mapping (required by `port-to-orbit/SKILL.md:13–15`, `lovable-port.md:36–42`)

Token translation alone is insufficient — ~27,300 lines cannot be translated with no record of which Orbit contract each region satisfies.

### G.1 — The whole CP shell is already an Orbit component

**`CpWorkspaceShell`** (`dist/navigation/CpWorkspaceShell.js`, committed upstream 2026-06-16, cited `[SOURCED]` in `design-brain/defaults.md`) exists and its props map 1:1 onto CP v1's shell. It also exports each region separately (`CpSideRail`, `CpBreadcrumbHeader`, `CpPrimaryNav`, `CpWorkspaceHeader`, `CpSecondaryNav`, `CpMilestoneTimelineNav`).

| CP v1 hand-rolled | `CpWorkspaceShell` prop | CSS no longer needed |
|---|---|---|
| `CpRail` nav buttons | `railItems: CpSideRailItem[]` | `.cp-rail*`, `.cp-rail-button`, `.cp-mark`, `.cp-dev` |
| `.cp-user-dot` | `user: CpWorkspaceUser` | `.cp-rail-bottom`, `.cp-user-dot` |
| `.cp-breadcrumb` | `breadcrumbItems: CpBreadcrumbItem[]` | `.cp-breadcrumb` |
| `.cp-topbar` / `.cp-title` | `workspaceTitle`, `workspaceIcon` | `.cp-topbar`, `.cp-title` |
| `.cp-main-tabs` / `.cp-main-tab` | `primaryNavItems: CpNavItem[]` | `.cp-main-tab*` |
| `.cp-bluebar` / `.cp-subtabs` | `secondaryNavItems`, `secondaryLabel` | `.cp-bluebar`, `.cp-subtab*`, `.cp-blue-*` |
| 8-node milestone timeline | `timelineSteps: CpTimelineStep[]` | `.cp-timeline*`, `.cp-milestone`, `.cp-diamond`, `.cp-dot`, `.cp-line` |
| `HeaderActions` | `rightActions: CpNavItem[]` | `.cp-header-actions` (partly) |
| rail/timeline density | `railCompact`, `timelineShowLabels` | — |

**Consequence — Phase 1 shrinks materially.** The shell is composed and fed data rather than restyled; §B.2's `--orbit-cp-*` tokens are *this component's* component tokens, so consuming the component gets them for free. What remains to translate is only the **content** regions: project cards, initiatives list/toolbar, insight panel, workspace accordions, milestone card, modals, launcher. Re-estimate Phase 1 from **L to M**, and expect the §E deletion list to grow.

This is the clearest instance of `AGENTS.md` rule 6 ("use the contract, not your imagination") in the whole port, and it was only found because the vendored pack was refreshed.

### G.2 — `InlineBanner` is now label-only; `Alert` owns the two-line callout

The vendored refresh carried a **breaking component change**, not just token values. Old `InlineBanner` had a "rich" mode: pass `description` and it rendered a 16px icon + title + description in one tinted container, with optional dismiss. The new one is a single-line strip — `description`, `dismissLabel` and `onDismiss` were all removed from both the types *and* the implementation (`InlineBanner.js` referenced `description` 3× before, 0× now).

Those props moved to **`Alert`** (also exported as `Banner`): `type` / `title` / `description` / `onDismiss`. So the mapping is:

| Old | New |
|---|---|
| `<InlineBanner variant="Information" contrast="Low" label={t} description={d} />` | `<Alert type="Information" title={t} description={d} />` |
| `<InlineBanner variant="X" label={t} />` (no description) | unchanged — still `InlineBanner` |

`Alert` covers `Information | Success | Error | Warning | No Status`; the strip-only variants (`Style 1`, `None`, `Disabled`) have no `Alert` equivalent. `Alert` derives icon and contrast from `type`, so `contrast`/`icon` do not carry over.

**Fixed 2026-07-30 (user-approved deviation from byte-identity).** Four prototypes passed `description` to `InlineBanner`, so that copy silently stopped rendering — a functional regression. Repaired at 10 sites: the shared `CpInlineBanner` adapter now routes to `Alert` when a description is present (fixing every adapter call site with no call-site edits), plus 9 direct sites migrated to `Alert`. Result: ClauseIQ V6 **3 failed → 24/24 green**; ClauseIQ V7 **5 failed → back to its baseline 2**; typecheck clean. Guard rule 10 records the exemption and still fails on any other v6a file or any changed line outside the migration.

**For CP v3:** use `Alert` for titled callouts, `InlineBanner` for label-only strips. Do not reintroduce `description` on `InlineBanner`.

### G.3 — Remaining region decisions

| CP v1 / v6a region | Orbit contract | Decision |
|---|---|---|
| `cp-modal-*`, `cp-clause-modal-*` hand-rolled modals | `Overlay` (`AGENTS.md:126` — no `Drawer` exists) | **Use Orbit `Overlay`.** Also resolves §A.2 by inheritance. |
| `cp-workstream-table`, `cp-table`, history round table | `Table` (`AGENTS.md:125`, `lovable-port.md:85–88`) | **Orbit `Table` + pagination**, never div rows, no raw px column widths |
| status pills / deviation chips | `Chip`, `Badge`, `StatusIndicator` | per `components/chip.md`, `badge-status.md` |
| project / analysis / clause cards | `Card`, type Dynamic, **padding `Small`** (see §D density), **never nest** | `AGENTS.md:126` + `defaults.md` platform deltas |
| insight rail | no contract | local composition; `defaults.md` warns support rails must assist, not promote |
| `TextDiff` | no contract | local composition; recorded as gap |

---

## §H — Guard rules (mechanically enforced)

| # | Rule |
|---|---|
| 1 | No native `button`/`input`/`select`/`textarea`/`table`/`a`/`role="button"` outside the two adapter dirs (paths fully qualified, not bare `/orbit-ui/`) |
| 2 | No `data-theme=` anywhere in the namespace |
| 3 | No colour literals: hex, `rgb(`, `hsl(`, **named CSS colours**, `oklch(`, `lab(`, `color(`, **Tailwind palette utilities** (`bg-amber-50` etc. — 5 live in v6a). **No file exempt** — rev 1's whole-file amnesty for `clauseiq-theme.css` is removed. |
| 4 | No `--orbit-*` **definition** outside `tokens.css` (allowlist now empty). **Assigning an existing efficio token on a local selector IS permitted when the value is a `var(--orbit-*)` reference** — sanctioned instance retheming (`tokens.md:49–50`); rev 1's rule banned it and would have blocked §F.1 rows 61/62/111. |
| 5 | No `!important` |
| 6 | No cross-prototype imports — `@/components/…` **and relative paths**, incl. `@/components/ui/` (shadcn) |
| 7 | No `ciq-v6a` / `clauseiq-v6a` string literals (storage-key sweep backstop) |
| 8 | No `lucide-react` (`anti-patterns.md:21` — `FaIcon` only) |
| 9 | `<OrbitInspector />` mounted exactly once (`AGENTS.md:67–70`, `:146`), on a component that does **not** set `data-theme` — v6a couples them (`V6OrbitRoot.tsx:16` + `:26`), so the port splits them |
| 10 | v6a byte-identity: `git diff --stat -- src/components/clauseiq-v6a src/components/workflow-v6a src/pages/ClauseIQV6A* src/pages/IndexV6A*` empty |
| 11 | Runtime `data-theme` **ancestor** assertion — `closest('[data-theme]') === null` on the CP v3 root and on portalled overlays. Rule 2 proves only that we don't *set* it; `tokens.css` imports `themes/orbit.css`, so any ancestor re-themes the subtree, and v6a's portal does exactly that (`V6OrbitOverlay.tsx:44`). |
| 12 | Non-empty scan floor — assert `namespaceFiles().length` above a floor so a broken glob cannot pass vacuously |

**Permitted out-of-namespace edits — a closed list.** Anything else appearing in the diff is a defect: `src/App.tsx` (routes), `src/lib/prototype-store.ts` (predicate/factory/seed), `src/pages/PrototypeTimeline.tsx` (entry), `src/lib/prototype-cp-v3-routes.ts` (new), `tailwind.config.ts` (additive keys only, if any), `.claude/agents/` (gitignored). This makes decision 4 ("total isolation") enforceable rather than aspirational.

---

## Open items requiring sign-off

1. **Sofia Pro font file** (§D) — token is correct but unresolvable; shell renders Helvetica until a web-font file + `@font-face` is added. Need the file, or an explicit "ship the fallback for now".
2. **`--ciq-purple*`** (§F.2) — no efficio analogue. Map to the hollywood-cerise `additional-4` / `chip-high-bg-style-1` family, or remove?
3. **Focus ring is an inherited AA failure** — `--orbit-color-border-focused` `#00bd9e` is ≈2.4:1 on white, below the 3:1 WCAG 2.2 SC 1.4.11 / 2.4.13 require of a focus indicator. CP v1 already ships it (`PrototypeCP.css:629, 2728, 2879, 2955, 2998`) and §C.2 maps to it faithfully, so CP v3 *inherits* a failure it cannot fix locally. Raise upstream against `semantics.css:26`; until then CP v3 cannot honestly claim AA on focus. `tokens.md:124–134` covers text tokens only — it should be extended to non-text/focus.
4. **Overlay elevation** (§A.2) — if owners want a heavier lift than `--orbit-shadow-lg`, that is a change request against `elevation.css`. Recording the decision either way.
5. ~~Density mode~~ — **resolved** from `defaults.md` platform deltas: compact, `Card` padding `Small`, `railCompact`. See §D.
6. **State + a11y artifacts** — `lovable-port.md:56–64` requires loading/empty/error/disabled/active-filters/selected-detail; `AGENTS.md:142` requires generated a11y, browser-visual and screen-reader artifacts. Gates 1–4 currently gate static greps only; each artifact needs a named gate.
7. **v6a's shifted appearance** — the vendored refresh changed `card-border-selected` green→indigo and three other card tokens in the orbit theme, so CCP v6a and v5/v6/v7/CP v1/CP v2 now render differently. Source untouched and revertable. Worth a look at `/clauseiq-v6a` and `/prototype-cp-v2` to confirm the new values are wanted, since they move those prototypes closer to the current design system rather than away from it.
