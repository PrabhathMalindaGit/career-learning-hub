# Career Learning Hub — Viva Feature & UI Location Map

## Purpose

This guide is the authoritative viva-preparation map for the current Career Learning Hub implementation. It links stable feature numbers to visible UI locations, exact user controls, state/visual behavior, and the principal frontend/backend/shared/test implementation locations.

Career Learning Hub is an integrated authenticated web application comprising Resume Studio, Interview Coach and Learning Workspace, supported by shared authentication, persistence, private storage, background processing and controlled Gemini integration.

## How to read each feature entry

Detailed entries use the following fields where relevant:

- **UI path** — navigation path a user follows.
- **Route** — current React Router route or route family.
- **Screen / section** — visible workspace or panel.
- **Control** — exact user-facing button, link, input or state surface.
- **Control location** — where the control appears within the current screen.
- **Enabled when** — prerequisite state for an action.
- **Visual / state behavior** — normal, hover, selected, disabled, busy, success, warning, error or destructive behavior supported by current source/CSS.
- **What happens** — immediate user-visible result and important control-flow boundary.
- **Frontend** — principal component/file.
- **Frontend API / gateway** — client API module when relevant.
- **Backend** — principal route/controller/service/job boundary when relevant.
- **Shared contract** — cross-layer contract/type file when relevant.
- **Representative tests** — existing automated evidence useful for locating or explaining the behavior.
- **Viva-ready explanation** — short explanation suitable for an examiner question.

## Canonical protected-route map

```text
/login
/register
/dashboard
/resumes
/resumes/:resumeId
/interviews
/interviews/:sessionId
/learning
/learning/documents/:documentId
/learning/documents/:documentId/conversations/:conversationId
/learning/documents/:documentId/flashcards/:setId
/learning/documents/:documentId/quizzes/:quizId
/learning/documents/:documentId/quizzes/:quizId/attempts/:attemptId
/settings
```

The application does not define a separate Activity route or a separate study-set rename route.

## Shared visual/action language

The current common UI vocabulary is:

- **Primary** — solid Career Learning Hub green (`--accent: #287a4a`) with white text; hover uses darker green (`--accent-dark: #1e6039`).
- **Secondary** — light/neutral supporting action using the shared border/surface-muted treatment.
- **Quiet / tertiary** — low-emphasis action; transparent by default with restrained hover treatment.
- **Destructive** — solid red (`#a33b3b`) with darker red hover (`#842424`).
- **Disabled** — non-interactive muted state. Shared buttons use reduced opacity; feature-specific controls may define a more precise disabled presentation.
- **Busy** — the action remains identifiable while the label/status changes, for example `Saving…`, `Creating…`, `Uploading…`, `Generating…` or `Testing…`.
- **Active navigation/tab/filter** — selected treatment identifies the current context. Main navigation uses a pale green active background with a green inset indicator.
- **Status surfaces** — success, warning, error and information feedback communicate state rather than acting as primary actions.

## Stable feature-number index

### 1 — Access & Navigation

- **1.1** Register
- **1.2** Login
- **1.3** Authenticated application shell
- **1.4** Sidebar/mobile navigation
- **1.5** Global Create menu
- **1.6** Logout/session handling

### 2 — Dashboard

- **2.1** Progress overview
- **2.2** Continue/Create Resume
- **2.3** Continue/Start Interview
- **2.4** Open/Upload Learning document
- **2.5** Recent activity

### 3 — Resume Studio

- **3.1** Resume collection
- **3.2** Resume creation
  - **3.2.1** Guided setup
  - **3.2.2** Start blank
  - **3.2.3** Import PDF
- **3.3** Resume editor
- **3.4** Live preview
- **3.5** Save new immutable version
- **3.6** Design/template controls
- **3.7** Candidate photo
- **3.8** Print / Save as PDF
- **3.9** AI-assisted role assessment
- **3.10** AI recommendations
- **3.11** Version history
- **3.12** Draft recovery / unsaved-change protection

### 4 — Interview Coach

- **4.1** Interview session collection
- **4.2** Create interview
- **4.3** Career area / role / experience configuration
- **4.4** AI question generation
- **4.5** Manual question creation
- **4.6** Question types
- **4.7** Question filtering and pinning
- **4.8** Private notes
- **4.9** Save practice attempt
- **4.10** Saved-attempt history
- **4.11** Question explanation
- **4.12** AI feedback
- **4.13** Session archive/restore/delete

### 5 — Learning Workspace

- **5.1** PDF upload
- **5.2** Document processing
- **5.3** Document library
- **5.4** Overview / summary
- **5.5** Secure original PDF viewer
- **5.6** Extracted page-aware content
- **5.7** Grounded Chat
  - **5.7.1** Create conversation
  - **5.7.2** Send question
  - **5.7.3** Source-page references
- **5.8** Flashcards
  - **5.8.1** Generate
  - **5.8.2** Study
  - **5.8.3** Reveal answer / navigation
- **5.9** Quizzes
  - **5.9.1** Generate
  - **5.9.2** Take quiz
  - **5.9.3** Review saved attempt
- **5.10** Learning resource deletion

### 6 — Settings & Gemini

- **6.1** Gemini connection status
- **6.2** Fixed Gemini model display
- **6.3** Application-managed Gemini
- **6.4** Personal Gemini key
- **6.5** Save and test key
- **6.6** Test connection
- **6.7** Replace key
- **6.8** Disconnect
- **6.9** Delete personal key
- **6.10** AI usage diagnostics
- **6.11** Account/session information

### 7 — Shared Platform Controls

- **7.1** Authentication/session security
- **7.2** Ownership/authorization
- **7.3** Private file storage
- **7.4** Background jobs
- **7.5** Progress polling
- **7.6** Cancel/retry handling
- **7.7** Validation before persistence
- **7.8** Error/request-ID handling
- **7.9** Responsive/accessibility behavior

---

## 1 — Access & Navigation

### 1.1 Register

- **UI path:** Public entry → `Create an account` from Login, or `/register` directly.
- **Route:** `/register`.
- **Screen / section:** `Create your account` authentication screen.
- **Control:** `Create account`; fields `Display name`, `Email address`, `Password`; password visibility button is exposed accessibly as `Show password` / `Hide password`.
- **Control location:** Primary submit action below the registration form; `Sign in` switch appears beneath the form.
- **Enabled when:** The form is not busy. Client validation requires a 2–100 character display name, valid email, and a 12–128 character password containing uppercase, lowercase and a number.
- **Visual / state behavior:** `Create account` uses the shared primary green treatment. During submission it is disabled/`aria-busy` and changes to `Creating account…`. Validation errors are surfaced inline and in a focusable summary; safe Request ID details can be disclosed for API errors.
- **What happens:** A successful registration creates the account/session through the authentication API and returns the user to the intended safe location, normally the protected application.
- **Frontend:** `frontend/src/features/auth/RegisterPage.tsx`, `AuthenticationShell.tsx`, `AuthProvider.tsx`.
- **Backend:** `backend/src/modules/auth/auth.routes.ts`, `auth.controller.ts`, `auth.service.ts`, `authSession.model.ts`, `token.service.ts`.
- **Representative tests:** `frontend/src/features/auth/authenticationPhase19e.test.tsx` and existing backend authentication/security tests.
- **Viva-ready explanation:** Registration is a public-only route. The browser performs usability validation first, while the backend remains authoritative for account/session creation and protected access.

### 1.2 Login

- **UI path:** Public entry → `/login`; Registration also links back with `Sign in`.
- **Route:** `/login`.
- **Screen / section:** `Welcome back` authentication screen.
- **Control:** `Sign in`; fields `Email address`, `Password`; password visibility button is exposed as `Show password` / `Hide password`.
- **Control location:** Primary submit action below the credentials form; `Create an account` appears beneath the form.
- **Enabled when:** The form is not busy and client-side email/password checks pass.
- **Visual / state behavior:** `Sign in` is a shared primary green button. During authentication it becomes disabled/`aria-busy` and reads `Signing in…`. Genuine expired-session routing displays `Your session expired. Sign in again to continue.`. API failures keep the user on Login with safe error text and optional Request ID details.
- **What happens:** `AuthProvider` establishes the authenticated client state and the router returns the user to the preserved safe internal destination.
- **Frontend:** `frontend/src/features/auth/LoginPage.tsx`, `AuthProvider.tsx`, `AuthRoute.tsx`.
- **Backend:** `backend/src/modules/auth/auth.routes.ts`, `auth.controller.ts`, `auth.service.ts`, `authSession.model.ts`, `token.service.ts`.
- **Representative tests:** `frontend/src/features/auth/authenticationPhase19e.test.tsx`, `AuthProvider.test.tsx`, and backend auth/security coverage.
- **Viva-ready explanation:** Login is intentionally separated from the protected shell. A successful session unlocks protected routes; session expiry redirects back to Login while preserving the safe intended destination.

### 1.3 Authenticated application shell

- **UI path:** Any protected feature after authentication.
- **Route:** Parent shell for `/dashboard`, `/resumes`, `/interviews`, `/learning`, `/settings` and their child workspaces.
- **Screen / section:** Persistent desktop sidebar or mobile header/drawer surrounding the routed feature content.
- **Control:** Career Learning Hub brand link, global `Create`, primary navigation, account summary and `Log out`.
- **Control location:** Desktop controls remain in the left sidebar; mobile uses a top header and modal navigation drawer.
- **Visual / state behavior:** The shell uses shared focus-visible treatment and responsive layout rules; child features render in the `<main id="main-content">` area and the `Skip to main content` link supports keyboard navigation.
- **What happens:** The shell supplies common navigation/session controls while React Router renders the selected protected workspace through `Outlet`.
- **Frontend:** `frontend/src/AppShell.tsx`; route composition in `frontend/src/routing/router.tsx`.
- **Backend:** Protected APIs rely on `backend/src/middleware/authenticate.ts` for current user/session context.
- **Representative tests:** `frontend/src/routing/router.test.tsx`, shell/auth/logout regression tests.
- **Viva-ready explanation:** The application shell is shared infrastructure: it avoids duplicating navigation and session controls inside Resume, Interview and Learning while each domain keeps its own workspace logic.

### 1.4 Sidebar/mobile navigation

- **UI path:** Authenticated shell.
- **Route destinations:** `/dashboard`, `/resumes`, `/interviews`, `/learning`, `/settings`.
- **Control:** `Dashboard`, `Resumes`, `Interviews`, `Learning`, `Settings`; mobile `Menu` / `Close`.
- **Control location:** Vertical left sidebar on wider layouts. On narrow layouts the `Menu` button opens the `Navigation` drawer.
- **Visual / state behavior:** Normal nav text is neutral; hover uses a light surface. The active destination uses darker green text, pale green background and an inset green left indicator. Mobile drawer opening/closing uses the existing accessible Dialog focus-return behavior.
- **What happens:** Selecting a nav item changes the protected route; mobile navigation closes as route location changes.
- **Frontend:** `frontend/src/AppShell.tsx`; shared rules in `frontend/src/styles.css`; routes in `frontend/src/routing/router.tsx`.
- **Viva-ready explanation:** Desktop and mobile navigation use the same destination list, so responsiveness changes presentation rather than creating a separate navigation model.

### 1.5 Global Create menu

- **UI path:** Authenticated shell → `Create`.
- **Control:** `Create`, then `Resume`, `Interview session`, or `Learning document`.
- **Control location:** Near the top of the desktop sidebar; repeated inside the mobile navigation drawer.
- **Visual / state behavior:** `Create` uses the primary green shell treatment and darkens when hovered/open. Menu items appear in a bordered surface and gain a light hover background.
- **What happens:** The menu uses existing feature routes with query intent rather than duplicating creation logic:
  - `Resume` → `/resumes?action=create`
  - `Interview session` → `/interviews?action=create`
  - `Learning document` → `/learning?action=upload`
- **Frontend:** `frontend/src/AppShell.tsx`; destination pages own the actual creation/upload flows.
- **Viva-ready explanation:** The Create menu is only a shortcut dispatcher. Each destination feature remains authoritative for validation, persistence and workflow state.

### 1.6 Logout/session handling

- **UI path:** Authenticated shell → account/session area.
- **Control:** `Log out`.
- **Control location:** Bottom of the desktop sidebar and bottom of the mobile navigation drawer beneath the account summary.
- **Enabled when:** No logout request is already pending.
- **Visual / state behavior:** Neutral bordered control. During logout it is disabled and changes to `Logging out…`; a ref prevents duplicate logout requests.
- **What happens:** `AuthProvider.logout()` ends/clears the current client session state. Mobile logout closes the drawer before invoking the same shared handler.
- **Frontend:** `frontend/src/AppShell.tsx`, `frontend/src/features/auth/AuthProvider.tsx`.
- **Backend:** Authentication/session route/service and `authSession.model.ts`; protected requests are rejected by `authenticate.ts` when the session is absent, revoked or expired.
- **Representative tests:** `frontend/src/features/auth/logoutPhase19e.test.tsx`, `AuthProvider.test.tsx`.
- **Viva-ready explanation:** Logout is single-flight so the desktop and mobile controls cannot create duplicate session-ending calls; the same protected-route boundary then prevents access with an invalid session.

## 2 — Dashboard

### 2.1 Progress overview

- **UI path:** `Dashboard`.
- **Route:** `/dashboard`.
- **Screen / section:** `Unified dashboard` → `Performance period`, performance summary, latest Resume readiness and trend panels.
- **Control:** `7 days`, `30 days`, `90 days`, `365 days`; retry controls appear only on failures.
- **Control location:** Performance-period selector sits immediately above the outcome metrics/trends it controls.
- **Visual / state behavior:** Selected period is exposed with `aria-pressed`. Loading uses skeleton/status surfaces; failures use a safe alert with `Retry progress` and Request ID when available. Outcome cards keep raw percentages primary and add semantic interpretation such as `Needs review`, `Developing` or `Strong result` when a numeric score exists.
- **What happens:** `fetchProgressSnapshot` reloads bounded Resume, Interview and Quiz performance for the selected period. Stale requests are aborted/identity-checked before state replacement.
- **Frontend:** `frontend/src/features/dashboard/MainDashboard.tsx`, `ProgressWidgets.tsx`, `dashboardScorePresentation.ts`, `dashboardApi.ts`.
- **Representative tests:** `frontend/src/features/dashboard/MainDashboard.test.tsx`, `dashboardScorePresentation.test.ts`, `dashboardPhase19d.test.tsx`, `dashboardApi.test.ts`.
- **Viva-ready explanation:** The Dashboard summarizes existing owned domain data; it does not become another source of truth for Resume, Interview or Learning records.

### 2.2 Continue/Create Resume

- **UI path:** `Dashboard` → `Continue your work`.
- **Control:** `Continue Resume` when a latest analyzed Resume exists; otherwise `Create Resume`.
- **Control location:** First card in the three-card Continue-your-work section near the top of the Dashboard.
- **Visual / state behavior:** The Resume continuation card uses the Dashboard forest treatment. When available it shows the target role plus the latest readiness percentage; otherwise it shows creation guidance.
- **What happens:** `Continue Resume` opens `/resumes/:resumeId`; `Create Resume` opens `/resumes?action=create`.
- **Frontend:** `frontend/src/features/dashboard/MainDashboard.tsx` → Resume route owned by `frontend/src/features/resumes/`.
- **Viva-ready explanation:** The Dashboard decides whether to continue or create from the existing progress snapshot; Resume Studio still owns the actual Resume workflow.

### 2.3 Continue/Start Interview

- **UI path:** `Dashboard` → `Continue your work`.
- **Control:** `Continue Interview` when scored/active practice exists; otherwise `Start Interview Session`.
- **Control location:** Middle continuation card.
- **Visual / state behavior:** Existing scored feedback is summarized as `Latest feedback N%`; an active session without a recent scored point uses `Open your active Interview practice.`.
- **What happens:** A specific latest scored session opens `/interviews/:sessionId`; an active-session fallback opens `/interviews`; the creation fallback opens `/interviews?action=create`.
- **Frontend:** `frontend/src/features/dashboard/MainDashboard.tsx` → Interview route owned by `frontend/src/features/interviews/`.
- **Viva-ready explanation:** The shortcut reuses existing Interview state and routes; it does not create or score interviews itself.

### 2.4 Open/Upload Learning document

- **UI path:** `Dashboard` → `Continue your work`.
- **Control:** `Open Learning Document` when a recent document exists; otherwise `Upload Learning Document`.
- **Control location:** Third continuation card.
- **Visual / state behavior:** Existing document card shows title plus normalized document status; empty-state action explains that a private PDF can be added.
- **What happens:** Existing document opens `/learning/documents/:documentId`; upload fallback opens `/learning?action=upload`.
- **Frontend:** `frontend/src/features/dashboard/MainDashboard.tsx` → Learning route owned by `frontend/src/features/learning/`.
- **Viva-ready explanation:** The Dashboard gives a direct route back into the latest Learning document or the existing upload flow without duplicating document processing.

### 2.5 Recent activity

- **UI path:** `Dashboard` → `Recent activity`.
- **Route:** `/dashboard`; there is intentionally no separate Activity route.
- **Control:** `View all activity`; expanded view adds `Previous`, `Next`, and `Show recent activity only`.
- **Control location:** Activity panel below the progress/continuation content.
- **Enabled when:** `View all activity` appears only when total activity exceeds the collapsed events. Pager actions follow page boundaries.
- **Visual / state behavior:** Collapsed chip shows `N recent`; expanded chip shows `TOTAL total`. Initial collapsed requests use five events; expanded pages use ten. Refreshing can show `Updating activity`; errors expose `Retry activity` and a safe Request ID.
- **What happens:** Expansion resets to page 1 and requests the expanded page size; collapse returns to page 1/limit 5. Request identity plus `AbortController` prevents obsolete mode/page responses from replacing current activity.
- **Frontend:** `frontend/src/features/dashboard/MainDashboard.tsx`, `ActivityFeed.tsx`, `dashboardApi.ts`.
- **Representative tests:** `frontend/src/features/dashboard/MainDashboard.test.tsx`, `dashboardPhase19d.test.tsx`, `dashboardApi.test.ts`.
- **Viva-ready explanation:** Recent Activity is a bounded audit-style summary of recorded user activity on the Dashboard, with explicit expansion rather than a separate feature page.

## 3 — Resume Studio

### 3.1 Resume collection

- **UI path:** `Resumes`.
- **Route:** `/resumes`.
- **Screen / section:** `Resume Studio` → `Your resumes` collection.
- **Control:** `Create Resume`, `Open Resume`, per-card More actions/delete control, `Previous`, `Next`, failure `Retry list`.
- **Control location:** `Create Resume` is the heading action; `Open Resume` is the dominant action on each Resume card.
- **Visual / state behavior:** Collection cards show title, status, version, appearance metadata and updated date. Empty state offers `Create your first resume`; loading uses skeleton cards.
- **What happens:** Opening a card navigates to `/resumes/:resumeId`; creation opens the shared Resume creation dialog. Permanent deletion is separately confirmed and owner-scoped.
- **Frontend:** `frontend/src/features/resumes/ResumeListPage.tsx`, `ResumeDeleteDialog.tsx`, `ResumeMiniDocument.tsx`.
- **Frontend API / gateway:** `frontend/src/features/resumes/resumeApi.ts`.
- **Backend:** `backend/src/modules/resumes/resume.routes.ts`, `resume.controller.ts`, `resume.service.ts`.
- **Representative tests:** `ResumeListPage.test.tsx` and Resume deletion/API integration tests.
- **Viva-ready explanation:** The collection page is a catalogue and entry point. Editing/versioning stays inside the canonical Resume workspace rather than being duplicated on cards.

### 3.2 Resume creation

- **UI path:** `Resumes` → `Create Resume`, or global `Create` → `Resume`.
- **Route:** `/resumes?action=create` opens the same dialog and then clears the query intent.
- **Screen / section:** `Create Resume` dialog.
- **Control:** `Guided setup`, `Start blank`, `Import PDF`, `Cancel`.
- **Visual / state behavior:** Guided setup carries a visible `Recommended` badge. All three choices lead into bounded subflows inside the same dialog.
- **What happens:** The selected method either creates a validated Resume directly or stages/imports data before the canonical `/resumes/:resumeId` workspace opens.
- **Frontend:** `frontend/src/features/resumes/ResumeCreateDialog.tsx`.
- **Frontend API / gateway:** `frontend/src/features/resumes/resumeApi.ts`.
- **Backend:** `backend/src/modules/resumes/`, plus `backend/src/modules/resume-analysis/` for PDF import processing.
- **Representative tests:** `ResumeCreateDialog.test.tsx`, `ResumePdfUpload.test.tsx`, `resumeApi.test.ts` and Resume creation/PDF-import integration tests.
- **Viva-ready explanation:** Creation is one shared flow with three deliberate entry methods; it does not create separate Resume data models.

#### 3.2.1 Guided setup

- **Control:** `Guided setup` → the guided Resume setup form and final guided creation action.
- **What happens:** Deterministic role/skill/experience/education guidance remains editable and optional before canonical Resume content is created.
- **Frontend:** `ResumeGuidedSetup.tsx`, role/skill guidance helpers, `ResumeAchievementBuilder.tsx`.
- **Viva-ready explanation:** Guidance assists structured entry but does not silently invent or lock candidate information.

#### 3.2.2 Start blank

- **Control:** `Start blank`; field `Resume title`; actions `Back` and `Create blank resume`.
- **Enabled when:** Title trims to 1–120 characters and creation is not already busy.
- **Visual / state behavior:** Creation action becomes disabled/`aria-busy` and reads `Creating…` while the request is active.
- **What happens:** A blank canonical Resume is created and immediately opened in Resume Studio.
- **Frontend:** `ResumeCreateDialog.tsx` → `createResume()` in `resumeApi.ts`.
- **Viva-ready explanation:** Blank creation is the minimum path: only the title is required before the normal editor becomes authoritative.

#### 3.2.3 Import PDF

- **Control:** `Import PDF`; `Imported resume title`; private PDF picker; `Import private PDF`; status/resilience actions; final `Confirm and open in editor`.
- **Enabled when:** A valid title and one PDF no larger than 15 MB are selected; confirmation occurs only after a completed validated Import Review.
- **Visual / state behavior:** Initial action reads `Checking import…` while active. Job state shows `Import queued/processing/...`, `N% checked`, shared cancel/retry actions and `Check status` if polling pauses. Missing Gemini connection shows `PDF import needs a connected Gemini account.` with `Open Settings`.
- **What happens:** The PDF is privately uploaded and processed as a background job. `Import Review` shows extracted evidence and an optional detected candidate-photo choice. No Resume is adopted until the user explicitly selects `Confirm and open in editor`.
- **Frontend:** `ResumeCreateDialog.tsx`, `ResumePdfUpload.tsx`, `ResumeImportPhotoChoices.tsx`, `resumePolling.ts`.
- **Backend:** `resumeAnalysis.jobs.ts`, `resumeAnalysis.service.ts`, `resumeParsing.service.ts`, private Asset services and Resume confirmation path.
- **Representative tests:** Resume PDF-import contract/integration tests and candidate-photo import tests.
- **Viva-ready explanation:** Import is staged deliberately: parsing/AI output is reviewed before it becomes user-owned Resume content, and the source PDF remains private.

### 3.3 Resume editor

- **UI path:** `Resumes` → `Open Resume`.
- **Route:** `/resumes/:resumeId`.
- **Screen / section:** Main Resume Studio workspace → canonical editor.
- **Control:** Direct editable Resume sections, validation links and section-specific add/remove/edit controls.
- **Enabled when:** The workspace is loaded, not applying/saving, and no recovery decision blocks editing.
- **Visual / state behavior:** Validation summary `Review the highlighted resume content` links directly to the affected editor field. Editing a historical snapshot returns the user to the current draft before accepting changes.
- **What happens:** Edits modify the local canonical draft only. They do not alter stored Resume content until Feature 3.5 creates a new version.
- **Frontend:** `ResumeWorkspace.tsx`, `ResumeEditor.tsx`, `resumeDraft.ts`.
- **Backend:** Persistence occurs through Resume version APIs/services only on explicit save.
- **Representative tests:** `ResumeEditor.test.tsx`, `ResumeWorkspace.test.tsx`, draft/validation tests.
- **Viva-ready explanation:** The editor separates draft state from persisted immutable versions, which makes unsaved changes explicit and recoverable.

### 3.4 Live preview

- **UI path:** Same `/resumes/:resumeId` workspace, beside/below the editor depending on width.
- **Control:** No separate submit action; it reacts to the current draft and preview appearance selection.
- **Visual / state behavior:** All three templates preserve realistic document proportions; desktop uses the established editor/preview layout and narrower layouts allow the preview to remain scrollable/readable.
- **What happens:** `ResumePreview` renders the current draft immediately without persisting it. Printable/historical preview variants reuse the same canonical rendering architecture.
- **Frontend:** `ResumePreview.tsx`, template registry/renderers, Resume preview/print CSS.
- **Representative tests:** Resume preview/template/live-preview/print-parity tests.
- **Viva-ready explanation:** Preview is presentation-only; changing the preview cannot bypass the explicit save/version workflow.

### 3.5 Save new immutable version

- **UI path:** Open Resume → workspace heading actions.
- **Control:** `Save new version`; keyboard shortcut shown as `⌘S` on Mac or `Ctrl+S`; quiet `Discard changes` appears when a draft is dirty.
- **Enabled when:** There are unsaved changes; no save/apply/print conflict is active; the user is not viewing a historical snapshot; recovery has been resolved; no blocking conflict exists.
- **Visual / state behavior:** `Save new version` is the workspace's highest-emphasis constructive green action. Canonical status cycles among `Version N saved`, `Unsaved changes`, `Saving…`, `Save failed`, or `Recovery decision required`.
- **What happens:** Client validation runs first; the backend then validates/persists a new immutable version with expected-current-version conflict protection. Successful save updates history and cleans obsolete local recovery data.
- **Frontend:** `ResumeWorkspace.tsx`, `resumeApi.ts`, `resumeDraft.ts`.
- **Backend:** `resume.controller.ts`, `resume.service.ts`, Resume validation/version models.
- **Representative tests:** `ResumeWorkspace.test.tsx`, save/recovery tests, `resumeVersionPersistence.integration.test.ts`.
- **Viva-ready explanation:** Existing versions are never overwritten. Each accepted save creates a new auditable snapshot, which also gives AI assessment a stable version target.

### 3.6 Design/template controls

- **UI path:** Open Resume → `Resume appearance`.
- **Control:** `Customize` / `Close customization`; Template choices; Typography choices; Color choices; `Reset changes`; `Save appearance`.
- **Control location:** Appearance panel above the editor/assessment content.
- **Visual / state behavior:** Current summary displays Template • Font • Palette • Paper size. Template cards identify `Selected` and include `Best for`; changes preview immediately. Dirty state reads `Unsaved appearance changes`; save reads `Saving appearance…` then `Resume design saved.`.
- **What happens:** Appearance selection updates preview immediately but only `Save appearance` persists approved template/font/palette choices. Paper size is intentionally controlled by Feature 3.8.
- **Frontend:** `ResumeDesignControls.tsx`, `resumeTemplateRegistry.ts`, appearance CSS.
- **Backend:** Resume design update path in `resume.controller.ts` / `resume.service.ts`.
- **Representative tests:** template registry, appearance controls and visual/print contract tests.
- **Viva-ready explanation:** Content versions and presentation settings are separate concerns: historical saved content uses the current Resume design by the product's existing design contract.

### 3.7 Candidate photo

- **UI path:** Open Resume → `Candidate photo` panel.
- **Control:** `Choose photo` / `Replace photo`; `Hide from Resume` / `Show on Resume`; destructive `Remove photo`; confirmation `Keep photo` / `Remove photo`; failure `Retry saved photo`.
- **Enabled when:** No presentation mutation/recovery blocker is active. Accepted uploads are JPEG/PNG/WebP, maximum 2 MiB, 4096×4096 and 16 MP.
- **Visual / state behavior:** Status is `Not added`, `Shown` or `Hidden`; busy state reads `Saving candidate photo…`.
- **What happens:** Photo bytes use private Asset storage and authoritative backend validation. Show/hide changes presentation state; removal does not rewrite Resume version content.
- **Frontend:** `ResumeCandidatePhotoControls.tsx`, candidate-photo gateway/validation helpers, `ResumeWorkspace.tsx`.
- **Backend:** `resumePhoto.service.ts`, `asset.service.ts`, Resume design/service boundaries.
- **Representative tests:** candidate-photo component/API/asset-policy/integration/security tests.
- **Viva-ready explanation:** The photo is optional private presentation data at the Resume level, not part of the versioned Resume content or AI assessment payload.

### 3.8 Print / Save as PDF

- **UI path:** Open Resume → `Print / Save as PDF`.
- **Control:** `Paper size` (`A4` / `Letter`) and `Open print dialog`.
- **Enabled when:** A saved current/historical version is selected; recovery, source loading, presentation mutation, photo loading/error, print preparation and unsaved-current-draft blockers are clear.
- **Visual / state behavior:** Readiness states include `Ready to print / save as PDF` or an explicit reason why export is blocked. Busy action reads `Preparing print…`; page-size persistence reads `Saving paper size…`.
- **What happens:** The application uses native browser printing; the user chooses `Save as PDF` and is instructed to disable browser `Headers and footers` for the final file.
- **Frontend:** `ResumePrintControls.tsx`, `resumePrint.ts`, printable `ResumePreview`.
- **Backend:** Paper-size preference persists through the existing Resume design endpoint; no separate PDF rendering backend is introduced.
- **Representative tests:** `ResumePrintControls.test.tsx`, `resumePrint.test.ts`, print-parity/preview tests.
- **Viva-ready explanation:** Export deliberately reuses browser print/PDF support instead of adding a second document-rendering architecture.

### 3.9 AI-assisted role assessment

- **UI path:** `Resumes` → open Resume → `Role-aware assessment`.
- **Route:** `/resumes/:resumeId`.
- **Control:** Inputs `Target role`, `Company (optional)`, `Job description (optional)`; action `Run AI-assisted assessment`; paused-status action `Check status`; shared cancel/retry controls while the background job is active.
- **Control location:** Role-aware assessment panel beside/below the main editor/preview content in the canonical workspace.
- **Enabled when:** There is no unsaved draft, no recovery decision, assessment is not busy, and trimmed Target role contains at least 2 characters.
- **Visual / state behavior:** If the draft is dirty, the workspace states `Save or discard draft changes before assessing this resume.`. Busy label is `Checking assessment…`; progress shows `N% checked`. The assessment action intentionally uses a restrained pale-green scoped treatment rather than the stronger Feature 3.5 save action:
  - normal border `#b9cec1`
  - normal text `#245e3c`
  - normal background `#eef6f1`
  - hover border `#aac2b3`
  - hover background `#e5f0e9`
  - disabled border `#c8d5cd`
  - disabled text `#66756c`
  - disabled background `#f1f5f2`
  - disabled opacity `1`
- **What happens:** `queueResumeAnalysis()` sends the current **saved** `versionId` plus target context. The durable `resume.analyze` job is polled; completion is accepted only when job kind/type, Resume ID, Resume version ID and fetched analysis identity/score all match the expected saved version.
- **Frontend:** `ResumeWorkspace.tsx`, `ResumeAssessmentActionUi.css`, `resumeApi.ts`, `resumePolling.ts`, shared `JobResilienceActions.tsx`.
- **Backend:** `resumeAnalysis.routes.ts`, `resumeAnalysis.controller.ts`, `resumeAnalysis.jobs.ts`, `resumeAnalysis.service.ts`.
- **Representative tests:** `ResumeAssessmentActionUi.test.tsx`, `ResumeWorkspace.test.tsx`, `resumeJobIdempotency.integration.test.ts`, AI retry/persistence and response-validation tests.
- **Viva-ready explanation:** Assessment is bound to a saved immutable Resume version. That prevents an AI result from being confused with later unsaved edits and lets the UI reject a mismatched/stale result.

### 3.10 AI recommendations

- **UI path:** Same Resume workspace → `AI-assisted assessment` result after Feature 3.9 completes.
- **Control:** Suggestion selection controls; `Apply selected suggestions`; confirmation `Cancel` / `Create new version`.
- **Enabled when:** A non-stale completed assessment exists, at least one suggestion is selected, and no apply operation is active.
- **Visual / state behavior:** Result state is `Awaiting assessment`, `Assessment running`, `Completed result` or `Stale assessment`. The panel shows the assessment gauge, four 25-point categories, strengths, review points, potential missing keywords and explicit suggested rewrites. Stale results cannot be applied.
- **What happens:** Selected suggestion IDs are submitted explicitly. Successful application creates another immutable Resume version and marks the prior assessment stale.
- **Frontend:** `AiRecommendations.tsx`, `ResumeSuggestionComparison.tsx`, `ResumeWorkspace.tsx`, `resumeApi.ts`.
- **Backend:** Resume analysis suggestion application in `resumeAnalysis.controller.ts` / `resumeAnalysis.service.ts` plus Resume version persistence.
- **Representative tests:** Resume recommendation/assessment/workspace and persistence tests.
- **Viva-ready explanation:** AI does not silently rewrite the candidate's Resume. The user selects changes, confirms them, and receives a new immutable version that can be reviewed or compared.

### 3.11 Version history

- **UI path:** Open Resume → version timeline below the main workspace.
- **Control:** View/select version controls and timeline `Previous` / `Next`; when a snapshot is open, `Return to current draft`.
- **Visual / state behavior:** Current and historical sources are labelled. A selected historical version opens as `Read-only version N` with a `Read-only` badge and saved timestamp; loading uses a dedicated snapshot skeleton.
- **What happens:** `fetchResumeVersion` loads the owned immutable snapshot without replacing current persisted content. Historical content is rendered with current Resume design, per the existing design contract.
- **Frontend:** `ResumeVersionTimeline.tsx`, snapshot path in `ResumeWorkspace.tsx`, `ResumePreview.tsx`.
- **Backend:** Resume version list/fetch boundaries in `resume.controller.ts` / `resume.service.ts` and ResumeVersion model.
- **Representative tests:** `ResumeVersionTimeline.test.tsx`, Resume workspace/version persistence tests.
- **Viva-ready explanation:** Version history provides read-only evidence of earlier saved content while keeping the editable current draft separate.

### 3.12 Draft recovery / unsaved-change protection

- **UI path:** Automatic within `/resumes/:resumeId` when unsaved session recovery exists or the user attempts to navigate away with dirty work.
- **Control:** Recovery dialog `Restore recovered draft` / destructive `Discard recovery`; stale recovery `Review recovered draft` / destructive `Discard recovery`; navigation protection `Keep editing` / destructive `Leave without saving`.
- **Visual / state behavior:** Workspace status can become `Recovery decision required`. Recovery cleanup/write failures are surfaced as warning/error notices; stale recovery is reviewed rather than silently applied.
- **What happens:** Bounded recovery data is held in session storage under the authenticated user/Resume/version identity. Same-baseline recovery may be restored; stale recovery requires explicit review; successful saves remove obsolete recovery. Browser `beforeunload` and React Router blocking protect dirty work.
- **Frontend:** `ResumeWorkspace.tsx`, `resumeRecovery.ts`, `resumeRecoveryWriter.ts`, `ResumeRecoveryReview.tsx`.
- **Backend:** The server remains canonical; recovery never replaces backend version identity without an explicit save.
- **Representative tests:** `ResumeRecoveryReview.test.tsx`, `resumeRecovery.test.ts`, `resumeRecoveryWriter.test.ts`, `ResumeWorkspace.snapshotEditing.test.tsx`, `ResumeWorkspace.test.tsx`.
- **Viva-ready explanation:** Recovery protects local unsaved editing while still respecting the server's immutable-version model; stale recovered work is never silently merged into a newer version.

## 4 — Interview Coach

### 4.1 Interview session collection

### 4.2 Create interview

### 4.3 Career area / role / experience configuration

### 4.4 AI question generation

### 4.5 Manual question creation

### 4.6 Question types

### 4.7 Question filtering and pinning

### 4.8 Private notes

### 4.9 Save practice attempt

### 4.10 Saved-attempt history

### 4.11 Question explanation

### 4.12 AI feedback

### 4.13 Session archive/restore/delete

## 5 — Learning Workspace

### 5.1 PDF upload

### 5.2 Document processing

### 5.3 Document library

### 5.4 Overview / summary

### 5.5 Secure original PDF viewer

### 5.6 Extracted page-aware content

### 5.7 Grounded Chat

#### 5.7.1 Create conversation

#### 5.7.2 Send question

#### 5.7.3 Source-page references

### 5.8 Flashcards

#### 5.8.1 Generate

#### 5.8.2 Study

#### 5.8.3 Reveal answer / navigation

### 5.9 Quizzes

#### 5.9.1 Generate

#### 5.9.2 Take quiz

#### 5.9.3 Review saved attempt

### 5.10 Learning resource deletion

## 6 — Settings & Gemini

### 6.1 Gemini connection status

### 6.2 Fixed Gemini model display

### 6.3 Application-managed Gemini

### 6.4 Personal Gemini key

### 6.5 Save and test key

### 6.6 Test connection

### 6.7 Replace key

### 6.8 Disconnect

### 6.9 Delete personal key

### 6.10 AI usage diagnostics

### 6.11 Account/session information

## 7 — Shared Platform Controls

### 7.1 Authentication/session security

### 7.2 Ownership/authorization

### 7.3 Private file storage

### 7.4 Background jobs

### 7.5 Progress polling

### 7.6 Cancel/retry handling

### 7.7 Validation before persistence

### 7.8 Error/request-ID handling

### 7.9 Responsive/accessibility behavior
