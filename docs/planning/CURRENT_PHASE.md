# Current Execution Phase

- Phase: 3
- Name: Baseline Verification
- Status: ACTIVE
- Controlling skill: `karpathy-guidelines`

## Required skills

- `karpathy-guidelines`
- `define-goal`
- `executing-plans`
- `systematic-debugging`
- `test-driven-development`
- `technical-writing`

## Objective

- Independently verify the historical Phase 9 repository baseline through dependency installation, type checking, unit tests, integration tests, security tests, and production builds.
- Repair only reproduced and understood defects that are necessary for the required baseline commands to pass.
- Create a factual baseline report without adding product features or changing the approved architecture.

## Inputs to inspect

- Root `AGENTS.md`.
- This current-phase control and the complete master plan.
- The accepted decision log.
- Relevant architecture and historical Phase 9 documentation.
- Root README, workspace manifests, lockfile when present, TypeScript configuration, test configuration, and environment-example variable names.
- Safe Git branch, history, status, diff, and operation-state evidence.

## In-scope work

- Transition Execution Phase 2 to `COMPLETED` and Execution Phase 3 to `ACTIVE`.
- Record installed Node and npm versions and compare them with declared requirements.
- Run the existing dependency installation and required baseline commands from the repository root.
- Reproduce, classify, and diagnose failures before editing.
- Make surgical repairs only for verified repository defects.
- Create `docs/phases/phase-10-baseline-report.md`.
- Review the exact write scope, Git diff, report content, and secret-safety evidence.

## Out-of-scope work

- New product features, visual redesign, broad refactoring, dependency modernization, or architecture changes.
- Next.js, Supabase, shadcn, another database, another authentication provider, or another design system.
- Disabled or weakened tests, validation, authentication, authorization, ownership, privacy, or security controls.
- Production credentials, production databases, production user data, or raw production exports.
- Legacy-project access.
- Development servers or browser testing unless a required repair changes visible React behavior.
- Staging, commits, pushes, branch changes, history changes, or remote operations.
- Automatic activation of Execution Phase 4.

## Assumptions

- The approved starting branch is `phase-10-unified-frontend`.
- The approved starting HEAD is `ae436a7`, which includes baseline commit `9206673`.
- Repository tests are intended to use temporary local test infrastructure and not production services.
- The first integration or security test run may require a MongoDB test binary download when no compatible binary is cached.
- The frontend manifest has no test script; root test commands target the backend.

## Required commands

Run from the repository root in this order:

```bash
node -v
npm -v
npm install
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:security
npm run build
```

- After a verified repair, rerun the narrowest affected command first.
- After all repairs, rerun the complete five-command verification sequence.
- Do not substitute `npm run test:ci` for the required individual commands.
- Do not run `npm run test:coverage` unless a repair specifically depends on coverage behavior.

## Permitted repair boundary

- Change files only when a required baseline command reproduces an understood repository defect.
- Permitted repairs include a TypeScript defect, invalid workspace reference, broken test configuration, confirmed implementation defect, regression test, existing build configuration, already-required missing dependency declaration, or documented safe test-environment configuration.
- Every changed line must trace to a reproduced failure.
- Preserve the existing React/Vite, Express/TypeScript, MongoDB, shared-types, authentication, ownership, security, privacy, and repository conventions.
- Use `systematic-debugging` before repair and `test-driven-development` when an implementation or behavior defect requires a regression test.

## Exact deliverables

- `docs/planning/CAREER_LEARNING_HUB_MASTER_PLAN.md` with only the Phase 2 and Phase 3 status transition.
- This current-phase control containing only Execution Phase 3.
- `docs/phases/phase-10-baseline-report.md`.
- A reconciled `package-lock.json` only if created or changed by the existing dependency installation.
- Source, test, manifest, or configuration repairs only when justified by a reproduced baseline failure.

## Success criteria

- Installed Node and npm versions are classified against repository requirements.
- `npm install` completes or is accurately classified as blocked without application-code workarounds.
- Each required baseline command has an exact initial result and final result.
- All reproduced failures have one primary classification and evidence-based diagnosis.
- Any repair stays within the permitted boundary and the three-attempt rule.
- Final verification status is recorded as `PASS`, `PASS_WITH_REPAIRS`, `BLOCKED`, or `FAIL_REQUIRES_HUMAN_REVIEW`.
- Only authorized files change, no file is staged, and no commit or remote operation occurs.
- No legacy folder, production credential, production database, or production data is accessed.

## Verification checklist

- [x] Confirm Execution Phases 0 and 1 remain `COMPLETED`.
- [x] Confirm Execution Phase 2 is `COMPLETED`.
- [x] Confirm Execution Phase 3 is `ACTIVE`.
- [x] Confirm Execution Phases 4 through 21 remain `PLANNED`.
- [x] Confirm this file contains only Execution Phase 3.
- [x] Record exact Node and npm versions and compatibility classification.
- [x] Record the exact result of `npm install` and explain any lockfile change.
- [x] Record initial and final results for all five required baseline commands.
- [x] Record failure classifications, diagnosis evidence, repairs, and attempt ledger.
- [x] Confirm no visible React behavior changed or complete the visual-QA escalation.
- [x] Review every changed path, scoped diffs, secrets, generated output, and unrelated edits.
- [x] Record the baseline report line count, SHA-256 hash, headings, and complete-content review.
- [x] Confirm no file is staged and no commit, branch, history, push, or remote operation occurred.

## Failure-loop stop rule

- A root failure is one underlying cause producing the same failing result.
- Allow no more than three code-changing repair attempts for the same root failure.
- Each attempt records the hypothesis, files changed, command rerun, and result.
- After the third unsuccessful attempt, stop modifying files, preserve the diff, report the exact command and error, summarize all three attempts, state the likely unresolved cause, and wait for human direction.
- Never weaken tests or security controls to obtain a pass.

## Human approval gate

- Required approval token: `PHASE_3_BASELINE_REVIEW_APPROVED`
- Do not stage or commit during this preparation and verification pass.
- Do not access legacy projects.
- Do not introduce new features or architecture.
- Human visual QA is required only if a baseline repair changes visible React behavior.
- Stop before commit.

## Next phase

- Execution Phase 4 — Frontend Architecture Audit
- Do not activate Phase 4 automatically.

## Update rules

- Keep this file limited to Execution Phase 3 until the required human approval is received.
- Record factual command evidence and do not claim unrun checks passed.
- Do not stage or commit during this preparation and verification pass.
- Do not access legacy projects.
- Do not introduce new features or architecture.
- Stop before commit.
- Do not activate Phase 4 automatically.
