# Phase 19B-3 Task 7R — Question Explanation Status Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `interview.question.explain` use the compact Career Learning Hub Interview job-status treatment already used by Question Generation, with one visible success signal: `✓ Explanation ready`.

**Architecture:** Reuse the safe `data-job-type` / `data-job-status` hooks already exposed by `JobResilienceActions`. Add only an explanation-specific completed label to the shared presentation component, extend the existing Interview-scoped job-status CSS selectors to `interview.question.explain`, and suppress the redundant standalone successful explanation status message in `InterviewSessionWorkspace` while preserving all job polling, cancellation, retry, and question-refresh behavior.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, CSS.

## Global Constraints

- Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.
- Preserve job type `interview.question.explain`.
- Do not change explanation prompts, Gemini/provider routing, backend APIs, polling cadence, cancellation/retry semantics, persistence, or explanation content.
- Do not redesign feedback-job status in this task.
- Do not change Question Generation behavior.
- Keep one visible successful explanation signal only: `✓ Explanation ready`.
- Keep Model answer / Explanation content rendering unchanged.
- Do not merge PR #13, deploy, merge to `main`, delete branches, or start Task 8 without separate authorization.

---

### Task 1: Lock Explanation Completion Semantics with a Failing Test

**Files:**
- Modify: `frontend/src/features/jobs/JobResilienceActions.test.tsx`

**Interfaces:**
- Consumes: `JobResilienceActions({ job, onCancel?, onRetry? })` and safe job fields `type`, `status`, `phase`, `progress`.
- Produces: regression coverage that requires completed `interview.question.explain` jobs to announce `✓ Explanation ready` while retaining safe `data-job-type` / `data-job-status` hooks.

- [ ] **Step 1: Add the focused failing test**

Add this test beside the existing Question Generation status test:

```tsx
it("announces a compact completed explanation success state", () => {
  const view = render(
    <JobResilienceActions
      job={{
        ...activeJob,
        type: "interview.question.explain",
        status: "completed",
        phase: "completed",
        progress: 100,
      }}
    />,
  );

  const root = view.container.querySelector(".job-resilience-actions");
  expect(root?.getAttribute("data-job-type")).toBe(
    "interview.question.explain",
  );
  expect(root?.getAttribute("data-job-status")).toBe("completed");
  expect(screen.getByRole("status").textContent).toBe("✓ Explanation ready");
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/jobs/JobResilienceActions.test.tsx \
  -t "announces a compact completed explanation success state"
```

Expected: FAIL because the current component falls through to the generic completed phase label instead of `✓ Explanation ready`.

- [ ] **Step 3: Commit only the RED test**

```bash
git add frontend/src/features/jobs/JobResilienceActions.test.tsx
git commit -m "test: require explanation success status"
```

---

### Task 2: Add the Minimal Explanation Success Label

**Files:**
- Modify: `frontend/src/features/jobs/JobResilienceActions.tsx`
- Test: `frontend/src/features/jobs/JobResilienceActions.test.tsx`

**Interfaces:**
- Consumes: existing `job.type`, `job.status`, `phaseLabel(job.phase)`.
- Produces: `✓ Explanation ready` only for `interview.question.explain` + `completed`; all other job labels remain unchanged.

- [ ] **Step 1: Extend `statusMessage` without changing action logic**

Replace the current two-way generation/generic expression with explicit completed Interview presentation labels:

```tsx
const statusMessage =
  job.status === "completed" && job.type === "interview.questions.generate"
    ? "✓ Questions generated successfully"
    : job.status === "completed" && job.type === "interview.question.explain"
      ? "✓ Explanation ready"
      : phaseLabel(job.phase);
```

Do not modify `canCancel`, `canRetry`, `runAction`, error handling, abort behavior, or the rendered action buttons.

- [ ] **Step 2: Run all shared job-resilience component tests**

Run:

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/jobs/JobResilienceActions.test.tsx
```

Expected: all tests PASS.

- [ ] **Step 3: Commit the minimal shared presentation change**

```bash
git add frontend/src/features/jobs/JobResilienceActions.tsx
git commit -m "refine Interview explanation success status"
```

---

### Task 3: Extend the Interview-Scoped Compact Status Styling

**Files:**
- Modify: `frontend/src/features/interviews/interviewGenerationStatus.css`

**Interfaces:**
- Consumes: `.interview-job-status`, `.job-resilience-actions[data-job-type][data-job-status]`, existing DOM structure and progress/actions from `JobResilienceActions`.
- Produces: the same compact queued/processing/completed visual treatment for both `interview.questions.generate` and `interview.question.explain` without affecting Resume, Learning, or feedback jobs.

- [ ] **Step 1: Extend queued/processing selectors**

For every selector currently scoped only to:

```css
.job-resilience-actions[data-job-type="interview.questions.generate"]
```

add an equivalent selector for:

```css
.job-resilience-actions[data-job-type="interview.question.explain"]
```

Cover both `queued` and `processing` states for:

- container grid layout;
- title;
- state badge;
- progress bar;
- `display: contents` on `.job-resilience-actions`;
- phase/status text;
- action placement;
- Cancel/Retry button treatment;
- the mobile `max-width: 560px` rules.

Do not add selectors for `interview.attempt.feedback`.

- [ ] **Step 2: Extend completed selectors**

Apply the existing compact green completed treatment to:

```css
.job-resilience-actions[data-job-type="interview.question.explain"][data-job-status="completed"]
```

so the outer title, state badge, and progress meter are hidden and the shared role-status text becomes the sole compact success content.

- [ ] **Step 3: Commit the Interview-only style extension**

```bash
git add frontend/src/features/interviews/interviewGenerationStatus.css
git commit -m "style Interview explanation job status"
```

---

### Task 4: Remove the Duplicate Visible Explanation Completion Message

**Files:**
- Modify: `frontend/src/features/interviews/InterviewSessionWorkspace.tsx`
- Modify: `frontend/src/features/interviews/InterviewSessionWorkspace.test.tsx`

**Interfaces:**
- Consumes: `scope` inside the existing completed provider-job handling and `statusMessage` rendered by `.interview-sr-status`.
- Produces: generation keeps `Question generation completed.`; feedback keeps `Practice feedback is ready.`; successful queued/polled explanation does not set the redundant standalone `Explanation is ready.` because the completed explanation job strip already communicates success.

- [ ] **Step 1: Add a focused workspace assertion**

In the existing explanation polling/completion test, after the completed explanation job is adopted, assert:

```tsx
expect(screen.getByText("✓ Explanation ready")).not.toBeNull();
expect(screen.queryByText("Explanation is ready.")).toBeNull();
```

Keep existing assertions that the canonical question reload occurs and the generated Model answer / Explanation content appears.

- [ ] **Step 2: Change only successful explanation status-message assignment**

In the existing completed-job block, preserve generation and feedback messages but return an empty standalone status message for explanation:

```tsx
setStatusMessage(
  scope === "generation"
    ? "Question generation completed."
    : scope === "explanation"
      ? ""
      : FEEDBACK_READY_MESSAGE,
);
```

Do not change the surrounding completion branch, active job state, question reload, provider operation guards, or polling code.

- [ ] **Step 3: Run the focused explanation workspace regression**

Run the most specific existing explanation test name from `InterviewSessionWorkspace.test.tsx`, or if necessary:

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/interviews/InterviewSessionWorkspace.test.tsx \
  -t "explanation"
```

Expected: explanation request/poll/completion tests PASS, `✓ Explanation ready` is visible, standalone `Explanation is ready.` is absent, and canonical explanation content still renders.

- [ ] **Step 4: Commit the duplicate-message suppression**

```bash
git add \
  frontend/src/features/interviews/InterviewSessionWorkspace.tsx \
  frontend/src/features/interviews/InterviewSessionWorkspace.test.tsx
git commit -m "avoid duplicate explanation completion status"
```

---

### Task 5: Final Verification and Human QA

**Files:**
- No new production files.

**Interfaces:**
- Verifies the integrated Task 7R branch; produces no new behavior.

- [ ] **Step 1: Run focused status and Interview regressions**

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/jobs/JobResilienceActions.test.tsx \
  src/features/interviews/InterviewSessionWorkspace.test.tsx \
  src/features/interviews/InterviewAnswerControl.test.tsx \
  src/features/interviews/InterviewSessionWorkspace.questionTypes.test.tsx \
  src/features/interviews/InterviewSessionWorkspace.savedAttempts.test.tsx
```

Expected: all focused tests PASS.

- [ ] **Step 2: Run frontend typecheck**

```bash
npm run typecheck --workspace @career-learning-hub/web
```

Expected: PASS.

- [ ] **Step 3: Run full frontend regression**

```bash
npm run test --workspace @career-learning-hub/web
```

Expected: all frontend test files/tests PASS; only previously known unrelated warning output may remain.

- [ ] **Step 4: Run production build**

```bash
npm run build --workspace @career-learning-hub/web
```

Expected: PASS; existing Vite chunk/import warnings remain non-blocking unless they become errors.

- [ ] **Step 5: Verify clean diff**

```bash
git diff --check origin/phase-19b-interview-coach-refinements...HEAD
git status --short
```

Expected: no `git diff --check` output and clean working tree.

- [ ] **Step 6: Human browser QA**

On a normal desktop Interview session:

1. Click `Request explanation` on a question that requires a Gemini explanation job.
2. While running, confirm the status uses the compact green/neutral strip with `Question explanation`, safe phase copy such as `Contacting Gemini`, restrained progress, and Cancel when valid.
3. On completion, confirm the strip becomes `✓ Explanation ready`.
4. Confirm no large purple completed progress panel remains.
5. Confirm the separate visible `Explanation is ready.` line does not appear.
6. Confirm Model answer / Explanation content still renders correctly.
7. Confirm Question Generation still uses its existing compact `✓ Questions generated successfully` treatment.

- [ ] **Step 7: Stop at Task 7R merge approval gate**

Do not merge PR #13 until the user provides explicit Task 7R merge approval.
