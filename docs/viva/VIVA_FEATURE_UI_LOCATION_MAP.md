# Career Learning Hub — Viva Feature & UI Location Map

## Purpose

This is the authoritative viva-preparation map for the current Career Learning Hub implementation. It links stable feature numbers to the visible UI, exact controls and states, principal frontend/backend implementation boundaries, representative automated evidence, and a short viva-ready explanation.

Career Learning Hub is an integrated authenticated web application comprising Resume Studio, Interview Coach and Learning Workspace, supported by shared authentication, persistence, private storage, background processing and controlled Gemini integration.

> **Claim boundary:** this guide describes the current implemented application. It does not claim formal WCAG certification, enterprise availability/SLA guarantees, token streaming, WebSockets/SSE, compiler/code execution, or a separate Learning study-set rename feature.

---

# Find it fast — one-page feature index

## 1 — Access & Navigation

- **1.1 Register** — `/register` → `Create account`
- **1.2 Login** — `/login` → `Sign in`
- **1.3 Authenticated application shell** — protected routes inside `AppShell`
- **1.4 Sidebar/mobile navigation** — Dashboard, Resumes, Interviews, Learning, Settings
- **1.5 Global Create menu** — Resume, Interview session, Learning document
- **1.6 Logout/session handling** — `Log out`; Settings also has `Sign out of this session`

## 2 — Dashboard

- **2.1 Progress overview** — `/dashboard` → Performance period and outcome/trend panels
- **2.2 Continue/Create Resume** — first Continue-your-work card
- **2.3 Continue/Start Interview** — second Continue-your-work card
- **2.4 Open/Upload Learning document** — third Continue-your-work card
- **2.5 Recent activity** — `/dashboard` → `Recent activity` / `View all activity`

## 3 — Resume Studio

- **3.1 Resume collection** — `/resumes` → `Your resumes`
- **3.2 Resume creation** — `Create Resume`
  - **3.2.1 Guided setup** — `Guided setup`
  - **3.2.2 Start blank** — `Start blank`
  - **3.2.3 Import PDF** — `Import PDF`
- **3.3 Resume editor** — `/resumes/:resumeId` → editable Resume content
- **3.4 Live preview** — beside/below editor depending on viewport
- **3.5 Save new immutable version** — `Save new version`
- **3.6 Design/template controls** — `Resume appearance` → `Customize`
- **3.7 Candidate photo** — `Candidate photo`
- **3.8 Print / Save as PDF** — `Print / Save as PDF` → `Open print dialog`
- **3.9 AI-assisted role assessment** — `Role-aware assessment` → `Run AI-assisted assessment`
- **3.10 AI recommendations** — completed assessment → `Apply selected suggestions`
- **3.11 Version history** — version timeline / read-only snapshot
- **3.12 Draft recovery / unsaved-change protection** — recovery and navigation dialogs

## 4 — Interview Coach

- **4.1 Interview session collection** — `/interviews` → `Your sessions`
- **4.2 Create interview** — `Create interview`
- **4.3 Career area / role / experience configuration** — creation dialog
- **4.4 AI question generation** — session → `Generate questions`
- **4.5 Manual question creation** — session → `Add manually`
- **4.6 Question types** — MCQ, Short Answer, Coding, Behavioral, Scenario-Based, Technical Explanation
- **4.7 Question filtering and pinning** — Question Index filters and `Pin question`
- **4.8 Private notes** — selected question → `Private notes`
- **4.9 Save practice attempt** — `Save attempt`
- **4.10 Saved-attempt history** — `Saved attempts`
- **4.11 Question explanation** — `Request explanation`
- **4.12 AI feedback** — saved non-MCQ attempt → `Request feedback`
- **4.13 Session archive/restore/delete** — lifecycle actions and card More menu

## 5 — Learning Workspace

- **5.1 PDF upload** — `/learning` → `Upload PDF`
- **5.2 Document processing** — upload-processing job status and resilience controls
- **5.3 Document library** — `/learning` → Document status filter / `Open workspace`
- **5.4 Overview / summary** — document → `Overview`
- **5.5 Secure original PDF viewer** — document → `Original PDF`
- **5.6 Extracted page-aware content** — document → `Extracted Content`
- **5.7 Grounded Chat** — document → `Grounded Chat`
  - **5.7.1 Create conversation** — `Create conversation`
  - **5.7.2 Send question** — conversation → `Send question`
  - **5.7.3 Source-page references** — assistant answer → `Page N`
- **5.8 Flashcards** — document → `Flashcards`
  - **5.8.1 Generate** — `Create flashcards` → `Generate flashcards`
  - **5.8.2 Study** — ready set → `Study set`
  - **5.8.3 Reveal answer / navigation** — `Reveal answer`, Previous, Next
- **5.9 Quizzes** — document → `Quizzes`
  - **5.9.1 Generate** — `Create quiz` → `Generate quiz`
  - **5.9.2 Take quiz** — ready quiz → `Take quiz`
  - **5.9.3 Review saved attempt** — `Review attempt`
- **5.10 Learning resource deletion** — document/conversation/flashcard-set/quiz deletion controls

## 6 — Settings & Gemini

- **6.1 Gemini connection status** — `/settings` → `Gemini connection`
- **6.2 Fixed Gemini model display** — Model → `gemini-3.6-flash`
- **6.3 Application-managed Gemini** — `Use application-managed Gemini` when available
- **6.4 Personal Gemini key** — `Connect a personal key`
- **6.5 Save and test key** — `Save and test`
- **6.6 Test connection** — `Test connection`
- **6.7 Replace key** — `Replace key`
- **6.8 Disconnect** — `Disconnect` for application-managed mode
- **6.9 Delete personal key** — destructive `Delete key` + confirmation
- **6.10 AI usage diagnostics** — `AI usage & diagnostics`
- **6.11 Account/session information** — `Account information`, `Current session`

## 7 — Shared Platform Controls

- **7.1 Authentication/session security** — protected routes and authenticated API middleware
- **7.2 Ownership/authorization** — user-scoped reads/writes across domains
- **7.3 Private file storage** — owner-scoped Asset abstraction and short-lived access
- **7.4 Background jobs** — durable worker/lease execution
- **7.5 Progress polling** — bounded status polling from feature workspaces
- **7.6 Cancel/retry handling** — shared `Cancel` / `Retry`
- **7.7 Validation before persistence** — Zod request/job/result validation
- **7.8 Error/request-ID handling** — safe errors plus Request ID correlation
- **7.9 Responsive/accessibility behavior** — keyboard/focus/ARIA/responsive presentation

---

# Button, color and state reference

## Global action language

| Role | Current visual language | Typical examples |
|---|---|---|
| Primary constructive action | Solid Career Learning Hub green (`--accent: #287a4a`) with white text; darker green hover (`--accent-dark: #1e6039`) | Create, Save, Generate, Submit |
| Secondary | Neutral/light bordered control | Cancel, Retry, Refresh, Test connection |
| Quiet / tertiary | Lowest-emphasis transparent/light action | Discard/supporting navigation actions |
| Destructive | Red (`#a33b3b`) with darker red hover (`#842424`) | Permanent deletion / credential deletion |
| Disabled | Non-interactive muted presentation | Prerequisite not satisfied or request busy |
| Busy | Action remains identifiable but label/status changes | `Saving…`, `Creating…`, `Uploading…`, `Generating…`, `Testing…` |
| Selected / active | Pale-green/selected treatment or `aria-pressed` / `aria-selected` state | Main navigation, tabs, filters, selected question |
| Status | Success, warning, error and information surfaces | Saved, queued, processing, failed, stale, ready |

### Important specific exception — Feature 3.9

`Run AI-assisted assessment` is deliberately **less visually dominant** than Feature 3.5 `Save new version`. Its scoped Resume assessment styling uses:

- normal border `#b9cec1`
- normal text `#245e3c`
- normal background `#eef6f1`
- hover border `#aac2b3`
- hover background `#e5f0e9`
- disabled border `#c8d5cd`
- disabled text `#66756c`
- disabled background `#f1f5f2`
- disabled opacity `1`

This keeps the canonical user-controlled save action as the strongest constructive action in Resume Studio.

---

# Where is it in the code? — quick index

| Area | Principal frontend | Principal backend / shared boundary |
|---|---|---|
| Routing / shell | `frontend/src/routing/router.tsx`, `frontend/src/AppShell.tsx` | `backend/src/middleware/authenticate.ts` |
| Authentication | `frontend/src/features/auth/LoginPage.tsx`, `RegisterPage.tsx`, `AuthProvider.tsx` | `backend/src/modules/auth/`, `backend/src/middleware/authenticate.ts` |
| Dashboard | `frontend/src/features/dashboard/MainDashboard.tsx`, `ProgressWidgets.tsx`, `dashboardApi.ts` | dashboard/progress APIs and existing domain services |
| Resume collection/create | `ResumeListPage.tsx`, `ResumeCreateDialog.tsx` | `backend/src/modules/resumes/`, `backend/src/modules/resume-analysis/` |
| Resume workspace | `ResumeWorkspace.tsx`, `ResumeEditor.tsx`, `ResumePreview.tsx` | Resume controller/service/models |
| Resume AI | `AiRecommendations.tsx`, `ResumeWorkspace.tsx`, `resumePolling.ts` | `resumeAnalysis.jobs.ts`, `resumeAnalysis.service.ts` |
| Interview collection/create | `InterviewSessionListPage.tsx`, `InterviewCreateDialog.tsx` | `backend/src/modules/interviews/` |
| Interview practice | `InterviewSessionWorkspace.tsx`, `InterviewAnswerControl.tsx` | `interview.jobs.ts`, `interviewAi.service.ts`, Interview service/models |
| Learning library | `LearningDashboard.tsx` | Learning routes/services + `learning.jobs.ts` |
| Learning document | `LearningDocumentWorkspace.tsx` | Learning document/chunk services + private Asset service |
| Grounded Chat | `DocumentConversations.tsx`, `LearningConversationWorkspace.tsx` | `learning.jobs.ts`, `learningChat.service.ts` |
| Flashcards | `DocumentFlashcards.tsx`, `FlashcardStudy.tsx` | `learning.jobs.ts`, `learningAssessment.service.ts` |
| Quizzes | `DocumentQuizzes.tsx`, `LearningQuizWorkspace.tsx`, `LearningQuizAttemptWorkspace.tsx` | `learning.jobs.ts`, quiz models/services |
| Learning deletion | `LearningDocumentDeletion.tsx`, `LearningChildDeletion.tsx` | `learningChildDeletion.service.ts`, document cascade deletion |
| Settings / Gemini | `SettingsPage.tsx`, `GeminiConnectionSettings.tsx`, `geminiSettingsApi.ts` | `aiProvider.service.ts`, `credentialVault.ts`, `geminiPolicy.ts` |
| AI usage | `AiUsageDiagnosticsSettings.tsx` | dashboard/progress aggregation + AI usage records |
| Private assets | feature gateways/viewers | `backend/src/modules/assets/asset.service.ts`, storage abstraction |
| Durable jobs | `JobResilienceActions.tsx`, feature polling modules | `backend/src/jobs/job.worker.ts`, queue/registry/execution modules |
| Validation | feature forms + API parsers | `backend/src/middleware/validate.ts`, feature Zod schemas |
| Request diagnostics | `ApiError` / Request ID displays | `backend/src/middleware/requestContext.ts`, error middleware/logger |

---

# Detailed feature map

## 1 — Access & Navigation

### 1.1 Register

- **UI path / route:** Public → `/register`.
- **Controls:** `Display name`, `Email address`, `Password`, `Show password` / `Hide password`, primary `Create account`, and `Sign in` link.
- **State:** Client validation precedes submission; the busy label is `Creating account…`; validation and safe API errors remain on the page.
- **Code:** `RegisterPage.tsx`, `AuthenticationShell.tsx`, `AuthProvider.tsx`; backend `modules/auth/*`.
- **Evidence:** authentication frontend tests and backend auth/security coverage.
- **Viva:** Registration is public-only; the backend remains authoritative for account/session creation.

### 1.2 Login

- **UI path / route:** Public → `/login`.
- **Controls:** `Email address`, `Password`, visibility toggle, primary `Sign in`, `Create an account` link.
- **State:** Busy label `Signing in…`; expired sessions can surface `Your session expired. Sign in again to continue.`.
- **What happens:** A successful authenticated state returns the user to a safe intended protected route.
- **Code:** `LoginPage.tsx`, `AuthProvider.tsx`, `AuthRoute.tsx`; backend auth/session services.
- **Viva:** Authentication is separated from protected application rendering and unsafe external return destinations are not used.

### 1.3 Authenticated application shell

- **UI path:** Any protected route.
- **Visible UI:** Career Learning Hub brand, Create control, navigation, account block, logout and `<main id="main-content">`.
- **Code:** `frontend/src/AppShell.tsx`, `frontend/src/routing/router.tsx`.
- **Viva:** One shared shell prevents Resume, Interview and Learning from duplicating navigation/session behavior.

### 1.4 Sidebar/mobile navigation

- **Controls:** `Dashboard`, `Resumes`, `Interviews`, `Learning`, `Settings`; mobile `Menu` / `Close`.
- **State:** Current destination has the active selected treatment; mobile uses an accessible drawer/dialog flow.
- **Viva:** Desktop and mobile are two responsive presentations of the same route model.

### 1.5 Global Create menu

- **Controls:** `Create` → `Resume`, `Interview session`, `Learning document`.
- **Destinations:** `/resumes?action=create`, `/interviews?action=create`, `/learning?action=upload`.
- **Viva:** It is a shortcut dispatcher only; each feature still owns validation and persistence.

### 1.6 Logout/session handling

- **Controls:** Shell `Log out`; Settings `Sign out of this session`.
- **State:** Shell logout becomes `Logging out…` and is single-flight.
- **Backend:** session/auth enforcement through auth services and `authenticate.ts`.
- **Viva:** Ending the session and protected-route enforcement are separate but coordinated controls.

## 2 — Dashboard

### 2.1 Progress overview

- **UI path:** `/dashboard` → `Performance period`.
- **Controls:** `7 days`, `30 days`, `90 days`, `365 days`; retry controls on failure.
- **State:** period buttons expose selection; loading uses skeleton/status surfaces; results retain raw numeric outcomes plus bounded interpretation.
- **Code:** `MainDashboard.tsx`, `ProgressWidgets.tsx`, `dashboardScorePresentation.ts`, `dashboardApi.ts`.
- **Viva:** Dashboard reads existing domain progress instead of becoming a second source of truth.

### 2.2 Continue/Create Resume

- **Location:** First `Continue your work` card.
- **Control:** `Continue Resume` when an existing target is available; otherwise `Create Resume`.
- **Destination:** `/resumes/:resumeId` or `/resumes?action=create`.

### 2.3 Continue/Start Interview

- **Location:** Second continuation card.
- **Control:** `Continue Interview` or `Start Interview Session`.
- **Destination:** existing session/list context or `/interviews?action=create`.

### 2.4 Open/Upload Learning document

- **Location:** Third continuation card.
- **Control:** `Open Learning Document` or `Upload Learning Document`.
- **Destination:** `/learning/documents/:documentId` or `/learning?action=upload`.

### 2.5 Recent activity

- **Location:** Dashboard `Recent activity` panel; no separate Activity route.
- **Controls:** `View all activity`; expanded mode adds Previous/Next and `Show recent activity only`.
- **State:** collapsed and expanded modes use bounded page sizes and stale-request protection.
- **Code:** `MainDashboard.tsx`, `ActivityFeed.tsx`, `dashboardApi.ts`.
- **Viva:** Activity is a bounded dashboard audit-style feed, not another application area.

## 3 — Resume Studio

### 3.1 Resume collection

- **Route:** `/resumes` → `Your resumes`.
- **Controls:** `Create Resume`, card `Open Resume`, More/delete control, Previous/Next, `Retry list`.
- **State:** cards show status/version/design metadata; empty state offers `Create your first resume`.
- **Code:** `ResumeListPage.tsx`, `ResumeDeleteDialog.tsx`, `resumeApi.ts`; backend Resume controller/service.

### 3.2 Resume creation

- **Entry:** `Create Resume` or global Create → Resume.
- **Choices:** `Guided setup`, `Start blank`, `Import PDF`.
- **Code:** `ResumeCreateDialog.tsx` and related guided/import components.

#### 3.2.1 Guided setup

- **Behavior:** structured editable guidance assists entry; it does not silently lock/invent candidate facts.
- **Code:** `ResumeGuidedSetup.tsx` and deterministic guidance helpers.

#### 3.2.2 Start blank

- **Controls:** `Resume title`, `Back`, `Create blank resume`; busy `Creating…`.
- **Behavior:** creates the minimum canonical Resume then opens `/resumes/:resumeId`.

#### 3.2.3 Import PDF

- **Controls:** `Imported resume title`, PDF picker, `Import private PDF`, job controls, final `Confirm and open in editor`.
- **Constraints:** one private PDF, current client/backend size limit 15 MB.
- **State:** background import progress; `Check status` if polling pauses; Import Review appears before adoption.
- **Viva:** extraction/AI output is staged for review before it becomes editable Resume content.

### 3.3 Resume editor

- **Route:** `/resumes/:resumeId`.
- **Behavior:** edits local canonical draft state; validation links focus the relevant field; persistence occurs only through explicit version save.
- **Code:** `ResumeWorkspace.tsx`, `ResumeEditor.tsx`, `resumeDraft.ts`.

### 3.4 Live preview

- **Location:** same workspace, alongside/below the editor according to width.
- **Behavior:** renders current draft immediately without persisting it.
- **Code:** `ResumePreview.tsx`, template/rendering registry and Resume CSS.

### 3.5 Save new immutable version

- **Control:** primary `Save new version`; keyboard shortcut `⌘S` / `Ctrl+S`; dirty draft may expose `Discard changes`.
- **Enabled when:** a valid dirty current draft exists and recovery/save/apply/print/conflict blockers are clear.
- **States:** `Version N saved`, `Unsaved changes`, `Saving…`, `Save failed`, `Recovery decision required`.
- **Behavior:** creates a new immutable server version rather than overwriting an earlier version.
- **Viva:** immutable saves make AI results and history traceable to a stable Resume version.

### 3.6 Design/template controls

- **Panel:** `Resume appearance` → `Customize` / `Close customization`.
- **Controls:** Template, Typography, Color, `Reset changes`, `Save appearance`.
- **State:** preview changes immediately; persistence occurs only on Save appearance.
- **Viva:** content versioning and Resume presentation are deliberately separate concerns.

### 3.7 Candidate photo

- **Panel:** `Candidate photo`.
- **Controls:** `Choose photo` / `Replace photo`, Show/Hide on Resume, destructive `Remove photo`, retry source when needed.
- **Behavior:** private Asset-backed optional presentation data, separate from versioned Resume content and assessment payload.

### 3.8 Print / Save as PDF

- **Panel:** `Print / Save as PDF`.
- **Controls:** Paper size A4/Letter, `Open print dialog`; busy `Preparing print…`.
- **Behavior:** uses browser-native print/PDF from a saved eligible Resume representation; unsaved current draft blocks export.

### 3.9 AI-assisted role assessment

- **Panel:** `Role-aware assessment`.
- **Controls:** `Target role`, optional Company / Job description, `Run AI-assisted assessment`, `Check status`, shared Cancel/Retry.
- **Enabled when:** current draft is saved, recovery is resolved, Target role is valid and no assessment is already busy.
- **State:** bounded queued/processing progress; result is accepted only when job/Resume/version identities match.
- **Code:** `ResumeWorkspace.tsx`, `ResumeAssessmentActionUi.css`, `resumePolling.ts`; backend `resumeAnalysis.jobs.ts`, `resumeAnalysis.service.ts`.
- **Viva:** assessment is bound to a saved immutable Resume version, not an ambiguous unsaved draft.

### 3.10 AI recommendations

- **Controls:** suggestion selection, `Apply selected suggestions`, confirmation `Create new version`.
- **State:** Awaiting, running, completed or stale; stale suggestions cannot be applied.
- **Behavior:** selected recommendations are user-controlled and create another immutable version rather than silently rewriting the Resume.

### 3.11 Version history

- **Controls:** version timeline, Previous/Next, `Return to current draft` from a snapshot.
- **State:** historical version is explicitly `Read-only version N`.
- **Viva:** previous saved content remains inspectable without becoming editable current state.

### 3.12 Draft recovery / unsaved-change protection

- **Controls:** `Restore recovered draft`, `Review recovered draft`, destructive `Discard recovery`, `Keep editing`, destructive `Leave without saving`.
- **Behavior:** bounded session recovery protects unsaved work while the server remains canonical; stale recovery is reviewed rather than silently merged.

## 4 — Interview Coach

### 4.1 Interview session collection

- **Route:** `/interviews` → `Your sessions`.
- **Controls:** `Create interview`; All/Active/Completed/Archived filters; `Open session`; More actions; Previous/Next.
- **Code:** `InterviewSessionListPage.tsx`, `InterviewSessionCard.tsx`, `interviewApi.ts`.

### 4.2 Create interview

- **Controls:** required Session title, Career area, Target role, Experience level, Practice mode; optional focus topics/skill gaps/job description; `Create interview`.
- **State:** focusable validation summary; busy `Creating…`.
- **Behavior:** creates one owner-scoped practice session and opens it.

### 4.3 Career area / role / experience configuration

- **Controls:** Career area including `Other / Custom`, Target role, Experience level, Written practice/Study mode.
- **Behavior:** local deterministic guidance helps author the saved real role/context.

### 4.4 AI question generation

- **Controls:** Question count, categories, question types/counts, `Generate questions`; shared job resilience and `Resume status checks`.
- **State:** `Generating…`, progress and queued/processing/paused/terminal states.
- **Backend:** `interview.jobs.ts`, `interviewAi.service.ts`.
- **Viva:** generation is a durable request with request identity and polling rather than a direct fragile UI mutation.

### 4.5 Manual question creation

- **Controls:** `Add manually`, Question type, Category, Difficulty, Question, type-specific fields, `Add question`.
- **Viva:** manual authoring preserves meaningful Interview functionality without AI availability.

### 4.6 Question types

- **Modern types:** Multiple Choice, Short Answer, Coding, Behavioral, Scenario-Based, Technical Explanation.
- **Important safety boundary:** Coding answers are submitted/reviewed as text and **are not executed**.
- **MCQ:** correctness is evaluated deterministically on the backend.

### 4.7 Question filtering and pinning

- **Controls:** `Pinned only`, Difficulty, Category, Previous/Next, `Pin question` / `Unpin`.
- **State:** selected question and pinned status are explicit.

### 4.8 Private notes

- **Controls:** `Add note` / `Show note`, `Save notes`, `Clear notes`, `Hide`.
- **States:** Unsaved, Saving, Saved/Cleared; lifecycle state controls editability.

### 4.9 Save practice attempt

- **Control:** type-aware answer control → `Save attempt`; busy `Saving…`.
- **Behavior:** each submission is a separate saved attempt; it does not overwrite prior practice.

### 4.10 Saved-attempt history

- **Panel:** `Saved attempts`.
- **Controls:** Attempt status filter, `Review attempt`, Previous/Next.
- **State labels:** Saved, Feedback queued/processing/ready/unavailable.

### 4.11 Question explanation

- **Control:** `Request explanation` when absent.
- **MCQ rule:** explanation remains locked until an attempt so answer-key guidance is not revealed before submission.
- **Backend:** `interview.question.explain` durable job.

### 4.12 AI feedback

- **Control:** `Request feedback` for eligible saved non-MCQ attempts.
- **Result:** `Model-generated practice guidance` with score, summary, strengths, improvements and outline plus explicit non-hiring-prediction disclaimer.
- **Viva:** feedback supplements stored human practice; it is not a hiring decision.

### 4.13 Session archive/restore/delete

- **Workspace controls:** `Mark completed`, `Archive`.
- **Archived card:** `Restore session` / `Restoring…`.
- **Deletion:** confirmed destructive `Delete permanently`.
- **Viva:** Archive is reversible lifecycle state; permanent deletion is a separate destructive operation.

## 5 — Learning Workspace

### 5.1 PDF upload

- **UI path / route:** `/learning` → `Upload PDF`.
- **Panel:** `Upload a private PDF`.
- **Controls:** `Document title`, `PDF file`, primary `Upload document`, `Cancel`.
- **Constraints:** PDF only, up to **15 MB**. Current UI states: `Text-based PDFs work best; scanned or image-only files are not supported.`
- **States:** validation summary `Review the highlighted fields.`; busy `Uploading…`; safe error with optional Request ID.
- **What happens:** the PDF enters private Asset storage, an owned Learning document is created and Feature 5.2 processing begins.
- **Frontend:** `LearningDashboard.tsx`, `learningApi.ts`.
- **Backend:** Learning document upload path, `asset.service.ts`, `learning.jobs.ts`.
- **Viva:** upload and processing are separate so large document extraction/summary work does not block the request/response lifecycle.

### 5.2 Document processing

- **Observed UI:** after upload, `Upload accepted. Checking processing status.`; document states Uploaded → Processing → Ready or Processing failed.
- **Controls:** shared Cancel/Retry where safe; paused local polling exposes `Resume status checks`; document card/workspace can also `Refresh document status`.
- **Backend:** `learning.document.process` in `learning.jobs.ts` → `documentProcessing.service.ts`; job work fence validates the document state.
- **Limitation shown by current UI:** failed scanned files may report that OCR is not supported.
- **Viva:** extraction/summary is durable background work with explicit progress and terminal state instead of pretending the upload itself completed processing.

### 5.3 Document library

- **UI path:** `/learning`.
- **Controls:** `Document status` with All statuses / Uploaded / Processing / Ready / Processing failed / Deleting; `Refresh documents`; card `Open workspace`; Previous/Next.
- **State:** cards show PDF status, title, original filename, page/section counts when available and updated time. Loading/failure/empty views are explicit.
- **Frontend:** `LearningDashboard.tsx`.
- **Backend:** owner-scoped document listing and document service/model.
- **Viva:** the library is the catalogue; content-specific study tools only activate on an owned ready document.

### 5.4 Overview / summary

- **UI path:** open a ready document → `Overview` tab.
- **Visible content:** Pages, Extracted sections, Processed time, stored `Summary`, stored `Key points`.
- **What happens:** reads persisted validated processing output; opening Overview does not regenerate it.
- **Frontend:** `LearningDocumentWorkspace.tsx`.
- **Viva:** the document workspace separates canonical stored processing output from later optional AI study interactions.

### 5.5 Secure original PDF viewer

- **UI path:** document → `Original PDF`.
- **Visible UI:** `Secure PDF viewer`, `Short-lived access`; expired/error state exposes `Refresh secure PDF access`.
- **Behavior:** obtains owner-authorized short-lived source access, fetches/validates the PDF response, builds a browser object URL, uses `no-referrer`, and revokes local viewer access when leaving/expiring.
- **Boundary:** source bytes remain behind the private Asset abstraction; the UI does not expose a permanent public storage URL.
- **Frontend:** `LearningDocumentWorkspace.tsx` (`SecurePdfViewer`).
- **Backend:** `asset.service.ts`, signed/private storage routes.
- **Viva:** short-lived authorization limits exposure while still letting the browser render the user's original document.

### 5.6 Extracted page-aware content

- **UI path:** document → `Extracted Content`.
- **Visible UI:** section number, Page/Pages range, word count and extracted text.
- **Controls:** Previous/Next; failure `Try extracted content again`.
- **Behavior:** reads validated saved chunks page-by-page; no regeneration is triggered by paging.
- **Frontend:** `LearningDocumentWorkspace.tsx` (`ExtractedContentReader`).
- **Backend:** Learning chunk list/service/model.
- **Viva:** page-aware chunks are the evidence layer used by grounded features and provide a reviewable bridge back to the PDF.

### 5.7 Grounded Chat

- **UI path:** document → `Grounded Chat`.
- **Boundary:** chat is available only when the document is Ready; processing/failed documents explain why chat is unavailable.

#### 5.7.1 Create conversation

- **Controls:** `Create conversation`; conversation `Title`; terminal `Create conversation`; `Refresh conversations`.
- **List action:** `Open conversation`; conversation deletion is available through the More/delete flow.
- **Frontend:** `DocumentConversations.tsx`.
- **Backend:** conversation create/list service/model, owner-scoped to the document.
- **Viva:** a conversation is a stored child resource of one document, so messages cannot float outside their evidence context.

#### 5.7.2 Send question

- **Route:** `/learning/documents/:documentId/conversations/:conversationId`.
- **Screen:** `Ask the document`.
- **Control:** `Question` textarea → `Send question`; busy `Sending…`.
- **Uncertain network outcome:** button becomes `Retry same question`; secondary `Start a different question` deliberately abandons the preserved request identity.
- **Job states:** queued/processing progress; shared Cancel/Retry; paused status → `Resume response checks`.
- **Backend:** `learning.chat.respond` in `learning.jobs.ts` → `learningChat.service.ts`.
- **Viva:** request identity and canonical message refresh prevent an uncertain client response from becoming an accidental duplicate chat question.

#### 5.7.3 Source-page references

- **Observed UI:** assistant messages expose source buttons `Page N`.
- **What happens:** selecting a page displays a note explaining that it is a validated reference and directs the user to the document's Extracted Content for authoritative page-aware text.
- **Validation:** completed job source pages are reconciled against the canonical stored assistant message before the UI accepts completion.
- **Viva:** Grounded Chat is not presented as unsupported free-form knowledge; the stored answer carries validated references back to the uploaded document.

### 5.8 Flashcards

#### 5.8.1 Generate

- **UI path:** document → `Flashcards`.
- **Controls:** `Create flashcards` / `Close creator`, `Refresh sets`; form `Set title`, `Card count`, `Focus (optional)`, primary `Generate flashcards`.
- **State:** busy `Starting generation…`; queued/processing/paused/completed/failed/cancelled surfaces; `Resume generation checks`; shared Cancel/Retry.
- **Backend:** `learning.flashcards.generate` → `learningAssessment.service.ts`.
- **Viva:** the set exists as an owned resource and generation completion is reconciled against the canonical set/card count before study opens.

#### 5.8.2 Study

- **Control:** ready collection card → `Study set`.
- **Route:** `/learning/documents/:documentId/flashcards/:setId`.
- **Screen:** `Study flashcards` with `Card X of Y` and progress.
- **Frontend:** `FlashcardStudy.tsx` and flashcard-set workspace.

#### 5.8.3 Reveal answer / navigation

- **Controls:** primary `Reveal answer` / `Hide answer`; `Previous`, `Next`; source actions `View Page N`.
- **State:** moving cards hides the answer and clears the selected source page; boundary text reports Beginning/End/Continue studying.
- **Viva:** answer reveal is deliberately user-controlled and source references remain available after reveal.

### 5.9 Quizzes

#### 5.9.1 Generate

- **UI path:** document → `Quizzes`.
- **Controls:** `Create quiz` / `Close creator`, `Refresh quizzes`; form `Quiz title`, `Question count`, `Focus (optional)`, `Generate quiz`.
- **State:** same durable generation vocabulary as flashcards; ready collection action `Take quiz`.
- **Backend:** `learning.quiz.generate` → `learningAssessment.service.ts`.
- **Viva:** generated quiz content is persisted and validated before the taking route opens.

#### 5.9.2 Take quiz

- **Route:** `/learning/documents/:documentId/quizzes/:quizId`.
- **Screen:** `Quiz taking`.
- **Controls:** one choice per question; final `Submit quiz`; busy `Submitting quiz…`.
- **Enabled when:** every question has one selected choice and no submission/reconciliation lock is active.
- **Behavior:** server records/scores the attempt and redirects to its saved review. If outcome is genuinely uncertain, the UI requires `Reconcile submission` before another submit.
- **Frontend:** `LearningQuizWorkspace.tsx`, `QuizTaker.tsx`.
- **Viva:** submission uncertainty is reconciled against saved attempt history to avoid casual duplicate attempts.

#### 5.9.3 Review saved attempt

- **Entry:** quiz Attempt history → `Review attempt`.
- **Route:** `/learning/documents/:documentId/quizzes/:quizId/attempts/:attemptId`.
- **Visible UI:** `Official results`, `Quiz result`, score percentage, correct count, semantic performance label, `Review your answers`.
- **Per question:** Selected answer, Correct answer, optional explanation and verified `View Page N` sources.
- **Control:** `Take quiz again` returns to the quiz workspace.
- **Frontend:** `LearningQuizAttemptWorkspace.tsx`.
- **Viva:** review is read-only canonical evidence of one saved server-scored attempt.

### 5.10 Learning resource deletion

- **Document deletion:** `Delete document` opens confirmation; user types the exact document title; terminal destructive action `Delete document`; active deletion uses a durable delete job/cascade.
- **Child deletion:** conversation / flashcard set / quiz More control → `Delete`; confirmation terminal action `Delete permanently`.
- **Safety:** child deletion is owner-scoped and transactional; an active targeted chat/flashcard/quiz generation job blocks deletion. Quiz deletion cascades questions/attempts; flashcard-set deletion cascades cards; conversation deletion cascades messages.
- **Frontend:** `LearningDocumentDeletion.tsx`, `LearningChildDeletion.tsx`.
- **Backend:** `learningChildDeletion.service.ts`, document cascade deletion, private Asset cleanup.
- **Viva:** destructive operations are explicit and resource-aware rather than a generic client-side removal.

## 6 — Settings & Gemini

### 6.1 Gemini connection status

- **UI path / route:** Settings → `/settings` → `Gemini connection`.
- **Badge/state:** `Connected` or `Disconnected`; summary states `Managed by Career Learning Hub`, `Personal key`, or that AI features require a connection.
- **Frontend:** `GeminiConnectionSettings.tsx`, `geminiSettingsApi.ts`.
- **Backend:** AI provider settings routes/services.

### 6.2 Fixed Gemini model display

- **Visible UI:** `Model` → **`gemini-3.6-flash`**, described as fixed for secure, predictable AI workflows.
- **Canonical policy:** `backend/src/modules/ai/geminiPolicy.ts` exports `GEMINI_RELEASE_MODEL = "gemini-3.6-flash"`.
- **Viva:** the UI does not expose arbitrary provider/model switching in the current release.

### 6.3 Application-managed Gemini

- **Control:** when disconnected and administrator-managed availability is reported, primary `Use application-managed Gemini`.
- **Behavior:** activates the administrator-managed Gemini credential source through the authenticated settings API; secret material is never sent to the browser.
- **Backend:** `aiProvider.service.ts` provider preference/activation logic.

### 6.4 Personal Gemini key

- **Control:** `Connect a personal key` (or `Connect personal key` from another connected mode).
- **Form:** `Personal Gemini API key`; password field; help states the key is tested before encrypted storage and cleared from the form after the request.
- **Viva:** plaintext exists transiently for the submitted request; stored credential material is encrypted server-side.

### 6.5 Save and test key

- **Control:** primary `Save and test`; busy `Testing…`.
- **Enabled when:** candidate key meets the bounded input length and no settings mutation is already busy.
- **Behavior:** backend tests Gemini before encrypted credential storage/activation; success reports connected/replaced-and-tested state.

### 6.6 Test connection

- **Control:** `Test connection` when Gemini is connected.
- **Behavior:** validates the currently authorized credential source against the fixed Gemini model without returning credential plaintext.

### 6.7 Replace key

- **Control:** personal mode → `Replace key` → same secure password entry → `Save and test`.
- **Concurrency:** credential revision is supplied so stale replacement can be rejected.
- **Backend:** `aiProvider.service.ts`, `credentialVault.ts`.

### 6.8 Disconnect

- **Control:** application-managed mode → `Disconnect`.
- **Behavior:** switches the user's provider preference to disconnected; it does not expose/delete an administrator secret.

### 6.9 Delete personal key

- **Control:** personal mode → destructive `Delete key`.
- **Dialog:** `Delete personal Gemini key?`; safest initial action `Keep key`; terminal destructive `Delete key`.
- **Behavior:** new AI jobs remain disconnected; already authorized work follows the existing execution lease. Stored encrypted credential is removed after applicable lease-drain rules.
- **Backend:** `aiProvider.service.ts`, `credentialVault.ts`, credential/lease models.
- **Viva:** disconnecting a preference and deleting user-owned encrypted credential material are intentionally different operations.

### 6.10 AI usage diagnostics

- **Panel:** `AI usage & diagnostics`.
- **Window:** last 30 days.
- **Visible metrics:** Requests, Successful, Failed, Input tokens, Output tokens, Total tokens, Average response time, Estimated usage cost.
- **Disclosure:** cost values are estimates, not invoices; coverage wording explains whether all recorded requests had estimates.
- **Control:** `Show technical details` expands feature-level request/token/cost totals; failure exposes `Retry AI usage` and optional Request ID.
- **Privacy boundary:** aggregated diagnostics do not display prompts, generated content, private document text, or credential values.
- **Frontend:** `AiUsageDiagnosticsSettings.tsx`.

### 6.11 Account/session information

- **Panel:** `Account information` shows Display name, Email, optional Headline and Account status.
- **Panel:** `Current session` → secondary `Sign out of this session`.
- **Frontend:** `SettingsPage.tsx`, `AuthProvider.tsx`.
- **Viva:** Settings combines AI/account/session controls but does not become a general user-profile editing system.

## 7 — Shared Platform Controls

### 7.1 Authentication/session security

- **Observed UI:** unauthenticated users see Login/Register; protected routes render only after auth state is established; expired sessions return to Login with an appropriate message.
- **Relied on by:** Dashboard, Resume, Interview, Learning and Settings.
- **Frontend:** `AuthProvider.tsx`, route guards, `AppShell.tsx`.
- **Backend:** `middleware/authenticate.ts`, auth/session/token services.
- **Evidence:** auth frontend tests plus backend authentication/security suites.
- **Viva:** UI hiding is not the security boundary; protected APIs independently require valid authenticated session context.

### 7.2 Ownership/authorization

- **Observed behavior:** collections and detail routes return only records belonging to the authenticated user; private child resources also bind to parent/document/session identity.
- **Examples:** Resume/version/photo/analysis; Interview session/question/attempt; Learning document/conversation/message/set/quiz/attempt; Asset records.
- **Backend:** feature services consistently query with `userId`/owned parent identities.
- **Evidence:** integration/security tests covering cross-user resource access and deletion.
- **Viva:** authentication identifies the user; ownership checks decide whether that user may access the specific record.

### 7.3 Private file storage

- **Observed UI:** private Resume PDF import/candidate photo and Learning PDF viewer; Learning original access is explicitly short-lived.
- **Backend:** `asset.service.ts`, asset policy/signing and storage abstraction.
- **Controls:** MIME/size/purpose policy, quota, owner-scoped reads, signed/short-lived download targets, cleanup/deletion.
- **Viva:** application records reference private assets; raw storage is not treated as a public file directory.

### 7.4 Background jobs

- **Relied on by:** Resume PDF import/assessment, Interview generation/explanation/feedback, Learning document processing/chat/flashcards/quizzes/delete.
- **Backend:** `job.worker.ts`, job queue/registry/execution/model modules and feature job registries.
- **Controls:** durable claim/lease identity, heartbeat, bounded concurrency, attempt timeout, phase/progress, active-execution assertion, persistence phase and completion/failure/retry handling.
- **Viva:** long AI/document work is moved out of HTTP request duration while preserving explicit job identity and safe persistence boundaries.

### 7.5 Progress polling

- **Observed UI:** percentage/progress surfaces and explicit status text across Resume, Interview and Learning.
- **Frontend:** feature-specific polling modules plus canonical API fetches.
- **Safety:** AbortController/request identity prevents stale route/resource polling from replacing a newer view; local timeout/transport pause does not automatically imply backend job failure.
- **Viva:** polling delivers progress only; the release does not claim token streaming, SSE or WebSockets.

### 7.6 Cancel/retry handling

- **Shared UI:** `JobResilienceActions.tsx` → `Cancel`, `Retry`, progress meter and phase label.
- **Rules:** Cancel appears for queued/processing work when allowed and not in the persistence phase; Retry appears only when canonical job metadata says retry is allowed.
- **Relied on by:** Resume, Interview and Learning durable jobs.
- **Viva:** retry/cancel capability is server-driven rather than inferred from a generic error button.

### 7.7 Validation before persistence

- **Observed UI:** forms surface client-side field guidance; server responses may return safe validation errors.
- **Backend:** `middleware/validate.ts` parses body/params/query with Zod before handlers; registered jobs parse stored payloads; feature services validate provider/generated result structures before canonical persistence.
- **Viva:** client validation improves usability, while server/job/result validation remains authoritative for data integrity.

### 7.8 Error/request-ID handling

- **Observed UI:** safe failure surfaces across authentication, Resume, Interview, Learning, Dashboard and Settings can show `Request ID: …` when the backend supplies a trusted identifier.
- **Backend:** `requestContext.ts` accepts only a bounded trusted request-ID pattern or generates a UUID, returns it in `x-request-id`, and attaches it to structured request logging.
- **Privacy:** logging uses hashed client IP information rather than exposing raw IP in these request events.
- **Viva:** Request IDs support support/debug correlation without exposing stack traces or sensitive internal error objects to the user.

### 7.9 Responsive/accessibility behavior

- **Observed UI:** desktop sidebar becomes mobile header/drawer; Resume editor/preview, Interview workspace and Learning panels adapt at reduced width; content remains scrollable/readable rather than requiring a second mobile application.
- **Keyboard/focus:** skip link; visible focus treatment; dialog initial/return focus; validation summaries focus relevant fields; Resume Save keyboard shortcut; Learning tab ArrowLeft/ArrowRight/Home/End handling; pager controls expose disabled boundaries.
- **Semantic/ARIA examples:** landmarks, headings, `role="status"`, `role="alert"`, `aria-live`, `aria-busy`, `aria-expanded`, `aria-pressed`, `aria-selected`, tablist/tab/tabpanel, labelled progress controls and accessible action names.
- **Evidence:** component/regression tests cover many keyboard/state/ARIA contracts plus human visual QA in visible frontend phases.
- **Claim boundary:** this is implemented accessibility/responsive behavior; **no formal WCAG certification is claimed**.
- **Viva:** accessibility is integrated into reusable components and feature workflows rather than added as one isolated screen.

---

# Viva demonstration sequence

Use this order so each section naturally proves the next architectural point:

```text
Login
-> Dashboard
-> Resume Studio: open -> edit -> Save new version -> role assessment -> results
-> Interview Coach: open/create session -> question -> Save attempt -> feedback
-> Learning: open document -> Overview/Original/Extracted -> Grounded Chat -> Flashcards -> Quiz
-> Settings: Gemini connection -> fixed model -> credential controls -> AI usage/account/session
-> architecture/security/background-job explanation
```

## Suggested examiner narration

1. **Login:** “Authentication establishes the protected user context; API authorization remains server-side.”
2. **Dashboard:** “This is an aggregate view of the three domains, not a second data source.”
3. **Resume:** “The key design is immutable user-controlled versions. AI assessment is attached to a saved version and suggestions require confirmation.”
4. **Interview:** “Manual practice works without AI; AI generation/explanation/feedback are optional durable jobs. Coding answers are text-only and never executed.”
5. **Learning:** “The uploaded PDF is private. Processing produces page-aware stored evidence; chat/flashcards/quizzes are grounded against the processed document.”
6. **Settings:** “Gemini is fixed to `gemini-3.6-flash`. Users may use the application-managed source when available or an encrypted personal key; plaintext is not returned to the browser.”
7. **Architecture/security:** “Cross-cutting controls are authentication, ownership, private assets, durable jobs, polling/cancel/retry, validation before persistence and request-ID diagnostics.”

---

# High-value viva questions

**Why immutable Resume versions?**  They preserve a stable user-controlled record, make history auditable and give assessment/suggestion workflows an exact content identity.

**Why background jobs instead of waiting for Gemini in the HTTP request?**  Long/variable work needs durable identity, progress, timeout/cancellation/retry and safe persistence boundaries. The frontend can poll without assuming the browser connection equals job execution.

**How do you prevent AI from silently modifying user data?**  Resume recommendations require explicit selection/confirmation; Interview AI creates questions/guidance around stored records; Learning generation persists validated bounded outputs. Feature services validate model output before canonical persistence.

**How is private user data protected?**  Protected API sessions, owner-scoped database access, a private Asset abstraction, short-lived document access, encrypted personal Gemini credentials and no plaintext credential echo to the browser.

**Does Grounded Chat guarantee that every statement is true?**  No. The application grounds the workflow in validated document chunks and stores page references, but AI output can still be imperfect; the page-aware source links let the user review the underlying document evidence.

**Does Interview Coding execute code?**  No. Coding answers are stored/reviewed as text; there is no compiler or execution sandbox.

**Do you claim WCAG certification?**  No. The application implements responsive layouts, semantic/ARIA patterns, focus/keyboard behavior and tested accessibility-oriented interactions, but no formal WCAG certification claim is made.

**Do you stream AI tokens?**  No. The current application uses durable background jobs and progress/status polling; it does not claim SSE, WebSocket or token-streaming delivery.
