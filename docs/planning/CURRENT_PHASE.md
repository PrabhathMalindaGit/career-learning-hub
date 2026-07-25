# Current Execution Phase

- Phase: 10
- Name: Interview Coach Implementation
- Status: ACTIVE
- Controlling skill: `karpathy-guidelines`

## Required skills

- `karpathy-guidelines`
- `frontend-design`
- `frontend-skill`
- `build-web-apps:react-best-practices`
- `test-driven-development`
- `subagent-driven-development`
- `systematic-debugging`
- `security-best-practices`
- `playwright` only for bounded final browser verification

## Objective

- Build the approved Interview Coach inside the existing React/Vite frontend,
  Express/TypeScript API, MongoDB persistence, authenticated shell, router,
  shared API client, and durable owned-job architecture.
- Implement owned session list/create/open, manual and idempotently generated
  questions, pinning, private notes, explanations, immutable written attempts,
  paginated attempt history, explicit feedback requests, validated stored
  feedback, and factual operational states.
- Preserve ownership, privacy, response allowlisting, cancellation,
  stale-operation protection, accessibility, and responsive behavior.

## Approved features

- Owned session listing with bounded pagination and supported status filtering.
- Session creation with title, target role, bounded free-text experience,
  focus topics, skill gaps, optional job description, and `study` or
  `written-practice` mode.
- Route-owned session workspace and canonical session status.
- Manual question creation and explicit bounded AI question generation.
- Question list/detail, supported filters, server order, pin/unpin, explicit
  notes save/clear, and explicit explanations.
- Explicit immutable written attempts, newest-first paginated history, and
  read-only historical detail.
- Explicit AI feedback request and allowlisted stored feedback display.
- Loading, empty, validation, unavailable, failure, stale, paused, and
  terminal states.

## Operator decisions

- Do not expose resume selection, company, `mock-interview`, advanced
  difficulty mixes, reordering, deletion, live/spoken/video behavior, or
  unsupported outcome claims.
- Generation count is selectable from 1 through 20 and defaults to 10.
- Categories are bounded canonical strings, not a server enum.
- One UUID represents one unresolved generation intent. Reuse it only for the
  same unknown in-flight outcome; use a new UUID for a distinct intent or an
  explicit retry after terminal failure.
- Preserve server question order.
- Expose only `active → completed`, `active → archived`, and
  `completed → archived` controls.
- Active sessions are editable, completed sessions are read-mostly, and
  archived sessions are read-only in the frontend.
- Recorded attempts cannot be edited or deleted. Clear an answer draft only
  after validated canonical success.
- Numeric feedback is labelled `Model-generated practice guidance` and is not
  presented as objective evaluation, hiring prediction, or guarantee.

## Active backend contracts

- `GET|POST /api/v1/interview-sessions`
- `GET /api/v1/interview-sessions/:sessionId`
- `PATCH /api/v1/interview-sessions/:sessionId/status`
- `GET|POST /api/v1/interview-sessions/:sessionId/questions`
- `POST /api/v1/interview-sessions/:sessionId/questions/generate`
- `GET /api/v1/interview-sessions/:sessionId/questions/:questionId`
- `PATCH /api/v1/interview-sessions/:sessionId/questions/:questionId/pin`
- `PATCH /api/v1/interview-sessions/:sessionId/questions/:questionId/notes`
- `POST /api/v1/interview-sessions/:sessionId/questions/:questionId/explanation`
- `POST /api/v1/interview-sessions/:sessionId/questions/:questionId/attempts`
- `GET /api/v1/interview-sessions/:sessionId/attempts`
- `GET /api/v1/interview-sessions/:sessionId/attempts/:attemptId`
- `POST /api/v1/interview-sessions/:sessionId/attempts/:attemptId/feedback`
- `GET /api/v1/jobs/:jobId`
- Active source and tests control methods, schemas, bounds, envelopes,
  ownership, nested binding, idempotency, job types, result identities,
  errors, caching, and readiness.

## Exact write scope

Modified planning:

- `docs/planning/CAREER_LEARNING_HUB_MASTER_PLAN.md`
- `docs/planning/CURRENT_PHASE.md`

Routing:

- `frontend/src/routing/router.tsx`
- `frontend/src/routing/router.test.tsx`

Interview feature:

- `frontend/src/features/interviews/**`

No other path is authorized.

## Protected paths

- `backend/**`
- `packages/**`
- `frontend/src/api/apiClient.ts`
- `frontend/src/features/auth/**`
- `frontend/src/AppShell.tsx`
- `frontend/src/features/resumes/**`
- `frontend/src/features/dashboard/**`
- all other frontend features
- package manifests and lockfiles
- environment files, migrations, assets, fonts, generated output, fixtures,
  screenshots, traces, logs, and authentication-state files
- all legacy projects
- `docs/planning/DECISION_LOG.md`
- `docs/planning/PHASE_EXECUTION_TEMPLATE.md`

Stop for separate authorization if an approved journey requires a protected
backend, shared contract, shared client, authentication, shell, dependency, or
other path change.

## Exclusions

- Legacy access, source, styles, assets, prompts, configuration, authentication,
  API client, backend, models, database, and packages.
- Resume picker, company field, mock/live interview, deletion, question
  edit/delete/reorder, attempt edit/delete, automatic generation, automatic
  submission, automatic feedback, provider retry, free-form AI rewriting,
  answer replacement, bulk actions, global search, analytics, leaderboard,
  sharing, public sessions, exports, and interview settings.
- Microphone, audio, video, webcam, speech-to-text, emotion analysis, voice
  scoring, transcripts, timers, avatars, hiring predictions, and guaranteed
  outcomes.
- A new router, API client, state library, form library, validation dependency,
  provider SDK, component library, design system, backend, database, or auth
  provider.

## Privacy and security controls

- Treat session context, job descriptions, questions, model answers, notes,
  answer drafts, attempts, feedback, scores, jobs, UUIDs, and provider results
  as private.
- Preserve server-derived ownership, nested resource binding, safe owned 404s,
  private `no-store` caching, request IDs, memory-only access tokens, the
  HttpOnly refresh cookie, strict bodies, owned jobs, idempotency, rate limits,
  and AI output validation.
- Send no user ID and no provider, model, prompt, raw payload, stack, storage,
  fingerprint, or unknown persistence field.
- Validate and allowlist every external response before React receives it.
- Use React text escaping only; render no raw HTML or Markdown.
- Persist no tokens, drafts, notes, attempts, jobs, or interview content in
  `localStorage`, `sessionStorage`, or IndexedDB.
- Log no private content, tokens, cookies, raw responses, or provider errors.

## Polling and retry policy

- Poll after 1, 2, 3, and 5 seconds, then every 8 seconds.
- Pause after five minutes from enqueue or three consecutive transient polling
  failures.
- Stop on completed, failed, cancelled, unmount, route/resource change, auth
  failure, owned 404, malformed response, wrong job type, or completed-result
  identity mismatch.
- A client timeout pauses polling; it does not fail or cancel the backend job.
- Polling reads may retry within the bound. Provider work never retries
  automatically.
- Job IDs and generation UUIDs remain in component memory.

## Runtime validation requirements

- Feature-local validators under `frontend/src/features/interviews/` accept
  external values as `unknown`.
- Validate envelopes, identifiers, enums, timestamps, booleans, numeric bounds,
  pagination, route/nested identities, job type/status/progress/results, and
  feedback score bounds.
- Narrow session summary/detail, question summary/detail, attempt
  summary/detail, feedback, job, pagination, create, explanation, and feedback
  request responses through explicit allowlists.
- Use `AbortController`, route/resource identity checks, monotonic request
  sequencing where needed, duplicate-write disabling, canonical response
  adoption, and canonical reload after count/order/status mutations.

## Browser-use limit

- Do not use a browser during inspection, contract analysis, static
  implementation, focused test development, type checking, or build
  verification.
- After focused and complete frontend tests, typechecks, and production build
  pass, use one authenticated browser session for bounded critical journeys
  and responsive checks.
- Capture only a representative populated view or evidence needed to diagnose a
  visible failure.

## Test matrix

- Contracts: exact methods, paths, queries, bodies, omission, bounds, abort,
  envelopes, request IDs, allowlists, malformed responses, identity, job
  semantics, score bounds, and internal-field stripping.
- Sessions: loading, empty, list, pagination, filtering, creation, validation,
  duplicate writes, canonical navigation, direct routes, cancellation, stale
  response, safe 404, status transitions, and lifecycle policy.
- Questions: manual creation, generation UUID lifecycle, polling bounds,
  ordering, pagination, filters, pinning, notes, explanations, unavailable AI,
  and stale selection.
- Attempts and feedback: private draft, validation, immutable record, draft
  preservation, history/detail binding, explicit feedback, job states,
  qualified wording, and stale protection.
- Security, privacy, accessibility, and responsive behavior: ownership
  boundaries, strict bodies, no persistence/logging, headings, labels,
  descriptions, focused summary, keyboard behavior, announcements, pagination,
  focus visibility, reduced motion, and narrow reflow.
- Run focused tests first, then the complete Interview Coach/router and frontend
  suites, frontend and root typechecks, backend unit/integration/security/full
  suites, production build, dependency tree, and `git diff --check`.

## Runtime prerequisites

- Local MongoDB replica set `rs0` with a writable primary and
  `career_learning_hub` database.
- Backend on port 8000 and frontend on port 5173.
- Local job worker enabled.
- Safely verify database, storage, jobs, backend health, and configured or
  unconfigured AI readiness without printing environment values or secrets.
- Use only clearly marked synthetic `.test` users and synthetic interview data.

## Human visual-QA gate

- Keep one synthetic populated Interview Coach available where prerequisites
  permit.
- Provide the exact local URL, any login step, AI readiness, unverified runtime
  paths, and a concise inspection checklist for desktop, tablet, 768, 390, 320,
  native 200% zoom, all creation fields, list/workspace, questions, pin, notes,
  attempts, history, feedback wording, unavailable AI, lifecycle rules,
  keyboard focus, announcements, dialogs, overflow, errors, and retry states.
- Stop for the exact token: `PHASE_10_VISUAL_QA_APPROVED`.

## Implementation-review gate

- After visual approval, review contracts, identity, DTO allowlists, stale
  cleanup, idempotency, polling, retry, ownership, privacy, accessibility,
  responsiveness, tests, Git scope, artifacts, secrets, and dependencies.
- Any visible correction refreshes the visual gate.
- Stop for the exact token: `PHASE_10_IMPLEMENTATION_REVIEW_APPROVED`.

## Git and next-phase controls

- Do not switch branches, stage, commit, push, merge, rebase, cherry-pick,
  reset, or rewrite history during implementation.
- Keep all work unstaged and uncommitted.
- Do not activate Phase 11 automatically.
- Phases 11 through 21 remain `PLANNED`.
