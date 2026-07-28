# Phase 15A Security and Privacy Audit Report

## Report control

- Prompt: `CLH-PHASE-15A-ACTIVATE-AND-AUDIT-01`
- Branch: `phase-12-unified-frontend`
- Baseline and current HEAD:
  `da3deb50cdfd2f9130ca0e3ce4fbea1cc08d8a51`
- Subject: `Add end-to-end application coverage`
- Phase 14: `COMPLETED`
- Phase 15: `ACTIVE`
- Phase 15A: `ACTIVE`
- Phase 16: `PLANNED` / `INACTIVE`
- Production and test code: read-only
- External AI provider calls: none
- Pre-approval decision: `BLOCKED`
- Reason: the six required canonical `codex-security:*` skills/workspace are
  unavailable, and a current online dependency advisory query could not be
  completed. No scan IDs, SARIF, manifests, or coverage artifacts were
  invented.
- Required token after the coverage limitation is explicitly resolved or
  accepted: `PHASE_15A_SECURITY_PRIVACY_AUDIT_APPROVED`

## Requested outcome

Activate Phase 15, build a current threat model and ownership map, inspect the
repository's security and privacy boundaries without changing production or
tests, validate candidates before classification, and propose bounded repair
batches for confirmed findings.

The audit met the documentation and manual-review scope. It cannot claim the
canonical repository and diff-scan coverage required by the prompt because
the requested scan skills and app workspace do not exist in this host.

## Skill availability

### Loaded exact-name skills

1. `using-superpowers`
2. `karpathy-guidelines`
3. `define-goal`
4. `security-best-practices`
5. `privacy`
6. `security-ownership-map`
7. `requesting-code-review`
8. `receiving-code-review`
9. `systematic-debugging`
10. `technical-writing`
11. `verification-before-completion`

### Unavailable exact-name skills

1. `codex-security:security-scan`
2. `codex-security:security-diff-scan`
3. `codex-security:threat-model`
4. `codex-security:finding-discovery`
5. `codex-security:validation`
6. `codex-security:attack-path-analysis`

### Differently named skill used

- `security-threat-model` was available and used as the repository-grounded
  fallback for the unavailable `codex-security:threat-model`.

### Capability limitations

- Tool discovery found no Codex Security app workspace or callable scan
  capability.
- The available ownership-map skill requires `networkx` for its automated
  contributor/co-change graph. The module is not installed, and dependency
  installation is prohibited. Domain-resource ownership was traced manually;
  contributor bus-factor automation was not claimed.
- A privacy-safe Git count shows one unique author for the repository and
  application paths. No contributor identity is included in audit artifacts.

## Governance discovery

| Item | Result |
| --- | --- |
| Existing `SECURITY.md` | Absent |
| Existing threat model | Absent before Phase 15A |
| Existing ownership map | Absent before Phase 15A |
| Existing finding register | Absent before Phase 15A |
| Existing security evidence | Phase 9 hardening document, Phase 10 baseline report, Phase 13 integrated QA report, Phase 14 E2E report, security/integration/unit/E2E tests |
| Existing accepted-risk register | No canonical register; Phase 10 recorded untriaged npm audit results |
| Security headers | Helmet, no-referrer, production HSTS, no-sniff/default Helmet controls, private no-store; CSP intentionally disabled at API layer |
| Boundary middleware | request ID/context, exact CORS, rate limits, body-size limits, cookie parser, authentication, Zod validation, normalized errors |
| Runtime validation | Vitest with temporary MongoDB replica set and local storage; Playwright E2E with synthetic fixtures |

## Scope and coverage accounting

### Repository snapshot scope

- Total tracked files: 317
- Backend: 153
- Frontend: 116
- E2E: 12
- Documentation: 27
- Shared package: 3
- Top-level configuration/governance: 6
- Extensions:
  - 191 `.ts`
  - 65 `.tsx`
  - 29 `.md`
  - 11 `.cjs`
  - 10 `.json`
  - 5 `.css`
  - 2 `.example`
  - 1 `.pdf`
  - 3 other top-level text/config files

All tracked files were scope-accounted. Searches covered tracked text for
credentials, unsafe browser sinks, request-body assignment, ownership fields,
routes, validation, transactions, retention, and artifacts. Deep manual
review covered all 74 backend HTTP handlers across 14 routers and the
security-relevant middleware, services, models, storage adapters, workers,
frontend auth/private-PDF/quiz paths, tests, and E2E harness.

The 610-byte tracked synthetic PDF was treated as a fixture binary. Its path,
purpose, size, Git attributes, and cleanup use were reviewed; its binary
payload was excluded from source-line analysis.

### Repository security scan

- Route: prompt-only terminal review because no app workspace or scan skill is
  available.
- Canonical scan ID: none.
- Canonical external artifact path: none.
- Canonical manifest/findings/coverage/report/SARIF: not generated.
- Coverage status: incomplete against the prompt's required canonical scan
  contract.
- Manual coverage: repository scope accounting plus evidence-led targeted
  review and tests, documented in this report.

### Git diff range

- Base revision: `92066731b57abc27a392fb35cf009100568d39dd`
- Head revision: `da3deb50cdfd2f9130ca0e3ce4fbea1cc08d8a51`
- Merge base with `main`:
  `92066731b57abc27a392fb35cf009100568d39dd`
- Rationale: this is the authoritative Git-backed range from the current
  branch's divergence from `main` through the integrated application. The
  Phase 14 commit alone would not represent the application under review.
- Range size: 177 files, 64,422 insertions, 2,555 deletions.
- Distinct canonical diff scan: not performed because
  `codex-security:security-diff-scan` is unavailable.
- Diff scan ID/artifact path: none.
- Manual overlap: current forms of all security-sensitive changed backend
  files, frontend auth/private-data contracts, E2E support, package
  configuration, and directly supporting tests were reviewed. No claim is
  made that this substitutes for canonical diff-scan artifacts.

## Audit matrix and results

### Authentication and session

| Area | Evidence | Result |
| --- | --- | --- |
| Registration | Strict schema, bcrypt, session creation, per-IP limit | Account-existence disclosure `P15-005` |
| Sign-in | Strict schema, generic invalid-credential error, bcrypt, session creation | Pass |
| Access-token validation | JWT type/issuer/audience/expiry, active user, password-change cutoff | Pass with `P15-002` |
| Browser token storage | React ref only; no production local/session storage or IndexedDB use | Pass |
| Refresh cookie | HttpOnly, Secure in production, SameSite=Lax, narrow path, bounded TTL | Pass |
| Refresh rotation/reuse | Hashed token, rotation, expiry/revocation, reuse revokes session | Concurrent rotation gap `P15-003` |
| Logout/logout-all | Cookie cleared and stored sessions revoked | Access-token revocation gap `P15-002` |
| Account isolation | User loaded from token subject; roles/status not client-assignable | Pass |
| Brute force | Register/login/refresh and domain rate limits | Pass for single process; `P15-I01` |

### Request boundaries

| Area | Evidence | Result |
| --- | --- | --- |
| CORS/credentials | Explicit normalized origin set, no wildcard, credentials true, denied Origin fails before route | Pass |
| CSRF-relevant routes | CORS Origin enforcement plus host-only SameSite=Lax refresh cookie | Pass |
| Body/query/params | Parsed values replace request surfaces; strict/allowlisted schemas; object-ID regex | Pass |
| Request sizes | Global 1 MB JSON/form limits before parsing; multipart limits | Pass |
| Error mapping | Generic internal errors, normalized upload/database errors, bounded safe details | Pass |
| Request IDs | Canonical pattern or random UUID; response and structured errors; safe logs | Pass |
| Production origins | Frontend API base and backend public origin default to HTTP localhost when omitted | Medium `P15-004` |
| Headers/deployment | Helmet and no-store at API; frontend edge/CSP evidence absent | Informational `P15-I03` |

### Authorization and ownership

The ownership map covers User, AuthSession, Resume, ResumeVersion,
ResumeAnalysis/recommendations, InterviewSession, InterviewQuestion,
InterviewAttempt/feedback/notes, LearningDocument, Asset, DocumentChunk,
Conversation, Message, FlashcardSet, Flashcard, Quiz, QuizQuestion,
QuizAttempt, JobRecord, ActivityEvent, UsageEvent, and AiQuotaCounter.

Every reviewed private individual read includes authenticated `userId`.
Nested records add their parent relationship. Lists begin with `userId`.
Controllers never accept an owner ID. Foreign resources return safe missing or
generic conflict states. The security and integration tests passed.

Result: no validated IDOR or mass-assignment finding.

### Files and private assets

| Area | Evidence | Result |
| --- | --- | --- |
| PDF and media upload | One in-memory file, byte/field limits, purpose/MIME allowlist, magic bytes, checksum | Pass |
| Object keys/path | User/date/UUID server key; local root containment; exclusive create | Pass |
| Owner scoping | Asset metadata/content/signed URL/delete start from `getOwnedAsset` | Pass |
| Signed access | HMAC or S3 presign, bounded TTL, owner-only issuance, no-store | Pass; accepted `AR-001` |
| Browser PDF | No-referrer/credentials omitted, content type/size checked, blob URL revoked on stale/unmount | Pass |
| Quota | Aggregate check before write is not atomic across requests | Medium `P15-001` |
| Parser | Auth/file limits and queue decoupling in the same API process; no safe resource-exhaustion validation | Deferred `D-002` |

### AI and asynchronous jobs

| Area | Evidence | Result |
| --- | --- | --- |
| Provider boundary | Fixed Gemini endpoint/model, optional key, timeout/retry, quota | Pass; provider not called |
| Prompt inputs | Private fields explicitly delimited as untrusted | Pass |
| Output | JSON extraction, Zod schemas, domain-specific reference/index/citation checks | Pass |
| Stored output | Owner and parent IDs applied by server, not provider | Pass |
| Answer secrecy | Taking projection excludes correct index and explanation; frontend exact keys | Pass |
| Job ownership | Owner-bound create/get/cancel; payload omitted from public response | Pass |
| Idempotency | Unique job/request keys and duplicate-key recovery | Pass |
| Transactions | Resume versions, rewrites, chat, assessments, and deletion use explicit-return transaction callbacks | Pass |
| Deletion fencing | Work fence, deletion owner job, queued cancellation, retry cancellation, cascade transaction | Pass |
| Worker concurrency | Deployment topology unproven; retry/fail lack per-claim lease fencing | Deferred `D-003` |

### Privacy, logs, and telemetry

| Area | Evidence | Result |
| --- | --- | --- |
| Passwords/tokens | Hashes hidden, cookies/tokens absent from logs, secrets validated and distinct | Pass |
| User content | No request-body logging; sensitive keys/text patterns redacted | Pass |
| Errors | Production authored/internal error details bounded; raw stacks not public | Pass |
| Activity/usage | Owner-scoped, narrow metadata, no raw prompts or content | Pass with retention gap `P15-I04` |
| Provider data | Explicit functional boundary, structured output, no audit-time call | Accepted `AR-002` |
| E2E identities | Random `.test` users and generated passwords | Pass |
| E2E artifacts | External temp root, video off, cleanup; traces/screenshots retained on failure | Informational `P15-I02` |
| Repository secrets | Filename-only signature scan found no candidate key/private-key file; real `.env` was not read | Pass within pattern limits |

## Candidate validation ledger

### Confirmed

| ID | Severity | Confidence | Summary |
| --- | --- | --- | --- |
| `P15-001` | Medium | High | Concurrent uploads can pass the same pre-write quota observation and cumulatively exceed the per-user limit |
| `P15-002` | Low | High | Logout/logout-all revoke refresh sessions but issued access tokens remain valid until short expiry |
| `P15-003` | Medium | High | Concurrent refresh requests can rotate the same stored token, weakening one-use replay protection and session availability |
| `P15-004` | Medium | High | Omitted production API/public-origin configuration silently routes browser traffic or signed local-asset capabilities to HTTP localhost |
| `P15-005` | Low | High | Public registration returns a distinct response that reveals whether a supplied email already has an account |

### Informational

| ID | Summary |
| --- | --- |
| `P15-I01` | Rate-limit store is process-local unless deployment supplies a shared store |
| `P15-I02` | Failed E2E traces/screenshots need explicit disposal from the external temp root |
| `P15-I03` | Frontend edge/TLS/CSP/proxy controls are not evidenced by tracked deployment configuration |
| `P15-I04` | Resume, Interview, Activity, and Usage data have no tracked retention/account-erasure policy |
| `P15-I05` | Security-sensitive history has one-contributor concentration; automated graph unavailable |

### Rejected

Seven candidates were rejected with concrete control evidence:

1. signed-download IDOR;
2. pre-submission quiz answer leakage;
3. storage path traversal;
4. request-body mass assignment;
5. prompt injection reaching a privileged action;
6. trivial refresh/logout CSRF; and
7. browser token persistence.

### Deferred

1. Current dependency advisory status (`D-001`).
2. Crafted-PDF parser resource exhaustion (`D-002`).
3. Multi-replica worker lease fencing (`D-003`).

### Accepted risk

1. Temporary signed URLs act as short-lived bearer capabilities.
2. User-initiated private content crosses the configured AI-provider
   boundary.

Full source, control, sink, attack path, validation, mitigation, repair, test,
and residual-risk details are in
`docs/security/PHASE_15_FINDING_REGISTER.md`.

## Dependency advisory evidence

1. `npm audit --omit=dev --json`
   - Result: failed before advisory data.
   - Exact cause: restricted DNS could not resolve `registry.npmjs.org`.
2. Escalated read-only advisory request
   - Result: rejected because sending the repository dependency inventory to
     an external advisory service was not explicitly authorized.
   - No workaround or alternate external disclosure was attempted.
3. `npm audit --offline --omit=dev --json`
   - Result: exit 0, 0 advisories reported across 606 dependencies.
   - Limitation: offline cache output does not prove current advisory
     coverage.
4. Phase 10 historical evidence
   - Recorded one High and one Critical npm audit result without package
     identities or triage.
   - The current relationship of those historical results to the lockfile is
     unverified.

## Runtime validation

No frontend/backend service or Browser session was needed. Existing test
harnesses created isolated temporary MongoDB/storage state and cleaned it
through their registered teardown.

| Command | Result |
| --- | --- |
| `npm run test:security` | First restricted run failed before collection with `listen EPERM`; approved local-port rerun passed 4/4 files and 7/7 tests in 4.37s |
| `npm run test --workspace @career-learning-hub/api -- src/tests/integration/auth.integration.test.ts src/tests/integration/crossUserAccess.integration.test.ts src/tests/integration/jobResponse.integration.test.ts src/tests/integration/learningDocumentDeletionConcurrency.integration.test.ts src/tests/integration/learningDocumentSource.integration.test.ts` | Passed 5/5 files and 40/40 tests in 7.51s |
| `npm run test --workspace @career-learning-hub/api -- src/tests/unit/loggerRedaction.test.ts src/tests/unit/aiOutputValidation.test.ts src/tests/unit/ownershipServices.test.ts src/tests/unit/validate.test.ts` | Passed 4/4 files and 14/14 tests in 2.48s |
| `npm run test --workspace @career-learning-hub/web -- src/api/apiClient.test.ts src/features/auth/AuthProvider.test.tsx src/features/learning/LearningDocumentWorkspace.test.tsx src/features/learning/learningQuizContracts.test.ts src/features/learning/QuizTaker.test.tsx` | Passed 5/5 files and 128/128 tests in 2.57s |

The rate-limit bypass security test emitted its expected
`ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` diagnostic while proving that a spoofed
header is not trusted when proxy trust is disabled. The file passed.

No test, typecheck, build, complete suite, Playwright run, general visual
review, S3 request, production deployment check, or external provider call was
required or claimed.

## Cleanup

- Test-created MongoDB replica sets stopped through Vitest global teardown.
- Test runtime directories and private storage were removed by the existing
  teardown.
- No Phase 15 synthetic user was created outside the test harness.
- No frontend or backend foreground service was started.
- The temporary dependency inventory file created in `/private/tmp` was
  removed.
- Repository scan artifacts, SARIF, traces, screenshots, reports outside the
  authorized report, coverage, builds, and test results: absent.
- Tagged users/owned records/private files remaining from this audit: zero by
  the isolated test lifecycle; no persistent application database was used.

## Proposed repair batches

### Phase 15B-1 — Atomic asset quota enforcement

- Finding: `P15-001`
- Scope: asset quota reservation/compensation plus create/delete/cleanup
  integration.
- Tests: concurrent commits, failure compensation, deletion/expiry release,
  and cross-user isolation.
- Runtime: isolated MongoDB replica set and local private storage.
- Visible UI: none expected.
- Commit boundary: one quota enforcement change with its tests and evidence.

### Phase 15B-2 — Session revocation and atomic refresh rotation

- Findings: `P15-002`, `P15-003`
- Scope: authentication middleware/session helper plus one atomic refresh
  claim/rotation policy.
- Tests: ordinary logout, logout-all, parallel sessions, password change,
  concurrent refresh, stale replay, expired/fabricated session, and generic
  error behavior.
- Runtime: isolated MongoDB replica set.
- Visible UI: none expected unless product semantics change.
- Commit boundary: one auth change with tests and evidence.

### Phase 15B-3 — Fail-closed production API-origin configuration

- Finding: `P15-004`
- Scope: frontend API-base initialization and backend production
  `API_PUBLIC_ORIGIN` validation.
- Tests: production missing/localhost/HTTP rejection, approved HTTPS or
  same-origin normalization, and signed-URL origin construction.
- Runtime: production-mode configuration tests and a local smoke
  configuration; no external provider.
- Visible UI: none except intentional fail-fast behavior for a misconfigured
  build or start.
- Commit boundary: origin validation, focused tests, example configuration,
  and evidence.

### Phase 15B-4 — Registration account-enumeration response

- Finding: `P15-005`
- Scope: choose and implement an explicit neutral public registration
  contract, preserving uniqueness and generic login behavior.
- Tests: indistinguishable existing/unused-address responses, concurrent
  duplicate registration, generic login errors, and rate limiting.
- Runtime: isolated MongoDB replica set; no external provider.
- Visible UI: possible registration messaging change; Browser/human visual QA
  applies if visible wording changes.
- Commit boundary: registration contract, focused tests, necessary UI wording,
  and evidence.

### Evidence prerequisites outside repair batches

- Scope: obtain explicit authorization for a current advisory query or
  approved offline scanner; establish replica topology, shared rate-limit
  store, per-claim worker fencing requirements, edge headers, private-domain
  and telemetry retention, failed E2E artifact disposal, and security review
  ownership.
- Code repairs: none until a deferred/configuration candidate is validated and
  separately authorized.

## Human review gate

The approval token remains defined but is not requested in this report. The
prompt prohibits requesting it while scan coverage is incomplete without an
explicit accepted limitation.

Human review must first either:

1. provide the missing canonical Codex Security capabilities and complete the
   repository/diff scans; or
2. explicitly accept the manual-review substitution and the current online
   dependency-advisory limitation.

After that coverage decision, review should confirm the five finding
classifications and authorize, reject, or revise the proposed Phase 15B repair
batches.

## Final finding counts

- Critical: 0
- High: 0
- Medium: 3
- Low: 2
- Informational: 5
- Rejected candidates: 7
- Deferred candidates: 3
- Accepted risks: 2
- Verification blockers: 2
  - canonical Codex Security scan capability unavailable;
  - current online dependency advisory coverage unavailable.

## Final decision

The repository-grounded threat model, ownership map, manual audit, candidate
validation, runtime checks, finding register, and repair proposals are
complete within the available capabilities. The five findings are bounded and
have proposed response plans. Production and tests remain unchanged.

Phase 15 and Phase 15A remain active. Phase 16 remains planned and inactive.
The audit remains `BLOCKED` from human approval because the required canonical
scan contract and current dependency advisory coverage are incomplete.

## Post-audit documentation commit

After the Phase 15A audit stopped with the decision `BLOCKED`, the reviewed
documentation-only result was committed separately. The audit execution itself
created no commit.

- Audit baseline HEAD:
  `da3deb50cdfd2f9130ca0e3ce4fbea1cc08d8a51`
- Previous full HEAD:
  `da3deb50cdfd2f9130ca0e3ce4fbea1cc08d8a51`
- Documentation commit full HEAD:
  `2399f4d5a191d1409c3bc399051083d82654d742`
- Documentation commit short HEAD: `2399f4d`
- Documentation commit parent:
  `da3deb50cdfd2f9130ca0e3ce4fbea1cc08d8a51`
- Documentation commit subject:
  `Activate Phase 15A security and privacy audit`
- Commit date: `2026-07-28T19:01:13+05:30`
- Author date: `2026-07-28T19:01:13+05:30`
- Exact committed path count: 7
- Exact committed paths:
  1. `docs/planning/CAREER_LEARNING_HUB_MASTER_PLAN.md`
  2. `docs/planning/CURRENT_PHASE.md`
  3. `docs/planning/PHASE_15_SECURITY_PRIVACY_PLAN.md`
  4. `docs/planning/PHASE_15_SECURITY_PRIVACY_REPORT.md`
  5. `docs/security/PHASE_15_THREAT_MODEL.md`
  6. `docs/security/PHASE_15_FINDING_REGISTER.md`
  7. `docs/security/OWNERSHIP_MAP.md`
- Commit scope: documentation and security-governance files only.
- Production code changed: no.
- Test code changed: no.
- Package or lockfile changed: no.
- Environment file changed: no.
- Push status: No push was performed by the audit or this recording
  execution; remote publication status was not independently verified.
- Phase 15: `ACTIVE`.
- Phase 15A: `ACTIVE` / `BLOCKED`.
- Phase 16: `PLANNED` / `INACTIVE`.

The documentation commit records the completed manual audit evidence. It does
not convert the audit decision from `BLOCKED` to `READY`, resolve the
unavailable canonical repository or diff security-scan coverage, resolve
current online dependency-advisory coverage, or authorize a security repair.
The human review token remains:
`PHASE_15A_SECURITY_PRIVACY_AUDIT_APPROVED`.
