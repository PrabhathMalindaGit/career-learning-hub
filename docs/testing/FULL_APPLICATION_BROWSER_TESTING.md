# Full Application Browser Testing

## Purpose

Full Application Browser Testing exercises the principal Career Learning Hub user workflows through a real Chromium browser. Executable browser tests live in `tests/browser/`; this document is operational guidance only.

The suite covers authentication, protected routing, session persistence, Dashboard, Resume Studio, Interview Coach, Learning Workspace, ownership isolation, private PDF access, answer secrecy, responsive behavior, console health, and horizontal-overflow checks.

## Browser matrix

| Project | Viewport |
| --- | --- |
| `desktop` | 1440 × 900 |
| `tablet` | 768 × 1024 |
| `mobile` | 390 × 844 |

The configured suite uses one worker and zero retries so failures remain visible and the isolated service lifecycle stays deterministic.

## Local services

The Playwright configuration starts and stops the local services required by the suite:

- an isolated `MongoMemoryReplSet` database;
- the Express backend on `127.0.0.1:8000`;
- the Vite frontend on `127.0.0.1:4173`.

Do not connect this suite to MongoDB Atlas or production services. Do not start persistent frontend, backend, or database services for the automated browser campaign unless a specific diagnostic requires it.

Provider-backed AI calls remain outside the default synthetic browser suite. The suite must not use real provider credentials.

## Synthetic data and cleanup

Use generated `@example.test` identities and tracked synthetic fixtures only. Do not use real personal data, production exports, real resumes, private documents, or provider credentials.

Global/per-test cleanup must remove synthetic identities and owned data. The service harness must stop spawned frontend/backend/database processes and remove temporary runtime/private-storage artifacts after the run.

## Failure artifacts

Failure-only screenshots and traces are written outside the repository under the configured temporary browser-test directory. Video remains disabled unless a separately approved diagnostic requires it.

Generated browser reports, screenshots, traces, test-results directories, temporary private storage, runtime data, and logs must not be committed.

## Running the suite

The repository currently does not declare portable `npm run test:browser` or `npm run test:e2e` scripts. Full Application Browser Testing uses the separately approved bundled Playwright runtime until a repository-local runner is explicitly approved.

Use the discovered bundled Node executable and package directory at execution time:

```bash
NODE_PATH="<bundled-node-modules>" \
  "<bundled-node>" \
  "<bundled-node-modules>/playwright/cli.js" \
  test --config=tests/browser/playwright.config.cjs
```

Do not commit a user-specific runtime/cache path. Do not use `npx` if it would download an undeclared Playwright dependency.

To inspect test discovery without starting services, append `--list`.

## Verification expectations

A successful complete browser campaign should verify the configured principal workflows across the supported projects and report exact pass/fail/skip counts. It should also confirm cleanup of synthetic data and spawned services.

Human visual QA remains separate from automated browser testing. Visible UI changes require human review at the relevant desktop/tablet/mobile breakpoints before final approval.

## Final evidence boundary

The Phase 20A final release evidence records the authoritative final automated application qualification:

- backend full suite: 515/515 passing;
- frontend full suite: 1,170/1,170 passing;
- non-overlapping complete-suite total: 1,685 passing tests;
- backend production and test-source typechecks: PASS;
- frontend typecheck: PASS;
- backend/frontend/root production builds: PASS.

The final human/live evidence chain includes Phase 19G integrated browser QA and focused human visual approval for the final Resume assessment-action polish.

Historical browser campaigns remain available through Git history when needed for traceability; they are not treated as newer evidence than the Phase 20A release freeze.

## Troubleshooting boundaries

- Read the complete error and identify the failing layer before changing anything.
- Reproduce the failure before attempting a repair.
- Do not change application behavior, ownership rules, authentication, private-file controls, or answer secrecy merely to obtain a passing browser test.
- Do not enable retries to hide a deterministic failure.
- Keep repairs bounded to the verified root cause.
- Stop after three unsuccessful code-changing attempts for the same root failure and request human direction.
- Never install or download an undeclared dependency as part of a routine browser-test run.
