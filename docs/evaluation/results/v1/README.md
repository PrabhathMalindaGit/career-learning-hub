# Phase 20B — Actual Permitted Evaluation Results

Status: `EXECUTION AUTHORIZED / RESULTS NOT YET COLLECTED`

This directory stores genuine Phase 20B non-participant evaluation evidence collected under the frozen version 1.0 protocols.

## Authorized campaigns

- Accessibility campaign: `CLH-ACC-001`
- AI campaign: `CLH-AI-001`

The AI campaign covers the frozen Resume, Interview and Grounded Learning cases.

## Ethics boundary

Participant-facing work remains blocked pending authoritative ethics/module guidance. This directory must not contain participant usability observations, SUS responses, participant demographics, recordings, real CVs, private participant documents or personal participant API keys.

## Data integrity rules

- Master templates under `docs/evaluation/templates/v1/` remain unchanged.
- Record only observations and outputs that were actually produced.
- Never replace a failure with an expected result.
- Use `NOT ASSESSED` or `INVALID_ENVIRONMENT` when the frozen method cannot be meaningfully executed.
- Preserve the first valid formal AI output; do not regenerate merely to improve a score.
- Do not modify product code during the evaluation campaign.
- Raw or derived evidence must contain no authentication token, cookie, API key, password or other secret.
- Phase 20B-10 aggregate analysis is separate and must not be invented in these raw result files.

## Current baseline

- Repository main identity when this campaign branch was created: `4f2a0dfbe07f31ed8163ff31e6bc662da5e4d6cd`
- Qualified executable checkpoint: `6b80f91d7016971d58ed9628e8818fabf00d1cd2`
- Dataset pack: `20B8-v1.0`
- Resume dataset: `20B8-resume-v1.0`
- Interview dataset: `20B8-interview-v1.0`
- Learning dataset: `20B8-learning-v1.0`
- Release-path model for AI evaluation: `gemini-3.6-flash`

## Execution order

1. Selected accessibility checks A-01 through A-29.
2. Resume AI cases RSM-01 through RSM-04.
3. Interview AI cases INT-01 through INT-04 — generated questions and prepared-answer feedback.
4. Grounded Learning cases LQ-A01 through LQ-B03.
5. Review the raw evidence before Phase 20B-10 results analysis.

Nothing in this directory is a result until an actual observation/output has been collected and recorded.