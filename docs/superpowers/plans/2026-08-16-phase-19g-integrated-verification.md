# Phase 19G — Integrated Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove that the current Career Learning Hub works correctly as one integrated product after Phase 19A–19F, and repair only defects that are reproducible with evidence.

**Architecture:** Verification-first campaign on one feature branch. Existing frontend, backend, shared packages, authentication, Gemini, job-processing, and feature architectures remain authoritative. No production change is permitted merely to improve style or expand scope; any repair must be tied to a demonstrated verification failure and remain on this branch.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Express 5, MongoDB/Mongoose, Supertest, npm workspaces.

## Global Constraints

- Baseline: `main @ 20e9d5816eb2e0e5218d0129daf71a525e315378`.
- Branch: `phase-19g-integrated-verification`.
- Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.
- No new product features, redesign, provider architecture, backend schema, dependency, or infrastructure unless a reproducible verification defect proves it necessary.
- Gemini Direct remains the active AI provider architecture; no hidden provider fallback or provider-selection UI is introduced.
- Repairs use root-cause investigation and regression evidence before production changes.
- All repairs remain on this branch.
- Do not merge, deploy, or delete the branch without separate explicit approval.

---

### Task 1: Establish exact verification baseline

**Files:**
- No production files.

- [ ] Verify local branch is `phase-19g-integrated-verification` and `HEAD` matches the remote branch.
- [ ] Confirm the branch descends from `20e9d5816eb2e0e5218d0129daf71a525e315378`.
- [ ] Confirm `git status --short` is empty before running qualification.

### Task 2: Backend automated qualification

**Files:**
- No production files unless a test exposes a reproducible defect.

Run from repository root in this order:

```bash
npm run typecheck --workspace @career-learning-hub/api
npm run typecheck:test --workspace @career-learning-hub/api
npm run test:unit --workspace @career-learning-hub/api
npm run test:integration --workspace @career-learning-hub/api
npm run test:security --workspace @career-learning-hub/api
npm run test --workspace @career-learning-hub/api
npm run build --workspace @career-learning-hub/api
```

Record exact pass/fail counts. Any failure must be classified before a repair is attempted.

### Task 3: Frontend automated qualification

**Files:**
- No production files unless a test exposes a reproducible defect.

Run:

```bash
npm run typecheck --workspace @career-learning-hub/web
npm run test --workspace @career-learning-hub/web
npm run build --workspace @career-learning-hub/web
```

Record exact pass/fail counts and preserve known non-blocking warnings separately from failures.

### Task 4: Monorepo qualification

Run:

```bash
npm run typecheck
npm run build
git diff --check origin/main...HEAD
```

The workspace typecheck and build must succeed. `git diff --check` must emit no errors.

### Task 5: Integrated browser workflows

Run the application with the normal local development environment and verify these user journeys using real application routing and persisted local development data where appropriate.

#### Authentication lifecycle

- [ ] Register with valid data.
- [ ] Confirm protected application entry.
- [ ] Log out and log back in.
- [ ] Verify session-expiry notice and safe intended-location restoration using the existing mechanism where practical.
- [ ] Verify invalid login and validation feedback remain safe and usable.

#### Resume lifecycle

- [ ] Create a Resume.
- [ ] Edit and save content.
- [ ] Exercise appearance/customization controls.
- [ ] Exercise candidate-photo flow if configured.
- [ ] Run one representative Resume AI analysis with Gemini if credentials are configured.
- [ ] Review/apply one deliberate recommendation where available.
- [ ] Verify export/print and reopening the saved Resume.
- [ ] Verify dirty-draft/recovery/deletion safeguards through existing UI paths.

#### Interview lifecycle

- [ ] Create an Interview session.
- [ ] Generate or add representative questions.
- [ ] Exercise Short Answer plus at least one structured answer type.
- [ ] Save an attempt.
- [ ] Run one representative Gemini feedback operation if credentials are configured.
- [ ] Verify feedback, notes, saved attempts, reopening, and deletion safeguards.

#### Learning lifecycle

- [ ] Upload a representative PDF.
- [ ] Confirm document processing reaches the expected ready state.
- [ ] Generate/use Flashcards.
- [ ] Generate/complete a Quiz.
- [ ] Run one representative Learning conversation with Gemini if credentials are configured.
- [ ] Reopen the document and verify persisted state.
- [ ] Verify deletion/cascade safeguards through existing UI paths.

#### Dashboard integration

After Resume, Interview, and Learning activity exists:

- [ ] Verify Dashboard continuation links target owned records correctly.
- [ ] Verify Resume, Interview, Quiz, Learning-document, and recent-activity summaries reflect current data.
- [ ] Verify 7/30/90/365-day controls remain functional.
- [ ] Verify expanded recent-activity paging and request supersession remain functional.

### Task 6: Gemini integration smoke verification

If a Gemini credential is already configured for local development:

- [ ] Confirm Settings reports the expected Gemini state.
- [ ] Run one representative successful AI operation in Resume, Interview, and Learning.
- [ ] Confirm progress/polling and retry/cancellation behavior where exposed.
- [ ] Confirm failures remain explicit and safe; no provider fallback is presented.
- [ ] Avoid unnecessary repeated model calls or broad token consumption.

If Gemini credentials are not configured, record this as an environment limitation rather than weakening automated provider-contract tests.

### Task 7: Responsive, accessibility, and runtime QA

At representative widths around 1440px, 768px, and 390px verify:

- [ ] Dashboard.
- [ ] Resume list/workspace.
- [ ] Interview list/workspace.
- [ ] Learning list/workspace.
- [ ] Settings.
- [ ] Login/Register.
- [ ] Desktop navigation and mobile drawer.
- [ ] Keyboard focus visibility and reachable controls.
- [ ] Dialog/drawer Escape and focus-return behavior.
- [ ] Loading, empty, error, retry, and disabled states.
- [ ] No obvious horizontal overflow or inaccessible controls.
- [ ] No uncaught runtime exception, React error screen, obvious request storm, or secret leakage.

### Task 8: Defect handling rule

For every failure:

1. Reproduce it consistently.
2. Read the exact error/stack/output.
3. Trace the relevant request/state/data path.
4. Compare with an existing working pattern.
5. State one root-cause hypothesis.
6. Add or identify the smallest regression reproduction.
7. Make the smallest repair that addresses the root cause.
8. Run focused verification.
9. Run the affected module regression.
10. Continue the same Phase 19G campaign.

Do not split ordinary repairs into Phase 19G-1/19G-2 branches.

### Task 9: Final exact-head qualification

At the final candidate SHA, rerun all applicable commands from Tasks 2–4 after the last production repair, then repeat the affected browser workflows.

Phase 19G may be called GREEN only when:

- backend typecheck/test typecheck/unit/integration/security/full tests/build are green;
- frontend typecheck/full tests/build are green;
- root workspace typecheck/build are green;
- `git diff --check` is clean;
- integrated Authentication, Resume, Interview, Learning, Dashboard workflows pass;
- Gemini smoke checks pass where the configured environment permits them;
- desktop/tablet/mobile and keyboard/accessibility QA pass;
- exact local and remote candidate SHA match.

### Task 10: Merge gate

Only after exact-head qualification:

- open the Phase 19G PR against `main`;
- record exact qualification evidence in the PR;
- request separate explicit merge approval for the exact head SHA;
- merge only with expected-head protection;
- verify remote `main` after merge;
- user synchronizes local `main`;
- deployment and branch deletion remain separate approvals.
