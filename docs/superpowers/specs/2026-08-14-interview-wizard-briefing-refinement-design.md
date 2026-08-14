# Interview Wizard and Build the Briefing Refinement Design

Date: 2026-08-14
Status: Approved design, pending written-spec approval
Scope: Career Learning Hub — Phase 19B-3 Task 7R extension
Branch: `task/phase-19b3-task7r-interview-layout-refinement`
PR: #13

## Controlling implementation constraint

Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.

## Purpose

Refine the Interview Coach authoring experience before Task 7R closeout by:

1. replacing unnecessary free-text entry in the Create Interview dialog with guided local selections while preserving custom role/topic/gap entry where useful;
2. removing repeated visual `(required)` noise while preserving existing validation and accessibility semantics;
3. fixing stale exact-count state when Question count changes;
4. making custom generation categories visually and behaviorally consistent with selected context categories.

The work must remain bounded to the existing Interview frontend/API contracts. It must not add a new Gemini call, backend endpoint, worker, provider, code-execution feature, or deployment work.

---

# 1. Create Interview Wizard

## 1.1 Existing data contract remains authoritative

The dialog continues to construct the existing session payload:

- `title: string`
- `targetRole: string`
- `experienceLevel: string`
- `mode`
- `focusTopics: string[]`
- `skillGaps: string[]`
- optional `jobDescription`

No backend schema or endpoint change is required for this refinement.

## 1.2 Session title — smart default, then user-owned

The Session title begins as an editable suggestion derived from selected Target role and Experience level.

Example:

- Target role: `Backend Developer`
- Experience level: `Mid-level`
- Suggested title: `Mid-level Backend Developer Interview`

Rules:

1. Before the user manually edits the title, changing Target role or Experience level updates the suggestion automatically.
2. Once the user changes the title value themselves, including clearing it, the title becomes user-owned.
3. After the title becomes user-owned, later role/experience changes must not overwrite it.
4. Existing title validation limits and error/focus handling remain unchanged.

## 1.3 Target role — searchable common roles plus custom fallback

Replace the plain free-text Target role field with a single-select searchable combobox plus visible common-role shortcuts.

Initial built-in roles:

- Software Engineer
- Frontend Developer
- Backend Developer
- Full-Stack Developer
- Mobile Developer
- DevOps / Cloud Engineer
- Data Engineer
- ML / AI Engineer
- Cybersecurity Engineer
- QA / Test Engineer

Interaction requirements:

1. Common roles are visibly available without requiring the user to know what to type.
2. Typing filters/searches the common-role list.
3. Clicking a common role selects exactly one target role.
4. If typed text does not exactly match a common role, the user can explicitly choose that text as a custom role.
5. The final selected/custom value is still submitted as the existing `targetRole: string`.
6. The selector remains keyboard accessible and has a clear accessible label/state.

## 1.4 Experience level — predefined values only

Replace the free-text Experience level field with a single-choice selector containing exactly:

- Intern / Student
- Entry-level
- Junior
- Mid-level
- Senior
- Lead / Staff
- Manager

`Mid-level` remains the initial default unless existing product behavior requires another already-established default.

No custom experience-level text is allowed in the new UI. The selected value is still submitted through the existing `experienceLevel: string` contract.

## 1.5 Focus topics — optional, role-aware suggestions plus custom topics

Focus topics remain optional.

The UI shows a local, deterministic suggestion catalog derived from the selected target-role family. Suggestions start unselected.

Example Backend Developer suggestions may include:

- REST APIs
- Authentication
- Databases
- System Design
- Caching
- Testing
- Performance
- Security

Requirements:

1. Suggestions are multi-select.
2. Suggestions start unselected for a new role selection.
3. Selected suggestions use a clear selected-chip state.
4. Users can add custom focus topics.
5. Custom selected topics use the same selected-chip visual language as suggested topics.
6. Clicking a selected custom topic removes it.
7. Existing maximum-item and maximum-length constraints from the shared tag logic remain enforced.
8. The final values continue to submit as `focusTopics: string[]`.

## 1.6 Skill gaps — optional, role-aware suggestions plus custom gaps

Skill gaps remain optional and use the same interaction model as Focus topics.

Example Backend Developer suggestions may include:

- System Design
- Database Optimization
- API Security
- Caching Strategies
- Testing
- Observability
- Concurrency
- Performance Tuning

Requirements mirror Focus topics:

1. suggestions start unselected;
2. multi-select;
3. custom values allowed;
4. custom selections use the same selected-chip style;
5. clicking a selected custom value removes it;
6. existing tag limits remain enforced;
7. final values continue to submit as `skillGaps: string[]`.

## 1.7 Role-aware suggestion families

Suggestion catalogs must be static/local frontend data. No Gemini request is permitted just to populate the wizard.

Each built-in role family gets a small, practical topic/gap catalog. The implementation should keep this data easy to inspect and test rather than introducing a large taxonomy system.

Custom roles are deterministically matched to the nearest built-in family using small local keyword rules.

Examples:

- `MERN Developer` → Full-Stack Developer
- `React Native Engineer` → Mobile Developer
- `LLM Engineer` → ML / AI Engineer
- `Cloud Platform Engineer` → DevOps / Cloud Engineer
- `Penetration Tester` → Cybersecurity Engineer

If no useful local match exists, fall back to a small generic Software Engineering suggestion catalog.

The matching system must stay intentionally simple and deterministic. It must not attempt semantic embeddings, remote search, or AI classification.

## 1.8 Changing Target role must not destroy user selections

When Target role changes:

1. the available role-aware Focus topic and Skill gap suggestions update;
2. already-selected Focus topics remain selected;
3. already-selected Skill gaps remain selected;
4. custom topics/gaps remain selected;
5. the user must explicitly remove prior selections if they no longer apply.

This prevents silent loss of user input and supports cross-role concepts such as APIs or System Design.

## 1.9 Required/optional presentation

Remove repeated visible `(required)` text from individual required field labels.

Near the start of the form, show one concise form-level note identifying the required core fields, for example:

`Required: Session title, Target role, Experience level and Practice mode.`

Labels should then remain visually clean:

- Session title
- Target role
- Experience level
- Practice mode
- Focus topics · Optional
- Skill gaps · Optional
- Additional context · Optional

The exact punctuation/style can follow existing Interview visual conventions, but the repeated `(required)` wording must disappear.

Existing semantics must remain:

- HTML required constraints where already applicable;
- current validation functions;
- `aria-invalid`;
- field-level errors;
- validation summary;
- focus-to-error behavior;
- dialog focus management.

## 1.10 Practice mode

Keep the existing Practice mode control and values. This refinement does not redesign mode semantics.

---

# 2. Build the Briefing — Exact Distribution Fix

## 2.1 Problem

When Exact counts are active and Question count changes, the previous exact allocation can remain in state. This produces stale states such as:

- Question count: 6
- old exact total: 10
- validation: `Exact counts total 10; they must equal Question count 6.`

The validation message is correct, but the UI created the invalid stale state.

## 2.2 Approved behavior

When Question count changes while Exact counts are active:

1. preserve the selected Question Types;
2. clear `explicitCounts`;
3. close the exact-count editor;
4. immediately return Distribution to `Balanced automatically`;
5. do not invent or proportionally recalculate a new exact allocation.

When already in Balanced mode, changing Question count must not create any extra reset behavior.

A small non-blocking `aria-live="polite"` status may communicate the automatic change, for example:

`Question count changed. Distribution reset to balanced.`

The message must not be a blocking validation error.

## 2.3 Reopening Exact counts

If the user clicks `Set exact counts` after the reset, initialize a fresh balanced allocation from the current Question count and currently selected Question Types using the existing balanced-allocation behavior.

Example:

- count = 6
- selected types = Multiple Choice, Coding, Behavioral
- initial exact allocation = 2 / 2 / 2

Existing validation remains authoritative after the user edits those numbers.

---

# 3. Build the Briefing — Category Selection Refinement

## 3.1 Problem

A custom category is already included in the selected count and generation payload, but it currently appears as a visually weaker removable tag while context categories use obvious selected green chips. This makes custom categories appear unselected or secondary even though they are active.

## 3.2 One selected-state language

All selected categories must use the same selected-chip visual treatment and interaction language.

Examples:

- selected context category: `✓ MongoDB`
- selected custom category: `✓ Basic`

Requirements:

1. selected context and selected custom categories share the same selected appearance;
2. the selected counter must always correspond to what is visibly selected;
3. custom categories must no longer use a separate weak `value ×` visual treatment;
4. clicking a selected custom category removes it completely;
5. clicking a selected context category deselects it but leaves the context suggestion available;
6. unselected context suggestions remain visibly available for reselection;
7. intentionally empty category selection remains valid;
8. the generation request remains `categories: string[]`.

## 3.3 Duplicate/custom canonicalization

Keep the existing case-insensitive duplicate behavior.

If a context suggestion contains `MongoDB` and the user enters `mongodb`, do not create a second category. Select the canonical context spelling instead.

No backend distinction between context and custom categories is required.

---

# 4. Architecture and scope boundaries

## 4.1 Reuse existing frontend architecture

Prefer small focused components/data helpers around the existing Interview dialog, shared tag behavior, category selector, and question-type controls.

Do not perform a broad rewrite of `InterviewCreateDialog.tsx` or `InterviewSessionWorkspace.tsx` merely to support these refinements.

## 4.2 No new backend/Gemini infrastructure

This design must not add:

- a new backend endpoint;
- a new persistence model;
- a new session field;
- an additional Gemini/provider call;
- a new worker/job;
- SSE/WebSocket/streaming;
- external role/taxonomy APIs;
- embeddings or semantic-search infrastructure;
- deployment changes.

## 4.3 Existing security/behavior remains intact

Preserve:

- existing session ownership and authorization;
- current session serialization;
- existing Gemini generation architecture;
- six modern Interview question types plus historical Open response compatibility;
- MCQ key secrecy and deterministic correctness;
- Coding text-only/no-execution policy;
- current polling/cancel/retry/idempotency behavior.

---

# 5. Testing and verification design

Implementation must add focused tests before production behavior changes where a regression can be expressed automatically.

Minimum focused coverage:

## Create Interview wizard

- common Target role selection;
- searchable/filterable role interaction;
- custom Target role submission;
- exact Experience level options and submission;
- smart title updates before manual edit;
- smart title stops updating after manual edit/clear;
- role-aware Focus topic suggestions;
- role-aware Skill gap suggestions;
- suggestions start unselected;
- selected values survive role changes;
- custom role local-family matching and generic fallback;
- custom topic/gap selection/removal;
- optional empty Focus topics and Skill gaps remain valid;
- repeated `(required)` text is absent while validation/accessibility behavior remains;
- existing dialog focus/error handling remains green.

## Exact distribution

- changing Question count while exact counts are active clears exact counts and returns to Balanced;
- selected Question Types remain unchanged;
- changing Question count while already Balanced does not create unnecessary state changes;
- reopening Exact counts initializes from the new count.

## Categories

- context and custom selected categories use the same selected-state semantics;
- custom category click removes it;
- context category deselection preserves the available suggestion;
- selected counter matches visible selected categories;
- case-insensitive custom/context canonicalization remains intact;
- empty category selection still submits `[]`.

## Verification gate

Before Task 7R can be considered complete:

1. focused new/affected frontend tests pass;
2. frontend typecheck passes;
3. backend focused/full verification remains green where affected by the broader Task 7R extension;
4. full frontend regression passes;
5. backend and frontend production builds pass;
6. `git diff --check` is clean;
7. working tree is clean;
8. human browser QA confirms desktop/intermediate/mobile behavior for the refined wizard and Build the Briefing controls;
9. PR #13 description is updated to accurately describe the already-approved starter-code schema/Gemini-generation extension and these final frontend refinements;
10. merge occurs only after explicit user approval.

---

# 6. Explicit non-goals

This refinement does not include:

- resume-derived automatic role/topic extraction;
- AI-generated wizard suggestions;
- job-market role search;
- role taxonomy administration;
- profile-wide saved interview templates;
- code execution/compiler/sandbox/editor integration;
- deployment;
- Task 8 final closeout itself;
- merge into `main`.

---

# 7. Acceptance criteria

The design is complete when all of the following are true:

1. A user can create an Interview session without manually typing common Target role or Experience level values.
2. A custom Target role remains possible.
3. Focus topics and Skill gaps provide useful local role-aware suggestions but remain optional and unselected by default.
4. Changing Target role never silently deletes already-selected topics/gaps.
5. Session title receives a useful role/experience default but stops auto-changing after user edits it.
6. Repeated visible `(required)` labels are removed without weakening validation/accessibility.
7. Question count changes cannot leave stale Exact counts such as `10 of 6`; Exact mode resets to Balanced automatically.
8. Custom categories look and behave like real selected categories.
9. Selected-category count matches visible selected state.
10. Existing Interview API contracts, Gemini architecture, security properties, typed-question behavior, and no-code-execution policy remain intact.
