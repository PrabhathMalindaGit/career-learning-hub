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

Use:

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

- [ ] **1.3 Diff checkpoint**

Only the preview test and CSS should change in this task.

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

- [ ] **2.2 Detect MIME from bytes only**

Add a local helper in `pdf.service.ts` for PNG/JPEG/WebP magic bytes. Do not trust PDF image metadata.

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

Do **not** slice to 3 here; the next layer must continue past ineligible images until it has at most 3 validated Candidate Photo assets.

- [ ] **2.4 Diff checkpoint**

Existing `extractPdfText()` semantics must be untouched.

---

### Task 3: Stage eligible extracted images as import-bound private Candidate Photo assets

**Files:**
- Modify: `backend/src/modules/resumes/resumePhoto.service.ts`
- Modify: `backend/src/modules/resume-analysis/resumeAnalysis.service.ts`
- Modify: `backend/src/tests/integration/resumePdfImport.integration.test.ts`

**Important dependency rule:** `resumePhoto.service.ts` must **not** import types from `resume-analysis`. Its staging function consumes primitive buffer/MIME inputs so the Resume module does not depend back on the Resume Analysis module.

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

Prove:

- image extraction is not called when PDF text extraction fails;
- image extraction is not called when Gemini/canonical parsing fails;
- direct service calls without `jobId` create no unbound photo assets;
- text-only import returns no candidate field;
- invalid/oversized/unsupported Candidate Photo bytes are skipped without failing valid text import;
- the loop continues until at most 3 **eligible** assets are staged;
- staged assets are `resume-photo`, `temporary`, ~15-minute TTL;
- metadata is exactly bound with `resumeImportJobId` and `resumeImportSourceAssetId`;
- import-review persistence contains Asset IDs only, never image buffers/data URLs/base64.

- [ ] **3.2 Reuse the existing Candidate Photo asset boundary**

Inside `resumePhoto.service.ts`, build the memory-file object and call existing `createAsset()` with `purpose: "resume-photo"`. The file uses the detected MIME and buffer; validation therefore reuses existing signature/size/dimension policy.

After creation:

```ts
asset.metadata = {
  ...(asset.metadata ?? {}),
  resumeImportJobId: input.importJobId,
  resumeImportSourceAssetId: input.sourceAssetId,
};
await asset.save();
```

If metadata persistence fails, delete the staged asset best-effort and rethrow; the optional-photo caller may skip it.

- [ ] **3.3 Extract/stage only after canonical content exists**

Preserve the current order:

```ts
const extracted = await extractPdfText(buffer);
const content = await parseResumeText(...);
```

Only then, and only when `input.jobId` exists, call `extractFirstPagePdfImages(buffer)`. Stage in deterministic order until 3 successes. Return `photoCandidates` only when non-empty.

- [ ] **3.4 Diff checkpoint**

No image bytes may enter Job result or logs.

---

### Task 4: Secure optional photo adoption during import confirmation

**Files:**
- Modify: `backend/src/modules/resume-analysis/resumeAnalysis.schemas.ts`
- Modify: `backend/src/modules/resume-analysis/resumeAnalysis.routes.ts`
- Modify: `backend/src/modules/resume-analysis/resumeAnalysis.controller.ts`
- Modify: `backend/src/modules/resume-analysis/resumeAnalysis.service.ts`
- Modify: `backend/src/modules/resumes/resumePhoto.service.ts`
- Modify: `backend/src/tests/integration/resumePdfImport.integration.test.ts`

**Produces request schema:**

```ts
export const confirmImportPdfBodySchema = z
  .object({
    selectedPhotoAssetId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  })
  .strict()
  .default({});
```

The `.default({})` is required so the already-supported bodyless `POST /confirm` remains valid.

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

- [ ] **4.1 Add backend route/security/concurrency tests first**

Cover:

- old bodyless confirm still succeeds;
- `{}` confirm -> no Candidate Photo;
- valid selected candidate -> `candidatePhotoAssetId` set and `showProfilePhoto=true`;
- selection must be present in that Job's `photoCandidates`;
- cross-user, wrong Job, wrong source PDF, expired/deleted, or arbitrary active photo -> rejected;
- expired **non-selected** candidates do not block `{}` confirmation;
- repeated same selection -> same Resume/version and one photo;
- concurrent different selections -> at most one authoritative photo; loser cannot replace it;
- source PDF association remains unchanged;
- adopted Job result contains only `{kind,resumeId,versionId,versionNumber}`.

- [ ] **4.2 Validate route body without breaking legacy bodyless calls**

Apply:

```ts
validate({
  params: importJobIdParamsSchema,
  body: confirmImportPdfBodySchema,
})
```

Controller forwards `request.body.selectedPhotoAssetId`.

- [ ] **4.3 Implement staged-photo attachment under an existing Mongo session**

The helper must:

1. load owned Resume in `session`;
2. if current photo already equals `assetId`, verify the active asset belongs to the Resume and return;
3. if another photo exists, throw `409 RESUME_PHOTO_CONFLICT`;
4. require selected Asset with:

```ts
{
  _id: input.assetId,
  userId: input.userId,
  purpose: "resume-photo",
  status: "temporary",
  expiresAt: { $gt: new Date() },
  "metadata.resumeImportJobId": input.importJobId,
  "metadata.resumeImportSourceAssetId": input.sourceAssetId,
}
```

5. set asset active, clear expiry, add `resumeId` metadata;
6. set Resume `candidatePhotoAssetId` and `design.showProfilePhoto=true`;
7. save both with the supplied session.

Do not call `createOrReplaceCandidatePhoto()` because it would create a second asset.

- [ ] **4.4 Prevalidate the chosen ID before winner creation**

Parse optional `photoCandidates` from the current import-review Job as max 3 `{assetId}` records. If a supplied selection is absent from that list or its temporary bound asset is no longer eligible, return the existing bounded import-confirmation conflict before creating a new Resume.

- [ ] **4.5 Atomically finalize the winning photo choice and scrub the Job**

After current source-PDF winner creation/reuse and source-asset promotion, use one `withMongoTransaction()` that:

1. re-reads the owner-scoped completed import Job in-session;
2. if already `import-adopted`, returns that identity without attaching/replacing a photo;
3. if still `import-review`, revalidates selected ID against that transactional result;
4. attaches the selected candidate in-session when present;
5. replaces Job result in the same transaction with:

```ts
{
  kind: "import-adopted",
  resumeId,
  versionId,
  versionNumber: 1,
}
```

This makes `none`, candidate A, and candidate B concurrent confirmations compete for one Job-result write; a losing request cannot mutate the Resume after another request wins.

- [ ] **4.6 Best-effort cleanup after success**

For candidate IDs captured from the import review, delete all non-selected temporary candidates best-effort. If cleanup fails, their 15-minute expiry remains the fallback. Never turn a successful import into a failure because non-selected cleanup failed.

- [ ] **4.7 Diff checkpoint**

Review ownership predicates, metadata binding, transaction session use, race behavior, source-PDF idempotency, and job-result scrubbing.

---

### Task 5: Extend the strict frontend job contract and API

**Files:**
- Modify: `frontend/src/features/resumes/types.ts`
- Modify: `frontend/src/features/resumes/resumeContracts.ts`
- Modify: `frontend/src/features/resumes/resumeApi.ts`
- Test through existing contract/API tests where present and `ResumeCreateDialog.test.tsx` otherwise.

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

**API:**

```ts
export async function confirmResumePdfImport(
  jobId: string,
  selectedPhotoAssetId?: string,
  signal?: AbortSignal,
): Promise<ResumeWorkspaceData>;

export async function fetchResumeImportPhotoCandidateSource(
  assetId: string,
  signal?: AbortSignal,
): Promise<CandidatePhotoSource>;
```

- [ ] **5.1 Add strict parser tests first**

Completed import-review results must accept omitted/0-3 valid candidates and reject >3, non-object IDs, extra candidate keys, malformed records, while retaining strict `parseResumeContent()` behavior.

- [ ] **5.2 Extend only `import-review` parsing**

```ts
const review = exactKeys(item, ["kind", "content"], ["photoCandidates"]);
const photoCandidates = review.photoCandidates === undefined
  ? undefined
  : array(review.photoCandidates, 3, (value) => {
      const candidate = exactKeys(value, ["assetId"]);
      return { assetId: id(candidate.assetId) };
    });
```

Do not loosen canonical Resume parsing.

- [ ] **5.3 Send only the optional selected ID on confirmation**

```ts
body: selectedPhotoAssetId === undefined
  ? {}
  : { selectedPhotoAssetId }
```

- [ ] **5.4 Reuse generic private signed-asset preview**

```ts
const data = await apiRequest<unknown>(
  `/assets/${encodeURIComponent(assetId)}/signed-url`,
  {
    method: "POST",
    body: { expiresInSeconds: 300 },
    authentication: "required",
    signal,
  },
);
return parseCandidatePhotoSource(data);
```

Reuse `parseCandidatePhotoSource()` and `loadCanonicalCandidatePhoto()`; do not create a public route.

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

- [ ] **6.1 Add focused UI tests before component implementation**

Prove:

- legend is `Possible candidate photo from PDF`;
- `Do not import a photo` is selected by default;
- one candidate is never auto-selected;
- options use native radio semantics and accessible names `Use extracted photo N`;
- selection is mutually exclusive;
- one thumbnail-source failure leaves other choices usable and that failed choice disabled;
- object URLs are revoked on replacement/unmount;
- disabled state prevents changes while confirming.

- [ ] **6.2 Load private thumbnails using existing Candidate Photo checks**

For each candidate, request signed source with `fetchResumeImportPhotoCandidateSource()`, then call `loadCanonicalCandidatePhoto()`. Store only returned local object URLs and revoke them in cleanup.

- [ ] **6.3 Render conservative user-controlled wording**

Use:

```text
Possible candidate photo from PDF
Images were extracted from the PDF. Select one only if it is the Candidate Photo you want to use.

(o) Do not import a photo
( ) Use extracted photo 1
( ) Use extracted photo 2
```

Never claim that a face/person was detected.

- [ ] **6.4 Integrate into `ResumeCreateDialog`**

Add:

```ts
const [selectedImportPhotoAssetId, setSelectedImportPhotoAssetId] =
  useState<string | undefined>(undefined);
```

Reset it on dialog close, new review, and Back to Import. Carry `photoCandidates` into `importReview`. Render the choice component only when candidates exist. Confirm with:

```ts
await confirmResumePdfImport(
  importReview.jobId,
  selectedImportPhotoAssetId,
  controller.signal,
);
```

Keep existing confirm-button initial-focus behavior and single-flight logic.

- [ ] **6.5 Extend dialog tests**

Cover no-candidate unchanged UI, default none, selecting candidate 2, API call with undefined vs selected ID, Back/new-review reset, and confirm-busy disabled choices.

- [ ] **6.6 Add bounded responsive CSS only**

Use feature-scoped classes, existing colors/tokens, `object-fit: contain`, and an auto-fit grid or stacked mobile layout. No new palette/animation/design system.

---

### Task 7: Final regression and qualification

**Files:** no new production files expected.

- [ ] **7.1 Static GitHub scope audit**

Compare feature branch to `main`; reject unexpected package/lock/env/deployment/provider/Learning/Interview/schema changes.

- [ ] **7.2 User focused local verification**

Provide one block containing at minimum:

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

- [ ] **7.3 User full local qualification**

After focused green:

```bash
npm --prefix backend test
npm --prefix frontend test
npm --prefix backend run build
npm --prefix frontend run build
git diff --check origin/main...HEAD
```

Final `git status --short` must be blank.

- [ ] **7.4 User browser QA**

Verify:

1. long Technical Skills have no rounded capsule outline and wrap cleanly;
2. print/PDF preview uses the same Skills rows;
3. text-only Resume PDF still imports normally with no photo-choice section;
4. one eligible first-page image appears as an optional choice but defaults to none;
5. selected extracted image becomes the normal Candidate Photo after confirmation;
6. multiple eligible images show no more than 3 choices and never auto-select;
7. manual Candidate Photo upload/replace/remove still works;
8. narrow/mobile Import Review has no horizontal overflow.

- [ ] **7.5 Repair loop**

On any failure, user pastes exact logs/screenshots; diagnose with systematic debugging; repair the same GitHub branch; user pulls/retests. Do not merge while any gate fails.

- [ ] **7.6 Final gate**

Update draft PR with exact verification evidence and stop for explicit merge approval.

---

## GitHub Commit Order

Preserve test-before-production ordering:

1. Skills test;
2. Skills CSS;
3. PDF image extraction test;
4. PDF image extraction implementation;
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

- [ ] Skills have no pill/capsule border treatment.
- [ ] Long skills wrap naturally in screen and print output.
- [ ] PR #19's PDF response-contract fix remains intact.
- [ ] Image extraction occurs only after canonical text parsing succeeds.
- [ ] First page only; threshold 80; actual byte signature determines MIME.
- [ ] Existing Candidate Photo validation determines eligibility.
- [ ] At most 3 eligible candidate Asset IDs are persisted in import-review.
- [ ] Candidates are owner-scoped and bound to exact Job + source PDF.
- [ ] No raw image bytes/data URLs enter Job result or Gemini.
- [ ] Default is always `Do not import a photo`.
- [ ] One explicit selection can become the normal Candidate Photo.
- [ ] Cross-user/wrong-job/wrong-PDF/expired/arbitrary assets cannot be attached.
- [ ] Concurrent confirmations cannot silently replace the winning photo choice.
- [ ] Non-selected candidates remain temporary or are cleaned best-effort.
- [ ] Bodyless existing confirm calls remain valid.
- [ ] Manual Candidate Photo remains functional.
- [ ] Focused/full tests, typechecks, builds, diff check, and browser QA pass before merge approval.
