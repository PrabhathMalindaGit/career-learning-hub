# Phase 19A-4 Candidate Photo Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Git staging, commits, pushes, PRs, and merges remain operator-controlled unless the operator explicitly authorizes direct GitHub branch writes.

**Goal:** Add one optional, private, user-controlled Candidate Photo to Resume Studio without changing ResumeContent/ResumeVersion, recovery, AI/ATS, or the native print architecture.

**Architecture:** Reuse the existing private Asset subsystem with a dedicated internal `resume-photo` purpose and an optional Resume-root `candidatePhotoAssetId`. Identity-changing photo operations use an explicit expected-current-attachment CAS, while Show/Hide reuse the existing partial Resume design endpoint. The browser performs a native local decode preflight before upload and separately fetches/decodes the canonical private source for preview/print readiness.

**Tech Stack:** React 19 + TypeScript + Vite + Vitest; Express 5 + TypeScript + Mongoose + Zod + Multer + Supertest; existing local/S3 private Asset adapters. No new dependency.

## Global Constraints

- Frozen authority: `docs/superpowers/specs/2026-08-11-resume-candidate-photo-support-design.md`.
- Selected architecture: `APPROACH A — BOUNDED EXTENSION OF THE EXISTING PRIVATE ASSET ARCHITECTURE`.
- Candidate Photo is optional and Resume-level only; never add it to `ResumeContent` or `ResumeVersion`.
- Keep Phase 19A-3 recovery content-only and structurally unchanged.
- Formats: JPEG, PNG, WebP only; reject SVG and unsupported types.
- Maximum encoded size: 2 MiB; maximum width/height: 4096 px; maximum total pixels: 16,000,000.
- Store the original validated raster; no cropper, Canvas re-encoding, `sharp`, transformation, or EXIF-stripping claim.
- Candidate Photo remains private; never expose storage keys, local paths, credentials, or permanent public URLs.
- Initial upload shows; replacement preserves the current visibility preference; Hide retains the Asset; Remove clears attachment and visibility.
- Photo operations create no ResumeVersion and do not affect AI/ATS/scoring.
- Preserve all three existing templates and native `window.print()` for current/historical A4/Letter output.
- No new dependency, destructive migration, Resume deletion feature, provider work, or Phase 19B+ expansion.
- Implementation uses strict RED → GREEN → bounded refactor cycles. If a failure appears, invoke `$systematic-debugging` before changing production code.
- Browser/Playwright is not part of the automated implementation gate; human Chrome QA is a separate operator handoff.

---

### Task 1: Add the internal Candidate Photo Asset policy and bounded raster-dimension validation

**Files:**
- Modify: `backend/src/modules/assets/asset.model.ts`
- Modify: `backend/src/modules/assets/asset.policy.ts`
- Modify: `backend/src/modules/assets/asset.schemas.ts`
- Test/Create: `backend/src/tests/unit/resumePhotoAssetPolicy.test.ts`

**Interfaces:**
- Consumes: existing `AssetPurpose`, `validateAssetFile`, generic `uploadAssetBodySchema`.
- Produces: internal purpose `resume-photo`; authoritative `validateAssetFile()` behavior that validates JPEG/PNG/WebP magic, 2 MiB limit, width/height ≤4096, total pixels ≤16,000,000; generic upload schema that intentionally excludes `resume-photo`.

- [ ] Write focused RED tests for accepted PNG/JPEG/WebP, SVG/unsupported MIME, signature mismatch, empty/oversize input, malformed/truncated raster headers, width/height over 4096, >16 MP, and generic upload rejection of `resume-photo`.
- [ ] Run `npm run test:unit --workspace @career-learning-hub/api -- src/tests/unit/resumePhotoAssetPolicy.test.ts` and confirm failures are caused by the missing policy/purpose behavior.
- [ ] Add `resume-photo` to the internal Asset model enum and purpose policy with 2 MiB limit, but define a separate generic-upload purpose tuple that omits it.
- [ ] Implement dependency-free bounded dimension parsers: PNG IHDR fixed offsets; JPEG bounded marker/segment scan for SOF dimensions; WebP VP8X/VP8/VP8L header parsing. Parsing operates only on the already size-bounded in-memory buffer and never claims complete raster decoding.
- [ ] Re-run the focused unit test and then existing Asset/storage unit tests.

### Task 2: Add Resume-root Candidate Photo identity and strict CAS schemas

**Files:**
- Modify: `backend/src/modules/resumes/resume.model.ts`
- Modify: `backend/src/modules/resumes/resume.types.ts`
- Modify: `backend/src/modules/resumes/resume.validation.ts`
- Test/Create: `backend/src/tests/unit/resumeCandidatePhotoValidation.test.ts`

**Interfaces:**
- Consumes: existing ObjectId conventions and partial design schema.
- Produces: optional `candidatePhotoAssetId?: Types.ObjectId`; required CAS field `expectedCandidatePhotoAssetId` represented as either a 24-hex Asset id or the literal `none` for an explicit expected-absence state; multipart upload body parser and JSON removal parser.

- [ ] Write RED schema tests proving omitted/malformed CAS is rejected, `none` is accepted only as explicit absence, valid 24-hex identifiers are accepted, and unrelated/mass-assignment fields are rejected.
- [ ] Run the focused validation test and confirm RED.
- [ ] Add the optional Resume-root reference with `ref: "Asset"`; do not touch ResumeVersion/ResumeContent.
- [ ] Add strict `candidatePhotoUploadBodySchema` and `candidatePhotoMutationBodySchema` around `expectedCandidatePhotoAssetId`.
- [ ] Re-run focused validation tests and the existing Resume design/version validation tests.

### Task 3: Implement owned Candidate Photo upload/replacement/remove/source lifecycle

**Files:**
- Create: `backend/src/modules/resumes/resumePhoto.service.ts`
- Modify: `backend/src/modules/resumes/resume.controller.ts`
- Modify: `backend/src/modules/resumes/resume.routes.ts`
- Modify: `backend/src/modules/resumes/resume.service.ts`
- Modify: `backend/src/middleware/rateLimit.ts`
- Test/Create: `backend/src/tests/integration/resumeCandidatePhoto.integration.test.ts`

**Interfaces:**
- Consumes: `createAsset`, `createSignedAssetUrl`, `AssetModel`, `requireOwnedResume`, `withMongoTransaction`, private storage cleanup primitives, `updateResumeDesign` partial semantics.
- Produces:
  - `POST /api/v1/resumes/:resumeId/candidate-photo` with multipart `file` + required `expectedCandidatePhotoAssetId`.
  - `GET /api/v1/resumes/:resumeId/candidate-photo/source` returning only `{ url, expiresAt }` after Resume↔Asset relation validation.
  - `DELETE /api/v1/resumes/:resumeId/candidate-photo` with required CAS body.
  - Initial upload sets visibility true; replacement preserves visibility; removal clears identity + visibility.

- [ ] Write RED integration cases for initial upload, replacement, hidden replacement, stale upload CAS, stale removal CAS, no-version creation, owned/foreign Resume behavior, relation-validated source, and cleanup-eligible old Asset state.
- [ ] Run the focused integration test and confirm RED.
- [ ] Add a dedicated Multer memory upload limited to one file and 2 MiB, after authentication and the existing authenticated-user Candidate Photo rate limiter.
- [ ] Implement `createOrReplaceCandidatePhoto`: create a temporary validated `resume-photo` Asset first; inside a Mongo transaction re-read the owned Resume, compare CAS, validate the staged Asset, activate it with `metadata.resumeId`, update `candidatePhotoAssetId`, and set `showProfilePhoto` to true only for initial upload. On successful replacement mark the previous Asset temporary/expired for cleanup; on failed association leave the new Asset temporary.
- [ ] Implement `removeCandidatePhoto`: transactionally validate CAS/relation, clear Resume identity, set visibility false, and mark the old Asset cleanup-eligible; then perform best-effort immediate physical deletion without rolling back the canonical Resume mutation if storage cleanup fails.
- [ ] Implement `getCandidatePhotoSource`: require owned Resume, current attachment, same owner, `resume-photo`, active status, and exact `metadata.resumeId`, then delegate to existing signed/private Asset target generation.
- [ ] Preserve `updateResumeDesign` as a partial field mutation; add the invariant that `showProfilePhoto: true` is rejected when no canonical Candidate Photo exists while false remains valid.
- [ ] Re-run focused integration tests plus existing Resume design/version/Asset lifecycle integration tests.

### Task 4: Harden backend ownership, generic-upload, rate-limit, mass-assignment, and logging boundaries

**Files:**
- Test/Create: `backend/src/tests/security/resumeCandidatePhoto.security.test.ts`
- Test/Modify when source-backed: `backend/src/tests/integration/crossUserAccess.integration.test.ts`
- Test/Modify when source-backed: `backend/src/tests/security/massAssignment.security.test.ts`
- Test/Modify when source-backed: `backend/src/tests/security/rateLimitBypass.security.test.ts`

**Interfaces:**
- Consumes: Task 1–3 routes/services and existing request-ID/error middleware.
- Produces: evidence that foreign Resume/Asset/source access is ownership-safe; `resume-photo` cannot be created through generic Asset upload; userId/storageKey/status/metadata cannot be mass-assigned; upload limiter cannot be bypassed with forwarded headers; errors do not expose private paths/keys/image bytes.

- [ ] Write RED/characterization security cases before any security-specific production repair.
- [ ] Run the focused security files and confirm any new requirement fails for the intended reason.
- [ ] Make only the smallest source change required by a failing security test; do not create a new security subsystem.
- [ ] Re-run focused security tests and adjacent ownership/security suites.

### Task 5: Extend strict frontend Resume contracts and Candidate Photo API calls

**Files:**
- Modify: `frontend/src/features/resumes/types.ts`
- Modify: `frontend/src/features/resumes/resumeContracts.ts`
- Modify: `frontend/src/features/resumes/resumeApi.ts`
- Test/Create: `frontend/src/features/resumes/resumeCandidatePhotoApi.test.ts`

**Interfaces:**
- Consumes: existing `apiRequest`, ObjectId parser, Resume envelope parser.
- Produces: `ResumeRecord.candidatePhotoAssetId?: string`; `CandidatePhotoSource { url: string; expiresAt: string }`; `uploadResumeCandidatePhoto`, `removeResumeCandidatePhoto`, `fetchResumeCandidatePhotoSource`; `updateResumeDesign` accepts `Partial<ResumeDesign>`.

- [ ] Write RED parser/API tests for absent/valid/invalid Candidate Photo id, exact source descriptor, multipart route/body/CAS, DELETE CAS body, and partial Show/Hide design requests.
- [ ] Run the focused frontend test and confirm RED.
- [ ] Add the optional id to strict Resume parsing without exposing Asset storage fields.
- [ ] Implement the three dedicated API functions using `expectedCandidatePhotoAssetId ?? "none"` for upload/replacement and the exact current id for removal.
- [ ] Narrow Show/Hide to partial design requests; preserve response identity checks.
- [ ] Re-run focused API/parser tests and existing Resume API/contract tests.

### Task 6: Implement dependency-free local decode and canonical private-source readiness

**Files:**
- Create: `frontend/src/features/resumes/resumeCandidatePhoto.ts`
- Test/Create: `frontend/src/features/resumes/resumeCandidatePhoto.test.ts`

**Interfaces:**
- Consumes: native `URL.createObjectURL`, `HTMLImageElement.decode()`, `fetch`, `CandidatePhotoSource`.
- Produces:
  - `preflightCandidatePhoto(file, isCurrentSelection)` which validates client MIME/2 MiB guidance, decodes the exact File, optionally checks dimensions, always revokes the temporary URL, and rejects obsolete selections.
  - `loadCanonicalCandidatePhoto(source, signal)` which fetches with credentials omitted + `referrerPolicy: "no-referrer"` + no-store, validates image MIME/≤2 MiB, creates/decodes a Blob URL, and returns a revocable canonical URL.

- [ ] Write RED tests for valid JPEG/PNG/WebP preflight, undecodable inputs producing no upload handoff, URL revocation on success/failure, obsolete delayed selection, canonical MIME/size rejection, abort/stale handling, and canonical decode failure.
- [ ] Run the focused helper test and confirm RED.
- [ ] Implement the smallest native helper; persist nothing to browser storage/recovery.
- [ ] Re-run focused tests and recovery regression tests.

### Task 7: Add Candidate Photo controls and portrait rendering

**Files:**
- Create: `frontend/src/features/resumes/ResumeCandidatePhotoControls.tsx`
- Create: `frontend/src/features/resumes/resumeCandidatePhoto.css`
- Modify: `frontend/src/features/resumes/ResumePreview.tsx`
- Test/Create: `frontend/src/features/resumes/ResumeCandidatePhotoControls.test.tsx`
- Test/Create: `frontend/src/features/resumes/ResumePreview.candidatePhoto.test.tsx`

**Interfaces:**
- Consumes: canonical attachment/visibility/source readiness supplied by ResumeWorkspace.
- Produces: keyboard-accessible Choose/Replace/Show/Hide/Remove controls and optional `candidatePhotoUrl?: string` portrait rendering in ATS Classic, Modern Professional, and Compact Technical with `alt=""` and bounded `object-fit: cover`.

- [ ] Write RED UI tests for no-photo, stored-hidden, visible, busy/error states, file input, Replace, Show, Hide, Remove confirmation trigger, and empty-alt portrait rendering across all template ids.
- [ ] Run focused component/preview tests and confirm RED.
- [ ] Implement accessible controls with neutral optional-photo guidance and no hiring/ATS claims.
- [ ] Add scoped responsive/print portrait CSS in the dedicated Candidate Photo stylesheet; no image transformation.
- [ ] Re-run focused component/preview tests and existing ResumePreview tests.

### Task 8: Integrate Candidate Photo orchestration into ResumeWorkspace and fix design-mutation isolation

**Files:**
- Modify: `frontend/src/features/resumes/ResumeWorkspace.tsx`
- Test/Create: `frontend/src/features/resumes/ResumeWorkspace.candidatePhoto.test.tsx`
- Reuse/read-only: `frontend/src/features/resumes/ResumeDesignControls.tsx`
- Reuse/read-only: `frontend/src/features/resumes/resumeRecovery.ts`
- Reuse/read-only: `frontend/src/features/resumes/resumeRecoveryWriter.ts`

**Interfaces:**
- Consumes: Tasks 5–7 API/helper/control/preview interfaces and existing `designMutationRef`.
- Produces: canonical photo source state, single-flight upload/replacement/show/hide/remove, source cleanup on attachment/route/user/unmount changes, print-readiness blocking, and preservation of photo identity/visibility through unrelated design/page-size changes.

- [ ] Write RED Workspace tests for visible design-save preservation, hidden design-save preservation, A4→Letter visible/hidden preservation, unsaved template/font/palette preview preservation, server-returned visibility adoption, no Candidate Photo id in unrelated design payloads, Show/Hide isolation, Remove preserving other design fields, shared-lock cross-overwrite prevention, and photo operations creating no ResumeVersion/recovery state.
- [ ] Run focused Workspace tests and confirm RED.
- [ ] Remove the three historical hard-coded `showProfilePhoto: false` compositions; use canonical server visibility instead.
- [ ] Add transient file-selection generation, local preflight → upload flow, canonical Resume adoption, source descriptor fetch/decode, object-URL cleanup, explicit Show/Hide via partial design mutation, and Remove confirmation/operation using the existing shared mutation lock.
- [ ] Pass the canonical photo URL into current preview, historical preview, print-only preview, and recovery review where current Resume-level design is intentionally reused.
- [ ] Extend `exportReadiness` so a visible attached photo blocks print while canonical source is loading or failed and becomes eligible only after canonical decode succeeds.
- [ ] Re-run focused Workspace tests and the existing full Resume feature tests.

### Task 9: Preserve recovery, versioning, history, and AI/ATS boundaries

**Files:**
- Modify only if required for display wiring: `frontend/src/features/resumes/ResumeRecoveryReview.tsx`
- Test/Create: `frontend/src/features/resumes/resumeCandidatePhotoBoundaries.test.tsx`
- Reuse/read-only: Resume recovery schema/writer and Resume analysis serialization.

**Interfaces:**
- Consumes: current Resume-level photo URL/design and immutable selected `ResumeVersion.content`.
- Produces: regression evidence that photo identity/bytes/URLs/metadata never enter recovery or analysis requests and photo mutations never increment `latestVersionNumber`.

- [ ] Write focused characterization tests for exact Phase 19A-3 recovery keys, analysis payload exclusion, immutable historical content, current Resume-level photo on historical rendering, and no version creation from photo actions.
- [ ] Run focused tests before any source adjustment.
- [ ] If a display-only recovery prop is required, add only the canonical current photo URL prop; do not alter recovery storage/parsing.
- [ ] Re-run focused boundary tests plus Resume recovery/history/analysis tests.

### Task 10: Complete non-browser verification and hand off human Chrome QA

**Files:**
- Modify: `docs/planning/CURRENT_PHASE.md` only after implementation source is ready for operator verification.

**Interfaces:**
- Consumes: all completed implementation tasks.
- Produces: a clean implementation handoff that makes no unverified pass claim.

- [ ] Run focused frontend Candidate Photo helper/control/API/Workspace/Preview/boundary tests.
- [ ] Run focused backend Candidate Photo policy/integration/security tests.
- [ ] Run complete frontend Vitest suite.
- [ ] Run complete backend unit, integration, and security suites.
- [ ] Run root/frontend/backend test typechecks as applicable and the production build.
- [ ] Run static changed-file scans for recovery/photo persistence, AI/ATS payload inclusion, raw storage/path leakage, and high-confidence secrets.
- [ ] Run `git diff --check` and exact changed-path review.
- [ ] If any command fails, invoke `$systematic-debugging`; after three unsuccessful code-changing attempts against the same root cause, stop and report evidence instead of weakening tests/security.
- [ ] Do not run Playwright/Codex browser in this automated gate.
- [ ] Hand the operator exact local startup commands/URLs and the frozen human QA matrix: no-photo; initial upload; replacement; Hide/Show/Remove; invalid/oversized/corrupt/failure states; all three templates; current/historical preview and print; A4/Letter; 1440×900, 768×1024, 390×844, actual Chrome 200%; keyboard/focus; long identity/contact content; logout/account boundary; private/cross-user source; no AI/ATS influence.

## Plan self-review

- Every frozen decision P19A4-D01 through P19A4-D17 is mapped above.
- The exact Candidate Photo identifier is `candidatePhotoAssetId` (`Types.ObjectId` backend, optional ObjectId string frontend).
- The exact CAS field is `expectedCandidatePhotoAssetId`; upload/replacement multipart sends either a 24-hex id or literal `none`, while removal sends the current 24-hex id in a strict JSON body.
- Show/Hide reuse the existing partial `PATCH /api/v1/resumes/:resumeId/design` contract with only `{ showProfilePhoto: boolean }`.
- Server raster dimensions use bounded native Buffer header parsing only; no dependency.
- Generic Asset upload uses a public/generic purpose tuple that excludes `resume-photo` even though the internal model/policy recognizes it.
- No Git commit step, browser automation step, Gemini call, package addition, recovery schema expansion, ResumeVersion expansion, or Phase 19B+ work appears in the plan.
