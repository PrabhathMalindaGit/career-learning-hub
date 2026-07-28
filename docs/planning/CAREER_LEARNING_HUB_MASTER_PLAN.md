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

- Status: PLANNED

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
- Validated fixes for confirmed findings.
- Ownership-map creation or update.

#### Out of scope

- Speculative hardening without a validated finding.
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

### Execution Phase 16: Accessibility and Performance Review

#### Status

- Status: PLANNED

#### Purpose

- Run Lighthouse and browser checks.
- Review accessibility, bundle size, loading, rerenders, list bounds, keyboard support, focus order, contrast, and labels.
- Apply only measured optimizations.

#### Required skills

- `karpathy-guidelines`
- `lighthouse-verification`
- `build-web-apps:react-best-practices`
- `build-web-apps:frontend-testing-debugging`
- `vercel-react-best-practices`
- `playwright`

#### In scope

- Measured accessibility and performance analysis.
- Surgical fixes supported by evidence.

#### Out of scope

- Unmeasured optimization.
- Feature work or redesign.
- Lowering accessibility or performance thresholds to pass.

#### Deliverables

- Recorded baseline and final measurements.
- Approved accessibility and performance fixes.

#### Verification

- Run Lighthouse and relevant browser checks.
- Record bundle, loading, rerender, list-bound, keyboard, focus, contrast, and label evidence.
- Run targeted type checks, tests, and build.
- Complete human visual QA before commit.

#### Human approval gate

- Provide measurements, a local URL, and a visual inspection checklist.
- Stop before commit until the user provides the phase-specific visual approval token and commit authorization.

#### Expected commit

- `Improve performance and accessibility`

### Execution Phase 17: Final Repository and Branch Review

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
