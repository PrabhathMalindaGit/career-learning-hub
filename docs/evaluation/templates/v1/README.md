# Phase 20B-9 - Evidence Collection Templates

Version: `20B9-templates-v1.0`

Status: `FROZEN EMPTY TEMPLATES / NO RESULTS`

These CSV files are collection structures only. Blank result fields are intentional.

## Files

- `usability_observations.csv` - Stream B U1-U5 task records.
- `sus_responses.csv` - standard 10-item raw SUS responses and score field.
- `accessibility_checks.csv` - A-01 through A-29 with static check identity and blank observation/result fields.
- `ai_resume_scoring.csv` - one blank row per frozen Resume case.
- `ai_interview_questions_scoring.csv` - one blank question-generation row per Interview case.
- `ai_interview_feedback_scoring.csv` - one blank feedback row per Interview case.
- `ai_learning_grounded_qa_scoring.csv` - one blank row per frozen Grounded Learning case.

## Data-entry rules

1. Never fabricate a skipped result.
2. Preserve participant-derived raw data only if later ethics/data-management approval permits it.
3. Use the validity/status values defined by the authoritative protocols/rubrics.
4. Do not overwrite raw observations to match expected outcomes.
5. Record executable/model/dataset/protocol versions where required.
6. Keep participant-derived raw data out of Git by default unless an approved procedure explicitly permits the relevant anonymized data class.
7. Derived statistics belong in later Phase 20B-10 analysis, not in these templates.

The CSVs contain no spreadsheet formulas. Later calculations must be reproducible from valid collected values and the frozen protocol formulas.

The participant ethics gate remains blocked. These templates do not authorize participant recruitment, participant sessions, SUS administration or participant-derived data collection.
