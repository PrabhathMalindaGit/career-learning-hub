# Current Execution Phase

- Phase: 8
- Name: Resume Studio Implementation
- Status: ACTIVE
- Controlling skill: `karpathy-guidelines`

## Required skills

- `karpathy-guidelines`
- `frontend-design`
- `frontend-skill`
- `build-web-apps:react-best-practices`
- `test-driven-development`
- `systematic-debugging`
- `subagent-driven-development`
- `playwright`
- `lighthouse-verification`

## Resolved operator decisions

- Render one original neutral ATS preview using template ID `ats-classic`,
  page size `A4`, system typography, no profile photo, and
  `showProfilePhoto: false`.
- Do not expose template, palette, font, profile-photo, or page-size controls.
- Do not send `colorPaletteId` or `fontFamily` mutations and do not patch
  design merely to force defaults.
- Accept required target role and optional company and job description using
  exact backend bounds and clear AI-processing privacy text.
- Keep runtime transport validators feature-local without a schema dependency
  or shared-type change.
- Provide paginated immutable version metadata and read-only snapshots only;
  rich diff and restore are deferred.
- Poll import and analysis jobs with the approved bounded policy below.
- Narrow existing backend response objects at the frontend trust boundary by
  validating required fields and copying only allowlisted display fields.
- Analyse only the current saved canonical version. A dirty draft must be
  saved or discarded first.
- Preserve all loaded stable IDs. New unsaved entities use client-only React
  keys, omit persisted IDs where accepted, and adopt server-generated IDs from
  a successful canonical response.

## Objective

- Implement the authenticated Resume Studio in the active repository.
- Deliver factual list, create, open, canonical edit, immutable save, history,
  read-only snapshot, live preview, private PDF import, job polling, validated
  analysis, explicit stored suggestion selection, and atomic selected
  suggestion application journeys.
- Provide loading, empty, error, retry, validation, conflict, stale, timed-out,
  failed, cancelled, and completed states without fabricating records,
  progress, scores, findings, suggestions, history, or success.

## In-scope journeys

- Owned paginated resume list with previous and next navigation.
- Titled blank resume creation.
- Titled single-PDF import and owned import-job polling.
- Route-owned workspace loading by `/resumes/:resumeId`.
- Canonical basics, links, experience, education, skills, projects,
  certifications, languages, and interests editing.
- Accessible add, remove, move-up, and move-down controls for repeatable data.
- Exact stable-ID preservation and server adoption for new IDs.
- Explicit immutable manual save using the loaded current-version ID.
- Safe version-conflict recovery without overwrite or automatic retry.
- Paginated version history and isolated read-only historical snapshots.
- Fixed ATS Classic A4 preview of every supported populated section.
- Current-saved-version analysis request and owned analysis-job polling.
- Validated score breakdown, issues, strengths, missing keywords, and stored
  suggestions with careful model-generated guidance wording.
- Explicit non-empty suggestion selection, confirmation, and atomic apply.
- Cancellation and request-sequence protection for obsolete client work.
- Responsive, keyboard-operable, accessible browser behavior.

## Exclusions

- Resume rename, archive, delete, restore, duplication, bulk actions, and
  global search.
- Profile-photo upload or display.
- PDF export, download generation, OCR, public thumbnails, screenshot
  persistence, aggregate resume analytics, score trends, and global activity.
- Rich word or line diff, version restoration, or snapshot mutation.
- Automatic analysis, automatic re-analysis, edited or free-form suggestion
  submission, empty-selection-means-all behavior, and fallback text append.
- A new router, API client, state library, form library, validation dependency,
  authentication provider, backend, database, design system, or AI provider.
- Legacy source, assets, layouts, prompts, configuration, packages, fonts, or
  design identifiers.

## Controlling contracts

- Current backend implementation and tests control methods, paths, envelopes,
  IDs, field bounds, pagination, ownership, conflict codes, job types and
  statuses, analysis fields, suggestion semantics, upload rules, request IDs,
  and private caching.
- The route parameter is the sole workspace resume identity.
- The shared authenticated API client remains the only transport.
- Frontend operations send no user ID and accept `AbortSignal`.
- Resume route IDs, version IDs, analysis IDs, and job IDs use the backend
  Mongo identifier contract. Stable content and suggestion IDs use UUIDs.
- Manual save sends the exact loaded `expectedCurrentVersionId`.
- Analysis sends the current saved `versionId`.
- Suggestion apply sends only deduplicated selected stored UUIDs.
- A backend response that cannot be safely narrowed stops this phase for
  separate backend authorization.

## Expected write scope

Modified planning files:

- `docs/planning/CAREER_LEARNING_HUB_MASTER_PLAN.md`
- `docs/planning/CURRENT_PHASE.md`

Authorized application scope:

- `frontend/src/routing/router.tsx`
- `frontend/src/routing/router.test.tsx`
- `frontend/src/features/resumes/**`

Protected without separate authorization:

- `backend/**`
- `packages/**`
- `frontend/src/api/apiClient.ts`
- `frontend/src/features/auth/**`
- `frontend/src/AppShell.tsx`
- all package manifests and lockfiles
- environment files, migrations, assets, generated artifacts, fixtures,
  legacy projects, the decision log, and the execution template

## Security and privacy controls

- Treat resume content, contact details, links, uploaded PDFs, parsed text, job
  context, analysis results, suggestions, and version content as private
  personal data.
- Preserve server-derived ownership, safe owned-resource 404 behavior,
  private `no-store` responses, request IDs, memory-only access tokens,
  HttpOnly refresh cookies, private asset lifecycle, strict validation, and
  stored suggestion semantics.
- Never log private request content, filenames beyond necessary safe display,
  PDF text, job context, prompts, analysis output, suggestion IDs, tokens,
  cookies, owner IDs, storage keys, raw errors, or stack traces.
- Never persist resume, file, job, analysis, or token data in browser storage.
- Render no unknown response fields and discard persistence, owner, provider,
  prompt, storage, stack, and raw metadata fields.
- Use only marked synthetic `.test` records for runtime verification.
- Never read or print environment-file contents.

## Polling policy

- Poll after 1 second, then 2 seconds, then 3 seconds, then 5 seconds, and
  every 8 seconds thereafter.
- Stop automatic polling after five minutes from the accepted enqueue
  response, on `completed`, `failed`, or `cancelled`, on unmount, identity
  change, replacement, or surface departure.
- A five-minute client timeout pauses automatic checking; it does not mark the
  backend job failed. Keep the job ID only in component memory and expose an
  explicit status-check action.
- Preserve the last validated job state across transport failures. Stop after
  three consecutive transient failures, show a safe structured error and
  request ID where available, and expose explicit retry.
- Stop immediately on authenticated 403, owned-resource 404, malformed job
  response, wrong job type, or missing or mismatched completed identifiers.
- Never automatically cancel a backend job when polling stops. No cancellation
  control is exposed in Phase 8.

## Verification matrix

- Write focused failing tests before each new transport or UI behavior and
  record RED, GREEN, and any repair attempt.
- Cover exact methods, paths, queries, bodies, FormData, pagination bounds,
  no user ID, abort forwarding, structured errors, malformed envelopes and
  DTOs, field allowlisting, stable IDs, immutable save, history isolation,
  polling, analysis, and suggestion application.
- Run focused Resume API, validator, list, workspace, editor, save, history,
  import, polling, analysis, suggestion, and router tests.
- Run the complete frontend test suite, frontend typecheck, root typecheck,
  backend unit, integration, and security tests, production build, and
  `git diff --check`.
- Verify runtime ownership with synthetic User A, User B, and Empty User where
  local prerequisites are ready. Do not claim unavailable transaction or AI
  completion behavior.
- Verify browser authentication, list, editor, history, analysis, job,
  suggestion, error, keyboard, focus, announcement, reduced-motion, 200% zoom,
  and responsive behavior at 1440, 1024, 768, 390, and 320 pixels.
- Run one bounded Lighthouse check on authenticated Resume Studio where
  supported and record accessibility, performance, FCP, LCP, CLS, TBT, and
  material warnings.
- Apply the three-attempt failure-loop rule separately to each root cause.

## Visual approval gate

- Keep exactly one healthy frontend at `http://localhost:5173` and one healthy
  backend at `http://localhost:8000`.
- Leave the authenticated Resume Studio open with synthetic fixtures available
  for operator review.
- Provide a concise desktop, tablet, mobile, loading, empty, error, success,
  validation, conflict, job, analysis, suggestion, keyboard, and focus
  inspection checklist.
- Report unavailable MongoDB, worker, or AI prerequisites honestly.
- Stop before staging, committing, or final implementation review until the
  operator supplies exactly:
  `PHASE_8_VISUAL_QA_APPROVED`

## Implementation review gate

- After visual approval, run the final implementation, privacy, contract,
  dependency, artifact, test, and Git review.
- Confirm only authorized paths changed, protected-path diffs are empty,
  nothing is staged, and no secret, personal data, fixture, or generated
  artifact is present.
- Leave all files unstaged and uncommitted.
- Stop until the operator supplies exactly:
  `PHASE_8_IMPLEMENTATION_REVIEW_APPROVED`

## Next phase

- Execution Phase 9: Interview Legacy Inspection.
- Keep Execution Phase 9 and all later phases `PLANNED`.
- Do not activate Phase 9 automatically.
