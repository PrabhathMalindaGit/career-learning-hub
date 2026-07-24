# Current Execution Phase

- Phase: 6
- Name: Unified Dashboard
- Status: ACTIVE
- Controlling skill: `karpathy-guidelines`

## Required skills

- `karpathy-guidelines`
- `frontend-design`
- `frontend-skill`
- `build-web-apps:react-best-practices`
- `test-driven-development`
- `systematic-debugging`
- `graphify`
- `playwright`
- `lighthouse-verification`

## Objective

- Replace the factual deferred `/dashboard` route with a connected, authenticated dashboard.
- Present only actual owned resume, interview, learning-document, quiz, AI-usage, and activity records returned by the verified backend.
- Support the approved 7, 30, 90, and 365-day progress windows and bounded chronological activity pagination.
- Provide independent loading, empty, partial-data, error, retry, cancellation, and stale-response behavior for progress and activity.

## Inputs to inspect

- Root repository instructions, accepted decisions, the master plan, Phase 10 baseline report, frontend architecture audit, historical dashboard documentation, and the README.
- Root, frontend, lockfile, and shared-types manifests and contracts.
- The complete Phase 5 entry, authentication, routing, shared API-client, shell, style, and test foundation.
- Every current dashboard frontend file and call site.
- Bounded backend dashboard routes, controller, service, schemas, response types, ownership middleware, rate limiting, activity pagination, caching, tests, and relevant source models.

## In-scope work

- Transition Execution Phase 5 to `COMPLETED` and Execution Phase 6 to `ACTIVE`.
- Connect `/dashboard` to the real dashboard while preserving the Phase 5 protected route and authenticated shell.
- Add narrow dashboard response types and runtime validation without a schema dependency.
- Use the Phase 5 shared API client for progress and paginated activity requests.
- Implement independent progress and activity state, retry, request cancellation, and stale-response protection.
- Present verified metrics, recent trends, recent owned learning documents, AI estimate disclosures, and safe chronological activity.
- Add focused dashboard API and component tests.
- Run repository, local data-integrity, ownership, browser, responsive, keyboard, Lighthouse, and human visual verification.

## Out-of-scope work

- Resume Studio, Interview Coach, or Learning Workspace workflows and data-creation controls.
- Fabricated records, synthetic engagement scores, streaks, forecasts, recommendations, or unsupported aggregation.
- Backend production-source changes without a separately reported and authorized blocking defect.
- Authentication, ownership, shared-client, package, lockfile, migration, AI, storage, deployment, or global design-system changes.
- Another router, API client, state library, schema library, form library, UI library, icon library, CSS framework, database, or authentication provider.
- Legacy-project access and later-phase activation.

## Assumptions

- The approved branch is `phase-10-unified-frontend` and the approved starting HEAD is `2386c36`.
- The default dashboard window is 30 days.
- The UI requests up to 12 trend points, 6 recent documents, and a fixed bounded activity page size.
- Backend `Date` values are serialized as strings at the browser boundary.
- Current AI usage creation records one request per UsageEvent, allowing request count and estimated-cost event count to disclose complete versus partial estimates.
- Dashboard route guards improve navigation but never replace backend authentication, authorization, or ownership enforcement.

## Verified dashboard contracts

- `GET /api/v1/dashboard`
  - Accepts `windowDays` 7–365, `trendLimit` 3–30, `activityLimit` 1–50, and `recentDocumentLimit` 1–20.
  - Returns progress metrics plus recent activity.
- `GET /api/v1/dashboard/progress`
  - Accepts the same overview query and returns progress metrics without `recentActivity`.
- `GET /api/v1/dashboard/activity`
  - Accepts `page` at least 1, `limit` 1–100, and optional validated `type`, `origin`, and `resourceType`.
  - Returns `{ events, pagination: { page, limit, total, pages } }`.
  - Orders events by `occurredAt` descending and `_id` descending.
- Progress returns:
  - `generatedAt` and the selected `window`;
  - resume latest, previous, change, window aggregate, distinct count, and trend values;
  - interview window attempts, completed-feedback scores, session counts, and trend values;
  - current learning-document status counts and recent documents;
  - completed quiz window aggregates and trends;
  - AI request, status, token, latency, estimated-cost, feature, and daily aggregates.

## Data-integrity rules

- Preserve `null` for unavailable score and latency metrics; never turn absence into zero.
- Display factual count values, including zero.
- Do not infer scores for unfinished resume, interview, or quiz work.
- Do not fabricate metrics, records, trends, activity, costs, streaks, forecasts, or recommendations.
- Label USD cost values as estimates, distinguish partial estimates, and show `No cost estimates recorded` when appropriate.
- Preserve backend activity ordering and pagination metadata.
- Validate required structures, finite numeric values, nullable fields, dates, document statuses, activity items, groupings, trends, and pagination before rendering.
- Fail closed on malformed responses without logging response bodies.

## Security and privacy controls

- Access tokens remain in React memory and refresh tokens remain in the existing HttpOnly cookie.
- The shared API client continues to own credentials, Authorization, refresh deduplication, retry bounds, request IDs, and error normalization.
- Dashboard requests send no user ID.
- Backend authentication derives the user ID from server state and every dashboard aggregation is user-scoped.
- Preserve `Cache-Control: private, no-store`, `Pragma: no-cache`, and `Vary: Authorization, Cookie`.
- Do not display or log raw activity metadata, resource IDs, storage keys, filenames, resume content, job descriptions, interview answers, document text, prompts, quiz answers, tokens, cookies, passwords, secrets, or personal data.
- Unknown activity types receive a bounded safe fallback label.
- Do not weaken ownership or authentication.

## Exact deliverables

- Updated planning controls for the Phase 5 to Phase 6 transition.
- Reconciled feature-local dashboard types and narrow runtime response validation.
- Dashboard progress and paginated activity operations through the shared API client.
- Real protected dashboard route.
- Independent progress and activity state with retry, cancellation, and stale-response protection.
- Approved window controls, metrics, trends, recent documents, cost disclosure, safe activity, and pagination.
- Loading, empty, partial, success, and safe error presentation.
- Responsive and keyboard-operable dashboard presentation consistent with the authenticated shell.
- Focused API and component tests plus repository, browser, ownership, and Lighthouse evidence.

## Success criteria

- Phase 5 is `COMPLETED`, Phase 6 is `ACTIVE`, and Phases 7 through 21 remain `PLANNED`.
- `/dashboard` renders the connected dashboard only after authentication; Resume, Interview, and Learning routes remain deferred.
- All four approved windows request and display only their matching response.
- Progress and activity failures, retries, loading, cancellation, and stale-response behavior remain independent.
- Activity pagination stays within server-provided boundaries and preserves returned order.
- Null scores remain unavailable, factual zeros remain zero, and no fabricated value appears.
- AI estimates are disclosed as complete, partial, or unrecorded according to backend evidence and are never called billing.
- Malformed dashboard responses fail safely and structured request IDs remain available.
- User B cannot see User A metrics or activity.
- Required tests, typecheck, backend suites, build, browser checks, responsive checks, keyboard checks, and bounded Lighthouse review complete.
- Human visual QA is approved before final implementation review or commit authorization.

## Verification commands

- `npm run test --workspace @career-learning-hub/web`
- `npm run typecheck`
- `npm run test:unit`
- `npm run test:integration`
- `npm run test:security`
- `npm run build`
- Do not run coverage, the combined CI command, `npm update`, or any audit-fix command without separate authorization.

## Browser-verification requirements

- Start the backend with `npm run dev:backend` and the frontend with `npm run dev:frontend` after automated checks pass.
- Report the actual selected URLs and verify backend readiness.
- Verify anonymous redirect, authenticated rendering, refresh bootstrap, logout, all four windows, rapid switching, independent retries, pagination boundaries, rapid pagination, safe unknown activity, request IDs, and unchanged deferred routes.
- Use only synthetic local `.test` accounts and the local development database.
- Compare returned aggregates with owned records for 7, 30, 90, and 365 days.
- Confirm User B receives no User A metrics or activity.

## Visual-QA requirements

- Inspect dashboard headings, window controls, metrics, null states, large values, cost labels, trends, recent documents, activity, pagination, loading, empty, error, retry, and request-ID states.
- Inspect approximately 1440, 768, 390, and 320-pixel widths.
- Inspect skip link, dashboard navigation, window controls, retry controls, pagination, mobile menu, logout, natural tab order, and visible focus.
- Browser automation supports but does not replace human review.
- Required token: `PHASE_6_VISUAL_QA_APPROVED`.

## Failure-loop stop rule

- A root failure is one underlying cause that produces the same failing result.
- Make at most three code-changing repair attempts for the same root failure.
- Record each attempt's hypothesis, changed files, rerun command, and exact result.
- After the third unsuccessful attempt, stop modifying files, preserve the diff, report the exact failure and attempts, state the likely unresolved cause, and wait for human direction.
- Never weaken tests, TypeScript strictness, validation, authentication, authorization, ownership, privacy, or security controls.

## Human approval gates

- Gate 1: after automated, data-integrity, browser, responsive, keyboard, and Lighthouse verification, stop for `PHASE_6_VISUAL_QA_APPROVED`.
- Gate 2: after visual approval and final Git/content review, stop for `PHASE_6_IMPLEMENTATION_REVIEW_APPROVED`.
- Do not stage or commit at either gate.

## Next phase

- Execution Phase 7 — Resume Legacy Inspection.
- Do not activate Phase 7 automatically.
- Do not access any legacy project.

## Update rules

- Keep this file limited to Execution Phase 6 until both required human gates are satisfied and a later approved transition occurs.
- Do not fabricate metrics or records.
- Do not modify later feature workspaces.
- Do not weaken ownership or authentication.
- Do not stage or commit.
- Human visual QA is mandatory before commit.
