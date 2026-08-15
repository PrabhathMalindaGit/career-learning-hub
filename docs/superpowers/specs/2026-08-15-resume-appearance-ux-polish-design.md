# Resume Appearance UX Polish — Design Specification

## Objective

Polish the existing Resume Appearance experience so it feels like a focused Resume design selector rather than a generic settings form, while preserving all existing Resume design persistence and rendering behavior.

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

## Responsive and accessibility requirements

- Use a balanced gallery when enough width exists.
- Allow cards to reduce columns based on available space.
- Stack cleanly on narrow/mobile screens.
- Preserve focus visibility and semantic radio labels.
- Do not use color alone to convey selection.
- Respect reduced-motion preferences.

## Architecture constraints

Reuse the existing:

- `ResumeDesignControls.tsx`
- `ResumeMiniDocument.tsx`
- `resumeTemplateRegistry.ts`
- Resume design save API and state
- Resume design persistence model

Keep the existing design shape unchanged:

- `templateId`
- `colorPaletteId`
- `pageSize`
- `fontFamily`
- `showProfilePhoto`

No migration or backend/API contract change is required.

## Verification

Required local qualification after the GitHub implementation is pulled:

- focused Resume Appearance tests;
- frontend typecheck;
- frontend production build;
- `git diff --check`;
- full frontend regression;
- browser QA for template/font/palette switching, live preview, save/reset, refresh persistence, keyboard behavior, and responsive layout.

PDF requalification is only required if the implementation unexpectedly affects Resume document rendering.
