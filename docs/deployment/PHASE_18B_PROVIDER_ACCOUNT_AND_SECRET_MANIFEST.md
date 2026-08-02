# Phase 18B Provider Account and Secret-Name Manifest

## 1. Activation identity

- Prompt ID:
  `CLH-PHASE-18B-ACTIVATE-ACCOUNT-READINESS-AND-SECRET-MANIFEST-01`.
- Repository:
  `/Users/prabhathmalinda/Documents/Projects/Career Learning Hub`.
- Branch: `phase-18-staging-deployment`.
- Starting HEAD: `a3f674376c6beb697d2ffc5a5edb35f9649d99f8`.
- Date: 2026-08-02.
- Scope: documentation-only Phase 18B activation, provider/account readiness
  reconciliation, and secret-name ownership review.
- No provider was contacted. No account, provider resource, environment value,
  secret, DNS record, TLS setting, deployment, push, or merge was created or
  changed.

## 2. Phase status

- Phase 18: `ACTIVE`.
- Phase 18A: `COMPLETED / APPROVED`.
- UI-LA1: `COMPLETED / HUMAN-APPROVED / LOCALLY COMMITTED`.
- UI-LA2: `COMPLETED / HUMAN-APPROVED / LOCALLY COMMITTED`.
- UI-QA: `COMPLETED / HUMAN-APPROVED / LOCALLY COMMITTED`.
- Phase 18B:
  `ACTIVE — PROVIDER/ACCOUNT READINESS AND SECRET-NAME MANIFEST`.
- Current Phase 18B activity:
  `COMPLETED / HUMAN-APPROVED / LOCALLY COMMITTED`.
- Provider provisioning: `NOT STARTED / INACTIVE`.
- Staging deployment: `NOT STARTED / INACTIVE`.
- DNS configuration: `NOT STARTED / INACTIVE`.
- Phase 19: `PLANNED / INACTIVE`.

## 3. Git baseline

| Check | Verified result |
|---|---|
| Repository | `/Users/prabhathmalinda/Documents/Projects/Career Learning Hub` |
| Branch | `phase-18-staging-deployment` |
| HEAD | `a3f674376c6beb697d2ffc5a5edb35f9649d99f8` |
| Subject | `Record UI-QA approval and commit` |
| Parent | `6821833d80f1ca026beb382822ed35ebebbe4911` |
| Parent count | exactly one |
| Worktree before editing | clean |
| Staged paths before editing | none |
| Untracked paths before editing | none |
| Active Git operation | none |
| Ports 4173, 4174, and 8000 | closed; no listening process |

This exact commit is the current local baseline for the documentation change.

## 4. Operator-confirmation evidence boundary

Repository-verified facts are limited to local Git state, tracked planning and
deployment records, tracked environment-variable examples, application
environment validation, and the absence of tracked provider-resource
definitions. The repository confirms the application configuration surface;
it does not confirm that a provider resource exists or works.

Provider account access, dashboard availability, plan labels, repository
visibility in provider dashboards, domain registration, the existing public
TXT record, and the AWS budget are operator-confirmed facts. They were not
independently checked because provider and network access are prohibited in
this task.

The Singapore regional strategy is a historical approved direction. It is not
a current provider-region availability or pricing claim. Current provider
regions, free-tier eligibility, quotas, billing behavior, nameserver values,
DNSSEC, proxy hops, DNS propagation, certificate issuance, and provider URL
restriction capability all require later live verification under separate
authorization.

Operator confirmations and screenshots establish dashboard access and the
observed controls only. They do not prove deployment, connectivity, permanent
pricing, DNS propagation, TLS, CORS, cookie behavior, storage privacy, database
transactions, index readiness, or runtime success.

## 5. Provider readiness matrix

| Provider | Account confirmed | Repository/resource visibility | Planned responsibility | Existing resource state | Later action required | Provisioning status |
|---|---|---|---|---|---|---|
| GitHub | Yes | Private repository `PrabhathMalindaGit/career-learning-hub` visible; operator/admin access confirmed | Source control and manual promotion from the phase branch | Repository exists; phase branch is operator-confirmed as pushed; no merge authorized | Retain branch restriction and verify provider integrations during provisioning | `NOT STARTED / INACTIVE` for deployment integration |
| LK Domain Registry | Yes, through DNS-manager access | Registered domain and existing TXT record visible | Domain registration, nameserver control, and authoritative record management | Registration completed; no staging records created | Confirm nameservers and DNSSEC, preserve the TXT record, then create approved records later | `NOT STARTED / INACTIVE` for staging DNS |
| Vercel | Yes; Hobby observed | Private GitHub repository visible | Frontend only | Project not created; deployment not started | Create the approved frontend-only project and later add approved SPA routing | `NOT STARTED / INACTIVE` |
| Render | Yes | Private GitHub repository and phase branch visible/selectable | Backend only | Service not created; deployment not started | Verify current plan, region, root, build, start, health, and proxy settings before creation | `NOT STARTED / INACTIVE` |
| MongoDB Atlas | Yes | Project-creation capability confirmed; unrelated project and cluster visible but excluded | Dedicated staging database boundary | Career Learning Hub project, cluster, user, network rule, and URI do not exist | Create and verify an isolated project, free-eligible cluster, scoped identities, network controls, transactions, and indexes | `NOT STARTED / INACTIVE` |
| AWS | Yes | Console, billing, and S3 capability confirmed | Private staging asset storage and budget control | Zero-spend warning exists; no bucket, IAM identity, or key exists | Revalidate region and cost, approve least privilege, then create a private bucket and scoped access | `NOT STARTED / INACTIVE` |
| Cloudflare | Yes | Domain/zone and Zero Trust Free capability confirmed | DNS and deny-by-default operator-only access for both staging hosts | Zone not added; nameservers unchanged; no Access application or identity provider | Configure the zone and access policy in a separate authorized DNS/access task | `NOT STARTED / INACTIVE` |

## 6. Domain and DNS readiness

- Domain: `prabhathmalinda.com.lk`.
- Registry status: `COMPLETED`.
- Registered/requested date: 2026-07-30.
- Expiry date: 2027-07-30.
- Registrar: LK Domain Registry.
- DNS-manager access: `CONFIRMED`.
- Nameserver-edit capability: `CONFIRMED`.
- Resource-record management: `CONFIRMED`.
- Observed supported registry-managed record types: A, AAAA, CNAME, and TXT.
- Existing record:
  - name: `prabhathmalinda.com.lk`;
  - type: TXT;
  - public value: `Prabhath`;
  - TTL: 86400.
- The existing TXT record must remain unchanged unless its deletion is
  separately reviewed and authorized.
- Current nameserver values: `NOT CONFIRMED`.
- DNSSEC status: `NOT CONFIRMED`.
- `staging.prabhathmalinda.com.lk`: `NOT CREATED`.
- `api-staging.prabhathmalinda.com.lk`: `NOT CREATED`.

No nameserver delegation, Cloudflare zone activation, DNS propagation, TLS
issuance, or working hostname is claimed.

## 7. Git and branch deployment policy

- The phase branch is operator-confirmed as pushed to GitHub.
- Any later staging service must use `phase-18-staging-deployment`.
- `main` must remain stable and unmodified during staging preparation.
- Promotion is manual.
- Merge to `main` is allowed only after complete staging verification and
  separate explicit authorization.
- This task performs no push, merge, commit, branch creation, or remote check.

## 8. Frontend/Vercel boundary

- Vercel responsibility: frontend only.
- Planned project name: `career-learning-hub-frontend`.
- Planned project root: `frontend`.
- The private GitHub repository is operator-confirmed as visible.
- The project does not exist and no deployment has started.
- Reject the detected multi-service Vercel shape and any request to deploy the
  frontend and backend through one Vercel project.
- The backend is excluded from Vercel.
- SPA rewrite configuration remains later authorized repository work.
- No `vercel.json` is created or changed here.

## 9. Backend/Render boundary

- Render responsibility: backend only.
- The phase branch is operator-confirmed as selectable.
- Planned service name: `career-learning-hub-api-staging`.
- The service does not exist and no deployment has started.
- A free instance option was observed. Current availability, quotas, region,
  and price still require later official verification.
- The observed, unapproved defaults were:
  - region: Oregon (US West);
  - root directory: blank;
  - build command: `npm install; npm run build`;
  - start command: `yarn start`.
- Final root, region, build, start, health, environment, and proxy settings
  must be derived from the repository and verified against the current
  provider contract in a later provisioning task.

## 10. MongoDB Atlas isolation

DEC-015 is accepted: Career Learning Hub staging uses a dedicated Atlas
project. The existing `Interview Prep AI` project and `Cluster0` are excluded,
must remain unchanged, and require no data review for this deployment.

- Planned Atlas project: `Career Learning Hub Staging`.
- Planned deployment/cluster: `career-learning-hub-staging`.
- New project: not created.
- New cluster: not created.
- Database user: not created.
- Network rule: not created.
- Connection URI: not created or supplied.
- Separate users, credentials, network controls, collections, indexes,
  synthetic data, cleanup, rollback, and provider ownership are mandatory.
- Transaction support and the full repository-declared production index set
  must be applied and verified later before staging traffic.

## 11. AWS budget and S3 readiness

- AWS console and Billing and Cost Management access: `CONFIRMED`.
- Observed estimated bill: USD 0.00.
- Zero-spend warning budget: `CREATED`.
- Budget name: `My Zero-Spend Budget`.
- Displayed early-warning amount: USD 1.00.
- Project aggregate monthly hard ceiling: USD 10.00.
- The alert does not guarantee automatic shutdown and does not replace the
  aggregate ceiling.
- Automated budget action: `NOT AUTHORIZED`.
- S3 bucket, IAM user, IAM role, access key, secret key, bucket policy,
  lifecycle rule, and CORS rule: `NOT CREATED`.
- Actual AWS resource region: `NOT YET SELECTED`.
- The approved historical direction is a Singapore regional strategy, subject
  to current provider verification before resource creation.
- Any later S3 bucket must be private, use least-privilege access, and follow
  the approved retention, cleanup, encryption, and budget controls.

## 12. Cloudflare DNS and Access readiness

- Cloudflare account: `CONFIRMED`.
- Zero Trust Free availability and Access capability: `CONFIRMED`.
- Zone for `prabhathmalinda.com.lk`: not added and not confirmed active.
- Registrar nameservers: unchanged by this task.
- Access application and identity provider: not created or configured.
- Future access policy: deny by default, operator account only.
- Both `staging.prabhathmalinda.com.lk` and
  `api-staging.prabhathmalinda.com.lk` must be protected.
- Vercel, Render, or other provider-default URLs must not expose an
  unrestricted bypass around the access policy.

## 13. Secret-name ownership manifest

This manifest contains names and ownership only. It copies no value from a
tracked example, provider dashboard, local environment, or operator secret
store. “Required” refers to the approved initial staging topology, even when
the schema has a default.

| Variable | Provider/location | Component | Required for initial staging | Secret | Generated later | Operator action | Notes |
|---|---|---|---|---|---|---|---|
| `VITE_API_URL` | Vercel project environment | Frontend | Yes | No | No | Enter the verified staging API base URL later | Public build-time value; only frontend variable |
| `NODE_ENV` | Render service environment | Backend | Yes | No | No | Set and verify production security semantics later | Enum-validated at startup |
| `PORT` | Render service environment | Backend | Yes | No | Provider-managed | Verify the provider-injected port contract later | Positive integer |
| `MONGODB_URI` | Render secret store; issued from dedicated Atlas boundary | Backend/database | Yes | Yes | Yes | Create scoped Atlas access and inject later | Never reuse the unrelated project URI |
| `CLIENT_ORIGINS` | Render service environment | Backend/CORS | Yes | No | No | Enter the exact verified frontend origin later | No wildcard; production requires non-local HTTPS |
| `API_PUBLIC_ORIGIN` | Render service environment | Backend/assets | Yes | No | No | Enter the exact verified API origin later | Origin only; no path or credentials |
| `TRUST_PROXY_HOPS` | Render service environment | Backend/proxy | Yes | No | No | Measure and approve the provider chain later | Actual value remains unverified |
| `LOG_LEVEL` | Render service environment | Backend/logging | Yes | No | No | Select after provider-log review | Enum-validated |
| `REQUEST_LOGGING_ENABLED` | Render service environment | Backend/logging | Yes | No | No | Approve after redaction review | Boolean-coerced |
| `CORS_MAX_AGE_SECONDS` | Render service environment | Backend/CORS | Optional | No | No | Approve after exact-origin verification | Non-negative preflight cache control |
| `HEALTH_CHECK_TIMEOUT_MS` | Render service environment | Backend/health | Yes | No | No | Align with provider health behavior later | Validated bounded integer |
| `SHUTDOWN_TIMEOUT_MS` | Render service environment | Backend/runtime | Yes | No | No | Align with provider termination behavior later | Graceful-shutdown budget |
| `SERVER_REQUEST_TIMEOUT_MS` | Render service environment | Backend/runtime | Yes | No | No | Verify during backend provisioning | Validated bounded integer |
| `SERVER_HEADERS_TIMEOUT_MS` | Render service environment | Backend/runtime | Yes | No | No | Verify together with keep-alive timeout | Must exceed keep-alive timeout |
| `SERVER_KEEP_ALIVE_TIMEOUT_MS` | Render service environment | Backend/runtime | Yes | No | No | Verify together with headers timeout | Must remain below headers timeout |
| `JWT_ACCESS_SECRET` | Render secret store | Backend/authentication | Yes | Yes | Yes | Generate and inject later | Minimum 32 characters; distinct from other signing secrets |
| `JWT_REFRESH_SECRET` | Render secret store | Backend/authentication | Yes | Yes | Yes | Generate and inject later | Minimum 32 characters; distinct; rotation invalidates sessions |
| `ASSET_SIGNING_SECRET` | Render secret store | Backend/private assets | Yes | Yes | Yes | Generate and inject later | Minimum 32 characters; distinct from both JWT secrets |
| `ACCESS_TOKEN_TTL_MINUTES` | Render service environment | Backend/authentication | Yes | No | No | Approve the staging lifetime later | Validated bounded integer |
| `REFRESH_TOKEN_TTL_DAYS` | Render service environment | Backend/authentication | Yes | No | No | Align with retention and session policy later | Validated bounded integer |
| `REFRESH_COOKIE_NAME` | Render service environment | Backend/authentication | Yes | No | No | Verify cookie contract later | Non-empty; never store a cookie value here |
| `BCRYPT_ROUNDS` | Render service environment | Backend/authentication | Yes | No | No | Approve the staging work factor later | Production validation requires at least 12 |
| `GLOBAL_RATE_LIMIT_WINDOW_MS` | Render service environment | Backend/rate limiting | Yes | No | No | Approve after proxy verification | Process-local boundary remains single-instance only |
| `GLOBAL_RATE_LIMIT_MAX` | Render service environment | Backend/rate limiting | Yes | No | No | Preserve an approved academic limit | Do not weaken for deployment convenience |
| `HEALTH_RATE_LIMIT_MAX` | Render service environment | Backend/rate limiting | Yes | No | No | Align with approved monitoring cadence | Positive validated limit |
| `ASSET_STORAGE_DRIVER` | Render service environment | Backend/private assets | Yes | No | No | Set only after S3 readiness is approved | Supported driver identifier |
| `ASSET_LOCAL_ROOT` | Render service environment | Backend/private assets | No for S3 | No | No | Leave unused for the approved S3 topology | Local path is not the staging storage plan |
| `ASSET_MAX_FILE_SIZE_BYTES` | Render service environment | Backend/private assets | Yes | No | No | Preserve or tighten the approved limit | P15-001 restriction; do not weaken |
| `ASSET_USER_QUOTA_BYTES` | Render service environment | Backend/private assets | Yes | No | No | Preserve or tighten the approved quota | P15-001 restriction; do not weaken |
| `ASSET_SIGNED_URL_TTL_SECONDS` | Render service environment | Backend/private assets | Yes | No | No | Approve a short lifetime later | Positive bounded value |
| `AWS_REGION` | Render service environment | Backend/S3 | Yes for S3 | No | No | Select only after current region review | Resource region remains unselected |
| `AWS_S3_BUCKET` | Render service environment | Backend/S3 | Yes for S3 | Operationally sensitive | Resource created later | Enter only after approved bucket creation | Staging-only private bucket |
| `AWS_ACCESS_KEY_ID` | Render secret store | Backend/S3 | Conditional | Yes | Provider-issued later | Create only through approved least-privilege IAM work | Pair only with its scoped secret |
| `AWS_SECRET_ACCESS_KEY` | Render secret store | Backend/S3 | Conditional | Yes | Provider-issued later | Create only through approved least-privilege IAM work | Rotate after exposure; never document |
| `AWS_S3_ENDPOINT` | Render service environment | Backend/S3 | No for native S3 | No | No | Leave absent unless a different provider is approved | Optional compatibility endpoint |
| `AWS_S3_FORCE_PATH_STYLE` | Render service environment | Backend/S3 | No for native S3 | No | No | Use only if later provider verification requires it | Boolean compatibility control |
| `AI_DEFAULT_PROVIDER` | Render service environment | Backend/AI gateway | Yes, configuration only | No | No | Preserve the validated provider selection | Live provider use remains disabled |
| `GEMINI_API_KEY` | Render secret store | Backend/AI gateway | No | Yes | No for initial staging | `DO NOT PROVISION FOR INITIAL STAGING` | Live AI exclusion is binding |
| `GEMINI_MODEL` | Render service environment | Backend/AI gateway | Configuration only | No | No | Revalidate before any later live AI authorization | No live call is authorized now |
| `AI_REQUEST_TIMEOUT_MS` | Render service environment | Backend/AI gateway | Yes | No | No | Preserve a bounded timeout | Applies even though live AI is initially disabled |
| `AI_MAX_RETRIES` | Render service environment | Backend/AI gateway | Yes | No | No | Preserve a bounded retry count | No keep-awake or synthetic provider traffic |
| `AI_DAILY_REQUEST_LIMIT` | Render service environment | Backend/AI gateway | Yes | No | No | Preserve an academic ceiling | Do not broaden access |
| `AI_DAILY_TOKEN_LIMIT` | Render service environment | Backend/AI gateway | Yes | No | No | Preserve an academic ceiling | Do not broaden access |
| `JOB_WORKER_ENABLED` | Render service environment | Backend/job worker | Yes | No | No | Enable only for the approved single embedded worker | Separate worker topology is not approved |
| `JOB_WORKER_ID` | Render service environment | Backend/job worker | Yes | No | Set later | Assign a staging-specific identifier later | Multi-instance use is not approved |
| `JOB_POLL_INTERVAL_MS` | Render service environment | Backend/job worker | Yes | No | No | Verify against sleeping/cold-start limits | Bounded poll interval |
| `JOB_LEASE_SECONDS` | Render service environment | Backend/job worker | Yes | No | No | Verify against job timing later | Bounded lease duration |
| `JOB_MAX_CONCURRENCY` | Render service environment | Backend/job worker | Yes | No | No | Keep bounded for the academic tier | One API instance only |
| `JOB_RETENTION_DAYS` | Render service environment | Backend/job worker | Yes | No | No | Configure within the seven-day maximum | Completed-job retention control |
| `ENABLE_DEV_ROUTES` | Render service environment | Backend/infrastructure tests | Yes | No | No | Keep disabled unless a separate bounded test authorizes it | Dev routes must not be exposed by default |
| `RESUME_PDF_MAX_PAGES` | Render service environment | Backend/Resume | Yes | No | No | Preserve or tighten the feature limit | Do not weaken |
| `RESUME_PDF_MAX_TEXT_CHARACTERS` | Render service environment | Backend/Resume | Yes | No | No | Preserve or tighten the feature limit | Do not weaken |
| `RESUME_ANALYSIS_JOB_MAX_ATTEMPTS` | Render service environment | Backend/Resume jobs | Yes | No | No | Preserve a bounded attempt ceiling | Validated integer |
| `INTERVIEW_MAX_QUESTIONS_PER_SESSION` | Render service environment | Backend/Interview | Yes | No | No | Preserve or tighten the feature limit | Do not weaken |
| `INTERVIEW_MAX_ANSWER_CHARACTERS` | Render service environment | Backend/Interview | Yes | No | No | Preserve or tighten the feature limit | Do not weaken |
| `INTERVIEW_AI_JOB_MAX_ATTEMPTS` | Render service environment | Backend/Interview jobs | Yes | No | No | Preserve a bounded attempt ceiling | Validated integer |
| `LEARNING_MAX_DOCUMENT_PAGES` | Render service environment | Backend/Learning | Yes | No | No | Preserve or tighten the feature limit | Do not weaken |
| `LEARNING_CHUNK_TARGET_WORDS` | Render service environment | Backend/Learning | Yes | No | No | Preserve validated chunk policy | Review before algorithm changes |
| `LEARNING_CHUNK_OVERLAP_WORDS` | Render service environment | Backend/Learning | Yes | No | No | Preserve validated overlap policy | Must remain within schema bounds |
| `LEARNING_MAX_CHAT_MESSAGE_CHARACTERS` | Render service environment | Backend/Learning | Yes | No | No | Preserve or tighten the feature limit | Do not weaken |
| `LEARNING_MAX_FLASHCARDS_PER_SET` | Render service environment | Backend/Learning | Yes | No | No | Preserve or tighten the feature limit | Do not weaken |
| `LEARNING_MAX_QUIZ_QUESTIONS` | Render service environment | Backend/Learning | Yes | No | No | Preserve or tighten the feature limit | Do not weaken |
| `LEARNING_AI_JOB_MAX_ATTEMPTS` | Render service environment | Backend/Learning jobs | Yes | No | No | Preserve a bounded attempt ceiling | Validated integer |
| `MIGRATION_PRODUCTION_CONFIRMATION` | Migration execution environment only | Migration CLI | No | Sensitive control | Per authorized run only | Do not deploy; set only for a separately authorized migration | Not part of application startup schema |
| `MONGOMS_DOWNLOAD_IGNORE_MISSING_HEADER` | Local test process only | Test harness | No | No | No | Do not deploy | Local in-memory MongoDB compatibility variable |
| `CAREER_HUB_TEST_ENV_FILE` | Local test process only | Test harness | No | Yes because the referenced file contains test secrets | Per local run only | Do not create or deploy | Test harness path only |
| `SENTRY_DSN` | Deferred monitoring provider and Render secret store | Backend/monitoring | No | Treat as secret | Provider-issued if approved later | Do not create or set without separate integration approval | Not read or validated by current application |
| `SENTRY_ENVIRONMENT` | Deferred Render service environment | Backend/monitoring | No | No | No | Do not set without separate integration approval | Not read or validated by current application |
| `SENTRY_RELEASE` | Deferred Render service environment | Backend/monitoring | No | No | Deployment-derived if approved | Do not set without separate integration approval | Not read or validated by current application |
| `CF_ACCESS_CLIENT_ID` | Deferred Cloudflare/browser-harness secret store | Browser staging verification | No | Yes | Provider-issued if approved later | Do not create or set without separate harness approval | Not read by current app or harness |
| `CF_ACCESS_CLIENT_SECRET` | Deferred Cloudflare/browser-harness secret store | Browser staging verification | No | Yes | Provider-issued if approved later | Do not create or set without separate harness approval | Never compile into the frontend |

## 14. Secret-generation policy

- Every staging secret must be newly generated for Career Learning Hub.
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `ASSET_SIGNING_SECRET` must be
  distinct and each satisfy the tracked minimum 32-character validation.
- Production placeholder rejection, exact origin validation, production HTTPS
  requirements, production password-hashing minimums, and all other tracked
  source validation must remain intact.
- No secret may be committed or pasted into documentation.
- No credential from an old uploaded `.env` file, local setup, another project,
  or the excluded Atlas project may be reused.
- Secrets belong only in the relevant provider secret store. Backend secrets
  must never enter Vercel or a frontend bundle.
- Exposure requires prompt rotation and review of affected sessions,
  credentials, signed URLs, and provider logs.
- Values are created only in later, separately authorized provisioning tasks.

## 15. Current blockers and gates

### A. Does not block Phase 18B activation

- Provider resources are not yet created.
- DNS is not yet configured.
- Staging secrets are not yet generated.
- Current provider settings are not yet validated.

These facts are expected at the manifest-review stage. They do not authorize
any provisioning or deployment.

### B. Blocks provisioning or deployment

- The dedicated Atlas project and cluster are absent.
- Production indexes have not been applied or verified.
- The S3 bucket and scoped IAM boundary are absent.
- The Cloudflare zone and Access policy are absent.
- The Vercel project is absent.
- The Render service is absent.
- Environment values are absent.
- The exact Render region is unavailable or unverified.
- The actual trusted proxy-hop value is unverified.
- DNS and TLS are absent.
- Remote CORS and cookie verification has not been performed.
- SPA rewrite configuration is absent.

### C. Blocks public exposure or production

- P15-001 remains technically unresolved.
- The security scan was not run; no pass is claimed.
- Staging is restricted to synthetic data.
- Unrestricted, public-scale, commercial, multi-user, and multi-instance use
  is not approved.
- This record makes no production-readiness claim.

## 16. Planned provisioning order

The later order is:

1. Approve this Phase 18B provider/secret manifest.
2. Complete documentation closeout and a separately authorized local commit.
3. Provision the dedicated Atlas project and a free-eligible staging cluster.
4. Create a scoped Atlas database user and bounded network access.
5. Apply and verify all required indexes.
6. Confirm current official Render region and plan capability.
7. Prepare bounded Render backend configuration.
8. Create the AWS private S3 staging bucket only after approved IAM and budget
   review.
9. Configure the Cloudflare zone and Access in a separately authorized
   DNS/access task.
10. Prepare Vercel frontend configuration.
11. Configure sibling staging DNS and TLS.
12. Deploy backend and frontend from `phase-18-staging-deployment`.
13. Run remote health, proxy, CORS, cookie, ownership, private-storage, worker,
    cleanup, rollback, browser, and human verification.
14. Only after staging approval, consider explicit merge authorization.

No step beyond item 1 is authorized by this task.

## 17. Retention and cost policy

- The AWS zero-spend warning is an early alert.
- The aggregate project ceiling is USD 10 per month.
- Synthetic users, owned records, and PDFs are deleted immediately after
  testing.
- Completed jobs, logs, browser evidence, monitoring events, and required
  backups have a maximum seven-day retention.
- Live AI-provider use is disabled for the initial baseline.
- Synthetic keep-awake traffic is prohibited.
- No paid upgrade is allowed without separate approval.

## 18. Security and accepted limitations

- Security scan: `NOT RUN — NO PASS CLAIMED`.
- P15-001: `TECHNICALLY UNRESOLVED`.
- Public, commercial, unrestricted multi-user, multi-tenant, and multi-instance
  operation is not approved.
- Operator screenshots confirm dashboard availability, not runtime behavior.
- Pricing, quotas, regions, and plan limits require later official
  revalidation.
- No provider resource was created in this task.

## 19. Human-review checklist

- [x] Confirm the exact bounded Phase 18B activation.
- [x] Confirm provider facts are recorded accurately.
- [x] Confirm the existing TXT record is preserved.
- [x] Confirm `main` remains unchanged.
- [x] Confirm the staging branch is retained.
- [x] Accept the dedicated Atlas decision.
- [x] Confirm the old Atlas project and cluster are excluded.
- [x] Confirm the AWS zero-spend budget is recorded.
- [x] Confirm the USD 10 aggregate ceiling is preserved.
- [x] Confirm the Vercel frontend-only boundary.
- [x] Confirm the Render backend-only boundary.
- [x] Confirm the Cloudflare operator-only policy.
- [x] Confirm the manifest contains environment names only.
- [x] Confirm no secret values are present.
- [x] Confirm no resource was created.
- [x] Confirm no deployment occurred.
- [x] Confirm no push or merge occurred.

## 20. Approval gate

Status:

`PHASE 18B PROVIDER/ACCOUNT READINESS AND SECRET-NAME MANIFEST: COMPLETED / HUMAN-APPROVED / LOCALLY COMMITTED`

Approval token:

`PHASE_18B_PROVIDER_AND_SECRET_MANIFEST_APPROVED`

Approval token accepted: `YES`.

Approval date: 2026-08-02.

Documentation closeout: `COMPLETED`.

Local commit:
`AUTHORIZED BY THIS PROMPT AND VERIFIED DIRECTLY FROM GIT AFTER COMMIT`.

## 21. Closeout record

- Approved commit boundary:
  - `docs/planning/CURRENT_PHASE.md`;
  - `docs/planning/CAREER_LEARNING_HUB_MASTER_PLAN.md`;
  - `docs/planning/DECISION_LOG.md`;
  - `docs/deployment/PHASE_18B_PROVIDER_ACCOUNT_AND_SECRET_MANIFEST.md`.
- Approval date: 2026-08-02.
- No secret value is present.
- No provider resource was created.
- No deployment occurred.
- No DNS or nameserver change occurred.
- No provider was contacted.
- No push or merge occurred.
- Provider provisioning remains `NOT STARTED / INACTIVE`.
- Staging deployment remains `NOT STARTED / INACTIVE`.
- DNS configuration remains `NOT STARTED / INACTIVE`.
- Phase 19 remains `PLANNED / INACTIVE`.
- The final commit hash is verified directly from Git after commit and is
  intentionally not self-recorded recursively in this same commit.
- The next task requires separate explicit provisioning authorization.
