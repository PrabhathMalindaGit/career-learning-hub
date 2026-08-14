# Interview Practice Feedback Status Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `interview.attempt.feedback` use the same compact Interview status treatment as Question Generation and Question Explanation, with one `✓ Practice feedback ready` completion signal and no duplicate standalone success line.

**Architecture:** Reuse the existing `JobResilienceActions` job-type/status hooks and the Interview-only `interviewGenerationStatus.css` selectors. Add only feedback-specific completed copy to the shared presentation component, then extend the existing Interview-scoped selector group to `interview.attempt.feedback`; do not edit feedback polling, scoring, persistence, or result rendering.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, CSS.

## Global Constraints

- Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.
- Do not change backend endpoints, schema, Gemini/provider behavior, feedback prompts, scoring, ownership, persistence, polling cadence, Cancel/Retry semantics, or Saved Attempts behavior.
- Do not redesign the existing feedback result card.
- Keep Resume and Learning job presentation unchanged.
- Keep all work on `task/phase-19b3-task7r-interview-layout-refinement` / PR #13; do not change `main`.

---

### Task 1: Add Practice Feedback completion semantics and compact Interview styling

**Files:**
- Modify: `frontend/src/features/jobs/JobResilienceActions.test.tsx`
- Modify: `frontend/src/features/jobs/JobResilienceActions.tsx`
- Modify: `frontend/src/features/interviews/interviewGenerationStatus.css`

**Interfaces:**
- Consumes: existing `SafeJob.type`, `SafeJob.status`, `phaseLabel`, `data-job-type`, and `data-job-status` presentation hooks.
- Produces: completed `interview.attempt.feedback` jobs announce exactly `✓ Practice feedback ready`; queued/processing/completed feedback jobs receive the existing compact Interview status presentation.

- [ ] **Step 1: Add the focused feedback completion test**

Add a test beside the existing generation/explanation success tests:

```tsx
it("announces a compact completed practice feedback success state", () => {
  const view = render(
    <JobResilienceActions
      job={{
        ...activeJob,
        type: "interview.attempt.feedback",
        status: "completed",
        phase: "completed",
        progress: 100,
      }}
    />,
  );

  const root = view.container.querySelector(".job-resilience-actions");
  expect(root?.getAttribute("data-job-type")).toBe(
    "interview.attempt.feedback",
  );
  expect(root?.getAttribute("data-job-status")).toBe("completed");
  expect(screen.getByRole("status").textContent).toBe(
    "✓ Practice feedback ready",
  );
});
```

- [ ] **Step 2: Add the minimal shared presentation copy**

Extend `statusMessage` in `JobResilienceActions.tsx` so only completed Interview feedback jobs get the new copy:

```tsx
const statusMessage =
  job.status === "completed" && job.type === "interview.questions.generate"
    ? "✓ Questions generated successfully"
    : job.status === "completed" && job.type === "interview.question.explain"
      ? "✓ Explanation ready"
      : job.status === "completed" && job.type === "interview.attempt.feedback"
        ? "✓ Practice feedback ready"
        : phaseLabel(job.phase);
```

Do not alter Cancel/Retry/action behavior.

- [ ] **Step 3: Extend the Interview-only compact selectors**

In `interviewGenerationStatus.css`, add:

```css
[data-job-type="interview.attempt.feedback"]
```

to each existing `:is(...)` group that currently includes generation and explanation for queued, processing, completed, status text, progress, actions, buttons, and mobile treatment.

This should make feedback processing visually match the already-approved compact green/neutral Interview treatment without affecting other job types.

- [ ] **Step 4: Suppress the duplicate standalone success line**

Generalize the existing completed-explanation suppression so a completed feedback strip also hides `.interview-sr-status` while present:

```css
.interview-workspace:has(
    .job-resilience-actions:is(
        [data-job-type="interview.question.explain"],
        [data-job-type="interview.attempt.feedback"]
      )[data-job-status="completed"]
  ) .interview-sr-status {
  display: none;
}
```

This is presentation-only. Do not remove or rewrite workspace status state.

- [ ] **Step 5: Run focused GREEN tests**

Run:

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/jobs/JobResilienceActions.test.tsx

npm run test --workspace @career-learning-hub/web -- \
  src/features/interviews/InterviewSessionWorkspace.test.tsx \
  -t "polls queued feedback and reloads the bound canonical attempt|clears completed feedback messaging when another attempt is selected"
```

Expected: all selected tests PASS.

- [ ] **Step 6: Run the frontend regression gate**

Run:

```bash
npm run typecheck --workspace @career-learning-hub/web
npm run test --workspace @career-learning-hub/web
npm run build --workspace @career-learning-hub/web
git diff --check origin/phase-19b-interview-coach-refinements...HEAD
git status --short
```

Expected: typecheck PASS, full frontend PASS, production build PASS, diff check clean, working tree clean.

- [ ] **Step 7: Browser QA**

Verify an attempt that requests AI feedback:

Processing:

```text
Practice feedback                         Processing
Contacting Gemini      [progress]          Cancel
```

Completed:

```text
✓ Practice feedback ready
```

Confirm:
- no large purple completed panel;
- no separate visible `Practice feedback is ready.` line while the completed strip is present;
- score, summary, strengths, improvements, suggested answer outline, timestamp, and disclaimer are unchanged;
- selecting another attempt still clears the completed feedback message according to existing behavior.
