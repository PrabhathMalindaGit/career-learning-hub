# Phase 18 storage-adapter tracking repair

## 1. Executive result

Repair B18A-001 is `COMPLETED / APPROVED`.
The broad `storage/` ignore rule still protects runtime storage, while four
existing TypeScript adapter files are now visible to Git through exact
exceptions. Their contents and SHA-256 checksums did not change.

All required typechecks, targeted storage tests, backend regression suites,
and the production build passed. No AWS, Atlas, provider, DNS, deployment,
secret, or persistent-service action occurred.

## 2. Repair ID and scope

- Repair ID: `B18A-001`
- Name: Ignored Private-Storage Adapter Source Tracking Repair
- Prompt: `CLH-PHASE-18-STORAGE-ADAPTER-TRACKING-REPAIR-01`
- Approval-closeout prompt:
  `CLH-PHASE-18-STORAGE-ADAPTER-REPAIR-APPROVAL-COMMIT-01`
- Status: `COMPLETED / APPROVED`
- Approval token:
  `PHASE_18_STORAGE_ADAPTER_TRACKING_REPAIR_APPROVED`
- Token accepted: `YES`

The repair changes Git visibility and adds focused coverage. It does not alter
adapter behavior or activate Phase 18B.

## 3. Starting Git baseline

- Repository:
  `/Users/prabhathmalinda/Documents/Projects/Career Learning Hub`
- Branch: `phase-18-staging-deployment`
- HEAD: `bca7a45556ec7fd9597741efd217760a41207abf`
- Subject: `Approve Phase 18A staging architecture decisions`
- Cached `origin/main`:
  `13c5c96fb4944715e0253b6ce43d68de878556e3`
- Ahead/behind `origin/main`: one/zero commits
- Worktree and index: clean
- Active Git operation: none

## 4. Original ignore rule

`.gitignore` contained:

```gitignore
# Private local-development assets
storage/
```

Because an unanchored directory pattern matches a directory of that name at
any level, it ignored both the intended runtime root `backend/storage/` and
the source directory `backend/src/modules/assets/storage/`.

## 5. Existing adapter inventory

Exactly four regular files existed before the repair:

| Path | Size | Role |
|---|---:|---|
| `backend/src/modules/assets/storage/storage.types.ts` | 704 bytes | private-storage interface and put/download contracts |
| `backend/src/modules/assets/storage/local.storage.ts` | 2,134 bytes | private local-filesystem adapter with path containment |
| `backend/src/modules/assets/storage/s3.storage.ts` | 3,024 bytes | private S3 adapter, encryption, checksum, bounded reads, and presigning |
| `backend/src/modules/assets/storage/storage.factory.ts` | 1,438 bytes | configured adapter construction, caching, and initialization |

There were no extra files, directories, symbolic links, archives, binaries,
logs, databases, credential files, uploaded objects, or generated output in
the source directory.

## 6. Source-content safety review

All four files were read completely before the ignore change. They contain
TypeScript source only. No access key, secret key, password, token, connection
string, private key, credential-bearing hostname, personal data, uploaded
content, or runtime storage object was found.

The S3 file accepts credentials through constructor options but contains no
credential value. The factory reads environment-variable fields but contains
no environment value.

## 7. Before/after SHA-256 checksums

| File | Before | After | Result |
|---|---|---|---|
| `local.storage.ts` | `5b3af39116091ff40a9012b6f6915858fde283779da94ceda4e8e6662a51b2de` | `5b3af39116091ff40a9012b6f6915858fde283779da94ceda4e8e6662a51b2de` | match |
| `s3.storage.ts` | `54afa495ded69909ca5780166f3fc5a2cd73f0dd53fb3a2206aafb448510c786` | `54afa495ded69909ca5780166f3fc5a2cd73f0dd53fb3a2206aafb448510c786` | match |
| `storage.factory.ts` | `bb6df783a80b1f03dc22967eef1594eadb0e8026dfb79c8fdad22c6bdd77e909` | `bb6df783a80b1f03dc22967eef1594eadb0e8026dfb79c8fdad22c6bdd77e909` | match |
| `storage.types.ts` | `a6a8ba2777d7ca91476751fa651616639204b8b94f87bf0030fa62efc72af86d` | `a6a8ba2777d7ca91476751fa651616639204b8b94f87bf0030fa62efc72af86d` | match |

No adapter source file changed, moved, or was renamed.

## 8. Application import map

- `backend/src/server.ts` initializes private storage before declaring runtime
  storage readiness.
- `backend/src/modules/health/health.service.ts` checks the selected adapter
  during readiness evaluation.
- `backend/src/modules/assets/asset.service.ts` writes, reads, signs, deletes,
  and cleans up owned private objects.
- `backend/src/modules/assets/asset.controller.ts` streams local objects or
  redirects to provider-signed targets.
- `backend/src/modules/learning/learningDocument.service.ts` removes stored
  objects on failed creation and cascade deletion.
- `backend/src/tests/setup.ts` initializes temporary local test storage.
- `backend/src/tests/integration/learningDocumentDeletionConcurrency.integration.test.ts`
  verifies stored-object deletion and failure fencing.

## 9. Test evidence map

| Required behavior | Evidence |
|---|---|
| malformed upload rejection | `storageAdapters.test.ts` |
| factory selection and caching | `storageAdapters.test.ts` |
| local initialize, health, put, over-limit rejection, bounded read, stream, and delete | `storageAdapters.test.ts` |
| S3 health, encrypted/checksummed put, over-limit rejection, bounded read, delete, and presigning | `storageAdapters.test.ts`, with `S3Client.send` mocked and signing performed locally with synthetic test credentials |
| upload validation and private object creation | `learningDocumentSource.integration.test.ts` |
| owner-scoped private PDF access | `learningDocumentSource.integration.test.ts` |
| signed local retrieval and expiry | `learningDocumentSource.integration.test.ts` |
| direct owned Asset deletion and stored-object cleanup | `storageAdapters.test.ts` |
| Learning cascade deletion and failure fencing | `learningDocumentDeletionConcurrency.integration.test.ts` |
| failed storage health makes readiness fail | `storageAdapters.test.ts` |

No test contacted AWS S3.

## 10. `.gitignore` repair

The retained runtime rule and exact source exceptions are:

```gitignore
storage/
!backend/src/modules/assets/storage/
backend/src/modules/assets/storage/*
!backend/src/modules/assets/storage/storage.types.ts
!backend/src/modules/assets/storage/local.storage.ts
!backend/src/modules/assets/storage/s3.storage.ts
!backend/src/modules/assets/storage/storage.factory.ts
```

The intermediate directory exception is required so Git can traverse the
source directory. Its contents are then ignored again before the four exact
filenames are re-included. This prevents an unexpected fifth file or nested
runtime artifact from becoming visible.

## 11. Runtime/private-storage exclusions preserved

`git check-ignore -v` confirms that these remain ignored:

- `backend/storage/` and `backend/storage/private/`;
- any other repository directory named `storage`;
- unexpected or nested files under the adapter source directory;
- `.env` files except the existing tracked example policy;
- `dist/`, coverage, and TypeScript build caches;
- migration inputs and reports;
- logs and temporary paths.

Only the four expected adapter files became visible.

## 12. Typecheck results

- `npm run typecheck`: passed. Frontend, backend, and shared-types checks all
  exited zero.
- `npm run typecheck:test --workspace @career-learning-hub/api`: passed after
  the focused test was added.

Storage imports resolve with no missing-module error.

## 13. Targeted test results

Direct adapter command:

```text
npm run test --workspace @career-learning-hub/api -- src/tests/unit/storageAdapters.test.ts
```

The sandboxed attempt collected zero tests because the test-only MongoDB
listener received `EPERM`. The identical permitted infrastructure retry
passed its initial three tests. After completing the required coverage, the
final focused run passed: one file, six tests, zero failures, zero skipped,
1.49 seconds.

Private-source and deletion command:

```text
npm run test --workspace @career-learning-hub/api -- src/tests/integration/learningDocumentSource.integration.test.ts src/tests/integration/learningDocumentDeletionConcurrency.integration.test.ts
```

Result: two files, 33 tests passed, zero failures, zero skipped, 5.39 seconds.

## 14. Backend regression results

| Command | Files | Passed | Failed | Skipped | Duration | Warnings |
|---|---:|---:|---:|---:|---:|---|
| `npm run test:unit` | 6 | 25 | 0 | 0 | 2.55 s | none |
| `npm run test:integration` | 7 | 54 | 0 | 0 | 9.34 s | none |
| `npm run test:security` | 4 | 35 | 0 | 0 | 3.87 s | expected spoofed `X-Forwarded-For` diagnostic |

The security diagnostic is emitted by the existing rate-limit bypass test;
that test passed.

## 15. Production-build result

`VITE_API_URL=https://api.example.test/api/v1 npm run build` passed.

- Frontend TypeScript and Vite build: passed, 102 modules transformed.
- Backend TypeScript production build: passed.
- Shared types have no separate `build` script; their required typecheck passed
  in `npm run typecheck`.
- Storage imports resolved from the now-visible source.
- No dependency or configuration file changed.
- Existing Vite warnings remained: React Router `"use client"` directives were
  ignored during bundling and the main chunk exceeded 500 kB.

## 16. Generated-output cleanup

The repair removed generated `frontend/dist`, `backend/dist`, coverage paths,
and `frontend/tsconfig.tsbuildinfo` after verification. The test global
teardown removed its temporary MongoDB and storage root. No repair log or test
report remains.

No persistent application server was started. Ports 4173, 4174, and 8000 were
not left listening.

## 17. Final changed and untracked paths

Expected modified paths:

- `.gitignore`
- `docs/planning/CURRENT_PHASE.md`
- `docs/planning/CAREER_LEARNING_HUB_MASTER_PLAN.md`
- `docs/deployment/PHASE_18A_STAGING_ARCHITECTURE_AUDIT.md`

Expected new untracked paths:

- the four adapter source files listed in section 5;
- `backend/src/tests/unit/storageAdapters.test.ts`;
- `docs/deployment/PHASE_18_STORAGE_ADAPTER_TRACKING_REPAIR.md`.

The reviewed pre-closeout snapshot had nothing staged or committed. The
approval-closeout prompt authorizes staging exactly these ten paths and
creating one local commit with subject
`Repair private storage adapter tracking`. The exact commit hash remains
pending until creation. No push is authorized.

## 18. Security and privacy boundaries

- The source scan found no credential or private-data value.
- Runtime uploads remain ignored and were not read.
- Tests used synthetic buffers and temporary storage only.
- The S3 contract test mocked the SDK send boundary.
- No AWS, Atlas, AI, provider, DNS, or deployment call occurred.
- No actual environment file was read.
- Phase 17 security remains `NOT RUN — NO PASS CLAIMED`; no scan pass is
  asserted.

## 19. P15-001 restrictions

P15-001 remains `TECHNICALLY UNRESOLVED`. The non-atomic concurrent upload
quota check is unchanged. Supervised academic-MVP access, synthetic data,
limited accounts and uploads, bounded retention, and no unrestricted public
or multi-instance use remain mandatory.

## 20. Human review checklist

- [x] Exactly four expected adapter files are present.
- [x] Their before/after checksums match.
- [x] No secret or runtime data appears.
- [x] `.gitignore` is repaired surgically.
- [x] Runtime private storage remains ignored.
- [x] No unrelated ignored path became visible.
- [x] Typechecks passed.
- [x] Targeted storage tests passed.
- [x] Unit tests passed.
- [x] Integration tests passed.
- [x] Security tests passed.
- [x] Production build passed.
- [x] Generated output was removed.
- [x] No AWS, Atlas, provider, DNS or deployment action occurred.
- [x] P15-001 restrictions remain binding.
- [x] Phase 18B remains inactive.
- [x] The reviewed pre-closeout snapshot was unstaged and uncommitted.
- [x] `PHASE_18_STORAGE_ADAPTER_TRACKING_REPAIR_APPROVED` was accepted.

## 21. Required next action

Create the one authorized local closeout commit with subject
`Repair private storage adapter tracking`, then verify that it contains exactly
the ten reviewed paths and that the worktree is clean. Do not push.

After closeout, the next planned activity is a separately authorized
current-versus-legacy UI, feature, and branding audit before deployment. No
legacy-project access is authorized here. Phase 18B remains
`PLANNED / INACTIVE — READY FOR SEPARATE ACTIVATION`; domain status remains
`RESERVED — REGISTRY ACTIVATION PENDING`.
