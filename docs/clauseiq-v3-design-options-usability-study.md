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

