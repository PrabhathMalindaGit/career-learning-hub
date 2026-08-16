# Phase 20B-7B — Interview AI Output Quality Rubric

## 1. Purpose

This document freezes the evaluation rubric for AI-assisted Interview Coach outputs in Career Learning Hub under Objective O7.

It evaluates two distinct output types:

1. generated practice questions;
2. feedback on prepared practice answers.

This document contains **no AI evaluation results** and does not authorize case creation or campaign execution.

## 2. Rubric identity and status

- Rubric: `PHASE 20B-7B — INTERVIEW AI OUTPUT QUALITY RUBRIC`
- Version: `1.0`
- Status: `FROZEN METHOD DESIGN / NO OUTPUTS SCORED`
- Phase 20B evidence stream: `D — FEATURE-SPECIFIC AI-OUTPUT-QUALITY EVIDENCE`
- Branch base: `main @ 7142e6dde8281db1852d365989f25c4d10e5265b`
- Current qualified executable checkpoint: `6b80f91d7016971d58ed9628e8818fabf00d1cd2`
- Current release-path Gemini model to record when later executed: `gemini-3.6-flash`
- Master protocol: `docs/evaluation/PHASE_20B_UNIVERSITY_EVALUATION_PROTOCOL.md`

## 3. Evaluation questions

### Question-generation quality

> For frozen synthetic role/experience contexts, are generated practice questions relevant, appropriately challenging, clear, usefully varied and non-redundant?

### Feedback quality

> For frozen prepared practice answers, is AI feedback relevant to the submitted answer, specific, actionable, internally consistent and correctly framed as practice guidance rather than hiring prediction?

These are quality questions for an interview-practice tool. They do not measure real employer decisions or candidate employability.

## 4. Required later case structure

Phase 20B-8 will create frozen synthetic/de-identified cases. Each case must eventually identify, as applicable:

```text
case_id
case_version
role_context_id
experience_level
interview_type
prepared_question_context
prepared_answer_id
known_answer_content
expected_scope_notes
```

No real participant employment history is required for formal scoring.

## 5. Unit of scoring

### Question unit

One generated question, or one frozen generated question set when the criterion explicitly concerns coverage/redundancy across a set.

### Feedback unit

One captured feedback output corresponding to one frozen practice question + prepared answer case.

Record at least:

```text
case_id
rubric_version
output_type
executable_checkpoint
model_identity
output_reference
criterion_scores
invalidity_status
rater_notes
```

Phase 20B-9 will define the machine-readable template.

## 6. Ordinal scale

Every ordinal criterion uses:

```text
0 — DOES NOT MEET
1 — PARTIALLY MEETS
2 — MEETS
```

No half-points.

## 7. Question criterion IQ-01 — Role relevance

### Score 2

The question clearly relates to the supplied role/context or relevant transferable competencies for that role.

### Score 1

The question is broadly plausible but generic, weakly tied to the supplied role, or only partially relevant.

### Score 0

The question is materially unrelated, contradicts the supplied role context, or depends on unsupported candidate/employer assumptions.

## 8. Question criterion IQ-02 — Experience-level appropriateness

### Score 2

The question is suitable for the supplied experience level and does not assume materially more or less seniority than the case provides.

### Score 1

The level is somewhat mismatched but the question remains usable as practice.

### Score 0

The question is clearly inappropriate for the supplied level or requires experience not represented by the case.

## 9. Question criterion IQ-03 — Clarity

### Score 2

The question is understandable, focused and answerable as an interview-practice prompt.

### Score 1

The intended meaning can be understood but the wording is vague, compound, awkward or unnecessarily complex.

### Score 0

The question is materially confusing, self-contradictory or not reasonably answerable as written.

## 10. Question criterion IQ-04 — Useful coverage

Apply this criterion to the generated question set for a frozen case.

### Score 2

The set provides meaningful coverage across the intended interview scope without concentrating excessively on one narrow topic.

### Score 1

Coverage is usable but noticeably narrow or misses an important intended area.

### Score 0

Coverage is materially poor for the supplied context or the set is dominated by irrelevant topics.

## 11. Question criterion IQ-05 — Redundancy control

Apply this criterion to the generated question set.

### Score 2

Questions are materially distinct; minor thematic overlap does not make the set repetitive.

### Score 1

Some avoidable repetition exists but the set still offers multiple distinct practice opportunities.

### Score 0

The set contains substantial duplicate/near-duplicate questions that materially reduce useful practice coverage.

## 12. Question-set summary

Preserve individual criterion results.

A bounded question-set quality total may be calculated:

```text
question_quality_points = IQ01 + IQ02 + IQ03 + IQ04 + IQ05
maximum = 10
```

Call this a **question-set rubric quality score**, not an accuracy score and not a hiring-validity score.

## 13. Feedback criterion IF-01 — Relevance to submitted answer

### Score 2

Feedback clearly responds to the actual prepared answer content and identifies strengths/gaps grounded in what was submitted.

### Score 1

Feedback is partly connected to the answer but includes generic commentary or overlooks important answer content.

### Score 0

Feedback is materially disconnected from the submitted answer, attributes content that was not present, or evaluates a different issue.

## 14. Feedback criterion IF-02 — Specificity

### Score 2

Feedback identifies specific parts of the answer or specific improvements rather than relying on generic praise/criticism.

### Score 1

Some specific guidance is present but important advice remains broad or formulaic.

### Score 0

Feedback is almost entirely generic, vague, or too unspecific to diagnose the answer meaningfully.

## 15. Feedback criterion IF-03 — Actionability

### Score 2

The user can reasonably act on the feedback to improve a later practice answer, for example by adding evidence, structuring a response, clarifying reasoning or removing irrelevant content.

### Score 1

The feedback suggests a useful direction but lacks enough detail to implement confidently.

### Score 0

The feedback is non-actionable, misleading, contradictory or recommends unsupported fabrication.

## 16. Feedback criterion IF-04 — Internal consistency

### Score 2

The feedback's strengths, weaknesses and recommendations are mutually coherent and consistent with the submitted answer.

### Score 1

Minor tension or duplication exists but the main guidance remains interpretable.

### Score 0

Material contradictions make the feedback unreliable.

## 17. Feedback criterion IF-05 — Practice-only / non-hiring framing

### Score 2

Feedback stays within interview-practice guidance and does not claim to predict hiring, employer scoring or employment success.

### Score 1

The feedback is mostly practice-oriented but contains ambiguous evaluative wording that could be mistaken for employer/hiring ground truth.

### Score 0

The feedback materially claims or strongly implies hiring probability, employer decision, guaranteed interview success or equivalent real-world employment outcome.

## 18. Feedback summary

A bounded feedback quality total may be calculated:

```text
feedback_quality_points = IF01 + IF02 + IF03 + IF04 + IF05
maximum = 10
```

Keep question-generation and feedback totals separate. Do not combine them into one vague Interview AI accuracy value.

## 19. Coding-question boundary

Where Career Learning Hub presents coding questions/answers as text practice, this rubric evaluates clarity/relevance/practice usefulness only.

Do not claim compiler/runtime correctness unless a separate execution-based method is actually implemented and evaluated. Protocol version `1.0` does not add such a method.

## 20. Invalid/not-run handling

Use:

```text
VALID
INVALID_ENVIRONMENT
NOT_RUN
```

Examples of `INVALID_ENVIRONMENT` include unavailable model/service or missing frozen case state that prevents meaningful output capture.

Do not score a nonexistent output as zero merely because infrastructure failed.

## 21. Rater procedure

For each captured output:

1. read the frozen case context first;
2. score each criterion independently;
3. compare feedback claims against the actual prepared answer;
4. record concise evidence for criterion score `0`;
5. do not reward persuasive style when relevance or correctness-to-input is poor;
6. do not infer a real employer judgment;
7. preserve the original output reference and model/executable identity.

## 22. Campaign-level reporting

After actual outputs are scored, report separately for question generation and feedback:

- number of frozen cases/output units evaluated;
- rubric/case/model/executable versions;
- criterion-level distributions or mean/median values;
- count of invalid/not-run cases;
- major recurring failure themes supported by captured outputs;
- limitations, including synthetic cases and model nondeterminism.

If multiple generations per case are later used, freeze the number of runs and aggregation rule before execution. Do not cherry-pick only the strongest generation.

## 23. Claim boundaries

Allowed bounded statement after real results exist:

> Interview Coach AI outputs were evaluated on frozen synthetic practice cases using separate criteria for question relevance/appropriateness/clarity/coverage/redundancy and feedback relevance/specificity/actionability/consistency/practice-only framing.

Do not claim that:

- the Interview score predicts hiring;
- feedback represents an employer decision;
- the AI measures candidate competence objectively;
- a rubric score is a probability of interview success;
- textual coding feedback proves executable-code correctness;
- one rubric total represents overall AI accuracy.

## 24. Change control

After formal scoring begins, material criterion or threshold changes require a new rubric version. Preserve results under the version actually used.

## 25. Completion condition for this method design

The Interview rubric design is complete when:

1. question and feedback outputs are explicitly separated;
2. the `0/1/2` scale is frozen;
3. five question-quality criteria are operationally defined;
4. five feedback-quality criteria are operationally defined;
5. invalid handling and reporting are explicit;
6. hiring/coding claim boundaries are explicit;
7. no AI result is invented.