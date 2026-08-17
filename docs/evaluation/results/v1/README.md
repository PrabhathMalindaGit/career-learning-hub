# Phase 20B — Actual Permitted Evaluation Results

Status: `PHASE 20B-11 FINAL O7 EVIDENCE RECORD COMPLETE / READY FOR PHASE 20C`

This directory stores genuine Phase 20B non-participant evaluation evidence collected under the frozen version 1.0 protocols.

## Completed campaigns

- Accessibility campaign: `CLH-ACC-001`
- AI campaign: `CLH-AI-001`

The AI campaign covers the frozen Resume, Interview and Grounded Learning cases.

## Evaluation scope boundary

Formal participant usability and SUS were not conducted in the completed Phase 20B scope. No participant count, task-completion result, SUS score, participant preference or participant qualitative finding is claimed.

## Data integrity rules

- Master templates under `docs/evaluation/templates/v1/` remain unchanged.
- Record only observations and outputs that were actually produced.
- Never replace a failure with an expected result.
- Use `NOT ASSESSED` or `INVALID_ENVIRONMENT` when the frozen method cannot be meaningfully executed.
- Preserve the first valid formal AI output; do not regenerate merely to improve a score.
- Do not modify product code during the evaluation campaign.
- Raw or derived evidence must contain no authentication token, cookie, API key, password or other secret.
- Aggregate analysis and the final O7 record must remain reproducible from recorded evidence and must not invent participant evidence.

## Current baseline

- Repository main identity when this campaign branch was created: `4f2a0dfbe07f31ed8163ff31e6bc662da5e4d6cd`
- Qualified executable checkpoint: `6b80f91d7016971d58ed9628e8818fabf00d1cd2`
- Dataset pack: `20B8-v1.0`
- Resume dataset: `20B8-resume-v1.0`
- Interview dataset: `20B8-interview-v1.0`
- Learning dataset: `20B8-learning-v1.0`
- Release-path model for AI evaluation: `gemini-3.6-flash`

## Completed execution

1. Selected accessibility checks A-01 through A-29 — completed.
2. Resume AI cases RSM-01 through RSM-04 — completed and scored.
3. Interview AI cases INT-01 through INT-04 — generated questions and prepared-answer feedback completed and scored.
4. Grounded Learning cases LQ-A01 through LQ-B03 — completed and scored.
5. Phase 20B-10 aggregate results analysis — completed in `PHASE_20B_10_RESULTS_ANALYSIS.md`.
6. Phase 20B-11 final Objective O7 evidence record — completed in `PHASE_20B_11_FINAL_O7_EVIDENCE_RECORD.md`.

## Next phase

Proceed to **Phase 20C — Final Screenshots & Technical Evidence**.

Phase 20B-11 completion does not by itself authorize deployment, branch deletion or merge.