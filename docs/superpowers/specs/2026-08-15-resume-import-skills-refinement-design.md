# Resume Import + Skills Refinement Design

**Date:** 2026-08-15
**Status:** Design approved by the user; written specification self-reviewed and awaiting user approval
**Documentation branch:** `design/resume-import-skills-refinement`
**Implementation prerequisite:** PR #19 (`fix/resume-pdf-import-response-contract`) must be merged to `main` before production implementation begins

## 1. Purpose

Improve two concrete Resume Studio weaknesses found during live browser QA after the Resume PDF import response-contract fix:

1. Resume skill groups currently render as large rounded capsules. Long groups such as `Technical Skills` become visually heavy and awkward when they contain many keywords.
2. Resume PDF import currently extracts text only. A candidate photo embedded in the uploaded PDF is ignored, so the user must upload the same photo again manually through Candidate Photo.

This refinement keeps the existing Resume data model, Candidate Photo controls, ownership/security rules, Gemini routing, PDF import review/adoption flow, and storage architecture. It adds only the smallest behavior needed to improve the presentation and optionally reuse an embedded candidate photo.

## 2. Controlling project constraint

Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.

Therefore this refinement must not add:

- face recognition or face detection;
- image classification AI;
- a new PDF parsing library;
- a new image-processing service;
- a new storage system;
- a new Resume photo model;
- OCR;
- automatic biometric/person identification;
- automatic selection of an image without user confirmation;
- a generic media-processing framework;
- unrelated Resume redesigns.

## 3. Dependency and branch strategy

PR #19 fixes the PDF import response contract and has already passed the user's local automated verification and live PDF import test. It remains a separate bug-fix PR.

This refinement must not be added to PR #19.

Production implementation begins only after PR #19 is merged and `main` contains that verified fix. The implementation branch must then be created from the updated `main` so this feature is built on the repaired import contract rather than duplicating or bypassing it.

The current documentation branch contains specification work only.

## 4. Track A — Resume Skills presentation

### 4.1 Current problem

`ResumePreview` renders canonical skill groups using a semantic definition list. The shared Resume CSS currently styles every skill group as a bordered `999px` rounded capsule. This works poorly for long keyword lists and creates the large rounded outlines visible in browser QA.

The underlying canonical data is already appropriate:

- group name, such as `Technical Skills`;
- zero or more keywords, such as `Python`, `Java`, `React`, and `PostgreSQL`.

No data migration or schema change is required.

### 4.2 Approved visual behavior

Skill groups become clean Resume-style rows rather than pills.

Example:

```text
SKILLS

Technical Skills: Python, Java, C++, JavaScript, React, Node.js,
                  Flask, SQL, PostgreSQL, MongoDB, Git, GitHub

Strengths: Problem solving, Team collaboration, Fast learner,
           Clear communication
```

Required behavior:

- remove the capsule border/background treatment from each skill group;
- remove `border-radius: 999px` from skill groups;
- keep the group name visually stronger than its keywords;
- keep the existing colon after a group name when keywords exist;
- render keywords as normal Resume text, not badges/chips;
- allow long keyword lists to wrap naturally without clipping or horizontal overflow;
- preserve readable spacing between groups;
- preserve `dt`/`dd` semantics;
- use the same clean layout for screen preview and print/PDF output;
- preserve existing template, palette, and font behavior.

Use a small flex/wrapping row treatment: the group label and keyword text share a line when there is enough width; the keyword text may wrap naturally or move beneath the label at narrow widths. Do not recreate chip/pill styling through another class.

### 4.3 Scope boundary for Skills

Expected changes are limited to the shared Resume preview styling and directly related preview tests. `ResumePreview.tsx` should not need structural changes unless a minimal semantic adjustment is required by testing.

Do not alter:

- skill editing behavior;
- skill ordering controls;
- Resume canonical content;
- Resume versioning;
- Gemini skill extraction;
- Resume templates beyond the shared Skills presentation rule.

## 5. Track B — Optional candidate-photo extraction from imported PDFs

### 5.1 Current behavior

The current Resume PDF extraction service calls `PDFParse.getText()` and returns only:

- extracted text;
- page count;
- character count.

The resulting text is parsed into canonical Resume content. Embedded PDF images never become part of the import result, so Candidate Photo remains empty unless the user uploads a photo manually.

### 5.2 Design principle

PDF photo import is an optional convenience layered onto the existing secure Candidate Photo system.

The system must never assume that an embedded image is a person's photo. Resume PDFs may contain logos, icons, QR codes, decorative graphics, or other images.

The application therefore extracts a small bounded set of **possible photo candidates** and lets the user explicitly decide whether one should become the Candidate Photo.

No image is sent to Gemini for this feature.

### 5.3 Extraction order and boundary

Reuse the installed `pdf-parse` package's embedded-image extraction capability (`PDFParse.getImage()`). Do not install another PDF library.

Keep text import authoritative and perform photo extraction only **after**:

1. PDF text extraction has succeeded; and
2. Gemini has returned content that has passed the existing canonical Resume normalization/validation boundary.

This avoids creating temporary photo assets for an import that is already going to fail at the text/AI stage.

For the optional image pass:

- inspect embedded images on the **first PDF page only**;
- call image extraction with an explicit `imageThreshold: 80` rather than disabling filtering, matching the installed library's documented default while keeping behavior deterministic;
- detect the returned image format from its actual bytes rather than trusting arbitrary PDF metadata;
- only retain images that can be represented as an existing permitted Candidate Photo MIME type: JPEG, PNG, or WebP;
- run each retained image through the same Candidate Photo file validation policy already used for manual uploads, including magic-byte validation, 2 MB file-size limit, maximum side length, and maximum pixel count;
- silently skip images that are unsupported or fail Candidate Photo eligibility;
- deduplicate identical image bytes/checksums;
- sort usable candidates deterministically by pixel area from largest to smallest when dimensions are available, using stable extraction order as the tie-breaker;
- retain at most **3** candidate images for the review UI.

Image extraction is best-effort and subordinate to text import. A failure to extract images must not fail an otherwise valid text-based Resume import.

### 5.4 Temporary asset lifecycle and binding

Usable extracted candidates are stored using the existing private Asset system as temporary `resume-photo` assets.

Each candidate must be bound to the exact import that produced it. At minimum its private asset metadata must record:

- the `resume.import-pdf` Job ID; and
- the source Resume PDF Asset ID.

This binding is later verified during confirmation and prevents a client from substituting an arbitrary owned `resume-photo` Asset ID.

Requirements:

- keep owner scope on every asset;
- use the existing Candidate Photo validation policy before storage;
- use the existing bounded Candidate Photo staging lifetime of **15 minutes** for extracted candidates;
- candidate assets remain private;
- do not store image bytes/base64 inside the MongoDB Job result;
- store only candidate Asset IDs in the import-review result;
- preview candidates through the existing authenticated asset-content/signed-asset mechanisms rather than creating a public image route;
- candidate assets must not be promoted merely because extraction succeeded.

If the user abandons/cancels the import, temporary expiry remains the cleanup safety net. After successful adoption, every non-selected candidate should be cleaned up best-effort; if cleanup fails, its temporary expiry remains authoritative.

### 5.5 Import-review contract

The completed `resume.import-pdf` review result may gain an optional bounded field representing photo candidates.

Conceptually:

```text
{
  kind: "import-review",
  content: <canonical Resume content>,
  photoCandidates?: [
    { assetId: "..." },
    ... maximum 3
  ]
}
```

The exact TypeScript shape is chosen in the implementation plan, but the contract must satisfy:

- canonical Resume `content` remains unchanged;
- candidate photos are separate from Resume content;
- absence of candidates remains valid;
- candidate IDs must be strictly validated as bounded identifiers before the frontend uses them;
- raw image bytes, data URLs, width/height payloads, and untrusted PDF image metadata are not persisted in the Job result;
- the existing strict Resume content parser must not be weakened;
- job polling/progress semantics remain unchanged.

### 5.6 Import Review UI

When no usable embedded image is found, the current text import review behaves exactly as today.

When one or more candidates exist, add a compact section to the existing Import Review:

**Possible candidate photo from PDF**

Supporting copy must explain that images are extracted from the PDF and the user should select one only if it is their intended Candidate Photo.

UI requirements:

- show at most 3 candidate thumbnails;
- provide one mutually exclusive selection;
- include `Do not import a photo` as an explicit option;
- **default selection is `Do not import a photo`**;
- never preselect an image merely because only one candidate exists;
- each image option has an accessible label such as `Use extracted photo 1`;
- thumbnails must preserve aspect ratio and remain bounded;
- selected state must be visually and programmatically clear;
- the normal manual Candidate Photo feature remains available after import.

No face/person claim should appear in the UI. Use wording such as `Possible candidate photo`, not `We found your face` or `Profile photo detected`.

### 5.7 Confirmation/adoption flow

The user confirms the Resume import using the existing import-confirmation workflow plus an optional selected candidate Asset ID.

Server-side rules:

- `none`/omitted selection means create the Resume exactly as today with no Candidate Photo;
- a selected asset must belong to the same user;
- it must be a temporary, unexpired `resume-photo` asset;
- its metadata must match both the current Resume-import Job ID and the source Resume PDF Asset ID;
- arbitrary existing Asset IDs, including other owned Candidate Photos, must not be attachable through the import endpoint;
- only one selected candidate may be attached;
- the selected asset is promoted/attached to the newly created Resume using the existing Resume/Candidate Photo ownership model;
- `candidatePhotoAssetId` is set on the new Resume;
- `design.showProfilePhoto` becomes `true` when the extracted photo is successfully adopted;
- selected-photo asset metadata is updated to include the adopted Resume ID while remaining compatible with the existing Candidate Photo ownership checks;
- the original source PDF continues to be promoted/associated exactly as today;
- non-selected temporary candidate assets are removed best-effort after successful confirmation, while TTL cleanup remains the fallback.

The implementation should extend the existing Resume photo service with the smallest internal operation needed to attach a **validated staged Resume photo asset** to a newly created Resume. Do not duplicate Candidate Photo security logic in the import service.

The API must not report successful import adoption until the selected photo has been attached successfully. If the Resume/version has already been created but photo attachment fails, the existing source-PDF winner/idempotency path must allow a retry to finish the same import rather than creating another Resume.

### 5.8 Idempotency and concurrency

The existing import-confirmation idempotency must remain intact.

Requirements:

- repeated confirmation of an already-adopted import returns the same Resume/version identity;
- repeated confirmation with the same selected candidate does not attach a second photo or create duplicate Resume-photo assets;
- attachment of a staged candidate is guarded against the Resume's current Candidate Photo state, so two racing confirmations cannot attach different photos to the same imported Resume;
- if two requests race with different candidate selections, at most one candidate-photo association wins; the conflicting request must not replace the winner silently;
- a candidate asset that no longer exists, expired, or is no longer eligible causes a bounded import-confirmation conflict rather than attaching a different asset;
- the existing source-PDF deduplication/import winner behavior remains unchanged.

Do not add a new worker, distributed lock, or generic reservation service. Reuse the existing import confirmation, Resume ownership, Candidate Photo conflict, and source-PDF idempotency patterns.

## 6. Privacy and security

The uploaded Resume PDF and extracted candidate image are private user data.

Required controls:

- no candidate image is sent to Gemini;
- no face recognition, face detection, or identity inference;
- no public image URLs;
- owner-scoped asset access only;
- actual file signature and dimensions are validated using existing Candidate Photo policy;
- job results contain Asset IDs, not raw image bytes;
- temporary candidates expire automatically when abandoned;
- selected Candidate Photo uses the same private storage and authenticated/signed retrieval path as manually uploaded Candidate Photos;
- logging must not include image bytes, image data URLs, or Resume text.

## 7. Error handling

Photo extraction is optional and must not make text import less reliable.

Therefore:

- malformed/unsupported embedded images are skipped;
- no embedded images -> normal import continues;
- image extraction error -> normal import continues and no photo candidates are returned;
- temporary photo storage failure for an individual candidate -> skip that candidate when safe;
- text extraction or canonical Resume parsing failures retain their existing behavior;
- invalid/tampered selected asset ID at confirmation -> bounded 4xx conflict/validation error;
- selected candidate that expired before confirmation -> bounded conflict with guidance to complete the import without that photo or restart import;
- photo attachment failure must not silently report a successful import with a missing/incorrect photo.

If the user selects `Do not import a photo`, expired/unavailable extracted candidates must not block normal text-based import confirmation.

## 8. Accessibility and responsive behavior

Skills:

- no horizontal overflow with long keywords;
- normal text remains selectable;
- print layout remains readable.

Import Review:

- photo choice is keyboard accessible;
- radio/selection semantics are explicit;
- thumbnails have appropriate accessible labels without pretending to identify the person;
- focus behavior of the existing Create Resume dialog is preserved;
- mobile/narrow dialogs do not overflow horizontally;
- thumbnails wrap or stack cleanly on small screens.

## 9. Testing requirements

### 9.1 Skills tests

Add/update focused frontend tests proving:

- skill groups no longer use the capsule presentation;
- long technical skill lists remain present and naturally wrappable;
- group name and keywords remain semantically represented;
- print/shared preview uses the same cleaned Skills presentation;
- existing Resume template coverage still passes.

### 9.2 PDF image extraction tests

Add backend unit/integration coverage for:

- text-only PDF -> no photo candidates, import still succeeds;
- image extraction happens only after canonical Resume text parsing succeeds;
- PDF with one eligible first-page embedded image -> one temporary candidate;
- multiple eligible images -> deterministic bounded maximum of 3;
- images after page 1 are not offered;
- tiny/unsupported/invalid images -> skipped;
- candidate validation reuses Resume Photo limits;
- image extraction failure does not fail valid text import;
- candidate temporary metadata binds it to Job ID + source PDF Asset ID;
- no image bytes/base64 are persisted in the Job result.

Use repository fixtures/synthetic PDFs only. Do not commit real user Resume photos.

### 9.3 Import-review frontend tests

Cover:

- no candidate -> existing review unchanged;
- one candidate -> visible but not selected by default;
- multiple candidates -> one mutually exclusive selection;
- `Do not import a photo` is default;
- selected candidate Asset ID is sent only on confirmation;
- malformed candidate metadata is rejected;
- thumbnail retrieval remains owner-authenticated through existing asset APIs.

### 9.4 Confirmation/security tests

Cover:

- no selection -> imported Resume has no Candidate Photo;
- valid selected candidate -> photo attached and `showProfilePhoto=true`;
- cross-user candidate ID -> rejected;
- candidate from another import Job -> rejected;
- candidate tied to another source PDF -> rejected;
- expired/deleted candidate -> rejected when selected;
- expired non-selected candidate does not block `Do not import a photo`;
- arbitrary active Resume photo -> rejected;
- repeated confirmation -> same Resume/version, no duplicate photo;
- racing confirmations preserve one winning photo association;
- conflicting racing photo selections cannot silently replace each other;
- non-selected candidates are cleaned best-effort / remain temporary until cleanup;
- source Resume PDF association remains unchanged.

### 9.5 Qualification

After focused RED/GREEN tests:

- full backend suite;
- full frontend suite;
- backend typecheck;
- frontend typecheck;
- backend production build;
- frontend production build;
- `git diff --check`;
- human browser QA using at least:
  - one text-only Resume PDF;
  - one synthetic/test Resume PDF with one embedded candidate-style image;
  - one synthetic/test PDF with multiple embedded images if available.

## 10. Expected implementation boundary

The implementation plan should prefer existing files/services and introduce no new architectural layer.

Likely backend areas:

- `backend/src/modules/resume-analysis/pdf.service.ts`
- `backend/src/modules/resume-analysis/resumeAnalysis.service.ts`
- Resume import/job contract tests
- `backend/src/modules/resumes/resumePhoto.service.ts`
- existing Asset service/policy only for the smallest reusable metadata/staging support required

Likely frontend areas:

- `frontend/src/features/resumes/ResumeCreateDialog.tsx`
- `frontend/src/features/resumes/resumeContracts.ts` / import result parser as needed
- existing Resume API/import confirmation function
- existing authenticated Asset retrieval helper if one is already available
- `frontend/src/features/resumes/resumeWorkspace.css`
- `frontend/src/features/resumes/ResumePreview.test.tsx`
- existing Create Resume/import tests

The implementation plan must inspect exact current file boundaries after PR #19 is merged before finalizing this list.

## 11. Explicit non-goals

Do not add:

- automatic face detection;
- face recognition;
- image-to-person classification;
- Gemini vision analysis of Resume photos;
- OCR for scanned/image-only Resume PDFs;
- importing logos as Candidate Photos automatically;
- auto-selecting the largest image without user consent;
- image cropping/editor tooling;
- image compression pipeline;
- support for arbitrary PDF graphics as Resume assets;
- redesign of all Resume templates;
- new Resume schema fields for embedded images;
- bulk photo management;
- unrelated Phase work.

## 12. Acceptance criteria

The refinement is accepted when all of the following are true:

1. Long Skills groups no longer render inside large rounded capsules.
2. Skills remain readable, compact, naturally wrapping, and consistent in screen/print Resume output.
3. Text-only PDF import continues working exactly as after PR #19.
4. Embedded-image extraction happens only after successful canonical text parsing and is best-effort.
5. A PDF with eligible first-page embedded image(s) can present at most 3 private possible-photo choices during Import Review.
6. No extracted image is selected by default.
7. The user may explicitly choose one image or `Do not import a photo`.
8. A chosen image must be bound to the same user, import Job, and source PDF before it can become the imported Resume's existing Candidate Photo.
9. Successful chosen-photo adoption sets `candidatePhotoAssetId` and `showProfilePhoto=true`.
10. No image is sent to Gemini or stored as raw bytes/base64 in a Job result.
11. Cross-user, stale, arbitrary, or wrong-import candidate Asset IDs cannot be attached.
12. Racing/repeated confirmations cannot create duplicate Resumes or silently replace a winning Candidate Photo.
13. Abandoned/non-selected candidates do not become permanent orphan assets.
14. Manual Candidate Photo upload remains fully functional as the fallback.
15. Full frontend/backend qualification and browser QA pass before merge.

## 13. Governance

This written specification authorizes no production implementation by itself.

Next gates:

1. user approval of this written specification;
2. merge PR #19 only after separate explicit merge approval;
3. detailed TDD implementation plan based on updated `main` after PR #19 merge;
4. user approval of that implementation plan and GitHub execution;
5. ChatGPT implements through the GitHub connector on the approved feature branch;
6. user pulls and verifies locally;
7. repair loop on the same branch if needed;
8. explicit merge approval only after qualification.

Codex is not used for this Career Learning Hub workflow.
