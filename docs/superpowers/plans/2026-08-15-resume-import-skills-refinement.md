# Resume Import + Skills Refinement Implementation Plan

> **Execution model for this project:** ChatGPT implements through the GitHub connector on `feature/resume-import-skills-refinement`; Codex is not used. Tests are committed before their production changes, but runtime RED/GREEN evidence comes from the user's local verification because the GitHub connector cannot execute the repository.

**Goal:** Replace oversized Resume Skills capsules with clean wrapping rows and let PDF import optionally reuse a user-selected eligible first-page embedded image as the imported Resume's existing Candidate Photo.

**Architecture:** Keep canonical Resume content unchanged. Track A is a presentation-only CSS/test refinement. Track B adds a best-effort first-page embedded-image pass after successful canonical text parsing, stages at most three private temporary `resume-photo` assets bound to the exact import job/source PDF, carries only their Asset IDs in the import-review result, and atomically finalizes the user's optional photo selection with the existing Resume/photo ownership model when import is confirmed.

**Tech Stack:** React + TypeScript + Vite + Vitest + Testing Library; Express + TypeScript + Mongoose + Zod + Vitest; existing `pdf-parse@^2.4.5`; existing private Asset storage and Candidate Photo validation.

## Global Constraints

- Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.
- Base implementation on merged `main @ a0543f735496215418eb16c6151e68446025fd29` (PR #19 included).
- Required branch: `feature/resume-import-skills-refinement`.
- Do not modify Gemini routing, prompts, credentials, provider selection, or send image bytes to Gemini.
- Do not add OCR, face detection/recognition, image classification, image cropping, a new PDF/image package, a new storage system, or a new Resume photo schema.
- Inspect first-page embedded images only with `getImage({ partial: [1], imageThreshold: 80, imageDataUrl: false, imageBuffer: true })`.
- Keep at most 3 usable photo candidates. Default UI selection is always `Do not import a photo`.
- Candidate assets use the existing 15-minute Candidate Photo staging lifetime and existing `resume-photo` file validation.
- Candidate identity must be bound to user + Resume-import Job ID + source PDF Asset ID.
- Raw image bytes/data URLs must never be persisted in the Job result.
- Existing text-only PDF import behavior, strict canonical Resume parser, source-PDF idempotency, manual Candidate Photo controls, Resume versioning, and deletion behavior must remain intact.
- No deployment, merge, or branch deletion is authorized by implementation approval.
- User manual terminal commands: none during GitHub-side implementation; required after implementation for local verification.
- Browser use: not available/required during GitHub-side implementation; user performs local browser QA only after automated verification is green.
- Local runtime for final browser QA: backend + frontend development servers; no separate worker process is required by this feature.

---

## File Structure and Responsibility Map

### Existing files to modify

**Skills presentation**
- `frontend/src/features/resumes/resumeWorkspace.css` — remove pill styling and define natural wrapping skill rows.
- `frontend/src/features/resumes/ResumePreview.test.tsx` — lock long-skill wrapping and no-pill presentation.

**PDF image extraction/staging**
- `backend/src/modules/resume-analysis/pdf.service.ts` — add best-effort first-page embedded-image extraction with byte-signature MIME detection.
- `backend/src/modules/resumes/resumePhoto.service.ts` — reuse existing Candidate Photo staging/attachment rules for import-generated temporary photo assets.
- `backend/src/modules/resume-analysis/resumeAnalysis.service.ts` — stage photo candidates after canonical text parsing and finalize an optional selected candidate during import confirmation.
- `backend/src/modules/resume-analysis/resumeAnalysis.schemas.ts` — validate optional selected photo Asset ID on confirm.
- `backend/src/modules/resume-analysis/resumeAnalysis.controller.ts` — pass optional selected photo ID to service.
- `backend/src/modules/resume-analysis/resumeAnalysis.routes.ts` — validate confirm request body.
- `backend/src/tests/integration/resumePdfImport.integration.test.ts` — import-review candidate lifecycle, security, idempotency, and concurrency regression coverage.

**Frontend import contract/UI**
- `frontend/src/features/resumes/types.ts` — add bounded import photo-candidate type.
- `frontend/src/features/resumes/resumeContracts.ts` — strictly parse optional `photoCandidates` from completed import jobs.
- `frontend/src/features/resumes/resumeApi.ts` — send optional selected photo ID on confirmation and request private signed candidate sources.
- `frontend/src/features/resumes/ResumeCreateDialog.tsx` — hold selected candidate state and render the focused choice component during Import Review.
- `frontend/src/features/resumes/ResumeCreateDialog.test.tsx` — review/selection/default/confirmation behavior.
- `frontend/src/features/resumes/resumeWorkspace.css` — compact responsive candidate-choice styling alongside Skills CSS.

### New focused frontend files

- `frontend/src/features/resumes/ResumeImportPhotoChoices.tsx` — private candidate thumbnail loading, radio-group selection, object-URL cleanup, unavailable-candidate handling.
- `frontend/src/features/resumes/ResumeImportPhotoChoices.test.tsx` — focused accessibility/selection/loading tests.

### Expected files that should NOT change

- `backend/package.json`, root `package.json`, lockfiles.
- Resume/Mongo schemas (`resume.model.ts`, `resumeVersion.model.ts`) unless an implementation blocker proves the approved design impossible.
- AI gateway/provider files.
- deployment/env/migration files.
- Learning or Interview modules.

---

### Task 1: Replace Skills capsules with Resume-style wrapping rows

**Files:**
- Modify: `frontend/src/features/resumes/ResumePreview.test.tsx`
- Modify: `frontend/src/features/resumes/resumeWorkspace.css`

**Interfaces:**
- Consumes: existing `.resume-paper-skills` definition-list markup from `ResumePreview.tsx`.
- Produces: the same semantic `<dl><div><dt><dd>` structure with presentation-only CSS; no component/data contract change.

- [ ] **Step 1: Add the failing presentation expectations first**

Extend the existing long-skills test so it checks the group container rule rather than accepting the pill treatment:

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

Also keep assertions that the group names/keywords remain inside the semantic definition list and the long keyword string is not removed.

**Expected RED before CSS change:** current `.resume-paper-skills > div` still contains `border: 1px solid var(--resume-rule)` and `border-radius: 999px` and does not contain `min-width: 0`.

- [ ] **Step 2: Implement the smallest shared preview CSS change**

Replace the capsule rule with a wrapping row:

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

Do not add a replacement border/background/chip class.

- [ ] **Step 3: Preserve print/shared-template behavior**

Do not change `ResumePreview.tsx`. The shared `.resume-paper-skills` rule must remain used by ATS Classic, Modern Professional, Compact Technical, screen preview, and print surface.

- [ ] **Step 4: GitHub-side review checkpoint**

Inspect the diff and confirm only the preview test + CSS changed for this task, and no skill data/editor behavior changed.

---

### Task 2: Add a bounded first-page embedded-image extraction primitive

**Files:**
- Modify: `backend/src/modules/resume-analysis/pdf.service.ts`
- Create: `backend/src/tests/unit/resumePdfImageExtraction.test.ts`

**Interfaces:**
- Produces:

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

- The function is best-effort: image-pass failures return `[]`; they do not change `extractPdfText()` error semantics.

- [ ] **Step 1: Add unit tests before the implementation**

Mock `PDFParse` and assert the image pass is invoked exactly as approved:

```ts
expect(getImageMock).toHaveBeenCalledWith({
  partial: [1],
  imageThreshold: 80,
  imageDataUrl: false,
  imageBuffer: true,
});
```

Add cases proving:

```ts
// PNG/JPEG/WebP magic bytes are accepted.
// unsupported bytes are skipped.
// duplicate buffers are returned once.
// deterministic order is descending width*height, stable on ties.
// getImage rejection returns [] rather than throwing.
// parser.destroy() runs in success and failure paths.
```

**Expected RED:** `extractFirstPagePdfImages` does not exist.

- [ ] **Step 2: Add byte-signature MIME detection**

Keep this local to `pdf.service.ts`:

```ts
function imageMimeType(buffer: Buffer): ExtractedPdfImageCandidate["mimeType"] | undefined {
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  return undefined;
}
```

Do not trust PDF metadata for MIME type.

- [ ] **Step 3: Implement the best-effort image pass**

Use a separate `PDFParse` instance so the existing text-extraction lifetime remains unchanged:

```ts
const parser = new PDFParse({ data: new Uint8Array(buffer) });
try {
  const result = await parser.getImage({
    partial: [1],
    imageThreshold: 80,
    imageDataUrl: false,
    imageBuffer: true,
  });
  // map first-page images -> Buffer + actual MIME + finite positive width/height
  // dedupe by SHA-256 buffer checksum
  // stable sort by pixel area descending
  return candidates;
} catch {
  return [];
} finally {
  await parser.destroy();
}
```

Do not slice to 3 here; Candidate Photo validation can reject a larger image, so the staging layer must continue until it has at most 3 **eligible** candidates.

- [ ] **Step 4: GitHub-side review checkpoint**

Confirm no text extraction behavior changed and no image data is logged or persisted.

---

### Task 3: Stage eligible image candidates as private import-bound Candidate Photo assets

**Files:**
- Modify: `backend/src/modules/resumes/resumePhoto.service.ts`
- Modify: `backend/src/modules/resume-analysis/resumeAnalysis.service.ts`
- Modify: `backend/src/tests/integration/resumePdfImport.integration.test.ts`

**Interfaces:**
- `resumePhoto.service.ts` produces:

```ts
export const RESUME_PHOTO_STAGING_TTL_SECONDS = 15 * 60;

export async function stageResumeImportPhotoCandidate(input: {
  userId: string;
  importJobId: string;
  sourceAssetId: string;
  candidate: ExtractedPdfImageCandidate;
  ordinal: number;
}): Promise<AssetDocument>;
```

- `ImportReviewResult` becomes:

```ts
export interface ImportReviewResult {
  kind: "import-review";
  content: ResumeContent;
  photoCandidates?: Array<{ assetId: string }>;
}
```

- [ ] **Step 1: Add integration tests before staging implementation**

Mock both PDF functions independently:

```ts
vi.mock("../../modules/resume-analysis/pdf.service.js", () => ({
  extractPdfText: extractPdfTextMock,
  extractFirstPagePdfImages: extractPdfImagesMock,
}));
```

Add cases proving:

- image extraction is not called when text extraction fails;
- image extraction is not called when Gemini/canonical parsing fails;
- production import with a job ID stages eligible candidates only after canonical content exists;
- text-only/empty image result returns the existing `{ kind, content }` contract without `photoCandidates`;
- invalid/tiny/oversized Candidate Photo input is skipped without failing the valid text import;
- more than three eligible candidates yields exactly three IDs;
- staged assets are `purpose: "resume-photo"`, `status: "temporary"`, have ~15-minute expiry, and metadata contains exact `resumeImportJobId` + `resumeImportSourceAssetId`;
- the job result contains only Asset IDs, never `buffer`, `data`, `dataUrl`, or base64 content.

**Expected RED:** current `prepareResumePdfImport()` never calls an image extractor and `ImportReviewResult` has no candidate field.

- [ ] **Step 2: Reuse the existing Candidate Photo staging boundary**

In `resumePhoto.service.ts`, rename/export the TTL constant and add `stageResumeImportPhotoCandidate()`.

Construct the in-memory `Express.Multer.File` only inside this service, then call existing `createAsset()` with `purpose: "resume-photo"`. Example shape:

```ts
const file: Express.Multer.File = {
  fieldname: "file",
  originalname: `resume-import-photo-${input.ordinal}.${extension}`,
  encoding: "7bit",
  mimetype: input.candidate.mimeType,
  size: input.candidate.buffer.length,
  buffer: input.candidate.buffer,
  destination: "",
  filename: "",
  path: "",
  stream: Readable.from(input.candidate.buffer),
};
```

After `createAsset()` validates/stores it, write only:

```ts
asset.metadata = {
  ...(asset.metadata ?? {}),
  resumeImportJobId: input.importJobId,
  resumeImportSourceAssetId: input.sourceAssetId,
};
await asset.save();
```

If metadata persistence fails, delete that staged asset best-effort and rethrow to the caller; the caller treats optional-photo staging failure as a skipped candidate.

- [ ] **Step 3: Call image extraction only after canonical text parsing**

In `prepareResumePdfImport()` preserve:

```ts
const extracted = await extractPdfText(buffer);
const content = await parseResumeText(...);
```

Then, only when `input.jobId` exists, call `extractFirstPagePdfImages(buffer)`. Stage candidates in deterministic order until 3 successful `resume-photo` assets exist. Return:

```ts
return {
  kind: "import-review",
  content,
  ...(photoCandidates.length === 0 ? {} : { photoCandidates }),
};
```

Direct service calls without a Job ID must not create unbound candidate assets.

- [ ] **Step 4: GitHub-side review checkpoint**

Confirm image bytes exist only transiently in memory/private object storage and the persisted import-review job result contains IDs only.

---

### Task 4: Securely adopt an explicitly selected staged photo during import confirmation

**Files:**
- Modify: `backend/src/modules/resume-analysis/resumeAnalysis.schemas.ts`
- Modify: `backend/src/modules/resume-analysis/resumeAnalysis.routes.ts`
- Modify: `backend/src/modules/resume-analysis/resumeAnalysis.controller.ts`
- Modify: `backend/src/modules/resume-analysis/resumeAnalysis.service.ts`
- Modify: `backend/src/modules/resumes/resumePhoto.service.ts`
- Modify: `backend/src/tests/integration/resumePdfImport.integration.test.ts`

**Interfaces:**
- Add request body schema:

```ts
export const confirmImportPdfBodySchema = z.object({
  selectedPhotoAssetId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
}).strict();
```

- Extend service input:

```ts
confirmResumePdfImport({
  userId,
  jobId,
  selectedPhotoAssetId?: string,
})
```

- `resumePhoto.service.ts` adds a transaction-aware helper:

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

- [ ] **Step 1: Add request/security/idempotency tests first**

Extend `resumePdfImport.integration.test.ts` with:

```ts
// POST confirm with {} -> no candidate photo, existing behavior.
// valid selected candidate -> resume.candidatePhotoAssetId is set and design.showProfilePhoto === true.
// selected candidate must be present in result.photoCandidates.
// cross-user candidate -> reject.
// candidate bound to another import job -> reject.
// candidate bound to another source PDF -> reject.
// expired/deleted candidate -> reject when selected.
// arbitrary active resume-photo asset -> reject.
// expired non-selected candidates do not block confirming with {}.
// repeated same selection -> same Resume/version and one photo association.
// two racing different selections -> at most one wins; loser cannot replace the winner.
// source PDF remains active and associated with the same Resume.
// after success, job.result is scrubbed to import-adopted with no content/candidate IDs.
```

**Expected RED:** route ignores request body; service has no candidate handling.

- [ ] **Step 2: Validate the confirm body at the route**

Update the confirm route to:

```ts
validate({
  params: importJobIdParamsSchema,
  body: confirmImportPdfBodySchema,
})
```

Controller passes `request.body.selectedPhotoAssetId`.

- [ ] **Step 3: Add transaction-aware staged-photo attachment**

`attachStagedImportPhotoCandidate()` must:

1. load the owned Resume in the supplied session;
2. if the current Candidate Photo already equals `assetId`, verify the active asset belongs to that Resume and return (same-selection retry);
3. if another Candidate Photo is already attached, throw `409 RESUME_PHOTO_CONFLICT`;
4. load the selected asset with exact owner/purpose/status/expiry and metadata binding:

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

5. promote it in-session, add `resumeId` to metadata, set Resume `candidatePhotoAssetId`, set `design.showProfilePhoto = true`, and save both with the same `ClientSession`.

Do not call `createOrReplaceCandidatePhoto()` because that function creates a second staged asset from an upload.

- [ ] **Step 4: Prevalidate selection before creating/finding the import winner**

From the existing import-review Job result:

- parse `photoCandidates` as max 3 `{assetId}` records;
- if `selectedPhotoAssetId` is supplied but is not in that exact candidate list, throw `RESUME_IMPORT_NOT_CONFIRMABLE`;
- verify its current temporary asset binding before Resume creation so a tampered/stale choice fails early.

- [ ] **Step 5: Atomically finalize photo choice + adopted Job result**

After current source-PDF winner creation/reuse and source-asset promotion, run one `withMongoTransaction()` that:

1. re-reads the Job by owner/type/status in the transaction;
2. if it is already `import-adopted`, returns the existing identity without attaching/replacing a photo;
3. if still `import-review`, revalidates the selected candidate against the transactional Job result;
4. attaches the selected candidate in the same transaction when present;
5. replaces Job `result` with only:

```ts
{
  kind: "import-adopted",
  resumeId,
  versionId,
  versionNumber: 1,
}
```

This transaction establishes one authoritative winner for concurrent `none`/photo-1/photo-2 confirmations. A losing request must not mutate the Resume after another request has scrubbed the Job to `import-adopted`.

- [ ] **Step 6: Best-effort cleanup after successful adoption**

Keep the selected asset active. For all other candidate IDs captured from the winning import review, call `deleteOwnedAsset()` best-effort. If cleanup fails, the assets remain temporary and their 15-minute expiry remains the fallback.

Never let non-selected cleanup failure turn a completed import into a reported failure.

- [ ] **Step 7: GitHub-side review checkpoint**

Inspect the service diff specifically for ownership predicates, metadata binding, transaction session use, no photo replacement race, and no weakening of source-PDF idempotency.

---

### Task 5: Extend the strict frontend contract and API without weakening Resume parsing

**Files:**
- Modify: `frontend/src/features/resumes/types.ts`
- Modify: `frontend/src/features/resumes/resumeContracts.ts`
- Modify: `frontend/src/features/resumes/resumeApi.ts`
- Add/modify tests in existing Resume contract/API test files if present; otherwise cover parsing through `ResumeCreateDialog.test.tsx` plus a focused `resumeContracts` test only if the repository already has one.

**Interfaces:**

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

API signatures:

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

- [ ] **Step 1: Add strict parser tests first**

For completed `resume.import-pdf` jobs prove:

```ts
// photoCandidates omitted -> valid.
// [] -> valid if server sends it, but implementation should normally omit empty.
// 1..3 valid object IDs -> valid.
// >3 -> invalid response.
// malformed candidate record, extra keys, non-object-ID -> INVALID_RESUME_RESPONSE.
// canonical content strictness remains unchanged.
```

**Expected RED:** `exactKeys(item, ["kind", "content"])` rejects `photoCandidates`.

- [ ] **Step 2: Extend only the import-review result parser**

Use the existing `array`, `exactKeys`, and `id` helpers:

```ts
const review = exactKeys(item, ["kind", "content"], ["photoCandidates"]);
const photoCandidates = review.photoCandidates === undefined
  ? undefined
  : array(review.photoCandidates, 3, (value) => {
      const candidate = exactKeys(value, ["assetId"]);
      return { assetId: id(candidate.assetId) };
    });
```

Do not loosen `parseResumeContent()`.

- [ ] **Step 3: Update confirmation API body**

```ts
body: selectedPhotoAssetId === undefined
  ? {}
  : { selectedPhotoAssetId }
```

Keep authentication and workspace parsing unchanged.

- [ ] **Step 4: Reuse the generic private signed-asset route for previews**

Add:

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

Reuse `parseCandidatePhotoSource` and `loadCanonicalCandidatePhoto`; do not create a public image endpoint.

---

### Task 6: Add the explicit Import Review photo-choice UI

**Files:**
- Create: `frontend/src/features/resumes/ResumeImportPhotoChoices.tsx`
- Create: `frontend/src/features/resumes/ResumeImportPhotoChoices.test.tsx`
- Modify: `frontend/src/features/resumes/ResumeCreateDialog.tsx`
- Modify: `frontend/src/features/resumes/ResumeCreateDialog.test.tsx`
- Modify: `frontend/src/features/resumes/resumeWorkspace.css`

**Interfaces:**

```ts
interface ResumeImportPhotoChoicesProps {
  candidates: ResumeImportPhotoCandidate[];
  selectedAssetId?: string;
  disabled: boolean;
  onChange(assetId: string | undefined): void;
}
```

- [ ] **Step 1: Add focused component tests first**

Mock `fetchResumeImportPhotoCandidateSource` / `loadCanonicalCandidatePhoto` and prove:

- fieldset/legend is `Possible candidate photo from PDF`;
- `Do not import a photo` is checked by default;
- no image candidate is preselected when only one exists;
- at most the supplied 3 candidates render;
- each usable option has accessible name `Use extracted photo N`;
- selecting a photo is mutually exclusive with `Do not import a photo`;
- one preview failure leaves other candidates usable and makes the failed option unavailable;
- generated object URLs are revoked on replacement/unmount;
- disabled state prevents selection during confirmation.

**Expected RED:** component does not exist.

- [ ] **Step 2: Implement private candidate thumbnail loading**

For each candidate:

1. request an owner-authenticated signed URL through `fetchResumeImportPhotoCandidateSource()`;
2. pass it through existing `loadCanonicalCandidatePhoto()` so MIME/size/dimensions are rechecked client-side;
3. store only the returned object URL in component state;
4. revoke every object URL in effect cleanup.

Do not persist signed URLs or object URLs in Resume state.

- [ ] **Step 3: Render radio semantics and conservative copy**

Use native radio inputs inside a fieldset:

```text
Possible candidate photo from PDF
Images were extracted from the PDF. Select one only if it is the Candidate Photo you want to use.

(o) Do not import a photo
( ) Use extracted photo 1   [thumbnail]
( ) Use extracted photo 2   [thumbnail]
```

Never use wording that claims a face/person was detected.

- [ ] **Step 4: Integrate with `ResumeCreateDialog`**

Add state:

```ts
const [selectedImportPhotoAssetId, setSelectedImportPhotoAssetId] =
  useState<string | undefined>(undefined);
```

Reset it when:

- dialog closes;
- a new import review is received;
- the user returns from Review to Import.

When a completed review job arrives, carry `photoCandidates` into `importReview`.

Render `ResumeImportPhotoChoices` only when candidates exist.

Confirmation becomes:

```ts
await confirmResumePdfImport(
  importReview.jobId,
  selectedImportPhotoAssetId,
  controller.signal,
);
```

- [ ] **Step 5: Add integration-level dialog tests**

Extend the completed job fixture with optional candidates and prove:

- no candidates -> current review UI is unchanged;
- one candidate -> choice section appears, `Do not import a photo` is default;
- confirm without selection calls API with `undefined` selected photo;
- selecting candidate 2 calls API with its Asset ID;
- returning Back then starting/reviewing a new import clears the old photo choice;
- confirm busy state disables choices and still single-flights the request.

- [ ] **Step 6: Add bounded responsive styling**

In `resumeWorkspace.css`, add only feature-scoped classes such as:

```css
.resume-import-photo-choices { display: grid; gap: 10px; }
.resume-import-photo-options { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
.resume-import-photo-option { min-width: 0; }
.resume-import-photo-thumbnail { width: 100%; max-height: 150px; object-fit: contain; }
```

Use current border/surface variables. No new palette, animation, or design system.

---

### Task 7: Cross-feature regression and final qualification

**Files:**
- No new production files expected.
- Modify only tests that are legitimately stale because of the approved behavior.

**Interfaces:**
- Consumes all previous tasks.
- Produces one locally verifiable feature branch ready for user browser QA, not merge.

- [ ] **Step 1: Static scope audit through GitHub**

Compare the feature branch to `main` and confirm there are no unexpected changes in:

```text
backend/package.json
frontend/package.json
package-lock.json
.env*
deployment files
AI provider/routing files
Learning/Interview modules
Resume database schemas
```

- [ ] **Step 2: User local focused verification block**

After implementation, provide one copy-paste terminal block covering at minimum:

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

Do not claim these pass until the user supplies output.

- [ ] **Step 3: User local full qualification**

Only after focused tests are green:

```bash
npm --prefix backend test
npm --prefix frontend test
npm --prefix backend run build
npm --prefix frontend run build
git diff --check origin/main...HEAD
```

Final `git status --short` must be blank.

- [ ] **Step 4: User browser QA**

Start the existing local backend + frontend development servers and verify:

1. Long Technical Skills no longer have rounded capsule outlines and wrap cleanly in live preview.
2. Print/PDF preview uses the same clean Skills rows.
3. Text-only Resume PDF still imports normally and shows no photo-choice section.
4. Resume PDF with one eligible first-page embedded candidate-style image shows one optional preview but defaults to `Do not import a photo`.
5. Selecting that image, confirming, and opening the imported Resume shows it through the existing Candidate Photo mechanism.
6. A PDF with multiple eligible first-page images shows no more than 3 choices and does not auto-select one.
7. Manual Candidate Photo upload/replace/remove still works after import.
8. Narrow/mobile dialog layout has no horizontal overflow.

- [ ] **Step 5: Repair loop if needed**

If any local test/browser check fails, the user pastes the exact output/screenshots back into ChatGPT. Diagnose with systematic debugging, fix the same feature branch through GitHub, and have the user pull/retest. Do not merge while any gate is failing.

- [ ] **Step 6: Final approval gate**

When all automated and human QA is green, update the draft PR with exact verification evidence and stop for explicit merge approval.

---

## Planned Commit / Review Sequence

Because GitHub connector writes create commits directly, preserve TDD ordering in branch history:

1. tests for Skills presentation;
2. minimal Skills CSS;
3. tests for PDF image extraction;
4. extraction primitive;
5. tests for staging/import-review candidates;
6. staging/import-review implementation;
7. confirmation/security/concurrency tests;
8. confirmation/adoption implementation;
9. frontend contract/API tests + implementation;
10. photo-choice component/dialog tests;
11. photo-choice UI implementation;
12. only necessary regression-test repairs;
13. final documentation/PR verification note.

Do not squash or merge until the user has locally verified the final branch and explicitly authorizes merge.

## Acceptance Checklist

- [ ] Skills use clean Resume-style rows with no `999px` capsule styling.
- [ ] Long technical keyword text wraps naturally without clipping/horizontal overflow.
- [ ] Screen and print share the Skills presentation.
- [ ] Existing PDF response-contract fix remains intact.
- [ ] Photo extraction runs only after canonical text parsing succeeds.
- [ ] Only first-page embedded images are considered; threshold is 80.
- [ ] Only JPEG/PNG/WebP byte signatures are considered.
- [ ] Existing Candidate Photo validation decides actual eligibility.
- [ ] At most 3 eligible temporary candidate Asset IDs enter import-review.
- [ ] Candidates are owner-scoped and bound to import Job ID + source PDF Asset ID.
- [ ] No raw image bytes/data URLs enter Mongo Job results or Gemini requests.
- [ ] `Do not import a photo` is always the default.
- [ ] User can explicitly select exactly one candidate.
- [ ] Selected candidate becomes the normal existing Candidate Photo with `showProfilePhoto=true`.
- [ ] Cross-user/wrong-job/wrong-PDF/expired/arbitrary assets are rejected.
- [ ] Concurrent confirmations cannot silently replace the winning photo choice.
- [ ] Non-selected candidates are cleaned best-effort and remain temporary on cleanup failure.
- [ ] Manual Candidate Photo remains functional.
- [ ] Full backend/frontend tests, typechecks, builds, diff check, and user browser QA pass before merge approval.
