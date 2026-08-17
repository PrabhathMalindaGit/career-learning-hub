# Phase 20B-11 — Final Objective O7 Evidence Record

Status: `COMPLETE FOR RECORDED EVALUATION SCOPE / READY FOR PHASE 20C`

Record date: `2026-08-17`

## 1. Purpose

This is the final Phase 20B evidence record for Objective O7 of Career Learning Hub. It consolidates the genuine evaluation evidence already collected and analysed without changing the frozen methods or inventing missing results.

Objective O7 concerns evaluation of functionality, usability, accessibility and AI-assisted output quality. The completed evidence provides direct engineering, selected-accessibility and feature-specific AI-quality results. A formal participant usability/SUS study was not conducted, so no participant usability score, SUS score or participant finding is claimed. That absence is retained as an explicit evaluation limitation rather than being replaced with fabricated data.

## 2. Evidence identity

- Qualified executable checkpoint: `6b80f91d7016971d58ed9628e8818fabf00d1cd2`
- Repository main identity when the actual-evaluation branch was created: `4f2a0dfbe07f31ed8163ff31e6bc662da5e4d6cd`
- Evaluation protocol/rubric version: `1.0`
- Accessibility campaign: `CLH-ACC-001`
- AI campaign: `CLH-AI-001`
- Dataset pack: `20B8-v1.0`
- Resume dataset: `20B8-resume-v1.0`
- Interview dataset: `20B8-interview-v1.0`
- Learning dataset: `20B8-learning-v1.0`
- Evaluated AI model: `gemini-3.6-flash`
- AI execution policy: one first valid formal output per frozen case/output unit; no best-of-N regeneration

## 3. Objective O7 coverage matrix

| O7 evaluation area | Evidence completed | Final evidence position |
|---|---|---|
| Functionality / technical reliability | Qualified typecheck, build and automated regression evidence | Supported for the recorded executable and test conditions |
| Usability | No formal participant usability/SUS study conducted | Not quantitatively claimed; retained as a limitation |
| Accessibility | 29 frozen selected checks completed | 29/29 PASS within the selected protocol scope; not full WCAG conformance |
| Resume AI output quality | 4 frozen synthetic cases completed and scored | 4/4 VALID; 35/40 rubric points; no material fabrication |
| Interview AI question quality | 4 six-question sets / 24 questions completed and scored | 24/24 role-relevant and clear; 22/24 fully experience-level appropriate; all four sets had full coverage/redundancy scores |
| Interview AI feedback quality | 4 prepared-answer feedback cases completed and scored | 4/4 VALID; 38/40 rubric points |
| Grounded Learning AI quality | 6 frozen synthetic document cases completed and scored | 6/6 VALID; all answerable cases supported/complete; all produced citation-page references correct; both unanswerable cases handled successfully |

## 4. Functionality evidence

The qualified executable evidence records:

- root workspace production typecheck: `PASS`;
- backend test-source typecheck: `PASS`;
- backend unit suite: `223/223 PASS`;
- backend integration suite: `249/249 PASS`;
- backend security regression suite: `43/43 PASS`;
- complete backend suite: `515/515 PASS`;
- complete frontend suite: `1,170/1,170 PASS`;
- production frontend/backend builds: `PASS`;
- non-overlapping complete-suite total: `1,685 PASS`.

This supports a bounded claim that the qualified artefact passed the project's recorded engineering verification campaign. It is not a claim of production uptime, independent penetration testing, or universal correctness.

## 5. Selected accessibility evidence

The selected accessibility campaign produced:

- `PASS`: 29;
- `FAIL`: 0;
- `NOT ASSESSED`: 0.

Selected-check pass rate:

`29 / (29 + 0) = 100%`

The evaluated scope covered selected keyboard/focus, dialog/focus, labels/validation, status-feedback, 200% zoom and reduced-width behaviours across critical Career Learning Hub workflows.

Report-safe conclusion:

> All 29 selected accessibility checks passed under the recorded local evaluation conditions.

Required boundary:

> This was a selected accessibility evaluation and does not establish complete WCAG conformance or certification.

## 6. Resume AI evidence

All four frozen Resume cases produced valid first formal outputs.

| Case | Rubric quality points / 10 | Fabrication flag |
|---|---:|---|
| RSM-01 | 10 | NONE |
| RSM-02 | 9 | MINOR_AMBIGUITY |
| RSM-03 | 8 | MINOR_AMBIGUITY |
| RSM-04 | 8 | MINOR_AMBIGUITY |

Derived summary:

- valid cases: `4/4`;
- rubric points: `35/40`;
- mean rubric quality score: `8.75/10`;
- median rubric quality score: `8.5/10`;
- material fabrication flags: `0`;
- minor ambiguity flags: `3`.

Interpretation:

The frozen-case outputs were consistently relevant, actionable and clear. The principal weakness was minor unsupported implication in some rewritten suggestions and occasional internal-consistency issues. Suggested Resume rewrites therefore remain subject to user verification before adoption.

These values are rubric-quality scores, not general AI accuracy, ATS equivalence or hiring probability.

## 7. Interview AI evidence

### 7.1 Generated questions

Four frozen cases produced one six-question set each, giving 24 scored generated questions.

- role relevance score 2: `24/24`;
- clarity score 2: `24/24`;
- experience-level appropriateness score 2: `22/24`;
- experience-level appropriateness score 1: `2/24`;
- experience-level appropriateness score 0: `0/24`.

All four sets received full `2` scores for useful coverage and redundancy control.

Interpretation:

The generated sets were broadly role-relevant, clear, varied and non-redundant. Two questions were usable but somewhat mismatched to the frozen entry-level scope.

### 7.2 Prepared-answer feedback

| Case | Feedback quality points / 10 |
|---|---:|
| INT-01 | 9 |
| INT-02 | 9 |
| INT-03 | 10 |
| INT-04 | 10 |

Derived summary:

- valid feedback cases: `4/4`;
- rubric points: `38/40`;
- mean: `9.5/10`;
- median: `9.5/10`.

Interpretation:

Feedback was consistently relevant, specific, coherent and framed as practice guidance. In two cases, suggested examples required truth-checking because they introduced possible details not supplied by the prepared answer.

No Interview result is treated as an employer decision, hiring probability or objective measure of candidate competence.

## 8. Grounded Learning evidence

The six frozen Grounded Learning cases comprised:

- 2 `ANSWERABLE_SINGLE`;
- 2 `ANSWERABLE_MULTI`;
- 2 `UNANSWERABLE`.

All six were valid.

Derived results:

- supported-answer rate for answerable cases: `4/4 = 100%`;
- complete-answer rate for answerable cases: `4/4 = 100%`;
- produced citation-page references classified `CORRECT`: `7/7`;
- `INCORRECT`: `0`;
- `UNVERIFIABLE`: `0`;
- answerable cases with all required correct sources: `4/4`;
- unsupported-question handling: `2/2 PASS`;
- material unsupported claims: `0`.

Interpretation:

Within the frozen synthetic PDFs, the evaluated grounded answers matched the required reference facts, cited the expected source pages and correctly handled both unsupported questions without inventing the requested information.

These results apply only to the frozen synthetic cases and the implemented lexical/source-based retrieval path. They are not a general AI accuracy percentage and do not guarantee correctness on arbitrary documents.

## 9. Usability limitation

A formal participant usability study and SUS questionnaire were not conducted for the final recorded Phase 20B scope. Therefore:

- no participant count is claimed;
- no task-completion rate is claimed;
- no participant completion-time statistic is claimed;
- no SUS score is claimed;
- no participant preference percentage or qualitative participant finding is claimed.

The final report should state this directly as a limitation. Engineering verification, accessibility checks and AI-quality rubrics must not be relabelled as participant usability evidence.

## 10. Final report-safe O7 statements

The following bounded statements are supported by the recorded evidence:

1. Career Learning Hub's qualified executable passed the recorded project typecheck, build and automated regression-verification campaign, including 1,685 non-overlapping complete-suite tests.
2. All 29 selected accessibility checks passed under the recorded local conditions; this was not a complete WCAG audit.
3. Four frozen Resume AI cases were evaluated using a five-criterion rubric, producing 35/40 total rubric-quality points with no material fabrication flags.
4. Twenty-four generated Interview questions across four frozen role contexts were evaluated separately for role relevance, level appropriateness and clarity, while each question set was also evaluated for coverage and redundancy.
5. Four prepared-answer Interview feedback outputs produced 38/40 feedback rubric-quality points and remained practice-oriented rather than hiring-predictive.
6. Six frozen Grounded Learning cases were evaluated for documentary support, completeness, citation/source correctness and unsupported-question handling; all four answerable cases were supported and complete, all seven produced page references were correct, and both unanswerable cases were handled successfully.
7. Formal participant usability/SUS results were not collected and are not claimed.

## 11. Claims that remain unsupported

Do not state that:

- Career Learning Hub is fully WCAG compliant or certified;
- the AI is generally `X% accurate`;
- Resume scoring is equivalent to an employer ATS;
- Interview feedback predicts hiring or employment success;
- grounded answers are guaranteed true;
- the system guarantees learning improvement;
- participant usability or SUS results exist;
- the system is penetration-tested or production-security certified.

## 12. Evidence references

Primary Phase 20B evidence is stored under `docs/evaluation/results/v1/`.

Key records:

- `PHASE_20B_10_RESULTS_ANALYSIS.md`
- `accessibility/accessibility_campaign_metadata.csv`
- `accessibility/accessibility_checks.csv`
- `ai/ai_campaign_metadata.csv`
- `ai/ai_resume_scoring.csv`
- `ai/ai_interview_questions_scoring.csv`
- `ai/ai_interview_question_sets_scoring.csv`
- `ai/ai_interview_feedback_scoring.csv`
- `ai/ai_learning_grounded_qa_scoring.csv`
- `ai/ai_learning_grounded_qa_citations.csv`
- `ai/raw/resume/`
- `ai/raw/interview/`
- `ai/raw/learning/`

The frozen methods and datasets remain under `docs/evaluation/` and `docs/evaluation/datasets/v1/`.

## 13. Phase 20B-11 integration gate

The final O7 evidence record is accepted for the currently completed evaluation scope when all of the following are true:

- genuine permitted evaluation evidence has been collected and preserved;
- Phase 20B-10 analysis is reproducible from the recorded evidence;
- no participant/SUS result has been fabricated;
- no product code was changed as part of the evaluation-result campaign;
- no authentication secret or private participant data is stored in the evidence;
- limitations and claim boundaries are explicit.

These conditions are met by the recorded Phase 20B evidence.

**Phase 20B-11 status: `COMPLETE / READY TO PROCEED TO PHASE 20C — FINAL SCREENSHOTS & TECHNICAL EVIDENCE`.**

This status does not authorize deployment, branch deletion or merge by itself.