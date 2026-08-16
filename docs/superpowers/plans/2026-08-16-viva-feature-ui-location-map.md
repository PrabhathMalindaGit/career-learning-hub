# Viva Feature & UI Location Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a stable numbered capability map that links each major Career Learning Hub feature to its UI location, exact control/state behavior, principal code locations, and concise professional source comments without changing application behavior.

**Architecture:** Keep the product implementation unchanged. The authoritative explanation lives in one new Markdown guide, while a deliberately small set of high-value frontend/backend/CSS entry points receive comment-only `Feature X.Y` annotations that explain responsibility or non-obvious design rationale. Existing routes, APIs, types, schemas, tests, CSS values, Gemini behavior, persistence, jobs, security controls, and runtime logic remain byte-for-byte unchanged except for inserted comments.

**Tech Stack:** React 19, TypeScript, Vite, React Router, Express 5, MongoDB/Mongoose, shared TypeScript contracts, Vitest/Testing Library, existing Gemini Direct integration, Markdown documentation.

## Global Constraints

- Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.
- Repository: `PrabhathMalindaGit/career-learning-hub`.
- Base: `main @ b285dcb6a0480c1e973cd56c770503fad2a354da`.
- Working branch: `docs/viva-feature-ui-location-map`.
- Approved design: `docs/superpowers/specs/2026-08-16-viva-feature-ui-location-map-design.md`.
- The stable feature-number system is 1.x Access & Navigation, 2.x Dashboard, 3.x Resume Studio, 4.x Interview Coach, 5.x Learning Workspace, 6.x Settings & Gemini, 7.x Shared Platform Controls.
- Source/CSS edits are limited to concise professional comments only.
- Do not add `VIVA:` comments or examiner-facing instructions inside source files.
- Do not add comments that merely state obvious screen coordinates or repeat the next line of code.
- Do not change executable logic, imports, exports, types, API contracts, schemas, selectors, CSS declarations/values, tests, configuration, database behavior, provider behavior, job semantics, security behavior, dependencies, lockfiles, or runtime behavior.
- Do not add feature-number comments to test files.
- Do not rename visible controls merely to make the guide easier to write.
- Do not claim a button changes colour unless the current CSS proves that state.
- Preserve the current university narrative: Career Learning Hub is one integrated authenticated web application; do not reintroduce predecessor-product provenance.
- No deployment.
- No branch deletion.
- No merge without separate explicit approval of the exact qualified head SHA.
- Execution tooling: ChatGPT/GitHub connector is sufficient; Codex is not required for this comment/documentation task.
- Codex model / Intelligence setting: not required because Codex is not used.
- Manual terminal work: required only for the final local qualification commands in Task 8.
- Required servers/services during implementation: none.
- Browser use: not required because no rendered UI or CSS values may change; use browser verification only if a current visible label/location cannot be resolved from source.

---

## File Structure

### Create

- `docs/viva/VIVA_FEATURE_UI_LOCATION_MAP.md` — authoritative numbered map from product capability to UI path, route, control, visual state, code locations, representative tests, and viva-ready explanation.

### Frontend comment-only targets

- `frontend/src/AppShell.tsx` — Features 1.3–1.6 shell, navigation, Create menu, and logout responsibility.
- `frontend/src/features/dashboard/MainDashboard.tsx` — Features 2.1–2.5 dashboard outcomes, continuation shortcuts, and recent activity.
- `frontend/src/features/resumes/ResumeListPage.tsx` — Features 3.1–3.2 Resume collection and creation entry point.
- `frontend/src/features/resumes/ResumeCreateDialog.tsx` — Features 3.2.1–3.2.3 Guided/blank/PDF-import creation modes.
- `frontend/src/features/resumes/ResumeWorkspace.tsx` — Features 3.3–3.12 Resume editor, preview, save/versioning, design, photo, export, assessment, recommendations, history, and recovery boundaries.
- `frontend/src/features/resumes/ResumeAssessmentActionUi.css` — Feature 3.9 visual-hierarchy rationale only; existing color values remain unchanged.
- `frontend/src/features/interviews/InterviewSessionListPage.tsx` — Features 4.1–4.2 Interview collection and create entry point.
- `frontend/src/features/interviews/InterviewCreateDialog.tsx` — Features 4.2–4.3 session authoring context.
- `frontend/src/features/interviews/InterviewSessionWorkspace.tsx` — Features 4.4–4.13 question generation, manual authoring, filters/pins, notes, attempts, explanations, feedback, and lifecycle boundaries.
- `frontend/src/features/interviews/InterviewAnswerControl.tsx` — Features 4.6 and 4.9 type-aware answer entry and attempt submission.
- `frontend/src/features/learning/LearningDashboard.tsx` — Features 5.1–5.3 upload, processing status, and document library.
- `frontend/src/features/learning/LearningDocumentWorkspace.tsx` — Features 5.4–5.9 document tabs and child-workspace composition.
- `frontend/src/features/learning/LearningConversationWorkspace.tsx` — Features 5.7.2–5.7.3 grounded question submission and source-page evidence.
- `frontend/src/features/learning/DocumentFlashcards.tsx` — Feature 5.8.1 flashcard generation/list entry point.
- `frontend/src/features/learning/FlashcardStudy.tsx` — Features 5.8.2–5.8.3 study/reveal/navigation behavior.
- `frontend/src/features/learning/DocumentQuizzes.tsx` — Feature 5.9.1 quiz generation/list entry point.
- `frontend/src/features/learning/LearningQuizWorkspace.tsx` — Feature 5.9.2 quiz-taking workspace.
- `frontend/src/features/learning/LearningQuizAttemptWorkspace.tsx` — Feature 5.9.3 saved quiz-attempt review.
- `frontend/src/features/auth/SettingsPage.tsx` — Features 6.10–6.11 Settings composition, AI diagnostics, account, and session surfaces.
- `frontend/src/features/auth/GeminiConnectionSettings.tsx` — Features 6.1–6.9 Gemini connection/credential controls.
- `frontend/src/features/auth/AiUsageDiagnosticsSettings.tsx` — Feature 6.10 bounded AI-usage diagnostics presentation.
- `frontend/src/features/jobs/JobResilienceActions.tsx` — Features 7.5–7.6 shared progress/cancel/retry control responsibility.

### Backend comment-only targets

- `backend/src/middleware/authenticate.ts` — Features 7.1–7.2 authentication/owner-context boundary.
- `backend/src/modules/assets/asset.service.ts` — Feature 7.3 private asset access/storage boundary.
- `backend/src/jobs/job.worker.ts` — Feature 7.4 shared background-job execution boundary.
- `backend/src/middleware/validate.ts` — Feature 7.7 request validation boundary.
- `backend/src/middleware/requestContext.ts` — Feature 7.8 request-ID context boundary.
- `backend/src/modules/resume-analysis/resumeAnalysis.jobs.ts` — Features 3.9–3.10 Resume assessment background-job registration/execution boundary.
- `backend/src/modules/interviews/interview.jobs.ts` — Features 4.4, 4.11, and 4.12 Interview AI job boundary.
- `backend/src/modules/learning/learning.jobs.ts` — Features 5.2, 5.7, 5.8, and 5.9 Learning background-job boundary.
- `backend/src/modules/learning/learningChildDeletion.service.ts` — Feature 5.10 owner-scoped/cascade deletion boundary.
- `backend/src/modules/ai/aiProvider.service.ts` — Features 6.1–6.9 Gemini source/connection preference boundary.
- `backend/src/modules/ai/credentialVault.ts` — Features 6.4, 6.7, and 6.9 encrypted personal credential boundary.

### Reference-only code locations — do not modify unless the approved comment target above proves insufficient

- `frontend/src/routing/router.tsx` — canonical route table.
- `frontend/src/styles.css` — common primary/secondary/destructive/quiet/active-navigation state definitions.
- `frontend/src/features/resumes/resumeApi.ts` — Resume frontend API gateway.
- `backend/src/modules/resumes/resume.controller.ts`, `resume.service.ts`, `resumePhoto.service.ts` — Resume persistence/photo backend references.
- `backend/src/modules/resume-analysis/resumeAnalysis.controller.ts`, `resumeAnalysis.service.ts`, `resumeAnalysis.routes.ts` — Resume assessment API/service references.
- `frontend/src/features/interviews/interviewApi.ts` — Interview frontend API gateway.
- `backend/src/modules/interviews/interview.controller.ts`, `interview.service.ts`, `interviewAi.service.ts` — Interview API/persistence/AI references.
- `frontend/src/features/learning/learningApi.ts` — Learning frontend API gateway.
- `backend/src/modules/learning/learning.controller.ts`, `documentProcessing.service.ts`, `learningChat.service.ts`, `learningAssessment.service.ts` — Learning API/processing/chat/flashcard/quiz references.
- `frontend/src/features/auth/geminiSettingsApi.ts` — Gemini Settings frontend API gateway.
- `backend/src/modules/ai/geminiPolicy.ts`, `aiRouting.service.ts`, `providers/gemini.provider.ts` — fixed-model/routing/provider references.
- `packages/shared-types/src/index.ts` — shared contract reference.
- Existing frontend/backend tests — representative evidence only; no test file edits.

---

### Task 1: Build the authoritative feature-map skeleton from the current route/UI tree

**Files:**
- Create: `docs/viva/VIVA_FEATURE_UI_LOCATION_MAP.md`
- Read only: `frontend/src/routing/router.tsx`
- Read only: `frontend/src/AppShell.tsx`
- Read only: `frontend/src/styles.css`

**Interfaces:**
- Consumes: approved stable feature numbers from the design spec.
- Produces: one Markdown heading/entry for every approved 1.x–7.x feature number, ready for area-specific evidence in Tasks 2–7.

- [ ] **Step 1: Record the fixed route table exactly as implemented**

Use these current routes as the canonical route map:

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

Do not invent a separate Activity, study-set rename, or other route.

- [ ] **Step 2: Add a guide legend and feature-number index**

The document must explain these fields once:

```text
Feature
UI path
Route
Screen / section
Control
Control location
Enabled when
Visual / state behavior
What happens
Frontend
Frontend API / gateway
Backend
Shared contract
Representative tests
Viva-ready explanation
```

Then include the full 1–7 feature-number index from the approved design.

- [ ] **Step 3: Record the common button/state vocabulary from current CSS**

Document, without editing CSS values:

```text
Primary: solid Career Learning Hub green; white text; darker green hover.
Secondary: light/neutral supporting action.
Quiet/tertiary: low-emphasis action.
Destructive: solid red; darker red hover.
Disabled: muted/non-interactive.
Busy: label/status changes such as Saving…, Creating…, Uploading…, Generating…, Testing….
Active navigation/tab/filter: selected treatment identifies current context.
Status surfaces: success/warning/error/info feedback, not action buttons.
```

Also record the current shared CSS anchors `--accent: #287a4a` and `--accent-dark: #1e6039`, plus destructive `#a33b3b` / hover `#842424`, only as observed implementation evidence.

- [ ] **Step 4: Commit the guide skeleton**

Commit only the new Markdown guide at this step.

Suggested commit message:

```text
Add numbered viva feature map skeleton
```

---

### Task 2: Map Access, Navigation, Dashboard, and add their high-value comments

**Files:**
- Modify comments only: `frontend/src/AppShell.tsx`
- Modify comments only: `frontend/src/features/dashboard/MainDashboard.tsx`
- Modify comments only: `backend/src/middleware/authenticate.ts`
- Read only: `frontend/src/features/auth/LoginPage.tsx`
- Read only: `frontend/src/features/auth/RegisterPage.tsx`
- Read only: `frontend/src/features/auth/AuthProvider.tsx`
- Read only: `frontend/src/features/dashboard/ProgressWidgets.tsx`
- Read only: `frontend/src/features/dashboard/ActivityFeed.tsx`
- Read only: `frontend/src/features/dashboard/dashboardApi.ts`
- Modify: `docs/viva/VIVA_FEATURE_UI_LOCATION_MAP.md`

**Interfaces:**
- Consumes: Task 1 feature-map structure.
- Produces: complete Features 1.1–2.5 UI/code/state entries and searchable comments at the shell/dashboard/authentication boundaries.

- [ ] **Step 1: Add the shell responsibility comment above `AppShell`**

Insert only this professional responsibility comment (wrapping is allowed; wording must stay equivalent):

```ts
// Features 1.3–1.6 — Authenticated application shell.
// Centralizes desktop/mobile navigation, global creation shortcuts, account
// context, and single-flight logout while protected feature routes render below.
```

Do not modify `navigationItems`, `createItems`, logout logic, JSX, or styles.

- [ ] **Step 2: Add the Dashboard responsibility comment above `MainDashboard`**

Use:

```ts
// Features 2.1–2.5 — Dashboard.
// Combines bounded progress outcomes, continuation/start shortcuts for the
// three workspaces, and recent activity without owning those feature domains.
```

- [ ] **Step 3: Add the shared authentication-boundary comment to `authenticate.ts`**

Use:

```ts
// Features 7.1–7.2 — Authenticated request boundary.
// Resolves the current session/user context used by owner-scoped protected APIs.
```

Do not alter token/session validation logic.

- [ ] **Step 4: Complete Features 1.1–1.6 in the guide**

Record exact visible controls from current source, including `Log in`, registration action, sidebar navigation, mobile `Menu`, global `Create`, and `Log out` / `Logging out…`. For Feature 1.5 record the existing Create destinations:

```text
Resume -> /resumes?action=create
Interview session -> /interviews?action=create
Learning document -> /learning?action=upload
```

Map frontend/auth/backend files, including `backend/src/modules/auth/auth.controller.ts`, `auth.service.ts`, `auth.routes.ts`, `authSession.model.ts`, and `token.service.ts` as implementation references; do not modify those files solely to increase comment count.

- [ ] **Step 5: Complete Features 2.1–2.5 in the guide**

Document the current Dashboard `Continue your work` behavior, Resume/Interview/Learning continuation/fallback actions, outcome/progress presentation, performance period, and bounded Recent Activity / `View all activity` behavior from current source. Reference `MainDashboard.tsx`, `ProgressWidgets.tsx`, `ActivityFeed.tsx`, `dashboardApi.ts`, and their existing tests.

- [ ] **Step 6: Review this task diff before committing**

The only source additions in this task must be `//` comments. There must be no source deletions.

Suggested commit message:

```text
Document access and dashboard feature locations
```

---

### Task 3: Map Resume Studio and add Resume responsibility comments

**Files:**
- Modify comments only: `frontend/src/features/resumes/ResumeListPage.tsx`
- Modify comments only: `frontend/src/features/resumes/ResumeCreateDialog.tsx`
- Modify comments only: `frontend/src/features/resumes/ResumeWorkspace.tsx`
- Modify comments only: `frontend/src/features/resumes/ResumeAssessmentActionUi.css`
- Modify comments only: `backend/src/modules/resume-analysis/resumeAnalysis.jobs.ts`
- Read only: `frontend/src/features/resumes/ResumeEditor.tsx`
- Read only: `frontend/src/features/resumes/ResumePreview.tsx`
- Read only: `frontend/src/features/resumes/ResumeDesignControls.tsx`
- Read only: `frontend/src/features/resumes/ResumeCandidatePhotoControls.tsx`
- Read only: `frontend/src/features/resumes/ResumePrintControls.tsx`
- Read only: `frontend/src/features/resumes/ResumeVersionTimeline.tsx`
- Read only: `frontend/src/features/resumes/resumeApi.ts`
- Read only: `backend/src/modules/resumes/resume.controller.ts`
- Read only: `backend/src/modules/resumes/resume.service.ts`
- Read only: `backend/src/modules/resumes/resumePhoto.service.ts`
- Read only: `backend/src/modules/resume-analysis/resumeAnalysis.controller.ts`
- Read only: `backend/src/modules/resume-analysis/resumeAnalysis.service.ts`
- Modify: `docs/viva/VIVA_FEATURE_UI_LOCATION_MAP.md`

**Interfaces:**
- Consumes: approved Features 3.1–3.12 numbering.
- Produces: complete Resume UI/control/code map plus searchable comments at collection/create/workspace/assessment boundaries.

- [ ] **Step 1: Add Resume collection and creation comments**

Above `ResumeListPage` use:

```ts
// Features 3.1–3.2 — Resume collection and creation entry point.
// Lists owned resumes and opens the shared creation flow without duplicating
// editor, import, or assessment behavior in the collection page.
```

Above `ResumeCreateDialog` use:

```ts
// Features 3.2.1–3.2.3 — Resume creation modes.
// Provides Guided setup, Start blank, and staged private PDF import/review
// before the resulting resume opens in the canonical Resume Studio workspace.
```

- [ ] **Step 2: Add one compact Resume workspace feature-index comment**

Above `ResumeWorkspace` use:

```ts
// Features 3.3–3.12 — Canonical Resume Studio workspace.
// Owns editing/live preview, immutable version saves, appearance/photo/export,
// role-aware assessment and recommendations, version history, and recovery.
```

Do not add a separate comment above every handler.

- [ ] **Step 3: Add the assessment-job comment to `resumeAnalysis.jobs.ts`**

Use:

```ts
// Features 3.9–3.10 — Resume assessment job boundary.
// Runs assessment work against the authorized saved Resume version and returns
// validated job results that the workspace can review before applying changes.
```

Do not alter job registration, routing, retry, or persistence logic.

- [ ] **Step 4: Add only the approved CSS rationale above the scoped assessment rule**

Use:

```css
/* Feature 3.9 — Resume assessment action.
   Keep assessment visually secondary to Feature 3.5 "Save new version",
   which remains the workspace's highest-emphasis constructive action. */
```

Do not change any selector or declaration. Preserve the current exact assessment colors:

```text
normal border #b9cec1
normal text #245e3c
normal background #eef6f1
hover border #aac2b3
hover background #e5f0e9
disabled border #c8d5cd
disabled text #66756c
disabled background #f1f5f2
disabled opacity 1
```

- [ ] **Step 5: Complete Features 3.1–3.8 in the guide**

For each feature record exact current control names and conditions from source. Include the three Create Resume choices (`Guided setup`, `Start blank`, `Import PDF`), editor/live preview, `Save new version`, design/template controls, Candidate Photo actions, and print/save-as-PDF workflow. Map current frontend/API/backend/test files rather than phase-history documents.

- [ ] **Step 6: Complete Feature 3.9 with exact action/state evidence**

Record:

```text
UI path: Resumes -> open a Resume
Route: /resumes/:resumeId
Section: Role-aware assessment
Inputs: Target role; Company (optional); Job description (optional)
Action: Run AI-assisted assessment
Busy label: Checking assessment…
Disabled when: unsaved draft exists; recovery decision is active; assessment is busy; target role has fewer than 2 trimmed characters
Result: assessment is queued for the current saved version and polled to a validated result
```

Include the exact scoped colors from Step 4 and explain the visual hierarchy relative to Feature 3.5.

- [ ] **Step 7: Complete Features 3.10–3.12 in the guide**

Document AI recommendation selection/application, immutable version history/read-only snapshot behavior, draft recovery, unsaved-navigation protection, and destructive recovery choices. Reference current tests such as `ResumeWorkspace.test.tsx`, candidate-photo tests, import tests, version-persistence tests, and recovery/print tests; do not edit them.

- [ ] **Step 8: Review and commit the Resume slice**

Require zero executable source deletions and comment-only source/CSS additions.

Suggested commit message:

```text
Document Resume Studio feature locations
```

---

### Task 4: Map Interview Coach and add Interview responsibility comments

**Files:**
- Modify comments only: `frontend/src/features/interviews/InterviewSessionListPage.tsx`
- Modify comments only: `frontend/src/features/interviews/InterviewCreateDialog.tsx`
- Modify comments only: `frontend/src/features/interviews/InterviewSessionWorkspace.tsx`
- Modify comments only: `frontend/src/features/interviews/InterviewAnswerControl.tsx`
- Modify comments only: `backend/src/modules/interviews/interview.jobs.ts`
- Read only: `frontend/src/features/interviews/InterviewSessionCard.tsx`
- Read only: `frontend/src/features/interviews/InterviewQuestionTypeControls.tsx`
- Read only: `frontend/src/features/interviews/InterviewStructuredAnswerFields.tsx`
- Read only: `frontend/src/features/interviews/interviewApi.ts`
- Read only: `backend/src/modules/interviews/interview.controller.ts`
- Read only: `backend/src/modules/interviews/interview.service.ts`
- Read only: `backend/src/modules/interviews/interviewAi.service.ts`
- Modify: `docs/viva/VIVA_FEATURE_UI_LOCATION_MAP.md`

**Interfaces:**
- Consumes: approved Features 4.1–4.13 numbering.
- Produces: complete Interview UI/control/code map and searchable comments for collection/create/workspace/typed-answer/AI-job boundaries.

- [ ] **Step 1: Add the collection and creation comments**

Above `InterviewSessionListPage` use:

```ts
// Features 4.1–4.2 — Interview Coach collection and creation entry point.
// Lists/filter sessions and opens the guided session-creation dialog before
// navigating into the selected session workspace.
```

Above `InterviewCreateDialog` use:

```ts
// Features 4.2–4.3 — Interview session authoring.
// Captures career area, target role, experience level, practice mode, and
// optional focus context used to create an owned practice session.
```

- [ ] **Step 2: Add one compact workspace feature-index comment**

Above `InterviewSessionWorkspace` use:

```ts
// Features 4.4–4.13 — Interview practice workspace.
// Coordinates generated/manual questions, filters and pins, private notes,
// saved attempts, explanations, AI feedback, and session lifecycle actions.
```

- [ ] **Step 3: Add the type-aware answer comment**

Above `InterviewAnswerControl` use:

```ts
// Features 4.6 and 4.9 — Type-aware practice answer control.
// Presents the correct answer experience for the selected question type and
// emits one explicit saved attempt; Coding submissions remain text-only.
```

- [ ] **Step 4: Add the Interview AI-job boundary comment**

In `interview.jobs.ts` use:

```ts
// Features 4.4, 4.11, and 4.12 — Interview AI job boundary.
// Registers question-generation, explanation, and non-MCQ feedback work while
// preserving the shared polling/cancel/retry execution model.
```

- [ ] **Step 5: Complete Features 4.1–4.6 in the guide**

Record exact current controls: `Create interview`, status filters, Career area, Target role, Experience level, Practice mode, `Generate questions`, `Add manually`, question count/categories/types, manual MCQ authoring, and the current answer experiences (Multiple Choice, Short Answer, Coding, Behavioral, Scenario-Based, Technical Explanation). State explicitly that Coding is reviewed as text and not executed.

- [ ] **Step 6: Complete Features 4.7–4.13 in the guide**

Record filters/pinning, `Pin question` / `Unpin`, private notes (`Add note` / `Show note` / `Save notes` / `Clear notes`), `Save attempt`, saved-attempt review, `Request explanation`, `Request feedback`, lifecycle archive/restore/delete controls from current source, and provider job progress/cancel/retry/resume-status behavior.

Map exact principal backend files (`interview.controller.ts`, `interview.service.ts`, `interview.jobs.ts`, `interviewAi.service.ts`) and representative tests from the existing Interview test tree; do not edit tests.

- [ ] **Step 7: Review and commit the Interview slice**

Suggested commit message:

```text
Document Interview Coach feature locations
```

---

### Task 5: Map Learning Workspace and add Learning responsibility comments

**Files:**
- Modify comments only: `frontend/src/features/learning/LearningDashboard.tsx`
- Modify comments only: `frontend/src/features/learning/LearningDocumentWorkspace.tsx`
- Modify comments only: `frontend/src/features/learning/LearningConversationWorkspace.tsx`
- Modify comments only: `frontend/src/features/learning/DocumentFlashcards.tsx`
- Modify comments only: `frontend/src/features/learning/FlashcardStudy.tsx`
- Modify comments only: `frontend/src/features/learning/DocumentQuizzes.tsx`
- Modify comments only: `frontend/src/features/learning/LearningQuizWorkspace.tsx`
- Modify comments only: `frontend/src/features/learning/LearningQuizAttemptWorkspace.tsx`
- Modify comments only: `backend/src/modules/learning/learning.jobs.ts`
- Modify comments only: `backend/src/modules/learning/learningChildDeletion.service.ts`
- Read only: `frontend/src/features/learning/DocumentConversations.tsx`
- Read only: `frontend/src/features/learning/LearningChildDeletion.tsx`
- Read only: `frontend/src/features/learning/learningApi.ts`
- Read only: `backend/src/modules/learning/learning.controller.ts`
- Read only: `backend/src/modules/learning/documentProcessing.service.ts`
- Read only: `backend/src/modules/learning/learningChat.service.ts`
- Read only: `backend/src/modules/learning/learningAssessment.service.ts`
- Modify: `docs/viva/VIVA_FEATURE_UI_LOCATION_MAP.md`

**Interfaces:**
- Consumes: approved Features 5.1–5.10 numbering.
- Produces: complete Learning UI/control/code map and searchable comments for library/document/chat/flashcard/quiz/job/deletion boundaries.

- [ ] **Step 1: Add Learning library/document comments**

Above `LearningDashboard` use:

```ts
// Features 5.1–5.3 — Learning document library.
// Handles private PDF upload, processing-status presentation, filtering, and
// navigation into an owned document workspace.
```

Above `LearningDocumentWorkspace` use:

```ts
// Features 5.4–5.9 — Learning document workspace.
// Hosts Overview, secure original PDF, extracted content, Grounded Chat,
// Flashcards, and Quizzes for one processed document.
```

- [ ] **Step 2: Add Grounded Chat comment**

Above `LearningConversationWorkspace` use:

```ts
// Features 5.7.2–5.7.3 — Grounded document conversation.
// Submits one user question through the durable grounded-response job flow and
// presents validated source-page references with the stored assistant answer.
```

- [ ] **Step 3: Add Flashcard comments**

Above `DocumentFlashcards` use:

```ts
// Feature 5.8.1 — Document-based flashcard generation.
// Creates and tracks grounded flashcard sets, then opens ready sets for study.
```

Above `FlashcardStudy` use:

```ts
// Features 5.8.2–5.8.3 — Flashcard study experience.
// Keeps answer reveal explicit and provides bounded previous/next navigation
// plus source-page references for each stored card.
```

- [ ] **Step 4: Add Quiz comments**

Above `DocumentQuizzes` use:

```ts
// Feature 5.9.1 — Document-based quiz generation.
// Creates and tracks grounded quizzes and opens ready quizzes for attempts.
```

Above `LearningQuizWorkspace` use:

```ts
// Feature 5.9.2 — Quiz-taking workspace.
// Presents the saved quiz questions and records an explicit server-scored attempt.
```

Above `LearningQuizAttemptWorkspace` use:

```ts
// Feature 5.9.3 — Saved quiz-attempt review.
// Presents the canonical stored result, score, answers, and source evidence.
```

- [ ] **Step 5: Add Learning backend boundary comments**

In `learning.jobs.ts` use:

```ts
// Features 5.2 and 5.7–5.9 — Learning background-job boundary.
// Registers document processing and grounded AI generation work used by chat,
// flashcards, and quizzes through the shared durable-job execution model.
```

In `learningChildDeletion.service.ts` use:

```ts
// Feature 5.10 — Learning child-resource deletion boundary.
// Performs owner-scoped transactional deletion/cascade rules while active jobs
// remain authoritative blockers for the targeted resource.
```

- [ ] **Step 6: Complete Features 5.1–5.6 in the guide**

Record exact controls and states for `Upload PDF`, `Upload document`, processing progress/resilience, Document status filter, `Refresh documents`, `Open workspace`, Overview, Original PDF secure viewer, and Extracted Content. Include the 15 MB PDF limit and text-based/no-OCR limitation only where current source states them.

- [ ] **Step 7: Complete Features 5.7–5.10 in the guide**

Record `Create conversation`, `Send question`, response status/cancel/retry/resume, source-page buttons, `Create flashcards` / `Generate flashcards` / `Study set`, `Reveal answer` / `Hide answer` / Previous / Next, `Create quiz` / `Generate quiz` / `Take quiz`, saved attempt review, and child-resource deletion. Map principal current frontend/backend/test files.

- [ ] **Step 8: Review and commit the Learning slice**

Suggested commit message:

```text
Document Learning Workspace feature locations
```

---

### Task 6: Map Settings/Gemini and shared platform controls; add their comments

**Files:**
- Modify comments only: `frontend/src/features/auth/SettingsPage.tsx`
- Modify comments only: `frontend/src/features/auth/GeminiConnectionSettings.tsx`
- Modify comments only: `frontend/src/features/auth/AiUsageDiagnosticsSettings.tsx`
- Modify comments only: `frontend/src/features/jobs/JobResilienceActions.tsx`
- Modify comments only: `backend/src/modules/ai/aiProvider.service.ts`
- Modify comments only: `backend/src/modules/ai/credentialVault.ts`
- Modify comments only: `backend/src/modules/assets/asset.service.ts`
- Modify comments only: `backend/src/jobs/job.worker.ts`
- Modify comments only: `backend/src/middleware/validate.ts`
- Modify comments only: `backend/src/middleware/requestContext.ts`
- Read only: `frontend/src/features/auth/geminiSettingsApi.ts`
- Read only: `backend/src/modules/ai/geminiPolicy.ts`
- Read only: `backend/src/modules/ai/aiRouting.service.ts`
- Read only: `backend/src/modules/ai/providers/gemini.provider.ts`
- Read only: `packages/shared-types/src/index.ts`
- Modify: `docs/viva/VIVA_FEATURE_UI_LOCATION_MAP.md`

**Interfaces:**
- Consumes: approved Features 6.1–7.9 numbering.
- Produces: complete Settings/Gemini/shared-platform map and searchable comments at credential/job/validation/request-context boundaries.

- [ ] **Step 1: Add Settings/Gemini frontend comments**

Above `SettingsPage` use:

```ts
// Features 6.10–6.11 — Settings composition.
// Combines Gemini controls, bounded AI-usage diagnostics, account information,
// and explicit current-session sign-out without exposing credential plaintext.
```

Above `GeminiConnectionSettingsSection` use:

```ts
// Features 6.1–6.9 — Gemini connection management.
// Presents application-managed/personal/disconnected modes, connection tests,
// personal-key replacement, disconnection, and explicit key deletion.
```

Above `AiUsageDiagnosticsSettingsSection` use:

```ts
// Feature 6.10 — AI usage diagnostics.
// Reads bounded aggregated usage metrics for Settings without exposing prompts,
// generated content, private document content, or credential values.
```

- [ ] **Step 2: Add shared frontend resilience comment**

Above `JobResilienceActions` use:

```ts
// Features 7.5–7.6 — Shared job resilience controls.
// Presents progress-aware cancel/retry actions used by Resume, Interview, and
// Learning durable jobs without owning feature-specific persistence.
```

- [ ] **Step 3: Add backend Gemini/credential comments**

In `aiProvider.service.ts` use:

```ts
// Features 6.1–6.9 — Gemini source and credential preference boundary.
// Resolves the authenticated user's allowed connection mode without exposing
// stored credential plaintext through the settings API.
```

In `credentialVault.ts` use:

```ts
// Features 6.4, 6.7, and 6.9 — Personal Gemini credential vault.
// Encrypts/decrypts server-side credential material for controlled execution;
// the complete saved key is never returned to the browser.
```

Do not change encryption code, revisions, key handling, or provider policy.

- [ ] **Step 4: Add shared platform backend comments**

Use these exact responsibility statements:

`asset.service.ts`:

```ts
// Feature 7.3 — Private asset boundary.
// Centralizes owner-scoped asset storage/access rules used by private PDFs and
// other protected files rather than exposing raw storage directly to clients.
```

`job.worker.ts`:

```ts
// Feature 7.4 — Shared background-job execution boundary.
// Executes registered durable work with the existing lease, cancellation,
// retry, progress, and completion-safety rules.
```

`validate.ts`:

```ts
// Feature 7.7 — Request validation boundary.
// Rejects malformed validated inputs before feature handlers persist or queue work.
```

`requestContext.ts`:

```ts
// Feature 7.8 — Request context and diagnostic identity.
// Establishes the bounded request identifier used for safe error correlation.
```

- [ ] **Step 5: Complete Features 6.1–6.11 in the guide**

Record the Settings `Gemini connection` panel, connection badge, fixed model display, `Test connection`, `Use application-managed Gemini` when available, `Connect a personal key`, `Save and test`, `Replace key`, `Disconnect`, destructive `Delete key` confirmation, AI usage & diagnostics, account information, and `Sign out of this session`. Map frontend API, backend provider/vault/policy files, shared types, and existing tests.

- [ ] **Step 6: Complete Features 7.1–7.9 in the guide**

These are architecture/control features rather than separate screens. For each one, state:

```text
Where it is observed in the UI
Which feature flows rely on it
Principal frontend/backend implementation boundary
Representative existing tests/security evidence
What the user should say if asked why it exists
```

Feature 7.9 must refer to existing responsive/mobile navigation, keyboard/focus, semantic/ARIA, and reduced-width behavior without claiming formal WCAG certification.

- [ ] **Step 7: Review and commit the Settings/shared-platform slice**

Suggested commit message:

```text
Document Gemini and shared platform feature locations
```

---

### Task 7: Finalize the guide, cross-links, button/state audit, and memorization structure

**Files:**
- Modify: `docs/viva/VIVA_FEATURE_UI_LOCATION_MAP.md`
- Read only: all source/CSS files listed in Tasks 1–6.

**Interfaces:**
- Consumes: all completed feature-area entries.
- Produces: final authoritative repository guide from which the ChatGPT cheat sheet can be generated without new repository changes.

- [ ] **Step 1: Add a one-page “find it fast” index**

At the top of the guide, include compact mappings such as:

```text
3.9 -> Resume AI-assisted role assessment
4.12 -> Interview AI feedback
5.7 -> Grounded Chat
5.8 -> Flashcards
5.9 -> Quizzes
6.4 -> Personal Gemini key
7.4 -> Background jobs
```

Use the full approved feature-number list, not just these examples.

- [ ] **Step 2: Add a dedicated button/color/state reference**

Separate globally shared visual language from feature-specific exceptions. Feature 3.9 must explicitly state that its pale-green treatment is an intentional scoped exception so Feature 3.5 `Save new version` remains the strongest constructive action.

- [ ] **Step 3: Add a “Where is it in the code?” quick index**

Group by top-level areas and list principal files only. The index should let the user jump from a feature number to the main frontend component and backend boundary without reading the long entry.

- [ ] **Step 4: Add a demonstration sequence**

Keep the established viva demonstration flow:

```text
Login
-> Dashboard
-> Resume Studio: open/save/assessment/results
-> Interview Coach: session/question/attempt/feedback
-> Learning: document/grounded chat/flashcards/quiz
-> Settings: Gemini/security/usage
-> architecture/security/background-job explanation
```

Do not create new functionality to support the demo.

- [ ] **Step 5: Perform a consistency pass**

Verify every feature number appears with the same meaning in:

1. the design spec;
2. the guide;
3. any new source comments.

Verify all visible control names in the guide match current source exactly.

- [ ] **Step 6: Commit the final guide polish**

Suggested commit message:

```text
Finalize numbered viva feature guide
```

---

### Task 8: Prove the branch is documentation + comments only

**Files:**
- No intended content changes; repair only accidental scope violations found by qualification.

**Interfaces:**
- Consumes: completed branch.
- Produces: exact qualified head SHA plus local evidence suitable for PR review.

- [ ] **Step 1: Pull the exact branch locally**

User runs:

```bash
cd "/Users/prabhathmalinda/Documents/Projects/Career Learning Hub"

git fetch origin
git switch docs/viva-feature-ui-location-map
git pull --ff-only origin docs/viva-feature-ui-location-map

echo "=== HEAD ==="
git rev-parse HEAD

echo "=== STATUS ==="
git status --short
```

Expected: branch is current and `git status --short` is empty before qualification.

- [ ] **Step 2: Verify changed-file scope**

Run:

```bash
echo "=== CHANGED FILES ==="
git diff --name-only origin/main...HEAD

echo "=== TEST FILE CHANGE CHECK — EXPECT NO OUTPUT ==="
git diff --name-only origin/main...HEAD \
  | grep -E '(^|/)(tests?|__tests__)/|\.(test|spec)\.' || true

echo "=== CONFIG / DEPENDENCY CHANGE CHECK — EXPECT NO OUTPUT ==="
git diff --name-only origin/main...HEAD \
  | grep -E '(^|/)(package(-lock)?\.json|tsconfig.*\.json|vite\.config\.|\.env|vercel\.json|render\.yaml|Dockerfile)' || true
```

Expected: changed files are the two process Markdown docs, the new `docs/viva/VIVA_FEATURE_UI_LOCATION_MAP.md`, and the explicitly approved source/CSS comment targets only; test/config/dependency checks return no matches.

- [ ] **Step 3: Prove source/CSS changes contain additions only and those additions are comments**

Run:

```bash
echo "=== SOURCE DELETION CHECK — EXPECT NO OUTPUT ==="
git diff -U0 origin/main...HEAD -- \
  'frontend/src/**/*.ts' 'frontend/src/**/*.tsx' 'frontend/src/**/*.css' \
  'backend/src/**/*.ts' \
  | grep '^-' \
  | grep -v '^---' || true

echo "=== NON-COMMENT SOURCE ADDITION CHECK — EXPECT NO OUTPUT ==="
git diff -U0 origin/main...HEAD -- \
  'frontend/src/**/*.ts' 'frontend/src/**/*.tsx' 'frontend/src/**/*.css' \
  'backend/src/**/*.ts' \
  | grep '^+' \
  | grep -v '^+++' \
  | grep -Ev '^\+[[:space:]]*(//|/\*|\*|\*/|$)' || true
```

Expected: both checks return no output. If either check emits a line, stop qualification and repair the branch before proceeding.

- [ ] **Step 4: Run whitespace/diff validation**

```bash
git diff --check origin/main...HEAD
```

Expected: no output and exit 0.

- [ ] **Step 5: Run syntax/type/build safeguards**

Comments should be runtime-neutral, but TypeScript/CSS comment placement can still cause a syntax mistake. Run:

```bash
npm run typecheck
npm run build
```

Expected: both exit 0. No full regression suite is required unless either command fails or the diff audit shows a non-comment source token changed.

- [ ] **Step 6: Reconfirm clean local state**

```bash
echo "=== FINAL HEAD ==="
git rev-parse HEAD

echo "=== FINAL STATUS ==="
git status --short
```

Expected: exact branch head printed and empty status.

- [ ] **Step 7: GitHub-side comparison review**

Compare `main...docs/viva-feature-ui-location-map` and confirm:

```text
behind_by = 0
merge base = b285dcb6a0480c1e973cd56c770503fad2a354da
no test/config/dependency/runtime-value changes
source/CSS patches contain comments only
new/modified Markdown matches the approved design
```

Do not open/merge a PR until this review is complete.

---

### Task 9: Deliver the ChatGPT memorization cheat sheet and prepare the merge gate

**Files:**
- No repository file required for the cheat sheet; it is delivered in chat from the final guide.
- PR may be created only after Task 8 is green.

**Interfaces:**
- Consumes: exact qualified guide/head from Task 8.
- Produces: short rehearsal aid plus PR-ready evidence summary.

- [ ] **Step 1: Produce the compact cheat sheet using the same numbering**

Each major entry must fit this pattern:

```text
3.9 — AI Resume Assessment
UI: Resumes -> open Resume -> Role-aware assessment -> Run AI-assisted assessment
Code: ResumeWorkspace.tsx -> resumeApi.ts -> backend resume-analysis module
Remember: saved Resume version only; pale-green action is secondary to Save new version.
```

Keep it optimized for memorization rather than duplicating the full guide.

- [ ] **Step 2: Include “examiner asks where?” quick answers**

Provide short answers for at least:

```text
authentication/session
Dashboard continuation/progress
Resume create/save/assessment/version history/photo/export
Interview create/generate/answer/notes/explanation/feedback
Learning upload/PDF/extracted content/chat/flashcards/quizzes
Gemini connection/personal key/usage diagnostics
background jobs/polling/cancel-retry/private storage/validation/request IDs
```

- [ ] **Step 3: Prepare a PR summary only after qualification**

PR summary must explicitly state:

```text
- documentation + professional comment-only annotations
- stable 1.x–7.x feature numbering
- no runtime/API/type/schema/style-value/test/config behavior changes
- local typecheck/build PASS
- source deletion and non-comment addition audits PASS
- no deployment requested
- no branch deletion requested
```

- [ ] **Step 4: Stop at the merge approval gate**

Report the exact qualified head SHA and request separate explicit merge approval. Do not merge, deploy, or delete the branch automatically.
