# Viva Feature & UI Location Map — Design

## Purpose

Create a viva-preparation package that lets the student answer three practical examiner questions quickly and consistently:

1. Where is each implemented capability located in the Career Learning Hub UI?
2. Which control/button activates it, and how does that control or surrounding state change visually?
3. Where is that capability implemented in the codebase?

The package must describe the current final application as implemented. It must not change application behavior.

## Approved scope adjustment

The earlier blanket rule against source-file edits is narrowed for this task only:

- concise **comment-only** edits are permitted in selected existing source/CSS files when they materially improve architectural readability;
- comments must be professional developer documentation, not exam-specific annotations;
- comments must use the approved feature-number identifiers where useful;
- executable logic, types, APIs, schemas, styling values, tests, configuration, runtime behavior, database behavior, provider behavior, and security behavior must remain unchanged;
- no `VIVA:` comments are allowed;
- no comments that merely describe obvious screen coordinates or button positions are allowed.

Example style:

```ts
// Feature 3.9 — Role-aware resume assessment.
// Queues assessment for the current saved resume version and tracks
// the background job until a validated result is available.
```

Example CSS rationale:

```css
/* Feature 3.9 — Resume assessment action.
   Keep assessment visually secondary to Feature 3.5 "Save new version",
   which remains the workspace's primary constructive action. */
```

## Stable feature-number system

The numbering is based on product capability rather than source-file order or development phase so it remains easy to memorize and stable if implementation files later move.

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

## Deliverable 1 — Repository guide

Create:

`docs/viva/VIVA_FEATURE_UI_LOCATION_MAP.md`

For every major feature, record:

- feature number and capability name;
- top-level navigation path;
- route or route family;
- exact screen/workspace/section;
- exact visible control or button label;
- physical location of the control in the screen;
- prerequisite state that enables the control;
- normal visual treatment;
- hover, selected, disabled, busy, success, warning, error, or destructive state where relevant;
- immediate result after activation;
- frontend component/file;
- frontend API/gateway file where relevant;
- styling file where relevant;
- backend route/controller/service/job files where relevant;
- shared contract/type files where relevant;
- representative test files where useful;
- short viva-ready explanation.

The guide must prioritize what an examiner can actually see, click, and ask the student to locate in source code.

## Deliverable 2 — Professional code comments

Add concise feature-responsibility comments only at major implementation entry points or non-obvious control-flow/styling decisions.

Likely comment targets include:

- authenticated shell/navigation;
- Dashboard continuation logic;
- Resume collection/create/workspace;
- Resume assessment, versioning, candidate-photo, export, and recovery boundaries;
- Interview collection/create/workspace;
- interview question generation, answer handling, notes, explanations, and feedback boundaries;
- Learning library/document workspace;
- grounded chat, flashcards, quizzes, and generation/resilience boundaries;
- Settings/Gemini connection management;
- selected backend route/service/job entry points for the same major capabilities;
- unusual CSS rationale such as the Resume assessment action hierarchy.

Do not annotate every helper, test, schema, CSS rule, or API call. The goal is readability, not comment volume.

## Deliverable 3 — Chat memorization cheat sheet

Provide a shorter reference in ChatGPT after the repository guide is complete.

Organize it by feature number and product area. Each entry should answer in one or two lines:

- where is it in the UI?
- what do I click?
- where is the main implementation file?

Example:

> **3.9 — AI Resume Assessment** — Resumes → open Resume → Role-aware assessment → `Run AI-assisted assessment`. Main UI: `ResumeWorkspace.tsx`; styling: `ResumeAssessmentActionUi.css`; backend: resume-analysis service/job path.

## UI coverage

### Access & Navigation

Document Register, Login, authenticated shell, sidebar/mobile navigation, Create menu, account/session area, active navigation treatment, logout, breadcrumbs, and mobile navigation behavior.

### Dashboard

Document progress overview, continuation/start actions for Resume, Interview, and Learning, plus recent activity where useful as a demonstration entry point.

### Resume Studio

Document Create Resume, Guided setup, Start blank, Import PDF, editor, live preview, Save new version, save/dirty states, design/template controls, candidate photo, print/save-as-PDF, Role-aware assessment, AI recommendation review/application, version history, historical snapshot viewing, recovery, unsaved-change protection, and destructive confirmations.

Special emphasis: **Feature 3.9** must record the scoped pale-green assessment action exactly from `ResumeAssessmentActionUi.css`:

- normal background `#eef6f1`;
- hover background `#e5f0e9`;
- disabled background `#f1f5f2`;
- normal text `#245e3c`;
- disabled text `#66756c`.

The rationale is that **Feature 3.5 Save new version remains the highest-emphasis constructive action**, while assessment stays clearly actionable but visually secondary.

### Interview Coach

Document session collection, creation, career-area/role/experience configuration, AI question generation, manual question creation, all current question types, filtering/pinning, private notes, Save attempt, saved-attempt history, Request explanation, Request feedback, session lifecycle controls, and provider-job progress/retry/cancel/resume-status states.

### Learning Workspace

Document PDF upload/processing/library, Overview, Original PDF, Extracted Content, Grounded Chat, conversation creation, question sending, source-page references, flashcard generation/study, Reveal/Hide answer, Previous/Next, quiz generation/taking/review, background-generation status/resilience, and deletion states.

### Settings / Gemini

Document connection status, fixed model display, application-managed Gemini when available, personal key, Save and test, Test connection, Replace key, Disconnect, Delete key confirmation, AI usage diagnostics, account information, and session sign-out.

## Button and state language

The guide must distinguish visual meaning rather than merely list class names:

- **primary** — green, highest-emphasis constructive action;
- **secondary** — light/neutral supporting action;
- **quiet/tertiary** — low-emphasis action;
- **destructive** — red destructive/irreversible action;
- **disabled** — muted and non-interactive;
- **busy** — state/label changes such as `Saving…`, `Creating…`, `Generating…`, `Uploading…`, `Testing…`;
- **active navigation/tab/filter** — selected treatment identifies current context;
- **status surfaces** — success/warning/error/information feedback rather than clickable actions.

Do not claim a colour change unless current CSS supports it. If the actual state change is a label, disabled state, status badge, or progress surface, describe that precisely.

## Evidence sources

Use the current repository implementation as the source of truth, especially:

- `frontend/src/routing/router.tsx`;
- `frontend/src/AppShell.tsx`;
- `frontend/src/styles.css`;
- `frontend/src/features/resumes/`;
- `frontend/src/features/interviews/`;
- `frontend/src/features/learning/`;
- `frontend/src/features/auth/`;
- backend feature route/service/job modules;
- `packages/shared-types/`;
- representative tests;
- feature-specific CSS including `ResumeAssessmentActionUi.css`.

Visible control names, route locations, UI states, code responsibility, and colour claims must be verified from current implementation files.

## Scope boundaries

- No executable behavior changes.
- No new features.
- No changes to API contracts, schemas, types, styling values, configuration, tests, database behavior, Gemini behavior, job semantics, or security behavior.
- Source/CSS edits are limited to concise professional comments only.
- Do not add `VIVA:` labels.
- Do not add comments merely to state obvious code or screen position.
- No deployment.
- No branch deletion.
- Do not reintroduce predecessor-application narrative.

## Qualification

Because comment-only source edits are now explicitly permitted, qualification must prove that source changes are comment-only.

Required checks before PR:

1. review the complete diff against `main`;
2. verify the only non-Markdown changes are comments in the selected source/CSS files;
3. verify no executable lines, values, imports, exports, types, selectors, declarations, or tests changed;
4. run `git diff --check` locally;
5. run the existing typecheck/build/tests only if the final diff review shows any possibility that a non-comment source token changed; otherwise documentation/comment-only qualification is sufficient;
6. no merge without explicit approval of the exact qualified head SHA.

## Success criteria

The task is complete when:

1. Every major user-facing capability used in the intended viva flow has a stable feature number.
2. Every major capability can be located in the UI without reading source code.
3. Each important action names the exact visible control and its screen location.
4. The same entry maps the capability to its principal frontend/backend/shared/test implementation files.
5. Button/state behavior is described accurately from current implementation and CSS.
6. Feature 3.9’s pale-green normal/hover/disabled treatment and rationale are explicitly documented.
7. Selected major source entry points contain concise professional feature-responsibility comments using the numbering system where helpful.
8. No runtime/application behavior changes.
9. The ChatGPT cheat sheet is short enough for rehearsal and uses the same feature numbers as the repository guide and comments.
