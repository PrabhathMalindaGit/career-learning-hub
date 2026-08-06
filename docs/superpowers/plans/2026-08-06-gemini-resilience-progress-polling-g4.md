# Gemini Resilience and Progress Polling G-4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Subagent execution is not authorized for this task.

**Goal:** Remove Gemini retry amplification and add phased timeouts, execution-fenced cancellation, idempotent linked Retry, safe progressive polling, and duplicate/late-result protection across every durable AI workflow.

**Architecture:** The embedded durable worker becomes the sole retry owner and gives every claim a unique execution fence plus one parent abort signal. The existing authenticated job polling transport gains monotonic safe phases, cancellation and retry endpoints, while all structured domain results remain fully buffered, validated, fenced, and atomically persisted.

**Tech Stack:** Node.js 20+, strict TypeScript 5.8, Express 5, Mongoose 8/MongoDB transactions, Zod 3, React 19, Vite 6, Vitest, Testing Library, and the repository-authorized bundled Playwright runtime.

## Global Constraints

- Provider is Gemini Direct only with configured model `gemini-3.6-flash`.
- Do not activate, call, configure, or fall back to OpenRouter or any other provider.
- Use progress-only cancellable polling. Do not implement token streaming, SSE, or WebSockets.
- The durable worker is the sole retry owner; one worker attempt makes at most one Gemini provider attempt.
- Preserve existing routes and DTOs where compatible; additions must be allowlisted and backward-compatible.
- Invalid application input is non-retryable. Validated application input is not an error category.
- Preserve authentication, safe cross-user 404 behavior, ownership fences, answer secrecy, strict Zod validation, feature semantic validation, and atomic domain persistence.
- Do not log or persist prompts, provider bodies, Resume/document text, chat questions, interview answers, credentials, headers, cookies, filenames, or stack traces.
- Keep timeout defaults configurable and range-validated. Begin with connect 45,000 ms, first body 8,000 ms, idle 15,000 ms, provider total 45,000 ms, and job attempt 60,000 ms. Verify the 8-second first-body default against successful Gemini calls and adjust only with test or runtime evidence.
- Cross-instance cancellation and lease loss must actively abort an in-flight provider request when heartbeat detects a lost execution fence; persistence rejection alone is insufficient.
- Do not stage, commit, push, merge, deploy, switch branches, rebase, reset, clean, stash, implement Gemini Settings, or begin Phase 19.
- Apply at most three code-changing repair attempts to one root failure.

---

## File responsibility map

- `backend/src/config/env.ts`: range-validated timeout configuration and cross-field invariants.
- `backend/src/modules/ai/providers/provider.types.ts`: provider-neutral classifications, timeout phases, request lifecycle hooks, and normalized provider errors.
- `backend/src/modules/ai/providers/providerTimeouts.ts`: composed abort signals, phased timers, response-body reading, and cleanup.
- `backend/src/modules/ai/providers/gemini.provider.ts`: exactly one Gemini call, safe status mapping, and non-streaming phased response consumption.
- `backend/src/modules/ai/aiGateway.service.ts`: no hidden retry loop, provider-attempt accounting, parent signal propagation, strict output validation, and safe errors.
- `backend/src/jobs/job.model.ts`: non-destructive phase, execution fence, cancellation, retry lineage, and normalized error fields.
- `backend/src/jobs/job.execution.ts`: process-local active execution registry and abort notification.
- `backend/src/jobs/job.registry.ts`: extended execution context contract.
- `backend/src/jobs/job.queue.ts`: fenced claims/mutations, monotonic phase updates, cancellation linearization, linked Retry, retry scheduling, and safe terminalization.
- `backend/src/jobs/job.worker.ts`: job deadline, heartbeat-triggered active abort, checkpoints, and fenced completion.
- `backend/src/jobs/job.controller.ts`, `job.routes.ts`, `job.schemas.ts`: owned polling/cancel/retry API surface.
- Resume, Interview, and Learning job/service/controller files: lifecycle propagation, final persistence checkpoints, and missing submission idempotency.
- `frontend/src/features/jobs/`: shared safe phase parsing/presentation, cancel/retry API calls, and single-flight polling lifecycle.
- Existing Resume, Interview, and Learning polling/API/contracts/workspaces: adopt the shared lifecycle while preserving domain result validation.
- Focused backend/frontend/browser tests: prove retry ratio, timeout phases, cancellation races, ownership, duplicate prevention, cleanup, responsive behavior, and privacy.

---

### Task 1: Normalize provider failures and validate timeout configuration

**Files:**
- Modify: `backend/src/config/env.ts`
- Modify: `backend/src/tests/globalSetup.ts`
- Modify: `backend/src/modules/ai/providers/provider.types.ts`
- Create: `backend/src/modules/ai/providers/providerTimeouts.ts`
- Create: `backend/src/tests/unit/providerResilience.test.ts`

**Interfaces:**
- Produce `AiProviderFailureClassification`, `AiTimeoutPhase`, `ProviderTimeoutProfile`, and an extended `AiProviderError` with fixed safe fields.
- Produce `readProviderResponseBody(response, input)` and `composeProviderSignal(input)` helpers that always clean up timers/listeners/readers.

- [ ] **Step 1: Write failing configuration and timeout-helper tests**

Add tests that isolate module loading and fake timers to assert:

```ts
expect(env.GEMINI_CONNECT_TIMEOUT_MS).toBe(45_000);
expect(env.GEMINI_FIRST_RESPONSE_TIMEOUT_MS).toBe(8_000);
expect(env.GEMINI_IDLE_TIMEOUT_MS).toBe(15_000);
expect(env.GEMINI_TOTAL_TIMEOUT_MS).toBe(45_000);
expect(env.AI_JOB_ATTEMPT_TIMEOUT_MS).toBe(60_000);
```

Invalid zero, overflow, phase-greater-than-total, and job-deadline-less-than-total-plus-15,000 configurations must fail environment parsing without printing values. Fake-timer tests must distinguish `connection`, `first_response`, `idle`, and `total`, verify parent abort maps to `cancelled`, and verify all timers/listeners are cleared after success and failure.

- [ ] **Step 2: Verify the new tests fail for missing types/configuration**

Run:

```bash
npm run test --workspace @career-learning-hub/api -- src/tests/unit/providerResilience.test.ts
```

Expected: FAIL because the timeout fields/helper module and normalized classifications do not exist.

- [ ] **Step 3: Add the minimal provider-neutral contracts and configuration**

Define:

```ts
export const aiProviderFailureClassifications = [
  "RETRYABLE_RATE_LIMIT",
  "RETRYABLE_PROVIDER_UNAVAILABLE",
  "RETRYABLE_PROVIDER_TIMEOUT",
  "RETRYABLE_NETWORK",
  "NON_RETRYABLE_AUTHENTICATION",
  "NON_RETRYABLE_CONFIGURATION",
  "NON_RETRYABLE_REQUEST",
  "NON_RETRYABLE_CONTENT_POLICY",
  "NON_RETRYABLE_OUTPUT_VALIDATION",
  "CANCELLED",
  "UNKNOWN_PROVIDER_FAILURE",
] as const;

export type AiTimeoutPhase =
  | "connection"
  | "first_response"
  | "idle"
  | "total"
  | "job_attempt";

export interface ProviderTimeoutProfile {
  connectMs: number;
  firstResponseMs: number;
  idleMs: number;
  totalMs: number;
}
```

Extend `ProviderStructuredRequest` with `timeouts`, `signal`, and optional `onPhase(phase)`; extend `AiProviderError` with `classification`, optional `timeoutPhase`, and a fixed safe client message. Implement the timeout helpers with one parent controller, phase-specific abort reasons, body-size bounding, reader cancellation, and `finally` cleanup.

- [ ] **Step 4: Run the focused tests to green**

Run the Task 1 command again. Expected: PASS with no warnings or leaked timers.

---

### Task 2: Make one gateway call equal one Gemini provider attempt

**Files:**
- Modify: `backend/src/modules/ai/providers/gemini.provider.ts`
- Modify: `backend/src/modules/ai/aiGateway.service.ts`
- Modify: `backend/src/tests/unit/geminiStructuredOutput.test.ts`
- Modify: `backend/src/tests/integration/aiRetryAndPersistence.integration.test.ts`
- Modify: `backend/src/tests/unit/loggerRedaction.test.ts`

**Interfaces:**
- `generateStructuredOutput(input)` gains optional `signal` and `reportPhase` but keeps its existing schema/result contract.
- One invocation of `generateStructuredOutput` produces zero provider calls for invalid application input and at most one provider call otherwise.

- [ ] **Step 1: Replace the existing gateway-retry expectation with failing one-attempt tests**

Assert a single 503 fetch response causes one fetch call and one normalized retryable failure. Add status mapping cases for 400, 401, 403, 404/model missing, 408, 409, 429, 500, 502, 503, 504, network/reset, cancellation, every timeout phase, malformed JSON, empty output, schema-invalid output, content policy, and unknown errors. Explicitly assert invalid application input and canonical semantic validation do not trigger another Gemini call.

- [ ] **Step 2: Verify red tests prove retry amplification still exists**

Run:

```bash
npm run test --workspace @career-learning-hub/api -- src/tests/unit/geminiStructuredOutput.test.ts src/tests/integration/aiRetryAndPersistence.integration.test.ts
```

Expected: FAIL because a transient response currently invokes fetch up to three times.

- [ ] **Step 3: Remove `executeWithRetry` and implement exactly one provider call**

The gateway must call `provider.generateStructured` once, pass its parent signal and selected timeout profile, record `providerAttempt: 1`, perform strict Zod validation, and expose only normalized safe `AppError` data. The Gemini adapter must consume the non-streaming response through `providerTimeouts.ts`, map raw failures without preserving raw messages, and never retry.

- [ ] **Step 4: Verify one-attempt behavior, accounting, and redaction**

Run:

```bash
npm run test --workspace @career-learning-hub/api -- src/tests/unit/providerResilience.test.ts src/tests/unit/geminiStructuredOutput.test.ts src/tests/integration/aiRetryAndPersistence.integration.test.ts src/tests/unit/loggerRedaction.test.ts
```

Expected: PASS; each attempted Gemini call creates one safe provider-attempt record and no sensitive fixture text appears in serialized logs/errors.

---

### Task 3: Add execution-fenced worker phases, deadlines, and active aborts

**Files:**
- Modify: `backend/src/jobs/job.model.ts`
- Create: `backend/src/jobs/job.execution.ts`
- Modify: `backend/src/jobs/job.registry.ts`
- Modify: `backend/src/jobs/job.queue.ts`
- Modify: `backend/src/jobs/job.worker.ts`
- Create: `backend/src/tests/integration/jobExecutionFence.integration.test.ts`

**Interfaces:**
- `JobExecutionContext` gains `executionId`, `signal`, `reportPhase(phase)`, `assertActive()`, and `beginPersistence()`.
- Every claimed job receives a fresh UUID `executionId`.
- Every processing mutation consumes `{ jobId, executionId, attempt }` and rejects a zero-match result with non-retryable `JOB_EXECUTION_FENCE_LOST`.

- [ ] **Step 1: Write failing fence and retry-ratio tests**

Cover fresh execution IDs, monotonic phases, stale phase rejection, heartbeat fence loss, job-deadline abort, worker-stop abort, retry rescheduling without a lease, safe error persistence, and terminal completion guarded by the exact execution. Inject two retryable failures followed by success and assert:

```ts
expect(providerAttempts).toBe(3);
expect(claimedWorkerAttempts).toBe(3);
expect(providerAttempts).toBe(claimedWorkerAttempts);
```

- [ ] **Step 2: Write the three mandatory cancellation linearization tests**

Use controlled deferred promises and real Mongo transactions to prove:

```ts
// cancel wins before persisting
expect(cancelledJob.status).toBe("cancelled");
expect(domainWriteCount).toBe(0);
await expect(lateComplete).rejects.toMatchObject({ code: "JOB_EXECUTION_FENCE_LOST" });

// persisting wins first
expect(cancelResponse.status).toBe(409);
expect(domainWriteCount).toBe(1);
expect(completedJob.status).toBe("completed");

// expired execution cannot complete
await expect(completeWithOldExecution()).rejects.toMatchObject({
  code: "JOB_EXECUTION_FENCE_LOST",
});
```

Also prove a heartbeat zero-match actively aborts the same `AbortSignal` observed by the deferred provider call before that provider promise resolves.

- [ ] **Step 3: Verify tests fail against the current worker**

Run:

```bash
npm run test --workspace @career-learning-hub/api -- src/tests/integration/jobExecutionFence.integration.test.ts
```

Expected: FAIL because execution IDs, phases, parent signals, and fenced mutations do not exist.

- [ ] **Step 4: Implement the minimal execution registry and fenced queue operations**

Use a process-local `Map<string, { executionId: string; controller: AbortController }>` only to accelerate local aborts. Database status/execution ID remains authoritative. `heartbeatJob` returns failure by throwing; the heartbeat catch calls `abortActiveJobExecution(jobId, executionId, "lease_lost")`. Cross-instance cancellation changes the database fence; the next heartbeat detects zero match and actively aborts the in-flight request. `beginPersistence` atomically advances to `persisting`; cancellation excludes that phase.

- [ ] **Step 5: Implement job attempt deadline and cleanup**

Create one deadline timer per attempt using `AI_JOB_ATTEMPT_TIMEOUT_MS`; abort with `job_attempt`, clear heartbeat/deadline timers in `finally`, unregister the execution, and make cancellation/lease-loss/job-deadline non-retryable except normalized provider timeouts, which remain worker-retryable.

- [ ] **Step 6: Run the Task 3 suite to green**

Run the Task 3 command again. Expected: PASS with explicit evidence that heartbeat fence loss aborts the provider signal and total provider attempts equal total worker attempts.

---

### Task 4: Add owned idempotent cancellation and linked Retry APIs

**Files:**
- Modify: `backend/src/jobs/job.controller.ts`
- Modify: `backend/src/jobs/job.routes.ts`
- Modify: `backend/src/jobs/job.schemas.ts`
- Modify: `backend/src/jobs/job.queue.ts`
- Modify: `backend/src/tests/integration/jobResponse.integration.test.ts`
- Modify: `backend/src/tests/security/idor.security.test.ts`

**Interfaces:**
- `POST /api/v1/jobs/:jobId/cancel` returns an owned safe job envelope.
- `POST /api/v1/jobs/:jobId/retry` returns `202` with the new or deduplicated linked job.
- `retryOfJobId`, `rootJobId`, and `canRetry` are allowlisted polling fields; payload and routing material never leave the server.

- [ ] **Step 1: Write failing API and security tests**

Cover queued/processing cancel, repeat cancel idempotency, completed/failed/persisting rejection, safe cross-user 404, request-ID preservation, cancelled refresh state, retryable 429/503/timeout eligibility, non-retryable auth/config/input/output/semantic denial, cancelled restart, duplicate Retry clicks, original terminal immutability, correct owner/lineage, and Gemini-only routing enforcement.

- [ ] **Step 2: Verify red API tests**

Run:

```bash
npm run test --workspace @career-learning-hub/api -- src/tests/integration/jobResponse.integration.test.ts src/tests/security/idor.security.test.ts
```

Expected: FAIL with missing POST routes and response fields.

- [ ] **Step 3: Implement atomic owned transitions and retry creation**

Cancel uses one owner/status/phase compare-and-set and then calls the local abort registry. Retry reads only the owned terminal source job, allowlists registered Gemini AI job types, copies only server-held type/payload/priority/max attempts, recompiles a fresh Gemini-direct authorization, sets lineage, and enqueues with `job-retry:<userId>:<sourceJobId>` idempotency. It never changes the source job.

- [ ] **Step 4: Run API and security tests to green**

Run the Task 4 command again. Expected: PASS with safe cross-user denial and no provider/payload leakage.

---

### Task 5: Fence domain persistence and close submission idempotency gaps

**Files:**
- Modify: `backend/src/modules/resume-analysis/resumeAnalysis.jobs.ts`
- Modify: `backend/src/modules/resume-analysis/resumeAnalysis.service.ts`
- Modify: `backend/src/modules/resume-analysis/resumeAnalysis.controller.ts`
- Modify: `backend/src/modules/resume-analysis/resumeAnalysis.schemas.ts`
- Modify: `backend/src/modules/resume-analysis/resumeParsing.service.ts`
- Modify: `backend/src/modules/interviews/interview.jobs.ts`
- Modify: `backend/src/modules/interviews/interviewAi.service.ts`
- Modify: `backend/src/modules/learning/learning.jobs.ts`
- Modify: `backend/src/modules/learning/documentProcessing.service.ts`
- Modify: `backend/src/modules/learning/learningChat.service.ts`
- Modify: `backend/src/modules/learning/learningAssessment.service.ts`
- Modify: `backend/src/tests/integration/aiRetryAndPersistence.integration.test.ts`
- Modify: `backend/src/tests/integration/resumePdfImport.integration.test.ts`
- Modify: `backend/src/tests/integration/resumeVersionPersistence.integration.test.ts`

**Interfaces:**
- AI services receive the exact `JobExecutionContext` or a narrowed `{ signal, reportPhase, assertActive, beginPersistence }` lifecycle.
- Resume import and analysis accept a client `requestId` and use owner-scoped idempotency keys.

- [ ] **Step 1: Add failing duplicate/late-result tests per workflow**

For Resume import/analysis, Interview generation/explanation/feedback, Learning summary/chat/flashcards/quiz, prove double submission yields one job, worker retry/restart yields at most one domain result, cancellation before persistence yields none, old lease cannot save, and successful retry yields one result without corrupting current Resume version/session/document/conversation/card set/quiz.

- [ ] **Step 2: Verify focused persistence tests fail at the missing fence**

Run:

```bash
npm run test --workspace @career-learning-hub/api -- src/tests/integration/aiRetryAndPersistence.integration.test.ts src/tests/integration/resumePdfImport.integration.test.ts src/tests/integration/resumeVersionPersistence.integration.test.ts src/tests/integration/jobExecutionFence.integration.test.ts
```

Expected: FAIL because services cannot receive the execution lifecycle and Resume submissions lack request idempotency.

- [ ] **Step 3: Propagate lifecycle checkpoints surgically**

Handlers report `preparing`; the gateway reports provider phases; services report `validating`, retain all existing semantic/ownership checks, call `assertActive`, then call `beginPersistence` immediately before final domain transactions/writes. Where persistence already uses a transaction, assert the exact job execution fence in that transaction. Existing job IDs, unique indexes, fingerprints, and current-resource filters remain intact.

- [ ] **Step 4: Add Resume request IDs without breaking existing response DTOs**

Require UUID request IDs in the assessment JSON body and PDF multipart form, add frontend generation later in Task 7, and enqueue with keys scoped by workflow, owner, resource, and request ID. Invalid request IDs fail before asset/provider work.

- [ ] **Step 5: Run focused persistence tests to green**

Run the Task 5 command again. Expected: PASS; no duplicate domain or activity record is created and cancelled/expired executions persist nothing.

---

### Task 6: Add shared frontend job resilience contracts and single-flight polling

**Required skills before implementation:** `modern-web-guidance`, `vercel-react-best-practices`.

**Files:**
- Create: `frontend/src/features/jobs/jobResilience.ts`
- Create: `frontend/src/features/jobs/jobResilience.test.ts`
- Create: `frontend/src/features/jobs/JobResilienceActions.tsx`
- Create: `frontend/src/features/jobs/JobResilienceActions.test.tsx`
- Modify: `frontend/src/api/apiClient.ts`
- Modify: `frontend/src/features/resumes/resumeContracts.ts`
- Modify: `frontend/src/features/resumes/resumePolling.ts`
- Modify: `frontend/src/features/interviews/interviewContracts.ts`
- Modify: `frontend/src/features/interviews/interviewPolling.ts`
- Modify: `frontend/src/features/learning/learningContracts.ts`
- Modify: `frontend/src/features/learning/learningQuizContracts.ts`
- Modify: `frontend/src/features/learning/learningPolling.ts`

**Interfaces:**
- `SafeJobPhase`, `RetryEligibility`, `cancelJob(jobId, signal)`, and `retryJob(jobId, signal)`.
- `createSingleFlightJobPoller()` aborts a prior run before starting the next and exposes `stop()` for unmount/navigation.
- `JobResilienceActions` renders phase, accessible status, Cancel, Retry, and busy states without owning domain data.

- [ ] **Step 1: Write failing parser, polling, cleanup, and accessibility tests**

Allow only the approved phase enum and normalized job fields. Reject provider/model/payload/routing/error extras. Prove replacement aborts the old wait and request, terminal/cancel/unmount stops polling, stale callbacks cannot update, duplicate Cancel/Retry clicks call the API once, status uses `role=status`, errors use `role=alert`, and busy buttons expose `aria-busy`.

- [ ] **Step 2: Verify frontend tests fail before implementation**

Run:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/jobs/jobResilience.test.ts src/features/jobs/JobResilienceActions.test.tsx src/features/resumes/resumePolling.test.ts src/features/interviews/interviewPolling.test.ts src/features/learning/learningPolling.test.ts
```

Expected: FAIL because the shared job resilience module does not exist.

- [ ] **Step 3: Implement strict shared parsing, API actions, and single-flight lifecycle**

Keep access tokens in the existing in-memory API client. Use authenticated POST requests with request IDs and abort signals. Map phases to `Queued`, `Preparing`, `Contacting Gemini`, `Waiting for response`, `Processing response`, `Validating`, `Saving`, `Retrying`, and terminal wording. Do not expose timeout values or raw provider data.

- [ ] **Step 4: Adapt existing domain pollers without changing result validation**

Reuse the shared bounded loop while preserving each domain's job ID/type/result identity checks, five-minute cap, transient-failure limit, and existing typed terminal result.

- [ ] **Step 5: Run the Task 6 frontend tests to green**

Run the Task 6 command again. Expected: PASS with no act warnings or state updates after unmount.

---

### Task 7: Integrate Cancel, Retry, and safe phases into every workflow

**Files:**
- Modify: `frontend/src/features/resumes/resumeApi.ts`
- Modify: `frontend/src/features/resumes/ResumeListPage.tsx`
- Modify: `frontend/src/features/resumes/ResumeWorkspace.tsx`
- Modify: `frontend/src/features/resumes/ResumeListPage.test.tsx`
- Modify: `frontend/src/features/resumes/ResumeWorkspace.test.tsx`
- Modify: `frontend/src/features/interviews/interviewApi.ts`
- Modify: `frontend/src/features/interviews/InterviewSessionWorkspace.tsx`
- Modify: `frontend/src/features/interviews/InterviewSessionWorkspace.test.tsx`
- Modify: `frontend/src/features/learning/learningApi.ts`
- Modify: `frontend/src/features/learning/LearningGenerationJobStatus.tsx`
- Modify: `frontend/src/features/learning/LearningConversationWorkspace.tsx`
- Modify: `frontend/src/features/learning/DocumentFlashcards.tsx`
- Modify: `frontend/src/features/learning/DocumentQuizzes.tsx`
- Modify: corresponding existing Learning component tests
- Modify only if needed: existing feature CSS files for responsive action layout

**Interfaces:**
- Each active job view retains its existing domain data and adopts `JobResilienceActions`.
- Resume requests generate a stable UUID once per deliberate submission and reuse it for any transport retry.

- [ ] **Step 1: Write failing workflow UI tests**

For every workflow, test safe phase wording, eligible Cancel, cancelling busy state, terminal Cancelled wording, Retry only when `canRetry`, retry busy state, duplicate-click prevention, new retry job polling, refresh recovery, preserved prior successful data, and no late result rendering after cancellation. Include keyboard focus behavior and unmount cleanup.

- [ ] **Step 2: Verify the workflow tests fail on missing actions/phases**

Run the focused Resume, Interview, and Learning component test files named above. Expected: FAIL for missing Cancel/Retry/progress behavior.

- [ ] **Step 3: Implement the minimal shared UI integration**

Add the shared status/actions at existing job-status locations. Maintain one controller per active job, abort it before replacement, and ignore stale run IDs. Disable Cancel at `persisting`; accept server 409 as a refreshed non-cancellable state. Retry replaces only the active job reference and never mutates the original terminal job/result.

- [ ] **Step 4: Add only necessary responsive styles**

Use existing button, status surface, spacing, focus-visible, and reduced-motion conventions. At 390 px and 768 px widths, actions wrap without horizontal overflow and remain reachable. Do not redesign feature layouts.

- [ ] **Step 5: Run focused workflow tests to green**

Run all modified Resume, Interview, and Learning component/polling/contract tests. Expected: PASS with no console or accessibility warnings.

---

### Task 8: Complete backend reliability, security, and privacy coverage

**Files:**
- Modify: `backend/src/tests/integration/aiRetryAndPersistence.integration.test.ts`
- Modify: `backend/src/tests/integration/jobResponse.integration.test.ts`
- Modify: `backend/src/tests/security/idor.security.test.ts`
- Modify: `backend/src/tests/unit/loggerRedaction.test.ts`
- Create or modify only as needed: deterministic failure-injection test helpers under `backend/src/tests/helpers/`

**Interfaces:**
- Tests use controlled adapters/deferred promises and synthetic content; live Gemini is not used for deterministic 429/503/timeout/race behavior.

- [ ] **Step 1: Add the remaining failure matrix as failing tests**

Cover retry limit, jitter bounds, cancellation during retry wait, worker restart after provider response, two-worker claim race, browser-style repeated GET, duplicate Retry, safe error persistence, no stack/raw provider body, no prompt/document/answer log content, and zero OpenRouter fetches/fallbacks.

- [ ] **Step 2: Run focused backend, security, and redaction tests**

Run all provider, gateway, fence, job API, persistence, IDOR, and logger tests. Fix only confirmed gaps, one hypothesis at a time, keeping each red-green cycle recorded.

- [ ] **Step 3: Run backend typechecks and focused domain suites**

Run:

```bash
npm run typecheck --workspace @career-learning-hub/api
npm run typecheck:test --workspace @career-learning-hub/api
npm run test --workspace @career-learning-hub/api -- src/tests/unit src/tests/integration/aiRetryAndPersistence.integration.test.ts src/tests/integration/jobResponse.integration.test.ts src/tests/integration/resumePdfImport.integration.test.ts src/tests/integration/resumeVersionPersistence.integration.test.ts src/tests/integration/learningDocumentDeletionConcurrency.integration.test.ts src/tests/security/idor.security.test.ts
```

Expected: all commands exit 0; exact file/test counts are recorded from output.

---

### Task 9: Add and run focused browser resilience verification

**Required skill before implementation/execution:** `playwright`.

**Files:**
- Create: `tests/browser/specs/ai-resilience.spec.cjs`
- Modify only when necessary: `tests/browser/support/fixtures.cjs`
- Modify only when necessary: `tests/browser/support/services.cjs`

**Interfaces:**
- Browser failure injection is deterministic, dev/test-only, synthetic, and cannot be enabled in production.
- Browser tests inspect request counts, console output, aborted requests, navigation cleanup, and responsive layout.

- [ ] **Step 1: Write browser cases for the approved matrix**

Cover temporary 503 then worker retry success, retry limit, active cancellation, late provider response, eligible Retry, duplicate Retry click, progress ordering, navigation away/return, refresh recovery, cross-user job denial, and no duplicate polling/job/result. Assert grounded chat shows phases but never provisional tokens.

- [ ] **Step 2: Run desktop focused browser checks**

Use the repository-authorized bundled Playwright runtime and `tests/browser/playwright.config.cjs`. Expected: all focused cases pass at desktop with zero unexpected console errors/warnings and exact expected POST/GET counts.

- [ ] **Step 3: Run tablet and mobile smoke checks**

Verify 768x1024 and 390x844: readable status, reachable Cancel/Retry, visible focus, usable targets, no horizontal overflow, no blocking layout jumps, clean console, and stopped polling after navigation/cancellation.

- [ ] **Step 4: Preserve evidence and report the human visual gate**

Save privacy-safe screenshots outside Git under a new exact `/private/tmp/career-learning-hub-g4-*` evidence directory. Start the local frontend/backend and provide the local URL plus inspection checklist for human review. Do not commit.

---

### Task 10: Run full regression, two live Gemini workflows, and final review

**Files:**
- Modify: `docs/superpowers/specs/2026-08-06-gemini-resilience-streaming-g4-design.md` only if runtime evidence changes the documented 8-second first-body default.
- Create: a phase report under `docs/planning/` only when all evidence is available.

- [ ] **Step 1: Run full repository gates**

Run and record exit codes/counts/warnings/file effects for:

```bash
git diff --check
npm run typecheck
npm run typecheck:tests
npm run test --workspace @career-learning-hub/web
npm run test
npm run test:security
npm run build
```

Use repository-authoritative equivalents only if inspection proves a command differs. Do not claim an unrun gate passed.

- [ ] **Step 2: Run at most two controlled live Gemini workflows**

Use synthetic private-safe data for one atomic structured workflow and grounded Learning chat. For each, record one deliberate action, job ID, worker attempts, Gemini provider attempts, phase order, validation/persistence outcome, duplicates, and OpenRouter event/fallback count. Expected normal ratio: `1 worker attempt : 1 provider attempt`.

- [ ] **Step 3: Verify the 8-second first-body default with live evidence**

Record first-body observations from the two successful calls. Keep 8,000 ms if both calls fit with safe margin. Change the default and its range/config tests only if a successful normal call demonstrates it is too aggressive; document the exact evidence and retain the smallest safe adjustment.

- [ ] **Step 4: Perform security/privacy and diff review**

Inspect ownership for cancel/retry/polling, terminal transitions, log/error fields, credential/private-content scans, OpenRouter isolation, changed-file secrets/generated output, `git status --short`, `git diff --stat`, and the complete scoped diff. Confirm staged files are empty.

- [ ] **Step 5: Produce the required G-4 report and stop at human review**

Report preflight, architecture, decisions, every changed file, retry/timeout/cancel/retry/polling/duplicate/error/log behavior, exact automated/browser/live results, remaining risks, unstaged worktree, no Git/cloud actions, proposed subject `Harden Gemini job resilience and progress delivery`, local URL/checklist, and the required visual approval gate. Finish with `G4_READY_FOR_HUMAN_REVIEW` only if every applicable technical gate passes; otherwise finish with `G4_BLOCKED`.
