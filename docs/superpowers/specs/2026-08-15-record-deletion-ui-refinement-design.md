# Record Deletion UI Refinement Design

**Date:** 2026-08-15
**Status:** Design and written specification approved by the user; implementation plan created and awaiting approval
**Task branch:** `task/record-deletion-destructive-actions`
**Parent PR:** `#18 — Record deletion and destructive actions`
**Base:** existing Record Deletion implementation on PR #18
**Implementation plan:** `docs/superpowers/plans/2026-08-15-record-deletion-ui-refinement.md`

## 1. Purpose

Refine the already-working Resume, Interview, and Learning deletion interfaces so destructive actions are discoverable but visually secondary to normal record use.

The current deletion implementation is functionally accepted and has passed focused and full automated qualification. This refinement changes presentation and interaction only. It must not change deletion API contracts, cascade semantics, ownership checks, AI-job fencing, archive/restore behavior, Learning deletion state-machine behavior, or persistence logic.

The refinement is based on the user's browser QA capture from 2026-08-15, where persistent solid-red delete buttons visually compete with `Open Resume`, `Open session`, and `Open workspace` across Resume Studio, Interview Coach, and Learning.

## 2. Controlling project constraint

Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.

Therefore this refinement will:

- stay inside PR #18;
- reuse the existing deletion components and APIs;
- use one small shared overflow-actions component to avoid duplicating focus/dismissal behavior three times;
- avoid a generic command framework, context-menu framework, design-system rewrite, or card refactor unrelated to deletion;
- keep all existing backend deletion behavior untouched;
- keep PR #18 draft until the refined UI is requalified and user-approved.

## 3. Approved visual direction

Use an overflow-actions pattern for destructive record actions.

Normal cards must no longer show persistent solid-red delete buttons. Each card instead exposes a compact `More actions` button using an ellipsis (`⋯`). The primary open action remains visually dominant.

Red is reserved for destructive intent inside the overflow panel, the destructive confirmation surface, error state, and the final irreversible confirmation button.

### 3.1 Resume card

The Resume card keeps:

- preview;
- Resume title;
- Draft/status and version metadata;
- template/palette metadata;
- updated date;
- `Open Resume` as the primary card action.

The `More actions` trigger is fixed in the **top-right of the card body heading**, aligned with the Resume title area and never overlaid on the document preview. The footer remains dedicated to update metadata and `Open Resume`.

Its overflow panel contains:

- `Delete resume` — destructive item.

The existing `ResumeDeleteDialog` remains the deletion owner; only its trigger integration and presentation are refined.

### 3.2 Interview session card

The Interview card keeps:

- role/title;
- lifecycle status;
- experience/mode metadata;
- question count;
- updated date;
- `Open session` as the primary card action.

The `More actions` trigger is fixed in the **top-right heading cluster adjacent to the lifecycle status**, without replacing or obscuring the status badge. The footer remains focused on count/date and `Open session`.

For active/completed sessions the overflow panel contains:

- `Delete permanently` — destructive item.

For archived sessions it contains:

- `Restore session` — normal lifecycle action;
- visual separator;
- `Delete permanently` — destructive item.

Archive/Restore semantics must remain unchanged. Permanent deletion remains a separate irreversible action.

### 3.3 Learning document card

The Learning card keeps:

- PDF identity/status;
- title and filename;
- page/extracted-section metadata;
- updated timestamp;
- `Open workspace` as the primary card action.

The `More actions` trigger is fixed in the **top-right of the document card heading adjacent to the status badge**. `Open workspace` remains the primary card action below the metadata.

For deletable documents the overflow panel contains:

- `Delete document` — destructive item.

When the document is already `deleting`, the destructive action remains suppressed exactly as today; no duplicate deletion trigger may be exposed.

## 4. Shared overflow-actions component

Implement one small shared component:

- `frontend/src/components/CardOverflowActions.tsx`
- `frontend/src/components/CardOverflowActions.test.tsx`

It exists only to centralize the repeated trigger/panel dismissal and focus behavior required by Resume, Interview, and Learning cards. It must not grow into a generic application command system.

Required behavior:

- record-specific trigger accessible name such as `More actions for <record title>`;
- visible ellipsis trigger (`⋯`);
- `aria-expanded` reflects open state;
- opens only on explicit activation;
- action buttons remain keyboard reachable with normal Tab navigation;
- Escape closes the panel;
- clicking/tapping outside closes the panel;
- focus returns to the trigger after dismissal when focus has not intentionally moved into a confirmation dialog;
- selecting an action closes the panel before invoking that action;
- minimum interactive target size uses the existing application token;
- panel remains inside the viewport on narrow layouts;
- no hover-only functionality.

Do **not** use `role="menu"` / `role="menuitem"` unless the implementation also provides the full ARIA menu keyboard model, including arrow-key navigation. The preferred small solution is normal buttons inside a controlled popover/panel with standard Tab behavior.

Collections must coordinate open state so only one card overflow panel is open at a time.

## 5. Deletion-component integration

The existing deletion components remain responsible for:

- API calls;
- busy/single-flight behavior;
- errors and request IDs;
- confirmation state;
- successful deletion callbacks.

Refactor their trigger boundary only as much as needed so a destructive overflow action can open the existing confirmation dialog without duplicating deletion logic into the card component.

The implementation plan may choose a small controlled/open-trigger prop shape or equivalent bounded mechanism, but deletion logic must stay inside the existing deletion components.

## 6. Destructive confirmation dialog refinement

Keep the existing secure confirmation behavior. Refine only presentation and copy hierarchy.

All three dialogs follow one visual structure:

1. subtle warning icon/badge;
2. eyebrow: `Permanent action`;
3. concise title naming the record, for example `Delete “test 2”?`;
4. short statement describing what will be removed;
5. visible warning panel: `This action cannot be undone.`;
6. confirmation guidance that visibly shows the exact stored title expected;
7. confirmation input;
8. actions: secondary `Cancel`, destructive `Delete permanently`.

### 6.1 Confirmation semantics — preserve existing behavior exactly

Do not normalize all three modules to one new comparison rule.

- **Resume:** enabled only when `confirmation === resume.title` — exact, case-sensitive equality.
- **Interview:** enabled only when the entered confirmation exactly and case-sensitively equals the stored session title, preserving current behavior.
- **Learning:** preserve the current Learning contract: trim surrounding whitespace from the entered value, then compare exactly with the stored document title. Do not introduce case-folding or other normalization.

### 6.2 Resume consequences

The Resume dialog continues to communicate that deletion removes:

- the Resume;
- saved versions;
- analyses;
- Candidate Photo when associated;
- associated imported Resume PDF source assets covered by the existing deletion implementation.

### 6.3 Interview consequences

The Interview dialog continues to communicate that deletion removes:

- the Interview session;
- questions;
- Saved Attempts / Attempt History.

It must not imply the source Resume is deleted.

### 6.4 Learning consequences

The Learning dialog continues to communicate the existing deletion cascade for:

- document;
- conversations/messages;
- flashcards;
- quizzes;
- attempts.

The Learning deletion remains asynchronous and keeps its existing `Deleting` state behavior.

## 7. Button and color hierarchy

Normal collection cards:

- primary open action: existing green/brand treatment;
- overflow trigger: neutral/subtle treatment;
- destructive overflow action: red text/icon treatment;
- no persistent solid-red delete button.

Confirmation dialog:

- Cancel: normal secondary treatment;
- final irreversible action: solid destructive treatment;
- disabled destructive action: muted and clearly disabled, not visually equivalent to enabled danger state.

Do not introduce new palette families. Reuse current CSS variables and existing error/destructive colors where practical.

## 8. Responsive layout

Desktop:

- fixed top-right overflow placement follows Sections 3.1–3.3;
- no overlap with status badges, titles, preview, or primary actions.

Tablet/narrow desktop:

- headings/action areas may wrap without changing priority;
- `Open ...` remains easy to find;
- overflow panel stays anchored and visible.

Mobile:

- dialogs fit within the viewport with internal scrolling only when required;
- final dialog actions may stack full-width using current responsive patterns;
- overflow remains tappable and causes no horizontal overflow.

No card redesign beyond what is required to integrate this action hierarchy cleanly.

## 9. Error and busy-state preservation

Existing deletion behavior remains authoritative:

- module-specific confirmation semantics from Section 6.1 remain unchanged;
- duplicate submit remains blocked while deletion is busy;
- backend `409` active-job conflicts remain visible and actionable;
- request IDs remain displayed where currently supported;
- successful Resume/Interview deletion still removes the card and refreshes canonical collection state;
- Learning deletion still transitions through `Deleting` and suppresses duplicate deletion.

The UI refinement must not catch or transform errors in a way that changes these behaviors.

## 10. Testing requirements

Update/add frontend tests only as required by the presentation change.

Required automated coverage:

- `CardOverflowActions.test.tsx` covers trigger, `aria-expanded`, Escape, outside dismissal, action selection, standard keyboard access, and focus return;
- Resume card exposes no persistent `Delete resume` button before opening More actions;
- Interview card exposes no persistent `Delete permanently` button before opening More actions;
- Learning card exposes no persistent `Delete document` button before opening More actions;
- each More actions trigger opens only its record-specific actions;
- destructive action still opens the existing confirmation flow;
- archived Interview overflow exposes Restore and permanent Delete separately;
- Learning `deleting` state exposes no delete option;
- collection behavior allows only one overflow panel open at once;
- Resume/Interview exact case-sensitive confirmation behavior remains covered;
- Learning trimmed-surrounding-whitespace confirmation behavior remains covered;
- existing deletion-dialog API/error/busy tests continue passing;
- existing collection refresh/deletion tests continue passing.

After focused UI tests pass, rerun:

- full frontend test suite;
- frontend typecheck;
- frontend production build;
- `git diff --check origin/main...HEAD` after the approved implementation commit; use `git diff --check` while implementation remains intentionally uncommitted for review.

Backend reruns are not required solely for this presentation change unless backend files unexpectedly change.

## 11. Human browser QA

The user must verify the refined PR #18 UI at desktop, tablet/narrow, and mobile widths.

Verify:

- no persistent red delete buttons dominate cards;
- primary Open actions remain clear;
- fixed top-right More actions triggers are visually consistent;
- overflow actions are discoverable without dominating the card;
- destructive options are visually secondary but unmistakable;
- Resume, Interview, and Learning dialogs have consistent hierarchy;
- Cancel, Escape, Tab/Shift+Tab, focus return, and outside-panel dismissal behave correctly;
- archived Interview Restore remains independent from permanent deletion;
- Learning `Deleting` state remains clear;
- no horizontal overflow or action collision.

## 12. Planned file boundary

Create:

- `frontend/src/components/CardOverflowActions.tsx`
- `frontend/src/components/CardOverflowActions.test.tsx`

Expected existing files to modify:

- `frontend/src/features/resumes/ResumeListPage.tsx`
- `frontend/src/features/resumes/ResumeDeleteDialog.tsx`
- `frontend/src/features/resumes/resumeDeletion.css`
- `frontend/src/features/resumes/resumeWorkspace.css` only for bounded card alignment
- Resume deletion/list tests already present on PR #18
- `frontend/src/features/interviews/InterviewSessionListPage.tsx` only for the approved one-open-at-a-time collection coordination required by the implementation plan
- `frontend/src/features/interviews/InterviewSessionCard.tsx`
- `frontend/src/features/interviews/InterviewDeleteDialog.tsx`
- Interview deletion/card CSS and tests already present on PR #18
- `frontend/src/features/learning/LearningDashboard.tsx`
- `frontend/src/features/learning/LearningDocumentDeletion.tsx`
- `frontend/src/features/learning/learningWorkspace.css`
- Learning deletion/dashboard tests already present on PR #18

No backend, package, lockfile, migration, auth, AI-provider, environment, deployment, or database files are authorized by this refinement.

## 13. Explicit non-goals

Do not add:

- Trash/recycle bin;
- undo or retention window;
- bulk deletion;
- generic command/action infrastructure;
- global context-menu framework;
- new backend endpoints;
- new deletion job types;
- animation framework;
- redesign of Resume/Interview/Learning cards unrelated to action hierarchy;
- Phase 19C activation;
- deployment or merge actions.

## 14. Acceptance state

The written specification is approved.

The implementation plan has been created and self-reviewed, but implementation remains unauthorized until the user explicitly approves the plan.

Next gate: `APPROVE RECORD DELETION UI REFINEMENT PLAN + CODEX EXECUTION`.