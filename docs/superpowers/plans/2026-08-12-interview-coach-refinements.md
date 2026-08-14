# Phase 19B — Interview Coach Refinements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Keep `main` untouched; implement only on `phase-19b-interview-coach-refinements` until a separate merge authorization is given.

**Goal:** Implement the approved Interview Coach UX refinements for findings `CLH-UX-INTERVIEW-006` through `CLH-UX-INTERVIEW-010` and `CLH-UX-INTERVIEW-012`, then complete a source-level architecture audit/design for `CLH-FEATURE-INTERVIEW-011` without implementing question types.

**Architecture:** Keep the existing Interview domain, API contracts, persistence models, Gemini jobs, polling/resilience, ownership checks, and server-side pagination unchanged for 19B-1/19B-2. Extract two focused frontend units—an accessible controlled tag/chip input and a native-browser modal Create Interview dialog—then make surgical list/card/workspace presentation changes. 19B-3 is documentation-only source analysis across the existing frontend/backend/Gemini/attempt pipeline.

**Tech Stack:** React 19 + TypeScript + React Router + native `<dialog>` + Vite + Vitest + Testing Library; existing Express 5 + TypeScript + Mongoose + Zod Interview backend remains unchanged for 006–010/012. No new dependency.

## Global Constraints

- Frozen design authority: `docs/superpowers/specs/2026-08-12-interview-coach-refinements-design.md` at branch commit `89d7e72f213949d9995b7a34677f8994f74ae5bf`, human-approved in conversation before this plan.
- Branch baseline: `main` commit `4cf7f0b9b75ca4b6233e9e697436709af32583d1` (`Record Phase 19A post-merge closeout`).
- Implementation branch: `phase-19b-interview-coach-refinements`.
- Implement `006–010` and `012`. For `011`, audit + design only; no schema/API/UI/Gemini question-type implementation is authorized.
- For 19B-1/19B-2, do not change Interview backend models, schemas, routes, services, AI prompts, job handlers, ownership middleware, shared contracts, or database migrations unless a newly written failing test proves the approved UX cannot be implemented with the existing contract. If such a backend gap appears, stop and report it instead of expanding scope silently.
- Preserve `focusTopics: string[]` and `skillGaps: string[]`, with the existing authoritative maximum 50 items and 120 characters per item.
- Preserve session page size 20 and attempt page size 20; change only whether the pager is rendered.
- Preserve session create single-flight behavior, abort lifecycle, safe request-ID display, and canonical post-create navigation.
- Preserve written attempt immutability, feedback jobs, scores, polling, retry/cancel, stale-operation guards, and ownership isolation.
- Gemini Direct remains the only active provider; fixed-model routing remains unchanged. No live Gemini call is required for 19B-1/19B-2 verification.
- No new package, state-management framework, dialog package, taxonomy, AI tag suggestions, fuzzy matching, migration, environment change, deployment change, streaming/SSE/WebSocket work, or unrelated Phase 19C+ work.
- Use strict RED → verify intended failure → GREEN → bounded refactor. If a defect or unexpected test failure appears, invoke `superpowers:systematic-debugging` before production changes. After three failed code-changing attempts against one root cause, stop and report evidence.
- Automated browser/Playwright work is not part of this plan. Human Chrome QA is a separate final gate.
- Do not mark `CLH-FEATURE-INTERVIEW-011` complete in the original 50-item register merely because the architecture audit finishes.
- Do not activate Phase 19C automatically. After this plan, the governance state remains Phase 19B until the operator separately decides whether to implement or defer `011`.

---

### Task 1: Add the bounded free-entry Interview tag/chip input

**Files:**
- Create: `frontend/src/features/interviews/InterviewTagInput.tsx`
- Create: `frontend/src/features/interviews/InterviewTagInput.test.tsx`
- Modify: `frontend/src/features/interviews/interviewCoach.css`

**Interfaces:**

```ts
export const INTERVIEW_TAG_MAX_ITEMS = 50;
export const INTERVIEW_TAG_MAX_LENGTH = 120;

export interface InterviewTagMergeResult {
  values: string[];
  error?: string;
}

export function mergeInterviewTags(
  current: readonly string[],
  raw: string,
): InterviewTagMergeResult;

interface InterviewTagInputProps {
  id: string;
  label: string;
  values: string[];
  draft: string;
  error?: string;
  placeholder?: string;
  helpText?: string;
  onValuesChange(next: string[]): void;
  onDraftChange(next: string): void;
  onError(next?: string): void;
}
```

`mergeInterviewTags` must split comma-separated input, trim whitespace, ignore blanks, preserve first-seen order, suppress exact duplicates, reject any token over 120 characters, and reject a merge that would exceed 50 unique values. It must never silently truncate or discard an over-limit value.

- [ ] Write RED unit/component tests for Enter commit, comma commit, comma-separated paste, trimming, blank ignore, duplicate suppression, explicit Remove control, accessible Remove names, 50-item rejection, 120-character rejection, and Backspace-on-empty doing nothing destructive.
- [ ] Include a pure-helper RED case equivalent to:

```ts
expect(mergeInterviewTags(["Reliability"], " API design, Reliability ")).toEqual({
  values: ["Reliability", "API design"],
});
```

and explicit failure cases where `error` is present and the original `values` are preserved.
- [ ] Run and verify RED:

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/interviews/InterviewTagInput.test.tsx
```

- [ ] Implement the smallest controlled component. Enter and comma call the same commit helper; a paste containing commas is handled as one merge; Backspace does not remove chips; chip deletion occurs only through explicit `Remove <value>` buttons.
- [ ] Add scoped `.interview-tag-input*` styles inside `interviewCoach.css`: wrapping chip container, minimum target size for Remove buttons, visible focus, overflow-safe chip text, and mobile wrapping. Do not introduce a new stylesheet or dependency.
- [ ] Re-run the focused test and confirm GREEN.
- [ ] Run frontend typecheck for this task:

```bash
npm run typecheck --workspace @career-learning-hub/web
```

### Task 2: Extract the accessible Create Interview modal dialog

**Files:**
- Create: `frontend/src/features/interviews/InterviewCreateDialog.tsx`
- Create: `frontend/src/features/interviews/InterviewCreateDialog.test.tsx`
- Modify: `frontend/src/features/interviews/interviewCoach.css`
- Reuse/read-only: `frontend/src/features/interviews/interviewApi.ts`
- Reuse/read-only: `frontend/src/features/interviews/types.ts`

**Interfaces:**

```ts
interface InterviewCreateDialogProps {
  open: boolean;
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
  onRequestClose(): void;
  onCreated(sessionId: string): void;
}
```

The dialog owns the create-form draft/validation/request lifecycle. It reuses the existing `createInterviewSession()` API and exact `CreateInterviewSessionInput` contract. Use native `<dialog>` plus `showModal()`/`close()`; do not add a dialog package.

- [ ] Write RED tests for: open state; initial Session title focus; Study/Written practice only; Additional context disclosure initially collapsed; Cancel reset; Escape reset; focus return; one-invalid-field focus; multi-invalid validation summary; failed API request preserving form values; duplicate-submit prevention; API request using canonical trimmed data; pending tag draft committed on submit; and successful `onCreated(sessionId)` exactly once.
- [ ] In test setup, shim `HTMLDialogElement.prototype.showModal`/`close` only when jsdom lacks them. The shim must update the element `open` state so tests still exercise the component lifecycle rather than bypassing it.
- [ ] Run and verify RED:

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/interviews/InterviewCreateDialog.test.tsx
```

- [ ] Move the existing title/role/experience/mode/job-description validation into the dialog without weakening bounds: title 1–160, role 2–200, experience 1–100, job description ≤30,000.
- [ ] Replace raw comma-string topic/gap state with controlled `string[]` values plus separate pending drafts rendered through `InterviewTagInput`.
- [ ] Before submission, call `mergeInterviewTags` for each pending draft. If either draft is invalid, surface the tag field error and do not call the API. If valid, send the merged arrays.
- [ ] Preserve request single-flight: while create is busy, submit remains disabled, repeated submit is ignored, and Escape/Cancel do not close. Abort the active controller on unmount.
- [ ] On normal Cancel/Escape: clear API/field errors, restore default values (`experienceLevel = "Mid-level"`, `mode = "written-practice"`), close, call `onRequestClose`, and focus `returnFocusRef.current`.
- [ ] On API failure: keep entered values, show safe error/request ID, and keep the dialog open.
- [ ] On success: call `onCreated(result.session.id)` and do not fire a second navigation/close action.
- [ ] Add `.interview-create-dialog*` backdrop/surface/header/body/footer styles using the existing design tokens. Constrain height with internal scrolling, keep controls usable at 390px width and 200% zoom, and honor reduced-motion rules.
- [ ] Re-run the dialog test and Task 1 tag test; then run frontend typecheck.

### Task 3: Make the Interview collection primary and refine cards/pagination/empty states

**Files:**
- Modify: `frontend/src/features/interviews/InterviewSessionListPage.tsx`
- Modify: `frontend/src/features/interviews/InterviewSessionListPage.test.tsx`
- Modify: `frontend/src/features/interviews/InterviewSessionCard.tsx`
- Modify: `frontend/src/features/interviews/interviewCoach.css`
- Reuse/read-only: `frontend/src/components/PageHeader.tsx`
- Reuse/read-only: `frontend/src/components/Pager.tsx`
- Reuse/read-only: `frontend/src/components/StateSurface.tsx`

**Interfaces:**
- `InterviewSessionListPage` owns only list/filter/pagination/dialog-open state after extraction.
- Existing `PageHeader.actions` receives the primary `Create interview` button.
- Existing `InterviewCreateDialog` receives `open`, create-button ref, close callback, and a success callback that navigates to `/interviews/:sessionId`.
- Existing list API and `Pagination` contract remain unchanged.

- [ ] First rewrite/add RED list-page tests for the approved page behavior: no permanent create form while closed; primary `Create interview` action; `?action=create` opens dialog and consumes the query string; full empty state versus filtered empty state; pager absent for 0/1 page; pager present for 2+ pages; filter reset to page 1; role-first card; same-title suppression; safe retry; canonical session navigation.
- [ ] Add a RED test proving `PageHeader` action opens the modal and initial focus reaches Session title.
- [ ] Run and verify RED:

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/interviews/InterviewSessionListPage.test.tsx
```

- [ ] Remove create-form field/request state and `createInterviewSession` import from `InterviewSessionListPage`; replace them with `createOpen` and `createButtonRef`.
- [ ] Change `?action=create` handling from delayed DOM focus to `setCreateOpen(true)` plus removal of the query parameter. The dialog owns first focus.
- [ ] Supply `PageHeader.actions` with one prominent `Create interview` button.
- [ ] Render the collection as the full-width primary panel; remove the two-column create/list layout and sticky `.interview-create-panel` assumptions.
- [ ] Empty state logic must be deterministic: when `filter === "all"` and the result is empty, show `No interview sessions yet.` plus a Create interview action; when a non-all filter is empty, show a filter-specific message such as `No completed sessions yet.` without implying a new session is required.
- [ ] Render the shared `Pager` only when `pagination?.pages > 1`.
- [ ] In `InterviewSessionCard`, remove the decorative `Target role` kicker; keep target role as `h3`; show title only when meaningfully different; retain status/experience/mode/question count/updated/Open session semantics; keep role initials only if visually subordinate.
- [ ] Reduce excessive uppercase/letter-spacing specifically in collection/card supporting metadata. Do not globally remove `.interview-kicker` styling from unrelated Interview workspace sections in this task.
- [ ] Update list/card CSS for one-column collection-first layout and responsive behavior without changing the global app shell.
- [ ] Re-run list-page tests, tag/dialog tests, and frontend typecheck.

### Task 4: Implement Saved Attempts terminology, presentation, and conditional paging

**Files:**
- Modify: `frontend/src/features/interviews/InterviewSessionWorkspace.tsx`
- Modify: `frontend/src/features/interviews/InterviewSessionWorkspace.test.tsx`
- Modify: `frontend/src/features/interviews/interviewCoach.css`
- Reuse: `frontend/src/components/Pager.tsx`
- Reuse/read-only: `frontend/src/features/interviews/types.ts`
- Reuse/read-only: `frontend/src/features/interviews/interviewApi.ts`
- Reuse/read-only: `frontend/src/features/interviews/interviewPolling.ts`

**Interfaces:**

Add a presentation-only mapping near the workspace component:

```ts
const attemptStatusLabels: Record<InterviewAttemptStatus, string> = {
  recorded: "Saved",
  "feedback-queued": "Feedback queued",
  "feedback-processing": "Feedback processing",
  "feedback-completed": "Feedback ready",
  "feedback-failed": "Feedback unavailable",
};
```

No backend enum or API value changes.

- [ ] Write/modify RED workspace tests for: `Saved attempts` heading; no user-facing `Immutable record`; supporting copy; all approved status labels; score displayed only when `attempt.feedback` exists; submitted date/time; Review attempt selection; status-filter values unchanged while labels become user-facing; attempt pager hidden for 0/1 page; pager shown for 2+ pages; selected-attempt detail using presentation labels; existing stale-read/feedback-binding behavior preserved.
- [ ] Include terminology RED assertions for the written-attempt composer so normal UI no longer says `Record immutable attempt`, `immutable practice record`, or `Immutable attempt recorded`. Use user-facing copy equivalent to:
  - heading: `Save another written attempt`;
  - explanation: `Each submission is saved separately so you can review your practice over time.`;
  - action: `Save attempt`;
  - success: `Attempt saved. Another submission will be saved separately.`
- [ ] Run and verify RED:

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/interviews/InterviewSessionWorkspace.test.tsx
```

- [ ] Replace history heading/kicker with `Saved attempts` plus concise supporting copy; retain the total-count chip.
- [ ] Replace raw `attempt.status.replaceAll("-", " ")` rendering with `attemptStatusLabels` in list and selected detail.
- [ ] Update filter option **labels** only: `Saved`, `Feedback queued`, `Feedback processing`, `Feedback ready`, `Feedback unavailable`; keep option values exactly `recorded`, `feedback-queued`, `feedback-processing`, `feedback-completed`, `feedback-failed`.
- [ ] Refine attempt buttons to show `Submitted <localized date/time>`, presentation status, optional `· <score>/100`, and a visible `Review attempt` cue. Keep selection tied to canonical attempt IDs and do not add edit/delete behavior.
- [ ] Replace the raw attempt pagination `<div>` with the shared `Pager`, rendered only when `attemptPagination?.pages > 1`. Label it `Saved attempt pages`.
- [ ] Update CSS only for the new Saved Attempts hierarchy; preserve the existing three-column workspace layout/responsive breakpoints and all provider-job behavior.
- [ ] Re-run the complete workspace test. Pay special attention to existing tests for route changes, stale attempt writes, feedback binding, retry/polling, request IDs, readonly completed/archived sessions, notes, pinning, and generation UUID semantics.

### Task 5: Run focused Interview regressions and complete automated project verification

**Files:**
- Modify production/test files only if a failing test identifies a real regression in Tasks 1–4.
- Do not modify backend source merely to make this gate green; the approved UX work is frontend-only.

**Interfaces:**
- Produces fresh verification evidence for the exact executable checkpoint after 19B-1/19B-2.

- [ ] Run the focused Interview frontend bundle:

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/interviews/InterviewTagInput.test.tsx \
  src/features/interviews/InterviewCreateDialog.test.tsx \
  src/features/interviews/InterviewSessionListPage.test.tsx \
  src/features/interviews/InterviewSessionWorkspace.test.tsx \
  src/features/interviews/interviewApi.test.ts \
  src/features/interviews/interviewContracts.test.ts \
  src/features/interviews/interviewPolling.test.ts
```

- [ ] Run the complete frontend suite:

```bash
npm run test --workspace @career-learning-hub/web
npm run typecheck --workspace @career-learning-hub/web
```

- [ ] Run backend no-regression suites even though backend source is unchanged:

```bash
npm run test:unit
npm run test:integration
npm run test:security
npm run typecheck:tests
```

- [ ] Run monorepo typecheck/build and whitespace validation:

```bash
npm run typecheck
npm run build
git diff --check
```

- [ ] Inspect exact changed paths and confirm there is no package manifest, lockfile, backend Interview source, shared-types, migration, environment, deployment, provider, or Phase 19C+ code change.
- [ ] Search the changed frontend Interview files for stale user-facing terminology that violates the approved design:

```bash
git diff --name-only -- frontend/src/features/interviews
grep -RIn --exclude='*.test.tsx' --exclude='*.test.ts' \
  -E 'Immutable record|Record immutable attempt|immutable practice record|Immutable attempt recorded' \
  frontend/src/features/interviews || true
```

Any remaining match must be reviewed; internal comments/tests may use technical language, but normal rendered UI must not.
- [ ] No live Gemini call is required. Do not change Gemini configuration or credentials during this gate.
- [ ] If any test fails, use systematic debugging and preserve existing correctness/security behavior rather than weakening tests.

### Task 6: Produce the `CLH-FEATURE-INTERVIEW-011` Question-Type architecture audit/design only

**Files:**
- Create: `docs/superpowers/specs/2026-08-12-interview-question-type-architecture-design.md`
- Read-only audit inputs:
  - `frontend/src/features/interviews/types.ts`
  - `frontend/src/features/interviews/interviewContracts.ts`
  - `frontend/src/features/interviews/interviewApi.ts`
  - `frontend/src/features/interviews/InterviewSessionWorkspace.tsx`
  - `frontend/src/features/interviews/interviewApi.test.ts`
  - `frontend/src/features/interviews/interviewContracts.test.ts`
  - `frontend/src/features/interviews/InterviewSessionWorkspace.test.tsx`
  - `backend/src/modules/interviews/interviewSession.model.ts`
  - `backend/src/modules/interviews/interviewQuestion.model.ts`
  - `backend/src/modules/interviews/interviewAttempt.model.ts`
  - `backend/src/modules/interviews/interview.schemas.ts`
  - `backend/src/modules/interviews/interview.routes.ts`
  - `backend/src/modules/interviews/interview.controller.ts`
  - `backend/src/modules/interviews/interview.service.ts`
  - `backend/src/modules/interviews/interviewAi.service.ts`
  - `backend/src/modules/interviews/interview.jobs.ts`
  - `backend/src/modules/interviews/interview.fingerprint.ts`

**Interfaces:**
- This task produces documentation only.
- It must not add `questionType`, options, answer keys, typed attempt payloads, routes, schemas, prompts, tests for an implementation, or migrations.

- [ ] Build a source-backed current architecture map covering session create/list, question generation/manual add, strict frontend response parsing, persistence, fingerprinting, written attempt recording, feedback jobs, and pre-/post-answer serialization boundaries.
- [ ] Record the six required future types exactly: Multiple choice, Short answer, Coding, Behavioral, Scenario-based, Technical explanation.
- [ ] Compare Q1 (minimal discriminator + mostly `answerText`), Q2 (typed question + typed/discriminated answer payload), and Q3 (separate per-type models/workflows). Use evidence from current files; do not select Q2 merely because it was the leading hypothesis.
- [ ] Produce all 17 approved document sections: current architecture; original requirements; model gap; frontend contract gap; Gemini schema gap; attempt/scoring gap; compatibility; answer-key security; Q1/Q2/Q3; recommendation; exact schema proposal; exact API proposal; exact frontend interaction proposal; migration/backward compatibility; test matrix; implementation-size estimate; risks/non-goals.
- [ ] Explicitly solve historical compatibility without rewriting old questions/attempts/feedback. If recommending a legacy/open-response discriminator, define when it is inferred versus stored and prove it does not silently misclassify existing data.
- [ ] Explicitly define MCQ answer-key secrecy: pre-submission browser shape, backend-private scoring fields, post-submission reveal policy, and contract/security tests required later.
- [ ] Explicitly preserve Gemini Direct, job idempotency, retry/cancel, execution fencing, transaction boundaries, ownership checks, fingerprint semantics, and provider-result validation in any future proposal.
- [ ] Explicitly state that Coding remains text/code practice only; no compiler, sandbox, remote judge, or hiring-assessment claim is included.
- [ ] End the audit document with status exactly equivalent to `AUDIT COMPLETE / DESIGN PROPOSED / IMPLEMENTATION NOT AUTHORIZED`, plus a human-review gate before any `011` implementation plan.
- [ ] Verify documentation quality:

```bash
grep -nE 'TODO|TBD|FIXME|PLACEHOLDER' \
  docs/superpowers/specs/2026-08-12-interview-question-type-architecture-design.md || true
git diff --check
```

There must be no unresolved placeholder text. Do not run product tests merely because this documentation-only task was added; preserve the fresh executable evidence from Task 5.

### Task 7: Human Chrome QA, governance reconciliation, and stop at the `011` decision gate

**Files:**
- Modify after fresh automated evidence and human QA: `docs/planning/CURRENT_PHASE.md`
- Modify after operator review if needed: `docs/superpowers/specs/2026-08-12-interview-coach-refinements-design.md`
- Do not create a Phase 19B “fully complete” closeout that falsely marks `011` implemented.

**Interfaces:**
- Consumes Task 5 automated evidence + Task 6 architecture document + operator browser QA.
- Produces truthful Phase 19B governance: UX refinements verified; `011` architecture audited; `011` implementation still separately gated.

- [ ] Hand the operator local startup commands; no manual command is needed before source implementation, but human QA requires both services running:

```bash
cd "/Users/prabhathmalinda/Documents/Projects/Career Learning Hub"
npm run dev:backend
```

and in a second terminal:

```bash
cd "/Users/prabhathmalinda/Documents/Projects/Career Learning Hub"
npm run dev:frontend
```

Use the URLs printed by the local processes rather than assuming ports.
- [ ] Human Chrome QA matrix:
  - 1440×900 desktop collection-first layout;
  - 768×1024 responsive layout;
  - 390×844 mobile layout;
  - actual Chrome 200% zoom;
  - keyboard-only Create interview open/tab/Shift+Tab/Escape/Cancel/focus-return;
  - `?action=create` opens the dialog and removes the query intent;
  - one-field and multi-field validation focus;
  - failed create preserves values; successful create navigates once;
  - Focus Topics/Skill Gaps Enter, comma, paste, duplicate suppression, Remove, 50/120 limits, pending draft on submit, Backspace non-deletion;
  - full empty collection and filtered empty states;
  - 0/1-page hidden session pager and 2+-page visible pager;
  - long role/session titles and metadata card wrapping;
  - Saved attempts labels for Saved/queued/processing/ready/unavailable;
  - score appears only when feedback exists;
  - 0/1-page hidden attempt pager and 2+-page visible pager;
  - Review attempt selection, request feedback, stale-selection protection, and readonly completed/archived behavior remain meaningful.
- [ ] Human review the 19B-3 Question-Type architecture document separately. This review does **not** authorize implementation of `011`.
- [ ] Only after automated and human evidence is available, update `CURRENT_PHASE.md` on the feature branch to truthfully state:
  - Phase 19B remains current;
  - 19B-1 (`006–010`) implemented/verified/human-QA status according to actual evidence;
  - 19B-2 (`012`) implemented/verified/human-QA status according to actual evidence;
  - 19B-3 (`011`) architecture audit/design status according to actual evidence;
  - `CLH-FEATURE-INTERVIEW-011` implementation `NOT AUTHORIZED / NOT STARTED` unless the operator later gives a separate approval;
  - next gate = separate `011` implementation-versus-deferral decision;
  - Phase 19C remains inactive;
  - no deployment action is authorized by this phase.
- [ ] Run final docs-only checks after governance edits:

```bash
git diff --check
git status --short
git --no-pager diff --stat
```

- [ ] Stop. Do not merge to `main`, deploy, activate Phase 19C, or implement question types without a new explicit operator instruction.

## Plan Self-Review

- `006`: covered by Task 2 + Task 3 (focused modal creation while session collection remains primary).
- `007`: covered by Task 3 (session pager only for >1 page).
- `008`: covered by Task 1 + Task 2 (accessible structured chips mapped to existing arrays, no backend change).
- `009`: covered by Task 3 (role-first metadata/card hierarchy).
- `010`: covered by Task 3 (bounded visual-noise/uppercase reduction, not a global redesign).
- `012`: covered by Task 4 (Saved Attempts terminology, statuses, score/date/review presentation, attempt paging, removal of user-facing immutable-record jargon).
- `011`: covered only by Task 6 architecture audit/design; no implementation step exists anywhere in this plan.
- Type consistency: dialog submits the existing `CreateInterviewSessionInput`; tag output remains `string[]`; status filter values remain `InterviewAttemptStatus`; Pager consumes the existing `Pagination.pages` value.
- Security/correctness boundaries: no ownership, serialization, Gemini, job, attempt persistence, model-answer secrecy, route, backend schema, migration, or credential behavior is changed by Tasks 1–4.
- Placeholder scan: this plan contains no TODO/TBD/FIXME/placeholder requirement.
- No package/lockfile, deployment, environment, migration, provider, shared-types, or Phase 19C+ implementation is planned.
- No live Gemini call or browser automation is part of the automated gate; human Chrome QA is explicit and separate.
- The plan deliberately stops at a separate `011` implementation-versus-deferral decision and does not advance the roadmap automatically.