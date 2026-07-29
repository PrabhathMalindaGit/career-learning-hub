# Phase 16F accessibility and performance report

## Document control

- Phase: Phase 16F — Accessibility and Performance Review.
- Result: `COMPLETED / APPROVED`.
- Branch: `phase-12-unified-frontend`.
- Baseline and final HEAD: `9a508b2cf06ec0bedbcab2192dd15ff7180ce042`.
- Subject: `Add bounded resume design controls`.
- Date: 2026-07-29.
- Skills applied: `using-superpowers`, `karpathy-guidelines`, `define-goal`,
  `brainstorming`, `frontend-skill`, `frontend-design`,
  `test-driven-development`, `systematic-debugging`, `playwright`,
  `security-best-practices`, `lighthouse-verification`, `technical-writing`,
  `verification-before-completion`, `finishing-a-development-branch`,
  `executing-plans`, `vercel-react-best-practices`, and
  `modern-web-guidance`.
- The requested `build-web-apps:react-best-practices` skill was unavailable;
  the available React performance skill was used without installing anything.
- The requested `frontend-testing-debugging` skill was unavailable. The
  existing `systematic-debugging` and `playwright` skills supplied the bounded
  fallback; no skill was installed or downloaded.
- Exact final eight-path manifest:
  `frontend/src/features/auth/AuthRoute.tsx`, `frontend/src/styles.css`,
  `frontend/src/routing/router.test.tsx`,
  `tests/browser/specs/auth.spec.cjs`,
  `tests/browser/specs/ownership.spec.cjs`,
  `docs/planning/CURRENT_PHASE.md`,
  `docs/planning/CAREER_LEARNING_HUB_MASTER_PLAN.md`, and this report. Only
  the three governance paths received new edits in the deferral prompt. The
  five production and test paths were preserved without further change.
- Actual changed paths: the authorized authentication route, shared CSS,
  router test, authentication and ownership browser specifications, and three
  governance paths. The router candidate was not started.

## Baseline and environment

The starting worktree was clean, with nothing staged or untracked, no active
Git operation, no pre-existing Phase 16F report, and no repository-local
`test-results/` residue. Phase 16F was activated only after the mandated
read-only inspection.

| Item | Value |
| --- | --- |
| Operating system | macOS 26.5.2 (build 25F84) |
| Architecture | arm64 |
| Node.js | v26.5.0 |
| npm | 11.17.0 |
| Browser | Google Chrome 150.0.7871.187 |
| Browser runner | Codex-bundled Playwright 1.61.1 |
| Lighthouse | unavailable in manifests, repository tools, repository `node_modules`, and bundled runtime |
| axe | unavailable; no package was installed |
| Development server mode | isolated MongoMemoryReplSet, Express test backend, and Vite development frontend from the existing browser harness |
| Production server mode | Vite preview of the built frontend with an explicit synthetic HTTPS API origin and intercepted anonymous refresh response |
| Viewports | 1440×900, 1024×768, 768×1024, 390×844, and 320×720 |
| Cache | Chrome network cache disabled through CDP for timing samples |
| Fixture | generated `@example.test` accounts, blank synthetic Resumes, the tracked synthetic PDF, and provider-disabled isolated services |

No `.env` file was read. The first production-preview setup used a build
without an explicit production API URL and correctly failed closed at runtime;
that audit setup was discarded. The build was repeated with the explicit
synthetic URL `https://api.example.test/api/v1`, and the refresh request was
intercepted with a synthetic 401 response. No external request or provider
call was made.

## Production build baseline

`VITE_API_URL=https://api.example.test/api/v1 npm run build` passed. Vite
6.4.3 transformed 102 modules and retained its large-chunk advisory.

| Asset | Exact bytes | Reported size | Gzip |
| --- | ---: | ---: | ---: |
| `dist/index.html` | 542 | 0.54 kB | 0.34 kB |
| `dist/assets/index-CaoOG7gf.css` | 77,133 | 77.13 kB | 14.14 kB |
| `dist/assets/index-q4l6vCYk.js` | 580,801 | 580.80 kB | 160.39 kB |

The initial entry contained one JavaScript request. Its cold transferred size
was 160,687 bytes and decoded size was 580,801 bytes. The historical Phase
16E evidence was 580.80 kB / 160.39 kB gzip JavaScript and 77.13 kB / 14.14
kB gzip CSS; it is recorded separately and is consistent with this fresh
baseline.

## Three-run performance samples

These are machine-local lab measurements, not field claims or Lighthouse
results. FCP was not exposed by the bounded observer. LCP was reproducible.
Long-task blocking evidence is the sum of each long task beyond 50 ms.

### Public `/login`, production preview, cold cache

| Viewport | Run | DOMContentLoaded | Load | LCP | CLS | Blocking | JS transferred | Requests |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1440×900 | 1 | 115.0 ms | 115.1 ms | 188 ms | 0.1500 | 0 ms | 160,687 B | 1 |
| 1440×900 | 2 | 193.6 ms | 193.6 ms | 264 ms | 0.1500 | 0 ms | 160,687 B | 1 |
| 1440×900 | 3 | 84.1 ms | 84.2 ms | 164 ms | 0.1500 | 0 ms | 160,687 B | 1 |
| 1440×900 median | — | 115.0 ms | 115.1 ms | 188 ms | 0.1500 | 0 ms | 160,687 B | 1 |
| 390×844 | 1 | 85.8 ms | 85.9 ms | 156 ms | 0.2400 | 0 ms | 160,687 B | 1 |
| 390×844 | 2 | 84.9 ms | 84.9 ms | 148 ms | 0.2400 | 0 ms | 160,687 B | 1 |
| 390×844 | 3 | 83.7 ms | 83.8 ms | 144 ms | 0.2400 | 0 ms | 160,687 B | 1 |
| 390×844 median | — | 84.9 ms | 84.9 ms | 148 ms | 0.2400 | 0 ms | 160,687 B | 1 |

### Protected `/dashboard`, isolated Vite development harness, cold cache

| Viewport | Run | DOMContentLoaded | Load | LCP | CLS | Blocking | JS transferred | Script requests |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1440×900 | 1 | 92.4 ms | 92.9 ms | 164 ms | 0.5227 | 0 ms | 4,375,240 B | 72 |
| 1440×900 | 2 | 133.2 ms | 133.9 ms | 548 ms | 0.5977 | 0 ms | 4,375,240 B | 72 |
| 1440×900 | 3 | 104.9 ms | 105.5 ms | 200 ms | 0.5977 | 0 ms | 4,375,240 B | 72 |
| 1440×900 median | — | 104.9 ms | 105.5 ms | 200 ms | 0.5977 | 0 ms | 4,375,240 B | 72 |
| 390×844 | 1 | 137.0 ms | 137.7 ms | 220 ms | 0.8056 | 0 ms | 4,375,240 B | 72 |
| 390×844 | 2 | 171.2 ms | 172.1 ms | 260 ms | 0.8056 | 0 ms | 4,375,240 B | 72 |
| 390×844 | 3 | 229.6 ms | 230.3 ms | 344 ms | 0.8056 | 0 ms | 4,375,240 B | 72 |
| 390×844 median | — | 171.2 ms | 172.1 ms | 260 ms | 0.8056 | 0 ms | 4,375,240 B | 72 |

The development-module transfer count is not compared with the production
bundle. Resume- and Learning-workspace timing samples, FCP, and post-change
samples were not collected after the blocking result; continuing to the
router experiment would have violated the prompt's stop rule. Functional
route transitions remained responsive in the five-viewport audit.

## Finding register

| ID | Classification | Category | Route / viewport | Evidence | Impact | Severity | Criterion | Required path | Authorized | Disposition |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P16F-001 | CONFIRMED DEFECT | Performance / layout stability | `/login`, 1440×900 and 390×844; direct protected load also affected | Production CLS was exactly 0.1500 desktop and 0.2400 mobile in all three samples. The diagnostic recorded two pre-interaction body-level shifts while the session bootstrap surface was replaced by the final route. | Users see avoidable movement during initial authentication restoration; the impact is larger on mobile. | MODERATE | CLS above 0.1 is a review finding. | `frontend/src/features/auth/AuthRoute.tsx` and `frontend/src/styles.css`, with focused and browser tests | Yes, in the bounded repair prompt | `REPAIRED / VERIFIED`: CLS was 0.0000 in all six authoritative samples and the recovered complete browser gate passed 27/27. |
| P16F-002 | ACCEPTED EXISTING BEHAVIOR | Performance / bundling | all routes | All 14 page modules remain eagerly imported. The final entry is 580,963 bytes / 160.39 kB gzip with no dynamic chunks. | More code is transferred before the first route than necessary. | ADVISORY | Vite 500 kB advisory and Phase 16F route-loading candidate. | Authorized router paths | Yes, conditional | `ROUTE LAZY LOADING REJECTED / DEFERRED WITH EVIDENCE`; candidate not started. |
| P16F-003 | AUTOMATION LIMITATION | Measurement | all routes | No existing Lighthouse runner was found and installation is prohibited. | Lighthouse category/audit output is unavailable. | ADVISORY | Use only an already available runner. | None | Not applicable | Record non-Lighthouse build and browser evidence truthfully. |
| P16F-004 | HUMAN-REVIEW ITEM | Accessibility / visual | all visible routes | Automated five-viewport checks passed, but actual browser 200% zoom and human visual/keyboard judgment were not performed. | Final visual usability remains unapproved. | ADVISORY | Human approval gate. | None | Not applicable | Pending a future unblocked human review. |

Historical findings: Critical 0, Serious 0, Moderate 1, Minor 0, Advisory 3.
Unresolved findings: Critical 0, Serious 0, Moderate 0, Minor 0, Advisory 3.
No confirmed accessibility defect was found. P16F-001 was the actionable
performance defect and is now `REPAIRED / VERIFIED`; P16F-002 is formally
deferred with evidence.

### Historical smallest proposed follow-up repair manifest

1. `frontend/src/features/auth/AuthRoute.tsx`
2. `frontend/src/styles.css`
3. `frontend/src/routing/router.test.tsx`
4. `tests/browser/specs/auth.spec.cjs`
5. `docs/planning/CURRENT_PHASE.md`
6. `docs/planning/CAREER_LEARNING_HUB_MASTER_PLAN.md`
7. `docs/planning/PHASE_16F_ACCESSIBILITY_PERFORMANCE_REPORT.md`

This was the original blocked-audit proposal. The separately authorized repair
subsequently satisfied its CLS contract. The later P16F-002 deferral section
controls the router decision.

## Accessibility audit

The temporary browser audit passed 5/5 at 1440×900, 1024×768, 768×1024,
390×844, and 320×720. It inspected `/login`, `/dashboard`, `/resumes`, a
created Resume workspace, `/interviews`, `/learning`, `/settings`, and an
unknown route. Every audited page had one `main`, one `h1`, no duplicate IDs,
no visibly unnamed control, no skipped heading level, no image without `alt`,
and no horizontal overflow.

- Landmarks and headings: passed the automated structural checks; source
  inspection confirmed labelled navigation, breadcrumb, region, dialog, and
  complementary landmarks.
- Skip link: first keyboard focus, visible outline, activation, and focus on
  `main` passed.
- Sidebar and active route: canonical links and active `NavLink` behavior are
  covered by the router and browser tests.
- Mobile drawer: native dialog semantics, initial focus, containment, Escape,
  exact invoker focus return, and close-after-navigation are covered; the
  five-viewport audit rechecked Escape and return below 980 px.
- Breadcrumbs: ordered list, safe loaded labels, one current-page marker, and
  raw-ID omission are covered by source and tests.
- Forms, errors, and statuses: native labels, required attributes,
  `aria-describedby`, focused validation summaries, explicit alerts/statuses,
  request IDs, and busy states were inspected and covered by tests.
- Reduced motion: the existing CSS reduces all transition duration and
  disables smooth scrolling without removing function.
- Contrast: all Slate, Forest, and Navy registry roles pass their programmed
  4.5:1 text / 3:1 non-text thresholds. Global contrast and grayscale print
  remain human-review items; no failure was observed.
- Resume print controls: labelled A4/Letter selection, saved-version identity,
  dirty-draft explanation, safe disabled state, and truthful browser-print
  wording passed focused tests.
- Resume design controls: labelled native selects, bounded values, fallback
  behavior, explicit saving, statuses, and palette contrast passed focused
  tests.
- AI comparison: semantic `del`/`ins`, visible Removed/Added text, reading
  order, explicit checkboxes, verification warning, and markup-as-text passed
  focused tests.
- Quiz secrecy, ownership-safe states, and print media were inspected in
  source and existing browser coverage. The complete browser suite was not
  rerun after the stop condition.
- Represented 200% reflow was not claimed. Actual 200% zoom remains pending.

## Performance architecture audit

- Router: `createBrowserRouter` with static imports for every public and
  protected page. Public-only and protected `AuthRoute` wrappers are eager;
  `AppShell`, `RouteErrorPage`, and authentication foundations are eager.
- Route loading: the current `RouteLoadingState` is understandable and marked
  busy, but its geometry changes when bootstrap finishes.
- Shell and drawer: no unbounded render loop or duplicate request was found.
- Resume preview/print: bounded contract arrays, safe links, a single print
  operation guard, double-animation-frame preparation, `afterprint` cleanup,
  and four-second fallback cleanup.
- AI diff: memoized by original/rewritten text at the component boundary;
  deterministic bounded 2,000-character unit evidence passed. No speculative
  memoization or virtualization is justified.
- Templates: registry-controlled classes and system fonts; no arbitrary style
  input. Switching remained responsive in browser interaction.
- Interview and Learning lists: server pagination and stale-response
  cancellation are preserved.
- Polling: Resume, Interview, and Learning schedules are abortable, bounded to
  five minutes, and pause after three consecutive transient failures.
- Private PDF: object URLs are revoked on replacement, stale completion,
  expiration, failure cleanup, unmount, document/account identity change, and
  navigation away. The focused lifecycle tests passed.
- Router candidate: not started. The eager initial chunk confirms it remains
  plausible; the later P16F-002 deferral section records the controlling
  evidence-based decision.

## Verification

| Command / check | Result |
| --- | --- |
| Initial baseline checks | PASS; exact branch/HEAD/subject, clean worktree, no active Git operation or residue |
| `npm run build` | PASS; first build used only for asset baseline, but its missing production API configuration failed closed in preview as designed |
| `VITE_API_URL=https://api.example.test/api/v1 npm run build` | PASS; frontend and backend build passed; assets recorded above |
| Focused Vitest command across 15 files | PASS; 15 files, 149 tests |
| `npm run test --workspace @career-learning-hub/web` | PASS; 49 files, 642 tests |
| `npm run typecheck` | PASS; frontend, backend, and shared types |
| Five-viewport isolated browser audit | PASS; 5/5, final cleanup `users=0, owned=0` |
| Layout-shift diagnostic | PASS as diagnostic; 2/2, final cleanup `users=0, owned=0` |
| First production-preview audit | FAIL 0/2 because the audit build intentionally failed closed without an explicit production API origin; no source changed |
| Corrected production-preview audit | PASS; 2/2 with an explicit synthetic API origin and intercepted 401 refresh |
| Complete 21-test browser suite | NOT RUN; the prompt requires stopping before router implementation after an out-of-manifest defect |
| Router RED/GREEN | NOT APPLICABLE; router remained byte-for-byte unchanged |
| Post-change build/comparison | NOT APPLICABLE; no production or test source changed |

The first local-service start was denied by sandbox port restrictions
(`listen EPERM: operation not permitted 0.0.0.0`). The same audit was rerun
with approved local-port access and passed. This was an environment boundary,
not an application failure.

## Boundaries and cleanup

- Backend authentication, shared contracts, dependencies, manifests,
  lockfile, environment files, Playwright configuration, router source, and
  all out-of-manifest product source are unchanged. The bounded CLS repair
  changed the authorized authentication route and global styles; the recovery
  changed only the authorized authentication and ownership browser specs.
- No provider, Atlas, deployment, cloud storage, network download, or legacy
  project was used.
- P15-001 remains technically unresolved with all accepted academic-MVP
  operating restrictions preserved.
- Phase 15 remains `COMPLETED` /
  `APPROVED WITH ACCEPTED LIMITATIONS AND FORMAL DEFERRAL`.
- Phase 16 remains active. Phase 16F is
  `COMPLETED` / `APPROVED`. Phase 16G and
  Phase 17 remain planned and inactive.
- Phase 16G still requires its own fresh complete integrated Full Application
  Browser Testing run; no historical result is presented as fresh evidence.
- All isolated browser runs reported final tagged cleanup
  `users=0, owned=0`. Temporary services stopped after each run.
- Build output, temporary diagnostic code/results, and browser artifacts are
  removed before final handoff.
- Nothing is staged, committed, or pushed.

## Human review approval and checklist

The operator completed the following required review:

- keyboard-only traversal, skip-link destination, desktop sidebar, mobile
  drawer containment/Escape/return, dialogs, route changes, breadcrumbs,
  forms, validation summaries, statuses, request IDs, AI selection and
  confirmation, and no raw identifiers;
- 1440×900, 1024×768, 768×1024, 390×844, 320×720, and actual browser 200%
  zoom with no overflow, clipped focus, or inaccessible action;
- primary/secondary text, links, active route, focus, errors, status chips,
  AI Removed/Added, Quiz correctness, Slate/Forest/Navy, and grayscale print;
- reduced-motion drawer, dialog, navigation, and loading behavior;
- initial loading stability, first and subsequent route navigation, long
  Resume content, AI diff, template switching, lists, pagination, polling,
  and private-PDF cleanup;
- A4/Letter, one-page/multipage, selectable text, app-chrome exclusion,
  clipping, and current/historical saved Resume versions; and
- no provider request, private-title leak, Quiz answer leak, cross-owner data,
  ATS guarantee, arbitrary styling, or weakening of P15-001 restrictions.

The operator supplied `PHASE_16F_ACCESSIBILITY_PERFORMANCE_APPROVED`; the
token is accepted. Phase 16F is `COMPLETED` / `APPROVED`.

## P16F-001 bounded repair attempt

### Control and scope

- Repair prompt: `CLH-PHASE-16F-AUTH-BOOTSTRAP-CLS-REPAIR-01`.
- Starting and final branch: `phase-12-unified-frontend`.
- Starting and final HEAD:
  `9a508b2cf06ec0bedbcab2192dd15ff7180ce042`.
- Subject: `Add bounded resume design controls`.
- The starting worktree contained exactly the two tracked planning changes and
  this untracked report from the blocked audit. Nothing was staged and no Git
  operation or generated residue was active.
- Authorized and changed paths:
  `frontend/src/features/auth/AuthRoute.tsx`, `frontend/src/styles.css`,
  `frontend/src/routing/router.test.tsx`,
  `tests/browser/specs/auth.spec.cjs`, `docs/planning/CURRENT_PHASE.md`,
  `docs/planning/CAREER_LEARNING_HUB_MASTER_PLAN.md`, and this report.
- No router lazy loading, dependency change, environment-file access, backend
  change, shared-contract change, provider call, Atlas use, deployment, or
  legacy access occurred.

### Root cause and repair

The `bootstrapping` state rendered a shrink-wrapped `route-state` main with a
viewport-relative top margin. The final public and protected destinations
instead reserve a full viewport through `auth-layout` and `app-shell`. The
result was a body-level geometry change when the bootstrap tree was replaced.

`RouteLoadingState` now reuses the final public authentication frame:

- a full-height `auth-layout auth-bootstrap-layout` main landmark;
- the existing bounded `auth-card` surface;
- a named `role="status"` region with truthful restoration copy; and
- `aria-busy="true"` on the main while authentication remains unresolved.

Shared CSS now gives `#root` the same `min-width: 0` and `min-height: 100vh`
contract as `body`. Authentication state values, refresh behavior, redirects,
in-memory access tokens, cookie handling, login, registration, logout, and
all final-route source remain unchanged. This was one production repair
attempt; no artificial delay, fixed viewport height, overlay, hidden content,
animation, or skeleton was added.

### RED and focused GREEN evidence

- Router RED: the two new bootstrap-frame cases failed because
  `auth-bootstrap-layout` and the named status region did not exist. A first
  broad RED invocation also exposed test pollution from an intentionally
  unresolved refresh promise; the test fixture was corrected to settle that
  promise in `finally`, without production changes.
- Browser RED: 3/3 expected failures with CLS 0.1500 desktop, 0.2400 tablet,
  and 0.2400 mobile. Teardown was `users=0, owned=0`.
- Focused router GREEN: 1 file, 53/53 tests.
- Targeted authentication browser GREEN: 12/12, comprising 4/4 desktop,
  4/4 tablet, and 4/4 mobile, one worker and zero retries. Registration,
  login, intended redirects, reload persistence, logout, responsive
  destinations, skip link, focus, represented reflow, reduced motion, and
  page health passed. Teardown was `users=0, owned=0`.

### Authoritative post-repair production measurement

The first temporary post-repair collector attempt proved incomplete because
five LCP entries were sampled before buffered delivery. It was not used as
evidence. The collector was corrected before the single authoritative set;
it waited for buffered paint delivery and separated Chrome's expected
synthetic intercepted-401 resource diagnostic from application console
issues. No result was selected or rerun for a favorable value.

| Viewport | Run | DOMContentLoaded | Load | LCP | CLS | Blocking | JS transferred | Script requests |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1440×900 | 1 | 212.9 ms | 213.0 ms | 372 ms | 0.0000 | 0 ms | 160,694 B | 1 |
| 1440×900 | 2 | 82.5 ms | 82.6 ms | 168 ms | 0.0000 | 0 ms | 160,694 B | 1 |
| 1440×900 | 3 | 84.5 ms | 84.6 ms | 168 ms | 0.0000 | 0 ms | 160,694 B | 1 |
| 1440×900 median | — | 84.5 ms | 84.6 ms | 168 ms | 0.0000 | 0 ms | 160,694 B | 1 |
| 390×844 | 1 | 85.0 ms | 85.0 ms | 168 ms | 0.0000 | 0 ms | 160,694 B | 1 |
| 390×844 | 2 | 80.4 ms | 80.4 ms | 164 ms | 0.0000 | 0 ms | 160,694 B | 1 |
| 390×844 | 3 | 81.2 ms | 81.3 ms | 168 ms | 0.0000 | 0 ms | 160,694 B | 1 |
| 390×844 median | — | 81.2 ms | 81.3 ms | 168 ms | 0.0000 | 0 ms | 160,694 B | 1 |

Every required CLS sample passed. No long task, failed request, external
request, provider request, application console warning/error, or page error
was observed. Each run included the expected synthetic anonymous refresh 401
resource diagnostic and no other console issue.

| Median | Baseline | Post-repair | Change |
| --- | ---: | ---: | ---: |
| Desktop DCL | 115.0 ms | 84.5 ms | 26.5% faster |
| Desktop load | 115.1 ms | 84.6 ms | 26.5% faster |
| Desktop LCP | 188 ms | 168 ms | 10.6% faster |
| Mobile DCL | 84.9 ms | 81.2 ms | 4.4% faster |
| Mobile load | 84.9 ms | 81.3 ms | 4.2% faster |
| Mobile LCP | 148 ms | 168 ms | 13.5% slower |

The 20 ms mobile LCP delta is approximately one 60 Hz paint frame. It was
classified as explained local paint-delivery granularity, rather than an
unexplained application regression, because navigation timings improved,
blocking remained zero, the request graph was unchanged, and the production
change adds no delay or asynchronous work. The value is preserved here rather
than rounded or omitted.

### Build and broad automated verification

- Production build: passed twice after the repair; Vite transformed 102
  modules and retained the existing greater-than-500-kB advisory.
- Final assets: `index-DSpHq40W.css`, 77,149 bytes / 77.15 kB / 14.14 kB
  gzip; `index-h0fX09fK.js`, 580,963 bytes / 580.96 kB / 160.39 kB gzip.
- Baseline comparison: CSS +16 bytes; JavaScript +162 bytes; reported gzip
  classes unchanged.
- Complete frontend first attempt: 48/49 files and 644/645 tests; one
  untouched Interview asynchronous loading assertion failed.
- The isolated existing Interview test then passed 1/1 without a code change.
  The fresh complete frontend rerun passed 49/49 files and 645/645 tests.
- Root `npm run typecheck`: passed for frontend, backend, and shared types.

### Responsive and accessibility recheck

The browser recheck passed at 1440×900, 1024×768, 768×1024, 390×844, and
320×720, plus a 720×450 represented-200%-reflow viewport. It confirmed one
main landmark, one expected heading, the first-focus skip link, exact focus
transfer to main, no horizontal overflow, no focus trap or clipping observed,
and the reduced-motion transition override. Public and protected routing,
loading semantics, form suppression during confirmed-authenticated bootstrap,
and protected-content suppression remained covered by the focused and
targeted tests. Actual browser 200% zoom and human visual judgment remain
future human-review items.

### Historical complete browser terminal blocker

The one fresh complete configured Full Application Browser Testing run used
one worker and zero retries. It finished 24/27:

- desktop: 9/9;
- tablet: 9/9;
- mobile: 6/9;
- teardown: `users=0, owned=0`.

The three mobile failures were:

1. the responsive authentication check could not find `Unified dashboard`
   after a later authenticated direct navigation;
2. Dashboard could not find seeded `Quiz completed` activity after reload;
3. ownership isolation could not find the safe unavailable heading during
   the owned-route loop.

All three failure snapshots showed the public `Welcome back` login form,
meaning their expected authenticated session was unavailable after a reload
or later direct navigation. No protected data appeared. The cause was not
diagnosed within this prompt. Per the terminal browser-gate rule, the suite
was not rerun and no test, authentication provider, fixture, backend, or
out-of-manifest file was modified.

### Mobile authenticated-session gate recovery

The recovery baseline retained the six tracked Phase 16F modifications and
the untracked report at the same HEAD, with nothing staged and no active Git
operation. Inspection confirmed the exact ownership workflow at
`tests/browser/specs/ownership.spec.cjs`. Playwright creates a fresh page and
browser context for every test, so cookies are context-owned and aren't reused
between tests. Each test creates distinct tagged users; its fixture deletes
their sessions and owned records only after the test body. The backend process
and its in-memory rate-limit counters, however, survive across desktop,
tablet, and mobile within one Playwright command.

The configured order is nine tests per project: four authentication tests,
Dashboard, Interview, Learning, ownership, and Resume. Desktop runs first,
then tablet, then mobile. A fresh instrumented mobile-only diagnostic passed
all nine test bodies and recorded 27 refresh requests against the fixed
60-request, 15-minute refresh limiter. The first response reported 59
remaining and the last reported 33 remaining. Anonymous bootstraps returned
401 without a cookie as designed. Authenticated refreshes returned 200 with a
present `clh_phase14_refresh` cookie and a matching active session that was
atomically rotated by the only successful service path. Safe cookie metadata
was host-only, path `/api/v1/auth`, SameSite=Lax, HttpOnly, persistent, and
non-Secure on local HTTP. No redirect response was emitted by the API.

The same pre-repair sequence consumed 27 refresh requests per project. Desktop
and tablet therefore consumed 54 requests against the same limiter. Mobile's
bootstrap and registration workflow consumed requests 55 through 60; the next
bootstrap and all later hard-navigation refreshes received 429. This exactly
explains why login-only Interview, Learning, and Resume workflows still passed
while the responsive hard navigation, Dashboard reload, and ownership hard
navigation failed closed to the public login page. It also rules out cookie
loss, session deletion, refresh replay, browser-context reuse, shared identity,
and a product authentication regression. Primary classification: `B — TEST
ORDER OR SHARED RATE-BUDGET CONTAMINATION`.

The diagnostic reporter held the runner open after all nine test bodies, so a
bounded interrupt was required. Standard global teardown then reported
`users=0, owned=0`; the frontend and backend stopped and all configured ports
closed. This temporary diagnostic-process issue did not affect any test body
or the root-cause evidence.

The test-only repair keeps one authenticated hard navigation before the six
responsive viewport and keyboard checks instead of repeating the same hard
navigation six times. The ownership workflow still checks all seven User A
routes as User B, keeps one hard navigation, uses existing SPA routing for the
remaining routes, and visits the blocker-bearing Resume route last. Dashboard's
authenticated reload is unchanged. No authentication source, cookie behavior,
rate limit, ownership assertion, safe unavailable-state assertion, retry,
timeout, or security control changed.

Repair attempt 1 passed responsive authentication and Dashboard but exposed a
React Router blocker warning when raw history left Resume; the console-health
assertion correctly failed. Repair attempt 2 reordered Resume last without
suppressing the warning. Ownership then passed 1/1. The exact historical
mobile sequence passed 3/3, and the complete mobile project passed 9/9. Each
run used fresh services, one worker, zero retries, and final cleanup
`users=0, owned=0`.

The single newly authorized fresh complete browser gate then passed 27/27 in
1.8 minutes: desktop 9/9, tablet 9/9, and mobile 9/9. Authentication,
Dashboard, ownership isolation, private PDF, Quiz secrecy, sidebar/drawer,
breadcrumbs, Resume print, AI comparison, Resume templates, console health,
page-error health, and horizontal-overflow checks all passed. Final teardown
was `users=0, owned=0`. This run stands independently from the historical
24/27 result and wasn't rerun.

### Repair disposition and limitations

- P16F-001 implementation evidence: CLS repaired to 0.0000 in all six
  authoritative samples.
- P16F-001 formal disposition: `REPAIRED / VERIFIED`.
- P16F-002:
  `ROUTE LAZY LOADING REJECTED / DEFERRED WITH EVIDENCE`.
- Router candidate: not started; `frontend/src/routing/router.tsx` is
  unchanged.
- Phase 16F: `COMPLETED` / `APPROVED`.
- Phase 16G and Phase 17 remain planned and inactive. Phase 16G still requires
  its own fresh integrated run.
- Phase 15 remains completed and approved with accepted limitations and
  formal deferral. P15-001 remains technically unresolved with all accepted
  operating restrictions preserved.
- The Phase 16F approval token is accepted.
- All temporary frontend, backend, MongoDB, preview, and browser processes
  stopped. Ports 4173, 4174, and 8000 were closed. Playwright output,
  runtime/storage data, screenshots, traces, temporary measurement code,
  build output, and the repository-local TypeScript build cache were removed.

## P16F-002 evidence-based deferral

### Control and starting state

- Deferral prompt:
  `CLH-PHASE-16F-P16F002-EVIDENCE-BASED-DEFERRAL-01`.
- Starting and final branch: `phase-12-unified-frontend`.
- Starting and final HEAD:
  `9a508b2cf06ec0bedbcab2192dd15ff7180ce042`.
- The worktree contained exactly seven tracked modifications and this one
  untracked report: `frontend/src/features/auth/AuthRoute.tsx`,
  `frontend/src/styles.css`, `frontend/src/routing/router.test.tsx`,
  `tests/browser/specs/auth.spec.cjs`,
  `tests/browser/specs/ownership.spec.cjs`,
  `docs/planning/CURRENT_PHASE.md`,
  `docs/planning/CAREER_LEARNING_HUB_MASTER_PLAN.md`, and this report.
- Nothing was staged, no Git operation was active, and no generated or browser
  residue existed. Only the three governance paths were edited for deferral.

### Architecture and build evidence

- React Router is 7.18.1. The application uses
  `createBrowserRouter(appRoutes)` and all 14 page modules remain eagerly
  imported. The named component exports are compatible with a future lazy
  candidate.
- Credible page groups are Dashboard, Resume, Interview, Learning, and
  Settings. `AuthProvider`, `AuthRoute`, `AppShell`, `RouteErrorPage`,
  redirects, and routing helpers would remain eager in such a candidate.
- The fresh candidate build transformed 102 modules in 843 ms. The final
  non-router verification build transformed 102 modules in 814 ms.
- The final assets were `index-DSpHq40W.css` at 77,149 bytes (77.15 kB,
  14.14 kB gzip), `index-h0fX09fK.js` at 580,963 bytes (580.96 kB,
  160.39 kB gzip), and `index.html` at 542 bytes (0.54 kB, 0.34 kB gzip).
  Total JavaScript was 580,963 bytes and total CSS was 77,149 bytes.
- There were no dynamic chunks. The Vite greater-than-500-kB advisory remains
  documented and accepted for the controlled academic MVP.

### Bounded measurement attempts

1. The synthetic login was rejected because the forwarded request origin was
   not allowlisted.
2. Request-origin forwarding succeeded, but the response CORS header still
   identified development port 4173 rather than preview port 4174.
3. CORS request and response handling succeeded and login completed, but the
   saved session did not restore in the required fresh protected context.
   `/dashboard` safely redirected to `/login`, and no protected data appeared.

These attempts did not create a complete comparable public, protected,
Resume, and Learning authenticated measurement dataset. The three-attempt
failure-loop rule therefore stopped further harness changes. No product,
authentication, or router defect was established. The measurement failures
are harness limitations, not a failed product repair.

### Decision and rationale

P16F-002 is
`ROUTE LAZY LOADING REJECTED / DEFERRED WITH EVIDENCE`.

- P16F-002 is advisory, not an unresolved Critical, Serious, or Moderate
  defect. A trustworthy comparable authenticated baseline is required before
  implementation, and that baseline was not established.
- Continuing the harness experiment would violate the three-attempt rule.
  Modifying `frontend/src/routing/router.tsx` without the baseline would be
  speculative. That file remains byte-for-byte unchanged relative to HEAD.
- No candidate implementation, candidate-only router-test edit, dynamic
  chunk, or before/after comparison exists. Lazy loading was neither measured
  nor implemented, and the large-bundle advisory is not claimed as resolved.
- The current eager route architecture remains accepted for the controlled
  academic MVP. No product functionality was removed and no performance
  guarantee is made.
- A future phase may reconsider route-level lazy loading only with an
  approved, reusable production-preview authentication measurement harness
  capable of producing the required comparable dataset.

### Final non-browser verification and limitations

| Verification | Result |
| --- | --- |
| Focused router regression | PASS, 1/1 file and 53/53 tests; 3.08 s total, 1.90 s tests |
| `auth.spec.cjs` syntax | PASS, `node --check` exit 0 |
| `ownership.spec.cjs` syntax | PASS, `node --check` exit 0 |
| Complete frontend suite | PASS, 49/49 files and 645/645 tests; 11.71 s |
| Root typecheck | PASS, frontend, backend, and shared types |
| Final production build | PASS, 102 modules in 814 ms; assets and advisory recorded above |

- No Playwright, Chrome, Lighthouse, preview, development server, backend,
  MongoDB, or authenticated measurement harness was started by the deferral
  prompt.
- The recovered complete browser result remains 27/27: desktop 9/9, tablet
  9/9, mobile 9/9, one worker, zero retries, 1.8 minutes, cleanup
  `users=0, owned=0`. It is preserved as controlling evidence for the current
  eight-path state and is not represented as validation of a router change.
- The complete browser suite was not rerun because no product, router, or test
  change followed that recovered state. Phase 16G owns the next mandatory
  fresh complete integrated browser run.
- Lighthouse remains unavailable and was not installed. The operator
  completed actual browser 200% zoom and the human visual, keyboard,
  contrast, reduced-motion, reflow, Resume, performance, and trust review.
- Phase 16F is `COMPLETED` / `APPROVED`. Phase 16G and Phase 17 remain
  planned and inactive, and
  `PHASE_16F_ACCESSIBILITY_PERFORMANCE_APPROVED` is accepted.

## Phase 16F human-review approval closeout

- Preparation prompt: `CLH-PHASE-16F-HUMAN-REVIEW-PREPARATION-01`.
- Approval token: `PHASE_16F_ACCESSIBILITY_PERFORMANCE_APPROVED`.
- Approval token accepted: yes.
- The operator completed the required authentication stability, keyboard,
  viewport, actual 200% zoom, reflow, contrast, reduced-motion, route and
  performance experience, Resume design/print, AI comparison, and trust and
  privacy checklist.
- The temporary review environment used an isolated local MongoDB, the
  existing backend and Vite frontend, and one deterministic `@example.test`
  account. The bounded records covered Dashboard activity; a long Resume with
  current and historical saved versions; design controls; stored provider-free
  AI suggestions; one Interview; one Learning document; one conversation;
  one flashcard set; one Quiz; and one completed Quiz attempt.
- Runtime readiness opened login, Dashboard, Resume, Interview, Learning, and
  Settings. Dashboard, Resume, Interview, Learning, and Settings each had zero
  horizontal overflow at 1440x900 and 390x844. Application console errors,
  page errors, external requests, and provider requests were all zero. The
  stored AI comparison was visible.
- The unchanged frontend trust boundary rejected a null end date and a
  string-shaped strength in the first raw synthetic seed. Both corrections
  were confined to the isolated temporary database. The final Resume and
  stored-AI focused checks passed, and no product or authentication defect was
  established.
- No repository `.env`, provider, Atlas, cloud storage, deployment,
  production data, real Resume, personal data, or legacy project was used. No
  source, test, governance, package, lockfile, environment, dependency, or
  configuration change was needed for runtime readiness.
- After approval, the headed browser, frontend, backend, and MongoDB services
  stopped. The temporary account, database, asset storage, and runtime state
  were removed. Ports 4173, 4174, and 8000 are closed.
- The final worktree remains the exact eight Phase 16F paths. Nothing is
  staged, committed, or pushed. Phase 16G and Phase 17 remain planned and
  inactive, and Phase 16G still owns the next fresh complete integrated
  browser run.

## Original blocked-audit 144-item evidence index (historical)

The following index is preserved as the exact evidence state at the end of
the original blocked audit. The later repair evidence and current disposition
are controlled by the preceding repair section.

1. Starting branch: `phase-12-unified-frontend`.
2. Starting full HEAD: `9a508b2cf06ec0bedbcab2192dd15ff7180ce042`.
3. Final full HEAD: unchanged.
4. Starting subject: `Add bounded resume design controls`.
5. Skill availability: recorded in Document control.
6. Worktree baseline: clean, unstaged, and untracked-free.
7. Exact changed paths: three planning/report paths.
8. Phase activation: activated after inspection, then blocked by P16F-001.
9. Environment: macOS 26.5.2 arm64.
10. Node version: v26.5.0.
11. npm version: 11.17.0.
12. Browser/version: Chrome 150.0.7871.187.
13. Lighthouse availability: unavailable; not installed.
14. Measurement mode: isolated dev harness plus production preview.
15. Cache policy: disabled for timing samples.
16. Fixture: synthetic `.test` users/data only.
17. Baseline build: passed.
18. Baseline CSS assets: 77,133 B; 14.14 kB gzip.
19. Baseline JavaScript assets: 580,801 B; 160.39 kB gzip.
20. Baseline initial entry: one JavaScript request.
21. Historical Phase 16E build measurement: kept separate above.
22. Three-run public-load samples: recorded above.
23. Public-load median: desktop 115.0/115.1/188 ms and mobile 84.9/84.9/148 ms for DCL/load/LCP.
24. Three-run protected-load samples: recorded above.
25. Protected-load median: desktop 104.9/105.5/200 ms and mobile 171.2/172.1/260 ms for DCL/load/LCP.
26. Resume-workspace samples: not collected after blocking result.
27. Resume-workspace median: unavailable.
28. Learning-workspace samples: not collected after blocking result.
29. Learning-workspace median: unavailable.
30. FCP: unavailable from the bounded observer.
31. LCP: public and protected values recorded above.
32. CLS: confirmed failing threshold; P16F-001.
33. Blocking/long-task evidence: 0 ms in recorded timing samples.
34. Initial transferred JavaScript: 160,687 B.
35. Request count: one production script; 72 development modules kept separate.
36. Route-transition results: functional and responsive in the audit.
37. Landmark audit: passed.
38. Heading audit: passed.
39. Skip-link audit: passed.
40. Sidebar audit: passed by source/test inspection.
41. Drawer audit: passed.
42. Breadcrumb audit: passed.
43. Active-route audit: passed by source/test inspection.
44. Focus-order audit: no defect found; human review still required.
45. Focus-visible audit: sampled skip-link passed; human review still required.
46. Focus-return audit: passed.
47. Accessible-name audit: passed.
48. Form-label audit: passed.
49. Error-summary audit: passed by focused tests.
50. Live-status audit: passed by focused tests.
51. Reduced-motion audit: source rule present; human review pending.
52. Contrast audit: palette unit thresholds passed; human review pending.
53. 1440×900: passed automated audit.
54. 1024×768: passed automated audit.
55. 768×1024: passed automated audit.
56. 390×844: passed automated audit.
57. 320×720: passed automated audit.
58. Represented 200% reflow: not claimed.
59. Actual 200% pending review: yes.
60. Resume print-control audit: focused tests passed.
61. Resume design-control audit: focused tests passed.
62. AI comparison audit: focused tests passed.
63. Quiz secrecy audit: source/test evidence inspected; complete browser not rerun.
64. Ownership-safe-state audit: source/test evidence inspected; complete browser not rerun.
65. Print-media audit: source/test evidence inspected; human review pending.
66. Private-PDF object-URL audit: focused tests and source passed.
67. Polling audit: Resume, Interview, and Learning focused tests passed.
68. Pagination audit: bounded server paging confirmed in source/tests.
69. Accessibility findings: no confirmed defect.
70. Critical count: 0.
71. Serious count: 0.
72. Moderate count: 1 performance defect.
73. Minor count: 0.
74. Advisory count: 3.
75. Out-of-manifest finding result: blocked.
76. Router candidate decision: do not start while blocked.
77. Router architecture: eager page imports under existing wrappers.
78. Router RED evidence: not applicable.
79. Router GREEN evidence: not applicable.
80. Post-change build: not applicable.
81. Post-change initial entry: not applicable.
82. Post-change total JavaScript: not applicable.
83. Post-change samples: not applicable.
84. Before/after comparison: prohibited after blocker.
85. Candidate retained or rejected: rejected for this pass without editing.
86. Focused router result: included in the 149 focused tests; unchanged.
87. Complete frontend result: 49 files, 642 tests passed.
88. Root typecheck: passed.
89. Production build: passed with explicit synthetic API URL.
90. Browser route verification: 5/5 audit, 2/2 diagnostic, corrected 2/2 production.
91. Complete browser result when run: not run due mandatory stop.
92. Desktop: targeted audit passed; CLS defect confirmed.
93. Tablet: targeted audit passed.
94. Mobile: targeted audit passed; CLS defect confirmed.
95. Authentication: semantics preserved; bootstrap geometry is blocking.
96. Ownership: unchanged.
97. Private PDF: unchanged; lifecycle checks passed.
98. Quiz secrecy: unchanged.
99. Sidebar/drawer: unchanged; targeted checks passed.
100. Breadcrumbs: unchanged; targeted checks passed.
101. Resume printing: unchanged; focused tests passed.
102. AI comparison: unchanged; focused tests passed.
103. Resume templates: unchanged; focused tests passed.
104. Console: no audit-test console/page issue failed the 5/5 run.
105. Page errors: none in the passing audit runs.
106. Horizontal overflow: zero through 320×720.
107. Cleanup users: zero.
108. Cleanup owned records: zero.
109. Services stopped: required and verified at handoff.
110. Ports closed: required and verified at handoff.
111. Artifacts removed: required and verified at handoff.
112. Security/privacy result: preserved.
113. P15-001: unresolved accepted limitation; restrictions preserved.
114. Backend status: unchanged.
115. Shared-contract status: unchanged.
116. Dependency status: unchanged.
117. Package status: unchanged.
118. Lockfile status: unchanged.
119. Environment-file status: not read or changed.
120. Provider calls: none.
121. Atlas usage: none.
122. Deployment: none.
123. Legacy access: none.
124. Phase 15 status: completed with accepted limitations/formal deferral.
125. Phase 16 status: active.
126. Phase 16A-1 status: completed/approved.
127. Phase 16A-2 status: completed/approved.
128. Phase 16B status: completed/approved.
129. Phase 16C status: completed/approved.
130. Phase 16D status: completed/approved.
131. Phase 16E status: completed/approved.
132. Phase 16F status: blocked; new bounded manifest required.
133. Phase 16G status: planned/inactive.
134. Phase 17 status: planned/inactive.
135. Human review required: yes, after repair and unblocking.
136. Future approval token: `PHASE_16F_ACCESSIBILITY_PERFORMANCE_APPROVED`.
137. Approval token accepted: no.
138. Phase 16G fresh-run requirement: retained.
139. Staged state: nothing staged.
140. Commit state: no commit.
141. Push state: no push.
142. Final Git status: three authorized documentation paths modified.
143. Any blocker: P16F-001.
144. Human-review checklist: recorded above.

Historical audit marker: `PHASE_16F_ACCESSIBILITY_PERFORMANCE_BLOCKED`.

Current repair marker:
`PHASE_16F_AUTH_BOOTSTRAP_CLS_REPAIR_BLOCKED`.
