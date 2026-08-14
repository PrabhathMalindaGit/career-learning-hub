# Record Deletion & Destructive Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add secure, discoverable permanent deletion for Resume and Interview records, expose the existing Learning document deletion workflow from the library, and preserve all current ownership, job-resilience, archive/restore, and data-integrity invariants.

**Architecture:** Reuse the existing authenticated feature routers, MongoDB transaction helper, Asset storage abstraction, JobRecord lifecycle, and Learning deletion state machine. Resume and Interview use synchronous owner-scoped cascades with `204 No Content`; they refuse deletion with `409` while directly associated AI jobs are queued/processing. Learning remains asynchronous and unchanged at the backend; only its existing deletion component is made safe for repeated card-level rendering and surfaced from the library.

**Tech Stack:** Express 5, TypeScript 5.8, Mongoose 8, MongoDB transactions, Vitest, Supertest, React 19, React Router, Testing Library, Vite.

## Global Constraints

- Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.
- Work only on `task/record-deletion-destructive-actions`, based on `main @ 91f911f013fa35b4288f4299237b19c14a07d187`.
- Draft PR: `#18 — Record deletion and destructive actions`.
- Gemini Direct remains the only active AI provider policy; deletion itself must make no Gemini call.
- Do not add Trash, recycle bin, retention windows, undo, bulk deletion, a generic deletion framework, a new deletion worker, migrations, deployment changes, or Phase 19C+ work.
- Backend ownership is authoritative; typed-title confirmation is only an accidental-action guard.
- Resume deletion removes only server-derived Resume dependencies: ResumeVersions, ResumeAnalyses, directly associated Candidate Photo/import Assets, and directly associated terminal/cancelled Resume jobs.
- Interview deletion removes only server-derived Interview dependencies: InterviewAttempts, InterviewQuestions, the InterviewSession, and directly associated terminal/cancelled Interview jobs. It must never delete source Resume records.
- Resume/Interview deletion must return `409` while a directly associated job is `queued` or `processing`; do not auto-cancel the job.
- Learning backend deletion remains unchanged. Reuse `LearningDocumentDeletion` and the existing `DELETE /learning-documents/:documentId` workflow.
- Historical ActivityEvents are retained; add feature-level deletion events without copying sensitive record contents into activity metadata or logs.
- No deployment, merge, or branch deletion is authorized by plan approval.

## Execution Environment

- **Codex model:** not applicable; Codex is not used for this project workflow.
- **Codex Intelligence level:** not applicable.
- **Implementation executor:** ChatGPT inline through the GitHub connector after explicit plan + inline-execution approval.
- **Browser use:** prohibited for backend-only tasks; required for final human-visible Resume/Interview/Learning deletion QA after automated verification is green.
- **Manual terminal commands now:** none for plan approval.
- **Manual terminal commands after implementation:** required. The user will pull the task branch and run the exact focused tests, full regression/typecheck/build commands listed in Task 7.
- **Services for automated tests:** no manually persistent service should be needed beyond the repository's existing test harness/MongoDB-memory setup.
- **Services for browser QA:** the normal local Career Learning Hub frontend/backend/MongoDB development stack must be running; use the project's existing local startup workflow, not new infrastructure.

---

## File Map

### Backend — Resume

- Modify `backend/src/modules/resumes/resume.routes.ts` — register `DELETE /:resumeId`.
- Modify `backend/src/modules/resumes/resume.controller.ts` — add `deleteResumeController` returning `204`.
- Modify `backend/src/modules/resumes/resume.service.ts` — add owner-scoped cascade, active-job gate, terminal job cleanup, activity event.
- Modify `backend/src/modules/assets/asset.service.ts` — add two narrow internal cascade helpers: mark specific owned assets deleted inside a caller transaction and perform best-effort physical object cleanup after commit.
- Create `backend/src/tests/integration/resumeDeletion.integration.test.ts` — deletion, ownership, dependency, job, asset, failure/race coverage.

### Frontend — Resume

- Modify `frontend/src/features/resumes/resumeApi.ts` — add `deleteResume`.
- Modify `frontend/src/features/resumes/resumeApi.test.ts` — validate DELETE request/204 handling.
- Create `frontend/src/features/resumes/ResumeDeleteDialog.tsx` — feature-local accessible confirmation dialog.
- Create `frontend/src/features/resumes/ResumeDeleteDialog.test.tsx` — exact-title, busy, error, focus, duplicate-submit tests.
- Modify `frontend/src/features/resumes/ResumeListPage.tsx` — surface `Delete resume`, refresh canonical list after success.
- Modify `frontend/src/features/resumes/ResumeListPage.test.tsx` — card-level deletion behavior.
- Modify `frontend/src/features/resumes/resumeWorkspace.css` — compact destructive action/dialog styling only.

### Backend — Interview

- Modify `backend/src/modules/interviews/interview.routes.ts` — register `DELETE /:sessionId` with existing session ownership validation/middleware pattern.
- Modify `backend/src/modules/interviews/interview.controller.ts` — add `deleteInterviewSessionController` returning `204`.
- Modify `backend/src/modules/interviews/interview.service.ts` — owner-scoped cascade, active-job gate, terminal job cleanup, activity event.
- Create `backend/src/tests/integration/interviewDeletion.integration.test.ts` — lifecycle states, questions/attempts, ownership, source Resume preservation, jobs, failure/race coverage.

### Frontend — Interview

- Modify `frontend/src/features/interviews/interviewApi.ts` — add `deleteInterviewSession`.
- Modify `frontend/src/features/interviews/interviewApi.test.ts` — DELETE request/204 handling.
- Create `frontend/src/features/interviews/InterviewDeleteDialog.tsx` — feature-local accessible confirmation dialog.
- Create `frontend/src/features/interviews/InterviewDeleteDialog.test.tsx` — exact-title, busy, error, focus, duplicate-submit tests.
- Modify `frontend/src/features/interviews/InterviewSessionCard.tsx` — render permanent delete separately from Archive/Restore/Open.
- Modify `frontend/src/features/interviews/InterviewSessionListPage.tsx` — canonical refresh after deletion.
- Modify `frontend/src/features/interviews/InterviewSessionListPage.test.tsx` — active/completed/archived deletion affordance/list refresh.
- Modify `frontend/src/features/interviews/interviewCoach.css` — bounded destructive action/dialog styles.

### Frontend — Learning

- Modify `frontend/src/features/learning/LearningDocumentDeletion.tsx` — support library embedding without duplicate static dialog IDs; keep existing backend/state machine intact.
- Modify `frontend/src/features/learning/LearningDocumentDeletion.test.tsx` — unique accessible IDs and existing behavior regression.
- Modify `frontend/src/features/learning/LearningDashboard.tsx` — render existing deletion control per non-deleting card and refresh canonical list on deletion acceptance/completion.
- Modify `frontend/src/features/learning/LearningDashboard.test.tsx` — library discoverability, no duplicate trigger for deleting documents, list refresh.
- Modify `frontend/src/features/learning/learningWorkspace.css` only if card action layout needs a small responsive adjustment.

### Process / verification

- Modify PR #18 body during execution to track task status and verification evidence.
- Do not update `CURRENT_PHASE.md` until the feature is actually accepted/merged through the normal governance workflow.

---

### Task 1: Resume backend permanent deletion and dependency cleanup

**Files:**
- Modify: `backend/src/modules/resumes/resume.routes.ts`
- Modify: `backend/src/modules/resumes/resume.controller.ts`
- Modify: `backend/src/modules/resumes/resume.service.ts`
- Modify: `backend/src/modules/assets/asset.service.ts`
- Create: `backend/src/tests/integration/resumeDeletion.integration.test.ts`

**Interfaces:**
- Consumes: `requireOwnedResume`, `ResumeVersionModel`, `ResumeAnalysisModel`, `JobRecordModel`, `withMongoTransaction`, `AssetModel`/storage abstractions through `asset.service.ts`, `recordActivitySafely`.
- Produces: `deleteResume(input: { userId: string; resumeId: string }): Promise<void>`; `markOwnedAssetsDeletedForCascade(...)`; `deleteCascadeAssetObjectsBestEffort(...)`; authenticated `DELETE /api/v1/resumes/:resumeId` returning `204`.

- [ ] **Step 1: Write the failing Resume deletion integration tests**

Create `resumeDeletion.integration.test.ts` using the established `app`, `request`, and `registerTestUser` pattern. The first group must prove canonical cascade behavior:

```ts
it("permanently deletes the owner's Resume and owned dependencies", async () => {
  const owner = await registerTestUser(app, {
    email: "resume-delete-owner@example.com",
    displayName: "Resume Delete Owner",
  });

  const created = await request(app)
    .post("/api/v1/resumes")
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .send({ title: "Delete Me" })
    .expect(201);

  const resumeId = created.body.data.resume._id;

  await request(app)
    .post(`/api/v1/resumes/${resumeId}/versions`)
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .send({
      content: created.body.data.version.content,
      expectedCurrentVersionId: created.body.data.version._id,
      changeSummary: "Second version",
    })
    .expect(201);

  await request(app)
    .delete(`/api/v1/resumes/${resumeId}`)
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .expect(204);

  expect(await ResumeModel.countDocuments({ _id: resumeId })).toBe(0);
  expect(await ResumeVersionModel.countDocuments({ resumeId })).toBe(0);
  expect(await ResumeAnalysisModel.countDocuments({ resumeId })).toBe(0);
});
```

Add separate tests in the same file for:

```ts
it("returns the established not-found response for a foreign Resume")
it("does not touch another user's Resume or Assets")
it.each(["queued", "processing"])("returns 409 with no partial delete when a related resume.analyze job is %s")
it.each(["completed", "failed", "cancelled"])("removes terminal related Resume jobs with status %s")
it("removes the adopted resume.import-pdf job by result.resumeId")
it("marks the Candidate Photo and imported source Asset deleted and invokes storage cleanup")
it("does not delete unrelated Assets")
it("does not report success when the Mongo transaction fails")
it("does not allow a late analysis persistence path to recreate the deleted Resume")
```

For the active-job assertions, require exact safe behavior:

```ts
expect(response.status).toBe(409);
expect(response.body.error.code).toBe("RESUME_DELETE_BLOCKED_BY_ACTIVE_JOB");
expect(await ResumeModel.exists({ _id: resumeId })).toBeTruthy();
expect(await ResumeVersionModel.countDocuments({ resumeId })).toBeGreaterThan(0);
```

- [ ] **Step 2: Run the Resume deletion integration test and verify RED**

Run:

```bash
npm --prefix backend test -- src/tests/integration/resumeDeletion.integration.test.ts
```

Expected: FAIL because `DELETE /api/v1/resumes/:resumeId` and cascade helpers do not exist yet.

- [ ] **Step 3: Add narrow Asset cascade helpers**

In `asset.service.ts`, add an internal typed cleanup descriptor and two exported feature-service helpers. The database helper must accept only explicit server-derived IDs and a caller transaction:

```ts
export type AssetCascadeCleanupTarget = {
  assetId: string;
  storageProvider: "local" | "s3";
  storageKey: string;
};

export async function markOwnedAssetsDeletedForCascade(input: {
  userId: string;
  assetIds: string[];
  session: ClientSession;
}): Promise<AssetCascadeCleanupTarget[]> {
  const uniqueIds = [...new Set(input.assetIds)];
  if (uniqueIds.length === 0) return [];

  const assets = await AssetModel.find({
    _id: { $in: uniqueIds },
    userId: input.userId,
    status: { $ne: "deleted" },
  }).session(input.session);

  const deletedAt = new Date();
  for (const asset of assets) {
    asset.status = "deleted";
    asset.deletedAt = deletedAt;
    asset.expiresAt = undefined;
    await asset.save({ session: input.session });
  }

  return assets.map((asset) => ({
    assetId: asset._id.toString(),
    storageProvider: asset.storageProvider,
    storageKey: asset.storageKey,
  }));
}
```

Physical cleanup must happen only after the transaction commits and must never expose storage keys to the API:

```ts
export async function deleteCascadeAssetObjectsBestEffort(
  targets: readonly AssetCascadeCleanupTarget[],
): Promise<void> {
  for (const target of targets) {
    try {
      await getStorageForProvider(target.storageProvider)
        .deleteObject(target.storageKey);
    } catch (error) {
      logger.error("asset.cascade_cleanup.failed", {
        assetId: target.assetId,
        storageProvider: target.storageProvider,
        ...serializeErrorForLog(error),
      });
    }
  }
}
```

Do not modify public `deleteOwnedAsset` semantics or weaken `RESUME_PHOTO_ATTACHED`.

- [ ] **Step 4: Implement `deleteResume` transactionally**

In `resume.service.ts`, import `JobRecordModel`, `ResumeAnalysisModel`, and the two Asset helpers. Implement these exact resource selectors:

```ts
const activeResumeJobFilter = (userId: string, resumeId: string) => ({
  userId,
  status: { $in: ["queued", "processing"] },
  type: "resume.analyze",
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

Then implement:

```ts
export async function deleteResume(input: {
  userId: string;
  resumeId: string;
}): Promise<void> {
  const cleanupTargets = await withMongoTransaction(async (session) => {
    const resume = await requireOwnedResume(input.userId, input.resumeId, session);

    const activeJob = await JobRecordModel.exists(
      activeResumeJobFilter(input.userId, input.resumeId),
    ).session(session);
    if (activeJob) {
      throw new AppError(
        409,
        "RESUME_DELETE_BLOCKED_BY_ACTIVE_JOB",
        "Finish or cancel the current Resume AI work before deleting this Resume.",
      );
    }

    const versions = await ResumeVersionModel.find({
      userId: input.userId,
      resumeId: resume._id,
    })
      .select("sourceAssetId")
      .session(session);

    const assetIds = [
      ...(resume.candidatePhotoAssetId
        ? [resume.candidatePhotoAssetId.toString()]
        : []),
      ...versions.flatMap((version) =>
        version.sourceAssetId ? [version.sourceAssetId.toString()] : [],
      ),
    ];

    const targets = await markOwnedAssetsDeletedForCascade({
      userId: input.userId,
      assetIds,
      session,
    });

    await ResumeAnalysisModel.deleteMany({
      userId: input.userId,
      resumeId: resume._id,
    }).session(session);
    await ResumeVersionModel.deleteMany({
      userId: input.userId,
      resumeId: resume._id,
    }).session(session);
    await JobRecordModel.deleteMany(
      terminalResumeJobFilter(input.userId, input.resumeId),
    ).session(session);
    await ResumeModel.deleteOne({
      _id: resume._id,
      userId: input.userId,
    }).session(session);

    return targets;
  });

  await deleteCascadeAssetObjectsBestEffort(cleanupTargets);
  await recordActivitySafely({
    userId: input.userId,
    type: "resume.deleted",
    resourceType: "resume",
    resourceId: input.resumeId,
    origin: "api",
  });
}
```

If the actual `recordActivitySafely` input defaults `origin`, omit `origin` rather than changing the activity API.

- [ ] **Step 5: Wire controller and route**

In `resume.controller.ts`:

```ts
export async function deleteResumeController(
  request: Request<ResumeIdParams>,
  response: Response,
): Promise<void> {
  await deleteResume({
    userId: request.auth!.userId,
    resumeId: request.params.resumeId,
  });
  response.status(204).send();
}
```

In `resume.routes.ts`, place the delete route after Candidate Photo routes and before the generic `GET /:resumeId` route:

```ts
resumeRouter.delete(
  "/:resumeId",
  validate({ params: resumeIdParamsSchema }),
  asyncHandler(deleteResumeController),
);
```

- [ ] **Step 6: Run focused Resume backend tests and verify GREEN**

Run:

```bash
npm --prefix backend test -- \
  src/tests/integration/resumeDeletion.integration.test.ts \
  src/tests/integration/resumeCandidatePhoto.integration.test.ts \
  src/tests/integration/resumePdfImport.integration.test.ts \
  src/tests/integration/resumeJobIdempotency.integration.test.ts \
  src/tests/integration/jobExecutionFence.integration.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit Resume backend deletion**

```bash
git add \
  backend/src/modules/assets/asset.service.ts \
  backend/src/modules/resumes/resume.controller.ts \
  backend/src/modules/resumes/resume.routes.ts \
  backend/src/modules/resumes/resume.service.ts \
  backend/src/tests/integration/resumeDeletion.integration.test.ts
git commit -m "feat: add secure resume deletion"
```

---

### Task 2: Resume Studio deletion UI

**Files:**
- Modify: `frontend/src/features/resumes/resumeApi.ts`
- Modify: `frontend/src/features/resumes/resumeApi.test.ts`
- Create: `frontend/src/features/resumes/ResumeDeleteDialog.tsx`
- Create: `frontend/src/features/resumes/ResumeDeleteDialog.test.tsx`
- Modify: `frontend/src/features/resumes/ResumeListPage.tsx`
- Modify: `frontend/src/features/resumes/ResumeListPage.test.tsx`
- Modify: `frontend/src/features/resumes/resumeWorkspace.css`

**Interfaces:**
- Consumes: authenticated `DELETE /resumes/:resumeId`, `ResumeRecord`, `ApiError`.
- Produces: `deleteResume(resumeId, signal): Promise<void>` and `ResumeDeleteDialog` callback `onDeleted(resumeId: string): void`.

- [ ] **Step 1: Add failing API and dialog tests**

In `resumeApi.test.ts`, add a test that expects:

```ts
await deleteResume("507f1f77bcf86cd799439011");
expect(fetch).toHaveBeenCalledWith(
  expect.stringContaining("/resumes/507f1f77bcf86cd799439011"),
  expect.objectContaining({ method: "DELETE" }),
);
```

Mock a `204` response and assert the promise resolves without requiring a success body.

Create `ResumeDeleteDialog.test.tsx` covering:

```ts
it("requires the exact stored Resume title before enabling permanent deletion")
it("submits only once while the DELETE request is busy")
it("shows the safe server error and request ID when deletion is blocked")
it("returns focus to the trigger when cancelled")
it("traps Tab focus inside the open dialog and supports Escape")
```

- [ ] **Step 2: Run Resume frontend tests and verify RED**

```bash
npm --prefix frontend test -- \
  src/features/resumes/resumeApi.test.ts \
  src/features/resumes/ResumeDeleteDialog.test.tsx \
  src/features/resumes/ResumeListPage.test.tsx
```

Expected: FAIL because API/dialog/card behavior is absent.

- [ ] **Step 3: Add `deleteResume` API helper**

In `resumeApi.ts`:

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

Do not add a response parser for `204`.

- [ ] **Step 4: Implement feature-local Resume confirmation dialog**

Create `ResumeDeleteDialog.tsx` with props:

```ts
type ResumeDeleteDialogProps = {
  resume: Pick<ResumeRecord, "id" | "title">;
  onDeleted(resumeId: string): void;
};
```

Required behavior:

```ts
const [open, setOpen] = useState(false);
const [confirmation, setConfirmation] = useState("");
const [busy, setBusy] = useState(false);
const [error, setError] = useState<SafeError | null>(null);
const confirmed = confirmation === resume.title;
```

The dialog copy must state that versions, analyses, Candidate Photo, and associated imported Resume PDF source files are permanently removed. Use the existing feature button classes plus one small destructive modifier; do not add a global dialog system.

On successful `deleteResume`:

```ts
await deleteResume(resume.id, controller.signal);
if (!controller.signal.aborted) {
  setOpen(false);
  setConfirmation("");
  onDeleted(resume.id);
}
```

On `409`, show the backend message; do not auto-cancel the AI job and do not retry automatically.

- [ ] **Step 5: Surface deletion on Resume cards and refresh canonical list**

In `ResumeListPage.tsx`, render the dialog in each card footer/action area:

```tsx
<ResumeDeleteDialog
  resume={resume}
  onDeleted={(resumeId) => {
    setResumes((current) =>
      current.filter((item) => item.id !== resumeId),
    );
    setReloadKey((key) => key + 1);
  }}
/>
```

Keep `Open Resume` visually primary. If the last item on a page is deleted and `page > 1`, canonical reload may reveal an empty page; in that case decrement to the previous page once rather than inventing client pagination data.

- [ ] **Step 6: Run focused Resume frontend tests and verify GREEN**

```bash
npm --prefix frontend test -- \
  src/features/resumes/resumeApi.test.ts \
  src/features/resumes/ResumeDeleteDialog.test.tsx \
  src/features/resumes/ResumeListPage.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit Resume frontend deletion**

```bash
git add frontend/src/features/resumes
git commit -m "feat: add resume deletion controls"
```

---

### Task 3: Interview backend permanent deletion while preserving Archive/Restore

**Files:**
- Modify: `backend/src/modules/interviews/interview.routes.ts`
- Modify: `backend/src/modules/interviews/interview.controller.ts`
- Modify: `backend/src/modules/interviews/interview.service.ts`
- Create: `backend/src/tests/integration/interviewDeletion.integration.test.ts`

**Interfaces:**
- Consumes: `InterviewSessionModel`, `InterviewQuestionModel`, `InterviewAttemptModel`, `JobRecordModel`, `withMongoTransaction`, existing owner-scoped Interview lookup/middleware, `recordActivitySafely`.
- Produces: `deleteInterviewSession(input: { userId: string; sessionId: string }): Promise<void>` and authenticated `DELETE /api/v1/interview-sessions/:sessionId` returning `204`.

- [ ] **Step 1: Write failing Interview deletion integration tests**

Create `interviewDeletion.integration.test.ts` using `app`, `request`, and `registerTestUser`. Cover:

```ts
it.each(["active", "completed", "archived"])("permanently deletes a %s session and its questions/attempts")
it("preserves a source Resume and ResumeVersion referenced by the session")
it("returns the established not-found behavior for a foreign session")
it("does not touch another user's session, questions, or attempts")
it.each(["queued", "processing"])("returns 409 with no partial delete for a related %s job")
it.each(["completed", "failed", "cancelled"])("removes terminal Interview jobs with status %s")
it("does not report success when the Mongo transaction fails")
it("does not allow late Interview AI persistence to recreate the deleted session")
```

The active-job failure must assert:

```ts
expect(response.status).toBe(409);
expect(response.body.error.code).toBe(
  "INTERVIEW_DELETE_BLOCKED_BY_ACTIVE_JOB",
);
expect(await InterviewSessionModel.exists({ _id: sessionId })).toBeTruthy();
expect(await InterviewQuestionModel.countDocuments({ sessionId })).toBeGreaterThan(0);
```

- [ ] **Step 2: Run Interview deletion tests and verify RED**

```bash
npm --prefix backend test -- src/tests/integration/interviewDeletion.integration.test.ts
```

Expected: FAIL because the delete route/service does not exist.

- [ ] **Step 3: Implement exact Interview job selectors and cascade**

In `interview.service.ts`, define the current typed job set:

```ts
const interviewJobTypes = [
  "interview.questions.generate",
  "interview.question.explain",
  "interview.attempt.feedback",
] as const;
```

Use only jobs owned by the same user and whose typed payload contains the target `sessionId`:

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
}): Promise<void> {
  await withMongoTransaction(async (session) => {
    const interviewSession = await requireOwnedInterviewSession(
      input.userId,
      input.sessionId,
      session,
    );

    const activeJob = await JobRecordModel.exists({
      ...interviewJobFilter(input.userId, input.sessionId),
      status: { $in: ["queued", "processing"] },
    }).session(session);

    if (activeJob) {
      throw new AppError(
        409,
        "INTERVIEW_DELETE_BLOCKED_BY_ACTIVE_JOB",
        "Finish or cancel the current Interview AI work before permanently deleting this session.",
      );
    }

    await InterviewAttemptModel.deleteMany({
      userId: input.userId,
      sessionId: interviewSession._id,
    }).session(session);
    await InterviewQuestionModel.deleteMany({
      userId: input.userId,
      sessionId: interviewSession._id,
    }).session(session);
    await JobRecordModel.deleteMany({
      ...interviewJobFilter(input.userId, input.sessionId),
      status: { $in: ["completed", "failed", "cancelled"] },
    }).session(session);
    await InterviewSessionModel.deleteOne({
      _id: interviewSession._id,
      userId: input.userId,
    }).session(session);
  });

  await recordActivitySafely({
    userId: input.userId,
    type: "interview.session.deleted",
    resourceType: "interview-session",
    resourceId: input.sessionId,
  });
}
```

If `requireOwnedInterviewSession` currently lacks an optional `ClientSession`, extend only that function signature and its query to accept/session-bind one; do not restructure Interview ownership middleware.

- [ ] **Step 4: Wire Interview controller and route**

Controller:

```ts
export async function deleteInterviewSessionController(
  request: Request<SessionIdParams>,
  response: Response,
): Promise<void> {
  await deleteInterviewSession({
    userId: request.auth!.userId,
    sessionId: request.params.sessionId,
  });
  response.status(204).send();
}
```

Route:

```ts
interviewRouter.delete(
  "/:sessionId",
  validate({ params: sessionIdParamsSchema }),
  requireOwnedInterviewSessionMiddleware,
  asyncHandler(deleteInterviewSessionController),
);
```

Use the repository's actual existing ownership middleware export name/order from `interview.routes.ts`; do not duplicate an ownership check middleware if the route file already applies it at a broader scope.

- [ ] **Step 5: Run focused Interview backend tests and verify GREEN**

```bash
npm --prefix backend test -- \
  src/tests/integration/interviewDeletion.integration.test.ts \
  src/tests/integration/interviewQuestionTypes.integration.test.ts \
  src/tests/integration/interviewFeedbackTypes.integration.test.ts \
  src/tests/integration/interviewStarterCode.integration.test.ts \
  src/tests/integration/jobExecutionFence.integration.test.ts
```

Expected: PASS, including existing Archive/Restore and question/attempt behavior.

- [ ] **Step 6: Commit Interview backend deletion**

```bash
git add \
  backend/src/modules/interviews/interview.controller.ts \
  backend/src/modules/interviews/interview.routes.ts \
  backend/src/modules/interviews/interview.service.ts \
  backend/src/tests/integration/interviewDeletion.integration.test.ts
git commit -m "feat: add secure interview deletion"
```

---

### Task 4: Interview Coach permanent-deletion UI

**Files:**
- Modify: `frontend/src/features/interviews/interviewApi.ts`
- Modify: `frontend/src/features/interviews/interviewApi.test.ts`
- Create: `frontend/src/features/interviews/InterviewDeleteDialog.tsx`
- Create: `frontend/src/features/interviews/InterviewDeleteDialog.test.tsx`
- Modify: `frontend/src/features/interviews/InterviewSessionCard.tsx`
- Modify: `frontend/src/features/interviews/InterviewSessionListPage.tsx`
- Modify: `frontend/src/features/interviews/InterviewSessionListPage.test.tsx`
- Modify: `frontend/src/features/interviews/interviewCoach.css`

**Interfaces:**
- Consumes: `DELETE /interview-sessions/:sessionId`, `InterviewSessionSummary`, existing Restore/Open behavior.
- Produces: `deleteInterviewSession(sessionId, signal): Promise<void>` and `InterviewDeleteDialog` callback `onDeleted(sessionId: string): void`.

- [ ] **Step 1: Add failing Interview API/dialog/card tests**

Add API test for a `204` DELETE request.

Create `InterviewDeleteDialog.test.tsx` covering:

```ts
it("requires the exact stored session title")
it("explains that questions and Saved Attempts/Attempt History are removed")
it("submits only once while busy")
it("shows a 409 active-job error without changing archive state")
it("returns focus on cancel and supports keyboard dialog behavior")
```

Extend `InterviewSessionListPage.test.tsx` to prove permanent delete is available for active, completed, and archived cards while Restore remains present for archived cards.

- [ ] **Step 2: Run Interview frontend tests and verify RED**

```bash
npm --prefix frontend test -- \
  src/features/interviews/interviewApi.test.ts \
  src/features/interviews/InterviewDeleteDialog.test.tsx \
  src/features/interviews/InterviewSessionListPage.test.tsx \
  src/features/interviews/InterviewSessionCard.restore.test.tsx
```

Expected: FAIL for missing delete behavior; existing restore test must remain green once implementation lands.

- [ ] **Step 3: Add `deleteInterviewSession` API helper**

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

Use the existing request helper conventions in `interviewApi.ts`; do not add a fake response parser for `204`.

- [ ] **Step 4: Implement `InterviewDeleteDialog`**

Props:

```ts
type InterviewDeleteDialogProps = {
  session: Pick<InterviewSessionSummary, "id" | "title" | "targetRole">;
  onDeleted(sessionId: string): void;
};
```

Use case-sensitive exact title equality:

```ts
const confirmed = confirmation === session.title;
```

Copy must explicitly say permanent deletion removes the session's questions and Saved Attempts/Attempt History and cannot be undone. Do not require archive first.

- [ ] **Step 5: Integrate with `InterviewSessionCard` without weakening Archive/Restore**

Change card props to:

```ts
export function InterviewSessionCard({
  session,
  onDeleted,
}: {
  session: InterviewSessionSummary;
  onDeleted(sessionId: string): void;
})
```

Render `InterviewDeleteDialog` in the footer after lifecycle-specific Restore and before/after Open according to visual hierarchy, with destructive styling visually subordinate to the Open link.

Do not change `restoreSession()` logic.

- [ ] **Step 6: Refresh canonical list after deletion**

In `InterviewSessionListPage.tsx`:

```tsx
<InterviewSessionCard
  key={session.id}
  session={session}
  onDeleted={(sessionId) => {
    setSessions((current) =>
      current.filter((item) => item.id !== sessionId),
    );
    setReloadKey((key) => key + 1);
  }}
/>
```

Add `reloadKey` to the existing list-fetch dependency list. If deleting the last item on a page leaves an empty page and `page > 1`, move back one page once.

- [ ] **Step 7: Run focused Interview frontend tests and verify GREEN**

```bash
npm --prefix frontend test -- \
  src/features/interviews/interviewApi.test.ts \
  src/features/interviews/InterviewDeleteDialog.test.tsx \
  src/features/interviews/InterviewSessionListPage.test.tsx \
  src/features/interviews/InterviewSessionCard.restore.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit Interview frontend deletion**

```bash
git add frontend/src/features/interviews
git commit -m "feat: add interview deletion controls"
```

---

### Task 5: Expose the existing Learning deletion workflow from the library

**Files:**
- Modify: `frontend/src/features/learning/LearningDocumentDeletion.tsx`
- Modify: `frontend/src/features/learning/LearningDocumentDeletion.test.tsx`
- Modify: `frontend/src/features/learning/LearningDashboard.tsx`
- Modify: `frontend/src/features/learning/LearningDashboard.test.tsx`
- Modify: `frontend/src/features/learning/learningWorkspace.css` only if needed for bounded card-action layout.

**Interfaces:**
- Consumes: existing `LearningDocumentDeletion`, `requestLearningDocumentDeletion`, `fetchLearningDocumentDeletionJob`, `pollLearningJob`, `LearningDocument`.
- Produces: reusable library rendering of the same deletion component with unique accessible dialog IDs and canonical dashboard refresh.

- [ ] **Step 1: Add failing Learning library/ID tests**

In `LearningDocumentDeletion.test.tsx`, render two deletion controls at once and assert each dialog's `aria-labelledby` resolves to its own heading:

```ts
expect(screen.getAllByRole("button", { name: "Delete document" }))
  .toHaveLength(2);
```

Open each independently and assert no duplicate static `learning-deletion-title` ID is used.

In `LearningDashboard.test.tsx`, add:

```ts
it("shows Delete document beside Open workspace for a non-deleting document")
it("does not show a fresh delete trigger for a document already marked deleting")
it("refreshes the canonical list after deletion is accepted")
it("keeps the existing Open workspace navigation available")
```

- [ ] **Step 2: Run focused Learning tests and verify RED**

```bash
npm --prefix frontend test -- \
  src/features/learning/LearningDocumentDeletion.test.tsx \
  src/features/learning/LearningDashboard.test.tsx \
  src/features/learning/learningDeletionApi.test.ts \
  src/features/learning/learningDeletionContracts.test.ts
```

Expected: FAIL only for the new library/unique-ID expectations.

- [ ] **Step 3: Make Learning deletion dialog IDs instance-safe**

Replace the static heading ID with a document-specific ID:

```ts
const deletionTitleId = `learning-deletion-title-${document.id}`;
```

Then:

```tsx
<dialog
  ref={dialogRef}
  className="learning-deletion-dialog"
  aria-labelledby={deletionTitleId}
  ...
>
  ...
  <h2 id={deletionTitleId}>Permanently delete document</h2>
```

Do not change existing polling, reconciliation, cancellation, retry, title-confirmation, or navigation semantics.

- [ ] **Step 4: Render the existing component on each Learning library card**

Import `LearningDocumentDeletion` in `LearningDashboard.tsx` and add it to the card footer/action area:

```tsx
{document.status !== "deleting" ? (
  <LearningDocumentDeletion
    accountId={accountId}
    document={document}
    onDeletionAccepted={() => {
      setDocuments((current) =>
        current.map((item) =>
          item.id === document.id
            ? { ...item, status: "deleting" }
            : item,
        ),
      );
      refresh();
    }}
  />
) : null}
```

The local state change only suppresses a duplicate destructive trigger after the server accepts deletion; the next canonical list request remains authoritative.

Do not duplicate any Learning deletion API logic inside `LearningDashboard`.

- [ ] **Step 5: Run focused Learning tests and verify GREEN**

```bash
npm --prefix frontend test -- \
  src/features/learning/LearningDocumentDeletion.test.tsx \
  src/features/learning/LearningDashboard.test.tsx \
  src/features/learning/learningDeletionApi.test.ts \
  src/features/learning/learningDeletionContracts.test.ts \
  src/features/learning/LearningDocumentWorkspace.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit Learning library deletion discoverability**

```bash
git add \
  frontend/src/features/learning/LearningDashboard.tsx \
  frontend/src/features/learning/LearningDashboard.test.tsx \
  frontend/src/features/learning/LearningDocumentDeletion.tsx \
  frontend/src/features/learning/LearningDocumentDeletion.test.tsx \
  frontend/src/features/learning/learningWorkspace.css
git commit -m "feat: expose learning document deletion in library"
```

If CSS did not need modification, omit it from `git add`.

---

### Task 6: Cross-feature security and race regression

**Files:**
- Modify only the Task 1–5 files if a test exposes a real defect.
- Test: `backend/src/tests/integration/resumeDeletion.integration.test.ts`
- Test: `backend/src/tests/integration/interviewDeletion.integration.test.ts`
- Existing security/integration tests as listed below.

**Interfaces:**
- Consumes: completed Resume/Interview/Learning deletion implementations.
- Produces: evidence that ownership, worker fencing, archive/restore, and existing Learning deletion concurrency remain intact.

- [ ] **Step 1: Run ownership and deletion-concurrency regressions**

```bash
npm --prefix backend test -- \
  src/tests/integration/crossUserAccess.integration.test.ts \
  src/tests/integration/resumeDeletion.integration.test.ts \
  src/tests/integration/interviewDeletion.integration.test.ts \
  src/tests/integration/learningDocumentDeletionConcurrency.integration.test.ts \
  src/tests/integration/jobExecutionFence.integration.test.ts \
  src/tests/integration/resumeJobIdempotency.integration.test.ts
```

Expected: PASS. Existing expected security stderr is not a failure if the test exits green.

- [ ] **Step 2: Run feature-focused frontend regression**

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

Expected: PASS.

- [ ] **Step 3: Fix only demonstrated defects**

If a focused regression fails, apply the smallest change in the owning feature. Do not refactor unrelated modules. Re-run the exact failing command until green, then re-run Steps 1–2.

- [ ] **Step 4: Commit any regression-only correction**

Only if Step 3 changed code:

```bash
git add <only-the-files-changed-to-fix-the-demonstrated-regression>
git commit -m "fix: preserve deletion lifecycle invariants"
```

Do not create a commit if no code changed.

---

### Task 7: Full automated verification, local browser QA, and PR review gate

**Files:**
- No planned production changes.
- Update PR #18 description/comments with accepted verification evidence after results are known.

**Interfaces:**
- Consumes: all Task 1–6 commits.
- Produces: merge-readiness evidence only; does not merge or deploy.

- [ ] **Step 1: Run full backend verification**

```bash
npm --prefix backend run typecheck:all
npm --prefix backend test
npm --prefix backend run build
```

Expected: all commands exit `0`.

- [ ] **Step 2: Run full frontend verification**

```bash
npm --prefix frontend run typecheck
npm --prefix frontend test
npm --prefix frontend run build
```

Expected: all commands exit `0`.

- [ ] **Step 3: Verify repository diff hygiene**

```bash
git diff --check origin/main...HEAD
git diff --name-only origin/main...HEAD
git status --short
```

Expected:

- `git diff --check` prints nothing;
- only approved Resume/Interview/Learning source/tests/styles plus the approved spec/plan are changed;
- no package manifest, lockfile, env, migration, deployment, auth, provider, or unrelated feature file changes;
- working tree is clean.

- [ ] **Step 4: User pulls task branch and independently runs verification**

Provide the user with:

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

The user must paste the complete output. Do not call the task verified merely from GitHub edits.

- [ ] **Step 5: Perform human browser QA with the normal local dev stack running**

Required scenarios:

1. Resume Studio desktop: delete a Resume with exact-title confirmation; card disappears after success.
2. Resume wrong title: permanent button remains disabled.
3. Resume active AI job: backend `409` is shown clearly; record remains.
4. Interview active session: permanent deletion works without requiring archive.
5. Interview archived session: both Restore and Delete permanently remain distinct; deleting removes the session.
6. Interview wrong title/409 error states remain keyboard accessible.
7. Learning library: `Delete document` is visible beside `Open workspace` for deletable documents.
8. Learning library: deleting-state documents do not expose a second delete trigger.
9. Learning deletion still uses the existing async status/reconciliation flow.
10. Responsive pass at desktop, tablet, and mobile widths: destructive controls do not overlap primary Open/Restore actions.
11. Keyboard pass: open/cancel/confirm dialogs, Tab/Shift+Tab containment, Escape cancellation, and trigger focus return.

No browser use is needed before automated tests are green.

- [ ] **Step 6: Review the PR diff against the approved specification**

Check:

```text
Resume:
- 204 owner-scoped delete
- versions/analyses/assets/terminal jobs cleaned
- active AI job 409
- no unrelated asset/user deletion

Interview:
- active/completed/archived permanent delete
- attempts/questions/terminal jobs cleaned
- source Resume preserved
- Archive/Restore unchanged
- active AI job 409

Learning:
- existing backend/state machine reused
- library deletion discoverable
- no duplicate trigger while deleting
- unique dialog labelling in multi-card render

Global:
- no Trash/retention/undo/bulk framework
- no provider/auth/migration/deploy changes
- no deployment
- no branch deletion
- no Phase 19C activation
```

- [ ] **Step 7: Mark PR ready only after evidence is green**

Update PR #18 with exact test/typecheck/build/browser evidence. Keep merge as a separate explicit approval gate. Do not deploy or delete the branch.

---

## Self-Review Checklist

Before implementation begins, confirm the plan covers every approved specification requirement:

- Resume permanent route/API/UI: Task 1–2.
- Resume versions/analyses/Candidate Photo/import Assets: Task 1.
- Resume active-job block and terminal job cleanup: Task 1.
- Resume storage failure contract: Task 1 Asset helpers.
- Interview permanent route/API/UI across lifecycle states: Task 3–4.
- Interview question/attempt cleanup: Task 3.
- Interview source Resume preservation: Task 3.
- Interview active-job block and terminal job cleanup: Task 3.
- Archive/Restore preservation: Task 3–4 and Task 6.
- Learning backend reuse: Task 5.
- Learning library discoverability and duplicate-trigger prevention: Task 5.
- Accessibility, exact title confirmation, error/busy states: Task 2, 4, 5, 7.
- Ownership/IDOR protection: Task 1, 3, 6.
- No worker resurrection: Task 1, 3, 6.
- Full tests/typechecks/builds and human responsive QA: Task 7.
- No deployment/branch deletion/Phase 19C activation: Global Constraints + Task 7.

## Approval / Execution Gate

This plan is not implementation authorization by itself. Production/test source must remain unchanged until the user explicitly approves both this plan and inline execution.

Required approval phrase:

`APPROVE RECORD DELETION PLAN + INLINE EXECUTION`
