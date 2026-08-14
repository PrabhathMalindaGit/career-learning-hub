# Phase 19B-3 Task 7R Addendum — Interview Generation Status Refinement

## Objective

Refine the visible Question Generation status in the Interview Coach so Gemini generation feels visually integrated with the Career Learning Hub design instead of appearing as a large purple subsystem panel.

This is a presentation-only Task 7R refinement. It must not alter generation requests, polling, cancellation, retry behavior, progress semantics, duplicate suppression, stale-operation guards, Gemini routing, backend jobs, API contracts, persistence, or security behavior.

Controlling constraint:

> Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.

## Approved problem

Human browser QA confirmed that Question Generation works correctly, including `Contacting Gemini`, progress, cancellation, and completion. However:

1. the current full-width purple status panel is visually disconnected from the green Career Learning Hub design;
2. the processing state occupies more visual weight than necessary;
3. the completed state retains the same large progress-panel treatment after work has finished;
4. the completed progress bar and `Completed` label consume vertical space without adding useful information.

## Approved design — Option A

### Processing state

While a generation job is queued or processing, render a compact inline status strip using neutral/green Career Learning Hub styling.

The strip should communicate:

- `Question generation` as the operation label;
- the current human-readable generation message such as `Contacting Gemini`;
- the current job state such as `Processing` when useful;
- a restrained progress indicator when progress data is available;
- the existing `Cancel` action while cancellation is valid.

The strip must remain accessible and readable without relying on color alone.

### Completed state

When generation completes successfully, replace the processing presentation with a compact green success confirmation:

`✓ Questions generated successfully`

The completed state must:

- not retain the large purple processing panel;
- not retain a completed progress meter;
- not repeat a separate `Completed` heading/status when the success message already communicates completion;
- use substantially less vertical space than the processing state;
- keep generated questions immediately visible below the status area.

### Failed / cancelled / retry states

Do not redesign the job resilience behavior. Existing failure, cancellation, retry, and paused-job controls remain functionally identical.

Presentation may inherit the compact status treatment where possible, but this addendum must not remove or weaken any existing actionable error/retry information.

## Behavioral invariants

The refinement must preserve:

- the same Gemini generation request payload;
- the same job polling cadence and status adoption;
- the same progress data and semantics;
- the same Cancel behavior;
- the same Retry behavior;
- the same duplicate-generation suppression;
- the same UUID/idempotency behavior;
- the same stale-route and stale-operation guards;
- the same generated-question refresh/adoption behavior;
- the same provider error handling and safe request-ID presentation;
- no backend, API, Gemini provider, database, auth, or ownership changes.

## Expected file scope

Prefer the smallest existing presentation surface. Expected production scope is limited to the existing Interview generation job status markup/component usage and Interview CSS. Do not introduce a new dependency or new state machine.

Likely files:

- `frontend/src/features/interviews/InterviewSessionWorkspace.tsx` only if a small state-specific class/markup distinction is necessary;
- `frontend/src/features/interviews/interviewCoach.css` and/or existing job-status CSS;
- existing focused Interview workspace tests for generation status presentation.

If the existing shared job-status component can be styled safely without affecting unrelated Resume/Learning job UIs, reuse it. Otherwise keep the refinement scoped to Interview Coach selectors so other product areas do not change.

## Verification

Before Task 7R merge approval:

1. existing generation/polling/cancel/retry tests remain green;
2. add or update a focused presentation test proving processing and completed generation states remain distinguishable and accessible;
3. frontend typecheck passes;
4. full frontend regression passes;
5. frontend production build passes;
6. `git diff --check` is clean;
7. human browser QA confirms:
   - processing appears as a compact neutral/green strip;
   - `Contacting Gemini` remains visible while relevant;
   - Cancel remains visible and usable while processing;
   - successful completion becomes a compact green `Questions generated successfully` confirmation;
   - no large purple completed progress panel remains;
   - generated questions remain immediately readable below.

## Merge and release control

- This addendum belongs to the existing Task 7R branch and draft PR #13.
- Do not merge PR #13 until all Task 7R verification remains green and the user explicitly approves the Task 7R merge.
- Do not deploy, merge to `main`, delete the task branch, or begin Task 8 automatically.
