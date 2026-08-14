# Phase 19B-3 Task 7R — Interview Practice Experience Refinement Design

Date: 2026-08-14
Status: Design approved; written specification pending user review
Branch: `task/phase-19b3-task7r-interview-layout-refinement`
PR: #13
Target branch: `phase-19b-interview-coach-refinements`

## 1. Purpose

Finish the typed Interview Coach practice experience before Task 8 by making each question type feel meaningfully different, adding question-specific starter code for Coding questions, and replacing the Build the Briefing free-text-only category entry with session-context category selection.

The implementation must remain appropriate for a university project:

> Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.

The change must preserve all existing typed-question, ownership, idempotency, polling, cancellation, MCQ secrecy, deterministic MCQ scoring, historical compatibility, and text-only Coding execution boundaries.

## 2. Approved product decisions

The user approved all of the following:

1. Coding questions use **stored starter code generated with the question** rather than generic frontend templates.
2. Manually authored Coding questions also support **optional starter code**.
3. Build the Briefing categories use **session-context suggestions plus optional custom categories**.
4. All categories derived from the current session context are **preselected by default**.
5. Behavioral, Scenario-based, and Technical Explanation answers keep **one textarea** with type-specific guidance rather than multiple structured form fields.
6. Multiple Choice uses **A/B/C/D… letter badges and whole-option clickable cards** while retaining native radio semantics and existing correctness rules.

## 3. Scope decomposition

This design contains three tightly related subfeatures.

### 3.1 Coding starter code

This is the only subfeature that changes backend persistence/contracts.

Add one optional persisted Interview-question field:

```ts
starterCode?: string;
```

It is candidate-facing scaffolding for Coding questions only.

### 3.2 Type-specific answer presentation

This is a frontend presentation refinement only.

The existing typed answer contract remains authoritative:

- Multiple Choice: `{ type: "multiple-choice", selectedOptionId }`
- Short Answer: `{ type: "short-answer", text }`
- Coding: `{ type: "coding", text }`
- Behavioral: `{ type: "behavioral", text }`
- Scenario-based: `{ type: "scenario-based", text }`
- Technical Explanation: `{ type: "technical-explanation", text }`

No answer persistence redesign is allowed.

### 3.3 Session-context category selection

This is a frontend input/presentation refinement only.

The existing generation request remains:

```ts
categories: string[];
```

No generation endpoint redesign and no additional Gemini request are allowed.

## 4. Coding starter-code domain design

### 4.1 Storage

Extend `InterviewQuestion` with:

```ts
starterCode?: string;
```

Rules:

- optional for backward compatibility;
- only valid for canonical `questionType === "coding"`;
- immutable after question creation, matching other core question content;
- bounded to a reasonable text length; use the smallest limit consistent with existing question/model-answer bounds and practical interview scaffolds;
- no migration is required for historical questions;
- historical Coding questions without `starterCode` continue to behave exactly as before;
- non-Coding questions must not persist starter code.

### 4.2 AI-generated Coding questions

The existing structured generation request must be extended so the Coding branch returns `starterCode` with the same Gemini response that returns the question.

Do **not** make a second Gemini call.

For new AI-generated Coding questions:

- `starterCode` is required in the Coding structured-output branch;
- the prompt must instruct Gemini that starter code is scaffolding only;
- generated starter code may include function/class signatures, required imports, parameters, minimal shapes, and TODO/comments;
- it must not intentionally contain the completed solution;
- the server schema validates the field before persistence;
- the generation worker preserves existing one-provider-attempt-per-worker-attempt, transactional persistence, cancellation, lease/deadline, retry, and idempotency behavior.

The Coding generation instruction must continue to state that questions are text/code practice only and do not require execution or hidden tests.

### 4.3 Manual Coding questions

Extend only the manual Coding input branch with:

```ts
starterCode?: string;
```

Rules:

- optional;
- trimmed/bounded by schema;
- accepted only when `questionType === "coding"`;
- non-Coding manual-question schemas remain strict and reject `starterCode`;
- the manual Coding form shows `Starter code (optional)`;
- creating a manual Coding question stores starter code with the canonical question record.

### 4.4 Serialization and secrecy

`starterCode` is public candidate-facing practice material, not secret answer material.

For Coding questions with stored starter code:

- question summary/detail serialization may expose `starterCode` to the owner;
- it must not affect MCQ serialization or MCQ answer-key secrecy;
- `correctOptionId` remains private before submission and remains governed by the existing deterministic MCQ evaluation path;
- `modelAnswer` privacy rules remain unchanged;
- job payloads must not introduce unrelated secret fields.

### 4.5 Starter-code Practice Desk UX

When a selected Coding question contains starter code, show a dedicated panel above `Your code`:

- heading: `Starter code`;
- concise helper copy that it is an optional scaffold;
- code rendered in a monospace, read-only surface;
- `Copy starter code` action;
- `Insert into answer` action.

Insertion behavior is intentionally conservative:

- if the answer draft is empty or whitespace-only, `Insert into answer` copies the starter code into the existing Coding answer textarea;
- if the answer draft already contains meaningful text, insertion is disabled or unavailable;
- insertion never silently overwrites user work;
- insertion never submits the answer;
- Copy remains available regardless of answer-draft state.

If a Coding question has no starter code, no empty starter-code panel is rendered.

The existing Coding notice remains explicit: the submission is reviewed as text and is not executed.

## 5. Type-specific Practice Desk design

All question types remain visually part of the Career Learning Hub design system. Do not assign six unrelated bright palettes. Differentiate by interaction structure, guidance, typography, spacing, and lightweight type-specific cues.

### 5.1 Multiple Choice

Keep native radio inputs and label-based whole-card click targets.

Enhance each option with a display-only letter badge derived from its visible position:

- first option `A`;
- second `B`;
- continue alphabetically for the supported 2–8 options.

Presentation requirements:

- whole option card clickable;
- clear hover and keyboard focus state;
- stronger selected border/background state;
- letter badge visually distinct but not the semantic answer identifier;
- radio remains accessible and authoritative;
- no correct-answer styling or answer disclosure before saving;
- deterministic backend scoring and post-submit review remain unchanged.

### 5.2 Short Answer

Purpose: concise direct response.

Presentation:

- label: `Your short answer` or existing canonical equivalent;
- compact textarea, smaller than long-form types;
- helper guidance such as `Answer directly. Aim for 2–4 focused sentences.`;
- concise type-specific placeholder;
- existing character limit/count and validation retained.

### 5.3 Behavioral

Purpose: evidence-based response about the candidate's experience.

Keep one textarea.

Show non-interactive guidance cues:

- `Situation`
- `Task`
- `Action`
- `Result`

Include concise guidance emphasizing what the candidate personally did and the outcome.

Do not split STAR into four persisted fields and do not invent candidate facts.

### 5.4 Scenario-based

Purpose: hypothetical reasoning and decision-making.

Keep one textarea.

Show non-interactive guidance cues:

- `Assess`
- `Approach`
- `Trade-offs`
- `Decision`

Include concise guidance to explain why the candidate would choose the approach.

This must feel different from Behavioral: Behavioral describes past evidence; Scenario-based explains what the candidate would do and why.

### 5.5 Technical Explanation

Purpose: explain a technical concept clearly.

Keep one textarea.

Show non-interactive guidance cues:

- `Concept`
- `How it works`
- `Example`
- `Trade-offs`

Include concise guidance to explain the concept as if speaking to an interviewer.

### 5.6 Coding

Retain the existing code-oriented textarea treatment:

- `Your code` label;
- monospace editor-like textarea;
- native textarea only;
- spellcheck disabled;
- no editor dependency;
- no compiler, runtime, sandbox, hidden tests, or Run/Execute action.

Add the Starter Code panel described in Section 4 when starter code exists.

### 5.7 Legacy Open Response

Historical `legacy-open-response` behavior remains compatible and does not gain invented modern guidance semantics. Keep its existing written-answer presentation unless a small shared style change is necessary for consistency.

## 6. Build the Briefing — category-selection design

### 6.1 Source of suggestions

Derive category suggestions locally from the already-loaded session:

```ts
session.focusTopics + session.skillGaps
```

No Gemini call and no backend endpoint are needed to produce suggestions.

Normalize for display/selection by:

- trimming whitespace;
- dropping blank values;
- deduplicating using a normalized comparison while preserving the first meaningful display spelling;
- preserving session-context order, with focus topics before additional skill-gap values.

### 6.2 Default selection

Every derived session-context category starts selected when the session workspace loads.

Example:

Session context:

- Focus topics: `MongoDB`
- Skill gaps: `System Design`

Build the Briefing initially shows both selected.

The user may deselect either or both.

### 6.3 Custom categories

Keep the ability to add custom categories.

The UI should provide a compact custom-category input/action rather than requiring one comma-separated free-text field for the entire category set.

Rules:

- trim custom input;
- ignore blank additions;
- avoid duplicates against selected/unselected context suggestions and existing custom categories using the same normalized comparison;
- custom categories can be removed/deselected;
- respect the existing backend category count/length constraints;
- do not create hidden categories or persist briefing-only guidance outside the generation request.

### 6.4 Generation request

At submission, combine the currently selected session-context categories and selected custom categories into the existing canonical request:

```ts
categories: string[];
```

The existing request UUID, question count, selected question types, type-count distribution, polling, cancel/retry, and Gemini job semantics remain unchanged.

It remains valid for the user to deselect every category. In that case send an empty `categories` array; the backend already supplies target role, experience level, focus topics, skill gaps, job description, and optional resume context separately to Gemini.

### 6.5 Suggested presentation

Use a compact subsection such as:

```text
Categories
Suggested from session context

[✓ MongoDB] [✓ System Design]

Custom categories
[ Add a category... ] [Add]

2 categories selected
```

The exact CSS can follow existing Interview chips/tiles, but the state must be explicit and keyboard accessible.

## 7. Existing contracts that must remain unchanged

1. Six modern question types remain exactly:
   - multiple-choice
   - short-answer
   - coding
   - behavioral
   - scenario-based
   - technical-explanation
2. Historical missing type still maps to `legacy-open-response`.
3. Typed attempt answer shapes remain unchanged.
4. MCQ correctness remains deterministic backend logic.
5. No AI MCQ feedback action is introduced.
6. Coding answers remain text only and are never executed.
7. Existing notes/pinning/Saved Attempts semantics remain unchanged.
8. Existing generation progress polling, cancellation, retry, UUID/idempotency, and job-fence behavior remain authoritative.
9. Existing ownership/not-found indistinguishability and question/attempt authorization remain authoritative.

## 8. Security invariants

The existing Task 3–7 security invariants remain mandatory, including:

- `correctOptionId` is never exposed in public question data;
- MCQ `modelAnswer` stays private in public question serialization;
- a foreign attempt cannot unlock another user's MCQ explanation;
- stored MCQ explanation stays hidden before the owner's attempt;
- MCQ explanation before owner attempt remains rejected;
- Gemini never determines MCQ correctness;
- `correctOptionId` may appear only in the owned post-submission serialized MCQ attempt evaluation and is derived from the canonical owned question, not persisted on the attempt.

Starter-code-specific invariants:

- `starterCode` is not an answer key;
- it must be available only on owned question responses through the existing ownership boundary;
- it must not weaken MCQ secret-field filtering;
- it must not create an execution path;
- feedback/explanation prompts must never claim starter or submitted code was executed.

## 9. Error and edge-case behavior

### 9.1 Missing starter code

A historical/manual Coding question without starter code simply omits the Starter Code panel. No warning is necessary.

### 9.2 Invalid generated starter code structure

If Gemini returns a Coding object that fails the structured schema, preserve the existing AI schema-validation/job failure behavior. Do not persist a partially valid question.

### 9.3 Non-Coding starter code

Strict schemas reject `starterCode` on non-Coding manual/generated branches.

### 9.4 Existing answer draft

Never overwrite a non-empty Coding answer when inserting starter code.

### 9.5 Category duplication

Do not send duplicate categories caused by overlap between `focusTopics`, `skillGaps`, or custom input.

### 9.6 Empty categories

An empty category selection remains valid and submits `categories: []`.

## 10. Testing requirements

### 10.1 Backend starter-code tests

Add focused coverage that proves:

- AI Coding generated schema accepts required starter code;
- non-Coding generated objects reject starter code;
- generated Coding starter code is persisted atomically with the question;
- historical Coding records without starter code serialize safely;
- manual Coding accepts optional starter code;
- non-Coding manual inputs reject starter code;
- public Coding serialization exposes starter code without exposing MCQ secrets;
- existing question generation distribution/idempotency/security behavior remains green.

### 10.2 Frontend Coding tests

Prove:

- Coding question with starter code renders the panel;
- Copy copies only starter-code text;
- Insert populates an empty Coding draft;
- Insert does not overwrite a non-empty draft;
- Coding question without starter code omits the panel;
- answer submission remains `{ type: "coding", text }`.

### 10.3 Type-specific answer tests

Prove:

- MCQ renders A/B/C/D-style positional badges while native radio selection still works;
- Short Answer shows compact guidance;
- Behavioral shows STAR guidance;
- Scenario-based shows Assess/Approach/Trade-offs/Decision guidance;
- Technical Explanation shows Concept/How it works/Example/Trade-offs guidance;
- all text types still submit the canonical typed text answer;
- accessibility labels/focus semantics remain valid.

### 10.4 Category-selection tests

Prove:

- suggestions derive from `focusTopics + skillGaps`;
- duplicate context values are deduplicated;
- all context suggestions start selected;
- user can deselect suggestions;
- user can add/remove custom categories;
- duplicates are not added;
- empty selection is valid;
- generation receives exactly the selected canonical `categories: string[]`.

### 10.5 Regression gate

Before Task 7R can be declared complete:

- focused backend Interview tests pass;
- backend typecheck/build checks pass as applicable;
- focused frontend Interview tests pass;
- frontend typecheck passes;
- full frontend regression passes;
- frontend production build passes;
- `git diff --check` is clean;
- working tree is clean;
- browser QA covers all six modern question types and responsive layouts.

The current branch has a separately observed timing-sensitive failure in the existing test `clears question-detail loading when the next route has no questions`. The latest user run reached 969/970 frontend tests while focused Question Index/notes tests, typecheck, and production build passed. This issue must be reverified/resolved separately and must not be disguised as part of the new feature implementation.

## 11. Out of scope

Do not add:

- code execution;
- compiler/runtime/sandbox;
- hidden tests;
- Monaco, CodeMirror, or another editor dependency;
- a second Gemini request for starter code;
- new AI provider/routing behavior;
- backend category-suggestion endpoint;
- separate persisted fields for STAR/scenario/technical-answer subsections;
- MCQ AI scoring or MCQ AI feedback;
- deployment;
- `main` changes;
- Task 8 closeout.

## 12. PR governance note

PR #13's current description predates this approved extension and says there are no schema changes. That text becomes inaccurate once starter code is implemented.

Before final Task 7R review, update the PR description to document:

- optional Coding `starterCode` persistence/contract extension;
- AI/manual starter-code support;
- type-specific answer UX;
- session-context category selection;
- unchanged no-execution and MCQ secrecy guarantees.

The PR must remain draft/unmerged until verification is green and the user separately gives explicit Task 7R merge approval.

## 13. Acceptance criteria

The design is satisfied when:

1. New AI Coding questions carry safe question-specific starter scaffolding in the same structured generation call.
2. Manual Coding questions can optionally store starter code.
3. Starter code is displayed/copyable/insertable without overwriting an existing answer and without any execution feature.
4. Multiple Choice, Short Answer, Coding, Behavioral, Scenario-based, and Technical Explanation have clearly distinguishable answering experiences.
5. Text-answer types retain the current one-textarea typed contract.
6. Build the Briefing starts with deduplicated Focus topics + Skill gaps selected as categories and still supports custom categories.
7. Generation still sends the existing canonical `categories: string[]` request.
8. Historical questions remain compatible without migration.
9. Existing MCQ secrecy and deterministic scoring invariants remain intact.
10. Full verification, browser QA, PR review, and explicit merge approval are completed before merge.
