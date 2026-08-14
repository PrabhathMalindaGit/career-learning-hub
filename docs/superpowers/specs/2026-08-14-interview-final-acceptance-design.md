# Phase 19B-3 Task 8 — Interview Coach Final Acceptance Design

**Project:** Career Learning Hub  
**Phase:** 19B-3  
**Task:** 8 — Interview Coach Final Acceptance  
**Branch:** `task/phase-19b3-task8-interview-final-acceptance`  
**Base:** `phase-19b-interview-coach-refinements`  
**Starting base commit:** `6d7093072d6723180720db91b6480a4d04e8eeb0`  
**Status:** Design approved in chat; written spec awaiting user review

## 1. Goal

Close Phase 19B-3 by proving that the completed Interview Coach works meaningfully, securely, and consistently end to end after Tasks 1–7R.

Task 8 is an acceptance and governance task, not a new feature phase.

Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.

## 2. Acceptance-first policy

Task 8 must start from the merged Phase 19B branch and treat the current implementation as the release candidate for Interview Coach.

The default action is verification, not modification.

Code changes are allowed only when Task 8 produces reproducible evidence of a defect that blocks or materially weakens an acceptance criterion in this specification.

Any defect repair must:

- stay on this Task 8 branch and draft PR;
- be as small and surgical as possible;
- preserve existing architecture and contracts;
- add or update focused regression coverage for the reproduced defect;
- be reverified before Task 8 can close.

Do not perform opportunistic cleanup, broad refactors, speculative hardening, or unrelated feature work.

## 3. Non-goals

Task 8 does **not** introduce:

- a seventh modern question type;
- new Interview database entities;
- a new Interview API family;
- a new worker architecture;
- SSE, WebSockets, or token streaming;
- a second AI provider;
- code execution, compilation, or sandboxing;
- a remote career taxonomy service;
- a new structured-answer backend schema;
- a new frontend redesign;
- deployment;
- changes to `main`;
- task-branch deletion;
- unrelated Resume or Learning feature repairs unless they directly prevent required repository-wide verification.

## 4. Authoritative architecture and invariants

Task 8 must verify the implementation without changing these approved invariants:

### 4.1 AI provider

- Gemini Direct only for current development.
- Existing live model baseline: `gemini-3.6-flash`.
- Existing in-process backend worker model.
- One Gemini provider attempt per worker attempt.
- Existing progress polling, cancel, retry, single-flight, and duplicate-suppression semantics.
- No token streaming, SSE, or WebSockets.

### 4.2 Question types

The six modern Interview question types are:

1. Multiple Choice
2. Short Answer
3. Coding
4. Behavioral
5. Scenario-Based
6. Technical Explanation

Historical questions without a modern type remain compatible through `legacy-open-response`.

### 4.3 Multiple Choice security

Acceptance must preserve:

- pre-submit answer-key secrecy;
- no correct answer exposed in list/detail payloads before the allowed post-attempt context;
- deterministic backend correctness evaluation;
- no AI feedback action for MCQ attempts;
- post-attempt result and explanation behavior consistent with the approved implementation.

### 4.4 Coding safety

Coding questions remain text-only practice:

- generated Coding questions include bounded non-solution starter code;
- manual Coding questions may include optional bounded starter code;
- starter code may be copied or inserted into the answer editor;
- answers are never executed, compiled, or sandboxed;
- no hidden-test claim is made.

### 4.5 Structured answers

Behavioral, Scenario-Based, and Technical Explanation use frontend structured fields that serialize into the existing typed `{ type, text }` attempt contract.

No new attempt schema or migration is introduced.

### 4.6 Ownership and record integrity

Acceptance must preserve:

- authenticated ownership checks for sessions, questions, attempts, jobs, notes, and lifecycle actions;
- immutable historical attempts;
- canonical server identities after writes;
- stale-route and stale-selection guards;
- safe request-ID handling without leaking internal details.

## 5. Acceptance workstreams

Task 8 is complete only when all required workstreams below have evidence.

### 5.1 Workstream A — Baseline and repository preflight

Confirm before acceptance execution:

- local branch is the Task 8 branch;
- Task 8 branch starts from the merged Phase 19B commit;
- working tree is clean before tests;
- required dependencies are installed;
- no unrelated local changes are mixed into the acceptance evidence;
- local MongoDB/test infrastructure required by existing automated tests is available through the repository's current test setup.

No environment secrets may be printed into terminal evidence.

### 5.2 Workstream B — Automated Interview regression

Run the focused Interview backend and frontend suites needed to prove the final Interview feature set, including coverage for:

- session creation and ownership;
- question generation request contracts;
- all modern question types;
- manual question creation;
- Coding starter code persistence and serialization;
- MCQ secrecy and deterministic evaluation;
- typed attempts;
- structured answer serialization;
- explanations;
- feedback;
- notes;
- pinning;
- lifecycle changes;
- archived-session restore behavior;
- pagination and filters;
- polling, cancellation, retry, UUID/idempotency, and stale-response guards;
- frontend Career-area / role / category / distribution authoring.

Task 8 should reuse the existing tests rather than duplicating them unless an acceptance gap is found.

### 5.3 Workstream C — Full repository regression and builds

Run the repository's existing full verification gate after focused Interview acceptance is green:

- full backend test suite;
- full frontend test suite;
- backend source/test typecheck as currently defined by the repository;
- frontend typecheck;
- backend production build;
- frontend production build;
- `git diff --check` against `phase-19b-interview-coach-refinements`;
- clean working tree check.

Pre-existing unrelated warnings may be recorded separately if they do not represent a Task 8 failure. A failing test or build is not accepted merely because it appears unrelated; it must be investigated and classified with evidence.

## 6. Live Gemini acceptance

Task 8 requires a fresh local live Gemini acceptance run because mocked tests cannot prove the provider path works in the current environment.

### 6.1 Preconditions

Before the live run:

- backend and frontend development services are running only if required by the chosen local workflow;
- MongoDB required by the application is running;
- Gemini Direct is the active provider;
- a valid Gemini credential is configured through the application's approved credential/settings path;
- no credential value is pasted into chat or terminal evidence;
- the live model is the configured project baseline unless a repository-supported model override has already been approved.

### 6.2 Fresh acceptance session

Create a new Interview session specifically for Task 8 acceptance. It must not reuse an old generated-question result as evidence of the live provider path.

Use a clear test context that can reasonably support all six modern question types. A Technology & IT role is acceptable for this one provider acceptance session because Coding must be exercised, but Task 8 must separately verify non-technology Career-area authoring in browser QA.

### 6.3 Generated question acceptance

Generate a bounded question set that exercises all six modern types in one fresh live Gemini job where practical.

The preferred acceptance distribution is exactly one of each modern type:

- 1 Multiple Choice;
- 1 Short Answer;
- 1 Coding;
- 1 Behavioral;
- 1 Scenario-Based;
- 1 Technical Explanation.

If the UI or provider contract requires a different count for a valid bounded request, use the smallest valid distribution that still covers all six types and record the reason.

Acceptance requires:

- one generation intent from the user action;
- normal queued/processing/completed progress behavior;
- no duplicate generated set from one intent;
- exactly the requested final type distribution;
- usable prompts appropriate to the selected role/context;
- generated Coding starter code present, bounded, and not a completed solution;
- no secret MCQ answer key exposed before submission.

### 6.4 Explanation acceptance

For one eligible non-MCQ question, request a fresh explanation through the normal UI.

Verify:

- existing progress/status UX;
- the result remains bound to the selected question;
- a canonical explanation is available after completion;
- no duplicate provider request is created from one deliberate action.

MCQ explanation behavior should be checked according to the approved post-attempt lock/unlock rules rather than by forcing a pre-attempt AI explanation.

### 6.5 Feedback acceptance

Save one non-MCQ attempt and request feedback through the normal UI.

Verify:

- attempt remains immutable;
- feedback request binds to the correct attempt/question;
- progress/status UX works;
- completed feedback is shown as model-generated practice guidance, not a hiring prediction;
- score/summary/strengths/improvements/outline render from the canonical saved result;
- no AI feedback control is exposed for MCQ.

### 6.6 Resilience acceptance

Task 8 must verify the already-implemented resilience semantics without intentionally creating destructive conditions.

Use existing automated coverage as the primary evidence for:

- cancel;
- retry;
- polling timeout/transport handling;
- idempotent generation UUID reuse rules;
- stale route/selection suppression;
- worker cancellation/lease/deadline behavior.

A live cancel or retry action may be included only if it can be performed safely and predictably. It is not required to manufacture a provider failure solely for acceptance.

## 7. Human browser QA

Task 8 requires browser-level human QA because automated tests cannot prove final usability and visual integrity.

### 7.1 Create Interview wizard

Verify at least these representative Career areas:

- Technology & IT;
- Finance & Accounting;
- Healthcare;
- Education & Training;
- Engineering;
- Other / Custom.

Check:

- no Career area is preselected;
- target role remains unavailable until Career area selection;
- role shortcuts/search are scoped to the selected area;
- explicit custom-role adoption works;
- changing Career area clears the selected role and any uncommitted role query;
- user-owned interview title is preserved across area changes;
- Focus topic and Skill gap suggestions change by area and remain optional;
- previously selected Focus/Skill values are preserved as approved;
- Mid-level remains the experience default;
- `careerArea` is not persisted as a backend session field.

### 7.2 Build the Briefing

Verify:

- session-context categories are suggested/preselected as approved;
- custom categories have the same selected-chip treatment;
- categories may intentionally be empty;
- Question Type tiles are responsive and readable;
- Balanced and Exact distribution behavior is understandable;
- changing Question count clears stale explicit exact counts;
- exact counts match the requested total before submission.

### 7.3 Practice Desk — all modern answer experiences

Verify each modern type:

**Multiple Choice**
- radio + A/B/C/D-style badge + text alignment is correct;
- whole card is understandable/clickable;
- selection state is clear;
- answer key remains hidden before save;
- deterministic result appears after save.

**Short Answer**
- concise text entry behaves normally;
- save action creates a separate immutable attempt.

**Coding**
- starter code is visible for generated Coding questions;
- Copy works;
- Insert into answer works safely;
- editor remains text-only and does not imply execution.

**Behavioral**
- Situation / Task / Action / Result fields render in one column;
- a meaningful partial structured answer can be saved;
- saved result preserves headings/newlines.

**Scenario-Based**
- Assessment / Approach / Trade-offs / Decision fields render and serialize correctly.

**Technical Explanation**
- Concept / How it works / Example / Trade-offs or limitations fields render and serialize correctly.

### 7.4 Question Index, notes, attempts, and lifecycle

Verify:

- Question Index remains bounded and scrollable when needed;
- display numbering is correct;
- prompt truncation does not replace the full Practice Desk prompt;
- Private notes expand/collapse and dirty notes cannot be accidentally hidden;
- pinning remains bound to the selected question;
- Saved Attempts show separate immutable records;
- structured saved text preserves line breaks;
- completed and archived states are appropriately read-mostly/read-only;
- archived sessions can be restored through the approved existing status behavior where exposed by the list/card experience.

### 7.5 Responsive sanity

Perform at least:

- normal desktop width;
- narrow/mobile-like width.

Check for:

- no horizontal overflow caused by Task 7R Interview controls;
- sensible stacking/order;
- readable MCQ cards;
- usable structured answer fields;
- accessible primary actions remaining visible.

## 8. Security and negative acceptance

Task 8 must include evidence for these negative properties, primarily through existing automated integration/contract tests and targeted inspection where necessary:

- one user cannot access another user's Interview session;
- one user cannot access another user's question or attempt;
- invalid IDs fail safely;
- MCQ answer-key material is not exposed pre-submit;
- non-Coding questions reject Coding starter-code shape where the contract requires rejection;
- generated Coding questions without required starter code are rejected by schema validation;
- malformed AI output does not become persisted canonical Interview content;
- duplicate/ambiguous generation requests preserve the approved idempotency semantics;
- stale async responses cannot overwrite a newly selected route/question/attempt;
- safe error rendering does not leak secrets or unvalidated request IDs;
- no code submitted as a Coding answer is executed.

Do not add penetration-testing infrastructure or enterprise security tooling for Task 8.

## 9. Evidence record

Task 8 evidence should be concise but sufficient to support the final acceptance decision.

The final PR should record or summarize:

- exact Task 8 head SHA used for final verification;
- focused Interview automated results;
- full backend result counts;
- full frontend result counts;
- typecheck results;
- production build results;
- live Gemini acceptance outcome;
- human browser QA outcome;
- any accepted non-blocking unrelated warnings;
- `git diff --check` result;
- clean working tree result;
- whether any defects were found and, if so, the repair commits and re-verification evidence.

Do not commit credentials, raw secrets, access tokens, or private user data as acceptance evidence.

## 10. Defect severity and closeout rules

### Blocking

Task 8 cannot close if any of these remain:

- a reproducible failing Interview test tied to current behavior;
- backend or frontend build failure;
- typecheck failure;
- live Gemini generation cannot complete through the approved provider path when credentials/service are valid;
- any modern question type cannot be generated/used as designed;
- MCQ answer-key secrecy failure;
- incorrect deterministic MCQ evaluation;
- cross-user ownership/security failure;
- Coding answer execution or unsafe execution implication;
- structured answer data loss;
- route/selection race that causes canonical data to be shown or saved against the wrong Interview entity.

### Non-blocking but recorded

A warning may be recorded and deferred only when evidence shows it is unrelated to Task 8 acceptance and does not affect Interview correctness, security, build success, or usability.

Example: an existing React warning in an unrelated Resume test may be logged separately rather than expanding Interview scope, provided the test still passes and the warning does not originate from Task 8 code.

### Closeout condition

Task 8 is accepted only when:

1. all blocking criteria are green;
2. live Gemini acceptance is green;
3. browser QA is green;
4. full automated regression/typecheck/build gate is green;
5. final code review finds no unresolved Important or Blocking Task 8 issue;
6. PR body accurately reflects actual Task 8 work/evidence;
7. the user gives separate explicit merge approval.

## 11. Git and governance workflow

Use the established Career Learning Hub workflow:

- work only on `task/phase-19b3-task8-interview-final-acceptance`;
- use a draft PR targeting `phase-19b-interview-coach-refinements`;
- never target `main` for this task;
- no deployment is authorized by Task 8;
- user runs required local verification commands and provides complete evidence;
- failures are repaired on the same Task 8 PR;
- implementation/acceptance approval and merge approval remain separate;
- merge only after green final evidence and explicit merge approval;
- do not delete the task branch unless separately authorized.

## 12. Acceptance deliverable

The Task 8 deliverable is not a new product feature. It is a verified Interview Coach release-candidate state on the Phase 19B branch, supported by reproducible automated evidence, one fresh live Gemini acceptance flow, human browser QA, final review, and explicit governance closeout.
