# Phase 19B-3 Task 7R — Interview Workspace Layout Refinement

## Objective

Refine the Interview Coach workspace before Task 8 human/browser acceptance so the typed-question UX is visually balanced and easier to scan, without changing any backend, API, persistence, Gemini, job, ownership, security, or typed-question behavior completed in Tasks 1–7.

Controlling constraint:

> Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.

## Approved UX problems

1. The desktop `Question index | Practice desk | Saved attempts` three-column layout makes Question Index too tall, Practice Desk too narrow, and Saved Attempts too cramped.
2. Question Index grows the page excessively when many questions exist.
3. The Question Type selector uses pill-shaped controls that do not handle long labels such as `Technical Explanation` cleanly.
4. `Set counts` is visually disconnected from the type-selection controls.

## Approved design

### Workspace hierarchy

Desktop/tablet use a two-column workspace:

- Left: Question Index.
- Right: a main work column containing Practice Desk first and Saved Attempts below it.

Mobile stacks the three sections in this order:

1. Question Index
2. Practice Desk
3. Saved Attempts

No question, attempt, feedback, explanation, pinning, notes, paging, or selection behavior changes.

### Question Index

- Keep heading, filters, list, and pagination.
- Make the question list itself vertically scrollable at desktop/tablet heights so the page does not become extremely tall.
- Keep filters and pagination outside the scrolling list.
- Reduce question-card vertical density while preserving visible type, category, difficulty, question preview, selected state, and pinned state.
- The full question remains visible in Practice Desk.

### Practice Desk

- Make Practice Desk the dominant work surface in the right column.
- Preserve all current typed-answer controls and question-detail behavior.
- Do not modify answer submission, MCQ scoring, explanation locking, feedback, notes, pinning, stale-selection, or provider-job logic.

### Saved Attempts

- Move Saved Attempts below Practice Desk in the right work column.
- Use the increased width to improve readability of attempt metadata, selected attempt details, MCQ results, and feedback.
- Existing attempt selection, pagination, filters, immutability, and feedback behavior remain unchanged.

### Question Type selector

Replace pill/capsule choices with rectangular selection tiles:

- 3 columns on wide desktop.
- 2 columns on intermediate widths.
- 1 column on small/mobile widths.
- Use native checkboxes.
- Selected state keeps the existing Career Learning Hub green visual language.
- Long labels wrap naturally inside the tile.

### Distribution controls

- Keep balanced distribution as the default.
- Keep the same exact-count validation and data flow.
- Present the `Set counts` / `Use balanced distribution` action as a clear distribution subsection immediately beneath the type tiles.
- When exact counts are open, keep the existing count inputs and total validation; only presentation changes.

## File scope

Expected production files:

- `frontend/src/features/interviews/InterviewSessionWorkspace.tsx`
- `frontend/src/features/interviews/InterviewQuestionTypeControls.tsx`
- `frontend/src/features/interviews/interviewCoach.css`
- `frontend/src/features/interviews/interviewQuestionTypes.css`

Expected tests:

- `frontend/src/features/interviews/InterviewSessionWorkspace.test.tsx`
- `frontend/src/features/interviews/InterviewSessionWorkspace.questionTypes.test.tsx`
- `frontend/src/features/interviews/InterviewQuestionTypeControls.test.tsx`
- `frontend/src/features/interviews/InterviewSessionWorkspace.savedAttempts.test.tsx` only if DOM grouping requires an assertion update.

## Explicitly out of scope

- `backend/**`
- Interview API/runtime contracts
- database models or migrations
- Gemini prompts, routing, workers, model choice, retries, or credentials
- auth/ownership logic
- deployment
- `main`
- new dependencies
- new Interview features

## Behavioral invariants

Task 7R must preserve:

- all six modern question types;
- historical `Open response` compatibility;
- balanced and exact generation distribution;
- manual MCQ authoring;
- typed attempt submission;
- deterministic backend MCQ scoring;
- MCQ answer-key secrecy before submission;
- post-submit MCQ result/correct-answer presentation;
- no MCQ AI-feedback action;
- MCQ explanation lock until an owned attempt exists;
- notes and pin/unpin;
- filters and pagination;
- Saved Attempts immutability;
- polling, cancel/retry, UUID/idempotency, stale-route and stale-selection guards.

## Verification

Before merge:

1. Focused Question Type control tests pass.
2. Focused Interview workspace / Saved Attempts tests pass.
3. Frontend typecheck passes.
4. Full frontend regression passes.
5. Frontend production build passes.
6. `git diff --check` is clean.
7. Working tree is clean.
8. Human browser QA confirms desktop, intermediate/tablet, and mobile layouts have no horizontal overflow, the Practice Desk is visually dominant, Question Index is bounded/scrollable, Saved Attempts is readable, and all six type tiles fit cleanly.

## Merge and release control

- Base branch: `phase-19b-interview-coach-refinements`
- Task branch: `task/phase-19b3-task7r-interview-layout-refinement`
- No merge without explicit Task 7R merge approval after green verification and final review.
- Do not deploy, merge to `main`, delete the task branch, or begin Task 8 automatically.
