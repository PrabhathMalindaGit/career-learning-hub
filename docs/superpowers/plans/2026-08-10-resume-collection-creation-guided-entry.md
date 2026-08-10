# Phase 19A-2 — Resume Collection, Creation & Guided Entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver one truthful Create Resume workflow, deterministic Guided
Setup and editor helpers, a stronger Resume collection, and PDF review before
adoption without regressing the approved Phase 19A-1 workspace.

**Architecture:** Keep Resume creation and editing on the existing canonical
Resume contracts. Add readonly local guidance and focused React components,
then change only PDF import from immediate persistence to a private,
time-bounded job result confirmed through one owned endpoint. Reuse the
existing Dialog, API client, job queue, immutable Version 1 transaction,
private Asset lifecycle, CSS, and tests.

**Tech Stack:** React 19, React Router 7, TypeScript 5.8, Vite 6, Vitest,
Testing Library, Express 5, Zod 3, Mongoose 8, MongoDB transactions, existing
Gemini Direct job infrastructure.

## Global constraints

- **Phase:** Phase 19A-2 — Resume Collection, Creation & Guided Entry.
- **Model:** GPT-5.6 Thinking / strongest available equivalent.
- **Intelligence:** High.
- **Manual terminal:** Operator handles Git lifecycle manually.
- **Servers during normal implementation:** No continuously running
  operator-managed services are required for unit, integration, typecheck, or
  build work.
- **Browser:** Prohibited by default during normal implementation.
- **Git:** No stage, commit, push, PR, merge, or deployment until separate
  operator authorization after human visual approval.
- Accepted design authority:
  `docs/superpowers/specs/2026-08-10-resume-collection-creation-guided-entry-design.md`.
- Accepted design token:
  `PHASE_19A2_RESUME_COLLECTION_CREATION_GUIDED_ENTRY_DESIGN_APPROVED` —
  `ACCEPTED / YES`.
- Preserve Phase 19A-1 progressive disclosure, nine navigation destinations,
  validation reveal/focus, compact Skills editor, atomic Skills preview,
  natural-height paper, desktop/single-column layout, appearance controls,
  spellcheck, immutable versions/history, print, ownership, and privacy.
- Gemini remains direct-only on fixed model `gemini-3.6-flash`; OpenRouter is
  dormant. Deterministic guidance makes no provider request.
- Do not add dependencies, global state, form frameworks, a new modal system,
  a second Resume schema, an import-candidate model, a cleanup service, or a
  discard endpoint.
- Every factual Resume fragment requires explicit user input or selection.
- Apply the three-attempt limit to one repeated root failure.

## Locked implementation boundaries

### New production files

- `frontend/src/features/resumes/resumeGuidance.ts`
- `frontend/src/features/resumes/ResumeCreateDialog.tsx`
- `frontend/src/features/resumes/ResumeGuidedSetup.tsx`
- `frontend/src/features/resumes/ResumeSkillPicker.tsx`
- `frontend/src/features/resumes/ResumePdfUpload.tsx`
- `frontend/src/features/resumes/ResumeAchievementBuilder.tsx`

### Modified production files

- `frontend/src/features/resumes/ResumeListPage.tsx`
- `frontend/src/features/resumes/ResumeEditor.tsx`
- `frontend/src/features/resumes/ResumeWorkspace.tsx`
- `frontend/src/features/resumes/resumeApi.ts`
- `frontend/src/features/resumes/resumeContracts.ts`
- `frontend/src/features/resumes/types.ts`
- `frontend/src/features/resumes/resumeWorkspace.css`
- `backend/src/modules/resume-analysis/resumeAnalysis.routes.ts`
- `backend/src/modules/resume-analysis/resumeAnalysis.controller.ts`
- `backend/src/modules/resume-analysis/resumeAnalysis.schemas.ts`
- `backend/src/modules/resume-analysis/resumeAnalysis.service.ts`
- `backend/src/modules/resume-analysis/resumeAnalysis.jobs.ts`
- `backend/src/jobs/job.queue.ts`
- `backend/src/jobs/job.worker.ts`

The two generic job files are the only addition to the audit's expected
production boundary. They are required because `JobRecord` already has the
right `expiresAt` field and TTL index, while `completeJob` currently overwrites
every successful job's expiry with the 30-day default. Passing and preserving
the temporary Asset's earlier expiry is smaller than adding any storage model
or cleanup subsystem.

### Expected unchanged production files

- `frontend/src/AppShell.tsx`
- `frontend/src/features/dashboard/MainDashboard.tsx`
- `frontend/src/components/Dialog.tsx`
- `frontend/src/features/resumes/ResumeMiniDocument.tsx`
- `backend/src/jobs/job.model.ts`
- `backend/src/modules/resumes/resume.service.ts`
- Resume and ResumeVersion Mongo models
- `packages/shared-types/src/index.ts`
- package manifests and lockfiles

## Shared implementation contracts

Use these exact names consistently through the tasks:

```ts
export interface SkillSelection {
  groupName: string;
  keyword: string;
}

export interface AchievementParts {
  action: string;
  work: string;
  technology?: string;
  result?: string;
}

export type ResumeImportResult =
  | { kind: "import-review"; content: ResumeContent }
  | {
      kind: "import-adopted";
      resumeId: string;
      versionId: string;
      versionNumber: number;
    };
```

`import-review` exists only in an owned, unexpired completed job. After
confirmation, the backend replaces it with `import-adopted`.

---

### Task 1: Local guidance catalogues and pure utilities

**Files:**

- Create: `frontend/src/features/resumes/resumeGuidance.ts`
- Create: `frontend/src/features/resumes/resumeGuidance.test.ts`
- Consume: `frontend/src/features/resumes/types.ts`

**Interfaces:**

- Consumes: `DraftSkill`, `ResumeContentInput`, and `createDraftEntity`'s
  existing client-identity convention.
- Produces:

```ts
export const JOB_TITLE_SUGGESTIONS: readonly string[];
export const SKILL_CATEGORIES: readonly {
  name: string;
  skills: readonly string[];
}[];
export const ROLE_SKILL_SUGGESTIONS: Readonly<Record<string, readonly string[]>>;
export const QUALIFICATION_SUGGESTIONS: readonly string[];
export const PROFICIENCY_SUGGESTIONS: readonly string[];
export const INTEREST_SUGGESTIONS: readonly string[];
export const EXPERIENCE_ACTION_STARTERS: readonly string[];
export type ExperienceLevel = "student" | "entry" | "mid" | "senior";
export const SUGGESTED_SECTIONS_BY_EXPERIENCE_LEVEL:
  Readonly<Record<ExperienceLevel, readonly string[]>>;
export interface SkillSelection { groupName: string; keyword: string }
export interface AchievementParts {
  action: string;
  work: string;
  technology?: string;
  result?: string;
}
export function suggestedSkillsForRole(role: string): readonly string[];
export function normalizeSkillKey(value: string): string;
export function mergeSkillSelections(
  existing: readonly DraftSkill[],
  selections: readonly SkillSelection[],
): DraftSkill[];
export function buildGuidedResumeContent(input: {
  targetRole: string;
  useTargetRoleAsHeadline: boolean;
  skills: readonly DraftSkill[];
}): ResumeContentInput;
export function composeAchievement(parts: AchievementParts): string;
```

Use these exact local values:

```ts
export const JOB_TITLE_SUGGESTIONS = [
  "Software Engineer", "Software Developer", "Software Engineering Intern",
  "Full-Stack Developer", "Frontend Developer", "Backend Developer",
  "Mobile Developer", "Data Analyst", "Data Scientist",
  "Machine Learning Engineer", "QA Engineer", "DevOps Engineer",
  "Cloud Engineer", "Cybersecurity Analyst", "UI/UX Designer",
  "Product Manager",
] as const;

export const SKILL_CATEGORIES = [
  { name: "Programming Languages", skills: [
    "JavaScript", "TypeScript", "Python", "Java", "C#", "C++", "Swift",
    "Kotlin", "PHP", "Go",
  ] },
  { name: "Frontend", skills: [
    "React", "Vue", "Angular", "HTML", "CSS", "Next.js",
  ] },
  { name: "Backend", skills: [
    "Node.js", "Express", "Spring Boot", "Django", "FastAPI", "ASP.NET",
  ] },
  { name: "Databases", skills: [
    "MongoDB", "PostgreSQL", "MySQL", "SQLite", "Redis",
  ] },
  { name: "Cloud / DevOps", skills: [
    "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "CI/CD",
  ] },
  { name: "Testing", skills: [
    "Vitest", "Jest", "Playwright", "Cypress",
  ] },
  { name: "Tools", skills: ["Git", "GitHub", "Jira", "Figma"] },
  { name: "Soft Skills", skills: [
    "Communication", "Problem Solving", "Teamwork", "Leadership",
    "Time Management",
  ] },
] as const;

export const ROLE_SKILL_SUGGESTIONS = {
  "software engineer": [
    "JavaScript", "TypeScript", "React", "Node.js",
    "Express", "MongoDB", "Git", "Docker",
  ],
} as const;

export const QUALIFICATION_SUGGESTIONS = [
  "BSc", "BSc (Hons)", "BEng", "BA", "MSc", "MEng", "MBA", "Diploma",
  "Higher Diploma", "Certificate", "Other",
] as const;
export const PROFICIENCY_SUGGESTIONS = [
  "Native", "Fluent", "Professional", "Intermediate", "Basic",
] as const;
export const INTEREST_SUGGESTIONS = [
  "Open-source development", "Machine learning", "Robotics", "Photography",
  "Hiking", "Volunteering", "Reading", "Chess", "Sports", "Travel",
] as const;
export const EXPERIENCE_ACTION_STARTERS = [
  "Built", "Developed", "Implemented", "Designed", "Improved", "Automated",
  "Created", "Integrated", "Tested", "Deployed", "Optimized", "Collaborated",
] as const;
```

The first release maps only the one role with an explicitly approved skill
set. Every other catalogue/custom role shows the full picker without role
suggestions. Use the same six non-persisted section labels from the approved
example for all four levels, ordered as local guidance:

```ts
student: ["Summary", "Education", "Skills", "Projects", "Experience", "Certifications"]
entry:   ["Summary", "Experience", "Education", "Skills", "Projects", "Certifications"]
mid:     ["Summary", "Experience", "Skills", "Projects", "Education", "Certifications"]
senior:  ["Summary", "Experience", "Skills", "Projects", "Education", "Certifications"]
```

- `suggestedSkillsForRole` uses trimmed, case-insensitive exact matching only.
  A custom role returns `[]`; it does not fuzzy-match.
- `mergeSkillSelections` returns a new array, preserves existing group order,
  `clientKey`, optional `id`, group spelling, and keyword spelling, and appends
  only new case-insensitive keywords. New groups follow selection order.
- `buildGuidedResumeContent` emits all canonical arrays empty except explicitly
  selected Skills and includes the target role as `basics.headline` only when
  the unchecked opt-in is true.

- [x] **Step 1.1: Write failing catalogue and suggestion tests**

Add concrete assertions for the approved titles, eight category names, full
skill values, qualification/proficiency/interest seeds, and twelve action
starters. Assert all four experience levels expose only the six documented
read-only section labels and do not create Resume entities. Add these
behavioral cases:

```ts
expect(suggestedSkillsForRole("Software Engineer")).toEqual([
  "JavaScript", "TypeScript", "React", "Node.js",
  "Express", "MongoDB", "Git", "Docker",
]);
expect(suggestedSkillsForRole("  software engineer  ")).toEqual(
  suggestedSkillsForRole("Software Engineer"),
);
expect(suggestedSkillsForRole("Custom Quantum Wrangler")).toEqual([]);
```

Assert that reading suggestions does not mutate a `ResumeDraft` fixture and
does not return selected-state data.

- [x] **Step 1.2: Write failing Skill merge tests**

Use an existing group with `clientKey: "skills-1"`, `id: "persisted-1"`, name
`Frontend`, and keyword `React`. Merge `react`, `TypeScript`, and custom group
`Platform` / `Kubernetes`. Assert the original value is unchanged, Frontend
keeps identity/order/spelling, `react` is not duplicated, and Platform is
appended once. Assert custom skill/group strings within canonical limits are
accepted.

- [x] **Step 1.3: Write failing guided-content and achievement tests**

Use this exact grammar case:

```ts
expect(composeAchievement({
  action: "  Built ",
  work: "a job tracking dashboard",
  technology: "React and Node.js",
  result: "used by 25 testers",
})).toBe(
  "Built a job tracking dashboard using React and Node.js — used by 25 testers.",
);
```

Also prove omitted Technology/Result add no connector, supplied terminal
punctuation is not doubled, `AWS` never gains an inferred article, empty
Action or Work returns an empty draft for disabled insertion, and every output
fragment occurs in the supplied fields or fixed connectors `using`, `—`, and
terminal punctuation.

For guided content, assert role changes alone select nothing, unchecked
headline produces no headline, and only selected skill keywords appear.

- [x] **Step 1.4: Run RED**

Run:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/resumeGuidance.test.ts
```

Expected: FAIL because `resumeGuidance.ts` and its exports do not exist.

- [x] **Step 1.5: Implement the minimum pure module**

Declare the prompt-approved readonly catalogues. Normalize only with
`value.trim().replace(/\s+/g, " ")`; use `toLowerCase()` only for lookup
keys. Compose achievements as:

```ts
const base = `${action} ${work}`;
const withTechnology = technology ? `${base} using ${technology}` : base;
const withResult = result ? `${withTechnology} — ${result}` : withTechnology;
return /[.!?]$/.test(withResult) ? withResult : `${withResult}.`;
```

Do not infer articles, singular/plural grammar, facts, or values.

- [x] **Step 1.6: Run GREEN and focused regression**

Run:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/resumeGuidance.test.ts src/features/resumes/resumeDraft.test.ts
```

Expected: both files PASS with no Resume draft mutation.

- [x] **Step 1.7: Cleanup check**

Confirm the module imports no API/provider code, exports readonly data, creates
no persisted IDs, and includes no external taxonomy or certification list.

### Task 2: Current create-content contract

**Files:**

- Modify: `frontend/src/features/resumes/resumeApi.ts`
- Modify: `frontend/src/features/resumes/resumeContracts.ts`
- Modify: `frontend/src/features/resumes/types.ts`
- Modify: `frontend/src/features/resumes/resumeApi.test.ts`
- Modify: `frontend/src/features/resumes/resumeContracts.test.ts`
- Create: `backend/src/tests/integration/resumeCreation.integration.test.ts`

**Interfaces:**

- Consumes: existing `POST /api/v1/resumes`, `ResumeContentInput`,
  `parseResumeWorkspace`, request cancellation, and `ApiError` request IDs.
- Produces:

```ts
export interface CreateResumeInput {
  title: string;
  content?: ResumeContentInput;
}

export async function createResume(
  input: CreateResumeInput,
  signal?: AbortSignal,
): Promise<ResumeWorkspaceData>;

export function parseResumeContent(value: unknown): ResumeContent;
```

`parseResumeContent` is a public wrapper around the existing private canonical
content parser; it does not introduce another schema.

- [x] **Step 2.1: Write frontend RED tests**

Assert Start blank sends exactly `{ title: "Blank Resume" }`, Guided sends
`{ title, content }`, response parsing still rejects mismatched
Resume/version identity, cancellation reaches the shared API client, and an
`ApiError` retains its request ID. Add a contract test that
`parseResumeContent` accepts a canonical content object and rejects unknown
keys, malformed IDs, invalid email/URL data, and over-limit arrays exactly as
the current workspace parser does.

- [x] **Step 2.2: Run frontend RED**

Run:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/resumeApi.test.ts src/features/resumes/resumeContracts.test.ts
```

Expected: FAIL because `createResume` still accepts a title string and
`parseResumeContent` is not exported.

- [x] **Step 2.3: Implement the frontend wrapper change**

Change only the wrapper body to send:

```ts
body: {
  title: input.title,
  ...(input.content === undefined ? {} : { content: input.content }),
}
```

Export `CreateResumeInput` from `types.ts`, export `parseResumeContent`, and
update existing callers/tests to pass `{ title }`. Keep response validation,
central authentication, signal handling, and error behavior unchanged.

- [x] **Step 2.4: Write backend RED integration evidence**

Post a synthetic canonical payload with one explicitly selected Skills group.
Assert HTTP 201, one owned `ResumeModel` record, one owned
`ResumeVersionModel` record, `latestVersionNumber === 1`, source `manual`,
matching `currentVersionId`, and no Version 2. Post title-only input and assert
its canonical sections are empty. Reject unknown/invalid content through the
existing validation middleware.

- [x] **Step 2.5: Run backend RED/evidence command**

Run:

```bash
npm run test --workspace @career-learning-hub/api -- src/tests/integration/resumeCreation.integration.test.ts
```

Expected before adding the test fixture: FAIL because the focused test file
does not exist. After the test is added, the current backend should PASS. A
backend production failure would disprove the audit and stops Task 2 before
changing Resume persistence.

Evidence: the focused test passed immediately, 3/3, proving the existing
backend already satisfies this contract. Task 2 changed no backend production
file.

- [x] **Step 2.6: Run GREEN and regression**

Run:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/resumeApi.test.ts src/features/resumes/resumeContracts.test.ts src/features/resumes/ResumeListPage.test.tsx
npm run test --workspace @career-learning-hub/api -- src/tests/integration/resumeCreation.integration.test.ts
```

Expected: PASS. Exactly one Version 1 is proven for both blank and guided
creation.

- [x] **Step 2.7: Cleanup check**

Confirm no Resume route, service, model, shared-package contract, or database
schema changed.

### Task 3: Unified Create Resume Dialog

**Files:**

- Create: `frontend/src/features/resumes/ResumeCreateDialog.tsx`
- Create: `frontend/src/features/resumes/ResumeCreateDialog.test.tsx`
- Modify: `frontend/src/features/resumes/ResumeListPage.tsx`
- Modify: `frontend/src/routing/router.test.tsx`

**Interfaces:**

- Consumes: existing `Dialog`, `createResume({ title })`, current import job
  polling/resilience behavior, and later Tasks 5–6 panels.
- Produces:

```ts
export type ResumeCreateMethod = "choose" | "guided" | "blank" | "import";

export interface ResumeCreateDialogProps {
  open: boolean;
  returnFocusRef: React.RefObject<HTMLElement | null>;
  onClose(): void;
  onCreated(workspace: ResumeWorkspaceData): void;
}
```

The component owns its method state. Closing resets to `choose`; Back resets
method-specific errors without creating or importing anything.

- [x] **Step 3.1: Write dialog RED tests**

Test the first view has exactly three method buttons in this order: Guided
setup, Start blank, Import PDF. Assert initial focus is Guided setup; opening
calls neither `createResume` nor `importResumePdf`; method selection is
keyboard-operable; Back returns to chooser; Escape closes only while no
submission/confirmation is busy; close restores focus; and reopening resets
the first view.

Test blank creation trims a valid 1–120 title, calls
`createResume({ title })` once, passes the validated workspace to `onCreated`,
prevents duplicate submission, focuses an invalid title, and renders safe
request-ID errors.

- [x] **Step 3.2: Write query-intent RED tests**

In `ResumeListPage.test.tsx` and `router.test.tsx`, assert:

- `/resumes?action=create` opens the chooser without an API/provider call;
- only the consumed `action=create` parameter is removed with replace
  navigation;
- unrelated query parameters remain;
- unknown `action` values remain untouched; and
- list heading/empty-state Create buttons open the same dialog instance.

- [x] **Step 3.3: Run RED**

Run:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/ResumeCreateDialog.test.tsx src/features/resumes/ResumeListPage.test.tsx src/routing/router.test.tsx
```

Expected: FAIL because the dialog does not exist and the query currently
focuses the permanent blank-title field.

- [x] **Step 3.4: Implement chooser and routing state**

Reuse `Dialog` with stable heading/description IDs, a ref to the Guided button
as `initialFocusRef`, and the activating Create button as `returnFocusRef`.
Use one `openCreateDialog` callback for the heading and empty state. Consume
only the exact create intent:

```ts
if (searchParams.get("action") === "create") {
  const next = new URLSearchParams(searchParams);
  next.delete("action");
  setSearchParams(next, { replace: true });
  setCreateOpen(true);
}
```

Keep `/resumes?action=create`; add no route and no modal framework. During
implementation, Tasks 5 and 6 complete the Import and Guided panels before
the integrated verification task.

- [x] **Step 3.5: Run GREEN and regression**

Run:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/ResumeCreateDialog.test.tsx src/features/resumes/ResumeListPage.test.tsx src/routing/router.test.tsx src/AppShell.test.tsx src/features/dashboard/MainDashboard.test.tsx
```

Expected: PASS; AppShell and Dashboard still target the canonical query URL.

- [x] **Step 3.6: Cleanup check**

Confirm no `/resumes/new` route, alternate modal, automatic provider request,
or API call on open exists. Keep AppShell and Dashboard production files
unchanged.

### Task 4: Collection, card hierarchy, and pagination refinement

**Files:**

- Modify: `frontend/src/features/resumes/ResumeListPage.tsx`
- Modify: `frontend/src/features/resumes/resumeWorkspace.css`
- Modify: `frontend/src/features/resumes/ResumeListPage.test.tsx`
- Preserve: `frontend/src/features/resumes/ResumeMiniDocument.tsx`

**Interfaces:**

- Consumes: `ResumeRecord`, server `Pagination`,
  `resolveResumePresentation`, `ResumeMiniDocument`, and `Pager`.
- Produces: full-width collection markup; capped CSS grid; card metadata order;
  conditional `Pager` rendering.

- [x] **Step 4.1: Write collection RED tests**

Render zero, one, two, and several synthetic records. Assert each card exposes
title, state, `Version N`, formatted updated time, template label, optional
palette label, and a strong `Open Resume` link. Assert the design schematic is
`aria-hidden`, contains no candidate content, and has no badge/action overlay.
Assert no extra Resume-version API call occurs.

Assert Pager is absent for pages `0` and `1`, present for pages `2+`, and its
buttons continue to change the server-owned page request rather than append
fake infinite-scroll data.

- [x] **Step 4.2: Run RED**

Run:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/ResumeListPage.test.tsx
```

Expected: FAIL because the permanent sidebar/overlay remain and Pager renders
for a single page.

- [x] **Step 4.3: Implement the minimum markup and CSS**

Remove the permanent create/import sidebar. Keep the collection at full
available width. Use a start-aligned bounded grid such as:

```css
.resume-record-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 20rem));
  align-items: start;
  justify-content: start;
  gap: 1rem;
}
```

Place state/version/time/template metadata in normal flow below the schematic
and render Pager only under `pagination && pagination.pages > 1`. Keep the
existing content-free template schematic and loading/error cancellation logic.

- [x] **Step 4.4: Run GREEN and CSS regression**

Run:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/ResumeListPage.test.tsx
```

Expected: PASS for card hierarchy, no N+1 requests, and conditional Pager.

- [x] **Step 4.5: Cleanup check**

Inspect the diff to ensure no content thumbnail, new list endpoint, fake
pagination, candidate-content log, or unrelated workspace CSS rewrite exists.

### Task 5: Canonical accessible PDF upload

**Files:**

- Create: `frontend/src/features/resumes/ResumePdfUpload.tsx`
- Create: `frontend/src/features/resumes/ResumePdfUpload.test.tsx`
- Modify: `frontend/src/features/resumes/ResumeCreateDialog.tsx`
- Modify: `frontend/src/features/resumes/ResumeListPage.tsx`

**Interfaces:**

- Consumes: browser `File`, one native file input, the current 15 MB limit,
  and the existing import submission/polling callbacks.
- Produces:

```ts
export interface ResumePdfUploadProps {
  file: File | null;
  error?: string;
  busy?: boolean;
  onChange(file: File | null): void;
}

export function validateResumePdfFiles(files: readonly File[]):
  | { file: File }
  | { error: string };

export function ResumePdfUpload(props: ResumePdfUploadProps): JSX.Element;
```

The component is controlled; it owns only the input ref, drag depth, and
accessible selection mechanics. The Dialog owns title, server error, job, and
busy/polling state.

- [x] **Step 5.1: Write upload RED tests**

Assert exactly one `input[type=file]` with
`accept="application/pdf,.pdf"`. Exercise keyboard/click selection and
truthful drop. Verify exactly one file, PDF MIME or `.pdf` fallback, non-empty,
and at most `15 * 1024 * 1024` bytes. Verify selected filename and formatted
size, Replace using the same native input, Remove clearing both controlled and
native values, associated error text, and busy-state disabling.

Drop two PDFs and assert one-file validation rejects both rather than choosing
one silently. Drop or select an invalid/empty/oversized file and assert no
upload callback is reached.

- [x] **Step 5.2: Run RED**

Run:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/ResumePdfUpload.test.tsx
```

Expected: FAIL because the canonical component does not exist.

- [x] **Step 5.3: Implement and integrate the controlled component**

Use a visually labelled button that calls `inputRef.current?.click()` and a
single hidden-but-focusable native input. Route both `event.target.files` and
`dataTransfer.files` through `validateResumePdfFiles`. Provide visible copy
that client validation is guidance and server validation is authoritative.

Move the current import title/submission/polling/resilience behavior into the
Dialog's Import method and replace page-local input/drag state with the
controlled component. Keep `resumePdfUpload` server MIME/magic-byte/size,
quota, ownership, and private storage as authority.

Map `provider_not_configured` or its current normalized equivalent to:

```text
PDF import needs a connected Gemini account.
```

Render the existing safe Settings link and request ID when available. Do not
prefetch Settings and do not reveal provider response bodies.

- [x] **Step 5.4: Run GREEN and import regression**

Run:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/ResumePdfUpload.test.tsx src/features/resumes/ResumeCreateDialog.test.tsx src/features/resumes/ResumeListPage.test.tsx
```

Expected: PASS; there is one underlying input and current job resilience is
still reachable.

- [x] **Step 5.5: Cleanup check**

Search `ResumeCreateDialog.tsx`, `ResumeListPage.tsx`, and
`ResumePdfUpload.tsx` and confirm their rendered import path contains one
native file input total. Confirm no second upload endpoint or availability
probe was added.

### Task 6: Guided Setup and reusable Skill Picker

**Files:**

- Create: `frontend/src/features/resumes/ResumeGuidedSetup.tsx`
- Create: `frontend/src/features/resumes/ResumeSkillPicker.tsx`
- Create: `frontend/src/features/resumes/ResumeSkillPicker.test.tsx`
- Create: `frontend/src/features/resumes/ResumeGuidedSetup.test.tsx`
- Modify: `frontend/src/features/resumes/ResumeCreateDialog.tsx`
- Modify: `frontend/src/features/resumes/ResumeCreateDialog.test.tsx`
- Modify: `frontend/src/features/resumes/resumeWorkspace.css`

`ResumeGuidedSetup.test.tsx` is an explicitly justified additional focused
test file: it keeps factual-payload assertions out of Dialog navigation tests.

**Interfaces:**

- Consumes: Task 1 catalogues/utilities, Task 2 `CreateResumeInput`, existing
  `DraftSkill`, and native input/datalist/checkbox semantics.
- Produces:

```ts
export interface ResumeSkillPickerProps {
  value: readonly DraftSkill[];
  suggestedKeywords?: readonly string[];
  disabled?: boolean;
  onChange(value: DraftSkill[]): void;
}

export interface ResumeGuidedSetupProps {
  disabled?: boolean;
  onBack(): void;
  onSubmit(input: CreateResumeInput): Promise<void>;
}
```

The Skill Picker never mutates `value`; Apply emits the merged canonical
group shape. Suggested checkboxes initialize unchecked and are not reset when
the role changes.

- [x] **Step 6.1: Write Skill Picker RED tests**

Assert labelled search filters values while retaining category headings with
matches; native checkboxes work with keyboard; suggested keywords are
unchecked; Apply adds only checked/custom values; custom skill and custom
group are accepted; Remove is explicit; duplicate casing preserves first
visible spelling; existing `clientKey`, optional `id`, group order, and
unrelated keywords survive.

Change `suggestedKeywords` after a selection and assert it neither adds new
skills nor removes the user's prior choice.

- [x] **Step 6.2: Write Guided Setup RED tests**

Assert fields and defaults:

- title is required, trimmed, 1–120;
- target role is editable with the bounded datalist;
- experience level is guidance-only and never appears in submitted content;
- suggested sections are read-only text, not form controls or entities;
- role suggestions initialize unchecked;
- `Use target role as Resume headline` initializes unchecked; and
- custom role always permits full Skill Picker use.

Submit with two checked skills and headline unchecked. Assert every canonical
section array except Skills is empty, no headline is present, and no
unselected skill appears. Submit again with explicit headline opt-in and
assert the exact editable target role becomes the headline. Assert one
`onSubmit` call and no direct provider/import call.

- [x] **Step 6.3: Run RED**

Run:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/ResumeSkillPicker.test.tsx src/features/resumes/ResumeGuidedSetup.test.tsx src/features/resumes/ResumeCreateDialog.test.tsx
```

Expected: FAIL because both focused components do not exist.

- [x] **Step 6.4: Implement Skill Picker**

Render one search input, category `<fieldset>` groups with `<legend>`, native
checkboxes, custom skill input, editable custom group input with category
datalist, Apply, per-keyword Remove, and an `aria-live="polite"` status.
Call Task 1 `mergeSkillSelections` only on Apply. Enforce existing 120-character
group/keyword bounds in the UI; server canonical validation remains final.

- [x] **Step 6.5: Implement Guided Setup**

Use an editable target-role `input` linked to a `datalist`, a native select or
radio group for Student/Entry level/Mid level/Senior level guidance, readonly
suggested-section copy, the Skill Picker, and an unchecked headline checkbox.
Role change calls only `suggestedSkillsForRole`; it does not mutate Skills.

On submit, call:

```ts
await onSubmit({
  title: title.trim(),
  content: buildGuidedResumeContent({
    targetRole,
    useTargetRoleAsHeadline,
    skills,
  }),
});
```

Dialog calls `createResume(input, signal)` once and navigates only after the
validated workspace returns. There is no blank-first creation.

- [x] **Step 6.6: Run GREEN and payload regression**

Run:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/resumeGuidance.test.ts src/features/resumes/ResumeSkillPicker.test.tsx src/features/resumes/ResumeGuidedSetup.test.tsx src/features/resumes/ResumeCreateDialog.test.tsx src/features/resumes/resumeApi.test.ts
```

Expected: PASS; tests prove opt-in Skills/headline and exactly one canonical
create request.

- [x] **Step 6.7: Cleanup check**

Confirm no experience level or suggested-section field was added to
`ResumeContentInput`, no blank entity was created, no fuzzy role matching or
AI call exists, and all custom paths remain editable.

### Task 7: Resume editor deterministic helpers

**Files:**

- Create: `frontend/src/features/resumes/ResumeAchievementBuilder.tsx`
- Create: `frontend/src/features/resumes/ResumeAchievementBuilder.test.tsx`
- Modify: `frontend/src/features/resumes/ResumeEditor.tsx`
- Modify: `frontend/src/features/resumes/ResumeEditor.test.tsx`
- Modify: `frontend/src/features/resumes/ResumeWorkspace.tsx`
- Modify: `frontend/src/features/resumes/ResumeWorkspace.test.tsx`
- Modify: `frontend/src/features/resumes/resumeWorkspace.css`
- Reuse: `frontend/src/features/resumes/ResumeSkillPicker.tsx`

**Interfaces:**

- Consumes: `ResumeDraft`, `createDraftEntity`, `resumeFieldId`, Task 1
  catalogues/composer, Task 6 Skill Picker, existing `onChange` mutation
  boundary, disclosure state, and validation focus requests.
- Produces:

```ts
export interface ResumeAchievementBuilderProps {
  disabled?: boolean;
  onAdd(text: string): void;
}

export function ResumeAchievementBuilder(
  props: ResumeAchievementBuilderProps,
): JSX.Element;
```

Editor suggestions change only draft state. Workspace save/version behavior
is unchanged.

- [x] **Step 7.1: Write Achievement Builder RED tests**

Assert the helper starts collapsed; Action and Work are required; Technology
and Result are optional; Preview follows Task 1 composition until the user
edits it; edited Preview is preserved; Add calls `onAdd` with exactly the
preview once; blank/whitespace preview cannot insert; successful insertion
clears local fields; and no AI/API call occurs.

Use the approved exact preview:

```text
Built a job tracking dashboard using React and Node.js — used by 25 testers.
```

- [x] **Step 7.2: Write editor-helper RED tests**

Assert:

- Experience job title remains editable and links to the local title datalist;
- the existing Role-aware assessment target-role input remains editable and
  links to the same local title datalist without changing analysis submission;
- an action starter affects only an empty bullet, inserts only `Starter + " "`,
  focuses its current textarea, and never overwrites non-empty text;
- Achievement Add appends one new `DraftBullet` to that Experience entry;
- Education qualification remains editable with approved datalist values;
- Language proficiency remains editable with bounded datalist values and an
  unknown existing value survives render/change cycles;
- Interests remain editable with local suggestions and no role coupling;
- Certifications and all date inputs are unchanged/manual;
- Skill Picker Apply updates current canonical DraftSkill groups without
  replacing the compact manual editor; and
- disabled/version-preview states cannot mutate content.

Retain regression assertions for nine navigation links, disclosure opening,
validation reveal/focus, order controls, stable `clientKey`, spellcheck, and
preview wrapping.

- [x] **Step 7.3: Run RED**

Run:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/ResumeAchievementBuilder.test.tsx src/features/resumes/ResumeEditor.test.tsx src/features/resumes/ResumeWorkspace.test.tsx
```

Expected: FAIL because the helper and catalogue-backed controls do not exist.

- [x] **Step 7.4: Implement the focused builder**

Use a native `<details>` disclosure. Maintain temporary Action, Work,
Technology, Result, Preview, and `previewEdited` state. Recompute Preview from
`composeAchievement` only while `previewEdited` is false. Add passes the exact
editable preview to the parent; the parent appends
`createDraftEntity({ text })` to the current Experience bullets.

- [x] **Step 7.5: Add surgical editor helpers**

Add shared datalists once near the editor root with stable IDs. Keep free-form
text inputs for title, qualification, proficiency, and interests. Render
starters beside an empty bullet only; after mutating, focus
`document.getElementById(resumeFieldId(path))`. Mount one collapsed builder per
Experience entry. Mount Skill Picker as an optional disclosure adjacent to,
not instead of, the existing compact Skills group editor.

Do not alter dates, `isCurrent`, section IDs, save code, history, print, or
normal validation behavior.

- [x] **Step 7.6: Run GREEN and Phase 19A-1 regressions**

Run:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/resumeGuidance.test.ts src/features/resumes/ResumeSkillPicker.test.tsx src/features/resumes/ResumeAchievementBuilder.test.tsx src/features/resumes/ResumeEditor.test.tsx src/features/resumes/ResumeWorkspace.test.tsx src/features/resumes/ResumePreview.test.tsx
```

Expected: PASS, including existing disclosure, focus, Skills, preview, history,
and print assertions.

- [x] **Step 7.7: Cleanup check**

Confirm all helpers are deterministic and local, unknown language/date values
survive, certification remains manual, native spellcheck behavior remains,
and no Level 3 Gemini action was added.

### Task 8: Backend staged PDF import-review contract

**Files:**

- Modify: `backend/src/modules/resume-analysis/resumeAnalysis.routes.ts`
- Modify: `backend/src/modules/resume-analysis/resumeAnalysis.controller.ts`
- Modify: `backend/src/modules/resume-analysis/resumeAnalysis.schemas.ts`
- Modify: `backend/src/modules/resume-analysis/resumeAnalysis.service.ts`
- Modify: `backend/src/modules/resume-analysis/resumeAnalysis.jobs.ts`
- Modify: `backend/src/jobs/job.queue.ts`
- Modify: `backend/src/jobs/job.worker.ts`
- Modify: `backend/src/tests/integration/resumePdfImport.integration.test.ts`
- Modify: `backend/src/tests/integration/resumeJobIdempotency.integration.test.ts`
- Modify: `backend/src/tests/integration/jobResponse.integration.test.ts`
- Modify: `backend/src/tests/integration/crossUserAccess.integration.test.ts`
- Modify: `backend/src/tests/integration/jobExecutionFence.integration.test.ts`
- Reuse: `backend/src/tests/integration/resumeCreation.integration.test.ts`

The job-fence test is the one additional modified test outside the initial
audit list. It is the narrowest existing place to prove that job-specific
expiry survives fenced completion without weakening every other job's normal
retention.

**Interfaces:**

- Consumes: `parseResumeText`, `normalizeResumeContent`, `createResume`,
  `getResumeWorkspace`, `ResumeVersionModel`'s unique
  `{ userId, sourceAssetId }` import index, `promoteOwnedAsset`,
  `JobRecordModel`, `enqueueJob`, `completeJob`, authentication, validation,
  request IDs, and existing ownership-safe 404 behavior.
- Produces:

```ts
export const importJobIdParamsSchema = z.object({
  jobId: z.string().regex(/^[a-f\d]{24}$/i),
});

export interface ImportReviewResult {
  kind: "import-review";
  content: ResumeContent;
}

export interface ImportAdoptedResult {
  kind: "import-adopted";
  resumeId: string;
  versionId: string;
  versionNumber: number;
}

export interface ConfirmedResumeImportIdentity {
  resumeId: string;
  versionId: string;
  versionNumber: number;
}

export async function prepareResumePdfImport(input: {
  userId: string;
  assetId: string;
  jobId?: string;
  execution?: AiJobExecutionLifecycle;
}): Promise<ImportReviewResult>;

export async function confirmResumePdfImport(input: {
  userId: string;
  jobId: string;
}): Promise<ConfirmedResumeImportIdentity>;

export async function completeJob(
  execution: JobExecutionIdentity,
  result: unknown,
  expiresAt?: Date,
): Promise<void>;
```

Extend `enqueueJob` input with `expiresAt?: Date`. The import controller passes
the newly created temporary Asset's exact `expiresAt`; the worker passes the
claimed `job.expiresAt` to `completeJob`. `completeJob` uses that value when
present and otherwise retains the existing
`completedAt + JOB_RETENTION_DAYS` behavior.

`confirmResumePdfImport` is an internal backend service boundary. It may
resolve or create the winning Resume/Version documents while promoting the
Asset, reconciling source-Asset idempotency, and scrubbing the job result, but
its public contract is the small winning identity above. The controller then
loads the existing standard Resume workspace with `getResumeWorkspace` and
returns `{ success: true, data: workspace }`. The frontend continues to expose
`confirmResumePdfImport(jobId, signal): Promise<ResumeWorkspaceData>` and
validates that public response with `parseResumeWorkspace`. No new public
Resume response shape is introduced.

- [x] **Step 8.1: Write successful-parse RED tests**

Adapt `resumePdfImport.integration.test.ts` so a representative parsed PDF
returns `kind: "import-review"` with canonical stable IDs. Assert immediately
after preparation/completion:

- `ResumeModel.countDocuments({ userId }) === 0`;
- `ResumeVersionModel.countDocuments({ userId }) === 0`;
- the owned Job is completed with canonical candidate content;
- the source Asset remains `temporary` and linked to no Resume; and
- invalid structured output leaves zero Resume/Version records.

Keep the current synthetic PDF and mocked Gemini response. Never place real
Resume content or a credential in fixtures/log output.

- [x] **Step 8.2: Write retention RED tests**

In upload/idempotency coverage, capture the Asset's `expiresAt` and assert the
enqueued job has the same deadline. In `jobExecutionFence.integration.test.ts`,
enqueue/claim a job with a fixed earlier expiry, call the new `completeJob`
signature, and assert completion preserves that exact value. Also assert a
normal job without a supplied deadline still uses the configured default.

In `jobResponse.integration.test.ts`, set an owned import-review job's
`expiresAt` in the past and assert GET `/api/v1/jobs/:jobId` returns the same
safe 404 as a missing/foreign job even before the TTL monitor removes it.
Assert the `jobs_retention_ttl` index remains unchanged.

- [x] **Step 8.3: Write confirmation/ownership/idempotency RED tests**

Add route tests for
`POST /api/v1/resume-analyses/import-pdf/:jobId/confirm`:

- User B cannot confirm or inspect User A's candidate and receives the current
  ownership-safe response;
- queued, processing, failed, cancelled, wrong-type, malformed-result,
  missing-asset, and expired jobs cannot confirm;
- a valid candidate creates exactly one owned Resume and Version 1 in the
  existing `createResume` transaction;
- source is `pdf-import`, `sourceAssetId` is present, canonical content is
  revalidated, and the Asset becomes active/linkable only after adoption;
- two concurrent confirmations reconcile the unique-source winner and create
  no Version 2 or second Resume;
- sequential repeated confirmation returns the same owned Resume; and
- successful or reconciled confirmation changes the job result to exactly
  `{ kind: "import-adopted", resumeId, versionId, versionNumber }`, with no
  `content` key.

Assert a simulated failure before `createResume` writes leaves zero records;
if Asset promotion fails after the atomic create, a repeated confirmation
finds the source-asset winner, promotes it, scrubs the result, and returns it.

- [x] **Step 8.4: Run backend RED**

Run:

```bash
npm run test --workspace @career-learning-hub/api -- src/tests/integration/resumePdfImport.integration.test.ts src/tests/integration/resumeJobIdempotency.integration.test.ts src/tests/integration/jobResponse.integration.test.ts src/tests/integration/crossUserAccess.integration.test.ts src/tests/integration/jobExecutionFence.integration.test.ts
```

Expected: FAIL because parsing still persists immediately, the confirm route
does not exist, successful jobs overwrite the deadline, and the public job
read does not filter expired records.

- [x] **Step 8.5: Implement bounded job expiry using existing storage**

Add `expiresAt?: Date` to `enqueueJob` and persisted creation values. In the
worker call:

```ts
await completeJob(execution, result, job.expiresAt);
```

In `completeJob`, choose:

```ts
const terminalExpiresAt = expiresAt ?? new Date(
  completedAt.getTime() + env.JOB_RETENTION_DAYS * 24 * 60 * 60 * 1_000,
);
```

Filter `getOwnedJob` with:

```ts
$or: [
  { expiresAt: { $exists: false } },
  { expiresAt: { $gt: new Date() } },
]
```

In `importPdfController`, require the temporary Asset expiry and pass it to
`enqueueJob`. Existing idempotent upload winners keep their original Asset/job
deadline. Do not add a field or index to `job.model.ts`.

- [x] **Step 8.6: Stage parsing without persistence**

Replace the immediate-persistence function with `prepareResumePdfImport`.
Keep owned Asset checks, PDF read/extraction, Gemini prompt/model, strict
structured output, canonical normalization, job phases, cancellation, and
fencing. Return only:

```ts
{ kind: "import-review", content }
```

Update the registered `resume.import-pdf` handler to return this result. Do
not call `createResume` or `promoteOwnedAsset` in the worker path.

- [x] **Step 8.7: Implement the owned confirm endpoint**

Add the exact route after `/import-pdf` and before parameter-wider routes:

```ts
resumeAnalysisRouter.post(
  "/import-pdf/:jobId/confirm",
  resumeImportRateLimiter,
  validate({ params: importJobIdParamsSchema }),
  asyncHandler(confirmImportPdfController),
);
```

The service must:

1. query the authenticated user's completed, unexpired `resume.import-pdf`
   job;
2. if result is `import-adopted`, return its winning identity;
3. validate payload `assetId` and title and re-run `normalizeResumeContent` on
   `import-review.content`;
4. find an existing owned `pdf-import` version by source Asset before writing;
5. otherwise call existing `createResume` with source `pdf-import`, source
   Asset ID, canonical content, and the stored title;
6. on duplicate-key race, load the winning owned source-asset version;
7. promote/link the private Asset to the winning Resume; and
8. use an ownership/state-guarded `findOneAndUpdate` to replace the candidate
   result with `import-adopted`, then return the winning identity.

The controller uses that identity's `resumeId` with existing
`getResumeWorkspace` and returns the standard Resume workspace envelope. The
service and controller do not need to share the same internal return type.

Do not create a Version 2, second schema, candidate collection, discard route,
or new transaction abstraction. `createResume` remains the atomic
Resume-plus-Version-1 boundary. The source Asset unique index is the
concurrent idempotency boundary.

- [x] **Step 8.8: Run GREEN and backend regressions**

Run:

```bash
npm run test --workspace @career-learning-hub/api -- src/tests/integration/resumeCreation.integration.test.ts src/tests/integration/resumePdfImport.integration.test.ts src/tests/integration/resumeJobIdempotency.integration.test.ts src/tests/integration/jobResponse.integration.test.ts src/tests/integration/crossUserAccess.integration.test.ts src/tests/integration/jobExecutionFence.integration.test.ts src/tests/integration/resumeVersion.index.test.ts
```

Expected: PASS with zero records before confirmation, exactly one Version 1
after confirmation, bounded expiry, ownership-safe access, and scrubbed
candidate result.

- [x] **Step 8.9: Cleanup and privacy check**

Confirm job/Asset bodies and candidate content are never logged; confirmed
result has no Resume text; expired job reads and confirms are unavailable;
generic jobs retain current default expiry; temporary Asset cleanup remains
the existing hourly job; no model/index/provider prompt changed; and no raw
personal fixture appears in the diff.

### Task 9: Frontend Import Review and confirmation

**Files:**

- Modify: `frontend/src/features/resumes/ResumeCreateDialog.tsx`
- Modify: `frontend/src/features/resumes/resumeApi.ts`
- Modify: `frontend/src/features/resumes/resumeContracts.ts`
- Modify: `frontend/src/features/resumes/types.ts`
- Modify: `frontend/src/features/resumes/resumeApi.test.ts`
- Modify: `frontend/src/features/resumes/resumeContracts.test.ts`
- Modify: `frontend/src/features/resumes/ResumeCreateDialog.test.tsx`
- Modify: `frontend/src/features/resumes/ResumeWorkspace.test.tsx`

**Interfaces:**

- Consumes: Task 2 `parseResumeContent`, Task 5 upload, backend Task 8 result
  union/confirm endpoint, `resumeContentToDraft`, `ResumePreview`, current job
  polling/resilience, `parseResumeWorkspace`, and shared `ApiError`.
- Produces:

```ts
export type ResumeImportResult =
  | { kind: "import-review"; content: ResumeContent }
  | {
      kind: "import-adopted";
      resumeId: string;
      versionId: string;
      versionNumber: number;
    };

export async function confirmResumePdfImport(
  jobId: string,
  signal?: AbortSignal,
): Promise<ResumeWorkspaceData>;
```

`ResumeJob.result` remains a discriminated union with the existing analysis
result. Completed import jobs parse only the two Task 8 import kinds.

- [x] **Step 9.1: Write contract/API RED tests**

Assert `parseJob` accepts canonical `import-review` content and
`import-adopted` IDs, rejects unknown keys/kinds/malformed canonical content,
and leaves analysis-job parsing unchanged. Assert `confirmResumePdfImport`
POSTs to the exact owned endpoint with no candidate body, validates the
standard workspace, propagates cancellation, and retains safe request IDs on
error.

- [x] **Step 9.2: Write Import Review UI RED tests**

After polling returns `import-review`, assert the Dialog does not navigate and
shows read-only deterministic evidence derived from content:

```text
Basics
Full name extracted
Email extracted
Skills
12 entries extracted
Experience
2 entries extracted
Education
Not found
```

Use singular `1 entry extracted` and plural otherwise. Missing Basics fields
say only `Full name not found` or `Email not found`. Do not render confidence,
certainty, `needs review`, or Gemini quality claims.

Assert the optional Resume Preview is collapsed/read-only; there is no input
for editing candidate content. Back returns to Import without calling confirm;
close calls neither confirm nor create; Confirm sends one request while busy,
keeps the review on failure, shows request ID, and navigates only after a
validated success. An `import-adopted` poll/reconciliation response fetches or
confirms safely without creating a duplicate.

- [x] **Step 9.3: Run RED**

Run:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/resumeContracts.test.ts src/features/resumes/resumeApi.test.ts src/features/resumes/ResumeCreateDialog.test.tsx src/features/resumes/ResumeWorkspace.test.tsx
```

Expected: FAIL because completed import parsing still expects `kind: "import"`
and the list flow automatically navigates.

- [x] **Step 9.4: Implement exact frontend contracts**

Export/reuse Task 2 canonical content parsing. Parse exact keys for both import
result kinds. Add `confirmResumePdfImport` with shared authentication and
signal handling, then `parseResumeWorkspace`. Do not send candidate content
back from the browser; the server confirms its owned job result.

- [x] **Step 9.5: Implement the read-only review state**

When polling reaches `import-review`, store the validated result and switch the
Dialog method state to review. Derive counts directly from canonical arrays
and Basics presence. Convert content with `resumeContentToDraft` only for the
existing `ResumePreview`; do not build a form or second schema.

Guard confirmation with `confirmBusy`. On success call `onCreated(workspace)`;
on failure retain candidate state and render the safe error. Back returns to
the upload panel with no adoption. Close drops only local state; backend TTL
owns abandoned private candidate expiry.

- [x] **Step 9.6: Run GREEN and import regressions**

Run:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/resumeContracts.test.ts src/features/resumes/resumeApi.test.ts src/features/resumes/ResumePdfUpload.test.tsx src/features/resumes/ResumeCreateDialog.test.tsx src/features/resumes/ResumeListPage.test.tsx src/features/resumes/ResumeWorkspace.test.tsx src/features/resumes/resumePolling.test.ts
```

Expected: PASS; parsing completes at review, Back/close creates nothing, and
confirmation navigates once.

- [x] **Step 9.7: Cleanup check**

Confirm the frontend holds only the validated mounted candidate, persists
nothing in browser storage, logs no content, invents no confidence metadata,
does not expose Asset keys, and contains no second editable Resume form.

### Task 10: Integrated automated verification and human QA handoff

**Files:**

- Modify only if useful to preserve the future regression contract:
  `tests/browser/specs/resume.spec.cjs`
- Update implementation-closeout documentation only after all automated gates
  and the later human approval token; do not activate Phase 19A-3 or 19A-4.

**Interfaces:**

- Consumes: all Phase 19A-2 production/test changes and repository scripts.
- Produces: deterministic command evidence, a clean unstaged review diff, and
  a human Chrome checklist. It does not produce a browser run, commit, or
  phase-completion claim.

- [x] **Step 10.1: Run focused Phase 19A-2 frontend tests**

Run:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/resumeGuidance.test.ts src/features/resumes/ResumeCreateDialog.test.tsx src/features/resumes/ResumeGuidedSetup.test.tsx src/features/resumes/ResumeSkillPicker.test.tsx src/features/resumes/ResumePdfUpload.test.tsx src/features/resumes/ResumeAchievementBuilder.test.tsx
```

Expected: PASS.

- [x] **Step 10.2: Run affected Resume and router frontend tests**

Run:

```bash
npm run test --workspace @career-learning-hub/web -- src/features/resumes/ResumeListPage.test.tsx src/features/resumes/ResumeEditor.test.tsx src/features/resumes/ResumeWorkspace.test.tsx src/features/resumes/ResumePreview.test.tsx src/features/resumes/resumeApi.test.ts src/features/resumes/resumeContracts.test.ts src/features/resumes/resumeDraft.test.ts src/features/resumes/resumePolling.test.ts src/routing/router.test.tsx src/AppShell.test.tsx src/features/dashboard/MainDashboard.test.tsx
```

Expected: PASS with Phase 19A-1 regressions intact.

- [x] **Step 10.3: Run frontend typecheck and complete suite**

Run:

```bash
npm run typecheck --workspace @career-learning-hub/web
npm run test --workspace @career-learning-hub/web
```

Expected: both PASS.

- [x] **Step 10.4: Run focused backend Resume/import tests**

Run:

```bash
npm run test --workspace @career-learning-hub/api -- src/tests/integration/resumeCreation.integration.test.ts src/tests/integration/resumePdfImport.integration.test.ts src/tests/integration/resumeJobIdempotency.integration.test.ts src/tests/integration/jobResponse.integration.test.ts src/tests/integration/crossUserAccess.integration.test.ts src/tests/integration/jobExecutionFence.integration.test.ts src/tests/integration/resumeVersion.index.test.ts
```

Expected: PASS.

- [x] **Step 10.5: Run broader backend gates**

Run:

```bash
npm run test:unit
npm run test:integration
npm run test:security
npm run typecheck --workspace @career-learning-hub/api
npm run typecheck:test --workspace @career-learning-hub/api
```

Expected: all PASS. If one root failure repeats after three code-changing
attempts, stop with the exact command/error and preserve the diff.

- [x] **Step 10.6: Run root typecheck and production builds**

Run:

```bash
npm run typecheck
npm run build
```

Expected: PASS for all current workspaces.

- [x] **Step 10.7: Maintain browser source without launching a browser**

If `tests/browser/specs/resume.spec.cjs` changed, update only its future flow
contract for chooser/guided/review states, then run:

```bash
node --check tests/browser/specs/resume.spec.cjs
```

Expected: exit 0. Do not run Playwright or any browser campaign during normal
implementation.

- [x] **Step 10.8: Repository hygiene and sensitive-data review**

Run:

```bash
git diff --check
git status --short
git diff --stat
git diff --cached --name-only
```

Expected: `git diff --check` exits 0; only approved Phase 19A-2 paths are
unstaged; cached output is empty. Inspect changed files for secrets, tokens,
raw Resume content, private storage keys, generated outputs, and unrelated
edits. Remove only synthetic artifacts created by this implementation after
verifying their exact paths; do not delete operator files.

- [x] **Step 10.9: Prepare human Chrome QA handoff**

Do not start a browser or service. Report the operator commands:

```bash
cd "/Users/prabhathmalinda/Documents/Projects/Career Learning Hub"
npm run dev:backend
```

```bash
cd "/Users/prabhathmalinda/Documents/Projects/Career Learning Hub"
npm run dev:frontend
```

The existing backend owns the worker; do not invent a third command.

Provide this concise manual checklist:

- collection empty/one/two/several, capped cards, normal-flow status, visible
  Open Resume, Pager absent for one page and usable for multiple pages;
- list and `/resumes?action=create` chooser, three methods, Back/close/focus;
- Guided target/custom role, guidance level/sections, unchecked suggested
  skills/headline, picker custom group/skill, one Version 1 result;
- editor title/Skills/starters/Achievement/education/language/interests while
  nine disclosures, validation, preview, history, and print remain sound;
- PDF choose/name/size/Replace/Remove/drop/invalid/provider copy;
- one safe explicit Gemini import where practical, deterministic read-only
  review, Back without adoption, Confirm and editor navigation; and
- keyboard Tab/Shift+Tab/Enter/Space/Escape plus 1440×900, 1024×768,
  768×1024, 390×844, 320×720, and actual Chrome 200% with no overflow,
  clipping, unreachable control, or hidden focus.

Do not require repeated Gemini calls for screenshots. Human Chrome is the
final visual authority.

- [x] **Step 10.10: Hold at the visual gate**

Report Phase 19A-2 as implemented/automated-green but awaiting human visual
approval. Do not mark complete and do not stage/commit until the operator
supplies:

```text
PHASE_19A2_RESUME_COLLECTION_CREATION_GUIDED_ENTRY_VISUAL_APPROVED
```

## Exact test file boundary

### New test files

- `frontend/src/features/resumes/resumeGuidance.test.ts`
- `frontend/src/features/resumes/ResumeCreateDialog.test.tsx`
- `frontend/src/features/resumes/ResumeGuidedSetup.test.tsx`
- `frontend/src/features/resumes/ResumeSkillPicker.test.tsx`
- `frontend/src/features/resumes/ResumePdfUpload.test.tsx`
- `frontend/src/features/resumes/ResumeAchievementBuilder.test.tsx`
- `backend/src/tests/integration/resumeCreation.integration.test.ts`

### Modified test files

- `frontend/src/features/resumes/ResumeListPage.test.tsx`
- `frontend/src/features/resumes/ResumeEditor.test.tsx`
- `frontend/src/features/resumes/ResumeWorkspace.test.tsx`
- `frontend/src/features/resumes/resumeApi.test.ts`
- `frontend/src/features/resumes/resumeContracts.test.ts`
- `frontend/src/routing/router.test.tsx`
- `backend/src/tests/integration/resumePdfImport.integration.test.ts`
- `backend/src/tests/integration/resumeJobIdempotency.integration.test.ts`
- `backend/src/tests/integration/jobResponse.integration.test.ts`
- `backend/src/tests/integration/crossUserAccess.integration.test.ts`
- `backend/src/tests/integration/jobExecutionFence.integration.test.ts`
- `tests/browser/specs/resume.spec.cjs` only if maintaining its future
  non-executed regression contract adds value

## Plan self-review result

- All approved collection, card, pagination, unified creation, Guided Setup,
  local catalogue, opt-in role/Skill, editor helper, upload, and import-review
  requirements map to Tasks 1–9.
- Phase 19A-3 save/recovery/export and Phase 19A-4 photo work are absent.
- Exact interfaces use `SkillSelection`, `AchievementParts`,
  `CreateResumeInput`, `ResumeImportResult`, `prepareResumePdfImport`,
  `confirmResumePdfImport`, and `importJobIdParamsSchema` consistently.
- Every production task has a focused failing test, exact RED command, stated
  failure reason, minimum implementation, exact GREEN command, regression
  command, and cleanup check.
- Successful parsing creates zero Resume/Version records; confirmation uses
  existing atomic Version 1 creation and source-asset uniqueness; repeated or
  concurrent confirmation returns the winner.
- The temporary Asset's exact approximately 24-hour expiry is carried to the
  job. Expired reads/confirms are unavailable, Mongo TTL removes the job, and
  confirmation replaces full candidate content with small adopted IDs.
- Suggestions initialize unchecked, custom input remains available, dates
  remain free-form, certification remains manual, and deterministic behavior
  makes no Gemini call.
- Ordinary implementation includes no browser use. Automated green precedes
  human Chrome QA; Codex browser is reserved only for a specifically explained
  unresolved browser defect.
- Git lifecycle remains operator-owned and the visual token remains the final
  pre-commit gate.

## Execution handoff

After the operator approves this plan, execute Task 1 first under the accepted
design authority and continue task-by-task through automated verification.
Do not stage or commit. Stop after Task 10 at the human Chrome visual approval
gate.
