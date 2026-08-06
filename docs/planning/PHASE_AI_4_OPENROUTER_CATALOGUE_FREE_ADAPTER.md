# Phase AI-4 — OpenRouter Catalogue and Free-Only Adapter

## Status and boundary

- Prompt: `CLH-AI-4-OPENROUTER-CATALOGUE-FREE-ADAPTER`
- Branch: `feature/multi-provider-ai-routing`
- Starting commit: `69fe3870e2ea4af26ff0fc83dc5ef11d7c3f4d79`
- Starting subject: `Implement AI vault and routing foundation`
- Status: `COMPLETE / HUMAN-APPROVED / LOCALLY COMMITTED`
- Approval token: `PHASE_AI_4_OPENROUTER_CATALOGUE_FREE_ADAPTER_APPROVED`
- Approval accepted: `YES`
- Documented limitations accepted by human review: `YES`
- Local commit authorization: `ONE EXACT 25-PATH LOCAL COMMIT`
- Live provider test / real key / push / merge / deployment: none
- AI-5 status: `INACTIVE / REQUIRES SEPARATE AUTHORIZATION`

AI-4 adds only free-only OpenRouter execution. OpenAI Direct, Anthropic Direct,
DeepSeek Direct, paid OpenRouter routing, browser streaming, frontend controls,
cloud changes, deployment, AI-5 and Phase 19 remain unavailable.

## Assumptions and documented ambiguities

1. The fixed Models URL is `https://openrouter.ai/api/v1/models`. The API
   reference currently describes bearer authentication, while the official
   Models guide also shows uncredentialed list examples. AI-4 authorizes no
   global OpenRouter key and user credentials cannot safely drive a global
   startup catalogue, so refresh uses no authorization header. If the deployed
   contract requires authentication, refresh fails closed and preserves the
   last valid catalogue; with no cache OpenRouter stays unavailable.
2. OpenRouter documents cancellation as effective only for streaming requests
   and supported providers. AI-4 is intentionally non-streaming. The propagated
   `AbortSignal` and total deadline bound local waiting, but cannot guarantee
   that upstream computation stops after OpenRouter accepts a request.
3. Strict structured-output enforcement varies by upstream endpoint even when
   `strict: true` is requested. Provider JSON Schema remains a generation
   constraint; strict Zod parsing and existing semantic, ownership, fence,
   persistence and Quiz-secrecy validation remain authoritative under DEC-017.
4. No approved quality dataset was supplied. Ranking therefore makes no model
   quality claim. It prefers the smallest exact capability surplus, then the
   smallest sufficient context/output capacity, then stable model-ID order.
5. No documented Models API ETag contract was confirmed. A bounded validator
   header is retained if supplied, but AI-4 does not depend on conditional GET.

## Official OpenRouter documentation reviewed

Retrieved on 2026-08-03, exclusively from official OpenRouter documentation:

- [Models API](https://openrouter.ai/docs/api/api-reference/models/get-models)
- [Models overview and pricing fields](https://openrouter.ai/docs/guides/overview/models)
- [Structured outputs](https://openrouter.ai/docs/guides/features/structured-outputs)
- [Provider parameter requirements](https://openrouter.ai/docs/guides/routing/provider-selection)
- [Ordered model fallbacks](https://openrouter.ai/docs/guides/routing/model-fallbacks)
- [Errors and debugging](https://openrouter.ai/docs/api/reference/errors-and-debugging)
- [Streaming and cancellation](https://openrouter.ai/docs/api/reference/streaming)
- [Usage accounting](https://openrouter.ai/docs/cookbook/administration/usage-accounting)

Fields relied upon are `data`, `id`, `canonical_slug`, `name`, `created`,
`context_length`, architecture input/output modalities, `top_provider` maximum
completion tokens, `supported_parameters`, optional `total_count` and
`links.next`, exact string pricing dimensions, and conditional
`pricing.overrides` fields `min_prompt_tokens`, `utc_start` and `utc_end`,
completion `id`, actual `model`, choice content/finish reason, typed errors and
prompt/completion/total usage tokens. No credentialed OpenRouter request, live
catalogue request or completion request was made.

## Repository inspection and architecture mapping

The implementation inspected and preserved DEC-017, DEC-018, the AI-2
architecture/threat model, the AI-3 phase record, vault encryption and revision
handling, preference/profile/snapshot models, request guards, execution leases,
audit events, Gemini adapter, provider-neutral gateway, output validation,
quota/UsageEvent handling, job schema/queue/system/worker and all existing AI
call sites. No legacy project or `backend/.env` was accessed.

The existing architecture remains authoritative:

- one scalar active provider;
- user-owned AES-256-GCM credential storage and ephemeral execution handles;
- immutable routing profiles and job snapshots;
- execution-time preference, profile, credential, deadline and model gates;
- one provider call path with no cross-provider fallback;
- quota reservation/reconciliation and safe UsageEvents;
- structural JSON Schema followed by strict application validation.

## Catalogue model, validation and indexes

`OpenRouterModelCatalogue` stores only normalized safe routing/audit fields:
model identity/name, timestamps, context/output limits, modalities, supported
parameters, original validated base and override pricing strings, Decimal128
pricing values, bounded normalized override conditions, free structured-text
eligibility, catalogue/pricing versions and first/last seen, missing and
hard-disable state. The unvalidated remote body is discarded.

`OpenRouterCatalogueState` is the `openrouter` singleton and stores current
version, attempts/success, item count, freshness, pricing observation,
optional bounded validator, distributed lease and sanitized failure code.

Indexes cover unique model ID, catalogue-version/model lookup, free structured
text eligibility, missing/disabled state and refresh-lease lookup. The state
singleton uses its unique `_id`.

Validation uses a strict root, a 2,000-item bound, bounded strings/arrays,
required safe model IDs, duplicate rejection, bounded integer context/output,
known modalities/parameters, the eight current official pricing dimensions,
at most 64 strict overrides, valid long-context/UTC conditions and exact
non-negative Decimal128 parsing. URL-shaped, traversal, control-character and
oversized IDs, NaN/Infinity/negative/overflow prices, malformed/empty roots and
excessive responses fail the entire refresh. Unknown model/architecture fields
are excluded. Unknown price dimensions or override conditions fail the entire
refresh. The undocumented `file` price key is not recognized.

## Free-price classification

For these structured actions, `prompt`, `completion` and `request` must each be
explicitly present, finite, non-negative and exactly zero. Official optional
image, web-search, reasoning and cache dimensions are evaluated exactly when
present. Missing required, invalid, negative, stale or non-zero applicable
pricing is ineligible. Names and `:free` suffixes have no authority.

Every override is normalized without floating-point conversion and persisted
with the same catalogue version and pricing observation as its model. Omitted
override prices inherit base prices. Every possible UTC window is evaluated,
not only the currently active top-level price. A long-context override is
applicable exactly when the action's absolute maximum input tokens can be
strictly greater than `min_prompt_tokens`; an override at or above that ceiling
is deterministically excluded. Missing applicability evidence fails closed.
Any applicable non-zero effective price makes the model ineligible.

Pricing is considered stale after 24 hours. Every selected candidate records
the catalogue version and pricing observation used. Paid candidates,
`openrouter/auto` and `openrouter/free` cannot enter a plan or adapter request.

## Refresh and cache lifecycle

- Startup triggers a non-blocking refresh when the routing foundation is on.
- Recurrence is six hours with bounded ±10% jitter.
- One MongoDB lease permits one active refresher and expired leases recover.
- Fetch uses the fixed Models URL, GET, JSON Accept header, a 10-second default
  deadline and a 5 MB response bound.
- Successful normalized writes and state-version advancement share one MongoDB
  transaction.
- Failed, empty, malformed or oversized refreshes preserve the last valid
  catalogue and mark it stale; without a valid version OpenRouter is unavailable.
- Absent models receive `missingSince`; hard-disabled models remain disabled
  across ordinary refresh and become immediately ineligible.
- Snapshots retain the historical catalogue/pricing version and exact ordered
  models needed to explain queued work; current model rows retain first/last
  seen and missing/disable history.

## Eleven action profiles and ranking

Exactly these identities are compiled: `resume-parse`, `resume-analysis`,
`resume-rewrite`, `resume-job-comparison`, `interview-question-generation`,
`interview-question-explanation`, `interview-answer-feedback`,
`learning-summary`, `learning-grounded-chat`, `flashcard-generation`, and
`quiz-generation`.

Each static policy contains the approved text modalities, `max_tokens`,
`response_format` and `structured_outputs` requirements, architecture-defined
minimum context and output bounds, short/chat/heavy deadline profile, validator
identity/version, input/output ceilings, `allowValidationRegeneration=false`
and `paidFallbackAllowed=false`. No volatile model ID exists in source policy.

Ranking policy `openrouter-free-ranking-v2` filters base and override price,
action-specific override applicability, freshness,
missing/disabled state, modalities, required parameters, context and output
capacity, then deterministically sorts exact capability surplus, capacity
surplus and model ID. Plans cap candidates at three by default and fail closed
when empty. All eleven action plans are published atomically into a new
immutable user routing-profile version during OpenRouter activation.

## Credential, adapter and API behavior

OpenRouter reuses the AI-3 save, replace, test, activate, delete, list,
idempotency, Origin, ownership, revision, audit, lease, AES-256-GCM vault and
redaction paths. Connection testing decrypts only at the adapter boundary and
sends fixed synthetic content. It never uses Resume, Interview or Learning
content and never falls back to Gemini.

The adapter uses only
`https://openrouter.ai/api/v1/chat/completions`, Bearer authorization from the
ephemeral credential handle, JSON content type and a server-built body. One
non-streaming request contains the frozen ordered `models` array,
`max_tokens`, `response_format.type=json_schema`, `strict=true`, the translated
provider-neutral schema and `provider.require_parameters=true`. Request and
response bodies are bounded; cancellation and total deadline propagate.

Responses must contain JSON text and an actual model from the frozen array.
The adapter captures bounded/hashed generation ID, actual model, normalized
finish reason and token usage. The gateway then performs its existing response
size, JSON and strict Zod validation before feature semantics and persistence.

`GET /api/v1/ai/models` is authenticated, read-only, OpenRouter/action bounded
and returns only safe capability metadata plus freshness/version. `POST
/api/v1/ai/models/refresh` is authenticated administrator-only, Origin checked,
limited to six/hour/operator, idempotent and safely audited.

## Routing snapshot, isolation, usage and errors

OpenRouter snapshots freeze provider/mode, preference/profile/credential
versions, ranking/catalogue/pricing versions, exact ordered free models,
`paidFallbackAllowed=false`, token/deadline fields and `executeBefore`. They
contain no plaintext key, ciphertext, authorization header, raw pricing or raw
provider object. Worker retries reuse the stored snapshot/order.

Execution rejects before provider use when preference/provider, credential
version/state, profile/action plan, ranking-policy version, deadline or current
candidate base/override security/free state is stale. Ordinary refresh therefore
cannot leave a formerly free queued candidate executable after a paid or
uncertain override appears. Direct Gemini resolves only Gemini credentials/models;
OpenRouter resolves only OpenRouter credentials/free arrays. No provider switch
exists as recovery.

## Pricing-overrides contract verification

Prompt `CLH-AI-4-PRICING-OVERRIDES-CONTRACT-VERIFICATION` inspected the current
official Models API contract on 2026-08-03. A repair was required because the
initial AI-4 parser rejected valid `pricing.overrides` as an unknown base price,
persisted only top-level prices, recognized undocumented `file` pricing, rejected
official root metadata, and the execution gate trusted base-only eligibility.

The surgical repair added strict bounded override parsing, exact Decimal128
normalization/persistence, inherited-price classification, action-ceiling-aware
long-context checks, all-window UTC checks, official root-field acceptance,
ranking policy v2 and execution-time revalidation. TDD RED produced 9/46 unit
failures and 3/19 integration failures for the missing contract behavior. A
second RED produced 1/48 unit failure for an incomplete UTC schedule. Final
GREEN passed 48/48 pricing/parser tests, 19/19 refresh/execution tests and 90/90
across all four AI-4 suites. All network behavior remained mocked and the fixed
unpaginated general Models endpoint was called once; pagination links were
never followed.

Safe UsageEvent metadata contains a hash of the planned list, actual model,
free tier, catalogue/profile/ranking versions, gateway and worker attempts,
token usage, latency, bounded/hashed generation ID, finish reason and fallback
index. It contains no prompt, output, key, authorization header, ciphertext or
raw provider error. No cost/spend field was added.

Errors normalize authentication, permission, quota, rate limit, missing or
unavailable model, overload, timeout, context, invalid request/output, content
block, network, routing, availability and unknown-provider cases. Raw response
bodies/messages do not leave the adapter. Deterministic failures are
non-retryable; transient gateway retries remain bounded and reuse the snapshot.

## Files changed

Existing paths modified:

- `backend/src/jobs/job.model.ts`
- `backend/src/jobs/job.system.ts`
- `backend/src/middleware/rateLimit.ts`
- `backend/src/modules/ai/ai.routes.ts`
- `backend/src/modules/ai/aiGateway.service.ts`
- `backend/src/modules/ai/aiProvider.schemas.ts`
- `backend/src/modules/ai/aiProvider.service.ts`
- `backend/src/modules/ai/aiProvider.types.ts`
- `backend/src/modules/ai/aiRequestGuards.ts`
- `backend/src/modules/ai/aiRouting.service.ts`
- `backend/src/modules/ai/aiRoutingProfile.model.ts`
- `backend/src/modules/ai/aiRoutingSnapshot.ts`
- `backend/src/modules/ai/providers/provider.types.ts`
- `backend/src/modules/ai/securityAuditEvent.model.ts`
- `docs/planning/CURRENT_PHASE.md`

New paths:

- `backend/src/modules/ai/aiModels.controller.ts`
- `backend/src/modules/ai/openRouterCatalogue.model.ts`
- `backend/src/modules/ai/openRouterCatalogue.service.ts`
- `backend/src/modules/ai/openRouterCatalogue.ts`
- `backend/src/modules/ai/providers/openRouter.provider.ts`
- `backend/src/tests/integration/openRouterCatalogueRefresh.integration.test.ts`
- `backend/src/tests/integration/openRouterCredentialRouting.integration.test.ts`
- `backend/src/tests/unit/openRouterCatalogue.test.ts`
- `backend/src/tests/unit/openRouterProvider.test.ts`
- `docs/planning/PHASE_AI_4_OPENROUTER_CATALOGUE_FREE_ADAPTER.md`

No frontend, shared-types, package, lockfile, deployment, migration, real
environment, cloud or legacy path changed. No new DECISION_LOG entry was needed;
the implementation follows DEC-017 and DEC-018.

## Verification evidence

All provider network behavior used mocked `fetch` responses. No browser,
Playwright, frontend visual QA, live AI provider, real key, cloud service or
deployment was used.

- AI-4 focused: 4 files, 90/90 passed.
  - parser/classification/action/ranking/scheduler: 48;
  - cache/refresh/lease/persistence: 13;
  - adapter request/response/errors: 23;
  - credential/routing/isolation/models APIs/secret safety: 6.
- Complete unit gate: 11 files, 145/145 passed.
- Complete integration gate: 13 files, 126/126 passed.
- Complete security gate: 4 files, 35/35 passed.
- `npm run typecheck`: passed for web, API and shared types.
- `npm run build`: passed for web and API; only the existing React Router
  directive and Vite chunk-size warnings were emitted.
- `npm test`: 28 files, 306/306 passed.
- `npm run test:ci`: production/test typechecks passed; coverage run passed 28
  files and 306/306 tests. Aggregate instrumented coverage: 64.13% statements,
  69.33% branches, 78.94% functions and 64.13% lines.

The existing spoofed `X-Forwarded-For` express-rate-limit diagnostic appeared
while its security test passed. No test was skipped, deleted or weakened.

## Security and secret evidence

Synthetic canary tests verify keys are absent from responses, jobs, snapshots,
UsageEvents and audit persistence. Ordinary credential queries still exclude
encrypted material. Fixed URLs, headers and model-ID validation prevent
user-controlled destinations or headers. OpenRouter errors and failed refresh
metadata are sanitized. Repository inspection and scans found only deliberate
synthetic canaries inside tests; no real secret or environment value was read.

## Migration, rollback, limitations and AI-5 readiness

No data migration runs in AI-4. Existing profiles remain readable; OpenRouter
activation publishes a new immutable profile version containing all eleven
plans. Direct Gemini compatibility remains unchanged. Rollback is to disable
the routing foundation or select Disabled/Gemini Direct; OpenRouter snapshots
then fail the execution gate without cross-routing.

Remaining limitations:

- the uncredentialed global Models refresh depends on the documented ambiguity
  noted above;
- non-streaming abort cannot guarantee upstream cancellation;
- provider strict-schema behavior is not authoritative and can still return
  invalid output, which the application rejects without regeneration;
- catalogue history is summarized in immutable snapshots/current model
  first/last-seen state rather than stored as full raw historical responses;
- no live-provider behavior, deployment topology or clock-skew behavior was
  verified;
- paid routing, streaming, UI and direct-provider additions remain unbuilt.

AI-5 may build provider-specific direct adapters only after separate human
authorization. It must preserve the same vault, snapshot, execution,
validation, isolation, error and audit boundaries. AI-5 is inactive and was
not started by AI-4 approval.

## Recommended review outcome

- Approval token: `PHASE_AI_4_OPENROUTER_CATALOGUE_FREE_ADAPTER_APPROVED`
- Approval accepted: `YES — DOCUMENTED LIMITATIONS ACCEPTED`
- Authorized commit subject: `Implement OpenRouter free routing`
- Authorized commit boundary: `EXACTLY 25 AI-4 PATHS`
- Current final status: `COMPLETE / HUMAN-APPROVED / LOCALLY COMMITTED`
