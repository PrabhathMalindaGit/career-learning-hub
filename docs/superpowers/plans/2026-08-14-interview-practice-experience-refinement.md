# Interview Practice Experience Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish Task 7R by adding stored Coding starter code, type-specific Practice Desk answer presentation, and session-context category selection without changing typed answer persistence or adding code execution.

**Architecture:** Extend the existing Interview question model with one optional Coding-only `starterCode` field and carry it through strict Zod generation/manual schemas, transactional persistence, owner-only detail serialization, and frontend detail parsing. Keep all answer-type differentiation frontend-only inside the existing typed-answer contract. Isolate briefing category state in a small reusable frontend component/helper so the already-large workspace receives only bounded wiring changes.

**Tech Stack:** Express + TypeScript, Mongoose, Zod, existing Gemini structured-output gateway, React + TypeScript, Vitest + Testing Library, existing Interview API/contracts and CSS.

## Global Constraints

- Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.
- Gemini Direct remains the only active provider; do not add provider/routing changes.
- Do not add SSE, WebSockets, token streaming, compiler/runtime/sandbox, hidden tests, Monaco, CodeMirror, or a Run/Execute action.
- `starterCode` is optional persisted data, Coding-only, immutable, owner-visible in question detail only, and capped at 12,000 characters.
- New AI-generated Coding questions must include `starterCode` in the existing structured generation response; historical/manual Coding questions may omit it.
- `starterCode` must never contain an intentionally completed solution; the prompt must describe it as scaffolding only.
- Typed attempt answer shapes remain unchanged.
- MCQ correctness remains deterministic backend logic and `correctOptionId` remains private before submission.
- Session-context category suggestions derive locally from `focusTopics + skillGaps`; no category-suggestion endpoint or extra Gemini request.
- Context category defaults initialize once per session route and must not silently reselect after the user changes them.
- PR #13 remains draft/unmerged until all verification is green and the user explicitly approves merge.

---

## File map

### Backend

- Modify `backend/src/modules/interviews/interviewQuestion.model.ts` — persist optional immutable Coding starter code.
- Modify `backend/src/modules/interviews/interview.schemas.ts` — strict manual/generated Coding schema support and rejection on non-Coding branches.
- Modify `backend/src/modules/interviews/interview.service.ts` — manual Coding input/canonicalization and owner-only detail serialization.
- Modify `backend/src/modules/interviews/interviewAi.service.ts` — generation prompt/schema persistence mapping for starter code.
- Modify `backend/src/tests/integration/interviewQuestionTypes.integration.test.ts` — focused contract, persistence, serialization, compatibility, and secrecy coverage.

### Frontend contracts/API

- Modify `frontend/src/features/interviews/types.ts` — `starterCode?: string` on question detail and optional manual Coding input.
- Modify `frontend/src/features/interviews/interviewContracts.ts` — parse starter code only on Coding detail and reject invalid non-Coding starter code.
- Modify `frontend/src/features/interviews/interviewApi.ts` — canonicalize/send optional manual Coding starter code.
- Modify `frontend/src/features/interviews/interviewContracts.test.ts` — parser/security regression coverage.
- Modify `frontend/src/features/interviews/interviewQuestionTypeApi.test.ts` — manual Coding request body and existing generation request regression.

### Frontend presentation

- Modify `frontend/src/features/interviews/InterviewAnswerControl.tsx` — starter-code panel, type-specific guidance/placeholders, MCQ position badges.
- Modify `frontend/src/features/interviews/InterviewAnswerControl.test.tsx` — focused rendering/interaction/submission-preservation tests.
- Modify `frontend/src/features/interviews/interviewQuestionTypes.css` — scoped type-specific answer visual treatment.
- Create `frontend/src/features/interviews/InterviewCategorySelector.tsx` — context suggestion/custom-category state UI.
- Create `frontend/src/features/interviews/InterviewCategorySelector.test.tsx` — normalization/default-selection/deselection/custom tests.
- Modify `frontend/src/features/interviews/InterviewSessionWorkspace.tsx` — bounded category-selector wiring and manual Coding starter-code field/state.
- Modify `frontend/src/features/interviews/InterviewSessionWorkspace.questionTypes.test.tsx` — generated categories and manual Coding starter-code integration.

### Governance

- Update PR #13 description after implementation so it no longer claims there are no schema changes.

---

### Task 1: Backend starter-code schema and persistence contract

**Files:**
- Modify: `backend/src/modules/interviews/interviewQuestion.model.ts`
- Modify: `backend/src/modules/interviews/interview.schemas.ts`
- Modify: `backend/src/modules/interviews/interview.service.ts`
- Test: `backend/src/tests/integration/interviewQuestionTypes.integration.test.ts`

**Interfaces:**
- Produces persisted field: `starterCode?: string`
- Manual Coding input: `{ questionType: "coding", ..., modelAnswer?: string, starterCode?: string }`
- Non-Coding manual input remains strict and rejects `starterCode`.

- [ ] **Step 1: Add failing integration cases for manual starter code**

Add cases to the existing Interview question-type integration suite that submit a manual Coding question with starter code and prove the created owned detail returns it, and that a Short Answer request containing `starterCode` is rejected as invalid input.

Representative assertions:

```ts
expect(response.status).toBe(201);
expect(response.body.question.questionType).toBe("coding");
expect(response.body.question.starterCode).toBe(
  "function solve(input) {\n  // TODO\n}",
);

expect(nonCodingResponse.status).toBe(400);
```

- [ ] **Step 2: Run the focused backend test and confirm the new cases fail for missing support**

Run:

```bash
npm run test --workspace @career-learning-hub/api -- \
  src/tests/integration/interviewQuestionTypes.integration.test.ts
```

Expected: the new manual starter-code assertions fail while existing tests remain otherwise healthy.

- [ ] **Step 3: Add the optional immutable Mongoose field**

Extend `InterviewQuestion` and its schema:

```ts
starterCode?: string;
```

Schema rules:

```ts
starterCode: {
  type: String,
  trim: true,
  maxlength: 12_000,
  immutable: true,
},
```

Do not add a migration because historical records legitimately omit the field.

- [ ] **Step 4: Make starter code Coding-only in strict request schemas**

In `manualQuestionBaseSchema`, add only to the `coding` branch:

```ts
starterCode: z.string().trim().max(12_000).optional(),
```

Leave every non-Coding branch strict so a supplied `starterCode` fails validation.

- [ ] **Step 5: Carry manual starter code through the service type and canonicalization**

Split or refine `ManualQuestionInput` so the Coding branch may carry `starterCode?: string` while other text types do not. `canonicalizeManualQuestion()` should return starter code only for Coding:

```ts
if (question.questionType === "coding") {
  return {
    questionType: question.questionType,
    modelAnswer: question.modelAnswer,
    ...(question.starterCode ? { starterCode: question.starterCode } : {}),
  };
}
```

Preserve MCQ handling and all other typed-question behavior.

- [ ] **Step 6: Run the focused backend test**

Run the same integration file. Expected: the new manual Coding/rejection cases pass.

- [ ] **Step 7: Commit the backend manual/storage contract**

Commit message:

```text
Add Coding starter code storage contract
```

---

### Task 2: AI-generated Coding starter code and secure detail serialization

**Files:**
- Modify: `backend/src/modules/interviews/interview.schemas.ts`
- Modify: `backend/src/modules/interviews/interviewAi.service.ts`
- Modify: `backend/src/modules/interviews/interview.service.ts`
- Test: `backend/src/tests/integration/interviewQuestionTypes.integration.test.ts`

**Interfaces:**
- Generated Coding object now requires `starterCode: string`.
- Question-list summaries continue to omit starter code.
- Owned Coding question detail may expose starter code.

- [ ] **Step 1: Add failing generated-Coding and serialization tests**

Extend the existing integration test so generated Coding structured data includes:

```ts
{
  questionType: "coding",
  category: "MongoDB",
  difficulty: "medium",
  question: "Write a function...",
  starterCode: "async function solve(db) {\n  // TODO\n}",
  modelAnswer: "A strong solution would...",
}
```

Prove:

- generated Coding starter code persists;
- an owned question-detail response exposes it;
- the question-list response does not include it;
- a historical Coding record without it still serializes safely;
- a non-Coding generated object containing `starterCode` is rejected by the strict schema;
- existing MCQ list/detail responses still never expose `correctOptionId`.

- [ ] **Step 2: Run focused backend tests and confirm RED**

Use the same focused integration command.

- [ ] **Step 3: Require `starterCode` only in the generated Coding Zod branch**

In the generated discriminated union:

```ts
z.object({
  questionType: z.literal("coding"),
  ...generatedCommonShape,
  starterCode: z.string().trim().min(1).max(12_000),
}).strict()
```

Do not add the field to any other generated branch.

- [ ] **Step 4: Update Gemini generation instructions without adding another call**

Keep the existing single `generateStructuredOutput()` call. Add instructions equivalent to:

```text
For Coding questions, return starterCode containing only useful scaffolding such as imports, signatures, parameters, minimal shapes, and TODO comments.
Do not put the completed solution in starterCode.
Coding remains text-only interview practice; do not require execution, hidden tests, or a runtime.
```

Bump the generation prompt version from `interview-question-generation-v2` to a new version for this schema change.

- [ ] **Step 5: Persist generated Coding starter code atomically**

Extend `generatedQuestionStorageFields()`:

```ts
if (question.questionType === "coding") {
  return {
    questionType: question.questionType,
    modelAnswer: question.modelAnswer,
    starterCode: question.starterCode,
  };
}
```

Do not change transaction/fence/idempotency semantics.

- [ ] **Step 6: Expose starter code in detail only**

Keep `serializeQuestionSummary()` unchanged with respect to starter code. In `serializeQuestionDetail()`, when the canonical type is Coding and `value.starterCode` exists, add it to the returned detail.

Do not expose starter code on MCQ or historical non-Coding questions.

- [ ] **Step 7: Run focused backend tests**

Expected: generated/manual starter-code, historical compatibility, list omission, detail exposure, and MCQ secrecy assertions all pass.

- [ ] **Step 8: Commit AI generation and serialization support**

Commit message:

```text
Generate and serialize Coding starter code
```

---

### Task 3: Frontend starter-code contracts and manual API transport

**Files:**
- Modify: `frontend/src/features/interviews/types.ts`
- Modify: `frontend/src/features/interviews/interviewContracts.ts`
- Modify: `frontend/src/features/interviews/interviewApi.ts`
- Test: `frontend/src/features/interviews/interviewContracts.test.ts`
- Test: `frontend/src/features/interviews/interviewQuestionTypeApi.test.ts`

**Interfaces:**
- `InterviewQuestionDetail.starterCode?: string`
- manual Coding input may include `starterCode?: string`
- Question summaries remain starter-code-free.

- [ ] **Step 1: Add failing frontend contract/API tests**

Add parser cases proving:

```ts
const detail = parseQuestionDetail(...codingPayloadWithStarterCode...);
expect(detail.starterCode).toBe("function solve() {\n  // TODO\n}");
```

and that a non-Coding detail carrying starter code is rejected.

Add API transport coverage proving a manual Coding request includes trimmed starter code while non-Coding requests do not gain the field.

- [ ] **Step 2: Run the two focused frontend files and confirm RED**

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/interviews/interviewContracts.test.ts \
  src/features/interviews/interviewQuestionTypeApi.test.ts
```

- [ ] **Step 3: Extend frontend types narrowly**

Add `starterCode?: string` to `InterviewQuestionDetail` only. Refine `ManualInterviewQuestionInput` so the Coding variant may include `starterCode?: string`; do not place starter code on all question variants.

- [ ] **Step 4: Parse starter code only for Coding detail**

In `parseQuestionDetail()`:

- parse optional starter code at max 12,000 characters;
- accept it only when `summary.questionType === "coding"`;
- reject starter code on any other effective type;
- do not modify `parseQuestionSummary()` to carry starter code.

- [ ] **Step 5: Canonicalize/send manual Coding starter code**

In `addManualQuestion()`, trim starter code and include it only for typed Coding input when non-empty.

- [ ] **Step 6: Run focused contract/API tests**

Expected: all new parser/transport tests pass and existing typed API tests stay green.

- [ ] **Step 7: Commit frontend starter-code contracts**

Commit message:

```text
Add frontend Coding starter code contracts
```

---

### Task 4: Type-specific Answer Control and Coding starter-code UX

**Files:**
- Modify: `frontend/src/features/interviews/InterviewAnswerControl.tsx`
- Modify: `frontend/src/features/interviews/InterviewAnswerControl.test.tsx`
- Modify: `frontend/src/features/interviews/interviewQuestionTypes.css`

**Interfaces:**
- Reuses existing `question`, `textValue`, `onTextChange`, and typed submission callback.
- No new answer persistence fields.

- [ ] **Step 1: Add failing Answer Control tests**

Add cases for:

- MCQ renders positional `A`, `B`, `C` badges and selecting a whole card changes the native radio selection;
- Short Answer guidance includes `Aim for 2–4 focused sentences.`;
- Behavioral renders `Situation`, `Task`, `Action`, `Result` guidance;
- Scenario renders `Assess`, `Approach`, `Trade-offs`, `Decision` guidance;
- Technical Explanation renders `Concept`, `How it works`, `Example`, `Trade-offs` guidance;
- Coding with starter code renders a read-only starter panel;
- `Insert into answer` calls `onTextChange(starterCode)` when the draft is empty;
- Insert is unavailable when `textValue.trim()` is non-empty;
- Coding without starter code renders no empty panel.

Use project-native assertions rather than jest-dom-only matchers.

- [ ] **Step 2: Run `InterviewAnswerControl.test.tsx` and confirm RED**

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/interviews/InterviewAnswerControl.test.tsx
```

- [ ] **Step 3: Add declarative per-type presentation metadata**

Inside the component/module, define one small map/helper for non-MCQ types, for example:

```ts
const TEXT_ANSWER_PRESENTATION = {
  "short-answer": {
    guidance: ["Answer directly.", "Aim for 2–4 focused sentences."],
    placeholder: "Give a concise, directly relevant answer…",
  },
  behavioral: {
    cues: ["Situation", "Task", "Action", "Result"],
    guidance: ["Focus on what you personally did and the outcome."],
  },
  "scenario-based": {
    cues: ["Assess", "Approach", "Trade-offs", "Decision"],
    guidance: ["Explain why you would choose your approach."],
  },
  "technical-explanation": {
    cues: ["Concept", "How it works", "Example", "Trade-offs"],
    guidance: ["Explain the concept as if speaking to an interviewer."],
  },
} as const;
```

Keep Coding guidance and legacy Open Response behavior explicit.

- [ ] **Step 4: Add MCQ positional badges without changing radio semantics**

Derive badge letters from visible option index and render them inside the existing clickable `<label>` card. The radio remains authoritative and accessible.

- [ ] **Step 5: Add starter-code panel**

For Coding detail with starter code:

- show read-only monospace code;
- add `Copy starter code` using the existing clipboard pattern where practical;
- add `Insert into answer` only/disabled according to empty-draft rule;
- insertion calls `onTextChange(question.starterCode)` and never calls `onSubmit`.

- [ ] **Step 6: Add scoped visual differentiation**

In `interviewQuestionTypes.css`, add only Interview Answer Control classes needed for:

- MCQ letter badge and selected-card hierarchy;
- compact Short Answer surface;
- neutral guidance chips for Behavioral/Scenario/Technical Explanation;
- starter-code read-only code panel/action row;
- responsive wrapping.

Keep the shared Career Learning Hub green palette; do not create six bright palettes.

- [ ] **Step 7: Run focused Answer Control tests**

Expected: all existing and new tests pass.

- [ ] **Step 8: Commit type-specific answer UX**

Commit message:

```text
Differentiate Interview answer experiences
```

---

### Task 5: Session-context category selector

**Files:**
- Create: `frontend/src/features/interviews/InterviewCategorySelector.tsx`
- Create: `frontend/src/features/interviews/InterviewCategorySelector.test.tsx`
- Modify: `frontend/src/features/interviews/interviewQuestionTypes.css`

**Interfaces:**

```ts
export interface InterviewCategorySelectorProps {
  contextCategories: readonly string[];
  selected: string[];
  disabled?: boolean;
  onSelectedChange(next: string[]): void;
}

export function canonicalInterviewCategorySuggestions(
  focusTopics: readonly string[],
  skillGaps: readonly string[],
): string[];
```

- [ ] **Step 1: Add focused RED tests for canonical suggestion behavior**

Cover:

- trimming and dropping blanks;
- case-normalized deduplication preserving first display spelling;
- focus topics ordered before new skill-gap values;
- all supplied context categories can render selected;
- deselection works;
- custom category addition/removal works;
- duplicate custom categories are ignored;
- empty selection is valid.

- [ ] **Step 2: Run the focused selector test and confirm RED**

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/interviews/InterviewCategorySelector.test.tsx
```

- [ ] **Step 3: Implement normalization helper**

Use trim + lowercase comparison keys only for deduplication. Preserve the first meaningful spelling for display and request payload.

- [ ] **Step 4: Implement accessible selector UI**

Render:

```text
Categories
Suggested from session context
[✓ ...] [✓ ...]
Custom categories
[input] [Add]
N categories selected
```

Context chips/buttons must expose pressed/selected state. Custom input should support button submission and Enter without allowing empty/duplicate entries.

- [ ] **Step 5: Add scoped category-selector CSS**

Reuse existing Interview button/tile conventions and keep responsive wrapping.

- [ ] **Step 6: Run focused selector tests**

Expected: all selector tests pass.

- [ ] **Step 7: Commit category selector**

Commit message:

```text
Add session-context Interview categories
```

---

### Task 6: Wire categories and manual Coding starter code into the workspace

**Files:**
- Modify: `frontend/src/features/interviews/InterviewSessionWorkspace.tsx`
- Modify: `frontend/src/features/interviews/InterviewSessionWorkspace.questionTypes.test.tsx`

**Interfaces:**
- Consumes `canonicalInterviewCategorySuggestions()` and `InterviewCategorySelector`.
- Generation continues to call existing `generateInterviewQuestions()` with `categories: string[]`.
- Manual Coding creation sends optional `starterCode` through existing `addManualQuestion()`.

- [ ] **Step 1: Add failing workspace integration tests**

Extend the existing typed-question workspace test suite to prove:

1. Session `{ focusTopics: ["MongoDB"], skillGaps: ["System Design"] }` initializes selected generation categories as `MongoDB` and `System Design`.
2. Deselecting `System Design` and adding `API Security` causes generation to receive exactly:

```ts
categories: ["MongoDB", "API Security"]
```

3. Empty selection submits `categories: []`.
4. A manual Coding question shows `Starter code (optional)` and submits trimmed `starterCode`.
5. Switching manual type away from Coding does not send stale starter code.
6. User-modified category selection is not reset by ordinary question reload/generation completion within the same session route.

- [ ] **Step 2: Run the focused workspace question-type test and confirm RED**

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/interviews/InterviewSessionWorkspace.questionTypes.test.tsx
```

- [ ] **Step 3: Replace comma-string category state with canonical selected array state**

Use a selected string-array state for generation categories. Initialize it once when a new session route's canonical session context becomes available.

Track initialized session identity with a ref/state so later session refreshes do not overwrite user choices.

- [ ] **Step 4: Render `InterviewCategorySelector` in Build the Briefing**

Replace the free-text-only `Categories` input with the approved selector. Keep generation submission structure otherwise unchanged.

- [ ] **Step 5: Add manual Coding starter-code state and field**

Add a bounded `manualStarterCode` state. Render its textarea only when `manualQuestionType === "coding"` and send it only for Coding. Clear or ignore stale starter code when leaving Coding so it cannot leak into another question type.

- [ ] **Step 6: Preserve generation/job semantics**

Do not alter request UUID generation, type distribution, job polling, cancel/retry, provider state, stale route guards, or idempotency handling.

- [ ] **Step 7: Run focused workspace tests**

Expected: all existing typed-question tests plus the new category/manual starter-code cases pass.

- [ ] **Step 8: Commit workspace integration**

Commit message:

```text
Wire Interview categories and starter code
```

---

### Task 7: Focused regression and flaky-route test re-verification

**Files:**
- No feature files unless a reproducible unrelated failure requires a separately justified test-only timing fix.
- Existing test: `frontend/src/features/interviews/InterviewSessionWorkspace.test.tsx`

- [ ] **Step 1: Run focused backend Interview tests**

```bash
npm run test --workspace @career-learning-hub/api -- \
  src/tests/integration/interviewQuestionTypes.integration.test.ts \
  src/tests/integration/interviewFeedbackTypes.integration.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run focused frontend Interview tests**

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/interviews/interviewContracts.test.ts \
  src/features/interviews/interviewQuestionTypeApi.test.ts \
  src/features/interviews/InterviewAnswerControl.test.tsx \
  src/features/interviews/InterviewCategorySelector.test.tsx \
  src/features/interviews/InterviewSessionWorkspace.questionTypes.test.tsx \
  src/features/interviews/InterviewSessionWorkspace.questionIndexNotes.test.tsx
```

Expected: PASS.

- [ ] **Step 3: Re-run the previously intermittent route-loading test in isolation several times**

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/interviews/InterviewSessionWorkspace.test.tsx \
  -t "clears question-detail loading when the next route has no questions"
```

Run at least twice. If it fails reproducibly, stop feature closeout and debug that existing timing issue separately; do not mask it by loosening unrelated feature assertions.

- [ ] **Step 4: Run frontend and backend typechecks/builds according to existing workspace scripts**

```bash
npm run typecheck --workspace @career-learning-hub/api
npm run typecheck --workspace @career-learning-hub/web
npm run build --workspace @career-learning-hub/api
npm run build --workspace @career-learning-hub/web
```

If the backend package does not expose a separate build script, use the repository's existing backend verification command rather than inventing one.

- [ ] **Step 5: Run full frontend regression**

```bash
npm run test --workspace @career-learning-hub/web
```

Expected: all frontend tests pass; the prior 969/970 timing failure must not remain unresolved.

- [ ] **Step 6: Run full relevant backend regression**

Use the established backend CI/test command for the branch and require zero failures.

- [ ] **Step 7: Diff/working-tree checks**

```bash
git diff --check origin/phase-19b-interview-coach-refinements...HEAD
git status --short
```

Expected: no diff-check output and a clean tree after local verification.

---

### Task 8: Browser acceptance and PR governance update

**Files:**
- Update PR #13 body only after implementation/verification.

- [ ] **Step 1: Human browser QA all six modern types**

Verify desktop and responsive layouts for:

- MCQ lettered cards and selection;
- Short Answer compact guidance;
- Behavioral STAR guidance;
- Scenario decision guidance;
- Technical Explanation concept guidance;
- Coding starter-code Copy/Insert and no-overwrite behavior.

- [ ] **Step 2: Human browser QA Build the Briefing categories**

Verify context suggestions start selected once per session, can be deselected, custom categories can be added/removed, and user choices are not reset after a generation cycle.

- [ ] **Step 3: Human browser QA manual Coding authoring**

Verify starter-code field appears only for Coding and created Coding detail shows the scaffold.

- [ ] **Step 4: Update PR #13 description**

Replace outdated claims such as `no schema changes` with accurate scope:

- one optional immutable Coding-only `starterCode` question field;
- no new endpoint;
- no provider/routing change;
- no execution/runtime;
- type-specific answer presentation;
- session-context category selector;
- all prior Task 7R refinements retained.

- [ ] **Step 5: Final review gate**

Review changed-file scope, security invariants, full verification evidence, and browser screenshots. Do not merge.

- [ ] **Step 6: Request explicit merge approval**

Only after every gate is green, request the existing explicit approval token before merging PR #13 into `phase-19b-interview-coach-refinements`.
