# Phase 18A Interview and Learning Legacy Comparative Audit

## 1. Audit identity

- Prompt ID: `PHASE-18A-UI-INTERVIEW-LEARNING-FOLDER-COMPARATIVE-AUDIT-01`.
- Mode: read-only source-to-source comparative audit and evidence-based roadmap.
- Audit date: 2026-07-31.
- Live repository: `/Users/prabhathmalinda/Documents/Projects/Career Learning Hub`.
- Scope: the current Interview and Learning frontends, the extracted Interview Prep Ai frontend, and the extracted AI Learning Assistant frontend.
- Goal: identify the smallest contract-safe roadmap that directly ports, adapts, or faithfully recreates only the strongest legacy frontend experiences with equal or better functionality.
- Success criteria: establish source provenance; compare implementation, contracts, tests, assets, accessibility, and responsive intent; issue one Interview verdict; bound the Learning work; draft DEC-014 and the future planning correction; and leave only this report untracked.
- Assumptions: authored frontend files include source, public assets, frontend configuration, README, and package metadata, but exclude lockfiles and every mandatory generated, dependency, environment, operating-system, and temporary path. Static source and test inspection can establish implementation intent and test coverage, but cannot establish runtime, browser, responsive, assistive-technology, or native-zoom behavior.
- Ambiguities resolved: the legacy roots contain one clear Vite frontend each; no ZIP extraction was needed. “Size” means persisted document size in the current list DTO, not the transient browser `File.size` available before upload. The documentation-only roadmap correction is assigned the audit-local phase ID `DOC-18A-IL` so the required order and next step are unambiguous.
- Skills applied: `karpathy-guidelines`, `define-goal`, React best-practice review, `frontend-design`, local accessibility review, `verification-before-completion`, and `technical-writing`. The web-design accessibility checklist's network retrieval was not used because network access was prohibited; equivalent local semantic, CSS, contract, and test inspection was used.

## 2. Source-directory provenance

| Source | Absolute path | Exact frontend root | Relevant authored frontend files | Excluded directory count | Package metadata used | Read-only result |
| --- | --- | --- | ---: | ---: | --- | --- |
| Live repository | `/Users/prabhathmalinda/Documents/Projects/Career Learning Hub` | `/Users/prabhathmalinda/Documents/Projects/Career Learning Hub/frontend` | Interview feature: 16; Learning feature: 43 | Not used as a legacy count | `@career-learning-hub/web`; React 19.1; React Router 7.18; TypeScript 5.8; Vite 6.3; no Markdown, Tailwind, Framer Motion, or icon package | Read-only except this report |
| Interview Prep Ai | `/Users/prabhathmalinda/Documents/Projects/Career Learning Hub Legacy References/Interview Prep Ai` | `/Users/prabhathmalinda/Documents/Projects/Career Learning Hub Legacy References/Interview Prep Ai/frontend/interview-prep-ai` | 38 total; 31 under `src/` | 0 discovered in the frontend root | `interview-prep-ai` 0.0.0; React 19.1; Vite 6.3; React Router 7.5; Tailwind 4.1; Axios; Framer Motion; Moment; React Hot Toast; React Icons; React Markdown; syntax highlighter; Remark GFM | Exists outside live repository; inspected read-only |
| AI Learning Assistant | `/Users/prabhathmalinda/Documents/Projects/Career Learning Hub Legacy References/AI Learning Assistant` | `/Users/prabhathmalinda/Documents/Projects/Career Learning Hub Legacy References/AI Learning Assistant/frontend/ai-learning-assistant` | 50 total; 43 under `src/` | 0 discovered in the frontend root | `ai-learning-assistant` 0.0.0; React 19.2; Vite 7.2; React Router 7.9; Tailwind 4.1; Axios; Lucide React; Moment; React Hot Toast; React Markdown; syntax highlighter; Remark GFM | Exists outside live repository; inspected read-only |

The authored counts exclude `package-lock.json`, `.env`, `.DS_Store`, AppleDouble files, operating-system metadata, temporary files, and generated/dependency directories. Searches also excluded `.git/`, `node_modules/`, `dist/`, `build/`, `coverage/`, `.cache/`, `.vite/`, `.next/`, `playwright-report/`, and `test-results/`. Neither legacy frontend root contained a matching excluded directory. Backend directory names were recognized as out of scope; backend implementation was not inspected.

## 3. Safety boundaries

- Current React/TypeScript structure, APIs, DTOs, routes, authentication, ownership, private storage, request IDs, cancellation, stale-response protection, pagination, immutable records, and answer secrecy are authoritative.
- Legacy authentication, `localStorage` tokens, AuthContext behavior, API clients, backend/database code, provider configuration, environment data, old branding, fake data, unsupported statistics or progress, remote fonts, and newly matching-only dependencies are excluded.
- Unsafe raw HTML, unsanitized Markdown, arbitrary external links/images, automatic AI actions, motion-only or pointer-only controls, unsupported deletion, global libraries, and hidden contract expansion are rejected.
- No browser, service, network, dependency installation, app run, test, build, implementation, copy, staging, commit, push, merge, deployment, DNS, cloud, provider, secret, or legacy write is authorized by this audit.
- No `.env` file or value, credential, token value, database string, user data, or uploaded-document content was inspected or quoted.
- Actual native Chrome 200% remains a later implementation acceptance gate; this report makes no native-zoom pass claim.

## 4. Live repository baseline

Pre-flight passed before the report was created:

- Repository path: `/Users/prabhathmalinda/Documents/Projects/Career Learning Hub`.
- Branch: `phase-18-staging-deployment`.
- Full HEAD: `c752ecc7c71dc6b16e416c329ea15d6d429d1438`.
- HEAD subject: `Port legacy interview visuals`.
- `git status --short --untracked-files=all`: empty.
- `git diff --cached --name-status`: empty.
- Active Git operation: none; no merge, rebase, cherry-pick, revert, bisect, or sequencer marker was present.
- `CURRENT_PHASE.md`: UI-I1 completed/human-approved; UI-QA planned/inactive; Phase 18B planned/inactive; Phase 19 planned/inactive.

The current frontend roots inspected were `frontend/src/features/interviews`, `frontend/src/features/learning`, `frontend/src/routing`, `frontend/src/components`, `frontend/src/AppShell.tsx`, `frontend/src/styles.css`, related component/API/contract/polling tests, and `tests/browser/specs` plus the relevant browser fixture helpers.

## 5. Controlling policy and documentation discrepancy

The controlling product policy is sound: reuse the strongest presentational work, then adapt it to current contracts, security, branding, responsiveness, and accessibility with equal or better functionality. Similarity alone is not a reason to implement.

`DEC-013` currently names only Resume Builder and AI Resume Analyser. It does not explicitly authorize Interview Prep Ai or AI Learning Assistant. The discrepancy should be resolved append-only; `DEC-013` itself must remain unchanged.

Exact proposed decision text:

```markdown
## DEC-014: Extend direct legacy frontend port and adaptation policy

- Decision ID: `DEC-014`
- Date: <acceptance date>
- Status: ACCEPTED
- Decision:
  - Interview Prep Ai and AI Learning Assistant are added as approved component
    and visual sources for Career Learning Hub under the direct legacy frontend
    port and adaptation policy established by DEC-013.
  - Relevant presentational code, layouts, CSS, microinteractions, animations,
    visual hierarchy, and suitable assets may be directly ported, adapted, or
    faithfully recreated only after a source-to-source audit of the specific
    legacy application.
  - Each legacy application requires its own source-to-source audit before its
    Career Learning Hub coverage can be declared complete.
  - The current Career Learning Hub React and TypeScript architecture, APIs,
    DTOs, authentication, ownership controls, private storage, routes,
    branding, accessibility, responsive behavior, native 200% capability, and
    real functionality remain authoritative.
  - All DEC-013 exclusions remain binding. In particular, no legacy
    authentication, backend or database model, API client, secret or
    environment file, provider configuration, old branding, fake testimonial,
    fake activity or statistic, unsupported ATS or employment guarantee, or
    automatic application of AI changes may be copied.
  - The extension also excludes unsupported global libraries or routes,
    fabricated scores or progress, unsafe raw HTML, unsanitized Markdown,
    arbitrary external links, inaccessible interaction, and contract expansion
    hidden inside a visual-port phase.
- Rationale:
  - Interview Prep Ai and AI Learning Assistant contain useful presentational
    patterns, but their legacy data, security, accessibility, and application
    boundaries are not authoritative.
  - Mandatory source-to-source audits prevent visual reuse from silently
    introducing unsupported behavior and allow an application to be declared
    complete when the current implementation is already equal or better.
- Consequences:
  - The Phase 18A Interview and Learning Legacy Comparative Audit is the first
    audit governed by this extension.
  - Interview Prep Ai requires no additional implementation when the accepted
    audit verdict is `A. COMPLETE — NO ADDITIONAL INTERVIEW IMPLEMENTATION
    REQUIRED`.
  - AI Learning Assistant work remains separately phased, test-first,
    human-reviewed, and inactive until explicitly authorized.
  - Integrated UI-QA remains after all approved legacy-port work.
- Revisit conditions:
  - A separately accepted decision replaces DEC-013 or DEC-014.
  - Current architecture, contract, security, accessibility, accuracy, or
    product requirements make a specific legacy pattern unsuitable.
```

Proposal status: drafted here only; not applied to `DECISION_LOG.md` and not accepted by this audit.

## 6. Interview Prep Ai inventory

The exact frontend root contains a Vite React JavaScript application. Relevant authored presentation and workflow sources inspected include:

- Session discovery and creation: `pages/Home/Dashboard.jsx`, `components/Cards/SummaryCard.jsx`, `pages/Home/CreateSessionForm.jsx`.
- Practice workspace: `pages/InterviewPrep/InterviewPrep.jsx`, `components/Cards/QuestionCard.jsx`, `pages/InterviewPrep/components/RoleInfoHeader.jsx`, and `pages/InterviewPrep/components/AIResponsePreview.jsx`.
- State and overlays: `components/Loader/SkeletonLoader.jsx`, `components/Loader/SpinnerLoader.jsx`, `components/Drawer.jsx`, `components/Modal.jsx`, and `components/DeleteAlertContent.jsx`.
- Supporting presentation: `pages/LandingPage.jsx`, `utils/data.js`, layout/profile/input/auth pages and components, `App.jsx`, `main.jsx`, and `index.css`.
- Boundary evidence: frontend API path/client/helper/upload modules and `package.json`; these were inspected only to identify unsupported coupling and were not treated as port candidates.

Strong qualities are the role-first session cards, dense session context, question-card hierarchy, expandable response surface, model-answer/explanation presentation, code-copy affordance, and recognizable loading geometry. Material weaknesses include a client-orchestrated “generate then create” flow, local-storage authentication, legacy API coupling, hover-only delete/actions, click-only non-semantic cards, inaccessible modal/drawer behavior, continuously animated decoration, malformed React `class` attributes in loaders, console logging, an apparent undefined `setError` path, and Markdown that permits arbitrary links/images without a proven sanitizer.

## 7. Current Interview inventory

The 16-file current Interview feature and all related current tests/routes/shared controls were inspected.

- `InterviewSessionListPage.tsx`, `InterviewSessionCard.tsx`, and `InterviewSessionSkeleton.tsx` provide role-first discovery, creation with current fields, server pagination/filtering, loading/empty/error/success states, cancellation, sequence-based stale protection, safe request-ID errors, explicit links, and geometry-matched skeletons.
- `InterviewSessionWorkspace.tsx` provides session context, status, question index, manual and explicit AI generation, pinning, notes, model answers, explanations, exact-text copy, immutable attempts, feedback, attempt history, provider polling, route isolation, cancellation, and stale-operation protection.
- `CopyInterviewTextButton.tsx` exposes the action and status accessibly and cleans up its timer.
- `interviewApi.ts`, `interviewContracts.ts`, `interviewPolling.ts`, and `types.ts` preserve exact routes, allowed keys, ownership identities, canonical request IDs, provider-neutral errors, polling boundaries, and current DTOs.
- `interviewCoach.css` includes desktop/tablet/mobile layout intent, long-text containment, visible focus, and reduced-motion overrides.
- Routes are `/interviews` and `/interviews/:sessionId` inside the authenticated AppShell.
- Shared `PageHeader`, `Pager`, `StateSurface`, `Breadcrumbs`, and native `Dialog` controls provide platform consistency; the Dialog includes labelling, focus containment, Escape cancellation, optional backdrop dismissal, initial focus, and focus return.
- Interview API, contract, polling, list, workspace, routing, shared-control, and browser source tests cover exact route/body behavior, ownership, contract allowlists, job and response handling, cancellation, stale work, request IDs, states, copy, notes/pinning, immutable attempts, and quiz-like answer secrecy boundaries where applicable. These tests were inspected, not run.

## 8. Interview source-to-destination matrix

| Legacy application | Legacy source file | Component or experience | Strong qualities | Weaknesses or risks | Current destination/equivalent | Contract support | Classification | Exact recommendation | Required tests | Required browser evidence | Phase |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Interview Prep Ai | `pages/Home/Dashboard.jsx`; `components/Cards/SummaryCard.jsx` | Session library and role cards | Role initials, role/topics, experience, Q&A count, updated context | Clickable `div`; hover-only delete; legacy description/data shape | `InterviewSessionListPage.tsx`; `InterviewSessionCard.tsx` | Current title, target role, mode, experience, counts, status, timestamps | CURRENT ALREADY EQUAL OR BETTER | Keep the current explicit-link card and server states | Preserve list/card, pagination, focus, long-text, cancellation tests | Reconfirm list states, keyboard path, long strings, responsive cards, 200% in UI-QA | None |
| Interview Prep Ai | `pages/Home/CreateSessionForm.jsx` | Session creation | Compact role/experience/topics/description form | Unsupported client generation-before-create orchestration | `InterviewSessionListPage.tsx` | Current create DTO and explicit later generation | CURRENT ALREADY EQUAL OR BETTER | Keep current validated creation and explicit AI action | Preserve body allowlist, validation focus, abort/stale tests | Reconfirm validation, submission, errors, and create deep link in UI-QA | None |
| Interview Prep Ai | `pages/InterviewPrep/components/RoleInfoHeader.jsx` | Role and session context header | Dense role, topics, experience, count, updated hierarchy | Continuous decorative animation; legacy field assumptions | `InterviewSessionWorkspace.tsx` | Supported with current session DTO | CURRENT ALREADY EQUAL OR BETTER | Keep current branded brief and status context | Preserve session rendering and long-content tests | Reconfirm workspace header at all viewports and 200% | None |
| Interview Prep Ai | `pages/InterviewPrep/InterviewPrep.jsx` | Question navigation and load-more flow | Clear ordered practice flow | Undefined error setter path; no cancellation/stale guard; logs errors | `InterviewSessionWorkspace.tsx` | Current server pagination, question ordering, jobs | CURRENT ALREADY EQUAL OR BETTER | Preserve current question index, polling, canonical reload, and isolation | Preserve pagination, route change, abort, stale job tests | Reconfirm loading/error/retry/pagination and route changes | None |
| Interview Prep Ai | `components/Cards/QuestionCard.jsx` | Expandable prompt and actions | Strong prompt/answer separation and compact actions | Pointer/hover-biased actions; non-semantic clickable heading/container | `InterviewSessionWorkspace.tsx` | Questions, pinning, notes, model answers, explanations supported | CURRENT ALREADY EQUAL OR BETTER | Keep explicit semantic controls and existing response hierarchy | Preserve pin, notes, manual question, answer/explanation tests | Reconfirm keyboard, focus, reveal/action states, long text | None |
| Interview Prep Ai | `pages/InterviewPrep/components/AIResponsePreview.jsx` | Model answer, explanation, code-copy surface | Readable response hierarchy and copy affordance | Unsanitized Markdown surface, arbitrary links/images, extra dependencies | Workspace answer/explanation panels; `CopyInterviewTextButton.tsx` | Plain text and exact copy supported | CURRENT ALREADY EQUAL OR BETTER | Retain plain-text safety and current copy behavior | Preserve exact visible-text copy, success/failure, timer cleanup tests | Reconfirm copy status and long preformatted text | None |
| Interview Prep Ai | `components/Loader/SkeletonLoader.jsx`; `components/Loader/SpinnerLoader.jsx` | Loading feedback | Recognizable skeleton/spinner | `class` instead of `className`; motion not reduced | `InterviewSessionSkeleton.tsx`; `StateSurface` | Supported | CURRENT ALREADY EQUAL OR BETTER | Keep current semantic skeleton and status states | Preserve accessible loading-label and list state tests | Reconfirm reduced motion and skeleton geometry | None |
| Interview Prep Ai | `components/Drawer.jsx`; `components/Modal.jsx` | Explanation drawer and modal | Focused secondary surface | Missing dialog semantics, focus trap, Escape, and focus return | Inline workspace panels; shared `Dialog` | Supported where a dialog is needed | CURRENT ALREADY EQUAL OR BETTER | Do not replace current inline flow or shared Dialog | Preserve Dialog accessibility tests and workspace action tests | Reconfirm focus containment/return only where a dialog is used | None |
| Interview Prep Ai | `components/DeleteAlertContent.jsx` | Session deletion confirmation | Clear destructive wording | No current Interview deletion contract; weaker overlay accessibility | No Interview equivalent | Not supported | REJECTED | Do not invent session deletion | Contract test must continue to reject unsupported routes if touched | No browser scenario | None |
| Interview Prep Ai | `pages/LandingPage.jsx`; layout/auth/profile sources | Marketing, shell, auth, profile | Some visual storytelling | Old brand, fake/marketing content, local-storage tokens, duplicate shell/auth | Current AppShell, authentication, Dashboard, Settings | Current platform is authoritative | REJECTED | Do not duplicate or port | Preserve auth/AppShell/router tests | Reconfirm shared shell during integrated UI-QA | None |
| Interview Prep Ai | `index.css` | Typography, animation, responsive styling | Cohesive visual rhythm | Remote font; global Tailwind; broad continuous animation | `interviewCoach.css`; `styles.css` | Current CSS architecture supported | CURRENT ALREADY EQUAL OR BETTER | Keep current scoped CSS, focus, wrapping, and reduced motion | Preserve class/state tests; CSS inspected statically | Reconfirm viewports, native 200%, focus, reduced motion | None |
| Interview Prep Ai | `utils/data.js` | Static navigation/features | Convenient labels | Legacy routes, feature claims, and static marketing data | Current router/AppShell | Current routes already represented | REJECTED | Do not copy legacy route/data tables | Preserve router and navigation tests | Reconfirm authenticated navigation | None |

## 9. Interview completion verdict

**A. COMPLETE — NO ADDITIONAL INTERVIEW IMPLEMENTATION REQUIRED**

UI-I1 already ports, adapts, or faithfully recreates the strongest contract-compatible legacy experiences: role-first session discovery, dense session context, question-card hierarchy, model answer and explanation presentation, exact-text copy, and loading geometry. The current implementation is materially stronger in creation truthfulness, explicit AI actions, accessible controls, loading/error/empty states, route isolation, cancellation, stale-response protection, request-ID handling, polling, immutable attempts, and shared-shell/dialog behavior.

No strong supported legacy experience is materially missing. The remaining differences are unsupported deletion, obsolete marketing/shell/auth, unsafe Markdown, inaccessible hover/click/motion patterns, or weaker client orchestration. None justifies implementation for visual similarity alone. UI-IP2 must not be created or activated.

## 10. AI Learning Assistant inventory

The exact Vite React frontend root was inspected across all authored sources that materially affect presentation or workflow:

- Documents/workspace: `pages/Documents/DocumentListPage.jsx`, `components/documents/DocumentCard.jsx`, `pages/Documents/DocumentDetailPage.jsx`, `components/ai/AIActions.jsx`, and common Tabs, EmptyState, Spinner, Modal, PageHeader, MarkdownRenderer, and Button components.
- Conversations: `components/chat/ChatInterface.jsx`.
- Flashcards: `pages/Flashcards/FlashcardsListPage.jsx`, `pages/Flashcards/FlashcardPage.jsx`, `components/flashcards/FlashcardSetCard.jsx`, `components/flashcards/Flashcard.jsx`, and `components/flashcards/FlashcardManager.jsx`.
- Quizzes: `components/quizzes/QuizCard.jsx`, `components/quizzes/QuizManager.jsx`, `pages/Quizzes/QuizTakePage.jsx`, and `pages/Quizzes/QuizResultPage.jsx`.
- Supporting presentation: `pages/Dashboard/DashboardPage.jsx`, `components/layout/AppLayout.jsx`, `components/layout/Header.jsx`, `components/layout/Sidebar.jsx`, app/main/CSS, auth/profile components, frontend service/client/path/helper files, and package metadata.

The strongest legacy qualities are the document-library card composition, upload-file feedback, document workspace identity, rich user/assistant message hierarchy, flashcard set/card framing, one-question quiz focus with progress/navigation, and score/review hierarchy. The current implementation should faithfully recreate or adapt those qualities without copying legacy data assumptions, application shell, state management, security boundaries, or dependencies.

Material legacy weaknesses are local-storage authentication, a static API base, direct raw file-path iframe use, unsanitized Markdown and arbitrary links, missing cancellation and stale protection, weak dialog/tab/card semantics, optimistic fabricated error messages, fake fallback profile data, unsupported global flashcard/quiz libraries, and unsupported delete/star/review/progress/statistics behavior.

## 11. Current Learning inventory

The 43-file current Learning feature, all related tests, current routes, shared controls, and browser fixture/specification sources were inspected.

- `LearningDashboard.tsx` provides private PDF upload, MIME/extension/15 MB validation, focusable error summary, request cancellation, sequence-based stale protection, upload/processing status, pause/resume polling behavior, status filtering, server pagination, and loading/empty/error/success states. Its functional coverage is strong; its upload/file feedback and library rows are visually less expressive than the legacy composition.
- `LearningDocumentWorkspace.tsx` securely obtains a signed PDF target, fetches it without credentials and with no referrer, validates content type/size, uses a revocable object URL, handles expiry, shows extracted chunks/pages, renders accessible keyboard-operable tabs, summary/key points, statuses, and deletion. It is functionally stronger but can adopt clearer legacy workspace hierarchy.
- `DocumentConversations.tsx` and `LearningConversationWorkspace.tsx` provide document-scoped collection/creation, server pagination, grounded message history, roles, source-page citations, explicit UUID-based send, ambiguous-submit reconciliation, provider polling, pause/failure/retry handling, canonical reload, cancellation, and stale-response protection. Visual message hierarchy and composer states can be stronger.
- `DocumentFlashcards.tsx`, `LearningFlashcardWorkspace.tsx`, and `FlashcardStudy.tsx` provide document-scoped generation, jobs, canonical completion, server pagination, explicit accessible reveal/hide, source pages, and bounded navigation. Set/card presentation can adopt the legacy visual structure while preserving the explicit reveal.
- `DocumentQuizzes.tsx`, `LearningQuizWorkspace.tsx`, `QuizTaker.tsx`, and `LearningQuizAttemptWorkspace.tsx` provide document-scoped generation, answer-key secrecy before submission, complete-answer validation, immutable attempts, uncertain-submit reconciliation, server scoring, attempt history, correct/selected choices, explanations, citations, and timestamps. One-question focus/progress and result hierarchy can adopt the legacy presentation.
- `LearningDocumentDeletion.tsx` uses exact-title confirmation and accessible native-dialog behavior, then polls/reconciles the server deletion job. It is current-equal-or-better.
- API, contract, deletion, quiz, and polling modules validate exact keys, ownership identities, ordering, source-page bounds, chronology, answer secrecy, jobs, and canonical request IDs.
- `learningWorkspace.css` contains responsive breakpoints at 900, 700, and 390 CSS pixels, long-text containment, visible-focus rules, and reduced-motion overrides.
- Current routes are `/learning`, `/learning/documents/:documentId`, document-scoped conversation, flashcard-set, quiz, and quiz-attempt routes. No global flashcard or quiz library route exists.
- Browser source evidence covers private PDF upload/validation/viewer, grounded chat, explicit flashcard reveal, quiz secrecy/submission, and result review. Tests were inspected, not run.

## 12. Learning source-to-destination matrix

| Legacy application | Legacy source file | Component or experience | Strong qualities | Weaknesses or risks | Current destination/equivalent | Contract support | Classification | Exact recommendation | Required tests | Required browser evidence | Phase |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AI Learning Assistant | `pages/Documents/DocumentListPage.jsx` | Learning page identity and document library | Strong page framing, dotted surface, responsive card grid, polished empty state | Legacy queries and whole-card interactions | `LearningDashboard.tsx` | Supported | FAITHFUL RECREATION | Recreate the visual hierarchy and responsive dossier-card grid around current states and controls | Update dashboard state, pagination, focus, cancellation, long-text tests first | Loading, empty, error/retry, filtered/paged, long-title, all viewports, 200% | UI-LA1 |
| AI Learning Assistant | `components/documents/DocumentCard.jsx` | Document card | Gradient document mark, metadata grouping, clear recency | File size and flashcard/quiz totals absent from current list DTO; hover-only delete; clickable `div` | Dashboard document rows | Title, filename, MIME, status, pages, chunks, timestamps supported; size/totals unsupported | PORT WITH CONTRACT ADAPTATION | Port composition using only current fields and explicit links/actions; never fabricate size or totals | Card semantics, supported metadata, no unsupported labels, keyboard tests | Cards with each status, missing optional data, long filename, focus | UI-LA1 |
| AI Learning Assistant | `pages/Documents/DocumentListPage.jsx` | Upload/file-selection surface | Clear dashed selection area and selected-file feedback | Legacy drag/drop implication and upload assumptions | `LearningDashboard.tsx` upload form | Native file selection and upload state supported; byte progress not supported | FAITHFUL RECREATION | Style the native input as an accessible selection surface; show selected filename; say “Uploading…” only, with no fake percent or unsupported drag claim | File validation, selection, keyboard, error-focus, cancellation tests | Valid/invalid file, selected filename, uploading, failure/retry, keyboard | UI-LA1 |
| AI Learning Assistant | `pages/Documents/DocumentDetailPage.jsx`; common `Tabs.jsx` | Workspace header and tabs | Strong context header and visually selected navigation | Raw file path; tabs lack full ARIA keyboard behavior | `LearningDocumentWorkspace.tsx` | Supported | PORT WITH CONTRACT ADAPTATION | Recreate hierarchy while retaining current `tablist`, arrows, Home/End, URLs, and statuses | Preserve tab semantics/keyboard, fetch/expiry, state tests | Keyboard tabs; loading/ready/failed/deleting/unavailable; all viewports | UI-LA1 |
| AI Learning Assistant | `pages/Documents/DocumentDetailPage.jsx` | Original PDF viewer | Prominent embedded-document workspace | Direct legacy `filePath` iframe and environment fallback are unsafe | Signed-target blob viewer in workspace | Current already stronger | CURRENT ALREADY EQUAL OR BETTER | Keep signed-target fetch, validation, revocation, expiry, no-referrer behavior; only refine surrounding layout | Preserve signed URL/blob/content-type/expiry tests | Valid PDF, expired/reload, invalid target, viewer reflow | UI-LA1 |
| AI Learning Assistant | `pages/Documents/DocumentDetailPage.jsx` | Extracted content | Readable content section | Legacy provenance/security weaker | Current chunk reader | Chunks, page ranges, word counts supported | PORT WITH CONTRACT ADAPTATION | Improve reader hierarchy without changing server order or text handling | Preserve pagination, ordering, page range, long-text tests | Multi-page, empty, error, long unbroken text, citations | UI-LA1 |
| AI Learning Assistant | `components/ai/AIActions.jsx` | Summary/key points | Polished action/result card | Legacy automatic concept action unsupported; Markdown unsafe | Workspace Overview | Stored summary/key points supported; concept explain not supported | PORT WITH CONTRACT ADAPTATION | Recreate result-card hierarchy for stored summary/key points only; do not add concept generation | Overview, optional summary/key points, plain-text tests | Ready with/without summary, long points, processing/failure | UI-LA1 |
| AI Learning Assistant | `components/chat/ChatInterface.jsx` | User/assistant message history and composer | Strong role distinction, empty/loading visuals, readable composer | Fabricated optimistic/error messages; no citations UI; no cancellation/stale guard; Markdown risk | `LearningConversationWorkspace.tsx` | Roles, text, citations, send/job states supported | FAITHFUL RECREATION | Recreate visual bubble/composer hierarchy around current canonical state machine and plain text | Message roles, UUID reuse, ambiguity, polling, citation, abort/stale, focus tests | Empty/history/sending/ambiguous/paused/failure/retry/citations/long text | UI-LA1 |
| AI Learning Assistant | No equivalent collection view | Conversation collection | Legacy offers direct chat entry | No multi-conversation collection model in UI | `DocumentConversations.tsx` | Current collection/title/count/timestamps supported | CURRENT ALREADY EQUAL OR BETTER | Strengthen current collection cards using platform data; do not collapse to one chat | Creation, pagination, empty/error, cancellation tests | Empty/paged/create/failure/long-title states | UI-LA1 |
| AI Learning Assistant | common PageHeader/EmptyState/Spinner/Modal | Shared page and state grammar | Cohesive presentation | Modal lacks full focus behavior; spinner motion; duplicate primitives | Shared components and Learning state surfaces | Supported | PORT WITH CONTRACT ADAPTATION | Reuse shared controls and adapt only scoped Learning styling | Preserve shared-control and Learning state tests | Focus, Escape/return where dialog applies, reduced motion | UI-LA1 / UI-LA2 |
| AI Learning Assistant | common `MarkdownRenderer.jsx` | Rich Markdown/code presentation | Structured prose and code highlighting | No proven sanitizer; arbitrary links/images; extra dependencies | Current plain-text rendering | Not safely supported | DEFERRED | Preserve plain text. Rich Markdown requires a separate security/contract/dependency decision and proof | Plain-text escaping tests; future sanitizer tests only in separate phase | No browser evidence in these phases | None |
| AI Learning Assistant | `pages/Flashcards/FlashcardsListPage.jsx`; `components/flashcards/FlashcardSetCard.jsx` | Global set library and progress cards | Strong visual set-card composition | Global route, progress, reviewed count, stars, delete unsupported | `DocumentFlashcards.tsx` document-scoped collection | Set title/status/card count/timestamps supported; global library/progress unsupported | PORT WITH CONTRACT ADAPTATION | Port card composition into document-scoped collection using supported fields only | Generation, jobs, paging, card metadata, absence of fake progress tests | Empty/generating/ready/failed/paged/long-title cards | UI-LA2 |
| AI Learning Assistant | `components/flashcards/FlashcardManager.jsx` | Set generation and study entry | Clear generation-to-study flow | Legacy review/delete/star APIs unsupported | Document flashcards and flashcard workspace | Supported with current job model | PORT WITH CONTRACT ADAPTATION | Retain explicit generation, canonical completion, and links; refine hierarchy only | Job polling, canonical reload, error/retry, focus tests | Generation success/failure/paused/retry and entry | UI-LA2 |
| AI Learning Assistant | `components/flashcards/Flashcard.jsx`; `pages/Flashcards/FlashcardPage.jsx` | Front/back study card | Memorable card framing and question/answer hierarchy | Whole-card pointer flip; motion dependence; no explicit accessible state | `FlashcardStudy.tsx` | Front/back and source pages supported; difficulty unsupported | FAITHFUL RECREATION | Recreate front/back styling but keep explicit Reveal/Hide button, visible state text, keyboard activation, sources, and reduced motion | Reveal secrecy, keyboard control, state reset, navigation boundaries, source tests | Before/after reveal, keyboard, first/middle/last, long text, reduced motion, 200% | UI-LA2 |
| AI Learning Assistant | flashcard progress/star/review/delete controls | Study progress and management | Motivating visual indicators | No current review, difficulty, favorite, or delete contracts | None | Not supported | REJECTED | Show only positional progress derived from current card index/count; no persisted progress, stars, difficulty, or deletion | Tests must assert supported labels and no fabricated state | No unsupported scenario | None |
| AI Learning Assistant | `components/quizzes/QuizCard.jsx`; `components/quizzes/QuizManager.jsx` | Quiz collection and generation cards | Strong quiz-card identity and action hierarchy | Legacy delete/stat assumptions | `DocumentQuizzes.tsx` | Title/status/question count/timestamps supported; delete unsupported | PORT WITH CONTRACT ADAPTATION | Port card composition into document-scoped collection with current job/status fields | Generation, job, paging, supported metadata, no delete tests | Empty/generating/ready/failed/paged/long-title cards | UI-LA2 |
| AI Learning Assistant | `pages/Quizzes/QuizTakePage.jsx` | One-question quiz focus, progress, navigation, selected choice | Low cognitive load, clear progress, strong choice states | Legacy submission state is weaker; must not expose answers | `QuizTaker.tsx` | Questions, choices, sources and in-memory selections supported | FAITHFUL RECREATION | Recreate one-question focus and navigable progress while preserving complete-answer validation and answer secrecy | Navigation, retained selections, keyboard radios, completeness, no-key-before-submit, submit-once tests | Unanswered/answered navigation, selected states, keyboard, submit disabled/enabled, ambiguous submit | UI-LA2 |
| AI Learning Assistant | `pages/Quizzes/QuizResultPage.jsx` | Score and per-question review | Strong score summary and correct/incorrect hierarchy | Legacy authority and immutability weaker; “unanswered” conflicts with current complete-answer rule | `LearningQuizAttemptWorkspace.tsx` | Score, correct/selected answers, explanation, sources, timestamps supported | PORT WITH CONTRACT ADAPTATION | Port result hierarchy using the immutable server attempt; do not fabricate unanswered results | Score, selected/correct, explanation, sources, chronology, immutable attempt tests | Perfect/mixed scores, review details, long explanations, citations, 200% | UI-LA2 |
| AI Learning Assistant | `pages/Dashboard/DashboardPage.jsx` | Learning dashboard metrics/activity | Attractive overview composition | Unsupported stats, activity, schedules, progress, and duplicate dashboard | Current unified Dashboard | Current platform is stronger | REJECTED | Do not add a second dashboard or fabricated metrics | Preserve unified Dashboard contracts/tests | Integrated UI-QA only | None |
| AI Learning Assistant | `components/layout/AppLayout.jsx`; `Header.jsx`; `Sidebar.jsx` | Shell/navigation/profile | Familiar sidebar layout | Duplicate routes, old brand, fake fallback profile/notifications | Current `AppShell.tsx`, mobile Dialog nav, auth, Settings | Current platform is stronger | CURRENT ALREADY EQUAL OR BETTER | Keep current shell, branding, skip link, responsive nav, auth-derived identity | Preserve AppShell/router/auth/Dialog tests | Integrated desktop/mobile/keyboard/200% shell review | None |
| AI Learning Assistant | `index.css` | Typography, gradients, responsive styling | Cohesive card and workspace polish | Remote font, global Tailwind, dependency-coupled utilities | `learningWorkspace.css`; `styles.css` | Scoped CSS supported | PORT WITH CONTRACT ADAPTATION | Recreate selected visual treatments in scoped CSS with current tokens and no new dependency | Focus/state tests plus static CSS review | All target viewports, focus, reduced motion, long text, 200% | UI-LA1 / UI-LA2 |

Separate disposition of every required Learning audit domain:

| # | Domain | Source finding | Disposition |
| ---: | --- | --- | --- |
| 1 | Learning page identity | Legacy page framing is materially richer; current route/shell identity is authoritative | Faithfully recreate within UI-LA1 |
| 2 | Document-library composition | Legacy card grid is clearer than current rows | Port with supported-field adaptation in UI-LA1 |
| 3 | Private PDF upload and file selection | Current upload is private and validated; legacy selection feedback is visually stronger | Keep current pipeline; recreate selection surface in UI-LA1 |
| 4 | Upload validation, progress, failure, retry | Current validation/failure/retry state machine is stronger; no byte-progress contract exists | Preserve behavior; style states only; no fabricated percentage |
| 5 | Document cards | Legacy composition is stronger; several legacy fields are unsupported | Adapt in UI-LA1 with explicit semantic links/actions |
| 6 | Document status and processing states | Current has truthful uploaded/processing/ready/failed/deleting states | Current equal/better; improve hierarchy in UI-LA1 |
| 7 | Document metadata | Current supports filename, MIME, pages, chunks, and timestamps, not persisted size or set totals | Show supported fields only in UI-LA1 |
| 8 | Deletion and confirmation | Current exact-title native dialog and job reconciliation are stronger | Current equal/better; visual consistency only in UI-LA1 |
| 9 | Workspace header and context | Legacy header hierarchy is stronger; current context/status is more truthful | Port with adaptation in UI-LA1 |
| 10 | Workspace navigation or tabs | Current ARIA/keyboard tabs are stronger; legacy styling is stronger | Preserve behavior and adapt visuals in UI-LA1 |
| 11 | Original PDF viewing | Current signed-target blob pipeline is materially safer | Current equal/better; surrounding layout only |
| 12 | Extracted-content viewing | Current ordered page-aware chunks are stronger; reader can be clearer | Adapt reader presentation in UI-LA1 |
| 13 | Summary and key points | Current stored summary/key points are supported; legacy result cards are richer | Adapt result hierarchy in UI-LA1; reject concept action |
| 14 | Processing, failed, deleting, unavailable states | Current exposes all named canonical states | Current equal/better; retain and style in UI-LA1 |
| 15 | Conversation collection | Current supports multiple paged conversations; legacy has a direct chat surface | Current equal/better; strengthen collection cards in UI-LA1 |
| 16 | Conversation creation | Current explicit creation, validation, cancellation, and pagination are stronger | Preserve behavior; visual refinement in UI-LA1 |
| 17 | Grounded message history | Current server history and canonical reload are stronger | Preserve and visually recreate in UI-LA1 |
| 18 | User-versus-assistant hierarchy | Legacy role distinction is materially clearer | Faithfully recreate in UI-LA1 |
| 19 | Page citations and navigation | Current source pages are supported and interactive; legacy chat does not present them well | Current equal/better; integrate visibly in UI-LA1 |
| 20 | Question composer and sending state | Legacy composer styling is stronger; current sending state is safer | Recreate presentation around current state machine in UI-LA1 |
| 21 | Ambiguous submission, polling, paused, failure, retry | Current UUID reuse, polling, pause, reconciliation, and retry are materially stronger | Preserve exactly; expose clear visuals in UI-LA1 |
| 22 | Flashcard-set generation and collection | Legacy presentation is stronger; current document-scoped job flow is safer | Port with adaptation in UI-LA2 |
| 23 | Flashcard-set cards | Legacy cards are stronger but include unsupported progress/actions | Port supported title/status/count/time only in UI-LA2 |
| 24 | Flashcard study | Legacy card framing is stronger; current study controls are more accessible | Faithfully recreate framing in UI-LA2 |
| 25 | Question and answer hierarchy | Legacy front/back visual separation is stronger | Recreate without changing current front/back text handling in UI-LA2 |
| 26 | Explicit accessible answer reveal | Current Reveal/Hide control is materially stronger than pointer flip | Current equal/better; preserve in UI-LA2 |
| 27 | Study progress and navigation | Positional index/count and previous/next are supported; persisted review progress is not | Refine positional progress only in UI-LA2 |
| 28 | Difficulty and source pages | Source pages supported; difficulty absent | Show sources; do not fabricate difficulty |
| 29 | Quiz generation and collection | Legacy cards are stronger; current document-scoped jobs are safer | Port with adaptation in UI-LA2 |
| 30 | Quiz-set cards | Title/status/question count/time supported; delete/stat extras unsupported | Adapt supported composition in UI-LA2 |
| 31 | Quiz-taking hierarchy | Legacy one-question focus is materially clearer | Faithfully recreate in UI-LA2 |
| 32 | Question progress and navigation | Current in-memory selections can support non-contractual presentational navigation | Add accessible one-question navigation in UI-LA2 |
| 33 | Selected-answer states | Current radio selections support clear visual states | Strengthen styling without changing semantics in UI-LA2 |
| 34 | Submission and confirmation | Current explicit completeness-gated submission is supported; neither source proves a necessary confirmation improvement | Preserve submission; defer any new confirmation outside legacy-port scope |
| 35 | Immutable attempt history | Current server-owned attempts and reconciliation are materially stronger | Current equal/better; refine cards in UI-LA2 |
| 36 | Score and result summary | Legacy visual hierarchy is stronger; current score is server authoritative | Port hierarchy in UI-LA2 |
| 37 | Correct, incorrect, unanswered review | Correct/incorrect supported after submission; unanswered conflicts with complete-answer validation | Port correct/incorrect; do not fabricate unanswered |
| 38 | Explanations | Current post-submission explanations are supported | Strengthen hierarchy in UI-LA2 |
| 39 | Source-page references | Current taking/review citations are supported and grounded | Current equal/better; integrate visibly in UI-LA2 |
| 40 | Loading skeletons | Current semantic state surfaces are truthful; legacy offers spinner/empty-state polish, not a safer state model | Retain current states; add only geometry-appropriate visual polish in UI-LA1/UI-LA2 |
| 41 | Empty states | Legacy empty-state composition is stronger; current copy/actions are truthful | Faithfully recreate presentation in the owning phase |
| 42 | Errors and retries | Current normalized request-ID errors and retries are stronger | Preserve behavior; improve hierarchy only |
| 43 | Responsive behavior | Both CSS sources express breakpoints, but no runtime behavior was verified here | Require the full implementation viewport matrix |
| 44 | Keyboard behavior | Current tabs/dialog/reveal/radio semantics are stronger; some legacy controls are pointer-only | Preserve current semantics; verify keyboard in each phase |
| 45 | Visible focus | Current global/feature CSS includes focus-visible rules; runtime appearance was not verified | Preserve and browser-verify in each phase |
| 46 | Reduced motion | Current Learning CSS includes a reduced-motion override; legacy flip/animations are weaker | Preserve and browser-verify; no motion-dependent state |
| 47 | Long text and overflow | Current CSS includes overflow wrapping and pre-wrap in key content surfaces | Preserve and test/browser-check adversarial long strings |
| 48 | Current native 200% requirements | Static audit cannot verify native zoom | Mandatory actual Chrome-toolbar 200% gate in UI-LA1/UI-LA2/UI-QA |
| 49 | Security and truthfulness | Current private access, ownership, validation, secrecy, scoring, and canonical state are stronger | Never trade these for visual parity; reject fabricated/unsafe legacy behavior |

## 13. Current-equal-or-better findings

| Area | Current evidence | Why current is stronger | Audit consequence |
| --- | --- | --- | --- |
| Authentication | In-memory access token, refresh-cookie bootstrap, protected routing, shared API client | Avoids legacy local-storage tokens and duplicate AuthContext | Never port legacy auth/client code |
| Ownership | Exact document/session/conversation/set/quiz/attempt identities are validated and server-owned | Prevents client-supplied ownership and cross-resource mixing | Preserve route and contract identities |
| Private storage | Signed PDF target is fetched, content-checked, blob-wrapped, revoked, and expired safely | Legacy renders a raw path directly | Keep current viewer pipeline |
| Extraction | Ordered chunks include page ranges and word counts | Supports page-aware reading and navigation | Visual adaptation only |
| Grounded citations | Learning messages, cards, and quiz review carry source pages | Legacy chat does not render its relevant chunks as citations | Preserve current source-page controls |
| Cancellation/stale work | Abort controllers plus sequence/route identity guards occur across list/workspace/chat/jobs | Legacy flows generally lack both | Never simplify during visual ports |
| Contract validation | Exact allowlists, ordering, bounds, chronology, job results, and canonical request IDs are checked | Legacy trusts looser shapes | Current validators remain authoritative |
| Error handling | Provider-neutral normalized errors and request IDs | Legacy logs or exposes ad hoc errors | Preserve safe messages and IDs |
| Immutable attempts | Interview and quiz attempts are server records with reconciliation behavior | Legacy quiz state is primarily client flow | Preserve immutable history |
| Quiz secrecy/scoring | Taking DTO omits answer keys; review and score arrive only after server submission | Legacy client structures are weaker | Do not expose or compute authoritative answers client-side |
| Flashcard reveal | Explicit Reveal/Hide button, state text, keyboard activation, bounded navigation | Legacy relies on click/motion flip | Visual front/back recreation only |
| Dialog behavior | Shared/native dialogs include labelling, Escape, focus containment, initial/return focus | Legacy overlays omit these guarantees | Keep current controls |
| App shell | Branded authenticated shell, skip link, semantic navigation, mobile dialog, auth identity | Legacy shell duplicates navigation/profile and includes fake fallback data | No shell/dashboard port |
| Branding | Open Book + Rising Pathway identity and current design tokens | Legacy branding is obsolete | Use current assets/CSS only |

## 14. Rejected and deferred behavior

- Rejected: both legacy authentication systems, local-storage tokens, API clients, provider/environment configuration, and backend/data models.
- Rejected: Interview session deletion because no current contract supports it.
- Rejected: Learning global flashcard/quiz libraries, set deletion, favorites/stars, reviewed-state persistence, difficulty, and fabricated document-card totals or file size.
- Rejected: legacy Dashboard statistics, progress, schedules, recent activity, fallback user data, profile/notification controls, and duplicate navigation.
- Rejected: raw PDF paths, arbitrary external links/images, unsafe raw HTML, unsupported automatic AI actions, and optimistic messages that do not reflect canonical server state.
- Rejected: hover-only actions, click-only cards, motion-only flashcard flipping, unlabelled close controls, and legacy modal/drawer behavior.
- Rejected: remote fonts and new Tailwind, Framer Motion, icon, Markdown, or syntax-highlighting dependencies merely to match legacy visuals.
- Deferred: sanitized rich Markdown. The current frontend has no proven safe Markdown renderer or sanitizer. A separate security/dependency/contract phase would need URL policy, HTML policy, renderer tests, accessibility review, and explicit approval.
- Deferred outside legacy-port scope: an additional quiz submission confirmation. Current submission is explicit and completeness-gated; the legacy source does not supply a stronger confirmation pattern. Any confirmation change should be justified separately by usability evidence, not visual parity.

## 15. Visual asset findings

| Legacy application | Asset | Dimensions | Format/transparency | Purpose | Classification | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| Interview Prep Ai | `src/assets/hero-img.png` | 2624 × 1510 | PNG RGBA; transparency present | Landing/product screenshot | Obsolete/rejected | Contains legacy product identity and screenshot-style marketing content; do not copy |
| Interview Prep Ai | `src/assets/react.svg` | 256 × 228 viewBox | SVG; transparent-capable | Vite/React starter mark | Rejected | Starter asset; no product value |
| Interview Prep Ai | `public/vite.svg` | 256 × 257 viewBox | SVG; transparent-capable | Vite starter mark | Rejected | Starter asset; no product value |
| AI Learning Assistant | `src/assets/react.svg` | 256 × 228 viewBox | SVG; transparent-capable | Vite/React starter mark | Rejected | Starter asset; no product value |
| AI Learning Assistant | `public/vite.svg` | 256 × 257 viewBox | SVG; transparent-capable | Vite starter mark | Rejected | Starter asset; no product value |

No reusable legacy raster asset is required. UI-LA1 and UI-LA2 should use current brand assets, semantic HTML, scoped CSS, and bounded inline SVG where an icon materially helps. Image generation remains a separate human-approved workflow.

## 16. Contract-support matrix

| Candidate field/behavior | Classification | Current evidence and constraint |
| --- | --- | --- |
| Document title | SUPPORTED BY CURRENT CONTRACT | `LearningDocument.title` |
| Original filename | SUPPORTED BY CURRENT CONTRACT | `LearningDocument.originalFilename` |
| MIME type | SUPPORTED BY CURRENT CONTRACT | `LearningDocument.mimeType`, currently constrained to PDF |
| Persisted/list document size | NOT SUPPORTED — DO NOT FABRICATE | Not present in `LearningDocument`; pre-upload `File.size` does not authorize a persisted card field |
| Document status | SUPPORTED BY CURRENT CONTRACT | Uploaded, processing, ready, failed, deleting |
| Page count | SUPPORTED BY CURRENT CONTRACT | Optional `LearningDocument.pageCount` |
| Chunk count | SUPPORTED BY CURRENT CONTRACT | Optional `LearningDocument.chunkCount` |
| Summary | SUPPORTED BY CURRENT CONTRACT | Optional stored `LearningDocument.summary` |
| Summary key points | SUPPORTED BY CURRENT CONTRACT | `LearningDocument.summaryKeyPoints` |
| Document timestamps | SUPPORTED BY CURRENT CONTRACT | Created, updated, optional processed time |
| Job status | SUPPORTED BY CURRENT CONTRACT | Typed generation, message, processing, deletion, and quiz jobs with canonical polling |
| Signed PDF target | CURRENT ALREADY EQUAL OR BETTER | `LearningDocumentSource` URL, expiry, content type plus secure blob handling |
| Extracted chunks/page numbers | SUPPORTED BY CURRENT CONTRACT | Ordered `DocumentChunk` index, page start/end, text, word count |
| Conversation title | SUPPORTED BY CURRENT CONTRACT | `LearningConversation.title` |
| Message role | SUPPORTED BY CURRENT CONTRACT | User/assistant role |
| Message text | SUPPORTED BY CURRENT CONTRACT | Plain `LearningMessage.content`; retain escaped plain text |
| Message source pages | SUPPORTED BY CURRENT CONTRACT | `LearningMessage.sourcePages` |
| Flashcard-set title | SUPPORTED BY CURRENT CONTRACT | `FlashcardSet.title` |
| Flashcard card count | SUPPORTED BY CURRENT CONTRACT | `FlashcardSet.cardCount` |
| Flashcard question | SUPPORTED WITH PRESENTATIONAL ADAPTATION | Current `Flashcard.front` is the prompt/front face |
| Flashcard answer | SUPPORTED WITH PRESENTATIONAL ADAPTATION | Current `Flashcard.back` is revealed explicitly |
| Flashcard difficulty | NOT SUPPORTED — DO NOT FABRICATE | No difficulty field in set/card DTOs |
| Flashcard source pages | SUPPORTED BY CURRENT CONTRACT | `Flashcard.sourcePages` |
| Persisted flashcard progress/review/star | REQUIRES SEPARATE CONTRACT PHASE | No current fields or routes; not part of UI-LA2 |
| Quiz title | SUPPORTED BY CURRENT CONTRACT | `QuizSummary.title` |
| Quiz question count | SUPPORTED BY CURRENT CONTRACT | `QuizSummary.questionCount` |
| Quiz choices | SUPPORTED BY CURRENT CONTRACT | `QuizForTaking` question choices without answer keys |
| Immutable attempts | CURRENT ALREADY EQUAL OR BETTER | Attempt list/detail and reconciliation use server records |
| Score | SUPPORTED BY CURRENT CONTRACT | Correct count, question count, score percent |
| Correct answer | SUPPORTED BY CURRENT CONTRACT | Available only in post-submission `QuizQuestionReview` |
| Selected answer | SUPPORTED BY CURRENT CONTRACT | `selectedChoiceIndex` in review and in-memory selection while taking |
| Explanation | SUPPORTED BY CURRENT CONTRACT | Post-submission question explanation |
| Quiz source pages | SUPPORTED BY CURRENT CONTRACT | Taking/review source pages |
| Attempt timestamps | SUPPORTED BY CURRENT CONTRACT | Created/completed timestamps |
| Unanswered review result | NOT SUPPORTED — DO NOT FABRICATE | Current UI requires every answer before submission |
| Document-card flashcard/quiz totals | NOT SUPPORTED — DO NOT FABRICATE | Not present in the current document-list DTO |
| Global flashcard/quiz library | REQUIRES SEPARATE CONTRACT PHASE | No current routes or global collection contract; not recommended |
| Rich Markdown/code | REJECTED FOR SECURITY OR ACCESSIBILITY | No proven sanitizer; current plain text is authoritative |

## 17. Evidence-based implementation roadmap

### `DOC-18A-IL` — Interview/Learning legacy-policy and roadmap correction

- Objective: after human approval of this audit and DEC-014 proposal, append DEC-014 and correct only the controlling planning documents so Interview is recorded complete, UI-IP2 is recorded not required, and UI-LA1/UI-LA2 precede UI-QA.
- Sources: this audit, `CURRENT_PHASE.md`, `DECISION_LOG.md`, and DEC-013.
- Destinations: `docs/planning/DECISION_LOG.md` and the minimum required `docs/planning/CURRENT_PHASE.md` lines only.
- Scope: documentation only; no phase activation and no application/test/package changes.
- Exclusions/contracts: all runtime, contracts, implementation, browser, deployment, and external actions excluded; contracts unchanged.
- Test-first/focused/full/browser requirements: not applicable. Run documentation whitespace, secret-pattern, scoped-diff, Git-status, and no-staging checks.
- Viewports/native 200%/screenshots/accessibility/reduced motion: not applicable to documentation-only work.
- Cleanup: only the authorized documentation diff; no generated files; clean worktree after separately authorized bounded commit.
- Approval token: `PHASE_18A_INTERVIEW_LEARNING_LEGACY_POLICY_ROADMAP_CORRECTION_APPROVED`.
- Workflow: prepare documentation → verify → stop unstaged → human review → bounded repair → exact token → exact staging → direct local-commit authorization → bounded local commit → clean worktree. No push, merge, or deployment.
- Predecessor: approval of this audit and its DEC-014 proposal.
- Successor: `UI-LA1` remains planned/inactive until separately authorized.

### `UI-LA1` — Learning Documents, Workspace and Conversations Legacy Visual Port

- Objective: recreate the strongest legacy document-library, upload-feedback, workspace-context, and conversation presentation while preserving every current security and state boundary.
- Legacy sources: DocumentListPage, DocumentCard, DocumentDetailPage, AIActions, ChatInterface, and common Tabs/EmptyState/Spinner/Modal/PageHeader/CSS.
- Current destinations: `LearningDashboard.tsx`, `LearningDocumentWorkspace.tsx`, `DocumentConversations.tsx`, `LearningConversationWorkspace.tsx`, scoped tests, and `learningWorkspace.css`; shared components only if a demonstrated, non-regressive change is unavoidable.
- In scope: page identity; responsive supported-field cards; accessible native file selection and selected filename; upload/processing states; workspace header/tabs; signed-viewer surroundings; extracted reader; stored summary/key points; conversation collection, role hierarchy, composer, citations, and polling/error states.
- Exclusions: no backend/shared contract/API route/auth/storage/provider/dependency changes; no persisted file size, document-card set totals, concept-explain action, Markdown, raw path, fake progress, duplicate shell/dashboard, or unsupported drag/upload percentage.
- Contracts preserved: document/upload/source/chunk/conversation/message/job/deletion DTOs; ownership identities; signed PDF behavior; exact allowlists; canonical request IDs; cancellation; stale guards; server ordering/pagination; safe errors; explicit AI actions.
- Likely files changed: the four destination components, their existing tests, and `learningWorkspace.css`; `LearningDocumentDeletion.tsx` only if presentation changes without behavior changes.
- Test-first requirements: first encode the supported card metadata, selected-file feedback, semantic actions, conversation role hierarchy, citations, current states, and absence of unsupported fields; retain every existing cancellation/stale/security test.
- Focused tests: Learning dashboard, document workspace/deletion/conversations/chat, Learning API/contracts/deletion/polling, routing, and any touched shared control.
- Full-suite requirements: `npm run typecheck`; full frontend unit suite; `npm run build`. Run broader repository gates only if an authorized change crosses the frontend boundary.
- Browser scenarios: upload idle/selected/invalid/uploading/failure/retry; library loading/empty/error/filtered/paged/all statuses/long text; workspace processing/ready/failed/deleting/unavailable; signed viewer success/expiry/error; extracted pages; summary present/absent; deletion cancel/confirm/failure/reconciliation; conversation empty/paged/create; chat empty/history/sending/ambiguous/paused/failure/retry/citations/long text.
- Responsive viewports: 1440 × 900, 1024 × 768, 768 × 1024, 390 × 844, and 320 × 720 CSS pixels.
- Native zoom: actual Chrome-toolbar 200% at an implementation-appropriate desktop viewport; represented CSS resizing is not a substitute.
- Accessibility: semantic cards/links/buttons; labelled native file input; error-summary focus; tablist arrow/Home/End behavior; dialog focus/Escape/return; logical headings; live status without duplicate announcements; citation labels; keyboard-only completion; visible focus; touch targets; no color-only status.
- Reduced motion: verify system preference; no required information or state transition may depend on animation.
- Screenshots: document library complete/empty/error/mobile; upload selected/error; ready workspace overview/viewer/extracted; deletion dialog; conversation history with citations; chat sending/failure; tablet and native-200% evidence.
- Cleanup: stop servers and browser tooling used in the authorized implementation, remove captures/temp artifacts not explicitly approved, scan for secrets/generated output, and leave only scoped unstaged changes before human review.
- Approval token: `PHASE_18A_UI_LA1_LEARNING_DOCUMENTS_WORKSPACE_CONVERSATIONS_LEGACY_VISUAL_PORT_APPROVED`.
- Closeout/commit workflow: implement → verify → stop unstaged → human visual review → bounded repair when required → exact approval token → documentation closeout → exact staging → direct local-commit authorization → bounded local commit → clean worktree. No push, merge, or deploy.
- Predecessor: approved and committed `DOC-18A-IL` correction.
- Successor: `UI-LA2`, separately authorized and still inactive until then.

### `UI-LA2` — Learning Flashcards, Quizzes and Review Legacy Visual Port

- Objective: recreate the strongest legacy set cards, accessible front/back study framing, focused quiz-taking flow, and result-review hierarchy using only current document-scoped contracts.
- Legacy sources: FlashcardsListPage, FlashcardPage, FlashcardSetCard, Flashcard, FlashcardManager, QuizCard, QuizManager, QuizTakePage, QuizResultPage, and relevant common/CSS sources.
- Current destinations: `DocumentFlashcards.tsx`, `LearningFlashcardWorkspace.tsx`, `FlashcardStudy.tsx`, `DocumentQuizzes.tsx`, `LearningQuizWorkspace.tsx`, `QuizTaker.tsx`, `LearningQuizAttemptWorkspace.tsx`, scoped tests, and `learningWorkspace.css`.
- In scope: supported-field set cards and states; generation hierarchy; front/back visual framing with explicit reveal/hide; positional study progress and navigation; document-scoped quiz cards; one-question focus and navigable progress; accessible selected answers; complete-answer validation; immutable attempt collection; score, correct/incorrect, selected/correct answer, explanation, sources, and timestamp hierarchy.
- Exclusions: no global libraries/routes; set deletion; stars/favorites; persisted review/progress; difficulty; fabricated unanswered review; answer keys before submission; client scoring; Markdown; motion-only flip; new dependencies; backend/shared contract changes.
- Contracts preserved: flashcard-set/card/generation-job and quiz-summary/taking/submission/attempt/review/job DTOs; document ownership; source-page bounds; ordering; answer secrecy; server scoring; immutable attempts; UUID reuse/reconciliation; request IDs; cancellation/stale guards; pagination.
- Likely files changed: the seven destination components, their existing tests, and `learningWorkspace.css`.
- Test-first requirements: encode supported-only card metadata, explicit reveal semantics, reduced-motion-independent state, retained quiz selections across navigation, no answer-key leakage, one submission, immutable review, and no fabricated difficulty/progress/delete/unanswered fields.
- Focused tests: document flashcards/quizzes, flashcard/quiz workspaces, FlashcardStudy, QuizTaker, quiz attempt, Learning quiz API/contracts, general Learning API/contracts/polling, routing.
- Full-suite requirements: `npm run typecheck`; full frontend unit suite; `npm run build`. Run broader repository gates only if an authorized change crosses the frontend boundary.
- Browser scenarios: flashcard collection empty/generating/ready/failed/paged; generation paused/retry; before/after reveal; keyboard reveal; first/middle/last and long content; quiz collection states; unanswered/answered navigation; retained selected states; keyboard radios; submit disabled/enabled/ambiguous/reconciled; attempt history; perfect/mixed results; long explanations and citations.
- Responsive viewports: 1440 × 900, 1024 × 768, 768 × 1024, 390 × 844, and 320 × 720 CSS pixels.
- Native zoom: actual Chrome-toolbar 200% at an implementation-appropriate desktop viewport.
- Accessibility: explicit reveal/hide control and state text; no pointer/motion dependency; fieldset/radio semantics; current-question and progress announcement; keyboard navigation without trapping focus; visible focus; semantic score/review structure; non-color correct/incorrect labels; touch targets; long-text containment.
- Reduced motion: front/back state must remain understandable with transitions disabled; verify system preference.
- Screenshots: flashcard set collection states; front and revealed back; mobile study; quiz set states; unanswered and selected quiz question; submission/error state; score summary; mixed review; tablet and native-200% evidence.
- Cleanup: same scoped server/browser/capture/temp/generated/secret cleanup as UI-LA1; stop unstaged for human review.
- Approval token: `PHASE_18A_UI_LA2_LEARNING_FLASHCARDS_QUIZZES_REVIEW_LEGACY_VISUAL_PORT_APPROVED`.
- Closeout/commit workflow: implement → verify → stop unstaged → human visual review → bounded repair when required → exact approval token → documentation closeout → exact staging → direct local-commit authorization → bounded local commit → clean worktree. No push, merge, or deploy.
- Predecessor: approved and locally committed UI-LA1.
- Successor: `UI-QA`, separately authorized and inactive until then.

### `UI-QA` — Integrated Pre-Deployment UI Quality Assurance

- Objective: verify the complete approved frontend as one authenticated product after UI-LA1 and UI-LA2, including retained Interview behavior and actual native 200%.
- Sources/destinations: current full frontend and authorized test/browser evidence; fixes only when a separately authorized QA repair is bounded to a reproduced defect.
- In scope: cross-feature shell/navigation, brand consistency, desktop/tablet/mobile, actual native Chrome 200%, keyboard/focus, reduced motion, long text, core loading/empty/error/success states, and privacy-safe screenshot evidence.
- Exclusions/contracts: no feature expansion, backend/shared-contract change, provider, deployment, or unsupported data; all current contracts preserved.
- Likely files changed: none for verification; any repair requires a bounded documented defect and scoped files/tests.
- Test-first/focused/full requirements: reproduce and test any defect first; run typecheck, complete frontend suite, production build, and the authorized integrated browser matrix. Run all repository gates required by the then-current phase document.
- Browser scenarios/screenshots: representative authenticated Dashboard, Resumes, Interviews, Learning, Settings, mobile navigation, every critical state family, keyboard traversal, reduced motion, long content, all listed viewports, and native 200%.
- Accessibility: keyboard-only navigation, focus order/visibility/return, headings/landmarks/names/status announcements, non-color states, reflow, touch targets, and motion preference.
- Cleanup: stop all authorized services/browser processes; remove non-approved artifacts; secret/generated scan; scoped diff; clean worktree after approved bounded closeout commit.
- Approval token: `PHASE_18A_UI_QA_INTEGRATED_PRE_DEPLOYMENT_UI_APPROVED`.
- Closeout/commit workflow: verify → stop unstaged if repairs exist → human visual review → bounded repair → exact approval token → documentation closeout → exact staging → direct local-commit authorization → bounded local commit → clean worktree. No push, merge, or deploy.
- Predecessor: approved and locally committed UI-LA2.
- Successor: separate Phase 18B activation decision; Phase 18B stays inactive until explicitly accepted.

Minimum-roadmap justification: no UI-IP2 is supported; documents/workspace/conversations form one coherent data-and-layout boundary; flashcards/quizzes/review form a second shared study boundary; a third Learning phase would fragment the same scoped CSS and document-workspace surfaces without an independent contract or review boundary.

Exact order: `AUDIT-APPROVAL → DOC-18A-IL → UI-LA1 → UI-LA2 → UI-QA → PHASE-18B-ACTIVATION-DECISION`.

## 18. Proposed CURRENT_PHASE.md correction

Apply only after this audit and DEC-014 are human-approved, in `DOC-18A-IL`. Do not apply during this audit. The future minimum correction is:

1. Replace `Next planned UI task: UI-QA` with `Next planned UI task: UI-LA1`.
2. Keep UI-I1 `COMPLETED / HUMAN-APPROVED` and add:

```markdown
- Interview/Learning comparative audit status: COMPLETED / HUMAN-APPROVED
- Accepted comparative-audit approval token:
  `PHASE_18A_INTERVIEW_LEARNING_LEGACY_COMPARATIVE_AUDIT_APPROVED`
- DEC-014 status: ACCEPTED
- Interview verdict:
  `A. COMPLETE — NO ADDITIONAL INTERVIEW IMPLEMENTATION REQUIRED`
- UI-IP2 status: NOT REQUIRED / NOT PLANNED
- UI-LA1 status: PLANNED / INACTIVE
- UI-LA2 status: PLANNED / INACTIVE
- UI-QA status: PLANNED / INACTIVE
- Phase 18B status: PLANNED / INACTIVE — NOT READY FOR ACTIVATION UNTIL
  UI-LA1, UI-LA2, AND UI-QA ARE COMPLETED, HUMAN-APPROVED, DOCUMENTED,
  AND LOCALLY COMMITTED; SEPARATE AUTHORIZATION REQUIRED
- Phase 19 status: PLANNED / INACTIVE
- Ordered remaining UI roadmap:
  `UI-LA1 → UI-LA2 → UI-QA`
```

3. Add a bounded audit-closeout subsection recording the two legacy/frontend roots, 38/50 authored-file counts, no UI-IP2, two Learning phases, the unrun static-audit limitations, and the accepted audit token.
4. Update only the workflow-state summary fragments necessary to insert the approved comparative audit and planned/inactive UI-LA1/UI-LA2 before UI-QA.
5. Preserve Phase 18B and Phase 19 as planned/inactive and state that no implementation, activation, push, merge, deployment, DNS, cloud, provider, or secret action is authorized.

## 19. Verification plan by phase

| Phase | Test-first and focused verification | Full verification | Browser and visual gate | Required evidence |
| --- | --- | --- | --- | --- |
| `DOC-18A-IL` | Documentation whitespace, secret-pattern, exact-path, scoped-diff, no-staging checks | Not applicable | None | Only approved planning files; exact decision and roadmap text |
| `UI-LA1` | Dashboard, workspace, deletion, conversations, chat, API/contracts/polling/routing tests; new assertions before production edits | Typecheck, full frontend suite, production build | Authorized browser matrix at 1440×900, 1024×768, 768×1024, 390×844, 320×720, plus native Chrome 200% | State screenshots, keyboard/focus, reduced motion, long text, no unsupported fields, service cleanup |
| `UI-LA2` | Flashcard, quiz, attempt, API/contracts/polling/routing tests; secrecy/accessibility assertions first | Typecheck, full frontend suite, production build | Same viewport and native-200% matrix | Front/back, selected-answer, submission/reconciliation, score/review, keyboard, reduced motion, cleanup |
| `UI-QA` | Reproduce/test any discovered defect before repair | Then-current full repository gates, frontend suite, typecheck, build | Integrated all-feature matrix and actual native 200% | Privacy-safe screenshots, cross-feature consistency, all processes stopped, final scoped Git proof |

No command above was run in this static audit. Exact pass/fail results must be recorded by the future authorized phase; an unrun command must never be reported as passed.

## 20. Human-review workflow

Every implementation phase must follow this exact gate:

`implement → verify → stop unstaged → human visual review → bounded repair when required → exact approval token → documentation closeout → exact staging → direct local-commit authorization → bounded local commit → clean worktree`

Human review must receive the local URL, an inspection checklist, state/viewpoint/native-zoom evidence, accessibility/reduced-motion notes, exact test results, scoped diff, and remaining limitations. Browser automation may support but never replace human review. No staging or commit occurs before the exact phase token. No phase may push, merge, deploy, change DNS/cloud/provider state, or expose secrets.

## 21. Risks and stop conditions

- Stop if a proposed visual requires a backend/shared-contract/API/auth/storage/provider/dependency change; move it to a separately approved phase or reject it.
- Stop if current DTO evidence does not support a displayed size, total, difficulty, progress, activity, score, answer, or route.
- Stop if visual work weakens ownership, private signed access, request-ID filtering, cancellation, stale guards, server ordering/pagination, immutable records, quiz secrecy, or server scoring.
- Stop if Markdown, raw HTML, external URLs/images, or direct PDF paths are introduced without an approved security architecture.
- Stop if an action becomes pointer-, hover-, color-, or motion-only, loses visible focus, or fails reduced-motion intent.
- Stop if actual browser/native-200% evidence exposes clipping, unreachable controls, unusable reflow, or unreadable long content.
- Stop after three unsuccessful code-changing repairs for one root failure and report the exact command/error and attempts.
- Stop if unrelated or legacy-project files change, generated artifacts or secrets appear, a service remains running, or the worktree cannot be returned to the approved scope.
- This static audit does not claim runtime correctness, browser fidelity, accessibility conformance, responsive behavior, or native-200% success. Historical test and visual results in `CURRENT_PHASE.md` are context, not fresh verification.

## 22. Final recommendation

```text
INTERVIEW_VERDICT:
A

INTERVIEW_FOLLOW_UP_REQUIRED:
NO

LEARNING_IMPLEMENTATION_PHASE_COUNT:
2

RECOMMENDED_PHASE_ORDER:
AUDIT-APPROVAL → DOC-18A-IL → UI-LA1 → UI-LA2 → UI-QA → PHASE-18B-ACTIVATION-DECISION

NEXT_PHASE_AFTER_AUDIT_APPROVAL:
DOC-18A-IL

UI_QA_POSITION:
AFTER_ALL_APPROVED_INTERVIEW_AND_LEARNING_LEGACY_PORT_WORK

PHASE_18B_STATUS:
PLANNED / INACTIVE

PHASE_19_STATUS:
PLANNED / INACTIVE

IMPLEMENTATION_STARTED:
NO
```
