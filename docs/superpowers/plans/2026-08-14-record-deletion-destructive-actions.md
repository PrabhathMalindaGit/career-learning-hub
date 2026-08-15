# Record Deletion & Destructive Actions Implementation Plan

> **Execution discipline:** implement task-by-task with test-driven development. Do not widen scope when a focused fix is sufficient.

**Date:** 2026-08-14
**Status:** Written specification approved; implementation plan self-reviewed and execution approved on 2026-08-15
**Task branch:** `task/record-deletion-destructive-actions`
**Base:** `main @ 91f911f013fa35b4288f4299237b19c14a07d187`
**Draft PR:** `#18 — Record deletion and destructive actions`

## 1. Goal

Add secure and discoverable permanent deletion for Resume and Interview records, expose the existing Learning document deletion workflow from the Learning library, and preserve current ownership, job-resilience, archive/restore, accessibility, and data-integrity behavior.

## 2. Controlling constraint

Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.

Therefore:

- Resume and Interview use synchronous owner-scoped cascades.
- Learning keeps its existing asynchronous deletion backend/state machine.
- Resume/Interview deletion returns `409` while directly related AI work is `queued` or `processing`; deletion does not auto-cancel those jobs.
- No Trash, recycle bin, retention window, undo, bulk deletion, generic deletion framework, new deletion worker, migration, provider change, deployment change, or Phase 19C+ activation.
- No merge, deployment, or branch deletion is authorized by plan approval.

## 3. Execution environment

- **Codex:** not used for this project workflow.
- **Implementation executor:** ChatGPT inline through the GitHub connector after explicit user approval.
- **Browser use:** not required for backend implementation; required for final human-visible Resume/Interview/Learning QA after automated verification is green.
- **Manual terminal commands now:** none.
- **Manual terminal commands after implementation:** required; the user will pull this branch and run the exact verification block in Task 7.
- **Automated services:** use the repository's existing Vitest/MongoDB-memory test harness; do not add infrastructure.
- **Human QA services:** use the existing local Career Learning Hub frontend/backend/MongoDB development workflow.

## 4. Verified repository interfaces used by this plan

The plan is written against these actual current interfaces:

- Resume router is authenticated at router level and already uses `resumeIdParamsSchema`.
- Resume service already exposes `requireOwnedResume(userId, resumeId, session?)`.
- ResumeVersion has optional `sourceAssetId`; `{ userId, sourceAssetId }` is unique when present.
- `resume.analyze` jobs contain `payload.resumeId`.
- confirmed `resume.import-pdf` jobs are associated with the created Resume through terminal `result.kind === "import-adopted"` and `result.resumeId`.
- Asset storage providers are exactly `local | s3`; `getOwnedAsset` excludes `status: "deleted"`.
- Interview routes use the actual middleware export `requireOwnedInterviewSession` from `interviewOwnership.middleware.ts`.
- Interview service owner lookup is the actual `requireOwnedSession(userId, sessionId, mongoSession?)` function.
- Current Interview job types are exactly `interview.questions.generate`, `interview.question.explain`, and `interview.attempt.feedback`, and each typed payload includes `sessionId`.
- Learning library currently renders `Open workspace` only; `LearningDocumentDeletion` already owns confirmation, job polling, reconciliation, canonical absence checks, and navigation.
- `LearningDocumentDeletion` currently uses the static dialog heading ID `learning-deletion-title`, which must become instance-safe before rendering the component repeatedly in the library.

## 5. Planned file boundary

### Resume backend

Modify:
- `backend/src/modules/resumes/resume.routes.ts`
- `backend/src/modules/resumes/resume.controller.ts`
- `backend/src/modules/resumes/resume.service.ts`
- `backend/src/modules/assets/asset.service.ts`

Create:
- `backend/src/tests/integration/resumeDeletion.integration.test.ts`

### Resume frontend

Modify:
- `frontend/src/features/resumes/resumeApi.ts`
- `frontend/src/features/resumes/ResumeListPage.tsx`

Create:
- `frontend/src/features/resumes/ResumeDeleteDialog.tsx`
- focused deletion tests and bounded deletion styles under `frontend/src/features/resumes/`.

### Interview backend

Modify:
- `backend/src/modules/interviews/interview.routes.ts`

Create or modify only bounded Interview deletion service/controller/tests under `backend/src/modules/interviews/` and `backend/src/tests/integration/` as required by the current architecture.

### Interview frontend

Modify:
- `frontend/src/features/interviews/InterviewSessionCard.tsx`
- `frontend/src/features/interviews/InterviewSessionListPage.tsx`

Create focused Interview deletion API/dialog/tests/styles under `frontend/src/features/interviews/`.

### Learning frontend

Modify:
- `frontend/src/features/learning/LearningDocumentDeletion.tsx`
- `frontend/src/features/learning/LearningDashboard.tsx`
- `frontend/src/features/learning/LearningDashboard.test.tsx`

Create focused library-deletion regression tests under `frontend/src/features/learning/` if needed.

### Process / verification

- Modify PR #18 body during execution to track task status and verification evidence.
- Do not update `CURRENT_PHASE.md` until the feature is actually accepted/merged through the normal governance workflow.

---

# Task 1 — Resume backend permanent deletion

## 1.1 Write failing tests first

Create `backend/src/tests/integration/resumeDeletion.integration.test.ts` using the existing `app`, Supertest, and `registerTestUser` pattern.

Required cases:

1. owner can delete a Resume and receives `204`;
2. Resume disappears from get/list;
3. all owned ResumeVersions with that `resumeId` are removed;
4. all owned ResumeAnalyses with that `resumeId` are removed;
5. Candidate Photo and imported source Assets directly associated with that Resume become `deleted`/inaccessible;
6. physical object cleanup is invoked through the current storage abstraction where testable;
7. unrelated Assets and another user's records remain untouched;
8. foreign/missing Resume follows existing not-found behavior;
9. related `resume.analyze` job in `queued` or `processing` returns `409` with code `RESUME_DELETE_BLOCKED_BY_ACTIVE_JOB` and no partial cascade;
10. related terminal `resume.analyze` jobs are removed;
11. confirmed terminal `resume.import-pdf` job is removed only when `result.kind` is `import-adopted` and `result.resumeId` matches;
12. Mongo transaction failure never reports success;
13. a deterministic late persistence path cannot recreate a deleted Resume parent.

RED command:

```bash
npm --prefix backend test -- src/tests/integration/resumeDeletion.integration.test.ts
```

Expected before implementation: failure because the route/service does not exist.

## 1.2 Add two narrow Asset cascade helpers

In `asset.service.ts`, import `ClientSession` and `StorageProvider` through existing modules and add only:

```ts
export type AssetCascadeCleanupTarget = {
  assetId: string;
  storageProvider: StorageProvider;
  storageKey: string;
};

export async function markOwnedAssetsDeletedForCascade(input: {
  userId: string;
  assetIds: string[];
  session: ClientSession;
}): Promise<AssetCascadeCleanupTarget[]>;

export async function deleteCascadeAssetObjectsBestEffort(
  targets: readonly AssetCascadeCleanupTarget[],
): Promise<void>;
```

`markOwnedAssetsDeletedForCascade` must:

- deduplicate only server-derived IDs;
- query by `_id in IDs`, `userId`, and `status != deleted`;
- mark each matched Asset `status = deleted`, set `deletedAt`, clear `expiresAt`, and save inside the caller transaction;
- return only the minimum cleanup descriptors needed after commit.

`deleteCascadeAssetObjectsBestEffort` must:

- call `getStorageForProvider(target.storageProvider).deleteObject(target.storageKey)` after the database transaction commits;
- catch physical-cleanup failures;
- log only sanitized `assetId`, provider, and serialized error information;
- never expose a storage key through the API;
- never resurrect the already deleted Resume to compensate for an object-store failure.

Do not alter public `deleteOwnedAsset` semantics or weaken `RESUME_PHOTO_ATTACHED`.

## 1.3 Implement exact Resume job selectors and cascade

In `resume.service.ts`, use these selectors:

```ts
const activeResumeJobFilter = (userId: string, resumeId: string) => ({
  userId,
  type: "resume.analyze",
  status: { $in: ["queued", "processing"] },
  "payload.resumeId": resumeId,
});

const terminalResumeJobFilter = (userId: string, resumeId: string) => ({
  userId,
  status: { $in: ["completed", "failed", "cancelled"] },
  $or: [
    { type: "resume.analyze", "payload.resumeId": resumeId },
    {
      type: "resume.import-pdf",
      "result.kind": "import-adopted",
      "result.resumeId": resumeId,
    },
  ],
});
```

Implement:

```ts
export async function deleteResume(input: {
  userId: string;
  resumeId: string;
}): Promise<void>;
```

Inside `withMongoTransaction`:

1. call `requireOwnedResume(input.userId, input.resumeId, session)`;
2. check `JobRecordModel` for the exact active filter; throw `AppError(409, "RESUME_DELETE_BLOCKED_BY_ACTIVE_JOB", ...)` before any mutation;
3. fetch this user's ResumeVersions for that Resume and collect `sourceAssetId` values;
4. combine those IDs with the Resume's `candidatePhotoAssetId` when present;
5. call `markOwnedAssetsDeletedForCascade`;
6. delete owned ResumeAnalyses for that Resume;
7. delete owned ResumeVersions for that Resume;
8. delete only matching terminal Resume jobs;
9. delete the owned Resume root;
10. return cleanup targets.

After commit:

1. run best-effort physical Asset cleanup;
2. call `recordActivitySafely` with type `resume.deleted`, resourceType `resume`, and the deleted Resume ID; omit sensitive content.

## 1.4 Wire the existing controller/router pattern

In `resume.controller.ts`, import `deleteResume` and add `deleteResumeController`, using the existing `ResumeIdParams` type already declared in that file. On success:

```ts
response.status(204).send();
```

In `resume.routes.ts`, register:

```ts
resumeRouter.delete(
  "/:resumeId",
  validate({ params: resumeIdParamsSchema }),
  asyncHandler(deleteResumeController),
);
```

Keep router-level authentication unchanged.

## 1.5 Focused GREEN verification

```bash
npm --prefix backend test -- \
  src/tests/integration/resumeDeletion.integration.test.ts \
  src/tests/integration/resumeCandidatePhoto.integration.test.ts \
  src/tests/integration/resumePdfImport.integration.test.ts \
  src/tests/integration/resumeJobIdempotency.integration.test.ts \
  src/tests/integration/jobExecutionFence.integration.test.ts
```

---

# Task 2 — Resume Studio deletion UI

## 2.1 RED tests

Cover:

- DELETE helper sends one authenticated `DELETE /resumes/:resumeId` and correctly accepts `204`;
- confirmation requires exact case-sensitive stored title equality;
- warning names versions, analyses, Candidate Photo, and associated imported Resume PDF source files;
- duplicate submit is prevented while busy;
- `409` server message/request ID remains visible and actionable;
- cancelling returns focus to the trigger;
- Escape cancels and keyboard navigation remains usable;
- successful deletion removes the card immediately and triggers a canonical list reload;
- deleting the last card on a non-first page moves back one page.

## 2.2 API helper and dialog

Add a bounded `deleteResume` API helper using the existing API-client convention and a feature-local `ResumeDeleteDialog`.

## 2.3 Card integration

Render the destructive action as visually secondary to `Open Resume`; refresh canonical list state after success.

---

# Task 3 — Interview backend permanent deletion

## 3.1 RED tests

Cover:

- permanent delete works for `active`, `completed`, and `archived` sessions;
- owned InterviewAttempts and InterviewQuestions are removed;
- source Resume and source ResumeVersion remain untouched;
- foreign/missing session follows `INTERVIEW_SESSION_NOT_FOUND` behavior;
- another user's data remains untouched;
- matching queued/processing Interview jobs block with 409 `INTERVIEW_DELETE_BLOCKED_BY_ACTIVE_JOB` and no partial cascade;
- terminal jobs are removed;
- transaction failure never reports success.

## 3.2 Implement against actual Interview interfaces

Use:

```ts
const interviewJobTypes = [
  "interview.questions.generate",
  "interview.question.explain",
  "interview.attempt.feedback",
] as const;
```

Use `requireOwnedSession(userId, sessionId, mongoSession?)` inside the transaction and `requireOwnedInterviewSession` at the route boundary.

Inside the transaction:

1. authoritative owner lookup;
2. active-job gate;
3. delete attempts;
4. delete questions;
5. delete terminal jobs;
6. delete root InterviewSession.

After commit, record `interview.session.deleted` without sensitive metadata.

---

# Task 4 — Interview Coach permanent-deletion UI

Cover API 204 handling, exact-title confirmation, accessible error/focus behavior, deletion for all lifecycle states, and preservation of Archive/Restore as independent reversible behavior.

---

# Task 5 — Learning library deletion discoverability

- Keep Learning backend unchanged.
- Make existing `LearningDocumentDeletion` dialog IDs instance-safe.
- Render that existing component in non-deleting Learning cards.
- On acceptance, immediately suppress duplicate delete trigger and refresh canonical list.
- Preserve existing workspace deletion, polling, reconciliation, retry/cancel behavior.

---

# Task 6 — Cross-feature security/race regression

Backend focused regression:

```bash
npm --prefix backend test -- \
  src/tests/integration/crossUserAccess.integration.test.ts \
  src/tests/integration/resumeDeletion.integration.test.ts \
  src/tests/integration/interviewDeletion.integration.test.ts \
  src/tests/integration/learningDocumentDeletionConcurrency.integration.test.ts \
  src/tests/integration/jobExecutionFence.integration.test.ts \
  src/tests/integration/resumeJobIdempotency.integration.test.ts
```

Frontend focused regression should cover the new Resume/Interview/Learning deletion test files plus the existing Learning dashboard/deletion regression tests.

---

# Task 7 — Full verification, user-local evidence, browser QA, PR review

## 7.1 Full automated verification

Backend:

```bash
npm --prefix backend run typecheck:all
npm --prefix backend test
npm --prefix backend run build
```

Frontend:

```bash
npm --prefix frontend run typecheck
npm --prefix frontend test
npm --prefix frontend run build
```

Repository hygiene:

```bash
git diff --check origin/main...HEAD
git diff --name-only origin/main...HEAD
git status --short
```

Required result:

- all commands exit `0`;
- `git diff --check` is blank;
- only approved Resume/Interview/Learning implementation/test/style files and approved spec/plan process files changed;
- no package/lock/env/auth/migration/provider/deployment/unrelated feature file changed;
- worktree clean.

## 7.2 Independent user-local verification

After ChatGPT finishes implementation, the user pulls `task/record-deletion-destructive-actions` and runs the exact verification block supplied in chat. The user must paste the complete output. Do not call implementation verified solely because GitHub edits were accepted.

## 7.3 Human browser QA after automated verification is green

Verify with real local UI:

1. Resume Studio delete success with exact-title confirmation; card disappears.
2. Resume wrong title keeps permanent action unavailable.
3. Resume active related AI job produces clear `409`; record remains.
4. Interview active session can be permanently deleted without archive prerequisite.
5. Interview archived session shows Restore and Delete permanently separately.
6. Interview wrong title / 409 states remain keyboard accessible.
7. Learning library exposes Delete document alongside Open workspace.
8. Learning deleting document has no duplicate fresh delete trigger.
9. Existing asynchronous Learning deletion still reconciles correctly.
10. Desktop/tablet/mobile widths do not overlap destructive/primary actions.
11. Keyboard cancellation/confirmation/focus behavior is acceptable.

## 7.4 Final PR review gate

Before taking PR #18 out of draft, verify all approved invariants and local evidence. Merge remains a separate explicit approval. Do not deploy or delete branches.

## 8. Plan self-review result

**PASS.** The plan was checked against the current repository. It uses the actual Interview route middleware `requireOwnedInterviewSession`, transaction-aware service lookup `requireOwnedSession`, current Express controller conventions, and existing Asset storage types. It preserves Learning's specialized async deletion instead of forcing it into a generic framework.

## 9. Approval and execution state

- Design: **USER APPROVED** — `APPROVE RECORD DELETION DESIGN`
- Written spec: **USER APPROVED** — `APPROVE RECORD DELETION SPEC`
- Plan + inline execution: **USER APPROVED** — `APPROVE RECORD DELETION PLAN + INLINE EXECUTION`
- Implementation: committed on draft PR #18; **verification pending**
- Merge: **NOT AUTHORIZED**
- Deployment: **NOT AUTHORIZED**
- Branch deletion: **NOT AUTHORIZED**
