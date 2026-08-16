# Phase 20B-10 — Results Analysis

Status: `CURRENTLY PERMITTED NON-PARTICIPANT EVIDENCE ANALYSED / PARTICIPANT STREAM PENDING ETHICS`

Analysis date: `2026-08-17`

## 1. Purpose and scope

This record analyses the genuine Phase 20B evidence collected for Career Learning Hub under Objective O7 using the frozen version 1.0 evaluation methods.

The analysis covers the evidence streams that were permitted and actually executed:

- Stream A — existing qualified engineering functionality evidence;
- Stream C — selected accessibility evidence;
- Stream D — Resume AI, Interview AI and Grounded Learning AI output-quality evidence.

Stream B participant usability evidence and SUS are **not** analysed because participant-facing work remains blocked by `docs/evaluation/PHASE_20B_ETHICS_AND_PARTICIPANT_SAFETY_GATE.md` pending authoritative module or supervisor confirmation. No participant count, usability outcome, SUS score, participant preference or participant qualitative finding exists in this record.

This document distinguishes raw observations, derived calculations, interpretation and limitations. It does not convert rubric scores into a general AI accuracy percentage, selected accessibility checks into WCAG conformance, or engineering tests into participant usability evidence.

## 2. Evaluation identity

- Accessibility campaign: `CLH-ACC-001`
- AI campaign: `CLH-AI-001`
- Protocol/rubric version: `1.0`
- Qualified executable checkpoint: `6b80f91d7016971d58ed9628e8818fabf00d1cd2`
- Repository main identity when the actual-evaluation campaign branch was created: `4f2a0dfbe07f31ed8163ff31e6bc662da5e4d6cd`
- Dataset pack: `20B8-v1.0`
- Resume dataset: `20B8-resume-v1.0`
- Interview dataset: `20B8-interview-v1.0`
- Learning dataset: `20B8-learning-v1.0`
- AI model: `gemini-3.6-flash`
- AI execution channel: authenticated local backend API
- AI run policy: one formal output per frozen case/output unit; no best-of-N regeneration

## 3. Stream A — Engineering functionality evidence

### 3.1 Recorded qualified baseline

The frozen master evaluation protocol records the following qualification evidence for the executable checkpoint:

| Engineering check | Recorded result |
|---|---:|
| Root workspace production typecheck | PASS |
| Backend test-source typecheck | PASS |
| Backend unit suite | 223/223 PASS |
| Backend integration suite | 249/249 PASS |
| Backend security regression suite | 43/43 PASS |
| Complete backend suite | 515/515 PASS |
| Complete frontend suite | 1,170/1,170 PASS |
| Production frontend/backend builds | PASS |
| Non-overlapping complete-suite total | 1,685 PASS |

### 3.2 Interpretation

The recorded engineering evidence supports the bounded conclusion that the qualified executable passed the project's automated typecheck, build and regression-verification campaign under the recorded configuration.

It does **not** establish participant usability, full accessibility conformance, AI factual accuracy, production uptime/scalability, an independent penetration test, or production-security certification.

## 4. Stream C — Selected accessibility evidence

### 4.1 Raw result counts

The frozen accessibility campaign contained 29 selected checks.

| Result status | Count |
|---|---:|
| PASS | 29 |
| FAIL | 0 |
| NOT ASSESSED | 0 |
| Total | 29 |

Derived selected-check pass rate:

`29 / (29 + 0) = 100%`

This denominator includes only the 29 selected checks in protocol version 1.0. It is not a WCAG-conformance percentage.

### 4.2 Executed conditions

The campaign was recorded on Google Chrome `151.0.7922.138` on macOS `26.6.1 (25G76)`.

- baseline checks were performed at 100% zoom;
- A-19 through A-24 were performed at 200% Chrome zoom;
- A-25 through A-29 were performed at a reduced-width viewport of `390x844`;
- the exact desktop baseline viewport was not separately recorded.

### 4.3 Interpretation

Within the selected protocol scope, all tested keyboard/focus, labels/validation, status-feedback, 200%-zoom and reduced-width behaviours passed the frozen procedures as locally observed.

This is positive **selected accessibility evidence** for the evaluated critical workflows. It must not be reported as full WCAG certification or complete accessibility conformance.

### 4.4 Accessibility limitations

- The campaign was a selected 29-check evaluation rather than a complete WCAG audit.
- The observations were user/local evaluator observations rather than an independent specialist accessibility audit.
- The exact representative dialog name used for A-08 through A-10 was not recorded.
- The exact desktop baseline viewport was not separately recorded.
- Passing the selected checks does not establish accessibility behaviour for every route, state, assistive technology or browser/device combination.

## 5. Stream D1 — Resume AI output quality

### 5.1 Validity and rubric totals

All four frozen Resume cases produced a valid first formal output.

| Case | Rubric quality points / 10 | Fabrication flag |
|---|---:|---|
| RSM-01 | 10 | NONE |
| RSM-02 | 9 | MINOR_AMBIGUITY |
| RSM-03 | 8 | MINOR_AMBIGUITY |
| RSM-04 | 8 | MINOR_AMBIGUITY |

Derived rubric-quality summary:

- valid cases: `4/4`;
- invalid/not-run cases: `0`;
- total rubric quality points: `35/40`;
- mean rubric quality score: `8.75/10`;
- median rubric quality score: `8.5/10`;
- material fabrication flags: `0`;
- minor ambiguity flags: `3`;
- no-fabrication flags: `1`.

These are bounded rubric-quality scores, not AI accuracy percentages and not employer/ATS scores.

### 5.2 Criterion distribution

| Criterion | Score 2 | Score 1 | Score 0 |
|---|---:|---:|---:|
| R-01 Factual preservation | 1 | 3 | 0 |
| R-02 Target-role relevance | 4 | 0 | 0 |
| R-03 Actionability | 4 | 0 | 0 |
| R-04 Clarity | 4 | 0 | 0 |
| R-05 Internal consistency | 2 | 2 | 0 |

### 5.3 Interpretation

The Resume outputs were consistently role-relevant, actionable and clear across the four frozen synthetic cases. The main weakness was factual precision in rewritten suggestions: three cases contained minor unsupported implications, although none crossed the frozen threshold for material fabrication.

Two cases also showed partial internal-consistency issues where the output reported a capability as missing despite related evidence already being present in the supplied Resume.

The bounded evidence therefore supports describing the Resume assistance as useful on these frozen cases while retaining explicit verification/truthfulness controls around suggested rewrites.

## 6. Stream D2 — Interview AI output quality

### 6.1 Generated-question validity

Four frozen Interview cases each produced one six-question set, giving 24 scored generated questions. All question outputs were valid.

### 6.2 Per-question criterion distribution

| Criterion | Score 2 | Score 1 | Score 0 |
|---|---:|---:|---:|
| IQ-01 Role relevance | 24 | 0 | 0 |
| IQ-02 Experience-level appropriateness | 22 | 2 | 0 |
| IQ-03 Clarity | 24 | 0 | 0 |

The two partial experience-level scores were:

- INT-03 Q5 — wording around approving payment could imply authority beyond a generic entry-level Junior Accountant role;
- INT-04 Q1 — MCAR/MAR terminology was somewhat advanced for the frozen entry-level Junior Data Analyst context.

### 6.3 Question-set criteria

| Set-level criterion | Score 2 | Score 1 | Score 0 |
|---|---:|---:|---:|
| IQ-04 Useful coverage | 4 | 0 | 0 |
| IQ-05 Redundancy control | 4 | 0 | 0 |

Each six-question set covered all four frozen focus areas for its case without material duplicate/near-duplicate questions.

### 6.4 Feedback quality

All four prepared-answer feedback cases produced valid first formal outputs.

| Case | Feedback quality points / 10 |
|---|---:|
| INT-01 | 9 |
| INT-02 | 9 |
| INT-03 | 10 |
| INT-04 | 10 |

Derived feedback-quality summary:

- valid feedback cases: `4/4`;
- invalid/not-run cases: `0`;
- total feedback quality points: `38/40`;
- mean feedback quality score: `9.5/10`;
- median feedback quality score: `9.5/10`.

Criterion distribution:

| Criterion | Score 2 | Score 1 | Score 0 |
|---|---:|---:|---:|
| IF-01 Answer relevance | 4 | 0 | 0 |
| IF-02 Specificity | 4 | 0 | 0 |
| IF-03 Actionability | 2 | 2 | 0 |
| IF-04 Internal consistency | 4 | 0 | 0 |
| IF-05 Practice-only framing | 4 | 0 | 0 |

### 6.5 Interpretation

The generated Interview questions were consistently role-relevant and clear, and the four sets provided broad, non-redundant practice coverage. Two questions were judged usable but somewhat mismatched to entry-level scope.

Prepared-answer feedback was consistently relevant, specific, coherent and practice-only. The main limitation occurred in INT-01 and INT-02, where suggested examples included tools, technical causes or performance metrics that were not present in the frozen answer. Those examples are useful only when treated as prompts to add truthful detail, not as facts to insert automatically.

No Interview result is interpreted as hiring probability, employer scoring, candidate competence ground truth or executable coding correctness.

## 7. Stream D3 — Grounded Learning output quality

### 7.1 Case validity

All six frozen Grounded Learning cases produced valid first formal outputs:

- 2 `ANSWERABLE_SINGLE`;
- 2 `ANSWERABLE_MULTI`;
- 2 `UNANSWERABLE`.

Invalid/not-run cases: `0`.

### 7.2 Supported-answer metric

The frozen rubric defines the supported-answer rate over valid answerable cases only.

All four answerable cases received `LQ-01 = 2`.

`supported_answer_rate = 4 / 4 = 100%`

This is a result for the four frozen synthetic answerable cases only, not a general AI accuracy percentage.

### 7.3 Completeness metric

All four answerable cases received `LQ-03 = 2`.

`complete_answer_rate = 4 / 4 = 100%`

Both multi-source cases included all frozen required reference facts.

### 7.4 Citation/source correctness

Seven source-page references were produced across the eligible outputs and all seven were classified `CORRECT` against the frozen fixtures.

- CORRECT: `7`;
- INCORRECT: `0`;
- UNVERIFIABLE: `0`.

`citation_correctness_rate = 7 / (7 + 0) = 100%`

All four eligible answerable cases presented all frozen required correct source pages:

`cases_with_all_required_correct_sources = 4 / 4`

### 7.5 Unsupported-question handling

Both frozen `UNANSWERABLE` cases avoided inventing the requested unsupported information and received `LQ-04 = PASS`.

`abstention_handling_success_rate = 2 / 2 = 100%`

Unsupported-claim flags across all six cases:

- NONE: `6`;
- MINOR_UNSUPPORTED_EXTENSION: `0`;
- MATERIAL_UNSUPPORTED_CLAIM: `0`.

### 7.6 Interpretation

On the six frozen synthetic documents/questions, the Grounded Learning feature returned fully supported and complete answers for the answerable cases, exposed the expected correct source pages, and correctly handled both unsupported questions without inventing a substantive answer.

This is strong evidence for the implemented lexical/source-grounded workflow under the frozen fixture set. It does not establish that every future answer or citation is guaranteed correct, does not establish performance on arbitrary real-world documents, and must not be described as vector/embedding retrieval unless separately evidenced by the implementation.

## 8. Cross-stream findings

Across the currently permitted non-participant evaluation campaign:

1. the selected accessibility campaign completed all 29 frozen checks with 29 PASS results;
2. all 18 planned formal AI case/output units produced valid first outputs: 4 Resume analyses, 4 Interview generated-question sets, 4 Interview feedback outputs and 6 Grounded Learning answers;
3. Resume quality was strongest on relevance/actionability/clarity, with minor factual-precision and consistency weaknesses in three cases;
4. Interview generation showed strong role relevance, clarity, coverage and redundancy control, with two partial experience-level mismatches among 24 questions;
5. Interview feedback was strong overall, with two cases requiring caution that suggested examples must remain truth-checked rather than inserted as assumed experience;
6. Grounded Learning met all frozen answer-support, completeness, citation and unsupported-question expectations on the six synthetic cases;
7. no material unsupported/fabricated claim was recorded under the frozen Resume or Grounded Learning rubrics;
8. participant usability and SUS remain unavailable and must not be inferred from these non-participant results.

## 9. Limitations

The results must be interpreted with the following limitations:

- Resume, Interview and Learning evaluation sets are intentionally small, frozen and synthetic; they do not represent every candidate profile, interview context or document type.
- AI generation is nondeterministic. The frozen campaign intentionally captured one first valid formal output per case rather than estimating run-to-run variance.
- The AI campaign was executed in the recorded local development configuration using `gemini-3.6-flash`; results are tied to that executable/model/configuration identity.
- Grounded Learning evidence evaluates the implemented lexical/source-based retrieval workflow and synthetic four-page PDF fixtures, not arbitrary large-document or embedding/vector retrieval performance.
- Accessibility evidence covers selected critical behaviours rather than every WCAG success criterion, assistive technology, browser or device.
- Accessibility observations were local evaluator reports rather than an independent accessibility certification.
- No participant usability task results or SUS responses have been collected because the ethics/module gate remains blocked.
- Engineering regression evidence demonstrates tested behaviour at the qualified checkpoint; it is not a production reliability, scalability or independent security certification.

## 10. Objective O7 interpretation at this point

The evidence currently supports the following bounded statement:

> Career Learning Hub has qualified engineering functionality evidence, completed selected accessibility-oriented checks, and completed frozen synthetic AI-output-quality evaluation for Resume Studio, Interview Coach and Grounded Learning. The AI evaluations used feature-specific rubrics rather than a single accuracy measure. Participant usability and SUS evidence remain pending the unresolved ethics/module gate.

It does **not** yet support claiming that Objective O7 is fully closed if the final university evaluation requires participant usability/SUS evidence. Final O7 wording must depend on the documented outcome of the ethics/module decision.

## 11. Next gate

The next required action is to resolve the Phase 20B ethics/module condition for participant evaluation.

- If participant evaluation is authorized, execute the already frozen usability and SUS procedures under the recorded conditions, then analyse those genuine results before the final O7 evidence record.
- If participant evaluation is not authorized or cannot be completed within the project constraints, record that limitation transparently and do not invent usability/SUS results.

After that decision and any permitted participant evidence are resolved, proceed to Phase 20B-11 — Final O7 Evidence Record and integration gate.
