# AI-3 — Vault, preference, API, and migration foundation

- Prompt ID: `CLH-AI-3-VAULT-PREFERENCE-ROUTING-FOUNDATION`
- Date: 2026-08-03
- Branch: `feature/multi-provider-ai-routing`
- Starting commit: `68e3dee9a740a17c55b3a932f41cdbfb01c99922`
- Starting subject: `Document multi-provider AI architecture`
- Status: `COMPLETE / HUMAN-APPROVED / LOCALLY COMMITTED`
- Approval token required:
  `PHASE_AI_3_VAULT_PREFERENCE_ROUTING_FOUNDATION_APPROVED`
- Approval token accepted: `YES`
- Human review: `APPROVED`
- Local implementation commit:
  `AUTHORIZED AS ONE EXACT 32-PATH LOCAL COMMIT`
- AI-4 status: `INACTIVE / REQUIRES SEPARATE AUTHORIZATION`
- Real provider/vault key: not added, accessed or called
- Push/pull request/merge/deployment: not authorized and not performed
- Visual QA: not applicable; this phase has no React or other visible changes

## Assumptions and ambiguities

- `disabled` is the explicit no-provider execution state. It is not a
  credential provider.
- Gemini Direct is the only callable provider in AI-3. The other accepted
  identities are persisted and reported as unavailable but have no adapter or
  execution path.
- The routing-foundation and administrator-Gemini compatibility flags are off
  by default. Enabling routing is a separate operator cutover after per-user
  preference migration or explicit activation.
- A credential replacement intentionally invalidates old snapshots. The user
  must reactivate the replacement so the authoritative preference records the
  new secret version.
- MongoDB transactions and replica-set semantics remain available, matching
  the existing repository and test mechanism.
- JavaScript cannot prove zeroization of immutable string copies. Mutable
  plaintext buffers and decoded cryptographic material are cleared where the
  runtime permits.
- A provider request already accepted externally cannot be recalled. The
  execution gate and deletion fence prevent new calls after current-state
  invalidation.

## Repository inspection

The mandatory pre-flight passed before any edit:

- branch `feature/multi-provider-ai-routing`;
- exact HEAD `68e3dee9a740a17c55b3a932f41cdbfb01c99922`;
- subject `Document multi-provider AI architecture`;
- clean worktree and empty index; and
- no merge, rebase, cherry-pick, or revert in progress.

Inspection was limited to the active repository. It covered the controlling
AI architecture, threat model, decisions, current-phase and AI-1/AI-2 phase
records; backend environment parsing and the example file; shared crypto,
logging, error, transaction, authentication, Origin/CORS, rate-limit and
validation conventions; user/session models; AI gateway, provider contracts,
Gemini adapter, quota and usage persistence; job model, queue, worker,
handlers and all Resume/Interview/Learning enqueue paths; ownership, security,
AI transport, persistence, Quiz-secrecy and work-fence tests. No legacy sibling
project and no `backend/.env` content was accessed.

## Architecture mapping

The implementation preserves the existing React/Vite frontend,
Express/TypeScript backend, MongoDB database, embedded queue, shared AI
gateway, direct Gemini adapter, quota reconciliation, provider JSON Schema,
strict Zod output validation, feature semantic validation, ownership fences,
and Quiz answer secrecy.

AI-3 adds isolated backend modules for the key vault, provider identity,
credential/preference/profile/audit/lease persistence, provider APIs, routing
snapshot compilation and execution authorization. The shared Gemini adapter
accepts an optional ephemeral credential handle; absent that handle, the
unchanged environment Gemini path is used. No dependency, package manifest,
database provider, authentication provider, frontend design system, or second
AI adapter was added.

## Encryption design implemented

- Optional `BYOK_ENCRYPTION_KEY` current-key configuration and comma-separated
  decrypt-only `BYOK_ENCRYPTION_KEY_PREVIOUS` ring.
- Strict `v<positive-integer>:<unpadded-base64url-32-bytes>` parsing with
  placeholder, version, duplicate, padding, alphabet and length rejection.
- AES-256-GCM using Node crypto, random 12-byte nonce and 16-byte tag.
- Separate unpadded Base64URL ciphertext, nonce and tag fields.
- AAD version 1 with the exact value
  `clh|ai-credential|aad-v1|credentialId|userId|provider|secretVersion|keyVersion`.
- Bound encrypt, decrypt, re-encrypt, suffix-mask and mutable-buffer clearing
  functions.
- Normalized decryption failure with no cryptographic detail in public errors.
- A fixed-nonce deterministic vector, random-nonce sampling, tamper and all
  AAD-swap cases are covered by tests.

## Models and indexes

### `AiCredential`

Stores owner, strict provider, label, bounded masked suffix, secret and row
revisions, lifecycle/validation state, validation metadata, replacement and
deletion timestamps, and the separated encrypted-secret fields. Encrypted
fields and the internal lease fence are excluded from ordinary queries. There
is no plaintext or active field.

Indexes enforce one non-deleted owner/provider row, owner/state lookup, and
key-version/state rotation lookup. State middleware permits only the approved
configured/valid/invalid/deleting/deleted transitions. A deleted tombstone
permits a future live row under the documented partial-index contract.

### `AiProviderPreference`

One unique document per owner is authoritative. Cross-field validation
requires disabled/none with no credential references, or Gemini Direct with
exactly one user-managed or administrator-managed credential source.
Activation is a transaction with revision compare-and-set.

### `AiRoutingProfile`

Profiles are unique by owner/version with at most one active marker per owner.
Published configuration is immutable. Replacement retires the current row,
creates a new version, and atomically advances the preference and revision.
AI-3 stores only Gemini Direct model, timeout, token-ceiling, validator,
deadline and zero-cost policy fields.

### `SecurityAuditEvent`, execution lease and mutation receipt

Audit events are strict, content-free, owner-bound records with safe provider,
revision, normalized outcome/reason, request ID, optional hashed network
metadata and TTL. The schema rejects unknown prompt and cryptographic fields.

Execution leases contain only credential/version and routing/job/attempt/
worker identifiers plus state and timestamps. Unique attempt, credential/state
and TTL indexes are declared. Acquisition is fenced against credential
deletion/replacement and is idempotent for the same attempt. Release is safe
and pending deletion completes only after active leases drain. Expired leases
are cleaned by the job-system maintenance timer.

Mutation receipts store only an HMAC of each idempotency key, operation state,
safe response metadata and TTL.

## Credential and provider APIs

Implemented:

- `GET /api/v1/ai/providers`
- `PUT /api/v1/ai/providers/:provider/credential`
- `POST /api/v1/ai/providers/:provider/test`
- `PATCH /api/v1/ai/providers/:provider/activate`
- `DELETE /api/v1/ai/providers/:provider/credential`
- `GET /api/v1/ai/routing`

All routes use existing Bearer authentication and owner IDs derived from the
authenticated request. Mutations add exact Origin enforcement, endpoint rate
limits, strict Zod input, idempotency keys and revision requirements where
applicable. Responses inherit private `no-store`, return only safe metadata,
and expose ETag for revision workflows. GET requests are read-only and return
an explicit unconfigured disabled view without creating database records.

Only Gemini Direct accepts credential operations. Connection testing decrypts
the stored owner credential into a bounded ephemeral handle and reuses the
existing Gemini adapter with fixed synthetic minimal content. Tests stub
`fetch`; no real provider call or key was used.

## Activation and revision behavior

Activation validates foundation enablement, provider availability, active
routing profile, credential source and current valid credential inside a
transaction. The preference update is guarded by the submitted revision. Two
parallel activations with the same revision produce exactly one success and
one safe conflict. Disabling AI removes all credential references.

Replacement requires the current credential revision, encrypts with a fresh
nonce, increments both secret and row revisions, clears validation state and
makes old snapshots stale. Deletion transitions to `deleting`, disables any
referencing preference, increments the lease fence, blocks new leases, drains
active leases, removes encrypted material, and is safely repeatable without
revealing existence.

## Routing snapshot and execution gate

The centralized enqueue boundary compiles version-1 snapshots for every
existing AI job type when the foundation is enabled. Snapshots contain only
the accepted owner/action/provider/profile/preference/credential-reference,
model, token, timeout and deadline metadata. They contain no credential,
encrypted material, environment value, request body or authorization header.

The job schema validates the strict snapshot and rejects all update attempts
to the snapshot or nested fields. Idempotent enqueue and worker retry return
the stored snapshot rather than recompiling it.

Immediately before quota reservation or a provider call, the gateway verifies
the snapshot owner, deadline, provider, preference revision, routing-profile
identity/version/model, credential source, credential state and exact secret
version. User-managed execution then acquires the fenced lease and decrypts
into an ephemeral handle. Provider change, AI disablement, replacement,
deletion/deleting state, profile/model invalidation, deadline expiry,
decryption failure and unsupported provider selection reject before a provider
call. Stale failures persist only safe audit metadata.

## Gemini compatibility, migration and rollback

Default behavior remains the pre-AI-3 environment Gemini flow:

- `AI_ROUTING_FOUNDATION_ENABLED=false` by default;
- missing BYOK configuration does not affect `GEMINI_API_KEY`/`GEMINI_MODEL`;
- gateway calls without an enabled snapshotted job keep the existing direct
  Gemini behavior; and
- no environment key is copied to or returned from MongoDB.

Cutover prerequisites are: configure and back up a valid current BYOK key;
validate transaction/index readiness; create or explicitly activate each
eligible user preference as user-managed or approved administrator-managed;
confirm a current active profile; then enable the routing foundation.
Administrator-managed activation stores only policy version metadata and is
allowed only when its separate compatibility flag and environment Gemini key
are present. It is never a fallback after user-managed failure.

Rollback is to stop enqueue/workers, disable the routing-foundation and
administrator-compatibility flags, and resume the unchanged environment
Gemini path. Existing snapshotted jobs remain readable. When the foundation is
enabled, legacy unsnapshotted jobs fail with the safe
`stale_routing_snapshot` classification and are not silently routed. No data
migration was executed in AI-3, and `GEMINI_API_KEY`/`GEMINI_MODEL` were not
renamed or removed.

## Tests and exact results

All commands were run from the repository root unless the command explicitly
targets the backend workspace.

- Focused AI-3 suites: 5 files, 77/77 tests passed.
  - vault configuration: 5;
  - AES-GCM/key-ring vault: 27;
  - models/indexes: 11;
  - provider API/ownership/Origin/revision/concurrency/secret safety: 17;
  - routing/profile/snapshot/gate/lease/compatibility: 17.
- Existing targeted AI/job contracts: 5 files, 56/56 passed.
- Existing targeted ownership/security contracts: 7 files, 39/39 passed.
- `npm run test:unit`: 9 files, 74/74 passed.
- `npm run test:integration`: 11 files, 107/107 passed.
- `npm run test:security`: 4 files, 35/35 passed.
- `npm run typecheck`: passed for frontend, backend and shared types.
- `npm run build`: passed for frontend and backend. Vite emitted its existing
  React Router directive and bundle chunk-size warnings.
- `npm test`: 24 files, 216/216 passed.
- `npm run test:ci`: production and test typechecks passed; coverage run
  passed 24 files and 216/216 tests. Aggregate instrumented coverage was
  63.94% statements, 69.33% branches, 78.94% functions and 63.94% lines.

The expected express-rate-limit diagnostic for the spoofed
`X-Forwarded-For` security test was printed while that test passed. No test was
skipped, weakened or deleted.

## Security evidence

- Synthetic canary credentials do not appear in API responses, ordinary
  credential queries, raw database plaintext fields, jobs, routing snapshots,
  usage events or security-audit events.
- Encrypted fields are absent from ordinary queries and require explicit
  privileged selection at the execution boundary.
- Tampered ciphertext/tag, wrong keys and every AAD binding swap fail with the
  same normalized error.
- Foreign and missing-owner credential tests, activation and deletion return
  equivalent safe behavior; foreign reads show only the caller's state and
  ownership override fields are rejected.
- Unsupported providers cannot save, activate or execute and make no adapter
  call.
- Stale snapshots fail before credential resolution, lease acquisition or
  provider fetch as applicable.
- No real credential, provider call, frontend runtime, browser, cloud system,
  deployment or legacy project was accessed.

## Files changed

Configuration and existing boundaries:

- `backend/.env.example`
- `backend/src/config/env.ts`
- `backend/src/config/security.ts`
- `backend/src/middleware/rateLimit.ts`
- `backend/src/jobs/job.model.ts`
- `backend/src/jobs/job.queue.ts`
- `backend/src/jobs/job.system.ts`
- `backend/src/modules/ai/ai.routes.ts`
- `backend/src/modules/ai/aiGateway.service.ts`
- `backend/src/modules/ai/providers/gemini.provider.ts`
- `backend/src/modules/ai/providers/provider.types.ts`

AI-3 modules:

- `backend/src/modules/ai/credentialVault.ts`
- `backend/src/modules/ai/aiProvider.types.ts`
- `backend/src/modules/ai/aiCredential.model.ts`
- `backend/src/modules/ai/aiProviderPreference.model.ts`
- `backend/src/modules/ai/aiRoutingProfile.model.ts`
- `backend/src/modules/ai/securityAuditEvent.model.ts`
- `backend/src/modules/ai/aiCredentialExecutionLease.model.ts`
- `backend/src/modules/ai/aiMutationReceipt.model.ts`
- `backend/src/modules/ai/aiRequestGuards.ts`
- `backend/src/modules/ai/aiProvider.schemas.ts`
- `backend/src/modules/ai/aiProvider.controller.ts`
- `backend/src/modules/ai/aiProvider.service.ts`
- `backend/src/modules/ai/aiRoutingSnapshot.ts`
- `backend/src/modules/ai/aiRouting.service.ts`

Tests and planning:

- `backend/src/tests/unit/aiVaultConfig.test.ts`
- `backend/src/tests/unit/credentialVault.test.ts`
- `backend/src/tests/integration/aiFoundationModels.integration.test.ts`
- `backend/src/tests/integration/aiProviderApi.integration.test.ts`
- `backend/src/tests/integration/aiRoutingFoundation.integration.test.ts`
- `docs/planning/CURRENT_PHASE.md`
- `docs/planning/PHASE_AI_3_VAULT_PREFERENCE_ROUTING_FOUNDATION.md`

No frontend source, package manifest, lockfile, decision-log entry or real
environment file changed.

## Known limitations and residual risks

- Only Gemini Direct and disabled behavior are executable. OpenRouter,
  OpenAI, Anthropic and DeepSeek remain planned and unavailable.
- No catalogue, paid routing, price/spend controls, streaming, Settings UI or
  direct-provider model catalogue exists in AI-3.
- BYOK protects credentials at rest but a compromised authorized backend or
  worker process can observe a credential during its bounded provider call.
- Immutable JavaScript string copies cannot be guaranteed zeroized.
- Database and encryption-key compromise together defeats the at-rest
  boundary; secret-manager and backup operations remain deployment work.
- In-flight external requests cannot be recalled after provider acceptance.
- Cutover requires explicit per-user migration/activation. Enabling the gate
  without that preparation safely disables or stales those users' new jobs.
- This phase created migration and rollback foundations and tests; it did not
  perform a production migration or deployment.

## AI-4 readiness

AI-3 provides the provider identities, vault, persistence, owner/revision API
contracts, immutable profiles and snapshots, execution gate, audit trail,
leases, and explicit Gemini compatibility boundary needed by a separately
authorized next phase. Human review accepted the AI-3 diff and approval token;
AI-4 nevertheless remains inactive until separately authorized. Any second
provider, catalogue, paid routing, UI, cloud or deployment work remains
outside this phase.

## Decision log

No new architectural decision was discovered. The implementation follows
DEC-017 and DEC-018. MongoDB index syntax, read-only GET behavior and
lease-maintenance scheduling are implementation details recorded here rather
than new decisions.
