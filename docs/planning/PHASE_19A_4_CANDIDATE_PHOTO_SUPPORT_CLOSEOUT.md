# Phase 19A-4 — Candidate Photo Support Closeout

## Status

`IMPLEMENTED / FINAL AUTOMATED VERIFICATION PASSED / HUMAN QA PASSED / PR READY FOR REVIEW / NOT MERGED`

Phase 19A-4 is implementation-complete and verified on the feature branch. The final executable code checkpoint passed the complete local automated gate, the relevant Candidate Photo and Resume Studio workflows were exercised in real Chrome, and PR #8 has been prepared for final review. No merge or deployment is authorized by this record.

## Identity

- Phase: `19A-4 — Candidate Photo Support`
- Feature branch: `phase-19a-4-candidate-photo-support`
- Main/base commit: `ad10229aa64cc79b4503901d8b59ac127fac0a20`
  (`Record Phase 19A-3 merge closeout`)
- Frozen-design commit: `3b4855926f842a95ca1e11631059af1aeb1abce8`
  (`Record Phase 19A-4 frozen design`)
- Final executable code checkpoint:
  `bd134bf361b18deb48b6bb697e88c14ccab852fc`
  (`Cancel in-flight snapshot when editing begins`)
- Design specification:
  `docs/superpowers/specs/2026-08-11-resume-candidate-photo-support-design.md`
- Implementation plan:
  `docs/superpowers/plans/2026-08-12-resume-candidate-photo-support.md`
- Pull request: `PR #8 — Complete Phase 19A-4 Candidate Photo Support`
- PR status at closeout: `READY FOR REVIEW / OPEN / NOT MERGED`
- Deployment status: `NOT PART OF THIS PHASE CLOSEOUT`

The documentation reconciliation commit hash is intentionally not self-recorded in this same file; the executable checkpoint above is the exact code state on which the final automated gate was run.

## Approval and process truthfulness

- Human design approval token:
  `PHASE_19A4_CANDIDATE_PHOTO_SUPPORT_DESIGN_APPROVED`
- Design approval token accepted: `YES`
- Frozen design fidelity review: `PASSED / ACCEPTED`
- Implementation was subsequently authorized and performed directly on the GitHub feature branch.
- No claim is made that a separate `PHASE_19A4_IMPLEMENTATION_PLAN_APPROVED` token was accepted; that token was not part of the final authorization path.
- Main remained untouched throughout implementation and verification.

## Approved architecture preserved

Phase 19A-4 implements the approved bounded extension of the existing private Asset architecture:

- one optional Resume-root `candidatePhotoAssetId`;
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
- deliberate helper text instead of browser-native `Choose File / No file chosen` chrome;
- `Candidate photo preview` thumbnail alternative text;
- decorative empty-alt semantics for the portrait embedded beside the candidate identity;
- responsive and reduced-motion-compatible presentation.

The file-picker visual refinement was requested during human QA and implemented without changing Candidate Photo storage, API, validation, or lifecycle semantics.

## Snapshot-editing defect discovered during human QA

Human QA exposed a general Resume Studio state inconsistency unrelated to language serialization:

1. a saved/read-only version snapshot could remain open;
2. the current editor still accepted changes;
3. the draft became dirty;
4. `Save new version` remained disabled because the snapshot was still selected.

The language path itself was healthy. Returning manually to the current draft allowed the edited Language to save successfully as the next Resume version.

### First RED → GREEN repair

A regression test reproduced the loaded-snapshot case:

- RED: editing was accepted but `Read-only version 1` remained visible;
- minimal production repair: an actual editor change clears an already-loaded snapshot;
- GREEN: focused snapshot test passed;
- existing `ResumeWorkspace.test.tsx`: `61/61 PASS`;
- frontend typecheck: `PASS`;
- frontend production build: `PASS`;
- `git diff --check`: `PASS`;
- real Chrome confirmation: `PASS`.

### Late-response race discovered during final diff review

Final review found a second edge case: if the saved snapshot was still loading when editing began, its late response could reopen the read-only snapshot.

A second test-first repair covered that race:

- RED: the original loaded-snapshot test remained green while the new late-response test failed because `Read-only version 1` reopened;
- root cause: editor changes did not abort `snapshotControllerRef` while a saved-version request was in flight;
- minimal production repair: editing aborts and clears the in-flight snapshot controller, clears `snapshotLoadingId`, and clears any already-loaded snapshot;
- existing `handleViewVersion()` already checks `controller.signal.aborted` before applying the returned snapshot, so no new request-generation architecture was added;
- GREEN focused snapshot suite: `2/2 PASS`.

The existing rule that an intentionally selected historical snapshot remains non-saveable until the user returns to the current draft is preserved.

## Human Chrome QA evidence

The operator ran the local frontend/backend with healthy API/database/storage readiness and confirmed the relevant Candidate Photo and Resume Studio workflows in real Chrome.

Human QA evidence includes:

- no-photo state;
- valid photo upload and saved private-photo rendering;
- shown and hidden states;
- Show on Resume / Hide from Resume;
- Remove photo confirmation and confirmed removal;
- refined Choose/Replace picker presentation without native filename chrome;
- Candidate Photo in the current Resume preview;
- Candidate Photo in saved-version/historical presentation using the current Resume-level photo state;
- Candidate Photo in browser print preview when visible;
- the original snapshot-editing defect reproduced in the real application;
- manual `Return to current draft` confirmed the Language save path itself was healthy;
- post-repair browser confirmation that editing a selected saved snapshot returns to the current draft, preserves the edit, re-enables `Save new version`, and saves the new version successfully.

Automated coverage additionally exercises replacement, invalid input, ownership, validation, source access, and lifecycle boundaries that were not all separately asserted as manual-browser observations.

## Final automated verification

The complete final gate was run locally against exact executable HEAD:

`bd134bf361b18deb48b6bb697e88c14ccab852fc`

Results:

- Frontend complete suite: `70/70 files`, `906/906 tests PASS`
- Backend unit: `15/15 files`, `205/205 tests PASS`
- Backend integration: `19/19 files`, `192/192 tests PASS`
- Backend security: `4/4 files`, `36/36 tests PASS`
- Total final recorded tests: `1,339 PASS`
- Monorepo typecheck (frontend/backend/shared-types): `PASS`
- Backend test-source typecheck: `PASS`
- Production build (frontend + backend): `PASS`
- `git diff --check`: `PASS`
- Worktree before/after final verification: `CLEAN`
- Final executable HEAD after verification: unchanged at `bd134bf361b18deb48b6bb697e88c14ccab852fc`

A separate complete Resume feature gate immediately before the repository-wide gate also passed:

- `frontend/src/features/resumes`: `30/30 files`, `294/294 tests PASS`
- focused snapshot-editing suite: `2/2 PASS`

## Known non-blocking diagnostics

The final gate retained known non-failing diagnostics that are outside the Phase 19A-4 blocking scope:

- `InterviewSessionWorkspace.test.tsx` emits a React Router/ErrorBoundary `TypeError` diagnostic during a test that nevertheless completes successfully; the complete frontend suite remains green;
- `ResumeVersionTimeline.test.tsx` emits an existing duplicate React key warning for a fixture path; the suite remains green;
- the rate-limit spoof-resistance security test intentionally exercises `X-Forwarded-For` with `trust proxy` disabled and emits the express-rate-limit validation diagnostic while the security test passes;
- Vite reports ignored React Router `use client` directives;
- Vite reports that `resumeCandidatePhotoGateway.ts` dynamically imports `resumeApi.ts` while other modules import it statically, so it does not create a separate chunk;
- the application JavaScript bundle remains above Vite's default 500 kB advisory threshold.

None of these diagnostics produced a failed test, failed typecheck, or failed production build in the final gate.

## Final scope review

The final `main...phase-19a-4-candidate-photo-support` comparison is based on main baseline `ad10229aa64cc79b4503901d8b59ac127fac0a20` and contains the Candidate Photo / Resume presentation implementation, directly relevant tests, the frozen design and implementation plan, the bounded Resume snapshot-editing repair found during QA, rate-limit wiring for the dedicated photo route, and phase documentation.

The changed-file set contains no package manifest, lockfile, environment file, deployment configuration, migration, or shared-types package change.

The branch is ahead of main and not behind it. Main is not modified by this closeout.

## Release control

- PR #8 is ready for final human review.
- PR #8 is open and not merged.
- No merge to `main` is authorized by this document.
- No deployment is authorized by this document.
- Final merge requires explicit operator approval.
- After an authorized merge, perform a separate post-merge documentation reconciliation on `main` if needed to record the merge commit and activate the next execution phase.
