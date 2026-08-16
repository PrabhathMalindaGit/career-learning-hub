# Phase 20B-8 - Frozen Synthetic Evaluation Inputs

Version: `20B8-v1.0`

Status: `FROZEN SYNTHETIC/DE-IDENTIFIED INPUTS / NO RESULTS`

This directory contains the smallest frozen input set needed to execute the approved Career Learning Hub evaluation methods later.

## Contents

- `resume_cases.json` - 4 synthetic Resume/target-role cases. Each case freezes the application-shaped `resume_content` with stable IDs and the content-affecting Resume analysis request (`targetRole`, frozen synthetic `jobDescription`, explicit optional-field omissions). `requestId` is generated fresh per execution and the evaluation uses the current version created from the exact frozen content.
- `interview_cases.json` - 4 synthetic role contexts with separate frozen inputs for question generation and prepared-answer feedback. Each case freezes session context (`targetRole`, `experienceLevel`, `focusTopics`, `skillGaps`, `jobDescription`, `mode`), source-resume omission rules, the exact question-generation request, and the manual-question/typed-answer fields used for feedback. Execution-only request IDs may vary only where documented.
- `usability_fixture_bindings.json` - repeatable synthetic starting states for U1-U5.
- `learning/learning_cases.json` - 6 Grounded Learning cases: 2 single-source, 2 multi-source and 2 unanswerable. The file also freezes each document's application upload title and requires a fresh conversation for every formal case so the frozen question is the first message and prior chat history is empty.
- `learning/*.pdf` - 2 text-based synthetic four-page PDFs with stable page-level facts.
- `learning/*.txt` - exact source-text mirrors for human checking.
- `dataset_manifest.json` - dataset versions, base/executable identity and PDF SHA-256 values.

## AI execution reproducibility

The frozen fields reflect the content-affecting inputs used by the current integrated application rather than an abstract prompt-only benchmark.

### Resume

Create the evaluation Resume from the exact `resume_content` in the selected `RSM-*` case. Analyze the current version using the frozen `analysis_request`. Do not add a company or other optional context when the case marks it omitted. A fresh UUID may be used only for the API idempotency `requestId`.

### Interview question generation

Create the session using the exact `question_generation_session_creation_input`, preserving the explicit source-resume omissions. Generate questions with the exact `question_generation_request`. A fresh request UUID is execution metadata only; do not alter count, categories, difficulty mix, question types, type counts or session context.

### Interview feedback

Create the feedback session using the exact `feedback_session_creation_input`, including its one prepared manual question. Respect the explicit omitted optional fields such as `modelAnswer`. Record the prepared typed attempt exactly as frozen before requesting feedback.

### Grounded Learning

Upload the exact frozen PDF under its `application_upload_title`, wait for ready processing state, and create a new conversation for every `LQ-*` case. The frozen question must be the first user message. Do not seed prior chat messages. Preserve the unchanged assistant answer and every source/page reference shown by the application for later rubric scoring.

## Privacy and ethics boundary

All content is fictional. Do not replace these fixtures with real participant resumes, employment histories, private study documents or personal API keys. The participant ethics gate remains blocked; creating synthetic fixtures does not authorize recruitment, participant sessions, SUS administration, recordings or participant-derived data collection.

## Freeze rule

No formal evaluation campaign has started, so the bounded PR #39 reproducibility repairs remain part of version `20B8-v1.0`. Once formal scoring or participant execution begins, material fixture changes require a new version. Results must remain associated with the version actually used.

For the primary AI evaluation campaign, do not regenerate outputs merely to obtain a better result. Preserve the original captured output reference. Environment-invalid executions must be reported under the rubric's invalid-status rules rather than silently replaced.

Nothing in this directory is an evaluation result.
