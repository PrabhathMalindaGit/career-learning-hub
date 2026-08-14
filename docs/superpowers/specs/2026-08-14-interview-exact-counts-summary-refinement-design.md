# Interview Exact-Counts Summary Refinement — Design

Date: 2026-08-14
Scope: Phase 19B-3 Task 7R follow-up on PR #13

## Goal

Remove the redundant valid exact-count summary line from Build the Briefing and integrate the exact-count total into the Distribution subtitle without changing generation behavior or validation semantics.

## Current problem

When exact-count mode is active and the selected counts correctly total the top-level Question count, the UI currently shows both:

- `Distribution` → `Exact counts`
- a separate line such as `Exact counts total 5.`

This duplicates the same information and makes the Distribution area look visually fragmented.

## Approved presentation

### Valid exact-count state

When exact-count mode is active and the selected counts total the top-level Question count, render:

- heading: `Distribution`
- subtitle: `Exact counts · 5 total`
- action: `Use balanced distribution`

Do not render the separate valid summary line `Exact counts total 5.` below the inputs.

The total in the Distribution subtitle must be derived from the current exact-count values, not hard-coded.

### Invalid exact-count state

When the exact-count values do not total the top-level Question count:

- keep the heading `Distribution`;
- show a concise state subtitle such as `Exact counts · 4 of 5` where the first number is the current exact total and the second is the required Question count;
- preserve the existing validation error below the inputs so the problem remains explicit and accessible;
- preserve the existing alert semantics for the invalid state.

### Balanced and single-type states

Do not change the already-approved behavior:

- one selected type: `All N question(s) will be TYPE.` with no exact-count controls;
- two or more selected types in balanced mode: `Balanced automatically` + `Set exact counts`;
- exact-count inputs remain available only for two or more selected types.

## Explicitly preserved

- selected question types and ordering;
- exact-count values and validation;
- requirement that exact counts equal Question count;
- `Use balanced distribution` behavior;
- stale exact-count clearing when selection returns to one type;
- generation request body and `typeCounts` semantics;
- Gemini/provider behavior;
- API contracts;
- backend behavior;
- manual question creation.

## Implementation boundary

Expected files:

- `frontend/src/features/interviews/InterviewQuestionTypeControls.tsx`
- `frontend/src/features/interviews/InterviewQuestionTypeControls.test.tsx`

CSS changes are not expected unless a tiny spacing adjustment is required.

## Verification

Before accepting this refinement:

1. focused Question Type control tests pass;
2. valid exact mode shows `Exact counts · N total` in Distribution;
3. valid exact mode no longer renders the separate `Exact counts total N.` line;
4. invalid exact mode shows `Exact counts · X of N` and retains the existing validation error;
5. balanced and single-type Distribution states remain unchanged;
6. typed generation regression passes;
7. frontend typecheck passes;
8. full frontend regression passes;
9. production build passes;
10. `git diff --check` is clean;
11. working tree is clean;
12. browser QA confirms the Distribution row reads clearly without duplicate summary text.
