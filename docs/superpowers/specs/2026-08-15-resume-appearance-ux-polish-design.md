# Resume Appearance UX Polish — Design Specification

## Objective

Polish the existing Resume Appearance experience so it feels like a focused Resume design selector rather than a generic settings form, while preserving all existing Resume design persistence and backend behavior.

## Locked scope

Keep exactly the existing templates:

- ATS Classic
- Modern Professional
- Compact Technical

Keep exactly the existing fonts:

- Inter
- Arial
- Georgia

Keep exactly the existing palettes:

- Slate
- Forest
- Navy

Do not add new templates, custom fonts, arbitrary colors, drag-and-drop, section ordering, backend changes, Gemini changes, Candidate Photo storage changes, PDF import changes, or a new PDF renderer.

## Template gallery

Each template card should present:

- the existing `ResumeMiniDocument` preview;
- template name;
- concise description;
- a short `Best for` guide;
- a clear selected state that does not rely on color alone.

The template fit guidance is:

- ATS Classic — ATS-heavy and traditional applications.
- Modern Professional — General professional and business roles.
- Compact Technical — Engineering, software, and technical roles.

## Appearance hierarchy

The customization experience should emphasize:

1. Template
2. Typography
3. Color

Paper size remains owned by the existing Print / Save as PDF workflow. Resume Appearance may show the current paper size and direct the user to the existing print control, but must not duplicate or move page-size persistence.

## Interaction rules

- Preserve immediate unsaved live preview.
- Preserve explicit save behavior; do not add autosave.
- Preserve reset behavior.
- Preserve deterministic safe fallback for unavailable stored design values.
- Preserve radio semantics and keyboard interaction.
- Make selected template state visually explicit with a check and `Selected` text.
- Keep font and palette selection compact.
- Show representative palette swatches while retaining text labels.
- Show a concise unsaved state and saving state.

## Approved post-QA presentation repairs

- Name-only Compact Technical skill groups may use a lighter, slightly smaller standalone-label treatment while keyword-bearing groups preserve the existing grouped hierarchy.
- Compact Technical may keep a bounded minimum width only in the on-screen Live preview so its dense technical layout is not crushed by a narrow editor column.
- Horizontal and desktop vertical scrolling belong to an inner résumé viewport, not the entire Live preview card.
- The template label, `Live preview` heading, and A4/Letter badge stay outside that scroll viewport and remain fixed/aligned.
- Print-only and saved-export surfaces do not use the live-preview viewport or its minimum-width behavior.

## Approved print-parity repair

PDF QA showed that native Chromium printing can apply narrow responsive rules and paged-media fragmentation differently from the on-screen saved-version preview. The following print-only corrections are approved:

- Compact Technical must retain the same two-column Skills structure in print that it uses in the saved-version preview; narrow print viewport rules must not collapse it to one column.
- Modern Professional must not print an identity-only first page followed by the entire body on page 2.
- Modern Professional keeps the same main-content versus supporting-sidebar identity, but its main/sidebar wrapper boxes may be flattened only inside `@media print` so the individual semantic Resume sections become separate grid items that Chromium can paginate between.
- Modern main sections remain in the left print column and supporting sections remain in the right print column with deterministic section-row placement.
- The print repair must not change the normal Live preview or saved-version preview layout.
- ATS Classic remains the control template and receives no structural redesign.
- Native browser printing, A4/Letter handling, and the existing print command remain unchanged.

## Responsive and accessibility requirements

- Use a balanced gallery when enough width exists.
- Allow cards to reduce columns based on available space.
- Stack cleanly on narrow/mobile screens.
- Preserve focus visibility and semantic radio labels.
- Do not use color alone to convey selection.
- Respect reduced-motion preferences.
- Keep the on-screen Live preview keyboard-focusable while its inner résumé viewport handles overflow.

## Architecture constraints

Reuse the existing:

- `ResumeDesignControls.tsx`
- `ResumeMiniDocument.tsx`
- `resumeTemplateRegistry.ts`
- Resume design save API and state
- Resume design persistence model
- native browser print path

Keep the existing design shape unchanged:

- `templateId`
- `colorPaletteId`
- `pageSize`
- `fontFamily`
- `showProfilePhoto`

No migration or backend/API contract change is required.

## Verification

Required local qualification after the GitHub implementation is pulled:

- focused Resume Appearance / template / live-preview / print-parity tests;
- frontend typecheck;
- frontend production build;
- `git diff --check`;
- full frontend regression;
- browser QA for template/font/palette switching, live preview, save/reset, refresh persistence, keyboard behavior, responsive layout, name-only Compact Technical skills, and inner résumé scrolling with the preview header fixed;
- A4 print/PDF QA for all three templates using the same representative Resume;
- Compact Technical printed Skills must remain in two columns;
- Modern Professional must no longer produce a header-only first page and must retain recognizable main/sidebar structure;
- ATS Classic must remain coherent;
- final user-facing PDFs should be checked with browser Headers and footers disabled so browser metadata does not consume Resume page space.
