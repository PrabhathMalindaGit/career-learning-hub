# Frontend Architecture Audit

## 1. Audit metadata

- Execution phase: 4
- Date: 2026-07-24
- Branch: `phase-10-unified-frontend`
- Starting HEAD: `b9874db`
- Current HEAD: `b9874db`
- Controlling skill: `karpathy-guidelines`
- Audit status: COMPLETE_WITH_GAPS

## 2. Scope and evidence boundary

### Inspected areas

- Repository governance and planning:
  - `AGENTS.md`
  - `docs/planning/CURRENT_PHASE.md`
  - `docs/planning/CAREER_LEARNING_HUB_MASTER_PLAN.md`
  - `docs/planning/DECISION_LOG.md`
- Baseline, architecture, and historical contract evidence:
  - `docs/phases/phase-10-baseline-report.md`
  - `docs/architecture/frontend-backend-structure.md`
  - `docs/phases/phase-02-authentication.md`
  - `docs/phases/phase-04-resume-studio.md`
  - `docs/phases/phase-05-interview-coach.md`
  - `docs/phases/phase-06-learning-workspace.md`
  - `docs/phases/phase-07-dashboard.md`
  - `docs/phases/phase-09-hardening.md`
  - `README.md`
  - `.gitignore`
- Frontend package, TypeScript, HTML, environment-variable names, and every file under `frontend/src/`.
- Root scripts, resolved lockfile entries needed to identify installed frontend versions, and `packages/shared-types/`.
- Bounded backend authentication, current-user, refresh-cookie, CORS, request-ID, and normalized-error implementation.

### Excluded areas

- No full backend audit was performed.
- No legacy project was accessed.
- No production credential, database, private upload, or user data was accessed.
- No deployment configuration or hosting fallback was inspected because none is in the active frontend tree.
- Dependency audit remediation remains outside Phase 4. The Phase 3 report carries forward one high and one critical npm audit finding.

### Verification boundary

- No frontend, backend, or shared-types production source was modified.
- No package manifest or lockfile was modified.
- No dependency installation occurred.
- No test, typecheck, build, development server, preview server, browser, Playwright, or Lighthouse command ran.
- No runtime or browser behavior is claimed.
- Classifications describe static source and repository evidence. Items that need execution are marked `UNCLEAR_REQUIRES_VERIFICATION`.

## 3. Verified technology stack

### Package and tooling inventory

| Capability | Verified package or mechanism | Resolved version | Classification | Evidence |
| --- | --- | --- | --- | --- |
| Frontend package | `@career-learning-hub/web` | `0.1.0` | PRESENT_AND_USED | `frontend/package.json` |
| React | `react` | `19.2.8` | PRESENT_AND_USED | `frontend/package.json`, `package-lock.json`, `frontend/src/main.tsx` |
| React DOM | `react-dom` | `19.2.8` | PRESENT_AND_USED | `frontend/package.json`, `package-lock.json`, `frontend/src/main.tsx` |
| Vite | `vite` | `6.4.3` | PRESENT_AND_USED | `frontend/package.json`, `package-lock.json` |
| TypeScript | `typescript` | `5.8.3` in the frontend workspace | PRESENT_AND_USED | `frontend/package.json`, `frontend/tsconfig.json`, `package-lock.json` |
| React Vite plugin | `@vitejs/plugin-react` | `4.7.0` | PRESENT_BUT_UNUSED | Declared in `frontend/package.json`; no `frontend/vite.config.*` exists |
| Routing | None | Not applicable | ABSENT | `frontend/package.json`, all files under `frontend/src/` |
| Server-state library | None | Not applicable | ABSENT | `frontend/package.json`, all files under `frontend/src/` |
| Form library | None | Not applicable | ABSENT | `frontend/package.json` |
| Frontend schema validation | None | Not applicable | ABSENT | `frontend/package.json`, all files under `frontend/src/` |
| UI component library | None | Not applicable | ABSENT | `frontend/package.json` |
| Icon library | None | Not applicable | ABSENT | `frontend/package.json` |
| CSS framework | None | Not applicable | ABSENT | `frontend/package.json`, frontend CSS files |
| Styling | Global CSS plus feature-local global CSS | Not applicable | PRESENT_AND_USED | `frontend/src/styles.css`, feature CSS imports |
| Frontend unit/component tests | None | Not applicable | ABSENT | `frontend/package.json`, frontend file inventory |
| Browser-test framework | None | Not applicable | ABSENT | Root and frontend manifests and file inventory |
| Frontend linting | None | Not applicable | ABSENT | No ESLint manifest entry or frontend lint configuration |

### Relevant root commands

- `npm run dev:frontend` and compatibility alias `npm run dev:web` start the frontend workspace.
- `npm run build` includes the frontend production build through workspace scripts.
- `npm run typecheck` includes the frontend TypeScript project through workspace scripts.
- Root `test`, `test:unit`, `test:integration`, `test:security`, `test:coverage`, and `test:ci` scripts target the backend only.
- The frontend manifest has `dev`, `build`, `preview`, and `typecheck`; it has no test or lint script.
- Evidence: `package.json`, `frontend/package.json`, `AGENTS.md`, and `docs/phases/phase-10-baseline-report.md`.

## 4. Frontend file map

| Path | Responsibility | Classification | Phase 5 relevance |
| --- | --- | --- | --- |
| `frontend/package.json` | Frontend package identity, scripts, and dependencies | IMPLEMENTED | Add only approved routing and frontend-test dependencies and scripts |
| `frontend/tsconfig.json` | Strict browser TypeScript configuration for `src` | IMPLEMENTED | Preserve strict settings |
| `frontend/index.html` | HTML shell, metadata, root element, and module entry | IMPLEMENTED | Preserve root mount; verify route title updates later |
| `frontend/.env.example` | Documents the `VITE_API_URL` variable | IMPLEMENTED | Shared client must read this one base URL |
| `frontend/src/vite-env.d.ts` | Loads Vite client types | IMPLEMENTED | Keep |
| `frontend/src/main.tsx` | Validates the root element, mounts React with `createRoot`, and enables `StrictMode` | IMPLEMENTED | Become provider and router composition point |
| `frontend/src/AppShell.tsx` | Stacks the dashboard and three historical feature scaffolds on one page | PLACEHOLDER | Replace stacked composition with authenticated shell, navigation, and route outlet |
| `frontend/src/styles.css` | Global typography, page shell, module cards, and one mobile breakpoint | PARTIAL | Preserve visual language; add shell, auth, focus, and mobile-navigation styles |
| `frontend/src/features/dashboard/index.ts` | Dashboard exports | IMPLEMENTED | Keep; direct imports are preferable in new root routing |
| `frontend/src/features/dashboard/types.ts` | Local dashboard response types | PARTIAL | Keep for Phase 6; current API boundary does not validate them |
| `frontend/src/features/dashboard/dashboardApi.ts` | Dashboard fetch wrapper and query serialization | PARTIAL | Delegate transport to the shared client |
| `frontend/src/features/dashboard/DashboardLayout.tsx` | Feature-local dashboard heading and controls layout | IMPLEMENTED | Preserve for Phase 6 |
| `frontend/src/features/dashboard/MainDashboard.tsx` | Feature-local fetch lifecycle and real-record dashboard rendering | PARTIAL | Phase 6 owns connection; Phase 5 must not fabricate data |
| `frontend/src/features/dashboard/ActivityFeed.tsx` | Formats and renders recorded activity events | IMPLEMENTED | Preserve for Phase 6 |
| `frontend/src/features/dashboard/ProgressWidgets.tsx` | Renders recorded metric summaries | IMPLEMENTED | Preserve for Phase 6 |
| `frontend/src/features/dashboard/dashboard.css` | Dashboard layout, state, metric, list, and responsive styles | IMPLEMENTED | Preserve; visual QA remains required when routed later |
| `frontend/src/features/resumes/index.ts` | Resume feature exports | IMPLEMENTED | Keep |
| `frontend/src/features/resumes/types.ts` | Resume editor, design, and suggestion types | PARTIAL | Phase 8 should reconcile them with verified contracts |
| `frontend/src/features/resumes/resumeApi.ts` | Resume and analysis fetch wrapper | PARTIAL | Delegate transport to the shared client before use |
| `frontend/src/features/resumes/ResumeWorkspace.tsx` | Local resume editor/preview/suggestion composition | PLACEHOLDER | Keep off active feature routes in Phase 5 |
| `frontend/src/features/resumes/ResumeEditor.tsx` | Controlled basic fields and explicit experience-editor placeholder | PLACEHOLDER | Phase 8 owns full editor integration |
| `frontend/src/features/resumes/ResumePreview.tsx` | Local content preview | PARTIAL | Phase 8 owns real record and design integration |
| `frontend/src/features/resumes/AiRecommendations.tsx` | Selection UI for stored suggestion IDs | PARTIAL | Phase 8 owns server integration |
| `frontend/src/features/resumes/resumeWorkspace.css` | Resume scaffold layout and responsive styles | IMPLEMENTED | Preserve for later feature work |
| `frontend/src/features/interviews/index.ts` | Interview feature exports | IMPLEMENTED | Keep |
| `frontend/src/features/interviews/types.ts` | Interview session, question, attempt, and input types | PARTIAL | Phase 10 should reconcile them with verified contracts |
| `frontend/src/features/interviews/interviewApi.ts` | Interview fetch wrapper | PARTIAL | Delegate transport to the shared client before use |
| `frontend/src/features/interviews/InterviewDashboard.tsx` | Example question, local attempts, and disconnected action logging | PLACEHOLDER | Keep off active feature routes; remove privacy-conflicting logging before connection |
| `frontend/src/features/interviews/SessionSetup.tsx` | Controlled session form with native constraints | PARTIAL | Phase 10 owns API submission and server errors |
| `frontend/src/features/interviews/QuestionPractice.tsx` | Local answer, notes, pin, and explanation interaction points | PARTIAL | Phase 10 owns server integration |
| `frontend/src/features/interviews/AttemptHistory.tsx` | Attempt and feedback rendering | PARTIAL | Phase 10 owns server integration |
| `frontend/src/features/interviews/interviewCoach.css` | Interview scaffold, form, state, and responsive styles | IMPLEMENTED | Preserve for later feature work |
| `frontend/src/features/learning/index.ts` | Learning feature exports | IMPLEMENTED | Keep |
| `frontend/src/features/learning/types.ts` | Learning document, chunk, message, flashcard, and quiz types | PARTIAL | Phase 12 should reconcile them with verified contracts |
| `frontend/src/features/learning/learningApi.ts` | Learning fetch wrapper | PARTIAL | Delegate transport to the shared client before use |
| `frontend/src/features/learning/LearningDashboard.tsx` | Example document, chunks, cards, quiz, and local interactions | PLACEHOLDER | Keep off active feature routes; remove development logging before connection |
| `frontend/src/features/learning/DocumentViewer.tsx` | Document summary and page-aware chunk rendering | PARTIAL | Phase 12 owns record and PDF integration |
| `frontend/src/features/learning/DocumentChat.tsx` | Controlled local chat form and message rendering | PARTIAL | Phase 12 owns server and job integration |
| `frontend/src/features/learning/FlashcardStudy.tsx` | Local reveal and navigation state | IMPLEMENTED | Preserve for Phase 12 |
| `frontend/src/features/learning/QuizTaker.tsx` | Local answer selection and gated post-submission review | IMPLEMENTED | Preserve answer-key secrecy when connected in Phase 12 |
| `frontend/src/features/learning/learningWorkspace.css` | Learning scaffold, state, and responsive styles | IMPLEMENTED | Preserve for later feature work |
| `frontend/dist/` | Ignored generated build output present in the working directory | OUT_OF_SCOPE | Do not treat as source or modify in this audit |

## 5. Application entry and provider architecture

### Verified composition

- `frontend/index.html` supplies one `#root` element and loads `frontend/src/main.tsx`.
- `frontend/src/main.tsx`:
  - throws when the root element is absent;
  - uses React DOM `createRoot`;
  - wraps the application in `StrictMode`;
  - imports global styles;
  - renders `AppShell` directly.
- `frontend/src/AppShell.tsx` imports and renders `MainDashboard`, `ResumeWorkspace`, `InterviewDashboard`, and `LearningDashboard` in one continuous document.
- Feature CSS is imported by each top-level feature component.
- No competing entry file or second application root was found.

### Classification

| Concern | Classification | Evidence |
| --- | --- | --- |
| Root element and React mount | IMPLEMENTED | `frontend/index.html`, `frontend/src/main.tsx` |
| Strict mode | IMPLEMENTED | `frontend/src/main.tsx` |
| Root composition owner | PARTIAL | `frontend/src/AppShell.tsx` owns composition but not providers or routes |
| Root providers | MISSING | No context or provider exists under `frontend/src/` |
| Routing | MISSING | No router dependency or route usage |
| Authentication state | MISSING | No auth context, state owner, or bootstrap |
| Global error boundary | MISSING | No error-boundary component or route error element |
| Authenticated application shell | PLACEHOLDER | Current shell is a stacked showcase without navigation or route outlet |
| Competing entry structures | IMPLEMENTED | One entry and one root composition path were found |

## 6. Routing audit

### Current routing approach

- No routing library is declared in `frontend/package.json`.
- No `BrowserRouter`, `RouterProvider`, route object, `Routes`, `Route`, `Navigate`, `Outlet`, navigation hook, pathname switch, History API call, or link navigation exists under `frontend/src/`.
- The only statically reachable browser document is the implicit root page, which renders all four top-level modules.
- The three module buttons are disabled and do not navigate.
- Nested routes, protected routes, public-only routes, route loading, route errors, and not-found handling are `MISSING`.
- Mobile navigation is `MISSING`.
- Requires runtime verification: production-host fallback behavior for direct URL refresh cannot be established from this repository because no hosting configuration is in scope.

### Target-route comparison

| Target route | Current component evidence | Classification | Phase 5 minimum |
| --- | --- | --- | --- |
| `/login` | No login page or form | MISSING | Public-only login route |
| `/register` | No registration page or form | MISSING | Public-only registration route |
| `/dashboard` | `MainDashboard` exists but is mounted only in the root stack without auth | MISSING | Protected route with a factual Phase 5 landing state; Phase 6 owns dashboard connection |
| `/resumes` | Resume scaffold exists without routing or list behavior | MISSING | Protected deferred feature route without demo data |
| `/resumes/:resumeId` | `ResumeWorkspace` exists without route parameter or server connection | MISSING | Protected deferred feature route; Phase 8 owns record loading |
| `/interviews` | Interview scaffold exists without routing and uses local example state | MISSING | Protected deferred feature route without example records |
| `/interviews/:sessionId` | No route parameter handling | MISSING | Protected deferred feature route; Phase 10 owns record loading |
| `/learning` | Learning scaffold exists without routing and uses example records | MISSING | Protected deferred feature route without example records |
| `/learning/:documentId` | No route parameter handling | MISSING | Protected deferred feature route; Phase 12 owns record loading |
| `/settings` | No settings page | MISSING | Protected account/session page using verified auth state |

## 7. Authentication audit

### Current frontend state

- Authentication UI: `MISSING`.
- Authentication provider or context: `MISSING`.
- Login, registration, refresh, logout, and current-user frontend calls: `MISSING`.
- Session bootstrap: `MISSING`.
- Protected and public-only route guards: `MISSING`.
- Redirect of authenticated users away from login and registration: `MISSING`.
- Refresh deduplication: `MISSING`.
- Unauthorized retry after refresh: `MISSING`.
- Logout state clearing: `MISSING`.
- Access-token owner: `MISSING`. Feature API wrappers accept a token argument, but no mounted component supplies one.

### Token-storage evidence

- No `localStorage`, `sessionStorage`, IndexedDB, browser cookie write, `accessToken` state, or `refreshToken` state exists under `frontend/src/`.
- Current unsafe token persistence: not found.
- Feature API wrappers attach a caller-supplied access token to `Authorization: Bearer ...`.
- `MainDashboard` accepts an optional access token, but `AppShell` mounts it without one.

### Verified backend contract

- `POST /api/v1/auth/register`, `login`, and `refresh` return a public user and access token in JSON and set a rotating refresh cookie.
- The refresh cookie is `HttpOnly`, uses `SameSite=Lax`, is secure in production, and is scoped to `/api/v1/auth`.
- `POST /api/v1/auth/logout` revokes the presented refresh session, clears the cookie, and returns 204.
- `GET /api/v1/users/me` exists and requires a Bearer access token.
- Evidence: `backend/src/modules/auth/`, `backend/src/modules/users/`, and `backend/src/middleware/authenticate.ts`.

### Security and privacy conflicts

- `frontend/src/features/interviews/InterviewDashboard.tsx` logs the complete create-session input. That input can include a job description, which conflicts with the repository rule that job descriptions and user-generated content must not be logged.
- `frontend/src/features/learning/LearningDashboard.tsx` logs the selected `File` object. This can expose a private filename and file metadata in browser developer tools.
- `frontend/src/features/resumes/ResumeWorkspace.tsx` logs selected suggestion IDs. It does not log resume text, but it is still a disconnected development action and must not be the production apply path.
- Phase 5 requirement: do not expose these interactive scaffolds as production feature routes. Remove or replace development logging when each feature is connected in its owning phase.

## 8. API-client audit

### Existing patterns

| Pattern | Classification | Evidence |
| --- | --- | --- |
| One base URL source | DUPLICATED | `VITE_API_URL` plus the same fallback appears in four feature API files |
| One shared transport | MISSING | Each feature declares its own `request` function |
| Credentials | PARTIAL | All four wrappers use `credentials: "include"` |
| Bearer handling | DUPLICATED | All four wrappers build the Authorization header from a token argument |
| JSON headers | PARTIAL | Three wrappers set JSON content type; dashboard performs GET only |
| Form data | IMPLEMENTED | Resume and learning wrappers omit JSON content type for `FormData` |
| Error message extraction | DUPLICATED | All wrappers parse `body.error.message` independently |
| Error code/status/request ID | MISSING | Thrown `Error` values discard structured code, status, details, and request ID |
| Success envelope handling | INCONSISTENT | Dashboard unwraps `data`; the other wrappers return asserted response JSON |
| Runtime response validation | MISSING | Generic assertions trust external JSON |
| Refresh on 401 | MISSING | No refresh call or retry path |
| Retry bound | MISSING | No retry mechanism |
| Request cancellation | MISSING | No `AbortSignal` parameter reaches `fetch` |
| Stale-response protection | PARTIAL | `MainDashboard` ignores late results with a boolean but does not abort the request |
| API mocks | MISSING | No mock transport; demo state lives in components |

### Important contract mismatch

- `packages/shared-types/src/index.ts` defines an API envelope but is not imported by the frontend.
- The shared `ApiFailure` type omits the backend's `error.requestId` and optional `error.details`.
- Resume, Interview, and Learning wrappers return `response.json()` as an asserted generic. Backend endpoints use `{ success, data }` envelopes, so future consumers can receive the envelope when they expect domain data unless the shared client defines one canonical unwrapping rule.

## 9. State-management audit

- Current convention: component-local `useState`, with `useEffect` for dashboard fetching and `useMemo` for derived collections.
- Context: `MISSING`.
- Reducers: `MISSING`.
- External client-state store: `MISSING`.
- Server-state library: `MISSING`.
- URL state: `MISSING`.
- Global mutable state: not found.
- Auth-state owner: `MISSING`.
- API/server-state owner: feature-local in `MainDashboard`; absent or simulated elsewhere.
- Resume editor state is local to `ResumeWorkspace`.
- Interview question and attempt state is local placeholder state in `InterviewDashboard`.
- Learning message and quiz-review state is local example state in `LearningDashboard`.
- `MainDashboard` has a reasonable feature-local loading/data/error split, but it cannot fetch in the current mounted composition because no access token is supplied.
- Phase 5 suitability: React context plus reducer or explicit state transitions is sufficient for the small auth lifecycle. Redux, Zustand, TanStack Query, and SWR are not justified by verified Phase 5 complexity.

## 10. Types and contracts audit

### Verified findings

- Strict TypeScript is enabled in `frontend/tsconfig.json`.
- No explicit `any`, `Record<string, any>`, or `as unknown as` appears under `frontend/src/`.
- The frontend does not import `@career-learning-hub/shared-types`.
- Feature DTOs live in four local `types.ts` files.
- API wrappers use generic assertions at the external boundary:
  - `response.json() as Promise<T>` in Resume, Interview, and Learning;
  - `as ApiEnvelope<T>` in Dashboard;
  - `undefined as T` for 204 responses in three wrappers.
- `SessionSetup` casts a select value to `InterviewMode` without runtime validation.
- Route parameter types do not exist because routing does not exist.
- Auth request, auth response, public-user, structured frontend error, and request-ID-aware types are `MISSING`.

### Shared-contract gap

- `packages/shared-types/src/index.ts` currently contains only generic success and failure envelopes.
- `ApiFailure` does not match the current backend error contract because `requestId` and optional validation details are absent.
- Phase 5 should extend this existing file rather than define another competing API envelope.
- Inference: feature-local domain interfaces may match current responses, but this audit did not perform a full backend domain-contract comparison. Their runtime accuracy remains `UNCLEAR_REQUIRES_VERIFICATION` for the owning feature phases.

## 11. Component and page architecture

### Current structure

- Route-level pages directory: `MISSING`.
- Authenticated layout: `MISSING`.
- Navigation component: `MISSING`.
- Public authentication layout: `MISSING`.
- Shared error/loading/not-found route components: `MISSING`.
- `AppShell` is the only root composition component.
- `DashboardLayout` is a reusable layout only within the dashboard feature.
- Feature folders keep CSS, types, API wrappers, and presentation components together.
- Presentation and local interaction state are separated into several focused components, but top-level feature dashboards still own placeholder/demo state and disconnected actions.

### Reuse assessment

- Reuse in Phase 5:
  - root mount and `StrictMode` from `frontend/src/main.tsx`;
  - typography, spacing, surfaces, button language, and responsive patterns from current CSS;
  - semantic form patterns from `SessionSetup` and `DocumentChat`;
  - dashboard feature components only after Phase 6 connects real auth-aware data.
- Do not expose in Phase 5:
  - Resume, Interview, and Learning top-level scaffolds with example or disconnected state.
- Do not create a new design system or install shadcn.
- `MainDashboard` is 299 lines and combines fetching with several rendering sections. It is not a Phase 5 refactor target; Phase 6 can reassess its boundaries when it is connected.

## 12. Styling and responsive architecture

### Current approach

- One global stylesheet: `frontend/src/styles.css`.
- One global, non-module stylesheet per feature.
- No CSS modules, CSS-in-JS library, utility framework, or inline styling system. One score-width value is set with a React inline style.
- Global `:root` sets the font stack and base colors but defines no reusable CSS custom-property token set.
- Colors, borders, radii, shadows, spacing, and button rules are repeated as literal values across feature styles.
- The visual language is coherent: light neutral background, white surfaces, rounded borders, muted text, and one accent per feature.

### Responsive evidence

- Breakpoints exist at 680, 700, 760, 800, 980, 1100, and 1120 pixels.
- Grid layouts collapse from multi-column to one or two columns.
- Dashboard trend rows, learning sticky chat, resume editor, interview form, and headings have targeted narrow-screen rules.
- Body has a 320-pixel minimum width.
- Mobile navigation behavior is `MISSING` because navigation does not exist.
- `:focus` and `:focus-visible` rules are `MISSING`; browser defaults have not been suppressed.

### Phase 5 direction

- Preserve the existing color, typography, spacing, border, and surface language.
- Add a small set of root tokens only where the new shell/auth styles need repeated existing values. Do not convert all feature CSS.
- Add explicit keyboard focus, desktop navigation, and an accessible mobile menu.
- Requires browser verification: focus visibility, contrast, menu behavior, 320-pixel overflow, sticky layout, and zoom behavior.

## 13. Forms and validation

- Existing forms are controlled React forms.
- Native constraints are used: `required`, `type="email"`, `maxLength`, and disabled-submit checks.
- Labels wrap their controls, providing static label association.
- `QuizTaker` uses `fieldset` and `legend` for radio groups.
- No form library exists.
- No frontend schema library exists.
- No shared field-error type, field-error component, server validation mapping, or form-level error region exists.
- No auth form exists.
- Duplicate-submission protection is only available through optional `busy` props, but current top-level placeholders do not drive those props.
- Phase 5 minimum:
  - controlled login and registration forms;
  - native constraints plus small explicit validation functions;
  - associated field messages;
  - one form-level API error with request ID;
  - busy state that disables duplicate submission;
  - no form or schema dependency unless implementation evidence shows manual validation is unsafe or duplicative.

## 14. Asynchronous UI states

| State | Existing support | Classification | Phase 5 action |
| --- | --- | --- | --- |
| Session bootstrap | None | MISSING | Add one full-shell bootstrap state |
| Initial data loading | Dashboard message only | FEATURE_LOCAL | Add auth bootstrap; leave domain loading to owning phases |
| Action loading | Optional `busy` props in several components | PARTIAL | Drive login, registration, refresh, and logout busy states |
| Empty state | Present in all four feature areas | FEATURE_LOCAL | Add factual deferred-route and auth-empty states |
| Field validation error | Native constraints only | PARTIAL | Add associated auth field errors |
| API error | Dashboard string alert only | FEATURE_LOCAL | Add normalized auth/route error with request ID |
| Authentication expiry | None | MISSING | Refresh once, then clear state and redirect |
| Success feedback | Quiz review only; no auth feedback | INCONSISTENT | Add minimal registration/login/logout transitions, not toast infrastructure |
| Retry | None | MISSING | Permit one request retry only after successful refresh |
| Disabled actions | Present in feature controls | FEATURE_LOCAL | Add to auth forms and mobile menu actions where relevant |
| Request cancellation | No `AbortController` transport support | MISSING | Accept `AbortSignal` in the shared client |
| Stale request handling | Boolean ignore flag in dashboard | PARTIAL | Prefer real cancellation for obsolete Phase 5 requests |
| Not found | None | MISSING | Add a route-level not-found page |
| Unauthorized | No frontend state | MISSING | Refresh or redirect to login |
| Forbidden | No frontend state | MISSING | Render normalized safe error without exposing ownership details |

## 15. Accessibility observations

### Current strengths

- `frontend/index.html` declares `lang="en"` and a viewport.
- The root uses `header` and `main`.
- Feature sections use headings and `aria-labelledby` or `aria-label` in many places.
- Dashboard API errors use `role="alert"`.
- Inputs generally have wrapping labels.
- Quiz choices use `fieldset`, `legend`, and native radio inputs.
- Interactive elements are native buttons, inputs, textareas, and selects.

### Phase 5 requirements

- Add a `nav` landmark with real links, not buttons that imitate navigation.
- Add a skip link and one clear main-content target.
- Add explicit `:focus-visible` styles.
- Give the mobile menu an accessible name, expanded state, and keyboard-operable close behavior.
- Associate auth field errors with inputs and announce submission errors.
- Move focus or otherwise announce route/session transitions where needed.
- Preserve native button and link semantics.

### Later Phase 16 items

- Measure color contrast and focus visibility.
- Review heading levels within nested feature sections.
- Review the visually hidden file-input technique in `LearningDashboard`.
- Review score-track and status semantics.
- Review zoom, reduced motion if motion is later added, and long-content overflow.

### Requires browser verification

- Keyboard order and visible focus across all controls.
- Mobile-menu focus behavior.
- 320-pixel layout and text zoom.
- Sticky chat behavior and overflow.
- Screen-reader announcement behavior.
- No browser-level accessibility compliance claim is made.

### Blocking accessibility gaps

- No static source finding blocks completion of this documentation audit.
- Accessible navigation and auth error handling are Phase 5 requirements, not optional hardening.

## 16. Testing capability

### Current capability

- The frontend manifest has no test script.
- No frontend test, test setup, Vitest config, Jest config, DOM environment, Testing Library, or browser-test configuration exists.
- Vitest is installed only as a backend workspace development dependency and is configured under `backend/`.
- Root test scripts run backend suites only.
- The Phase 3 production build and typecheck passed, but that does not test frontend behavior.

### Missing capability

- Auth state-transition tests.
- Refresh-deduplication and one-retry tests.
- Request-ID and cancellation tests.
- Route-guard and redirect tests.
- Login and registration interaction tests.
- Application-shell navigation tests.

### Phase 5 minimum

- Add a frontend `test` script using Vitest.
- Add a DOM test environment and Testing Library support.
- Test the shared API client without real network access.
- Test provider bootstrap, login, logout, refresh failure, and concurrent refresh.
- Test protected and public-only routing through an in-memory router.
- Keep browser E2E and multi-viewport suites deferred to Execution Phase 14.

## 17. Relevant backend contracts

| Operation | Endpoint | Method | Credentials | Response evidence | Error evidence |
| --- | --- | --- | --- | --- | --- |
| Register | `/api/v1/auth/register` | POST | `credentials: include` is required to receive the refresh cookie | 201, `{ success: true, data: { user, accessToken } }` | Normalized error envelope; validation and duplicate-email codes |
| Login | `/api/v1/auth/login` | POST | `credentials: include` is required to receive the refresh cookie | 200, `{ success: true, data: { user, accessToken } }` | `INVALID_CREDENTIALS` or other normalized error |
| Refresh | `/api/v1/auth/refresh` | POST | `credentials: include`; refresh token comes from the HttpOnly cookie | 200, `{ success: true, data: { user, accessToken } }`; cookie rotates | 401 normalized errors such as missing, invalid, expired, reused, or unavailable session |
| Logout | `/api/v1/auth/logout` | POST | `credentials: include`; logout is idempotent | 204, no body; refresh cookie cleared | Unexpected failures use normalized error handling |
| Current user | `/api/v1/users/me` | GET | Bearer access token | 200, `{ success: true, data: { user } }` | 401 normalized authentication error |

### Public-user shape

- Verified fields:
  - `id`
  - `email`
  - `profile` with display name and optional headline, timezone, and locale
  - `roles`
  - `accountStatus`
  - optional email verification date
  - created and updated dates
- Evidence: `backend/src/modules/users/user.model.ts`.

### Cookie, CORS, and request-ID behavior

- Refresh cookie:
  - `HttpOnly`;
  - secure in production;
  - `SameSite=Lax`;
  - scoped to `/api/v1/auth`;
  - rotated on refresh.
- CORS:
  - exact configured origins;
  - credentialed browser requests supported;
  - Authorization, content type, and `X-Request-Id` are allowed;
  - `X-Request-Id` is exposed.
- Request IDs:
  - accepted client IDs must match the backend safe pattern;
  - otherwise the backend generates a UUID;
  - the response header carries `X-Request-Id`;
  - normalized errors also include `error.requestId`.
- Error shape:
  - `{ success: false, error: { code, message, requestId, details? } }`.
- Ownership behavior:
  - frontend guards improve navigation but do not replace backend authentication or ownership checks.

## 18. Placeholder and scaffold inventory

| Path | Evidence | Classification | Recommended phase |
| --- | --- | --- | --- |
| `frontend/src/AppShell.tsx` | Three disabled “Foundation active” module cards and every scaffold rendered together | INTENTIONAL_SCAFFOLD | Replace root composition in Phase 5 |
| `frontend/src/features/dashboard/MainDashboard.tsx` | Safe no-token integration message; no fabricated scores | INTENTIONAL_SCAFFOLD | Connect real data in Phase 6 |
| `frontend/src/features/resumes/ResumeWorkspace.tsx` | Starter content/design, disconnected save/apply actions | DEVELOPMENT_PLACEHOLDER | Phase 8 |
| `frontend/src/features/resumes/ResumeEditor.tsx` | Explicit “Experience editor placeholder” text | DEVELOPMENT_PLACEHOLDER | Phase 8 |
| `frontend/src/features/interviews/InterviewDashboard.tsx` | Example question, placeholder IDs, local attempts, action logs | PRODUCTION_RISK | Keep off routes in Phase 5; replace in Phase 10 |
| `frontend/src/features/learning/LearningDashboard.tsx` | Example document/chunks/cards/quiz and local correctness review | PRODUCTION_RISK | Keep off routes in Phase 5; replace in Phase 12 |
| `frontend/src/features/resumes/AiRecommendations.tsx` | “Verify facts and placeholders” is an instruction about AI output | FALSE_POSITIVE | Keep |
| `frontend/src/features/interviews/SessionSetup.tsx` | Input `placeholder` attributes are user hints | FALSE_POSITIVE | Keep |
| `frontend/src/features/learning/DocumentChat.tsx` | Input `placeholder` attribute is a user hint | FALSE_POSITIVE | Keep |
| `frontend/src/features/interviews/types.ts` | `mock-interview` is a legitimate mode name | FALSE_POSITIVE | Keep |
| Four feature API modules | Typed endpoints exist but most are not imported by components | LATER_PHASE_SCOPE | Shared transport in Phase 5; feature integration in Phases 6, 8, 10, and 12 |

## 19. Duplication and dead-code candidates

| Path or pattern | Classification | Evidence | Required verification |
| --- | --- | --- | --- |
| Four feature-local `request` functions | VERIFIED_DUPLICATION | Same fetch, credentials, Bearer, error parsing, and base URL pattern | Replace with shared transport in Phase 5; test each request behavior |
| Four `API_BASE_URL` constants | VERIFIED_DUPLICATION | Same variable and fallback in each API file | Shared-client tests and build in Phase 5 |
| Local `ApiEnvelope` versus shared API types | POSSIBLE_DUPLICATION | Dashboard defines a local envelope; shared package defines generic envelopes | Reconcile backend error fields before removal |
| Resume, Interview, and Learning API exports | VERIFIED_UNUSED | No frontend source imports these API functions | Keep as intentional integration scaffolds; do not delete |
| `fetchProgressSnapshot` and `fetchDashboardActivity` | VERIFIED_UNUSED | Exported but not imported under `frontend/src/` | Keep for Phase 6 unless contract review supersedes them |
| Feature `index.ts` barrel files | KEEP | Root composition imports feature exports; barrels are small | No deletion required |
| Repeated button, panel, form, and empty-state CSS | POSSIBLE_DUPLICATION | Similar declarations occur across three feature styles | Phase 13 must confirm real shared behavior before consolidation |
| `AppShell` module-card CSS | POSSIBLY_UNUSED after Phase 5 | It is used by the current scaffold | Remove only if Phase 5 root replacement makes it unreachable |
| `frontend/dist/` | KEEP | Ignored build output from the prior verified build | Never edit or stage as source |

## 20. Gap analysis for Phase 5

| Capability | Current state | Gap | Priority | Risk |
| --- | --- | --- | --- | --- |
| Routing | Absent | No path mapping, parameters, errors, or not-found state | BLOCKER | High |
| Auth state | Absent | No user/token/session owner | BLOCKER | High |
| Session bootstrap | Absent | Refresh cookie is never used | BLOCKER | High |
| Login | Absent | No UI or call | BLOCKER | High |
| Registration | Absent | No UI or call | BLOCKER | High |
| Logout | Absent | No UI, revoke call, or state clear | REQUIRED | High |
| Protected routes | Absent | Scaffolds are public at root | BLOCKER | High |
| Public-only routes | Absent | No redirect for authenticated users | REQUIRED | Medium |
| Shared API client | Four duplicated wrappers | No canonical transport or error model | BLOCKER | High |
| Refresh deduplication | Absent | Concurrent 401s can cause refresh-token rotation races | BLOCKER | High |
| One retry | Absent | Expired access tokens fail without recovery | REQUIRED | High |
| Request-ID preservation | Absent | Support cannot correlate frontend errors | REQUIRED | Medium |
| Cancellation | Absent | Obsolete requests still consume network and parsing | SUPPORTING | Medium |
| Application shell | Stacked scaffold | No route outlet or user navigation | BLOCKER | High |
| Desktop navigation | Absent | No feature or account navigation | REQUIRED | Medium |
| Mobile navigation | Absent | No narrow-screen navigation | REQUIRED | Medium |
| Loading/error/empty states | Feature-local fragments | No shared auth/route states | REQUIRED | Medium |
| Frontend tests | Absent | Auth and client invariants have no automated coverage | BLOCKER | High |
| Runtime boundary validation | Assertions only | Auth and error JSON are trusted | REQUIRED | High |
| Domain feature connection | Historical scaffolds | Owned by later phases | DEFERRED | Keep example data off Phase 5 routes |

## 21. Minimal Phase 5 architecture

### Recommended solution

1. Add `react-router-dom` as the one routing dependency.
   - Define the route tree once.
   - Use nested protected routes under the existing `AppShell`.
   - Use public-only guards for login and registration.
   - Add one route error/not-found component.
2. Add one authentication provider.
   - Own `status`, `user`, and the access token in React memory.
   - Bootstrap by calling the verified refresh endpoint with credentials.
   - Never write either token to persistent browser storage.
3. Add one shared `fetch` client.
   - Read `VITE_API_URL` once.
   - Include credentials.
   - Attach the current access token through provider-supplied callbacks.
   - Parse the canonical envelope and throw a structured frontend error.
   - Preserve HTTP status, backend code, safe message, request ID, and optional validation details.
   - Accept an `AbortSignal`.
4. Coordinate refresh centrally.
   - Hold one in-flight refresh promise.
   - On an eligible 401, await that promise.
   - Retry the original request at most once after refresh succeeds.
   - Never retry login, registration, refresh, or logout recursively.
   - Clear provider state when refresh fails.
5. Keep feature scope bounded.
   - Route `/dashboard`, Resume, Interview, and Learning paths to factual deferred states in Phase 5.
   - Do not expose current example records or disconnected action logs.
   - Later feature phases can replace each deferred element without changing auth, routing, or transport.
6. Add a small frontend test foundation.
   - Use Vitest and a DOM Testing Library environment.
   - Cover transport, refresh, provider, guards, and auth forms.
   - Defer browser E2E to Phase 14.

### Rejected alternatives

- Hand-written History API routing:
  - Rejected because parameters, nested layouts, guards, navigation semantics, not-found behavior, and route errors create more project-owned code than one focused dependency.
- Redux, Zustand, or a server-state library:
  - Rejected because verified Phase 5 state is one auth session plus form-local state.
- Axios:
  - Rejected because the platform `fetch` API already supports headers, credentials, abort signals, and the required retry wrapper.
- A form library or frontend schema library:
  - Rejected for Phase 5 because two small auth forms and narrow auth-envelope guards can be implemented safely without another runtime dependency.

## 22. Exact Phase 5 file plan

### Existing files to modify

| Path | Purpose | Smallest expected change |
| --- | --- | --- |
| `frontend/package.json` | Declare Phase 5 runtime and test capability | Add the existing `@career-learning-hub/shared-types` workspace package, `react-router-dom`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/dom`, and `@testing-library/user-event` plus a frontend test script |
| `package-lock.json` | Reproduce approved dependency resolution | Update only through the approved Phase 5 install |
| `packages/shared-types/src/index.ts` | Reuse the canonical API contract | Add backend-aligned request ID/details fields and public auth/user DTOs |
| `frontend/src/main.tsx` | Root provider composition | Keep `StrictMode`; mount the auth provider and router |
| `frontend/src/AppShell.tsx` | Authenticated application shell | Replace stacked scaffolds with header, desktop/mobile navigation, logout, main outlet, and user context |
| `frontend/src/styles.css` | Existing visual language | Replace orphaned scaffold-root rules and add auth, shell, navigation, focus, and responsive states |
| `frontend/src/features/dashboard/dashboardApi.ts` | Remove duplicated transport | Delegate requests to the shared client; keep query construction |
| `frontend/src/features/resumes/resumeApi.ts` | Remove duplicated transport | Delegate requests to the shared client; keep endpoint-specific functions |
| `frontend/src/features/interviews/interviewApi.ts` | Remove duplicated transport | Delegate requests to the shared client; keep endpoint-specific functions |
| `frontend/src/features/learning/learningApi.ts` | Remove duplicated transport | Delegate requests to the shared client; keep endpoint-specific functions |

### New files to create

| Path | Purpose | Why an existing file cannot own it |
| --- | --- | --- |
| `frontend/src/api/apiClient.ts` | Canonical base URL, credentials, Bearer attachment, structured errors, refresh deduplication, one retry, and cancellation | Transport is cross-feature infrastructure and does not belong to one feature API module |
| `frontend/src/api/apiClient.test.ts` | Test headers, envelopes, request IDs, abort signals, concurrent refresh, retry bound, and refresh failure | No frontend transport test location exists |
| `frontend/src/features/auth/authApi.ts` | Typed register, login, refresh, logout, and current-user calls through the shared client | Auth endpoints are feature-specific, while transport remains shared |
| `frontend/src/features/auth/AuthProvider.tsx` | In-memory token, public user, bootstrap status, auth actions, and client callbacks | `AppShell` should consume session state, not own token lifecycle |
| `frontend/src/features/auth/AuthProvider.test.tsx` | Test bootstrap, login, registration, logout, and failed refresh state transitions | No existing provider test owner exists |
| `frontend/src/features/auth/AuthRoute.tsx` | Protected and public-only route guards with deterministic loading/redirect behavior | Guard logic is shared by multiple routes and should not be duplicated in pages |
| `frontend/src/features/auth/LoginPage.tsx` | Controlled login form and normalized submission errors | No authentication page exists |
| `frontend/src/features/auth/RegisterPage.tsx` | Controlled registration form and password requirements | No authentication page exists |
| `frontend/src/features/auth/SettingsPage.tsx` | Protected public-user/session view and logout control | No settings route or account page exists |
| `frontend/src/routing/router.tsx` | Single target-route map, nested shell, guards, redirect, deferred routes, and route errors | Route ownership does not belong in `main.tsx` or a feature |
| `frontend/src/routing/router.test.tsx` | Test target paths, guards, redirects, parameters, and not-found behavior | No routing test owner exists |
| `frontend/src/routing/DeferredFeaturePage.tsx` | Factual no-data placeholder for later feature phases | Current feature dashboards contain example or disconnected state and must not be exposed |
| `frontend/src/routing/RouteErrorPage.tsx` | Safe route error and not-found rendering | No route-level error component exists |
| `frontend/src/test/setup.ts` | DOM matcher and test cleanup setup | No frontend test setup exists |
| `frontend/vitest.config.ts` | Frontend-only DOM test configuration | Backend Vitest configuration is coupled to backend test infrastructure |

### Files explicitly not to modify in Phase 5

- Backend production source and backend authentication contracts.
- `docs/planning/DECISION_LOG.md` unless a genuinely new decision is approved.
- Resume presentation and editor components:
  - `frontend/src/features/resumes/ResumeWorkspace.tsx`
  - `frontend/src/features/resumes/ResumeEditor.tsx`
  - `frontend/src/features/resumes/ResumePreview.tsx`
  - `frontend/src/features/resumes/AiRecommendations.tsx`
- Interview presentation components:
  - `frontend/src/features/interviews/InterviewDashboard.tsx`
  - `frontend/src/features/interviews/SessionSetup.tsx`
  - `frontend/src/features/interviews/QuestionPractice.tsx`
  - `frontend/src/features/interviews/AttemptHistory.tsx`
- Learning presentation components:
  - `frontend/src/features/learning/LearningDashboard.tsx`
  - `frontend/src/features/learning/DocumentViewer.tsx`
  - `frontend/src/features/learning/DocumentChat.tsx`
  - `frontend/src/features/learning/FlashcardStudy.tsx`
  - `frontend/src/features/learning/QuizTaker.tsx`
- Dashboard presentation components. Phase 6 owns real dashboard connection.
- Feature CSS files. Phase 13 owns measured cross-feature consolidation.
- Migration, AI, storage, resume, interview, learning, dashboard backend domains, and all legacy projects.

## 23. Dependency decision table

| Capability | Existing dependency | Need | Decision | Rationale |
| --- | --- | --- | --- | --- |
| Routing | None | Parameters, nested shell, guards, redirects, errors, and not-found behavior | ADD_IN_PHASE_5 | Add `react-router-dom`; one focused router is smaller and safer than a project-owned router, with one runtime dependency to maintain |
| Form handling | React controlled inputs and browser validation | Two small auth forms | USE_PLATFORM_API | Existing React and HTML behavior is sufficient; no new maintenance cost |
| Schema validation | None in frontend | Validate narrow auth/error boundaries | USE_PLATFORM_API | Small type guards are sufficient for Phase 5; revisit only when later complex domain schemas are connected |
| Server-state handling | None | Auth bootstrap and session actions only | NOT_REQUIRED | Provider state is sufficient; adding a cache library would exceed verified scope |
| Shared API contracts | `@career-learning-hub/shared-types` exists but is unused by frontend | Align auth and error DTOs | REUSE_EXISTING | Add it as a frontend workspace dependency and extend the existing contract instead of duplicating types |
| HTTP client | Browser `fetch` | Credentials, Bearer, retry, errors, and cancellation | USE_PLATFORM_API | Fetch supports all verified requirements without Axios |
| Component testing | Vitest exists only in backend workspace | Fast frontend unit/component tests | ADD_IN_PHASE_5 | Add `vitest` to the frontend workspace so installs are reproducible; one test script and config to maintain |
| DOM testing | None | Render and query React behavior | ADD_IN_PHASE_5 | Add `jsdom`, `@testing-library/react`, and `@testing-library/dom`; test-only maintenance |
| User-event testing | None | Auth form and navigation interactions | ADD_IN_PHASE_5 | Add `@testing-library/user-event` for realistic interaction tests; test-only maintenance |
| Browser testing | None | Full workflows and viewports | DEFER | Execution Phase 14 owns browser E2E; Phase 5 still requires manual browser and visual QA |
| Iconography | None | Text navigation is sufficient | NOT_REQUIRED | Avoid a runtime package for decorative icons |
| CSS framework | None | Existing CSS already defines visual language | NOT_REQUIRED | Preserve current styling and avoid a second design system |
| React Vite plugin | Declared but unused | Not required for the architecture gap | DEFER | Do not add configuration solely to justify an existing package |

## 24. Phase 5 verification plan

### Targeted automated tests

- Shared API client:
  - reads the configured base URL once;
  - includes credentials;
  - attaches the latest in-memory access token;
  - preserves backend status, code, message, request ID, and details;
  - forwards `AbortSignal`;
  - shares one refresh promise across concurrent 401 responses;
  - retries each eligible request once;
  - does not recurse on auth endpoints;
  - clears auth state on refresh failure.
- Authentication provider:
  - starts in bootstrap state;
  - restores a session through refresh;
  - becomes anonymous after missing or invalid refresh;
  - stores the access token only in React memory;
  - handles login, registration, and logout.
- Routing:
  - anonymous users reach `/login` and `/register`;
  - anonymous users are redirected from protected routes;
  - authenticated users are redirected from public-only routes;
  - all ten target paths match;
  - route parameters are available without trusting them as validated domain IDs;
  - unknown paths render not found.
- Forms:
  - labels and errors are associated;
  - duplicate submissions are disabled;
  - safe API messages and request IDs are shown;
  - password values are never logged or persisted.

### Repository checks

- Run the new frontend tests first.
- Run root `npm run typecheck`.
- Run root `npm run build`.
- Run relevant existing backend auth tests because frontend work depends on those contracts.
- Do not claim root backend tests cover frontend behavior.

### Browser workflow

- Start frontend and backend using verified root commands.
- Test registration, refresh bootstrap, logout, login, protected redirects, public-only redirects, not found, and direct URL refresh.
- Inspect browser storage:
  - no access token;
  - no refresh token;
  - no auth object in local storage, session storage, or IndexedDB;
  - refresh cookie remains HttpOnly.
- Trigger concurrent protected requests with an expired access token and confirm one refresh plus at most one retry per request.
- Verify a failed refresh clears state and returns to login.
- Verify request IDs appear in safe frontend errors.

### Visual-QA checklist

- Desktop, tablet, and mobile application shell.
- Mobile menu keyboard behavior and visible focus.
- Login and registration default, validation, loading, error, and success transitions.
- Auth bootstrap loading state without protected-content flash.
- Deferred feature routes, settings, route error, and not-found states.
- Long display name, long safe error text, and request-ID wrapping.
- Human approval remains required before a Phase 5 commit.

## 25. Risks and open questions

### Blocking questions

- None for this audit.
- Phase 5 must receive the required Phase 4 approval before implementation.
- The routing and frontend-test dependency additions require normal Phase 5 review before install.

### Non-blocking risks

- Direct URL refresh depends on the eventual production host serving the SPA entry for application paths. The repository has no active hosting configuration to verify.
- The historical Learning document refers to a “selected server-state library,” but no server-state dependency exists in the manifest or lockfile for the frontend. Current evidence controls: no library is selected.
- Existing feature API wrappers have inconsistent envelope behavior. Delegation to the shared client must preserve endpoint return semantics deliberately.
- Extending `packages/shared-types/src/index.ts` helps Phase 5, but later feature DTO reconciliation remains separate work.
- The current feature CSS has similar patterns but no measured consolidation case for Phase 5.
- Current feature scaffolds include development logs and example state. They must remain off production feature routes until their owning phases remove or replace those paths.

### Carried-forward dependency risk

- The Phase 3 report records one high and one critical npm audit finding.
- No dependency audit or remediation command ran in Phase 4.
- Remediation remains outside this audit and must not be conflated with the proposed Phase 5 dependency review.

### Runtime behavior not verified

- No route, auth, API, form, responsive, accessibility, focus, contrast, direct-refresh, or browser-storage behavior was run.
- The prior Phase 3 report, not this audit, records passing root typecheck and production build.
- No claim is made that the existing feature API wrappers work in a browser.

## 26. Final recommendation

- Audit status: COMPLETE_WITH_GAPS.
- Execution Phase 5 is ready to begin only after human approval.
- Required prerequisites:
  - approve this evidence report and planning transition;
  - approve `react-router-dom` and the minimal Vitest, jsdom, and Testing Library dependencies;
  - preserve React/Vite, Express/TypeScript, MongoDB, shared types, the existing backend auth model, and the existing visual language;
  - keep access tokens in React memory and refresh tokens in the existing HttpOnly cookie;
  - keep deferred feature scaffolds and their development logs off active production feature routes;
  - do not activate later feature phases.
- Required human review token: `PHASE_4_FRONTEND_AUDIT_REVIEW_APPROVED`
- No file was staged or committed.
