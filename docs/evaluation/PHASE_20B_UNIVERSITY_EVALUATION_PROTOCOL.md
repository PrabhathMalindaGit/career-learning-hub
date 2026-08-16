# Phase 20B — University Evaluation Protocol

## 1. Purpose

This document is the authoritative master protocol for evaluating Career Learning Hub against Objective O7.

Objective O7 requires evaluation of:

1. functionality;
2. usability;
3. accessibility;
4. AI-assisted output quality.

These are different evidence questions. Phase 20B therefore separates them into distinct evidence streams rather than turning engineering pass counts into usability or AI-accuracy claims.

This protocol must be frozen before participant-facing data collection or formal AI-quality scoring begins.

## 2. Current evaluation status

At creation of this protocol:

- engineering verification is complete for the current qualified executable checkpoint;
- formal participant usability evaluation has not been completed;
- formal SUS results do not exist;
- a complete accessibility-conformance audit has not been completed;
- formal feature-specific AI-output-quality evaluation has not been completed;
- the participant ethics/module gate remains blocked pending authoritative confirmation;
- no Phase 20B participant or AI-quality result is claimed by this document.

## 3. Artefact identity and engineering baseline

### Current repository state

Phase 20B was branched from:

`main @ ed5268ce26a33bc33d00d12d15840a582b0c1d93`

PR #34 changed documentation only. The current qualified executable checkpoint remains:

`6b80f91d7016971d58ed9628e8818fabf00d1cd2`

### Fresh executable qualification already recorded

The existing qualification evidence records:

| Check | Result |
|---|---|
| Root workspace production typecheck | PASS |
| Backend test-source typecheck | PASS |
| Backend unit suite | 223/223 PASS |
| Backend integration suite | 249/249 PASS |
| Backend security regression suite | 43/43 PASS |
| Complete backend suite | 515/515 PASS |
| Complete frontend suite | 1,170/1,170 PASS |
| Production frontend/backend builds | PASS |
| Non-overlapping complete-suite total | 1,685 PASS |

This is engineering evidence of tested behaviour under the qualified configuration.

It is **not**:

- an AI factual-accuracy percentage;
- a participant usability score;
- a SUS score;
- complete WCAG-conformance evidence;
- an independent penetration test/security certification;
- a production uptime or scalability guarantee.

## 4. Evaluation evidence model

Phase 20B uses four evidence streams.

### Stream A — Engineering functionality evidence

**Question:** Does the implemented artefact behave correctly under the tested automated/manual engineering conditions?

Evidence includes:

- backend unit/integration/security/full-suite results;
- frontend complete-suite results;
- typechecks/builds;
- existing browser/human-QA evidence where applicable;
- ownership/private-file/job/validation regression evidence;
- exact executable/commit identity.

**Primary role in O7:** functionality and technical reliability evidence.

### Stream B — Participant usability evidence

**Question:** Can representative permitted participants understand and complete key Career Learning Hub workflows under a frozen study procedure?

Planned evidence includes:

- task completion status;
- completion time;
- recoverable task errors;
- assistance count;
- bounded qualitative observation notes;
- post-task/system SUS if permitted by the ethics/module gate.

**Primary role in O7:** usability evidence.

No participant count, sampling method, task result or SUS value is frozen or claimed at this stage.

### Stream C — Selected accessibility evidence

**Question:** Do selected critical workflows exhibit the accessibility-oriented behaviours chosen for the final evaluation?

Planned evidence includes selected checks for:

- keyboard-only interaction;
- visible focus;
- dialog/focus management;
- form labels and instructions;
- validation/error identification;
- status/error communication;
- 200% zoom and readable reflow;
- responsive/mobile navigation;
- critical Resume, Interview, Learning, Settings and authentication surfaces.

Allowed result labels:

```text
PASS
FAIL
NOT ASSESSED
```

**Primary role in O7:** selected accessibility evidence.

This stream must not be reported as full WCAG certification unless a complete justified conformance audit is separately designed and actually completed.

### Stream D — Feature-specific AI-output-quality evidence

**Question:** How useful, supported, relevant and appropriately bounded are AI-assisted outputs for the specific Career Learning Hub feature being tested?

The project uses separate rubrics for:

1. Resume assessment/recommendations;
2. Interview question/feedback quality;
3. document-grounded Learning/RAG quality.

**Primary role in O7:** AI-assisted output-quality evidence.

Do not combine these domains into one vague “AI accuracy” percentage.

## 5. Ethics and participant-safety dependency

All participant-facing Stream B work is blocked by:

`docs/evaluation/PHASE_20B_ETHICS_AND_PARTICIPANT_SAFETY_GATE.md`

Participant recruitment or data collection may begin only if that gate is marked:

`PASSED / PARTICIPANT EVALUATION MAY PROCEED UNDER RECORDED CONDITIONS`

The study must then follow every recorded consent, eligibility, recruitment, recording, storage, withdrawal, retention and publication condition.

## 6. Evaluation-design freeze rule

Before the first result is collected for a given stream, its detailed protocol must be frozen.

A frozen protocol must define, as applicable:

- evaluation question;
- participant/case eligibility;
- task/case IDs;
- exact inputs;
- success/scoring criteria;
- allowed result values;
- environment/model identity;
- data fields to record;
- timing/scoring calculation method;
- missing/invalid-data handling;
- stopping rule;
- privacy/data-management rule;
- claim boundaries.

Do not modify success/scoring criteria after seeing results merely to improve the outcome.

If a protocol must change materially after data collection begins, version the protocol and identify which results were collected under which version.

## 7. Usability evaluation — master design boundary

Detailed usability tasks are created in a later authorized protocol. The master method is fixed as follows.

### 7.1 Unit of observation

One permitted participant completes a defined task set using the same approved Career Learning Hub evaluation baseline and prepared demo/synthetic content.

### 7.2 Core task metrics

Each task record should contain, when permitted:

```text
participant_id
task_id
completion_status
time_seconds
recoverable_errors
assistance_count
observation_notes
```

### 7.3 Completion status

Later detailed usability protocol should freeze a small explicit scale such as:

```text
SUCCESS
PARTIAL
FAILED
```

The detailed protocol must define what each label means for every task before the first session.

### 7.4 Timing

Use one consistent timing convention for all participants, with the start and stop event defined per task.

Do not remove slow completions from summary results solely because they are inconvenient.

### 7.5 Assistance/errors

Assistance and recoverable-error definitions must be fixed before sessions so observer judgement remains consistent.

### 7.6 Qualitative notes

Observation notes should describe visible interaction evidence rather than infer private thoughts or abilities.

Prefer descriptions such as:

> Participant opened Settings before locating the Resume assessment action.

Avoid unsupported interpretations such as:

> Participant is bad at technology.

## 8. SUS — master design boundary

If participant questionnaires are permitted, SUS is administered after the approved system/task exposure using the standard 10-item procedure.

The later SUS protocol must:

- preserve raw item responses;
- record any invalid/missing response handling;
- calculate odd items as `response - 1`;
- calculate even items as `5 - response`;
- sum adjusted values and multiply by `2.5`;
- report the result as a **SUS score from 0–100**, not as a percentage;
- report sample size and descriptive statistics transparently;
- avoid population-level generalization unsupported by the sample.

No SUS score exists until real responses are collected under an approved protocol.

## 9. Accessibility evaluation — master design boundary

The later accessibility protocol must specify exact screens, procedures and evidence fields.

Minimum planned areas are:

1. authentication forms;
2. application shell/mobile navigation;
3. Resume Studio critical edit/save/dialog flows;
4. Interview Coach question/attempt/dialog flows;
5. Learning document tabs/chat/flashcards/quiz flows;
6. Settings/Gemini controls.

For each check record:

```text
check_id
screen_or_route
criterion_or_requirement
procedure
expected_result
observed_result
result_status
evidence_reference
notes
```

This phase may state that selected accessibility-oriented behaviours were evaluated. It must not convert partial evidence into a formal full-conformance statement.

## 10. Resume AI quality — master design boundary

Use frozen synthetic/de-identified Resume content and target-role/job contexts.

The later Resume rubric should evaluate criteria such as:

- factual preservation;
- relevance to supplied target context;
- actionability;
- clarity;
- consistency with supplied Resume content.

The rubric must penalize invented candidate facts.

Do not evaluate or report:

- employer ATS equivalence;
- hiring probability;
- guaranteed employment outcome.

## 11. Interview AI quality — master design boundary

Use frozen synthetic role/experience/session contexts and prepared practice answers.

Generated questions may be evaluated for:

- role relevance;
- experience-level appropriateness;
- clarity;
- useful coverage;
- redundancy/duplication.

Feedback may be evaluated for:

- relevance to the submitted answer;
- specificity;
- actionability;
- internal consistency;
- correct practice-only/non-hiring framing.

Do not turn an Interview model score into hiring ground truth.

Coding-question answers remain text-only; the project does not claim compiler/execution correctness.

## 12. Grounded Learning/RAG quality — master design boundary

Use frozen synthetic text-based PDFs with known page-level facts.

The later Learning dataset/rubric should include at least:

- directly answerable questions;
- multi-source questions where useful;
- unsupported/unanswerable questions.

Potential metrics may include, only after exact denominators are frozen:

- supported-answer rate;
- citation/source-page correctness rate;
- completeness against reference facts;
- unsupported-answer/abstention handling success.

Every metric must define what counts in the numerator and denominator.

Grounding/source references improve traceability but do not make generated answers automatically true.

## 13. Evaluation environment and reproducibility

Every later evaluation campaign must record the artefact and environment required to interpret its results.

Record, as applicable:

- Git executable checkpoint/branch;
- evaluation protocol version;
- browser/device/viewport where relevant;
- evaluation date;
- Gemini model (`gemini-3.6-flash` for the current release path) where AI output is tested;
- synthetic dataset/case version;
- participant/task IDs;
- relevant application state/configuration without exposing secrets.

If the executable product changes after an evaluation campaign begins, affected evaluation evidence must identify the old and new baselines. Do not silently pool results from materially different product versions.

## 14. Evaluation data classes

### 14.1 Raw evidence

Examples:

- participant task records;
- questionnaire item responses;
- qualitative observations;
- recordings if explicitly approved;
- individual AI output/case ratings;
- accessibility check observations.

### 14.2 Derived evidence

Examples:

- task-success counts/rates;
- median/mean completion time where appropriate;
- SUS scores;
- AI rubric summaries;
- citation-correctness summaries;
- accessibility pass/fail counts;
- anonymized themes.

### 14.3 Interpretation

Interpretation explains what the observed/derived evidence suggests, within the sample and method limitations.

Do not present interpretation as raw fact.

### 14.4 Limitations

Every result section must state relevant limitations, including small/convenience sample limits, synthetic-case limits, nondeterministic AI output where applicable, selected-accessibility-scope limits, and any missing evidence.

## 15. Data integrity rules

1. Preserve task/case IDs once collection begins.
2. Do not overwrite an observed result to match an expectation.
3. Record invalid/missing data explicitly.
4. Keep calculations reproducible from permitted underlying data.
5. Distinguish raw observation from derived metric.
6. Distinguish derived metric from interpretation.
7. Never fabricate a result for a skipped/unavailable test.
8. Never infer participant satisfaction solely from task success.
9. Never infer AI factual quality solely from schema/contract validation.
10. Never infer full accessibility conformance solely from component tests.

## 16. Change control and discovered defects

If evaluation identifies a probable product defect:

1. record the observation/result without rewriting it;
2. determine whether the affected evaluation can continue safely/meaningfully;
3. do not repair the defect on the Phase 20B evaluation branch;
4. create a separate bounded repair task/branch after explicit approval;
5. reproduce the defect and define verification criteria;
6. repair and qualify the executable change through the normal project workflow;
7. merge only after explicit exact-head approval;
8. record the new executable baseline;
9. repeat/restart only the affected evaluation evidence needed for comparability.

Do not mix product implementation changes into evaluation-result commits.

## 17. Planned evaluation order

The intended sequence is:

```text
20B-0 Ethics/module gate
        ↓
20B-1 Master evaluation protocol
        ↓
20B-2 Map existing engineering evidence
        ↓
20B-3 Freeze task-based usability protocol
        ↓
20B-4 Freeze SUS procedure
        ↓
20B-5 Freeze participant/sample plan
        ↓
20B-6 Freeze selected accessibility protocol
        ↓
20B-7 Freeze feature-specific AI rubrics
        ↓
20B-8 Freeze synthetic evaluation cases
        ↓
20B-9 Freeze evidence-collection templates
        ↓
Evaluation design freeze
        ↓
Permitted participant/accessibility/AI campaigns
        ↓
20B-10 Analyse actual evidence
        ↓
20B-11 O7 results/evidence record and integration gate
```

Participant-facing activities cannot pass the ethics gate by sequence alone; the gate must be explicitly resolved.

## 18. Claim boundaries

Phase 20B must not state any of the following unless later evidence genuinely and specifically supports the claim:

- “Career Learning Hub is WCAG compliant.”
- “The AI is X% accurate.”
- “The Resume score is an employer ATS score.”
- “The application improves hiring chances.”
- “Interview feedback predicts employment success.”
- “Grounded answers are guaranteed true.”
- “The application guarantees learning improvement.”
- “The system is production secure.”
- “The system has been penetration tested.”
- “The participant sample represents all students/job seekers.”
- “A high SUS score proves effectiveness.”

Use bounded evidence statements tied to the actual method instead.

## 19. Phase 20B completion criteria

Phase 20B may be declared complete only when:

1. ethics/module conditions are explicitly documented before participant-facing work;
2. all detailed protocols used for data collection are frozen/versioned;
3. existing engineering evidence is mapped accurately;
4. real usability evidence is collected if permitted;
5. SUS is calculated from real responses if permitted;
6. selected accessibility checks are actually completed;
7. Resume AI quality is evaluated against frozen cases;
8. Interview AI quality is evaluated against frozen cases;
9. grounded Learning quality is evaluated against frozen known-fact/unsupported cases;
10. calculations are reproducible from permitted evidence;
11. participant identities/secrets/private files are not committed;
12. results distinguish observation, calculation, interpretation and limitation;
13. any product repairs are isolated and re-qualified separately;
14. O7 is updated only to the level supported by the completed evidence;
15. the final Phase 20B branch is locally qualified and merged only after explicit exact-head approval.

## 20. Current authorization boundary

The current user approval covers only:

- Phase 20B-0 — Ethics and Participant Safety Gate;
- Phase 20B-1 — Master University Evaluation Protocol;
- the implementation plan/current planning pointer required to support those two tasks.

Not yet authorized:

- participant recruitment/data collection;
- usability sessions;
- SUS administration;
- participant/sample-size decision;
- detailed accessibility campaign;
- detailed AI rubrics/datasets;
- synthetic evaluation fixture creation;
- evaluation result population;
- executable product changes;
- deployment;
- merge;
- branch deletion.