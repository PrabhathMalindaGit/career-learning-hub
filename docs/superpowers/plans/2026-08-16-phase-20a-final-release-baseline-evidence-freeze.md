# Phase 20A — Final Release Baseline & Evidence Freeze Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Freeze one authoritative Career Learning Hub release-candidate baseline and create a truthful, evidence-backed record of what is implemented, verified, demonstrated, intentionally excluded, and still known as non-blocking technical debt for university evaluation, report writing, and viva preparation.

**Architecture:** Documentation-and-verification campaign only. The product baseline is the already merged `main` commit `a2a3aa0ef5b9cf9583ce4aeae2d676f5f568a790`; Phase 20A must not change frontend, backend, shared contracts, database schema, AI/provider behavior, dependencies, or deployment configuration unless fresh verification reveals a genuine blocking defect. Verification results are gathered first, then the authoritative evidence record and planning status are reconciled on one documentation branch.

**Tech Stack:** npm workspaces, React 19, TypeScript, Vite, Vitest, Express 5, MongoDB/Mongoose, Supertest, Gemini Direct integration, Markdown project documentation.

## Global Constraints

- Product release-candidate baseline: `main @ a2a3aa0ef5b9cf9583ce4aeae2d676f5f568a790`.
- Phase branch: `phase-20a-final-release-baseline-evidence-freeze`.
- Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.
- Phase 20A is evidence-focused: no new features, redesign, provider changes, schema changes, infrastructure, broad refactors, dependency additions, deployment, or branch deletion.
- Treat the product baseline commit separately from the later documentation-only Phase 20A merge commit. The evidence record must identify which SHA represents the product code that was qualified.
- Do not fabricate test counts, browser results, architecture claims, feature claims, or limitations. Every claim must be supported by current repository content or fresh user-run evidence.
- Do not include secrets, API keys, tokens, cookies, private uploads, raw resume content, interview answers, document text, or personal data in the evidence record.
- Known non-blocking warnings must be recorded as warnings, not silently omitted and not escalated into unrelated refactoring.
- If fresh qualification exposes a real defect, stop the evidence freeze, reproduce and classify it, and obtain approval for the smallest repair before calling the release candidate frozen.
- Do not merge, deploy, or delete the branch without separate explicit approval.

---

### Task 1: Establish the exact release-candidate boundary

**Files:**
- Create: `docs/superpowers/plans/2026-08-16-phase-20a-final-release-baseline-evidence-freeze.md`
- No product-code files.

- [ ] Confirm remote `main` equals `a2a3aa0ef5b9cf9583ce4aeae2d676f5f568a790` before the branch is created.
- [ ] Create `phase-20a-final-release-baseline-evidence-freeze` directly from that exact SHA.
- [ ] Confirm the local Phase 20A branch matches the remote branch before running final qualification.
- [ ] Confirm `git status --short` is empty before qualification.
- [ ] Record that Phase 20A is documentation/evidence only and requires no running frontend, backend, MongoDB, browser, or Gemini call for the automated baseline.

### Task 2: Run fresh final automated qualification

**Files:**
- No product-code files unless verification exposes a genuine blocker.

Run from repository root in this order:

```bash
npm run typecheck --workspace @career-learning-hub/api
npm run typecheck:test --workspace @career-learning-hub/api
npm run test:unit --workspace @career-learning-hub/api
npm run test:integration --workspace @career-learning-hub/api
npm run test:security --workspace @career-learning-hub/api
npm run test --workspace @career-learning-hub/api
npm run build --workspace @career-learning-hub/api

npm run typecheck --workspace @career-learning-hub/web
npm run test --workspace @career-learning-hub/web
npm run build --workspace @career-learning-hub/web

npm run typecheck
npm run build

git diff --check origin/main...HEAD
```

- [ ] Record exact backend unit, integration, security, and full-suite counts.
- [ ] Record exact frontend file/test counts.
- [ ] Record typecheck and production-build results.
- [ ] Separate known non-blocking warnings from failures.
- [ ] If any command fails, classify the result as a reproducible product defect, environment/configuration issue, or known non-blocking diagnostic before changing anything.

### Task 3: Audit the implemented product inventory from authoritative sources

**Files:**
- Read only during audit: current frontend, backend, shared-type, architecture, planning, and test files.
- Later record findings in `docs/planning/PHASE_20A_FINAL_RELEASE_BASELINE_EVIDENCE_FREEZE.md`.

Audit and record only features supported by the current repository:

- [ ] Authentication and protected application shell.
- [ ] Dashboard and cross-feature summaries/activity.
- [ ] Resume Studio: creation, editing, immutable version saves, recovery, design, candidate photo, print/PDF workflow, AI-assisted assessment, recommendations, history, and safeguards actually present in code.
- [ ] Interview Coach: sessions, question types, answers/attempts, notes, AI feedback/job behavior, and safeguards actually present in code.
- [ ] Learning Workspace: document ingestion/processing, conversations, flashcards, quizzes, job behavior, deletion/ownership behavior actually present in code.
- [ ] Gemini credential/settings and Gemini-only current execution path as implemented.
- [ ] Shared application-shell, responsive, form/state, dialog/drawer, pagination, and accessibility patterns actually present.
- [ ] Backend ownership/security, request IDs, rate limiting, validation, private assets, AI output validation, quiz-answer secrecy, and graceful runtime controls actually present.

For every capability, classify it as one of:

- `IMPLEMENTED + AUTOMATED VERIFIED`
- `IMPLEMENTED + AUTOMATED + HUMAN VERIFIED`
- `IMPLEMENTED + HUMAN VERIFIED`
- `IMPLEMENTED BUT NOT RE-VERIFIED IN 20A`
- `OUT OF SCOPE / NOT IMPLEMENTED`

Do not upgrade a capability to a stronger evidence class without supporting evidence.

### Task 4: Record architecture and release evidence

**Files:**
- Create: `docs/planning/PHASE_20A_FINAL_RELEASE_BASELINE_EVIDENCE_FREEZE.md`

The record must include these exact sections:

1. Purpose and freeze policy.
2. Product release-candidate SHA and date.
3. Repository architecture: `frontend/`, `backend/`, `packages/shared-types/`, MongoDB, private local/cloud asset abstraction where implemented, and Gemini integration.
4. Implemented feature inventory with evidence classification.
5. AI architecture and credential-handling summary without secrets.
6. Security/privacy controls relevant to university evaluation.
7. Fresh Phase 20A automated qualification with exact commands and counts.
8. Human verification evidence inherited from Phase 19G plus the post-19G Resume assessment UI visual approval, explicitly distinguishing earlier evidence from fresh 20A evidence.
9. Known non-blocking warnings/technical debt.
10. Explicit exclusions and limitations.
11. Deployment status: record the actual current state; do not imply a new Phase 20A deployment.
12. Evidence artifacts that Phase 20B/20C/20D/20E may safely reuse.
13. Change-control rule after freeze: only genuine blocking defects should reopen product engineering.

### Task 5: Reconcile stale planning authority

**Files:**
- Modify: `docs/planning/CURRENT_PHASE.md`

The current file still identifies Phase 19B as the current execution phase even though later phases have been completed. Replace the stale top authority block with a concise current block that records:

- Phase 20A as the active evidence-freeze phase while this branch is under qualification.
- Product release-candidate baseline `a2a3aa0ef5b9cf9583ce4aeae2d676f5f568a790`.
- Phase 19G integrated verification completed and merged.
- Post-19G Resume assessment UI polish completed and merged.
- Phase 19H removed from the agreed path.
- No new product feature phase is active.
- Deployment and branch deletion remain separately controlled.
- Phase 20B is the next inactive stage until 20A is qualified and merged.

Preserve historical material below the current authority block where useful; do not rewrite project history merely to make the file shorter.

### Task 6: Evidence-integrity and secret-safety review

**Files:**
- Review the final Phase 20A documentation diff only.

Run:

```bash
git diff --check origin/main...HEAD
git diff --stat origin/main...HEAD
git status --short
```

Then manually confirm:

- [ ] Only Phase 20A documentation/planning files changed.
- [ ] No `.env`, secret, API key, token, cookie, private user content, generated build output, or uploaded asset entered the diff.
- [ ] No test count or result is recorded unless it came from fresh command output supplied during Phase 20A.
- [ ] No architecture or feature claim exceeds what the current repository supports.
- [ ] No deployment is described as performed unless separately verified.

### Task 7: Final Phase 20A qualification gate

Phase 20A may be called GREEN only when all of the following are true:

- fresh backend automated qualification passes on the release-candidate product tree;
- fresh frontend automated qualification passes on the release-candidate product tree;
- root workspace typecheck/build pass;
- final documentation diff passes `git diff --check`;
- implemented-feature inventory is grounded in current repository evidence;
- known warnings and explicit limitations are recorded honestly;
- `CURRENT_PHASE.md` is reconciled to the actual execution stage;
- the Phase 20A branch contains documentation/evidence changes only;
- exact local and remote Phase 20A head match;
- no product-code repair is silently bundled into the evidence phase.

### Task 8: Pull request and merge gate

Only after the exact Phase 20A head is qualified:

- open one Phase 20A pull request against `main`;
- state that the product release-candidate baseline being frozen is `a2a3aa0ef5b9cf9583ce4aeae2d676f5f568a790`;
- include exact fresh qualification results and evidence scope in the PR;
- request separate explicit merge approval for the exact Phase 20A documentation head;
- merge only with expected-head protection;
- verify remote `main` after merge;
- user synchronizes local `main`;
- do not deploy or delete branches without separate approval;
- after merge, Phase 20B — University Evaluation Evidence may be separately started.
