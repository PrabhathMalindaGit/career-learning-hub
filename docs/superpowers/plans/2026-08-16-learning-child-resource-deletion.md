# Learning Child Resource Deletion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add safe permanent deletion for Learning Workspace conversations, flashcard sets, and quizzes while preserving ownership, durable-job safety, and existing Phase 19C UI patterns.

**Architecture:** Add one focused backend deletion service that performs resource-specific busy-job checks and transactional cascades, expose it through the existing Learning routes/controllers and ownership middleware, then add three frontend DELETE API calls plus one reusable confirmation dialog used by the existing conversation/flashcard/quiz list components. Deletion remains synchronous because these child resources do not own files or external storage; active queued/processing AI work returns 409 so late workers cannot recreate deleted data.

**Tech Stack:** Express 5, TypeScript 5.8, Mongoose 8 transactions, Vitest 3 backend, Supertest, React 19, React Router 7, Vitest 4 frontend, Testing Library.

## Global Constraints

- Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.
- Work only on `phase-19c-learning-workspace-refinements` / PR #25.
- Reuse existing authentication and ownership middleware; every destructive persistence filter also includes `userId`.
- No Mongo schema migration.
- No new deletion job types, worker handlers, queues, SSE, WebSockets, provider changes, Gemini changes, polling changes, retry changes, or idempotency redesign.
- Conversation delete removes the conversation and its messages.
- Flashcard-set delete removes the set and its cards.
- Quiz delete removes the quiz, its questions, and all saved attempts.
- A queued or processing AI job for the exact target resource blocks deletion with HTTP 409 and deletes nothing.
- A second delete after success uses the existing canonical 404 ownership/not-found behavior.
- Frontend primary actions (`Open conversation`, `Study set`, `Take quiz`) stay unchanged.
- Frontend delete actions use the existing `CardOverflowActions` pattern and one reusable confirmation dialog.
- Generating flashcard sets and quizzes expose a disabled delete action; backend busy checking remains authoritative.
- On frontend delete failure, keep the resource visible and show the safe error message plus Request ID when available.
- Do not merge, deploy, or delete the branch without the user's separate explicit approval.

---

## File Structure

### Backend

- **Create:** `backend/src/modules/learning/learningChildDeletion.service.ts`
  - Owns active-job lookup and all three transactional child-resource cascades.
  - Keeps destructive persistence logic out of already-large chat/assessment services.
- **Modify:** `backend/src/modules/learning/learning.controller.ts`
  - Adds three thin HTTP 200 controllers that call the deletion service and serialize the common envelope.
- **Modify:** `backend/src/modules/learning/learningDocument.routes.ts`
  - Adds owner-scoped conversation DELETE route.
- **Modify:** `backend/src/modules/learning/flashcard.routes.ts`
  - Adds owner-scoped flashcard-set DELETE route.
- **Modify:** `backend/src/modules/learning/quiz.routes.ts`
  - Adds owner-scoped quiz DELETE route.
- **Create:** `backend/src/tests/integration/learningChildDeletion.integration.test.ts`
  - Covers successful cascades, 404/IDOR behavior, and active-job 409 fences for all three resource types.

### Frontend

- **Modify:** `frontend/src/features/learning/learningApi.ts`
  - Adds `deleteLearningConversation`, `deleteFlashcardSet`, and `deleteQuiz` API functions with strict HTTP 200 handling.
- **Create:** `frontend/src/features/learning/LearningChildDeleteDialog.tsx`
  - Shared accessible confirmation dialog and failure surface.
- **Create:** `frontend/src/features/learning/LearningChildDeleteDialog.test.tsx`
  - Locks confirm/cancel/failure/focus behavior.
- **Modify:** `frontend/src/features/learning/DocumentConversations.tsx`
  - Adds per-row overflow action and deletion refresh.
- **Modify:** `frontend/src/features/learning/DocumentConversations.test.tsx`
  - Covers visible action, confirmation, success, cancel, and failure retention.
- **Modify:** `frontend/src/features/learning/DocumentFlashcards.tsx`
  - Adds per-card overflow action; disables deletion for `generating`; refreshes canonical list on success.
- **Modify:** `frontend/src/features/learning/DocumentFlashcards.test.tsx`
  - Covers ready/failed deletable states, generating disabled state, success, and failure.
- **Modify:** `frontend/src/features/learning/DocumentQuizzes.tsx`
  - Adds per-card overflow action; disables deletion for `generating`; refreshes canonical list on success.
- **Modify:** `frontend/src/features/learning/DocumentQuizzes.test.tsx`
  - Covers ready/failed deletable states, generating disabled state, success, and failure.
- **Modify only if spacing is required:** `frontend/src/features/learning/learningPhase19c.css`
  - Adds bounded layout rules for card/list overflow actions; no new visual system.
- **Modify:** `frontend/src/features/learning/learningPhase19c.test.ts`
  - Adds cross-cutting source contract assertions that all three collection views expose the shared delete pattern.

---

### Task 1: Backend deletion core and busy-job fence

**Files:**
- Create: `backend/src/modules/learning/learningChildDeletion.service.ts`
- Test: `backend/src/tests/integration/learningChildDeletion.integration.test.ts`

**Interfaces:**
- Consumes: `JobRecordModel`, `withMongoTransaction`, `AppError`, `ConversationModel`, `MessageModel`, `FlashcardSetModel`, `FlashcardModel`, `QuizModel`, `QuizQuestionModel`, `QuizAttemptModel`.
- Produces:
  - `deleteLearningConversation(input: { userId: string; documentId: string; conversationId: string }): Promise<{ id: string; deleted: true }>`
  - `deleteLearningFlashcardSet(input: { userId: string; setId: string }): Promise<{ id: string; deleted: true }>`
  - `deleteLearningQuiz(input: { userId: string; quizId: string }): Promise<{ id: string; deleted: true }>`

- [ ] **Step 1: Write failing integration fixtures for the three cascades**

Create `backend/src/tests/integration/learningChildDeletion.integration.test.ts` using the existing `app`, Mongo-memory test setup, and auth helper pattern. Seed one owner and one foreign user plus:

```ts
const conversation = await ConversationModel.create({
  userId: ownerId,
  documentId,
  title: "Delete me",
  messageCount: 2,
});
await MessageModel.create([
  { userId: ownerId, documentId, conversationId: conversation._id, role: "user", content: "Q", sourceChunkIds: [], sourcePages: [] },
  { userId: ownerId, documentId, conversationId: conversation._id, role: "assistant", content: "A", sourceChunkIds: [], sourcePages: [] },
]);

const set = await FlashcardSetModel.create({
  userId: ownerId,
  documentId,
  requestId: crypto.randomUUID(),
  title: "Delete cards",
  status: "ready",
  cardCount: 1,
});
await FlashcardModel.create({
  userId: ownerId,
  documentId,
  setId: set._id,
  cardIndex: 0,
  front: "Front",
  back: "Back",
  sourceChunkIds: [],
  sourcePages: [],
});

const quiz = await QuizModel.create({
  userId: ownerId,
  documentId,
  requestId: crypto.randomUUID(),
  title: "Delete quiz",
  status: "ready",
  questionCount: 1,
});
```

Seed one `QuizQuestionModel` and one `QuizAttemptModel` using the exact required fields already used by `learningDocumentDeletionConcurrency.integration.test.ts`.

Assert after service/HTTP deletion that the parent and all dependents are absent, while an unrelated sibling owned by the same user remains.

- [ ] **Step 2: Run the new integration file and verify RED**

Run:

```bash
npm --prefix backend test -- src/tests/integration/learningChildDeletion.integration.test.ts
```

Expected: FAIL because the deletion service/routes do not exist yet.

- [ ] **Step 3: Implement the common active-job fence**

In `learningChildDeletion.service.ts`, add:

```ts
async function assertNoActiveChildJob(input: {
  userId: string;
  type: "learning.chat.respond" | "learning.flashcards.generate" | "learning.quiz.generate";
  payloadKey: "conversationId" | "setId" | "quizId";
  resourceId: string;
  code: "LEARNING_CONVERSATION_BUSY" | "FLASHCARD_SET_BUSY" | "QUIZ_BUSY";
  message: string;
}): Promise<void> {
  const active = await JobRecordModel.exists({
    userId: input.userId,
    type: input.type,
    status: { $in: ["queued", "processing"] },
    [`payload.${input.payloadKey}`]: input.resourceId,
  });

  if (active) {
    throw new AppError(409, input.code, input.message, undefined, false);
  }
}
```

Use resource-specific messages:

```ts
"Wait for the current chat response to finish or cancel it before deleting this conversation."
"Wait for flashcard generation to finish or cancel it before deleting this set."
"Wait for quiz generation to finish or cancel it before deleting this quiz."
```

- [ ] **Step 4: Implement conversation transactional deletion**

```ts
export async function deleteLearningConversation(input: {
  userId: string;
  documentId: string;
  conversationId: string;
}) {
  await assertNoActiveChildJob({
    userId: input.userId,
    type: "learning.chat.respond",
    payloadKey: "conversationId",
    resourceId: input.conversationId,
    code: "LEARNING_CONVERSATION_BUSY",
    message: "Wait for the current chat response to finish or cancel it before deleting this conversation.",
  });

  return withMongoTransaction(async (session) => {
    await MessageModel.deleteMany({
      userId: input.userId,
      documentId: input.documentId,
      conversationId: input.conversationId,
    }).session(session);

    const deleted = await ConversationModel.deleteOne({
      _id: input.conversationId,
      userId: input.userId,
      documentId: input.documentId,
    }).session(session);

    if (deleted.deletedCount !== 1) {
      throw new AppError(404, "LEARNING_CONVERSATION_NOT_FOUND", "Learning conversation not found.");
    }

    return { id: input.conversationId, deleted: true as const };
  });
}
```

- [ ] **Step 5: Implement flashcard-set transactional deletion**

```ts
export async function deleteLearningFlashcardSet(input: {
  userId: string;
  setId: string;
}) {
  await assertNoActiveChildJob({
    userId: input.userId,
    type: "learning.flashcards.generate",
    payloadKey: "setId",
    resourceId: input.setId,
    code: "FLASHCARD_SET_BUSY",
    message: "Wait for flashcard generation to finish or cancel it before deleting this set.",
  });

  return withMongoTransaction(async (session) => {
    await FlashcardModel.deleteMany({ userId: input.userId, setId: input.setId }).session(session);
    const deleted = await FlashcardSetModel.deleteOne({ _id: input.setId, userId: input.userId }).session(session);
    if (deleted.deletedCount !== 1) {
      throw new AppError(404, "FLASHCARD_SET_NOT_FOUND", "Flashcard set not found.");
    }
    return { id: input.setId, deleted: true as const };
  });
}
```

- [ ] **Step 6: Implement quiz transactional deletion**

```ts
export async function deleteLearningQuiz(input: {
  userId: string;
  quizId: string;
}) {
  await assertNoActiveChildJob({
    userId: input.userId,
    type: "learning.quiz.generate",
    payloadKey: "quizId",
    resourceId: input.quizId,
    code: "QUIZ_BUSY",
    message: "Wait for quiz generation to finish or cancel it before deleting this quiz.",
  });

  return withMongoTransaction(async (session) => {
    await QuizAttemptModel.deleteMany({ userId: input.userId, quizId: input.quizId }).session(session);
    await QuizQuestionModel.deleteMany({ userId: input.userId, quizId: input.quizId }).session(session);
    const deleted = await QuizModel.deleteOne({ _id: input.quizId, userId: input.userId }).session(session);
    if (deleted.deletedCount !== 1) {
      throw new AppError(404, "QUIZ_NOT_FOUND", "Quiz not found.");
    }
    return { id: input.quizId, deleted: true as const };
  });
}
```

- [ ] **Step 7: Add active-job RED/GREEN assertions**

Create queued and processing `JobRecordModel` fixtures with the exact child ID in payload. For each resource assert:

```ts
expect(response.status).toBe(409);
expect(response.body.success).toBe(false);
expect(response.body.error.code).toBe("FLASHCARD_SET_BUSY"); // analogous conversation/quiz codes
expect(await FlashcardSetModel.exists({ _id: set._id })).toBeTruthy();
expect(await FlashcardModel.countDocuments({ setId: set._id })).toBe(1);
```

Also seed a completed job for the same child and prove completed jobs do not block deletion.

- [ ] **Step 8: Run backend integration file until GREEN**

```bash
npm --prefix backend test -- src/tests/integration/learningChildDeletion.integration.test.ts
```

Expected: all tests PASS.

- [ ] **Step 9: Commit Task 1**

```bash
git add backend/src/modules/learning/learningChildDeletion.service.ts \
  backend/src/tests/integration/learningChildDeletion.integration.test.ts
git commit -m "feat: add learning child deletion core"
```

---

### Task 2: Expose owner-scoped DELETE endpoints

**Files:**
- Modify: `backend/src/modules/learning/learning.controller.ts`
- Modify: `backend/src/modules/learning/learningDocument.routes.ts`
- Modify: `backend/src/modules/learning/flashcard.routes.ts`
- Modify: `backend/src/modules/learning/quiz.routes.ts`
- Test: `backend/src/tests/integration/learningChildDeletion.integration.test.ts`

**Interfaces:**
- Consumes Task 1 service functions.
- Produces:
  - `DELETE /api/learning-documents/:documentId/conversations/:conversationId`
  - `DELETE /api/flashcard-sets/:setId`
  - `DELETE /api/quizzes/:quizId`
  - HTTP 200 body `{ success: true, data: { deleted: true, id: string } }`.

- [ ] **Step 1: Add route-level failing tests**

For each endpoint, assert unauthenticated requests remain 401 and a foreign user's resource returns the existing 404 ownership error. For the owner assert exact success envelope:

```ts
expect(response.status).toBe(200);
expect(response.body).toEqual({
  success: true,
  data: { deleted: true, id: resourceId },
});
```

- [ ] **Step 2: Run the integration file and verify route tests are RED**

```bash
npm --prefix backend test -- src/tests/integration/learningChildDeletion.integration.test.ts
```

Expected: endpoint tests FAIL with 404/route-not-found.

- [ ] **Step 3: Add thin controllers**

Import the Task 1 functions into `learning.controller.ts` and add:

```ts
export async function deleteConversationController(request: Request, response: Response): Promise<void> {
  const result = await deleteLearningConversation({
    userId: request.auth!.userId,
    documentId: request.learningDocument!._id.toString(),
    conversationId: request.learningConversation!._id.toString(),
  });
  response.status(200).json({ success: true, data: result });
}

export async function deleteFlashcardSetController(request: Request, response: Response): Promise<void> {
  const result = await deleteLearningFlashcardSet({
    userId: request.auth!.userId,
    setId: request.flashcardSet!._id.toString(),
  });
  response.status(200).json({ success: true, data: result });
}

export async function deleteQuizController(request: Request, response: Response): Promise<void> {
  const result = await deleteLearningQuiz({
    userId: request.auth!.userId,
    quizId: request.learningQuiz!._id.toString(),
  });
  response.status(200).json({ success: true, data: result });
}
```

- [ ] **Step 4: Wire routes using existing validation and ownership middleware**

Conversation route in `learningDocument.routes.ts`:

```ts
learningDocumentRouter.delete(
  "/:documentId/conversations/:conversationId",
  validate({ params: conversationParamsSchema }),
  requireOwnedLearningDocument,
  requireOwnedConversation,
  asyncHandler(deleteConversationController),
);
```

Flashcard route in `flashcard.routes.ts`:

```ts
flashcardSetRouter.delete(
  "/:setId",
  validate({ params: flashcardSetParamsSchema }),
  requireOwnedFlashcardSet,
  asyncHandler(deleteFlashcardSetController),
);
```

Quiz route in `quiz.routes.ts`:

```ts
quizRouter.delete(
  "/:quizId",
  validate({ params: quizParamsSchema }),
  requireOwnedQuiz,
  asyncHandler(deleteQuizController),
);
```

- [ ] **Step 5: Verify route tests GREEN and backend typecheck**

```bash
npm --prefix backend test -- src/tests/integration/learningChildDeletion.integration.test.ts
npm --prefix backend run typecheck:all
```

Expected: PASS / exit 0.

- [ ] **Step 6: Commit Task 2**

```bash
git add backend/src/modules/learning/learning.controller.ts \
  backend/src/modules/learning/learningDocument.routes.ts \
  backend/src/modules/learning/flashcard.routes.ts \
  backend/src/modules/learning/quiz.routes.ts \
  backend/src/tests/integration/learningChildDeletion.integration.test.ts
git commit -m "feat: expose learning child delete endpoints"
```

---

### Task 3: Frontend DELETE API and reusable confirmation dialog

**Files:**
- Modify: `frontend/src/features/learning/learningApi.ts`
- Create: `frontend/src/features/learning/LearningChildDeleteDialog.tsx`
- Create: `frontend/src/features/learning/LearningChildDeleteDialog.test.tsx`

**Interfaces:**
- Produces:
  - `deleteLearningConversation(documentId: string, conversationId: string, signal?: AbortSignal): Promise<{ id: string; deleted: true; requestId?: string }>`
  - `deleteFlashcardSet(setId: string, signal?: AbortSignal): Promise<{ id: string; deleted: true; requestId?: string }>`
  - `deleteQuiz(quizId: string, signal?: AbortSignal): Promise<{ id: string; deleted: true; requestId?: string }>`
  - `LearningChildDeleteDialog` props:

```ts
type LearningChildDeleteDialogProps = {
  open: boolean;
  resourceKind: "conversation" | "flashcard-set" | "quiz";
  resourceTitle: string;
  deleting: boolean;
  error?: { message: string; requestId?: string };
  onCancel(): void;
  onConfirm(): void;
};
```

- [ ] **Step 1: Write failing dialog tests**

Cover:

```ts
expect(screen.getByRole("heading", { name: "Delete conversation?" })).toBeVisible();
expect(screen.getByText(/all messages/i)).toBeVisible();
await user.click(screen.getByRole("button", { name: "Cancel" }));
expect(onCancel).toHaveBeenCalledTimes(1);
await user.click(screen.getByRole("button", { name: "Delete conversation" }));
expect(onConfirm).toHaveBeenCalledTimes(1);
```

For `flashcard-set`, assert copy includes `all cards`; for `quiz`, assert `questions and saved attempts`. When `deleting=true`, destructive button reads `Deleting…` and both close paths that could cause duplicate submission are disabled/guarded. Failure test asserts message and `Request ID: req-123` remain inside the dialog.

- [ ] **Step 2: Run dialog tests and verify RED**

```bash
npm --prefix frontend test -- src/features/learning/LearningChildDeleteDialog.test.tsx
```

Expected: FAIL because component does not exist.

- [ ] **Step 3: Add strict DELETE API helper functions**

Use `requestWithStatusMetadata<unknown>` and a local parser that accepts only:

```ts
function parseDeletionResponse(value: unknown, expectedId: string) {
  if (
    typeof value !== "object" || value === null ||
    !("deleted" in value) || value.deleted !== true ||
    !("id" in value) || value.id !== expectedId
  ) {
    throw new ApiError(502, "INVALID_LEARNING_RESPONSE", "The server returned an invalid learning response.");
  }
  return { deleted: true as const, id: expectedId };
}
```

Each function must require HTTP 200; otherwise throw `INVALID_LEARNING_RESPONSE` with response Request ID.

- [ ] **Step 4: Implement reusable dialog**

Use native `<dialog>` consistent with `LearningDocumentDeletion`, focus the Cancel button or heading on open, close on Escape only when not deleting, and return focus through the caller's overflow trigger lifecycle. Copy map:

```ts
const copy = {
  conversation: {
    heading: "Delete conversation?",
    confirm: "Delete conversation",
    detail: "This permanently deletes this conversation and all messages in it.",
  },
  "flashcard-set": {
    heading: "Delete flashcard set?",
    confirm: "Delete flashcard set",
    detail: "This permanently deletes this flashcard set and all cards in it.",
  },
  quiz: {
    heading: "Delete quiz?",
    confirm: "Delete quiz",
    detail: "This permanently deletes this quiz, its questions, and all saved attempts.",
  },
} as const;
```

- [ ] **Step 5: Run dialog tests and frontend typecheck**

```bash
npm --prefix frontend test -- src/features/learning/LearningChildDeleteDialog.test.tsx
npm --prefix frontend run typecheck
```

Expected: PASS / exit 0.

- [ ] **Step 6: Commit Task 3**

```bash
git add frontend/src/features/learning/learningApi.ts \
  frontend/src/features/learning/LearningChildDeleteDialog.tsx \
  frontend/src/features/learning/LearningChildDeleteDialog.test.tsx
git commit -m "feat: add learning child delete client flow"
```

---

### Task 4: Conversation deletion UI

**Files:**
- Modify: `frontend/src/features/learning/DocumentConversations.tsx`
- Modify: `frontend/src/features/learning/DocumentConversations.test.tsx`
- Modify only if needed: `frontend/src/features/learning/learningPhase19c.css`

**Interfaces:**
- Consumes `CardOverflowActions`, `LearningChildDeleteDialog`, `deleteLearningConversation`.
- Produces per-conversation `⋯` action with `Delete conversation` and list refresh after canonical success.

- [ ] **Step 1: Add failing UI tests**

Mock `deleteLearningConversation`. Assert each conversation row retains `Open conversation` and exposes:

```ts
const actions = screen.getByRole("button", { name: "More actions for Test 1" });
await user.click(actions);
expect(screen.getByRole("button", { name: "Delete conversation" })).toBeVisible();
```

Confirm opens the shared dialog. Cancel does not call the API. Success calls:

```ts
expect(deleteLearningConversation).toHaveBeenCalledWith(document.id, conversation.id, expect.any(AbortSignal));
```

and then causes the list loader to run again so the deleted row disappears from canonical mocked results. Failure keeps the row visible and shows `ApiError` message + Request ID.

- [ ] **Step 2: Run conversation tests and verify RED**

```bash
npm --prefix frontend test -- src/features/learning/DocumentConversations.test.tsx
```

- [ ] **Step 3: Add deletion state with abort/identity safety**

Add state:

```ts
const [deleteTarget, setDeleteTarget] = useState<LearningConversation>();
const [deleteError, setDeleteError] = useState<SafeError>();
const [deleting, setDeleting] = useState(false);
const [openActionsId, setOpenActionsId] = useState<string>();
const deleteController = useRef<AbortController>();
```

On account/document identity change and unmount: abort any active deletion, clear target/error/action state.

- [ ] **Step 4: Add overflow action without replacing primary navigation**

Wrap row actions in a small action group:

```tsx
<Link className="learning-document-link" ...>Open conversation</Link>
<CardOverflowActions
  ariaLabel={`More actions for ${conversation.title}`}
  open={openActionsId === conversation.id}
  onOpenChange={(open) => setOpenActionsId(open ? conversation.id : undefined)}
  actions={[{
    id: "delete-conversation",
    label: "Delete conversation",
    destructive: true,
    onSelect: () => {
      setDeleteError(undefined);
      setDeleteTarget(conversation);
    },
  }]}
/>
```

- [ ] **Step 5: Implement confirm handler**

```ts
async function confirmDeleteConversation() {
  if (!deleteTarget || deleting) return;
  const controller = new AbortController();
  deleteController.current?.abort();
  deleteController.current = controller;
  setDeleting(true);
  setDeleteError(undefined);
  try {
    await deleteLearningConversation(document.id, deleteTarget.id, controller.signal);
    if (controller.signal.aborted) return;
    setDeleteTarget(undefined);
    setRetryVersion((current) => current + 1);
  } catch (error) {
    if (!controller.signal.aborted) {
      setDeleteError(safeError(error, "Conversation could not be deleted."));
    }
  } finally {
    if (deleteController.current === controller) {
      deleteController.current = undefined;
      setDeleting(false);
    }
  }
}
```

Render `LearningChildDeleteDialog` once at component root.

- [ ] **Step 6: Run conversation tests until GREEN**

```bash
npm --prefix frontend test -- src/features/learning/DocumentConversations.test.tsx src/features/learning/LearningChildDeleteDialog.test.tsx
```

- [ ] **Step 7: Commit Task 4**

```bash
git add frontend/src/features/learning/DocumentConversations.tsx \
  frontend/src/features/learning/DocumentConversations.test.tsx \
  frontend/src/features/learning/learningPhase19c.css
git commit -m "feat: add conversation deletion controls"
```

If `learningPhase19c.css` did not change, omit it from `git add`.

---

### Task 5: Flashcard-set and quiz deletion UI

**Files:**
- Modify: `frontend/src/features/learning/DocumentFlashcards.tsx`
- Modify: `frontend/src/features/learning/DocumentFlashcards.test.tsx`
- Modify: `frontend/src/features/learning/DocumentQuizzes.tsx`
- Modify: `frontend/src/features/learning/DocumentQuizzes.test.tsx`
- Modify: `frontend/src/features/learning/learningPhase19c.test.ts`
- Modify only if needed: `frontend/src/features/learning/learningPhase19c.css`

**Interfaces:**
- Consumes shared Task 3 dialog/API and `CardOverflowActions`.
- Produces `Delete flashcard set` / `Delete quiz` overflow actions with generating-state disablement and canonical list refresh.

- [ ] **Step 1: Add failing flashcard tests**

For a ready set:

```ts
await user.click(screen.getByRole("button", { name: "More actions for Ready set" }));
expect(screen.getByRole("button", { name: "Delete flashcard set" })).toBeEnabled();
```

For a generating set:

```ts
await user.click(screen.getByRole("button", { name: "More actions for Generating set" }));
expect(screen.getByRole("button", { name: "Delete flashcard set" })).toBeDisabled();
```

Success refetches and removes the set. Failure retains the set and surfaces Request ID.

- [ ] **Step 2: Add failing quiz tests**

Mirror the flashcard assertions using `Delete quiz`; ensure `Take quiz` remains present for ready quizzes and all saved attempts are described in confirmation copy.

- [ ] **Step 3: Run both component suites and verify RED**

```bash
npm --prefix frontend test -- \
  src/features/learning/DocumentFlashcards.test.tsx \
  src/features/learning/DocumentQuizzes.test.tsx
```

- [ ] **Step 4: Add flashcard delete state and action**

Use the same state pattern as Task 4. `CardOverflowActions.actions[0].disabled` must be:

```ts
disabled: set.status === "generating" || deleting
```

On success:

```ts
setDeleteTarget(undefined);
setListVersion((current) => current + 1);
```

Do not alter `pendingJob`, generation cancellation, retry, or navigation behavior.

- [ ] **Step 5: Add quiz delete state and action**

Use:

```ts
disabled: quiz.status === "generating" || deleting
```

On success increment the existing quiz `listVersion`; do not alter quiz generation/polling/submission behavior.

- [ ] **Step 6: Add cross-cutting Phase 19C source contract**

Update `learningPhase19c.test.ts` to assert source files contain the shared overflow/delete language:

```ts
expect(source("DocumentConversations.tsx")).toContain("Delete conversation");
expect(source("DocumentFlashcards.tsx")).toContain("Delete flashcard set");
expect(source("DocumentQuizzes.tsx")).toContain("Delete quiz");
expect(source("DocumentFlashcards.tsx")).toContain('set.status === "generating"');
expect(source("DocumentQuizzes.tsx")).toContain('quiz.status === "generating"');
```

- [ ] **Step 7: Run focused frontend deletion suite until GREEN**

```bash
npm --prefix frontend test -- \
  src/features/learning/LearningChildDeleteDialog.test.tsx \
  src/features/learning/DocumentConversations.test.tsx \
  src/features/learning/DocumentFlashcards.test.tsx \
  src/features/learning/DocumentQuizzes.test.tsx \
  src/features/learning/learningPhase19c.test.ts
```

- [ ] **Step 8: Commit Task 5**

```bash
git add frontend/src/features/learning/DocumentFlashcards.tsx \
  frontend/src/features/learning/DocumentFlashcards.test.tsx \
  frontend/src/features/learning/DocumentQuizzes.tsx \
  frontend/src/features/learning/DocumentQuizzes.test.tsx \
  frontend/src/features/learning/learningPhase19c.test.ts \
  frontend/src/features/learning/learningPhase19c.css
git commit -m "feat: add study resource deletion controls"
```

If `learningPhase19c.css` did not change, omit it.

---

### Task 6: Qualification and PR audit

**Files:**
- No new product files unless a test exposes a defect.
- Update PR #25 description only after final implementation is stable.

**Interfaces:**
- Produces final evidence tied to one exact PR head SHA.

- [ ] **Step 1: Run focused backend deletion integration**

```bash
npm --prefix backend test -- src/tests/integration/learningChildDeletion.integration.test.ts
echo "LEARNING_CHILD_DELETE_BACKEND_EXIT=$?"
```

Expected: exit 0.

- [ ] **Step 2: Run backend typecheck, build, diff check, and full regression**

```bash
npm --prefix backend run typecheck:all
echo "BACKEND_TYPECHECK_EXIT=$?"

npm --prefix backend run build
echo "BACKEND_BUILD_EXIT=$?"

npm --prefix backend test
echo "BACKEND_FULL_EXIT=$?"
```

Expected: all exit 0.

- [ ] **Step 3: Run focused frontend deletion/Phase 19C suite**

```bash
npm --prefix frontend test -- \
  src/features/learning/LearningChildDeleteDialog.test.tsx \
  src/features/learning/DocumentConversations.test.tsx \
  src/features/learning/DocumentFlashcards.test.tsx \
  src/features/learning/DocumentQuizzes.test.tsx \
  src/features/learning/learningPhase19c.test.ts
echo "LEARNING_CHILD_DELETE_FRONTEND_EXIT=$?"
```

Expected: exit 0.

- [ ] **Step 4: Run frontend typecheck/build/full regression and repository diff check**

```bash
npm --prefix frontend run typecheck
echo "FRONTEND_TYPECHECK_EXIT=$?"

npm --prefix frontend run build
echo "FRONTEND_BUILD_EXIT=$?"

npm --prefix frontend test
echo "FRONTEND_FULL_EXIT=$?"

git diff --check origin/main...HEAD
echo "DIFF_CHECK_EXIT=$?"
```

Expected: all exit 0.

- [ ] **Step 5: Browser QA on the exact qualified head**

Verify with real local data:

1. Grounded Chat list: overflow → Delete conversation → Cancel preserves it; confirm removes it and all its messages are no longer reachable.
2. Flashcards: ready/failed set can be deleted; generating set delete is disabled; success removes the card without leaving the document workspace.
3. Quizzes: ready/failed quiz can be deleted; generating quiz delete is disabled; after deletion its saved attempt history is no longer reachable.
4. Force or observe one busy-resource case if practical: deletion returns user-facing 409 guidance and leaves the item intact.
5. Confirm normal create/open/study/take flows still work.
6. Confirm desktop and narrow layouts keep `⋯` controls reachable and do not crowd primary actions.

- [ ] **Step 6: Audit exact diff scope**

Confirm no changes outside:

```text
backend/src/modules/learning/*
backend/src/tests/integration/learningChildDeletion.integration.test.ts
frontend/src/features/learning/*
docs/superpowers/specs/*
docs/superpowers/plans/*
```

No schema/provider/Gemini/worker architecture files should change. `job.queue.ts` and `job.model.ts` are read-only dependencies for this feature.

- [ ] **Step 7: Update PR #25 body with final deletion behavior and evidence requirements**

Record:

```text
Learning child deletion follow-up:
- owner-scoped synchronous DELETE for conversations, flashcard sets, and quizzes;
- transactional dependent-record cascades;
- queued/processing target AI jobs block deletion with 409;
- shared overflow + confirmation UI;
- no schema migration, new deletion jobs, Gemini/provider changes, or polling changes.
```

Keep PR draft until user local/browser qualification passes.

---

## Self-Review

### Spec coverage

- Three DELETE endpoints: Task 2.
- Existing auth/ownership: Task 2 route middleware + Task 6 IDOR regression.
- Busy queued/processing job fence: Task 1.
- Conversation/message cascade: Task 1.
- Flashcard-set/card cascade: Task 1.
- Quiz/question/attempt cascade: Task 1.
- Transactional and user-scoped filters: Task 1.
- Existing success envelope: Task 2.
- Shared overflow/confirmation UI: Tasks 3–5.
- No title typing for child deletes: Task 3 dialog.
- Failure keeps resource visible + Request ID: Tasks 3–5.
- Generating resource delete disabled: Task 5.
- No schema/provider/job architecture expansion: Global Constraints + Task 6 audit.
- Full backend/frontend/browser qualification: Task 6.

### Placeholder scan

No `TBD`, `TODO`, "implement later", undefined interface, or unspecified error-handling step remains.

### Type consistency

The three backend service return types, controller envelopes, frontend parser shape, and component success handlers all use `{ id: string; deleted: true }`. The resource-kind union is consistently `"conversation" | "flashcard-set" | "quiz"`.
