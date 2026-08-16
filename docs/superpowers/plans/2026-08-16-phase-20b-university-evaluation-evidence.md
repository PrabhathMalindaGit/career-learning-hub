# Phase 20B — University Evaluation Evidence Implementation Plan

## Goal

Close Objective O7 with four distinct evidence streams:

A. engineering functionality/technical reliability;
B. participant usability/SUS;
C. selected accessibility;
D. feature-specific AI-output quality.

The qualified Career Learning Hub executable remains unchanged unless a separately approved defect-repair branch is required.

## Global constraints

- Repository: `PrabhathMalindaGit/career-learning-hub`.
- Current working branch: `phase-20b-8-9-evaluation-execution-pack-v2`.
- Branch ancestry begins at `main @ 36a300ff7e35e60b560c5a722d566333ba82b06b`.
- Current qualified executable checkpoint: `6b80f91d7016971d58ed9628e8818fabf00d1cd2`.
- The initially created `phase-20b-8-9-evaluation-execution-pack` branch remains untouched at the base commit after a connector ref-update safety block; no branch deletion is authorized.
- Build the smallest secure and functional solution suitable for a university project. Reuse existing architecture and avoid enterprise-grade complexity.
- Ethics gate remains `BLOCKED / AWAITING MODULE OR SUPERVISOR CONFIRMATION`.
- No participant recruitment/data collection is allowed while that gate is blocked.
- Never invent participant counts, SUS values, accessibility findings, AI-quality results or statistical findings.
- Use synthetic/de-identified fixtures only by default.
- Do not commit real Gemini credentials, participant identifiers, personal CVs or private documents.
- No deployment or branch deletion is authorized.
- Product code/tests/packages/configuration remain out of scope for this evaluation-pack slice.

## Task status

### Task 0 — Ethics and participant safety
`COMPLETED / MERGED PR #35 / GATE BLOCKED`

### Task 1 — Master evaluation protocol
`COMPLETED / MERGED PR #35`

### Task 2 — Engineering evidence matrix
`COMPLETED / QUALIFIED / MERGED PR #36`

### Task 3 — Task-based usability protocol
`COMPLETED / QUALIFIED / MERGED PR #37`

### Task 4 — SUS procedure
`COMPLETED / QUALIFIED / MERGED AS PART OF PR #38`

### Task 5 — Participant/sample plan
`PLANNED / NOT AUTHORIZED / BLOCKED BY TASK 0`

Do not freeze eligibility, recruitment route, target count, sample description, stopping rule or demographics until authoritative guidance exists.

### Task 6 — Selected accessibility protocol
`COMPLETED / QUALIFIED / MERGED AS PART OF PR #38`

### Task 7 — Feature-specific AI rubrics
`COMPLETED / QUALIFIED / MERGED AS PART OF PR #38`

Separate Resume, Interview and Grounded Learning rubrics remain authoritative.

### Task 8 — Frozen synthetic evaluation inputs
`AUTHORIZED / IMPLEMENTED ON CURRENT BRANCH / AWAITING LOCAL QUALIFICATION`

Authoritative directory: `docs/evaluation/datasets/v1/`

Frozen scope:

- 4 synthetic Resume cases (`RSM-01` to `RSM-04`);
- 4 synthetic Interview role/prepared-answer cases (`INT-01` to `INT-04`);
- 2 text-based four-page Learning PDFs with exact source-text mirrors;
- 6 Grounded Learning QA cases: 2 `ANSWERABLE_SINGLE`, 2 `ANSWERABLE_MULTI`, 2 `UNANSWERABLE`;
- U1-U5 repeatable usability fixture bindings.

Dataset identities and PDF SHA-256 values are recorded in `dataset_manifest.json`.

The two PDFs were rendered and visually inspected, and text extraction was verified before repository integration.

No AI outputs are generated or scored in Task 8.

### Task 9 — Evidence-collection templates
`AUTHORIZED / IMPLEMENTED ON CURRENT BRANCH / AWAITING LOCAL QUALIFICATION`

Authoritative directory: `docs/evaluation/templates/v1/`

Frozen files:

- `usability_observations.csv`;
- `sus_responses.csv`;
- `accessibility_checks.csv`;
- `ai_resume_scoring.csv`;
- `ai_interview_questions_scoring.csv`;
- `ai_interview_feedback_scoring.csv`;
- `ai_learning_grounded_qa_scoring.csv`.

Static case/check identifiers are pre-populated where useful. Participant responses, observations, status values and AI/accessibility results remain blank.

### Task 10 — Conduct evaluation and analyse actual evidence
`PLANNED / NOT AUTHORIZED`

Participant work is blocked by Task 0 and Task 5. Accessibility/AI execution also requires separate authorization to run the frozen campaigns and populate evidence.

### Task 11 — Final O7 evidence record
`PLANNED / NOT AUTHORIZED`

Only after actual evidence exists, produce the final O7 results/evidence record with limitations and reproducible calculations.

## Dataset freeze rules

1. Stable case IDs and versions must be preserved once execution begins.
2. Material fixture changes require a new version.
3. Original captured AI outputs must remain associated with model/executable/case identity.
4. Do not cherry-pick AI generations.
5. Source/page facts in Learning cases are authoritative for the synthetic PDFs.
6. PDF hashes are recorded in the manifest.
7. No result may be pre-populated merely to demonstrate a template.

## Current qualification boundary

Before PR creation, the user must verify:

- exact working-branch HEAD;
- merge base/ancestry against `origin/main`;
- all changed paths remain under `docs/`;
- `git diff --check origin/main...HEAD` produces no output;
- final working tree is clean.

Expected new execution-pack paths are under:

- `docs/evaluation/datasets/v1/**`
- `docs/evaluation/templates/v1/**`

plus modifications to:

- `docs/planning/CURRENT_PHASE.md`
- this plan.

No application test rerun is required if all changed paths remain under `docs/`.

PR creation requires separate explicit approval after local qualification. Merge requires a later exact-head approval.

## Current authorization

Authorized:

- Task 8 synthetic/de-identified fixture creation;
- Task 9 empty machine-readable collection-template creation;
- planning/progress updates for those tasks.

Not authorized:

- Task 5 participant/sample decisions;
- participant recruitment/data collection;
- SUS administration;
- accessibility/AI campaign execution or scoring;
- Task 10/11 results work;
- executable product changes;
- deployment;
- merge;
- branch deletion.
