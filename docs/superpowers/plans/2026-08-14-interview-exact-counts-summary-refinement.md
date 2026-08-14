# Interview Exact-Counts Summary Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the exact-count total into the Distribution subtitle and remove the redundant valid summary line without changing generation or validation behavior.

**Architecture:** Keep `InterviewQuestionTypeControls` as the single owner of Distribution presentation. Reuse the existing `explicitTotal`, `count`, and `explicitCountsValid` values to derive a concise subtitle; preserve the existing alert row only for invalid totals. No API, backend, Gemini, or workspace changes are required.

**Tech Stack:** React, TypeScript, Vitest, Testing Library.

## Global Constraints

- Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.
- Valid exact mode must display `Exact counts · N total` in the Distribution subtitle.
- Invalid exact mode must display `Exact counts · X of N` and retain the existing accessible validation error below the inputs.
- The separate valid line `Exact counts total N.` must no longer render.
- Balanced mode and the already-approved single-type Distribution state must remain unchanged.
- Do not change generation requests, `typeCounts`, Gemini/provider behavior, API contracts, backend behavior, or manual question creation.

---

### Task 1: Refine exact-count Distribution summary

**Files:**
- Modify: `frontend/src/features/interviews/InterviewQuestionTypeControls.tsx`
- Test: `frontend/src/features/interviews/InterviewQuestionTypeControls.test.tsx`

**Interfaces:**
- Consumes: existing `count`, `explicitTotal`, `explicitCountsValid`, `countsOpen`, `explicitCounts`, and `selected` state.
- Produces: concise exact-mode subtitle plus invalid-only validation feedback.

- [ ] **Step 1: Update focused tests for valid and invalid exact-count presentation**

Extend the existing exact-count tests so valid mode expects:

```ts
expect(screen.getByText("Exact counts · 4 total")).not.toBeNull();
expect(screen.queryByText("Exact counts total 4.")).toBeNull();
```

After changing the top-level Question count to create a mismatch, expect:

```ts
expect(screen.getByText("Exact counts · 4 of 5")).not.toBeNull();
expect(screen.getByRole("alert").textContent).toMatch(
  /Exact counts total 4; they must equal Question count 5/i,
);
```

Keep the existing balanced and single-type assertions unchanged.

- [ ] **Step 2: Implement the minimal Distribution subtitle change**

In `InterviewQuestionTypeControls.tsx`, derive the multi-type subtitle as:

```ts
const distributionLabel = countsOpen
  ? explicitCountsValid
    ? `Exact counts · ${explicitTotal} total`
    : `Exact counts · ${explicitTotal} of ${count}`
  : "Balanced automatically";
```

Continue to use the existing single-type message when `singleTypeLabel` is present.

- [ ] **Step 3: Render the validation summary only when exact counts are invalid**

Replace the always-rendered exact-count summary paragraph with an invalid-only alert:

```tsx
{!explicitCountsValid ? (
  <p className="interview-type-controls__error" role="alert">
    {`Exact counts total ${explicitTotal}; they must equal Question count ${count}.`}
  </p>
) : null}
```

Do not add a valid summary paragraph.

- [ ] **Step 4: Run focused and regression verification**

Run:

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/interviews/InterviewQuestionTypeControls.test.tsx

npm run test --workspace @career-learning-hub/web -- \
  src/features/interviews/InterviewSessionWorkspace.questionTypes.test.tsx \
  src/features/interviews/interviewQuestionTypeApi.test.ts

npm run typecheck --workspace @career-learning-hub/web
npm run test --workspace @career-learning-hub/web
npm run build --workspace @career-learning-hub/web
git diff --check origin/phase-19b-interview-coach-refinements...HEAD
git status --short
```

Expected: all focused tests, full frontend regression, typecheck, production build, and diff check pass; working tree is clean.

- [ ] **Step 5: Commit the implementation**

Commit only the two frontend files with a focused message such as:

```bash
git add frontend/src/features/interviews/InterviewQuestionTypeControls.tsx \
        frontend/src/features/interviews/InterviewQuestionTypeControls.test.tsx
git commit -m "Refine Interview exact-count summary"
```
