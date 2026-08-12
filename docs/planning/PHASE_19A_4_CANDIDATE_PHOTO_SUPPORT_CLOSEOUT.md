# Phase 19A-4 — Candidate Photo Support Closeout

## Status

`IMPLEMENTED / HUMAN QA PASSED / DRAFT PR OPEN / FINAL COMPLETE REGRESSION PENDING`

This record is intentionally conservative. Phase 19A-4 has implementation and human-browser evidence, but one fresh complete regression run is still required on the final executable branch state before this phase is marked ready to merge.

## Identity

- Phase: `19A-4 — Candidate Photo Support`
- Feature branch: `phase-19a-4-candidate-photo-support`
- Main/base commit: `ad10229aa64cc79b4503901d8b59ac127fac0a20`
  (`Record Phase 19A-3 merge closeout`)
- Frozen-design commit: `3b4855926f842a95ca1e11631059af1aeb1abce8`
  (`Record Phase 19A-4 frozen design`)
- Final executable implementation checkpoint before this documentation record:
  `f8b4ec34460fe8aa9251d5c5ae3ebb2c454c7c92`
  (`Return to current draft when editing snapshot`)
- Design specification:
  `docs/superpowers/specs/2026-08-11-resume-candidate-photo-support-design.md`
- Implementation plan:
  `docs/superpowers/plans/2026-08-12-resume-candidate-photo-support.md`
- Draft pull request: `PR #8 — Complete Phase 19A-4 Candidate Photo Support`
- Merge status: `NOT MERGED`
- Deployment status: `NOT PART OF THIS PHASE CLOSEOUT`

## Approved architecture preserved

Phase 19A-4 implements the approved bounded extension of the existing private Asset architecture:

- one optional Resume-root `candidatePhotoAssetId`;
- independent `Resume.design.showProfilePhoto` visibility;
- no Candidate Photo field in `ResumeContent` or `ResumeVersion`;
- no Candidate Photo identity, file, bytes, Blob URL, signed URL, dimensions, or metadata in Phase 19A-3 recovery;
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
- ATS Classic, Modern Professional, and Compact Technical all support the optional portrait;
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

The operator requested and approved the bounded file-picker visual refinement during human QA.

## Automated verification evidence

### Complete implementation gate before final UI polish and snapshot repair

A complete local automated gate passed before the later file-picker polish and snapshot-editing repair:

- Frontend: `904/904 PASS`
- Backend unit: `205/205 PASS`
- Backend integration: `192/192 PASS`
- Backend security: `36/36 PASS`
- Total recorded full-suite tests: `1,337 PASS`
- Root/frontend/backend typechecks: `PASS`
- Production build: `PASS`
- `git diff --check`: `PASS`
- changed-diff secret-shaped token scan: `NO MATCH`

This evidence remains valuable but is not labelled the final full regression because later frontend changes were made.

### Candidate Photo focused verification

During implementation and repair cycles, focused Candidate Photo frontend and backend tests passed, including:

- Candidate Photo browser preflight/source helper;
- Candidate Photo API contracts;
- Candidate Photo controls;
- Candidate Photo preview/templates;
- ResumeWorkspace Candidate Photo behavior;
- backend Candidate Photo Asset policy;
- Candidate Photo validation;
- Candidate Photo integration lifecycle.

A stale pre-Phase-19A-4 Resume design test expectation was corrected after it expected unrelated `pageSize` and `showProfilePhoto: false` fields in a design mutation. The corrected focused frontend gate passed `87/87`.

### Snapshot-editing defect discovered during human QA

Human QA exposed a general Resume Studio inconsistency:

1. a saved/read-only version snapshot could remain open;
2. the current editor still accepted changes;
3. the draft became dirty;
4. `Save new version` remained disabled because a snapshot was active.

The language save path itself was healthy. Returning manually to the current draft allowed the operator to save the Language successfully as a new version.

The defect was repaired with test-first evidence:

- RED regression: `ResumeWorkspace.snapshotEditing.test.tsx` failed because `Read-only version 1` remained visible after editing;
- minimal production repair: editing the current draft now clears the active snapshot before normal dirty-state processing;
- GREEN regression: `1/1 PASS`;
- existing `ResumeWorkspace.test.tsx`: `61/61 PASS`;
- frontend typecheck: `PASS`;
- frontend production build: `PASS`;
- `git diff --check`: `PASS`;
- real Chrome confirmation by the operator: `PASS`.

The existing protection that prevents saving while a historical snapshot itself is active remained covered by the existing ResumeWorkspace suite.

## Human Chrome QA evidence

The operator ran the local frontend/backend against a connected local MongoDB and private local storage. API health returned HTTP 200 with database and storage readiness.

Human QA confirmed working behavior for the Candidate Photo flow, including:

- no-photo state;
- valid photo upload;
- shown state;
- hidden state;
- Show on Resume;
- Replace photo;
- Remove photo confirmation and removal;
- refined Choose/Replace file-picker presentation;
- Candidate Photo in the live Resume preview;
- Candidate Photo with saved-version/historical presentation;
- Candidate Photo in browser print preview when visible;
- preserved photo behavior while exercising Resume Studio;
- real-browser verification of the snapshot-editing repair.

The operator explicitly reported that the Candidate Photo UI polish and the snapshot-editing repair work correctly.

## Known non-blocking build advisories

The frontend production build retains known non-failing Vite advisories:

- React Router module-level `use client` directives are ignored during bundling;
- `resumeCandidatePhotoGateway.ts` dynamically imports `resumeApi.ts` while other application modules also import `resumeApi.ts` statically, so the dynamic import does not create a separate chunk;
- the application JavaScript chunk remains above Vite's default 500 kB advisory threshold.

The Candidate Photo gateway warning was investigated. The gateway is used by `ResumeWorkspace` and provides a narrow test/mocking boundary; it is not dead code. No architecture churn was introduced merely to silence the optimization warning.

## Scope review

The Phase 19A-4 PR changed only Candidate Photo / Resume presentation implementation, directly relevant tests, the frozen design/implementation plan, rate limiting, and phase documentation.

The PR changed-file list contains no package manifest, lockfile, environment file, deployment file, migration, or shared-types package change.

`main` remains unchanged while this PR is under review.

## Final remaining automated gate

Before PR #8 can be marked ready for review or merged, run one fresh complete regression against the final branch state:

1. complete frontend Vitest suite;
2. complete backend unit suite;
3. complete backend integration suite;
4. complete backend security suite;
5. root/frontend/backend/shared typechecks as defined by repository scripts;
6. backend test-source typecheck;
7. production build;
8. `git diff --check`;
9. clean-worktree / exact-head confirmation.

If that fresh gate passes, this record may be updated to:

`IMPLEMENTED / FINAL AUTOMATED VERIFICATION PASSED / HUMAN QA PASSED / READY FOR FINAL PR REVIEW`

## Release control

- PR #8 must remain draft while the final complete regression is pending.
- No merge to `main` is authorized by this document.
- No deployment is authorized by this document.
- Final merge requires explicit operator approval after the fresh complete regression and final PR diff review.
