# ClauseIQ v3 Design Options Usability Study

Date: 17 May 2026  
Prototype: ClauseIQ v3 comparison view  
Route tested: `/initiatives-v3?view=results&initiativeId=init-1&supplierId=sup-1&contractId=ct-1&source=clauseiq&mode=comparison&tab=changes&from=v3&to=v4`

## Executive Summary

This simulated study tested 25 artificial users across the three v3 design options:

- Option 1 · Evolved
- Option 2 · Side-by-side
- Option 3 · Document

The strongest direction is **Option 1 · Evolved**, with selected patterns from Option 2. Option 1 performed best for daily contract triage because the category rail, version movement, metrics, and workflow cards are all visible in one operational layout. Option 2 was strongest for evidence-led review but split attention between the left evidence rail and the decision list. Option 3 worked best as a readout or stakeholder summary, but underperformed for triage because users had to work harder to connect summary metrics to clause actions.

Recommended direction: **continue with Option 1 as the primary workflow**, borrow Option 2's sticky evidence behavior where useful, and keep Option 3 only as a report/readout variant.

## Test Setup

### Artificial User Cohort

| Cohort | Count | Primary Intent |
| --- | ---: | --- |
| Legal/commercial reviewers | 8 | Validate clause movement and decide whether supplier responses are acceptable |
| Procurement/category managers | 7 | Understand risk, prioritize categories, and manage supplier follow-up |
| Sourcing/procurement operations | 5 | Complete workflow actions quickly and accurately |
| Senior stakeholders | 3 | Understand overall position without clause-level detail |
| Novice ClauseIQ users | 2 | Test learnability and terminology clarity |

### Counterbalanced Option Order

| Starting Option | Users |
| --- | ---: |
| Option 1 first | 9 |
| Option 2 first | 8 |
| Option 3 first | 8 |

All users evaluated the same Acme MSA `v3 -> v4` comparison data.

## Task Results

### Aggregate Task Completion

| Task | Option 1 · Evolved | Option 2 · Side-by-side | Option 3 · Document |
| --- | ---: | ---: | ---: |
| Understand page context | 23/25 | 22/25 | 24/25 |
| Assess contract movement | 22/25 | 23/25 | 21/25 |
| Triage open items | 23/25 | 21/25 | 18/25 |
| Handle supplier changes | 22/25 | 20/25 | 17/25 |
| Use filters and categories | 21/25 | 20/25 | 16/25 |
| Find Closed and reopen | 22/25 | 20/25 | 16/25 |
| Understand request basket | 21/25 | 21/25 | 18/25 |
| Compare all three options | 25/25 | 25/25 | 25/25 |

### Average Confidence Score

Scale: 1 = not confident, 5 = very confident.

| Area | Option 1 | Option 2 | Option 3 |
| --- | ---: | ---: | ---: |
| Understanding contract movement | 4.3 | 4.4 | 4.1 |
| Knowing what to action next | 4.2 | 3.9 | 3.4 |
| Trusting the evidence | 4.0 | 4.3 | 3.8 |
| Finding filters/categories | 4.1 | 3.8 | 3.2 |
| Managing request basket | 4.0 | 4.0 | 3.5 |

### Preference Ranking

| Preferred For | Winning Option | Notes |
| --- | --- | --- |
| Daily contract triage | Option 1 · Evolved | Best balance of summary, categories, and action cards |
| Evidence-led review | Option 2 · Side-by-side | Sticky evidence rail helped users keep context while scrolling |
| Stakeholder readout | Option 3 · Document | Most presentation-like and easiest to narrate at a high level |
| Fastest workflow | Option 1 · Evolved | Fewer layout switches, categories always visible |
| Most visually clear | Option 1 · Evolved | Users understood the left-to-right workflow faster |
| Most trustworthy | Option 2 · Side-by-side | Evidence rail made the model rationale feel more explicit |

## Key Findings

### P0 Usability Blockers

1. **Option 3 is not strong enough for operational triage.**  
   Users understood it as a report, not a work surface. Clause actions, categories, and basket state felt secondary to the document-style summary.

2. **Closed needs a persistent recovery path in all options.**  
   The Closed quick filter helped, but users still expected a visible "recently closed" affordance after closing an item.

3. **Request basket state must remain visually attached to the clause card.**  
   Users need the card itself to confirm that the clause has been added to the basket, not only the bottom basket bar.

### P1 Improvements

1. **Unify the metric vocabulary across all options.**  
   `Open items`, `Met`, `Supplier changes`, `Need review`, `High`, `Medium`, `Low`, and `Total` should appear consistently wherever metrics are shown.

2. **Reduce repeated score/delta displays.**  
   Users saw score repeated in multiple places and treated the duplicates as separate signals. Keep score in one primary location per option.

3. **Make category filtering context more visible.**  
   When a category is active, users need a clear `Category: X` chip near the workflow cards, not only inside the category rail or strip.

4. **Clarify the difference between Supplier changes and Need review.**  
   Some users interpreted both as a to-do count. The label `Supplier changes` should mean detected supplier-side movement; `Need review` should mean user work remaining.

### P2 Polish

1. Tighten vertical spacing in Option 2's evidence rail once filters expand to many metrics.
2. Keep Option 3's document container, but reduce operational controls inside it if it becomes a readout mode.
3. Consider renaming `Document` to `Readout` if it remains in the prototype.

## Duplication And Wording Audit

| UI / Wording | Issue | Decision |
| --- | --- | --- |
| Top header metrics and option-level metric cards | Repeats similar counts in different locations | Keep option-level cards; reduce top header stats to only global context |
| Version selector in multiple locations | Location differs by option | Keep inside the main comparison area for each option; avoid a second selector in top bars |
| Score delta in score card, movement header, and chart strip | Users read duplicates as different signals | Keep one score/delta display per option |
| Category navigation plus severity quick filters | Useful but can feel like two filter systems | Keep both; show active category chip and active metric state clearly |
| Closed section plus Closed quick filter | Redundant but necessary for recovery | Keep both; Closed quick filter is the doorway, Closed section is the destination |
| `Need action` vs `Need review` | Ambiguous action ownership | Use `Need review` everywhere |
| `Supplier changes` vs `New Changes` | Similar concept, different wording | Use `Supplier changes` for metric; keep section title `New Changes` only if section copy clarifies supplier-originated changes |
| `Request Change` vs `Follow-up` | Different actions, but both create supplier-facing asks | Keep both; `Follow-up` only for previously requested items, `Request Change` for new/unmarked clauses |
| `Document` | Sounds like a contract document, not a design mode | Rename to `Readout` if this option remains |

## Option-by-Option Findings

### Option 1 · Evolved

Strengths:

- Best overall workflow comprehension.
- Category rail supported triage naturally.
- Full-width workflow sections made scanning easier.
- Users understood where to act after reading metrics.

Weaknesses:

- The summary area can still feel dense.
- `What changed this round` and `Version movement` need clear hierarchy.
- If too many metrics remain in the summary, users skim instead of interpreting.

Recommended changes:

- Make Option 1 the primary candidate.
- Keep the 50/50 summary split.
- Keep the version selector inside Version Movement.
- Keep the category rail.
- Remove non-essential topbar stats that duplicate the option-level metrics.

### Option 2 · Side-by-side

Strengths:

- Evidence rail increased trust.
- Sticky left rail helped during long scrolling.
- Strongest for users who wanted to verify model rationale before acting.

Weaknesses:

- Some users treated the left rail as a filter panel only and missed its evidence role.
- Category tab inside the rail was less discoverable than Option 1's persistent category rail.
- Decision list felt visually separated from evidence.

Recommended changes:

- Keep as a comparison candidate, not the default.
- If retained, rename the rail tab from `Evidence` to `Evidence & filters`.
- Keep `Categories` tab only if it remains visibly discoverable.
- Do not reintroduce the removed score delta strip.

### Option 3 · Document

Strengths:

- Best for explaining the story to stakeholders.
- The single shared version comparison container felt polished.
- Users liked the report-like summary for readout.

Weaknesses:

- Weakest for clause-level work.
- Category strip was less useful than a rail for triage.
- Users needed more scrolling to connect the summary to actions.

Recommended changes:

- Do not use as the default operational view.
- Consider preserving it as `Readout` or `Summary` mode.
- Reduce basket/action density if it becomes a stakeholder readout.

## Recommended Direction

Move forward with **Option 1 · Evolved** as the main design direction.

Borrow from Option 2:

- Sticky evidence behavior only where it does not compete with categories.
- Stronger evidence/rationale language for trust.

Retain Option 3 only as:

- A stakeholder readout
- A printable/exportable summary
- A future report mode

## Concrete Removals And Renames

1. Remove duplicate score delta displays; keep one per option.
2. Remove or reduce top header metrics when option-level metric cards are present.
3. Rename `Document` to `Readout` if kept.
4. Rename `Need action` to `Need review` everywhere.
5. Keep `Supplier changes` as the metric label and avoid using it interchangeably with user actions.
6. Keep `Closed` quick filter, but add a short movement cue after closing: `Moved to Closed · Reopen`.
7. Remove repeated `v3 -> v4` labels where the version selector is already visible.
8. Keep `Request Change` as the basket-add action; avoid `Escalate` in this workflow.
9. Keep category filters visible in Option 1; do not hide them behind a tab in the primary workflow.
10. Keep Option 3's summary language lighter and less operational if it becomes a readout.

## Acceptance Criteria For Next Iteration

- Option 1 becomes the default design option.
- Users can complete open-item triage, supplier-change review, category filtering, and basket submission in one continuous workflow.
- No metric appears in more than two places on the screen at once.
- Score/delta appears once per option.
- `Need review`, `Supplier changes`, `Closed`, and `Request Change` are used consistently.
- Option 3 is either renamed to `Readout` or clearly positioned as non-primary.

---

# Round 4 Artificial-User Usability Test

Date: 17 May 2026  
Guide used: `/Users/derekwong/.claude/plans/composed-wondering-pearl.md`  
Prototype: ClauseIQ v3 comparison view  
Route tested: `/initiatives-v3?view=results&initiativeId=init-1&supplierId=sup-1&contractId=ct-1&source=clauseiq&catSort=risk&mode=comparison&tab=changes&from=v3&to=v4&filter=all&sort=contentious`

## Round 4 Summary

Round 4 simulated **25 artificial users** across all three v3 comparison design options after the latest refinements: category navigation reintroduced, Option 2's evidence/category rail moved left and made sticky, quick filters expanded, Closed and Unmarked sections restored, request-basket feedback added, and Option 1/3 spacing tightened.

The strongest operational pattern remains **Option 1 · Evolved**, but the gap narrowed because Option 2's sticky evidence rail now performs better for movement comprehension and confidence. **Option 3 · Document** remains viable as a stakeholder readout, but it is still the weakest option for daily clause triage and category-led recovery.

Round 4 did not select a final shipping layout. It produced refinement guidance for each option independently, per the guide.

## Cohort

| Artificial user cohort | Count | Primary behavior simulated |
| --- | ---: | --- |
| Legal/commercial reviewers | 8 | Clause-level risk review, request wording, close/follow-up decisions |
| Procurement/category managers | 7 | Supplier/category risk triage, quick filters, stakeholder summary |
| Sourcing/procurement operations | 5 | Workflow completion speed, basket submission, recovery paths |
| Senior stakeholders | 3 | Movement comprehension and narrative readout |
| Novice ClauseIQ users | 2 | Terminology and learnability stress test |

All 25 users tested all three options. Option order was counterbalanced with a 9/8/8 first-option split.

## Composite Scores

Formula used from the guide: 50 pts task success, 25 pts confidence, 15 pts efficiency, 10 pts preference share.

| Option | Task success | Confidence | Efficiency | Preference | Composite | Band |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Option 1 · Evolved | 44.3 | 19.5 | 13.7 | 4.8 | **82.3** | **B** |
| Option 2 · Side-by-side | 43.0 | 19.1 | 13.3 | 3.2 | **78.6** | **B** |
| Option 3 · Document | 41.3 | 17.7 | 12.4 | 2.0 | **73.4** | **C** |

Interpretation:

- Option 1 is the best all-round operational workflow.
- Option 2 is close behind and strongest for evidence-backed movement review.
- Option 3 is not failing, but its strength is readout/storytelling rather than clause operations.

## Scenario Results

Task success is out of 25 artificial users per option.

| Scenario | Option 1 · Evolved | Option 2 · Side-by-side | Option 3 · Document |
| --- | ---: | ---: | ---: |
| S1. Orient to page context | 23/25 | 22/25 | 24/25 |
| S2. Assess contract movement | 22/25 | 24/25 | 22/25 |
| S3. Triage open items | 23/25 | 22/25 | 19/25 |
| S4. Handle supplier-introduced change | 22/25 | 21/25 | 18/25 |
| S5. Filter category and recover Closed item | 22/25 | 20/25 | 17/25 |
| S6. Explain round to stakeholder | 21/25 | 20/25 | 24/25 |
| **Total** | **133/150** | **129/150** | **124/150** |

Average confidence score, 1-5:

| Scenario | Option 1 | Option 2 | Option 3 |
| --- | ---: | ---: | ---: |
| S1. Orient | 4.3 | 4.2 | 4.3 |
| S2. Movement | 4.2 | 4.5 | 4.1 |
| S3. Triage | 4.1 | 4.0 | 3.5 |
| S4. Supplier change | 4.0 | 4.0 | 3.4 |
| S5. Filter + Closed recovery | 4.0 | 3.7 | 3.2 |
| S6. Stakeholder explainer | 4.1 | 3.9 | 4.5 |
| **Mean** | **4.12** | **4.05** | **3.83** |

Median time-on-task estimate, seconds:

| Scenario | Option 1 | Option 2 | Option 3 |
| --- | ---: | ---: | ---: |
| S1. Orient | 36s | 39s | 34s |
| S2. Movement | 48s | 42s | 47s |
| S3. Triage | 93s | 98s | 114s |
| S4. Supplier change | 78s | 82s | 99s |
| S5. Filter + Closed recovery | 86s | 94s | 121s |
| S6. Stakeholder explainer | 53s | 59s | 44s |

## Hypothesis Verdicts

| Hypothesis | Verdict | Evidence |
| --- | --- | --- |
| H1.1: Option 1 long-scroll fatigue harms triage | Refuted after latest refinements | S3 success was 23/25, the highest score. Full-width workflow sections and category rail offset the scroll cost. |
| H1.2: Option 1 movement card is overlooked | Partly refuted | S2 reached 22/25. Some users still started with the left narrative metrics before noticing Version Movement, but the 50/50 split helped. |
| H1.3: Option 1 category rail helps Closed recovery | Confirmed | S5 success was 22/25, best of the three. The persistent rail made category filtering feel anchored. |
| H2.1: Option 2 rail tabs are misread as filters | Still partly confirmed | 6/25 initially treated `Evidence / Categories` as a filter switch. Sticky placement helped, but the label `Evidence` still feels broad. |
| H2.2: Sticky evidence improves movement understanding | Confirmed | S2 was 24/25 with 4.5 confidence, the best movement result. |
| H2.3: Option 2 instructional subtitle adds noise | Confirmed | 14/25 skipped the subtitle entirely; 5/25 said it repeated what the workflow already implied. |
| H3.1: Document wins stakeholder explainer | Confirmed | S6 was 24/25 with 4.5 confidence, best of all options. |
| H3.2: Document category strip under-discovers filters | Confirmed | S5 was 17/25. Users noticed the strip but expected deeper categories to be visible without a progressive disclosure step. |
| H3.3: Document is weakest for Closed recovery | Confirmed | S5 recovery was lowest; users saw Document as a report first and a work surface second. |

## Cohort Sub-Scores

Composite score by cohort:

| Cohort | Option 1 | Option 2 | Option 3 |
| --- | ---: | ---: | ---: |
| Legal/commercial reviewers | 85 | 80 | 70 |
| Procurement/category managers | 83 | 78 | 73 |
| Sourcing/procurement operations | 86 | 77 | 69 |
| Senior stakeholders | 74 | 75 | 88 |
| Novice users | 76 | 72 | 68 |

Pattern:

- Legal and sourcing users preferred Option 1 because actions and categories were close to the clause cards.
- Procurement/category managers split between Option 1 and Option 2; Option 2 felt more evidence-led, Option 1 felt faster.
- Senior stakeholders strongly preferred Option 3 for readout.
- Novices needed clearer language in all three options, especially around `Supplier changes`, `Need review`, and `Closed`.

## Observed Confusion Patterns

1. **`Evidence` still sounds like a passive report, not a control surface.**  
   In Option 2, users understood the metrics but not always the rail tabs. `Evidence & filters` or `Summary` would be clearer.

2. **Closed recovery is understood only after users see the Closed section.**  
   Users who clicked the `Closed` quick filter succeeded. Users who only scanned the active workflow card stack sometimes missed it.

3. **`Supplier changes` and `New Changes` remain close enough to blur.**  
   Users understood the metric after seeing a clause row, but the first read often caused a pause.

4. **Option 3 makes actionability feel secondary.**  
   Its score hero and document summary dominate. That is useful for S6 but slows down S3/S4/S5.

5. **The request basket is now discoverable.**  
   After adding a request, 23/25 noticed the card state change and 24/25 noticed the bottom basket. This is a major improvement over Round 3.

6. **Category filter state is sufficiently visible in Option 1, acceptable in Option 2, weakest in Option 3.**  
   The active category chip helped all three, but Option 3 still depends too much on the compact strip.

## UI And Copy Duplication Audit

| Item | Test outcome | Recommendation |
| --- | --- | --- |
| `Total clauses` vs `Total` | Confirmed as minor friction | Standardize on `Total clauses` everywhere. |
| `Decision list` vs `Contract comparison` | Confirmed as unnecessary divergence | Use `Contract comparison` across all three option bodies. |
| `Evidence` vs `What changed this round` vs `Version movement` | Confirmed as meaningful duplication | Use `What changed this round` for the evidence/summary area; keep `Version movement` only where the stacked bars are the object. |
| Score delta displayed in multiple styles | Mostly fixed, but still visually repeated in ScoreHero/MovementBadge contexts | Keep one score/delta expression per option. Prefer `vs prior +3 pts`. |
| Option 2 instructional subtitle | Confirmed as noise | Remove it or make it a tooltip/help hint. |
| ScoreHero sentence plus NarrativeSummary sentence | Confirmed as repetitive in Document | Suppress the terse ScoreHero sentence when NarrativeSummary is also present. |
| Two metric grids with near-identical data | Confirmed as maintainability risk | Extract one shared metric grid component with density variants. |
| Boolean-heavy `VersionDistributionPair` props | Not user-visible, but engineering risk | Replace boolean combinations with `layout="hero" | "movement" | "rail"`. |
| Dead `WorkflowStack.twoColumn` prop | No user value | Remove until needed. |
| `EvidencePanel.embedded` prop | No user value | Inline current use or make layout variant explicit. |

## Per-Option Recommendations

### Option 1 · Evolved

1. **P1 — Move the movement card header closer to the stacked bars.**  
   Source: S2, H1.2.  
   Evidence: 5/25 users read `What changed this round` first and initially missed score movement.  
   Proposed change: tighten the `Version movement` header + selector + score badge grouping in `ComparisonDesignOptions.tsx`.  
   Effort: S. Expected lift: +1-2 S2 successes.

2. **P1 — Keep category rail persistent; do not demote it.**  
   Source: S5, H1.3.  
   Evidence: strongest Closed recovery and category task performance.  
   Proposed change: retain the current rail for desktop and strip only for smaller screens.  
   Effort: none. Expected lift: preserves current S5 strength.

3. **P2 — Reduce visual density in the top summary grid.**  
   Source: S1/S2 free text.  
   Evidence: 7/25 called the summary "busy" even when successful.  
   Proposed change: group workflow metrics (`Open items`, `Met`, `Closed`, `Need review`) separately from risk metrics (`High`, `Medium`, `Low`, `Total clauses`).  
   Effort: M. Expected lift: confidence +0.1-0.2.

Round 5 must-fix: keep Option 1 as the operational baseline and polish the movement/summary split rather than changing its core layout.

### Option 2 · Side-by-side

1. **P1 — Rename `Evidence` tab to `Summary`.**  
   Source: S2/S5, H2.1.  
   Evidence: 6/25 misread `Evidence` as a filter mode, not the summary state.  
   Proposed change: change the tab label in `RightRailTabs`.  
   Effort: S. Expected lift: +1 S5 success, reduced confusion.

2. **P1 — Remove the decision-list subtitle.**  
   Source: H2.3.  
   Evidence: mostly ignored and added redundant instruction.  
   Proposed change: remove `Review requested clauses and supplier-initiated changes using the same request workflow.`  
   Effort: S. Expected lift: cleaner first scan.

3. **P2 — Add a small active-state bridge between rail metrics and card stack.**  
   Source: S3/S4.  
   Evidence: users liked filters but sometimes lost the link between clicked metric and resulting card count.  
   Proposed change: show `Filtered by: Open items x` above the decision list when a rail metric is active.  
   Effort: S. Expected lift: confidence +0.2 on filters.

Round 5 must-fix: clarify the left rail's role and remove repeated instructional copy.

### Option 3 · Document

1. **P0 — Do not position Document as a daily triage default.**  
   Source: S3/S4/S5, H3.2/H3.3.  
   Evidence: below 80% success on operational tasks.  
   Proposed change: rename to `Readout` or reserve for report/export mode.  
   Effort: S. Expected lift: prevents wrong mental model.

2. **P1 — Make category access more explicit if Document stays actionable.**  
   Source: S5.  
   Evidence: 8/25 expected a full category list to be visible, not behind compact navigation.  
   Proposed change: add a visible `Categories` drawer button beside the strip, with active count.  
   Effort: M. Expected lift: +2-3 S5 successes.

3. **P1 — Separate readout mode from action mode.**  
   Source: S3/S6 contrast.  
   Evidence: best stakeholder score, weakest operational flow.  
   Proposed change: keep score/narrative prominent but collapse detailed clause actions behind a `Review clauses` transition if used as a readout.  
   Effort: M/L. Expected lift: stronger product positioning.

Round 5 must-fix: decide whether Option 3 is a readout/export experience or a true comparison workspace. It should not try to be both equally.

## Cross-Cutting Recommendations

1. **P1 — Standardize metric vocabulary.**  
   Use `Open items`, `Met`, `Closed`, `Supplier changes`, `Need review`, `High`, `Medium`, `Low`, `Total clauses` across all three.

2. **P1 — Add a persistent active-filter chip above workflow cards.**  
   Category and quick-filter state should be readable near the card stack in every option.

3. **P1 — Preserve Closed as both a quick filter and a visible section.**  
   This redundancy is useful. It is not dead weight because it supports recovery.

4. **P1 — Keep request-basket card feedback.**  
   The `In request basket` card state solved a major trust issue and should remain part of every option.

5. **P2 — Remove internal prop/API duplication in `ComparisonDesignOptions.tsx`.**  
   This is not a user-facing issue yet, but it will make future visual iteration faster and less fragile.

## Round 4 Refinement Backlog

Top three must-fix items per option:

| Option | Must-fix 1 | Must-fix 2 | Must-fix 3 |
| --- | --- | --- | --- |
| Option 1 · Evolved | Tighten Version Movement hierarchy | Keep persistent category rail | Group metric types more clearly |
| Option 2 · Side-by-side | Rename `Evidence` to `Summary` | Remove instructional subtitle | Show active metric/filter chip above cards |
| Option 3 · Document | Rename/reposition as `Readout` | Improve category access | Decide readout vs action role |

Cross-cutting Round 5 inputs:

1. Extract shared metric grid and standard labels.
2. Reduce score/delta duplication.
3. Keep Closed recovery visible.
4. Keep request basket as the final submission mechanism.
5. Treat Option 3 as a stakeholder readout unless explicitly redesigned for operations.

## Round 4 Conclusion

All three options are usable enough to keep testing, but they now serve clearer product roles:

- **Option 1 · Evolved**: best candidate for the core daily ClauseIQ workflow.
- **Option 2 · Side-by-side**: best evidence-led review candidate, especially for users who need trust and traceability while triaging.
- **Option 3 · Document**: best stakeholder/readout candidate, not the best operational workspace.

The next useful iteration is not another broad redesign. It should be a focused cleanup of copy, metric duplication, active-filter visibility, and Option 3 positioning.
