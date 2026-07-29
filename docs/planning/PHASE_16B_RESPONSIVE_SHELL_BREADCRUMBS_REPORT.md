# Phase 16B Responsive Shell and Breadcrumbs Report

## Status

- Phase: 16B — Responsive Sidebar, AppShell and Breadcrumbs
- Parent phase: Phase 16 — Academic MVP Feature Completion, Responsive
  Application Shell, Accessibility and Performance Review
- Baseline branch: `phase-12-unified-frontend`
- Baseline HEAD: `39dd6d57fc94807efd4f56382844294e0f855091`
- Baseline subject: `Define Phase 16 academic MVP architecture`
- Result: `COMPLETED / APPROVED`
- Required visual approval token:
  `PHASE_16B_SIDEBAR_BREADCRUMBS_VISUAL_APPROVED`
- Approval token accepted: yes

## Skill availability

All eleven exact required skills were available and applied:

- `using-superpowers`
- `karpathy-guidelines`
- `define-goal`
- `frontend-design`
- `frontend-skill`
- `test-driven-development`
- `systematic-debugging`
- `playwright`
- `technical-writing`
- `verification-before-completion`
- `finishing-a-development-branch`

`build-web-apps:react-best-practices` was unavailable under that exact name.
The approved equivalent, `vercel-react-best-practices`, was available and
applied. The repository-required `brainstorming` and
`modern-web-guidance` skills were also available and loaded. The
`modern-web-guidance` external `npx ...@latest` lookup was not run because
this phase prohibits download-capable `npx` commands and dependency changes.
No skill was installed.

## Assumptions and bounded decisions

- The accepted DEC-012 architecture and the controlling Phase 16 plan were
  treated as the approved design gate.
- The existing 980 px responsive boundary was preserved. The 1024 px
  acceptance viewport keeps the sidebar, while 768 px and narrower
  acceptance viewports use the drawer.
- The optional collapsed rail was omitted because it would add state,
  identification, and zoom behavior without being mandatory.
- Recognized query intent removal preserves unrelated query parameters.
- Existing back links remain useful secondary route discovery and were not
  removed.
- Where browser tooling could not directly set a UI-level zoom preference, a
  512×384 CSS viewport represented 200% zoom of a 1024×768 viewport.

## Exact changed-file manifest

Production:

1. `frontend/src/AppShell.tsx`
2. `frontend/src/components/Breadcrumbs.tsx` (created)
3. `frontend/src/styles.css`
4. `frontend/src/features/resumes/ResumeListPage.tsx`
5. `frontend/src/features/resumes/ResumeWorkspace.tsx`
6. `frontend/src/features/interviews/InterviewSessionListPage.tsx`
7. `frontend/src/features/interviews/InterviewSessionWorkspace.tsx`
8. `frontend/src/features/learning/LearningDashboard.tsx`
9. `frontend/src/features/learning/LearningDocumentWorkspace.tsx`
10. `frontend/src/features/learning/LearningConversationWorkspace.tsx`
11. `frontend/src/features/learning/LearningFlashcardWorkspace.tsx`
12. `frontend/src/features/learning/LearningQuizWorkspace.tsx`
13. `frontend/src/features/learning/LearningQuizAttemptWorkspace.tsx`

Tests:

14. `frontend/src/components/Breadcrumbs.test.tsx` (created)
15. `frontend/src/routing/router.test.tsx`
16. `frontend/src/features/resumes/ResumeListPage.test.tsx`
17. `frontend/src/features/resumes/ResumeWorkspace.test.tsx`
18. `frontend/src/features/interviews/InterviewSessionListPage.test.tsx`
19. `frontend/src/features/interviews/InterviewSessionWorkspace.test.tsx`
20. `frontend/src/features/learning/LearningDashboard.test.tsx`
21. `frontend/src/features/learning/LearningDocumentWorkspace.test.tsx`
22. `frontend/src/features/learning/LearningConversationWorkspace.test.tsx`
23. `frontend/src/features/learning/LearningFlashcardWorkspace.test.tsx`
24. `frontend/src/features/learning/LearningQuizWorkspace.test.tsx`
25. `frontend/src/features/learning/LearningQuizAttemptWorkspace.test.tsx`
26. `tests/browser/specs/dashboard.spec.cjs`
27. `tests/browser/specs/resume.spec.cjs`
28. `tests/browser/specs/interview.spec.cjs`
29. `tests/browser/specs/learning.spec.cjs`

Governance:

30. `docs/planning/CURRENT_PHASE.md`
31. `docs/planning/CAREER_LEARNING_HUB_MASTER_PLAN.md`
32. `docs/planning/PHASE_16B_RESPONSIVE_SHELL_BREADCRUMBS_REPORT.md`
    (created)

## Implemented scope

The existing protected `AppShell` was enhanced in place. It retains one route
tree, one shared navigation source, the existing authentication boundary, and
the existing account and logout behavior.

- Wide layouts use an expanded 256 px sidebar with the product identity,
  Create disclosure, primary navigation, account identity, and logout.
- Layouts at 980 px and below use the existing accessible native `Dialog`
  foundation as a modal navigation drawer.
- The drawer provides initial focus, focus containment, Escape and backdrop
  dismissal, and focus return to the menu invoker.
- Navigation items use decorative inline SVG icons and retain a 44 px minimum
  interactive target.
- The optional collapsed desktop rail was intentionally omitted. No shell
  preference is written to browser storage.
- Existing deep-route back links were preserved.

## Create intents

The shared Create disclosure uses these exact routes:

- `/resumes?action=create`
- `/interviews?action=create`
- `/learning?action=upload`

Each owning list page recognizes only its own approved intent. It removes the
recognized `action` parameter with replace navigation, focuses the existing
creation field, and performs no automatic API request. The Learning intent
also opens the existing inline upload form. Unknown action values remain inert
and are not silently interpreted.

## Breadcrumb architecture

`frontend/src/components/Breadcrumbs.tsx` is a presentation-only component.
It renders a navigation landmark labelled `Breadcrumb`, an ordered list,
linked ancestors, and one current-page label using `aria-current="page"`.

Owning routes supply canonical labels already loaded through their existing
data requests:

- Resume workspace: Resume title
- Interview workspace: session title
- Learning document: document title
- Grounded conversation: canonical document title plus `Conversation`
- Flashcards: canonical document and set titles
- Quiz: canonical document and Quiz titles
- Attempt review: canonical document and Quiz titles plus `Attempt`

Loading and failure states use safe generic labels. Breadcrumbs initiate no
fetches, expose no raw database IDs, and preserve their full accessible text
when CSS visually truncates a long label.

## Verification

Targeted RED tests first demonstrated the missing drawer, create-intent, and
breadcrumb behaviors. The implemented GREEN checks then passed.

- Final focused AppShell and create-intent tests: 96/96 across four files
- Focused Breadcrumb component test: 1/1
- Affected deep-workspace tests: 107/107 after one test query was updated to
  account for the intentional repeated canonical document label
- Complete frontend suite:
  `npm run test --workspace @career-learning-hub/web` — 591/591 tests in
  42 files passed
- Root typecheck: `npm run typecheck` — passed for web, API, and shared types
- Production build: `npm run build` — passed
- Build advisory: the generated JavaScript chunk was 565.30 kB, above Vite's
  500 kB advisory threshold. This remains a Phase 16F measurement candidate;
  no speculative performance repair was made.

Full Application Browser Testing used the existing authorized bundled
Playwright runtime, `tests/browser/playwright.config.cjs`, one worker, zero
retries, and all configured projects.

- First completed run: 20/21 passed. The sole failure was a strict Playwright
  locator matching both the new exact `Resume` create link and the existing
  `Resumes` navigation link.
- Bounded repair: the browser assertion was made exact; no application
  behavior or coverage was changed.
- A later standalone interaction pass reproduced two focus-ordering edge
  cases: backdrop pointer completion could steal returned focus, and drawer
  route cleanup could override destination-form focus. Focused regression
  tests were added, backdrop focus was restored after pointer completion, and
  recognized intent focus was delayed until route/query cleanup settled.
  Blocked-navigation invoker behavior remained covered and unchanged.
- Final post-repair result: 21/21 passed in 43.2 seconds.
- Desktop: 7/7
- Tablet: 7/7
- Mobile: 7/7
- Authentication and session workflows: passed
- Ownership isolation: passed
- Private PDF access: passed
- Quiz answer secrecy: passed
- Console/page-error and horizontal-overflow checks: passed

The first attempted harness startup was blocked before test execution by the
sandbox (`listen EPERM 0.0.0.0`). The same authorized local-only harness ran
after local-port permission was granted.

## Responsive visual QA

Standalone Chrome inspection passed at:

- 1440×900
- 1024×768
- 768×1024
- 390×844
- 320×720
- effective 512×384 CSS viewport representing 200% zoom at 1024×768

Checks covered desktop-sidebar persistence, the compact header and drawer,
drawer containment within the viewport, Escape dismissal, focus return,
readable reflow, and horizontal overflow. Visual evidence for 1440×900 and
320×720 was attached to the review response before the temporary screenshots
were removed.

## Security, privacy, and cleanup

- Phase 15 controls and P15-001 supervised academic-MVP restrictions remain
  unchanged.
- No backend, shared contract, API, data model, migration, environment,
  dependency, package, lockfile, deployment, or legacy-project file changed.
- No provider call or Atlas connection occurred.
- No real personal data was used.
- The full suite and visual-QA cleanup each reported `users=0, owned=0`.
- Ports 4173 and 8000 are closed.
- Temporary MongoDB data, local private storage, reports, results,
  screenshots, traces, temporary scripts, and generated build output were
  removed.

## Approval closeout

- The operator accepted
  `PHASE_16B_SIDEBAR_BREADCRUMBS_VISUAL_APPROVED`.
- Human review approved 1440×900, 1024×768, 768×1024, 390×844, 320×720,
  and actual 200% browser zoom.
- The approved review covered the sidebar, drawer, Create actions,
  breadcrumbs, focus behavior, account block, logout, long-content handling,
  and horizontal reflow.
- The prior automated verification remains authoritative. No additional
  implementation change was required during this closeout.
- The optional collapsed desktop rail remains intentionally omitted.
- The 565.30 kB JavaScript chunk advisory remains a Phase 16F measurement
  candidate.
- No backend, shared-contract, dependency, or deployment boundary expanded.
- The closeout commit had not yet been created while this documentation was
  edited. Push remains prohibited and has not occurred.
- Phase 16C remains inactive and requires a separate activation prompt.

## Governance and review gate

- Phase 15: `COMPLETED` /
  `APPROVED WITH ACCEPTED LIMITATIONS AND FORMAL DEFERRAL`
- Phase 16: `ACTIVE`
- Phase 16A-1: `COMPLETED` / `APPROVED`
- Phase 16A-2: `COMPLETED` / `APPROVED`
- Phase 16B: `COMPLETED` / `APPROVED`
- Phase 16C through Phase 16G: `PLANNED` / `INACTIVE`
- Phase 17: `PLANNED` / `INACTIVE`

The operator supplied and accepted
`PHASE_16B_SIDEBAR_BREADCRUMBS_VISUAL_APPROVED`. Phase 16C is not activated.

## Known limitations

- The optional collapsed desktop rail is not implemented.
- Automated 200% evidence used the effective CSS viewport method described
  above; the operator separately approved actual 200% browser zoom.
- The existing Playwright runner remains a machine-bundled, uncommitted
  runtime path; no portable package script was authorized.
- The 565.30 kB JavaScript chunk advisory remains for Phase 16F measurement.
- Phase 16C through Phase 16G remain intentionally unimplemented.

## Human visual-review evidence

- 1440×900: approved the expanded sidebar, navigation order, active state,
  Create disclosure, content alignment, account/logout block, breadcrumbs,
  and absence of overlap.
- 1024×768: approved the sidebar and main workspace without clipping or
  unusable compression.
- 768×1024: approved the compact header, modal drawer, keyboard behavior,
  content width, and breadcrumbs.
- 390×844: approved drawer containment, close/Escape/backdrop behavior, focus
  return, Create links, breadcrumbs, and no horizontal overflow.
- 320×720: approved narrow reflow, 44 px controls, long-text handling,
  breadcrumb truncation, drawer actions, and no horizontal overflow.
- Actual 200% browser zoom: approved usable drawer behavior, visible focus,
  non-overlapping text and controls, understandable breadcrumbs, and complete
  content reflow.
