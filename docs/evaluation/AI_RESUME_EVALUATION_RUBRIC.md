# Phase 20B-7A — Resume AI Output Quality Rubric

## 1. Purpose

This document freezes the evaluation rubric for AI-assisted Resume assessment/recommendation output in Career Learning Hub under Objective O7.

It defines how later frozen synthetic/de-identified Resume cases will be scored. It contains **no AI evaluation results** and does not authorize dataset creation or campaign execution.

## 2. Rubric identity and status

- Rubric: `PHASE 20B-7A — RESUME AI OUTPUT QUALITY RUBRIC`
- Version: `1.0`
- Status: `FROZEN METHOD DESIGN / NO OUTPUTS SCORED`
- Phase 20B evidence stream: `D — FEATURE-SPECIFIC AI-OUTPUT-QUALITY EVIDENCE`
- Branch base: `main @ 7142e6dde8281db1852d365989f25c4d10e5265b`
- Current qualified executable checkpoint: `6b80f91d7016971d58ed9628e8818fabf00d1cd2`
- Current release-path Gemini model to record when evaluation is later run: `gemini-3.6-flash`
- Master protocol: `docs/evaluation/PHASE_20B_UNIVERSITY_EVALUATION_PROTOCOL.md`

## 3. Evaluation question

> For frozen synthetic/de-identified Resume cases, how well do Career Learning Hub's AI-assisted assessment/recommendation outputs preserve supplied facts, remain relevant to the target context, and provide clear, actionable, internally consistent guidance?

This is not an employer ATS-equivalence test and not a hiring-outcome prediction.

## 4. Required later case structure

Phase 20B-8 will create the frozen cases. Each evaluable case must eventually identify at least:

```text
case_id
case_version
resume_fixture_id
target_role_context_id
known_resume_facts
known_prohibited_inventions
expected_scope_notes
```

Cases must use synthetic/de-identified content only by default.

Do not use a real participant CV or private employment history for formal rubric scoring unless a later approved protocol explicitly permits it.

## 5. Unit of scoring

One scoring unit is one captured Resume AI output for one frozen Resume/context case under a recorded executable/model configuration.

Record at least:

```text
case_id
rubric_version
executable_checkpoint
model_identity
output_reference
factual_preservation
role_relevance
actionability
clarity
internal_consistency
fabrication_flag
rater_notes
```

Phase 20B-9 will later define the machine-readable template.

## 6. Ordinal scoring scale

Each rubric criterion uses exactly:

```text
0 — DOES NOT MEET
1 — PARTIALLY MEETS
2 — MEETS
```

### 0 — DOES NOT MEET

The output materially fails the criterion or contains a defect that makes the criterion unreliable for the case.

### 1 — PARTIALLY MEETS

The output satisfies part of the criterion but has meaningful omissions, vagueness or limited usefulness.

### 2 — MEETS

The output satisfies the criterion for the supplied case without material deficiency under this rubric.

Do not invent half-points.

## 7. Criterion R-01 — Factual preservation

### Question

Does the output remain faithful to the supplied Resume facts and avoid unsupported candidate claims?

### Score 2

- No substantive candidate fact is invented or contradicted.
- Recommendations are framed as suggestions rather than assertions that unsupported experience/skills already exist.
- Existing dates, roles, qualifications, metrics and responsibilities are not materially misrepresented.

### Score 1

- Core facts remain intact, but the output introduces ambiguous wording or a minor unsupported implication that does not materially change the candidate profile.
- Or it omits important supplied context while not directly inventing a substantive fact.

### Score 0

Any material factual invention or contradiction is present, for example:

- inventing an employer, qualification, certification, project, skill, achievement or numeric result;
- changing supplied dates/role level in a material way;
- presenting an unsupported achievement as an existing fact.

## 8. Fabrication flag

Record separately:

```text
NONE
MINOR_AMBIGUITY
MATERIAL_FABRICATION
```

`MATERIAL_FABRICATION` requires `R-01 factual_preservation = 0`.

Do not hide a fabrication inside an average score.

## 9. Criterion R-02 — Target-role relevance

### Question

Is the assessment/recommendation relevant to the supplied target-role/job context and the actual Resume content?

### Score 2

Recommendations clearly connect the supplied Resume to the target context and prioritize relevant gaps/strengths without drifting into unrelated advice.

### Score 1

Advice is generally relevant but generic, weakly prioritized, or only partially connected to the supplied target context.

### Score 0

Advice is substantially unrelated to the target context, contradicts it, or focuses on information not supported by the supplied case.

## 10. Criterion R-03 — Actionability

### Question

Does the output give concrete, feasible improvement guidance that the user can act on while preserving factual truth?

### Score 2

Guidance identifies specific improvements such as wording, structure, evidence emphasis or clarification and makes clear what the user could change.

### Score 1

Some usable direction is present, but important recommendations are vague, repetitive or not specific enough to implement confidently.

### Score 0

Guidance is largely non-actionable, misleading, contradictory, or depends on fabricating experience/credentials.

## 11. Criterion R-04 — Clarity

### Question

Is the output understandable, appropriately structured and sufficiently specific for a Resume user?

### Score 2

The main findings and recommended actions are clear, concise enough to follow, and use understandable language.

### Score 1

Meaning is recoverable, but wording is unnecessarily vague, repetitive, dense or inconsistently organized.

### Score 0

The output is materially confusing, self-contradictory, or too unclear to guide a reasonable user.

## 12. Criterion R-05 — Internal consistency

### Question

Do the assessment, score/reasoning and recommendations agree with each other and with the supplied Resume/context?

### Score 2

No material contradiction appears between identified strengths, weaknesses, scoring language and recommendations.

### Score 1

Minor tension or duplication exists, but the overall recommendation remains interpretable.

### Score 0

Material contradictions make the evaluation unreliable, such as praising and penalizing the same supplied evidence without a coherent distinction.

## 13. Per-output summary

For each output, preserve the five individual criterion scores.

A bounded rubric total may also be calculated:

```text
resume_quality_points = R01 + R02 + R03 + R04 + R05
maximum = 10
```

If reported, call this a **rubric quality score**, not `AI accuracy` and not a percentage of truth.

Never allow a high total to erase a `MATERIAL_FABRICATION` flag.

## 14. Campaign-level reporting

After actual outputs are scored, report at minimum:

- number of frozen cases evaluated;
- protocol/rubric/case versions;
- model/executable identity;
- distribution or mean/median for each criterion separately;
- count of outputs with `MATERIAL_FABRICATION`;
- count of invalid/not-run cases separately;
- limitations, including synthetic-case coverage and model nondeterminism.

If multiple runs per case are later used, the number of runs and aggregation rule must be frozen before execution. Do not silently select only the best output.

## 15. Invalid/not-run handling

Use:

```text
VALID
INVALID_ENVIRONMENT
NOT_RUN
```

An unavailable model/service or missing frozen fixture that prevents a meaningful output is `INVALID_ENVIRONMENT`, not an AI-quality score of zero.

Do not fabricate output/rubric values for invalid or not-run cases.

## 16. Rater procedure

The evaluator must:

1. read the frozen Resume facts and target context before rating;
2. compare every substantive AI claim against supplied case evidence;
3. score each criterion independently before considering any total;
4. record concise evidence for any score `0` and any fabrication flag;
5. avoid rewarding persuasive wording when factual preservation is poor;
6. avoid introducing employer/hiring assumptions not present in the case;
7. preserve the original captured output reference.

## 17. Claim boundaries

Allowed bounded statement after real results exist:

> Resume AI outputs were evaluated on frozen synthetic/de-identified cases using separate factual-preservation, target-relevance, actionability, clarity and consistency criteria, with material fabrication tracked explicitly.

Do not claim from this rubric that:

- the Resume score is equivalent to an employer ATS score;
- the application predicts hiring probability;
- the AI guarantees a better Resume or employment outcome;
- a rubric total is an AI factual-accuracy percentage;
- outputs are universally suitable for every occupation.

## 18. Change control

After the first formal output is scored, do not change criterion definitions or thresholds to improve results.

Material rubric changes require a new version and results must remain associated with the version used.

## 19. Completion condition for this method design

The Resume rubric design is complete when:

1. case inputs are defined at the schema level without creating cases;
2. the `0/1/2` scale is frozen;
3. all five criteria are operationally defined;
4. material fabrication is separately tracked;
5. campaign reporting and invalid handling are explicit;
6. claim boundaries prevent ATS/hiring/accuracy overstatement;
7. no AI result is invented.