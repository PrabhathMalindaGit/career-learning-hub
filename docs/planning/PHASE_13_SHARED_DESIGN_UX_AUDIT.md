# Phase 13 Shared Design and UX Audit

## 1. Document metadata

- Prompt ID: `CLH-PHASE-13A-ACTIVATE-AND-AUDIT-01`
- Phase: Phase 13 — Shared Design and UX Hardening
- Pass: Phase 13A — Shared Design and UX Audit
- Pass status: `COMPLETED`
- Audit date: 2026-07-27
- Repository: `/Users/prabhathmalinda/Documents/Projects/Career Learning Hub`
- Starting branch: `phase-12-unified-frontend`
- Starting and final audited HEAD: `98c3f11` (`Complete Phase 12 Learning Workspace`)
- Audit type: static inspection plus one bounded rendered browser session
- Production-code changes: none
- Approval token received: `PHASE_13A_SHARED_DESIGN_AUDIT_APPROVED`
- Documentation closeout prompt:
  `CLH-PHASE-13A-DOCUMENTATION-CLOSEOUT-01`

## 2. Executive summary

The frontend has a coherent visual identity and several useful shared
foundations, but it does not yet have one consistent application pattern for
page headers, buttons, form validation, state presentation, pagination, or
long-running job status. The evidence supports measured consolidation in those
areas. It does not support a new design system, a broad CSS rewrite, or generic
domain-workspace components.

The strongest genuine-duplication candidates are:

1. page-header structure across Dashboard, Resume Studio, and Interview Coach;
2. pagination presentation across Dashboard, Resumes, Interviews, and Learning;
3. the two custom Resume dialogs and their duplicated focus-trap logic;
4. repeated loading, empty, error, and safe-not-found surfaces;
5. the Flashcard and Quiz job-status presentations;
6. common button and form-field behavior currently reimplemented by feature
   styles.

No Critical finding was confirmed. Important findings are the reproducible
horizontal overflow at a 320px viewport on non-Learning authenticated routes,
the 25px-high Resume “Discard draft changes” action, multiple sub-44px
interactive targets, and inconsistent validation focus/required-field
communication. Learning avoids the 320px overflow with a feature-only
`html:has(...)` override, demonstrating both a successful behavior and a
fragmented global rule.

The smallest safe path is six bounded implementation passes. Each pass preserves
domain data and copy, uses an existing successful pattern as its starting point,
and ends at an explicit test and human visual-QA boundary.

## 3. Audit scope and exclusions

### In scope

- Application shell, global and mobile navigation.
- Auth, Dashboard, Resume, Interview, and Learning routes.
- Existing shared UI, tokens, feature CSS, and directly relevant tests.
- Buttons, forms, dialogs, state presentation, pagination, job progress, cards,
  metadata, tabs, focus, keyboard operation, and responsive behavior.
- Viewports at 1440px, 1024px, 768px, 390px, and 320px.
- Synthetic empty and populated states.

### Excluded

- Production frontend or frontend-test changes.
- Backend, shared-type, package, lockfile, environment, migration, seed, or
  deployment changes.
- New features, a new design system, dependency installation, mass token
  replacement, or visual redesign.
- Phase 14 activation or end-to-end implementation.
- Legacy-project access.
- Real AI-provider configuration or calls.

## 4. Repository baseline

The baseline satisfied every activation prerequisite:

- repository root:
  `/Users/prabhathmalinda/Documents/Projects/Career Learning Hub`;
- branch: `phase-12-unified-frontend`;
- HEAD: `98c3f11`;
- HEAD subject: `Complete Phase 12 Learning Workspace`;
- clean tracked, staged, and untracked state;
- no merge, rebase, cherry-pick, revert, or bisect in progress;
- Phase 12 and Passes A through F recorded `COMPLETED`;
- Phase 13 recorded `PLANNED` before this activation;
- Phase 14 recorded `PLANNED`;
- no frontend or backend build, coverage, screenshot, trace, or log artifact.

Phase 13 and Phase 13A were then activated only in
`docs/planning/CAREER_LEARNING_HUB_MASTER_PLAN.md` and
`docs/planning/CURRENT_PHASE.md`. Phase 12 remains completed and Phase 14
remains planned.

## 5. Existing frontend architecture

- `frontend/src/main.tsx` mounts the React application.
- `frontend/src/routing/router.tsx` owns the route tree and composes public,
  protected, and resource-workspace routes.
- `frontend/src/AppShell.tsx` provides the authenticated application header,
  desktop navigation, mobile navigation, skip link, main landmark, and logout.
- `frontend/src/features/auth/AuthProvider.tsx` owns in-memory authentication
  state and bootstrap/refresh behavior.
- `frontend/src/features/dashboard/**` provides aggregate progress and activity
  presentation.
- `frontend/src/features/resumes/**` provides the Resume list, editor,
  preview, analysis, recommendations, and unsaved-change handling.
- `frontend/src/features/interviews/**` provides Interview list, creation,
  question, attempt, and feedback workflows.
- `frontend/src/features/learning/**` provides the document library, document
  workspace, grounded conversation, flashcards, quizzes, attempts, and
  deletion workflow.
- `frontend/src/styles.css` supplies global variables and shared class-level
  foundations. Each product domain also owns a substantial feature stylesheet:
  `frontend/src/features/dashboard/dashboard.css`,
  `frontend/src/features/resumes/resumeWorkspace.css`,
  `frontend/src/features/interviews/interviewCoach.css`, and
  `frontend/src/features/learning/learningWorkspace.css`.
- `frontend/package.json` confirms the frontend uses React 19, React Router,
  Vite, TypeScript, Vitest, and Testing Library without a third-party component
  library or design-system dependency.

The architecture is feature-oriented. Phase 13 should preserve that boundary:
shared presentation and interaction primitives may move to the common layer,
while API calls, polling, ownership-safe errors, domain copy, and domain data
remain in their feature.

## 6. Existing shared components

Confirmed application-wide shared implementations:

- `frontend/src/AppShell.tsx`: shell, landmarks, desktop/mobile navigation,
  skip navigation, logout, mobile Escape handling, and menu focus return.
- `frontend/src/features/auth/AuthRoute.tsx`: protected-route boundary.
- `frontend/src/routing/RouteErrorPage.tsx`: route-level safe error/not-found
  surface.
- `frontend/src/features/dashboard/DashboardLayout.tsx`: shared only within
  Dashboard.
- `frontend/src/features/dashboard/ActivityFeed.tsx` and
  `frontend/src/features/dashboard/ProgressWidgets.tsx`: Dashboard-only
  presentation.
- global CSS patterns in `frontend/src/styles.css`: `.primary-button`,
  `.secondary-button`, `.form-field`, `.form-error`, `.workspace-section`,
  `.route-state`, focus-visible styling, and responsive shell behavior.

`frontend/src/features/learning/DocumentChat.tsx` and
`frontend/src/features/learning/DocumentViewer.tsx` are exported but not used by
the active routes in `frontend/src/routing/router.tsx`. They must not be treated
as canonical simply because they have generic names.

There is no shared dialog component, pager component, toast provider, state
surface component, status-chip component, or background-job presentation
component.

## 7. Existing design tokens

`frontend/src/styles.css` defines the current canonical global values:

- `--color-accent`
- `--color-accent-dark`
- `--color-surface`
- `--color-surface-muted`
- `--color-border`
- `--color-text-muted`
- `--color-error`
- `--color-error-surface`
- `--shadow-soft`

The global font stack, text color, focus ring, minimum body width, common
control styling, shell widths, and base responsive behavior also function as
implicit tokens.

Audit observations:

- Feature styles repeat global literals such as white, dark text, muted green
  surfaces, borders, and accent colors instead of consistently using the
  variables in `frontend/src/styles.css`.
- Radius values are fragmented: `10px` occurs 19 times; `999px` and `14px`
  occur 11 times each; `12px` occurs 10 times. These counts do not by
  themselves justify replacement.
- Breakpoints span 1100, 1080, 980, 900, 820, 780, 720, 700, 560, 520, 420,
  390, 360, and 350px across
  `frontend/src/styles.css`,
  `frontend/src/features/dashboard/dashboard.css`,
  `frontend/src/features/resumes/resumeWorkspace.css`,
  `frontend/src/features/interviews/interviewCoach.css`, and
  `frontend/src/features/learning/learningWorkspace.css`. Some reflect
  genuine content thresholds and must remain local.
- Control heights differ by family: global 46px, Resume 42px, Interview 43px,
  Learning 44px, and Dashboard pagination 42px.
- The global focus ring is coherent and visible. Focus-ring color and width are
  candidates for explicit tokens, not visual replacement.
- Error surface, border, and text values are already global-token candidates.
- Status success/warning/error colors differ between domains. Promotion
  requires a status-meaning mapping and visual approval; blind color
  replacement is unsafe.
- `z-index` usage is small and bounded (1, 20, 100, and 200). No new global
  z-index scale is justified.

Recommended token work is limited to values proven to represent the same
behavior: focus ring, minimum interactive target, shared control height,
common error treatment, and the page/panel foundations chosen in the
implementation pass. Typography, domain status colors, and content-driven
breakpoints require explicit decisions.

## 8. Route and page inventory

Routes defined in `frontend/src/routing/router.tsx` and included in the audit:

| Route | Page/workspace | Rendered |
| --- | --- | --- |
| `/login` | Login | Yes |
| `/register` | Registration | Yes |
| `/dashboard` | Main dashboard, empty and populated | Yes |
| `/resumes` | Resume list, empty and populated | Yes |
| `/resumes/:resumeId` | Resume workspace | Yes |
| `/interviews` | Interview list, empty and populated | Yes |
| `/interviews/:sessionId` | Interview workspace | Yes |
| `/learning` | Learning document library, empty and populated | Yes |
| `/learning/documents/:documentId` | Document workspace | Yes |
| `/learning/documents/:documentId/conversations/:conversationId` | Grounded conversation | Yes |
| `/learning/documents/:documentId/flashcards/:setId` | Flashcard study | Yes |
| `/learning/documents/:documentId/quizzes/:quizId` | Quiz taking | Yes |
| `/learning/documents/:documentId/quizzes/:quizId/attempts/:attemptId` | Attempt review | Yes |
| `/settings` | Session settings | Yes |
| unknown/resource-safe 404 | Route and owned-resource not found | Yes |

Page headers are independently implemented in
`frontend/src/features/dashboard/MainDashboard.tsx`,
`frontend/src/features/resumes/ResumeListPage.tsx`,
`frontend/src/features/interviews/InterviewSessionListPage.tsx`, and the
Learning workspaces. Workspace headers live in
`frontend/src/features/resumes/ResumeWorkspace.tsx`,
`frontend/src/features/interviews/InterviewSessionWorkspace.tsx`,
`frontend/src/features/learning/LearningDocumentWorkspace.tsx`,
`frontend/src/features/learning/LearningConversationWorkspace.tsx`,
`frontend/src/features/learning/LearningFlashcardWorkspace.tsx`,
`frontend/src/features/learning/LearningQuizWorkspace.tsx`, and
`frontend/src/features/learning/LearningQuizAttemptWorkspace.tsx`.

## 9. Duplication evidence matrix

| Pattern | Exact paths | Independent implementations | Behavior evidence | Keyboard/disabled/loading evidence | Responsive/semantic differences | Classification | Recommended action |
| --- | --- | ---: | --- | --- | --- | --- | --- |
| Page header | `frontend/src/features/dashboard/MainDashboard.tsx`, `frontend/src/features/dashboard/dashboard.css`, `frontend/src/features/resumes/ResumeListPage.tsx`, `frontend/src/features/resumes/resumeWorkspace.css`, `frontend/src/features/interviews/InterviewSessionListPage.tsx`, `frontend/src/features/interviews/interviewCoach.css` | 3 | Same title, supporting copy, optional action, 22px rounded surface, and near-identical spacing/type hierarchy | Headers contain links/buttons with feature button behavior | Action wrapping differs; Learning intentionally uses an internal header within `.workspace-section` | CONSOLIDATE | Create a small page-header layout component/API for title, description, and actions; keep Learning workspace header domain-specific unless it fits without nesting surfaces |
| Workspace header | Resume, Interview, and Learning workspace files listed in section 8 | 3 families | Resource title, status/context, back navigation, and actions | Different save/job/delete states and focus requirements | Substantive domain semantics differ | STANDARDIZE WITHOUT COMPONENT EXTRACTION | Standardize hierarchy, back-link target size, action ordering, and wrapping; do not hide domain status/actions in a generic resource object |
| Primary/secondary buttons | `frontend/src/styles.css`, `frontend/src/features/resumes/resumeWorkspace.css`, `frontend/src/features/interviews/interviewCoach.css`, `frontend/src/features/learning/learningWorkspace.css`, `frontend/src/features/dashboard/dashboard.css` | 5 families | Same primary/secondary purpose but heights, colors, disabled opacity/cursor, and wrapping differ | Disabled cursor alternates between `wait` and `not-allowed`; loading copy is feature-owned | Destructive and toolbar actions need variants; domain editor controls are denser by design | STANDARDIZE WITHOUT COMPONENT EXTRACTION | Establish one shared class/API contract and variants; keep editor-toolbar controls separate |
| Form field | Auth pages, `ResumeListPage.tsx`, `ResumeWorkspace.tsx`, `InterviewSessionListPage.tsx`, `InterviewSessionWorkspace.tsx`, `LearningDashboard.tsx`, `QuizTaker.tsx` and feature CSS files | 5 families | Labels exist broadly, but error association, required communication, help text, sizing, and validation focus differ | Interview creation focuses an error summary; Auth retains focus on submit; loading/disabled behavior varies | File, radio, checkbox, long-answer, and editor fields have legitimate semantic differences | STANDARDIZE WITHOUT COMPONENT EXTRACTION | First standardize field shell, label/help/error contract, `aria-describedby`, required communication, and disabled state; extract only after two consumers fit the API |
| Resume modal dialog | `frontend/src/features/resumes/ResumeWorkspace.tsx`, `frontend/src/features/resumes/AiRecommendations.tsx` | 2 | Custom `role="dialog"` overlays with substantially duplicated focusable-element discovery, wraparound, Escape, and focus restoration | Both implement manual trap/restoration; tests cover keyboard paths | Copy and destructive/application actions differ intentionally | CONSOLIDATE | Use one small dialog shell with title/description IDs, initial-focus target, Escape, trap, and return-focus contract; preserve action content |
| Learning deletion dialog | `frontend/src/features/learning/LearningDocumentDeletion.tsx` | 1 | Native modal dialog with typed-title confirmation | Runtime confirmed input initial focus, Shift+Tab containment, Escape, and focus return; focused tests exist | Destructive domain workflow and confirmation phrase are specific | KEEP DOMAIN-SPECIFIC | Preserve deletion orchestration and copy; consider its native-dialog behavior as the canonical dialog foundation only after operator approval |
| Loading/empty/error surface | `frontend/src/routing/RouteErrorPage.tsx`, Dashboard, Resume, Interview, and Learning page/workspace files and CSS | More than 12 | Same status-surface purpose with repeated panel, heading/copy, request ID, and retry/back action markup | `role=status`/`role=alert` usage and retry states differ | Copy, safe 404, and remediation are domain-specific | CONSOLIDATE | Share only presentation/semantics slots; preserve domain copy, request-ID rules, safe ownership semantics, and actions |
| Pagination | `ActivityFeed.tsx`, `ResumeListPage.tsx`, `ResumeWorkspace.tsx`, `InterviewSessionListPage.tsx`, `InterviewSessionWorkspace.tsx`, `LearningDashboard.tsx`, `LearningConversationWorkspace.tsx`, `LearningDocumentWorkspace.tsx`, `DocumentFlashcards.tsx`, `DocumentQuizzes.tsx`, `LearningQuizWorkspace.tsx` | More than 9 | Previous, page label, next pattern repeats with different markup and CSS | Native disabled buttons; relevant feature tests cover paging | Some use `nav` landmarks, others `div`; labels and server-side paging are domain-specific | CONSOLIDATE | Shared presentational pager with required accessible label, page description, disabled state, and wrap behavior; callers retain data/loading |
| Flashcard/Quiz job status | `frontend/src/features/learning/DocumentFlashcards.tsx`, `frontend/src/features/learning/DocumentQuizzes.tsx` | 2 | Near-identical queued/running/failed/ready presentation, progress copy, refresh/retry, and request-ID handling | Polling/loading owned by each feature; controls share semantics | Resource nouns and terminal actions differ | CONSOLIDATE | Extract a Learning job-status presentation component; leave API, polling, and response parsing in each domain module |
| Cross-domain job progress | `ResumeListPage.tsx`, `ResumeWorkspace.tsx`, `InterviewSessionWorkspace.tsx`, Learning job-status files | 4 families | Percent/progress/status needs overlap | Interview uses native `progress`; Resume uses text percentage; Learning uses state cards | Different job lifecycles and recovery actions | STANDARDIZE WITHOUT COMPONENT EXTRACTION | Define status/progress semantics and visual hierarchy first; do not create one job engine UI |
| Status chip | Dashboard, Resume, Interview, and Learning feature CSS/components | 4 families | Repeated pill shape and text status | Not interactive; status text prevents color-only meaning | State vocabulary and risk meaning differ | STANDARDIZE WITHOUT COMPONENT EXTRACTION | Share base chip geometry and semantic variants only after a state-to-meaning map; keep domain mapping local |
| Toast/notification | Inline notices in Resume, Interview, and Learning | 3 families; 0 toast systems | Feedback is inline and contextual; no toast provider exists | Existing live/alert behavior varies by context | Persistent job/error feedback should not disappear | DEFER | Do not add a toast provider without an approved notification-lifetime/use-case decision |
| Cards/panels | Dashboard widgets, Resume cards, Interview sessions/questions, Learning documents/study/review cards | Many | Surface, border, radius, and shadow recur | Mostly static containers | Content density, heading semantics, selection, and actions differ | REJECT ABSTRACTION | Standardize only shared tokens; generic `Card` would hide domain structure without reducing behavior |
| Tabs | `LearningDocumentWorkspace.tsx` and `learningWorkspace.css` | 1 active tab system | Roving `tabIndex`, selected panel, ArrowLeft/ArrowRight wrap | Runtime and tests confirm arrow navigation | Document sections are a domain workspace | KEEP DOMAIN-SPECIFIC | Preserve as canonical behavioral reference; do not extract until another genuine tab system exists |
| Safe not found | `RouteErrorPage.tsx`, Resume, Interview, and Learning workspace pages | Multiple | Safe resource absence with return action and optional request ID | Non-interactive status plus link | Ownership-safe wording and route targets differ | STANDARDIZE WITHOUT COMPONENT EXTRACTION | Standardize surface and heading order; preserve safe wording and feature return destination |

## 10. Canonical-pattern recommendations

| Category | Recommended canonical starting point | Reason and path evidence |
| --- | --- | --- |
| Page header | Dashboard/Resume/Interview shared shape, minimally revised | The three implementations are structurally equivalent in their TSX and CSS files listed in section 9 |
| Workspace header | Learning hierarchy plus feature-owned actions | `LearningDocumentWorkspace.tsx` keeps title, status, tabs, and actions distinct without forcing a generic resource model |
| Primary action | Global `.primary-button` contract | `frontend/src/styles.css` is already application-wide; revise its target size/loading rules and migrate compatible feature actions |
| Secondary action | Global `.secondary-button` contract | Same foundation and migration strategy as primary |
| Destructive action | Learning deletion action semantics with a dedicated destructive visual variant | `LearningDocumentDeletion.tsx` provides explicit confirmation, disabled gating, and focus behavior |
| Form field | Interview create-session validation contract plus global field styling | `InterviewSessionListPage.tsx` has the strongest summary focus, label, required, and field-error behavior; `frontend/src/styles.css` supplies the base look |
| Validation message | Associated field error plus focusable summary for multi-field submissions | Proven in `InterviewSessionListPage.tsx`; Auth associated field messages remain useful but need focus handling |
| Status chip | Existing pill geometry with an approved semantic variant map | Geometry repeats across feature CSS; meanings must stay in feature code |
| Loading state | Shared state-surface presentation with `role="status"` where updates are live | Existing state families in each feature prove the common shell; copy remains local |
| Empty state | Shared state-surface slots for heading, explanation, and action | Same evidence as loading; Dashboard’s domain-specific metrics remain outside |
| Error state | Shared alert surface that preserves request IDs and retry/back actions | `RouteErrorPage.tsx` and feature errors repeat the contract |
| Safe not found | `RouteErrorPage.tsx` visual/semantic shell with feature wording | Rendered Learning 404 safely exposed only “Document not found,” request ID, and return action |
| Pagination | New minimal presentational pager derived from Learning `nav` semantics | Learning consistently uses labelled navigation; other domains can supply labels/page data |
| Job progress | Native `progress` where determinate; Learning status card for lifecycle/recovery | `InterviewSessionWorkspace.tsx` and Learning job components provide complementary proven patterns |
| Dialog | Native Learning dialog behavior, subject to operator approval | Runtime confirmed initial focus, containment, Escape, and return in `LearningDocumentDeletion.tsx` |
| Toast/notification | No canonical toast in Phase 13 without a decision | No existing toast implementation or proven ephemeral-feedback requirement |
| Card | No shared component; shared surface tokens only | Domain cards have different semantics and action density |
| Metadata row | `dl`/term-value semantics used in resource workspaces | Preserve semantic grouping; standardize spacing only |
| Tabs | Learning document workspace | `LearningDocumentWorkspace.tsx` has tested roving focus and arrow behavior |
| Back navigation | Semantic link with a 44px minimum target and feature-specific destination | Current links are semantically correct but often render at 17–40px high |
| Mobile navigation | Existing `AppShell.tsx` menu model | Escape and focus return are implemented and tested; target sizing and layout can be repaired locally |
| Focus style | Global `:focus-visible` rule | `frontend/src/styles.css` already supplies a visible 3px application-wide outline |

## 11. Forms audit

Strengths:

- Login and registration fields are visibly labelled in
  `frontend/src/features/auth/LoginPage.tsx` and
  `frontend/src/features/auth/RegisterPage.tsx`.
- Auth field errors are connected with `aria-describedby` and `aria-invalid`
  after validation.
- Interview creation in
  `frontend/src/features/interviews/InterviewSessionListPage.tsx` has the
  strongest pattern: required communication, field-level errors, and a
  focusable error summary that receives focus after invalid submission.
- Quiz choices in `frontend/src/features/learning/QuizTaker.tsx` use
  `fieldset`, `legend`, labelled radios, and a stable group name.
- Resume suggestion checkboxes in
  `frontend/src/features/resumes/AiRecommendations.tsx` are labelled native
  controls.

Findings:

- Auth inputs do not expose native `required`; empty submission associates
  errors but leaves focus on the submit button. This is an Important consistency
  and recovery issue, not an absent-label issue.
- Resume create errors are only partially associated; import and Learning
  upload errors are generally shared messages without field
  `aria-describedby`. Paths:
  `frontend/src/features/resumes/ResumeListPage.tsx` and
  `frontend/src/features/learning/LearningDashboard.tsx`.
- Help, error, and required text ordering varies across domains.
- Field/control heights range from 40px to 48px. Text inputs at 40px are
  usable but below the recommended 44px target.
- File inputs must remain native and domain-specific; a generic text-field
  wrapper must not obscure file-name, type, or upload-state behavior.
- Radio and checkbox hit regions should be measured by their labels, not only
  the 13–18px native glyph measured by the automated geometry scan.

## 12. Buttons and action-hierarchy audit

- Primary, secondary, destructive, text-link, toolbar, pagination, and
  icon/movement controls exist.
- The visual hierarchy is understandable within each feature but inconsistent
  across features because
  `frontend/src/styles.css`,
  `frontend/src/features/resumes/resumeWorkspace.css`,
  `frontend/src/features/interviews/interviewCoach.css`,
  `frontend/src/features/learning/learningWorkspace.css`, and
  `frontend/src/features/dashboard/dashboard.css` define parallel families.
- Disabled opacity, cursor, height, and loading copy are inconsistent.
- The Resume workspace’s “Discard draft changes” button is not included in the
  main Resume button selector and rendered 25px high at every audited width.
  The adjacent Save action rendered 42px high. Relevant paths:
  `frontend/src/features/resumes/ResumeWorkspace.tsx` and
  `frontend/src/features/resumes/resumeWorkspace.css`.
- Global navigation and many back links render at 40px high. Auth secondary
  links render about 17–18px high. These are Important touch-target findings.
- Editor toolbar controls may remain denser when their entire clickable area is
  still adequate; they should not inherit a large call-to-action layout.

## 13. Dialog and confirmation audit

- Resume uses two custom dialogs in
  `frontend/src/features/resumes/ResumeWorkspace.tsx` and
  `frontend/src/features/resumes/AiRecommendations.tsx`. Both reproduce
  focusable-element lookup, Tab wrap, Escape dismissal, and focus restoration.
  This is genuine behavioral duplication.
- Runtime confirmed the unsaved-change dialog opens on “Keep editing,” wraps
  Shift+Tab to “Leave without saving,” closes on Escape, and returns focus to
  the initiating Dashboard link.
- Learning document deletion in
  `frontend/src/features/learning/LearningDocumentDeletion.tsx` uses native
  `<dialog>`, an accessible name, typed-title confirmation, initial text-input
  focus, disabled destructive action until confirmation, Escape cancellation,
  containment, and focus return. At 390px it remained contained at 337px wide
  and did not overflow.
- The native Learning dialog is the strongest existing behavior, but replacing
  custom dialogs is an operator decision because native-dialog styling,
  browser support assumptions, and test changes must be accepted explicitly.

## 14. Loading, empty, error and not-found audit

- Every major route has a user-visible loading, empty, and error strategy.
- Safe not-found states do not disclose cross-user resource existence. The
  rendered Learning safe 404 showed only a generic title, safe message, request
  ID, and return action.
- State surfaces are reimplemented in
  `frontend/src/routing/RouteErrorPage.tsx` and each feature family.
- State copy and remediation are correctly domain-specific and must remain so.
- `role="status"` and `role="alert"` usage is inconsistent. Static content
  should not become an assertive live region merely for visual standardization.
- Consolidation should expose slots for heading, body, request ID, and action,
  with a deliberate semantic mode.

## 15. Toast and notification audit

No toast, snackbar, or provider implementation exists. Resume, Interview, and
Learning feedback is inline, using local notices, status regions, response
states, or alerts. Relevant paths include:

- `frontend/src/features/resumes/ResumeWorkspace.tsx`;
- `frontend/src/features/interviews/InterviewSessionWorkspace.tsx`;
- `frontend/src/features/learning/LearningConversationWorkspace.tsx`;
- `frontend/src/features/learning/DocumentFlashcards.tsx`;
- `frontend/src/features/learning/DocumentQuizzes.tsx`.

Inline feedback is often preferable for validation, long-running work, and
recoverable errors because it remains next to the affected task. There is
insufficient evidence to introduce a toast provider. The decision should be
deferred until specific ephemeral cross-route feedback is identified.

## 16. Pagination audit

Pagination is the clearest cross-domain component candidate. More than nine
independent renderings share previous/page/next behavior. The inconsistency is
primarily presentational and semantic:

- Dashboard uses a labelled activity-navigation structure in
  `frontend/src/features/dashboard/ActivityFeed.tsx`.
- Resume and Interview use both `div` and list/workspace-local pagination.
- Learning generally uses labelled `nav` landmarks.
- Control heights range from 40px to 44px.
- Disabled-state behavior and page label wording differ.

Feature tests already cover paging, which lowers regression risk if the caller
continues to own query state, cancellation, loading, and results. Browser
keypress synthesis did not activate native pagination buttons even though
mouse activation worked and the source uses native buttons; this is recorded
as a driver limitation, not a confirmed application defect.

## 17. Job-progress audit

- Interview uses native determinate `<progress>` in
  `frontend/src/features/interviews/InterviewSessionWorkspace.tsx`.
- Resume import and analysis use textual percentages in
  `frontend/src/features/resumes/ResumeListPage.tsx` and
  `frontend/src/features/resumes/ResumeWorkspace.tsx`.
- Flashcard and Quiz generation use near-identical lifecycle presentation in
  `frontend/src/features/learning/DocumentFlashcards.tsx` and
  `frontend/src/features/learning/DocumentQuizzes.tsx`.
- Grounded conversation response status in
  `frontend/src/features/learning/LearningConversationWorkspace.tsx` has
  distinct source/reconciliation behavior and should not be forced into the
  same component.
- Document deletion progress in
  `frontend/src/features/learning/LearningDocumentDeletion.tsx` is destructive
  and intentionally specialized.

The safe consolidation boundary is presentation of status, progress,
explanation, request ID, and recovery actions. Polling, cancellation, private
response validation, and terminal reconciliation remain domain code.

## 18. Navigation audit

- `frontend/src/AppShell.tsx` provides one semantic shell with a skip link,
  header, primary navigation, mobile navigation, main landmark, and logout.
- Active-route presentation is consistent.
- Runtime confirmed the mobile menu opens without overflow at 390px, closes on
  Escape, and restores focus to the Menu button.
- Source and focused tests confirm the mobile menu’s Escape behavior and focus
  return.
- The desktop-to-mobile transition at 980px is a shell-specific breakpoint and
  should remain canonical unless visual evidence supports change.
- Learning tabs in
  `frontend/src/features/learning/LearningDocumentWorkspace.tsx` have correct
  tab roles, selected state, roving `tabIndex`, and ArrowLeft/ArrowRight wrap.
- Back links are semantically links, but several render below 44px high.
- Breadcrumbs are not a repeated application pattern. Back links are adequate
  for the current depth; introducing breadcrumbs is rejected.

## 19. Accessibility audit

### Critical

No Critical issue was confirmed.

### Important

- Sub-44px interactive targets, especially Resume discard, auth secondary
  links, global/back navigation, and some pagination/form controls.
- Inconsistent multi-field validation focus and required-field communication
  in Auth, Resume, and Learning forms.
- The 320px non-Learning overflow can force horizontal navigation and impairs
  reflow.
- Dialog behavior is correct but duplicated, creating regression risk when one
  implementation changes.

### Minor

- State-region semantics and disabled-state messaging are inconsistent.
- Status-chip colors and spacing vary, although text prevents color-only
  meaning in inspected states.
- Page/workspace header hierarchy is visually coherent but not uniformly
  structured.

### Confirmed strengths

- One `main` landmark and a functional skip link in `AppShell.tsx`.
- Visible global `:focus-visible` outline in `frontend/src/styles.css`.
- Global and feature reduced-motion rules.
- Semantic buttons and links rather than clickable generic containers.
- Labelled form controls across active routes.
- `fieldset`/`legend` radio grouping in `QuizTaker.tsx`.
- Native dialog and tested focus behavior in Learning deletion.
- Non-color status text.
- Lists and definition-list-style metadata instead of layout tables.

No active data table was present, so table-header behavior was not applicable.

## 20. Keyboard and focus audit

Confirmed in the rendered session:

- skip/global navigation elements are in the document tab sequence;
- mobile navigation opens with a button, closes with Escape, and returns focus;
- Learning tabs respond to ArrowRight and ArrowLeft and retain selected focus;
- Resume unsaved-change dialog has initial focus, reverse wrap, Escape, and
  focus return;
- Learning deletion dialog has initial input focus, containment, Escape, and
  focus return;
- Interview invalid create-session submission focuses its error summary;
- quiz options are native radios inside labelled groups;
- quiz submission remains disabled until all answers are selected.

Static source and focused tests additionally support Enter/Space activation,
pagination buttons, radio behavior, and dialog focus behavior.

Limitations:

- The browser driver’s synthetic `Space`/`Enter` press did not activate some
  native buttons even when mouse activation worked; the same behavior affected
  pagination and flashcard reveal. Because native-button source and tests exist,
  this is not classified as an application defect.
- Full Tab and Shift+Tab traversal of every control was bounded rather than
  exhaustive.
- Real assistive-technology output was not tested.
- Native 200% browser zoom could not be changed observably by the driver.

No keyboard trap was confirmed.

## 21. Responsive audit

| Affected route | Viewport | Component/selector | Severity | Likely bounded repair | Regression risk |
| --- | ---: | --- | --- | --- | --- |
| Dashboard, Resume, Interview authenticated routes | 320px | global `html`/`body` minimum width in `frontend/src/styles.css` | Important | Remove or scope the 320px minimum-width behavior and test shell/content at a 305px layout viewport | Medium: global shell and auth routes |
| Learning routes | 320px | `html:has(...)` override in `frontend/src/features/learning/learningWorkspace.css` | Preserve evidence | Promote the successful no-min-width behavior only after global route checks | Medium |
| Resume workspace | all widths | `.resume-workspace-actions button` coverage in `resumeWorkspace.css` | Important | Include discard in a shared secondary/destructive action rule with 44px minimum | Low |
| App shell and resource workspaces | all widths | nav and back-link rules in `styles.css` and feature CSS | Important | Set minimum block-size/inline padding while preserving wrapping | Medium |
| Auth | 390px and below | public secondary links in `styles.css` | Important | Increase clickable area without changing typography | Low |
| Dashboard pagination | 320–1440px | `dashboard.css` activity pager | Minor | Use canonical pager target size and wrapping | Low |
| Resume/Interview forms | narrow widths | feature form grids | Preserve/Minor | Existing column collapse works; retain feature breakpoints unless a reproduced collision exists | Medium |
| Learning document dialog | 390px | deletion dialog CSS | Preserve | No change required; contained at 337px without horizontal overflow | Low |

No clipped title, overlapping action, inaccessible fixed-width panel, or
dialog overflow was confirmed at the five audited widths. Long resource titles
wrapped successfully. Learning study, quiz, conversation, and attempt pages
remained within the viewport at 320px.

## 22. Browser findings by viewport

| Viewport | Confirmed findings |
| ---: | --- |
| 1440px | Stable wide layouts; page-header and button-family differences are most visually apparent; no horizontal overflow |
| 1024px | Desktop navigation remains visible; no action overlap or horizontal overflow |
| 768px | Mobile navigation mode is active; forms and workspace actions wrap/collapse without clipping |
| 390px | Mobile navigation and resource actions remain usable; deletion dialog is contained; title wrapping is successful |
| 320px | Learning and Auth routes reflow without overflow; Dashboard, Resume, and Interview routes reproduce global 320px overflow because the scrollbar leaves a 305px layout viewport while the document retains 320px minimum width |
| Native 200% zoom | Driver command produced no observable zoom change; requires human verification |

## 23. Findings by severity

### Critical

- None confirmed.

### Important

1. Reproducible 320px overflow on non-Learning authenticated routes:
   `frontend/src/styles.css` and the Learning-only override in
   `frontend/src/features/learning/learningWorkspace.css`.
2. Resume discard action renders 25px high:
   `frontend/src/features/resumes/ResumeWorkspace.tsx` and
   `frontend/src/features/resumes/resumeWorkspace.css`.
3. Multiple interactive target families render below 44px:
   `frontend/src/styles.css` plus all four feature stylesheets.
4. Auth, Resume, and Learning validation recovery/required communication is
   weaker than the Interview create-session pattern.
5. Manual dialog mechanics are duplicated in two Resume implementations.

### Minor

1. Disabled cursor/opacity and loading copy are inconsistent.
2. Page and workspace headers have small spacing/radius differences.
3. State-region semantics and request-ID layout vary.
4. Status-chip geometry and colors vary by domain.
5. Pager markup and landmark semantics vary.
6. Back-navigation and metadata spacing vary.

### Consistency improvements

- Explicit focus-ring and control-height tokens.
- Common error-state surface.
- Common labelled pager.
- Common state presentation slots.
- Shared page-header layout.

## 24. Patterns to preserve unchanged

- Authentication tokens in memory and refresh behavior in
  `frontend/src/features/auth/AuthProvider.tsx` and
  `frontend/src/api/apiClient.ts`.
- App shell landmarks, skip link, active-route logic, and mobile Escape/focus
  return in `frontend/src/AppShell.tsx`.
- Interview validation summary behavior in
  `frontend/src/features/interviews/InterviewSessionListPage.tsx`.
- Learning tab keyboard behavior in
  `frontend/src/features/learning/LearningDocumentWorkspace.tsx`.
- Quiz `fieldset`/`legend` radio semantics in
  `frontend/src/features/learning/QuizTaker.tsx`.
- Learning deletion ownership-safe orchestration, confirmation copy, and focus
  behavior in `frontend/src/features/learning/LearningDocumentDeletion.tsx`.
- Safe owned-404 wording and request-ID preservation.
- Domain-specific status vocabulary, polling, retry, and recovery rules.
- Responsive form-grid collapse that showed no reproduced overlap.
- Existing visual identity, typography, and color character unless a later
  decision explicitly authorizes a change.

## 25. Rejected abstractions

- A generic application `Card` component: repeated surface styling does not
  imply common semantics.
- A generic `Workspace<T>` component: Resume, Interview, Learning document,
  conversation, flashcard, and quiz workspaces expose different state machines
  and actions.
- One cross-domain `JobEngine` component: lifecycle and recovery rules differ.
- Generic form generation from schemas: it would hide domain labels, grouping,
  help, validation, and file/radio behavior.
- A universal status enum/component: domain status meaning is not interchangeable.
- Breadcrumbs: current route depth and back links do not demonstrate need.
- A toast provider without a proven ephemeral-notification use case.
- Extraction of unused `DocumentChat.tsx` or `DocumentViewer.tsx` as canonical.
- Mass replacement of colors, spacing, radii, or breakpoints.
- A second design system or third-party component library.

## 26. Approved operator decisions

The operator approved D13-01 through D13-12 with
`PHASE_13A_SHARED_DESIGN_AUDIT_APPROVED`. The decisions are recorded once as
the controlling Phase 13 direction in
`docs/planning/PHASE_13_IMPLEMENTATION_PLAN.md`. This approval accepts the
audit evidence and six-pass structure but does not activate or authorize an
implementation pass.

## 27. Audit limitations

- The browser session used synthetic data and did not call a real AI provider.
- Running/queued/failed job visuals were inspected statically and through
  existing focused tests; the synthetic runtime primarily exercised ready,
  empty, populated, validation, safe-not-found, and deletion-dialog states.
- Browser automation does not replace screen-reader or human visual QA.
- Native 200% browser zoom was not observable through the driver.
- Some native-button keypress synthesis was unreliable; mouse behavior, source
  semantics, and focused tests were used to avoid a false defect claim.
- Color contrast was reviewed from CSS and rendered appearance but not measured
  with a dedicated contrast analyzer.
- Complete automated suites were intentionally not run in this audit-only pass.
- No production-like personal documents, accounts, or records were used.

## 28. Final audit verdict

Phase 13 implementation is justified, but only as measured hardening. The
frontend does not need a redesign or a new design system. It needs a small
shared presentation layer for genuinely repeated interaction contracts,
consistent use of existing global foundations, and local repairs where the
problem is not duplicated.

The evidence supports six inactive implementation passes:

1. shared foundations and approved tokens;
2. forms, buttons, and action hierarchy;
3. state presentation, pagination, and job status;
4. dialogs, focus, and navigation;
5. responsive and touch-target hardening;
6. integrated accessibility and visual QA.

The operator approved this audit with
`PHASE_13A_SHARED_DESIGN_AUDIT_APPROVED`. No implementation pass is activated
by that approval. Phase 13B remains planned and inactive pending a separate
activation and implementation prompt.
