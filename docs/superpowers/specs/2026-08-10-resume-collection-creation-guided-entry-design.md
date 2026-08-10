# Phase 19A-2 — Resume Collection, Creation & Guided Entry Design

## Status and authority

- Phase: `19A-2 — Resume Collection, Creation & Guided Entry`.
- Date: 2026-08-10.
- Status: `DESIGN APPROVED / IMPLEMENTATION PLAN ACTIVE`.
- Branch: `phase-19a-2-resume-creation-guided-entry`.
- Baseline HEAD: `643b7e6451b2b14472bf7019e531dae4a8134f42`.
- Baseline subject:
  `Merge pull request #5 from PrabhathMalindaGit/phase-19a-1-resume-editor-workspace`.
- Baseline relationship: the branch, local `main`, and `origin/main` all pointed
  to the same Phase 19A-1 merge commit when this audit began.
- Initial worktree: clean.
- Scope: design and planning documentation only. This audit implements no
  production functionality, test behavior, schema, provider, or dependency
  change.
- Accepted design approval token:
  `PHASE_19A2_RESUME_COLLECTION_CREATION_GUIDED_ENTRY_DESIGN_APPROVED` —
  `ACCEPTED / YES`.
- Later visible implementation requires:
  `PHASE_19A2_RESUME_COLLECTION_CREATION_GUIDED_ENTRY_VISUAL_APPROVED`.
- Phase 19A-1 is the completed, human-approved predecessor and remains
  authoritative for the editor, preview, validation, history, printing,
  ownership, and privacy behavior listed in the phase prompt.
- `PHASE 19A-3 — RESUME SAVE, RECOVERY & EXPORT WORKFLOW` remains
  `PLANNED / INACTIVE`.
- `PHASE 19A-4 — CANDIDATE PHOTO SUPPORT` remains `PLANNED / INACTIVE`.

## Assumptions and bounded ambiguities

1. The phrase “miniature Resume preview” means the current truthful,
   content-free template/palette/font schematic. The Resume list contract does
   not include Resume content, and this design does not add N+1 version fetches
   or expose content in the list response. A request for content-accurate card
   thumbnails would be a separately approved backend/asset contract.
2. Guided Setup target role and experience level are setup inputs, not claims
   of employment or seniority. Target role is copied to the Resume headline
   only through an explicit `Use as headline` selection. Experience level is
   guidance-only and is not persisted because no canonical field exists.
3. Suggested sections are a read-only guidance list, not persisted Resume
   data. Empty section records are never created merely to remember a
   recommendation. The normal editor retains all nine destinations.
4. The supplied qualification, proficiency, interest, title, action, and skill
   lists are approved local seed data. No certification names were supplied;
   the minimum implementation keeps certification name editable and does not
   ship a speculative third-party certification catalogue without operator
   approval.
5. Existing free-form date strings are compatibility data. A native month
   control cannot safely replace them without a dual-mode migration UI, so
   Phase 19A-2 preserves the current date inputs and `isCurrent` checkboxes.
6. “Review before adoption” means no Resume or ResumeVersion exists before the
   user confirms. A frontend review shown after the current worker has already
   persisted Version 1 would not satisfy that requirement.

## Measurable design success criteria

The production phase is ready to close only when evidence proves all of the
following:

- every Create Resume entry opens the same chooser;
- one bounded chooser offers Guided setup, Start blank, and Import PDF;
- no suggested role, skill, qualification, certification, language,
  experience, achievement, or interest becomes Resume content without a user
  action;
- custom role, skill, qualification, language, certification, and interest
  text remains possible;
- guided creation produces canonical Version 1 through the existing Resume
  create contract, with no empty placeholder entities;
- role selection exposes but does not select skill suggestions;
- skills remain `{ clientKey, id?, name, keywords }` in the draft and
  `{ id, name, keywords }` after server normalization;
- the collection pager is absent when `pagination.pages <= 1` and continues
  to use server-owned page metadata otherwise;
- the PDF surface uses exactly one native file input and provides select,
  truthful drag/drop, filename, validation, replace, and remove behavior;
- parsed PDF content is not adopted until confirmation, and abandoned review
  data becomes inaccessible and TTL-eligible no later than the temporary PDF
  asset's approximately 24-hour retention boundary without creating a Resume;
- no Gemini call is automatic, background, or part of deterministic guidance;
- Phase 19A-1 editor/preview/history/print/validation/privacy behavior remains
  green; and
- the required responsive, accessibility, browser, typecheck, unit,
  integration, security, build, and human visual gates pass.

## Evidence inspected

### Frontend

- `frontend/src/features/resumes/ResumeListPage.tsx`
- `frontend/src/features/resumes/ResumeMiniDocument.tsx`
- `frontend/src/features/resumes/ResumeEditor.tsx`
- `frontend/src/features/resumes/ResumeWorkspace.tsx`
- `frontend/src/features/resumes/ResumePreview.tsx`
- `frontend/src/features/resumes/resumeApi.ts`
- `frontend/src/features/resumes/resumeContracts.ts`
- `frontend/src/features/resumes/resumeDraft.ts`
- `frontend/src/features/resumes/types.ts`
- `frontend/src/features/resumes/resumeWorkspace.css`
- `frontend/src/AppShell.tsx`
- `frontend/src/features/dashboard/MainDashboard.tsx`
- `frontend/src/routing/router.tsx`
- `frontend/src/components/Dialog.tsx`
- `frontend/src/components/Pager.tsx`
- `frontend/src/components/StateSurface.tsx`
- affected frontend unit tests and `tests/browser/specs/resume.spec.cjs`

### Backend and shared contracts

- Resume routes, controller, service, models, content schema, validation, and
  backend Resume types under `backend/src/modules/resumes/`.
- PDF controller, route, service, schemas, parser, PDF extraction, and job
  registration under `backend/src/modules/resume-analysis/`.
- job persistence/public response, AI routing enqueue gate, private asset
  model/service/policy, storage adapters, and related integration tests.
- `backend/src/jobs/job.model.ts`, `job.queue.ts`, and `job.worker.ts`, including
  terminal expiry assignment and the existing `jobs_retention_ttl` index.
- `packages/shared-types/src/index.ts`.

No browser runtime, application service, database, provider, or Gemini request
was needed for this audit.

## Existing architecture

### Resume collection and card layout

`ResumeListPage` owns page state, cancellation-safe list loading, safe errors,
empty/loading states, blank creation, PDF import, polling, and navigation. The
server returns only `ResumeRecord` summary fields plus pagination. Cards render
an `aria-hidden` `ResumeMiniDocument` that truthfully reflects template,
palette, and font, not candidate content. The current list area shares a
two-column page with two always-visible creation forms. Its card list is a
two-column grid, so one or two records can become visually oversized and the
collection cannot use the full application content width. The Draft badge is
absolutely positioned over the preview.

The current `Pager` is always rendered, including for zero or one page. Page,
limit, total, and page count are server-owned and validated by
`parseResumeList`; the client requests 20 records per page.

### Existing creation entry and routing

- AppShell global Create → Resume:
  `/resumes?action=create`.
- Dashboard Create Resume:
  `/resumes?action=create`.
- Resume list creation controls: separate blank and PDF forms.
- The query effect recognizes only `action=create`, removes it with replace,
  then focuses the blank-title field.
- Unknown query intents remain untouched.
- Start blank calls `POST /resumes` with `{ title }` and opens the returned
  Resume workspace.

The global and Dashboard URLs are already canonical. They require no
production URL change; the destination behavior changes from focusing one
inline form to opening the unified chooser.

### Existing Resume create and persistence contract

`POST /api/v1/resumes` already accepts:

```ts
{
  title: string;                // trimmed, 1–120
  content?: ResumeContentInput; // canonical section arrays
  design?: ResumeDesign;        // optional existing design shape
}
```

The frontend `createResume` wrapper currently exposes only `title`, although
the controller already forwards `content` and `design`. The service normalizes
content, creates the owned Resume and immutable Version 1 in one MongoDB
transaction, sets `currentVersionId` and `latestVersionNumber = 1`, and records
safe activity metadata. Omitted content uses `createBlankResumeContent`.

Therefore Guided Setup can create a valid canonical Version 1 without a
backend, database, or shared-package change. The frontend wrapper should accept
an optional content payload and rely on the existing backend trust-boundary
normalization. It must not create a blank Version 1 and immediately append a
guided Version 2.

### Existing canonical content and Skills model

The canonical Resume contains Basics, Experience, Education, Skills,
Projects, Certifications, Languages, and Interests. The editor presents nine
destinations because Links is a separate editor section within Basics.

Persisted Skills are groups:

```ts
{ id: string; name: string; keywords: string[] }
```

Draft Skills add stable client identity:

```ts
{ clientKey: string; id?: string; name: string; keywords: string[] }
```

The editor currently accepts a group name and comma-separated keywords.
`draftToInput` removes only `clientKey`; the backend validates at most 30
groups and 100 non-empty keywords per group and generates missing UUIDs. This
shape must remain canonical.

The picker mapping is category → group name and selected skill → keyword. It
must find a group by normalized, case-insensitive name, append a
case-insensitively unique keyword, preserve existing group/order/IDs, and use
`createDraftEntity` only when a new group is required. It never flattens all
skills into one list.

### Existing Experience, Education, Language, Certification, and Interest contracts

- Experience requires employer and job title only after an entry exists;
  dates are optional strings up to 30 characters, `isCurrent` is boolean, and
  bullets are stable entities with 1–2,000 characters.
- Education requires institution and qualification only after an entry
  exists; field, location, dates, details, and `isCurrent` use the existing
  optional/string contracts.
- Certification requires a name; issuer, issued date, and validated public
  credential URL are optional.
- Language requires a name; proficiency is an optional string up to 80
  characters.
- Interests are strings up to 120 characters.
- The editor already exposes Current role and Currently studying checkboxes.
- Date values are deliberately format-agnostic. Import and historical data may
  not be valid `YYYY-MM`, so replacing text inputs with `type=month` would hide
  or reject compatible persisted values.

All proposed non-date helpers can write current contracts. Month/year controls
could technically serialize `YYYY-MM` into the current string fields, but the
minimum selected design does not add a dual-mode date control in 19A-2.

### Existing accessible primitives

- `Dialog` is the tested native `<dialog>` wrapper with initial focus, focus
  return, Escape/backdrop policy, and Tab containment.
- `PageHeader`, `StateSurface`, and `Pager` cover page headings, safe status /
  error surfaces, request IDs, and server-owned navigation.
- Native `<details>/<summary>` and editor disclosure buttons already provide
  bounded disclosure patterns.
- Native labelled inputs, `<select>`, `<datalist>`, fieldsets, checkboxes, and
  buttons are sufficient; no custom combobox/listbox framework is required.
- Existing validation summaries reveal and focus invalid controls.
- `JobResilienceActions` and bounded polling already cover retry/cancel state.

### Existing PDF import flow

The current flow is:

1. The browser validates a title and a selected PDF no larger than 15 MB.
2. Multipart upload sends a generated request UUID, title, and one file.
3. Authenticated rate-limited Multer accepts one in-memory file.
4. Asset policy rechecks size, `application/pdf`, and `%PDF-` magic bytes,
   enforces quota, writes to private local/S3 storage, sanitizes the original
   filename, and creates an owned temporary asset expiring after 24 hours.
5. Enqueue compiles the owned Gemini Direct routing snapshot. A disconnected
   user is rejected before a job is created.
6. The durable job reads only the owned asset, extracts bounded text/pages,
   rejects insufficient/scanned-image text because OCR is unavailable, and
   sends untrusted text to the existing explicit Gemini parser.
7. Gemini output is structurally validated, then normalized again through the
   canonical Resume validator. The parser supplies no confidence metadata.
8. The worker currently enters persistence, transactionally creates the
   Resume and pdf-import Version 1, links the private source asset, promotes
   the asset, records safe metadata, and returns Resume/version IDs.
9. The owned `/jobs/:jobId` polling route returns safe progress/result fields.
   The frontend validates the result and automatically navigates to the editor.

Ownership filters, private `no-store`, request IDs, upload magic-byte checks,
temporary cleanup, job fencing, retry ownership, cancellation, strict Gemini
output validation, no-partial-Resume failure behavior, and the unique
`sourceAssetId` idempotency index must be preserved.

## Considered unified-create presentations

### A. Existing Dialog on the Resume list — selected

Open the tested `Dialog` from every `/resumes?action=create` entry and the
local Create Resume button. The first view offers three clear choices, then
the same dialog hosts only the chosen bounded form. This reuses existing
routing and focus behavior, keeps the collection primary, works on mobile
through the current scroll-bounded dialog pattern, and introduces no route or
modal framework.

### B. Inline disclosure above the collection — fallback

An inline panel would avoid modal context but would repeatedly move the
collection, make external query-intent focus less clear, and can become tall
when Guided Setup and Import Review are active. Use only if runtime dialog
testing proves the selected design unusable at 320px or 200% zoom.

### C. New `/resumes/new` page — rejected for this phase

A dedicated page has room for a wizard but adds a route, navigation lifecycle,
and another creation surface when the existing query intent and `Dialog`
already solve the bounded workflow.

## Selected production design

### Collection, cards, and pagination — findings 013, 015, and 016

- Remove the permanent blank/import sidebar. Make the collection the primary
  full-width panel and place one `Create Resume` button in its heading.
- Use a width-capped responsive grid: cards may fill available rows but should
  not grow beyond approximately 320px. Use start alignment so one or two
  records do not become oversized. Allow one column when the container cannot
  safely fit the minimum card width.
- Keep `ResumeMiniDocument` content-free and design-derived. Add a visible
  `Template preview` caption if needed to prevent it being mistaken for the
  candidate's real content.
- Move Draft/Active/Archived out of the preview and into the body metadata.
  Never overlay state or actions on the document schematic.
- Hierarchy: title, state, `Current version N`, updated date, template/palette,
  then one visually strong full-width `Open Resume` link. Use only list fields
  already returned by the server.
- Empty-state `Create Resume` opens the same chooser; do not link directly to
  a hidden blank form.
- Render `Pager` only when the validated `pagination.pages > 1`. Keep
  `page`, `limit`, boundaries, cancellation, and reload behavior unchanged.
  Do not add client slicing, infinite scrolling, or fabricated counts.

### Unified Create Resume — finding 014

The dialog begins with:

```text
Create Resume

[ Guided setup ]
Build a Resume using editable suggestions.

[ Start blank ]
Create an empty Resume.

[ Import PDF ]
Import an existing Resume for review.
```

- The first choice receives focus when opened from a query intent.
- Choosing a method replaces the dialog body; `Back` returns to the choice
  view without closing the dialog.
- Closing returns focus to the local trigger when one exists. AppShell and
  Dashboard navigation naturally focus the first dialog choice.
- Query `action=create` remains the only canonical external intent and is
  consumed with `replace`. Unknown intents remain unchanged.
- Start blank asks for the required Resume title, calls the existing title-only
  create path, validates the returned workspace, then opens the editor.
- Import uses the one extracted canonical upload component described below.
- No Create option makes a provider request until the user explicitly submits
  Import PDF.

### Guided Setup

Guided Setup is one bounded form, not a multi-route wizard:

1. Resume title — required for the existing create contract.
2. Target role — editable input with the bounded local title catalogue.
3. Experience level — `Student`, `Entry level`, `Mid level`, or
   `Senior level`; guidance-only and not persisted.
4. Suggested sections — a read-only local recommendation list based on the
   chosen level. No empty Resume records are created from it.
5. Suggested skills — unchecked role suggestions plus the searchable full
   picker. Each selected skill is visibly removable before creation.
6. `Use target role as Resume headline` — unchecked until the user explicitly
   chooses it.
7. `Create and open editor` — submits a single current create request with
   canonical Version 1 content.

The initial content contains empty Basics and section arrays, plus only the
explicit headline and skill groups selected by the user. Guided Setup does not
create employers, experience, education, projects, certifications, languages,
interests, achievements, or empty required entities. The normal editor then
owns all further edits.

### Local job-title catalogue

Store the prompt-approved titles as a readonly local catalogue in the Resume
feature. Present them through native `<input list>`/`<datalist>` so typing,
filtering behavior, keyboard use, and arbitrary custom values remain browser
native. Selecting an option merely fills the editable input.

Use the same catalogue for Guided Setup, Experience job-title fields, and the
existing Role-aware assessment target-role field. A custom value is always
valid within the current length rules. No external title API, taxonomy,
location service, or Gemini call is introduced.

### Role-based skill suggestions

Maintain one readonly role-key → readonly skill-name mapping beside the skill
catalogue. Normalize only case and surrounding whitespace; do not infer a
nearest occupation. Exact catalogue roles may expose suggestions. Custom
roles and roles without a mapping simply show the full skill picker.

Selecting a role updates only the visible suggestion list. All suggestions
start unchecked. A skill enters staged Guided Setup state or an editor draft
only when the user checks/adds it. Changing the role does not remove skills the
user already selected.

The initial Software Engineer mapping is exactly the approved example:
JavaScript, TypeScript, React, Node.js, Express, MongoDB, Git, and Docker.
Other mappings must use only values in the approved skill catalogue and remain
small, reviewable product guidance.

### Searchable Skill Picker

The picker uses:

- a labelled `type=search` input;
- visible category headings;
- native checkboxes for filtered catalogue items;
- an editable custom skill input;
- an editable group input with the approved category names as suggestions;
- explicit Add/Apply and Remove actions; and
- a polite status message after a skill is added or deduplicated.

Approved category → canonical group names:

- Programming Languages
- Frontend
- Backend
- Databases
- Cloud / DevOps
- Testing
- Tools
- Soft Skills

The catalogue values are those supplied in the phase prompt. Matching and
deduplication are case-insensitive while preserving the first user-visible
spelling. A custom group is allowed within the existing 120-character group
name contract. The picker can be reused by Guided Setup and the existing
Skills editor without changing persistence.

### Experience action starters

For an empty Experience bullet, show the approved action words as compact
buttons in a bounded helper row. Activating `Implemented`, for example, writes
`Implemented ` into that bullet and focuses the existing textarea. Do not
apply a starter to non-empty text, replace existing content, add an entry, or
submit anything automatically. The user completes or rewrites the bullet.

### Achievement Builder

Place one collapsed `Build an achievement bullet` disclosure inside each
Experience entry. A focused component owns temporary Action, Work,
Technology, Result, and editable Preview fields. It creates no Resume content
until `Add bullet to this experience` is activated.

The deterministic draft is:

```text
{Action} {Work}
[using {Technology}]
[— {Result}]
```

For example, user-entered values `Built`, `a job tracking dashboard`, `React
and Node.js`, and `used by 25 testers` produce:

```text
Built a job tracking dashboard using React and Node.js — used by 25 testers.
```

Only bounded whitespace and one terminal punctuation mark are normalized.
The composer does not infer an article, rewrite facts, or infer technology,
metrics, or outcomes. The generated preview is an editable textarea before
insertion. Action and Work are required; Technology and Result are optional.
The builder never inserts a metric, percentage, revenue, saving, team size,
outcome, employer, or technology the user did not type.

### Education, language, certification, and interest helpers

- Qualification uses the prompt-approved local datalist: BSc, BSc (Hons),
  BEng, BA, MSc, MEng, MBA, Diploma, Higher Diploma, Certificate, and Other.
  Because the input remains editable, `Other` is not a forced terminal value.
- Current role and Currently studying retain their existing checkboxes.
- Existing free-form date inputs remain unchanged in this phase. A later
  presentation-only month helper may write `YYYY-MM` only after a separate
  compatibility approval; no persisted date contract change is justified.
- Language name remains editable. Proficiency becomes a native select with an
  empty option plus Native, Fluent, Professional, Intermediate, and Basic.
  Existing unknown proficiency strings must fall back to editable custom text
  rather than being erased; if that bounded fallback is judged too complex,
  keep the current text input and supply the values through a datalist.
- Certification name remains manual/editable. A certification datalist is
  not included until exact seed names are human-approved. No certification is
  ever preselected or inferred.
- Interest uses the exact supplied local suggestions through an editable
  datalist. Selecting a target role never inserts an interest.

### Canonical accessible PDF upload — findings 017 and 018

Extract the current upload UI into one Resume feature component and retain one
native `input[type=file]` with `accept="application/pdf,.pdf"`.

- A labelled button invokes that same input for click/keyboard selection.
- File drag/drop remains because the current source and browser workflow
  already support it truthfully.
- Selection and drop share one validator: exactly one PDF, non-empty, at most
  15 MB. Client MIME/extension checks are guidance; server MIME, magic-byte,
  quota, and ownership checks remain authoritative.
- Selected state announces filename and size and provides Replace and Remove.
  Replace resets then invokes the same native input; Remove clears component
  state and the native input value.
- Multiple or invalid dropped files produce an associated error and focus the
  canonical trigger/summary. No second native input is rendered.
- Busy/disabled states include visible text such as `Uploading and parsing…`.
- A synchronous `provider_not_configured` response is mapped to:
  `PDF import needs a connected Gemini account.` with a Settings link and the
  request ID. A terminal job configuration failure uses the same safe action.
  Raw provider bodies remain hidden. If availability is unknown, keep the
  action enabled and let the backend decide; do not prefetch two Settings
  endpoints merely to speculate.
- Preserve private-processing and no-OCR guidance.

### PDF Import Review & Confirmation

The present architecture cannot provide strict confirmation-before-adoption
frontend-only because the worker creates Resume and ResumeVersion before its
completed job result is observable. Merely stopping automatic navigation
would review already-adopted data and leave an unwanted record on Back.

The selected narrow contract change uses the existing owned job document as
the temporary candidate store; it does not add a second Resume schema:

1. Upload, private temporary asset creation, Gemini parsing, strict canonical
   validation, job fencing, and polling remain unchanged.
2. On successful parsing, the worker stores a completed result shaped as
   `{ kind: "import-review", content: ResumeContent }`. The job payload already
   contains the owned asset ID and user-supplied title. No
   Resume/ResumeVersion is created and the asset remains temporary.
3. The frontend validates the complete content with the existing canonical
   parser, converts it with `resumeContentToDraft`, and shows deterministic
   section indicators plus a collapsed read-only ATS preview.
4. Indicators say only `N entries extracted`, `Not found`, or a provable
   missing field such as `Full name not found`. They never show confidence
   percentages or unsupported `needs review` claims.
5. Back returns to the import form and retains the completed candidate in
   mounted state. Closing/reloading abandons it; the temporary asset and job
   expire instead of creating a Resume.
6. `POST /resume-analyses/import-pdf/:jobId/confirm` verifies authenticated
   ownership, completed job type/state, candidate result, payload title and
   asset, and canonical content. It then reuses `createResume` to atomically
   create pdf-import Version 1, preserves `sourceAssetId` uniqueness, promotes
   the private asset, and returns the standard workspace envelope.
7. Confirmation is naturally idempotent by owned job/source asset. A repeated
   confirmation returns the winning owned Resume workspace. Immediately after
   the first successful or reconciled adoption, replace the full candidate
   result with
   `{ kind: "import-adopted", resumeId, versionId, versionNumber }`. Repeated
   confirmation reads that small result and returns the same owned workspace.
8. `Confirm & Open in Editor` calls confirm once, validates the workspace, and
   navigates. Back and retry never adopt content.

This change preserves completed import fixes 001–003: strict structured
output, no partial Resume on validation failure, atomic Version 1 creation,
immutable versions, stable IDs, request IDs, ownership-safe 404s, private
storage, idempotency, cancellation/fencing, and provider policy.

#### Import-review personal-data retention

The current generic terminal-job retention is not sufficient by itself:
`completeJob` assigns `expiresAt = completedAt + JOB_RETENTION_DAYS`, and
`JOB_RETENTION_DAYS` defaults to 30. The existing storage mechanisms needed
for a bounded correction already exist:

- the upload controller creates the private temporary Resume PDF with
  `expiresInSeconds: 24 * 60 * 60`;
- the Asset record stores that exact `expiresAt`, and the existing hourly
  `assets.cleanup` job removes expired temporary storage objects; and
- `JobRecord` already has an `expiresAt` field and the MongoDB
  `jobs_retention_ttl` index with `expireAfterSeconds: 0`.

The minimum compatible implementation passes the temporary Asset's exact
`expiresAt` into `enqueueJob`, carries that existing earlier deadline through
the worker, and makes `completeJob` preserve it instead of replacing it with
the default 30-day terminal deadline. Owned polling and confirmation treat an
expired import-review job as unavailable even if MongoDB's asynchronous TTL
monitor has not physically deleted the document yet. Consequently,
unconfirmed candidate content is private, creates zero Resume records, and is
logically expired and TTL-eligible no later than its temporary PDF.

This requires small generic changes to `backend/src/jobs/job.queue.ts` and
`backend/src/jobs/job.worker.ts` in addition to the Resume-analysis files. It
does not require a new Mongo model, field, index, cleanup service, discard
endpoint, or Resume schema. Confirmation promptly replaces the full candidate
result with the adopted identity result above. The job can retain that small
identity until its already-bounded expiry so polling and repeated
confirmation remain safe and idempotent.

## Guided assistance levels and safety boundary

### Level 1 — deterministic suggestions

Titles, skills, qualifications, proficiency values, action verbs, and
interests come from readonly local data. They do not call Gemini and do not
become Resume content without a selection/add action.

### Level 2 — guided composition

The Achievement Builder combines only user-entered factual pieces into an
editable bullet. It performs deterministic whitespace/punctuation handling
only and does not call Gemini.

### Level 3 — explicit AI assistance

No Level 3 behavior is added. Existing explicit Role-aware assessment and
stored rewrite application remain unchanged and continue to require user
initiation, validated output, selection, confirmation, and immutable-version
creation.

### Exact truthfulness rules

- Never add an employer, role history, degree, certification, skill, years of
  experience, responsibility, achievement, metric, percentage, revenue,
  saving, team size, technology, result, or interest from inference.
- Target-role selection alone changes no skill checkbox and inserts no
  Experience record.
- Experience-level selection is not persisted or displayed as a candidate
  claim.
- Role-based suggestions are product guidance, not candidate facts.
- Every suggested factual value requires a visible user selection/add action.
- Every composed factual fragment originates in a user-controlled field.
- No automatic/background provider request is allowed.
- Do not log Resume/import content, filenames beyond existing safe storage
  metadata, job descriptions, prompts, tokens, credentials, or provider
  bodies.
- Preserve Gemini Direct only, fixed `gemini-3.6-flash`; OpenRouter and all
  other providers remain unavailable with no fallback.

## Contract-change classification

### Frontend-only using current persisted contracts

- full-width bounded collection grid and card hierarchy;
- unobstructed design schematic and current metadata;
- pager visibility when `pages > 1`;
- canonical chooser/query intent;
- Start blank;
- Guided Setup, including atomic Version 1 content through the existing create
  endpoint;
- local title, role/skill, qualification, proficiency, action, and interest
  suggestions;
- searchable grouped Skill Picker and custom skill/group entry;
- Experience starters and deterministic Achievement Builder;
- provider-configuration explanation and Settings link;
- one accessible PDF upload component with replace/remove; and
- preserving current date fields and current-role/studying controls.

These require frontend types/API wrapper changes but no persisted schema or
backend behavior change.

### Narrow backend and frontend API-contract change

Strict PDF Review & Confirmation before adoption requires the staged
`import-review` job result and owned confirm endpoint described above. It
changes backend service/controller/route/schema/job behavior and frontend
`ResumeJob`/parser/API behavior. It requires no new Mongo model, Resume schema,
ResumeVersion schema, provider, Gemini prompt/schema, or dependency.

`packages/shared-types` currently contains API/auth/Gemini settings types, not
Resume DTOs. Do not move or duplicate the Resume model there merely for this
phase; no shared-package file needs to change. “Shared contract” work remains
the existing feature-local frontend validator plus backend Zod contract.

### Not selected

- Actual content-bearing list thumbnails would require a list response or
  thumbnail asset contract and are not needed for finding 015.
- Replacing existing date strings with strict month/year values would require
  compatibility/migration decisions and is not needed for correctness.
- Certification suggestions remain out until exact seeds are approved.

## Exact proposed production files

### Create

- `frontend/src/features/resumes/resumeGuidance.ts` — readonly catalogues,
  role mapping, grouped-skill merge/deduplication, and achievement composition.
- `frontend/src/features/resumes/ResumeCreateDialog.tsx` — canonical chooser,
  blank/guided/import views, focus, job state, review, and confirmation.
- `frontend/src/features/resumes/ResumeGuidedSetup.tsx` — bounded guided form
  and explicit staged selections.
- `frontend/src/features/resumes/ResumeSkillPicker.tsx` — reusable grouped
  search, checkbox selection, and custom skill/group entry.
- `frontend/src/features/resumes/ResumePdfUpload.tsx` — the sole Resume PDF
  native file input and selection/drop/replace/remove behavior.
- `frontend/src/features/resumes/ResumeAchievementBuilder.tsx` — local
  deterministic Experience bullet composition.

### Modify

- `frontend/src/features/resumes/ResumeListPage.tsx`
- `frontend/src/features/resumes/ResumeEditor.tsx`
- `frontend/src/features/resumes/ResumeWorkspace.tsx`
- `frontend/src/features/resumes/resumeApi.ts`
- `frontend/src/features/resumes/resumeContracts.ts`
- `frontend/src/features/resumes/types.ts`
- `frontend/src/features/resumes/resumeWorkspace.css`
- `backend/src/modules/resume-analysis/resumeAnalysis.routes.ts`
- `backend/src/modules/resume-analysis/resumeAnalysis.controller.ts`
- `backend/src/modules/resume-analysis/resumeAnalysis.schemas.ts`
- `backend/src/modules/resume-analysis/resumeAnalysis.service.ts`
- `backend/src/modules/resume-analysis/resumeAnalysis.jobs.ts`
- `backend/src/jobs/job.queue.ts`
- `backend/src/jobs/job.worker.ts`

The two generic job-infrastructure files are the only additions to the
original audit boundary. They are authorized solely to pass the temporary
Asset's earlier `expiresAt` into the import job, preserve that existing earlier
deadline on successful completion, and avoid the default 30-day retention of
staged candidate Resume content. No other generic job behavior is in scope.

`frontend/src/AppShell.tsx`, `frontend/src/features/dashboard/MainDashboard.tsx`,
the Resume persistence models, `backend/src/modules/resumes/resume.service.ts`,
and `packages/shared-types/src/index.ts` are expected to remain unchanged. If
implementation evidence disproves that expectation, stop for architecture
review rather than expanding scope silently.

## Exact proposed test files

### Create

- `frontend/src/features/resumes/resumeGuidance.test.ts`
- `frontend/src/features/resumes/ResumeCreateDialog.test.tsx`
- `frontend/src/features/resumes/ResumeSkillPicker.test.tsx`
- `frontend/src/features/resumes/ResumePdfUpload.test.tsx`
- `frontend/src/features/resumes/ResumeAchievementBuilder.test.tsx`
- `backend/src/tests/integration/resumeCreation.integration.test.ts`

### Extend

- `frontend/src/features/resumes/ResumeListPage.test.tsx`
- `frontend/src/features/resumes/ResumeEditor.test.tsx`
- `frontend/src/features/resumes/ResumeWorkspace.test.tsx`
- `frontend/src/features/resumes/resumeApi.test.ts`
- `frontend/src/features/resumes/resumeContracts.test.ts`
- `frontend/src/routing/router.test.tsx`
- `backend/src/tests/integration/resumePdfImport.integration.test.ts`
- `backend/src/tests/integration/resumeJobIdempotency.integration.test.ts`
- `backend/src/tests/integration/jobResponse.integration.test.ts`
- `backend/src/tests/integration/crossUserAccess.integration.test.ts`
- `tests/browser/specs/resume.spec.cjs`

Existing Dashboard tests already pin `/resumes?action=create`; update them only
if an assertion must describe the unified destination, not to change the URL.

## Test-first production plan

1. Write pure failing catalogue/mapping/composition tests. Prove role changes
   select nothing, custom values survive, category merge preserves client IDs,
   and every Achievement Builder fragment comes from input.
2. Extend create API tests for optional canonical content and add backend route
   coverage proving Guided Setup creates exactly one Resume and Version 1.
3. Add failing unified-dialog/query tests, then replace inline forms with the
   chooser. Preserve unknown intents, focus return, request IDs, cancellation,
   and duplicate-submit guards.
4. Add failing collection/card/pager assertions, then implement the capped
   grid, non-overlay state, strong Open Resume action, and conditional pager.
5. Add failing upload component tests for one native input, select/drop,
   multiple/invalid files, filename, replace/remove, keyboard, and disabled
   explanations; then extract the current behavior.
6. Add failing Guided Setup and Skill Picker tests, then submit current
   canonical content through `POST /resumes` and verify no unselected fact is
   present.
7. Add failing editor-helper tests, then add job-title/qualification/language /
   interest suggestions, empty-bullet starters, and the inline Achievement
   Builder without altering the existing disclosure or validation flow.
8. Add failing backend tests showing successful parse creates zero Resumes,
   foreign confirmation is ownership-safe, abandoned candidates stay
   temporary, confirmation creates one Version 1, and repeated confirmation
   returns the same owned result. Implement the staged job result and confirm
   endpoint without changing the Gemini parser.
9. Add frontend import-review contract/UI tests. Prove deterministic counts,
   missing-field wording, Back without adoption, one confirmation request,
   safe request IDs, and confirmed navigation.
10. Run targeted suites, broader frontend/backend/security gates, typechecks,
    and builds, then prepare the human Chrome visual-QA handoff. Apply the
    three-attempt root-failure limit.

## Browser policy and human QA matrix

Codex browser use is prohibited during normal source inspection,
implementation, deterministic tests, typechecks, builds, documentation, and
responsive CSS work. Do not control the operator's Chrome, launch a browser
automatically after build, take implementation-proof screenshots, or repeat
the viewport matrix in another browser environment.

Only after focused and broad automated checks, typechecks, builds, and
`git diff --check` pass does the operator start the existing backend and
frontend and perform human Chrome QA. Codex browser may be used only for one
specific browser/runtime defect that remains unresolved after source/tests and
the operator's evidence; explain the exact state and viewport first, use the
minimum reproduction, and stop when the defect is verified or repaired.

| Viewport or mode | Required evidence |
| --- | --- |
| 1440 × 900 | Full-width collection, up to three capped cards, no oversized single/few card, dialog fits, strong Open Resume action, no preview overlay |
| 1024 × 768 | Bounded two-column-or-safe-one-column cards, usable chooser and review, no horizontal overflow |
| 768 × 1024 | Portrait collection and dialog reflow, keyboard reachability, no clipped picker categories |
| 390 × 844 | Single-column cards, scroll-bounded dialog, full-width actions, filename/replace/remove reachable |
| 320 × 720 | No horizontal overflow, focus visible, validation summary and all controls reachable |
| Actual human Chrome at 200% | Reflow, dialog containment, no focus loss, no mouse-only suggestions, review/confirm still usable |

At every applicable size verify loading, empty, error, one record, two records,
many records, and page-two states; Guided, blank, and import paths; long titles
and filenames; import unavailable/configuration copy; reduced motion; native
keyboard behavior; labels; Tab/Shift+Tab/Escape; Enter/Space; input/datalist /
select behavior; drag/drop plus keyboard-equivalent selection; and no content
or action covered by a badge.

The human Chrome workflow must additionally prove:

- AppShell, Dashboard, list heading, and empty state reach the same chooser;
- unselected role skills never enter the request;
- custom role/skill/qualification/language/interest values remain editable;
- current Skills group shape and Phase 19A-1 editor behavior remain intact;
- import parsing produces a review with zero Resume records before confirm;
- Back creates nothing; Confirm creates one owned Version 1 and opens it;
- existing Gemini import validation/idempotency/cancellation regressions pass;
- no unexpected provider request occurs during blank/guided/helper use; and
- human visual approval is obtained before commit.

## Approved decisions and implementation risks

1. The staged-job-result/confirm-endpoint design is approved as the only
   meaningful feature contract change. Its implementation must preserve
   completed finding 001.
2. Local role → skill mappings are approved as deterministic product guidance,
   not candidate truth.
3. A design-derived schematic satisfies “miniature Resume preview.” A
   content-accurate thumbnail is intentionally excluded.
4. Suggested sections are guidance-only and experience level is not persisted.
5. `Use target role as Resume headline` remains explicitly unchecked.
6. Certification seed names remain unspecified. The recommended minimum is
   no catalogue until a reviewed list is supplied.
7. Month/year replacement is not recommended in 19A-2 because current strings
   are unconstrained. Existing date entry remains functional and compatible.
8. Abandoned import candidates reuse the existing Asset expiry, job
   `expiresAt`, Mongo TTL index, and hourly Asset cleanup. The implementation
   must carry the Asset's earlier deadline through successful job completion;
   no new discard endpoint or cleanup system is proposed.

## Recommended implementation sequence

1. Local pure guidance utilities and current create-content contract.
2. Unified chooser, collection/card hierarchy, pagination, and canonical
   upload extraction.
3. Guided Setup and searchable grouped Skill Picker.
4. Editor suggestions, starters, and Achievement Builder.
5. Narrow backend staged import/confirm contract.
6. Frontend Import Review and confirmation.
7. Targeted-to-broad automated verification, human Chrome responsive/200%
   review, and documentation closeout. Codex browser remains prohibited unless
   a specific browser-only defect requires the bounded exception above.

This sequence keeps frontend-only work independently reviewable, postpones the
only backend contract change until its tests are explicit, and leaves Phase
19A-3 and Phase 19A-4 untouched.

## Current boundary

This human-approved document is the Phase 19A-2 implementation design
authority. `docs/planning/CURRENT_PHASE.md` still limits the current run to
design correction and implementation planning. No production code, executable
test, dependency, schema, provider configuration, Gemini request, browser
runtime, Git stage, commit, push, PR, merge, or deploy was performed by this
planning run.
