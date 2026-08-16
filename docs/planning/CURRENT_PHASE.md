# Current Execution Scope

## Current activity

- Activity: `PHASE 20B-0/1 — ETHICS GATE AND MASTER UNIVERSITY EVALUATION PROTOCOL`
- Status: `ACTIVE / DOCUMENTATION-ONLY / EVALUATION-DESIGN / NO PARTICIPANT DATA COLLECTION`
- Branch: `phase-20b-university-evaluation-evidence`
- Base `main` commit: `ed5268ce26a33bc33d00d12d15840a582b0c1d93`
- Base identity: `MERGE OF PR #34 — POST-PR-33 EXECUTABLE QUALIFICATION EVIDENCE CHECKPOINT`
- Current qualified executable checkpoint: `6b80f91d7016971d58ed9628e8818fabf00d1cd2`
- Current qualification evidence: `docs/planning/POST_PR33_EXECUTABLE_QUALIFICATION_CHECKPOINT.md`
- Current Phase 20B plan: `docs/superpowers/plans/2026-08-16-phase-20b-university-evaluation-evidence.md`
- Ethics gate: `docs/evaluation/PHASE_20B_ETHICS_AND_PARTICIPANT_SAFETY_GATE.md`
- Master evaluation protocol: `docs/evaluation/PHASE_20B_UNIVERSITY_EVALUATION_PROTOCOL.md`

## Purpose

Activate only the first two design/governance tasks of Phase 20B so Objective O7 can later be completed with defensible academic evidence.

The current slice establishes:

1. a hard ethics/module/supervisor gate before any participant-facing evaluation activity; and
2. one master evaluation protocol that keeps engineering functionality, participant usability, selected accessibility evidence, and feature-specific AI-output-quality evidence separate.

No evaluation result is created by this slice.

## Source-of-truth evaluation objective

Objective O7 evaluates the Career Learning Hub artefact through four distinct evidence areas:

- functionality;
- usability;
- accessibility;
- AI-assisted output quality.

Current engineering verification already supports the functionality/technical evidence stream. Formal participant usability, selected accessibility, and feature-specific AI-quality evaluation require additional controlled evidence.

Engineering test counts must not be relabelled as participant usability scores, AI factual-accuracy percentages, full WCAG conformance, production guarantees, or independent security certification.

## Current authorization

The user has explicitly authorized:

`PHASE 20B-0/1 — ETHICS GATE AND MASTER EVALUATION PROTOCOL`

Authorized changes are limited to evaluation/planning documentation needed for those two tasks.

Current authorized repository files:

- `docs/evaluation/PHASE_20B_ETHICS_AND_PARTICIPANT_SAFETY_GATE.md`;
- `docs/evaluation/PHASE_20B_UNIVERSITY_EVALUATION_PROTOCOL.md`;
- `docs/superpowers/plans/2026-08-16-phase-20b-university-evaluation-evidence.md`;
- `docs/planning/CURRENT_PHASE.md`.

## Out of scope for the current slice

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

The current authorization also does **not** permit:

- participant recruitment;
- usability pilot/study sessions with real participants;
- questionnaire/SUS collection;
- participant observation/interviews/focus groups;
- participant audio/video/screen recording;
- participant/sample-count claims;
- detailed accessibility campaign execution;
- AI-quality result collection;
- evaluation-result population;
- synthetic evaluation dataset creation beyond later separate authorization;
- deployment;
- merge;
- branch deletion.

## Ethics and participant-safety gate

Current gate state:

`BLOCKED / AWAITING MODULE OR SUPERVISOR CONFIRMATION`

The available project evidence does not establish whether PUSL3190 requires formal ethics approval, supervisor approval, module-specific consent documentation, or another review route before participant recruitment/data collection.

Until authoritative direction is recorded and the gate passes, do not recruit participants or collect participant-derived evaluation evidence.

Default privacy posture for any later approved participant work:

- anonymous IDs such as `P01`;
- synthetic/de-identified demo content;
- no personal Gemini/API keys;
- no direct participant identifiers in repository evidence;
- no raw participant data in Git by default;
- no real participant resumes/private study documents unless an approved protocol explicitly allows them.

## Master evaluation evidence model

Phase 20B uses four streams:

### A — Engineering functionality evidence

Current evidence exists and is bound to the qualified executable checkpoint.

### B — Participant usability evidence

Planned task completion/time/error/assistance/observation evidence plus SUS if permitted by the ethics/module gate.

### C — Selected accessibility evidence

Planned keyboard/focus/labels/error/reflow/zoom/responsive checks. No unsupported full-WCAG certification claim.

### D — Feature-specific AI-output-quality evidence

Planned separate Resume, Interview, and grounded Learning rubrics. No single vague overall “AI accuracy” percentage.

## Current executable qualification evidence

The current qualified executable checkpoint is:

`6b80f91d7016971d58ed9628e8818fabf00d1cd2`

PR #34 later changed documentation only, so `main @ ed5268ce26a33bc33d00d12d15840a582b0c1d93` preserves the same executable product content represented by that qualification.

Fresh qualification results already recorded:

- root workspace production typecheck — PASS;
- backend test-source typecheck — PASS;
- backend unit — 223/223 PASS;
- backend integration — 249/249 PASS;
- backend security — 43/43 PASS;
- complete backend suite — 515/515 PASS;
- complete frontend suite — 1,170/1,170 PASS;
- frontend production build — PASS;
- backend production build — PASS;
- non-overlapping complete-suite total — 1,685 PASSING TESTS;
- qualified worktree — CLEAN.

Security claim boundary:

`BACKEND SECURITY REGRESSION SUITE 43/43 PASS; NO SEPARATE DEDICATED EXTERNAL OR REPOSITORY-WIDE SECURITY-SCANNER PASS IS CLAIMED.`

The qualification was passing but not warning-free; the detailed warning boundary remains recorded in `docs/planning/POST_PR33_EXECUTABLE_QUALIFICATION_CHECKPOINT.md`.

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

Historical evidence:

`docs/planning/PHASE_20A_FINAL_RELEASE_BASELINE_EVIDENCE_FREEZE.md`

### Comprehensive current-tree documentation consolidation

`COMPLETED / MERGED VIA PR #32`

### Viva Feature & UI Location Map

`COMPLETED / QUALIFIED / MERGED VIA PR #33`

### Post-PR-33 executable qualification evidence checkpoint

`COMPLETED / QUALIFIED / MERGED VIA PR #34`

Current qualified executable checkpoint:

`6b80f91d7016971d58ed9628e8818fabf00d1cd2`

### Phase 20B — University Evaluation Evidence

`ACTIVE / CURRENTLY AUTHORIZED THROUGH 20B-0/1 ONLY`

Current authorized sub-tasks:

- `20B-0` — Ethics and participant-safety gate;
- `20B-1` — Master university evaluation protocol.

Planned but inactive pending separate authorization:

- `20B-2` — engineering evidence-to-O7 matrix;
- `20B-3` — task-based usability protocol;
- `20B-4` — SUS procedure;
- `20B-5` — participant/sample plan;
- `20B-6` — selected accessibility protocol;
- `20B-7` — feature-specific AI-quality rubrics;
- `20B-8` — synthetic evaluation cases;
- `20B-9` — collection templates;
- participant/accessibility/AI evaluation campaigns;
- `20B-10` — analysis of actual evidence;
- `20B-11` — final O7 evaluation evidence record and integration gate.

### Phase 20C — Final Screenshots & Technical Evidence

`PLANNED / INACTIVE / REQUIRES SEPARATE AUTHORIZATION`

### Phase 20D — Report Evidence Pack

`PLANNED / INACTIVE / REQUIRES SEPARATE AUTHORIZATION`

### Phase 20E — Viva / Demonstration Preparation

`PLANNED / INACTIVE / REQUIRES SEPARATE AUTHORIZATION`

## Current completion gate for Phase 20B-0/1

Before PR creation for this slice:

1. branch must be based on `main @ ed5268ce26a33bc33d00d12d15840a582b0c1d93`;
2. changed files must be documentation only;
3. ethics gate must remain blocked unless real authoritative approval information is supplied;
4. master protocol must not claim participant/accessibility/AI results that do not exist;
5. `git diff --check origin/main...HEAD` must pass locally;
6. non-documentation changed-path check must return no output;
7. local working tree must be clean;
8. no application test rerun is required if the branch remains documentation-only;
9. PR creation requires the normal explicit approval after local qualification;
10. merge requires separate explicit approval of the exact qualified head SHA.

## Current approval boundary

The current approval authorizes only the Phase 20B-0/1 documentation described above.

It does not authorize Tasks 20B-2 through 20B-11, participant activity, product changes, deployment, merge, or branch deletion.