# Phase 15 Security and Privacy Finding Register

## Register status

- Baseline: `da3deb50cdfd2f9130ca0e3ce4fbea1cc08d8a51`
- Audit pass: Phase 15A — Threat Model, Ownership Map, and Validated Audit
- Production and test changes: prohibited in this pass
- Confirmed Critical: 0
- Confirmed High: 0
- Confirmed Medium: 3
- Confirmed Low: 2
- Informational observations: 5
- Rejected candidates: 7
- Deferred candidates: 3
- Accepted risks: 2
- Required review token:
  `PHASE_15A_SECURITY_PRIVACY_AUDIT_APPROVED`

## Confirmed findings

### P15-001 — Concurrent uploads can exceed the per-user storage quota

- Severity: Medium
- Confidence: High
- Status: Validated; repair requires separate authorization
- Affected paths and lines:
  - `backend/src/modules/assets/asset.service.ts:37-69`
  - `backend/src/modules/assets/asset.service.ts:71-124`
  - `backend/src/modules/assets/asset.routes.ts:44-49`
- Entry point: authenticated `POST /api/v1/assets`; the same asset creation
  service is also used by resume and learning PDF uploads.
- Source: an authenticated user can coordinate several individually valid
  multipart uploads.
- Broken control: `assertAssetQuota` calculates current usage in a separate
  aggregate query. There is no per-user atomic reservation or serialization
  linking that observation to the subsequent storage write and asset create.
- Sink or asset: local disk capacity, S3 storage/cost, and the
  `ASSET_USER_QUOTA_BYTES` account boundary.
- Attack path:
  1. the attacker authenticates and prepares multiple purpose-valid files;
  2. concurrent requests pass the global and any domain rate limit;
  3. each request aggregates the same pre-upload asset total;
  4. each request independently decides the quota allows its file;
  5. each writes a distinct server-generated object and creates an asset; and
  6. cumulative committed bytes can exceed the configured user quota.
- Authentication requirements: ordinary authenticated account.
- Attacker capability: concurrent HTTP requests and valid magic bytes; no
  ownership bypass, storage key control, or privileged role is required.
- Impact: bounded resource exhaustion and storage cost beyond a control that
  operators and users reasonably expect to be enforced.
- Likelihood: realistic. The interleaving is deterministic under sufficient
  concurrency, although the global 300-request/15-minute default and per-file
  size limits cap one account's short-term effect.
- Validation evidence:
  - the quota aggregate and later write/create are distinct asynchronous
    operations;
  - storage keys are unique, so concurrent writes do not conflict;
  - the asset model has no atomic per-user byte counter;
  - no quota-concurrency test exists; and
  - the relevant security, ownership, and integration suites pass but do not
    exercise this interleaving.
- Existing mitigations:
  - authentication;
  - 15 MB global default and purpose-specific file limits;
  - single-file multipart limit;
  - MIME and magic-byte validation;
  - server-generated storage keys;
  - global and domain rate limits; and
  - object cleanup when database creation fails.
- Proposed minimal repair scope:
  - introduce an atomic per-user quota reservation record or equivalent
    conditional counter;
  - reserve bytes before object write;
  - release a reservation on storage/database failure and on deletion;
  - reconcile existing active/temporary assets during rollout; and
  - keep storage writes outside MongoDB transactions while making reservation
    compensation explicit.
- Likely production files:
  - `backend/src/modules/assets/asset.service.ts`
  - one narrowly scoped quota model or existing-user quota field, subject to
    a separately approved design
  - deletion/cleanup paths that release reserved bytes
- Proposed tests:
  - a concurrent integration test proving only quota-fitting uploads commit;
  - failed storage and failed database-create compensation tests;
  - deletion and temporary-cleanup quota release tests; and
  - a cross-user test proving one user's counter cannot affect another's.
- Residual risk: a process crash between an external object write and
  reservation reconciliation requires an idempotent repair/reconciliation
  path.
- Separate authorization required: Yes.

### P15-002 — Session revocation does not invalidate issued access tokens

- Severity: Low
- Confidence: High
- Status: Validated; repair or explicit acceptance requires separate
  authorization
- Affected paths and lines:
  - `backend/src/middleware/authenticate.ts:19-55`
  - `backend/src/modules/auth/auth.service.ts:210-233`
  - `backend/src/modules/users/user.controller.ts:119-145`
  - `backend/src/modules/auth/token.service.ts:14-25`
  - `backend/src/config/env.ts:96-100`
- Entry points:
  - `POST /api/v1/auth/logout`
  - `POST /api/v1/users/logout-all`
  - every subsequently accessed authenticated route
- Source: an attacker already possesses an unexpired access token for a
  session that the owner revokes.
- Broken control: the access token contains `sid`, but `authenticate` does not
  check that the referenced `AuthSession` still exists, is unexpired, and is
  not revoked.
- Sink or asset: all private endpoints authorized by the bearer token during
  its remaining lifetime.
- Attack path:
  1. the attacker obtains a valid access token through an independent
     compromise;
  2. the owner logs out or chooses logout-all;
  3. the server revokes the refresh-session record and clears the cookie;
  4. the attacker presents the already issued access token; and
  5. the API validates the JWT and active user but not the revoked session,
     accepting the token until expiry.
- Authentication requirements: possession of a current access token.
- Attacker capability: replay the token; no refresh cookie is required.
- Impact: the owner cannot immediately terminate a stolen token through
  logout or logout-all. The default residual window is at most 15 minutes and
  the configured range is 5–60 minutes.
- Likelihood: low-to-moderate because a valid token must already be
  compromised. Impact is bounded by the short access-token TTL.
- Validation evidence:
  - session revocation writes `revokedAt`;
  - access-token validation reads the user and password-change cutoff but no
    session record;
  - password changes do invalidate earlier tokens through `passwordChangedAt`,
    proving only logout/logout-all have this gap; and
  - current auth integration tests cover register/login/refresh and invalid
    credentials but not post-revocation access-token use.
- Existing mitigations:
  - short access-token lifetime;
  - active-account lookup on every request;
  - password-change cutoff;
  - refresh-token hashing, rotation, reuse detection, and revocation;
  - browser memory-only access-token storage; and
  - logout clears local browser authentication even when the request fails.
- Proposed minimal repair scope:
  - either check the `sid` session record in `authenticate`, or introduce a
    documented low-cost session/version revocation mechanism;
  - preserve the password-change cutoff and current generic 401 behavior; and
  - decide explicitly whether ordinary logout and logout-all have identical
    access-token revocation semantics.
- Likely production files:
  - `backend/src/middleware/authenticate.ts`
  - potentially a narrowly scoped auth-session helper
- Proposed tests:
  - an access token is rejected after ordinary logout;
  - all access tokens are rejected after logout-all;
  - a different active session remains valid if ordinary logout is intended
    to revoke only one session;
  - password-change invalidation remains intact; and
  - foreign or fabricated `sid` values return a generic authentication error.
- Residual risk: per-request session lookup adds database availability and
  latency cost; a cached or versioned alternative adds consistency tradeoffs.
- Separate authorization required: Yes.

### P15-003 — Concurrent refresh rotation weakens replay protection

- Severity: Medium
- Confidence: High
- Status: Validated; repair requires separate authorization
- Affected paths and lines:
  - `backend/src/modules/auth/auth.service.ts:131-207`
  - `backend/src/modules/auth/authSession.model.ts:24-64`
  - `frontend/src/api/apiClient.ts:56-57`
  - `frontend/src/api/apiClient.ts:205-224`
- Entry point: concurrent `POST /api/v1/auth/refresh` requests using the same
  valid refresh cookie, such as two browser tabs bootstrapping together.
- Source: two requests can read the same session and current token hash before
  either save completes.
- Broken control: refresh rotation is a read/compare/mutate/save sequence with
  no atomic compare-and-swap, session version key, or cross-context
  serialization. The frontend deduplicates refresh only inside one JavaScript
  application instance.
- Sink or asset: refresh-token one-use semantics, private API access, and
  refresh-session availability.
- Attack/failure path:
  1. two browser contexts share the same valid HttpOnly refresh cookie;
  2. both load the same AuthSession and pass the supplied-hash comparison;
  3. each generates a different next token and saves its hash;
  4. response-cookie order can differ from database-save order; and
  5. a benign browser can retain a token whose hash is no longer current,
     causing the next refresh to trigger reuse revocation; and
  6. if one request carries a copied token, both the legitimate user and the
     attacker receive fresh access tokens before either use is recognized as
     replay.
- Authentication requirements: possession of the valid refresh cookie in the
  same browser profile, or an attacker racing a copied refresh token.
- Attacker capability: coordinate refresh timing; no user ID or session ID
  control beyond the signed token is required.
- Impact: the ordinary multi-tab path can force reauthentication. In the
  hostile race, an attacker who already stole a valid refresh token can obtain
  a fresh access token despite the intended rotate-on-use control. The race
  does not create the initial credential compromise or elevate privilege, and
  only one rotated refresh token remains canonical.
- Likelihood: benign concurrency is realistic across tabs or simultaneous
  bootstrap requests. The disclosure branch additionally requires theft of a
  valid refresh token and precise timing.
- Validation evidence:
  - both requests perform `findById` and compare the same mutable hash before
    a non-conditional `save`;
  - the schema disables the Mongoose version key, so optimistic concurrency
    does not reject the later save;
  - the browser's refresh promise is module-local and cannot coordinate
    separate tabs; and
  - auth integration tests do not exercise concurrent refresh.
- Existing mitigations:
  - frontend single-instance refresh deduplication;
  - short access-token TTL;
  - refresh hashing and rotation;
  - reuse detection; and
  - generic failure responses.
- Proposed minimal repair scope:
  - design an atomic refresh-token claim/rotation operation;
  - preserve replay detection without treating a legitimate simultaneous
    refresh as an unrecoverable family compromise;
  - define bounded concurrency/grace semantics explicitly; and
  - never store or return plaintext refresh tokens outside the existing
    cookie response.
- Likely production files:
  - `backend/src/modules/auth/auth.service.ts`
  - potentially `backend/src/modules/auth/authSession.model.ts`
- Proposed tests:
  - two simultaneous refresh requests using the same cookie;
  - exactly one canonical rotation outcome remains usable;
  - a stale token outside any approved concurrency window revokes or rejects
    according to the chosen policy;
  - unrelated sessions remain valid; and
  - frontend single-instance deduplication remains unchanged.
- Residual risk: any grace window trades a bounded replay window against
  multi-context availability and must be documented.
- Separate authorization required: Yes.

### P15-004 — Production API origins silently fall back to HTTP localhost

- Severity: Medium
- Confidence: High
- Status: Validated configuration-dependent finding; repair requires separate
  authorization
- Affected paths and lines:
  - `frontend/src/api/apiClient.ts:6-9`
  - `backend/src/config/env.ts:103-105`
  - `backend/src/config/env.ts:235-361`
  - `backend/src/modules/assets/asset.service.ts:183-195`
  - `frontend/.env.example:1`
- Entry points:
  - every browser API request when a production frontend build omits
    `VITE_API_URL`; and
  - local private-asset signed URL construction when production omits
    `API_PUBLIC_ORIGIN`.
- Source: missing production environment configuration.
- Broken control: both origins have development-friendly
  `http://localhost:8000` defaults, and neither frontend build logic nor
  backend production environment validation fails closed when that default is
  active.
- Sink or asset:
  - login/register credentials, access tokens, and authenticated API traffic
    from the browser; and
  - short-lived private asset signatures generated by the backend.
- Attack/failure path:
  1. a production build/deployment omits one or both origin variables;
  2. the application silently selects HTTP localhost instead of rejecting the
     configuration;
  3. the deployed browser sends auth input or bearer traffic to port 8000 on
     the user's own machine, or fetches a signed asset capability there; and
  4. a process controlling that local port can observe the request.
- Authentication requirements: none for login credential exposure; a signed
  capability or access token exists for authenticated flows.
- Attacker capability: control a service on the user's local port 8000 after
  the deployment is misconfigured. The deployment omission is an operator
  precondition, not a remote attacker action.
- Impact: credential, bearer-token, or signed-capability disclosure to the
  wrong origin, plus complete application unavailability.
- Likelihood: configuration-dependent but realistic because both defaults
  allow production build/start to continue and no tracked deployment proves
  the variables are always supplied.
- Validation evidence:
  - the frontend fallback is unconditional on `import.meta.env.PROD`;
  - `API_PUBLIC_ORIGIN` has a default and production `superRefine` validates
    client origins and secrets but not this origin;
  - signed local URLs use `API_PUBLIC_ORIGIN` directly; and
  - tests stub explicit safe API URLs but no production-missing-variable test
    exists.
- Existing mitigations:
  - tracked example configuration documents the variable;
  - production `CLIENT_ORIGINS` must use HTTPS for non-local hosts;
  - local PDF fetch uses `credentials: "omit"` and `no-referrer`; and
  - a local attacker precondition limits reachability.
- Proposed minimal repair scope:
  - allow localhost defaults only in development/test;
  - make production frontend configuration fail at build/start when no
    explicit safe API base is available, or use an explicitly approved
    same-origin relative base;
  - require production `API_PUBLIC_ORIGIN` to use HTTPS and reject localhost
    unless an explicitly documented local production mode exists; and
  - keep URL normalization centralized.
- Likely production files:
  - `frontend/src/api/apiClient.ts`
  - `backend/src/config/env.ts`
  - possibly a narrow frontend environment helper
- Proposed tests:
  - production frontend configuration rejects missing/HTTP localhost base;
  - approved HTTPS and same-origin forms normalize correctly;
  - backend production environment rejects default/non-HTTPS public origin;
  - local test/development defaults remain available; and
  - signed URL construction uses the approved origin.
- Residual risk: edge rewrites and reverse proxies still require deployment
  smoke tests proving the externally visible origin.
- Separate authorization required: Yes.

### P15-005 — Registration reveals whether an email already has an account

- Severity: Low
- Confidence: High
- Status: Validated privacy gap; repair or explicit acceptance requires
  separate authorization
- Affected paths and lines:
  - `backend/src/modules/auth/auth.routes.ts:22-27`
  - `backend/src/modules/auth/auth.service.ts:78-89`
  - `backend/src/middleware/errorHandler.ts:40-56`
  - `backend/src/middleware/rateLimit.ts:57-62`
- Entry point: unauthenticated `POST /api/v1/auth/register`.
- Source: an attacker submits a syntactically valid target email.
- Broken control: registration returns a distinct 409
  `EMAIL_ALREADY_REGISTERED` code and message only when the address exists.
- Sink or asset: the account-membership status of a personal email address.
- Attack path:
  1. submit the target email with otherwise valid registration fields;
  2. observe `EMAIL_ALREADY_REGISTERED` for an existing account; and
  3. distinguish it from successful registration for an unused address.
- Authentication requirements: none.
- Attacker capability: make public registration requests and supply candidate
  email addresses.
- Impact: bounded user/account enumeration that can support targeted phishing
  or credential attacks. It does not reveal passwords, sessions, profile
  fields, or private application content.
- Likelihood: realistic, although registration is limited to 10 requests per
  hour per process/IP in the tested single-process configuration.
- Validation evidence:
  - `registerUser` performs an existence query before create;
  - the duplicate branch emits a stable distinct code and message;
  - `errorHandler` returns authored `AppError` code/message details; and
  - no test or documented product decision establishes this disclosure as an
    accepted registration requirement.
- Existing mitigations:
  - registration input validation;
  - per-IP registration and global rate limits;
  - no password or profile disclosure; and
  - generic login errors remain unaffected.
- Proposed minimal repair scope:
  - choose an explicit anti-enumeration registration contract, such as a
    neutral response with an out-of-band ownership flow;
  - preserve database uniqueness as the authoritative race-safe constraint;
  - keep login errors generic; and
  - document product implications for users who attempt to register twice.
- Likely production files:
  - `backend/src/modules/auth/auth.service.ts`
  - `backend/src/modules/auth/auth.controller.ts`
  - shared/frontend registration error handling only if the approved contract
    requires a visible wording change
- Proposed tests:
  - existing and unused addresses have indistinguishable public registration
    responses under the chosen contract;
  - concurrent duplicate registration remains race-safe;
  - login errors remain generic; and
  - rate limiting remains in place.
- Residual risk: email delivery or account-recovery UX can independently
  reintroduce account enumeration and must follow the same policy.
- Separate authorization required: Yes.

## Informational observations

### P15-I01 — Rate limiting is process-local unless deployment supplies a shared store

`express-rate-limit` is configured without a custom store. This is effective
for the tested single process, including spoofed `X-Forwarded-For` resistance,
but limits multiply across API replicas. No tracked deployment topology proves
that the service is single-instance or that a shared store is injected.

Classification: configuration-dependent risk, not a confirmed vulnerability.

### P15-I02 — E2E failure artifacts can retain synthetic private state

Playwright uses `screenshot: "only-on-failure"` and
`trace: "retain-on-failure"` under
`/private/tmp/career-learning-hub-phase14`. Data is synthetic and outside the
repository, video is off, and successful Phase 14 cleanup found no artifacts.
The service cleanup removes the runtime subtree but not the entire artifact
root, so failed runs require explicit artifact disposal.

Classification: operational privacy gap; synthetic data only.

### P15-I03 — Production edge and browser-header controls are not tracked

The API configures Helmet but intentionally disables CSP and sets
cross-origin resource policy for private asset delivery. There is no tracked
frontend deployment or edge configuration proving CSP, permissions policy,
TLS termination, redirect behavior, or proxy-header normalization.

Classification: deployment evidence gap, not a source-confirmed defect.

### P15-I04 — Private-domain and telemetry retention lacks a tracked policy

Resume, Interview, Activity, and Usage records are owner-scoped, but no tracked
policy states their retention periods, account-deletion behavior, or
user-initiated erasure workflow. The Resume and Interview APIs have no public
delete route, and Activity/Usage models have no TTL. Learning document cascade,
job retention, and auth-session retention are explicit, which makes the wider
privacy-lifecycle omission observable.

Classification: privacy documentation and lifecycle gap.

### P15-I05 — Security-sensitive code has single-contributor concentration

Git history reports one unique author for the repository and for the
application paths. No identity is recorded in this report. Automated
bus-factor and co-change analysis could not run because `networkx` is absent
and installation is prohibited.

Classification: security-maintenance continuity risk, not a product defect.

## Rejected candidates

| ID | Candidate | Rejection evidence |
| --- | --- | --- |
| R-001 | Public signed-download route is an IDOR | Signed URL issuance is owner-scoped; HMAC binds asset and expiry; local lookup requires local provider and active object; integration tests proved foreign source denial. |
| R-002 | Quiz answer key leaks before submission | Taking query explicitly selects `questionIndex prompt choices sourcePages -_id`; frontend contracts reject extra answer fields; answers and explanations appear only in submission/review. |
| R-003 | Storage keys permit path traversal | Keys are constructed from authenticated user ID, date, and UUID; local adapter resolves beneath a fixed root and rejects `..` or absolute escape. |
| R-004 | Request bodies permit mass assignment | Validation replaces request surfaces with parsed data; body schemas and controller assignments are allowlisted; the mass-assignment security tests passed. |
| R-005 | Prompt injection reaches a privileged sink | Private text is delimited as untrusted; the provider has no application tools; JSON, schema, references, and domain invariants are validated; React does not use unsafe HTML sinks. |
| R-006 | Refresh/logout endpoints are trivially CSRFable | Exact Origin middleware runs before routes, credentials are restricted to allowlisted origins, refresh cookie is SameSite=Lax and host-only, and the cookie path is narrow. |
| R-007 | Browser access tokens persist across sessions | The access token is kept in a React ref, centrally read, cleared on auth failure/logout, and no production localStorage, sessionStorage, or IndexedDB use was found. |

## Deferred candidates and coverage gaps

### D-001 — Current dependency advisory status

Phase 10 recorded one High and one Critical npm audit result without package
identities or triage. The current online advisory request failed in the
restricted network and the escalation was rejected because it would disclose
the dependency inventory externally without explicit approval. An offline
audit completed with 0 advisories across 606 dependencies, but offline cache
results do not establish current advisory coverage.

Status: unverified; blocks a complete dependency-security conclusion.

### D-002 — Malicious PDF parser resource exhaustion

Authenticated resume and learning uploads reach `pdf-parse` after byte,
purpose, MIME, and magic-byte validation. Page and extracted-text limits apply
during or after parsing. Parsing is queue-decoupled from the HTTP handler but
the worker starts in the same API process, so it is not CPU/memory isolation.
No safe fixture demonstrated excessive resource use, and current
dependency-advisory coverage is unavailable.

Status: reachable parser boundary, but no demonstrated broken control; defer
fuzzing/advisory validation.

### D-003 — Multi-replica worker lease fencing

Claims use configurable `JOB_WORKER_ID` rather than a distinct per-claim lease
token. Completion at least checks `lockedBy`, but retry and terminal-failure
updates do not bind the active lease identity at all; a stale worker can
requeue or fail a newer claim even when replica IDs are unique. No tracked
multi-worker deployment proves reachability.

Status: configuration-dependent and deferred until deployment topology is
known. Any future response must use per-claim fencing on completion, retry,
failure, heartbeat, and progress; unique worker identity alone is
insufficient.

## Accepted risks

### AR-001 — Short-lived signed URLs are bearer capabilities

An authorized signed URL can be used by anyone who receives it before expiry.
This is accepted for private document viewing because URL issuance is
owner-scoped, TTL is bounded, responses are no-store, the browser sends no
referrer or credentials, and the URL is replaced by a revocable blob URL.

### AR-002 — Private user content crosses the configured AI-provider boundary

Resume, job-description, interview, document, chat, and assessment content is
sent to Gemini only when the operator configures the provider and a user
initiates an AI workflow. The API sends constructed prompts, stores no raw
prompt in usage telemetry, validates structured output, and returns truthful
provider-unavailable states. Provider privacy terms and production data
governance remain deployment/operator responsibilities.

## Proposed repair batches

### Batch 15B-1 — Atomic asset quota enforcement

- Finding: `P15-001`
- Production scope: asset quota reservation, asset create/delete/temporary
  cleanup compensation, and the narrow data model chosen by an approved
  design.
- Likely production files:
  - `backend/src/modules/assets/asset.service.ts`
  - `backend/src/modules/assets/asset.model.ts` or one separately approved
    `backend/src/modules/assets/assetQuota.model.ts`
- Likely test files:
  - new `backend/src/tests/integration/assetQuota.integration.test.ts`
  - `backend/src/tests/unit/ownershipServices.test.ts`
- Runtime: isolated MongoDB replica set plus temporary local storage; no
  external provider.
- Regression gates: security, integration, complete backend, typecheck, and
  build.
- Security risk: incorrect compensation could leak quota or permit deletion
  of another user's reservation.
- Rollback risk: data reconciliation for already stored assets.
- Visible frontend change: No.
- Browser or human visual QA: Not expected.
- Proposed commit boundary: quota model/migration, service changes, tests, and
  evidence only.

### Batch 15B-2 — Session revocation and atomic refresh rotation

- Findings: `P15-002`, `P15-003`
- Production scope: authentication middleware, a narrow session lookup or
  revocation-version helper, and atomic refresh rotation semantics.
- Likely production files:
  - `backend/src/middleware/authenticate.ts`
  - `backend/src/modules/auth/auth.service.ts`
  - `backend/src/modules/auth/authSession.model.ts`
- Likely test file:
  - `backend/src/tests/integration/auth.integration.test.ts`, extended for
    logout, logout-all, password change, active parallel sessions, concurrent
    refresh, stale replay, and generic errors.
- Runtime: isolated MongoDB replica set; no frontend service required.
- Regression gates: auth integration, security suite, complete backend,
  frontend auth/API tests, typecheck, and build.
- Security risk: an overly broad check could revoke unrelated sessions or
  expose session existence.
- Rollback risk: database load/availability coupling on authenticated requests.
- Visible frontend change: No.
- Browser or human visual QA: Not expected unless logout semantics visibly
  change.
- Proposed commit boundary: auth middleware/helper, tests, and evidence only.

### Batch 15B-3 — Fail-closed production API-origin configuration

- Finding: `P15-004`
- Production scope: frontend API-base initialization and backend environment
  validation; no route or domain behavior.
- Likely production files:
  - `frontend/src/api/apiClient.ts`
  - `backend/src/config/env.ts`
- Likely test files:
  - `frontend/src/api/apiClient.test.ts`
  - new `backend/src/tests/unit/env.test.ts`
  - `backend/src/tests/integration/learningDocumentSource.integration.test.ts`
    for signed local URL origin behavior.
- Runtime: production-mode configuration tests plus a local HTTPS/same-origin
  smoke configuration; no external provider.
- Regression gates: focused configuration/API tests, complete frontend and
  backend suites, typecheck, and build with explicit production values.
- Security risk: an overly permissive exception can preserve the disclosure
  path; an overly strict rule can break valid same-origin deployment.
- Rollback risk: deployments relying on the implicit localhost default will
  fail fast and must supply an explicit value.
- Visible frontend change: No, except a deliberately failed misconfigured
  build/start.
- Browser or human visual QA: Browser smoke check only; visual QA not expected.
- Proposed commit boundary: origin validation, tests, example documentation,
  and evidence.

### Batch 15B-4 — Registration account-enumeration response

- Finding: `P15-005`
- Production scope: registration service/controller response semantics, plus
  frontend/shared wording only when the approved neutral flow requires it.
- Likely production files:
  - `backend/src/modules/auth/auth.service.ts`
  - `backend/src/modules/auth/auth.controller.ts`
  - frontend/shared registration handling only when required by the approved
    neutral contract
- Likely test files:
  - `backend/src/tests/integration/auth.integration.test.ts`
  - relevant frontend registration test in
    `frontend/src/routing/router.test.tsx` when public behavior changes
- Runtime: isolated MongoDB replica set; no external provider.
- Regression gates: focused auth/security/frontend registration tests,
  complete backend/frontend suites, typecheck, and build.
- Security risk: an incomplete neutral response can preserve a timing or
  content oracle; a careless workflow can enable unsolicited email.
- Rollback risk: users may receive less direct duplicate-registration
  feedback.
- Visible frontend change: Possible, depending on the approved neutral flow.
- Browser or human visual QA: Required if registration messaging changes.
- Proposed commit boundary: registration contract, focused tests, UI wording
  only when needed, and evidence.

## Evidence prerequisites outside repair batches

- Items: informational `P15-I01` through `P15-I05`; deferred `D-001`
  through `D-003`.
- Scope: obtain explicitly approved online advisory evidence; document
  deployment topology; decide distributed rate limiting and unique worker
  identity; define telemetry and artifact retention; and add contributor
  review ownership.
- Production changes: none until a validated sub-finding receives separate
  authorization.
- Runtime: deployment-specific; external AI calls remain unnecessary.
- Proposed commit boundary: governance and evidence first, then separate
  implementation commits for any validated product changes.
