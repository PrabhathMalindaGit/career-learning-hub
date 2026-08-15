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

## Explicit non-goals

Do not change:

- Resume template layout/rendering components;
- Candidate Photo behavior or storage;
- Resume API or backend;
- MongoDB or migrations;
- Gemini or AI routing;
- PDF import;
- print/PDF document rendering;
- page-size persistence;
- Resume version behavior;
- template/font/palette IDs.

## Local qualification gate

After pulling the feature branch, run:

- focused Resume Appearance tests;
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
- responsive layout.

No merge, deployment, or branch deletion occurs without separate approval.
