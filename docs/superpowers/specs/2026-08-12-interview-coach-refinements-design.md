# Phase 19B — Interview Coach Refinements Design

## Status

`CONVERSATIONAL DESIGN APPROVED / WRITTEN SPEC SELF-REVIEWED / AWAITING HUMAN SPEC REVIEW`

This document records the Phase 19B design approved in conversation. It is intentionally bounded. No implementation plan or product-code change is authorized until the human reviews this committed specification and approves transition to implementation planning.

After written-spec approval, Phase 19B planning will cover implementation of `CLH-UX-INTERVIEW-006` through `CLH-UX-INTERVIEW-010` and `CLH-UX-INTERVIEW-012`, plus a source-level architecture audit and design for `CLH-FEATURE-INTERVIEW-011`.

`CLH-FEATURE-INTERVIEW-011` is **not authorized for implementation by this specification**. Its Phase 19B outcome is an audited architecture design ready for a separate implementation decision.

## Repository identity

- Repository: `PrabhathMalindaGit/career-learning-hub`
- Design branch: `phase-19b-interview-coach-refinements`
- Branch baseline: `4cf7f0b9b75ca4b6233e9e697436709af32583d1`
  (`Record Phase 19A post-merge closeout`)
- Current authoritative execution phase at baseline: `PHASE 19B — Interview Coach Refinements`
- Phase 19A predecessor: `COMPLETED / MERGED`
- Deployment action: `NONE`

## Approved Phase 19B decomposition

### 19B-1 — Session Collection & Creation UX

Implement after written-spec approval:

- `CLH-UX-INTERVIEW-006` — make the session collection the primary Interview Coach workspace and move creation into a focused modal dialog;
- `CLH-UX-INTERVIEW-007` — render session pagination only when more than one page exists;
- `CLH-UX-INTERVIEW-008` — replace comma-only Focus Topics and Skill Gaps entry with accessible free-entry tag/chip inputs while preserving existing `string[]` contracts;
- `CLH-UX-INTERVIEW-009` — refine session cards into a role-first compact hierarchy;
- `CLH-UX-INTERVIEW-010` — reduce unnecessary uppercase/editorial visual noise.

### 19B-2 — Saved Attempts UX

Implement after written-spec approval:

- `CLH-UX-INTERVIEW-012` — replace developer-oriented Attempt History presentation with user-facing Saved Attempts terminology and clearer attempt metadata/status presentation.

### 19B-3 — Question-Type Architecture Audit

Audit and design only:

- `CLH-FEATURE-INTERVIEW-011` — selectable question types.

Expected 19B-3 terminal state:

`AUDIT COMPLETE / DESIGN PROPOSED / IMPLEMENTATION NOT AUTHORIZED`

## Design principles

1. Reuse the existing Interview Coach architecture and contracts wherever they already support the requested behavior.
2. Prefer surgical UI/interaction changes over backend redesign for `006–010` and `012`.
3. Do not introduce a new state-management library, frontend framework, dialog package, package dependency, migration, or deployment change for the approved UX refinements.
4. Preserve existing ownership checks, pagination semantics, Gemini jobs, polling, retry/cancel behavior, execution fencing, transactional persistence, and activity recording.
5. Preserve Gemini Direct as the only active AI provider and the current fixed-model routing policy.
6. Do not weaken answer/model-answer secrecy, response validation, or cross-user ownership boundaries.
7. Keep `011` implementation separate until its cross-layer architecture is audited and explicitly approved.

---

# 1. Current Interview architecture relevant to Phase 19B

## Frontend collection and creation

The current `/interviews` page permanently combines the session collection and the complete Create Session form in one side-by-side layout.

The existing creation flow already submits:

- `title`;
- `targetRole`;
- `experienceLevel`;
- `focusTopics`;
- `skillGaps`;
- optional `jobDescription`;
- `mode`.

It already provides client validation, invalid-field focus behavior, duplicate-submit prevention through `createBusy`, request cancellation through `AbortController`, navigation to the created session, status filtering, and server-side pagination with a page size of 20.

Phase 19B preserves these mechanics and changes presentation and interaction hierarchy.

## Frontend session card

The existing card already exposes target role, optional different session title, lifecycle status, experience level, practice mode, question count, last-updated timestamp, and Open Session action. Phase 19B refines this component rather than replacing the session summary contract.

## Frontend session workspace and attempts

The current workspace supports question browsing/filtering/pagination, manual questions, Gemini question generation, question explanation, written answer submission, saved attempts, async feedback generation, polling/retry/cancel behavior, notes/pinning, and attempt filtering/pagination.

The attempt section is currently presented with the developer-oriented kicker `Immutable record` and heading `Attempt history`.

## Backend session model

The current Interview Session already stores title, Resume source references, target role, experience level, `focusTopics: string[]`, `skillGaps: string[]`, optional job description, mode, lifecycle status, question count, and timestamps/completion time.

Focus Topics and Skill Gaps already have bounded server validation and persistence as arrays of strings. No schema change is required for the approved chip-input UX.

## Backend question model

The current Interview Question stores source, category, difficulty, question text, fingerprint, optional model answer, optional explanation/key points, job references, pin state, and user notes.

There is currently no question-type field and no type-specific payload such as multiple-choice options.

## Backend attempt model

The current Interview Attempt stores session/question ownership references, one immutable `answerText` string, feedback lifecycle status, feedback job reference, and optional generated feedback.

There is currently no typed/discriminated answer representation.

## Gemini generation contract

The current strict generated-question schema contains category, difficulty, question, and model answer. The generation workflow also enforces requested count, optional difficulty distribution, capacity limits, fingerprint de-duplication, strict validation, transactional persistence, job idempotency/execution fencing, and Gemini-only routing.

Therefore `011` cannot be implemented correctly as a frontend-only selector.

---

# 2. 19B-1 — Session Collection & Creation UX

## 2.1 Collection-first page hierarchy

The Interview Coach collection becomes the dominant page content. The permanently visible Create Session form is removed from the normal page layout.

The page presents:

- page title and description;
- one prominent `Create interview` action;
- status filters;
- the session collection;
- conditional pagination.

## 2.2 Create interview dialog

Creation uses a focused accessible modal dialog.

### Always-visible fields

- Session title — required;
- Target role — required;
- Experience level — required;
- Practice mode;
- Focus Topics chip input;
- Skill Gaps chip input.

### Optional disclosure

A collapsed `Additional context (optional)` disclosure contains Job description.

### Actions

- Primary: `Create interview`;
- Secondary: `Cancel`.

No multi-step wizard is introduced.

### Opening and closing behavior

- The primary `Create interview` control opens the dialog.
- Existing `?action=create` behavior remains supported and opens the dialog.
- Initial focus moves to Session title.
- Focus is contained inside the modal while it is open.
- Background page interaction is unavailable while the modal is open.
- Escape closes the dialog when no create request is active.
- Cancel closes the dialog when no create request is active.
- Closing through Escape or Cancel resets the create form to its initial defaults.
- Focus returns to the control that opened the dialog after Escape or Cancel.
- A failed API submission keeps the current valid user input so the user can correct/retry.
- Successful creation navigates directly to the new session workspace.

No new dialog dependency is introduced. Use existing React/browser primitives and repository patterns.

### Validation

- Inline errors remain programmatically associated with fields.
- If exactly one field is invalid, focus that field.
- If multiple fields are invalid, focus an accessible validation summary that links to the invalid fields.
- Existing server validation remains authoritative.

### Submission behavior

Preserve existing single-flight semantics:

- repeated submission while `createBusy` is true is disabled/ignored;
- the active request remains abortable through existing lifecycle handling;
- API errors remain recoverable;
- successful creation navigates once.

## 2.3 Focus Topics and Skill Gaps chip inputs

Transport and persistence remain exactly:

- `focusTopics: string[]`;
- `skillGaps: string[]`.

No taxonomy, AI suggestions, fuzzy matcher, external catalogue, or new backend model is introduced.

### Entry behavior

- Enter commits the current token;
- comma commits the current token;
- pasting comma-separated text creates multiple chips;
- leading/trailing whitespace is trimmed;
- empty values are ignored;
- exact duplicate values are suppressed;
- every chip has an explicit Remove control identifying the value being removed;
- Backspace on an empty text input does **not** delete a chip; deletion requires the explicit Remove control;
- pending valid text is committed before form submission so it is not silently lost.

### Bounds

Existing server bounds remain authoritative:

- maximum 50 items per field;
- maximum 120 characters per item.

The UI must validate both limits before API submission and show explicit inline errors. It must not silently truncate or discard over-limit values.

### Accessibility

- the input has a persistent programmatic label;
- added chips remain understandable to screen-reader users;
- Remove controls identify their associated chip;
- keyboard users can add and remove chips without pointer interaction.

## 2.4 Session card hierarchy

Use the approved role-first compact card.

### Primary

Target role is the main heading.

### Secondary

Session title is shown only when meaningfully different from target role.

### Compact metadata

- experience level;
- practice mode;
- restrained lifecycle status badge.

### Supporting metadata

- question count;
- last updated date.

### Action

`Open session` remains the clear primary card action.

Decorative role initials are optional visual support only. If retained, they must remain subordinate to the role name and must not be required to understand the card.

## 2.5 Visual-noise reduction

Reduce unnecessary editorial/uppercase treatment, including decorative kicker text where a nearby heading already communicates purpose. Do not remove useful accessible names, status information, or context solely to make the UI visually quieter.

## 2.6 Conditional session pagination

Preserve current server-side pagination and page size.

- 0 pages: hide pager;
- 1 page: hide pager;
- 2+ pages: show Previous/Next pager.

Changing the status filter resets page to 1.

Do not replace pagination with infinite scroll or Load More.

## 2.7 Empty states

### Entire collection empty

Show a first-run state with a `Create interview` action and copy equivalent to:

`No interview sessions yet. Create a practice session for a role you are preparing for.`

### Selected filter empty

If the collection exists but the selected status contains no sessions, communicate only that the selected view is empty, for example `No completed sessions yet.` Do not imply another session must be created.

## 2.8 Error states

Preserve current list retry behavior and safe request-ID presentation. Do not expose stack traces, provider secrets, raw internal exceptions, or unvalidated request identifiers.

---

# 3. 19B-2 — Saved Attempts UX

## 3.1 Terminology

Replace:

- `Immutable record`;
- `Attempt history`.

with:

- heading: `Saved attempts`;
- concise supporting copy explaining that submitted answers and completed practice feedback are preserved for later review.

Do not expose database/persistence terminology in the normal UI.

## 3.2 Attempt hierarchy

Each attempt entry prioritizes:

- submission date/time;
- user-facing feedback state;
- score only when feedback exists;
- clear review/select action.

Example completed state:

- `Submitted 12 Aug 2026, 1:15 PM`;
- `Feedback ready · 78/100`;
- `Review attempt`.

Example processing state:

- `Submitted 12 Aug 2026, 1:15 PM`;
- `Feedback processing`;
- `Review attempt`.

## 3.3 User-facing status mapping

Keep backend status enums unchanged and map them only for display:

- `recorded` → `Saved`;
- `feedback-queued` → `Feedback queued`;
- `feedback-processing` → `Feedback processing`;
- `feedback-completed` → `Feedback ready`;
- `feedback-failed` → `Feedback unavailable`.

## 3.4 Attempt pagination

- 0 or 1 page: hide pager;
- 2+ pages: show pager.

Preserve existing server-side attempt pagination and filters.

## 3.5 Persistence/feedback boundaries

19B-2 does not change attempt immutability, answer storage, feedback job creation, Gemini feedback contracts, retry/cancel/polling, scoring semantics, or ownership checks.

---

# 4. 19B-3 — Question-Type Architecture Audit

## 4.1 Purpose and original capability

`CLH-FEATURE-INTERVIEW-011` asks for selectable types including:

- Multiple choice;
- Short answer;
- Coding;
- Behavioral;
- Scenario-based;
- Technical explanation.

A future implementation must be able to support single-type sessions, mixed sessions, balanced mixes, optional counts by type, visible question type, type-appropriate answer controls, type-aware Gemini generation, type-aware feedback/scoring, and compatibility with existing Interview data.

Phase 19B does not implement those semantics. It produces the architecture required for a later implementation decision.

## 4.2 Audit surfaces

The audit must trace and document:

1. Session configuration and future selected type/mix representation.
2. Create/update API and runtime contracts for type configuration.
3. Question persistence and type-specific payload requirements.
4. Frontend question response parsing/validation.
5. Gemini generation request and strict structured-output schema.
6. Fingerprint/de-duplication implications.
7. Answer/attempt representation for each type.
8. Feedback/scoring semantics by type.
9. Answer-key/model-answer secrecy and serialization.
10. Existing-session/question/attempt compatibility.
11. Ownership, idempotency, retry/cancel, execution fencing, and transaction effects.
12. Required test coverage and migration strategy.

## 4.3 Architecture approaches the audit must compare

### Q1 — Minimal `questionType` extension

Add a type discriminator but keep most attempts as `answerText`.

Potential benefit: smallest apparent change.

Risks: awkward Multiple Choice representation, special-case validation, weak type-specific semantics, and implicit scoring rules.

### Q2 — Typed question + typed/discriminated answer payload

Use common question fields plus a type discriminator and bounded type-specific payload; use common attempt fields plus an answer payload appropriate to the type.

Illustrative semantics:

- Multiple choice → options + selected option identity;
- Short answer → compact text;
- Coding → code-oriented multiline text;
- Behavioral → written text;
- Scenario-based → written text;
- Technical explanation → explanatory text.

Q2 is the leading hypothesis, but the audit must prove whether it is the smallest safe architecture before recommending it.

### Q3 — Separate models/workflows per type

Strong isolation, but substantially greater model/API/UI/test/migration complexity. The audit should select Q3 only if source evidence demonstrates that a shared typed model cannot meet correctness/security requirements.

## 4.4 Existing-data compatibility

Existing questions have no type field and existing attempts may contain immutable `answerText` plus completed feedback.

Frozen invariants:

- no destructive migration;
- no rewriting existing question text to invent a modern type;
- no rewriting existing attempts;
- no loss of historical feedback;
- existing sessions remain usable;
- no silent misclassification of historical questions.

The audit must evaluate a backward-compatible representation for historical open-response questions, such as an internal legacy/open-response category, and select the exact representation in the 19B-3 design document.

## 4.5 Multiple-choice answer-key secrecy

A future Multiple Choice design must not expose the correct answer before submission.

The audit must define:

- the pre-submission browser payload;
- private backend scoring/reference fields;
- what can be revealed after submission/feedback;
- serialization/contract tests proving answer-key non-disclosure.

The current principle of withholding model-answer/explanation material from normal question-list responses must be preserved or strengthened.

## 4.6 Type-aware feedback/scoring analysis

The audit must analyze separate semantics instead of forcing every type through the current written-answer feedback model:

- Multiple choice — deterministic correctness when a validated answer key exists;
- Short answer — bounded qualitative/semantic practice feedback;
- Coding — code/practice feedback only, not a production compiler or hiring assessment;
- Behavioral — model-generated practice guidance;
- Scenario-based — structured reasoning/practice guidance;
- Technical explanation — correctness/relevance/clarity guidance.

No code-execution sandbox, remote judge, enterprise assessment system, or external runtime is part of Phase 19B.

## 4.7 Required 19B-3 deliverable

Create a dedicated Question-Type architecture document containing:

1. Current architecture map.
2. Exact original `011` requirements.
3. Data-model gap analysis.
4. Frontend contract gap analysis.
5. Gemini structured-output gap analysis.
6. Attempt/scoring gap analysis.
7. Existing-data compatibility analysis.
8. Answer-key/security analysis.
9. Q1/Q2/Q3 comparison.
10. Recommended architecture.
11. Exact schema-change proposal.
12. Exact API-change proposal.
13. Exact frontend interaction proposal.
14. Migration/backward-compatibility strategy.
15. Test matrix.
16. Estimated implementation scope.
17. Risks and explicit non-goals.

After human review of that architecture document, stop. Do not implement `011` without separate explicit authorization.

---

# 5. Testing and verification design

## 5.1 Test-first discipline

Implement 19B-1 and 19B-2 with RED → GREEN → refactor wherever the existing test harness permits a meaningful focused failing test before production-code changes.

## 5.2 Create dialog coverage

Verify at minimum:

- opens from primary `Create interview`;
- opens from `?action=create`;
- initial focus;
- focus containment/background isolation;
- Escape/Cancel behavior;
- form reset after Escape/Cancel;
- focus return to invoker;
- duplicate-submit prevention;
- field validation and one-error focus;
- multi-error summary behavior;
- failed API request preserves entered values;
- successful creation navigates once.

## 5.3 Chip-input coverage

Verify at minimum:

- Enter commits;
- comma commits;
- comma-separated paste;
- trimming;
- empty-value ignore;
- duplicate suppression;
- explicit chip removal;
- Backspace does not silently delete a chip;
- 50-item limit;
- 120-character item limit;
- pending token committed on submit;
- keyboard/screen-reader accessible labels.

## 5.4 Collection coverage

Verify at minimum:

- collection-first layout and no permanent creation panel;
- role-first cards;
- secondary title only when meaningfully different;
- status/metadata semantics preserved;
- full empty state;
- filtered empty state;
- pager hidden for 0/1 page;
- pager shown for 2+ pages;
- filter resets to page 1;
- list retry remains functional.

## 5.5 Saved Attempts coverage

Verify at minimum:

- `Saved attempts` heading;
- no user-facing `Immutable record`;
- approved status-label mapping;
- score shown only when feedback exists;
- date/time available;
- attempt review/select still works;
- conditional pager;
- existing feedback polling/retry/cancel behavior preserved.

## 5.6 Regression boundaries

Do not regress:

- question creation/generation;
- manual questions;
- question pagination/filtering;
- notes/pinning;
- written attempt submission;
- feedback requests;
- Gemini job polling/resilience;
- session status updates;
- ownership isolation;
- safe API parsing;
- Resume-source references;
- server-side pagination.

## 5.7 Human browser QA

Before 19B-1/19B-2 can be called complete, verify in the real browser:

- desktop;
- tablet/responsive width;
- mobile width;
- actual 200% browser zoom;
- keyboard-only dialog/chip-input operation;
- visible focus;
- dialog open/close/focus-return;
- long role/session/tag content;
- 0/1/multiple-page pagination states;
- Saved Attempts status/score states.

A live Gemini call is not required merely for collection/dialog/chip/terminology changes. Existing mocks/fixtures are sufficient unless a provider-related regression is discovered.

---

# 6. Non-goals and preserved boundaries

19B-1/19B-2 do not introduce:

- new AI providers;
- OpenRouter activation/fallback;
- token streaming/SSE/WebSockets;
- external skills/occupation catalogue;
- AI tag suggestions;
- fuzzy tag matching;
- Interview-data migration;
- destructive changes to existing sessions/questions/attempts;
- new frontend state framework;
- broad Interview module rewrite;
- deployment/environment changes;
- unrelated Dashboard/Learning/Auth/Resume work.

19B-3 does not implement:

- question-type schema fields;
- type-specific endpoints;
- MCQ options/answer keys;
- typed attempt persistence;
- type-aware Gemini generation;
- type-aware scoring;
- code execution/sandboxing.

---

# 7. Completion semantics

After the intended Phase 19B work:

- `006` — implemented and verified;
- `007` — implemented and verified;
- `008` — implemented and verified;
- `009` — implemented and verified;
- `010` — implemented and verified;
- `012` — implemented and verified;
- `011` — architecture audited/designed but still pending implementation.

Do not mark `CLH-FEATURE-INTERVIEW-011` complete in the original 50-item register merely because its audit/design is finished.

## Transition gate

After the human reviews and approves this exact committed specification, the next step is the detailed Phase 19B implementation plan. That plan must sequence 19B-1 and 19B-2 implementation/test work and the later 19B-3 architecture-audit deliverable while keeping `011` code implementation outside the authorized scope.
