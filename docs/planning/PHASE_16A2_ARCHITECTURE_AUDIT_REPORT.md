# Phase 16A-2 Architecture Audit Report

## 1. Document control

- Prompt:
  `CLH-PHASE-16A2-ROADMAP-AND-ARCHITECTURE-AUDIT-01`
- Phase: 16A-2 — Roadmap Amendment and Architecture Audit
- Mode: bounded documentation and read-only architecture inspection
- Date: 2026-07-29
- Status: `COMPLETED` / `APPROVED`
- Phase 16: `ACTIVE`
- Phase 16A-1: `COMPLETED` / `APPROVED`
- Phase 16B through Phase 16G: `PLANNED` / `INACTIVE`
- Phase 17: `PLANNED` / `INACTIVE`
- Accepted approval token:
  `PHASE_16A2_ROADMAP_ARCHITECTURE_AUDIT_APPROVED`
- Approval token accepted: yes

## 2. Goal and success criteria

Goal:

Produce the controlling, evidence-backed architecture and bounded future
implementation contracts for Phase 16B through Phase 16G without changing
production source, executable tests, contracts, packages, environment files,
or runtime behavior.

Success criteria:

- inspect current governance, architecture, and existing tests before
  recommending work;
- distinguish verified evidence from recommendation;
- classify every requested improvement;
- define exact future write/test/browser/human-review/cleanup contracts;
- preserve security, privacy, ownership, immutable Resume versions, AI
  provenance, private PDF, and Quiz secrecy;
- change only the five authorized planning documents;
- keep Phase 16B through Phase 16G and Phase 17 inactive;
- pass documentation scope and Git verification; and
- stop unstaged, uncommitted, and unpushed at the starting HEAD.

## 3. Baseline

- Working directory:
  `/Users/prabhathmalinda/Documents/Projects/Career Learning Hub`
- Repository root:
  `/Users/prabhathmalinda/Documents/Projects/Career Learning Hub`
- Branch: `phase-12-unified-frontend`
- Full HEAD: `f3b5ecb0e1f267348b6dcb933784f37a085ef8e5`
- Short HEAD: `f3b5ecb`
- Subject: `Organize full application browser tests`
- Starting worktree: clean
- Starting staged paths: none
- Starting untracked paths: none
- Active merge/rebase/cherry-pick/revert/bisect: none

## 4. Skill availability and application

Exact requested skills:

| Skill | Availability | Application |
| --- | --- | --- |
| `using-superpowers` | available | loaded; controlled skill discovery and precedence |
| `karpathy-guidelines` | available | loaded; inspection-first, surgical, evidence-led scope |
| `define-goal` | available | loaded; measurable audit goal and success criteria |
| `brainstorming` | available | loaded; used to compare bounded architecture options without implementing |
| `frontend-skill` | available | loaded; used for responsive/interaction planning |
| `frontend-design` | available | loaded; used for intentional shell, print, diff, and template constraints |
| `build-web-apps:react-best-practices` | unavailable under that exact name | not installed |
| `playwright` | available | loaded; used to classify future browser verification |
| `lighthouse-verification` | available | loaded; no Lighthouse source was changed |
| `technical-writing` | available | loaded; used for the controlling documents |
| `verification-before-completion` | available | loaded; governs final fresh checks |
| `finishing-a-development-branch` | available | loaded; applied only to review handoff, with commit/push options prohibited by this prompt |

The related `vercel-react-best-practices` skill was available and loaded as a
read-only React performance reference. `modern-web-guidance` was available,
but its prescribed latest-guidance command would use prohibited
download-capable `npx`; it was not executed. `graphify` was available, but no
`graphify-out/graph.json` existed and building one would write outside the
authorized manifest and may install/invoke prohibited services; direct
read-only repository inspection was used instead. No skill or package was
installed.

## 5. Governance evidence inspected

- `AGENTS.md`
- `docs/planning/CAREER_LEARNING_HUB_MASTER_PLAN.md`
- `docs/planning/CURRENT_PHASE.md`
- `docs/planning/PHASE_EXECUTION_TEMPLATE.md`
- `docs/planning/DECISION_LOG.md`
- `docs/planning/PHASE_16A1_BROWSER_TEST_MIGRATION_REPORT.md`
- `docs/testing/FULL_APPLICATION_BROWSER_TESTING.md`
- `docs/planning/PHASE_13_SHARED_DESIGN_UX_AUDIT.md`
- `docs/planning/PHASE_13_INTEGRATED_VERIFICATION_REPORT.md`
- `docs/planning/PHASE_14_E2E_IMPLEMENTATION_PLAN.md`
- `docs/planning/PHASE_14_E2E_VERIFICATION_REPORT.md`
- `docs/planning/PHASE_15_SECURITY_PRIVACY_REPORT.md`
- `docs/planning/PHASE_15_FINAL_SECURITY_CLOSEOUT_REPORT.md`
- `docs/security/PHASE_15_FINDING_REGISTER.md`
- active-repository legacy comparison:
  `docs/legacy-analysis/resume-builder-inventory.md` and
  `docs/legacy-analysis/resume-migration-plan.md`

Governance findings:

- Phase 16 was active and Phase 16A-1 was completed/approved.
- `CURRENT_PHASE.md` still named completed Phase 16A-1 as the active
  subphase; Phase 16A-2 was not yet recorded.
- The master-plan Phase 16 section described only Phase 16A-1 and required the
  approved 16A-2 through 16G structure.
- Phase 16B through Phase 16G and Phase 17 were inactive.
- Visible frontend changes require human visual QA.
- Commits require separate human authorization; push is prohibited.
- P15-001 operating restrictions remain binding.
- Historical Phase 13 evidence rejected breadcrumbs because the then-current
  depth was adequately served by back links. This was not a defect in the
  historical record. Phase 16 now explicitly makes contextual breadcrumbs
  mandatory, so the new requirement is recorded as a pending-review
  architecture decision.

## 6. Production and test evidence inspected

### Shell, routes, interaction, and styling

- `frontend/src/AppShell.tsx`
- `frontend/src/routing/router.tsx`
- `frontend/src/styles.css`
- `frontend/src/components/Dialog.tsx`
- `frontend/src/features/auth/AuthProvider.tsx`
- `frontend/src/features/resumes/ResumeListPage.tsx`
- `frontend/src/features/interviews/InterviewSessionListPage.tsx`
- `frontend/src/features/learning/LearningDashboard.tsx`
- all deep Resume, Interview, and Learning route components
- `frontend/src/routing/router.test.tsx`
- `frontend/src/components/Dialog.test.tsx`
- corresponding list/workspace tests

### Resume content, versions, print/design readiness, and AI

- `frontend/src/features/resumes/ResumeWorkspace.tsx`
- `frontend/src/features/resumes/ResumeEditor.tsx`
- `frontend/src/features/resumes/ResumePreview.tsx`
- `frontend/src/features/resumes/AiRecommendations.tsx`
- `frontend/src/features/resumes/types.ts`
- `frontend/src/features/resumes/resumeDraft.ts`
- `frontend/src/features/resumes/resumeApi.ts`
- `frontend/src/features/resumes/resumeContracts.ts`
- `frontend/src/features/resumes/resumeWorkspace.css`
- corresponding Resume component/API/contract/draft/polling tests
- `backend/src/modules/resumes/resume.types.ts`
- `backend/src/modules/resumes/resume.model.ts`
- `backend/src/modules/resumes/resumeVersion.model.ts`
- `backend/src/modules/resumes/resume.validation.ts`
- `backend/src/modules/resumes/resume.controller.ts`
- `backend/src/modules/resumes/resume.routes.ts`
- `backend/src/modules/resumes/resume.service.ts`
- `backend/src/modules/resume-analysis/resumeAnalysis.model.ts`
- `backend/src/modules/resume-analysis/resumeAnalysis.schemas.ts`
- `backend/src/modules/resume-analysis/resumeAnalysis.service.ts`
- `packages/shared-types/src/index.ts`

### Verification architecture

- root, frontend, and lockfile manifests, read-only
- all six browser specifications and browser harness/configuration files
- frontend polling implementations and tests
- Learning private-PDF object-URL lifecycle and tests
- current pagination implementations and tests
- current router import strategy
- prior build and browser verification evidence

No `.env` file or configured environment value was read.

## 7. AppShell and sidebar findings

Verified:

- The application has one protected `AppShell`, not a sidebar.
- Wide layouts use a sticky top header with duplicated desktop/mobile nav
  markup driven by one `navigationItems` array.
- The shell already provides skip navigation, one `main`, account name/email,
  logout, active styling, a 980px mobile transition, Escape closure, route
  closure, and focus return.
- React Router `NavLink` supplies active-route semantics; tests currently
  assert the active class.
- The current mobile menu is a disclosure-like grid, not a modal drawer; it
  does not trap focus or isolate background content.
- The shared native `Dialog` primitive has the required drawer foundation:
  initial focus, containment, Escape/backdrop policy, return focus, and tests.
- The current icon strategy is text-only plus the `CL` brand mark; no icon
  dependency exists.

Recommendation:

- Enhance `AppShell` rather than add another shell.
- Render one shared navigation-list component/data source in desktop sidebar
  and mobile drawer surfaces.
- Use expanded desktop sidebar by default. Keep optional collapse as local
  component-session state; do not add `localStorage`.
- Replace the mobile menu presentation with a `Dialog`-based drawer.
- Keep the existing account/logout behavior and auth boundary unchanged.
- Use small inline, decorative SVGs with visible labels; no dependency.

Backend or shared-contract change: none.

## 8. Create-menu route findings

Verified:

- Resume creation is an existing form on `/resumes`.
- Interview session creation is an existing form on `/interviews`.
- Learning upload is an existing expandable form on `/learning`.
- No separate create/upload routes exist.

Recommendation:

- Use `/resumes?action=create`, `/interviews?action=create`, and
  `/learning?action=upload`.
- Each route component recognizes only its allowed intent, opens/focuses the
  existing workflow, and ignores unknown values.
- Do not invent placeholder routes or invoke APIs from the shell.

## 9. Breadcrumb findings

Verified:

- No breadcrumb component or route-handle architecture exists.
- Deep route components already fetch canonical names:
  Resume title, Interview session title, Learning document title, flashcard
  set title, and Quiz title.
- Conversation and attempt pages also load their parent document/Quiz
  records.
- Loading and ownership-safe failure states deliberately avoid private titles.

Recommendation:

- Create one presentational breadcrumb component with a labelled `nav` and
  ordered list.
- Let each deep route assemble its crumbs from already loaded canonical data.
  This avoids duplicate fetches and a new global store.
- While loading, use safe generic labels. On failure, do not reveal a title.
- Never derive visible labels from route IDs.
- Keep the current-page crumb non-link. On mobile, visually truncate long
  text while preserving the full accessible text/title.
- Breadcrumbs supplement, and may replace duplicated back-link presentation
  only where the exact route remains equally discoverable.

Backend or shared-contract change: none.

## 10. Resume canonical-version and dirty-state findings

Verified:

- `ResumeWorkspace` loads a canonical Resume and current immutable version.
- Draft state is derived from that version and compared through a deterministic
  fingerprint.
- Dirty state has visible status, Save New Version, Discard, route blocking,
  a confirmation dialog, and `beforeunload`.
- Saving sends `expectedCurrentVersionId`; a 409 conflict becomes a safe
  reload-and-review action.
- Historical versions load by owned Resume/version IDs and render in a
  read-only snapshot.

Recommendation:

- Export only `workspace.version` or the explicitly loaded historical
  `snapshot`.
- Block export while dirty and make Save New Version/Discard the remediation.
- Do not use the mutable editor draft as the print source.

## 11. Resume print/export findings

Verified:

- `ResumePreview` renders all canonical sections in one ATS Classic article.
- It is hard-coded to “ATS Classic” and “A4”.
- The preview has an A4-like aspect ratio but no print stylesheet, print
  action, page-break contract, or filename utility.
- Resume design already persists page size (`A4`/`LETTER`) and the backend has
  an authenticated owner-scoped design patch.
- Links currently render as text, not clickable anchors.
- No PDF generation dependency is declared.

Recommendation:

- Use an in-place print-only `ResumePreview` surface, not a dedicated route.
- Use browser Print / Save as PDF without a dependency.
- Hide all application chrome and non-print Resume UI under `@media print`.
- Support A4/Letter from current design and Standard/Narrow as temporary
  print controls if time permits.
- Apply break avoidance to bounded entries but permit a single overlong entry
  to split; use widows/orphans and heading rules.
- Render useful safe links and black-on-white output.
- Temporarily set a sanitized document title as a best-effort filename hint.
- Do not promise a direct download filename or embedded PDF metadata.
- A page-sized preview surface remains conditional until browser evidence
  proves its fidelity.

Backend production change: none.

Shared-contract change: none.

Dependency change: none.

## 12. AI comparison and provenance findings

Verified:

- The frontend type and runtime parser require each suggestion's stored UUID,
  stable bullet UUID, non-empty original text, non-empty rewritten text,
  rationale, and verification flag.
- Analysis ID, Resume ID, and Resume-version ID are validated.
- Current UI shows rewritten text, rationale, warning, and selection but not
  original text or a diff.
- Missing/invalid original text rejects the analysis response at the trust
  boundary; partial unsafe data is not rendered.
- Apply sends the analysis ID and deduplicated stored suggestion IDs only.
- A confirmation dialog explains that a new immutable version is created.
- Backend apply revalidates owner, current version, analysis source version,
  selected IDs, target bullet, and exact original source text, then creates a
  transactional immutable `ai-rewrite` version.

Recommendation:

- Add Original/Suggested/Reason presentation without changing contracts.
- Use a small deterministic local word-token LCS diff; no dependency.
- Use `<del>`/`<ins>`, explicit Removed/Added text, and non-color borders or
  labels.
- Use desktop columns and tablet/mobile stacking.
- Preserve every current apply safeguard unchanged.

Backend or shared-contract change: none.

Explicitly deferred: editable suggestions, ratings, analytics, provider
retraining claims, automatic application, and computed Resume-version diff.

## 13. Templates and design findings

Verified:

- The Resume record persists `templateId`, `colorPaletteId`, `pageSize`,
  optional `fontFamily`, and `showProfilePhoto`.
- The owned backend design-patch endpoint already accepts a strict non-empty
  subset of those fields.
- The frontend validates returned design shape but does not expose design
  controls or an update API method.
- `ResumePreview` ignores persisted design and always displays ATS Classic/A4.
- Design is Resume-level mutable metadata, not part of immutable
  `ResumeVersion`.
- Current strings are length-bounded but are not an approved catalog.
- No line-spacing or print-margin field exists.
- Active-repository legacy analysis classifies legacy layouts as reference
  only and rejects copied source/assets, dependencies, public screenshots,
  mutable legacy models, and unsupported ATS claims.

Recommendation:

- ATS Classic remains mandatory.
- Entire Phase 16E remains conditional/time permitting.
- Use one typed frontend registry and one canonical Resume model.
- Modern Professional and Compact Technical, if implemented, stay
  single-column and print/ATS conservative.
- Bound font choices to local system stacks and palettes to contrast-verified
  Slate/Forest/Navy.
- Persist existing supported fields through the current endpoint.
- Treat historical content as immutable while clearly documenting that it
  renders with current Resume-level design.
- Keep margins temporary in Phase 16C.
- Omit spacing or label it session-only unless an exact separately approved
  persistence contract is added.

Default backend/shared production change: none.

## 14. Accessibility findings and future plan

Existing strengths:

- skip link, banner/header, main landmark, named navigation;
- visible global 3px focus ring;
- 44px shared target token;
- reduced-motion rules;
- native buttons/links/controls;
- tested dialog focus behavior;
- labelled forms and status text;
- previous human keyboard, 200% zoom, 320px, and responsive approval.

New surfaces requiring Phase 16F review:

- sidebar/rail/drawer landmarks and active state;
- drawer focus containment, outside-page isolation, Escape and return;
- breadcrumb label/order/current-page semantics and truncation;
- print controls and dirty-state guidance;
- diff `del`/`ins`, Removed/Added meaning, reading order, and selection;
- optional template controls and contrast;
- 200% zoom and 320px reflow after the shell layout changes.

Failure conditions include any keyboard trap, inaccessible name, lost focus
indicator, wrong focus return, color-only meaning, failed contrast, hidden
status/error, horizontal overflow, or unusable 200%/320px layout.

## 15. Performance findings and future plan

Verified:

- Every route page is statically imported by `router.tsx`.
- Prior builds recorded one 558.23 kB minified JS chunk above Vite's 500 kB
  advisory.
- No Lighthouse script/runner is declared.
- Lists use server pagination.
- Resume, Interview, and Learning polling is bounded and abortable.
- Learning private-PDF object URLs are revoked on replacement, failure, and
  unmount, with tests.
- Resume preview and AI suggestions render bounded contract arrays, but Phase
  16 adds print and diff work that must be measured with long valid content.

Recommendation:

- Establish a same-environment, three-run baseline before repair.
- Record build assets, route/viewport/cache state, LCP, CLS, blocking time,
  and route-specific observations.
- Treat the static import/single-chunk evidence as a candidate for route-level
  lazy loading in `router.tsx`.
- Do not memoize or virtualize without profiler/measurement evidence.
- Preserve pagination, bounded polling, cancellation, and object-URL cleanup.
- If no Lighthouse runner is already available, document the limitation and
  use available browser/build measurements; do not install one.

## 16. Backend, shared-type, and dependency impact

| Subphase | Backend production | Shared types | Dependency |
| --- | --- | --- | --- |
| Phase 16B | none | none | none |
| Phase 16C | none; use existing owned design endpoint | none | none |
| Phase 16D | none | none | none |
| Phase 16E | none in default conditional manifest | none | none |
| Phase 16F | none by default | none by default | none |
| Phase 16G | none | none | none |

An optional persisted line-spacing field is not authorized by this plan. It
would require a separately bounded backend/type/validation/default/test
decision.

## 17. Exact future manifests

The controlling exact path lists are in
`docs/planning/PHASE_16_ACADEMIC_MVP_IMPLEMENTATION_PLAN.md`.

Summary:

- Phase 16B: existing AppShell/global styles, new Breadcrumbs component,
  existing create-workflow pages, seven deep route pages, corresponding
  frontend tests, four browser specs, and three governance/report files.
- Phase 16C: Resume workspace/preview, new print controls/utility, existing
  Resume API/contracts/styles, six frontend tests, Resume browser spec, and
  three governance/report files.
- Phase 16D: AI recommendations, new comparison/diff files, Resume styles,
  six frontend tests, Resume browser spec, and three governance/report files.
- Phase 16E: typed registry/design controls, Resume preview/workspace/API/
  contracts/styles, seven frontend tests, one backend integration test of the
  existing endpoint, Resume browser spec, and three governance/report files.
- Phase 16F: router and router test only for the known measured route-loading
  candidate, plus three governance/report files. Any other confirmed repair
  requires a new exact manifest before editing.
- Phase 16G: five documentation paths only; no planned source/test write.

## 18. Feature classification decision

No requested classification required adjustment.

- Mandatory: sidebar, drawer, breadcrumbs, saved-version print/export,
  A4/Letter, dirty protection, original/suggested comparison, accessible diff,
  accessibility review, performance review, integrated verification.
- Conditional: margins, reliable page preview, two optional templates,
  bounded fonts/palettes, line spacing.
- Deferred: every post-MVP item listed in the controlling plan.
- Rejected: ATS scores/guarantees, arbitrary styling/fonts/CSS, copied legacy
  architecture, second design system, provider HTML, and automatic rewrite
  application.

## 19. Security, privacy, and deployment boundary

- P15-001 remains technically unresolved.
- Required operating restrictions remain:
  supervised academic evaluation; no unrestricted public-scale uploads;
  monitored storage; limited accounts and volume; enabled file/quota limits;
  no intentional concurrent upload/load stress against persistent deployed
  data; and manual cleanup readiness.
- Repair remains mandatory before public-scale registration/uploads,
  multi-worker/instance upload handling, meaningful persistent external object
  storage, commercial, production, or multi-tenant deployment.
- No Phase 16 architecture weakens authentication, ownership, private
  storage, Quiz secrecy, AI validation/provenance, or logging rules.
- Phase 16 authorizes no deployment, Atlas, provider, cloud storage, or real
  personal data.

## 20. Risks and stop conditions

- Sidebar/drawer restructuring touches every authenticated route; run the full
  browser workflow suite after focused checks.
- Breadcrumb titles must not leak through loading or ownership-safe failure
  states.
- Browser print differs by engine and user settings; wording must remain
  “Print / Save as PDF,” not guaranteed download.
- Browser print cannot guarantee a filename or embedded metadata.
- Long Resume entries can exceed one physical page; CSS must allow safe split
  rather than clip.
- Mutable Resume-level design means historical content does not have
  historical design snapshots.
- Unknown persisted design strings require a safe frontend fallback.
- Word-diff algorithms can create visual noise or excessive work; keep the
  utility deterministic, bounded by current contract lengths, and tested.
- New shell/print/diff surfaces can regress 320px reflow, 200% zoom, focus,
  contrast, or print.
- The documented bundle advisory is evidence to measure, not a license for a
  broad performance refactor.
- Any required file outside a subphase's exact manifest stops that subphase
  until the manifest is reviewed.

## 21. Browser and service decision

Source, tests, and prior verified browser evidence answered every architecture
question. This audit did not use a browser, start a frontend/backend/database
service, run Full Application Browser Testing, call a provider, or use Atlas.
No cleanup was required beyond confirming no audit-created runtime artifact.

## 22. Documentation write manifest

Modified:

- `docs/planning/CAREER_LEARNING_HUB_MASTER_PLAN.md`
- `docs/planning/CURRENT_PHASE.md`
- `docs/planning/DECISION_LOG.md`

Created:

- `docs/planning/PHASE_16_ACADEMIC_MVP_IMPLEMENTATION_PLAN.md`
- `docs/planning/PHASE_16A2_ARCHITECTURE_AUDIT_REPORT.md`

Decision-log entry `DEC-012` is `ACCEPTED`.

## 23. Readiness decision

The current architecture supports the mandatory Phase 16 academic-MVP work
without a new dependency, backend production change, shared-contract change,
route tree, design system, provider, storage boundary, or data model.

The operator approved Phase 16A-2 with
`PHASE_16A2_ROADMAP_ARCHITECTURE_AUDIT_APPROVED`. Phase 16A-2 is
`COMPLETED` / `APPROVED`.

Phase 16B remains inactive and requires a separate activation prompt.

Blockers: none.

## 24. Audit execution verification evidence (pre-approval)

- `git diff --check`: pass.
- Changed tracked paths: the three authorized existing planning documents.
- Untracked paths: the two authorized new planning documents.
- Changed production source: none.
- Changed executable tests or fixtures: none.
- Changed package or lockfile: none.
- Changed environment file: none.
- Staged paths: none.
- Branch remained `phase-12-unified-frontend`.
- Full HEAD remained
  `f3b5ecb0e1f267348b6dcb933784f37a085ef8e5`.
- Active Git operation: none.
- Browser use: none.
- Services started/stopped: none.
- Provider calls: none.
- MongoDB Atlas use: none.
- Generated audit artifacts: none; `playwright-report`, `test-results`,
  `coverage`, `frontend/dist`, `backend/dist`, and `graphify-out` were absent.
- Root typecheck: not run because the authorized diff is documentation-only
  and no source, executable test, contract, or configuration changed.
- Manual visual QA: not applicable because no visible UI changed.
- Commit: none.
- Push: none.

## 25. Approval closeout

- The operator accepted the audited architecture with
  `PHASE_16A2_ROADMAP_ARCHITECTURE_AUDIT_APPROVED`.
- Phase 15 remains `COMPLETED` /
  `APPROVED WITH ACCEPTED LIMITATIONS AND FORMAL DEFERRAL`.
- Phase 16 remains `ACTIVE`.
- Phase 16A-1 and Phase 16A-2 are `COMPLETED` / `APPROVED`.
- Phase 16B through Phase 16G and Phase 17 remain `PLANNED` / `INACTIVE`.
- DEC-012 is `ACCEPTED`.
- The approved architecture is unchanged from the review handoff.
- No production or test code changed.
- No package, lockfile, or environment file changed.
- No browser, runtime service, provider, Atlas resource, deployment, or
  visible UI was used or changed.
- Manual visual QA was not required because no visible UI changed.
- Commit authorization is exercised only for this five-document
  documentation closeout.
- Phase 16B requires a separate activation prompt.
- Push remains prohibited and has not occurred.
