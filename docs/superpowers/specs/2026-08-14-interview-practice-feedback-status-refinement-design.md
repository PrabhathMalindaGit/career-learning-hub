# Interview Practice Feedback Status Refinement — Design

Date: 2026-08-14
Scope: Phase 19B-3 Task 7R follow-up on PR #13

## Goal

Make the Interview Coach Practice Feedback job status visually consistent with the already-refined Question Generation and Question Explanation flows, without changing feedback generation, polling, persistence, scoring, ownership, or Gemini/provider behavior.

## Current problem

The feedback job type is `interview.attempt.feedback`. Its queued/processing/completed states still use the older large purple generic job panel, while Question Generation and Question Explanation now use compact Career Learning Hub green/neutral status strips.

The workspace also emits the standalone success message `Practice feedback is ready.` after a completed feedback job. If the compact job strip also reports completion, showing both produces duplicate success feedback.

## Approved design

### Queued / processing

Render Practice Feedback with the same compact green/neutral treatment already used for the other approved Interview AI job flows:

- title: `Practice feedback`
- current phase text such as `Contacting Gemini`
- restrained progress indicator
- current job-state badge such as `Processing`
- existing Cancel control when cancellation is valid
- existing Retry control when retry is valid

Do not change job progress semantics, polling cadence, cancellation eligibility, retry eligibility, or backend state.

### Completed

A completed `interview.attempt.feedback` job renders one compact green success strip:

`✓ Practice feedback ready`

The old large purple completed panel and completed progress meter must not remain visible.

### Duplicate success-message suppression

While the completed feedback job strip is present, suppress the redundant visible standalone message:

`Practice feedback is ready.`

This suppression is presentational only. Existing workspace status state, ARIA behavior, attempt refresh behavior, and feedback data adoption must remain unchanged.

### Feedback content

Do not redesign or alter the feedback result itself. The existing Saved Attempt / feedback presentation remains authoritative, including:

- score
- summary
- strengths
- improvements
- suggested answer outline
- completion timestamp
- practice-guidance disclaimer

## Implementation boundary

Prefer the same low-risk pattern already used for Question Generation and Question Explanation:

1. Add the feedback-specific completed success copy to `JobResilienceActions`.
2. Reuse the safe `data-job-type` / `data-job-status` presentation hooks already exposed by the shared job component.
3. Extend only the Interview-scoped status stylesheet so `interview.attempt.feedback` receives the compact queued/processing/completed treatment.
4. Suppress the redundant standalone feedback-success line through Interview-scoped presentation logic when the completed feedback strip is present, avoiding a rewrite of the large workspace state machine if possible.

## Explicitly preserved

- `interview.attempt.feedback` API contract
- feedback request flow
- polling and timeout behavior
- Cancel / Retry behavior
- attempt ownership and question binding
- stale-attempt / stale-selection guards
- Saved Attempts immutability
- feedback score and guidance payload
- Gemini Direct provider behavior
- backend workers and persistence
- existing safe request-ID/error presentation

## Explicitly out of scope

- backend changes
- API/schema changes
- feedback scoring changes
- feedback prompt changes
- redesign of the feedback result card
- changes to Question Generation or Question Explanation semantics
- changes to Resume or Learning job UI
- deployment
- `main` branch changes
- Task 8 closeout

## Verification

Before accepting this refinement:

1. RED test proves completed `interview.attempt.feedback` currently announces generic `Completed` rather than `✓ Practice feedback ready`.
2. GREEN shared job-status tests pass.
3. Existing queued-feedback polling regression passes and still reloads the bound canonical attempt.
4. Existing test that clears completed feedback messaging when another attempt is selected still passes.
5. Frontend typecheck passes.
6. Full frontend regression passes.
7. Production build passes.
8. `git diff --check` is clean.
9. Working tree is clean.
10. Browser QA confirms:
   - compact green/neutral processing strip;
   - compact `✓ Practice feedback ready` completion strip;
   - no large purple completed panel;
   - no duplicate standalone `Practice feedback is ready.` line;
   - feedback result content still renders unchanged.
