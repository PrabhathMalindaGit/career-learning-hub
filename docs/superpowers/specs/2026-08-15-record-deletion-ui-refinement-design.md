# Record Deletion UI Refinement Design

**Date:** 2026-08-15
**Status:** Design approved by the user; written specification awaiting user review
**Task branch:** `task/record-deletion-destructive-actions`
**Parent PR:** `#18 — Record deletion and destructive actions`
**Base:** existing Record Deletion implementation on PR #18

## 1. Purpose

Refine the already-working Resume, Interview, and Learning deletion interfaces so destructive actions are discoverable but visually secondary to normal record use.

The current deletion implementation is functionally accepted and has passed focused and full automated qualification. This refinement changes presentation and interaction only. It must not change deletion API contracts, cascade semantics, ownership checks, AI-job fencing, archive/restore behavior, Learning deletion state-machine behavior, or persistence logic.

The refinement is based on the user's browser QA capture from 2026-08-15, where persistent solid-red delete buttons visually compete with `Open Resume`, `Open session`, and `Open workspace` across Resume Studio, Interview Coach, and Learning.

## 2. Controlling project constraint

Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.

Therefore this refinement will:

- stay inside PR #18;
- reuse the existing deletion components and APIs;
- use one small reusable overflow-action pattern only if that reduces duplication cleanly;
- avoid a generic command framework, context-menu framework, design-system rewrite, or card refactor unrelated to deletion;
- keep all existing backend deletion behavior untouched;
- keep PR #18 draft until the refined UI is requalified and user-approved.

## 3. Approved visual direction

Use an overflow-menu pattern for destructive record actions.

Normal cards must no longer show persistent solid-red delete buttons. Each card instead exposes a compact `More actions` button using an ellipsis (`⋯`). The primary open action remains visually dominant.

Red is reserved for destructive intent inside the overflow menu, the destructive confirmation surface, error state, and the final irreversible confirmation button.

### 3.1 Resume card

The Resume card keeps:

- preview;
- Resume title;
- Draft/status and version metadata;
- template/palette metadata;
- updated date;
- `Open Resume` as the primary card action.

Add a compact top-right or footer-adjacent `More actions` trigger that does not compete with `Open Resume`.

Its menu contains:

- `Delete resume` — destructive item.

The existing `ResumeDeleteDialog` remains the deletion owner; only its trigger/presentation is refined.

### 3.2 Interview session card

The Interview card keeps:

- role/title;
- lifecycle status;
- experience/mode metadata;
- question count;
- updated date;
- `Open session` as the primary card action.

Replace the persistent `Delete permanently` button with `More actions`.

For active/completed sessions the menu contains:

- `Delete permanently` — destructive item.

For archived sessions the menu contains:

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

Replace the persistent `Delete document` button with `More actions`.

For deletable documents the menu contains:

- `Delete document` — destructive item.

When the document is already `deleting`, the destructive action remains suppressed exactly as today; do not expose a duplicate deletion trigger.

## 4. Overflow-menu interaction requirements

The overflow control must be accessible and predictable.

Required behavior:

- button accessible name: `More actions for <record title>` or equivalent record-specific label;
- menu opens only on explicit user action;
- menu is keyboard reachable;
- Escape closes the menu;
- clicking/tapping outside closes the menu;
- focus returns to the trigger after menu dismissal;
- opening a destructive confirmation closes the menu first;
- only one card menu should remain open at a time within a collection;
- menu must remain within the viewport on narrow layouts;
- destructive item uses red text/icon treatment but not a large permanent red button;
- minimum interactive target size follows the existing application token;
- no hover-only functionality.

A small shared component may be introduced if Resume, Interview, and Learning would otherwise duplicate the same focus/dismissal logic. It must remain narrowly scoped to card overflow actions and must not become a generic application command framework.

## 5. Destructive confirmation dialog refinement

Keep the existing secure confirmation behavior and exact-title requirement. Refine only presentation and copy hierarchy.

All three dialogs should follow one visual structure:

1. subtle warning icon/badge;
2. eyebrow: `Permanent action`;
3. concise title naming the record, for example `Delete “test 2”?`;
4. short statement describing what will be removed;
5. visible warning panel: `This action cannot be undone.`;
6. explicit confirmation guidance showing the exact title to type;
7. confirmation input;
8. actions: secondary `Cancel`, destructive `Delete permanently`.

### 5.1 Resume consequences

The Resume dialog must continue to communicate that deletion removes:

- the Resume;
- saved versions;
- analyses;
- Candidate Photo when associated;
- associated imported Resume PDF source assets covered by the existing deletion implementation.

### 5.2 Interview consequences

The Interview dialog must continue to communicate that deletion removes:

- the Interview session;
- questions;
- Saved Attempts / Attempt History.

It must not imply the source Resume is deleted.

### 5.3 Learning consequences

The Learning dialog must continue to communicate the existing deletion cascade for:

- document;
- conversations/messages;
- flashcards;
- quizzes;
- attempts.

The Learning deletion remains asynchronous and keeps its existing `Deleting` state behavior.

## 6. Button and color hierarchy

Normal collection cards:

- primary open action: existing green/brand treatment;
- overflow trigger: neutral/subtle treatment;
- destructive menu item: red text/icon treatment;
- no persistent solid-red delete button.

Confirmation dialog:

- Cancel: normal secondary treatment;
- final irreversible action: solid destructive treatment;
- disabled destructive action: muted, clearly disabled, not visually equivalent to enabled danger state.

Do not introduce new palette families. Reuse current CSS variables and existing error/destructive colors where practical.

## 7. Responsive layout

Desktop:

- overflow trigger should align cleanly with the card action hierarchy;
- no overlap with status badges, titles, or primary actions.

Tablet/narrow desktop:

- action areas may wrap without changing priority;
- `Open ...` remains easy to find;
- overflow menu stays anchored and visible.

Mobile:

- dialogs fit within the viewport with internal scrolling only when required;
- final dialog actions may stack full-width if current responsive patterns require it;
- menu remains tappable and does not create horizontal overflow.

No card redesign beyond what is required to integrate the overflow trigger cleanly.

## 8. Error and busy-state preservation

Existing deletion behavior remains authoritative:

- exact-title confirmation remains case-sensitive according to current Resume/Interview behavior and current Learning confirmation contract;
- duplicate submit remains blocked while deletion is busy;
- backend `409` active-job conflicts remain visible and actionable;
- request IDs remain displayed where currently supported;
- successful Resume/Interview deletion still removes the card and refreshes canonical collection state;
- Learning deletion still transitions through `Deleting` and suppresses duplicate deletion.

The UI refinement must not catch or transform errors in a way that changes these behaviors.

## 9. Testing requirements

Update/add frontend tests only as required by the presentation change.

Required automated coverage:

- Resume card no longer exposes a persistent `Delete resume` button before opening More actions;
- Interview card no longer exposes a persistent `Delete permanently` button before opening More actions;
- Learning card no longer exposes a persistent `Delete document` button before opening More actions;
- each More actions control opens the correct record-specific actions;
- destructive action still opens the existing confirmation flow;
- archived Interview menu exposes Restore and permanent Delete separately;
- Learning `deleting` state exposes no duplicate deletion action;
- Escape/outside dismissal and focus return work;
- keyboard access remains usable;
- existing deletion-dialog behavior tests continue passing;
- existing collection refresh/deletion tests continue passing.

After focused UI tests pass, rerun:

- full frontend test suite;
- frontend typecheck;
- frontend production build;
- `git diff --check origin/main...HEAD`.

Backend reruns are not required solely for CSS/component presentation changes unless backend files unexpectedly change.

## 10. Human browser QA

The user must verify the refined PR #18 UI at desktop, tablet/narrow, and mobile widths.

Verify:

- no persistent red delete buttons dominate cards;
- primary Open actions remain clear;
- More actions menus are easy to discover and use;
- destructive options are visually secondary but unmistakable;
- Resume, Interview, and Learning dialogs have consistent hierarchy;
- Cancel, Escape, Tab/Shift+Tab, focus return, and outside-menu dismissal behave correctly;
- archived Interview Restore remains independent from permanent deletion;
- Learning `Deleting` state remains clear;
- no horizontal overflow or action collision.

## 11. Planned file boundary

Expected existing files to modify:

- `frontend/src/features/resumes/ResumeListPage.tsx`
- `frontend/src/features/resumes/ResumeDeleteDialog.tsx`
- `frontend/src/features/resumes/resumeDeletion.css`
- `frontend/src/features/resumes/resumeWorkspace.css` only if card alignment requires a bounded adjustment
- Resume deletion/list tests already present on PR #18
- `frontend/src/features/interviews/InterviewSessionCard.tsx`
- `frontend/src/features/interviews/InterviewDeleteDialog.tsx`
- Interview deletion/card CSS and tests already present on PR #18
- `frontend/src/features/learning/LearningDashboard.tsx`
- `frontend/src/features/learning/LearningDocumentDeletion.tsx`
- `frontend/src/features/learning/learningWorkspace.css`
- Learning deletion/dashboard tests already present on PR #18

Optional new file, only if justified by clean reuse across all three modules:

- a small feature-neutral card overflow actions component plus focused tests under `frontend/src/components/`.

No backend, package, lockfile, migration, auth, AI-provider, environment, deployment, or database files are authorized by this refinement.

## 12. Explicit non-goals

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

## 13. Acceptance state

This written specification authorizes no implementation by itself.

Implementation may begin only after the user explicitly approves this written UI refinement specification and then approves the resulting implementation plan.
