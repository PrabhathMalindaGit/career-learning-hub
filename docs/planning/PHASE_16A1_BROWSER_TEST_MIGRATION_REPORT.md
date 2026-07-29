# Phase 16A-1 browser test migration report

## Status

- Phase 15: `COMPLETED` /
  `APPROVED WITH ACCEPTED LIMITATIONS AND FORMAL DEFERRAL`
- Phase 16: `ACTIVE`
- Phase 16A-1: `COMPLETED` / `APPROVED`
- Phase 16B through Phase 16G: `PLANNED` / `INACTIVE`
- Phase 17: `PLANNED` / `INACTIVE`
- Accepted approval token:
  `PHASE_16A1_BROWSER_TEST_MIGRATION_APPROVED`
- Approval token accepted: yes

## Baseline

- Branch: `phase-12-unified-frontend`
- Full HEAD: `e5ee18ab3f55217fd24f4dfea04de1e2d15feddd`
- Subject: `Complete Phase 15 security and privacy review`
- Starting worktree: clean
- Active Git operation: none

## Migration

Full Application Browser Testing is the primary human-facing name. The
executable browser workflow suite moved from `e2e/` to `tests/browser/`.

The migration preserves all 12 tracked files:

- one Playwright configuration;
- six specifications;
- four support files; and
- one synthetic PDF fixture.

Only two executable path calculations changed:

- the Playwright web-server working directory now resolves two levels above
  `tests/browser/`; and
- the service harness repository root now resolves three levels above its
  `tests/browser/support/` directory.

The binary fixture rule in `.gitattributes` now points to the new path.
Relative spec, support, setup, teardown, and fixture imports remain valid
without edits.

No test title, selector, route, assertion, fixture behavior, application
behavior, API contract, database model, migration, authentication rule,
ownership check, private-PDF check, or Quiz-secrecy check changed.

## Runner decision

The root manifest and installed repository dependencies contain no declared or
repository-local Playwright runner. A portable package command cannot be
created without a separate dependency or runner decision.

`package.json` therefore remains unchanged:

- `test:browser`: not added;
- `test:e2e`: not added; and
- compatibility alias: unavailable until `test:browser` is portable.

Verification uses the existing authorized Codex-bundled Playwright runtime
with `tests/browser/playwright.config.cjs`. No dependency is installed or
downloaded, and no user-specific cache path is committed.

## Historical evidence

Phase 14 and Phase 15 reports keep the exact E2E wording, commands, paths, and
results recorded at execution time. Historical command/path retained as
executed. The suite was later relocated to `tests/browser/` during Phase
16A-1.

## Preserved configuration

- Projects: `desktop`, `tablet`, `mobile`
- Viewports: 1440 × 900, 768 × 1024, 390 × 844
- Workers: 1
- Retries: 0
- Test timeout: 45 seconds
- Assertion timeout: 10 seconds
- Screenshots: failure only
- Traces: retained on failure
- Videos: off
- Reuse existing server: false

## Verification evidence

- Static file mapping: 12 tracked old paths and 12 new files; pass.
- Preserved payloads: ten files byte-identical; pass.
- Required executable diffs: two path-depth corrections only; pass.
- Old executable directory absent: pass.
- Configuration load: pass.
- Test listing: 21 tests in six files; desktop 7, tablet 7, mobile 7.
- Projects: `desktop`, `tablet`, and `mobile`; preserved.
- Viewports: 1440 × 900, 768 × 1024, and 390 × 844; preserved.
- Workers: 1; preserved.
- Retries: 0; preserved.
- Root `npm run typecheck`: pass for web, API, and shared-types workspaces.
- Full browser workflow suite: 21/21 passed in 39.5 seconds.
- Desktop: 7/7 passed.
- Tablet: 7/7 passed.
- Mobile: 7/7 passed.
- Global setup: `users=0, owned=0`.
- Global teardown: `users=0, owned=0`.
- Authentication and session workflows: pass.
- User A/User B ownership isolation: pass.
- Private PDF access: pass.
- Quiz answer secrecy before submission: pass.
- Dashboard, Resume, Interview, and Learning workflows: pass.
- Browser console/page-error and horizontal-overflow checks: pass.
- Initial sandboxed launch: stopped before test execution with
  `listen EPERM 0.0.0.0`.
- Root cause: sandbox denial of the isolated MongoDB localhost bind.
- Resolution: rerun the unchanged command with local-port permission; no code
  repair attempt was made.
- Service shutdown: ports 8000 and 4173 closed.
- Process-list check: unavailable because the host has no `sysmond` service;
  closed ports and absent runtime data provide shutdown evidence.
- Synthetic cleanup: pass.
- Temporary runtime and private storage: removed.
- Playwright report and test results: removed.
- Screenshots, traces, and videos: absent.
- Repository-local typecheck cache: removed.
- Provider calls: none.
- MongoDB Atlas use: none.
- Environment files: not read or modified.
- `package.json` and `package-lock.json`: unchanged.
- Dependencies: unchanged.
- Production source: unchanged.
- Test logic: unchanged except for the two required path-depth corrections in
  configuration and service startup.
- `git diff --check`: pass.
- At the review handoff, staged changes: none.
- At the review handoff, commit: none.
- Push: none.

## Approval closeout

- The operator accepted
  `PHASE_16A1_BROWSER_TEST_MIGRATION_APPROVED`.
- Phase 16A-1 is `COMPLETED` / `APPROVED`.
- Phase 16 remains `ACTIVE`.
- Phase 16B through Phase 16G and Phase 17 remain `PLANNED` / `INACTIVE`.
- No later Phase 16 implementation subphase is active.
- Full Application Browser Testing remains the primary human-facing name.
- Executable tests remain under `tests/browser/`; documentation remains under
  `docs/testing/`.
- Historical Phase 14 and Phase 15 E2E wording remains preserved.
- The verified browser result remains 21/21 with desktop 7/7, tablet 7/7, and
  mobile 7/7.
- `package.json` remains unchanged. Neither `test:browser` nor `test:e2e`
  currently exists. Adding a portable command requires a separately approved
  dependency or runner decision.
- No production source, browser-test behavior, or visible UI changed.
- Manual visual QA was not required.
- The closeout commit had not yet been created while this documentation was
  edited.
- Push remains prohibited and has not occurred.

## Scope exclusions

This subphase does not implement the sidebar, breadcrumbs, Resume PDF export,
AI comparison, templates, accessibility repairs, or performance repairs. It
does not activate Phase 16B.

Manual or in-app visual QA is not required because no visible application UI
changes in this migration.
