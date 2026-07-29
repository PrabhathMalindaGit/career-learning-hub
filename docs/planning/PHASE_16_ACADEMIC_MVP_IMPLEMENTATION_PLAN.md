# Phase 16 Academic MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use
> `using-superpowers` and either `subagent-driven-development` or
> `executing-plans` only after the operator separately activates the relevant
> subphase. Track execution with checkboxes in the activated prompt. Do not
> treat this plan as implementation authorization.

**Goal:** Complete the bounded academic MVP with a responsive application
shell, saved-version Resume printing, accessible AI comparison, evidence-led
accessibility and performance review, and integrated verification.

**Architecture:** Extend the existing React/Vite frontend, protected route
tree, accessible dialog primitive, canonical Resume/version contracts, and
Full Application Browser Testing suite. Keep feature ownership local, avoid
new dependencies and backend work by default, preserve existing security and
privacy controls, and activate one reviewable subphase at a time.

**Tech stack:** React 19, React Router 7, TypeScript, Vite, Vitest, Testing
Library, Express, MongoDB/Mongoose, and the existing standalone Playwright
browser workflow harness.

## Global constraints

- Repository: `/Users/prabhathmalinda/Documents/Projects/Career Learning Hub`.
- Branch: `phase-12-unified-frontend`.
- Phase 16 is `ACTIVE`; only a separately approved subphase may be active.
- Phase 16A-1 is `COMPLETED` / `APPROVED`.
- Phase 16A-2 is `COMPLETED` / `APPROVED`.
- Phase 16B through Phase 16G and Phase 17 are `PLANNED` / `INACTIVE`.
- Do not install, update, or remove a dependency without separate approval.
- Do not introduce another frontend, backend, route tree, authentication
  system, database, storage boundary, provider, design system, or state
  library.
- Preserve in-memory access tokens, HttpOnly refresh cookies, owner-derived
  IDs, safe owned-resource 404 behavior, private PDF access, Quiz answer
  secrecy, strict response validation, request IDs, and log redaction.
- Preserve immutable Resume versions, stable entity IDs, stored analysis and
  suggestion IDs, source-version binding, stale-result rejection, explicit
  suggestion selection, confirmation, and transactional new-version creation.
- Do not use real personal data, production exports, provider calls, Atlas,
  cloud storage, or persistent screenshots, traces, videos, or reports.
- Visible React changes require automated checks plus human desktop, tablet,
  and mobile visual QA. Browser automation does not replace human approval.
- A root failure permits at most three code-changing repair attempts. Do not
  weaken tests or controls.
- Every subphase stops unstaged and uncommitted. Commit authorization is
  separate. Push remains prohibited.
- Full Application Browser Testing remains under `tests/browser/`, uses one
  worker and zero retries, and must retain ownership, private-PDF, Quiz
  secrecy, console-error, and horizontal-overflow coverage.

## Phase 16A-2 approval closeout

- The operator accepted this controlling architecture with
  `PHASE_16A2_ROADMAP_ARCHITECTURE_AUDIT_APPROVED`.
- DEC-012 is `ACCEPTED`.
- This approval does not activate Phase 16B or any later subphase.
- No production or test code, package, lockfile, environment file, browser,
  runtime service, provider, Atlas resource, deployment, or visible UI
  changed during the closeout.
- Manual visual QA was not required.
- Commit authorization applies only to the five Phase 16A-2 planning
  documents. Push remains prohibited and has not occurred.

## Evidence boundary and assumptions

This plan is based on source, test, manifest, and prior verification evidence
at full HEAD `f3b5ecb0e1f267348b6dcb933784f37a085ef8e5`.

Verified facts:

- `frontend/src/AppShell.tsx` owns the authenticated header, desktop and
  mobile navigation, account summary, logout, skip link, main landmark,
  active-route class, mobile Escape behavior, and focus return.
- `frontend/src/components/Dialog.tsx` wraps native `<dialog>` with tested
  initial focus, containment, Escape policy, backdrop policy, and focus
  restoration.
- `frontend/src/routing/router.tsx` statically declares every public,
  protected, list, and deep workspace route.
- Deep route components already load the canonical titles needed for useful
  breadcrumb labels.
- Resume content is saved as immutable `ResumeVersion` records. The current
  `Resume` record points to the current version and stores mutable design
  metadata.
- Resume dirty state is a deterministic draft fingerprint; `useBlocker` and
  `beforeunload` already protect unsaved edits.
- Resume design already contains `templateId`, `colorPaletteId`, `pageSize`,
  `fontFamily`, and `showProfilePhoto`, and the backend already exposes an
  owned design-patch endpoint.
- The live `ResumePreview` is ATS Classic and visually A4-like, but it is
  hard-coded to ATS Classic/A4 and has no print stylesheet or export action.
- Resume analysis responses require validated `originalText`,
  `rewrittenText`, `rationale`, `verificationRequired`, suggestion UUID,
  bullet UUID, analysis ID, Resume ID, and source Resume-version ID.
- Applying suggestions revalidates owner, analysis, current source version,
  selected stored IDs, target bullet, and original source text before creating
  a new immutable version.
- The router currently uses static imports. Prior verified builds recorded a
  558.23 kB minified JavaScript chunk above Vite's 500 kB advisory threshold.
- No Lighthouse script or declared repository-local Lighthouse/Playwright
  runner exists.

Assumptions:

- Browser Print / Save as PDF is the MVP export mechanism.
- Browser print can suggest, but cannot guarantee, the final filename.
- Embedded PDF metadata is not reliably controllable through browser print.
- Resume-level design applies to current and historical content previews; the
  current model does not snapshot design per immutable version.
- Existing unknown stored template/palette/font strings must fail to a safe
  ATS Classic/default presentation in the frontend rather than crash.

Ambiguities resolved by this plan:

- Sidebar collapse is component-session state. No local storage is added.
- The existing mobile menu presentation is replaced by a drawer, while the
  same navigation data and route system are retained.
- Breadcrumbs are a new mandatory Phase 16 requirement despite the preserved
  historical Phase 13 recommendation that back links were then sufficient.
- Print margins are temporary print controls. They do not expand the Resume
  persistence contract.
- Line spacing is not persisted unless a separately approved contract change
  is activated; Phase 16E must label an unpersisted choice honestly or omit it.

## Scope classification

### Mandatory for academic MVP

- Responsive desktop sidebar.
- Mobile navigation drawer.
- Contextual breadcrumbs on deep routes.
- Resume export through browser Print / Save as PDF.
- A4 and Letter page sizes.
- Dirty-draft export protection.
- Original-versus-suggested Resume comparison.
- Accessible diff highlighting.
- Accessibility review.
- Performance review.
- Integrated verification and Phase 16 closeout.

### Conditional / time permitting

- Standard/Narrow print margins.
- A page-sized preview surface only if browser evidence proves it reliable.
- Modern Professional template.
- Compact Technical template.
- Bounded system-font selection.
- Bounded accessible palette selection.
- Compact/Standard/Relaxed line spacing.

### Deferred until post-MVP

- Command palette and global keyboard shortcuts.
- A new dark/light theme system.
- Editable AI suggestions and AI feedback ratings.
- Analytics collection or provider-retraining claims.
- Major Resume-section reordering.
- Embedded PDF metadata.
- Mock-interview audio.
- Flashcard mastery tracking.
- Interview-feedback PDF.
- Resume analysis history and computed Resume-version diff.
- Resume archive/deletion.
- Profile photos and Resume thumbnails.
- Summary regeneration.

### Rejected

- ATS percentage scores or absolute ATS compatibility guarantees.
- Arbitrary colors, uploaded fonts, custom Resume CSS, and animated layouts.
- Copied legacy templates or architecture.
- A second design system.
- Profile photos by default or infographic skill meters.
- Major-section drag and drop.
- Direct provider HTML rendering.
- Automatic, unselected, inferred, or empty-means-all AI rewrite application.

## Cross-subphase architecture decisions

### Application shell

- Keep one `AppShell`, one route tree, one navigation-item source, and one
  authenticated account/logout flow.
- Desktop at wide widths uses an expanded sidebar. An optional collapsed rail
  may be included only if its labels remain programmatically available and
  the expanded state remains the default.
- Tablet uses the layout proven by content rather than device detection:
  collapse to the rail only while labels and main content remain usable;
  otherwise use the drawer threshold.
- Mobile uses the existing `Dialog` primitive as a modal drawer with initial
  focus, containment, Escape, backdrop dismissal, focus return, scroll
  containment, and route-change closure.
- Use small local inline SVG icons with `aria-hidden="true"` alongside visible
  text. Collapsed controls require an accessible name. Add no icon dependency.
- The Create menu links to existing routes with bounded intent query strings:
  `/resumes?action=create`, `/interviews?action=create`, and
  `/learning?action=upload`. Each owning page consumes only its recognized
  value, opens/focuses the existing workflow, and leaves unknown values inert.
- Breadcrumbs render only on deep routes. The owning route supplies canonical
  loaded titles to a reusable presentational component. Loading states use a
  generic safe label; raw database IDs never render.
- On mobile, keep the current page crumb visible and truncate long visual text
  with CSS while preserving the full accessible name/title. Do not collapse
  the semantic list.

### Resume printing

- Print only a saved canonical current version or an explicitly loaded
  historical saved version.
- If the draft is dirty, disable the print action and direct the user to Save
  New Version or Discard draft changes. Do not print a dirty draft.
- Reuse `ResumePreview` content rendering for a dedicated in-place
  print-only surface. Do not add a route or duplicate the Resume model.
- Exclude the application header/sidebar, editor, controls, dialogs, notices,
  analysis, and history with `@media print`.
- Render A4 or Letter from `resume.design.pageSize`; use the existing owned
  design-patch endpoint if the user changes page size.
- Standard/Narrow margins remain temporary print state. They reset on reload.
- Use black text, white background, visible borders, useful link destinations,
  `break-inside` rules for bounded entries, and safe splitting for entries
  longer than one page.
- Temporarily set a sanitized document title as a best-effort filename hint,
  restore it after print, and never claim the browser will honor it.
- Do not promise embedded author/title metadata.

### AI comparison

- The existing validated response is sufficient; no new backend or shared
  contract is required.
- If `originalText` is missing or invalid, the current parser rejects the
  analysis. The UI must show a safe load/assessment error and must not display
  or apply a partial comparison.
- Render Original, Suggested rewrite, Reason, verification warning, and the
  existing selection checkbox for every suggestion.
- Use a deterministic local word-token diff. Ignore whitespace-only changes,
  keep punctuation adjacent to its word where practical, and coalesce
  contiguous tokens to avoid punctuation confetti.
- Use semantic `<del>` and `<ins>` plus explicit “Removed” and “Added” text;
  color may reinforce but never carry the only meaning.
- Desktop uses two comparison columns. Tablet and mobile stack Original before
  Suggested. Long content wraps without horizontal scrolling.

### Templates and design

- All templates consume the same canonical `ResumeContent`/`ResumeDraft`.
- A typed local registry maps approved IDs to label, class, font, palette, and
  density behavior. Unknown persisted IDs fall back to ATS Classic/default
  styling without changing stored data.
- ATS Classic is the only mandatory template.
- Modern Professional and Compact Technical remain conditional and must stay
  single-column, printable, selectable as text, and free of decorative
  graphics that harm ATS parsing or pagination.
- Bounded fonts: the existing Inter/system stack, Arial/sans-serif, and
  Georgia/serif. Do not fetch remote fonts.
- Bounded palettes: Slate, Forest, and Navy only after normal/large text,
  controls, focus, and print contrast are verified.
- Existing template, palette, font, and page-size fields persist at the Resume
  record through the owned design endpoint.
- Historical Resume content remains immutable, but historical previews use
  the Resume's current design because design is not version-snapshotted.
- Spacing density is omitted unless the activated Phase 16E prompt explicitly
  approves either honest session-only behavior or an exact backend contract
  extension. No silent persistence is permitted.

## Phase 16B — Responsive Sidebar, AppShell and Breadcrumbs

### Contract

1. **Purpose:** Convert the existing top-navigation shell into a responsive
   sidebar/drawer shell and add canonical deep-route breadcrumbs.
2. **Mandatory scope:** expanded desktop sidebar, mobile drawer, shared
   navigation data, active route, account block, logout, Create menu,
   contextual breadcrumbs, keyboard/focus behavior, reflow, and no overflow.
3. **Optional scope:** collapsed desktop rail only if all acceptance criteria
   pass without persistence.
4. **Out of scope:** new routes, placeholder links, command palette, global
   shortcuts, local-storage preference, auth changes, backend changes, or a
   second shell.
5. **Architecture:** enhance `AppShell`; reuse `Dialog`; route-owned canonical
   breadcrumb data; component-session collapse state.
6. **Browser use:** required for affected Full Application Browser Testing
   paths and human visual QA.
7. **Viewports:** 1440×900, 1024×768, 768×1024, 390×844, and 320×720; repeat
   at 200% zoom through human review.
8. **Backend/shared contracts:** changes not allowed.
9. **Dependencies:** none.
10. **Cleanup:** stop local services; require tagged `users=0, owned=0`; remove
    reports, results, screenshots, traces, videos, logs, build output, and
    repository-local caches.
11. **Repair limit:** three code-changing attempts per root failure.
12. **Stop conditions:** raw IDs appear in breadcrumbs; dialog cannot contain
    focus/return it; quick action requires an invented endpoint/route; any
    protected-route/auth/ownership regression; or scope exceeds the manifest.
13. **Human approval token:**
    `PHASE_16B_SIDEBAR_BREADCRUMBS_VISUAL_APPROVED`.
14. **Expected review marker:**
    `PHASE_16B_SIDEBAR_BREADCRUMBS_READY_FOR_REVIEW`.
15. **Suggested commit subject:**
    `Build responsive application shell and breadcrumbs`.

### Exact proposed write manifest

Production:

- `frontend/src/AppShell.tsx`
- `frontend/src/components/Breadcrumbs.tsx` (create)
- `frontend/src/styles.css`
- `frontend/src/features/resumes/ResumeListPage.tsx`
- `frontend/src/features/resumes/ResumeWorkspace.tsx`
- `frontend/src/features/interviews/InterviewSessionListPage.tsx`
- `frontend/src/features/interviews/InterviewSessionWorkspace.tsx`
- `frontend/src/features/learning/LearningDashboard.tsx`
- `frontend/src/features/learning/LearningDocumentWorkspace.tsx`
- `frontend/src/features/learning/LearningConversationWorkspace.tsx`
- `frontend/src/features/learning/LearningFlashcardWorkspace.tsx`
- `frontend/src/features/learning/LearningQuizWorkspace.tsx`
- `frontend/src/features/learning/LearningQuizAttemptWorkspace.tsx`

Tests:

- `frontend/src/components/Breadcrumbs.test.tsx` (create)
- `frontend/src/routing/router.test.tsx`
- `frontend/src/features/resumes/ResumeListPage.test.tsx`
- `frontend/src/features/resumes/ResumeWorkspace.test.tsx`
- `frontend/src/features/interviews/InterviewSessionListPage.test.tsx`
- `frontend/src/features/interviews/InterviewSessionWorkspace.test.tsx`
- `frontend/src/features/learning/LearningDashboard.test.tsx`
- `frontend/src/features/learning/LearningDocumentWorkspace.test.tsx`
- `frontend/src/features/learning/LearningConversationWorkspace.test.tsx`
- `frontend/src/features/learning/LearningFlashcardWorkspace.test.tsx`
- `frontend/src/features/learning/LearningQuizWorkspace.test.tsx`
- `frontend/src/features/learning/LearningQuizAttemptWorkspace.test.tsx`
- `tests/browser/specs/dashboard.spec.cjs`
- `tests/browser/specs/resume.spec.cjs`
- `tests/browser/specs/interview.spec.cjs`
- `tests/browser/specs/learning.spec.cjs`

Governance:

- `docs/planning/CURRENT_PHASE.md`
- `docs/planning/CAREER_LEARNING_HUB_MASTER_PLAN.md`
- `docs/planning/PHASE_16B_RESPONSIVE_SHELL_BREADCRUMBS_REPORT.md` (create)

No router production edit is required: query strings use existing routes and
deep pages already own the canonical data.

### Test and acceptance manifest

- Unit/integration UI tests prove one navigation-item source, active
  `aria-current`, collapse semantics, drawer initial focus/trap/Escape/backdrop
  return, logout, route-change closure, and dirty-Resume blocked navigation.
- Intent-query tests prove each quick action opens/focuses only its existing
  workflow and unknown values do nothing.
- Breadcrumb tests prove semantic labelled navigation, ordered links, current
  page, safe loading labels, canonical dynamic titles, no raw IDs, and mobile
  truncation without lost accessible text.
- Browser tests cover sidebar/drawer navigation, Create actions, breadcrumbs
  on Resume, Interview, document, conversation, flashcard, Quiz, and attempt
  routes, logout, ownership-neutral failures, and horizontal overflow.
- Human QA covers expanded and optional collapsed desktop, tablet transition,
  mobile drawer, long names/titles, keyboard order, focus ring, 200% zoom, and
  320px reflow.
- Completion evidence: focused frontend tests, complete frontend suite, root
  typecheck, production build, affected browser workflows, full browser suite
  if the shared shell changes every workflow, cleanup, scoped diff, and the
  visual approval token.

## Phase 16C — Resume PDF Export and Print

### Contract

1. **Purpose:** Provide truthful saved-version Resume export through browser
   Print / Save as PDF.
2. **Mandatory scope:** current/historical saved-version choice, dirty-draft
   blocking, print controls, A4/Letter, print-only ATS Classic surface, chrome
   exclusion, safe title/filename hint, one/multi-page behavior, links,
   monochrome readability, and print QA.
3. **Optional scope:** Standard/Narrow temporary margins and a page-sized
   preview only if verified reliable.
4. **Out of scope:** direct binary download, PDF library, server PDF service,
   embedded metadata guarantee, thumbnail/screenshot persistence, or dirty
   draft printing.
5. **Architecture:** in-place print-only surface rendered from an explicit
   saved `ResumeVersion`; `window.print()`; dynamic print style; existing
   owned design patch for page size.
6. **Browser use:** required, including browser print preview and human
   Save-as-PDF inspection with synthetic content only.
7. **Viewports/output matrix:** desktop 1440×900, tablet 768×1024, mobile
   390×844 for controls; A4 and Letter; one-page and multi-page; Standard and
   Narrow if included; color and grayscale/black-and-white inspection.
8. **Backend/shared contracts:** no production change required; use existing
   Resume/version and design-patch contracts.
9. **Dependencies:** none.
10. **Cleanup:** remove synthetic exported PDFs after inspection, plus normal
    service/test artifacts and tagged data.
11. **Repair limit:** three code-changing attempts per root failure.
12. **Stop conditions:** dirty draft can print; print output includes app
    chrome/private diagnostics; canonical version identity is ambiguous;
    A4/Letter cannot be selected reliably; or browser print cannot meet
    readable multi-page output within the bounded architecture.
13. **Human approval token:**
    `PHASE_16C_RESUME_EXPORT_VISUAL_APPROVED`.
14. **Expected review marker:**
    `PHASE_16C_RESUME_EXPORT_READY_FOR_REVIEW`.
15. **Suggested commit subject:**
    `Add saved resume printing and PDF export`.

### Exact proposed write manifest

Production:

- `frontend/src/features/resumes/ResumeWorkspace.tsx`
- `frontend/src/features/resumes/ResumePreview.tsx`
- `frontend/src/features/resumes/ResumePrintControls.tsx` (create)
- `frontend/src/features/resumes/resumePrint.ts` (create)
- `frontend/src/features/resumes/resumeApi.ts`
- `frontend/src/features/resumes/resumeContracts.ts`
- `frontend/src/features/resumes/resumeWorkspace.css`

Tests:

- `frontend/src/features/resumes/ResumeWorkspace.test.tsx`
- `frontend/src/features/resumes/ResumePreview.test.tsx` (create)
- `frontend/src/features/resumes/ResumePrintControls.test.tsx` (create)
- `frontend/src/features/resumes/resumePrint.test.ts` (create)
- `frontend/src/features/resumes/resumeApi.test.ts`
- `frontend/src/features/resumes/resumeContracts.test.ts`
- `tests/browser/specs/resume.spec.cjs`

Governance:

- `docs/planning/CURRENT_PHASE.md`
- `docs/planning/CAREER_LEARNING_HUB_MASTER_PLAN.md`
- `docs/planning/PHASE_16C_RESUME_EXPORT_REPORT.md` (create)

### Test and acceptance manifest

- Tests prove current saved content is the print source, historical snapshots
  print only after successful owned fetch, and dirty drafts disable printing
  while preserving Save New Version/Discard actions.
- Tests prove page-size persistence uses exact `PATCH
  /resumes/:resumeId/design`, response validation, request IDs, ownership-safe
  failures, and no false success.
- Print utility tests prove filename normalization, length bound, fallback,
  temporary document-title restoration, before/after print state, and no
  persisted content.
- Preview tests prove all canonical sections, real safe links, template/page
  attributes, and no unsanitized markup.
- Browser and human QA prove chrome/dialog/status exclusion, A4 and Letter
  sizing, useful links, one/multi-page splitting, no clipped content, readable
  grayscale, and no retained output.
- Embedded metadata is recorded as unsupported/deferred, not passed.
- Completion evidence: focused tests, complete frontend suite, root
  typecheck, build, affected and full browser workflows, human print-preview
  matrix, synthetic cleanup, and visual approval.

## Phase 16D — Original-versus-Suggested AI Comparison

### Contract

1. **Purpose:** Make each AI rewrite reviewable against its stored original
   before selection and application.
2. **Mandatory scope:** Original, Suggested rewrite, Reason, verification
   warning, selection, deterministic word diff, non-color indicators,
   screen-reader semantics, long-content containment, and responsive layout.
3. **Optional scope:** none.
4. **Out of scope:** editable suggestions, ratings, analytics, provider
   retraining claims, auto-apply, provider HTML, contract expansion, or
   computed Resume-version diff.
5. **Architecture:** present existing validated fields; local pure diff
   utility; no dependency; existing apply flow unchanged.
6. **Browser use:** required for responsive, keyboard, semantics, and human
   visual QA. No provider call is permitted; use stored synthetic analysis.
7. **Viewports:** 1440×900, 768×1024, 390×844, and 320×720; include very long
   original/rewrite/rationale content and 200% zoom.
8. **Backend/shared contracts:** changes not allowed.
9. **Dependencies:** none.
10. **Cleanup:** normal isolated services, tagged data, and browser artifacts;
    no Resume text in persistent reports/screenshots.
11. **Repair limit:** three code-changing attempts per root failure.
12. **Stop conditions:** invalid/partial analysis renders; IDs or source
    checks are bypassed; diff changes request payload; color is the only
    indicator; provider output becomes HTML; or long content overflows.
13. **Human approval token:**
    `PHASE_16D_AI_COMPARISON_VISUAL_APPROVED`.
14. **Expected review marker:**
    `PHASE_16D_AI_COMPARISON_READY_FOR_REVIEW`.
15. **Suggested commit subject:**
    `Compare original and suggested resume text`.

### Exact proposed write manifest

Production:

- `frontend/src/features/resumes/AiRecommendations.tsx`
- `frontend/src/features/resumes/ResumeSuggestionComparison.tsx` (create)
- `frontend/src/features/resumes/resumeWordDiff.ts` (create)
- `frontend/src/features/resumes/resumeWorkspace.css`

Tests:

- `frontend/src/features/resumes/AiRecommendations.test.tsx`
- `frontend/src/features/resumes/ResumeSuggestionComparison.test.tsx`
  (create)
- `frontend/src/features/resumes/resumeWordDiff.test.ts` (create)
- `frontend/src/features/resumes/ResumeWorkspace.test.tsx`
- `frontend/src/features/resumes/resumeContracts.test.ts`
- `frontend/src/features/resumes/resumeApi.test.ts`
- `tests/browser/specs/resume.spec.cjs`

Governance:

- `docs/planning/CURRENT_PHASE.md`
- `docs/planning/CAREER_LEARNING_HUB_MASTER_PLAN.md`
- `docs/planning/PHASE_16D_AI_COMPARISON_REPORT.md` (create)

### Test and acceptance manifest

- Diff tests cover unchanged text, additions, removals, replacements,
  repeated words, whitespace, punctuation adjacency, Unicode words, and the
  2,000-character contract bound.
- Component tests prove labelled Original/Suggested regions, `del`/`ins`,
  Removed/Added text, rationale, warning, checkbox label, disabled stale/busy
  states, and plain-text rendering.
- Existing contract tests continue to reject missing/empty original or
  rewritten text and malformed IDs.
- Apply tests continue to send only stored analysis/suggestion IDs, require
  confirmation, surface 409 conflict safely, and adopt the returned immutable
  version.
- Browser/human QA proves two-column desktop, stacked narrow layouts,
  keyboard selection/confirmation, non-color meaning, screen-reader order,
  long-content wrapping, and no provider call.

## Phase 16E — Bounded Resume Templates and Design Controls

### Contract

1. **Purpose:** Add a small optional presentation catalog without changing
   the canonical Resume model or making unsupported ATS claims.
2. **Mandatory scope:** none beyond preserving ATS Classic. This whole
   subphase is `CONDITIONAL / TIME PERMITTING`.
3. **Optional scope:** Modern Professional, Compact Technical, approved system
   fonts, approved palettes, and spacing only under the explicit persistence
   rule below.
4. **Out of scope:** arbitrary pickers, remote/uploaded fonts, custom CSS,
   photos, skill meters, animation, copied legacy assets/layouts, drag/drop,
   a second design system, or ATS guarantees.
5. **Architecture:** typed local registry over one canonical model; existing
   owned design endpoint; safe fallback for unknown IDs; ATS-safe
   single-column print surfaces.
6. **Persistence:** template, palette, font, and page size persist at the
   Resume level. Historical content uses current design. Margins remain
   temporary Phase 16C state. Spacing is omitted unless the activated prompt
   selects an honest session-only control or separately authorizes an exact
   backend field.
7. **Browser use:** required if this phase executes.
8. **Viewports/output matrix:** 1440×900, 768×1024, 390×844, 320×720; A4 and
   Letter; one/multi-page; each included template/font/palette; 200% zoom and
   monochrome print.
9. **Backend/shared contracts:** no production change in the default
   manifest. The existing endpoint is sufficient for existing fields.
10. **Dependencies:** none.
11. **Cleanup:** normal isolated data/services/artifacts; no retained Resume
    images or PDFs.
12. **Repair limit:** three code-changing attempts per root failure.
13. **Stop conditions:** an option needs arbitrary server data, new
    dependency, inaccessible contrast, two-column parsing risk, clipped
    pagination, unknown stored value crashes, or line spacing needs
    unapproved persistence.
14. **Human approval token:**
    `PHASE_16E_RESUME_TEMPLATES_VISUAL_APPROVED`.
15. **Expected review marker:**
    `PHASE_16E_RESUME_TEMPLATES_READY_FOR_REVIEW`.
16. **Suggested commit subject:**
    `Add bounded resume design controls`.

### Exact proposed write manifest

Production:

- `frontend/src/features/resumes/resumeTemplateRegistry.ts` (create)
- `frontend/src/features/resumes/ResumeDesignControls.tsx` (create)
- `frontend/src/features/resumes/ResumePreview.tsx`
- `frontend/src/features/resumes/ResumeWorkspace.tsx`
- `frontend/src/features/resumes/resumeApi.ts`
- `frontend/src/features/resumes/resumeContracts.ts`
- `frontend/src/features/resumes/resumeWorkspace.css`

Tests:

- `frontend/src/features/resumes/resumeTemplateRegistry.test.ts` (create)
- `frontend/src/features/resumes/ResumeDesignControls.test.tsx` (create)
- `frontend/src/features/resumes/ResumePreview.test.tsx`
- `frontend/src/features/resumes/ResumeWorkspace.test.tsx`
- `frontend/src/features/resumes/resumeApi.test.ts`
- `frontend/src/features/resumes/resumeContracts.test.ts`
- `backend/src/tests/integration/resumeDesign.integration.test.ts` (create;
  verifies the existing owned endpoint, not a production contract change)
- `tests/browser/specs/resume.spec.cjs`

Governance:

- `docs/planning/CURRENT_PHASE.md`
- `docs/planning/CAREER_LEARNING_HUB_MASTER_PLAN.md`
- `docs/planning/PHASE_16E_RESUME_TEMPLATES_REPORT.md` (create)

### Test and acceptance manifest

- Registry tests prove exact IDs, labels, CSS tokens, default fallback, and no
  arbitrary class/style injection.
- Design-control tests prove native labelled controls, current selection,
  busy/error/success states, exact patch bodies, and unknown-value fallback.
- Backend integration proves authentication, owner isolation, strict
  non-empty patch shape, allowed page-size enum, and neutral cross-owner
  response for the existing endpoint.
- Preview/print tests prove each included template renders every canonical
  section as text, preserves links/order, wraps long content, and avoids
  profile photos/graphics.
- Contrast is measured for every palette. Template names and documentation
  make no percentage or absolute ATS claim.
- Completion evidence includes all applicable frontend/backend focused tests,
  root typecheck, build, browser workflow, output matrix, human approval, and
  cleanup.

## Phase 16F — Accessibility and Performance Review

### Contract

1. **Purpose:** Audit the completed Phase 16 UI against accessibility and
   performance criteria, then make only evidence-backed bounded repairs.
2. **Mandatory accessibility scope:** landmarks, headings, skip link,
   sidebar/drawer, breadcrumbs, active-route semantics, focus order/visibility,
   trap/return, names, error summaries, live status, 200% zoom, 320px reflow,
   contrast, print controls, AI diff, any template controls, and reduced
   motion.
3. **Mandatory performance scope:** initial bundle, route loading, shell
   renders, drawer, Resume workspace/preview/print, long content, suggestion
   list/diff, optional template switching, large Interview/Learning lists,
   pagination, polling, and private PDF object-URL cleanup.
4. **Out of scope:** speculative memoization, cache/state-library additions,
   synthetic benchmark claims, load/stress against persistent databases, or
   unrelated visual redesign.
5. **Architecture:** baseline first; isolate one finding; smallest repair;
   targeted verification; broad regression; no dependency by default.
6. **Browser use:** required. Use local isolated services and synthetic data.
   Lighthouse is limited to routes that can be measured reproducibly with an
   already available runner; do not download one.
7. **Representative routes:** `/login`, `/dashboard`, `/resumes`,
   `/resumes/:resumeId`, `/interviews`, `/interviews/:sessionId`, `/learning`,
   `/learning/documents/:documentId`, one conversation, one flashcard set, one
   Quiz, one Quiz attempt, `/settings`, unknown route, and cross-owner safe
   states.
8. **Viewports:** 1440×900, 1024×768, 768×1024, 390×844, 320×720, plus human
   200% zoom.
9. **Backend/shared contracts:** changes not allowed by default.
10. **Dependencies:** none. An unavailable Lighthouse runner is a documented
    limitation, not permission to install.
11. **Cleanup:** stop all services; tagged `users=0, owned=0`; revoke private
    PDF object URLs; remove audit reports containing runtime data,
    screenshots, traces, videos, build output, logs, coverage, and caches.
12. **Repair limit:** three code-changing attempts per root failure.
13. **Stop conditions:** a confirmed issue falls outside the exact repair
    manifest; measurements are not reproducible; a repair changes
    security/privacy/API behavior; or the same root failure survives three
    changes.
14. **Human approval token:**
    `PHASE_16F_ACCESSIBILITY_PERFORMANCE_APPROVED`.
15. **Expected review marker:**
    `PHASE_16F_ACCESSIBILITY_PERFORMANCE_READY_FOR_REVIEW`.
16. **Suggested commit subject:**
    `Complete accessibility and performance review`.

### Exact proposed write manifest

Planned review and known evidence-backed route-loading candidate:

- `frontend/src/routing/router.tsx`
- `frontend/src/routing/router.test.tsx`
- `docs/planning/CURRENT_PHASE.md`
- `docs/planning/CAREER_LEARNING_HUB_MASTER_PLAN.md`
- `docs/planning/PHASE_16F_ACCESSIBILITY_PERFORMANCE_REPORT.md` (create)

The router files may change only if fresh build evidence confirms that
route-level lazy loading reduces the documented single initial chunk without
breaking protected-route loading/error behavior. Accessibility repairs are
not pre-authorized in unknown files. A confirmed issue outside this exact
manifest stops the pass and requires a new bounded manifest before editing.

### Reproducible baseline and failure criteria

- Record exact Node/npm/browser versions, commit, build command, server mode,
  data fixture, route, viewport, cache state, and three-run samples.
- Production build must pass. Record each generated JS/CSS asset and size.
- Compare three-run medians in the same environment; flag a regression above
  10% for transferred initial JS, LCP, CLS, or blocking time.
- Treat CLS above 0.1, desktop LCP above 2.5 seconds, or mobile-emulated LCP
  above 4.0 seconds as review findings, not as marketing claims.
- Treat any keyboard trap, inaccessible name, broken focus return, lost
  focus indicator, horizontal overflow at 320px, unusable 200% zoom,
  color-only meaning, failed contrast, unreleased object URL, unbounded
  polling, or concealed error/status as a failure regardless of aggregate
  score.
- Lighthouse aggregate scores are supporting evidence only. Record category
  scores and individual audits; do not hide a failed audit behind a score.
- Exercise long but contract-valid Resume suggestions and canonical Resume
  content. Diff calculation must remain responsive without memoization unless
  profiling proves a render bottleneck.
- Verify existing server pagination and bounded polling rather than replacing
  them with client-side bulk loading.
- Completion evidence: baseline report, confirmed-finding register, targeted
  tests for every repair, full frontend suite, root typecheck, build asset
  comparison, Full Application Browser Testing, human keyboard/zoom/visual
  review, cleanup, and approval token.

## Phase 16G — Integrated Verification and Phase 16 Closeout

### Contract

1. **Purpose:** Verify the integrated academic MVP, preserve accepted
   limitations, close Phase 16 for review, and prepare Phase 17 without
   activating it.
2. **Mandatory scope:** complete diff review, all typechecks/tests/build,
   Full Application Browser Testing, desktop/tablet/mobile and human visual
   review, accessibility/performance evidence reconciliation, security/privacy
   regression, cleanup, governance, and exact final status.
3. **Optional scope:** none.
4. **Out of scope:** new features, refactors, dependency changes, deployment,
   P15-001 repair, Phase 17 activation, merge, or push.
5. **Architecture:** verification-only. A defect requires a separately
   bounded repair manifest; Phase 16G does not improvise production changes.
6. **Browser use:** required for the complete suite and human review of all
   visible Phase 16 features.
7. **Viewports:** suite projects 1440×900, 768×1024, and 390×844; human matrix
   also includes 1024×768, 320×720, 200% zoom, and print preview.
8. **Backend/shared contracts:** changes not allowed.
9. **Dependencies:** none.
10. **Cleanup:** all temporary services stopped; configured ports closed;
    `users=0, owned=0`; private storage/runtime removed; no report, result,
    screenshot, trace, video, synthetic PDF, log, coverage, build output, or
    repository-local cache remains.
11. **Repair limit:** no repair is authorized by the closeout contract; any
    repair gets its own maximum-three-attempt bounded prompt.
12. **Stop conditions:** any gate fails; approval evidence is missing;
    generated artifact remains; source scope is unexplained; P15-001 boundary
    is weakened; or Git is staged/committed unexpectedly.
13. **Human approval token:**
    `PHASE_16G_FINAL_VERIFICATION_APPROVED`.
14. **Expected review marker:**
    `PHASE_16G_FINAL_VERIFICATION_READY_FOR_REVIEW`.
15. **Suggested commit subject:**
    `Complete Phase 16 academic MVP verification`.

### Exact proposed write manifest

- `docs/planning/CAREER_LEARNING_HUB_MASTER_PLAN.md`
- `docs/planning/CURRENT_PHASE.md`
- `docs/planning/PHASE_16_ACADEMIC_MVP_IMPLEMENTATION_PLAN.md`
- `docs/planning/PHASE_16_INTEGRATED_VERIFICATION_REPORT.md` (create)
- `docs/testing/FULL_APPLICATION_BROWSER_TESTING.md`

No production or executable test write is planned. A discovered mismatch
requires a separate manifest and human direction.

### Verification manifest

- Review branch/HEAD, active Git operations, staged/untracked state, complete
  Phase 16 diff, lockfile/package/environment status, and secrets/artifacts.
- Run root typecheck; complete frontend tests; backend unit, integration, and
  security tests; backend test typecheck; production build; and any
  phase-specific focused tests not subsumed by those gates.
- Run Full Application Browser Testing exactly once after targeted browser
  confidence. Preserve projects, one worker, zero retries, setup/teardown,
  ownership, private PDF, Quiz secrecy, console, and overflow assertions.
- Verify sidebar/drawer, quick actions, breadcrumbs, Resume print/export,
  original/suggested diff, and any executed template controls across the
  required matrix.
- Reconcile Phase 16F accessibility/performance findings and prove no
  unapproved Critical/Important issue remains.
- Preserve P15-001 restrictions and verify no provider/Atlas/cloud/deployment
  use.
- Record actual counts and results; do not copy historical numbers as fresh
  evidence.
- Stop unstaged before commit. After the required token, a separate closeout
  prompt may authorize one phase-scoped commit. Phase 17 remains inactive.

## P15-001 and deployment boundary

P15-001 remains technically unresolved: concurrent uploads can pass the same
non-atomic quota observation and exceed the per-user storage quota. Phase 16
must remain within controlled academic evaluation:

- supervise evaluation;
- do not open unrestricted public-scale uploads;
- limit demo accounts and upload volume;
- monitor storage use;
- keep file-size and per-user quota controls enabled;
- do not run intentional concurrent-upload/load stress against a persistent
  deployed demo database;
- permit manual cleanup after abnormal upload behavior; and
- repair the quota with a database-backed atomic reservation, compensation,
  idempotent lifecycle, concurrency proof, deletion, and reconciliation before
  public-scale, multi-worker/instance, meaningful-scale persistent object
  storage, commercial, production, or multi-tenant operation.

Phase 16 authorizes no deployment, Atlas, provider, or cloud-storage change.

## Final Phase 16 closeout requirements

Phase 16 may be reported ready for closeout only when:

- Phase 16A-1 and Phase 16A-2 are approved;
- mandatory Phase 16B, 16C, 16D, 16F, and 16G work is approved;
- Phase 16E is either approved or explicitly recorded as skipped under its
  conditional classification;
- every phase-specific human token is recorded only after it is supplied;
- all fresh automated and human evidence is recorded;
- no unresolved in-scope Critical/Important accessibility, security, privacy,
  responsive, print, or performance blocker remains;
- P15-001 and other accepted limitations remain explicit;
- cleanup and Git scope checks pass; and
- Phase 17 remains `PLANNED` / `INACTIVE` until a separate activation prompt.
