# Phase 20B — University Evaluation Evidence Implementation Plan

> **For agentic workers:** use the project’s approved bounded branch/qualification/PR/merge workflow. Do not mix product repair with evaluation evidence.

## Goal

Close Objective O7 with reproducible, ethically controlled university evaluation evidence covering:

1. functionality/technical reliability;
2. participant usability;
3. selected accessibility;
4. feature-specific AI-assisted output quality.

The qualified application remains unchanged unless a separately approved defect-repair branch becomes necessary.

## Architecture

Phase 20B is a documentation/evidence layer around the qualified Career Learning Hub artefact.

Evidence streams remain separate:

```text
A — Engineering functionality evidence
B — Participant usability evidence
C — Selected accessibility evidence
D — Feature-specific AI-output-quality evidence
```

Combining documentation work on one branch does not combine the evidence questions or results.

## Global constraints

- Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless necessary for correctness or security.
- Repository: `PrabhathMalindaGit/career-learning-hub`.
- Current combined branch: `phase-20b-4-6-7-evaluation-method-design-freeze`.
- Branch base: `main @ 7142e6dde8281db1852d365989f25c4d10e5265b`.
- Current qualified executable checkpoint remains `6b80f91d7016971d58ed9628e8818fabf00d1cd2`.
- Phase 20B-0/1 merged through PR #35.
- Phase 20B-2 merged through PR #36.
- Phase 20B-3 merged through PR #37.
- Current authorization covers **Task 4 + Task 6 + Task 7 method design only**.
- The ethics/module gate remains `BLOCKED / AWAITING MODULE OR SUPERVISOR CONFIRMATION`.
- No participant recruitment, pilot session, questionnaire administration, observation, interview, recording, SUS collection or participant-data collection is permitted while the gate is blocked.
- Do not invent ethics approval, participant count, sample result, SUS score, accessibility result, AI-quality result or statistical finding.
- Use synthetic/de-identified study/evaluation content by default.
- Do not commit direct participant identifiers, personal CVs/private study documents or real Gemini credentials.
- Engineering verification is not a SUS score, participant task-success result, AI factual-accuracy result, full WCAG-conformance result, penetration test or production guarantee.
- Accessibility remains selected/bounded unless a complete justified audit is separately designed and completed.
- Resume, Interview and Grounded Learning AI evaluation remain separate; do not create one vague overall AI-accuracy score.
- No deployment is authorized.
- No branch deletion is authorized.
- PR creation requires explicit approval after local qualification.
- Merge requires a separate approval of the exact qualified head SHA.
- Product source, tests, packages/dependencies, runtime/build configuration, schemas, APIs, provider/credential/security behaviour and deployment resources are out of scope for the current combined slice.
- If evaluation later identifies a probable product defect, preserve the observation and repair it only on a separately approved bounded repair branch.

---

## Evaluation files

### Completed / merged

- `docs/evaluation/PHASE_20B_ETHICS_AND_PARTICIPANT_SAFETY_GATE.md`
- `docs/evaluation/PHASE_20B_UNIVERSITY_EVALUATION_PROTOCOL.md`
- `docs/evaluation/PHASE_20B_ENGINEERING_EVIDENCE_MATRIX.md`
- `docs/evaluation/USABILITY_EVALUATION_PROTOCOL.md`

### Current Phase 20B-4/6/7 method-design files

- Create: `docs/evaluation/SUS_EVALUATION_PROTOCOL.md`
- Create: `docs/evaluation/ACCESSIBILITY_EVALUATION_PROTOCOL.md`
- Create: `docs/evaluation/AI_RESUME_EVALUATION_RUBRIC.md`
- Create: `docs/evaluation/AI_INTERVIEW_EVALUATION_RUBRIC.md`
- Create: `docs/evaluation/AI_LEARNING_GROUNDED_QA_EVALUATION_RUBRIC.md`
- Modify: `docs/planning/CURRENT_PHASE.md`
- Modify: this plan.

### Later planned files — not authorized in this slice

- `docs/evaluation/PARTICIPANT_SAMPLE_PLAN.md` or equivalent Task 5 record;
- `docs/evaluation/templates/*.csv`;
- `docs/evaluation/datasets/**` containing only approved synthetic/de-identified evaluation fixtures;
- `docs/evaluation/PHASE_20B_EVALUATION_RESULTS.md` after real evaluation is conducted.

---

## Task 0 — Ethics and participant-safety gate

**Status:** `COMPLETED / MERGED VIA PR #35 / GATE REMAINS BLOCKED`

Current gate:

```text
BLOCKED / AWAITING MODULE OR SUPERVISOR CONFIRMATION
```

Participant-facing activity remains prohibited until authoritative guidance and any required approval/consent/data-management conditions are recorded.

---

## Task 1 — Master university evaluation protocol

**Status:** `COMPLETED / MERGED VIA PR #35`

The master protocol separates Streams A–D, freezes evidence-integrity principles and prevents engineering evidence from being relabelled as participant/accessibility/AI-quality results.

---

## Task 2 — Engineering evidence matrix

**Status:** `COMPLETED / QUALIFIED / MERGED VIA PR #36`

Authoritative record:

`docs/evaluation/PHASE_20B_ENGINEERING_EVIDENCE_MATRIX.md`

Current engineering baseline remains:

```text
Backend complete suite: 515/515 PASS
Frontend complete suite: 1,170/1,170 PASS
Non-overlapping total: 1,685 PASS
Backend security regression: 43/43 PASS
Typechecks/builds: PASS
```

Those results remain engineering evidence only.

---

## Task 3 — Task-based usability evaluation protocol

**Status:** `COMPLETED / QUALIFIED / MERGED VIA PR #37`

Authoritative record:

`docs/evaluation/USABILITY_EVALUATION_PROTOCOL.md`

Frozen task order:

```text
U1 — Access & Navigation
U2 — Resume Studio
U3 — Interview Coach
U4 — Grounded Learning
U5 — Study Materials
```

The protocol freezes valid/invalid task handling, `SUCCESS / PARTIAL / FAILED`, 10-minute task windows, timing, recoverable-error, assistance, observer and reset rules.

Participant execution remains blocked by Task 0 and later prerequisites.

---

## Task 4 — Freeze SUS procedure

**Status:** `AUTHORIZED / IMPLEMENTED ON CURRENT COMBINED BRANCH / AWAITING LOCAL QUALIFICATION`

**Authoritative file:** `docs/evaluation/SUS_EVALUATION_PROTOCOL.md`

### Frozen method

- [x] Standard ten SUS items retained in standard order.
- [x] Response scale frozen to 1–5: Strongly disagree → Strongly agree.
- [x] Administration frozen to once after the approved system/task exposure.
- [x] Odd items: `response - 1`.
- [x] Even items: `5 - response`.
- [x] Sum adjusted items and multiply by `2.5`.
- [x] Report as a `0–100 SUS score`, **not a percentage**.
- [x] Require all ten valid responses for an individual score under version 1.0.
- [x] No imputation for missing/invalid responses.
- [x] Group reporting includes valid `n`, mean, median, minimum, maximum and separate invalid/not-run/withdrawn counts.
- [x] Task-performance and SUS evidence remain separate.
- [x] No SUS result or participant count is created.
- [x] SUS administration remains blocked by Task 0.

---

## Task 5 — Participant/sample plan

**Status:** `PLANNED / NOT AUTHORIZED / BLOCKED BY TASK 0`

Do not yet freeze:

- participant eligibility;
- recruitment route;
- target participant count;
- sample description;
- stopping rule;
- permitted demographic fields.

Those decisions require authoritative module/supervisor/ethics guidance and realistic recruitment feasibility.

No participant count may be invented.

---

## Task 6 — Freeze selected accessibility protocol

**Status:** `AUTHORIZED / IMPLEMENTED ON CURRENT COMBINED BRANCH / AWAITING LOCAL QUALIFICATION`

**Authoritative file:** `docs/evaluation/ACCESSIBILITY_EVALUATION_PROTOCOL.md`

### Frozen method

- [x] Selected critical areas: Authentication, shell/navigation, Resume, Interview, Learning, Settings/Gemini.
- [x] Selected categories: keyboard-only, focus, dialog focus management, labels/instructions, validation/errors, status/save feedback, 200% zoom/reflow, reduced-width navigation.
- [x] 29 fixed checks with IDs, procedures and expected results.
- [x] Allowed result values: `PASS / FAIL / NOT ASSESSED`.
- [x] Environment/evidence fields frozen.
- [x] Any selected-check pass rate must disclose denominator and `NOT ASSESSED` exclusions.
- [x] No result may be reported as a WCAG-conformance percentage.
- [x] No complete accessibility or certification claim is created.
- [x] No accessibility result is created by the method-design slice.

---

## Task 7 — Freeze feature-specific AI-quality rubrics

**Status:** `AUTHORIZED / IMPLEMENTED ON CURRENT COMBINED BRANCH / AWAITING LOCAL QUALIFICATION`

### Task 7A — Resume

**File:** `docs/evaluation/AI_RESUME_EVALUATION_RUBRIC.md`

Frozen criteria using `0 / 1 / 2`:

1. factual preservation;
2. target-role relevance;
3. actionability;
4. clarity;
5. internal consistency.

Material fabrication is tracked separately and cannot be hidden by a high total.

Prohibited reinterpretations include employer ATS equivalence and hiring probability.

### Task 7B — Interview

**File:** `docs/evaluation/AI_INTERVIEW_EVALUATION_RUBRIC.md`

Generated questions and feedback remain separate.

Question criteria:

1. role relevance;
2. experience-level appropriateness;
3. clarity;
4. useful coverage;
5. redundancy control.

Feedback criteria:

1. relevance to submitted answer;
2. specificity;
3. actionability;
4. internal consistency;
5. practice-only/non-hiring framing.

Text coding-question evaluation does not establish compiler/runtime correctness.

### Task 7C — Grounded Learning

**File:** `docs/evaluation/AI_LEARNING_GROUNDED_QA_EVALUATION_RUBRIC.md`

Frozen future case types:

```text
ANSWERABLE_SINGLE
ANSWERABLE_MULTI
UNANSWERABLE
```

Frozen dimensions:

- documentary answer support;
- source/page correctness;
- completeness against frozen reference facts;
- unsupported-question handling;
- material unsupported-claim tracking.

Metric numerators/denominators are explicit and remain separate. No vague overall AI-accuracy value is created.

Current implemented retrieval must not be misrepresented as vector/embedding retrieval without evidence.

---

## Task 8 — Frozen synthetic evaluation inputs

**Status:** `PLANNED / NOT AUTHORIZED`

Later create versioned synthetic/de-identified Resume, Interview and Learning cases with stable IDs and known/reference facts.

This current slice defines case-schema requirements only and creates no actual evaluation cases, PDFs or result-generating fixtures.

---

## Task 9 — Evidence-collection templates

**Status:** `PLANNED / NOT AUTHORIZED`

Later create machine-readable templates for:

- usability observations;
- SUS raw responses/scores;
- selected accessibility checks;
- Resume AI rubric;
- Interview AI rubric;
- Grounded Learning rubric.

The templates must preserve the semantics frozen by Tasks 3/4/6/7.

---

## Task 10 — Conduct evaluation and analyse actual results

**Status:** `PLANNED / NOT AUTHORIZED / PARTICIPANT PORTION BLOCKED BY TASK 0`

Only after the applicable ethics and design gates are satisfied:

1. conduct permitted participant/manual/AI evaluations;
2. preserve actual observations/outputs;
3. calculate results reproducibly;
4. distinguish raw evidence, derived metric, interpretation and limitation;
5. document any baseline changes explicitly.

Do not fabricate skipped or unavailable evidence.

---

## Task 11 — Final O7 evidence record and integration gate

**Status:** `PLANNED / NOT AUTHORIZED`

Create the final Phase 20B evidence/results record only after actual permitted evidence exists. Map findings back to O7 at the level genuinely supported by the methods/results.

Product defect repairs remain separate branches.

---

## Current combined-slice local qualification

Before PR creation, the user must verify the exact branch head, clean status, documentation-only changed paths and `git diff --check`.

Expected changed files are exactly:

```text
docs/evaluation/SUS_EVALUATION_PROTOCOL.md
docs/evaluation/ACCESSIBILITY_EVALUATION_PROTOCOL.md
docs/evaluation/AI_RESUME_EVALUATION_RUBRIC.md
docs/evaluation/AI_INTERVIEW_EVALUATION_RUBRIC.md
docs/evaluation/AI_LEARNING_GROUNDED_QA_EVALUATION_RUBRIC.md
docs/planning/CURRENT_PHASE.md
docs/superpowers/plans/2026-08-16-phase-20b-university-evaluation-evidence.md
```

No application test rerun is required if the branch remains documentation-only.

PR creation requires separate explicit approval after local qualification. Merge requires a later separate approval of the exact qualified head SHA.

---

## Phase 20B success criteria

Phase 20B is complete only when:

1. ethics/module conditions are explicitly documented before participant-facing work;
2. every method used for collection is frozen/versioned before collection;
3. engineering evidence remains accurately bounded;
4. actual usability evidence is collected if permitted;
5. SUS is calculated from real valid responses if permitted;
6. selected accessibility checks are actually completed and bounded correctly;
7. Resume AI quality is evaluated against frozen cases;
8. Interview AI quality is evaluated against frozen cases;
9. Grounded Learning quality is evaluated against frozen answerable/multi-source/unanswerable cases;
10. no participant identity, secret, private CV/document or personal Gemini credential is committed;
11. calculations remain reproducible;
12. observation, metric, interpretation and limitation remain distinct;
13. product repairs are isolated/requalified separately;
14. O7 is updated only to the degree supported by actual evidence;
15. integration branches are locally qualified and merged only after explicit gates.

## Current execution boundary

The user has authorized **Phase 20B-4/6/7 method design only**.

Authorized:

- SUS method documentation;
- selected accessibility protocol documentation;
- Resume AI rubric documentation;
- Interview AI rubric documentation;
- Grounded Learning AI rubric documentation;
- current plan/progress documentation required for the combined method-design freeze.

Not authorized:

- participant eligibility/recruitment/sample decisions (`20B-5`);
- participant recruitment/data collection;
- usability/SUS administration;
- accessibility campaign execution/results;
- AI-quality campaign execution/scoring/results;
- synthetic evaluation cases (`20B-8`);
- evidence collection templates (`20B-9`);
- results analysis/final evidence (`20B-10/11`);
- executable product/test/config changes;
- deployment;
- PR creation before local qualification and explicit approval;
- merge;
- branch deletion.