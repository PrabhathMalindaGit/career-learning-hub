# Resume Template Differentiation & Print Layout Refinement — Design

**Date:** 2026-08-15  
**Project:** Career Learning Hub  
**Status:** Written specification approved; implementation planning authorized  
**Baseline:** `main @ 937002e331fbbc4ae8ac7d725876b46a34fd9217`

## 1. Purpose

Resume Studio currently exposes three template choices — **ATS Classic**, **Modern Professional**, and **Compact Technical** — but live QA and exported PDFs show that they remain too visually similar. All three currently share the same core single-column document structure, section sequence, header composition, date placement, and candidate-photo placement, with most differentiation coming from spacing, divider lines, and density.

This task will make each existing template immediately recognizable while preserving the current Resume data model, design IDs, Candidate Photo system, print workflow, fonts, palettes, page sizes, version history, and backend contracts.

A secondary objective is to improve browser-print pagination so short trailing sections are less likely to be orphaned on an otherwise empty page when normal spacing and break rules can avoid it.

## 2. Scope Principle

Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.

This is primarily a **frontend presentation and print-layout refinement**. It must not become a Resume schema redesign, a new PDF engine, or a backend feature.

## 3. Current-State Findings

The post-PR-#20 implementation has these relevant boundaries:

- `resumeTemplateRegistry.ts` already owns the three stable template IDs, labels, descriptions, class names, fonts, and color palettes.
- `ResumeDesignControls.tsx` already owns selection, preview, reset, and save behavior for Template / Font / Palette.
- `ResumeMiniDocument.tsx` currently renders one generic miniature document skeleton for every template.
- `ResumePreview.tsx` currently renders one sequential semantic Resume tree regardless of template ID, then applies the resolved template CSS class.
- `resumeWorkspace.css` contains the main Resume editor, preview, template, and print presentation rules.
- `resumePrint.ts` uses the native browser print path; no server-side PDF renderer exists or is needed.
- Candidate Photo is already optional, privately stored, validated, and rendered through the existing Resume design state.

The current template registry itself describes Modern Professional as a restrained single-column layout and Compact Technical as a denser single-column layout, confirming that the existing template distinction is intentionally shallow rather than structurally different.

The user-provided exports also demonstrate a pagination weakness: a short **Certifications** section can be pushed to a mostly empty second page. This task should improve normal page-flow behavior without promising that every Resume will fit on one page.

## 4. Locked Template Identities

The existing template IDs remain unchanged:

- `ats-classic`
- `modern-professional`
- `compact-technical`

No migration is required. Existing saved Resume design selections must continue resolving to the same IDs.

### 4.1 ATS Classic

**Identity:** traditional, conservative, recruiter-first, highly scannable.

**Layout:** true single-column document.

**Presentation order:**

1. Identity / contact header
2. Summary
3. Experience
4. Education
5. Skills
6. Projects
7. Certifications
8. Languages
9. Interests

**Visual rules:**

- simple left-aligned reading flow;
- restrained heading hierarchy;
- neutral or palette-derived thin rules only where useful;
- no filled sidebar, cards, badges, or skill pills;
- compact but readable spacing;
- minimal decorative treatment;
- right-aligned dates may remain where they aid scanning;
- selectable text and normal links must remain intact.

**Candidate Photo:**

If `showProfilePhoto` is enabled and a valid Candidate Photo exists, ATS Classic continues to honor that user choice. The photo must remain small and conservative, aligned with the identity block, with no decorative treatment beyond the existing restrained frame. The template must not silently disable or remove a saved photo choice.

**Updated picker description:**

> Traditional single-column layout optimized for clear scanning and conservative applications.

### 4.2 Modern Professional

**Identity:** contemporary, polished, balanced, visually distinctive.

**Layout:** genuine main-content + sidebar composition rather than another single-column variant.

**Target proportions:** approximately 66–70% main content and 30–34% sidebar at normal A4 / Letter Resume width.

**Header:**

- stronger identity hierarchy than ATS Classic;
- name, role, and contact information form a deliberate header composition;
- Candidate Photo, when enabled, is integrated intentionally into the header rather than looking appended to a generic single-column layout;
- restrained palette-derived accent treatment may be used.

**Main content presentation:**

1. Summary
2. Experience
3. Projects

**Sidebar presentation:**

1. Skills
2. Education
3. Certifications
4. Languages
5. Interests

Sections with no content simply do not render; the remaining content closes the gap naturally.

**Visual rules:**

- visibly stronger hierarchy than ATS Classic;
- generous but controlled white space;
- sidebar may use a very light palette-derived tint, vertical rule, or equivalent restrained separation;
- no heavy cards or dashboard-like UI inside the Resume;
- Experience and Projects receive the wider reading column;
- Skills and supporting credentials are visually grouped in the sidebar;
- typography and palette remain independently selectable through the current controls.

**Semantic / accessibility requirement:**

The layout must remain real HTML text. Do not convert the Resume into an image, canvas, or absolutely positioned graphic. Use ordinary divisions/sections plus an optional sidebar landmark with a logical source order. Do not introduce a nested `<main>` landmark inside the Resume preview. Keyboard and assistive-technology reading must remain understandable even though CSS places content into columns.

**Updated picker description:**

> Polished two-column presentation with a strong header and structured professional sidebar.

### 4.3 Compact Technical

**Identity:** dense, engineering-oriented, high-signal, project-and-skills focused.

**Layout:** technical grid / metadata-rail presentation, not simply a smaller ATS Classic.

**Presentation order:**

1. Identity / compact contact header
2. Summary
3. Skills & Tools
4. Experience
5. Projects
6. Education
7. Certifications
8. Languages
9. Interests

This is **presentation order only**. Canonical Resume content arrays and backend storage order are not changed.

**Technical rail behavior:**

Experience and other dated entries may use a narrow date / metadata rail such as:

```text
2024–Present | Mechanical Engineer
             | Atlas Manufacturing Ltd
             | • Achievement
```

The exact implementation may use CSS Grid, but dates and content must remain selectable and semantically associated with the same entry.

**Skills behavior:**

- Skills move near the top of the presentation;
- skill-group labels remain clearly identifiable;
- keyword lists wrap naturally;
- no pill / capsule UI;
- compact separators such as commas or middle dots are acceptable;
- dense presentation must not reduce legibility below a practical Resume reading size.

**Candidate Photo:**

If enabled, use a smaller portrait footprint than Modern Professional so the image does not displace high-value technical content. Existing Candidate Photo controls and storage remain unchanged.

**Updated picker description:**

> Dense technical layout prioritizing skills, tools, projects, and efficient use of page space.

## 5. Template Rendering Architecture

The current single monolithic sequential tree in `ResumePreview.tsx` is the main reason CSS-only variation cannot create sufficiently different templates cleanly.

The implementation should therefore introduce a **small template-aware rendering boundary**, while reusing the same canonical data and section renderers.

### 5.1 Shared section renderers

Resume content rendering should be factored into reusable bounded components or helpers for:

- Identity / contact header
- Summary
- Experience
- Education
- Skills
- Projects
- Certifications
- Languages
- Interests

These renderers must consume the existing `ResumeDraft` only. They must not own persistence, API calls, or editor state.

The implementation may keep these helpers in `ResumePreview.tsx` if the file remains understandable, or extract a small adjacent presentation module if needed. Do not build a generic templating framework.

### 5.2 Template shells

A template shell chooses only:

- section placement;
- visual grouping;
- presentation order;
- template-specific classes.

The shell must never mutate Resume data.

Each content section and Candidate Photo must be rendered at most once in the selected template; template differentiation must not be implemented by duplicating the whole Resume tree and hiding alternate copies with CSS.

Expected structure:

- ATS Classic shell: one sequential column;
- Modern Professional shell: shared header + wider content region + sidebar region;
- Compact Technical shell: shared header + technical content ordering + metadata/date-rail entry presentation.

### 5.3 No backend changes

Do not change:

- Resume schema;
- Resume Design API shape;
- template IDs;
- version persistence;
- Candidate Photo storage;
- AI analysis contracts;
- PDF import contracts.

No migration is required.

## 6. Appearance Picker Redesign

The current miniature cards also look too similar because `ResumeMiniDocument.tsx` renders one generic skeleton for every template.

The picker must visually communicate the actual template differences before selection.

### ATS Classic miniature

Show a plain single-column document with conventional header + stacked sections.

### Modern Professional miniature

Show an obvious two-column body or sidebar treatment plus a stronger header block.

### Compact Technical miniature

Show a narrow metadata/date rail and dense technical rows.

The miniatures are decorative and remain `aria-hidden`. Template names and descriptions remain the accessible decision content.

The Template cards must continue using native radio controls and the current selection/save workflow.

## 7. Fonts and Palettes Remain Independent

The existing options remain:

**Fonts**

- Inter
- Arial
- Georgia

**Palettes**

- Slate
- Forest
- Navy

Template controls **layout identity**. Font controls **typography**. Palette controls **color roles**.

A palette or font change must not collapse the structural differences between templates.

The registry remains the canonical source for allowed IDs and fallback behavior.

## 8. Candidate Photo Compatibility

All three templates must support the existing Candidate Photo system when the user has enabled `showProfilePhoto` and a valid private photo URL is available.

Required behavior:

- ATS Classic: small conservative header portrait;
- Modern Professional: medium portrait integrated into the stronger professional header;
- Compact Technical: small efficient portrait footprint;
- no duplicate image;
- no template-specific photo upload path;
- Replace Photo / Remove Photo behavior remains the existing shared workflow;
- hidden photos stay hidden when `showProfilePhoto` is false.

## 9. Print and Pagination Refinement

The application must continue using native browser printing. Do not introduce Puppeteer, Playwright PDF generation, server-side rendering, canvas snapshots, or a separate PDF service.

### 9.1 Page sizes

Preserve:

- A4
- Letter

The current `@page` size behavior remains authoritative.

### 9.2 Break rules

Add restrained print rules that improve normal flow:

- section headings should stay with the first content item when practical;
- individual Experience / Education / Project entries should avoid splitting when they reasonably fit together;
- short certification / language / interest groups should avoid awkward internal splits;
- entire long sections must **not** be globally forced to stay together if doing so creates large blank areas;
- content may split naturally when it is genuinely too long for the remaining page.

### 9.3 Modern Professional fragmentation safety

Modern Professional must be verified in actual Chromium browser print preview because multi-page grid/flex fragmentation can behave differently from normal screen layout.

The implementation must not accept clipped, overlapping, duplicated, or missing sidebar/main content merely to preserve a rigid two-column grid across every page.

If a browser-safe multi-page two-column grid cannot be achieved with the existing native print path, a **print-only continuation fallback** is allowed: the first-page identity must remain unmistakably Modern Professional with its two-column/sidebar structure, while overflow continuation content may resume in safe normal block flow on later pages. This fallback must not change Resume data, visible screen semantics, or the saved template ID.

### 9.4 Density objective

The layouts should reduce unnecessary vertical waste so a tiny trailing section is less likely to occupy an otherwise blank second page.

This is an optimization objective, **not a one-page guarantee**. Content length, font choice, page size, Candidate Photo, and browser print metrics can legitimately produce additional pages.

### 9.5 Printed content integrity

All templates must preserve:

- selectable text;
- clickable safe links where browser PDF output supports them;
- no clipped content;
- no overlapping columns;
- no content hidden only because it falls across a page break;
- no print-only decorative artifacts that obscure text.

## 10. Responsive Live Preview

The Resume document itself represents a fixed print page, but the surrounding editor can become narrow.

Requirements:

- do not make the Resume content depend on the browser viewport for its semantic structure;
- the preview may scale / scroll through the existing workspace behavior;
- Modern Professional must retain its intended two-column Resume layout at print-page width rather than turning into a mobile web card layout;
- picker cards must remain usable at narrower application widths;
- no horizontal overflow should escape the Resume preview container.

## 11. Historical Versions and Print Sources

Existing behavior remains unchanged: historical saved content uses the current Resume design because design choices are not versioned with each Resume content version.

The redesign must continue to apply the selected current design to:

- current saved Resume print;
- allowed historical snapshot print;
- live preview.

Do not add versioned design snapshots in this task.

## 12. Accessibility

Preserve or improve:

- real heading hierarchy;
- semantic lists and definition lists where appropriate;
- safe links;
- native radio controls in the appearance picker;
- visible focus treatment in the application controls;
- meaningful source order for Modern Professional even when CSS places content into columns;
- no essential information communicated only by color;
- printable text remains actual text.

Decorative miniature previews remain hidden from assistive technology.

## 13. Testing Strategy

Implementation must use TDD for changed behavior.

### Focused frontend tests

At minimum cover:

- registry retains exactly the three stable template IDs and updated descriptions;
- ATS Classic renders the traditional section order;
- Modern Professional renders distinct content + sidebar semantic regions with the intended section assignment;
- Compact Technical renders Skills before Experience and exposes the technical/date-rail structure;
- template switching preserves identical canonical Resume data;
- Candidate Photo renders once in each template when enabled and not at all when disabled;
- MiniDocument exposes visibly distinct template-specific structures/classes;
- appearance picker selection / preview / reset / save behavior remains intact;
- A4 / Letter print surfaces retain selected template, font, palette, and Candidate Photo;
- safe links and section content remain present.

### Regression qualification

Run:

- focused Resume preview/template/design tests;
- frontend typecheck;
- full frontend suite;
- frontend production build;
- `git diff --check`.

No backend tests should be necessary unless implementation unexpectedly touches backend files, which would require explicit re-scoping before proceeding.

## 14. Browser and PDF QA

Human QA must use the **same representative Resume** across all three templates so visual differences are directly comparable.

Test matrix:

### A4

- ATS Classic
- Modern Professional
- Compact Technical

### Letter

- ATS Classic
- Modern Professional
- Compact Technical

For each combination verify:

- unmistakably different template identity;
- header layout;
- Candidate Photo placement;
- Skills wrapping;
- Experience/date alignment;
- Projects and certifications;
- no overlaps or clipping;
- reasonable pagination;
- print preview matches live design intent.

Generate browser PDFs for the three A4 templates and compare them side by side before merge. Letter PDF exports should also be spot-checked for break behavior.

## 15. Explicit Non-Goals

Do not add:

- new template IDs;
- drag-and-drop section ordering;
- user-defined templates;
- arbitrary font uploads;
- arbitrary custom colors;
- server-side PDF generation;
- canvas/image Resume rendering;
- automatic one-page compression algorithms;
- AI-generated layout decisions;
- backend migrations;
- design-version history;
- new Candidate Photo storage behavior;
- unrelated Resume editor redesign.

## 16. Acceptance Criteria

The feature is ready for merge only when all of the following are true:

1. The same Resume looks immediately and materially different under all three template IDs.
2. ATS Classic is clearly a traditional single-column Resume.
3. Modern Professional is clearly a main-content + sidebar Resume on its primary page composition.
4. Compact Technical is clearly a dense technical/date-rail Resume with Skills prioritized near the top.
5. The picker miniatures accurately signal those structural differences.
6. Existing Font, Palette, A4/Letter, Candidate Photo, save/reset, version, and print behavior still works.
7. Canonical Resume data is unchanged by template switching.
8. Native browser PDF output contains selectable content without clipping, overlap, duplication, or omission.
9. Page-break behavior is improved without forcing long sections into wasteful blank-page layouts.
10. Focused tests, full frontend tests, typecheck, production build, and diff hygiene pass.
11. User browser QA approves all three templates using the same Resume.
12. User explicitly approves the final PR merge.

## 17. Governance / Execution Workflow

- ChatGPT plans, reviews, and implements through the GitHub connector.
- Codex is not used for this project workflow.
- Work occurs on a dedicated branch / draft PR after written-spec and implementation-plan approval.
- User pulls the branch locally and supplies automated test, browser, and PDF evidence.
- Failures are repaired on the same PR.
- Merge requires explicit user approval.
- Deployment and branch deletion require separate authorization.
