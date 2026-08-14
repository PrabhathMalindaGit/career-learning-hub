# Record Deletion & Destructive Actions Implementation Plan

> **Execution discipline:** implement task-by-task with test-driven development. Do not widen scope when a focused fix is sufficient.

**Date:** 2026-08-14  
**Status:** Written specification approved; implementation plan self-reviewed and awaiting explicit execution approval  
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
5. delete only matching terminal Interview jobs;
6. delete the owned InterviewSession root.

After commit, record `interview.session.deleted` with resourceType `interview-session` and the deleted session ID. Do not record answers, job description, model feedback, or other sensitive content.

## 3.3 Wire exact existing route middleware

`interview.routes.ts` already imports the middleware named `requireOwnedInterviewSession`. Register the new route with that exact middleware:

```ts
interviewRouter.delete(
  "/:sessionId",
  validate({ params: sessionIdParamsSchema }),
  requireOwnedInterviewSession,
  asyncHandler(deleteInterviewSessionController),
);
```

In `interview.controller.ts`, current controllers use generic `Request`; follow that style. The middleware places the owned root on `request.interviewSession`, but the deletion service still receives the authenticated user ID and route session ID so the transaction performs its own authoritative owner check:

```ts
export async function deleteInterviewSessionController(
  request: Request,
  response: Response,
): Promise<void> {
  await deleteInterviewSession({
    userId: request.auth!.userId,
    sessionId: request.params.sessionId,
  });
  response.status(204).send();
}
```

Do not rename or restructure `interviewOwnership.middleware.ts`.

## 3.4 Focused GREEN verification

```bash
npm --prefix backend test -- \
  src/tests/integration/interviewDeletion.integration.test.ts \
  src/tests/integration/interviewQuestionTypes.integration.test.ts \
  src/tests/integration/interviewFeedbackTypes.integration.test.ts \
  src/tests/integration/interviewStarterCode.integration.test.ts \
  src/tests/integration/jobExecutionFence.integration.test.ts
```

Then commit only the bounded files.

---

# Task 4 — Interview Coach permanent-deletion UI

## 4.1 RED tests

Extend `interviewApi.test.ts` and `InterviewSessionListPage.test.tsx`; create `InterviewDeleteDialog.test.tsx`.

Required cases:

- `204` DELETE API handling;
- exact stored session-title confirmation;
- warning says questions and Saved Attempts/Attempt History are removed permanently;
- duplicate submit protection;
- `409` active-job error is shown without changing archive state;
- keyboard modal/focus behavior;
- permanent deletion is available for active, completed, and archived cards;
- archived card still exposes Restore independently;
- successful deletion refreshes canonical list.

RED:

```bash
npm --prefix frontend test -- \
  src/features/interviews/interviewApi.test.ts \
  src/features/interviews/InterviewDeleteDialog.test.tsx \
  src/features/interviews/InterviewSessionListPage.test.tsx \
  src/features/interviews/InterviewSessionCard.restore.test.tsx
```

## 4.2 API helper

Add to `interviewApi.ts` using its existing `routeId` and `requestWithMetadata` conventions:

```ts
export async function deleteInterviewSession(
  sessionId: string,
  signal?: AbortSignal,
): Promise<void> {
  await requestWithMetadata<void>(
    `/interview-sessions/${routeId(sessionId)}`,
    {
      method: "DELETE",
      authentication: "required",
      signal,
    },
  );
}
```

## 4.3 Dialog and cards

Create `InterviewDeleteDialog.tsx` with:

```ts
type InterviewDeleteDialogProps = {
  session: Pick<InterviewSessionSummary, "id" | "title" | "targetRole">;
  onDeleted(sessionId: string): void;
};
```

Use `confirmation === session.title`. Do not require archive first.

Change `InterviewSessionCard` to accept `onDeleted(sessionId)` while leaving the existing `restoreSession()` logic unchanged. Keep `Open session` visually primary and `Delete permanently` destructive but secondary.

In `InterviewSessionListPage`, add a `reloadKey` because the current page has none. Include it in the existing list-fetch effect dependencies. On successful deletion, remove the ID locally and trigger reload/decrement a now-empty non-first page once.

GREEN: rerun the Task 4 focused command, including the pre-existing restore test.

---

# Task 5 — Learning library deletion discoverability

## 5.1 RED tests

Extend `LearningDocumentDeletion.test.tsx` to render two instances simultaneously and prove each dialog has a unique accessible heading ID.

Extend `LearningDashboard.test.tsx` to prove:

- non-deleting document card has both `Open workspace` and `Delete document`;
- a document already in `deleting` state does not expose a fresh delete trigger;
- accepted deletion suppresses the local duplicate trigger and causes canonical refresh;
- existing Open workspace behavior remains.

RED:

```bash
npm --prefix frontend test -- \
  src/features/learning/LearningDocumentDeletion.test.tsx \
  src/features/learning/LearningDashboard.test.tsx \
  src/features/learning/learningDeletionApi.test.ts \
  src/features/learning/learningDeletionContracts.test.ts
```

## 5.2 Make the existing component instance-safe

In `LearningDocumentDeletion.tsx`, replace the static heading ID with:

```ts
const deletionTitleId = `learning-deletion-title-${document.id}`;
```

Use it in both `dialog aria-labelledby` and the dialog `<h2 id>`. Do not change existing Learning exact-title semantics, polling, reconciliation, cancellation, retry, canonical-absence behavior, or workspace navigation.

## 5.3 Reuse the existing component in `LearningDashboard`

Render `LearningDocumentDeletion` in each non-deleting card's action/footer area. Pass the existing `accountId` and document. In `onDeletionAccepted`:

- locally mark only that card `status: "deleting"` so a second trigger disappears immediately;
- call the existing `refresh()`; the next server response remains authoritative.

Do not add deletion API/polling logic to `LearningDashboard`.

GREEN:

```bash
npm --prefix frontend test -- \
  src/features/learning/LearningDocumentDeletion.test.tsx \
  src/features/learning/LearningDashboard.test.tsx \
  src/features/learning/learningDeletionApi.test.ts \
  src/features/learning/learningDeletionContracts.test.ts \
  src/features/learning/LearningDocumentWorkspace.test.tsx
```

---

# Task 6 — Cross-feature security/race regression

Run after Tasks 1–5 are green.

Backend:

```bash
npm --prefix backend test -- \
  src/tests/integration/crossUserAccess.integration.test.ts \
  src/tests/integration/resumeDeletion.integration.test.ts \
  src/tests/integration/interviewDeletion.integration.test.ts \
  src/tests/integration/learningDocumentDeletionConcurrency.integration.test.ts \
  src/tests/integration/jobExecutionFence.integration.test.ts \
  src/tests/integration/resumeJobIdempotency.integration.test.ts
```

Frontend:

```bash
npm --prefix frontend test -- \
  src/features/resumes/ResumeListPage.test.tsx \
  src/features/resumes/ResumeDeleteDialog.test.tsx \
  src/features/interviews/InterviewSessionListPage.test.tsx \
  src/features/interviews/InterviewSessionCard.restore.test.tsx \
  src/features/interviews/InterviewDeleteDialog.test.tsx \
  src/features/learning/LearningDashboard.test.tsx \
  src/features/learning/LearningDocumentDeletion.test.tsx \
  src/features/learning/LearningDocumentWorkspace.test.tsx
```

If a regression fails, fix only the demonstrated defect in the owning feature and rerun both focused groups. Do not refactor unrelated modules.

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
- only the approved Resume/Interview/Learning implementation/test/style files and approved spec/plan process files changed;
- no package/lock/env/auth/migration/provider/deployment/unrelated feature file changed;
- worktree clean.

## 7.2 Independent user-local verification

After ChatGPT finishes implementation, give the user exactly:

```bash
cd "/Users/prabhathmalinda/Documents/Projects/Career Learning Hub"

git fetch origin
git switch task/record-deletion-destructive-actions
git pull --ff-only

git branch --show-current
git rev-parse HEAD
git status --short

npm --prefix backend run typecheck:all
npm --prefix backend test
npm --prefix backend run build

npm --prefix frontend run typecheck
npm --prefix frontend test
npm --prefix frontend run build

git diff --check origin/main...HEAD
git diff --name-only origin/main...HEAD
git status --short
```

The user must paste the complete output. Do not call the implementation verified solely because GitHub edits were accepted.

## 7.3 Human browser QA after automated verification is green

Verify with real local UI:

1. Resume Studio: delete success with exact-title confirmation; card disappears.
2. Resume: wrong title leaves permanent button disabled.
3. Resume: active related AI job produces clear `409`; record remains.
4. Interview: active session can be permanently deleted without archive prerequisite.
5. Interview: archived session shows Restore and Delete permanently as separate actions.
6. Interview: wrong title and `409` states remain keyboard accessible.
7. Learning library: Delete document appears alongside Open workspace for deletable records.
8. Learning: a `deleting` document has no duplicate fresh delete trigger.
9. Learning: existing asynchronous deletion polling/reconciliation still works.
10. Desktop/tablet/mobile widths: destructive actions do not overlap or overpower primary Open/Restore actions.
11. Keyboard: open/cancel/confirm, Tab/Shift+Tab containment, Escape, and trigger focus return.

## 7.4 Final PR review gate

Before taking PR #18 out of draft, verify all approved invariants:

- Resume 204 owner-scoped delete; versions/analyses/direct Assets/terminal jobs cleaned; active AI job 409; no cross-user or unrelated Asset deletion.
- Interview 204 delete for all lifecycle states; attempts/questions/terminal jobs cleaned; source Resume preserved; Archive/Restore unchanged; active AI job 409.
- Learning existing backend/state machine reused; library action discoverable; no duplicate trigger while deleting; instance-safe dialog IDs.
- No Trash/retention/undo/bulk/generic framework.
- No provider/auth/migration/deployment/Phase19C change.

Mark PR ready only after automated, user-local, browser, and diff review evidence is accepted. Merge remains a separate explicit approval. Do not deploy or delete branches.

## 8. Plan self-review result

**PASS.** The plan was checked against the current repository after creation. The self-review corrected the initial draft's ambiguous Interview naming so it now uses the actual current interfaces:

- route middleware: `requireOwnedInterviewSession`;
- transaction-aware service owner lookup: `requireOwnedSession`;
- controller style: generic Express `Request`, matching current Interview controllers.

The plan also uses the actual `StorageProvider` type instead of restating its union locally and explicitly keeps Learning's existing title-confirmation semantics unchanged.

## 9. Approval gate

Production and test implementation is still **not authorized** until the user explicitly approves this plan plus inline execution.

Required phrase:

**`APPROVE RECORD DELETION PLAN + INLINE EXECUTION`**
