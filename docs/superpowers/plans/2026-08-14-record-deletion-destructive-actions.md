# Record Deletion & Destructive Actions Implementation Plan

> **Execution discipline:** implement task-by-task with test-driven development. Do not widen scope when a focused fix is sufficient.

**Date:** 2026-08-14
**Status:** Written specification approved; implementation plan approved and inline execution authorized
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
- `frontend/src/features/resumes/resumeApi.test.ts`
- `frontend/src/features/resumes/ResumeListPage.tsx`
- `frontend/src/features/resumes/ResumeListPage.test.tsx`
- `frontend/src/features/resumes/resumeWorkspace.css`

Create:
- `frontend/src/features/resumes/ResumeDeleteDialog.tsx`
- `frontend/src/features/resumes/ResumeDeleteDialog.test.tsx`

### Interview backend

Modify:
- `backend/src/modules/interviews/interview.routes.ts`
- `backend/src/modules/interviews/interview.controller.ts`
- `backend/src/modules/interviews/interview.service.ts`

Create:
- `backend/src/tests/integration/interviewDeletion.integration.test.ts`

### Interview frontend

Modify:
- `frontend/src/features/interviews/interviewApi.ts`
- `frontend/src/features/interviews/interviewApi.test.ts`
- `frontend/src/features/interviews/InterviewSessionCard.tsx`
- `frontend/src/features/interviews/InterviewSessionListPage.tsx`
- `frontend/src/features/interviews/InterviewSessionListPage.test.tsx`
- `frontend/src/features/interviews/interviewCoach.css`

Create:
- `frontend/src/features/interviews/InterviewDeleteDialog.tsx`
- `frontend/src/features/interviews/InterviewDeleteDialog.test.tsx`

### Learning frontend

Modify:
- `frontend/src/features/learning/LearningDocumentDeletion.tsx`
- `frontend/src/features/learning/LearningDocumentDeletion.test.tsx`
- `frontend/src/features/learning/LearningDashboard.tsx`
- `frontend/src/features/learning/LearningDashboard.test.tsx`
- `frontend/src/features/learning/learningWorkspace.css` only if a bounded card-action layout adjustment is required.

No package, lockfile, env, auth, migration, provider, deployment, or unrelated feature file is planned.

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
2. call `recordActivitySafely` with type `resume.deleted`, resourceType `resume`, and the deleted Resume ID; omit sensitive content and omit `origin` because the current activity service already supplies its normal default/convention.

## 1.4 Wire the existing controller/router pattern

In `resume.controller.ts`, import `deleteResume` and add `deleteResumeController`, using the existing `ResumeIdParams` type already declared in that file. On success:

```ts
response.status(204).send();
```

In `resume.routes.ts`, import the controller and register:

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

Commit only after green:

```bash
git add backend/src/modules/assets/asset.service.ts \
  backend/src/modules/resumes/resume.controller.ts \
  backend/src/modules/resumes/resume.routes.ts \
  backend/src/modules/resumes/resume.service.ts \
  backend/src/tests/integration/resumeDeletion.integration.test.ts
git commit -m "feat: add secure resume deletion"
```

---

# Task 2 — Resume Studio deletion UI

## 2.1 Write failing tests

Extend `resumeApi.test.ts` and `ResumeListPage.test.tsx`; create `ResumeDeleteDialog.test.tsx`.

Required cases:

- DELETE helper sends one authenticated `DELETE /resumes/:resumeId` and correctly accepts `204`;
- confirmation requires exact case-sensitive stored title equality (`confirmation === resume.title`);
- warning names versions, analyses, Candidate Photo, and associated imported Resume PDF source files;
- duplicate submit is prevented while busy;
- `409` server message/request ID remains visible and actionable;
- cancelling returns focus to the trigger;
- Escape cancels and Tab/Shift+Tab stay inside the modal;
- successful deletion removes the card immediately and triggers a canonical list reload;
- deleting the last card on a non-first page moves back one page rather than inventing pagination state.

RED command:

```bash
npm --prefix frontend test -- \
  src/features/resumes/resumeApi.test.ts \
  src/features/resumes/ResumeDeleteDialog.test.tsx \
  src/features/resumes/ResumeListPage.test.tsx
```

## 2.2 API helper

Add to `resumeApi.ts`:

```ts
export async function deleteResume(
  resumeId: string,
  signal?: AbortSignal,
): Promise<void> {
  await apiRequest<void>(`/resumes/${encodeURIComponent(resumeId)}`, {
    method: "DELETE",
    authentication: "required",
    signal,
  });
}
```

The shared API client already handles `204`; do not add a fake response body/parser.

## 2.3 Feature-local dialog

Create `ResumeDeleteDialog.tsx` with:

```ts
type ResumeDeleteDialogProps = {
  resume: Pick<ResumeRecord, "id" | "title">;
  onDeleted(resumeId: string): void;
};
```

Use local state/ref logic only. On success call `onDeleted(resume.id)`. On `409`, show the backend message; never auto-cancel or auto-retry AI work.

## 2.4 Card integration

In `ResumeListPage.tsx`, render the destructive action as visually secondary to `Open Resume`. On success:

- filter the deleted ID from local cards;
- if this was the last card and `page > 1`, decrement page once;
- otherwise increment existing `reloadKey` so the server list remains canonical.

Add only bounded styles in `resumeWorkspace.css`.

GREEN command: same three focused frontend files. Then commit:

```bash
git add frontend/src/features/resumes
git commit -m "feat: add resume deletion controls"
```

---

# Task 3 — Interview backend permanent deletion

## 3.1 Write failing tests

Create `backend/src/tests/integration/interviewDeletion.integration.test.ts`.

Required cases:

- permanent delete works for `active`, `completed`, and `archived` sessions;
- owned InterviewAttempts and InterviewQuestions are removed;
- root InterviewSession is removed;
- source Resume and source ResumeVersion remain untouched;
- foreign/missing session follows `INTERVIEW_SESSION_NOT_FOUND` behavior;
- another user's session/questions/attempts remain untouched;
- each matching `queued` or `processing` Interview job blocks deletion with `409` and code `INTERVIEW_DELETE_BLOCKED_BY_ACTIVE_JOB`, with no partial cascade;
- matching terminal `completed`, `failed`, and `cancelled` jobs are removed;
- transaction failure never reports success;
- deterministic late persistence cannot recreate the deleted session parent.

RED:

```bash
npm --prefix backend test -- src/tests/integration/interviewDeletion.integration.test.ts
```

## 3.2 Implement against actual Interview service/middleware names

The current service owner helper is `requireOwnedSession(userId, sessionId, mongoSession?)`; use it exactly. No new ownership helper is needed.

Use exactly these typed job names:

```ts
const interviewJobTypes = [
  "interview.questions.generate",
  "interview.question.explain",
  "interview.attempt.feedback",
] as const;
```

Selector:

```ts
const interviewJobFilter = (userId: string, sessionId: string) => ({
  userId,
  type: { $in: interviewJobTypes },
  "payload.sessionId": sessionId,
});
```

Implement:

```ts
export async function deleteInterviewSession(input: {
  userId: string;
  sessionId: string;
}): Promise<void>;
```

Inside `withMongoTransaction`:

1. `requireOwnedSession(input.userId, input.sessionId, mongoSession)`;
2. check exact Interview job filter plus status `queued|processing`; throw `INTERVIEW_DELETE_BLOCKED_BY_ACTIVE_JOB` before mutations;
3. delete owned InterviewAttempts by session ID;
4. delete owned InterviewQuestions by session ID;
5. delete matching terminal Interview jobs only;
6. delete owned InterviewSession root;
7. return a non-undefined transaction result so `withMongoTransaction` can verify completion.

After commit, record safe activity type `interview.session.deleted`. Do not delete `sourceResumeId` or `sourceResumeVersionId`.

## 3.3 Wire route

Add a narrow `deleteInterviewSessionController` using a typed `Request<{ sessionId: string }>` and register:

```ts
interviewRouter.delete(
  "/:sessionId",
  validate({ params: sessionIdParamsSchema }),
  requireOwnedInterviewSession,
  asyncHandler(deleteInterviewSessionController),
);
```

Do not add rate limiting to deletion. Keep existing Archive/Restore behavior untouched.

## 3.4 Focused GREEN

```bash
npm --prefix backend test -- \
  src/tests/integration/interviewDeletion.integration.test.ts \
  src/tests/integration/crossUserAccess.integration.test.ts \
  src/tests/integration/jobExecutionFence.integration.test.ts
```

---

# Task 4 — Interview Coach deletion UI

## 4.1 Test first

Cover:

- `DELETE /interview-sessions/:sessionId` API helper accepts `204`;
- delete is available for active, completed, and archived sessions;
- Archive/Restore remains unchanged;
- exact case-sensitive title confirmation;
- duplicate submit suppression;
- active-job `409` remains actionable;
- successful deletion removes the card and reconciles canonical pagination;
- focus returns on cancellation;
- dialog keyboard behavior uses the shared modal behavior.

## 4.2 Implement

Create `InterviewDeleteDialog.tsx` and integrate it into `InterviewSessionCard.tsx`/the list page. Keep `Delete permanently` visually secondary to Open/Restore and Archive lifecycle actions.

GREEN:

```bash
npm --prefix frontend test -- \
  src/features/interviews/InterviewDeleteDialog.test.tsx \
  src/features/interviews/InterviewSessionListPage.test.tsx \
  src/features/interviews/InterviewSessionCard.restore.test.tsx \
  src/features/interviews/interviewDeletionApi.test.ts
```

---

# Task 5 — Learning library deletion discoverability

## 5.1 Reuse existing deletion workflow

Do not add another backend route or deletion state machine.

Expose the existing `LearningDocumentDeletion` component from each deletable Learning library card/row while keeping `Open workspace` as the primary navigation action.

## 5.2 Make repeated dialogs instance-safe

Replace the static `learning-deletion-title` heading ID with an instance-safe ID derived from a safe React ID mechanism or the canonical document ID. Do not change deletion semantics.

## 5.3 Prevent duplicate triggers

Once deletion is accepted for a document, suppress its library Delete trigger while the canonical document remains in `deleting` state or until canonical absence is confirmed.

Focused GREEN:

```bash
npm --prefix frontend test -- \
  src/features/learning/LearningDocumentDeletionLibrary.test.tsx \
  src/features/learning/LearningDashboardDeletion.test.tsx \
  src/features/learning/LearningDocumentDeletion.test.tsx \
  src/features/learning/LearningDashboard.test.tsx
```

---

# Task 6 — Cross-feature regression and security gate

Run the focused cross-feature deletion/security suite:

```bash
npm --prefix backend test -- \
  src/tests/integration/resumeDeletion.integration.test.ts \
  src/tests/integration/interviewDeletion.integration.test.ts \
  src/tests/integration/crossUserAccess.integration.test.ts \
  src/tests/integration/learningDocumentDeletionConcurrency.integration.test.ts \
  src/tests/integration/jobExecutionFence.integration.test.ts \
  src/tests/integration/resumeJobIdempotency.integration.test.ts
```

Then frontend deletion suite:

```bash
npm --prefix frontend test -- \
  src/features/resumes/ResumeDeleteDialog.test.tsx \
  src/features/resumes/ResumeListDeletion.test.tsx \
  src/features/resumes/resumeDeletionApi.test.ts \
  src/features/interviews/InterviewDeleteDialog.test.tsx \
  src/features/interviews/InterviewSessionListDeletion.test.tsx \
  src/features/interviews/interviewDeletionApi.test.ts \
  src/features/learning/LearningDocumentDeletionLibrary.test.tsx \
  src/features/learning/LearningDashboardDeletion.test.tsx \
  src/features/learning/LearningDocumentDeletion.test.tsx \
  src/features/learning/LearningDashboard.test.tsx
```

---

# Task 7 — Final qualification

After focused suites are green, run:

```bash
npm --prefix backend run typecheck:all
npm --prefix frontend run typecheck
npm --prefix backend test
npm --prefix frontend test
npm --prefix backend run build
npm --prefix frontend run build
git diff --check origin/main...HEAD
```

Then verify exactly the intended changed-file boundary and a clean worktree.

## Human browser QA

Only after the automated gate is green, run the existing frontend/backend/MongoDB local development workflow and manually verify:

### Resume Studio
- delete action is discoverable but secondary;
- exact-title confirmation;
- wrong-case title cannot submit;
- cancellation returns focus;
- successful delete removes the card;
- active-job conflict is understandable;
- desktop/tablet/mobile layouts remain usable.

### Interview Coach
- delete is available for active/completed/archived sessions;
- Archive/Restore still work;
- permanent deletion is visually distinct from Archive;
- exact-title confirmation and cancellation focus;
- successful deletion refreshes collection state;
- desktop/tablet/mobile layouts remain usable.

### Learning
- Open workspace remains primary;
- Delete document is available from the library;
- workspace deletion still works;
- accepted deletion cannot be started twice from the library;
- deleting status/absence reconciles correctly;
- repeated card dialogs have unique accessible labels;
- desktop/tablet/mobile layouts remain usable.

### Accessibility
- Tab/Shift+Tab stays inside each open confirmation dialog;
- Escape cancels only while not busy;
- destructive action labels are explicit;
- modal focus enters meaningfully and returns to its trigger;
- errors/request IDs remain perceivable.

## Completion gate

Do not call the task complete unless:

- Resume deletion focused backend/frontend tests pass;
- Interview deletion focused backend/frontend tests pass;
- Learning existing deletion + library exposure tests pass;
- cross-user ownership tests pass;
- active-job blocking tests pass;
- job execution fence/regression tests pass;
- backend and frontend typechecks pass;
- backend and frontend full suites pass;
- backend and frontend production builds pass;
- `git diff --check origin/main...HEAD` passes;
- independent local verification passes;
- human desktop/tablet/mobile and keyboard QA passes;
- final PR review finds no blocking issue;
- merge remains separately authorized.
