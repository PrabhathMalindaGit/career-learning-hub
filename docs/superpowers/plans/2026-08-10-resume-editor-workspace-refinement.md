# Resume Editor Workspace Refinement Implementation Plan

> **For agentic workers:** Execute this plan inline in the current task. Do not
> dispatch subagents, create a worktree, stage, commit, push, merge, create a
> pull request, or deploy.

**Goal:** Refine only the wide Resume editor workspace so the editor and Live
Preview are useful side by side when evidence supports it, while preserving
single-column reflow and native browser spellcheck.

**Architecture:** Keep `ResumeWorkspace` markup, state, API contracts, and
print rendering unchanged. Express the preferred layout as a scoped CSS Grid
override at a candidate 1280px breakpoint, with both assessment panels spanning
the grid. Retain sticky Live Preview only if the post-implementation browser
matrix proves it safe; otherwise use the approved non-sticky or stacked
fallback.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, Vitest, Testing Library, CSS
Grid, existing bundled Playwright/Chrome runtime.

## Global constraints

- Authorized findings are only `CLH-UX-RESUME-EDITOR-004` and
  `CLH-UX-RESUME-EDITOR-005`.
- Findings 013–018 remain inactive; completed findings 001–003 are preserved.
- No backend, shared-contract, schema, dependency, provider, environment, or
  deployment change.
- No Gemini or other provider call.
- Use synthetic data only and remove it after runtime verification.
- Leave every change unstaged.
- Stop all locally started services before final reporting.
- Do not claim Phase 19A-1 complete before the operator supplies
  `PHASE_19A1_RESUME_EDITOR_WORKSPACE_VISUAL_APPROVED`.

---

## File map

- Modify `frontend/src/features/resumes/ResumeWorkspace.test.tsx`: replace the
  obsolete always-stacked CSS contract with the approved default/wide layout
  contract while retaining semantic order and behavior assertions.
- Modify `frontend/src/features/resumes/ResumeEditor.test.tsx`: add native
  spellcheck regression coverage for representative prose controls while
  preserving the existing URL opt-out test.
- Modify `frontend/src/features/resumes/resumeWorkspace.css`: add the minimum
  scoped wide-grid and conditional sticky-preview rules.
- Modify `tests/browser/specs/resume.spec.cjs`: record actual rendered
  editor/preview relationships, scrolling safety, and spellcheck attributes in
  the existing synthetic Resume workflow.
- Modify `docs/planning/CURRENT_PHASE.md`: activate Phase 19A-1 and record the
  approved bounded state without marking all Phase 19A complete.
- Create `docs/planning/PHASE_19A1_RESUME_EDITOR_WORKSPACE_REFINEMENT.md`:
  record implementation, verification, fallback outcome, limitations, and
  human visual-QA handoff.
- Preserve the approved design at
  `docs/superpowers/specs/2026-08-10-resume-editor-workspace-refinement-design.md`.

---

### Task 1: Add the focused layout and spellcheck regression tests

**Files:**

- Modify: `frontend/src/features/resumes/ResumeWorkspace.test.tsx`
- Modify: `frontend/src/features/resumes/ResumeEditor.test.tsx`

**Interfaces:**

- Consumes: the existing `.resume-workspace-grid` child order, `.resume-editor`,
  `.resume-preview-panel`, `.resume-analysis-runner`, and `.resume-ai-panel`.
- Produces: a CSS contract for default single-column flow, wide two-column flow,
  full-width assessments, scoped preview stickiness, and no preview scroll
  container; a DOM contract for native spellcheck.

- [x] **Step 1: Replace the obsolete always-stacked test wording and add RED
  layout assertions**

  Keep the existing DOM-order and behavior assertions, then extract these CSS
  rules from `resumeWorkspaceCss`:

  ```ts
  const defaultGridRule = resumeWorkspaceCss.match(
    /\.resume-workspace-grid\s*\{([^}]*)\}/,
  )?.[1];
  const defaultPreviewRule = resumeWorkspaceCss.match(
    /\.resume-preview-panel\s*\{([^}]*)\}/,
  )?.[1];
  const wideGridRule = resumeWorkspaceCss.match(
    /@media \(min-width: 1280px\)[\s\S]*?\.resume-workspace-grid\s*\{([^}]*)\}/,
  )?.[1];
  const widePreviewRule = resumeWorkspaceCss.match(
    /@media \(min-width: 1280px\)[\s\S]*?\.resume-workspace-grid > \.resume-preview-panel\s*\{([^}]*)\}/,
  )?.[1];
  const wideAssessmentRule = resumeWorkspaceCss.match(
    /@media \(min-width: 1280px\)[\s\S]*?\.resume-analysis-runner,\s*\.resume-ai-panel\s*\{([^}]*)\}/,
  )?.[1];
  ```

  Assert:

  ```ts
  expect(defaultGridRule).toContain("grid-template-columns: minmax(0, 1fr);");
  expect(defaultPreviewRule).toContain("position: static;");
  expect(wideGridRule).toContain("grid-template-columns:");
  expect(wideGridRule).toContain("minmax(390px, 0.88fr)");
  expect(widePreviewRule).toContain("position: sticky;");
  expect(widePreviewRule).not.toContain("overflow");
  expect(widePreviewRule).not.toContain("max-height");
  expect(wideAssessmentRule).toContain("grid-column: 1 / -1;");
  ```

- [x] **Step 2: Add representative spellcheck preservation assertions**

  Render a draft containing an experience bullet, project description, project
  bullet, and URL. Check Full name, Headline, Professional summary, bullets, and
  description:

  ```ts
  expect(control.getAttribute("spellcheck")).not.toBe("false");
  ```

  Retain the existing assertion for each URL-style control:

  ```ts
  expect(input.getAttribute("spellcheck")).toBe("false");
  ```

- [x] **Step 3: Run the focused tests and verify RED**

  Run:

  ```bash
  npm run test --workspace @career-learning-hub/web -- \
    src/features/resumes/ResumeEditor.test.tsx \
    src/features/resumes/ResumeWorkspace.test.tsx
  ```

  Expected result: the new wide-layout test fails because the 1280px grid,
  scoped sticky preview, and full-width assessment rules do not exist. Existing
  behavior and spellcheck assertions remain passing.

---

### Task 2: Implement the minimum preferred wide workspace

**Files:**

- Modify: `frontend/src/features/resumes/resumeWorkspace.css`

**Interfaces:**

- Consumes: unchanged `ResumeWorkspace` child markup.
- Produces: CSS-only desktop composition; no React, state, API, or print
  interface change.

- [x] **Step 1: Add the scoped wide breakpoint**

  Add after the existing 1200px Resume rules:

  ```css
  @media (min-width: 1280px) {
    .resume-workspace-grid {
      grid-template-columns: minmax(0, 1.12fr) minmax(390px, 0.88fr);
    }

    .resume-workspace-grid > .resume-preview-panel {
      position: sticky;
      top: 24px;
    }

    .resume-analysis-runner,
    .resume-ai-panel {
      grid-column: 1 / -1;
    }
  }
  ```

  Do not add overflow, maximum height, internal scrolling, duplicated markup,
  or action-control repositioning.

- [x] **Step 2: Run the focused tests and verify GREEN**

  Run the same focused command from Task 1. Expected result: both files pass
  with zero failures.

- [x] **Step 3: Inspect the scoped diff**

  Run:

  ```bash
  git diff -- frontend/src/features/resumes/ResumeEditor.test.tsx \
    frontend/src/features/resumes/ResumeWorkspace.test.tsx \
    frontend/src/features/resumes/resumeWorkspace.css
  ```

  Confirm every changed line maps to findings 004 or 005 and no markup or
  behavior was changed.

---

### Task 3: Add rendered browser assertions without expanding the workflow

**Files:**

- Modify: `tests/browser/specs/resume.spec.cjs`

**Interfaces:**

- Consumes: the existing synthetic user and Resume created by the main Resume
  browser test.
- Produces: rendered geometry, scroll-safety, and spellcheck evidence within
  the existing three configured browser projects.

- [x] **Step 1: Extend the existing workspace-order block**

  Capture editor and preview bounding boxes and computed styles:

  ```js
  const editorPanel = page.getByRole("region", { name: "Resume editor" });
  const layoutFacts = await workspaceLayout.evaluate((element) => {
    const editor = element.children.item(0);
    const preview = element.children.item(1);
    if (!(editor instanceof HTMLElement) || !(preview instanceof HTMLElement)) {
      throw new Error("Resume editor workspace children are unavailable.");
    }
    const editorRect = editor.getBoundingClientRect();
    const previewRect = preview.getBoundingClientRect();
    const previewStyle = getComputedStyle(preview);
    return {
      editorLeft: editorRect.left,
      editorTop: editorRect.top,
      editorRight: editorRect.right,
      previewLeft: previewRect.left,
      previewTop: previewRect.top,
      previewPosition: previewStyle.position,
      previewOverflowY: previewStyle.overflowY,
      rootOverflow: document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    };
  });
  ```

  For `desktop`, require preview-left to be at or beyond editor-right and
  `position: sticky`. For tablet/mobile, require preview-top to be below the
  editor-top and `position: static`. In all projects require root overflow to
  be at most one rounding pixel and preview overflow not to be `auto` or
  `scroll`.

- [x] **Step 2: Add rendered spellcheck assertions**

  Check representative prose controls do not have `spellcheck="false"` and
  the Resume URL controls retain `spellcheck="false"`. This verifies only that
  application markup permits native spellcheck, not dictionary correctness.

- [x] **Step 3: Keep all existing behavior assertions intact**

  Do not remove or weaken the existing create, edit, preview, validation,
  immutable save, Discard, print, history, design, dirty-navigation, provider
  request, ownership, or cleanup checks.

---

### Task 4: Run automated frontend verification

**Files:** None unless a failure has a demonstrated in-scope root cause.

**Interfaces:** Produces fresh verification evidence before browser use.

- [x] **Step 1: Run focused Resume tests**

  ```bash
  npm run test --workspace @career-learning-hub/web -- \
    src/features/resumes/ResumeEditor.test.tsx \
    src/features/resumes/ResumeWorkspace.test.tsx \
    src/features/resumes/ResumePreview.test.tsx \
    src/features/resumes/ResumePrintControls.test.tsx \
    src/features/resumes/resumePrint.test.ts
  ```

- [x] **Step 2: Run frontend typecheck**

  ```bash
  npm run typecheck --workspace @career-learning-hub/web
  ```

- [x] **Step 3: Run the complete frontend suite**

  ```bash
  npm run test --workspace @career-learning-hub/web
  ```

- [x] **Step 4: Run the frontend production build**

  ```bash
  npm run build --workspace @career-learning-hub/web
  ```

- [x] **Step 5: Check patch formatting**

  ```bash
  git diff --check
  ```

  Routing tests are not separately required unless React routing/navigation
  source changes. Backend tests are not run because no backend or shared
  contract changes are permitted.

---

### Task 5: Run browser and runtime verification

**Files:**

- Modify `resumeWorkspace.css` only if the approved fallback hierarchy is
  triggered by reproduced evidence.

**Interfaces:** Produces actual rendered evidence and the final preferred,
fallback A, or fallback B outcome.

- [x] **Step 1: Load the bundled workspace runtime and run the focused Resume
  browser spec**

  Use the repository's authorized bundled Playwright runtime and existing
  `tests/browser/playwright.config.cjs`. Do not install a dependency or add a
  package script. Run all configured Resume projects so the existing synthetic
  fixture cleanup remains authoritative.

- [x] **Step 2: Verify supplemental viewport sizes**

  Inspect 1440 × 900, 1024 × 768, 768 × 1024, 390 × 844, and 320 × 720. Confirm
  two columns only at 1440, one column elsewhere, no horizontal overflow,
  clipping, overlap, nested scroll, or inaccessible preview content.

- [x] **Step 3: Verify long content and functional behavior**

  Use the existing synthetic long-summary flow. Confirm preview reachability,
  local preview updates, dirty status, Discard, Save new version, Print,
  section navigation, and unsaved-navigation protection.

- [x] **Step 4: Verify keyboard and focus**

  Check Tab, Shift+Tab, Enter and Space on applicable controls, visible focus,
  direct section navigation, Save, Discard, and Print.

- [x] **Step 5: Verify actual browser 200% zoom**

  In local Chrome, set actual page zoom to 200%, inspect reflow and focus, then
  restore 100%. Record any inability to prove the native zoom percentage
  truthfully rather than substituting a viewport emulation claim.

- [x] **Step 6: Apply an approved fallback only if evidence requires it**

  - Fallback A: remove only `position: sticky` and `top` from the wide direct
    preview rule while retaining the two-column grid.
  - Fallback B: remove the 1280px wide-grid block and retain the existing
    stacked layout.

  Rerun affected focused tests, typecheck, build, and browser checks after a
  fallback. Stop after three unsuccessful code-changing attempts for one root
  failure.

- [x] **Step 7: Confirm cleanup**

  Verify the browser teardown removed synthetic users and owned records. Stop
  every service started by Codex and confirm no project listener remains.

---

### Task 6: Record Phase 19A-1 evidence and prepare human visual QA

**Files:**

- Modify: `docs/planning/CURRENT_PHASE.md`
- Create: `docs/planning/PHASE_19A1_RESUME_EDITOR_WORKSPACE_REFINEMENT.md`

**Interfaces:** Produces the minimum governance record; changes no runtime
behavior.

- [x] **Step 1: Record activation and approved boundary**

  Record both design approval tokens, findings 004–005 only, excluded findings,
  frontend-only scope, and no Git/cloud/provider action.

- [x] **Step 2: Record exact verification evidence**

  Copy exact commands, pass/fail counts, browser viewport outcomes, selected
  layout or fallback, zoom result, keyboard/focus result, spellcheck result,
  functional smoke, cleanup result, and limitations. Do not fabricate or
  predict results.

- [x] **Step 3: Record the next task**

  Set the next planned task to
  `PHASE 19A-2 — RESUME COLLECTION AND CREATION WORKFLOW`. Keep all Phase 19A
  and findings 013–018 incomplete/inactive.

- [x] **Step 4: Run final verification and inspect Git state**

  Rerun the focused Resume tests, frontend typecheck, complete frontend suite,
  frontend build, and `git diff --check` after documentation is final. Then run:

  ```bash
  git status --short
  git diff --stat
  git diff -- frontend/src/features/resumes/ResumeEditor.test.tsx \
    frontend/src/features/resumes/ResumeWorkspace.test.tsx \
    frontend/src/features/resumes/resumeWorkspace.css \
    tests/browser/specs/resume.spec.cjs \
    docs/planning/CURRENT_PHASE.md \
    docs/planning/PHASE_19A1_RESUME_EDITOR_WORKSPACE_REFINEMENT.md
  ```

  Check changed files for secrets, generated output, unrelated edits, and
  staged paths. Leave all changes unstaged.

- [x] **Step 5: Prepare the human visual-QA handoff**

  Provide the local URL and Resume route, safe synthetic access information if
  still needed, exact viewport/zoom/keyboard checklist, visual changes,
  deliberate non-changes, remaining limitations, and the required token
  `PHASE_19A1_RESUME_EDITOR_WORKSPACE_VISUAL_APPROVED`.

---

## Human visual-review repair plan

The operator rejected the first visual implementation with
`PHASE_19A1_VISUAL_REVIEW_REJECTED_REPAIR_REQUIRED`. Execute this addendum
inline without Git lifecycle actions.

### Repair Task 1: Add disclosure and validation-reveal contracts

**Files:**

- Modify: `frontend/src/features/resumes/ResumeEditor.test.tsx`
- Modify: `frontend/src/features/resumes/ResumeWorkspace.test.tsx`
- Modify: `frontend/src/features/resumes/ResumeEditor.tsx`
- Modify: `frontend/src/features/resumes/ResumeWorkspace.tsx`

**Interfaces:**

- `ResumeEditor` consumes an optional focus request containing a field path
  and monotonically increasing request id.
- Each section exposes a stable toggle and content id derived from the existing
  section id.
- Field paths map only to the existing nine section ids.

- [x] **Step 1: Write failing editor disclosure tests**

  Assert Basics is expanded, the other eight sections are collapsed, each
  toggle exposes `aria-expanded` and `aria-controls`, Space/Enter can reveal
  content, and the existing nine navigation links remain.

- [x] **Step 2: Write failing navigation and validation tests**

  Assert activating Certifications opens it before focus moves to its toggle.
  In workspace tests, collapse Links/Projects, trigger client and mapped server
  errors, and assert the relevant section opens before the first invalid field
  receives focus while draft content, summary links, request id, and inline
  errors remain.

- [x] **Step 3: Run RED**

  Run:

  ```bash
  npm run test --workspace @career-learning-hub/web -- \
    src/features/resumes/ResumeEditor.test.tsx \
    src/features/resumes/ResumeWorkspace.test.tsx
  ```

  Expected: disclosure queries fail because sections are always expanded and
  no section toggle or focus-request contract exists.

- [x] **Step 4: Implement the minimum controlled disclosure**

  Add one local open-section `Set` in `ResumeEditor`, a small field-path to
  section-id mapper, one reusable section wrapper, and an optional focus
  request. Keep Basics initially open. Section navigation opens its target and
  focuses the toggle. Validation error changes open every affected section;
  focus requests then scroll/focus the first invalid field.

- [x] **Step 5: Run GREEN**

  Run the focused command and require zero failures before continuing.

### Repair Task 2: Compact Skills and prevent preview word fragmentation

**Files:**

- Modify: `frontend/src/features/resumes/ResumeEditor.test.tsx`
- Modify: `frontend/src/features/resumes/ResumePreview.test.tsx`
- Modify: `frontend/src/features/resumes/ResumeEditor.tsx`
- Modify: `frontend/src/features/resumes/ResumePreview.tsx`
- Modify: `frontend/src/features/resumes/resumeWorkspace.css`

**Interfaces:**

- Skill data remains `{ clientKey, name, keywords }`.
- Existing accessible action names remain `Move skill group N up/down` and
  `Remove skill group N`.
- Preview Skills receives a dedicated class; unrelated lists keep their
  current layout and wrapping.

- [x] **Step 1: Write failing compact-row and preview tests**

  Render 16 groups. Assert one stable row per client key, the same labelled name
  and comma-separated keyword inputs, unchanged accessible action names, and
  preserved reorder/remove behavior. Assert preview Skills has a dedicated
  class whose CSS uses wrapping horizontal layout and resets `overflow-wrap`
  and `word-break` for skill names/items.

- [x] **Step 2: Run RED**

  Run the editor and preview test files. Expected: dedicated row/list classes
  and Skills-only wrapping rules are absent.

- [x] **Step 3: Implement the minimum markup and CSS**

  Reuse the current mapped groups and MoveButtons. Add compact modifiers only
  for Skills, retain native inputs, and show symbol-sized actions with their
  existing `aria-label` values. Change only the Skills preview class to a
  flex-wrapped list with normal word breaking and no horizontal scroll.

- [x] **Step 4: Run GREEN**

  Run focused editor/preview/workspace/print tests and require zero failures.

### Repair Task 3: Verify rendered quality and close the repair handoff

**Files:**

- Modify: `tests/browser/specs/resume.spec.cjs`
- Modify: `docs/planning/CURRENT_PHASE.md`
- Modify:
  `docs/planning/PHASE_19A1_RESUME_EDITOR_WORKSPACE_REFINEMENT.md`

- [x] **Step 1: Extend the existing synthetic browser fixture**

  Use 16 or more skill groups and the required representative names. Assert
  initial disclosure state, navigation reveal, client validation reveal,
  compact skill row geometry, complete skill text, zero horizontal overflow,
  no nested scroll, and no preview/assessment overlap.

- [x] **Step 2: Run required automated verification**

  Run focused Resume tests, frontend typecheck, the complete frontend suite,
  production build, browser-spec syntax, and `git diff --check`.

- [x] **Step 3: Use only the built-in browser**

  Inspect 1440×900, 1024×768, 768×1024, 390×844, 320×720, and actual 200%
  zoom. Exercise disclosure buttons, navigation, validation focus, Save,
  Discard, Print, Tab/Shift+Tab, Enter, and Space. Keep the preview non-sticky
  unless repaired geometry proves a bounded sticky rule is both necessary and
  safe.

- [x] **Step 4: Record and clean up**

  Update the existing Phase 19A-1 record with the rejection, repair, exact
  evidence, remaining visual gate, and unchanged next task. Delete synthetic
  data, stop every locally started service, leave all files unstaged, and end
  the handoff with
  `PHASE_19A1_REPAIR_READY_FOR_HUMAN_VISUAL_REVIEW` only when evidence is
  complete.

### Repair Task 4: Contain long content in the shared screen paper

**Files:**

- Modify: `frontend/src/features/resumes/ResumePreview.test.tsx`
- Modify: `frontend/src/features/resumes/resumeWorkspace.css`
- Modify: `tests/browser/specs/resume.spec.cjs`
- Modify: `docs/planning/CURRENT_PHASE.md`
- Modify:
  `docs/planning/PHASE_19A1_RESUME_EDITOR_WORKSPACE_REFINEMENT.md`

- [x] **Step 1: Reproduce and write the failing contract**

  Confirm the shared screen paper has a finite A4 aspect-ratio height with
  visible overflow. Add a focused test requiring natural height and a browser
  helper requiring the paper bottom to contain its last visible descendant
  without horizontal, vertical, clipped, or nested-scroll overflow.

- [x] **Step 2: Implement the minimum CSS repair**

  Remove only the base screen-paper `aspect-ratio`; retain responsive width,
  minimum height, paper visuals, shared renderer, and the existing isolated
  print rule.

- [x] **Step 3: Verify both shared-renderer paths**

  Check a long synthetic Resume in Live Preview and Historical Snapshot at
  1440 x 900, 1024 x 768, 768 x 1024, 390 x 844, and 320 x 720. Require final
  Certifications content inside the paper and zero document/paper overflow.

- [x] **Step 4: Preserve the human gate and clean up**

  Record the second Chrome rejection and containment evidence in the existing
  Phase 19A-1 record, remove the synthetic fixture, stop local services, leave
  all changes unstaged, and retain the same final human approval token.

### Repair Task 5: Final workspace polish after third human review

**Files:**

- Modify: `frontend/src/features/resumes/ResumeDesignControls.test.tsx`
- Modify: `frontend/src/features/resumes/ResumeDesignControls.tsx`
- Modify: `frontend/src/features/resumes/ResumeWorkspace.test.tsx`
- Modify: `frontend/src/features/resumes/ResumeWorkspace.tsx`
- Modify: `frontend/src/features/resumes/ResumePreview.tsx`
- Modify: `frontend/src/features/resumes/resumeWorkspace.css`
- Modify: `tests/browser/specs/resume.spec.cjs`
- Modify: `docs/planning/CURRENT_PHASE.md`
- Modify:
  `docs/planning/PHASE_19A1_RESUME_EDITOR_WORKSPACE_REFINEMENT.md`

**Interfaces:**

- `ResumePreview` remains the only renderer; `.resume-paper` retains natural
  height and all existing print behavior.
- A nested `.resume-editor-preview-grid` constrains only the editor and Live
  Preview. Assessment panels remain later siblings in normal page flow.
- `ResumeDesignControls` keeps the same props, nine registry-backed radios,
  immediate preview callback, explicit save callback, fallback handling, and
  request-ID status contract.

- [x] **Step 1: Write failing compact-design tests**

  Require the current Template, Font, Palette, and page size summary to be
  visible while customization is collapsed. Require a button with
  `aria-expanded=false` and `aria-controls`; activate it, then require all nine
  existing radios, three bounded values per group, native keyboard selection,
  immediate preview updates, explicit save, fallback, and status behavior.

- [x] **Step 2: Write failing workspace layout tests**

  Require the editor and Live Preview to share a dedicated nested grid before
  both assessment panels. Require the base preview to remain static and
  unbounded; in the existing `min-width: 1280px` rule require the Live Preview
  panel—not `.resume-paper`—to use sticky positioning, a safe top offset,
  viewport-derived maximum height, vertical auto overflow, and hidden
  horizontal overflow. Require no sticky section-navigation rule.

- [x] **Step 3: Run RED**

  Run:

  ```bash
  npm run test --workspace @career-learning-hub/web -- \
    src/features/resumes/ResumeDesignControls.test.tsx \
    src/features/resumes/ResumeWorkspace.test.tsx \
    src/features/resumes/ResumeEditor.test.tsx \
    src/features/resumes/ResumePreview.test.tsx
  ```

  Expected: the compact disclosure, nested editor/preview grid, bounded wide
  preview, and non-sticky navigation contracts are absent.

- [x] **Step 4: Implement the minimum React and CSS changes**

  Add one local customization boolean to `ResumeDesignControls`; render the
  concise current-choice summary and accessible toggle outside the conditional
  choice surface. Remove repeated Selected badges and reduce only the existing
  card-preview CSS. Wrap only the editor and Live Preview in the nested grid,
  make the screen preview panel keyboard focusable, remove the 1200px sticky
  navigation rule, and scope bounded sticky scrolling to the Live Preview
  panel inside the nested grid at 1280px and above.

- [x] **Step 5: Run GREEN and browser verification**

  Run the focused command, frontend typecheck, complete frontend suite,
  frontend production build, browser-spec syntax, and `git diff --check`.
  Then use one built-in browser with a long synthetic Resume at 1440 x 900,
  1024 x 768, 768 x 1024, 390 x 844, and 320 x 720. At desktop require a
  keyboard-scrollable preview panel contained by the editor/preview grid and
  ending before assessments; below 1280px require static, visible overflow and
  no internal scroll. Verify paper containment, design interaction, section
  navigation reveal/focus, Save design, and zero horizontal overflow.

- [x] **Step 6: Document, defer Candidate Photo, and clean up**

  Record the third Chrome rejection and exact evidence in the existing phase
  record. Record Candidate Photo as a future architecture/security-reviewed
  `PHASE 19A-4` proposal without activating or implementing it. Remove all
  synthetic data and temporary files, stop local services, leave all changes
  unstaged, and retain the Phase 19A-1 human visual approval gate.
