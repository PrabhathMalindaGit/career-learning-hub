# Phase 19B — Interview Coach Refinements Closeout Documentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconcile Phase 19B governance documentation so the repository truthfully records that Interview Coach Refinements are complete and accepted on the phase branch, while keeping the later `main` integration as a separate unperformed governance action.

**Architecture:** This is a documentation-only closeout. The implementation will modify the top authority block in `docs/planning/CURRENT_PHASE.md` and create one dedicated Phase 19B closeout record following the established Phase 19A-4 pattern. No executable source, tests, configuration, dependencies, deployment state, or `main` branch content will change.

**Tech Stack:** Git/GitHub and Markdown only. No application runtime, package manager, database, browser, Gemini call, or production service is required.

## Global Constraints

- Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.
- Work only on `task/phase-19b-closeout-documentation`.
- Base branch is `phase-19b-interview-coach-refinements`.
- Starting phase checkpoint is `5da65534e1f07f7905310d70272af068c71c4d42`.
- Draft PR is #15 and targets only `phase-19b-interview-coach-refinements`.
- Do not modify production source, test source, package manifests, lockfiles, environment files, deployment configuration, migrations, or shared types.
- Do not rerun the 1,523 executable tests unless an unexpected non-documentation change is introduced.
- Do not deploy.
- Do not merge to `main` from this task branch.
- Do not delete task branches.
- Preserve historical planning records below the top `CURRENT_PHASE.md` authority block.
- Do not claim that Phase 19B is merged to `main` until the later phase-level PR is separately approved and merged.
- Do not activate Phase 19C or another future phase.

## Planned File Structure

### Process artifacts already present

- `docs/superpowers/specs/2026-08-14-phase-19b-closeout-documentation-design.md` — approved closeout specification.
- `docs/superpowers/plans/2026-08-14-phase-19b-closeout-documentation.md` — this implementation plan.

### Governance files implemented by this plan

- Modify: `docs/planning/CURRENT_PHASE.md` — reconcile only the top Phase 19B authority block.
- Create: `docs/planning/PHASE_19B_INTERVIEW_COACH_REFINEMENTS_CLOSEOUT.md` — durable Phase 19B closeout record.

---

### Task 1: Reconcile the Phase 19B Authority Block

**Files:**
- Modify: `docs/planning/CURRENT_PHASE.md`
- Reference: `docs/planning/PHASE_19A_4_CANDIDATE_PHOTO_SUPPORT_CLOSEOUT.md`

**Interfaces:**
- Consumes: the approved Phase 19B closeout specification and accepted Task 8 evidence.
- Produces: a truthful top authority block that later Phase 19B-to-`main` reviewers can treat as the current governance state.

- [ ] **Step 1: Fetch and inspect the current top authority block**

Read the beginning of `docs/planning/CURRENT_PHASE.md` and verify that it still contains the stale statements `PLANNED / NOT STARTED`, `Phase 19B implementation: NOT STARTED`, and the old preflight next gate.

Do not rewrite historical sections below the authority block.

- [ ] **Step 2: Replace only the top Phase 19B authority block**

The reconciled block must communicate this exact state:

```text
Current execution phase: PHASE 19B
Name: Interview Coach Refinements
Status: COMPLETED / FINAL ACCEPTANCE PASSED / READY FOR MAIN INTEGRATION
Phase integration branch: phase-19b-interview-coach-refinements
Final pre-closeout phase checkpoint: 5da65534e1f07f7905310d70272af068c71c4d42
Task 8 PR: PR #14 — MERGED / CLOSED
Task 8 final accepted head: 7c740e19db3fb834f0cbde609c2c503f8f22de66
Task 8 merge commit: 5da65534e1f07f7905310d70272af068c71c4d42
Phase 19B implementation: COMPLETED
Live Gemini acceptance: PASSED
Human browser/responsive QA: PASSED / USER APPROVED
Focused backend: 34/34 PASS
Focused frontend: 235/235 PASS
Security/ownership/resilience backend: 54/54 PASS
Security/ownership/resilience frontend: 77/77 PASS
Full backend: 479/479 PASS
Full frontend: 1044/1044 PASS
Backend/frontend typechecks: PASS
Backend/frontend production builds: PASS
Final Task 8 diff check: PASS
Final Task 8 worktree: CLEAN
Task 8 production-code changes: NONE
Main integration: NOT YET MERGED / REQUIRES SEPARATE EXPLICIT APPROVAL
Deployment: NO NEW DEPLOYMENT ACTION AUTHORIZED OR REQUIRED BY THIS CLOSEOUT
Next gate: merge the closeout documentation into the Phase 19B branch, then create/review the separate Phase 19B-to-main PR
```

Keep the existing Phase 19A predecessor facts and future-phase/deferred-item facts that remain true. Remove or replace only statements in the controlling block that directly contradict the completed Phase 19B state.

- [ ] **Step 3: Review the resulting authority block for truthfulness**

Confirm all of the following before committing:

```text
NO "PLANNED / NOT STARTED" status for Phase 19B
NO "Phase 19B implementation: NOT STARTED"
NO old Phase 19B preflight as the next gate
NO claim that main already contains Phase 19B
NO deployment claim
NO activation of Phase 19C+
```

- [ ] **Step 4: Commit the authority-block reconciliation**

Commit only `docs/planning/CURRENT_PHASE.md` with a narrow documentation message such as:

```bash
git add docs/planning/CURRENT_PHASE.md
git commit -m "docs: reconcile Phase 19B completion status"
```

---

### Task 2: Create the Dedicated Phase 19B Closeout Record

**Files:**
- Create: `docs/planning/PHASE_19B_INTERVIEW_COACH_REFINEMENTS_CLOSEOUT.md`
- Reference: `docs/planning/PHASE_19A_4_CANDIDATE_PHOTO_SUPPORT_CLOSEOUT.md`
- Reference: `docs/superpowers/specs/2026-08-14-interview-final-acceptance-design.md`
- Reference: `docs/superpowers/plans/2026-08-14-interview-final-acceptance.md`

**Interfaces:**
- Consumes: Task 8 PR #14 accepted evidence and the final Phase 19B phase checkpoint.
- Produces: the durable Phase 19B governance record used by the later `main` integration PR.

- [ ] **Step 1: Create the closeout document with Status and Identity sections**

The opening must state, without implying a `main` merge:

```text
Status: COMPLETED / FINAL ACCEPTANCE PASSED / READY FOR MAIN INTEGRATION
Phase: 19B — Interview Coach Refinements
Phase branch: phase-19b-interview-coach-refinements
Final pre-closeout phase checkpoint: 5da65534e1f07f7905310d70272af068c71c4d42
Task 8 PR: #14 — MERGED / CLOSED
Task 8 final accepted head: 7c740e19db3fb834f0cbde609c2c503f8f22de66
Task 8 merge commit into Phase 19B: 5da65534e1f07f7905310d70272af068c71c4d42
Main integration: NOT YET PERFORMED
Deployment: NOT AUTHORIZED BY THIS CLOSEOUT
```

- [ ] **Step 2: Add a concise Completed Scope section**

Summarize the completed Phase 19B Interview Coach capabilities without copying every implementation spec. Include:

```text
typed Interview domain/storage
secure MCQ serialization and pre-submit answer-key protection
six modern question types + legacy-open-response compatibility
typed generation/manual creation/distribution
typed attempts + deterministic MCQ evaluation
type-aware explanation and feedback
frontend typed API/contracts and Practice Desk UX
Question Index, Private notes, pinning, Saved Attempts
completed/archive/restore lifecycle
Coding starter code with text-only answers and no execution
cross-industry Career area / role authoring
structured Behavioral / Scenario-Based / Technical Explanation answers
exact count/distribution refinements
existing polling, progress, cancel/retry, single-flight and duplicate-suppression behavior
```

- [ ] **Step 3: Add Security and Architecture Invariants**

Record the preserved boundaries exactly enough for a future reviewer to understand what Phase 19B did not change:

```text
Gemini Direct current-development path; baseline gemini-3.6-flash
existing in-process backend worker
polling/cancel/retry/single-flight/duplicate suppression/execution fencing preserved
no SSE / WebSockets / token streaming
MCQ answer key private before allowed post-attempt boundary
backend-deterministic MCQ correctness
no AI feedback action for MCQ
Coding starter code and answers are text-only and never executed
authenticated ownership and cross-user isolation
immutable saved attempts
stale route/question/attempt response suppression
structured answers use the existing typed text attempt contract
```

- [ ] **Step 4: Add Final Acceptance Evidence**

Record these exact Task 8 values:

```text
Focused backend: 6/6 files, 34/34 tests PASS
Focused frontend: 26/26 files, 235/235 tests PASS
Security/ownership/resilience backend: 6/6 files, 54/54 tests PASS
Security/ownership/resilience frontend: 4/4 files, 77/77 tests PASS
Full backend: 44/44 files, 479/479 tests PASS
Full frontend: 90/90 files, 1044/1044 tests PASS
Backend source + test typecheck: PASS
Frontend typecheck: PASS
Backend production build: PASS
Frontend production build: PASS
Live Gemini generation: PASS
Exact six-type distribution: PASS
Coding starter code: PASS
MCQ pre-submit secrecy: PASS
Deterministic MCQ result: PASS
Live explanation: PASS
Live non-MCQ feedback: PASS
Polling/status: PASS
Browser QA: PASS / USER APPROVED
Responsive QA: PASS / USER APPROVED
Final git diff --check: PASS
Final Task 8 worktree: CLEAN
```

Also state that the full backend/frontend regression, typechecks, and builds ran at `225434bc4120b99bf7c66a2bc7e773ebf2c4e8e8`; later Task 8 commits were documentation-only; and the final diff/tree checks were rerun at accepted Task 8 head `7c740e19db3fb834f0cbde609c2c503f8f22de66`.

- [ ] **Step 5: Record Task 8 fixture/documentation repairs accurately**

Record the two stale generated-Coding test-fixture corrections and explicitly state that no production source changed during Task 8 final acceptance.

Relevant commits:

```text
b3ee3acda71344771530d84d9ffccd13d75afabf
4e1048614af4db50e453dca43565b47f97b9a521
c622d3dab78bc9a2b1cc7901f795a4d87dd7df60
b61cf0265562d29f778c05b4f1cb4e88608477f2
7c740e19db3fb834f0cbde609c2c503f8f22de66
```

- [ ] **Step 6: Record only the accepted non-blocking warnings**

Include:

```text
intentional express-rate-limit forwarded-header diagnostic in the spoofed-header security test
pre-existing duplicate React key warning in unrelated ResumeVersionTimeline.test.tsx
non-fatal Vite warnings for dependency-level use client directives, mixed dynamic/static resumeApi.ts import, and the existing >500 kB chunk advisory
```

Do not create new repair work from these warnings.

- [ ] **Step 7: Add Release Control**

The final section must state:

```text
Phase 19B functional/acceptance work is complete on the phase branch
Task 8 is merged into the phase branch
Phase 19B is not yet merged to main
no deployment is authorized by this closeout
task branches are not deleted by this closeout
next action is a separate Phase 19B-to-main PR followed by separate explicit merge approval
```

- [ ] **Step 8: Commit the closeout record**

Commit only the new closeout file with a narrow message such as:

```bash
git add docs/planning/PHASE_19B_INTERVIEW_COACH_REFINEMENTS_CLOSEOUT.md
git commit -m "docs: add Phase 19B closeout record"
```

---

### Task 3: Documentation-Only Verification and PR Closeout

**Files:**
- Review: all changes on PR #15 relative to `phase-19b-interview-coach-refinements`.
- Modify PR metadata only after verification.

**Interfaces:**
- Consumes: completed Tasks 1–2.
- Produces: a reviewed closeout PR that is ready for a separate merge-approval gate.

- [ ] **Step 1: Sync the user’s local task branch after implementation**

Run:

```bash
cd "/Users/prabhathmalinda/Documents/Projects/Career Learning Hub"
git fetch origin
git switch task/phase-19b-closeout-documentation
git pull --ff-only
```

- [ ] **Step 2: Verify exact branch/head and clean tree before checks**

Run:

```bash
git branch --show-current
git rev-parse HEAD
git status --short
```

Expected:
- branch is `task/phase-19b-closeout-documentation`;
- head equals the final documentation implementation commit;
- `git status --short` prints nothing.

- [ ] **Step 3: Run the final documentation diff check**

Run:

```bash
git diff --check origin/phase-19b-interview-coach-refinements...HEAD
```

Expected: no output.

- [ ] **Step 4: Reconfirm the final tree**

Run:

```bash
git branch --show-current
git rev-parse HEAD
git status --short
```

Expected: correct branch/head and no worktree output.

- [ ] **Step 5: Review GitHub changed-file scope**

PR #15 must contain only:

```text
docs/superpowers/specs/2026-08-14-phase-19b-closeout-documentation-design.md
docs/superpowers/plans/2026-08-14-phase-19b-closeout-documentation.md
docs/planning/CURRENT_PHASE.md
docs/planning/PHASE_19B_INTERVIEW_COACH_REFINEMENTS_CLOSEOUT.md
```

Any production/test/config/dependency file is a blocker and must be removed before closeout.

- [ ] **Step 6: Review governance truthfulness**

Verify:

```text
CURRENT_PHASE.md records Phase 19B complete and ready for main integration
closeout record preserves exact Task 8 evidence
no main merge is claimed
no deployment is claimed
no future phase is activated
Task 8 executable verification checkpoint is distinguished from later docs-only commits
```

- [ ] **Step 7: Update PR #15 with final evidence and move it out of draft only when green**

The PR body should record:

```text
SPEC: APPROVED
PLAN: APPROVED
GOVERNANCE_DOCS: COMPLETE
PRODUCTION_CHANGES: NONE
TEST_CONFIG_DEPENDENCY_CHANGES: NONE
DIFF_CHECK: PASS
WORKING_TREE: CLEAN
MAIN_BRANCH: UNCHANGED
DEPLOYMENT: NOT AUTHORIZED / NOT PERFORMED
CLOSEOUT_REVIEW: NO BLOCKING OR IMPORTANT ISSUE
```

- [ ] **Step 8: Present the closeout acceptance verdict without merging**

Use:

```text
PHASE_19B_CLOSEOUT_DOCUMENTATION: APPROVED_FOR_MERGE
```

Do not merge PR #15 until the user gives a separate explicit closeout-task merge approval. The merge target remains `phase-19b-interview-coach-refinements`, never `main`.

---

## Plan Self-Review Result

- **Spec coverage:** Tasks 1–3 cover the authority-block correction, dedicated closeout record, exact Task 8 evidence, architecture/security invariants, warning classification, release-control wording, proportional diff/tree verification, changed-file scope review, PR closeout, and separate merge approval.
- **Placeholder scan:** no `TBD`, `TODO`, unspecified implementation step, or unresolved evidence placeholder remains. Runtime-only values are limited to the final documentation implementation HEAD that will be observed after execution.
- **Scope check:** the task remains documentation-only; executable tests are deliberately not rerun unless implementation unexpectedly changes a non-documentation file.
- **Governance consistency:** the plan explicitly distinguishes `COMPLETED / READY FOR MAIN INTEGRATION` from `MERGED TO MAIN`; it does not authorize deployment, branch deletion, or future-phase activation.
