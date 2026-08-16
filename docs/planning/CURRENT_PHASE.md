# Current Execution Scope

## Current activity

- Activity: `PHASE 20B-8/9 — EVALUATION EXECUTION PACK`
- Status: `ACTIVE / PR #39 LOCALLY QUALIFIED AT 8e4810fe70f19194554bdb812e888a75c08aec1d / FINAL BOOKKEEPING REPAIR`
- Working branch: `phase-20b-8-9-evaluation-execution-pack-v2`
- Base `main` commit: `36a300ff7e35e60b560c5a722d566333ba82b06b`
- Base identity: `MERGE OF PR #38 — PHASE 20B-4/6/7 EVALUATION METHOD DESIGN FREEZE`
- Current qualified executable checkpoint: `6b80f91d7016971d58ed9628e8818fabf00d1cd2`
- Ethics gate: `BLOCKED / AWAITING MODULE OR SUPERVISOR CONFIRMATION`
- Dataset version: `20B8-v1.0`
- Template version: `20B9-templates-v1.0`
- Pull request: `#39 — Phase 20B-8/9 — Evaluation execution pack`

## Branch note

The initially created branch `phase-20b-8-9-evaluation-execution-pack` remains untouched at the base commit. A low-level Git ref update was blocked by the connector safety layer after the binary PDF tree was created, so implementation continues on `phase-20b-8-9-evaluation-execution-pack-v2`. No branch deletion is authorized.

PR #39 remains a documentation/evaluation-evidence preparation change. All implementation and review repairs stay under `docs/`; no product code, test, package, dependency, repository configuration, runtime or deployment change is authorized by this slice.

## Purpose

Prepare the frozen synthetic/de-identified inputs and machine-readable evidence-collection structures required to execute the already-approved Phase 20B evaluation methods later.

This slice creates **inputs and empty evidence structures only**. It creates no participant, SUS, accessibility or AI-quality result.

## Completed Phase 20B method design

- `20B-0/1` Ethics Gate + Master Evaluation Protocol — completed/merged via PR #35; gate remains blocked.
- `20B-2` Engineering Evidence Matrix — completed/merged via PR #36.
- `20B-3` Task-Based Usability Protocol — completed/merged via PR #37.
- `20B-4/6/7` SUS + selected accessibility + feature-specific AI rubrics — completed/merged via PR #38.

## Phase 20B-8 frozen inputs

Authoritative directory: `docs/evaluation/datasets/v1/`

### Resume

Four synthetic cases `RSM-01` through `RSM-04` now freeze the actual content-affecting application inputs:

- exact application-shaped `resume_content` with stable UUID identifiers;
- frozen Resume title/setup identity;
- exact `targetRole` and synthetic `jobDescription` analysis context;
- explicit omission of optional company context;
- execution-only `requestId` rule;
- current-version rule tied to the exact frozen content;
- known facts, prohibited inventions and expected-scope notes.

No real Resume or employment history is used.

### Interview

Four synthetic cases `INT-01` through `INT-04` freeze both AI paths used by the rubric.

Question generation freezes:

- exact session creation context: target role, experience level, focus topics, skill gaps, synthetic job description, mode and empty manual-question state;
- explicit omission of source Resume IDs;
- exact count, categories, difficulty mix, canonical question types and exact type counts;
- fresh execution-only request UUID rule;
- no Resume-version override.

Feedback freezes:

- exact feedback session context;
- one exact manual question with type, category, difficulty and question text;
- explicit omission of optional model answer;
- exact typed prepared answer.

This prevents hidden session/manual-question inputs from varying under the same case version.

### Grounded Learning

The frozen Learning scope remains:

- 2 text-based four-page synthetic PDFs with exact source-text mirrors and SHA-256 identifiers;
- 6 cases: 2 `ANSWERABLE_SINGLE`, 2 `ANSWERABLE_MULTI`, 2 `UNANSWERABLE`;
- exact application upload title per document;
- a fresh conversation for every case;
- the frozen question as the first user message so prior chat history is empty;
- fresh request UUID only as execution/idempotency metadata;
- preservation of the unchanged answer and every source/page reference presented by the application.

### Usability bindings

U1-U5 retain fixed synthetic starting-state bindings, including prepared Resume, Interview, Learning, flashcard and quiz state.

## Phase 20B-9 collection templates

Authoritative directory: `docs/evaluation/templates/v1/`

Frozen structures include:

- `usability_campaign_metadata.csv`;
- `usability_observations.csv` linked through `campaign_id`;
- `sus_responses.csv` linked to the same usability campaign through `campaign_id` while preserving raw items 1-10;
- `accessibility_campaign_metadata.csv`;
- `accessibility_checks.csv` with A-01 through A-29 linked through `campaign_id`;
- `ai_campaign_metadata.csv` for campaign-level AI execution/model/dataset/configuration identity;
- `ai_resume_scoring.csv` linked through `campaign_id`;
- `ai_interview_questions_scoring.csv` for per-question IQ-01 to IQ-03, linked through `campaign_id`;
- `ai_interview_question_sets_scoring.csv` for set-level IQ-04 and IQ-05, linked through `campaign_id`;
- `ai_interview_feedback_scoring.csv` linked through `campaign_id`;
- `ai_learning_grounded_qa_scoring.csv` for answer-level LQ-01/LQ-03/LQ-04 and unsupported-claim evidence, linked through `campaign_id`;
- `ai_learning_grounded_qa_citations.csv` for one raw row per presented source/page reference and its `CORRECT / INCORRECT / UNVERIFIABLE` classification, linked through `campaign_id`;
- `docs/evaluation/INTERVIEW_AI_EVALUATION_EXECUTION_PROCEDURE.md` defining the supported authenticated API path for reproducing the complete frozen Interview payloads.

Grounded Learning citation totals are not pre-aggregated in Task 9. Later Phase 20B-10 analysis must derive citation counts/rates from the raw citation rows.

Static case/check identifiers are pre-populated only where useful. Participant responses, observations, campaign metadata values, AI outputs, accessibility results and rubric scores remain blank.

## PR #39 review history

PR #39 was initially qualified at `e47d3156f235606f8e93f174685efedc984be9a2`.

### Review round 1

Four Codex P2 findings were found before merge:

1. raw `git diff --check` treated generated PDF internals as line-oriented text;
2. usability observations lacked campaign-level reproducibility metadata;
3. accessibility checks lacked campaign-level environment metadata;
4. Interview scoring mixed per-question IQ-01 to IQ-03 with set-level IQ-04/IQ-05.

They were repaired and locally requalified at `dbb9fff75fd30098148889e03b91c5063c95de04`.

### Review round 2

A fresh exact-head review found:

5. Interview question generation did not freeze exact count/category/difficulty/type-distribution inputs;
6. SUS responses were not linked to usability campaign metadata.

They were repaired and locally requalified at `096cbc6a33a1e16183a29aa526b842ce85fe6f00`.

### Review round 3 and comprehensive repair

A fresh exact-head review at `096cbc6a33a1e16183a29aa526b842ce85fe6f00` found:

7. remaining Interview session/manual-question inputs could still vary and affect generation/feedback prompts;
8. Grounded Learning stored only aggregate citation counts instead of the per-reference classifications required by the frozen rubric.

Before another review cycle, a bounded broader audit also identified adjacent reproducibility gaps in the synthetic evaluation pack:

- Resume cases should freeze the actual application-shaped Resume content and analysis request rather than only a simplified candidate description;
- Grounded Learning should freeze document title and empty prior-conversation state because both enter the integrated prompt path.

Those items were repaired and locally qualified at `6ad03fd24125e3f16feb8baf050663b3e3071ecf`.

### Review round 4 and final content repair

A fresh exact-head review at `6ad03fd24125e3f16feb8baf050663b3e3071ecf` found:

9. the frozen Interview payloads needed a documented executable path because the integrated frontend helpers do not expose every frozen content-affecting field;
10. AI scoring rows needed campaign-level execution metadata linkage.

The final content repair added the supported authenticated Interview API execution procedure plus `ai_campaign_metadata.csv` and `campaign_id` linkage across the Resume, Interview and Grounded Learning AI evidence tables.

The user then ran the bounded final local verification at exact head `8e4810fe70f19194554bdb812e888a75c08aec1d`. It passed:

- exact HEAD matched `8e4810fe70f19194554bdb812e888a75c08aec1d`;
- `ai_campaign_metadata.csv` structure passed;
- all six AI evidence CSVs preserved `campaign_id` linkage;
- Interview feedback rubric field remained `answer_relevance`;
- the authenticated Interview API procedure contained the required session/generation/feedback/job-polling routes;
- the non-documentation change check produced no output;
- the text-file `git diff --check` produced no output with PDFs excluded;
- final working tree was clean.

A subsequent Codex review of that exact qualified head found only that this controlling status/roadmap had not yet been updated to record the successful qualification. The current bookkeeping-only repair addresses that stale status record and does not change any dataset, template, executable procedure, product code, test, configuration or runtime behavior.

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

No evaluation campaign is run on this branch.

Not authorized:

- populating templates with real or claimed results;
- formal execution of the 29 accessibility checks;
- generating/scoring formal Resume, Interview or Learning AI campaign outputs;
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

- Phase 20B-8/9 — `ACTIVE / PR #39 CONTENT LOCALLY QUALIFIED AT 8e4810fe70f19194554bdb812e888a75c08aec1d / FINAL BOOKKEEPING REPAIR`
- Phase 20B-5 — `BLOCKED / NOT AUTHORIZED`
- Evaluation campaigns — `NOT AUTHORIZED`
- Phase 20B-10 Results Analysis — `PLANNED / NOT AUTHORIZED`
- Phase 20B-11 Final O7 Evidence Record — `PLANNED / NOT AUTHORIZED`
- Phase 20C Final Screenshots & Technical Evidence — `PLANNED / INACTIVE`
- Phase 20D Report Evidence Pack — `PLANNED / INACTIVE`
- Phase 20E Viva / Demonstration Preparation — `PLANNED / INACTIVE`

## Completion gate for Phase 20B-8/9

The comprehensive evaluation-pack content was locally qualified at `8e4810fe70f19194554bdb812e888a75c08aec1d`. Because the current change is bookkeeping-only, the remaining final-head gate is intentionally narrow:

1. final working branch must still descend from `main @ 36a300ff7e35e60b560c5a722d566333ba82b06b`;
2. changes since `8e4810fe70f19194554bdb812e888a75c08aec1d` must be limited to `docs/planning/CURRENT_PHASE.md` and `docs/superpowers/plans/2026-08-16-phase-20b-university-evaluation-evidence.md`;
3. text `git diff --check` must pass;
4. final working tree must be clean;
5. the stale final review thread must be resolved after the bookkeeping head is verified;
6. merge requires a new separate approval for the exact bookkeeping head.

No application test rerun, PDF requalification, dataset/template rerun or new evaluation-framework review cycle is required for this bookkeeping-only status repair.

## Current approval boundary

The user has authorized:

`APPROVE FINAL PR39 BOOKKEEPING REPAIR`

That authorization covers only updating the two controlling planning/status documents to record the already-completed qualification at `8e4810fe70f19194554bdb812e888a75c08aec1d`.

The user's earlier merge approval for `8e4810fe70f19194554bdb812e888a75c08aec1d` is stale because this bookkeeping-only repair moves the PR head. A new exact-head merge approval is mandatory after the bookkeeping head is verified.
