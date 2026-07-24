# Resume Studio Migration Plan

## 1. Executive decision

Execution Phase 8 must be implemented only in the active Career Learning Hub
repository. The two legacy projects remain read-only evidence. Their backends,
authentication, API clients, databases, environment files, package
configuration, lockfiles, provider integration, and persistence mechanisms are
rejected.

Valuable interactive behavior will be rebuilt within the current React and
Vite frontend. Current authenticated backend contracts control resume data,
ownership, immutable versions, private assets, asynchronous jobs, validated
analysis, and stored suggestion application. No legacy file is approved for
copying.

Phase 8 requires human approval of this plan before any application source is
changed. Approval of this document does not approve a backend expansion or any
legacy asset whose provenance remains unknown.

## 2. Controlling evidence

1. Planning authority:
   `ACTIVE_REPO/docs/planning/CAREER_LEARNING_HUB_MASTER_PLAN.md` and
   `ACTIVE_REPO/docs/planning/CURRENT_PHASE.md`.
2. Accepted decisions:
   `ACTIVE_REPO/docs/planning/DECISION_LOG.md`.
3. Frontend architecture and phase evidence:
   `ACTIVE_REPO/docs/architecture/frontend-architecture-audit.md` and
   `ACTIVE_REPO/docs/phases/phase-04-resume-studio.md`.
4. Current frontend scaffold:
   `ACTIVE_REPO/frontend/src/routing/router.tsx:L67-L87`,
   `ACTIVE_REPO/frontend/src/features/resumes/`, and
   `ACTIVE_REPO/frontend/src/api/apiClient.ts`.
5. Active resume contracts:
   `ACTIVE_REPO/backend/src/modules/resumes/`,
   `ACTIVE_REPO/backend/src/modules/resume-analysis/`,
   `ACTIVE_REPO/backend/src/jobs/`, and
   `ACTIVE_REPO/backend/src/modules/assets/`.
6. Legacy findings:
   `docs/legacy-analysis/resume-builder-inventory.md` and
   `docs/legacy-analysis/resume-analyser-inventory.md`.

Where legacy behavior conflicts with active contracts, active contracts win.

## 3. Migration principles

- Preserve the active React, Vite, Express, TypeScript, MongoDB, authentication,
  shell, routing, API-client, and design-system boundaries.
- Treat current request, response, ownership, validation, and job contracts as
  the only data authority.
- Derive owned access from authenticated server state. Never accept a client
  user ID as an ownership override.
- Keep access tokens in React memory and use the existing central API client.
- Never fabricate resumes, metrics, scores, activity, analyses, or save
  success.
- Preserve every canonical stable entry, link, and bullet ID. Create identity
  only for genuinely new content and adopt server-normalized responses.
- Save content only as a new immutable version using the exact loaded current
  version as the concurrency baseline.
- Apply only explicitly selected stored suggestion UUIDs. Never submit
  free-form rewritten text, use empty-means-all behavior, append unmatched
  text, or start analysis automatically.
- Treat AI results as bounded model output that requires user review.
- Keep loading, empty, error, success, retry, conflict, and job states factual
  and independent.
- Cancel obsolete requests and prevent stale responses from overwriting the
  current route or draft.
- Preserve keyboard access, clear labels, visible focus, non-color status
  meaning, and responsive desktop, tablet, and mobile layouts.
- Make the smallest valid change. Do not add a state library, router, API
  client, backend, database, provider, or dependency without a verified blocker
  and separate approval.

## 4. Consolidated feature decision matrix

| Capability | Resume Builder evidence | Resume Analyser evidence | Active support | Final classification | Phase 8 decision | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| Resume list and create | RB-004, RB-005 | RA-007 | SUPPORTED | REBUILD | Build `/resumes` with pagination, create, import, and factual states. | Both legacy flows are useful but use incompatible data and clients. |
| Protected shell and auth | RB-002, RB-003 | RA-002, RA-004 | SUPPORTED | REJECT | Reuse active `AuthRoute`, `AppShell`, `AuthProvider`, and API client. | Legacy auth and token behavior violates active rules. |
| Canonical section editor | RB-007 through RB-018 | RA-011 | SUPPORTED | REBUILD | Complete all canonical sections with stable IDs and one local draft owner. | Builder breadth is valuable; its schema and index identity are incompatible. |
| Resume title update | RB-006 | None | NOT SUPPORTED | REBUILD | Create title only; defer rename. | No active update route exists. |
| Profile photo | RB-008, RB-009 | RA-011 | NOT SUPPORTED | REBUILD | Exclude upload and keep `showProfilePhoto` disabled. | No canonical photo asset reference exists. |
| Preview | RB-018, RB-019, RB-021 | RA-011, RA-027 | PARTIALLY SUPPORTED | REBUILD | Render all canonical content on screen. | Current scaffold is partial; export is unsupported. |
| Design controls | RB-019, RB-020 | RA-033 | PARTIALLY SUPPORTED | REBUILD | Offer only operator-approved template, palette, page-size, and font IDs. | Patch contract exists, but no supported catalog is defined. |
| Immutable save | RB-022 | RA-021, RA-023 | SUPPORTED | REBUILD | Post a new version with `expectedCurrentVersionId`. | Legacy overwrite behavior is rejected. |
| Version history | None | RA-023 through RA-025 | SUPPORTED | REBUILD | List metadata and load immutable snapshots inside the workspace. | Active routes support per-resume history, not global analytics. |
| Rich version diff | None | RA-024 | PARTIALLY SUPPORTED | REBUILD | Defer unless a small accessible client comparison is separately approved. | Structured diff semantics are unresolved. |
| PDF import | None | RA-008 through RA-010 | SUPPORTED | REBUILD | Upload one private PDF and poll the returned job. | Active import is asynchronous and more strongly validated. |
| Analysis input and polling | None | RA-012 through RA-014 | SUPPORTED | REBUILD | Submit role and approved optional context, then poll an owned job. | Legacy synchronous behavior cannot migrate. |
| Analysis display | None | RA-015 through RA-019 | SUPPORTED | REBUILD | Render active score categories, issues, strengths, and missing keywords. | Active validated schema controls labels and bounds. |
| Suggestion review and apply | None | RA-020 through RA-022 | SUPPORTED | REBUILD | Confirm non-empty selected stored UUIDs and adopt the returned version. | Automatic mutation and empty-means-all are rejected. |
| Aggregate insights and dashboard metrics | None | RA-025, RA-026 | NOT SUPPORTED | REJECT | Do not implement in Phase 8. | No factual active aggregate contract exists. |
| Resume delete or archive | RB-024 | RA-028 | NOT SUPPORTED | REBUILD | Exclude until a separate owned and recoverable contract is approved. | Both legacy implementations are destructive. |
| PDF export | RB-021 | RA-027 | NOT SUPPORTED | REBUILD | Keep on-screen preview; defer download/export. | No verified output contract or fidelity evidence exists. |
| Static legacy assets | RB-025, RB-026 | RA-034 | NOT APPLICABLE | REFERENCE ONLY | Copy none. Recreate only approved concepts with active assets. | Provenance is unknown or assets are boilerplate. |
| Accessibility and responsive behavior | RB-030, RB-031 | RA-035, RA-036 | NOT APPLICABLE | REBUILD | Implement and verify fresh active behavior. | Both legacy projects have material gaps. |
| Legacy infrastructure and sample claims | RB-027 through RB-029 | RA-003, RA-029 through RA-032 | NOT APPLICABLE | REJECT | Do not copy, install, persist, or publish. | Security, privacy, architecture, and evidence conflict. |

## 5. Approved Phase 8 user journeys

1. **Resume list:** an authenticated user opens `/resumes`, sees a factual
   loading state, then owned paginated resume summaries, a factual empty state,
   or a safe error with request ID and retry.
2. **Create resume:** the user enters a valid title once, receives a canonical
   resume and version, and navigates to `/resumes/:resumeId`.
3. **Open resume:** the user opens an owned summary, loads its current resume
   and version, and sees safe 404 or conflict recovery when unavailable.
4. **Edit canonical resume:** the workspace owns one draft derived from the
   server version and supports every canonical content section.
5. **Add, edit, remove, and reorder:** repeatable entries and bullets preserve
   existing IDs; new content receives valid server-compatible identity.
6. **Save changes:** the user explicitly saves a valid draft with the exact
   loaded current-version ID. No client state claims success before the server
   response.
7. **Create immutable version:** a successful save returns the new resume and
   version. The workspace replaces its baseline and canonical draft with that
   response.
8. **View version history:** the user pages through owned immutable metadata
   and loads a selected historical snapshot without mutating it.
9. **Preview resume:** the preview derives from the current draft and renders
   all supported canonical sections without public screenshots.
10. **Use approved design controls:** the user selects only an approved design
    option; design save has an independent success or error state.
11. **Import PDF:** the user supplies a valid title and one PDF. The UI submits
    once to the private import contract.
12. **Poll import job:** the UI polls the owned job, displays factual progress,
    handles terminal outcomes, and navigates to the returned resume only after
    validating a completed import result.
13. **Run resume analysis:** the user chooses the current or explicit owned
    version, supplies a target role and approved optional context, then submits
    once.
14. **View validated analysis:** after job completion, the UI loads and
    validates the owned analysis before showing its score, breakdown, findings,
    and suggestions.
15. **Select stored suggestions:** the user reviews original and proposed text,
    rationale, and verification warnings, then explicitly checks stored
    suggestion UUIDs.
16. **Apply selected suggestion IDs:** a confirmation submits a non-empty list
    of selected UUIDs with the analysis ID. No text is sent as the requested
    mutation.
17. **Review resulting version:** the UI adopts the returned canonical
    `ai-rewrite` version, clears stale selection, and lets the user review or
    explicitly start a new analysis.
18. **Handle states:** each list, load, save, design, history, import, analysis,
    and apply operation has its own loading, empty, error, success, retry,
    cancellation, and conflict behavior where applicable.

Unsupported rename, delete, archive, duplicate, export, OCR, profile-photo,
aggregate insight, and automatic-analysis journeys are not approved.

## 6. Active backend capability map

All routes are under `/api/v1`, use the active response envelope, require
authentication at their routers, derive user identity from authenticated
server state, and preserve private `no-store` behavior.

| Capability | Method and route | Request contract | Response contract | Ownership and job behavior | Readiness and frontend requirement | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| List resumes | `GET /resumes` | Query `page >= 1`, `limit 1..100`, optional `draft`, `active`, or `archived` status | `{resumes,pagination}` | Owned summaries only, newest updated first | READY; add typed operation, validation, pagination, abort, and states | `ACTIVE_REPO/backend/src/modules/resumes/resume.validation.ts:L130-L134`; `ACTIVE_REPO/backend/src/modules/resumes/resume.service.ts:L96-L127` |
| Create resume | `POST /resumes` | Strict `{title,content?,design?}` | `201 {resume,version}` | Transaction creates owned resume plus V1 | READY; add typed create and navigate using canonical ID | `ACTIVE_REPO/backend/src/modules/resumes/resume.validation.ts:L113-L117`; `ACTIVE_REPO/backend/src/modules/resumes/resume.service.ts:L28-L94` |
| Load workspace | `GET /resumes/:resumeId` | Owned route ID | `{resume,version}` | Resume and current version must belong to authenticated user; safe 404 | READY; validate response and handle `CURRENT_RESUME_VERSION_MISSING` | `ACTIVE_REPO/backend/src/modules/resumes/resume.service.ts:L130-L172` |
| Save version | `POST /resumes/:resumeId/versions` | Strict `{content,changeSummary?,expectedCurrentVersionId}` | `201 {resume,version}` | Atomic owned version creation; stale baseline returns `RESUME_VERSION_CONFLICT` | READY; preserve IDs, exact baseline, and server canonical response | `ACTIVE_REPO/backend/src/modules/resumes/resume.validation.ts:L119-L123`; `ACTIVE_REPO/backend/src/modules/resumes/resume.service.ts:L226-L290` |
| List versions | `GET /resumes/:resumeId/versions` | Paginated query | `{versions,pagination}` metadata | Owned resume; newest version number first | READY; add typed paging and immutable history UI | `ACTIVE_REPO/backend/src/modules/resumes/resume.service.ts:L174-L202` |
| Get version | `GET /resumes/:resumeId/versions/:versionId` | Owned resume and version IDs | `{version}` including content | Binds user, resume, and version; safe 404 | READY; load read-only snapshot without replacing draft silently | `ACTIVE_REPO/backend/src/modules/resumes/resume.service.ts:L204-L224` |
| Update design | `PATCH /resumes/:resumeId/design` | Non-empty subset of `templateId`, `colorPaletteId`, `pageSize`, `fontFamily`, `showProfilePhoto` | `{resume}` | Owned mutable resume design | PARTIAL; operator-approved catalog required, profile photo excluded | `ACTIVE_REPO/backend/src/modules/resumes/resume.validation.ts:L97-L103`; `ACTIVE_REPO/backend/src/modules/resumes/resume.service.ts:L293-L327` |
| Import PDF | `POST /resume-analyses/import-pdf` | Multipart `title` and one `file`; active private PDF limits | `202 {assetId,job:{id,type,status}}` | Creates owned temporary private asset and queues import | READY if worker and AI gateway are operational; validate and poll | `ACTIVE_REPO/backend/src/modules/resume-analysis/resumeAnalysis.controller.ts:L25-L67`; `ACTIVE_REPO/backend/src/modules/assets/asset.policy.ts:L5-L22` |
| Import completion | `GET /jobs/:jobId` | Owned job ID | Completed import result `{resumeId,versionId,versionNumber}` inside job result | Owned polling; terminal statuses include completed, failed, cancelled | READY; discriminate job type/status and validate result | `ACTIVE_REPO/backend/src/modules/resume-analysis/resumeAnalysis.jobs.ts:L14-L29`; `ACTIVE_REPO/backend/src/jobs/job.controller.ts:L14-L39` |
| Queue analysis | `POST /resume-analyses/resumes/:resumeId/analyze` | Strict `{versionId?,targetRole,company?,jobDescription?}` | `202 {job:{id,type,status}}`; completed job result includes `analysisId`, `resumeId`, `resumeVersionId`, and `totalScore` | Resume and chosen version are owned before queueing | READY if worker and AI gateway are operational; validate the job result, then fetch the analysis | `ACTIVE_REPO/backend/src/modules/resume-analysis/resumeAnalysis.schemas.ts:L7-L14`; `ACTIVE_REPO/backend/src/modules/resume-analysis/resumeAnalysis.controller.ts:L69-L119`; `ACTIVE_REPO/backend/src/modules/resume-analysis/resumeAnalysis.jobs.ts:L32-L55` |
| List analyses | `GET /resume-analyses/resumes/:resumeId` | Paginated query | `{analyses,pagination}` | Owned resume analyses, newest first | READY; request only validated display fields and never log raw bodies | `ACTIVE_REPO/backend/src/modules/resume-analysis/resumeAnalysis.service.ts:L300-L326` |
| Get analysis | `GET /resume-analyses/:analysisId` | Owned analysis ID | `{analysis}` | Owned analysis only | READY; validate score, findings, suggestions, target, and version identity | `ACTIVE_REPO/backend/src/modules/resume-analysis/resumeAnalysis.service.ts:L328-L345` |
| Apply suggestions | `POST /resume-analyses/resumes/:resumeId/rewrites/apply` | Strict `{analysisId,suggestionIds:[UUID...],changeSummary?}` with 1 to 100 IDs | `201 {resume,version,appliedCount}` | Verifies user, resume, source version, original bullet, unique stored IDs; creates atomic version | READY; send selected IDs only and adopt canonical response | `ACTIVE_REPO/backend/src/modules/resume-analysis/resumeAnalysis.schemas.ts:L16-L22`; `ACTIVE_REPO/backend/src/modules/resume-analysis/resumeAnalysis.service.ts:L347-L494` |
| Poll or cancel job | `GET` or `DELETE /jobs/:jobId` | Owned job ID | Job state, or `204` for owned queued cancellation | User ID is included in job query | READY; cancellation UI is optional, polling and obsolete-request cancellation are required | `ACTIVE_REPO/backend/src/jobs/job.routes.ts:L15-L35`; `ACTIVE_REPO/backend/src/jobs/job.queue.ts:L245-L259` |

Operational readiness must confirm that `JOB_WORKER_ENABLED` is active and the
AI gateway is configured. Enqueue success alone does not prove completion.

## 7. Active frontend target architecture

Use the existing feature directory and central API client. The smallest likely
shape is:

```text
frontend/src/features/resumes/
  ResumeListPage.tsx             list, create, import orchestration
  ResumeWorkspace.tsx            route-level workspace orchestration
  ResumeEditor.tsx               presentation shell for canonical sections
  ResumePreview.tsx              all-section draft preview
  AiRecommendations.tsx         validated findings and selection UI
  resumeApi.ts                   sole feature transport boundary
  resumeContracts.ts            narrow DTO validators if kept feature-local
  types.ts                       editor and validated transport types
  components/
    ResumeCreateForm.tsx
    ResumeImportForm.tsx
    ResumeSectionEditor.tsx
    ResumeEntryEditor.tsx
    ResumeBulletEditor.tsx
    ResumeVersionHistory.tsx
    ResumeDesignControls.tsx
    ResumeJobStatus.tsx
    AnalysisRequestForm.tsx
    SuggestionApplyDialog.tsx
  __tests__/
    resumeApi.test.ts
    ResumeListPage.test.tsx
    ResumeWorkspace.test.tsx
```

This is a preliminary responsibility map, not approval to create every file.
Combine small components when that is clearer. Keep route components
responsible for orchestration and presentation components free of direct API
logic.

`resumeApi.ts` should add list, create, design, version list/get, and optional
job cancellation, remove explicit access-token plumbing, accept
`AbortSignal`, use the central auth adapter, retain structured request IDs, and
return validated types instead of `unknown`.

Feature-local transport validators are the smallest current choice. Moving
resume DTOs into `packages/shared-types` would expand scope and requires an
explicit Phase 8 decision.

## 8. Route plan

- `/resumes`: connected list, creation, and PDF-import surface.
- `/resumes/:resumeId`: connected editor, preview, design, history, analysis,
  suggestion, and job-state workspace.

Preserve the existing `AuthRoute` and `AppShell`. Do not add another router.
Use workspace tabs or query state only when it provides a clear, accessible
way to switch editor, preview, history, and analysis panels. Do not add a
separate version route unless deep-linking is approved and tested. The route
parameter remains the sole resume identity in the URL.

## 9. State-ownership plan

| State | Owner | Rule |
| --- | --- | --- |
| Resume list and pagination | `/resumes` route component | Server-authoritative; cancel on page/filter replacement. |
| Resume metadata and design | Workspace server state | Replace only from validated responses; design save is independent. |
| Saved canonical content | Loaded current `ResumeVersion` | Immutable baseline used for dirty comparison and concurrency. |
| Editor draft | `ResumeWorkspace` local state | Derived once from current version; presentation components receive values and callbacks. |
| Stable IDs | Canonical content and server normalization | Preserve loaded IDs; never regenerate identity on render or reorder. |
| Version history | Workspace history panel | Server-authoritative metadata and read-only snapshots. |
| Import job | Initiating list/import surface | Poll by owned ID; abort on unmount or superseding import. |
| Analysis job and result | Workspace analysis panel | Key by resume version; clear as stale when the canonical version changes. |
| Selected suggestion IDs | Workspace analysis state | Key by `analysisId` and source version; explicit non-empty set only. |
| Unsaved changes | Workspace | Warn before route replacement or loading a snapshot; never silently discard. |
| Request errors | Owning operation | Keep request ID and safe error; one operation must not clear another's error. |

No Redux, Zustand, TanStack Query, or new state dependency is justified.

## 10. Data-integrity rules

1. Preserve loaded stable IDs byte-for-byte through editing and reordering.
2. Do not create replacement IDs for existing entries or bullets. For genuinely
   new items, use a valid UUID or let the server normalize and then adopt its
   response.
3. Reject duplicate IDs before submission and honor strict server validation.
4. Save content only with the exact loaded `expectedCurrentVersionId`.
5. Treat every stored version and history snapshot as immutable.
6. Replace the saved baseline and draft only with the canonical successful
   create, save, import, or apply response.
7. Never claim save success after a failed or cancelled request.
8. Never let a stale load, poll, save, analysis, or snapshot response overwrite
   a newer route, draft, or version.
9. Submit a non-empty explicit list of stored suggestion UUIDs. Never submit
   generated text or infer apply-all from an empty list.
10. Clear selected suggestions and mark the displayed analysis stale after any
    content-version change.
11. Surface version and source-text conflicts with reload and review options.
    Do not merge silently.
12. Keep mutable design changes separate from immutable content versions.
13. Never fabricate scores, activity, previews, content, or job progress.
14. Server access remains ownership-derived. Do not add user IDs to owned
    request bodies or queries.

## 11. Visual and asset plan

| Inventory evidence | Classification | Target usage | Provenance | Required adaptation | Accessibility | Further approval |
| --- | --- | --- | --- | --- | --- | --- |
| RB-007, RB-018 | REBUILD | Section workflow and live draft preview | Concept only | Fit active shell and allow partial drafts | Keyboard navigation, headings, errors, focus | Phase 8 plan approval |
| RB-019 | REFERENCE ONLY | Template-composition research | Layout and image provenance unknown | Copy none; use only as visual evidence | Not applicable until a new active layout exists | Design catalog plus Phase 8 approval |
| RB-020 | REBUILD | Approved design-control interaction | Concept only | Implement only approved active IDs from scratch | Semantic selectors, contrast, zoom-safe preview | Design catalog plus Phase 8 approval |
| RB-025 | REFERENCE ONLY | Visual research only | Unknown | Copy none | Not applicable until approved | Asset provenance approval |
| RA-015 through RA-020 | REBUILD | Score, findings, keywords, and suggestion review | Interaction concept only | Use active labels, bounds, and stored IDs | Non-color meaning, clear hierarchy, keyboard checkboxes | Phase 8 plan approval |
| RA-033 | REFERENCE ONLY | Card and badge research | No source reuse approved | Express through the active design system | Contrast, focus, reduced motion | Phase 8 plan approval |
| RA-034 | REJECT | None | Unknown | Copy none | Not applicable | No |

No legacy image or font is approved for copying. Phase 8 should use existing
active icons, CSS, and system typography unless a separate provenance and
design review approves something else.

## 12. Rejected legacy architecture

- Authentication, authorization, route guards, user contexts, and token
  persistence
- Persistent browser access-token storage
- Separate Express backends and route trees
- Axios clients, hard-coded URLs, query hooks, and response assumptions
- Mutable resume database models and whole-document updates
- Raw resume-text persistence outside active models
- Public or local upload storage and screenshot thumbnails
- Package manifests, dependency versions, lockfiles, Vite configuration, and
  environment files
- Provider keys, direct provider clients, prompts, and legacy AI telemetry
- Synchronous PDF import and analysis
- Incompletely validated AI results and empty parsed structures
- Text-matching rewrite mutation, fallback append, empty-means-all, and
  automatic re-analysis
- Fabricated samples, dashboard metrics, testimonials, ATS claims, job
  description claims, and performance claims
- Unproven assets, remote fonts, and a second design system

## 13. Phase 8 implementation sequence

| Step | Likely files | Contracts | Tests and acceptance evidence | Stop condition |
| --- | --- | --- | --- | --- |
| 1. Verify contracts and scaffold tests | `resumeApi.ts`, `types.ts`, optional `resumeContracts.ts`, feature tests | All resume, job, and analysis DTOs | Malformed response rejection, request IDs, auth adapter, FormData, AbortSignal, exact paths and bodies | Stop on an unresolved public DTO or auth mismatch. |
| 2. Resume list and creation | `router.tsx`, `ResumeListPage.tsx`, create/import presentation | List and create resume | Protected routing, loading, empty, paging, create validation, duplicate prevention, error/retry, canonical navigation | Stop if title or list response differs from evidence. |
| 3. Canonical editor and stable IDs | `ResumeWorkspace.tsx`, `ResumeEditor.tsx`, section/entry/bullet controls, `types.ts` | Workspace get and canonical schemas | All sections, add/edit/remove/reorder, ID preservation, validation, dirty state, unsaved navigation | Stop if an editor field has no canonical mapping. |
| 4. Save and immutable versions | Workspace and API tests | Create-version contract | Exact baseline, canonical replacement, 409 conflict, no false success, selected-analysis invalidation | Stop on unresolved conflict behavior or ID loss. |
| 5. Version history | History component and API operations | Version list and get | Paging/order, read-only snapshots, unsaved-change protection, owned errors | Stop if loading history can overwrite the draft. |
| 6. Preview and approved design | `ResumePreview.tsx`, design controls | Design patch | All sections, approved option mapping, independent errors, desktop/tablet/mobile print-like layout | Stop until template, palette, and font catalog is approved. |
| 7. PDF import and polling | List/import form, job status, API | Import and job get/cancel | PDF/type/size/title, one submission, job progress, completed navigation, failure/cancelled/retry, unmount abort | Stop if worker/AI readiness is unconfirmed in target environment. |
| 8. Analysis display | Analysis form/panel, API validators | Queue/list/get analysis and jobs | Bounds, specific/current version, polling, active categories, safe wording, malformed-result rejection, stale invalidation | Stop if the completed job result fails validation or does not identify an owned analysis. |
| 9. Suggestion selection and application | `AiRecommendations.tsx`, confirmation dialog, workspace | Apply selected rewrites | Checked stored UUIDs only, empty disabled, duplicate/unknown/stale conflicts, returned version adoption, no auto-analysis | Stop if free-form text or apply-all semantics enter the request. |
| 10. Full verification and human QA | Relevant tests and styles only | Existing active contracts | Typecheck, frontend tests, required backend ownership tests, production build, browser states, keyboard, responsive, accessibility, visual checklist | Stop before commit until the required visual approval token is received. |

Each step should be a small reviewable diff. A backend defect or missing
contract requires separate authorization rather than a frontend workaround.

## 14. Phase 8 test plan

### Frontend contract and component tests

- Exact list, create, workspace, design, version, import, job, analysis, and
  apply method/path/query/body/FormData behavior.
- Runtime rejection of malformed envelopes, DTOs, job results, analyses, IDs,
  and category values.
- Structured request IDs and safe errors remain visible.
- `AbortSignal` forwarding and stale-response suppression.
- Resume list loading, empty, pagination, error, retry, and create navigation.
- Editor coverage for every canonical section and field.
- Stable ID preservation across edit, add, remove, and reorder.
- Dirty-state and unsaved-navigation behavior.
- Exact immutable-save baseline and canonical-response replacement.
- Version conflict, missing-current-version, validation, and owned 404 states.
- History order, pagination, snapshot loading, and read-only presentation.
- PDF type, size, title, one-submit, progress, failure, cancelled, retry, and
  completion navigation.
- Analysis input bounds, current or explicit version, job states, result
  validation, score categories, findings, and stale invalidation.
- Selected stored IDs only, empty selection disabled, explicit confirmation,
  apply conflicts, canonical new version, and no automatic re-analysis.

### Backend verification gaps to add or confirm

- User A cannot list, load, design, version, import, poll, analyse, retrieve,
  apply, cancel, or access assets belonging to User B.
- List/create/design/save/history validation and ownership.
- Version conflict and stable-ID policy across versions.
- Import asset privacy, PDF signature/size/quota, job result, failure, and
  cleanup.
- Analysis ownership, version binding, structured-output failure, stored
  suggestion IDs, source-text match, and atomic version creation.
- Job error output exposes only safe fields.

### Browser and human verification

- Protected routing and refresh bootstrap.
- Desktop, tablet, and mobile layouts.
- Keyboard-only editor, history, design, upload, analysis, selection, and
  confirmation behavior.
- Focus management, labels, errors, status announcements, contrast, zoom, and
  reduced motion.
- Loading, empty, error, success, validation, conflict, queued, processing,
  failed, cancelled, completed, and stale-analysis states.
- Human visual QA is mandatory for the visible Phase 8 change and must stop
  before commit until the approved visual token is supplied.

## 15. Security and privacy controls

- Treat resume content, parsed text, contact details, job descriptions,
  analysis results, suggestions, and uploaded files as private personal data.
- Use only private asset routes and never expose storage keys or public resume
  screenshots.
- Preserve authenticated ownership queries and safe internal 404 behavior.
- Add User A and User B IDOR tests for every new frontend-used surface.
- Keep access tokens in React memory, refresh tokens in the existing HttpOnly
  cookie, credentials enabled, and Bearer attachment centralized.
- Do not log request bodies, resume content, PDF text, job descriptions,
  prompts, AI output, suggestion IDs, tokens, cookies, secrets, or raw errors.
- Preserve PDF purpose, MIME, signature, size, quota, and private lifecycle
  validation.
- Validate all external responses at the frontend trust boundary and retain
  server structured-output validation.
- Present model results as fallible guidance and require explicit user review.
- Apply only active stored suggestion UUIDs after server verification of user,
  resume, analysis, version, bullet identity, and original text.
- Ignore stack or internal job-error fields even if a development response
  contains them.

## 16. Phase 8 expected write scope

This preliminary plan is not implementation authorization.

Expected modified files:

- `frontend/src/routing/router.tsx`
- `frontend/src/routing/router.test.tsx`
- `frontend/src/features/resumes/ResumeWorkspace.tsx`
- `frontend/src/features/resumes/ResumeEditor.tsx`
- `frontend/src/features/resumes/ResumePreview.tsx`
- `frontend/src/features/resumes/AiRecommendations.tsx`
- `frontend/src/features/resumes/resumeApi.ts`
- `frontend/src/features/resumes/types.ts`
- `frontend/src/features/resumes/index.ts`
- Relevant existing frontend styles only when verified

Expected new files:

- Connected resume list/create/import page
- Focused section, entry, bullet, history, design, job, analysis-form, and
  apply-confirmation components only where separation is justified
- Feature-local runtime validators
- Resume API, page, workspace, and component tests

Protected files and surfaces:

- `frontend/src/api/apiClient.ts`, except a separately proved shared-client
  defect
- `frontend/src/features/auth/`
- `frontend/src/AppShell.tsx`, except a separately proved navigation defect
- Root and package manifests, lockfiles, environment files, and configuration
- All legacy projects

Backend files expected to require no change:

- Existing resume routes, controllers, services, validation, and models
- Existing analysis routes, controllers, services, schemas, and jobs
- Existing job and private-asset infrastructure

Backend ambiguities requiring separate authorization:

- Public narrow transport DTOs for resume, analysis, and job responses
- Safe job error serialization
- Cross-version enforcement of stable IDs
- Supported template, palette, and font catalog
- Profile-photo contract
- Design concurrency and whether design belongs in immutable versions
- Polling guidance and deployment worker/AI readiness
- Rename, archive, delete, duplicate, restore, export, and OCR contracts

## 17. Open decisions requiring operator approval

| Question | Options | Recommendation | Evidence | Phase 8 impact | Default |
| --- | --- | --- | --- | --- | --- |
| Which design IDs are supported? | Approve a small explicit catalog; add discovery contract; omit design controls | Approve a small catalog backed by the existing renderer before Step 6 | Design patch accepts bounded strings but defines no catalog | Blocks factual design selector and visual QA | Omit controls except proven page size |
| Should analysis accept optional company and job description? | Role only; all active bounded fields | Expose active optional fields with privacy text | Active schema supports them; legacy did not implement JD input | Changes form, validation, and privacy copy | Role only |
| Where should transport validators live? | Feature-local; shared package | Feature-local for smallest scope | No resume contract precedent exists in shared types | Affects file scope and reuse | Feature-local |
| Should rich version diff ship? | Snapshot history only; accessible client diff | Snapshot history first | Active routes expose snapshots but no diff semantics | Affects Step 5 size and test burden | Defer diff |
| What polling policy applies? | Fixed interval; bounded backoff; server guidance | Bounded backoff with explicit terminal and timeout behavior | No retry-after contract exists | Required for import and analysis behavior | Stop before Step 7 until approved |
| Must backend response DTOs be narrowed first? | Frontend validates and selects fields; backend DTO change | Perform a separate backend review before Phase 8 if excess fields are confirmed | Current services return persistence-oriented objects | May create separately authorized backend work | Frontend consumes only validated display fields |

Rename, profile photo, delete/archive, export, OCR, and aggregate insights are
not operator choices for this phase. They remain excluded unless separately
authorized with active backend contracts.

## 18. Final Phase 8 acceptance checklist

- [ ] Only approved active-repository files changed.
- [ ] No legacy file, dependency, configuration, prompt, or asset was copied.
- [ ] `/resumes` and `/resumes/:resumeId` remain authenticated and use the
      existing shell.
- [ ] List, create, open, edit, save, history, preview, import, analysis, and
      suggestion journeys pass their defined tests.
- [ ] Every canonical content section is editable and previewed.
- [ ] Existing stable entry, link, and bullet IDs survive edit and reorder.
- [ ] Save always includes the exact loaded current-version ID and creates an
      immutable version.
- [ ] Conflict handling never silently overwrites content.
- [ ] PDF import is private, validated, single-submit, asynchronous, and
      terminal-state aware.
- [ ] Analysis responses and job results are runtime validated.
- [ ] AI score wording is factual and does not claim ATS certification.
- [ ] Only a non-empty explicit set of stored suggestion UUIDs is applied.
- [ ] Suggestion application creates and adopts one canonical immutable
      version without automatic re-analysis.
- [ ] No fabricated content, metrics, scores, activity, or success state exists.
- [ ] User A cannot access User B resume, version, asset, job, analysis, or
      suggestion action.
- [ ] Tokens and private content are absent from storage and logs.
- [ ] Loading, empty, error, retry, validation, conflict, and job states pass.
- [ ] Cancellation and stale-response tests pass.
- [ ] Keyboard, focus, labels, status announcements, contrast, and responsive
      layouts pass.
- [ ] Typecheck, applicable tests, security tests, and production build results
      are recorded exactly.
- [ ] Human desktop, tablet, mobile, and state visual QA is approved before
      commit.
- [ ] Git diff is phase-scoped, secret-checked, unstaged until authorization,
      and reviewable.

## 19. Explicit exclusions

- Legacy source, components, styles, assets, fonts, prompts, configuration, and
  dependencies
- New auth, API client, router, state library, design system, backend, database,
  provider, or storage boundary
- Persistent access or refresh tokens
- Rename, archive, delete, restore, duplicate, bulk actions, and global resume
  search
- Profile-photo upload or display
- PDF export, download generation, OCR, public thumbnails, and screenshot
  persistence
- Aggregate insights, dashboard metrics, score trends, global activity, and
  unsupported analytics
- Testimonials, sample identities, sample resumes, vendor equivalence, ATS
  guarantees, callback claims, and performance claims
- Free-form, edited, inferred, unselected, empty-means-all, or automatically
  applied suggestions
- Automatic analysis or provider calls after import review, manual save, or
  suggestion application
- Backend contract or schema changes without separate approval

## 20. Approval gate

Phase 8 must not begin until the operator approves this analysis using:

`PHASE_7_LEGACY_ANALYSIS_APPROVED`
