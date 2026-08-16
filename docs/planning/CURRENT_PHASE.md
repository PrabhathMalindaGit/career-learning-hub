# Current Execution Scope

## Current activity

- Activity: `PHASE 20B-8/9 — EVALUATION EXECUTION PACK`
- Status: `ACTIVE / PR #39 REVIEW REPAIR / SYNTHETIC INPUTS + EMPTY COLLECTION TEMPLATES / NO RESULTS`
- Working branch: `phase-20b-8-9-evaluation-execution-pack-v2`
- Base `main` commit: `36a300ff7e35e60b560c5a722d566333ba82b06b`
- Base identity: `MERGE OF PR #38 — PHASE 20B-4/6/7 EVALUATION METHOD DESIGN FREEZE`
- Current qualified executable checkpoint: `6b80f91d7016971d58ed9628e8818fabf00d1cd2`
- Ethics gate: `BLOCKED / AWAITING MODULE OR SUPERVISOR CONFIRMATION`
- Dataset version: `20B8-v1.0`
- Template version: `20B9-templates-v1.0`

## Branch note

The initially created branch `phase-20b-8-9-evaluation-execution-pack` remains untouched at the base commit. A low-level Git ref update was blocked by the connector safety layer after the binary PDF tree was created, so the implementation continues on `phase-20b-8-9-evaluation-execution-pack-v2`, created directly from the valid dataset commit. No branch deletion is authorized.

PR #39 was opened after local qualification at `e47d3156f235606f8e93f174685efedc984be9a2`. Final pre-merge review identified four P2 evidence-design/qualification-contract findings. Repairs remain on the same documentation-only branch; the old exact-head merge approval is stale and a new local qualification plus exact-head merge approval is required before merge.

## Purpose

Prepare the frozen synthetic/de-identified inputs and machine-readable evidence-collection structures required to execute the already-approved Phase 20B evaluation methods later.

This slice creates **inputs and empty templates only**. It creates no participant, SUS, accessibility or AI-quality result.

## Completed Phase 20B method design

- `20B-0/1` Ethics Gate + Master Evaluation Protocol — completed/merged via PR #35; gate remains blocked.
- `20B-2` Engineering Evidence Matrix — completed/merged via PR #36.
- `20B-3` Task-Based Usability Protocol — completed/merged via PR #37.
- `20B-4/6/7` SUS + selected accessibility + feature-specific AI rubrics — completed/merged via PR #38.

## Phase 20B-8 frozen inputs

Authoritative directory: `docs/evaluation/datasets/v1/`

Frozen synthetic scope:

- 4 Resume/target-role cases: `RSM-01` through `RSM-04`;
- 4 Interview role/prepared-answer cases: `INT-01` through `INT-04`;
- 2 text-based four-page Learning PDFs with exact source-text mirrors and SHA-256 identifiers;
- 6 Grounded Learning cases: 2 `ANSWERABLE_SINGLE`, 2 `ANSWERABLE_MULTI`, 2 `UNANSWERABLE`;
- fixed U1-U5 usability fixture bindings, including prepared Resume, Interview, Learning, flashcard and quiz state.

All content is fictional. No real participant CV, private study document, personal API key or direct participant identifier is included.

The Learning PDFs were generated as text-based PDFs, rendered to images for visual inspection, and checked for extractable text before repository integration. Their hashes are recorded in `dataset_manifest.json`.

## Phase 20B-9 collection templates

Authoritative directory: `docs/evaluation/templates/v1/`

Frozen CSV structures:

- `usability_campaign_metadata.csv` for the protocol-required study baseline/environment record;
- `usability_observations.csv`, linked through `campaign_id`;
- `sus_responses.csv`;
- `accessibility_campaign_metadata.csv` for the protocol-required accessibility baseline/environment record;
- `accessibility_checks.csv` with A-01 through A-29, linked through `campaign_id`;
- `ai_resume_scoring.csv`;
- `ai_interview_questions_scoring.csv` for IQ-01 to IQ-03 per generated question;
- `ai_interview_question_sets_scoring.csv` for IQ-04 and IQ-05 at generated-set level;
- `ai_interview_feedback_scoring.csv`;
- `ai_learning_grounded_qa_scoring.csv`.

Static case/check identifiers are pre-populated where useful. Observation, response, metadata and result fields remain blank.

## Ethics boundary

Current gate remains:

`BLOCKED / AWAITING MODULE OR SUPERVISOR CONFIRMATION`

Therefore this slice does not authorize:

- participant recruitment;
- pilot/formal usability sessions;
- SUS administration;
- participant observation/timing/error/assistance collection;
- recordings or demographic collection;
- participant/sample decisions in `20B-5`.

## Phase 20B-5

`PLANNED / NOT AUTHORIZED / BLOCKED BY ETHICS-MODULE GUIDANCE`

No participant eligibility, recruitment route, target count, sample description, stopping rule or demographic fields are invented here.

## Evaluation execution boundary

The pack prepares later execution, but no campaign is run on this branch.

Not authorized:

- populating CSV templates with real or claimed results;
- formal execution of the 29 accessibility checks;
- generating/scoring Resume, Interview or Learning AI outputs;
- administering U1-U5 to participants;
- calculating SUS from participant responses;
- Phase 20B-10 analysis;
- Phase 20B-11 final O7 evidence record;
- product code/test/config changes;
- deployment;
- branch deletion.

## Current executable evidence

Qualified executable checkpoint remains `6b80f91d7016971d58ed9628e8818fabf00d1cd2`.

Recorded engineering baseline remains:

- backend complete suite 515/515 PASS;
- frontend complete suite 1,170/1,170 PASS;
- non-overlapping automated total 1,685 PASS;
- backend security regression 43/43 PASS;
- production/test-source typechecks and production builds PASS.

Those counts remain engineering evidence only.

## Current final-stage roadmap

- Phase 20B-8/9 — `ACTIVE / PR #39 REVIEW REPAIR`
- Phase 20B-5 — `BLOCKED / NOT AUTHORIZED`
- Evaluation campaigns — `NOT AUTHORIZED`
- Phase 20B-10 Results Analysis — `PLANNED / NOT AUTHORIZED`
- Phase 20B-11 Final O7 Evidence Record — `PLANNED / NOT AUTHORIZED`
- Phase 20C Final Screenshots & Technical Evidence — `PLANNED / INACTIVE`
- Phase 20D Report Evidence Pack — `PLANNED / INACTIVE`
- Phase 20E Viva / Demonstration Preparation — `PLANNED / INACTIVE`

## Completion gate for Phase 20B-8/9

Before final merge approval:

1. working branch must descend from `main @ 36a300ff7e35e60b560c5a722d566333ba82b06b`;
2. changed paths must remain under `docs/`;
3. dataset/template version identifiers must be present;
4. Resume cases must preserve known facts and prohibited inventions;
5. Interview cases must preserve role/experience context and prepared answers;
6. both Learning PDFs must be text based and match their source/reference records;
7. Learning cases must include single-source, multi-source and unanswerable cases;
8. U1-U5 bindings must identify repeatable synthetic starting state;
9. CSV templates must contain no invented results;
10. SUS template must preserve all ten raw item fields;
11. accessibility templates must preserve A-01 through A-29 and a linked campaign-level environment record;
12. AI templates must preserve rubric-specific fields and frozen case IDs, with Interview IQ-01 to IQ-03 recorded per generated question and IQ-04 to IQ-05 recorded at set level;
13. `20B-5` remains blocked and no participant count is invented;
14. ethics gate remains unchanged;
15. `git diff --check origin/main...HEAD -- . ':(exclude,glob)**/*.pdf'` must pass locally for text changes;
16. both PDF SHA-256 values must match the frozen manifest and both PDFs must open as four-page, text-extractable documents through macOS PDFKit;
17. final working tree must be clean;
18. no application test rerun is required if all changes remain under `docs/`;
19. merge requires a new separate exact-head approval after repair qualification.

The PDF-specific gate intentionally validates PDFs as documents rather than treating their binary syntax as line-oriented source text. No repository `.gitattributes` or product/configuration change is required for this evaluation-only slice.

## Current approval boundary

The user has authorized:

`APPROVE PHASE 20B-8/9 — EVALUATION EXECUTION PACK`

PR #39 was created and the original exact-head merge was approved, but review repairs moved the branch. A new exact-head merge approval is required after requalification.

No result collection, Phase 20B-5, product modification, deployment, Phase 20B-10 or Phase 20B-11 work is authorized.
