# Full Application Browser Testing

## Purpose

Full Application Browser Testing exercises the principal user workflows
through a real Chromium browser. These Playwright browser workflow tests
provide end-to-end coverage of the application's principal user journeys.

Executable test code lives in `tests/browser/`. This guide and related plans
and reports are documentation only.

The browser workflow suite covers registration, login, protected routing,
session persistence, logout, Dashboard, Resume, Interview, and Learning
workflows. It also checks User A/User B ownership isolation, private PDF
access, Quiz answer secrecy, browser console errors, and horizontal overflow.

## Test matrix

| Project | Viewport | Current tests |
| --- | --- | ---: |
| `desktop` | 1440 × 900 | 9 |
| `tablet` | 768 × 1024 | 9 |
| `mobile` | 390 × 844 | 9 |

The suite uses one worker, zero retries, a 45-second test timeout, and a
10-second assertion timeout. These values are deliberate. One worker keeps
the isolated MongoDB and shared local service lifecycle deterministic, while
zero retries makes a failure visible instead of hiding it behind a rerun.

## Local services

The Playwright configuration starts and stops everything the suite needs:

- an isolated `MongoMemoryReplSet` database;
- the Express backend on `127.0.0.1:8000`; and
- the Vite frontend on `127.0.0.1:4173`.

Do not connect this suite to MongoDB Atlas. Do not start persistent frontend,
backend, or database services for it. The harness sets test-only configuration
in the spawned process and does not read a repository `.env` file.

Provider-backed jobs remain disabled. The suite must not call Gemini or any
other AI provider.

## Synthetic data and cleanup

Tests use generated `@example.test` identities and the tracked synthetic PDF
at `tests/browser/fixtures/synthetic-learning.pdf`. Do not use real personal
data, production exports, real resumes, private documents, or provider
credentials.

Global setup removes tagged leftovers before the run. Per-test cleanup
removes each synthetic user and all records owned by that user. Global
teardown repeats the tagged cleanup and must report:

```text
users=0, owned=0
```

The service harness then stops the frontend, backend, and in-memory MongoDB
processes and removes its temporary runtime and private storage.

## Artifacts

Failure-only screenshots and retained-on-failure traces are written outside
the repository under `/private/tmp/career-learning-hub-phase14/`. Video is
disabled. The HTML report and test results use the same temporary root.

After a successful run, no screenshots, videos, traces, HTML report,
test-results directory, private storage, runtime data, coverage output, or
temporary log should remain.

## Running the suite

The preferred command is reserved as:

```bash
npm run test:browser
```

The temporary compatibility command is reserved as:

```bash
npm run test:e2e
```

Neither script is present yet. The repository does not declare Playwright and
does not contain a portable local runner, so adding either script would create
an undeclared or machine-specific dependency.

For the currently authorized Codex-bundled runtime, obtain its Node executable
and Node package directory from the workspace dependency report, then run:

```bash
NODE_PATH="<bundled-node-modules>" \
  "<bundled-node>" \
  "<bundled-node-modules>/playwright/cli.js" \
  test --config=tests/browser/playwright.config.cjs
```

Do not replace the placeholders with a committed user-specific cache path.
Do not use `npx` when it would download Playwright. Adding a portable
repository command requires a separate approved dependency or runner
decision.

To inspect the discovered tests without starting the local services, append
`--list`.

## Phase 16G fresh integrated result — 2026-07-29

This is the fresh Phase 16G result from starting commit
`c0325c42816c19c006c790a4e153e3caee88d5bc` (`Complete accessibility and
performance review`). It is separate from the preserved Phase 14, Phase 15,
Phase 16A-1, Phase 16C, Phase 16D, Phase 16E, and Phase 16F historical
evidence.

The direct bundled runner was invoked in this form, with the discovered
workspace-runtime paths substituted only at execution time:

```bash
NODE_PATH="<bundled-node-modules>" \
  "<bundled-node>" \
  "<bundled-node-modules>/playwright/cli.js" \
  test --config=tests/browser/playwright.config.cjs
```

- Runner: Playwright 1.61.1 with Google Chrome 150.0.7871.187.
- Projects: desktop 1440×900, tablet 768×1024, mobile 390×844.
- Result: 27/27 passed in 1.9 minutes: desktop 9/9, tablet 9/9, mobile
  9/9; one worker and zero retries.
- Principal coverage: authentication bootstrap and routing, Dashboard,
  Interview, Learning, User A/User B ownership, private PDF access, Quiz
  answer secrecy, sidebar/drawer, Create actions, breadcrumbs, saved Resume
  print, AI comparison, and Resume templates/design.
- Authentication-bootstrap CLS was 0.0000 in all three projects. The existing
  console/page-error and horizontal-overflow assertions collected no failure.
- Setup and teardown each reported `users=0, owned=0`. Automated services
  stopped, ports 4173/4174/8000 closed, and the isolated runtime, storage,
  report, test-result, screenshot, trace, video, and log artifacts were
  removed.
- The run used synthetic `@example.test` data only. It did not call a
  provider, connect to Atlas or cloud storage, deploy, use production data,
  or access a legacy project.

No historical result is presented as fresh Phase 16G evidence, no package
script was added, and the suite name remains Full Application Browser
Testing.

## Phase 16G human approval and cleanup closeout

- The operator completed and approved authentication; desktop sidebar and
  mobile drawer behavior; Create actions; breadcrumbs; Resume print; AI
  comparison; Resume templates/design; Interview and Learning; keyboard and
  focus; contrast; reduced motion; performance experience; ownership; trust;
  and privacy.
- The reviewed matrix was 1440×900, 1024×768, 768×1024, 390×844, 320×720,
  and actual 200% browser zoom. Print review covered A4/Letter, current and
  historical saved versions, multipage content, selectable text, hidden
  application chrome, clipping, and grayscale hierarchy.
- The accepted token is `PHASE_16G_FINAL_VERIFICATION_APPROVED`; approval
  accepted: yes.
- No provider request, Atlas/cloud-storage connection, deployment, production
  data, real personal data, or legacy access occurred.
- The headed review tab, frontend, backend, and isolated MongoDB stopped.
  Cleanup removed both synthetic identities, 53 owned records, one
  AuthSession, private storage, runtime data, and the outside-repository Phase
  16G scripts. Final evidence is `users=0, owned=0, sessions=0`; ports 4173,
  4174, and 8000 are closed.
- Phase 16 and Phase 16G are `COMPLETED` / `APPROVED`. Phase 17 remains
  `PLANNED` / `INACTIVE` and requires separate activation.

No package script, browser specification, configuration, setup, teardown,
fixture, product source, or executable-test behavior changed during Phase 16G
closeout.

## Troubleshooting boundaries

- Read the complete error and identify the failing layer before changing
  anything.
- Reproduce the failure and compare it with the last working configuration.
- Keep repairs limited to browser-test path migration issues during Phase
  16A-1.
- Do not change application behavior, selectors, assertions, ownership rules,
  authentication, private-file controls, or Quiz answer secrecy to obtain a
  pass.
- Do not enable retries or reduce browser coverage.
- Stop after three unsuccessful code-changing attempts for the same root
  failure and request human direction.
- Never install or download a dependency as part of this workflow.
