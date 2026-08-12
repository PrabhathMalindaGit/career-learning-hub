# Phase 19A-4 — Candidate Photo Support Closeout

## Status

`IMPLEMENTED / FINAL REPAIRED AUTOMATED VERIFICATION PASSED / HUMAN QA PASSED / PR REVIEW FINDINGS RESOLVED / READY FOR REVIEW / NOT MERGED`

Phase 19A-4 is implementation-complete and verified on the feature branch. Candidate Photo support, the Resume snapshot-editing repairs discovered during QA/review, and both P2 findings raised during PR review are repaired and verified. The controlling `CURRENT_PHASE.md` pre-implementation state was reconciled in documentation commit `7c96b52c4fb70ffc8de4ada7d6bb0b9b32d7de88`.

No merge or deployment is authorized by this record.

## Identity

- Phase: `19A-4 — Candidate Photo Support`
- Feature branch: `phase-19a-4-candidate-photo-support`
- Main/base commit: `ad10229aa64cc79b4503901d8b59ac127fac0a20`
  (`Record Phase 19A-3 merge closeout`)
- Frozen-design commit: `3b4855926f842a95ca1e11631059af1aeb1abce8`
- Final executable code checkpoint:
  `ff7e84572d029f01cf61f4fee873f11204a6a75e`
  (`Protect attached Candidate Photos from generic deletion`)
- Current-phase reconciliation commit:
  `7c96b52c4fb70ffc8de4ada7d6bb0b9b32d7de88`
- Design specification:
  `docs/superpowers/specs/2026-08-11-resume-candidate-photo-support-design.md`
- Implementation plan:
  `docs/superpowers/plans/2026-08-12-resume-candidate-photo-support.md`
- Pull request: `PR #8 — Complete Phase 19A-4 Candidate Photo Support`
- Deployment status: `NOT PART OF THIS PHASE CLOSEOUT`

The executable checkpoint is intentionally separate from later documentation-only closeout commits. The complete 1,341-test gate was run against `ff7e84572d029f01cf61f4fee873f11204a6a75e`; documentation-only reconciliation did not alter executable behavior.

## Approval and process truthfulness

- Human design approval token:
  `PHASE_19A4_CANDIDATE_PHOTO_SUPPORT_DESIGN_APPROVED`
- Design approval token accepted: `YES`
- Frozen design fidelity review: `PASSED / ACCEPTED`
- Implementation was authorized and performed directly on the GitHub feature branch.
- No claim is made that `PHASE_19A4_IMPLEMENTATION_PLAN_APPROVED` was accepted; it was not part of the final authorization path.
- `main` remained untouched throughout implementation, verification, repair, and closeout.
- Merge requires a separate explicit operator instruction.

## Implemented architecture

Phase 19A-4 preserves the approved bounded extension of the existing private Asset architecture:

- optional Resume-root `candidatePhotoAssetId`;
- independent `Resume.design.showProfilePhoto` visibility;
- no Candidate Photo field in `ResumeContent` or immutable `ResumeVersion` content;
- no Candidate Photo data in recovery, Gemini, Resume analysis, ATS scoring, keyword scoring, rewrites, or ML scoring;
- JPEG, PNG, and WebP only;
- maximum encoded size 2 MiB;
- maximum width/height 4096 px;
- maximum raster area 16,000,000 pixels;
- browser-native decode preflight before upload;
- authoritative backend MIME, magic-byte, size, and bounded raster validation;
- original validated raster stored privately without cropper, re-encoding dependency, transformation, or metadata-stripping claim;
- private source access after Resume/Asset ownership and association validation;
- CAS-protected upload, replacement, and removal;
- initial upload shows the photo;
- replacement preserves current visibility;
- Hide retains the canonical Asset;
- Show changes visibility only;
- Remove clears attachment and visibility without creating a ResumeVersion;
- ATS Classic, Modern Professional, and Compact Technical support the optional photo;
- historical Resume content stays immutable while current Resume-level photo/design presentation is used;
- native browser print remains authoritative;
- no new dependency was introduced.

## Candidate Photo UI and accessibility

The Resume Studio Candidate Photo panel provides:

- Choose photo / Replace photo;
- Show on Resume / Hide from Resume;
- Remove photo with explicit confirmation;
- private saved-photo loading and retry behavior;
- keyboard-operable native file input behind the styled picker;
- deliberate helper text rather than browser-native filename chrome;
- `Candidate photo preview` thumbnail alternative text;
- decorative empty-alt semantics for the Resume portrait;
- responsive and reduced-motion-compatible presentation.

## Resume snapshot-editing repairs

Human QA exposed a state inconsistency where a saved/read-only snapshot could remain selected while the current editor accepted changes, leaving `Save new version` disabled.

### Loaded snapshot

- RED reproduced the defect.
- Minimal repair clears an already-loaded snapshot when an actual current-draft edit begins.
- Existing `ResumeWorkspace.test.tsx`: `61/61 PASS`.
- Real Chrome confirmation: `PASS`.

### In-flight snapshot race

Final review found the corresponding race when a saved snapshot request was still loading.

- RED kept the loaded-snapshot regression green while the new late-response case failed.
- Root cause: editor changes did not abort `snapshotControllerRef` while the saved-version request was in flight.
- Minimal repair aborts/clears the controller, clears snapshot loading state, and clears any loaded snapshot.
- Existing `handleViewVersion()` already ignores an aborted result, so no new request subsystem was introduced.
- Focused snapshot-editing suite: `2/2 PASS`.
- Real Chrome post-repair confirmation: `PASS`.

## PR-review P2 repairs

### P2-1 — malformed PNG IHDR acceptance

- RED: deliberately truncated 24-byte pseudo-IHDR was accepted (`1 failed / 12 passed`).
- Fix: `933937ec3ab60b5cab6bac2bc02277c4729ef1ee`.
- Parser now requires a complete bounded IHDR extent and declared IHDR data length exactly `13`.
- GREEN: `resumePhotoAssetPolicy.test.ts` `13/13 PASS`.
- Review thread: `RESOLVED`.

### P2-2 — generic deletion of attached Candidate Photo

- RED: generic Asset DELETE returned HTTP `204` where active attached-photo protection required `409`.
- Fix: `ff7e84572d029f01cf61f4fee873f11204a6a75e`.
- Generic deletion now rejects an active attached `resume-photo` with `RESUME_PHOTO_ATTACHED`.
- Dedicated Resume replacement/removal remains valid because retired photos are made temporary before cleanup.
- GREEN: `resumeCandidatePhoto.integration.test.ts` `4/4 PASS`.
- Review thread: `RESOLVED`.

### Governance review finding

The PR review also correctly reported that the controlling `CURRENT_PHASE.md` block still described Phase 19A-4 as not implemented/not verified/not QA'd.

- Reconciliation commit: `7c96b52c4fb70ffc8de4ada7d6bb0b9b32d7de88`.
- The authority block now records implementation complete, human QA passed, executable checkpoint `ff7e84572d029f01cf61f4fee873f11204a6a75e`, and the final repaired `1,341/1,341` automated result.
- Governance review thread: `RESOLVED`.

## Human Chrome QA

The operator confirmed the relevant workflows in the real local application, including:

- no-photo state;
- valid photo upload and private saved-photo rendering;
- shown/hidden state and Show/Hide behavior;
- refined Choose/Replace picker;
- Remove confirmation and confirmed removal;
- current Resume preview;
- saved-version/historical presentation using current Resume-level photo state;
- browser print preview with visible photo;
- original snapshot-editing defect reproduction;
- manual return-to-current-draft confirmation that Language saving itself was healthy;
- post-repair confirmation that editing a selected saved snapshot returns to the current draft, preserves the edit, enables Save, and successfully creates the next Resume version.

Automated coverage additionally exercises replacement, invalid input, ownership, source access, validation, and lifecycle boundaries.

## Final repaired automated verification

Fresh complete local gate at exact executable HEAD:

`ff7e84572d029f01cf61f4fee873f11204a6a75e`

Results:

- Frontend: `70/70 files`, `906/906 tests PASS`
- Backend unit: `15/15 files`, `206/206 tests PASS`
- Backend integration: `19/19 files`, `193/193 tests PASS`
- Backend security: `4/4 files`, `36/36 tests PASS`
- Total executable tests: `1,341/1,341 PASS`
- Monorepo typecheck: `PASS`
- Backend test-source typecheck: `PASS`
- Frontend + backend production build: `PASS`
- `git diff --check`: `PASS`
- Worktree before/after verification: `CLEAN`
- Final executable HEAD after verification: unchanged.

Known non-failing diagnostics remained unchanged: the pre-existing Interview ErrorBoundary stderr, duplicate React-key warning in the Resume version-timeline fixture, expected express-rate-limit forwarded-header diagnostic, React Router/Vite directive warnings, Candidate Photo dynamic/static-import advisory, and the existing >500 kB chunk advisory. None failed a gate.

## Final scope review

The branch remains based on `main` at `ad10229aa64cc79b4503901d8b59ac127fac0a20` and is not behind main.

The changed-file set is bounded to:

- Candidate Photo / Resume presentation implementation;
- backend validation/lifecycle/rate-limit wiring;
- directly relevant frontend/backend tests;
- the bounded Resume snapshot-editing repair;
- the two validated PR-review repairs;
- Phase 19A-4 design, plan, current-phase, and closeout documentation.

No package manifest, lockfile, environment file, deployment configuration, migration, or shared-types package change is included.

## Release control

- PR #8 is ready for review.
- PR #8 remains open and unmerged.
- No merge to `main` is authorized by this closeout.
- No deployment is authorized.
- Final merge requires separate explicit operator approval.
- After an authorized merge, perform post-merge documentation reconciliation on `main` to record the merge commit and activate the next execution phase.