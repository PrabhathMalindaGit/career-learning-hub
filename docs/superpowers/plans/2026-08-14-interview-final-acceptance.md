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

**Files:**
- Read: `package.json`
- Read: `backend/package.json`
- Read: `frontend/package.json`
- Test: `backend/src/tests/unit/interviewQuestionDistribution.test.ts`
- Test: `backend/src/tests/unit/interviewQuestionTypes.test.ts`
- Test: `backend/src/tests/integration/interviewQuestionTypes.integration.test.ts`
- Test: `backend/src/tests/integration/interviewFeedbackTypes.integration.test.ts`
- Test: `backend/src/tests/integration/interviewStarterCode.integration.test.ts`
- Test: `backend/src/tests/integration/crossUserAccess.integration.test.ts`
- Test: `frontend/src/features/interviews/*.test.ts`
- Test: `frontend/src/features/interviews/*.test.tsx`
- Test: `frontend/src/features/jobs/JobResilienceActions.test.tsx`

**Interfaces:**
- Consumes: merged Phase 19B Interview implementation at base commit `6d7093072d6723180720db91b6480a4d04e8eeb0` plus Task 8 documentation commits.
- Produces: a focused GREEN/FAIL classification for the six modern question types, typed attempts, MCQ evaluation/secrecy, starter code, feedback, role/category/distribution UX, resilience actions, and ownership boundaries.

- [ ] **Step 1: Verify branch, ancestry, and clean tree**

Run from the repository root:

```bash
cd "/Users/prabhathmalinda/Documents/Projects/Career Learning Hub"

git fetch origin
git switch task/phase-19b3-task8-interview-final-acceptance
git pull --ff-only

echo "===== TASK 8 BASELINE ====="
git branch --show-current
git rev-parse HEAD
git merge-base --is-ancestor \
  6d7093072d6723180720db91b6480a4d04e8eeb0 \
  HEAD && echo "PHASE_BASE_ANCESTOR=PASS"
git status --short
```

Expected:
- branch is `task/phase-19b3-task8-interview-final-acceptance`;
- `PHASE_BASE_ANCESTOR=PASS`;
- `git status --short` prints nothing.

- [ ] **Step 2: Run the focused backend Interview acceptance set**

```bash
npm run test --workspace @career-learning-hub/api -- \
  src/tests/unit/interviewQuestionDistribution.test.ts \
  src/tests/unit/interviewQuestionTypes.test.ts \
  src/tests/integration/interviewQuestionTypes.integration.test.ts \
  src/tests/integration/interviewFeedbackTypes.integration.test.ts \
  src/tests/integration/interviewStarterCode.integration.test.ts \
  src/tests/integration/crossUserAccess.integration.test.ts
```

Expected: every selected test file and test passes. Do not continue past a deterministic failure.

- [ ] **Step 3: Run the focused frontend Interview acceptance set**

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/interviews \
  src/features/jobs/JobResilienceActions.test.tsx
```

Expected: every Interview feature test plus the shared resilience-action test passes.

- [ ] **Step 4: Classify warnings without weakening failures**

If Vitest prints warnings but exits successfully, record the warning text and owning feature. A warning from unrelated Resume/Learning code may be deferred only if its tests still pass and it does not affect Interview correctness/security. A failing test must be investigated even if it initially appears unrelated.

- [ ] **Step 5: Check the tree again**

```bash
git status --short
```

Expected: no output. Automated verification must not mutate tracked repository files.

---

### Task 2: Security, Ownership, Idempotency, and Resilience Acceptance

**Files:**
- Test: `backend/src/tests/integration/crossUserAccess.integration.test.ts`
- Test: `backend/src/tests/integration/interviewQuestionTypes.integration.test.ts`
- Test: `backend/src/tests/integration/interviewStarterCode.integration.test.ts`
- Test: `backend/src/tests/integration/jobExecutionFence.integration.test.ts`
- Test: `backend/src/tests/integration/jobResponse.integration.test.ts`
- Test: `backend/src/tests/integration/aiRetryAndPersistence.integration.test.ts`
- Test: `frontend/src/features/interviews/InterviewSessionWorkspace.test.tsx`
- Test: `frontend/src/features/interviews/interviewPolling.test.ts`
- Test: `frontend/src/features/jobs/jobResilience.test.ts`
- Test: `frontend/src/features/jobs/JobResilienceActions.test.tsx`

**Interfaces:**
- Consumes: existing auth/ownership filters, typed Interview schemas, job fences, polling helpers, and stale-route/selection guards.
- Produces: negative acceptance evidence for cross-user isolation, MCQ secrecy/evaluation, malformed/generated Coding starter-code validation, stale async suppression, and retry/cancel/idempotency behavior.

- [ ] **Step 1: Run backend negative/resilience coverage**

```bash
npm run test --workspace @career-learning-hub/api -- \
  src/tests/integration/crossUserAccess.integration.test.ts \
  src/tests/integration/interviewQuestionTypes.integration.test.ts \
  src/tests/integration/interviewStarterCode.integration.test.ts \
  src/tests/integration/jobExecutionFence.integration.test.ts \
  src/tests/integration/jobResponse.integration.test.ts \
  src/tests/integration/aiRetryAndPersistence.integration.test.ts
```

Expected: PASS. Relevant assertions must continue to prove cross-user denial, bounded schema validation, deterministic MCQ behavior, and job execution fences.

- [ ] **Step 2: Run frontend stale-response/polling/resilience coverage**

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/interviews/InterviewSessionWorkspace.test.tsx \
  src/features/interviews/interviewPolling.test.ts \
  src/features/jobs/jobResilience.test.ts \
  src/features/jobs/JobResilienceActions.test.tsx
```

Expected: PASS, including the route/question/attempt stale-response guards and UUID/polling/cancel/retry expectations already encoded in the suite.

- [ ] **Step 3: Inspect the pre-submit MCQ boundary if automated evidence is ambiguous**

Only if the focused tests do not clearly demonstrate the property, inspect the existing serializer/API contract and verify that list/detail responses before the allowed post-attempt context do not expose the private correct answer material. Do not add a duplicate test when the existing integration test already proves the invariant.

- [ ] **Step 4: Stop on any blocking security mismatch**

If cross-user access, MCQ secrecy, deterministic MCQ scoring, unsafe Coding execution, or stale-response entity binding fails, do not proceed to live Gemini acceptance. Enter the defect-repair loop first.

---

### Task 3: Start the Local Runtime for Live Acceptance

**Files:**
- Read: `backend/.env`
- Reference only: `backend/.env.example`
- No tracked-file modification planned.

**Interfaces:**
- Consumes: the user's existing local MongoDB and approved Gemini credential/settings configuration.
- Produces: a healthy local application at frontend `http://localhost:5173` and backend `http://localhost:8000`, with the in-process worker available for Gemini jobs.

- [ ] **Step 1: Verify local configuration without printing secrets**

Do **not** run `cat backend/.env`. Confirm manually that the local environment contains valid development values for MongoDB, JWT/auth, asset signing, and the existing Gemini/BYOK path. The repository example uses:

```text
PORT=8000
MONGODB_URI=mongodb://127.0.0.1:27017/career_learning_hub
CLIENT_ORIGINS=http://localhost:5173
GEMINI_MODEL=gemini-3.6-flash
AI_ROUTING_FOUNDATION_ENABLED=true
JOB_WORKER_ENABLED=true
```

The actual credential must remain private.

- [ ] **Step 2: Ensure MongoDB is running**

Use the user's normal local MongoDB startup method. Verify availability without exposing data or credentials. If MongoDB is already running, do not restart it unnecessarily.

- [ ] **Step 3: Start the backend dev server in Terminal A**

```bash
cd "/Users/prabhathmalinda/Documents/Projects/Career Learning Hub"
npm run dev:backend
```

Expected: backend starts on the configured local port and the worker initializes according to current configuration. Keep Terminal A running for Tasks 4 and 5.

- [ ] **Step 4: Start the frontend dev server in Terminal B**

```bash
cd "/Users/prabhathmalinda/Documents/Projects/Career Learning Hub"
npm run dev:frontend
```

Expected: Vite serves the frontend, normally at `http://localhost:5173`. Keep Terminal B running for Tasks 4 and 5.

- [ ] **Step 5: Open the application and authenticate through the normal UI**

Use the existing local development account. Do not paste credentials into chat. If the app requests Gemini setup, use the application's approved Settings/credential flow rather than placing a key into a URL, console command, screenshot, or message.

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

**Files:**
- Exercise: `frontend/src/features/interviews/InterviewCreateDialog.tsx`
- Exercise: `frontend/src/features/interviews/InterviewRoleSelector.tsx`
- Exercise: `frontend/src/features/interviews/InterviewQuestionTypeControls.tsx`
- Exercise: `frontend/src/features/interviews/InterviewCategorySelector.tsx`
- Exercise: `frontend/src/features/interviews/InterviewAnswerControl.tsx`
- Exercise: `frontend/src/features/interviews/InterviewStructuredAnswerFields.tsx`
- Exercise: `frontend/src/features/interviews/InterviewSessionWorkspace.tsx`
- No source edit planned.

**Interfaces:**
- Consumes: live local frontend/backend runtime.
- Produces: human evidence for usability, visual integrity, responsive layout, canonical role authoring, structured answers, notes/attempts/lifecycle, and archive/restore behavior.

- [ ] **Step 1: Verify representative Career areas in Create Interview**

Open Create Interview and check these areas without necessarily creating a session for each:

```text
Technology & IT
Finance & Accounting
Healthcare
Education & Training
Engineering
Other / Custom
```

For each relevant area, verify scoped representative roles and local Focus/Skill suggestions.

- [ ] **Step 2: Verify role-authoring state rules**

Confirm:
- initial Career area is empty;
- Target role is unavailable until an area is selected;
- selecting a built-in role creates one canonical selected role;
- typing a divergent custom role clears the previous selected role;
- custom role is selected only after explicit `Use “…”` adoption;
- changing Career area clears selected role and uncommitted role query;
- a user-owned title survives area changes;
- Focus/Skill suggestions remain optional;
- already selected Focus/Skill values are preserved as approved;
- Mid-level is the default experience level.

- [ ] **Step 3: Verify Build the Briefing authoring**

Confirm:
- session-context categories are initially suggested/preselected as approved;
- selected custom categories have equal chip treatment;
- all categories can intentionally be deselected;
- Question Type tiles remain readable/responsive;
- Balanced vs Exact behavior is understandable;
- changing Question count clears stale explicit exact counts;
- invalid exact totals cannot be submitted.

- [ ] **Step 4: Verify Behavioral structured answer**

Open a Behavioral question and verify Situation, Task, Action, Result fields. Enter at least one meaningful field and save. Confirm the saved attempt preserves the structured headings/newlines and remains a separate record.

- [ ] **Step 5: Verify Scenario-Based structured answer**

Open a Scenario-Based question and verify Assessment, Approach, Trade-offs, Decision fields. Enter a partial or complete answer and confirm the existing typed-text serialization behaves meaningfully.

- [ ] **Step 6: Verify Technical Explanation structured answer**

Open a Technical Explanation question and verify Concept, How it works, Example, Trade-offs / limitations fields. Confirm the combined character limit and saved newline-preserving representation behave correctly.

- [ ] **Step 7: Verify Question Index, notes, pinning, and attempts**

Confirm:
- Question Index is bounded/scrollable when content requires it;
- visible question numbering is correct;
- truncated index prompt never replaces the full Practice Desk prompt;
- Private notes expand/collapse correctly;
- dirty notes cannot be accidentally hidden;
- pin/unpin remains bound to the selected question;
- Saved Attempts remain separate historical records;
- structured saved text keeps line breaks.

- [ ] **Step 8: Verify lifecycle and restore behavior**

Use a disposable Task 8 session if needed. Verify completed/archived states have the approved read-mostly/read-only behavior and that an archived session can be restored using the existing list/card Restore action.

- [ ] **Step 9: Verify responsive sanity**

Check normal desktop width and one narrow/mobile-like width. Acceptance requires no Task 7R Interview-induced horizontal overflow, sensible stacking, readable MCQ cards, usable structured fields, and visible primary actions.

- [ ] **Step 10: Capture browser QA evidence**

Provide screenshots only where they prove a visual or interaction requirement. Do not expose secrets. At minimum, retain evidence for:
- one cross-industry wizard state;
- all-six-type generated session summary/index;
- Coding starter code;
- MCQ pre/post-attempt state;
- one structured-answer screen;
- narrow/mobile-like sanity if any layout concern exists.

---

### Task 6: Full Final Regression, Typechecks, and Production Builds

**Files:**
- Test/build through repository scripts only.
- No source modification planned.

**Interfaces:**
- Consumes: green focused automation and green live/browser acceptance.
- Produces: final repository-wide release-candidate evidence at one exact Task 8 head SHA.

- [ ] **Step 1: Stop development servers if they are no longer needed**

After live/browser acceptance is complete, stop the frontend/backend dev processes cleanly. MongoDB may remain running if the normal test environment needs or tolerates it; existing automated tests use their configured test setup.

- [ ] **Step 2: Record the exact verification head**

```bash
cd "/Users/prabhathmalinda/Documents/Projects/Career Learning Hub"

echo "===== TASK 8 FINAL HEAD ====="
git branch --show-current
git rev-parse HEAD
git status --short
```

Expected: Task 8 branch and clean tree.

- [ ] **Step 3: Run the full backend regression**

```bash
npm run test --workspace @career-learning-hub/api
```

Expected: all backend tests pass.

- [ ] **Step 4: Run backend source + test typechecks**

```bash
npm run typecheck:all --workspace @career-learning-hub/api
```

Expected: PASS.

- [ ] **Step 5: Run the backend production build**

```bash
npm run build --workspace @career-learning-hub/api
```

Expected: PASS.

- [ ] **Step 6: Run the full frontend regression**

```bash
npm run test --workspace @career-learning-hub/web
```

Expected: all frontend test files and tests pass. Record exact counts from Vitest output.

- [ ] **Step 7: Run frontend typecheck**

```bash
npm run typecheck --workspace @career-learning-hub/web
```

Expected: PASS.

- [ ] **Step 8: Run the frontend production build**

```bash
npm run build --workspace @career-learning-hub/web
```

Expected: PASS. Existing non-fatal Vite chunk-size or dynamic-import warnings may be recorded if the build exits successfully and they are unrelated to Interview correctness.

- [ ] **Step 9: Run final diff and tree checks**

```bash
echo "===== FINAL DIFF CHECK ====="
git diff --check origin/phase-19b-interview-coach-refinements...HEAD

echo "===== FINAL TREE ====="
git branch --show-current
git rev-parse HEAD
git status --short
```

Expected:
- no `git diff --check` output;
- correct Task 8 branch;
- final head recorded;
- clean tree.

---

### Task 7: Final Review, Evidence Closeout, and Merge Gate

**Files:**
- Modify PR metadata only: PR #14 body.
- Review: all Task 8 changed files relative to `phase-19b-interview-coach-refinements`.
- No deployment or branch deletion.

**Interfaces:**
- Consumes: complete evidence from Tasks 1–6 and any defect-repair commits.
- Produces: an auditable final Task 8 verdict and a separate merge-approval gate.

- [ ] **Step 1: Compare the final branch to the phase branch**

Use GitHub compare/PR review to verify that the branch contains only:
- Task 8 spec/plan documentation;
- any acceptance evidence metadata/documentation intentionally committed;
- any narrowly justified defect repair plus focused regression coverage.

Any unrelated source change is a blocker until removed or separately authorized.

- [ ] **Step 2: Review every production patch if defects were repaired**

For each production change, verify:
- it corresponds to a reproduced acceptance defect;
- a focused regression test proves the repair;
- architecture/security invariants are preserved;
- no opportunistic refactor or extra feature entered Task 8.

If Task 8 required no production repair, explicitly record `PRODUCTION_CODE_CHANGES: NONE`.

- [ ] **Step 3: Update PR #14 body with final evidence**

The PR body must state exact values for:

```text
FINAL_HEAD_SHA: <actual Task 8 head>
FOCUSED_INTERVIEW_BACKEND: PASS with counts
FOCUSED_INTERVIEW_FRONTEND: PASS with counts
SECURITY_OWNERSHIP_RESILIENCE: PASS
FULL_BACKEND: PASS with counts
FULL_FRONTEND: PASS with counts
BACKEND_TYPECHECK: PASS
FRONTEND_TYPECHECK: PASS
BACKEND_BUILD: PASS
FRONTEND_BUILD: PASS
LIVE_GEMINI_GENERATION: PASS
LIVE_SIX_TYPE_DISTRIBUTION: PASS
LIVE_CODING_STARTER_CODE: PASS
MCQ_PRE_SUBMIT_SECRECY: PASS
MCQ_DETERMINISTIC_RESULT: PASS
LIVE_EXPLANATION: PASS
LIVE_FEEDBACK: PASS
BROWSER_QA: PASS
RESPONSIVE_QA: PASS
DIFF_CHECK: PASS
WORKING_TREE: CLEAN
PRODUCTION_CODE_CHANGES: NONE or exact repair summary
NON_BLOCKING_WARNINGS: exact known warnings or NONE
DEPLOYMENT: NOT AUTHORIZED / NOT PERFORMED BY TASK 8
MAIN_BRANCH: UNCHANGED
```

Replace every value with actual evidence before closeout; do not leave angle-bracket placeholders in the final PR body.

- [ ] **Step 4: Check GitHub PR state and external statuses**

Verify PR #14 remains open/unmerged and targets `phase-19b-interview-coach-refinements`. Classify external deployment/build statuses by evidence. A provider quota/rate-limit status must not be described as an application regression, but Task 8 itself does not authorize a deployment retry.

- [ ] **Step 5: Perform final code review**

No unresolved Blocking or Important Task 8 issue may remain. If a new issue is found, return to the defect-repair loop and rerun the affected acceptance gate plus the final gate as needed.

- [ ] **Step 6: Present the Task 8 acceptance verdict to the user**

State one of:

```text
TASK_8_ACCEPTANCE: APPROVED_FOR_MERGE
```

or

```text
TASK_8_ACCEPTANCE: BLOCKED
REASON: <specific evidence-backed blocker>
```

- [ ] **Step 7: Keep merge authorization separate**

Even after `APPROVED_FOR_MERGE`, do not merge automatically. Require the user's explicit separate Task 8 merge approval. Merge only into `phase-19b-interview-coach-refinements`. Do not merge to `main`, deploy, or delete the task branch.

---

## Defect-Repair Loop Used by Any Task

This loop is conditional and is invoked only when an acceptance gate produces reproducible failure evidence.

1. Stop the current acceptance sequence.
2. Invoke `superpowers:systematic-debugging`.
3. Re-run the smallest failing test or browser reproduction until the failure is understood.
4. Trace the failing state/data flow to its source.
5. If the defect is real, retain or add one focused failing regression test that demonstrates the bug.
6. Invoke `superpowers:test-driven-development` for the repair.
7. Change the smallest production surface that fixes the root cause.
8. Run the focused regression to GREEN.
9. Run adjacent Interview tests affected by the repair.
10. Run typecheck/build if production TypeScript changed.
11. Commit the repair on the Task 8 branch with a narrow message.
12. Update PR #14 scope/evidence so it accurately records the defect and repair.
13. Resume the acceptance plan at the gate that failed.
14. Before final closeout, rerun the full Task 6 gate at the final repaired head.

## Plan Self-Review Result

- **Spec coverage:** Tasks 1–7 cover baseline, focused automation, security/negative acceptance, live Gemini generation, all six modern types, Coding starter code, MCQ secrecy/evaluation, explanation, feedback, resilience, cross-industry/browser QA, structured answers, lifecycle/restore, responsive QA, full regression/builds, evidence, final review, and separate merge approval.
- **Placeholder scan:** no implementation placeholder remains. The only variable values are runtime evidence that must be replaced with actual observed values during PR closeout; the plan explicitly prohibits leaving them unresolved in the final PR body.
- **Type/interface consistency:** this plan introduces no new production API or type. It consumes the existing Interview/session/question/attempt/job contracts only.
- **Scope check:** Task 8 remains one bounded acceptance/closeout task. Any discovered production defect is handled as a narrow repair loop rather than expanding the planned feature scope.
