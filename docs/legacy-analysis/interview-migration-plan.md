# Interview Coach migration plan

## 1. Executive decision

Use the legacy reference only as product and information-architecture evidence.
Do not copy source, styles, assets, prompts, configuration, infrastructure, or
data. Rebuild the smallest supported Interview Coach inside the current React,
router, authenticated shell, shared API client, Express, MongoDB, AI gateway,
and durable job architecture.

Proposed Phase 10 scope is an owned session list and workspace with session
creation, manual and idempotently generated questions, pinning, private notes,
explanations, written attempts, attempt history, explicit feedback requests,
owned job polling, and validated feedback. Unsupported journeys remain
excluded. This plan does not authorize Phase 10; Phase 10 remains `PLANNED`.

## 2. Controlling evidence

Evidence priority:

1. Current backend source and tests control routes, schemas, persistence,
   ownership, jobs, errors, and responses.
2. Accepted planning decisions control architecture, authentication, security,
   privacy, and legacy isolation.
3. Current frontend router, shell, auth provider, shared client, styles, and
   tests control integration.
4. `docs/frontend/frontend-architecture-audit.md` is historical context; its
   earlier missing-router/auth/client findings are superseded by current
   source.
5. `LEGACY_INTERVIEW_PREP/` is read-only evidence only.

Key current evidence:

- protected deferred interview routes:
  `frontend/src/routing/router.tsx:57-96`;
- current shell navigation and outlet: `frontend/src/AppShell.tsx:12-18`,
  `44-130`;
- memory-only access token and refresh bootstrap:
  `frontend/src/features/auth/AuthProvider.tsx:51-93`;
- shared client envelope/error/request-ID/abort/refresh behavior:
  `frontend/src/api/apiClient.ts:21-29`, `102-163`, `179-244`;
- active interview routes:
  `backend/src/modules/interviews/interview.routes.ts:47-186`;
- strict schemas: `backend/src/modules/interviews/interview.schemas.ts:10-204`;
- owned nested-resource guards:
  `backend/src/modules/interviews/interviewOwnership.middleware.ts:8-65`;
- private cache headers: `backend/src/app.ts:59-63`;
- active IDOR evidence:
  `backend/src/tests/security/idor.security.test.ts:9-74`;
- legacy classification details:
  `docs/legacy-analysis/interview-prep-inventory.md`.

## 3. Migration principles

- Current contracts win every conflict.
- Rebuild interactive behavior; do not transplant implementation.
- The route parameter is the sole active workspace identity.
- The server derives user ownership; the frontend sends no user ID.
- Validate and allowlist every interview response at the feature boundary.
- Use the shared client for Bearer, refresh cookie, request ID, error, and abort
  behavior.
- Treat session context, questions, answers, attempts, notes, feedback, scores,
  and jobs as private.
- Make provider work explicit, idempotent, bounded, and observable through
  owned jobs.
- Never fabricate progress, questions, answers, attempts, feedback, scores, or
  success.
- Prefer local component/reducer state and current infrastructure. Add no state
  library, form library, schema dependency, API client, router, backend,
  database, auth provider, provider SDK, or design system.
- Use active CSS and accessibility conventions; legacy visuals are reference
  only.

## 4. Consolidated capability matrix

| Capability | Legacy evidence | Active support | Decision | Phase 10 result |
| --- | --- | --- | --- | --- |
| Session library | Cards and fetch | SUPPORTED | REBUILD | Owned paginated list |
| Session creation | Context form plus automatic generation | SUPPORTED | REBUILD | Create first; generation remains explicit |
| Session open | Route parameter | SUPPORTED | REBUILD | Route-owned workspace |
| Session status | Delete only in legacy | SUPPORTED | REBUILD | Approved status actions only |
| Role/experience/topics/context | Present | SUPPORTED | REBUILD | Exact active fields and bounds |
| Manual questions | No connected legacy UI | SUPPORTED | REBUILD | Explicit manual add |
| Generated questions | Synchronous raw client flow | SUPPORTED | REBUILD | Idempotent job submission and polling |
| Question order | Pinned first, then creation | SUPPORTED | REBUILD | Preserve server order |
| Reorder/edit/delete question | No safe supported flow | NOT SUPPORTED | REJECT | Exclude |
| Pinning | Present, weak ownership | SUPPORTED | REBUILD | Explicit owned nested mutation |
| Private notes | Advertised/path only | SUPPORTED | REBUILD | Explicit save and clear |
| Explanations | Raw synchronous drawer | SUPPORTED | REBUILD | Owned job or already-available result |
| Written attempts | No safe evidence | SUPPORTED | REBUILD | Explicit immutable recording |
| Attempt history | No safe evidence | SUPPORTED | REBUILD | Owned paginated newest-first history |
| Attempt edit/delete | No evidence | NOT SUPPORTED | REJECT | Exclude |
| Feedback | No safe evidence | SUPPORTED | REBUILD | Explicit attempt-bound job and stored result |
| Job state | No legacy jobs | SUPPORTED | REBUILD | Factual owned polling |
| Search/global analytics | No supported evidence | NOT SUPPORTED | REJECT | Exclude |
| Audio/video/speech/timer | No safe evidence | NOT SUPPORTED | REJECT | Exclude |
| Legacy auth/API/backend/assets | Present and conflicting | NOT APPLICABLE | REJECT | Keep current architecture |

## 5. Approved or proposed Phase 10 journeys

Propose for later operator approval:

1. List owned interview sessions with bounded pagination and optional supported
   status filtering.
2. Create a session with title, target role, experience level, focus topics,
   skill gaps, optional job description, supported mode, and optional manual
   questions.
3. Open one owned route-selected session.
4. Display allowlisted session context and status.
5. Add one manual question with category, difficulty, text, and an optional
   model-answer framework.
6. Submit an explicit bounded generation request with a client UUID.
7. Poll the returned owned job and display truthful queued, processing,
   completed, failed, cancelled, paused, and transport-error states.
8. Retry a terminal generation failure only through an explicit action and a
   new request UUID; reuse the same UUID only for the same in-flight intent.
9. List questions with bounded pagination and supported pinned, difficulty, and
   category filters while preserving server order.
10. Pin or unpin through the explicit boolean route.
11. Add, update, and clear private notes with a visible save state.
12. Load question detail and explicitly request an explanation.
13. Write and explicitly record one immutable attempt.
14. List or load owned attempts without replacing the answer draft
    prematurely.
15. Explicitly request feedback for a recorded attempt.
16. Poll the owned feedback job and reload the canonical attempt.
17. Display allowlisted stored score, summary, strengths, improvements, and
    suggested outline as model-generated guidance.
18. Preserve session, question, attempt, feedback, and job identity.
19. Cancel obsolete client requests and ignore stale completions.
20. Provide factual loading, empty, validation, error, retry, safe 404,
    duplicate, capacity, archived, unavailable-AI, and terminal states.
21. Preserve responsive, keyboard, focus, reduced-motion, announcement, and
    non-color accessibility behavior.

Question reordering is not proposed because the active API exposes no reorder
contract. Company is not a distinct active field. Deletion is not proposed.

## 6. Active backend capability map

All listed interview and job routes require authentication. Interview routes
derive ownership from `request.auth.userId`; nested resources are bound to
user, parent session, and resource ID. The application applies
`Cache-Control: private, no-store` and `Pragma: no-cache` globally under current
app middleware (`backend/src/app.ts:59-63`). Database readiness is required for
all persisted routes. Worker and configured AI readiness are additionally
required for asynchronous completion and remain `REQUIRES VERIFICATION`.

| Capability | Method and route | Request schema | Success response | Ownership, pagination, idempotency, job | Validation, errors, readiness | Frontend requirement and evidence |
| --- | --- | --- | --- | --- | --- | --- |
| List sessions | `GET /api/v1/interview-sessions` | Query `page`, `limit`, optional `status` | `data.sessions`, `data.pagination` | User filter; page ≥1, limit 1-100; no job/idempotency | Auth/validation; database | Validate allowlisted list/pagination, abort, render states; `interview.schemas.ts:87-91`, `interview.service.ts:166-198` |
| Create session | `POST /api/v1/interview-sessions` | Strict title, optional owned resume/version, role, experience, topics, gaps, optional job description, mode, up to 100 manual questions | `201 data.session`, `data.questions` | User server-derived; transaction; no idempotency | Ownership of resume/version; duplicate/limit/domain errors; database/transaction | Send no user ID; validate session/questions; `interview.schemas.ts:37-63`, `interview.service.ts:75-164` |
| Load session | `GET /api/v1/interview-sessions/:sessionId` | ObjectId param | `data.session` | Owned session middleware; no pagination/job | Safe `INTERVIEW_SESSION_NOT_FOUND`; database | Route ID only; narrow raw document response; `interview.routes.ts:63-68`, `interview.controller.ts:63-73` |
| Update session | `PATCH /api/v1/interview-sessions/:sessionId/status` | Strict `active`, `completed`, or `archived` | `data.session` | Owned session; no concurrency token | Valid status; safe 404; database | Expose only approved transitions; general metadata update is NOT SUPPORTED; `interview.schemas.ts:65-69`, `interview.service.ts:224-250` |
| List questions | `GET /api/v1/interview-sessions/:sessionId/questions` | Page/limit; optional pinned, difficulty, category | `data.questions`, `data.pagination` | Owned session and user filter; server pinned-first order | Answers/explanations/fingerprint omitted; database | Validate and preserve order; `interview.schemas.ts:74-85`, `interview.service.ts:346-393` |
| Add manual question | `POST /api/v1/interview-sessions/:sessionId/questions` | Strict category, difficulty, question, optional model answer | `201 data.question` | Owned session; transactional count reservation; fingerprint uniqueness | Archived/capacity/duplicate errors; database/transaction | Explicit submit, no user/session body IDs; `interview.schemas.ts:28-35`, `interview.service.ts:253-343` |
| Generate questions | `POST /api/v1/interview-sessions/:sessionId/questions/generate` | UUID request ID, optional owned resume version, count 1-20, categories, optional exact difficulty mix | `202 data.job` | Owned session; idempotency type+user+session+request ID; durable job | Capacity/source/schema/rate/AI quota errors; database, worker, AI | Persist UUID per intent, validate job type/status, poll; `interview.schemas.ts:105-135`, `interview.controller.ts:186-238` |
| Generation status | `GET /api/v1/jobs/:jobId` | ObjectId param | `data.job` with status/progress/attempts/result/error/timestamps | Owned job; no pagination; idempotent read | Safe `JOB_NOT_FOUND`; database; worker/AI for progress | Allowlist safe fields, reject wrong type, never show raw error/stack; `job.controller.ts:14-40`, `job.queue.ts:245-259` |
| Load question | `GET /api/v1/interview-sessions/:sessionId/questions/:questionId` | Bound ObjectId params | `data.question` | Owned session and question | Safe 404; reveal rule depends on mode/explanation; database | Validate permitted detail fields and reveal behavior; `interview.controller.ts:128-142`, `interview.service.ts:395-409` |
| Pin/unpin | `PATCH /api/v1/interview-sessions/:sessionId/questions/:questionId/pin` | Strict boolean `isPinned` | `data.question` | Owned session and question | Validation/safe 404; database | Explicit boolean; adopt canonical response; `interview.schemas.ts:93-97`, `interview.controller.ts:144-163` |
| Save notes | `PATCH /api/v1/interview-sessions/:sessionId/questions/:questionId/notes` | Strict trimmed notes, max 8,000; empty clears | `data.question` | Owned session and question | Validation/safe 404; database | Explicit save with dirty/saved/error state; `interview.schemas.ts:99-103`, `interview.service.ts:420-427` |
| Request explanation | `POST /api/v1/interview-sessions/:sessionId/questions/:questionId/explanation` | Bound params, no body | `200 data.question` plus `alreadyAvailable`, or `202 data.job` | Owned nested resource; resource-scoped idempotent job | Rate/AI quota/job errors; database, worker, AI | Handle both response variants and reload detail after completion; `interview.controller.ts:240-285` |
| Record attempt | `POST /api/v1/interview-sessions/:sessionId/questions/:questionId/attempts` | Strict `answerText`, 1-50,000 plus configured runtime limit | `201 data.attempt` | Owned nested resource; immutable answer; no idempotency | Length/safe 404; database | Confirm explicit submission and adopt canonical attempt; `interview.schemas.ts:137-141`, `interview.service.ts:429-465` |
| List attempts | `GET /api/v1/interview-sessions/:sessionId/attempts` | Page/limit; optional question ID/status | `data.attempts`, `data.pagination` | Owned session/user filter; newest first | Validation/safe 404; database | Validate/narrow private attempt and feedback fields; `interview.schemas.ts:143-156`, `interview.service.ts:468-508` |
| Load attempt | `GET /api/v1/interview-sessions/:sessionId/attempts/:attemptId` | Bound ObjectId params | `data.attempt` | Owned session and attempt | Safe 404; database | Narrow raw document response; `interview.controller.ts:326-336` |
| Request feedback | `POST /api/v1/interview-sessions/:sessionId/attempts/:attemptId/feedback` | Bound params, no body | `200 data.attempt` plus `alreadyAvailable`, or `202 data.attemptId`, `data.job` | Owned attempt; resource-scoped idempotent job | Answer/rate/AI quota/job errors; database, worker, AI | Explicit action; handle both variants; `interview.controller.ts:338-395` |
| Feedback status | `GET /api/v1/jobs/:jobId` | ObjectId param | Owned feedback job | Owned job; read only | Wrong type/malformed result must stop client; worker/AI state | Reuse bounded polling with expected type `interview.attempt.feedback`; job evidence above |
| Load feedback | `GET .../attempts/:attemptId` or list attempts | Bound params or bounded query | Feedback nested in canonical attempt when complete | Owned attempt/session | Strict persisted output schema; database | Allowlist score, summary, strengths, improvements, outline, completed time; `interviewAttempt.model.ts:21-35`, `interview.schemas.ts:187-204` |

Unresolved response-serialization detail for raw session and attempt documents
is `REQUIRES VERIFICATION`. Phase 10 validators must not expose owner,
provider/model, prompt-version, stack, payload, storage, or unknown fields.

## 7. Frontend architecture recommendation

Keep responsibilities under `frontend/src/features/interviews/`:

- `InterviewSessionListPage`: owned list, pagination, filters, create entry;
- `InterviewSessionWorkspace`: route identity, session/question/attempt
  orchestration, stale-request protection;
- `InterviewSessionForm`: bounded session context and optional manual questions;
- `InterviewQuestionList`: pagination, filters, order, selection;
- `InterviewQuestionForm`: manual creation;
- `QuestionPractice`: canonical question detail, pin, notes, explanation, answer
  draft;
- `InterviewAttemptHistory`: owned history and selection;
- `InterviewFeedbackPanel`: allowlisted stored result and qualified score;
- `InterviewJobStatus`: shared feature-local generation/explanation/feedback job
  states;
- `interviewApi`: exact methods, paths, queries, bodies, no user ID, abort
  forwarding;
- `interviewContracts`: runtime envelope/domain validation and field
  allowlisting without a new dependency;
- `interviewPolling`: bounded expected-type polling;
- feature-local types and focused tests.

Combine trivial fields and small presentational fragments. Replace the
placeholder dashboard and its logs/fabricated state. Do not create another
router, client, state store, form system, validation package, or design system.

## 8. Session state model

Suggested feature-local states:

- list: `loading | ready-empty | ready | error`;
- creation: `idle | editing | submitting | succeeded | validation-error |
  request-error`;
- workspace: `loading | ready | safe-not-found | malformed | error`;
- status mutation: `idle | saving | saved | error`;
- route request identity: monotonic sequence plus `AbortController`;
- canonical session: last validated server response;
- create form: local draft, field errors, top summary, no browser persistence.

Do not infer a concurrency token. Adopt canonical responses and reload after
mutations when identity/order/count may change.

## 9. Question state model

- Maintain validated paginated summaries separately from selected detail.
- Preserve server ordering: pinned descending, then creation ascending and ID.
- Manual add: draft, submitting, duplicate/capacity/archived/error, canonical
  success.
- Generation: intent UUID, accepted job, last validated job, polling state,
  terminal state, explicit retry.
- Pin: explicit requested boolean, pending, canonical success, safe rollback or
  reload on error.
- Notes: local draft with dirty, saving, saved, and error states; clear through
  the exact empty-string contract.
- Explanation: not requested, already available, queued, processing, completed,
  failed, cancelled, paused, error.
- No edit, delete, drag reorder, or free-form AI mutation state.

## 10. Attempt and feedback state model

- Answer draft is local and private; it is not persisted in browser storage.
- Recording is explicit. A successful response establishes immutable attempt
  identity and clears the draft only after user-visible success.
- History remains paginated newest first and may be filtered by question/status.
- Selected historical attempt is read-only.
- Feedback is absent, already available, queued, processing, completed, failed,
  cancelled, paused, or request-error.
- Completed display uses only canonical stored feedback fields.
- A feedback job never replaces the answer draft or another selected attempt.
- Obsolete job results are ignored when session/attempt identity changes.

## 11. AI and job policy

- Never call a provider from the frontend.
- Never send provider/model/prompt fields from the client.
- Generation, explanations, and feedback require explicit user actions.
- Validate expected job type, ID, status, progress bounds, attempts, safe error,
  and allowed result identifiers.
- Poll only the authenticated owned-job route.
- Keep job IDs and request UUIDs in component memory.
- Treat accepted work as queued, not completed.
- On unavailable AI, preserve session/question/attempt state and show the safe
  server error with request ID where available.
- Never render raw provider errors, stack traces, payloads, prompts, or unknown
  result fields.
- Describe output and scores as model-generated guidance, not objective truth
  or hiring probability.
- Do not automatically retry provider work, regenerate, submit answers, request
  feedback, or mutate user text.

## 12. Idempotency policy

- For one generation intent, create one UUID before the request.
- Reuse that UUID when retrying a transport failure whose acceptance is
  unknown.
- Do not create multiple parallel submissions for the same intent.
- Poll the returned or deduplicated owned job.
- After a confirmed terminal failure, an explicit "Try again" creates a new
  intent UUID; reusing the original would resolve to the existing failed job.
- Explanation idempotency is server-scoped to user and question.
- Feedback idempotency is server-scoped to user and attempt.
- Never derive keys from private text or expose user IDs.

## 13. Ownership and integrity rules

- Send no user ID in interview request bodies, queries, or paths.
- Bind session ownership to the authenticated user.
- Bind questions to session plus user.
- Bind attempts to session plus user and verify the question belongs to the same
  session.
- Bind feedback to the owned attempt and owned job.
- Treat another user's valid ID exactly like a missing resource.
- Preserve resume and resume-version ownership checks when source context is
  selected.
- Use route parameters as identities; reject response IDs that do not match the
  active request.
- Preserve strict bodies, unknown-key rejection, fingerprints, capacity,
  transactions, immutable question/answer fields, and canonical IDs.
- Never weaken IDOR behavior or rely on frontend visibility as authorization.

## 14. Security and privacy controls

- Preserve memory-only access tokens and the HttpOnly refresh cookie.
- Use only the shared authenticated API client.
- Preserve CORS allowlists, rate limits, AI quotas, request IDs, error
  normalization, and private no-store caching.
- Validate all external data and copy only allowlisted display fields.
- Never store interview content, drafts, notes, jobs, feedback, or tokens in
  local storage, session storage, or IndexedDB.
- Never log request bodies, role/company/job context, questions, answers, notes,
  attempts, feedback, scores, job payloads, prompts, tokens, cookies, owner IDs,
  raw errors, or responses.
- Render structured strings through React escaping. Do not enable raw HTML or
  untrusted Markdown links/images.
- Require explicit confirmation only where a consequential or destructive
  action is later approved; Phase 10 currently excludes deletion.
- Clear private drafts on logout/session identity change only through deliberate
  component lifecycle behavior.

## 15. Accessibility and responsive requirements

- One logical heading hierarchy and labelled regions for session, questions,
  practice, attempts, feedback, and job status.
- Programmatic labels, descriptions, error links, required indicators, and a
  focused error summary.
- Native buttons for cards/disclosures; `aria-expanded` and controlled-region
  linkage where used.
- Accessible names for pin, notes, explanation, pagination, retry, and status
  actions.
- Visible focus and keyboard-only operation in source and visual order.
- Managed focus, Escape, and focus return for any dialog; prefer inline regions
  when a dialog is unnecessary.
- `role=status` or polite live regions for saves, enqueue, polling, terminal
  results, and errors; use alert only for urgent blocking errors.
- Never convey difficulty, state, score, or failure by color alone.
- Respect reduced motion; no delayed per-card animation is required.
- Reflow without horizontal page scrolling at 1440, 1024, 768, 390, and 320
  pixels and at 200% zoom.
- Long roles, categories, questions, answers, notes, feedback, request IDs, and
  errors must wrap safely.

## 16. Error, retry, cancellation and stale-response policy

- Preserve `ApiError` status, code, safe message, request ID, and validated
  details.
- Distinguish validation, auth, safe 404, duplicate, capacity, archived,
  too-long, rate-limit, unavailable-AI, job failure/cancel, malformed response,
  and transport failure.
- Abort list/detail requests on unmount, identity change, replacement, or
  surface departure.
- Use a request sequence so a late response cannot replace newer session,
  question, attempt, notes, or feedback state.
- Preserve the last validated job during transient polling failures.
- Proposed polling precedent, pending operator approval: 1, 2, 3, and 5 seconds,
  then every 8 seconds; pause after five minutes or three consecutive transient
  failures.
- A client timeout pauses checking; it does not mark the backend failed or
  cancel it.
- Stop on terminal job states, auth failure, owned 404, malformed response,
  wrong job type, or identity mismatch.
- Retry transport reads explicitly. Retry state-changing work only under its
  idempotency policy.
- Do not automatically cancel backend jobs when the client stops polling.

## 17. Testing plan

Contract tests:

- exact methods, routes, queries, and bodies;
- pagination bounds and optional filters;
- no client user ID;
- `AbortSignal` forwarding;
- success/failure envelope and request-ID preservation;
- field allowlisting and malformed response rejection;
- session/question/attempt identity binding;
- job type/status/progress/result validation;
- feedback result and score bounds;
- stripping owner, provider/model, prompt, payload, stack, and unknown fields.

Session tests:

- loading, empty, list, create, open, status, pagination, validation, retry,
  cancellation, stale response, safe 404, and ownership.

Question tests:

- manual creation, duplicate/capacity/archived errors, generation submission,
  UUID reuse/new-intent behavior, order, filters, pagination, pinning, notes
  save/clear, explanation variants, job success/failure/cancel/pause, and stale
  selection.

Attempt tests:

- private controlled draft, length validation, explicit record, immutable
  canonical success, history/detail, question/session binding, stale-session
  protection, and cross-user safe 404.

Feedback tests:

- explicit request, already-available response, owned polling, completed
  validation, failed/cancelled/paused jobs, unavailable AI, safe error, no raw
  provider fields, no automatic feedback, and no free-form mutation.

Security tests:

- synthetic User A/User B session, question, attempt, job, explanation, and
  feedback boundaries;
- client user-ID rejection/ignore behavior;
- safe 404 and cross-session nesting;
- private cache headers and request IDs;
- no sensitive logs or persistent tokens;
- malformed IDs and mass-assignment keys.

Accessibility tests:

- headings/labels/descriptions, error-summary focus, keyboard disclosure,
  visible focus, dialog focus/Escape/return, status announcements, non-color
  states, pagination, reduced motion, narrow reflow, and 200% zoom.

Runtime tests, only in Phase 10 with prerequisites:

- local database and worker readiness;
- safe configured/unconfigured AI behavior;
- authenticated browser journeys;
- responsive and console/privacy review;
- human visual QA.

## 18. Browser and visual-QA plan

Phase 10 should verify:

- authenticated list/create/open and direct-route refresh;
- empty, populated, loading, validation, safe 404, transport, rate, duplicate,
  capacity, archived, unavailable-AI, queued, processing, failed, cancelled,
  paused, stale, and completed states;
- manual question, generation, pin, notes, explanation, attempt, history,
  feedback, pagination, filters, retry, and canonical identity;
- desktop 1440, tablet 1024 and 768, mobile 390 and 320, and native 200% zoom
  where tooling permits;
- keyboard-only traversal, focus order/visibility, dialog behavior, live
  announcements, reduced motion, contrast, wrapping, and non-color status;
- zero final application console errors and no sensitive console output.

Browser automation supplements but does not replace human inspection. Phase 9
has no visible application change, so visual QA is not applicable now.

## 19. Smallest implementation sequence

1. Reconfirm active routes, schemas, outputs, and operator decisions.
2. Write failing feature-local contract tests and implement response
   validators/allowlists.
3. Correct `interviewApi` methods, token ownership, queries, bodies, and abort
   forwarding.
4. Connect session list/create/open and factual states.
5. Connect manual questions and server-preserved ordering.
6. Add generation UUID lifecycle and bounded owned-job polling.
7. Connect pinning and explicit private-note save.
8. Connect detail reveal and explanations.
9. Add explicit written-attempt recording and paginated history.
10. Add explicit feedback request, polling, and validated display.
11. Complete cancellation, stale-response, ownership, privacy, and malformed
    response coverage.
12. Run focused then complete Phase 10 test/typecheck/build gates.
13. Complete responsive, keyboard, accessibility, console, and privacy review.
14. Stop for human visual QA.
15. Complete implementation review and stop for commit authorization.

No backend expansion is automatically authorized.

## 20. Expected Phase 10 write scope

Proposed, subject to the dedicated Phase 10 prompt:

Modified planning:

- `docs/planning/CAREER_LEARNING_HUB_MASTER_PLAN.md`
- `docs/planning/CURRENT_PHASE.md`

Routing:

- `frontend/src/routing/router.tsx`
- `frontend/src/routing/router.test.tsx`

Interview feature:

- `frontend/src/features/interviews/**`

No backend or shared-package write is proposed by default.

## 21. Protected paths

Without separate Phase 10 authorization:

- `backend/**`
- `packages/**`
- `frontend/src/api/apiClient.ts`
- `frontend/src/features/auth/**`
- `frontend/src/AppShell.tsx`
- other frontend features
- package manifests and lockfiles
- environment files, migrations, assets, fonts, generated output, fixtures,
  screenshots, traces, logs, and legacy projects
- `docs/planning/DECISION_LOG.md`
- `docs/planning/PHASE_EXECUTION_TEMPLATE.md`

## 22. Explicit exclusions

- legacy source, styles, assets, prompts, config, auth, API, backend, models,
  database, packages, uploads, and provider SDK;
- session deletion, question edit/delete/reorder, attempt edit/delete, restore,
  duplication, bulk action, global search, analytics, leaderboard, sharing,
  public sessions, export, or settings;
- audio/video recording, microphone, webcam, speech-to-text, emotion analysis,
  voice scoring, transcript storage, timer, avatar, or live conversational
  interviewer;
- automatic session generation, unbounded regeneration, automatic answer
  submission, automatic feedback, free-form AI mutation, answer replacement,
  hire probability, or guaranteed outcome language;
- new router, API client, state/form/schema library, design system, backend,
  database, auth provider, or AI provider.

## 23. Backend gaps

- No general session-metadata update route; only status is mutable.
- No session delete route.
- No question edit, delete, or reorder route.
- No attempt edit or delete route.
- No audio/video/speech/timer/live-interview contract.
- No explicit status-transition matrix; any valid enum value can currently be
  assigned.
- Completed sessions are not clearly frozen from adding questions or attempts;
  archived checks are not uniform across all mutations.
- Exact configured session capacity, answer feedback limit, worker availability,
  and AI readiness require runtime verification.
- Some session and attempt controllers return Mongoose documents directly;
  frontend-safe serialization and hidden-field behavior require focused tests.
- Job retrieval returns stored `job.error`; its safe frontend subset must be
  narrowed and raw stack/payload/provider details discarded.
- Focused interview integration coverage is sparse: current security evidence
  covers cross-user session and question access but not attempts, jobs,
  feedback, pagination, cache headers, idempotency races, or workers.

Do not convert these gaps into frontend assumptions. If a required approved
journey needs a backend change, stop and request a separately bounded backend
scope.

## 24. Operator decisions

| Decision | Question | Current evidence | Recommended Phase 10 choice | Risk | Blocks? |
| --- | --- | --- | --- | --- | --- |
| Session fields | Which fields appear at creation? | Active schema supports title, resume source, role, experience, topics, gaps, job description, mode | Use title, role, experience, topics, gaps, optional job description; defer resume picker unless explicitly approved | Form complexity/private context | Yes |
| Company context | Is company a distinct field? | No active company field | Do not invent one; optional job description only | Contract drift | No |
| Experience vocabulary | Free text or fixed choices? | Backend accepts trimmed 1-100 string | Use bounded text with examples, not an unsupported enum | Inconsistent labels | No |
| Session modes | Expose all three modes? | `study`, `written-practice`, `mock-interview` persist; live mock behavior absent | Expose study and written practice initially; label mock mode unavailable unless separately approved | Misleading capability | Yes |
| Categories | Fixed or free-form? | Bounded strings, no category enum | Use bounded free text or operator-approved suggestions; send canonical strings | Fragmented filters | No |
| Generation count | Fixed or selectable? | Backend supports 1-20, default 10 | Use a bounded select with default 10 | Cost/capacity | No |
| Difficulty mix | Expose granular mix? | Optional counts must sum to total | Defer advanced mix or validate exact sum client-side | Validation complexity | No |
| Idempotency key | When is UUID reused? | Key is type+user+session+request ID | Reuse per unresolved intent; new UUID only for explicit terminal retry/new intent | Duplicate or unretryable jobs | Yes |
| Question order | Can users reorder? | Server returns pinned-first then creation order; no reorder route | Preserve server order; no reorder UI | False affordance | No |
| Session completion/archive | Which status actions appear? | Status route accepts active/completed/archived without transition matrix | Initially allow explicit complete/archive only after transition policy approval; reload canonical state | Inconsistent lifecycle | Yes |
| Deletion | Is session deletion included? | No active route | Exclude | Destructive unsupported action | No |
| Pin semantics | Optimistic or canonical? | Explicit boolean returns canonical question | Prefer pending state and canonical adoption; optional rollback only with tests | State mismatch | No |
| Notes save | Blur, debounce, or explicit? | Empty clears; max 8,000 | Explicit Save/Clear with dirty and status states | Private draft loss | No |
| Explanation visibility | When show model answer? | Study mode reveals; practice reveals after explanation | Follow exact server response; never infer hidden fields | Answer leakage | No |
| Attempt editability | Can a recorded attempt change? | Answer is immutable | No edit/delete; new attempt for another try | History integrity | Yes |
| Attempt finality | When clear the draft? | Record returns canonical attempt | Clear only after validated success; keep on failure | Answer loss | No |
| Feedback categories | Which fields display? | Score, summary, strengths, improvements, suggested outline | Display only those allowlisted stored fields | Unsupported claims | No |
| Score wording | How present 0-100? | Strict numeric score but model-generated | Label as model-generated practice guidance; no hire probability | False certainty | Yes |
| Polling | What bounded schedule? | Shared jobs exist; no interview client policy | Reuse 1/2/3/5/8-second precedent, pause at 5 minutes and after 3 transient failures | Load and stale state | Yes |
| Retry | What may retry automatically? | Generation uses caller UUID; explanation/feedback resource keys | Read polling may retry within bound; provider work only explicit; new generation UUID after terminal failure | Duplicate work/cost | Yes |
| AI unavailable | What remains usable? | Manual routes do not require AI; AI jobs do | Keep manual session/question/attempt history usable; show safe unavailable state | Misleading completion | No |
| Audio/video | Include mock media? | No active contracts | Exclude entirely | Privacy/permission/storage | No |
| Runtime validators | Where do validators live? | Shared client validates only envelope; interview API returns `unknown` | Feature-local `interviewContracts`, no new dependency | Malformed/private fields | Yes |
| DTO narrowing | Which response fields are retained? | Some controllers return documents directly | Explicit allowlists for every session/question/attempt/job/feedback shape | Owner/provider metadata leak | Yes |
| Concurrency | How handle overlapping mutations? | No version/ETag contract | Abort/sequence reads, disable duplicate writes, adopt canonical responses, reload after order/count changes | Lost/stale UI state | Yes |
| Session lifecycle | Are completed sessions mutable? | Backend clearly rejects archived adds, not all completed mutations | Treat completed as read-mostly in UI until backend policy is confirmed | Frontend/backend mismatch | Yes |

## 25. Stop conditions

Stop Phase 10 work if:

- active methods, schemas, ownership, response shapes, or job semantics differ
  from this verified map;
- a required journey needs an unapproved backend/shared/auth/client change;
- response fields cannot be safely narrowed without contract clarification;
- ownership or cross-session binding fails;
- private no-store, request ID, validation, or error normalization regresses;
- an operator-blocking decision remains unresolved;
- AI/job prerequisites are unavailable for a claim that depends on them;
- the same root failure reaches three unsuccessful code-changing attempts;
- changed paths exceed the approved Phase 10 scope;
- human visual or implementation approval has not been supplied.

## 26. Human approval gate

Phase 9 must stop with all four documentation changes unstaged and uncommitted
until the operator supplies:

`PHASE_9_LEGACY_ANALYSIS_APPROVED`

That token authorizes later Phase 9 commit review only. It does not authorize
Phase 10 implementation, backend expansion, staging, committing, or Phase 10
activation.

## 27. Proposed Phase 10 commit message

If a later dedicated Phase 10 implementation and review are approved:

`Complete Interview Coach`

The proposed Phase 9 documentation commit remains:

`Document interview legacy migration plan`
