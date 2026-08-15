# Resume Import + Skills Refinement Implementation Plan

> **Execution model:** ChatGPT implements through the GitHub connector on `feature/resume-import-skills-refinement`; Codex is not used. Tests are committed before their corresponding production changes. Runtime RED/GREEN evidence comes from the user's local verification because the GitHub connector cannot execute the repository.

**Goal:** Replace oversized Resume Skills capsules with clean wrapping rows and let PDF import optionally reuse a user-selected eligible first-page embedded image as the imported Resume's existing Candidate Photo.

**Architecture:** Keep canonical Resume content unchanged. Track A is presentation-only. Track B adds a best-effort first-page image pass only after canonical Resume text parsing succeeds, stages at most three private temporary `resume-photo` assets bound to the exact import Job/source PDF, persists only their Asset IDs in the import-review result, and atomically finalizes the winning optional photo selection with the existing Resume/Candidate Photo ownership model.

**Tech Stack:** React + TypeScript + Vite + Vitest + Testing Library; Express + TypeScript + Mongoose + Zod + Vitest; existing `pdf-parse@^2.4.5`; existing private Asset storage and Candidate Photo validation.

## Global Constraints

- Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.
- Base: merged `main @ a0543f735496215418eb16c6151e68446025fd29` (PR #19 included).
- Branch: `feature/resume-import-skills-refinement`.
- Do not change Gemini routing/prompts/credentials/provider selection and never send candidate-image bytes to Gemini.
- Do not add OCR, face detection/recognition, image classification, cropping, a PDF/image package, storage system, worker, or Resume photo schema.
- First-page embedded images only: `getImage({ partial: [1], imageThreshold: 80, imageDataUrl: false, imageBuffer: true })`.
- Keep at most 3 **eligible** photo candidates; default selection is always `Do not import a photo`.
- Candidate assets use the existing 15-minute Candidate Photo staging lifetime and existing `resume-photo` validation.
- Candidate identity is bound to user + import Job ID + source PDF Asset ID.
- Raw image bytes/data URLs never enter the MongoDB Job result.
- Existing text-only PDF import, strict Resume parser, source-PDF idempotency, manual Candidate Photo, Resume versioning, and deletion behavior remain intact.
- Preserve the existing frontend `confirmResumePdfImport(jobId, signal)` call shape. Add photo selection only as an optional **third** parameter so the existing auto-adopted polling path cannot accidentally pass an `AbortSignal` as an Asset ID.
- No deployment, merge, or branch deletion is authorized by implementation approval.
- User terminal work: none during GitHub-side implementation; user runs verification afterward.
- Browser: user performs local browser QA only after automated verification is green.

---

## File Boundary

### Existing files expected to change

**Skills**
- `frontend/src/features/resumes/resumeWorkspace.css`
- `frontend/src/features/resumes/ResumePreview.test.tsx`

**Backend import/photo path**
- `backend/src/modules/resume-analysis/pdf.service.ts`
- `backend/src/modules/resume-analysis/resumeAnalysis.service.ts`
- `backend/src/modules/resume-analysis/resumeAnalysis.schemas.ts`
- `backend/src/modules/resume-analysis/resumeAnalysis.controller.ts`
- `backend/src/modules/resume-analysis/resumeAnalysis.routes.ts`
- `backend/src/modules/resumes/resumePhoto.service.ts`
- `backend/src/tests/integration/resumePdfImport.integration.test.ts`

**Frontend import contract/UI**
- `frontend/src/features/resumes/types.ts`
- `frontend/src/features/resumes/resumeContracts.ts`
- `frontend/src/features/resumes/resumeApi.ts`
- `frontend/src/features/resumes/ResumeCreateDialog.tsx`
- `frontend/src/features/resumes/ResumeCreateDialog.test.tsx`
- `frontend/src/features/resumes/resumeWorkspace.css`

### New focused files

- `backend/src/tests/unit/resumePdfImageExtraction.test.ts`
- `frontend/src/features/resumes/ResumeImportPhotoChoices.tsx`
- `frontend/src/features/resumes/ResumeImportPhotoChoices.test.tsx`

### Files that should not change

- package/lock files;
- `.env*`, deployment, migration, provider/routing files;
- Resume/Mongo schemas unless a proven blocker requires explicit user re-approval;
- Learning or Interview modules.

---

### Task 1: Clean Skills presentation

**Files:**
- Test: `frontend/src/features/resumes/ResumePreview.test.tsx`
- Modify: `frontend/src/features/resumes/resumeWorkspace.css`

**Consumes:** existing `.resume-paper-skills` `<dl>` with `<dt>/<dd>` from `ResumePreview.tsx`.

**Produces:** same semantic markup, no capsule borders, natural wrapping shared by screen and print.

- [ ] **1.1 Add failing test expectations first**

Extend the existing long-skills test:

```ts
const skillGroupRule = resumeWorkspaceCss.match(
  /\.resume-paper-skills > div\s*\{([^}]*)\}/,
)?.[1];

expect(skillGroupRule).toContain("display: flex;");
expect(skillGroupRule).toContain("flex-wrap: wrap;");
expect(skillGroupRule).toContain("min-width: 0;");
expect(skillGroupRule).not.toContain("border-radius: 999px;");
expect(skillGroupRule).not.toMatch(/border:\s*1px/);
expect(skills?.textContent).toContain("Cloud Infrastructure Automation");
```

Expected pre-implementation failure: the current rule still has a one-pixel border and `border-radius: 999px`.

- [ ] **1.2 Implement only the shared CSS treatment**

```css
.resume-paper-skills {
  display: grid;
  gap: 5px;
}

.resume-paper-skills > div {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px 5px;
  padding: 0;
}

.resume-paper-skills dt {
  flex: 0 0 auto;
  font-weight: 800;
  overflow-wrap: normal;
  word-break: normal;
}

.resume-paper-skills dd {
  min-width: 0;
  flex: 1 1 220px;
  margin: 0;
  overflow-wrap: anywhere;
  word-break: normal;
}
```

Do not modify skill data/editing or create replacement chip styling.

- [ ] **1.3 Diff checkpoint:** only the preview test and shared CSS should change.

---

### Task 2: Add best-effort first-page PDF image extraction

**Files:**
- Create: `backend/src/tests/unit/resumePdfImageExtraction.test.ts`
- Modify: `backend/src/modules/resume-analysis/pdf.service.ts`

**Produces:**

```ts
export type ExtractedPdfImageCandidate = {
  buffer: Buffer;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  width: number;
  height: number;
};

export async function extractFirstPagePdfImages(
  buffer: Buffer,
): Promise<ExtractedPdfImageCandidate[]>;
```

- [ ] **2.1 Add tests before implementation**

Mock `PDFParse` and require:

```ts
expect(getImageMock).toHaveBeenCalledWith({
  partial: [1],
  imageThreshold: 80,
  imageDataUrl: false,
  imageBuffer: true,
});
```

Cover PNG/JPEG/WebP signatures, unsupported-byte skipping, checksum deduplication, deterministic descending pixel-area order with stable tie order, `getImage()` failure -> `[]`, and `destroy()` in success/failure paths.

Expected failure: `extractFirstPagePdfImages` does not exist.

- [ ] **2.2 Detect MIME from bytes only** using local PNG/JPEG/WebP magic-byte checks. Do not trust PDF image metadata.

- [ ] **2.3 Implement the image pass with a separate parser lifetime**

```ts
const parser = new PDFParse({ data: new Uint8Array(buffer) });
try {
  const result = await parser.getImage({
    partial: [1],
    imageThreshold: 80,
    imageDataUrl: false,
    imageBuffer: true,
  });
  // first-page images -> Buffer + detected MIME + positive width/height
  // dedupe by SHA-256
  // stable sort by width * height descending
  return candidates;
} catch {
  return [];
} finally {
  await parser.destroy();
}
```

Do **not** slice to 3 here; the staging layer must continue past ineligible images until it has at most 3 validated Candidate Photo assets.

- [ ] **2.4 Diff checkpoint:** existing `extractPdfText()` semantics must be untouched.

---

### Task 3: Stage eligible extracted images as import-bound private Candidate Photo assets

**Files:**
- Modify: `backend/src/modules/resumes/resumePhoto.service.ts`
- Modify: `backend/src/modules/resume-analysis/resumeAnalysis.service.ts`
- Modify: `backend/src/tests/integration/resumePdfImport.integration.test.ts`

**Dependency rule:** `resumePhoto.service.ts` must **not** import types from `resume-analysis`. It consumes primitive buffer/MIME inputs so the Resume module does not depend back on Resume Analysis.

**Produces:**

```ts
export const RESUME_PHOTO_STAGING_TTL_SECONDS = 15 * 60;

export async function stageResumeImportPhotoCandidate(input: {
  userId: string;
  importJobId: string;
  sourceAssetId: string;
  buffer: Buffer;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  ordinal: number;
}): Promise<AssetDocument>;
```

and:

```ts
export interface ImportReviewResult {
  kind: "import-review";
  content: ResumeContent;
  photoCandidates?: Array<{ assetId: string }>;
}
```

- [ ] **3.1 Add integration tests first**

Mock both PDF functions:

```ts
vi.mock("../../modules/resume-analysis/pdf.service.js", () => ({
  extractPdfText: extractPdfTextMock,
  extractFirstPagePdfImages: extractPdfImagesMock,
}));
```

Prove image extraction is not called after text/Gemini failure; direct service calls without `jobId` create no unbound assets; text-only import has no candidate field; invalid Candidate Photo bytes are skipped; staging continues until at most 3 eligible assets exist; staged assets are temporary `resume-photo` with ~15-minute TTL and exact `resumeImportJobId` + `resumeImportSourceAssetId`; persisted review contains IDs only.

- [ ] **3.2 Reuse existing Candidate Photo validation/storage**

Build an in-memory `Express.Multer.File` inside `resumePhoto.service.ts`, call `createAsset({ purpose: "resume-photo", temporary: true, expiresInSeconds: RESUME_PHOTO_STAGING_TTL_SECONDS })`, then save only binding metadata. If metadata save fails, delete the staged asset best-effort and rethrow so the optional-photo caller can skip it.

- [ ] **3.3 Extract/stage only after canonical content exists**

Preserve:

```ts
const extracted = await extractPdfText(buffer);
const content = await parseResumeText(...);
```

Only then, and only with `input.jobId`, extract and stage in deterministic order until 3 successes. Omit `photoCandidates` when none are eligible.

- [ ] **3.4 Diff checkpoint:** no image bytes in Job result/logs.

---

### Task 4: Secure optional photo adoption during import confirmation

**Files:**
- Modify: `backend/src/modules/resume-analysis/resumeAnalysis.schemas.ts`
- Modify: `backend/src/modules/resume-analysis/resumeAnalysis.routes.ts`
- Modify: `backend/src/modules/resume-analysis/resumeAnalysis.controller.ts`
- Modify: `backend/src/modules/resume-analysis/resumeAnalysis.service.ts`
- Modify: `backend/src/modules/resumes/resumePhoto.service.ts`
- Modify: `backend/src/tests/integration/resumePdfImport.integration.test.ts`

**Request schema:**

```ts
export const confirmImportPdfBodySchema = z
  .object({
    selectedPhotoAssetId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  })
  .strict()
  .default({});
```

The `.default({})` preserves the existing bodyless `POST /confirm` behavior.

**Service signature:**

```ts
confirmResumePdfImport({
  userId,
  jobId,
  selectedPhotoAssetId?: string,
})
```

**Transaction-aware Resume helper:**

```ts
export async function attachStagedImportPhotoCandidate(input: {
  userId: string;
  resumeId: string;
  assetId: string;
  importJobId: string;
  sourceAssetId: string;
  session: ClientSession;
}): Promise<void>;
```

- [ ] **4.1 Add route/security/concurrency tests first**

Cover bodyless and `{}` confirmation, valid selected candidate, membership in Job candidate list, cross-user/wrong Job/wrong PDF/expired/deleted/arbitrary active photo rejection, expired non-selected candidates not blocking `{}`, repeated same selection idempotency, concurrent different selections one authoritative winner, unchanged source-PDF association, and scrubbed adopted Job result.

- [ ] **4.2 Validate request body** with `confirmImportPdfBodySchema`; controller forwards `selectedPhotoAssetId`.

- [ ] **4.3 Attach a staged candidate under the supplied Mongo session**

The helper must: load owned Resume; treat same already-attached asset as idempotent only after verifying it belongs to that Resume; reject another existing photo; require selected asset to be owner-scoped, `resume-photo`, temporary, unexpired, and bound to exact Job+source PDF; promote it, add `resumeId`, set `candidatePhotoAssetId`, set `showProfilePhoto=true`, and save asset+Resume in the same session.

- [ ] **4.4 Prevalidate selected ID before Resume winner creation**

If supplied ID is absent from the current import-review's max-3 candidate list, or the staged asset is no longer valid, fail with the existing bounded import-confirmation conflict before creating a new Resume.

- [ ] **4.5 Atomically finalize photo choice and Job result**

After current source-PDF winner creation/reuse and source-asset promotion, use one `withMongoTransaction()` to re-read the completed owner-scoped import Job; return existing identity unchanged when already adopted; otherwise revalidate the selection, attach it in-session if present, and replace Job result in the same transaction with only:

```ts
{
  kind: "import-adopted",
  resumeId,
  versionId,
  versionNumber: 1,
}
```

This is the concurrency winner boundary: a losing `none`/photo-A/photo-B request cannot mutate the Resume after another request scrubs the Job to adopted.

- [ ] **4.6 Best-effort cleanup:** delete all non-selected candidate assets captured from the winning review; TTL remains fallback and cleanup failure must not fail a successful import.

- [ ] **4.7 Diff checkpoint:** inspect ownership, binding, sessions, race behavior, and source-PDF idempotency.

---

### Task 5: Extend the strict frontend job contract and API

**Files:**
- Modify: `frontend/src/features/resumes/types.ts`
- Modify: `frontend/src/features/resumes/resumeContracts.ts`
- Modify: `frontend/src/features/resumes/resumeApi.ts`

**Types:**

```ts
export interface ResumeImportPhotoCandidate {
  assetId: string;
}

export type ResumeImportResult =
  | {
      kind: "import-review";
      content: ResumeContent;
      photoCandidates?: ResumeImportPhotoCandidate[];
    }
  | ...;
```

**Backward-compatible API signature:**

```ts
export async function confirmResumePdfImport(
  jobId: string,
  signal?: AbortSignal,
  selectedPhotoAssetId?: string,
): Promise<ResumeWorkspaceData>;
```

This preserves the existing calls `confirmResumePdfImport(jobId, controller.signal)` used by both normal confirmation and the already-adopted polling path.

Also add:

```ts
export async function fetchResumeImportPhotoCandidateSource(
  assetId: string,
  signal?: AbortSignal,
): Promise<CandidatePhotoSource>;
```

- [ ] **5.1 Add strict parser tests first:** omitted/0-3 valid candidates pass; >3, extra candidate keys, malformed/non-object IDs fail; canonical Resume strictness stays unchanged.

- [ ] **5.2 Extend only import-review parsing**

```ts
const review = exactKeys(item, ["kind", "content"], ["photoCandidates"]);
const photoCandidates = review.photoCandidates === undefined
  ? undefined
  : array(review.photoCandidates, 3, (value) => {
      const candidate = exactKeys(value, ["assetId"]);
      return { assetId: id(candidate.assetId) };
    });
```

- [ ] **5.3 Send optional selection without changing signal position**

```ts
body: selectedPhotoAssetId === undefined
  ? {}
  : { selectedPhotoAssetId }
```

- [ ] **5.4 Reuse generic private signed-asset preview**

POST `/assets/:assetId/signed-url` with `{ expiresInSeconds: 300 }`, required auth, then `parseCandidatePhotoSource(data)`. Reuse `loadCanonicalCandidatePhoto()` for client-side MIME/size/dimension checks.

---

### Task 6: Add explicit Import Review photo choices

**Files:**
- Create: `frontend/src/features/resumes/ResumeImportPhotoChoices.tsx`
- Create: `frontend/src/features/resumes/ResumeImportPhotoChoices.test.tsx`
- Modify: `frontend/src/features/resumes/ResumeCreateDialog.tsx`
- Modify: `frontend/src/features/resumes/ResumeCreateDialog.test.tsx`
- Modify: `frontend/src/features/resumes/resumeWorkspace.css`

**Component:**

```ts
interface ResumeImportPhotoChoicesProps {
  candidates: ResumeImportPhotoCandidate[];
  selectedAssetId?: string;
  disabled: boolean;
  onChange(assetId: string | undefined): void;
}
```

- [ ] **6.1 Add focused component tests first:** legend copy, default none, no auto-selection, native radio/accessibility, mutually exclusive selection, failed thumbnail isolation, object-URL cleanup, disabled state.

- [ ] **6.2 Load private thumbnails:** fetch owner-authenticated signed source, pass through existing `loadCanonicalCandidatePhoto()`, store only local object URLs, revoke on cleanup.

- [ ] **6.3 Render conservative copy:** `Possible candidate photo from PDF`; explain selection is optional; use `Do not import a photo` plus `Use extracted photo N`; never claim face/person detection.

- [ ] **6.4 Integrate into `ResumeCreateDialog`**

Add `selectedImportPhotoAssetId` state; reset on close/new review/Back; carry `photoCandidates` into `importReview`; render choices only when candidates exist. Preserve the existing auto-adopted branch call unchanged:

```ts
confirmResumePdfImport(result.job.id, controller.signal)
```

For explicit review confirmation call:

```ts
confirmResumePdfImport(
  importReview.jobId,
  controller.signal,
  selectedImportPhotoAssetId,
)
```

Keep existing confirm-button focus and single-flight behavior.

- [ ] **6.5 Extend dialog tests:** no-candidate unchanged UI, default none, selecting candidate 2, API call with undefined vs chosen ID, reset on Back/new review, confirm-busy disabling.

- [ ] **6.6 Add bounded responsive CSS:** feature-scoped classes, existing colors/tokens, `object-fit: contain`, responsive grid/stack; no new design system.

---

### Task 7: Final regression and qualification

- [ ] **7.1 Static GitHub scope audit:** compare feature branch to `main`; reject unexpected package/lock/env/deployment/provider/Learning/Interview/schema changes.

- [ ] **7.2 User focused local verification**

At minimum:

```bash
npm --prefix backend test -- \
  src/tests/unit/resumePdfImageExtraction.test.ts \
  src/tests/integration/resumePdfImport.integration.test.ts \
  src/tests/integration/resumePdfImportResponseContract.integration.test.ts \
  src/tests/integration/resumeCandidatePhoto.integration.test.ts

npm --prefix frontend test -- \
  src/features/resumes/ResumePreview.test.tsx \
  src/features/resumes/ResumeImportPhotoChoices.test.tsx \
  src/features/resumes/ResumeCreateDialog.test.tsx \
  src/features/resumes/ResumeCandidatePhotoControls.test.tsx

npm --prefix backend run typecheck:all
npm --prefix frontend run typecheck
```

Do not claim PASS until the user supplies output.

- [ ] **7.3 User full local qualification** after focused green:

```bash
npm --prefix backend test
npm --prefix frontend test
npm --prefix backend run build
npm --prefix frontend run build
git diff --check origin/main...HEAD
```

Final `git status --short` must be blank.

- [ ] **7.4 User browser QA:** verify clean long Skills in screen/print, text-only PDF import unchanged, one-photo PDF optional/default-none flow, selected photo adoption, max-3 multi-image flow, manual Candidate Photo regression, and narrow/mobile layout.

- [ ] **7.5 Repair loop:** exact logs/screenshots -> systematic debugging -> same GitHub branch repair -> user pull/retest. No merge while failing.

- [ ] **7.6 Final gate:** update draft PR with exact evidence and stop for explicit merge approval.

---

## GitHub Commit Order

Preserve test-before-production ordering:

1. Skills test;
2. Skills CSS;
3. PDF image extraction test;
4. extraction implementation;
5. staging/import-review tests;
6. staging/import-review implementation;
7. confirmation/security/concurrency tests;
8. confirmation/adoption implementation;
9. frontend contract/API tests + implementation;
10. photo-choice component/dialog tests;
11. photo-choice UI implementation;
12. only legitimate stale regression-test repairs;
13. final verification/PR note.

Do not merge until the user has locally verified the final branch and explicitly authorizes merge.

## Acceptance Checklist

- [ ] Skills have no pill/capsule border treatment and wrap naturally in screen/print.
- [ ] PR #19 response-contract fix remains intact.
- [ ] Image extraction occurs only after canonical text parsing succeeds.
- [ ] First page only; threshold 80; actual bytes determine MIME.
- [ ] Existing Candidate Photo validation determines eligibility.
- [ ] At most 3 eligible candidate Asset IDs are persisted in import-review.
- [ ] Candidates are owner-scoped and bound to exact Job + source PDF.
- [ ] No raw image bytes/data URLs enter Job result or Gemini.
- [ ] Default is always `Do not import a photo`.
- [ ] One explicit selection can become the normal Candidate Photo.
- [ ] Cross-user/wrong-job/wrong-PDF/expired/arbitrary assets cannot be attached.
- [ ] Concurrent confirmations cannot silently replace the winning photo choice.
- [ ] Non-selected candidates remain temporary or are cleaned best-effort.
- [ ] Existing bodyless confirm and two-argument frontend confirm calls remain valid.
- [ ] Manual Candidate Photo remains functional.
- [ ] Focused/full tests, typechecks, builds, diff check, and browser QA pass before merge approval.
