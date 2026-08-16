# Phase 20A — Final Release Baseline & Evidence Freeze

## 1. Purpose

Phase 20A freezes the current Career Learning Hub implementation as the authoritative engineering baseline for university evaluation, report evidence, screenshots, and viva preparation.

This is an evidence and governance phase. It does not add product features, redesign the interface, change the database, alter the Gemini provider architecture, add dependencies, deploy the application, or claim verification that was not actually performed.

The controlling project rule remains:

> Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.

## 2. Frozen release identity

### Product release-candidate baseline

The executable product tree frozen by this phase is:

`a2a3aa0ef5b9cf9583ce4aeae2d676f5f568a790`

This is the `main` merge commit for PR #30, **Polish Resume assessment action UI**.

### Phase 20A evidence branch

Branch:

`phase-20a-final-release-baseline-evidence-freeze`

Phase 20A was created directly from the product release-candidate baseline above.

The first Phase 20A commit was:

`b24bbb3d5506c5c292fcab1d925a4f032c322ec4`

That commit adds only the Phase 20A implementation plan. Therefore the executable frontend, backend, shared-types, package, configuration, and dependency trees at the fresh Phase 20A qualification checkpoint are identical to the frozen product release candidate.

### Freeze rule

Later Phase 20A documentation-only commits do not change the frozen executable product identity. If any executable product file is changed after this record, this evidence freeze is no longer sufficient and a new executable qualification checkpoint is required.

## 3. Authoritative architecture summary

Career Learning Hub is a single npm-workspace monorepo with these active application boundaries:

- `frontend/` — React 19 + TypeScript + Vite client application.
- `backend/` — Express 5 + TypeScript API and in-process background job worker.
- `packages/shared-types/` — shared TypeScript contracts.
- MongoDB/Mongoose — structured persistent application data.
- Private asset storage abstraction — local or S3-compatible storage depending on environment configuration.
- Google Gemini — active AI service used through the server-side AI/job architecture.

Root workspace requirements currently specify Node.js `>=20.0.0` and npm `>=10.0.0`.

The frontend uses React Router, Vitest, Testing Library, and strict TypeScript checks. The backend uses Express, Mongoose, Zod, JWT, bcrypt, Helmet, CORS, rate limiting, Multer, PDF parsing, and AWS S3-compatible storage libraries.

## 4. Current application modules

### 4.1 Authentication and account session

Implemented and verified behavior includes:

- account registration;
- login and logout;
- authenticated route protection;
- refresh-based session bootstrap;
- in-memory frontend access-token handling;
- HttpOnly refresh-cookie architecture;
- safe restoration of an intended internal route after authentication;
- explicit runtime session-expiry messaging;
- password visibility controls;
- form validation and safe API failure presentation;
- duplicate logout suppression;
- Request ID diagnostics behind bounded technical-details disclosure;
- responsive Login and Registration presentation.

Intentionally not implemented as part of the frozen university-project scope:

- third-party OAuth/social login;
- forgot-password/password-reset workflow;
- email verification;
- MFA/OTP/passkeys/magic links;
- CAPTCHA;
- expanded multi-device session-management UI.

### 4.2 Unified Dashboard

Implemented behavior includes:

- Resume performance/readiness presentation;
- Interview feedback presentation;
- Quiz performance presentation;
- recent Learning document information;
- recent activity;
- owned-record continuation actions with safe creation/upload fallbacks;
- selectable 7-day, 30-day, 90-day, and 365-day performance periods;
- compact recent-activity presentation with expanded server-owned pagination;
- stale-request cancellation and supersession protection;
- purposeful loading, empty, failure, and retry states;
- AI usage and diagnostics in Settings rather than the normal Dashboard surface.

The application does not fabricate unsupported completion percentages, activity destinations, or data that are absent from current contracts.

### 4.3 Resume Studio

Implemented behavior includes:

- Resume collection and creation;
- Guided Setup, blank creation, and PDF import;
- deterministic career/skill guidance while preserving custom input;
- all nine Resume content sections;
- live preview;
- immutable saved Resume versions;
- explicit Save new version workflow;
- Cmd/Ctrl+S handling;
- dirty-draft protection;
- bounded browser-session recovery;
- stale-recovery review;
- safe unsaved-navigation handling;
- current and historical saved-version review;
- A4 and Letter native browser print/PDF workflow;
- ATS Classic, Modern Professional, and Compact Technical templates;
- bounded font, palette, and appearance customization;
- candidate-photo upload, replace, show, hide, and remove;
- optional explicit import of an eligible first-page embedded PDF image as the existing candidate photo;
- role-aware Gemini-assisted Resume assessment;
- validated score/issue/strength/keyword presentation;
- explicit suggestion selection and confirmation before applying AI suggestions;
- stale-assessment and version-conflict protection;
- safe permanent Resume deletion with ownership and active-job safeguards;
- final post-19G visual polish keeping the AI assessment action secondary to the primary Save action.

Resume assessment and suggestion workflows do not automatically modify a Resume without explicit user action.

### 4.4 Interview Coach

Implemented behavior includes:

- Interview session creation and lifecycle management;
- cross-industry Career-area and role authoring guidance;
- six modern question types plus historical compatibility:
  - Multiple Choice;
  - Short Answer;
  - Coding;
  - Behavioral;
  - Scenario-Based;
  - Technical Explanation;
- AI-assisted question generation;
- manual question creation;
- balanced or explicit question-type distribution;
- generated Coding starter code;
- text-only Coding responses;
- structured Behavioral, Scenario-Based, and Technical Explanation answer entry;
- immutable Saved Attempts;
- deterministic backend Multiple Choice evaluation;
- pre-submit Multiple Choice answer-key secrecy;
- type-aware explanation and non-MCQ feedback;
- private notes and pinning;
- question/attempt pagination and filtering;
- archive/restore lifecycle behavior;
- permanent session deletion with owned cascade behavior;
- polling, retry, cancellation, duplicate suppression, idempotency, execution fencing, and stale-response protections.

Coding questions are intentionally not executed or compiled. The frozen product contains no code-execution sandbox, hidden-test runner, Monaco/CodeMirror dependency, or compiler service.

### 4.5 Learning Workspace

Implemented behavior includes:

- private document upload and processing;
- Learning document library and workspace;
- grounded conversations with document/page sources;
- flashcard generation and study workflow;
- quiz generation and completion;
- saved quiz attempts and server-derived score presentation;
- source/page review affordances;
- job progress, polling, retry, and cancellation behavior;
- document deletion safeguards;
- conversation deletion with message cascade;
- flashcard-set deletion with card cascade;
- quiz deletion with question/attempt cascade;
- active/generating job fences around destructive operations;
- responsive Learning tabs and states;
- user-facing terminology for document-based and verified-source workflows.

Study-set title rename remains intentionally deferred because the current API does not provide a safe bounded rename operation and adding backend contracts solely for cosmetic renaming was not justified for this university-project scope.

### 4.6 Application shell and shared UI

Implemented shared presentation includes:

- desktop sidebar and responsive mobile navigation drawer;
- shared account identity presentation;
- consistent logout state;
- shared Dialog behavior;
- shared PageHeader and Breadcrumbs patterns;
- shared Pager behavior;
- shared loading/empty/error surfaces;
- shared safe Request-ID technical details;
- common disabled form presentation;
- keyboard focus management and Escape/focus-return behavior where applicable;
- desktop, tablet, and mobile responsive treatment.

No enterprise design-system framework or parallel state-management architecture was introduced.

## 5. AI and Gemini architecture

The active release policy is Gemini Direct with the fixed model:

`gemini-3.6-flash`

Supported connection states are:

- administrator-managed Gemini when explicitly enabled server-side;
- personal Gemini credential stored encrypted server-side;
- disconnected.

Security and resilience characteristics include:

- personal credential test-before-write;
- AES-256-GCM encrypted credential storage;
- server-side Gemini API-key use rather than exposing the key to the browser;
- no plaintext credential returned after saving;
- versioned credential/routing state;
- durable AI jobs handled by the existing in-process backend worker;
- progress polling;
- bounded retry;
- cancellation;
- timeout handling;
- execution leases/fencing;
- idempotency and duplicate suppression;
- atomic persistence of validated AI results;
- structured-output validation before product adoption.

OpenRouter-related dormant implementation and tests remain present in the repository because they were developed during earlier provider-architecture work. The active Settings UI/runtime release path remains Gemini-only and does not expose an OpenRouter provider choice or silent OpenRouter fallback.

The current product does not use SSE, WebSockets, or token streaming for AI jobs.

## 6. Security and privacy controls represented in the frozen system

Implemented controls include:

- owner-scoped backend access for user resources;
- server-derived owned-resource identity rather than trusting client-supplied owner IDs;
- cross-user/IDOR security tests;
- request validation;
- CORS allowlisting;
- rate limiting;
- Helmet and secure HTTP handling;
- normalized errors and Request IDs;
- private asset access controls;
- upload validation;
- Resume candidate-photo validation;
- quiz answer-key secrecy;
- pre-submit Interview MCQ answer-key secrecy;
- server-side deterministic MCQ evaluation;
- no browser storage of access or refresh tokens;
- HttpOnly refresh-cookie architecture;
- logging/redaction rules that prohibit passwords, tokens, keys, Resume content, Interview answers, document text, prompts, and other sensitive user-generated content;
- encrypted personal Gemini credentials;
- no plaintext Gemini credential in normal API responses, URLs, jobs, usage events, or browser storage;
- destructive-operation ownership and active-job fences;
- transactional/canonical persistence patterns for sensitive multi-record operations.

### Security claim boundary

The fresh final backend security test suite passes **43/43 tests**.

This must not be presented as a dedicated external or repository-wide security scanner result. Historical project governance records state that a dedicated security-scan capability was not run and no scanner-pass claim was made. Therefore the academically accurate statement is:

> The implemented backend security regression suite passed 43/43 tests at the frozen release candidate; no separate dedicated external/repository security-scan pass is claimed by Phase 20A.

## 7. Fresh Phase 20A final automated qualification

The developer executed the final automated campaign locally on 2026-08-16 at exact Phase 20A head:

`b24bbb3d5506c5c292fcab1d925a4f032c322ec4`

Because that checkpoint differs from the frozen product release candidate only by the Phase 20A Markdown plan, this verifies the executable product tree frozen at `a2a3aa0ef5b9cf9583ce4aeae2d676f5f568a790`.

### Backend

- production TypeScript typecheck — PASS;
- test-source TypeScript typecheck — PASS;
- unit tests — **18/18 files, 223/223 tests PASS**;
- integration tests — **27/27 files, 249/249 tests PASS**;
- security tests — **5/5 files, 43/43 tests PASS**;
- complete backend suite — **50/50 files, 515/515 tests PASS**;
- backend production build — PASS.

The unit, integration, and security commands are subsets of the complete 515-test backend suite and must not be double-counted as additional unique tests.

### Frontend

- frontend TypeScript typecheck — PASS;
- complete frontend suite — **123/123 files, 1,170/1,170 tests PASS**;
- frontend production build — PASS;
- Vite transformed 174 modules successfully.

The final frontend count is three tests higher than the Phase 19G count because the post-19G Resume assessment presentation fix added three dedicated regression tests.

### Monorepo

- root workspace typecheck — PASS across frontend, backend, and shared-types;
- root workspace production build — PASS;
- `git diff --check origin/main...HEAD` — PASS / no errors.

### Non-overlapping final full-suite count

For report-level summary, the current non-overlapping complete-suite count is:

- backend full suite: 515;
- frontend full suite: 1,170;
- **combined: 1,685 passing tests**.

This number does not add the separately rerun backend unit/integration/security subsets again.

## 8. Human and live verification provenance

Phase 20A does not fabricate a new manual browser run after documentation-only changes.

The immediately preceding Phase 19G integrated-verification campaign completed human live-browser verification across:

- Authentication;
- Dashboard;
- Resume Studio;
- Interview Coach;
- Learning Workspace;
- responsive shell;
- keyboard/runtime sanity checks.

The operator reported the integrated application working correctly and no reproducible Phase 19G product defect was found.

After Phase 19G, one visible Resume assessment-action presentation issue was repaired on PR #30. That change received:

- RED regression reproduction;
- 64/64 focused tests;
- frontend typecheck;
- frontend production build;
- diff check;
- explicit human screenshot/visual approval.

The fresh Phase 20A automated campaign then covered the final executable tree including those three new regression tests.

Therefore the final evidence chain consists of:

1. integrated human QA from Phase 19G;
2. focused human visual QA for the only post-19G visible change;
3. fresh complete final automated qualification in Phase 20A.

## 9. Known non-blocking diagnostics

The following diagnostics occurred during successful qualification and are recorded rather than hidden:

1. The intentional spoofed `X-Forwarded-For` security test causes `express-rate-limit` to emit `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` while `trust proxy` is false. The adversarial test itself passes and confirms the spoof does not bypass the limiter.
2. `ResumeVersionTimeline.test.tsx` logs duplicate React-key warnings for a synthetic fixture while all tests in that file and the full frontend suite pass.
3. Vite reports dependency-level React Router `"use client"` directives being ignored during bundling; the build succeeds.
4. `resumeApi.ts` is both statically and dynamically imported in current Resume code, so Vite reports that the dynamic import will not move it to a separate chunk; the build succeeds.
5. The frontend production bundle includes a minified JavaScript chunk larger than 500 kB; Vite reports a chunk-size advisory and the build succeeds.

These are technical-debt/performance-quality observations, not hidden failures. None is used to claim perfect code quality.

## 10. Explicit limitations and exclusions

The frozen Career Learning Hub should be presented as a secure, functional, testable university project rather than an enterprise production platform.

Current limitations/exclusions include:

- no third-party OAuth/social login;
- no password-reset/email-verification/MFA workflow;
- no portable repository-local Playwright dependency or `npm run test:browser` script; historical full browser automation used the separately authorized bundled runtime;
- no code execution or compilation for Interview Coding questions;
- no SSE/WebSocket/token-streaming architecture;
- no fabricated general Learning completion percentage where the contract does not provide one;
- no study-set rename endpoint;
- no claim that every possible accessibility criterion has been independently certified;
- no claim of a dedicated external/repository security-scanner pass;
- no claim that the current final release-candidate commit has been deliberately redeployed by Phase 20A;
- no enterprise SLA, high-availability, multi-region, or large-scale performance claim;
- dormant OpenRouter-support code/tests remain in the repository but are not part of the active Gemini-only release path.

## 11. Deployment evidence boundary

Earlier staging work successfully deployed Career Learning Hub using:

- Vercel for the frontend;
- Render for the backend;
- MongoDB Atlas for persistence;
- Gemini-backed workflows with cloud smoke verification.

Those historical staging results demonstrate that the architecture has been deployed and exercised in a cloud environment.

However, Phase 20A does **not** claim that the exact frozen release candidate `a2a3aa0ef5b9cf9583ce4aeae2d676f5f568a790` was newly deployed. Deployment remains a separate explicit approval and verification activity.

## 12. Evidence status matrix

| Area | Implemented | Automated evidence | Human/live evidence | Phase 20A status |
| --- | --- | --- | --- | --- |
| Authentication | Yes | Yes | Yes | Achieved |
| Dashboard | Yes | Yes | Yes | Achieved |
| Resume Studio | Yes | Yes | Yes | Achieved |
| Resume AI assessment | Yes | Yes | Prior live/visual evidence | Achieved |
| Interview Coach | Yes | Yes | Yes, including prior live Gemini acceptance | Achieved |
| Learning Workspace | Yes | Yes | Yes | Achieved |
| Gemini connection/settings | Yes | Yes | Prior local/cloud verification | Achieved |
| Shared responsive shell | Yes | Yes | Yes | Achieved |
| Ownership/security regression | Yes | Yes | N/A for scanner certification | Achieved within test scope |
| Dedicated security scanner | Not claimed | Not run/claimed by Phase 20A | N/A | Not claimed |
| Exact final-candidate deployment | Not performed by Phase 20A | N/A | N/A | Pending separate approval if required |

## 13. Evidence usage for the university report

The following claims are safe to reuse when accompanied by appropriate context:

- Career Learning Hub integrates Resume, Interview, Learning, Dashboard, Authentication, and Gemini-assisted workflows in one MERN-style monorepo application.
- The final executable release candidate is `a2a3aa0ef5b9cf9583ce4aeae2d676f5f568a790`.
- The fresh final complete backend suite passed 515/515 tests.
- The fresh final complete frontend suite passed 1,170/1,170 tests.
- The non-overlapping combined complete-suite count is 1,685 passing tests.
- Backend production/test typechecks, frontend typecheck, shared-types typecheck through the root workspace, backend/frontend production builds, and the root workspace build passed.
- The backend security regression suite passed 43/43 tests.
- Integrated human browser QA passed in Phase 19G, and the only post-19G visible change received its own focused human visual approval.
- Gemini is the active AI service with a Gemini-only release policy; OpenRouter is not exposed as an active provider or fallback in the release path.

The report must not convert these statements into stronger unsupported claims such as “formally penetration tested”, “100% secure”, “enterprise production ready”, “all accessibility standards certified”, or “the exact final candidate is currently deployed” unless later evidence explicitly establishes those claims.

## 14. Phase 20A completion criteria

Phase 20A is ready for its documentation qualification and PR gate when:

- this evidence record exists on the Phase 20A branch;
- the frozen product SHA is recorded correctly;
- final automated counts match the developer-run evidence;
- implemented features are distinguished from exclusions and deferred work;
- security-test evidence is distinguished from a dedicated security-scan claim;
- deployment history is distinguished from exact-final-candidate deployment;
- known warnings are recorded honestly;
- no secret, credential value, token, personal Resume content, Interview answer, or Learning document content is included;
- the documentation diff passes `git diff --check`;
- the Phase 20A branch contains no unintended executable product change.

No merge, deployment, or branch deletion is authorized by this evidence record.