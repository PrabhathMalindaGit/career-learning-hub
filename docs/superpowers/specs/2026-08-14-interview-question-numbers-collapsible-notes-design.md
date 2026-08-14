# Interview Question Numbers and Collapsible Private Notes — Design

Date: 2026-08-14
Scope: Career Learning Hub, Phase 19B-3 Task 7R refinement
Branch: `task/phase-19b3-task7r-interview-layout-refinement`
PR: #13

## Goal

Improve Interview Practice Desk scanability without changing question identity, note persistence, Interview API contracts, Gemini behavior, or backend storage.

This refinement has two bounded presentation goals:

1. show clear sequential numbers in the Question Index;
2. stop an empty Private notes textarea from occupying permanent vertical space.

## Existing behavior

- The Question Index is already rendered as an ordered list, but Interview CSS removes list markers, so question cards have no visible number.
- Questions are paginated with an existing page size of 20 and preserve server order.
- Private notes are rendered whenever a question is selected, even when that question has no saved note.
- Notes already use the existing per-question notes draft, Save notes, Clear notes, read-only session behavior, stale-response guards, and persistence endpoint.

## Design

### 1. Visible Question Index numbers

Each Question Index card receives a compact visual sequence number before its existing type/category/difficulty/question content.

Examples:

- `01`
- `02`
- `03`
- `10`
- `21`

Numbers below 10 are zero-padded to two digits for visual alignment. Numbers 10 and above display normally.

The number is a display-only sequence value. It is not a question ID and is never persisted or sent to the backend.

### Numbering across pages

Question numbering continues across the existing 20-item pages:

- page 1: `01` through `20`;
- page 2: `21` onward.

The number is derived from the current page offset plus the question's position in the returned page.

### Numbering with filters

When difficulty, category, or pinned-only filters are active, numbering represents the order of the filtered result set. Existing filter/page-reset behavior remains authoritative.

The application does not attempt to preserve a hidden global number from the unfiltered collection.

### Accessibility

The underlying ordered-list semantics remain intact. The new number is primarily a visual aid and must not replace the question's accessible button label or question identity.

### 2. Collapsible Private notes

Private notes become a compact disclosure within Practice Desk.

#### Selected question has no saved note

Default presentation:

```text
Private notes                                  [Add note]
```

The textarea and Save/Clear actions are not rendered until the user chooses `Add note`.

#### Selected question has an existing saved note

Private notes open automatically so existing information is not hidden.

```text
Private notes                                     [Hide]

[ existing note textarea ]

[Save notes] [Clear notes]
```

#### User opens an empty note

Selecting `Add note` expands the existing native textarea and existing Save/Clear controls. No modal, drawer, editor dependency, autosave, or new persistence layer is introduced.

#### Dirty/saving/error state

Once the notes draft contains unsaved work or a note save is in progress/failed, the notes area stays expanded. The UI must not hide an unresolved draft behind the collapsed state.

The user can collapse notes again only when the current note state is resolved (clean or saved).

#### Saved empty note

If a note is cleared and the empty value is successfully saved, the current expanded state may remain until the user switches questions or explicitly hides it. On the next canonical selection/load of a question with no saved note, notes default collapsed again.

#### Read-only / archived sessions

Existing saved notes remain visible and read-only by default.

If an archived/read-only question has no saved note, the empty notes editor remains collapsed and no editable `Add note` action is offered.

### Question switching

When the selected question changes, the disclosure state resets from the newly loaded canonical question:

- canonical saved note present -> expanded;
- no canonical saved note -> collapsed.

Existing stale-response protection, question selection sequencing, notes draft loading, and persistence semantics remain unchanged.

## Files expected to change

Implementation should stay bounded to the existing Interview frontend:

- `frontend/src/features/interviews/InterviewSessionWorkspace.tsx`
- `frontend/src/features/interviews/InterviewSessionWorkspace.test.tsx`
- `frontend/src/features/interviews/interviewQuestionTypes.css`

A separate component is not required unless implementation inspection proves it materially simpler.

## Testing requirements

Focused tests should verify:

1. Question Index shows `01` for the first visible question.
2. Numbering continues from the page offset rather than restarting at `01` on later pages.
3. Existing question selection still opens the canonical question.
4. Empty Private notes are collapsed by default and expose `Add note` only when editable.
5. `Add note` expands the existing textarea and Save/Clear actions.
6. A question with an existing saved note opens notes automatically.
7. Dirty/saving/error notes cannot be collapsed into a hidden unresolved state.
8. Switching to a question without a saved note returns notes to collapsed state.
9. Existing note-save and note-clear behavior remains unchanged.

Then run frontend typecheck, the relevant Interview workspace regressions, full frontend tests, production build, `git diff --check`, and clean-working-tree verification.

## Explicitly unchanged

- question IDs and server ordering;
- pagination API and page size;
- filtering API;
- notes schema/storage;
- notes save endpoint;
- notes maximum length;
- stale-operation guards;
- Interview question/attempt contracts;
- Gemini generation/explanation/feedback behavior;
- backend code;
- Saved Attempts behavior;
- archive/restore behavior.

## Scope control

Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.
