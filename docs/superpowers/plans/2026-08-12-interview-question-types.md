# Phase 19B-3 — Interview Question Types Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Keep `main` untouched; implement only on `phase-19b-interview-coach-refinements` until a separate merge authorization is given.

**Goal:** Implement `CLH-FEATURE-INTERVIEW-011` using the human-approved Q2 architecture: one shared typed Interview Question model, one shared typed/discriminated Interview Attempt model, explicit historical compatibility, backend-private Multiple Choice answer keys, deterministic MCQ scoring, and type-aware Gemini practice feedback for text-based question types.

**Architecture:** Extend the existing Interview session/question/attempt lifecycle rather than creating parallel per-type systems. Persist an optional modern `questionType` plus bounded type-specific question data, serialize missing historical types as `legacy-open-response`, preserve historical `answerText`, store typed answers for new questions, and keep MCQ correctness authoritative on the backend without Gemini. Reuse the existing routes, ownership middleware, pagination, job queue, idempotency, retry/cancel, execution fencing, polling, activity logging, and MongoDB transaction boundaries.

**Tech Stack:** React 19, TypeScript 5.8, React Router, Vite 6, Vitest 4, Testing Library, Express 5, Mongoose 8, MongoDB transactions, Zod 3, existing Gemini Direct structured-output gateway, existing durable job worker, and existing CSS. No new runtime dependency.

## Status and authority

- Plan status: `PLAN WRITTEN / IMPLEMENTATION NOT STARTED / AWAITING HUMAN APPROVAL`.
- Feature: `CLH-FEATURE-INTERVIEW-011`.
- Approved architecture: **Q2 — shared typed question model + discriminated typed answer payload**.
- Architecture authority: `docs/superpowers/specs/2026-08-12-interview-question-type-architecture-design.md`.
- Architecture commit: `fcfeef6bfa34fe84a6e2449ace771b829b986a27` (`Add Phase 19B question-type architecture design`).
- Implementation branch: `phase-19b-interview-coach-refinements`.
- Plan creation authorization was given by the operator after Task 6 verification passed with 17/17 required sections, a clean marker scan, documentation-only commit scope, clean whitespace check, and clean worktree.
- This plan does not itself authorize implementation, commit, push, merge, deployment, or Phase 19C activation.

## Global Constraints

- Implement exactly these six selectable modern types:
  - `multiple-choice` — Multiple Choice;
  - `short-answer` — Short Answer;
  - `coding` — Coding;
  - `behavioral` — Behavioral;
  - `scenario-based` — Scenario-based;
  - `technical-explanation` — Technical Explanation.
- `legacy-open-response` is compatibility-only. It is never user-selectable and is never bulk-written into historical documents.
- Historical questions with no stored `questionType` remain unchanged in MongoDB and serialize as effective `legacy-open-response`.
- Historical attempts keep immutable `answerText` exactly as stored. Do not rewrite them into typed answer objects.
- Historical completed feedback remains untouched. Do not recompute historical scores or provider metadata.
- Keep one `InterviewQuestion` collection, one `InterviewAttempt` collection, and the existing route family. Do not create per-type collections, routes, services, queues, or microservices.
- Keep existing question fingerprint semantics exactly `SHA-256(normalized question text)`. Do not include type/options/answer keys in the fingerprint or change the unique index.
- Multiple Choice correct-answer data is backend-private before submission. No list/detail/pin/notes/job response may expose `correctOptionId` or a model-answer string that reveals the key before the user records an attempt.
- Multiple Choice correctness is deterministic backend logic. Gemini must not determine whether a selected option is correct.
- Coding is text/code practice only. No compiler, code execution, browser sandbox, remote judge, hidden tests, plagiarism detection, proctoring, or hiring-assessment claim.
- Text-based modern types continue through the existing Gemini feedback job architecture with type-aware criteria. Gemini Direct remains the only active provider.
- Preserve current job idempotency, retry/cancel behavior, execution fencing, progress polling, transaction boundaries, ownership checks, request-ID handling, stale-operation guards, and activity logging.
- Keep the existing session question limit, generation count bound `1–20`, question text bound `5–2,000`, model-answer bound `12,000`, and answer bound governed by `INTERVIEW_MAX_ANSWER_CHARACTERS` / current frontend bound.
- Multiple Choice options: minimum 2, maximum 8, each option text 1–500 characters, unique canonical IDs, and exactly one valid correct option.
- Do not add a persistent session-level question-type plan in this implementation. Type selection belongs to each generation request; a session is mixed according to the questions it contains.
- Do not add a new package, state-management framework, form library, schema library, provider, environment variable, deployment service, streaming transport, database migration script, or Phase 19C+ functionality.
- Use strict RED → verify intended failure → GREEN → bounded refactor. Invoke `superpowers:systematic-debugging` before changing production code in response to an unexpected failure.
- After three failed code-changing attempts against the same root cause, stop and report the evidence instead of continuing speculative edits.
- The operator controls Git publication. Do not commit, push, create a PR, merge, or deploy unless a separate explicit authorization is given for that Git action.
- Never weaken ownership, response validation, answer-key secrecy, or immutable-attempt behavior merely to make a test pass.

## Execution configuration

- **Recommended Codex model:** GPT-5.6 Thinking, or the strongest equivalent coding model available.
- **Intelligence level:** High.
- **Manual terminal work by operator:** Not required for normal implementation/test tasks. The agent should run repository commands itself. Human QA later requires the operator to run local services only if the execution environment cannot keep them running.
- **Browser use:** Not required for Tasks 1–6. Required for Task 7 final visible interaction verification and Task 8 human Chrome QA. Browser use must stay limited to visible/runtime verification, not documentation or backend-only work.
- **Services for automated backend tests:** Use the repository test harness; do not ask the operator to keep development servers running.
- **Services for final live verification:** frontend, Express backend with integrated durable worker, MongoDB, and Gemini connectivity.
- **Live Gemini:** No live call during Tasks 1–6. Task 8 requires one controlled live mixed-type generation and one controlled text-feedback path after all mocked/automated gates pass.
- **Git:** Keep `main` untouched. All implementation remains on `phase-19b-interview-coach-refinements`.

## File structure lock

The implementation should remain within the existing Interview feature/module unless a failing test proves a narrower additional helper is necessary.

### New focused backend files

- `backend/src/modules/interviews/interviewQuestion.types.ts`
  - owns modern type constants, effective compatibility type, Multiple Choice storage/public shapes, typed attempt answer union, and pure type helpers.
- `backend/src/modules/interviews/interviewQuestionDistribution.ts`
  - owns deterministic balanced/custom type-count resolution and exact distribution comparison.
- `backend/src/tests/unit/interviewQuestionTypes.test.ts`
  - pure tests for type helpers and compatibility behavior.
- `backend/src/tests/unit/interviewQuestionDistribution.test.ts`
  - pure tests for balanced/custom distribution.
- `backend/src/tests/integration/interviewQuestionTypes.integration.test.ts`
  - typed question/attempt/generation/API compatibility integration coverage.
- `backend/src/tests/security/interviewQuestionTypes.security.test.ts`
  - answer-key leakage and ownership regression coverage.

### Existing backend files expected to change

- `backend/src/modules/interviews/interviewQuestion.model.ts`
- `backend/src/modules/interviews/interviewAttempt.model.ts`
- `backend/src/modules/interviews/interview.schemas.ts`
- `backend/src/modules/interviews/interview.service.ts`
- `backend/src/modules/interviews/interview.controller.ts`
- `backend/src/modules/interviews/interviewAi.service.ts`
- `backend/src/modules/interviews/interview.jobs.ts`
- `backend/src/modules/interviews/interview.routes.ts` only if validation wiring needs an imported schema name change; do not create new routes.
- Existing job/idempotency/security integration tests only when a regression assertion genuinely belongs there.

### Existing frontend files expected to change

- `frontend/src/features/interviews/types.ts`
- `frontend/src/features/interviews/interviewContracts.ts`
- `frontend/src/features/interviews/interviewApi.ts`
- `frontend/src/features/interviews/InterviewSessionWorkspace.tsx`
- `frontend/src/features/interviews/InterviewSessionWorkspace.test.tsx`
- `frontend/src/features/interviews/interviewApi.test.ts`
- `frontend/src/features/interviews/interviewContracts.test.ts`
- `frontend/src/features/interviews/interviewCoach.css`

### Optional focused frontend files to create

Create these only as described by the tasks below; do not split the workspace more broadly.

- `frontend/src/features/interviews/InterviewQuestionTypeControls.tsx`
- `frontend/src/features/interviews/InterviewQuestionTypeControls.test.tsx`
- `frontend/src/features/interviews/InterviewAnswerControl.tsx`
- `frontend/src/features/interviews/InterviewAnswerControl.test.tsx`

---

### Task 1: Add backend typed domain contracts and backward-compatible storage

**Files:**
- Create: `backend/src/modules/interviews/interviewQuestion.types.ts`
- Modify: `backend/src/modules/interviews/interviewQuestion.model.ts`
- Modify: `backend/src/modules/interviews/interviewAttempt.model.ts`
- Modify: `backend/src/modules/interviews/interview.schemas.ts`
- Create: `backend/src/tests/unit/interviewQuestionTypes.test.ts`
- Create: `backend/src/tests/integration/interviewQuestionTypes.integration.test.ts`

**Interfaces produced:**

```ts
export const interviewQuestionTypes = [
  "multiple-choice",
  "short-answer",
  "coding",
  "behavioral",
  "scenario-based",
  "technical-explanation",
] as const;

export type InterviewQuestionType =
  (typeof interviewQuestionTypes)[number];

export type EffectiveInterviewQuestionType =
  | InterviewQuestionType
  | "legacy-open-response";

export interface InterviewMultipleChoiceOption {
  id: string;
  text: string;
}

export interface InterviewMultipleChoiceStorage {
  options: InterviewMultipleChoiceOption[];
  correctOptionId: string;
}

export type TypedInterviewAnswer =
  | { type: "multiple-choice"; selectedOptionId: string }
  | { type: "short-answer"; text: string }
  | { type: "coding"; text: string }
  | { type: "behavioral"; text: string }
  | { type: "scenario-based"; text: string }
  | { type: "technical-explanation"; text: string };

export function effectiveInterviewQuestionType(input: {
  questionType?: InterviewQuestionType;
}): EffectiveInterviewQuestionType {
  return input.questionType ?? "legacy-open-response";
}
```

The Mongoose question shape becomes storage-compatible with historical documents:

```ts
questionType?: InterviewQuestionType;
multipleChoice?: InterviewMultipleChoiceStorage;
```

The Mongoose attempt shape becomes storage-compatible with both generations:

```ts
answerText?: string;
answer?: TypedInterviewAnswer;
evaluation?: {
  kind: "multiple-choice";
  score: 0 | 100;
  correct: boolean;
};
```

At the storage-schema level these fields are optional because old documents exist. Application service validation later enforces the legal combination for newly created data.

- [ ] **Step 1: Write RED pure compatibility tests.**

Add assertions equivalent to:

```ts
import { describe, expect, it } from "vitest";
import {
  effectiveInterviewQuestionType,
  interviewQuestionTypes,
} from "../../modules/interviews/interviewQuestion.types.js";

describe("Interview question types", () => {
  it("keeps the six selectable modern types stable", () => {
    expect(interviewQuestionTypes).toEqual([
      "multiple-choice",
      "short-answer",
      "coding",
      "behavioral",
      "scenario-based",
      "technical-explanation",
    ]);
  });

  it("maps only missing historical storage to legacy open response", () => {
    expect(effectiveInterviewQuestionType({})).toBe(
      "legacy-open-response",
    );
    expect(
      effectiveInterviewQuestionType({ questionType: "behavioral" }),
    ).toBe("behavioral");
  });
});
```

- [ ] **Step 2: Run the new unit test and verify RED because the module does not yet exist.**

```bash
npm run test:unit -- --run \
  src/tests/unit/interviewQuestionTypes.test.ts
```

If the repository script does not forward `--run` in this exact form, use the existing Vitest unit invocation from `backend/package.json`; do not change package scripts merely for this task.

- [ ] **Step 3: Implement `interviewQuestion.types.ts` exactly around the interfaces above.**

Keep this file side-effect-free. It must not import Mongoose models or initialize a model.

- [ ] **Step 4: Extend `InterviewQuestion` storage without touching existing indexes/fingerprint semantics.**

Use a `_id: false` option sub-schema and a `_id: false` Multiple Choice sub-schema. Canonical option IDs are ordinary bounded strings generated by the backend in Task 3; do not let Mongoose invent nested ObjectIds.

Implementation shape:

```ts
const multipleChoiceOptionSchema = new Schema(
  {
    id: { type: String, required: true, maxlength: 64, immutable: true },
    text: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 500,
      immutable: true,
    },
  },
  { _id: false },
);

const multipleChoiceSchema = new Schema(
  {
    options: {
      type: [multipleChoiceOptionSchema],
      required: true,
      validate: {
        validator: (value: unknown[]) => value.length >= 2 && value.length <= 8,
        message: "Multiple Choice requires 2–8 options.",
      },
      immutable: true,
    },
    correctOptionId: {
      type: String,
      required: true,
      maxlength: 64,
      immutable: true,
    },
  },
  { _id: false },
);
```

Add `questionType` and `multipleChoice` as optional storage fields. Do not make `questionType` required in Mongoose because historical questions omit it.

- [ ] **Step 5: Extend `InterviewAttempt` storage while retaining old immutable `answerText`.**

Remove only the Mongoose `required: true` constraint from `answerText`; retain trim/min/max/immutable behavior. Add an immutable `answer` subdocument capable of the exact union and an immutable deterministic `evaluation` subdocument.

Do not add `correctOptionId` to the attempt model.

- [ ] **Step 6: Export strict reusable Zod primitives without changing endpoint behavior yet.**

In `interview.schemas.ts`, add:

```ts
export const interviewQuestionTypeSchema = z.enum(
  interviewQuestionTypes,
);

export const typedInterviewAnswerSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("multiple-choice"),
    selectedOptionId: z.string().trim().min(1).max(64),
  }).strict(),
  z.object({ type: z.literal("short-answer"), text: z.string().trim().min(1).max(50_000) }).strict(),
  z.object({ type: z.literal("coding"), text: z.string().trim().min(1).max(50_000) }).strict(),
  z.object({ type: z.literal("behavioral"), text: z.string().trim().min(1).max(50_000) }).strict(),
  z.object({ type: z.literal("scenario-based"), text: z.string().trim().min(1).max(50_000) }).strict(),
  z.object({ type: z.literal("technical-explanation"), text: z.string().trim().min(1).max(50_000) }).strict(),
]);
```

Do not replace `recordAttemptBodySchema`, `manualQuestionInputSchema`, or `generateQuestionsBodySchema` in this task.

- [ ] **Step 7: Add integration evidence that historical records still hydrate.**

Create a historical question without `questionType` and a historical attempt with only `answerText`. Assert both persist/read successfully and that no migration write occurs.

- [ ] **Step 8: Run Task 1 tests and backend typecheck.**

```bash
npm run test:unit
npm run test:integration
npm run typecheck --workspace @career-learning-hub/api
npm run typecheck:tests
```

Expected: all existing tests plus the new compatibility coverage pass.

- [ ] **Step 9: Operator-controlled commit gate.**

Do not commit automatically. Report the exact Task 1 diff and verification. If the operator separately authorizes a task commit, use a message equivalent to:

```text
Add Interview typed storage compatibility
```

---

### Task 2: Add legacy-aware serialization and hard MCQ answer-key secrecy

**Files:**
- Modify: `backend/src/modules/interviews/interview.service.ts`
- Modify: `backend/src/modules/interviews/interview.controller.ts`
- Modify: `backend/src/modules/interviews/interview.routes.ts` only if middleware wiring requires no new route
- Modify: `backend/src/tests/integration/interviewQuestionTypes.integration.test.ts`
- Create: `backend/src/tests/security/interviewQuestionTypes.security.test.ts`

**Interfaces produced:**

```ts
export interface PublicMultipleChoiceQuestion {
  options: Array<{ id: string; text: string }>;
}

export function serializeQuestionSummary(
  question: InterviewQuestionDocument | Record<string, unknown>,
): Record<string, unknown>;

export function serializeQuestionDetail(
  question: InterviewQuestionDocument,
  revealStudyMaterial?: boolean,
): Record<string, unknown>;
```

Required semantics:

- every question response exposes an effective `questionType`;
- historical missing storage emits `legacy-open-response`;
- MCQ public responses expose option IDs/text only;
- `correctOptionId` never appears in a question response;
- MCQ `modelAnswer` never appears through question detail before or after Study-mode reveal logic;
- post-submission correct-option reveal occurs through attempt serialization in Task 4, not question serialization.

- [ ] **Step 1: Write RED API/security tests for historical type serialization.**

For a stored historical question with no `questionType`, assert list/detail responses include:

```json
{
  "questionType": "legacy-open-response"
}
```

and still preserve the existing question/category/difficulty/pin/notes fields.

- [ ] **Step 2: Write RED answer-key leakage tests using a directly inserted MCQ fixture.**

Fixture storage should contain:

```ts
{
  questionType: "multiple-choice",
  multipleChoice: {
    options: [
      { id: "option-a", text: "A" },
      { id: "option-b", text: "B" },
    ],
    correctOptionId: "option-b",
  },
  modelAnswer: "The correct option is B.",
}
```

Assert all of these pre-submission surfaces omit both `correctOptionId` and revealing `modelAnswer`:

- question list;
- question detail in Study mode;
- pin response;
- notes response;
- explanation queue response;
- job response.

The public MCQ shape may contain only:

```ts
multipleChoice: {
  options: [
    { id: "option-a", text: "A" },
    { id: "option-b", text: "B" },
  ],
}
```

- [ ] **Step 3: Run the focused integration/security tests and verify RED.**

```bash
npm run test:integration -- --run \
  src/tests/integration/interviewQuestionTypes.integration.test.ts
npm run test:security -- --run \
  src/tests/security/interviewQuestionTypes.security.test.ts
```

Use the repository-supported equivalent if the script wrapper does not forward this exact filter.

- [ ] **Step 4: Implement one serializer boundary instead of ad-hoc deletion in controllers.**

`serializeQuestionSummary` must clone only the approved public fields and derive the effective type. For MCQ it copies option IDs/text and never copies the private key.

`serializeQuestionDetail` should build from the summary. For non-MCQ questions it may include the existing `modelAnswer`, `explanation`, and `explanationKeyPoints` only when `revealStudyMaterial` is true. For MCQ it may include an existing post-submission explanation when authorized by controller logic, but never `modelAnswer` or `correctOptionId`.

- [ ] **Step 5: Change question list serialization from raw lean documents to explicit mapping.**

Continue one database query and existing pagination. The query may select internal fields needed for serialization, but the controller response must be built through `serializeQuestionSummary`.

Do not change sorting, page size, pin/category/difficulty filters, or fingerprint uniqueness.

- [ ] **Step 6: Guard MCQ explanation generation before submission.**

In `queueQuestionExplanationController`, before queueing an MCQ explanation, require an owned attempt for that same `userId + sessionId + questionId`.

If none exists, throw:

```ts
new AppError(
  409,
  "INTERVIEW_MCQ_EXPLANATION_REQUIRES_ATTEMPT",
  "Submit an attempt before requesting the Multiple Choice explanation.",
);
```

Do not add an attempt ID to the route.

- [ ] **Step 7: Preserve ownership indistinguishability.**

The new security test must prove a second user cannot obtain the MCQ key, options beyond their owned resource, attempt-based reveal, or explanation. Existing ownership middleware remains authoritative.

- [ ] **Step 8: Re-run integration/security/typecheck.**

```bash
npm run test:integration
npm run test:security
npm run typecheck --workspace @career-learning-hub/api
npm run typecheck:tests
```

- [ ] **Step 9: Operator-controlled commit gate.**

Do not commit automatically. If separately authorized, proposed message:

```text
Protect Interview MCQ answer keys
```

---

### Task 3: Implement typed generation, exact type distribution, and typed manual question creation

**Files:**
- Create: `backend/src/modules/interviews/interviewQuestionDistribution.ts`
- Modify: `backend/src/modules/interviews/interview.schemas.ts`
- Modify: `backend/src/modules/interviews/interview.jobs.ts`
- Modify: `backend/src/modules/interviews/interview.controller.ts`
- Modify: `backend/src/modules/interviews/interview.service.ts`
- Modify: `backend/src/modules/interviews/interviewAi.service.ts`
- Create: `backend/src/tests/unit/interviewQuestionDistribution.test.ts`
- Modify: `backend/src/tests/integration/interviewQuestionTypes.integration.test.ts`
- Modify existing job execution/idempotency tests only for newly typed payload expectations

**Interfaces produced:**

```ts
export type InterviewQuestionTypeCounts = Partial<
  Record<InterviewQuestionType, number>
>;

export function resolveQuestionTypeCounts(input: {
  count: number;
  questionTypes: InterviewQuestionType[];
  typeCounts?: InterviewQuestionTypeCounts;
}): InterviewQuestionTypeCounts;

export function assertQuestionTypeDistribution(input: {
  questions: Array<{ questionType: InterviewQuestionType }>;
  expected: InterviewQuestionTypeCounts;
}): void;
```

Generation request body becomes:

```ts
{
  requestId: string;
  resumeVersionId?: string;
  count: number;
  categories: string[];
  difficultyMix?: {
    easy: number;
    medium: number;
    hard: number;
  };
  questionTypes: InterviewQuestionType[];
  typeCounts?: Partial<Record<InterviewQuestionType, number>>;
}
```

Provider structured output becomes a strict discriminated union. For MCQ the provider returns option strings and a correct index; the backend generates canonical option IDs.

- [ ] **Step 1: Write RED distribution tests.**

Required exact examples:

```ts
expect(
  resolveQuestionTypeCounts({
    count: 5,
    questionTypes: ["behavioral", "technical-explanation"],
  }),
).toEqual({
  behavioral: 3,
  "technical-explanation": 2,
});

expect(
  resolveQuestionTypeCounts({
    count: 6,
    questionTypes: ["multiple-choice", "coding"],
    typeCounts: { "multiple-choice": 2, coding: 4 },
  }),
).toEqual({ "multiple-choice": 2, coding: 4 });
```

Reject:

- zero selected types;
- duplicate selected types;
- negative/fractional counts;
- count for an unselected type;
- custom total not equal to `count`.

- [ ] **Step 2: Run the distribution unit test and verify RED.**

```bash
npm run test:unit -- --run \
  src/tests/unit/interviewQuestionDistribution.test.ts
```

- [ ] **Step 3: Implement deterministic balanced distribution.**

Balanced behavior is fixed: `Math.floor(count / selected.length)` to every selected type, then assign the remainder one-by-one in the submitted `questionTypes` order.

- [ ] **Step 4: Extend request Zod validation.**

Use `interviewQuestionTypeSchema`. Require at least one and at most six unique `questionTypes`. Validate `typeCounts` only for selected types and exact sum.

Do not add a session-level field.

- [ ] **Step 5: Extend manual-question input with typed MCQ data.**

Future body:

```ts
{
  questionType: InterviewQuestionType;
  category: string;
  difficulty: InterviewDifficulty;
  question: string;
  modelAnswer?: string;
  multipleChoice?: {
    options: string[];
    correctOptionIndex: number;
  };
}
```

Validation rules:

- MCQ requires `multipleChoice`;
- non-MCQ forbids `multipleChoice`;
- options 2–8;
- option text trimmed 1–500;
- duplicate option text rejected after exact trimmed comparison;
- correct index integer inside the option array;
- text-based types may use optional `modelAnswer` exactly as today.

- [ ] **Step 6: Add a backend canonicalizer for MCQ options.**

Inside `interview.service.ts` or a focused local helper, convert provider/manual option strings to:

```ts
const options = input.options.map((text) => ({
  id: randomUUID(),
  text,
}));

const multipleChoice = {
  options,
  correctOptionId: options[input.correctOptionIndex]!.id,
};
```

Provider/database callers never supply persistent option IDs.

- [ ] **Step 7: Extend the Gemini result schema and prove provider JSON-schema conversion works.**

Use `z.discriminatedUnion("questionType", ...)` inside `generatedQuestionSetSchema` with:

```ts
{
  questionType: "multiple-choice";
  category: string;
  difficulty: InterviewDifficulty;
  question: string;
  options: string[];
  correctOptionIndex: number;
  modelAnswer: string;
}
```

for MCQ, and the common text shape for the other five types.

Add a unit assertion through existing `toProviderJsonSchema(generatedQuestionSetSchema)` proving the generated Gemini-compatible object keeps the union (`oneOf`/`anyOf`) and does not throw `AI_RESPONSE_SCHEMA_UNSUPPORTED`.

- [ ] **Step 8: Extend the generation job payload with resolved type counts.**

`queueQuestionGenerationController` resolves and validates the distribution before enqueue. Payload carries:

```ts
questionTypes: request.body.questionTypes,
typeCounts: resolvedTypeCounts,
```

Keep the idempotency key based on the existing request UUID. Do not include a random value in the idempotency key.

- [ ] **Step 9: Make Gemini prompts type-aware without changing provider routing.**

Add explicit requested type distribution to `userPrompt`. Add system rules:

```text
Return exactly the requested question-type distribution.
For Multiple Choice, return 2–8 plausible distinct options and one correctOptionIndex.
For Coding, produce a text/code practice prompt only; do not require execution or hidden tests.
For Behavioral questions, do not invent candidate experience.
For Scenario-based questions, evaluate reasoning/trade-offs rather than claiming one universal real-world answer.
```

Keep all existing untrusted-data delimiters and protected-characteristic restrictions.

- [ ] **Step 10: Verify exact provider type distribution after Zod validation.**

After count and difficulty validation, run `assertQuestionTypeDistribution`. Provider drift must fail with a safe 502 code such as:

```text
AI_INTERVIEW_QUESTION_TYPE_MISMATCH
```

Do not silently redistribute or relabel Gemini output.

- [ ] **Step 11: Persist typed generated/manual questions transactionally.**

Add `questionType` to every new question. For MCQ persist canonical `multipleChoice`; for non-MCQ omit it. Preserve the existing question fingerprint and transaction/capacity logic.

- [ ] **Step 12: Add RED→GREEN integration coverage.**

Cover:

- all six manual types;
- MCQ manual validation;
- one-type generation;
- balanced mixed generation;
- custom exact counts;
- provider wrong type distribution rejected;
- provider invalid MCQ options/index rejected;
- duplicate fingerprint behavior unchanged;
- retry same job remains idempotent;
- execution fence prevents stale typed persistence.

- [ ] **Step 13: Run Task 3 verification.**

```bash
npm run test:unit
npm run test:integration
npm run typecheck --workspace @career-learning-hub/api
npm run typecheck:tests
```

No live Gemini call yet.

- [ ] **Step 14: Operator-controlled commit gate.**

Proposed message if separately authorized:

```text
Add typed Interview question generation
```

---

### Task 4: Record typed attempts and score Multiple Choice deterministically

**Files:**
- Modify: `backend/src/modules/interviews/interview.schemas.ts`
- Modify: `backend/src/modules/interviews/interview.service.ts`
- Modify: `backend/src/modules/interviews/interview.controller.ts`
- Modify: `backend/src/tests/integration/interviewQuestionTypes.integration.test.ts`
- Modify: `backend/src/tests/security/interviewQuestionTypes.security.test.ts`

**Interfaces produced:**

```ts
export type RecordInterviewAttemptInput =
  | { answerText: string }
  | { answer: TypedInterviewAnswer };

export function serializeInterviewAttempt(input: {
  attempt: InterviewAttemptDocument | Record<string, unknown>;
  question?: InterviewQuestionDocument | Record<string, unknown>;
  revealCorrectOption: boolean;
}): Record<string, unknown>;
```

`recordAttemptBodySchema` accepts either:

```ts
{ answerText: string }
```

or:

```ts
{ answer: TypedInterviewAnswer }
```

but the service—not the client discriminator—decides which representation is legal from the canonical stored question.

- [ ] **Step 1: Write RED service/API mismatch tests.**

Required cases:

- legacy question accepts `answerText`;
- legacy question rejects modern `answer`;
- modern text question accepts matching typed answer;
- modern text question rejects `answerText`;
- modern text question rejects another modern type discriminator;
- MCQ accepts a real option ID;
- MCQ rejects unknown option ID;
- MCQ rejects text answer;
- typed answer remains immutable after save.

- [ ] **Step 2: Write RED deterministic MCQ scoring tests.**

For a question whose private key is `option-b`:

```ts
expect(correctAttempt.evaluation).toEqual({
  kind: "multiple-choice",
  score: 100,
  correct: true,
});

expect(incorrectAttempt.evaluation).toEqual({
  kind: "multiple-choice",
  score: 0,
  correct: false,
});
```

No Gemini adapter mock should be called for the correctness calculation.

- [ ] **Step 3: Replace the route-body schema with a strict compatibility union.**

Use:

```ts
export const recordAttemptBodySchema = z.union([
  z.object({
    answerText: z.string().trim().min(1).max(50_000),
  }).strict(),
  z.object({
    answer: typedInterviewAnswerSchema,
  }).strict(),
]);
```

- [ ] **Step 4: Implement canonical service validation.**

Pseudo-code must follow this exact trust order:

```ts
const effectiveType = effectiveInterviewQuestionType(input.question);

if (effectiveType === "legacy-open-response") {
  if (!("answerText" in input.submission)) rejectMismatch();
  return createLegacyAttempt();
}

if (!("answer" in input.submission)) rejectMismatch();
if (input.submission.answer.type !== effectiveType) rejectMismatch();

if (effectiveType === "multiple-choice") {
  const selected = input.question.multipleChoice?.options.find(
    (option) => option.id === input.submission.answer.selectedOptionId,
  );
  if (!selected || !input.question.multipleChoice) rejectSelection();
  const correct =
    selected.id === input.question.multipleChoice.correctOptionId;
  return createTypedAttempt({
    evaluation: {
      kind: "multiple-choice",
      score: correct ? 100 : 0,
      correct,
    },
  });
}

return createTypedTextAttempt();
```

Use safe 400/409 application errors; never trust the submitted type alone.

- [ ] **Step 5: Add attempt serialization with post-submission reveal only.**

Historical attempt response:

```ts
{
  answerText: "..."
}
```

Modern text attempt response:

```ts
{
  answer: { type: "behavioral", text: "..." }
}
```

MCQ response after the owned attempt exists:

```ts
{
  answer: {
    type: "multiple-choice",
    selectedOptionId: "option-a"
  },
  evaluation: {
    kind: "multiple-choice",
    score: 0,
    correct: false,
    correctOptionId: "option-b"
  }
}
```

`correctOptionId` is derived from the owned canonical question during serialization; it is never copied into the attempt document.

- [ ] **Step 6: Avoid N+1 reads for attempt pages.**

When serializing a page of attempts, query all unique question IDs for that page in one owned `InterviewQuestionModel.find({ _id: { $in: ids }, userId, sessionId })`, build a map, then serialize. Do not issue one question query per attempt.

- [ ] **Step 7: Update record/list/detail controllers to use the serializer.**

No route path changes. Preserve page/filter behavior and existing ownership middleware.

- [ ] **Step 8: Run integration/security tests proving correct-option reveal is owned and post-submission.**

A second user must never receive the correct option for another user's attempt/question.

- [ ] **Step 9: Run Task 4 gate.**

```bash
npm run test:integration
npm run test:security
npm run typecheck --workspace @career-learning-hub/api
npm run typecheck:tests
```

- [ ] **Step 10: Operator-controlled commit gate.**

Proposed message if separately authorized:

```text
Add typed Interview attempts and MCQ scoring
```

---

### Task 5: Make feedback/explanation type-aware while preserving Gemini resilience

**Files:**
- Modify: `backend/src/modules/interviews/interviewAi.service.ts`
- Modify: `backend/src/modules/interviews/interview.controller.ts`
- Modify: `backend/src/tests/integration/interviewQuestionTypes.integration.test.ts`
- Modify existing AI retry/job response tests only where typed feedback behavior adds an assertion

**Interfaces produced:**

```ts
function feedbackCriteriaForType(
  type: EffectiveInterviewQuestionType,
): string[];
```

Required criteria:

```ts
const criteria: Record<EffectiveInterviewQuestionType, string[]> = {
  "legacy-open-response": [
    "Evaluate relevance, structure, clarity, evidence, and completeness.",
  ],
  "short-answer": [
    "Evaluate concise relevance, correctness, and completeness.",
  ],
  coding: [
    "Review the submitted code/text as interview practice only.",
    "Discuss reasoning, correctness risks, complexity, readability, and edge cases without claiming execution.",
  ],
  behavioral: [
    "Evaluate truthful evidence, structure, specificity, clarity, and relevance.",
    "Do not invent candidate facts.",
  ],
  "scenario-based": [
    "Evaluate assumptions, trade-offs, sequencing, risk awareness, and clarity.",
  ],
  "technical-explanation": [
    "Evaluate conceptual correctness, relevance, completeness, and clarity.",
  ],
  "multiple-choice": [],
};
```

- [ ] **Step 1: Write RED tests proving each text type adds its own feedback criteria.**

Use the existing mocked `generateStructuredOutput` boundary. Assert the user answer remains inside the existing untrusted delimiters and that the prompt includes the expected type-specific criteria.

- [ ] **Step 2: Write RED proof that MCQ correctness does not enqueue Gemini feedback.**

`queueAttemptFeedbackController` should reject MCQ with a safe conflict such as:

```ts
new AppError(
  409,
  "INTERVIEW_MCQ_FEEDBACK_NOT_REQUIRED",
  "Multiple Choice correctness is already available from the saved attempt.",
);
```

The first implementation does not add optional MCQ AI explanation through the feedback endpoint.

- [ ] **Step 3: Make `generateAttemptFeedback` read the canonical typed answer safely.**

For historical questions, continue using `attempt.answerText` unchanged.

For modern text questions, require `attempt.answer?.type === effectiveType` and use `attempt.answer.text` inside `<UNTRUSTED_WRITTEN_ANSWER>`.

If stored typed data is inconsistent, fail safely instead of guessing.

- [ ] **Step 4: Preserve all job lifecycle behavior.**

Do not change:

- `interview.attempt.feedback` job type;
- idempotency key construction;
- retry count;
- cancellation;
- execution fencing;
- `beginPersistence()` timing;
- transactional feedback persistence;
- provider/model metadata on Gemini-generated feedback.

- [ ] **Step 5: Make question explanation prompt type-aware.**

Include a human-readable type and type-specific study instruction. Coding explanation must explicitly avoid execution claims. Behavioral explanation must avoid invented experience.

MCQ explanation remains blocked until at least one owned attempt exists, per Task 2. It may then provide a study explanation, but `serializeQuestionDetail` still never exposes the private key or MCQ model answer.

- [ ] **Step 6: Re-run focused AI/job tests plus integration.**

```bash
npm run test:unit
npm run test:integration
npm run typecheck --workspace @career-learning-hub/api
npm run typecheck:tests
```

No live Gemini call yet.

- [ ] **Step 7: Operator-controlled commit gate.**

Proposed message if separately authorized:

```text
Make Interview feedback type-aware
```

---

### Task 6: Extend frontend types, runtime contracts, and API requests safely

**Files:**
- Modify: `frontend/src/features/interviews/types.ts`
- Modify: `frontend/src/features/interviews/interviewContracts.ts`
- Modify: `frontend/src/features/interviews/interviewApi.ts`
- Modify: `frontend/src/features/interviews/interviewContracts.test.ts`
- Modify: `frontend/src/features/interviews/interviewApi.test.ts`

**Interfaces produced:**

```ts
export type InterviewQuestionType =
  | "multiple-choice"
  | "short-answer"
  | "coding"
  | "behavioral"
  | "scenario-based"
  | "technical-explanation";

export type EffectiveInterviewQuestionType =
  | InterviewQuestionType
  | "legacy-open-response";

export type TypedInterviewAnswer =
  | { type: "multiple-choice"; selectedOptionId: string }
  | { type: "short-answer"; text: string }
  | { type: "coding"; text: string }
  | { type: "behavioral"; text: string }
  | { type: "scenario-based"; text: string }
  | { type: "technical-explanation"; text: string };

export interface InterviewMultipleChoicePublic {
  options: Array<{ id: string; text: string }>;
}
```

Update question shapes:

```ts
export interface InterviewQuestionSummary {
  // existing fields
  questionType: EffectiveInterviewQuestionType;
  multipleChoice?: InterviewMultipleChoicePublic;
}
```

Update attempt shape into a compatibility union rather than making impossible fields optional everywhere:

```ts
export type InterviewAttempt = InterviewAttemptBase & (
  | { answerText: string; answer?: never; evaluation?: never }
  | {
      answer: TypedInterviewAnswer;
      answerText?: never;
      evaluation?: {
        kind: "multiple-choice";
        score: 0 | 100;
        correct: boolean;
        correctOptionId: string;
      };
    }
);
```

- [ ] **Step 1: Write RED runtime-contract tests for all seven effective response types.**

Cover six modern types plus `legacy-open-response`.

- [ ] **Step 2: Write RED MCQ contract security tests.**

The frontend question parser must reject malformed MCQ responses:

- fewer than 2 or more than 8 options;
- blank/duplicate IDs;
- blank option text;
- duplicate option IDs;
- `multipleChoice` present on a non-MCQ question;
- MCQ missing public options.

If the parser receives a question object containing `correctOptionId`, fail `INVALID_INTERVIEW_RESPONSE` rather than silently ignoring it. This makes accidental server leakage visible in development/tests.

- [ ] **Step 3: Write RED attempt parser tests.**

Cover:

- legacy `answerText`;
- each modern text answer;
- MCQ answer + evaluation;
- answer/question identity mismatch when an expected type is supplied;
- invalid evaluation score not equal to 0/100;
- missing post-submit MCQ `correctOptionId`.

- [ ] **Step 4: Implement strict parser helpers.**

Add:

```ts
function questionType(value: unknown): EffectiveInterviewQuestionType;
function typedAnswer(value: unknown): TypedInterviewAnswer;
function multipleChoicePublic(value: unknown): InterviewMultipleChoicePublic;
```

Continue the current manual runtime-parser style; do not add Zod to the frontend.

- [ ] **Step 5: Extend API request types.**

Generation input:

```ts
{
  requestId: string;
  count: number;
  categories: string[];
  questionTypes: InterviewQuestionType[];
  typeCounts?: Partial<Record<InterviewQuestionType, number>>;
}
```

Manual input:

```ts
export interface ManualInterviewQuestionInput {
  questionType: InterviewQuestionType;
  category: string;
  difficulty: InterviewDifficulty;
  question: string;
  modelAnswer?: string;
  multipleChoice?: {
    options: string[];
    correctOptionIndex: number;
  };
}
```

Attempt API becomes:

```ts
export async function recordInterviewAttempt(
  sessionId: string,
  questionId: string,
  submission:
    | { answerText: string }
    | { answer: TypedInterviewAnswer },
  signal?: AbortSignal,
)
```

- [ ] **Step 6: Preserve canonical request normalization.**

Trim text fields/options, retain selected-type order, do not invent missing counts, and do not send `typeCounts` when balanced default is selected.

- [ ] **Step 7: Add API request-shape tests.**

Assert exact bodies for:

- single-type generation;
- mixed balanced generation;
- mixed explicit counts;
- manual MCQ;
- manual text question;
- legacy attempt body;
- modern typed text attempt;
- MCQ attempt.

- [ ] **Step 8: Run Task 6 frontend gate.**

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/interviews/interviewContracts.test.ts \
  src/features/interviews/interviewApi.test.ts
npm run typecheck --workspace @career-learning-hub/web
```

- [ ] **Step 9: Operator-controlled commit gate.**

Proposed message if separately authorized:

```text
Add Interview question-type client contracts
```

---

### Task 7: Add type-selection, manual MCQ, type-specific answers, and Saved Attempts presentation

**Files:**
- Create: `frontend/src/features/interviews/InterviewQuestionTypeControls.tsx`
- Create: `frontend/src/features/interviews/InterviewQuestionTypeControls.test.tsx`
- Create: `frontend/src/features/interviews/InterviewAnswerControl.tsx`
- Create: `frontend/src/features/interviews/InterviewAnswerControl.test.tsx`
- Modify: `frontend/src/features/interviews/InterviewSessionWorkspace.tsx`
- Modify: `frontend/src/features/interviews/InterviewSessionWorkspace.test.tsx`
- Modify: `frontend/src/features/interviews/interviewCoach.css`

**Interfaces produced:**

```ts
export const QUESTION_TYPE_OPTIONS: ReadonlyArray<{
  value: InterviewQuestionType;
  label: string;
}> = [
  { value: "multiple-choice", label: "Multiple Choice" },
  { value: "short-answer", label: "Short Answer" },
  { value: "coding", label: "Coding" },
  { value: "behavioral", label: "Behavioral" },
  { value: "scenario-based", label: "Scenario-based" },
  {
    value: "technical-explanation",
    label: "Technical Explanation",
  },
];

interface InterviewQuestionTypeControlsProps {
  count: number;
  selected: InterviewQuestionType[];
  explicitCounts?: Partial<Record<InterviewQuestionType, number>>;
  disabled?: boolean;
  onSelectedChange(next: InterviewQuestionType[]): void;
  onExplicitCountsChange(
    next?: Partial<Record<InterviewQuestionType, number>>,
  ): void;
}
```

```ts
interface InterviewAnswerControlProps {
  question: InterviewQuestionDetail;
  textValue: string;
  selectedOptionId: string;
  disabled?: boolean;
  error?: SafeError | null;
  onTextChange(value: string): void;
  onSelectedOptionChange(optionId: string): void;
  onSubmit(): void;
}
```

The workspace may retain its existing stale-operation/controller machinery. Do not rewrite provider polling or selection state management.

- [ ] **Step 1: Write RED `InterviewQuestionTypeControls` tests.**

Cover:

- six exact labels;
- at least one selected requirement;
- select one/many;
- selected order is stable;
- default balanced mode sends no explicit counts;
- `Set counts` disclosure;
- explicit count inputs only for selected types;
- sum must equal Question count;
- count update invalidates stale explicit totals with a visible validation message;
- keyboard operation and accessible checkbox/input names.

- [ ] **Step 2: Implement the compact type control.**

Use native checkboxes/chip styling and native number inputs. No custom combobox/multi-select package. Do not add a wizard.

Default initial selection in the workspace should be:

```ts
["short-answer"]
```

This preserves the closest familiar written-practice experience while making type choice explicit for every new generation request.

- [ ] **Step 3: Write RED manual-question UI tests.**

Manual form must place `Question type` before Category/Difficulty.

For MCQ:

- starts with two option fields;
- Add option up to 8;
- Remove option only while at least 2 remain;
- one correct-answer radio;
- blank/duplicate options rejected;
- correct selection required;
- submission sends option strings + correct index.

For the other five types, hide MCQ controls and keep existing Question/Model answer fields.

Switching away from MCQ clears MCQ draft state so hidden values are never submitted accidentally.

- [ ] **Step 4: Integrate generation controls into the existing Add Questions area.**

Extend existing generation state with:

```ts
const [generationQuestionTypes, setGenerationQuestionTypes] =
  useState<InterviewQuestionType[]>(["short-answer"]);
const [generationTypeCounts, setGenerationTypeCounts] = useState<
  Partial<Record<InterviewQuestionType, number>> | undefined
>();
```

`submitGeneration()` passes the exact selected types/counts while preserving the existing UUID intent, single-flight behavior, transport ambiguity handling, polling, cancel/retry, reload, and stale-operation guards.

- [ ] **Step 5: Show a restrained type label in question list/detail.**

Map:

```ts
const questionTypeLabels: Record<EffectiveInterviewQuestionType, string> = {
  "multiple-choice": "Multiple Choice",
  "short-answer": "Short Answer",
  coding: "Coding",
  behavioral: "Behavioral",
  "scenario-based": "Scenario-based",
  "technical-explanation": "Technical Explanation",
  "legacy-open-response": "Open response",
};
```

Do not render the internal `legacy-open-response` token.

- [ ] **Step 6: Write RED `InterviewAnswerControl` tests.**

Required rendering:

- `multiple-choice` → native radio group from canonical option IDs;
- `short-answer` → compact textarea;
- `coding` → larger monospace textarea with no Run/Execute control;
- `behavioral` → multiline textarea;
- `scenario-based` → multiline textarea;
- `technical-explanation` → multiline textarea;
- `legacy-open-response` → current Written answer textarea semantics.

MCQ submit is disabled until one option is selected. Text submit is disabled/invalid when trimmed text is empty or over the existing bound.

- [ ] **Step 7: Integrate typed attempt submission without disturbing stale-write protection.**

Keep the existing question-selection sequence/controller checks.

Submission mapping:

```ts
const submission =
  selectedQuestion.questionType === "legacy-open-response"
    ? { answerText: answerDraft.trim() }
    : selectedQuestion.questionType === "multiple-choice"
      ? {
          answer: {
            type: "multiple-choice" as const,
            selectedOptionId,
          },
        }
      : {
          answer: {
            type: selectedQuestion.questionType,
            text: answerDraft.trim(),
          },
        };
```

After success, clear only the answer state belonging to the current selected question.

- [ ] **Step 8: Update Saved Attempts rendering for typed answers.**

For each selected attempt:

- legacy → existing answer text;
- typed text → stored `answer.text`;
- MCQ → selected option text resolved from the selected question options, plus `Correct` or `Needs review` from deterministic evaluation and score `100/100` or `0/100`;
- post-submit MCQ may show `Correct answer: <option text>` using `evaluation.correctOptionId` mapped through public options;
- do not show a Request feedback button for MCQ;
- text-based/legacy feedback flow stays unchanged.

Keep Saved Attempts immutable and retain current date/status/pagination behavior.

- [ ] **Step 9: Make explanation actions secure and understandable.**

Before an MCQ attempt, hide/disable explanation action with copy equivalent to `Submit an attempt to unlock the explanation.` After a saved MCQ attempt, allow the existing explanation request flow.

Do not reveal the answer key in DOM before submission.

- [ ] **Step 10: Add scoped CSS only.**

Add styles for:

- question-type chip/checkbox group;
- explicit-count disclosure/grid;
- MCQ option editor;
- MCQ answer radio group;
- monospace Coding textarea;
- restrained question-type label;
- deterministic result badge.

Reuse current Interview breakpoints/tokens and maintain 390px mobile + 200% zoom usability. No global app-shell changes.

- [ ] **Step 11: Run focused frontend RED→GREEN bundle.**

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/interviews/InterviewQuestionTypeControls.test.tsx \
  src/features/interviews/InterviewAnswerControl.test.tsx \
  src/features/interviews/InterviewSessionWorkspace.test.tsx \
  src/features/interviews/InterviewSessionWorkspace.savedAttempts.test.tsx \
  src/features/interviews/interviewContracts.test.ts \
  src/features/interviews/interviewApi.test.ts
npm run typecheck --workspace @career-learning-hub/web
```

- [ ] **Step 12: Operator-controlled commit gate.**

Proposed message if separately authorized:

```text
Add Interview question-type workspace UX
```

---

### Task 8: Run complete regression, one controlled live Gemini acceptance, human Chrome QA, and governance handoff

**Files:**
- Modify implementation/test files only when a reproduced regression requires a bounded repair.
- Modify governance documentation only after fresh automated/live/human evidence exists.
- Candidate governance files after evidence:
  - `docs/planning/CURRENT_PHASE.md`
  - existing Phase 19B planning/closeout record if the repository already uses one for this phase.

**Interfaces:**
- Produces final evidence for deciding whether `CLH-FEATURE-INTERVIEW-011` can be marked implemented and whether Phase 19B can proceed to its merge/closeout gate.

- [ ] **Step 1: Verify the exact executable checkpoint and clean scope.**

```bash
git branch --show-current
git rev-parse HEAD
git status --short
git diff --check
git --no-pager diff --name-only \
  fcfeef6bfa34fe84a6e2449ace771b829b986a27..HEAD
```

Expected branch: `phase-19b-interview-coach-refinements`.

Review every changed path. No package/lockfile, provider, environment, deployment, unrelated Resume/Learning/Dashboard/Auth, or Phase 19C+ change is allowed.

- [ ] **Step 2: Run the complete frontend suite.**

```bash
npm run test --workspace @career-learning-hub/web
npm run typecheck --workspace @career-learning-hub/web
```

Expected: all frontend tests pass; pre-existing non-failing stderr warnings must be reported separately rather than misclassified as this feature's failure.

- [ ] **Step 3: Run backend unit/integration/security gates.**

```bash
npm run test:unit
npm run test:integration
npm run test:security
npm run typecheck:tests
npm run typecheck
```

Expected: all suites/typechecks pass.

- [ ] **Step 4: Run production build and whitespace checks.**

```bash
npm run build
git diff --check
```

Vite advisory bundle warnings may be reported if the build still succeeds; do not expand 011 into unrelated chunk-optimization work.

- [ ] **Step 5: Run a secret/answer-key-oriented source scan.**

Inspect changed frontend files and serialized response fixtures for `correctOptionId`. Legitimate post-submit attempt handling is allowed; pre-submit question fixtures/UI must not contain the key.

Also verify no API key/credential-like value entered the diff.

- [ ] **Step 6: Start local runtime only after automated gates are green.**

If the execution environment cannot keep both services alive, operator commands are:

Terminal 1:

```bash
cd "/Users/prabhathmalinda/Documents/Projects/Career Learning Hub"
npm run dev:backend
```

Terminal 2:

```bash
cd "/Users/prabhathmalinda/Documents/Projects/Career Learning Hub"
npm run dev:frontend
```

Use the URLs actually printed by the processes.

- [ ] **Step 7: Perform one controlled live Gemini question-generation acceptance.**

Use a disposable/new Interview session and request a small mixed set, for example count 6 with:

```text
Multiple Choice: 1
Short Answer: 1
Coding: 1
Behavioral: 1
Scenario-based: 1
Technical Explanation: 1
```

Verify:

- job `queued → processing → completed`;
- exactly six questions persisted;
- exact requested type distribution;
- MCQ has 2–8 usable options;
- browser/network payload before submission has no correct key;
- Coding question is text-practice appropriate and does not require execution;
- no OpenRouter request occurs.

Do not repeatedly retry a schema failure. If live structured output fails, capture the safe job error and use systematic debugging before another code-changing attempt.

- [ ] **Step 8: Perform one controlled live text-feedback acceptance.**

Submit one answer to a modern text type and request feedback. Verify the job completes and the returned practice guidance matches the type-specific criteria without claiming objective hiring judgment.

MCQ correctness must already work with Gemini unavailable and is not part of this live feedback call.

- [ ] **Step 9: Human Chrome QA matrix.**

Verify at minimum:

- 1440×900 desktop;
- 768×1024 responsive layout;
- 390×844 mobile;
- actual Chrome 200% zoom;
- keyboard-only type selection/count editing;
- all six type labels;
- balanced mixed generation;
- explicit type counts and validation;
- manual MCQ 2–8 option editing and correct-answer radio;
- question list/detail type labels;
- MCQ radio answering by keyboard;
- no MCQ answer key visible in DOM/network before submit;
- correct/incorrect result and correct answer after owned submission;
- Short Answer textarea;
- Coding monospace editor and absence of Run/Execute action;
- Behavioral textarea;
- Scenario-based textarea;
- Technical Explanation textarea;
- legacy historical question retains the existing Open response/Written answer behavior;
- Saved Attempts handles legacy, typed text, and MCQ attempts;
- MCQ has no Gemini feedback button;
- MCQ explanation is locked until attempt and usable afterward;
- pin/notes/question pagination/attempt pagination continue to work;
- completed/archived readonly behavior remains truthful;
- cancel/retry/progress UI remains meaningful during Gemini jobs.

- [ ] **Step 10: Re-run the most relevant automated tests after any human-QA repair.**

A visual or interaction repair is not accepted only because it looks correct; rerun its focused tests, frontend typecheck, and production build.

- [ ] **Step 11: Update governance only after evidence is complete.**

Truthful target state if every gate passes:

```text
CLH-FEATURE-INTERVIEW-011 — IMPLEMENTED / AUTOMATED VERIFIED / LIVE GEMINI VERIFIED / HUMAN QA APPROVED
```

Record that Q2 was implemented with historical compatibility and backend-private MCQ keys. Do not claim Phase 19B merged or deployed unless those separate actions actually happen.

If any gate is incomplete, record the exact partial state instead.

- [ ] **Step 12: Stop at Git publication/Phase 19B closeout gate.**

Do not push, open a PR, merge to `main`, deploy, or activate Phase 19C without separate operator authorization.

## Plan Self-Review

### Spec coverage

- Six exact selectable types: Task 3 backend + Task 7 frontend.
- Single/multi/balanced/custom type counts: Task 3 distribution + Task 7 controls.
- Visible type labels: Task 7.
- Type-appropriate answer controls: Task 7.
- Type-aware Gemini generation: Task 3.
- Type-aware text feedback: Task 5.
- MCQ deterministic scoring: Task 4.
- MCQ answer-key secrecy: Task 2 + Task 4 + Task 6 + Task 8.
- Existing sessions/questions compatibility: Task 1 + Task 2.
- Historical attempts/feedback preserved without destructive migration: Task 1 + Task 4.
- No silent historical classification: `effectiveInterviewQuestionType` maps only missing storage to compatibility-only `legacy-open-response`.
- No session-level type-plan persistence: preserved throughout.
- Existing fingerprint semantics: explicitly unchanged in Tasks 1 and 3.
- Existing ownership/routes/pagination/jobs/idempotency/retry/cancel/fencing/transactions: explicitly preserved in all backend tasks.
- Coding non-execution boundary: Tasks 3, 5, 7, 8.
- Gemini Direct only: Tasks 3, 5, 8.
- No new dependency/infrastructure/provider: global constraints and Task 8 scope check.

### Type consistency

- Backend modern type values exactly match frontend modern type values.
- `legacy-open-response` exists only as an effective compatibility response type, never as a modern persisted selectable type.
- MCQ provider/manual inputs use option text + correct index; backend persistence uses canonical option IDs + private correct ID; frontend questions receive option IDs/text only; attempts submit selected option ID.
- Attempt storage never duplicates the MCQ correct option. Post-submit response derives `correctOptionId` from the owned canonical question.
- Text modern attempts use `{ answer: { type, text } }`; historical attempts keep `{ answerText }`.
- Existing feedback subdocument remains Gemini-only practice guidance; deterministic MCQ `evaluation` is separate.

### Security/correctness review

- Pre-submit question responses cannot serialize the MCQ key.
- Frontend contract tests fail loudly if a question response contains `correctOptionId`.
- Direct API misuse cannot bypass type/answer matching because the service reads canonical stored question type.
- MCQ correctness does not require Gemini availability.
- Historical data is read in place and never bulk-rewritten.
- Cross-user ownership behavior remains controlled by existing middleware and is re-proven by security tests.

### Unfinished-marker review

The implementation plan contains no unresolved engineering marker requiring an implementer to invent missing behavior. Every task names its files, interfaces, expected RED/GREEN behavior, commands, and stop conditions.

## Approval gate

Creating this plan does **not** authorize Task 1 implementation.

Before implementation begins, the operator must explicitly approve this plan. A suitable approval token is:

```text
PHASE_19B3_QUESTION_TYPES_IMPLEMENTATION_PLAN_APPROVED
```

After that approval, execute Task 1 only, verify its RED→GREEN gate, report evidence, and continue task-by-task. Git commits, pushes, PR creation, merges, deployments, and Phase 19C activation remain separately gated.