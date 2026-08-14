# Interview Single-Type Distribution Simplification — Design

Date: 2026-08-14
Scope: Phase 19B-3 Task 7R follow-up on PR #13

## Goal

Make the Build the Briefing Distribution control self-explanatory when only one question type is selected, without changing generation requests, Gemini/provider behavior, API contracts, or multi-type exact-count behavior.

## Current problem

`InterviewQuestionTypeControls` currently offers `Set exact counts` even when exactly one question type is selected. In that state there is nothing meaningful to distribute: the entire Question count must use the only selected type. Opening exact counts therefore adds a redundant number field whose value can only mirror the total Question count.

Example of the current redundant state:

- Question count: 10
- Selected type: Short Answer
- Exact Short Answer count: 10

## Approved behavior

### Exactly one selected question type

When `selected.length === 1`:

- keep the `Distribution` heading;
- do not show `Set exact counts`;
- do not show `Use balanced distribution`;
- do not show exact-count number inputs;
- show one explanatory line derived from the current Question count and selected type.

Example:

`All 10 questions will be Short Answer.`

Use grammatically correct singular copy when Question count is 1:

`All 1 question will be Short Answer.`

The selected type label must come from the existing canonical `QUESTION_TYPE_LABELS` mapping.

### Two or more selected question types

When `selected.length >= 2`, preserve the existing Distribution workflow:

- default: `Balanced automatically` + `Set exact counts`;
- exact mode: selected type count inputs + `Use balanced distribution`;
- exact counts must still total the top-level Question count;
- existing count validation and selected-order behavior remain unchanged.

### Transition from exact counts to one selected type

If the user is in exact-count mode with multiple selected types and deselects until only one type remains:

- close exact-count mode immediately;
- call `onExplicitCountsChange(undefined)` so the parent request state returns to the normal implicit distribution contract;
- show the single-type explanatory message;
- do not leave a hidden/stale exact-count object active in the generation request.

This behavior applies only to a user-driven type toggle inside `InterviewQuestionTypeControls`; no broader state-management refactor is required.

## Explicitly preserved

- at least one question type must remain selected;
- six canonical modern question types;
- selected type order;
- balanced distribution for 2+ selected types;
- exact-count mode for 2+ selected types;
- exact-count validation;
- Question count semantics;
- category handling;
- generation request UUID/idempotency behavior;
- Gemini Direct provider behavior;
- manual question creation;
- typed Interview question/attempt contracts.

## Implementation boundary

Expected files:

- `frontend/src/features/interviews/InterviewQuestionTypeControls.tsx`
- `frontend/src/features/interviews/InterviewQuestionTypeControls.test.tsx`

CSS changes are not required unless the existing Distribution layout needs a tiny spacing adjustment after implementation.

## Out of scope

- backend changes;
- API/schema changes;
- changing the meaning of Question count;
- changing balanced distribution calculations for multiple types;
- changing exact-count calculations for multiple types;
- redesigning Add manually;
- Gemini/provider changes;
- deployment;
- `main` branch changes;
- Task 8 closeout.

## Verification

Before accepting this refinement:

1. focused Question Type control tests pass;
2. single-type state shows the dynamic `All N question(s) will be TYPE.` message;
3. single-type state has no exact-count buttons or spinbuttons;
4. selecting a second type restores `Balanced automatically` and `Set exact counts`;
5. exact mode still works for 2+ selected types;
6. reducing exact mode to one selected type clears explicit counts and returns to the single-type message;
7. typed Interview workspace generation regression passes;
8. frontend typecheck passes;
9. full frontend regression passes;
10. production build passes;
11. `git diff --check` is clean;
12. working tree is clean;
13. browser QA confirms the single-type Distribution area is clear and non-redundant.
