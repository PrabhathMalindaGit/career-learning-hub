# Phase 20B — University Evaluation Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close Objective O7 with reproducible, ethically controlled university evaluation evidence covering functionality, usability, accessibility, and AI-assisted output quality without modifying the qualified application unless a separately approved defect repair becomes necessary.

**Architecture:** Preserve the qualified Career Learning Hub executable tree and build the evaluation as a documentation/evidence layer around it. Engineering verification remains one evidence stream; participant usability/SUS evidence, selected accessibility checks, and feature-specific AI-quality rubrics remain separate so no test count is misrepresented as usability or AI accuracy. Participant data collection remains blocked until the module/supervisor ethics requirements are explicitly confirmed.

**Tech Stack:** Markdown evaluation records, later CSV evidence templates, existing React/TypeScript/Express/MongoDB/Gemini application as the evaluated artefact, existing Vitest/Testing Library/Supertest evidence, and later separately authorized browser/manual evaluation.

## Global Constraints

- Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless necessary for correctness or security.
- Repository: `PrabhathMalindaGit/career-learning-hub`.
- Phase 20B-0/1 completed and merged through PR #35.
- Phase 20B-2 completed, locally qualified and merged through PR #36.
- Current Phase 20B-3 branch: `phase-20b-3-usability-evaluation-protocol`.
- Phase 20B-3 branch base: `main @ 41dcc7cd6f11b5fad603c845c525b318c0a578eb`.
- Current qualified executable checkpoint remains `6b80f91d7016971d58ed9628e8818fabf00d1cd2`; subsequent Phase 20B integrations through PR #36 are documentation-only.
- Objective O7 remains: evaluate functionality, usability, accessibility, and AI-assisted output quality.
- Engineering verification is tested-behaviour evidence only; it is not a participant usability score, SUS score, AI factual-accuracy percentage, full WCAG claim, penetration test, security certification, production uptime guarantee or scalability result.
- No participant recruitment, pilot session, questionnaire, observation, interview, SUS collection, recording or participant-data collection is permitted until the ethics/module gate explicitly passes.
- Do not invent ethics approval, participant numbers, sampling methods, participant results, SUS values, accessibility results, AI-quality results or statistical findings.
- If participant work is later permitted, use anonymous participant IDs and synthetic/de-identified study records; do not commit direct identifiers, personal CVs/private documents or real Gemini credentials.
- Raw participant data must not be committed to Git by default.
- Accessibility evaluation remains selected/bounded unless a complete justified audit is separately designed and completed.
- AI evaluation must use feature-specific rubrics; do not create one vague overall AI-accuracy score.
- No deployment is authorized by this plan.
- No branch deletion is authorized by this plan.
- No merge is authorized without separate explicit approval of the exact locally qualified head SHA.
- Product source, tests, packages/dependencies, runtime/build configuration, schemas, APIs, provider/credential/security behaviour and deployment resources remain out of scope for Phase 20B-3.
- If evaluation later exposes a probable product defect, record it and use a separate bounded repair branch; never mix product repair with evaluation evidence collection.
- Current authorization covers **Task 3 only**. Tasks 4–11 remain inactive unless separately authorized. Participant-facing execution remains blocked by Task 0.

---

## File Structure

### Completed Phase 20B-0/1 files

- `docs/evaluation/PHASE_20B_ETHICS_AND_PARTICIPANT_SAFETY_GATE.md`
- `docs/evaluation/PHASE_20B_UNIVERSITY_EVALUATION_PROTOCOL.md`
- `docs/planning/CURRENT_PHASE.md`
- this plan.

### Completed Phase 20B-2 file

- `docs/evaluation/PHASE_20B_ENGINEERING_EVIDENCE_MATRIX.md`

### Current Phase 20B-3 files

- Create: `docs/evaluation/USABILITY_EVALUATION_PROTOCOL.md` — frozen task-based usability method for Stream B.
- Modify: `docs/planning/CURRENT_PHASE.md` — activate only Phase 20B-3 and preserve the ethics/participant boundary.
- Modify: this plan — advance the progress pointer through Task 3.

### Later planned files — not authorized in this slice

- `docs/evaluation/SUS_EVALUATION_PROTOCOL.md` or equivalent Task 4 record;
- `docs/evaluation/PARTICIPANT_SAMPLE_PLAN.md` or equivalent Task 5 record;
- `docs/evaluation/ACCESSIBILITY_EVALUATION_PROTOCOL.md`;
- `docs/evaluation/AI_RESUME_EVALUATION_RUBRIC.md`;
- `docs/evaluation/AI_INTERVIEW_EVALUATION_RUBRIC.md`;
- `docs/evaluation/AI_LEARNING_GROUNDED_QA_EVALUATION_RUBRIC.md`;
- `docs/evaluation/templates/*.csv`;
- `docs/evaluation/datasets/**` containing only approved synthetic/de-identified evaluation fixtures;
- `docs/evaluation/PHASE_20B_EVALUATION_RESULTS.md` only after real evaluation is conducted.

---

### Task 0: Establish the ethics and participant-safety gate

**Status:** `COMPLETED / MERGED VIA PR #35 / GATE REMAINS BLOCKED`

Current repository state:

```text
BLOCKED / AWAITING MODULE OR SUPERVISOR CONFIRMATION
```

No participant recruitment or participant-derived data collection may begin until authoritative guidance and any required approval/consent/data-management conditions are recorded.

---

### Task 1: Create the master university evaluation protocol

**Status:** `COMPLETED / MERGED VIA PR #35`

The master protocol freezes four distinct evidence streams:

```text
A. Engineering functionality evidence
B. Participant usability evidence
C. Selected accessibility evidence
D. Feature-specific AI-output-quality evidence
```

These streams answer different questions and must not be conflated.

---

### Task 2: Map existing engineering evidence to O7

**Status:** `COMPLETED / QUALIFIED / MERGED VIA PR #36`

Authoritative record:

`docs/evaluation/PHASE_20B_ENGINEERING_EVIDENCE_MATRIX.md`

The matrix maps the existing automated/build/security/human-QA evidence to Stream A and preserves these current boundaries:

```text
Backend complete suite: 515/515 PASS
Frontend complete suite: 1,170/1,170 PASS
Non-overlapping total: 1,685 PASS
Backend security regression: 43/43 PASS
Typechecks/builds: PASS
```

No participant usability, full accessibility-conformance, AI-quality, penetration-test or production-readiness result is inferred from those engineering counts.

---

### Task 3: Freeze task-based usability evaluation

**Status:** `AUTHORIZED / IMPLEMENTED ON phase-20b-3-usability-evaluation-protocol / AWAITING LOCAL QUALIFICATION`

**Files:**
- Create: `docs/evaluation/USABILITY_EVALUATION_PROTOCOL.md`
- Modify: `docs/planning/CURRENT_PHASE.md`
- Modify: this plan.

**Interfaces:**
- Consumes: the master O7 protocol, ethics gate, integrated Career Learning Hub feature set and completed Stream A evidence mapping.
- Produces: the frozen Stream B task-based usability method only; no participant results.

- [x] **Step 1: Freeze the study question and task order**

Use exactly:

```text
U1 — Access & Navigation
U2 — Resume Studio
U3 — Interview Coach
U4 — Grounded Learning
U5 — Study Materials
```

Use the same order for every participant in protocol version 1.0.

- [x] **Step 2: Freeze participant-facing task prompts and task outcomes**

Each task defines:

- preconditions;
- participant-facing goal wording without step-by-step UI directions;
- required outcomes;
- primary outcome;
- explicit success/partial/fail rules.

- [x] **Step 3: Freeze completion and validity scales**

For valid task attempts use exactly:

```text
SUCCESS
PARTIAL
FAILED
```

Use separate validity states:

```text
VALID
INVALID_ENVIRONMENT
WITHDRAWN
NOT_RUN
```

Do not relabel study-environment failure or participant withdrawal as task failure.

- [x] **Step 4: Freeze timing method**

Use one `10 minute` maximum active task window for U1–U5. Start after the task prompt is fully delivered and the participant indicates readiness. Normal hesitation, navigation, self-corrected errors, loading and counted assistance do not pause the task timer.

- [x] **Step 5: Freeze recoverable-error and assistance definitions**

Count one self-corrected incorrect-state episode as one recoverable error. Page scanning/reading is not an error.

Count directional moderator interventions naming a control/location/sequence as assistance. Neutral repetition of the task goal is not assistance.

- [x] **Step 6: Freeze moderator/observer procedure**

Require verbatim task prompts, no pre-task coaching, objective observable notes, no moderator execution of essential task actions, no required think-aloud, and no recording unless the later ethics gate explicitly permits the exact method.

- [x] **Step 7: Freeze environment/reset boundaries**

Default study environment is Chrome stable on desktop/laptop, target viewport approximately `1440 × 900`, `100%` zoom, clean study profile/session, equivalent reset study state, synthetic/de-identified records and study-managed Gemini for U2/U4 where required.

Participants must never provide personal API keys.

- [x] **Step 8: Freeze task-analysis formulas and claim boundaries**

Define per-task independent success, partial and failure rates using `VALID` records only; report median successful completion time and descriptive error/assistance evidence where appropriate. Do not create one unsupported overall usability percentage.

Keep SUS, accessibility and AI-output-quality evidence separate.

- [x] **Step 9: Preserve participant-execution blockers**

Real participant sessions remain blocked until at least:

1. Task 0 ethics/module gate passes;
2. Task 5 participant/sample plan is frozen;
3. Task 8 synthetic/de-identified study fixtures are frozen;
4. Task 9 collection templates are frozen;
5. executable/environment/reset identities are recorded.

If SUS is used in the same session, Task 4 must also be frozen first.

- [x] **Step 10: Update planning/progress pointers**

Record Task 2 as merged via PR #36, activate Task 3 only, and keep Tasks 4–11 inactive.

- [ ] **Step 11: Local documentation-only qualification**

User must verify the exact branch head, clean status, changed-file list, documentation-only scope and `git diff --check` before PR creation is considered.

Expected changed files are exactly:

```text
docs/evaluation/USABILITY_EVALUATION_PROTOCOL.md
docs/planning/CURRENT_PHASE.md
docs/superpowers/plans/2026-08-16-phase-20b-university-evaluation-evidence.md
```

No application test rerun is required if the branch remains documentation-only.

- [ ] **Step 12: PR/merge gates**

PR creation requires separate explicit user approval after local qualification. Merge requires a later separate approval of the exact qualified head SHA.

---

### Task 4: Freeze SUS procedure

**Status:** `PLANNED / NOT AUTHORIZED / PARTICIPANT USE BLOCKED BY TASK 0`

Use the standard 10-item SUS procedure only after the ethics gate permits participant questionnaires. Preserve raw responses and reproducible scoring; odd items use `response - 1`, even items use `5 - response`, adjusted values are summed and multiplied by `2.5`. Report the result as a `0–100 SUS score`, not a percentage.

---

### Task 5: Freeze participant/sample plan

**Status:** `PLANNED / NOT AUTHORIZED / BLOCKED BY TASK 0`

Choose participant eligibility, recruitment route, target count/sample description and stopping rule only after authoritative ethics/module guidance and realistic recruitment feasibility are known. Do not invent a participant count.

---

### Task 6: Freeze selected accessibility protocol

**Status:** `PLANNED / NOT AUTHORIZED`

Create a bounded checklist for keyboard-only use, focus visibility/management, labels/instructions, validation/error identification, status messaging, 200% zoom/reflow, mobile/reduced-width navigation, and critical Resume/Interview/Learning/Settings flows. Keep the claim boundary below formal full WCAG certification unless a complete audit is actually performed.

---

### Task 7: Freeze feature-specific AI-quality rubrics

**Status:** `PLANNED / NOT AUTHORIZED`

Create separate Resume, Interview and grounded Learning evaluation criteria. Learning must include supported/unsupported questions and source/citation correctness; Resume must emphasize factual preservation/relevance/actionability; Interview must emphasize role relevance, practice appropriateness, specificity and non-hiring framing.

---

### Task 8: Create frozen synthetic evaluation inputs

**Status:** `PLANNED / NOT AUTHORIZED`

Create versioned synthetic/de-identified Resume, Interview and Learning cases with case IDs and known/reference facts. Bind the usability tasks to frozen fixture identifiers without changing their task semantics. Never store real participant secrets/private documents in Git.

---

### Task 9: Prepare evidence-collection templates

**Status:** `PLANNED / NOT AUTHORIZED`

Create machine-readable templates for usability observations, SUS responses, accessibility checks and the three AI rubrics. For usability, the template must preserve at least the logical semantics frozen by Task 3:

```text
participant_id
protocol_version
task_id
validity_status
completion_status
time_seconds
recoverable_errors
assistance_count
observation_notes
```

---

### Task 10: Conduct evaluation and analyse actual results

**Status:** `PLANNED / BLOCKED BY TASK 0 AND REQUIRED DESIGN FREEZE`

Only after the applicable ethics and design gates are satisfied, conduct the permitted participant/manual/AI evaluations, preserve actual observations, calculate results reproducibly, and distinguish observed results, derived metrics, interpretation and limitations.

---

### Task 11: Produce the O7 evaluation evidence record and integration gate

**Status:** `PLANNED / NOT AUTHORIZED`

Create the final Phase 20B results/evidence record, state limitations, map findings back to O7, locally qualify the documentation/evidence diff, and stop at a separate PR/merge approval gate. Any product defect repairs remain separate branches.

---

## Phase 20B Success Criteria

Phase 20B is complete only when:

1. ethics/module conditions are explicitly documented before participant-facing work;
2. the master protocol and each detailed protocol used for collection are frozen/versioned before collection;
3. existing engineering verification is mapped accurately without being relabelled as usability/AI accuracy;
4. actual usability evidence is collected under the approved method if permitted;
5. SUS is calculated from real responses using the frozen procedure if permitted;
6. selected accessibility checks are actually completed and reported without unsupported conformance claims;
7. Resume AI quality is evaluated against frozen synthetic/de-identified cases;
8. Interview AI quality is evaluated against frozen cases;
9. grounded Learning answer/source quality is evaluated against frozen known-fact and unsupported cases;
10. participant identities, secrets, private CVs/documents and real Gemini credentials are not committed;
11. results distinguish raw observation, calculated metric, interpretation and limitation;
12. O7 is updated only to the degree supported by actual evidence;
13. no product code change is mixed into evaluation evidence branches;
14. every bounded integration branch is locally qualified before PR/merge approval.

## Current Execution Boundary

The user has authorized **Phase 20B-3 only** on the current bounded branch.

Authorized work:

- task-based usability method design;
- task wording and success/failure definitions;
- timing/error/assistance/observer/environment rules;
- current plan/progress documentation required for that protocol.

Not authorized:

- participant recruitment or participant data collection;
- usability session execution;
- SUS administration;
- participant eligibility/recruitment/sample decision;
- accessibility campaign execution;
- AI-quality rubric scoring or result collection;
- synthetic evaluation fixture creation;
- result population;
- executable product/test/config changes;
- deployment;
- PR creation before local qualification and explicit approval;
- merge;
- branch deletion.
