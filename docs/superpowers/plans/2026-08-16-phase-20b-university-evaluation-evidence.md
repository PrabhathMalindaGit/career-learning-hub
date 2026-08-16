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
`IMPLEMENTED / PR #39 OPEN / CONTENT LOCALLY QUALIFIED AT 8e4810fe70f19194554bdb812e888a75c08aec1d / FINAL BOOKKEEPING REPAIR`

Authoritative directory: `docs/evaluation/datasets/v1/`

Frozen scope:

- 4 synthetic Resume cases (`RSM-01` to `RSM-04`) using exact application-shaped Resume content with stable IDs and frozen analysis request context;
- 4 synthetic Interview cases (`INT-01` to `INT-04`) with full frozen question-generation session/request inputs and full frozen prepared-feedback session/manual-question/answer inputs;
- 2 text-based four-page Learning PDFs with exact source-text mirrors and frozen application upload titles;
- 6 Grounded Learning QA cases: 2 `ANSWERABLE_SINGLE`, 2 `ANSWERABLE_MULTI`, 2 `UNANSWERABLE`, each executed in a fresh conversation with the frozen question as the first message;
- U1-U5 repeatable usability fixture bindings.

Execution-only UUID/request identifiers may vary only where explicitly documented. Content-affecting values must not vary under the same case version.

Dataset identities and PDF SHA-256 values are recorded in `dataset_manifest.json`.

The two PDFs were rendered and visually inspected, and local qualification has repeatedly confirmed both as four-page, text-extractable PDFs through macOS PDFKit. No PDF content was changed by PR #39 review repair.

No AI output is generated or scored in Task 8.

### Task 9 — Evidence-collection templates
`IMPLEMENTED / PR #39 OPEN / CONTENT LOCALLY QUALIFIED AT 8e4810fe70f19194554bdb812e888a75c08aec1d / FINAL BOOKKEEPING REPAIR`

Authoritative directory: `docs/evaluation/templates/v1/`

Frozen structures:

- `usability_campaign_metadata.csv`;
- `usability_observations.csv` linked through `campaign_id`;
- `sus_responses.csv` linked to the same usability campaign through `campaign_id`;
- `accessibility_campaign_metadata.csv`;
- `accessibility_checks.csv` linked through `campaign_id`;
- `ai_campaign_metadata.csv` for campaign-level AI execution/model/dataset/configuration identity;
- `ai_resume_scoring.csv` linked through `campaign_id`;
- `ai_interview_questions_scoring.csv` for per-question IQ-01 to IQ-03, linked through `campaign_id`;
- `ai_interview_question_sets_scoring.csv` for set-level IQ-04 and IQ-05, linked through `campaign_id`;
- `ai_interview_feedback_scoring.csv` linked through `campaign_id`;
- `ai_learning_grounded_qa_scoring.csv` for answer-level support/completeness/unsupported handling, linked through `campaign_id`;
- `ai_learning_grounded_qa_citations.csv` for raw one-row-per-presented-reference citation classification, linked through `campaign_id`;
- `docs/evaluation/INTERVIEW_AI_EVALUATION_EXECUTION_PROCEDURE.md` defining the supported authenticated API path for reproducing the complete frozen Interview payloads.

For Grounded Learning, `CORRECT / INCORRECT / UNVERIFIABLE` classifications are preserved individually before any count/rate is derived. Aggregate citation metrics belong to later Phase 20B-10 analysis, not the Task 9 raw template.

Static case/check identifiers are pre-populated only where useful. Participant responses, observations, campaign metadata values, status values, AI outputs, accessibility results and AI rubric results remain blank.

### Task 10 — Conduct evaluation and analyse actual evidence
`PLANNED / NOT AUTHORIZED`

Participant work is blocked by Task 0 and Task 5. Accessibility/AI execution also requires separate authorization to run the frozen campaigns and populate evidence.

### Task 11 — Final O7 evidence record
`PLANNED / NOT AUTHORIZED`

Only after actual evidence exists, produce the final O7 results/evidence record with limitations and reproducible calculations.

## Dataset and evidence freeze rules

1. Stable case IDs and versions must be preserved once execution begins.
2. No formal execution has started, so bounded PR #39 reproducibility repairs remain within version `20B8-v1.0` / `20B9-templates-v1.0`.
3. After formal execution begins, material fixture/template changes require a new version and results must remain associated with the version used.
4. Original captured AI outputs must remain associated with model/executable/case identity.
5. Do not cherry-pick or regenerate AI outputs merely to improve a score.
6. Source/page facts in Learning cases are authoritative for the synthetic PDFs.
7. PDF hashes are recorded in the manifest.
8. No result may be pre-populated merely to demonstrate a template.
9. Resume AI runs must use the exact frozen Resume content and analysis request context.
10. Interview AI runs must use the exact frozen session/generation/feedback content-affecting fields; only documented execution-only IDs may vary.
11. Grounded Learning runs must use the exact frozen document title, a fresh conversation, and the frozen question as the first user message.
12. Every Grounded Learning source/page reference presented by the application must be preserved as a raw citation-classification row before aggregate citation metrics are derived.

## PR #39 review-repair record

PR #39 was opened after local qualification at exact head `e47d3156f235606f8e93f174685efedc984be9a2`.

### Review round 1

Four Codex P2 findings were found:

1. raw `git diff --check` treated generated PDF internals as line-oriented text;
2. usability observations lacked linked campaign-level reproducibility/environment metadata;
3. accessibility checks lacked linked campaign-level environment metadata;
4. Interview question scoring mixed per-question IQ-01 to IQ-03 with set-level IQ-04/IQ-05.

Those were repaired and locally requalified at `dbb9fff75fd30098148889e03b91c5063c95de04`.

### Review round 2

A fresh exact-head review found:

5. Interview generation did not freeze exact count/categories/difficulty/question types/type counts;
6. SUS responses lacked `campaign_id` linkage.

Those were repaired and locally requalified at `096cbc6a33a1e16183a29aa526b842ce85fe6f00`.

### Review round 3

A fresh exact-head review at `096cbc6a33a1e16183a29aa526b842ce85fe6f00` found:

7. Interview session/manual-question content-affecting fields were still not completely frozen for generation and feedback;
8. Grounded Learning stored citation classifications only as aggregate counts rather than per-reference evidence.

A bounded broader audit was performed before another review cycle. It also identified two adjacent reproducibility weaknesses:

- Resume cases were simplified descriptions rather than exact application `ResumeContent` plus analysis-request inputs;
- Grounded Learning did not explicitly freeze the application document title or empty prior-conversation history even though those enter the integrated AI path.

Those items were repaired and locally qualified at `6ad03fd24125e3f16feb8baf050663b3e3071ecf`.

### Review round 4 and final content repair

A fresh exact-head review at `6ad03fd24125e3f16feb8baf050663b3e3071ecf` found:

9. the frozen Interview payloads needed a documented executable path because the integrated frontend helpers do not expose every frozen content-affecting field;
10. AI scoring rows needed campaign-level execution metadata linkage.

The final content repair added the supported authenticated Interview API execution procedure plus `ai_campaign_metadata.csv` and `campaign_id` linkage across the Resume, Interview and Grounded Learning AI evidence tables.

The user then ran the bounded final local verification at exact head `8e4810fe70f19194554bdb812e888a75c08aec1d`. The following checks passed:

- exact HEAD matched;
- AI campaign metadata template structure;
- `campaign_id` linkage across all six AI evidence CSVs;
- Interview feedback rubric field `answer_relevance`;
- required authenticated Interview session/generation/feedback/job-polling route documentation;
- no changed paths outside `docs/`;
- text `git diff --check` with PDFs excluded;
- clean final working tree.

A fresh Codex review of that exact qualified head found only one remaining P2: the controlling status/roadmap still said local requalification was pending. The current authorized bookkeeping-only repair updates these two planning/status documents to record the already-completed qualification. It does not alter any evaluation fixture, template, execution procedure, product code, test, configuration or runtime behavior.

## Current qualification boundary

The comprehensive evaluation-pack content is qualified at `8e4810fe70f19194554bdb812e888a75c08aec1d`.

For the bookkeeping-only final head, the remaining verification is intentionally limited to:

- exact working-branch HEAD;
- merge base/ancestry against `origin/main`;
- changes since `8e4810fe70f19194554bdb812e888a75c08aec1d` limited to `docs/planning/CURRENT_PHASE.md` and this plan;
- text `git diff --check` produces no output;
- final working tree is clean.

No application test rerun, PDF requalification, dataset/template revalidation or another broad evaluation-framework audit is required for this bookkeeping-only status repair.

After that tiny verification, the stale final-review thread may be resolved and a new exact-head merge approval is required.

## Current authorization

Authorized:

- `APPROVE FINAL PR39 BOOKKEEPING REPAIR`;
- update only `docs/planning/CURRENT_PHASE.md` and this plan to record the already-completed qualification at `8e4810fe70f19194554bdb812e888a75c08aec1d`.

Not authorized:

- Task 5 participant/sample decisions;
- participant recruitment/data collection;
- SUS administration;
- accessibility/AI campaign execution or scoring;
- Task 10/11 results work;
- executable product changes;
- repository/product configuration changes;
- deployment;
- branch deletion.

The user's earlier merge approval for `8e4810fe70f19194554bdb812e888a75c08aec1d` is stale because this bookkeeping-only repair moves the PR head. A new exact-head merge approval is mandatory after the bookkeeping head is verified.
