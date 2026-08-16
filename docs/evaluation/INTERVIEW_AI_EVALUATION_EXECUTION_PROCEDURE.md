# Phase 20B — Interview AI Evaluation Execution Procedure

Status: `FROZEN EXECUTION PROCEDURE / NO CAMPAIGN RUN`

This procedure defines the supported authenticated API sequence for later Interview AI evaluation. It exists because the integrated frontend helpers do not expose every frozen content-affecting field required by `docs/evaluation/datasets/v1/interview_cases.json`.

The procedure does **not** authorize campaign execution. Run it only after the relevant evaluation execution is separately authorized.

## Preconditions

- Use the qualified Career Learning Hub executable recorded for the AI campaign.
- Use the study-managed authenticated account for the campaign.
- Use the configured Gemini release-path model recorded in `ai_campaign_metadata.csv`.
- Do not commit authentication cookies, tokens, API keys or other secrets.
- Create a fresh Interview session for each frozen case/output unit.
- Preserve the first valid formal output. Do not regenerate merely to obtain a better score.

All routes below are authenticated backend routes under `/api/v1`. Authentication must use the same supported application session mechanism as the integrated application.

## A. Generated-question evaluation

For each `INT-*` case:

1. Read `question_generation_session_creation_input` from the frozen case.
2. `POST /api/v1/interview-sessions` with that object exactly.
   - Omit only the fields listed in `question_generation_session_omitted_optional_fields`.
   - Capture the returned `session._id` as `sessionId`.
3. Create a fresh UUID for the execution-only `requestId`.
4. `POST /api/v1/interview-sessions/{sessionId}/questions/generate` with:
   - the fresh `requestId`;
   - every field from `question_generation_request` exactly, including `count`, `categories`, `difficultyMix`, `questionTypes` and `typeCounts`;
   - omit `resumeVersionId` exactly as specified by the frozen case.
5. Capture the returned job ID.
6. Poll `GET /api/v1/jobs/{jobId}` until the job reaches a terminal state.
7. If the job completes, retrieve the generated set through `GET /api/v1/interview-sessions/{sessionId}/questions?page=1&limit=100` and preserve the unchanged generated questions as the formal output evidence.
8. Record the same `campaign_id` from `ai_campaign_metadata.csv` in both:
   - `ai_interview_questions_scoring.csv` for IQ-01 to IQ-03 per generated question;
   - `ai_interview_question_sets_scoring.csv` for IQ-04 and IQ-05 once for the complete set.
9. If the environment prevents a valid output, use the rubric-defined invalid/not-run status rather than silently regenerating or changing the case.

## B. Feedback evaluation

For each `INT-*` case:

1. Read `prepared_feedback_case.feedback_session_creation_input` from the frozen case.
2. `POST /api/v1/interview-sessions` with that object exactly.
   - This payload contains the single frozen `manualQuestions` entry used for feedback evaluation.
   - Omit only the fields listed in `feedback_session_omitted_optional_fields`.
   - Capture the returned `session._id` and the returned manual question ID.
3. Confirm that the created question matches the frozen question type, category, difficulty and question text. `modelAnswer` remains omitted exactly as specified by `feedback_manual_question_omitted_optional_fields`.
4. `POST /api/v1/interview-sessions/{sessionId}/questions/{questionId}/attempts` with `prepared_feedback_case.feedback_attempt_input` exactly.
5. Capture the returned attempt ID.
6. `POST /api/v1/interview-sessions/{sessionId}/attempts/{attemptId}/feedback`.
7. Capture the returned feedback job ID and poll `GET /api/v1/jobs/{jobId}` until terminal.
8. Retrieve the final attempt through `GET /api/v1/interview-sessions/{sessionId}/attempts/{attemptId}` and preserve the unchanged feedback as the formal output evidence.
9. Record the same `campaign_id` from `ai_campaign_metadata.csv` in `ai_interview_feedback_scoring.csv`.
10. If the environment prevents a valid output, use the rubric-defined invalid/not-run status rather than changing the frozen answer or rerunning for a preferred response.

## Reproducibility boundary

The backend routes are authoritative for this formal evaluation procedure because they accept the complete frozen payloads. The normal frontend workflow may still be used for ordinary product use, but it must not replace this procedure for formal scoring if it omits or transforms a frozen evaluation field.

Execution-only identifiers such as `requestId`, database IDs and job IDs may vary and must be captured as evidence where relevant; they are not evaluation variables. All content-affecting inputs remain fixed by the case file.

## Evidence linkage

Every formal Interview AI output must link to exactly one `campaign_id` in `docs/evaluation/templates/v1/ai_campaign_metadata.csv`. That campaign record preserves the evaluation date, executable identity, model/configuration identity, dataset versions, execution channel and non-secret application configuration needed to interpret the scores.
