# Interview Generation Status Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the large purple Interview question-generation job panel with a compact Career Learning Hub processing strip and compact green success confirmation while preserving the existing generation job lifecycle exactly.

**Architecture:** Keep `activeJob`, polling, cancellation, retry, progress, UUID/idempotency, stale-operation guards, and Gemini/backend contracts unchanged. Make the smallest state-specific presentation change in `InterviewSessionWorkspace.tsx` so completed generation can render a compact success variant, then scope all visual treatment to Interview Coach CSS so Resume/Learning job UI is unaffected.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, existing Career Learning Hub CSS.

## Global Constraints

- Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.
- Base branch: `phase-19b-interview-coach-refinements`.
- Task branch: `task/phase-19b3-task7r-interview-layout-refinement`.
- Existing draft PR: `#13`.
- Preserve the same Gemini request payload, polling cadence, progress data, Cancel/Retry behavior, duplicate suppression, UUID/idempotency behavior, stale-route/stale-operation guards, question refresh/adoption, provider errors, and request-ID handling.
- No backend, API contract, provider routing, database, auth/ownership, dependency, deployment, or `main` changes.
- Processing must remain readable without relying on color alone.
- Completed generation must render a compact green `Questions generated successfully` confirmation with no completed progress meter.

---

### Task 1: Add focused processing/completed generation presentation coverage

**Files:**
- Test: `frontend/src/features/interviews/InterviewSessionWorkspace.test.tsx`

**Interfaces:**
- Consumes: existing `generateInterviewQuestions()`, `pollInterviewJob()`, `activeJob`, and current Question Generation status rendering.
- Produces: regression coverage proving a completed generation uses the compact success presentation while generation job semantics remain unchanged.

- [ ] **Step 1: Extend the existing successful generation test with the new presentation assertions**

After the mocked generation poll resolves with a terminal `completed` job, assert:

```tsx
expect(
  await screen.findByText("Questions generated successfully"),
).not.toBeNull();

const status = screen.getByLabelText("Provider job status");
expect(status.classList.contains("interview-job-status--success")).toBe(true);
expect(within(status).queryByRole("progressbar")).toBeNull();
expect(within(status).queryByText(/^Completed$/i)).toBeNull();
```

Keep the existing UUID, polling, and canonical question reload assertions in the same test.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/interviews/InterviewSessionWorkspace.test.tsx \
  -t "uses one generation UUID, polls the accepted job, and reloads canonical questions"
```

Expected: FAIL because the current completed job still renders the generic purple panel, `Completed`, and a 100% progress meter instead of the approved compact success confirmation.

---

### Task 2: Implement the compact generation processing/success presentation

**Files:**
- Modify: `frontend/src/features/interviews/InterviewSessionWorkspace.tsx`
- Modify: `frontend/src/features/interviews/interviewCoach.css`
- Test: `frontend/src/features/interviews/InterviewSessionWorkspace.test.tsx`

**Interfaces:**
- Consumes: existing `activeJob`, `JobResilienceActions`, `normalizeSafeJob()`, `cancelActiveJob`, `retryActiveJob`, `resumeStatusChecks()`.
- Produces: state-specific Interview-only classes/copy; no new API or state-machine interface.

- [ ] **Step 1: Add the smallest state-specific render distinction**

Near the existing job-status render, derive only presentation booleans:

```tsx
const generationCompleted =
  activeJob?.scope === "generation" && activeJob.job.status === "completed";
```

Render the existing job-status section with a success modifier when `generationCompleted`:

```tsx
<section
  className={`interview-job-status${
    generationCompleted ? " interview-job-status--success" : ""
  }`}
  aria-label="Provider job status"
  aria-live="polite"
>
```

For completed generation only, render:

```tsx
<div className="interview-job-status__success">
  <span aria-hidden="true">✓</span>
  <strong>Questions generated successfully</strong>
</div>
```

Do **not** render the generic status label, progress element, or `JobResilienceActions` for a successfully completed generation job. All queued/processing/failed/cancelled/paused behavior continues through the existing generic branch unchanged.

- [ ] **Step 2: Scope the processing strip to Career Learning Hub green/neutral styling**

Replace the purple Interview-only `.interview-job-status` treatment with a compact neutral/green strip:

```css
.interview-job-status {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(110px, 0.34fr) auto;
  gap: 10px 14px;
  align-items: center;
  padding: 11px 14px;
  border: 1px solid #cbdcd0;
  border-left: 4px solid #34704c;
  border-radius: 12px;
  color: #294637;
  background: #f7fbf8;
  box-shadow: 0 8px 20px rgba(22, 58, 36, 0.04);
}

.interview-job-status progress {
  width: 100%;
  accent-color: var(--accent);
}

.interview-job-status button {
  min-height: var(--minimum-interactive-target);
  padding: 7px 11px;
  border: 1px solid #b9cdbf;
  border-radius: 9px;
  color: #245e3c;
  background: #fff;
  font-weight: 750;
}
```

The exact grid may adapt to the existing `JobResilienceActions` DOM, but must remain compact and responsive.

- [ ] **Step 3: Add the compact success variant**

```css
.interview-job-status--success {
  display: flex;
  width: fit-content;
  max-width: 100%;
  padding: 9px 13px;
  border-color: #b8d2c0;
  border-left-color: #2f7a4c;
  color: #205a38;
  background: #edf7f0;
  box-shadow: none;
}

.interview-job-status__success {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
```

On small widths, keep processing content readable and allow controls to wrap/stack; do not create horizontal overflow.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run:

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/interviews/InterviewSessionWorkspace.test.tsx
```

Expected: all Interview workspace tests PASS, including generation UUID/polling/reload behavior and the new success presentation assertions.

- [ ] **Step 5: Run Task 7R / generation regression gate**

Run:

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/interviews/InterviewSessionWorkspace.test.tsx \
  src/features/interviews/InterviewSessionWorkspace.questionTypes.test.tsx \
  src/features/jobs/JobResilienceActions.test.tsx

npm run typecheck --workspace @career-learning-hub/web
npm run test --workspace @career-learning-hub/web
npm run build --workspace @career-learning-hub/web
git diff --check origin/phase-19b-interview-coach-refinements...HEAD
```

Expected: all tests, typecheck, build, and diff check PASS.

- [ ] **Step 6: Human browser QA**

Use one controlled local generation run and confirm:

1. queued/processing generation renders a compact neutral/green strip;
2. `Question generation`, the current human-readable message such as `Contacting Gemini`, and Cancel remain visible while relevant;
3. progress remains visible but restrained while processing;
4. successful completion becomes only `✓ Questions generated successfully` in a compact green confirmation;
5. no completed progress bar or separate `Completed` label remains;
6. generated questions stay immediately readable below;
7. Retry/cancelled/failed behavior is not visually or functionally weakened.

- [ ] **Step 7: Commit implementation**

```bash
git add \
  frontend/src/features/interviews/InterviewSessionWorkspace.tsx \
  frontend/src/features/interviews/InterviewSessionWorkspace.test.tsx \
  frontend/src/features/interviews/interviewCoach.css

git commit -m "Refine Interview generation status"
```

## Verification and Merge Control

- Keep PR #13 draft until all automated and human QA is green.
- Do not merge without explicit `PHASE_19B3_TASK_7R_MERGE_APPROVED`.
- Do not deploy, merge to `main`, delete the task branch, or begin Task 8 automatically.
