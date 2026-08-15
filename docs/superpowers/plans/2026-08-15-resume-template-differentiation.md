# Resume Template Differentiation & Print Layout Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make ATS Classic, Modern Professional, and Compact Technical materially different Resume layouts while preserving the existing Resume data model, Candidate Photo system, design IDs, fonts, palettes, A4/Letter printing, and save/version behavior.

**Architecture:** Keep `ResumePreview` as the outer preview/print wrapper, extract reusable canonical section renderers into a small adjacent module, and add a bounded template-layout module that places those same sections differently for each stable template ID. Add one dedicated stylesheet for template-specific screen/print rules and update the miniature picker renderer so the selection cards accurately preview each layout. No backend changes, migrations, new dependencies, generic template engine, or alternate PDF renderer are allowed.

**Tech Stack:** React 19, TypeScript, CSS, Vitest, Testing Library, Vite, native browser printing.

## Global Constraints

- Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.
- Baseline is `main @ 937002e331fbbc4ae8ac7d725876b46a34fd9217` plus the approved spec/plan documentation commits.
- Execution uses the GitHub connector in ChatGPT; Codex is not used for this project workflow.
- Implementation begins only after explicit user approval of this plan.
- At execution start create `feature/resume-template-differentiation` from the approved documentation head and open a draft PR against `main`.
- Keep exactly these template IDs: `ats-classic`, `modern-professional`, `compact-technical`.
- Keep exactly these font values: `Inter`, `Arial`, `Georgia`.
- Keep exactly these palette IDs: `slate`, `forest`, `navy`.
- Preserve A4 and Letter through the existing native browser-print path.
- Preserve Candidate Photo storage, replace/remove controls, and `showProfilePhoto` behavior.
- Do not change Resume backend models, APIs, AI analysis contracts, PDF-import contracts, version persistence, or authentication.
- Do not add dependencies, server-side PDF generation, canvas rendering, drag/drop ordering, new template IDs, or arbitrary user-defined styles.
- Template switching must never mutate canonical `ResumeDraft` content.
- Each content section and Candidate Photo must render at most once in the selected template; do not duplicate complete Resume trees and hide copies with CSS.
- Do not merge, deploy, or delete branches without explicit user approval.

---

## File Structure

### Create

- `frontend/src/features/resumes/ResumeTemplateContent.tsx` — shared semantic Resume section renderers and safe-link/date helpers; no persistence or editor state.
- `frontend/src/features/resumes/ResumeTemplateLayouts.tsx` — the three bounded template shells and template-to-shell dispatch.
- `frontend/src/features/resumes/ResumeTemplateLayouts.test.tsx` — structural/order/data-preservation tests for the three layouts.
- `frontend/src/features/resumes/ResumeMiniDocument.test.tsx` — miniature-layout differentiation contract.
- `frontend/src/features/resumes/resumeTemplateDifferentiation.css` — all new template-specific live-preview, miniature, Candidate Photo override, and print/pagination rules.

### Modify

- `frontend/src/features/resumes/ResumePreview.tsx` — retain preview/print wrapper and presentation resolution; delegate body rendering to `ResumeTemplateLayouts`.
- `frontend/src/features/resumes/ResumePreview.test.tsx` — preserve common content/safety tests and add page-size/print/layout assertions where appropriate.
- `frontend/src/features/resumes/ResumePreview.candidatePhoto.test.tsx` — confirm exactly one Candidate Photo in each template and hidden-state behavior.
- `frontend/src/features/resumes/ResumeMiniDocument.tsx` — render structurally different decorative miniatures per resolved template.
- `frontend/src/features/resumes/ResumeDesignControls.test.tsx` — update exact template descriptions and keep selection/preview/reset/save contract.
- `frontend/src/features/resumes/resumeTemplateRegistry.ts` — update only template descriptions; keep IDs/classes/fallbacks unchanged.
- `frontend/src/features/resumes/resumeTemplateRegistry.test.ts` — lock exact descriptions as well as existing IDs/classes/fallback.

### Avoid unless a failing regression proves necessary

- `frontend/src/features/resumes/resumeWorkspace.css` — existing generic Resume/editor rules should remain stable; new template-specific rules belong in `resumeTemplateDifferentiation.css` and should override only what the redesign needs.
- `frontend/src/features/resumes/resumeImportSkillsRefinement.css` — keep PR #20 skill-wrapping rules intact unless an exact template-specific conflict is demonstrated by a failing focused test/browser QA.
- Any backend file.

---

### Task 1: Lock registry copy and miniature-layout contracts

**Files:**
- Modify: `frontend/src/features/resumes/resumeTemplateRegistry.test.ts`
- Modify: `frontend/src/features/resumes/resumeTemplateRegistry.ts`
- Create: `frontend/src/features/resumes/ResumeMiniDocument.test.tsx`
- Modify: `frontend/src/features/resumes/ResumeMiniDocument.tsx`
- Create: `frontend/src/features/resumes/resumeTemplateDifferentiation.css`
- Modify: `frontend/src/features/resumes/ResumeDesignControls.test.tsx`

**Interfaces:**
- Consumes: existing `ResumeTemplateId`, `RESUME_TEMPLATES`, `resolveResumePresentation`.
- Produces: stable updated descriptions and three miniature structural markers: `classic-stack`, `modern-sidebar`, `technical-rail`.

- [ ] **Step 1: Extend the registry test with the exact approved descriptions**

Add an assertion in `resumeTemplateRegistry.test.ts`:

```ts
expect(
  RESUME_TEMPLATES.map(({ id, description }) => ({ id, description })),
).toEqual([
  {
    id: "ats-classic",
    description:
      "Traditional single-column layout optimized for clear scanning and conservative applications.",
  },
  {
    id: "modern-professional",
    description:
      "Polished two-column presentation with a strong header and structured professional sidebar.",
  },
  {
    id: "compact-technical",
    description:
      "Dense technical layout prioritizing skills, tools, projects, and efficient use of page space.",
  },
]);
```

- [ ] **Step 2: Run the registry test and verify RED**

Run:

```bash
npm --prefix frontend test -- src/features/resumes/resumeTemplateRegistry.test.ts
```

Expected: FAIL because current descriptions still describe three similar single-column layouts.

- [ ] **Step 3: Update only the three registry descriptions**

In `resumeTemplateRegistry.ts`, preserve `id`, `label`, `className`, and `safeFallback`; replace only `description` with the three approved strings from Step 1.

- [ ] **Step 4: Run the registry test and verify GREEN**

Run the Step 2 command again.

Expected: PASS.

- [ ] **Step 5: Write the miniature differentiation test**

Create `ResumeMiniDocument.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ResumeMiniDocument } from "./ResumeMiniDocument";

const cases = [
  ["ats-classic", "classic-stack"],
  ["modern-professional", "modern-sidebar"],
  ["compact-technical", "technical-rail"],
] as const;

describe("ResumeMiniDocument", () => {
  it.each(cases)("renders a distinct %s miniature structure", (templateId, layout) => {
    const { container } = render(
      <ResumeMiniDocument
        templateId={templateId}
        colorPaletteId="slate"
        fontFamily="Inter"
        context="template"
      />,
    );

    const miniature = container.querySelector(`[data-template-preview="${templateId}"]`);
    expect(miniature).not.toBeNull();
    expect(miniature?.querySelector(`[data-mini-layout="${layout}"]`)).not.toBeNull();
    expect(miniature?.getAttribute("aria-hidden")).toBe("true");
  });
});
```

- [ ] **Step 6: Run the miniature test and verify RED**

Run:

```bash
npm --prefix frontend test -- src/features/resumes/ResumeMiniDocument.test.tsx
```

Expected: FAIL because the current miniature has one generic skeleton and no `data-mini-layout` markers.

- [ ] **Step 7: Implement three bounded miniature bodies**

Keep the existing resolved outer class and `aria-hidden`. Inside `ResumeMiniDocument.tsx`, render one of these small decorative bodies based on `resolvedTemplateId`:

```tsx
function ClassicMiniature() {
  return (
    <span data-mini-layout="classic-stack" className="resume-mini-layout resume-mini-layout--classic">
      <span className="resume-mini-identity" />
      <span className="resume-mini-stack-line resume-mini-stack-line--wide" />
      <span className="resume-mini-stack-line" />
      <span className="resume-mini-stack-line resume-mini-stack-line--short" />
    </span>
  );
}

function ModernMiniature() {
  return (
    <span data-mini-layout="modern-sidebar" className="resume-mini-layout resume-mini-layout--modern">
      <span className="resume-mini-modern-header" />
      <span className="resume-mini-modern-main" />
      <span className="resume-mini-modern-sidebar" />
    </span>
  );
}

function TechnicalMiniature() {
  return (
    <span data-mini-layout="technical-rail" className="resume-mini-layout resume-mini-layout--technical">
      <span className="resume-mini-technical-header" />
      <span className="resume-mini-technical-rail" />
      <span className="resume-mini-technical-content" />
    </span>
  );
}
```

Use a simple `switch (resolvedTemplateId)` to choose one. Do not create a generic miniature engine.

Import `./resumeTemplateDifferentiation.css` from `ResumeMiniDocument.tsx` so list-card miniatures and appearance-picker miniatures receive the new rules even when `ResumePreview` is not mounted.

- [ ] **Step 8: Add the minimum miniature CSS**

Start `resumeTemplateDifferentiation.css` with bounded miniature rules that make the geometry visibly different:

```css
.resume-mini-layout {
  display: grid;
  width: 100%;
  min-height: 100%;
  gap: 4px;
}

.resume-mini-layout--classic {
  grid-template-columns: 1fr;
}

.resume-mini-layout--modern {
  grid-template-columns: minmax(0, 2fr) minmax(0, 0.9fr);
  grid-template-areas:
    "header header"
    "main sidebar";
}

.resume-mini-modern-header { grid-area: header; }
.resume-mini-modern-main { grid-area: main; }
.resume-mini-modern-sidebar { grid-area: sidebar; }

.resume-mini-layout--technical {
  grid-template-columns: 24% minmax(0, 1fr);
  grid-template-areas:
    "header header"
    "rail content";
}

.resume-mini-technical-header { grid-area: header; }
.resume-mini-technical-rail { grid-area: rail; }
.resume-mini-technical-content { grid-area: content; }
```

Use the existing palette variables/background roles; do not hard-code a new color system.

- [ ] **Step 9: Update exact description assertions in `ResumeDesignControls.test.tsx`**

Replace the three old description expectations with the exact strings from Step 1. Preserve the existing assertions for exactly three template radios, three font radios, three palette radios, keyboard behavior, preview changes, reset, and save.

- [ ] **Step 10: Run the focused registry/miniature/design tests**

```bash
npm --prefix frontend test -- \
  src/features/resumes/resumeTemplateRegistry.test.ts \
  src/features/resumes/ResumeMiniDocument.test.tsx \
  src/features/resumes/ResumeDesignControls.test.tsx
```

Expected: PASS.

- [ ] **Step 11: Commit Task 1**

```bash
git add \
  frontend/src/features/resumes/resumeTemplateRegistry.ts \
  frontend/src/features/resumes/resumeTemplateRegistry.test.ts \
  frontend/src/features/resumes/ResumeMiniDocument.tsx \
  frontend/src/features/resumes/ResumeMiniDocument.test.tsx \
  frontend/src/features/resumes/resumeTemplateDifferentiation.css \
  frontend/src/features/resumes/ResumeDesignControls.test.tsx
git commit -m "feat: differentiate Resume template choices"
```

---

### Task 2: Extract shared semantic Resume content and preserve ATS Classic behavior

**Files:**
- Create: `frontend/src/features/resumes/ResumeTemplateContent.tsx`
- Create: `frontend/src/features/resumes/ResumeTemplateLayouts.tsx`
- Create: `frontend/src/features/resumes/ResumeTemplateLayouts.test.tsx`
- Modify: `frontend/src/features/resumes/ResumePreview.tsx`
- Modify: `frontend/src/features/resumes/ResumePreview.test.tsx`

**Interfaces:**
- Consumes: `ResumeDraft`, optional `candidatePhotoUrl`, resolved `ResumeTemplateId`.
- Produces:

```ts
export type ResumeEntryLayout = "standard" | "technical-rail";

export interface ResumeTemplateLayoutProps {
  readonly draft: ResumeDraft;
  readonly templateId: ResumeTemplateId;
  readonly showCandidatePhoto: boolean;
  readonly candidatePhotoUrl?: string;
}

export function ResumeTemplateLayout(props: ResumeTemplateLayoutProps): JSX.Element;
```

Shared section renderers expose `data-resume-section` values: `summary`, `experience`, `education`, `skills`, `projects`, `certifications`, `languages`, `interests`.

- [ ] **Step 1: Write the ATS Classic layout test before refactoring**

In `ResumeTemplateLayouts.test.tsx`, build one representative `ResumeDraft` containing every section and assert ATS order:

```tsx
const sectionNames = Array.from(
  container.querySelectorAll("[data-resume-section]"),
  (node) => node.getAttribute("data-resume-section"),
);

expect(sectionNames).toEqual([
  "summary",
  "experience",
  "education",
  "skills",
  "projects",
  "certifications",
  "languages",
  "interests",
]);
expect(container.querySelector('[data-resume-layout="ats-classic"]')).not.toBeNull();
```

Also assert all existing safe links and content text remain present through the layout.

- [ ] **Step 2: Run the layout test and verify RED**

```bash
npm --prefix frontend test -- src/features/resumes/ResumeTemplateLayouts.test.tsx
```

Expected: FAIL because `ResumeTemplateLayouts.tsx` and section markers do not exist.

- [ ] **Step 3: Extract shared content renderers without changing content rules**

Move the existing `safeHref`, `SafeLink`, `DateSpan`, and canonical section JSX from `ResumePreview.tsx` into `ResumeTemplateContent.tsx`.

Use explicit shared exports, for example:

```tsx
export function ResumeSummarySection({ draft }: { draft: ResumeDraft }) {
  if (!draft.basics.summary) return null;
  return (
    <section data-resume-section="summary">
      <h4>Summary</h4>
      <p>{draft.basics.summary}</p>
    </section>
  );
}
```

Repeat the current content behavior for Experience, Education, Skills, Projects, Certifications, Languages, and Interests. Preserve safe-link behavior exactly.

For Experience/Projects, accept an optional `entryLayout` prop with default `"standard"` and add only a class marker when `"technical-rail"` is requested; do not change content yet:

```tsx
className={`resume-preview-entry${
  entryLayout === "technical-rail"
    ? " resume-preview-entry--technical-rail"
    : ""
}`}
```

- [ ] **Step 4: Implement the shared identity header**

Create:

```ts
export type ResumeIdentityVariant = "classic" | "modern" | "technical";
```

and:

```tsx
export function ResumeIdentityHeader({
  draft,
  variant,
  showCandidatePhoto,
  candidatePhotoUrl,
}: {
  draft: ResumeDraft;
  variant: ResumeIdentityVariant;
  showCandidatePhoto: boolean;
  candidatePhotoUrl?: string;
}) { /* existing identity/contact/link/photo content */ }
```

The image remains decorative (`alt=""`) and is rendered only when both `showCandidatePhoto` and `candidatePhotoUrl` are present. Add `data-resume-identity={variant}` to the identity wrapper for focused tests.

- [ ] **Step 5: Implement ATS Classic shell and dispatcher**

In `ResumeTemplateLayouts.tsx`, create a direct dispatcher and an ATS shell:

```tsx
function AtsClassicLayout(props: Omit<ResumeTemplateLayoutProps, "templateId">) {
  const { draft } = props;
  return (
    <div data-resume-layout="ats-classic" className="resume-layout resume-layout--ats-classic">
      <ResumeIdentityHeader {...props} variant="classic" />
      <ResumeSummarySection draft={draft} />
      <ResumeExperienceSection draft={draft} />
      <ResumeEducationSection draft={draft} />
      <ResumeSkillsSection draft={draft} />
      <ResumeProjectsSection draft={draft} />
      <ResumeCertificationsSection draft={draft} />
      <ResumeLanguagesSection draft={draft} />
      <ResumeInterestsSection draft={draft} />
    </div>
  );
}
```

Initially have Modern Professional and Compact Technical call the ATS shell so this refactor can go GREEN before their structural tasks. The later tasks will replace those two dispatch branches.

- [ ] **Step 6: Make `ResumePreview` a wrapper only**

Keep the existing panel, print-only `<style>` page-size rule, resolved template/font/palette classes, and `data-*` attributes. Inside `<article>`, replace the monolithic canonical tree with:

```tsx
<ResumeTemplateLayout
  draft={draft}
  templateId={resolved.template.option.id}
  showCandidatePhoto={showCandidatePhoto}
  candidatePhotoUrl={candidatePhotoUrl}
/>
```

Import `./resumeTemplateDifferentiation.css` from `ResumePreview.tsx` after existing Resume CSS imports.

- [ ] **Step 7: Run the new layout test plus existing ResumePreview tests**

```bash
npm --prefix frontend test -- \
  src/features/resumes/ResumeTemplateLayouts.test.tsx \
  src/features/resumes/ResumePreview.test.tsx \
  src/features/resumes/ResumePreview.candidatePhoto.test.tsx
```

Expected: PASS. At this checkpoint ATS behavior and all canonical content/safe links must remain intact before further visual differentiation.

- [ ] **Step 8: Commit Task 2**

```bash
git add \
  frontend/src/features/resumes/ResumeTemplateContent.tsx \
  frontend/src/features/resumes/ResumeTemplateLayouts.tsx \
  frontend/src/features/resumes/ResumeTemplateLayouts.test.tsx \
  frontend/src/features/resumes/ResumePreview.tsx \
  frontend/src/features/resumes/ResumePreview.test.tsx
git commit -m "refactor: add bounded Resume template layout shells"
```

---

### Task 3: Make Modern Professional a real content + sidebar Resume

**Files:**
- Modify: `frontend/src/features/resumes/ResumeTemplateLayouts.test.tsx`
- Modify: `frontend/src/features/resumes/ResumeTemplateLayouts.tsx`
- Modify: `frontend/src/features/resumes/resumeTemplateDifferentiation.css`

**Interfaces:**
- Consumes shared section renderers from Task 2.
- Produces `data-resume-layout="modern-professional"`, `data-resume-region="modern-content"`, and `data-resume-region="modern-sidebar"`.

- [ ] **Step 1: Write the Modern Professional structural test**

Add:

```tsx
expect(container.querySelector('[data-resume-layout="modern-professional"]')).not.toBeNull();
const contentRegion = container.querySelector('[data-resume-region="modern-content"]');
const sidebar = container.querySelector('[data-resume-region="modern-sidebar"]');
expect(contentRegion).not.toBeNull();
expect(sidebar).not.toBeNull();
expect(contentRegion?.querySelector('[data-resume-section="summary"]')).not.toBeNull();
expect(contentRegion?.querySelector('[data-resume-section="experience"]')).not.toBeNull();
expect(contentRegion?.querySelector('[data-resume-section="projects"]')).not.toBeNull();
expect(sidebar?.querySelector('[data-resume-section="skills"]')).not.toBeNull();
expect(sidebar?.querySelector('[data-resume-section="education"]')).not.toBeNull();
expect(sidebar?.querySelector('[data-resume-section="certifications"]')).not.toBeNull();
expect(sidebar?.querySelector('[data-resume-section="languages"]')).not.toBeNull();
expect(sidebar?.querySelector('[data-resume-section="interests"]')).not.toBeNull();
```

Also assert there is no nested `<main>` inside the Resume article.

- [ ] **Step 2: Run only the Modern layout test and verify RED**

```bash
npm --prefix frontend test -- src/features/resumes/ResumeTemplateLayouts.test.tsx
```

Expected: FAIL because Modern still uses the temporary ATS shell.

- [ ] **Step 3: Implement `ModernProfessionalLayout`**

Use ordinary semantic containers, not a nested `<main>`:

```tsx
function ModernProfessionalLayout(props: Omit<ResumeTemplateLayoutProps, "templateId">) {
  const { draft } = props;
  return (
    <div data-resume-layout="modern-professional" className="resume-layout resume-layout--modern">
      <ResumeIdentityHeader {...props} variant="modern" />
      <div className="resume-modern-columns">
        <div data-resume-region="modern-content" className="resume-modern-content">
          <ResumeSummarySection draft={draft} />
          <ResumeExperienceSection draft={draft} />
          <ResumeProjectsSection draft={draft} />
        </div>
        <aside
          data-resume-region="modern-sidebar"
          className="resume-modern-sidebar"
          aria-label="Supporting resume details"
        >
          <ResumeSkillsSection draft={draft} />
          <ResumeEducationSection draft={draft} />
          <ResumeCertificationsSection draft={draft} />
          <ResumeLanguagesSection draft={draft} />
          <ResumeInterestsSection draft={draft} />
        </aside>
      </div>
    </div>
  );
}
```

Update the dispatcher so only `modern-professional` uses this shell.

- [ ] **Step 4: Add Modern Professional screen rules**

In `resumeTemplateDifferentiation.css`:

```css
.resume-template-modern-professional .resume-modern-columns {
  display: grid;
  grid-template-columns: minmax(0, 2.05fr) minmax(0, 0.95fr);
  gap: 1.35rem;
  align-items: start;
}

.resume-template-modern-professional .resume-modern-sidebar {
  min-width: 0;
  padding-inline-start: 1rem;
  border-inline-start: 1px solid var(--resume-rule);
  background: color-mix(in srgb, var(--resume-background) 94%, var(--resume-heading) 6%);
}

.resume-template-modern-professional .resume-paper-identity {
  align-items: start;
}
```

Use existing Resume CSS variables such as `--resume-background`, `--resume-heading`, and `--resume-rule`; do not add a new palette contract.

- [ ] **Step 5: Add Modern header/photo geometry overrides**

Keep the same single image node but make it intentionally larger than ATS/Technical through template-scoped CSS. Do not alter storage or Candidate Photo controls.

- [ ] **Step 6: Run the focused Modern tests**

```bash
npm --prefix frontend test -- \
  src/features/resumes/ResumeTemplateLayouts.test.tsx \
  src/features/resumes/ResumePreview.candidatePhoto.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit Task 3**

```bash
git add \
  frontend/src/features/resumes/ResumeTemplateLayouts.tsx \
  frontend/src/features/resumes/ResumeTemplateLayouts.test.tsx \
  frontend/src/features/resumes/resumeTemplateDifferentiation.css
git commit -m "feat: add Modern Professional Resume layout"
```

---

### Task 4: Make Compact Technical a dense skills-first layout with a date rail

**Files:**
- Modify: `frontend/src/features/resumes/ResumeTemplateLayouts.test.tsx`
- Modify: `frontend/src/features/resumes/ResumeTemplateLayouts.tsx`
- Modify: `frontend/src/features/resumes/ResumeTemplateContent.tsx`
- Modify: `frontend/src/features/resumes/resumeTemplateDifferentiation.css`

**Interfaces:**
- Consumes `ResumeEntryLayout = "standard" | "technical-rail"` from Task 2.
- Produces `data-resume-layout="compact-technical"` and technical-rail entry classes for Experience and Projects.

- [ ] **Step 1: Write Compact Technical order/rail tests**

Assert the selected shell order is:

```ts
expect(sectionNames).toEqual([
  "summary",
  "skills",
  "experience",
  "projects",
  "education",
  "certifications",
  "languages",
  "interests",
]);
```

Also assert:

```ts
expect(container.querySelector('[data-resume-layout="compact-technical"]')).not.toBeNull();
expect(container.querySelectorAll(".resume-preview-entry--technical-rail").length).toBeGreaterThan(0);
```

- [ ] **Step 2: Run the layout test and verify RED**

```bash
npm --prefix frontend test -- src/features/resumes/ResumeTemplateLayouts.test.tsx
```

Expected: FAIL because Compact still uses the temporary ATS shell and standard entry layout.

- [ ] **Step 3: Implement `CompactTechnicalLayout`**

```tsx
function CompactTechnicalLayout(props: Omit<ResumeTemplateLayoutProps, "templateId">) {
  const { draft } = props;
  return (
    <div data-resume-layout="compact-technical" className="resume-layout resume-layout--technical">
      <ResumeIdentityHeader {...props} variant="technical" />
      <ResumeSummarySection draft={draft} />
      <ResumeSkillsSection draft={draft} />
      <ResumeExperienceSection draft={draft} entryLayout="technical-rail" />
      <ResumeProjectsSection draft={draft} entryLayout="technical-rail" />
      <ResumeEducationSection draft={draft} />
      <ResumeCertificationsSection draft={draft} />
      <ResumeLanguagesSection draft={draft} />
      <ResumeInterestsSection draft={draft} />
    </div>
  );
}
```

Update the dispatcher so `compact-technical` uses this shell.

- [ ] **Step 4: Give technical-rail entries explicit internal classes**

In shared Experience and Project renderers, keep current DOM/source order but add stable child classes to the existing heading/date/content elements so CSS can visually place the date rail without duplicating text:

```tsx
<div className="resume-preview-entry-heading">
  <strong className="resume-preview-entry-title">...</strong>
  <DateSpan ... className="resume-preview-entry-date" />
</div>
```

If `DateSpan` needs `className`, add an optional `className?: string` prop and pass it to `<small>`.

- [ ] **Step 5: Add dense technical/date-rail CSS**

```css
.resume-template-compact-technical .resume-layout--technical {
  font-size: 0.94em;
}

.resume-template-compact-technical .resume-preview-entry--technical-rail {
  display: grid;
  grid-template-columns: minmax(5.6rem, 0.28fr) minmax(0, 1fr);
  column-gap: 0.75rem;
}

.resume-template-compact-technical
  .resume-preview-entry--technical-rail
  .resume-preview-entry-heading {
  display: contents;
}

.resume-template-compact-technical
  .resume-preview-entry--technical-rail
  .resume-preview-entry-date {
  grid-column: 1;
  grid-row: 1 / span 3;
}

.resume-template-compact-technical
  .resume-preview-entry--technical-rail
  .resume-preview-entry-title,
.resume-template-compact-technical
  .resume-preview-entry--technical-rail
  > span,
.resume-template-compact-technical
  .resume-preview-entry--technical-rail
  > p,
.resume-template-compact-technical
  .resume-preview-entry--technical-rail
  > ul,
.resume-template-compact-technical
  .resume-preview-entry--technical-rail
  > small {
  grid-column: 2;
}
```

Tune only enough spacing to make the template clearly denser while retaining practical reading size. Do not add capsules/badges to Skills.

- [ ] **Step 6: Run Compact + skill-wrapping regression tests**

```bash
npm --prefix frontend test -- \
  src/features/resumes/ResumeTemplateLayouts.test.tsx \
  src/features/resumes/ResumePreview.test.tsx
```

Expected: PASS, including the existing long-skill wrapping test from PR #20.

- [ ] **Step 7: Commit Task 4**

```bash
git add \
  frontend/src/features/resumes/ResumeTemplateLayouts.tsx \
  frontend/src/features/resumes/ResumeTemplateLayouts.test.tsx \
  frontend/src/features/resumes/ResumeTemplateContent.tsx \
  frontend/src/features/resumes/resumeTemplateDifferentiation.css
git commit -m "feat: add Compact Technical Resume layout"
```

---

### Task 5: Prove Candidate Photo and canonical data remain shared across templates

**Files:**
- Modify: `frontend/src/features/resumes/ResumePreview.candidatePhoto.test.tsx`
- Modify: `frontend/src/features/resumes/ResumeTemplateLayouts.test.tsx`
- Modify: `frontend/src/features/resumes/resumeTemplateDifferentiation.css`

**Interfaces:**
- Consumes the shared `ResumeIdentityHeader` and unchanged `ResumeDraft` object.
- Produces one image maximum per template and no content mutation during rerender/template switching.

- [ ] **Step 1: Tighten Candidate Photo tests to exactly one image per template**

For each stable template ID, change/add:

```ts
expect(container.querySelectorAll(".resume-profile-photo")).toHaveLength(1);
expect(container.querySelector(".resume-profile-photo")?.getAttribute("src")).toBe(
  "blob:canonical-photo",
);
```

Keep the existing hidden-photo and missing-source cases expecting zero images.

- [ ] **Step 2: Add a template-switch data immutability test**

In `ResumeTemplateLayouts.test.tsx`:

```tsx
const draft = representativeDraft();
const before = JSON.stringify(draft);
const { rerender } = render(
  <ResumeTemplateLayout
    draft={draft}
    templateId="ats-classic"
    showCandidatePhoto={false}
  />,
);

rerender(
  <ResumeTemplateLayout
    draft={draft}
    templateId="modern-professional"
    showCandidatePhoto={false}
  />,
);
rerender(
  <ResumeTemplateLayout
    draft={draft}
    templateId="compact-technical"
    showCandidatePhoto={false}
  />,
);

expect(JSON.stringify(draft)).toBe(before);
```

Also assert the same representative full name, Experience title, skill group, Project, Education, Certification, Language, and Interest remain present after each rerender.

- [ ] **Step 3: Run tests and verify the contract**

```bash
npm --prefix frontend test -- \
  src/features/resumes/ResumePreview.candidatePhoto.test.tsx \
  src/features/resumes/ResumeTemplateLayouts.test.tsx
```

Expected: PASS.

- [ ] **Step 4: Add template-scoped photo sizing only**

In `resumeTemplateDifferentiation.css`, define distinct footprints without changing markup:

```css
.resume-template-ats-classic .resume-profile-photo-frame {
  width: 4.3rem;
  height: 5rem;
}

.resume-template-modern-professional .resume-profile-photo-frame {
  width: 5.2rem;
  height: 6rem;
}

.resume-template-compact-technical .resume-profile-photo-frame {
  width: 3.8rem;
  height: 4.4rem;
}
```

If existing Candidate Photo CSS uses stronger selectors, increase selector specificity only as needed; do not modify Candidate Photo storage/control code.

- [ ] **Step 5: Run Candidate Photo tests again**

Use the Step 3 command.

Expected: PASS.

- [ ] **Step 6: Commit Task 5**

```bash
git add \
  frontend/src/features/resumes/ResumePreview.candidatePhoto.test.tsx \
  frontend/src/features/resumes/ResumeTemplateLayouts.test.tsx \
  frontend/src/features/resumes/resumeTemplateDifferentiation.css
git commit -m "test: preserve Resume content and photo across templates"
```

---

### Task 6: Add restrained print pagination rules and preserve A4/Letter output

**Files:**
- Modify: `frontend/src/features/resumes/ResumePreview.test.tsx`
- Modify: `frontend/src/features/resumes/resumeTemplateDifferentiation.css`
- Verify unchanged: `frontend/src/features/resumes/resumePrint.ts`
- Verify unchanged: `frontend/src/features/resumes/ResumePrintControls.test.tsx`
- Verify unchanged: `frontend/src/features/resumes/resumePrint.test.ts`

**Interfaces:**
- Consumes existing native `window.print()` flow and `data-page-size`/inline `@page` rule from `ResumePreview`.
- Produces template-aware print break rules without a new print engine.

- [ ] **Step 1: Add static print-contract assertions to `ResumePreview.test.tsx`**

Read the new stylesheet once at module scope:

```ts
const templateCss = readFileSync(
  resolve(process.cwd(), "src/features/resumes/resumeTemplateDifferentiation.css"),
  "utf8",
);
```

Add assertions that the stylesheet contains an `@media print` block, entry-level break protection, and no global whole-section `break-inside: avoid` rule:

```ts
expect(templateCss).toContain("@media print");
expect(templateCss).toMatch(/\.resume-preview-entry[^\{]*\{[^}]*break-inside:\s*avoid-page;/s);
expect(templateCss).not.toMatch(/\.resume-paper\s+section\s*\{[^}]*break-inside:\s*avoid/s);
```

Keep existing tests that prove Letter emits `size: Letter` and ATS fallback remains safe.

- [ ] **Step 2: Run focused print tests and verify RED for the new CSS contract**

```bash
npm --prefix frontend test -- \
  src/features/resumes/ResumePreview.test.tsx \
  src/features/resumes/ResumePrintControls.test.tsx \
  src/features/resumes/resumePrint.test.ts
```

Expected: the new CSS assertion fails until print rules are added; existing print-control tests remain green.

- [ ] **Step 3: Add restrained print rules**

In `resumeTemplateDifferentiation.css`:

```css
@media print {
  .resume-paper h4 {
    break-after: avoid-page;
  }

  .resume-preview-entry {
    break-inside: avoid-page;
  }

  .resume-paper-compact-list > li,
  .resume-paper-skills > div {
    break-inside: avoid-page;
  }

  .resume-layout,
  .resume-modern-content,
  .resume-modern-sidebar {
    min-width: 0;
  }
}
```

Do **not** add `break-inside: avoid` to all sections or the entire modern content/sidebar columns.

- [ ] **Step 4: Keep Modern Professional print geometry explicit but browser-QA gated**

Preserve the same two-column `resume-modern-columns` structure in print unless actual local Chromium print QA shows clipping/overlap. Do not preemptively introduce JavaScript pagination or duplicate content.

If local QA later proves Chromium cannot fragment the grid safely, the PR remains unmergeable and the smallest repair must be made on the same branch. The permitted repair is CSS-only and must keep the first-page Modern identity while ensuring continuation content is not clipped; no new PDF engine is authorized.

- [ ] **Step 5: Run focused print tests and verify GREEN**

Use the Step 2 command.

Expected: PASS.

- [ ] **Step 6: Commit Task 6**

```bash
git add \
  frontend/src/features/resumes/ResumePreview.test.tsx \
  frontend/src/features/resumes/resumeTemplateDifferentiation.css
git commit -m "feat: refine Resume template print pagination"
```

---

### Task 7: Run focused automated qualification and inspect the implementation diff

**Files:**
- Test only; no production changes unless a failure identifies a scoped defect.

**Interfaces:**
- Consumes all implementation tasks.
- Produces a locally pullable PR head only after focused tests/typecheck/build are clean.

- [ ] **Step 1: Run the focused Resume template suite**

```bash
npm --prefix frontend test -- \
  src/features/resumes/resumeTemplateRegistry.test.ts \
  src/features/resumes/ResumeMiniDocument.test.tsx \
  src/features/resumes/ResumeTemplateLayouts.test.tsx \
  src/features/resumes/ResumePreview.test.tsx \
  src/features/resumes/ResumePreview.candidatePhoto.test.tsx \
  src/features/resumes/ResumeDesignControls.test.tsx \
  src/features/resumes/ResumePrintControls.test.tsx \
  src/features/resumes/resumePrint.test.ts
```

Expected: all focused files/tests PASS.

- [ ] **Step 2: Run frontend typecheck**

```bash
npm --prefix frontend run typecheck
```

Expected exit code: `0`.

- [ ] **Step 3: Run frontend production build**

```bash
npm --prefix frontend run build
```

Expected exit code: `0`.

- [ ] **Step 4: Run diff hygiene**

```bash
git diff --check origin/main...HEAD
```

Expected exit code: `0`.

- [ ] **Step 5: Review changed-file scope**

The implementation diff must be limited to:

```text
frontend/src/features/resumes/ResumeTemplateContent.tsx
frontend/src/features/resumes/ResumeTemplateLayouts.tsx
frontend/src/features/resumes/ResumeTemplateLayouts.test.tsx
frontend/src/features/resumes/ResumeMiniDocument.tsx
frontend/src/features/resumes/ResumeMiniDocument.test.tsx
frontend/src/features/resumes/ResumePreview.tsx
frontend/src/features/resumes/ResumePreview.test.tsx
frontend/src/features/resumes/ResumePreview.candidatePhoto.test.tsx
frontend/src/features/resumes/ResumeDesignControls.test.tsx
frontend/src/features/resumes/resumeTemplateRegistry.ts
frontend/src/features/resumes/resumeTemplateRegistry.test.ts
frontend/src/features/resumes/resumeTemplateDifferentiation.css
docs/superpowers/specs/2026-08-15-resume-template-differentiation-design.md
docs/superpowers/plans/2026-08-15-resume-template-differentiation.md
```

If `resumeWorkspace.css` or `resumeImportSkillsRefinement.css` changed, the PR description must explain the exact demonstrated conflict that required it. Any backend/package/lockfile/environment/deployment change is out of scope and must be removed or explicitly re-approved before continuing.

- [ ] **Step 6: Commit any test-only qualification correction if one was needed**

Only if Steps 1–5 exposed a scoped defect, fix it TDD-first and commit it with a precise message. Otherwise make no extra commit.

---

### Task 8: Run full frontend regression before human QA

**Files:**
- Test only.

- [ ] **Step 1: Run the full frontend suite**

```bash
npm --prefix frontend test
```

Expected: all test files/tests PASS with exit code `0`.

- [ ] **Step 2: Re-run typecheck/build/diff after the full suite**

```bash
npm --prefix frontend run typecheck
echo "FRONTEND_TYPECHECK_EXIT=$?"

npm --prefix frontend run build
echo "FRONTEND_BUILD_EXIT=$?"

git diff --check origin/main...HEAD
echo "DIFF_CHECK_EXIT=$?"
```

Expected:

```text
FRONTEND_TYPECHECK_EXIT=0
FRONTEND_BUILD_EXIT=0
DIFF_CHECK_EXIT=0
```

- [ ] **Step 3: Confirm clean local branch state**

```bash
git branch --show-current
git rev-parse HEAD
git status --short
```

Expected: feature branch name, expected PR head SHA, and no `git status --short` output.

---

### Task 9: User browser and native-PDF QA with one representative Resume

**Files:**
- No code changes unless QA finds a defect.

**Manual server requirement:** YES for this task only.

- [ ] **Step 1: Start backend in Terminal 1**

```bash
cd "/Users/prabhathmalinda/Documents/Projects/Career Learning Hub"
npm run dev:backend
```

- [ ] **Step 2: Start frontend in Terminal 2**

```bash
cd "/Users/prabhathmalinda/Documents/Projects/Career Learning Hub"
npm run dev:frontend
```

- [ ] **Step 3: Use the same representative Resume for all comparisons**

Use a Resume containing at least:

- full identity/contact details;
- Candidate Photo enabled;
- Summary;
- at least two Experience entries;
- Education;
- multiple long Skill groups;
- at least two Projects;
- at least one Certification;
- Languages;
- Interests.

This must be the same content when switching templates.

- [ ] **Step 4: Verify ATS Classic live preview**

Pass criteria:

- unmistakably traditional single column;
- no sidebar;
- conservative small photo;
- section order Summary → Experience → Education → Skills → Projects → Certifications → Languages → Interests;
- clean skill wrapping with no capsules;
- no clipping/horizontal overflow.

- [ ] **Step 5: Verify Modern Professional live preview**

Pass criteria:

- visibly stronger header;
- genuine wider content region + supporting sidebar;
- Summary/Experience/Projects in the wider region;
- Skills/Education/Certifications/Languages/Interests in sidebar;
- medium integrated Candidate Photo;
- no duplicated content or nested application-like cards.

- [ ] **Step 6: Verify Compact Technical live preview**

Pass criteria:

- Skills appears before Experience;
- dense but readable spacing;
- visible date/metadata rail for technical entries;
- smaller Candidate Photo footprint;
- Projects remain prominent;
- long skills wrap naturally.

- [ ] **Step 7: Verify appearance-picker miniatures**

Open Customize and confirm the three radio-card miniatures are visually distinguishable before reading their names:

- ATS = stacked single column;
- Modern = sidebar geometry;
- Compact = technical/date rail geometry.

Also verify Font/Palette changes do not collapse those structural differences and Save/Reset behavior still works.

- [ ] **Step 8: Generate and compare three A4 browser PDFs**

For each template select A4, open the native print dialog, save a PDF, and compare side by side.

Pass criteria for every PDF:

- selectable text;
- no clipping;
- no overlap;
- no duplicated/omitted sections;
- photo appears once when enabled;
- safe links remain ordinary browser-PDF links where supported;
- Certifications is not unnecessarily orphaned onto an almost-empty page when normal content density allows it.

A second page is acceptable when content genuinely requires it.

- [ ] **Step 9: Spot-check all three templates at Letter**

Verify the same structural identity and no clipping/overlap under Letter page size. Full three-file side-by-side comparison is optional; at minimum inspect print preview and save one representative Letter PDF if a pagination concern appears.

- [ ] **Step 10: Modern Professional fragmentation gate**

If any Modern PDF has clipped, overlapping, duplicated, or missing sidebar/main content, stop. Do not approve merge. Report the exact page/template/font/palette combination and screenshot/PDF evidence so the same PR can receive a CSS-only print repair.

- [ ] **Step 11: Report browser/PDF QA evidence in the PR**

Record which A4/Letter combinations were checked, screenshots/PDF observations, and PASS/FAIL. Do not mark the PR ready for merge until the user explicitly says the templates look correct.

---

### Task 10: Final PR qualification and merge gate

**Files:**
- PR metadata/evidence only unless a final defect is found.

- [ ] **Step 1: Re-run changed focused tests after any browser-QA repair**

If browser QA caused a repair, run the exact affected focused tests first, then the full frontend suite/typecheck/build/diff again. If browser QA caused no code changes, reuse the fresh Task 8 automated evidence.

- [ ] **Step 2: Verify the PR head and mergeability through GitHub**

Confirm the draft PR head is the exact locally qualified SHA and the PR is mergeable.

- [ ] **Step 3: Summarize final evidence**

The PR summary must include:

- focused template tests PASS;
- full frontend suite PASS;
- frontend typecheck PASS;
- frontend production build PASS;
- `git diff --check` PASS;
- ATS Classic browser QA PASS;
- Modern Professional browser QA PASS;
- Compact Technical browser QA PASS;
- A4 three-PDF comparison PASS;
- Letter spot-check PASS;
- no backend/dependency/migration changes.

- [ ] **Step 4: Wait for explicit merge authorization**

Required user approval phrase:

```text
APPROVE RESUME TEMPLATE DIFFERENTIATION PR MERGE
```

Do not merge before that authorization. Do not deploy or delete branches as part of the merge.
