# Phase 19A-2 Resume Human Visual Polish Repair Plan

**Approval:** `PHASE_19A2_HUMAN_VISUAL_POLISH_REPAIR_DESIGN_APPROVED` — ACCEPTED / YES

**Scope:** Presentation-only repair to the existing Phase 19A-2 frontend. No
backend, shared contract, API, dependency, persistence, Gemini, Phase 19A-3,
or Phase 19A-4 changes. All work remains unstaged and awaits human Chrome QA.

## Current implementation evidence

- `ResumeCreateDialog` reuses the existing `Dialog` and
  `.resume-create-dialog-shell`; chooser buttons live in
  `.resume-create-methods`, while Back/Cancel/submit controls use
  `.resume-dialog-actions`.
- `ResumeGuidedSetup` is one `.resume-guided-setup` form. Its current details
  are three labelled controls, suggested sections are a semantic `<ul>`, the
  existing `ResumeSkillPicker` follows, and headline opt-in/actions end the
  form.
- `ResumeSkillPicker` accepts `{ value, suggestedKeywords, disabled,
  onChange }`. It owns transient checked/search/custom state and writes only
  through `onChange`. Current classes are `.resume-skill-picker`,
  `.resume-skill-catalogue`, `.resume-skill-options`, `.resume-skill-custom`,
  and `.resume-selected-skills`.
- `ResumePdfUpload` already owns one native file input and uses
  `.resume-upload-dropzone`, `.resume-dropzone-trigger`,
  `.resume-selected-file`, and `.resume-selected-file-actions`.
- Editor section navigation is `<nav class="resume-section-navigation"><ul>`
  with nine native fragment links. It currently forces a max-content flex row
  with horizontal overflow. Item actions reuse `.resume-entry-controls` and
  `.resume-entry-controls--compact`.
- Assessment progress is owned by `ResumeWorkspace.tsx` in
  `.resume-job-status`; completed result presentation is separately owned by
  unchanged `AiRecommendations`. No extra assessment component is required.
- Collection cards use `.resume-collection`, `.resume-section-heading`,
  `.resume-record-grid`, `.resume-record-card`, preview/body/state/design/footer
  descendants, and the existing bounded `18rem`–`20rem` grid tracks.
- Existing responsive CSS uses `min-width: 900px`, `min-width: 1280px`, and
  `max-width: 1080px`, `720px`, `560px`, and `420px`. The repair will reuse
  intrinsic grid/flex wrapping rather than add viewport-specific fixed widths.

## Assumptions and measurable success

- Selected-skill removal will reuse the picker’s existing explicit removal
  handler; it will not create another state authority.
- The Guided Setup footer remains non-sticky to avoid nested-scroll and 200%
  reflow risk.
- CSS-only spacing/color changes will not receive fake geometry tests.
- Success: focused markup tests observe the intended semantics, all nine nav
  links remain present and keyboard-operable, terminal success removes the
  redundant local progress row, complete frontend/root gates pass, no backend
  or package file changes are introduced, and staging remains empty.

## Task 1 — Plan and markup inspection

- [x] Inspect all authorized components, focused tests, CSS selectors, and
  responsive breakpoints.
- [x] Confirm Task 8 ownership and record that no extra component is needed.
- [x] Record approved boundaries, assumptions, and verification criteria.

## Task 2 — Create chooser and blank/import hierarchy

Files: `ResumeCreateDialog.tsx`, `ResumeCreateDialog.test.tsx`,
`ResumePdfUpload.tsx`, `ResumePdfUpload.test.tsx`, `resumeWorkspace.css`.

- [x] RED: assert exactly three button choices, accessible `Recommended` text,
  separated chooser footer, and preserved blank/import semantics.
- [x] GREEN: add minimal option-card copy/markup classes, blank/import grouping,
  and PDF visual hierarchy without route, API, or input changes.
- [x] Run focused dialog/upload tests.

## Task 3 — Guided Setup hierarchy and progressive disclosure

Files: `ResumeGuidedSetup.tsx`, `ResumeGuidedSetup.test.tsx`,
`ResumeSkillPicker.tsx`, `ResumeSkillPicker.test.tsx`, `resumeWorkspace.css`.

- [x] RED: assert non-interactive suggested-section chips and guidance copy,
  exact-role suggestions before a collapsed `Browse all skills` disclosure,
  selected/empty summaries, custom helper grouping, `Add selected skills`, and
  separated final controls.
- [x] GREEN: reuse current values and selection/removal behavior; introduce only
  semantic grouping and native `<details>` progressive disclosure.
- [x] Run focused Guided Setup and Skill Picker tests.

## Task 4 — Collection/card polish

Files: `ResumeListPage.tsx`, `ResumeListPage.test.tsx`,
`resumeWorkspace.css`.

- [x] RED only for meaningful static hierarchy classes if missing. No markup
  change was needed, so no fake CSS geometry RED was created.
- [x] Refine header/card spacing and preview/body/footer proportions while
  preserving capped tracks, content, ordering, routing, and pagination.
- [x] Run focused collection tests.

## Task 5 — Nine-section navigation and item actions

Files: `ResumeEditor.tsx`, `ResumeEditor.test.tsx`, `resumeWorkspace.css`.

- [x] RED: assert the navigation structure exposes its adaptive-grid class and
  all nine existing links; retain activation coverage.
- [x] GREEN: replace max-content/overflow row CSS with intrinsic wrapping grid,
  preserve DOM order/focus, and add a consistent compact action-group treatment.
- [x] Run focused editor tests.

## Task 6 — Assessment completed-state cleanup

Files: `ResumeWorkspace.tsx`, `ResumeWorkspace.test.tsx`.

- [x] RED: completed validated assessment shows `Completed result` without
  `100% checked`; active progress remains visible.
- [x] GREEN: suppress only the completed local progress row once validated
  analysis exists; do not change polling, errors, retries, or result content.
- [x] Run focused workspace tests.

## Task 7 — Leave-alone and accessibility regression review

- [x] Confirm datalist, print, result cards, rewrite flow, versions, snapshot,
  templates, Dialog focus/Escape, native controls, and logical DOM order remain
  unchanged.
- [x] Inspect CSS for clipping, horizontal nav overflow, fixed-width regressions,
  or lost `:focus-visible` treatment.

## Task 8 — Integrated automated verification

- [x] Run all changed focused tests.
- [x] Run the affected Resume regression group.
- [x] Run frontend typecheck and complete frontend suite.
- [x] Run root typecheck and production build.
- [x] Remove generated verification artifacts.
- [x] Run sensitive-data and authorized-file-boundary checks.
- [x] Run `git diff --check`, `git status --short`, `git diff --stat`, and
  `git diff --cached --name-only`; staging must be empty.

## Task 9 — Documentation and human QA handoff

- [x] After automated green, update `docs/planning/CURRENT_PHASE.md` with the
  accepted repair token and final-human-QA-pending state.
- [x] Report operator server commands and the approved manual screenshot/
  keyboard/reflow checklist without launching any browser.
