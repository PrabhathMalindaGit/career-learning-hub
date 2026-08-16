# Phase 20B-7C — Grounded Learning AI Output Quality Rubric

## 1. Purpose

This document freezes the evaluation rubric for document-grounded Learning Workspace AI outputs in Career Learning Hub under Objective O7.

The rubric is designed for later frozen synthetic text-based PDF cases with known page-level facts. It separates answer support, citation/source correctness, completeness and unsupported-question handling.

This document contains **no AI evaluation results** and does not authorize dataset creation or campaign execution.

## 2. Rubric identity and status

- Rubric: `PHASE 20B-7C — GROUNDED LEARNING AI OUTPUT QUALITY RUBRIC`
- Version: `1.0`
- Status: `FROZEN METHOD DESIGN / NO OUTPUTS SCORED`
- Phase 20B evidence stream: `D — FEATURE-SPECIFIC AI-OUTPUT-QUALITY EVIDENCE`
- Branch base: `main @ 7142e6dde8281db1852d365989f25c4d10e5265b`
- Current qualified executable checkpoint: `6b80f91d7016971d58ed9628e8818fabf00d1cd2`
- Current release-path Gemini model to record when later executed: `gemini-3.6-flash`
- Master protocol: `docs/evaluation/PHASE_20B_UNIVERSITY_EVALUATION_PROTOCOL.md`

## 3. Evaluation question

> For frozen synthetic document-grounded cases, does Career Learning Hub produce answers supported by the supplied document evidence, provide correct source/page references where expected, cover required reference facts, and handle unsupported questions without inventing answers?

Grounding/source references improve traceability. They do not guarantee that every generated statement is true.

## 4. Required later case types

Phase 20B-8 will create frozen cases using synthetic text-based PDFs with known page-level facts.

Every case must use one of these types:

```text
ANSWERABLE_SINGLE
ANSWERABLE_MULTI
UNANSWERABLE
```

### ANSWERABLE_SINGLE

The required answer can be supported from one known source/page region.

### ANSWERABLE_MULTI

A complete answer requires facts from two or more known source/page regions.

### UNANSWERABLE

The supplied document does not contain sufficient evidence to answer the question as asked.

## 5. Required later case schema

Each frozen case must eventually identify at least:

```text
case_id
case_version
document_fixture_id
question_text
case_type
reference_facts
reference_source_pages
acceptable_abstention_behavior
known_unsupported_claims
```

This rubric defines the schema only. Phase 20B-8 will create the actual cases separately.

## 6. Unit of scoring

One scoring unit is one captured Grounded Chat answer for one frozen case under a recorded executable/model configuration.

Record at least:

```text
case_id
rubric_version
executable_checkpoint
model_identity
output_reference
answer_support_score
citation_correctness_status
completeness_score
unsupported_handling_status
unsupported_claim_flag
rater_notes
```

Phase 20B-9 will later define the machine-readable template.

## 7. Answer support criterion LQ-01

Use:

```text
0 — UNSUPPORTED / CONTRADICTED
1 — PARTIALLY SUPPORTED
2 — SUPPORTED
```

### Score 2 — SUPPORTED

All substantive answer claims required for the response are supported by the frozen document evidence and do not materially contradict it.

### Score 1 — PARTIALLY SUPPORTED

The core answer has documentary support but includes a meaningful unsupported extension, overstatement or omission that weakens reliability without making the entire answer unsupported.

### Score 0 — UNSUPPORTED / CONTRADICTED

The core answer is not supported by the document, materially contradicts the known document facts, or presents unsupported content as though grounded in the source.

For `UNANSWERABLE` cases, a correct abstention/insufficient-evidence response may receive `2` for support because it correctly reflects the absence of supporting evidence.

## 8. Unsupported-claim flag

Record separately:

```text
NONE
MINOR_UNSUPPORTED_EXTENSION
MATERIAL_UNSUPPORTED_CLAIM
```

A `MATERIAL_UNSUPPORTED_CLAIM` requires `LQ-01 = 0`.

Do not hide material unsupported generation inside an average score.

## 9. Citation/source correctness criterion LQ-02

This criterion applies to each source/page reference presented as supporting evidence.

For every cited/source reference, classify:

```text
CORRECT
INCORRECT
UNVERIFIABLE
```

### CORRECT

The cited page/source region contains evidence that supports the associated substantive claim.

### INCORRECT

The cited page/source region does not support the associated claim, points to materially different content, or is wrong relative to the frozen document fixture.

### UNVERIFIABLE

The reference cannot be evaluated because required source/page information is missing or the captured application output does not expose enough reference identity.

Do not automatically mark an answer correct merely because it contains a citation.

## 10. Citation correctness metric

For cases where at least one verifiable source reference is expected and produced:

```text
citation_correctness_rate = CORRECT references / (CORRECT + INCORRECT references)
```

Report `UNVERIFIABLE` references separately and exclude them from that denominator.

Also report:

```text
cases_with_all_required_correct_sources / eligible_answerable_cases
```

only if Phase 20B-8 freezes which sources are required for each case.

## 11. Completeness criterion LQ-03

Use:

```text
0 — MATERIALLY INCOMPLETE
1 — PARTIALLY COMPLETE
2 — COMPLETE
```

### Score 2 — COMPLETE

The answer covers all required reference facts frozen for the case at an appropriate level of detail.

### Score 1 — PARTIALLY COMPLETE

The answer covers the main point but misses one or more relevant required facts or source components.

### Score 0 — MATERIALLY INCOMPLETE

The answer misses the core required information or answers only a minor fragment of the question.

For `UNANSWERABLE` cases, completeness is evaluated against the expected abstention/insufficient-evidence behaviour rather than invented content.

## 12. Unsupported-question handling criterion LQ-04

Apply primarily to `UNANSWERABLE` cases.

Use:

```text
PASS
FAIL
NOT_APPLICABLE
```

### PASS

The answer clearly indicates that the supplied document does not provide enough evidence to answer, asks for clarification where appropriate, or otherwise avoids inventing a substantive answer.

### FAIL

The answer provides a substantive unsupported answer as though it were grounded in the document.

### NOT_APPLICABLE

Use for `ANSWERABLE_SINGLE` and `ANSWERABLE_MULTI` cases unless the captured output introduces a separate unsupported-answer issue already tracked by LQ-01/unsupported-claim flag.

## 13. Supported-answer metric

For answerable cases only, define:

```text
supported_answer_rate = count(LQ01 = 2) / count(valid ANSWERABLE_SINGLE + ANSWERABLE_MULTI cases)
```

Do not include `UNANSWERABLE` cases in this denominator.

## 14. Completeness metric

For answerable cases only:

```text
complete_answer_rate = count(LQ03 = 2) / count(valid ANSWERABLE_SINGLE + ANSWERABLE_MULTI cases)
```

Report `LQ03 = 1` and `LQ03 = 0` counts separately where useful.

## 15. Unsupported-question handling metric

For `UNANSWERABLE` cases only:

```text
abstention_handling_success_rate = count(LQ04 = PASS) / count(valid UNANSWERABLE cases)
```

This metric is not a general AI accuracy percentage. It evaluates only the frozen unsupported-question cases.

## 16. Multi-source case requirement

For `ANSWERABLE_MULTI` cases, a response is not automatically complete because it cites one correct page.

The frozen case must define the required reference facts/source regions. Score completeness and source coverage against those requirements.

A response may therefore have:

- correct citations but incomplete coverage;
- complete-looking prose with an incorrect citation;
- partially supported content despite multiple citations.

Keep those dimensions separate.

## 17. Invalid/not-run handling

Use:

```text
VALID
INVALID_ENVIRONMENT
NOT_RUN
```

Examples of `INVALID_ENVIRONMENT` include:

- the prepared document was not processed correctly before evaluation;
- required extracted text/source mapping is unavailable due setup failure;
- the model/service is unavailable and no output is produced;
- the frozen fixture cannot be loaded.

Do not score infrastructure failure as AI-quality failure.

## 18. Rater procedure

For each output:

1. read the frozen question, case type, reference facts and reference source pages;
2. inspect the captured answer without editing it;
3. identify each substantive answer claim;
4. compare claims with the frozen document evidence;
5. verify each produced source/page reference against the known fixture;
6. score support and completeness independently;
7. apply unsupported-question handling for `UNANSWERABLE` cases;
8. record concise evidence for score `0`, `INCORRECT` citation, `FAIL` abstention or material unsupported claim;
9. preserve original output/model/executable identity.

## 19. Campaign-level reporting

After actual outputs are scored, report at minimum:

- number of valid cases by type;
- rubric/case/document/model/executable versions;
- supported-answer rate for answerable cases;
- complete-answer rate for answerable cases;
- citation correctness rate with denominator disclosed;
- number of `UNVERIFIABLE` source references separately;
- unsupported-question handling success rate for unanswerable cases;
- count of material unsupported claims;
- invalid/not-run cases;
- limitations, including lexical retrieval constraints, synthetic document coverage and model nondeterminism where applicable.

Do not combine these dimensions into one vague overall AI accuracy value.

## 20. Lexical retrieval / grounding boundary

Career Learning Hub's current grounded Learning evidence must be described according to the implemented retrieval behaviour. Do not relabel lexical/source-based retrieval as vector or embedding retrieval if that is not the implemented system.

The evaluation is of the actual integrated system, not an imagined retrieval architecture.

## 21. Claim boundaries

Allowed bounded statement after real evidence exists:

> Grounded Learning answers were evaluated on frozen synthetic documents using separate measures for documentary support, source/page correctness, reference-fact completeness and unsupported-question handling.

Do not claim that:

- grounded answers are guaranteed true;
- every citation proves the associated claim;
- the system uses vector/embedding retrieval unless separately evidenced;
- one metric is an overall AI accuracy percentage;
- successful answers prove learning improvement;
- synthetic cases establish performance on every real document type.

## 22. Change control

After formal scoring begins, do not change case-type definitions, scoring rules or metric denominators to improve results.

Material changes require a new rubric version. Preserve results under the version actually used.

## 23. Completion condition for this method design

The Grounded Learning rubric design is complete when:

1. answerable single, answerable multi and unanswerable case types are frozen;
2. support, citation correctness, completeness and unsupported handling are separately defined;
3. metric numerators/denominators are explicit;
4. invalid-environment handling is explicit;
5. material unsupported claims are tracked separately;
6. grounding/retrieval claim boundaries are explicit;
7. no AI result is invented.