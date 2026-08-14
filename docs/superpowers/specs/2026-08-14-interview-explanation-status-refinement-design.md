# Phase 19B-3 Task 7R Addendum — Question Explanation Status Refinement

## Objective

Make the Question Explanation Gemini job presentation visually consistent with the already-approved Question Generation status treatment, without changing explanation requests, polling, cancellation, retry, provider behavior, persistence, or generated explanation content.

Controlling constraint:

> Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.

## Confirmed current behavior

Interview jobs use the existing job type `interview.question.explain`. The shared resilience UI now exposes safe `data-job-type` and `data-job-status` hooks. Human browser QA confirmed that explanation jobs still use the legacy purple processing/completed presentation while question generation already uses the compact green/neutral treatment.

The workspace also currently sets the standalone successful explanation message `Explanation is ready.` after an explanation job completes. Keeping both that message and a new compact `✓ Explanation ready` completion strip would duplicate the same success state.

## Approved design

For `interview.question.explain` only:

### Queued / processing

Render the existing job lifecycle as the same compact green/neutral status strip used by Question Generation:

- heading: `Question explanation`;
- existing safe phase copy such as `Contacting Gemini`;
- restrained progress indicator;
- `Processing` status badge when applicable;
- existing Cancel control while cancellation is valid;
- existing Retry control when retry is valid.

No polling, cancellation, retry, progress, or provider logic changes.

### Completed

Replace the large purple completed panel with one compact green success confirmation:

`✓ Explanation ready`

The successful explanation flow must expose only one visible completion signal. Suppress the redundant standalone `Explanation is ready.` success copy when the completed explanation job strip already communicates success.

The generated Model answer / Explanation content remains rendered exactly as before.

## Explicitly not included

- explanation prompt changes;
- Gemini/provider changes;
- backend changes;
- API contract changes;
- polling cadence changes;
- cancellation/retry semantics changes;
- explanation content/layout redesign;
- feedback-job status redesign;
- Question Generation behavior changes;
- Task 8 closeout.

## Behavioral invariants

The refinement must preserve:

- job type `interview.question.explain`;
- one request per explicit explanation action under the existing guards;
- existing poll/adoption behavior;
- existing abort and stale-question protection;
- existing Cancel/Retry eligibility;
- canonical question reload after completion;
- existing model answer and explanation rendering;
- no duplicate completion announcement in normal visible UI.

## Expected file scope

Prefer the smallest implementation using existing hooks:

- `frontend/src/features/interviews/interviewGenerationStatus.css` — extend Interview-scoped compact job styling to `interview.question.explain`;
- `frontend/src/features/jobs/JobResilienceActions.tsx` — provide the explanation-specific completed success label while preserving all other job labels;
- `frontend/src/features/jobs/JobResilienceActions.test.tsx` — focused completed explanation semantics;
- `frontend/src/features/interviews/InterviewSessionWorkspace.tsx` / its tests only if needed to suppress the redundant successful `Explanation is ready.` visible message without changing other status messages.

Do not touch backend/provider files.

## Verification

Before Task 7R merge approval:

1. RED test proves explanation completed state still lacks the approved success semantics;
2. GREEN focused job-resilience tests pass;
3. explanation polling/workspace regression remains green;
4. frontend typecheck passes;
5. full frontend regression passes;
6. production build passes;
7. `git diff --check` is clean;
8. human browser QA confirms:
   - processing uses the compact green/neutral strip;
   - completed state shows `✓ Explanation ready`;
   - no large purple completed progress panel remains;
   - no duplicate visible `Explanation is ready.` success message remains;
   - Model answer / Explanation content still appears correctly.

## Merge and release control

- This addendum belongs to existing Task 7R branch `task/phase-19b3-task7r-interview-layout-refinement` and draft PR #13.
- Do not merge PR #13 without explicit Task 7R merge approval after all verification is green.
- Do not deploy, merge to `main`, delete the task branch, or begin Task 8 automatically.
