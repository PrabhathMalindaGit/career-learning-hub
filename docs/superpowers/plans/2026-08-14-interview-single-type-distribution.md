# Interview Single-Type Distribution Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove redundant exact-count controls when only one Interview question type is selected while preserving the existing multi-type balanced/exact distribution workflow.

**Architecture:** Keep all behavior inside `InterviewQuestionTypeControls`. Derive the single-type presentation from the existing `selected` array, reuse `QUESTION_TYPE_LABELS` for display copy, and clear parent `explicitCounts` when a user deselects from two types to one while exact-count mode is active. Do not change API request construction, backend contracts, Gemini behavior, or workspace architecture.

**Tech Stack:** React, TypeScript, Vitest, Testing Library.

## Global Constraints

- Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.
- Exactly one selected type must show `All N question(s) will be TYPE.` and no exact-count controls.
- Two or more selected types retain the existing balanced/exact-count workflow.
- Reducing exact mode to one selected type must call `onExplicitCountsChange(undefined)` and close exact-count mode.
- Preserve selected order, validation, Question count semantics, categories, generation UUID/idempotency behavior, Gemini Direct behavior, manual question creation, and typed Interview contracts.
- No backend, API/schema, deployment, or `main` changes.

---

### Task 1: Simplify single-type Distribution and protect transitions

**Files:**
- Modify: `frontend/src/features/interviews/InterviewQuestionTypeControls.tsx`
- Test: `frontend/src/features/interviews/InterviewQuestionTypeControls.test.tsx`

**Interfaces:**
- Consumes: `count: number`, `selected: InterviewQuestionType[]`, `explicitCounts?: Partial<Record<InterviewQuestionType, number>>`, `onSelectedChange`, `onExplicitCountsChange`, and `QUESTION_TYPE_LABELS`.
- Produces: the same component props/API as before; only the Distribution presentation and exact-count cleanup behavior change.

- [ ] **Step 1: Extend focused tests for the approved single-type behavior**

Add focused coverage that proves:

```tsx
render(
  <InterviewQuestionTypeControls
    count={10}
    selected={["short-answer"]}
    onSelectedChange={vi.fn()}
    onExplicitCountsChange={vi.fn()}
  />,
);

expect(screen.getByText("All 10 questions will be Short Answer.")).not.toBeNull();
expect(screen.queryByRole("button", { name: "Set exact counts" })).toBeNull();
expect(screen.queryByRole("button", { name: "Use balanced distribution" })).toBeNull();
expect(screen.queryByRole("spinbutton")).toBeNull();
```

Also add controlled-harness coverage proving:

```text
one type -> single-type message
select second type -> Balanced automatically + Set exact counts
open exact counts -> explicit mode
remove second type -> explicit counts cleared, exact controls disappear, single-type message returns
```

Expose the harness distribution state through a test-only `<output aria-label="Distribution mode">` so the test can verify the parent state is actually reset to `undefined`, not merely hidden.

- [ ] **Step 2: Implement the minimal single-type presentation**

In `InterviewQuestionTypeControls` derive:

```ts
const singleType = selected.length === 1 ? selected[0] : undefined;
const singleTypeLabel = singleType ? QUESTION_TYPE_LABELS[singleType] : undefined;
const questionNoun = count === 1 ? "question" : "questions";
```

For exactly one selected type, render the existing `Distribution` heading plus:

```tsx
<span>{`All ${count} ${questionNoun} will be ${singleTypeLabel}.`}</span>
```

Do not render either distribution-mode button or the exact-count inputs in this state.

For two or more selected types, preserve the current `Balanced automatically`, `Set exact counts`, exact inputs, validation summary, and `Use balanced distribution` behavior.

- [ ] **Step 3: Clear stale exact-count state when deselecting to one type**

Inside `toggleType`, compute the next selected array before updating parent state. If a user-driven deselection leaves exactly one selected type:

```ts
onSelectedChange(nextSelected);
if (explicitCounts !== undefined) {
  onExplicitCountsChange(undefined);
}
setCountsOpen(false);
return;
```

For all remaining 2+ type cases, preserve the existing exact-count deletion logic for only the deselected type.

Initialize local exact-count visibility defensively so an already-inconsistent one-type prop combination does not render exact-count UI:

```ts
useState(explicitCounts !== undefined && selected.length > 1)
```

- [ ] **Step 4: Run focused GREEN verification**

Run:

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/interviews/InterviewQuestionTypeControls.test.tsx
```

Expected: all Question Type control tests PASS.

- [ ] **Step 5: Run typed Interview generation regression**

Run:

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/interviews/InterviewSessionWorkspace.questionTypes.test.tsx \
  src/features/interviews/interviewQuestionTypeApi.test.ts
```

Expected: generation request shape and typed Interview behavior remain PASS.

- [ ] **Step 6: Run frontend quality gate**

Run:

```bash
npm run typecheck --workspace @career-learning-hub/web
npm run test --workspace @career-learning-hub/web
npm run build --workspace @career-learning-hub/web
git diff --check origin/phase-19b-interview-coach-refinements...HEAD
git status --short
```

Expected: typecheck PASS, full frontend regression PASS, production build PASS, diff check clean, working tree clean.

- [ ] **Step 7: Browser QA**

Verify:

```text
Question count = 10 + Short Answer only
-> Distribution: All 10 questions will be Short Answer.
-> no Set exact counts
-> no spinbutton

Add Coding
-> Balanced automatically
-> Set exact counts appears

Open exact counts, then remove Coding
-> exact mode closes automatically
-> single-type message returns
-> generation remains valid
```

- [ ] **Step 8: Commit**

Commit the focused production/test changes to the existing Task 7R branch with a message such as:

```bash
git commit -m "refine single-type interview distribution"
```
