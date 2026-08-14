# Phase 19B-3 — Interview Question-Type Architecture Design

## Status

`AUDIT COMPLETE / DESIGN PROPOSED / IMPLEMENTATION NOT AUTHORIZED`

This document is the architecture-only deliverable for `CLH-FEATURE-INTERVIEW-011` on branch `phase-19b-interview-coach-refinements`.

Audit checkpoint: `ced0b2f` (`Update Interview route regression for Phase 19B`).

No question-type implementation is authorized by this document. No schema, route, API, frontend control, Gemini prompt, migration, or production behavior has been changed by this audit.

The recommendation follows the project constraint to build the smallest secure and functional solution suitable for a university project, reuse the existing architecture, and avoid enterprise-grade complexity unless required for correctness or security.

---

# 1. Current architecture map

## 1.1 Session configuration

`InterviewSession` currently stores:

- user ownership;
- title;
- optional Resume and Resume Version references;
- target role;
- experience level;
- `focusTopics: string[]`;
- `skillGaps: string[]`;
- optional job description;
- session mode: `study | written-practice | mock-interview`;
- lifecycle status;
- question count;
- timestamps.

There is no session-level question-type plan, type mix, or per-type count configuration.

The current frontend Create Interview flow creates the session only. Question generation occurs later from the session workspace.

## 1.2 Manual question creation

The existing manual-question input accepts:

- `category`;
- `difficulty`;
- `question`;
- optional `modelAnswer`.

The backend validates those fields with Zod, fingerprints the question text, reserves question capacity transactionally, and writes one `InterviewQuestion`.

## 1.3 AI question generation

The existing generation request accepts:

- `requestId`;
- optional Resume Version;
- total `count`;
- `categories`;
- optional `difficultyMix`.

The request is queued as `interview.questions.generate` using the existing job framework and idempotency key based on user, session, and request ID.

The worker:

1. reloads the owned session;
2. checks archive state and remaining capacity;
3. resolves the optional Resume Version;
4. calls Gemini Direct through `generateStructuredOutput`;
5. validates a strict generated-question schema;
6. verifies exact requested count;
7. verifies the requested difficulty distribution when present;
8. fingerprints question text;
9. de-duplicates candidates;
10. persists questions transactionally;
11. increments session question count;
12. records activity.

The current Gemini result shape is:

```ts
{
  category: string;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  modelAnswer: string;
}
```

## 1.4 Question persistence

`InterviewQuestion` currently stores:

```ts
{
  userId;
  sessionId;
  source: "manual" | "ai-generated";
  category;
  difficulty;
  question;
  questionFingerprint;
  modelAnswer?;
  explanation?;
  explanationKeyPoints[];
  explanationJobId?;
  generationJobId?;
  isPinned;
  userNotes?;
  createdAt;
  updatedAt;
}
```

There is no `questionType`, no Multiple Choice options, and no private answer key.

The fingerprint is SHA-256 over normalized question text only. It intentionally does not include difficulty, category, answer content, or future type metadata.

## 1.5 Question serialization

Question list responses intentionally exclude:

- model answer;
- explanation;
- explanation key points;
- fingerprint.

Question detail uses `serializeQuestionDetail()` and currently reveals model-answer/explanation content in Study mode or after an explanation is available.

This existing behavior is safe for the current open-response model but is not sufficient for Multiple Choice because a correct answer must never be disclosed before submission.

## 1.6 Frontend contracts

The frontend maintains strict runtime parsing into common shapes:

```ts
interface InterviewQuestionSummary {
  id: string;
  sessionId: string;
  source: InterviewQuestionSource;
  category: string;
  difficulty: InterviewDifficulty;
  question: string;
  isPinned: boolean;
  userNotes?: string;
  createdAt: string;
  updatedAt: string;
}
```

and:

```ts
interface InterviewQuestionDetail
  extends InterviewQuestionSummary {
  modelAnswer?: string;
  explanation?: string;
  explanationKeyPoints: string[];
}
```

There is no question-type discriminator or type-specific payload.

## 1.7 Attempt persistence

`InterviewAttempt` currently stores one immutable written answer:

```ts
{
  userId;
  sessionId;
  questionId;
  answerText: string;
  status;
  feedbackJobId?;
  feedback?;
  feedbackError?;
  createdAt;
  updatedAt;
}
```

`answerText` is required, bounded, trimmed, and immutable.

## 1.8 Attempt feedback

Feedback is queued as `interview.attempt.feedback` using the existing job framework and attempt-based idempotency key.

The worker reloads the canonical attempt, question, and session. Gemini then evaluates the written answer against role/session context and optional model-answer framework.

The current feedback result contains:

- score 0–100;
- summary;
- strengths;
- improvements;
- suggested answer outline;
- provider/model/prompt metadata after persistence.

## 1.9 Ownership and route boundaries

The current route hierarchy is already sufficient:

```text
/interview-sessions
/interview-sessions/:sessionId/questions
/interview-sessions/:sessionId/questions/:questionId
/interview-sessions/:sessionId/questions/:questionId/attempts
/interview-sessions/:sessionId/attempts/:attemptId
/interview-sessions/:sessionId/attempts/:attemptId/feedback
```

Ownership middleware verifies user + session + question/attempt identity before protected controllers execute.

The future architecture should reuse these routes and ownership checks rather than creating parallel routes per question type.

---

# 2. Exact original `CLH-FEATURE-INTERVIEW-011` requirements

The requested selectable question types are exactly:

1. Multiple choice
2. Short answer
3. Coding
4. Behavioral
5. Scenario-based
6. Technical explanation

A future implementation must support:

- selecting one type;
- selecting multiple types;
- balanced mixed generation;
- optional exact counts by type;
- visible question type in the Interview workspace;
- type-appropriate answer controls;
- type-aware Gemini generation;
- type-aware feedback/scoring;
- compatibility with existing sessions, questions, attempts, and completed feedback.

Phase 19B-3 defines the architecture only.

---

# 3. Data-model gap analysis

## 3.1 Question model gap

The current question model cannot distinguish whether a prompt is Multiple Choice, Coding, Behavioral, Scenario-based, Short Answer, or Technical Explanation.

It also cannot safely store:

- Multiple Choice options;
- a private correct-answer key;
- type-specific answer expectations.

A frontend-only type label would therefore be cosmetic and incorrect because persistence, generation, response validation, answering, and scoring would still operate as one generic written-question model.

## 3.2 Attempt model gap

The current required `answerText` field cannot represent Multiple Choice correctly without encoding an option selection into arbitrary text.

Doing that would create ambiguous semantics such as:

```text
answerText = "B"
```

where the backend would not know whether `B` is:

- an option identifier;
- user prose;
- an option label;
- a legacy answer.

A future implementation therefore needs a discriminated answer representation.

## 3.3 Session model gap

No persistent session-schema change is required merely to support type mixes.

The smallest design keeps question-type selection request-scoped to question generation. A session naturally becomes single-type or mixed according to the questions it contains.

Persisting a session-level “type plan” would add state that can become stale after later manual additions or additional generation requests. It is therefore not recommended for the first implementation.

---

# 4. Frontend contract gap analysis

The current frontend parsers understand one common question shape and one `answerText` attempt shape.

A correct implementation needs:

- an effective question-type discriminator in question responses;
- public Multiple Choice option data;
- no pre-submission answer key;
- typed attempt request/response parsing;
- compatibility parsing for historical questions/attempts;
- type-specific rendering and answer controls.

The existing strict parser boundary should be retained. New response fields must be validated rather than passed through as untrusted arbitrary objects.

---

# 5. Gemini structured-output gap analysis

The current generation schema has no `questionType` and no union of type-specific payloads.

The future generation schema must become a strict discriminated union.

Recommended logical provider result:

```ts
type GeneratedInterviewQuestion =
  | {
      questionType: "multiple-choice";
      category: string;
      difficulty: InterviewDifficulty;
      question: string;
      options: string[];
      correctOptionIndex: number;
      modelAnswer: string;
    }
  | {
      questionType:
        | "short-answer"
        | "coding"
        | "behavioral"
        | "scenario-based"
        | "technical-explanation";
      category: string;
      difficulty: InterviewDifficulty;
      question: string;
      modelAnswer: string;
    };
```

For Multiple Choice, Gemini should return option text plus a bounded correct-option index. The backend should convert that provider output into canonical option IDs before persistence.

The provider should not generate or control persistent database identifiers.

The worker must verify the requested type distribution after provider validation, just as it currently verifies difficulty distribution.

Existing Gemini safety controls remain:

- untrusted-data delimiters;
- no embedded-instruction following;
- no invented candidate experience;
- no protected-characteristic questions;
- strict JSON schema validation;
- fixed Gemini Direct routing;
- job retry/cancel/execution fencing;
- transaction-safe persistence.

---

# 6. Attempt and scoring gap analysis

The six types need different answer semantics.

## 6.1 Multiple Choice

Answer input:

```ts
{
  type: "multiple-choice";
  selectedOptionId: string;
}
```

Scoring:

- deterministic on the backend;
- compare selected option ID with the private correct option ID;
- no Gemini call is required to determine correctness;
- score can be `100` for correct and `0` for incorrect for the initial university-project implementation.

Optional AI explanation can remain a later/secondary feedback action, but correctness must not depend on Gemini.

## 6.2 Short Answer

Answer input:

```ts
{
  type: "short-answer";
  text: string;
}
```

Feedback:

- bounded semantic/practice feedback through the existing Gemini feedback job architecture;
- prompt criteria adjusted for concise relevance, correctness, and completeness.

## 6.3 Coding

Answer input:

```ts
{
  type: "coding";
  text: string;
}
```

Feedback:

- code-oriented Gemini practice feedback;
- no compiler;
- no runtime execution;
- no sandbox;
- no hidden test cases;
- no production correctness guarantee;
- no hiring-assessment claim.

A programming-language selector can be deferred unless a later approved requirement needs it.

## 6.4 Behavioral

Answer input:

```ts
{
  type: "behavioral";
  text: string;
}
```

Feedback:

- practice guidance for structure, relevance, evidence, clarity, and truthful use of experience;
- no invention of candidate facts.

## 6.5 Scenario-based

Answer input:

```ts
{
  type: "scenario-based";
  text: string;
}
```

Feedback:

- structured reasoning/practice guidance;
- assess assumptions, trade-offs, sequence, risk, and clarity rather than deterministic correctness unless the prompt explicitly supports one answer.

## 6.6 Technical explanation

Answer input:

```ts
{
  type: "technical-explanation";
  text: string;
}
```

Feedback:

- correctness, relevance, conceptual completeness, and clarity guidance.

---

# 7. Existing-data compatibility analysis

Historical data must remain usable without destructive migration.

## 7.1 Historical question rule

Existing questions have no `questionType` field.

Do not infer that they are `short-answer`, `behavioral`, `technical-explanation`, or any other modern selectable type from their text/category.

Instead define one compatibility-only effective type:

```ts
"legacy-open-response"
```

Rules:

- `legacy-open-response` is not user-selectable for new questions;
- it is not written into historical documents by a migration;
- it is produced by server serialization when an existing question has no stored `questionType`;
- it keeps the current free-text answer control and current feedback behavior.

This is not silent misclassification because it explicitly means “pre-question-type Interview question whose original semantics are preserved.”

## 7.2 Historical attempt rule

Existing attempts keep their immutable `answerText` exactly as stored.

They are not rewritten into the future typed answer object.

Future attempt parsing supports two representations:

```ts
// historical
{
  answerText: string;
}

// new typed attempt
{
  answer: TypedInterviewAnswer;
}
```

The backend service enforces which representation is legal based on the effective question type.

## 7.3 Historical feedback rule

Existing completed feedback remains untouched.

No provider metadata, scores, summaries, strengths, improvements, or outlines are recomputed.

---

# 8. Multiple Choice answer-key and security analysis

Answer-key secrecy is a hard requirement.

## 8.1 Canonical persisted Multiple Choice shape

Recommended persisted question fields:

```ts
questionType?: InterviewQuestionType;

multipleChoice?: {
  options: Array<{
    id: string;
    text: string;
  }>;
  correctOptionId: string;
};
```

`questionType` remains optional at the database-schema level only for backward compatibility. New-question service paths require it.

`correctOptionId` is backend-private and must never be serialized through normal question list/detail APIs before submission.

Recommended bounds for the first implementation:

- 2–8 options;
- option text 1–500 characters;
- unique option IDs within the question;
- unique non-empty option text after trimming;
- correct option must reference one existing option.

## 8.2 Pre-submission browser shape

The browser may receive:

```ts
{
  questionType: "multiple-choice";
  options: [
    { id: "option-1", text: "..." },
    { id: "option-2", text: "..." }
  ];
}
```

It must not receive:

- `correctOptionId`;
- `correctOptionIndex`;
- a field that identifies the correct option;
- a model answer/rationale that directly reveals the correct answer.

For Multiple Choice, the existing Study-mode model-answer reveal must not override this rule.

## 8.3 Submission

The browser submits only:

```ts
{
  answer: {
    type: "multiple-choice";
    selectedOptionId: "option-2";
  };
}
```

The backend verifies that the selected option belongs to the canonical question before writing the immutable attempt.

## 8.4 Post-submission reveal policy

After the owned immutable attempt is successfully recorded, attempt detail may return a deterministic evaluation:

```ts
{
  evaluation: {
    kind: "multiple-choice";
    score: 0 | 100;
    correct: boolean;
    correctOptionId: string;
  };
}
```

The reveal is tied to an existing owned attempt and therefore occurs only after submission.

Question list/detail endpoints should still never expose the private key.

## 8.5 Required security tests

A later implementation must prove:

- list questions never includes the key;
- get question never includes the key before submission, including Study mode;
- pin/note mutation responses never include the key;
- generation job results never include the key;
- foreign-user attempts cannot reveal an answer key;
- an invalid selected option ID is rejected;
- post-submission reveal occurs only for the owned submitted attempt;
- raw provider `correctOptionIndex` is never returned directly to the frontend.

---

# 9. Q1 / Q2 / Q3 comparison

## Q1 — Minimal `questionType` + mostly `answerText`

### Advantages

- fewest apparent model changes;
- smallest initial frontend type diff;
- preserves current feedback path for most questions.

### Problems

- Multiple Choice selection would need to be encoded into `answerText` or special-cased outside the model;
- backend validation would become type-dependent while the stored answer remains semantically ambiguous;
- frontend and API contracts would claim typed behavior without typed persistence;
- deterministic scoring and answer-key security would rely on conventions instead of explicit structure;
- future maintenance would accumulate `if questionType === ...` branches around one misleading answer field.

### Assessment

Rejected. It is smaller only superficially and creates avoidable correctness ambiguity.

## Q2 — Typed question + discriminated answer payload

### Advantages

- represents Multiple Choice correctly;
- preserves one common question collection and one common attempt collection;
- reuses existing routes, ownership checks, jobs, pagination, activity logging, polling, and transactions;
- keeps non-MCQ text responses simple;
- allows deterministic MCQ scoring without Gemini;
- supports explicit backward compatibility through `legacy-open-response`;
- does not require a destructive migration;
- is extensible without introducing separate subsystems.

### Costs

- requires coordinated backend schema/Zod/service changes;
- requires frontend contract/parser changes;
- requires type-aware generation and feedback prompts;
- requires compatibility tests for old and new data.

### Assessment

Recommended. It is the smallest architecture that represents all six requested types without ambiguous storage or answer-key leakage.

## Q3 — Separate models/workflows per type

### Advantages

- strongest type isolation;
- each type could evolve independently.

### Problems

- separate persistence models or collections;
- separate routes/services or extensive dispatch infrastructure;
- duplicated ownership, pagination, activity, job, and test logic;
- more migration complexity;
- much larger university-project scope;
- no source evidence that the six requested types require separate lifecycle systems.

### Assessment

Rejected for this project. Current shared Interview lifecycle is already suitable; only the question/answer payload needs discrimination.

---

# 10. Recommended architecture

Adopt **Q2 — one shared Interview Question model with an explicit question type and bounded type-specific data, plus one shared Interview Attempt model with a discriminated typed answer**.

Key decisions:

1. Keep the existing session, question, attempt, route, ownership, job, polling, and transaction architecture.
2. Do not create per-type collections or route families.
3. Do not persist a session-level type plan in the first implementation.
4. Add an optional persisted `questionType` to questions for backward-compatible storage.
5. Treat missing historical type as effective `legacy-open-response` during serialization.
6. Add Multiple Choice option data and a backend-private correct-option key.
7. Add a typed `answer` object for new attempts while preserving historical immutable `answerText`.
8. Use deterministic backend scoring for Multiple Choice.
9. Reuse Gemini feedback jobs for text-based modern types with type-aware prompts.
10. Preserve existing fingerprint semantics: normalized question text remains the uniqueness basis.
11. Preserve Gemini Direct, current job idempotency, retry/cancel, execution fencing, transactional persistence, and ownership isolation.

---

# 11. Exact schema-change proposal

## 11.1 Question type

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
```

Database rule:

```ts
questionType?: InterviewQuestionType;
```

New manual/AI-created questions require `questionType` in service/schema validation. Historical documents may remain absent.

## 11.2 Multiple Choice data

```ts
multipleChoice?: {
  options: Array<{
    id: string;
    text: string;
  }>;
  correctOptionId: string;
};
```

Validation:

- present only when `questionType === "multiple-choice"`;
- absent for all other new types;
- 2–8 options;
- each option text 1–500 characters;
- IDs unique;
- correctOptionId must reference one option;
- question type and MCQ fields immutable after creation.

## 11.3 Attempt answer union

```ts
export type TypedInterviewAnswer =
  | {
      type: "multiple-choice";
      selectedOptionId: string;
    }
  | {
      type: "short-answer";
      text: string;
    }
  | {
      type: "coding";
      text: string;
    }
  | {
      type: "behavioral";
      text: string;
    }
  | {
      type: "scenario-based";
      text: string;
    }
  | {
      type: "technical-explanation";
      text: string;
    };
```

Attempt persistence becomes logically:

```ts
{
  answerText?: string; // historical legacy attempts only
  answer?: TypedInterviewAnswer; // new typed questions
}
```

Both remain immutable.

Service validation enforces exactly one compatible answer representation.

## 11.4 Multiple Choice deterministic evaluation

Add optional attempt data:

```ts
evaluation?: {
  kind: "multiple-choice";
  score: 0 | 100;
  correct: boolean;
};
```

The correct option itself remains sourced from the private question key. Post-submission serialization may add `correctOptionId` to the API response without duplicating it into the attempt document.

## 11.5 Existing feedback schema

Keep the current AI feedback subdocument for text-based practice feedback.

Do not overload it with fake provider/model metadata for deterministic Multiple Choice scoring.

---

# 12. Exact API-change proposal

## 12.1 Generate questions

Keep:

```text
POST /interview-sessions/:sessionId/questions/generate
```

Extend request body with:

```ts
{
  requestId: string;
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

Semantics:

- exactly one selected type = single-type generation;
- multiple selected types with no `typeCounts` = balanced distribution, with remainder assigned deterministically by selected-type order;
- `typeCounts` present = exact custom distribution;
- all counts must be non-negative integers;
- selected types must be unique;
- custom counts must sum to total `count`;
- no count may be supplied for an unselected type.

The worker validates provider output against the resolved exact distribution.

## 12.2 Add manual question

Keep:

```text
POST /interview-sessions/:sessionId/questions
```

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

`multipleChoice` is required only for Multiple Choice and forbidden otherwise.

The backend generates canonical option IDs and stores the private correct option ID.

## 12.3 Question responses

Question list/detail responses add:

```ts
questionType: EffectiveInterviewQuestionType;
```

Multiple Choice responses additionally include public options:

```ts
multipleChoice: {
  options: Array<{ id: string; text: string }>;
};
```

They never include the correct option before submission.

## 12.4 Record attempt

Keep:

```text
POST /interview-sessions/:sessionId/questions/:questionId/attempts
```

Future body:

```ts
{
  answer: TypedInterviewAnswer;
}
```

Legacy `answerText` input remains supported only for `legacy-open-response` questions during the compatibility period.

The backend verifies:

- answer type matches effective question type;
- Multiple Choice selection references a real option;
- text lengths remain bounded;
- no answer shape includes extra fields.

## 12.5 Attempt response

New typed attempts return:

```ts
{
  answer: TypedInterviewAnswer;
  evaluation?: {
    kind: "multiple-choice";
    score: 0 | 100;
    correct: boolean;
    correctOptionId: string;
  };
}
```

Historical attempts continue returning `answerText`.

## 12.6 Feedback endpoint

Keep:

```text
POST /interview-sessions/:sessionId/attempts/:attemptId/feedback
```

For text-based modern types and legacy open response, it continues to queue Gemini feedback.

For Multiple Choice, the first implementation should not require this endpoint for correctness. If retained in the UI later, it may provide optional explanation only; deterministic correctness remains authoritative.

---

# 13. Exact frontend interaction proposal

## 13.1 Generation controls

Add one compact `Question types` control to the existing Add Questions area.

Recommended interaction:

- six checkbox/chip options;
- at least one required;
- one type selected = single-type generation;
- multiple selected = balanced by default;
- optional `Set counts` disclosure allows explicit per-type counts;
- explicit counts must sum to Question count before submission.

Do not add a multi-step wizard.

## 13.2 Manual question form

Add `Question type` before Category/Difficulty.

For Multiple Choice only, reveal:

- 2 initial option fields;
- Add option up to 8;
- Remove option while at least 2 remain;
- one explicit correct-answer radio selection.

For all text-based types, keep the current question/model-answer fields.

## 13.3 Question list/workspace

Show a restrained human-readable type label near category/difficulty.

Effective compatibility label:

```text
legacy-open-response -> Open response
```

Do not expose `legacy-open-response` wording to normal users.

## 13.4 Answer controls

- Multiple choice → radio group using canonical option IDs.
- Short answer → compact textarea.
- Coding → larger code-oriented multiline textarea using monospace presentation; no execution button.
- Behavioral → multiline textarea.
- Scenario-based → multiline textarea.
- Technical explanation → multiline textarea.
- Legacy open response → current Written answer textarea unchanged.

## 13.5 Saved Attempts

Saved Attempts remain one shared history.

Render the answer according to attempt shape:

- MCQ → selected option text + deterministic result;
- typed text → stored text;
- legacy → existing `answerText`.

No edit/delete behavior is introduced.

---

# 14. Migration and backward-compatibility strategy

No destructive database migration is required.

## 14.1 Deployment order

Recommended safe order for a future implementation:

1. backend compatibility support first;
2. backend serializers emit effective legacy type for old questions;
3. backend accepts old attempt shape for legacy questions and new typed shape for new questions;
4. frontend parser/UI updated after compatible backend exists;
5. typed question creation/generation UI enabled last.

## 14.2 Existing documents

Do not bulk-update historical questions or attempts.

No script should attempt to infer modern question types from category or prompt text.

## 14.3 Mongoose compatibility

`questionType`, `multipleChoice`, and typed `answer` are optional at storage-schema level to permit historical documents.

Application service validation makes them mandatory where appropriate for all newly created typed data.

## 14.4 Fingerprints

Keep existing fingerprint semantics unchanged:

```text
fingerprint = SHA-256(normalized question text)
```

The same normalized question text remains a duplicate within a session even if a provider attempts to return it with a different type or option set.

This preserves existing de-duplication behavior and avoids introducing a migration/index change for type-aware fingerprints.

---

# 15. Required test matrix

A future implementation plan must use RED → GREEN and cover at least the following.

## 15.1 Backend schema/service

- accepts each of the six stored types;
- rejects unknown types;
- new typed questions cannot omit type;
- historical missing type serializes as legacy open response;
- MCQ requires 2–8 options;
- MCQ rejects duplicate/blank options;
- MCQ rejects invalid correct index/key;
- non-MCQ rejects MCQ payload;
- typed attempt answer must match question type;
- MCQ selection must reference a real option;
- historical `answerText` still records for legacy question;
- modern typed question rejects legacy `answerText` body;
- immutable answer semantics preserved.

## 15.2 Generation

- single selected type exact count;
- multiple balanced types exact distribution;
- custom type counts sum validation;
- provider type mismatch rejected;
- provider MCQ invalid option set rejected;
- provider correct index out of range rejected;
- type distribution verified after provider output;
- question count/difficulty checks remain;
- duplicate fingerprint behavior remains;
- retry with same job remains idempotent;
- cancellation/execution fence blocks stale persistence.

## 15.3 Answer-key security

- list question response never exposes key;
- detail response never exposes key before submission;
- Study mode does not reveal MCQ key/model answer;
- pin response does not expose key;
- notes response does not expose key;
- job result does not expose key;
- cross-user access remains indistinguishable from not found;
- only owned submitted attempt can receive post-submit correct option reveal.

## 15.4 Feedback/scoring

- MCQ correct selection scores deterministically;
- MCQ incorrect selection scores deterministically;
- MCQ correctness works with Gemini unavailable;
- short-answer feedback receives short-answer criteria;
- coding feedback receives code-practice criteria and makes no execution claim;
- behavioral feedback uses behavioral guidance criteria;
- scenario feedback uses reasoning/trade-off criteria;
- technical-explanation feedback uses correctness/clarity criteria;
- legacy feedback path remains unchanged;
- retry/cancel/polling semantics remain.

## 15.5 Frontend contracts

- parses all six modern types;
- maps missing server type to effective legacy only when server contract explicitly says so;
- rejects malformed MCQ options;
- rejects a response containing forbidden answer-key fields if the contract parser receives them;
- parses legacy `answerText` attempts;
- parses typed attempts;
- rejects answer/question type mismatch.

## 15.6 Frontend interaction

- one selected type generation;
- balanced multi-type generation;
- custom count validation;
- type label display;
- MCQ keyboard-accessible radio group;
- no pre-submit answer key in DOM;
- correct post-submit result display;
- short-answer/coding/behavioral/scenario/technical text controls;
- coding has no Run/Execute behavior;
- legacy questions preserve existing Written answer flow;
- Saved Attempts handles both legacy and typed attempts.

## 15.7 Regression

- ownership/IDOR tests;
- session/question/attempt pagination;
- pinning and notes;
- question explanation;
- request IDs;
- job UUID/idempotency behavior;
- provider retries;
- stale-operation protection;
- completed/archived readonly behavior;
- existing historical fixture parsing.

---

# 16. Estimated implementation scope

Recommended implementation size: **medium**, but bounded.

Expected work can remain inside the existing Interview module and frontend feature area.

Likely touched areas:

- backend question model;
- backend attempt model;
- Interview Zod schemas;
- Interview service/controller serialization;
- Interview AI generation/feedback service;
- Interview job payload schema;
- frontend Interview types;
- frontend runtime contracts;
- frontend API request shapes;
- Interview workspace generation/manual/answer UI;
- focused Interview tests;
- backend integration/security tests.

A reasonable future implementation can be split into three bounded slices:

1. **Typed contracts + legacy compatibility + answer-key security**
2. **Typed generation/manual creation + persistence**
3. **Type-aware answering/scoring/feedback + frontend UX**

No new service, queue, database, state-management library, compiler, sandbox, or external assessment platform is required.

---

# 17. Risks and explicit non-goals

## 17.1 Main risks

### Answer-key leakage

The largest security risk is accidentally serializing `correctOptionId` or a revealing MCQ model answer through an existing question-detail path. This requires explicit serializer and contract tests.

### Legacy ambiguity

Inferring modern types from old prompts would silently alter historical semantics. The explicit `legacy-open-response` compatibility type avoids this.

### Type/answer mismatch

Without strict backend validation, a client could submit a Multiple Choice selection to a Coding question or vice versa. The service must validate against the canonical stored question type, not trust the submitted discriminator.

### Gemini distribution drift

Gemini may return the wrong type counts just as it can return the wrong difficulty mix. Exact post-generation distribution validation is required.

### Frontend/backend rollout mismatch

The strict frontend parser means backend compatibility should land before frontend creation controls are enabled.

## 17.2 Explicit non-goals

This design does not include:

- question-type implementation during Phase 19B;
- destructive migration of old questions or attempts;
- automatic classification of historical questions;
- compiler or code execution;
- remote judge;
- hidden test-case execution;
- browser code sandbox;
- plagiarism detection;
- proctoring;
- hiring-assessment claims;
- enterprise assessment workflows;
- adaptive psychometrics;
- separate per-type databases or microservices;
- streaming/SSE/WebSockets;
- new AI provider routing;
- changing Gemini Direct policy;
- new deployment infrastructure;
- Phase 19C activation.

---

# Decision

**Recommended architecture:** Q2 — shared typed question model + discriminated typed answer payload, with explicit legacy-open-response compatibility and backend-private Multiple Choice answer keys.

This recommendation is based on the current source architecture: one shared Interview lifecycle already provides ownership, pagination, job execution, idempotency, retries, cancellation, execution fencing, transactional persistence, activity logging, and frontend route structure. Q2 adds only the missing semantic discrimination while preserving those proven mechanisms.

`CLH-FEATURE-INTERVIEW-011` remains unresolved in the original product register because this document does not implement it.

## Required next gate

Human review of this architecture document.

After review, the operator must explicitly choose one of:

- authorize a separate `011` implementation plan based on this design; or
- defer `011` and close Phase 19B with the feature still unimplemented.

Until that separate decision:

`AUDIT COMPLETE / DESIGN PROPOSED / IMPLEMENTATION NOT AUTHORIZED`
