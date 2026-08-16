# Phase 19C — Learning Child Resource Deletion Design

## Goal

Add safe permanent deletion for saved Learning Workspace conversations, flashcard sets, and quizzes on the existing `phase-19c-learning-workspace-refinements` branch.

Controlling constraint: build the smallest secure and functional solution suitable for a university project. Reuse existing ownership, transaction, API-envelope, overflow-action, dialog, and request-ID patterns. Do not add enterprise-grade complexity unless required for correctness or security.

## Current gap

The UI can create/open conversations, flashcard sets, and quizzes, but none exposes a delete action. The backend also has no DELETE endpoint for these three child resources.

## Approaches considered

### A. Synchronous owner-scoped child deletion — selected

Add three DELETE endpoints, reject deletion while the target has an active queued/processing AI job, delete the target and its dependent records in a Mongo transaction, then return the normal API envelope.

Pros: small, deterministic, easy to test, reuses current models/ownership middleware, no new jobs or schema fields.

### B. Asynchronous deletion jobs

Mirror full Learning-document deletion with new child deletion job types and polling.

Rejected: unnecessary complexity for small child datasets that do not own files or external storage.

### C. Soft deletion / tombstones

Add deletion status fields and filter them from reads.

Rejected: requires schema changes and lifecycle semantics that are not needed for this university-project feature.

## Backend design

### Endpoints

- `DELETE /api/learning/documents/:documentId/conversations/:conversationId`
- `DELETE /api/learning/flashcard-sets/:setId`
- `DELETE /api/learning/quizzes/:quizId`

Existing authentication, parameter validation, and ownership middleware remain authoritative.

### Busy-resource fence

Before deleting, query the existing durable job records for the authenticated user and target resource:

- conversation: `learning.chat.respond` with matching `payload.conversationId`;
- flashcard set: `learning.flashcards.generate` with matching `payload.setId`;
- quiz: `learning.quiz.generate` with matching `payload.quizId`.

If a matching job is `queued` or `processing`, return HTTP 409 with a safe non-retryable application error. This prevents late workers from persisting into a deleted resource. The user can wait for completion or cancel the active generation first.

### Cascades

Use the existing Mongo transaction helper.

Conversation deletion:
1. delete owned `Message` records for the conversation;
2. delete the owned `Conversation`.

Flashcard-set deletion:
1. delete owned `Flashcard` records for the set;
2. delete the owned `FlashcardSet`.

Quiz deletion:
1. delete owned `QuizAttempt` records for the quiz;
2. delete owned `QuizQuestion` records for the quiz;
3. delete the owned `Quiz`.

Every delete filter includes `userId`; parent deletion must delete exactly one record or the transaction fails.

No Mongo schema migration is required.

### Response

Return HTTP 200 using the existing envelope:

```json
{
  "success": true,
  "data": {
    "deleted": true,
    "id": "..."
  }
}
```

The endpoint remains idempotent only through the existing ownership/not-found behavior; a second delete returns the normal 404 rather than pretending the record still exists.

## Frontend design

### Placement

Reuse `CardOverflowActions` so primary actions stay uncluttered:

- conversation row: `Open conversation` remains primary; overflow contains `Delete conversation`;
- flashcard-set card: `Study set` remains primary; overflow contains `Delete flashcard set`;
- quiz card: `Take quiz` remains primary; overflow contains `Delete quiz`.

### Confirmation

Use one reusable Learning child-resource confirmation dialog. It names the resource and explains what is permanently removed.

- Conversation: deletes the conversation and all messages.
- Flashcard set: deletes the set and all cards.
- Quiz: deletes the quiz, questions, and saved attempts.

A normal explicit `Cancel` / destructive `Delete` confirmation is sufficient; exact-title typing is reserved for higher-impact top-level document deletion.

### Success and failure

On confirmed success, remove/refresh the affected list using the current list-loading path. Do not navigate away from the document workspace.

On failure, keep the resource visible. Show the safe error message and Request ID when available. A 409 busy response explains that active AI work must finish or be cancelled first.

For flashcard sets/quizzes visibly in `generating` state, the delete action is disabled in the UI. The backend busy fence remains authoritative.

## Security and race handling

- authentication required;
- existing ownership middleware prevents IDOR;
- all cascade filters include `userId`;
- active durable AI jobs block deletion;
- no provider/Gemini changes;
- no polling/retry/idempotency changes;
- no new storage behavior;
- no schema migration;
- no SSE/WebSockets;
- no unrelated refactor.

## Verification

Backend:
- owner can delete each child resource and its dependents;
- foreign/nonexistent resource returns canonical 404;
- active queued/processing AI job returns 409 and deletes nothing;
- cascade is transactional and user-scoped.

Frontend:
- overflow delete action exists for all three resource types;
- primary Open/Study/Take actions remain unchanged;
- confirmation dialog describes the correct cascade;
- cancel performs no delete;
- success removes/refetches the item;
- failure keeps it visible and surfaces Request ID when available;
- generating flashcard/quiz delete is disabled;
- keyboard/focus behavior remains accessible.

Full Phase 19C qualification remains required before merge.
