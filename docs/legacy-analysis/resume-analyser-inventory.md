# AI Resume Analyser Legacy Inventory

## 1. Inspection metadata

- Inspection date: 2026-07-24
- Active repository branch: `phase-10-unified-frontend`
- Active starting HEAD: `618b6b6`
- External reference: `LEGACY_RESUME_ANALYSER`
- Authorization: temporary read-only source, style, asset-metadata, manifest,
  and test inventory
- Execution: prohibited and not performed
- Dependency installation: prohibited and not performed
- Environment files: identified by filename only and not opened
- AI and network calls: prohibited and not performed
- Runtime verification: not performed
- Visual QA: not applicable because no visible application file changed

`IMPLEMENTED` in this report means the behavior is present in source. It does
not claim that the legacy application runs correctly.

## 2. Project summary

The legacy project has a React and Vite JavaScript frontend with React Router,
TanStack Query, Tailwind CSS, Framer Motion, Recharts, React Dropzone, Axios,
and React PDF. Its separate Express and MongoDB backend uses Multer, PDF Parse,
Zod, and a direct Gemini integration
(`LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/package.json:L1-L40`;
`LEGACY_RESUME_ANALYSER/backend/package.json:L1-L36`).

The protected application contains dashboard, resume list, resume detail,
export, insights, versions, history, and settings screens. Its primary flow is
PDF upload, synchronous text extraction and AI parsing, optional role-based
analysis, score and recommendation display, selected rewrite application,
automatic re-analysis, comparison, and export.

Strengths:

- Clear upload, analyse, review, and apply journey.
- Useful factual UI concepts for loading, empty, analysis, suggestion, and
  version states.
- Before-and-after suggestion review with explicit selection.
- Visual concepts for score breakdown, issues, strengths, and keywords.

Limitations:

- The backend, auth, API, database, provider, configuration, and persistence
  boundaries are incompatible with the active repository.
- Upload and analysis are synchronous and do not use the active job system.
- The implemented form accepts a target role but no job description.
- Analysis language overstates ATS certainty.
- Rewrite fallback can append generated text, and a successful rewrite
  automatically starts another provider call.
- Raw resume text and parsed personal data cross provider and persistence
  boundaries.
- No test scripts or safe test files were found.

No package, backend, API, database, authentication, AI provider, prompt,
component, or style reuse is recommended.

## 3. Route and screen inventory

| Screen | Evidence | Reachability | Purpose | Status | Classification | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| Landing and public authentication | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/routes.jsx:L30-L36` | Public routes | Product framing and sign-in entry | PARTIAL | REFERENCE ONLY | Useful information architecture only; active public routes and auth control the product. |
| Dashboard | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/routes.jsx:L37-L39` | Protected | Summary metrics and recent activity | PARTIAL | REJECT | The implementation relies on legacy aggregates and unsupported metrics. |
| Resume list and upload | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/pages/Resumes.jsx:L11-L63` | Protected | List resumes and import PDF | IMPLEMENTED | REBUILD | The flow is valuable, but active owned list and asynchronous import contracts must control it. |
| Resume detail and analysis | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/pages/ResumeDetail.jsx:L28-L267` | Protected | Inspect parsed content, analyse, and apply rewrites | PARTIAL | REBUILD | Rebuild around canonical versions, jobs, validated analysis, and stored suggestion IDs. |
| Export | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/pages/Export.jsx:L16-L155` | Protected | Select a version, preview, and download | IMPLEMENTED | REFERENCE ONLY | Export has no approved active backend contract and is excluded from Phase 8. |
| Insights | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/pages/Insights.jsx:L34-L167` | Protected | Aggregate score and issue trends | IMPLEMENTED | REJECT | Global analytics are unsupported and inherit model-score uncertainty. |
| Versions | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/pages/Versions.jsx:L19-L116` | Protected | Search and filter versions | IMPLEMENTED | REBUILD | Retain per-resume history only; do not add unsupported global analytics. |
| History | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/pages/History.jsx:L55-L194` | Protected | Chronological activity | PARTIAL | REFERENCE ONLY | Per-resume version history is useful; a new global activity contract is not justified. |
| Settings | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/routes.jsx:L47-L48` | Protected | User preferences | PARTIAL | REJECT | Active account and preference surfaces are outside Resume Studio scope. |

## 4. Feature decision matrix

| ID | Feature | Evidence | Status | Classification | Active backend support | Phase 8 action | Risks | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RA-001 | Screen and route information architecture | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/routes.jsx:L30-L49` | IMPLEMENTED | REFERENCE ONLY | NOT APPLICABLE | Use as screen inventory only within the active shell and two approved routes. | A second route hierarchy would fragment navigation. | HIGH |
| RA-002 | Legacy authentication and protected shell | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/routes.jsx:L17-L28` | IMPLEMENTED | REJECT | NOT APPLICABLE | Use active auth, `AuthRoute`, and `AppShell`. | Incompatible identity and token lifecycle. | HIGH |
| RA-003 | Package and dependency configuration | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/package.json:L1-L40`; `LEGACY_RESUME_ANALYSER/backend/package.json:L1-L36` | IMPLEMENTED | REJECT | NOT APPLICABLE | Do not copy or install. | Creates a second dependency and configuration boundary. | HIGH |
| RA-004 | Legacy API client and coupled hooks | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/api/resumes.js:L1-L28`; `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/hooks/useResumes.js:L1-L134` | IMPLEMENTED | REJECT | NOT APPLICABLE | Use the active shared API client and feature API boundary. | Wrong routes, auth, response shapes, and synchronous assumptions. | HIGH |
| RA-005 | Request states, feedback, and retry concepts | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/hooks/useResumes.js:L54-L112` | PARTIAL | REBUILD | NOT APPLICABLE | Build independent factual states with cancellation, retry, and stale-response protection. | Toast-only failures and hidden automatic retry obscure state. | HIGH |
| RA-006 | Theme and toast patterns | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/context/ThemeContext.jsx:L5-L32`; `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/context/UIContext.jsx:L26-L71` | IMPLEMENTED | REFERENCE ONLY | NOT APPLICABLE | Use only interaction ideas compatible with the active design system. | Local preference persistence and second theme boundary. | HIGH |
| RA-007 | Resume list and selection | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/pages/Resumes.jsx:L11-L63` | IMPLEMENTED | REBUILD | SUPPORTED | Build owned pagination, open, empty, error, retry, and cancellation states. | Legacy list assumes different data and cache contracts. | HIGH |
| RA-008 | PDF drag/drop and client validation | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/components/resume/UploadDropzone.jsx:L18-L51`; `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/components/resume/UploadDropzone.jsx:L59-L147` | IMPLEMENTED | REBUILD | SUPPORTED | Submit one titled PDF to the active import route and prevent duplicate submission. | Legacy 5 MB limit differs from the active 15 MB policy. | HIGH |
| RA-009 | Upload validation and PDF extraction | `LEGACY_RESUME_ANALYSER/backend/src/middleware/upload.js:L4-L28`; `LEGACY_RESUME_ANALYSER/backend/src/services/pdfService.js:L4-L32` | IMPLEMENTED | REBUILD | SUPPORTED | Consume the active private-asset and queued import behavior only. | MIME-only legacy validation and synchronous processing are unsafe. | HIGH |
| RA-010 | Structured resume extraction | `LEGACY_RESUME_ANALYSER/backend/src/routes/resumes.js:L46-L77`; `LEGACY_RESUME_ANALYSER/backend/src/services/structuredParser.js:L199-L227` | PARTIAL | REBUILD | SUPPORTED | Poll the active job and load the server-created canonical resume. | Legacy parsing silently falls back to an empty structure. | HIGH |
| RA-011 | Parsed-section preview | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/pages/ResumeDetail.jsx:L271-L434` | IMPLEMENTED | REBUILD | SUPPORTED | Render canonical content in the common Resume Studio preview. | Excessive personal-data exposure and incomplete active sections. | HIGH |
| RA-012 | Target-role input | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/pages/ResumeDetail.jsx:L53-L65`; `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/pages/ResumeDetail.jsx:L157-L179` | IMPLEMENTED | REBUILD | SUPPORTED | Require a bounded target role for analysis. | Legacy UI treats the role as optional. | HIGH |
| RA-013 | Job-description matching | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/components/landing/FeaturesSection.jsx:L28-L31`; `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/pages/ResumeDetail.jsx:L157-L162` | PLACEHOLDER | REJECT | SUPPORTED | Do not migrate the false claim; if Phase 8 exposes the active optional field, label and validate it factually. | Marketed behavior is absent from the legacy product. | HIGH |
| RA-014 | Analysis submission, progress, failure, retry | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/pages/ResumeDetail.jsx:L144-L202` | PARTIAL | REBUILD | SUPPORTED | Queue analysis, poll its owned job, and show terminal failure or retry. | Legacy synchronous mutation lacks progress and cancellation. | HIGH |
| RA-015 | Score, verdict, and model disclosure | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/pages/ResumeDetail.jsx:L204-L228` | IMPLEMENTED | REBUILD | SUPPORTED | Display the validated 0 to 100 assessment with careful model-generated wording. | The legacy ATS-score label implies vendor compatibility not proved by the contract. | HIGH |
| RA-016 | Score breakdown | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/components/analysis/ScoreBreakdown.jsx:L4-L56` | IMPLEMENTED | REBUILD | PARTIALLY SUPPORTED | Use active `keywordMatch`, `clarity`, `evidence`, and `formatting` categories only. | Legacy `impact` category conflicts with the active schema. | HIGH |
| RA-017 | Issues, severity, explanation, and fixes | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/components/analysis/IssuesList.jsx:L8-L82` | IMPLEMENTED | REBUILD | SUPPORTED | Render validated bounded issues and safe explanatory text. | Generated guidance may be incomplete or wrong. | HIGH |
| RA-018 | Strengths and evidence | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/components/analysis/StrengthsList.jsx:L4-L44` | IMPLEMENTED | REBUILD | SUPPORTED | Render the active strengths collection without certainty claims. | Generated evidence is not independently verified. | HIGH |
| RA-019 | Missing keywords and coverage | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/components/analysis/KeywordChips.jsx:L47-L185` | PARTIAL | REBUILD | SUPPORTED | Show validated missing keywords tied to the submitted target context. | Legacy “ATS expects” language and coverage percentage are unsupported. | HIGH |
| RA-020 | Rewrite review and selection | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/components/analysis/BulletRewrites.jsx:L27-L53`; `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/components/analysis/BulletRewrites.jsx:L145-L180` | IMPLEMENTED | REBUILD | SUPPORTED | Show original, proposed, rationale, verification warning, selection, and confirmation. | Legacy select-all and empty-selection semantics can cause unintended application. | HIGH |
| RA-021 | Apply selected rewrites as a new version | `LEGACY_RESUME_ANALYSER/backend/src/routes/resumes.js:L262-L319` | IMPLEMENTED | REBUILD | SUPPORTED | Send only stored selected UUIDs and adopt the canonical returned version. | Stale analysis and changed source bullets must surface conflicts. | HIGH |
| RA-022 | Fallback append and automatic re-analysis | `LEGACY_RESUME_ANALYSER/backend/src/routes/resumes.js:L218-L230`; `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/pages/ResumeDetail.jsx:L67-L91` | IMPLEMENTED | REJECT | NOT SUPPORTED | Never append unmatched text or start a new analysis without explicit action. | Silent content corruption, cost, and unconsented provider call. | HIGH |
| RA-023 | Version switching, list, filters, and search | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/components/resume/VersionSwitcher.jsx:L3-L22`; `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/pages/Versions.jsx:L19-L116` | IMPLEMENTED | REBUILD | PARTIALLY SUPPORTED | Implement paginated per-resume history and snapshot viewing. | Global search/filter route is not supported. | HIGH |
| RA-024 | Word and line version diff | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/components/resume/DiffView.jsx:L87-L165`; `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/components/resume/DiffView.jsx:L264-L300` | IMPLEMENTED | REBUILD | PARTIALLY SUPPORTED | Defer rich diff unless it fits the approved history step without a new backend route. | Client diff can misrepresent structured changes. | HIGH |
| RA-025 | Resume activity history | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/pages/History.jsx:L55-L194` | PARTIAL | REBUILD | PARTIALLY SUPPORTED | Use per-resume immutable version metadata, not a global activity feed. | Legacy history is unpaginated and exposes titles and scores. | HIGH |
| RA-026 | Aggregate insights and score evolution | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/pages/Insights.jsx:L34-L167` | IMPLEMENTED | REBUILD | NOT SUPPORTED | Exclude from Phase 8. | Unsupported aggregates amplify uncertain AI scores. | HIGH |
| RA-027 | PDF preview and download/export | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/pages/Export.jsx:L16-L155` | IMPLEMENTED | REBUILD | NOT SUPPORTED | Keep on-screen preview only; defer export to an approved contract. | Fidelity, privacy, filename, pagination, and accessibility are unverified. | HIGH |
| RA-028 | Resume deletion | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/components/resume/ResumeRow.jsx:L8-L16`; `LEGACY_RESUME_ANALYSER/backend/src/routes/resumes.js:L118-L127` | IMPLEMENTED | REBUILD | NOT SUPPORTED | Exclude from Phase 8. | No active archive/delete contract or recovery behavior. | HIGH |
| RA-029 | Provider calls and prompts | `LEGACY_RESUME_ANALYSER/backend/src/services/geminiService.js:L140-L189`; `LEGACY_RESUME_ANALYSER/backend/src/services/structuredParser.js:L199-L227` | IMPLEMENTED | REJECT | NOT APPLICABLE | Use the active AI gateway and validated schemas only; do not copy prompts. | Full resume text crosses a legacy provider boundary. | HIGH |
| RA-030 | Structured AI-output validation concept | `LEGACY_RESUME_ANALYSER/backend/src/services/geminiService.js:L11-L118`; `LEGACY_RESUME_ANALYSER/backend/src/services/geminiService.js:L170-L189` | PARTIAL | REFERENCE ONLY | SUPPORTED | Retain only the principle; active bounded validation controls behavior. | Legacy bounds and semantic validation are incomplete. | HIGH |
| RA-031 | Backend, database, storage, and configuration | `LEGACY_RESUME_ANALYSER/backend/src/models/ResumeVersion.js:L76-L109`; `LEGACY_RESUME_ANALYSER/backend/src/models/Analysis.js:L38-L73` | IMPLEMENTED | REJECT | NOT APPLICABLE | Use active resume, version, analysis, job, and private-asset modules. | Raw content, PII, AI output, and usage data use incompatible storage. | HIGH |
| RA-032 | Testimonials and ATS/performance claims | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/components/landing/TestimonialsSection.jsx:L5-L54`; `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/components/landing/BenefitsSection.jsx:L11-L36` | IMPLEMENTED | REJECT | NOT APPLICABLE | Do not migrate claims, identities, outcomes, or vendor-equivalence language. | Unsupported and potentially fabricated marketing evidence. | HIGH |
| RA-033 | Visual tokens, cards, badges, and grids | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/index.css:L5-L64`; `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/pages/ResumeDetail.jsx:L204-L267` | IMPLEMENTED | REFERENCE ONLY | NOT APPLICABLE | Use as visual research within the active design system. | Copying would introduce a second design system. | HIGH |
| RA-034 | Static images, icons, and provenance | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/README.md:L1-L18` | UNKNOWN | REJECT | NOT APPLICABLE | Do not copy assets with unknown ownership. | No product asset license or attribution was found. | MEDIUM |
| RA-035 | Responsive behavior | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/components/layout/AppShell.jsx:L36-L54`; `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/components/layout/Sidebar.jsx:L88-L101` | PARTIAL | REBUILD | NOT APPLICABLE | Design and verify active desktop, tablet, and mobile layouts. | Sidebar disappears without equivalent mobile navigation. | HIGH |
| RA-036 | Accessibility and keyboard behavior | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/components/ui/Tabs.jsx:L15-L56`; `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/components/ui/Checkbox.jsx:L4-L30` | PARTIAL | REBUILD | NOT APPLICABLE | Use semantic tabs, labels, focus, keyboard selection, and accessible result text. | Incomplete tab roles, icon names, focus, and chart alternatives. | HIGH |
| RA-037 | Automated tests and verification coverage | `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/package.json:L6-L10`; `LEGACY_RESUME_ANALYSER/backend/package.json:L10-L14` | UNKNOWN | REBUILD | NOT APPLICABLE | Add active API, component, route, ownership, job, and browser coverage. | No automated evidence exists. | HIGH |

## 5. Analysis workflow inventory

| Stage | Legacy behavior | Active controlling behavior | Phase 8 decision |
| --- | --- | --- | --- |
| Resume source | Upload one PDF and synchronously create a parsed legacy resume. | `POST /api/v1/resume-analyses/import-pdf` creates a private temporary asset and returns an owned queued job. | Rebuild upload and polling; never expose private storage keys. |
| Target role | Component-local role text is optional. | Analysis requires a bounded target role. | Make role required and explain why. |
| Job description | Claimed in marketing but no implemented input was found. | Active analysis accepts an optional bounded job description and company. | Expose only if approved in the Phase 8 form; do not claim legacy support. |
| Submission | Direct synchronous mutation. | Queue against an owned resume and optional owned version. | Disable duplicate submission and retain the submitted version identity. |
| Progress | Spinner only. | Poll owned job states `queued`, `processing`, `completed`, `failed`, or `cancelled`. | Show factual progress and terminal states; stop polling on unmount or replacement. |
| Result | Analysis is returned by the mutation. | Fetch the persisted owned analysis after job completion. | Validate the job result and analysis response before display. |
| Score | Presented as an ATS score. | Server calculates a bounded total from four validated categories. | Call it an AI-assisted resume assessment, not ATS certification. |
| Breakdown | Keywords, formatting, impact, and clarity. | `keywordMatch`, `clarity`, `evidence`, and `formatting`. | Use active names and values only. |
| Suggestions | Before/after text, rationale, selection, and apply-all. | Stored suggestions have UUID, stable bullet ID, original, rewrite, rationale, and verification flag. | Submit only explicitly selected stored UUIDs. No empty-means-all behavior. |
| History | Global and per-resume legacy pages. | Owned paginated analyses plus immutable per-resume versions. | Keep analysis and version history inside the resume workspace. |
| Apply | Text matching, fallback append, new version, then automatic re-analysis. | Active service verifies analysis, source version, original bullet, and selected IDs, then creates one immutable version. | Use the active atomic apply response. Never append or auto-analyse. |
| Error and retry | Toasts and query retry with limited user control. | Structured errors carry request IDs; jobs expose terminal failure. | Show safe error, request ID, retry action where valid, and reload for stale conflicts. |

## 6. AI-boundary findings

- Provider coupling: the legacy backend calls one provider directly. Reject the
  provider client and use the active AI gateway.
- Prompt handling: full resume text is interpolated into provider requests.
  Prompts were not copied, and Phase 8 must not log or expose them.
- Validation: the legacy JSON-schema and Zod pattern is useful evidence, but
  its string and collection bounds are incomplete. Active structured schemas
  and server score calculation control the result.
- Score trust: legacy labels imply ATS equivalence. Phase 8 must explain that
  the score is an AI-assisted assessment and can be wrong.
- Suggestion structure: the useful concept is a stored suggestion tied to an
  original bullet. Active UUID and stable bullet identity control the apply
  operation.
- Automatic mutation: fallback append and automatic re-analysis are rejected.
- Logging: provider errors and personal text must not reach client or server
  logs. Do not log job descriptions, results, selected IDs, or raw responses.
- Failure handling: an empty structure must not masquerade as a successful
  parse. Show job failure and a safe retry or next step.

## 7. UI and interaction patterns

- Useful concepts: single-file drop zone, title field, list skeletons, clear
  empty state, score summary, category cards, expandable issues, strengths,
  keyword chips, original-versus-proposed suggestions, selection count,
  version switcher, and confirmation before application.
- Rebuild requirements: explicit job progress, cancel stale polling, request
  IDs, empty selection behavior, conflict recovery, accessible tabs and
  checkboxes, non-color result labels, and mobile navigation.
- Problematic patterns: apply-all semantics, automatic provider calls,
  synchronous upload assumptions, ATS certainty, global analytics, hidden
  retries, and client-side PDF export presented as a verified output.
- The active shell, typography, spacing, components, and responsive rules must
  remain the only design system.

## 8. Static assets and provenance

| Normalized path | Type and dimensions | Purpose | Provenance | Classification | Copy status |
| --- | --- | --- | --- | --- | --- |
| `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/src/assets/hero.png` | PNG, 343×361 | Landing illustration | Unknown; no product attribution found | REJECT | Do not copy |
| `LEGACY_RESUME_ANALYSER/frontend/aiResumeTracker/public/favicon.svg` | SVG | Browser icon | Unknown | REJECT | Do not copy |
| Inline icon and chart rendering | Source-rendered graphics | Navigation and analysis decoration | Component libraries and local source, not approved product assets | REFERENCE ONLY | Recreate accessible equivalents with active dependencies only |
| External font references | Remote fonts | Typography | License and privacy use not established by this inspection | REJECT | Do not add |

No asset or font is classified `PORT`.

## 9. Technical architecture findings

- Authentication and shell: reject the legacy boundary; reuse active auth and
  protected routing.
- API and state: reject Axios helpers and TanStack Query hooks; the active
  shared client plus focused component hooks are sufficient.
- Backend and database: reject all Express routes, MongoDB models, raw-text
  persistence, usage records, and ownership logic.
- Persistence: use active canonical content, immutable versions, owned
  analyses, jobs, and private assets.
- Configuration: environment files were not opened. Reject manifests,
  lockfiles, Vite configuration, backend configuration, and provider settings.
- Upload handling: use the active 15 MB PDF policy, signature validation,
  quotas, private asset lifecycle, and asynchronous job.
- AI integration: use active structured parsing and analysis validation. Do
  not copy prompts or provider calls.
- Dependencies: no legacy dependency is authorized for addition.
- Testing: no safe automated test was found. Runtime claims remain unverified.

## 10. Security and privacy findings

- Resume text, parsed contact details, work history, education, and other
  personal data cross legacy provider and persistence boundaries.
- The legacy implementation has no job-description input, but Phase 8 must
  treat any submitted description as private user content.
- Prompts, resume text, job descriptions, analysis responses, provider errors,
  and selected suggestions must not be logged.
- Legacy provider output is only partially bounded and must not control active
  content directly.
- Legacy authentication, token handling, and ownership behavior are rejected.
  Active controllers derive ownership from authenticated server state.
- Imported PDFs must remain private; public or guessable asset URLs are
  prohibited.
- The active apply operation must continue to verify user, resume, analysis,
  version, suggestion IDs, and original bullet text.
- Unsupported testimonials, profiles, scores, and performance claims are not
  user data and must not migrate as sample production content.
- No secret value, environment value, prompt, or personal resume record is
  reproduced in this report.

## 11. Mandatory rejections

- Legacy authentication, authorization, token storage, and protected shell
- Legacy API client, query hooks, endpoints, and response assumptions
- Legacy backend, database models, provider client, prompts, and configuration
- Legacy manifests, lockfiles, environment files, and dependency versions
- Raw-text storage and synchronous upload/analysis architecture
- Unvalidated or incompletely bounded AI results
- Fallback appending of generated text
- Empty-selection means apply-all behavior
- Automatic re-analysis after mutation
- Unsupported ATS, job-description, timing, callback, testimonial, and vendor
  claims
- Global dashboard and insights metrics unsupported by active contracts
- Unproven static assets, fonts, and a second design system

## 12. Recommended retained concepts

### PORT

None. No source, style, static asset, copy block, prompt, or font passed the
required provenance, ownership, compatibility, accessibility, privacy, and
security checks.

### REBUILD

- Owned resume list and titled PDF import.
- Explicit asynchronous import and analysis progress.
- Canonical parsed-content preview.
- Required target role and optional approved job context.
- Validated score, breakdown, issue, strength, and keyword display.
- Stored suggestion review, explicit selection, confirmation, and application.
- Per-resume version and analysis history.
- Accessible, responsive loading, empty, error, retry, and conflict states.

### REFERENCE ONLY

- Broad information architecture.
- Theme and toast interaction research.
- Card, badge, pill, and responsive-grid visual research.
- Structured-output validation as a principle, not its code.

## 13. Open questions

1. Should Phase 8 expose the active optional company and job-description
   fields, or keep the smallest role-only analysis form? Recommendation:
   expose all active bounded inputs with clear privacy text.
2. Which supported template, palette, and font IDs can the active preview
   render? No catalog contract was found.
3. Should rich client-side version diff be deferred? Recommendation: ship
   factual history and snapshot viewing first.
4. What polling interval and maximum client wait should Phase 8 use?
   Recommendation: approve a bounded backoff policy before implementation.
5. Should the backend narrow analysis and job transport DTOs before the
   frontend consumes them? Current responses can contain fields the UI does
   not need.

## 14. Inventory totals

| Classification | Count |
| --- | ---: |
| PORT | 0 |
| REBUILD | 24 |
| REFERENCE ONLY | 4 |
| REJECT | 9 |
| UNKNOWN or unresolved evidence | 0 |
| Total feature rows | 37 |

The unknown provenance row is classified `REJECT`; no feature row remains
unresolved.
