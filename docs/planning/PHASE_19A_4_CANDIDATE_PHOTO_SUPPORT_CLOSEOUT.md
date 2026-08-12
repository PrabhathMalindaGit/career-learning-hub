# Phase 19A-4 — Candidate Photo Support Closeout

## Status

`IMPLEMENTED / FINAL REPAIRED AUTOMATED VERIFICATION PASSED / HUMAN QA PASSED / FINAL GOVERNANCE RECONCILIATION PENDING / PR DRAFT / NOT MERGED`

Phase 19A-4 is implementation-complete and executable verification is complete on the feature branch. Candidate Photo behavior, the Resume snapshot-editing repair found during human QA, and the two P2 findings raised during PR review have all been repaired and verified. Only truthful reconciliation of the controlling `docs/planning/CURRENT_PHASE.md` block and the final documentation-only PR handoff remain before PR #8 may return to Ready for review.

No merge or deployment is authorized by this record.

## Identity

- Phase: `19A-4 — Candidate Photo Support`
- Feature branch: `phase-19a-4-candidate-photo-support`
- Main/base commit: `ad10229aa64cc79b4503901d8b59ac127fac0a20`
  (`Record Phase 19A-3 merge closeout`)
- Frozen-design commit: `3b4855926f842a95ca1e11631059af1aeb1abce8`
  (`Record Phase 19A-4 frozen design`)
- Final executable code checkpoint:
  `ff7e84572d029f01cf61f4fee873f11204a6a75e`
  (`Protect attached Candidate Photos from generic deletion`)
- Design specification:
  `docs/superpowers/specs/2026-08-11-resume-candidate-photo-support-design.md`
- Implementation plan:
  `docs/superpowers/plans/2026-08-12-resume-candidate-photo-support.md`
- Pull request: `PR #8 — Complete Phase 19A-4 Candidate Photo Support`
- PR status at this record: `DRAFT / OPEN / NOT MERGED`
- Deployment status: `NOT PART OF THIS PHASE CLOSEOUT`

The documentation-only reconciliation commit hash is intentionally not self-recorded in this file. The executable checkpoint above is the exact code state on which the fresh repaired repository-wide gate was run.

## Approval and process truthfulness

- Human design approval token:
  `PHASE_19A4_CANDIDATE_PHOTO_SUPPORT_DESIGN_APPROVED`
- Design approval token accepted: `YES`
- Frozen design fidelity review: `PASSED / ACCEPTED`
- Implementation was subsequently authorized and performed directly on the GitHub feature branch.
- No claim is made that a separate `PHASE_19A4_IMPLEMENTATION_PLAN_APPROVED` token was accepted; that token was not part of the final authorization path.
- `main` remained untouched throughout implementation and verification.

## Approved architecture preserved

Phase 19A-4 implements the approved bounded extension of the existing private Asset architecture:

- optional Resume-root `candidatePhotoAssetId`;
- independent `Resume.design.showProfilePhoto` visibility;
- no Candidate Photo field in `ResumeContent` or `ResumeVersion`;
- no Candidate Photo identity, file, bytes, Blob URL, signed URL, dimensions, or metadata in Resume recovery;
- no Candidate Photo input to Gemini, Resume analysis, ATS scoring, keyword scoring, rewrites, or ML scoring;
- JPEG, PNG, and WebP only;
- maximum encoded size 2 MiB;
- maximum width and height 4096 px;
- maximum total raster area 16,000,000 pixels;
- browser-native local decode preflight before upload;
- authoritative backend MIME, magic-byte, size, and bounded raster-dimension validation;
- original validated raster stored without cropper, Canvas re-encoding, `sharp`, transformation, or EXIF-stripping claim;
- private source access only after Resume/Asset ownership and relation validation;
- CAS-protected identity-changing upload, replacement, and removal;
- initial upload shows the photo;
- replacement preserves current visibility;
- Hide retains the canonical Asset;
- Show changes visibility only;
- Remove clears attachment and visibility without creating a ResumeVersion;
- ATS Classic, Modern Professional, and Compact Technical support the optional portrait;
- historical Resume content remains immutable while current Resume-level design/photo presentation is used;
- native browser print remains authoritative for current/historical A4 and Letter output;
- no new dependency was introduced.

## Candidate Photo UI and accessibility

The Resume Studio Candidate Photo panel supports:

- Choose photo;
- Replace photo;
- Show on Resume;
- Hide from Resume;
- Remove photo with explicit confirmation;
- canonical saved-photo loading/retry behavior;
- keyboard-operable native file selection;
- a visually hidden real file input with a styled Choose/Replace trigger;
- deliberate helper text instead of browser-native filename chrome;
- `Candidate photo preview` thumbnail alternative text;
- decorative empty-alt semantics for the portrait embedded beside candidate identity;
- responsive and reduced-motion-compatible presentation.

The file-picker visual refinement requested during human QA changed presentation only; Candidate Photo storage, API, validation, and lifecycle semantics remained intact.

## Resume snapshot-editing repairs discovered during QA/review

Human QA exposed a general Resume Studio state inconsistency: a saved/read-only version snapshot could remain selected while the current editor accepted changes, making the draft dirty while `Save new version` stayed disabled.

The Language data path itself was healthy; manually returning to the current draft allowed the edit to save as the next Resume version.

### Loaded-snapshot RED → GREEN

- RED: editing was accepted but `Read-only version 1` remained visible and Save stayed disabled.
- Minimal repair: a real editor change clears an already-loaded snapshot.
- GREEN focused regression: `1/1 PASS` at that stage.
- Existing `ResumeWorkspace.test.tsx`: `61/61 PASS`.
- Frontend typecheck and production build: `PASS`.
- Real Chrome confirmation: `PASS`.

### In-flight late-response RED → GREEN

Final review then found the corresponding race while a snapshot request was still loading.

- RED: the loaded-snapshot test stayed green while a new late-response test failed because the completed request reopened the read-only snapshot.
- Root cause: editor changes did not abort `snapshotControllerRef` while a version request was in flight.
- Minimal repair: editing aborts and clears the in-flight controller, clears `snapshotLoadingId`, and clears any already-loaded snapshot.
- Existing `handleViewVersion()` already ignores results from an aborted controller; no generation-counter/request subsystem was added.
- Final focused snapshot-editing suite: `2/2 PASS`.
- Real Chrome confirmation after repair: `PASS`.

The rule that an intentionally selected historical snapshot remains non-saveable until the user returns to or edits the current draft remains preserved.

## PR-review P2 repairs

When PR #8 was first moved to review, automated review identified two valid P2 findings. Both were independently reproduced RED before production changes.

### P2-1 — Malformed PNG IHDR acceptance

Original parser behavior trusted `IHDR` at bytes 12–15 and dimensions at bytes 16–23 without requiring the mandatory 13-byte IHDR data extent.

- RED regression: deliberately truncated 24-byte pseudo-IHDR was accepted; focused result `1 failed / 12 passed`.
- Fix commit: `933937ec3ab60b5cab6bac2bc02277c4729ef1ee`.
- Repair: PNG Candidate Photo dimension parsing requires the complete bounded IHDR extent and declared IHDR data length exactly `13`.
- GREEN: `resumePhotoAssetPolicy.test.ts` `13/13 PASS`.
- Review thread: `RESOLVED` with RED→GREEN evidence.

### P2-2 — Generic deletion of attached Candidate Photo

The generic authenticated Asset DELETE route could delete an active attached `resume-photo`, leaving the Resume with a dangling `candidatePhotoAssetId`.

- RED regression: generic asset DELETE returned HTTP `204` where attached-photo protection required `409`.
- Fix commit: `ff7e84572d029f01cf61f4fee873f11204a6a75e`.
- Repair: generic deletion rejects an active attached `resume-photo` with `RESUME_PHOTO_ATTACHED`.
- Dedicated replacement/removal cleanup remains valid because the Resume transaction first retires the old Asset to `temporary`; cleanup of retired/staged photos is therefore still permitted.
- GREEN: `resumeCandidatePhoto.integration.test.ts` `4/4 PASS`.
- Review thread: `RESOLVED` with RED→GREEN evidence.

## Human Chrome QA evidence

The operator ran the local application and confirmed the relevant Candidate Photo and Resume Studio workflows in real Chrome, including:

- no-photo state;
- valid Candidate Photo upload and private saved-photo rendering;
- shown and hidden states;
- Show on Resume / Hide from Resume;
- refined Choose/Replace picker presentation;
- Remove photo confirmation and confirmed removal;
- Candidate Photo in current Resume preview;
- Candidate Photo in saved-version/historical presentation using current Resume-level photo state;
- Candidate Photo in browser print preview when visible;
- original snapshot-editing defect reproduction;
- manual Return to current draft proving the Language serialization/save path was healthy;
- post-repair confirmation that editing a selected saved snapshot returns to the current draft, preserves the edit, enables Save, and successfully creates the next Resume version.

Automated coverage additionally exercises replacement, invalid input, ownership, source access, validation, and lifecycle boundaries not all separately asserted as manual-browser observations.

## Final repaired automated verification

The complete final repaired gate was run locally against exact executable HEAD:

`ff7e84572d029f01cf61f4fee873f11204a6a75e`

Results:

- Frontend complete suite: `70/70 files`, `906/906 tests PASS`
- Backend unit: `15/15 files`, `206/206 tests PASS`
- Backend integration: `19/19 files`, `193/193 tests PASS`
- Backend security: `4/4 files`, `36/36 tests PASS`
- Total final recorded executable tests: `1,341 PASS`
- Monorepo typecheck (frontend/backend/shared-types): `PASS`
- Backend test-source typecheck: `PASS`
- Production build (frontend + backend): `PASS`
- `git diff --check`: `PASS`
- Worktree before/after final verification: `CLEAN`
- Final executable HEAD after verification: unchanged at `ff7e84572d029f01cf61f4fee873f11204a6a75e`

A separate Resume feature gate before the earlier complete gate also passed `30/30 files`, `294/294 tests`, and the final focused snapshot suite passed `2/2`.

## Known non-blocking diagnostics

The repaired final gate retained known non-failing diagnostics outside the Phase 19A-4 blocking scope:

- `InterviewSessionWorkspace.test.tsx` emits a React Router/ErrorBoundary `TypeError` diagnostic during a test that nevertheless completes successfully; the complete frontend suite is green;
- `ResumeVersionTimeline.test.tsx` emits an existing duplicate React key warning for a fixture path; the suite is green;
- the rate-limit spoof-resistance test intentionally exercises `X-Forwarded-For` with `trust proxy` disabled and emits the express-rate-limit validation diagnostic while the security test passes;
- Vite reports ignored React Router `use client` directives;
- Vite reports the `resumeCandidatePhotoGateway.ts` dynamic import of `resumeApi.ts` does not create a separate chunk because `resumeApi.ts` is also statically imported elsewhere;
- the application JavaScript bundle remains above Vite's default 500 kB advisory threshold.

None produced a failed test, typecheck, or production build.

## Final scope review

The final executable `main...phase-19a-4-candidate-photo-support` comparison is based on main baseline `ad10229aa64cc79b4503901d8b59ac127fac0a20`.

At executable checkpoint `ff7e84572d029f01cf61f4fee873f11204a6a75e` the branch was `49 commits ahead / 0 behind` main. The changed-file set was bounded to:

- Candidate Photo / Resume presentation implementation;
- dedicated backend validation/lifecycle/rate-limit wiring;
- directly relevant frontend/backend tests;
- the bounded Resume snapshot-editing repair discovered during QA;
- the two validated PR-review repairs;
- Phase 19A-4 design, plan, and closeout documentation.

No package manifest, lockfile, environment file, deployment configuration, migration, or shared-types package change is included.

Main was not modified by this closeout.

## Remaining governance reconciliation

Executable implementation and verification are complete. Before PR #8 returns to Ready for review:

1. reconcile the stale top authority block in `docs/planning/CURRENT_PHASE.md` with this final verified state;
2. resolve the corresponding governance review thread;
3. perform a final `main...feature` comparison after the documentation-only reconciliation;
4. mark PR #8 Ready for review.

A documentation-only reconciliation does not require rerunning the executable 1,341-test gate. The final executable checkpoint remains `ff7e84572d029f01cf61f4fee873f11204a6a75e`.

## Release control

- PR #8 remains open and Draft while governance reconciliation is pending.
- PR #8 is not merged.
- No merge to `main` is authorized by this document.
- No deployment is authorized by this document.
- Final merge requires separate explicit operator approval.
- After an authorized merge, perform a separate post-merge documentation reconciliation on `main` if needed to record the merge commit and activate the next execution phase.
