# Career Learning Hub — Final-Stage Master Plan

## 1. Purpose

This document governs the final university-project stage of Career Learning Hub.

Career Learning Hub is treated as one current application with three principal functional workspaces — Resume Studio, Interview Coach, and Learning Workspace — supported by authentication, Dashboard, Settings, private storage, MongoDB persistence, and Gemini-assisted background workflows.

The final-stage objective is not to expand scope. It is to preserve the qualified implementation, prepare academically defensible evidence, capture final screenshots and technical material, and prepare a reliable viva/demo path.

The controlling project rule is:

> Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.

## 2. Current authoritative baseline

### Executable product baseline

The executable product tree frozen by Phase 20A is:

`a2a3aa0ef5b9cf9583ce4aeae2d676f5f568a790`

That executable tree was freshly qualified during Phase 20A.

### Phase 20A evidence merge

Phase 20A was merged to `main` through PR #31 at:

`60ea6f9dbaac044ee786ad4628b1040508daf987`

The Phase 20A merge adds documentation/evidence/governance only. It does not change the executable frontend, backend, shared-types, package, configuration, or dependency trees from the frozen executable product baseline.

### Authoritative final evidence record

`docs/planning/PHASE_20A_FINAL_RELEASE_BASELINE_EVIDENCE_FREEZE.md`

## 3. Current architecture

Career Learning Hub remains a single npm-workspace monorepo:

- `frontend/` — React 19, TypeScript, Vite, React Router, Vitest, Testing Library.
- `backend/` — Express 5, TypeScript, Mongoose, Zod, JWT, bcrypt, Helmet, CORS, rate limiting, Multer, PDF parsing, private asset handling, and an in-process background worker.
- `packages/shared-types/` — shared TypeScript contracts.
- MongoDB/Mongoose — persistent structured application data.
- Private asset storage abstraction — local or S3-compatible depending on environment configuration.
- Google Gemini — active AI service used through the server-side AI/job architecture.

Do not introduce a second frontend/backend, a replacement framework, another database, another authentication provider, or another design system without an explicit new architectural decision.

## 4. Frozen implemented scope

### Authentication

The qualified product includes:

- registration, login, logout;
- protected-route enforcement;
- refresh-based session bootstrap;
- in-memory access-token handling;
- HttpOnly refresh-cookie architecture;
- intended-route restoration;
- session-expiry messaging;
- validation and safe API-failure presentation;
- responsive Login and Registration pages.

The current university-project scope intentionally excludes OAuth/social login, password reset, email verification, MFA/OTP/passkeys/magic links, CAPTCHA, and expanded multi-device session management.

### Dashboard

The qualified product includes:

- Resume performance/readiness information;
- Interview feedback information;
- Quiz performance information;
- recent Learning document information;
- recent activity;
- safe owned-record continuation actions;
- selectable performance periods;
- loading, empty, failure, retry, and stale-request handling.

The application must not fabricate unsupported metrics, completion percentages, activity targets, or data absent from current contracts.

### Resume Studio

The qualified product includes:

- Resume collection and creation;
- Guided Setup, blank creation, and PDF import;
- nine Resume content sections;
- live preview;
- immutable saved versions;
- Save new version and keyboard-save behavior;
- dirty-draft and recovery protections;
- safe unsaved-navigation handling;
- saved-version review;
- A4 and Letter print-to-PDF workflow;
- ATS Classic, Modern Professional, and Compact Technical templates;
- bounded font, palette, and appearance controls;
- candidate-photo upload, replace, show/hide, remove, and eligible embedded-image import;
- Gemini-assisted Resume assessment;
- validated strengths/issues/keywords/suggestions;
- explicit user confirmation before AI suggestions are applied;
- stale-assessment/version-conflict protection;
- safe permanent deletion with ownership and active-job safeguards.

### Interview Coach

The qualified product includes:

- Interview session creation and lifecycle management;
- cross-industry career-area/role guidance;
- Multiple Choice, Short Answer, Coding, Behavioral, Scenario-Based, and Technical Explanation question types;
- AI-assisted and manual question creation;
- balanced or explicit question-type distribution;
- generated Coding starter code;
- text-only Coding responses;
- immutable Saved Attempts;
- deterministic backend Multiple Choice evaluation;
- pre-submit answer-key secrecy;
- type-aware feedback;
- notes and pinning;
- filtering and pagination;
- archive/restore;
- safe permanent deletion;
- polling, retry, cancellation, duplicate suppression, idempotency, execution fencing, and stale-response protections.

Coding questions are intentionally not executed or compiled. No compiler/code-execution sandbox is part of the current product.

### Learning Workspace

The qualified product includes:

- private PDF upload and processing;
- Learning document library/workspace;
- grounded conversations with document/page sources;
- flashcard generation and study;
- quiz generation and completion;
- saved quiz attempts and server-derived scores;
- source/page review affordances;
- background-job progress, polling, retry, and cancellation;
- safe document/conversation/flashcard-set/quiz deletion with ownership and active-job safeguards;
- responsive Learning states and tabs.

Study-set rename remains intentionally deferred because no safe bounded rename contract is present and adding one only for cosmetic scope is not justified for the university project.

### Shared application shell and UI

The qualified product includes:

- desktop sidebar and responsive mobile drawer;
- shared account identity and logout behavior;
- shared Dialog, PageHeader, Breadcrumbs, Pager, loading, empty, error, and Request-ID detail patterns;
- keyboard focus management and focus return where applicable;
- desktop, tablet, and mobile responsive treatment.

## 5. Gemini release policy

The active provider is Gemini Direct only with fixed model:

`gemini-3.6-flash`

Supported connection states are:

- administrator-managed Gemini when explicitly enabled server-side;
- personal Gemini credential stored encrypted server-side;
- disconnected.

Required release invariants include:

- test-before-write for personal credentials;
- AES-256-GCM encrypted credential storage;
- server-side API-key use;
- no plaintext key returned after save;
- versioned credential/routing state;
- durable AI jobs handled by the existing in-process worker;
- progress polling;
- bounded retry;
- cancellation and timeout handling;
- execution leases/fencing;
- idempotency and duplicate suppression;
- structured-output validation before persistence;
- atomic adoption of final validated results;
- no silent provider fallback;
- no SSE, WebSockets, or token streaming.

## 6. Security and privacy boundary

The current system preserves:

- owner-scoped backend access;
- authenticated server-derived resource ownership;
- cross-user/IDOR regression coverage;
- request validation;
- CORS allowlisting;
- rate limiting;
- Helmet and secure HTTP handling;
- normalized errors and Request IDs;
- private asset controls;
- upload validation;
- answer-key secrecy;
- no browser storage of access/refresh tokens;
- HttpOnly refresh-cookie handling;
- encrypted personal Gemini credentials;
- sensitive-data logging restrictions;
- destructive-operation ownership and active-job fences;
- transactional/canonical persistence for sensitive multi-record operations.

The academically accurate security claim is:

> The final backend security regression suite passed 43/43 tests. No separate dedicated external or repository-wide security-scanner pass is claimed by Phase 20A.

## 7. Final qualification evidence

Fresh Phase 20A qualification recorded:

- backend production TypeScript typecheck — PASS;
- backend test-source TypeScript typecheck — PASS;
- backend unit tests — 223/223 PASS;
- backend integration tests — 249/249 PASS;
- backend security tests — 43/43 PASS;
- complete backend suite — 515/515 PASS;
- backend production build — PASS;
- frontend TypeScript typecheck — PASS;
- complete frontend suite — 1,170/1,170 PASS;
- frontend production build — PASS;
- root workspace typecheck — PASS;
- root workspace production build — PASS;
- final diff check — PASS.

Non-overlapping complete-suite count:

**1,685 passing tests = 515 backend + 1,170 frontend**

The backend unit/integration/security commands are subsets of the complete 515-test backend suite and must not be double-counted.

Final human/live evidence consists of integrated application QA followed by focused visual approval for the final visible Resume assessment-action polish and then the fresh complete automated Phase 20A qualification.

## 8. Known non-blocking diagnostics

The final evidence records the following successful-build/test diagnostics without presenting them as failures:

- intentional `X-Forwarded-For` rate-limit diagnostic from an adversarial security test;
- duplicate React-key warning from a synthetic Resume-version fixture;
- dependency-level React Router `use client` build warnings;
- mixed static/dynamic import advisory for current Resume API code;
- Vite bundle-size advisory above 500 kB.

These remain technical-quality observations rather than blockers.

## 9. Final-stage roadmap

### Phase 20A — Final Release Baseline & Evidence Freeze

Status: **COMPLETED / QUALIFIED / MERGED**

Purpose:

- freeze the final executable product identity;
- record final automated and human evidence;
- preserve explicit security, scope, and deployment claim boundaries.

### Documentation consolidation — current maintenance task

Status: **ACTIVE UNTIL SEPARATELY MERGED**

Purpose:

- present the current repository documentation around Career Learning Hub itself;
- remove obsolete development-source/inventory material from the current tree;
- simplify current governance records;
- make no executable application changes.

This task does not change the Phase 20A executable baseline or require the 1,685-test qualification to be rerun unless an executable/configuration/package/runtime file is changed.

### Phase 20B — University Evaluation Evidence

Status: **PLANNED / INACTIVE**

Purpose:

- organize defensible evaluation evidence against the implemented project objectives;
- select evidence that can be reproduced during assessment;
- distinguish implemented, tested, demonstrated, and excluded scope.

### Phase 20C — Final Screenshots & Technical Evidence

Status: **PLANNED / INACTIVE**

Purpose:

- capture final application screenshots and technical evidence suitable for the report and viva;
- use current product terminology and current implementation only;
- avoid unsupported claims.

### Phase 20D — Report Evidence Pack

Status: **PLANNED / INACTIVE**

Purpose:

- assemble evidence snippets, architecture facts, testing results, security statements, limitations, and figure/source references for the final university report.

### Phase 20E — Viva / Demonstration Preparation

Status: **PLANNED / INACTIVE**

Purpose:

- prepare the live demonstration sequence;
- prepare likely technical questions and defensible answers;
- prepare fallback evidence for runtime/provider/network issues during the viva.

The recommended demonstration sequence is:

Login → Dashboard → Resume Studio → save Resume → Gemini Resume assessment → assessment result → Interview Coach → answer + feedback → Learning Workspace → document + flashcards + quiz + grounded conversation → Dashboard → architecture/security/Gemini explanation.

## 10. Operating rules for all remaining work

- Never work directly on `main`.
- Keep each task bounded to one feature/fix/documentation branch where practical.
- Repairs stay on the same branch.
- User-executed test/browser evidence remains authoritative for commands not available through connected tooling.
- Never fabricate test or runtime results.
- Merge only after explicit approval of the exact qualified head SHA.
- Deployment requires separate explicit approval.
- Branch deletion requires separate explicit approval.
- Documentation-only changes must remain documentation-only; any executable change invalidates the documentation-only verification shortcut.
- Preserve the frozen product architecture and Gemini-only release boundary unless the user explicitly authorizes a new product phase.

## 11. Current scope authority

`docs/planning/CURRENT_PHASE.md` is the concise current execution-scope record.

This master plan records only the current final-stage roadmap and authoritative product/evidence boundaries. Historical implementation details remain available in Git history and retained evidence documents but do not control new work unless the current task explicitly cites them.
