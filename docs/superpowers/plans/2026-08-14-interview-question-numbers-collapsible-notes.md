# Interview Question Numbers and Collapsible Private Notes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add visible paginated sequence numbers to Question Index cards and make empty Private notes collapsible without changing question identity or note persistence.

**Architecture:** Keep the existing `InterviewSessionWorkspace` as the source of question pagination, selection, notes draft, and persistence state. Derive display-only sequence numbers from `questionPage`, `PAGE_SIZE`, and each rendered question index. Add one local notes-disclosure boolean that is reset from canonical selected-question notes and is forced open while note work is unresolved. Styling remains scoped to Interview UI.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, existing Interview CSS.

## Global Constraints

- Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.
- Question numbers are presentation-only; do not persist or send them to the backend.
- Existing page size remains 20.
- Existing filter/page-reset behavior remains authoritative.
- Existing notes schema, save endpoint, 8,000-character limit, stale-response guards, and read-only behavior remain unchanged.
- No backend, API contract, Gemini/provider, Saved Attempts, or archive/restore changes.
- Empty read-only/archived questions must not expose an editable `Add note` action.

---

### Task 1: Question Index numbering and Private notes disclosure

**Files:**
- Modify: `frontend/src/features/interviews/InterviewSessionWorkspace.tsx`
- Modify: `frontend/src/features/interviews/InterviewSessionWorkspace.test.tsx`
- Modify: `frontend/src/features/interviews/interviewQuestionTypes.css`

**Interfaces:**
- Consumes: existing `questionPage`, `PAGE_SIZE`, `questions`, `selectedQuestion`, `notesDraft`, `notesState`, `editable`, `persistNotes`, and question-selection lifecycle.
- Produces: display-only sequence labels (`01`, `02`, …, `21`), plus a local notes disclosure state with `Add note` / `Hide` controls.

- [ ] **Step 1: Extend focused workspace tests for visible sequence numbers.**

Add assertions to the existing workspace test suite that verify:

```tsx
expect(screen.getByText("01")).toBeInTheDocument();
```

for the first visible Question Index item, while retaining the existing assertion that clicking the question opens the canonical question detail.

For later-page coverage, mock the question list response for page 2 and assert the first rendered card shows:

```tsx
expect(screen.getByText("21")).toBeInTheDocument();
```

The test must verify that numbering is derived from page offset, not question IDs.

- [ ] **Step 2: Extend focused workspace tests for collapsible Private notes.**

Cover these exact states:

```tsx
// Empty editable canonical note.
expect(screen.queryByRole("textbox", { name: /Private notes/i })).not.toBeInTheDocument();
expect(screen.getByRole("button", { name: "Add note" })).toBeEnabled();

// User opens it.
await user.click(screen.getByRole("button", { name: "Add note" }));
expect(screen.getByRole("textbox", { name: /Private notes/i })).toBeInTheDocument();
```

Then cover an existing saved note:

```tsx
expect(screen.getByRole("textbox", { name: /Private notes/i })).toHaveValue("Saved canonical note");
expect(screen.getByRole("button", { name: "Hide" })).toBeEnabled();
```

Cover dirty-state protection by editing the textarea, then assert there is no enabled `Hide` action while `notesState` is unresolved. Preserve the existing Save notes and Clear notes tests.

Cover switching from a question with a saved note to a question whose canonical note is empty; the second question must return to the collapsed state.

For an archived/read-only empty note, assert there is no editable `Add note` action.

- [ ] **Step 3: Run the focused workspace tests before implementation.**

Run:

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/interviews/InterviewSessionWorkspace.test.tsx
```

Expected before implementation: the new numbering/disclosure assertions fail while the existing workspace tests continue to pass.

- [ ] **Step 4: Implement display-only Question Index numbering.**

In the existing Question Index render loop, retain the ordered-list semantics and compute the sequence from the current page offset:

```ts
const questionNumber = (questionPage - 1) * PAGE_SIZE + index + 1;
const questionNumberLabel = String(questionNumber).padStart(2, "0");
```

Render the label inside each existing question card with a dedicated presentation class such as:

```tsx
<span className="interview-question-number" aria-hidden="true">
  {questionNumberLabel}
</span>
```

Do not use the sequence as a React key, route parameter, API value, or stored question identity.

- [ ] **Step 5: Add local Private notes disclosure state.**

Add a local boolean such as:

```ts
const [notesOpen, setNotesOpen] = useState(false);
```

When canonical selected-question detail is adopted, initialize/reset it from that question's canonical notes:

```ts
setNotesOpen(Boolean(question.notes?.trim()));
```

Use the actual existing notes field/property name from `InterviewQuestionDetail`; do not invent a new contract field.

When the user selects `Add note`, set `notesOpen` to true.

While `notesState` is `dirty`, `saving`, or `error`, keep the editor open and do not allow the user to hide it. `saved` and `clean` are resolved states.

When the selected question changes and the new canonical notes value is empty, reset to collapsed. When canonical saved notes are present, reset to expanded.

- [ ] **Step 6: Replace the always-visible notes editor with a compact disclosure.**

Render a compact row:

```tsx
<div className="interview-private-notes-heading">
  <strong>Private notes</strong>
  {/* Add note or Hide according to state */}
</div>
```

Behavior:

- editable + empty/collapsed -> show `Add note`;
- expanded + resolved -> show `Hide`;
- expanded + dirty/saving/error -> keep expanded and suppress/disable `Hide`;
- read-only + saved note -> expanded read-only editor, no editing action;
- read-only + empty note -> compact label only, no `Add note`.

When expanded, reuse the existing textarea, Save notes, Clear notes, validation, request-error handling, and `persistNotes` calls unchanged.

Do not add autosave, modal, drawer, or new note persistence logic.

- [ ] **Step 7: Add scoped CSS for numbers and compact notes disclosure.**

In `interviewQuestionTypes.css`, add a compact number treatment such as a fixed-width rounded badge/label aligned with the existing card content. Keep selected-card green styling authoritative.

Add `.interview-private-notes-heading` styling that aligns the label and disclosure action cleanly, with mobile wrapping if needed. Reuse the existing Interview secondary button treatment rather than inventing a new button system.

Do not materially alter Practice Desk widths, existing textarea dimensions, or responsive grid order.

- [ ] **Step 8: Run focused Interview regressions.**

Run:

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/interviews/InterviewSessionWorkspace.test.tsx \
  src/features/interviews/InterviewSessionWorkspace.questionTypes.test.tsx \
  src/features/interviews/InterviewSessionWorkspace.savedAttempts.test.tsx
```

Expected: PASS, including existing notes save/clear, stale-selection, typed-question, and Saved Attempts behavior.

- [ ] **Step 9: Run frontend typecheck and full regression.**

Run:

```bash
npm run typecheck --workspace @career-learning-hub/web
npm run test --workspace @career-learning-hub/web
npm run build --workspace @career-learning-hub/web
```

Expected: typecheck PASS, full frontend PASS, production build PASS.

- [ ] **Step 10: Run diff/working-tree verification.**

Run:

```bash
git diff --check origin/phase-19b-interview-coach-refinements...HEAD
git status --short
```

Expected: no diff-check output and a clean working tree.

- [ ] **Step 11: Human browser QA.**

Verify at desktop width:

1. page 1 Question Index begins `01` and numbers remain aligned while scrolling;
2. page 2 begins `21` if enough filtered questions exist;
3. selecting a question still opens its canonical Practice Desk detail;
4. an empty editable Private notes area is collapsed and shows `Add note`;
5. `Add note` expands the existing editor;
6. saved notes open automatically;
7. unsaved dirty note content cannot be hidden;
8. switching to a question with no saved notes collapses notes again;
9. archived/read-only empty notes expose no edit action;
10. existing note save/clear behavior remains correct.

Repeat a quick responsive check below 820px to ensure number labels and the notes disclosure do not break the existing single-column order.

- [ ] **Step 12: Commit the implementation.**

Commit only the bounded Task 7R files with a message such as:

```bash
git add \
  frontend/src/features/interviews/InterviewSessionWorkspace.tsx \
  frontend/src/features/interviews/InterviewSessionWorkspace.test.tsx \
  frontend/src/features/interviews/interviewQuestionTypes.css

git commit -m "Refine interview question index and notes"
```
