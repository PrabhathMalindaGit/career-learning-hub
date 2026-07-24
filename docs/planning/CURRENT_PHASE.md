# Current Execution Phase

- Phase: 2
- Name: Codex Repository Instructions
- Status: ACTIVE
- Controlling skill: `karpathy-guidelines`

## Required skills

- `karpathy-guidelines`
- `technical-writing`
- `migrate-to-codex`
- `onboard-new-user`

## Objective

- Create a concise root `AGENTS.md` with permanent, repository-specific instructions for safe Codex work.
- Transition the planning controls from completed Execution Phase 1 to active Execution Phase 2.

## Inputs to inspect

- `README.md`
- Root, frontend, backend, and shared-types package manifests.
- `.gitignore`
- `docs/architecture/frontend-backend-structure.md`
- The planning controls and accepted decisions under `docs/planning/`.
- Filenames directly under `docs/phases/`.
- Existing root `AGENTS.md`, if present.
- Source-directory names only where needed to verify the approved architecture.
- Safe Git status, history, branch, and operation-state evidence.

## In-scope work

- Create root `AGENTS.md`.
- Mark Execution Phase 1 `COMPLETED`.
- Mark Execution Phase 2 `ACTIVE`.
- Keep Execution Phases 3 through 21 `PLANNED`.
- Verify the instructions, phase status, write scope, and Git diff.

## Out-of-scope work

- Production-code or package-manifest changes.
- Dependency installation.
- Application tests, type checks, builds, development servers, or runtime checks.
- Legacy-project access.
- Staging, commits, branch changes, history changes, pushes, or remote operations.
- Automatic activation of Execution Phase 3.

## Assumptions

- Execution Phase 1 completed through approved governance commit `8a92347`.
- The active branch is `phase-10-unified-frontend`.
- Existing implementation claims remain unverified until Execution Phase 3.
- Documentation-only changes do not require visual QA, and the completion report must say so.

## Exact deliverables

- `AGENTS.md`
- `docs/planning/CAREER_LEARNING_HUB_MASTER_PLAN.md` with only the approved phase-status transition.
- This current-phase control containing only Execution Phase 2.

## Success criteria

- Root `AGENTS.md` contains all required permanent repository rules and directs Codex to this file for active scope.
- Every listed repository command is grounded in a package manifest.
- Execution Phases 0 and 1 are `COMPLETED`, Execution Phase 2 is `ACTIVE`, and Execution Phases 3 through 21 are `PLANNED`.
- Only the three exact deliverable paths change.
- No application file, package manifest, decision-log entry, or phase template changes.
- No dependency, application verification, server, legacy, staging, commit, branch, history, or remote operation occurs.

## Verification checklist

- [x] Confirm root `AGENTS.md` exists and contains all 16 required sections.
- [x] Confirm commands against the inspected package manifests.
- [x] Confirm architecture, authentication, API-client, security, privacy, legacy, failure-loop, visual-QA, and Git rules.
- [x] Confirm no machine-specific absolute path, secret, personal data, or unsupported verification claim appears.
- [x] Confirm Execution Phase 0 remains `COMPLETED`.
- [x] Confirm Execution Phase 1 is `COMPLETED`.
- [x] Confirm Execution Phase 2 is `ACTIVE`.
- [x] Confirm Execution Phases 3 through 21 remain `PLANNED`.
- [x] Confirm this file contains only Execution Phase 2.
- [x] Confirm only the three authorized paths changed and no file is staged.
- [x] Review scoped diffs, the `AGENTS.md` line count, SHA-256, headings, and full content.

## Failure-loop stop rule

- A root failure is one underlying cause that produces the same failing result.
- Allow at most three code-changing repair attempts for the same root failure.
- After the third unsuccessful attempt, stop modifying files, preserve the diff, report the exact command, error, attempts, and likely cause, and wait for human direction.
- Never weaken tests or security controls to obtain a pass.

## Human approval gate

- Required approval token: `PHASE_2_AGENTS_REVIEW_APPROVED`
- Do not stage or commit during the preparation pass.
- Stop before commit.
- Do not install dependencies.
- Do not run application tests, type checks, or builds.
- Do not access legacy projects.
- Do not modify production code.
- Do not activate Phase 3 automatically.

## Next phase

- Execution Phase 3 — Baseline Verification
- Do not activate Execution Phase 3 automatically.

## Update rules

- Keep this file limited to the current execution phase.
- Update it only after this phase passes its human approval gate.
- Do not stage or commit during the preparation pass.
- Stop before commit.
- Do not install dependencies or run application tests, type checks, or builds.
- Do not access legacy projects or modify production code.
- Do not activate Phase 3 automatically.
