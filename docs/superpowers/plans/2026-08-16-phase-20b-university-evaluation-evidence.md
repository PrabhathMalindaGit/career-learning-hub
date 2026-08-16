# Phase 20B — University Evaluation Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close Objective O7 with reproducible, ethically controlled university evaluation evidence covering functionality, usability, accessibility, and AI-assisted output quality without modifying the qualified application unless a separately approved defect repair becomes necessary.

**Architecture:** Preserve the qualified Career Learning Hub executable tree and build the evaluation as a documentation/evidence layer around it. Engineering verification remains one evidence stream; participant usability/SUS evidence, selected accessibility checks, and feature-specific AI-quality rubrics are collected separately so no test count is misrepresented as usability or AI accuracy. Participant data collection is blocked until the module/supervisor ethics requirements are explicitly confirmed.

**Tech Stack:** Markdown evaluation records, CSV evidence templates, existing React/TypeScript/Express/MongoDB/Gemini application as the artefact under evaluation, existing Vitest/Testing Library/Supertest verification evidence, and manual/browser evaluation only in later separately authorized tasks.

## Global Constraints

- Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.
- Repository: `PrabhathMalindaGit/career-learning-hub`.
- Phase 20B branch: `phase-20b-university-evaluation-evidence`.
- Branch base: `main @ ed5268ce26a33bc33d00d12d15840a582b0c1d93`.
- Current qualified executable checkpoint remains `6b80f91d7016971d58ed9628e8818fabf00d1cd2`; PR #34 changed documentation only.
- Objective O7 is the controlling evaluation objective: evaluate functionality, usability, accessibility, and AI-assisted output quality.
- Existing engineering verification is evidence of tested software behaviour only; it is not a usability score, AI factual-accuracy percentage, full WCAG-conformance claim, production uptime guarantee, or independent security certification.
- No participant recruitment, pilot session, questionnaire, observation, interview, SUS collection, audio/video recording, or participant-data collection is permitted until the ethics/module gate is explicitly resolved.
- Do not invent ethics approval, participant numbers, sampling methods, participant results, SUS values, accessibility results, AI-quality results, or statistical findings.
- Participant records, if later approved, use anonymous participant IDs such as `P01`; do not commit names, email addresses, phone numbers, student IDs, personal CVs, private documents, real Gemini keys, or other direct identifiers.
- Evaluation inputs should use synthetic/de-identified Career Learning Hub demo records wherever practical.
- Raw participant data must not be committed to Git unless the approved ethics/data-management procedure explicitly permits that exact data class. Prefer derived/anonymized evaluation tables in the repository.
- AI evaluation must use feature-specific criteria. Do not collapse Resume, Interview, and document-grounded Learning into one vague “AI accuracy” score.
- Accessibility evaluation may report selected WCAG-oriented checks only; do not claim formal WCAG certification without a complete justified audit.
- No deployment is authorized by this plan.
- No branch deletion is authorized by this plan.
- No merge is authorized without separate explicit approval of the exact locally qualified head SHA.
- No `frontend/`, `backend/`, `packages/`, `tests/`, package/dependency, runtime/build configuration, schema, API, provider, credential, security, or deployment-resource change is authorized by Phase 20B-0/1.
- If evaluation later exposes a product defect, record it and use a separate bounded repair branch; do not mix product repair with evaluation evidence collection.
- Current authorization covers **Task 0 and Task 1 only**. Tasks 2–11 remain planned and require later explicit authorization.

---

## File Structure

### Current authorized files — Phase 20B-0/1

- Create: `docs/evaluation/PHASE_20B_ETHICS_AND_PARTICIPANT_SAFETY_GATE.md` — hard precondition for any participant-facing evaluation activity.
- Create: `docs/evaluation/PHASE_20B_UNIVERSITY_EVALUATION_PROTOCOL.md` — authoritative master protocol linking O7 to separate evidence streams and claim boundaries.
- Create: `docs/superpowers/plans/2026-08-16-phase-20b-university-evaluation-evidence.md` — this implementation plan.
- Modify: `docs/planning/CURRENT_PHASE.md` — activate only Phase 20B-0/1 and preserve the current executable qualification evidence.

### Later planned files — not authorized in this slice

- `docs/evaluation/USABILITY_EVALUATION_PROTOCOL.md`
- `docs/evaluation/ACCESSIBILITY_EVALUATION_PROTOCOL.md`
- `docs/evaluation/AI_RESUME_EVALUATION_RUBRIC.md`
- `docs/evaluation/AI_INTERVIEW_EVALUATION_RUBRIC.md`
- `docs/evaluation/AI_LEARNING_GROUNDED_QA_EVALUATION_RUBRIC.md`
- `docs/evaluation/templates/*.csv`
- `docs/evaluation/datasets/**` containing only approved synthetic/de-identified evaluation fixtures.
- `docs/evaluation/PHASE_20B_EVALUATION_RESULTS.md` only after real evaluation is conducted.

---

### Task 0: Establish the ethics and participant-safety gate

**Files:**
- Create: `docs/evaluation/PHASE_20B_ETHICS_AND_PARTICIPANT_SAFETY_GATE.md`

**Interfaces:**
- Consumes: O7 requirement for formal academic evaluation; current project evidence that ethics/module requirements are not yet confirmed.
- Produces: a blocking decision record that must be resolved before participant recruitment or data collection.

- [ ] **Step 1: Record current gate state without inventing approval**

Set the gate to:

```text
BLOCKED / AWAITING MODULE OR SUPERVISOR CONFIRMATION
```

State that no repository evidence currently establishes whether formal ethics approval, supervisor approval, a module-specific consent process, or another review route is required.

- [ ] **Step 2: Define the decisions that must be confirmed**

The gate must require explicit answers for:

```text
formal ethics approval required? yes/no
approval/reference source
participant eligibility and minimum age
recruitment route
consent/participant-information requirements
whether recording is allowed
permitted participant data
use of synthetic/demo records
withdrawal procedure
retention/deletion period
storage location/access control
whether anonymized results may appear in the report/repository
```

- [ ] **Step 3: Define prohibited activity while blocked**

Explicitly prohibit recruitment, pilot testing with real participants, SUS/questionnaire collection, observation notes about real participants, interviews/focus groups, recording, and participant-data upload until the gate passes.

- [ ] **Step 4: Define minimum privacy defaults for later approved evaluation**

Use anonymous IDs (`P01`, `P02`, ...), synthetic/de-identified demo data, no real Gemini keys, no committed direct identifiers, and no raw participant material in Git by default.

- [ ] **Step 5: Define the gate-closing evidence**

The gate may be marked `PASSED` only when the student records the authoritative module/supervisor direction and any required approval/consent/data-management conditions. Do not treat verbal assumption or lack of response as approval.

- [ ] **Step 6: Commit the ethics gate**

Suggested commit message:

```text
Add Phase 20B ethics and participant safety gate
```

---

### Task 1: Create the master university evaluation protocol

**Files:**
- Create: `docs/evaluation/PHASE_20B_UNIVERSITY_EVALUATION_PROTOCOL.md`
- Modify: `docs/planning/CURRENT_PHASE.md`

**Interfaces:**
- Consumes: revised PID Objective O7; revised Interim limitation that formal usability, accessibility, and AI-quality evaluation remains incomplete; current qualified engineering evidence.
- Produces: one authoritative evaluation design that later usability/accessibility/AI protocols must conform to.

- [ ] **Step 1: Freeze the O7 evidence model**

Define four distinct evidence streams:

```text
A. Engineering functionality evidence
B. Participant usability evidence
C. Selected accessibility evidence
D. Feature-specific AI-output-quality evidence
```

State that these answer different questions and must not be conflated.

- [ ] **Step 2: Bind engineering evidence to the current qualified executable checkpoint**

Record:

```text
Qualified executable checkpoint: 6b80f91d7016971d58ed9628e8818fabf00d1cd2
Backend complete suite: 515/515 PASS
Frontend complete suite: 1,170/1,170 PASS
Non-overlapping total: 1,685 PASS
Backend security regression: 43/43 PASS
Typechecks/builds: PASS
```

Also record that current `main` is later because PR #34 is documentation-only; the executable tree represented by the qualification remains unchanged by that documentation merge.

- [ ] **Step 3: Define future usability evidence without collecting it**

Reserve task-based completion status, completion time, recoverable errors, assistance count, qualitative observations, and post-task/system SUS. Do not freeze a participant count or sampling method until the ethics/module guidance is known.

- [ ] **Step 4: Define future accessibility evidence without overclaiming**

Reserve manual keyboard/focus/labels/error/reflow/zoom/responsive checks and selected standards-oriented evidence. Use `PASS`, `FAIL`, and `NOT ASSESSED`; explicitly prohibit an unsupported “WCAG compliant” conclusion.

- [ ] **Step 5: Define future AI-quality evidence by feature**

Reserve separate Resume, Interview, and grounded Learning rubrics. Require synthetic/de-identified fixed cases, explicit denominators, model/version/date identity where applicable, and no single undifferentiated AI-accuracy percentage.

- [ ] **Step 6: Define data integrity and reproducibility rules**

Require frozen protocol before data collection, immutable case IDs/task IDs, recorded environment/baseline identity, raw-versus-derived distinction, reproducible calculations, and transparent missing/invalid data handling.

- [ ] **Step 7: Define change-control and defect handling**

If a defect is found during evaluation, record it and stop/reclassify affected evidence as needed. Any product repair requires a separate branch, reproduction, verification, user-approved merge, and a documented new evaluation baseline before resuming affected evaluation.

- [ ] **Step 8: Update current execution scope**

Mark Phase 20B-0/1 active on `phase-20b-university-evaluation-evidence`, retain Phase 20A/post-PR-33 evidence, and state clearly that participant recruitment and Tasks 2–11 remain unauthorized.

- [ ] **Step 9: Commit the protocol/current-scope update**

Suggested commit message:

```text
Define Phase 20B master evaluation protocol
```

---

### Task 2: Map existing engineering evidence to O7

**Status:** `PLANNED / NOT AUTHORIZED IN CURRENT SLICE`

Create an evidence matrix from O7/functionality claims to current test, build, security, browser/human-QA, and qualification records. Do not rerun the full suite unless the executable product changes or a new verification question requires it.

---

### Task 3: Freeze task-based usability evaluation

**Status:** `PLANNED / NOT AUTHORIZED IN CURRENT SLICE`

Define representative tasks for navigation, Resume, Interview, grounded Learning, and study-material workflows; freeze success/partial/fail rules, timing method, assistance/error recording, observer instructions, and evaluation environment before the first participant session.

---

### Task 4: Freeze SUS procedure

**Status:** `PLANNED / NOT AUTHORIZED IN CURRENT SLICE`

Use the standard 10-item SUS procedure only after the ethics gate permits participant questionnaires. Preserve raw responses and reproducible scoring; report the resulting 0–100 SUS score as a score, not a percentage.

---

### Task 5: Freeze participant/sample plan

**Status:** `PLANNED / NOT AUTHORIZED IN CURRENT SLICE`

Choose participant eligibility, recruitment, target count, sample description, and stopping rule only after authoritative ethics/module guidance and realistic recruitment feasibility are known. Do not invent a participant count in advance.

---

### Task 6: Freeze selected accessibility protocol

**Status:** `PLANNED / NOT AUTHORIZED IN CURRENT SLICE`

Create a bounded checklist for keyboard-only use, focus visibility/management, labels/instructions, validation/error identification, status messaging, 200% zoom/reflow, mobile/reduced-width navigation, and critical Resume/Interview/Learning/Settings flows. Keep the claim boundary below formal full WCAG certification unless a complete audit is actually performed.

---

### Task 7: Freeze feature-specific AI-quality rubrics

**Status:** `PLANNED / NOT AUTHORIZED IN CURRENT SLICE`

Create separate Resume, Interview, and grounded Learning evaluation criteria. Learning must include supported/unsupported questions and source/citation correctness; Resume must emphasise factual preservation/relevance/actionability; Interview must emphasise role relevance, practice appropriateness, specificity, and non-hiring framing.

---

### Task 8: Create frozen synthetic evaluation inputs

**Status:** `PLANNED / NOT AUTHORIZED IN CURRENT SLICE`

Create versioned synthetic/de-identified Resume, Interview, and Learning cases with case IDs and known/reference facts. Never store real participant secrets or private documents in Git.

---

### Task 9: Prepare evidence-collection templates

**Status:** `PLANNED / NOT AUTHORIZED IN CURRENT SLICE`

Create machine-readable CSV templates for usability observations, SUS responses, accessibility checks, and the three AI rubrics. Define columns and allowed values before any evaluation result is entered.

---

### Task 10: Conduct evaluation and analyse actual results

**Status:** `PLANNED / BLOCKED BY TASK 0`

Only after the ethics gate and all relevant protocols are frozen, conduct the permitted participant/manual/AI evaluations, preserve real observations, calculate results reproducibly, and distinguish observed results, calculated metrics, interpretation, and limitations.

---

### Task 11: Produce the O7 evaluation evidence record and integration gate

**Status:** `PLANNED / NOT AUTHORIZED IN CURRENT SLICE`

Create the final Phase 20B results/evidence record, state limitations, map findings back to O7, locally qualify the documentation/evidence diff, and stop at a separate PR/merge approval gate. Any product defect repairs remain separate branches.

---

## Phase 20B Success Criteria

Phase 20B is complete only when:

1. Ethics/module conditions are explicitly documented before participant-facing work.
2. The master protocol is frozen before evidence collection.
3. Existing engineering verification is mapped accurately without being relabelled as usability/AI accuracy.
4. Actual usability evidence is collected under the approved method.
5. SUS is calculated from real responses using a reproducible procedure if permitted.
6. Selected accessibility checks are completed and reported without unsupported conformance claims.
7. Resume AI quality is evaluated against frozen synthetic/de-identified cases and criteria.
8. Interview AI quality is evaluated against frozen synthetic/de-identified cases and criteria.
9. Grounded Learning answer/source quality is evaluated against frozen known-fact cases including unsupported questions.
10. No participant identity, secret, private CV/document, or real Gemini credential is committed.
11. Results distinguish raw observation, calculated metric, interpretation, and limitation.
12. O7 is updated only to the degree supported by actual evidence.
13. No product code change is mixed into the evaluation evidence branch.
14. The exact final branch head is locally qualified before any PR/merge request.

## Current Execution Boundary

The user has authorized **Phase 20B-0/1 only**:

- ethics and participant-safety gate;
- master university evaluation protocol;
- current planning pointer/plan documentation required to support those two tasks.

No participant recruitment, participant data collection, usability session, SUS administration, accessibility campaign, AI evaluation campaign, synthetic dataset creation, result population, deployment, executable-code change, PR merge, or branch deletion is authorized by this approval.