# Interview Prep legacy inventory

## 1. Inspection metadata

- Prompt: `CLH-PHASE-09-INTERVIEW-LEGACY-INSPECTION-01`
- Date: 2026-07-25
- Active repository: `Career Learning Hub`
- Branch and starting HEAD: `phase-10-unified-frontend` at `ba8da83`
- Approved legacy reference: `LEGACY_INTERVIEW_PREP/`
- Access mode: safe source and public-asset metadata, read-only
- Legacy Git status: the approved folder is not itself a Git repository
- Execution: no legacy source, script, test, build, server, package manager,
  database command, provider call, or network command ran
- Sensitive exclusions: environment files, credentials, tokens, cookies,
  uploads, recordings, reports, databases, dependency folders, generated
  output, caches, logs, and private temporary output
- Pre-inspection safe manifest: 84 records, 1,191,883 aggregate metadata bytes,
  SHA-256
  `009f3180de8797db4f3922646b0e65d056d4966aad3053eea8e4f4150e8a281d`
- Post-inspection safe manifest: 84 records with the same SHA-256
- Manifest comparison: byte-for-byte equal; temporary manifests removed
- Legacy command result: no legacy execution command ran

Source-backed observations in this document are not runtime verification.

## 2. Project summary

The legacy reference is a small React/Vite frontend and Express/MongoDB
backend. It declares a public landing route, a session dashboard, and a
session-specific question screen. The principal workflow creates a session
from role, experience, focus topics, and a description; requests generated
questions synchronously; persists returned questions; and presents them as
expandable question-and-answer cards. Users can pin questions, request an
explanation, load another generated batch, and delete sessions.

The strongest product ideas are compact owned-session summaries, clear role
context, progressive answer reveal, pinning, explanations, and a responsive
study layout. They require `REBUILD` or `REFERENCE ONLY`. No item qualifies
for `PORT`: provenance and licence evidence are absent, the active architecture
already owns routing/auth/transport, and useful interactions need current
validation, ownership, job, privacy, and accessibility behavior.

The legacy reference has material conflicts: persistent browser tokens,
duplicate authentication and API infrastructure, direct synchronous provider
calls, raw generated content crossing the client, missing or inconsistent
ownership checks, public upload behavior, broad logging, incomplete
accessibility, no job/idempotency flow, and no evidenced attempt/feedback
journey.

## 3. Route and screen inventory

| Screen or surface | Route | Reachability | Purpose | Status | Classification | Active replacement | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Landing | `/` | Declared public route | Marketing and auth entry | IMPLEMENTED | REJECT | Existing `/login` and `/register`; no duplicate landing required | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/App.jsx:17` |
| Login overlay | `/` overlay | Opened from landing | Legacy login | IMPLEMENTED | REJECT | Existing public-only `/login` | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/pages/LandingPage.jsx` |
| Sign-up overlay | `/` overlay | Opened from landing | Legacy registration | IMPLEMENTED | REJECT | Existing public-only `/register` | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/pages/LandingPage.jsx` |
| Session dashboard | `/dashboard` | Declared without a route guard | Session cards and creation | IMPLEMENTED | REBUILD | Protected `/interviews` list page | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/App.jsx:19` |
| Create-session modal | `/dashboard` overlay | Opened from dashboard | Collect session context | IMPLEMENTED | REFERENCE ONLY | Accessible form on `/interviews` or a managed dialog | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/pages/Home/Dashboard.jsx` |
| Interview preparation | `/interview-prep/:sessionId` | Declared without a route guard | Questions, answers, pinning, explanations | IMPLEMENTED | REBUILD | Protected `/interviews/:sessionId` | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/App.jsx:20-23` |
| Explanation drawer | Session overlay | Opened per question | Generated explanation | IMPLEMENTED | REFERENCE ONLY | Accessible feature-local explanation panel | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/components/Drawer.jsx` |
| Not-found screen | Unmatched routes | No declaration | Route failure | UNKNOWN | REJECT | Existing active `RouteErrorPage` | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/App.jsx` |

Declared route count: 3. Material screens or overlays: 7, excluding the absent
not-found screen. No nested active-shell route hierarchy should migrate.

## 4. Feature decision matrix

Allowed observed statuses are `IMPLEMENTED`, `PARTIAL`, `PLACEHOLDER`,
`DEAD OR UNREACHABLE`, and `UNKNOWN`. Active support is based only on current
active source and tests.

| ID | Feature | Normalized legacy evidence | Observed | Classification | Active support | Proposed Phase 10 action | Main risk | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| IP-001 | Public landing route | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/App.jsx:17` | IMPLEMENTED | REJECT | NOT APPLICABLE | Keep current auth routes; add no interview landing | Duplicate route/auth surface | High |
| IP-002 | Auth call-to-action gate | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/pages/LandingPage.jsx` | IMPLEMENTED | REJECT | NOT APPLICABLE | Use current `AuthRoute` | Competing auth lifecycle | High |
| IP-003 | Hero marketing layout | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/pages/LandingPage.jsx` | IMPLEMENTED | REFERENCE ONLY | NOT APPLICABLE | At most inform visual hierarchy | Unknown design provenance | High |
| IP-004 | Feature-card outcome claims | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/utils/data.js:16-46` | IMPLEMENTED | REJECT | NOT APPLICABLE | Use factual capability wording only | Overstated AI outcomes | High |
| IP-005 | Responsive landing columns | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/pages/LandingPage.jsx` | IMPLEMENTED | REFERENCE ONLY | NOT APPLICABLE | Follow active breakpoints and reflow rules | Appearance is not accessibility proof | High |
| IP-006 | Login/sign-up overlay switcher | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/pages/LandingPage.jsx` | IMPLEMENTED | REJECT | NOT APPLICABLE | Preserve current separate public routes | Duplicate dialogs and auth | High |
| IP-007 | Legacy email validation | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/utils/helper.js` | IMPLEMENTED | REJECT | NOT APPLICABLE | Preserve current auth validation | Legacy auth reuse prohibited | High |
| IP-008 | Legacy password validation | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/pages/Auth/Login.jsx` | IMPLEMENTED | REJECT | NOT APPLICABLE | Preserve current auth validation | Legacy auth reuse prohibited | High |
| IP-009 | Password visibility control | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/components/Inputs/Input.jsx` | IMPLEMENTED | REJECT | NOT APPLICABLE | Keep existing auth UI | Unlabelled non-button icon | High |
| IP-010 | Legacy registration form | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/pages/Auth/SignUp.jsx` | IMPLEMENTED | REJECT | NOT APPLICABLE | Keep current `/register` | Competing auth contract | High |
| IP-011 | Profile-photo selection | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/components/Inputs/ProfilePhotoSelector.jsx` | IMPLEMENTED | REJECT | NOT APPLICABLE | Exclude from Phase 10 | Privacy and active-content risk | High |
| IP-012 | Profile-image upload | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/utils/uploadImage.js` | IMPLEMENTED | REJECT | NOT APPLICABLE | Exclude | Upload/storage infrastructure prohibited | High |
| IP-013 | Legacy login submission | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/pages/Auth/Login.jsx` | IMPLEMENTED | REJECT | NOT APPLICABLE | Keep current auth API | Duplicate endpoint/token behavior | High |
| IP-014 | Browser-persisted access token | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/context/userContext.jsx:15-45` | IMPLEMENTED | REJECT | NOT APPLICABLE | Preserve memory-only access token | Token theft through browser storage | High |
| IP-015 | Legacy user context | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/context/userContext.jsx` | IMPLEMENTED | REJECT | NOT APPLICABLE | Keep current `AuthProvider` | Competing auth owner | High |
| IP-016 | Legacy profile bootstrap | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/context/userContext.jsx:12-34` | IMPLEMENTED | REJECT | NOT APPLICABLE | Keep current refresh bootstrap | Persistent token dependency | High |
| IP-017 | Legacy profile/logout UI | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/components/Cards/ProfileInfoCard.jsx` | IMPLEMENTED | REJECT | NOT APPLICABLE | Keep current `AppShell` | Duplicate shell/auth state | High |
| IP-018 | Broad storage clearing on logout | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/components/Cards/ProfileInfoCard.jsx` | IMPLEMENTED | REJECT | NOT APPLICABLE | Clear only current in-memory auth | Destructive unrelated storage behavior | High |
| IP-019 | Legacy dashboard navigation | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/components/layouts/Navbar.jsx` | IMPLEMENTED | REJECT | NOT APPLICABLE | Keep current `AppShell` navigation | Second shell hierarchy | High |
| IP-020 | Legacy protected-layout check | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/components/layouts/DashboardLayout.jsx` | PARTIAL | REJECT | NOT APPLICABLE | Keep current protected routes | Rendering check is not authorization | High |
| IP-021 | Session dashboard fetch | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/pages/Home/Dashboard.jsx:26-33` | IMPLEMENTED | REBUILD | SUPPORTED | Connect owned paginated list through validated API; `interview.service.ts:166-198` | Stale/error state and DTO trust | High |
| IP-022 | Responsive session grid | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/pages/Home/Dashboard.jsx:55-75` | IMPLEMENTED | REFERENCE ONLY | NOT APPLICABLE | Recreate with active layout tokens | Unknown style provenance | High |
| IP-023 | Session summary card | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/components/Cards/SummaryCard.jsx` | IMPLEMENTED | REBUILD | SUPPORTED | Show allowlisted title, role, status, counts, dates | Broad legacy response rendering | High |
| IP-024 | Session metadata chips | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/components/Cards/SummaryCard.jsx:58-75` | IMPLEMENTED | REBUILD | SUPPORTED | Show factual experience, question count, status | Dense mobile reflow | High |
| IP-025 | Open session from card | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/pages/Home/Dashboard.jsx:71` | IMPLEMENTED | REBUILD | SUPPORTED | Navigate to route-owned `/interviews/:sessionId` | Route/resource mismatch | High |
| IP-026 | Session-delete confirmation | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/components/DeleteAlertContent.jsx` | IMPLEMENTED | REJECT | NOT SUPPORTED | Exclude deletion | No active delete route | High |
| IP-027 | Delete session and refresh | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/pages/Home/Dashboard.jsx:35-47` | IMPLEMENTED | REJECT | NOT SUPPORTED | Exclude; do not invent endpoint | Destructive unsupported action | High |
| IP-028 | Create-session modal composition | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/pages/Home/Dashboard.jsx:86-96` | IMPLEMENTED | REFERENCE ONLY | SUPPORTED | Choose page form or fully accessible dialog | Legacy modal lacks dialog behavior | High |
| IP-029 | Target-role field | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/pages/Home/CreateSessionForm.jsx:84-90` | IMPLEMENTED | REBUILD | SUPPORTED | Use active 2-200 character contract | Validation mismatch | High |
| IP-030 | Experience field | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/pages/Home/CreateSessionForm.jsx:92-98` | IMPLEMENTED | REBUILD | SUPPORTED | Use operator-approved vocabulary within 1-100 bound | Unresolved vocabulary | High |
| IP-031 | Focus-topics field | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/pages/Home/CreateSessionForm.jsx:100-106` | IMPLEMENTED | REBUILD | SUPPORTED | Use bounded topic collection, not unchecked CSV | Parsing and duplicate semantics | High |
| IP-032 | Optional session description | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/pages/Home/CreateSessionForm.jsx:108-114` | IMPLEMENTED | REBUILD | PARTIALLY SUPPORTED | Map only to approved job/context fields | Legacy field meaning is ambiguous | High |
| IP-033 | Required-field error | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/pages/Home/CreateSessionForm.jsx:31-38` | IMPLEMENTED | REBUILD | SUPPORTED | Add summary, field errors, request ID, focus | Error is not associated with fields | High |
| IP-034 | Client-orchestrated question generation | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/pages/Home/CreateSessionForm.jsx:41-59` | IMPLEMENTED | REJECT | SUPPORTED | Use active explicit job enqueue after session create | Raw provider data crosses client | High |
| IP-035 | Client receipt of generated Q&A | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/pages/Home/CreateSessionForm.jsx:53-59` | IMPLEMENTED | REJECT | SUPPORTED | Poll owned job and reload canonical questions | Unvalidated output persistence | High |
| IP-036 | Legacy generated-question persistence | `LEGACY_INTERVIEW_PREP/backend/controllers/sessionController.js` | IMPLEMENTED | REJECT | SUPPORTED | Use active transactional service only | Legacy backend reuse prohibited | High |
| IP-037 | Redirect after session creation | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/pages/Home/CreateSessionForm.jsx:61-63` | IMPLEMENTED | REBUILD | SUPPORTED | Navigate only after validated owned ID | Unvalidated identifier | High |
| IP-038 | Route-owned session load | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/pages/InterviewPrep/InterviewPrep.jsx:17-42` | IMPLEMENTED | REBUILD | SUPPORTED | Treat route param as sole identity and abort obsolete load | Weak legacy ownership | High |
| IP-039 | Role/context header | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/pages/InterviewPrep/components/RoleInfoHeader.jsx` | IMPLEMENTED | REBUILD | SUPPORTED | Render allowlisted canonical session fields | Decorative animation and reflow | High |
| IP-040 | Question-list rendering | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/pages/InterviewPrep/InterviewPrep.jsx:154-214` | IMPLEMENTED | REBUILD | SUPPORTED | Load paginated owned questions; preserve server order | Index keys and broad objects | High |
| IP-041 | Expand/collapse answer | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/components/Cards/QuestionCard.jsx` | IMPLEMENTED | REBUILD | SUPPORTED | Use semantic disclosure and active reveal policy | Click target/ARIA state absent | High |
| IP-042 | Raw Markdown answer presentation | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/pages/InterviewPrep/components/AIResponsePreview.jsx` | IMPLEMENTED | REJECT | SUPPORTED | Render validated structured text fields only | URL/content injection surface | High |
| IP-043 | Code-block copy affordance | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/pages/InterviewPrep/components/AIResponsePreview.jsx:108-150` | IMPLEMENTED | REFERENCE ONLY | NOT APPLICABLE | Defer unless validated content requires code blocks | Clipboard status/focus behavior | High |
| IP-044 | Pin/unpin control | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/components/Cards/QuestionCard.jsx:44-59` | IMPLEMENTED | REBUILD | SUPPORTED | Send explicit boolean through owned nested route | Icon-only accessible name | High |
| IP-045 | Pinned-first ordering | `LEGACY_INTERVIEW_PREP/backend/controllers/sessionController.js` | IMPLEMENTED | REBUILD | SUPPORTED | Preserve server list order; no client rewrite | Ordering/pagination expectations | High |
| IP-046 | Explanation request | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/pages/InterviewPrep/InterviewPrep.jsx:44-70` | IMPLEMENTED | REBUILD | SUPPORTED | Explicit enqueue, owned polling, validated result | Private question sent to provider | High |
| IP-047 | Explanation side panel | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/components/Drawer.jsx` | IMPLEMENTED | REFERENCE ONLY | SUPPORTED | Choose inline region or accessible managed dialog | Focus and Escape missing | High |
| IP-048 | Explanation loading skeleton | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/components/Loader/SkeletonLoader.jsx` | IMPLEMENTED | REBUILD | SUPPORTED | Add truthful queued/processing/failed states | Skeleton alone hides job truth | High |
| IP-049 | Raw AI explanation display | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/pages/InterviewPrep/InterviewPrep.jsx:229-231` | IMPLEMENTED | REJECT | SUPPORTED | Allowlist validated explanation/key points/model answer | Raw provider output | High |
| IP-050 | Load another question batch | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/pages/InterviewPrep/InterviewPrep.jsx:90-130` | IMPLEMENTED | REBUILD | SUPPORTED | Explicit bounded generation with UUID idempotency | Unbounded repeat and duplicate risk | High |
| IP-051 | Toast success feedback | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/App.jsx:27-33` | IMPLEMENTED | REFERENCE ONLY | NOT APPLICABLE | Prefer persistent status regions for consequential work | Ephemeral announcement | High |
| IP-052 | Client error/response logging | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/pages/InterviewPrep/InterviewPrep.jsx:39-87` | IMPLEMENTED | REJECT | NOT APPLICABLE | Log no private content or raw responses | Personal and provider data exposure | High |
| IP-053 | Modal visual treatment | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/components/Modal.jsx` | IMPLEMENTED | REFERENCE ONLY | NOT APPLICABLE | Use active surface language only | Unknown style provenance | High |
| IP-054 | Modal keyboard/focus behavior | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/components/Modal.jsx` | PARTIAL | REBUILD | NOT APPLICABLE | Implement role/name/focus trap/return/Escape | Keyboard escape and focus loss | High |
| IP-055 | Drawer keyboard/focus behavior | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/components/Drawer.jsx` | PARTIAL | REBUILD | NOT APPLICABLE | Provide named region or managed dialog semantics | Off-screen content may stay focusable | High |
| IP-056 | Accessible icon control names | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/components/Inputs/Input.jsx:24-39` | PARTIAL | REBUILD | NOT APPLICABLE | Give every icon button a visible or accessible name | Unnamed controls | High |
| IP-057 | Programmatic input labels | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/components/Inputs/Input.jsx:10-22` | PARTIAL | REBUILD | NOT APPLICABLE | Pair `label` and control IDs; connect errors | Label not associated | High |
| IP-058 | Accessible busy indicator | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/components/Loader/SpinnerLoader.jsx` | PARTIAL | REBUILD | NOT APPLICABLE | Add textual status and live announcement | Visual-only state | High |
| IP-059 | Notes marketing claim | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/utils/data.js:29-34` | PLACEHOLDER | REJECT | SUPPORTED | Do not claim until connected and verified | Advertised but absent UI | High |
| IP-060 | Legacy question-note endpoint | `LEGACY_INTERVIEW_PREP/backend/routes/questionRoutes.js` | IMPLEMENTED | REJECT | SUPPORTED | Use active `PATCH .../notes` only | Legacy backend prohibited | High |
| IP-061 | Private notes editor | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/utils/apiPaths.js:29` | PLACEHOLDER | REBUILD | SUPPORTED | Explicit save or safe debounced save with status | Unsaved/private-content ambiguity | High |
| IP-062 | Add-question ownership control | `LEGACY_INTERVIEW_PREP/backend/controllers/questionController.js` | PARTIAL | REJECT | SUPPORTED | Preserve active session+user ownership and safe 404 | Legacy cross-user mutation risk | High |
| IP-063 | Pin ownership control | `LEGACY_INTERVIEW_PREP/backend/controllers/questionController.js` | PARTIAL | REJECT | SUPPORTED | Preserve active nested binding | Legacy cross-user mutation risk | High |
| IP-064 | Notes ownership control | `LEGACY_INTERVIEW_PREP/backend/controllers/questionController.js` | PARTIAL | REJECT | SUPPORTED | Preserve active nested binding | Private-note IDOR risk | High |
| IP-065 | Session-detail ownership control | `LEGACY_INTERVIEW_PREP/backend/controllers/sessionController.js` | PARTIAL | REJECT | SUPPORTED | Preserve active owned query and generic 404 | Legacy IDOR risk | High |
| IP-066 | Legacy delete ownership check | `LEGACY_INTERVIEW_PREP/backend/controllers/sessionController.js` | IMPLEMENTED | REJECT | NOT SUPPORTED | Do not copy or add deletion | Legacy backend and 401 disclosure | High |
| IP-067 | Legacy session/question multi-write | `LEGACY_INTERVIEW_PREP/backend/controllers/sessionController.js` | IMPLEMENTED | REJECT | SUPPORTED | Preserve active transactions and deduplication | Partial-write integrity risk | High |
| IP-068 | Direct provider invocation | `LEGACY_INTERVIEW_PREP/backend/controllers/aiController.js` | IMPLEMENTED | REJECT | SUPPORTED | Use active AI gateway and jobs only | Provider coupling and private data | High |
| IP-069 | Ad hoc AI JSON cleanup/parsing | `LEGACY_INTERVIEW_PREP/backend/controllers/aiController.js` | IMPLEMENTED | REJECT | SUPPORTED | Require strict active output schemas | Unvalidated output | High |
| IP-070 | Embedded provider/model choice | `LEGACY_INTERVIEW_PREP/backend/controllers/aiController.js` | IMPLEMENTED | REJECT | NOT APPLICABLE | Keep provider selection server-configured | Client/product coupling | High |
| IP-071 | Broad CORS behavior | `LEGACY_INTERVIEW_PREP/backend/server.js` | IMPLEMENTED | REJECT | NOT APPLICABLE | Preserve active allowlist | Cross-origin exposure | High |
| IP-072 | Public static uploads | `LEGACY_INTERVIEW_PREP/backend/server.js` | IMPLEMENTED | REJECT | NOT APPLICABLE | Exclude uploads/recordings | Same-origin active content/privacy | High |
| IP-073 | Unauthenticated image upload | `LEGACY_INTERVIEW_PREP/backend/routes/authRoutes.js` | IMPLEMENTED | REJECT | NOT APPLICABLE | Exclude | Unowned upload abuse | High |
| IP-074 | Stored profile-image URL | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/components/Cards/ProfileInfoCard.jsx` | IMPLEMENTED | REJECT | NOT APPLICABLE | Use current account display only | URL/provenance/privacy | High |
| IP-075 | Fixed localhost API origin | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/utils/apiPaths.js:1` | IMPLEMENTED | REJECT | NOT APPLICABLE | Keep current configured shared base URL | Deployment incompatibility | High |
| IP-076 | Legacy Axios client | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/utils/axiosInstance.js` | IMPLEMENTED | REJECT | NOT APPLICABLE | Use active `apiRequest` only | Persistent token and duplicate refresh | High |
| IP-077 | Legacy unauthorized redirect | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/utils/axiosInstance.js:27-45` | IMPLEMENTED | REJECT | NOT APPLICABLE | Keep active one-retry refresh lifecycle | Full-page redirect/state loss | High |
| IP-078 | Request cancellation | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/pages/InterviewPrep/InterviewPrep.jsx` | UNKNOWN | REBUILD | SUPPORTED | Forward `AbortSignal` and sequence-guard results | Stale private data rendered | Medium |
| IP-079 | Dashboard loading/empty/error states | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/pages/Home/Dashboard.jsx` | PARTIAL | REBUILD | SUPPORTED | Add factual loading, empty, error, retry, pagination | Silent empty/error ambiguity | High |
| IP-080 | Session loading/not-found/error states | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/pages/InterviewPrep/InterviewPrep.jsx` | PARTIAL | REBUILD | SUPPORTED | Distinguish safe 404, validation, transport, job states | Silent stale workspace | High |
| IP-081 | Written practice attempts | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/pages/InterviewPrep/InterviewPrep.jsx` | UNKNOWN | REBUILD | SUPPORTED | Add controlled editor and explicit immutable record | Private answer handling | Medium |
| IP-082 | Feedback, scoring, and progress | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/pages/InterviewPrep/InterviewPrep.jsx` | UNKNOWN | REBUILD | SUPPORTED | Explicit request, owned polling, validated stored result | Score certainty and provider failure | Medium |
| IP-083 | Automated interview tests | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/` | UNKNOWN | REBUILD | PARTIALLY SUPPORTED | Add focused contract/UI/security coverage | No safe legacy test evidence | High |
| IP-084 | React starter SVG | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/assets/react.svg` | DEAD OR UNREACHABLE | REJECT | NOT APPLICABLE | Do not copy | Dead unknown-provenance asset | High |
| IP-085 | Vite starter SVG | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/public/vite.svg` | DEAD OR UNREACHABLE | REJECT | NOT APPLICABLE | Do not copy | Dead framework asset | High |
| IP-086 | Hero PNG | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/assets/hero-img.png` | IMPLEMENTED | REFERENCE ONLY | NOT APPLICABLE | Do not copy; provenance/licence unresolved | Copyright and provenance | High |
| IP-087 | Note-path constant without caller | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/utils/apiPaths.js:29` | DEAD OR UNREACHABLE | REJECT | SUPPORTED | Replace with tested active API function | Dead code is not implementation | High |
| IP-088 | Load-more failure handler | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/pages/InterviewPrep/InterviewPrep.jsx:121-128` | DEAD OR UNREACHABLE | REJECT | SUPPORTED | Build typed safe error handling | References an undefined setter | High |
| IP-089 | Unvalidated client image selection | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/components/Inputs/ProfilePhotoSelector.jsx` | IMPLEMENTED | REJECT | NOT APPLICABLE | Exclude | File validation and privacy | High |
| IP-090 | Object-URL image preview lifecycle | `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/components/Inputs/ProfilePhotoSelector.jsx` | PARTIAL | REJECT | NOT APPLICABLE | Exclude | Resource cleanup and private preview | High |

## 5. Architecture inventory

| Element | Legacy evidence | Assessment | Decision |
| --- | --- | --- | --- |
| Frontend | React with Vite entry | Active equivalent already exists | REJECT legacy setup |
| Router | Browser routes declared in one app component | Active router already exists | REJECT legacy hierarchy |
| State | Component state plus a user context | Useful state is local; auth model conflicts | REBUILD feature state; REJECT context |
| Fetching | Axios calls inside pages/components | Duplicates current transport | REJECT |
| Forms | Controlled local state with manual checks | Product fields are useful | REBUILD |
| Styling | Tailwind utilities, global CSS, remote font | Incompatible with current CSS architecture | REFERENCE ONLY |
| Animation | Framer Motion question transitions and CSS blobs | Nonessential and not reduced-motion aware | REJECT |
| Charts | No safe evidence | Not required | NOT APPLICABLE |
| Audio/video | No safe evidence | Unsupported | REJECT for Phase 10 |
| API client | Axios interceptor with browser token | Conflicts with current shared client | REJECT |
| Backend | Express routes/controllers | Active backend already exists | REJECT |
| Database | MongoDB models | Active models already exist | REJECT |
| Authentication | Legacy JWT/token flow | Conflicts with accepted auth | REJECT |
| AI | Direct synchronous provider endpoints | Active gateway/jobs control | REJECT |
| Storage | Static upload behavior observed | Not part of Interview Coach | REJECT |
| Jobs | No job flow observed | Active durable job system exists | REBUILD UI around active jobs |
| Validation | Ad hoc form and AI parsing | Active strict schemas control | REJECT |
| Testing | No safe test/spec artifact found | Evidence gap | REBUILD coverage |

No package manifest, lockfile, environment file, database configuration,
prompt file, upload content, or dependency folder was opened for reuse.
Model filenames and bounded structural fields were inspected only to establish
inventory and rejection; no legacy model is a migration source.

## 6. State and data-flow review

Legacy state is page-local except for its rejected user context. The dashboard
loads all sessions into one array. The session page loads one route-selected
session containing populated questions. It maintains separate booleans for
explanation loading and question-update loading, plus drawer and explanation
state. It does not show cancellation, request sequencing, pagination, or a
coherent job state machine.

The create flow is:

1. Collect role, experience, focus topics, and description.
2. Call a synchronous AI endpoint for a fixed generated batch.
3. Accept the returned question-and-answer array in the browser.
4. Send that array to a session persistence endpoint.
5. Navigate using an unchecked returned identifier.

The additional-generation flow repeats the same client-mediated AI and
persistence sequence. The explanation flow sends question text, receives raw
content, and displays it as Markdown. Current active contracts replace these
flows with authenticated ownership, strict request/output validation,
idempotent durable jobs, canonical persistence, and reload of allowlisted
server records.

## 7. AI behavior review

- Initiation is explicit for initial generation, another batch, and
  explanation, but initial generation is coupled automatically to session
  creation.
- Context includes role, experience, focus topics, and question text. These are
  private.
- A prompt module and direct provider controller exist by filename/import
  evidence. Prompt contents were not inspected or reproduced.
- Generation is synchronous from the client perspective; no owned job status,
  cancellation, or idempotency evidence exists.
- Generated question data crosses the browser before persistence.
- Parsing is ad hoc rather than an evidenced strict output boundary.
- Another batch uses a fixed count and can be repeated without a client request
  ID.
- Explanations are rendered through a Markdown component that permits provider
  links and images.
- No safe evidence shows attempt-specific persisted feedback.

Reject every legacy AI implementation detail. Phase 10 may use only the active
AI gateway, output schemas, owned job records, deduplication, and explicit
actions. Generated text must be described as model-generated guidance, not a
guarantee of interview or hiring outcomes.

## 8. Session and question review

Useful session concepts are a compact library, a clear create action, role and
experience context, focus topics, descriptive context, question count, and
last-updated display. The active model additionally supports title, skill
gaps, source resume/version, mode, status, and completion time.

Useful question concepts are a readable ordered list, progressive answer
reveal, pinning, explanations, and requesting another batch. Active contracts
also support manual questions, category and difficulty filters, duplicate
fingerprints, a session capacity, pagination, study/practice reveal rules, and
generated source metadata.

Legacy deletion, client-persisted generated batches, index-based fallback keys,
and unbounded "load more" behavior do not migrate. Editing, deletion, and
reordering have no active backend route and are not Phase 10 journeys.

## 9. Notes, pinning and explanation review

Pinning is visibly implemented and pinned-first ordering is present in legacy
server evidence. Active support is stronger: nested owned routes accept an
explicit boolean, lists sort pinned questions first, and user identity is
server-derived.

Notes are advertised and a path constant/backend route exists, but no inspected
frontend notes control calls it. Treat the legacy experience as a placeholder.
The active contract supports private notes up to 8,000 characters and an empty
string clears them.

The legacy explanation drawer is a useful information-architecture reference
but lacks complete dialog or region behavior. Active explanations are
idempotent jobs and may already be available. Phase 10 must represent both
`200 alreadyAvailable` and `202 job` responses, poll the owned job, then load a
validated canonical question detail.

## 10. Attempt and feedback review

No safe legacy source evidenced a written-answer editor, attempt submission,
attempt history, attempt identity, feedback request, feedback job, structured
feedback, retry, or score presentation. These are `UNKNOWN`, not runtime-proven
absences.

The active backend supports immutable written attempts, newest-first paginated
history, optional question/status filters, attempt detail, explicit feedback
enqueue, and stored feedback with score, summary, strengths, improvements, and
suggested outline. These journeys must be rebuilt from active contracts.

## 11. Security and privacy review

Private interview data includes session context, job descriptions, questions,
answers, notes, attempts, feedback, scores, history, prompts, and provider
results. Material legacy risks are:

- access tokens read from and written to browser storage;
- a duplicate API client and authentication owner;
- route rendering used as a protection substitute;
- session and nested-resource lookups without consistent authenticated-user
  binding;
- client-supplied session ownership context;
- direct provider calls and raw generated data in the browser;
- public upload/static-file behavior;
- response and error logging;
- raw Markdown links and images;
- broad response objects and weak validation;
- synchronous multi-write persistence without active transactional guarantees.

Phase 10 must preserve the current memory-only access token, HttpOnly refresh
cookie, central client, server-derived ownership, nested
session-question-attempt binding, safe 404 behavior, private no-store headers,
request IDs, strict bodies, allowlisted DTOs, owned jobs, output validation,
idempotency, and no private browser persistence or logging.

## 12. Accessibility and responsive review

Source shows mobile/desktop utility breakpoints, a responsive dashboard grid,
a full-width mobile drawer, native buttons, loading visuals, and some accessible
names. It does not establish accessible runtime behavior.

Observed gaps include labels without `for`/ID association, icon controls
without names, clickable headings/cards, missing disclosure state, no modal
role/name/focus trap/return, no Escape handling, an off-screen drawer without
clear focus exclusion, visual-only spinners, hover-revealed destructive
controls, animation without reduced-motion evidence, and no status/error
announcement system.

Phase 10 needs semantic headings, associated labels, error summaries,
live-status regions, native buttons, visible focus, keyboard disclosure,
managed dialogs where used, Escape and focus return, non-color states,
reduced-motion support, responsive reflow at 1440, 1024, 768, 390, and 320
pixels, and browser checks at 200% zoom.

## 13. Asset and provenance review

| Asset | Type/usage | Provenance/licence | Personal data | Accessibility | Classification |
| --- | --- | --- | --- | --- | --- |
| `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/assets/hero-img.png` | PNG marketing hero | Unknown | No personal data established from metadata | Alt/use requires review | REFERENCE ONLY |
| `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/src/assets/react.svg` | Framework starter SVG, no use found | Unknown | None established | Decorative at best | REJECT |
| `LEGACY_INTERVIEW_PREP/frontend/interview-prep-ai/public/vite.svg` | Framework starter SVG, no use found | Unknown | None established | Decorative at best | REJECT |
| Remote Urbanist font import | External font reference | Unknown for migration | Not applicable | Network and fallback behavior unresolved | REJECT |

No asset was copied. Unknown provenance prevents `PORT`.

## 14. Test and verification inventory

- No safe legacy test or spec filename was found.
- No legacy command ran, so no legacy runtime, lint, build, test, network,
  database, AI, browser, accessibility, or responsive behavior is verified.
- The active frontend has shared client and route tests but no
  interview-specific contract or UI test file.
- The active backend has one interview IDOR security case covering cross-user
  session and nested-question 404 behavior.
- No focused active test was found for interview routes, schemas, pagination,
  idempotency races, workers, output validation, attempt feedback lifecycle,
  or no-store behavior.

This phase ran no application tests by instruction.

## 15. Dead, duplicate and placeholder behavior

- Starter SVGs have no observed use.
- The note path has no observed frontend caller.
- The notes marketing claim is not backed by an inspected notes UI.
- The additional-generation catch path references a setter not defined in the
  inspected page.
- A not-found route is absent.
- Legacy auth, shell, router, API client, backend, database, provider, and
  upload systems duplicate or conflict with active architecture.
- Attempt and feedback capabilities are not evidenced in the safe legacy
  frontend.
- The active `InterviewDashboard` remains an unrouted scaffold with an example
  question, local fabricated attempts, placeholder IDs, and private input
  logging. It must be replaced, not routed unchanged. Evidence:
  `frontend/src/routing/router.tsx:77-96` and
  `frontend/src/features/interviews/InterviewDashboard.tsx:12-47,90-99`.

## 16. Classification totals

| Classification | Count |
| --- | ---: |
| PORT | 0 |
| REBUILD | 31 |
| REFERENCE ONLY | 9 |
| REJECT | 50 |
| **Total unique rows** | **90** |

The four classification counts reconcile to 90. IDs run sequentially from
`IP-001` through `IP-090`.

## 17. Highest-value concepts

- Owned session library with concise role/status/question-count summaries.
- Clear create-session context before question work begins.
- Route-owned session workspace.
- Readable questions with progressive disclosure.
- Server-preserved pinned-first ordering and explicit pin control.
- Private notes with visible save state.
- Explicit explanation requests with factual job state.
- Explicit bounded generation with deduplication and idempotency.
- Written attempts that remain tied to one session and question.
- Attempt-specific stored feedback with qualified score wording.
- Responsive study layout with accessible empty, loading, error, and terminal
  states.

## 18. Mandatory rejections

Reject all legacy authentication, registration, login, JWT/token handling,
browser-persisted tokens, user context, protected-route logic, API client,
backend routes/controllers/services, models, database configuration,
environment files, provider configuration, direct provider calls, prompts,
package manifests, lockfiles, dependency configuration, uploads, public file
serving, unknown assets/fonts, client ownership identifiers, weak IDOR, mass
assignment, raw AI/Markdown rendering, personal-data logging, fabricated
interviews/scores, unsupported hire-probability claims, automatic generation
coupled to persistence, automatic submission/feedback, free-form mutation,
unvalidated output, and dead starter artifacts.

No prompt, environment value, secret, credential, token value, private record,
legacy source block, or asset is reproduced here.

## 19. Evidence limitations

- Static source inspection cannot prove reachability, successful requests,
  visual behavior, accessibility, ownership, provider correctness, or data
  safety at runtime.
- Sensitive and private files were intentionally excluded.
- Package manifests and lockfiles were identified but not used as migration
  sources.
- Model structure was inspected only where needed to identify conflicts.
  Database configuration, prompts, upload middleware, and private-data
  contents were not inspected.
- The legacy folder is not a Git repository, so there is no legacy Git status
  to compare.
- Asset ownership and licence are unknown.
- No safe tests were found and none ran.
- Active job-worker and AI readiness are environment-dependent and were not
  checked.
- Active response serialization and full interview route behavior require
  focused Phase 10 tests.
- Final document line counts and SHA-256 values are calculated after
  finalization and reported in the Phase 9 completion report; a document
  cannot stably contain its own final hash.

## 20. Phase 10 implications

Phase 10 should replace the unrouted active scaffold with a feature-local,
validated integration using the existing protected routes, `AppShell`,
`AuthProvider`, shared `apiRequest`, active backend contracts, and existing CSS
architecture. It should implement only approved owned list/create/open,
manual/generated questions, pinning, notes, explanations, written attempts,
attempt history, explicit feedback, job polling, and factual states.

Do not implement deletion, question editing/reordering, audio/video, speech,
timer, sharing, export, public sessions, analytics, leaderboard, automatic
generation, automatic submission, automatic feedback, free-form AI mutation,
or unbounded regeneration without separate active backend evidence and
authorization. Phase 10 remains `PLANNED`.
