# Current Execution Scope

## Current activity

- Activity: `PHASE 20B-3 — TASK-BASED USABILITY EVALUATION PROTOCOL`
- Status: `ACTIVE / DOCUMENTATION-ONLY / METHOD DESIGN / PARTICIPANT EXECUTION BLOCKED`
- Branch: `phase-20b-3-usability-evaluation-protocol`
- Base `main` commit: `41dcc7cd6f11b5fad603c845c525b318c0a578eb`
- Base identity: `MERGE OF PR #36 — PHASE 20B-2 ENGINEERING EVIDENCE MATRIX`
- Current qualified executable checkpoint: `6b80f91d7016971d58ed9628e8818fabf00d1cd2`
- Current qualification evidence: `docs/planning/POST_PR33_EXECUTABLE_QUALIFICATION_CHECKPOINT.md`
- Historical Phase 20A evidence: `docs/planning/PHASE_20A_FINAL_RELEASE_BASELINE_EVIDENCE_FREEZE.md`
- Phase 20B plan: `docs/superpowers/plans/2026-08-16-phase-20b-university-evaluation-evidence.md`
- Ethics gate: `docs/evaluation/PHASE_20B_ETHICS_AND_PARTICIPANT_SAFETY_GATE.md`
- Master evaluation protocol: `docs/evaluation/PHASE_20B_UNIVERSITY_EVALUATION_PROTOCOL.md`
- Engineering evidence matrix: `docs/evaluation/PHASE_20B_ENGINEERING_EVIDENCE_MATRIX.md`
- Current usability protocol: `docs/evaluation/USABILITY_EVALUATION_PROTOCOL.md`

## Purpose

Freeze the task-based usability evaluation method for Objective O7 without recruiting participants or collecting results.

This slice defines:

- five fixed representative tasks;
- `SUCCESS / PARTIAL / FAILED` criteria;
- separate validity handling for environment invalidation, withdrawal and not-run tasks;
- a consistent timing method and 10-minute task maximum;
- recoverable-error and moderator-assistance definitions;
- observer instructions;
- standard evaluation-environment rules;
- task-state reset and contamination controls;
- later reproducible task-performance metrics and claim boundaries.

No participant result is created by this slice.

## Objective O7 evidence model

Objective O7 remains split into four independent evidence streams:

- **A — Engineering functionality evidence**;
- **B — Participant usability evidence**;
- **C — Selected accessibility evidence**;
- **D — Feature-specific AI-output-quality evidence**.

Phase 20B-3 designs **Stream B** only. It does not collect Stream B evidence yet.

## Current authorization

The user has explicitly authorized:

`APPROVE PHASE 20B-3 — TASK-BASED USABILITY EVALUATION PROTOCOL`

Authorized repository work is limited to documentation needed to:

1. create the frozen task-based usability protocol;
2. update the Phase 20B plan/progress pointer;
3. update this current execution scope.

No participant execution, product implementation or new evaluation-result collection is authorized.

## Phase 20B-3 task set

The protocol freezes this task order:

```text
U1 — Access & Navigation
U2 — Resume Studio
U3 — Interview Coach
U4 — Grounded Learning
U5 — Study Materials
```

Each participant, if later permitted, must use equivalent resettable synthetic/de-identified study state.

### U1 — Access & Navigation

Authenticate using a prepared study account, locate Resume, Interview, Learning and Settings, and return to Dashboard.

### U2 — Resume Studio

Edit the prepared synthetic Resume, save a new version, request an assessment, locate the score and inspect the recommendation state without automatically applying a recommendation.

### U3 — Interview Coach

Answer prepared Multiple Choice and written questions, save an attempt, find the saved attempt and inspect feedback/explanation.

### U4 — Grounded Learning

View the prepared document's original PDF and extracted text, ask a supplied grounded question, and use the source/page reference to trace supporting content.

### U5 — Study Materials

Reveal answers on prepared flashcards, complete a prepared quiz, submit it and open the saved result/review.

## Task scoring model

For a valid task use exactly:

```text
SUCCESS
PARTIAL
FAILED
```

- `SUCCESS` requires all applicable required outcomes within 10 minutes with no counted directional moderator assistance.
- `PARTIAL` means the primary outcome is reached but a required secondary outcome is missing, or directional assistance was required.
- `FAILED` means the primary outcome is not reached within 10 minutes, the valid task is abandoned, or the moderator must perform an essential task action.

Separate validity values prevent non-participant failures from being misclassified:

```text
VALID
INVALID_ENVIRONMENT
WITHDRAWN
NOT_RUN
```

`INVALID_ENVIRONMENT`, `WITHDRAWN` and `NOT_RUN` are excluded from valid completion-rate denominators.

## Timing, error and assistance rules

- maximum active task window: `10 minutes`;
- timer starts after the prompt is fully read and the participant indicates readiness;
- normal hesitation, loading, navigation and recoverable mistakes do not pause the clock;
- confirmed external/setup failure invalidates the task rather than creating a participant failure;
- recoverable errors are counted as discrete self-corrected error episodes;
- reasonable page scanning/reading is not an error;
- directional hints naming a control/location/sequence count as assistance;
- neutral repetition of the task goal does not count as assistance;
- an approved accessibility accommodation is not assistance or an error.

## Evaluation environment boundary

The later study should use one consistent environment unless an approved accommodation requires otherwise:

- approved Career Learning Hub evaluation baseline;
- Chrome stable;
- desktop/laptop presentation;
- target viewport approximately `1440 × 900`;
- browser zoom `100%`;
- clean study browser profile/session;
- equivalent reset study state per participant;
- synthetic/de-identified records only by default;
- study-managed Gemini for U2/U4 where required;
- current release-path model recorded as `gemini-3.6-flash` when AI is exercised;
- no participant personal API keys.

Actual browser version, device/viewport, protocol version, executable identity, fixture version and non-secret model/configuration identity must be recorded when the study is eventually conducted.

## Ethics and participant-safety gate

Current gate state remains:

`BLOCKED / AWAITING MODULE OR SUPERVISOR CONFIRMATION`

Phase 20B-3 does not bypass or change that gate.

Until authoritative module/supervisor direction is recorded and the gate explicitly passes, do not:

- recruit participants;
- conduct usability sessions;
- collect task observations/times/errors/assistance;
- administer SUS/questionnaires;
- collect participant recordings or identifying information.

## Prerequisites before later participant execution

At minimum, later participant sessions remain blocked until:

1. the ethics/module gate passes under recorded conditions;
2. `20B-5` defines permitted participant eligibility/recruitment/sample/stopping rules;
3. `20B-8` provides the frozen synthetic/de-identified study fixtures;
4. `20B-9` provides the frozen evidence-collection template;
5. the executable/environment identity and reset process are recorded;
6. study-managed AI needed by U2/U4 is functioning.

If SUS will be used in the same study, `20B-4` must also be frozen before the first session.

## Current executable qualification evidence

The current qualified executable checkpoint remains:

`6b80f91d7016971d58ed9628e8818fabf00d1cd2`

PR #34, PR #35 and PR #36 were documentation-only integration work around that qualified executable content.

Recorded fresh qualification evidence remains:

- root workspace production typecheck — PASS;
- backend test-source typecheck — PASS;
- backend unit — 223/223 PASS;
- backend integration — 249/249 PASS;
- backend security — 43/43 PASS;
- complete backend suite — 515/515 PASS;
- complete frontend suite — 1,170/1,170 PASS;
- frontend/backend production builds — PASS;
- non-overlapping complete-suite total — **1,685 PASSING TESTS**;
- qualified worktree — CLEAN.

This engineering evidence is separate from participant usability evidence and must not be relabelled as a task-success rate or SUS result.

## Phase 20B-2 status

Phase 20B-2 — Engineering Evidence Matrix is:

`COMPLETED / QUALIFIED / MERGED VIA PR #36`

The matrix remains the authoritative Stream A mapping:

`docs/evaluation/PHASE_20B_ENGINEERING_EVIDENCE_MATRIX.md`

## Out of scope for Phase 20B-3

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

The current authorization also does **not** permit:

- participant recruitment/data collection;
- usability study execution;
- SUS administration;
- participant eligibility/sample/recruitment decisions;
- accessibility campaign execution;
- formal AI-quality scoring/result collection;
- synthetic evaluation fixture creation;
- evaluation-result population;
- deployment;
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

`ACTIVE / DOCUMENTATION-ONLY / CURRENTLY AUTHORIZED / PARTICIPANT EXECUTION BLOCKED`

### Planned Phase 20B work — inactive pending separate authorization

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

## Completion gate for Phase 20B-3

Before PR creation for this slice:

1. branch must remain based on `main @ 41dcc7cd6f11b5fad603c845c525b318c0a578eb`;
2. changed files must remain documentation only;
3. the usability protocol must contain U1–U5 in the fixed order;
4. every task must define participant-facing wording, required outcomes, primary outcome and `SUCCESS / PARTIAL / FAILED` rules;
5. validity handling must distinguish `VALID / INVALID_ENVIRONMENT / WITHDRAWN / NOT_RUN`;
6. timing, recoverable-error, assistance and observer rules must be explicit;
7. participant execution must remain blocked by the ethics gate;
8. no participant result, sample size, SUS value, accessibility result or AI-quality result may be invented;
9. 20B-4+ must remain inactive;
10. `git diff --check origin/main...HEAD` must pass locally;
11. non-documentation changed-path check must return no output;
12. final local working tree must be clean;
13. no application test rerun is required if the branch remains documentation-only;
14. PR creation requires explicit approval after local qualification;
15. merge requires separate explicit approval of the exact qualified head SHA.

## Current approval boundary

The current approval authorizes only Phase 20B-3 usability-method documentation.

It does not authorize Phase 20B-4 through 20B-11, participant activity, product changes, deployment, merge or branch deletion.
