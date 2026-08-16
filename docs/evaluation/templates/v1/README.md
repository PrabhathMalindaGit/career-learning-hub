# Phase 20B-9 - Evidence Collection Templates

Version: `20B9-templates-v1.0`

Status: `FROZEN EMPTY TEMPLATES / NO RESULTS`

These CSV files are collection structures only. Blank result fields are intentional.

## Files

- `usability_campaign_metadata.csv` - one study/campaign-level reproducibility record containing the environment and baseline fields required by the usability protocol.
- `usability_observations.csv` - Stream B U1-U5 task records linked to `usability_campaign_metadata.csv` through `campaign_id`.
- `sus_responses.csv` - standard 10-item raw SUS responses and score field linked to the same usability campaign through `campaign_id`.
- `accessibility_campaign_metadata.csv` - one accessibility-campaign environment/baseline record containing the fields required by the accessibility protocol.
- `accessibility_checks.csv` - A-01 through A-29 linked to `accessibility_campaign_metadata.csv` through `campaign_id`, with blank observation/result fields.
- `ai_resume_scoring.csv` - one blank answer-level row per frozen Resume case.
- `ai_interview_questions_scoring.csv` - per-generated-question scoring rows for IQ-01 role relevance, IQ-02 experience-level appropriateness and IQ-03 clarity. Add one row per generated question and identify it with `question_unit_id` and `question_index`.
- `ai_interview_question_sets_scoring.csv` - one blank set-level row per frozen Interview case for IQ-04 useful coverage and IQ-05 redundancy control.
- `ai_interview_feedback_scoring.csv` - one blank feedback row per frozen Interview case.
- `ai_learning_grounded_qa_scoring.csv` - one blank answer-level row per frozen Grounded Learning case for support, completeness, unsupported-question handling and unsupported-claim status.
- `ai_learning_grounded_qa_citations.csv` - variable-length raw citation/source-reference evidence; add one row for every source/page reference presented by the application and classify it as `CORRECT`, `INCORRECT` or `UNVERIFIABLE` before any aggregate metric is calculated.

## Campaign metadata linkage

Before later execution, create a stable non-secret `campaign_id` in the appropriate campaign metadata CSV and use the same value on every associated observation/check/response row.

The usability campaign record preserves the protocol-required executable/repository identity, browser/version, device/viewport, zoom, date, fixture version, reset method, ethics reference and non-secret Gemini configuration identity. Both `usability_observations.csv` and `sus_responses.csv` must use that same `campaign_id` so task outcomes and SUS responses cannot be pooled across different executable/environment baselines.

The accessibility campaign record preserves the protocol-required executable checkpoint, date, browser/version, operating system, viewport, zoom level and fixture version.

The metadata CSVs are empty templates only; no campaign has been run in Phase 20B-9.

## Interview scoring units

The Interview rubric has two scoring units for generated questions:

- IQ-01 to IQ-03 apply to each generated question individually and belong in `ai_interview_questions_scoring.csv`;
- IQ-04 to IQ-05 apply to the complete generated question set and belong in `ai_interview_question_sets_scoring.csv`.

Do not collapse per-question and set-level scores into one ambiguous row. Any later derived summary belongs in Phase 20B-10 and must follow the frozen rubric.

## Grounded Learning citation evidence

The Grounded Learning rubric requires every source/page reference presented as supporting evidence to be classified separately.

For each captured Grounded Chat output:

1. preserve the original `output_reference` in the answer-level row;
2. add one `ai_learning_grounded_qa_citations.csv` row for each source/page reference presented by the application;
3. give each row a stable `citation_unit_id` and ordered `citation_index` within that output;
4. record the presented page in `presented_source_page`;
5. use `associated_claim_reference` to identify the answer claim supported by that reference when the captured output exposes a clear association; otherwise record a neutral whole-answer reference such as `GENERAL_SOURCE_REFERENCE` rather than inventing a claim-to-source mapping;
6. classify the reference exactly as `CORRECT`, `INCORRECT` or `UNVERIFIABLE` under the frozen rubric;
7. do not enter aggregate correct/incorrect/unverifiable counts in Phase 20B-9.

Citation totals and the rubric's citation-correctness denominator are derived later in Phase 20B-10 from these raw rows. This preserves the evidence needed to reproduce the classification rather than storing only totals.

## AI capture discipline

For the version `1.0` primary evaluation campaign, capture one formal output for each frozen case/output unit and do not regenerate merely to obtain a better result. If an execution cannot produce a usable output because the environment is invalid, record the rubric-defined invalid status rather than replacing it silently. Any separately authorized repeat campaign must preserve its own output references and must not overwrite the original evidence.

Resume runs must use the exact frozen application-shaped `resume_content` plus the frozen `analysis_request` in `resume_cases.json`. Interview generation and feedback runs must use the exact frozen session/request/manual-question/attempt fields in `interview_cases.json`. Grounded Learning runs must follow the frozen document title and fresh-conversation rules in `learning/learning_cases.json`.

## Data-entry rules

1. Never fabricate a skipped result.
2. Preserve participant-derived raw data only if later ethics/data-management approval permits it.
3. Use the validity/status values defined by the authoritative protocols/rubrics.
4. Do not overwrite raw observations to match expected outcomes.
5. Record executable/model/dataset/protocol versions where required.
6. Keep participant-derived raw data out of Git by default unless an approved procedure explicitly permits the relevant anonymized data class.
7. Derived statistics belong in later Phase 20B-10 analysis, not in these templates.
8. Campaign metadata must contain no secret Gemini/API values.
9. Original AI outputs and raw citation classifications must remain associated with the exact case/model/executable identity that produced them.

The CSVs contain no spreadsheet formulas. Later calculations must be reproducible from valid collected values and the frozen protocol formulas.

The participant ethics gate remains blocked. These templates do not authorize participant recruitment, participant sessions, SUS administration or participant-derived data collection.
