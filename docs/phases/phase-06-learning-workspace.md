# Phase 6 — Learning Workspace

Phase 6 adds private PDF learning documents, page-preserving chunks,
grounded document chat, flashcard generation, quiz generation, strict quiz
submission validation, real activity events, and cascading document
deletion.

## Runtime requirements

The requirements from Phases 2–5 still apply:

- Node.js 20 or later
- MongoDB Atlas or a local MongoDB replica set
- Gemini configured for summaries, chat, flashcards, and quizzes
- The shared background job worker enabled

Configure the Phase 6 values in `backend/.env`:

```env
LEARNING_MAX_DOCUMENT_PAGES=250
LEARNING_CHUNK_TARGET_WORDS=450
LEARNING_CHUNK_OVERLAP_WORDS=50
LEARNING_MAX_CHAT_MESSAGE_CHARACTERS=12000
LEARNING_MAX_FLASHCARDS_PER_SET=100
LEARNING_MAX_QUIZ_QUESTIONS=100
LEARNING_AI_JOB_MAX_ATTEMPTS=3
JOB_WORKER_ENABLED=true
GEMINI_API_KEY=your_key
```

Install and start:

```bash
npm install
npm run dev:api
npm run dev:web
```

Every Learning Workspace route requires:

```text
Authorization: Bearer <access-token>
```

## Collection design

The Learning Workspace uses separate MongoDB collections:

```text
LearningDocument
DocumentChunk
FlashcardSet
Flashcard
Quiz
QuizQuestion
QuizAttempt
Conversation
Message
```

Messages, chunks, flashcards, and quiz questions are not embedded in
indefinitely growing parent arrays.

`DocumentChunk` has the required unique index:

```text
{ documentId: 1, chunkIndex: 1 }
```

Quiz questions use a separate collection so answer choices and answer keys
remain bounded and individually indexable.

## Document routes

### Upload and queue PDF processing

```http
POST /api/v1/learning-documents/upload
Content-Type: multipart/form-data
```

Fields:

- `title`
- `file` — PDF only

Example:

```bash
curl -X POST http://localhost:8000/api/v1/learning-documents/upload       -H "Authorization: Bearer $ACCESS_TOKEN"       -F "title=Database Lecture Notes"       -F "file=@lecture-notes.pdf;type=application/pdf"
```

The route:

1. validates the PDF through the private Asset service;
2. stores it as a temporary private asset;
3. creates a `LearningDocument`;
4. records `learning.document.uploaded`;
5. queues `learning.document.process`;
6. returns `202 Accepted`.

Poll processing through:

```http
GET /api/v1/jobs/:jobId
```

The worker extracts text page by page, creates bounded overlapping chunks,
preserves page numbers, generates a structured summary, promotes the
temporary asset, and records `learning.document.processed`.

Scanned-image PDFs requiring OCR are not supported in this phase.

### List documents

```http
GET /api/v1/learning-documents?page=1&limit=20
```

Optional status filter:

```text
status=ready
status=processing
status=failed
```

### Fetch one owned document

```http
GET /api/v1/learning-documents/:documentId
```

### Paginate document chunks

```http
GET /api/v1/learning-documents/:documentId/chunks?page=1&limit=20
```

Chunk responses include `chunkIndex`, `pageStart`, `pageEnd`, `text`, and
`wordCount`.

### Delete a document and all dependent learning data

```http
DELETE /api/v1/learning-documents/:documentId
```

The route returns `202 Accepted` and queues a retryable cascade job.

The deletion job removes:

- the private stored asset;
- document chunks;
- conversations;
- messages;
- flashcards;
- flashcard sets;
- quiz questions;
- quizzes;
- quiz attempts;
- the LearningDocument record.

Database deletion runs in a MongoDB transaction. The job is idempotent, so
retries do not recreate or duplicate data.

## Document chat

### Create a conversation

```http
POST /api/v1/learning-documents/:documentId/conversations
```

```json
{
  "title": "Chapter 3 questions"
}
```

### List chat history

```http
GET /api/v1/learning-documents/:documentId/conversations?page=1&limit=20
```

### List messages with pagination

```http
GET /api/v1/learning-documents/:documentId/conversations/:conversationId/messages?page=1&limit=50
```

### Send a grounded question

```http
POST /api/v1/learning-documents/:documentId/conversations/:conversationId/messages
```

```json
{
  "requestId": "CLIENT_GENERATED_UUID",
  "content": "What is the difference between normalization and denormalization?"
}
```

`requestId` makes message submission and response-job creation
idempotent.

The chat worker:

1. extracts a small bounded set of search terms;
2. escapes every term before building a regular expression;
3. scopes retrieval by authenticated user and document;
4. ranks matching chunks;
5. passes only retrieved chunks and bounded recent history to the AI;
6. validates the structured answer;
7. verifies every cited chunk index;
8. stores the assistant message and page references separately.

When the document does not contain enough evidence, the AI prompt requires
an explicit limitation instead of an invented answer.

## Flashcards

### Generate a flashcard set

```http
POST /api/v1/learning-documents/:documentId/flashcard-sets
```

```json
{
  "requestId": "CLIENT_GENERATED_UUID",
  "title": "Database Fundamentals",
  "count": 20,
  "focus": "normalization, keys, and transactions"
}
```

The response contains a job ID. Poll `/api/v1/jobs/:jobId`.

Flashcard generation enforces:

- an exact requested card count;
- contiguous indexes beginning at zero;
- duplicate-front detection;
- strict structured AI output;
- valid source chunk references;
- bounded source page and chunk references;
- idempotency by `requestId`.

### List flashcard sets

```http
GET /api/v1/flashcard-sets?page=1&limit=20
```

Optional filter:

```text
documentId=LEARNING_DOCUMENT_ID
```

### Fetch one owned set

```http
GET /api/v1/flashcard-sets/:setId
```

### Paginate cards

```http
GET /api/v1/flashcard-sets/:setId/cards?page=1&limit=50
```

## Quizzes

### Generate a quiz

```http
POST /api/v1/learning-documents/:documentId/quizzes
```

```json
{
  "requestId": "CLIENT_GENERATED_UUID",
  "title": "Database Quiz",
  "questionCount": 10,
  "focus": "SQL joins and normalization"
}
```

Quiz generation enforces:

- exactly the requested number of questions;
- contiguous unique `questionIndex` values;
- a unique MongoDB index on `{ quizId, questionIndex }`;
- 2–8 unique answer choices per question;
- one valid correct answer index;
- duplicate-prompt detection;
- strict source chunk validation;
- idempotent jobs and quiz records.

### List quizzes

```http
GET /api/v1/quizzes?page=1&limit=20
```

Optional filter:

```text
documentId=LEARNING_DOCUMENT_ID
```

### Fetch a quiz for taking

```http
GET /api/v1/quizzes/:quizId
```

This route returns prompts, choices, and source pages. It deliberately does
not return:

- `correctChoiceIndex`
- `explanation`

### Submit a quiz

```http
POST /api/v1/quizzes/:quizId/attempts
```

```json
{
  "answers": [
    {
      "questionIndex": 0,
      "selectedChoiceIndex": 1
    },
    {
      "questionIndex": 1,
      "selectedChoiceIndex": 3
    }
  ]
}
```

Submission is rejected unless:

- the answer count equals the stored question count;
- every question index appears exactly once;
- no question index is duplicated;
- every expected index is present;
- every selected choice exists for its question.

Correct answers and explanations are returned only after successful
submission.

A successful attempt records the real activity event:

```text
quiz.completed
```

No artificial study streak or fabricated progress metric is created.

### Quiz-specific attempt history

```http
GET /api/v1/quizzes/:quizId/attempts?page=1&limit=20
```

### Fetch one owned attempt

```http
GET /api/v1/quizzes/:quizId/attempts/:attemptId
```

Because the attempt is already completed and ownership-checked, this response
includes the submitted choices, correct choices, explanations, and source
pages for review.

### Account-level quiz history

```http
GET /api/v1/quizzes/history?page=1&limit=20
```

Optional document filter:

```text
documentId=LEARNING_DOCUMENT_ID
```

## Ownership enforcement

All resource routes use the authenticated user ID as part of every query.

Nested resources are loaded with their parent identifier and user ID:

```text
documentId + userId
conversationId + documentId + userId
setId + userId
quizId + userId
attemptId + quizId + userId
```

An identifier owned by another account therefore returns the same not-found
response as a missing identifier.

## Frontend scaffold

```text
frontend/src/features/learning/
├── LearningDashboard.tsx
├── DocumentViewer.tsx
├── DocumentChat.tsx
├── FlashcardStudy.tsx
├── QuizTaker.tsx
├── learningApi.ts
├── learningWorkspace.css
├── types.ts
└── index.ts
```

The scaffold contains:

- a document upload entry point;
- page-aware chunk viewing;
- grounded chat layout;
- flashcard reveal and navigation;
- quiz answer selection;
- answer hiding before submission;
- post-submission review rendering;
- typed API wrappers for Phase 6 routes.

Placeholder state is intentionally isolated so the existing authentication
provider and the selected server-state library can be connected during the
production UI migration.

## Recommended end-to-end test

1. Register and obtain an access token.
2. Upload a text-based PDF.
3. Poll the processing job until it completes.
4. Fetch the document and paginate its chunks.
5. Create a conversation and ask a grounded question.
6. Poll the chat job and fetch the updated message history.
7. Generate a flashcard set and paginate its cards.
8. Generate a quiz.
9. Confirm the quiz-fetch response contains no answer keys.
10. Submit exactly one answer for every question.
11. Confirm the response now contains correctness and explanations.
12. Fetch quiz history.
13. Sign in as a second user and verify first-user IDs return 404.
14. Delete the document and confirm all dependent collections are empty.
