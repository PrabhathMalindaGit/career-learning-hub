# Career Learning Hub master plan

- Project name: Career Learning Hub
- Document purpose: Govern the complete implementation through bounded, reviewable Codex execution phases.
- Status: ACTIVE MASTER PLAN
- Created date: 2026-07-24
- Last updated date: 2026-07-24
- Active editable repository: Career Learning Hub
- Legacy-reference location: `../career-learning-hub-legacy/`
- Legacy-reference policy: The sibling folder is an external read-only legacy reference. Access is deferred to approved legacy-inspection phases.
- Controlling discipline: `karpathy-guidelines`
- Roadmap numbering: Execution roadmap phases in this plan are distinct from the historical implementation files under `docs/phases/`. Do not rename, replace, or reinterpret those historical files.

## Evidence boundary

- The inspected package manifests and architecture documentation describe:
  - React and Vite in `frontend/`.
  - Express and TypeScript in `backend/`.
  - MongoDB through Mongoose.
  - Shared types in `packages/shared-types/`.
- Historical documentation exists for implementation Phases 2 through 9 under `docs/phases/`.
- Phase 0 does not verify dependency installation, type checking, tests, builds, runtime behavior, Git state, or historical implementation claims.
- Execution Phase 3 owns independent local baseline verification.

## Global operating rules

1. Inspect before editing.
2. State assumptions and ambiguities.
3. Define measurable success criteria.
4. Propose the smallest valid implementation.
5. Make surgical changes.
6. Preserve the current architecture and style.
7. Avoid speculative abstractions and unrelated cleanup.
8. Run relevant verification.
9. Require human review before commits.
10. Never commit secrets.
11. Never modify legacy projects.
12. Never weaken tests or security controls to obtain a passing result.
13. Use human visual QA for visible frontend changes.
14. Stop after three unsuccessful code-changing repair attempts for the same root failure. Stop modifying files, report the command, error, attempts, and likely cause, then wait for human direction.
15. Load only the current phase into normal Codex execution context.

## Execution roadmap

### Execution Phase 0: Planning and Repository Governance

#### Status

- Status: COMPLETED

#### Purpose

- Create the master plan, current-phase control file, reusable execution template, and decision log.

#### Required skills

- `karpathy-guidelines`
- `define-goal`
- `technical-writing`
- `migrate-to-codex`
- `onboard-new-user`

#### In scope

- Inspect only the approved repository documentation and package manifests.
- Create `docs/planning/`.
- Create the four approved planning files.
- Record the execution roadmap, controls, and accepted decisions.
- Verify documentation content and edit scope.

#### Out of scope

- Production source-code changes.
- `AGENTS.md` creation.
- Git initialization, cleanup, branch changes, staging, or commits.
- Dependency installation, type checking, tests, builds, or runtime checks.
- `README.md` changes.
- Access to any external read-only legacy reference.

#### Deliverables

- `docs/planning/CAREER_LEARNING_HUB_MASTER_PLAN.md`
- `docs/planning/CURRENT_PHASE.md`
- `docs/planning/PHASE_EXECUTION_TEMPLATE.md`
- `docs/planning/DECISION_LOG.md`

#### Verification

- Confirm all four deliverables exist.
- Confirm only `docs/planning/` files changed.
- Confirm this phase is `ACTIVE`.
- Confirm Execution Phases 1 through 21 are `PLANNED`.
- Confirm no unsupported implementation, Git, test, build, or legacy-inspection claim appears.
- Confirm the root-failure stop rule appears in all four planning files.

#### Human approval gate

- The four planning files must pass human review.
- Required approval token: `PHASE_0_APPROVED`
- Do not activate Execution Phase 1 automatically.

#### Expected commit

- None in this phase. Stop before commit.

### Execution Phase 1: Git Baseline and Repository Cleanup

#### Status

- Status: COMPLETED

#### Purpose

- Inspect repository status.
- Review `.gitignore`.
- Initialize Git only if needed.
- Establish `main` and `phase-10-unified-frontend` branches.
- Ensure secrets, `node_modules`, builds, coverage, private storage, and migration inputs are excluded.
- Create the initial reviewed baseline commit.

#### Required skills

- `karpathy-guidelines`
- `define-goal`
- `executing-plans`
- `finishing-a-development-branch`

#### In scope

- Git-state inspection and baseline setup.
- `.gitignore` review and surgical cleanup.
- Approved branch creation.
- Review of the exact baseline diff before commit.

#### Out of scope

- Feature implementation.
- Baseline dependency, type-check, test, or build verification.
- Legacy-project access.

#### Deliverables

- Reviewed repository status.
- Approved `.gitignore` protections.
- Required branches.
- Reviewed baseline commit.

#### Verification

- Confirm the current branch and branch list.
- Confirm ignored sensitive and generated paths.
- Review `git status`, staged changes, and diff before commit.
- Confirm no secret or external read-only legacy reference content is tracked.

#### Human approval gate

- Show status and diff.
- Stop before commit until the user authorizes it.

#### Expected commit

- `Complete backend foundation through Phase 9`

### Execution Phase 2: Codex Repository Instructions

#### Status

- Status: COMPLETED

#### Purpose

- Create root `AGENTS.md`.
- Define repository architecture, commands, coding discipline, security, legacy-reference policy, visual-QA requirement, debugging limit, and commit-review rules.

#### Required skills

- `karpathy-guidelines`
- `technical-writing`
- `migrate-to-codex`
- `onboard-new-user`

#### In scope

- Root Codex repository instructions.
- Repository-specific working rules derived from approved planning decisions.

#### Out of scope

- Production source-code changes.
- Dependency installation or application verification.
- Legacy-project access.

#### Deliverables

- Root `AGENTS.md`.

#### Verification

- Confirm instructions match the approved architecture and decisions.
- Confirm commands are grounded in repository manifests.
- Confirm legacy isolation, human review, visual QA, and the root-failure stop rule are explicit.

#### Human approval gate

- Review the full `AGENTS.md` diff before commit.

#### Expected commit

- `Add Codex repository instructions`

### Execution Phase 3: Baseline Verification

#### Status

- Status: COMPLETED

#### Purpose

- Install dependencies.
- Run type checking, unit tests, integration tests, security tests, and the production build.
- Fix only verified baseline defects.
- Create `docs/phases/phase-10-baseline-report.md`.

#### Required skills

- `karpathy-guidelines`
- `define-goal`
- `executing-plans`
- `systematic-debugging`
- `test-driven-development`
- `technical-writing`

#### In scope

- Dependency installation.
- Required local verification commands.
- Surgical fixes for reproduced baseline failures.
- A factual baseline report.

#### Out of scope

- New product features.
- Speculative refactors or dependency upgrades.
- Legacy-project access.

#### Deliverables

- Installed workspace dependencies.
- Verified or accurately reported baseline command results.
- `docs/phases/phase-10-baseline-report.md`

#### Verification

- Run `node -v`.
- Run `npm -v`.
- Run `npm install`.
- Run `npm run typecheck`.
- Run `npm run test:unit`.
- Run `npm run test:integration`.
- Run `npm run test:security`.
- Run `npm run build`.
- Record exact results without weakening checks.

#### Human approval gate

- Review failures, repairs, final command evidence, and the Git diff.
- Stop before commit until the user authorizes it.

#### Expected commit

- `Verify Phase 9 project baseline`

### Execution Phase 4: Frontend Architecture Audit

#### Status

- Status: COMPLETED

#### Purpose

- Inspect the existing frontend.
- Inventory routes, scaffolds, components, styles, API wrappers, state, dependencies, shared types, and placeholders.
- Produce a minimal Execution Phase 5 implementation plan.
- Make no production-code changes.

#### Required skills

- `karpathy-guidelines`
- `frontend-skill`
- `modern-web-guidance`
- `build-web-apps:react-best-practices`
- `brainstorming`
- `technical-writing`

#### In scope

- Read-only frontend architecture inspection.
- Evidence-based inventory and gap analysis.
- Minimal plan for Execution Phase 5.

#### Out of scope

- Production-code or dependency changes.
- Visual redesign.
- Legacy-project access.

#### Deliverables

- `docs/frontend/frontend-architecture-audit.md`

#### Verification

- Trace each inventory item to a repository file.
- Separate implemented behavior, scaffold, placeholder, and unknown state.
- Confirm no production source file changed.

#### Human approval gate

- Review and approve the audit before Execution Phase 5 begins.

### Execution Phase 5: Authentication, Routing and Shared API Infrastructure

#### Status

- Status: COMPLETED

#### Purpose

- Implement application routing.
- Implement registration, login, logout, and refresh bootstrap.
- Keep access tokens in React memory.
- Keep refresh tokens in the existing HttpOnly cookie.
- Create one shared API client.
- Add protected and public-only routes.
- Build the application shell and mobile navigation.

#### Required skills

- `karpathy-guidelines`
- `backend-api-design`
- `frontend-skill`
- `modern-web-guidance`
- `build-web-apps:react-best-practices`
- `test-driven-development`
- `security-best-practices`
- `systematic-debugging`

#### In scope

- Authentication UI and client state.
- Routing guards and refresh bootstrap.
- One shared API client.
- Application shell and mobile navigation.

#### Out of scope

- A new authentication provider.
- Persistent access-token storage.
- Feature-domain dashboards and workspaces.
- A second design system.

#### Deliverables

- Working public and protected navigation.
- Registration, login, logout, and refresh flows.
- Shared API infrastructure.
- Tested application shell.

#### Verification

- Run targeted authentication, routing, API-client, type-check, and build checks.
- Verify access tokens remain in memory and refresh tokens remain in the existing HttpOnly cookie.
- Perform browser checks.
- Complete human visual QA before commit.

#### Human approval gate

- Provide a local URL and visual inspection checklist.
- Stop before commit until the user provides the phase-specific visual approval token and commit authorization.

#### Expected commit

- `Build authentication routing and API infrastructure`

### Execution Phase 6: Unified Dashboard

#### Status

- Status: COMPLETED

#### Purpose

- Connect real dashboard, progress, and activity endpoints.
- Display only actual resume, interview, learning, quiz, AI usage, and activity records.
- Add 7, 30, 90, and 365-day windows.
- Add loading, empty, error, and pagination states.
- Do not invent metrics or progress.

#### Required skills

- `karpathy-guidelines`
- `frontend-design`
- `frontend-skill`
- `build-web-apps:react-best-practices`
- `graphify`
- `playwright`
- `lighthouse-verification`

#### In scope

- Dashboard API integration and real-record presentation.
- Approved time windows and bounded pagination.
- Loading, empty, and error states.

#### Out of scope

- Invented metrics, synthetic progress, or unsupported aggregation.
- Resume, interview, or learning feature implementation.

#### Deliverables

- Connected unified dashboard.
- Tested states for actual user data and no-data conditions.

#### Verification

- Verify displayed values against API responses and owned database records.
- Verify all four time windows and pagination.
- Run targeted checks and browser workflows.
- Complete human visual QA before commit.

#### Human approval gate

- Provide a local URL and visual inspection checklist.
- Stop before commit until the user provides the phase-specific visual approval token and commit authorization.

#### Expected commit

- `Connect unified dashboard`

### Execution Phase 7: Resume Legacy Inspection

#### Status

- Status: COMPLETED

#### Purpose

- Inspect approved legacy folders only after explicit access is granted.
- Classify features as `PORT`, `REBUILD`, `REFERENCE ONLY`, or `REJECT`.
- Reject legacy authentication, backend, API clients, database models, environment files, and package configuration.

#### Required skills

- `karpathy-guidelines`
- `brainstorming`
- `frontend-design`
- `frontend-skill`
- `technical-writing`
- `subagent-driven-development`

#### In scope

- Temporary read-only inspection of:
  - Resume Builder.
  - AI Resume Analyser.
- Feature inventory and classification.
- A migration plan limited to approved frontend concepts and assets.

#### Out of scope

- Any legacy-file modification, copy, execution, dependency installation, or configuration use.
- Production implementation.
- Importing legacy authentication, backend, API clients, database models, environment files, or package configuration.

#### Deliverables

- `docs/legacy-analysis/resume-builder-inventory.md`
- `docs/legacy-analysis/resume-analyser-inventory.md`
- `docs/legacy-analysis/resume-migration-plan.md`

#### Verification

- Confirm explicit read-only access was granted before inspection.
- Trace classifications to inspected evidence.
- Confirm implementation targets only the active repository.
- Confirm no external read-only legacy reference changed.

#### Human approval gate

- Human approval is required before Resume Studio implementation begins.

### Execution Phase 8: Resume Studio Implementation

#### Status

- Status: COMPLETED

#### Purpose

- Build resume listing and creation.
- Build canonical resume editing.
- Preserve stable entry and bullet IDs.
- Save immutable versions.
- Show version history.
- Add supported design and preview controls.
- Integrate PDF import and job polling.
- Integrate resume analysis.
- Apply only selected stored suggestion IDs.

#### Required skills

- `karpathy-guidelines`
- `frontend-design`
- `frontend-skill`
- `build-web-apps:react-best-practices`
- `test-driven-development`
- `subagent-driven-development`
- `playwright`
- `systematic-debugging`

#### In scope

- Approved Resume Studio features in the active repository.
- Existing backend contracts and stored suggestion IDs.
- Stable IDs and immutable version behavior.

#### Out of scope

- Legacy backend or configuration reuse.
- Applying free-form or unselected AI suggestions.
- Unapproved resume features or design systems.

#### Deliverables

- Complete approved Resume Studio UI and integrations.
- Targeted automated coverage.

#### Verification

- Verify stable IDs, immutable versions, import polling, analysis, and selected suggestion application.
- Run targeted type checks, tests, build, and browser workflows.
- Complete human visual QA before commit.

#### Human approval gate

- Provide a local URL and visual inspection checklist.
- Stop before commit until the user provides the phase-specific visual approval token and commit authorization.

#### Expected commit

- `Complete Resume Studio`

### Execution Phase 9: Interview Legacy Inspection

#### Status

- Status: COMPLETED

#### Purpose

- Inventory session, question, notes, pinning, attempt, and feedback UX.
- Classify features as `PORT`, `REBUILD`, `REFERENCE ONLY`, or `REJECT`.

#### Required skills

- `karpathy-guidelines`
- `brainstorming`
- `frontend-design`
- `frontend-skill`
- `technical-writing`

#### In scope

- Temporary read-only inspection of Interview Prep Ai after explicit access is granted.
- Feature inventory, classification, and migration planning.

#### Out of scope

- Any legacy-file modification, copy, execution, dependency installation, or configuration use.
- Production implementation.
- Legacy authentication, backend, API client, database, environment, or package reuse.

#### Deliverables

- `docs/legacy-analysis/interview-prep-inventory.md`
- `docs/legacy-analysis/interview-migration-plan.md`

#### Verification

- Confirm explicit read-only access was granted before inspection.
- Trace classifications to inspected evidence.
- Confirm no external read-only legacy reference changed.

#### Human approval gate

- Human approval is required before Interview Coach implementation begins.

### Execution Phase 10: Interview Coach Implementation

#### Status

- Status: COMPLETED

#### Purpose

- Build session management.
- Add manual and generated questions.
- Use idempotent generation requests.
- Add pinning and private notes.
- Add explanations.
- Add written attempts and AI feedback.
- Preserve ownership and IDOR protections.

#### Required skills

- `karpathy-guidelines`
- `frontend-design`
- `frontend-skill`
- `build-web-apps:react-best-practices`
- `subagent-driven-development`
- `test-driven-development`
- `playwright`
- `security-best-practices`

#### In scope

- Approved Interview Coach features in the active repository.
- Existing backend contracts and ownership controls.
- Idempotent generation and private user data.

#### Out of scope

- Legacy backend or configuration reuse.
- Weakening ownership or IDOR controls.
- Unapproved AI behaviors.

#### Deliverables

- Complete approved Interview Coach UI and integrations.
- Targeted automated coverage.

#### Verification

- Verify session ownership, idempotency, private notes, attempts, explanations, and feedback.
- Test User A versus User B access boundaries.
- Run targeted type checks, tests, build, and browser workflows.
- Complete human visual QA before commit.

#### Human approval gate

- Provide a local URL and visual inspection checklist.
- Stop before commit until the user provides the phase-specific visual approval token and commit authorization.

#### Completion record

- Implementation commit: `6922120` (`Complete Interview Coach`).
- Implementation and repair review completed.
- Human visual QA and final implementation review approved.
- Frontend tests passed: 241/241.
- Backend complete suite passed: 33/33.
- Frontend and root typechecks passed.
- Production build passed.
- Ownership, privacy, stale-operation, request-ID, responsive, and
  accessibility verification passed.
- No Critical, Important, or Minor findings remained.
- Gemini remained unconfigured. Real-provider generation, explanation, and
  feedback success paths were not runtime-verified; unavailable-provider
  behavior and deterministic contracts were verified.
- Phase 10 was completed without pushing the branch.

### Execution Phase 11: Learning Legacy Inspection

#### Status

- Status: COMPLETED
- Activated by operator-approved prompt
  `CLH-PHASE-11-LEARNING-LEGACY-INSPECTION-01`.
- Current workflow state:
  `PHASE 11 COMPLETED — PHASE 12 PLANNED, NOT ACTIVATED`.

#### Purpose

- Inventory document, upload, processing, chat, flashcard, and quiz UX.
- Identify privacy and answer-key exposure risks.
- Classify features as `PORT`, `REBUILD`, `REFERENCE ONLY`, or `REJECT`.

#### Required skills

- `karpathy-guidelines`
- `brainstorming`
- `frontend-design`
- `frontend-skill`
- `technical-writing`

#### In scope

- Temporary read-only inspection of the legacy AI Learning Assistant under
  `/Users/prabhathmalinda/Documents/Projects/career-learning-hub-legacy/AI Learning Assistant`.
- Feature inventory, risk identification, classification, and migration planning.

#### Out of scope

- Any legacy-file modification, copy, execution, dependency installation, or configuration use.
- Production implementation.
- Exposure of private data or answer keys.
- Activation or implementation of Phase 12.

#### Deliverables

- `docs/legacy-analysis/learning-assistant-inventory.md`
- `docs/legacy-analysis/learning-migration-plan.md`

#### Verification

- Confirm explicit read-only access was granted before inspection.
- Trace classifications and risks to inspected evidence.
- Confirm no external read-only legacy reference changed.

#### Completion record

- The legacy inspection completed read-only and the before/after integrity
  baselines matched exactly.
- 42 features were inventoried: `PORT` 0, `REBUILD` 21,
  `REFERENCE ONLY` 9, and `REJECT` 12.
- 14 confirmed security/privacy risks and 1 plausible risk were recorded.
- Legacy answer-key exposure was confirmed.
- Operator decisions OD-001 through OD-005 were resolved.
- Analysis review was approved with
  `PHASE_11_ANALYSIS_REVIEW_APPROVED`.
- No production code changed.
- No tests, typechecks, builds, servers, browsers, providers, package commands,
  or security scanners ran because Phase 11 was documentation-only.

#### Human approval gate

- Operator decisions OD-001 through OD-005 were resolved and human approval
  token `PHASE_11_ANALYSIS_REVIEW_APPROVED` was received on 2026-07-26.
- Phase 12 still requires a separate operator-approved execution prompt.

### Execution Phase 12: Learning Workspace Implementation

#### Status

- Status: COMPLETED
- Activated by operator-approved prompt
  `CLH-PHASE-12A-PRIVATE-PDF-CONTRACT-01`.
- Current workflow state:
  `PHASE 12 COMPLETED — LEARNING WORKSPACE IMPLEMENTATION VERIFIED`.
- Pass A — Private-PDF Contract is `COMPLETED`.
- Pass A review was approved with
  `PHASE_12A_PRIVATE_PDF_CONTRACT_REVIEW_APPROVED`.
- `GET /api/v1/learning-documents/:documentId/source` provides authenticated,
  owner-scoped, short-lived private access and exposes only `url`, `expiresAt`,
  and `contentType`.
- Page-aware extracted chunks remain authoritative for grounding and citations.
- Pass B — Document Library and Workspace is `COMPLETED`.
- Pass B visual QA was approved with
  `PHASE_12B_DOCUMENT_WORKSPACE_VISUAL_QA_APPROVED`.
- Pass C — Grounded Document Chat is `COMPLETED`, activated by the
  operator-approved prompt `CLH-PHASE-12C-GROUNDED-DOCUMENT-CHAT-01`.
- Pass D — Flashcard Generation and Study is `COMPLETED`.
- Pass D human visual QA was approved with
  `PHASE_12D_FLASHCARDS_VISUAL_QA_APPROVED`.
- Pass E — Quiz Generation, Submission and Review is `COMPLETED`.
- Pass E human visual QA was approved with
  `PHASE_12E_QUIZZES_VISUAL_QA_APPROVED`.
- Pass F — Document Cascade Deletion and Phase 12 Final Verification is
  `COMPLETED`.
- Pass F human visual QA was approved with
  `PHASE_12F_DELETION_VISUAL_QA_APPROVED`.
- Phase 12 is `COMPLETED`.

#### Pass F completion record

- Delivered owned document-level cascade deletion with explicit exact-title
  destructive confirmation, asynchronous deletion-job acceptance, same-job
  polling, duplicate-delete prevention, safe pause and same-job resume, and
  uncertain-outcome canonical reconciliation.
- Delivered canonical redirect after deletion, secure PDF object-URL
  revocation, and stale document, conversation, flashcard, quiz, and review
  state clearing.
- Preserved a single document-level destructive action with no standalone
  child-resource deletion controls, User A/User B ownership protection, safe
  missing/foreign equivalence, and a responsive and accessible workflow.
- Preserved the private bounded document work fence, transactional final-write
  fencing, new-work rejection after deletion begins, scoped queued-job
  cancellation, processing-job safe terminalization, deletion-job
  preservation, and other-document and other-user isolation.
- Runtime cascade verification confirmed zero post-deletion orphan records:
  the Learning Document, chunks, conversations, messages, flashcard sets,
  flashcards, quizzes, quiz questions, and quiz attempts were removed.
- The queued non-deletion job was cancelled; the deletion job was retained
  under the existing safe retention policy; the Asset record was retained
  with status `deleted`; and the private stored object was removed.
- Focused frontend deletion verification passed with 80 tests. The complete
  frontend suite passed with 534 tests.
- Backend unit, integration, security, and concurrency regression verification
  passed with 19, 42, 7, and 21 tests respectively.
- Frontend, backend, and root typechecks passed. The root production build and
  `npm ls --depth=0` passed.
- Runtime deletion and cascade verification and the integrated Passes A
  through E smoke verification passed.
- Responsive QA passed at 1440px, 1024px, 768px, 390px, and 320px. Human
  visual QA approved native 200% zoom and keyboard behavior with
  `PHASE_12F_DELETION_VISUAL_QA_APPROVED`.
- No unresolved Critical or Important findings remained. Real provider and S3
  calls were not required or claimed.

#### Phase 12 completion record

- Pass A — Private PDF Contract: `COMPLETED`.
- Pass B — Document Library and Workspace: `COMPLETED`.
- Pass C — Grounded Document Chat: `COMPLETED`.
- Pass D — Flashcard Generation and Study: `COMPLETED`.
- Pass E — Quiz Generation, Submission and Review: `COMPLETED`.
- Pass F — Document Cascade Deletion and Phase 12 Final Verification:
  `COMPLETED`.
- Phase 13 was activated separately by the operator-approved
  `CLH-PHASE-13A-ACTIVATE-AND-AUDIT-01` prompt after Phase 12 completion.

#### Pass E completion record

- Delivered owned quiz generation and listing, exact generation-job polling,
  and safe quiz-taking DTOs without pre-submission answer keys.
- Delivered one-choice-per-question interaction, transient in-memory drafts,
  server-authoritative submission and scoring, duplicate-submit prevention,
  and safe uncertain-outcome reconciliation.
- Delivered immutable explicit multiple attempts, paginated owned attempt
  history, authorized completed-attempt review, selected-versus-correct answer
  display, and post-submission explanations.
- Delivered canonical source-page controls, plain-text rendering, nested
  document/quiz/attempt ownership, stale-response protection, account and
  logout clearing, and responsive accessible quiz workflows.
- `GET /api/v1/jobs/:jobId` now allowlists public failed-job errors to `code`
  and `message`; stack traces and arbitrary stored error metadata are not
  serialized publicly, while internal stored error behavior remains intact.
- Focused answer-key and quiz tests passed. The complete frontend suite passed
  with 486 tests. Frontend and root typechecks and the root production build
  passed.
- Backend unit, integration, and security suites passed with 19, 21, and 7
  tests respectively. The job-response regression passed with 3 tests.
- Runtime generation and truthful Gemini-unavailable failure, safe taking,
  submission, attempt history, review, and User A/User B ownership boundaries
  passed. Gemini remained unconfigured; real-provider generation success was
  not claimed.
- Desktop, tablet, and mobile responsive QA passed. Human verification
  approved native keyboard behavior, visible focus, native 200% zoom, mobile
  and desktop layout, non-color-only correctness, and absence of
  pre-submission answer-key exposure.
- No unresolved Critical or Important findings remained. Human visual QA was
  approved with `PHASE_12E_QUIZZES_VISUAL_QA_APPROVED`.

#### Pass D delivered scope

- Owned flashcard-set generation, listing, detail, and canonical flashcard
  retrieval.
- Exact generation-job polling with truthful queued, processing, paused,
  failed, cancelled, and completed states.
- Route-bound, responsive, and accessible flashcard study with transient
  mounted-session state only.
- Canonical source-page controls, nested document/set identity protection,
  stale-response prevention, and account-change and logout cleanup.

#### Pass D completion record

- Delivered owned flashcard-set generation and listing, strict canonical
  response validation, exact generation-job polling, canonical completion
  refetch, and route-bound study.
- Delivered explicit answer reveal and hide/reset, previous and next
  navigation with boundaries, transient mounted-session state, canonical
  source-page controls, stale-response protection, and account-change cleanup.
- Focused RED/GREEN coverage passed. The complete frontend suite passed with
  409 tests, and directly affected tests passed after the final review repairs.
  Frontend and root typechecks, the production build, dependency integrity,
  runtime verification, and responsive browser QA passed.
- User A/User B ownership, logout and account switching, long-content
  wrapping, visible focus, and 320px overflow behavior were verified. No
  unresolved Critical or Important findings remained.
- Human visual QA was approved with
  `PHASE_12D_FLASHCARDS_VISUAL_QA_APPROVED`.
- Gemini remained unconfigured. Truthful provider-unavailable behavior was
  verified; real-provider success was not claimed.

#### Pass B completion record

- Delivered the owned document library with canonical status filtering and
  pagination, accessible private-PDF upload, bounded processing-job polling,
  and truthful uploaded, processing, ready, failed, and deleting states.
- Delivered the document overview, stored summary and key points, secure
  short-lived private-PDF viewer, page-aware extracted-content reader,
  stale-response protection, and responsive accessible document workflows.
- The complete frontend suite passed with 322 tests. Frontend and root
  typechecks, the production build, runtime upload and workspace verification,
  and desktop, tablet, and mobile browser QA passed.
- No unresolved Critical or Important findings remained.
- Gemini remained unconfigured. Provider-unavailable processing behavior was
  verified truthfully; real-provider processing success was not claimed.

#### Pass C completion record

- Implementation checkpoint `92aad4c` and generated-file correction `000df7c`
  were verified.
- Delivered owned conversation creation and listing, nested conversation
  routing, canonical paginated message history, idempotent question
  submission, duplicate-send prevention, bounded job polling, pause and resume
  using the same job, and canonical assistant-message refetch.
- Delivered validated source-page controls, plain-text rendering,
  stale-response and account-change protection, safe missing or foreign
  conversation handling, and responsive accessible chat workflows.
- The nested document/conversation identity repair was verified. Focused
  Grounded Chat tests and the complete frontend suite passed after the repair,
  as did frontend and root typechecks and the root production build.
- Desktop, tablet, and mobile runtime QA, User A/User B boundaries, logout and
  account-switch clearing, and human visual QA passed. No unresolved Critical
  or Important findings remained.
- Human visual QA was approved with
  `PHASE_12C_GROUNDED_CHAT_VISUAL_QA_APPROVED`.
- Gemini remained unconfigured. Truthful provider-unavailable behavior was
  verified; real-provider success was not claimed.

#### Purpose

- Build document upload and processing status.
- Build page-aware document viewing.
- Build grounded chat with source references.
- Build flashcard generation and study.
- Build quiz generation, submission, and review.
- Never expose answer keys before successful submission.
- Add confirmed cascade deletion.

#### Required skills

- `karpathy-guidelines`
- `frontend-design`
- `frontend-skill`
- `build-web-apps:react-best-practices`
- `subagent-driven-development`
- `test-driven-development`
- `playwright`
- `security-best-practices`

#### In scope

- Approved Learning Workspace features in the active repository.
- Existing document, job, chat, flashcard, and quiz contracts.
- Privacy, source grounding, answer-key secrecy, and confirmed deletion.

#### Out of scope

- Legacy backend or configuration reuse.
- Answer-key exposure before successful submission.
- Unconfirmed destructive actions.

#### Deliverables

- Complete approved Learning Workspace UI and integrations.
- Targeted automated coverage.

#### Verification

- Upload status, page references, grounded sources, study flows, submission
  gating, review, and cascade deletion were verified.
- User A versus User B access boundaries and answer-key secrecy were verified.
- Targeted and complete tests, typechecks, the production build, runtime
  verification, and browser workflows passed as recorded above.
- Human visual QA was approved before the Phase 12 governance closeout commit.

#### Human approval gate

- The local URL and visual inspection checklist were provided.
- Phase 12F human visual QA was approved with
  `PHASE_12F_DELETION_VISUAL_QA_APPROVED`.
- The Phase 12 governance closeout commit was separately authorized.

#### Expected commit

- `Complete Phase 12 Learning Workspace`

### Execution Phase 13: Shared Design and UX Hardening

#### Status

- Status: COMPLETED
- Activated by operator-approved prompt
  `CLH-PHASE-13A-ACTIVATE-AND-AUDIT-01`.
- Most recently completed pass: Phase 13G — Integrated Accessibility and
  Visual QA
  (`COMPLETED`).
- Active pass: None.
- Next planned major phase: Phase 14 — End-to-End Browser Testing
  (`PLANNED` / `INACTIVE`).
- Current workflow state:
  `PHASE 13 COMPLETED — PHASE 14 PLANNED, NOT ACTIVATED`.
- Phase 13A was audit-only and made no production UI changes.
- Phase 13A remains `COMPLETED`.
- Consolidation recommendations must demonstrate genuine duplication.
- The evidence-led audit and six-pass implementation structure were approved
  with `PHASE_13A_SHARED_DESIGN_AUDIT_APPROVED`.
- Approved decisions D13-01 through D13-12 are recorded once as the
  controlling Phase 13 direction in
  `docs/planning/PHASE_13_IMPLEMENTATION_PLAN.md`.
- The approval did not authorize production implementation. The
  documentation-only closeout commit was separately authorized by
  `CLH-PHASE-13A-DOCUMENTATION-CLOSEOUT-01`.
- Phase 13B was activated by
  `CLH-PHASE-13B-ACTIVATE-AND-IMPLEMENT-01` from implementation baseline
  `3e16017` (`Complete Phase 13 shared design audit`).
- Decisions D13-01, D13-02, D13-03, D13-05, D13-06, D13-11, and D13-12
  controlled Phase 13B.
- Phase 13B is `COMPLETED`. Human visual QA was approved with
  `PHASE_13B_SHARED_FOUNDATIONS_VISUAL_QA_APPROVED`.
- Phase 13C was activated by
  `CLH-PHASE-13C-ACTIVATE-AND-IMPLEMENT-01` from implementation baseline
  `78b9fee` (`Complete Phase 13 shared foundations`).
- Phase 13C is `COMPLETED`. Human visual QA was approved with
  `PHASE_13C_FORMS_ACTIONS_VISUAL_QA_APPROVED`, and closeout was authorized by
  `CLH-PHASE-13C-CLOSEOUT-AND-COMMIT-01`.
- Phase 13D was activated by operator-approved prompt
  `CLH-PHASE-13D-ACTIVATE-AND-IMPLEMENT-01` from implementation baseline
  `d44fe63` (`Complete Phase 13 forms and actions`).
- Decisions D13-03, D13-05, D13-06, D13-10, D13-11, and D13-12 control
  Phase 13D.
- Phase 13D is `COMPLETED`. Human visual QA approved the required state,
  pagination, Learning job-state, responsive, zoom, and keyboard checks.
- Phase 13D closeout and the implementation commit were authorized by
  `CLH-PHASE-13D-CLOSEOUT-AND-COMMIT-01`.
- Phase 13E was activated by operator-approved prompt
  `CLH-PHASE-13E-ACTIVATE-AND-IMPLEMENT-01` from implementation baseline
  `6658e2b` (`Complete Phase 13 states and pagination`).
- Decisions D13-03, D13-04, D13-06, D13-07, D13-08, D13-11, and D13-12
  control Phase 13E.
- Phase 13E is `COMPLETED`. Human review approved the required dialog, focus,
  navigation, responsive, zoom, and physical-keyboard checks.
- Phase 13E closeout and the implementation commit were authorized by
  `CLH-PHASE-13E-CLOSEOUT-AND-COMMIT-01`.
- Phase 13F was activated by operator-approved prompt
  `CLH-PHASE-13F-ACTIVATE-AND-IMPLEMENT-01` from implementation baseline
  branch `phase-12-unified-frontend`, HEAD
  `dcd31da81c7ed886dc8f83da339a8d112abd6aab`
  (`Complete Phase 13 dialogs and navigation`).
- Decisions D13-02, D13-03, D13-04, D13-08, D13-09, D13-10, D13-11, and
  D13-12 control Phase 13F.
- Phase 13F is `COMPLETED`. Human visual QA was approved with
  `PHASE_13F_RESPONSIVE_HARDENING_VISUAL_QA_APPROVED`.
- Phase 13F closeout and the implementation commit were authorized by
  `CLH-PHASE-13F-CLOSEOUT-AND-COMMIT-01`.
- Phase 13G was activated by operator-approved prompt
  `CLH-PHASE-13G-ACTIVATE-AND-VERIFY-01` from verification baseline branch
  `phase-12-unified-frontend`, HEAD
  `249dec15888887a4c2cda859b1c7db0593675b14`
  (`Complete Phase 13 responsive hardening`).
- Phase 13G was verification-first and is now `COMPLETED`. Human integrated
  visual QA was approved with
  `PHASE_13G_INTEGRATED_VISUAL_QA_APPROVED`.
- Repair-and-resume prompt
  `CLH-PHASE-13G-TEST-HARNESS-REPAIR-AND-RESUME-01` repaired the single
  timing-sensitive test assertion with an awaited exact-call assertion. The
  isolated test, 25-file focused gate (290/290), complete frontend suite
  (569/569), frontend and root typechecks, and production build passed.
- Integrated Browser verification then confirmed one Important product
  finding: five ordinary Interview workspace controls rendered at
  39.5–41.5px instead of the required 44px minimum.
- Repair-and-resume prompt
  `CLH-PHASE-13G-INTERVIEW-TARGET-REPAIR-AND-RESUME-01` authorized one
  bounded production repair in
  `frontend/src/features/interviews/interviewCoach.css`. A narrow
  Interview-only selector group now applies
  `min-height: var(--minimum-interactive-target)` to exactly those five
  controls.
- Focused Interview/router verification passed 3 files and 93 tests; the
  post-repair complete frontend suite passed 41 files and 569 tests exactly
  once; both typechecks and the production build passed.
- The five repaired controls measured exactly 44px high at 1440, 1024, 768,
  390, and 320 CSS pixels. No ordinary Interview target remained below 44px,
  and the completed route/width matrix had no horizontal overflow, console
  issue, framework overlay, privacy disclosure, ownership disclosure, or quiz
  answer-key exposure.
- Human review approved native 200% zoom; Tab and Shift+Tab; Enter and Space;
  native arrow keys, Home, and End; dialog initial focus, containment,
  Escape, cancellation, and exact focus return; visible unclipped focus; all
  five viewport widths; repaired Interview targets; overflow and wrapping;
  route, typography, and visual-identity preservation; ownership-neutral
  states; private-data presentation; and quiz answer secrecy.
- Phase 13A through Phase 13G are `COMPLETED`. Integrated verification passed
  with no unresolved Critical, Important, Minor, or verification-blocking
  finding. Decisions D13-01 through D13-12 remain satisfied.
- Phase 13 is `COMPLETED`.
- Synthetic records, temporary fixtures, and generated build outputs were
  removed and verified absent.
- This governance closeout commit is authorized by
  `CLH-PHASE-13G-RECONCILE-INTERVENING-COMMIT-AND-CLOSEOUT-01`; push is not
  authorized.
- Phase 14 remains `PLANNED` / `INACTIVE`, is not activated, and requires a
  separate operator-approved activation prompt.

#### Phase 13B completion evidence

- Additive shared tokens were created from existing canonical values, and one
  minimal neutral `PageHeader` was added without introducing a second design
  system.
- Dashboard, Resume list, and Interview list were the only migrated
  consumers. Learning and all domain workspaces remained unchanged.
- No generic Card, Workspace, Tabs, dialog, pager, form system, toast
  provider, or cross-domain job component was created.
- Focused tests passed: `PageHeader` 5/5, Dashboard 15/15, Resume list 9/9,
  and Interview list 7/7. The complete frontend suite passed 541/541;
  frontend and root typechecks passed; and the production build passed.
- Rendered QA passed for Dashboard, Resume list, Interview list, and the
  unchanged Learning comparison route at 1440px, 1024px, 768px, 390px, and
  320px. The browser console had no relevant warnings or errors, and
  synthetic cleanup passed.
- Human review approved native 200% zoom, keyboard focus and activation,
  header wrapping, action ordering, visual identity preservation, typography
  preservation, and the absence of new header-level overflow.
- Existing React Router directive and production chunk-size warnings remain.
  The pre-existing approximately 15px global root overflow at 320px remains
  deferred to Phase 13F.
- `DashboardLayout.tsx` remains untouched and requires separate authorization
  if later removal is justified. Backend tests and AI-provider configuration
  were not required because no backend code changed and no provider success
  was in scope.

#### Phase 13C completion evidence

- Shared field, required-state, help, error, validation-summary, primary,
  secondary, destructive, quiet, disabled, loading, and minimum-target
  foundations were implemented without a generic Form framework,
  schema-generated forms, a toast provider, or a second design system.
- Login, Registration, Resume list and workspace, Interview list and
  workspace, Learning upload, and Quiz submit behavior were migrated. The
  Resume “Discard draft changes” action was repaired to a 46px target.
- Multiple field failures focus a validation summary, one independently
  invalid field receives direct focus, field-level errors remain associated,
  and server or background failures do not move focus without a field target.
- Focused GREEN verification passed. The complete frontend suite passed
  545/545; frontend and root typechecks passed; and the production build
  passed.
- Browser QA passed at 1440px, 1024px, 768px, 390px, and 320px with no
  relevant console errors or warnings. Human review approved the Auth,
  Resume, Interview, Learning, and Quiz validation and action flows, visible
  focus, native 200% zoom, physical keyboard behavior, typography, visual
  identity, and the absence of new form- or action-level clipping or overlap.
- Human review also approved native file-input usability, native quiz answer
  controls, and the absence of pre-submission answer-key exposure.
- Synthetic cleanup passed and generated artifacts were absent. Backend tests
  and AI-provider configuration were not required.
- Existing React Router directive and production chunk-size warnings remain.
  The existing approximately 15px global root overflow at 320px remains
  deferred to Phase 13F. Dialog mechanics remain assigned to Phase 13E;
  pagination, shared state surfaces, and job-status presentation remain
  assigned to Phase 13D.

#### Phase 13D completion evidence

- Created caller-owned `StateSurface` static, status, and alert presentation;
  a labelled, caller-controlled `Pager`; and Learning-specific
  `LearningGenerationJobStatus`.
- Migrated the unknown route, Dashboard activity, Resume list, Interview list,
  Learning library, Flashcard generation, and Quiz generation states.
  Dashboard activity, Resume list, Interview list, and Learning library were
  the only pager migrations; specialized domain workflows remained local.
- Preserved routes, API and polling behavior, retry, resume, refresh,
  cancellation, timeout, completion validation, recovery, request IDs,
  ownership-neutral not-found wording, quiz answer secrecy, status colors,
  and typography. No toast provider or cross-domain job engine was added.
- Focused verification passed 10 files and 132 tests. The complete frontend
  suite passed 39 files and 563 tests; frontend and root typechecks and the
  production build passed.
- Browser QA passed at 1440px, 1024px, 768px, 390px, and 320px with a healthy
  console. Human review approved state and pagination behavior, Learning
  generation presentation, native 200% zoom, physical keyboard operation,
  visible focus, wrapping, and mobile containment.
- Synthetic cleanup passed and generated artifacts were absent. Existing
  React Router directive and production chunk-size warnings remain. The
  existing approximately 15px global root overflow at 320px remains deferred
  to Phase 13F; dialogs and navigation mechanics remain assigned to Phase
  13E. Backend tests and AI-provider configuration were not required.

#### Phase 13E completion evidence

- Created one minimal native `Dialog` presentation shell. The AI
  recommendation confirmation was migrated first and the Resume
  unsaved-navigation blocker second, while caller-owned copy, actions, forms,
  state, and domain behavior were preserved.
- Deterministic non-destructive initial focus, accessible names and
  descriptions, forward and reverse focus containment, caller-owned Escape
  policy, exact focus restoration, nested forms, and Dialog Escape isolation
  passed review.
- Hardened mobile-menu targets, Escape handling, committed-navigation close,
  and exact focus restoration. Existing routes, order, active state, 980px
  breakpoint, skip link, logout behavior, and navigation model were
  preserved.
- Hardened equivalent Interview and Learning back links to 44px targets.
  Learning tabs remained domain-specific, Learning deletion production
  behavior remained unchanged, and no Resume back link was invented.
- No generic modal manager, Tabs component, toast provider, drawer, sidebar,
  breadcrumb system, or second design system was introduced.
- Final focused verification passed 7 files and 139 tests. The complete
  frontend suite passed 41 files and 567 tests before a later
  Browser-discovered integration repair; the final repair passed affected
  focused tests, frontend and root typechecks, the production build, and
  Browser recheck. The complete suite was intentionally not rerun.
- Browser QA passed at 1440px, 1024px, 768px, 390px, and 320px with a healthy
  console. Human review approved native 200% zoom, physical-keyboard behavior,
  visible focus, wrapping, and the absence of new component-level clipping,
  overlap, or overflow. Synthetic cleanup passed and generated artifacts were
  absent.
- Existing React Router directive and production chunk-size warnings remain.
  The existing approximately 15px global root overflow at 320px and broader
  responsive and touch-target work remain assigned to Phase 13F. Integrated
  cross-route accessibility QA remains assigned to Phase 13G. Backend tests
  and external AI-provider configuration were not required.

#### Phase 13F completion evidence

- Changed the global `html` and `body` minimum widths from 320px to 0,
  correcting the scrollbar-reduced 320px layout overflow without hiding or
  clipping overflow. The redundant Learning-only root-width workaround was
  removed.
- Hardened approved common targets with the existing 44px token through
  bounded selectors. No ordinary audited target below 44px remained. The
  native Resume file input, native checkbox and radio controls with enclosing
  labels, and specialized dense Resume controls retained their local
  semantics.
- Long headings, role labels, suggestions, request IDs, chat content, quiz
  questions, and attempt explanations wrapped safely. Both Resume dialogs and
  Learning deletion remained contained, with no action overlap, off-screen
  control, or clipped focus indicator.
- PageHeader, Pager, StateSurface, and Dialog contracts were unchanged.
  Navigation routes, destinations, order, active state, skip link, logout,
  and the 980px breakpoint were preserved. API and domain behavior,
  typography, visual identity, and status colors were unchanged.
- Focused router verification passed 47 tests; bounded route/component
  verification passed 14 files and 210 tests; and the complete frontend suite
  passed 41 files and 569 tests exactly once. Frontend and root typechecks and
  the production build passed.
- Browser QA passed the requested route matrix at 1440px, 1024px, 768px,
  390px, and 320px with equal document client and scroll widths for normal
  content and a healthy console. Human review approved native 200% zoom,
  physical-keyboard behavior, focus, wrapping, target sizing, dialogs, and
  responsive containment.
- Synthetic cleanup passed and generated artifacts were absent. The existing
  production bundle-size advisory remains non-failing. Integrated
  cross-route accessibility and visual regression verification remains
  assigned to Phase 13G. Backend tests and external AI-provider configuration
  were not required.

#### Purpose

- Consolidate only genuine UI duplication.
- Standardize forms, buttons, dialogs, toasts, loading, empty and error states, pagination, job progress, and navigation.
- Add keyboard support, focus management, and responsive behavior.
- Do not introduce a second design system without approval.

#### Required skills

- `karpathy-guidelines`
- `frontend-design`
- `modern-web-guidance`
- `build-web-apps:react-best-practices`
- `build-web-apps:frontend-testing-debugging`
- `playwright`

#### In scope

- Measured shared-UI consolidation.
- Interaction consistency, accessibility basics, and responsive behavior.

#### Out of scope

- Speculative component abstraction.
- A second design system.
- Unrelated visual redesign or feature work.

#### Deliverables

- Consolidated shared interaction patterns.
- Verified keyboard, focus, and responsive behavior.

#### Verification

- Demonstrate genuine duplication before consolidation.
- Run targeted type checks, tests, build, and browser workflows.
- Inspect desktop, tablet, and mobile layouts.
- Complete human visual QA before commit.

#### Human approval gate

- Provide a local URL and visual inspection checklist.
- Stop before commit until the user provides the phase-specific visual approval token and commit authorization.

#### Expected commit

- `Unify frontend design and interaction patterns`

### Execution Phase 14: End-to-End Browser Testing

#### Status

- Status: COMPLETED
- Activation baseline: branch `phase-12-unified-frontend`, full HEAD
  `d32e584702eceae6383bb88e7411bba6e482ebdd`
  (`Complete Phase 13 integrated QA closeout`).
- Current workflow state:
  `PHASE 14 COMPLETED — PHASE 15 PLANNED, NOT ACTIVATED`.
- Phase 13 remains `COMPLETED`.
- Phase 15 remains `PLANNED` / `INACTIVE`.
- The separately authorized Learning chat repair changed one backend service
  file and one existing integration-test file.
- Frontend production and shared-type source remain unchanged.
- Package manifests and lockfiles are read-only.
- External AI providers are prohibited.
- Failure screenshots, traces, and reports remain outside tracked repository
  files.
- Human review approved the Learning repair, backend regression, E2E
  architecture and assertions, synthetic data, ownership and privacy checks,
  Quiz secrecy, responsive matrix, artifact policy, cleanup, and final scope.
- Human approval token:
  `PHASE_14_E2E_BROWSER_TESTING_APPROVED`.
- The Learning chat post-commit HTTP 500 was repaired by returning an explicit
  success sentinel from the existing `attachChatResponseJob` transaction
  callback. The route continues to return the documented HTTP 202 response
  with one canonical owned user message and one queued job.
- The focused desktop smoke gate passed 6/6. The complete Playwright matrix
  passed 21/21 across desktop, tablet, and mobile. Backend, frontend,
  typecheck, build, ownership, private-data, quiz-secrecy, console, artifact,
  and synthetic-cleanup gates passed.
- No unresolved Critical, Important, Minor, product, fixture, environment, or
  verification blocker remains. Phase 14 is completed.
- Phase 15 remains planned and inactive and requires a separate
  operator-approved activation prompt.

#### Purpose

- Test authentication, Resume Studio, Interview Coach, and Learning Workspace through real browser workflows.
- Test desktop, tablet, and mobile dimensions.
- Test User A versus User B ownership boundaries.
- Capture screenshots and traces on failure.

#### Required skills

- `karpathy-guidelines`
- `playwright`
- `build-web-apps:frontend-testing-debugging`
- `screenshot`
- `systematic-debugging`
- `test-driven-development`

#### In scope

- End-to-end coverage of approved user workflows.
- Ownership-boundary tests.
- Failure screenshots and traces.

#### Out of scope

- Feature expansion.
- Weakening assertions to obtain passing results.
- Replacing human visual QA for visible changes.

#### Deliverables

- End-to-end application coverage.
- Failure artifacts where applicable.

#### Verification

- Run the complete browser suite at desktop, tablet, and mobile dimensions.
- Verify User A cannot access User B resources.
- Review captured screenshots and traces for failures.
- Require human visual QA if visible UI changes are made while repairing failures.

#### Human approval gate

- Review browser results, repairs, failure artifacts, and Git diff before commit.

#### Expected commit

- `Add end-to-end application coverage`

### Execution Phase 15: Security and Privacy Review

#### Status

- Status: COMPLETED / APPROVED WITH ACCEPTED LIMITATIONS AND FORMAL DEFERRAL
- Final approved Phase 15 dispositions:
  Phase 15B-1 (`COMPLETED` /
  `APPROVED AS FORMAL CONTROLLED-ACADEMIC-MVP DEFERRAL`), Phase 15B-2 and
  Phase 15B-3 (`COMPLETED` / `APPROVED`), and Phase 15B-4 (`COMPLETED` /
  `APPROVED AS BOUNDED MITIGATION`).
- Active Phase 15 repair pass: none.
- Phase 15B-1 is `COMPLETED` /
  `APPROVED AS FORMAL CONTROLLED-ACADEMIC-MVP DEFERRAL`.
- Activation prompt: `CLH-PHASE-15A-ACTIVATE-AND-AUDIT-01`
- Activation baseline: branch `phase-12-unified-frontend`, full HEAD
  `da3deb50cdfd2f9130ca0e3ce4fbea1cc08d8a51`
  (`Add end-to-end application coverage`).
- Current workflow state:
  `PHASE 15 COMPLETED AND APPROVED WITH ACCEPTED LIMITATIONS AND FORMAL DEFERRAL`.
- Phase 14 remains `COMPLETED`.
- Phase 15A is `COMPLETED`; its review decision is
  `APPROVED WITH ACCEPTED LIMITATIONS`.
- Phase 15B-1 is `COMPLETED` /
  `APPROVED AS FORMAL CONTROLLED-ACADEMIC-MVP DEFERRAL`.
- Phase 15B-2 is `COMPLETED` / `APPROVED`.
- Phase 15B-3 is `COMPLETED` / `APPROVED`.
- Phase 15B-4 is `COMPLETED` / `APPROVED AS BOUNDED MITIGATION`.
- Phase 16 remains `PLANNED` / `INACTIVE`.
- Accepted audit-review token:
  `PHASE_15A_SECURITY_PRIVACY_AUDIT_APPROVED`.
- Phase 15A audit status:
  - 317 tracked files scope-accounted;
  - 74 HTTP handlers across 14 backend routers traced with their trust and
    ownership boundaries;
  - security validation passed 4/4 files and 7/7 tests;
  - focused integration validation passed 5/5 files and 40/40 tests;
  - focused backend unit validation passed 4/4 files and 14/14 tests;
  - focused frontend validation passed 5/5 files and 128/128 tests;
  - confirmed findings: 0 Critical, 0 High, 3 Medium, 2 Low;
  - informational observations: 5;
  - rejected candidates: 7;
  - deferred candidates: 3;
  - accepted risks: 2;
  - external provider calls: none;
  - production and test changes: none.
- Historical Phase 15A pre-approval decision: `BLOCKED`.
- Blocking limitations:
  - required canonical Codex Security repository/diff scan skills and
    workspace are unavailable; and
  - current online dependency advisory coverage could not be obtained without
    an external inventory disclosure that was not explicitly approved.
- The review token is not requested until those limitations are resolved or
  explicitly accepted.
- Phase 15A post-audit history:
  - the audit baseline was
    `da3deb50cdfd2f9130ca0e3ce4fbea1cc08d8a51`;
  - the audit execution ended `BLOCKED` and created no commit;
  - the reviewed seven-file documentation-only result was committed
    separately as `2399f4d5a191d1409c3bc399051083d82654d742`
    with subject `Activate Phase 15A security and privacy audit`;
  - the post-audit evidence was recorded in the three-file documentation
    commit `af6ddbe74e9b912172d966772cdb709df92c3bb8` with subject
    `Document Phase 15A post-audit evidence`;
  - Phase 15 remains `ACTIVE`, and Phase 16 remains `PLANNED` / `INACTIVE`;
  - canonical security-scan and current dependency-advisory coverage
    limitations remain documented and unresolved or unaccepted; and
  - security repairs require separate operator authorization.
- Phase 15A approval closeout:
  - the operator explicitly accepted the unavailable canonical repository and
    diff scans; the absence of a scan ID, SARIF, manifest, coverage ledger,
    and external scan artifact; unavailable current online dependency
    advisories; unavailable automated contributor/co-change graph; and the
    deferred deployment topology, crafted-PDF exhaustion, and multi-worker
    fencing work;
  - these limitations remain technically unresolved but are accepted for the
    current academic MVP;
  - the evidence-led manual audit is sufficient for this project stage;
  - historical audit blockers remain 2, while final human-approval blockers
    are 0 because the limitations were explicitly accepted;
  - confirmed findings `P15-001` through `P15-005` remain open;
  - at Phase 15A closeout, all four Phase 15B repair batches remained proposed
    and inactive; and
  - no repair is authorized by this closeout.
- Phase 15B-2 implementation and validation:
  - Phase 15A closeout baseline:
    `d9cec00abd5d1e7c5944eb2bf5ab2666a0ae9d47`;
  - existing implementation commit:
    `e00e7df2b28dbaec220f3801d1cf0fa6a26e2615`;
  - commit subject:
    `Harden session validation and atomic refresh-token rotation`;
  - exact committed paths:
    `backend/src/middleware/authenticate.ts`,
    `backend/src/modules/auth/auth.service.ts`, and
    `backend/src/tests/integration/auth.integration.test.ts`;
  - P15-002 repair: access tokens now require an active AuthSession matching
    both signed user and session IDs, with password-change cutoff behavior
    preserved;
  - P15-003 repair: refresh rotation atomically compares the session ID, user
    ID, supplied refresh-token hash, revocation state, and expiry before
    replacing the canonical hash;
  - concurrent same-token loss inside five seconds returns a generic failure
    without revoking the winner; later stale replay conditionally revokes the
    current canonical session;
  - the initial integration run passed 5/6 files and 41/51 tests, with only
    ten Learning source tests failing because their fixture omitted the
    AuthSession referenced by its access token;
  - the Learning fixture now creates a matching active AuthSession and stores
    only a hashed synthetic refresh token;
  - focused authentication passed 1/1 file and 11/11 tests;
  - security passed 4/4 files and 7/7 tests;
  - focused Learning source passed 1/1 file and 11/11 tests;
  - resumed integration passed 6/6 files and 51/51 tests;
  - backend unit passed 5/5 files and 19/19 tests;
  - backend typecheck, root typecheck, and production build passed;
  - residual risks are one session lookup per authenticated request, MongoDB
    availability coupling, an in-flight authorization race at the moment of
    revocation, and the deliberate five-second concurrency-loss versus
    stale-replay tradeoff;
  - no frontend, provider, Atlas, dependency, deployment, environment,
    schema, migration, or public response-contract change occurred;
  - human approval was accepted with token
    `PHASE_15B2_AUTH_SESSION_REPAIR_APPROVED`;
  - Phase 15B-2 is `COMPLETED` / `APPROVED`;
  - the closeout commit had not yet been created when this documentation was
    edited; and
  - push is prohibited for this closeout and was not performed.
- Phase 15B-3 and Phase 15B-4 implementation and validation:
  - baseline:
    `91baf956baa99bd46e57e4e2da3a82380224a196`
    (`Complete Phase 15B-2 authentication repair`);
  - P15-004 now fails closed in production: backend public/client origins and
    frontend `VITE_API_URL` require explicit non-local HTTPS URLs, reject
    malformed/credential-bearing/query/fragment/local/loopback forms, and
    normalize accepted origins;
  - local development/test defaults remain available, while private signed
    asset URLs consume the validated backend origin;
  - P15-005 no longer performs an email-existence pre-check or returns
    `EMAIL_ALREADY_REGISTERED`; the unique index is authoritative and both
    ordinary duplicates and duplicate-key races receive neutral HTTP 400
    `REGISTRATION_FAILED`;
  - existing accounts, password hashes, profiles, and sessions remain
    unchanged, and duplicate attempts receive no tokens or cookies;
  - the frontend renders only neutral copy, preserves request IDs, and focuses
    the failure alert;
  - the remaining unused-address success versus existing-address failure
    signal means P15-005 is mitigated rather than fully eliminated;
  - focused GREEN: backend CORS/environment/rate limit 31/31,
    authentication 13/13, Learning
    source 11/11, frontend API 50/50, and registration routing 48/48;
  - broad GREEN: security 4 files/35 tests, integration 6/53, backend unit
    5/19, focused frontend 3/111, and complete frontend 41/584;
  - backend production/test, frontend, and root typechecks passed;
  - an explicit-HTTPS production build passed; production-mode frontend
    initialization tests reject a missing URL without printing a configured
    value;
  - in-app browser QA passed at 1440, 1024, 768, 390, and 320 px, including
    valid, duplicate, invalid, loading, focus, navigation, and containment
    states;
  - residual P15-004 risk is deployment-edge/reverse-proxy drift not
    represented in this repository;
  - no provider, Atlas, package, lockfile, environment, schema, migration,
    deployment, or legacy-project change occurred;
  - no persistent QA service, database, user, session, screenshot, trace,
    build output, coverage, or log remains;
  - the closeout commit had not yet been created when this documentation was
    edited, and push is prohibited and was not performed;
  - accepted security and visual review tokens:
    `PHASE_15B34_SECURITY_REPAIR_APPROVED` and
    `PHASE_15B34_AUTH_UI_VISUAL_APPROVED`;
  - Phase 15B-3 is `COMPLETED` / `APPROVED`;
  - Phase 15B-4 is `COMPLETED` /
    `APPROVED AS BOUNDED MITIGATION`;
  - P15-004 is `REPAIRED / CLOSED`;
  - P15-005 is
    `MITIGATED / CLOSED WITH DOCUMENTED RESIDUAL ENUMERATION SIDE CHANNEL ACCEPTED FOR THE CONTROLLED ACADEMIC MVP`;
  - an unused-address HTTP 201 authenticated success remains distinguishable
    from an existing-address HTTP 400 neutral failure. Complete elimination
    would require an approved ownership-verification or pending-registration
    architecture; and
  - before final revalidation, P15-001 was `OPEN / UNCHANGED` and was the only
    remaining open confirmed finding.
- Phase 15 final verification and approved Phase 15B-1 deferral:
  - baseline HEAD:
    `c27d39a428e20736fee40e4a77d0785c60f261f1`
    (`Complete Phase 15B-3 and 15B-4 security repairs`);
  - P15-001 remains technically valid: each upload aggregates the owner's
    active/temporary Asset bytes, decides against the configured quota, then
    separately writes storage and creates the Asset record;
  - the check, object write, and Asset create are not one atomic operation, so
    concurrent requests can observe the same remaining capacity and commit
    cumulative bytes above the quota;
  - the default 15 MiB per-file ceiling and global/domain rate limits reduce
    the short-window effect but do not serialize uploads. Under default
    single-IP global limits, 300 simultaneous generic 15 MiB uploads could
    theoretically commit 4,500 MiB, or 4,250 MiB above a 250 MiB quota from
    an empty account; this is illustrative, not a system-wide bound, because
    settings are configurable, the generic limiter is IP-keyed, and multiple
    IPs/workers/instances remove a hard aggregate ceiling;
  - P15-001 is
    `DEFERRED / CLOSED FOR PHASE 15 WITH ACCEPTED RISK LIMITED TO THE CONTROLLED ACADEMIC MVP — TECHNICALLY UNRESOLVED`.
    This is not a repair, and its operating restrictions remain binding;
  - operation is restricted to supervised academic evaluation. Unrestricted
    public-scale uploads are not approved; storage must be monitored; demo
    accounts and upload volume must remain limited; per-file and per-user
    controls must remain enabled; no intentional concurrent-upload or load
    stress may target a persistent deployed demo database; and abnormal
    uploads may require manual cleanup;
  - repair is mandatory before unrestricted public registration, upload
    promotion beyond supervised evaluation, multi-worker or multi-instance
    upload handling, meaningful-scale persistent external object storage,
    using storage cost or quota as a security/billing boundary, expected
    concurrent uploads, or commercial, production, or multi-tenant
    deployment;
  - future repair requires a database-backed atomic owner quota reservation,
    conditional increment/reservation, compensation for storage or Asset
    failures, an idempotent lifecycle, concurrency proof, deletion and
    reconciliation behavior, and no process-local lock as the primary
    security control;
  - final backend security passed 4/4 files and 35/35 tests; integration
    passed 6/6 files and 53/53 tests; backend unit passed 5/5 files and 19/19
    tests; and frontend passed 41/41 files and 584/584 tests;
  - backend production/test, frontend, and root typechecks passed, and the
    production build passed with
    `VITE_API_URL=https://api.example.test/api/v1`;
  - the complete existing Playwright suite passed 21/21 tests in 44.3 s
    across desktop 1440 × 900, tablet 768 × 1024, and mobile 390 × 844,
    covering authentication, protected/reload/logout flows, Dashboard,
    Resume, Interview, Learning, private PDF access, Quiz secrecy, User A/User
    B ownership isolation, and horizontal-overflow protections;
  - setup and teardown reported zero tagged users and zero owned records.
    Ports were closed and temporary database/runtime, private storage,
    Playwright output, build output, screenshots, traces, videos, coverage,
    and logs were absent after cleanup;
  - no source or test changed; no provider or Atlas call occurred; and
    packages, lockfiles, environment files, schemas, migrations, deployments,
    and E2E files were unchanged;
  - Phase 15 is
    `COMPLETED / APPROVED WITH ACCEPTED LIMITATIONS AND FORMAL DEFERRAL`;
    Phase 15B-1 is `COMPLETED` /
    `APPROVED AS FORMAL CONTROLLED-ACADEMIC-MVP DEFERRAL`; and Phase 16
    remains `PLANNED` / `INACTIVE`;
  - no confirmed finding remains open for Phase 15 workflow disposition;
  - the accepted approval tokens are:
    `PHASE_15B1_ASSET_QUOTA_DEFERRAL_APPROVED` and
    `PHASE_15_FINAL_SECURITY_CLOSEOUT_APPROVED`; and
  - the implementation baseline is
    `c27d39a428e20736fee40e4a77d0785c60f261f1`. The final closeout commit had
    not yet been created while this documentation was edited, and push is
    prohibited and was not performed.

#### Purpose

- Review authentication, cookies, token lifecycle, CORS, rate limits, ownership, IDOR, mass assignment, uploads, private assets, AI output validation, answer-key secrecy, logging, and personal data.
- Validate findings before fixing.
- Create or update the ownership map.

#### Required skills

- `karpathy-guidelines`
- `codex-security:security-diff-scan`
- `security-best-practices`
- `privacy`
- `security-ownership-map`
- `requesting-code-review`
- `receiving-code-review`

#### In scope

- Evidence-based security and privacy review.
- Validation and classification of candidate findings.
- Ownership-map creation or update.

#### Out of scope

- Speculative hardening without a validated finding.
- Production or test repair during Phase 15A.
- Weakening tests or controls.
- Raw production data exposure.

#### Deliverables

- Validated review findings and fixes.
- Current ownership map.
- Review evidence for resolved and accepted risks.

#### Verification

- Reproduce or otherwise validate each finding before changing code.
- Run targeted security, privacy, ownership, type-check, test, and build checks.
- Review the security diff and complete code review.

#### Human approval gate

- Review confirmed findings, fixes, residual risks, ownership map, and Git diff before commit.

#### Expected commit

- `Harden application security after frontend integration`

### Execution Phase 16: Academic MVP Feature Completion, Responsive Application Shell, Accessibility and Performance Review

#### Status

- Status: COMPLETED / APPROVED
- Activation baseline: branch `phase-12-unified-frontend`, full HEAD
  `e5ee18ab3f55217fd24f4dfea04de1e2d15feddd`
  (`Complete Phase 15 security and privacy review`).
- Phase 15 is `COMPLETED` /
  `APPROVED WITH ACCEPTED LIMITATIONS AND FORMAL DEFERRAL`.
- Phase 16A-1, Browser Test Naming and Folder Migration is
  `COMPLETED` / `APPROVED`.
- Phase 16A-2, Roadmap Amendment and Architecture Audit is
  `COMPLETED` / `APPROVED`.
- Phase 16B, Responsive Sidebar, AppShell and Breadcrumbs is `COMPLETED` /
  `APPROVED`.
- Phase 16C, Resume PDF Export and Print is `COMPLETED` / `APPROVED`.
- Phase 16D, Original-versus-Suggested AI Comparison is `COMPLETED` /
  `APPROVED`.
- Phase 16E, Bounded Resume Templates and Design Controls is `COMPLETED` /
  `APPROVED`.
- Phase 16F, Accessibility and Performance Review, is
  `COMPLETED` / `APPROVED` on branch
  `phase-12-unified-frontend`, full HEAD
  `9a508b2cf06ec0bedbcab2192dd15ff7180ce042`
  (`Add bounded resume design controls`).
- Phase 16G, Integrated Verification and Phase 16 Closeout, is `COMPLETED` /
  `APPROVED` on branch `phase-12-unified-frontend`, starting full HEAD
  `c0325c42816c19c006c790a4e153e3caee88d5bc`
  (`Complete accessibility and performance review`).
- Phase 17 is `PLANNED` / `INACTIVE`.
- Phase 16G fresh verification passed root and backend-test typechecks,
  frontend 49/49 files and 645/645 tests, backend unit 5/5 files and 19/19
  tests, backend integration 7/7 files and 54/54 tests, backend security 4/4
  files and 35/35 tests, and the production build.
- Targeted browser confidence passed 5/5. The single fresh integrated browser
  gate passed 27/27 in 1.9 minutes: desktop 9/9, tablet 9/9, mobile 9/9, one
  worker, zero retries, with final `users=0, owned=0` and automated artifact,
  service, and port cleanup complete.
- P16F-001 remains repaired/verified with fresh CLS 0.0000 across desktop,
  tablet, and mobile. P16F-002 remains rejected/deferred with evidence; eager
  routing, no dynamic chunks, and the accepted greater-than-500-kB entry
  advisory remain. P15-001 restrictions remain binding.
- Security/privacy reconciliation passed for authentication, origin,
  registration, ownership, private PDF, Quiz secrecy, Resume immutability, AI
  provenance, request IDs, and log redaction. No provider, Atlas, deployment,
  production data, or legacy project was used.
- The operator completed and approved the full Phase 16G authentication,
  shell/navigation, breadcrumb, Resume print, AI comparison, Resume design,
  Interview/Learning, keyboard/accessibility, responsive, actual 200% zoom,
  contrast, reduced-motion, performance-experience, and trust/privacy review.
  The accepted token is `PHASE_16G_FINAL_VERIFICATION_APPROVED`; approval
  accepted: yes.
- The headed review tab and local services stopped. The synthetic operator and
  shadow-owner identities, 53 owned records, and one AuthSession were removed,
  with final `users=0, owned=0, sessions=0`. Private storage, runtime data,
  and Phase 16G outside-repository temporary scripts were removed. Ports
  4173, 4174, and 8000 are closed.
- Phase 16 is `COMPLETED` / `APPROVED`. Phase 17 remains `PLANNED` /
  `INACTIVE` and requires separate activation. Merge remains prohibited until
  Phase 17 approval; no push was performed.
- P15-001 restrictions, eager routing, the greater-than-500-kB advisory, and
  every other accepted limitation remain binding. No provider, Atlas,
  deployment, production data, real personal data, or legacy project was
  used, and no production or executable-test path changed in Phase 16G.
- Accepted Phase 16F approval token:
  `PHASE_16F_ACCESSIBILITY_PERFORMANCE_APPROVED`.
- Accepted approval token:
  `PHASE_16A1_BROWSER_TEST_MIGRATION_APPROVED`.
- Accepted Phase 16A-2 approval token:
  `PHASE_16A2_ROADMAP_ARCHITECTURE_AUDIT_APPROVED`.
- The operator accepted the Phase 16A-2 architecture with
  `PHASE_16A2_ROADMAP_ARCHITECTURE_AUDIT_APPROVED`.
- The operator accepted the Phase 16B visual result with
  `PHASE_16B_SIDEBAR_BREADCRUMBS_VISUAL_APPROVED`.
- The operator accepted the Phase 16C visual result with
  `PHASE_16C_RESUME_EXPORT_VISUAL_APPROVED`.
- The operator accepted the Phase 16D visual result with
  `PHASE_16D_AI_COMPARISON_VISUAL_APPROVED`.
- The operator accepted the Phase 16E visual result with
  `PHASE_16E_RESUME_TEMPLATES_VISUAL_APPROVED`.
- The migration behavior was verified with 21/21 passing browser workflows.
- No production source, browser-test behavior, or visible UI changed.
- The repository still has no declared or portable repository-local
  Playwright runner. `package.json` remains unchanged, neither
  `test:browser` nor `test:e2e` exists, and adding a portable command requires
  separate approval.
- Phase 16B implements the accepted shell and breadcrumb architecture.
- Phase 16C is separately activated at full HEAD
  `f63f9f488f7c2288795d69f37cf8effe9c3dce78`
  (`Build responsive application shell and breadcrumbs`) to implement
  browser Print / Save as PDF for canonical saved Resume versions.
- Phase 16D is separately activated at full HEAD
  `ed07be20a856ca7e40f2043e1e0ef743e6755aee`
  (`Add saved Resume printing`) to implement the accepted stored
  original-versus-suggested comparison without contract expansion.

#### Purpose

- Complete the approved academic MVP through bounded subphases.
- Keep the responsive application shell, feature-completion work,
  accessibility review, and performance review separately reviewable.
- Preserve the stable Full Application Browser Testing location established
  by Phase 16A-1.
- Use Phase 16A-2 to establish evidence-backed architecture, exact future
  write manifests, measurable acceptance criteria, and separate human review
  gates before feature implementation begins.

#### Required skills

- `karpathy-guidelines`
- `using-superpowers`
- `define-goal`
- `brainstorming`
- `frontend-skill`
- `frontend-design`
- `build-web-apps:react-best-practices` when available
- `playwright`
- `lighthouse-verification`
- `technical-writing`
- `verification-before-completion`
- `finishing-a-development-branch`

#### In scope

- Phase 16A-1 — Browser Test Naming and Folder Migration:
  `COMPLETED` / `APPROVED`.
- Phase 16A-2 — Roadmap Amendment and Architecture Audit:
  `COMPLETED` / `APPROVED`.
- Phase 16B — Responsive Sidebar, AppShell and Breadcrumbs:
  `COMPLETED` / `APPROVED`.
- Phase 16C — Resume PDF Export and Print:
  `COMPLETED` / `APPROVED`.
- Phase 16D — Original-versus-Suggested AI Comparison:
  `COMPLETED` / `APPROVED`.
- Phase 16E — Bounded Resume Templates and Design Controls:
  `COMPLETED` / `APPROVED`,
  `CONDITIONAL / TIME PERMITTING`.
- Phase 16F — Accessibility and Performance Review:
  `COMPLETED` / `APPROVED`.
- Phase 16G — Integrated Verification and Phase 16 Closeout:
  `COMPLETED` / `APPROVED`.
- The controlling architecture and exact subphase contracts are in
  `docs/planning/PHASE_16_ACADEMIC_MVP_IMPLEMENTATION_PLAN.md`.

Mandatory academic-MVP scope:

- responsive sidebar and mobile navigation drawer;
- contextual breadcrumbs on deep routes;
- saved-version Resume printing with A4 and Letter support and dirty-draft
  protection;
- original-versus-suggested Resume comparison with accessible diff
  semantics;
- final accessibility and performance review; and
- integrated Phase 16 verification.

Conditional, time-permitting scope:

- Standard/Narrow print margins;
- a reliable page-sized print-preview surface;
- Modern Professional and Compact Technical Resume templates;
- bounded font and accessible palette choices; and
- Compact/Standard/Relaxed line spacing, only with an approved persistence
  contract.

#### Out of scope

- Phase 16A-2 was architecture-only; Phase 16B implements only its approved
  responsive shell, create intents, and breadcrumb decisions.
- Resume printing, AI comparison, templates, accessibility repairs, and
  performance repairs remain out of Phase 16B scope.
- Phase 16E was separately authorized after this Phase 16B scope statement.
  Phase 16F, Phase 16G, and Phase 17 remain inactive until separately
  authorized.
- Post-MVP scope includes command palettes, global shortcuts, a new theme
  system, editable AI suggestions, feedback analytics, major Resume-section
  reordering, embedded PDF metadata, audio interview work, mastery tracking,
  additional PDF reports, analysis history, computed version diffs,
  archive/deletion, profile photos, thumbnails, and summary regeneration.
- ATS percentage claims, absolute ATS guarantees, arbitrary styling,
  uploaded fonts, custom Resume CSS, copied legacy architecture, a second
  design system, direct provider HTML, and automatic AI rewrite application
  are rejected.
- No security, ownership, authentication, private-file, Quiz-secrecy,
  immutable-version, provenance, or privacy control may be weakened.

#### Deliverables

- Existing Phase 16A-1 deliverables remain authoritative for browser-test
  organization.
- Phase 16 Academic MVP implementation plan.
- Phase 16A-2 architecture audit report.
- Phase 16B responsive shell and breadcrumb implementation report.
- Revised active governance and an accepted architecture decision.
- Later subphase implementation, verification, and review evidence only
  after each subphase is separately activated.

#### Verification

- Phase 16A-2 verifies documentation scope, source/test immutability,
  internal consistency, exact future manifests, and clean Git state.
- Phase 16B through Phase 16E each require targeted frontend tests, affected
  browser workflow coverage, desktop/tablet/mobile human visual QA, and their
  phase-specific approval token.
- Phase 16F requires reproducible accessibility and performance baselines,
  evidence before repair, no speculative optimization, and an explicit
  approval token.
- Phase 16G requires root typecheck, complete frontend and backend test gates,
  production build, Full Application Browser Testing, security/privacy
  regression checks, cleanup evidence, and final human approval.
- Full browser verification must retain one worker, zero retries, ownership
  isolation, private PDF access, Quiz answer secrecy, and zero tagged
  synthetic users/owned records after teardown.

#### Human approval gate

- Phase 16A-1 remains approved with
  `PHASE_16A1_BROWSER_TEST_MIGRATION_APPROVED`.
- Phase 16A-2 was approved with
  `PHASE_16A2_ROADMAP_ARCHITECTURE_AUDIT_APPROVED`.
- Phase 16A-2 changes no visible UI, so manual visual QA is not applicable.
- No production or test code, package, lockfile, environment file, browser,
  runtime service, provider, Atlas resource, deployment, or visible UI
  changed during the approval closeout.
- Commit authorization is exercised only for the five-document Phase 16A-2
  closeout. Push remains prohibited and has not occurred.
- Every future visible Phase 16E change requires its
  specified visual-approval token before commit authorization.
- Phase 16B was visually approved with
  `PHASE_16B_SIDEBAR_BREADCRUMBS_VISUAL_APPROVED` at 1440×900, 1024×768,
  768×1024, 390×844, 320×720, and actual 200% browser zoom.
- Phase 16C was visually approved with
  `PHASE_16C_RESUME_EXPORT_VISUAL_APPROVED`. Approval covered current and
  historical saved versions, dirty-draft blocking, A4 and Letter, one-page
  and multipage output, grayscale readability, safe links, app-chrome
  exclusion, all required responsive viewports, actual 200% browser zoom,
  and manual browser Save as PDF with synthetic-data cleanup.
- The Phase 16C complete browser run remains recorded as 18/21 before
  test-only corrections, followed by corrected targeted Resume evidence of
  3/3. Phase 16G must run a fresh complete integrated Full Application
  Browser Testing suite.
- Phase 16D was visually approved with
  `PHASE_16D_AI_COMPARISON_VISUAL_APPROVED`. Approval covered Original,
  Suggested rewrite, Reason, the conditional warning, selection,
  non-color Removed/Added meaning, punctuation and replacement readability,
  long-content readability, visible focus, keyboard selection, confirmation,
  cancellation and focus return, immutable-version application,
  stale/conflict safety, markup-as-text, raw-ID absence, and provider-free
  behavior.
- Human review covered 1440×900, 1024×768, 768×1024, 390×844, 320×720, and
  actual 200% browser zoom. No implementation change was required during
  approval closeout.
- The Phase 16F build advisory remains a measurement candidate. Phase 16G
  still requires its own fresh complete integrated Full Application Browser
  Testing run. Phase 16E was subsequently activated by its separate bounded
  implementation prompt and is now `COMPLETED` / `APPROVED`.
- Phase 16E browser-gate recovery retained the historical complete result of
  18/21 and the repaired targeted evidence without combining them into a
  false green result.
- The separately authorized fresh complete Full Application Browser Testing
  run passed 21/21 in 1.5 minutes: desktop 7/7, tablet 7/7, mobile 7/7, one
  worker, zero retries, and final cleanup `users=0, owned=0`.
- Authentication, ownership isolation, private PDF, Quiz secrecy,
  sidebar/drawer, breadcrumbs, Resume print/export, AI comparison, bounded
  templates/design controls, console checks, page-error checks, and
  horizontal-overflow checks passed.
- The operator completed Phase 16E human visual review and supplied
  `PHASE_16E_RESUME_TEMPLATES_VISUAL_APPROVED`; approval token accepted: yes.
- No implementation change was required during visual-approval closeout.
- Phase 16F is now
  `COMPLETED` / `APPROVED`; Phase 16G and
  Phase 17 remain `PLANNED` / `INACTIVE`.

#### Phase 16F original blocked audit record (historical)

This record preserves the state before the separately authorized P16F-001
repair attempt. The repair verification record below controls current status.

- The fresh production build retained one 580.80 kB minified JavaScript entry
  (160.39 kB gzip) and 77.13 kB CSS (14.14 kB gzip).
- Automated accessibility structure and reflow checks passed at 1440×900,
  1024×768, 768×1024, 390×844, and 320×720 with no confirmed accessibility
  defect.
- Three cold production-preview samples confirmed authentication-bootstrap
  CLS of 0.1500 at 1440×900 and 0.2400 at 390×844, above the Phase 16F 0.1
  review threshold.
- The actionable `MODERATE` finding requires authentication loading source
  and shared layout CSS outside the authorized five-path manifest. Phase 16F
  therefore stopped before the conditional router lazy-loading experiment.
- The router and executable browser specifications remain unchanged. The
  complete frontend suite, root typecheck, production build, and bounded
  browser audits passed; the complete 21-test browser suite was not run after
  the mandatory stop condition.
- The controlling evidence and proposed bounded follow-up manifest are in
  `docs/planning/PHASE_16F_ACCESSIBILITY_PERFORMANCE_REPORT.md`.
- Phase 16F is not implemented, ready for human review, completed, or
  approved. Phase 16G and Phase 17 remain planned and inactive.

#### Phase 16F P16F-001 repair verification record

- The separately authorized seven-path repair reused the final authentication
  frame for the bootstrap status and added a shared `#root` viewport
  minimum-size contract. Authentication state and redirect behavior were not
  changed; router lazy loading was not started.
- Router RED and browser RED reproduced the defect. Focused router tests then
  passed 53/53 and targeted authentication browser tests passed 12/12 across
  desktop, tablet, and mobile with final cleanup `users=0, owned=0`.
- The authoritative production preview measured CLS 0.0000 in all three
  1440×900 samples and all three 390×844 samples, with no long task, failed
  request, external/provider request, application console issue, or page
  error.
- Median desktop DCL/load/LCP were 84.5/84.6/168 ms. Median mobile
  DCL/load/LCP were 81.2/81.3/168 ms. The preserved 20 ms mobile LCP delta
  against baseline was classified as one-frame local paint granularity because
  navigation timings improved and request/blocking evidence was unchanged.
- The complete frontend gate passed 49 files and 645 tests after one
  transparent no-code-change rerun of a transient untouched Interview timing
  assertion. Root typecheck and the final production build passed.
- The required one-time complete configured browser gate finished 24/27:
  desktop 9/9, tablet 9/9, mobile 6/9, one worker, zero retries, and final
  cleanup `users=0, owned=0`. The three mobile failures each showed the public
  login form after an expected authenticated reload or direct navigation; no
  protected content appeared.
- That historical complete browser run was not rerun and no test was weakened
  within its repair prompt. A separately authorized recovery classified the
  failure as `B — TEST ORDER OR SHARED RATE-BUDGET CONTAMINATION`. The refresh
  limiter allows 60 requests per backend process, while the pre-repair suite
  used 27 per project. Desktop and tablet consumed 54; mobile registration
  consumed through request 60, and its later bootstrap, reload, and hard
  navigations received 429 while login-only workflows continued to pass.
- The recovery kept cookie, session rotation, fail-closed routing, ownership,
  rate limits, retries, and timeouts unchanged. The responsive authentication
  test retains six viewport and keyboard checks with one authenticated hard
  navigation. The ownership test retains all seven private routes, privacy
  assertions, safe unavailable states, and one hard navigation, with Resume
  last to respect its navigation blocker. Dashboard's authenticated reload is
  unchanged.
- After one truthful intermediate console-warning failure and the bounded
  route-order correction, ownership passed 1/1, the exact historical mobile
  sequence passed 3/3, and the complete mobile project passed 9/9. The single
  fresh all-project browser gate then passed 27/27 in 1.8 minutes: desktop
  9/9, tablet 9/9, and mobile 9/9, with one worker, zero retries, and final
  cleanup `users=0, owned=0`. It wasn't rerun.
- P16F-001 is `REPAIRED / VERIFIED`. Phase 16F is
  `COMPLETED` / `APPROVED`.
- P16F-002 is `ROUTE LAZY LOADING REJECTED / DEFERRED WITH EVIDENCE`.
  Phase 16G and Phase 17 remain planned and inactive. The Phase 16F approval
  token is accepted.

#### Phase 16F implementation-review handoff

- P16F-001 is `REPAIRED / VERIFIED`. Authentication-bootstrap CLS changed
  from three desktop samples at 0.1500 and three mobile samples at 0.2400 to
  0.0000 in all six post-repair samples.
- The mobile authenticated-session recovery diagnosed shared refresh-budget
  contamination and changed only browser-test execution efficiency and route
  order. Authentication, cookies, session rotation, ownership, rate limits,
  one worker, and zero retries were preserved. The recovered complete browser
  result is 27/27: desktop 9/9, tablet 9/9, mobile 9/9, 1.8 minutes, cleanup
  `users=0, owned=0`.
- P16F-002 architecture inspection confirmed React Router 7.18.1,
  `createBrowserRouter(appRoutes)`, 14 eager page imports, compatible named
  exports, and credible Dashboard, Resume, Interview, Learning, and Settings
  groups. `frontend/src/routing/router.tsx` remains unchanged.
- The final build transformed 102 modules in 814 ms. It produced
  `index-DSpHq40W.css` at 77,149 bytes (77.15 kB / 14.14 kB gzip) and
  `index-h0fX09fK.js` at 580,963 bytes (580.96 kB / 160.39 kB gzip), with no
  dynamic chunks and the greater-than-500-kB Vite advisory retained.
- Three bounded authenticated measurement-harness attempts stopped at origin
  allowlisting, response CORS origin mismatch, and fresh-context session
  restoration. The last attempt completed login but safely redirected the
  fresh `/dashboard` context to `/login`; no protected data appeared.
- The attempts produced no complete comparable authenticated public,
  protected, Resume, and Learning dataset. The three-attempt rule stopped
  further changes. No product, authentication, or router defect was
  established, and implementing without a trustworthy baseline would be
  speculative.
- P16F-002 is
  `ROUTE LAZY LOADING REJECTED / DEFERRED WITH EVIDENCE`. The eager route
  architecture and large-entry advisory remain accepted limitations for the
  controlled academic MVP. A future phase may reconsider lazy loading with an
  approved reusable production-preview authentication measurement harness.
- Focused router verification passed 53/53; browser-spec syntax checks passed;
  the complete frontend suite passed 49/49 files and 645/645 tests; frontend,
  backend, and shared-types typechecks passed; and the final build passed.
- No complete browser rerun was performed because no product or router change
  followed the recovered 27/27 state. Phase 16G remains inactive and owns the
  next mandatory fresh complete integrated browser run.
- No dependency, package, lockfile, backend, shared-contract, provider, Atlas,
  deployment, environment, or legacy-project change occurred. P15-001 and its
  accepted operating restrictions remain unchanged.
- Phase 16F is `COMPLETED` / `APPROVED`. Phase 16G and Phase 17 remain
  `PLANNED` / `INACTIVE`; the token
  `PHASE_16F_ACCESSIBILITY_PERFORMANCE_APPROVED` is accepted.

#### Phase 16F approval closeout

- The operator completed the required human review and supplied
  `PHASE_16F_ACCESSIBILITY_PERFORMANCE_APPROVED`; the token is accepted.
- Human review covered authentication and layout stability, keyboard and
  focus behavior, the five required viewports, actual 200% browser zoom,
  reflow, contrast and non-color meaning, reduced motion, route and
  performance experience, Resume design/print, stored AI comparison, and
  trust and privacy controls.
- The temporary review environment used the existing isolated browser-harness
  services, one deterministic `@example.test` account, and provider-free
  stored data for Dashboard activity, a long Resume with current and
  historical versions, stored AI suggestions, Interview, Learning document,
  conversation, flashcards, Quiz, and a completed Quiz attempt.
- The readiness gate opened login, Dashboard, Resume, Interview, Learning,
  and Settings. The five protected workspaces recorded zero horizontal
  overflow at both 1440x900 and 390x844, with zero application console errors,
  page errors, external requests, or provider requests. The stored AI
  comparison was visible.
- The unchanged frontend trust boundary rejected two malformed temporary seed
  fields. Removing a null current-role end date and replacing a string-shaped
  analysis strength with the required object shape corrected only the
  isolated synthetic database. No product or test defect was established.
- No repository `.env`, provider, Atlas, cloud storage, deployment,
  production data, real Resume, personal data, or legacy project was used.
  No dependency, package, lockfile, backend, shared-contract, environment,
  source, test, or configuration file changed during review preparation or
  approval closeout.
- After approval, the headed browser and all temporary services stopped. The
  temporary synthetic account, database, asset storage, and runtime state were
  removed; ports 4173, 4174, and 8000 are closed.
- Phase 16F is `COMPLETED` / `APPROVED`. Phase 16 remains active. Phase 16G
  and Phase 17 remain `PLANNED` / `INACTIVE`. Phase 16G still requires its own
  fresh complete integrated Full Application Browser Testing run.
- Nothing is staged, committed, or pushed.

#### Expected commit

- `Add transparent AI suggestion comparison`

### Execution Phase 17: Final Repository and Release-Candidate Review

#### Status

- Status:
  COMPLETED / APPROVED WITH FORMAL SECURITY-SCAN WAIVER

#### Security-enabled continuation start

- Continuation branch: `phase-12-unified-frontend`.
- Continuation full HEAD:
  `d95e0644572b6d605b3fa6b26f3cd13a717a4bc8`
  (`Add frontend coverage tooling`).
- Before cancellation, a preflight helper reported the capability entry as
  `ready`. That result was only a capability check; it is not scan evidence
  and does not alter the `NOT RUN — NO PASS CLAIMED` disposition.
- The historical three-worker-slot capacity warning did not produce or
  validate security evidence.
- The preflight helper used the available Python 3.12 fallback because the
  system Python lacks `tomllib` and `tomli`.
- No dependency was installed. No source or executable-test repair is
  authorized.
- Accepted Phase 17 security-scan waiver token:
  `PHASE_17_CODEX_SECURITY_SCAN_WAIVER_APPROVED`.
- Waiver token accepted: yes.
- P17-002:
  `FORMALLY WAIVED / DEFERRED BY OPERATOR DUE TO CODEX USAGE COST`.
- Security scan result: `NOT RUN — NO PASS CLAIMED`.
- Cancelled scan `4bcc60eb-d741-4101-9cdb-e3748197e6fe` is
  `TERMINAL / CANCELLED / NOT REUSABLE` with receipts `0/352`. The candidate
  ledger, `findings.json`, `coverage.json`, final report, SARIF, and every
  other canonical result are absent.
- The cancelled scan was not resumed, restarted, reused, or replaced by
  another scanner. It is not evidence.
- Existing Phase 15 security evidence remains controlling for the academic
  MVP. P15-001 and all controlled academic-MVP restrictions remain binding.
- No merge or push is authorized. Phase 18 remains `PLANNED` / `INACTIVE`.
- Pre-approval execution result:
  `IMPLEMENTED / READY FOR HUMAN REVIEW WITH FORMAL SECURITY-SCAN WAIVER`.

#### Waiver and final-verification result

- Prompt ID: `CLH-PHASE-17-WAIVER-AND-FINAL-VERIFICATION-01`.
- Branch and HEAD remained `phase-12-unified-frontend` at
  `d95e0644572b6d605b3fa6b26f3cd13a717a4bc8`
  (`Add frontend coverage tooling`).
- Local `main` remained
  `92066731b57abc27a392fb35cf009100568d39dd`, is the merge base and an
  ancestor of HEAD. The branch is 47 commits ahead and zero behind.
- Static integrity, top-level dependencies, the frontend Vitest/provider
  `4.1.10` tree, root typecheck, and backend test typecheck passed.
- Frontend tests and V8 coverage each passed 49/49 files and 645/645 tests.
  Coverage was 84.02% statements, 77.66% branches, 76.72% functions, and
  86.78% lines with no numerical threshold.
- Backend unit passed 5/5 files and 19/19 tests; integration passed 7/7 files
  and 54/54 tests; security passed 4/4 files and 35/35 tests; V8 coverage
  passed 16/16 files and 108/108 tests at 62.84% statements, 67.56%
  branches, 78.94% functions, and 62.84% lines. No numerical threshold is
  configured.
- The production-origin build passed for frontend and backend with 102
  frontend modules, 0.54 kB HTML, 77.15 kB CSS, one 580.96 kB JavaScript
  entry, no dynamic chunk, and the accepted module-directive and bundle-size
  advisories.
- README was materially stale and was corrected within the authorized
  manifest. Dead/temporary review found no verified removable executable
  item.
- Playwright `1.61.1` with Chrome `150.0.7871.187` passed the complete 27/27
  browser gate in 52.7 seconds: desktop 9/9, tablet 9/9, mobile 9/9, one
  worker, zero retries, zero failed, and zero skipped. Setup and teardown
  each reported `users=0, owned=0`.
- Generated and runtime output was removed; ports 4173, 4174, and 8000 are
  closed.
- `AGENTS.md` FRONTEND TEST COMMAND DOCUMENTATION:
  `CORRECTED / VERIFIED` under prompt
  `CLH-PHASE-17-AGENTS-DOCUMENTATION-CORRECTION-01`. The correction is
  documentation-only. The ordinary frontend test and coverage commands were
  verified from `frontend/package.json`; the portable browser package
  scripts remain undeclared and the authorized bundled Playwright runtime
  remains the current browser runner. No product, executable-test, package,
  lockfile, or configuration path changed, and no automated gate was rerun
  because executable behavior was unchanged.
- Existing Phase 15 security evidence remains controlling. No canonical
  Codex Security result or SARIF exists; no public-scale or unrestricted
  production-security readiness is claimed. P15-001 and controlled
  academic-MVP restrictions remain binding.
- P17-001 is `REPAIRED / VERIFIED / APPROVED`.
- P17-002 is
  `FORMALLY WAIVED / DEFERRED BY OPERATOR — NOT RUN / NO PASS CLAIMED`.
- Phase 17 is
  `COMPLETED / APPROVED WITH FORMAL SECURITY-SCAN WAIVER`.
  Phase 18 remains `PLANNED / INACTIVE`.
- The accepted final approval token is
  `PHASE_17_RELEASE_CANDIDATE_REVIEW_APPROVED`; accepted: yes.
- Nothing was staged, committed, merged, pushed, deployed, or used to
  activate Phase 18.

#### Final human-review approval

- On 2026-07-30, the operator supplied exactly
  `PHASE_17_RELEASE_CANDIDATE_REVIEW_APPROVED`.
- Final Phase 17 approval token accepted: yes.
- Phase 17 is
  `COMPLETED / APPROVED WITH FORMAL SECURITY-SCAN WAIVER`.
- The waiver remains bounded: the Codex Security scan was
  `NOT RUN — NO PASS CLAIMED`; P15-001 and all controlled academic-MVP
  restrictions remain binding.
- Phase 18 remains `PLANNED / INACTIVE` and was not activated.
- This approval closeout changes documentation only. No automated gate was
  rerun, and nothing was staged, committed, merged, pushed, or deployed.

#### Historical activation record

- Activated on `phase-12-unified-frontend` at full HEAD
  `79e4cfb62524d0cccf919819a78b4dc68ec2df8b`
  (`Complete Phase 16 academic MVP verification`).
- Local `main` is
  `92066731b57abc27a392fb35cf009100568d39dd`
  (`Complete backend foundation through Phase 9`), is the exact merge base,
  and is an ancestor of the activation HEAD. The cumulative branch is 46
  commits ahead, zero commits behind, and contains zero merge commits.
- Phase 17 is verification-only. Product, executable-test, package, lockfile,
  configuration, environment, backend-contract, and shared-contract changes
  are prohibited.
- The historical dead-code-removal allowance is suspended for this initial
  review. Dead or temporary material may be classified only; any required
  source or test removal must be authorized by a separate repair prompt.
- The maximum authorized write manifest is the master plan, current-phase
  record, Phase 17 release-candidate report, Full Application Browser Testing
  guide, and README only if the verified implementation makes it materially
  incorrect.
- The requested skills are available except for
  `codex-security:security-scan`, which is not installed or callable. No skill
  was installed or downloaded.
- The future approval token is
  `PHASE_17_RELEASE_CANDIDATE_REVIEW_APPROVED`; approval accepted: no.
- Phase 16 remains `COMPLETED` / `APPROVED`. Phase 18 remains `PLANNED` /
  `INACTIVE`. No staging, commit, merge, push, pull, fetch, or deployment is
  authorized by this review.

#### Historical initial verification result

- Baseline, main ancestry, the linear 46-commit history, and the complete
  216-path cumulative diff passed review. The branch is zero commits behind
  main, has zero merge commits, and `git diff --check main...HEAD` passed.
- Static syntax and manifest integrity passed; `npm ls --depth=0` reported a
  valid top-level tree. Root and backend-test typechecks passed.
- Complete frontend tests passed 49/49 files and 645/645 tests. Backend unit
  passed 5/5 files and 19/19 tests; integration passed 7/7 files and 54/54
  tests; security passed 4/4 files and 35/35 tests. The backend commands used
  the one authorized unchanged-command retry after a zero-test sandbox
  listener denial.
- Existing backend V8 coverage passed 16/16 files and 108/108 tests with
  62.84% statements, 67.56% branches, 78.94% functions, and 62.84% lines. No
  threshold is configured.
- Phase 17 is `ACTIVE` / `BLOCKED`: the frontend workspace has no declared
  coverage command and no compatible installed coverage provider for Vitest
  `4.1.10`. Backend's installed `@vitest/coverage-v8` `3.2.7` does not satisfy
  the frontend peer requirement. The mandatory frontend coverage gate cannot
  run without a separately authorized package/script change.
- The review stopped at the mandatory coverage gate. Production build,
  standard Codex security scan, README reconciliation, dead/temporary-code
  review, final documentation reconciliation, and the one complete browser
  gate were not run. The requested `codex-security:security-scan` skill is
  also unavailable.
- Generated coverage and TypeScript cache output were removed. The isolated
  test MongoDB listener stopped after backend verification; no browser,
  frontend, or backend application service was started, and ports 4173, 4174,
  and 8000 remain closed. No source, executable-test, package, lockfile,
  configuration, environment, stage, commit, merge, push, deployment,
  provider, Atlas, real-data, or legacy change occurred.
- The future token `PHASE_17_RELEASE_CANDIDATE_REVIEW_APPROVED` remains
  unaccepted. Phase 18 remains `PLANNED` / `INACTIVE`.

#### Historical P17-001 frontend coverage tooling repair

- Root cause: frontend Vitest resolved to `4.1.10`, but the frontend declared
  no coverage script or provider. Backend's installed
  `@vitest/coverage-v8` `3.2.7` was invalid for the frontend peer boundary.
- The bounded repair adds exact frontend devDependency
  `@vitest/coverage-v8` `4.1.10`, the exact
  `test:coverage: vitest run --coverage` script, and a V8 policy under
  `frontend/vitest.config.ts`.
- The policy includes all `src/**/*.{ts,tsx}` implementation files and
  excludes only test files, `src/test/**`, and TypeScript declarations. It
  emits text, JSON-summary, and HTML reports to workspace-relative
  `frontend/coverage`.
- No numerical threshold is configured. The repair records the first honest
  baseline and defers threshold selection to a separate reviewed policy
  decision; it does not tune a threshold after observing results.
- Dependency integrity passed with frontend Vitest and provider both at
  `4.1.10`. The lockfile adds only the provider and its required resolution;
  no existing dependency version changed.
- Frontend typecheck passed. The ordinary frontend suite and the single
  coverage run each passed 49/49 files and 645/645 tests. Coverage measured
  84.02% statements, 77.66% branches, 76.72% functions, and 86.78% lines.
- Root typecheck passed across frontend, backend, and shared types. The
  production build passed with 102 modules, 0.54 kB HTML, 77.15 kB CSS, one
  580.96 kB JavaScript entry, no dynamic chunk, and the accepted Vite
  greater-than-500-kB advisory.
- Generated coverage, build output, and TypeScript caches were removed.
  Ports 4173, 4174, and 8000 remained closed, and no browser or application
  service was started.
- P17-001 is `REPAIRED / VERIFIED / APPROVED`. The operator supplied and
  approved `PHASE_17_FRONTEND_COVERAGE_TOOLING_APPROVED` after independent
  human review. P17-002 remains
  `SECURITY CAPABILITY UNAVAILABLE — NEW CODEX SESSION WITH CODEX SECURITY REQUIRED`;
  no scan or substitute scanner ran.
- Phase 17 remains `ACTIVE / BLOCKED — SECURITY SCAN CAPABILITY PENDING`.
  The original Phase 17 build, security scan, README, dead-code, and complete
  browser continuation remains pending. Phase 18 remains `PLANNED` /
  `INACTIVE`; merge and push remain prohibited and unperformed.

#### Historical P17-001 repair approval closeout

- Fresh closeout verification kept frontend Vitest and the V8 provider at
  exact version `4.1.10`; both package-tree checks passed without a missing,
  invalid, or extraneous package.
- The ordinary frontend suite passed 49/49 files and 645/645 tests in 12.72
  seconds. The coverage suite passed the same 49 files and 645 tests in 16.87
  seconds and reproduced 84.02% statements, 77.66% branches, 76.72%
  functions, and 86.78% lines. No numerical threshold is configured.
- Root typecheck passed across frontend, backend, and shared types. The
  production build passed with 102 frontend modules, 0.54 kB HTML, 77.15 kB
  CSS, one 580.96 kB JavaScript entry, no dynamic chunk, and the accepted
  greater-than-500-kB Vite advisory.
- Generated coverage, build output, and TypeScript caches were removed, and
  ports 4173, 4174, and 8000 remained closed. No product or executable-test
  file changed.
- No provider, Atlas, deployment, production or real personal data,
  environment file, or legacy project was accessed. No merge or push
  occurred.
- P17-001 is `REPAIRED / VERIFIED / APPROVED`. P17-002 remains an unresolved
  capability blocker. Phase 17 remains
  `ACTIVE / BLOCKED — SECURITY SCAN CAPABILITY PENDING`; Phase 18 remains
  `PLANNED` / `INACTIVE`.
- The authorized closeout subject is `Add frontend coverage tooling`. The
  next action is a new Codex session with Codex Security enabled. The final
  Phase 17 approval token remains unaccepted.

#### Purpose

- Review the complete branch diff.
- Run all type checks, tests, coverage, build, and browser tests.
- Update documentation.
- Remove only verified temporary or dead code.
- Prepare the branch for merge.

#### Required skills

- `karpathy-guidelines`
- `requesting-code-review`
- `receiving-code-review`
- `finishing-a-development-branch`
- `technical-writing`
- `codex-security:security-scan`

#### In scope

- Complete branch review and final verification.
- Documentation updates grounded in the final branch.
- Removal of verified temporary or dead code only.

#### Out of scope

- New features.
- Unrelated cleanup or architecture changes.
- Merge without human approval.

#### Deliverables

- Review-ready branch.
- Complete verification evidence.
- Current project documentation.

#### Verification

- Review the complete branch diff.
- Run all type checks, tests, coverage, build, browser tests, and the selected security scan.
- Confirm documentation matches verified behavior.

#### Human approval gate

- Human approval is required before merge preparation advances to staging deployment.

### Execution Phase 18: Staging Deployment

#### Status

- Status:
  `ACTIVE — PHASE 18A COMPLETED / APPROVED; PHASE 18B ACTIVE —
  PROVIDER/ACCOUNT READINESS AND SECRET-NAME MANIFEST; CURRENT PHASE 18B
  ACTIVITY COMPLETED / HUMAN-APPROVED / LOCALLY COMMITTED; PROVIDER
  PROVISIONING NOT STARTED / INACTIVE; STAGING DEPLOYMENT NOT STARTED /
  INACTIVE; DNS CONFIGURATION NOT STARTED / INACTIVE`
- Most recently completed repair:
  `B18A-001 — Ignored Private-Storage Adapter Source Tracking Repair`
- Repair status: `COMPLETED / APPROVED`
- Accepted repair token:
  `PHASE_18_STORAGE_ADAPTER_TRACKING_REPAIR_APPROVED`
- Repair token accepted: `YES`
- Active subphase:
  `Phase 18B — Provider/Account Readiness and Secret-Name Manifest`
- Most recently completed subphase:
  `Phase 18A — Staging Architecture and Deployment Readiness Audit`
- Phase 18 activation branch: `phase-18-staging-deployment`
- Phase 18 activation HEAD:
  `13c5c96fb4944715e0253b6ce43d68de878556e3`
- Activation subject: `Complete final repository and release-candidate review`
- Phase 18A approval token:
  `PHASE_18A_STAGING_ARCHITECTURE_AUDIT_APPROVED`
- Token accepted: `YES`

#### Purpose

- Deploy the React/Vite frontend, Node backend, MongoDB staging database, and private storage.
- Configure HTTPS, exact CORS origins, proxy settings, secrets, and monitoring.
- Verify liveness and readiness.
- Run browser tests against staging.

#### Phase 18A scope and result

- Closeout prompt:
  `CLH-PHASE-18A-OPERATOR-DECISIONS-AND-CLOSEOUT-01`.
- Phase 18 was activated from synchronized local and remote `main` at the
  exact HEAD above. The starting worktree was clean, nothing was staged or
  untracked, and no Git operation was active.
- Phase 18A inspected the repository deployment surface and current official
  provider documentation. It produced
  `docs/deployment/PHASE_18A_STAGING_ARCHITECTURE_AUDIT.md`.
- The audit defines the current application architecture, commands,
  build/output layout, liveness/readiness behavior, MongoDB transaction and
  index prerequisites, private-storage and upload contract, embedded worker,
  single-instance boundary, secure-cookie/HTTPS/same-site-domain constraint,
  exact credentialed CORS, proxy validation, redacted logging, secret-safe
  variable manifest, browser-test adaptation requirement, rollback, and
  cleanup.
- It compares Vercel and Netlify; Render and Railway; MongoDB Atlas Free and
  Flex; AWS S3, Cloudflare R2, local persistent disk, and Cloudinary; provider
  logs and Sentry; and native GitHub integrations versus GitHub Actions.
- OD-18A-001 through OD-18A-012 are
  `RESOLVED / OPERATOR APPROVED`.
- The approved initial topology is Vercel Hobby, Render Free, MongoDB Atlas
  Free, private AWS S3 in the Singapore regional strategy, provider logs only,
  native Vercel/Render GitHub integrations with branch restrictions/manual
  promotion, sibling custom HTTPS subdomains, and Cloudflare Access or
  equivalent deny-by-default access for the operator account only.
- Render Free sleeping, cold starts, delayed first requests, and delayed jobs
  are accepted. Synthetic keep-awake traffic is prohibited. An always-on paid
  Render upgrade requires separate approval and is required before a
  reliability-critical demonstration.
- Atlas Free storage, capacity, backup, and operational limits are accepted.
  Atlas Flex requires separate approval.
- The operator domain is `prabhathmalinda.com.lk`, registered through LK
  Domain Registry. Its status is
  `RESERVED — REGISTRY ACTIVATION PENDING`. Planned hosts are
  `staging.prabhathmalinda.com.lk` and
  `api-staging.prabhathmalinda.com.lk`. DNS and live staging configuration
  must wait for registry activation.
- The initial staging budget has a USD 10 monthly hard ceiling. Billing alerts
  must precede usage-based resource creation.
- Synthetic users, owned records, and PDFs are deleted immediately after
  testing. Completed jobs, provider logs, browser screenshots/traces,
  monitoring events, and required backups have a maximum seven-day retention.
  Live AI-provider data is disabled initially.
- The audit found a deployment-readiness blocker: the backend imports the
  private-storage adapter directory, but the directory is ignored by the
  broad `.gitignore` `storage/` rule and absent from `HEAD`. A clean provider
  checkout cannot build until a separately approved, test-verified repository
  repair is completed.
- The current host-only `Secure`, `SameSite=Lax` refresh-cookie contract
  requires same-site sibling frontend/API domains. Unrelated provider default
  domains are not an acceptable final staging topology without a separately
  approved code or proxy change.
- P15-001 remains `TECHNICALLY UNRESOLVED`. Its controlled academic-MVP
  restrictions require synthetic data, limited supervised accounts/uploads,
  and restricted access rather than unrestricted public registration.
- The Phase 17 security scan remains `NOT RUN — NO PASS CLAIMED`. The formal
  waiver does not establish unrestricted production security.
- Phase 18A is `COMPLETED / APPROVED`.
- The approval token
  `PHASE_18A_STAGING_ARCHITECTURE_AUDIT_APPROVED` is accepted.
- The separately authorized repair of the ignored
  `backend/src/modules/assets/storage/` source is completed and approved.

#### Phase 18B activation record

- Activation prompt:
  `CLH-PHASE-18B-ACTIVATE-ACCOUNT-READINESS-AND-SECRET-MANIFEST-01`.
- Activation date: 2026-08-02.
- Phase 18B status:
  `ACTIVE — PROVIDER/ACCOUNT READINESS AND SECRET-NAME MANIFEST`.
- Current activity:
  `COMPLETED / HUMAN-APPROVED / LOCALLY COMMITTED`.
- Evidence:
  `docs/deployment/PHASE_18B_PROVIDER_ACCOUNT_AND_SECRET_MANIFEST.md`.
- DEC-015 establishes a dedicated Atlas project for Career Learning Hub
  staging and excludes the existing Interview Prep AI project and Cluster0.
- Provider provisioning, staging deployment, DNS configuration, secret
  generation, environment-value entry, push, and merge remain
  `NOT STARTED / INACTIVE`.
- Required human-review token:
  `PHASE_18B_PROVIDER_AND_SECRET_MANIFEST_APPROVED`.
- Human-review token accepted: `YES` on 2026-08-02.
- Documentation closeout: `COMPLETED`.
- Local commit status: `LOCALLY COMMITTED`.
- The exact commit hash is verified directly from Git after commit and is not
  recursively inserted into this same commit.
- Provider provisioning, staging deployment, and DNS configuration remain
  `NOT STARTED / INACTIVE`.
- Phase 19 remains `PLANNED / INACTIVE`.
- The next activity requires separate explicit provisioning authorization.
- No provider, environment-value, secret, DNS, deployment, push, or merge
  action occurred.

#### B18A-001 storage-adapter tracking repair

- Prompt:
  `CLH-PHASE-18-STORAGE-ADAPTER-TRACKING-REPAIR-01`.
- Approval-closeout prompt:
  `CLH-PHASE-18-STORAGE-ADAPTER-REPAIR-APPROVAL-COMMIT-01`.
- Status: `COMPLETED / APPROVED`.
- The original `storage/` rule remains in place for private runtime data.
  Exact rules now permit Git to traverse
  `backend/src/modules/assets/storage/`, re-ignore all of its contents, and
  re-include only `storage.types.ts`, `local.storage.ts`, `s3.storage.ts`, and
  `storage.factory.ts`.
- All four existing files are regular TypeScript source. Complete content and
  credential-pattern review found no secret, personal data, runtime object,
  binary, archive, log, database, or generated output.
- Before/after SHA-256 checksums match. No adapter source behavior, filename,
  import, or export changed.
- Direct storage coverage was added under
  `backend/src/tests/unit/storageAdapters.test.ts` for local factory caching,
  upload rejection, local storage limits and health, direct owned-asset
  deletion, failed-readiness behavior, and the S3 command/presigning contract
  through a mocked SDK send boundary and local signing. AWS was not contacted.
- Typechecks passed. Targeted storage tests passed 39/39 across three files.
  Full backend regression passed 25 unit, 54 integration, and 35 security
  tests. The production build passed and emitted only the accepted Vite
  warnings.
- Generated output and TypeScript caches were removed. No persistent process
  or listener remains.
- No provider, Atlas, AWS, AI, DNS, deployment, cloud-resource, legacy,
  environment-file, or secret access occurred.
- The reviewed pre-closeout snapshot had nothing staged or committed. The
  approval-closeout prompt authorizes one local commit containing exactly the
  ten reviewed repair paths. Its hash remains pending until creation; no push
  is authorized.
- Phase 18A remains `COMPLETED / APPROVED`; Phase 18B remains
  `PLANNED / INACTIVE — READY FOR SEPARATE ACTIVATION`; Phase 19 remains
  `PLANNED / INACTIVE`.
- Phase 17's formal scan waiver and `NOT RUN — NO PASS CLAIMED` status remain
  unchanged. P15-001 restrictions and synthetic-only staging remain binding.
- Domain status remains `RESERVED — REGISTRY ACTIVATION PENDING`.
- Evidence:
  `docs/deployment/PHASE_18_STORAGE_ADAPTER_TRACKING_REPAIR.md`.
- Approval token:
  `PHASE_18_STORAGE_ADAPTER_TRACKING_REPAIR_APPROVED`; accepted: `YES`.
- The next planned activity is a separately authorized current-versus-legacy
  UI, feature, and branding audit before deployment. This closeout grants no
  legacy-project access.

#### Phase 18A change and execution boundary

- No deployment occurred.
- No cloud resource, provider account, database, bucket, domain, DNS record,
  monitoring project, CI/CD workflow, or secret was created.
- No secret or actual environment file was read or written.
- No product source, test, package, lockfile, configuration, environment,
  deployment, Docker, or GitHub Actions file changed.
- No install, audit, test, coverage, build, browser, Lighthouse, migration,
  server, provider CLI, or provisioning command ran.
- The closeout stages and commits exactly the three authorized Phase 18A
  documentation paths. Nothing is pushed, merged, rebased, or deployed.

#### Planned subphases

1. Phase 18A — Staging Architecture and Deployment Readiness Audit:
   `COMPLETED / APPROVED`.
2. Phase 18B — Provider Selection, Account Readiness and Secret Manifest
   Approval:
   `ACTIVE — PROVIDER/ACCOUNT READINESS AND SECRET-NAME MANIFEST;
   COMPLETED / HUMAN-APPROVED / LOCALLY COMMITTED`.
3. Phase 18C — MongoDB Staging and Private Storage Provisioning:
   `PLANNED / INACTIVE`.
4. Phase 18D — Backend Staging Deployment and Health Verification:
   `PLANNED / INACTIVE`.
5. Phase 18E — Frontend Staging Deployment, HTTPS and Exact CORS
   Verification: `PLANNED / INACTIVE`.
6. Phase 18F — Monitoring, CI/CD and Rollback Readiness:
   `PLANNED / INACTIVE`.
7. Phase 18G — Staging Browser Verification and Phase 18 Closeout:
   `PLANNED / INACTIVE`.

#### Current authority boundary

- Phase 18B is active only for documentation of provider/account readiness and
  secret-name manifest review.
- The accepted Phase 18A decisions authorize no purchase, account, resource,
  credential, domain activation, DNS change, workflow,
  push, or deployment.
- Historical B18A-001 repair authority was limited to the exact ignore rule,
  four existing adapter files, focused storage test, three governance records,
  and repair report. That closeout authority is not reused here.
- The historical Phase 18A documentation-only commit authority is not reused
  by the current Phase 18B review task.
- The current Phase 18B activation authorizes no provisioning, provider
  resource, environment value, secret generation, DNS change, deployment,
  push, merge, or commit.
- Phase 19 remains `PLANNED / INACTIVE`.

### Execution Phase 19: Legacy Data Migration Preparation

#### Status

- Status: PLANNED

#### Purpose

- Use sanitized fixtures for AI-assisted schema work.
- Never expose raw production exports to Codex.
- Remove or replace PII, tokens, sessions, plaintext passwords, and password hashes from fixtures.
- Validate, dry-run, review, and execute only against staging first.

#### Required skills

- `karpathy-guidelines`
- `systematic-debugging`
- `technical-writing`
- `test-driven-development`
- `security-best-practices`
- `privacy`

#### In scope

- Sanitized representative fixtures.
- Migration validation and dry runs.
- Reviewed staging-only execution preparation.

#### Out of scope

- Raw production exports in Codex context.
- Unsanitized PII, secrets, sessions, plaintext passwords, or password hashes.
- Production migration execution.

#### Deliverables

- Sanitized fixture set.
- Validated migration plan and checks.
- Reviewed staging dry-run evidence.

#### Verification

- Scan fixtures for prohibited personal and secret material.
- Validate fixture representativeness without re-identification.
- Run migration validation and dry-run checks.
- Review staging-only execution results before any later production approval.

#### Human approval gate

- Human privacy and migration review is required before staging execution and again before any production migration.

### Execution Phase 20: Production Release

#### Status

- Status: PLANNED

#### Purpose

- Confirm tests, staging, backups, secrets, HTTPS, private storage, health checks, monitoring, and rollback.
- Merge, tag, and deploy.
- Run smoke tests.
- Execute production migration only after explicit approval.

#### Required skills

- `karpathy-guidelines`
- `finishing-a-development-branch`
- `security-best-practices`
- `codex-security:deep-security-scan`
- `sentry`
- Selected deployment skill.

#### In scope

- Approved merge, tag, production deployment, and smoke tests.
- Production migration only under separate explicit approval.

#### Out of scope

- Release with failed gates.
- Secret exposure.
- Production migration without explicit approval.

#### Deliverables

- Tagged production release.
- Verified production deployment.
- Smoke-test and monitoring evidence.

#### Verification

- Confirm tests, staging, backups, secrets management, HTTPS, private storage, health checks, monitoring, and rollback.
- Run the approved deep security scan.
- Run production smoke tests after deployment.
- Verify rollback readiness.

#### Human approval gate

- Explicit human approval is required for merge and deployment.
- Separate explicit human approval is required for production migration.

### Execution Phase 21: Post-Release Monitoring and Maintenance

#### Status

- Status: PLANNED

#### Purpose

- Monitor runtime errors, jobs, authentication, health, database behavior, AI quota, and uploads.
- Apply small reviewed hotfixes.
- Maintain incident and release records.

#### Required skills

- `karpathy-guidelines`
- `sentry`
- `systematic-debugging`
- `codex-security:security-diff-scan`
- `gh-fix-ci`
- `requesting-code-review`
- `receiving-code-review`

#### In scope

- Production monitoring and evidence-based incident response.
- Small reviewed hotfixes.
- Incident and release records.

#### Out of scope

- Unreviewed feature work.
- Broad refactors during incident response.
- Changes that bypass tests, security controls, or approval gates.

#### Deliverables

- Current monitoring, incident, and release records.
- Reviewed hotfixes when needed.

#### Verification

- Monitor runtime errors, jobs, authentication, health, database behavior, AI quota, and uploads.
- Reproduce or validate incidents before repair where conditions allow.
- Run targeted checks and security diff review for each hotfix.

#### Human approval gate

- Human review is required before each hotfix commit and release.
