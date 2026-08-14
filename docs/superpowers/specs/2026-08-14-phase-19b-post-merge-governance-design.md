# Phase 19B Post-Merge Governance — Design Specification

**Date:** 2026-08-14  
**Status:** Design approved by the user; written specification awaiting user approval  
**Task branch:** `task/phase-19b-post-merge-governance`  
**Base branch:** `main`  
**Base commit:** `469c27f35011fb9b51e7d501d9f759fae757efb5`

## 1. Purpose

Phase 19B — Interview Coach Refinements has been fully accepted and merged to `main` through PR #16. The current governance documents were intentionally written before that final integration and therefore still describe Phase 19B as ready for `main` integration or not yet merged.

This task reconciles those records with the repository's actual post-merge state. It is a documentation-only governance correction. It does not change application behavior, deploy anything, delete branches, or activate the next phase.

## 2. Controlling project constraint

Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.

For this task, that means making only the minimum authoritative documentation changes required to record the completed Phase 19B merge accurately.

## 3. Verified repository state

The authoritative post-merge facts are:

- Phase 19B integration PR: `#16 — Phase 19B: Complete Interview Coach Refinements`.
- PR #16 state: `MERGED / CLOSED`.
- Phase 19B integration branch: `phase-19b-interview-coach-refinements`.
- Final Phase 19B branch head merged to `main`: `ea4acb059ba18f0db9d55baff7ed183b0b14a286`.
- Final `main` merge commit: `469c27f35011fb9b51e7d501d9f759fae757efb5`.
- Local and remote `main` were verified at that merge commit with a clean working tree.
- No manual deployment was authorized or performed as part of the Phase 19B integration workflow.
- No Phase 19B task or phase branches were authorized for deletion.
- Phase 19C and all later phases remain planned/inactive until separately reviewed and authorized.

## 4. Scope

### 4.1 Governance files to reconcile

Exactly two existing authoritative governance documents are implementation targets:

1. `docs/planning/CURRENT_PHASE.md`
2. `docs/planning/PHASE_19B_INTERVIEW_COACH_REFINEMENTS_CLOSEOUT.md`

The design specification and later implementation plan under `docs/superpowers/` are permitted process artifacts.

### 4.2 Explicitly out of scope

Do not change:

- backend production source;
- frontend production source;
- test source;
- package manifests or lockfiles;
- environment/configuration files;
- database schemas or migrations;
- deployment configuration;
- shared types;
- authentication behavior;
- Gemini/provider configuration;
- any Phase 19C+ implementation.

Do not:

- deploy;
- delete branches;
- modify hosting settings;
- create new application features;
- rerun the full application regression suite unless an unexpected executable-file change is introduced.

## 5. `CURRENT_PHASE.md` design

The controlling Phase 19B authority block at the top of `CURRENT_PHASE.md` must be reconciled to the post-merge truth.

It must record, at minimum:

- Current execution phase: `PHASE 19B`.
- Name: `Interview Coach Refinements`.
- Status: `COMPLETED / MERGED TO MAIN / CLOSED`.
- Phase integration branch: `phase-19b-interview-coach-refinements`.
- Final Phase 19B branch head: `ea4acb059ba18f0db9d55baff7ed183b0b14a286`.
- Phase 19B integration PR: `PR #16 — MERGED / CLOSED`.
- Main merge commit: `469c27f35011fb9b51e7d501d9f759fae757efb5`.
- Main integration: `COMPLETE`.
- Existing Task 8 acceptance evidence remains valid and should be preserved.
- Manual deployment: `NOT AUTHORIZED / NOT PERFORMED BY THIS INTEGRATION WORKFLOW`.
- Branch deletion: `NOT AUTHORIZED / NOT PERFORMED`.
- Phase 19C through later phases: `PLANNED / INACTIVE`.
- Next gate: separately review and authorize the next phase; do not imply Phase 19C is active.

The existing historical governance ledger below the controlling block must remain intact. The implementation should use the same bounded-prefix strategy previously used for `CURRENT_PHASE.md`: change only the controlling block above the stable historical marker and preserve the historical tail byte-for-byte where practical.

## 6. Phase 19B closeout record design

The Phase 19B closeout file currently preserves the valid pre-main acceptance state and repeatedly states that `main` integration had not yet occurred. Those statements were historically correct at the time the closeout was written.

The safest design is **not** to erase that chronology. Instead:

1. Add a clear post-main integration section near the top of the document that records the final Phase 19B integration facts.
2. Reconcile the current status/identity/release-control statements that are intended to describe the present state.
3. Preserve historical sections describing what was true before PR #16 as historical evidence, adding wording where needed so they cannot be mistaken for the current state.

The post-main state must record:

- `COMPLETED / MERGED TO MAIN / CLOSED`;
- PR #16 `MERGED / CLOSED`;
- merged branch head `ea4acb059ba18f0db9d55baff7ed183b0b14a286`;
- `main` merge commit `469c27f35011fb9b51e7d501d9f759fae757efb5`;
- integration review `PASS`;
- no manual deployment authorized/performed by this workflow;
- no branch deletion authorized/performed;
- Phase 19C+ remains inactive;
- next action is a separate review/authorization decision for the next phase.

All accepted Phase 19B functional, security, test, build, live Gemini, and human QA evidence must remain unchanged unless a sentence needs a narrow temporal qualifier.

## 7. Historical integrity rules

This task must distinguish between:

- **historical statements** that accurately describe the pre-merge state at the time they were recorded; and
- **current authority statements** that must now describe the post-merge state.

Historical evidence should not be rewritten merely because time advanced. Only stale present-tense authority/release-control claims should be reconciled.

No accepted test counts, commit SHAs, PR numbers, security invariants, or QA results may be changed without direct repository evidence.

## 8. Verification strategy

Because the implementation is documentation-only, verification is intentionally small and auditable.

Required checks after implementation:

```bash
git diff --check origin/main...HEAD
git diff --name-only origin/main...HEAD
git status --short
```

Acceptance criteria:

- `git diff --check` produces no output;
- working tree is clean after committed/pushed changes;
- the PR changes only:
  - the two approved governance files; and
  - the approved `docs/superpowers/` spec/plan process artifacts;
- no executable/test/config/dependency/migration/deployment files change;
- `CURRENT_PHASE.md` no longer says Phase 19B is awaiting `main` integration;
- the Phase 19B closeout record clearly records PR #16 and the final `main` merge SHA;
- historical acceptance evidence remains intact;
- no document claims a manual deployment or branch deletion occurred;
- no document activates Phase 19C or a later phase.

No full backend/frontend test rerun is required unless scope unexpectedly expands into an executable file.

## 9. Git and PR governance

- Work only on `task/phase-19b-post-merge-governance`.
- The task branch starts from `main` at `469c27f35011fb9b51e7d501d9f759fae757efb5`.
- Use a draft PR targeting `main` once the first spec commit exists.
- Keep the PR draft until implementation and user-run local verification are green.
- Merge requires a separate explicit user approval after final review.
- Do not deploy.
- Do not delete branches.

## 10. Success state

The task is complete when the repository's authoritative governance records agree with reality:

- Phase 19B is complete, merged to `main`, and closed;
- PR #16 and merge commit `469c27f35011fb9b51e7d501d9f759fae757efb5` are recorded;
- Phase 19B evidence and chronology remain trustworthy;
- no next phase is activated implicitly;
- the repository remains otherwise unchanged.
