# Phase 15B-2 auth session repair report

## Decision

The existing implementation commit passed its bounded scope and security
review. The known Learning source fixture defect was the only integration
blocker, and the one-file fixture repair restored the complete backend
integration suite. The validation pass left Phase 15B-2 ready for human review.
Human approval was subsequently accepted, so Phase 15B-2 is now completed and
approved.

## 1. Phase 15A baseline

- Branch: `phase-12-unified-frontend`
- Full baseline:
  `d9cec00abd5d1e7c5944eb2bf5ab2666a0ae9d47`
- Subject: `Complete Phase 15A security and privacy audit`

## 2. Existing implementation commit

- Full commit:
  `e00e7df2b28dbaec220f3801d1cf0fa6a26e2615`
- The working tree was clean before validation.
- The commit was inspected in place. It was not reset, amended, reverted,
  rebased, cherry-picked, squashed, or otherwise rewritten.

## 3. Commit parent

`git rev-parse HEAD^` returned the Phase 15A baseline:
`d9cec00abd5d1e7c5944eb2bf5ab2666a0ae9d47`.

## 4. Commit subject

`Harden session validation and atomic refresh-token rotation`

## 5. Exact commit path list

The commit contains exactly three modified paths:

1. `backend/src/middleware/authenticate.ts`
2. `backend/src/modules/auth/auth.service.ts`
3. `backend/src/tests/integration/auth.integration.test.ts`

`git show --check HEAD` passed. The commit contains no documentation,
frontend, package, lockfile, environment, schema, migration, deployment, or
generated-artifact path.

## 6. Skill availability

All requested skills were available and loaded:

1. `using-superpowers`
2. `karpathy-guidelines`
3. `define-goal`
4. `test-driven-development`
5. `systematic-debugging`
6. `security-best-practices`
7. `backend-api-design`
8. `technical-writing`
9. `verification-before-completion`

Unavailable requested skills: none.

The Express security reference, TDD anti-pattern reference, Codex skill
adaptation, and technical-writing style and anti-pattern guides were also
loaded. The Kotlin-specific parts of `backend-api-design` do not apply to this
Express repository; its compatible layering and narrow-scope principles were
used.

## 7. Original P15-002 behavior

Access-token authentication validated the JWT, active user, and
password-change cutoff but did not read the `AuthSession` identified by the
signed `sid`. Logout and logout-all revoked session records, yet an issued
access token remained usable until JWT expiry.

## 8. Original P15-003 behavior

Refresh rotation loaded a session, compared the supplied hash, generated a
replacement token, mutated the document, and saved it. Two simultaneous
requests could both pass the old-hash comparison before either save completed.

## 9. Commit-diff review

The complete commit diff and current supporting auth files were reviewed.
No production defect was found within the authorized contracts.

- Access authentication validates `sub` and `sid` as ObjectIds, then queries
  the active user and matching session
  (`backend/src/middleware/authenticate.ts:29`).
- The session predicate binds `_id` and `userId`, requires no `revokedAt`, and
  requires `expiresAt` later than the request time
  (`backend/src/middleware/authenticate.ts:47`).
- Password-change cutoff behavior remains intact
  (`backend/src/middleware/authenticate.ts:63`).
- Refresh rotation and stale-replay handling are in
  `backend/src/modules/auth/auth.service.ts:141`.
- No raw token, token hash, cookie, or secret is logged.
- Ownership predicates and generic invalid-session responses remain present.
- The committed tests use real middleware and database behavior. They do not
  mock authentication or add arbitrary waits.

## 10. Selected access-session design

The verified access token supplies the signed user ID and session ID.
Authentication rejects structurally invalid IDs and requires:

- an active user matching `sub`;
- a session whose `_id` matches `sid`;
- the session `userId` matching `sub`;
- no `revokedAt`; and
- `expiresAt` later than the request time.

The authenticated user and session IDs come only from the verified token.
Client query or body fields cannot replace them.

## 11. Selected atomic rotation design

Refresh rotation hashes the supplied token and performs one
`findOneAndUpdate` with all security conditions in the query:

- session ID;
- user ID;
- current supplied refresh-token hash;
- no `revokedAt`; and
- unexpired `expiresAt`.

The update replaces the canonical hash with the hash of a newly signed token
and updates last-use metadata. Only one request can match the old hash.

## 12. Five-second concurrency-grace policy

When the atomic update loses, the service checks the current session without
returning credentials. If the canonical hash changed less than five seconds
ago, the losing same-token request receives the generic invalid-session
response and does not revoke the winner.

This policy preserves the winner during benign concurrent browser requests.
The loser receives no access token and no refresh cookie.

## 13. Stale replay behavior

When the supplied stale token no longer matches and the canonical session's
`lastUsedAt` is at least five seconds old, a second conditional update revokes
that still-current session with reason `refresh-token-reuse-detected`.
The condition includes the observed canonical hash and `lastUsedAt`, so it
does not revoke a session that rotated again between the read and revocation
attempt.

## 14. Focused authentication result

Command:

`npm run test --workspace @career-learning-hub/api -- src/tests/integration/auth.integration.test.ts`

The first restricted-sandbox attempt could not bind the local test port and
collected no tests. It failed with `listen EPERM` on `0.0.0.0`. The same
command was rerun with permission for the isolated local MongoDB port.

Successful result:

- files: 1/1 passed;
- tests: 11/11 passed;
- failures: 0;
- Vitest duration: 4.52 seconds;
- warnings: none.

The tests cover ordinary logout invalidation, logout-all invalidation,
different-session preservation, password-change cutoff, fabricated and
expired session rejection, one concurrent refresh winner, no credentials for
the loser, continued winner use, canonical hash storage, no raw refresh-token
storage, stale replay revocation, and generic missing/revoked/expired
responses (`backend/src/tests/integration/auth.integration.test.ts:188`).

## 15. Security-suite result

Command: `npm run test:security`

- files: 4/4 passed;
- tests: 7/7 passed;
- failures: 0;
- Vitest duration: 4.07 seconds.

The spoofed `X-Forwarded-For` resistance test emitted
`ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`; the test passed and confirmed the
untrusted header is not accepted when proxy trust is disabled.

## 16. Initial integration result

Command: `npm run test:integration`

- files: 5 passed, 1 failed, 6 total;
- tests: 41 passed, 10 failed, 51 total;
- Vitest duration: 9.04 seconds.

Only `backend/src/tests/integration/learningDocumentSource.integration.test.ts`
failed. Its ten authenticated cases expected 200 or 404 and received 401
`INVALID_SESSION`. The unauthenticated 401 case passed. Authentication,
Learning deletion concurrency, job response, cross-user access, and resume
index files passed.

## 17. Learning fixture blocker

The production repair correctly requires an access token to reference an
active matching session. The Learning source fixture still issued tokens with
session IDs that had no database record.

## 18. Fixture root cause

The synthetic helper:

1. created an active `User`;
2. generated a random session ObjectId inline;
3. signed an access token with the user and random session IDs; and
4. did not create the corresponding `AuthSession`.

The resulting 401 responses were a fixture compatibility defect, not a
production authentication regression.

## 19. Fixture repair

Only
`backend/src/tests/integration/learningDocumentSource.integration.test.ts`
was changed.

The helper now:

- generates one session ObjectId;
- creates the user;
- creates an AuthSession with the same `_id` and user owner;
- uses `createSessionFamilyId`;
- stores only a SHA-256 hash of a generated synthetic refresh token;
- sets `lastUsedAt` to the fixture creation time;
- sets `expiresAt` 24 hours later;
- leaves `revokedAt` absent; and
- signs the access token with the same user and session IDs.

The change is at
`backend/src/tests/integration/learningDocumentSource.integration.test.ts:30`.
Global test teardown still deletes every collection after each test.

## 20. Resumed integration result

Focused Learning command:

`npm run test --workspace @career-learning-hub/api -- src/tests/integration/learningDocumentSource.integration.test.ts`

- files: 1/1 passed;
- tests: 11/11 passed;
- failures: 0;
- Vitest duration: 3.92 seconds;
- warnings: none.

Resumed broad command: `npm run test:integration`

- files: 6/6 passed;
- tests: 51/51 passed;
- failures: 0;
- Vitest duration: 8.75 seconds;
- warnings: none.

## 21. Backend unit result

Command: `npm run test:unit`

- files: 5/5 passed;
- tests: 19/19 passed;
- failures: 0;
- Vitest duration: 2.11 seconds;
- warnings: none.

## 22. Backend typecheck result

Command:
`npm run typecheck --workspace @career-learning-hub/api`

Result: passed with exit code 0.

## 23. Root typecheck result

Command: `npm run typecheck`

Result: passed with exit code 0 for frontend, backend, and shared types.

## 24. Production build result

Command: `npm run build`

Result: passed with exit code 0 for the Vite frontend and TypeScript backend.
Vite reported two ignored React Router `"use client"` directives and the
existing warning that one minified chunk exceeds 500 kB. The generated
frontend and backend `dist` directories were absent before the build and were
removed afterward.

## 25. Frontend and browser decisions

- Frontend tests were not run because no frontend source or public API
  response contract changed.
- Browser QA was prohibited and was not run.
- Playwright was prohibited and was not run.
- No frontend or backend development server was started.

## 26. Provider and Atlas status

- External AI provider calls: none.
- MongoDB Atlas use: none.
- Only the existing isolated in-memory MongoDB test infrastructure was used.
- Dependencies and tools were not downloaded or changed.
- Legacy projects were not accessed.

## 27. Cleanup evidence

- Test setup deletes all collections after every test, including synthetic
  users and AuthSessions.
- Global teardown stops the isolated replica set and removes its temporary
  runtime and storage root.
- No `career-learning-hub-vitest-*` directory remains under `/tmp`.
- No process listens on frontend port 5173 or backend port 8000.
- `pgrep` process enumeration is unavailable in this host. `lsof` identified
  one separate Homebrew MongoDB service at the standard local port with
  working directory `/opt/homebrew`; it is not the temporary test replica set
  and was not changed.
- No project `dist`, coverage, test-results, Playwright report, generated log,
  trace, screenshot, or HAR artifact remains.
- No raw refresh-token fixture was added to source or persisted by the
  repaired fixture.

## 28. Exact current working-tree changes

Before closeout staging, the expected unstaged changes were:

1. `backend/src/tests/integration/learningDocumentSource.integration.test.ts`
2. `docs/planning/CAREER_LEARNING_HUB_MASTER_PLAN.md`
3. `docs/planning/CURRENT_PHASE.md`
4. `docs/security/PHASE_15_FINDING_REGISTER.md`
5. `docs/planning/PHASE_15B2_AUTH_SESSION_REPAIR_REPORT.md`

The report is the only new file.

## 29. Residual risks

- Every authenticated request now depends on an AuthSession database lookup,
  adding latency and MongoDB availability coupling.
- An access request already in flight at the moment of session revocation can
  complete based on the authorization state observed by that request.
- The deliberate five-second concurrency grace favors benign multi-context
  availability over immediate canonical-session revocation for a same-token
  loss inside that window.
- A stale replay after the grace revokes the canonical session and requires
  the legitimate user to authenticate again.
- Existing Phase 15A accepted audit limitations remain unchanged.
- P15-001, P15-004, and P15-005 remain open and are outside this repair batch.

## 30. Phase state

- Phase 14: `COMPLETED`
- Phase 15: `ACTIVE`
- Phase 15A: `COMPLETED` / `APPROVED WITH ACCEPTED LIMITATIONS`
- Phase 15B-1: `PLANNED` / `INACTIVE`
- Phase 15B-2: `COMPLETED` / `APPROVED`
- Phase 15B-3: `PLANNED` / `INACTIVE`
- Phase 15B-4: `PLANNED` / `INACTIVE`
- Phase 16: `PLANNED` / `INACTIVE`

No other phase was activated.

## 31. Git state

- Existing implementation commit:
  `e00e7df2b28dbaec220f3801d1cf0fa6a26e2615`
- The closeout commit had not yet been created when this documentation was
  edited.
- Nothing was staged when this documentation was edited.
- Push is prohibited for this closeout and was not performed.
- The implementation commit was not rewritten.

## 32. Human review token

Accepted token:

`PHASE_15B2_AUTH_SESSION_REPAIR_APPROVED`

The operator supplied and accepted this token for Phase 15B-2 closeout.
