# Phase 15B-3 and Phase 15B-4 Origin and Registration Repair Report

## 1. Baseline and scope

- Prompt: `CLH-PHASE-15B34-ORIGIN-AND-REGISTRATION-SECURITY-REPAIR-01`
- Branch: `phase-12-unified-frontend`
- Starting and current full HEAD:
  `91baf956baa99bd46e57e4e2da3a82380224a196`
- Subject: `Complete Phase 15B-2 authentication repair`
- Starting worktree: clean, with nothing staged or untracked and no active Git
  operation.
- Phase 15 remains active. Phase 15B-2 remains completed and approved.
  Phase 15B-1 and Phase 16 remain planned and inactive.
- Scope: P15-004 fail-closed production origins and the bounded P15-005
  explicit duplicate-registration disclosure mitigation.

## 2. Skill availability

All required skills were available and loaded:

1. `using-superpowers`
2. `karpathy-guidelines`
3. `define-goal`
4. `test-driven-development`
5. `systematic-debugging`
6. `security-best-practices`
7. `backend-api-design`
8. `frontend-design`
9. `vercel-react-best-practices`
10. `browser:control-in-app-browser`
11. `technical-writing`
12. `verification-before-completion`

Unavailable required skills: none.

## 3. Original findings and attack paths

### P15-004

The frontend API client unconditionally fell back to
`http://localhost:8000/api/v1`, and backend `API_PUBLIC_ORIGIN` defaulted to
`http://localhost:8000` without a production-specific safety check.
Production `CLIENT_ORIGINS` also permitted local hosts. A deployment omission
could therefore compile or start successfully while directing browser
credentials/bearer traffic or signed private-asset capabilities to a process
on the end user's local port.

### P15-005

Registration queried for an existing email before insertion and returned HTTP
409 `EMAIL_ALREADY_REGISTERED` with an explicit “already exists” message.
This directly disclosed account membership. The unused-address path still
creates an authenticated account immediately, so removing the explicit error
cannot make the complete observable path indistinguishable without a new
ownership-verification or pending-registration architecture.

## 4. Exact write manifest

Backend production:

- `backend/src/config/env.ts`
- `backend/src/modules/auth/auth.service.ts`

Frontend production:

- `frontend/src/api/apiClient.ts`
- `frontend/src/features/auth/RegisterPage.tsx`

Tests:

- `backend/src/tests/security/cors.security.test.ts`
- `backend/src/tests/integration/auth.integration.test.ts`
- `backend/src/tests/integration/learningDocumentSource.integration.test.ts`
- `frontend/src/api/apiClient.test.ts`
- `frontend/src/routing/router.test.tsx`

Governance:

- `docs/planning/CAREER_LEARNING_HUB_MASTER_PLAN.md`
- `docs/planning/CURRENT_PHASE.md`
- `docs/security/PHASE_15_FINDING_REGISTER.md`
- `docs/planning/PHASE_15B34_ORIGIN_REGISTRATION_REPAIR_REPORT.md`

The manifest was revised after browser QA found missing server-error focus and
the final scope check required the report to be the sole untracked file. The
URL resolver was consolidated into `apiClient.ts`, the focus repair used
`RegisterPage.tsx`, and backend origin cases were consolidated into the
existing CORS security test. No standalone frontend config or backend test
file remains.

## 5. RED evidence

- `npm run test --workspace @career-learning-hub/api -- src/tests/unit/env.test.ts`
  - initial sandbox attempt could not bind the local test database;
  - approved local rerun collected 23 tests: 15 failed for the intended
    missing/unsafe/normalization origin contracts and 8 passed;
  - duration: 1.54 s; no product warning.
- `npm run test --workspace @career-learning-hub/web -- src/api/apiClient.test.ts`
  - 1 file, 48 tests: 10 intended production-configuration failures and 38
    passes;
  - duration: 818 ms.
- `npm run test --workspace @career-learning-hub/api -- src/tests/integration/auth.integration.test.ts`
  - 1 file, 13 tests: the two new duplicate/concurrent-registration contracts
    failed with the old HTTP 409 response; 11 passed;
  - duration: 4.56 s.
- `npm run test --workspace @career-learning-hub/web -- src/routing/router.test.tsx`
  and the focused Learning-source file remained green as characterization
  evidence before production changes.
- Edge-case RED added after review proved `.localhost` and IPv4-mapped IPv6
  loopback were still accepted before the validator was tightened.
- Browser QA exposed server-error focus on the page body. The corresponding
  router assertion then failed 1/48 before the focus repair.

## 6. Selected designs and implementation

### Production origins

- Backend validation rejects unsafe production `CLIENT_ORIGINS` and
  `API_PUBLIC_ORIGIN` forms: missing/default-local, malformed, HTTP,
  credentials, query, fragment, path for the origin-only backend value,
  localhost, `.localhost`, 127/8, IPv6 loopback, and IPv4-mapped IPv6
  loopback.
- Valid backend origins normalize through `URL.origin`.
- Development and test retain existing localhost defaults.
- Frontend `resolveApiBaseUrl` rejects a missing or unsafe production
  `VITE_API_URL`, permits the local fallback only outside production, and
  normalizes trailing slashes.
- Frontend production module initialization validates the injected
  `VITE_API_URL`; missing or unsafe values fail before an API request can be
  made.
- Learning signed-source construction remains unchanged and is covered by an
  assertion that its URL origin equals the validated `API_PUBLIC_ORIGIN`.
- Errors identify only `CLIENT_ORIGINS`, `API_PUBLIC_ORIGIN`, or
  `VITE_API_URL`; configured values and secrets are not printed.

### Registration response

- The existence pre-check was removed.
- The MongoDB unique index is the authoritative concurrency control.
- Duplicate key code 11000 maps to neutral HTTP 400 `REGISTRATION_FAILED`:
  “Registration could not be completed. Check the details or sign in if you
  already have an account.”
- New-account registration remains HTTP 201 with the existing authenticated
  response.
- Duplicate attempts cannot reach session creation and receive no access
  token, refresh cookie, or existing-account authentication.
- Tests prove the existing password hash, profile, and session count are
  unchanged and concurrent same-email attempts produce exactly one account
  and one session.
- Generic login behavior, validation, request IDs, CORS, and rate limits are
  preserved.
- The frontend continues to render authored neutral messages rather than
  technical codes, and the API failure alert now receives focus.

## 7. Focused GREEN evidence

- Backend CORS/environment:
  `npm run test --workspace @career-learning-hub/api -- src/tests/security/cors.security.test.ts`
  — 1 file, 31/31 tests, final duration 3.14 s; this includes direct proof
  that the 11th invalid public registration request receives the
  `auth-register` rate-limit response.
- Frontend API:
  `npm run test --workspace @career-learning-hub/web -- src/api/apiClient.test.ts`
  — 1 file, 50/50 tests, 810 ms.
- Authentication:
  `npm run test --workspace @career-learning-hub/api -- src/tests/integration/auth.integration.test.ts`
  — 1 file, 13/13 tests, final duration 4.75 s.
- Learning source:
  `npm run test --workspace @career-learning-hub/api -- src/tests/integration/learningDocumentSource.integration.test.ts`
  — 1 file, 11/11 tests, 4.23 s.
- Registration routing:
  `npm run test --workspace @career-learning-hub/web -- src/routing/router.test.tsx`
  — 1 file, 48/48 tests after the focus repair, final duration 3.00 s.
- Final focused frontend auth/API command:
  `npm run test --workspace @career-learning-hub/web -- src/api/apiClient.test.ts src/features/auth/AuthProvider.test.tsx src/routing/router.test.tsx`
  — 3 files, 111/111 tests, 3.07 s.

## 8. Broad regression evidence

- `npm run test:security`
  - 4/4 files, 35/35 tests, final duration 4.14 s;
  - warning: the intentional spoofed `X-Forwarded-For` test emitted the
    existing `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` diagnostic while passing.
- `npm run test:integration`
  - 6/6 files, 53/53 tests, 9.67 s.
- `npm run test:unit`
  - 5/5 files, 19/19 tests, final duration 2.28 s.
- `npm run test --workspace @career-learning-hub/web`
  - 41/41 files, 584/584 tests, final duration 13.76 s.
- `npm run typecheck --workspace @career-learning-hub/api`
  - passed.
- `npm run typecheck:test --workspace @career-learning-hub/api`
  - passed.
- `npm run typecheck --workspace @career-learning-hub/web`
  - passed.
- `npm run typecheck`
  - frontend, backend, and shared types passed.
- `VITE_API_URL=https://api.example.test/api/v1 npm run build`
  - frontend and backend production builds passed, final duration 7.0 s;
  - warnings: two React Router `"use client"` directives were ignored and the
    frontend bundle exceeded the existing 500 kB chunk advisory.
- Production-mode `apiClient` initialization tests reject an omitted
  `VITE_API_URL`, naming only the variable and printing no configured value.
- Phase 14 Playwright E2E was not rerun.

## 9. Browser QA

Focused in-app browser QA used only the existing frontend, compiled backend,
and isolated in-memory MongoDB with synthetic `example.test` users.

- Viewports: 1440, 1024, 768, 390, and 320 px.
- Passed:
  - valid registration and navigation to the dashboard;
  - logout and login navigation availability;
  - neutral duplicate-registration copy and request ID;
  - no `EMAIL_ALREADY_REGISTERED`, “already exists,” or password echo;
  - invalid-input field guidance;
  - delayed loading state with disabled inputs/button,
    `aria-busy="true"`, and “Creating account…”;
  - keyboard focus on client-validation and server-error alerts;
  - card, form, and error containment without horizontal overflow; and
  - no browser console errors.
- No screenshot or trace was persisted.
- The visual review was approved with
  `PHASE_15B34_AUTH_UI_VISUAL_APPROVED`.

## 10. Residual risks and privacy review

- P15-004: repository validation cannot prove production TLS termination,
  reverse-proxy rewrites, DNS, or externally visible origin behavior.
- P15-005: unused-address HTTP 201 authenticated success remains observably
  different from existing-address HTTP 400 neutral failure. Complete
  elimination requires an approved email-ownership or pending-registration
  architecture and is not claimed.
- Per-process registration rate limits remain a deployment-dependent boundary
  already tracked separately.
- No real personal data was used. Application/server/browser-console logs
  contained no password, email, access token, refresh token, cookie, origin
  credential, or environment secret. Transient form inspection used only
  synthetic `example.test` identities and test passwords; those values were
  not persisted in repository reports or generated artifacts.
- No external AI provider was called and MongoDB Atlas was not used.
- Packages, lockfiles, environment files, schemas, migrations, deployments,
  and legacy projects were unchanged. No `.env` content was directly
  inspected or printed.

## 11. Cleanup and Git state

- Frontend, backend, delay-proxy, and temporary MongoDB services were stopped.
- The temporary database was process-local and is gone; its synthetic users
  and AuthSessions cannot persist.
- Task-specific storage and scripts, frontend/backend build outputs, and any
  screenshot/trace state were removed.
- Port checks found no listeners on 4175, 8015, or 8016.
- Repository checks found no generated logs, coverage, traces, screenshots,
  or task runtime directories.
- OS-wide process listing and one protected system temporary directory were
  unavailable; teardown completion, closed ports, task-specific searches, and
  repository evidence were used instead.
- HEAD remains
  `91baf956baa99bd46e57e4e2da3a82380224a196`.
- The closeout commit had not yet been created when this documentation was
  edited. Push is prohibited and was not performed.

## 12. Phase and finding states

- Phase 14: `COMPLETED`
- Phase 15: `ACTIVE`
- Phase 15A: `COMPLETED` / `APPROVED WITH ACCEPTED LIMITATIONS`
- Phase 15B-1: `PLANNED` / `INACTIVE`
- Phase 15B-2: `COMPLETED` / `APPROVED`
- Phase 15B-3: `COMPLETED` / `APPROVED`
- Phase 15B-4: `COMPLETED` / `APPROVED AS BOUNDED MITIGATION`
- Phase 16: `PLANNED` / `INACTIVE`
- P15-001: `OPEN / UNCHANGED`
- P15-002: `REPAIRED / CLOSED`
- P15-003: `REPAIRED / CLOSED`
- P15-004: `REPAIRED / CLOSED`
- P15-005:
  `MITIGATED / CLOSED WITH DOCUMENTED RESIDUAL ENUMERATION SIDE CHANNEL ACCEPTED FOR THE CONTROLLED ACADEMIC MVP`
- Remaining open confirmed finding: P15-001 only.

An unused-address HTTP 201 authenticated success remains distinguishable from
an existing-address HTTP 400 neutral failure. Complete elimination would
require an approved ownership-verification or pending-registration
architecture.

Accepted security-review token:

`PHASE_15B34_SECURITY_REPAIR_APPROVED`

Accepted visual-review token:

`PHASE_15B34_AUTH_UI_VISUAL_APPROVED`
