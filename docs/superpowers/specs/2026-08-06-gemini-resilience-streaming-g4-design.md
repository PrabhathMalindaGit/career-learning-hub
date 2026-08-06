# Gemini Resilience and Progressive Polling G-4 Design

## Status and authority

- Phase ID: `GEMINI-RESILIENCE-STREAMING-G4`.
- Date: 2026-08-06.
- Governing user decision: use progress-only cancellable polling for every G-4
  workflow, including grounded Learning chat.
- Token streaming, Server-Sent Events, WebSockets, OpenRouter activation,
  provider selection, Gemini Settings, Phase 19 work, deployment, staging,
  commits, pushes, merges, and pull requests are outside scope.
- This document and all implementation changes remain unstaged for human
  review.

## Verified starting point

- Branch: `feature/multi-provider-ai-routing`.
- HEAD: `4678572a491292b0eaf417c1d1e04365c201f1a8` (`Stabilize Gemini
  Resume import and version saving`).
- Upstream: `origin/feature/multi-provider-ai-routing`, divergence `+1/-0`.
- Initial worktree: clean; no active Git operation.
- Direct provider: Gemini; local model: `gemini-3.6-flash`.
- No OpenRouter environment credential or fallback is active.
- The API process starts the background worker in-process; there is no separate
  worker command.
- Focused baseline: 65 backend tests and 105 frontend tests passed before any
  source change.

## Current architecture and root causes

The durable request path is:

`React action -> authenticated feature endpoint -> durable MongoDB job ->
embedded worker claim -> feature handler -> AI routing authorization -> shared
AI gateway -> Gemini adapter -> Zod structural validation -> feature semantic
validation -> owned domain persistence -> job completion -> bounded frontend
polling`.

The same shared path serves Resume import and analysis, Interview question
generation/explanation/feedback, and Learning summary/chat/flashcards/quiz.
Resume rewrite application and quiz submission use already validated data and
do not call Gemini.

The reliability defects are concentrated in the shared layers:

1. The gateway performs `AI_MAX_RETRIES + 1` provider calls (currently three)
   inside each worker attempt, while the durable worker can make three attempts.
   One user action can therefore cause nine Gemini calls.
2. The gateway has one undifferentiated abort timer. It cannot distinguish
   request/connection, first body data, idle response, total attempt, or worker
   deadline failures.
3. The API can cancel only queued jobs. The worker has no execution
   `AbortSignal`, active-execution identity, or persistence fence tied to user
   cancellation.
4. Worker updates rely mainly on job ID/status and a process-wide worker ID.
   A late result from an expired lease can race with cancellation or a newer
   attempt.
5. Job progress is numeric only. Polling clients cannot present a safe phase or
   distinguish retry scheduling, validation, and persistence.
6. The job error shape stores provider-derived messages and development stack
   traces. Retry eligibility is inferred from `AppError.retryable` but is not
   exposed as a normalized safe job property.
7. Several controllers already use client request IDs and unique job
   idempotency keys, but Resume import and assessment lack equivalent
   submission protection.
8. Existing feature persistence has useful job IDs, unique indexes,
   transactions, and current-job fences, but those fences are not uniformly
   tied to the currently leased execution before final writes.

## Considered approaches

### A. Enhanced polling with execution fencing — selected

Keep the existing authenticated job endpoint and bounded polling. Persist a
small monotonic job phase, add a unique execution ID to each claim, propagate a
worker-owned abort signal, and require the active execution to acquire a final
persistence fence. This changes the fewest boundaries and reuses current
ownership, idempotency, transaction, and frontend cleanup patterns.

### B. Authenticated SSE progress — rejected

SSE would require a new authenticated subscription endpoint, event cursors,
reconnect policy, server connection management, and another cross-user access
surface. It does not materially improve correctness over the existing polling
transport for these low-concurrency durable jobs.

### C. Grounded-chat token streaming — rejected

Token streaming would make provisional text visible before citation and
semantic validation. Reconnection, retry, cancellation, and late-response
races could duplicate tokens or assistant messages. It is intentionally not
implemented because it would complicate citation validation, cancellation
races, and duplicate suppression. Grounded chat remains an atomic validated
result with progressive job phases.

## Design decisions

1. **Retry owner:** the durable worker is the only retry owner.
2. **Provider attempts:** one worker attempt makes at most one Gemini provider
   attempt. The gateway has no hidden retry loop for durable work.
3. **Retry classifications:** 408, 429, transient 5xx, temporary network/DNS,
   reset, and provider timeout failures are retryable. Authentication,
   authorization, missing/unsupported model, configuration, malformed request,
   content policy, validated application input, output validation, semantic
   validation, ownership, cancellation, and lease loss are non-retryable.
   Unknown provider failures fail safely and are non-retryable unless the
   normalized boundary has positive evidence of transience.
4. **Backoff:** retain worker rescheduling with exponential delay capped at
   five minutes and bounded jitter. A waiting job is `queued` with phase
   `retry_scheduled`; it holds no lease.
5. **Timeout phases:** server configuration models connection/request headers,
   first body data, body idle, provider total, and job attempt deadlines. Safe
   defaults are 45,000 ms, 8,000 ms, 15,000 ms, 45,000 ms, and 60,000 ms
   respectively. Values are positive bounded integers; connect, first-response,
   and idle cannot exceed provider total, and the job deadline must be at least
   provider total plus 15,000 ms of local processing allowance.
6. **Non-streaming timeout constraint:** Gemini `generateContent` is retained.
   Fetch exposes response headers and body reads but not a lower-level socket
   connected event. The connection/request phase therefore ends when response
   headers arrive; first-response covers the first body chunk, idle covers
   subsequent body gaps, and total bounds the full call. No provider or product
   token stream is introduced.
7. **Cancellation propagation:** each claimed execution gets a unique
   `executionId` and one parent `AbortController`. Job deadline, worker stop,
   local cancel notification, and lease loss abort that controller. The same
   signal reaches the gateway, provider fetch, body reader, and handler
   checkpoints. Timers and listeners are always removed.
8. **Cancellation race:** the cancel transition and `beginPersistence`
   transition are competing atomic compare-and-set operations. Cancellation is
   permitted for queued work and processing phases through validation. Once an
   execution atomically enters `persisting`, Cancel is no longer offered or
   accepted; this creates a linearization point. If cancellation wins, the
   persistence fence fails and no final domain write or job completion can
   occur. If persistence wins, cancellation reports the current non-cancellable
   state and the validated atomic save completes.
9. **Retry representation:** failed jobs remain immutable. An owner-authorized
   Retry creates a new job with the same server-held type/payload and a
   `retryOfJobId`/`rootJobId` link. It compiles a fresh, non-expired routing
   snapshot through the existing authorization path and accepts only Gemini
   Direct (or the existing non-snapshot Gemini default) in G-4; it cannot
   activate or fall back to OpenRouter. The cancelled-job action also creates a
   new user-authorized job rather than reviving the cancelled job.
10. **Duplicate Retry clicks:** a unique retry idempotency key derived from the
    owner and failed/cancelled source job returns the same retry job. Further
    retries operate on the new failed job, forming an auditable chain.
11. **Token streaming:** no workflow uses token streaming.
12. **Progress delivery:** every durable G-4 workflow uses progress-only
    polling. The safe phases are `queued`, `preparing`, `contacting_provider`,
    `waiting_for_first_response`, `receiving_response`, `validating`,
    `persisting`, `retry_scheduled`, `completed`, `failed`, and `cancelled`.
13. **Transport:** existing authenticated `GET /api/v1/jobs/:jobId` polling.
    No SSE or WebSocket endpoint is added.
14. **Polling deduplication:** each mounted workflow owns at most one poll loop
    for a job. Starting a replacement loop aborts the prior loop. Navigation,
    unmount, terminal state, and user cancellation abort timers and requests.
    Polling stays bounded by current duration and transient-failure limits.
15. **Provider attempt accounting:** every provider call records exactly one
    safe attempt event containing IDs, workflow, provider/model, worker attempt,
    provider attempt `1`, duration, classification, and retry decision. It does
    not record prompts, responses, documents, answers, credentials, or headers.
16. **OpenRouter isolation:** Gemini remains the only active release provider.
    No OpenRouter credential, fallback, default, selector, or live request is
    introduced. Existing deferred code remains inactive.

## Job persistence model

The existing job document is extended non-destructively with:

- `phase`: the safe phase enum;
- `phaseSequence`: a monotonic integer used to reject backward progress;
- `executionId`: a random ID replaced on every claim;
- `cancelledAt` and a fixed safe cancellation reason code;
- `retryOfJobId` and `rootJobId` for retry lineage;
- normalized safe error fields: `classification`, `retryable`, optional
  `timeoutPhase`, safe `code`, and safe `message`.

No arbitrary cancellation text, raw provider error, stack trace, prompt,
provider body, or private user content is persisted. Existing TTL and job
idempotency indexes remain. Retry lineage and idempotency receive only the
indexes required for ownership queries and duplicate-click prevention.

Every worker mutation matches `_id`, `status: processing`, `lockedBy`,
`executionId`, and the expected attempt. `completeJob`, `failOrRetryJob`, phase
updates, heartbeat, and persistence-fence acquisition must detect a zero-match
result and raise a non-retryable lease/cancellation error rather than silently
continuing.

## Execution and persistence flow

1. A controller validates authentication, ownership, input, and request ID,
   then enqueues or returns an idempotent existing job.
2. The worker atomically claims the job, increments `attempts`, assigns a fresh
   `executionId`, and sets phase `preparing`.
3. A job-deadline controller is created. The handler receives its signal and
   lifecycle methods for safe phase reporting, active-execution assertion, and
   persistence fencing.
4. The gateway validates local inputs before any provider call, reports
   `contacting_provider`, invokes Gemini exactly once, and reports only safe
   provider phases.
5. The Gemini adapter classifies provider/network/timeout/cancellation errors
   into one provider-neutral typed boundary.
6. The gateway performs strict Zod parsing. Feature services then perform
   existing semantic, citation, ownership, and current-resource validation
   while phase is `validating`.
7. Immediately before final domain writes, the execution atomically enters
   `persisting`. Services retain their existing transactions, unique indexes,
   job IDs, and current-resource guards, augmented by an active-execution check
   in the same transaction where necessary.
8. The worker completes the same fenced execution. A late/expired execution
   cannot complete, retry, or overwrite a terminal job.
9. Retryable failure reschedules the same durable job for its next worker
   attempt. Non-retryable failure, cancellation, or exhausted attempts create a
   safe terminal state.

## Cancellation API and behavior

`POST /api/v1/jobs/:jobId/cancel` uses existing authentication, request
context, validation, and safe owned-job lookup conventions. It is idempotent
for an already-cancelled job, returns safe denial for another user's job, and
rejects completed, failed, or persisting work without changing it.

The database transition happens before the process-local abort notification.
That ordering makes cancellation durable even if a worker is on another API
instance. A local active worker aborts immediately. A remote worker observes
the lost execution fence on heartbeat or its next checkpoint; in all cases the
pre-persistence fence prevents a late response from becoming a domain result.

The UI displays a busy Cancelling state, disables duplicate clicks, and then
shows `Generation cancelled. No result was saved.` Existing successful domain
data is preserved. Cancelled jobs remain terminal; Retry creates a new job.

## Recoverable Retry API and UX

`POST /api/v1/jobs/:jobId/retry` uses only server-held job data. It requires
ownership and accepts a failed job only when its normalized error is retryable,
or a cancelled job as an explicit user restart. It never accepts completed,
queued, processing, persisting, authentication/configuration, invalid-input,
content-policy, output-validation, semantic-validation, ownership, or
lease-loss cases.

The route is limited to registered Gemini AI job types. It recompiles current
authorization for the new job and rejects any result other than Gemini Direct
or the existing direct-Gemini default, so Retry cannot become an OpenRouter
activation or fallback path.

The response returns the newly created or previously deduplicated retry job.
The original terminal job remains unchanged. Frontend controls show Retry only
when the server-provided eligibility says it is safe; busy state and a stable
per-click request prevent duplicate submissions. Refresh obtains the same job
and lineage through existing owned endpoints.

## Polling and frontend state

Existing Resume, Interview, and Learning polling contracts retain their route
and terminal statuses. They add an allowlisted phase, retry eligibility, and
retry lineage. UI wording maps internal phases to a restrained set of plain
messages such as Preparing, Contacting Gemini, Waiting for response,
Processing response, Validating, Saving, and Retrying.

Status uses a polite live region; errors use an alert; buttons remain keyboard
operable; busy controls expose `aria-busy`; progress changes are not announced
excessively. Cancel is available only before `persisting`. Retry is shown only
for server-authorized cases. Focus returns predictably to the status/action
region after failure or cancellation. No animation is required, so reduced
motion behavior is preserved.

The polling implementation uses one active controller/run token per mounted
workflow. Cleanup aborts both scheduled waits and in-flight requests. A stale
loop cannot update state after navigation, unmount, replacement by a new job,
or a newer retry action.

## Error normalization and safe observability

The provider-neutral classifications are:

- `RETRYABLE_RATE_LIMIT`;
- `RETRYABLE_PROVIDER_UNAVAILABLE`;
- `RETRYABLE_PROVIDER_TIMEOUT`;
- `RETRYABLE_NETWORK`;
- `NON_RETRYABLE_AUTHENTICATION`;
- `NON_RETRYABLE_CONFIGURATION`;
- `NON_RETRYABLE_REQUEST`;
- `NON_RETRYABLE_CONTENT_POLICY`;
- `NON_RETRYABLE_OUTPUT_VALIDATION`;
- `CANCELLED`;
- `UNKNOWN_PROVIDER_FAILURE`.

Existing public error codes are preserved where clients depend on them.
Normalized fields decide worker retry and Retry UX. Client and persisted
messages are fixed safe messages, not raw Gemini text.

Structured logs use the repository logger and redaction. Allowed fields are
event name, request/job/execution IDs, repository-approved user identifier,
workflow, provider, model, worker/provider attempt, phase, timeout phase,
classification, retryable flag, retry delay, transition, duration, and final
status. Prompts, generated bodies, document/resume text, chat questions,
interview answers, filenames, credentials, tokens, cookies, headers, database
URIs, and stack traces are prohibited.

## Test-first verification strategy

Implementation follows red-green-refactor in these slices:

1. Provider error mapping and one-attempt gateway behavior.
2. Phased timeout controller, parent cancellation, body-reader cleanup, and
   timer cleanup with fake timers.
3. Execution-ID worker fencing, retry scheduling, lease loss, cancellation,
   and late completion rejection.
4. Owned cancel/retry APIs, idempotency, lineage, request IDs, and cross-user
   safe denial.
5. Feature persistence checkpoints and duplicate-result tests across Resume,
   Interview, Learning chat, Flashcards, Quiz, and document summary.
6. Frontend contracts, single-flight polling, unmount/navigation cleanup,
   progress messages, Cancel, Retry, duplicate clicks, and accessibility.
7. Deterministic browser fixtures for temporary 503 then success, exhausted
   retry, active cancellation, late response, duplicate Retry, navigation and
   refresh recovery, ownership denial, console/network inspection, and desktop
   1440x1000, tablet 768x1024, and mobile 390x844 smoke checks.
8. Full repository typecheck, test, security, build, and diff gates.
9. At most two privacy-safe deliberate live Gemini workflows after automated
   gates: one atomic structured workflow and grounded Learning chat. Each
   successful workflow must show one job, one worker attempt, one Gemini
   attempt, one validated persisted result, no duplicates, and zero OpenRouter
   events/fallbacks.

Deterministic failure tests do not require live Gemini to produce a specific
503, timeout, or race. No test weakens authentication, ownership, validation,
or answer secrecy.

## Success criteria

- Durable worker attempt to Gemini provider attempt ratio is at most 1:1.
- Cancellation accepted before persistence prevents retry, domain persistence,
  completion, and late-result display.
- Retryable failures reschedule within bounded worker limits; non-retryable
  failures do not.
- Retry creates one owned linked job and duplicate clicks return it.
- Job phase transitions are monotonic and reveal no private/provider payload.
- Polling is bounded, single-flight per workflow, and cleaned up on replacement,
  navigation, unmount, cancellation, and terminal state.
- Every structured workflow, including grounded chat, retains atomic Zod,
  semantic/citation, ownership, idempotency, and persistence validation.
- Automated, browser, security/privacy, and controlled live Gemini checks pass
  before G-4 is reported ready for human review.
- No OpenRouter request/fallback, commit, push, merge, deployment, branch
  switch, rebase, reset, clean, stash, or staging action occurs.

## Human review gate

Visible cancellation, Retry, progress, error, desktop, tablet, and mobile
behavior requires human review before any future commit authorization.
