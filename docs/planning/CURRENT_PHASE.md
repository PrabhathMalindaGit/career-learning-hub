# Current Execution Scope

## Current activity

- Activity: `COMPREHENSIVE CURRENT-TREE DOCUMENTATION CONSOLIDATION`
- Status: `ACTIVE / DOCUMENTATION-ONLY / POST-PHASE-20A / PRE-PHASE-20B`
- Branch: `docs/comprehensive-current-tree-cleanup`
- Base `main` commit: `60ea6f9dbaac044ee786ad4628b1040508daf987`
- Base identity: `MERGE OF PR #31 — PHASE 20A FINAL RELEASE BASELINE & EVIDENCE FREEZE`
- Frozen executable product baseline: `a2a3aa0ef5b9cf9583ce4aeae2d676f5f568a790`
- Authoritative final evidence record: `docs/planning/PHASE_20A_FINAL_RELEASE_BASELINE_EVIDENCE_FREEZE.md`

## Purpose

Consolidate the current repository documentation so it presents Career Learning Hub as the current academic-MVP application, while preserving the frozen executable product and final Phase 20A evidence.

This maintenance task intentionally reduces current-tree historical development-source/inventory material. Git history remains unchanged.

## In scope

- Rewrite current repository overview and governance documentation around the finished Career Learning Hub product.
- Remove obsolete inventory, migration, comparative-audit, and source-provenance documents from the current tree.
- Remove obsolete governance statements that no longer describe current product development.
- Preserve current architecture, security, Gemini, testing, release-evidence, merge, deployment, and approval boundaries.
- Verify that the final branch changes documentation only.
- Verify the user-approved terminology search returns no remaining current-tree matches for the removed provenance wording.

## Out of scope

No changes are authorized to:

- `frontend/`;
- `backend/`;
- `packages/`;
- `tests/`;
- package manifests or lockfiles;
- runtime or build configuration;
- environment files;
- database schemas or migrations;
- API contracts;
- authentication behavior;
- Gemini runtime/provider behavior;
- private asset behavior;
- deployment resources;
- application features or UI.

No deployment is authorized.
No branch deletion is authorized.
No merge is authorized until the exact final branch head has been locally qualified and explicitly approved by the user.

## Frozen product evidence

Phase 20A qualification remains authoritative because this activity is documentation-only.

Final complete-suite evidence:

- backend production typecheck — PASS;
- backend test-source typecheck — PASS;
- backend unit — 223/223 PASS;
- backend integration — 249/249 PASS;
- backend security — 43/43 PASS;
- complete backend suite — 515/515 PASS;
- backend production build — PASS;
- frontend typecheck — PASS;
- complete frontend suite — 1,170/1,170 PASS;
- frontend production build — PASS;
- root workspace typecheck — PASS;
- root workspace build — PASS;
- final diff check — PASS.

Non-overlapping complete-suite count:

`1,685 PASSING TESTS — 515 BACKEND + 1,170 FRONTEND`

Security claim boundary:

`BACKEND SECURITY REGRESSION SUITE 43/43 PASS; NO SEPARATE DEDICATED EXTERNAL OR REPOSITORY-WIDE SECURITY-SCANNER PASS IS CLAIMED.`

Human/live evidence boundary:

- integrated authenticated-application QA was completed before Phase 20A;
- the only final visible Resume assessment-action polish received focused automated qualification and explicit human visual approval;
- Phase 20A then completed fresh full automated qualification of the final executable tree.

## Current product architecture boundary

Career Learning Hub remains:

- React 19 + TypeScript + Vite frontend;
- Express 5 + TypeScript backend;
- MongoDB/Mongoose persistence;
- shared contracts in `packages/shared-types/`;
- private asset storage abstraction;
- Gemini Direct active AI path;
- fixed model `gemini-3.6-flash`;
- in-process durable background worker;
- progress-only polling, retry/cancel/timeout/fencing/idempotency, validated structured output, and atomic persistence;
- no SSE, WebSockets, or token streaming.

## Current final-stage roadmap

### Phase 20A — Final Release Baseline & Evidence Freeze

`COMPLETED / QUALIFIED / MERGED VIA PR #31`

### Current documentation consolidation

`ACTIVE / DOCUMENTATION-ONLY`

Completion gate:

1. final branch must differ from `main` only in documentation files;
2. `git diff --check origin/main...HEAD` must pass;
3. the approved provenance-term grep must return no current-tree matches;
4. no application test rerun is required if the branch remains documentation-only;
5. a pull request may be opened only after the documentation-only diff is qualified;
6. merge requires explicit user approval of the exact final head SHA.

### Phase 20B — University Evaluation Evidence

`PLANNED / INACTIVE / REQUIRES SEPARATE AUTHORIZATION`

### Phase 20C — Final Screenshots & Technical Evidence

`PLANNED / INACTIVE / REQUIRES SEPARATE AUTHORIZATION`

### Phase 20D — Report Evidence Pack

`PLANNED / INACTIVE / REQUIRES SEPARATE AUTHORIZATION`

### Phase 20E — Viva / Demonstration Preparation

`PLANNED / INACTIVE / REQUIRES SEPARATE AUTHORIZATION`

## Current approval boundary

The current user approval authorizes **Approach A — comprehensive current-tree documentation cleanup** on the dedicated documentation branch.

That approval does not authorize:

- merge to `main`;
- deployment;
- branch deletion;
- executable product changes;
- activation of Phase 20B.

The final branch head and exact documentation diff must be verified before requesting merge approval.
