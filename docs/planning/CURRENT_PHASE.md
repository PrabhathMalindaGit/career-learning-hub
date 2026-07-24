# Current Execution Phase

- Phase: 1
- Name: Git Baseline and Repository Cleanup
- Status: ACTIVE
- Controlling skill: `karpathy-guidelines`

## Required skills

- `karpathy-guidelines`
- `define-goal`
- `executing-plans`
- `finishing-a-development-branch`

## Objective

- Prepare a safe, reviewable Git baseline without altering application behavior or creating a commit.
- Activate Execution Phase 1 after the approved Phase 0 review.
- Inspect Git history, branches, tracked files, ignore rules, and filename-only sensitive or generated path risks.

## Inputs to inspect

- Repository root contents.
- Git work-tree, branch, history, remote-name, index, and status metadata.
- Root and nested `.gitignore` files.
- Repository filenames for sensitive or generated path risks.
- `docs/planning/CAREER_LEARNING_HUB_MASTER_PLAN.md`
- `docs/planning/CURRENT_PHASE.md`
- `docs/planning/DECISION_LOG.md`

## In-scope work

- Inspect and classify the current Git state.
- Review and minimally correct `.gitignore` only if verified gaps exist.
- Identify sensitive, generated, ignored, untracked, or tracked path risks without reading secret contents.
- Determine whether an equivalent baseline commit exists.
- Define the exact proposed baseline or governance commit contents.
- Prepare exact post-approval Git commands without running them.
- Update only the necessary planning controls for Execution Phase 1.

## Out-of-scope work

- Application feature or behavior changes.
- Dependency installation.
- Tests, type checks, builds, development servers, or application runtime verification.
- Staging, committing, branch creation, branch switching, branch renaming, or branch deletion.
- Merge, rebase, cherry-pick, history rewrite, push, or any remote operation.
- Legacy-project access.
- Secret-content inspection or disclosure.
- Automatic activation of Execution Phase 2.

## Assumptions

- Phase 0 passed human review through the approval token `PHASE_0_APPROVED`.
- Git was initialized before Phase 0.
- The four files under `docs/planning/` are the untracked planning outputs created by Phase 0.
- Existing implementation claims remain locally unverified until Execution Phase 3.
- The current date is `2026-07-24`.

## Exact deliverables

- Evidence-based Git-state and history classification.
- Reviewed `.gitignore` with only necessary corrections, if any.
- Filename-only sensitive and generated path assessment.
- Execution Phase 0 marked `COMPLETED` in the master plan.
- Execution Phase 1 marked `ACTIVE` in the master plan.
- This current-phase control containing only Execution Phase 1.
- Proposed commit contents, commit message, and exact post-approval commands.

## Success criteria

- Execution Phase 0 is `COMPLETED`.
- Execution Phase 1 is `ACTIVE`.
- Execution Phases 2 through 21 remain `PLANNED`.
- This file contains only Execution Phase 1.
- No sensitive or generated tracked risk is left unreported.
- `.gitignore` safely excludes verified local sensitive and generated paths while preserving approved examples and source-controlled files.
- No application file is modified.
- No file is staged and no commit is created.
- No branch is created, switched, renamed, or deleted.
- No Git history or remote state is changed.
- No legacy project is accessed.
- No dependency, test, type-check, build, or runtime command is run.
- No secret contents are printed.

## Verification checklist

- [x] Confirm the repository root and current branch.
- [x] Confirm branch names, recent history, and remote names.
- [x] Confirm no merge, rebase, cherry-pick, or other unsafe Git operation is in progress.
- [x] Confirm tracked, untracked, and ignored filename-only risk classifications.
- [x] Confirm `.gitignore` protections and approved example-file exceptions.
- [x] Confirm Execution Phase 0 is `COMPLETED`.
- [x] Confirm Execution Phase 1 is `ACTIVE`.
- [x] Confirm Execution Phases 2 through 21 remain `PLANNED`.
- [x] Confirm this file contains only Execution Phase 1.
- [x] Confirm only authorized planning controls and any necessary `.gitignore` correction changed.
- [x] Confirm no files are staged and no commit was created.
- [x] Confirm no branch or remote operation occurred.
- [x] Confirm no legacy access or application verification command occurred.
- [x] Provide the sorted planning-file list, line counts, and SHA-256 hashes.
- [x] Prepare exact post-approval commands without running them.

## Failure-loop stop rule

- A root failure is one underlying cause that produces the same failing result.
- Allow a maximum of three code-changing repair attempts for the same root failure.
- After the third unsuccessful attempt:
  - Stop modifying files.
  - Do not skip or weaken tests or security controls.
  - Report the exact command, error, attempts, and likely cause.
  - Wait for human direction.

## Human approval gate

- Required approval token: `PHASE_1_GIT_BASELINE_REVIEW_APPROVED`
- Do not stage or commit without explicit human authorization.
- Do not create, switch, rename or delete branches during the preparation pass.
- Do not rewrite Git history.
- Do not access legacy projects.
- Do not install dependencies or run application verification.
- Do not activate Phase 2 automatically.

## Next phase

- Execution Phase 2 — Codex Repository Instructions
- Do not activate Execution Phase 2 automatically.

## Update rules

- Keep this file limited to the current execution phase.
- Update it only after the current phase passes its human approval gate.
- Do not stage or commit without explicit human authorization.
- Do not create, switch, rename or delete branches during the preparation pass.
- Do not rewrite Git history.
- Do not access legacy projects.
- Do not install dependencies or run application verification.
- Do not activate Phase 2 automatically.
