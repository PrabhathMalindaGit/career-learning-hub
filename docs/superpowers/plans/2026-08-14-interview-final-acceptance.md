# Phase 19B-3 Task 8 — Interview Coach Final Acceptance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove that the merged Interview Coach release candidate works meaningfully, securely, and consistently end to end, including a fresh Gemini Direct flow, human browser QA, full automated regression, and governance closeout.

**Architecture:** Task 8 is verification-first. The existing Phase 19B Interview architecture is the release candidate; no production file is scheduled for modification. Each acceptance workstream produces evidence. If a reproducible blocking defect appears, execution stops and enters a bounded systematic-debugging/TDD repair loop on this same branch before resuming the plan.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, Vitest 4 frontend; Express 5, TypeScript 5.8, Mongoose 8, Zod 3, Vitest 3 backend; MongoDB; Gemini Direct via the existing in-process job worker and progress-polling architecture.

## Global Constraints

- Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.
- Work only on `task/phase-19b3-task8-interview-final-acceptance`.
- Base branch is `phase-19b-interview-coach-refinements`.
- Starting base commit is `6d7093072d6723180720db91b6480a4d04e8eeb0`.
- PR is #14 and remains draft until final acceptance review.
- Gemini Direct only for current development.
- Live model baseline is `gemini-3.6-flash`.
- Preserve the existing in-process backend worker, polling, cancel/retry, single-flight, duplicate-suppression, and idempotency architecture.
- No SSE, WebSockets, or token streaming.
- No code execution, compilation, hidden tests, or sandboxing for Coding answers.
- No new Interview feature family, schema redesign, provider, or frontend redesign.
- No deployment is authorized.
- No `main` changes are authorized.
- Do not delete the task branch unless separately authorized.
- Never print or paste Gemini credentials, JWT secrets, encryption keys, access tokens, refresh tokens, or private user data into acceptance evidence.
- A production-code edit is allowed only after a reproducible Task 8 acceptance defect is identified. Stop the plan, invoke `superpowers:systematic-debugging`, reproduce the defect, create/retain a failing regression test, implement the smallest repair, rerun the affected gate, then resume this plan.

## Execution Environment

- **Codex:** not used for this workflow.
- **Assistant workflow:** ChatGPT + GitHub connector for repository inspection/governance; user runs local terminal and browser verification.
- **Manual terminal commands:** required for automated acceptance and local runtime.
- **Browser use:** required for the live Gemini path and human visual/interaction QA; not required for pure automated test tasks.
- **Services for automated tests:** no manually running frontend/backend servers are required; existing tests use the repository test setup.
- **Services for live/browser acceptance:** local MongoDB, backend dev server, and frontend dev server must be running. The repository defaults are MongoDB `mongodb://127.0.0.1:27017/career_learning_hub`, backend `http://localhost:8000`, and frontend `http://localhost:5173`.

## Planned File Structure

### Files created by Task 8 planning

- `docs/superpowers/specs/2026-08-14-interview-final-acceptance-design.md` — approved acceptance specification.
- `docs/superpowers/plans/2026-08-14-interview-final-acceptance.md` — this execution plan.

### Production files

- **No production source file is planned for modification.**
- If a blocking defect is reproduced, only the smallest source file(s) responsible for that defect and the focused regression test(s) needed to prove the repair may change.

### Closeout metadata

- PR #14 body will be updated with final evidence counts, live Gemini outcome, browser QA outcome, any defect-repair commits, known non-blocking warnings, final head SHA, and explicit governance state.

---

### Task 1: Baseline Preflight and Focused Interview Automation

[unchanged from approved plan]

---

### Task 2: Security, Ownership, Idempotency, and Resilience Acceptance

[unchanged from approved plan]

---

### Task 3: Start the Local Runtime for Live Acceptance

**Status: GREEN — verified 2026-08-14**

- MongoDB port `127.0.0.1:27017`: OPEN
- Backend connected to `career_learning_hub` and started on port `8000`
- Job worker enabled
- Gemini provider configured
- Frontend Vite server started on `http://localhost:5173/`
- Normal authenticated API requests returned successful responses
- No credentials or secrets recorded in acceptance evidence

---

### Task 4: Fresh Live Gemini Direct Acceptance

**Files:**
- Exercise through UI: `frontend/src/features/interviews/InterviewCreateDialog.tsx`
- Exercise through UI: `frontend/src/features/interviews/InterviewSessionWorkspace.tsx`
- Runtime path: existing Interview API, job queue/worker, Gemini Direct provider, and MongoDB persistence.
- No source edit planned.

**Interfaces:**
- Consumes: healthy runtime from Task 3 and configured Gemini Direct credential.
- Produces: fresh live evidence that generation, explanation, feedback, typed question storage, starter code, MCQ privacy, and polling work through the real application path.

- [ ] **Step 1: Create a fresh Task 8 acceptance session**

In the browser, create a new Interview session with this bounded context:

```text
Career area: Technology & IT
Target role: Backend Developer
Experience: Mid-level
Mode: Written practice
Focus topics: API design, Reliability
Skill gaps: Concurrency
```

Use a clear title such as `Task 8 Live Gemini Acceptance`. This session must be newly created during Task 8.

- [ ] **Step 2: Configure a six-question exact distribution**

In Build the Briefing:

```text
Question count: 6
Multiple Choice: 1
Short Answer: 1
Coding: 1
Behavioral: 1
Scenario-Based: 1
Technical Explanation: 1
```

Keep the approved session-context categories selected unless deliberately testing category editing.

- [ ] **Step 3: Generate exactly once**

Click `Generate questions` once. Observe queued/processing/completed progress. Do not double-click or issue a second generation request while the first intent is active.

Acceptance:
- one deliberate user intent;
- one final generated set;
- exactly six questions;
- exactly one of each modern type;
- prompts are usable for the selected role/context;
- no duplicate set appears.

- [ ] **Step 4: Verify the generated Coding question**

Open the Coding question and verify:
- starter code is present;
- starter code is bounded scaffolding rather than a completed solution;
- Copy works;
- Insert into answer works;
- the answer remains text-only;
- no Run/Compile/Execute behavior or claim is present.

- [ ] **Step 5: Verify MCQ secrecy before saving an attempt**

Open the Multiple Choice question before submitting an answer. Verify:
- A/B/C/D-style option presentation is visually correct;
- one option may be selected, but the correct answer is not disclosed;
- no MCQ AI-feedback action is visible;
- pre-attempt explanation behavior follows the approved lock rule.

- [ ] **Step 6: Save one MCQ attempt and verify deterministic post-attempt result**

Select one option and save the attempt. Verify the saved result reports the deterministic outcome and canonical correct-answer context only after the allowed attempt boundary. Do not infer correctness from Gemini feedback; MCQ evaluation is backend-deterministic.

- [ ] **Step 7: Request one fresh non-MCQ explanation**

Choose a non-MCQ question with no existing explanation and click the normal explanation action once. Verify progress/status behavior and that the completed explanation remains bound to the selected question.

- [ ] **Step 8: Save one non-MCQ attempt and request feedback**

Use Short Answer or Technical Explanation. Save the attempt, then request feedback once. Verify:
- the attempt remains a separate immutable saved record;
- feedback remains bound to that attempt/question;
- progress completes through the existing polling UX;
- the UI presents model-generated practice guidance with the existing non-hiring-prediction disclaimer;
- completed score/summary/strengths/improvements/outline render from the canonical result.

- [ ] **Step 9: Record live acceptance outcome**

Record only:
- session title or safe local identifier if useful;
- requested/final type distribution;
- generation success/failure;
- Coding starter-code PASS/FAIL;
- MCQ pre-submit secrecy PASS/FAIL;
- deterministic MCQ post-attempt result PASS/FAIL;
- explanation PASS/FAIL;
- feedback PASS/FAIL;
- polling/status PASS/FAIL.

Do not record credential values, auth tokens, raw cookies, or private user data.

---

### Task 5: Human Browser QA Across Career Areas and Answer Experiences

[continues in approved plan]
