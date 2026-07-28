# Phase 13 Shared Design and UX Hardening Implementation Plan

## Document control

- Derived from:
  `docs/planning/PHASE_13_SHARED_DESIGN_UX_AUDIT.md`
- Parent phase: Phase 13 — Shared Design and UX Hardening (`ACTIVE`)
- Most recently completed pass: Phase 13F — Responsive and Touch-Target
  Hardening
  (`COMPLETED`)
- Active pass: None
- Next planned pass: Phase 13G — Integrated Accessibility and Visual QA
  (`PLANNED` / `INACTIVE`)
- Implementation-pass state: Phase 13B through Phase 13F are `COMPLETED`;
  Phase 13G is `PLANNED` and `INACTIVE`
- Plan date: 2026-07-27
- Audited baseline: branch `phase-12-unified-frontend`, HEAD `98c3f11`
- Phase 13B implementation baseline: branch `phase-12-unified-frontend`, HEAD
  `3e16017` (`Complete Phase 13 shared design audit`)
- Audit approval received:
  `PHASE_13A_SHARED_DESIGN_AUDIT_APPROVED`
- Documentation closeout authorized by:
  `CLH-PHASE-13A-DOCUMENTATION-CLOSEOUT-01`
- Phase 13B activated by:
  `CLH-PHASE-13B-ACTIVATE-AND-IMPLEMENT-01`
- Phase 13B controlling decisions: D13-01, D13-02, D13-03, D13-05, D13-06,
  D13-11, and D13-12
- Phase 13B visual-QA approval received:
  `PHASE_13B_SHARED_FOUNDATIONS_VISUAL_QA_APPROVED`
- Phase 13B closeout and implementation commit authorized by:
  `CLH-PHASE-13B-CLOSEOUT-AND-COMMIT-01`
- Phase 13C activated by:
  `CLH-PHASE-13C-ACTIVATE-AND-IMPLEMENT-01`
- Phase 13C implementation baseline: branch `phase-12-unified-frontend`, HEAD
  `78b9fee` (`Complete Phase 13 shared foundations`)
- Phase 13C visual-QA approval received:
  `PHASE_13C_FORMS_ACTIONS_VISUAL_QA_APPROVED`
- Phase 13C closeout and implementation commit authorized by:
  `CLH-PHASE-13C-CLOSEOUT-AND-COMMIT-01`
- Phase 13D activated by:
  `CLH-PHASE-13D-ACTIVATE-AND-IMPLEMENT-01`
- Phase 13D implementation baseline: branch `phase-12-unified-frontend`, HEAD
  `d44fe63` (`Complete Phase 13 forms and actions`)
- Phase 13D controlling decisions: D13-03, D13-05, D13-06, D13-10, D13-11,
  and D13-12
- Phase 13D human visual QA was approved, and closeout and the implementation
  commit were authorized by `CLH-PHASE-13D-CLOSEOUT-AND-COMMIT-01`
- Phase 13E activated by:
  `CLH-PHASE-13E-ACTIVATE-AND-IMPLEMENT-01`
- Phase 13E implementation baseline: branch `phase-12-unified-frontend`, HEAD
  `6658e2b` (`Complete Phase 13 states and pagination`)
- Phase 13E controlling decisions: D13-03, D13-04, D13-06, D13-07, D13-08,
  D13-11, and D13-12
- Phase 13E human visual QA was approved, and closeout and the implementation
  commit were authorized by `CLH-PHASE-13E-CLOSEOUT-AND-COMMIT-01`
- Phase 13F activated by:
  `CLH-PHASE-13F-ACTIVATE-AND-IMPLEMENT-01`
- Phase 13F implementation baseline: branch `phase-12-unified-frontend`, HEAD
  `dcd31da81c7ed886dc8f83da339a8d112abd6aab`
  (`Complete Phase 13 dialogs and navigation`)
- Phase 13F controlling decisions: D13-02, D13-03, D13-04, D13-08, D13-09,
  D13-10, D13-11, and D13-12
- Phase 13F human visual-QA approval received:
  `PHASE_13F_RESPONSIVE_HARDENING_VISUAL_QA_APPROVED`
- Phase 13F closeout and implementation commit authorized by:
  `CLH-PHASE-13F-CLOSEOUT-AND-COMMIT-01`

## Planning principles

1. Preserve the React/Vite architecture, feature boundaries, visual identity,
   API contracts, authentication behavior, ownership-safe errors, and private
   data controls.
2. Consolidate only where the audit demonstrates two or more equivalent
   semantic and behavioral implementations.
3. Prefer an existing successful pattern over a new invention.
4. Keep API, polling, domain copy, status vocabulary, and recovery logic inside
   their feature.
5. Introduce no dependency or second design system.
6. Define focused tests before implementation and run targeted checks before
   broader checks.
7. Every visible pass stops at the human visual-QA gate before commit.
8. Each pass is a separate reviewable commit boundary after explicit commit
   authorization. Phase 13B through Phase 13F received that authority; no
   later pass or push is authorized.

## Proposed pass sequence

| Pass | Name | Status | Depends on |
| --- | --- | --- | --- |
| Phase 13B | Shared foundations and approved tokens | COMPLETED | Phase 13A approval |
| Phase 13C | Forms, buttons, and action hierarchy | COMPLETED | Phase 13B |
| Phase 13D | State presentation, pagination, and job status | COMPLETED | Phase 13B |
| Phase 13E | Dialogs, focus, and navigation | COMPLETED | Phase 13B; approved dialog decision |
| Phase 13F | Responsive and touch-target hardening | COMPLETED | Phase 13C–13E |
| Phase 13G | Integrated accessibility and visual QA | PLANNED / INACTIVE | Phase 13B–13F |

Six passes are the smallest safe sequence because foundations must precede
consumer migrations, interaction mechanics require independent keyboard
verification, global responsive changes require all earlier component shapes
to be stable, and final integrated QA must not be combined with production
changes.

## Phase 13B — Shared foundations and approved tokens

### Pass ID and status

- Pass ID: Phase 13B
- Status: `COMPLETED`

### Purpose

Create the minimum shared presentation foundations and explicit tokens needed
by later passes, without migrating domain workflows or changing the visual
identity.

### Exact problem being solved

`frontend/src/styles.css` already defines nine useful variables and common
button/form/state classes, while the four feature stylesheets repeat the same
surface, border, error, focus, and control values. The lack of a bounded
canonical layer causes drift, but mass replacement would erase intentional
domain differences.

### Evidence from the audit

- Existing global variables and implicit focus/control behavior:
  `frontend/src/styles.css`.
- Repeated literals and control dimensions:
  `frontend/src/features/dashboard/dashboard.css`,
  `frontend/src/features/resumes/resumeWorkspace.css`,
  `frontend/src/features/interviews/interviewCoach.css`, and
  `frontend/src/features/learning/learningWorkspace.css`.
- The audit rejects typography, breakpoint, radius, and status-color mass
  replacement.

### Authorized file scope

- `frontend/src/styles.css`.
- A minimum shared presentation directory under
  `frontend/src/components/**` only if approved components need it.
- New focused tests under `frontend/src/components/**`.
- Existing feature files only when necessary to prove one foundation has two
  consumers; broad migration is deferred.
- Planning status records for Phase 13B only.

### Protected paths

- `backend/**`, `packages/**`, database/migrations/seeds, environment files,
  deployment files, package manifests, lockfile, and legacy projects.
- Authentication/token behavior in `frontend/src/features/auth/AuthProvider.tsx`
  and `frontend/src/api/apiClient.ts`.
- Domain API, polling, and contract files.

### Components or tokens affected

- Explicit focus-ring token.
- Minimum interactive-target token.
- Common control-height token only if it preserves native/file/radio behavior.
- Shared error surface/border/text tokens.
- Approved page/panel surface values.
- A minimal page-header layout primitive only if decision `D13-01` is approved.

### Required tests

- New focused render/semantic tests for any shared component.
- `frontend/src/routing/router.test.tsx`.
- Existing Dashboard, Resume list, Interview list, and Learning dashboard tests
  that consume a changed foundation.
- `npm run typecheck`.
- `npm run build`.

### Runtime requirements

- Browser: required, one bounded session after targeted tests.
- Frontend: required.
- Backend: required only for authenticated populated-route verification.
- MongoDB: required only for synthetic authenticated records.
- AI provider: prohibited/not required.

### Accessibility acceptance criteria

- Global `:focus-visible` remains at least as visible as the baseline.
- Shared header has one caller-supplied heading level and does not invent
  landmarks.
- Tokens do not lower contrast or remove non-color status text.
- Native radios, checkboxes, file inputs, and dialog semantics are unchanged.

### Responsive acceptance criteria

- No new overflow at 1440, 1024, 768, 390, or 320px.
- Header actions wrap without overlap or clipped content.
- No global breakpoint is replaced without reproduced route evidence.

### Human visual-QA gate

- Required on Dashboard, Resume list, Interview list, and Learning library at
  all five widths.
- Approval received:
  `PHASE_13B_SHARED_FOUNDATIONS_VISUAL_QA_APPROVED`.
- Human review approved the Dashboard, Resume-list, and Interview-list page
  headers; the unchanged Learning comparison route; 1440px, 1024px, 768px,
  390px, and 320px; native 200% zoom; keyboard focus and activation; header
  wrapping; action ordering; visual identity and typography preservation; and
  the absence of new header-level overflow.

### Expected commit boundary

One phase-scoped commit containing only approved foundations, focused tests,
and Phase 13B planning records, after explicit commit authorization.

### Completion evidence

- Additive shared tokens were created from existing canonical values, and one
  minimal neutral `PageHeader` was added.
- Dashboard, Resume list, and Interview list were the only migrated consumers.
  Learning and all domain workspaces remained unchanged.
- No second design system or generic Card, Workspace, Tabs, dialog, pager,
  form system, toast provider, or cross-domain job component was created.
- Focused tests passed: `PageHeader` 5/5, Dashboard 15/15, Resume list 9/9,
  and Interview list 7/7. The complete frontend suite passed 541/541;
  frontend and root typechecks passed; and the production build passed.
- Rendered QA passed at all five required widths. The browser console had no
  relevant warnings or errors, synthetic cleanup passed, and generated
  artifacts were absent.
- Human visual QA approved native 200% zoom and keyboard behavior.
- Existing React Router directive and production chunk-size warnings remain.
  The pre-existing approximately 15px global root overflow at 320px remains
  assigned to Phase 13F.
- `DashboardLayout.tsx` remains untouched and requires separate authorization
  if later removal is justified. Backend tests were not required because no
  backend code changed, and AI-provider configuration was not required.

### Dependencies

- Phase 13A audit approval.
- Decisions `D13-01`, `D13-02`, `D13-03`, and `D13-05` as applicable.

### Rollback risk

Medium. A global token or selector can affect every route. Keep changes
additive and migrate a small, named consumer set.

### Out of scope

- Feature-wide migrations.
- Typography replacement.
- Status-color remapping.
- Breakpoint normalization.
- Generic Card or Workspace components.
- Dependencies or a component library.

## Phase 13C — Forms, buttons, and action hierarchy

### Pass ID and status

- Pass ID: Phase 13C
- Status: `COMPLETED`

### Purpose

Standardize field semantics, validation recovery, common action variants,
loading/disabled presentation, and target sizes while retaining specialized
editors, files, radios, and checkboxes.

### Exact problem being solved

Auth, Resume, Interview, and Learning expose inconsistent required
communication, error association, validation focus, control height, disabled
cursor/opacity, and button hierarchy. The Resume “Discard draft changes”
action renders 25px high and is a confirmed local defect.

### Evidence from the audit

- Canonical validation summary:
  `frontend/src/features/interviews/InterviewSessionListPage.tsx`.
- Auth associated field errors but submit-button focus:
  `frontend/src/features/auth/LoginPage.tsx` and
  `frontend/src/features/auth/RegisterPage.tsx`.
- Resume create/import association gaps:
  `frontend/src/features/resumes/ResumeListPage.tsx`.
- Learning upload association gaps:
  `frontend/src/features/learning/LearningDashboard.tsx`.
- Button family differences in `frontend/src/styles.css` and all four feature
  stylesheets.
- 25px Resume discard action:
  `frontend/src/features/resumes/ResumeWorkspace.tsx` and
  `frontend/src/features/resumes/resumeWorkspace.css`.

### Authorized file scope

- `frontend/src/styles.css`.
- Approved shared field/action files under `frontend/src/components/**`.
- Auth page and focused test files.
- Resume list/workspace/recommendation page, CSS, and focused test files.
- Interview list/workspace page, CSS, and focused test files.
- Learning dashboard/quiz form files, CSS, and focused test files.
- Planning status records for Phase 13C.

### Protected paths

- All API, contract, polling, and authentication-provider behavior.
- Backend, shared types, package files, lockfile, and database files.
- Resume editor data model, quiz answer secrecy, and file-upload contract.

### Components or tokens affected

- Shared field shell or standardized class contract.
- Label, help, required, field-error, and error-summary presentation.
- Primary, secondary, destructive, and quiet action variants.
- Disabled/loading behavior.
- Minimum target/control tokens from Phase 13B.

### Required tests

- Tests written first for required communication, label/help/error association,
  error-summary focus, disabled/loading state, and button semantics.
- `frontend/src/features/auth/*.test.tsx` relevant to pages/provider routing.
- `frontend/src/features/resumes/ResumeListPage.test.tsx`.
- `frontend/src/features/resumes/ResumeWorkspace.test.tsx`.
- `frontend/src/features/interviews/InterviewSessionListPage.test.tsx`.
- `frontend/src/features/interviews/InterviewSessionWorkspace.test.tsx`.
- `frontend/src/features/learning/LearningDashboard.test.tsx`.
- `frontend/src/features/learning/QuizTaker.test.tsx`.
- `npm run typecheck` and `npm run build`.

### Runtime requirements

- Browser: required.
- Frontend: required.
- Backend: required for submission/loading/disabled behavior.
- MongoDB: required only for synthetic authenticated routes.
- AI provider: not required; unavailable states remain truthful.

### Accessibility acceptance criteria

- Every visible field has a programmatic label.
- Required state is communicated in text and/or native semantics.
- Field errors are associated with the affected input.
- Multi-field invalid submission focuses a summary or the first invalid field
  according to one documented rule.
- Native radio arrow behavior and grouping remain intact.
- Loading and disabled state are exposed without relying only on opacity.
- Common actions have a minimum 44px target, including Resume discard.

### Validation-focus rule

- A multi-field invalid submission with multiple field failures renders and
  focuses a focusable error summary while retaining associated field errors.
- A submission with one independently invalid field focuses that field and
  retains its associated error.
- Server errors without a field target, background-job failures, and passive
  inline status changes do not move focus.

### Responsive acceptance criteria

- Forms collapse without horizontal overflow or label/control clipping at all
  five widths.
- Actions wrap in a stable primary/secondary order.
- File input content and validation remain visible at 320px.

### Human visual-QA gate

- Approved for Login, Registration, Resume list/workspace, Interview
  list/workspace, Learning upload, quiz taking, and validation states.
- Approval token:
  `PHASE_13C_FORMS_ACTIONS_VISUAL_QA_APPROVED`.
- Human review approved keyboard Tab, Shift+Tab, Enter, Space, and radio-arrow
  behavior; visible focus; native 200% zoom; all five required viewport
  widths; typography and visual-identity preservation; native file and quiz
  controls; the absence of new form- or action-level clipping and overlap; and
  the absence of pre-submission answer-key exposure.

### Completion evidence

- Shared field, required-state, help, error, validation-summary, and action
  foundations were implemented without a generic Form framework,
  schema-generated forms, a toast provider, or a second design system.
- Login, Registration, Resume list/workspace, Interview list/workspace,
  Learning upload, and Quiz submit behavior were migrated. The Resume discard
  action was repaired to a 46px target.
- Multiple field failures focus a validation summary; one independently
  invalid field receives direct focus; field-level errors remain associated;
  and server or background failures do not move focus without a field target.
- Focused GREEN verification passed. The complete frontend suite passed
  545/545; frontend and root typechecks passed; and the production build
  passed.
- Browser QA passed at 1440px, 1024px, 768px, 390px, and 320px with no
  relevant console errors or warnings. Human visual QA approved native 200%
  zoom and physical keyboard behavior.
- Synthetic cleanup passed and generated artifacts were absent. Backend tests
  and AI-provider configuration were not required.
- Existing React Router directive and production chunk-size warnings remain.
  The existing approximately 15px global root overflow at 320px remains
  assigned to Phase 13F. Dialog mechanics remain assigned to Phase 13E;
  pagination, shared state surfaces, and job-status presentation remain
  assigned to Phase 13D.

### Expected commit boundary

One phase-scoped commit after focused tests, integrated build, browser QA,
operator visual approval, and explicit commit authorization.

### Dependencies

- Phase 13B foundations.
- Decisions `D13-01`, `D13-02`, and any destructive-color portion of `D13-05`.

### Rollback risk

Medium. Shared field markup can break accessible relationships and tests;
shared button selectors can affect toolbars. Migrate by named action category,
not broad element selectors.

### Out of scope

- Schema-driven form generation.
- Resume editor redesign.
- File-upload contract changes.
- Quiz behavior or answer changes.
- New form library.

## Phase 13D — State presentation, pagination, and job status

### Pass ID and status

- Pass ID: Phase 13D
- Status: `COMPLETED`
- Activated by operator-approved prompt
  `CLH-PHASE-13D-ACTIVATE-AND-IMPLEMENT-01`.
- Implementation baseline: branch `phase-12-unified-frontend`, HEAD
  `d44fe63` (`Complete Phase 13 forms and actions`).
- Controlling decisions: D13-03, D13-05, D13-06, D13-10, D13-11, and D13-12.
- Human visual QA was approved. Closeout and the implementation commit were
  authorized by `CLH-PHASE-13D-CLOSEOUT-AND-COMMIT-01`.

### Purpose

Consolidate genuine state-surface and pager duplication and the near-identical
Learning Flashcard/Quiz job-status presentation.

### Exact problem being solved

More than a dozen loading/empty/error/not-found surfaces and more than nine
pagers repeat the same presentation with inconsistent roles, landmarks,
heights, and spacing. Flashcard and Quiz job states contain nearly identical
markup. Domain polling, copy, and recovery remain intentionally different.

### Evidence from the audit

- Route error foundation: `frontend/src/routing/RouteErrorPage.tsx`.
- State families in Dashboard, Resume, Interview, and Learning page/workspace
  files.
- Pagination in
  `frontend/src/features/dashboard/ActivityFeed.tsx`,
  Resume list/workspace, Interview list/workspace, and the Learning dashboard,
  conversation, document, flashcard, quiz, and attempt files.
- Job-status duplication:
  `frontend/src/features/learning/DocumentFlashcards.tsx` and
  `frontend/src/features/learning/DocumentQuizzes.tsx`.
- Distinct job behavior to preserve in Resume, Interview, grounded
  conversation, and Learning deletion.

### Authorized file scope

- Approved shared presentation files under `frontend/src/components/**`.
- `frontend/src/styles.css`.
- `frontend/src/routing/RouteErrorPage.tsx` and focused router tests.
- Named feature page/workspace and CSS files that currently render state or
  pagination.
- Learning Flashcard/Quiz presentation and focused tests.
- Planning status records for Phase 13D.

### Protected paths

- API clients, response validation, request-ID preservation logic, polling,
  retries, cancellation, ownership-safe 404 behavior, quiz answer secrecy, and
  backend jobs.
- Package, lockfile, shared type, database, and environment files.

### Components or tokens affected

- State surface with explicit semantic mode.
- Safe-not-found presentation slots.
- Labelled pager.
- Learning job-status presentation.
- Shared request-ID placement.
- Base status-chip geometry only if decision `D13-05` permits it.

### Required tests

- Component tests for heading/body/action slots, status versus alert mode,
  required pagination accessible label, disabled boundary state, and job-state
  action slots.
- Existing focused Dashboard, Resume, Interview, and Learning tests for
  loading, empty, error, safe-not-found, pagination, and job states.
- Contract/polling tests must continue passing unchanged where affected.
- `npm run typecheck` and `npm run build`.

### Runtime requirements

- Browser: required.
- Frontend: required.
- Backend: required for real empty/populated/error-safe route transitions.
- MongoDB: required for synthetic pagination and ready records.
- AI provider: not required; queued/failed/provider-unavailable UI may use
  sanitized test fixtures or controlled existing behavior.

### Accessibility acceptance criteria

- Pagination has a unique accessible navigation label.
- Current page is announced in text; boundary buttons are natively disabled.
- Static errors do not become assertive live regions without reason.
- Dynamic job state uses suitable `status`/progress semantics.
- Request IDs remain selectable text and are not part of the heading.
- Safe 404 wording remains ownership neutral.

### Responsive acceptance criteria

- Pager controls wrap or remain contained at 320px.
- State actions do not clip or overlap.
- Long status/request text wraps without horizontal scrolling.
- No fixed width is introduced.

### Human visual-QA gate

- Approved for loading, empty, error, safe-not-found, unknown-route,
  request-ID, recovery, and back-action presentation; static, status, and
  alert semantics; and long-message wrapping.
- Approved for Dashboard, Resume, Interview, and Learning pagination,
  including first, middle, and last pages, accessible labels, visible current
  pages, disabled controls, keyboard operation, and mobile containment.
- Approved for Flashcard and Quiz queued, processing, provider-unavailable,
  and ready presentation; distinct resource copy; retry, refresh, recovery,
  and polling preservation; and no pre-submission answer-key exposure.
- Approved at 1440px, 1024px, 768px, 390px, 320px, and native 200% zoom,
  including Tab, Shift+Tab, Enter, Space, visible focus, wrapping, and no new
  component-level clipping, overlap, or overflow.

### Completion evidence

- Created `StateSurface` with explicit static, status, and alert modes;
  `Pager` with a required accessible label and caller-owned state and actions;
  and Learning-specific `LearningGenerationJobStatus`.
- Migrated only the approved state and pager consumers. Specialized Resume,
  Interview, conversation, document, study, upload, import, analysis,
  deletion, grounded-chat, Flashcard, Quiz, and attempt workflows remained
  local.
- Preserved API and polling behavior, retry, resume, refresh, cancellation,
  timeout, completion validation, recovery, request IDs, ownership-neutral
  not-found wording, status colors, typography, and quiz answer secrecy. No
  toast provider or cross-domain job engine was introduced.
- Focused verification passed 10 files and 132 tests; the complete frontend
  suite passed 39 files and 563 tests; frontend and root typechecks and the
  production build passed.
- Browser QA passed at all five required widths with a healthy console. Human
  review approved native 200% zoom and physical keyboard behavior. Synthetic
  cleanup passed and generated artifacts were absent.
- Existing React Router directive and production chunk-size warnings remain.
  The existing approximately 15px global root overflow at 320px remains
  deferred to Phase 13F. Dialog and navigation mechanics remain assigned to
  Phase 13E. Backend tests and AI-provider configuration were not required.

### Expected commit boundary

One pass-scoped commit after all affected focused tests and explicit operator
commit authorization.

### Dependencies

- Phase 13B.
- `D13-05` for any status visual changes.
- `D13-06` must remain “no toast” unless separately approved.

### Rollback risk

Medium. A generic state component can accidentally alter live-region behavior
or hide domain remediation. Keep semantic mode required and keep copy/actions
at call sites.

### Out of scope

- One cross-domain job engine.
- Polling/API refactors.
- Toast provider.
- Status vocabulary changes.
- New retry or cancellation behavior.

## Phase 13E — Dialogs, focus, and navigation

### Pass ID and status

- Pass ID: Phase 13E
- Status: `COMPLETED`

### Purpose

Remove duplicated Resume dialog mechanics, preserve Learning deletion safety,
and standardize focus and navigation interaction without restructuring the
application.

### Exact problem being solved

Two Resume custom dialogs independently implement the same focus trap,
Escape, initial focus, and restoration behavior. Navigation and back links are
semantically sound but use inconsistent target sizes. The mobile shell behavior
works and should be hardened, not redesigned.

### Evidence from the audit

- Duplicated dialog mechanics:
  `frontend/src/features/resumes/ResumeWorkspace.tsx` and
  `frontend/src/features/resumes/AiRecommendations.tsx`.
- Strong native-dialog reference:
  `frontend/src/features/learning/LearningDocumentDeletion.tsx`.
- Mobile menu:
  `frontend/src/AppShell.tsx` and `frontend/src/routing/router.test.tsx`.
- Learning tabs:
  `frontend/src/features/learning/LearningDocumentWorkspace.tsx` and its
  focused tests.
- Back links across Resume, Interview, and Learning workspace files.

### Authorized file scope

- Approved dialog files under `frontend/src/components/**`.
- Resume dialog callers, Resume CSS, and focused tests.
- Learning deletion only if required by the approved dialog decision; deletion
  orchestration and ownership behavior remain protected.
- `frontend/src/AppShell.tsx`, `frontend/src/styles.css`, and focused router
  tests for local navigation/touch/focus fixes.
- Workspace back-link CSS/call sites.
- Planning status records for Phase 13E.

### Protected paths

- Route structure unless `D13-04` is explicitly approved.
- Authentication/logout behavior.
- Learning deletion API, typed-title rule, owned-resource protections, and
  cleanup behavior.
- Domain workspace tabs/data logic.
- Backend, shared types, packages, and database.

### Components or tokens affected

- Dialog shell and focus contract, if approved.
- Back-link common style.
- Mobile menu target/focus behavior.
- Existing global focus-ring token.
- No new tab component unless another genuine consumer exists.

### Required tests

- Tests written first for accessible name/description, initial focus, Tab and
  Shift+Tab containment, Escape, action dismissal, focus return, and nested
  form behavior.
- `frontend/src/features/resumes/ResumeWorkspace.test.tsx`.
- Focused AiRecommendations tests added at its behavior boundary.
- `frontend/src/features/learning/LearningDocumentDeletion.test.tsx`.
- `frontend/src/routing/router.test.tsx`.
- `frontend/src/features/learning/LearningDocumentWorkspace.test.tsx`.
- `npm run typecheck` and `npm run build`.

### Runtime requirements

- Browser: required with real keyboard checks.
- Frontend: required.
- Backend: required for authenticated routes and safe deletion-dialog setup.
- MongoDB: required only for synthetic dialog/resource records.
- AI provider: not required.

### Accessibility acceptance criteria

- Dialog has an accessible name and, where useful, description.
- Initial focus is deterministic and non-destructive.
- Tab and Shift+Tab remain within the modal.
- Escape follows the caller’s documented cancellation policy.
- Focus returns to the exact invoker.
- Destructive action cannot become the accidental initial focus.
- Mobile menu Escape/focus return and Learning tab arrows remain unchanged.

### Responsive acceptance criteria

- Dialog remains within the viewport at 390 and 320px and at human-verified
  200% zoom.
- Dialog actions wrap without reversing meaning.
- Mobile navigation has no clipped links or overflow.
- Back links wrap and retain a 44px target.

### Human visual-QA gate

- Required for both Resume dialogs, Learning deletion, mobile navigation, back
  links, and all audited widths plus 200% zoom.
- Human visual QA approved all required dialog, focus, navigation, responsive,
  zoom, and physical-keyboard checks.

### Completion evidence

- Created one minimal native `Dialog` presentation shell. Migrated the AI
  recommendation confirmation first and the Resume unsaved-navigation blocker
  second while preserving caller-owned copy, actions, forms, state, and
  domain behavior.
- Accessible naming and descriptions, safe deterministic initial focus,
  forward and reverse focus containment, caller-owned Escape policy, exact
  focus restoration, nested forms, destructive initial-focus prevention, and
  Dialog Escape isolation passed review.
- Hardened mobile-menu targets, Escape, committed-navigation close, and exact
  focus restoration while preserving the navigation model, routes, order,
  active state, 980px breakpoint, skip link, and logout behavior.
- Hardened Interview normal/error and Learning normal/error back links to 44px
  targets without changing labels or destinations. No Resume back link was
  invented.
- Learning tabs remained domain-specific. Learning deletion production
  behavior, typed-title gating, ownership, polling, orchestration, duplicate
  prevention, recovery, and cleanup remained unchanged.
- No generic modal manager, Tabs component, toast provider, drawer, sidebar,
  breadcrumb system, or second design system was introduced.
- Final focused verification passed 7 files and 139 tests. The complete
  frontend suite passed 41 files and 567 tests before a later
  Browser-discovered integration repair. The final repair passed affected
  focused tests, frontend and root typechecks, the production build, and
  Browser recheck; the complete suite was intentionally not rerun.
- Browser QA passed at 1440px, 1024px, 768px, 390px, and 320px with a healthy
  console. Human review approved native 200% zoom, physical-keyboard operation,
  visible focus, target sizing, wrapping, and the absence of new
  component-level clipping, overlap, or overflow. Synthetic cleanup passed
  and generated artifacts were absent.
- Existing React Router directive and production chunk-size warnings remain.
  The existing approximately 15px global root overflow at 320px and broader
  responsive and touch-target work remain assigned to Phase 13F. Integrated
  cross-route accessibility QA remains assigned to Phase 13G. Backend tests
  and external AI-provider configuration were not required.

### Expected commit boundary

One pass-scoped commit after keyboard/browser QA and explicit commit
authorization.

### Dependencies

- Phase 13B.
- Decision `D13-07` is mandatory.
- Decisions `D13-04` and `D13-08` constrain navigation scope.

### Rollback risk

Medium to high. Dialog regressions can trap focus or enable destructive
misactivation. Migrate one Resume dialog, verify, then migrate the second
without changing the deletion workflow in the same step.

### Out of scope

- Navigation-information architecture changes.
- Breadcrumbs.
- Route changes.
- Modal replacement beyond audited dialogs.
- Deletion contract changes.

## Phase 13F — Responsive and touch-target hardening

### Pass ID and status

- Pass ID: Phase 13F
- Status: `COMPLETED`
- Activated by operator-approved prompt
  `CLH-PHASE-13F-ACTIVATE-AND-IMPLEMENT-01`.
- Implementation baseline: branch `phase-12-unified-frontend`, HEAD
  `dcd31da81c7ed886dc8f83da339a8d112abd6aab`
  (`Complete Phase 13 dialogs and navigation`).
- Controlling decisions: D13-02, D13-03, D13-04, D13-08, D13-09, D13-10,
  D13-11, and D13-12.

### Purpose

Repair the confirmed 320px overflow and remaining target, wrapping, and
containment defects after shared component shapes are stable.

### Exact problem being solved

The global 320px minimum width produces a 320px document inside a 305px layout
viewport when a vertical scrollbar is present. Learning avoids the defect with
a feature-only `html:has(...)` override. Several navigation, back, pager, auth,
form, and action targets remain below 44px.

### Evidence from the audit

- Global minimum-width rule: `frontend/src/styles.css`.
- Learning-only successful override:
  `frontend/src/features/learning/learningWorkspace.css`.
- Confirmed overflow on Dashboard, Resume, and Interview at 320px.
- No overflow on Auth or Learning at 320px.
- Sub-44px geometry across AppShell, back links, auth secondary links,
  pagination, Resume/Interview controls, and the 25px Resume discard action.

### Authorized file scope

- `frontend/src/styles.css`.
- The four existing feature stylesheets.
- `frontend/src/AppShell.tsx`.
- Exact page/workspace files required for wrapping structure.
- Focused responsive/semantic tests where stable assertions are possible.
- Planning status records for Phase 13F.

### Protected paths

- API/domain behavior, routes, data contracts, backend, shared types, packages,
  lockfile, environment, database, and deployment.
- Visual redesign, typography change, navigation reorganization, and new
  breakpoints without evidence.

### Components or tokens affected

- Global minimum-width/reflow rule.
- Interactive-target token.
- Header/action/pager wrapping.
- Back-link and navigation target styles.
- Dialog containment styles only if Phase 13E changes them.

### Required tests

- Focused layout-class and interaction tests for modified structure.
- All affected Dashboard, Resume, Interview, Learning, router, and Auth focused
  tests.
- `npm run typecheck`.
- `npm run build`.
- No claim that jsdom proves layout; rendered measurement is mandatory.

### Runtime requirements

- Browser: mandatory.
- Frontend: mandatory.
- Backend: mandatory for complete authenticated route coverage.
- MongoDB: mandatory only for synthetic populated resources.
- AI provider: not required.

### Accessibility acceptance criteria

- No horizontal scrolling at 320px for normal page content.
- All common interactive targets are at least 44 by 44 CSS pixels or have an
  equivalent enclosing label/click target.
- Focus outlines are not clipped.
- Content order remains logical after column collapse.
- Human 200% zoom check has no loss of content or functionality.

### Responsive acceptance criteria

- Verify 1440, 1024, 768, 390, and 320px on every requested route group.
- Verify 200% browser zoom manually.
- No clipped navigation, overlap, fixed-width overflow, off-screen dialog,
  inaccessible action, or broken long-title wrapping.
- Do not merge content-driven breakpoints solely to reduce breakpoint count.

### Human visual-QA gate

- Mandatory full route matrix at all five widths and 200% zoom.
- Approval received and recorded in document control.

### Expected commit boundary

One pass-scoped commit after exact route/viewport evidence, human approval, and
explicit commit authorization.

### Completion evidence

- Changed global `html` and `body` minimum widths from 320px to 0, correcting
  the scrollbar-reduced 320px overflow without hiding or clipping overflow.
  The redundant Learning-only root-width workaround was removed.
- Hardened approved common targets with the existing 44px token through
  bounded named selectors. No ordinary audited target below 44px remained.
  The native Resume file input, native checkbox and radio controls with
  enclosing labels, and specialized dense Resume controls remained native or
  local as reviewed.
- All requested normal-content routes had equal document client and scroll
  widths after correction. Long headings, role labels, suggestions, request
  IDs, chat content, quiz questions, and attempt explanations wrapped safely.
  Both Resume dialogs and Learning deletion remained contained, with no
  action overlap, off-screen control, or clipped focus indicator.
- PageHeader, Pager, StateSurface, and Dialog contracts were unchanged.
  Navigation routes, destinations, order, active state, skip link, logout,
  and the 980px breakpoint were preserved. API and domain behavior,
  typography, visual identity, and status colors were unchanged. No new
  breakpoint, overflow mask, JavaScript viewport logic, toast provider,
  second design system, or generic responsive abstraction was added.
- Focused router verification passed 47 tests. Bounded route/component
  verification passed 14 files and 210 tests. The complete frontend suite
  passed 41 files and 569 tests exactly once. Frontend and root typechecks
  and the production build passed.
- Browser QA passed at 1440px, 1024px, 768px, 390px, and 320px with a healthy
  console. Human review approved native 200% zoom, physical-keyboard
  behavior, focus, wrapping, target sizing, dialogs, mobile navigation, and
  responsive containment.
- Synthetic cleanup passed and generated artifacts were absent. The existing
  production bundle-size advisory remains non-failing. Integrated cross-route
  accessibility and visual regression verification remains assigned to Phase
  13G. Backend tests and external AI-provider configuration were not
  required.

### Dependencies

- Phase 13C, Phase 13D, and Phase 13E complete.
- Decision `D13-09` for the global minimum-width rule.

### Rollback risk

High for the global minimum-width change, low to medium for local target
repairs. Apply the global change separately inside the pass and verify every
route before local cleanup.

### Out of scope

- New responsive navigation model.
- New grid system.
- Breakpoint normalization.
- Typography scaling redesign.
- Device-specific product behavior.

## Phase 13G — Integrated accessibility and visual QA

### Pass ID and status

- Pass ID: Phase 13G
- Status: `PLANNED` / `INACTIVE`

### Purpose

Perform integrated regression verification of Phase 13B–13F without adding
production behavior, then record Phase 13 completion evidence.

### Exact problem being solved

Shared presentation and global responsive changes can pass focused tests yet
interact poorly across routes. A dedicated no-feature-change pass is required
to verify the complete UI, keyboard behavior, focus, state variants, and
responsive matrix before Phase 13 can complete.

### Evidence from the audit

- Cross-domain foundations affect at least five UI families.
- Static tests cannot prove geometry, overflow, zoom, focus visibility, or
  visual hierarchy.
- Phase 13A driver limitations require human 200% zoom and real-keyboard
  confirmation.

### Authorized file scope

- Focused test repairs only when a verified production regression requires
  them and the correction does not weaken expectations.
- Planning/status documents and Phase 13 verification report.
- Production files are read-only unless a separately approved bounded repair
  is opened; Phase 13G itself is verification-first.

### Protected paths

- Backend, shared types, dependencies, environment, database, migrations,
  seeds, deployment, legacy projects, and all unrelated production code.
- No test deletion, skipping, loosening, or snapshot replacement to hide
  regressions.

### Components or tokens affected

- None expected. This is an integrated QA pass.

### Required tests

- All focused tests changed or depended upon by Phase 13B–13F.
- `npm run typecheck`.
- `npm run build`.
- Broader frontend-relevant test command supported by the repository at that
  time; do not invent a root frontend test script.
- Exact command outcomes recorded.

### Runtime requirements

- Browser: mandatory, one bounded integrated session.
- Frontend: mandatory.
- Backend: mandatory.
- MongoDB: mandatory for synthetic empty/populated states.
- AI provider: not required.
- Synthetic records must be removed and verified zero after QA.

### Accessibility acceptance criteria

- Logical Tab/Shift+Tab order on global navigation, forms, tabs, pagination,
  dialogs, radio groups, quiz submission, and settings.
- Enter/Space/arrow/Escape behavior confirmed with real keyboard input.
- Visible, unclipped focus.
- No keyboard trap.
- Dialog initial focus, containment, Escape, and return confirmed.
- Labels, errors, live regions, landmarks, and heading hierarchy verified.

### Responsive acceptance criteria

- Complete requested route matrix at 1440, 1024, 768, 390, and 320px.
- Human native 200% zoom.
- No horizontal overflow, clipped content/navigation, action overlap,
  inaccessible control, or dialog containment defect.

### Human visual-QA gate

- Mandatory final integrated inspection.
- Expected token:
  `PHASE_13G_INTEGRATED_VISUAL_QA_APPROVED`.
- Phase 13 may not be marked completed before this token and all command
  evidence exist.

### Expected commit boundary

One documentation/test-only verification commit if changes exist, after
explicit commit authorization. If no repository changes are required, record a
no-commit verification result.

### Dependencies

- Phase 13B through Phase 13F completed and individually approved.

### Rollback risk

Low if verification-only. Any reproduced defect must return to a bounded repair
with its own attempt count and verification; do not fold speculative fixes into
the final QA pass.

### Out of scope

- New UI features.
- New abstractions.
- Backend or database work.
- Phase 14 activation.
- Security-review scope reserved for later phases.

## Decision register

The operator approved every decision below with
`PHASE_13A_SHARED_DESIGN_AUDIT_APPROVED`. Approval resolves the design
direction but did not itself activate an implementation pass. Phase 13B was
activated separately as recorded in Document control.

| Decision ID | Status | Implementation pass | Controlling direction and preserved constraints | Explicitly rejected alternative |
| --- | --- | --- | --- | --- |
| D13-01 | APPROVED | Phase 13B and Phase 13C | Allow only small shared page-header and presentation primitives with caller-owned headings, actions, semantics, copy, and domain behavior. | Generic Workspace or domain-resource abstractions. |
| D13-02 | APPROVED | Phase 13B | Promote only proven common tokens for focus rings, minimum interactive targets, approved control height, common error treatment, and selected shared surfaces. | Mass replacement of colors, radii, spacing, or breakpoints. |
| D13-03 | APPROVED | Phase 13B through Phase 13G | Preserve the current application typography. Align existing sizes or line heights only where an approved shared pattern requires it. | A new application type scale or font. |
| D13-04 | APPROVED | Phase 13E and Phase 13F | Preserve navigation structure, routes, destinations, active-state behavior, skip link, and information architecture. Permit only bounded size, wrapping, target, and focus repairs. | Route, destination, ordering, breadcrumb, or information-architecture changes. |
| D13-05 | APPROVED | Phase 13B and Phase 13D | Preserve domain-specific status-color mappings. Shared geometry or semantic tokens require an explicit state map and contrast verification. | Normalizing all statuses into one global palette. |
| D13-06 | APPROVED | Phase 13B through Phase 13G | Preserve contextual inline feedback unless a separate concrete use case is approved. | A Phase 13 toast provider. |
| D13-07 | APPROVED | Phase 13E | Create one minimal dialog shell derived from verified native Learning-dialog behavior. Migrate the two Resume dialogs separately and preserve their domain content, Learning deletion orchestration, typed-title confirmation, ownership, and cleanup. | Changing Learning deletion behavior or replacing unrelated dialogs. |
| D13-08 | APPROVED | Phase 13E and Phase 13F | Preserve the mobile-navigation model and breakpoint. Increase target sizes and verify tab order, Escape behavior, and focus return. | A drawer, sidebar, new breakpoint, or new navigation model. |
| D13-09 | APPROVED | Phase 13F | Remove or safely scope the effective global 320px minimum-width behavior and verify every requested route at the real narrow layout viewport. | More route-specific overrides that preserve the defective global rule. |
| D13-10 | APPROVED | Phase 13D | Permit a minimal presentational pager with a required accessible label and caller-owned pagination data, loading state, and actions. | A pager that owns domain pagination or loading behavior. |
| D13-11 | APPROVED | All Phase 13 passes | Share only proven presentation tokens. | A shared cross-domain Card or Workspace component. |
| D13-12 | APPROVED | All Phase 13 passes | Keep Learning tabs domain-specific until another genuine consumer exists. | A speculative generic Tabs abstraction. |

## Verification policy for every implementation pass

- Inspect `git status --short` before editing.
- Define exact success criteria and focused tests before production changes.
- Run targeted tests first.
- Never weaken, skip, or delete a failing test.
- Apply the three-attempt failure-loop rule per root cause.
- Run typecheck and production build when applicable.
- Start only required services and stop services started by the pass.
- Use synthetic `.test` data and remove it after browser QA.
- Inspect five widths; use human native 200% zoom where required.
- Show `git status --short`, `git diff --stat`, scoped diff, and
  `git diff --check`.
- Check for secrets, generated artifacts, and unrelated changes.
- Stop before stage/commit until the pass-specific visual token and explicit
  commit authorization are supplied.

## Phase 13 completion conditions

Phase 13 may be marked `COMPLETED` only after:

1. Phase 13A is approved.
2. Every activated implementation pass has its tests, browser evidence, human
   visual-QA token, and reviewable commit boundary.
3. No unresolved Critical or Important Phase 13 finding remains, unless an
   explicit operator decision accepts and documents it.
4. Auth, ownership, request-ID, private-data, quiz-answer, upload, and polling
   behavior remains unchanged or is separately authorized.
5. The integrated route/viewport/keyboard/zoom matrix passes.
6. Synthetic data and temporary artifacts are verified removed.
7. Phase 14 remains `PLANNED` until separately activated.

Phase 13B through Phase 13F are completed. Phase 13 remains `ACTIVE`; no pass
is active; Phase 13G remains `PLANNED` and `INACTIVE`; and Phase 14 remains
`PLANNED` and is not activated. The current workflow state is
`PHASE 13 ACTIVE — PASS F COMPLETED — PASS G PLANNED, NOT ACTIVATED`. No
push, Phase 13G activation, Phase 14 activation, or Phase 13 completion is
authorized.
