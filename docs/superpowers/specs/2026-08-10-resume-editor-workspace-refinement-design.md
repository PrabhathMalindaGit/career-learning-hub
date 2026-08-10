# Resume Editor Workspace Refinement Design

## Status and authority

- Phase: `19A-1 — Resume Editor Workspace Refinement`.
- Prompt ID: `CLH-PHASE-19A-1-RESUME-EDITOR-WORKSPACE-01`.
- Date: 2026-08-10.
- Design approval token:
  `PHASE_19A1_RESUME_EDITOR_WORKSPACE_DESIGN_APPROVED`.
- Approved findings:
  - `CLH-UX-RESUME-EDITOR-004` — editor and Live Preview workspace.
  - `CLH-UX-RESUME-EDITOR-005` — native browser spellcheck preservation.
- Findings 013–018 and completed findings 001–003 are outside this design.
- The operator retains all Git lifecycle actions. This document and all
  implementation changes must remain unstaged and uncommitted.

## Verified starting point

- Branch: `phase-19a-1-resume-editor-workspace`.
- HEAD: `4645ccb9ff610df1005481375a7d3c373703fdbd`.
- Initial worktree: clean.
- `ResumeWorkspace` owns the local draft, canonical saved version, dirty
  fingerprint, immutable version saving, cancellation, stale-response
  protection, design state, analysis, historical snapshots, and navigation
  blocker.
- `ResumeEditor` renders the editable canonical Resume sections and emits local
  draft changes.
- `ResumePreview` renders directly from the local draft without a network or AI
  request.
- Printing uses a separate in-place print-only `ResumePreview` sourced from the
  current saved version or explicitly selected historical version, never the
  dirty draft.
- Save and Discard are in the workspace heading. Print is in its existing
  dedicated panel above the editor workspace.
- The current editor, Live Preview, role-aware assessment, and AI-assisted
  assessment are ordered as four children of `.resume-workspace-grid`.
- The current grid is one column at every width. The live paper is centered and
  capped at 860px. Live Preview is non-sticky.
- Resume-specific breakpoints are 900px, 1200px, 1080px, 720px, and 420px. The
  application shell changes at 980px and caps `.app-main` at 1120px.
- Normal prose controls inherit native browser spellcheck. URL-style controls
  intentionally set `spellCheck={false}`, `inputMode="url"`, and
  `autoCapitalize="none"`.

## Historical constraint

Phase 18 UI-R1 deliberately replaced an earlier broad two-column layout and
globally sticky preview with a stacked editor-first workspace and non-sticky
Live Preview. That earlier layout used minimum column widths of approximately
360px and 430px, allowed the two assessment panels to occupy the same grid,
and applied stickiness to every preview panel until the 1080px breakpoint.

Phase 19A-1 must not restore that implementation wholesale. The new layout is
scoped only to the editable workspace, activates only when the shell leaves
enough usable width, keeps assessments full-width below, and preserves all
historical and print preview contexts.

## Considered approaches

### A. Wide scoped grid with conditional sticky Live Preview — selected

At a candidate minimum viewport width of 1280px, place the editor in a flexible
left column and Live Preview in a bounded right column. Make both assessment
panels span the complete grid below. Scope a sticky rule only to the live
preview that is a direct child of the workspace grid. Do not set a maximum
height and do not introduce overflow scrolling.

This provides the most useful relationship while limiting the historical
sticky behavior to widths where the editor and preview are both usable.

### B. Wide scoped grid with non-sticky Live Preview — approved fallback A

Retain the two columns but leave Live Preview in normal page flow. Use this
fallback if browser evidence finds that stickiness makes long preview content
inaccessible or causes clipping, awkward scrolling, focus, zoom, or layout
problems.

### C. Existing stacked layout — approved fallback B

Retain the current layout if the two-column composition is materially worse in
the actual application shell. Report the runtime evidence instead of forcing
the finding.

## Selected layout design

The implementation should require only `resumeWorkspace.css` unless a test
shows that the existing semantic child structure cannot express the approved
layout safely.

At widths below the selected wide breakpoint:

- `.resume-workspace-grid` remains one column;
- editor, Live Preview, role-aware assessment, and AI-assisted assessment keep
  their existing document order;
- Live Preview remains non-sticky;
- tablet, mobile, and browser 200% zoom use normal document scrolling.

At the wide breakpoint and above:

- `.resume-workspace-grid` uses two bounded columns;
- `.resume-editor` occupies the left column;
- the direct-child `.resume-preview-panel` occupies the right column;
- `.resume-analysis-runner` and `.resume-ai-panel` span both columns;
- the candidate 1280px threshold may be adjusted only if runtime measurements
  show a clearly better boundary;
- the live paper remains width-bounded and uses no nested scroll container;
- sticky positioning, if retained, has a small viewport-relative top offset,
  normal visible overflow, and no maximum height.

The implementation does not move, duplicate, or redesign Save, Discard, Print,
section navigation, design controls, assessments, historical review, or the
print surface.

## Data flow and behavior preservation

The data flow remains:

`canonical saved Resume version -> local ResumeDraft -> ResumeEditor changes ->
ResumeWorkspace state -> Live ResumePreview`.

Saving continues to validate the draft and submit the existing
`expectedCurrentVersionId` contract. The returned canonical version replaces
the local baseline. Discard reconstructs the draft from the current saved
version. The route blocker and `beforeunload` continue to derive from the same
draft fingerprint.

No API, persistence, ownership, authentication, provider, request-ID, schema,
shared-type, or immutable-version behavior changes.

## Spellcheck design

Finding 005 is satisfied by preserving the existing browser-native boundary:

- prose inputs and textareas must not set `spellCheck={false}`;
- representative prose controls include Full name, Headline, Professional
  summary, experience bullets, project descriptions, project bullets, and
  assessment target text;
- URL-style inputs retain the intentional spellcheck opt-out;
- no dictionary, typo detector, correction UI, automatic rewrite, dependency,
  backend call, or AI request is added;
- user text is never changed unless the user edits it or explicitly applies an
  existing stored AI suggestion through the unchanged workflow.

Because production behavior is already correct, Finding 005 requires
regression coverage rather than a production markup change.

## Test-first implementation

Before changing production CSS:

1. Replace the existing unit assertion that requires an always-stacked grid
   and non-sticky preview with a failing assertion for:
   - unchanged semantic child order;
   - a default one-column layout;
   - a wide two-column override;
   - full-width assessment panels;
   - a preview rule scoped to the live workspace;
   - no nested preview overflow or maximum-height rule.
2. Add representative spellcheck regression assertions proving that prose
   fields do not disable native spellcheck while URL controls still do.
3. Run the focused test and confirm the layout assertion fails for the missing
   wide composition. The spellcheck assertions may pass immediately because
   they preserve existing behavior.
4. Add the minimum CSS required to pass the layout assertion.

Tests must not depend on arbitrary computed pixel coordinates where semantic
layout relationships are sufficient. Runtime browser verification is the
authority for actual geometry.

## Automated verification

Run, in order:

1. Focused `ResumeEditor` and `ResumeWorkspace` unit tests.
2. Affected routing/navigation tests only if source changes affect routing or
   navigation; otherwise record them as not required.
3. Frontend typecheck.
4. Complete frontend unit suite.
5. Frontend production build.
6. `git diff --check`.

No backend test suite is required because backend and shared-contract changes
are prohibited.

## Browser and runtime verification

Browser inspection begins only after implementation and automated checks pass.
Use synthetic data and the existing local browser-test foundation. Verify:

| Viewport or mode | Required layout |
| --- | --- |
| 1440 × 900 | Comfortable editor-left/preview-right workspace if retained |
| 1024 × 768 | Single column |
| 768 × 1024 | Single column |
| 390 × 844 | Single column |
| 320 × 720 | Single column |
| Actual browser 200% zoom | Usable reflow with no sticky preview region |

At every applicable size, inspect horizontal overflow, clipping, overlap,
preview reachability, long Resume content, normal page scrolling, focus
visibility, Save/Discard/Print discoverability, and print-media isolation.

Keyboard verification covers Tab, Shift+Tab, Enter on native fragment links
and buttons, Space on buttons where browser-native behavior applies, section
navigation, Save, Discard, and Print.

Functional smoke covers a local edit appearing in Live Preview, dirty-state
visibility, Discard, Save new version with synthetic data, print availability,
and unsaved-navigation protection. Inspect representative prose and URL
controls in the rendered DOM for their spellcheck attributes. Do not claim a
browser dictionary result.

If sticky behavior fails any required check, apply fallback A and rerun the
affected checks. If the grid itself fails, apply fallback B and document why.
At most three code-changing attempts may address one root failure.

## Security, privacy, and AI boundary

- Use synthetic Resume data only.
- Do not log Resume content or other personal data.
- Do not invoke Gemini or any other provider for this phase.
- Gemini Direct and fixed `gemini-3.6-flash` policy remain unchanged.
- OpenRouter remains dormant; no provider fallback is introduced.
- Do not modify backend, shared contracts, schemas, environment files,
  dependencies, deployment configuration, ownership, or authentication.
- Remove synthetic records and stop every locally started service before the
  final report.

## Documentation and completion boundary

The minimum planning update must record Phase 19A-1 activation, the design
approval token, Finding 004 and 005 status, the retained or fallback layout,
verification evidence, limitations, and the next task:
`PHASE 19A-2 — RESUME COLLECTION AND CREATION WORKFLOW`.

Phase 19A remains incomplete. Findings 013–018 remain inactive. Visible work
requires the operator token
`PHASE_19A1_RESUME_EDITOR_WORKSPACE_VISUAL_APPROVED` before any later commit.

## Human visual-review repair addendum

The first human Chrome review rejected the implementation with
`PHASE_19A1_VISUAL_REVIEW_REJECTED_REPAIR_REQUIRED`. Automated layout checks
were not sufficient to catch four connected visual problems: Skills text
breaking within words, nine always-expanded editor sections, oversized skill
group cards, and the resulting editor/preview height imbalance.

The approved repair keeps the existing schema, editor order, navigation links,
preview renderer, save flow, and non-sticky wide grid. It adds:

- a controlled disclosure header for each of the nine editor sections;
- Basics open initially, with the other sections initially collapsed and no
  strict single-open rule;
- section links that open the requested section before focusing its disclosure
  control;
- automatic opening of sections containing client or mapped server validation
  errors before the existing first-invalid-field scroll/focus step;
- compact Skills editor rows that retain group name, comma-separated keywords,
  stable identity, ordering, Add, Move up/down, and Remove semantics;
- a Skills-only preview layout whose items wrap horizontally between atomic
  groups and whose names use normal word breaking.

Native disclosure buttons expose `aria-expanded` and `aria-controls`.
Collapsed content is removed from keyboard navigation. No nested scrolling,
new dependency, generic accordion framework, backend change, schema change, or
sticky preview is introduced before repaired browser geometry is evaluated.
