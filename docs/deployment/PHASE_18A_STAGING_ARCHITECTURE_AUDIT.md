# Phase 18A Staging Architecture and Deployment Readiness Audit

- Prompt ID: `CLH-PHASE-18A-ACTIVATE-AND-AUDIT-STAGING-ARCHITECTURE-01`
- Closeout prompt ID:
  `CLH-PHASE-18A-OPERATOR-DECISIONS-AND-CLOSEOUT-01`
- Audit date: 2026-07-30
- Repository: `/Users/prabhathmalinda/Documents/Projects/Career Learning Hub`
- Activation branch: `phase-18-staging-deployment`
- Activation HEAD: `13c5c96fb4944715e0253b6ce43d68de878556e3`
- Result: `COMPLETED / APPROVED`
- Approval token:
  `PHASE_18A_STAGING_ARCHITECTURE_AUDIT_APPROVED`
- Token accepted: `YES`

## 1. Executive result

Phase 18 remains active and Phase 18A is `COMPLETED / APPROVED`. The operator
resolved OD-18A-001 through OD-18A-012 as
`RESOLVED / OPERATOR APPROVED` and accepted
`PHASE_18A_STAGING_ARCHITECTURE_AUDIT_APPROVED`.

The approved initial academic-staging topology and operating policy are:

- Vercel Hobby for the React/Vite static frontend.
- Render Free for the Express API and its embedded MongoDB-backed worker.
  Sleeping, cold starts, delayed first requests, and delayed jobs are accepted.
  Keep-awake traffic is prohibited. An always-on paid Render service requires
  separate approval and is required before a reliability-critical
  demonstration.
- MongoDB Atlas Free. Its storage, capacity, backup, and operational limits
  are accepted. Atlas Flex requires separate approval.
- A private AWS S3 staging bucket in the Singapore regional strategy, subject
  to billing alerts and the USD 10 monthly hard ceiling.
- Provider logs only initially. Sentry is deferred to Phase 18F and separate
  approval.
- Native Vercel and Render GitHub integrations, restricted to the approved
  branch with manual promotion. GitHub Actions is not authorized.
- Planned HTTPS hosts `staging.prabhathmalinda.com.lk` and
  `api-staging.prabhathmalinda.com.lk`, protected by Cloudflare Access or an
  equivalent deny-by-default control for the operator account only.
- The operator domain `prabhathmalinda.com.lk`, registered through LK Domain
  Registry, is `RESERVED — REGISTRY ACTIVATION PENDING`. DNS and live staging
  configuration must wait for activation.
- Synthetic data only, with the approved deletion and seven-day maximum
  retention limits. Live AI-provider data is disabled initially.

No application, test, package, lockfile, configuration, environment,
deployment, CI/CD, or infrastructure file changed. No deployment or
cloud-resource creation occurred, and no secret was read, generated, or
written.

Deployment is not yet authorized. B18A-001 is completed and approved. The
remaining blocking items require later approved work:

1. B18A-001 repaired the broad `storage/` rule with exact exceptions for four
   existing adapter files. Their checksums and behavior are unchanged;
   typechecks, storage tests, backend regression, and the production build
   passed. The repair is `COMPLETED / APPROVED`; approval token
   `PHASE_18_STORAGE_ADAPTER_TRACKING_REPAIR_APPROVED` is accepted.
2. The refresh cookie is `SameSite=Lax`; unrelated provider default domains are
   cross-site and cannot preserve the current browser refresh contract. Sibling
   custom subdomains, or a separately approved authentication/proxy change, are
   required.
3. P15-001 forbids unrestricted public registration and public-scale uploads.
   A tested access restriction must cover both the frontend and API before
   staging is exposed.
4. Production disables automatic index creation. The complete declared index
   set must be applied and verified before staging traffic.
5. Phase 18B remains
   `PLANNED / INACTIVE — READY FOR SEPARATE ACTIVATION`; Phase 19 remains
   `PLANNED / INACTIVE`.

## 2. Scope and authority

This audit was authorized to inspect Git, repository source, tracked examples,
tests, and documentation; verify the remote baseline; create the local Phase 18
branch; consult current official provider documentation; and change only:

- `docs/planning/CURRENT_PHASE.md`;
- `docs/planning/CAREER_LEARNING_HUB_MASTER_PLAN.md`;
- this audit document.

The activation/audit prompt was not authorized to deploy, provision, create
provider accounts, create or inject secrets, read actual environment files,
change product or test code, change package/configuration/deployment files, run
tests/builds/servers/provider CLIs, stage, commit, push, or activate Phase 18B
or Phase 19. The closeout prompt separately authorizes staging these three
documentation files and creating one local commit, but no push.

Conclusions use four labels:

- **Repository requirement** — directly established by tracked repository
  evidence, except where an ignored local implementation is explicitly called
  out.
- **Provider fact** — established by current official provider documentation
  accessed on 2026-07-30.
- **Recommendation** — an architecture judgment whose acceptance status is
  recorded explicitly.
- **Operator decision** — an operator-controlled choice whose approval status
  is recorded explicitly.

## 3. Verified Git baseline

| Check | Verified result |
|---|---|
| Starting branch | `main` |
| Local `main` | `13c5c96fb4944715e0253b6ce43d68de878556e3` |
| Starting subject | `Complete final repository and release-candidate review` |
| `origin/main` before and after fetch | `13c5c96fb4944715e0253b6ce43d68de878556e3` |
| Ahead/behind | zero / zero |
| Starting worktree | clean; nothing staged or untracked |
| Active Git operation | none: no merge, rebase, cherry-pick, revert, or bisect |
| Fetch | `git fetch origin main` succeeded after the sandbox-denied attempt was repeated with approved Git metadata access |
| Created branch | `phase-18-staging-deployment` |
| Branch HEAD after creation | `13c5c96fb4944715e0253b6ce43d68de878556e3` |
| Remote action | branch was not pushed |

## 4. Current application deployment architecture

### Repository evidence map

| ID | Repository evidence | Deployment conclusion |
|---|---|---|
| R01 | `package.json`; workspace package manifests | npm workspaces; Node `>=20.0.0`, npm `>=10.0.0`; React/Vite frontend and Express/TypeScript backend |
| R02 | `frontend/src/api/apiClient.ts`; `frontend/.env.example` | one public build-time API URL; production requires explicit non-local HTTPS; cookie credentials and one refresh retry |
| R03 | `backend/src/server.ts`; `backend/src/app.ts` | API initializes database, storage, job system, then listens on `PORT`; graceful shutdown and proxy configuration |
| R04 | `backend/src/config/env.ts`; `backend/.env.example` | fail-closed production origin/secret checks and the complete current runtime manifest |
| R05 | `backend/src/config/database.ts`; model files | MongoDB through Mongoose; production `autoIndex: false` |
| R06 | `backend/src/modules/health/` | liveness and dependency-aware readiness |
| R07 | `backend/src/config/security.ts`; auth service/controller | exact credentialed CORS and HttpOnly secure `SameSite=Lax` refresh cookie |
| R08 | asset controller/service/routes/upload validation and storage adapters | owner-scoped private assets, memory upload validation, local or S3 storage, short signed retrieval |
| R09 | job model/queue/worker/system/handlers | durable MongoDB queue with leases, retry, heartbeat, concurrency, and retention; worker embedded in API |
| R10 | request context, rate limiting, error handler, logger | request IDs, redacted structured logs, production error hiding, and process-local rate limits |
| R11 | migration CLI/runner/models | validation/dry-run/execute modes; transactions require replica set or sharded MongoDB |
| R12 | `tests/browser/`; Full Application Browser Testing guide | current browser suite is local-only and synthetic, starts its own replica set and servers, and has no portable npm script |
| R13 | `.gitignore`; `git ls-files`; `git check-ignore` | imported storage-adapter directory is ignored and absent from the commit |
| R14 | absence of tracked provider/Docker/workflow files | no Vercel, Netlify, Render, Railway, Docker, or GitHub Actions deployment definition exists |

### Service shape

The frontend is a client-rendered React single-page application. The backend is
a stateful-at-the-dependency-layer but filesystem-independent Express API when
S3 storage is selected. MongoDB holds application data, job state, job leases,
AI quotas, sessions, and migration records. The API process also runs the
background worker. Access tokens remain in frontend memory; refresh is through
an HttpOnly cookie.

The current staging shape is one frontend project, one API instance, one Atlas
cluster, and one private object-storage bucket. The approved initial Render
Free instance may sleep. Multiple API replicas are not approved because the
rate-limit store is process-local, worker identity defaults could collide, and
P15-001 does not permit public-scale or multi-instance operation.

## 5. Runtime command inventory

| Item | Confirmed requirement |
|---|---|
| Node | `>=20.0.0`; pin one provider-supported Node 20 LTS-compatible release rather than floating to an arbitrary newer major |
| npm | `>=10.0.0`; use lockfile-backed install in a later deployment phase |
| Frontend install context | repository root, because the frontend consumes the shared workspace |
| Frontend build | `npm run build --workspace @career-learning-hub/web` |
| Frontend output | `frontend/dist` (Vite default; no override is tracked) |
| Frontend runtime | static files with SPA history fallback to `index.html` |
| Backend build | `npm run build --workspace @career-learning-hub/api` |
| Backend output | `backend/dist`, confirmed by `backend/tsconfig.json` |
| Backend start | `npm run start --workspace @career-learning-hub/api`, which runs `node dist/server.js` in the workspace |
| Backend port | local default `8000`; provider may inject `PORT`, and the server reads it |
| Bind behavior | Node HTTP server listens on the configured port without a host restriction |
| Root build | `npm run build` builds all workspace packages with build scripts |

The frontend needs a later provider routing file for deep links. Both
[Vercel's Vite guidance](https://vercel.com/docs/frameworks/frontend/vite)
and
[Netlify's Vite guidance](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/)
state that SPA history fallback must be configured. No such deployment
configuration is currently tracked.

## 6. Health and readiness inventory

| Route | Meaning | Success | Failure |
|---|---|---|---|
| `GET /api/v1/health/live` | process liveness and shutdown state | `200` while not shutting down | non-success while shutting down |
| `GET /api/v1/health` | readiness alias | `200` only when all readiness checks pass | `503` with normalized component state |
| `GET /api/v1/health/ready` | dependency-aware readiness | `200` only when all readiness checks pass | `503` |

Readiness requires:

- MongoDB connection and ping;
- initialized private storage and a successful storage health check;
- the embedded job system to be ready when enabled;
- the process not to be shutting down.

Health routes have a dedicated limiter and are outside the global limiter.
The provider health-check path should be `/api/v1/health/ready`; uptime
monitoring may also query `/api/v1/health/live` to distinguish process
availability from dependency readiness. Health responses must not expose
credentials, private keys, storage keys, or owned-resource existence.

## 7. Database requirements

### Platform behavior

- MongoDB is mandatory; `MONGODB_URI` is required at startup.
- Transactional migration execution uses MongoDB transactions and therefore
  requires a replica set or sharded deployment. MongoDB documents that
  standalone deployments do not support transactions; Atlas clusters provide
  the managed deployment shape required here.
- Production sets `autoIndex: false`. Index creation is an explicit deployment
  prerequisite and cannot be left to application startup.
- The job queue depends on atomic find/update operations, leases, heartbeats,
  retry state, and TTL cleanup in MongoDB.
- Atlas network access must allow only the selected backend egress path where
  the provider makes that stable; never use an unrestricted network allowlist
  as the permanent configuration.
- Use a staging-only database user with least-privilege application access.
  Migration/index administration should use a separately scoped, temporary
  operator credential.

### Required declared index families

All Mongoose schema indexes must be materialized and verified before traffic.
The repository declares these deployment-significant families:

| Domain | Required index behavior |
|---|---|
| Users/auth | unique case-insensitive email; account status/time; unique refresh-token hash; session lookup; session TTL |
| Assets | owner/status/time and owner/purpose/time; checksum; unique provider/storage key; expiry lookup |
| Jobs | runnable status/time/priority; owner/time; sparse unique idempotency key; TTL |
| Activity/usage/AI quota | owner/time and resource/origin lookup; provider/model lookup; unique owner/day quota; TTL |
| Resume | owner/status/time; unique version number per resume; unique source asset where present; analysis/job lookup |
| Interview | owner/session/status/time; unique question fingerprint per session; generation/explanation/feedback job lookup; attempt history |
| Learning | unique document asset; processing/deletion job lookup; unique chunk order; conversation/message chronology; sparse client-request and response-job uniqueness |
| Flashcards/quizzes | request idempotency; generation-job uniqueness; stable set/quiz question order; attempt history |
| Migration | unique run ID; run status/time; manifest/time; unique legacy-source mapping; target lookup |

Exact definitions remain controlled by the model files. Phase 18C must use a
reviewed, repository-derived index application method; it must not infer index
names or drop existing indexes. Atlas tier limits and supported features must
be checked at provisioning. Official references:
[Atlas Free-cluster limits](https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/),
[Atlas Flex costs](https://www.mongodb.com/docs/atlas/billing/atlas-flex-costs/),
and
[MongoDB transactions](https://www.mongodb.com/docs/manual/core/transactions/).

## 8. Private-storage requirements

### Confirmed contract

- Assets are private and owner-scoped in MongoDB.
- Uploads enter memory, permit one file, enforce global and purpose-specific
  sizes, validate declared purpose/MIME type, inspect magic bytes, and compute
  SHA-256.
- Storage drivers are `local` and `s3`.
- Local storage writes below a configured private root and uses an
  application-signed retrieval route.
- The S3 adapter checks bucket access, uploads with SHA-256 checksum and
  `AES256` server-side encryption, deletes objects, and creates time-limited
  presigned GET URLs.
- Storage health is part of API readiness.

### Deployment conclusion

AWS S3 is the lowest-change confirmed staging target because the existing
adapter and SDK use its native contract. Keep the bucket private, block public
access, use a staging-only prefix/bucket, apply least-privilege object actions,
enable encryption, restrict CORS to the exact frontend origin only if direct
browser retrieval requires it, and configure lifecycle cleanup only after it
is reconciled with database retention.

Local storage is not recommended. Render's default filesystem is ephemeral;
its persistent disk is paid, single-instance-only, and changes deployment and
rollback behavior
([Render persistent disks](https://render.com/docs/disks)). Local storage
would also couple file durability to one API instance.

Cloudflare R2 is S3-compatible and supports presigned URLs, but its current S3
compatibility table marks `FULL_OBJECT` SHA-256 checksum behavior unsupported
while the app sends `ChecksumSHA256`. It is therefore **not confirmed as a
drop-in** without an approved provider-contract test and possibly code change:
[R2 S3 compatibility](https://developers.cloudflare.com/r2/api/s3/api/) and
[R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/).

Cloudinary is not supported by the current driver abstraction. Although it has
private/authenticated delivery controls, its asset/delivery semantics would
require a new adapter and privacy review. It is not recommended for Phase 18.

### Tracked-source blocker

`server.ts`, asset services, learning services, and health checks import the
storage factory. However, `git ls-files backend/src/modules/assets/storage`
returns no tracked paths and `git check-ignore` attributes all four local
adapter files to `.gitignore`'s `storage/` rule. A clean checkout cannot build
these imports. This must be resolved through a separately approved,
test-verified repository change before any backend deployment. The local
ignored files were inspected read-only; Phase 18A did not edit them.

## 9. Authentication, cookie, HTTPS and proxy requirements

- Production requires distinct access, refresh, and asset-signing secrets,
  each at least 32 characters, with known placeholders rejected.
- Access tokens remain in React memory and travel through the centralized
  Bearer client.
- The refresh token is a host-only HttpOnly cookie, `Secure` in production,
  `SameSite=Lax`, scoped to `/api/v1/auth`, with configured lifetime.
- Every staging endpoint must use HTTPS. `NODE_ENV` must be `production` so
  secure cookies, production validation, HSTS, redaction, and error hiding are
  active.
- Frontend and API must be same-site sibling hosts. The approved planned hosts
  are `https://staging.prabhathmalinda.com.lk` and
  `https://api-staging.prabhathmalinda.com.lk`. Vercel's `.vercel.app` and
  Render's `.onrender.com` defaults are unrelated sites and do not satisfy the
  current refresh-cookie contract.
- Do not broaden the cookie `Domain`; its host-only behavior is a useful
  boundary.
- `TRUST_PROXY_HOPS` must equal the verified number of trusted proxy hops.
  Leaving the production default at zero behind a provider proxy can make
  protocol/IP interpretation and IP-based rate limiting incorrect. Overstating
  it can trust attacker-supplied forwarding data.
- Phase 18D must verify `request.secure`, refresh-cookie attributes, client IP,
  spoofed forwarding headers, and request IDs through the actual provider
  chain before enabling browser traffic.

## 10. CORS requirements

The exact primary relationship is:

| Setting | Required relationship |
|---|---|
| Frontend origin | `https://staging.prabhathmalinda.com.lk` |
| API origin | `https://api-staging.prabhathmalinda.com.lk` |
| Frontend `VITE_API_URL` | API origin plus `/api/v1` |
| Backend `CLIENT_ORIGINS` | exact frontend origin only; no path, no trailing slash, no wildcard |
| Backend `API_PUBLIC_ORIGIN` | exact API origin only |
| Credentials | enabled |

The backend parses an exact comma-separated allowlist, rejects wildcard
origins, permits requests without an `Origin` header for non-browser/health
clients, exposes request ID and rate-limit headers, and allows the required
content/auth headers. Provider preview URLs must not be added with wildcards.
If preview deployments need API access, each exact origin needs a controlled
temporary entry or a separately approved preview architecture.

The access layer must be tested with browser preflight requests. Its own
authentication cookies/redirects must not prevent credentialed API fetches.
Cloudflare documents that one Access application can cover multiple domains
and preemptively issue authorization cookies for a small fixed domain set,
which is compatible in principle but still requires Phase 18E verification:
[Cloudflare Access authorization cookies](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/).

## 11. Job and background-processing requirements

- The worker is embedded in the API process; there is no separate production
  worker start script.
- With `JOB_WORKER_ENABLED=true`, startup must register handlers and mark the
  job system ready before readiness succeeds.
- Queue records are durable in MongoDB and use leases, heartbeats, retry
  attempts, concurrency limits, idempotency, and TTL retention.
- Maintenance scheduling is also process-local.
- The approved initial baseline is one Render Free API instance with one unique
  staging worker ID.
- A sleeping/free API delays queued work and can cause browser and health
  failures. Render documents that Free web services spin down after 15 minutes
  and may take about a minute to wake. The operator accepts cold starts,
  delayed first requests, and delayed jobs for initial academic staging:
  [Render Free limitations](https://render.com/docs/free).
- Synthetic keep-awake traffic is prohibited. Upgrade to an always-on paid
  Render service only with separate approval, and before any
  reliability-critical demonstration.
- Disabling the embedded worker without provisioning a separately implemented
  worker leaves jobs unprocessed. A separate worker is a later architecture
  change, not an environment-only switch.
- Multiple replicas would need unique worker IDs, a shared rate-limit store or
  accepted limitation, verified lease behavior, and resolution of P15-001.
  They are outside the current academic-MVP staging boundary.

## 12. Logging, monitoring and redaction requirements

The backend emits structured JSON to stdout/stderr, includes request IDs,
records path rather than query string, hashes client IP, and redacts keys,
authorization/JWT-like values, API-key patterns, and email-like content.
Production suppresses authored internal error messages. Request bodies and
user-generated content must never be added to logs.

Staging requirements:

- retain provider logs only for the approved bounded period;
- restrict log access to operators;
- alert on readiness failures, repeated 5xx, job failure/backlog, storage
  health, and restart/crash loops;
- preserve request IDs across provider and application logs;
- never log passwords, tokens, cookies, secrets, uploads, resume/document
  text, answers, job descriptions, prompts, or personal data;
- use synthetic identities only;
- verify provider log retention/export and region before acceptance.

Provider logs are the approved initial baseline and have a maximum seven-day
retention. Sentry is deferred to Phase 18F and requires separate approval plus
an approved dependency/source/configuration change because no Sentry SDK or
environment variable exists today. If later approved, default-deny event
payloads, disable or scrub request bodies, cookies, authorization, document
text, and user PII, use low sampling, and set bounded retention. The Express
SDK requires application instrumentation rather than environment injection:
[Sentry JavaScript/Node documentation](https://docs.sentry.io/platforms/javascript/).

## 13. Environment-variable manifest

No values are included. “Required” means required for the approved staging
topology, not merely whether the current schema has a default. `Client` means a
value may be compiled into browser code. Rotation is stated for staging.

### Frontend and core backend

| Exact name | Owner / class | Req. | Purpose and expected format | Secret / rotation | Client | Validation and order dependency |
|---|---|---:|---|---|---:|---|
| `VITE_API_URL` | frontend / public build-time | yes | absolute non-local HTTPS API URL ending in the API base path | no / on endpoint change | yes | frontend rejects missing/local/non-HTTPS production value; API domain and TLS first |
| `NODE_ENV` | backend / provider config | yes | runtime mode; staging must use production semantics | no / never | no | enum-validated at startup; set before all validation |
| `PORT` | backend / provider config | yes | provider-injected integer listen port | no / provider managed | no | integer range; provider supplies before start |
| `MONGODB_URI` | backend / database secret | yes | Atlas connection URI with staging database and scoped user | yes / on exposure, role or policy change | no | required URL-like connection string; Atlas/user/network/index readiness first |
| `CLIENT_ORIGINS` | backend / non-secret | yes | comma-separated exact HTTPS frontend origins | no / on origin change | no | production requires HTTPS and forbids wildcard; domain/TLS first |
| `API_PUBLIC_ORIGIN` | backend / non-secret | yes | exact external HTTPS API origin | no / on origin change | no | production requires HTTPS and no path; domain/TLS first |
| `TRUST_PROXY_HOPS` | backend / provider config | yes | verified non-negative trusted proxy-hop count | no / on network-path change | no | integer; current schema does not require nonzero in production; verify provider chain first |
| `LOG_LEVEL` | backend / non-secret | yes | supported structured-log severity | no / operational change | no | enum-validated; set before start |
| `REQUEST_LOGGING_ENABLED` | backend / non-secret | yes | boolean request-log control | no / never | no | boolean-coerced; redaction review first |
| `CORS_MAX_AGE_SECONDS` | backend / non-secret | optional | non-negative preflight cache seconds | no / never | no | integer validated; after exact origins |
| `HEALTH_CHECK_TIMEOUT_MS` | backend / non-secret | yes | positive dependency-check timeout in milliseconds | no / tuning change | no | integer validated; align provider health timeout |
| `SHUTDOWN_TIMEOUT_MS` | backend / non-secret | yes | positive graceful-shutdown budget in milliseconds | no / tuning change | no | integer validated; align provider termination grace |
| `SERVER_REQUEST_TIMEOUT_MS` | backend / non-secret | yes | positive request timeout in milliseconds | no / tuning change | no | integer validated |
| `SERVER_HEADERS_TIMEOUT_MS` | backend / non-secret | yes | positive header timeout in milliseconds | no / tuning change | no | must exceed keep-alive timeout |
| `SERVER_KEEP_ALIVE_TIMEOUT_MS` | backend / non-secret | yes | positive keep-alive timeout in milliseconds | no / tuning change | no | must be below headers timeout |

### Authentication, rate limits, and asset policy

| Exact name | Owner / class | Req. | Purpose and expected format | Secret / rotation | Client | Validation and order dependency |
|---|---|---:|---|---|---:|---|
| `JWT_ACCESS_SECRET` | backend / backend secret | yes | high-entropy signing material, minimum 32 characters | yes / on exposure and scheduled policy | no | required; placeholder rejected in production; generate/inject before start |
| `JWT_REFRESH_SECRET` | backend / backend secret | yes | distinct high-entropy refresh/session material | yes / on exposure and scheduled policy | no | required, minimum 32, distinct; rotating invalidates sessions |
| `ASSET_SIGNING_SECRET` | backend / storage secret | yes | distinct high-entropy private-link signing material | yes / on exposure and scheduled policy | no | required, minimum 32, distinct; storage before start |
| `ACCESS_TOKEN_TTL_MINUTES` | backend / non-secret | yes | positive access-token lifetime | no / policy change | no | integer validated |
| `REFRESH_TOKEN_TTL_DAYS` | backend / non-secret | yes | positive refresh-session/cookie lifetime | no / policy change | no | integer validated; align retention policy |
| `REFRESH_COOKIE_NAME` | backend / non-secret | yes | valid cookie name | no / disruptive rename only | no | non-empty; frontend relies on browser cookie behavior, not name |
| `BCRYPT_ROUNDS` | backend / non-secret | yes | password hashing work factor | no / security review | no | production minimum 12 |
| `GLOBAL_RATE_LIMIT_WINDOW_MS` | backend / non-secret | yes | positive global window in milliseconds | no / tuning change | no | integer; proxy verification first |
| `GLOBAL_RATE_LIMIT_MAX` | backend / non-secret | yes | positive request ceiling | no / tuning change | no | integer; process-local limitation accepted only for one instance |
| `HEALTH_RATE_LIMIT_MAX` | backend / non-secret | yes | positive health-route ceiling | no / tuning change | no | integer; monitoring cadence first |
| `ASSET_STORAGE_DRIVER` | backend / provider config | yes | supported driver identifier; recommended S3 | no / architecture change | no | enum `local` or `s3`; storage resources first |
| `ASSET_LOCAL_ROOT` | backend / non-secret | no for S3 | private local directory path | no / never | no | path accepted; must remain unused for recommended topology |
| `ASSET_MAX_FILE_SIZE_BYTES` | backend / non-secret | yes | positive upload ceiling in bytes | no / policy change | no | integer; P15-001 limits must not be weakened |
| `ASSET_USER_QUOTA_BYTES` | backend / non-secret | yes | positive per-user quota in bytes | no / policy change | no | integer; P15-001 limits must not be weakened |
| `ASSET_SIGNED_URL_TTL_SECONDS` | backend / non-secret | yes | short positive private-link lifetime | no / policy change | no | integer; storage contract first |

### Storage and AI

| Exact name | Owner / class | Req. | Purpose and expected format | Secret / rotation | Client | Validation and order dependency |
|---|---|---:|---|---|---:|---|
| `AWS_REGION` | backend / provider config | yes for S3 | AWS region identifier | no / resource move | no | required by current schema for S3; bucket first |
| `AWS_S3_BUCKET` | backend / provider config | yes for S3 | staging bucket name | operationally sensitive / resource change | no | required by schema for S3; bucket first |
| `AWS_ACCESS_KEY_ID` | backend / storage secret | conditional | scoped machine credential identifier when workload identity is unavailable | yes / on exposure and scheduled policy | no | optional in schema; credential mechanism must exist before storage health |
| `AWS_SECRET_ACCESS_KEY` | backend / storage secret | conditional | paired scoped machine credential material | yes / on exposure and scheduled policy | no | optional in schema; must be injected with its identifier |
| `AWS_S3_ENDPOINT` | backend / provider config | no for AWS S3 | absolute S3-compatible endpoint | no / provider change | no | optional URL; leave unset for native S3 |
| `AWS_S3_FORCE_PATH_STYLE` | backend / provider config | no for AWS S3 | boolean addressing mode | no / provider change | no | boolean-coerced; leave provider-appropriate |
| `AI_DEFAULT_PROVIDER` | backend / non-secret | yes | supported AI provider identifier | no / provider change | no | enum currently limited to Gemini |
| `GEMINI_API_KEY` | backend / backend secret | optional for startup; required for live AI | scoped staging AI credential | yes / on exposure and scheduled policy | no | optional startup validation; AI calls fail closed when absent; provision after core health |
| `GEMINI_MODEL` | backend / non-secret | yes for AI | approved model identifier | no / model change | no | non-empty string; compatibility/cost review first |
| `AI_REQUEST_TIMEOUT_MS` | backend / non-secret | yes | positive provider timeout in milliseconds | no / tuning change | no | integer validated |
| `AI_MAX_RETRIES` | backend / non-secret | yes | bounded non-negative retry count | no / tuning change | no | integer validated |
| `AI_DAILY_REQUEST_LIMIT` | backend / non-secret | yes | positive per-user daily request ceiling | no / policy change | no | integer; keep academic limit |
| `AI_DAILY_TOKEN_LIMIT` | backend / non-secret | yes | positive per-user daily token ceiling | no / policy change | no | integer; keep academic limit |

### Jobs and feature limits

| Exact name | Owner / class | Req. | Purpose and expected format | Secret / rotation | Client | Validation and order dependency |
|---|---|---:|---|---|---:|---|
| `JOB_WORKER_ENABLED` | backend / provider config | yes | boolean; true for the single embedded staging worker | no / topology change | no | boolean-coerced; MongoDB and handlers first |
| `JOB_WORKER_ID` | backend / non-secret | yes | stable unique identifier for this worker instance | no / instance replacement | no | non-empty; current default is not staging-unique |
| `JOB_POLL_INTERVAL_MS` | backend / non-secret | yes | positive poll interval | no / tuning change | no | integer validated |
| `JOB_LEASE_SECONDS` | backend / non-secret | yes | positive lease duration | no / tuning change | no | integer; must exceed viable heartbeat/work units |
| `JOB_MAX_CONCURRENCY` | backend / non-secret | yes | small positive worker concurrency | no / capacity review | no | integer; keep bounded for academic tier |
| `JOB_RETENTION_DAYS` | backend / non-secret | yes | positive completed-job retention | no / retention approval | no | integer; align synthetic retention |
| `ENABLE_DEV_ROUTES` | backend / staging-only test config | yes | false for deployed staging | no / never | no | boolean; enabling exposes test-only endpoints and is prohibited without separate approval |
| `RESUME_PDF_MAX_PAGES` | backend / non-secret | yes | positive PDF page ceiling | no / policy change | no | integer; do not weaken |
| `RESUME_PDF_MAX_TEXT_CHARACTERS` | backend / non-secret | yes | positive extracted-text ceiling | no / policy change | no | integer; do not weaken |
| `RESUME_ANALYSIS_JOB_MAX_ATTEMPTS` | backend / non-secret | yes | positive retry-attempt ceiling | no / tuning change | no | integer validated |
| `INTERVIEW_MAX_QUESTIONS_PER_SESSION` | backend / non-secret | yes | positive session question ceiling | no / policy change | no | integer; do not weaken |
| `INTERVIEW_MAX_ANSWER_CHARACTERS` | backend / non-secret | yes | positive answer length ceiling | no / policy change | no | integer; do not weaken |
| `INTERVIEW_AI_JOB_MAX_ATTEMPTS` | backend / non-secret | yes | positive retry-attempt ceiling | no / tuning change | no | integer validated |
| `LEARNING_MAX_DOCUMENT_PAGES` | backend / non-secret | yes | positive learning-document page ceiling | no / policy change | no | integer; do not weaken |
| `LEARNING_CHUNK_TARGET_WORDS` | backend / non-secret | yes | positive chunk target | no / algorithm review | no | integer validated |
| `LEARNING_CHUNK_OVERLAP_WORDS` | backend / non-secret | yes | non-negative overlap below target | no / algorithm review | no | cross-field constraint validated |
| `LEARNING_MAX_CHAT_MESSAGE_CHARACTERS` | backend / non-secret | yes | positive chat input ceiling | no / policy change | no | integer; do not weaken |
| `LEARNING_MAX_FLASHCARDS_PER_SET` | backend / non-secret | yes | positive set-size ceiling | no / policy change | no | integer; do not weaken |
| `LEARNING_MAX_QUIZ_QUESTIONS` | backend / non-secret | yes | positive quiz-size ceiling | no / policy change | no | integer; do not weaken |
| `LEARNING_AI_JOB_MAX_ATTEMPTS` | backend / non-secret | yes | positive retry-attempt ceiling | no / tuning change | no | integer validated |
| `MIGRATION_PRODUCTION_CONFIRMATION` | migration CLI / staging-only test config | no | exact operator confirmation phrase only for a separately authorized production-mode migration execution | sensitive control / per authorized run | no | not part of app schema; keep unset in ordinary staging |
| `MONGOMS_DOWNLOAD_IGNORE_MISSING_HEADER` | local test harness / staging-only test config | no | boolean compatibility control for the local in-memory MongoDB download | no / never | no | local tests set it; **must not be set on deployed staging** |
| `CAREER_HUB_TEST_ENV_FILE` | backend unit/integration harness / staging-only test secret | no | path to a temporary local test-runtime environment file | yes because the referenced file contains test secrets / per local run | no | local test setup only; **must not be created or set on deployed staging** |

### Proposed monitoring/access variables not currently implemented

| Exact name | Owner / class | Req. | Purpose and expected format | Secret / rotation | Client | Validation and order dependency |
|---|---|---:|---|---|---:|---|
| `SENTRY_DSN` | backend / monitoring secret | no | proposed Sentry project DSN | treat as secret / on project or exposure change | no | **not read or validated by current code**; requires approved Phase 18F integration |
| `SENTRY_ENVIRONMENT` | backend / provider config | no | proposed staging environment label | no / never | no | **not read or validated by current code** |
| `SENTRY_RELEASE` | backend / provider config | no | proposed immutable release identifier | no / each deployment | no | **not read or validated by current code** |
| `CF_ACCESS_CLIENT_ID` | browser harness / staging-only test secret | conditional | proposed machine-access identifier for restricted automated staging tests | yes / on expiry or exposure | no | **not read by app/current harness**; access design and harness approval first |
| `CF_ACCESS_CLIENT_SECRET` | browser harness / staging-only test secret | conditional | paired machine-access credential | yes / on expiry or exposure | no | **not read by app/current harness**; never compile into frontend |

### Missing fail-closed validation requiring later approval

No change is made in Phase 18A. Later review should decide whether to:

1. require a nonzero, provider-verified `TRUST_PROXY_HOPS` in production;
2. require an explicit S3 credential mechanism when S3 is selected outside a
   workload-identity environment;
3. validate a staging-only deployment/access-policy marker;
4. validate a unique worker identity for any multi-instance topology;
5. add schema-backed monitoring configuration only if Sentry is approved.

## 14. Provider compatibility matrix

Cost statements are bounded to current official evidence and must be
reconfirmed before purchase.

### Frontend hosting

| Option | Compatibility and required repository changes | Env/secrets, regions, HTTPS/domains | Storage/background/scaling | Cost, complexity, lock-in, privacy | Status |
|---|---|---|---|---|---|
| Vercel | Native Vite support. Needs monorepo project settings and tracked SPA rewrite configuration for deep links. | Build-time env support; encrypted-at-rest environment variables; global edge delivery; managed HTTPS and custom domains. Custom named staging environments are plan-dependent; a branch/preview environment can serve staging. | Static output is appropriate; no persistent disk or worker needed. Atomic immutable deployments and rollback controls. | Hobby/Pro/Enterprise usage model; confirm limits and staging-environment entitlement. Low operational complexity, moderate platform routing/config lock-in. Public build variables are exposed by design. | **SELECTED: Vercel Hobby. OD-18A-001 resolved / operator approved.** Sources: [Vite](https://vercel.com/docs/frameworks/frontend/vite), [environments](https://vercel.com/docs/deployments/environments), [environment variables](https://vercel.com/docs/environment-variables), [domains](https://vercel.com/docs/domains/working-with-domains/deploying-and-redirecting). |
| Netlify | Native Vite build support. Needs base/build/publish settings and a tracked SPA rewrite. | Build environment variables, global CDN, generated site URL, automatic HTTPS, custom domains. | Static atomic deploys; previous published deploy can be restored. No application background process. | Current Free plan advertises bounded credits and custom-domain SSL; paid tiers add capacity. Low complexity, moderate platform config lock-in. Build logs must not echo public-variable-adjacent secrets. | **Not selected for initial staging.** Sources: [Vite](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/), [build variables](https://docs.netlify.com/build/configure-builds/environment-variables/), [HTTPS](https://docs.netlify.com/manage/domains/secure-domains-with-https/https-ssl/), [deploy rollback](https://docs.netlify.com/deploy/manage-deploys/manage-deploys-overview/), [pricing](https://www.netlify.com/pricing/). |

### Backend hosting

| Option | Compatibility and required repository changes | Env/secrets, regions, HTTPS/domains | Disk/background/scaling/sleep | Cost, complexity, lock-in, privacy | Status |
|---|---|---|---|---|---|
| Render web service | Native Node web service; configure root workspace build/start commands and readiness path. No Docker required. Later deployment metadata may be dashboard-only or reviewed Blueprint. | Environment/secret controls, managed TLS, generated/custom domain, Singapore region. | Default filesystem ephemeral. Persistent disk is paid and constrains scaling/deploy behavior, so use S3. Free sleeps after 15 minutes; paid instance is continuously running. The embedded worker shares the API process. Multiple instances are not approved. | Render Free has accepted cold-start, sleep, and delayed-job limits. Upgrade before reliability-critical use. Low-to-medium complexity and moderate provider lock-in. Logs/metrics are provider-held data. | **SELECTED: Render Free. OD-18A-002 and OD-18A-010 resolved / operator approved. No keep-awake traffic.** Sources: [web services](https://render.com/docs/web-services), [regions](https://render.com/docs/regions), [free limits](https://render.com/docs/free), [disks](https://render.com/docs/disks), [deploys](https://render.com/docs/deploys), [metrics](https://render.com/docs/service-metrics), [pricing](https://render.com/pricing). |
| Railway persistent service | Node monorepo support; configure service root/build/start/health in provider settings or later reviewed config. | Environment variables/secrets, generated/custom domains, automatic SSL, Singapore region. | Persistent long-running service is compatible. Volumes are unnecessary with S3. Replicas exist but lack sticky sessions and are outside this baseline. Optional serverless/sleep behavior must remain disabled for timely jobs. | Current pricing includes a limited Free entry/trial and paid Hobby minimum plus usage; reconfirm. Medium complexity, moderate lock-in. Provider logs/metrics hold operational metadata. | **Not selected for initial staging; retained as architectural fallback.** Sources: [monorepos](https://docs.railway.com/guides/deploying-a-monorepo), [public networking](https://docs.railway.com/networking/public-networking), [regions](https://docs.railway.com/deployments/regions), [scaling](https://docs.railway.com/deployments/scaling), [deploy actions](https://docs.railway.com/deployments/deployment-actions), [pricing](https://railway.com/pricing). |

No third Node host is added: for this bounded single-process staging shape,
neither a VM/container platform nor a serverless function platform is
materially stronger than Render or Railway. Serverless functions are a worse
fit for the embedded continuous worker and graceful shutdown contract.

### Database, storage, monitoring, and CI/CD

| Option | Compatibility / changes | Regions, security, persistence, behavior | Cost / complexity / lock-in / privacy | Status |
|---|---|---|---|---|
| MongoDB Atlas Flex | Native Mongoose/transaction target; explicit index application required. | Managed replica-set-compatible shape; choose closest mutually supported region; TLS, scoped database users, network controls; persistent. | Official current Flex range is bounded monthly usage; medium operational complexity, MongoDB lock-in already inherent. Synthetic personal-like data remains third-party hosted. | **Deferred; upgrade only with separate approval.** [Flex costs](https://www.mongodb.com/docs/atlas/billing/atlas-flex-costs/), [regions](https://www.mongodb.com/docs/atlas/cloud-providers-regions/). |
| MongoDB Atlas Free cluster | Same driver compatibility; verify transaction/index/connection limits with the actual selected cluster. | Limited region/features/capacity; one Free cluster per project under current docs; persistent within Atlas service terms. | No cluster charge under current published limits. Storage, capacity, backup, and operational limitations are accepted for supervised academic staging. | **SELECTED: Atlas Free. OD-18A-003 resolved / operator approved.** [Free deployment](https://www.mongodb.com/docs/atlas/tutorial/deploy-free-tier-cluster/), [limits](https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/). |
| AWS S3 | Direct match to current SDK/adapter; no application change once ignored-source blocker is fixed. | Regional private durable object storage, presigned GET, server-side encryption, lifecycle and access controls. No background process. | Usage-based storage/requests/transfer; low app lock-in at S3 API but AWS IAM operational complexity. Stored PDFs are sensitive even when synthetic. Billing alerts and the USD 10 monthly ceiling are mandatory. | **SELECTED: private Singapore-strategy staging bucket. OD-18A-004 resolved / operator approved. No bucket creation is authorized here.** [presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/ShareObjectPreSignedURL.html), [SSE-S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingServerSideEncryption.html), [pricing](https://aws.amazon.com/s3/pricing/). |
| Cloudflare R2 | S3 API and presigning are broadly compatible, but current checksum behavior conflicts with the adapter's upload request; provider-contract test/code review required. | Automatic placement with optional best-effort location hints/jurisdictions; private object storage. | Current standard-storage free allocation and no-egress model can be inexpensive; medium compatibility risk and Cloudflare lock-in. | **Not approved as drop-in; fallback only after test.** [compatibility](https://developers.cloudflare.com/r2/api/s3/api/), [pricing](https://developers.cloudflare.com/r2/pricing/), [location](https://developers.cloudflare.com/r2/reference/data-location/). |
| Cloudinary | Requires a new adapter and contract mapping; not compatible by environment variables alone. | Private/authenticated delivery exists, but derived-asset and access-mode semantics require careful configuration. | Credit-based tiers; higher semantic lock-in and privacy surface for documents. | **Not recommended for Phase 18.** [access control](https://cloudinary.com/documentation/control_access_to_media), [pricing](https://cloudinary.com/pricing). |
| Provider logs/metrics | Already compatible with stdout/stderr and health endpoints; no SDK change. | Region/retention/access vary by plan. Must verify alerts, redaction, and the approved maximum seven-day retention. | Lowest initial cost/complexity; split visibility across hosts and provider lock-in. | **SELECTED initially. OD-18A-005 resolved / operator approved.** |
| Sentry | Requires SDK dependency, initialization, filters, environment/release tags, and tests. | Managed ingestion; organization/project region, retention, sampling, and scrubbing require operator review. HTTPS. | Free/paid entitlements can change; additional vendor and privacy surface. Stronger cross-service error visibility. | **Deferred to Phase 18F and separate approval.** [JavaScript docs](https://docs.sentry.io/platforms/javascript/). |
| Native provider GitHub integrations | No workflow file required; set selected branch, manual promotion, and provider-held secrets. | Provider HTTPS/build environment; branch deploys and platform rollback. | Lowest repository complexity; two deployment control planes and moderate lock-in. | **SELECTED for Vercel and Render with branch restrictions/manual promotion. OD-18A-006 resolved / operator approved.** |
| GitHub Actions | Requires reviewed `.github/workflows` files, GitHub environment, scoped secrets, provider credentials, concurrency, and rollback logic. | Environment secrets can be gated by protection rules; runners and provider API actions add supply-chain surface. | More control and portability, more maintenance and secret exposure surface; plan features vary for private repositories. | **Not authorized; any later use requires separate approval.** [deployments/environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments), [secrets](https://docs.github.com/en/actions/reference/security/secrets). |

Academic-MVP suitability is explicit: the operator selected protected Vercel
Hobby, accepted Render Free sleeping/cold-start behavior, and accepted Atlas
Free limits for supervised initial staging. S3 remains suitable only with a
private policy, billing alerts, and cleanup. R2 is conditional on a contract
test; Cloudinary is unsuitable without a new adapter/security review.
Provider logs are the selected minimum; Sentry is deferred. Native Vercel and
Render Git integrations are selected, while GitHub Actions remains
unauthorized. Region or persistence is not applicable to the CI control
itself; those properties remain controlled by the selected runtime/data
providers.

## 15. Recommended staging topology

This topology is operator approved for initial academic staging. Its approval
does not authorize account setup, purchase, resource creation, DNS,
configuration, secret injection, or deployment.

```text
Restricted operator browser
        |
        | HTTPS + identity-aware deny-by-default access
        v
staging.prabhathmalinda.com.lk         api-staging.prabhathmalinda.com.lk
Vercel Hobby React/Vite   -- CORS -->  Render Free Node/Express (Singapore)
                                             |\
                                             | \-- live AI disabled initially
                                             |
                         TLS MongoDB --------+------ S3 private API
                              |                         |
                    Atlas Free, closest          AWS S3, aligned region
                    compatible region            (not yet created)
```

| Concern | Recommendation |
|---|---|
| Frontend | Vercel Hobby static Vite project built from the approved staging branch |
| Backend | one Render Free web service in Singapore; sleep, cold starts, and delayed jobs accepted; no keep-awake traffic |
| Database | MongoDB Atlas Free in the nearest compatible regional strategy; Free-tier limitations accepted; Flex requires separate approval |
| Storage | private AWS S3 bucket/prefix in an aligned region |
| Monitoring | provider logs only initially, retained no more than seven days; Sentry deferred to Phase 18F |
| CI/CD | native Vercel and Render GitHub integrations; branch restrictions and manual promotion; no GitHub Actions |
| URLs | `https://staging.prabhathmalinda.com.lk` and `https://api-staging.prabhathmalinda.com.lk`; domain activation pending |
| CORS | API allowlist contains exactly the frontend origin |
| Cookie | host-only HttpOnly `Secure`, `SameSite=Lax`, auth-path-scoped; sibling domains preserve same-site behavior |
| Proxy | set only the measured provider hop count and verify spoof resistance |
| Secrets | provider secret stores only; backend secrets never enter Vercel/frontend; distinct staging credentials |
| Access | Cloudflare Access or equivalent deny-by-default protection across both concrete hostnames; operator account only; later browser service credential needs separate approval |
| Data | synthetic-only; immediate user/owned-record/PDF cleanup; live AI-provider data disabled |
| Scale | one API instance and one embedded worker |
| Budget | USD 10 monthly hard ceiling; billing alerts before usage-based resources |
| Rollback | retain last known-good frontend/backend deployments; clean synthetic data after every run; delete resources after Phase 18 unless a time-bounded extension is approved |

Cloudflare Access or equivalent is the approved access-policy direction; no
access resource was created. Official documentation supports public-hostname
protection, reusable allow policies, deny-by-default behavior, and service
tokens for automated clients:
[application types](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/choose-application-type/),
[policies](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/),
and [service tokens](https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/).
Its CORS and two-domain cookie behavior must still pass Phase 18E/18G.

## 16. Fallback staging topology

- Netlify static frontend.
- One always-on Railway persistent backend service in Singapore.
- MongoDB Atlas Free cluster only if its selected region, transactions,
  connection limits, index capacity, and browser workload pass Phase 18C;
  otherwise Atlas Flex.
- AWS S3 private storage.
- Provider logs first; optional Sentry remains separately approved.
- Native GitHub integrations.
- The same sibling custom-domain, exact-CORS, secure-cookie, proxy,
  deny-by-default access, single-instance, synthetic-data, and rollback
  requirements as the primary topology.

Default Netlify/Railway domains are not an authentication-compatible substitute
for sibling custom domains.

## 17. Repository changes likely required later

These are estimates, not Phase 18A authorization:

1. **B18A-001 closeout commit:** the `.gitignore` rule is
   narrowed through exact exceptions, the four adapters are Git-visible with
   matching checksums, and verification passed. Operator approval is accepted;
   this closeout authorizes the reviewed local commit.
2. Add exactly one approved frontend SPA routing/deployment configuration for
   the chosen host.
3. Optionally add one backend provider configuration only if dashboard settings
   cannot be reviewed/reproduced safely.
4. Add a reviewed, idempotent index synchronization/verification mechanism if
   the current migration tooling does not already provide an approved path.
5. Adapt the browser harness for a remote staging base URL, restricted-access
   credentials, staging fixture lifecycle, and no local server/Atlas
   substitution.
6. Add Sentry package/source/configuration/tests only if a later Phase 18F
   approval replaces the provider-logs-only decision.
7. Add GitHub Actions workflow files only if a later approval replaces the
   selected native integrations.
8. Add a staging access-control application/config outside the repository, or
   separately approve product behavior that prevents unrestricted registration.

Every change needs its own authorized manifest, tests, security/privacy review,
and human approval. No package or configuration change occurred in Phase 18A.

## 18. Security and privacy boundaries

- Phase 17's security scan remains `NOT RUN — NO PASS CLAIMED`; its waiver does
  not create a production security claim.
- Use distinct staging secrets and least-privilege identities. Never reuse
  local, production, or personal credentials.
- Frontend receives only `VITE_API_URL`; all tokens, database, storage, AI, and
  monitoring credentials remain server/provider-side.
- Staging must use production security behavior, HTTPS, HSTS, exact CORS,
  secure cookies, error hiding, redacted logs, and private no-store caching.
- Bucket/object access is private; signed URLs remain short-lived.
- Atlas, storage, monitoring, and logs contain only synthetic staging data.
- Do not expose provider preview URLs as alternate unprotected application
  entrances. Restrict or disable them where possible.
- Do not weaken rate limits, upload limits, ownership checks, quiz answer
  secrecy, private-file controls, or request validation.
- Secrets must never appear in Git, frontend bundles, screenshots, audit
  reports, terminal output, build logs, or browser artifacts.
- Resource/log retention and deletion must be documented before data entry.
- Provider data-processing locations and terms require operator acceptance.

## 19. P15-001 restrictions

P15-001 remains **TECHNICALLY UNRESOLVED**. The asset quota check is not atomic
under concurrent uploads. The accepted academic-MVP restrictions remain
binding:

- supervised evaluation only;
- limited approved demo accounts and uploads;
- no unrestricted public registration or public-scale upload exposure;
- preserve file-size, user-quota, AI, and rate limits;
- monitor storage usage;
- do not intentionally run concurrent upload/load tests against persistent
  staging data without explicit authorization;
- perform manual cleanup under the approved retention policy;
- repair P15-001 before multi-instance, public-scale, commercial, or
  meaningful external-storage operation.

The proposed staging environment is therefore an academic evaluation
environment, not production and not an unrestricted public beta.

## 20. Synthetic staging-data policy

- Only generated identities, synthetic resumes, synthetic interview answers,
  synthetic PDFs, synthetic learning content, and non-sensitive test prompts
  are permitted.
- Do not copy production or legacy exports, real resumes, real job
  applications, real document collections, credentials, sessions, password
  hashes, or identifying personal data.
- Use a staging-specific email domain/reservation and never send external
  messages.
- Each test run must have a deterministic owner/tag and cleanup path.
- Delete synthetic users, owned records, and uploaded PDFs immediately after
  testing.
- Retain completed jobs and provider logs no more than seven days.
- Delete browser screenshots and traces after review and no later than seven
  days.
- Retain monitoring events no more than seven days.
- Retain backups no more than seven days and only when required.
- Disable live AI-provider data during initial staging.
- Teardown must reconcile database owned-resource counts and storage objects;
  a zero database count is insufficient if orphaned objects remain.

## 21. Phase 18 subphase plan

Phase 18A is completed and approved. Phase 18B remains
`PLANNED / INACTIVE — READY FOR SEPARATE ACTIVATION`.

| Subphase | Purpose and allowed services | Allowed repository changes | Manual actions / required secrets | Verification and rollback | Approval / commit / push boundary |
|---|---|---|---|---|---|
| **18A — Audit** | Git/provider documentation read-only; define and approve architecture | the two governance files and this audit only | none; no secrets | baseline and complete diff; twelve decisions recorded; no deployment/resource claim | `PHASE_18A_STAGING_ARCHITECTURE_AUDIT_APPROVED` accepted; closeout commit authorized; no push |
| **18B — Provider Selection, Account Readiness and Secret Manifest Approval** | apply the approved provider/account/secret-readiness decisions under a separate prompt | documentation only unless a new prompt explicitly expands it | verify account readiness, domain activation, billing alerts, and least-privilege secret plan; no value sharing with Codex | approved decisions reconciled with live account constraints; roll back by declining/cancelling before creation | `PLANNED / INACTIVE — READY FOR SEPARATE ACTIVATION`; proposed token `PHASE_18B_PROVIDER_AND_SECRET_MANIFEST_APPROVED`; no activation or push without explicit authorization |
| **18C — MongoDB Staging and Private Storage Provisioning** | Atlas and selected private storage only | approved index/provisioning docs or minimal readiness repair under a separate manifest | operator creates scoped database/storage identities and injects only through provider controls | replica-set transactions, indexes, network rules, bucket privacy/encryption/presign/upload/delete/cleanup; delete test resources/credentials on rollback | proposed token `PHASE_18C_DATA_AND_STORAGE_READY`; expected phase-scoped commit only if repo repairs are approved; no push by implication |
| **18D — Backend Deployment and Health** | selected Render Free backend, Atlas Free, storage, and disabled live AI | approved storage tracking repair and provider config only | inject backend secrets in provider store; accept documented Free sleep/cold-start behavior; no keep-awake traffic | build/start, liveness/readiness after wake, graceful shutdown, proxy/IP/request ID, logs/redaction, worker/job delay, private storage; roll back to prior deployment and revoke changed secrets | proposed token `PHASE_18D_BACKEND_STAGING_APPROVED`; commit requires explicit authorization; push/deploy require separate explicit authorization |
| **18E — Frontend, HTTPS and CORS** | selected frontend/backend, DNS/TLS/access gateway | approved SPA routing config and remote API setting only | configure sibling domains, certificates, exact origins, access policy | deep links, HTTPS/HSTS, secure refresh cookie, exact allowed/blocked CORS, preflight through access gateway; restore prior static deployment/DNS on rollback | proposed token `PHASE_18E_FRONTEND_CORS_APPROVED`; commit/push/deploy only when explicitly authorized |
| **18F — Monitoring, CI/CD and Rollback** | provider monitoring; optional Sentry; provider Git integration or approved Actions | only approved monitoring/workflow/config changes | create monitoring project only if selected; add scoped CI secrets; set budgets/alerts | redaction canary, alert delivery, branch gate, manual promotion, rollback drill, secret non-disclosure; disable integration/revoke credentials on rollback | proposed token `PHASE_18F_OPERATIONS_APPROVED`; expected scoped commit if files change; push remains separately authorized |
| **18G — Browser Verification and Closeout** | deployed staging and approved browser runner only | approved staging harness/docs/report changes | synthetic test account/access credential only; no real data | desktop/tablet/mobile flows, loading/empty/error/success, ownership/private PDF/quiz secrecy, cleanup including objects/jobs/logs; rollback failed deployment and clean fixtures | proposed token `PHASE_18G_STAGING_CLOSEOUT_APPROVED`; closeout commit/push only with explicit authorization |

## 22. Operator decisions OD-18A-001 through OD-18A-012

All twelve decisions are `RESOLVED / OPERATOR APPROVED`.

### OD-18A-001 — Frontend staging host

- Status: `RESOLVED / OPERATOR APPROVED`.
- Decision: Vercel Hobby initially.
- Operational boundary: protect every staging entry URL and add the approved
  SPA routing configuration in a later authorized task.

### OD-18A-002 — Backend staging host

- Status: `RESOLVED / OPERATOR APPROVED`.
- Decision: Render Free initially.
- Accepted limitations: service sleeping, cold starts, delayed first requests,
  and delayed background jobs.
- Boundary: no keep-awake traffic. Upgrade to an always-on paid Render service
  only with separate approval and before a reliability-critical demonstration.

### OD-18A-003 — MongoDB Atlas project, cluster tier and region

- Status: `RESOLVED / OPERATOR APPROVED`.
- Decision: MongoDB Atlas Free initially.
- Accepted limitations: Free-tier storage, capacity, backup, and operational
  constraints.
- Boundary: upgrade to Atlas Flex only with separate approval. Transaction,
  index, connection, region, TLS, and least-privilege checks remain mandatory.

### OD-18A-004 — Private-storage provider and region

- Status: `RESOLVED / OPERATOR APPROVED`.
- Decision: private AWS S3 staging bucket in the Singapore regional strategy.
- Boundary: billing alerts and the USD 10 monthly ceiling must be configured
  before creation. This closeout does not authorize a bucket.

### OD-18A-005 — Monitoring provider

- Status: `RESOLVED / OPERATOR APPROVED`.
- Decision: provider logs only initially.
- Boundary: maximum seven-day retention. Sentry is deferred to Phase 18F and
  requires separate approval.

### OD-18A-006 — CI/CD method

- Status: `RESOLVED / OPERATOR APPROVED`.
- Decision: native Vercel and Render GitHub integrations with branch
  restrictions and manual promotion.
- Boundary: no GitHub Actions workflow is authorized.

### OD-18A-007 — Staging domain strategy

- Status: `RESOLVED / OPERATOR APPROVED`.
- Domain: `prabhathmalinda.com.lk`.
- Registrar: LK Domain Registry.
- Domain status: `RESERVED — REGISTRY ACTIVATION PENDING`.
- Planned frontend hostname: `staging.prabhathmalinda.com.lk`.
- Planned API hostname: `api-staging.prabhathmalinda.com.lk`.
- Boundary: DNS and live staging configuration must wait for registry
  activation. Pending activation does not block repository development or
  Phase 18 preparation.

### OD-18A-008 — Staging access policy

- Status: `RESOLVED / OPERATOR APPROVED`.
- Decision: Cloudflare Access or equivalent deny-by-default protection across
  both staging hostnames.
- Access scope: operator account only. No private operator email address is
  recorded.
- Boundary: a short-lived service credential for automated browser testing
  requires a later separate authorization.

### OD-18A-009 — Monthly budget ceiling

- Status: `RESOLVED / OPERATOR APPROVED`.
- Decision: USD 10 per month hard ceiling during initial staging.
- Boundary: configure provider billing alerts before creating usage-based
  resources. This closeout authorizes no purchase or resource creation.

### OD-18A-010 — Sleep/cold-start tolerance

- Status: `RESOLVED / OPERATOR APPROVED`.
- Decision: cold starts and delayed initial requests/jobs are accepted during
  the initial free-tier staging period.
- Boundary: synthetic keep-awake traffic is prohibited.

### OD-18A-011 — Synthetic staging-data retention period

- Status: `RESOLVED / OPERATOR APPROVED`.
- Synthetic users and owned records: delete immediately after testing.
- Synthetic uploaded PDFs: delete immediately after testing.
- Completed jobs: maximum seven days.
- Provider logs: maximum seven days.
- Browser screenshots and traces: delete after review, maximum seven days.
- Monitoring events: maximum seven days.
- Backups: maximum seven days and only when required.
- Live AI-provider data: disabled during initial staging.

### OD-18A-012 — Rollback and resource-cleanup policy

- Status: `RESOLVED / OPERATOR APPROVED`.
- Keep the last known-good frontend and backend deployment available for
  rollback.
- Clean synthetic data after every verification run.
- Delete staging resources after Phase 18 closeout unless the operator approves
  a time-bounded extension.

## 23. Risks and blockers

| ID | Risk/blocker | Disposition |
|---|---|---|
| B18A-001 | Storage adapters were ignored and remain absent from `HEAD` until this approved closeout commit is created | `COMPLETED / APPROVED`; exact Git visibility, unchanged checksums, focused test, typechecks, backend regressions, and build approved; token accepted |
| B18A-002 | Default frontend/backend provider domains break current same-site refresh-cookie contract | sibling domains approved; deployment blocked until registry activation, DNS/TLS configuration, and verification |
| B18A-003 | Current registration plus public hosts conflicts with P15-001 | deny-by-default access approved; deployment blocked until it is configured and verified across both hosts |
| B18A-004 | Twelve provider/cost/access/retention decisions | resolved and operator approved; Phase 18B still requires separate activation |
| B18A-005 | Domain is reserved but registry activation is pending | DNS and live staging configuration must wait; repository preparation may continue |
| R18A-001 | Production indexes are not auto-created | apply and verify declared indexes before traffic |
| R18A-002 | Process-local rate limiter and embedded worker complicate replicas | one instance only |
| R18A-003 | Render Free sleeps and delays jobs/health | operator accepted for initial staging; no keep-awake traffic; paid upgrade before reliability-critical demonstration |
| R18A-004 | R2 checksum compatibility is not confirmed | use S3 or separately test/change |
| R18A-005 | Current browser harness is local-only | approved remote staging adaptation in 18G |
| R18A-006 | No portable Playwright npm script/dependency | continue authorized bundled runtime only under a new approved execution plan |
| R18A-007 | Monitoring beyond logs is not integrated | provider logs first; separate Sentry change if approved |
| R18A-008 | Atlas/provider egress addresses may not be stable | choose a documented narrow network method; do not permanently allow all |
| R18A-009 | Security scan waiver remains bounded | no production/unrestricted security claim |

These blockers do not invalidate the completed Phase 18A audit. They prevent
deployment until their stated gates are satisfied.

## 24. Rollback and cleanup expectations

Before first deployment, Phase 18F must document and exercise:

1. frontend rollback to a known immutable deploy;
2. backend rollback to a known immutable deploy without assuming database
   rollback;
3. backward-compatible index/schema deployment order;
4. secret revocation and replacement;
5. Atlas restore limitations and a synthetic restore drill if backups are
   purchased;
6. S3 object version/lifecycle behavior if enabled;
7. DNS and access-policy rollback without exposing provider default URLs;
8. deterministic deletion of users, sessions, owned records, jobs, objects,
   browser artifacts, monitoring events where supported, and test credentials;
9. enforcement of the approved immediate cleanup and maximum seven-day
   retention periods;
10. full resource destruction and billing verification at closeout unless a
    time-bounded extension is approved.

Never solve an application rollback by restoring a database blindly. Confirm
data compatibility and recovery point first.

## 25. Human review checklist

- [x] Confirm Phase 17 remains approved only with the bounded scan waiver.
- [x] Confirm P15-001 restrictions are correctly carried forward.
- [x] Review B18A-001 and authorize no deployment before the storage files are
      correctly tracked and verified.
- [x] Approve the implemented B18A-001 repair with
      `PHASE_18_STORAGE_ADAPTER_TRACKING_REPAIR_APPROVED`.
- [x] Resolve and approve each OD-18A-001 through OD-18A-012.
- [x] Record the reserved operator domain and registry-activation dependency.
- [x] Require both hosts to be deny-by-default without breaking CORS,
      refresh cookies, or browser automation.
- [x] Confirm Singapore/nearest-region choices and cross-provider data paths.
- [x] Accept Render Free sleep/cold-start limits and prohibit keep-awake
      traffic.
- [x] Set the USD 10 monthly hard ceiling and require billing alerts.
- [x] Require Atlas Free to support the needed transactions, indexes, workload,
      connections, and retention.
- [x] Confirm AWS S3 private-access, encryption, lifecycle, and IAM plan.
- [x] Confirm all environment-variable ownership and the missing fail-closed
      validations.
- [x] Confirm synthetic-only data and exact retention/cleanup periods.
- [x] Select provider logs and defer Sentry to separate Phase 18F approval.
- [x] Select native Vercel/Render Git integrations and leave GitHub Actions
      unauthorized.
- [x] Confirm no deployment, cloud resource, secret action, or push is
      being approved merely by approving this audit.

No visual QA is required for Phase 18A because all changes are documentation
only and no application server was started.

## 26. Next action

OD-18A-001 through OD-18A-012 are resolved and operator approved. The approval
token `PHASE_18A_STAGING_ARCHITECTURE_AUDIT_APPROVED` is accepted.

B18A-001 is `COMPLETED / APPROVED`. The four
existing adapter files are Git-visible through exact `.gitignore` exceptions,
their before/after hashes match, focused storage coverage was added, and all
required typechecks, tests, and the production build passed. No adapter source
behavior changed. The approval token
`PHASE_18_STORAGE_ADAPTER_TRACKING_REPAIR_APPROVED` is accepted. The exact
local closeout commit remains pending until created by the approval-closeout
prompt.

Phase 18B remains
`PLANNED / INACTIVE — READY FOR SEPARATE ACTIVATION`. It still requires a
separate explicit prompt. This closeout does not authorize a push, provider
account, resource, purchase, domain activation, DNS change, secret, workflow,
deployment, Phase 18B execution, or Phase 19 activation.

The next planned activity is a separately authorized current-versus-legacy
UI, feature, and branding audit before deployment. No legacy-project access
is authorized by this closeout.
