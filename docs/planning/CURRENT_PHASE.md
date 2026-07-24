# Current Execution Phase

- Phase: 5
- Name: Authentication, Routing and Shared API Infrastructure
- Status: ACTIVE
- Controlling skill: `karpathy-guidelines`

## Required skills

- `karpathy-guidelines`
- `backend-api-design`
- `frontend-skill`
- `modern-web-guidance`
- `build-web-apps:react-best-practices`
- `test-driven-development`
- `security-best-practices`
- `systematic-debugging`

## Objective

- Implement application routing, registration, login, refresh-cookie session bootstrap, logout, and in-memory access-token ownership.
- Add protected and public-only route behavior.
- Create one request-ID-aware fetch client with cancellation, refresh deduplication, and at most one retry after a successful refresh.
- Replace the stacked frontend showcase with an authenticated shell, desktop navigation, and accessible mobile navigation.
- Add factual deferred feature routes, a safe settings/session page, frontend unit and component test infrastructure, browser verification, and human visual QA.

## Inputs to inspect

- Root repository instructions, this current-phase control, accepted decisions, the master plan, the Phase 4 frontend architecture audit, the Phase 3 baseline report, relevant architecture and historical authentication/hardening documentation, and the README.
- Root, frontend, and shared-types manifests and TypeScript configuration.
- Frontend entry, composition, global styles, environment-variable name, existing feature API modules, and their call sites.
- Bounded backend authentication, current-user, public-user, refresh-cookie, normalized-error, request-ID, authentication-middleware, and CORS contracts.

## In-scope work

- Transition Execution Phase 4 to `COMPLETED` and Execution Phase 5 to `ACTIVE`.
- Add only the approved routing, shared-contract, and frontend-testing dependencies.
- Extend the existing shared API and authentication contracts.
- Implement one shared fetch client and migrate the four existing feature API modules to it without connecting their presentation components.
- Implement the authentication API, provider, in-memory session lifecycle, route guards, login, registration, logout, session bootstrap, and settings page.
- Implement the required route tree, safe redirects, not-found and route-error states, authenticated shell, desktop navigation, and accessible mobile navigation.
- Keep dashboard, Resume, Interview, and Learning routes factual and deferred without demo records or disconnected actions.
- Add and run Phase 5 frontend tests, repository verification, static token/logging review, local runtime inspection, browser workflow checks, responsive checks, keyboard checks, and human visual QA.

## Out-of-scope work

- The connected unified dashboard, Resume Studio, Interview Coach, Learning Workspace, or feature-domain data loading.
- Demo feature records, fabricated metrics, sample scores, example questions, example attempts, example documents, or example quizzes.
- A design-system rewrite, feature CSS consolidation, deployment, production-host routing configuration, migration work, or later-phase activation.
- Backend production-source, backend-contract, backend-test, security-control, or ownership-control changes.
- New state, server-state, form, schema, CSS, UI, or icon libraries beyond the approved dependency list.
- Legacy-project access.

## Assumptions

- The approved branch is `phase-10-unified-frontend`.
- The approved starting HEAD is `6b83f20`.
- `VITE_API_URL` remains the one frontend API-base configuration and the existing localhost fallback remains valid.
- Backend `Date` values are serialized as JSON strings at the browser boundary.
- Existing inactive feature API signatures may retain compatibility token parameters when changing them would require protected later-phase presentation edits.
- Frontend route guards improve navigation but never replace backend authentication, authorization, or ownership enforcement.

## Security and privacy controls

- Access tokens remain in React memory only and are never written to localStorage, sessionStorage, IndexedDB, cookies, URLs, DOM attributes, or logs.
- Refresh tokens remain only in the backend-issued HttpOnly cookie and are never read, mirrored, printed, or persisted by frontend JavaScript.
- Credentials, tokens, cookies, passwords, request bodies, resumes, job descriptions, interview answers, document text, filenames, file metadata, prompts, and personal data are never logged.
- The shared client centrally owns credentials, Bearer-header construction, error normalization, refresh deduplication, retry limits, and cancellation.
- Login, registration, refresh, and logout never recursively trigger refresh.
- Redirects accept only safe router-owned internal paths and fall back to `/dashboard`.
- External data is validated at trust boundaries; safe error messages and request IDs are preserved without rendering arbitrary validation details.
- Historical demo components remain unreachable from active Phase 5 routes.
- Backend CORS, rate limits, request validation, cookie attributes, authentication, authorization, ownership, request IDs, error normalization, and private caching remain unchanged.

## Approved dependencies

- Frontend runtime:
  - `react-router-dom`
  - `@career-learning-hub/shared-types` using the local workspace version
- Frontend development:
  - `vitest`
  - `jsdom`
  - `@testing-library/react`
  - `@testing-library/dom`
  - `@testing-library/user-event`
- Do not add Axios, Redux, Zustand, TanStack Query, SWR, React Hook Form, Formik, a frontend schema library, an icon library, a CSS framework, a UI component library, or Playwright.

## Exact deliverables

- Updated planning controls for the Phase 4 to Phase 5 transition.
- Updated frontend manifest and reproducible lockfile containing only approved dependency changes.
- Extended shared auth and API types.
- One canonical shared API client and its tests.
- Authentication API, provider, provider tests, route guards, login, registration, and settings pages.
- One route tree, route tests, factual deferred feature page, and safe route-error/not-found page.
- An authenticated application shell with desktop and accessible mobile navigation.
- Frontend Vitest configuration and Testing Library setup.
- Existing dashboard, Resume, Interview, and Learning API modules delegated to the shared client.
- Automated verification evidence, static security/privacy review, local browser evidence, and a human visual-QA checklist.

## Success criteria

- Phase 4 is `COMPLETED`, Phase 5 is `ACTIVE`, and Phases 6 through 21 remain `PLANNED`.
- All required public-only and protected paths match and apply the correct guard behavior.
- Authentication bootstraps through the refresh cookie without persisting either token.
- Concurrent eligible 401 responses share one refresh promise and each original request retries no more than once.
- Auth endpoints never recursively refresh and 403 responses never trigger refresh.
- Structured frontend errors preserve HTTP status, backend code, safe message, request ID, and optional details.
- Abort behavior remains distinguishable and request signals reach fetch.
- Auth response and public-user data are validated before entering React state.
- Login and registration prevent invalid and duplicate submissions and render safe, associated errors.
- Deferred routes display no fabricated or historical example records.
- Desktop, tablet, mobile, 320-pixel, keyboard, loading, validation, error, not-found, and authenticated states are inspected.
- Required frontend tests, root typecheck, backend integration tests, backend security tests, and production build pass.
- Human visual QA is approved before final Git review or commit authorization.

## Verification commands

- `npm install`
- `npm run test --workspace @career-learning-hub/web`
- `npm run typecheck`
- `npm run test:integration`
- `npm run test:security`
- `npm run build`
- Do not run coverage, the combined CI command, `npm update`, or any audit-fix command without separate authorization.

## Browser-verification requirements

- Start the backend with `npm run dev:backend` and the frontend with `npm run dev:frontend` only after automated checks pass.
- Report the actual selected URLs and verify backend liveness before browser authentication flows.
- Use synthetic local test data only and never disclose a test password.
- Verify root resolution, login, registration, protected-route redirects, registration, logout, login, cookie bootstrap after refresh, public-only redirects, all ten target routes, parameterized deferred routes, not found, settings, failed-refresh clearing, safe request-ID errors, direct Vite URL refresh, and no protected-content flash.
- Inspect localStorage, sessionStorage, IndexedDB, and JavaScript-accessible cookies for absence of access tokens, refresh tokens, serialized auth state, and passwords.

## Visual-QA requirements

- Inspect login, registration, bootstrap loading, authenticated shell, desktop and mobile navigation, settings, deferred pages, route errors, not found, validation errors, API errors, long display names, long safe errors, and request-ID wrapping.
- Inspect representative desktop, tablet, mobile, and 320-pixel viewports.
- Inspect tab order, visible focus, skip link, navigation links, mobile toggle, Escape behavior, focus return, logout, and form submission.
- Browser automation supports but does not replace human review.
- Required token: `PHASE_5_VISUAL_QA_APPROVED`.

## Failure-loop stop rule

- A root failure is one underlying cause that produces the same failing result.
- Make at most three code-changing repair attempts for the same root failure.
- Record each attempt's hypothesis, changed files, rerun command, and exact result.
- After the third unsuccessful attempt, stop modifying files, preserve the diff, report the exact failure and all attempts, state the likely unresolved cause, and wait for human direction.
- Never weaken tests, TypeScript strictness, validation, authentication, authorization, ownership, privacy, or security controls.

## Human approval gates

- Gate 1: after automated and browser verification, stop for `PHASE_5_VISUAL_QA_APPROVED`.
- Gate 2: after visual approval and final Git/content review, stop for `PHASE_5_IMPLEMENTATION_REVIEW_APPROVED`.
- Do not stage or commit at either gate.

## Next phase

- Execution Phase 6 — Unified Dashboard.
- Phase 6 must not be activated automatically.

## Update rules

- Keep this file limited to Execution Phase 5 until both required human gates are satisfied and a later transition is explicitly authorized.
- Do not stage or commit.
- Do not access legacy projects.
- Do not persist access or refresh tokens.
- Do not expose demo feature records.
- Do not weaken backend authentication or security controls.
- Do not activate Execution Phase 6 automatically.
- Human visual QA is mandatory before commit.
