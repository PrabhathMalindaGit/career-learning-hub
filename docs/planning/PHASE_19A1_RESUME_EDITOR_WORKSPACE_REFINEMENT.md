# Phase 19A-1 — Resume Editor Workspace Refinement

## Status and authority

- Status: `COMPLETED / HUMAN-APPROVED / AWAITING OPERATOR GIT ACTION`
- Findings in scope: `CLH-UX-RESUME-EDITOR-004` and
  `CLH-UX-RESUME-EDITOR-005` only.
- `CLH-UX-RESUME-EDITOR-004`: `COMPLETED`.
- `CLH-UX-RESUME-EDITOR-005`: `COMPLETED`.
- Approved design:
  `docs/superpowers/specs/2026-08-10-resume-editor-workspace-refinement-design.md`
- Accepted design approval token:
  `PHASE_19A1_RESUME_EDITOR_WORKSPACE_DESIGN_APPROVED`
- First human visual rejection received:
  `PHASE_19A1_VISUAL_REVIEW_REJECTED_REPAIR_REQUIRED`
- Second human Chrome review rejection received:
  `PHASE_19A1_PREVIEW_PAPER_CONTAINMENT_REPAIR_REQUIRED`
- Third human Chrome review rejection received:
  `PHASE_19A1_WORKSPACE_POLISH_REPAIR_REQUIRED`
- Required visual approval token:
  `PHASE_19A1_RESUME_EDITOR_WORKSPACE_VISUAL_APPROVED`
- Accepted visual approval token:
  `PHASE_19A1_RESUME_EDITOR_WORKSPACE_VISUAL_APPROVED`
- Visual approval accepted: `YES` on 2026-08-10.
- Baseline: branch `phase-19a-1-resume-editor-workspace`, commit
  `4645ccb9ff610df1005481375a7d3c373703fdbd`.

Phase 19A as a whole is not complete. Findings 013-018 remain inactive, and
completed findings 001-003 were preserved rather than reimplemented.

## Human visual rejection and repair

The first human full-page Chrome review rejected the otherwise automated-green
implementation for four material UX reasons:

1. Modern Professional skill names broke inside words.
2. All nine editor sections remained expanded, producing an endless form.
3. Sixteen skill groups produced an oversized stack of generic cards.
4. The finite non-sticky preview left a large blank column while the expanded
   editor continued.

The repair stayed inside the existing frontend component tree and data shape:

- Basics begins expanded; Links, Experience, Education, Skills, Projects,
  Certifications, Languages, and Interests begin collapsed.
- Every section has one native button disclosure with `aria-expanded` and
  `aria-controls`; all nine existing navigation links remain.
- Section navigation opens its target before focusing the target toggle.
- Client and mapped server validation open every affected section, then retain
  the existing validation summary, inline error, first-invalid-field
  scroll/focus, request ID, and draft-preservation behavior.
- Skill groups use compact rows while retaining group names, comma-separated
  keywords, client identities, ordering, Add, Move, and Remove behavior.
- Modern Professional Skills alone use atomic flex-wrapped items with normal
  word breaking. Other Resume lists and the shared renderer remain unchanged.

No backend, shared contract, schema, dependency, provider, environment, or
deployment configuration changed. No Gemini or other provider call was made.

## Second human Chrome review and paper-containment repair

The second human Chrome review confirmed the disclosure, compact Skills
editor, and atomic Skills preview improvements, but exposed one shared-renderer
defect in both Live Preview and Historical Snapshot: long Resume content
continued below the finite white screen-paper boundary.

Source and rendered-geometry inspection confirmed the exact cause. The shared
content-bearing `.resume-paper` combined responsive width and a useful sparse
Resume `min-height` with `aspect-ratio: 210 / 297` and `overflow: visible`.
The aspect ratio resolved a finite screen height while the single shared
`ResumePreview` article continued growing, so visible content escaped the
paper. Both preview surfaces showed the same defect because they correctly
reuse that renderer.

The frontend-only repair removes the screen-paper aspect ratio and changes
nothing else about the paper contract. Screen height is now content-driven;
the responsive width, 620px minimum height, white background, border, shadow,
template styling, page-size label, and visible overflow remain. The existing
print-only rule already uses `aspect-ratio: auto`, so browser print pagination,
`@page`, and Save as PDF behavior were not changed. No clipping, pagination
engine, duplicate renderer, nested scroll container, or internal scrollbar was
introduced.

## Third human Chrome review and final workspace-polish repair

The third Chrome review accepted paper containment, progressive disclosure,
compact Skill rows, atomic Skills, and validation reveal, but found three
remaining wide-workspace issues: the finite preview again left unused space
while a long editor continued, the section navigator distracted by following
the page, and the always-expanded design chooser remained oversized.

The frontend-only polish repair makes three surgical changes:

- A nested `.resume-editor-preview-grid` now owns only the editor and Live
  Preview. At 1280px and above, the Live Preview panel is a keyboard-focusable,
  sticky viewport with a 16px offset, `max-height: calc(100vh - 32px)`, vertical
  auto overflow, and hidden horizontal overflow. The natural-height paper is
  unchanged inside it. Both assessment panels remain later normal-flow
  siblings, so the grid itself bounds stickiness and prevents overlap.
- The section navigator is static at every width. Its nine links, target
  reveal, target focus, and validation-reveal contracts remain unchanged.
- Resume appearance now defaults to a concise resolved summary such as
  `ATS Classic • Inter • Slate • A4` plus one accessible Customize disclosure.
  Expanding it reveals the same three templates, three fonts, and three
  palettes using smaller existing previews and one selected state. Immediate
  preview, explicit Save design, request-ID errors, and unknown-value fallback
  retain the existing props, registries, and endpoint.

Below 1280px the preview returns to static, natural page flow with no maximum
height or internal scrolling. Historical Snapshot remains static and
naturally growing at every width.

Candidate Photo was explicitly evaluated but not implemented. Although the
existing design shape includes `showProfilePhoto`, Phase 19A-1 has no approved
owned image source or upload/storage lifecycle. The proposal is recorded only
as an inactive future `PHASE 19A-4 — CANDIDATE PHOTO SUPPORT`, requiring its
own ownership, privacy, MIME/size, replace/remove, crop, template, print,
history, and cleanup review.

## Evidence-backed layout decision

The scoped `@media (min-width: 1280px)` editor-left / Live Preview-right grid
remains. Assessment and AI panels span the full width below it, and widths
below 1280px retain the single-column flow.

The final approved preferred direction is now active. Earlier stickiness
failed because the preview and assessment panels shared one grid, allowing a
tall sticky item to escape its intended workspace. The nested grid removes
that structural cause: its bottom was 7767px and the first assessment began at
7785px in the long fixture, while the 868px-high sticky preview remained inside
the grid. The preview panel had a real 843px vertical scroll range, zero
horizontal overflow, and the natural paper itself had zero overflow. The
panel scrolled while window scroll position remained unchanged. No fallback
was required for the final composition.

## Finding results

### CLH-UX-RESUME-EDITOR-004

- Wide editor/preview composition remains active at 1280px and above.
- Progressive disclosure materially reduces the ordinary editor height.
- Sixteen skill groups remain operable in compact rows.
- Preview skill items wrap between items and never split the tested names.
- Assessment/analysis remain full-width with no preview overlap.
- The desktop preview remains useful beside long open sections through one
  bounded panel scroll; the Resume paper itself remains natural-height.
- The section navigator remains once near the editor top and no longer follows
  page scroll.
- Resume appearance is compact by default while all nine approved choices and
  explicit persistence remain available.
- Save, Discard, Print, version history, analysis, design controls, immutable
  saves, dirty navigation blocking, validation, and section ordering remain in
  their existing architecture.

### CLH-UX-RESUME-EDITOR-005

- Representative prose fields retain native browser spellcheck defaults.
- Intentional URL controls retain `spellcheck="false"`.
- No spellchecking service, dependency, AI typo correction, rewriting, or
  automatic text mutation was added.

## Verification evidence

- Test-first RED: three focused files failed with 8 failing disclosure,
  navigation/focus, compact-skill, and preview-wrapping assertions before the
  repair. A second preview assertion failed before the empty-keyword colon was
  removed.
- Focused Resume feature suite: 16 files, 157 tests passed.
- Frontend typecheck: passed.
- Complete frontend suite: 56 files, 764 tests passed.
- Frontend production build: passed. Existing React Router directive and
  large-chunk advisory warnings remain non-blocking.
- Browser-spec syntax check: passed.
- Browser geometry at 1440 x 900: 617px editor / 485px preview columns, zero
  document overflow, zero nested scroll containers, no preview/assessment
  overlap, and all 16 preview skill items complete.
- 1024 x 768 and 768 x 1024: single-column editor followed by reachable
  preview, with zero horizontal overflow.
- 390 x 844: compact skill fields stack safely; 44px accessible action buttons
  fit without skill-section or document overflow.
- 320 x 720: zero document and skill-row overflow; all compact action controls
  remain reachable.
- Wide 16-skill case: 16 rows at 84px each; skill preview list client width and
  scroll width both 341px; tested skill text used `overflow-wrap: normal` and
  `word-break: normal`; TypeScript, JavaScript, Playwright, Communication,
  Problem Solving, REST APIs, MongoDB, and Cloud Infrastructure Automation
  each rendered as a complete atomic item.
- Runtime validation: an invalid URL in a collapsed Links section reopened the
  section and focused `resume-field-links-0-url`, retaining `aria-invalid`, the
  inline error, and the validation summary.
- Runtime regression smoke: live draft preview, dirty state, immutable Version
  2 save, Discard, unsaved-navigation dialog, skill reordering/restoration,
  Print control availability, Tab/Shift+Tab focus movement, and visible focus
  outlines passed. Browser console errors/warnings: none.
- Spellcheck inspection: prose and link-label controls had no disabling
  attribute; URL controls retained `spellcheck="false"`.
- Synthetic cleanup: final fixture counts were users=0 and owned=0.
- Local verification services were stopped.

### Paper-containment verification

- Test-first RED: the new shared `ResumePreview` natural-height contract test
  failed because the base screen rule still contained
  `aspect-ratio: 210 / 297`; it passed after the one-line CSS repair.
- Focused ResumePreview/ResumeWorkspace/ResumeEditor suite: 3 files, 47 tests
  passed, including natural screen height, shared preview presence, atomic
  Skills, editor disclosure, validation reveal, draft preservation, immutable
  save, Discard, spellcheck, ordering, and identity coverage.
- Browser geometry used the last visible descendant of each paper and required
  `paperRect.bottom + 2 >= lastVisibleResumeContentRect.bottom`, zero paper and
  document horizontal overflow, zero paper vertical overflow, and no
  `auto`/`scroll` overflow mode.
- At 1440 x 900, Live Preview ended 49px below its final Certifications
  content with a 438.9px-wide, 1830.7px-tall natural paper. Historical
  Snapshot ended 49px below the same final section with a 762px-wide,
  1290.9px-tall natural paper. Both were white with their existing solid
  border and shadow; their computed aspect ratio was `auto`.
- At 1024 x 768, Live/Historical containment gaps were 49px, paper widths were
  674px/636px, and document/paper overflow was zero.
- At 768 x 1024, Live/Historical containment gaps were 39.4px, paper widths
  were 674px/636px, and document/paper overflow was zero.
- At 390 x 844, Live/Historical containment gaps were 20px, paper widths were
  330px/304px, and document/paper overflow was zero.
- At 320 x 720, Live/Historical containment gaps were 20px, paper widths were
  260px/234px, and document/paper overflow was zero. All 16 Skills remained
  atomic with zero item overflow, and Projects and Certifications remained
  visibly inside the paper.
- The synthetic long Resume included four experience bullets, education, 16
  Skills, two projects, and two certifications. It was saved as immutable
  Version 2 so the same long content could be checked through both the live and
  historical shared-renderer paths.

### Final workspace-polish verification

- Test-first RED: four focused files produced seven expected failures before
  production changes: six for the missing compact appearance disclosure and
  one for the missing nested editor/preview workspace.
- Focused ResumeDesignControls/ResumeWorkspace/ResumeEditor/ResumePreview
  suite: 4 files, 54 tests passed.
- Complete frontend suite: 56 files, 764 tests passed; frontend typecheck,
  production build, browser-spec syntax, and `git diff --check` passed.
- At 1440 x 900 the preview computed to `position: sticky`, `top: 16px`,
  `max-height: 868px`, `overflow-y: auto`, `overflow-x: hidden`, and
  `tabindex="0"`. Its panel bottom stayed inside the nested grid, the grid
  ended 18px before Role-aware Assessment, document horizontal overflow was
  zero, and browser runtime errors were zero.
- Pointer scrolling moved only the focused preview panel from 0px to 575px
  while window scroll stayed at 807px. Section navigation remained static;
  activating Certifications reopened it and focused its disclosure button.
- The compact design default measured 107px before status/actions, exposed no
  radios while collapsed, and clearly showed `ATS Classic • Inter • Slate •
  A4`. Customize exposed all nine registry-backed radios as three groups of
  three with no repeated Selected badges. Modern Professional, Arial, and
  Forest updated the live paper and summary immediately; Save design returned
  `Resume design saved.` before the fixture was restored.
- The breakpoint boundary was explicit: at 1279px the preview was static with
  visible overflow and no maximum height; at 1280px the two-column sticky
  bounded panel activated.
- At 1024 x 768, 768 x 1024, 390 x 844, and 320 x 720 the preview was static,
  `max-height: none`, `overflow: visible`, had no panel scroll range, and the
  document and paper had zero horizontal overflow. Natural paper containment
  remained true at every size. At 390px all nine expanded appearance radios
  and their controls remained inside the viewport.
- Historical Version 2 remained static with `max-height: none`, visible
  overflow, equal client/scroll height, and zero document/paper overflow in
  the shared natural-height renderer.
- The synthetic isolated fixture cleaned to users=0 and owned=0. A separate
  exact-email synthetic debug account created during local port diagnosis was
  deleted from local database `career_learning_hub` (before=1, deleted=1,
  after=0). All Codex-started services were stopped.

## Completed human visual gate and retained implementation notes

- Human visual approval was granted after the final Chrome workspace-polish
  review with token `PHASE_19A1_RESUME_EDITOR_WORKSPACE_VISUAL_APPROVED`.
- The operator's final Chrome approval closes the remaining human-only visual
  checks, including actual 200% zoom and keyboard use of the focused desktop
  Live Preview scroll region.
- The repository browser-service fixture still supplies an obsolete test-only
  Gemini model sentinel rejected by current fixed-model validation. Runtime
  verification used a temporary in-memory substitution to
  `gemini-3.6-flash`; repository provider configuration was not changed.
- The optional offline modern-web-guidance package was not present locally;
  no dependency or external lookup was introduced.

## Future / inactive Resume Studio refinements

Neither future refinement is activated by this closeout:

- `PHASE 19A-3 — RESUME SAVE & EXPORT WORKFLOW`: audit and simplify Save new
  version and design-persistence UX; improve Print / Save as PDF; clarify which
  immutable saved Resume version is exported; preserve immutable-version
  semantics.
- `PHASE 19A-4 — CANDIDATE PHOTO SUPPORT`: inspect and implement a canonical
  owned image-asset flow covering upload validation, private storage,
  ownership, replace/remove, supported templates, Live Preview, Print / Save
  as PDF, and deletion cleanup. The existing `showProfilePhoto` field is not
  treated as an asset source.

Phase 19A remains incomplete, and neither future item is active.

## Next planned task

After the completed Phase 19A-1 closeout, the exact next bounded task remains:

`PHASE 19A-2 — RESUME COLLECTION AND CREATION WORKFLOW`

That task is expected to address findings 013-018 only after separate
authorization. Phase 19A-2, Phase 19A-3, and Phase 19A-4 are all inactive.
