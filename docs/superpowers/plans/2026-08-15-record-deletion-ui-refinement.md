# Record Deletion UI Refinement Implementation Plan

> **For Codex:** REQUIRED execution discipline: use test-driven development, execute this plan task-by-task, keep changes surgical, and stop at every explicit approval boundary. Do not widen scope when a focused fix is sufficient.

**Date:** 2026-08-15
**Status:** Written UI refinement specification approved; implementation plan created and self-reviewed; awaiting user Codex-execution approval
**Task branch:** `task/record-deletion-destructive-actions`
**Parent PR:** `#18 — Record deletion and destructive actions`
**Approved spec:** `docs/superpowers/specs/2026-08-15-record-deletion-ui-refinement-design.md`

## 1. Goal

Refine the already-working Resume, Interview, and Learning deletion interfaces so destructive actions remain discoverable but no longer compete visually with `Open Resume`, `Open session`, and `Open workspace`.

The implementation replaces persistent red card-level delete buttons with one small accessible `⋯` More actions pattern, preserves every existing deletion behavior, and gives the three confirmation dialogs a consistent destructive-action hierarchy.

## 2. Controlling constraints

Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.

Apply the project's Karpathy-style coding discipline throughout:

- state assumptions before changing code;
- prefer the simplest solution that satisfies the approved behavior;
- make surgical changes that preserve existing architecture and style;
- write or update tests before implementation;
- define and verify observable success criteria;
- do not perform unrelated cleanup or refactoring.

This plan authorizes **frontend UI refinement only**. It does not authorize changes to backend routes/services/models, deletion cascades, job fencing, database behavior, packages, lockfiles, auth, AI providers, environment files, deployment, migrations, Phase 19C, merge state, or branch deletion.

## 3. Execution environment and approval model

### Codex settings

- **Model:** GPT-5.6 Sol.
- **Intelligence / reasoning:** High.
- **Plan mode:** use the written plan as the execution contract; do not re-scope it.
- **Browser:** prohibited during RED/GREEN coding loops; limited to post-GREEN visual/runtime verification of the changed UI. If the Codex browser is available, use it for that bounded check. Final human browser QA by the user remains mandatory.
- **Terminal:** Codex runs all Git/test/typecheck/build/git-diff commands itself. The user does not need to manually run terminal commands during implementation.
- **Servers during RED/GREEN:** none. Vitest, typecheck, and build must run without keeping the application development servers running.
- **Servers for bounded browser verification:** use the existing local Career Learning Hub frontend/backend/MongoDB development workflow already used for PR #18. Do not deploy or alter production/staging services.

### Git workflow

Before touching production code, Codex must run:

```bash
git status --short
git branch --show-current
git fetch origin
git rev-parse HEAD
git rev-list --left-right --count HEAD...origin/task/record-deletion-destructive-actions
```

Required preconditions and safe sync behavior:

- branch must be `task/record-deletion-destructive-actions`;
- do not overwrite, reset, stash, or delete unrelated local work;
- if unexpected local modifications exist, stop and report them;
- if the working tree is clean and the local branch is only behind the remote branch, Codex may safely synchronize with:

```bash
git pull --ff-only origin task/record-deletion-destructive-actions
```

- if the branch is diverged, has local commits not on the remote, or cannot fast-forward safely, stop and report instead of rebasing/resetting;
- after safe synchronization, confirm the approved spec and this plan exist locally before implementation.

During implementation:

- do **not** commit;
- do **not** push;
- do **not** merge;
- do **not** rebase;
- do **not** deploy.

After implementation and verification, Codex must leave the tested production changes uncommitted and report the evidence. The next user gate is explicit commit approval.

## 4. Verified current code shape

This plan is written against the current PR #18 branch, not against assumptions.

### Resume

`ResumeListPage.tsx` currently renders `ResumeDeleteDialog` beside `Open Resume` in `.resume-card__actions`. `ResumeDeleteDialog` owns its own dialog-open state, exact-title confirmation, API request, busy state, backend error/request-ID display, success callback, and focus-return ref.

The exact confirmation rule is currently:

```ts
confirmation === resume.title
```

### Interview

`InterviewSessionCard.tsx` currently renders archived `Restore session`, `Open session`, and `InterviewDeleteDialog` together in the footer. `InterviewDeleteDialog` owns its own dialog-open state, exact-title confirmation, API request, busy state, errors, request IDs, and trigger focus.

`InterviewSessionListPage.tsx` is the collection owner and is therefore the correct minimal place to coordinate which Interview overflow panel is open.

The exact confirmation rule must remain case-sensitive equality with `session.title`.

### Learning

`LearningDashboard.tsx` currently renders `Open workspace` followed by `LearningDocumentDeletion` for non-`deleting` documents.

`LearningDocumentDeletion.tsx` already owns the asynchronous deletion state machine: confirmation, acceptance, polling/reconciliation, retry, cancellation, failure reporting, `Deleting` state, final absence detection, and navigation behavior. None of that state-machine behavior may move into the card or shared overflow component.

The exact current Learning confirmation rule is:

```ts
confirmation.trim() === document.title
```

That trimming behavior must remain unchanged.

## 5. Final file boundary

### Create only

- `frontend/src/components/CardOverflowActions.tsx`
- `frontend/src/components/CardOverflowActions.test.tsx`

### Resume — modify only as required

- `frontend/src/features/resumes/ResumeListPage.tsx`
- `frontend/src/features/resumes/ResumeDeleteDialog.tsx`
- `frontend/src/features/resumes/ResumeDeleteDialog.test.tsx`
- `frontend/src/features/resumes/ResumeListDeletion.test.tsx`
- `frontend/src/features/resumes/resumeDeletion.css`
- `frontend/src/features/resumes/resumeWorkspace.css` only for bounded card-heading/action alignment if required

### Interview — modify only as required

- `frontend/src/features/interviews/InterviewSessionListPage.tsx`
- `frontend/src/features/interviews/InterviewSessionCard.tsx`
- `frontend/src/features/interviews/InterviewDeleteDialog.tsx`
- `frontend/src/features/interviews/InterviewDeleteDialog.test.tsx`
- `frontend/src/features/interviews/InterviewSessionListDeletion.test.tsx`
- `frontend/src/features/interviews/interviewCoach.css`
- `frontend/src/features/interviews/interviewDeletion.css`

`InterviewSessionListPage.tsx` is a bounded implementation-detail addition to the initial spec file list because the approved requirement says only one Interview card overflow may be open at once. It is already part of PR #18 and may only receive the minimal open-card-ID coordination state/props needed for this requirement.

### Learning — modify only as required

- `frontend/src/features/learning/LearningDashboard.tsx`
- `frontend/src/features/learning/LearningDocumentDeletion.tsx`
- `frontend/src/features/learning/LearningDocumentDeletion.test.tsx`
- `frontend/src/features/learning/LearningDocumentDeletionLibrary.test.tsx`
- `frontend/src/features/learning/LearningDashboardDeletion.test.tsx`
- `frontend/src/features/learning/learningWorkspace.css`

Do not create a new shared CSS file or introduce a styling dependency. The shared component should expose stable class names and reuse the three existing feature CSS files for the small contextual placement/presentation rules.

---

# Task 0 — Preflight and invariant capture

## 0.1 Confirm repository state

Run the Git commands from Section 3, perform only the allowed fast-forward sync when necessary, and record:

- current branch;
- current HEAD after sync;
- whether working tree is clean or contains expected task-only changes;
- whether the approved spec/plan are present locally.

If the branch is wrong, diverged, or unrelated modifications are present, stop. Do not auto-reset or discard anything.

## 0.2 Capture current focused baseline

Before editing tests, run the existing focused deletion UI tests:

```bash
npm run test -w frontend -- \
  src/features/resumes/ResumeDeleteDialog.test.tsx \
  src/features/resumes/ResumeListDeletion.test.tsx \
  src/features/interviews/InterviewDeleteDialog.test.tsx \
  src/features/interviews/InterviewSessionListDeletion.test.tsx \
  src/features/learning/LearningDocumentDeletion.test.tsx \
  src/features/learning/LearningDocumentDeletionLibrary.test.tsx \
  src/features/learning/LearningDashboardDeletion.test.tsx
```

Expected baseline: PASS before UI-refinement test changes.

If an existing test fails before any edit, stop and report the baseline failure; do not hide it inside this UI task.

---

# Task 1 — Build the shared CardOverflowActions primitive with TDD

## 1.1 RED — write the shared interaction tests first

Create `frontend/src/components/CardOverflowActions.test.tsx`.

The tests must prove the component contract without relying on feature-specific deletion behavior:

1. renders a visible `⋯` trigger with a record-specific accessible name;
2. exposes `aria-expanded="false"` when closed and `true` when open;
3. clicking the trigger requests open state;
4. action buttons are reachable through normal keyboard/Tab semantics; do not assert ARIA menu arrow-key behavior;
5. Escape closes an open panel and returns focus to the trigger;
6. pointer/click outside closes the panel without trapping focus;
7. selecting an action closes the panel before invoking the action callback;
8. the selected action callback receives the trigger button element so deletion dialogs can later return focus to it;
9. a destructive action receives the destructive class treatment;
10. `separatorBefore` renders only a visual/action-group separator and does not add menu semantics.

Use a tiny controlled Harness in the test so the component itself remains controlled.

RED command:

```bash
npm run test -w frontend -- src/components/CardOverflowActions.test.tsx
```

Expected RED: fail because `CardOverflowActions.tsx` does not exist yet.

## 1.2 GREEN — implement the smallest controlled component

Create `frontend/src/components/CardOverflowActions.tsx` with a narrow contract similar to:

```ts
export type CardOverflowAction = {
  id: string;
  label: string;
  destructive?: boolean;
  separatorBefore?: boolean;
  disabled?: boolean;
  onSelect: (trigger: HTMLButtonElement) => void;
};

type CardOverflowActionsProps = {
  ariaLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: readonly CardOverflowAction[];
  className?: string;
};
```

Implementation requirements:

- render a native `<button type="button">⋯</button>` trigger;
- use `aria-haspopup="true"`, `aria-expanded`, and `aria-controls`/`useId` if useful;
- **do not** use `role="menu"` or `role="menuitem"`;
- panel contains ordinary native action buttons;
- keep trigger/root/panel refs locally;
- on Escape: close and return focus to the trigger;
- on outside pointer/click: close without stealing intentional focus from the outside target;
- on action selection: call `onOpenChange(false)` first, then invoke `action.onSelect(triggerRef.current)`;
- no global singleton/store/event bus;
- no animation framework;
- no dependency additions.

The component does not own which card is open. Collection parents own that state.

## 1.3 GREEN verification

```bash
npm run test -w frontend -- src/components/CardOverflowActions.test.tsx
```

Expected: PASS.

Checkpoint: inspect the component and test diff. If the component starts accumulating feature-specific Resume/Interview/Learning logic, simplify before continuing.

---

# Task 2 — Resume card + Resume deletion dialog refinement

## 2.1 RED — update Resume tests first

Update `ResumeListDeletion.test.tsx` so it proves:

1. `Open Resume` remains visible immediately;
2. `Delete resume` is **not** visible before opening More actions;
3. the record-specific `More actions for <resume title>` trigger is present;
4. opening it exposes `Delete resume`;
5. selecting `Delete resume` closes the overflow and opens the existing confirmation flow;
6. successful deletion still removes the card and refreshes the canonical list exactly as before;
7. with two Resume cards, opening the second More actions closes the first.

Update `ResumeDeleteDialog.test.tsx` to preserve dialog-level behavior while accounting for the new trigger boundary:

- exact case-sensitive title matching remains required;
- lowercase/case-mismatched title remains disabled;
- duplicate submission remains blocked;
- backend `409` and request ID remain visible;
- success behavior remains unchanged;
- updated dialog hierarchy/copy is asserted only where meaningful, not through brittle full snapshots.

Use a small Harness if needed so dialog behavior can be tested without reconstructing the full Resume list.

RED command:

```bash
npm run test -w frontend -- \
  src/features/resumes/ResumeDeleteDialog.test.tsx \
  src/features/resumes/ResumeListDeletion.test.tsx
```

Expected RED: failures because the current Resume card still renders a persistent red delete trigger.

## 2.2 GREEN — coordinate one open Resume overflow

In `ResumeListPage.tsx`:

- add one local state value such as `openActionsResumeId: string | null`;
- render each `ResumeDeleteDialog` in the **top-right of `.resume-card__heading`**, not beside `Open Resume` in the footer;
- pass controlled overflow state based on Resume ID;
- preserve `handleResumeDeleted` unchanged except for clearing the open-overflow ID if needed;
- keep `Open Resume` in the footer as the primary action.

No new collection abstraction is needed.

## 2.3 GREEN — adapt ResumeDeleteDialog without moving deletion logic

In `ResumeDeleteDialog.tsx`:

- add only the controlled overflow props needed from `ResumeListPage`;
- render `CardOverflowActions` with exactly one destructive action, `Delete resume`;
- when that action is selected, save the returned overflow trigger element into the existing return-focus ref, then open the dialog;
- keep `confirmation === resume.title` unchanged;
- keep API/busy/error/request-ID/onDeleted logic unchanged;
- on dialog close/success, preserve focus-return behavior to the More actions trigger when it still exists.

Refine the dialog markup to the approved hierarchy:

- small warning mark/badge; no icon package;
- `Permanent action` eyebrow;
- title `Delete “<resume title>”?`;
- concise consequence copy;
- highlighted `This action cannot be undone.` warning;
- exact-title guidance showing the stored title;
- input;
- Cancel + `Delete permanently`.

Do not weaken or broaden the listed deletion consequences.

## 2.4 GREEN — Resume CSS

In `resumeDeletion.css` and, only if needed, bounded rules in `resumeWorkspace.css`:

- style the More actions trigger as neutral/subtle;
- position it within the heading without overlaying the preview;
- scope shared component descendant styles under Resume-specific wrappers so other feature CSS cannot override them accidentally;
- style the overflow panel/action using existing colors/tokens;
- keep destructive red inside the action panel/dialog only;
- ensure mobile/narrow layouts do not overflow;
- refine warning/dialog spacing consistently without redesigning the card.

Do not add a new palette or shared stylesheet.

## 2.5 Focused GREEN verification

```bash
npm run test -w frontend -- \
  src/components/CardOverflowActions.test.tsx \
  src/features/resumes/ResumeDeleteDialog.test.tsx \
  src/features/resumes/ResumeListDeletion.test.tsx
```

Expected: PASS.

---

# Task 3 — Interview card, Restore, and permanent Delete refinement

## 3.1 RED — update Interview tests first

Update `InterviewSessionListDeletion.test.tsx` to prove:

1. active/completed cards show `Open session` immediately but not persistent `Delete permanently`;
2. `More actions for <session title>` exposes `Delete permanently`;
3. archived cards do not show persistent `Restore session` or `Delete permanently` before opening the overflow;
4. archived overflow contains `Restore session`, then a separator, then `Delete permanently`;
5. Restore still calls the existing status update and refresh/navigation behavior;
6. permanent Delete still removes only the Interview session card and refreshes canonical state;
7. with two Interview cards, opening one overflow closes the other.

Update `InterviewDeleteDialog.test.tsx` to keep direct dialog behavior focused:

- exact case-sensitive title equality;
- mismatch stays disabled;
- single-flight submit;
- `409`/request-ID behavior;
- consequences mention session/questions/Saved Attempts or Attempt History;
- consequences do **not** imply deletion of the source Resume;
- updated title/warning hierarchy.

RED command:

```bash
npm run test -w frontend -- \
  src/features/interviews/InterviewDeleteDialog.test.tsx \
  src/features/interviews/InterviewSessionListDeletion.test.tsx
```

Expected RED: failures because Restore/Delete are still persistent footer buttons and the dialog still owns the old trigger.

## 3.2 GREEN — coordinate one Interview overflow at list level

In `InterviewSessionListPage.tsx`:

- add `openActionsSessionId: string | null`;
- pass `actionsOpen` and `onActionsOpenChange` into each `InterviewSessionCard`;
- clear the ID when the selected session is deleted or otherwise leaves the collection;
- change nothing else about filtering, canonical refresh, empty state, or list behavior.

This is the only approved reason for touching the list page.

## 3.3 GREEN — make InterviewSessionCard own combined actions

In `InterviewSessionCard.tsx`:

- place `CardOverflowActions` in the **top-right heading/status cluster**;
- keep lifecycle status visible;
- active/completed actions: only `Delete permanently`;
- archived actions: `Restore session`, separator, `Delete permanently`;
- remove persistent Restore/Delete footer buttons;
- keep `Open session` as the primary footer action;
- preserve the existing Restore API/update/navigation code rather than recreating it elsewhere;
- add only local state/ref needed to open the deletion dialog and return focus.

On `Delete permanently` selection:

- store the overflow trigger in a ref;
- close the overflow first;
- open the controlled `InterviewDeleteDialog`.

On Restore selection:

- close the overflow first;
- call the existing restore handler;
- preserve existing error handling.

## 3.4 GREEN — convert InterviewDeleteDialog to controlled presentation

In `InterviewDeleteDialog.tsx`:

- remove its persistent card trigger;
- accept a minimal controlled-open contract from `InterviewSessionCard`, for example `open`, `onRequestClose`, and `returnFocusRef`;
- keep all confirmation/API/busy/error/request-ID/onDeleted logic inside the component;
- preserve exact case-sensitive title confirmation;
- close via the supplied callback after successful deletion;
- use the supplied trigger ref with the existing `Dialog` focus-return behavior.

Apply the same approved dialog hierarchy as Resume, with Interview-specific consequences.

## 3.5 GREEN — Interview CSS

In `interviewCoach.css` / `interviewDeletion.css`:

- place More actions beside the lifecycle badge without collision;
- retain the existing primary `Open session` hierarchy;
- scope shared component descendant styles under Interview-specific wrappers;
- style neutral trigger, overflow panel, separator, destructive action, and refined dialog;
- preserve responsive wrapping;
- remove obsolete persistent-delete styling only when no longer referenced.

## 3.6 Focused GREEN verification

```bash
npm run test -w frontend -- \
  src/components/CardOverflowActions.test.tsx \
  src/features/interviews/InterviewDeleteDialog.test.tsx \
  src/features/interviews/InterviewSessionListDeletion.test.tsx
```

Expected: PASS.

---

# Task 4 — Learning library + asynchronous deletion refinement

## 4.1 RED — update Learning tests first

Update `LearningDocumentDeletionLibrary.test.tsx` and `LearningDashboardDeletion.test.tsx` so they prove:

1. `Open workspace` remains immediately visible;
2. `Delete document` is not persistent;
3. `More actions for <document title>` exposes `Delete document` for deletable documents;
4. selecting it opens the existing Learning confirmation dialog;
5. successful acceptance still transitions the library card to `Deleting`;
6. once status is `deleting`, neither More actions delete behavior nor a duplicate delete action remains available;
7. with multiple documents, only one overflow panel is open at a time.

Update the existing helper(s) in `LearningDocumentDeletion.test.tsx` so component-level deletion tests enter the flow through More actions before selecting `Delete document`.

Preserve all existing state-machine coverage, including:

- `confirmation.trim() === document.title` behavior;
- case mismatch remains invalid;
- acceptance single-flight;
- same-state polling;
- deleting polling;
- transient retry/backoff;
- timeout handling;
- shared-resource/mixed-ownership safety errors;
- backend error/request-ID reporting;
- cancellation;
- final-scope reconciliation;
- missing/absence success behavior;
- `isDeleting` suppresses deletion trigger.

RED command:

```bash
npm run test -w frontend -- \
  src/features/learning/LearningDocumentDeletion.test.tsx \
  src/features/learning/LearningDocumentDeletionLibrary.test.tsx \
  src/features/learning/LearningDashboardDeletion.test.tsx
```

Expected RED: failures because the current Learning library still renders a persistent `Delete document` button after `Open workspace`.

## 4.2 GREEN — coordinate Learning overflow at dashboard level

In `LearningDashboard.tsx`:

- add `openActionsDocumentId: string | null`;
- move the `LearningDocumentDeletion` integration into the **top-right document heading/status area**;
- pass controlled overflow state keyed by document ID;
- keep `Open workspace` as the primary card action below metadata;
- preserve `markDocumentDeleting` and current library state updates;
- continue suppressing the deletion component when `document.status === "deleting"`.

Do not move deletion polling/state-machine logic into the dashboard.

## 4.3 GREEN — adapt LearningDocumentDeletion trigger only

In `LearningDocumentDeletion.tsx`:

- accept the controlled overflow props;
- replace the persistent `learning-danger-button` trigger with `CardOverflowActions` containing only `Delete document`;
- on action selection, store the More actions trigger in the existing return-focus ref, then call the existing confirmation-opening path;
- preserve every asynchronous deletion status transition and request/poll/retry path;
- preserve `confirmation.trim() === document.title` exactly;
- preserve `canShowTrigger` / deleting suppression semantics;
- do not change backend calls or context-ID validation.

Refine the native Learning dialog to the same visible hierarchy as Resume/Interview while retaining Learning-specific cascade wording and native-dialog behavior.

## 4.4 GREEN — Learning CSS

In `learningWorkspace.css`:

- place More actions beside PDF/status badges without horizontal overflow;
- neutralize the card-level destructive affordance;
- scope shared component descendant styles under Learning-specific wrappers;
- align the Learning confirmation dialog with the approved warning/title/input/action hierarchy;
- preserve compact deletion status/error/retry panels and `Deleting` presentation.

## 4.5 Focused GREEN verification

```bash
npm run test -w frontend -- \
  src/components/CardOverflowActions.test.tsx \
  src/features/learning/LearningDocumentDeletion.test.tsx \
  src/features/learning/LearningDocumentDeletionLibrary.test.tsx \
  src/features/learning/LearningDashboardDeletion.test.tsx
```

Expected: PASS.

---

# Task 5 — Cross-feature accessibility and interaction qualification

## 5.1 Run the entire focused refinement set

```bash
npm run test -w frontend -- \
  src/components/CardOverflowActions.test.tsx \
  src/features/resumes/ResumeDeleteDialog.test.tsx \
  src/features/resumes/ResumeListDeletion.test.tsx \
  src/features/interviews/InterviewDeleteDialog.test.tsx \
  src/features/interviews/InterviewSessionListDeletion.test.tsx \
  src/features/learning/LearningDocumentDeletion.test.tsx \
  src/features/learning/LearningDocumentDeletionLibrary.test.tsx \
  src/features/learning/LearningDashboardDeletion.test.tsx
```

Expected: PASS.

## 5.2 Explicit invariants to inspect in tests/code

Before proceeding, verify all of these are true:

- no `role="menu"`/`menuitem` has been added without a full menu keyboard model;
- More actions triggers are record-specific and expose `aria-expanded`;
- Escape returns focus to the trigger;
- outside dismissal does not trap focus;
- selecting Delete closes overflow before dialog opens;
- dialog close returns focus to the relevant More actions trigger when the card remains;
- one overflow open per collection;
- Resume exact case-sensitive confirmation unchanged;
- Interview exact case-sensitive confirmation unchanged;
- Learning trim-then-exact confirmation unchanged;
- Learning `Deleting` has no duplicate delete affordance;
- archived Interview Restore and permanent Delete remain separate;
- source Resume is never described as deleted by Interview deletion;
- API calls/status handling are unchanged.

If any of these require a backend or package change, stop instead of widening scope.

---

# Task 6 — Full frontend regression qualification

Run, in order:

```bash
npm run test -w frontend
npm run typecheck -w frontend
npm run build -w frontend
git diff --check
```

Expected:

- full frontend Vitest suite PASS;
- TypeScript typecheck PASS;
- production frontend build PASS;
- no whitespace errors in the uncommitted working-tree patch.

Because the project workflow intentionally keeps production changes uncommitted until user approval, `git diff --check` is the meaningful pre-commit whitespace check. After the user later approves the commit and Codex commits it, rerun the approved-spec check:

```bash
git diff --check origin/main...HEAD
```

Backend reruns are **not required** if the final diff contains no backend files. If any backend file appears unexpectedly, stop and report the scope breach rather than simply running more tests.

## 6.1 Final diff boundary inspection

Run:

```bash
git status --short
git diff --stat
git diff --name-only
git diff -- frontend/src/components \
  frontend/src/features/resumes \
  frontend/src/features/interviews \
  frontend/src/features/learning
```

Confirm:

- only the approved frontend files changed;
- exactly the two approved shared component files are new;
- no backend/package/lock/env/migration/provider/deployment file changed;
- no unrelated formatting churn;
- no generated build artifacts are staged or retained for commit.

Do not stage or commit yet.

---

# Task 7 — Bounded runtime/browser verification

Only after Task 6 is fully GREEN, perform bounded visual/runtime verification.

## 7.1 Runtime setup

Use the repository's existing local development workflow and existing environment configuration. Required runtime pieces are:

- MongoDB used by the local Career Learning Hub development stack;
- backend development server;
- frontend Vite development server.

Do not change environment variables, provider configuration, ports, deployment configuration, or database schema for this QA.

If Codex cannot use a browser in its current environment, skip Codex browser automation and hand off the exact human QA checklist below; do not claim visual verification happened.

## 7.2 Codex visual sanity pass, if browser is available

Check only the changed surfaces:

- Resume Studio list;
- Interview Coach session list, including an archived session if available;
- Learning document library.

At desktop and one narrow/mobile viewport, verify:

- persistent red delete buttons are gone;
- More actions is top-right and does not collide with title/status/preview;
- Open actions remain visually dominant;
- overflow panel remains inside viewport;
- destructive action is red inside overflow but not card-dominant;
- dialogs display the approved hierarchy;
- Escape/outside dismissal behave correctly;
- no horizontal overflow.

Do not create/delete meaningful user data merely for browser cosmetics if safe fixtures/test records are not available.

## 7.3 Mandatory human QA gate

The user must still verify PR #18 at desktop, tablet/narrow, and mobile widths before final acceptance.

Human checklist:

- Resume: More actions top-right; `Open Resume` clear; Delete flow works; exact-title requirement preserved.
- Interview active/completed: More actions → permanent Delete; `Open session` clear.
- Interview archived: More actions → Restore session + separator + Delete permanently; both behave independently.
- Learning: More actions → Delete document; after acceptance, `Deleting` is clear and duplicate Delete is gone.
- All modules: Escape, Tab/Shift+Tab, Cancel, outside dismissal, focus return, responsive layout, warning hierarchy, no horizontal overflow.

---

# Task 8 — Stop and report; no commit yet

After automated verification and any bounded Codex browser check, Codex must stop with the changes uncommitted.

Report:

1. exact files changed/new;
2. focused RED evidence for each task;
3. focused GREEN results;
4. full frontend test count/result;
5. typecheck result;
6. build result;
7. `git diff --check` result;
8. whether backend/package/lock/env files remained untouched;
9. whether Codex browser verification was performed or skipped;
10. any residual human QA items;
11. current `git status --short`;
12. explicit statement: **no commit, push, merge, deployment, or branch deletion performed**.

Next gate after successful implementation verification:

`APPROVE RECORD DELETION UI REFINEMENT COMMIT`

Only after that separate approval may Codex create the bounded commit and push the feature branch, followed by ChatGPT remote verification through GitHub.

## 9. Self-review of this plan

This plan has been checked against the approved UI refinement specification and current PR #18 code.

Confirmed:

- frontend-only scope;
- exactly two new shared files;
- no dependency or infrastructure additions;
- one small controlled overflow component, not a generic framework;
- no ARIA menu semantics without a complete keyboard model;
- top-right placement is explicit for all three modules;
- one-open-at-a-time coordination is explicit for all three collections;
- Interview list-page touch is bounded solely to collection coordination;
- Resume/Interview exact case-sensitive confirmation is preserved;
- Learning trim-then-exact confirmation is preserved;
- existing deletion API/state-machine ownership stays inside existing deletion components;
- archived Interview Restore remains independent from permanent Delete;
- Learning `Deleting` remains duplicate-safe;
- RED → GREEN → focused regression → full frontend qualification is explicit;
- browser use is limited to visible UI verification;
- user manual terminal work is not required during implementation;
- no implementation commit/push/merge/deploy is authorized by plan approval.

## 10. Approval state

The UI refinement design and written specification are approved.

This implementation plan is **not yet authorized for execution**.

Execution may begin only after the user explicitly approves:

`APPROVE RECORD DELETION UI REFINEMENT PLAN + CODEX EXECUTION`
