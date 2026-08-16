# Current Execution Scope

## Current activity

- Activity: `PHASE 20B-8/9 — EVALUATION EXECUTION PACK`
- Status: `ACTIVE / PR #39 COMPREHENSIVE REPRODUCIBILITY REPAIR / AWAITING LOCAL REQUALIFICATION`
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
- `ai_resume_scoring.csv`;
- `ai_interview_questions_scoring.csv` for per-question IQ-01 to IQ-03;
- `ai_interview_question_sets_scoring.csv` for set-level IQ-04 and IQ-05;
- `ai_interview_feedback_scoring.csv`;
- `ai_learning_grounded_qa_scoring.csv` for answer-level LQ-01/LQ-03/LQ-04 and unsupported-claim evidence;
- `ai_learning_grounded_qa_citations.csv` for one raw row per presented source/page reference and its `CORRECT / INCORRECT / UNVERIFIABLE` classification.

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

The current comprehensive repair addresses all four points together. It remains inside `docs/` only and now requires a new local qualification at the final repaired head.

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

- Phase 20B-8/9 — `ACTIVE / PR #39 COMPREHENSIVE REPAIR / AWAITING LOCAL REQUALIFICATION`
- Phase 20B-5 — `BLOCKED / NOT AUTHORIZED`
- Evaluation campaigns — `NOT AUTHORIZED`
- Phase 20B-10 Results Analysis — `PLANNED / NOT AUTHORIZED`
- Phase 20B-11 Final O7 Evidence Record — `PLANNED / NOT AUTHORIZED`
- Phase 20C Final Screenshots & Technical Evidence — `PLANNED / INACTIVE`
- Phase 20D Report Evidence Pack — `PLANNED / INACTIVE`
- Phase 20E Viva / Demonstration Preparation — `PLANNED / INACTIVE`

## Completion gate for Phase 20B-8/9

Before a new merge approval:

1. working branch must descend from `main @ 36a300ff7e35e60b560c5a722d566333ba82b06b`;
2. all changed paths must remain under `docs/`;
3. all JSON inputs must parse;
4. Resume cases must contain exact application-shaped content, stable unique UUID IDs, exact analysis request context and explicit optional-field rules;
5. Interview cases must freeze complete session/generation/feedback content-affecting inputs and satisfy count/type-distribution invariants;
6. both Learning PDFs must match the frozen SHA-256 values and open as four-page, text-extractable documents;
7. Learning cases must freeze application upload title, fresh-conversation state and exact first question;
8. U1-U5 bindings must identify repeatable synthetic starting state;
9. CSV templates must contain no invented results;
10. SUS must preserve raw items 1-10 and link through `campaign_id`;
11. accessibility templates must preserve A-01 through A-29 and campaign linkage;
12. Interview question-unit and set-level scoring must remain separate;
13. Grounded Learning answer-level scoring and per-reference citation classifications must remain separate, with no pre-aggregated citation totals in Task 9;
14. `20B-5` and the ethics gate must remain unchanged;
15. `git diff --check origin/main...HEAD -- . ':(exclude,glob)**/*.pdf'` must pass locally for text changes;
16. final working tree must be clean;
17. no application test rerun is required while all changes remain under `docs/`;
18. addressed review threads may be resolved only after the repaired head is locally qualified;
19. a fresh Codex review must examine the exact qualified head;
20. merge requires a new separate exact-head approval after clean review verification.

The PDF-specific gate validates PDFs as documents rather than treating their binary syntax as line-oriented source text. No `.gitattributes` or product/configuration change is required for this evaluation-only slice.

## Current approval boundary

The user has authorized:

`APPROVE PHASE 20B-8/9 — EVALUATION EXECUTION PACK`

That authorization covers the bounded same-branch synthetic-input/template review repairs required to make Tasks 8/9 reproducible. It does not authorize evaluation execution or product changes.

All earlier exact-head merge approvals are stale because PR review repairs moved the branch. A new exact-head merge approval is mandatory after final local requalification and clean exact-head review verification.
