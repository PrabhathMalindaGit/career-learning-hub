# Current Execution Scope

## Current activity

- Activity: `PHASE 20B-4/6/7 — EVALUATION METHOD DESIGN FREEZE`
- Status: `ACTIVE / DOCUMENTATION-ONLY / METHOD DESIGN / NO RESULTS`
- Branch: `phase-20b-4-6-7-evaluation-method-design-freeze`
- Base `main` commit: `7142e6dde8281db1852d365989f25c4d10e5265b`
- Base identity: `MERGE OF PR #37 — PHASE 20B-3 TASK-BASED USABILITY EVALUATION PROTOCOL`
- Current qualified executable checkpoint: `6b80f91d7016971d58ed9628e8818fabf00d1cd2`
- Current qualification evidence: `docs/planning/POST_PR33_EXECUTABLE_QUALIFICATION_CHECKPOINT.md`
- Historical Phase 20A evidence: `docs/planning/PHASE_20A_FINAL_RELEASE_BASELINE_EVIDENCE_FREEZE.md`
- Phase 20B plan: `docs/superpowers/plans/2026-08-16-phase-20b-university-evaluation-evidence.md`
- Ethics gate: `docs/evaluation/PHASE_20B_ETHICS_AND_PARTICIPANT_SAFETY_GATE.md`
- Master evaluation protocol: `docs/evaluation/PHASE_20B_UNIVERSITY_EVALUATION_PROTOCOL.md`
- Engineering evidence matrix: `docs/evaluation/PHASE_20B_ENGINEERING_EVIDENCE_MATRIX.md`
- Usability protocol: `docs/evaluation/USABILITY_EVALUATION_PROTOCOL.md`
- SUS protocol: `docs/evaluation/SUS_EVALUATION_PROTOCOL.md`
- Accessibility protocol: `docs/evaluation/ACCESSIBILITY_EVALUATION_PROTOCOL.md`
- Resume AI rubric: `docs/evaluation/AI_RESUME_EVALUATION_RUBRIC.md`
- Interview AI rubric: `docs/evaluation/AI_INTERVIEW_EVALUATION_RUBRIC.md`
- Grounded Learning AI rubric: `docs/evaluation/AI_LEARNING_GROUNDED_QA_EVALUATION_RUBRIC.md`

## Purpose

Freeze the remaining independent evaluation methodologies that do not require participant recruitment or ethics-dependent sample decisions:

1. `20B-4` — standard System Usability Scale procedure;
2. `20B-6` — selected accessibility evaluation protocol;
3. `20B-7` — feature-specific Resume, Interview and Grounded Learning AI-quality rubrics.

This combined slice reduces unnecessary branch/PR overhead while preserving the methodological separation required by Objective O7.

No participant, accessibility or AI-quality result is created by this slice.

## Objective O7 evidence model

Objective O7 remains split into four independent evidence streams:

- **A — Engineering functionality evidence**;
- **B — Participant usability evidence**;
- **C — Selected accessibility evidence**;
- **D — Feature-specific AI-output-quality evidence**.

Current combined design work touches the methods for:

- Stream B: SUS only;
- Stream C: selected accessibility;
- Stream D: Resume, Interview and Grounded Learning AI output quality.

The streams remain analytically separate even though their documentation is implemented on one branch.

## Current authorization

The user has explicitly authorized:

`APPROVE PHASE 20B-4/6/7 — EVALUATION METHOD DESIGN FREEZE`

Authorized repository work is limited to documentation needed to:

1. freeze the SUS administration/scoring method;
2. freeze selected accessibility procedures/results scale;
3. freeze separate Resume, Interview and Grounded Learning AI-quality rubrics;
4. update the Phase 20B plan/progress pointer;
5. update this current execution scope.

No evaluation campaign, result collection or product change is authorized.

## Phase 20B-4 — SUS method

The SUS protocol freezes:

- one administration after the approved system/task exposure;
- the standard 10 SUS items in standard order;
- one 1–5 response scale from Strongly disagree to Strongly agree;
- odd items scored as `response - 1`;
- even items scored as `5 - response`;
- adjusted sum multiplied by `2.5`;
- resulting `0–100` SUS score explicitly treated as a score, **not a percentage**;
- no imputation for missing responses;
- one missing/invalid item invalidates the individual SUS score under protocol version 1.0;
- group reporting of valid `n`, mean, median, minimum and maximum;
- task-performance evidence and SUS evidence kept separate.

SUS administration remains participant-derived data collection and is blocked by the ethics gate.

## Phase 20B-6 — selected accessibility method

The accessibility protocol freezes `29` selected checks across:

- authentication;
- application shell/navigation;
- Resume Studio;
- Interview Coach;
- Learning Workspace;
- Settings/Gemini.

Selected behaviour categories include:

- keyboard-only operation;
- visible/logical focus;
- dialog focus management;
- labels/instructions;
- validation/error identification;
- status/save feedback;
- `200%` browser zoom/reflow;
- reduced-width responsive navigation.

Every check uses exactly:

```text
PASS
FAIL
NOT ASSESSED
```

Any selected-check pass rate must disclose its denominator and excluded `NOT ASSESSED` count. It must never be described as a WCAG-conformance percentage.

## Phase 20B-7A — Resume AI quality

The Resume rubric uses a `0 / 1 / 2` ordinal scale for:

1. factual preservation;
2. target-role relevance;
3. actionability;
4. clarity;
5. internal consistency.

Material fabrication is tracked separately as:

```text
NONE
MINOR_AMBIGUITY
MATERIAL_FABRICATION
```

A high rubric total cannot erase a material-fabrication finding.

The rubric does not measure employer ATS equivalence, hiring probability or guaranteed employment outcome.

## Phase 20B-7B — Interview AI quality

Question generation and feedback are scored separately.

Generated-question criteria:

1. role relevance;
2. experience-level appropriateness;
3. clarity;
4. useful coverage;
5. redundancy control.

Feedback criteria:

1. relevance to submitted answer;
2. specificity;
3. actionability;
4. internal consistency;
5. practice-only/non-hiring framing.

The rubric does not treat Interview scores as employer judgment or hiring probability. Text coding-question evaluation does not imply compiler/runtime correctness.

## Phase 20B-7C — Grounded Learning AI quality

Frozen future case types:

```text
ANSWERABLE_SINGLE
ANSWERABLE_MULTI
UNANSWERABLE
```

The rubric keeps separate:

- answer documentary support;
- citation/source-page correctness;
- completeness against frozen reference facts;
- unsupported-question/abstention handling;
- material unsupported-claim flags.

Metric numerators/denominators are explicitly defined. The protocol prohibits collapsing these dimensions into one vague overall AI accuracy figure.

Current Learning retrieval must be described according to the actual implementation; lexical/source-based retrieval must not be relabelled as vector/embedding retrieval without evidence.

## Ethics and participant-safety gate

Current gate state remains:

`BLOCKED / AWAITING MODULE OR SUPERVISOR CONFIRMATION`

This combined method-design slice does not change that gate.

Until authoritative direction is recorded and the gate explicitly passes, do not:

- recruit participants;
- conduct formal/pilot participant usability sessions;
- administer SUS;
- collect participant observations or questionnaire data;
- collect participant demographic data or recordings;
- create a participant count or participant-derived result.

## Phase 20B-5 remains separate and blocked

Phase 20B-5 — Participant/Sample Plan is **not** included in this combined authorization.

Do not freeze:

- participant eligibility;
- recruitment route;
- participant target count;
- sample description;
- participant stopping rule;

until authoritative module/supervisor/ethics guidance and realistic recruitment feasibility are known.

No participant number is invented by Phase 20B-4/6/7.

## Phase 20B-8/9 remain unstarted

Not authorized in this slice:

- creation of synthetic Resume/Interview/Learning evaluation cases or PDFs (`20B-8`);
- creation of CSV/machine-readable evidence collection templates (`20B-9`);
- population of any results.

The current documents define the fields/semantics that those later assets must preserve.

## Current executable qualification evidence

The current qualified executable checkpoint remains:

`6b80f91d7016971d58ed9628e8818fabf00d1cd2`

PR #34 through PR #37 are documentation-only integrations around that qualified executable content.

Recorded qualification evidence remains:

- root workspace production typecheck — PASS;
- backend test-source typecheck — PASS;
- backend unit — 223/223 PASS;
- backend integration — 249/249 PASS;
- backend security — 43/43 PASS;
- complete backend suite — 515/515 PASS;
- complete frontend suite — 1,170/1,170 PASS;
- frontend/backend production builds — PASS;
- non-overlapping complete-suite total — **1,685 PASSING TESTS**.

This engineering evidence remains separate from SUS, accessibility and AI-output-quality evidence.

## Out of scope for Phase 20B-4/6/7

No changes are authorized to:

- `frontend/`;
- `backend/`;
- `packages/`;
- `tests/`;
- package manifests or lockfiles;
- runtime/build configuration;
- environment files;
- schemas or migrations;
- APIs/contracts;
- authentication, Gemini/provider, private-storage or background-job behaviour;
- application features/UI;
- deployment resources.

Also not authorized:

- participant recruitment/data collection;
- SUS administration;
- participant/sample decisions;
- accessibility campaign execution/results;
- AI-quality campaign execution/scoring/results;
- synthetic evaluation fixtures;
- collection templates;
- deployment;
- PR creation before local qualification and explicit approval;
- merge;
- branch deletion.

## Current final-stage roadmap

### Phase 20A — Final Release Baseline & Evidence Freeze

`COMPLETED / QUALIFIED / MERGED VIA PR #31`

### Comprehensive current-tree documentation consolidation

`COMPLETED / MERGED VIA PR #32`

### Viva Feature & UI Location Map

`COMPLETED / QUALIFIED / MERGED VIA PR #33`

### Post-PR-33 executable qualification evidence checkpoint

`COMPLETED / QUALIFIED / MERGED VIA PR #34`

### Phase 20B-0/1 — Ethics Gate + Master Evaluation Protocol

`COMPLETED / QUALIFIED / MERGED VIA PR #35`

### Phase 20B-2 — Engineering Evidence Matrix

`COMPLETED / QUALIFIED / MERGED VIA PR #36`

### Phase 20B-3 — Task-Based Usability Evaluation Protocol

`COMPLETED / QUALIFIED / MERGED VIA PR #37`

### Phase 20B-4/6/7 — Evaluation Method Design Freeze

`ACTIVE / DOCUMENTATION-ONLY / CURRENTLY AUTHORIZED / NO RESULTS`

### Phase 20B-5 — Participant/Sample Plan

`PLANNED / NOT AUTHORIZED / BLOCKED BY ETHICS-MODULE GUIDANCE`

### Phase 20B-8/9 — Evaluation Execution Pack

`PLANNED / NOT AUTHORIZED`

Includes frozen synthetic evaluation cases and machine-readable collection templates.

### Evaluation campaigns

`NOT AUTHORIZED`

Participant-facing work remains ethics-gated. Accessibility/AI campaigns require frozen execution inputs/templates first.

### Phase 20B-10 — Results Analysis

`PLANNED / NOT AUTHORIZED / REQUIRES ACTUAL EVIDENCE`

### Phase 20B-11 — Final O7 Evidence Record

`PLANNED / NOT AUTHORIZED`

### Phase 20C — Final Screenshots & Technical Evidence

`PLANNED / INACTIVE / REQUIRES SEPARATE AUTHORIZATION`

### Phase 20D — Report Evidence Pack

`PLANNED / INACTIVE / REQUIRES SEPARATE AUTHORIZATION`

### Phase 20E — Viva / Demonstration Preparation

`PLANNED / INACTIVE / REQUIRES SEPARATE AUTHORIZATION`

## Completion gate for Phase 20B-4/6/7

Before PR creation for this combined slice:

1. branch must remain based on `main @ 7142e6dde8281db1852d365989f25c4d10e5265b`;
2. changed files must remain documentation only;
3. SUS wording/scale/scoring/missing-data rules must be frozen and no SUS result invented;
4. accessibility checks must have IDs/procedures/expected results and use `PASS / FAIL / NOT ASSESSED`;
5. accessibility claims must remain below full WCAG certification;
6. Resume, Interview and Learning AI rubrics must remain separate;
7. AI rubric scoring rules/metric denominators must be explicit;
8. no employer ATS, hiring probability, guaranteed truth, vague AI-accuracy or learning-improvement claim may be created;
9. 20B-5 remains blocked and no participant count is invented;
10. 20B-8/9 remain unstarted;
11. ethics gate remains blocked unless real authoritative guidance is supplied;
12. `git diff --check origin/main...HEAD` must pass locally;
13. non-documentation changed-path check must return no output;
14. final local working tree must be clean;
15. no application test rerun is required if the branch remains documentation-only;
16. PR creation requires explicit approval after local qualification;
17. merge requires separate explicit approval of the exact qualified head SHA.

## Current approval boundary

The current approval authorizes only Phase 20B-4/6/7 evaluation-method documentation.

It does not authorize Phase 20B-5, Phase 20B-8 through 20B-11, participant activity, evaluation-result collection, product changes, deployment, merge or branch deletion.