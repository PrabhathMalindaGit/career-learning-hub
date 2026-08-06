# AI-1 / AI-1R — Direct Gemini Baseline and Structured-Output Repair

- Prompt IDs: `CLH-AI-1-GEMINI-BASELINE`,
  `CLH-AI-1-LIVE-GEMINI-CONTINUATION`,
  `CLH-AI-1R-GEMINI-STRUCTURED-OUTPUT-REPAIR`
- Date: 2026-08-03
- Branch: `feature/multi-provider-ai-routing`
- Starting commit: `54aacb62bb1371fa16d32c3311c07dfa7bdbcbab`
- Scope: verify and narrowly repair the existing direct-Gemini structured-output
  contract; no multi-provider implementation
- Status: `COMPLETE — SIX LIVE GEMINI CAPABILITIES COMPLETED; PROVIDER-BACKED
  BROWSER FLOW COMPLETED; TARGETED AND FULL QUALITY GATES PASS`

## 1. Assumptions and boundaries

- Commit `54aacb6` is the merged Phase 18 baseline and remains the branch HEAD.
- The existing ignored `backend/.env` is the only local secret source. No
  environment file or value was copied into source, tests, logs, screenshots,
  or this report.
- AI-1R authorizes only the smallest repair needed to make existing Gemini
  workflows satisfy their current contracts. It does not authorize another
  provider, runtime switching, cross-provider fallback, credential storage,
  provider UI, cloud changes, deployment, dependency upgrades, or refactoring.
- `gemini-2.5-flash` returned `NOT_FOUND` for the tested key/account. This is
  not evidence that the model is globally retired. The privately configured
  `gemini-3.6-flash` is the verified local model.
- Zod and feature semantic validation remain authoritative. The provider-side
  JSON Schema is a generation constraint, not a replacement trust boundary.

## 2. Environment requirements and secret handling

The backend loads its private local environment from the ignored
`backend/.env`. Verified non-secret runtime facts were:

| Setting | Verified value |
|---|---:|
| `AI_DEFAULT_PROVIDER` | `gemini` |
| `GEMINI_MODEL` | `gemini-3.6-flash` |
| `AI_REQUEST_TIMEOUT_MS` | `30000` |
| `AI_MAX_RETRIES` | `2` |
| `AI_DAILY_REQUEST_LIMIT` | `100` |
| `AI_DAILY_TOKEN_LIMIT` | `500000` |
| `JOB_WORKER_ENABLED` | `true` |
| `JOB_POLL_INTERVAL_MS` | `1000` |
| `JOB_LEASE_SECONDS` | `60` |
| `JOB_MAX_CONCURRENCY` | `2` |
| Resume/Interview/Learning worker attempts | `3` |

`GEMINI_API_KEY` was checked only for presence. Sanitized startup metadata
reported `aiProvider: gemini`, `aiConfigured: true`, and `jobsEnabled: true`.

## 3. Root cause and repaired architecture

The gateway already received a Zod response schema, but
`ProviderStructuredRequest` did not carry a provider-neutral JSON Schema.
Consequently, the Gemini adapter sent only `responseMimeType:
application/json`; Gemini produced valid JSON without the exact object shape,
and the authoritative strict Zod parse rejected it.

The repaired path is:

1. A feature calls `generateStructuredOutput` with its existing Zod schema.
2. `providerJsonSchema.ts` converts Zod 3.25.76 through
   `zod-to-json-schema` 3.24.6 and filters the result to the Gemini-compatible
   structural subset: object/array/scalar types, nested properties, items,
   required fields, enums, alternatives, nullability, and
   `additionalProperties`.
3. The provider-neutral request carries that exact structural contract in
   `responseJsonSchema`.
4. `gemini.provider.ts` sends both `responseMimeType: application/json` and
   `responseJsonSchema`. It omits the legacy temperature parameter for Gemini
   3-family model names while retaining it for earlier configured models.
5. The gateway bounds and parses the response, performs strict Zod validation,
   and then the feature applies its existing semantic/ownership checks before
   persistence.

Provider-side annotations such as lengths, numeric bounds, formats, defaults,
and descriptions are intentionally not transported because the tested Gemini
3.6 endpoint rejected the larger converted schema with `INVALID_ARGUMENT`.
Sanitized compatibility probes showed the preserved structural schema succeeds.
The omitted annotations are still enforced by authoritative post-response Zod
and feature validation.

The backend still registers exactly one `GeminiProviderAdapter`. There is no
provider factory selection, fallback, credential surface, or frontend provider
configuration.

## 4. Call-flow map and implemented actions

| UI action | API/controller | Service/job | Gemini feature | Validation/persistence/UI |
|---|---|---|---|---|
| Import Resume PDF | `POST /resume-analyses/import-pdf` | `resume.import-pdf` | `resume.parse` | `parsedResumeSchema` → Resume/Version → polled result |
| Run Resume assessment | `POST /resume-analyses/resumes/:id/analyze` | `resume.analyze` | `resume.analysis` | `aiAnalysisResultSchema` + bullet/duplicate semantics → ResumeAnalysis → rendered score |
| Generate Interview questions | `POST /interview-sessions/:id/questions/generate` | Interview generation job | `interview.questions.generate` | question schema + count/difficulty/uniqueness → questions/session → UI refresh |
| Explain Interview question | question explanation endpoint | explanation job | `interview.question.explain` | explanation schema + current-job fence → question |
| Evaluate Interview attempt | feedback endpoint | feedback job | `interview.attempt.feedback` | feedback schema + ownership/fence → attempt |
| Process Learning document | upload endpoint | `learning.document.process` | `learning.document.summary` | summary schema + work fence → chunks/summary/ready document |
| Grounded Learning chat | message endpoint | `learning.chat.respond` | `learning.document.chat` | chat schema + supplied-chunk citations → assistant message/source pages |
| Generate Flashcards | flashcard-set endpoint | `learning.flashcards.generate` | same | schema + exact indexes/duplicates/chunk references → cards/set |
| Generate Quiz | quiz endpoint | `learning.quiz.generate` | same | schema + indexes/choices/chunk references → quiz/private answer keys |

Resume rewrite application and quiz submission do not call Gemini: they consume
already validated persisted data.

## 5. Background jobs, retries, and quota accounting

1. Controllers validate authentication, ownership, and input, then create a
   durable `queued` MongoDB job with `attempts=0` and optional idempotency key.
2. The embedded worker atomically leases a due job, changes it to
   `processing`, increments the worker attempt, and renews the lease by
   heartbeat.
3. The handler calls the gateway, validates output, performs feature semantics,
   and persists within existing transaction/fencing rules.
4. Success stores an allowlisted result and terminalizes the job as
   `completed` at 100% with its retention TTL.
5. `AppError.retryable === false` now terminalizes a job on its current worker
   attempt. Unspecified or transient failures retain the existing bounded
   three-worker-attempt policy and backoff.

Non-retryable provider categories include malformed/schema-invalid output,
unsupported or missing model, invalid request, authentication, permission,
billing, and configuration failures. Timeout, appropriate 429 responses,
transient network failures, and provider 5xx/overload responses retain up to
three gateway calls (`AI_MAX_RETRIES=2`) per worker attempt.

The gateway records `gatewayAttempts` in sanitized usage metadata. A provider
HTTP failure now releases its estimated token reservation to zero while
retaining the auditable request-attempt count and failure UsageEvent. If the
provider returns usage but later Zod validation fails, estimated tokens are
reconciled to the actual provider usage rather than silently retained.

AI-1R also corrected three existing successful-transaction callbacks that did
not return a result: Learning document completion and Flashcard/Quiz attachment.
Those defects prevented otherwise valid provider results from reaching their
existing persistence path.

## 6. Response schemas and semantic validators

The transported structural contracts originate from, and responses are parsed
again by:

- Resume: `parsedResumeSchema`, `aiAnalysisResultSchema`.
- Interview: `generatedQuestionSetSchema`,
  `questionExplanationResultSchema`, `attemptFeedbackResultSchema`.
- Learning: `documentSummaryResultSchema`, `documentChatResultSchema`,
  `flashcardGenerationResultSchema`, `quizGenerationResultSchema`.

Feature semantics remain enabled: known Resume bullet IDs; requested Interview
counts, difficulty, uniqueness, and capacity; supplied Learning chunk
references; exact contiguous Flashcard/Quiz indexes; duplicate rejection;
current-job/document fences; and private server-side quiz answer keys.

## 7. Test results

### AI-1R focused tests

- New adapter/schema and retry/persistence suites: **2 files, 25 tests passed**.
- Flashcard/Quiz attachment transaction integration suite: **1 file, 7 tests
  passed**.
- Broader targeted AI/job regression set: **6 files, 57 tests passed**.
- Backend test typecheck passed before live verification.

The new tests cover every supported schema conversion, exact Gemini request
transport, Gemini 3 sampling compatibility, valid/malformed/schema-invalid and
semantic-invalid responses, retry classification, bounded transient retries,
worker terminalization, quota reconciliation, log/error redaction, and mocked
provider-to-real-Mongo persistence for Resume, Interview, and Learning.

### Full quality gates

| Command | Result |
|---|---|
| `npm run typecheck` | PASS — frontend, backend, and shared-types |
| `npm run build` | PASS — frontend and backend production builds |
| `npm test` | PASS — 19 files, 139 tests |
| `npm run test:ci` | PASS — typechecks plus 19 files, 139 tests; 63.17% statements/lines, 69.33% branches, 78.94% functions |

Vite retained its existing React Router directive and >500 kB chunk warnings.
The rate-limit spoof-resistance test emitted its expected diagnostic and
passed. A sandboxed test invocation failed before discovery with `listen EPERM
0.0.0.0`; the unchanged commands passed with local ephemeral-port permission.

## 8. Live Gemini verification

All inputs and users were synthetic. Wall latency includes queue polling;
provider latency is the sanitized UsageEvent measurement.

| Capability | Result | Wall / provider latency | Job transition | Worker / gateway attempts | Validation | Error |
|---|---|---:|---|---:|---|---|
| Resume analysis | PASS | 7.15 s / 6.73 s | queued → processing → completed | 1 / 1 | schema + semantic PASS | none |
| Interview questions | PASS | 6.13 s / 4.64 s | queued → processing → completed | 1 / 1 | schema + semantic PASS | none |
| Learning summary | PASS | 5.17 s / 4.14 s | queued → processing → completed | 1 / 1 | schema + semantic PASS | none |
| Grounded Learning chat | PASS | 3.15 s / 1.94 s | queued → processing → completed | 1 / 1 | schema + source-page semantics PASS | none |
| Flashcards | PASS | 11.22 s / 10.09 s | queued → processing → completed | 1 / 1 | schema + card semantics PASS | none |
| Quiz generation | PASS | 40.52 s / 39.42 s | queued → processing → completed | 1 / 2 | schema + quiz semantics PASS | none |

The Quiz gateway retried once and then succeeded within one worker attempt.
The other five live gateway calls succeeded on their first provider attempt.
A controlled live `INVALID_ARGUMENT` failure terminalized after one worker
attempt; focused tests separately verify that `NOT_FOUND` is non-retryable.

## 9. Browser verification

The Browser plugin was available and used; Playwright fallback was not needed.
The verified provider-backed flow was:

`login → owned Resume workspace → submit synthetic target role → queued →
processing → completed → validated score/result rendered`

| Check | Result |
|---|---|
| Page identity / non-blank app | PASS — `Career Learning Hub`, owned Resume workspace, meaningful editor and assessment result |
| Real interaction | PASS — assessment submission completed against Gemini |
| Framework overlays | PASS — no Vite or React error overlay |
| Console health | PASS — zero warning/error entries after completion |
| Desktop | PASS — 1440×1000, no horizontal overflow |
| Mobile | PASS — 390×844, no horizontal overflow, completed state visible |

Evidence is outside Git at
`/private/tmp/career-learning-hub-ai1r-browser-desktop.png` and
`/private/tmp/career-learning-hub-ai1r-browser-mobile.png`.

## 10. Cleanup, risks, and AI-2 blockers

The backend and frontend processes started for AI-1R were stopped. The
pre-existing local MongoDB service was reused and left running. Cleanup removed
3 synthetic users, 91 owned records across 19 collections, and 3 exact private
asset directories; verification found zero remaining matching users or owned
records.

Remaining considerations before or during AI-2:

- Model availability is account/environment specific. `gemini-2.5-flash`
  returned `NOT_FOUND` only for the tested key/account; `gemini-3.6-flash` is
  verified locally.
- The JSON Schema contract is provider-neutral, but only the direct Gemini
  adapter exists. A separately approved provider-routing design must define
  how future adapters consume or translate the contract without weakening
  Zod/semantic authority.
- The Gemini-compatible provider schema intentionally carries structural
  constraints only. Changes to Gemini schema support should be compatibility
  tested before transporting more annotations.
- `npm install` reported the repository's unresolved audit state (2 high, 1
  critical); unrelated dependency remediation was not authorized in AI-1R.
- Embedded worker identity/topology remains an operational concern for future
  multi-instance deployment and is not changed here.

AI-1R is technically ready for human diff review and explicit local commit
authorization. It does not implement or authorize AI-2 functionality.

## 11. Files inspected and changed

Inspected areas include root/frontend/backend package scripts, environment
schema and examples, Gemini adapter/provider contracts, gateway/quota/usage
services, Zod response schemas, job model/queue/worker/handlers, Resume,
Interview, and Learning AI services/controllers/models, storage, focused unit,
integration, security and browser infrastructure, and the controlling planning,
architecture, and deployment documents.

Production changes are limited to the Gemini contract/adapter/gateway,
validation/error/retry/quota path, and three Learning transaction return fixes.
Tests add focused adapter/retry/persistence coverage. Package metadata adds only
`zod-to-json-schema`. The three planning documents contain the verified
baseline and decision record. No frontend/React source was changed.
