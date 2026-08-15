# Record Deletion UI Refinement Implementation Plan

> **Execution discipline:** implement task-by-task with tests and bounded verification. Keep changes surgical and do not widen scope when a focused fix is sufficient.

**Date:** 2026-08-15
**Status:** Written UI refinement specification and implementation plan approved; GitHub-connector execution authorized
**Task branch:** `task/record-deletion-destructive-actions`
**Parent PR:** `#18 — Record deletion and destructive actions`
**Approved spec:** `docs/superpowers/specs/2026-08-15-record-deletion-ui-refinement-design.md`

## 1. Goal

Refine the already-working Resume, Interview, and Learning deletion interfaces so destructive actions remain discoverable but no longer compete visually with `Open Resume`, `Open session`, and `Open workspace`.

The implementation replaces persistent red card-level delete buttons with one small accessible `⋯` More actions pattern, preserves every existing deletion behavior, and gives the three confirmation dialogs a consistent destructive-action hierarchy.

## 2. Controlling constraints

Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.

Apply the project's surgical implementation discipline throughout:

- state assumptions before changing code;
- prefer the simplest solution that satisfies the approved behavior;
- preserve existing architecture and style;
- add/update focused tests for changed behavior;
- define and verify observable success criteria;
- do not perform unrelated cleanup or refactoring.

This plan authorizes **frontend UI refinement only**. It does not authorize changes to backend routes/services/models, deletion cascades, job fencing, database behavior, packages, lockfiles, auth, AI providers, environment files, deployment, migrations, Phase 19C, merge state, or branch deletion.

## 3. Execution workflow

This task follows the project's ChatGPT + GitHub connector workflow:

1. ChatGPT plans and reviews the bounded change in this conversation.
2. After explicit user approval, ChatGPT uses the GitHub connector to implement directly on `task/record-deletion-destructive-actions` / PR #18.
3. The GitHub branch is the committed remote implementation state produced by the connector.
4. ChatGPT does not claim local test execution because it has no local repository terminal in this workflow.
5. After the connector changes are complete, the user pulls the task branch to the local Career Learning Hub repository.
6. The user runs the exact focused/full verification commands supplied by ChatGPT and reports the complete output.
7. ChatGPT diagnoses any failures and repairs the same PR through the GitHub connector.
8. Browser QA is performed locally by the user after automated verification is green.
9. Merge, deployment, and branch deletion remain separate explicit approval gates.

**Codex is not used for this task.**

## 4. Verified current code shape

### Resume

`ResumeListPage.tsx` currently renders `ResumeDeleteDialog` beside `Open Resume` in the footer. `ResumeDeleteDialog` owns dialog state, exact-title confirmation, API request, busy state, backend error/request-ID display, success callback, and focus return.

Confirmation must remain:

```ts
confirmation === resume.title
```

### Interview

`InterviewSessionCard.tsx` currently renders archived `Restore session`, `Open session`, and `InterviewDeleteDialog` in the card actions. `InterviewDeleteDialog` owns confirmation/API/busy/error/focus behavior.

`InterviewSessionListPage.tsx` is the collection owner and is the minimal place to coordinate which Interview overflow panel is open.

Confirmation remains exact case-sensitive equality with `session.title`.

### Learning

`LearningDashboard.tsx` currently renders `Open workspace` followed by `LearningDocumentDeletion` for non-`deleting` documents.

`LearningDocumentDeletion.tsx` already owns the asynchronous deletion state machine: confirmation, acceptance, polling/reconciliation, retry, cancellation, failure reporting, `Deleting` state, final absence detection, and navigation. None of that behavior may move into the card or shared overflow component.

Confirmation must remain:

```ts
confirmation.trim() === document.title
```

## 5. Final file boundary

### Create

- `frontend/src/components/CardOverflowActions.tsx`
- `frontend/src/components/CardOverflowActions.test.tsx`

### Resume — bounded modifications

- `frontend/src/features/resumes/ResumeListPage.tsx`
- `frontend/src/features/resumes/ResumeDeleteDialog.tsx`
- `frontend/src/features/resumes/ResumeDeleteDialog.test.tsx`
- `frontend/src/features/resumes/ResumeListDeletion.test.tsx`
- `frontend/src/features/resumes/resumeDeletion.css`
- `frontend/src/features/resumes/resumeWorkspace.css` only if required for bounded alignment

### Interview — bounded modifications

- `frontend/src/features/interviews/InterviewSessionListPage.tsx`
- `frontend/src/features/interviews/InterviewSessionCard.tsx`
- `frontend/src/features/interviews/InterviewDeleteDialog.tsx`
- `frontend/src/features/interviews/InterviewDeleteDialog.test.tsx`
- `frontend/src/features/interviews/InterviewSessionListDeletion.test.tsx`
- `frontend/src/features/interviews/interviewCoach.css`
- `frontend/src/features/interviews/interviewDeletion.css`

### Learning — bounded modifications

- `frontend/src/features/learning/LearningDashboard.tsx`
- `frontend/src/features/learning/LearningDocumentDeletion.tsx`
- `frontend/src/features/learning/LearningDocumentDeletion.test.tsx`
- `frontend/src/features/learning/LearningDocumentDeletionLibrary.test.tsx`
- `frontend/src/features/learning/LearningDashboardDeletion.test.tsx`
- `frontend/src/features/learning/learningWorkspace.css`

No backend, package, lockfile, env, auth, migration, provider, deployment, or unrelated feature file is authorized.

## 6. Shared CardOverflowActions

Create one small controlled component with:

- record-specific accessible trigger label;
- visible `⋯` trigger;
- `aria-expanded` / `aria-haspopup`;
- ordinary native action buttons (no `role="menu"` / `role="menuitem"`);
- Escape dismissal;
- outside-click dismissal;
- focus return to trigger on Escape/dismissal;
- action selection closes the panel before invoking the action;
- optional destructive and separator presentation;
- no feature-specific business logic.

Collection parents coordinate one open panel at a time.

## 7. Resume refinement

- Move deletion from the persistent footer into a top-right More actions control in the card heading.
- Keep `Open Resume` visibly primary.
- Keep exact case-sensitive confirmation unchanged.
- Preserve API, busy, error, request-ID, refresh, and focus behavior.
- Refine dialog hierarchy to `Permanent action`, `Delete “<title>”?`, concise consequences, a clear `This action cannot be undone.` warning, exact-title guidance, Cancel, and `Delete permanently`.

## 8. Interview refinement

- Keep `Open session` visibly primary.
- Move permanent deletion into the top-right More actions control.
- For archived sessions, move `Restore session` into the same overflow above a separator and the destructive delete action.
- Keep Restore non-destructive and preserve existing lifecycle behavior.
- Coordinate one open overflow through `InterviewSessionListPage.tsx`.
- Keep exact case-sensitive title confirmation and ensure copy never implies the source Resume is deleted.

## 9. Learning refinement

- Keep `Open workspace` visibly primary.
- Move deletion into the top-right More actions control.
- Coordinate one open Learning overflow at dashboard level.
- Preserve the existing asynchronous deletion state machine unchanged.
- Preserve `confirmation.trim() === document.title` exactly.
- When status is `deleting`, do not expose a second delete trigger.

## 10. Styling and accessibility

- Reuse existing CSS/tokens; no new dependency or design system.
- More actions trigger is neutral/subtle.
- Destructive red appears inside the overflow/dialog rather than as a permanent card button.
- No horizontal overflow on narrow layouts.
- Native keyboard/Tab behavior remains usable.
- Escape and outside dismissal work.
- Focus returns appropriately.
- Dialog labelling remains accessible.

## 11. Tests to add/update

Required focused coverage:

- shared overflow trigger, expanded state, Escape, outside dismissal, action selection, focus return;
- Resume has no persistent Delete button before opening More actions; exact-title confirmation and canonical refresh remain covered; only one Resume overflow open;
- Interview has no persistent permanent-delete button; archived overflow exposes Restore + separator + Delete; exact confirmation/refresh remain covered; only one Interview overflow open;
- Learning has no persistent Delete document button; overflow launches existing deletion flow; `deleting` suppresses duplicate deletion; only one Learning overflow open;
- existing deletion API/error/busy tests continue passing.

Because the GitHub connector cannot execute the user's local test suite, these tests are written/updated in the branch but the user performs the verification run after pulling.

## 12. Required local verification after connector implementation

The user will pull the branch and run:

- focused Resume/Interview/Learning deletion UI tests plus `CardOverflowActions.test.tsx`;
- frontend typecheck;
- full frontend test suite;
- frontend production build;
- `git diff --check origin/main...HEAD`;
- final clean-tree/status check.

If any command fails, the user pastes the complete output and ChatGPT repairs the same PR through the GitHub connector.

## 13. Human browser QA

After automated verification is green, verify desktop/tablet/mobile behavior for:

- primary Open actions;
- neutral top-right More actions controls;
- only one overflow open per collection;
- outside click and Escape dismissal;
- Resume deletion dialog;
- Interview active/completed/archived action hierarchy and Restore behavior;
- Learning deletion and existing `Deleting` state;
- keyboard/focus behavior;
- no horizontal overflow or card-action collision.

## 14. Explicit non-goals

Do not add Trash/recycle bin, undo, retention, bulk deletion, generic command infrastructure, new backend endpoints/workers, animation framework, unrelated card redesign, Phase 19C, deployment, merge, or branch deletion.

## 15. Approval state

UI refinement design: approved.

UI refinement written spec: approved.

UI refinement plan: approved.

GitHub-connector implementation: authorized.

Merge: not authorized.

Deployment: not authorized.

Branch deletion: not authorized.
