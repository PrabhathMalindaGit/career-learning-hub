# Interview Workspace Layout Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the Interview Coach workspace into a clearer two-column desktop layout with a bounded Question Index, a dominant Practice Desk, Saved Attempts beneath it, and cleaner rectangular Question Type selection tiles before Phase 19B-3 Task 8 human/browser acceptance.

**Architecture:** Keep all existing Interview state, API calls, provider-job handling, typed-answer mapping, MCQ security behavior, and stale-selection guards unchanged. Make one minimal JSX grouping change around Practice Desk + Saved Attempts, then implement the new hierarchy entirely through scoped Interview CSS and small presentation-only changes in `InterviewQuestionTypeControls.tsx`.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, existing Career Learning Hub CSS.

## Global Constraints

- Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.
- Base branch: `phase-19b-interview-coach-refinements`.
- Task branch: `task/phase-19b3-task7r-interview-layout-refinement`.
- No backend, Interview API/runtime contract, database, Gemini, auth/ownership, deployment, `main`, dependency, or new-feature changes.
- Preserve all six modern question types and historical `Open response` compatibility.
- Preserve balanced/exact distribution logic and exact-count validation.
- Preserve manual MCQ authoring, typed attempt submission, deterministic backend MCQ scoring, pre-submit answer-key secrecy, post-submit result presentation, MCQ explanation lock, and no-MCQ-feedback behavior.
- Preserve notes, pinning, filtering, pagination, Saved Attempts immutability, polling, cancel/retry, UUID/idempotency, stale-route, and stale-selection behavior.
- Task 8 live Gemini acceptance remains out of scope until Task 7R is merged.

---

## File Map

- `frontend/src/features/interviews/InterviewQuestionTypeControls.tsx` — presentation labels/structure for Question Type selection and distribution controls only; no data-flow changes.
- `frontend/src/features/interviews/interviewQuestionTypes.css` — 3/2/1-column rectangular selection tiles and distribution-panel styling.
- `frontend/src/features/interviews/InterviewSessionWorkspace.tsx` — add one right-column wrapper around existing Practice Desk and Saved Attempts sections; retain their JSX bodies and handlers.
- `frontend/src/features/interviews/interviewCoach.css` — two-column workspace grid, bounded Question Index list, compact question cards, right-column stack, Saved Attempts wide-layout treatment, and responsive breakpoints.
- `frontend/src/features/interviews/InterviewQuestionTypeControls.test.tsx` — preserve behavior and assert presentation semantics remain native/accessible.
- `frontend/src/features/interviews/InterviewSessionWorkspace.questionTypes.test.tsx` — assert typed controls remain wired after layout grouping.
- `frontend/src/features/interviews/InterviewSessionWorkspace.test.tsx` — assert Question Index, Practice Desk, and Saved Attempts remain present and selectable after regrouping.
- `frontend/src/features/interviews/InterviewSessionWorkspace.savedAttempts.test.tsx` — update only if structural scoping is required; behavior assertions must remain unchanged.

---

### Task 1: Refine Question Type selection tiles and distribution presentation

**Files:**
- Modify: `frontend/src/features/interviews/InterviewQuestionTypeControls.tsx`
- Modify: `frontend/src/features/interviews/interviewQuestionTypes.css`
- Test: `frontend/src/features/interviews/InterviewQuestionTypeControls.test.tsx`

**Interfaces:**
- Consumes: existing props `count`, `selected`, `explicitCounts`, `disabled`, `onSelectedChange`, `onExplicitCountsChange`.
- Produces: the same callback behavior and `interviewTypeCountsAreValid()` contract; only DOM grouping/class names and CSS presentation change.

- [ ] **Step 1: Add a failing presentation/semantics test for the distribution block**

Add a focused assertion to the existing test suite that renders the control with balanced distribution and verifies the new visible summary plus the same action button:

```tsx
render(
  <InterviewQuestionTypeControls
    count={6}
    selected={["multiple-choice", "short-answer"]}
    onSelectedChange={onSelectedChange}
    onExplicitCountsChange={onExplicitCountsChange}
  />,
);

expect(screen.getByText("Distribution")).toBeTruthy();
expect(screen.getByText("Balanced automatically")).toBeTruthy();
expect(screen.getByRole("button", { name: "Set exact counts" })).toBeTruthy();
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/interviews/InterviewQuestionTypeControls.test.tsx
```

Expected: FAIL because `Distribution`, `Balanced automatically`, and/or `Set exact counts` do not yet exist.

- [ ] **Step 3: Make the smallest JSX presentation change**

Keep all selection/count logic unchanged. Replace the existing count-action area with a presentation wrapper like:

```tsx
<div className="interview-type-controls__distribution">
  <div>
    <strong>Distribution</strong>
    <span>
      {countsOpen ? "Exact counts" : "Balanced automatically"}
    </span>
  </div>
  {!countsOpen ? (
    <button
      type="button"
      className="interview-secondary-button"
      aria-expanded="false"
      onClick={openCounts}
    >
      Set exact counts
    </button>
  ) : (
    <button
      type="button"
      className="interview-secondary-button"
      aria-expanded="true"
      onClick={() => {
        onExplicitCountsChange(undefined);
        setCountsOpen(false);
      }}
    >
      Use balanced distribution
    </button>
  )}
</div>
```

Do not change `toggleType()`, `openCounts()`, `balancedCounts()`, or `interviewTypeCountsAreValid()`.

- [ ] **Step 4: Replace pill CSS with rectangular responsive tiles**

Use the existing classes, changing presentation only:

```css
.interview-type-controls__options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.interview-type-choice {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  width: 100%;
  min-height: 54px;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #cbd9d0;
  border-radius: 12px;
  color: #2f4d3b;
  background: #fff;
  line-height: 1.3;
}

.interview-type-choice:has(input:checked) {
  border-color: #6b9a7c;
  color: #174e2d;
  background: #eaf3ed;
  box-shadow: inset 3px 0 0 var(--accent);
}

.interview-type-controls__distribution {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #e3ebe5;
}

.interview-type-controls__distribution > div {
  display: grid;
  gap: 2px;
}

.interview-type-controls__distribution span {
  color: var(--text-muted);
  font-size: 0.78rem;
}

@media (max-width: 900px) {
  .interview-type-controls__options {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .interview-type-controls__options {
    grid-template-columns: 1fr;
  }

  .interview-type-controls__distribution {
    align-items: stretch;
    flex-direction: column;
  }
}
```

- [ ] **Step 5: Run the focused tests and confirm GREEN**

Run:

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/interviews/InterviewQuestionTypeControls.test.tsx \
  src/features/interviews/InterviewSessionWorkspace.questionTypes.test.tsx
```

Expected: all tests PASS; selection order, minimum-one-type protection, balanced mode, and explicit counts remain unchanged.

- [ ] **Step 6: Commit Task 1**

```bash
git add \
  frontend/src/features/interviews/InterviewQuestionTypeControls.tsx \
  frontend/src/features/interviews/interviewQuestionTypes.css \
  frontend/src/features/interviews/InterviewQuestionTypeControls.test.tsx

git commit -m "Refine Interview question type controls"
```

---

### Task 2: Convert the Interview workspace from three columns to Question Index + right work column

**Files:**
- Modify: `frontend/src/features/interviews/InterviewSessionWorkspace.tsx`
- Modify: `frontend/src/features/interviews/interviewCoach.css`
- Test: `frontend/src/features/interviews/InterviewSessionWorkspace.test.tsx`
- Test: `frontend/src/features/interviews/InterviewSessionWorkspace.questionTypes.test.tsx`

**Interfaces:**
- Consumes: existing Question Index, Practice Desk, and Saved Attempts sections and all current state/handlers.
- Produces: one new presentational wrapper `.interview-workspace-main`; no new state, props, hooks, API calls, or domain types.

- [ ] **Step 1: Add a failing structure test for the new right-column wrapper**

In the existing workspace test, render a normal written-practice session and assert that Practice Desk and Saved Attempts share the new presentational parent:

```tsx
const practiceDesk = await screen.findByRole("heading", { name: /practice desk/i });
const savedAttempts = screen.getByRole("heading", { name: /saved attempts/i });

const workspaceMain = practiceDesk.closest(".interview-workspace-main");
expect(workspaceMain).toBeTruthy();
expect(workspaceMain?.contains(savedAttempts)).toBe(true);
```

If the accessible heading names differ because the visible `h2` contains the selected category, locate the sections by `aria-labelledby` and assert the same `.interview-workspace-main` ancestry rather than changing production copy.

- [ ] **Step 2: Run the focused workspace test and confirm RED**

Run:

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/interviews/InterviewSessionWorkspace.test.tsx
```

Expected: FAIL because `.interview-workspace-main` does not exist yet.

- [ ] **Step 3: Add only the right-column wrapper in JSX**

Keep the complete existing Question Index section as the first child of `.interview-workspace-grid`. Wrap the complete existing Practice Desk and Saved Attempts sections together without moving or rewriting their internal JSX:

```tsx
<div className="interview-workspace-grid">
  <section className="interview-question-index interview-panel" ...>
    {/* existing Question Index body unchanged */}
  </section>

  <div className="interview-workspace-main">
    <section className="interview-practice-desk interview-panel" ...>
      {/* existing Practice Desk body unchanged */}
    </section>

    <section className="interview-history interview-panel" ...>
      {/* existing Saved Attempts body unchanged */}
    </section>
  </div>
</div>
```

Do not touch `selectQuestion`, `selectAttempt`, attempt reloads, provider operations, notes, explanation, feedback, MCQ handling, or submission logic.

- [ ] **Step 4: Replace the desktop three-column CSS with the approved two-column hierarchy**

Use:

```css
.interview-workspace-grid {
  display: grid;
  grid-template-columns: minmax(280px, 0.38fr) minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.interview-workspace-main {
  display: grid;
  min-width: 0;
  gap: 18px;
}
```

Remove the old three-column declaration and the old 1080px rule that moves `.interview-history` across both grid columns, because Saved Attempts now naturally belongs inside `.interview-workspace-main`.

- [ ] **Step 5: Bound the Question Index list and compact its cards**

Keep heading, filters, and pagination outside the scrolling list. Add:

```css
.interview-question-list {
  max-height: min(68vh, 760px);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 4px;
}

.interview-question-select {
  gap: 4px;
  padding: 11px 12px;
}

.interview-question-select strong {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-height: 1.45;
}
```

Do not truncate or alter the canonical question data; this is display-only line clamping in the index. The full question remains in Practice Desk.

- [ ] **Step 6: Update responsive rules without changing mobile order**

At intermediate widths, keep the two-column concept but narrow the left rail; at the existing mobile breakpoint stack everything:

```css
@media (max-width: 1080px) {
  .interview-workspace-grid {
    grid-template-columns: minmax(240px, 0.42fr) minmax(0, 1fr);
  }
}

@media (max-width: 820px) {
  .interview-workspace-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .interview-question-list {
    max-height: 520px;
  }
}
```

Because `.interview-workspace-main` is the second grid child and contains Practice Desk then Saved Attempts, the mobile order remains Question Index → Practice Desk → Saved Attempts with no JS logic.

- [ ] **Step 7: Run focused workspace regressions**

Run:

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/interviews/InterviewSessionWorkspace.test.tsx \
  src/features/interviews/InterviewSessionWorkspace.questionTypes.test.tsx \
  src/features/interviews/InterviewSessionWorkspace.savedAttempts.test.tsx
```

Expected: PASS with existing selection, notes, attempts, typed submissions, MCQ result, feedback, and stale-state tests unchanged except for any necessary structural selector adjustment.

- [ ] **Step 8: Commit Task 2**

```bash
git add \
  frontend/src/features/interviews/InterviewSessionWorkspace.tsx \
  frontend/src/features/interviews/interviewCoach.css \
  frontend/src/features/interviews/InterviewSessionWorkspace.test.tsx \
  frontend/src/features/interviews/InterviewSessionWorkspace.questionTypes.test.tsx \
  frontend/src/features/interviews/InterviewSessionWorkspace.savedAttempts.test.tsx

git commit -m "Refine Interview workspace layout"
```

Only include `InterviewSessionWorkspace.savedAttempts.test.tsx` in the commit if that file actually changes.

---

### Task 3: Improve Saved Attempts readability within the wide right column

**Files:**
- Modify: `frontend/src/features/interviews/interviewCoach.css`
- Test: `frontend/src/features/interviews/InterviewSessionWorkspace.savedAttempts.test.tsx` only if a structural wrapper/assertion is needed.

**Interfaces:**
- Consumes: existing `.interview-history`, `.interview-attempt-list`, `.interview-attempt-detail`, feedback panel, and pagination markup.
- Produces: presentation-only two-area history layout on wide screens when selected attempt content is present; automatic single-column stacking at narrower widths.

- [ ] **Step 1: Confirm existing Saved Attempts DOM before adding new markup**

Prefer CSS-only changes. Do not create a new React component or new state. If the existing history section already contains the list and selected detail as sibling blocks, keep JSX unchanged.

- [ ] **Step 2: Add wide-layout styling only where the existing DOM supports it**

Use a scoped internal layout such as:

```css
.interview-history {
  align-content: start;
}

.interview-history .interview-attempt-list {
  margin-top: 4px;
}

.interview-history .interview-attempt-detail {
  min-width: 0;
}
```

If the existing DOM has a natural wrapper around list/detail, give that wrapper:

```css
.interview-history__body {
  display: grid;
  grid-template-columns: minmax(240px, 0.42fr) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}
```

If no such wrapper exists, add only this presentational wrapper around existing attempt list/pagination and existing selected-detail block:

```tsx
<div className="interview-history__body">
  <div className="interview-history__list-column">
    {/* existing filter/list/pagination */}
  </div>
  <div className="interview-history__detail-column">
    {/* existing selected-attempt detail */}
  </div>
</div>
```

Do not move any callbacks or change selection logic.

- [ ] **Step 3: Add responsive stacking**

```css
@media (max-width: 980px) {
  .interview-history__body {
    grid-template-columns: minmax(0, 1fr);
  }
}
```

- [ ] **Step 4: Run Saved Attempts regression**

Run:

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/interviews/InterviewSessionWorkspace.savedAttempts.test.tsx \
  src/features/interviews/InterviewSessionWorkspace.questionTypes.test.tsx
```

Expected: PASS; attempts remain immutable/selectable, MCQ result remains post-submit only, and feedback behavior is unchanged.

- [ ] **Step 5: Commit Task 3 if it produces a distinct change**

```bash
git add \
  frontend/src/features/interviews/InterviewSessionWorkspace.tsx \
  frontend/src/features/interviews/interviewCoach.css \
  frontend/src/features/interviews/InterviewSessionWorkspace.savedAttempts.test.tsx

git commit -m "Improve Interview saved attempts layout"
```

If Task 2 already achieves the approved Saved Attempts readability without extra markup, skip this commit rather than adding unnecessary structure.

---

### Task 4: Final automated verification and human layout gate

**Files:**
- No production changes unless verification finds a genuine Task 7R defect.

**Interfaces:**
- Consumes: completed Task 7R branch.
- Produces: a verified Task 7R PR ready for explicit merge approval.

- [ ] **Step 1: Run the focused Task 7/7R suite**

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/interviews/InterviewQuestionTypeControls.test.tsx \
  src/features/interviews/InterviewAnswerControl.test.tsx \
  src/features/interviews/InterviewSessionWorkspace.questionTypes.test.tsx \
  src/features/interviews/InterviewSessionWorkspace.test.tsx \
  src/features/interviews/InterviewSessionWorkspace.savedAttempts.test.tsx
```

Expected: all focused tests PASS.

- [ ] **Step 2: Run frontend typecheck**

```bash
npm run typecheck --workspace @career-learning-hub/web
```

Expected: PASS with no TypeScript errors.

- [ ] **Step 3: Run full frontend regression**

```bash
npm run test --workspace @career-learning-hub/web
```

Expected baseline: the previously verified 78 test files / 959 tests remain green, plus any new Task 7R tests added by this plan.

- [ ] **Step 4: Run frontend production build**

```bash
npm run build --workspace @career-learning-hub/web
```

Expected: PASS. Existing non-failing Vite chunk-size/static-dynamic import advisories may remain if unchanged.

- [ ] **Step 5: Run whitespace and repository-state checks**

```bash
git diff --check origin/phase-19b-interview-coach-refinements...HEAD
git status --short
```

Expected: `git diff --check` produces no output and working tree is clean.

- [ ] **Step 6: Human browser QA at desktop width**

With local frontend/backend already running, verify at roughly 1440–1512 px viewport:

```text
PASS — Question Index is a bounded left navigation surface.
PASS — question list scrolls without making the entire page excessively tall.
PASS — Practice Desk is the dominant right-column surface.
PASS — Saved Attempts is below Practice Desk and has useful width.
PASS — six Question Type choices render as clean rectangular tiles.
PASS — Technical Explanation wraps naturally with no clipping.
PASS — Distribution controls read as part of the Question Type section.
PASS — no horizontal overflow.
```

- [ ] **Step 7: Human browser QA at intermediate/tablet width**

At roughly 900–1000 px:

```text
PASS — workspace remains usable without a squeezed third column.
PASS — Question Type tiles use two columns.
PASS — Question Index and work column remain readable.
PASS — Saved Attempts does not overflow.
```

- [ ] **Step 8: Human browser QA at mobile width**

At roughly 390–430 px:

```text
PASS — order is Question Index → Practice Desk → Saved Attempts.
PASS — Question Type tiles use one column.
PASS — buttons and native checkbox/radio targets remain usable.
PASS — no horizontal overflow or clipped text.
```

- [ ] **Step 9: Open/update the draft PR and stop at merge approval gate**

The PR must target `phase-19b-interview-coach-refinements`, not `main`, and must state that Task 8 live Gemini acceptance remains pending.

Do not merge until the user explicitly provides Task 7R merge approval after green automated verification and human browser QA.
