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

- Status: ACTIVE
- Activation baseline: branch `phase-12-unified-frontend`, full HEAD
  `e5ee18ab3f55217fd24f4dfea04de1e2d15feddd`
  (`Complete Phase 15 security and privacy review`).
- Phase 15 is `COMPLETED` /
  `APPROVED WITH ACCEPTED LIMITATIONS AND FORMAL DEFERRAL`.
- Phase 16A-1, Browser Test Naming and Folder Migration is
  `COMPLETED` / `APPROVED`.
- Phase 16A-2, Roadmap Amendment and Architecture Audit is
  `COMPLETED` / `APPROVED`.
- Phase 16B through Phase 16G are `PLANNED` / `INACTIVE`.
- Phase 17 is `PLANNED` / `INACTIVE`.
- Accepted approval token:
  `PHASE_16A1_BROWSER_TEST_MIGRATION_APPROVED`.
- Accepted Phase 16A-2 approval token:
  `PHASE_16A2_ROADMAP_ARCHITECTURE_AUDIT_APPROVED`.
- The operator accepted the Phase 16A-2 architecture with
  `PHASE_16A2_ROADMAP_ARCHITECTURE_AUDIT_APPROVED`.
- The migration behavior was verified with 21/21 passing browser workflows.
- No production source, browser-test behavior, or visible UI changed.
- The repository still has no declared or portable repository-local
  Playwright runner. `package.json` remains unchanged, neither
  `test:browser` nor `test:e2e` exists, and adding a portable command requires
  separate approval.
- Phase 16A-2 is documentation and read-only architecture inspection only.
  It does not activate or implement Phase 16B.

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
  `PLANNED` / `INACTIVE`.
- Phase 16C — Resume PDF Export and Print:
  `PLANNED` / `INACTIVE`.
- Phase 16D — Original-versus-Suggested AI Comparison:
  `PLANNED` / `INACTIVE`.
- Phase 16E — Bounded Resume Templates and Design Controls:
  `PLANNED` / `INACTIVE`, `CONDITIONAL / TIME PERMITTING`.
- Phase 16F — Accessibility and Performance Review:
  `PLANNED` / `INACTIVE`.
- Phase 16G — Integrated Verification and Phase 16 Closeout:
  `PLANNED` / `INACTIVE`.
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

- Phase 16A-2 does not implement the sidebar, breadcrumbs, Resume printing,
  AI comparison, templates, accessibility repairs, or performance repairs.
- Phase 16B through Phase 16G and Phase 17 remain inactive until separately
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
- Every future visible Phase 16B through Phase 16E change requires its
  specified visual-approval token before commit authorization.
- Phase 16B remains `PLANNED` / `INACTIVE` and requires a separate activation
  prompt.

#### Expected commit

- `Define Phase 16 academic MVP architecture`

### Execution Phase 17: Final Repository and Release-Candidate Review

#### Status

- Status: PLANNED

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

- Status: PLANNED

#### Purpose

- Deploy the React/Vite frontend, Node backend, MongoDB staging database, and private storage.
- Configure HTTPS, exact CORS origins, proxy settings, secrets, and monitoring.
- Verify liveness and readiness.
- Run browser tests against staging.

#### Required skills

- `karpathy-guidelines`
- Selected deployment skill.
- `vercel:env-vars` or equivalent environment-management skill.
- Selected CI/CD skill.
- `sentry`

#### In scope

- Approved staging infrastructure and configuration.
- Secret injection through approved environment controls.
- Health and staging browser verification.

#### Out of scope

- Production deployment.
- Committing secrets or environment values.
- Production data migration.

#### Deliverables

- Working staging deployment.
- Documented staging configuration and verification evidence without secrets.

#### Verification

- Verify HTTPS, exact CORS origins, proxy settings, liveness, and readiness.
- Run approved browser workflows against staging.
- Confirm secrets are absent from Git and logs.

#### Human approval gate

- Human review of staging health, browser results, monitoring, configuration, and rollback readiness is required.

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
