# Phase 20B-8 - Frozen Synthetic Evaluation Inputs

Version: `20B8-v1.0`

Status: `FROZEN SYNTHETIC/DE-IDENTIFIED INPUTS / NO RESULTS`

This directory contains the smallest frozen input set needed to execute the approved Career Learning Hub evaluation methods later.

## Contents

- `resume_cases.json` - 4 synthetic Resume/target-role cases for the Resume AI rubric.
- `interview_cases.json` - 4 synthetic role contexts with prepared answers for Interview question/feedback evaluation. Each case also freezes the exact content-affecting question-generation request: count, categories, difficulty mix, canonical question types and exact type counts. `requestId` is generated fresh per execution and `resumeVersionId` is omitted, so neither is treated as an evaluation variable.
- `usability_fixture_bindings.json` - repeatable synthetic starting states for U1-U5.
- `learning/learning_cases.json` - 6 Grounded Learning cases: 2 single-source, 2 multi-source and 2 unanswerable.
- `learning/*.pdf` - 2 text-based synthetic four-page PDFs with stable page-level facts.
- `learning/*.txt` - exact source-text mirrors for human checking.
- `dataset_manifest.json` - dataset versions, base/executable identity and PDF SHA-256 values.

## Privacy and ethics boundary

All content is fictional. Do not replace these fixtures with real participant resumes, employment histories, private study documents or personal API keys. The participant ethics gate remains blocked; creating synthetic fixtures does not authorize recruitment, participant sessions, SUS administration, recordings or participant-derived data collection.

## Freeze rule

After formal scoring or participant execution begins, material fixture changes require a new version. Results must remain associated with the version actually used. AI outputs are not frozen; later AI evaluation must record executable checkpoint, model identity, case version and captured output reference.

Nothing in this directory is an evaluation result.
