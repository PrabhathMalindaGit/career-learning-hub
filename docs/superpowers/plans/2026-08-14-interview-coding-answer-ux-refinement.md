# Interview Coding Answer UX Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Coding interview attempts clearly code-oriented and self-explanatory without changing the existing typed-answer contract or adding code execution.

**Architecture:** Reuse `InterviewAnswerControl` as the single answer-surface component. Add Coding-only copy/attributes in that component, extend its focused test, and refine the existing Coding CSS hook in `interviewQuestionTypes.css`. Do not modify the workspace state machine, APIs, backend, Gemini, scoring, or persistence.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, existing Career Learning Hub CSS.

## Global Constraints

- Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.
- Coding remains `{ type: "coding", text: string }` with the existing 12,000-character bound.
- Do not add Run / Execute, compiler, sandbox, language runtime, automatic tests, Monaco, CodeMirror, or any new editor dependency.
- Coding submissions are reviewed as text and must never be presented as executed.
- Preserve all non-Coding answer labels and behavior.
- Keep PR #13 scoped to the existing Task 7R branch; do not deploy or merge to `main`.

---

### Task 1: Lock the Coding-specific answer semantics with a failing test

**Files:**
- Modify: `frontend/src/features/interviews/InterviewAnswerControl.test.tsx`

**Interfaces:**
- Consumes: `InterviewAnswerControl` and the existing `question("coding")` fixture.
- Produces: a focused regression test for Coding-only label, helper copy, placeholder, spellcheck behavior, rows, coding class, and absence of execution controls.

- [ ] **Step 1: Update the existing Coding test to express the approved UX**

Replace the current Coding-only assertion body with checks equivalent to:

```tsx
const textarea = screen.getByRole("textbox", { name: /Your code/ });
expect(textarea.className).toContain("interview-answer-control__coding");
expect(textarea.getAttribute("rows")).toBe("12");
expect(textarea.getAttribute("placeholder")).toBe(
  "Write or paste the code you would submit in an interview…",
);
expect(textarea.getAttribute("spellcheck")).toBe("false");
expect(
  screen.getByText(
    /Complete only the function or solution requested by the question/i,
  ),
).not.toBeNull();
expect(
  screen.getByText(/reviewed as text and is not executed/i),
).not.toBeNull();
expect(screen.queryByRole("button", { name: /run|execute/i })).toBeNull();
```

- [ ] **Step 2: Run the focused Coding test and confirm RED**

Run:

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/interviews/InterviewAnswerControl.test.tsx \
  -t "renders Coding as a clearer code-entry surface with no execution control"
```

Expected: FAIL because the current component still exposes `Coding answer`, has no helper copy/placeholder, and does not set `spellCheck={false}`.

- [ ] **Step 3: Commit the RED test**

Commit only the focused test change before implementation.

---

### Task 2: Implement the minimal Coding-only answer-surface refinement

**Files:**
- Modify: `frontend/src/features/interviews/InterviewAnswerControl.tsx`
- Modify: `frontend/src/features/interviews/interviewQuestionTypes.css`
- Test: `frontend/src/features/interviews/InterviewAnswerControl.test.tsx`

**Interfaces:**
- Consumes: `question.questionType`, existing `textValue`, `onTextChange`, `onSubmit`, and the existing `interview-answer-control__coding` class.
- Produces: the same textarea value and submit behavior, with Coding-only copy and presentation attributes.

- [ ] **Step 1: Add Coding-only copy in `InterviewAnswerControl.tsx`**

Use a Coding-specific label of `Your code` while leaving every other type unchanged.

Add helper copy only for Coding:

```tsx
<p className="interview-answer-control__coding-help">
  Complete only the function or solution requested by the question. You do not
  need unrelated application boilerplate.
</p>
```

Add an execution-scope notice only for Coding:

```tsx
<p className="interview-answer-control__coding-notice">
  Your submission is reviewed as text and is not executed.
</p>
```

For the Coding textarea only, set:

```tsx
placeholder="Write or paste the code you would submit in an interview…"
spellCheck={false}
```

Do not change `maxLength`, `value`, validation, `onChange`, or submit behavior.

- [ ] **Step 2: Refine the existing Coding textarea CSS**

Keep `.interview-answer-control__coding` as a native textarea and extend it with a restrained code-entry surface, for example:

```css
.interview-answer-control__coding {
  min-height: 260px;
  padding: 14px 16px;
  border-color: #bfcfc4;
  background: #f8fbf9;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", monospace;
  font-size: 0.9rem;
  line-height: 1.65;
  tab-size: 2;
}

.interview-answer-control__coding:focus {
  border-color: #5f9271;
  box-shadow: 0 0 0 3px rgba(42, 103, 67, 0.1);
}

.interview-answer-control__coding-help,
.interview-answer-control__coding-notice {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.78rem;
  line-height: 1.5;
}

.interview-answer-control__coding-notice {
  padding: 9px 11px;
  border: 1px solid #d8e3db;
  border-radius: 10px;
  background: #f5f9f6;
}
```

Do not introduce syntax highlighting, execution affordances, or dependencies.

- [ ] **Step 3: Run the focused `InterviewAnswerControl` suite and confirm GREEN**

Run:

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/interviews/InterviewAnswerControl.test.tsx
```

Expected: all tests PASS.

- [ ] **Step 4: Run the typed Interview workspace regression**

Run:

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/interviews/InterviewSessionWorkspace.questionTypes.test.tsx \
  src/features/interviews/InterviewSessionWorkspace.savedAttempts.test.tsx
```

Expected: PASS with no change to typed submission or Saved Attempts behavior.

- [ ] **Step 5: Commit the implementation**

Commit only the component/CSS changes after the focused tests are green.

---

### Task 3: Final Task 7R verification and human QA

**Files:**
- Verify only; no expected production changes.

**Interfaces:**
- Consumes: complete Task 7R branch state.
- Produces: merge-ready verification evidence for PR #13.

- [ ] **Step 1: Run frontend typecheck**

```bash
npm run typecheck --workspace @career-learning-hub/web
```

Expected: PASS.

- [ ] **Step 2: Run full frontend regression**

```bash
npm run test --workspace @career-learning-hub/web
```

Expected: all frontend tests PASS; test count may increase by one if the Coding test is split rather than renamed.

- [ ] **Step 3: Run production build**

```bash
npm run build --workspace @career-learning-hub/web
```

Expected: PASS; existing non-blocking Vite chunk warnings may remain.

- [ ] **Step 4: Run diff check**

```bash
git diff --check origin/phase-19b-interview-coach-refinements...HEAD
```

Expected: no output.

- [ ] **Step 5: Human browser QA**

Open a Coding question and verify:

```text
Your code
Complete only the function or solution requested by the question...
[code-oriented textarea]
Your submission is reviewed as text and is not executed.
```

Confirm normal typing/paste works, the 12,000-character counter remains, Save Attempt works, and no Run/Execute control appears.

- [ ] **Step 6: Confirm clean state**

```bash
git branch --show-current
git rev-parse HEAD
git status --short
```

Expected: Task 7R branch, exact PR head, and clean working tree.
