# Phase 20B — University Evaluation Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close Objective O7 with reproducible, ethically controlled university evaluation evidence covering functionality, usability, accessibility, and AI-assisted output quality without modifying the qualified application unless a separately approved defect repair becomes necessary.

**Architecture:** Preserve the qualified Career Learning Hub executable tree and build the evaluation as a documentation/evidence layer around it. Engineering verification remains one evidence stream; participant usability/SUS evidence, selected accessibility checks, and feature-specific AI-quality rubrics are collected separately so no test count is misrepresented as usability or AI accuracy. Participant data collection is blocked until the module/supervisor ethics requirements are explicitly confirmed.

**Tech Stack:** Markdown evaluation records, CSV evidence templates, existing React/TypeScript/Express/MongoDB/Gemini application as the artefact under evaluation, existing Vitest/Testing Library/Supertest verification evidence, and manual/browser evaluation only in later separately authorized tasks.

## Global Constraints

- Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.
- Repository: `PrabhathMalindaGit/career-learning-hub`.
- Phase 20B-0/1 was completed and merged through PR #35.
- Current Phase 20B-2 branch: `phase-20b-2-engineering-evidence-matrix`.
- Phase 20B-2 branch base: `main @ c64a37828e6175b122115199d8849b42faa7ca9d`.
- Current qualified executable checkpoint remains `6b80f91d7016971d58ed9628e8818fabf00d1cd2`; PR #34 and PR #35 changed documentation only.
- Objective O7 is the controlling evaluation objective: evaluate functionality, usability, accessibility, and AI-assisted output quality.
- Existing engineering verification is evidence of tested software behaviour only; it is not a usability score, AI factual-accuracy percentage, full WCAG-conformance claim, production uptime guarantee, penetration test, or independent security certification.
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
- Product source, tests, packages/dependencies, runtime/build configuration, schemas, APIs, provider/credential/security behaviour and deployment resources remain out of scope for Phase 20B-2.
- If evaluation later exposes a product defect, record it and use a separate bounded repair branch; do not mix product repair with evaluation evidence collection.
- Current authorization covers **Task 2 only**. Tasks 3–11 remain planned and require later explicit authorization. Participant-facing work remains blocked by Task 0 until authoritative guidance is recorded.

---

## File Structure

### Completed Phase 20B-0/1 files

- `docs/evaluation/PHASE_20B_ETHICS_AND_PARTICIPANT_SAFETY_GATE.md`
- `docs/evaluation/PHASE_20B_UNIVERSITY_EVALUATION_PROTOCOL.md`
- `docs/superpowers/plans/2026-08-16-phase-20b-university-evaluation-evidence.md`
- `docs/planning/CURRENT_PHASE.md`

### Current Phase 20B-2 files

- Create: `docs/evaluation/PHASE_20B_ENGINEERING_EVIDENCE_MATRIX.md` — maps existing engineering verification to the functionality component of O7 and records safe claims/limitations.
- Modify: `docs/planning/CURRENT_PHASE.md` — activate Phase 20B-2 and preserve the ethics/participant boundary.
- Modify: `docs/superpowers/plans/2026-08-16-phase-20b-university-evaluation-evidence.md` — advance the plan/progress pointer through Task 2.

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

**Status:** `COMPLETED / MERGED VIA PR #35 / GATE REMAINS BLOCKED`

The repository records:

`BLOCKED / AWAITING MODULE OR SUPERVISOR CONFIRMATION`

No participant recruitment or participant-derived data collection is permitted until authoritative guidance and any required approval/consent/data-management conditions are recorded.

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

It binds engineering evidence to the current qualified executable checkpoint and prevents engineering pass counts from being relabelled as usability, accessibility-conformance or AI-quality results.

---

### Task 2: Map existing engineering evidence to O7

**Status:** `AUTHORIZED / IMPLEMENTED ON phase-20b-2-engineering-evidence-matrix / AWAITING LOCAL QUALIFICATION`

**Files:**
- Create: `docs/evaluation/PHASE_20B_ENGINEERING_EVIDENCE_MATRIX.md`
- Modify: `docs/planning/CURRENT_PHASE.md`
- Modify: this plan file.

**Interfaces:**
- Consumes: current executable qualification, Phase 20A release/evidence freeze, existing browser/human-QA provenance, master O7 evaluation protocol.
- Produces: a traceable evidence matrix for Stream A — Engineering functionality evidence.

- [x] **Step 1: Bind the matrix to the exact current executable identity**

Record current Phase 20B-2 base `main @ c64a37828e6175b122115199d8849b42faa7ca9d` and current qualified executable checkpoint `6b80f91d7016971d58ed9628e8818fabf00d1cd2`.

- [x] **Step 2: Record non-overlapping final automated evidence**

Preserve:

```text
Backend complete suite: 515/515 PASS
Frontend complete suite: 1,170/1,170 PASS
Non-overlapping total: 1,685 PASS
Backend security regression: 43/43 PASS
Typechecks/builds: PASS
```

Do not double-count backend unit/integration/security subset runs.

- [x] **Step 3: Map major functionality areas**

Map Authentication, Dashboard, Resume Studio, Resume AI workflow controls, Interview Coach, Learning Workspace, Settings/Gemini, ownership/private assets, background jobs, validation/request diagnostics, security regressions and responsive/accessibility-oriented engineering behaviour.

- [x] **Step 4: Map human/live engineering provenance**

Use the Phase 20A evidence chain for integrated Phase 19G live-browser QA and focused visual approval of the only later visible Resume assessment presentation change.

- [x] **Step 5: Preserve claim boundaries**

Explicitly separate Stream A evidence from:

- participant usability/SUS;
- full accessibility conformance;
- AI factual/usefulness quality;
- penetration testing/security certification;
- production uptime/scalability;
- exact-current-build deployment claims.

- [x] **Step 6: Add report-ready bounded engineering statements**

Provide statements that can later be reused in report evidence without overstating the method.

- [x] **Step 7: Update current planning/progress pointers**

Keep the ethics gate blocked and Tasks 3–11 inactive.

- [ ] **Step 8: Local documentation-only qualification**

User must verify:

```bash
cd "/Users/prabhathmalinda/Documents/Projects/Career Learning Hub"

git fetch origin
git switch phase-20b-2-engineering-evidence-matrix
git pull --ff-only origin phase-20b-2-engineering-evidence-matrix

echo "=== HEAD ==="
git rev-parse HEAD

echo "=== STATUS ==="
git status --short

echo "=== CHANGED FILES ==="
git --no-pager diff --name-only origin/main...HEAD

echo "=== NON-DOCUMENTATION CHANGE CHECK — EXPECT NO OUTPUT ==="
git --no-pager diff --name-only origin/main...HEAD | grep -Ev '^docs/' || true

echo "=== DIFF CHECK — EXPECT NO OUTPUT ==="
git --no-pager diff --check origin/main...HEAD

echo "=== FINAL HEAD ==="
git rev-parse HEAD

echo "=== FINAL STATUS — EXPECT NO OUTPUT ==="
git status --short
```

Expected changed files are exactly:

```text
docs/evaluation/PHASE_20B_ENGINEERING_EVIDENCE_MATRIX.md
docs/planning/CURRENT_PHASE.md
docs/superpowers/plans/2026-08-16-phase-20b-university-evaluation-evidence.md
```

No application test rerun is required if the branch remains documentation-only.

- [ ] **Step 9: PR/merge gates**

PR creation requires explicit user approval after local qualification. Merge requires a later separate approval of the exact qualified head SHA.

---

### Task 3: Freeze task-based usability evaluation

**Status:** `PLANNED / NOT AUTHORIZED`

Define representative tasks for navigation, Resume, Interview, grounded Learning, and study-material workflows; freeze success/partial/fail rules, timing method, assistance/error recording, observer instructions, and evaluation environment before the first participant session.

---

### Task 4: Freeze SUS procedure

**Status:** `PLANNED / NOT AUTHORIZED / PARTICIPANT USE BLOCKED BY TASK 0`

Use the standard 10-item SUS procedure only after the ethics gate permits participant questionnaires. Preserve raw responses and reproducible scoring; report the resulting 0–100 SUS score as a score, not a percentage.

---

### Task 5: Freeze participant/sample plan

**Status:** `PLANNED / NOT AUTHORIZED / BLOCKED BY TASK 0`

Choose participant eligibility, recruitment, target count, sample description and stopping rule only after authoritative ethics/module guidance and realistic recruitment feasibility are known.

---

### Task 6: Freeze selected accessibility protocol

**Status:** `PLANNED / NOT AUTHORIZED`

Create a bounded checklist for keyboard-only use, focus visibility/management, labels/instructions, validation/error identification, status messaging, 200% zoom/reflow, mobile/reduced-width navigation, and critical Resume/Interview/Learning/Settings flows. Keep the claim boundary below formal full WCAG certification unless a complete audit is actually performed.

---

### Task 7: Freeze feature-specific AI-quality rubrics

**Status:** `PLANNED / NOT AUTHORIZED`

Create separate Resume, Interview, and grounded Learning evaluation criteria. Learning must include supported/unsupported questions and source/citation correctness; Resume must emphasise factual preservation/relevance/actionability; Interview must emphasise role relevance, practice appropriateness, specificity, and non-hiring framing.

---

### Task 8: Create frozen synthetic evaluation inputs

**Status:** `PLANNED / NOT AUTHORIZED`

Create versioned synthetic/de-identified Resume, Interview, and Learning cases with case IDs and known/reference facts. Never store real participant secrets or private documents in Git.

---

### Task 9: Prepare evidence-collection templates

**Status:** `PLANNED / NOT AUTHORIZED`

Create machine-readable CSV templates for usability observations, SUS responses, accessibility checks, and the three AI rubrics. Define columns and allowed values before any evaluation result is entered.

---

### Task 10: Conduct evaluation and analyse actual results

**Status:** `PLANNED / BLOCKED BY TASK 0 AND REQUIRED DESIGN FREEZE`

Only after the ethics gate and all relevant protocols are frozen, conduct the permitted participant/manual/AI evaluations, preserve real observations, calculate results reproducibly, and distinguish observed results, calculated metrics, interpretation and limitations.

---

### Task 11: Produce the O7 evaluation evidence record and integration gate

**Status:** `PLANNED / NOT AUTHORIZED`

Create the final Phase 20B results/evidence record, state limitations, map findings back to O7, locally qualify the documentation/evidence diff, and stop at a separate PR/merge approval gate. Any product defect repairs remain separate branches.

---

## Phase 20B Success Criteria

Phase 20B is complete only when:

1. Ethics/module conditions are explicitly documented before participant-facing work.
2. The master protocol is frozen before evidence collection.
3. Existing engineering verification is mapped accurately without being relabelled as usability/AI accuracy.
4. Actual usability evidence is collected under the approved method if permitted.
5. SUS is calculated from real responses using a reproducible procedure if permitted.
6. Selected accessibility checks are completed and reported without unsupported conformance claims.
7. Resume AI quality is evaluated against frozen synthetic/de-identified cases and criteria.
8. Interview AI quality is evaluated against frozen synthetic/de-identified cases and criteria.
9. Grounded Learning answer/source quality is evaluated against frozen known-fact cases including unsupported questions.
10. No participant identity, secret, private CV/document, or real Gemini credential is committed.
11. Results distinguish raw observation, calculated metric, interpretation, and limitation.
12. O7 is updated only to the degree supported by actual evidence.
13. No product code change is mixed into the evaluation evidence branches.
14. Every bounded integration branch is locally qualified before PR/merge approval.

## Current Execution Boundary

The user has authorized **Phase 20B-2 only** on the current bounded branch.

Authorized work:

- engineering evidence-to-O7 mapping;
- current plan/progress documentation required for that mapping.

Not authorized:

- participant recruitment or participant data collection;
- usability sessions or SUS administration;
- participant/sample-size decision;
- accessibility campaign execution;
- AI-quality campaign/rubric scoring;
- synthetic evaluation dataset creation;
- result population;
- executable product/test/config changes;
- deployment;
- PR creation before local qualification/explicit approval;
- merge;
- branch deletion.
