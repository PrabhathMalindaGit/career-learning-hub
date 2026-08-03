# AI-2 — Multi-provider architecture and threat model

- Prompt ID: `CLH-AI-2-MULTI-PROVIDER-ARCHITECTURE-THREAT-MODEL`
- Date: 2026-08-03
- Branch: `feature/multi-provider-ai-routing`
- Starting commit: `eea4de2c1c476362a184604b13446d78e68fce4c`
- Parent baseline: `54aacb62bb1371fa16d32c3311c07dfa7bdbcbab`
- Scope: documentation and architecture only
- Status: `COMPLETE / HUMAN-APPROVED / LOCALLY COMMITTED`
- Approval token:
  `PHASE_AI_2_MULTI_PROVIDER_ARCHITECTURE_AND_THREAT_MODEL_APPROVED`
- Approval token accepted: `YES`
- Human review: `APPROVED`
- Documentation commit: `AUTHORIZED AS ONE EXACT FIVE-PATH LOCAL COMMIT`
- AI-3 status: `INACTIVE / REQUIRES SEPARATE AUTHORIZATION`

## Inspection summary

The mandatory Git pre-flight passed before source inspection:

- branch: `feature/multi-provider-ai-routing`;
- HEAD: `eea4de2c1c476362a184604b13446d78e68fce4c`;
- subject: `Repair Gemini structured output contracts`;
- worktree: clean;
- index: no staged changes; and
- merge, rebase, cherry-pick, and revert: inactive.

Repository evidence establishes a React/Vite frontend, Express/TypeScript API,
MongoDB persistence, private storage, and an embedded MongoDB-leased worker.
The AI gateway currently registers one direct Gemini adapter using
environment-based `GEMINI_API_KEY`/`GEMINI_MODEL`, applies bounded timeout and
retry behavior, reserves daily request/token quota atomically, records
sanitized usage events, transports provider-neutral structural JSON Schema,
and preserves strict Zod validation.

Resume, Interview, Learning summary/chat, Flashcard, and Quiz workflows use
owner-bound job payloads and repeat ownership/fencing/semantic checks before
persistence. The shared frontend API client keeps access tokens in memory,
uses the refresh cookie, validates structured errors, preserves request IDs,
and provides cancellation. Settings currently presents account/session data
only. The repository has token/IP hashing but no provider-key encryption vault
or multi-provider state.

The existing Phase 15 threat model is repository-scoped but describes commit
`da3deb50cdfd2f9130ca0e3ce4fbea1cc08d8a51` and a single optional Gemini
boundary. AI-2 therefore creates a new repository-scoped, current-version
threat model at the user-requested path rather than treating the old document
as a current cache.

Official research was limited to OpenRouter documentation because repository
evidence cannot establish the current model-fallback and catalogue contract.
The reviewed official pages establish the ordered `models` fallback mechanism,
actual-model response field, model catalogue pricing/context/modality/
supported-parameter fields, zero price semantics, and pre-stream versus
mid-stream error distinction. No provider API was called.

## Assumptions and ambiguities

- “Exactly one active provider” means exactly one execution state. The
  `disabled` state represents zero callable providers.
- The user-provided `docs/security/AI_PROVIDER_THREAT_MODEL.md` path overrides
  the security skill's generic cache path.
- Provider model IDs, prices, account quotas, and undocumented error codes are
  volatile and are not hardcoded or invented.
- MongoDB transactions remain available for activation, routing snapshot,
  budget, deletion, and execution-lease operations.
- Multi-instance enforcement requires shared database counters and leases;
  process-local rate limiting is defense in depth, not the money boundary.
- JavaScript cannot guarantee zeroization of every immutable string copy; the
  design minimizes credential lifetime and clears mutable buffers.
- External providers necessarily see content explicitly sent for an initiated
  action. Provider retention/training policy and user disclosure remain an
  operator decision.
- Whether the OpenRouter catalogue needs a server catalogue-only credential,
  and the exact supported capabilities of each direct provider, must be
  confirmed from official documentation during the implementation phase.
- Administrator-managed Gemini may remain only if separately approved. It is
  explicit and labeled, never an automatic fallback or silent global default.

## Decisions

1. Store active-provider authority in one `AiProviderPreference` document per
   user. Do not distribute active flags across credential documents.
2. Support `openrouter`, four direct-provider identities, and `disabled`.
3. Encrypt user credentials with AES-256-GCM under versioned
   `BYOK_ENCRYPTION_KEY` material; bind owner/provider/secret/key versions in
   authenticated additional data.
4. Store configured credentials independently of active state. Inactive
   credentials are inaccessible to runtime credential resolution.
5. Freeze an immutable routing snapshot at enqueue, but revalidate current
   provider/credential/permission/model safety immediately before any call.
6. Treat provider switch, credential replacement/deletion, AI disablement,
   paid-permission revocation, hard model disablement, and expiry as stale-job
   conditions. Do not silently recompile or reroute jobs.
7. Use an ordered OpenRouter `models` array containing approved free models
   only. Use a separate, explicit OpenRouter paid request after a fresh budget
   reservation when permitted.
8. Never cross from a direct provider to OpenRouter or another direct provider.
9. Preserve DEC-017: provider structural schemas constrain generation, while
   strict Zod and feature semantic/ownership/fencing/secrecy checks remain
   authoritative.
10. Keep schema-invalid/semantic-invalid output non-retryable initially. Any
    one-time regeneration is future, action-specific, same-provider behavior
    requiring explicit profile permission and tests.
11. Use the controlling TTFT/idle/total timeout profiles, defining TTFT as the
    first usable answer-content token.
12. Reserve requests, tokens, concurrency, paid-request count, and micro-USD
    atomically. Missing/stale pricing fails closed for paid use and excludes a
    model from free eligibility.
13. Do not store raw prompts/responses. Record safe provider/model/tier/
    attempts/usage/cost/error/routing metadata.
14. Preserve current environment Gemini behavior in AI-2. Later migration
    makes administrator-managed use explicit before deprecating the implicit
    route.

These decisions are recorded as DEC-018 and build on, rather than rewrite,
DEC-017.

## Rejected alternatives

- simultaneous active providers;
- direct-provider cross-fallback;
- inactive snapshots continuing after a provider switch;
- provider resolution only when a worker executes;
- localStorage/sessionStorage/IndexedDB credential persistence;
- plaintext credentials in MongoDB;
- plaintext or ciphertext credentials in jobs, usage, audit, or errors;
- unrestricted `openrouter/auto` or randomized `openrouter/free` as the
  default application router;
- hardcoded free model IDs or suffix-only free classification;
- a paid model in the free models array;
- automatic paid fallback without explicit model and atomic limits;
- provider schema replacing Zod or feature semantic validation;
- raw provider errors in responses or logs;
- one silent global provider credential for all users; and
- raw prompt/response storage by default.

## Deliverables

- [Architecture](../architecture/MULTI_PROVIDER_AI_ARCHITECTURE.md)
- [Repository threat model](../security/AI_PROVIDER_THREAT_MODEL.md)
- [Phase record](PHASE_AI_2_MULTI_PROVIDER_ARCHITECTURE_AND_THREAT_MODEL.md)
- [Current phase update](CURRENT_PHASE.md)
- [Decision log](DECISION_LOG.md) (`DEC-018` proposal)

## Architecture result

The architecture defines:

- encryption key/nonce/tag/AAD formats, key rotation, replacement, deletion,
  failure behavior, backup implications, and memory limits;
- concurrency-safe provider activation and execution-lease semantics;
- a provider-neutral adapter for testing, catalogues, model validation,
  structured generation, optional streaming, cancellation, timeouts, usage,
  actual model/request ID, error normalization, pricing, and schema
  translation;
- immutable queue snapshots and explicit stale-job rules;
- dynamic OpenRouter catalogue validation, approximately six-hour refresh,
  stale-while-revalidate, last-valid preservation, and safe expiry;
- all eleven required action profiles without volatile model IDs;
- free-only ordered `models` routing and separate limited paid fallback;
- direct-provider isolation and same-provider retry rules;
- streaming, timeout, interruption, and very-large-document behavior;
- a stable public error taxonomy and safe UI actions;
- atomic quota, concurrency, and cost reservation/reconciliation;
- safe usage transparency;
- endpoint-level API contracts, authorization, rate limits, revisions,
  idempotency, CSRF/Origin, audit, and prohibited fields;
- MongoDB fields, uniqueness, ownership, partial/TTL indexes, versions, and
  transaction boundaries;
- Settings UI states and browser secret handling;
- staged Gemini migration, rollout, kill switch, and rollback; and
- dependency-ordered AI-3 through AI-8 scopes and test gates.

## Threat-model result

The threat model covers the full repository runtime before narrowing into
multi-provider AI. It identifies assets, actors, attacker/operator/developer
inputs, eight trust boundaries, twenty security invariants, existing versus
planned controls, severity calibration, detection priorities, and 35 threat
classes with mitigation, detection, required test, residual risk, and
severity.

Explicit coverage includes credential IDOR, database/master-key/backup
disclosure, nonce misuse, rotation failure, XSS/extensions, CSRF, malicious
documents, prompt/model-output injection, error leakage, catalogue poisoning,
cost exhaustion, activation/quota/deletion races, queued-job confusion, stale
credentials, SSRF/endpoint injection, denial of service, logging, provider and
supply-chain compromise, administrator misuse, sessions, private storage,
Quiz secrecy, and stale worker writes. It reports no current-diff findings.

## Unresolved questions

1. Deployment secret-manager and backup product/policy.
2. Approval and eligible population for administrator-managed Gemini after
   migration.
3. Server-wide maximum paid request/spend caps and user-configurable bounds.
4. Provider/model privacy, training, retention, and regional-routing policy.
5. Production API/worker replica topology, unique worker identity, shared rate
   limiting, and transaction support.
6. OpenRouter catalogue authentication requirement for the target deployment.
7. Current official model catalogue, structured-output, streaming, usage, and
   request-ID capabilities for each direct provider at implementation time.
8. Retention for usage, audit, catalogue history, routing snapshots, job
   records, and credential deletion tombstones.

None blocks architecture review. Each blocks or constrains the corresponding
later implementation/cutover step and must be resolved before that step is
approved.

## Risks

- A compromised API/worker process can access an active credential in memory.
- An external provider can retain or mishandle data after an authorized send;
  contractual and endpoint policy is required.
- Database and master-key administrator collusion defeats envelope separation.
- JavaScript credential strings cannot be proven fully zeroized.
- Provider catalogue/pricing and capabilities are volatile; paid execution
  must fail closed when evidence is missing or stale.
- Deletion cannot recall a provider request accepted immediately before the
  delete gate; deletion prevents new leases and drains/aborts known in-flight
  work.
- Current process-local rate limits do not provide distributed cost
  enforcement. Database reservations must be implemented before paid use.
- The existing dependency audit state and deployment topology remain outside
  this documentation-only phase.

## Recommended AI-3 scope

AI-3 should implement only the secure foundation while retaining Gemini as the
sole adapter:

1. encryption key parsing and AES-256-GCM vault with unit vectors;
2. `AiCredential`, `AiProviderPreference`, immutable `AiRoutingProfile`, safe
   audit, and execution-lease schemas/indexes;
3. owner-scoped provider/settings APIs, strict request/response contracts,
   revision CAS, idempotency, rate limits, and admin guard;
4. routing snapshot schema/compiler and current-state execution gate;
5. explicit administrator-managed Gemini compatibility policy;
6. migration/rollback and key backup/rotation runbooks; and
7. focused cryptography, IDOR, CSRF/Origin, activation, replace/delete/job
   concurrency, redaction, migration, and rollback tests.

AI-3 must not add OpenRouter, OpenAI, Anthropic, or DeepSeek calls; paid
fallback; streaming UI; deployment; or a provider-live test unless separately
authorized.

## Files inspected

Controlling and historical evidence:

- `AGENTS.md`
- `docs/planning/CURRENT_PHASE.md` (active AI-1R header/control section)
- `docs/planning/DECISION_LOG.md` (DEC-016 and DEC-017 plus sequential ID)
- `docs/planning/PHASE_AI_1_GEMINI_BASELINE.md`
- `docs/security/PHASE_15_THREAT_MODEL.md`
- `docs/security/OWNERSHIP_MAP.md`
- `docs/planning/PHASE_15_SECURITY_PRIVACY_PLAN.md`
- `docs/planning/PHASE_15_SECURITY_PRIVACY_REPORT.md` (AI/privacy evidence)
- `docs/security/PHASE_15_FINDING_REGISTER.md` (AI/privacy evidence)
- `docs/architecture/frontend-backend-structure.md`

Configuration and application boundaries:

- root, backend, frontend, and shared-types `package.json` files
- `backend/.env.example` (no real environment file or value was read)
- `backend/src/config/env.ts`
- `backend/src/config/database.ts`
- `backend/src/config/security.ts`
- `backend/src/app.ts`
- `backend/src/middleware/authenticate.ts`
- `backend/src/middleware/errorHandler.ts`
- `backend/src/middleware/rateLimit.ts`
- `backend/src/shared/appError.ts`
- `backend/src/shared/crypto.ts`
- `backend/src/shared/logger.ts`
- `backend/src/shared/mongoTransaction.ts`
- `backend/src/modules/users/user.model.ts`
- `backend/src/modules/activity/activity.model.ts`
- `backend/src/modules/activity/activity.service.ts`

AI, queue, and feature flows:

- `backend/src/modules/ai/providers/provider.types.ts`
- `backend/src/modules/ai/providers/gemini.provider.ts`
- `backend/src/modules/ai/providerJsonSchema.ts`
- `backend/src/modules/ai/aiGateway.service.ts`
- `backend/src/modules/ai/aiOutputValidation.ts`
- `backend/src/modules/ai/aiQuota.model.ts`
- `backend/src/modules/ai/aiQuota.service.ts`
- `backend/src/modules/ai/usageEvent.model.ts`
- `backend/src/modules/ai/ai.controller.ts`
- `backend/src/modules/ai/ai.routes.ts`
- `backend/src/jobs/job.model.ts`
- `backend/src/jobs/job.queue.ts`
- `backend/src/jobs/job.worker.ts`
- `backend/src/jobs/job.handlers.ts`
- `backend/src/jobs/job.schemas.ts`
- `backend/src/jobs/job.controller.ts`
- `backend/src/jobs/job.system.ts`
- Resume, Interview, and Learning job-handler files and every
  `generateStructuredOutput` call site/nearby semantic validation path

Frontend contracts:

- `frontend/src/api/apiClient.ts`
- `frontend/src/features/auth/SettingsPage.tsx`
- `frontend/src/features/auth/authApi.ts`
- `packages/shared-types/src/index.ts`

Security-skill guidance and official research:

- Codex Security threat-model skill, scan-artifact convention,
  security-guidance resolver instructions, scan target contract, and threat
  model generation guidance
- OpenRouter official model fallback, models API, models overview, free model,
  streaming/error documentation returned by restricted web research

No `SECURITY.md` exists in the repository. No legacy sibling project was
accessed.

## Files changed

Only the five authorized documentation paths are changed:

- `docs/architecture/MULTI_PROVIDER_AI_ARCHITECTURE.md` (new)
- `docs/security/AI_PROVIDER_THREAT_MODEL.md` (new)
- `docs/planning/PHASE_AI_2_MULTI_PROVIDER_ARCHITECTURE_AND_THREAT_MODEL.md`
  (new)
- `docs/planning/CURRENT_PHASE.md` (AI-2 current-phase header update)
- `docs/planning/DECISION_LOG.md` (DEC-018 append)

No source, test, package, lockfile, environment, migration, schema, provider,
service, deployment, or legacy file is changed.

## Verification performed

Documentation verification passed:

- `git diff --check`: PASS, no output for tracked changes.
- Supplemental `git diff --no-index --check /dev/null <new-document>` for all
  three untracked documents: PASS, no whitespace errors. The expected exit
  status `1` means a new file differs from `/dev/null`.
- `git status --short --branch`: PASS for scope; two modified and three
  untracked files, all five authorized documentation paths.
- `git diff --stat`: tracked changes only, `2 files changed, 90 insertions(+),
  16 deletions(-)`. Git does not include the three untracked documents in this
  statistic.
- `git diff --name-status`: tracked changes only,
  `M docs/planning/CURRENT_PHASE.md` and
  `M docs/planning/DECISION_LOG.md`.
- Final core-document line accounting: architecture 947 lines and threat
  model 324 lines. The phase record includes this verification section and is
  intentionally not self-counted as a completion invariant.
- Internal Markdown links: PASS; every repository-relative target exists.
- Decision headings: PASS; 18 unique sequential headings, ending at DEC-018.
- Required API endpoints: PASS; all eleven exact method/path pairs are
  present.
- Threat traceability: PASS; 35 well-formed table rows each include a required
  test and residual risk.
- Action profiles: PASS; all eleven requested action identities are present.
- Error taxonomy: PASS; all 23 requested categories are present.
- MongoDB entity/field/index coverage: PASS for credential, preference,
  routing profile, catalogue, usage, audit, quota, and execution-lease design.
- Provider isolation: PASS for inactive-credential denial,
  OpenRouter/direct separation, direct no-cross-fallback, and no automatic
  provider switch.
- Timeout values and AI-3 through AI-8 ordering: PASS.
- Required threat-class terminology/coverage: PASS.
- Scoped high-confidence secret-pattern scan: PASS; no candidate key or
  private-key block in the five changed documents. No real environment file
  was read.
- Branch/HEAD recheck: PASS at
  `feature/multi-provider-ai-routing` /
  `eea4de2c1c476362a184604b13446d78e68fce4c`.

The first internal-link validation invocation failed before evaluating links
because an unescaped zsh pattern produced `bad pattern: *](`. The corrected
read-only command passed. A later terminology check found that the threat row
described cross-tenant credential substitution without the literal requested
term `IDOR`; the document was corrected and the complete check passed.

Typecheck, build, unit, integration, security, browser, and visual QA are not
required for documentation-only changes and are not run. No service, MongoDB,
worker, browser, or provider API is started. Final exact command results are
added only after execution.

## Approval closeout

The approval token
`PHASE_AI_2_MULTI_PROVIDER_ARCHITECTURE_AND_THREAT_MODEL_APPROVED` was accepted
on 2026-08-03. AI-2 human review is approved, and one exact five-path local
documentation commit is authorized with subject
`Document multi-provider AI architecture`.

The commit hash is intentionally not inserted into this same commit. It is
verified directly from Git after commit so closeout does not require a second
reconciliation commit.

AI-3 remains inactive and requires separate authorization. This closeout does
not authorize implementation, provider calls, provisioning, deployment, push,
pull request, or merge.
