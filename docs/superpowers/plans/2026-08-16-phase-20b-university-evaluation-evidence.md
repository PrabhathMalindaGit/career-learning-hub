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
`IMPLEMENTED / LOCALLY QUALIFIED AT e47d3156... / PR #39 OPEN / REVIEW REPAIR REQUIRES REQUALIFICATION`

Authoritative directory: `docs/evaluation/datasets/v1/`

Frozen scope:

- 4 synthetic Resume cases (`RSM-01` to `RSM-04`);
- 4 synthetic Interview role/prepared-answer cases (`INT-01` to `INT-04`);
- 2 text-based four-page Learning PDFs with exact source-text mirrors;
- 6 Grounded Learning QA cases: 2 `ANSWERABLE_SINGLE`, 2 `ANSWERABLE_MULTI`, 2 `UNANSWERABLE`;
- U1-U5 repeatable usability fixture bindings.

Dataset identities and PDF SHA-256 values are recorded in `dataset_manifest.json`.

The two PDFs were rendered and visually inspected, and text extraction was verified before repository integration. Local qualification later reconfirmed both as four-page, text-extractable PDFs through macOS PDFKit.

No AI outputs are generated or scored in Task 8.

### Task 9 — Evidence-collection templates
`IMPLEMENTED / PR #39 OPEN / REVIEW REPAIR REQUIRES REQUALIFICATION`

Authoritative directory: `docs/evaluation/templates/v1/`

Frozen structures after PR #39 review repair:

- `usability_campaign_metadata.csv`;
- `usability_observations.csv` linked through `campaign_id`;
- `sus_responses.csv`;
- `accessibility_campaign_metadata.csv`;
- `accessibility_checks.csv` linked through `campaign_id`;
- `ai_resume_scoring.csv`;
- `ai_interview_questions_scoring.csv` for per-question IQ-01 to IQ-03 values;
- `ai_interview_question_sets_scoring.csv` for set-level IQ-04 and IQ-05 values;
- `ai_interview_feedback_scoring.csv`;
- `ai_learning_grounded_qa_scoring.csv`.

Static case/check identifiers are pre-populated where useful. Participant responses, observations, metadata values, status values and AI/accessibility results remain blank.

PR #39 review repair preserves the reproducibility fields required by the usability/accessibility protocols and removes ambiguity between Interview question-level and set-level scoring.

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

## PR #39 review-repair record

PR #39 was opened after local qualification at exact head `e47d3156f235606f8e93f174685efedc984be9a2`.

Final pre-merge verification found four unresolved Codex P2 review findings:

1. the documented raw `git diff --check` contract treated generated PDF internals as line-oriented text;
2. usability observations lacked a linked campaign-level reproducibility/environment record;
3. accessibility checks lacked a linked campaign-level environment record;
4. Interview question scoring mixed per-question IQ-01 to IQ-03 with set-level IQ-04/IQ-05.

Repairs stay on the same branch and inside `docs/` only. The PDF repair does **not** modify repository configuration; instead, text changes use `git diff --check` with PDF paths excluded, while PDFs are qualified by frozen SHA-256 plus macOS PDFKit page/text checks.

Because review repair moves the PR head, the prior exact-head merge approval is stale. Requalification and a new exact-head merge approval are mandatory before merge.

## Current qualification boundary

Before final merge approval, the user must verify:

- exact working-branch HEAD;
- merge base/ancestry against `origin/main`;
- all changed paths remain under `docs/`;
- all JSON inputs still parse;
- all CSV templates still parse and preserve expected row structures;
- usability/accessibility campaign metadata templates exist and observation/check rows link through `campaign_id`;
- Interview question-unit and question-set templates preserve separate scoring units;
- both PDF SHA-256 values match the frozen manifest;
- both PDFs open as four-page, text-extractable documents through macOS PDFKit;
- `git diff --check origin/main...HEAD -- . ':(exclude,glob)**/*.pdf'` produces no output;
- final working tree is clean.

Expected execution-pack paths remain under:

- `docs/evaluation/datasets/v1/**`
- `docs/evaluation/templates/v1/**`

plus modifications to:

- `docs/planning/CURRENT_PHASE.md`
- this plan.

No application test rerun is required if all changed paths remain under `docs/`.

Merge requires a new separate exact-head approval after repair qualification.

## Current authorization

Authorized:

- Task 8 synthetic/de-identified fixture creation;
- Task 9 empty machine-readable collection-template creation and bounded same-branch review repair;
- planning/progress updates for those tasks.

Not authorized:

- Task 5 participant/sample decisions;
- participant recruitment/data collection;
- SUS administration;
- accessibility/AI campaign execution or scoring;
- Task 10/11 results work;
- executable product changes;
- repository/product configuration changes;
- deployment;
- merge at any head not separately approved after qualification;
- branch deletion.
