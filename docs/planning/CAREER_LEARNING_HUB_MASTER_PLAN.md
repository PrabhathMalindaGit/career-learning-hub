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

- Status: PLANNED

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

- Verify upload status, page references, grounded sources, study flows, submission gating, review, and cascade deletion.
- Test User A versus User B access boundaries and answer-key secrecy.
- Run targeted type checks, tests, build, and browser workflows.
- Complete human visual QA before commit.

#### Human approval gate

- Provide a local URL and visual inspection checklist.
- Stop before commit until the user provides the phase-specific visual approval token and commit authorization.

#### Expected commit

- `Complete Learning Workspace`

### Execution Phase 13: Shared Design and UX Hardening

#### Status

- Status: PLANNED

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

- Status: PLANNED

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
