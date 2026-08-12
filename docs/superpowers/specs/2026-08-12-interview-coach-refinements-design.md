# Phase 19B — Interview Coach Refinements Design

## Status

`HUMAN-APPROVED / FROZEN FOR IMPLEMENTATION PLANNING`

This specification records the approved Phase 19B design for Career Learning Hub. It is intentionally bounded. It authorizes implementation planning for findings `CLH-UX-INTERVIEW-006` through `CLH-UX-INTERVIEW-010` and `CLH-UX-INTERVIEW-012`, plus a source-level architecture audit and design for `CLH-FEATURE-INTERVIEW-011`.

`CLH-FEATURE-INTERVIEW-011` is **not authorized for implementation by this specification**. Its Phase 19B outcome is an audited architecture design ready for a separate implementation approval.

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

Implement:

- `CLH-UX-INTERVIEW-006` — make the session collection the primary Interview Coach workspace and move creation into a focused dialog;
- `CLH-UX-INTERVIEW-007` — render session pagination only when more than one page exists;
- `CLH-UX-INTERVIEW-008` — replace comma-only Focus Topics and Skill Gaps entry with accessible free-entry tag/chip inputs while preserving existing `string[]` contracts;
- `CLH-UX-INTERVIEW-009` — refine session cards into a role-first compact hierarchy;
- `CLH-UX-INTERVIEW-010` — reduce unnecessary uppercase/editorial visual noise.

### 19B-2 — Saved Attempts UX

Implement:

- `CLH-UX-INTERVIEW-012` — replace developer-oriented Attempt History presentation with user-facing Saved Attempts terminology and clearer attempt metadata/status presentation.

### 19B-3 — Question-Type Architecture Audit

Audit and design only:

- `CLH-FEATURE-INTERVIEW-011` — selectable question types.

Expected 19B-3 terminal state:

`AUDIT COMPLETE / DESIGN PROPOSED / IMPLEMENTATION NOT AUTHORIZED`

## Design principles

Phase 19B must follow these principles:

1. Reuse the existing Interview Coach architecture and contracts wherever they already support the requested behavior.
2. Prefer surgical UI/interaction changes over backend redesign for `006–010` and `012`.
3. Do not introduce a new state-management library, frontend framework, package dependency, migration, or deployment change for the approved UX refinements.
4. Preserve existing ownership checks, pagination semantics, Gemini jobs, polling, retry/cancel behavior, execution fencing, transactional persistence, and activity recording.
5. Preserve Gemini Direct as the only active AI provider and the current fixed-model routing policy.
6. Do not weaken answer/model-answer secrecy, response validation, or cross-user ownership boundaries.
7. Keep `011` implementation separate until its cross-layer architecture is audited and explicitly approved.

---

# 1. Current Interview architecture relevant to Phase 19B

## Frontend collection and creation

The current `/interviews` page combines two major concerns in one permanent side-by-side layout:

- session collection/listing;
- the complete Create Session form.

The current creation form already submits the approved domain fields:

- `title`;
- `targetRole`;
- `experienceLevel`;
- `focusTopics`;
- `skillGaps`;
- optional `jobDescription`;
- `mode`.

The existing page also already provides:

- client validation;
- first-invalid-field focus behavior;
- duplicate-submit prevention through `createBusy`;
- request cancellation through `AbortController`;
- navigation to the created session;
- session status filtering;
- server-side pagination using a page size of 20.

Phase 19B preserves these mechanics and changes their presentation and interaction hierarchy.

## Frontend session card

The existing session card is already role-first in data ordering, but contains decorative/editorial treatment and a relatively heavy visual hierarchy. It exposes:

- target role;
- optional different session title;
- lifecycle status;
- experience level;
- practice mode;
- question count;
- last-updated timestamp;
- Open Session action.

Phase 19B refines this component rather than replacing the underlying session summary contract.

## Frontend workspace and attempts

The current session workspace supports:

- question browsing and pagination;
- filters;
- manual questions;
- Gemini question generation;
- question explanation;
- written answer submission;
- immutable saved attempts;
- async feedback generation;
- job polling/retry/cancel behavior;
- question notes/pinning;
- attempt pagination and status filtering.

The attempt section is currently presented under the developer-oriented kicker `Immutable record` and heading `Attempt history`.

## Backend session model

The current Interview Session model already stores:

- title;
- source Resume identity/version references;
- target role;
- experience level;
- `focusTopics: string[]`;
- `skillGaps: string[]`;
- optional job description;
- mode;
- lifecycle status;
- question count;
- timestamps/completion time.

Both Focus Topics and Skill Gaps already have bounded server validation and persistence as arrays of strings. Phase 19B therefore does not require a schema change for the approved chip-input design.

## Backend question model

The current Interview Question model stores common written-question fields:

- source (`manual` or `ai-generated`);
- category;
- difficulty;
- question text;
- fingerprint;
- optional model answer;
- optional explanation/key points;
- generation/explanation job references;
- pin state;
- user notes.

There is currently no question-type field and no type-specific payload such as multiple-choice options.

## Backend attempt model

The current Interview Attempt model stores:

- session/question ownership references;
- one immutable `answerText` string;
- feedback lifecycle status;
- feedback job reference;
- optional generated feedback containing score, summary, strengths, improvements, suggested outline, provider/model/prompt metadata, and completion time.

There is currently no typed/discriminated answer representation.

## Gemini generation contract

The current structured-output contract for generated questions contains only:

- category;
- difficulty;
- question;
- model answer.

The generation workflow additionally enforces:

- requested count;
- optional difficulty distribution;
- capacity limits;
- fingerprint-based duplicate suppression;
- strict structured-output validation;
- transactional persistence;
- job idempotency/execution fencing;
- current Gemini-only routing.

This is why `011` cannot be implemented correctly as a frontend-only selector.

---

# 2. 19B-1 — Session Collection & Creation UX

## 2.1 Collection-first page hierarchy

The Interview Coach collection becomes the dominant page content.

The permanently visible full Create Session form is removed from the page layout. Instead, the page presents:

- page title/description;
- one prominent `Create interview` action;
- status filters;
- the session collection;
- conditional pagination.

The collection should read as the user's primary Interview Coach workspace, not as a secondary panel beside a form.

## 2.2 Create interview dialog

The approved creation interaction is a focused accessible modal/dialog.

### Always-visible fields

- Session title — required;
- Target role — required;
- Experience level — required;
- Practice mode;
- Focus Topics chip input;
- Skill Gaps chip input.

### Optional disclosure

A collapsed `Additional context (optional)` disclosure contains:

- Job description.

### Actions

- Primary: `Create interview`;
- Secondary: `Cancel`.

No multi-step wizard is introduced.

### Opening behavior

- The main `Create interview` action opens the dialog.
- Existing `?action=create` behavior must remain supported, but it opens the dialog instead of focusing the removed inline form.
- Initial focus goes to Session title.

### Accessibility and focus behavior

The implementation must provide real modal behavior:

- semantic dialog labeling;
- focus moved into the dialog when opened;
- keyboard focus contained within the open dialog;
- background page interaction prevented while modal;
- Escape closes the dialog when no create submission is active;
- Cancel closes the dialog when no create submission is active;
- focus returns to the invocation control after close where practical;
- inline validation remains programmatically associated with fields;
- one invalid field receives focus directly;
- multiple invalid fields use an accessible validation summary and then provide field links/focus navigation.

Do not introduce a new dialog package solely for this phase if the repository can implement the behavior safely with existing React/browser primitives and project patterns.

### Submission behavior

Preserve the existing single-flight semantics:

- repeated submission while `createBusy` is true is ignored/disabled;
- the current request remains abortable;
- server/API errors remain visible and recoverable without losing valid form input;
- successful creation navigates directly to the created session workspace.

Closing/reopening the dialog should start from a predictable clean create state unless an existing repository convention discovered during implementation strongly requires preserving unsent data.

## 2.3 Focus Topics and Skill Gaps chip inputs

The backend and frontend transport remain:

- `focusTopics: string[]`;
- `skillGaps: string[]`.

No taxonomy, AI suggestion service, fuzzy matcher, or external catalogue is added.

### Entry behavior

- Enter commits the current token;
- comma commits the current token;
- pasting comma-separated text creates multiple chips;
- leading/trailing whitespace is trimmed;
- empty items are ignored;
- duplicate values are suppressed;
- every chip has a clear Remove control;
- Backspace on an empty input may select/remove the previous chip using conventional accessible chip-input behavior;
- pending valid input should be committed on form submission rather than silently lost.

### Bounds

Existing server bounds remain authoritative:

- maximum 50 items per field;
- maximum 120 characters per item.

The UI should catch these cases before submission where practical and show explicit validation errors. It must not silently truncate user input or silently discard an over-limit chip.

### Accessibility

- the text input must have a persistent programmatic label;
- added/removed chips must remain understandable to screen-reader users;
- Remove actions must identify the chip being removed;
- keyboard users must be able to add, inspect, and remove items without requiring pointer interaction.

## 2.4 Session card hierarchy

Use a role-first compact card.

### Primary information

- Target role is the main heading.

### Secondary information

- Session title is shown only when meaningfully different from the target role.

### Compact metadata

- experience level;
- practice mode;
- restrained lifecycle status badge.

### Supporting metadata

- question count;
- last updated date.

### Action

- `Open session` remains the clear primary card action.

Decorative role initials may remain only if they support scanability and do not compete with the role name. They are not required by this design.

## 2.5 Visual-noise reduction

Reduce unnecessary editorial and uppercase styling in the collection and creation experience.

Examples include removing or de-emphasizing labels whose only purpose is decorative hierarchy, such as repeated kicker text where the nearby heading already communicates the section purpose.

Do not remove useful accessible names, status text, or contextual labels merely to reduce visual density.

## 2.6 Conditional session pagination

Preserve the current server-side pagination contract and page size.

Rendering rule:

- 0 pages: no pager;
- 1 page: no pager;
- 2 or more pages: show Previous/Next pager.

Changing the status filter resets the current page to page 1.

Do not replace pagination with infinite scrolling or Load More in this phase.

## 2.7 Empty states

### Entire collection empty

Present a useful first-run state with a `Create interview` action.

Example intent:

`No interview sessions yet. Create a practice session for a role you are preparing for.`

### Filtered collection empty

If sessions exist overall but the selected status has no matches, state only that the selected view is empty, for example:

`No completed sessions yet.`

Do not misleadingly tell the user to create a new session merely because a filter has no results.

## 2.8 Error states

Preserve the existing retry behavior and safe request-ID presentation. Do not expose raw stack traces, internal exception text, provider secrets, or unvalidated request identifiers.

---

# 3. 19B-2 — Saved Attempts UX

## 3.1 User-facing terminology

Replace the current developer-oriented presentation:

- kicker: `Immutable record`;
- heading: `Attempt history`.

with:

- heading: `Saved attempts`;
- concise supporting copy explaining that submitted answers and completed practice feedback are preserved for later review.

Do not expose persistence/database implementation terminology in the normal UI.

## 3.2 Attempt row/card hierarchy

Each saved attempt should prioritize:

- submission date/time;
- user-facing feedback state;
- score only when feedback is available;
- clear action to review/select the attempt.

Example completed state:

- `Submitted 12 Aug 2026, 1:15 PM`;
- `Feedback ready · 78/100`;
- `Review attempt`.

Example processing state:

- `Submitted 12 Aug 2026, 1:15 PM`;
- `Feedback processing`;
- `Review attempt`.

## 3.3 User-facing status mapping

Internal persistence values remain unchanged. Map them for presentation:

- `recorded` → `Saved`;
- `feedback-queued` → `Feedback queued`;
- `feedback-processing` → `Feedback processing`;
- `feedback-completed` → `Feedback ready`;
- `feedback-failed` → `Feedback unavailable`.

Do not change the existing backend enum solely for display terminology.

## 3.4 Attempt pagination

Use the same conditional rendering rule as session pagination:

- 0 or 1 page: hide pager;
- 2 or more pages: show pager.

Keep the existing server-side attempt pagination and filters.

## 3.5 Persistence and feedback boundaries

No change is made in 19B-2 to:

- attempt immutability;
- answer storage;
- feedback job creation;
- Gemini feedback prompts/contracts;
- retry/cancel/polling behavior;
- scores or scoring semantics;
- ownership checks.

This is a presentation/interaction refinement only.

---

# 4. 19B-3 — Question-Type Architecture Audit

## 4.1 Purpose

The original `CLH-FEATURE-INTERVIEW-011` requirement asks for selectable interview question types including:

- Multiple choice;
- Short answer;
- Coding;
- Behavioral;
- Scenario-based;
- Technical explanation.

The future feature must be capable of supporting:

- single-type sessions;
- mixed-type sessions;
- balanced mixes;
- optional counts by type;
- type visible on generated questions;
- type-appropriate answer controls;
- type-aware Gemini generation;
- type-aware feedback/scoring;
- compatibility with existing Interview sessions/questions/attempts.

Phase 19B does not implement those semantics. It produces the architecture required for a later safe implementation decision.

## 4.2 Hard reason for a separate audit

The current architecture assumes generic written interview questions and one `answerText` attempt payload. There is no question-type discriminator, no multiple-choice option model, no selected-answer representation, and no type-aware structured-output or feedback contract.

Adding a frontend selector without cross-layer changes would create false capability and inconsistent persistence/scoring behavior.

## 4.3 Audit surfaces

The source-level audit must trace and document:

1. Session configuration and whether future selected type/mix configuration belongs on the session.
2. Create/update API and runtime contracts for type configuration.
3. Question persistence and type-specific question payload requirements.
4. Frontend question response parsing/validation.
5. Gemini question-generation request and strict structured-output schema.
6. Question fingerprint/de-duplication effects.
7. Answer/attempt representation for each type.
8. Feedback/scoring behavior by type.
9. Answer-key/model-answer secrecy and response serialization.
10. Existing-session/question/attempt backward compatibility.
11. Ownership, idempotency, retry/cancel, execution-fence, and transaction effects.
12. Required test coverage and migration strategy.

## 4.4 Candidate architecture approaches to compare

### Q1 — Minimal `questionType` field with mostly existing `answerText`

Advantages:

- smallest apparent schema change;
- minimal frontend contract expansion.

Risks:

- Multiple Choice becomes awkward or relies on special-case strings;
- validation becomes increasingly branchy;
- type-specific answer semantics are weak;
- future scoring rules may become implicit and error-prone.

The audit must assess Q1 but must not select it merely because it changes fewer lines.

### Q2 — Typed question plus typed/discriminated answer payload

Conceptually:

- common question fields + type discriminator + bounded type-specific question payload;
- common attempt fields + typed answer payload appropriate to the question type.

Illustrative semantics:

- Multiple choice → options plus selected option identity;
- Short answer → compact text;
- Coding → code-oriented multiline text;
- Behavioral → written text;
- Scenario-based → written text;
- Technical explanation → written explanatory text.

This is the leading architecture hypothesis because it offers explicit validation while preserving shared services, but it is **not frozen until 19B-3 proves it is the smallest safe design**.

### Q3 — Separate model/workflow per question type

Advantages:

- strongest isolation.

Costs:

- multiple models/routes/contracts;
- duplicated UI/service logic;
- larger migration/testing surface;
- excessive complexity for current project requirements.

The audit should reject Q3 unless source evidence demonstrates a compelling need.

## 4.5 Existing-data compatibility is mandatory

Existing questions do not contain a type field. Existing attempts contain immutable `answerText` and may already have feedback.

The future design must preserve these records without destructive migration.

Frozen compatibility invariants:

- no destructive migration;
- no rewriting existing question text merely to assign a new type;
- no rewriting existing attempts;
- no loss of existing feedback;
- historical sessions remain usable;
- no silent misclassification of old questions as a modern type when the source data does not prove that type.

The audit should evaluate a compatibility concept such as an internal `legacy/open-response` representation, but the exact representation remains a 19B-3 design decision.

## 4.6 Multiple-choice answer-key secrecy

Multiple Choice creates a new answer-key boundary. If future generated data contains options and a correct answer/reference, the normal pre-submission browser response must not leak the correct answer.

The current application already hides model-answer/explanation material from normal question-list responses. The future architecture must preserve that principle for type-specific private scoring/reference material.

The audit must explicitly define:

- what the browser receives before submission;
- what the backend retains privately;
- what may be revealed after submission/feedback;
- serialization/contract tests proving answer-key non-disclosure.

## 4.7 Type-aware feedback/scoring boundaries

The audit must separate semantics by type rather than forcing all types through the current written-feedback assumption.

Expected distinctions to analyze:

- Multiple choice: deterministic option correctness may be possible when a validated answer key exists;
- Short answer: bounded qualitative/semantic feedback;
- Coding: code/practice feedback, explicitly not a production compiler or hiring assessment unless a separate execution sandbox is later designed;
- Behavioral: model-generated practice guidance;
- Scenario-based: model-generated structured reasoning/practice guidance;
- Technical explanation: correctness/relevance/clarity guidance.

The audit must not add a code-execution sandbox, external judge, remote runtime, or enterprise assessment system unless separately requested and approved.

## 4.8 19B-3 deliverable

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

After that document is reviewed, stop. Do not implement `011` without separate explicit authorization.

---

# 5. Testing and verification design

## 5.1 Test-first requirement

Implementation of 19B-1 and 19B-2 should follow RED → GREEN → refactor where the repository's existing test harness permits meaningful focused tests.

Do not modify production code first and then retrofit assertions when a focused failing test can reasonably be written first.

## 5.2 Create dialog coverage

At minimum verify:

- opens from the primary `Create interview` action;
- opens from `?action=create`;
- initial focus placement;
- modal focus containment/background isolation;
- Escape behavior;
- Cancel behavior;
- busy submission cannot be duplicated;
- field validation and first-invalid focus;
- multi-error summary behavior;
- API failure remains recoverable;
- successful create navigates to the new session workspace.

## 5.3 Chip-input coverage

At minimum verify:

- Enter commits a chip;
- comma commits a chip;
- comma-separated paste creates multiple chips;
- whitespace trimming;
- empty values ignored;
- duplicate suppression;
- chip removal;
- count-limit error behavior;
- per-item length-limit error behavior;
- pending valid token committed on submit;
- keyboard accessibility and meaningful Remove labels.

## 5.4 Collection coverage

At minimum verify:

- collection is the primary layout and permanent creation panel is absent;
- role-first card hierarchy;
- session title hidden when not meaningfully different;
- restrained status/metadata presentation does not remove semantics;
- full empty state;
- filtered empty state;
- pager hidden for 0/1 page;
- pager shown for 2+ pages;
- filter change resets page to 1;
- list retry behavior remains functional.

## 5.5 Saved Attempts coverage

At minimum verify:

- heading is `Saved attempts`;
- `Immutable record` is absent from user-facing UI;
- internal status values map to approved user-facing labels;
- score is shown only when feedback exists;
- attempt date/time remains available;
- attempt selection/review behavior remains functional;
- pager hidden for 0/1 page and shown for 2+ pages;
- existing feedback polling/retry/cancel behavior remains unchanged.

## 5.6 Regression boundaries

Focused changes must not regress:

- Interview question creation/generation;
- manual questions;
- question pagination/filtering;
- notes/pinning;
- written attempt submission;
- feedback requests;
- Gemini job polling/resilience;
- status updates;
- ownership isolation;
- safe API parsing;
- Resume-source references;
- current server-side pagination.

## 5.7 Browser/human QA

Human browser QA is required for the visual/interaction changes before Phase 19B-1/19B-2 can be called complete.

Review at minimum:

- desktop;
- tablet-width/responsive layout;
- mobile-width layout;
- actual browser zoom at 200%;
- keyboard-only create-dialog and chip-input operation;
- visible focus;
- dialog open/close/focus-return behavior;
- long role/session/tag content;
- 0/1/multiple-page pagination states;
- Saved Attempts status/score states.

A live Gemini call is not required merely to verify collection/dialog/chip/terminology changes. Existing mocks/fixtures are sufficient unless a provider-related regression is discovered.

---

# 6. Implementation boundaries and non-goals

Phase 19B-1/19B-2 must not introduce:

- new AI providers;
- OpenRouter activation/fallback;
- live token streaming/SSE/WebSockets;
- external skills/occupation catalogue;
- AI-generated tag suggestions;
- fuzzy tag matching;
- migration of Interview data;
- destructive updates to existing sessions/questions/attempts;
- new frontend state framework;
- broad Interview module rewrite;
- deployment configuration changes;
- environment-variable changes;
- unrelated Dashboard/Learning/Auth/Resume work.

Phase 19B-3 must not implement:

- question-type schema fields;
- type-specific API endpoints;
- MCQ options or answer keys;
- typed attempt persistence;
- type-aware Gemini generation;
- type-aware scoring;
- code execution/sandboxing.

Those are future implementation concerns subject to the approved 19B-3 architecture and a separate explicit authorization.

---

# 7. Completion semantics

Under the approved Phase 19B approach, the original finding register should be interpreted as follows after this phase's intended work:

- `006` — implemented and verified;
- `007` — implemented and verified;
- `008` — implemented and verified;
- `009` — implemented and verified;
- `010` — implemented and verified;
- `012` — implemented and verified;
- `011` — architecture audited and designed, but still pending implementation.

Do not mark `CLH-FEATURE-INTERVIEW-011` complete in the original 50-item register merely because its audit/design is finished.

## Phase transition rule

The immediate next step after this approved/frozen design is to write the detailed Phase 19B implementation plan. That plan should sequence 19B-1 and 19B-2 implementation/test work and the later 19B-3 architecture-audit deliverable while keeping `011` code implementation outside the authorized scope.

No implementation begins until the human reviews this committed specification and approves transition to implementation planning.
