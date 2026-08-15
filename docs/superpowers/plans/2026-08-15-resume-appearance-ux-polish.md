# Resume Appearance UX Polish — Implementation Plan

## Baseline

- Base branch: `main`
- Approved baseline commit: `256d8f35aa74eeab7d359ef6476357ed97bbce09`
- Feature branch: `feature/resume-appearance-ux-polish`

## Goal

Polish the existing Resume Appearance selector without expanding the template catalogue or changing Resume data, API, persistence, Candidate Photo, PDF import, or Resume document rendering behavior.

## Implementation steps

1. Preserve the existing three template IDs, three font values, and three palette IDs.
2. Add display-only `bestFor` guidance to template registry metadata.
3. Keep the existing `ResumeDesignControls` state machine, live preview callbacks, explicit save, reset, and fallback behavior.
4. Improve the template gallery with larger framed miniatures, concise fit guidance, and explicit selected state.
5. Improve Typography and Color grouping while retaining the existing radio inputs as the semantic controls.
6. Add representative palette swatches from trusted registry roles; do not add arbitrary color input.
7. Keep page-size editing in the existing Print / Save as PDF component; only show the current paper size and where to change it.
8. Isolate the visual changes in a dedicated Appearance stylesheet so shared Resume workspace styling and Resume document styling stay untouched.
9. Update focused `ResumeDesignControls` and template-registry tests for the new visible guidance and labels.
10. Keep the implementation responsive, keyboard accessible, and reduced-motion aware.

## Approved post-QA repairs

1. Name-only Compact Technical skill groups receive a lighter, slightly smaller standalone-label treatment while keyword-bearing groups keep the existing group-name + keyword hierarchy.
2. Compact Technical keeps a bounded `620px` minimum width only in the on-screen Live preview when the editor column is narrower.
3. The outer Live preview card remains the sticky shell. A dedicated inner `resume-live-preview-viewport` owns horizontal and wide-screen vertical scrolling so the template label, `Live preview` heading, and A4/Letter badge stay fixed and aligned.
4. Print-only Resume surfaces bypass the live-preview viewport entirely.

## Explicit non-goals

Do not change:

- Candidate Photo behavior or storage;
- Resume API or backend;
- MongoDB or migrations;
- Gemini or AI routing;
- PDF import;
- print/PDF document rendering;
- page-size persistence;
- Resume version behavior;
- template/font/palette IDs;
- add arbitrary font-size controls.

## Local qualification gate

After pulling the feature branch, run:

- focused Resume Appearance / template / live-preview tests;
- frontend typecheck;
- frontend production build;
- `git diff --check` against `origin/main`;
- full frontend regression.

Then complete browser QA for:

- selected template clarity;
- template miniatures and Best-for guidance;
- font switching;
- palette switching;
- live preview;
- unsaved state;
- explicit save and reset;
- refresh persistence;
- keyboard behavior;
- responsive layout;
- Compact Technical name-only skill weight;
- Compact Technical inner résumé scrolling with the header and A4/Letter badge fixed and aligned.

No merge, deployment, or branch deletion occurs without separate approval.
